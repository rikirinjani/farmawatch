export type UserRole = "user" | "admin" | "superadmin";
export type UserStatus = "pending" | "approved" | "rejected";
export type TicketStatus =
  | "submitted"
  | "accepted"
  | "under_review"
  | "resolved"
  | "rejected";
export type TaggingMethod = "ai" | "fallback";

export interface Profile {
  id: string;
  full_name: string;
  province: string;
  city: string;
  whatsapp: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface TicketCategory {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface RejectionReason {
  id: string;
  label: string;
  is_active: boolean;
  created_at: string;
}

export interface Ticket {
  id: string;
  submitted_by: string | null;
  is_anonymous: boolean;
  category_id: string;
  province: string;
  city: string;
  description: string;
  drug_product: string | null;
  image_urls: string[];
  hyperlinks: string[] | null;
  status: TicketStatus;
  rejection_reason_id: string | null;
  ai_summary: string | null;
  ai_tags: string[] | null;
  tagging_method: TaggingMethod | null;
  accepted_by: string | null;
  accepted_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: TicketCategory;
  rejection_reason?: RejectionReason;
  submitter?: Profile;
  acceptor?: Profile;
  resolver?: Profile;
}

export interface Province {
  name: string;
  cities: string[];
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  submitted: "Terkirim",
  accepted: "Diterima",
  under_review: "Dalam Peninjauan",
  resolved: "Selesai",
  rejected: "Ditolak",
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  submitted: "badge-submitted",
  accepted: "badge-accepted",
  under_review: "badge-review",
  resolved: "badge-resolved",
  rejected: "badge-rejected",
};
