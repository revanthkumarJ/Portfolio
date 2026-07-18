import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";

/* ---------------- Reveal: fade+rise on scroll into view ---------------- */
export function Reveal({ children, delay = 0, y = 28, className = "", once = true }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.65, 0.32, 0.99] }}
    >
      {children}
    </motion.div>
  );
}

/* ---------------- Counter: counts up when scrolled into view ---------------- */
export function Counter({ value, suffix = "", className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ---------------- TiltCard: 3D tilt following the cursor ---------------- */
export function TiltCard({ children, className = "", max = 7 }) {
  const ref = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 180, damping: 20 });
  const sry = useSpring(ry, { stiffness: 180, damping: 20 });

  function onMove(e) {
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * max);
    rx.set(-py * max);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d", perspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------------- Magnetic: element gently follows the cursor ---------------- */
export function Magnetic({ children, strength = 0.3, className = "" }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });

  function onMove(e) {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * strength);
    y.set((e.clientY - rect.top - rect.height / 2) * strength);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ x: sx, y: sy }} className={className}>
      {children}
    </motion.div>
  );
}

/* ---------------- SectionHeading ---------------- */
export function SectionHeading({ index, title, accent }) {
  return (
    <Reveal className="mb-12 md:mb-16">
      <div className="flex items-baseline gap-4">
        <span className="font-display text-sm tracking-[0.3em] text-violet uppercase">{index}</span>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-bright">
          {title} {accent && <span className="text-gradient">{accent}</span>}
        </h2>
      </div>
      <div className="mt-5 h-px w-full bg-gradient-to-r from-violet/60 via-line to-transparent" />
    </Reveal>
  );
}

/* ---------------- RJ Monogram (designed in-code, scalable) ---------------- */
export function Monogram({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="RJ monogram">
      <defs>
        <linearGradient id="rj-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="55%" stopColor="#e879f9" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="45" height="45" rx="12" stroke="url(#rj-grad)" strokeWidth="2.5" />
      <text
        x="24"
        y="31.5"
        textAnchor="middle"
        fontFamily="Space Grotesk, sans-serif"
        fontWeight="700"
        fontSize="19"
        fill="url(#rj-grad)"
      >
        RJ
      </text>
    </svg>
  );
}

/* ---------------- ImageSlot: renders image, or a styled placeholder --------
   🖼️ When `src` is null the slot renders a labeled placeholder so it's
   obvious in the UI what asset is missing and where to swap it in
   src/data/content.js. ------------------------------------------------- */
export function ImageSlot({ src, alt, label, className = "", accent = "violet" }) {
  const accents = {
    violet: "from-violet-500/25 via-fuchsia-500/15",
    cyan: "from-cyan-400/25 via-sky-500/15",
    emerald: "from-emerald-400/25 via-teal-500/15",
    amber: "from-amber-400/25 via-orange-500/15",
  };
  if (src) {
    return <img src={src} alt={alt} loading="lazy" className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br ${accents[accent] || accents.violet} to-transparent ${className}`}
    >
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-bright/40">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-4.5-4.5L7 20" />
      </svg>
      <span className="px-4 text-center text-xs tracking-wide text-bright/40">{label || alt} — screenshot coming soon</span>
    </div>
  );
}

/* ---------------- Tag chip ---------------- */
export function Chip({ children, className = "" }) {
  return (
    <span
      className={`inline-block rounded-full border border-line bg-white/[0.03] px-3 py-1 text-xs font-medium tracking-wide text-body ${className}`}
    >
      {children}
    </span>
  );
}
