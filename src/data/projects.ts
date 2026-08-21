export type Project = {
  slug: string;
  title: string;
  category: string;
  projectType: "concept" | "client";
  description: string;
  year: number;
  /** Hero crop for grid cards */
  coverImage: string;
  /** Full-page desktop screenshot for showreel & browser modal */
  scrollImage: string;
  previewVideo?: string;
  desktopImages: string[];
  mobileImages: string[];
  accent: string;
  background: string;
  features: string[];
  demoUrl?: string;
  techStack?: string[];
};

export const projects: Project[] = [
  {
    slug: "kedjeverket",
    title: "Kedjeverket",
    category: "Local Service",
    projectType: "concept",
    description:
      "A bold website concept for an independent bike workshop, built around fast service, transparent pricing and a strong local identity.",
    year: 2026,
    coverImage: "/projects/kedjeverket/cover.webp",
    scrollImage: "/projects/kedjeverket/desktop-full.webp",
    desktopImages: ["/projects/kedjeverket/desktop-full.webp"],
    mobileImages: ["/projects/kedjeverket/mobile-full.webp"],
    accent: "#c8ff00",
    background: "#1a1a1a",
    features: ["Responsive", "Service navigation", "Contact CTA", "Motion", "Dark theme"],
    demoUrl: "#",
    techStack: ["React", "TanStack Start", "Tailwind CSS"],
  },
  {
    slug: "voltbyte",
    title: "Voltbyte",
    category: "E-commerce",
    projectType: "concept",
    description:
      "A full-featured gaming PC store with product catalogue, comparison, guided finder and cart — designed to compete with Nordic electronics retailers.",
    year: 2026,
    coverImage: "/projects/voltbyte/cover.webp",
    scrollImage: "/projects/voltbyte/desktop-full.webp",
    desktopImages: ["/projects/voltbyte/desktop-full.webp"],
    mobileImages: ["/projects/voltbyte/mobile-full.webp"],
    accent: "#2563eb",
    background: "#f8fafc",
    features: ["Product catalogue", "Search", "Compare", "Cart", "Recommendation flow"],
    demoUrl: "#",
    techStack: ["React", "TanStack Start", "Tailwind CSS", "Zustand"],
  },
  {
    slug: "soldeg",
    title: "Soldeg",
    category: "Café & Bakery",
    projectType: "concept",
    description:
      "A warm, editorial website for a neighbourhood bakery — seasonal menu, ordering flow and a strong sense of craft.",
    year: 2026,
    coverImage: "/projects/soldeg/cover.webp",
    scrollImage: "/projects/soldeg/desktop-full.webp",
    desktopImages: ["/projects/soldeg/desktop-full.webp"],
    mobileImages: ["/projects/soldeg/mobile-full.webp"],
    accent: "#8b5e34",
    background: "#faf6f1",
    features: ["Menu display", "Order flow", "Seasonal content", "Warm typography"],
    demoUrl: "#",
    techStack: ["React", "Next.js", "Tailwind CSS"],
  },
  {
    slug: "atelje-vessla",
    title: "Ateljé Vessla",
    category: "Beauty & Barber",
    projectType: "concept",
    description:
      "A refined barbershop website with team presentation, service list and booking — moody photography meets clean layout.",
    year: 2026,
    coverImage: "/projects/atelje-vessla/cover.webp",
    scrollImage: "/projects/atelje-vessla/desktop-full.webp",
    desktopImages: ["/projects/atelje-vessla/desktop-full.webp"],
    mobileImages: ["/projects/atelje-vessla/mobile-full.webp"],
    accent: "#c9a96e",
    background: "#1c1c1c",
    features: ["Team section", "Service list", "Booking CTA", "Dark aesthetic"],
    demoUrl: "#",
    techStack: ["React", "Next.js", "Tailwind CSS"],
  },
  {
    slug: "rullverket",
    title: "Rullverket",
    category: "Local Service",
    projectType: "concept",
    description:
      "A clear, trustworthy bike workshop site focused on booking, services and local presence in Malmö.",
    year: 2026,
    coverImage: "/projects/rullverket/cover.webp",
    scrollImage: "/projects/rullverket/desktop-full.webp",
    desktopImages: ["/projects/rullverket/desktop-full.webp"],
    mobileImages: ["/projects/rullverket/mobile-full.webp"],
    accent: "#e11d48",
    background: "#0a0a0a",
    features: ["Booking flow", "Service list", "Local presence", "Responsive"],
    demoUrl: "#",
    techStack: ["React", "Next.js", "Tailwind CSS"],
  },
  {
    slug: "solhylla",
    title: "Café Solhylla",
    category: "Café",
    projectType: "concept",
    description:
      "A bright waterside café site — coffee, art and conversation, with a calm layout that leads visitors to the door.",
    year: 2026,
    coverImage: "/projects/solhylla/cover.webp",
    scrollImage: "/projects/solhylla/desktop-full.webp",
    desktopImages: ["/projects/solhylla/desktop-full.webp"],
    mobileImages: ["/projects/solhylla/mobile-full.webp"],
    accent: "#0ea5e9",
    background: "#f8fafc",
    features: ["Hero storytelling", "Visit info", "Menu highlights", "Responsive"],
    demoUrl: "#",
    techStack: ["React", "Vite", "Tailwind CSS"],
  },
  {
    slug: "bris",
    title: "Restaurang Bris",
    category: "Restaurant",
    projectType: "concept",
    description:
      "A Nordic restaurant website by the harbour — open fire, coastal produce and evenings that stretch into wine lists.",
    year: 2026,
    coverImage: "/projects/bris/cover.webp",
    scrollImage: "/projects/bris/desktop-full.webp",
    desktopImages: ["/projects/bris/desktop-full.webp"],
    mobileImages: ["/projects/bris/mobile-full.webp"],
    accent: "#1d4ed8",
    background: "#0c1222",
    features: ["Menu presentation", "Atmosphere", "Reservation CTA", "Dark theme"],
    demoUrl: "#",
    techStack: ["React", "Next.js", "Tailwind CSS"],
  },
  {
    slug: "voltbyte-shop",
    title: "Voltbyte Butik",
    category: "E-commerce",
    projectType: "concept",
    description:
      "A gaming and tech retail concept with workshop booking, product strips and campaign blocks for a Malmö storefront.",
    year: 2026,
    coverImage: "/projects/voltbyte-shop/cover.webp",
    scrollImage: "/projects/voltbyte-shop/desktop-full.webp",
    desktopImages: ["/projects/voltbyte-shop/desktop-full.webp"],
    mobileImages: ["/projects/voltbyte-shop/mobile-full.webp"],
    accent: "#7c3aed",
    background: "#0b1020",
    features: ["Product grid", "Offers", "Workshop booking", "Trust signals"],
    demoUrl: "#",
    techStack: ["React", "Vite", "Tailwind CSS"],
  },
  {
    slug: "studio-alva",
    title: "Studio Alva",
    category: "Creative Studio",
    projectType: "concept",
    description:
      "An editorial portfolio for a spatial design studio — interiors, identity and visual direction with a calm, gallery-like pace.",
    year: 2026,
    coverImage: "/projects/studio-alva/cover.webp",
    scrollImage: "/projects/studio-alva/desktop-full.webp",
    desktopImages: ["/projects/studio-alva/desktop-full.webp"],
    mobileImages: ["/projects/studio-alva/mobile-full.webp"],
    accent: "#111111",
    background: "#f4f1ea",
    features: ["Case studies", "Editorial layout", "Typography", "Responsive"],
    demoUrl: "#",
    techStack: ["React", "Next.js", "Tailwind CSS"],
  },
];

/** Intro scroll: cafe-4, gaming-1, portfolio-1 */
export const showreelSlugs = ["bris", "voltbyte-shop", "studio-alva"] as const;

export const showreelProjects = showreelSlugs.map(
  (slug) => projects.find((p) => p.slug === slug)!,
);

/** Selected Work grid — all 9 (3×3) */
export const selectedWorkProjects = projects;

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
