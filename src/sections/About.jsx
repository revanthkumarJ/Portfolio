import React from "react";
import { GitHubCalendar } from "react-github-calendar";
import { Reveal, SectionHeading, Chip, ImageSlot } from "../ui/primitives.jsx";
import { about, identity, techStack, codingProfiles, github } from "../data/content.js";
import { FiExternalLink, FiGithub } from "react-icons/fi";

export default function About() {
  return (
    <section id="about" className="relative w-full px-5 py-28 md:px-10 md:py-36 xl:px-16">
      <SectionHeading index="01" title="About" accent="me" />

      <div className="grid gap-14 md:grid-cols-[1.4fr_1fr] md:gap-16">
        {/* Bio */}
        <div>
          {about.paragraphs.map((p, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <p className="mb-6 max-w-[68ch] text-base leading-relaxed text-body md:text-lg">{p}</p>
            </Reveal>
          ))}
          <Reveal delay={0.25}>
            <blockquote className="mt-8 border-l-2 border-violet/60 pl-5 font-display text-lg italic text-bright/80">
              “{about.quote}”
            </blockquote>
          </Reveal>
        </div>

        {/* Photo — 🖼️ placeholder slot, swap image in src/data/content.js */}
        <Reveal delay={0.15}>
          <div className="glow-card glass relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl">
            <ImageSlot src={identity.photo} alt={identity.name} className="grayscale-[20%] transition-all duration-500 hover:grayscale-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-5">
              <div className="font-display text-lg font-bold text-bright">{identity.shortName}</div>
              <div className="text-sm text-body">{identity.location}</div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Tech stack — primary (Android/KMP) front and center, rest secondary */}
      <div className="mt-24">
        <Reveal>
          <h3 className="font-display mb-8 text-2xl font-bold text-bright">
            Tech I <span className="text-gradient">ship with</span>
          </h3>
        </Reveal>

        {/* Primary skill set */}
        <Reveal>
          <div className="glow-card glass rounded-3xl border-violet/25 p-7 md:p-9">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="font-display text-lg font-bold uppercase tracking-[0.15em] text-gradient md:text-xl">
                {techStack.primary.title}
              </div>
              <span className="text-sm text-body/70">{techStack.primary.subtitle}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {techStack.primary.items.map((t) => (
                <Chip key={t} className="!border-violet/30 !bg-violet/[0.08] !px-4 !py-1.5 !text-sm !text-bright/90">
                  {t}
                </Chip>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Secondary skills */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {techStack.secondary.map((group, gi) => (
            <Reveal key={group.title} delay={gi * 0.1}>
              <div className="glow-card glass h-full rounded-2xl p-6 opacity-90">
                <div className="font-display mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-body">
                  {group.title}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((t) => (
                    <Chip key={t}>{t}</Chip>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Coding profiles */}
      <div className="mt-20">
        <Reveal>
          <h3 className="font-display mb-8 text-2xl font-bold text-bright">
            Competitive <span className="text-gradient">profiles</span>
          </h3>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {codingProfiles.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.07}>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glow-card glass group flex h-full flex-col justify-between rounded-2xl p-5"
              >
                <div className="flex items-start justify-between">
                  <span className="font-display font-bold text-bright">{p.name}</span>
                  <FiExternalLink className="text-body/50 transition-colors group-hover:text-violet" size={16} />
                </div>
                <span className="mt-3 text-sm text-body">{p.detail}</span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>

      {/* GitHub contributions */}
      <div className="mt-20">
        <Reveal>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-display text-2xl font-bold text-bright">
              Open-source <span className="text-gradient">pulse</span>
            </h3>
            <a
              href={github.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-body transition-colors hover:text-violet"
            >
              <FiGithub size={16} /> @{github.username}
            </a>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="gh-cal glow-card glass overflow-hidden rounded-2xl p-6 text-body md:p-8">
            <GitHubCalendar
              username={github.username}
              colorScheme="dark"
              blockSize={11}
              blockMargin={4}
              fontSize={13}
              theme={{
                dark: ["rgba(255,255,255,0.05)", "#3b2b63", "#6d4fae", "#a78bfa", "#e0d4ff"],
              }}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
