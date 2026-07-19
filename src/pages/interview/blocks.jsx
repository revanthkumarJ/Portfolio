import React from "react";

// Renders the inline mini-markdown used in interview data strings:
// `code` and **bold**. See src/pages/interview/README.md.
export function Inline({ text }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-bright">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-white/[0.07] px-1.5 py-0.5 font-mono text-[0.85em] text-cyan"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function CodeBlock({ title, code }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-ink-2">
      {title && (
        <figcaption className="border-b border-line px-4 py-2 font-mono text-xs text-violet">
          {title}
        </figcaption>
      )}
      <div className="overflow-x-auto">
        <pre className="p-4 font-mono text-[13px] leading-relaxed text-bright/90">
          <code>{code}</code>
        </pre>
      </div>
    </figure>
  );
}

function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-white/[0.03]">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold text-bright">
                <Inline text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line/60 last:border-0 align-top">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-body">
                  <Inline text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Renders an array of content blocks (p / h3 / list / code / table / note).
export function Blocks({ blocks }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        switch (block.t) {
          case "p":
            return (
              <p key={i} className="leading-relaxed text-body">
                <Inline text={block.text} />
              </p>
            );
          case "h3":
            return (
              <h4 key={i} className="font-display pt-2 text-base font-semibold text-bright">
                <Inline text={block.text} />
              </h4>
            );
          case "list":
            return (
              <ul key={i} className="space-y-2 pl-5">
                {block.items.map((item, j) => (
                  <li key={j} className="list-disc leading-relaxed text-body marker:text-violet">
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            );
          case "code":
            return <CodeBlock key={i} title={block.title} code={block.code} />;
          case "table":
            return <Table key={i} headers={block.headers} rows={block.rows} />;
          case "note":
            return (
              <div
                key={i}
                className="rounded-xl border border-violet/30 bg-violet/[0.07] px-4 py-3 text-sm leading-relaxed text-body"
              >
                <span className="mr-2 font-semibold text-violet">Interview tip</span>
                <Inline text={block.text} />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
