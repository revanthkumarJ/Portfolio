import React, { useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { Reveal, SectionHeading, Chip } from "../ui/primitives.jsx";
import { experience } from "../data/content.js";
import { FiChevronDown, FiExternalLink } from "react-icons/fi";

function ExperienceCard({ exp, index }) {
  const [open, setOpen] = useState(false);
  const hasMore = exp.highlights.length > 0;

  return (
    <Reveal delay={0.05} className="relative pl-10 md:pl-16">
      {/* Node on the timeline */}
      <span
        className={`absolute left-[7px] top-7 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 md:left-[15px] ${
          exp.current
            ? "border-emerald bg-emerald/30 shadow-[0_0_12px_rgba(110,231,183,0.8)]"
            : "border-violet/70 bg-ink"
        }`}
      />

      <div className="glow-card glass mb-8 rounded-2xl p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-bold text-bright">{exp.role}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span className="font-medium text-violet">{exp.company}</span>
              {exp.current && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-2.5 py-0.5 text-xs font-semibold text-emerald">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald" /> Now
                </span>
              )}
            </div>
          </div>
          <span className="font-display text-sm text-body/70">{exp.period}</span>
        </div>

        <p className="mt-4 leading-relaxed text-body">{exp.summary}</p>

        {exp.tech.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {exp.tech.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        )}

        <AnimatePresence initial={false}>
          {open && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {exp.highlights.map((h, i) => (
                <li key={i} className="mt-3 flex gap-3 text-sm leading-relaxed text-body first:mt-5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-violet to-fuchsia" />
                  {h}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        {(hasMore || exp.links.length > 0) && (
          <div className="mt-5 flex flex-wrap items-center gap-4">
            {hasMore && (
              <button
                onClick={() => setOpen(!open)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet transition-colors hover:text-fuchsia"
              >
                {open ? "Show less" : "Deep dive"}
                <FiChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
            )}
            {exp.links.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-body transition-colors hover:text-bright"
              >
                {l.text} <FiExternalLink size={13} />
              </a>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}

export default function Experience() {
  const lineRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: lineRef,
    offset: ["start 60%", "end 75%"],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 90, damping: 25 });

  return (
    <section id="experience" className="relative w-full px-5 py-28 md:px-10 md:py-36 xl:px-16">
      <SectionHeading index="03" title="Where I've" accent="worked" />

      <div ref={lineRef} className="relative">
        {/* Track + scroll-drawn progress line */}
        <div className="absolute bottom-0 left-[7px] top-0 w-px bg-line md:left-[15px]" />
        <motion.div
          style={{ scaleY }}
          className="absolute bottom-0 left-[7px] top-0 w-px origin-top bg-gradient-to-b from-violet via-fuchsia to-cyan md:left-[15px]"
        />

        {experience.map((exp, i) => (
          <ExperienceCard key={`${exp.company}-${exp.role}`} exp={exp} index={i} />
        ))}
      </div>
    </section>
  );
}
