import { api } from "@/lib/api";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  trigger_type: string;
  created_at: string;
}

export const notificationsService = {
  list(): Promise<AppNotification[]> {
    return api.get<AppNotification[]>("/notifications").then((r) => r.data);
  },

  markRead(id: string): Promise<void> {
    return api.put(`/notifications/${id}/read`).then(() => undefined);
  },

  markAllRead(): Promise<void> {
    return api.put("/notifications/read-all").then(() => undefined);
  },
};
