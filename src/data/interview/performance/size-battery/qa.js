// App Size & Battery — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is R8 and what does it do?",
    a: [
      {
        t: "p",
        text: "**R8 is the build-time tool (replacing the older ProGuard) that shrinks and optimizes your code for release builds.** It does three things: *shrinking* (removing unused code and resources — 'tree shaking'), *obfuscation* (renaming classes and methods to short meaningless names), and *optimization* (inlining, dead-code elimination). The result is a significantly smaller APK and sometimes better runtime performance.",
      },
      {
        t: "list",
        items: [
          "**Shrinking** — R8 analyzes which code is actually reachable and removes the rest (unused methods, classes, and parts of libraries you barely use). This is where most of the size reduction comes from.",
          "**Obfuscation** — renames identifiers to short names (`a`, `b`), reducing size and slightly hindering reverse-engineering. You upload a *mapping file* to Play so crash reports can be translated back to real names.",
          "**Optimization** — inlining and dead-code removal that can also improve performance.",
        ],
      },
      {
        t: "code",
        title: "Enabling it",
        code: `release {
    isMinifyEnabled = true      // R8
    isShrinkResources = true    // drop unused resources
}`,
      },
      {
        t: "p",
        text: "The important gotcha: R8 uses *static analysis*, so code accessed *reflectively* (by name at runtime — some serialization, DI, JNI) can be wrongly removed or renamed, causing crashes. You add `-keep` rules to preserve such code. Because R8 runs only on release builds, missing keep rules cause *release-only crashes* that don't appear in debug — a classic source of 'works in debug, crashes in release' bugs. Libraries ship their own keep rules; you add rules for your own reflective code.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between an APK and an AAB?",
    a: [
      {
        t: "p",
        text: "**An APK is the installable app artifact a device runs; an AAB (Android App Bundle) is a *publishing format* you upload to Play — it's not directly installable. From the AAB, Google Play generates optimized, per-device APKs (split APKs) delivering only what each device needs.** Since 2021, new apps on Play must publish as AAB.",
      },
      {
        t: "list",
        items: [
          "**APK** — the traditional installable package. You still build and test with APKs during development, and it's what's ultimately installed on the device.",
          "**AAB** — a bundle of *all* your app's code and resources (for all densities, architectures, languages) that you upload to Play. Play uses it to generate tailored APKs per device.",
          "**The benefit — smaller downloads**: a universal APK includes resources for *every* screen density, native libraries for *every* CPU architecture, and *every* language — but a device uses only one of each. Play splits the AAB by density, architecture, and language, so each device downloads only what it needs — often 15-35% smaller than a universal APK.",
        ],
      },
      {
        t: "p",
        text: "So the mental model: AAB is what you *publish* (a superset Play optimizes from), APK is what gets *installed* (a device-specific subset Play generates). You develop/test with APKs and publish an AAB. One consequence is that AAB delivery requires *Play App Signing* — since Play generates and must sign the per-device APKs, it holds (or manages) your signing key. The AAB format is a significant download-size win at no code cost, which is why Google made it mandatory.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you reduce an Android app's size?",
    a: [
      {
        t: "list",
        items: [
          "**Enable R8** (`minifyEnabled`) — shrinks unused code via tree-shaking and obfuscates; the biggest code-size lever. Add `shrinkResources` to remove unused resources.",
          "**Publish as an AAB** — Play generates per-device split APKs (by density, architecture, language), so each device downloads only what it needs — much smaller than a universal APK, with no code changes.",
          "**Optimize images/resources** — use WebP instead of PNG/JPEG (smaller at similar quality), vector drawables instead of multiple PNG densities (one scalable asset vs many bitmaps), and remove unused resources.",
          "**Use Dynamic Feature Modules** — deliver rarely-used features on demand instead of at install, keeping the initial download small.",
          "**Trim dependencies** — a heavy library used for one small thing bloats the app; prefer lighter alternatives or R8 shrinking, and avoid pulling in large SDKs you barely use.",
          "**Reduce native libraries** — `.so` files are large and per-architecture; the AAB splits them, and you include only needed ABIs.",
        ],
      },
      {
        t: "p",
        text: "The approach mirrors performance work — *measure first*: use the **APK Analyzer** in Android Studio to break down what's actually taking space (code, resources, native libs, assets), then target the biggest contributors. Guessing wastes effort; a heavy dependency or uncompressed assets are often the real culprits, and the analyzer shows you. The two highest-leverage, low-effort wins are usually enabling R8 (`minifyEnabled = true` + `shrinkResources`) and publishing as an AAB — both give substantial size reductions with minimal work. From there, resource optimization (WebP/vectors) and on-demand delivery (dynamic features) address specific large contributors.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the main causes of battery drain and how do you reduce it?",
    a: [
      {
        t: "p",
        text: "**Battery is consumed by CPU work (computation, device wakeups), radio use (network, GPS), and keeping the device or screen awake. The strategy to reduce drain is to *do less, less often, and batch it* — which happens to align with the OS's own battery-protection mechanisms.**",
      },
      {
        t: "list",
        items: [
          "**Minimize wakeups and background work** — waking the device from sleep is expensive. Use WorkManager (which batches work into maintenance windows respecting Doze) instead of frequent alarms/polling; avoid wakelocks.",
          "**Batch network requests** — the cellular radio stays powered for a while after each request ('tail energy'), so many small spread-out requests keep it on far more than a few batched ones. Batch/defer non-urgent network work.",
          "**Prefer push over polling** — polling wastes battery (constant wakeups + radio); FCM push notifies the app only when there's genuinely something, far more efficient.",
          "**Use location sparingly** — GPS is a major drain. Request the lowest accuracy and frequency that works, and stop updates when not needed.",
        ],
      },
      {
        t: "p",
        text: "The overarching principle is to *respect the OS's battery mechanisms* (Doze, App Standby, background limits) rather than fight them — they exist to save battery, and working with them (deferrable work via WorkManager, push over polling, location constraints) is both the correct approach and what Play policies require. Fighting them (wakelocks, exact alarms for polling, requesting battery-optimization exemptions) is fragile, user-hostile, and increasingly restricted. And as always, *measure* — the Energy Profiler (or Battery Historian / `dumpsys batterystats`) shows what's actually draining battery, so you target the real culprit (often location or excessive network/wakeups) rather than guessing. Battery drain is a top uninstall reason, so it's a real quality concern.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why does the App Bundle produce smaller downloads than a universal APK, and what does Play do behind the scenes?",
    a: [
      {
        t: "p",
        text: "**A universal APK must contain resources and code for *every* device it might run on — all screen densities, all CPU architectures, and all languages — because it's a single artifact that any device could install. But any *given* device uses only one density, one architecture, and a few languages, so a universal APK forces every device to download large amounts of resources it can never use. The App Bundle lets Play generate *device-specific* APKs that include only what each device needs.**",
      },
      {
        t: "list",
        items: [
          "**The three main split dimensions**: (1) *Density* — Android ships drawables at multiple densities (mdpi, hdpi, xhdpi, xxhdpi…) so images look sharp on any screen; a device needs only *its* density's assets, but a universal APK includes *all* of them. (2) *ABI (architecture)* — native libraries (`.so` files, from NDK code or dependencies with native components) are compiled per-CPU-architecture (arm64-v8a, armeabi-v7a, x86_64); a device runs one architecture, but a universal APK bundles all of them, and native libs are often large. (3) *Language* — string resources for every supported language; a device typically uses one or two.",
          "**What Play does behind the scenes**: you upload the AAB (containing everything), and Play's server-side build system generates a set of **split APKs** from it — a *base* APK plus *configuration* APKs for each density, ABI, and language. When a specific device installs your app, Play delivers only the base plus the config splits matching *that device* (its density, its architecture, its languages). The device assembles these into the running app. The user's download is dramatically smaller because it excludes all the other densities, architectures, and languages.",
          "**The magnitude**: the savings are largest for apps with many densities of images and native libraries (games, apps with heavy native SDKs) — often 15-35% smaller downloads, sometimes more. For an app with big native libs across four architectures, dropping to one architecture alone is a huge reduction.",
          "**Play App Signing is required because of this**: since Play *generates and must sign* the per-device APKs (they didn't exist when you built the bundle), Play needs your app-signing key. You enroll in Play App Signing — Play holds the app-signing key and signs each generated APK; you keep an *upload key* to authenticate your uploads. This is why AAB and Play App Signing go together.",
        ],
      },
      {
        t: "list",
        items: [
          "**Additional AAB-enabled features**: because Play now generates delivery from a bundle, it also enables *Dynamic Feature Modules* (on-demand delivery of features), *asset packs* (large assets delivered separately, useful for games), and conditional/instant delivery — all of which further reduce initial install size by not shipping everything up front.",
          "**Testing implication**: since the device-specific APKs are generated by Play (not by you), testing the *actual* delivered artifacts requires tools like `bundletool` (to generate device-specific APKs locally from your AAB) or Play's internal testing track — you can't just install the AAB directly.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the AAB works by *deferring the final packaging decision to Play*, which has the information you lack at build time — the *specific device* installing the app. You ship a superset (the bundle); Play carves out the exact subset each device needs (base + matching density/ABI/language splits). This eliminates the fundamental waste of the universal APK (shipping resources for devices other than the one installing), yielding much smaller downloads for free, plus enabling on-demand delivery. The trade-offs are that Play must sign the generated APKs (hence Play App Signing) and that testing the real artifacts needs `bundletool`/internal tracks. Understanding *why* the split works (per-device resources the universal APK duplicated), *what Play does* (server-side split-APK generation and signing), and the *ecosystem implications* (Play App Signing, dynamic delivery, testing) is the complete answer.",
      },
    ],
  },
  {
    level: "senior",
    q: "A user reports your app drains their battery. How would you investigate and address it?",
    a: [
      {
        t: "p",
        text: "**I'd measure to identify the actual drain source (Energy Profiler, Battery Historian, Android Vitals) — since battery drain has several possible causes (excessive wakeups, network, location, CPU) and intuition is unreliable — then address the specific culprit, aligning with the OS's battery mechanisms.** The measurement-first approach is essential because 'drains battery' is a symptom with many possible causes.",
      },
      {
        t: "list",
        items: [
          "**1. Confirm and scope with production data**: check **Android Vitals** in the Play Console — it reports excessive wakeups, wakelocks, and battery-related metrics across real users, telling you *whether* it's a widespread problem and on which devices/versions. This distinguishes one user's device issue from a real app problem.",
          "**2. Measure locally to find the source**: use the **Energy Profiler** (shows CPU, network, and location/GPS energy over time) and, for deeper analysis, **Battery Historian** (visualizes `dumpsys batterystats` — wakelocks, wakeups, jobs, network, GPS usage attributed to your app). These reveal *what specifically* is draining battery — the app is doing too many wakeups, or holding a wakelock, or using GPS continuously, or making constant network requests.",
          "**3. Diagnose against the common culprits**: (a) *Excessive wakeups/background work* — an alarm or job firing too often, waking the device repeatedly (each wakeup is expensive). (b) *Wakelocks held too long* — code keeping the CPU awake unnecessarily. (c) *Location/GPS* — requesting high-accuracy location too frequently or not stopping updates (a major drain). (d) *Network* — frequent, unbatched requests keeping the radio powered (tail energy), or polling instead of push. (e) *Runaway CPU* — a background loop or inefficient work spinning the CPU.",
          "**4. Fix the specific cause**: for excessive background work → move to WorkManager (batches into maintenance windows, respects Doze) and reduce frequency; for polling → switch to FCM push (notify only when there's something); for location → lower accuracy/frequency, use `FusedLocationProvider` with appropriate priority, stop updates when not needed; for network → batch and defer non-urgent requests with WorkManager constraints; for wakelocks → hold them minimally or eliminate them; for CPU → optimize or move the work.",
          "**5. Respect (don't fight) the OS mechanisms**: the fixes align with Doze/App Standby/background limits — deferrable work, push over polling, constrained/batched network. If the instinct is to request a battery-optimization *exemption* to keep doing heavy background work, that's usually the wrong answer (fragile, user-hostile, Play-policy-restricted) — the right answer is to *reduce* the work, not exempt it.",
          "**6. Verify**: remeasure with the Energy Profiler after the fix, and monitor Android Vitals over the next release to confirm real-user battery metrics improved.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: battery investigation is a *measurement-driven, source-identification* problem — 'drains battery' is a symptom, and the job is to find *which* resource (CPU/wakeups, radio/network, GPS/location, wakelocks) is being overused, using Vitals (scope) and the Energy Profiler / Battery Historian (cause). Once identified, the fixes are consistent — do less, less often, batched, and via the OS-friendly mechanisms (WorkManager, push, location constraints) rather than fighting them. The key insight is that battery drain almost always traces to *excessive wakeups, unbatched network, or aggressive location*, and that the solution is to *reduce and batch* work in alignment with Doze/background limits — not to seek exemptions. Naming the measurement tools, the specific culprits, the aligned fixes, and the 'work with the OS, don't fight it' principle is the comprehensive answer that connects diagnosis to Android's battery model.",
      },
    ],
  },
];

export default qa;
