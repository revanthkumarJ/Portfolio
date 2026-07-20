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
  {
    level: "junior",
    q: "What is a Gradle module, and how is it different from a package?",
    a: [
      {
        t: "p",
        text: "A Gradle module is an independently-buildable unit of code with its own `build.gradle.kts`, its own dependencies, and its own compiled output. A package is just a namespace *within* a module — a way to organize files. The crucial difference: modules have *enforced* boundaries (a module can only use what it explicitly depends on), while packages have none (any class can reach any other class in the same module).",
      },
      {
        t: "list",
        items: [
          "**Module** — a build unit: own build file, own dependency list, own compilation, produces its own artifact. Boundaries are enforced by the build system.",
          "**Package** — a namespace inside a module; purely organizational. No dependency enforcement — everything in the module can access everything else.",
        ],
      },
      {
        t: "p",
        text: "This distinction is *the whole point* of modularization. Within a single module, 'the presentation layer must not import data-layer internals' is a convention that reviewers must police — and it erodes. Across modules, if `:feature:profile` doesn't declare a dependency on `:feature:payments:impl`, then a profile class *cannot* import a payment implementation class — it's a *compile error*. So modules turn architectural rules into build constraints. That's why 'organize into packages' and 'split into modules' are fundamentally different: only the latter *enforces* the boundaries.",
      },
      {
        t: "note",
        text: "A module is a *buildable unit with enforced boundaries*; a package is just a namespace with none. Modularization matters because it turns 'please don't depend on that' into a compile error.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the main types of modules in a modularized app?",
    a: [
      {
        t: "p",
        text: "A well-modularized Android app typically has three kinds of modules arranged in tiers: a thin `:app` module at the top, `:feature:*` modules for user-facing features, and `:core:*` modules for shared infrastructure they all build on. The dependencies flow downward: app → features → core.",
      },
      {
        t: "list",
        items: [
          "**`:app`** — a thin shell: the Application class, DI aggregation, the navigation host, final wiring. Depends on everything, contains almost nothing.",
          "**`:feature:*`** (e.g. `:feature:checkout`, `:feature:profile`) — one user-facing feature each: its screens, ViewModels, feature-scoped DI. Feature modules **never depend on each other**.",
          "**`:core:*`** (e.g. `:core:designsystem`, `:core:network`, `:core:database`, `:core:common`) — shared infrastructure that features build on. Depend only on other core modules.",
          "**`:data`/`:domain`** (optional) — if you also modularize by layer, the repositories and domain models get their own modules — where Clean Architecture's layers become physical.",
        ],
      },
      {
        t: "p",
        text: "The target shape is a **DAG (directed acyclic graph) with arrows pointing downward**: `:app` → features → core, and nothing sideways (feature→feature) or upward. This is the hybrid structure Google's Now in Android sample demonstrates and that most large apps converge on — vertical feature slices sitting on horizontal core modules. Understanding the app/feature/core taxonomy and the downward-only dependency rule is the foundation of modularization.",
      },
      {
        t: "note",
        text: "Three tiers: thin `:app` → `:feature:*` (never depend on each other) → `:core:*` (shared infra). A downward-pointing DAG — no sideways or upward edges. That's the Now-in-Android shape.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between multi-module and single-module, and when is each right?",
    a: [
      {
        t: "p",
        text: "A single-module app keeps all code in one Gradle module (`:app`); a multi-module app splits it into many. The trade-off is *enforced boundaries + build speed at scale* (multi-module) versus *simplicity and lower overhead* (single-module). The right choice depends heavily on app size and team size.",
      },
      {
        t: "table",
        headers: ["", "Single-module", "Multi-module"],
        rows: [
          ["Boundaries", "convention only (packages)", "enforced by the build (compile errors)"],
          ["Incremental build", "recompiles everything on any change", "recompiles only changed modules; parallel"],
          ["Overhead", "low (one build file)", "higher (many build files, config)"],
          ["Team scaling", "merge conflicts, coupling", "teams own modules with clear APIs"],
          ["Best for", "small apps, small teams, prototypes", "large apps, multiple teams, long-lived"],
        ],
      },
      {
        t: "p",
        text: "The honest guidance: modularization has *fixed costs* (Gradle config sprawl, slower clean builds due to module-graph overhead, cross-module refactors touching many build files). Under roughly 50–100k lines and a handful of developers, a well-layered single module with package discipline is usually faster to work in. Modularization pays off as team size and codebase grow — its ROI curve *starts negative* and rises with scale.",
      },
      {
        t: "p",
        text: "So I don't reflexively modularize. For a small app or MVP, single-module is simpler and correct. For a large, multi-team, long-lived app, multi-module's enforced boundaries and build parallelism are worth the overhead. The skill is *timing the investment* — modularize when the pain (slow builds, merge conflicts, eroding boundaries) actually appears, not preemptively.",
      },
      {
        t: "note",
        text: "Single-module for small apps/teams (simpler, lower overhead); multi-module for large/multi-team apps (enforced boundaries, build parallelism). Modularization's ROI starts negative and rises with scale — time the investment, don't do it preemptively.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does modularization actually make builds faster? Explain the mechanism.",
    a: [
      {
        t: "p",
        text: "Modularization enables — but doesn't guarantee — faster builds through two mechanisms: **compile avoidance** (unchanged modules aren't recompiled) and **parallel execution** (independent modules build concurrently). Both require the module graph to be *wide* and dependencies to be properly scoped, or you get no benefit.",
      },
      {
        t: "list",
        items: [
          "**Compile avoidance** — Gradle skips recompiling a module whose inputs haven't changed. If you edit `:feature:profile`, only it (and its dependents) recompile — `:feature:checkout` and untouched core modules are reused from cache. In a single monolith, *any* change recompiles *everything*.",
          "**ABI vs non-ABI changes** — even finer: Gradle recompiles a module's *consumers* only when the module's *public signatures* (ABI) change. A method-body edit in `:core:network` (non-ABI) doesn't recompile the features that use it — only an API change does. This dramatically limits the 'blast radius' of a change.",
          "**Parallel execution** (`org.gradle.parallel=true`) — independent modules with no dependency between them build *concurrently* on multiple cores. The benefit scales with the graph's *width*.",
        ],
      },
      {
        t: "p",
        text: "The critical caveat: these benefits only materialize with discipline. If dependencies leak through `api` (instead of `implementation`), a change cascades recompilation across the whole graph — you 'modularized but builds didn't get faster'. If the graph is *deep* (a long chain of modules) rather than *wide*, there's no parallelism and every change ripples up the chain. And a `:core:common` that everything depends on becomes a new monolith — one change recompiles the world.",
      },
      {
        t: "p",
        text: "So modularization *enables* fast builds; achieving them requires wide graphs, `implementation` boundaries (not `api`), and avoiding god-modules everyone depends on. The mechanism is compile avoidance + parallelism; the discipline is what makes it real.",
      },
      {
        t: "note",
        text: "Faster builds come from compile avoidance (unchanged modules skipped; only ABI changes recompile consumers) + parallel execution (independent modules concurrently). But they require wide graphs, `implementation` not `api`, and no god-module — else you 'modularized but builds got no faster'.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a monolithic app module and why is it a problem at scale?",
    a: [
      {
        t: "p",
        text: "A monolithic app module is the default single `:app` module where *all* code lives — every feature, all the data and networking, all the UI. It's perfectly fine for a small app, but it becomes a problem as the app and team grow, because it has no enforced structure and no build parallelism.",
      },
      {
        t: "list",
        items: [
          "**No enforced boundaries** — any class can reach any other, so architectural layers (or feature separation) are convention-only and erode over time. The presentation code ends up reaching into data internals; features get tangled.",
          "**Slow builds** — any change recompiles the *entire* module. A one-line edit means the whole app rebuilds, with no compile avoidance and no parallelism — build times grow with the codebase.",
          "**Merge conflicts and team collisions** — everyone works in the same module, so multiple teams stepping on the same files causes constant conflicts.",
          "**No independent testing/delivery** — you can't build or test one feature in isolation, and you can't do on-demand feature delivery (Play Feature Delivery needs modules).",
        ],
      },
      {
        t: "p",
        text: "The core issue is that a monolith relies on *discipline* for structure, and discipline decays at the rate reviewers get tired. Modularization fixes each problem structurally: modules enforce boundaries (compile errors, not conventions), enable compile avoidance and parallelism (faster builds), let teams own modules (fewer conflicts), and allow independent testing/delivery. But — importantly — a monolith is *not* wrong for a small app; the problems are all scale problems. Modularizing a tiny app just adds overhead.",
      },
      {
        t: "note",
        text: "A monolithic `:app` module is fine when small but breaks at scale: no enforced boundaries (erode), whole-app recompiles (slow), team collisions, no independent build/delivery. All *scale* problems — don't modularize a tiny app to 'fix' them.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you decide where module boundaries should go?",
    a: [
      {
        t: "p",
        text: "Module boundaries should follow *how the code changes and who owns it* — the goal is that a typical change touches *one* module, and that modules map to team ownership and to reuse. The dominant strategy is to slice by *feature* (vertical) on top of *core* infrastructure (horizontal), because that matches how work actually happens.",
      },
      {
        t: "list",
        items: [
          "**By feature (vertical) — the primary axis** — one module per user-facing feature (`:feature:checkout`, `:feature:profile`). This matches *team ownership* (a team owns a feature end-to-end) and *build parallelism* (independent features build concurrently), and a feature change touches one module.",
          "**By layer for shared infra (horizontal)** — `:core:network`, `:core:database`, `:core:designsystem`, `:core:common` — infrastructure that features build on. These change independently of features and are reused by all.",
          "**The hybrid (what most large apps use)** — features sliced vertically, sitting on core layer modules, sometimes with each feature internally split into `:api`/`:impl`. This is the Now-in-Android shape.",
        ],
      },
      {
        t: "p",
        text: "The anti-pattern is modularizing *purely by layer* (`:presentation`, `:domain`, `:data` as three fat modules): every feature touches all three, so teams collide in the same modules, parallelism caps at three, and each layer becomes its own monolith. Pure-by-layer is the textbook answer; hybrid (feature slices on core layers) is the shipped answer.",
      },
      {
        t: "p",
        text: "The heuristics I apply: (1) does a typical change touch one module? (if a change always spans three modules, the boundary is wrong); (2) does the boundary match team ownership? (3) is there genuine reuse (core modules) vs feature-specific code? Module count should follow *team and feature boundaries*, not class count — you don't create a module per class, you create one per cohesive, independently-ownable unit of work.",
      },
      {
        t: "note",
        text: "Boundaries follow change + ownership: slice by *feature* (vertical, matches teams and parallelism) on top of *core* infra (horizontal, reused). Avoid pure-by-layer (every change spans all layers). Test: does a typical change touch one module?",
      },
    ],
  },
  {
    level: "senior",
    q: "How does modularization enable teams to work in parallel?",
    a: [
      {
        t: "p",
        text: "Modularization enables parallel teamwork by giving each team a module they *own* with a clear public API, so teams can work independently without stepping on each other — both at the code level (fewer merge conflicts) and the build level (faster feedback). It's often the *primary* motivation for modularization at large companies, ahead of even build speed.",
      },
      {
        t: "list",
        items: [
          "**Ownership with clear APIs** — a team owns `:feature:checkout`; other teams depend on its *public API* (ideally a `:feature:checkout:api` module of interfaces) without seeing or touching its internals. Teams contract through APIs, not through shared mutable code.",
          "**Fewer merge conflicts** — because teams work in *separate* modules and files, they rarely edit the same code. In a monolith, everyone shares files, so conflicts are constant. Modules physically separate the work.",
          "**Independent development and testing** — a team can build and test their module in isolation (or with a small demo/sandbox app that assembles just their feature), getting fast feedback without building the whole app.",
          "**CODEOWNERS mapping** — modules map cleanly to code ownership, so reviews route to the right team automatically.",
          "**Enforced contracts** — the api/impl split means a consuming team *cannot* accidentally depend on another team's implementation details (compile error), so teams can refactor their internals freely without breaking others.",
        ],
      },
      {
        t: "p",
        text: "The deeper point: this is really about *decoupling teams via decoupling code*. Conway's Law says software structure mirrors org structure — modularization deliberately shapes the code so that team boundaries and module boundaries align, letting teams move independently. This is why 'why modularize?' at scale is often answered 'team autonomy' first: it lets a 100-engineer org ship without constant coordination overhead, which is worth more than the build-speed win alone.",
      },
      {
        t: "note",
        text: "Modules give teams ownership + clear APIs, so they work in separate code (fewer conflicts), build/test in isolation (fast feedback), and can't touch each other's internals (enforced contracts). Team autonomy is often the *primary* reason to modularize at scale — decoupling teams by decoupling code.",
      },
    ],
  },
  {
    level: "junior",
    q: "What goes in a :core module, and what is the :core:common dumping-ground problem?",
    a: [
      {
        t: "p",
        text: "`:core:*` modules hold *shared infrastructure* that features build on — things that aren't user-facing features but are needed across the app. The idea is to extract genuinely reusable, cohesive infrastructure into focused modules. The danger is a `:core:common` (or `:core:utils`) that becomes a dumping ground for everything, which recreates the monolith's problems.",
      },
      {
        t: "list",
        items: [
          "**Good core modules (focused)** — `:core:network` (the HTTP client, interceptors), `:core:database` (Room setup, DAOs), `:core:designsystem` (theme, reusable components), `:core:model` (shared domain models), `:core:datastore` (preferences).",
          "**Each has a single, clear purpose** — you can name what it's *for*, and features depend only on the core modules they actually need.",
        ],
      },
      {
        t: "p",
        text: "The **`:core:common` dumping-ground problem**: a 'utils' or 'common' module that accumulates unrelated helpers (extensions, constants, base classes, a logger, date utils) and that *every other module depends on*. Because everything depends on it, any change to it recompiles the *entire* app — it becomes a new monolith bottleneck, defeating the point of modularization. And because it's a grab-bag, it has no coherent responsibility, so it grows unboundedly.",
      },
      {
        t: "list",
        items: [
          "**Why it's bad** — everything depends on it → every change to it recompiles the world (no compile avoidance); it violates single-responsibility (no clear purpose); it grows unboundedly.",
          "**The fix** — keep core modules *small and purposeful*; the moment `:core:common` accretes unrelated things, split it (`:core:logging`, `:core:datetime`, `:core:ui-utils`) so changes are localized and dependencies are precise. Not everything needs to be in a shared module.",
        ],
      },
      {
        t: "note",
        text: "Core modules = focused shared infra (`:core:network`, `:core:designsystem`), each with one clear purpose. The trap is `:core:common` — a dumping ground everything depends on, so every change recompiles the world. Split it the moment it accretes unrelated things.",
      },
    ],
  },
  {
    level: "senior",
    q: "What causes circular module dependencies, and how do you fix them?",
    a: [
      {
        t: "p",
        text: "A circular dependency is when module A depends on module B and B (directly or transitively) depends on A — which Gradle rejects as a *hard error* (the module graph must be a DAG, acyclic). It usually signals a *missing abstraction* or a *misplaced piece of code*: two modules both need something, so they reach into each other.",
      },
      {
        t: "list",
        items: [
          "**Cause 1 — a shared concept in the wrong place** — `:feature:a` and `:feature:b` both use a `User` model, so each imports the other's version, creating a cycle. Fix: extract the shared concept *downward* into a lower module (`:core:model`) that both depend on. This is the most common cause.",
          "**Cause 2 — feature-to-feature dependency** — `:feature:cart` needs to open `:feature:checkout`, and checkout needs something from cart. Fix: neither should depend on the other; use a *navigation contract* in a shared module (route definitions or a navigator interface that `:app` wires) so features depend on the abstraction, not each other.",
          "**Cause 3 — bidirectional coupling** — module A calls B and B calls back into A. Fix: introduce an *interface* — A defines an interface, B depends on and implements it, and the dependency now points one way (dependency inversion).",
        ],
      },
      {
        t: "code",
        title: "Breaking a cycle by extracting downward",
        code: `// CYCLE: :feature:a <-> :feature:b (both need SharedThing)
// FIX: extract SharedThing to a lower module both depend on
// :core:model  <-- :feature:a
//              <-- :feature:b
// Now the graph is acyclic: features -> core (downward only)`,
      },
      {
        t: "p",
        text: "The anti-fix to avoid: *merging* the two modules to kill the cycle. That papers over the real problem (a missing shared abstraction) and re-creates a bigger monolith. The right fix is almost always to *extract the shared thing downward* into a lower module, or *invert a dependency* with an interface — so the cycle becomes a clean one-directional DAG. A circular dependency is a design signal: it's telling you a shared concept wants its own home lower in the graph.",
      },
      {
        t: "note",
        text: "Circular deps = missing abstraction: two modules both need something. Fix by extracting the shared concept *downward* (to `:core:model`) or inverting a dependency with an interface — never by merging the modules (that rebuilds the monolith).",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the signs of over-modularization, and how do you avoid it?",
    a: [
      {
        t: "p",
        text: "Over-modularization is splitting into so many modules that the *overhead* (Gradle configuration, build-graph management, cross-module friction) exceeds the *benefit*. Like over-applying any architecture, it adds ceremony without payoff — modules are a tool with real fixed costs, not a free good.",
      },
      {
        t: "list",
        items: [
          "**Too many micro-modules** — 200 modules for a medium app where *configuration* time (Gradle evaluating the graph) exceeds actual *compile* time. Module count should follow team/feature boundaries, not class count.",
          "**A module per class/tiny-thing** — modules with one or two files, whose build-file overhead and dependency-declaration ceremony dwarf the code they contain.",
          "**Cross-module refactors constantly** — if a normal change routinely touches many modules and build files, the boundaries are wrong (too granular or misaligned).",
          "**Slower *clean* builds** — modularization speeds *incremental* builds but adds per-module overhead to clean builds; too many modules makes clean builds (and CI cold builds) slower.",
          "**Navigation overhead reading code** — following logic across a dozen tiny modules with api/impl splits for everything obscures more than it reveals.",
        ],
      },
      {
        t: "p",
        text: "How to avoid it: modularize based on *actual pain and actual boundaries*, not preemptively or maximally. Start with fewer, larger modules aligned to features and core infrastructure, and split further *only* when a module becomes too big to own, too slow to build, or shared by enough consumers to justify an api/impl split. The api/impl split in particular is worth it for the *hubs* of the dependency graph (core modules with many consumers), not every leaf. The mature stance: 'as many modules as buy team autonomy and build speed, and no more' — the same 'scale architecture to stakes' judgment as Clean Architecture.",
      },
      {
        t: "note",
        text: "Over-modularization signs: micro-modules where config time > compile time, module-per-class, constant cross-module refactors, slower clean builds. Avoid it by modularizing on *actual pain and boundaries*, not maximally — apply api/impl to graph *hubs*, not every leaf.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you share a design system (theme, components) across feature modules?",
    a: [
      {
        t: "p",
        text: "You put the design system in a dedicated `:core:designsystem` module that every feature depends on. It holds the theme (colors, typography, shapes) and the reusable UI components (buttons, cards, text fields), so all features render consistently and none reimplement the basics. Feature modules depend *downward* on it (feature → core:designsystem).",
      },
      {
        t: "code",
        title: ":core:designsystem structure",
        code: `// :core:designsystem module:
//   Theme.kt         -> MyAppTheme { MaterialTheme(colorScheme, typography, shapes, content) }
//   components/      -> AppButton, AppCard, AppTextField (reusable, styled)
//   tokens/          -> Spacing, Elevation (design tokens)

// A feature module depends on it:
// :feature:profile/build.gradle.kts
dependencies { implementation(project(":core:designsystem")) }

// and uses it:
@Composable fun ProfileScreen() {
    MyAppTheme {                      // shared theme
        AppButton(onClick = { }) { Text("Save") }   // shared component
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Consistency** — one place defines the look, so every feature is visually consistent and a rebrand touches one module.",
          "**No reimplementation** — features reuse `AppButton` etc. rather than each rolling their own styled button.",
          "**Depend on `implementation`** — features use the design system internally; unless a feature *re-exposes* design-system types in its public API, use `implementation` (not `api`) so a design-system change doesn't cascade-recompile every feature.",
          "**Screenshot-test the design system** — since it's shared and central, lock its components' appearance with screenshot tests (Paparazzi) so a change doesn't silently break every screen.",
        ],
      },
      {
        t: "p",
        text: "The design system is a canonical `:core` module — focused (one purpose: the visual language), reused by all features, and a great example of *good* modularization: extracting genuinely shared infrastructure so features don't duplicate it and stay consistent. It's also where a shared Compose theme naturally lives in a modularized app.",
      },
      {
        t: "note",
        text: "Put the theme + reusable components in `:core:designsystem`, depended on by every feature (via `implementation`). One place for the visual language = consistency + no reimplementation. Screenshot-test it since it's central.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do build cache and configuration cache help modular builds?",
    a: [
      {
        t: "p",
        text: "These two Gradle features are *essential* to realizing modularization's build-speed promise — modularization enables compile avoidance and parallelism, but the caches are what make repeated and CI builds fast. They cache *task outputs* and the *configuration phase* respectively.",
      },
      {
        t: "list",
        items: [
          "**Build cache** — caches the *outputs* of tasks (like compiling a module) keyed by their inputs. If a module's inputs haven't changed, Gradle reuses the cached output instead of rebuilding. Crucially, a **remote build cache** shares these outputs *across machines* — so on CI (or a teammate's machine), a module someone else already built is downloaded, not rebuilt. This compounds with modularization: unchanged modules are cache hits, so only genuinely-changed modules do work.",
          "**Configuration cache** — caches the result of Gradle's *configuration phase* (evaluating all the build scripts and building the task graph), so repeat builds skip re-configuring the project entirely. This is a big win precisely *because* modularization *increases* configuration cost — many modules mean many build scripts to evaluate, so caching that phase matters more the more modules you have.",
        ],
      },
      {
        t: "p",
        text: "The interaction is important: modularization *adds* configuration overhead (more modules = more scripts to configure), which the configuration cache offsets; and modularization *enables* compile avoidance, which the build cache amplifies (especially remotely, across CI/team). Without the caches, a heavily-modularized project can actually feel *slower* on some builds (config overhead) — with them, you get the full benefit (skip config, reuse unchanged module outputs across machines).",
      },
      {
        t: "p",
        text: "The practical requirements: configuration cache demands that your build logic be compatible (no cross-project configuration like `subprojects {}`/`allprojects {}` blocks, which break it — this is a reason convention plugins are preferred). And remote build cache needs a cache server (CI infrastructure). Together with `org.gradle.parallel` and `implementation` boundaries, these caches are what turn 'we modularized' into 'our builds are actually fast'.",
      },
      {
        t: "note",
        text: "Build cache reuses task outputs (remote = across CI/team machines — amplifies compile avoidance); configuration cache skips re-evaluating build scripts (offsets the config overhead many modules add). They're what makes modularization's build-speed promise real — and configuration cache is why you avoid `subprojects {}`.",
      },
    ],
  },
  {
    level: "senior",
    q: "Starting a brand-new project, how would you approach modularization?",
    a: [
      {
        t: "p",
        text: "For a brand-new project I would *not* over-modularize on day one — I'd start with a small, sensible structure and split further as the app and team grow, because modularization's ROI starts negative (fixed overhead) and rises with scale. Premature modularization adds ceremony before there's anything to gain from it.",
      },
      {
        t: "list",
        items: [
          "**Start small but with the right seams** — for a small new app, even a single module (or a handful) is fine. But I'd set up the *infrastructure* that makes later splitting cheap: a version catalog (`libs.versions.toml`) and convention plugins from the start, so adding a module later is a one-line build file.",
          "**Establish core modules early if reuse is clear** — if I know there'll be a shared design system, network layer, and database, I might create `:core:designsystem`, `:core:network`, `:core:database` early, since those are stable, obviously-shared, and cheap to extract.",
          "**Add feature modules as features grow** — start features in the app module or a single feature module, and split into `:feature:*` when a feature becomes substantial or gets its own team/owner. Let boundaries emerge from real features, not speculation.",
          "**Adopt the hybrid target shape** — plan toward the Now-in-Android structure (feature slices on core layers, downward DAG), but *arrive* there incrementally rather than building 20 modules before writing a screen.",
        ],
      },
      {
        t: "p",
        text: "The judgment: I'd rather *under*-modularize early and split when pain appears (slow builds, a feature too big to own, team growth) than over-modularize and carry the overhead prematurely. But I'd invest early in the *cheap enablers* — version catalog, convention plugins, and the discipline of `implementation`-by-default and no feature-to-feature deps — so that when I *do* split, it's fast and the boundaries are already clean. The mistake I'd avoid is copying a big app's 30-module structure onto a 2-screen MVP: that's ceremony, and modularization should follow the project's actual scale and team.",
      },
      {
        t: "note",
        text: "New project: start small (few modules), but set up the cheap enablers early (version catalog, convention plugins, `implementation`-by-default). Extract obvious core modules; add feature modules as features grow. Split on real pain, not speculation — don't copy a big app's 30-module structure onto an MVP.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does modularization enable dynamic feature delivery, and what's the catch?",
    a: [
      {
        t: "p",
        text: "Modularization is a *prerequisite* for Play Feature Delivery — delivering parts of your app *on demand* rather than at install. A **Dynamic Feature Module** is a special module whose code and resources are downloaded only when the user needs the feature, keeping the initial install small. But it comes with a significant catch around dependency injection.",
      },
      {
        t: "list",
        items: [
          "**On-demand delivery** — a rarely-used feature (a complex editor, a one-time onboarding flow) can be a dynamic module the user downloads only when they open it, so the base install stays small. Also supports conditional delivery (by device capability) and instant delivery.",
          "**Built on the App Bundle** — Play generates the dynamic feature's APK separately and delivers it when requested via the Play Core / Feature Delivery API.",
          "**Requires modularization** — you can't have dynamic features without splitting the app into modules first; it's a payoff of the modular structure.",
        ],
      },
      {
        t: "p",
        text: "**The catch — the dependency graph inverts.** Normally modules flow `:app` → `:feature` (the app depends on features), so DI frameworks like Hilt can aggregate the features' bindings. But a *dynamic feature module depends on `:app`* (the reverse), so at compile time the app can't see the dynamic module's code — meaning Hilt's compile-time aggregation *can't reach it*, and you **can't use `@AndroidEntryPoint`/standard Hilt injection** in a dynamic feature module.",
      },
      {
        t: "list",
        items: [
          "**The workaround** — use Hilt's `@EntryPoint` + `EntryPointAccessors`: define an interface listing what the dynamic module needs, install it in the app's component, and fetch dependencies *reflectively at runtime* from the dynamic module. Clunky by design, because you're reaching into a graph the module can't participate in normally.",
          "**Other frictions** — resource access, navigation into the dynamic feature, and testing all become more involved. Some heavily-dynamic apps prefer Koin (runtime DI) precisely because its resolution doesn't care about the compile-time graph direction.",
        ],
      },
      {
        t: "p",
        text: "So the honest summary: modularization *unlocks* on-demand delivery (a real benefit for install size), but dynamic feature modules invert the dependency graph in a way that breaks standard Hilt injection, forcing the `@EntryPoint` workaround. Knowing this trade-off (and *why* — the inverted graph) distinguishes someone who's shipped dynamic features from someone who's only read about them.",
      },
      {
        t: "note",
        text: "Modularization unlocks on-demand delivery (Dynamic Feature Modules → smaller installs). The catch: dynamic modules depend *on* `:app` (inverted graph), so Hilt can't aggregate their bindings — you need `@EntryPoint` + `EntryPointAccessors`. Koin's runtime resolution sidesteps this.",
      },
    ],
  },
  {
    level: "junior",
    q: "Show a feature module's build.gradle.kts and explain each dependency.",
    a: [
      {
        t: "p",
        text: "A feature module's build file is where you declare what the module *is* (via a convention plugin) and what it *depends on*. Keeping it small and declarative is a sign of a well-set-up modular project — the shared configuration lives in the convention plugin, so the feature file is mostly its unique dependencies.",
      },
      {
        t: "code",
        title: "A feature module build file",
        code: `// :feature:profile/build.gradle.kts
plugins {
    id("myapp.android.feature")     // convention plugin: applies AGP, Kotlin, Compose,
                                     // sets SDK versions, adds common deps (designsystem, etc.)
}
android { namespace = "com.myapp.feature.profile" }

dependencies {
    implementation(project(":core:data"))     // uses repositories — internal, won't leak
    implementation(project(":core:model"))     // domain models
    // designsystem + common come from the convention plugin, not repeated here

    implementation(libs.androidx.lifecycle.viewmodel.compose)   // from version catalog
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
}`,
      },
      {
        t: "list",
        items: [
          "**`plugins { id(\"myapp.android.feature\") }`** — a convention plugin that captures *all* the shared config (compile SDK, Compose setup, common dependencies), so this file stays tiny and consistent with every other feature.",
          "**`implementation(project(\":core:data\"))`** — a project dependency using `implementation` (not `api`) so this module's *consumers* don't recompile when `:core:data`'s internals change, and can't see `:core:data`'s types.",
          "**`libs.xxx`** — type-safe accessors from the version catalog (`libs.versions.toml`), so versions live in one place, not hardcoded here.",
          "**`ksp(libs.hilt.compiler)`** — KSP (not KAPT) for Hilt's annotation processing — faster builds.",
        ],
      },
      {
        t: "p",
        text: "The takeaway: in a well-structured modular project, a feature's build file is *minimal* — a convention plugin line, a namespace, and a short list of `implementation(project(...))` and `libs.*` dependencies. If a feature build file is long and full of repeated config (compile SDK, Compose options, common libraries copy-pasted), that's a smell — that config belongs in a convention plugin. Small, declarative build files are a hallmark of good modularization.",
      },
      {
        t: "note",
        text: "A well-set-up feature build file is tiny: a convention plugin line + namespace + a short list of `implementation(project(...))` and `libs.*` deps. Long build files with repeated config are a smell — that belongs in a convention plugin.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you keep the module dependency graph healthy over time?",
    a: [
      {
        t: "p",
        text: "A module graph degrades the same way any architecture does — through small, individually-reasonable additions that accumulate into tangle. Keeping it healthy means *enforcing* the graph's invariants automatically (not by review vigilance) and periodically inspecting it, because the graph *is* the architecture and a bad graph erases modularization's benefits.",
      },
      {
        t: "list",
        items: [
          "**Enforce the DAG rules with tooling** — no feature→feature edges, no upward dependencies, no cycles (Gradle catches cycles; you add checks for the rest). Module-graph-assertion plugins validate the actual dependency graph against a declared spec and *fail the build* on a forbidden edge — turning graph erosion into a red build.",
          "**Default to `implementation`, audit `api`** — `api` leakage is the silent killer of build speed (it cascades recompilation); periodically audit with build scans and demote unnecessary `api` to `implementation`. This keeps compile avoidance working.",
          "**Watch for god-modules** — a `:core:common` that everything depends on, or a module whose fan-in keeps growing, is becoming a bottleneck; split it before every change recompiles the world.",
          "**Visualize the graph** — generate and review the module dependency graph (Graphviz/module-graph plugins) periodically to spot the DAG getting deeper (kills parallelism), sideways edges creeping in, or hubs forming.",
          "**Structural prevention** — `internal` visibility + api/impl splits make forbidden dependencies *non-compilable* (can't import what you can't see), which is stronger than any CI check.",
          "**CODEOWNERS on build files** — route new dependency edges to the platform team for review, so graph changes are deliberate.",
        ],
      },
      {
        t: "p",
        text: "The principle: every architecture decays at the rate reviewers get tired, so durable graph health comes from *machine-checked invariants* (module-graph assertions in CI, structural visibility) rather than convention. Modularization's benefits — enforced boundaries, build speed, team autonomy — *all* depend on the graph staying a clean, wide, acyclic DAG with `implementation` boundaries. Let the graph erode (sideways edges, `api` leakage, god-modules, deepening chains) and you get the overhead of modules with none of the payoff. So healthy-graph maintenance is the ongoing discipline that keeps modularization worth it.",
      },
      {
        t: "note",
        text: "Keep the graph healthy with machine-checked invariants (module-graph assertions fail the build on forbidden edges), `implementation`-by-default with `api` audits, splitting god-modules, and periodic graph visualization. The graph *is* the architecture — let it erode and you get module overhead with no payoff.",
      },
    ],
  },
];

export default qa;
