"use client";

import { useLayoutEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { showreelProjects } from "@/data/projects";
import { BrowserChrome } from "./BrowserChrome";
import { useShowreelGate } from "./ShowreelGate";

const PER_SITE_SCROLL_DURATION = 1.1;
const CROSSFADE_DURATION = 0.35;
const HOLD_AFTER_SITE = 0.18;

function activeFrame(): "mobile" | "desktop" {
  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
}

function getScrollDistance(index: number, root: HTMLElement | null) {
  if (!root) return 0;
  const frame = activeFrame();
  const img = root.querySelector(
    `[data-scroll-img="${index}"][data-frame="${frame}"]`,
  ) as HTMLElement | null;
  const viewport = root.querySelector(`[data-scroll-viewport="${index}"]`) as HTMLElement | null;
  if (!img || !viewport) return 0;
  return Math.max(0, img.offsetHeight - viewport.offsetHeight);
}

/**
 * Scrubbed intro after Hero: phrase → browser with 3 projects.
 * Mobile: portrait phone frame + mobile screenshots.
 * Desktop: landscape browser + desktop screenshots.
 */
export function ImmersiveShowreel() {
  const wrapper = useRef<HTMLDivElement>(null);
  const pinned = useRef<HTMLDivElement>(null);
  const { consumed, completeByScroll, goToHash } = useShowreelGate();

  useLayoutEffect(() => {
    if (!consumed) return;
    ScrollTrigger.getAll().forEach((t) => t.kill());
    ScrollTrigger.refresh();
  }, [consumed]);

  useGSAP(
    () => {
      if (consumed) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const refreshScroll = () => ScrollTrigger.refresh();

        showreelProjects.forEach((_, i) => {
          pinned.current
            ?.querySelectorAll(`[data-scroll-img="${i}"]`)
            .forEach((img) => img.addEventListener("load", refreshScroll));
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrapper.current,
            start: "top top",
            end: "bottom bottom",
            pin: pinned.current,
            scrub: 1.2,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onLeave: (self) => {
              if (self.direction !== 1) return;
              self.kill();
              completeByScroll();
            },
          },
        });

        ScrollTrigger.create({
          trigger: wrapper.current,
          start: "top top",
          once: true,
          onEnter: () => {
            gsap.to("[data-just-scroll]", {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power2.out",
              delay: 2,
            });
          },
        });

        tl.to({}, { duration: 0.45 })
          .to("[data-immersive-intro]", { opacity: 0, duration: 0.16 })
          .fromTo(
            "[data-browser]",
            { scale: 0.42, opacity: 0 },
            { scale: 0.42, opacity: 1, duration: 0.12 },
          )
          .to("[data-browser]", { scale: 1, duration: 0.24 })
          .to({}, { duration: 0.12 });

        showreelProjects.forEach((_, i) => {
          if (i > 0) {
            tl.to(`[data-project="${i - 1}"]`, { opacity: 0, duration: CROSSFADE_DURATION * 0.55 })
              .set(`[data-scroll-img="${i - 1}"]`, { y: 0 })
              .fromTo(
                `[data-project="${i}"]`,
                { opacity: 0 },
                { opacity: 1, duration: CROSSFADE_DURATION * 0.55 },
                "<0.08",
              )
              .to({}, { duration: 0.1 });
          } else {
            tl.fromTo(`[data-project="0"]`, { opacity: 0 }, { opacity: 1, duration: 0.14 });
          }

          tl.fromTo(
            `[data-scroll-img="${i}"][data-frame="${activeFrame()}"]`,
            { y: 0 },
            {
              y: () => -getScrollDistance(i, pinned.current),
              ease: "none",
              duration: PER_SITE_SCROLL_DURATION,
            },
          );

          tl.to({}, { duration: HOLD_AFTER_SITE });
        });

        tl.to("[data-browser]", { opacity: 0, scale: 0.96, duration: 0.2 }, "+=0.06");

        return () => {
          showreelProjects.forEach((_, i) => {
            pinned.current
              ?.querySelectorAll(`[data-scroll-img="${i}"]`)
              .forEach((img) => img.removeEventListener("load", refreshScroll));
          });
        };
      });
    },
    { scope: wrapper, dependencies: [consumed, completeByScroll] },
  );

  if (consumed) return null;

  const closeShowreel = () => goToHash("#work");

  return (
    <div id="showreel" className="w-full max-w-[100vw] overflow-x-clip">
      <div ref={wrapper} className="relative h-[900vh] w-full md:h-[1400vh]">
        <div
          ref={pinned}
          className="flex h-[100dvh] w-full max-w-[100vw] items-center justify-center overflow-hidden"
        >
          <div
            data-immersive-intro
            className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center sm:px-6"
          >
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-text-secondary sm:text-[0.7rem] sm:tracking-[0.3em]">
              Scroll to explore
            </p>
            <h2 className="mt-4 max-w-3xl font-display text-[clamp(1.45rem,5.4vw,3.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
              You don&apos;t need to imagine what we can build —{" "}
              <span
                data-just-scroll
                className="mt-2 inline-block translate-y-2 bg-accent px-2.5 py-1 text-bg-dark opacity-0 sm:mt-0 sm:px-3"
              >
                just scroll
              </span>
            </h2>
          </div>

          <div
            data-browser
            className="absolute left-1/2 w-[min(78vw,19rem)] max-w-5xl -translate-x-1/2 opacity-0 sm:w-[min(70vw,22rem)] md:w-[min(75vw,64rem)]"
          >
            <BrowserChrome onClose={closeShowreel}>
              {/* Mobile: tall phone frame; desktop: landscape browser */}
              <div className="relative h-[min(72dvh,34rem)] w-full md:h-auto md:aspect-[16/10]">
                {showreelProjects.map((p, i) => (
                  <div
                    key={p.slug}
                    data-project={i}
                    data-scroll-viewport={i}
                    className="absolute inset-0 overflow-hidden opacity-0"
                    style={{ backgroundColor: p.background }}
                  >
                    <img
                      data-scroll-img={i}
                      data-frame="mobile"
                      src={p.mobileImages[0] ?? p.scrollImage}
                      alt={`${p.title} mobile preview`}
                      className="block w-full max-w-full will-change-transform md:hidden"
                      draggable={false}
                    />
                    <img
                      data-scroll-img={i}
                      data-frame="desktop"
                      src={p.scrollImage}
                      alt={`${p.title} full page preview`}
                      className="hidden w-full max-w-full will-change-transform md:block"
                      draggable={false}
                    />
                    <div className="pointer-events-none absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
                      <span className="bg-bg/80 px-2 py-1 text-[0.55rem] font-medium uppercase tracking-[0.16em] backdrop-blur-sm sm:px-3 sm:text-[0.6rem] sm:tracking-[0.2em]">
                        {String(i + 1).padStart(2, "0")} — {p.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </BrowserChrome>
          </div>
        </div>
      </div>
    </div>
  );
}
