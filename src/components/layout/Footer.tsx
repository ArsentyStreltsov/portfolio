"use client";

import type { MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { site } from "@/data/site";
import { track, openAnalyticsPreferences } from "@/lib/analytics";
import { SectionTracker } from "@/components/analytics/SectionTracker";
import { queueShowreelSkip, useShowreelNav } from "@/components/immersive/ShowreelGate";

export function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const onHome = pathname === "/";
  const { goToHash } = useShowreelNav();

  const navHref = (hash: string) => (onHome ? hash : `/${hash}`);

  const onHashClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    if (!onHome) {
      queueShowreelSkip(href);
      router.push("/");
      return;
    }
    goToHash(href);
  };

  return (
    <SectionTracker sectionId="footer">
      <footer className="border-t border-border py-16">
        <div className="container-main grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.15em]">{site.name}</p>
            <p className="mt-2 text-sm text-text-secondary">{site.descriptor}</p>
          </div>

          <nav className="flex flex-col gap-3">
            {site.nav.map((item) => (
              <a
                key={item.href}
                href={navHref(item.href)}
                onClick={(e) => onHashClick(e, item.href)}
                className="text-sm text-text-secondary transition-colors hover:text-text"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/start"
              onClick={() =>
                track("cta_clicked", {
                  cta_id: "start_project",
                  cta_location: "footer",
                  destination: "/start",
                })
              }
              className="text-sm text-text-secondary transition-colors hover:text-text"
            >
              Contact
            </a>
          </nav>

          <div className="flex flex-col gap-3 text-sm text-text-secondary">
            <a
              href={`mailto:${site.contact.email}`}
              onClick={() =>
                track("email_contact_clicked", {
                  cta_id: "email_me",
                  cta_location: "footer",
                  destination: "mailto",
                })
              }
              className="hover:text-text"
            >
              {site.contact.email}
            </a>
            {site.social.linkedin && (
              <a
                href={site.social.linkedin}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  track("linkedin_clicked", {
                    cta_id: "linkedin",
                    cta_location: "footer",
                    destination: "linkedin",
                  })
                }
                className="hover:text-text"
              >
                LinkedIn
              </a>
            )}
          </div>
        </div>

        <div className="container-main mt-12 flex flex-col gap-2 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {site.name}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <button
              type="button"
              onClick={openAnalyticsPreferences}
              className="text-text-muted underline-offset-2 hover:text-text hover:underline"
            >
              Cookie settings
            </button>
            <span className="hidden sm:inline text-text-muted/40">·</span>
            <span>Built with care</span>
          </div>
        </div>
      </footer>
    </SectionTracker>
  );
}
