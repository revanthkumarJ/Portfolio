import content from "./content.js";
import qa from "./qa.js";

export default {
  id: "channels-sync",
  title: "Channels & Synchronization",
  tagline:
    "Channels vs Flows, capacity/buffering, produce/actor, shared mutable state, Mutex vs synchronized, Semaphore, and the select expression.",
  tags: ["Coroutines", "Channel", "Mutex", "Semaphore", "select"],
  content,
  qa,
};
