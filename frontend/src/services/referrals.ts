import { api } from "@/lib/api";
import type {
  ReferralLink,
  Referral,
  PayoutStats,
} from "@/types";

export interface ReferralLinkCreateData {
  code?: string;
  commission_rate?: number;
}

export const referralsService = {
  createLink(data: ReferralLinkCreateData): Promise<ReferralLink> {
    return api.post<ReferralLink>("/referrals/links", data).then((r) => r.data);
  },

  getLinks(): Promise<ReferralLink[]> {
    return api.get<ReferralLink[]>("/referrals/links").then((r) => r.data);
  },

  getReferrals(): Promise<Referral[]> {
    return api.get<Referral[]>("/referrals/payouts").then((r) => r.data);
  },

  getStats(): Promise<PayoutStats> {
    return api.get<PayoutStats>("/referrals/payouts/stats").then((r) => r.data);
  },

  approvePayout(id: string, amount?: number): Promise<Referral> {
    return api.post<Referral>(`/referrals/payouts/${id}/approve`, { amount }).then((r) => r.data);
  },

  rejectPayout(id: string): Promise<Referral> {
    return api.post<Referral>(`/referrals/payouts/${id}/reject`).then((r) => r.data);
  },

  approveReferral(id: string): Promise<Referral> {
    return api.post<Referral>(`/referrals/${id}/approve`).then((r) => r.data);
  },

  export(): Promise<Blob> {
    return api.get("/referrals/export", { responseType: "blob" }).then((r) => r.data);
  },

  markPaid(id: string): Promise<Referral> {
    return api.post<Referral>(`/referrals/payouts/${id}/pay`).then((r) => r.data);
  },

  deleteLink(id: string): Promise<void> {
    return api.delete(`/referrals/links/${id}`).then((r) => r.data);
  },
};
