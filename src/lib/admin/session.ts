import { timingSafeEqual } from "node:crypto";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type AdminSession = {
  isLoggedIn?: boolean;
};

export function getAdminSessionOptions(): SessionOptions {
  const password =
    process.env.ADMIN_SESSION_SECRET ??
    (process.env.NODE_ENV === "production" ? "" : "dev-admin-session-secret-32chars!");

  return {
    password,
    cookieName: "portfolio_admin",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
  };
}

export async function getAdminSession() {
  return getIronSession<AdminSession>(await cookies(), getAdminSessionOptions());
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session.isLoggedIn) return null;
  return session;
}

export function verifyAdminPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected || !input) return false;
  if (input.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}
