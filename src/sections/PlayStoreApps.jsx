import React from "react";
import { Link } from "react-router-dom";
import { Reveal, SectionHeading, Chip, TiltCard, ImageSlot } from "../ui/primitives.jsx";
import { playStore } from "../data/content.js";
import { IoLogoGooglePlaystore } from "react-icons/io5";
import { FiArrowRight, FiExternalLink } from "react-icons/fi";

const accentText = {
  violet: "text-violet",
  cyan: "text-cyan",
  emerald: "text-emerald",
  amber: "text-amber",
};

function AppCard({ app }) {
  const accent = accentText[app.accent] || "text-violet";

  return (
    <Reveal>
      <TiltCard max={3} className="glow-card glass group relative h-full overflow-hidden rounded-3xl">
        {/* Whole-card target: the details page when there is one, else the store */}
        {app.detail ? (
          <Link to={app.detail} className="absolute inset-0 z-0" aria-label={`${app.name} details`} />
        ) : (
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-0"
            aria-label={`${app.name} on Google Play`}
          />
        )}

        <div className="pointer-events-none flex h-full flex-col">
          {/* Feature graphic — 1024×500, renders uncropped */}
          <div className="relative aspect-[1024/500] w-full overflow-hidden">
            <ImageSlot src={app.image} alt={`${app.name} on Google Play`} label={app.name} accent={app.accent} />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
          </div>

          {/* Copy */}
          <div className="flex flex-1 flex-col p-6 md:p-7">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-xl font-bold text-bright md:text-2xl">{app.name}</h3>
              <IoLogoGooglePlaystore className={`${accent} shrink-0`} size={20} />
            </div>
            <p className={`font-display mt-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${accent}`}>
              {app.tagline}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-body">{app.blurb}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {app.highlights.map((h) => (
                <Chip key={h}>{h}</Chip>
              ))}
            </div>

            {/* Actions sit above the overlay link */}
            <div className="pointer-events-auto relative z-10 mt-6 flex flex-wrap items-center gap-3">
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-emerald/40 bg-emerald/10 px-4 py-2 text-sm font-semibold text-emerald transition-colors hover:bg-emerald/20"
              >
                <IoLogoGooglePlaystore size={16} /> Google Play
              </a>
              {app.detail && (
                <Link
                  to={app.detail}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-bright transition-colors hover:text-violet"
                >
                  See details <FiArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </TiltCard>
    </Reveal>
  );
}

export default function PlayStoreApps() {
  return (
    <section id="apps" className="relative w-full px-5 py-28 md:px-10 md:py-36 xl:px-16">
      <SectionHeading index="02" title="Play Store" accent="apps" />

      <Reveal className="mb-10 md:mb-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-[60ch] text-base leading-relaxed text-body md:text-lg">
            Three apps I designed, built, and shipped solo to the Google Play Store — live and downloadable now.
          </p>
          <a
            href={playStore.developerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-body transition-colors hover:text-emerald"
          >
            <IoLogoGooglePlaystore size={16} /> View my developer page <FiExternalLink size={14} />
          </a>
        </div>
      </Reveal>

      <div className="grid gap-6 md:grid-cols-3 md:gap-7">
        {playStore.apps.map((app) => (
          <AppCard key={app.name} app={app} />
        ))}
      </div>
    </section>
  );
}
