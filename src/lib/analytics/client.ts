import posthog from "posthog-js";
import {
  captureAttributionFromUrl,
  cleanTrackingParamsFromUrl,
  getFirstAttribution,
  getLatestAttribution,
  leadDistinctId,
} from "./attribution";
import { getConsentStatus } from "./consent";

let initialized = false;

export function isLocalhost() {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
}

export function canRunAnalytics() {
  if (typeof window === "undefined") return false;
  if (isLocalhost()) return false;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return false;
  if (!process.env.NEXT_PUBLIC_POSTHOG_HOST) return false;
  return getConsentStatus() === "granted";
}

export function initAnalytics() {
  if (typeof window === "undefined") return false;
  if (!canRunAnalytics()) return false;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY!;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST!;

  if (initialized) {
    try {
      posthog.opt_in_capturing();
    } catch {
      // ignore
    }
    applyLeadIdentity();
    return true;
  }

  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: false,
    persistence: "localStorage+cookie",
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "input, textarea, [data-ph-mask], .ph-mask",
      recordCrossOriginIframes: false,
    },
    disable_session_recording: false,
    loaded: (ph) => {
      ph.register({ app: "arsenty-portfolio" });
    },
  });

  initialized = true;
  applyLeadIdentity();
  return true;
}

export function applyLeadIdentity() {
  if (!initialized) return;
  const latest = getLatestAttribution();
  const first = getFirstAttribution();

  if (latest.lead_id) {
    posthog.identify(leadDistinctId(latest.lead_id), {
      lead_id: latest.lead_id,
      first_utm_source: first.utm_source,
      first_utm_medium: first.utm_medium,
      first_utm_campaign: first.utm_campaign,
      first_utm_content: first.utm_content,
    });
  }

  posthog.register({
    lead_id: latest.lead_id,
    touch_id: latest.touch_id,
    source: latest.utm_source,
    medium: latest.utm_medium,
    campaign: latest.utm_campaign,
    content: latest.utm_content,
    first_source: first.utm_source,
    first_medium: first.utm_medium,
    first_campaign: first.utm_campaign,
    first_content: first.utm_content,
  });
}

export function shutdownAnalytics() {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  try {
    posthog.opt_out_capturing();
    posthog.stopSessionRecording?.();
  } catch {
    // ignore
  }
}

export function getPostHog() {
  return initialized ? posthog : null;
}

/** Capture attribution + optionally clean URL. Call on every landing. */
export function bootstrapAttribution() {
  captureAttributionFromUrl();
  cleanTrackingParamsFromUrl();
}
