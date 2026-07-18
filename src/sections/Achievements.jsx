import React from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "../ui/primitives.jsx";
import { achievements } from "../data/content.js";
import { FiAward } from "react-icons/fi";

const tagColors = {
  "Open Source": "text-violet border-violet/40 bg-violet/10",
  Mentorship: "text-fuchsia border-fuchsia/40 bg-fuchsia/10",
  DSA: "text-cyan border-cyan/40 bg-cyan/10",
  Academics: "text-emerald border-emerald/40 bg-emerald/10",
};

export default function Achievements() {
  return (
    <section id="achievements" className="relative w-full px-5 py-28 md:px-10 md:py-36 xl:px-16">
      <SectionHeading index="04" title="Trophy" accent="wall" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a, i) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, delay: (i % 3) * 0.08, ease: [0.21, 0.65, 0.32, 0.99] }}
            className="glow-card glass flex h-full flex-col rounded-2xl p-6"
          >
            <div className="flex items-start justify-between">
              <FiAward className="text-violet" size={22} />
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tagColors[a.tag] || tagColors["Open Source"]}`}>
                {a.tag}
              </span>
            </div>
            <h3 className="font-display mt-4 text-lg font-bold text-bright">{a.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-body">{a.detail}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
