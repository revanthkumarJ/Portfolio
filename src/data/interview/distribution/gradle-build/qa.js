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
  {
    level: "junior",
    q: "What is the difference between Gradle and the Android Gradle Plugin (AGP)?",
    a: [
      {
        t: "p",
        text: "*Gradle* is the general-purpose build tool (task graph, dependency resolution) — not Android-specific. The *Android Gradle Plugin (AGP)* is the plugin that teaches Gradle *how to build Android* — it adds build types, flavors, the manifest merger, resource processing, dexing (D8/R8), and packaging into APKs/AABs. You apply AGP (`com.android.application`) in your module. AGP versions are tied to Android Studio and specific Gradle versions.",
      },
      {
        t: "list",
        items: [
          "**Gradle** — general build tool (tasks, dependencies).",
          "**AGP** — plugin adding Android build logic.",
          "**AGP adds** — build types/flavors, manifest merge, R8, packaging.",
          "**Coupled** — AGP version ↔ Gradle version ↔ Studio.",
        ],
      },
      {
        t: "note",
        text: "Gradle is the general build tool (task graph, dependency resolution); the Android Gradle Plugin (AGP) teaches it to build Android — build types/flavors, manifest merger, resource processing, D8/R8, APK/AAB packaging. You apply AGP (com.android.application). AGP versions are tied to specific Gradle and Studio versions.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are Gradle's three build phases?",
    a: [
      {
        t: "p",
        text: "*Initialization* — Gradle determines which projects/modules take part (reads `settings.gradle`). *Configuration* — it evaluates every module's build script to build the *task graph* (this runs even for tasks you won't execute — why heavy configuration slows every build). *Execution* — it runs the selected tasks (and their dependencies) in order. Understanding this explains why 'configuration avoidance' (lazy task creation) and the *configuration cache* matter for speed.",
      },
      {
        t: "list",
        items: [
          "**Initialization** — which modules participate (`settings.gradle`).",
          "**Configuration** — evaluate scripts, build the task graph.",
          "**Execution** — run selected tasks + dependencies.",
          "**Insight** — configuration runs every build (avoid heavy work there).",
        ],
      },
      {
        t: "note",
        text: "Gradle phases: initialization (which modules participate — settings.gradle), configuration (evaluate every script to build the task graph — runs even for tasks you won't run), execution (run selected tasks). Heavy configuration slows every build — why configuration avoidance and the configuration cache matter.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between settings.gradle and build.gradle?",
    a: [
      {
        t: "p",
        text: "`settings.gradle(.kts)` is *project-level* — it defines which modules are included (`include(\":app\", \":core\")`) and repository/plugin management for the whole build. `build.gradle(.kts)` is *per-module* (and one at the root) — it configures *how that module builds*: plugins applied, dependencies, `android {}` block (compileSdk, build types, flavors). One settings file per project; one build file per module.",
      },
      {
        t: "list",
        items: [
          "**`settings.gradle`** — project-level; which modules + repos.",
          "**`build.gradle`** — per-module; plugins, deps, `android {}`.",
          "**One settings** — per project.",
          "**One build** — per module (+ root).",
        ],
      },
      {
        t: "note",
        text: "settings.gradle(.kts) is project-level — includes modules (include(\":app\")) and manages repositories/plugins. build.gradle(.kts) is per-module — applies plugins, declares dependencies, configures android {} (compileSdk, build types, flavors). One settings file per project; one build file per module plus root.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the Gradle wrapper, and why use it?",
    a: [
      {
        t: "p",
        text: "The *Gradle wrapper* (`gradlew`/`gradlew.bat` + `gradle-wrapper.properties`) pins the *exact Gradle version* for the project and downloads it automatically. Everyone (and CI) builds with the *same* Gradle version — no 'works on my machine' from version drift, and no need to install Gradle manually. Always run `./gradlew` (not a system `gradle`) and commit the wrapper files. Upgrade the version via `gradle-wrapper.properties`.",
      },
      {
        t: "list",
        items: [
          "**Pins the Gradle version** — per project.",
          "**Auto-downloads** — no manual install.",
          "**Consistency** — everyone + CI use the same version.",
          "**Use `./gradlew`** — commit the wrapper files.",
        ],
      },
      {
        t: "note",
        text: "The Gradle wrapper (gradlew + gradle-wrapper.properties) pins the exact Gradle version and auto-downloads it, so everyone and CI build with the same version (no version-drift 'works on my machine', no manual install). Always run ./gradlew and commit the wrapper files; upgrade via gradle-wrapper.properties.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a version catalog (libs.versions.toml)?",
    a: [
      {
        t: "p",
        text: "A *version catalog* (`gradle/libs.versions.toml`) is a central, type-safe place to declare dependency *versions* and *coordinates*, referenced across modules as `libs.retrofit` etc. It replaces scattered hardcoded versions and `ext` variables — one source of truth, consistent versions everywhere, IDE autocomplete, and easy upgrades. It also supports *bundles* (groups of deps) and *plugin* versions. The modern standard for multi-module dependency management.",
      },
      {
        t: "code",
        title: "libs.versions.toml + usage",
        code: `# gradle/libs.versions.toml\n[versions]\nretrofit = "2.11.0"\n[libraries]\nretrofit = { module = "com.squareup.retrofit2:retrofit", version.ref = "retrofit" }\n\n// build.gradle.kts\ndependencies { implementation(libs.retrofit) }`,
      },
      {
        t: "note",
        text: "A version catalog (gradle/libs.versions.toml) centralizes dependency versions and coordinates, referenced type-safely as libs.retrofit across modules — one source of truth, consistent versions, IDE autocomplete, easy upgrades. Supports bundles and plugin versions. The modern standard for multi-module dependency management.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the Gradle configuration cache, and how does it speed builds?",
    a: [
      {
        t: "p",
        text: "The *configuration cache* stores the result of the *configuration phase* (the task graph) so subsequent builds *skip re-configuring* when nothing relevant changed — jumping straight to execution. Since configuration runs every build and can be slow in large projects, this is a big speedup. It requires build logic to be *compatible* (no reading mutable state at execution time, no `Project` access in task actions) — enabling it often surfaces build-script issues to fix.",
      },
      {
        t: "list",
        items: [
          "**Caches** — the configuration-phase result (task graph).",
          "**Skips re-configuration** — when nothing relevant changed.",
          "**Big win** — configuration runs every build; slow in large projects.",
          "**Requires** — compatible build logic (no Project access at execution).",
        ],
      },
      {
        t: "note",
        text: "The configuration cache stores the configuration-phase result (task graph), so unchanged builds skip re-configuring and jump to execution — a big speedup since configuration runs every build. It requires compatible build logic (no Project access / mutable-state reads in task actions); enabling it surfaces script issues to fix.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the Gradle build cache (local and remote)?",
    a: [
      {
        t: "p",
        text: "The *build cache* stores *task outputs* keyed by their inputs, so if a task's inputs are unchanged, Gradle *reuses the cached output* instead of re-running it. The *local* cache reuses outputs across builds on your machine; the *remote* cache (shared, e.g. on CI) lets the whole team/CI reuse each other's outputs — so a clean build can pull compiled results rather than recompiling. Combined with incremental builds, it dramatically cuts build times.",
      },
      {
        t: "list",
        items: [
          "**Caches task outputs** — keyed by inputs.",
          "**Unchanged inputs** — reuse output, skip the task.",
          "**Local** — across builds on your machine.",
          "**Remote** — shared team/CI cache (reuse others' outputs).",
        ],
      },
      {
        t: "note",
        text: "The build cache stores task outputs keyed by inputs — unchanged inputs → reuse the cached output instead of re-running. Local cache reuses across builds on your machine; remote (shared, CI) lets the team/CI reuse each other's outputs (a clean build pulls compiled results). With incremental builds, it cuts build times sharply.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between the Groovy and Kotlin DSL for Gradle?",
    a: [
      {
        t: "p",
        text: "Gradle build scripts can be written in *Groovy* (`build.gradle`) or the *Kotlin DSL* (`build.gradle.kts`). Kotlin DSL gives *type safety*, better IDE support (autocomplete, refactoring, click-through), and compile-time error checking — at the cost of slightly slower first-time script compilation. Groovy is more lenient/dynamic. New Android projects default to the Kotlin DSL; it's the recommended choice for its tooling benefits, especially in larger builds.",
      },
      {
        t: "list",
        items: [
          "**Groovy** — `build.gradle`; dynamic, lenient.",
          "**Kotlin DSL** — `build.gradle.kts`; type-safe, better IDE.",
          "**Kotlin DSL cost** — slower first script compilation.",
          "**Default** — Kotlin DSL for new projects.",
        ],
      },
      {
        t: "note",
        text: "Gradle scripts: Groovy (build.gradle — dynamic, lenient) or Kotlin DSL (build.gradle.kts — type-safe, better IDE autocomplete/refactoring, compile-time checks, slightly slower first compilation). New Android projects default to and recommend the Kotlin DSL for its tooling benefits, especially in larger builds.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is buildSrc versus convention plugins for sharing build logic?",
    a: [
      {
        t: "p",
        text: "Both share build logic across modules. `buildSrc` is a special directory compiled before the build — its code is available to all build scripts, but *any change invalidates the whole build* (recompiles everything). *Convention plugins* (custom plugins in an included build, e.g. `build-logic`) let you define reusable configuration (`my-android-library` convention) applied per module, with *better incrementality* (a change doesn't invalidate everything) and cleaner composition. Convention plugins are the modern recommendation for large multi-module builds.",
      },
      {
        t: "list",
        items: [
          "**Both** — share build logic across modules.",
          "**`buildSrc`** — global, but any change invalidates the whole build.",
          "**Convention plugins** — reusable per-module config, better incrementality.",
          "**Modern** — convention plugins (`build-logic`) for large builds.",
        ],
      },
      {
        t: "note",
        text: "Sharing build logic: buildSrc (compiled before the build, available everywhere, but any change invalidates the whole build) vs convention plugins (custom plugins in an included build-logic, applied per module — reusable config with better incrementality and composition). Convention plugins are the modern recommendation for large multi-module builds.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between debug and release build types?",
    a: [
      {
        t: "p",
        text: "*Debug* is for development: `debuggable true`, signed with the auto-generated debug key, no shrinking/obfuscation (fast builds), often extra logging/tools. *Release* is for production: signed with your *release key*, `minifyEnabled`/`shrinkResources` on (R8), `debuggable false`, optimized and smaller. You customize each in the `buildTypes {}` block. Always test performance/size on *release* — debug behaves very differently.",
      },
      {
        t: "table",
        headers: ["", "Debug", "Release"],
        rows: [
          ["Signing", "Debug key (auto)", "Release keystore"],
          ["Shrinking", "Off (fast builds)", "R8 on (smaller)"],
          ["debuggable", "true", "false"],
          ["Use", "Development", "Production"],
        ],
      },
      {
        t: "note",
        text: "Debug: development — debuggable, auto debug key, no shrinking (fast), extra logging. Release: production — release keystore, minifyEnabled/shrinkResources (R8), not debuggable, optimized/smaller. Customize each in buildTypes {}. Always measure performance/size on release — debug behaves very differently.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is BuildConfig, and how do you use build config fields?",
    a: [
      {
        t: "p",
        text: "`BuildConfig` is a generated class exposing build-time constants: `BuildConfig.DEBUG`, `BuildConfig.VERSION_NAME`, and *custom fields* you define per build type/flavor with `buildConfigField`. Use it to bake environment-specific values (API base URLs, feature flags, keys that aren't secret) into the build so code can branch on them. Enable it with `buildFeatures { buildConfig = true }` (now opt-in). Don't put real secrets here — they're extractable from the APK.",
      },
      {
        t: "code",
        title: "Custom BuildConfig field",
        code: `android {\n  buildFeatures { buildConfig = true }\n  buildTypes {\n    release { buildConfigField("String", "BASE_URL", "\\"https://api.example.com\\"") }\n    debug   { buildConfigField("String", "BASE_URL", "\\"https://staging.example.com\\"") }\n  }\n}\n// usage: Retrofit.Builder().baseUrl(BuildConfig.BASE_URL)`,
      },
      {
        t: "note",
        text: "BuildConfig is a generated class of build-time constants — DEBUG, VERSION_NAME, and custom buildConfigField values per build type/flavor (API URLs, feature flags). Enable with buildFeatures { buildConfig = true }. Branch code on them for environment config. Never store real secrets here — they're extractable from the APK.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are manifest placeholders?",
    a: [
      {
        t: "p",
        text: "*Manifest placeholders* let you inject build-variant-specific values into `AndroidManifest.xml` at build time. You define them in Gradle (`manifestPlaceholders = [key: value]`) and reference them in the manifest as `${key}`. Common uses: per-flavor deep-link hosts, API keys for services declared in the manifest (like Maps), or app labels. This avoids maintaining separate manifests per variant — one manifest, values filled in per build.",
      },
      {
        t: "code",
        title: "Manifest placeholder",
        code: `// build.gradle.kts\ndefaultConfig { manifestPlaceholders["mapsKey"] = "AIza..." }\n\n<!-- AndroidManifest.xml -->\n<meta-data android:name="com.google.android.geo.API_KEY"\n           android:value="\${mapsKey}" />`,
      },
      {
        t: "note",
        text: "Manifest placeholders inject build-variant-specific values into AndroidManifest.xml at build time — defined in Gradle (manifestPlaceholders), referenced as ${key}. Uses: per-flavor deep-link hosts, Maps/service API keys, app labels. One manifest with values filled per build, instead of separate manifests per variant.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Gradle resolve dependency version conflicts?",
    a: [
      {
        t: "p",
        text: "When multiple dependencies bring *different versions* of the same library (transitively), Gradle by default picks the *highest* version (newest wins) to satisfy everyone. You can override with *constraints*, `resolutionStrategy.force`, or a version catalog to pin a specific version. `./gradlew :app:dependencies` (or the dependency insight report) shows the resolved graph and *why* a version was chosen. Conflicts causing runtime crashes usually mean an incompatible forced/transitive version.",
      },
      {
        t: "list",
        items: [
          "**Default** — highest version wins (newest).",
          "**Override** — constraints, `force`, version catalog pinning.",
          "**Inspect** — `:app:dependencies` / dependencyInsight.",
          "**Crashes** — often an incompatible forced/transitive version.",
        ],
      },
      {
        t: "note",
        text: "On conflicting transitive versions of a library, Gradle picks the highest (newest wins). Override with constraints, resolutionStrategy.force, or a version catalog. Inspect with ./gradlew :app:dependencies or the dependencyInsight report to see the resolved graph and why. Runtime crashes often mean an incompatible forced/transitive version.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is compileOnly and runtimeOnly, versus implementation?",
    a: [
      {
        t: "p",
        text: "`implementation` puts a dependency on both the compile and runtime classpath (and hides it from consumers). `compileOnly` is available only at *compile time*, not packaged at runtime (for annotations, provided APIs, or libraries supplied by the environment). `runtimeOnly` is packaged and available at *runtime* but not compile time (e.g. a driver/implementation you don't reference directly). Most app dependencies are `implementation`; the others are for specific provided/runtime scenarios.",
      },
      {
        t: "list",
        items: [
          "**`implementation`** — compile + runtime; most deps.",
          "**`compileOnly`** — compile only, not packaged (annotations/provided).",
          "**`runtimeOnly`** — runtime only, not on compile classpath.",
          "**Pick by** — when the dependency is actually needed.",
        ],
      },
      {
        t: "note",
        text: "implementation: compile + runtime classpath (most deps; hidden from consumers). compileOnly: compile-time only, not packaged (annotations, provided APIs). runtimeOnly: packaged for runtime but not on the compile classpath (drivers/implementations you don't reference). Choose by when the dependency is actually needed.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the Gradle daemon, and how does it help?",
    a: [
      {
        t: "p",
        text: "The *Gradle daemon* is a long-lived background JVM process that stays warm between builds — avoiding JVM startup cost each time and keeping caches/classes hot (JIT-optimized). This makes repeated builds significantly faster. It's on by default. Occasionally a stale/misbehaving daemon causes odd build issues (fix with `--stop` to kill daemons). Give it enough heap (`org.gradle.jvmargs`) for large projects.",
      },
      {
        t: "list",
        items: [
          "**Long-lived JVM** — warm between builds.",
          "**Avoids** — JVM startup cost each build.",
          "**Keeps caches hot** — faster repeated builds.",
          "**Stale daemon** — `--stop`; size heap via `org.gradle.jvmargs`.",
        ],
      },
      {
        t: "note",
        text: "The Gradle daemon is a long-lived background JVM kept warm between builds — avoiding per-build JVM startup and keeping caches/JIT hot, so repeated builds are much faster (on by default). A stale daemon can cause odd issues (--stop to kill). Give it enough heap via org.gradle.jvmargs for large projects.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is KSP versus KAPT, and how does it affect build speed?",
    a: [
      {
        t: "p",
        text: "Both process annotations to generate code (for Room, Hilt, Moshi, etc.). *KAPT* (Kotlin Annotation Processing) works by generating *Java stubs* for your Kotlin so Java-based processors can run — this stub generation is *slow*. *KSP* (Kotlin Symbol Processing) reads Kotlin directly via a lightweight API — *much faster* (often ~2×) and Kotlin-idiomatic. Migrate processors to KSP where supported for significant build-speed wins; KAPT remains only for processors without a KSP version.",
      },
      {
        t: "list",
        items: [
          "**Both** — annotation processing → generated code.",
          "**KAPT** — generates Java stubs; slow.",
          "**KSP** — reads Kotlin directly; ~2× faster.",
          "**Migrate** — to KSP where supported for build speed.",
        ],
      },
      {
        t: "note",
        text: "KAPT (Kotlin Annotation Processing) generates Java stubs so Java processors run — slow. KSP (Kotlin Symbol Processing) reads Kotlin directly via a light API — much faster (~2×) and idiomatic. Migrate Room/Hilt/Moshi processors to KSP where supported for big build-speed wins; keep KAPT only for processors without a KSP version.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a Gradle task, and how do tasks relate to each other?",
    a: [
      {
        t: "p",
        text: "A *task* is a unit of build work (`compileDebugKotlin`, `assembleRelease`, `test`). Tasks declare *dependencies* on other tasks, forming a *directed acyclic graph (DAG)*; Gradle runs the needed tasks in dependency order, skipping *up-to-date* ones (unchanged inputs/outputs). You run tasks by name (`./gradlew assembleDebug`). Custom tasks let you script build steps. Understanding tasks explains incremental builds (only affected tasks re-run).",
      },
      {
        t: "list",
        items: [
          "**Task** — a unit of build work.",
          "**DAG** — tasks depend on tasks; run in order.",
          "**Up-to-date** — skipped when inputs/outputs unchanged.",
          "**Run** — `./gradlew <task>`; custom tasks script steps.",
        ],
      },
      {
        t: "note",
        text: "A Gradle task is a unit of build work (compileDebugKotlin, assembleRelease). Tasks depend on tasks forming a DAG; Gradle runs them in order and skips up-to-date ones (unchanged inputs/outputs) — the basis of incremental builds. Run by name (./gradlew assembleDebug); custom tasks script build steps.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does modularization improve build times?",
    a: [
      {
        t: "p",
        text: "Splitting the app into modules lets Gradle *build them in parallel* and *only rebuild changed modules* (and their dependents) — a change in a leaf feature module doesn't recompile the whole app. Combined with the build cache, unchanged modules are pulled from cache. It also improves *incrementality* and enables faster CI. The key is a good dependency graph (few wide dependencies) so changes have a small blast radius; over-coupling erodes the benefit.",
      },
      {
        t: "list",
        items: [
          "**Parallel builds** — modules built concurrently.",
          "**Rebuild only changed** — modules + dependents.",
          "**Build cache** — unchanged modules from cache.",
          "**Needs** — a good graph (small change blast radius).",
        ],
      },
      {
        t: "note",
        text: "Modularization lets Gradle build modules in parallel and rebuild only changed modules + their dependents (a leaf change doesn't recompile everything); with the build cache, unchanged modules come from cache. Needs a good dependency graph (small change blast radius) — over-coupling erodes the benefit.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is minifyEnabled and shrinkResources in the build config?",
    a: [
      {
        t: "p",
        text: "`minifyEnabled true` turns on *R8* (code shrinking, optimization, obfuscation) for that build type; `shrinkResources true` removes unused *resources* (requires `minifyEnabled`). You enable both on `release` for a smaller, optimized, harder-to-reverse APK. They need correct `keep` rules (`proguard-rules.pro`) so R8 doesn't strip code used only via reflection. Keep them *off* for debug (faster builds, easier debugging).",
      },
      {
        t: "code",
        title: "Enabling shrinking on release",
        code: `buildTypes {\n  release {\n    isMinifyEnabled = true      // R8: shrink + optimize + obfuscate\n    isShrinkResources = true    // remove unused resources\n    proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")\n  }\n}`,
      },
      {
        t: "note",
        text: "minifyEnabled true enables R8 (shrink/optimize/obfuscate) for a build type; shrinkResources true removes unused resources (needs minifyEnabled). Enable both on release for a smaller, harder-to-reverse APK, with correct keep rules so reflection-used code survives. Keep them off for debug (faster builds, easier debugging).",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the main levers for speeding up Gradle builds?",
    a: [
      {
        t: "p",
        text: "Beyond a fast machine: enable the *configuration cache* and *build cache*, keep the *daemon* and *parallel* execution on (`org.gradle.parallel=true`), give Gradle enough *heap*, use *KSP over KAPT*, *modularize* for parallelism and small rebuild scope, avoid heavy work in the configuration phase (lazy task/config avoidance), keep dependencies/AGP up to date, and don't run unnecessary tasks (e.g. skip lint/tests in inner-loop builds). Profile with `--scan` / build scans to find the actual bottleneck.",
      },
      {
        t: "list",
        items: [
          "**Caches** — configuration + build cache.",
          "**Parallel + daemon + heap** — `org.gradle.parallel`, jvmargs.",
          "**KSP over KAPT; modularize** — for speed/parallelism.",
          "**Profile** — build scans (`--scan`) to find the bottleneck.",
        ],
      },
      {
        t: "note",
        text: "Speed levers: configuration cache + build cache, daemon + parallel execution (org.gradle.parallel), enough heap, KSP over KAPT, modularization (parallelism + small rebuild scope), avoid heavy configuration-phase work, keep AGP/deps current, skip unneeded tasks in inner loop. Profile with build scans (--scan) to find the real bottleneck.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between a project and a module (subproject) in Gradle?",
    a: [
      {
        t: "p",
        text: "In Gradle terms, the *root project* is the whole build; each *module* (`:app`, `:core`) is a *subproject* included in `settings.gradle`. Confusingly, Android Studio calls subprojects 'modules'. Each subproject has its own `build.gradle` and produces its own artifact (an app, a library). Subprojects depend on each other via `implementation(project(\":core\"))`. The root project usually holds shared config, not code.",
      },
      {
        t: "list",
        items: [
          "**Root project** — the whole build.",
          "**Subproject/module** — `:app`, `:core`; own build.gradle + artifact.",
          "**Depend** — `implementation(project(\":core\"))`.",
          "**Root** — shared config, usually no code.",
        ],
      },
      {
        t: "note",
        text: "In Gradle the root project is the whole build; each module (:app, :core) is a subproject included in settings.gradle (Studio calls these 'modules'). Each has its own build.gradle and produces its own artifact; they depend via implementation(project(\":core\")). The root project holds shared config, usually no code.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do product flavors and flavor dimensions work for build variants?",
    a: [
      {
        t: "p",
        text: "*Flavors* define different app versions (free/paid, brandA/brandB) with distinct config, resources, and code (source sets like `src/paid/`). *Flavor dimensions* let you combine independent axes — e.g. a `tier` dimension (free/paid) × an `env` dimension (dev/prod) yields flavors like `freeDev`, `paidProd`. Each flavor × build type is a *variant* (`freeDevDebug`). Use flavors for genuinely different product configurations; overusing them multiplies variants (and build time).",
      },
      {
        t: "code",
        title: "Flavor dimensions",
        code: `android {\n  flavorDimensions += listOf("tier", "env")\n  productFlavors {\n    create("free") { dimension = "tier" }\n    create("paid") { dimension = "tier" }\n    create("dev")  { dimension = "env" }\n    create("prod") { dimension = "env" }\n  }\n}\n// variants: freeDevDebug, paidProdRelease, ...`,
      },
      {
        t: "note",
        text: "Flavors define app versions (free/paid) with distinct config/resources/source sets; flavor dimensions combine independent axes (tier × env → freeDev, paidProd). Each flavor × build type is a variant (freeDevDebug). Use for genuinely different products; overuse multiplies variants and build time.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you keep secrets (API keys) out of the build and version control?",
    a: [
      {
        t: "p",
        text: "Never hardcode secrets in source or commit them. Keep them in a *gitignored* `local.properties` or `secrets.properties` (or environment variables in CI), read them in Gradle, and expose via `BuildConfig`/manifest placeholders only what the app truly needs. Remember: anything compiled into the APK is *extractable* — so genuinely sensitive secrets (signing keys, server secrets) should live server-side, not in the app at all. The `secrets-gradle-plugin` helps manage this for keys like Maps.",
      },
      {
        t: "list",
        items: [
          "**Gitignored** — `local.properties`/`secrets.properties` or CI env vars.",
          "**Read in Gradle** — expose minimal via BuildConfig/placeholders.",
          "**APK is extractable** — no true secrets in the app.",
          "**Server-side** — signing keys, server secrets.",
        ],
      },
      {
        t: "note",
        text: "Keep secrets out of source/VCS: store in gitignored local.properties/secrets.properties or CI env vars, read in Gradle, expose only what's needed via BuildConfig/placeholders. Anything in the APK is extractable — genuinely sensitive secrets belong server-side, not in the app. The secrets-gradle-plugin helps for keys like Maps.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between assemble, bundle, and install tasks?",
    a: [
      {
        t: "p",
        text: "`assembleRelease` builds the *APK(s)* for that variant; `bundleRelease` builds the *AAB* (App Bundle) for Play upload; `installDebug` builds and *installs* the APK on a connected device/emulator. `build` runs assemble plus checks (lint/tests). For Play you upload the *AAB* (`bundle`); for local device testing you `install` or `assemble`. Knowing which task produces which artifact avoids uploading the wrong thing.",
      },
      {
        t: "list",
        items: [
          "**`assemble<Variant>`** — build APK(s).",
          "**`bundle<Variant>`** — build AAB for Play.",
          "**`install<Variant>`** — build + install on device.",
          "**`build`** — assemble + checks (lint/tests).",
        ],
      },
      {
        t: "note",
        text: "assembleRelease builds APK(s); bundleRelease builds the AAB (for Play upload); installDebug builds + installs on a device; build runs assemble plus lint/tests. Upload the AAB (bundle) to Play; use install/assemble for local testing. Know which task makes which artifact to avoid uploading the wrong one.",
      },
    ],
  },
];

export default qa;
