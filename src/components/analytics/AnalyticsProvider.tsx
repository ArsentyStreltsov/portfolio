"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  applyLeadIdentity,
  bootstrapAttribution,
  denyAnalyticsConsent,
  getConsentStatus,
  getLatestAttribution,
  grantAnalyticsConsent,
  initAnalytics,
  track,
  type ConsentStatus,
} from "@/lib/analytics";
import { reportOutreachLinkHit } from "@/lib/outreach/report-hit";
import { ConsentBanner } from "./ConsentBanner";

const ENGAGED_KEY = "portfolio_outreach_engaged_v1";
const LANDING_KEY = "portfolio_outreach_landing_v1";
const SCROLL_KEY = "portfolio_scroll_depth_v1";

function markOnce(key: string) {
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    return true;
  } catch {
    return true;
  }
}

function useScrollDepth(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const fired = new Set<number>();
    try {
      const raw = sessionStorage.getItem(SCROLL_KEY);
      if (raw) (JSON.parse(raw) as number[]).forEach((n) => fired.add(n));
    } catch {
      // ignore
    }

    const thresholds = [25, 50, 75, 90];

    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const percent = Math.round((window.scrollY / scrollable) * 100);

      for (const t of thresholds) {
        if (percent >= t && !fired.has(t)) {
          fired.add(t);
          try {
            sessionStorage.setItem(SCROLL_KEY, JSON.stringify([...fired]));
          } catch {
            // ignore
          }
          track("scroll_depth", { percent: t });
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled]);
}

function useOutreachEngagement(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    let visibleForMs = 0;
    let lastTick = Date.now();
    let interacted = false;
    let engaged = false;

    try {
      if (sessionStorage.getItem(ENGAGED_KEY)) return;
    } catch {
      // ignore
    }

    const tryFire = () => {
      if (engaged) return;
      if (visibleForMs < 3000 || !interacted) return;
      engaged = true;
      try {
        sessionStorage.setItem(ENGAGED_KEY, "1");
      } catch {
        // ignore
      }
      track("outreach_engaged");
    };

    const onVisibility = () => {
      lastTick = Date.now();
    };

    const tick = () => {
      const now = Date.now();
      if (document.visibilityState === "visible") {
        visibleForMs += now - lastTick;
      }
      lastTick = now;
      tryFire();
    };

    const onInteract = () => {
      interacted = true;
      tryFire();
    };

    const interval = window.setInterval(tick, 500);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("scroll", onInteract, { passive: true, once: true });
    window.addEventListener("pointermove", onInteract, { passive: true, once: true });
    window.addEventListener("pointerdown", onInteract, { passive: true, once: true });
    window.addEventListener("touchstart", onInteract, { passive: true, once: true });
    window.addEventListener("keydown", onInteract, { once: true });

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onInteract);
      window.removeEventListener("pointermove", onInteract);
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
  }, [enabled]);
}

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    bootstrapAttribution();
    applyLeadIdentity();

    const path = pathname || "/";
    if (lastPath.current === path) return;
    lastPath.current = path;

    track("page_viewed", {
      path,
      page_title: typeof document !== "undefined" ? document.title : undefined,
    });

    const attr = getLatestAttribution();
    if (attr.lead_id && markOnce(`${LANDING_KEY}:${attr.lead_id}:${attr.touch_id ?? "na"}`)) {
      track("outreach_landing", {
        landing_path: path,
        referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

function AnalyticsInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const [consent, setConsent] = useState<ConsentStatus>("unknown");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setReady(true);
      return;
    }

    // Campaign link hit: server log only, no PostHog / no consent required.
    // Must run before URL tracking params are stripped.
    reportOutreachLinkHit();
    bootstrapAttribution();
    const status = getConsentStatus();
    setConsent(status);
    if (status === "granted") {
      initAnalytics();
      applyLeadIdentity();
    }
    setReady(true);

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ status: ConsentStatus }>).detail;
      setConsent(detail.status);
    };
    window.addEventListener("analytics_consent_changed", onChange);
    const onOpenPrefs = () => setConsent("unknown");
    window.addEventListener("analytics_open_preferences", onOpenPrefs);
    return () => {
      window.removeEventListener("analytics_consent_changed", onChange);
      window.removeEventListener("analytics_open_preferences", onOpenPrefs);
    };
  }, [isAdmin]);

  const active = ready && !isAdmin && consent === "granted";
  useScrollDepth(active);
  useOutreachEngagement(active);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {active ? (
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
      ) : null}
      {children}
      {ready ? (
        <ConsentBanner
          status={consent}
          onAccept={() => {
            grantAnalyticsConsent();
            setConsent("granted");
            const attr = getLatestAttribution();
            track("page_viewed", {
              path: window.location.pathname,
              page_title: document.title,
            });
            if (attr.lead_id && markOnce(`${LANDING_KEY}:${attr.lead_id}:${attr.touch_id ?? "na"}`)) {
              track("outreach_landing", {
                landing_path: window.location.pathname,
                referrer: document.referrer || undefined,
              });
            }
          }}
          onReject={() => {
            denyAnalyticsConsent();
            setConsent("denied");
          }}
        />
      ) : null}
    </>
  );
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <AnalyticsInner>{children}</AnalyticsInner>
    </Suspense>
  );
}
