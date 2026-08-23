import { NextRequest, NextResponse } from "next/server";
import { saveBrief } from "@/lib/crm/leads";
import { sendNtfy } from "@/lib/ntfy";
import { sanitizeOutreachId } from "@/lib/outreach/validate";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

type BriefPayload = {
  businessName?: string;
  url?: string;
  need?: string;
  goals?: string[];
  extra?: string;
  name?: string;
  email?: string;
  phone?: string;
  submittedAt?: string;
  lead_id?: string;
};

function clip(value: unknown, max: number) {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  if (!t) return undefined;
  return t.slice(0, max);
}

function formatBrief(body: BriefPayload) {
  const lines = [
    body.name && `Name: ${body.name}`,
    body.email && `Email: ${body.email}`,
    body.phone && `Phone: ${body.phone}`,
    body.businessName && `Business: ${body.businessName}`,
    body.url && `URL: ${body.url}`,
    body.need && `Need: ${body.need}`,
    body.goals?.length && `Goals: ${body.goals.join(", ")}`,
    body.extra && `Extra: ${body.extra}`,
    body.lead_id && `Lead ID: ${body.lead_id}`,
  ].filter(Boolean);

  return lines.join("\n").slice(0, 4000);
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit({ key: `brief:${ip}`, limit: 8, windowMs: 60 * 60 * 1000 });
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const raw = (await request.json()) as BriefPayload;
    const topic = process.env.NTFY_TOPIC;

    if (!topic) {
      console.error("NTFY_TOPIC is not set — brief not forwarded");
      return NextResponse.json({ error: "Notification not configured" }, { status: 500 });
    }

    const lead_id = sanitizeOutreachId(raw.lead_id ?? null);
    const body: BriefPayload = {
      name: clip(raw.name, 120),
      email: clip(raw.email, 200),
      phone: clip(raw.phone, 40),
      businessName: clip(raw.businessName, 200),
      url: clip(raw.url, 500),
      need: clip(raw.need, 80),
      extra: clip(raw.extra, 2000),
      goals: Array.isArray(raw.goals)
        ? raw.goals.filter((g): g is string => typeof g === "string").map((g) => g.slice(0, 80)).slice(0, 12)
        : undefined,
      submittedAt: clip(raw.submittedAt, 40),
      lead_id: lead_id ?? undefined,
    };

    if (!body.name || !body.email) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    }

    const message = formatBrief(body);

    const ok = await sendNtfy({
      title: `New brief: ${body.businessName || body.name || "Untitled"}`.slice(0, 120),
      message: message || "Empty brief",
      tags: "briefcase,email",
      priority: "high",
    });

    if (!ok) {
      return NextResponse.json({ error: "Failed to notify" }, { status: 502 });
    }

    try {
      saveBrief({
        lead_id: lead_id ?? null,
        business_name: body.businessName,
        contact_name: body.name,
        contact_email: body.email,
        payload: {
          url: body.url,
          need: body.need,
          goals: body.goals,
          extra: body.extra,
          phone: body.phone,
          submittedAt: body.submittedAt,
        },
      });
    } catch {
      // CRM storage best-effort
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
