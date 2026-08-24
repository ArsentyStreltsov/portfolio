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
  website?: string;
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

export type LeadSort = "updated" | "created" | "sent" | "name";

export type ListLeadsOptions = {
  status?: LeadStatus;
  q?: string;
  sort?: LeadSort;
};

function matchesSearch(lead: LeadRow, needle: string) {
  const hay = [
    lead.business_name,
    lead.website,
    lead.contact_name,
    lead.email,
    lead.phone,
    lead.lead_id,
    lead.notes,
    lead.channel,
    lead.campaign,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

function sortLeads(leads: LeadRow[], sort: LeadSort) {
  const copy = [...leads];
  switch (sort) {
    case "name":
      return copy.sort((a, b) => a.business_name.localeCompare(b.business_name, "en"));
    case "created":
      return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
    case "sent":
      return copy.sort((a, b) => {
        if (!a.sent_at && !b.sent_at) return b.updated_at.localeCompare(a.updated_at);
        if (!a.sent_at) return 1;
        if (!b.sent_at) return -1;
        return b.sent_at.localeCompare(a.sent_at);
      });
    case "updated":
    default:
      return copy.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }
}

export function listLeads(options?: LeadStatus | ListLeadsOptions) {
  const opts: ListLeadsOptions =
    typeof options === "string" || options === undefined ? { status: options } : options;

  const store = readStore();
  let leads = store.leads;

  if (opts.q?.trim()) {
    const needle = opts.q.trim().toLowerCase();
    leads = leads.filter((l) => matchesSearch(l, needle));
  }

  if (opts.status) {
    leads = leads.filter((l) => l.status === opts.status);
  }

  return sortLeads(leads, opts.sort ?? "updated");
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
  const subject_variant = input.subject_variant ?? "cold_a";
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
      website: input.website?.trim() || null,
      contact_name: input.contact_name?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      channel: input.channel?.trim() || null,
      status: input.status ?? "ready",
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

export function deleteLead(leadId: string) {
  const existing = readStore().leads.find((l) => l.lead_id === leadId);
  if (!existing) return false;

  writeStore((store) => {
    store.leads = store.leads.filter((l) => l.lead_id !== leadId);
    store.touches = store.touches.filter((t) => t.lead_id !== leadId);
    store.events = store.events.filter((e) => e.lead_id !== leadId);
    store.briefs = store.briefs.filter((b) => b.lead_id !== leadId);
  });

  return true;
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
      | "business_name"
      | "website"
      | "contact_name"
      | "email"
      | "phone"
      | "channel"
      | "status"
      | "campaign"
      | "notes"
      | "sent_at"
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
      website: patch.website !== undefined ? patch.website : existing.website,
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

export function markTouchSent(touchId: string, subjectVariant?: string) {
  const touch = readStore().touches.find((t) => t.touch_id === touchId);
  if (!touch) return null;
  const ts = nowIso();
  const lead = readStore().leads.find((l) => l.lead_id === touch.lead_id);
  const variant = subjectVariant?.trim() || touch.subject_variant || "cold_a";

  writeStore((store) => {
    const t = store.touches.find((x) => x.touch_id === touchId);
    if (!t) return;
    t.sent_at = ts;
    t.subject_variant = variant;
    t.outreach_url = buildOutreachUrl({
      leadId: t.lead_id,
      touchId,
      campaign: lead?.campaign ?? undefined,
      content: variant,
      format: "short",
    });
  });

  updateLead(touch.lead_id, { status: "sent", sent_at: ts });

  writeStore((store) => {
    appendEvent(store, {
      lead_id: touch.lead_id,
      touch_id: touchId,
      event_type: "email_marked_sent",
      summary: `Marked as sent (${variant})`,
      payload: { subject_variant: variant },
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

export function dateKeyStockholm(isoOrDate: string | Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate);
}

export function getDashboardStats() {
  const store = readStore();
  const total = store.leads.length;
  const counts = new Map<LeadStatus, number>();
  for (const lead of store.leads) {
    counts.set(lead.status, (counts.get(lead.status) ?? 0) + 1);
  }
  const byStatus = [...counts.entries()].map(([status, c]) => ({ status, c }));

  const today = dateKeyStockholm();
  const createdToday = store.leads.filter((l) => dateKeyStockholm(l.created_at) === today).length;
  const sentToday = store.leads.filter((l) => l.sent_at && dateKeyStockholm(l.sent_at) === today).length;
  const briefsToday = store.briefs.filter((b) => dateKeyStockholm(b.created_at) === today).length;

  const statusCount = (status: LeadStatus) => counts.get(status) ?? 0;
  const ready = statusCount("ready") + statusCount("draft");
  const waitingReply =
    statusCount("sent") +
    statusCount("opened") +
    statusCount("engaged");
  const positive =
    statusCount("replied") +
    statusCount("interested") +
    statusCount("brief_sent") +
    statusCount("client");
  const clients = statusCount("client");
  const lost = statusCount("lost");
  const everSent = store.leads.filter((l) => Boolean(l.sent_at) || !["draft", "ready"].includes(l.status))
    .length;

  const recentEvents = sortDescByDate(store.events).slice(0, 15);
  const organicBriefs = sortDescByDate(store.briefs.filter((b) => !b.lead_id)).slice(0, 10);

  return {
    total,
    byStatus,
    recentEvents,
    organicBriefs,
    today,
    createdToday,
    sentToday,
    briefsToday,
    ready,
    waitingReply,
    positive,
    clients,
    lost,
    everSent,
  };
}
