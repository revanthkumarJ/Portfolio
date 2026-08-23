import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { identity } from "../data/content.js";
import { FiDownload, FiX } from "react-icons/fi";

const PdfViewer = React.lazy(() => import("./PdfViewer.jsx"));

const ResumeCtx = createContext(() => {});

/** Call the returned function to open the resume dialog. */
export function useResume() {
  return useContext(ResumeCtx);
}

export function ResumeProvider({ children }) {
  const [open, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);

  // Close on Escape, lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <ResumeCtx.Provider value={show}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            data-lenis-prevent
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/85 p-2 backdrop-blur-sm sm:p-4 md:p-8"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.21, 0.65, 0.32, 0.99] }}
              className="flex h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-ink-2 shadow-[0_30px_120px_-20px_rgba(167,139,250,0.35)] sm:h-[88vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <span className="font-display font-bold text-bright">Resume — {identity.name}</span>
                <div className="flex items-center gap-2">
                  <a
                    href={identity.resume}
                    download="Revanth_Kumar_Jilakara_Resume.pdf"
                    className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-1.5 text-sm font-medium text-bright transition-colors hover:border-violet/60 hover:bg-violet/10"
                  >
                    <FiDownload size={15} /> Download
                  </a>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close resume"
                    className="rounded-full p-2 text-body transition-colors hover:bg-white/10 hover:text-bright"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>

              {/* PDF rendered via pdf.js — works on mobile, lazy-loaded */}
              <React.Suspense
                fallback={<div className="flex flex-1 items-center justify-center text-body">Loading resume…</div>}
              >
                <PdfViewer file={identity.resume} />
              </React.Suspense>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ResumeCtx.Provider>
  );
}
