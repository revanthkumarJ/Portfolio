// Modular Architecture — Interview Prep tab.

const qa = [
  {
    level: "junior",
    q: "What is modularization and why do teams do it?",
    a: [
      {
        t: "p",
        text: "Splitting one monolithic Gradle module into multiple smaller modules with explicit dependencies between them. The four real reasons: **enforced boundaries** (an illegal dependency becomes a compile error instead of a review comment), **build speed** (unchanged modules aren't recompiled, independent ones build in parallel), **team ownership** (features map to modules with clear APIs), and **reuse/delivery** (shared core modules, Play on-demand feature delivery). It's orthogonal to MVVM/Clean — those decide layering, modularization decides physical partitioning.",
      },
    ],
  },
  {
    level: "junior",
    q: "Describe a typical module structure for a modularized Android app.",
    a: [
      {
        t: "list",
        items: [
          "**`:app`** — thin shell: Application class, DI aggregation, the NavHost. Depends on everything, contains almost nothing.",
          "**`:feature:search`, `:feature:cart`, …** — one user-facing feature each (screens + ViewModels + feature DI). Never depend on each other.",
          "**`:core:designsystem`, `:core:network`, `:core:database`, `:core:model`, `:core:common`** — shared infrastructure that features build on.",
        ],
      },
      {
        t: "p",
        text: "The shape is a three-tier **DAG**: app → features → core, arrows only pointing downward. This hybrid (vertical feature slices over horizontal core layers) is what Google's Now in Android sample demonstrates.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between api and implementation in Gradle dependencies?",
    a: [
      {
        t: "p",
        text: "`implementation` keeps the dependency **private**: consumers of your module don't see its types and — crucially — **don't recompile when it changes**. `api` **re-exports** it: the types appear in your module's public surface and every consumer recompiles on its changes. Rule: `implementation` always, `api` only when your own public signatures genuinely expose the dependency's types (e.g. a `:core:model` module). Accidental `api` chains are the top reason modularized builds stay slow.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why shouldn't feature modules depend on each other?",
    a: [
      {
        t: "p",
        text: "Because feature-to-feature edges rebuild the monolith incrementally: they serialize builds (B waits for A), create merge coupling between teams, invite cycles (checkout→profile→checkout is a hard Gradle error), and make features impossible to build/test/deliver in isolation. When feature A needs something of feature B's, the *thing* is either shared domain (extract downward into a core/domain module) or navigation (invert through a route contract or navigator interface that `:app` wires). The graph stays a DAG with arrows pointing down.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does one feature open a screen that belongs to another feature module?",
    a: [
      {
        t: "p",
        text: "Through an inverted contract, since a direct dependency is forbidden. Common shapes: **shared route definitions** in `:core:navigation` (feature navigates by type-safe route; `:app`'s NavHost maps routes to screens), a **navigator interface** the feature declares (`fun openProfile(userId)`) and `:app` implements with the real NavController via DI, or **deep links** for the loosest coupling. In all three, only `:app` knows every screen — features know destinations as abstract contracts.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a version catalog and what problem does it solve?",
    a: [
      {
        t: "p",
        text: "`gradle/libs.versions.toml` — a single declarative file listing dependency versions, library coordinates and plugins, exposed as type-safe accessors (`libs.androidx.lifecycle.viewmodel`) in every module. Problems solved: thirty build files no longer each hardcode versions (no drift, no '3 versions of OkHttp' surprises), upgrades are a one-line change, and bots (Renovate/Dependabot) have one file to update. It replaced the older `ext {}` / `Dependencies.kt` buildSrc conventions.",
      },
    ],
  },
  {
    level: "junior",
    q: "Does modularization automatically make builds faster?",
    a: [
      {
        t: "p",
        text: "No — it *enables* faster builds, and can even slow them down if done badly. Wins come from **compile avoidance** (unchanged modules skipped, only dependents of a changed module rebuild) and **parallelism** (independent modules concurrently) — both require a *wide* graph with `implementation` boundaries. A deep chain of modules, `api` leakage everywhere, or a `:core:common` that everything depends on gives you monolith rebuild behavior plus extra Gradle configuration overhead. Clean builds actually get slightly slower (per-module fixed costs). So: measure with build scans, control `api`, keep the graph wide and shallow.",
      },
    ],
  },
  {
    level: "senior",
    q: "Compare modularizing by layer vs by feature. Which do you choose and why?",
    a: [
      {
        t: "p",
        text: "**By layer** (`:presentation`/`:domain`/`:data`) physically enforces Clean's arrows, but scales badly: every feature change touches all three modules (so teams collide in the same modules), parallelism caps at the layer count, and each layer module grows into its own monolith. **By feature** matches team ownership and maximizes graph width, but layering *inside* each feature falls back to convention, and shared logic gets duplicated or dumped into common modules.",
      },
      {
        t: "p",
        text: "I choose the **hybrid** every serious codebase converges on: vertical feature slices (`:feature:x` — optionally split into `:api`/`:impl`) sitting on horizontal core modules (`:core:data`, `:core:designsystem`, `:core:model`). Feature boundaries follow *team and product* seams; layer boundaries live in core and, where the stakes justify it, inside features via the api/impl split. The honest observation to add: pure by-layer is the textbook answer, hybrid is the shipped answer — NowInAndroid, and most large apps, are hybrids.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain the api/impl module split — what does it buy, what does it cost, and when is it worth it?",
    a: [
      {
        t: "list",
        items: [
          "**Mechanics**: `:feature:payments:api` holds only interfaces + models; `:feature:payments:impl` holds the implementation and its `@Binds`. Consumers depend on `:api`; only `:app` depends on `:impl` for wiring.",
          "**Buys — encapsulation with teeth**: consumers *cannot* reach implementation classes (not convention — the classpath doesn't contain them).",
          "**Buys — compile-avoidance**: impl changes recompile only `:app`'s wiring, not the consumers; api modules are small and change rarely, so the recompilation blast radius of most edits collapses.",
          "**Buys — swappability**: fake impls for demo apps and tests slot in per-module.",
          "**Costs**: 2× module count, DI indirection for every binding, and 'where does this type go' friction; api modules that accrete logic defeat the purpose.",
        ],
      },
      {
        t: "p",
        text: "Worth it when: many consumers per module (core modules first — `:core:data:api` pays off fastest), large teams needing hard encapsulation, or build times dominated by wide recompilation. Not worth it as a blanket rule on a 10-module app — apply it to the hubs of the dependency graph, not the leaves.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Hilt work across modules, and what breaks with dynamic feature modules?",
    a: [
      {
        t: "p",
        text: "Standard multi-module Hilt is pleasantly automatic: each module declares `@Module @InstallIn(SingletonComponent::class)` (etc.) bindings; because `:app` (the `@HiltAndroidApp` root) transitively depends on every module, annotation processing **aggregates all bindings** into the app's component graph at compile time — no manual registry, and `@HiltViewModel`s in feature modules just work. With api/impl splits, the `@Binds` sits in `:impl`, consumers inject the `:api` interface, and aggregation still finds it since `:app` depends on `:impl`.",
      },
      {
        t: "p",
        text: "**Dynamic features invert the graph** — the on-demand module depends *on* `:app`, not vice versa — so Hilt's aggregation can't see it: no `@AndroidEntryPoint` in dynamic modules. The workaround is **`@EntryPoint`**: define an interface listing what the dynamic module needs, install it in the app's component, and fetch it reflectively via `EntryPointAccessors.fromApplication(...)` from the dynamic module's screens. It's clunky by design — worth also saying that this friction (plus dagger's per-module strictness) is why some heavily-dynamic apps choose Koin, which resolves at runtime and doesn't care about compile-time graph direction.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are convention plugins and why are they preferred over buildSrc and allprojects blocks?",
    a: [
      {
        t: "p",
        text: "Convention plugins are small Gradle plugins in an **included build** (`build-logic/`) that encode each module *type*'s full configuration — `myapp.android.feature` applies AGP + Kotlin, sets SDK versions, adds standard deps — so a feature module's build file shrinks to `plugins { id(\"myapp.android.feature\") }` plus its specific dependencies. Thirty modules stay consistent by construction, and changing minSdk is a one-file edit.",
      },
      {
        t: "list",
        items: [
          "**vs `allprojects`/`subprojects`**: cross-project configuration reaches into other projects' models — it breaks **configuration caching** and **project isolation**, and hides configuration far from the module; convention plugins keep configuration declarative and local.",
          "**vs `buildSrc`**: a `buildSrc` change invalidates the build classpath of *every* module (full rebuild); an included `build-logic` build is a normal dependency with normal invalidation — that single caching difference is why the ecosystem (and NowInAndroid) migrated.",
          "Bonus points: convention plugins are themselves testable, versionable, and shareable across repositories — build logic promoted to first-class code.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "Your 60-module app still has slow incremental builds. Walk through your diagnosis.",
    a: [
      {
        t: "list",
        items: [
          "**Get data first**: `--scan` / gradle-profiler on a representative edit (one-line body change in a hot module). Look at what actually recompiled and the task critical path — guesses about Gradle are usually wrong.",
          "**Check the blast radius**: if a body-only (non-ABI) change recompiled half the graph, hunt `api` leakage — audit hub modules' dependency declarations, demote to `implementation`.",
          "**Check the hubs**: a `:core:common` dumping ground everything depends on makes every change global — split it; check the graph's *width vs depth* (deep chains serialize; parallelism needs width).",
          "**Check the perennial taxes**: KAPT still present? (migrate to KSP — Hilt/Room/Glide all support it); configuration time high? (enable configuration cache, kill `allprojects` blocks and eager task creation); no remote build cache on CI?",
          "**Check the non-Gradle suspects**: single massive module dominating the critical path (carve it), annotation processors on hot paths, unnecessary resource processing in library modules, outdated AGP/Kotlin (compiler perf improves every release).",
        ],
      },
      {
        t: "p",
        text: "The framing that lands: treat build performance as an engineering problem with measurements and a critical path, not folklore — and note the fix is often *dependency hygiene* (api→implementation, splitting hubs), not more modules.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you structure modules in a KMP project, and what is the umbrella framework problem?",
    a: [
      {
        t: "p",
        text: "Same DAG discipline with a platform dimension: shared modules (`:shared:model`, `:shared:database`, `:shared:feature:x`) with per-module `commonMain`/`androidMain`/`iosMain` source sets — keeping each `expect/actual` inside the module that owns the abstraction. Android consumes shared modules as ordinary Gradle deps; DI is typically Koin (modules aggregated in shared init) since Hilt is Android-only.",
      },
      {
        t: "p",
        text: "**The umbrella problem**: iOS consumes Kotlin as an Apple framework, and if each shared module produced its own framework, shared types would lose identity across them (the same Kotlin class becomes two incompatible Obj-C classes in two frameworks). So multi-module KMP projects create one **umbrella module** whose framework `export()`s the modules iOS needs, producing a single XCFramework. Follow-ups worth volunteering: curate the export list (every exported module grows the binary and compile time — Kotlin/Native linking is the slow path), non-exported transitive types surface as opaque `KotlinBase` — so design the iOS-facing API to live in exported modules; and SKIE runs on the umbrella to improve the Swift surface.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you enforce architectural boundaries beyond what Gradle gives you — and prevent the monolith from regrowing?",
    a: [
      {
        t: "list",
        items: [
          "**Gradle gives the coarse walls** (missing dependency = compile error) — but within a module, and for rules like 'features may not depend on features', you need active enforcement.",
          "**Konsist / ArchUnit tests**: executable architecture rules — 'classes in ..presentation.. may not import ..data.internal..', 'ViewModels live in feature modules', run in CI like any test.",
          "**Custom lint checks / detekt rules** for idiom-level rules (no `android.*` imports in domain packages, no repository types in composables).",
          "**Module-graph assertions**: plugins that validate the dependency DAG against a declared spec (no feature→feature edges, max depth, no new edges without review) — turning graph erosion into a red build.",
          "**Structural friction**: `internal` visibility + api/impl splits make violations *impossible* rather than detectable; CODEOWNERS on build files makes new edges reviewable by the platform team.",
        ],
      },
      {
        t: "p",
        text: "The principle to close on: every architecture decays at the rate reviewers get tired — durable boundaries are the ones a machine checks. Convention < detection (CI rules) < prevention (visibility + graph structure).",
      },
    ],
  },
  {
    level: "senior",
    q: "Walk through migrating a 400k-line monolith module to a modular structure while the team keeps shipping.",
    a: [
      {
        t: "list",
        items: [
          "**Prep**: measure builds (baseline to prove ROI later); map the internal dependency structure (package-level analysis — jdeps/Sonargraph/IDE); set up version catalog + convention plugins *first* so every extracted module is one line of config.",
          "**Extract leaves first**: `:core:model`, then infrastructure with few inward deps — `:core:designsystem`, `:core:network`, `:core:database`. Each extraction is mechanical (move + fix imports) and immediately parallelizes builds.",
          "**Break the hard knots**: the monolith's remaining tangle is usually cyclic feature code coupled through statics/utils — introduce interfaces at the seams inside the monolith *before* physically moving code (decouple in place, then extract cheaply).",
          "**Carve features by activity**: highest-churn features first (that's where isolation pays daily); each becomes `:feature:x` with a navigation contract; the monolith shrinks to a legacy module that new code may not depend on (enforced by a graph rule).",
          "**Keep shipping**: every step lands on main behind normal review — no long-lived migration branch; the graph rules + CI checks prevent regrowth; declare victory not at 'zero legacy' but when the legacy module is frozen and shrinking.",
        ],
      },
      {
        t: "p",
        text: "Risks to name: import-fixing churn creating merge storms (coordinate extraction windows), hidden reflection/resource references breaking at runtime (R classes, ProGuard), and morale — pick early extractions that visibly improve build times so the effort funds its own credibility.",
      },
    ],
  },
];

export default qa;
