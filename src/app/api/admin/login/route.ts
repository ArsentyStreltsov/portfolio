import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, verifyAdminPassword } from "@/lib/admin/session";

export async function POST(request: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
  }
  if (!process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) {
    return NextResponse.json({ error: "Session secret not configured" }, { status: 503 });
  }

  const body = (await request.json()) as { password?: string };
  if (!body.password || !verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const session = await getAdminSession();
  session.isLoggedIn = true;
  await session.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getAdminSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
