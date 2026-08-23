import { getSiteUrl } from "@/lib/site-url";

export type OutreachLinkParams = {
  leadId: string;
  touchId: string;
  campaign?: string;
  content?: string;
};

export function buildOutreachUrl({
  leadId,
  touchId,
  campaign = "se_websites_2026",
  content = "email_v1",
}: OutreachLinkParams) {
  const base = getSiteUrl();
  const params = new URLSearchParams({
    utm_source: "manual_outreach",
    utm_medium: "email",
    utm_campaign: campaign,
    utm_content: content,
    lead_id: leadId,
    touch_id: touchId,
  });
  return `${base}/?${params.toString()}`;
}
