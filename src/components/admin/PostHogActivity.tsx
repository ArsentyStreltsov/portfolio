import { formatDate } from "@/lib/crm/ui";
import type { PostHogLeadEvent } from "@/lib/posthog/query";

export function PostHogActivity({
  events,
  error,
  personUrl,
}: {
  events: PostHogLeadEvent[];
  error?: string;
  personUrl?: string | null;
}) {
  return (
    <section className="border border-border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-secondary">
          Behaviour (PostHog)
        </h2>
        {personUrl && (
          <a
            href={personUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[0.65rem] uppercase tracking-[0.12em] text-text-secondary underline hover:text-text"
          >
            Open in PostHog →
          </a>
        )}
      </div>

      {error === "not_configured" ? (
        <p className="mt-4 text-sm text-text-secondary">
          Add <code className="font-mono text-xs">POSTHOG_PERSONAL_API_KEY</code> and{" "}
          <code className="font-mono text-xs">POSTHOG_PROJECT_ID</code> on the server to pull live
          behaviour into this lead.
        </p>
      ) : error ? (
        <p className="mt-4 text-sm text-red-700">{error}</p>
      ) : events.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">
          No PostHog events yet — only appears after the visitor accepts cookies analytics.
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {events.map((ev, i) => (
            <li key={`${ev.timestamp}-${ev.event}-${i}`} className="flex gap-4 border-l-2 border-accent/40 pl-4">
              <time className="shrink-0 text-xs text-text-secondary">{formatDate(ev.timestamp)}</time>
              <div>
                <p className="text-sm">{ev.summary}</p>
                <p className="font-mono text-[0.6rem] text-text-secondary">{ev.event}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
