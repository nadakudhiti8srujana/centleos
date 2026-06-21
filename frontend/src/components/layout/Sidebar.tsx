import { useAuth } from "@/contexts/AuthContext";
import { cn, getInitials } from "@/lib/utils";
import {
  Building2,
  Handshake,
  Kanban,
  LayoutDashboard,
  LogOut,
  Settings,
  Target,
  UserCircle,
  Share2,
  FileText,
  ShieldAlert,
  LineChart,
  Mail,
  Users,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/leads", icon: Target, label: "Leads" },
  { to: "/pipeline", icon: Kanban, label: "Pipeline" },
  { to: "/contacts", icon: UserCircle, label: "Contacts" },
  { to: "/accounts", icon: Building2, label: "Accounts" },
  { to: "/deals", icon: Handshake, label: "Deals" },
  { to: "/referrals", icon: Share2, label: "Referrals" },
  { to: "/invoices", icon: FileText, label: "ERP Invoices" },
  { to: "/analytics", icon: LineChart, label: "Reports" },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-sidebar text-white">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 font-bold">
          C
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight">CentleOS</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-400">CRM Platform</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}

        {user?.role === "super_admin" && (
          <NavLink
            to="/super-admin"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mt-4",
                isActive
                  ? "bg-rose-600 text-white"
                  : "text-rose-300 hover:bg-rose-900 hover:text-white"
              )
            }
          >
            <ShieldAlert className="h-5 w-5 shrink-0" />
            Super Admin
          </NavLink>
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-active text-white"
                : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
            )
          }
        >
          <Settings className="h-5 w-5" />
          Settings
        </NavLink>

        {(user?.role === "company_admin" || user?.role === "super_admin") && (
          <NavLink
            to="/team-management"
            className={({ isActive }) =>
              cn(
                "mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-active text-white"
                  : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
              )
            }
          >
            <Users className="h-5 w-5" />
            Team Management
          </NavLink>
        )}

        <NavLink
          to="/email-logs"
          className={({ isActive }) =>
            cn(
              "mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-active text-white"
                : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
            )
          }
        >
          <Mail className="h-5 w-5" />
          Email Logs
        </NavLink>

        <div className="flex items-center gap-3 rounded-lg bg-sidebar-hover px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold">
            {user ? getInitials(user.full_name) : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.full_name}</p>
            <p className="truncate text-xs text-slate-400 capitalize">
              {user?.role.replace(/_/g, " ")}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded p-1 text-slate-400 hover:bg-sidebar-active hover:text-white"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
