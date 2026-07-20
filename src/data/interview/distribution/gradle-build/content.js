// Gradle & the Build System — Content tab. Teaching-first.

const content = [
  {
    heading: "What Gradle is and does",
    blocks: [
      {
        t: "p",
        text: "**Gradle** is the build system Android uses — it takes your source code, resources, and dependencies and produces the runnable app (APK/AAB). It handles *dependency management* (downloading libraries and their transitive dependencies), *compilation* (Kotlin/Java → bytecode → DEX), *resource processing*, running annotation processors/KSP, packaging, and signing. You configure it with build scripts (`build.gradle.kts` in Kotlin DSL, or Groovy `.gradle`), and the **Android Gradle Plugin (AGP)** adds all the Android-specific build logic on top of Gradle.",
      },
      {
        t: "list",
        items: [
          "**Project vs module build files**: the *root* `build.gradle.kts` configures plugins/settings for the whole project; each *module* has its own `build.gradle.kts` declaring that module's plugins, dependencies, and Android config.",
          "**`settings.gradle.kts`** lists the modules that make up the project and configures dependency repositories.",
          "**Dependencies** are declared with configurations — `implementation` (used internally, not exposed to consumers), `api` (exposed to consumers), `testImplementation`/`androidTestImplementation` (test-only), `debugImplementation` (debug builds only, e.g. LeakCanary), `ksp`/`kapt` (annotation processors).",
        ],
      },
    ],
  },
  {
    heading: "Build types",
    blocks: [
      {
        t: "p",
        text: "A **build type** defines how the app is built for a stage of development — most commonly **debug** and **release**. Build types differ in things like whether code is minified, whether it's debuggable, and which signing config is used.",
      },
      {
        t: "code",
        title: "Debug vs release build types",
        code: `android {
    buildTypes {
        debug {
            isMinifyEnabled = false
            applicationIdSuffix = ".debug"     // separate app id, installs alongside release
            isDebuggable = true
        }
        release {
            isMinifyEnabled = true              // R8 shrinking/obfuscation
            isShrinkResources = true
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**debug** — for development: not minified (fast builds, but janky — as covered), debuggable, signed with an auto-generated debug key, often with an `applicationIdSuffix` so it installs alongside the release build.",
          "**release** — for production: minified/shrunk (R8), not debuggable, signed with your real release key, optimized. This is what you publish.",
          "You can define *custom* build types (e.g. `staging`) for other environments (a staging server, a QA build).",
        ],
      },
    ],
  },
  {
    heading: "Product flavors",
    blocks: [
      {
        t: "p",
        text: "**Product flavors** create different *versions* of your app from the same codebase — for example a `free` vs `paid` version, or `dev`/`staging`/`prod` pointing at different backends, or white-labeled apps for different brands. Each flavor can override configuration (application id, resources, code, backend URL) while sharing most of the code.",
      },
      {
        t: "code",
        title: "Flavors for free/paid",
        code: `android {
    flavorDimensions += "tier"
    productFlavors {
        create("free") {
            dimension = "tier"
            applicationIdSuffix = ".free"
            buildConfigField("String", "TIER", "\\"free\\"")
        }
        create("paid") {
            dimension = "tier"
            applicationIdSuffix = ".paid"
            buildConfigField("String", "TIER", "\\"paid\\"")
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**A flavor overrides config** — application id, version, resources (a flavor-specific `src/free/res/` overrides `src/main/res/`), source code (`src/free/java/`), and `BuildConfig` fields (compile-time constants you read in code, like the backend URL or feature flags).",
          "**Flavor dimensions** — you can combine flavors from multiple dimensions (e.g. a `tier` dimension × an `environment` dimension), producing every combination.",
          "**Use flavors for genuinely different app variants** (free/paid, brands, environments); use *build types* for *how* the app is built (debug/release). They're orthogonal.",
        ],
      },
    ],
  },
  {
    heading: "Build variants — the combination",
    blocks: [
      {
        t: "p",
        text: "A **build variant** is the *combination* of a build type and product flavors. If you have `debug`/`release` build types and `free`/`paid` flavors, you get four variants: `freeDebug`, `freeRelease`, `paidDebug`, `paidRelease`. Each is a distinct buildable/installable output. You select which variant to build/run in Android Studio's Build Variants panel, and each can have its own source sets and configuration.",
      },
      {
        t: "list",
        items: [
          "**Variant = build type × flavors** — the matrix of all combinations. Each is a separate artifact you can build, test, and (for release variants) publish.",
          "**Source sets per variant** — `src/main/` is shared; `src/free/`, `src/debug/`, and even `src/freeDebug/` provide variant-specific code/resources that override or add to main. This lets you swap implementations per variant (e.g. a mock backend in a `dev` flavor).",
          "**BuildConfig / manifest placeholders** — variant-specific compile-time values (`BuildConfig.TIER`, a backend URL) and manifest values (an API key per environment) let code adapt to the variant without runtime checks.",
        ],
      },
    ],
  },
  {
    heading: "Build performance and modern practices",
    blocks: [
      {
        t: "list",
        items: [
          "**Build speed matters** — slow builds kill productivity. Key levers: **Gradle configuration cache** (skips the configuration phase on repeat builds — a big win), **build cache** (reuses task outputs, local and remote for CI), **parallel execution** (`org.gradle.parallel` — builds independent modules concurrently, benefits from modularization), and **KSP over KAPT** (KSP is ~2× faster for annotation processing since it avoids Java stub generation).",
          "**Version catalogs** (`gradle/libs.versions.toml`) — a single source of truth for dependency versions and coordinates, with type-safe accessors (`libs.androidx.core`), so 30 modules don't each hardcode versions.",
          "**Convention plugins** (in an included `build-logic` build) — capture shared build configuration (compile SDK, common dependencies) so module build files stay minimal and consistent (the Now-in-Android pattern). Better than `subprojects {}` blocks, which break configuration caching.",
          "**Incremental compilation** — Gradle recompiles only what changed; keeping this working (avoiding things that invalidate it) keeps incremental builds fast — a major reason to modularize (unchanged modules aren't recompiled).",
        ],
      },
      {
        t: "note",
        text: "Gradle: the build system (dependency management, compile, DEX, resources, package, sign); AGP adds Android logic. Build types = how it's built (debug: not minified, debuggable; release: R8-minified, real signing). Product flavors = different app versions (free/paid, dev/prod) with overridden config (app id, resources, code, BuildConfig). Build variant = build type × flavors (freeDebug, paidRelease…). Speed: config cache, build cache, parallel, KSP over KAPT, version catalogs, convention plugins.",
      },
    ],
  },
];

export default content;
