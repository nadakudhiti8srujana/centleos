import { api } from "@/lib/api";
import type { PaginatedResponse } from "@/types";

export interface PipelineStage {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order_index: number;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineStageCreate {
  name: string;
  description?: string;
  color?: string;
  order_index: number;
}

export const pipelineStagesService = {
  list(): Promise<PaginatedResponse<PipelineStage>> {
    return api.get<PaginatedResponse<PipelineStage>>("/pipeline-stages").then((r) => r.data);
  },
  
  create(data: PipelineStageCreate): Promise<PipelineStage> {
    return api.post<PipelineStage>("/pipeline-stages", data).then((r) => r.data);
  },
  
  update(id: string, data: Partial<PipelineStageCreate>): Promise<PipelineStage> {
    return api.patch<PipelineStage>(`/pipeline-stages/${id}`, data).then((r) => r.data);
  },
  
  delete(id: string): Promise<void> {
    return api.delete(`/pipeline-stages/${id}`).then(() => undefined);
  }
};
