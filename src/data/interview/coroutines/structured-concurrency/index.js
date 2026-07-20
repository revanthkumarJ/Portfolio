import content from "./content.js";
import qa from "./qa.js";

export default {
  id: "structured-concurrency",
  title: "Structured Concurrency & Jobs",
  tagline:
    "The parent-child Job tree, Job lifecycle & control, how failure propagates, SupervisorJob for isolation, and cancellation vs failure.",
  tags: ["Coroutines", "Job", "SupervisorJob", "Structured Concurrency"],
  content,
  qa,
};
