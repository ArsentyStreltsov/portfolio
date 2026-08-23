/** Shared outreach ID / UTM sanitizers (safe on server + client). */

const ID_RE = /^[A-Za-z0-9_-]{1,50}$/;

export function sanitizeOutreachId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!ID_RE.test(trimmed)) return undefined;
  return trimmed;
}

export function sanitizeOutreachUtm(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, 120).replace(/[<>]/g, "");
  return trimmed || undefined;
}

export type OutreachHitPayload = {
  lead_id: string;
  touch_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  path?: string;
};
