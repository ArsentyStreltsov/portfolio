import {
  nowIso,
  type BriefRow,
  type EventRow,
  type LeadRow,
  type LeadStatus,
  type TouchRow,
} from "./db";
import { buildOutreachUrl } from "./links";
import { generateLeadId, nextTouchId } from "./ids";
import { nextRowId, readStore, writeStore } from "./store";

export type LeadInput = {
  business_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  channel?: string;
  status?: LeadStatus;
  campaign?: string;
  notes?: string;
  subject_variant?: string;
};

function sortDescByDate<T extends { created_at?: string; updated_at?: string }>(
  rows: T[],
  field: "created_at" | "updated_at" = "created_at",
) {
  return [...rows].sort((a, b) => (b[field] ?? "").localeCompare(a[field] ?? ""));
}

export function listLeads(status?: LeadStatus) {
  const store = readStore();
  const leads = sortDescByDate(store.leads, "updated_at");
  if (status) return leads.filter((l) => l.status === status);
  return leads;
}

export function getLeadByLeadId(leadId: string) {
  const store = readStore();
  const lead = store.leads.find((l) => l.lead_id === leadId);
  if (!lead) return null;
  const touches = sortDescByDate(store.touches.filter((t) => t.lead_id === leadId));
  const events = sortDescByDate(store.events.filter((e) => e.lead_id === leadId)).slice(0, 100);
  const briefs = sortDescByDate(store.briefs.filter((b) => b.lead_id === leadId));
  return { lead, touches, events, briefs };
}

export function getLeadBusinessName(leadId: string) {
  return readStore().leads.find((l) => l.lead_id === leadId)?.business_name;
}

export function createLead(input: LeadInput) {
  const lead_id = generateLeadId();
  const ts = nowIso();
  const campaign = input.campaign ?? "se_websites_2026";
  const subject_variant = input.subject_variant ?? "email_v1";
  const touch_id = nextTouchId(lead_id, 0);
  const outreach_url = buildOutreachUrl({
    leadId: lead_id,
    touchId: touch_id,
    campaign,
    content: subject_variant,
  });

  writeStore((store) => {
    store.leads.push({
      id: nextRowId(store, "lead"),
      lead_id,
      business_name: input.business_name.trim(),
      contact_name: input.contact_name?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      channel: input.channel?.trim() || null,
      status: input.status ?? "draft",
      campaign,
      notes: input.notes?.trim() || null,
      created_at: ts,
      updated_at: ts,
      sent_at: null,
    });
    store.touches.push({
      id: nextRowId(store, "touch"),
      lead_id,
      touch_id,
      subject_variant,
      outreach_url,
      sent_at: null,
      created_at: ts,
    });
    appendEvent(store, {
      lead_id,
      touch_id,
      event_type: "lead_created",
      summary: `Lead created: ${input.business_name.trim()}`,
    });
  });

  return getLeadByLeadId(lead_id)!;
}

function appendEvent(
  store: ReturnType<typeof readStore>,
  input: {
    lead_id?: string | null;
    touch_id?: string | null;
    event_type: string;
    summary?: string;
    payload?: Record<string, unknown>;
  },
) {
  store.events.push({
    id: nextRowId(store, "event"),
    lead_id: input.lead_id ?? null,
    touch_id: input.touch_id ?? null,
    event_type: input.event_type,
    summary: input.summary ?? null,
    payload: input.payload ? JSON.stringify(input.payload) : null,
    created_at: nowIso(),
  });
}

export function updateLead(
  leadId: string,
  patch: Partial<
    Pick<
      LeadRow,
      "business_name" | "contact_name" | "email" | "phone" | "channel" | "status" | "campaign" | "notes" | "sent_at"
    >
  >,
) {
  let result: ReturnType<typeof getLeadByLeadId> = null;

  writeStore((store) => {
    const idx = store.leads.findIndex((l) => l.lead_id === leadId);
    if (idx === -1) return;
    const existing = store.leads[idx]!;

    store.leads[idx] = {
      ...existing,
      business_name: patch.business_name ?? existing.business_name,
      contact_name: patch.contact_name !== undefined ? patch.contact_name : existing.contact_name,
      email: patch.email !== undefined ? patch.email : existing.email,
      phone: patch.phone !== undefined ? patch.phone : existing.phone,
      channel: patch.channel !== undefined ? patch.channel : existing.channel,
      status: patch.status ?? existing.status,
      campaign: patch.campaign !== undefined ? patch.campaign : existing.campaign,
      notes: patch.notes !== undefined ? patch.notes : existing.notes,
      sent_at: patch.sent_at !== undefined ? patch.sent_at : existing.sent_at,
      updated_at: nowIso(),
    };

    if (patch.status && patch.status !== existing.status) {
      appendEvent(store, {
        lead_id: leadId,
        event_type: "status_changed",
        summary: `Status: ${existing.status} → ${patch.status}`,
      });
    }
  });

  result = getLeadByLeadId(leadId);
  return result;
}

