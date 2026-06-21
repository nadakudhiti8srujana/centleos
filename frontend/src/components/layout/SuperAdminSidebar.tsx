import { useAuth } from "@/contexts/AuthContext";
import { cn, getInitials } from "@/lib/utils";
import {
  Building2,
  Users,
  Target,
  CheckCircle2,
  DollarSign,
  Share2,
  Wallet,
  Bell,
  Activity,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useSidebar } from "@/contexts/SidebarContext";

const navItems = [
  { id: "overview", icon: LayoutDashboard, label: "Overview" },
  { id: "companies", icon: Building2, label: "Companies" },
  { id: "admins", icon: ShieldAlert, label: "Company Admins" },
  { id: "users", icon: Users, label: "Users" },
  { id: "leads", icon: Target, label: "Global Leads" },
  { id: "deals", icon: CheckCircle2, label: "Global Deals" },
  { id: "invoices", icon: DollarSign, label: "Global Invoices" },
  { id: "referrals", icon: Share2, label: "Global Referrals" },
  { id: "payouts", icon: Wallet, label: "Payouts" },
  { id: "notifications", icon: Bell, label: "Notifications" },
  { id: "system", icon: Activity, label: "System Health" },
  { id: "audit", icon: ShieldAlert, label: "Audit Logs" },
  { id: "settings", icon: Settings, label: "Platform Settings" },
];

export function SuperAdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isMobileOpen, closeMobile } = useSidebar();
  const activeTab = searchParams.get("tab") || "overview";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
        />
      )}
      
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#03040B] text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-rose-500/10",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
      <div className="flex h-16 items-center gap-3 border-b border-rose-500/10 px-5 bg-rose-500/[0.02]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-gradient-to-br from-rose-600 to-purple-600 shadow-glow-super">
          <img src="/centlelogo.jpeg" alt="CentleOS" className="h-full w-full object-cover opacity-90 mix-blend-overlay" />
          <ShieldAlert className="absolute h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight">CentleOS</p>
          <p className="text-[10px] uppercase tracking-wider text-rose-400 font-medium">Super Admin</p>
        </div>
        <button className="ml-auto p-1 lg:hidden text-slate-400 hover:text-white" onClick={closeMobile}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        {navItems.map(({ id, icon: Icon, label }) => (
          <Link
            key={id}
            to={`/super-admin?tab=${id}`}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 border border-transparent",
              activeTab === id
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-glow-super"
                : "text-slate-400 hover:bg-rose-500/5 hover:text-slate-200"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-rose-500/10 p-3 bg-rose-500/[0.01]">
        <div className="flex items-center gap-3 rounded-lg bg-rose-500/5 border border-rose-500/10 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-purple-600 text-xs font-semibold shadow-glow-super">
            {user ? getInitials(user.full_name) : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">{user?.full_name}</p>
            <p className="truncate text-[10px] text-rose-400 font-medium uppercase tracking-wider">Super Admin</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
