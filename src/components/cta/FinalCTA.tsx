"use client";

import { site } from "@/data/site";
import { track } from "@/lib/analytics";

export function FinalCTA() {
  return (
    <section className="bg-bg-dark py-32 text-text-inverse md:py-40">
      <div className="container-main">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.3em] text-text-inverse/50">
          Have a business?
        </p>
        <h2 className="mt-6 w-full max-w-full font-display text-[clamp(2.1rem,calc(1rem+3.8vw),5rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.03em]">
          Let&apos;s make
          <br />
          it look the part
        </h2>
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="/start"
            onClick={() =>
              track("cta_clicked", {
                cta_id: "start_project",
                cta_location: "final_cta",
                destination: "/start",
              })
            }
            className="bg-accent text-bg-dark px-7 py-3.5 text-[0.8rem] font-bold uppercase tracking-[0.12em] transition-transform hover:scale-[1.02]"
          >
            Start the short brief
          </a>
          <a
            href={`mailto:${site.contact.email}`}
            onClick={() =>
              track("email_contact_clicked", {
                cta_id: "email_me",
                cta_location: "final_cta",
                destination: "mailto",
              })
            }
            className="border border-text-inverse/30 px-7 py-3.5 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-text-inverse transition-colors hover:border-text-inverse"
          >
            Email me
          </a>
        </div>
      </div>
    </section>
  );
}
