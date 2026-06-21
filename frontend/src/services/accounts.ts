import { api } from "@/lib/api";
import type { Account, PaginatedResponse } from "@/types";

export interface AccountCreateData {
  name: string;
  website?: string;
  industry?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
}

export const accountsService = {
  list(page = 1, page_size = 20): Promise<PaginatedResponse<Account>> {
    return api
      .get<PaginatedResponse<Account>>("/accounts", { params: { page, page_size } })
      .then((r) => r.data);
  },

  search(q: string, page = 1, page_size = 20): Promise<PaginatedResponse<Account>> {
    return api
      .get<PaginatedResponse<Account>>("/accounts/search", { params: { q, page, page_size } })
      .then((r) => r.data);
  },

  get(id: string): Promise<Account> {
    return api.get<Account>(`/accounts/${id}`).then((r) => r.data);
  },

  create(data: AccountCreateData): Promise<Account> {
    return api.post<Account>("/accounts", data).then((r) => r.data);
  },

  update(id: string, data: Partial<AccountCreateData>): Promise<Account> {
    return api.patch<Account>(`/accounts/${id}`, data).then((r) => r.data);
  },

  delete(id: string): Promise<void> {
    return api.delete(`/accounts/${id}`).then(() => undefined);
  },
};
