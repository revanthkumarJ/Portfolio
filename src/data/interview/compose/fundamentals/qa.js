// Compose Fundamentals — Interview Prep tab.
// Style: teach the concept plainly first, then the direct answer, then edge cases.

const qa = [
  {
    level: "junior",
    q: "What is Jetpack Compose and how is it different from the XML/View system?",
    a: [
      {
        t: "p",
        text: "**The concept**: there are two ways to build UI. The old Android way is *imperative* — you create widget objects (from XML), keep references to them, and mutate them over time: `textView.text = \"Hi\"`, `spinner.visibility = GONE`. Your code manages every transition between screen states by hand. Compose is *declarative* — you write a Kotlin function that describes what the screen looks like **for a given state**, and never touch widgets afterwards. When state changes, Compose re-runs your function and updates only what differs.",
      },
      {
        t: "p",
        text: "**Why that's a big deal**: imperative UI bugs are usually forgotten transitions — you showed the loading spinner but forgot to hide last time's error message. In Compose that bug can't exist, because each run describes the *entire* result from scratch; there is no stale leftover to forget. It also collapses the state-synchronization problem: data and UI can't drift apart when UI is literally computed from data (`UI = f(state)`).",
      },
      {
        t: "p",
        text: "**Concrete differences to name**: no XML — layout, styling and logic are all Kotlin; no `findViewById`/ViewBinding — there are no retained widget objects to reference; updates happen by *recomposition* (smart re-execution) instead of mutation; and it ships as a library independent of the OS version, which is also what enables Compose Multiplatform (same code on iOS/desktop).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a @Composable function and what special rules apply to it?",
    a: [
      {
        t: "p",
        text: "**The concept**: `@Composable` marks a function that *describes UI*. It's not just documentation — the Compose **compiler plugin** rewrites the function: it secretly adds a `Composer` parameter and injects bookkeeping calls, so that when the function runs, everything it emits (text nodes, layouts, images) is recorded into Compose's internal tree. The function doesn't *return* UI — calling `Text(\"Hi\")` returns `Unit`; its effect is to **emit** a text node into the composition.",
      },
      {
        t: "list",
        items: [
          "**Only callable from other composables** — a normal function has no Composer to pass along, so the compiler rejects the call. (Same mechanism as `suspend` functions only being callable from coroutines — a hidden compiler-threaded parameter.)",
          "**Must be fast and side-effect-free**: Compose may re-run your function many times (recomposition), skip it, or even abandon a run halfway and restart. Anything in the body must be safe to repeat — no network calls, no mutating globals. Side effects go through dedicated APIs (`LaunchedEffect` etc.).",
          "**No guaranteed order**: sibling composables may execute in any order — never make one sibling depend on another having run first.",
          "**Convention**: UI-emitting composables are named like nouns in PascalCase (`ProfileCard`), since they declare a thing rather than perform an action.",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "Explain composition and recomposition. What triggers a recomposition?",
    a: [
      {
        t: "p",
        text: "**The concept**: when Compose runs your composable functions the first time, it builds the **composition** — an internal tree recording what every function emitted and with which inputs. This is Compose's memory of your UI. **Recomposition** is Compose updating that memory: re-running the affected functions when something they depend on changes.",
      },
      {
        t: "p",
        text: "**What triggers it**: writing to an observable **state object** that some composable previously **read**. While your functions execute, Compose records every `State<T>` read (reading `count` inside `Text(\"Count: \" + count)` silently subscribes that spot to `count`). When `count` is written, Compose looks up exactly which *recomposition scopes* read it and re-runs only those. So the rule is: **writes trigger, reads scope** — no manual subscriptions anywhere.",
      },
      {
        t: "p",
        text: "**The crucial refinement**: re-running a function doesn't mean re-rendering everything inside it. During the re-run, child composables whose parameters haven't changed are **skipped** entirely — Compose compares new inputs against what's stored in the composition. So a screen-level recomposition typically executes only a handful of small functions. Edge cases worth knowing: recomposition can be abandoned mid-way and restarted if state changes again quickly (why bodies must be repeat-safe), and plain variables (`var x = 0`) trigger nothing — only snapshot state types (`mutableStateOf`, `StateFlow` via `collectAsState`) are observable.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why does a composable function return Unit? How does the UI actually get built?",
    a: [
      {
        t: "p",
        text: "**The concept**: in an object-oriented UI toolkit, a builder returns a widget you insert into a tree. Compose inverts this: a composable *emits* nodes into an implicit tree while it runs. The hidden `Composer` (injected by the compiler) is a cursor into an internal structure called the **slot table**; every composable call registers a group there containing its inputs and emitted nodes. So the 'return value' of your UI code is a side effect the runtime captures — the function itself has nothing useful to return, hence `Unit`.",
      },
      {
        t: "p",
        text: "**Why design it that way**: it's what makes recomposition possible. Because the tree is keyed by *call position in code* (positional memoization), Compose can re-run your function later, walk the same positions, diff new inputs against stored ones, and update only mismatches — impossible if you handed it opaque widget objects. It also makes composition trivially compositional: any function can call any other, and the emitted trees nest automatically. One exception to mention: `remember { }` *does* return a value — but it's not emitting UI; it's reading/writing a slot in that same table.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the three phases of a Compose frame?",
    a: [
      {
        t: "p",
        text: "**The concept**: turning your code into pixels happens in three separable steps each frame — and Compose keeps them separable on purpose.",
      },
      {
        t: "list",
        items: [
          "**Composition** — *what to show*: your composable functions run (or re-run), producing the tree of layout nodes. The only phase executing your composable code.",
          "**Layout** — *where to put it*: each node measures its children and places them. Single-pass by design: a parent measures each child exactly once, so deeply nested UIs don't explode the way nested `RelativeLayout`s did with double measurement.",
          "**Draw** — *how it looks*: nodes render themselves to the canvas.",
        ],
      },
      {
        t: "p",
        text: "**Why you should care** (the follow-up they're fishing for): the phases can run independently. If a state change only affects position (a drag), Compose can skip composition and just re-layout; if it only affects pixels (alpha, color), just re-draw. *Where you read state decides which phases re-run* — reading a drag offset in composition recomposes every frame, while the lambda form `Modifier.offset { ... }` reads it during layout, and `graphicsLayer { alpha = ... }` reads during draw. Deferring reads like this is the standard fix for animation-driven recomposition storms.",
      },
    ],
  },
  {
    level: "junior",
    q: "Can you call a composable function from a normal function or a coroutine? Why not?",
    a: [
      {
        t: "p",
        text: "No — it's a compile-time error, and the reason is mechanical, not stylistic. The Compose compiler rewrites every composable to take a hidden `Composer` parameter (the cursor into the composition), plus bookkeeping calls around the body. A normal function has no Composer to supply, so there's nothing to pass — the call cannot be compiled. Only a composition context (started by `setContent`, or a parent composable) provides it.",
      },
      {
        t: "p",
        text: "**The analogy that shows understanding**: it's exactly how `suspend` works — suspend functions need a hidden `Continuation`, so only coroutines can call them; composables need a hidden `Composer`, so only composables can call them. **Practical corollaries**: to run non-UI code *from* UI you go the other direction (event lambdas calling ViewModel functions); to start UI from a coroutine or callback you don't call composables — you change *state* the composition already observes. If you genuinely need composable logic outside `setContent` (e.g. producing state from Compose code), that's what specialized runtimes like Molecule do — a niche but impressive thing to name.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain the slot table and positional memoization. Why does call position matter?",
    a: [
      {
        t: "p",
        text: "**The concept**: the slot table is the data structure where the composition physically lives — a gap buffer (an array optimized for localized inserts, like text editors use) holding **groups**. Each composable call site becomes a group storing: a compiler-generated key for that *position in the source code*, the call's inputs as recorded last time, and slots for `remember`ed values. Recomposition is the Composer walking this table in step with re-executing your code, comparing stored inputs with fresh ones — equal inputs mean 'skip, reuse everything in this group'; changed inputs mean 're-execute this group, update its slots'.",
      },
      {
        t: "p",
        text: "**Positional memoization** is the identity rule making that walk possible: a composable's identity is *where it was called from*, not what function it is. Two `Text()` calls at different source positions are two independent groups; state `remember`ed in one is invisible to the other. The same call inside an `if/else` gets *different* positions per branch — so switching branches destroys one group (its remembered state is forgotten) and creates the other.",
      },
      {
        t: "p",
        text: "**Where it breaks and why `key()` exists**: in a loop, every iteration shares one source position, so Compose falls back to index-based identity. Insert an item at the top of a list and every item's index shifts — Compose thinks *every* item changed, recomposing all of them and, worse, migrating remembered state to the wrong items (item 0's expanded-flag now belongs to the new item 0). Wrapping items in `key(item.id) { }` (or the `key` parameter in lazy lists) replaces positional identity with your stable identity, so moved items keep their state and only genuinely new items compose. That failure story is the expected answer to 'why do lists need keys'.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a recomposition scope, and what exactly decides how much code re-runs when state changes?",
    a: [
      {
        t: "p",
        text: "**The concept**: Compose doesn't track state reads per-line — it tracks them per **recomposition scope**, which is (approximately) the body of each non-inline composable function and certain lambda arguments. While a scope executes, every snapshot-state read inside it is recorded against that scope. When the state is written, the runtime invalidates *the innermost scopes that read it* and schedules them for the next frame; re-running a scope re-evaluates its body, and unchanged-child skipping limits the damage below it.",
      },
      {
        t: "p",
        text: "**The consequences that answer real interview probes**: (1) Reading state high up (in the screen composable) invalidates the big screen scope; passing values down as parameters — or better, passing *lambdas* that read the state where needed — keeps invalidation small. (2) **Inline composables like `Column`, `Row`, `Box` don't create their own scopes** — a read inside a `Column` body actually registers against the nearest non-inline parent, which is why 'I read state in the Column but the whole function recomposed' surprises people. (3) A scope that reads *no* state never recomposes — it exists in the table but is never invalidated. (4) `derivedStateOf` inserts an extra node so downstream scopes only invalidate when the *derived* value changes, not on every underlying write.",
      },
      {
        t: "code",
        title: "Scope size in practice",
        code: `@Composable
fun Screen(vm: ViewModel) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    // Read here -> the WHOLE Screen scope invalidates on any state change.

    Header(title = state.title)   // skipped if title unchanged
    Feed(items = state.items)     // skipped if items unchanged (and stable)
}
// Finer-grained alternative: pass () -> String and read inside Header,
// so only Header's scope tracks the read.`,
      },
    ],
  },
  {
    level: "senior",
    q: "Compose measurement is 'single-pass'. What does that mean, why does it matter, and how do intrinsics fit in?",
    a: [
      {
        t: "p",
        text: "**The problem it solves**: in the View system, a parent could measure children multiple times (e.g. `RelativeLayout` measuring twice to resolve constraints). Nest such parents and measurement work multiplies per level — 2^depth in the worst case — which is why 'flatten your hierarchy' was gospel and `ConstraintLayout` was invented. Compose forbids this: **during layout, a parent may measure each child exactly once** (the runtime literally throws if you measure twice). Result: measurement cost is linear in tree size, and deep composable nesting is free — a genuine architectural improvement worth stating as such.",
      },
      {
        t: "p",
        text: "**How layout actually flows**: constraints (min/max width/height) travel *down* — parent tells child what sizes are acceptable; sizes travel *up* — child picks its size within them; then the parent *places* children. One pass, top-down then bottom-up.",
      },
      {
        t: "p",
        text: "**Intrinsics are the escape hatch**: some layouts genuinely need to 'ask before measuring' — e.g. a Row where all children should match the tallest child's height (`Modifier.height(IntrinsicSize.Max)`). Intrinsic measurements let a parent query 'what height would you want at this width?' *without* it counting as the real measurement — under the hood the child's intrinsic functions compute estimates, then the single real measure still happens. They're more expensive (extra tree walk), so the guidance is: use intrinsics when needed, don't build everything on them. This — plus SubcomposeLayout for 'measure one child to decide another' — covers every 'but what if I need two passes?' follow-up.",
      },
    ],
  },
  {
    level: "senior",
    q: "Walk through what happens end-to-end from tapping a button to pixels changing on screen.",
    a: [
      {
        t: "list",
        items: [
          "**1. Input**: the OS delivers the touch to the Activity's window → Compose's pointer-input system routes it through the node tree via hit testing → your `onClick` lambda runs (on the main thread).",
          "**2. State write**: the lambda executes `count++` on a `MutableState`. The write goes through the **snapshot system** — Compose's MVCC-style state layer — which records that this state object changed and notifies observers when the snapshot is applied.",
          "**3. Invalidation**: the runtime looks up which **recomposition scopes** read `count` during their last execution and marks them invalid. Nothing re-runs yet.",
          "**4. Scheduling**: the **Recomposer** — a coroutine-based scheduler synced to the display via the frame clock (`withFrameNanos`) — picks up pending invalidations for the next vsync. Multiple writes in one frame coalesce into one recomposition.",
          "**5. Recomposition**: on the frame, invalid scopes re-execute; the Composer diffs against the slot table, skipping children with unchanged inputs; the LayoutNode tree gets updated where output actually differed.",
          "**6. Layout**: nodes whose measurements were invalidated re-measure (constraints down, sizes up, single pass) and re-place.",
          "**7. Draw**: invalidated draw regions re-record their drawing; the render thread rasterizes to the screen buffer for that frame.",
        ],
      },
      {
        t: "p",
        text: "Points that earn the 'deep understanding' checkmark: state writes are **decoupled** from re-execution (write now, recompose at next frame — that's why incrementing state twice in one click yields one recomposition); each phase only touches what was invalidated at *its* level; and if the frame budget (~16ms at 60Hz) is blown by any of steps 5–7 on the main thread, that's your jank — profiling means finding *which* phase overran.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Compose exist as 'just a library' without OS support, and what are the architectural consequences?",
    a: [
      {
        t: "p",
        text: "**The design**: Compose bypasses the OS widget stack almost entirely. `setContent` installs exactly one Android View (`ComposeView` hosting an `AndroidComposeView`) into the Activity; from there down, Compose owns everything — its own node tree (LayoutNodes, not Views), its own layout engine, its own drawing (to the same low-level Canvas the framework uses), its own input dispatch and accessibility bridge (translating its semantics tree into the framework's accessibility APIs). The OS sees one big custom View drawing itself.",
      },
      {
        t: "list",
        items: [
          "**Ships and evolves independently**: new Compose features reach every supported API level via Gradle, not OS updates — contrast with View-system features gated on Android versions for two decades.",
          "**The runtime/UI split**: `compose.runtime` (slot table, snapshots, Recomposer) is UI-agnostic tree management — `compose.ui` is just one client emitting LayoutNodes. That's why Compose Multiplatform exists (same runtime, different renderers per platform) and why Molecule can use the runtime with *no* UI at all.",
          "**Interop is structural, not hacked**: since ComposeView is a View, it drops into XML layouts; since Compose can host arbitrary nodes, `AndroidView { }` embeds real Views (maps, WebViews) inside compositions.",
          "**Costs to name for balance**: Compose re-implements what the OS gave Views for free — text editing, magnifier, autofill, a11y — each had to reach parity over time; and one giant custom View means View-based tooling (hierarchy viewers, some test frameworks) sees an opaque blob, which is why Compose has its own semantics-based testing/tooling stack.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "\"Composable functions may run in any order, in parallel, be skipped, or run again.\" Explain each claim and what it forbids you from doing.",
    a: [
      {
        t: "list",
        items: [
          "**Any order**: Compose only guarantees parent-before-child, not sibling order — e.g. all tabs of a screen may compose in whatever order serves priority. Forbidden pattern: sibling A writing something sibling B's body reads (a shared `var`, a list you append to) — B may run first, or A may be skipped.",
          "**In parallel** (reserved, not currently default): the contract allows Compose to run composables on multiple threads to fill frames faster — one more reason bodies must touch no unsynchronized shared mutable state. Writing code as if this is already true keeps you future-proof and is the honest way to state it.",
          "**Skipped**: if a composable's inputs are unchanged (and stable), Compose reuses its previous output without executing it. Forbidden pattern: relying on a composable's body executing for anything besides describing UI — logging, analytics, counters in bodies silently stop firing when skipping kicks in.",
          "**Run again (restartable)**: recomposition re-executes bodies arbitrarily often, and can even *abandon* an in-progress recomposition and restart when state changes mid-frame (fast animations do this). Forbidden pattern: any non-idempotent work in the body — the same allocation twice is fine, the same POST request twice is a bug.",
        ],
      },
      {
        t: "p",
        text: "**The unifying rule to close with**: a composable body must be a **pure description** — same inputs, same emitted UI, no observable side effects. Everything effectful gets a controlled home instead: `remember` for surviving re-runs, `LaunchedEffect`/`DisposableEffect` for actual side effects keyed to lifecycle, state hoisting for shared data. The four claims aren't trivia — they're *why* those APIs exist.",
      },
    ],
  },
];

export default qa;
