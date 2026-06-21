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
  KanbanSquare,
  Bell,
  Mail,
  X
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSidebar } from "@/contexts/SidebarContext";

const navItems = [
  { to: "/user-dashboard", icon: LayoutDashboard, label: "Dashboard", end: true, module: "core" },
  { to: "/pipeline", icon: KanbanSquare, label: "My Pipeline", module: "crm" },
  { to: "/leads", icon: Target, label: "My Leads", module: "crm" },
  { to: "/deals", icon: Handshake, label: "My Deals", module: "crm" },
  { to: "/contacts", icon: UserCircle, label: "My Contacts", module: "crm" },
  { to: "/accounts", icon: Building2, label: "My Accounts", module: "crm" },
];

export function UserSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isMobileOpen, closeMobile } = useSidebar();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-brand-500 shadow-glow-crm">
          <img src="/centlelogo.jpeg" alt="CentleOS" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight">{user?.company_name || "CentleOS"}</p>
          <p className="text-[10px] uppercase tracking-wider text-brand-400">Workspace</p>
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
          to="/notifications"
          className={({ isActive }) =>
            cn(
              "mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 border border-transparent",
              isActive
                ? "bg-sidebar-active text-white border-white/10"
                : "text-slate-400 hover:bg-sidebar-hover hover:text-white"
            )
          }
        >
          <Bell className="h-5 w-5" />
          Notifications
        </NavLink>

        <NavLink
          to="/email-templates"
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
          Email Templates
        </NavLink>

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

        <div className="flex items-center gap-3 rounded-lg bg-sidebar-hover border border-white/5 px-3 py-2.5 mt-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-xs font-semibold shadow-glow-crm">
            {user ? getInitials(user.full_name) : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">{user?.full_name}</p>
            <p className="truncate text-[10px] text-brand-400 font-medium uppercase tracking-wider">User</p>
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
