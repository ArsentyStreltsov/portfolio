import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/session";
import {
  extractLeadFromHtml,
  isPrivateHostname,
  normalizeWebsiteUrl,
  type ExtractedLead,
} from "@/lib/crm/extract";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 12_000;

async function fetchHtml(url: URL) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ArsentyOutreachBot/1.0; +https://arsentystreltsov.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      throw new Error(`Fetch failed (${res.status})`);
    }
    // Block SSRF via redirects to private hosts
    const finalUrl = new URL(res.url || url.toString());
    if (finalUrl.protocol !== "http:" && finalUrl.protocol !== "https:") {
      throw new Error("Only http(s) URLs allowed");
    }
    if (isPrivateHostname(finalUrl.hostname)) {
      throw new Error("Private / local URLs are not allowed");
    }
    const ctype = res.headers.get("content-type") ?? "";
    if (ctype && !/text\/html|application\/xhtml/i.test(ctype) && !ctype.includes("text/plain")) {
      throw new Error("URL did not return HTML");
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      throw new Error("Page too large");
    }
    const html = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    return { html, finalUrl: finalUrl.toString() };
  } finally {
    clearTimeout(timer);
  }
}

function mergeExtract(primary: ExtractedLead, secondary: ExtractedLead): ExtractedLead {
  return {
    business_name: primary.business_name || secondary.business_name,
    contact_name: primary.contact_name || secondary.contact_name,
    email: primary.email || secondary.email,
    phone: primary.phone || secondary.phone,
    website: primary.website,
    notes: [primary.notes, secondary.notes !== primary.notes ? secondary.notes : ""]
      .filter(Boolean)
      .join("\n")
      .slice(0, 2000),
    signals: [...new Set([...primary.signals, ...secondary.signals.map((s) => `contact: ${s}`)])],
    contact_urls: [...new Set([...(primary.contact_urls ?? []), ...(secondary.contact_urls ?? [])])],
  };
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = clientIp(request);
  const limited = rateLimit({ key: `extract-lead:${ip}`, limit: 20, windowMs: 60 * 1000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  try {
    const body = (await request.json()) as { url?: string };
    const url = normalizeWebsiteUrl(body.url ?? "");

    const { html, finalUrl } = await fetchHtml(url);
    let extracted = extractLeadFromHtml(html, finalUrl);

    // If key contacts missing, try first contact-like page
    if ((!extracted.email || !extracted.phone) && extracted.contact_urls[0]) {
      try {
        const contactUrl = normalizeWebsiteUrl(extracted.contact_urls[0]!);
        if (contactUrl.toString() !== finalUrl) {
          const second = await fetchHtml(contactUrl);
          const more = extractLeadFromHtml(second.html, second.finalUrl);
          extracted = mergeExtract(extracted, more);
        }
      } catch {
        // contact page optional
      }
    }

    return NextResponse.json({
      ok: true,
      extracted,
      fetched_url: finalUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Extract failed";
    const status = message.includes("required") || message.includes("allowed") ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
