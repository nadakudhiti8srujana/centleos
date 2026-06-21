import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";

export function ReminderBell() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchReminders();
    // Poll every minute
    const interval = setInterval(fetchReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await api.get("/reminders/due");
      setReminders(res.data);
    } catch (e) {
      console.error("Failed to fetch reminders", e);
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

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Bell className="h-5 w-5" />
        {reminders.length > 0 && (
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white dark:bg-slate-950 py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Reminders</h3>
            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-medium">
              {reminders.length} Due
            </span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {reminders.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">No pending reminders!</p>
            ) : (
              reminders.map((r) => (
                <div key={r.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 border-b border-slate-50 last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{r.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">{r.entity_type}</p>
                      {r.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{r.description}</p>}
                      <p className="text-xs font-medium text-red-600 mt-1">
                        Due: {new Date(r.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => markCompleted(r.id)}
                      className="shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-2 py-1 rounded"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
