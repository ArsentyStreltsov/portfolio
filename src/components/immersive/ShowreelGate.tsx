"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

const SKIP_TO_KEY = "showreel-skip-to";

type ShowreelContextValue = {
  /** True after the intro scroll was finished or skipped (resets on full reload) */
  consumed: boolean;
  /** Finish/skip the showreel and jump (or smooth-scroll) to a section */
  goToHash: (hash: string) => void;
  /**
   * Hero "View my work":
   * - not viewed yet → scroll to showreel phrase
   * - already viewed → Portfolio / Selected work
   */
  goToViewWork: () => void;
  /** Called when the user finishes the showreel by scrolling through it */
  completeByScroll: () => void;
};

const ShowreelContext = createContext<ShowreelContextValue | null>(null);

function sectionId(hash: string) {
  return hash.startsWith("#") ? hash.slice(1) : hash;
}

function jumpToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, Math.max(0, top));
  html.style.scrollBehavior = prev;
}

function smoothToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Remember a section to open after navigating home (skips the showreel). */
export function queueShowreelSkip(hash: string) {
  const id = sectionId(hash);
  if (!id || id === "showreel") return;
  try {
    sessionStorage.setItem(SKIP_TO_KEY, id);
  } catch {
    /* ignore */
  }
}

function readQueuedSkip(): string | null {
  try {
    const id = sessionStorage.getItem(SKIP_TO_KEY);
    if (id) sessionStorage.removeItem(SKIP_TO_KEY);
    return id;
  } catch {
    return null;
  }
}

export function ShowreelProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [consumed, setConsumed] = useState(false);
  const pendingId = useRef<string | null>(null);
  const consumedRef = useRef(false);

  const skipToSection = useCallback((id: string) => {
    pendingId.current = id;
    if (consumedRef.current) {
      jumpToId(id);
      requestAnimationFrame(() => jumpToId(id));
      return;
    }
    consumedRef.current = true;
    setConsumed(true);
  }, []);

  // Deep-link / soft-nav from other pages: land on section as if showreel already done
  useLayoutEffect(() => {
    if (pathname !== "/") return;

    const queued = readQueuedSkip();
    if (queued) {
      skipToSection(queued);
      return;
    }

    const hashId = sectionId(window.location.hash);
    if (hashId && hashId !== "showreel" && !consumedRef.current) {
      skipToSection(hashId);
    }
  }, [pathname, skipToSection]);

  // Jump only after React has removed the tall showreel from the DOM
  useLayoutEffect(() => {
    if (!consumed) return;
    const id = pendingId.current ?? "work";
    pendingId.current = null;
    jumpToId(id);
    requestAnimationFrame(() => jumpToId(id));
  }, [consumed]);

  const goToHash = useCallback((hash: string) => {
    const id = sectionId(hash);
    if (!id) return;

    if (consumedRef.current) {
      smoothToId(id);
      return;
    }

    pendingId.current = id;
    consumedRef.current = true;
    setConsumed(true);
  }, []);

  const goToViewWork = useCallback(() => {
    if (consumedRef.current) {
      smoothToId("work");
      return;
    }
    // Keep showreel — scroll to the phrase screen
    smoothToId("showreel");
  }, []);

  const completeByScroll = useCallback(() => {
    if (consumedRef.current) return;
    pendingId.current = pendingId.current ?? "work";
    consumedRef.current = true;
    setConsumed(true);
  }, []);

  const value = useMemo(
    () => ({ consumed, goToHash, goToViewWork, completeByScroll }),
    [consumed, goToHash, goToViewWork, completeByScroll],
  );

  return <ShowreelContext.Provider value={value}>{children}</ShowreelContext.Provider>;
}

export function useShowreelGate() {
  const ctx = useContext(ShowreelContext);
  if (!ctx) {
    throw new Error("useShowreelGate must be used within ShowreelProvider");
  }
  return ctx;
}

/** Safe for optional use outside provider */
export function useShowreelNav() {
  const ctx = useContext(ShowreelContext);
  return {
    goToHash:
      ctx?.goToHash ??
      ((hash: string) => {
        const id = sectionId(hash);
        if (id) smoothToId(id);
      }),
    goToViewWork:
      ctx?.goToViewWork ??
      (() => {
        smoothToId("showreel");
      }),
  };
}
