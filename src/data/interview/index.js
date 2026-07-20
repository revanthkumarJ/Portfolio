import mvc from "./architecture/mvc/index.js";
import mvp from "./architecture/mvp/index.js";
import mvvm from "./architecture/mvvm/index.js";
import mvi from "./architecture/mvi/index.js";
import cleanArchitecture from "./architecture/clean-architecture/index.js";
import modularization from "./architecture/modularization/index.js";
import kotlin from "./kotlin/index.js";
import compose from "./compose/index.js";
import coroutines from "./coroutines/index.js";
import flows from "./flows/index.js";
import androidCore from "./android-core/index.js";
import dataStorage from "./data-storage/index.js";
import networking from "./networking/index.js";
import dependencyInjection from "./dependency-injection/index.js";
import backgroundWork from "./background-work/index.js";
import testing from "./testing/index.js";
import performance from "./performance/index.js";

// Registry for the interview-preparation section. The hub and topic routes
// render entirely from this — add categories/topics here, never in the JSX.
// See src/pages/interview/README.md for the schema and checklist.
export const categories = [
  kotlin,
  {
    id: "architecture",
    name: "Architecture",
    description:
      "App architecture patterns and how they play out on Android & KMP — the layer every interview starts with.",
    topics: [mvc, mvp, mvvm, mvi, cleanArchitecture, modularization],
  },
  androidCore,
  compose,
  coroutines,
  flows,
  dataStorage,
  networking,
  dependencyInjection,
  backgroundWork,
  testing,
  performance,
];

export function findTopic(categoryId, topicId) {
  const category = categories.find((c) => c.id === categoryId);
  const topic = category?.topics.find((t) => t.id === topicId);
  return category && topic ? { category, topic } : null;
}
