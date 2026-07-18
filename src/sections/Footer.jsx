import React from "react";
import { Monogram } from "../ui/primitives.jsx";
import { identity } from "../data/content.js";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="flex w-full flex-wrap items-center justify-between gap-4 px-5 py-8 md:px-10 xl:px-16">
        <div className="flex items-center gap-3">
          <Monogram size={30} />
          <span className="text-sm text-body">
            Designed &amp; built by <span className="font-medium text-bright">{identity.name}</span>
          </span>
        </div>
        <span className="text-xs text-body/60">
          © {new Date().getFullYear()} · Kotlin at heart, React when it counts.
        </span>
      </div>
    </footer>
  );
}
