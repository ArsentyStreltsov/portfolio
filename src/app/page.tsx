import { HeroSection } from "@/components/hero/HeroSection";
import { ImmersiveShowreel } from "@/components/immersive/ImmersiveShowreel";
import { SelectedWork } from "@/components/work/SelectedWork";
import { AboutSection } from "@/components/about/AboutSection";
import { SimpleProcess } from "@/components/process/SimpleProcess";
import { FinalCTA } from "@/components/cta/FinalCTA";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ImmersiveShowreel />
      <SelectedWork />
      <AboutSection />
      <SimpleProcess />
      <FinalCTA />
    </>
  );
}
