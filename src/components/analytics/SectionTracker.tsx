"use client";

import { useEffect, useRef } from "react";
import { track, type SectionId } from "@/lib/analytics";

const VIEWED_KEY = "portfolio_sections_viewed_v1";

function readViewed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(VIEWED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeViewed(set: Set<string>) {
  try {
    sessionStorage.setItem(VIEWED_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

export function SectionTracker({
  sectionId,
  children,
  className,
}: {
  sectionId: SectionId;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const viewed = readViewed();
    if (viewed.has(sectionId)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        if (
          entry.isIntersecting &&
          entry.intersectionRatio >= 0.45 &&
          document.visibilityState === "visible"
        ) {
          if (timer.current) return;
          timer.current = window.setTimeout(() => {
            const latest = readViewed();
            if (latest.has(sectionId)) return;
            latest.add(sectionId);
            writeViewed(latest);
            track("section_viewed", { section_id: sectionId });
            observer.disconnect();
          }, 400);
        } else if (timer.current) {
          window.clearTimeout(timer.current);
          timer.current = null;
        }
      },
      { threshold: [0.45] },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [sectionId]);

  return (
    <div ref={ref} className={className} data-section={sectionId}>
      {children}
    </div>
  );
}
