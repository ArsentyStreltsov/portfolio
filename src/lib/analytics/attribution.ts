import type { AttributionSnapshot } from "./events";

const ID_RE = /^[A-Za-z0-9_-]{1,50}$/;

const STORAGE_KEY = "portfolio_attribution_v1";
const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "lead_id",
  "touch_id",
] as const;

function sanitizeId(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!ID_RE.test(trimmed)) return undefined;
  return trimmed;
}

function sanitizeUtm(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, 120);
  if (!trimmed) return undefined;
  // Never treat as HTML — plain text only
  return trimmed.replace(/[<>]/g, "");
}

type StoredAttribution = {
  first: AttributionSnapshot;
  latest: AttributionSnapshot;
};

function readStored(): StoredAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAttribution;
  } catch {
    return null;
  }
}

function writeStored(data: StoredAttribution) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota / private mode
  }
}

export function parseAttributionFromSearch(search: string): AttributionSnapshot {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  return {
    lead_id: sanitizeId(params.get("lead_id")),
    touch_id: sanitizeId(params.get("touch_id")),
    utm_source: sanitizeUtm(params.get("utm_source")),
    utm_medium: sanitizeUtm(params.get("utm_medium")),
    utm_campaign: sanitizeUtm(params.get("utm_campaign")),
    utm_content: sanitizeUtm(params.get("utm_content")),
    utm_term: sanitizeUtm(params.get("utm_term")),
  };
}

function hasAny(snapshot: AttributionSnapshot) {
  return Object.values(snapshot).some(Boolean);
}

/** Capture URL attribution into session storage (first-touch never overwritten). */
export function captureAttributionFromUrl(): AttributionSnapshot | null {
  if (typeof window === "undefined") return null;

  const incoming = parseAttributionFromSearch(window.location.search);
  if (!hasAny(incoming)) {
    return getLatestAttribution();
  }

  const stored = readStored();
  const first = stored?.first && hasAny(stored.first) ? stored.first : { ...incoming };
  const latest: AttributionSnapshot = {
    ...stored?.latest,
    ...Object.fromEntries(
      Object.entries(incoming).filter(([, v]) => Boolean(v)),
    ),
  };

  writeStored({ first, latest });
  return latest;
}

export function getLatestAttribution(): AttributionSnapshot {
  return readStored()?.latest ?? {};
}

export function getFirstAttribution(): AttributionSnapshot {
  return readStored()?.first ?? {};
}

export function getEventAttributionProps(): AttributionSnapshot {
  const latest = getLatestAttribution();
  return {
    lead_id: latest.lead_id,
    touch_id: latest.touch_id,
    utm_source: latest.utm_source,
    utm_medium: latest.utm_medium,
    utm_campaign: latest.utm_campaign,
    utm_content: latest.utm_content,
    utm_term: latest.utm_term,
  };
}

/** Strip tracking params from the address bar without reload. */
export function cleanTrackingParamsFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of TRACKING_PARAMS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (!changed) return;
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", next);
}

export function leadDistinctId(leadId: string) {
  return `lead:${leadId}`;
}
