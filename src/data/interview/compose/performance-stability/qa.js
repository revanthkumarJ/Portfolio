// Performance & Stability — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What does it mean for a composable to be 'skippable', and why does it matter for performance?",
    a: [
      {
        t: "p",
        text: "**The concept**: when Compose is about to recompose a composable, it can sometimes avoid running it at all. If the composable is **skippable**, Compose compares its current parameters to the values from last time — and if they're all equal, it **skips** executing the function entirely and reuses the previous UI. A skippable composable that gets the same inputs is essentially free.",
      },
      {
        t: "p",
        text: "**Why it matters**: Compose's whole performance model depends on skipping. A state change high in the tree triggers recomposition, but the intent is that *most* of the tree skips — only the few composables whose data actually changed re-execute. When skipping works, a screen recomposes a handful of small functions per change. When skipping *fails* (a composable is not skippable, or its inputs look changed when they aren't), composables re-run needlessly, and that wasted work is what shows up as jank. So 'is this composable skippable, and are its inputs stable?' is the central performance question.",
      },
    ],
  },
  {
    level: "junior",
    q: "What makes a type 'stable' or 'unstable' in Compose, and why is List unstable?",
    a: [
      {
        t: "p",
        text: "**The concept**: for Compose to skip a composable, it must trust two things about each parameter's type. One: `equals()` reliably tells whether anything recomposition-relevant changed. Two: if a property *does* change, Compose is notified — meaning the type is either immutable, or backed by observable snapshot state. A type satisfying both is **stable**; Compose can compare it and skip. A type that might change without notice, or whose equality can't be trusted, is **unstable** — and Compose responds by *never* skipping composables that take it, re-running them on every parent recomposition to be safe.",
      },
      {
        t: "p",
        text: "**Why `List` is unstable** (the classic gotcha): `List` is an *interface*. A value typed as `List<Item>` could actually be a `MutableList` underneath — the type gives Compose no guarantee it won't change. Since Compose can't prove immutability from the declared type, it conservatively marks `List` unstable. The surprising consequence: `fun Row(items: List<Item>)` recomposes even when you *never* mutate the list, purely because the *type* doesn't promise immutability.",
      },
      {
        t: "list",
        items: [
          "**Stable by default**: primitives, `String`, lambdas, `MutableState`, and classes the compiler infers immutable.",
          "**Unstable by default**: `List`/`Map`/`Set` (interfaces), any class with a `var`, any class holding an unstable property, and types from modules without the Compose compiler (a `Date`, a model from a pure-Kotlin module).",
          "**Fixes**: use `ImmutableList`/`persistentListOf()` from kotlinx-collections-immutable (compiler-verified immutable), or wrap in an `@Immutable` data class.",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "What are @Stable and @Immutable annotations and when do you use them?",
    a: [
      {
        t: "p",
        text: "**The concept**: sometimes *you* know a type is stable but the *compiler can't prove it* — for example it holds a `List` you promise never to mutate, or it comes from a module the Compose compiler doesn't process. These annotations let you **promise** stability, which the compiler then trusts without verifying.",
      },
      {
        t: "list",
        items: [
          "**`@Immutable`** — the strong promise: every public property is a `val` and nothing changes after construction (all the way down). Use it on read-only UI models (`@Immutable data class ProfileUi(...)`). Instances become fully comparable by `equals` for skipping.",
          "**`@Stable`** — the weaker promise: the object *may* have changing state, but every change is exposed through snapshot state (so Compose gets notified) and `equals` is consistent. Use it on observable holders.",
        ],
      },
      {
        t: "p",
        text: "**The critical caveat**: these are promises, not checks. If you annotate a class `@Immutable` and then actually mutate its list, Compose will trust the promise and skip recompositions it *shouldn't* — leaving **stale UI** that silently shows old data. That's a genuinely hard bug to track down. So only annotate what's truly immutable. The safer path when possible: use `ImmutableList`/`persistentListOf` so the compiler *knows* the truth and you never have to promise anything.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you find out which composables are recomposing too much?",
    a: [
      {
        t: "p",
        text: "**The primary tool is the Layout Inspector in Android Studio.** With the app running, it shows a live tree of composables with two counts per node: how many times each **recomposed** and how many times it **skipped**. You interact with the app and watch the numbers — a composable whose recomposition count climbs while you do something unrelated to it (a static header incrementing during scroll, say) is your culprit. Healthy nodes show lots of skips and few recompositions; a problem node shows the opposite.",
      },
      {
        t: "p",
        text: "**Then, to find *why*, use the Compose Compiler Reports**: a compiler flag makes the build emit files that classify every composable as skippable/restartable and every class as stable/unstable — *with reasons*. So once Layout Inspector tells you *which* composable, the reports tell you *which parameter's type* is unstable and defeating skipping. For real jank numbers on release builds, `Macrobenchmark` with `FrameTimingMetric` measures actual frame durations. The workflow is: Layout Inspector (where) → Compiler Reports (why) → fix → Macrobenchmark (confirm).",
      },
    ],
  },
  {
    level: "junior",
    q: "Why should you never judge Compose performance on a debug build?",
    a: [
      {
        t: "p",
        text: "**The concept**: a debug build is deliberately un-optimized. It has no R8/minification, it includes extra Compose runtime assertions and debugging hooks, and — most importantly — its code runs through the JIT compiler *as you use it* rather than being precompiled. There's no baseline profile applied. So scrolling a list in debug means the device is literally compiling the scroll code on the fly, mid-gesture.",
      },
      {
        t: "p",
        text: "**The consequence**: debug builds are *expected* to be janky, sometimes dramatically so, even when the code is perfectly optimized. A huge fraction of 'my Compose list stutters' reports simply disappear when tested on a release build. So the rule is: always measure performance on a **release (minified) build**, ideally with baseline profiles, before concluding anything is wrong. Saying this first in an interview shows you know the difference between a real problem and a measurement artifact.",
      },
    ],
  },
  {
    level: "senior",
    q: "Walk through diagnosing and fixing a screen that recomposes excessively.",
    a: [
      {
        t: "list",
        items: [
          "**0. Confirm it's real**: reproduce on a *release* build. Rule out the debug-JIT artifact before spending time.",
          "**1. Locate (where)**: Layout Inspector recomposition/skip counts while interacting. Identify the composable(s) whose recomposition count grows disproportionately — e.g. a whole list item recomposing on every keystroke in an unrelated search box.",
          "**2. Explain (why)**: enable Compose Compiler Reports. Look up the offending composable — is it marked `skippable`? If not, which parameter is `unstable`? Trace the unstable type (usually a `List`, a model with a `var`, or a class from a non-Compose module).",
          "**3. Fix at the root — stability**: convert list params to `ImmutableList`/`persistentListOf`; make UI models immutable data classes; `@Immutable`-annotate models from modules the compiler can't see; replace `var`s with `val` + copy.",
          "**4. Fix scope size**: if a big parent scope invalidates on a value only a child needs, read the value lower — pass a lambda (`() -> T`) that reads it where used, shrinking the invalidated scope. Don't hoist state higher than its consumers.",
          "**5. Fix high-frequency reads**: for scroll/drag/animation, defer the read to layout/draw via lambda modifiers (`Modifier.offset { }`, `graphicsLayer { }`) or funnel through `derivedStateOf` so composition doesn't re-run per frame.",
          "**6. Keys**: in lazy lists, ensure stable `key = { it.id }` to stop cascade recomposition on data changes.",
          "**7. Verify**: re-check Layout Inspector counts and Macrobenchmark frame timings to confirm the fix, not just assume it.",
        ],
      },
      {
        t: "p",
        text: "The senior signal is the *ordered, measurement-driven* process — locate with tools, explain with reports, fix the root cause (usually stability), verify with numbers — rather than reflexively sprinkling `remember` and `derivedStateOf` hoping something helps.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is 'strong skipping mode' and how did it change stability best practices?",
    a: [
      {
        t: "p",
        text: "**The background**: originally, if a composable had *any* unstable parameter, it was not skippable at all — Compose re-ran it on every parent recomposition. That made the classic advice near-absolute: wrap every `List` in `ImmutableList`, make every model stable, or nothing skips. It was a lot of ceremony, and unstable models from other modules were a constant headache.",
      },
      {
        t: "p",
        text: "**What strong skipping changed** (Compose compiler 2.x, now the default): composables with unstable parameters become **skippable anyway**, by comparing those unstable parameters using **instance equality (`===`)** instead of giving up. So if the parent passes the *same instance* of an unstable list, the child now skips. Additionally, **lambdas are automatically remembered**, which eliminated a whole category of manual `remember { }` workarounds that existed because a fresh lambda instance each recomposition used to break a child's skippability.",
      },
      {
        t: "list",
        items: [
          "**The best-practice shift**: from *'make everything stable or nothing skips'* to *'don't create new instances of your data on every recomposition.'* Instance equality only helps if you pass the same instance.",
          "**What still bites**: computing a new collection inline in the body — `items.filter { it.active }` passed to a child — produces a *new* list instance each recomposition, fails `===`, and still recomposes. Fix by remembering the derived list (`remember(items) { items.filter { } }`) or computing it in the ViewModel.",
          "**Stability still matters** for correctness of `equals`-based skipping of *stable* types and for readability of compiler reports — strong skipping raises the floor, it doesn't make stability irrelevant. The mature answer notes both: less manual ceremony now, but 'same instance' discipline replaced 'stable type' discipline rather than removing it.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "How does deferring state reads across the three phases optimize performance? Give a concrete example.",
    a: [
      {
        t: "p",
        text: "**The concept**: a Compose frame has three phases — composition (run composables), layout (measure/place), draw (paint). Crucially, *the phase in which you read a state value determines which phases must re-run when that value changes*. Read a value during composition and a change forces composition → layout → draw (the full pipeline). Read the *same* value only during layout, and a change skips composition and re-runs just layout → draw. Read it only during draw, and only draw re-runs. For a value that changes 60 times a second (a drag or animation), reading it in composition means recomposing 60 times a second — usually the actual cause of animation jank.",
      },
      {
        t: "code",
        title: "The same animation, three cost levels",
        code: `// WORST: reads animated offset in COMPOSITION -> recomposes every frame
Box(Modifier.offset(x = animatedX.value.dp))

// BETTER: lambda form reads during LAYOUT -> composition skipped
Box(Modifier.offset { IntOffset(animatedX.value.roundToPx(), 0) })

// For pure visual props (alpha, scale, rotation, color): DRAW only
Box(Modifier.graphicsLayer { alpha = animatedAlpha.value })`,
      },
      {
        t: "list",
        items: [
          "**The mechanism**: the *lambda* forms of `offset`, and `graphicsLayer`/`drawBehind`/`drawWithContent`, take a lambda that Compose invokes during the layout or draw phase. By reading the state *inside* that lambda, the read is recorded against the layout/draw phase, not composition — so the state change invalidates only that phase.",
          "**Concrete win**: animating position with `Modifier.offset(x = state.dp)` recomposes the composable (and re-skips its children, re-diffs, etc.) every frame; switching to `Modifier.offset { }` drops composition work to zero and the animation just re-lays-out — often the difference between 60fps and dropped frames on a complex element.",
          "**Rule of thumb**: any value that changes at animation/gesture frequency should be read as *late* as possible — draw if it's purely visual (alpha, scale, color), layout if it's positional, and only composition if it genuinely changes *what* is composed.",
          "This pairs with `derivedStateOf` (reduce read *frequency*) — deferring reduces *phase cost per read*, derivedStateOf reduces *number of invalidations*; together they handle most high-frequency-state performance issues.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "What are Baseline Profiles, why do they matter for Compose specifically, and how do you create one?",
    a: [
      {
        t: "p",
        text: "**The problem they solve**: Android ships apps as DEX bytecode that must be compiled to native code to run fast. Without help, this happens *just-in-time* — the device compiles hot methods as they first execute. For Compose that's especially painful: the composition/layout machinery and your screen code all compile *during* the user's first launch and first scroll, causing cold-start lag and initial-scroll jank even in a clean codebase.",
      },
      {
        t: "p",
        text: "**What a Baseline Profile is**: a shipped list of the app's hot classes and methods (the critical startup and scroll paths) that the Android runtime **ahead-of-time compiles at install time**. So on the very first launch, those paths are already native — no mid-interaction JIT. The measured impact is significant: commonly **20–40% faster cold startup** and markedly smoother first scroll of the main list.",
      },
      {
        t: "list",
        items: [
          "**How you create it**: write a `Macrobenchmark` test using `BaselineProfileRule` that drives the critical user journeys — launch the app, scroll the main feed, open key screens. Running it records the exercised methods into a `baseline-prof.txt` bundled with the app; the Baseline Profile Gradle plugin automates generating and packaging it.",
          "**Compose-specific note**: Compose *libraries* ship their own baseline profiles, so the framework's internals are covered — but *your app's* screens aren't, so you must generate a profile for your own critical journeys to get the app-level benefit.",
          "**Where it fits in the performance story**: when a list is janky and the *code is already clean* (stable types, keys, deferred reads), a baseline profile is often the remaining big win — and it's the correct answer to 'first scroll always stutters but subsequent scrolls are fine' (that pattern is classic JIT-on-first-use).",
          "**Related lever**: `startup profiles` (a variant applied at build/dexlayout time) and keeping `Application.onCreate` lean; baseline profiles primarily target cold start and first-use compilation.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "A data class parameter to a composable is unstable because it has one property from a non-Compose module. What are your options?",
    a: [
      {
        t: "p",
        text: "**Why this happens**: stability is *transitive* — a data class is only inferred stable if *all* its properties are stable. If one property is a type from a module the Compose compiler doesn't process (say a `java.util.Date`, a protobuf-generated class, or a model from a pure-Kotlin `:core:model` module that doesn't apply the Compose compiler), the compiler can't prove that property stable, so it marks the whole enclosing data class unstable — and every composable taking it becomes non-skippable.",
      },
      {
        t: "list",
        items: [
          "**Option 1 — annotate the holder `@Immutable`/`@Stable`**: if the class is genuinely immutable, `@Immutable data class Foo(val date: Date)` promises stability and restores skippability. Cheap, but a *promise* — only valid if it's truly immutable, and it doesn't help other composables using `Date` directly.",
          "**Option 2 — map to a UI model** at the ViewModel boundary: convert the foreign property into a stable type (e.g. `Date` → a preformatted `String` or an epoch `Long`) so the UI model is inferred stable with no annotation and no promise. Often the *best* answer because the UI should receive render-ready data anyway (formatting belongs in the ViewModel), so this fixes stability *and* layering at once.",
          "**Option 3 — the `stability configuration file`**: the Compose compiler lets you list external classes to *treat as stable* project-wide (e.g. add `java.time.LocalDate` to `stability_config.conf`). Ideal for widely-used third-party types you can't annotate and know are immutable — one config entry fixes them everywhere.",
          "**Option 4 — apply the Compose compiler to your own modules**: if the unstable type is *your* model in a `:core:model` module, applying the Compose compiler plugin there lets it infer stability normally (an immutable data class becomes stable automatically). Best for first-party code.",
          "**Option 5 — rely on strong skipping**: with strong skipping on, if the caller passes the *same instance*, the composable skips via `===` even with the unstable param — sometimes 'good enough' without changing types, as long as you're not creating new instances each recomposition.",
        ],
      },
      {
        t: "p",
        text: "The senior instinct: prefer the fix that also improves the design — mapping to a render-ready UI model (Option 2) or compiling your own modules (Option 4) — over sprinkling `@Immutable` promises you have to keep true forever.",
      },
    ],
  },
  {
    level: "junior",
    q: "What actually happens during recomposition, and why is it usually cheap?",
    a: [
      {
        t: "p",
        text: "Recomposition re-executes the composable functions whose observed state changed, producing an updated description of the UI; Compose then diffs that against the current slot table and applies only the differences to the LayoutNode tree. It's usually cheap because Compose *skips* composables whose inputs didn't change (positional memoization) and only re-runs the small subtrees that actually depend on the changed state.",
      },
      {
        t: "list",
        items: [
          "**Only affected scopes re-run** — the 'restart scope' reading the changed state re-executes; unrelated composables are skipped.",
          "**Skipping** — a composable with unchanged, stable inputs is skipped entirely (its previous output is reused).",
          "**Donut-hole skipping** — a parent can recompose while its children are skipped (and vice-versa), so a state change high up doesn't force everything below to re-run.",
          "**Then layout/draw** — recomposition only rebuilds the composition; layout and draw run only for nodes that changed, often skipped too.",
        ],
      },
      {
        t: "note",
        text: "Recomposition re-runs only the composables reading changed state, diffs the result, and applies minimal updates to the node tree. It's cheap because of skipping (unchanged stable inputs → skip) and donut-hole skipping (parent recomposes while children don't). Layout/draw then run only for changed nodes.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does the Compose compiler determine stability, and what are the exact rules?",
    a: [
      {
        t: "p",
        text: "The Compose compiler infers whether each type is *stable* — meaning Compose can trust that `equals` reflects real change and that its public properties won't mutate without notice. Stability drives skipping: a composable is skippable only if all its parameters are stable. The compiler applies concrete rules and marks each type stable or unstable.",
      },
      {
        t: "list",
        items: [
          "**Primitives, String, function types** — stable.",
          "**A class is stable if** all its public `val` properties are of stable types *and* it has no public `var` (mutable) properties. `data class User(val id: Int, val name: String)` → stable.",
          "**`var` property → unstable** — a public `var` means it can mutate silently, so Compose can't trust `equals`.",
          "**Interfaces/abstract types → unstable by default** — the compiler can't see the implementation (e.g. `List` is an interface; the runtime could be a mutable list), so `List`, `Map`, `Set` are treated unstable.",
          "**Classes from other modules without the Compose compiler** — treated unstable (the compiler couldn't analyze them).",
          "**`MutableState`, stable collections (`ImmutableList`), and `@Stable`/`@Immutable`-annotated types** — stable.",
        ],
      },
      {
        t: "note",
        text: "A type is stable if equals reflects real change and its public props can't mutate unnoticed: primitives/String/lambdas stable; a class is stable iff all public props are stable vals with no public var; interfaces (List/Map/Set) and other-module classes are unstable by default. Skippable requires ALL params stable.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you generate and inspect Compose compiler metrics/stability reports?",
    a: [
      {
        t: "p",
        text: "The Compose compiler can emit *stability reports* and *metrics* — text files listing which composables are skippable/restartable and which classes are stable/unstable, with the reason. You enable them via compiler options, then read the generated files to find the exact parameters hurting performance.",
      },
      {
        t: "code",
        title: "Enabling compiler reports (Gradle)",
        code: `// build.gradle(.kts) — Compose compiler options
composeCompiler {
    reportsDestination = layout.buildDirectory.dir("compose_reports")
    metricsDestination = layout.buildDirectory.dir("compose_metrics")
}
// Older setups pass -P plugin:androidx.compose.compiler...reportsDestination=...
// Outputs: *-composables.txt (skippable/restartable), *-classes.txt (stable/unstable + why)`,
      },
      {
        t: "list",
        items: [
          "**`*-composables.txt`** — lists each composable as `restartable skippable` or not, and flags unstable params.",
          "**`*-classes.txt`** — lists each class `stable`/`unstable` and *why* (e.g. 'unstable field items: List').",
          "**Use it to target fixes** — instead of guessing, you see exactly which type is unstable and can annotate it, wrap it, or use an immutable collection.",
          "**Also — Layout Inspector** shows live recomposition counts at runtime; the reports are the *static* view.",
        ],
      },
      {
        t: "note",
        text: "Enable composeCompiler { reportsDestination / metricsDestination } to emit stability reports: *-composables.txt (skippable/restartable + unstable params) and *-classes.txt (stable/unstable + reason). They tell you EXACTLY which type is unstable so you fix the right thing. Pair with Layout Inspector's live recomposition counts.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you make a List parameter stable so a composable can skip?",
    a: [
      {
        t: "p",
        text: "`List` is an interface, so the compiler treats it as unstable (the runtime could be a mutable list). To make a composable taking a list skippable, either use `kotlinx.collections.immutable`'s `ImmutableList`/`PersistentList` (recognized as stable), wrap it in a `@Immutable` holder, or configure a stability-config file to mark `List` stable if you guarantee immutability.",
      },
      {
        t: "code",
        title: "Stable list options",
        code: `// Option 1: kotlinx.collections.immutable (recommended)
@Composable fun Items(list: ImmutableList<Item>) { /* now skippable */ }
val list = persistentListOf(a, b, c)

// Option 2: @Immutable wrapper
@Immutable data class ItemList(val items: List<Item>)

// Option 3: stability config file listing kotlin.collections.List as stable
// (stabilityConfigurationFile) — only if you guarantee you never mutate them`,
      },
      {
        t: "list",
        items: [
          "**`ImmutableList`/`persistentListOf`** — the idiomatic fix; the compiler knows these can't mutate, so it's stable and the composable skips.",
          "**`@Immutable` wrapper** — annotate a holder class as a promise of immutability.",
          "**Stability config file** — globally mark `List`/`Map` stable; convenient but a *promise* — if you ever pass a mutable list, you get stale UI.",
          "**Strong skipping mode** changes this calculus (see the strong-skipping question) — it can skip even with unstable params, but stability still helps.",
        ],
      },
      {
        t: "note",
        text: "List is an interface → unstable. Fix with ImmutableList/persistentListOf (kotlinx.collections.immutable — compiler treats as stable), an @Immutable wrapper class, or a stability config marking List stable (a promise — mutating it later = stale UI). Strong skipping softens this but stability still helps.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why can passing a lambda cause recomposition, and how do you keep lambdas stable?",
    a: [
      {
        t: "p",
        text: "A lambda that captures unstable values, or is re-created each recomposition, can be an unstable parameter that defeats skipping. The Compose compiler *memoizes* many lambdas automatically (so an unchanging lambda is stable across recompositions), but lambdas capturing changing state, or created in ways the compiler can't memoize, can still churn.",
      },
      {
        t: "list",
        items: [
          "**Compiler auto-memoization** — a lambda like `{ viewModel.onClick() }` with stable captures is remembered, so it's the same instance across recompositions → stable, doesn't break skipping.",
          "**Method references** — `onClick = viewModel::onClick` are stable and cheap; prefer them.",
          "**Capturing changing values** — `{ onSelect(index) }` where `index` changes creates a new lambda each time; that's often fine, but in hot paths hoist or key it.",
          "**Explicit `remember`** — for an expensive-to-create callback, `val cb = remember { { ... } }`, but usually unnecessary given auto-memoization.",
          "**Strong skipping mode** memoizes lambdas more aggressively, reducing this concern.",
        ],
      },
      {
        t: "note",
        text: "Lambdas can be unstable params if re-created each recomposition or capturing changing state — defeating skipping. The compiler auto-memoizes lambdas with stable captures (so most are fine); prefer method references (viewModel::onClick). Strong skipping memoizes lambdas more aggressively. Only hand-remember callbacks in proven hot paths.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain the three phases (composition, layout, draw) and how skipping works in each.",
    a: [
      {
        t: "p",
        text: "Each frame, Compose runs up to three phases: **composition** (run composables to build/update the tree of what to show), **layout** (measure and place each node), and **draw** (paint each node). Crucially, a state change only invalidates the phase(s) that read it — so changing a color skips composition/layout and only redraws, and changing an offset via `graphicsLayer` skips composition/layout too.",
      },
      {
        t: "list",
        items: [
          "**Composition** — 'what to show'; re-runs only invalidated composables (skipping the rest).",
          "**Layout** — 'where/how big'; re-measures only nodes whose size/position inputs changed.",
          "**Draw** — 'how it looks'; re-draws only nodes whose draw inputs changed.",
          "**Phase-targeted invalidation** — reading state in a *later* phase avoids the earlier ones. `Modifier.offset { }`/`graphicsLayer { }` lambdas and `drawBehind { }` defer reads to layout/draw, so animating them skips recomposition entirely.",
        ],
      },
      {
        t: "code",
        title: "Deferring a read to the draw phase",
        code: `// Reads scrollState in COMPOSITION -> recomposes every scroll frame (bad)
Box(Modifier.offset(y = scrollState.value.dp))
// Reads in LAYOUT via lambda -> skips recomposition (good)
Box(Modifier.offset { IntOffset(0, scrollState.value) })`,
      },
      {
        t: "note",
        text: "Frame phases: composition (what) → layout (where/size) → draw (paint). A state change invalidates only the phase(s) that read it. Defer reads to later phases (offset{}/graphicsLayer{} lambdas, drawBehind{}) so animating position/color skips recomposition and layout — the core Compose perf technique.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between recomposition, relayout, and redraw for performance?",
    a: [
      {
        t: "p",
        text: "These are the three kinds of work Compose can redo, in increasing cheapness of avoidance: *recomposition* (re-run composables) is what people usually optimize, but *relayout* (re-measure/place) and *redraw* (re-paint) also cost — and an inefficient layout or overdraw can jank even with zero excess recomposition. Diagnosing jank means knowing which one is happening.",
      },
      {
        t: "list",
        items: [
          "**Recomposition** — re-executing composables; caused by state reads in composition. Reduce with stability/skipping and deferring reads.",
          "**Relayout** — re-measuring; caused by size/position-affecting changes (animating `size`, `padding`, `offset(dp)`). Reduce by using `graphicsLayer`/`offset{}` for movement.",
          "**Redraw** — re-painting; caused by color/alpha/drawing changes. Usually cheap, but *overdraw* (many layers painted over each other) is a separate cost.",
          "**Why it matters** — 'too many recompositions' isn't the only cause of jank; a single composition that triggers expensive layout every frame janks too. Profile to see which phase is hot.",
        ],
      },
      {
        t: "note",
        text: "Three redo-costs: recomposition (re-run composables), relayout (re-measure/place), redraw (re-paint). Jank isn't only 'too many recompositions' — animating size/padding causes relayout, and overdraw costs draw. Use graphicsLayer/offset{} to move things without relayout, and profile to see which phase is hot.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you use the Layout Inspector to find recomposition counts?",
    a: [
      {
        t: "p",
        text: "Android Studio's **Layout Inspector** shows, for a running app, each composable with its **recomposition count** and **skip count** live. You interact with the app and watch which composables' counts climb unexpectedly — those are recomposing more than they should, pointing you to the state read or unstable param to fix.",
      },
      {
        t: "list",
        items: [
          "**Enable recomposition counts** — in Layout Inspector, turn on the recomposition-count column; interact and watch the numbers.",
          "**High recomposition + low skip** — a composable that keeps recomposing and rarely skips is a suspect (likely an unstable param or a too-high state read).",
          "**High skip count is good** — it means stability is working.",
          "**Complements the static reports** — the compiler stability report tells you *what's unstable*; Layout Inspector tells you *what's actually recomposing at runtime*. Use both.",
          "**Also useful** — Modifier.Node counts and the composition tree to see donut-hole skipping in action.",
        ],
      },
      {
        t: "note",
        text: "Layout Inspector shows live recomposition and skip counts per composable — interact and watch which counts climb (high recompose + low skip = suspect). It's the runtime complement to the static stability report (what's unstable). Reset counts, reproduce, and target the composable that's churning.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is 'deferring reads' and why does reading state as late as possible help?",
    a: [
      {
        t: "p",
        text: "Deferring a state read means arranging for the value to be read in a *later phase* (layout or draw) or a *smaller scope* (a child, or a lambda) rather than high up in composition. The read location determines *what* invalidates when the state changes — reading it lower/later means a change re-runs less work.",
      },
      {
        t: "list",
        items: [
          "**Read location = invalidation scope** — the composable/phase that reads the state is what re-runs on change. Read it in the smallest scope that needs it.",
          "**Lambda-based modifiers defer to layout/draw** — `offset { scroll.value }`, `graphicsLayer { alpha = anim }`, `drawBehind { }`: the value is read in layout/draw, skipping recomposition.",
          "**Pass state down as a lambda, not a value** — passing `() -> Int` (a getter) instead of `Int` lets the child read it, so only the child recomposes, not the parent chain (common for scroll-driven effects).",
          "**Concrete win** — a collapsing toolbar reading scroll offset: read it in a `graphicsLayer`/`offset{}` lambda so scrolling only re-lays-out/draws the toolbar, not the whole screen.",
        ],
      },
      {
        t: "code",
        title: "Defer via a lambda parameter",
        code: `// Parent reads value -> parent + child recompose each change
Header(offset = scroll.value)
// Parent passes a getter -> only Header reads it, only Header invalidates
Header(offset = { scroll.value })`,
      },
      {
        t: "note",
        text: "Deferring reads = read state in the latest phase / smallest scope, because the reader is what invalidates. Use lambda modifiers (offset{}, graphicsLayer{}, drawBehind{}) to read in layout/draw (skip recomposition), and pass state as a getter lambda so only the child invalidates. Key technique for scroll/animation-driven UI.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why is a debug build misleading for Compose performance, and what should you measure on?",
    a: [
      {
        t: "p",
        text: "Debug builds run Compose code *interpreted/unoptimized*: no R8 optimization, live-literals and debugging instrumentation enabled, and — critically — no ahead-of-time compilation of the Compose runtime, so it JIT-compiles as you scroll. This makes debug builds dramatically slower and janky in ways a release build isn't. Always measure on a release (or profileable) build.",
      },
      {
        t: "list",
        items: [
          "**Debug = interpreted + unoptimized** — R8 off, extra instrumentation, no baseline profile applied; scrolling triggers JIT.",
          "**Measure on release/`profileable`** — a `profileable` build variant gives release performance with profiling enabled.",
          "**On a real, mid-tier device** — not a flagship or emulator; users' devices are slower.",
          "**Apply a Baseline Profile** — without it, even release has a 'first run' JIT penalty; the profile precompiles hot paths.",
          "**Use Macrobenchmark** — for repeatable startup/scroll/jank metrics (frame timing), not eyeballing.",
        ],
      },
      {
        t: "note",
        text: "Debug builds run Compose interpreted/unoptimized (R8 off, extra instrumentation, JIT while scrolling) — far slower and janky unlike release. Measure on a release/profileable build, on a real mid-tier device, with a Baseline Profile applied, using Macrobenchmark for repeatable frame-timing numbers.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do Baseline Profiles work, and how do you create one for a Compose app?",
    a: [
      {
        t: "p",
        text: "A Baseline Profile is a list of hot code paths (classes/methods) shipped with your app so ART can *ahead-of-time compile* them at install, instead of interpreting-then-JIT-ing on first use. Compose benefits enormously because its runtime and your UI code are otherwise JIT'd during the first scrolls/launches, causing first-run jank. You generate one with a Macrobenchmark test that exercises key journeys.",
      },
      {
        t: "code",
        title: "Generating a Baseline Profile",
        code: `// A BaselineProfileGenerator test (macrobenchmark module)
@Test fun generate() = baselineProfileRule.collect(packageName = "com.app") {
    startActivityAndWait()
    // exercise critical journeys: scroll the feed, open detail, etc.
    device.findObject(By.res("feed")).fling(Direction.DOWN)
}
// Output: baseline-prof.txt bundled into the app; ART precompiles those paths at install`,
      },
      {
        t: "list",
        items: [
          "**AOT-compiles hot paths at install** — removes the interpret/JIT penalty on first launch and first scrolls (typical 20–40% faster startup, smoother initial scroll).",
          "**Generated via Macrobenchmark** — `BaselineProfileRule` records the methods hit while you script the critical user journeys.",
          "**Ship it** — the profile lives in `src/main/baseline-prof.txt` (the Baseline Profile Gradle plugin automates generation/inclusion).",
          "**Compose especially** — its library code isn't in the platform's system profile, so without a baseline profile it's JIT'd; this is the single biggest easy Compose perf win.",
        ],
      },
      {
        t: "note",
        text: "A Baseline Profile lists hot classes/methods so ART AOT-compiles them at install, killing first-run JIT jank — huge for Compose (its runtime is otherwise interpreted then JIT'd). Generate with a Macrobenchmark BaselineProfileRule test scripting key journeys; ship baseline-prof.txt. Biggest easy Compose perf win.",
      },
    ],
  },
  {
    level: "junior",
    q: "What causes excessive recomposition most often, and how do you fix each cause?",
    a: [
      {
        t: "p",
        text: "Excessive recomposition almost always traces to a small set of causes: unstable parameters, reading rapidly-changing state too high in the tree, or creating new objects each composition. Knowing the usual suspects lets you fix jank quickly.",
      },
      {
        t: "list",
        items: [
          "**Unstable parameters** — `List`/`Map`, other-module classes, `var` fields. Fix: immutable collections, `@Immutable`/`@Stable`, stable data classes.",
          "**Reading fast-changing state too high** — scroll offset/animation value read in a parent. Fix: `derivedStateOf`, lambda getters, `graphicsLayer`.",
          "**Creating new objects in composition** — a new list/lambda/object each recomposition passed as a param. Fix: `remember` it, or hoist.",
          "**Unstable state exposed from ViewModel** — a mutable state object. Fix: immutable UiState, updated via `copy`.",
          "**Whole-screen state for a small change** — one big UiState so any field change recomposes everything reading it. Fix: split reads, pass narrow slices.",
          "**Not using keys in lists** — causes wrong reuse/recomposition. Fix: stable `key`.",
        ],
      },
      {
        t: "note",
        text: "Excessive recomposition causes + fixes: unstable params (→ immutable/@Stable), reading fast-changing state too high (→ derivedStateOf/lambda/graphicsLayer), new objects each composition (→ remember), mutable VM state (→ immutable UiState), one giant UiState (→ narrow reads), missing list keys. Confirm with Layout Inspector + stability report.",
      },
    ],
  },
  {
    level: "junior",
    q: "What do @Stable and @Immutable promise, and what happens if you lie?",
    a: [
      {
        t: "p",
        text: "`@Immutable` promises the type's public properties will *never change* after construction (fully immutable). `@Stable` is a weaker promise: the type may change, but when it does it will *notify Compose* (via snapshot state), and `equals` is consistent. Both tell the compiler to treat the type as stable (enabling skipping) even when it couldn't infer that. If you lie, you get stale UI — Compose skips recomposition that should have happened.",
      },
      {
        t: "list",
        items: [
          "**`@Immutable`** — 'this never changes'. Use on data classes with `val`s of types the compiler can't verify (e.g. wrapping a `List`).",
          "**`@Stable`** — 'this may change but will notify via snapshot state, and equals is stable'. Use on holder classes backed by `mutableStateOf`.",
          "**The danger of lying** — if you annotate a type stable but then mutate it invisibly, composables reading it are skipped and show stale data — a nasty, hard-to-trace bug.",
          "**Prefer real immutability** — annotations are promises the compiler can't check; genuine immutable data (val + immutable collections) is safer than an annotation over mutable internals.",
        ],
      },
      {
        t: "note",
        text: "@Immutable = 'never changes'; @Stable = 'may change but notifies Compose (snapshot state) and equals is consistent'. Both force stable treatment (skipping). Lying = stale UI (Compose skips recomposition it shouldn't). Prefer genuine immutability over annotating mutable internals — the compiler can't verify the promise.",
      },
    ],
  },
  {
    level: "senior",
    q: "What problems does strong skipping mode solve, and what changed for developers?",
    a: [
      {
        t: "p",
        text: "Strong skipping mode (default from Kotlin 2.0.20 / recent Compose) makes composables with *unstable* parameters *skippable* by comparing those params with *instance equality*, and it auto-remembers lambdas. Before it, one unstable parameter (a `List`, a class from another module) made the whole composable non-skippable, forcing lots of `@Immutable`/`ImmutableList` boilerplate. Strong skipping greatly reduces that burden.",
      },
      {
        t: "list",
        items: [
          "**Unstable params no longer block skipping** — Compose compares unstable params by instance (`===`); if the same instance is passed, it can still skip.",
          "**Lambdas auto-remembered** — reduces lambda-instability churn without manual `remember`.",
          "**Less boilerplate** — you need fewer `@Immutable` annotations and `ImmutableList` conversions just to get skipping.",
          "**Stability still matters** — for *value* equality (a new equal `List` instance won't skip under instance comparison), immutable/stable types still help; and correctness (avoiding stale UI from mutation) still requires immutability.",
          "**Caveat** — passing a *new* unstable instance each time (e.g. a freshly-built list) still recomposes; strong skipping helps when the same instance flows through.",
        ],
      },
      {
        t: "note",
        text: "Strong skipping (default in recent Compose) makes composables with unstable params skippable via instance (===) comparison and auto-remembers lambdas — cutting @Immutable/ImmutableList boilerplate. But a NEW unstable instance each recomposition still recomposes, so stable/immutable types still help value-equality skipping and prevent stale-UI bugs.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle an unstable type you can't change (from a library or another module)?",
    a: [
      {
        t: "p",
        text: "When a type is unstable because it's defined in a module without the Compose compiler (or is a library class you can't annotate), you have several options short of rewriting it: wrap it, annotate via a stability configuration file, or restructure so the unstable type doesn't cross a composable boundary.",
      },
      {
        t: "list",
        items: [
          "**Stability configuration file** — list the class's fully-qualified name in a `stabilityConfigurationFile`; the compiler then treats it as stable (a promise you won't mutate it). Good for third-party value types you know are immutable.",
          "**Wrap in an `@Immutable`/`@Stable` holder** — a small class in your module that the compiler analyzes, wrapping the foreign type.",
          "**Map to your own model** — convert the library type to a domain data class at the boundary; often the cleanest (also decouples you from the library).",
          "**Rely on strong skipping** — with it enabled, passing the same instance still skips via `===`, reducing the need to fix stability at all.",
          "**Enable the Compose compiler on your own multi-module code** — for your *own* modules, applying the Compose compiler plugin makes their data classes stable automatically.",
        ],
      },
      {
        t: "note",
        text: "For an unstable type you can't edit: add it to a stabilityConfigurationFile (promise it's immutable), wrap it in an @Immutable holder, or map it to your own domain data class at the boundary (cleanest). Strong skipping also helps (instance-equality skip). For your own modules, apply the Compose compiler so their classes are analyzed.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does Compose avoid unnecessary work with positional memoization?",
    a: [
      {
        t: "p",
        text: "Positional memoization is how Compose remembers things *by their location in the call tree* rather than by a key you supply. Each call site gets a slot in the slot table, so `remember` at a given position retrieves the same stored value across recompositions, and Compose can match up composables between recompositions to know what changed, was added, or removed.",
      },
      {
        t: "list",
        items: [
          "**Slot table by position** — every composable call and `remember` is identified by its position in the composition, so state 'sticks' to its call site.",
          "**Enables `remember`** — the value persists because the slot persists across recompositions.",
          "**Enables diffing** — matching positions lets Compose reuse unchanged subtrees and identify moves/insertions.",
          "**`key()` overrides position** — when items reorder (lists), `key()` gives identity independent of position so state migrates with the item, not the slot.",
        ],
      },
      {
        t: "note",
        text: "Positional memoization identifies each composable/remember by its position in the call tree (a slot in the slot table), so state sticks to its call site and Compose can diff between recompositions. key() overrides position for reordering lists so state follows the item, not the slot.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you profile and fix Compose jank on a real device end-to-end?",
    a: [
      {
        t: "p",
        text: "A systematic pass: reproduce on a release/profileable build on a real mid-tier device, measure with the right tool, identify whether it's composition/layout/draw, fix the specific cause, and verify the metric improved. Guessing wastes time; the tools tell you exactly where the frames go.",
      },
      {
        t: "list",
        items: [
          "**Reproduce correctly** — release/`profileable` build, real device, Baseline Profile applied.",
          "**Measure** — Macrobenchmark (`FrameTimingMetric`) for jank/startup numbers; the system trace / Perfetto for per-frame breakdown; Layout Inspector for recomposition counts.",
          "**Classify** — is the hot phase composition (excess recomposition), layout (expensive/relayout every frame), or draw (overdraw, large bitmaps)?",
          "**Fix the cause** — stability/keys/`derivedStateOf` for composition; `graphicsLayer`/`offset{}`/simpler layout for layout; right-sized images/fewer layers for draw.",
          "**Verify** — re-run the benchmark; confirm p50/p95 frame time and jank % dropped. Keep the benchmark to catch regressions.",
        ],
      },
      {
        t: "note",
        text: "End-to-end: reproduce on release/profileable + real device + baseline profile → measure (Macrobenchmark FrameTiming, Perfetto trace, Layout Inspector counts) → classify the hot phase (composition/layout/draw) → fix the specific cause → re-benchmark to verify p95/jank% dropped. Measure, don't guess; keep the benchmark for regressions.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why should you avoid heavy computation directly in a composable, and where should it go?",
    a: [
      {
        t: "p",
        text: "A composable body can run every recomposition (many times per second), so any non-trivial computation there — sorting, filtering, formatting, parsing — repeats needlessly and janks the frame. Move it out: derive it once with `remember`, compute it in the ViewModel, or use `derivedStateOf` for state-dependent derivations.",
      },
      {
        t: "code",
        title: "Move computation out of the body",
        code: `// BAD: sorts on every recomposition
@Composable fun List(items: List<Item>) {
    val sorted = items.sortedBy { it.name }   // runs each recomposition
}
// GOOD: cache with remember keyed on the input
val sorted = remember(items) { items.sortedBy { it.name } }
// BETTER: compute in the ViewModel (off the UI, testable, survives config change)`,
      },
      {
        t: "list",
        items: [
          "**`remember(key)`** — caches the result, recomputing only when the input changes.",
          "**ViewModel** — best home for real business logic and expensive transforms; the UI just displays results (and it survives config change, off the main thread).",
          "**`derivedStateOf`** — for values derived from *other snapshot state* that changes at a different rate than reads.",
          "**Never in the raw body** — repeated per recomposition, on the main thread, blocking frames.",
        ],
      },
      {
        t: "note",
        text: "Composable bodies run every recomposition, so heavy work (sort/filter/format) there janks frames. Cache with remember(key) { }, or better compute in the ViewModel (off main thread, testable, survives config change); use derivedStateOf for state-derived values. Never leave expensive computation in the raw body.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is overdraw, and how do you reduce it in Compose?",
    a: [
      {
        t: "p",
        text: "Overdraw is painting the same pixel multiple times in one frame (stacked backgrounds, opaque layers over opaque layers). Each extra layer costs GPU/draw time; heavy overdraw contributes to jank independent of recomposition. You reduce it by removing redundant backgrounds and unnecessary layers.",
      },
      {
        t: "list",
        items: [
          "**Redundant backgrounds** — a colored `Surface` inside another same-colored one paints twice; drop the inner background.",
          "**Opaque over opaque** — full-screen backgrounds behind opaque content are wasted; clip or size them to only the visible area.",
          "**`clipToBounds`/`clip`** — clipping can prevent drawing outside needed bounds.",
          "**Diagnose** — 'Debug GPU Overdraw' in developer options colors pixels by overdraw count (blue=1×, red=4×+); aim to reduce red areas.",
          "**`graphicsLayer` `compositingStrategy`** — for alpha over overlapping content, but note offscreen buffers have their own cost — measure.",
        ],
      },
      {
        t: "note",
        text: "Overdraw = painting the same pixel multiple times per frame (stacked backgrounds/opaque layers) — a draw-phase cost separate from recomposition. Reduce by removing redundant/nested backgrounds and clipping to visible bounds. Diagnose with 'Debug GPU Overdraw' (blue=1×…red=4×+); shrink the red.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you optimize image loading in Compose to avoid jank and memory issues?",
    a: [
      {
        t: "p",
        text: "Use an image library like Coil (`AsyncImage`), which decodes off the main thread, caches in memory and on disk, and — crucially — downsamples images to the size actually displayed. Loading a full-resolution bitmap into a small view wastes memory and causes GC jank; letting Coil size the request fixes it.",
      },
      {
        t: "code",
        title: "Efficient AsyncImage",
        code: `AsyncImage(
    model = ImageRequest.Builder(LocalContext.current)
        .data(url)
        .crossfade(true)
        .build(),
    contentDescription = null,
    modifier = Modifier.size(64.dp),   // Coil downsamples the decode to this size
    placeholder = painterResource(R.drawable.placeholder),
)`,
      },
      {
        t: "list",
        items: [
          "**Right-size the decode** — a bounded `Modifier.size`/known target lets Coil decode to that size, not full-res; avoids huge bitmaps and OOM/GC jank.",
          "**Memory + disk cache** — Coil handles both; repeated items don't re-decode.",
          "**Placeholders/crossfade** — smoother perceived loading in lists.",
          "**Avoid unbounded size in lists** — an image with no size constraint may decode at full resolution; give it a size or aspect ratio.",
        ],
      },
      {
        t: "note",
        text: "Use Coil AsyncImage: it decodes off-main-thread, caches (memory+disk), and downsamples to the displayed size — a bounded Modifier.size is what lets it avoid loading full-res bitmaps (the usual cause of list GC jank/OOM). Add placeholders/crossfade; never leave list images unbounded.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does donut-hole skipping work, and how do you exploit it?",
    a: [
      {
        t: "p",
        text: "Donut-hole skipping is Compose's ability to recompose a *child* (the hole) while skipping its *parent* (the donut), or vice-versa — invalidation follows the actual state reads, not the parent-child hierarchy. You exploit it by reading changing state in the *deepest* composable that needs it, so a change re-runs only that small 'hole' and its ancestors are skipped.",
      },
      {
        t: "code",
        title: "Push the state read into the hole",
        code: `// BAD: parent reads count -> parent + all siblings recompose
@Composable fun Screen(count: Int) {
    ExpensiveHeader()          // recomposes needlessly
    Text("Count: \$count")
}
// GOOD: only the Text (the hole) reads it -> ExpensiveHeader is skipped
@Composable fun Screen(count: () -> Int) {
    ExpensiveHeader()
    Text("Count: \${count()}")   // read deferred into this leaf
}`,
      },
      {
        t: "list",
        items: [
          "**Invalidation is per read-site** — only composables that read the changed state re-run; siblings that don't are skipped.",
          "**Read low** — pass state as a lambda getter so the leaf reads it, keeping expensive siblings/parents out of the invalidation.",
          "**Content lambdas help** — passing a `@Composable` content slot lets the container recompose without re-running the content, and vice-versa.",
          "**Combined with stability** — skippable siblings + deep reads means a frequent state change touches minimal work.",
        ],
      },
      {
        t: "note",
        text: "Donut-hole skipping: Compose recomposes only the composables that READ the changed state, skipping parents/siblings that don't — invalidation follows reads, not hierarchy. Exploit it by reading changing state in the deepest leaf (pass a getter lambda), so expensive siblings stay skipped. Pairs with stability for minimal per-change work.",
      },
    ],
  },
];

export default qa;
