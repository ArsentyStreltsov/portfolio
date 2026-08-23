import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/session";
import { getLeadByLeadId } from "@/lib/crm/leads";

type Props = { params: Promise<{ leadId: string }> };

export async function GET(_request: Request, { params }: Props) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leadId } = await params;
  const lead = getLeadByLeadId(leadId);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}
