import memoryLeaks from "./memory-leaks/index.js";
import anrJank from "./anr-jank/index.js";
import profilingStartup from "./profiling-startup/index.js";
import sizeBattery from "./size-battery/index.js";

export default {
  id: "performance",
  name: "Performance & Memory",
  description:
    "Making apps fast & efficient — memory leaks & LeakCanary, ANRs/jank/rendering, profiling & startup & baseline profiles, and app size & battery.",
  topics: [
    memoryLeaks,
    anrJank,
    profilingStartup,
    sizeBattery,
  ],
};
