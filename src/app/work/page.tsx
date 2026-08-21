import type { Metadata } from "next";
import { SelectedWork } from "@/components/work/SelectedWork";

export const metadata: Metadata = {
  title: "Work — Arsenty Streltsov",
  description: "Selected web design and development projects.",
};

export default function WorkPage() {
  return (
    <div className="pt-16">
      <SelectedWork />
    </div>
  );
}
