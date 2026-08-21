"use client";

import type { Project } from "@/data/projects";
import { track } from "@/lib/analytics";

type Layout = "left" | "right" | "full" | "two-device";

export function ProjectCard({ project, index, layout = "left" }: { project: Project; index: number; layout?: Layout }) {
  const num = String(index + 1).padStart(2, "0");

  return (
    <article className="group border-t border-border py-16 first:border-t-0 md:py-20">
      <div className={`container-main grid gap-8 md:gap-12 ${layout === "full" ? "" : "md:grid-cols-2"} ${layout === "right" ? "md:direction-rtl" : ""}`}>
        <a
          href={`/work/${project.slug}`}
          onClick={() => track("project_open", { slug: project.slug })}
          className={`relative block overflow-hidden ${layout === "full" ? "aspect-[16/9]" : "aspect-[4/3]"}`}
          style={{ direction: "ltr" }}
        >
          <div
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]"
            style={{ backgroundColor: project.background }}
          >
            {project.coverImage && (
              <img
                src={project.coverImage}
                alt={`${project.title} — ${project.category}`}
                className="h-full w-full object-cover object-top"
                loading="lazy"
              />
            )}
          </div>
          {project.projectType === "concept" && (
            <span className="absolute top-4 left-4 bg-bg/80 px-3 py-1 text-[0.6rem] font-medium uppercase tracking-[0.2em] backdrop-blur-sm">
              Concept project
            </span>
          )}
        </a>

        <div className="flex flex-col justify-center" style={{ direction: "ltr" }}>
          <span className="font-display text-4xl font-bold text-text-muted/30">{num}</span>
          <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-[0.25em] text-text-secondary">
            {project.category}
          </p>
          <h3 className="mt-3 font-display text-3xl font-bold uppercase tracking-[-0.02em] md:text-4xl">
            {project.title}
          </h3>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-text-secondary">
            {project.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {project.features.slice(0, 5).map((f) => (
              <span key={f} className="border border-border px-3 py-1 text-[0.65rem] uppercase tracking-[0.1em] text-text-secondary">
                {f}
              </span>
            ))}
          </div>
          <div className="mt-8 flex gap-4">
            <a
              href={`/work/${project.slug}`}
              className="bg-text text-bg px-6 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.12em] transition-transform hover:scale-[1.02]"
            >
              View case
            </a>
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => track("live_demo_open", { slug: project.slug })}
                className="border border-text px-6 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-text hover:text-bg"
              >
                Open live demo ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
