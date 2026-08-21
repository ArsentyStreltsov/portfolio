import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start a project",
  description:
    "Tell me about your business and goals — a short brief to start a website project with Arsenty Streltsov.",
  alternates: { canonical: "/start" },
  openGraph: {
    title: "Start a project",
    description:
      "Tell me about your business and goals — a short brief to start a website project.",
    url: "/start",
  },
  robots: { index: true, follow: true },
};

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
