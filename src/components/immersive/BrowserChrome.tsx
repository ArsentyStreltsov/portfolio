"use client";

import type { ReactNode } from "react";

export function BrowserChrome({
  children,
  className = "",
  title,
  onClose,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  onClose?: () => void;
}) {
  return (
    <div
      className={`overflow-hidden border border-border bg-white shadow-2xl ${className}`}
      style={{ borderRadius: "8px 8px 0 0" }}
    >
      <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-border bg-[#f0f0f0] px-3">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff5f56] transition-opacity hover:opacity-80"
          />
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
        )}
        <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
        {title && (
          <span className="ml-3 truncate text-[0.65rem] text-text-muted">{title}</span>
        )}
      </div>
      {children}
    </div>
  );
}
