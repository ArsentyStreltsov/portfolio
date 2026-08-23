"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AdminNav() {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="border-b border-border bg-bg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-display text-lg font-bold uppercase tracking-[-0.02em]">
            Outreach CRM
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
            <Link
              href="/admin"
              className="text-[0.7rem] font-medium uppercase tracking-[0.15em] text-text-secondary hover:text-text"
            >
              Pipeline
            </Link>
            <Link
              href="/admin/leads/new"
              className="text-[0.7rem] font-medium uppercase tracking-[0.15em] text-text-secondary hover:text-text"
            >
              New lead
            </Link>
          </nav>
        </div>
        <button
          type="button"
          onClick={logout}
          className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-text-secondary hover:text-text"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
