import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export function SaaSRegisterPage() {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  
  // Save referral code to localStorage
  if (refCode) {
    localStorage.setItem("centleos_ref_code", refCode);
    // Let the backend know there's a click by recording it asynchronously
    api.get(`/referrals/click/${refCode}`).catch(console.error);
  }

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company_name: "",
    workspace_slug: "",
    admin_email: "",
    admin_password: "",
    admin_full_name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Register Workspace & Admin
      const response = await api.post("/saas/register", formData);
      const { access_token } = response.data;

      // 2. Auto Login (We use AuthContext's internal state mechanism or manually set it if login accepts tokens)
      // Since our login context might only take email/password, let's just use the api login endpoint.
      // Wait, we already have the token. AuthContext usually handles localStorage.
      localStorage.setItem("access_token", access_token);

      // Force reload to update auth context state, or ideally we'd have a setToken method in useAuth.
      // Assuming we can just login with the credentials we just created to be safe and use existing context method.
      await login({ email: formData.admin_email, password: formData.admin_password });

      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        "An error occurred during registration. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Auto-generate slug from company name
    if (name === "company_name" && !formData.workspace_slug) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        workspace_slug: value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
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
          Create your workspace
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Or{" "}
          <Link to="/join" className="font-medium text-indigo-600 hover:text-indigo-500">
            join an existing workspace
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-950 py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">Company Details</h3>
              <div className="space-y-4">
                <Input
                  label="Company Name"
                  name="company_name"
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Acme Corp"
                />

                <div className="relative">
                  <Input
                    label="Workspace Slug"
                    name="workspace_slug"
                    type="text"
                    required
                    value={formData.workspace_slug}
                    onChange={handleChange}
                    placeholder="acme-corp"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Your workspace will be available at {formData.workspace_slug || 'slug'}.centleos.com
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">Admin Profile</h3>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  name="admin_full_name"
                  type="text"
                  required
                  value={formData.admin_full_name}
                  onChange={handleChange}
                  placeholder="John Doe"
                />

                <Input
                  label="Work Email"
                  name="admin_email"
                  type="email"
                  required
                  value={formData.admin_email}
                  onChange={handleChange}
                  placeholder="john@acmecorp.com"
                />

                <Input
                  label="Password"
                  name="admin_password"
                  type="password"
                  required
                  value={formData.admin_password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full h-11 text-base shadow-md hover:shadow-lg transition-all" loading={isLoading}>
                Create Workspace
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Log in instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
