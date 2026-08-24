"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CopyButton } from "@/components/admin/CopyButton";
import {
  EMAIL_TEMPLATES,
  gmailComposeUrl,
  renderEmailTemplate,
  type EmailTemplateId,
} from "@/lib/crm/email-templates";
import { buildOutreachUrl } from "@/lib/crm/links";

type Touch = {
  touch_id: string;
  subject_variant: string | null;
  outreach_url: string;
  sent_at: string | null;
};

function initialTemplate(touch?: Touch | null): EmailTemplateId {
  const v = touch?.subject_variant;
  if (v === "cold_a" || v === "cold_b" || v === "followup_v1") return v;
  return "cold_a";
}

export function EmailDraft({
  leadId,
  businessName,
  contactName,
  email,
  campaign,
  touches,
}: {
  leadId: string;
  businessName: string;
  contactName: string | null;
  email: string | null;
  campaign: string | null;
  touches: Touch[];
}) {
  const router = useRouter();
  const primaryTouch = touches[0];
  const [templateId, setTemplateId] = useState<EmailTemplateId>(() => initialTemplate(primaryTouch));
  const [marking, setMarking] = useState(false);

  const outreachUrl = useMemo(() => {
    if (!primaryTouch) return "";
    return buildOutreachUrl({
      leadId,
      touchId: primaryTouch.touch_id,
      campaign: campaign ?? undefined,
      content: templateId,
      format: "short",
    });
  }, [leadId, primaryTouch, campaign, templateId]);

  const template = EMAIL_TEMPLATES.find((t) => t.id === templateId) ?? EMAIL_TEMPLATES[0]!;
  const draft = renderEmailTemplate(template, {
    business_name: businessName,
    contact_name: contactName,
    outreach_url: outreachUrl,
  });

  const gmailUrl =
    email && draft.subject ? gmailComposeUrl(email, draft.subject, draft.body) : null;

  const markSent = async () => {
    if (!primaryTouch || primaryTouch.sent_at) return;
    setMarking(true);
    try {
      await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          action: "mark_touch_sent",
          touch_id: primaryTouch.touch_id,
          subject_variant: templateId,
        }),
      });
      router.refresh();
    } finally {
      setMarking(false);
    }
  };

  if (!primaryTouch) {
    return (
      <section className="border border-border p-5">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-secondary">
          Email draft
        </h2>
        <p className="mt-3 text-sm text-text-secondary">Create a lead with an outreach link first.</p>
      </section>
    );
  }

  return (
    <section className="border border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-secondary">
            Email draft
          </h2>
          <p className="mt-1 text-xs text-text-secondary">
            A/B: switch variant — subject and body update together. The link stays short (
            <span className="font-mono">?lead_id=…</span> only); the variant is saved when you mark
            sent.
          </p>
        </div>
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value as EmailTemplateId)}
          className="border border-border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-text"
        >
          {EMAIL_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-text-secondary">
              To
            </span>
            {email ? <CopyButton text={email} label="Copy email" /> : null}
          </div>
          <p className="text-sm">{email || "— add email on the lead first"}</p>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-text-secondary">
              Subject
            </span>
            <CopyButton text={draft.subject} label="Copy subject" />
          </div>
          <p className="border border-border px-3 py-2 text-sm">{draft.subject}</p>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-text-secondary">
              Body
            </span>
            <CopyButton text={draft.body} label="Copy body" />
          </div>
          <pre className="whitespace-pre-wrap border border-border px-3 py-3 font-sans text-sm leading-relaxed">
            {draft.body}
          </pre>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <CopyButton text={`${draft.subject}\n\n${draft.body}`} label="Copy all" />
        {gmailUrl ? (
          <a
            href={gmailUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-text px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-bg"
          >
            Open in Gmail
          </a>
        ) : (
          <span className="border border-border px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.12em] text-text-secondary opacity-50">
            Open in Gmail (needs email)
          </span>
        )}
        {!primaryTouch.sent_at && (
          <button
            type="button"
            disabled={marking}
            onClick={markSent}
            className="border border-border px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] hover:border-text disabled:opacity-40"
          >
            {marking ? "…" : "Mark sent"}
          </button>
        )}
      </div>
    </section>
  );
}
