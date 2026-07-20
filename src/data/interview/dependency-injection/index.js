import fundamentals from "./fundamentals/index.js";
import dagger from "./dagger/index.js";
import hilt from "./hilt/index.js";
import koinKmpTesting from "./koin-kmp-testing/index.js";

export default {
  id: "dependency-injection",
  name: "Dependency Injection",
  description:
    "Providing dependencies cleanly — DI fundamentals & dependency inversion, Dagger's compile-time model, Hilt for Android, and Koin/KMP DI & testing.",
  topics: [
    fundamentals,
    dagger,
    hilt,
    koinKmpTesting,
  ],
};
