import basics from "./basics/index.js";
import buildersScopes from "./builders-scopes/index.js";
import structuredConcurrency from "./structured-concurrency/index.js";
import dispatchers from "./dispatchers/index.js";
import cancellation from "./cancellation/index.js";
import exceptions from "./exceptions/index.js";
import channelsSync from "./channels-sync/index.js";

export default {
  id: "coroutines",
  name: "Coroutines",
  description:
    "Kotlin's concurrency framework — suspension internals, builders & scopes, structured concurrency, dispatchers, cancellation, exceptions, and channels.",
  topics: [
    basics,
    buildersScopes,
    structuredConcurrency,
    dispatchers,
    cancellation,
    exceptions,
    channelsSync,
  ],
};
