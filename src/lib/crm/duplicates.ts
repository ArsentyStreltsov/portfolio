import type { LeadStatus } from "./db";
import { readStore } from "./store";

export type DuplicateMatch = {
  lead_id: string;
  business_name: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  reasons: string[];
};

function normalizeHost(raw?: string | null) {
  if (!raw?.trim()) return "";
  try {
    const withProto = /^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;
    const host = new URL(withProto).hostname.toLowerCase().replace(/^www\./, "");
    return host;
  } catch {
    return raw
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]!
      .split("?")[0]!;
  }
}

function normalizeEmail(raw?: string | null) {
  return (raw ?? "").trim().toLowerCase();
}

function normalizePhoneDigits(raw?: string | null) {
  const digits = (raw ?? "").replace(/[^\d]/g, "");
  if (!digits) return "";
  // Compare on national tail so +46 / 0 variants match.
  if (digits.startsWith("46") && digits.length >= 10) return digits.slice(-9);
  if (digits.startsWith("0") && digits.length >= 8) return digits.slice(-9);
  return digits.length >= 8 ? digits.slice(-9) : digits;
}

function normalizeBusinessName(raw?: string | null) {
  return (raw ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(ab|hb|kb|aktiebolag|konditori|cafe|café|restaurang|bageri|the)\b/g, " ")
    .replace(/[^a-z0-9åäö]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function namesLookAlike(a: string, b: string) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  if (a.includes(b) || b.includes(a)) return true;
  // Token overlap: at least one meaningful shared token
  const ta = new Set(a.split(" ").filter((t) => t.length >= 4));
  const tb = b.split(" ").filter((t) => t.length >= 4);
  return tb.some((t) => ta.has(t));
}

export function findLikelyDuplicates(input: {
  business_name?: string;
  website?: string;
  email?: string;
  phone?: string;
  exclude_lead_id?: string;
}): DuplicateMatch[] {
  const host = normalizeHost(input.website);
  const email = normalizeEmail(input.email);
  const phone = normalizePhoneDigits(input.phone);
  const name = normalizeBusinessName(input.business_name);

  if (!host && !email && !phone && !name) return [];

  const matches: DuplicateMatch[] = [];

  for (const lead of readStore().leads) {
    if (input.exclude_lead_id && lead.lead_id === input.exclude_lead_id) continue;

    const reasons: string[] = [];
    const leadHost = normalizeHost(lead.website);
    const leadEmail = normalizeEmail(lead.email);
    const leadPhone = normalizePhoneDigits(lead.phone);
    const leadName = normalizeBusinessName(lead.business_name);

    if (host && leadHost && host === leadHost) reasons.push("same website");
    if (email && leadEmail && email === leadEmail) reasons.push("same email");
    if (phone && leadPhone && phone.length >= 7 && phone === leadPhone) reasons.push("same phone");
    if (name && leadName && namesLookAlike(name, leadName)) reasons.push("similar business name");

    if (reasons.length === 0) continue;

    matches.push({
      lead_id: lead.lead_id,
      business_name: lead.business_name,
      website: lead.website,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      reasons,
    });
  }

  // Stronger matches first (more reasons / website+email)
  return matches.sort((a, b) => {
    const score = (m: DuplicateMatch) =>
      (m.reasons.includes("same website") ? 4 : 0) +
      (m.reasons.includes("same email") ? 3 : 0) +
      (m.reasons.includes("same phone") ? 3 : 0) +
      (m.reasons.includes("similar business name") ? 1 : 0) +
      m.reasons.length;
    return score(b) - score(a);
  });
}

