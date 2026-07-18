import React from "react";
import { Reveal, SectionHeading, Magnetic } from "../ui/primitives.jsx";
import { identity, socials } from "../data/content.js";
import { FiGithub, FiLinkedin, FiInstagram, FiMail } from "react-icons/fi";

const socialIcons = { github: FiGithub, linkedin: FiLinkedin, instagram: FiInstagram, mail: FiMail };

export default function Contact() {
  return (
    <section id="contact" className="relative w-full px-5 py-28 md:px-10 md:py-40 xl:px-16">
      <div className="blob bottom-[-10%] right-[10%] h-[400px] w-[400px] bg-violet-600/20" />

      <SectionHeading index="06" title="Let's build" accent="together" />

      <Reveal>
        <p className="max-w-2xl text-lg leading-relaxed text-body md:text-xl">
          {identity.openToOpportunities && (
            <span className="mb-4 flex items-center gap-2.5 text-emerald">
              <span className="pulse-dot h-2 w-2 rounded-full bg-emerald" />
              <span className="text-sm font-semibold uppercase tracking-[0.18em]">Open to opportunities</span>
            </span>
          )}
          Whether it's a production Android app, a Kotlin Multiplatform migration, or an open-source collaboration —
          my inbox is always open.
        </p>
      </Reveal>

      <Reveal delay={0.15}>
        <Magnetic strength={0.15} className="mt-10 inline-block">
          <a
            href={`mailto:${identity.email}`}
            className="font-display block break-all text-3xl font-bold text-bright underline decoration-violet/50 decoration-2 underline-offset-8 transition-all hover:text-gradient hover:decoration-fuchsia sm:text-4xl md:text-6xl"
          >
            {identity.email}
          </a>
        </Magnetic>
      </Reveal>

      <Reveal delay={0.25}>
        <div className="mt-12 flex flex-wrap gap-3">
          {socials.map((s) => {
            const Icon = socialIcons[s.icon];
            return (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass inline-flex items-center gap-2.5 rounded-full px-5 py-3 text-sm font-medium text-bright transition-all hover:border-violet/50 hover:shadow-[0_0_24px_-8px_rgba(167,139,250,0.7)]"
              >
                <Icon size={17} /> {s.name}
              </a>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
