"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LeadStatus } from "@/lib/crm/db";
import { LEAD_STATUSES } from "@/lib/crm/ui";

type Props = {
  leadId: string;
  initial: {
    business_name: string;
    website: string | null;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    channel: string | null;
    status: LeadStatus;
    campaign: string | null;
    notes: string | null;
  };
};

export function LeadEditor({ leadId, initial }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(initial);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, patch: form }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const name = form.business_name || leadId;
    if (!window.confirm(`Delete lead “${name}”? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        window.alert("Could not delete lead");
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 border border-border p-5">
      <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-secondary">Edit lead</h2>
      <input
        value={form.business_name}
        onChange={(e) => setForm({ ...form, business_name: e.target.value })}
        className="w-full border-b border-border bg-transparent py-2 font-display text-xl font-bold uppercase"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          placeholder="Website"
          value={form.website ?? ""}
          onChange={(e) => setForm({ ...form, website: e.target.value || null })}
          className="border border-border px-3 py-2 text-sm outline-none focus:border-text"
        />
        <input
          placeholder="Contact name"
          value={form.contact_name ?? ""}
          onChange={(e) => setForm({ ...form, contact_name: e.target.value || null })}
          className="border border-border px-3 py-2 text-sm outline-none focus:border-text"
        />
        <input
          placeholder="Email"
          value={form.email ?? ""}
          onChange={(e) => setForm({ ...form, email: e.target.value || null })}
          className="border border-border px-3 py-2 text-sm outline-none focus:border-text"
        />
        <input
          placeholder="Phone"
          value={form.phone ?? ""}
          onChange={(e) => setForm({ ...form, phone: e.target.value || null })}
          className="border border-border px-3 py-2 text-sm outline-none focus:border-text"
        />
        <input
          placeholder="Channel"
          value={form.channel ?? ""}
          onChange={(e) => setForm({ ...form, channel: e.target.value || null })}
          className="border border-border px-3 py-2 text-sm outline-none focus:border-text"
        />
      </div>
      <select
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })}
        className="w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-text"
      >
        {LEAD_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <textarea
        placeholder="Notes — what you wrote, follow-up plan, objections…"
        value={form.notes ?? ""}
        onChange={(e) => setForm({ ...form, notes: e.target.value || null })}
        rows={5}
        className="w-full border border-border px-3 py-2 text-sm outline-none focus:border-text"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || deleting}
          className="bg-text text-bg px-5 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={saving || deleting}
          className="border border-red-300 px-5 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-red-800 hover:border-red-700 disabled:opacity-40"
        >
          {deleting ? "Deleting…" : "Delete lead"}
        </button>
      </div>
    </div>
  );
}
