import { useState, useEffect } from "react";
import { Bell, Calendar, CheckCircle2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import toast from "react-hot-toast";

export function ReminderWidget() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await api.get("/reminders/due");
      setReminders(res.data);
    } catch (e) {
      console.error("Failed to fetch reminders", e);
    } finally {
      setLoading(false);
    }
  };

  const markCompleted = async (id: string) => {
    try {
      await api.put(`/reminders/${id}`, { is_completed: true });
      fetchReminders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/reminders/${deleteId}`);
      toast.success("Reminder deleted");
      fetchReminders();
    } catch (e) {
      toast.error("Failed to delete reminder");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (loading) return null;

  return (
    <Card padding={false} className="mb-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Pending Reminders</h3>
        </div>
        <span className="text-xs font-medium bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
          {reminders.length} Due
        </span>
      </div>
      
      {reminders.length === 0 ? (
        <div className="p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">All caught up!</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No pending follow-ups or overdue tasks.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {reminders.map((r) => (
            <div key={r.id} className="flex items-start justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors">
              <div className="flex gap-4">
                <div className="mt-0.5 bg-indigo-100 p-2 rounded-lg">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{r.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-1 border border-slate-200 dark:border-slate-800 inline-block px-2 py-0.5 rounded">
                    {r.entity_type}
                  </p>
                  {r.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{r.description}</p>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-3 shrink-0">
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                  Due: {new Date(r.due_date).toLocaleDateString()}
                </span>
                <button
                  onClick={() => markCompleted(r.id)}
                  className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded transition-colors shadow-sm"
                >
                  Complete
                </button>
                <button
                  onClick={() => setDeleteId(r.id)}
                  className="text-xs font-medium text-red-600 bg-white dark:bg-slate-950 hover:bg-red-50 border border-red-200 px-2 py-1.5 rounded transition-colors shadow-sm"
                  title="Delete Reminder"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        itemName="this reminder"
        isDeleting={isDeleting}
      />
    </Card>
  );
}
