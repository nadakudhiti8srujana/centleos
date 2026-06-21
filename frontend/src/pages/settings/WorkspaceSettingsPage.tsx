import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function WorkspaceSettingsPage() {
  const { workspaceId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [settings, setSettings] = useState({
    name: "",
    website: "",
    description: "",
    support_email: "",
    support_phone: "",
    address: "",
    currency: "USD",
    tax_percentage: 0,
    timezone: "UTC",
    logo_url: ""
  });

  useEffect(() => {
    if (!workspaceId) return;
    api.get(`/saas/workspaces`).then(res => {
      // Assuming this endpoint returns current workspace
      const current = res.data.find((w: any) => w.id === workspaceId);
      if (current) {
        setSettings({
          name: current.name || "",
          website: current.website || "",
          logo_url: current.logo_url || "",
          description: current.settings?.description || "",
          support_email: current.settings?.support_email || "",
          support_phone: current.settings?.support_phone || "",
          address: current.settings?.address || "",
          currency: current.settings?.currency || "USD",
          tax_percentage: current.settings?.tax_percentage || 0,
          timezone: current.settings?.timezone || "UTC",
        });
      }
    }).catch(console.error);
  }, [workspaceId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await api.put("/workspaces/settings", settings);
      setMessage("Workspace settings updated successfully.");
      setSettings(prev => ({...prev, logo_url: res.data.logo_url, name: res.data.name}));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploading(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/workspaces/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSettings(prev => ({...prev, logo_url: res.data.logo_url}));
      setMessage("Logo uploaded successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Header title="Company Settings" subtitle="Manage your workspace identity" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card>
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">Company Logo</h3>
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-800">
                {settings.logo_url ? (
                  <img src={`http://localhost:8000${settings.logo_url}`} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-400 text-sm">No Logo</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Upload a high-resolution logo. Supported formats: PNG, JPG, JPEG.</p>
                <div className="flex items-center gap-4">
                  <input type="file" id="logoUpload" className="hidden" accept=".png,.jpg,.jpeg" onChange={handleLogoUpload} />
                  <Button variant="outline" onClick={() => document.getElementById("logoUpload")?.click()} loading={uploading}>
                    Choose File
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">Company Details</h3>
            <form onSubmit={handleSave} className="space-y-4">
              {message && (
                <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
              )}
              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input label="Company Name" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} required />
                <Input label="Website" value={settings.website} onChange={e => setSettings({...settings, website: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea 
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" 
                  rows={3}
                  value={settings.description} 
                  onChange={e => setSettings({...settings, description: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Support Email" value={settings.support_email} onChange={e => setSettings({...settings, support_email: e.target.value})} />
                <Input label="Support Phone" value={settings.support_phone} onChange={e => setSettings({...settings, support_phone: e.target.value})} />
              </div>

              <Input label="Address" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} />

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Currency</label>
                  <select 
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    value={settings.currency}
                    onChange={e => setSettings({...settings, currency: e.target.value})}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tax Percentage (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    value={settings.tax_percentage}
                    onChange={e => setSettings({...settings, tax_percentage: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Timezone</label>
                  <select 
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    value={settings.timezone}
                    onChange={e => setSettings({...settings, timezone: e.target.value})}
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" loading={loading}>Save Settings</Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
