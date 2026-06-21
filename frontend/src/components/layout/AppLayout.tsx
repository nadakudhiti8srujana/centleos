import { Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SuperAdminSidebar } from "./SuperAdminSidebar";
import { CompanyAdminSidebar } from "./CompanyAdminSidebar";
import { UserSidebar } from "./UserSidebar";
import { SidebarProvider } from "@/contexts/SidebarContext";

export function AppLayout() {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-aurora-bg text-aurora-text">
        {user?.role === "super_admin" && <SuperAdminSidebar />}
        {user?.role === "company_admin" && <CompanyAdminSidebar />}
        {user?.role !== "super_admin" && user?.role !== "company_admin" && <UserSidebar />}
        <main className="flex flex-1 flex-col overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
