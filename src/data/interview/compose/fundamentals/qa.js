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
  {
    level: "junior",
    q: "What is declarative UI, and how is it different from imperative UI?",
    a: [
      {
        t: "p",
        text: "Declarative UI means you *describe what the UI should look like for a given state*, and the framework figures out how to make the screen match that description. Imperative UI means you *issue step-by-step commands to mutate the UI* — find a widget, set its text, change its visibility — and you're responsible for every transition between states.",
      },
      {
        t: "code",
        title: "Imperative (Views) vs declarative (Compose)",
        code: `// IMPERATIVE: you command each change, and must handle every transition
if (isLoading) { progressBar.visibility = VISIBLE; textView.visibility = GONE }
else { progressBar.visibility = GONE; textView.visibility = VISIBLE; textView.text = name }

// DECLARATIVE: you describe the result; Compose computes the diff
@Composable fun Screen(isLoading: Boolean, name: String) {
    if (isLoading) CircularProgressIndicator() else Text(name)
}`,
      },
      {
        t: "p",
        text: "The practical payoff: imperative UI bugs are almost always *forgotten transitions* — you showed the spinner but forgot to hide last time's error. Declarative UI can't have that class of bug, because each run describes the *whole* result from scratch; there's no stale leftover state to forget about. You go from 'a tree of objects I mutate' to 'UI = f(state)': the screen is simply the output of your function given the current state.",
      },
      {
        t: "note",
        text: "Declarative = 'describe the UI for this state'; imperative = 'command each mutation'. The killer benefit: declarative UI eliminates the forgotten-transition bug class, because every render describes the whole screen fresh.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the Compose compiler plugin and what does it do?",
    a: [
      {
        t: "p",
        text: "The Compose compiler plugin is a Kotlin compiler plugin that *rewrites* your `@Composable` functions during compilation, transforming them from ordinary-looking Kotlin into code that participates in the Compose runtime. Without it, `@Composable` would just be a meaningless annotation — the plugin is what gives composables their special powers.",
      },
      {
        t: "list",
        items: [
          "**Injects the hidden `Composer` parameter** — every composable secretly receives a `$composer` argument that's the cursor into the composition (the slot table). This is why composables can only be called from other composables.",
          "**Adds group start/end calls** — it wraps your code in `startRestartGroup`/`endRestartGroup` (and similar) calls that let the runtime track, skip, and restart pieces of your UI.",
          "**Enables recomposition & skipping** — it generates the machinery that records which state each composable read and decides whether a composable can be skipped when its inputs are unchanged.",
          "**Computes stability** — it analyzes types and marks composables `skippable`/`restartable` and parameters stable/unstable (feeding the performance model).",
        ],
      },
      {
        t: "p",
        text: "The key insight is that Compose is *two* things: the compiler plugin (compile-time code transformation) and the runtime (the slot table, snapshots, Recomposer). The plugin is what makes `@Composable` a genuine language-level construct rather than a library convention — analogous to how the `suspend` keyword is compiler magic (threading a Continuation), the plugin threads a Composer.",
      },
      {
        t: "note",
        text: "The Compose compiler plugin rewrites @Composable functions — injecting the hidden Composer, adding group calls, and enabling recomposition/skipping/stability. It's why @Composable is real language magic, not just an annotation (like `suspend`).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the mental model 'UI = f(state)' and why does it matter?",
    a: [
      {
        t: "p",
        text: "'UI = f(state)' means the UI is a *pure function of state*: give the same state, get the same UI. Your composables take state as input and produce (emit) UI as output, with no hidden side effects. When the state changes, Compose re-runs the function with the new state and updates the screen to match — you never mutate the UI directly.",
      },
      {
        t: "code",
        title: "The UI is derived, not mutated",
        code: `// State drives everything; the UI is just its rendering
var count by remember { mutableStateOf(0) }
Column {
    Text("Count: $count")               // derived from state
    Button(onClick = { count++ }) { }   // event changes state -> UI re-derives
}`,
      },
      {
        t: "p",
        text: "Why it matters: it eliminates the *state-synchronization problem*. In imperative UI, data lives in your model *and* in the widgets, and they drift apart (the model says 5 but the label still shows 4 because you forgot to update it). When UI is a pure function of state, the widgets *can't* disagree with the model — they're computed from it. This makes UIs far easier to reason about (to know what's on screen, look at the state), test (assert on the state), and debug (there's one source of truth).",
      },
      {
        t: "note",
        text: "UI = f(state): the screen is a pure function of state, so widgets can never drift out of sync with your data (imperative UI's core bug). To know what's on screen, look at the state.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does setContent do, and where does a Compose UI actually start?",
    a: [
      {
        t: "p",
        text: "`setContent { }` is the bridge from the Android world into Compose. Called in an Activity's `onCreate`, it installs a single `ComposeView` as the Activity's content and starts a *composition* — running the composable lambda you pass and building the initial UI tree. Everything Compose after that point is managed by Compose, not the Android View system.",
      },
      {
        t: "code",
        title: "The entry point",
        code: `class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {              // creates the composition
            MyAppTheme {
                AppNavHost()      // your entire Compose UI tree
            }
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**One ComposeView hosts everything** — under Compose there's still exactly *one* Android View (a `ComposeView`/`AndroidComposeView`); inside it, Compose manages its own tree of LayoutNodes, not Views.",
          "**It starts the composition** — the runtime runs your composables, records the tree in the slot table, and drives recomposition from there.",
          "**Interop both ways** — because a ComposeView is a normal View, you can also put Compose *inside* an XML layout, and put Views inside Compose via `AndroidView`.",
        ],
      },
      {
        t: "note",
        text: "`setContent` installs one ComposeView and starts the composition. There's a single hosting View; everything inside is Compose's own node tree. This is also why Compose↔View interop works both directions.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is @Preview and why is it useful?",
    a: [
      {
        t: "p",
        text: "`@Preview` is an annotation you put on a composable function to render it directly in Android Studio's design pane — *without running the app on a device or emulator*. It lets you see and iterate on UI instantly, and preview multiple states/configurations side by side.",
      },
      {
        t: "code",
        title: "Previewing states and themes",
        code: `@Preview(showBackground = true)
@Composable fun ProfileCardPreview() {
    MyAppTheme { ProfileCard(user = fakeUser) }   // pass fake data directly
}

@Preview(name = "Dark", uiMode = UI_MODE_NIGHT_YES)
@Preview(name = "Large font", fontScale = 2f)
@Composable fun ProfileCardVariants() { /* one function, many previews */ }`,
      },
      {
        t: "list",
        items: [
          "**Instant iteration** — no build-and-deploy cycle; see UI changes live.",
          "**Preview many states** — loading/error/content, light/dark, different font scales and screen sizes, all at once.",
          "**Requires stateless, data-driven composables** — you pass fake state directly, which is *why* state hoisting matters: a composable that fetches its own data or needs a real ViewModel can't be previewed easily. Previewability is a design pressure toward stateless UI.",
        ],
      },
      {
        t: "p",
        text: "The deeper point: `@Preview` rewards good architecture. A *stateless* composable (takes state + lambdas as parameters) previews trivially with fake data; a composable that reaches for a ViewModel or does I/O doesn't. So 'can I preview this?' is a useful design heuristic — it nudges you toward hoisted state and separating the stateful 'screen' composable from the stateless 'content' composable.",
      },
      {
        t: "note",
        text: "@Preview renders composables in the IDE with fake data — instant iteration across states/themes/sizes. It only works well on *stateless* composables, so 'is it previewable?' is a design heuristic pushing you toward hoisted state.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why can't you use a plain variable (var x = 0) to hold state in Compose?",
    a: [
      {
        t: "p",
        text: "A plain `var x = 0` doesn't work as Compose state for two independent reasons: it isn't *observable* (changing it doesn't tell Compose to recompose), and it doesn't *survive* recomposition (a new variable is created every time the function re-runs). You need both properties, which is why state must be `remember { mutableStateOf(...) }`.",
      },
      {
        t: "code",
        title: "Why plain var fails",
        code: `@Composable fun Broken() {
    var count = 0                      // NOT observable, NOT remembered
    Button(onClick = { count++ }) {    // increments, but nothing recomposes...
        Text("Count: $count")          // ...and even if it did, count resets to 0
    }
}
// Correct:
var count by remember { mutableStateOf(0) }   // observable AND survives recomposition`,
      },
      {
        t: "list",
        items: [
          "**Not observable** — Compose only recomposes when a *snapshot state object* (`MutableState`) that a composable *read* changes. A plain `var` write is invisible to the runtime, so nothing re-renders.",
          "**Not remembered** — even if it somehow triggered recomposition, the composable re-runs top to bottom, so `var count = 0` executes again and resets to 0. `remember` stores the value in the slot table so it persists across re-runs.",
        ],
      },
      {
        t: "note",
        text: "A plain `var` is neither observable (writes don't trigger recomposition) nor remembered (resets on every re-run). State needs both — `remember { mutableStateOf(...) }`: observable + survives recomposition.",
      },
    ],
  },
  {
    level: "junior",
    q: "How is Jetpack Compose different from Flutter and SwiftUI?",
    a: [
      {
        t: "p",
        text: "All three are modern *declarative* UI toolkits with the same core idea (describe UI as a function of state), so they feel similar to use. The differences are in *language, platform reach, and rendering*.",
      },
      {
        t: "table",
        headers: ["", "Jetpack Compose", "SwiftUI", "Flutter"],
        rows: [
          ["Language", "Kotlin", "Swift", "Dart"],
          ["Primary platform", "Android (+ KMP: iOS/desktop/web)", "Apple platforms", "Cross-platform (one codebase)"],
          ["Rendering", "own rendering (Skia-based)", "native UIKit/AppKit under the hood", "own rendering (Skia/Impeller)"],
          ["State model", "snapshot state + recomposition", "@State + view invalidation", "setState / widgets rebuild"],
          ["Interop", "with Android Views (2-way)", "with UIKit", "platform channels"],
        ],
      },
      {
        t: "p",
        text: "The conceptual overlap is huge — recomposition, `@State`/`mutableStateOf`, and `setState` are all 'the UI rebuilds when state changes'. For an Android engineer, the notable points are: Compose is *Kotlin* (so it composes with coroutines/Flow naturally), it interops both directions with the existing View system (crucial for incremental adoption), and via *Compose Multiplatform* it extends beyond Android to iOS/desktop/web — the same UI code running cross-platform, which is Compose's answer to Flutter's cross-platform pitch but using Kotlin.",
      },
      {
        t: "note",
        text: "Compose, SwiftUI, and Flutter share the declarative 'UI = f(state)' model; they differ in language (Kotlin/Swift/Dart), platform reach, and rendering. Compose's edges: it's Kotlin (coroutines/Flow interop), 2-way View interop, and Compose Multiplatform for cross-platform.",
      },
    ],
  },
  {
    level: "junior",
    q: "Is recomposition expensive? What happens if you do heavy work in a composable body?",
    a: [
      {
        t: "p",
        text: "Recomposition itself is designed to be *cheap* — Compose skips composables whose inputs haven't changed, so a state change typically re-runs only a handful of small functions. But it's cheap *only if your composable bodies are cheap*. If you do heavy work directly in a composable body, that work re-runs on *every* recomposition, which can happen many times per second (during animations, scrolling, or rapid state changes) — turning cheap recomposition into a performance problem.",
      },
      {
        t: "code",
        title: "Heavy work in the body vs cached",
        code: `@Composable fun Bad(items: List<Item>) {
    val sorted = items.sortedByDescending { it.score }   // re-sorts EVERY recomposition!
    LazyColumn { items(sorted) { ItemRow(it) } }
}
@Composable fun Good(items: List<Item>) {
    val sorted = remember(items) { items.sortedByDescending { it.score } }  // cached until items change
    LazyColumn { items(sorted) { ItemRow(it) } }
}`,
      },
      {
        t: "list",
        items: [
          "**Composable bodies must be fast and idempotent** — they can run many times per second, so expensive computation, allocations, or I/O in them is a bug.",
          "**Cache derived work with `remember`** — `remember(key) { expensive() }` recomputes only when the key changes, not on every recomposition.",
          "**Never do side effects in the body** — networking, logging, mutating shared state; those go in effect handlers (`LaunchedEffect`).",
        ],
      },
      {
        t: "note",
        text: "Recomposition is cheap because of skipping — *if* your bodies are cheap. Heavy work (sorting, computation) in a body re-runs on every recomposition; cache it with `remember(key) { }`. Bodies must be fast, allocation-light, and side-effect-free.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between the Compose runtime and Compose UI?",
    a: [
      {
        t: "p",
        text: "Compose is architecturally split into two independent parts. The **Compose runtime** (`androidx.compose.runtime`) is a *general-purpose tree-management engine* — it knows about the slot table, snapshot state, recomposition, and the Recomposer, but nothing about UI. **Compose UI** (`androidx.compose.ui`) is one *client* of that runtime that emits LayoutNodes, does measurement/layout/draw, and handles input. The runtime doesn't know what a `Text` or a pixel is.",
      },
      {
        t: "list",
        items: [
          "**Compose runtime** — the state/recomposition engine: slot table, `@Composable`, `remember`, snapshots, the Recomposer. UI-agnostic; it just manages a tree of 'things' efficiently.",
          "**Compose UI** — the Android UI toolkit built on the runtime: LayoutNode, Modifier, measurement/layout/draw, pointer input, the Material components.",
        ],
      },
      {
        t: "p",
        text: "Why this separation matters: because the runtime is UI-agnostic, it can drive *non-UI* trees. **Compose Multiplatform** uses the same runtime with a different renderer to run on iOS/desktop/web. **Molecule** (Cash App) uses the runtime with *no UI at all* — to build `StateFlow`s from composable logic. So 'Compose' isn't one thing; it's a reusable reactive runtime plus a UI toolkit that happens to be its most famous client. Knowing this explains how Compose can exist beyond Android and beyond UI.",
      },
      {
        t: "note",
        text: "Compose = runtime (UI-agnostic reactive tree engine: slot table, snapshots, recomposition) + Compose UI (one client emitting LayoutNodes). The split is why Compose Multiplatform (different renderer) and Molecule (no UI) exist.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the Composer, and what role does it play?",
    a: [
      {
        t: "p",
        text: "The `Composer` is the object the compiler plugin secretly passes into every composable function — it's the *cursor and controller* for building and updating the composition. When your composable runs, it's really calling methods on the Composer to record what it emits and remembers into the slot table, and to decide whether to execute or skip each piece.",
      },
      {
        t: "list",
        items: [
          "**It's the hidden parameter** — `@Composable fun Foo()` compiles to `fun Foo($composer: Composer)`. That's *why* composables can only be called from composables: they need a Composer, which only the runtime provides.",
          "**It navigates the slot table** — the compiler inserts `startGroup`/`endGroup` calls around your code; those are the Composer moving through and diffing the slot table (positional memoization).",
          "**It decides skip vs execute** — on recomposition, the Composer compares stored inputs against new ones and either re-executes a group or skips it (reusing the previous output).",
          "**It manages `remember`** — `remember { }` is really the Composer reading or writing a slot in the table at the current position.",
        ],
      },
      {
        t: "p",
        text: "The analogy that lands: the Composer is to `@Composable` what the `Continuation` is to `suspend`. Both are hidden compiler-injected parameters that carry the machinery the feature needs — a Continuation threads the coroutine's resumption state; the Composer threads the composition's position and slot table. You never see it, but it's the reason the whole system works and the reason for the calling-context restrictions.",
      },
      {
        t: "note",
        text: "The Composer is the hidden parameter (like suspend's Continuation) that's the cursor into the slot table — it navigates groups, decides skip-vs-execute, and manages remember. It's why composables need a composable calling context.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the Recomposer and how does it schedule recomposition?",
    a: [
      {
        t: "p",
        text: "The Recomposer is the *scheduler* that drives recomposition. When state changes, composables don't re-run immediately — instead, the invalidated recomposition scopes are collected, and the Recomposer schedules them to re-run on the *next frame*, synchronized with the display's refresh via the frame clock. It's the coroutine-based engine that turns 'state changed' into 'the right composables re-run at the right time'.",
      },
      {
        t: "list",
        items: [
          "**Collects invalidations** — when a snapshot state write happens, the runtime marks the scopes that read that state as invalid and hands them to the Recomposer.",
          "**Batches per frame** — multiple state writes in one frame coalesce into a *single* recomposition pass, synchronized to `withFrameNanos` (the choreographer's frame clock). This is why incrementing state twice in one event produces one recomposition, not two.",
          "**Runs on a coroutine** — the Recomposer is driven by a coroutine that awaits frame signals and applies pending invalidations, so recomposition is cooperative and frame-aligned rather than synchronous.",
        ],
      },
      {
        t: "p",
        text: "The practical consequences: state writes are *decoupled* from re-execution (write now, recompose next frame), which is why you can safely update state multiple times in an event handler and get one efficient recomposition. And because it's frame-synchronized, recomposition, layout, and draw all happen within the frame budget — the Recomposer is what keeps Compose's updates aligned with the display rather than firing chaotically on every state change.",
      },
      {
        t: "note",
        text: "The Recomposer is the frame-synchronized scheduler: it collects invalidated scopes and re-runs them on the next frame (via the frame clock), batching multiple state writes into one recomposition. State writes are decoupled from re-execution — write now, recompose next frame.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Compose's tree diffing compare to React's virtual DOM?",
    a: [
      {
        t: "p",
        text: "Both solve 'efficiently update the UI when state changes', but with fundamentally different mechanisms. React builds a *virtual DOM* — a full in-memory tree — on each render, then *diffs* the new tree against the old to compute minimal real-DOM changes. Compose does *not* build and diff whole trees; instead it uses *positional memoization* via the slot table to update the existing tree in place, only re-running the composables whose inputs changed.",
      },
      {
        t: "list",
        items: [
          "**React** — re-render produces a new virtual tree; a diff algorithm compares old vs new; the reconciler applies the difference to the real DOM. Diffing is O(n) over the tree.",
          "**Compose** — no separate virtual tree and no whole-tree diff. The slot table records each composable's inputs *by position*; on recomposition, Compose compares stored inputs to new ones at each position and *skips* unchanged subtrees, updating only the slots that changed. It's fine-grained invalidation, not tree diffing.",
        ],
      },
      {
        t: "p",
        text: "The consequence: Compose can skip re-running a composable *entirely* when its inputs are unchanged (it never even executes the function), whereas React re-runs the component function and relies on the diff to find nothing changed (mitigated by `memo`). Compose's model is closer to 'targeted invalidation' — the reads a composable made are its subscriptions, so only affected scopes re-run. This is why Compose emphasizes *stability* and *skipping* rather than a reconciliation/diff step: the efficiency comes from not re-running unchanged code in the first place, not from diffing the output afterward.",
      },
      {
        t: "note",
        text: "React: build a virtual DOM and diff whole trees. Compose: no virtual tree/diff — positional memoization in the slot table skips unchanged composables entirely (they never re-run). Compose's efficiency is targeted invalidation, not output diffing.",
      },
    ],
  },
  {
    level: "senior",
    q: "When would you adopt Compose vs stay with the View system, and can they coexist?",
    a: [
      {
        t: "p",
        text: "Compose is Google's recommended toolkit for new UI, and it can coexist with Views both directions, so the realistic answer is almost never 'rewrite everything' — it's 'adopt Compose for new screens and incrementally, using interop, while Views remain fully supported'.",
      },
      {
        t: "list",
        items: [
          "**Use Compose for** — new features and screens, new apps, and places where custom UI is expensive in Views (Compose makes custom layouts/drawing far cheaper). It removes whole bug classes (state-sync, forgotten transitions) and is where the ecosystem is heading.",
          "**Stay with Views when** — you have a large, stable View codebase that works (no need to rewrite), a team not yet ramped on Compose, or a specific edge case where a mature View library has no Compose equivalent yet.",
          "**They coexist both ways** — `ComposeView` embeds Compose inside XML/Fragment screens (add Compose to an existing app screen by screen); `AndroidView` embeds a View (MapView, WebView, ad SDK) inside a Compose screen.",
        ],
      },
      {
        t: "p",
        text: "The honest trade-off: Compose eliminates state-sync bugs and makes custom UI dramatically cheaper, but has a learning curve (the recomposition mental model) and demands performance discipline (stability) that XML never asked of you. The migration strategy is incremental via interop — new screens in Compose, existing screens migrated when touched — not a big-bang rewrite. Saying 'rewrite everything in Compose' is the wrong answer; 'adopt incrementally using two-way interop, Views stay supported' is the right one.",
      },
      {
        t: "note",
        text: "Adopt Compose for new UI and incrementally via interop (ComposeView in Views, AndroidView in Compose); never big-bang rewrite. Views stay fully supported. The trade-off: fewer bug classes + cheaper custom UI vs a learning curve + stability discipline.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a LayoutNode, and how does the composition relate to what's actually on screen?",
    a: [
      {
        t: "p",
        text: "There are *two* trees in Compose. The **composition** is the runtime's record of your composable calls (in the slot table) — it tracks what you emitted and what you remembered. The **LayoutNode tree** is the actual UI tree that gets measured, laid out, and drawn. Composables *emit* LayoutNodes into this second tree; the composition is the recipe, the LayoutNode tree is the rendered structure.",
      },
      {
        t: "list",
        items: [
          "**Composition (slot table)** — the runtime bookkeeping: which composables ran, their inputs, their `remember`ed values, recomposition scopes. Updated on recomposition.",
          "**LayoutNode tree** — the concrete nodes that Compose UI measures (single-pass), places, and draws. When a composable like `Text` runs, it emits/updates a LayoutNode here.",
          "**The link** — recomposition updates the composition, which in turn creates/updates/removes LayoutNodes; then the layout and draw phases operate on the LayoutNode tree.",
        ],
      },
      {
        t: "p",
        text: "This distinction explains the three phases cleanly: *composition* runs your code and updates the LayoutNode tree (what to show); *layout* measures and places those LayoutNodes (where); *draw* renders them (how). It also explains why not everything that recomposes causes layout — if a composable re-runs but emits the same LayoutNode structure, only the changed nodes re-measure/re-draw. Understanding that the composition (recipe) and the LayoutNode tree (rendered result) are distinct is key to reasoning about performance and the phase model.",
      },
      {
        t: "note",
        text: "Two trees: the composition (slot table — the recipe of composable calls/state) and the LayoutNode tree (the concrete nodes measured/placed/drawn). Composables emit LayoutNodes; the three phases (composition→layout→draw) operate across these trees.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a stateful vs a stateless composable?",
    a: [
      {
        t: "p",
        text: "A *stateful* composable holds its own state internally (with `remember`), so callers just use it. A *stateless* composable holds no state — it receives its state as parameters and reports changes via callback lambdas, so the caller decides where state lives. The distinction is the foundation of state hoisting and reusable UI.",
      },
      {
        t: "code",
        title: "Stateful vs stateless",
        code: `// STATEFUL: owns its state — convenient, but caller can't control/observe it
@Composable fun Counter() {
    var count by remember { mutableStateOf(0) }
    Button(onClick = { count++ }) { Text("$count") }
}
// STATELESS: state hoisted up — reusable, testable, previewable
@Composable fun Counter(count: Int, onIncrement: () -> Unit) {
    Button(onClick = onIncrement) { Text("$count") }
}`,
      },
      {
        t: "list",
        items: [
          "**Stateless is preferred for reusable components** — it's testable (pass any state), previewable (`@Preview` with fake data), and reusable in any context, because it makes no assumptions about where state lives.",
          "**Stateful is fine for self-contained UI-only state** — an expandable card's open/closed flag that nobody else cares about can stay internal.",
          "**The common pattern** — a stateful 'screen' composable that owns/collects state, wrapping a stateless 'content' composable that just renders it. Test and preview the content one.",
        ],
      },
      {
        t: "note",
        text: "Stateless composables (state via params, changes via callbacks) are reusable/testable/previewable; stateful ones own state internally (fine for private UI state). Idiom: a stateful screen composable wrapping a stateless content composable.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you organize a Compose screen — what's the typical structure?",
    a: [
      {
        t: "p",
        text: "The idiomatic structure splits a screen into a *stateful route composable* (gets the ViewModel, collects state, handles navigation) and a *stateless content composable* (takes state + lambdas and just renders). This separation makes the UI testable and previewable while keeping the ViewModel wiring in one thin place.",
      },
      {
        t: "code",
        title: "The route + content pattern",
        code: `// STATEFUL route — the only place that touches the ViewModel
@Composable
fun ProfileRoute(viewModel: ProfileViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    ProfileScreen(
        state = state,
        onRefresh = viewModel::refresh,     // events forwarded up
        onEditClick = viewModel::onEdit,
    )
}

// STATELESS content — testable & previewable with fake data
@Composable
fun ProfileScreen(state: ProfileUiState, onRefresh: () -> Unit, onEditClick: () -> Unit) {
    when (state) {
        is ProfileUiState.Loading -> LoadingIndicator()
        is ProfileUiState.Content -> ProfileContent(state.user, onEditClick)
        is ProfileUiState.Error -> ErrorMessage(onRetry = onRefresh)
    }
}

@Preview @Composable
fun ProfileScreenPreview() { ProfileScreen(ProfileUiState.Content(fakeUser), {}, {}) }`,
      },
      {
        t: "list",
        items: [
          "**Route composable** — collects state (`collectAsStateWithLifecycle`), gets the ViewModel, handles navigation. Thin.",
          "**Content composable** — stateless, takes `state` + event lambdas. This is what you preview and UI-test.",
          "**State down, events up (UDF)** — state flows from ViewModel → route → content; events flow content → route → ViewModel.",
        ],
      },
      {
        t: "note",
        text: "Split each screen into a stateful *route* (ViewModel + state collection + nav) and a stateless *content* (state + lambdas). Test/preview the content; keep VM wiring in the thin route. This is UDF applied at the screen level.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is 'donut-hole skipping' and why does 'the whole function re-runs' not mean slow?",
    a: [
      {
        t: "p",
        text: "'Donut-hole skipping' is Compose's ability to re-run an *outer* composable while *skipping* the inner composables whose inputs didn't change — and vice versa, to re-run just an inner lambda while the outer stays cached. The 'donut' is the part that recomposes; the 'hole' is the skipped part inside it. This is why 'the whole function re-runs on recomposition' doesn't mean the whole screen re-renders.",
      },
      {
        t: "code",
        title: "The outer scope recomposes, inner children skip",
        code: `@Composable fun Screen(count: Int) {   // re-runs when count changes
    Header()                            // inputs unchanged -> SKIPPED (the hole)
    Text("Count: $count")               // reads count -> re-runs (the donut)
    ExpensiveList(items)                // items unchanged -> SKIPPED (the hole)
}`,
      },
      {
        t: "list",
        items: [
          "**Groups nest** — the slot table records composables as nested groups, so Compose can re-execute an outer group while skipping inner groups with unchanged, stable inputs.",
          "**The inverse also happens** — `Column { }` content that reads changing state can recompose while the `Column` call itself doesn't; the reverse donut hole.",
          "**Skipping requires stability** — a child is only skipped if its parameters are stable and unchanged (by value). Unstable params defeat the hole, forcing the child to re-run.",
        ],
      },
      {
        t: "p",
        text: "The practical takeaway: when someone worries 'my whole `Screen` function re-runs every time count changes', the answer is that re-running the *function* is cheap because its expensive children (`Header`, `ExpensiveList`) are *skipped* — only the small part that actually reads the changed state produces new output. This is precisely why *stability* matters so much: it's what lets Compose punch holes (skip children) rather than re-render everything. Break stability and the holes close, and now 'the whole function re-runs' *does* mean the whole subtree re-renders.",
      },
      {
        t: "note",
        text: "Donut-hole skipping: an outer composable re-runs while its unchanged children are skipped (the holes). So 'the whole function re-runs' is cheap — the expensive children skip. This *depends on stability*; break it and the holes close.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you log or debug recompositions to see what's re-running?",
    a: [
      {
        t: "p",
        text: "You debug recompositions primarily with the **Layout Inspector** in Android Studio, which shows live *recomposition counts* and *skip counts* per composable as you interact with the app. A composable whose recomposition count climbs when it shouldn't is your problem; healthy composables show lots of skips and few recompositions.",
      },
      {
        t: "list",
        items: [
          "**Layout Inspector recomposition counts** — the primary tool: turn on recomposition counts, interact, and watch which composables re-run vs skip. High recompositions + low skips on something static = a stability/state-scoping problem.",
          "**Compose Compiler Reports** — a compiler flag emits reports classifying each composable as `skippable`/`restartable` and each type as stable/unstable, *with reasons* — telling you *why* a composable isn't skipping.",
          "**A manual recomposition counter** — for a quick check, a `SideEffect { Log.d(\"recompose\", \"Foo ran\") }` inside a composable logs each successful recomposition (useful for pinpointing one composable).",
          "**Composition tracing** — shows composable execution on the system trace timeline (Perfetto) with names, for seeing time spent composing during a janky frame.",
        ],
      },
      {
        t: "p",
        text: "The workflow: Layout Inspector tells you *which* composable recomposes too much; the Compiler Reports tell you *why* (which parameter type is unstable). Then you fix the root cause (stability, keys, deferred reads). And crucially — measure on a *release* build for real numbers, since debug builds recompose/perform differently.",
      },
      {
        t: "note",
        text: "Debug recompositions with Layout Inspector (live recomposition/skip counts — find the culprit), Compose Compiler Reports (find *why* — which type is unstable), and a SideEffect log for a quick per-composable check. Workflow: which (Inspector) → why (Reports) → fix.",
      },
    ],
  },
];

export default qa;
