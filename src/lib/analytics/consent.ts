export type ConsentStatus = "granted" | "denied" | "unknown";

const CONSENT_KEY = "portfolio_analytics_consent_v1";

export function getConsentStatus(): ConsentStatus {
  if (typeof window === "undefined") return "unknown";
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    if (value === "granted" || value === "denied") return value;
  } catch {
    // ignore
  }
  return "unknown";
}

export function setConsentStatus(status: "granted" | "denied") {
  try {
    localStorage.setItem(CONSENT_KEY, status);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent("analytics_consent_changed", { detail: { status } }));
}

/** Re-open the consent banner (e.g. from footer link). */
export function openAnalyticsPreferences() {
  window.dispatchEvent(new CustomEvent("analytics_open_preferences"));
}
