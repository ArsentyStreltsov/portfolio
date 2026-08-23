import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadEditor } from "@/components/admin/LeadEditor";
import { TouchList } from "@/components/admin/TouchList";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getLeadByLeadId } from "@/lib/crm/leads";
import { formatDate, posthogPersonUrl } from "@/lib/crm/ui";

type Props = { params: Promise<{ leadId: string }> };

export default async function LeadDetailPage({ params }: Props) {
  const { leadId } = await params;
  const data = getLeadByLeadId(leadId);
  if (!data) notFound();

  const { lead, touches, events, briefs } = data;
  const phUrl = posthogPersonUrl(lead.lead_id);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/dashboard" className="text-xs uppercase tracking-[0.15em] text-text-secondary hover:text-text">
          ← Pipeline
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold uppercase">{lead.business_name}</h1>
          <StatusBadge status={lead.status} />
        </div>
        <p className="mt-2 font-mono text-sm text-text-secondary">{lead.lead_id}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-secondary">
          <span>Created {formatDate(lead.created_at)}</span>
          {lead.sent_at && <span>First sent {formatDate(lead.sent_at)}</span>}
          {phUrl && (
            <a href={phUrl} target="_blank" rel="noreferrer" className="underline hover:text-text">
              Open in PostHog →
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <LeadEditor leadId={lead.lead_id} initial={lead} />
        <TouchList leadId={lead.lead_id} touches={touches} />
      </div>

      {briefs.length > 0 && (
        <section className="border border-border p-5">
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-secondary">
            Brief submissions
          </h2>
          <ul className="mt-4 space-y-4">
            {briefs.map((brief) => {
              let payload: Record<string, unknown> = {};
              try {
                payload = JSON.parse(brief.payload) as Record<string, unknown>;
              } catch {
                // ignore
              }
              return (
                <li key={brief.id} className="border border-border p-4 text-sm">
                  <p className="font-medium">{brief.business_name ?? "Brief"}</p>
                  <p className="text-text-secondary">
                    {brief.contact_name} · {brief.contact_email} · {formatDate(brief.created_at)}
                  </p>
                  <dl className="mt-3 grid gap-1 text-xs text-text-secondary">
                    {Object.entries(payload).map(([k, v]) => (
                      <div key={k}>
                        <span className="uppercase tracking-wider">{k}: </span>
                        {Array.isArray(v) ? v.join(", ") : String(v ?? "")}
                      </div>
                    ))}
                  </dl>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="border border-border p-5">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-secondary">Timeline</h2>
        {events.length === 0 ? (
          <p className="mt-4 text-sm text-text-secondary">No events yet — send the link and wait for a visit.</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {events.map((ev) => (
              <li key={ev.id} className="flex gap-4 border-l-2 border-border pl-4">
                <time className="shrink-0 text-xs text-text-secondary">{formatDate(ev.created_at)}</time>
                <div>
                  <p className="text-sm">{ev.summary ?? ev.event_type}</p>
                  {ev.touch_id && <p className="font-mono text-[0.65rem] text-text-secondary">{ev.touch_id}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
