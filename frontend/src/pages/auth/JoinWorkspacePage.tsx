import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export function JoinWorkspacePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    invitation_code: searchParams.get("code") || "",
    full_name: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Join Workspace
      const response = await api.post("/saas/join", formData);
      const { access_token, user } = response.data;

      localStorage.setItem("access_token", access_token);

      // We might not have the email in formData to pass to login(), 
      // but the API returned it in `user`. We can use that.
      await login({ email: user.email, password: formData.password });

      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        "Invalid invitation code or error joining workspace."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-sm">
            <LayoutDashboard className="w-8 h-8 text-white" />
          </div>
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Centleos</span>
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Join a workspace
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Have an invitation code? Enter it below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-950 py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            <Input
              label="Invitation Code"
              name="invitation_code"
              type="text"
              required
              value={formData.invitation_code}
              onChange={handleChange}
              placeholder="e.g. abcd1234efgh5678"
            />

            <Input
              label="Full Name"
              name="full_name"
              type="text"
              required
              value={formData.full_name}
              onChange={handleChange}
              placeholder="John Doe"
            />

            <Input
              label="Create Password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 8 characters"
            />

            <div>
              <Button type="submit" className="w-full h-11 text-base shadow-md hover:shadow-lg transition-all" loading={isLoading}>
                Join Workspace
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400">Don't have a code?</span>
              </div>
            </div>

            <div className="mt-6 text-center space-y-3 flex flex-col">
              <Link to="/register-workspace" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Create a new workspace
              </Link>
              <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100">
                Log in to an existing account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
