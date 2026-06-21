import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { PageLoader } from "@/components/ui/Spinner";
import { motion } from "framer-motion";

import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Target, Handshake, DollarSign, Calendar, TrendingUp, Users, Activity, Medal, File,
  PieChart, BarChart
} from "lucide-react";
import { ModernStatCard } from "@/components/ui/ModernStatCard";

export function AnalyticsDashboardPage() {
  const { isSuperAdmin, workspaceId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);
  const [salesLeaderboard, setSalesLeaderboard] = useState<any[]>([]);
  const [referralLeaderboard, setReferralLeaderboard] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (isSuperAdmin && !workspaceId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        const [kpiRes, salesRes, refRes, feedRes] = await Promise.all([
          api.get("/analytics/kpis"),
          api.get("/analytics/leaderboard/sales"),
          api.get("/analytics/leaderboard/referrals"),
          api.get("/analytics/activity-feed?page_size=30")
        ]);

        setKpis(kpiRes.data);
        setSalesLeaderboard(salesRes.data);
        setReferralLeaderboard(refRes.data);
        setActivities(feedRes.data.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // Set up a simple polling for real-time activity feed demo
    const interval = setInterval(() => {
      api.get("/analytics/activity-feed?page_size=30")
        .then(res => setActivities(res.data.items || []))
        .catch(console.error);
    }, 15000);

    return () => clearInterval(interval);
  }, [workspaceId, isSuperAdmin]);

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

  if (isSuperAdmin && !workspaceId) {
    return (
      <>
        <Header title="Analytics & Reports" subtitle="Workspace Performance" />
        <div className="relative flex-1 overflow-y-auto bg-[#050816] text-white">
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/40 via-[#050816] to-transparent"></div>
          <div className="relative z-10 flex flex-1 items-center justify-center p-8 h-full">
            <div className="glass-panel p-8 max-w-md text-center rounded-2xl shadow-elevated border-white/5">
              <p className="text-slate-400">Enter a workspace UUID in the header to view reports.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const getActionColor = (action: string) => {
    if (action.includes("create")) return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
    if (action.includes("won") || action.includes("convert")) return "bg-brand-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]";
    if (action.includes("update") || action.includes("change")) return "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]";
    if (action.includes("delete")) return "bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.5)]";
    return "bg-slate-400";
  };

  return (
    <>
      <Header title="Analytics & Reports" subtitle="Key Performance Indicators & Leaderboards" />
      
      {/* Forced Dark Mode Background Wrapper with Neon Cyan accent for Analytics */}
      <div className="relative flex-1 overflow-y-auto bg-[#050816] text-white scrollbar-thin selection:bg-cyan-500/30 selection:text-cyan-200">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/40 via-[#050816] to-transparent"></div>
        
        <div className="relative z-10 p-6">
          {loading || !kpis ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-cyan-500"></div>
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto"
            >
              
              {/* Column 1: KPI Grid (Spans 8 columns on large screens) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <motion.div variants={itemVariants}>
                    <ModernStatCard 
                      title="Lead Conversion Rate" 
                      value={`${kpis.lead_conversion_rate}%`} 
                      icon={<Target className="h-6 w-6 text-cyan-400" />} 
                      module="analytics"
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <ModernStatCard 
                      title="Deal Win Rate" 
                      value={`${kpis.deal_win_rate}%`} 
                      icon={<Handshake className="h-6 w-6 text-cyan-400" />} 
                      module="analytics"
                      delay={0.1}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <ModernStatCard 
                      title="Average Deal Value" 
                      value={kpis.average_deal_value} 
                      isCurrency
                      icon={<DollarSign className="h-6 w-6 text-emerald-400" />} 
                      module="analytics"
                      delay={0.2}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <ModernStatCard 
                      title="Active Deals" 
                      value={kpis.active_deals_count} 
                      icon={<TrendingUp className="h-6 w-6 text-brand-400" />} 
                      module="analytics"
                      delay={0.3}
                    />
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <motion.div variants={itemVariants}>
                    <ModernStatCard 
                      title="Revenue This Month" 
                      value={kpis.revenue_this_month} 
                      isCurrency
                      icon={<Calendar className="h-6 w-6 text-emerald-400" />} 
                      module="erp"
                      delay={0.4}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <ModernStatCard 
                      title="Revenue This QTR" 
                      value={kpis.revenue_this_quarter} 
                      isCurrency
                      icon={<Calendar className="h-6 w-6 text-emerald-400" />} 
                      module="erp"
                      delay={0.5}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <ModernStatCard 
                      title="Revenue This Year" 
                      value={kpis.revenue_this_year} 
                      isCurrency
                      icon={<Calendar className="h-6 w-6 text-emerald-400" />} 
                      module="erp"
                      delay={0.6}
                    />
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <motion.div variants={itemVariants}>
                    <ModernStatCard 
                      title="Lead Attachments" 
                      value={kpis.lead_attachments_count || 0} 
                      icon={<File className="h-6 w-6 text-slate-400" />} 
                      module="crm"
                      delay={0.7}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <ModernStatCard 
                      title="Deal Attachments" 
                      value={kpis.deal_attachments_count || 0} 
                      icon={<File className="h-6 w-6 text-slate-400" />} 
                      module="crm"
                      delay={0.8}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <ModernStatCard 
                      title="Invoice Attachments" 
                      value={kpis.invoice_attachments_count || 0} 
                      icon={<File className="h-6 w-6 text-slate-400" />} 
                      module="erp"
                      delay={0.9}
                    />
                  </motion.div>
                </div>

                {/* Revenue Forecast Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <motion.div variants={itemVariants}>
                    <ModernStatCard 
                      title="Forecast Next Month" 
                      value={kpis.forecast_next_month || 0} 
                      isCurrency
                      icon={<BarChart className="h-6 w-6 text-cyan-400" />} 
                      module="analytics"
                      delay={1.0}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <ModernStatCard 
                      title="Forecast Next QTR" 
                      value={kpis.forecast_next_quarter || 0} 
                      isCurrency
                      icon={<BarChart className="h-6 w-6 text-cyan-400" />} 
                      module="analytics"
                      delay={1.1}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <ModernStatCard 
                      title="Forecast Confidence" 
                      value={`${kpis.forecast_confidence_score || 0}%`} 
                      icon={<PieChart className="h-6 w-6 text-cyan-400" />} 
                      module="analytics"
                      delay={1.2}
                    />
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sales Leaderboard */}
                  <motion.div variants={itemVariants}>
                    <div className="h-full glass-panel p-6 rounded-2xl shadow-elevated border border-white/5">
                      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5 relative">
                        <Medal className="h-5 w-5 text-amber-400" />
                        <h3 className="font-semibold text-white tracking-tight">Top Sales Reps</h3>
                      </div>
                      {salesLeaderboard.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No data available.</p>
                      ) : (
                        <div className="space-y-4">
                          {salesLeaderboard.map((rep, idx) => (
                            <div key={rep.id} className="group flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-brand-500/30 transition-all duration-300">
                              <div className="flex items-center gap-4">
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-glow-crm", idx === 0 ? "bg-gradient-to-tr from-amber-500 to-yellow-300" : idx === 1 ? "bg-gradient-to-tr from-slate-400 to-slate-200" : idx === 2 ? "bg-gradient-to-tr from-amber-700 to-orange-500" : "bg-gradient-to-tr from-brand-600 to-brand-400")}>
                                  #{idx + 1}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors">{rep.name}</p>
                                  <p className="text-xs text-slate-400">{rep.deals_closed} Deals Won ({rep.win_rate}%)</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-emerald-400">{formatCurrency(rep.revenue_closed)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Referral Leaderboard */}
                  <motion.div variants={itemVariants}>
                    <div className="h-full glass-panel p-6 rounded-2xl shadow-elevated border border-white/5">
                      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                        <Users className="h-5 w-5 text-amber-500" />
                        <h3 className="font-semibold text-white tracking-tight">Top Referrers</h3>
                      </div>
                      {referralLeaderboard.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No data available.</p>
                      ) : (
                        <div className="space-y-4">
                          {referralLeaderboard.map((rep, idx) => (
                            <div key={rep.id} className="group flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-amber-500/30 transition-all duration-300">
                              <div className="flex items-center gap-4">
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-glow-referrals", idx === 0 ? "bg-gradient-to-tr from-amber-500 to-yellow-300" : idx === 1 ? "bg-gradient-to-tr from-slate-400 to-slate-200" : idx === 2 ? "bg-gradient-to-tr from-amber-700 to-orange-500" : "bg-gradient-to-tr from-amber-600 to-amber-400")}>
                                  #{idx + 1}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white group-hover:text-amber-300 transition-colors">{rep.name}</p>
                                  <p className="text-xs text-slate-400">{rep.referral_count} Referrals</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-emerald-400">{formatCurrency(rep.revenue_generated)}</p>
                                <p className="text-xs text-slate-400">{formatCurrency(rep.commission_earned)} Comm.</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Column 3: Real-Time Activity Feed (Spans 4 columns) */}
              <div className="lg:col-span-4 h-full">
                <motion.div variants={itemVariants} className="h-full">
                  <div className="h-full glass-panel p-6 rounded-2xl shadow-elevated border border-white/5">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                      <Activity className="h-5 w-5 text-cyan-400" />
                      <h3 className="font-semibold text-white tracking-tight">Real-Time Activity Feed</h3>
                    </div>
                    
                    {activities.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">No recent activity.</p>
                    ) : (
                      <div className="relative border-l border-white/10 ml-3 space-y-6 pb-4">
                        {activities.map((act) => (
                          <div key={act.id} className="relative pl-6 group">
                            {/* Timeline node */}
                            <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-[#0B1120] ${getActionColor(act.action)} group-hover:scale-125 transition-transform`} />
                            
                            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-colors shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                  {act.entity_type} {act.action}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              
                              {/* Display context-specific details safely */}
                              <div className="text-sm text-slate-300 mt-1">
                                {act.details.name && <p><span className="font-medium text-white">{act.details.name}</span></p>}
                                {act.details.title && <p><span className="font-medium text-white">{act.details.title}</span></p>}
                                {act.details.invoice_number && <p>Invoice: <span className="font-medium text-white">{act.details.invoice_number}</span></p>}
                                {act.details.email && <p className="text-xs text-slate-400 mt-0.5">{act.details.email}</p>}
                                {act.details.value && <p className="text-emerald-400 font-medium mt-1">${act.details.value}</p>}
                                {act.details.total && <p className="text-emerald-400 font-medium mt-1">${act.details.total}</p>}
                              </div>
                            </div>
                          </div>
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
