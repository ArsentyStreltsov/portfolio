"use client";

import { useEffect, useState, memo } from "react";
import { selectedWorkProjects, type Project } from "@/data/projects";
import { track } from "@/lib/analytics";
import { ProjectBrowserModal } from "@/components/immersive/ProjectBrowserModal";

function SelectedWorkInner() {
  const [active, setActive] = useState<Project | null>(null);

  // Keep covers warm in the browser cache so header jumps don't flash-reload
  useEffect(() => {
    for (const project of selectedWorkProjects) {
      const img = new window.Image();
      img.src = project.coverImage;
    }
  }, []);

  return (
    <section id="work" className="py-24 md:py-32">
      <div className="container-main">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.3em] text-text-secondary">
          Portfolio
        </p>
        <h2 className="mt-4 font-display text-[clamp(2rem,5vw,4rem)] font-bold uppercase tracking-[-0.02em]">
          Selected work
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-text-secondary">
          Different businesses, different needs — we can build together whatever you need
        </p>

        <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {selectedWorkProjects.map((project, i) => (
            <li key={project.slug}>
              <button
                type="button"
                onClick={() => {
                  track("project_open", { slug: project.slug });
                  setActive(project);
                }}
                className="group flex w-full flex-col overflow-hidden border border-border bg-bg text-left transition-colors hover:border-text"
              >
                <span
                  className="relative block aspect-[16/10] overflow-hidden"
                  style={{ backgroundColor: project.background }}
                >
                  <img
                    src={project.coverImage}
                    alt=""
                    width={1400}
                    height={875}
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="eager"
                    decoding="async"
                    fetchPriority={i < 3 ? "high" : "auto"}
                    draggable={false}
                  />
                  <span className="absolute left-3 top-3 bg-bg/80 px-2 py-1 text-[0.55rem] font-medium uppercase tracking-[0.18em] backdrop-blur-sm">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>
                <span className="flex flex-col gap-1 border-t border-border px-4 py-4">
                  <span className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-text-secondary">
                    {project.category}
                  </span>
                  <span className="font-display text-lg font-bold uppercase tracking-[-0.02em]">
                    {project.title}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {active && <ProjectBrowserModal project={active} onClose={() => setActive(null)} />}
    </section>
  );
}

export const SelectedWork = memo(SelectedWorkInner);
