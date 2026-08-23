"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const SORTS = [
  { value: "updated", label: "Last updated" },
  { value: "created", label: "Newest first" },
  { value: "sent", label: "Recently sent" },
  { value: "name", label: "Business A–Z" },
] as const;

export function LeadFilters({
  total,
  filtered,
}: {
  total: number;
  filtered: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const sort = searchParams.get("sort") ?? "updated";
  const status = searchParams.get("status") ?? "";
  const hasFilters = Boolean(q.trim() || status || sort !== "updated");

  const pushParams = useCallback(
    (patch: { q?: string; sort?: string; status?: string | null }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (patch.q !== undefined) {
        if (patch.q.trim()) params.set("q", patch.q.trim());
        else params.delete("q");
      }
      if (patch.sort !== undefined) {
        if (patch.sort && patch.sort !== "updated") params.set("sort", patch.sort);
        else params.delete("sort");
      }
      if (patch.status !== undefined) {
        if (patch.status) params.set("status", patch.status);
        else params.delete("status");
      }
      const qs = params.toString();
      router.push(qs ? `/admin/dashboard?${qs}` : "/admin/dashboard");
    },
    [router, searchParams],
  );

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const urlQ = searchParams.get("q") ?? "";
    if (q === urlQ) return;
    const t = window.setTimeout(() => pushParams({ q }), 300);
    return () => window.clearTimeout(t);
  }, [q, pushParams, searchParams]);

  return (
    <div className="space-y-3 border border-border p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label className="block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-text-secondary">
            Search
          </label>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Business, contact, email, lead id, notes…"
            className="mt-1.5 w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-text"
          />
        </div>
        <div>
          <label className="block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-text-secondary">
            Sort
          </label>
          <select
            value={sort}
            onChange={(e) => pushParams({ sort: e.target.value })}
            className="mt-1.5 border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-text"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              router.push("/admin/dashboard");
            }}
            className="border border-border px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] hover:border-text"
          >
            Clear
          </button>
        )}
      </div>
      <p className="text-xs text-text-secondary">
        {filtered === total ? (
          <>{total} leads</>
        ) : (
          <>
            {filtered} of {total} leads match
          </>
        )}
      </p>
    </div>
  );
}
