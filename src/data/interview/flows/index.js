import basics from "./basics/index.js";
import operators from "./operators/index.js";
import stateflowSharedflow from "./stateflow-sharedflow/index.js";
import backpressure from "./backpressure/index.js";
import contextConversion from "./context-conversion/index.js";
import errorTesting from "./error-testing/index.js";

export default {
  id: "flows",
  name: "Kotlin Flows",
  description:
    "Asynchronous streams in Kotlin — cold vs hot, operators, StateFlow/SharedFlow, backpressure, threading & conversions, and error handling & testing.",
  topics: [
    basics,
    operators,
    stateflowSharedflow,
    backpressure,
    contextConversion,
    errorTesting,
  ],
};
