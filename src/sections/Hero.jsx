import React from "react";
import { motion } from "framer-motion";
import { Magnetic, Counter, ImageSlot } from "../ui/primitives.jsx";
import { useResume } from "../ui/resume.jsx";
import { identity, heroStats, socials } from "../data/content.js";
import { FiGithub, FiLinkedin, FiInstagram, FiMail, FiArrowDown } from "react-icons/fi";

const socialIcons = { github: FiGithub, linkedin: FiLinkedin, instagram: FiInstagram, mail: FiMail };

const line = {
  hidden: { opacity: 0, y: 40 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: 0.25 + i * 0.12, ease: [0.21, 0.65, 0.32, 0.99] },
  }),
};

export default function Hero() {
  const openResume = useResume();
  return (
    <section id="top" className="relative flex min-h-screen flex-col justify-center overflow-hidden pt-[72px]">
      {/* Ambient gradient blobs */}
      <div className="blob left-[-10%] top-[-5%] h-[480px] w-[480px] bg-violet-600/25" />
      <div className="blob right-[-8%] top-[30%] h-[420px] w-[420px] bg-fuchsia-600/15" />
      <div className="blob bottom-[-10%] left-[30%] h-[380px] w-[380px] bg-cyan-500/10" />

      <div className="relative z-10 grid w-full items-center gap-10 px-5 md:px-10 lg:grid-cols-[1.15fr_0.85fr] xl:px-16">
        <div>
        {/* Availability badge */}
        {identity.openToOpportunities && (
          <motion.div custom={0} variants={line} initial="hidden" animate="show" className="mb-8">
            <span className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm text-bright/90">
              <span className="pulse-dot h-2 w-2 rounded-full bg-emerald" />
              Open to opportunities
            </span>
          </motion.div>
        )}

        {/* Headline */}
        <motion.h1
          custom={1}
          variants={line}
          initial="hidden"
          animate="show"
          className="font-display max-w-4xl text-3xl font-bold leading-[1.12] tracking-tight text-bright sm:text-4xl md:text-5xl 2xl:text-6xl"
        >
          I build <span className="text-gradient">production Android</span> &amp; Kotlin Multiplatform apps used by
          thousands of businesses.
        </motion.h1>

        {/* Identity lines */}
        <motion.div custom={2} variants={line} initial="hidden" animate="show" className="mt-8">
          <p className="font-display text-xl font-bold text-bright md:text-2xl">{identity.name}</p>
          <p className="mt-1.5 text-base text-body md:text-lg">
            SDE 1 · Android @ <span className="font-semibold text-violet">Swipe (YC S21)</span>
          </p>
          <p className="mt-1 text-base text-body md:text-lg">
            Mifos <span className="text-bright/90">Open Source Mentor, Maintainer &amp; Contributor</span>
          </p>
        </motion.div>

        {/* CTAs + socials */}
        <motion.div custom={3} variants={line} initial="hidden" animate="show" className="mt-10 flex flex-wrap items-center gap-4">
          <Magnetic>
            <a
              href="#projects"
              className="font-display inline-block rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-8 py-3.5 text-sm font-bold tracking-wide text-white shadow-[0_8px_40px_-8px_rgba(167,139,250,0.7)] transition-shadow hover:shadow-[0_8px_60px_-6px_rgba(232,121,249,0.8)]"
            >
              View my work
            </a>
          </Magnetic>
          <Magnetic>
            <button
              onClick={openResume}
              className="font-display inline-block cursor-pointer rounded-full border border-line px-8 py-3.5 text-sm font-bold tracking-wide text-bright transition-colors hover:border-violet/60 hover:bg-white/5"
            >
              Resume
            </button>
          </Magnetic>
          <div className="ml-1 flex items-center gap-1">
            {socials.map((s) => {
              const Icon = socialIcons[s.icon];
              return (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="rounded-full p-3 text-body transition-all hover:text-bright hover:drop-shadow-[0_0_8px_rgba(167,139,250,0.8)]"
                >
                  <Icon size={20} />
                </a>
              );
            })}
          </div>
        </motion.div>

        {/* Stat strip */}
        <motion.div
          custom={4}
          variants={line}
          initial="hidden"
          animate="show"
          className="mt-16 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-6 border-t border-line pt-8 sm:grid-cols-4 md:mt-20 xl:max-w-5xl"
        >
          {heroStats.map((s) => (
            <div key={s.label}>
              <div className="font-display text-3xl font-bold text-bright md:text-4xl">
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-xs leading-snug text-body/80 md:text-sm">{s.label}</div>
            </div>
          ))}
        </motion.div>
        </div>

        {/* Right: workspace portrait — 🖼️ 1200×1500 (4:5), slot in content.js */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.21, 0.65, 0.32, 0.99] }}
          className="relative flex justify-center pb-4 lg:pb-0"
        >
          {/* glow ring behind the card */}
          <div className="absolute inset-0 -z-10 m-auto h-[70%] w-[70%] rounded-full bg-gradient-to-tr from-violet-600/30 via-fuchsia-600/20 to-cyan-500/20 blur-3xl" />
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="glow-card glass w-full max-w-[420px] overflow-hidden rounded-3xl xl:max-w-[460px]"
          >
            <div className="aspect-[4/5] w-full">
              <ImageSlot
                src={identity.heroImage}
                alt={`${identity.name} at his dev workstation`}
                label="Workspace portrait (1200×1500)"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.a
        href="#about"
        aria-label="Scroll to about"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-body/60 hover:text-bright"
      >
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}>
          <FiArrowDown size={22} />
        </motion.div>
      </motion.a>
    </section>
  );
}
