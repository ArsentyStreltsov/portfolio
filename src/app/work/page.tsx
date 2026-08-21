import type { Metadata } from "next";
import { SelectedWork } from "@/components/work/SelectedWork";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected web design and development projects for small businesses — concepts and client work by Arsenty Streltsov.",
  alternates: { canonical: "/work" },
  openGraph: {
    title: "Work",
    description: "Selected web design and development projects for small businesses.",
    url: "/work",
  },
};

export default function WorkPage() {
  return (
    <div className="pt-16">
      <SelectedWork />
    </div>
  );
}
