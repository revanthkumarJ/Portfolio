import fundamentals from "./fundamentals/index.js";
import state from "./state/index.js";
import modifiersLayout from "./modifiers-layout/index.js";
import lazyLists from "./lazy-lists/index.js";
import sideEffects from "./side-effects/index.js";
import performanceStability from "./performance-stability/index.js";
import themingAnimation from "./theming-animation/index.js";
import navigationInteropTesting from "./navigation-interop-testing/index.js";

export default {
  id: "compose",
  name: "Jetpack Compose (UI)",
  description:
    "Android's declarative UI toolkit — from what recomposition really is, through state, layout, lists, effects and performance, to theming, navigation and testing.",
  topics: [
    fundamentals,
    state,
    modifiersLayout,
    lazyLists,
    sideEffects,
    performanceStability,
    themingAnimation,
    navigationInteropTesting,
  ],
};
