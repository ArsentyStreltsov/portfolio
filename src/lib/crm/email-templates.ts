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

/** Edit these — {{business_name}}, {{contact_name}}, {{outreach_url}}, {{my_name}}, {{my_first_name}}, {{location}} */
export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "cold_v1",
    label: "Cold email (default)",
    subject: "Quick idea for {{business_name}}'s website",
    body: `Hi{{contact_greeting}},

I came across {{business_name}} and wanted to reach out quickly.

I design and build websites for small businesses in {{location}} — clear structure, modern look, and something that actually helps get enquiries.

Here's a short look at my work (personal link):
{{outreach_url}}

If a refresh or a new site is on your mind this year, happy to share a few thoughts for {{business_name}} — no pressure.

Best,
{{my_name}}
{{my_email}}`,
  },
  {
    id: "cold_short",
    label: "Cold email (short)",
    subject: "{{business_name}} — website?",
    body: `Hi{{contact_greeting}},

Quick note — I help small businesses with modern websites. Thought {{business_name}} might find this useful:

{{outreach_url}}

Happy to share ideas if timing is right.

{{my_first_name}}`,
  },
  {
    id: "followup_v1",
    label: "Follow-up",
    subject: "Re: {{business_name}} website",
    body: `Hi{{contact_greeting}},

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
  const vars: Record<string, string> = {
    business_name: input.business_name.trim() || "your business",
    contact_name: contact,
    contact_greeting: contact ? ` ${contact.split(" ")[0]}` : "",
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
