"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CopyButton } from "@/components/admin/CopyButton";
import { buildOutreachUrl } from "@/lib/crm/links";
import { formatDate } from "@/lib/crm/ui";

type Touch = {
  touch_id: string;
  subject_variant: string | null;
  outreach_url: string;
  sent_at: string | null;
  created_at: string;
};

export function TouchList({
  leadId,
  campaign,
  touches,
}: {
  leadId: string;
  campaign?: string | null;
  touches: Touch[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const action = async (body: Record<string, unknown>) => {
    setLoading(String(body.action));
    try {
      await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, ...body }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4 border border-border p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-secondary">
            Outreach links
          </h2>
          <p className="mt-1 text-[0.65rem] text-text-secondary">
            Short = lead_id only. Full adds touch + UTM (optional).
          </p>
        </div>
        <button
          type="button"
          disabled={loading === "new_touch"}
          onClick={() => action({ action: "new_touch" })}
          className="border border-border px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] hover:border-text disabled:opacity-40"
        >
          + Follow-up link
        </button>
      </div>

      <ul className="space-y-4">
        {touches.map((touch) => {
          const shortUrl = buildOutreachUrl({
            leadId,
            touchId: touch.touch_id,
            campaign: campaign ?? undefined,
            content: touch.subject_variant ?? undefined,
            format: "short",
          });
          const fullUrl = buildOutreachUrl({
            leadId,
            touchId: touch.touch_id,
            campaign: campaign ?? undefined,
            content: touch.subject_variant ?? undefined,
            format: "full",
          });

          return (
            <li key={touch.touch_id} className="border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm">{touch.touch_id}</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {touch.subject_variant ?? "—"} · created {formatDate(touch.created_at)}
                    {touch.sent_at ? ` · sent ${formatDate(touch.sent_at)}` : " · not marked sent"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CopyButton text={shortUrl} label="Copy short" />
                  <CopyButton text={fullUrl} label="Copy full" />
                  {!touch.sent_at && (
                    <button
                      type="button"
                      disabled={loading === "mark_touch_sent"}
                      onClick={() => action({ action: "mark_touch_sent", touch_id: touch.touch_id })}
                      className="bg-text text-bg px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] disabled:opacity-40"
                    >
                      Mark sent
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-3 break-all font-mono text-[0.65rem] text-text-secondary">{shortUrl}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
