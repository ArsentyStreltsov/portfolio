type EventName =
  | "hero_view_work_click"
  | "project_open"
  | "live_demo_open"
  | "start_project_click"
  | "brief_start"
  | "brief_complete"
  | "email_click";

export function track(event: EventName, data?: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("portfolio_event", { detail: { event, ...data } }));
  } catch {}
}
