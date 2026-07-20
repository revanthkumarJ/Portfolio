import content from "./content.js";
import qa from "./qa.js";

export default {
  id: "cancellation",
  title: "Cancellation",
  tagline:
    "Cooperative cancellation, making CPU loops cancellable, CancellationException (never swallow it), NonCancellable cleanup, timeouts, and scope cancellation.",
  tags: ["Coroutines", "Cancellation", "ensureActive", "withTimeout", "NonCancellable"],
  content,
  qa,
};
