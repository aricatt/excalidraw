import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user }),

      setToken: (token) => {
        localStorage.setItem('auth_token', token);
        set({ token });
      },

      login: (user, token) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({
          user,
          token,
          isAuthenticated: true,
          error: null
        });
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      initializeAuth: () => {
        console.log('🔄 Initializing auth...');
        const token = localStorage.getItem('auth_token');
        const user = localStorage.getItem('user');

        console.log('📦 Token from localStorage:', token ? 'exists' : 'null');
        console.log('👤 User from localStorage:', user ? 'exists' : 'null');

        if (!token || token === 'null' || token === 'undefined') {
          console.log('❌ No valid token, setting unauthenticated');
          set({ isAuthenticated: false, user: null, token: null });
        } else {
          // 如果有token，检查用户数据
          try {
            const parsedUser = user ? JSON.parse(user) : null;

            // 必须同时有token和用户数据才认为是已登录
            if (parsedUser && parsedUser.id) {
              console.log('✅ Restoring auth state with token and user');
              set({
                isAuthenticated: true,
                user: parsedUser,
                token: token
              });
            } else {
              console.log('❌ Token exists but no valid user data, clearing auth');
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user');
              localStorage.removeItem('auth-storage');
              set({ isAuthenticated: false, user: null, token: null });
            }
          } catch (error) {
            console.log('💥 Error parsing user data, clearing auth');
            // 如果用户数据解析失败，清除所有认证信息
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            localStorage.removeItem('auth-storage');
            set({ isAuthenticated: false, user: null, token: null });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
