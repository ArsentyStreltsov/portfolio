import { StatusBadge } from "@/components/admin/StatusBadge";
import type { LeadStatus } from "@/lib/crm/db";

const GUIDE: {
  status: LeadStatus;
  meaning: string;
  when: string;
  auto?: boolean;
}[] = [
  {
    status: "draft",
    meaning: "Optional — rarely used.",
    when: "You can still set it manually if needed.",
  },
  {
    status: "ready",
    meaning: "Ready to copy the link and send.",
    when: "Default when you add a business.",
  },
  {
    status: "sent",
    meaning: "Email sent with outreach link.",
    when: 'Click "Mark sent" on a link — or set manually.',
    auto: true,
  },
  {
    status: "opened",
    meaning: "They opened your outreach link.",
    when: "Automatic when the link is visited (no cookies needed).",
    auto: true,
  },
  {
    status: "engaged",
    meaning: "They scrolled, clicked, or spent time on the site.",
    when: "Automatic from PostHog after they accept cookies.",
    auto: true,
  },
  {
    status: "replied",
    meaning: "They replied to your email.",
    when: "Set manually when you get a reply.",
  },
  {
    status: "interested",
    meaning: "Warm lead — wants to talk or move forward.",
    when: "Set manually after a positive reply.",
  },
  {
    status: "brief_sent",
    meaning: "They submitted the brief form on /start.",
    when: "Automatic if they came from your outreach link.",
    auto: true,
  },
  {
    status: "client",
    meaning: "Became a client.",
    when: "Set manually when you close the deal.",
  },
  {
    status: "lost",
    meaning: "No fit or no response — archive.",
    when: "Set manually when you stop pursuing.",
  },
];

export function StatusGuide() {
  return (
    <details className="border border-border bg-text/[0.02] text-sm">
      <summary className="cursor-pointer select-none px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-text-secondary hover:text-text">
        Status guide — what each means &amp; when it changes
      </summary>
      <div className="border-t border-border px-4 py-3">
        <p className="mb-3 text-xs text-text-secondary">
          Auto statuses never go backwards. Later stages (replied, client…) you set yourself.
        </p>
        <ul className="space-y-2.5">
          {GUIDE.map((row) => (
            <li key={row.status} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <StatusBadge status={row.status} />
              {row.auto && (
                <span className="text-[0.6rem] uppercase tracking-[0.1em] text-text-secondary">auto</span>
              )}
              <span className="text-text-secondary">
                {row.meaning}
                <span className="text-text-muted"> · </span>
                <span className="text-text-muted">{row.when}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
