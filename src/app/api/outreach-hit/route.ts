import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getLeadBusinessName, logEvent } from "@/lib/crm/leads";
import { sendNtfy } from "@/lib/ntfy";
import {
  sanitizeOutreachId,
  sanitizeOutreachUtm,
  type OutreachHitPayload,
} from "@/lib/outreach/validate";

export const runtime = "nodejs";

const LOG_DIR = path.join(process.cwd(), "data");
const LOG_FILE = path.join(LOG_DIR, "outreach-hits.jsonl");

const recent = new Map<string, number>();
const DEDUPE_MS = 2 * 60 * 1000;

function pruneRecent(now: number) {
  for (const [key, ts] of recent) {
    if (now - ts > DEDUPE_MS) recent.delete(key);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<OutreachHitPayload>;
    const lead_id = sanitizeOutreachId(body.lead_id);
    if (!lead_id) {
      return NextResponse.json({ error: "Invalid lead_id" }, { status: 400 });
    }

    const touch_id = sanitizeOutreachId(body.touch_id);
    const entry = {
      ts: new Date().toISOString(),
      lead_id,
      ...(touch_id ? { touch_id } : {}),
      utm_source: sanitizeOutreachUtm(body.utm_source),
      utm_medium: sanitizeOutreachUtm(body.utm_medium),
      utm_campaign: sanitizeOutreachUtm(body.utm_campaign),
      utm_content: sanitizeOutreachUtm(body.utm_content),
      utm_term: sanitizeOutreachUtm(body.utm_term),
      path:
        typeof body.path === "string" && body.path.startsWith("/") && body.path.length < 200
          ? body.path
          : "/",
    };

    const now = Date.now();
    pruneRecent(now);
    const dedupeKey = `${entry.lead_id}|${entry.touch_id ?? ""}|${entry.path}`;
    if (recent.has(dedupeKey)) {
      return NextResponse.json({ ok: true, deduped: true });
    }
    recent.set(dedupeKey, now);

    const line = JSON.stringify(
      Object.fromEntries(Object.entries(entry).filter(([, v]) => v !== undefined)),
    );
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(LOG_FILE, `${line}\n`, "utf8");

    let businessName: string | undefined;
    try {
      logEvent({
        lead_id,
        touch_id: touch_id ?? null,
        event_type: "outreach_hit",
        summary: `Opened outreach link${entry.path !== "/" ? ` (${entry.path})` : ""}`,
        payload: entry,
      });
      businessName = getLeadBusinessName(lead_id);
    } catch {
      // CRM storage best-effort
    }

    void sendNtfy({
      title: `Outreach visit: ${lead_id}`,
      message: businessName
        ? `${businessName} opened your link`
        : `Lead ${lead_id} opened your outreach link`,
      tags: "eyes",
      priority: "default",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to log" }, { status: 500 });
  }
}
