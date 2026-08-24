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

function samePage(a: string, b: string) {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    const pathA = ua.pathname.replace(/\/+$/, "") || "/";
    const pathB = ub.pathname.replace(/\/+$/, "") || "/";
    return (
      ua.hostname.replace(/^www\./, "") === ub.hostname.replace(/^www\./, "") && pathA === pathB
    );
  } catch {
    return a === b;
  }
}

/** Prefer contact-page contact fields; keep home for business identity. */
function mergePreferContact(home: ExtractedLead, contact: ExtractedLead): ExtractedLead {
  return {
    business_name: home.business_name || contact.business_name,
    contact_name: contact.contact_name || home.contact_name,
    email: contact.email || home.email,
    phone: contact.phone || home.phone,
    website: contact.website || home.website,
    notes: [home.notes, contact.notes !== home.notes ? contact.notes : ""]
      .filter(Boolean)
      .join("\n")
      .slice(0, 2000),
    signals: [...new Set([...home.signals, ...contact.signals.map((s) => `contact: ${s}`)])],
    contact_urls: [...new Set([...(home.contact_urls ?? []), ...(contact.contact_urls ?? [])])],
    page_title: contact.page_title || home.page_title,
    page_description: contact.page_description || home.page_description,
    business_name_evidence: [...home.business_name_evidence, ...contact.business_name_evidence],
    contact_name_evidence: [...contact.contact_name_evidence, ...home.contact_name_evidence],
    email_evidence: [...contact.email_evidence, ...home.email_evidence],
    phone_evidence: [...contact.phone_evidence, ...home.phone_evidence],
  };
}

function pickContactTarget(home: ExtractedLead, homeUrl: string, preferred?: string | null) {
  const candidates = [preferred, ...(home.contact_urls ?? [])].filter((u): u is string => Boolean(u));

  for (const candidate of candidates) {
    try {
      const target = normalizeWebsiteUrl(candidate);
      if (!samePage(target.toString(), homeUrl)) return target;
    } catch {
      // skip invalid
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = clientIp(request);
  const limited = rateLimit({ key: `extract-lead:${ip}`, limit: 20, windowMs: 60 * 1000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  try {
    const body = (await request.json()) as {
      url?: string;
      mode?: "home" | "contact";
      target_url?: string;
    };
    const url = normalizeWebsiteUrl(body.url ?? "");
    const mode = body.mode ?? "home";
    const forceContact = mode === "contact";

    const first = await fetchHtml(url);
    let extracted = extractLeadFromHtml(first.html, first.finalUrl);
    let usedMode: "home" | "contact" = "home";
    let contactFetchedUrl: string | null = null;
    let contactSkippedReason: string | null = null;

    const missingContactFields = !extracted.email || !extracted.phone;
    const shouldFetchContact = forceContact || missingContactFields;

    if (shouldFetchContact) {
      const target = pickContactTarget(extracted, first.finalUrl, body.target_url);
      if (!target) {
        contactSkippedReason = "No distinct contact page URL found";
      } else {
        try {
          const second = await fetchHtml(target);
          if (samePage(second.finalUrl, first.finalUrl)) {
            contactSkippedReason = "Contact URL redirected to the same page";
          } else {
            const contactExtract = extractLeadFromHtml(second.html, second.finalUrl);
            extracted = mergePreferContact(extracted, contactExtract);
            contactFetchedUrl = second.finalUrl;
            // Explicit button click always marks contact mode.
            // Auto-enrich keeps usedMode=home so the button remains available.
            if (forceContact) usedMode = "contact";
          }
        } catch (e) {
          contactSkippedReason = e instanceof Error ? e.message : "Contact page fetch failed";
          if (forceContact) {
            return NextResponse.json(
              { error: `Contact page failed: ${contactSkippedReason}` },
              { status: 502 },
            );
          }
        }
      }

      if (forceContact && !contactFetchedUrl) {
        return NextResponse.json(
          { error: contactSkippedReason ?? "Could not open contact page" },
          { status: 400 },
        );
      }
    }

    const hasDistinctContactUrl = (extracted.contact_urls ?? []).some(
      (u) => !samePage(u, first.finalUrl),
    );

    return NextResponse.json({
      ok: true,
      extracted,
      fetched_url: first.finalUrl,
      contact_fetched_url: contactFetchedUrl,
      used_mode: usedMode,
      can_retry_contact: Boolean(hasDistinctContactUrl && usedMode !== "contact"),
      retried_contact: usedMode === "contact",
      contact_skipped_reason: contactSkippedReason,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Extract failed";
    const status = message.includes("required") || message.includes("allowed") ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
