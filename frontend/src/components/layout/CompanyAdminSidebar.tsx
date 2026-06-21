import { useAuth } from "@/contexts/AuthContext";
import { cn, getInitials } from "@/lib/utils";
import {
  Building2,
  Handshake,
  LayoutDashboard,
  LogOut,
  Settings,
  Target,
  UserCircle,
  Share2,
  FileText,
  LineChart,
  Mail,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSidebar } from "@/contexts/SidebarContext";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true, module: "core" },
  { to: "/leads", icon: Target, label: "Leads", module: "crm" },
  { to: "/contacts", icon: UserCircle, label: "Contacts", module: "crm" },
  { to: "/accounts", icon: Building2, label: "Accounts", module: "crm" },
  { to: "/deals", icon: Handshake, label: "Deals", module: "crm" },
  { to: "/referrals", icon: Share2, label: "Referrals", module: "referrals" },
  { to: "/invoices", icon: FileText, label: "ERP Invoices", module: "erp" },
  { to: "/analytics", icon: LineChart, label: "Reports", module: "analytics" },
];

export function CompanyAdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isMobileOpen, closeMobile } = useSidebar();

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
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-white/5",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-5 bg-white/[0.02]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-brand-500 shadow-[inset_0_0_20px_rgba(99,102,241,0.5)]">
          <img src="/centlelogo.jpeg" alt="CentleOS" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight">{user?.company_name || "CentleOS"}</p>
          <p className="text-[10px] uppercase tracking-wider text-brand-400">Company Admin</p>
        </div>
        <button className="ml-auto p-1 lg:hidden text-slate-400 hover:text-white" onClick={closeMobile}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        {navItems.map(({ to, icon: Icon, label, end, module }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => {
              let activeClass = "bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.15)]";
              if (module === "crm") activeClass = "bg-module-crm/10 text-module-crm border border-module-crm/20 shadow-[inset_0_0_20px_rgba(147,51,234,0.15)]";
              else if (module === "erp") activeClass = "bg-module-erp/10 text-module-erp border border-module-erp/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.15)]";
              else if (module === "analytics") activeClass = "bg-module-analytics/10 text-module-analytics border border-module-analytics/20 shadow-[inset_0_0_20px_rgba(6,182,212,0.15)]";
              else if (module === "referrals") activeClass = "bg-module-referrals/10 text-module-referrals border border-module-referrals/20 shadow-[inset_0_0_20px_rgba(245,158,11,0.15)]";
              
              return cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 border border-transparent",
                isActive
                  ? activeClass
                  : "text-slate-400 hover:bg-sidebar-hover hover:text-white"
              );
            }}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/5 p-3 bg-white/[0.01]">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 border border-transparent",
              isActive
                ? "bg-sidebar-active text-white border-white/10"
                : "text-slate-400 hover:bg-sidebar-hover hover:text-white"
            )
          }
        >
          <Settings className="h-5 w-5" />
          Settings
        </NavLink>

        <NavLink
          to="/email-logs"
          className={({ isActive }) =>
            cn(
              "mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 border border-transparent",
              isActive
                ? "bg-sidebar-active text-white border-white/10"
                : "text-slate-400 hover:bg-sidebar-hover hover:text-white"
            )
          }
        >
          <Mail className="h-5 w-5" />
          Email Logs
        </NavLink>

        <div className="flex items-center gap-3 rounded-lg bg-sidebar-hover border border-white/5 px-3 py-2.5 mt-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-xs font-semibold shadow-glow-crm">
            {user ? getInitials(user.full_name) : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">{user?.full_name}</p>
            <p className="truncate text-[10px] text-brand-400 font-medium uppercase tracking-wider">Admin</p>
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
