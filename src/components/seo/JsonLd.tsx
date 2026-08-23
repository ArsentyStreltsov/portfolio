import { site } from "@/data/site";
import { getSiteUrl } from "@/lib/site-url";

/** Malmö city centre — for LocalBusiness / geo hints only. */
const MALMO_GEO = { latitude: 55.605, longitude: 13.0038 };

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
      jobTitle: site.descriptor,
      description: site.seo.description,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Malmö",
        addressRegion: "Skåne",
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
      image: `${url}/opengraph-image`,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Malmö",
        addressRegion: "Skåne",
        addressCountry: "SE",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: MALMO_GEO.latitude,
        longitude: MALMO_GEO.longitude,
      },
      areaServed: [
        { "@type": "City", name: "Malmö" },
        { "@type": "AdministrativeArea", name: "Skåne County" },
        { "@type": "Country", name: "Sweden" },
      ],
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
