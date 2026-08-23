"use client";

import { useRef, type MouseEvent } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { track } from "@/lib/analytics";
import { useShowreelNav } from "@/components/immersive/ShowreelGate";

export function HeroSection() {
  const container = useRef<HTMLElement>(null);
  const { goToViewWork } = useShowreelNav();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from("[data-hero-eyebrow]", { y: 20, opacity: 0, duration: 0.6 })
          .from("[data-hero-line]", { y: 40, opacity: 0, duration: 0.65, stagger: 0.1 }, "-=0.3")
          .from("[data-hero-cta]", { y: 16, opacity: 0, duration: 0.45, stagger: 0.08, clearProps: "transform" }, "-=0.2")
          .from("[data-hero-micro]", { y: 10, opacity: 0, duration: 0.4, clearProps: "transform" }, "-=0.1");
      });
    },
    { scope: container }
  );

  return (
    <section ref={container} className="relative flex min-h-screen flex-col justify-center pt-20 pb-16">
      <div className="container-main">
        <p
          data-hero-eyebrow
          className="max-w-[16rem] text-[0.65rem] font-medium uppercase leading-relaxed tracking-[0.28em] text-text-secondary sm:max-w-none sm:text-[0.7rem] sm:tracking-[0.3em]"
        >
          Independent web design &amp; development
        </p>

        <h1 className="mt-6 w-full max-w-full break-words font-display font-extrabold uppercase leading-[0.9] tracking-[-0.04em] text-[clamp(1.9rem,calc(0.4rem+6.6vw),5.75rem)]">
          <span data-hero-line className="block">
            Good <br className="sm:hidden" />
            businesses
          </span>
          <span data-hero-line className="block">
            deserve <br className="sm:hidden" />
            better
          </span>
          <span data-hero-line className="mt-1 block sm:mt-2">
            <span className="box-decoration-clone bg-accent px-[0.12em] text-bg-dark [-webkit-box-decoration-break:clone] [box-decoration-break:clone]">
              websites
            </span>
          </span>
        </h1>

        <div className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
          <a
            data-hero-cta
            href="#showreel"
            onClick={(e: MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              track("cta_clicked", {
                cta_id: "view_work",
                cta_location: "hero",
                destination: "#showreel",
              });
              goToViewWork();
            }}
            className="inline-flex w-full items-center justify-center bg-text px-6 py-3.5 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-bg transition-transform hover:scale-[1.02] sm:w-auto sm:px-7 sm:text-[0.8rem]"
          >
            View my work
          </a>
          <a
            data-hero-cta
            href="/start"
            onClick={() =>
              track("cta_clicked", {
                cta_id: "start_project",
                cta_location: "hero",
                destination: "/start",
              })
            }
            className="inline-flex w-full items-center justify-center border border-text px-6 py-3.5 text-[0.75rem] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-text hover:text-bg sm:w-auto sm:px-7 sm:text-[0.8rem]"
          >
            Start a project
          </a>
        </div>

        <p
          data-hero-micro
          className="mt-8 max-w-[18rem] text-[0.65rem] uppercase leading-relaxed tracking-[0.18em] text-text-muted sm:max-w-none sm:text-xs sm:tracking-[0.2em]"
        >
          One person · No overhead · Direct communication
        </p>
      </div>
    </section>
  );
}
