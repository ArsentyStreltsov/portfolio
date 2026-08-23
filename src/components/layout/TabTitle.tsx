"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const ACTIVE_TITLE = "Arsenty Streltsov";
const IDLE_TITLE = "Сontact me!";
const ADMIN_TITLE = "Admin";

export function TabTitle() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (isAdmin) {
      document.title = ADMIN_TITLE;
      return;
    }

    const sync = () => {
      document.title = document.hidden ? IDLE_TITLE : ACTIVE_TITLE;
    };

    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [isAdmin]);

  return null;
}
