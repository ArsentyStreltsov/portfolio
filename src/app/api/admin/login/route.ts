import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, verifyAdminPassword } from "@/lib/admin/session";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limited = rateLimit({ key: `admin-login:${ip}`, limit: 8, windowMs: 15 * 60 * 1000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
  }
  if (!process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) {
    return NextResponse.json({ error: "Session secret not configured" }, { status: 503 });
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof body.password !== "string" || body.password.length > 200) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  if (!verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const session = await getAdminSession();
  session.isLoggedIn = true;
  await session.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const ip = clientIp(request);
  const limited = rateLimit({ key: `admin-logout:${ip}`, limit: 30, windowMs: 60 * 1000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const session = await getAdminSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
