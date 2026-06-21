import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { DualPaneAuth } from "@/pages/auth/DualPaneAuth";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { JoinWorkspacePage } from "@/pages/auth/JoinWorkspacePage";
import { AccountsPage } from "@/pages/AccountsPage";
import { ContactsPage } from "@/pages/ContactsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { UserDashboardPage } from "@/pages/UserDashboardPage";
import { DealsPage } from "@/pages/DealsPage";
import SuperAdminDashboardPage from "./pages/admin/SuperAdminDashboardPage";
import NotificationsPage from "./pages/NotificationsPage";
import { LeadDetailPage } from "@/pages/LeadDetailPage";
import { LeadsPage } from "@/pages/LeadsPage";
import { LandingPage } from "@/pages/LandingPage";
import { PipelinePage } from "@/pages/PipelinePage";
import { EmailTemplatesPage } from "@/pages/settings/EmailTemplatesPage";
import { WorkspaceSettingsPage } from "@/pages/settings/WorkspaceSettingsPage";
import { EmailLogsPage } from "./pages/settings/EmailLogsPage";
import { AnalyticsDashboardPage } from "@/pages/AnalyticsDashboardPage";
import { AuditLogsPage } from "@/pages/settings/AuditLogsPage";
import { PipelineSettingsPage } from "./pages/settings/PipelineSettingsPage";
import { ReferralsPage } from "@/pages/ReferralsPage";
import { ERPInvoicesPage } from "@/pages/ERPInvoicesPage";
import { ERPInvoiceDetailPage } from "@/pages/ERPInvoiceDetailPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TeamManagementPage } from "@/pages/settings/TeamManagementPage";
import { ProtectedRoute, PublicRoute } from "@/routes/ProtectedRoute";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";


import { ThemeProvider } from "@/contexts/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<DualPaneAuth />} />
            <Route path="/register" element={<DualPaneAuth />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/register-workspace" element={<Navigate to="/register" replace />} />
            <Route path="/join" element={<JoinWorkspacePage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="user-dashboard" element={<UserDashboardPage />} />
              <Route path="email-templates" element={<EmailTemplatesPage />} />
              <Route path="workspace-settings" element={<WorkspaceSettingsPage />} />
              <Route path="team-management" element={<TeamManagementPage />} />
              <Route path="email-logs" element={<EmailLogsPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="analytics" element={<AnalyticsDashboardPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="leads/:id" element={<LeadDetailPage />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="deals" element={<DealsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="pipeline-settings" element={<PipelineSettingsPage />} />
              <Route path="/referrals" element={<ReferralsPage />} />
              <Route path="/super-admin" element={<SuperAdminDashboardPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="invoices" element={<ERPInvoicesPage />} />
              <Route path="invoices/:id" element={<ERPInvoiceDetailPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
