/** Extract public business contact signals from a website HTML (no LLM). */

export type ExtractEvidence = {
  value: string;
  source: string;
  snippet: string;
  page_url: string;
};

export type ExtractedLead = {
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
  signals: string[];
  contact_urls: string[];
  page_title: string;
  page_description: string;
  business_name_evidence: ExtractEvidence[];
  contact_name_evidence: ExtractEvidence[];
  email_evidence: ExtractEvidence[];
  phone_evidence: ExtractEvidence[];
};

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE =
  /(?:\+|00)?(?:46|45|47)?[\s.-]?(?:\(?0\)?[\s.-]?)?(?:\d[\s.-]?){6,12}\d/g;
const JUNK_EMAIL = /noreply|no-reply|donotreply|example\.|sentry\.|wixpress|wordpress|cloudflare|schema\.org/i;
const JUNK_PHONE_START = /^0{3,}|^12345/;

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripTags(html: string) {
  return decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function metaContent(html: string, prop: string) {
  const re = new RegExp(
    `<meta[^>]*(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const alt = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["'][^>]*>`,
    "i",
  );
  return decodeHtml((html.match(re)?.[1] || html.match(alt)?.[1] || "").trim());
}

function titleTag(html: string) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return decodeHtml((m?.[1] ?? "").trim());
}

function firstH1(html: string) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? stripTags(m[1]!) : "";
}

function clipSnippet(text: string, max = 180) {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}

function pushEvidence(
  list: ExtractEvidence[],
  value: string | undefined,
  source: string,
  snippet: string,
  pageUrl: string,
) {
  const clean = value?.trim();
  if (!clean) return;
  if (list.some((item) => item.value.toLowerCase() === clean.toLowerCase())) return;
  list.push({
    value: clean.slice(0, 200),
    source,
    snippet: clipSnippet(snippet || clean),
    page_url: pageUrl,
  });
}

function cleanBusinessName(raw: string) {
  let name = raw.trim();
  // "Home | Acme AB" / "Acme – Stockholm"
  const parts = name.split(/\s*[|\u2013\u2014\-–—]\s*/);
  if (parts.length >= 2) {
    const candidates = parts.map((p) => p.trim()).filter(Boolean);
    name =
      candidates.find((p) => !/^(home|start|välkommen|welcome|om oss|about)$/i.test(p)) ??
      candidates[candidates.length - 1]!;
  }
  return name.slice(0, 120);
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1]!) as unknown;
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of list) {
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          if (Array.isArray(obj["@graph"])) {
            for (const g of obj["@graph"]) {
              if (g && typeof g === "object") blocks.push(g as Record<string, unknown>);
            }
          } else {
            blocks.push(obj);
          }
        }
      }
    } catch {
      // ignore bad JSON-LD
    }
  }
  return blocks;
}

function typeIncludes(obj: Record<string, unknown>, ...types: string[]) {
  const t = obj["@type"];
  const list = Array.isArray(t) ? t.map(String) : t ? [String(t)] : [];
  return list.some((x) => types.some((want) => x.toLowerCase().includes(want.toLowerCase())));
}

