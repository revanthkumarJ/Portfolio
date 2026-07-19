// Modular Architecture — Content tab.

const content = [
  {
    heading: "Why modularize — and when not to",
    blocks: [
      {
        t: "p",
        text: "**Modularization** splits one monolithic Gradle module into many smaller ones with explicit dependencies. It is *orthogonal* to MVVM/Clean — those say how code is layered; modularization decides how it's **physically partitioned and compiled**. The reasons that actually hold up:",
      },
      {
        t: "list",
        items: [
          "**Enforced boundaries**: within one module, any class can reach any other — architecture rules are convention. Across modules, an illegal dependency is a **compile error**. Modularization is architecture with teeth.",
          "**Build speed**: Gradle skips compiling modules whose inputs didn't change and builds independent modules **in parallel** — in large apps this cuts incremental builds from minutes to seconds.",
          "**Team ownership**: feature teams own modules with clear APIs; merge conflicts drop; CODEOWNERS maps cleanly.",
          "**Reuse & delivery**: shared `core` modules across apps (or KMP targets); **Play Feature Delivery** (on-demand dynamic features) requires modules.",
          "**Testability & tooling**: per-module test suites run in isolation; demo/sandbox apps can assemble a single feature.",
        ],
      },
      {
        t: "note",
        text: "When **not** to: small apps and small teams. Modularization has fixed costs — Gradle config sprawl, slower *clean* builds (module graph overhead), cross-module refactors touching many build files. Under ~50–100k LOC and a handful of developers, a well-layered monolith with package discipline is usually faster to work in. Say this unprompted; it's the judgment interviewers probe.",
      },
    ],
  },
  {
    heading: "Module taxonomy — app, feature, core, and the api/impl split",
    blocks: [
      {
        t: "list",
        items: [
          "**`:app`** — thin shell: application class, DI aggregation, navigation host, final dependency wiring. Depends on everything; contains almost nothing.",
          "**`:feature:*`** (e.g. `:feature:checkout`, `:feature:profile`) — one user-facing feature each: its screens, ViewModels, feature-scoped DI. Feature modules **never depend on each other**.",
          "**`:core:*`** (a.k.a. library modules) — shared infrastructure: `:core:designsystem`, `:core:network`, `:core:database`, `:core:common`, `:core:testing`. Depend only on other core modules.",
          "**`:data:*` / `:domain:*`** — when layering is also modularized: `:core:data` repositories, `:core:domain`/`:domain:orders` models+use cases (this is where Clean Architecture's layers become physical).",
        ],
      },
      {
        t: "h3",
        text: "The api/impl split",
      },
      {
        t: "p",
        text: "Mature graphs split modules into a tiny **`-api`** module (interfaces + models only) and an **`-impl`** module (implementation): consumers depend on `:feature:payments:api`, while only `:app` depends on `:feature:payments:impl` to wire DI. Effects: consumers **can't** reach implementation details (enforced encapsulation), and an impl change doesn't recompile consumers — only api changes do. Cost: double the module count; adopt it where the compile-avoidance and decoupling pay, not everywhere by default.",
      },
    ],
  },
  {
    heading: "Slicing strategies: by layer, by feature, or hybrid",
    blocks: [
      {
        t: "table",
        headers: ["Strategy", "Shape", "Verdict"],
        rows: [
          ["**By layer**", "`:presentation`, `:domain`, `:data` — three fat horizontal modules", "enforces Clean's arrows but scales terribly: every feature touches all three modules, teams collide, parallelism is capped at 3"],
          ["**By feature**", "`:feature:search`, `:feature:cart`, … + shared `:core:*`", "matches team boundaries and build parallelism; layering *inside* a feature is back to convention"],
          ["**Hybrid (industry standard)**", "features sliced vertically, each internally layered (or split into `:feature:x` + `:feature:x:api`), on top of `:core:*` layer modules", "what Google's Now in Android sample and most large apps do"],
        ],
      },
      {
        t: "p",
        text: "The dependency graph you're aiming for is a **DAG with three tiers**: `:app` → features → core. Arrows only point downward; anything sideways (feature→feature) or upward is a design smell the build should reject.",
      },
    ],
  },
  {
    heading: "Gradle mechanics — api vs implementation and what they do to builds",
    blocks: [
      {
        t: "code",
        title: "The dependency configurations that matter",
        code: `// :feature:checkout/build.gradle.kts
dependencies {
    implementation(project(":core:designsystem")) // internal use only
    api(project(":core:model"))                    // leaked in this module's public API

    implementation(libs.androidx.lifecycle.viewmodel)
}`,
      },
      {
        t: "list",
        items: [
          "**`implementation`**: the dependency is invisible to consumers' compile classpaths. When it changes (ABI), *consumers of this module don't recompile*. Default choice — always.",
          "**`api`**: the dependency is re-exported — consumers see its types and **recompile when it changes**. Use only when the module's own public signatures expose those types (e.g. a models module).",
          "The build-speed rule: `api` where unavoidable, `implementation` everywhere else — accidental `api` chains are the classic reason 'we modularized but builds didn't improve'.",
          "**ABI vs non-ABI changes**: Gradle's compile avoidance recompiles consumers only when a dependency's *public signatures* change — a method-body edit in `:core:network` shouldn't recompile features (unless leaked via `api`).",
          "Circular module dependencies are a **hard Gradle error** — usually a hidden shared concept that wants extraction into a lower module.",
        ],
      },
    ],
  },
  {
    heading: "Feature-to-feature navigation without dependencies",
    blocks: [
      {
        t: "p",
        text: "Checkout must open Profile, but features can't depend on each other. Every large app solves this with **inversion through a shared contract** — know several concrete shapes:",
      },
      {
        t: "list",
        items: [
          "**Route/deep-link contracts in a shared module**: `:core:navigation` holds route constants or type-safe route classes (Navigation-Compose serializable routes); features navigate by *route*, and `:app`'s NavHost maps routes → screens. Features never see each other's composables.",
          "**Navigator interfaces**: `:feature:checkout` declares `interface CheckoutNavigation { fun openProfile(userId: String) }`; `:app` implements it with the real NavController and provides it via DI — full inversion, easiest to fake in tests.",
          "**Deep links proper** (URIs) — loosest coupling, also covers external entry; stringly-typed unless wrapped.",
          "**Screen-factory registries** for non-Navigation stacks (or multi-module Fragments): features register `Route -> Screen` factories into a map the host consumes.",
        ],
      },
      {
        t: "code",
        title: "Contract + app-level wiring (Navigator-interface flavor)",
        code: `// :feature:checkout (declares what it needs)
interface CheckoutNavigator {
    fun openProfile(userId: String)
    fun openOrderConfirmation(orderId: String)
}

// :app (the only module that knows everyone)
class AppNavigator(private val navController: NavHostController) :
    CheckoutNavigator, ProfileNavigator {
    override fun openProfile(userId: String) =
        navController.navigate(ProfileRoute(userId))
    override fun openOrderConfirmation(orderId: String) =
        navController.navigate(OrderConfirmationRoute(orderId))
}`,
      },
    ],
  },
  {
    heading: "Dependency injection across modules",
    blocks: [
      {
        t: "list",
        items: [
          "**Hilt**: each module declares its own `@Module @InstallIn(...)` bindings; the annotation processor **aggregates them automatically** when `:app` depends on the module — no manual registry. `@HiltViewModel`s in feature modules just work.",
          "**Hilt across api/impl splits**: consumers inject the interface from `-api`; the `@Binds` lives in `-impl`; only `:app` depends on `-impl`, so aggregation still sees it. **EntryPoints** cover non-injectable entry places (dynamic-feature code, content providers).",
          "**Dynamic Feature caveat**: Hilt can't aggregate from on-demand modules (they depend on `:app`, inverting the graph) — you use `@EntryPoint` accessors there; a classic gotcha question.",
          "**Koin**: each Gradle module exposes a `val featureModule = module { ... }`; `:app` collects the list into `startKoin` — explicit, no codegen, and multiplatform (the common choice in KMP).",
          "**Scoping discipline**: singletons (network, DB) live in core modules' bindings; feature bindings stay feature/ViewModel-scoped so features don't bloat the app-lifetime graph.",
        ],
      },
    ],
  },
  {
    heading: "Build infrastructure: version catalogs & convention plugins",
    blocks: [
      {
        t: "p",
        text: "Thirty modules means thirty `build.gradle.kts` files — without shared infrastructure they drift. Two standard tools:",
      },
      {
        t: "code",
        title: "Version catalog — gradle/libs.versions.toml",
        code: `[versions]
kotlin = "2.1.0"
compose-bom = "2025.01.00"

[libraries]
androidx-lifecycle-viewmodel = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version = "2.8.7" }

[plugins]
android-application = { id = "com.android.application", version = "8.7.0" }`,
      },
      {
        t: "code",
        title: "Convention plugin — build-logic/ (one line per module afterwards)",
        code: `// build-logic/convention/src/main/kotlin/AndroidFeatureConventionPlugin.kt
class AndroidFeatureConventionPlugin : Plugin<Project> {
    override fun apply(target: Project) = with(target) {
        pluginManager.apply("com.android.library")
        pluginManager.apply("org.jetbrains.kotlin.android")
        extensions.configure<LibraryExtension> {
            compileSdk = 35
            defaultConfig.minSdk = 24
        }
        dependencies {
            "implementation"(project(":core:designsystem"))
            "implementation"(project(":core:common"))
        }
    }
}

// a feature module's ENTIRE build.gradle.kts:
plugins { id("myapp.android.feature") }
dependencies { implementation(project(":core:data")) }`,
      },
      {
        t: "list",
        items: [
          "**Version catalog** = single source of truth for versions/coordinates, type-safe accessors (`libs.androidx.lifecycle.viewmodel`), one place for Renovate/Dependabot updates.",
          "**Convention plugins** (in an included `build-logic` build) capture per-module-type configuration — `myapp.android.feature`, `myapp.android.library`, `myapp.kmp.library` — so module build files shrink to declarations. This is the Now-in-Android pattern and a strong senior signal to name.",
          "Anti-pattern they replace: `subprojects { }` / `allprojects { }` blocks in the root build file — cross-project configuration that breaks configuration caching and project isolation.",
        ],
      },
    ],
  },
  {
    heading: "Build performance — what modularization actually buys, and the rest of the toolbox",
    blocks: [
      {
        t: "list",
        items: [
          "**Compile avoidance**: unchanged modules aren't recompiled; ABI-only recompilation limits blast radius of a change to its dependents — *if* the graph is wide and `api` leakage is controlled. A deep chain of modules serializes and helps nothing.",
          "**Parallel execution**: `org.gradle.parallel=true` builds independent modules concurrently — payoff scales with graph *width*.",
          "**Build cache** (local/remote): task outputs keyed by inputs — CI reuses results across machines; a fat monolith module can never cache-hit partially.",
          "**Configuration cache**: skips the configuration phase entirely on repeat builds — the biggest recent win; requires plugins (and your build logic) to be compatible.",
          "**KSP over KAPT** (Hilt/Room/Moshi): removes the stub-generation tax, roughly 2× annotation-processing speed.",
          "Measure, don't guess: **build scans** (`--scan`), `gradle-profiler`, and the module dependency graph (e.g. `graphviz` task plugins) to find the critical path and `api` leaks.",
        ],
      },
    ],
  },
  {
    heading: "Modularization in KMP",
    blocks: [
      {
        t: "list",
        items: [
          "Same DAG philosophy, plus the platform dimension: shared KMP modules (`:shared:domain`, `:shared:data`, `:shared:feature:x`) consumed by `:androidApp`, with iOS consuming through a framework.",
          "**The umbrella module**: iOS wants *one* framework, so multi-module KMP projects add a `:shared:umbrella` module that `export`s the others into a single XCFramework — a KMP-specific pattern worth naming (direct multi-framework consumption breaks type identity across frameworks).",
          "Per-module `commonMain/androidMain/iosMain` source sets keep `expect/actual` local to the module that owns the abstraction (DB driver in `:shared:database`, not globally).",
          "DI: Koin modules per Gradle module aggregate in shared init code called from both platforms; Hilt stays Android-side only.",
          "Watch iOS build times: each shared module compiles to Kotlin/Native — the umbrella + exported set should be curated, not 'export everything'.",
        ],
      },
    ],
  },
  {
    heading: "Pitfalls, smells, and the migration path",
    blocks: [
      {
        t: "list",
        items: [
          "**The `:core:common` dumping ground** — 'utils' modules that every module depends on become a new monolith: one change recompiles the world. Keep leaf modules small and purposeful; split `common` the moment it accretes.",
          "**Over-modularization** — 200 micro-modules where configuration time exceeds compile time; module count should follow team/feature boundaries, not class count.",
          "**`api` chains** — transitive leakage quietly restoring monolith-like recompilation; audit with build scans.",
          "**Sideways dependencies** smuggled through 'shared feature' modules — `:feature:a` and `:feature:b` both depending on `:feature:shared-ab` that contains half of each; extract genuine common *domain* downward instead.",
          "**Circulars resolved by merging** — merging two modules to kill a cycle usually papers over a missing abstraction; extract the shared concept downward instead.",
          "**Migration order (monolith → modules)**: 1) extract leaf utilities (`:core:model`, `:core:common`); 2) extract infrastructure (`:core:network`, `:core:database`, `:core:designsystem`); 3) carve features out one at a time, newest/most-active first; 4) thin `:app` to a shell. Enforce with lint/Konsist/module-graph checks so the monolith doesn't regrow.",
        ],
      },
      {
        t: "note",
        text: "Best interview close: \"Modularization is the physical enforcement of whatever architecture you chose — layers become compile errors instead of review comments. Its ROI curve starts negative and grows with team size, so the skill is timing the investment, not maximizing module count.\"",
      },
    ],
  },
];

export default content;
