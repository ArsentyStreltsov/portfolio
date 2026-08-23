export function AboutSection() {
  return (
    <section id="about" className="border-t border-border-dark bg-bg-dark py-24 text-text-inverse md:py-32">
      <div className="container-main grid items-center gap-12 md:grid-cols-2">
        <div className="flex h-full items-center justify-center md:justify-end">
          <div className="aspect-[3/4] w-full max-w-sm overflow-hidden border border-border-dark bg-white/5">
            <img
              src="/about/arsenty.jpg"
              alt="Arsenty Streltsov"
              width={800}
              height={1067}
              className="h-full w-full object-cover object-[40%_center]"
            />
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-bold uppercase tracking-[-0.02em]">
            Hi, I&apos;m{" "}
            <span className="bg-accent px-2 text-bg-dark">Arsenty</span>
          </h2>

          <div className="mt-8 space-y-6 text-[1.05rem] leading-relaxed text-text-inverse/70">
            <p>Want a website your competitors wish they had?</p>

            <p>
              Based in Malmö, I design and build modern websites for businesses across Sweden that
              want to stand out, look professional, and make it easy for customers to choose them.
            </p>

            <p>
              <span className="bg-accent px-1.5 font-semibold text-bg-dark">67%</span>
              {" "}
              of consumers check a website or app while researching something new before a purchase.
              <sup className="ml-0.5 text-[0.65em] text-text-inverse/40">*</sup>
              {" "}
              Let&apos;s give people a reason to{" "}
              <span className="bg-accent px-1.5 font-semibold text-bg-dark">remember you</span>.
            </p>

            <p className="text-[0.7rem] tracking-wide text-text-inverse/35">
              * Google / Ipsos
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
