"use client";

import { useEffect } from "react";

const ACTIVE_TITLE = "Arsenty Streltsov";
const IDLE_TITLE = "Сontact me!";

export function TabTitle() {
  useEffect(() => {
    const sync = () => {
      document.title = document.hidden ? IDLE_TITLE : ACTIVE_TITLE;
    };

    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return null;
}
