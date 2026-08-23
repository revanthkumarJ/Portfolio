import React, { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// pdf.js worker bundled by Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/** Renders every page of a PDF as canvas, sized to the container width.
    Works on mobile browsers where <iframe> PDF embeds fail. */
export default function PdfViewer({ file }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-lenis-prevent
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#141220] p-2 md:p-4"
    >
      <Document
        file={file}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<div className="p-10 text-center text-body">Loading resume…</div>}
        error={<div className="p-10 text-center text-body">Couldn't render the PDF — use the Download button above.</div>}
      >
        {Array.from({ length: numPages }, (_, i) => (
          <Page
            key={i}
            pageNumber={i + 1}
            width={Math.min(Math.max(width - 16, 280), 900)}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="mx-auto mb-3 w-fit overflow-hidden rounded-lg shadow-lg"
          />
        ))}
      </Document>
    </div>
  );
}
