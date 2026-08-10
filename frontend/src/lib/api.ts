import axios from "axios";
import { AuthTokens, User, TodayData } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const { data } = await axios.post(
            `${api.defaults.baseURL}/api/auth/refresh`,
            { refresh_token: refreshToken }
          );
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    name: string;
    age?: number;
    education?: string;
    occupation?: string;
    career_goal?: string;
  }) => api.post<AuthTokens>("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthTokens>("/api/auth/login", data),
  guest: () => api.post<AuthTokens>("/api/auth/guest"),
  convertGuest: (data: { name: string; email: string; password: string }) =>
    api.post<AuthTokens>("/api/auth/convert-guest", data),
  refresh: (refresh_token: string) =>
    api.post<AuthTokens>("/api/auth/refresh", { refresh_token }),
  getMe: () => api.get<User>("/api/auth/me"),
};

export const usersApi = {
  getProfile: () => api.get<User>("/api/users/profile"),
  updateProfile: (data: Partial<User>) => api.put<User>("/api/users/profile", data),
  completeOnboarding: (data: any) => api.post("/api/users/onboarding", data),
};

export const tasksApi = {
  list: (params?: { status?: string; priority?: string; date?: string }) =>
    api.get("/api/tasks/", { params }),
  create: (data: any) => api.post("/api/tasks/", data),
  update: (id: number, data: any) => api.put(`/api/tasks/${id}`, data),
  delete: (id: number) => api.delete(`/api/tasks/${id}`),
  getTimeBlocks: (day_of_week?: number) =>
    api.get("/api/tasks/time-blocks/", { params: { day_of_week } }),
  createTimeBlock: (data: any) => api.post("/api/tasks/time-blocks/", data),
  deleteTimeBlock: (id: number) => api.delete(`/api/tasks/time-blocks/${id}`),
};

export const goalsApi = {
  list: (params?: { category?: string; status?: string }) =>
    api.get("/api/goals/", { params }),
  create: (data: any) => api.post("/api/goals/", data),
  update: (id: number, data: any) => api.put(`/api/goals/${id}`, data),
  delete: (id: number) => api.delete(`/api/goals/${id}`),
  toggleMilestone: (id: number) => api.put(`/api/goals/milestones/${id}`),
};

export const habitsApi = {
  list: () => api.get("/api/habits/"),
  create: (data: any) => api.post("/api/habits/", data),
  update: (id: number, data: any) => api.put(`/api/habits/${id}`, data),
  delete: (id: number) => api.delete(`/api/habits/${id}`),
  log: (data: { habit_id: number; date: string }) =>
    api.post("/api/habits/logs/", data),
  getLogs: (params?: { start_date?: string; end_date?: string }) =>
    api.get("/api/habits/logs/", { params }),
};

export const learningApi = {
  listSkills: () => api.get("/api/learning/skills/"),
  createSkill: (data: any) => api.post("/api/learning/skills/", data),
  updateSkill: (id: number, data: any) =>
    api.put(`/api/learning/skills/${id}`, data),
  listPaths: () => api.get("/api/learning/paths/"),
  listLessons: (pathId: number) =>
    api.get(`/api/learning/paths/${pathId}/lessons/`),
  completeLesson: (lessonId: number) =>
    api.put(`/api/learning/lessons/${lessonId}/complete`),
};

export const financeApi = {
  listGoals: () => api.get("/api/finance/goals/"),
  createGoal: (data: any) => api.post("/api/finance/goals/", data),
  updateGoal: (id: number, data: any) =>
    api.put(`/api/finance/goals/${id}`, data),
  deleteGoal: (id: number) => api.delete(`/api/finance/goals/${id}`),
  listTransactions: (limit?: number) =>
    api.get("/api/finance/transactions/", { params: { limit } }),
  createTransaction: (data: any) =>
    api.post("/api/finance/transactions/", data),
};

export const analyticsApi = {
  getDashboard: () => api.get("/api/analytics/dashboard"),
  getToday: () => api.get<TodayData>("/api/analytics/today"),
  getTrends: (days?: number) =>
    api.get("/api/analytics/productivity-trends", { params: { days } }),
  getStudyHours: (days?: number) =>
    api.get("/api/analytics/study-hours", { params: { days } }),
  getHabitConsistency: (days?: number) =>
    api.get("/api/analytics/habit-consistency", { params: { days } }),
};

export const aiCoachApi = {
  chat: (data: { message: string; conversation_history?: any[] }) =>
    api.post("/api/ai-coach/chat", data),
  generateRoadmap: () => api.post("/api/ai-coach/generate-roadmap"),
  analyzeProductivity: () => api.post("/api/ai-coach/analyze-productivity"),
  breakdownTask: (data: { task_title: string; description?: string }) =>
    api.post("/api/ai-coach/breakdown-task", data),
  stuck: (data: { task_title: string; blocker?: string }) =>
    api.post("/api/ai-coach/stuck", data),
  getInterviewQuestions: (data: {
    role: string;
    skills: string[];
    question_type?: string;
  }) => api.post("/api/ai-coach/interview-questions", data),
};

export const adminApi = {
  getStats: () => api.get("/api/admin/stats"),
  listUsers: (params?: { page?: number; per_page?: number }) =>
    api.get("/api/admin/users", { params }),
  toggleUserActive: (userId: number) =>
    api.put(`/api/admin/users/${userId}/toggle-active`),
};

export const focusApi = {
  record: (data: {
    task_id?: number;
    planned_minutes: number;
    actual_minutes: number;
    completed: boolean;
  }) => api.post("/api/focus/sessions", data),
  list: (limit?: number) =>
    api.get("/api/focus/sessions", { params: { limit } }),
  stats: () => api.get("/api/focus/stats"),
};

export default api;
