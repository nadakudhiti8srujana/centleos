import { api } from "@/lib/api";
import type { Contact, PaginatedResponse } from "@/types";

export interface ContactCreateData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  job_title?: string;
  contact_company?: string;
  account_id?: string;
  address?: string;
  notes?: string;
}

export const contactsService = {
  list(page = 1, page_size = 20): Promise<PaginatedResponse<Contact>> {
    return api
      .get<PaginatedResponse<Contact>>("/contacts", { params: { page, page_size } })
      .then((r) => r.data);
  },

  search(q: string, page = 1, page_size = 20): Promise<PaginatedResponse<Contact>> {
    return api
      .get<PaginatedResponse<Contact>>("/contacts/search", { params: { q, page, page_size } })
      .then((r) => r.data);
  },

  get(id: string): Promise<Contact> {
    return api.get<Contact>(`/contacts/${id}`).then((r) => r.data);
  },



  create(data: ContactCreateData): Promise<Contact> {
    return api.post<Contact>("/contacts", data).then((r) => r.data);
  },

  update(id: string, data: Partial<ContactCreateData>): Promise<Contact> {
    return api.patch<Contact>(`/contacts/${id}`, data).then((r) => r.data);
  },

  delete(id: string): Promise<void> {
    return api.delete(`/contacts/${id}`).then(() => undefined);
  },

  export(): Promise<Blob> {
    return api.get("/contacts/export", { responseType: "blob" }).then((r) => r.data);
  },
};
