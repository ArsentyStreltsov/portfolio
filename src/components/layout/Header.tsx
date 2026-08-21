"use client";

import { useState, useEffect, type MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { site } from "@/data/site";
import { cn } from "@/lib/cn";
import { track } from "@/lib/analytics";
import { queueShowreelSkip, useShowreelNav } from "@/components/immersive/ShowreelGate";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const onHome = pathname === "/";
  const { goToHash } = useShowreelNav();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navHref = (hash: string) => (onHome ? hash : `/${hash}`);

  const onHashClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    setMenuOpen(false);
    if (!onHome) {
      queueShowreelSkip(href);
      router.push("/");
      return;
    }
    goToHash(href);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-bg/90 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      )}
    >
      <div className="container-main flex h-14 items-center justify-between">
        <a href="/" className="font-display text-sm font-bold uppercase tracking-[0.15em]">
          {site.name}
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {site.nav.map((item) => (
            <a
              key={item.href}
              href={navHref(item.href)}
              onClick={(e) => onHashClick(e, item.href)}
              className="text-[0.8rem] font-medium uppercase tracking-[0.12em] text-text-secondary transition-colors hover:text-text"
            >
              {item.label}
            </a>
          ))}
          <a
            href="/start"
            onClick={() => track("start_project_click")}
            className="bg-text text-bg px-5 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.12em] transition-transform hover:scale-[1.02]"
          >
            Start a project
          </a>
        </nav>

        <button
          className="md:hidden text-text"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {menuOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-bg px-6 py-8">
          <nav className="flex flex-col gap-6">
            {site.nav.map((item) => (
              <a
                key={item.href}
                href={navHref(item.href)}
                onClick={(e) => onHashClick(e, item.href)}
                className="text-lg font-medium uppercase tracking-[0.08em]"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/start"
              onClick={() => { setMenuOpen(false); track("start_project_click"); }}
              className="bg-text text-bg px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.12em]"
            >
              Start a project
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
