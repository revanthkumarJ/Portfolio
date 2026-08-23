import React from "react";
import { Reveal, SectionHeading, Magnetic } from "../ui/primitives.jsx";
import { whyHireMe, identity } from "../data/content.js";
import { useResume } from "../ui/resume.jsx";
import { FiSmartphone, FiLayers, FiCpu, FiFileText, FiArrowRight } from "react-icons/fi";
import { IoLogoGooglePlaystore } from "react-icons/io5";

const pillarIcons = {
  smartphone: FiSmartphone,
  layers: FiLayers,
  playstore: IoLogoGooglePlaystore,
  cpu: FiCpu,
};

export default function WhyHireMe() {
  const openResume = useResume();

  return (
    <section id="why" className="relative w-full px-5 py-28 md:px-10 md:py-36 xl:px-16">
      <div className="blob left-[-12%] top-[15%] h-[420px] w-[420px] bg-violet-600/15" />

      <SectionHeading index="07" title="Why" accent="hire me" />

      <Reveal>
        <p className="max-w-[62ch] text-lg leading-relaxed text-body md:text-xl">{whyHireMe.lead}</p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2 md:gap-6">
        {whyHireMe.pillars.map((p, i) => {
          const Icon = pillarIcons[p.icon] || FiSmartphone;
          return (
            <Reveal key={p.title} delay={(i % 2) * 0.08}>
              <div className="glow-card glass flex h-full gap-5 rounded-2xl p-6 md:p-7">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet/30 bg-violet/10 text-violet">
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-bright md:text-xl">{p.title}</h3>
                  <p className="mt-2 leading-relaxed text-body">{p.body}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* CTA */}
      <Reveal delay={0.15}>
        <div className="mt-12 flex flex-wrap items-center gap-4">
          <Magnetic strength={0.2}>
            <button
              onClick={openResume}
              className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-violet to-fuchsia px-6 py-3 text-sm font-semibold text-white transition-shadow hover:shadow-[0_0_30px_-6px_rgba(167,139,250,0.8)]"
            >
              <FiFileText size={17} /> View my resume
            </button>
          </Magnetic>
          <a
            href="#contact"
            className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-bright transition-all hover:border-violet/50 hover:shadow-[0_0_24px_-8px_rgba(167,139,250,0.7)]"
          >
            Let's talk <FiArrowRight size={16} />
          </a>
        </div>
      </Reveal>
    </section>
  );
}
