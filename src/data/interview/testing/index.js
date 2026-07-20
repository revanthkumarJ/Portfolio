import strategyPyramid from "./strategy-pyramid/index.js";
import unitTesting from "./unit-testing/index.js";
import coroutineFlowTesting from "./coroutine-flow-testing/index.js";
import androidComposeTesting from "./android-compose-testing/index.js";

export default {
  id: "testing",
  name: "Testing",
  description:
    "Verifying your app — the testing pyramid & strategy, unit testing with JUnit/fakes/mocks, coroutine & Flow testing, and Android/Compose testing.",
  topics: [
    strategyPyramid,
    unitTesting,
    coroutineFlowTesting,
    androidComposeTesting,
  ],
};
