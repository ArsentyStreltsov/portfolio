export const ANALYTICS_EVENTS = [
  "outreach_landing",
  "outreach_engaged",
  "page_viewed",
  "section_viewed",
  "scroll_depth",
  "project_opened",
  "live_demo_clicked",
  "cta_clicked",
  "brief_opened",
  "brief_step_viewed",
  "brief_step_completed",
  "brief_back_clicked",
  "brief_submitted",
  "brief_submit_error",
  "email_contact_clicked",
  "linkedin_clicked",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export type SectionId =
  | "hero"
  | "immersive_showcase"
  | "selected_work"
  | "about"
  | "process"
  | "final_cta"
  | "footer";

export type EventProperties = {
  lead_id?: string;
  touch_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  path?: string;
  page_title?: string;
  referrer?: string;
  section_id?: SectionId | string;
  percent?: number;
  project_slug?: string;
  project_category?: string;
  project_type?: string;
  cta_id?: string;
  cta_location?: string;
  destination?: string;
  step_number?: number;
  step_id?: string;
  landing_path?: string;
};

export type AttributionSnapshot = {
  lead_id?: string;
  touch_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};
