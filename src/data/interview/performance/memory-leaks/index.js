import content from "./content.js";
import qa from "./qa.js";

export default {
  id: "memory-leaks",
  title: "Memory Leaks & Management",
  tagline:
    "What leaks are & why Activity leaks are worst, common leak patterns, how architecture prevents them, LeakCanary & the Memory Profiler, and reference types.",
  tags: ["Performance", "Memory Leaks", "LeakCanary", "GC", "WeakReference"],
  content,
  qa,
};
