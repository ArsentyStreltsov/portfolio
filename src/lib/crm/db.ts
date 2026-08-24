export type LeadStatus =
  | "draft"
  | "ready"
  | "sent"
  | "opened"
  | "engaged"
  | "replied"
  | "interested"
  | "brief_sent"
  | "client"
  | "lost";

export type LeadRow = {
  id: number;
  lead_id: string;
  business_name: string;
  website: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  channel: string | null;
  status: LeadStatus;
  campaign: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
};

export type TouchRow = {
  id: number;
  lead_id: string;
  touch_id: string;
  subject_variant: string | null;
  outreach_url: string;
  sent_at: string | null;
  created_at: string;
};

export type EventRow = {
  id: number;
  lead_id: string | null;
  touch_id: string | null;
  event_type: string;
  summary: string | null;
  payload: string | null;
  created_at: string;
};

export type BriefRow = {
  id: number;
  lead_id: string | null;
  business_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  payload: string;
  created_at: string;
};

export function nowIso() {
  return new Date().toISOString();
}
