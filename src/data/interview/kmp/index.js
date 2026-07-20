import fundamentals from "./fundamentals/index.js";
import iosInterop from "./ios-interop/index.js";
import librariesCmp from "./libraries-cmp/index.js";

export default {
  id: "kmp",
  name: "Kotlin Multiplatform",
  description:
    "Sharing Kotlin across platforms — KMP fundamentals (source sets, expect/actual), iOS interop & SKIE, and the multiplatform library stack & Compose Multiplatform.",
  topics: [
    fundamentals,
    iosInterop,
    librariesCmp,
  ],
};
