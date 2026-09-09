import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiGlobe,
  FiList,
  FiMusic,
  FiPlayCircle,
  FiScissors,
  FiSearch,
  FiShield,
  FiX,
} from "react-icons/fi";
import { IoLogoGooglePlaystore } from "react-icons/io5";
import { Reveal, Counter, Chip, Monogram } from "../../ui/primitives.jsx";
import { pocketTunes as app } from "../../data/pocketTunes.js";
import { identity } from "../../data/content.js";

const featureIcons = {
  library: FiMusic,
  play: FiPlayCircle,
  playlist: FiList,
  scissors: FiScissors,
  search: FiSearch,
  globe: FiGlobe,
};

/* ---------------- Section wrapper with a numbered heading ---------------- */
function Section({ id, index, title, accent, children, className = "" }) {
  return (
    <section id={id} className={`mx-auto w-full max-w-6xl px-5 py-20 md:px-8 md:py-28 ${className}`}>
      <Reveal className="mb-10 md:mb-14">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-sm uppercase tracking-[0.3em] text-emerald">{index}</span>
          <h2 className="font-display text-3xl font-bold text-bright md:text-4xl">
            {title} {accent && <span className="text-gradient">{accent}</span>}
          </h2>
        </div>
        <div className="mt-5 h-px w-full bg-gradient-to-r from-emerald/50 via-line to-transparent" />
      </Reveal>
      {children}
    </section>
  );
}

