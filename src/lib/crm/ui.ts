import type { LeadStatus } from "@/lib/crm/db";

export const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "ready", label: "Ready to send" },
  { value: "sent", label: "Sent" },
  { value: "opened", label: "Opened link" },
  { value: "engaged", label: "Engaged" },
  { value: "replied", label: "Replied" },
  { value: "interested", label: "Interested" },
  { value: "brief_sent", label: "Brief submitted" },
  { value: "client", label: "Client" },
  { value: "lost", label: "Lost" },
];

export function statusLabel(status: LeadStatus) {
  return LEAD_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function statusClass(status: LeadStatus) {
  switch (status) {
    case "draft":
      return "bg-border text-text-secondary";
    case "ready":
      return "bg-blue-100 text-blue-900";
    case "sent":
      return "bg-amber-100 text-amber-900";
    case "opened":
      return "bg-orange-100 text-orange-900";
    case "engaged":
      return "bg-purple-100 text-purple-900";
    case "replied":
      return "bg-teal-100 text-teal-900";
    case "interested":
      return "bg-lime-100 text-lime-900";
    case "brief_sent":
      return "bg-accent/20 text-text";
    case "client":
      return "bg-green-100 text-green-900";
    case "lost":
      return "bg-red-100 text-red-900";
    default:
      return "bg-border text-text";
  }
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function dashboardUrl(params: { status?: string; q?: string; sort?: string }) {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.sort && params.sort !== "updated") sp.set("sort", params.sort);
  const qs = sp.toString();
  return qs ? `/admin/dashboard?${qs}` : "/admin/dashboard";
}

export function posthogPersonUrl(leadId: string) {
  const projectId = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID;
  if (!projectId) return null;
  const distinct = encodeURIComponent(`lead:${leadId}`);
  return `https://eu.posthog.com/project/${projectId}/person/${distinct}`;
}
