"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

/** UI step ids → analytics taxonomy (no PII). */
const steps = [
  { id: "business", analyticsId: "business", label: "About your business" },
  { id: "needs", analyticsId: "project_type", label: "What you need" },
  { id: "goals", analyticsId: "goal", label: "Goals" },
  { id: "extra", analyticsId: "details", label: "Anything else" },
  { id: "contact", analyticsId: "contact", label: "Your details" },
] as const;

const needsOptions = [
  { value: "new", label: "A new website" },
  { value: "redesign", label: "A redesign of an existing site" },
  { value: "not-sure", label: "Not sure yet" },
];

const goalOptions = [
  "Show what the business does",
  "Get more enquiries / leads",
  "Let people book or order",
  "Look more professional",
  "Sell products online",
  "Other",
];

type FormData = {
  businessName: string;
  url: string;
  need: string;
  goals: string[];
  extra: string;
  name: string;
  email: string;
  phone: string;
};

export default function BriefPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormData>({
    businessName: "",
    url: "",
    need: "",
    goals: [],
    extra: "",
    name: "",
    email: "",
    phone: "",
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const opened = useRef(false);
  const viewedSteps = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!opened.current) {
      opened.current = true;
      track("brief_opened");
    }
  }, []);

  useEffect(() => {
    if (viewedSteps.current.has(step)) return;
    viewedSteps.current.add(step);
    track("brief_step_viewed", {
      step_number: step + 1,
      step_id: steps[step].analyticsId,
    });
  }, [step]);

  const set = (field: keyof FormData, value: string | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleGoal = (g: string) =>
    set("goals", form.goals.includes(g) ? form.goals.filter((x) => x !== g) : [...form.goals, g]);

  const next = () => {
    track("brief_step_completed", {
      step_number: step + 1,
      step_id: steps[step].analyticsId,
    });
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const prev = () => {
    track("brief_back_clicked", {
      step_number: step + 1,
      step_id: steps[step].analyticsId,
    });
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    setSubmitError(null);
    setSending(true);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, submittedAt: new Date().toISOString() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        track("brief_submit_error", {
          step_number: step + 1,
          step_id: steps[step].analyticsId,
        });
        setSubmitError(data?.error ?? "Could not send the brief. Please try again or email me.");
        return;
      }
      track("brief_step_completed", {
        step_number: step + 1,
        step_id: steps[step].analyticsId,
      });
      track("brief_submitted");
      setSubmitted(true);
    } catch {
      track("brief_submit_error", {
        step_number: step + 1,
        step_id: steps[step].analyticsId,
      });
      setSubmitError("Network error. Please try again or email me.");
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold uppercase">Thank you.</h1>
          <p className="mt-4 text-text-secondary">I&apos;ll get back to you within a day or two.</p>
          <a
            href="/"
            className="mt-8 inline-block text-sm font-medium uppercase tracking-[0.1em] text-text-secondary hover:text-text"
          >
            ← Back to homepage
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 pt-28 pb-16">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-12 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center gap-2">
              <div className={`h-1 w-full transition-colors ${i <= step ? "bg-text" : "bg-border"}`} />
            </div>
          ))}
        </div>

        <p className="text-[0.7rem] font-medium uppercase tracking-[0.3em] text-text-secondary">
          Step {step + 1} of {steps.length}
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold uppercase tracking-[-0.02em]">
          {steps[step].label}
        </h1>

        <div className="mt-8 space-y-6">
          {step === 0 && (
            <>
              <Field
                label="Business name"
                value={form.businessName}
                onChange={(v) => set("businessName", v)}
              />
              <Field
                label="Website URL (if you have one)"
                value={form.url}
                onChange={(v) => set("url", v)}
                optional
              />
            </>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {needsOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer border px-5 py-4 transition-colors ${
                    form.need === opt.value ? "border-text bg-text/5" : "border-border hover:border-text/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="need"
                    value={opt.value}
                    checked={form.need === opt.value}
                    onChange={() => set("need", opt.value)}
                    className="sr-only"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-wrap gap-2">
              {goalOptions.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGoal(g)}
                  className={`border px-4 py-2 text-sm transition-colors ${
                    form.goals.includes(g) ? "border-text bg-text/5" : "border-border hover:border-text/30"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <textarea
              value={form.extra}
              onChange={(e) => set("extra", e.target.value)}
              rows={5}
              placeholder="Anything about the project, deadline, budget or style..."
              className="ph-mask w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-text"
              data-ph-mask
            />
          )}

          {step === 4 && (
            <>
              <Field label="Your name" value={form.name} onChange={(v) => set("name", v)} />
              <Field label="Email" value={form.email} onChange={(v) => set("email", v)} type="email" />
              <Field
                label="Phone (optional)"
                value={form.phone}
                onChange={(v) => set("phone", v)}
                optional
              />
            </>
          )}
        </div>

        <div className="mt-10 flex flex-col gap-4">
          {submitError && (
            <p className="text-sm text-red-700" role="alert">
              {submitError}
            </p>
          )}
          <div className="flex gap-4">
            {step > 0 && (
              <button
                type="button"
                onClick={prev}
                className="border border-border px-6 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.12em] transition-colors hover:border-text"
              >
                Back
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="bg-text text-bg px-6 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.12em] transition-transform hover:scale-[1.02]"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!form.name || !form.email || sending}
                className="bg-text text-bg px-6 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.12em] transition-transform hover:scale-[1.02] disabled:opacity-40"
              >
                {sending ? "Sending…" : "Send brief"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  optional,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[0.75rem] font-medium uppercase tracking-[0.15em] text-text-secondary">
        {label} {optional && <span className="normal-case tracking-normal">(optional)</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ph-mask mt-2 w-full border-b border-border bg-transparent py-2 text-sm outline-none focus:border-text"
        data-ph-mask
        autoComplete={type === "email" ? "email" : "on"}
      />
    </div>
  );
}
