import React from "react";
import { Link } from "react-router-dom";
import { categories } from "../../data/interview/index.js";

export default function InterviewHome() {
  return (
    <div className="noise relative min-h-screen bg-ink text-body">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <Link
          to="/"
          className="text-sm text-body/70 transition-colors hover:text-bright"
        >
          ← Back to portfolio
        </Link>

        <header className="mt-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-violet">
            Interview Preparation
          </p>
          <h1 className="font-display mt-4 text-3xl font-bold text-bright sm:text-5xl">
            Android & KMP <span className="text-gradient">Interview Prep</span>
          </h1>
          <p className="mt-5 max-w-2xl leading-relaxed">
            This page is dedicated to all information regarding preparing for
            Android and KMP developer interviews. Pick a category below, then a
            topic — each topic page has a <strong className="text-bright">Content</strong>{" "}
            tab to learn from and an{" "}
            <strong className="text-bright">Interview Prep</strong> tab with
            questions whose answers stay hidden until you reveal them.
          </p>
        </header>

        <div className="mt-14 space-y-10">
          {categories.map((category) => (
            <section key={category.id} className="glass rounded-2xl p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold text-bright">
                {category.name}
              </h2>
              <p className="mt-2 text-sm leading-relaxed">{category.description}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {category.topics.map((topic) => (
                  <Link
                    key={topic.id}
                    to={`/interview_preparation/${category.id}/${topic.id}`}
                    className="glow-card rounded-xl border border-line bg-white/[0.04] px-5 py-3 font-display text-sm font-semibold text-bright transition-colors hover:text-violet"
                  >
                    {topic.title} →
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-14 text-xs text-body/50">
          More categories and topics are added over time.
        </p>
      </div>
    </div>
  );
}
