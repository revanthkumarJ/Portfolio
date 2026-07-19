// Performance & Stability — Content tab. Teaching-first.

const content = [
  {
    heading: "The mental model: recomposition is cheap, but only if skipping works",
    blocks: [
      {
        t: "p",
        text: "Compose's performance story rests on **skipping**: when a composable is about to recompose, Compose checks each of its inputs — if they're all *equal* to last time, it **skips** executing that composable entirely and reuses its previous output. A well-behaved Compose UI recomposes a handful of small functions per state change because everything else is skipped. Performance problems are almost always **skipping failing** — composables re-executing when their data didn't meaningfully change. To make skipping work, Compose must be able to (a) *compare* inputs reliably and (b) *trust* that equal inputs mean unchanged behavior. Those two requirements are what **stability** is about.",
      },
      {
        t: "note",
        text: "Reframe every 'my Compose screen is slow' question as: 'which composables are recomposing that shouldn't, and why is skipping not kicking in?' That reframing is itself a strong signal.",
      },
    ],
  },
  {
    heading: "Stable vs unstable types — the core concept",
    blocks: [
      {
        t: "p",
        text: "A type is **stable** (in Compose's sense) if Compose can rely on two things: its `equals()` is consistent with whether a recomposition-relevant change happened, and if any public property changes, Compose is *notified* (either it's immutable, or it uses snapshot state). If a composable's parameters are all stable, Compose marks the composable **skippable** — it can compare old vs new and skip. If any parameter is **unstable**, Compose *can't trust the comparison*, so it conservatively re-executes the composable **every time its parent recomposes**, even if the data is identical.",
      },
      {
        t: "list",
        items: [
          "**Stable by default**: all primitives (`Int`, `Boolean`, `Float`…), `String`, function types (lambdas), and any class the compiler infers as stable (immutable with stable properties). `MutableState` is stable (changes are observed).",
          "**Unstable by default**: `List`, `Map`, `Set`, and other collection *interfaces* — because the interface could be backed by a mutable implementation; Compose can't prove immutability from the type. Also: any class with a `var` property, or a `val` of an unstable type, or classes from modules the compiler can't analyze (e.g. a `Date` from the stdlib, a model from a module without the Compose compiler).",
          "**The subtle one**: `val items: List<Item>` is unstable *even though you never mutate it*, because the static type `List` doesn't guarantee immutability. This single fact causes most real-world unnecessary recomposition.",
        ],
      },
      {
        t: "code",
        title: "Why an unstable parameter breaks skipping",
        code: `// UNSTABLE: List is an interface -> could be a MutableList ->
// Compose can't prove equality is meaningful -> ItemRow NOT skippable ->
// recomposes on every parent recomposition even if 'items' is identical
@Composable fun ItemList(items: List<Item>) { /* ... */ }

// FIX 1: immutable collection type the compiler trusts
@Composable fun ItemList(items: ImmutableList<Item>) { /* skippable */ }

// FIX 2: annotate the holder as stable/immutable
@Immutable data class ItemsUi(val items: List<Item>)`,
      },
    ],
  },
  {
    heading: "@Stable and @Immutable — promising stability to the compiler",
    blocks: [
      {
        t: "p",
        text: "When you *know* a type is stable but the compiler can't prove it (e.g. it holds a `List` you promise never to mutate, or comes from a non-Compose module), you can annotate it — a **promise** the compiler trusts without verifying:",
      },
      {
        t: "list",
        items: [
          "**`@Immutable`** — a strong promise: *all* public properties are `val` and never change after construction (deeply). Compose treats instances as fully interchangeable by `equals`. Use for read-only UI models.",
          "**`@Stable`** — a weaker promise: the type may have mutable properties, *but* any change is observable via snapshot state, and `equals` is consistent. Use for observable holders.",
          "**These are promises, not checks**: if you annotate `@Immutable` and then mutate the underlying list, Compose will skip recompositions it shouldn't and you get **stale UI** — a genuinely nasty, silent bug. Only annotate what's actually true.",
          "**The cleaner alternative**: use `kotlinx.collections.immutable` (`ImmutableList`, `persistentListOf()`) — the compiler *knows* these are immutable, so no promise/annotation needed and no risk of lying.",
        ],
      },
    ],
  },
  {
    heading: "Strong skipping mode — what changed in recent Compose",
    blocks: [
      {
        t: "p",
        text: "Recent Compose (compiler 2.x, on by default now) introduced **strong skipping mode**, which softens the stability rules significantly — worth knowing because it changes the 'right answer' to older interview questions:",
      },
      {
        t: "list",
        items: [
          "With strong skipping, composables with **unstable parameters become skippable too** — Compose compares unstable params by **instance equality** (`===`) instead of giving up. So if the parent passes the *same list instance*, the child skips.",
          "**Lambdas are auto-remembered**: previously, an unstable capture in a lambda made it a new instance each recomposition (breaking skipping); strong skipping auto-remembers lambdas, removing a whole class of manual `remember` workarounds.",
          "**What this means practically**: much of the old 'wrap every List in ImmutableList or nothing skips' pain is reduced. But it's not a free pass — passing a *new* list instance each time (e.g. `items.filter { }` inline in the body) still fails `===` and still recomposes. Stability discipline still matters; strong skipping just raises the floor.",
          "Interview-ready phrasing: 'Strong skipping makes unstable-parameter composables skippable via instance equality and auto-remembers lambdas — so the classic advice shifted from *make everything stable or nothing skips* to *avoid creating new instances of your data each recomposition*.'",
        ],
      },
    ],
  },
  {
    heading: "Diagnosing recomposition — the tools",
    blocks: [
      {
        t: "list",
        items: [
          "**Layout Inspector (Android Studio)** — shows live **recomposition counts** and **skip counts** per composable while you interact. The first tool: find the composable whose count climbs when it shouldn't. High recompositions + low skips on a static element = a stability problem.",
          "**Compose Compiler Metrics/Reports** — a compiler flag emits reports listing every composable as `skippable`/`restartable` and every class as `stable`/`unstable`, with *why*. This is how you find *which* type is unstable and dragging a composable down. Run it, grep for your slow screen's params.",
          "**Composition tracing** — shows composable execution on the system trace timeline (Perfetto) with names, so you see time spent composing during a janky frame.",
          "**Macrobenchmark + `FrameTimingMetric`** — measures real jank (frame durations) on release builds for scroll/startup; the objective number to optimize against.",
          "**Recomposition highlighting** (developer tooling) — flashes recomposing regions so you can *see* over-recomposition visually.",
        ],
      },
      {
        t: "note",
        text: "Process to state in an interview: reproduce on a release build → Layout Inspector to find the over-recomposing composable → Compiler Reports to find *why* (which unstable type) → fix (stability/keys/deferred reads) → Macrobenchmark to confirm. Naming this workflow beats reciting fixes.",
      },
    ],
  },
  {
    heading: "The optimization toolkit — fixes in order of impact",
    blocks: [
      {
        t: "list",
        items: [
          "**Fix stability first**: make list-typed params `ImmutableList`/`persistentList`, annotate genuinely-immutable models `@Immutable`, ensure UI models are immutable data classes. Biggest win, addresses the root cause.",
          "**Provide keys in lazy lists** — identity correctness prevents cascade recomposition (see Lazy Lists topic).",
          "**Defer state reads to the latest phase**: for high-frequency values (scroll, drag, animation), read in *lambda* modifiers (`Modifier.offset { }`), `graphicsLayer { }`, or `drawBehind { }` so only layout/draw re-runs, skipping composition entirely. This is the single biggest win for animations.",
          "**Use `derivedStateOf`** to convert high-frequency inputs into low-frequency outputs (recompose only when the *result* changes).",
          "**Keep lambdas stable**: method references (`viewModel::onClick`) or remembered lambdas so children stay skippable (largely automatic under strong skipping, but still relevant when capturing unstable values).",
          "**Don't hoist state higher than needed**: reading state in a big parent invalidates the big scope; read it lower (pass lambdas that read where used) to shrink the recomposition scope.",
          "**Defer reads via lambdas at API boundaries**: pass `() -> Int` instead of `Int` for frequently-changing values so the reading scope, not the caller, tracks the change.",
        ],
      },
    ],
  },
  {
    heading: "Baseline profiles and startup — the production performance lever",
    blocks: [
      {
        t: "p",
        text: "Compose code ships as bytecode that must be JIT-compiled at runtime — and on first run (and first scroll of a list), that compilation happens *during* the user's interaction, causing startup lag and initial jank. **Baseline Profiles** fix this: they're a list of hot methods/classes precompiled to native code at install time (AOT), so the critical paths are already fast on first launch.",
      },
      {
        t: "list",
        items: [
          "You generate one with a **Macrobenchmark test** that exercises the critical journeys (startup, scroll the main feed); it records the hot paths into `baseline-prof.txt` shipped with the app.",
          "Real-world impact is large: commonly **20–40% faster startup** and dramatically smoother first-scroll — one of the highest-ROI things you can do, and often the *correct* answer to 'my list is janky' when the code is already clean.",
          "Compose libraries ship their own baseline profiles, but your *app's* screens need your own profile to benefit.",
          "Related startup levers: `App Startup` library for initializer ordering, avoiding heavy work in `Application.onCreate`, and lazy-initializing expensive dependencies. Startup is measured as cold/warm/hot; baseline profiles primarily help cold start and first-use jank.",
        ],
      },
      {
        t: "note",
        text: "The crucial testing caveat that resolves most false alarms: **never judge Compose performance on a debug build.** Debug has no R8, extra runtime assertions, and no AOT/baseline compilation — it's *expected* to be janky. Always measure on release (minified) builds, ideally with baseline profiles applied.",
      },
    ],
  },
];

export default content;
