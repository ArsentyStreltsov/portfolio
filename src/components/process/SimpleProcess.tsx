const steps = [
  { num: "01", title: "Short brief", text: "You answer a few questions about your business, goals and the style you like." },
  { num: "02", title: "Direction", text: "I turn that into a clear structure and visual direction." },
  { num: "03", title: "Build & refine", text: "The website is built, reviewed and adjusted without endless rounds of meetings." },
  { num: "04", title: "Launch", text: "Once everything is ready, the site goes live on your domain." },
];

export function SimpleProcess() {
  return (
    <section id="process" className="border-t border-border py-24 md:py-32">
      <div className="container-main">
        <h2 className="font-display text-[clamp(2rem,5vw,4rem)] font-bold uppercase tracking-[-0.02em]">
          A simple process
        </h2>

        <div className="mt-16 grid gap-8 md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.num} className="pt-2">
              <span className="inline-flex min-w-[3.25rem] items-center justify-center bg-accent px-2.5 py-1.5 font-display text-2xl font-bold text-bg-dark">
                {s.num}
              </span>
              <h3 className="mt-5 font-display text-lg font-bold uppercase">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{s.text}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-sm text-text-muted">
          No long workshops, no giant documents, no unnecessary complexity
        </p>
      </div>
    </section>
  );
}
