"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="border border-border px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] transition-colors hover:border-text"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
