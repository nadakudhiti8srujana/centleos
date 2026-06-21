export type UserRole =
  | "super_admin"
  | "company_admin"
  | "sales_representative"
  | "ambassador"
  | "user";

export type LeadSource = "organic" | "referral" | "event" | "website" | "ads";

export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type ActivityType = "call" | "email" | "meeting" | "note";

export type DealStatus = "open" | "won" | "lost";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  company_id?: string | null;
  company_name?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  is_verified: boolean;
  last_login_at?: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface OwnerSummary {
  id: string;
  full_name: string;
  email: string;
}

export interface Lead {
  id: string;
  company_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source: LeadSource;
  stage: LeadStage;
  owner_id?: string | null;
  account_id?: string | null;
  contact_id?: string | null;
  lead_company?: string | null;
  notes?: string | null;
  ai_score?: number | null;
  ai_next_action?: string | null;
  custom_stage_id?: string | null;
  created_at: string;
  updated_at: string;
  owner?: OwnerSummary | null;
}

export interface LeadHistory {
  id: string;
  lead_id: string;
  field_changed: string;
  old_value?: string | null;
  new_value?: string | null;
  changed_by?: string | null;
  created_at: string;
}

export interface PipelineStageColumn {
  stage: string;
  stage_id?: string;
  color?: string;
  count: number;
  leads: Lead[];
}

export interface PipelineResponse {
  stages: PipelineStageColumn[];
  total_leads: number;
}

export interface Contact {
  id: string;
  company_id: string;
  account_id?: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  job_title?: string | null;
  contact_company?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  company_id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  company_id: string;
  name: string;
  deal_value: string;
  probability: number;
  expected_close_date?: string | null;
  status: DealStatus;
  lead_id?: string | null;
  contact_id?: string | null;
  account_id?: string | null;
  owner_id?: string | null;
  notes?: string | null;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
  owner?: OwnerSummary | null;
}

export interface Activity {
  id: string;
  company_id: string;
  lead_id?: string | null;
  contact_id?: string | null;
  deal_id?: string | null;
  activity_type: ActivityType;
  title: string;
  description?: string | null;
  scheduled_at?: string | null;
  completed_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  creator?: { id: string; full_name: string; email: string } | null;
}

export interface ActivityTimeline {
  lead_id: string;
  total: number;
  activities: Activity[];
}

export const LEAD_STAGES: LeadStage[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
];

export const LEAD_SOURCES: LeadSource[] = [
  "organic",
  "referral",
  "event",
  "website",
  "ads",
];

export const ACTIVITY_TYPES: ActivityType[] = ["call", "email", "meeting", "note"];

export const DEAL_STATUSES: DealStatus[] = ["open", "won", "lost"];

export const STAGE_LABELS: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export const STAGE_COLORS: Record<LeadStage, string> = {
  new: "bg-slate-100 text-slate-700",
  contacted: "bg-blue-100 text-blue-700",
  qualified: "bg-indigo-100 text-indigo-700",
  proposal: "bg-purple-100 text-purple-700",
  negotiation: "bg-amber-100 text-amber-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-red-100 text-red-700",
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
  organic: "Organic",
  referral: "Referral",
  event: "Event",
  website: "Website",
  ads: "Ads",
};

export const STATUS_LABELS: Record<DealStatus, string> = {
  open: "Open",
  won: "Won",
  lost: "Lost",
};

export const WORKSPACE_SLUGS = [
  { slug: "skill-tank", name: "Skill Tank" },
  { slug: "maceco", name: "Maceco" },
  { slug: "tobofu", name: "Tobofu" },
  { slug: "saasum", name: "Saasum" },
  { slug: "promtal", name: "Promtal" },
  { slug: "vriddhi", name: "Vriddhi" },
];

export type ReferralPayoutStatus = "pending" | "approved" | "paid" | "rejected";

export interface ReferralLink {
  id: string;
  company_id: string;
  ambassador_id: string;
  code: string;
  url: string;
  click_count: number;
  lead_count: number;
  conversion_count: number;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  company_id: string;
  referral_link_id: string;
  ambassador_id: string;
  lead_id?: string | null;
  customer_id?: string | null;
  deal_id?: string | null;
  commission_amount: number;
  payout_status: ReferralPayoutStatus;
  converted_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
  created_at: string;
  ambassador?: User | null;
}

export interface PayoutStats {
  pending_commission: number;
  approved_commission: number;
  paid_commission: number;
}

export type ERPInvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface ERPInvoiceItem {
  id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total?: number;
}

export interface ERPInvoice {
  id: string;
  company_id: string;
  customer_id: string;
  deal_id?: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total_amount: number;
  status: ERPInvoiceStatus;
  items: ERPInvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface ERPInvoiceCreate {
  customer_id: string;
  deal_id?: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  items: Omit<ERPInvoiceItem, 'id' | 'total'>[];
}

export interface ERPInvoiceStats {
  total_invoices: number;
  paid_invoices: number;
  pending_invoices: number;
  revenue_collected: number;
}
