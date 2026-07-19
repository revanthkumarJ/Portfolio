import React, { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { findTopic } from "../../data/interview/index.js";
import { Blocks } from "./blocks.jsx";

const TABS = [
  { id: "content", label: "Content" },
  { id: "qa", label: "Interview Prep" },
];

const LEVELS = [
  { id: "all", label: "All" },
  { id: "junior", label: "Junior" },
  { id: "senior", label: "Senior" },
];

function LevelBadge({ level }) {
  const isSenior = level === "senior";
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
        isSenior
          ? "border-fuchsia/40 bg-fuchsia/10 text-fuchsia"
          : "border-emerald/40 bg-emerald/10 text-emerald"
      }`}
    >
      {level}
    </span>
  );
}

function QaItem({ item, isOpen, onToggle }) {
  return (
    <div className="glass overflow-hidden rounded-xl">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
      >
        <LevelBadge level={item.level} />
        <span className="flex-1 font-display text-sm font-semibold text-bright sm:text-[15px]">
          {item.q}
        </span>
        <span
          className={`text-violet transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>
      {isOpen && (
        <div className="border-t border-line px-5 py-5">
          <Blocks blocks={item.a} />
        </div>
      )}
    </div>
  );
}

function QaTab({ qa }) {
  const [level, setLevel] = useState("all");
  const [openSet, setOpenSet] = useState(() => new Set());

  const visible = useMemo(
    () =>
      qa
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => level === "all" || item.level === level),
    [qa, level]
  );

  function toggle(index) {
    setOpenSet((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLevel(l.id)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              level === l.id
                ? "border-violet/60 bg-violet/15 text-bright"
                : "border-line text-body hover:text-bright"
            }`}
          >
            {l.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-body/60">
          {visible.length} questions — click one to reveal the answer
        </span>
      </div>
      <div className="space-y-3">
        {visible.map(({ item, index }) => (
          <QaItem
            key={index}
            item={item}
            isOpen={openSet.has(index)}
            onToggle={() => toggle(index)}
          />
        ))}
      </div>
    </div>
  );
}

function ContentTab({ content }) {
  return (
    <div className="space-y-12">
      {content.map((section, i) => (
        <section key={i}>
          <h2 className="font-display mb-5 flex items-baseline gap-3 text-lg font-bold text-bright sm:text-xl">
            <span className="font-mono text-sm text-violet">
              {String(i + 1).padStart(2, "0")}
            </span>
            {section.heading}
          </h2>
          <Blocks blocks={section.blocks} />
        </section>
      ))}
    </div>
  );
}

export default function TopicPage() {
  const { categoryId, topicId } = useParams();
  const [tab, setTab] = useState("content");

  const found = findTopic(categoryId, topicId);
  if (!found) return <Navigate to="/interview_preparation" replace />;
  const { category, topic } = found;

  return (
    <div className="noise relative min-h-screen bg-ink text-body">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <Link
          to="/interview_preparation"
          className="text-sm text-body/70 transition-colors hover:text-bright"
        >
          ← All topics
        </Link>

        <header className="mt-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-violet">
            {category.name}
          </p>
          <h1 className="font-display mt-3 text-3xl font-bold text-bright sm:text-4xl">
            {topic.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed">{topic.tagline}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {topic.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-body/80"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <nav className="mt-10 flex gap-1 border-b border-line">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-5 py-3 font-display text-sm font-semibold transition-colors ${
                tab === t.id
                  ? "border-violet text-bright"
                  : "border-transparent text-body hover:text-bright"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-10">
          {tab === "content" ? (
            <ContentTab content={topic.content} />
          ) : (
            <QaTab qa={topic.qa} />
          )}
        </div>
      </div>
    </div>
  );
}
