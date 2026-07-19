// Compose Fundamentals — Content tab. Teaching-first: basics → internals.

const content = [
  {
    heading: "What Jetpack Compose is — and what 'declarative' actually means",
    blocks: [
      {
        t: "p",
        text: "**Jetpack Compose** is Android's modern UI toolkit where you build UI by writing **Kotlin functions** instead of XML layouts. Before Compose, Android UI was **imperative**: you inflated an XML layout into a tree of View objects, kept references to them (`findViewById`, ViewBinding), and *mutated* them step by step — `textView.text = \"Hi\"`, `progressBar.visibility = GONE`. Your code had to describe **how to change** the screen from its current state to the next one, for every possible transition.",
      },
      {
        t: "p",
        text: "Compose is **declarative**: you write a function that describes **what the UI looks like for a given state** — and that's all. You never mutate widgets. When state changes, Compose *re-runs* the relevant functions and figures out the difference itself. The mental model shifts from \"a tree of objects I mutate\" to \"UI = f(state)\": the screen is simply the result of calling your function with the current state.",
      },
      {
        t: "code",
        title: "Imperative (Views) vs declarative (Compose) — the same feature",
        code: `// IMPERATIVE: describe transitions, for every case, manually
fun render(user: User?) {
    if (user == null) {
        progressBar.visibility = View.VISIBLE
        nameText.visibility = View.GONE
    } else {
        progressBar.visibility = View.GONE
        nameText.visibility = View.VISIBLE
        nameText.text = user.name
    }
}

// DECLARATIVE: describe the result; Compose handles transitions
@Composable
fun UserScreen(user: User?) {
    if (user == null) {
        CircularProgressIndicator()
    } else {
        Text(text = user.name)
    }
}`,
      },
      {
        t: "list",
        items: [
          "Why this matters: imperative UI bugs are almost always **forgotten transitions** (you showed the spinner but forgot to hide the error from last time). Declarative UI can't have that class of bug — every run describes the *whole* result from scratch.",
          "\"Re-runs the function\" sounds wasteful — it isn't, because Compose is smart about re-running only what could have changed. That machinery (recomposition) is the heart of Compose and of most interview questions.",
          "Compose is also **unbundled from the OS** (ships as a library, updates without OS updates) and is the foundation of **Compose Multiplatform** — the same model runs on iOS, desktop, and web.",
        ],
      },
    ],
  },
  {
    heading: "@Composable functions — the rules of the game",
    blocks: [
      {
        t: "p",
        text: "A function annotated with `@Composable` is not a normal function. The annotation tells the **Compose compiler plugin** to rewrite it: behind the scenes, every composable secretly receives an extra parameter (a `Composer`) and gets calls injected that record what the function *emits* — text, layout nodes, images — into an in-memory structure. That's why the rules below exist:",
      },
      {
        t: "list",
        items: [
          "**Composables can only be called from other composables** — because they need that hidden Composer parameter, which only the Compose runtime provides. Calling one from a normal function is a compile error.",
          "**They return Unit** (usually) — a composable doesn't *return* UI; it **emits** UI into the composition as a side effect the runtime tracks. `Text(\"Hi\")` adds a text node; it hands you nothing back.",
          "**They can run in any order and in parallel** (in theory): Compose reserves the right to skip, reorder, or run composables optimistically. So they must be **fast and free of your own side effects** — no writing globals, no network calls, no mutating shared objects directly in the body. (Side effects have dedicated, controlled APIs — covered in the Side Effects topic.)",
          "**They can re-run many times** (recomposition) — anything you do in the body must be safe to repeat. Creating an object per call is fine; incrementing a global counter is a bug.",
          "**Naming convention**: composables that emit UI are `PascalCase` nouns (`ProfileCard`), because conceptually they *declare a thing*, not *do an action*.",
        ],
      },
      {
        t: "note",
        text: "Interview phrasing that shows understanding: \"`@Composable` is a compiler contract, like `suspend`. Just as `suspend` functions can only be called from coroutines because the compiler threads a Continuation through them, composables can only be called from composables because the compiler threads a Composer through them.\" That parallel is exactly right and interviewers love it.",
      },
    ],
  },
  {
    heading: "Composition and recomposition — the core concept",
    blocks: [
      {
        t: "p",
        text: "**Composition** is what Compose builds when it runs your composable functions the first time: a tree describing your UI, stored in an internal structure called the **slot table**. Think of it as Compose's memory of *what your functions emitted and with which inputs* — every composable call, its parameters, and its `remember`ed values get a slot.",
      },
      {
        t: "p",
        text: "**Recomposition** is Compose re-running composable functions when the state they read has changed, and updating the composition to match. The critical word is **read**: during execution, Compose tracks exactly which state objects (`State<T>` instances) each composable *reads*. When one of those values changes, Compose knows precisely which functions depend on it — and re-runs **only those**, skipping everything else. This is why \"the whole function re-runs\" doesn't mean \"the whole screen re-renders\".",
      },
      {
        t: "code",
        title: "Recomposition scope in action",
        code: `@Composable
fun Counter() {
    var count by remember { mutableStateOf(0) }   // observable state

    Column {
        Header()                    // reads no state -> never recomposes
        Text("Count: " + count)     // reads count -> recomposes on change
        Button(onClick = { count++ }) {
            Text("Increment")       // reads no state -> skipped
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "When `count` changes: Compose invalidates the nearest **recomposition scope** that read it (here, the `Counter` body), re-runs it, and while re-running, **skips** child composables whose parameters are unchanged (`Header()`, the Button content). Only the `Text` showing count actually produces new output.",
          "Recomposition is **triggered by state writes, scoped by state reads**. You don't subscribe manually to anything — reading `count` inside a composable *is* the subscription. This automatic tracking is done by the **snapshot state system** (detailed in the State topic).",
          "Recomposition must be **restartable**: Compose may abandon a recomposition mid-way if the state changes again before it finishes (e.g. during an animation) and restart with fresh values. Another reason bodies must be side-effect-free.",
          "Key vocab to use precisely: *composition* = the built tree; *initial composition* = first build; *recomposition* = incremental re-execution; *leaving the composition* = a composable's branch no longer being emitted (its `remember`ed state is forgotten).",
        ],
      },
    ],
  },
  {
    heading: "The three phases: Composition → Layout → Draw",
    blocks: [
      {
        t: "p",
        text: "Every frame that needs UI work goes through up to three phases — and understanding them separately is what unlocks both performance work and custom layouts:",
      },
      {
        t: "list",
        items: [
          "**1. Composition — \"what to show\"**: runs your composable functions, producing/updating the tree of layout nodes. This is the only phase that executes *your* composable code.",
          "**2. Layout — \"where to place it\"**: walks the tree; each node measures its children and places them. Compose's layout is **single-pass**: a parent measures each child exactly once (children can't be re-measured in the same pass) — this is why deep nesting doesn't cause the exponential double-measurement View systems suffered from.",
          "**3. Draw — \"how to render it\"**: nodes draw themselves into a Canvas, top-down.",
        ],
      },
      {
        t: "p",
        text: "The key performance insight: **the phases can run independently**. If only *where* something sits changes (a drag offset), Compose can skip composition entirely and just re-layout; if only *pixels* change (a color animation), it can skip straight to draw. You opt into this by **deferring state reads** to the latest possible phase — e.g. using the lambda version of `offset` or `graphicsLayer` so the animated value is read during layout/draw instead of composition:",
      },
      {
        t: "code",
        title: "Deferring a read to skip recomposition entirely",
        code: `// BAD: reads dragOffset during COMPOSITION -> recomposes every drag frame
Box(Modifier.offset(x = dragOffset, y = 0.dp))

// GOOD: lambda defers the read to the LAYOUT phase ->
// dragging re-runs layout only; composition never re-executes
Box(Modifier.offset { IntOffset(dragOffset.roundToPx(), 0) })

// Same idea for draw-phase-only changes:
Box(Modifier.graphicsLayer { alpha = animatedAlpha.value })`,
      },
      {
        t: "note",
        text: "This is one of the highest-frequency Compose interview questions: \"name the phases, and how do you use them to optimize?\" Answer: composition/layout/draw; state read *location* decides which phase re-runs; defer reads (lambda modifiers, `graphicsLayer`) so high-frequency changes touch only layout or draw.",
      },
    ],
  },
  {
    heading: "Under the hood: slot table, Composer, and positional memoization",
    blocks: [
      {
        t: "p",
        text: "You don't need internals to *use* Compose, but interviewers use them to separate depth from surface knowledge. The essentials, plainly:",
      },
      {
        t: "list",
        items: [
          "**The slot table** is a gap-buffer data structure where the composition lives: every composable call gets a **group** identified by its *position in the code* (compiler-generated key), storing its inputs and `remember`ed slots. On recomposition, Compose walks the table, compares stored inputs to new ones, and re-executes only mismatching groups.",
          "**Positional memoization**: identity comes from *call position*, not function name. The same `Text()` called at two different places in code is two different groups with independent state. Call it in a loop and each iteration's position is the same — which is why dynamic lists need `key()` to give items stable identities (detailed in Lazy Lists).",
          "**The Composer** is the hidden parameter the compiler injects into every composable: it's the cursor into the slot table — `startGroup`/`endGroup` calls the compiler inserts around your code are it navigating and diffing the table.",
          "**Donut-hole skipping**: because groups nest, Compose can re-run an outer function but skip inner groups whose inputs didn't change (the 'donut'), or re-run just an inner lambda while the outer stays cached (the 'hole') — this is what makes 'the whole function re-runs' cheap in practice.",
          "**The Recomposer** is the scheduler: it collects invalidated scopes and drives recomposition each frame, synchronized with the display's frame clock (`withFrameNanos`).",
        ],
      },
    ],
  },
  {
    heading: "Where composition starts: setContent and the bridge to the OS",
    blocks: [
      {
        t: "code",
        title: "The entry point",
        code: `class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {                 // creates the composition
            MyAppTheme {
                AppNavHost()
            }
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "`setContent` installs a single **ComposeView** as the Activity's content — under Compose there is still exactly *one* Android View hosting the whole composition; inside it, Compose manages its own node tree (LayoutNodes), not Views.",
          "That's why Compose interops cleanly both directions: a `ComposeView` can sit inside XML layouts, and `AndroidView { }` can host a classic View inside a composition (covered in the Interop topic).",
          "Frame flow end-to-end: state write → snapshot notifies → Recomposer schedules → next vsync: recompose invalid scopes → layout → draw → render thread. Knowing this pipeline lets you answer \"what actually happens when I click a button?\" precisely.",
        ],
      },
    ],
  },
  {
    heading: "Compose vs the View system — the comparison question",
    blocks: [
      {
        t: "table",
        headers: ["", "View system (XML)", "Compose"],
        rows: [
          ["UI definition", "XML inflated into View objects", "Kotlin functions emitting nodes"],
          ["Updates", "imperative mutation of retained objects", "re-execution + diffing (recomposition)"],
          ["State handling", "manual sync between data and widgets", "UI derived from state; tracking automatic"],
          ["Measurement", "multiple measure passes possible (exponential in nesting)", "single-pass; intrinsics for the exceptions"],
          ["Reuse", "custom Views, styles, fragments", "plain functions — trivially composable and parameterizable"],
          ["Tooling age", "20 years of maturity, every edge case solved", "modern preview/live-edit; some advanced cases still land first in Views"],
          ["Interop", "—", "two-way (ComposeView / AndroidView)"],
        ],
      },
      {
        t: "list",
        items: [
          "Balanced take for interviews: Compose removes whole bug classes (state-sync, forgotten transitions) and makes custom UI dramatically cheaper; the costs are a learning curve (recomposition mental model), some interop seams, and needing performance discipline (stability) that XML never asked of you.",
          "New development is Compose-first per Google; the View system remains supported and coexists via interop — 'rewrite everything' is never the right answer in an interview.",
        ],
      },
    ],
  },
];

export default content;
