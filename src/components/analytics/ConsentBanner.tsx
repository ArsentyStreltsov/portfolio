"use client";

import type { ConsentStatus } from "@/lib/analytics";

export function ConsentBanner({
  status,
  onAccept,
  onReject,
}: {
  status: ConsentStatus;
  onAccept: () => void;
  onReject: () => void;
}) {
  if (status === "granted" || status === "denied") {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] border-t border-border bg-bg/95 p-4 backdrop-blur-md sm:p-5">
      <div className="container-main flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-sm leading-relaxed text-text-secondary">
          Mind if I use cookies to see what works best? I don&apos;t store personal data, and you
          can say no if you want.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onReject}
            className="border border-border px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] transition-colors hover:border-text"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="bg-text px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-bg transition-transform hover:scale-[1.02]"
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}
