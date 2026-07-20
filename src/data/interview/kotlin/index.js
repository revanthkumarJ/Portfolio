import nullSafetyTypes from "./null-safety-types/index.js";
import classes from "./classes/index.js";
import functionsLambdas from "./functions-lambdas/index.js";
import collectionsSequences from "./collections-sequences/index.js";
import generics from "./generics/index.js";
import delegation from "./delegation/index.js";

export default {
  id: "kotlin",
  name: "Kotlin Language",
  description:
    "The language itself — null safety & types, classes (data/sealed/value/object), functions & scope functions, collections & sequences, generics & variance, and delegation.",
  topics: [
    nullSafetyTypes,
    classes,
    functionsLambdas,
    collectionsSequences,
    generics,
    delegation,
  ],
};
