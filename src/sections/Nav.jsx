import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monogram } from "../ui/primitives.jsx";
import { navLinks, identity } from "../data/content.js";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy
  useEffect(() => {
    const sections = navLinks
      .map((l) => document.querySelector(l.href))
      .filter(Boolean);
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(`#${e.target.id}`);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.21, 0.65, 0.32, 0.99], delay: 0.1 }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-lg shadow-black/20" : "bg-transparent"
      }`}
    >
      <nav className="flex h-[72px] w-full items-center justify-between px-5 md:px-10 xl:px-16">
        <a href="#top" aria-label="Home" className="flex items-center gap-3">
          <Monogram size={38} />
          <span className="font-display hidden text-sm font-semibold tracking-wide text-bright sm:block">
            {identity.shortName.toLowerCase()}.dev
          </span>
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active === l.href ? "text-bright" : "text-body hover:text-bright"
                }`}
              >
                {active === l.href && <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet to-fuchsia align-middle" />}
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={identity.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 rounded-full border border-violet/50 px-5 py-2 text-sm font-semibold text-bright transition-all hover:border-violet hover:bg-violet/10 hover:shadow-[0_0_24px_-6px_rgba(167,139,250,0.6)]"
            >
              Resume
            </a>
          </li>
        </ul>

        {/* Mobile toggle */}
        <button
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span className={`h-0.5 w-6 bg-bright transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-6 bg-bright transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-6 bg-bright transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="glass overflow-hidden md:hidden"
          >
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block px-8 py-4 text-base font-medium text-bright/90 hover:bg-white/5"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={identity.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-8 py-4 text-base font-semibold text-violet"
              >
                Resume ↗
              </a>
            </li>
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
