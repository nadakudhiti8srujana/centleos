import { api } from "@/lib/api";
import type { TokenResponse, User, UserRole } from "@/types";

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: UserRole;
  workspace_slug?: string;
}

export interface LoginData {
  email: string;
  password: string;
  company_slug?: string;
}

export const authService = {
  async register(data: RegisterData): Promise<TokenResponse> {
    const { data: res } = await api.post<TokenResponse>("/saas/register", data);
    return res;
  },

  async registerUser(data: RegisterData): Promise<TokenResponse> {
    const { data: res } = await api.post<TokenResponse>("/saas/register-user", data);
    return res;
  },

  async login(data: LoginData): Promise<TokenResponse> {
    const { data: res } = await api.post<TokenResponse>("/auth/login", data);
    return res;
  },

  async googleLogin(token: string, company_slug?: string): Promise<TokenResponse> {
    const { data: res } = await api.post<TokenResponse>("/auth/google", { token, company_slug });
    return res;
  },

  async logout(refreshToken?: string): Promise<void> {
    await api.post("/auth/logout", { refresh_token: refreshToken });
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },

  async changePassword(current: string, newPassword: string): Promise<void> {
    await api.post("/auth/change-password", {
      current_password: current,
      new_password: newPassword,
    });
  },

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<User>("/auth/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
