import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/Input";
import { Users, Sun, Moon, Menu } from "lucide-react";
import { ReminderBell } from "./ReminderBell";
import { NotificationBell } from "./NotificationBell";
import { GlobalSearch } from "./GlobalSearch";
import { useSidebar } from "@/contexts/SidebarContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { isSuperAdmin, workspaceId, setWorkspace } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggleMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-10 border-b border-white/5 bg-[#03040B]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMobile}
            className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-slate-400 font-medium">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-slate-400" />
              <Input
                placeholder="Workspace UUID"
                value={workspaceId || ""}
                onChange={(e) => setWorkspace(e.target.value.trim() || null)}
                className="w-56 text-xs"
              />
            </div>
          )}
          <div className="hidden md:block mr-2">
            <GlobalSearch />
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors rounded-md"
            title="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
          <NotificationBell />
          <ReminderBell />
          {actions}
        </div>
      </div>
    </header>
  );
}
