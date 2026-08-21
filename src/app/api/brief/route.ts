import { NextRequest, NextResponse } from "next/server";

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
  ].filter(Boolean);

  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BriefPayload;
    const topic = process.env.NTFY_TOPIC;
    const baseUrl = (process.env.NTFY_URL ?? "https://ntfy.sh").replace(/\/$/, "");

    if (!topic) {
      console.error("NTFY_TOPIC is not set — brief not forwarded");
      return NextResponse.json({ error: "Notification not configured" }, { status: 500 });
    }

    const message = formatBrief(body);
    const res = await fetch(`${baseUrl}/${topic}`, {
      method: "POST",
      headers: {
        Title: `New brief: ${body.businessName || body.name || "Untitled"}`,
        Priority: "high",
        Tags: "briefcase,email",
        "Content-Type": "text/plain",
      },
      body: message || "Empty brief",
    });

    if (!res.ok) {
      console.error("ntfy failed", await res.text());
      return NextResponse.json({ error: "Failed to notify" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
