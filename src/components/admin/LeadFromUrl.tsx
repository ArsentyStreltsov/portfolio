"use client";

import { useState } from "react";

export type ExtractPrefill = {
  business_name: string;
  website: string;
  contact_name: string;
  email: string;
  phone: string;
  notes: string;
};

type Evidence = {
  value: string;
  source: string;
  snippet: string;
  page_url: string;
};

type ExtractResult = {
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website?: string;
  signals?: string[];
  page_title?: string;
  page_description?: string;
  contact_urls?: string[];
  business_name_evidence?: Evidence[];
  contact_name_evidence?: Evidence[];
  email_evidence?: Evidence[];
  phone_evidence?: Evidence[];
};

export function LeadFromUrl({ onExtracted }: { onExtracted: (data: ExtractPrefill) => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signals, setSignals] = useState<string[]>([]);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [usedMode, setUsedMode] = useState<"home" | "contact">("home");
  const [canRetryContact, setCanRetryContact] = useState(false);

  const run = async (
    e: React.FormEvent | React.MouseEvent,
    options?: { mode?: "home" | "contact"; target_url?: string },
  ) => {
    e.preventDefault();
    setError(null);
    if (!options?.mode || options.mode === "home") {
      setResult(null);
      setSignals([]);
      setAttempts(0);
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/extract-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, ...options }),
      });
      const data = (await res.json()) as {
        error?: string;
        extracted?: ExtractResult;
        used_mode?: "home" | "contact";
        can_retry_contact?: boolean;
      };
      if (!res.ok || !data.extracted) {
        setError(data.error ?? "Could not extract");
        return;
      }
      const ex = data.extracted;
      setResult(ex);
      setSignals(ex.signals ?? []);
      setUsedMode(data.used_mode ?? "home");
      setCanRetryContact(Boolean(data.can_retry_contact));
      setAttempts((n) => n + 1);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-border p-5">
      <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-secondary">
        Import from website
      </h2>
      <p className="mt-2 text-xs text-text-secondary">
        Paste a business URL — first you review where each value came from, then decide whether to
        use it or retry from the contact page.
      </p>
      <form onSubmit={run} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.se"
          required
          className="min-w-0 flex-1 border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-text"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="bg-text px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-bg disabled:opacity-40"
        >
          {loading ? "Reading…" : "Fetch info"}
        </button>
      </form>
      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <div className="space-y-1 text-xs text-text-secondary">
            <p>
              Reviewing:{" "}
              <a
                href={result.website || url}
                target="_blank"
                rel="noreferrer"
                className="font-mono underline hover:text-text"
              >
                {result.website || url}
              </a>
            </p>
            {result.page_title ? <p>Title: {result.page_title}</p> : null}
            {result.page_description ? <p>Description: {result.page_description}</p> : null}
            <p>
              Attempt {attempts} · source page: {usedMode === "contact" ? "contact page" : "home page"}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <EvidenceCard
              label="Business"
              value={result.business_name}
              evidence={result.business_name_evidence ?? []}
            />
            <EvidenceCard
              label="Contact name"
              value={result.contact_name}
              evidence={result.contact_name_evidence ?? []}
            />
            <EvidenceCard label="Email" value={result.email} evidence={result.email_evidence ?? []} />
            <EvidenceCard label="Phone" value={result.phone} evidence={result.phone_evidence ?? []} />
          </div>

          {signals.length > 0 && (
            <p className="text-[0.65rem] text-text-secondary">Found via: {signals.join(" · ")}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onExtracted({
                  business_name: result.business_name,
                  website: result.website || "",
                  contact_name: result.contact_name,
                  email: result.email,
                  phone: result.phone,
                  notes: "",
                })
              }
              className="bg-text px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-bg"
            >
              Yes, use these
            </button>
            {canRetryContact && attempts < 2 ? (
              <button
                type="button"
                onClick={(e) => run(e, { mode: "contact", target_url: result.contact_urls?.[0] })}
                disabled={loading}
                className="border border-border px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] hover:border-text disabled:opacity-40"
              >
                {loading ? "Trying…" : "No, try contact page"}
              </button>
            ) : null}
            {attempts >= 2 ? (
              <span className="px-1 py-2 text-[0.7rem] text-text-secondary">
                Tried twice — better fill the rest manually.
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function EvidenceCard({
  label,
  value,
  evidence,
}: {
  label: string;
  value: string | undefined;
  evidence: Evidence[];
}) {
  const top = evidence[0];

  return (
    <div className="border border-border p-3">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-text-secondary">
        {label}
      </p>
      <p className="mt-1 text-sm">{value || "Not found"}</p>
      {top ? (
        <div className="mt-2 text-xs text-text-secondary">
          <p>From: {top.source}</p>
          <p className="mt-1 break-words font-mono text-[0.65rem]">{top.snippet}</p>
          <p className="mt-1 break-all">{top.page_url}</p>
        </div>
      ) : null}
    </div>
  );
}
