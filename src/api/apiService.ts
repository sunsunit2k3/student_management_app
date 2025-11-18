import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '../types/api';
import { useLoadingStore } from '../stores/useLoadingStore';

const URL_API = import.meta.env.VITE_BASE_URL_BE;

class ApiService {
  private api: AxiosInstance;
  private activeRequests = 0;
  private loadingTimer: ReturnType<typeof setTimeout> | undefined;

  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.api = axios.create({
      baseURL: URL_API,
      withCredentials: true,
    });

    this.initializeInterceptors();
  }

  /** ================= Interceptors ================= */
  private initializeInterceptors() {
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig & { skipLoading?: boolean }) => {
        const raw = localStorage.getItem('auth-storage');
        if (raw) {
          try {
            const { state } = JSON.parse(raw);
            if (state?.accessToken) {
              config.headers = config.headers || {};
              (config.headers as any).Authorization = `Bearer ${state.accessToken}`;
            }
          } catch {}
        }

        if (!config.skipLoading) this.startRequest();
        return config;
      },
      (error) => {
        this.endRequest();
        return Promise.reject(error);
      }
    );

    /** RESPONSE INTERCEPTOR */
    this.api.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<any>>) => {
        if (!response.config.skipLoading) this.endRequest();

        const resp = response.data;
        if (resp.code !== 0 && resp.code !== undefined) {
          return Promise.reject(resp);
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        if (!originalRequest?.skipLoading) this.endRequest();

        // Nếu lỗi 401 → refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (!this.isRefreshing) {
            this.isRefreshing = true;

            try {
              const newToken = await this.refreshToken();
              this.onRefreshed(newToken);
            } catch (err) {
              // refresh thất bại → logout
              localStorage.removeItem('auth-storage');
              window.location.href = '/login';
              return Promise.reject(err);
            } finally {
              this.isRefreshing = false;
            }
          }

          return new Promise((resolve) => {
            this.refreshSubscribers.push((token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(this.api(originalRequest));
            });
          });
        }

        return Promise.reject(error.response?.data || error);
      }
    );
  }

  /** ================= Refresh token ================= */
  private async refreshToken(): Promise<string> {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) throw new Error('No refresh token found');

    const { state } = JSON.parse(raw);
    if (!state?.refreshToken) throw new Error('No refresh token found');

    const response = await axios.post(
      `${URL_API}/auth/refresh`,
      { token: state.refreshToken },
      { withCredentials: true }
    );

    if (response.data.code !== 0) throw new Error('Refresh token failed');

    const newAccessToken = response.data.data.token;

    // Cập nhật accessToken trong localStorage
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          ...state,
          accessToken: newAccessToken,
        },
      })
    );

    return newAccessToken;
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  /** ================= Data handler ================= */
  private prepareData(data: any) {
    if (!data) return { body: data, headers: {} };

    if (data instanceof FormData) return { body: data, headers: { 'Content-Type': undefined } };

    const hasFile = Object.values(data).some((v) => v instanceof File || v instanceof Blob);

    if (hasFile) {
      const fd = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (Array.isArray(value)) {
          value.forEach((v, i) =>
            fd.append(
              `${key}[${i}]`,
              typeof v === 'object' && !(v instanceof File) ? JSON.stringify(v) : v
            )
          );
        } else if (typeof value === 'object' && !(value instanceof File)) {
          fd.append(key, JSON.stringify(value));
        } else {
          fd.append(key, value as any);
        }
      });

      return { body: fd, headers: { 'Content-Type': undefined } };
    }

    return { body: data, headers: { 'Content-Type': 'application/json' } };
  }

  /** ================= HTTP METHODS ================= */
  async get<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    return (await this.api.get(url, config)).data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const { body, headers } = this.prepareData(data);
    return (await this.api.post(url, body, { ...config, headers: { ...headers, ...(config?.headers || {}) } })).data;
  }

  async put<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const { body, headers } = this.prepareData(data);
    return (await this.api.put(url, body, { ...config, headers: { ...headers, ...(config?.headers || {}) } })).data;
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const { body, headers } = this.prepareData(data);
    return (await this.api.patch(url, body, { ...config, headers: { ...headers, ...(config?.headers || {}) } })).data;
  }

  async delete<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    return (await this.api.delete(url, config)).data;
  }

  /** ================= Loading ================= */
  private startRequest() {
    this.activeRequests++;
    if (this.activeRequests === 1) {
      const LOADING_DELAY = 0;
      this.loadingTimer = setTimeout(() => {
        if (this.activeRequests > 0) useLoadingStore.getState().setLoading(true);
      }, LOADING_DELAY);
    }
  }

  private endRequest() {
    if (this.activeRequests > 0) this.activeRequests--;

    if (this.activeRequests === 0) {
      if (this.loadingTimer) clearTimeout(this.loadingTimer);

      setTimeout(() => {
        useLoadingStore.getState().setLoading(false);
      }, 150);
    }
  }

  public resetLoading() {
    if (this.loadingTimer) clearTimeout(this.loadingTimer);
    this.activeRequests = 0;
    useLoadingStore.getState().setLoading(false);
  }
}

export default new ApiService();
