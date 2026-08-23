import type { LeadStatus } from "@/lib/crm/db";
import { statusClass, statusLabel } from "@/lib/crm/ui";

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] ${statusClass(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}
