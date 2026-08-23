import {
  getDb,
  nowIso,
  type BriefRow,
  type EventRow,
  type LeadRow,
  type LeadStatus,
  type TouchRow,
} from "./db";
import { buildOutreachUrl } from "./links";
import { generateLeadId, nextTouchId } from "./ids";

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

export function listLeads(status?: LeadStatus) {
  const db = getDb();
  if (status) {
    return db
      .prepare("SELECT * FROM leads WHERE status = ? ORDER BY updated_at DESC")
      .all(status) as LeadRow[];
  }
  return db.prepare("SELECT * FROM leads ORDER BY updated_at DESC").all() as LeadRow[];
}

export function getLeadByLeadId(leadId: string) {
  const db = getDb();
  const lead = db.prepare("SELECT * FROM leads WHERE lead_id = ?").get(leadId) as
    | LeadRow
    | undefined;
  if (!lead) return null;
  const touches = db
    .prepare("SELECT * FROM touches WHERE lead_id = ? ORDER BY created_at DESC")
    .all(leadId) as TouchRow[];
  const events = db
    .prepare("SELECT * FROM events WHERE lead_id = ? ORDER BY created_at DESC LIMIT 100")
    .all(leadId) as EventRow[];
  const briefs = db
    .prepare("SELECT * FROM briefs WHERE lead_id = ? ORDER BY created_at DESC")
    .all(leadId) as BriefRow[];
  return { lead, touches, events, briefs };
}

