import type { Metadata, Viewport } from "next";
import { site } from "@/data/site";
import { AppShell } from "@/components/layout/AppShell";
import { TabTitle } from "@/components/layout/TabTitle";
import { JsonLd } from "@/components/seo/JsonLd";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4f0" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.name,
    template: `%s — ${site.name}`,
  },
  description: site.seo.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: siteUrl }],
  creator: site.name,
  publisher: site.name,
  keywords: [
    "web design",
    "web development",
    "small business websites",
    "Malmö",
    "Sweden",
    "Arsenty Streltsov",
    "freelance designer",
  ],
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: site.name,
    title: site.name,
    description: site.seo.description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.seo.description,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen" suppressHydrationWarning>
        <JsonLd />
        <TabTitle />
        <AnalyticsProvider>
          <AppShell>{children}</AppShell>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
