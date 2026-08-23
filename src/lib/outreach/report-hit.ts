import { parseAttributionFromSearch } from "@/lib/analytics/attribution";
import type { OutreachHitPayload } from "@/lib/outreach/validate";

const HIT_SENT_KEY = "portfolio_outreach_hit_sent_v1";

/**
 * Report a tagged email-link open to our server log.
 * Runs without analytics consent / PostHog / cookies for tracking identity.
 * Only fires when a valid lead_id is present in the URL (before cleanup).
 */
export function reportOutreachLinkHit() {
  if (typeof window === "undefined") return;

  const fromUrl = parseAttributionFromSearch(window.location.search);
  if (!fromUrl.lead_id) return;

  const payload: OutreachHitPayload = {
    lead_id: fromUrl.lead_id,
    touch_id: fromUrl.touch_id,
    utm_source: fromUrl.utm_source,
    utm_medium: fromUrl.utm_medium,
    utm_campaign: fromUrl.utm_campaign,
    utm_content: fromUrl.utm_content,
    utm_term: fromUrl.utm_term,
    path: window.location.pathname || "/",
  };

  const dedupe = `${payload.lead_id}|${payload.touch_id ?? ""}`;
  try {
    const prev = sessionStorage.getItem(HIT_SENT_KEY);
    if (prev === dedupe) return;
    sessionStorage.setItem(HIT_SENT_KEY, dedupe);
  } catch {
    // private mode — still send once this load
  }

  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/outreach-hit", blob);
      return;
    }
  } catch {
    // fall through
  }

  void fetch("/api/outreach-hit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    credentials: "omit",
  }).catch(() => {});
}
