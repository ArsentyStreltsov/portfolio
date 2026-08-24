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
const PHONE_SEP = String.raw`[\s.\-–—−]`;
const PHONE_RE = new RegExp(
  String.raw`(?:\+|00)?(?:46|45|47)?${PHONE_SEP}*(?:\(?0\)?${PHONE_SEP}*)?(?:\d${PHONE_SEP}*){6,12}\d`,
  "g",
);
const JUNK_EMAIL = /noreply|no-reply|donotreply|example\.|sentry\.|wixpress|wordpress|cloudflare|schema\.org/i;
const JUNK_PHONE_START = /^0{3,}|^12345/;
const DATE_LIKE_RE = /\b\d{1,4}[./-]\d{1,2}[./-]\d{1,4}\b/;
const PHONE_CONTEXT_RE = /\btelefon\b|\bphone\b|\btel\b|\bring\b|\bcall\b|\bkontakta\b|\bkontakt\b|reach us|call us/i;
const TECH_PHONE_CONTEXT_RE =
  /appid|uuid|guid|monitoringcomponent|panorama|module_metadata|sentry|gtm-|googletag|webpack/i;
const EMAIL_CONTEXT_RE = /email|e-post|maila|mail us|kontakt|contact/i;
const FOOTER_HINT_RE = /footer|copyright|all rights reserved|opening hours|öppettider/i;

type ScoredEvidence = ExtractEvidence & { score: number };

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/gi, "-")
    .replace(/&mdash;/gi, "-")
    .replace(/&minus;/gi, "-")
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
  return raw.replace(/[\u2013\u2014\u2212]/g, "-").replace(/\s+/g, " ").trim().slice(0, 40);
}

function isPlausibleNordicPhone(value: string) {
  const d = value.replace(/[^\d]/g, "");
  if (d.length < 8 || d.length > 13) return false;
  if (/^(?:46|45|47)/.test(d) && d.length >= 10) return true;
  if (/^0[1-9]/.test(d) && d.length >= 8 && d.length <= 11) return true;
  return false;
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
      /kontakt|kontakta|kontakta-oss|kontakta_oss|contact|om-oss|om_oss|about|impressum|hitta-hit/i.test(href) ||
      /kontakt|kontakta oss|contact|om oss|about us|hitta hit/i.test(text)
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

function footerHtml(html: string) {
  return html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i)?.[1] ?? "";
}

/** SVG path data (d="M504 256C504 119...") looks like phone numbers. */
function stripSvgNoise(html: string) {
  return html
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
    .replace(/<svg\b[^>]*>/gi, " ")
    .replace(/\s(?:d|viewbox|points|cx|cy|r|x|y|x1|y1|x2|y2|transform)=["'][^"']*["']/gi, " ")
    .replace(/<(?:path|polygon|polyline|circle|ellipse|line|rect)\b[^>]*>/gi, " ");
}

