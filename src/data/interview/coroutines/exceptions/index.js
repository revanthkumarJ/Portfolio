import content from "./content.js";
import qa from "./qa.js";

export default {
  id: "exceptions",
  title: "Exception Handling",
  tagline:
    "launch vs async exception behavior, try/catch placement, why child failures escape try/catch, CoroutineExceptionHandler, and errors-as-values.",
  tags: ["Coroutines", "Exceptions", "CoroutineExceptionHandler", "Result"],
  content,
  qa,
};
