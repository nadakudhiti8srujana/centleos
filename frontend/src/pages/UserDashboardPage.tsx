import { Header } from "@/components/layout/Header";
import { ModernStatCard } from "@/components/ui/ModernStatCard";
import { PageLoader } from "@/components/ui/Spinner";
import { StageBadge } from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";
import { dealsService } from "@/services/deals";
import { leadsService } from "@/services/leads";
import { ReminderWidget } from "@/components/layout/ReminderWidget";
import type { Lead } from "@/types";
import {
  Handshake,
  Target,
  DollarSign,
  Plus,
  UserCircle,
  ArrowRight
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";


export function UserDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myLeads: 0,
    myDeals: 0,
    myRevenue: 0,
    myTasks: 0, 
  });
  const [myRecentLeads, setMyRecentLeads] = useState<Lead[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [
          leadsRes, 
          dealsRes, 
          wonDeals
        ] = await Promise.all([
            leadsService.list({ owner_id: user?.id, page: 1, page_size: 5 }),
            dealsService.list({ owner_id: user?.id, page: 1, page_size: 1 }),
            dealsService.list({ owner_id: user?.id, status: "won", page_size: 100 }),
          ]);

        const myRevenue = wonDeals.items.reduce((sum, d) => sum + parseFloat(d.deal_value || "0"), 0);

        setStats({
          myLeads: leadsRes.total,
          myDeals: dealsRes.total,
          myRevenue,
          myTasks: 0, 
        });

        setMyRecentLeads(leadsRes.items);
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) {
      load();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

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
      <Header title="My Workspace" subtitle={`Hello, ${user?.full_name?.split(" ")[0]}`} />
      
      {/* Forced Dark Mode Background Wrapper with Blue accent for User Dashboard */}
      <div className="relative flex-1 overflow-y-auto bg-[#050816] text-white scrollbar-thin selection:bg-brand-500/30 selection:text-brand-200">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-900/40 via-[#050816] to-transparent"></div>
        
        <div className="relative z-10 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-brand-500"></div>
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
                  <UserCircle className="h-4 w-4 text-brand-400" /> Add Contact
                </button>
                <button onClick={() => navigate("/deals")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 text-slate-300 transition-all">
                  <Handshake className="h-4 w-4 text-brand-400" /> New Deal
                </button>
              </motion.div>

              {/* KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <motion.div variants={itemVariants}>
                  <ModernStatCard
                    title="My Leads"
                    value={stats.myLeads}
                    icon={<Target className="h-6 w-6 text-brand-400" />}
                    module="crm"
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <ModernStatCard
                    title="My Deals"
                    value={stats.myDeals}
                    icon={<Handshake className="h-6 w-6 text-brand-400" />}
                    module="crm"
                    delay={0.1}
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <ModernStatCard
                    title="My Revenue (Won)"
                    value={stats.myRevenue}
                    icon={<DollarSign className="h-6 w-6 text-emerald-400" />}
                    isCurrency
                    module="erp"
                    delay={0.2}
                  />
                </motion.div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 mt-6">
                {/* My Reminders & Tasks */}
                <motion.div variants={itemVariants} className="h-full">
                  <div className="h-full glass-panel flex flex-col p-0 overflow-hidden rounded-2xl shadow-elevated border border-white/5 relative">
                    <div className="flex items-center justify-between border-b border-white/5 px-6 py-5 bg-white/[0.02] relative z-10">
                      <h3 className="font-semibold text-white tracking-tight">My Tasks & Reminders</h3>
                    </div>
                    <div className="flex-1 relative z-10 p-2">
                      <ReminderWidget />
                    </div>
                  </div>
                </motion.div>

                {/* My Recent Leads */}
                <motion.div variants={itemVariants} className="h-full">
                  <div className="h-full glass-panel flex flex-col p-0 overflow-hidden rounded-2xl shadow-elevated border border-white/5 relative">
                    <div className="flex items-center justify-between border-b border-white/5 px-6 py-5 bg-white/[0.02] relative z-10">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-brand-400" />
                        <h3 className="font-semibold text-white tracking-tight">My Recent Leads</h3>
                      </div>
                      <Link to="/leads" className="text-xs font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1 group">
                        View all <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                    {myRecentLeads.length === 0 ? (
                      <div className="py-12 flex-1 flex items-center justify-center text-sm text-slate-500 relative z-10">
                        No recent leads assigned to you.
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5 relative z-10">
                        {myRecentLeads.map((lead) => (
                          <Link
                            key={lead.id}
                            to={`/leads/${lead.id}`}
                            className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.04] transition-colors group"
                          >
                            <div>
                              <p className="font-medium text-sm text-slate-200 group-hover:text-brand-300 transition-colors">{lead.name}</p>
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
