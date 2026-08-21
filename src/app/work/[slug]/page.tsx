import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { projects } from "@/data/projects";
import { site } from "@/data/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return {
    title: `${project.title} — ${site.name}`,
    description: project.description,
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <article className="pt-28 pb-24">
      <div className="container-main">
        {project.projectType === "concept" && (
          <div className="mb-8 border border-border bg-border/10 px-5 py-3">
            <p className="text-[0.75rem] text-text-secondary">
              This is a fictional business created to demonstrate design and development capabilities.
            </p>
          </div>
        )}

        <p className="text-[0.7rem] font-medium uppercase tracking-[0.25em] text-text-secondary">
          {project.category} · {project.year}
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,6rem)] font-bold uppercase tracking-[-0.02em]">
          {project.title}
        </h1>
        <p className="mt-6 max-w-xl text-[1.1rem] leading-relaxed text-text-secondary">
          {project.description}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {project.features.map((f) => (
            <span key={f} className="border border-border px-3 py-1 text-[0.65rem] uppercase tracking-[0.1em] text-text-secondary">
              {f}
            </span>
          ))}
        </div>

        {project.demoUrl && (
          <div className="mt-8">
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-text text-bg px-6 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.12em] transition-transform hover:scale-[1.02] inline-block"
            >
              Open live demo ↗
            </a>
          </div>
        )}
      </div>

      {/* Desktop screenshots */}
      <div className="container-main mt-16 space-y-8">
        {project.desktopImages.map((img, i) => (
          <div key={i} className="overflow-hidden border border-border">
            <img
              src={img}
              alt={`${project.title} desktop screenshot ${i + 1}`}
              className="w-full"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Mobile screenshots */}
      {project.mobileImages.length > 0 && (
        <div className="container-main mt-16">
          <h2 className="font-display text-xl font-bold uppercase tracking-[-0.01em]">Mobile</h2>
          <div className="mt-8 flex gap-6 overflow-x-auto pb-4">
            {project.mobileImages.map((img, i) => (
              <div key={i} className="w-60 shrink-0 overflow-hidden border border-border">
                <img
                  src={img}
                  alt={`${project.title} mobile screenshot ${i + 1}`}
                  className="w-full"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tech stack */}
      {project.techStack && project.techStack.length > 0 && (
        <div className="container-main mt-16 border-t border-border pt-8">
          <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.25em] text-text-secondary">
            Built with
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {project.techStack.map((t) => (
              <span key={t} className="border border-border px-3 py-1 text-sm text-text-secondary">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Back */}
      <div className="container-main mt-16">
        <a href="/work" className="text-sm font-medium uppercase tracking-[0.1em] text-text-secondary hover:text-text">
          ← All projects
        </a>
      </div>
    </article>
  );
}
