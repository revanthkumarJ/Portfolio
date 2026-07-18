import React from "react";
import { Reveal, SectionHeading, Chip, TiltCard, ImageSlot } from "../ui/primitives.jsx";
import { featuredProjects, gridProjects } from "../data/content.js";
import { FiGithub, FiExternalLink, FiGitPullRequest } from "react-icons/fi";
import { IoLogoGooglePlaystore } from "react-icons/io5";

const linkIcon = (kind) => {
  if (kind === "github") return <FiGithub size={15} />;
  if (kind === "playstore") return <IoLogoGooglePlaystore size={15} />;
  if (kind === "prs") return <FiGitPullRequest size={15} />;
  return <FiExternalLink size={15} />;
};

const accentText = {
  violet: "text-violet",
  cyan: "text-cyan",
  emerald: "text-emerald",
  amber: "text-amber",
};

function FeaturedCard({ p }) {
  return (
    <Reveal>
      <TiltCard max={3} className="glow-card glass h-full overflow-hidden rounded-3xl">
        <div className="flex h-full flex-col">
          {/* 🖼️ Banner — generate at 1920×1080 (16:9); renders uncropped */}
          <div className="relative aspect-video w-full">
            <ImageSlot src={p.image} alt={p.title} label={`${p.title} banner`} accent={p.accent} />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent" />
          </div>

          {/* Copy */}
          <div className="flex flex-1 flex-col p-7 md:p-9">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-display text-2xl font-bold text-bright md:text-3xl">{p.title}</h3>
              {p.badge && (
                <span className="rounded-full border border-emerald/40 bg-emerald/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald">
                  {p.badge}
                </span>
              )}
            </div>
            <p className={`font-display mt-2 text-sm font-semibold uppercase tracking-[0.14em] ${accentText[p.accent] || "text-violet"}`}>
              {p.tagline}
            </p>
            <p className="mt-4 leading-relaxed text-body">{p.description}</p>

            {p.metrics?.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-8">
                {p.metrics.map((m) => (
                  <div key={m.label}>
                    <div className="font-display text-2xl font-bold text-bright">{m.value}</div>
                    <div className="text-xs text-body/70">{m.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {p.tech.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              {p.links.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-bright transition-all hover:border-violet/60 hover:bg-violet/10"
                >
                  {linkIcon(l.kind)} {l.text}
                </a>
              ))}
            </div>
          </div>
        </div>
      </TiltCard>
    </Reveal>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="relative w-full px-5 py-28 md:px-10 md:py-36 xl:px-16">
      {/* ambient */}
      <div className="blob right-[-15%] top-[10%] h-[420px] w-[420px] bg-violet-600/15" />

      <SectionHeading index="03" title="Selected" accent="work" />

      {/* Featured cards pull wider than the rest of the section content */}
      <div className="relative grid gap-6 md:-mx-4 md:gap-8 xl:-mx-10 xl:grid-cols-2">
        {featuredProjects.map((p) => (
          <FeaturedCard key={p.title} p={p} />
        ))}
      </div>

      {/* Grid of other projects */}
      <div className="mt-24">
        <Reveal>
          <h3 className="font-display mb-8 text-2xl font-bold text-bright">
            More <span className="text-gradient">builds</span>
          </h3>
        </Reveal>
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
