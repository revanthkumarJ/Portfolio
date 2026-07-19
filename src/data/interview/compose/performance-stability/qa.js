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
];

export default qa;
