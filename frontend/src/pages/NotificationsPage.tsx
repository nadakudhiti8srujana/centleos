import { useEffect, useState } from "react";
import { Bell, Check, MailOpen } from "lucide-react";
import { notificationsService, AppNotification } from "@/services/notifications";
import { Button } from "@/components/ui/Button";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationsService.list();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">View and manage your recent activity alerts.</p>
        </div>
        <Button variant="outline" onClick={handleMarkAllAsRead} className="gap-2">
          <Check className="h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
            <Bell className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">All caught up!</h3>
            <p className="text-sm mt-1">You have no new notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-6 flex gap-4 transition-colors ${
                  notif.is_read ? "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900/50" : "bg-blue-50/30 hover:bg-blue-50/50"
                }`}
              >
                <div className={`mt-1 p-2 rounded-full ${notif.is_read ? "bg-slate-100 text-slate-500 dark:text-slate-400" : "bg-blue-100 text-blue-600"}`}>
                  <Bell className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className={`text-base ${notif.is_read ? "font-medium text-slate-700 dark:text-slate-300" : "font-semibold text-slate-900 dark:text-slate-100"}`}>
                        {notif.title}
                      </h4>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{notif.message}</p>
                    </div>
                    <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {notif.trigger_type.replace(/_/g, ' ')}
                    </span>
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <MailOpen className="h-3 w-3" />
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
