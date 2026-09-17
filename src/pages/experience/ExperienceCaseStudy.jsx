import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiAlertCircle,
  FiArrowLeft,
  FiAward,
  FiCheck,
  FiChevronDown,
  FiCpu,
  FiDownload,
  FiExternalLink,
  FiGitBranch,
  FiGithub,
  FiGlobe,
  FiGrid,
  FiLayers,
  FiPlus,
  FiScissors,
  FiShare2,
  FiSmartphone,
  FiUsers,
} from "react-icons/fi";
import { IoLogoGooglePlaystore } from "react-icons/io5";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal, Counter, Chip, Monogram } from "../../ui/primitives.jsx";
import { identity } from "../../data/content.js";
import { JIRA_BASE } from "../../data/experience/mifosPullRequests.js";

const HIGHLIGHT_ICONS = {
  download: FiDownload,
  layers: FiLayers,
  activity: FiActivity,
  bug: FiAlertCircle,
  smartphone: FiSmartphone,
  globe: FiGlobe,
  scissors: FiScissors,
  share: FiShare2,
  award: FiAward,
  grid: FiGrid,
  gitBranch: FiGitBranch,
  users: FiUsers,
  plus: FiPlus,
  alert: FiAlertCircle,
  cpu: FiCpu,
};

/* Accent classes are spelled out in full so Tailwind sees them at build time. */
const ACCENTS = {
  cyan: {
    text: "text-cyan",
    rule: "from-cyan/50",
    blob: "bg-cyan/20",
    border: "border-cyan/20",
    iconBox: "border-cyan/25 bg-cyan/10 text-cyan",
    softBtn: "border-cyan/40 bg-cyan/10 text-cyan hover:bg-cyan/20",
    hoverBorder: "hover:border-cyan/50",
  },
  violet: {
    text: "text-violet",
    rule: "from-violet/50",
    blob: "bg-violet/20",
    border: "border-violet/20",
    iconBox: "border-violet/25 bg-violet/10 text-violet",
    softBtn: "border-violet/40 bg-violet/10 text-violet hover:bg-violet/20",
    hoverBorder: "hover:border-violet/50",
  },
  emerald: {
    text: "text-emerald",
    rule: "from-emerald/50",
    blob: "bg-emerald/20",
    border: "border-emerald/20",
    iconBox: "border-emerald/25 bg-emerald/10 text-emerald",
    softBtn: "border-emerald/40 bg-emerald/10 text-emerald hover:bg-emerald/20",
    hoverBorder: "hover:border-emerald/50",
  },
};

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

/* ---------------- One work category, with its PR table folded away ----------------
   The table is collapsed by default: the summary is the point, the table is there
   so anyone who wants to verify a claim can click through to the actual PR. */
