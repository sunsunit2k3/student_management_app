import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUserDto } from '../types';
import { login as loginApi, logout as logoutApi, getCurrentUser, refreshToken as refreshTokenApi } from '../api/authService';

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
  refreshAccessToken: () => Promise<boolean>;
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
        set({
          accessToken,
          refreshToken: refreshToken || get().refreshToken,
        }),
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
            await logoutApi({ token: accessToken } );
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          get().clearUser();
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

          const meRes = await getCurrentUser();
          if (meRes.code === 0 && meRes.data) {
            set({ user: meRes.data, isAuthenticated: true });
          } else {
            const refreshed = await get().refreshAccessToken();
            if (refreshed) {
              await get().checkAuth(); // retry fetching user
            } else {
              get().clearUser();
            }
          }
        } catch {
          get().clearUser();
        } finally {
          set({ isChecking: false });
        }
      },

      refreshAccessToken: async () => {
        try {
          const accessToken = get().accessToken;
          if (!accessToken) return false;

          const refreshToken = get().refreshToken;
          if (!refreshToken) return false;
          const response = await refreshTokenApi({ token: refreshToken });
          if (response.code === 0 && response.data) {
            get().setTokens(response.data.token);
            return true;
          } else {
            get().clearUser();
            return false;
          }
        } catch {
          get().clearUser();
          return false;
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

if (typeof window !== 'undefined') {
  const w = window as any;
  if (!w.__auth_store_events_installed) {
    window.addEventListener('auth:token-refreshed', (e: Event) => {
      try {
        const detail = (e as CustomEvent)?.detail;
        if (detail && detail.accessToken) {
          useAuthStore.getState().setTokens(detail.accessToken);
        }
      } catch (err) {
        // ignore
      }
    });

    window.addEventListener('auth:refresh-failed', (_e: Event) => {
      try {
        useAuthStore.getState().clearUser();
      } catch (err) {
        // ignore
      }
    });

    w.__auth_store_events_installed = true;
  }
}

export default useAuthStore;

