import { api } from "@/lib/api";
import type { Deal, DealStatus, PaginatedResponse } from "@/types";

export interface DealCreateData {
  name: string;
  deal_value?: number;
  probability?: number;
  expected_close_date?: string;
  status?: DealStatus;
  lead_id?: string;
  contact_id?: string;
  account_id?: string;
  owner_id?: string;
  notes?: string;
}

export interface DealFilters {
  status?: DealStatus;
  owner_id?: string;
  lead_id?: string;
  page?: number;
  page_size?: number;
}

export const dealsService = {
  list(filters: DealFilters = {}): Promise<PaginatedResponse<Deal>> {
    return api.get<PaginatedResponse<Deal>>("/deals", { params: filters }).then((r) => r.data);
  },

  get(id: string): Promise<Deal> {
    return api.get<Deal>(`/deals/${id}`).then((r) => r.data);
  },

  create(data: DealCreateData): Promise<Deal> {
    return api.post<Deal>("/deals", data).then((r) => r.data);
  },

  update(id: string, data: Partial<DealCreateData>): Promise<Deal> {
    return api.patch<Deal>(`/deals/${id}`, data).then((r) => r.data);
  },

  updateStatus(id: string, status: string): Promise<Deal> {
    return api.patch<Deal>(`/deals/${id}/status`, { status }).then((r) => r.data);
  },

  delete(id: string): Promise<void> {
    return api.delete(`/deals/${id}`).then(() => undefined);
  },

  export(): Promise<Blob> {
    return api.get("/deals/export", { responseType: "blob" }).then((r) => r.data);
  },
};
