import type { Metadata } from "next";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Start a project",
  description: site.seo.startDescription,
  alternates: { canonical: "/start" },
  openGraph: {
    title: "Start a project",
    description: site.seo.startDescription,
    url: "/start",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Start a project",
    description: site.seo.startDescription,
  },
  robots: { index: true, follow: true },
};

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
