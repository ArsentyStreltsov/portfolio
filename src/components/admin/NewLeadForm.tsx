"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { LeadStatus } from "@/lib/crm/db";
import { LEAD_STATUSES, statusLabel } from "@/lib/crm/ui";
import { LeadFromUrl } from "@/components/admin/LeadFromUrl";

type DuplicateMatch = {
  lead_id: string;
  business_name: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  reasons: string[];
};

export function NewLeadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [checkingDupes, setCheckingDupes] = useState(false);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const checkSeq = useRef(0);
  const [form, setForm] = useState({
    business_name: "",
    website: "",
    contact_name: "",
    email: "",
    phone: "",
    channel: "email",
    status: "ready" as LeadStatus,
    campaign: "se_websites_2026",
    subject_variant: "cold_a",
    notes: "",
  });

  useEffect(() => {
    setAllowDuplicate(false);
    const hasSignal =
      form.business_name.trim().length >= 3 ||
      form.website.trim().length >= 4 ||
      form.email.trim().includes("@") ||
      form.phone.replace(/[^\d]/g, "").length >= 7;

    if (!hasSignal) {
      setDuplicates([]);
      setCheckingDupes(false);
      return;
    }

    const seq = ++checkSeq.current;
    setCheckingDupes(true);
    const timer = window.setTimeout(async () => {
      try {
        const sp = new URLSearchParams();
        if (form.business_name.trim()) sp.set("business_name", form.business_name.trim());
        if (form.website.trim()) sp.set("website", form.website.trim());
        if (form.email.trim()) sp.set("email", form.email.trim());
        if (form.phone.trim()) sp.set("phone", form.phone.trim());
        const res = await fetch(`/api/admin/leads/duplicates?${sp.toString()}`);
        const data = (await res.json()) as { duplicates?: DuplicateMatch[] };
        if (seq !== checkSeq.current) return;
        setDuplicates(data.duplicates ?? []);
      } catch {
        if (seq !== checkSeq.current) return;
        // Keep previous duplicates on transient errors
      } finally {
        if (seq === checkSeq.current) setCheckingDupes(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [form.business_name, form.website, form.email, form.phone]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, allow_duplicate: allowDuplicate }),
      });
      const data = (await res.json()) as {
        error?: string;
        duplicates?: DuplicateMatch[];
        lead?: { lead: { lead_id: string } };
      };
      if (res.status === 409 && data.duplicates?.length) {
        setDuplicates(data.duplicates);
        setError("Possible duplicate — open the existing lead, or confirm create below.");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Could not create lead");
        return;
      }
      router.push(`/admin/leads/${data.lead!.lead.lead_id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const hasDuplicates = duplicates.length > 0;

  return (
    <div className="space-y-8">
      <LeadFromUrl
        onExtracted={(data) => {
          setForm((prev) => ({
            ...prev,
            business_name: data.business_name || prev.business_name,
            website: data.website || prev.website,
            contact_name: data.contact_name || prev.contact_name,
            email: data.email || prev.email,
            phone: data.phone || prev.phone,
          }));
        }}
      />

      <form onSubmit={submit} className="space-y-6">
        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {checkingDupes ? (
          <p className="text-xs text-text-secondary">Checking for existing leads…</p>
        ) : null}

        {hasDuplicates ? (
          <div
            className="border border-amber-700/40 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            <p className="font-semibold">Possible duplicate</p>
            <p className="mt-1 text-xs text-amber-900/80">
              You may already have this business in the CRM. Review before creating another lead.
            </p>
            <ul className="mt-3 space-y-2">
              {duplicates.map((d) => (
                <li key={d.lead_id} className="border border-amber-700/20 bg-white/60 px-3 py-2">
                  <Link
                    href={`/admin/leads/${d.lead_id}`}
                    className="font-medium underline hover:no-underline"
                  >
                    {d.business_name}
                  </Link>
                  <span className="ml-2 font-mono text-[0.65rem] text-amber-900/70">{d.lead_id}</span>
                  <p className="mt-1 text-xs text-amber-900/80">
                    {statusLabel(d.status)} · matched on {d.reasons.join(", ")}
                  </p>
                  <p className="mt-0.5 text-[0.65rem] text-amber-900/60">
                    {[d.website, d.email, d.phone].filter(Boolean).join(" · ") || "No contact fields"}
                  </p>
                </li>
              ))}
            </ul>
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={allowDuplicate}
                onChange={(e) => setAllowDuplicate(e.target.checked)}
                className="mt-0.5"
              />
              <span>I checked — create a new lead anyway</span>
            </label>
          </div>
        ) : null}

        <Field
          label="Business name *"
          value={form.business_name}
          onChange={(v) => setForm({ ...form, business_name: v })}
        />
        <Field
          label="Website"
          value={form.website}
          onChange={(v) => setForm({ ...form, website: v })}
          type="url"
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Contact name"
            value={form.contact_name}
            onChange={(v) => setForm({ ...form, contact_name: v })}
          />
          <Field
            label="Email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            type="email"
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field
            label="Channel"
            value={form.channel}
            onChange={(v) => setForm({ ...form, channel: v })}
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Campaign"
            value={form.campaign}
            onChange={(v) => setForm({ ...form, campaign: v })}
          />
          <div>
            <label className="block text-[0.75rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
              A/B variant (utm_content)
            </label>
            <select
              value={form.subject_variant}
              onChange={(e) => setForm({ ...form, subject_variant: e.target.value })}
              className="mt-2 w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-text"
            >
              <option value="cold_a">A — competitors subject</option>
              <option value="cold_b">B — 67% subject</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[0.75rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })}
            className="mt-2 w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-text"
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[0.75rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
            Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={5}
            className="mt-2 w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-text"
          />
        </div>

        <button
          type="submit"
          disabled={!form.business_name.trim() || saving || (hasDuplicates && !allowDuplicate)}
          className="bg-text text-bg px-6 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.12em] disabled:opacity-40"
        >
          {saving
            ? "Creating…"
            : hasDuplicates && allowDuplicate
              ? "Create anyway"
              : "Create lead + link"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[0.75rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border-b border-border bg-transparent py-2 text-sm outline-none focus:border-text"
      />
    </div>
  );
}
