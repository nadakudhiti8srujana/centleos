import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/api";
import { authService } from "@/services/auth";
import { getInitials } from "@/lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setMessage("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await authService.uploadAvatar(file);
      await refreshUser();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <>
      <Header title="Settings" subtitle="Manage your account" />
      
      {/* Forced Dark Mode Background Wrapper */}
      <div className="relative flex-1 overflow-y-auto bg-[#050816] text-white scrollbar-thin selection:bg-brand-500/30 selection:text-brand-200">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-900/40 via-[#050816] to-transparent"></div>
        
        <div className="relative z-10 p-6">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="mx-auto max-w-2xl space-y-6"
          >
            <motion.div variants={itemVariants}>
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="relative group shrink-0">
                      <div className="flex h-20 w-20 overflow-hidden items-center justify-center rounded-full bg-brand-500/20 border-2 border-brand-500/30 text-2xl font-bold text-brand-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        {user?.avatar_url ? (
                          <img src={import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') + user.avatar_url : user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          user ? getInitials(user.full_name) : "?"
                        )}
                      </div>
                      <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="text-xs font-medium text-white">Change</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleAvatarUpload}
                        />
                      </label>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">{user?.full_name}</h2>
                      <p className="text-sm text-slate-400">{user?.email}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-400">
                        {user?.role.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="cursor-pointer inline-block">
                      <div className="px-4 py-2 rounded-md bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] text-sm font-medium text-slate-200 transition-colors">
                        Change Picture
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <h3 className="mb-6 font-semibold text-white tracking-tight border-b border-white/5 pb-4">Change Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-5">
                  {message && (
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
                      {message}
                    </div>
                  )}
                  {error && (
                    <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400">{error}</div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Current password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <Input
                      label="New password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="pt-2">
                    <Button type="submit" loading={loading} className="bg-brand-600 hover:bg-brand-500 text-white shadow-glow-crm border border-brand-500/50">
                      Update password
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-6">
              <motion.div variants={itemVariants} className="h-full">
                <Card className="h-full flex flex-col">
                  <div className="flex-1">
                    <h3 className="mb-2 font-semibold text-white tracking-tight">Custom Pipeline Builder</h3>
                    <p className="mb-6 text-sm text-slate-400">Configure your custom sales pipeline stages.</p>
                  </div>
                  <div>
                    <Button variant="outline" className="w-full bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-slate-200" onClick={() => navigate("/pipeline-settings")}>
                      Manage Pipeline Stages
                    </Button>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="h-full">
                <Card className="h-full flex flex-col">
                  <div className="flex-1">
                    <h3 className="mb-2 font-semibold text-white tracking-tight">Workspace Settings</h3>
                    <p className="mb-6 text-sm text-slate-400">Manage company details, branding, and localization.</p>
                  </div>
                  <div>
                    <Button variant="outline" className="w-full bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-slate-200" onClick={() => navigate("/workspace-settings")}>
                      Manage Workspace
                    </Button>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="h-full">
                <Card className="h-full flex flex-col">
                  <div className="flex-1">
                    <h3 className="mb-2 font-semibold text-white tracking-tight">Email Templates</h3>
                    <p className="mb-6 text-sm text-slate-400">Manage automated email templates sent to users and customers.</p>
                  </div>
                  <div>
                    <Button variant="outline" className="w-full bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-slate-200" onClick={() => navigate("/email-templates")}>
                      Manage Email Templates
                    </Button>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="h-full">
                <Card className="h-full flex flex-col">
                  <div className="flex-1">
                    <h3 className="mb-2 font-semibold text-white tracking-tight">Audit Logs</h3>
                    <p className="mb-6 text-sm text-slate-400">View immutable ledger of system events and activities.</p>
                  </div>
                  <div>
                    <Button variant="outline" className="w-full bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-slate-200" onClick={() => navigate("/audit-logs")}>
                      View Audit Logs
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>

            <motion.div variants={itemVariants}>
              <Card>
                <h3 className="mb-2 font-semibold text-rose-400 tracking-tight">Session</h3>
                <p className="mb-6 text-sm text-slate-400">Sign out of your current session on this device.</p>
                <Button variant="outline" className="bg-rose-500/5 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30" onClick={async () => { await logout(); navigate("/login"); }}>
                  Sign out
                </Button>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
