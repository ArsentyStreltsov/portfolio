import Link from "next/link";
import { NewLeadForm } from "@/components/admin/NewLeadForm";

export default function NewLeadPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/admin/dashboard" className="text-xs uppercase tracking-[0.15em] text-text-secondary hover:text-text">
          ← Pipeline
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold uppercase">New lead</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Creates a lead, first outreach link, and opens the detail page to copy the URL into your email.
        </p>
      </div>
      <NewLeadForm />
    </div>
  );
}
