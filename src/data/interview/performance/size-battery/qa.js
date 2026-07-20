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
  {
    level: "junior",
    q: "What is the difference between R8, ProGuard, and D8?",
    a: [
      {
        t: "p",
        text: "*D8* is the *dexer* — it turns Java/Kotlin bytecode into Android's dex format. *R8* is the *shrinker/optimizer* that (in release builds) also does the dexing — it removes unused code (tree-shaking), optimizes, inlines, and obfuscates (renames) in one step. *ProGuard* was the older, separate shrinker/obfuscator that R8 replaced (R8 is faster and reuses ProGuard's rule format). Today you use R8 (with ProGuard-syntax `keep` rules); D8 handles debug dexing.",
      },
      {
        t: "list",
        items: [
          "**D8** — the dexer (bytecode → dex).",
          "**R8** — shrink + optimize + obfuscate + dex (release).",
          "**ProGuard** — older separate shrinker R8 replaced.",
          "**Rules** — R8 reuses ProGuard `keep` syntax.",
        ],
      },
      {
        t: "note",
        text: "D8 = dexer (bytecode → dex). R8 = release shrinker/optimizer that also dexes — tree-shakes unused code, optimizes, inlines, obfuscates in one step. ProGuard = the older separate tool R8 replaced (R8 reuses its keep-rule syntax). Today: R8 for release, D8 for debug dexing.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does resource shrinking work, and how is it different from code shrinking?",
    a: [
      {
        t: "p",
        text: "*Code shrinking* (R8) removes unused *classes/methods*. *Resource shrinking* (`shrinkResources true`, requires code shrinking on) removes unused *resources* (drawables, layouts, strings) not referenced by the kept code. It's important because resources can dominate APK size. Caveat: resources referenced *dynamically* (by name via `getIdentifier`) look unused and may be stripped — protect them with a `keep.xml` or `tools:keep`. Enable both together for the smallest build.",
      },
      {
        t: "list",
        items: [
          "**Code shrinking** — removes unused classes/methods (R8).",
          "**Resource shrinking** — removes unused resources (needs code shrinking).",
          "**Dynamic refs** — `getIdentifier` resources look unused; may strip.",
          "**Protect** — `keep.xml` / `tools:keep`.",
        ],
      },
      {
        t: "note",
        text: "Code shrinking (R8) removes unused classes/methods; resource shrinking (shrinkResources, needs code shrinking on) removes unused resources (drawables/layouts/strings). Caveat: dynamically referenced resources (getIdentifier) look unused and may be stripped — protect with keep.xml/tools:keep. Enable both for the smallest build.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are dynamic feature modules and how do they reduce size?",
    a: [
      {
        t: "p",
        text: "*Dynamic feature modules* let you ship parts of the app that are *downloaded on demand* (via Play Feature Delivery) rather than in the base install — so the initial download is smaller. Use them for rarely-used or large features (an onboarding flow, a heavy editor). They can be *install-time*, *on-demand* (requested via `SplitInstallManager`), or *conditional*. The trade-off is complexity (handling the download, availability) — worth it for genuinely large optional features.",
      },
      {
        t: "list",
        items: [
          "**Downloaded on demand** — not in the base install.",
          "**Smaller initial download** — for large/rare features.",
          "**Delivery** — install-time, on-demand (`SplitInstallManager`), conditional.",
          "**Trade-off** — complexity handling download/availability.",
        ],
      },
      {
        t: "note",
        text: "Dynamic feature modules ship features downloaded on demand (Play Feature Delivery) instead of in the base install — smaller initial download. Modes: install-time, on-demand (SplitInstallManager), conditional. Use for large/rare features (onboarding, heavy editor). Trade-off: complexity of handling download/availability.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you analyze what's taking up space in your APK/AAB?",
    a: [
      {
        t: "p",
        text: "Use Android Studio's *APK Analyzer* (Build → Analyze APK, or on an AAB) to see a size breakdown by component: dex (code), resources, assets, native libs, and per-file sizes — comparing raw vs download size. This shows the biggest contributors (often images/assets or a large native lib) so you optimize the right thing. For AABs, also inspect generated *split APKs* (via bundletool) to see per-device download size. Measure before cutting.",
      },
      {
        t: "list",
        items: [
          "**APK Analyzer** — breakdown: dex, resources, assets, native libs.",
          "**Raw vs download size** — per component/file.",
          "**bundletool** — inspect per-device split APK sizes.",
          "**Measure first** — target the biggest contributors.",
        ],
      },
      {
        t: "note",
        text: "Analyze size with the APK Analyzer (Build → Analyze APK/AAB) — breakdown by dex, resources, assets, native libs, per-file, raw vs download. Shows the biggest contributors (often images/assets or a native lib) to optimize the right thing. Use bundletool to inspect per-device split APK sizes. Measure before cutting.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do image formats (WebP, vectors) affect app size?",
    a: [
      {
        t: "p",
        text: "Images often dominate app size. Prefer *vector drawables* for icons/simple graphics (one small, resolution-independent file instead of multiple PNG densities). For photos/complex images, *WebP* is significantly smaller than PNG/JPEG at similar quality (Android Studio can convert). Avoid shipping multiple density-specific bitmaps when a vector works, and remove unused images. These format choices typically yield the biggest easy size wins.",
      },
      {
        t: "list",
        items: [
          "**Vector drawables** — icons/simple graphics; one small file, any density.",
          "**WebP** — smaller than PNG/JPEG for photos (convertible).",
          "**Avoid** — multiple density bitmaps where a vector works.",
          "**Biggest easy wins** — images usually dominate size.",
        ],
      },
      {
        t: "note",
        text: "Images usually dominate app size. Use vector drawables for icons/simple graphics (one small resolution-independent file vs multiple PNG densities) and WebP for photos (smaller than PNG/JPEG at similar quality, Android Studio converts). Remove unused images. Format choices give the biggest easy size wins.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do native libraries (.so) affect size, and how do you manage them?",
    a: [
      {
        t: "p",
        text: "Native libraries (`.so` files, per ABI: arm64-v8a, armeabi-v7a, x86_64) can be large and multiply across ABIs. With the *App Bundle*, Play delivers only the *device's ABI*, cutting download size automatically. Additionally, `useLegacyPackaging false` (uncompressed native libs) enables the OS to load them without extraction (smaller on-device footprint). Remove unused ABIs/libs, and check the APK Analyzer for oversized `.so` files from dependencies you may not need.",
      },
      {
        t: "list",
        items: [
          "**Per-ABI `.so`** — large, multiplied across architectures.",
          "**App Bundle** — Play delivers only the device's ABI.",
          "**`useLegacyPackaging false`** — uncompressed, no extraction.",
          "**Audit** — remove unused ABIs/libs (APK Analyzer).",
        ],
      },
      {
        t: "note",
        text: "Native libs (.so per ABI: arm64-v8a, armeabi-v7a, x86_64) are large and multiply across ABIs. The App Bundle delivers only the device's ABI (smaller download). useLegacyPackaging false (uncompressed) lets the OS load without extraction. Remove unused ABIs/libs; check the APK Analyzer for oversized dependency .so files.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a wakelock, and how does it drain battery?",
    a: [
      {
        t: "p",
        text: "A *wakelock* keeps the device (CPU or screen) *awake* even when it would otherwise sleep. Holding one too long — or forgetting to release it — keeps the CPU running and drains the battery fast. Modern Android discourages manual `PowerManager` wakelocks; prefer higher-level APIs (`WorkManager`, foreground services) that manage wake state for you. If you must hold one, keep it as brief as possible and always release it (use timeouts). Battery Historian shows problematic wakelocks.",
      },
      {
        t: "list",
        items: [
          "**Wakelock** — keeps CPU/screen awake past sleep.",
          "**Drain** — held too long / not released → CPU stays on.",
          "**Prefer** — WorkManager/foreground services over manual locks.",
          "**If needed** — brief, with timeout, always release.",
        ],
      },
      {
        t: "note",
        text: "A wakelock keeps the CPU/screen awake past when the device would sleep — held too long or unreleased, it drains battery fast. Prefer WorkManager/foreground services (they manage wake state) over manual PowerManager locks. If you must hold one: keep it brief, use a timeout, always release. Battery Historian flags bad wakelocks.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Doze mode and App Standby save battery?",
    a: [
      {
        t: "p",
        text: "*Doze* activates when the device is idle (screen off, still, unplugged): the system batches deferred work into periodic *maintenance windows* and restricts network access, wakelocks, and alarms in between — dramatically cutting background drain. *App Standby* restricts apps the user hasn't touched recently (limiting their background/network). To play well: use `WorkManager` (Doze-aware), avoid exact alarms except when truly needed, and don't fight Doze. High-priority FCM can wake the app for urgent messages.",
      },
      {
        t: "list",
        items: [
          "**Doze** — idle device: batches work into maintenance windows.",
          "**Restricts** — network, wakelocks, alarms between windows.",
          "**App Standby** — limits rarely-used apps' background.",
          "**Play well** — WorkManager, avoid exact alarms, high-priority FCM for urgent.",
        ],
      },
      {
        t: "note",
        text: "Doze (idle: screen off, still, unplugged) batches deferred work into periodic maintenance windows and restricts network/wakelocks/alarms between them — cutting background drain. App Standby limits rarely-used apps. Play well: WorkManager (Doze-aware), avoid exact alarms, high-priority FCM for urgent wake-ups. Don't fight Doze.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does network activity affect battery, and how do you minimize it?",
    a: [
      {
        t: "p",
        text: "The cellular radio is a major battery consumer: each transmission wakes the radio into a high-power state that stays on for seconds after (the *radio tail*), so *frequent small requests* are far worse than *batched* ones. Minimize drain by *batching* network calls, deferring non-urgent work to when on Wi-Fi/charging (WorkManager constraints), using efficient formats and caching (avoid redundant fetches), and preferring server push (FCM) over polling. Chatty background networking is a top battery offender.",
      },
      {
        t: "list",
        items: [
          "**Radio tail** — each transmission keeps the radio high-power for seconds.",
          "**Batch** — frequent small requests are worse than batched.",
          "**Defer** — WorkManager constraints (Wi-Fi/charging).",
          "**Push over polling** — FCM; cache to avoid redundant fetches.",
        ],
      },
      {
        t: "note",
        text: "The cellular radio is a big battery drain — each transmission keeps it high-power for seconds (the radio tail), so frequent small requests are worse than batched ones. Minimize: batch calls, defer non-urgent work (WorkManager Wi-Fi/charging constraints), cache to avoid redundant fetches, prefer FCM push over polling. Chatty background networking is a top offender.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does location tracking affect battery, and how do you optimize it?",
    a: [
      {
        t: "p",
        text: "Continuous high-accuracy GPS is one of the heaviest battery drains. Optimize by requesting the *lowest accuracy* and *longest interval* that meets your need (`Priority.BALANCED_POWER_ACCURACY` over `HIGH_ACCURACY`), using *batched*/passive updates, *geofencing* or the *Fused Location Provider* (which fuses sensors efficiently), and *stopping* updates when not needed (in the background/when the screen is off). Never poll GPS continuously in the background; use the coarsest source that works.",
      },
      {
        t: "list",
        items: [
          "**GPS high-accuracy** — heavy drain.",
          "**Lowest accuracy + longest interval** — that still meets the need.",
          "**Fused Location / geofencing** — efficient, sensor-fused.",
          "**Stop when idle** — don't poll GPS in the background.",
        ],
      },
      {
        t: "note",
        text: "Continuous high-accuracy GPS is one of the heaviest drains. Optimize: lowest accuracy + longest interval that works (BALANCED_POWER over HIGH_ACCURACY), Fused Location Provider (efficient sensor fusion), geofencing, batched/passive updates, and stop updates when not needed (background/screen off). Never poll GPS continuously in the background.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between installed size and download size?",
    a: [
      {
        t: "p",
        text: "*Download size* is what the user downloads from Play (compressed, and with App Bundle, only their device's config splits). *Installed size* is what the app occupies on the device after extraction (larger — uncompressed code/resources plus generated ART files, caches, and data). Play shows download size to users. When optimizing, know which you're targeting: download size affects install conversion; installed size affects device storage pressure. The APK Analyzer shows both.",
      },
      {
        t: "list",
        items: [
          "**Download size** — compressed, device-specific splits (Play shows this).",
          "**Installed size** — extracted on device (larger; + ART/caches/data).",
          "**Download** — affects install conversion.",
          "**Installed** — affects device storage.",
        ],
      },
      {
        t: "note",
        text: "Download size = what the user downloads (compressed, device-specific splits with App Bundle; Play shows this). Installed size = space on device after extraction (larger — uncompressed + ART files/caches/data). Download size affects install conversion; installed size affects storage pressure. APK Analyzer shows both.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you reduce the number of dependencies' impact on size?",
    a: [
      {
        t: "p",
        text: "Each library adds code (and sometimes resources/native libs) — audit them: remove unused ones, avoid pulling a huge library for one function, prefer smaller/modular alternatives, and ensure R8 can tree-shake them (some libraries with heavy reflection resist shrinking). Check the APK Analyzer / dependency size, and watch transitive dependencies. A single heavy dependency (or duplicate versions) can bloat the app significantly.",
      },
      {
        t: "list",
        items: [
          "**Audit** — remove unused; don't pull a huge lib for one function.",
          "**Prefer** — smaller/modular alternatives.",
          "**R8 tree-shaking** — reflection-heavy libs resist it.",
          "**Watch** — transitive deps, duplicate versions.",
        ],
      },
      {
        t: "note",
        text: "Each dependency adds code (sometimes resources/native libs). Audit: remove unused, don't pull a huge library for one function, prefer smaller/modular alternatives, ensure R8 can tree-shake (reflection-heavy libs resist it). Check APK Analyzer and transitive deps; a single heavy or duplicated dependency bloats the app.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between deferring work and doing it eagerly, for battery?",
    a: [
      {
        t: "p",
        text: "Doing background work *eagerly* (immediately, individually) wakes the device/radio repeatedly and fights Doze. *Deferring* it — batching with `WorkManager` and constraints (network, charging, idle) — lets the system run it during favorable windows (batched with other apps' work, when charging or on Wi-Fi), dramatically reducing battery cost. The principle: for anything not user-facing-urgent, *defer and batch* rather than run now. Only truly time-critical work (a live call, a user-initiated sync) should be immediate.",
      },
      {
        t: "list",
        items: [
          "**Eager** — immediate/individual; repeated wakeups, fights Doze.",
          "**Deferred** — WorkManager + constraints; runs in favorable windows.",
          "**Batching** — with other work / charging / Wi-Fi saves battery.",
          "**Immediate only** — truly time-critical work.",
        ],
      },
      {
        t: "note",
        text: "Eager background work (immediate, individual) wakes the device/radio repeatedly and fights Doze. Deferring — batching via WorkManager with constraints (network/charging/idle) — runs it in favorable windows, cutting battery cost. Principle: defer and batch anything not user-urgent; reserve immediate execution for truly time-critical work.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you measure and diagnose battery drain?",
    a: [
      {
        t: "p",
        text: "Use *Battery Historian* — analyze a `bugreport` to see wakelocks, jobs, alarms, network, and CPU over time and pinpoint what your app did while the screen was off. The *Energy Profiler* (Android Studio, supported devices) gives a live rough view. On-device, Settings → Battery usage shows per-app drain. In production, Play Console's *excessive background wakelock/wakeups* vitals flag battery issues. Look for background activity when the device should be idle.",
      },
      {
        t: "list",
        items: [
          "**Battery Historian** — bugreport analysis: wakelocks, jobs, alarms, network.",
          "**Energy Profiler** — live rough view.",
          "**Settings → Battery** — per-app drain on device.",
          "**Play vitals** — excessive wakelock/wakeup flags.",
        ],
      },
      {
        t: "note",
        text: "Diagnose battery drain with Battery Historian (analyze a bugreport — wakelocks, jobs, alarms, network, CPU over time, especially screen-off), the Energy Profiler (live rough view), Settings → Battery (per-app), and Play vitals (excessive wakelock/wakeup flags). Look for background activity when the device should be idle.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is language/density/ABI splitting in the App Bundle?",
    a: [
      {
        t: "p",
        text: "The App Bundle lets Play generate *configuration splits* so each device downloads only the resources it needs: its *language* (not all translations), its *screen density* (not all drawable buckets), and its *ABI* (not all native libs). This can cut download size substantially versus a universal APK that includes everything. It's automatic with the AAB — you upload one bundle, Play builds and serves optimized splits per device (Play App Signing enables this).",
      },
      {
        t: "list",
        items: [
          "**Config splits** — language, density, ABI per device.",
          "**Only needed resources** — not all languages/densities/ABIs.",
          "**Automatic** — with the AAB; Play generates splits.",
          "**vs universal APK** — substantial download savings.",
        ],
      },
      {
        t: "note",
        text: "The App Bundle lets Play generate configuration splits so each device downloads only its language, screen density, and ABI — not all of them. This cuts download size vs a universal APK that bundles everything. Automatic with the AAB: upload one bundle, Play serves optimized per-device splits (via Play App Signing).",
      },
    ],
  },
  {
    level: "senior",
    q: "How does JobScheduler/WorkManager batching help battery at the system level?",
    a: [
      {
        t: "p",
        text: "`WorkManager` (backed by `JobScheduler`) lets the *system* decide *when* to run deferrable jobs — it can *batch* jobs from many apps to run together during a maintenance window or when the device is charging/on Wi-Fi, so the device wakes fewer times overall. Compared to each app scheduling exact alarms and waking independently, this coalescing dramatically reduces total wakeups and radio use across the device — a system-wide battery win that also benefits your app's reputation in vitals.",
      },
      {
        t: "list",
        items: [
          "**System decides when** — deferrable jobs via JobScheduler.",
          "**Batches across apps** — run together in a window/while charging.",
          "**Fewer wakeups** — vs each app's independent exact alarms.",
          "**System-wide battery win** — and better vitals.",
        ],
      },
      {
        t: "note",
        text: "WorkManager (via JobScheduler) lets the system choose when to run deferrable jobs — batching jobs across apps into maintenance windows or charging/Wi-Fi periods, so the device wakes fewer times. Versus each app's independent exact alarms, this coalescing cuts total wakeups/radio use device-wide — a battery win that also helps your vitals.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the multidex problem and how is it handled today?",
    a: [
      {
        t: "p",
        text: "A single dex file can hold ~65,536 methods (the '64K method limit'). Apps exceeding it need *multidex* (multiple dex files). On modern Android (API 21+, ART), multidex is *natively supported* — no special handling needed. Only very old (pre-21) devices required the multidex support library and a slower startup. Today the practical concern isn't multidex itself but keeping method count (and thus size/startup) down via R8 shrinking.",
      },
      {
        t: "list",
        items: [
          "**64K method limit** — per single dex file.",
          "**Multidex** — multiple dex files when exceeded.",
          "**API 21+ (ART)** — natively supported, no special handling.",
          "**Today** — keep method count down via R8 shrinking.",
        ],
      },
      {
        t: "note",
        text: "A single dex holds ~65,536 methods (the 64K limit); exceeding it needs multidex (multiple dex files). API 21+/ART supports multidex natively (no special handling); only pre-21 needed the support library + slower startup. Today the real concern is keeping method count/size down via R8, not multidex itself.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you reduce battery use from sensors and background services?",
    a: [
      {
        t: "p",
        text: "Sensors (accelerometer, gyroscope) and long-running services keep the CPU awake and drain power. Register sensor listeners at the *lowest sampling rate* that works and *unregister* them when not needed (e.g. in `onPause`). Avoid persistent background services; use `WorkManager` for deferrable work and *foreground services only for genuinely ongoing user-visible tasks* (with the smallest footprint). The principle: do the minimum, at the lowest frequency, and stop as soon as you can.",
      },
      {
        t: "list",
        items: [
          "**Sensors** — lowest sampling rate; unregister in `onPause`.",
          "**Avoid** — persistent background services.",
          "**WorkManager** — deferrable work; foreground only when user-visible.",
          "**Principle** — minimum work, lowest frequency, stop early.",
        ],
      },
      {
        t: "note",
        text: "Sensors and long-running services keep the CPU awake and drain power. Register sensor listeners at the lowest rate that works and unregister when idle (onPause). Avoid persistent background services — use WorkManager for deferrable work; foreground services only for genuinely ongoing user-visible tasks. Do the minimum, at the lowest frequency, stop early.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are startup and size trade-offs of using reflection-heavy libraries?",
    a: [
      {
        t: "p",
        text: "Reflection-heavy libraries (some DI, serialization, ORM tools) resist R8's static analysis — R8 can't prove which classes/methods are used, so you must add broad `keep` rules, which *bloat* the dex (larger size) and reduce optimization. Reflection is also slower at runtime and can hurt startup. Prefer *compile-time* alternatives (KSP/annotation-processor-based DI like Hilt, code-gen serialization like kotlinx.serialization) that are shrinkable and faster. When you must keep reflection, scope the keep rules tightly.",
      },
      {
        t: "list",
        items: [
          "**Resist R8** — can't prove usage → broad keep rules.",
          "**Bloat + less optimization** — from broad keeps.",
          "**Runtime cost** — reflection is slower; hurts startup.",
          "**Prefer** — compile-time (KSP/codegen) alternatives.",
        ],
      },
      {
        t: "note",
        text: "Reflection-heavy libraries resist R8 (it can't prove usage) — forcing broad keep rules that bloat the dex and reduce optimization; reflection is also slower at runtime (hurts startup). Prefer compile-time alternatives (KSP/annotation-processor DI like Hilt, codegen serialization) that are shrinkable and faster. If you must use reflection, scope keep rules tightly.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does dark mode / screen brightness relate to battery?",
    a: [
      {
        t: "p",
        text: "On *OLED/AMOLED* screens (common on phones), black pixels are effectively *off*, so a true-dark (dark mode) UI draws less power than a bright/white one — the display is often the single biggest battery consumer. Supporting dark theme (and using true blacks on OLED) can meaningfully save battery, especially with the screen on for long periods. On LCD screens the effect is smaller (backlight is always on). Also avoid keeping the screen forcibly bright or awake unnecessarily.",
      },
      {
        t: "list",
        items: [
          "**OLED** — black pixels off; dark UI draws less power.",
          "**Display** — often the biggest battery consumer.",
          "**Dark theme + true blacks** — meaningful savings on OLED.",
          "**LCD** — smaller effect (backlight always on).",
        ],
      },
      {
        t: "note",
        text: "On OLED/AMOLED screens black pixels are effectively off, so a true-dark UI draws less power than a bright/white one — and the display is often the biggest battery consumer. Dark theme with true blacks meaningfully saves battery on OLED (smaller effect on LCD). Also avoid forcing the screen bright or awake unnecessarily.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you set and enforce an app-size budget?",
    a: [
      {
        t: "p",
        text: "Treat size like a metric: establish a *baseline download size*, set a *budget/threshold*, and check it in CI (fail or alert when a build exceeds it, e.g. via APK Analyzer output or bundletool size reports). Investigate regressions the way you would perf regressions — usually a new dependency or unoptimized asset. Combine with periodic audits (APK Analyzer). A budget prevents slow creep that eventually hurts install conversion (larger apps convert worse, especially on limited data plans).",
      },
      {
        t: "list",
        items: [
          "**Baseline + budget** — set a download-size threshold.",
          "**CI check** — fail/alert on exceeding it.",
          "**Investigate regressions** — usually a new dep or asset.",
          "**Why** — larger apps convert worse (install rate).",
        ],
      },
      {
        t: "note",
        text: "Enforce an app-size budget like a metric: baseline the download size, set a threshold, check it in CI (fail/alert on exceeding via APK Analyzer/bundletool reports), investigate regressions (usually a new dependency or unoptimized asset). A budget prevents slow creep that hurts install conversion — larger apps convert worse, especially on limited data.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between compressed and uncompressed native libraries in the APK?",
    a: [
      {
        t: "p",
        text: "Historically native libs were *compressed* in the APK and *extracted* to disk at install (using extra device storage — effectively stored twice). Setting `useLegacyPackaging false` (the modern default for API 23+) ships them *uncompressed and page-aligned*, so the OS loads them *directly from the APK* without extraction — reducing on-device install size (no duplicate copy), at a slightly larger *download* (uncompressed). The App Bundle handles this optimally per device.",
      },
      {
        t: "list",
        items: [
          "**Legacy (compressed)** — extracted at install; stored twice.",
          "**`useLegacyPackaging false`** — uncompressed, loaded from APK.",
          "**Smaller install** — no duplicate extracted copy.",
          "**Trade-off** — slightly larger download; AAB optimizes per device.",
        ],
      },
      {
        t: "note",
        text: "Legacy: native libs compressed in the APK and extracted at install (stored twice — extra device storage). useLegacyPackaging false (modern default, API 23+) ships them uncompressed/page-aligned so the OS loads directly from the APK (no extraction, smaller install), at a slightly larger download. The AAB optimizes this per device.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Play Feature Delivery, and how does it differ from a monolithic APK?",
    a: [
      {
        t: "p",
        text: "*Play Feature Delivery* (built on the App Bundle) lets you split your app into a *base module* plus *feature modules* delivered at install-time, on-demand, or conditionally — so users get a smaller initial download and only fetch features they use. A *monolithic APK* bundles everything (all features, all configs) into one download regardless of what the device/user needs. Feature delivery reduces size and lets you deliver large/optional features without bloating the base install.",
      },
      {
        t: "list",
        items: [
          "**Feature Delivery** — base + feature modules (install-time/on-demand/conditional).",
          "**Smaller initial download** — fetch features as used.",
          "**Monolithic APK** — everything in one download.",
          "**Enables** — large/optional features without base bloat.",
        ],
      },
      {
        t: "note",
        text: "Play Feature Delivery (on the App Bundle) splits the app into a base module + feature modules delivered install-time/on-demand/conditionally — smaller initial download, fetch features as used. A monolithic APK bundles everything regardless of need. Feature delivery ships large/optional features without bloating the base install.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you balance size/performance trade-offs (e.g. Baseline Profiles add size)?",
    a: [
      {
        t: "p",
        text: "Some optimizations trade one metric for another: *Baseline Profiles* add a little size but improve startup/jank; *uncompressed native libs* add download size but shrink install size and speed loading; *aggressive image compression* saves size but may reduce quality. Decide by what matters for your users and app: a startup-sensitive app accepts a few KB for a Baseline Profile; a size-sensitive market (low-end, limited data) may prioritize download size. Measure both metrics and choose per the product's priorities.",
      },
      {
        t: "list",
        items: [
          "**Baseline Profile** — small size cost, big startup/jank gain.",
          "**Uncompressed libs** — bigger download, smaller install + faster load.",
          "**Image compression** — smaller size vs quality.",
          "**Decide** — by user/market priorities; measure both metrics.",
        ],
      },
      {
        t: "note",
        text: "Optimizations trade metrics: Baseline Profiles add a little size but improve startup/jank; uncompressed native libs add download but shrink install + speed loading; aggressive image compression saves size vs quality. Choose by what matters (startup-sensitive vs size-sensitive/low-end markets), measuring both metrics against product priorities.",
      },
    ],
  },
];

export default qa;
