import { leadDistinctId } from "@/lib/analytics/attribution";

export type PostHogLeadEvent = {
  event: string;
  timestamp: string;
  pathname?: string;
  percent?: number;
  section_id?: string;
  summary: string;
};

type QueryRow = [string, string, string | null, number | null, string | null];

function eventSummary(event: string, pathname?: string | null, percent?: number | null, section?: string | null) {
  switch (event) {
    case "outreach_landing":
      return "Landed from outreach link";
    case "outreach_engaged":
      return "Engaged (scrolled / interacted)";
    case "page_viewed":
      return pathname ? `Page viewed: ${pathname}` : "Page viewed";
    case "scroll_depth":
      return percent != null ? `Scrolled ${percent}%` : "Scroll depth";
    case "section_viewed":
      return section ? `Viewed section: ${section}` : "Section viewed";
    case "project_opened":
      return "Opened a project";
    case "cta_clicked":
      return "Clicked CTA";
    case "brief_opened":
      return "Opened brief form";
    case "brief_submitted":
      return "Submitted brief";
    case "brief_step_viewed":
      return "Brief step viewed";
    case "brief_step_completed":
      return "Brief step completed";
    default:
      return event.replace(/_/g, " ");
  }
}

function apiHost() {
  const ingest = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
  // Ingest host is eu.i.posthog.com; Query API lives on eu.posthog.com
  if (ingest.includes("eu.i.posthog.com") || ingest.includes("eu.posthog.com")) {
    return "https://eu.posthog.com";
  }
  if (ingest.includes("us.i.posthog.com") || ingest.includes("us.posthog.com")) {
    return "https://us.posthog.com";
  }
  return ingest.replace("://i.", "://").replace(/\/$/, "");
}

export function isPostHogQueryConfigured() {
  return Boolean(
    process.env.POSTHOG_PERSONAL_API_KEY &&
      (process.env.POSTHOG_PROJECT_ID || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID),
  );
}

export async function fetchLeadPostHogEvents(leadId: string): Promise<{
  events: PostHogLeadEvent[];
  error?: string;
}> {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID;

  if (!key || !projectId) {
    return { events: [], error: "not_configured" };
  }

  // lead_id is always opaque alphanumeric from our generator
  if (!/^[A-Za-z0-9_-]{1,50}$/.test(leadId)) {
    return { events: [], error: "invalid_lead" };
  }

  const distinct = leadDistinctId(leadId);
  const hogql = `
SELECT
  event,
  timestamp,
  properties.$pathname AS pathname,
  properties.percent AS percent,
  properties.section_id AS section_id
FROM events
WHERE
  distinct_id = '${distinct}'
  OR properties.lead_id = '${leadId}'
ORDER BY timestamp DESC
LIMIT 50
`.trim();

  try {
    const res = await fetch(`${apiHost()}/api/projects/${projectId}/query/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query: hogql,
        },
      }),
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        events: [],
        error: `PostHog API ${res.status}${text ? `: ${text.slice(0, 120)}` : ""}`,
      };
    }

    const data = (await res.json()) as { results?: QueryRow[] };
    const events: PostHogLeadEvent[] = (data.results ?? []).map((row) => {
      const [event, timestamp, pathname, percent, section_id] = row;
      return {
        event,
        timestamp,
        pathname: pathname ?? undefined,
        percent: percent ?? undefined,
        section_id: section_id ?? undefined,
        summary: eventSummary(event, pathname, percent, section_id),
      };
    });

    return { events };
  } catch (e) {
    return {
      events: [],
      error: e instanceof Error ? e.message : "PostHog request failed",
    };
  }
}

/** Map PostHog signals → CRM status upgrade (never downgrade past engaged). */
export function suggestedStatusFromPostHog(
  current: string,
  events: PostHogLeadEvent[],
): "engaged" | "brief_sent" | null {
  const names = new Set(events.map((e) => e.event));
  if (names.has("brief_submitted")) return "brief_sent";
  if (names.has("outreach_engaged") || names.has("scroll_depth") || names.has("project_opened")) {
    if (current === "draft" || current === "ready" || current === "sent" || current === "opened") {
      return "engaged";
    }
  }
  return null;
}