/* ---------------- Lightbox for the store screenshots ---------------- */
function Lightbox({ shots, index, onClose, onStep }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "ArrowLeft") onStep(-1);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, onStep]);

  const shot = shots[index];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/92 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${shot.title} screenshot`}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/[0.06] text-bright transition-colors hover:bg-white/[0.12]"
      >
        <FiX size={18} />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onStep(-1);
        }}
        aria-label="Previous screenshot"
        className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white/[0.06] text-bright transition-colors hover:bg-white/[0.12] md:left-8"
      >
        <FiChevronLeft size={20} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStep(1);
        }}
        aria-label="Next screenshot"
        className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white/[0.06] text-bright transition-colors hover:bg-white/[0.12] md:right-8"
      >
        <FiChevronRight size={20} />
      </button>

      <motion.figure
        key={index}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="flex max-h-full flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={shot.src}
          alt={shot.title}
          className="max-h-[72vh] w-auto rounded-2xl border border-line object-contain"
        />
        <figcaption className="max-w-md text-center text-sm text-body">
          <span className="font-display block font-semibold text-bright">{shot.title}</span>
          <span className="mt-1 block">{shot.caption}</span>
          <span className="mt-2 block text-xs text-body/50">
            {index + 1} / {shots.length}
          </span>
        </figcaption>
      </motion.figure>
    </motion.div>
  );
}

export default function PocketTunes() {
  const [lightbox, setLightbox] = useState(null);

  const step = useCallback(
    (dir) => setLightbox((i) => (i === null ? i : (i + dir + app.screenshots.length) % app.screenshots.length)),
    []
  );

  useEffect(() => {
    const previous = document.title;
    document.title = `${app.fullName} · ${identity.shortName}`;
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="noise relative min-h-screen overflow-hidden bg-ink text-body">
      {/* Ambient glow, tinted to the app's green */}
      <div className="blob left-[-10%] top-[-8%] h-[420px] w-[420px] bg-emerald/20" aria-hidden="true" />
      <div className="blob right-[-12%] top-[30%] h-[460px] w-[460px] bg-cyan/10" aria-hidden="true" />

      {/* ---------------- Top bar ---------------- */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 md:px-8">
        <Link to="/" className="flex items-center gap-3 text-sm text-body transition-colors hover:text-bright">
          <Monogram size={32} />
          <span className="inline-flex items-center gap-1.5">
            <FiArrowLeft size={14} /> Back to portfolio
          </span>
        </Link>
        <a
          href={app.storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-2 rounded-full border border-emerald/40 bg-emerald/10 px-5 py-2 text-sm font-semibold text-emerald transition-colors hover:bg-emerald/20 sm:inline-flex"
        >
          <IoLogoGooglePlaystore size={16} /> Google Play
        </a>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-6 md:px-8 md:pb-24 md:pt-10">
        <Reveal>
          <p className="font-display text-xs uppercase tracking-[0.3em] text-emerald">
            Play Store app · Solo project
          </p>
          <h1 className="font-display mt-4 text-4xl font-bold leading-[1.05] text-bright sm:text-5xl md:text-6xl">
            Pocket <span className="text-gradient">Tunes</span>
          </h1>
          <p className="font-display mt-3 text-lg text-emerald md:text-xl">{app.tagline}</p>
          <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-body md:text-lg">
            {app.shortDescription}
          </p>
        </Reveal>

        <Reveal delay={0.08} className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={app.storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
            >
              <IoLogoGooglePlaystore size={18} /> Get it on Google Play
            </a>
            <a
              href={app.privacyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-medium text-body transition-colors hover:border-emerald/50 hover:text-bright"
            >
              <FiShield size={16} /> Privacy policy <FiExternalLink size={13} />
            </a>
          </div>
        </Reveal>

        {/* Feature graphic */}
        <Reveal delay={0.14} className="mt-12">
          <div className="glass overflow-hidden rounded-3xl border-emerald/20">
            <img
              src={app.banner}
              alt="Pocket Tunes — offline music player, playlists, ringtone trimmer and multi-language support"
              className="w-full object-cover"
            />
          </div>
        </Reveal>

        {/* Meta strip */}
        <Reveal delay={0.2} className="mt-10">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
            {app.meta.map((m) => (
              <div key={m.label} className="bg-ink-2 px-5 py-4">
                <dt className="text-[11px] uppercase tracking-[0.16em] text-body/60">{m.label}</dt>
                <dd className="font-display mt-1.5 text-sm font-semibold text-bright">{m.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* ---------------- Overview ---------------- */}
      <Section id="overview" index="01" title="Why it" accent="exists">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <Reveal>
            <div className="space-y-5">
              {app.intro.map((p) => (
                <p key={p.slice(0, 24)} className="text-base leading-relaxed text-body md:text-lg">
                  {p}
                </p>
              ))}
            </div>
            <div className="mt-8">
              <p className="font-display text-xs uppercase tracking-[0.2em] text-body/60">
                What it deliberately doesn't do
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {app.nonGoals.map((n) => (
                  <Chip key={n}>{n}</Chip>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 gap-4">
              {app.stats.map((s) => (
                <div key={s.label} className="glass rounded-2xl p-5">
                  <div className="font-display text-3xl font-bold text-bright">
                    <Counter value={s.value} suffix={s.suffix} />
                  </div>
                  <p className="mt-1.5 text-xs leading-snug text-body">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ---------------- Features ---------------- */}
      <Section id="features" index="02" title="What it" accent="does">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {app.features.map((f, i) => {
            const Icon = featureIcons[f.icon] || FiMusic;
            return (
              <Reveal key={f.title} delay={i * 0.05}>
                <div className="glow-card glass h-full rounded-2xl p-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald/25 bg-emerald/10 text-emerald">
                    <Icon size={20} />
                  </span>
                  <h3 className="font-display mt-5 text-lg font-bold text-bright">{f.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-body">{f.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* ---------------- Screenshots ---------------- */}
      <Section id="screens" index="03" title="Inside the" accent="app">
        <Reveal className="mb-8">
          <p className="max-w-[62ch] text-base leading-relaxed text-body">
            Every screen is Jetpack Compose with Material 3, built dark-first. Tap any shot to open it full size.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {app.screenshots.map((s, i) => (
            <Reveal key={s.title} delay={(i % 4) * 0.05}>
              <button
                onClick={() => setLightbox(i)}
                className="glow-card group block w-full overflow-hidden rounded-2xl border border-line bg-ink-2 text-left"
                aria-label={`Open ${s.title} screenshot`}
              >
                <img
                  src={s.src}
                  alt={s.title}
                  loading="lazy"
                  className="aspect-[941/1672] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <span className="font-display block px-4 py-3 text-xs font-semibold text-bright">{s.title}</span>
              </button>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------------- Engineering ---------------- */}
      <Section id="engineering" index="04" title="Under the" accent="hood">
        <Reveal className="mb-10">
          <p className="max-w-[70ch] text-base leading-relaxed text-body md:text-lg">{app.architecture.summary}</p>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {app.architecture.layers.map((layer, i) => (
            <Reveal key={layer.name} delay={i * 0.06}>
              <div className="glass h-full rounded-2xl p-6">
                <h3 className="font-display text-sm font-bold uppercase tracking-[0.16em] text-emerald">
                  :{layer.name}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {layer.modules.map((m) => (
                    <Chip key={m} className="font-mono">{m}</Chip>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-body">{layer.note}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1} className="mt-12">
          <h3 className="font-display text-lg font-bold text-bright">Built with</h3>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {app.techStack.map((group) => (
              <div key={group.title}>
                <p className="font-display text-xs uppercase tracking-[0.18em] text-body/60">{group.title}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <Chip key={item}>{item}</Chip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ---------------- Privacy ---------------- */}
      <Section id="privacy" index="05" title="Privacy," accent="plainly">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <Reveal>
            <h3 className="font-display text-2xl font-bold text-bright md:text-3xl">{app.privacy.headline}</h3>
            <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-body">{app.privacy.body}</p>
            <ul className="mt-7 space-y-3">
              {app.privacy.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-body">
                  <FiShield className="mt-0.5 shrink-0 text-emerald" size={15} />
                  {p}
                </li>
              ))}
            </ul>
            <a
              href={app.privacyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-emerald transition-colors hover:text-bright"
            >
              Read the full privacy policy <FiExternalLink size={13} />
            </a>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="glass rounded-2xl p-6">
              <p className="font-display text-xs uppercase tracking-[0.18em] text-body/60">
                Permissions, and why
              </p>
              <ul className="mt-5 space-y-5">
                {app.permissions.map((p) => (
                  <li key={p.name}>
                    <p className="font-display text-sm font-semibold text-bright">{p.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-body">{p.why}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ---------------- CTA ---------------- */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-24 md:px-8 md:pb-32">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-3xl border-emerald/20 px-7 py-12 text-center md:px-12 md:py-16">
            <div className="blob left-1/2 top-full h-[300px] w-[300px] -translate-x-1/2 bg-emerald/25" aria-hidden="true" />
            <h2 className="font-display relative text-2xl font-bold text-bright md:text-4xl">
              Play the music that's <span className="text-gradient">already on your phone</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-[48ch] text-sm leading-relaxed text-body md:text-base">
              Free, fully offline, and no account needed. Available now on Google Play.
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={app.storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
              >
                <IoLogoGooglePlaystore size={18} /> Get it on Google Play
              </a>
              <a
                href={app.developerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-medium text-body transition-colors hover:border-emerald/50 hover:text-bright"
              >
                My other apps <FiExternalLink size={13} />
              </a>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-medium text-body transition-colors hover:border-violet/50 hover:text-bright"
              >
                <FiArrowLeft size={14} /> Back to portfolio
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 md:px-8">
          <div className="flex items-center gap-3">
            <Monogram size={28} />
            <span className="text-sm text-body">
              Designed &amp; built by <span className="font-medium text-bright">{identity.name}</span>
            </span>
          </div>
          <span className="text-xs text-body/60">© {new Date().getFullYear()} · Pocket Tunes</span>
        </div>
      </footer>

      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox
            shots={app.screenshots}
            index={lightbox}
            onClose={() => setLightbox(null)}
            onStep={step}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
