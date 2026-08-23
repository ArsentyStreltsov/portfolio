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
    title: "Arsenty Streltsov",
    description:
      "Independent web designer & developer in Malmö, Sweden. Modern websites for small businesses — clear process, direct communication, selected portfolio work.",
    startDescription:
      "Start a short project brief — tell me about your business, goals, and timeline. I'll reply within a day or two.",
  },
} as const;
