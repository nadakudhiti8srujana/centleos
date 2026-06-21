import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearTokens, getWorkspaceId, setTokens, setWorkspaceId } from "@/lib/api";
import { authService, type LoginData, type RegisterData } from "@/services/auth";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  workspaceId: string | null;
  isSuperAdmin: boolean;
  canAccessCrm: boolean;
  login: (data: LoginData) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  registerUser: (data: RegisterData) => Promise<User>;
  googleLogin: (token: string, company_slug?: string) => Promise<User>;
  logout: () => Promise<void>;
  setWorkspace: (id: string | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const CRM_ROLES = new Set(["super_admin", "company_admin", "sales_representative", "user"]);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(getWorkspaceId());

  const refreshUser = useCallback(async () => {
    const me = await authService.me();
    setUser(me);
    if (me.role === "super_admin" && !getWorkspaceId()) {
      setWorkspaceIdState(null);
    } else if (me.company_id && me.role !== "super_admin") {
      setWorkspaceId(me.company_id);
      setWorkspaceIdState(me.company_id);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    refreshUser()
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (data: LoginData) => {
    const res = await authService.login(data);
    setTokens(res.access_token, res.refresh_token);
    setUser(res.user);
    if (res.user.company_id && res.user.role !== "super_admin") {
      setWorkspaceId(res.user.company_id);
      setWorkspaceIdState(res.user.company_id);
    }
    return res.user;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await authService.register(data);
    setTokens(res.access_token, res.refresh_token);
    setUser(res.user);
    if (res.user.company_id) {
      setWorkspaceId(res.user.company_id);
      setWorkspaceIdState(res.user.company_id);
    }
    return res.user;
  }, []);

  const registerUser = useCallback(async (data: RegisterData) => {
    const res = await authService.registerUser(data);
    setTokens(res.access_token, res.refresh_token);
    setUser(res.user);
    if (res.user.company_id) {
      setWorkspaceId(res.user.company_id);
      setWorkspaceIdState(res.user.company_id);
    }
    return res.user;
  }, []);

  const googleLogin = useCallback(async (token: string, company_slug?: string) => {
    const res = await authService.googleLogin(token, company_slug);
    setTokens(res.access_token, res.refresh_token);
    setUser(res.user);
    if (res.user.company_id && res.user.role !== "super_admin") {
      setWorkspaceId(res.user.company_id);
      setWorkspaceIdState(res.user.company_id);
    }
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem("refresh_token");
    try {
      if (refresh) await authService.logout(refresh);
    } finally {
      clearTokens();
      setUser(null);
      setWorkspaceIdState(null);
    }
  }, []);

  const setWorkspace = useCallback((id: string | null) => {
    setWorkspaceId(id);
    setWorkspaceIdState(id);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      workspaceId,
      isSuperAdmin: user?.role === "super_admin",
      canAccessCrm: user ? CRM_ROLES.has(user.role) : false,
      login,
      register,
      registerUser,
      googleLogin,
      logout,
      setWorkspace,
      refreshUser,
    }),
    [user, loading, workspaceId, login, register, registerUser, googleLogin, logout, setWorkspace, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
