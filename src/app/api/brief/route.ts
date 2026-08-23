import { NextRequest, NextResponse } from "next/server";
import { saveBrief } from "@/lib/crm/leads";
import { getDb } from "@/lib/crm/db";
import { sendNtfy } from "@/lib/ntfy";
import { sanitizeOutreachId } from "@/lib/outreach/validate";

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

  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BriefPayload;
    const topic = process.env.NTFY_TOPIC;

    if (!topic) {
      console.error("NTFY_TOPIC is not set — brief not forwarded");
      return NextResponse.json({ error: "Notification not configured" }, { status: 500 });
    }

    const lead_id = sanitizeOutreachId(body.lead_id ?? null);
    const message = formatBrief({ ...body, lead_id });

    const ok = await sendNtfy({
      title: `New brief: ${body.businessName || body.name || "Untitled"}`,
      message: message || "Empty brief",
      tags: "briefcase,email",
      priority: "high",
    });

    if (!ok) {
      return NextResponse.json({ error: "Failed to notify" }, { status: 502 });
    }

    try {
      getDb();
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
