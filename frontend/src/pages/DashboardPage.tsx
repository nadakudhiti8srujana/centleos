import { Header } from "@/components/layout/Header";
import { ModernStatCard } from "@/components/ui/ModernStatCard";
import { AISuggestionsWidget } from "@/components/ui/AISuggestionsWidget";
import { PageLoader } from "@/components/ui/Spinner";
import { StageBadge } from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate, cn } from "@/lib/utils";
import { dealsService } from "@/services/deals";
import { leadsService } from "@/services/leads";
import { contactsService } from "@/services/contacts";
import { accountsService } from "@/services/accounts";
import { erpInvoicesService } from "@/services/erp_invoices";
import { analyticsService, type ForecastResponse } from "@/services/analytics";
import { api } from "@/lib/api";
import type { Lead, LeadStage } from "@/types";
import { STAGE_LABELS } from "@/types";
import {
  Handshake,
  Target,
  UserCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Activity,
  Users,
  Plus,
  BarChart3,
  Percent,
  ArrowRight
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STAGE_CHART_COLORS: Record<LeadStage, string> = {
  new: "#94a3b8",
  contacted: "#3b82f6",
  qualified: "#6366f1",
  proposal: "#a855f7",
  negotiation: "#f59e0b",
  won: "#10b981",
  lost: "#ef4444",
};

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    leads: 0,
    contacts: 0,
    accounts: 0,
    deals: 0,
    revenue: 0,
    pendingInvoices: 0,
    conversionRate: 0,
  });
  const [stageData, setStageData] = useState<{ name: string; count: number; stage: string; color?: string }[]>([]);
  const [recentActivity, setRecentActivity] = useState<Lead[]>([]);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [teamLeaderboard, setTeamLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [
          pipeline, 
          leadsRes, 
          contactsRes, 
          accountsRes, 
          dealsRes, 
          invoiceStats,
          forecastData,
          leaderboardData
        ] = await Promise.all([
            leadsService.pipeline(),
            leadsService.list({ page: 1, page_size: 5 }),
            contactsService.list(1, 1),
            accountsService.list(1, 1),
            dealsService.list({ page: 1, page_size: 1 }),
            erpInvoicesService.getStats().catch(() => ({ pending_invoices: 0, revenue_collected: 0 })),
            analyticsService.getForecast().catch(() => null),
            api.get('/analytics/leaderboard/sales').then(r => r.data).catch(() => [])
          ]);

        const totalWon = pipeline.stages.find(s => s.stage === "won")?.count || 0;
        const totalClosed = (pipeline.stages.find(s => s.stage === "lost")?.count || 0) + totalWon;
        const conversionRate = totalClosed > 0 ? (totalWon / totalClosed) * 100 : 0;

        setStats({
          leads: pipeline.total_leads,
          contacts: contactsRes.total,
          accounts: accountsRes.total,
          deals: dealsRes.total,
          revenue: invoiceStats.revenue_collected || 0,
          pendingInvoices: invoiceStats.pending_invoices || 0,
          conversionRate,
        });

        setStageData(
          pipeline.stages.map((s) => ({
            name: s.stage_id ? s.stage : (STAGE_LABELS[s.stage as LeadStage] || s.stage),
            count: s.count,
            stage: s.stage_id || s.stage,
            color: s.color || STAGE_CHART_COLORS[s.stage as LeadStage] || "#94a3b8",
          }))
        );

        setRecentActivity(leadsRes.items);
        if (forecastData) setForecast(forecastData);
        setTeamLeaderboard(leaderboardData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  return (
    <>
      <Header title="Company Overview" subtitle={`Welcome back, ${user?.full_name?.split(" ")[0]}`} />
      
      {/* Forced Dark Mode Background Wrapper */}
      <div className="relative flex-1 overflow-y-auto bg-[#050816] text-white scrollbar-thin selection:bg-purple-500/30 selection:text-purple-200">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/40 via-[#050816] to-transparent"></div>
        
        <div className="relative z-10 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-purple-500"></div>
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-6 max-w-7xl mx-auto"
            >
              {/* Quick Actions */}
              <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
                <button onClick={() => navigate("/leads")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-glow-crm bg-brand-600 hover:bg-brand-500 text-white border border-brand-500/50 transition-all">
                  <Plus className="h-4 w-4" /> Create Lead
                </button>
                <button onClick={() => navigate("/contacts")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 text-slate-300 transition-all">
                  <UserCircle className="h-4 w-4 text-purple-400" /> Add Contact
                </button>
                <button onClick={() => navigate("/deals")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 text-slate-300 transition-all">
                  <Handshake className="h-4 w-4 text-purple-400" /> New Deal
                </button>
                <button onClick={() => navigate("/invoices")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 text-slate-300 transition-all">
                  <FileText className="h-4 w-4 text-purple-400" /> Create Invoice
                </button>
                <button onClick={() => navigate("/settings")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 text-slate-300 transition-all">
                  <Users className="h-4 w-4 text-purple-400" /> Invite User
                </button>
              </motion.div>

              {/* KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <motion.div variants={itemVariants}>
                  <ModernStatCard title="Total Leads" value={stats.leads} icon={<Target className="h-6 w-6 text-purple-400" />} module="crm" delay={0.1} />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <ModernStatCard title="Total Revenue" value={stats.revenue} icon={<DollarSign className="h-6 w-6 text-emerald-400" />} isCurrency module="erp" delay={0.2} />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <ModernStatCard title="Conversion Rate" value={stats.conversionRate} icon={<Percent className="h-6 w-6 text-cyan-400" />} subtitle="Win vs Loss Ratio" module="analytics" delay={0.3} />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <ModernStatCard title="Pending Invoices" value={stats.pendingInvoices} icon={<FileText className="h-6 w-6 text-emerald-400" />} module="erp" delay={0.4} />
                </motion.div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 mt-6">
                {/* Sales Funnel */}
                <motion.div variants={itemVariants}>
                  <div className="h-full glass-panel p-6 rounded-2xl shadow-elevated border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="flex items-center gap-2 mb-6 relative z-10">
                      <Activity className="h-5 w-5 text-brand-400" />
                      <h3 className="text-base font-semibold text-white tracking-tight">Sales Funnel</h3>
                    </div>
                    {stageData.some((d) => d.count > 0) ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stageData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <Tooltip 
                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                            contentStyle={{ backgroundColor: '#0B1120', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }} 
                            itemStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                            {stageData.map((entry) => (
                              <Cell key={entry.stage} fill={entry.color || STAGE_CHART_COLORS[entry.stage as LeadStage] || "#94a3b8"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[280px] items-center justify-center">
                        <p className="text-sm text-slate-500">No active funnel data</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Revenue Forecast */}
                <motion.div variants={itemVariants}>
                  <div className="h-full glass-panel p-6 rounded-2xl shadow-elevated border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="flex items-center gap-2 mb-6 relative z-10">
                      <BarChart3 className="h-5 w-5 text-emerald-400" />
                      <h3 className="text-base font-semibold text-white tracking-tight">Revenue Forecast</h3>
                    </div>
                    {forecast && forecast.forecast.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={forecast.forecast}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <Tooltip 
                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                            contentStyle={{ backgroundColor: '#0B1120', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }} 
                          />
                          <Bar dataKey="expected_revenue" name="Expected" fill="#9333ea" radius={[6, 6, 0, 0]} maxBarSize={40} />
                          <Bar dataKey="secured_revenue" name="Secured" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[280px] items-center justify-center">
                        <p className="text-sm text-slate-500">Not enough data to forecast</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3 mt-6">
                <motion.div variants={itemVariants} className="lg:col-span-1">
                  <AISuggestionsWidget />
                </motion.div>
                {/* Team Performance */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                  <div className="h-full glass-panel p-6 rounded-2xl shadow-elevated border border-white/5 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-brand-400" />
                        <h3 className="text-base font-semibold text-white tracking-tight">Team Performance</h3>
                      </div>
                    </div>
                    {teamLeaderboard.length === 0 ? (
                      <div className="py-12 flex items-center justify-center text-sm text-slate-500">No team data yet</div>
                    ) : (
                      <div className="space-y-4">
                        {teamLeaderboard.map((rep, idx) => (
                          <div key={rep.id} className="group flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-brand-500/30 transition-all duration-300">
                            <div className="flex items-center gap-4">
                              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-glow-crm", idx === 0 ? "bg-gradient-to-tr from-amber-500 to-yellow-300" : idx === 1 ? "bg-gradient-to-tr from-slate-400 to-slate-200" : idx === 2 ? "bg-gradient-to-tr from-amber-700 to-orange-500" : "bg-gradient-to-tr from-brand-600 to-brand-400")}>
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-white group-hover:text-brand-300 transition-colors">{rep.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{rep.deals_closed} deals won</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm text-emerald-400">${rep.revenue_closed.toLocaleString()}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{rep.win_rate}% win rate</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div variants={itemVariants}>
                  <div className="h-full glass-panel flex flex-col p-0 overflow-hidden rounded-2xl shadow-elevated border border-white/5 relative">
                    <div className="flex items-center justify-between border-b border-white/5 px-6 py-5 bg-white/[0.02] relative z-10">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-400" />
                        <h3 className="font-semibold text-white tracking-tight">Recent Lead Activity</h3>
                      </div>
                      <Link to="/leads" className="text-xs font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1 group">
                        View all <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                    {recentActivity.length === 0 ? (
                      <div className="py-12 flex-1 flex items-center justify-center text-sm text-slate-500">No recent activity</div>
                    ) : (
                      <div className="divide-y divide-white/5 relative z-10">
                        {recentActivity.map((lead) => (
                          <Link
                            key={lead.id}
                            to={`/leads/${lead.id}`}
                            className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.04] transition-colors group"
                          >
                            <div>
                              <p className="font-semibold text-sm text-slate-200 group-hover:text-purple-300 transition-colors">{lead.name}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {lead.email || lead.phone || "No contact info"}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              <StageBadge stage={lead.stage} />
                              <span className="text-[10px] text-slate-500 font-medium">{formatDate(lead.created_at)}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
