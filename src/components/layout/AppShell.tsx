"use client";

import { usePathname } from "next/navigation";
import { ShowreelProvider } from "@/components/immersive/ShowreelGate";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <ShowreelProvider>
      <Header />
      <main className="w-full max-w-[100vw] overflow-x-clip">{children}</main>
      <Footer />
    </ShowreelProvider>
  );
}
