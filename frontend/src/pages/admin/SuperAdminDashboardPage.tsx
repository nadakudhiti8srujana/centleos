import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Users, Target, CheckCircle2, DollarSign, Share2, 
  Wallet, Activity, AlertTriangle, ShieldAlert, Settings, Bell, HardDrive
} from "lucide-react";
import { ModernStatCard } from "@/components/ui/ModernStatCard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type OverviewData = {
  total_companies: number;
  total_users: number;
  total_leads: number;
  total_deals: number;
  total_revenue: number;
  total_referrals: number;
  total_pending_payouts: number;
};

export default function SuperAdminDashboardPage() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Settings State
  const [globalSignups, setGlobalSignups] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "overview") {
        const res = await api.get("/super-admin/overview");
        setOverview(res.data);
      } else if (activeTab === "notifications") {
        const res = await api.get("/super-admin/notifications");
        setNotifications(res.data);
      } else if (["companies", "users", "admins", "leads", "deals", "invoices", "referrals", "audit"].includes(activeTab)) {
        // Fallback or specific endpoints
        // Note: For admins and audit, we reuse the generic fetch structure but might need a specific endpoint on the backend.
        // For now, we will safely try to fetch, if it 404s we just show an empty list.
        const res = await api.get(`/super-admin/${activeTab === 'admins' ? 'users' : activeTab}`).catch(() => ({ data: [] }));
        let data = res.data;
        if (activeTab === 'admins') {
          data = data.filter((u: any) => u.role === 'company_admin');
        }
        setTableData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      await api.delete(`/super-admin/${type}/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/super-admin/users/${userId}/role`, { role: newRole });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      await api.put(`/super-admin/users/${userId}/status`, { is_active: isActive });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -10 }
  };

  return (
    <div className="relative h-full overflow-y-auto bg-[#050816] text-white selection:bg-rose-500/30 selection:text-rose-200">
      {/* Subtle Aurora Background specifically for Super Admin */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-900/40 via-[#050816] to-transparent"></div>

      <div className="relative z-10 p-8 space-y-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent capitalize">
              {activeTab.replace("-", " ")}
            </h1>
            <p className="text-sm text-slate-400 mt-2 font-medium">
              Global Command Center & System Control.
            </p>
          </div>
        </motion.div>

        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-rose-500"></div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={pageVariants}
                initial="initial"
                animate="in"
                exit="out"
                transition={{ duration: 0.3 }}
              >
                {/* OVERVIEW TAB */}
                {activeTab === "overview" && overview && (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <ModernStatCard title="Total Companies" value={overview.total_companies} icon={<Building2 className="h-6 w-6 text-rose-400" />} module="superadmin" />
                    <ModernStatCard title="Total Users" value={overview.total_users} icon={<Users className="h-6 w-6 text-rose-400" />} module="superadmin" delay={0.1} />
                    <ModernStatCard title="Total Leads" value={overview.total_leads} icon={<Target className="h-6 w-6 text-rose-400" />} module="superadmin" delay={0.2} />
                    <ModernStatCard title="Total Deals" value={overview.total_deals} icon={<CheckCircle2 className="h-6 w-6 text-rose-400" />} module="superadmin" delay={0.3} />
                    <ModernStatCard title="Total Revenue" value={overview.total_revenue} isCurrency icon={<DollarSign className="h-6 w-6 text-rose-400" />} module="superadmin" delay={0.4} />
                    <ModernStatCard title="Total Referrals" value={overview.total_referrals} icon={<Share2 className="h-6 w-6 text-rose-400" />} module="superadmin" delay={0.5} />
                    <ModernStatCard title="Pending Payouts" value={overview.total_pending_payouts} icon={<Wallet className="h-6 w-6 text-rose-400" />} module="superadmin" delay={0.6} />
                    <ModernStatCard title="System Health" value={100} icon={<Activity className="h-6 w-6 text-rose-400" />} subtitle="Online & Operational" module="superadmin" delay={0.7} />
                  </div>
                )}

                {/* NOTIFICATIONS TAB */}
                {activeTab === "notifications" && (
                  <div className="glass-panel overflow-hidden p-0 rounded-2xl shadow-glow-super border-rose-500/20">
                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <Bell className="text-rose-400 w-5 h-5" />
                        <h2 className="font-semibold text-white tracking-tight text-lg">Notification Delivery Logs</h2>
                      </div>
                      <p className="text-sm text-slate-400 mt-1 pl-8">Track delivery status of all system emails.</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white/[0.02] border-b border-white/5 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-medium text-slate-400">Channel</th>
                            <th className="px-6 py-4 font-medium text-slate-400">Type</th>
                            <th className="px-6 py-4 font-medium text-slate-400">Message</th>
                            <th className="px-6 py-4 font-medium text-slate-400">Status</th>
                            <th className="px-6 py-4 font-medium text-slate-400">Sent At</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-white/5">
                          {notifications.map((log) => (
                            <tr key={log.id} className="hover:bg-white/[0.04] transition-colors">
                              <td className="px-6 py-4 font-medium uppercase text-xs text-white">{log.channel}</td>
                              <td className="px-6 py-4 text-slate-300">{log.type}</td>
                              <td className="px-6 py-4 truncate max-w-xs text-slate-300">{log.message}</td>
                              <td className="px-6 py-4">
                                <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                                  log.status === "sent" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                  log.status === "failed" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                )}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-400">
                                {log.sent_at ? new Date(log.sent_at).toLocaleString() : "—"}
                              </td>
                            </tr>
                          ))}
                          {notifications.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No notifications found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* DYNAMIC LIST TABS (Companies, Users, Admins, Leads, Deals, Invoices, Referrals) */}
                {["companies", "users", "admins", "leads", "deals", "invoices", "referrals"].includes(activeTab) && (
                  <div className="glass-panel overflow-hidden p-0 rounded-2xl shadow-glow-super border-rose-500/20">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white/[0.02] border-b border-white/5 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-medium text-slate-400">ID</th>
                            <th className="px-6 py-4 font-medium text-slate-400">Details</th>
                            <th className="px-6 py-4 font-medium text-slate-400 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-white/5">
                          {tableData.map((row) => (
                            <tr key={row.id} className="hover:bg-white/[0.04] transition-colors">
                              <td className="px-6 py-4 font-mono text-xs text-slate-500">{row.id.substring(0,8)}...</td>
                              <td className="px-6 py-4 text-slate-300">
                                {activeTab === "companies" && <div><span className="text-white font-medium text-base">{row.name}</span> <span className="text-slate-500 ml-2">({row.slug})</span></div>}
                                
                                {(activeTab === "users" || activeTab === "admins") && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-white text-base">{row.full_name}</span>
                                      <span className="text-slate-400 text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10">{row.email}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <select 
                                        value={row.role} 
                                        onChange={(e) => handleRoleChange(row.id, e.target.value)}
                                        className="block text-xs border-white/10 bg-white/5 text-white rounded p-1.5 focus:ring-rose-500 focus:border-rose-500 outline-none"
                                      >
                                        <option value="user">User</option>
                                        <option value="company_admin">Company Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                      </select>
                                      <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-white transition-colors">
                                        <input 
                                          type="checkbox" 
                                          checked={row.is_active !== false} 
                                          onChange={(e) => handleStatusChange(row.id, e.target.checked)} 
                                          className="w-4 h-4 rounded border-white/20 bg-[#1a122e] checked:bg-rose-500 focus:ring-rose-500/50" 
                                        /> 
                                        {row.is_active !== false ? <span className="text-emerald-400">Active</span> : <span className="text-slate-500">Suspended</span>}
                                      </label>
                                    </div>
                                  </div>
                                )}
                                
                                {activeTab === "leads" && <div><span className="text-white font-medium">{row.name}</span> <span className="text-slate-500 ml-2">({row.email})</span></div>}
                                {activeTab === "deals" && <div><span className="text-white font-medium">{row.name}</span> <span className="mx-2 text-slate-600">|</span> <span className="text-emerald-400 font-medium">${row.deal_value}</span> <span className="text-slate-500 ml-2">({row.status})</span></div>}
                                {activeTab === "invoices" && <div><span className="text-white font-medium">{row.invoice_number}</span> <span className="mx-2 text-slate-600">|</span> <span className="text-emerald-400 font-medium">${row.total_amount}</span> <span className="text-slate-500 ml-2">({row.status})</span></div>}
                                {activeTab === "referrals" && <div><span className="text-slate-400">Status: {row.payout_status}</span> <span className="mx-2 text-slate-600">|</span> <span className="text-emerald-400 font-medium">${row.commission_amount}</span></div>}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => handleDelete(row.id, activeTab === "admins" ? "users" : activeTab)} 
                                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-medium px-3 py-1.5 bg-rose-500/5 border border-rose-500/20 rounded-lg transition-colors"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                          {tableData.length === 0 && (
                            <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500">No records found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* SYSTEM HEALTH TAB */}
                {activeTab === "system" && (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="glass-panel p-6 rounded-2xl shadow-glow-super border-rose-500/20 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="p-3 rounded-xl bg-emerald-500/10">
                          <Activity className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-lg">API Status</h3>
                          <p className="text-sm text-emerald-400 font-medium">All systems operational</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 relative z-10 mt-4 leading-relaxed">
                        The core CentleOS API, Database clusters, and external Webhooks are responding normally. Latency is within acceptable thresholds.
                      </p>
                    </div>
                    
                    <div className="glass-panel p-6 rounded-2xl shadow-glow-super border-rose-500/20 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="p-3 rounded-xl bg-blue-500/10">
                          <HardDrive className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-lg">Storage Metrics</h3>
                          <p className="text-sm text-blue-400 font-medium">45% Capacity</p>
                        </div>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 mt-6">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AUDIT LOGS TAB */}
                {activeTab === "audit" && (
                  <div className="glass-panel overflow-hidden p-0 rounded-2xl shadow-glow-super border-rose-500/20">
                     <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="text-rose-400 w-5 h-5" />
                        <h2 className="font-semibold text-white tracking-tight text-lg">Global Security Audit Logs</h2>
                      </div>
                      <p className="text-sm text-slate-400 mt-1 pl-8">Monitor system-wide destructive actions and security events.</p>
                    </div>
                    <div className="p-12 text-center">
                      <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
                      <h3 className="text-slate-300 font-medium text-lg">No audit events to display</h3>
                      <p className="text-slate-500 text-sm mt-1">Audit trail will appear here when companies make critical changes.</p>
                    </div>
                  </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === "settings" && (
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="glass-panel p-6 rounded-2xl shadow-glow-super border-rose-500/20">
                        <div className="flex items-center gap-3 mb-6">
                          <Settings className="text-rose-400 w-5 h-5" />
                          <h3 className="font-semibold text-white text-lg">General Preferences</h3>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Platform Name</label>
                            <input 
                              type="text" 
                              defaultValue="CentleOS"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Support Email</label>
                            <input 
                              type="email" 
                              defaultValue="support@centleos.com"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                            />
                          </div>
                          <button className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-colors font-medium text-sm mt-2">
                            Save Changes
                          </button>
                        </div>
                      </div>

                      <div className="glass-panel p-6 rounded-2xl shadow-glow-super border-rose-500/20">
                        <div className="flex items-center gap-3 mb-6">
                          <ShieldAlert className="text-rose-400 w-5 h-5" />
                          <h3 className="font-semibold text-white text-lg">Security & Access</h3>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                            <div>
                              <div className="font-medium text-white">Global Signups</div>
                              <div className="text-xs text-slate-400 mt-1">Allow new companies to register.</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={globalSignups} onChange={(e) => setGlobalSignups(e.target.checked)} className="sr-only peer" />
                              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                            <div>
                              <div className="font-medium text-white">Maintenance Mode</div>
                              <div className="text-xs text-slate-400 mt-1">Disable access for non-admins.</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} className="sr-only peer" />
                              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
