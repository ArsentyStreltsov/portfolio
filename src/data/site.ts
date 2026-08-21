export const site = {
  name: "Arsenty Streltsov",
  shortName: "AS.",
  logoVariant: "ARSENTY / WEB" as const,
  descriptor: "Independent web designer & developer",
  tagline: "Websites for small businesses",

  contact: {
    email: "arsentystreltsov@gmail.com",
    phone: "+46 73 XXX XX XX",
    location: "Malmö, Sweden",
  },

  social: {
    linkedin: "https://www.linkedin.com/in/arsenty-streltsov/",
    instagram: "https://instagram.com/arsenty.dev",
  },

  availability: "Currently taking new projects",

  nav: [
    { label: "Portfolio", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Process", href: "#process" },
  ],

  seo: {
    title: "Arsenty Streltsov — Web Design & Development for Small Businesses",
    description:
      "Modern websites for small businesses — designed and built with a fast, clear and personal process.",
    ogImage: "/og.png",
  },
} as const;
