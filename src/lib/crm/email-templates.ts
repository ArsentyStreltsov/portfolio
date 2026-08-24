import { site } from "@/data/site";

export type EmailTemplateId = "cold_a" | "cold_b" | "followup_v1";

export type EmailTemplate = {
  id: EmailTemplateId;
  label: string;
  subject: string;
  body: string;
};

export type EmailMergeVars = {
  business_name: string;
  contact_name: string;
  outreach_url: string;
  my_name: string;
  my_first_name: string;
  location: string;
};

/**
 * A/B cold emails — keep short.
 * Short outreach links use only ?lead_id=… (no utm). Variant is stored on the touch when marked sent.
 *
 * Vars: {{hello}}, {{outreach_url}}, {{my_name}}, {{my_first_name}}
 */
export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "cold_a",
    label: "A/B · A (competitors)",
    subject: "Want a website your competitors wish they had?",
    body: `{{hello}}

Google/Ipsos research found that 67% of consumers visit a brand’s website before buying. If that first impression is weak, you can lose the customer before they ever contact you.

And that’s exactly where I help businesses. I build modern websites — fast, clear, and without agency pricing.

A few examples:
{{outreach_url}}

If it might work for you, I can send a short brief to start the process!

Would that be of interest?

{{my_name}}`,
  },
  {
    id: "cold_b",
    label: "A/B · B (67% hook)",
    subject: "67% of buyers check your website before they buy",
    body: `{{hello}}

According to Google and Ipsos, 67% of consumers look up a brand or product’s website before making a purchase. So the website often decides whether they take the next step or leave.

So if you’ve ever thought about giving your website a refresh, that’s exactly what I do — clean, professional sites without long timelines or big agency budgets.

See some of my work here:
{{outreach_url}}

Happy to send a short brief if you want to explore this further.

Thank you for your time!
{{my_first_name}}`,
  },
  {
    id: "followup_v1",
    label: "Follow-up",
    subject: "Quick follow-up on the website note",
    body: `{{hello}}

Just floating this again in case it got buried — a few website examples here:
{{outreach_url}}

No worries if the timing isn’t right.

{{my_first_name}}`,
  },
];

export const COLD_AB_TEMPLATE_IDS: EmailTemplateId[] = ["cold_a", "cold_b"];

function applyVars(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function renderEmailTemplate(
  template: EmailTemplate,
  input: {
    business_name: string;
    contact_name?: string | null;
    outreach_url: string;
  },
) {
  const contact = input.contact_name?.trim() || "";
  const firstName = site.name.split(" ")[0] ?? site.name;
  const contactFirst = contact ? contact.split(/\s+/)[0]! : "";
  const vars: Record<string, string> = {
    business_name: input.business_name.trim() || "your business",
    contact_name: contact,
    hello: contactFirst ? `Hello ${contactFirst}!` : "Hello!",
    contact_greeting: contactFirst ? ` ${contactFirst}` : "",
    outreach_url: input.outreach_url,
    my_name: site.name,
    my_first_name: firstName,
    my_email: site.contact.email,
    location: site.contact.location,
  };

  return {
    subject: applyVars(template.subject, vars).replace(/\s+/g, " ").trim(),
    body: applyVars(template.body, vars).trim(),
  };
}

export function gmailComposeUrl(to: string, subject: string, body: string) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to,
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}
