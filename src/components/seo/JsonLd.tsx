import { site } from "@/data/site";
import { getSiteUrl } from "@/lib/site-url";

export function JsonLd() {
  const url = getSiteUrl();

  const graph = [
    {
      "@type": "WebSite",
      "@id": `${url}/#website`,
      name: site.name,
      url,
      description: site.seo.description,
      inLanguage: "en",
      publisher: { "@id": `${url}/#person` },
    },
    {
      "@type": "Person",
      "@id": `${url}/#person`,
      name: site.name,
      url,
      email: site.contact.email,
      jobTitle: site.descriptor,
      description: site.seo.description,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Malmö",
        addressCountry: "SE",
      },
      sameAs: [site.social.linkedin, site.social.instagram],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${url}/#service`,
      name: `${site.name} — Web Design & Development`,
      url,
      description: site.seo.description,
      areaServed: "SE",
      provider: { "@id": `${url}/#person` },
    },
  ];

  const data = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
