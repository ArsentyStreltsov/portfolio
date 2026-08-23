import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getDashboardStats, listLeads } from "@/lib/crm/leads";
import type { LeadStatus } from "@/lib/crm/db";
import { formatDate, LEAD_STATUSES } from "@/lib/crm/ui";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminDashboardPage({ searchParams }: Props) {
  const { status: statusFilter } = await searchParams;
  const validStatus = LEAD_STATUSES.some((s) => s.value === statusFilter)
    ? (statusFilter as LeadStatus)
    : undefined;

  const stats = getDashboardStats();
  const leads = listLeads(validStatus);

  const today = new Date().toISOString().slice(0, 10);
  const sentToday = leads.filter((l) => l.sent_at?.startsWith(today)).length;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-[-0.02em]">Pipeline</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {stats.total} leads · {sentToday} marked sent today
          </p>
        </div>
        <Link
          href="/admin/leads/new"
          className="bg-text text-bg px-5 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em]"
        >
          + New lead
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip href="/admin/dashboard" active={!validStatus} label="All" count={stats.total} />
        {LEAD_STATUSES.map((s) => {
          const count = stats.byStatus.find((b) => b.status === s.value)?.c ?? 0;
          if (count === 0 && validStatus !== s.value) return null;
          return (
            <FilterChip
              key={s.value}
              href={`/admin/dashboard?status=${s.value}`}
              active={validStatus === s.value}
              label={s.label}
              count={count}
            />
          );
        })}
      </div>

      {leads.length === 0 ? (
        <div className="border border-dashed border-border py-16 text-center">
          <p className="text-text-secondary">No leads yet.</p>
          <Link href="/admin/leads/new" className="mt-4 inline-block text-sm underline">
            Add your first business
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-text/[0.03] text-[0.65rem] uppercase tracking-[0.14em] text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-semibold">Business</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Sent</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.lead_id} className="border-b border-border last:border-0 hover:bg-text/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/leads/${lead.lead_id}`} className="font-medium hover:underline">
                      {lead.business_name}
                    </Link>
                    <p className="font-mono text-[0.65rem] text-text-secondary">{lead.lead_id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {lead.contact_name ?? "—"}
                    {lead.email ? <span className="block text-xs">{lead.email}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(lead.sent_at)}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(lead.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stats.recentEvents.length > 0 && (
        <section>
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-secondary">
            Recent activity
          </h2>
          <ul className="mt-4 space-y-2 border border-border p-4">
            {stats.recentEvents.map((ev) => (
              <li key={ev.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span>
                  {ev.lead_id ? (
                    <Link href={`/admin/leads/${ev.lead_id}`} className="font-mono text-xs hover:underline">
                      {ev.lead_id}
                    </Link>
                  ) : (
                    <span className="text-text-secondary">—</span>
                  )}{" "}
                  {ev.summary ?? ev.event_type}
                </span>
                <span className="text-xs text-text-secondary">{formatDate(ev.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stats.organicBriefs.length > 0 && (
        <section>
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-secondary">
            Briefs without outreach link
          </h2>
          <ul className="mt-4 space-y-3 border border-border p-4">
            {stats.organicBriefs.map((brief) => (
              <li key={brief.id} className="text-sm">
                <p className="font-medium">{brief.business_name ?? "Untitled"}</p>
                <p className="text-text-secondary">
                  {brief.contact_name} · {brief.contact_email} · {formatDate(brief.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`border px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] ${
        active ? "border-text bg-text text-bg" : "border-border text-text-secondary hover:border-text"
      }`}
    >
      {label} ({count})
    </Link>
  );
}
