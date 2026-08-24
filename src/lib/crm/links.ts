import { getSiteUrl } from "@/lib/site-url";

export type OutreachLinkFormat = "short" | "full";

export type OutreachLinkParams = {
  leadId: string;
  touchId: string;
  campaign?: string;
  content?: string;
  format?: OutreachLinkFormat;
};

/**
 * Short (default): only lead_id — enough for CRM, ntfy, PostHog identity, briefs.
 * Full: adds touch_id + utm_* for PostHog / multi-touch breakdowns.
 */
export function buildOutreachUrl({
  leadId,
  touchId,
  campaign = "se_websites_2026",
  content = "cold_a",
  format = "short",
}: OutreachLinkParams) {
  const base = getSiteUrl();
  const params = new URLSearchParams();

  if (format === "full") {
    params.set("utm_source", "manual_outreach");
    params.set("utm_medium", "email");
    params.set("utm_campaign", campaign);
    params.set("utm_content", content);
    params.set("touch_id", touchId);
  }

  params.set("lead_id", leadId);

  return `${base}/?${params.toString()}`;
}
