import gradleBuild from "./gradle-build/index.js";
import signingShrinking from "./signing-shrinking/index.js";
import aabPlaySigning from "./aab-play-signing/index.js";
import playConsole from "./play-console/index.js";

export default {
  id: "distribution",
  name: "Build, Distribution & Play Store",
  description:
    "Shipping the app — Gradle & the build system, signing/R8/versioning, AAB/APK & Play App Signing, and the Play Console (tracks, rollouts, in-app updates).",
  topics: [
    gradleBuild,
    signingShrinking,
    aabPlaySigning,
    playConsole,
  ],
};
