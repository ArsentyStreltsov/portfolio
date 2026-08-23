import { site } from "@/data/site";

export type EmailTemplateId = "cold_v1" | "cold_short" | "followup_v1";

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

/** Edit these — {{business_name}}, {{hello}}, {{outreach_url}}, {{my_name}}, … */
export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "cold_v1",
    label: "Cold email (default)",
    subject: 'Want a website for "{{business_name}}" your competitors wish they had?',
    body: `{{hello}}

According to research from Google and Ipsos, 67% of consumers visit a brand or product’s website before making a purchase.

That means having a strong online presence can be important for not losing potential customers early in their decision-making process and that’s exactly what I help businesses with.

I create modern, professional websites without long development timelines, complicated processes, or large agency budgets. The goal isn’t just to make something that looks nice, it’s to make it easier for potential customers to understand what you offer and take the next step.

Here are a few examples of websites I’ve already worked on:
{{outreach_url}}

I keep the whole process simple, fast, and reasonably priced.

If you like the idea, I can send you a short brief with a few questions about your business and the style you like. It’ll help me understand what you need and make sure the website actually fits your business.

Would that be of interest?
{{my_name}}`,
  },
  {
    id: "cold_short",
    label: "Cold email (short)",
    subject: "{{business_name}} — website?",
    body: `{{hello}}

Quick note — I help small businesses with modern websites. Thought {{business_name}} might find this useful:

{{outreach_url}}

Happy to share ideas if timing is right.

{{my_first_name}}`,
  },
  {
    id: "followup_v1",
    label: "Follow-up",
    subject: "Re: {{business_name}} website",
    body: `{{hello}}

Just floating this again in case it got buried — here's my work for {{business_name}}:

{{outreach_url}}

No worries if now isn't the right time.

{{my_first_name}}`,
  },
];

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