function pickEmails(html: string, limit = 3) {
  const fromMailto = [...html.matchAll(/mailto:([^"'?\s>]+)/gi)].map((m) =>
    decodeURIComponent(m[1]!).split("?")[0]!.trim(),
  );
  const fromText = html.match(EMAIL_RE) ?? [];
  const all = [...fromMailto, ...fromText]
    .map((e) => e.toLowerCase())
    .filter((e) => e.includes("@") && !JUNK_EMAIL.test(e));
  return [...new Set(all)].slice(0, limit);
}

function normalizePhone(raw: string) {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.length < 8 || cleaned.length > 15) return null;
  if (JUNK_PHONE_START.test(cleaned.replace(/^\+/, ""))) return null;
  return raw.replace(/\s+/g, " ").trim().slice(0, 40);
}

function pickPhones(html: string, limit = 3) {
  const fromTel = [...html.matchAll(/tel:([^"'\s>]+)/gi)].map((m) =>
    decodeURIComponent(m[1]!).replace(/[^\d+]/g, ""),
  );
  const fromText = (html.match(PHONE_RE) ?? []).map((p) => p.trim());
  const out: string[] = [];
  for (const p of [...fromTel, ...fromText]) {
    const n = normalizePhone(p);
    if (n && !out.includes(n)) out.push(n);
    if (out.length >= limit) break;
  }
  return out;
}

function contactPageHints(html: string, baseUrl: string) {
  const links = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const contactish: string[] = [];
  for (const m of links) {
    const href = m[1]!;
    const text = stripTags(m[2]!).toLowerCase();
    if (
      /kontakt|contact|om-oss|about|impressum/i.test(href) ||
      /kontakt|contact|om oss|about us/i.test(text)
    ) {
      try {
        contactish.push(new URL(href, baseUrl).toString());
      } catch {
        // ignore
      }
    }
  }
  return [...new Set(contactish)].slice(0, 2);
}

export function extractLeadFromHtml(html: string, pageUrl: string): ExtractedLead {
  const signals: string[] = [];
  let business_name = "";
  let contact_name = "";
  let email = "";
  let phone = "";
  const noteBits: string[] = [`Source: ${pageUrl}`];
  const business_name_evidence: ExtractEvidence[] = [];
  const contact_name_evidence: ExtractEvidence[] = [];
  const email_evidence: ExtractEvidence[] = [];
  const phone_evidence: ExtractEvidence[] = [];

  const ld = extractJsonLd(html);
  const org =
    ld.find((o) => typeIncludes(o, "LocalBusiness", "Organization", "Corporation", "Store")) ??
    ld.find((o) => typeof o.name === "string");

  const title = titleTag(html);
  const h1 = firstH1(html);
  const ogTitle = metaContent(html, "og:title");
  const siteName = metaContent(html, "og:site_name");
  const desc = metaContent(html, "description") || metaContent(html, "og:description");

  if (org) {
    if (typeof org.name === "string" && org.name.trim()) {
      business_name = cleanBusinessName(org.name);
      signals.push("json-ld name");
      pushEvidence(
        business_name_evidence,
        business_name,
        "JSON-LD organization name",
        typeof org.description === "string" ? org.description : org.name,
        pageUrl,
      );
    }
    if (typeof org.email === "string") {
      email = org.email.replace(/^mailto:/i, "").trim();
      signals.push("json-ld email");
      pushEvidence(email_evidence, email, "JSON-LD email", String(org.email), pageUrl);
    }
    if (typeof org.telephone === "string") {
      phone = org.telephone.trim();
      signals.push("json-ld phone");
      pushEvidence(phone_evidence, phone, "JSON-LD telephone", String(org.telephone), pageUrl);
    }
    const founder = org.founder ?? org.employee;
    if (founder && typeof founder === "object" && !Array.isArray(founder)) {
      const n = (founder as { name?: string }).name;
      if (n) {
        contact_name = n;
        signals.push("json-ld person");
        pushEvidence(contact_name_evidence, contact_name, "JSON-LD person", n, pageUrl);
      }
    }
    if (typeof org.description === "string" && org.description.trim()) {
      noteBits.push(org.description.trim().slice(0, 280));
    }
    const addr = org.address;
    if (addr && typeof addr === "object" && !Array.isArray(addr)) {
      const a = addr as Record<string, string>;
      const line = [a.streetAddress, a.postalCode, a.addressLocality, a.addressCountry]
        .filter(Boolean)
        .join(", ");
      if (line) noteBits.push(`Address: ${line}`);
    }
  }

  if (!business_name && siteName) {
    business_name = cleanBusinessName(siteName);
    signals.push("og:site_name");
    pushEvidence(business_name_evidence, business_name, "Open Graph site name", siteName, pageUrl);
  }
  if (!business_name && ogTitle) {
    business_name = cleanBusinessName(ogTitle);
    signals.push("og:title");
    pushEvidence(business_name_evidence, business_name, "Open Graph title", ogTitle, pageUrl);
  }
  if (!business_name) {
    if (title) {
      business_name = cleanBusinessName(title);
      signals.push("title");
      pushEvidence(business_name_evidence, business_name, "Page title", title, pageUrl);
    }
  }
  if (!business_name) {
    if (h1) {
      business_name = cleanBusinessName(h1);
      signals.push("h1");
      pushEvidence(business_name_evidence, business_name, "First H1", h1, pageUrl);
    }
  }
  if (desc && !noteBits.some((n) => n.includes(desc.slice(0, 40)))) {
    noteBits.push(desc.slice(0, 280));
  }

  const emails = pickEmails(html);
  if (!email && emails[0]) {
    email = emails[0];
    signals.push("email on page");
  }
  for (const candidate of emails) {
    const match = html.match(new RegExp(`.{0,60}${candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.{0,60}`, "i"));
    pushEvidence(email_evidence, candidate, "Email found on page", match?.[0] ?? candidate, pageUrl);
  }
  if (emails.length > 1) noteBits.push(`Other emails: ${emails.slice(1).join(", ")}`);

  const phones = pickPhones(html);
  if (!phone && phones[0]) {
    phone = phones[0];
    signals.push("phone on page");
  }
  for (const candidate of phones) {
    const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = html.match(new RegExp(`.{0,60}${escaped}.{0,60}`, "i"));
    pushEvidence(phone_evidence, candidate, "Phone found on page", match?.[0] ?? candidate, pageUrl);
  }
  if (phones.length > 1) noteBits.push(`Other phones: ${phones.slice(1).join(", ")}`);

  const contactLinks = contactPageHints(html, pageUrl);
  if (contactLinks.length) noteBits.push(`Contact pages: ${contactLinks.join(" · ")}`);

  // Guess contact from email local-part: fornamn.efternamn@...
  if (!contact_name && email) {
    const local = email.split("@")[0] ?? "";
    if (/^[a-z]+[._-][a-z]+$/i.test(local) && !/info|kontakt|hello|mail|office|admin/i.test(local)) {
      contact_name = local
        .split(/[._-]/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(" ");
      signals.push("name from email");
      pushEvidence(contact_name_evidence, contact_name, "Guessed from email", email, pageUrl);
    }
  }

  return {
    business_name,
    contact_name,
    email,
    phone,
    website: pageUrl,
    notes: noteBits.join("\n"),
    signals,
    contact_urls: contactLinks,
    page_title: title,
    page_description: desc,
    business_name_evidence,
    contact_name_evidence,
    email_evidence,
    phone_evidence,
  };
}

export function isPrivateHostname(hostname: string) {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local")) return true;
  if (h === "0.0.0.0" || h === "::1") return true;
  // literal IPs
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true;
  if (h === "metadata.google.internal") return true;
  return false;
}

export function normalizeWebsiteUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("URL required");
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProto);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) URLs allowed");
  }
  if (isPrivateHostname(url.hostname)) {
    throw new Error("Private / local URLs are not allowed");
  }
  return url;
}
