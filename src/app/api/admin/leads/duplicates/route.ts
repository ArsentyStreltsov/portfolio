import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/session";
import { findLikelyDuplicates } from "@/lib/crm/duplicates";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const duplicates = findLikelyDuplicates({
    business_name: sp.get("business_name") ?? undefined,
    website: sp.get("website") ?? undefined,
    email: sp.get("email") ?? undefined,
    phone: sp.get("phone") ?? undefined,
    exclude_lead_id: sp.get("exclude_lead_id") ?? undefined,
  });

  return NextResponse.json({ duplicates });
}
