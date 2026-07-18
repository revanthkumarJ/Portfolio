import React from "react";
import { Reveal } from "../ui/primitives.jsx";
import { testimonial } from "../data/content.js";
import { FiExternalLink } from "react-icons/fi";

export default function Testimonial() {
  return (
    <section className="relative w-full px-5 py-20 md:px-10 md:py-28 xl:px-16">
      <div className="blob left-[-20%] top-[0%] h-[360px] w-[360px] bg-fuchsia-600/12" />
      <Reveal>
        <figure className="glow-card glass relative rounded-3xl p-8 md:p-12">
          <span className="font-display absolute -top-7 left-8 text-[110px] leading-none text-gradient select-none">“</span>
          <blockquote className="relative text-lg leading-relaxed text-bright/90 md:text-xl">
            {testimonial.quote}
          </blockquote>
          <figcaption className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
            <div>
              <div className="font-display font-bold text-bright">{testimonial.author}</div>
              <div className="text-sm text-body">{testimonial.title}</div>
            </div>
            <a
              href={testimonial.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-violet transition-colors hover:text-fuchsia"
            >
              View on LinkedIn <FiExternalLink size={14} />
            </a>
          </figcaption>
        </figure>
      </Reveal>
    </section>
  );
}
