import { api } from "@/lib/api";
import type {
  ERPInvoice,
  ERPInvoiceCreate,
  ERPInvoiceStatus,
  ERPInvoiceStats,
} from "@/types";

export const erpInvoicesService = {
  list(customer_id?: string, status_filter?: ERPInvoiceStatus): Promise<ERPInvoice[]> {
    const params: Record<string, string> = {};
    if (customer_id) params.customer_id = customer_id;
    if (status_filter) params.status_filter = status_filter;
    return api.get<ERPInvoice[]>("/erp-invoices", { params }).then((r) => r.data);
  },

  get(id: string): Promise<ERPInvoice> {
    return api.get<ERPInvoice>(`/erp-invoices/${id}`).then((r) => r.data);
  },

  getStats(): Promise<ERPInvoiceStats> {
    return api.get<ERPInvoiceStats>("/erp-invoices/stats").then((r) => r.data);
  },

  create(data: ERPInvoiceCreate): Promise<ERPInvoice> {
    return api.post<ERPInvoice>("/erp-invoices", data).then((r) => r.data);
  },

  update(id: string, data: Partial<ERPInvoiceCreate>): Promise<ERPInvoice> {
    return api.put<ERPInvoice>(`/erp-invoices/${id}`, data).then((r) => r.data);
  },

  updateStatus(id: string, status: ERPInvoiceStatus): Promise<ERPInvoice> {
    return api.patch<ERPInvoice>(`/erp-invoices/${id}/status`, { status }).then((r) => r.data);
  },

  delete(id: string): Promise<void> {
    return api.delete(`/erp-invoices/${id}`).then(() => undefined);
  },

  export(): Promise<Blob> {
    return api.get("/erp-invoices/export", { responseType: "blob" }).then((r) => r.data);
  },
};
