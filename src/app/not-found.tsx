import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page does not exist.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <h1 className="font-display text-6xl font-bold">404</h1>
        <p className="mt-4 text-text-secondary">This page doesn&apos;t exist.</p>
        <Link
          href="/"
          className="mt-8 inline-block text-sm font-medium uppercase tracking-[0.1em] text-text-secondary hover:text-text"
        >
          ← Back to homepage
        </Link>
      </div>
    </div>
  );
}
