import content from "./content.js";
import qa from "./qa.js";

export default {
  id: "backpressure",
  title: "Buffering, Conflation & Backpressure",
  tagline:
    "How Flow handles backpressure via suspension, buffer() for throughput, conflate() for latest-wins, collectLatest vs conflate, and choosing a strategy.",
  tags: ["Flow", "Backpressure", "buffer", "conflate", "collectLatest"],
  content,
  qa,
};
