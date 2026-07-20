// Gradle & the Build System — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is Gradle and what does it do for an Android project?",
    a: [
      {
        t: "p",
        text: "**Gradle is the build system Android uses — it turns your source code, resources, and dependencies into the runnable app (APK/AAB).** It automates the whole build process: downloading dependency libraries (and their transitive dependencies), compiling Kotlin/Java to bytecode and then to DEX, processing resources, running annotation processors (KSP/KAPT), packaging everything, and signing the output.",
      },
      {
        t: "list",
        items: [
          "You configure it with **build scripts** — `build.gradle.kts` (Kotlin DSL) in the root project and in each module — declaring plugins, dependencies, and Android configuration.",
          "The **Android Gradle Plugin (AGP)** adds all the Android-specific build logic on top of Gradle (the `android { }` block, build types, flavors, manifest merging, etc.).",
          "**Dependencies** are declared with configurations like `implementation` (internal use), `api` (exposed to consumers), `testImplementation` (test-only), and `debugImplementation` (debug-only, e.g. LeakCanary).",
        ],
      },
      {
        t: "p",
        text: "In short, Gradle is the engine that assembles your app — you *declare* what your app needs (dependencies, config, build variants) and Gradle *executes* the build. The key concepts to understand on top of it are build types (how the app is built — debug/release), product flavors (different versions of the app), and how they combine into build variants. Understanding Gradle matters because build configuration, dependency management, and build speed are daily concerns for any Android developer.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a build type and a product flavor?",
    a: [
      {
        t: "p",
        text: "**A build type defines *how* the app is built for a stage of development (debug vs release); a product flavor defines a different *version* of the app (free vs paid, dev vs prod). They're orthogonal — build types are about the build configuration, flavors are about app variants.**",
      },
      {
        t: "list",
        items: [
          "**Build type** — controls build-level settings: whether code is minified (R8), whether it's debuggable, which signing key is used, whether it's optimized. The two standard ones are **debug** (not minified, debuggable, debug key — for development) and **release** (minified, not debuggable, real key — for publishing). You might add a `staging` type.",
          "**Product flavor** — creates genuinely different versions of the app from the same codebase: a `free` vs `paid` version, `dev`/`staging`/`prod` pointing at different backends, or branded/white-label variants. Each flavor overrides configuration — application id, resources, code, backend URL, feature flags (`BuildConfig` fields).",
        ],
      },
      {
        t: "p",
        text: "The clearest way to remember it: build type answers 'how do I build this?' (debug or release settings), and flavor answers 'which version of the app am I building?' (free or paid, which backend). They combine into **build variants** — a build type × flavors — so `free`/`paid` flavors and `debug`/`release` types give you `freeDebug`, `freeRelease`, `paidDebug`, `paidRelease`. Use build types for the dev-vs-production distinction and flavors for actual product variants; mixing up the two concepts (e.g. making 'free' a build type) leads to awkward configuration.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a build variant?",
    a: [
      {
        t: "p",
        text: "**A build variant is the combination of a build type and product flavors — it's a specific, distinct buildable/installable output of your app.** If you have `debug`/`release` build types and `free`/`paid` flavors, you get four variants: `freeDebug`, `freeRelease`, `paidDebug`, `paidRelease`. Each is a separate artifact you can build, run, test, and (for release variants) publish.",
      },
      {
        t: "list",
        items: [
          "**Variant = build type × flavors** — the matrix of all combinations. With no flavors, your variants are just your build types (debug, release).",
          "**Each variant can have its own source set** — `src/main/` is shared across all, while `src/free/`, `src/debug/`, or even `src/freeDebug/` provide variant-specific code and resources that override or add to main. This lets you, say, use a mock backend in a `dev` flavor or different branding per flavor.",
          "**You select the active variant** in Android Studio's Build Variants panel to build/run a specific one.",
        ],
      },
      {
        t: "p",
        text: "Variants are how you produce all the different builds of your app from one codebase — a debug build of the free version for development, a release build of the paid version for the store, etc. Combined with `BuildConfig` fields and manifest placeholders (variant-specific compile-time values), variants let the same code adapt to different environments and product tiers without runtime branching. For example, `BuildConfig.TIER` or a per-flavor backend URL lets code behave correctly for each variant, resolved at build time.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you speed up Gradle builds?",
    a: [
      {
        t: "list",
        items: [
          "**Gradle configuration cache** — caches the result of the configuration phase, so repeat builds skip re-configuring the project. Often a big win; enable it in `gradle.properties`.",
          "**Build cache** — reuses the outputs of tasks whose inputs haven't changed (local, and *remote* for CI so builds share results across machines).",
          "**Parallel execution** (`org.gradle.parallel=true`) — builds independent modules concurrently; the benefit scales with how modularized (and wide) your project is.",
          "**KSP instead of KAPT** — KSP is roughly 2× faster for annotation processing (Hilt, Room, Moshi) because it works directly with Kotlin instead of generating Java stubs.",
          "**Modularization** — with modules, Gradle recompiles only the modules that changed (compile avoidance) and builds independent ones in parallel; a monolith recompiles everything.",
          "**Version catalogs and convention plugins** — reduce configuration duplication and keep it cache-friendly (avoid `subprojects {}` / `allprojects {}` blocks, which break configuration caching).",
        ],
      },
      {
        t: "p",
        text: "Build speed matters because slow builds directly hurt developer productivity — every build is waiting time, multiplied across the whole team all day. The biggest levers are usually enabling the caches (configuration cache + build cache), migrating KAPT to KSP, and modularizing so unchanged code isn't recompiled. As with performance work, it helps to *measure* — Gradle build scans (`--scan`) show where build time goes, so you optimize the actual bottleneck (often annotation processing, a slow module on the critical path, or unnecessary reconfiguration) rather than guessing.",
      },
    ],
  },
  {
    level: "senior",
    q: "How would you structure build configuration for an app with multiple environments (dev/staging/prod) and free/paid tiers?",
    a: [
      {
        t: "p",
        text: "**I'd use two *flavor dimensions* — one for environment (dev/staging/prod) and one for tier (free/paid) — combined with the standard debug/release build types, giving a clean matrix where each concern is expressed independently and combined automatically. This keeps configuration DRY and makes every meaningful combination buildable.**",
      },
      {
        t: "code",
        title: "Two flavor dimensions + build types",
        code: `android {
    flavorDimensions += listOf("environment", "tier")
    productFlavors {
        create("dev")     { dimension = "environment"; buildConfigField("String","BASE_URL","\\"https://dev.api\\"") }
        create("staging") { dimension = "environment"; buildConfigField("String","BASE_URL","\\"https://staging.api\\"") }
        create("prod")    { dimension = "environment"; buildConfigField("String","BASE_URL","\\"https://api\\"") }
        create("free")    { dimension = "tier"; applicationIdSuffix = ".free" }
        create("paid")    { dimension = "tier"; applicationIdSuffix = ".paid" }
    }
    // build types: debug, release
}`,
      },
      {
        t: "list",
        items: [
          "**Two dimensions, not one flat list**: environment (dev/staging/prod) and tier (free/paid) are *independent* concerns, so they belong in separate flavor dimensions. Gradle then produces every combination — `devFreeDebug`, `prodPaidRelease`, etc. — automatically. Cramming both into one dimension would force you to enumerate all six combinations manually (devFree, devPaid, stagingFree…), which is repetitive and error-prone. Dimensions express the *orthogonality* correctly.",
          "**Environment drives config, not code duplication**: each environment flavor sets `BuildConfig` fields (backend URL, API keys via manifest placeholders, feature flags) so the *same code* reads `BuildConfig.BASE_URL` and points at the right backend per variant — no runtime environment checks, no duplicated code. Secrets per environment come from Gradle properties / CI secrets, not hardcoded.",
          "**Tier drives features and app id**: the tier flavor sets an `applicationIdSuffix` (so free and paid install as separate apps / are separate Play listings if desired) and a `BuildConfig.TIER` flag, plus tier-specific source sets (`src/paid/`) for premium-only code/resources. Feature gating reads the tier flag or uses the source-set override.",
          "**Build types stay about build config**: debug (unminified, debuggable, debug key) vs release (R8, real signing) — orthogonal to both flavor dimensions, so a `prodPaidRelease` is your production paid build and `devFreeDebug` is a developer's free-tier dev build.",
          "**Manage the combinatorial explosion**: two dimensions × build types = 3×2×2 = 12 variants, which is a lot. Use `variantFilter` (or the newer variant API) to *disable* nonsensical combinations (you probably never ship a `dev` release), keeping only the variants you actually build. This prevents build/test time blowing up on variants nobody uses.",
        ],
      },
      {
        t: "list",
        items: [
          "**Keep it DRY with version catalogs + convention plugins**: shared dependencies and config live in a version catalog and convention plugins, so adding a module or changing the compile SDK is one edit, not one-per-module. Environment-specific values come from `BuildConfig`/manifest placeholders fed by Gradle properties (and CI secrets for keys), never hardcoded per flavor.",
          "**CI builds the right variants**: CI produces `prodFreeRelease`/`prodPaidRelease` AABs for the store, runs tests on a representative variant (e.g. `prodFreeDebug`), and can build `staging` variants for QA — all from the same configuration.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the key insight is expressing *independent concerns as independent dimensions* — environment and tier are orthogonal, so two flavor dimensions (not one flat flavor list) model them correctly and let Gradle generate the matrix, keeping configuration DRY. Environment differences are handled via `BuildConfig`/manifest values that the *same code* reads (config, not code duplication), and tier differences via flags + source-set overrides for premium features. Then you *prune* the combinatorial explosion with `variantFilter` so you only build meaningful variants, and keep the whole thing maintainable with version catalogs and convention plugins. This gives a clean, scalable build setup where adding an environment or tier is a small, localized change — versus the anti-pattern of one flat flavor dimension with manually enumerated combinations, or environment logic scattered as runtime `if` checks. Demonstrating the dimensions-for-orthogonal-concerns modeling, config-over-code-duplication, and variant pruning is the comprehensive answer.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between implementation and api dependency configurations, and why does it matter for build speed?",
    a: [
      {
        t: "p",
        text: "**`implementation` keeps a dependency *internal* to the module — consumers of the module can't see it and, crucially, don't recompile when it changes. `api` *exposes* the dependency to consumers — they can use its types and *do* recompile when it changes. The build-speed impact comes from this recompilation difference.**",
      },
      {
        t: "list",
        items: [
          "**`implementation`** — the dependency is a private implementation detail. Its types aren't visible on the module's public API, and — the key part — when that dependency's *ABI (public signature)* changes, modules that *depend on this module* do **not** need to recompile, because they never saw that dependency. This limits the 'blast radius' of a change.",
          "**`api`** — the dependency is re-exported as part of the module's public API. Consumers can reference its types directly, and when it changes, everything that depends on this module *must* recompile (because the change might affect the exposed API). This propagates recompilation transitively.",
        ],
      },
      {
        t: "list",
        items: [
          "**Why it matters for build speed — compile avoidance**: in a multi-module project, Gradle tries to *avoid recompiling* modules whose inputs haven't changed. `implementation` boundaries *enable* this — a change deep in a dependency only recompiles the module using it, not the whole graph above. `api` *defeats* it — the change ripples up to every transitive consumer. So a project that overuses `api` (or uses it by accident) has changes that cascade recompilation across many modules, making incremental builds slow; one that uses `implementation` correctly keeps recompilation localized and builds fast.",
          "**The rule**: use `implementation` by default (always), and `api` *only* when your module's public API genuinely exposes the dependency's types (e.g. a `core-model` module whose public classes are used by consumers). Accidental `api` usage — or the old `compile` configuration which behaved like `api` — is a common reason 'we modularized but builds didn't get faster': the recompilation cascades because dependencies leak through `api`.",
          "**How to audit it**: build scans and dependency reports reveal `api` leakage; the fix is demoting unnecessary `api` to `implementation`, which shrinks the recompilation blast radius.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: `implementation` vs `api` is fundamentally about *encapsulation* (does this module leak its dependency?) and that encapsulation directly determines *build performance* via compile avoidance. `implementation` is a wall that stops both visibility *and* recompilation from propagating; `api` is a window that lets both through. The build-speed payoff of modularization *depends* on using `implementation` boundaries so changes stay localized — overusing `api` collapses the modules back into effectively one recompilation unit. So the guidance is 'implementation always, api only when the public API truly requires it', and diagnosing slow modular builds often means finding and removing `api` leakage. Connecting the encapsulation semantics to the compile-avoidance/build-speed consequence is exactly the depth these questions probe — and it ties directly to the modularization topic's theme that modular boundaries must be `implementation` to deliver their build-speed benefit.",
      },
    ],
  },
];

export default qa;
