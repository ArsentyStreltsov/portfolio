"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LeadStatus } from "@/lib/crm/db";
import { LEAD_STATUSES } from "@/lib/crm/ui";
import { LeadFromUrl } from "@/components/admin/LeadFromUrl";

export function NewLeadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    email: "",
    phone: "",
    channel: "email",
    status: "ready" as LeadStatus,
    campaign: "se_websites_2026",
    subject_variant: "email_v1",
    notes: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string; lead?: { lead: { lead_id: string } } };
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

  return (
    <div className="space-y-8">
      <LeadFromUrl
        onExtracted={(data) => {
          setForm((prev) => ({
            ...prev,
            business_name: data.business_name || prev.business_name,
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

        <Field
          label="Business name *"
          value={form.business_name}
          onChange={(v) => setForm({ ...form, business_name: v })}
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
          <Field
            label="Subject variant (utm_content)"
            value={form.subject_variant}
            onChange={(v) => setForm({ ...form, subject_variant: v })}
          />
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
          disabled={!form.business_name.trim() || saving}
          className="bg-text text-bg px-6 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.12em] disabled:opacity-40"
        >
          {saving ? "Creating…" : "Create lead + link"}
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
