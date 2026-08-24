import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/session";
import type { LeadStatus } from "@/lib/crm/db";
import { findLikelyDuplicates } from "@/lib/crm/duplicates";
import {
  createFollowUpTouch,
  createLead,
  getDashboardStats,
  listLeads,
  markTouchSent,
  updateLead,
} from "@/lib/crm/leads";

async function guard() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const status = request.nextUrl.searchParams.get("status") as LeadStatus | null;
  const stats = getDashboardStats();
  const leads = listLeads(status ?? undefined);
  return NextResponse.json({ leads, stats });
}

export async function POST(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const body = (await request.json()) as {
    business_name?: string;
    website?: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    channel?: string;
    status?: LeadStatus;
    campaign?: string;
    notes?: string;
    subject_variant?: string;
    allow_duplicate?: boolean;
  };

  if (!body.business_name?.trim()) {
    return NextResponse.json({ error: "business_name required" }, { status: 400 });
  }

  const duplicates = findLikelyDuplicates({
    business_name: body.business_name,
    website: body.website,
    email: body.email,
    phone: body.phone,
  });

  if (duplicates.length > 0 && !body.allow_duplicate) {
    return NextResponse.json(
      {
        error: "Possible duplicate lead",
        duplicates,
      },
      { status: 409 },
    );
  }

  const lead = createLead({ ...body, business_name: body.business_name.trim() });
  return NextResponse.json({ lead, duplicates }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const body = (await request.json()) as {
    lead_id?: string;
    action?: "mark_touch_sent" | "new_touch";
    touch_id?: string;
    subject_variant?: string;
    patch?: Parameters<typeof updateLead>[1];
  };

  if (!body.lead_id) {
    return NextResponse.json({ error: "lead_id required" }, { status: 400 });
  }

  if (body.action === "mark_touch_sent" && body.touch_id) {
    const lead = markTouchSent(body.touch_id, body.subject_variant);
    if (!lead) return NextResponse.json({ error: "Touch not found" }, { status: 404 });
    return NextResponse.json({ lead });
  }

  if (body.action === "new_touch") {
    const lead = createFollowUpTouch(body.lead_id, body.subject_variant);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    return NextResponse.json({ lead });
  }

  if (body.patch) {
    const lead = updateLead(body.lead_id, body.patch);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    return NextResponse.json({ lead });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