export function createFollowUpTouch(leadId: string, subject_variant?: string) {
  const lead = readStore().leads.find((l) => l.lead_id === leadId);
  if (!lead) return null;

  const touchCount = readStore().touches.filter((t) => t.lead_id === leadId).length;
  const touch_id = nextTouchId(leadId, touchCount);
  const variant = subject_variant ?? `followup_${String(touchCount + 1).padStart(2, "0")}`;
  const outreach_url = buildOutreachUrl({
    leadId,
    touchId: touch_id,
    campaign: lead.campaign ?? "se_websites_2026",
    content: variant,
  });
  const ts = nowIso();

  writeStore((store) => {
    store.touches.push({
      id: nextRowId(store, "touch"),
      lead_id: leadId,
      touch_id,
      subject_variant: variant,
      outreach_url,
      sent_at: null,
      created_at: ts,
    });
    appendEvent(store, {
      lead_id: leadId,
      touch_id,
      event_type: "touch_created",
      summary: `New outreach link (${touch_id})`,
    });
  });

  return getLeadByLeadId(leadId);
}

export function markTouchSent(touchId: string) {
  const touch = readStore().touches.find((t) => t.touch_id === touchId);
  if (!touch) return null;
  const ts = nowIso();

  writeStore((store) => {
    const t = store.touches.find((x) => x.touch_id === touchId);
    if (t) t.sent_at = ts;
  });

  updateLead(touch.lead_id, { status: "sent", sent_at: ts });

  writeStore((store) => {
    appendEvent(store, {
      lead_id: touch.lead_id,
      touch_id: touchId,
      event_type: "email_marked_sent",
      summary: "Marked as sent",
    });
  });

  return getLeadByLeadId(touch.lead_id);
}

export function logEvent(input: {
  lead_id?: string | null;
  touch_id?: string | null;
  event_type: string;
  summary?: string;
  payload?: Record<string, unknown>;
}) {
  writeStore((store) => {
    appendEvent(store, input);

    if (input.lead_id && input.event_type === "outreach_hit") {
      const lead = store.leads.find((l) => l.lead_id === input.lead_id);
      if (lead && (lead.status === "draft" || lead.status === "ready" || lead.status === "sent")) {
        lead.status = "opened";
        lead.updated_at = nowIso();
      }
    }
  });
}

export function saveBrief(input: {
  lead_id?: string | null;
  business_name?: string;
  contact_name?: string;
  contact_email?: string;
  payload: Record<string, unknown>;
}) {
  const ts = nowIso();

  writeStore((store) => {
    store.briefs.push({
      id: nextRowId(store, "brief"),
      lead_id: input.lead_id ?? null,
      business_name: input.business_name ?? null,
      contact_name: input.contact_name ?? null,
      contact_email: input.contact_email ?? null,
      payload: JSON.stringify(input.payload),
      created_at: ts,
    });
  });

  if (input.lead_id) {
    updateLead(input.lead_id, { status: "brief_sent" });
    logEvent({
      lead_id: input.lead_id,
      event_type: "brief_submitted",
      summary: `Brief submitted${input.business_name ? `: ${input.business_name}` : ""}`,
    });
  } else {
    logEvent({
      event_type: "brief_submitted",
      summary: `Brief submitted (organic)${input.business_name ? `: ${input.business_name}` : ""}`,
      payload: { contact_email: input.contact_email ?? undefined },
    });
  }
}

export function getDashboardStats() {
  const store = readStore();
  const total = store.leads.length;
  const counts = new Map<string, number>();
  for (const lead of store.leads) {
    counts.set(lead.status, (counts.get(lead.status) ?? 0) + 1);
  }
  const byStatus = [...counts.entries()].map(([status, c]) => ({ status, c }));
  const recentEvents = sortDescByDate(store.events).slice(0, 15);
  const organicBriefs = sortDescByDate(store.briefs.filter((b) => !b.lead_id)).slice(0, 10);
  return { total, byStatus, recentEvents, organicBriefs };
}
