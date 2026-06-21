import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Mail, Save, X } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Template {
  id: string;
  name: string;
  trigger_event: string;
  subject: string;
  body_html: string;
  variables: string[];
}

export function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<Template>>({});
  const [previewHtml, setPreviewHtml] = useState<string>("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get("/email-templates");
      setTemplates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (currentTemplate.id) {
        await api.put(`/email-templates/${currentTemplate.id}`, currentTemplate);
      } else {
        await api.post("/email-templates", currentTemplate);
      }
      setIsEditing(false);
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await api.delete(`/email-templates/${id}`);
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePreview = async () => {
    try {
      const res = await api.post("/email-templates/preview", {
        subject: currentTemplate.subject,
        body_html: currentTemplate.body_html,
        variables: {
          lead_name: "John Doe",
          deal_value: "5000",
          invoice_number: "INV-1234",
          amount: "150.00",
          customer_name: "Acme Corp",
          commission: "50.00",
          ambassador_name: "Jane Smith",
          owner_name: "Sales Rep"
        }
      });
      setPreviewHtml(res.data.body_html);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="p-8">Loading templates...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">Email Templates</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage automated email templates sent to users and customers.</p>
        </div>
        <Button onClick={() => { setIsEditing(true); setCurrentTemplate({}); setPreviewHtml(""); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {isEditing ? (
        <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{currentTemplate.id ? "Edit Template" : "New Template"}</h3>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400"><X className="h-5 w-5" /></button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Template Name" 
              value={currentTemplate.name || ""} 
              onChange={e => setCurrentTemplate({...currentTemplate, name: e.target.value})} 
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trigger Event</label>
              <select 
                className="w-full rounded-md border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                value={currentTemplate.trigger_event || ""}
                onChange={e => setCurrentTemplate({...currentTemplate, trigger_event: e.target.value})}
              >
                <option value="">Select an event...</option>
                <option value="lead_assigned">Lead Assigned</option>
                <option value="deal_won">Deal Won</option>
                <option value="invoice_generated">Invoice Generated</option>
                <option value="referral_converted">Referral Converted</option>
              </select>
            </div>
          </div>
          
          <Input 
            label="Subject Line" 
            value={currentTemplate.subject || ""} 
            onChange={e => setCurrentTemplate({...currentTemplate, subject: e.target.value})} 
          />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">HTML Body</label>
            <textarea 
              className="w-full h-48 rounded-md border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500 font-mono"
              value={currentTemplate.body_html || ""}
              onChange={e => setCurrentTemplate({...currentTemplate, body_html: e.target.value})}
              placeholder="<h1>Hello {{lead_name}}</h1>"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4"/> Save</Button>
            <Button variant="outline" onClick={handlePreview} className="gap-2"><Mail className="h-4 w-4"/> Preview</Button>
          </div>

          {previewHtml && (
            <div className="mt-6 p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Preview Output</h4>
              <div className="bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded shadow-sm" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-400">Name</th>
                <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-400">Trigger</th>
                <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-400">Subject</th>
                <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {templates.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900/50">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{t.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{t.trigger_event}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{t.subject}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setCurrentTemplate(t); setIsEditing(true); setPreviewHtml(""); }} className="p-1 text-slate-400 hover:text-blue-600">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-1 text-slate-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No templates configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
