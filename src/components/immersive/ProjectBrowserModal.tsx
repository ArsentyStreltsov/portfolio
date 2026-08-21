"use client";

import { useEffect, useRef } from "react";
import type { Project } from "@/data/projects";
import { BrowserChrome } from "./BrowserChrome";

export function ProjectBrowserModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [project.slug]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-dark/70 p-3 backdrop-blur-sm sm:p-4 md:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${project.title} preview`}
    >
      <div
        className="relative flex h-[min(88dvh,52rem)] w-full max-w-[24rem] flex-col md:h-auto md:max-h-[90vh] md:max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-9 right-0 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-text-inverse/80 transition-colors hover:text-text-inverse md:-top-12"
        >
          Close ✕
        </button>

        <BrowserChrome
          title={project.title}
          onClose={onClose}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            style={{ backgroundColor: project.background }}
          >
            <img
              src={project.mobileImages[0] ?? project.scrollImage}
              alt={`${project.title} full page`}
              className="block w-full md:hidden"
              draggable={false}
            />
            <img
              src={project.scrollImage}
              alt={`${project.title} full page`}
              className="hidden w-full md:block"
              draggable={false}
            />
          </div>
        </BrowserChrome>

        <p className="mt-3 text-center text-[0.65rem] uppercase tracking-[0.2em] text-text-inverse/60">
          {project.category} — scroll inside the window
        </p>
      </div>
    </div>
  );
}
