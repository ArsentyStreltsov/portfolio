import type { Metadata } from "next";
import { HeroSection } from "@/components/hero/HeroSection";
import { ImmersiveShowreel } from "@/components/immersive/ImmersiveShowreel";
import { SelectedWork } from "@/components/work/SelectedWork";
import { AboutSection } from "@/components/about/AboutSection";
import { SimpleProcess } from "@/components/process/SimpleProcess";
import { FinalCTA } from "@/components/cta/FinalCTA";
import { SectionTracker } from "@/components/analytics/SectionTracker";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: site.name,
  description: site.seo.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: site.name,
    description: site.seo.description,
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.seo.description,
  },
};

export default function HomePage() {
  return (
    <>
      <SectionTracker sectionId="hero">
        <HeroSection />
      </SectionTracker>
      <SectionTracker sectionId="immersive_showcase">
        <ImmersiveShowreel />
      </SectionTracker>
      <SectionTracker sectionId="selected_work">
        <SelectedWork />
      </SectionTracker>
      <SectionTracker sectionId="about">
        <AboutSection />
      </SectionTracker>
      <SectionTracker sectionId="process">
        <SimpleProcess />
      </SectionTracker>
      <SectionTracker sectionId="final_cta">
        <FinalCTA />
      </SectionTracker>
    </>
  );
}