export function createLead(input: LeadInput) {
  const db = getDb();
  const lead_id = generateLeadId();
  const ts = nowIso();
  const campaign = input.campaign ?? "se_websites_2026";
  const subject_variant = input.subject_variant ?? "email_v1";

  const touchCount = 0;
  const touch_id = nextTouchId(lead_id, touchCount);
  const outreach_url = buildOutreachUrl({
    leadId: lead_id,
    touchId: touch_id,
    campaign,
    content: subject_variant,
  });

  db.prepare(
    `INSERT INTO leads (lead_id, business_name, contact_name, email, phone, channel, status, campaign, notes, created_at, updated_at)
     VALUES (@lead_id, @business_name, @contact_name, @email, @phone, @channel, @status, @campaign, @notes, @created_at, @updated_at)`,
  ).run({
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
  });

  db.prepare(
    `INSERT INTO touches (lead_id, touch_id, subject_variant, outreach_url, sent_at, created_at)
     VALUES (@lead_id, @touch_id, @subject_variant, @outreach_url, NULL, @created_at)`,
  ).run({
    lead_id,
    touch_id,
    subject_variant,
    outreach_url,
    created_at: ts,
  });

  logEvent({
    lead_id,
    touch_id,
    event_type: "lead_created",
    summary: `Lead created: ${input.business_name.trim()}`,
  });

  return getLeadByLeadId(lead_id)!;
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
  const db = getDb();
  const existing = db.prepare("SELECT * FROM leads WHERE lead_id = ?").get(leadId) as LeadRow | undefined;
  if (!existing) return null;

  const updated = {
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

  db.prepare(
    `UPDATE leads SET business_name=@business_name, contact_name=@contact_name, email=@email, phone=@phone,
     channel=@channel, status=@status, campaign=@campaign, notes=@notes, sent_at=@sent_at, updated_at=@updated_at
     WHERE lead_id=@lead_id`,
  ).run({ ...updated, lead_id: leadId });

  if (patch.status && patch.status !== existing.status) {
    logEvent({
      lead_id: leadId,
      event_type: "status_changed",
      summary: `Status: ${existing.status} → ${patch.status}`,
    });
  }

  return getLeadByLeadId(leadId);
}

export function createFollowUpTouch(leadId: string, subject_variant?: string) {
  const db = getDb();
  const lead = db.prepare("SELECT * FROM leads WHERE lead_id = ?").get(leadId) as LeadRow | undefined;
  if (!lead) return null;

  const countRow = db
    .prepare("SELECT COUNT(*) as c FROM touches WHERE lead_id = ?")
    .get(leadId) as { c: number };
  const touch_id = nextTouchId(leadId, countRow.c);
  const variant = subject_variant ?? `followup_${String(countRow.c + 1).padStart(2, "0")}`;
  const outreach_url = buildOutreachUrl({
    leadId,
    touchId: touch_id,
    campaign: lead.campaign ?? "se_websites_2026",
    content: variant,
  });
  const ts = nowIso();

  db.prepare(
    `INSERT INTO touches (lead_id, touch_id, subject_variant, outreach_url, sent_at, created_at)
     VALUES (@lead_id, @touch_id, @subject_variant, @outreach_url, NULL, @created_at)`,
  ).run({ lead_id: leadId, touch_id, subject_variant: variant, outreach_url, created_at: ts });

  logEvent({
    lead_id: leadId,
    touch_id,
    event_type: "touch_created",
    summary: `New outreach link (${touch_id})`,
  });

  return getLeadByLeadId(leadId);
}

export function markTouchSent(touchId: string) {
  const db = getDb();
  const touch = db.prepare("SELECT * FROM touches WHERE touch_id = ?").get(touchId) as TouchRow | undefined;
  if (!touch) return null;
  const ts = nowIso();
  db.prepare("UPDATE touches SET sent_at = ? WHERE touch_id = ?").run(ts, touchId);
  updateLead(touch.lead_id, { status: "sent", sent_at: ts });
  logEvent({
    lead_id: touch.lead_id,
    touch_id: touchId,
    event_type: "email_marked_sent",
    summary: "Marked as sent",
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
  const db = getDb();
  db.prepare(
    `INSERT INTO events (lead_id, touch_id, event_type, summary, payload, created_at)
     VALUES (@lead_id, @touch_id, @event_type, @summary, @payload, @created_at)`,
  ).run({
    lead_id: input.lead_id ?? null,
    touch_id: input.touch_id ?? null,
    event_type: input.event_type,
    summary: input.summary ?? null,
    payload: input.payload ? JSON.stringify(input.payload) : null,
    created_at: nowIso(),
  });

  if (input.lead_id && input.event_type === "outreach_hit") {
    const lead = db.prepare("SELECT status FROM leads WHERE lead_id = ?").get(input.lead_id) as
      | { status: LeadStatus }
      | undefined;
    if (lead && (lead.status === "draft" || lead.status === "ready" || lead.status === "sent")) {
      db.prepare("UPDATE leads SET status = 'opened', updated_at = ? WHERE lead_id = ?").run(
        nowIso(),
        input.lead_id,
      );
    }
  }
}

export function saveBrief(input: {
  lead_id?: string | null;
  business_name?: string;
  contact_name?: string;
  contact_email?: string;
  payload: Record<string, unknown>;
}) {
  const db = getDb();
  const ts = nowIso();
  db.prepare(
    `INSERT INTO briefs (lead_id, business_name, contact_name, contact_email, payload, created_at)
     VALUES (@lead_id, @business_name, @contact_name, @contact_email, @payload, @created_at)`,
  ).run({
    lead_id: input.lead_id ?? null,
    business_name: input.business_name ?? null,
    contact_name: input.contact_name ?? null,
    contact_email: input.contact_email ?? null,
    payload: JSON.stringify(input.payload),
    created_at: ts,
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
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) as c FROM leads").get() as { c: number }).c;
  const byStatus = db
    .prepare("SELECT status, COUNT(*) as c FROM leads GROUP BY status")
    .all() as { status: string; c: number }[];
  const recentEvents = db
    .prepare("SELECT * FROM events ORDER BY created_at DESC LIMIT 15")
    .all() as EventRow[];
  const organicBriefs = db
    .prepare("SELECT * FROM briefs WHERE lead_id IS NULL ORDER BY created_at DESC LIMIT 10")
    .all() as BriefRow[];
  return { total, byStatus, recentEvents, organicBriefs };
}
