import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiShield,
} from "react-icons/fi";
import { IoLogoGooglePlaystore } from "react-icons/io5";
import { Reveal, Counter, Chip, Monogram, ImageSlot } from "../../ui/primitives.jsx";
import { featureIcons } from "../../data/apps.js";
import { identity } from "../../data/content.js";

/* Accent classes are written out in full so Tailwind can see them at build time. */
const ACCENTS = {
  emerald: {
    text: "text-emerald",
    rule: "from-emerald/50",
    blob: "bg-emerald/20",
    border: "border-emerald/20",
    iconBox: "border-emerald/25 bg-emerald/10 text-emerald",
    solidBtn: "bg-emerald text-ink",
    softBtn: "border-emerald/40 bg-emerald/10 text-emerald hover:bg-emerald/20",
    hoverBorder: "hover:border-emerald/50",
  },
  cyan: {
    text: "text-cyan",
    rule: "from-cyan/50",
    blob: "bg-cyan/20",
    border: "border-cyan/20",
    iconBox: "border-cyan/25 bg-cyan/10 text-cyan",
    solidBtn: "bg-cyan text-ink",
    softBtn: "border-cyan/40 bg-cyan/10 text-cyan hover:bg-cyan/20",
    hoverBorder: "hover:border-cyan/50",
  },
  violet: {
    text: "text-violet",
    rule: "from-violet/50",
    blob: "bg-violet/20",
    border: "border-violet/20",
    iconBox: "border-violet/25 bg-violet/10 text-violet",
    solidBtn: "bg-violet text-ink",
    softBtn: "border-violet/40 bg-violet/10 text-violet hover:bg-violet/20",
    hoverBorder: "hover:border-violet/50",
  },
  amber: {
    text: "text-amber",
    rule: "from-amber/50",
    blob: "bg-amber/20",
    border: "border-amber/20",
    iconBox: "border-amber/25 bg-amber/10 text-amber",
    solidBtn: "bg-amber text-ink",
    softBtn: "border-amber/40 bg-amber/10 text-amber hover:bg-amber/20",
    hoverBorder: "hover:border-amber/50",
  },
};

/* Screenshot aspect ratios, written out so Tailwind keeps the classes.
   "9/16" = store graphics, "9/20" = raw tall-phone device screenshots. */
const SHOT_ASPECT = {
  "9/16": "aspect-[9/16]",
  "9/20": "aspect-[264/592]",
};

/* ---------------- Section wrapper with a numbered heading ---------------- */
function Section({ id, index, title, accentWord, ac, children }) {
  return (
    <section id={id} className="mx-auto w-full max-w-6xl px-5 py-20 md:px-8 md:py-28">
      <Reveal className="mb-10 md:mb-14">
        <div className="flex items-baseline gap-4">
          <span className={`font-display text-sm uppercase tracking-[0.3em] ${ac.text}`}>{index}</span>
          <h2 className="font-display text-3xl font-bold text-bright md:text-4xl">
            {title} {accentWord && <span className="text-gradient">{accentWord}</span>}
          </h2>
        </div>
        <div className={`mt-5 h-px w-full bg-gradient-to-r ${ac.rule} via-line to-transparent`} />
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
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/[0.06] text-2xl leading-none text-bright transition-colors hover:bg-white/[0.12]"
      >
        &times;
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
          {shot.caption && <span className="mt-1 block">{shot.caption}</span>}
          <span className="mt-2 block text-xs text-body/50">
            {index + 1} / {shots.length}
          </span>
        </figcaption>
      </motion.figure>
    </motion.div>
  );
}

