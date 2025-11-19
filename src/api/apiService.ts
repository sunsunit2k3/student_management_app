import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '../types/api';

const URL_API = import.meta.env.VITE_BASE_URL_BE;

class ApiService {
  private api: AxiosInstance;
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
    // REQUEST INTERCEPTOR
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const raw = localStorage.getItem('auth-storage');
        if (raw) {
          try {
            const { state } = JSON.parse(raw);
            if (state?.accessToken) {
              config.headers = config.headers || {};
              (config.headers as any).Authorization = `Bearer ${state.accessToken}`;
            }
          } catch {
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // RESPONSE INTERCEPTOR
    this.api.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<any>>) => {
        const resp = response.data;
        // Kiểm tra logic code từ Backend (nếu cần)
        if (resp.code !== 0 && resp.code !== undefined) {
          return Promise.reject(resp);
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Nếu lỗi 401 (Unauthorized) và chưa từng retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (!this.isRefreshing) {
            this.isRefreshing = true;

            try {
              const newToken = await this.refreshToken();
              this.onRefreshed(newToken);
            } catch (err) {
              localStorage.removeItem('auth-storage');
              window.dispatchEvent(new CustomEvent('auth:refresh-failed'));
              window.location.href = '/signin'; // Hoặc để Router lo
              return Promise.reject(err);
            } finally {
              this.isRefreshing = false;
            }
          }

          // Đợi token mới rồi retry request cũ
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

  /** ================= Refresh token logic ================= */
  private async refreshToken(): Promise<string> {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) throw new Error('No refresh token found');

    const { state } = JSON.parse(raw);
    if (!state?.refreshToken) throw new Error('No refresh token found');

    // Gọi API Refresh
    const response = await axios.post(
      `${URL_API}/auth/refresh`,
      { token: state.refreshToken },
      { withCredentials: true } 
    );

    if (response.data.code !== 0) throw new Error('Refresh token failed');

    const newAccessToken = response.data.data.token;
    const newRefreshToken = state.refreshToken;

    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          ...state,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken, 
        },
      })
    );

    // 2. QUAN TRỌNG: Bắn sự kiện để Zustand Store cập nhật state trong RAM
    window.dispatchEvent(
      new CustomEvent('auth:token-refreshed', {
        detail: { accessToken: newAccessToken, refreshToken: newRefreshToken },
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
            fd.append(`${key}[${i}]`, typeof v === 'object' && !(v instanceof File) ? JSON.stringify(v) : v)
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
}

export default new ApiService();