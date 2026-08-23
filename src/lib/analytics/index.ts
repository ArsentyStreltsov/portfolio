import {
  applyLeadIdentity,
  bootstrapAttribution,
  canRunAnalytics,
  getPostHog,
  initAnalytics,
  isLocalhost,
  shutdownAnalytics,
} from "./client";
import { getConsentStatus, setConsentStatus, openAnalyticsPreferences, type ConsentStatus } from "./consent";
import type { AnalyticsEvent, EventProperties } from "./events";
import {
  getEventAttributionProps,
  getFirstAttribution,
  getLatestAttribution,
} from "./attribution";

export type { AnalyticsEvent, EventProperties, SectionId } from "./events";
export type { ConsentStatus } from "./consent";
export { getConsentStatus, setConsentStatus, openAnalyticsPreferences };
export {
  bootstrapAttribution,
  canRunAnalytics,
  initAnalytics,
  shutdownAnalytics,
  applyLeadIdentity,
  isLocalhost,
  getLatestAttribution,
  getFirstAttribution,
  getEventAttributionProps,
};

function debugLog(event: AnalyticsEvent, properties?: EventProperties) {
  if (process.env.NODE_ENV !== "development") return;
  // eslint-disable-next-line no-console
  console.debug(`[analytics] ${event}`, properties ?? {});
}

export function track(event: AnalyticsEvent, properties?: EventProperties) {
  const merged: EventProperties = {
    ...getEventAttributionProps(),
    path: typeof window !== "undefined" ? window.location.pathname : undefined,
    ...properties,
  };

  const clean = Object.fromEntries(
    Object.entries(merged).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  ) as EventProperties;

  debugLog(event, clean);

  if (!canRunAnalytics()) return;
  const ph = getPostHog();
  if (!ph) return;
  ph.capture(event, clean);
}

export function grantAnalyticsConsent() {
  setConsentStatus("granted");
  bootstrapAttribution();
  initAnalytics();
  applyLeadIdentity();
}

export function denyAnalyticsConsent() {
  setConsentStatus("denied");
  shutdownAnalytics();
}
