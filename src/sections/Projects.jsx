import React from "react";
import { Reveal, SectionHeading, Chip, ImageSlot } from "../ui/primitives.jsx";
import { gridProjects } from "../data/content.js";
import { FiGithub, FiExternalLink, FiGitPullRequest } from "react-icons/fi";
import { IoLogoGooglePlaystore } from "react-icons/io5";

const linkIcon = (kind) => {
  if (kind === "github") return <FiGithub size={15} />;
  if (kind === "playstore") return <IoLogoGooglePlaystore size={15} />;
  if (kind === "prs") return <FiGitPullRequest size={15} />;
  return <FiExternalLink size={15} />;
};

export default function Projects() {
  return (
    <section id="projects" className="relative w-full px-5 py-28 md:px-10 md:py-36 xl:px-16">
      {/* ambient */}
      <div className="blob right-[-15%] top-[10%] h-[420px] w-[420px] bg-violet-600/15" />

      <SectionHeading index="04" title="My" accent="work" />

      {/* Unified grid of projects */}
      <div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {gridProjects.map((p, i) => (
            <Reveal key={p.title} delay={(i % 4) * 0.06}>
              <div className="glow-card glass group flex h-full flex-col overflow-hidden rounded-2xl">
                {/* 🖼️ Banner — generate at 1920×1080 (16:9); renders uncropped */}
                <div className="relative aspect-video overflow-hidden">
                  <ImageSlot
                    src={p.image}
                    alt={p.title}
                    label={p.title}
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h4 className="font-display font-bold text-bright">{p.title}</h4>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-body">{p.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tech.map((t) => (
                      <Chip key={t} className="!px-2.5 !py-0.5 !text-[11px]">{t}</Chip>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-3">
                    {p.links.map((l) => (
                      <a
                        key={l.url}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-body transition-colors hover:text-violet"
                      >
                        {linkIcon(l.kind)} {l.text}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
