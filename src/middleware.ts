import { NextRequest, NextResponse } from "next/server";

function canonicalHost() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) {
    try {
      return new URL(fromEnv).host;
    } catch {
      // fall through
    }
  }
  return "arsentystreltsov.com";
}

/** 301 www → apex (or whatever NEXT_PUBLIC_SITE_URL uses). */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const apex = canonicalHost();

  if (!host || host === "localhost" || host === "127.0.0.1") {
    return NextResponse.next();
  }

  if (host.startsWith("www.")) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = apex;
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml).*)",
  ],
};
