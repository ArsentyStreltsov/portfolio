"use client";

import { useState } from "react";

export type ExtractPrefill = {
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  notes: string;
};

export function LeadFromUrl({ onExtracted }: { onExtracted: (data: ExtractPrefill) => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signals, setSignals] = useState<string[]>([]);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSignals([]);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/extract-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as {
        error?: string;
        extracted?: ExtractPrefill & { website?: string; signals?: string[] };
      };
      if (!res.ok || !data.extracted) {
        setError(data.error ?? "Could not extract");
        return;
      }
      const ex = data.extracted;
      onExtracted({
        business_name: ex.business_name,
        contact_name: ex.contact_name,
        email: ex.email,
        phone: ex.phone,
        notes: "",
      });
      setSignals(ex.signals ?? []);
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
        Paste a business URL — we pull public name, email, phone and notes from the page (and
        contact page if needed). Review before creating the lead.
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
      {signals.length > 0 && (
        <p className="mt-3 text-[0.65rem] text-text-secondary">
          Found via: {signals.join(" · ")}
        </p>
      )}
    </div>
  );
}
