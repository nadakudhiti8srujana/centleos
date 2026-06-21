import { api } from "@/lib/api";
import type { Activity, ActivityTimeline, ActivityType } from "@/types";

export interface ActivityCreateData {
  activity_type: ActivityType;
  title: string;
  description?: string;
  scheduled_at?: string;
  completed_at?: string;
  contact_id?: string;
  deal_id?: string;
}

export const activitiesService = {
  createForLead(leadId: string, data: ActivityCreateData): Promise<Activity> {
    return api
      .post<Activity>(`/activities/leads/${leadId}`, data)
      .then((r) => r.data);
  },

  getLeadTimeline(leadId: string): Promise<ActivityTimeline> {
    return api
      .get<ActivityTimeline>(`/activities/leads/${leadId}/timeline`)
      .then((r) => r.data);
  },

  update(id: string, data: Partial<ActivityCreateData>): Promise<Activity> {
    return api.patch<Activity>(`/activities/${id}`, data).then((r) => r.data);
  },

  delete(id: string): Promise<void> {
    return api.delete(`/activities/${id}`).then(() => undefined);
  },
};
