import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/api";
import { WORKSPACE_SLUGS } from "@/types";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"company" | "super">("company");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companySlug, setCompanySlug] = useState(WORKSPACE_SLUGS[0]?.slug || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login({
        email,
        password,
        company_slug: activeTab === "company" ? companySlug : undefined,
      });

      if (user.role === "super_admin") {
        navigate("/super-admin");
      } else if (user.role === "user") {
        navigate("/user-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-sidebar p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-lg font-bold text-white">
            C
          </div>
          <span className="text-xl font-bold text-white">CentleOS</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight text-white">
            Manage leads, deals &amp; growth in one place
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            A modern CRM built for the Centle India ecosystem — Skill Tank, Maceco, Tobofu, and
            more.
          </p>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">© 2026 CentleOS. All rights reserved.</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
                C
              </div>
              <span className="text-xl font-bold">CentleOS</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in to your account</p>

          <div className="mt-6 flex border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "company"
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              onClick={() => setActiveTab("company")}
            >
              Company / User Login
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "super"
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              onClick={() => setActiveTab("super")}
            >
              Super Admin Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            
            {activeTab === "company" && (
              <Select
                label="Company"
                options={WORKSPACE_SLUGS.map((w) => ({ value: w.slug, label: w.name }))}
                value={companySlug}
                onChange={(e) => setCompanySlug(e.target.value)}
                required
              />
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>

          {activeTab === "company" && (
            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
                Register as User
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    workspace_slug: WORKSPACE_SLUGS[0]?.slug || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerUser({
        ...form,
        workspace_slug: form.workspace_slug
      });
      navigate("/user-dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900/50 p-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 shadow-elevated">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
            C
          </div>
          <span className="text-xl font-bold">CentleOS</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">User Registration</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Join an existing company workspace</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <Select
            label="Company"
            options={WORKSPACE_SLUGS.map((w) => ({ value: w.slug, label: w.name }))}
            value={form.workspace_slug}
            onChange={(e) => setForm({ ...form, workspace_slug: e.target.value })}
            required
          />
          <Input
            label="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            required
          />
          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
