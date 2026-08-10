import { create } from "zustand";
import { User } from "@/types";
import { authApi } from "@/lib/api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
  }) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  convertGuest: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    const userRes = await authApi.getMe();
    set({ user: userRes.data, isAuthenticated: true, isLoading: false });
  },

  register: async (registerData) => {
    const { data } = await authApi.register(registerData);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    const userRes = await authApi.getMe();
    set({ user: userRes.data, isAuthenticated: true, isLoading: false });
  },

  loginAsGuest: async () => {
    const { data } = await authApi.guest();
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    const userRes = await authApi.getMe();
    set({ user: userRes.data, isAuthenticated: true, isLoading: false });
  },

  convertGuest: async (convertData) => {
    const { data } = await authApi.convertGuest(convertData);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    const userRes = await authApi.getMe();
    set({ user: userRes.data, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  fetchUser: async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { data } = await authApi.getMe();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: true }),
}));