export default function AppCaseStudy({ app }) {
  const [lightbox, setLightbox] = useState(null);
  const ac = ACCENTS[app.accent] || ACCENTS.emerald;
  const shots = app.screenshots || [];
  const shotAspect = SHOT_ASPECT[app.shotAspect] || SHOT_ASPECT["9/16"];

  const step = useCallback(
    (dir) => setLightbox((i) => (i === null ? i : (i + dir + shots.length) % shots.length)),
    [shots.length]
  );

  useEffect(() => {
    const previous = document.title;
    document.title = `${app.fullName || app.name} · ${identity.shortName}`;
    return () => {
      document.title = previous;
    };
  }, [app]);

  // Sections are optional per app, so the numbering is computed as we go.
  let n = 0;
  const step2 = () => String(++n).padStart(2, "0");

  return (
    <div className="noise relative min-h-screen overflow-hidden bg-ink text-body">
      <div className={`blob left-[-10%] top-[-8%] h-[420px] w-[420px] ${ac.blob}`} aria-hidden="true" />
      <div className="blob right-[-12%] top-[30%] h-[460px] w-[460px] bg-violet/10" aria-hidden="true" />

      {/* ---------------- Top bar ---------------- */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 md:px-8">
        <Link to="/#apps" className="flex items-center gap-3 text-sm text-body transition-colors hover:text-bright">
          <Monogram size={32} />
          <span className="inline-flex items-center gap-1.5">
            <FiArrowLeft size={14} /> Back to portfolio
          </span>
        </Link>
        <a
          href={app.storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`hidden items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition-colors sm:inline-flex ${ac.softBtn}`}
        >
          <IoLogoGooglePlaystore size={16} /> Google Play
        </a>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-6 md:px-8 md:pb-24 md:pt-10">
        <Reveal>
          <p className={`font-display text-xs uppercase tracking-[0.3em] ${ac.text}`}>{app.eyebrow}</p>
          <h1 className="font-display mt-4 text-4xl font-bold leading-[1.05] text-bright sm:text-5xl md:text-6xl">
            {app.titleLead}
            {app.titleTight ? "" : " "}
            <span className="text-gradient">{app.titleAccent}</span>
          </h1>
          <p className={`font-display mt-3 text-lg md:text-xl ${ac.text}`}>{app.tagline}</p>
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
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.03] ${ac.solidBtn}`}
            >
              <IoLogoGooglePlaystore size={18} /> Get it on Google Play
            </a>
            {app.repoUrl && (
              <a
                href={app.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-medium text-body transition-colors hover:text-bright ${ac.hoverBorder}`}
              >
                Source on GitHub <FiExternalLink size={13} />
              </a>
            )}
            {app.privacyUrl && (
              <a
                href={app.privacyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-medium text-body transition-colors hover:text-bright ${ac.hoverBorder}`}
              >
                <FiShield size={16} /> Privacy policy <FiExternalLink size={13} />
              </a>
            )}
          </div>
        </Reveal>

        {/* Feature graphic */}
        <Reveal delay={0.14} className="mt-12">
          <div className={`glass overflow-hidden rounded-3xl ${ac.border}`}>
            {app.banner ? (
              <img src={app.banner} alt={`${app.name} feature graphic`} className="w-full object-cover" />
            ) : (
              <div className="aspect-[1024/500] w-full">
                <ImageSlot src={null} alt={app.name} label={`${app.name} banner`} accent={app.accent} />
              </div>
            )}
          </div>
        </Reveal>

        {/* Meta strip */}
        {app.meta?.length > 0 && (
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
        )}
      </section>

      {/* ---------------- Overview ---------------- */}
      <Section id="overview" index={step2()} title="Why it" accentWord="exists" ac={ac}>
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <Reveal>
            <div className="space-y-5">
              {app.intro.map((p) => (
                <p key={p.slice(0, 24)} className="text-base leading-relaxed text-body md:text-lg">
                  {p}
                </p>
              ))}
            </div>
            {app.nonGoals?.length > 0 && (
              <div className="mt-8">
                <p className="font-display text-xs uppercase tracking-[0.2em] text-body/60">
                  What it deliberately doesn't do
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {app.nonGoals.map((g) => (
                    <Chip key={g}>{g}</Chip>
                  ))}
                </div>
              </div>
            )}
          </Reveal>

          {app.stats?.length > 0 && (
            <Reveal delay={0.1}>
              <div className="grid grid-cols-2 gap-4">
                {app.stats.map((s) => (
                  <div key={s.label} className="glass rounded-2xl p-5">
                    <div className="font-display text-3xl font-bold text-bright">
                      <Counter value={s.value} suffix={s.suffix || ""} />
                    </div>
                    <p className="mt-1.5 text-xs leading-snug text-body">{s.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          )}
        </div>

        {/* Optional platform row (multiplatform apps) */}
        {app.platforms?.length > 0 && (
          <Reveal delay={0.16} className="mt-12">
            <p className="font-display text-xs uppercase tracking-[0.2em] text-body/60">Platforms</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {app.platforms.map((p) => (
                <div key={p.name} className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-base font-bold text-bright">{p.name}</h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                        p.shipped ? `${ac.iconBox} border` : "border border-line text-body/70"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-body">{p.note}</p>
                </div>
              ))}
            </div>
          </Reveal>
        )}
      </Section>

      {/* ---------------- Features ---------------- */}
      <Section id="features" index={step2()} title="What it" accentWord="does" ac={ac}>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {app.features.map((f, i) => {
            const Icon = featureIcons[f.icon] || featureIcons.sparkles;
            return (
              <Reveal key={f.title} delay={i * 0.05}>
                <div className="glow-card glass h-full rounded-2xl p-6">
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${ac.iconBox}`}>
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
      <Section id="screens" index={step2()} title="Inside the" accentWord="app" ac={ac}>
        <Reveal className="mb-8">
          <p className="max-w-[62ch] text-base leading-relaxed text-body">
            {shots.length > 0
              ? `${app.screensBlurb} Tap any shot to open it full size.`
              : app.screensBlurb}
          </p>
        </Reveal>

        {shots.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {shots.map((s, i) => (
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
                    className={`${shotAspect} w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]`}
                  />
                  <span className="font-display block px-4 py-3 text-xs font-semibold text-bright">{s.title}</span>
                </button>
              </Reveal>
            ))}
          </div>
        ) : (
          /* No screenshots wired up yet — placeholders make the gap obvious. */
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className={`${shotAspect} overflow-hidden rounded-2xl border border-line bg-ink-2`}>
                  <ImageSlot src={null} alt={`${app.name} screenshot`} label={app.name} accent={app.accent} />
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </Section>

      {/* ---------------- Engineering ---------------- */}
      <Section id="engineering" index={step2()} title="Under the" accentWord="hood" ac={ac}>
        <Reveal className="mb-10">
          <p className="max-w-[70ch] text-base leading-relaxed text-body md:text-lg">
            {app.architecture.summary}
          </p>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {app.architecture.layers.map((layer, i) => (
            <Reveal key={layer.name} delay={i * 0.06}>
              <div className="glass h-full rounded-2xl p-6">
                <h3 className={`font-display text-sm font-bold uppercase tracking-[0.16em] ${ac.text}`}>
                  {layer.name}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {layer.modules.map((m) => (
                    <Chip key={m}>{m}</Chip>
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
      {app.privacy && (
        <Section id="privacy" index={step2()} title="Privacy," accentWord="plainly" ac={ac}>
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <Reveal>
              <h3 className="font-display text-2xl font-bold text-bright md:text-3xl">{app.privacy.headline}</h3>
              <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-body">{app.privacy.body}</p>
              <ul className="mt-7 space-y-3">
                {app.privacy.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-body">
                    <FiShield className={`mt-0.5 shrink-0 ${ac.text}`} size={15} />
                    {p}
                  </li>
                ))}
              </ul>
              {app.privacyUrl && (
                <a
                  href={app.privacyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-7 inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-bright ${ac.text}`}
                >
                  Read the full privacy policy <FiExternalLink size={13} />
                </a>
              )}
            </Reveal>

            {app.permissions?.length > 0 && (
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
            )}
          </div>
        </Section>
      )}

      {/* ---------------- CTA ---------------- */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-24 md:px-8 md:pb-32">
        <Reveal>
          <div className={`glass relative overflow-hidden rounded-3xl px-7 py-12 text-center md:px-12 md:py-16 ${ac.border}`}>
            <div className={`blob left-1/2 top-full h-[300px] w-[300px] -translate-x-1/2 ${ac.blob}`} aria-hidden="true" />
            <h2 className="font-display relative text-2xl font-bold text-bright md:text-4xl">
              {app.cta.headlineLead} <span className="text-gradient">{app.cta.headlineAccent}</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-[48ch] text-sm leading-relaxed text-body md:text-base">
              {app.cta.body}
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={app.storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.03] ${ac.solidBtn}`}
              >
                <IoLogoGooglePlaystore size={18} /> Get it on Google Play
              </a>
              <a
                href={app.developerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-medium text-body transition-colors hover:text-bright ${ac.hoverBorder}`}
              >
                My other apps <FiExternalLink size={13} />
              </a>
              <Link
                to="/#apps"
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
          <span className="text-xs text-body/60">
            © {new Date().getFullYear()} · {app.name}
          </span>
        </div>
      </footer>

      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox shots={shots} index={lightbox} onClose={() => setLightbox(null)} onStep={step} />
        )}
      </AnimatePresence>
    </div>
  );
}