function CategoryCard({ cat, rows, ac }) {
  const [open, setOpen] = useState(false);
  const Icon = HIGHLIGHT_ICONS[cat.icon] || FiLayers;
  /* Two table shapes: linkable PRs for public repos, grouped work areas for
     private ones where titles can't be published. */
  const isPrTable = rows.length > 0 && rows[0].url !== undefined;
  const merged = isPrTable ? rows.filter((r) => r.state === "merged").length : 0;
  const added = isPrTable ? rows.reduce((sum, r) => sum + r.add, 0) : 0;
  const panelId = `prs-${cat.key}`;

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="p-6 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${ac.iconBox}`}>
              <Icon size={20} />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-bright">{cat.title}</h3>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-body/60">
                {isPrTable
                  ? `${rows.length} PRs · ${merged} merged · +${added.toLocaleString()} lines`
                  : `${rows.length} work areas`}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-body">{cat.blurb}</p>

        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={panelId}
          className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-bright ${ac.text}`}
        >
          {open
            ? "Hide the breakdown"
            : isPrTable
              ? `Show all ${rows.length} pull requests`
              : `Show the ${rows.length} work areas`}
          <FiChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto border-t border-line">
              {isPrTable ? (
              <table className="w-full text-left text-sm md:min-w-[680px]">
                <thead>
                  <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-body/60">
                    <th scope="col" className="py-3 pl-4 pr-2 font-medium sm:pl-6 md:pl-7">PR</th>
                    <th scope="col" className="hidden px-3 py-3 font-medium md:table-cell">Repo</th>
                    <th scope="col" className="px-2 py-3 font-medium sm:px-3">Work done</th>
                    <th scope="col" className="px-2 py-3 pr-4 font-medium sm:px-3 sm:pr-3">Jira</th>
                    <th scope="col" className="hidden py-3 pl-3 pr-6 font-medium sm:table-cell md:pr-7">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.url} className="border-b border-line/60 last:border-0 hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap py-3 pl-4 pr-2 sm:pl-6 md:pl-7">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 font-medium transition-colors hover:text-bright ${ac.text}`}
                        >
                          <FiGithub size={12} className="opacity-70" />#{r.n}
                        </a>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3 text-xs text-body/70 md:table-cell">{r.repo}</td>
                      <td className="px-2 py-3 text-body sm:px-3">
                        {r.title}
                        {r.state !== "merged" && (
                          <span className="ml-2 rounded-full border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-body/60">
                            {r.state}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 pr-4 sm:px-3 sm:pr-3">
                        {r.jira ? (
                          <a
                            href={JIRA_BASE + r.jira}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-body/70 underline-offset-4 transition-colors hover:text-bright hover:underline"
                          >
                            {r.jira}
                          </a>
                        ) : (
                          <span className="text-xs text-body/30">—</span>
                        )}
                      </td>
                      <td className="hidden whitespace-nowrap py-3 pl-3 pr-6 text-xs text-body/60 sm:table-cell md:pr-7">{r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              ) : (
              <table className="w-full text-left text-sm md:min-w-[640px]">
                <thead>
                  <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-body/60">
                    <th scope="col" className="py-3 pl-4 pr-2 font-medium sm:pl-6 md:pl-7">Work area</th>
                    <th scope="col" className="hidden px-3 py-3 pr-6 font-medium md:table-cell md:pr-7">What that covered</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.area} className="border-b border-line/60 last:border-0 hover:bg-white/[0.02]">
                      <td className="py-3 pl-4 pr-2 font-medium text-bright sm:pl-6 md:pl-7">
                        {r.area}
                        <span className="mt-1 block text-xs font-normal leading-relaxed text-body md:hidden">
                          {r.note}
                        </span>
                      </td>
                      <td className="hidden px-3 py-3 pr-6 text-body md:table-cell md:pr-7">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ExperienceCaseStudy({ entry }) {
  const ac = ACCENTS[entry.accent] || ACCENTS.violet;

  useEffect(() => {
    const previous = document.title;
    document.title = `${entry.company} · ${identity.shortName}`;
    return () => {
      document.title = previous;
    };
  }, [entry]);

  let n = 0;
  const step = () => String(++n).padStart(2, "0");

  return (
    <div className="noise relative min-h-screen overflow-hidden bg-ink text-body">
      <div className={`blob left-[-10%] top-[-8%] h-[420px] w-[420px] ${ac.blob}`} aria-hidden="true" />
      <div className="blob right-[-12%] top-[30%] h-[460px] w-[460px] bg-violet/10" aria-hidden="true" />

      {/* ---------------- Top bar ---------------- */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 md:px-8">
        <Link
          to="/#experience"
          className="flex items-center gap-3 text-sm text-body transition-colors hover:text-bright"
        >
          <Monogram size={32} />
          <span className="inline-flex items-center gap-1.5">
            <FiArrowLeft size={14} /> Back to portfolio
          </span>
        </Link>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-6 md:px-8 md:pb-24 md:pt-10">
        <Reveal>
          <p className={`font-display text-xs uppercase tracking-[0.3em] ${ac.text}`}>{entry.eyebrow}</p>
          <h1 className="font-display mt-4 text-4xl font-bold leading-[1.05] text-bright sm:text-5xl md:text-6xl">
            {entry.titleLead} <span className="text-gradient">{entry.titleAccent}</span>
          </h1>
          <p className={`font-display mt-3 text-lg md:text-xl ${ac.text}`}>{entry.tagline}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-body">
            <span className="font-medium text-bright">{entry.role}</span>
            <span className="text-body/40">·</span>
            <span>{entry.discipline}</span>
            <span className="text-body/40">·</span>
            <span>{entry.period}</span>
          </div>

          <p className="mt-6 max-w-[68ch] text-base leading-relaxed text-body md:text-lg">{entry.summary}</p>
        </Reveal>

        {/* Stat row */}
        <Reveal delay={0.1} className="mt-12">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {entry.stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-5">
                <div className="font-display text-3xl font-bold text-bright md:text-4xl">
                  <Counter value={s.value} suffix={s.suffix || ""} />
                </div>
                <p className="mt-1.5 text-xs leading-snug text-body">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Meta strip */}
        {entry.meta?.length > 0 && (
          <Reveal delay={0.16} className="mt-6">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
              {entry.meta.map((m) => (
                <div key={m.label} className="bg-ink-2 px-5 py-4">
                  <dt className="text-[11px] uppercase tracking-[0.16em] text-body/60">{m.label}</dt>
                  <dd className="font-display mt-1.5 text-sm font-semibold text-bright">{m.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        )}
      </section>

      {/* ---------------- Highlights ---------------- */}
      <Section id="work" index={step()} title="The work that" accentWord="mattered" ac={ac}>
        <div className="grid gap-5 md:grid-cols-2">
          {entry.highlights.map((h, i) => {
            const Icon = HIGHLIGHT_ICONS[h.icon] || FiLayers;
            return (
              <Reveal key={h.title} delay={(i % 2) * 0.06}>
                <article className="glow-card glass h-full rounded-2xl p-6 md:p-7">
                  <div className="flex items-start gap-4">
                    <span
                      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${ac.iconBox}`}
                    >
                      <Icon size={20} />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold text-bright">{h.title}</h3>
                      <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-body/60">{h.scale}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-body">{h.body}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* ---------------- Work by category (with verifiable PR tables) ---------------- */}
      {entry.categories?.length > 0 && (
        <Section id="categories" index={step()} title="Broken down by" accentWord="category" ac={ac}>
          <Reveal className="mb-8">
            <p className="max-w-[66ch] text-base leading-relaxed text-body">
              {entry.categoriesBlurb ||
                "Every pull request, sorted by the kind of work it was. The tables are folded away because the summary is the point — open one if you want to check a claim against the actual PR, or the Jira ticket behind it."}
            </p>
          </Reveal>

          <div className="space-y-5">
            {entry.categories.map((cat, i) => (
              <Reveal key={cat.key} delay={Math.min(i, 4) * 0.04}>
                <CategoryCard cat={cat} rows={(entry.prs || entry.work)?.[cat.key] || []} ac={ac} />
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* ---------------- Products ---------------- */}
      <Section id="products" index={step()} title="Where it" accentWord="shipped" ac={ac}>
        {entry.productsBlurb && (
          <Reveal className="mb-8">
            <p className="max-w-[64ch] text-base leading-relaxed text-body">{entry.productsBlurb}</p>
          </Reveal>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {entry.products.map((p, i) => (
            <Reveal key={p.name} delay={(i % 2) * 0.05}>
              <div className="glass flex items-center justify-between gap-5 rounded-2xl px-6 py-5">
                <div className="min-w-0" data-product>
                  <div className="flex flex-wrap items-center gap-2">
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-display text-base font-bold text-bright underline-offset-4 transition-colors hover:text-violet hover:underline"
                      >
                        {p.name}
                      </a>
                    ) : (
                      <h3 className="font-display text-base font-bold text-bright">{p.name}</h3>
                    )}
                    {p.shipped && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${ac.iconBox}`}
                      >
                        <IoLogoGooglePlaystore size={10} /> Live
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-body">{p.note}</p>
                </div>
                {p.prs !== undefined && (
                  <div className="shrink-0 text-right">
                    <div className="font-display text-2xl font-bold text-bright">{p.prs}</div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-body/60">PRs</p>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------------- Takeaways ---------------- */}
      <Section id="takeaways" index={step()} title="What I took" accentWord="from it" ac={ac}>
        <div className="grid gap-5 md:grid-cols-2">
          {entry.takeaways.map((t, i) => (
            <Reveal key={t.title} delay={(i % 2) * 0.06}>
              <div className="glass h-full rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <FiCheck className={`mt-1 shrink-0 ${ac.text}`} size={16} />
                  <div>
                    <h3 className="font-display text-base font-bold text-bright">{t.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-body">{t.body}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------------- Stack ---------------- */}
      <Section id="stack" index={step()} title="Built" accentWord="with" ac={ac}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {entry.stack.map((group) => (
            <Reveal key={group.title}>
              <p className="font-display text-xs uppercase tracking-[0.18em] text-body/60">{group.title}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <Chip key={item}>{item}</Chip>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------------- CTA ---------------- */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-24 md:px-8 md:pb-32">
        <Reveal>
          <div className={`glass relative overflow-hidden rounded-3xl px-7 py-12 text-center md:px-12 md:py-16 ${ac.border}`}>
            <div
              className={`blob left-1/2 top-full h-[300px] w-[300px] -translate-x-1/2 ${ac.blob}`}
              aria-hidden="true"
            />
            <h2 className="font-display relative text-2xl font-bold text-bright md:text-4xl">
              {entry.cta?.headlineLead || "See the apps"}{" "}
              <span className="text-gradient">{entry.cta?.headlineAccent || "on Google Play"}</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-[52ch] text-sm leading-relaxed text-body md:text-base">
              {entry.cta?.body || "Have a look at what shipped."}
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
              {entry.links.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors ${ac.softBtn}`}
                >
                  {l.store ? <IoLogoGooglePlaystore size={16} /> : <FiExternalLink size={14} />} {l.text}
                </a>
              ))}
              <Link
                to="/#experience"
                className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-medium text-body transition-colors hover:border-violet/50 hover:text-bright"
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
            © {new Date().getFullYear()} · {entry.company}
          </span>
        </div>
      </footer>
    </div>
  );
}
