import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUserDto } from '../types';
import { login as loginApi, logout as logoutApi, getCurrentUser } from '../api/authService';

interface AuthState {
  user: AuthUserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isChecking: boolean;
  loginError?: string;
  
  setUser: (user: AuthUserDto | null) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  clearUser: () => void;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isChecking: false,
      loginError: undefined,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setTokens: (accessToken, refreshToken) =>
        set((state) => ({
          accessToken,
          refreshToken: refreshToken || state.refreshToken,
        })),

      clearUser: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          loginError: undefined,
        }),

      login: async (username, password) => {
        try {
          set({ loginError: undefined });
          const response = await loginApi({ username, password });
          if (response.code !== 0 || !response.data) throw new Error(response.message || 'Login failed');

          const { accessToken, refreshToken } = response.data;
          get().setTokens(accessToken, refreshToken);

          const meRes = await getCurrentUser();
          if (meRes.code === 0 && meRes.data) {
            set({ user: meRes.data, isAuthenticated: true });
          } else {
            set({ user: null, isAuthenticated: false });
            throw new Error('Failed to fetch user info');
          }
        } catch (error: unknown) {
          get().clearUser();
          const message = error instanceof Error ? error.message : String(error);
          set({ loginError: message });
          throw error;
        }
      },

      logout: async () => {
        try {
          const { accessToken } = get();
          if (accessToken) {
            await logoutApi({ token: accessToken });
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          get().clearUser();
          localStorage.removeItem('auth-storage');
        }
      },

      checkAuth: async () => {
        set({ isChecking: true });
        try {
          const { accessToken } = get();
          if (!accessToken) {
            set({ user: null, isAuthenticated: false });
            return;
          }

          // Gọi API lấy user info.
          // Nếu token hết hạn, Axios Interceptor sẽ tự động refresh và retry request này.
          // Chúng ta không cần logic refresh thủ công ở đây nữa.
          const meRes = await getCurrentUser();
          
          if (meRes.code === 0 && meRes.data) {
            set({ user: meRes.data, isAuthenticated: true });
          } else {
            // Token hợp lệ nhưng server trả lỗi (VD: user bị lock)
            get().clearUser();
          }
        } catch (error) {
          // Nếu cả refresh token cũng lỗi thì axios reject -> vào đây -> logout
          get().clearUser();
        } finally {
          set({ isChecking: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// --- Event Listeners: Đồng bộ State với Axios Service ---
if (typeof window !== 'undefined') {
  const w = window as any;
  if (!w.__auth_store_events_installed) {
    
    // 1. Khi Axios refresh thành công: Cập nhật state mới vào Zustand
    window.addEventListener('auth:token-refreshed', (e: Event) => {
      try {
        const detail = (e as CustomEvent)?.detail;
        if (detail && detail.accessToken) {
          useAuthStore.getState().setTokens(detail.accessToken, detail.refreshToken);
        }
      } catch (err) {
        console.error(err);
      }
    });

    // 2. Khi Axios refresh thất bại: Xóa user khỏi Zustand
    window.addEventListener('auth:refresh-failed', () => {
      useAuthStore.getState().clearUser();
    });

    w.__auth_store_events_installed = true;
  }
}

export default useAuthStore;