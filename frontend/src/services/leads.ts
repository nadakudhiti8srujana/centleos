import { api } from "@/lib/api";
import type {
  Lead,
  LeadHistory,
  LeadSource,
  LeadStage,
  PaginatedResponse,
  PipelineResponse,
} from "@/types";

export interface LeadCreateData {
  name: string;
  email?: string;
  phone?: string;
  source?: LeadSource;
  stage?: LeadStage;
  owner_id?: string;
  account_id?: string;
  contact_id?: string;
  lead_company?: string;
  notes?: string;
  referral_code?: string;
}

export interface LeadFilters {
  stage?: LeadStage;
  source?: LeadSource;
  owner_id?: string;
  account_id?: string;
  page?: number;
  page_size?: number;
}

export const leadsService = {
  list(filters: LeadFilters = {}): Promise<PaginatedResponse<Lead>> {
    return api.get<PaginatedResponse<Lead>>("/leads", { params: filters }).then((r) => r.data);
  },

  search(q: string, page = 1, page_size = 20): Promise<PaginatedResponse<Lead>> {
    return api
      .get<PaginatedResponse<Lead>>("/leads/search", { params: { q, page, page_size } })
      .then((r) => r.data);
  },

  get(id: string): Promise<Lead> {
    return api.get<Lead>(`/leads/${id}`).then((r) => r.data);
  },



  create(data: LeadCreateData): Promise<Lead> {
    const refCode = localStorage.getItem("centleos_ref_code");
    if (refCode && !data.referral_code) {
      data.referral_code = refCode;
    }
    return api.post<Lead>("/leads", data).then((r) => r.data);
  },

  update(id: string, data: Partial<LeadCreateData>): Promise<Lead> {
    return api.patch<Lead>(`/leads/${id}`, data).then((r) => r.data);
  },

  updateStage(id: string, stage?: LeadStage, custom_stage_id?: string): Promise<Lead> {
    return api.patch<Lead>(`/leads/${id}/stage`, { stage, custom_stage_id }).then((r) => r.data);
  },

  delete(id: string): Promise<void> {
    return api.delete(`/leads/${id}`).then(() => undefined);
  },

  history(id: string): Promise<LeadHistory[]> {
    return api.get<LeadHistory[]>(`/leads/${id}/history`).then((r) => r.data);
  },

  pipeline(): Promise<PipelineResponse> {
    return api.get<PipelineResponse>("/leads/pipeline").then((r) => r.data);
  },

  export(): Promise<Blob> {
    return api.get("/leads/export", { responseType: "blob" }).then((r) => r.data);
  },
};
