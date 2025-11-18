import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '../types/api';
import { useLoadingStore } from '../stores/useLoadingStore';
import useAuthStore from '../stores/useAuthStore';

const URL_API = import.meta.env.VITE_BASE_URL_BE;

class ApiService {
  private api: AxiosInstance;
  private activeRequests = 0;
  private loadingTimer: ReturnType<typeof setTimeout> | undefined = undefined;
  private isRefreshing = false;
  private refreshQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
    originalRequest: InternalAxiosRequestConfig;
  }> = [];
  private refreshClient = axios.create({
    baseURL: URL_API,
    withCredentials: true,
  });

  constructor() {
    this.api = axios.create({
      baseURL: URL_API,
      withCredentials: true,
    });
    this.initializeInterceptors();
  }

  private initializeInterceptors() {
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Thêm Authorization header nếu có token
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          try {
            const { state } = JSON.parse(authStorage);
            if (state?.accessToken) {
              config.headers = config.headers || {};
              (config.headers as Record<string, any>).Authorization = `Bearer ${state.accessToken}`;
            }
          } catch (error) {
            console.error('Error parsing auth storage:', error);
          }
        }
        
        // Bật loading trừ khi skipLoading = true
        const skipLoading = (config as InternalAxiosRequestConfig & { skipLoading?: boolean }).skipLoading;
        if (!skipLoading) {
          this.startRequest();
        }
        
        return config;
      },
      (error: unknown) => {
        // Nếu request fail ngay từ đầu, giảm counter
        this.endRequest();
        return Promise.reject(error);
      }
    );
    this.api.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<unknown>>) => {
        // Tắt loading cho response thành công
        const skipLoading = (response.config as InternalAxiosRequestConfig & { skipLoading?: boolean }).skipLoading;
        if (!skipLoading) {
          this.endRequest();
        }

        // Kiểm tra API response code
        const apiResponse: ApiResponse<unknown> = response.data;
        if (apiResponse.code !== 0 && apiResponse.code !== undefined) {
          return Promise.reject(apiResponse);
        }
        
        return response;
      },
      (error: unknown) => {
        // Tắt loading cho response lỗi
        const skipLoading = (error as { config?: InternalAxiosRequestConfig & { skipLoading?: boolean } }).config?.skipLoading;
        if (!skipLoading) {
          this.endRequest();
        }

        if (!axios.isAxiosError(error)) {
          return Promise.reject({
            success: false,
            message: 'Lỗi mạng, không nhận được phản hồi từ máy chủ.',
          });
        }

        const axiosError = error as { response?: AxiosResponse; message: string; config?: InternalAxiosRequestConfig };

        // If there's no response (network error)
        if (!axiosError.response) {
          return Promise.reject({
            success: false,
            message: 'Lỗi mạng, không nhận được phản hồi từ máy chủ.',
          });
        }

        if (axiosError.response.status === 401) {
          const originalRequest = axiosError.config as InternalAxiosRequestConfig & { _retry?: boolean };
          if (originalRequest && originalRequest._retry) {
            return Promise.reject(axiosError.response.data);
          }

          if (originalRequest) originalRequest._retry = true;
          let refreshToken: string | null = null;
          try {
            const raw = localStorage.getItem('auth-storage');
            if (raw) {
              const parsed = JSON.parse(raw);
              refreshToken = parsed?.state?.refreshToken ?? null;
            }
          } catch (e) {
            refreshToken = null;
          }

          if (!refreshToken) {
            return Promise.reject(axiosError.response.data);
          }

          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.refreshQueue.push({ resolve, reject, originalRequest });
            });
          }

          this.isRefreshing = true;

          return this.refreshClient
            .post(
              `/auth/refresh`,
              { token: refreshToken },
              // do not trigger loading indicator for refresh
              ({ skipLoading: true } as InternalAxiosRequestConfig & { skipLoading?: boolean })
            )
            .then((refreshResp) => {
              // Expect ApiResponse<RefreshResponse>
              const apiResp: ApiResponse<{ token: string }> = refreshResp.data;
              // Normalize different possible refresh shapes (token or accessToken)
              const data = (apiResp && apiResp.data) || {};
              const newAccessToken: string | undefined = (data as any).token || (data as any).accessToken || (data as any).access_token;
              const newRefreshToken: string | undefined = (data as any).refreshToken || (data as any).refresh_token;

              if (apiResp && apiResp.code === 0 && newAccessToken) {
                // Update persisted auth-storage and zustand store so subsequent requests pick up new tokens
                try {
                  const raw = localStorage.getItem('auth-storage');
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && parsed.state) {
                      parsed.state.accessToken = newAccessToken;
                      if (newRefreshToken) parsed.state.refreshToken = newRefreshToken;
                      localStorage.setItem('auth-storage', JSON.stringify(parsed));
                    }
                  }
                } catch (e) {
                  // ignore
                }

                // Update zustand store directly
                try {
                  useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
                } catch (e) {
                  // ignore
                }

                try {
                  if (typeof window !== 'undefined' && (window as any).CustomEvent) {
                    window.dispatchEvent(new CustomEvent('auth:token-refreshed', { detail: { accessToken: newAccessToken } }));
                  }
                } catch (e) {
                  // ignore
                }

                if (originalRequest && originalRequest.headers) {
                  (originalRequest.headers as Record<string, any>).Authorization = `Bearer ${newAccessToken}`;
                } else if (originalRequest) {
                  originalRequest.headers = { Authorization: `Bearer ${newAccessToken}` } as any;
                }

                this.refreshQueue.forEach((q) => {
                  if (q.originalRequest.headers) {
                    (q.originalRequest.headers as Record<string, any>).Authorization = `Bearer ${newAccessToken}`;
                  } else {
                    q.originalRequest.headers = { Authorization: `Bearer ${newAccessToken}` } as any;
                  }
                  this.api.request(q.originalRequest).then(q.resolve).catch(q.reject);
                });
                this.refreshQueue = [];

                this.isRefreshing = false;
                return this.api.request(originalRequest as InternalAxiosRequestConfig);
              }

              // refresh failed
              this.refreshQueue.forEach((q) => q.reject(apiResp));
              this.refreshQueue = [];
              this.isRefreshing = false;
              try {
                if (typeof window !== 'undefined' && (window as any).CustomEvent) {
                  window.dispatchEvent(new CustomEvent('auth:refresh-failed', { detail: apiResp }));
                }
              } catch (e) {}

              try {
                // ensure auth store is cleared on refresh failure
                useAuthStore.getState().clearUser();
              } catch (e) {}

              return Promise.reject(apiResp);
            })
            .catch((refreshErr) => {
              // Clear queue
              this.refreshQueue.forEach((q) => q.reject(refreshErr));
              this.refreshQueue = [];
              this.isRefreshing = false;
              try {
                useAuthStore.getState().clearUser();
              } catch (e) {}
              return Promise.reject(refreshErr);
            });
        }

        return Promise.reject(
          axiosError.response.data ?? {
            success: false,
            message: axiosError.message || 'Lỗi không xác định từ API',
          }
        );
      }
    );
  }

  private prepareData(data: unknown): { body: unknown; headers: Record<string, string | undefined> } {
    if (!data) return { body: data, headers: {} };

    if (data instanceof FormData) {
      return { body: data, headers: { 'Content-Type': undefined } };
    }

    const hasFile = Object.values(data).some(
      (v) => v instanceof File || v instanceof Blob
    );

    if (hasFile) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((item, i) => {
            formData.append(
              `${key}[${i}]`,
              typeof item === 'object' ? JSON.stringify(item) : item
            );
          });
        } else if (
          typeof value === 'object' &&
          !(value instanceof File) &&
          !(value instanceof Blob)
        ) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as string | Blob);
        }
      });
      return { body: formData, headers: { 'Content-Type': undefined } };
    }

    return { body: data, headers: { 'Content-Type': 'application/json' } };
  }

  async get<T>(
    url: string,
    config?: InternalAxiosRequestConfig & { skipLoading?: boolean }
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.get(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: InternalAxiosRequestConfig & { skipLoading?: boolean }
  ): Promise<ApiResponse<T>> {
    const { body, headers } = this.prepareData(data);
    const response: AxiosResponse<ApiResponse<T>> = await this.api.post(url, body, {
      ...config,
      headers: { ...headers, ...(config?.headers || {}) },
    });
    return response.data;
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: InternalAxiosRequestConfig & { skipLoading?: boolean }
  ): Promise<ApiResponse<T>> {
    const { body, headers } = this.prepareData(data);
    const response: AxiosResponse<ApiResponse<T>> = await this.api.put(url, body, {
      ...config,
      headers: { ...headers, ...(config?.headers || {}) },
    });
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: InternalAxiosRequestConfig & { skipLoading?: boolean }
  ): Promise<ApiResponse<T>> {
    const { body, headers } = this.prepareData(data);
    const response: AxiosResponse<ApiResponse<T>> = await this.api.patch(url, body, {
      ...config,
      headers: { ...headers, ...(config?.headers || {}) },
    });
    return response.data;
  }

  async delete<T>(
    url: string,
    config?: InternalAxiosRequestConfig & { skipLoading?: boolean }
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.delete(url, config);
    return response.data;
  }

  private startRequest() {
    this.activeRequests++;
    if (this.activeRequests === 1) {
      if (this.loadingTimer !== undefined) {
        clearTimeout(this.loadingTimer);
      }
      
      const LOADING_DELAY = 0; 
      this.loadingTimer = setTimeout(() => {
        if (this.activeRequests > 0) {
          useLoadingStore.getState().setLoading(true);
        }
        this.loadingTimer = undefined;
      }, LOADING_DELAY);
    }
  }

  private endRequest() {
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }
    if (this.activeRequests === 0) {
      if (this.loadingTimer !== undefined) {
        clearTimeout(this.loadingTimer);
        this.loadingTimer = undefined;
      }
      
      // Tắt loading với delay nhỏ để UX mượt hơn
      const currentLoadingState = useLoadingStore.getState().loading;
      if (currentLoadingState) {
        // Đảm bảo loading hiển thị ít nhất 300ms để người dùng nhìn thấy
        setTimeout(() => {
          useLoadingStore.getState().setLoading(false);
        }, 300);
      } else {
        useLoadingStore.getState().setLoading(false);
      }
    }
  }
  
  /**
   * Reset loading state (dùng khi cần cleanup)
   */
  public resetLoading() {
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
      this.loadingTimer = undefined;
    }
    this.activeRequests = 0;
    useLoadingStore.getState().setLoading(false);
  }
}

export default new ApiService();
