// App Size & Battery — Content tab. Teaching-first.

const content = [
  {
    heading: "Why app size matters",
    blocks: [
      {
        t: "p",
        text: "**App download size affects install rates** — larger apps are less likely to be installed (users on limited data or storage abandon big downloads), and Play shows the download size prominently. Beyond installs, size affects update frequency (big updates get deferred), storage pressure on the device, and even the size limit for instant apps. So reducing app size is a real business concern, not just tidiness. The main levers are code shrinking (R8), the App Bundle format, and resource/asset optimization.",
      },
    ],
  },
  {
    heading: "R8 — code shrinking, obfuscation, optimization",
    blocks: [
      {
        t: "p",
        text: "**R8** is the tool (replacing the older ProGuard) that shrinks and optimizes your code at build time for release builds. It does three things: **shrinking** (removing unused code and resources — 'tree shaking'), **obfuscation** (renaming classes/methods to short meaningless names, which shrinks and lightly obscures the code), and **optimization** (inlining, removing dead branches). It significantly reduces APK size and can improve performance.",
      },
      {
        t: "code",
        title: "Enabling R8 in release builds",
        code: `android {
    buildTypes {
        release {
            isMinifyEnabled = true          // R8 shrinking + obfuscation
            isShrinkResources = true         // remove unused resources
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",        // your keep rules
            )
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Shrinking (tree shaking)** — R8 analyzes which code is actually reachable and removes the rest (unused methods, classes, libraries you pull in but barely use). This is where most of the size reduction comes from.",
          "**Obfuscation** — renames identifiers to short names (`a`, `b`), reducing size and making reverse-engineering slightly harder. You upload a *mapping file* to Play so crash reports can be de-obfuscated back to real names.",
          "**Optimization** — inlining, dead-code elimination, and other transformations that can also improve runtime performance.",
          "**Keep rules** — R8 uses static analysis, so code accessed *reflectively* (by name at runtime — some serialization, DI, or JNI) can be wrongly removed or renamed. You write `-keep` rules in `proguard-rules.pro` to tell R8 to preserve those. Libraries ship their own keep rules; you add rules for your reflective code. Missing keep rules cause release-only crashes (works in debug where R8 is off) — a classic gotcha.",
        ],
      },
    ],
  },
  {
    heading: "The Android App Bundle (AAB) — split delivery",
    blocks: [
      {
        t: "p",
        text: "The **Android App Bundle (`.aab`)** is the modern publishing format (required for new apps on Play since 2021). Instead of you building one universal APK containing *everything* for *every* device, you upload an AAB — a bundle of all your app's code and resources — and Google Play generates *optimized APKs per device* from it (**split APKs**), delivering only what each device actually needs. This is a major size win at the *download* level.",
      },
      {
        t: "list",
        items: [
          "**The problem with a universal APK**: it includes resources for *all* screen densities, native libraries for *all* CPU architectures (arm64, armv7, x86), and *all* language strings — but any given device uses only one density, one architecture, and a few languages. A universal APK forces every device to download resources it can't use.",
          "**How the AAB fixes it**: Play splits your bundle by **density** (deliver only the device's density resources), **architecture** (only its ABI's native libs), and **language** (only its languages), so each device downloads a much smaller, tailored APK. Same app, much smaller download — often 15-35% smaller.",
          "**APK vs AAB**: an APK is the installable artifact a device runs; an AAB is a *publishing format* you upload (not directly installable) from which Play generates APKs. You develop and test with APKs; you *publish* an AAB.",
          "**Play App Signing** — AAB delivery requires Play to sign the generated APKs, so you enroll in Play App Signing (Play holds the signing key and signs the per-device APKs).",
        ],
      },
    ],
  },
  {
    heading: "Dynamic Feature Modules and resource optimization",
    blocks: [
      {
        t: "list",
        items: [
          "**Dynamic Feature Modules (Play Feature Delivery)** — deliver parts of your app *on demand* rather than at install. A rarely-used feature (a complex editor, an onboarding flow) can be a dynamic module downloaded only when the user needs it, keeping the initial install small. Also supports conditional delivery (by device capability) and instant delivery.",
          "**Resource optimization** — remove unused resources (`shrinkResources`), use vector drawables instead of multiple PNG densities (one scalable asset vs many bitmaps), compress images (WebP instead of PNG/JPEG — smaller at similar quality), and remove unused languages/densities (the AAB handles per-device, but you can also configure `resConfigs`).",
          "**Native library optimization** — native libs (`.so`) are large and per-architecture; the AAB splits them, and you can further reduce with `android:extractNativeLibs=false` and by only including needed ABIs.",
          "**Analyze size** — the **APK Analyzer** in Android Studio breaks down what's taking space (code, resources, native libs, assets), so you can target the biggest contributors — the same 'measure first' principle as performance.",
        ],
      },
    ],
  },
  {
    heading: "Battery optimization",
    blocks: [
      {
        t: "p",
        text: "**Battery drain** is a top user complaint and a reason apps get uninstalled. Battery is consumed by CPU work (computation, wakeups), radio use (network, GPS), and keeping the device/screen awake. The overarching strategy is to *do less, less often, and batch it* — which aligns with the OS's own battery-protection mechanisms (Doze, background limits).",
      },
      {
        t: "list",
        items: [
          "**Minimize wakeups and background work** — waking the device from sleep is expensive. Use WorkManager (which batches work into maintenance windows respecting Doze) rather than frequent alarms/polling. Avoid wakelocks; if you must keep the CPU awake, hold it as briefly as possible.",
          "**Batch network requests** — the cellular radio stays powered for a while after each request (the 'tail energy'), so many small spread-out requests keep the radio on far more than a few batched ones. Batch and defer non-urgent network work (WorkManager with constraints); prefetch efficiently.",
          "**Prefer push over polling** — polling for updates wastes battery (constant wakeups + radio); FCM push lets the server notify the app only when there's something, far more efficient.",
          "**Use location sparingly** — GPS is a major drain. Request the *lowest accuracy* that works, the *lowest frequency*, and stop updates when not needed; use `FusedLocationProvider` with appropriate priority.",
          "**Respect the OS mechanisms** — Doze, App Standby, and background limits *exist* to save battery; working with them (deferrable work, push, constraints) rather than fighting them (wakelocks, exact-alarm polling, battery-optimization exemptions) is both the correct approach and what Play policies require.",
          "**Measure** — the Energy Profiler (and Battery Historian / `dumpsys batterystats`) shows what's draining battery, so you target the real culprit rather than guessing.",
        ],
      },
      {
        t: "note",
        text: "App size: matters for install/update rates. R8 shrinks (tree-shaking), obfuscates (rename + mapping file for crashes), and optimizes code in release builds — keep rules for reflective code (missing ones = release-only crashes). AAB is the publish format; Play generates per-device split APKs (by density/ABI/language) — much smaller downloads than a universal APK. Dynamic Feature Modules deliver features on demand. Optimize resources (WebP, vectors, shrinkResources); analyze with APK Analyzer. Battery: minimize wakeups/background work, batch network (radio tail energy), push over polling, sparing location, respect Doze; measure with the Energy Profiler.",
      },
    ],
  },
];

export default content;
