import React from "react";
import { Reveal, SectionHeading, Chip } from "../ui/primitives.jsx";
import { blog } from "../data/content.js";
import { FiArrowUpRight } from "react-icons/fi";
import { FaMedium } from "react-icons/fa6";

export default function Writing() {
  return (
    <section id="writing" className="relative w-full px-5 py-28 md:px-10 md:py-36 xl:px-16">
      <SectionHeading index="05" title="Things I've" accent="written" />

      <div className="grid gap-5 md:grid-cols-2">
        {blog.posts.map((post, i) => (
          <Reveal key={post.url} delay={(i % 2) * 0.08}>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glow-card glass group flex h-full flex-col rounded-2xl p-6 md:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-body/60">
                  {post.date}
                </span>
                <FiArrowUpRight
                  size={20}
                  className="shrink-0 text-body/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet"
                />
              </div>
              <h3 className="font-display mt-3 flex-1 text-lg font-bold leading-snug text-bright transition-colors group-hover:text-gradient md:text-xl">
                {post.title}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </div>
            </a>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.2}>
        <div className="mt-10 flex justify-center">
          <a
            href={blog.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="glass inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold text-bright transition-all hover:border-violet/50 hover:shadow-[0_0_24px_-8px_rgba(167,139,250,0.7)]"
          >
            <FaMedium size={18} /> Read all on Medium
          </a>
        </div>
      </Reveal>
    </section>
  );
}
