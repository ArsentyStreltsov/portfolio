"use client";

import { ShowreelProvider } from "@/components/immersive/ShowreelGate";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ShowreelProvider>
      <Header />
      <main className="w-full max-w-[100vw] overflow-x-clip">{children}</main>
      <Footer />
    </ShowreelProvider>
  );
}