function htmlForPhoneScan(html: string) {
  return stripSvgNoise(
    decodeHtml(html)
      .replace(/<script(?![^>]*ld\+json)[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      // Inline CSS (margin:-20px) and element ids look like phone numbers.
      .replace(/\sstyle=["'][^"']*["']/gi, " ")
      .replace(/\sid=["'][^"']*["']/gi, " ")
      .replace(/[\u2013\u2014\u2212]/g, "-"),
  );
}

function looksLikeSvgPath(snippet: string, raw: string) {
  const s = snippet.toLowerCase();
  if (/xmlns=["']http:\/\/www\.w3\.org\/2000\/svg|<\/?svg\b|path d=|<path\b/i.test(s)) return true;
  if (/[mlcqazhvst][\s\d.,-]+[mlcqazhvst]/i.test(raw) && /svg|path/i.test(s)) return true;
  return false;
}

/** Coordinate leftovers like "8 119 8 256" from SVG path commands. */
function looksLikeCoordinatePhone(raw: string) {
  const t = raw.trim();
  if (/[mlcqazhvst]/i.test(t)) return true;
  const startsLikePhone = /^(?:\+|00)|^(?:46|45|47)|^0/.test(t.replace(/\s/g, ""));
  if (startsLikePhone) return false;
  return /^[1-9]\d{0,2}(?:[\s.]+\d{1,3}){2,}$/.test(t);
}

function looksLikeTechId(html: string, index: number, raw: string, snippet: string) {
  const around = html.slice(Math.max(0, index - 48), index + raw.length + 48);
  if (TECH_PHONE_CONTEXT_RE.test(around) || TECH_PHONE_CONTEXT_RE.test(snippet)) return true;
  if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(around)) return true;
  const before = html[index - 1] ?? "";
  const after = html[index + raw.length] ?? "";
  if (/[A-Za-z0-9_]/i.test(before) || /[A-Za-z0-9_]/i.test(after)) return true;
  return false;
}

function scoreEmail(value: string, snippet: string, source: string) {
  let score = 0;
  const local = value.split("@")[0]?.toLowerCase() ?? "";
  const s = snippet.toLowerCase();
  if (/^info$|^kontakt$|^contact$|^hello$|^hej$|^office$/.test(local)) score += 8;
  if (/info|kontakt|contact|hello|office|hej/.test(local)) score += 4;
  if (/booking|book|reservation|reservations|boka|event|events|press|jobb|career|careers/.test(local)) score -= 5;
  if (EMAIL_CONTEXT_RE.test(s)) score += 4;
  if (/mailto:/i.test(source)) score += 2;
  if (FOOTER_HINT_RE.test(s) || /footer/i.test(source)) score += 2;
  return score;
}

function scorePhone(value: string, snippet: string, source: string) {
  let score = 0;
  const digits = value.replace(/[^\d]/g, "");
  const s = snippet.toLowerCase();
  if (digits.length >= 8 && digits.length <= 12) score += 3;
  if (isPlausibleNordicPhone(value)) score += 8;
  else score -= 12;
  if (/[\s.\-]/.test(value) && /\d/.test(value)) score += 4;
  if (PHONE_CONTEXT_RE.test(s)) score += 6;
  if (/tel:/i.test(source)) score += 2;
  if (FOOTER_HINT_RE.test(s) || /footer/i.test(source)) score += 2;
  if (TECH_PHONE_CONTEXT_RE.test(s)) score -= 20;
  return score;
}

function collectEmailEvidence(html: string, pageUrl: string, footer = "") {
  const out: ScoredEvidence[] = [];
  for (const m of html.matchAll(/mailto:([^"'?\s>]+)/gi)) {
    const value = decodeURIComponent(m[1]!).split("?")[0]!.trim().toLowerCase();
    if (!value || JUNK_EMAIL.test(value)) continue;
    const snippet = clipSnippet(stripTags(html.slice(Math.max(0, m.index! - 80), m.index! + 120)));
    out.push({
      value,
      source: "mailto link",
      snippet,
      page_url: pageUrl,
      score: scoreEmail(value, snippet, "mailto"),
    });
  }
  for (const m of html.matchAll(EMAIL_RE)) {
    const value = m[0]!.toLowerCase();
    if (!value || JUNK_EMAIL.test(value)) continue;
    const snippet = clipSnippet(stripTags(html.slice(Math.max(0, m.index! - 80), m.index! + 120)));
    out.push({
      value,
      source: "email in page text",
      snippet,
      page_url: pageUrl,
      score: scoreEmail(value, snippet, "text"),
    });
  }
  if (footer) {
    for (const m of footer.matchAll(EMAIL_RE)) {
      const value = m[0]!.toLowerCase();
      if (!value || JUNK_EMAIL.test(value)) continue;
      const snippet = clipSnippet(stripTags(footer.slice(Math.max(0, m.index! - 80), m.index! + 120)));
      out.push({
        value,
        source: "footer email",
        snippet,
        page_url: pageUrl,
        score: scoreEmail(value, snippet, "footer"),
      });
    }
  }
  return dedupeEvidence(out).sort((a, b) => b.score - a.score);
}

function collectPhoneEvidence(html: string, pageUrl: string, footer = "") {
  const out: ScoredEvidence[] = [];
  const searchable = htmlForPhoneScan(html);
  const searchableFooter = htmlForPhoneScan(footer);

  // Quoted tel: hrefs may contain spaces: tel:042 - 21 30 60
  const telPatterns = [
    /href=["']tel:([^"']+)["']/gi,
    /tel:([+\d][\d\s.\-–—−()]{5,})/gi,
  ];
  for (const re of telPatterns) {
    for (const m of searchable.matchAll(re)) {
      const raw = decodeURIComponent(m[1]!).trim();
      const value = normalizePhone(raw);
      if (!value || !isPlausibleNordicPhone(value)) continue;
      const snippet = clipSnippet(
        stripTags(searchable.slice(Math.max(0, m.index! - 80), m.index! + 140)),
      );
      if (looksLikeSvgPath(snippet, raw) || looksLikeTechId(searchable, m.index!, m[0]!, snippet)) {
        continue;
      }
      out.push({
        value,
        source: "tel link",
        snippet,
        page_url: pageUrl,
        score: scorePhone(value, snippet, "tel") + 6,
      });
    }
  }
  PHONE_RE.lastIndex = 0;
  for (const m of searchable.matchAll(PHONE_RE)) {
    const start = m.index! + (m[0]!.length - m[0]!.trimStart().length);
    const raw = m[0]!.trim();
    if (DATE_LIKE_RE.test(raw)) continue;
    if (/^-/.test(raw)) continue;
    const value = normalizePhone(raw);
    if (!value) continue;
    if (looksLikeCoordinatePhone(raw)) continue;
    if (!isPlausibleNordicPhone(value)) continue;
    const snippet = clipSnippet(stripTags(searchable.slice(Math.max(0, start - 80), start + 120)));
    if (looksLikeSvgPath(snippet, raw)) continue;
    if (looksLikeTechId(searchable, start, raw, snippet)) continue;
    if (DATE_LIKE_RE.test(snippet) && !PHONE_CONTEXT_RE.test(snippet)) continue;
    out.push({
      value,
      source: "phone in page text",
      snippet,
      page_url: pageUrl,
      score: scorePhone(value, snippet, "text"),
    });
  }
  if (searchableFooter) {
    PHONE_RE.lastIndex = 0;
    for (const m of searchableFooter.matchAll(PHONE_RE)) {
      const start = m.index! + (m[0]!.length - m[0]!.trimStart().length);
      const raw = m[0]!.trim();
      if (DATE_LIKE_RE.test(raw)) continue;
      if (/^-/.test(raw)) continue;
      const value = normalizePhone(raw);
      if (!value) continue;
      if (looksLikeCoordinatePhone(raw)) continue;
      if (!isPlausibleNordicPhone(value)) continue;
      const snippet = clipSnippet(
        stripTags(searchableFooter.slice(Math.max(0, start - 80), start + 120)),
      );
      if (looksLikeSvgPath(snippet, raw)) continue;
      if (looksLikeTechId(searchableFooter, start, raw, snippet)) continue;
      out.push({
        value,
        source: "footer phone",
        snippet,
        page_url: pageUrl,
        score: scorePhone(value, snippet, "footer"),
      });
    }
  }
  return dedupeEvidence(out).sort((a, b) => b.score - a.score);
}

function dedupeEvidence(list: ScoredEvidence[]) {
  const seen = new Set<string>();
  const out: ScoredEvidence[] = [];
  for (const item of list) {
    const key = item.value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
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
  const footer = footerHtml(html);

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

  const emails = collectEmailEvidence(html, pageUrl, footer);
  if (!email && emails[0]) {
    email = emails[0].value;
    signals.push("email on page");
  }
  for (const candidate of emails) {
    pushEvidence(email_evidence, candidate.value, candidate.source, candidate.snippet, candidate.page_url);
  }
  if (emails.length > 1) noteBits.push(`Other emails: ${emails.slice(1).map((e) => e.value).join(", ")}`);

  const phones = collectPhoneEvidence(html, pageUrl, footer);
  if (!phone && phones[0] && phones[0].score > 0) {
    phone = phones[0].value;
    signals.push("phone on page");
  }
  for (const candidate of phones) {
    pushEvidence(phone_evidence, candidate.value, candidate.source, candidate.snippet, candidate.page_url);
  }
  if (phones.length > 1) noteBits.push(`Other phones: ${phones.slice(1).map((p) => p.value).join(", ")}`);

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
