// Compose State — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What does remember do, and why do we need it if we already have mutableStateOf?",
    a: [
      {
        t: "p",
        text: "**The concept**: Compose re-executes your composable function on every recomposition — so any local variable created in the body is created *again*, from scratch, each time. `remember { ... }` opts a value out of that: it runs its lambda once, stores the result in the composition (the slot table), and on every later execution returns the stored value instead of recomputing.",
      },
      {
        t: "p",
        text: "**Why both are needed**: `mutableStateOf` and `remember` solve two different problems. `mutableStateOf(0)` makes a value *observable* — Compose recomposes readers when it changes. But if you write `var count by mutableStateOf(0)` without `remember`, every recomposition creates a **brand-new state object reset to 0** — you increment it, recomposition happens, and the new execution builds a fresh zero. The UI appears frozen at the initial value. `remember` keeps the *same* state object alive across executions. Conversely, `remember { 0 }` alone survives but notifies nobody on change. So: **remember = survival, mutableStateOf = observability**, and UI state needs both: `remember { mutableStateOf(0) }`.",
      },
      {
        t: "p",
        text: "**Edge cases worth adding**: `remember(key)` re-runs the lambda when the key changes (for state that must reset when an input changes); and remembered values die when the composable **leaves the composition** (its `if` branch stops being emitted, it's scrolled far away in a lazy list) — remember-lifetime equals presence in the tree, which is why rotation (which rebuilds the whole composition) also wipes it, leading to `rememberSaveable`.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between remember and rememberSaveable?",
    a: [
      {
        t: "p",
        text: "**The concept first**: `remember` stores values in the composition — and the composition lives inside the Activity. A configuration change (rotation, dark mode, resize) destroys and recreates the Activity, taking the entire composition and everything remembered with it. So `remember` survives *recomposition*, but not *recreation*.",
      },
      {
        t: "p",
        text: "`rememberSaveable` does everything `remember` does, **plus** writes the value into the saved-instance-state `Bundle` (the same mechanism as `onSaveInstanceState`). After rotation — and even after system-initiated **process death** — the value is restored. Requirements: the type must be Bundle-compatible (primitives, String, Parcelable, Serializable), or you supply a custom `Saver` telling Compose how to convert it to something saveable.",
      },
      {
        t: "p",
        text: "**How to choose**: use `rememberSaveable` for anything a user would be annoyed to lose on rotating the phone — typed text, selected tab, checkbox choices. Use `remember` for transient/visual scratch state that's fine resetting. And know the boundary: screen *data* (the loaded list, the user object) belongs in the ViewModel, not in either — `rememberSaveable` is for small widget-level state, and stuffing big data into it risks `TransactionTooLargeException` like any Bundle abuse.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is state hoisting and why is it recommended?",
    a: [
      {
        t: "p",
        text: "**The concept**: a composable can either *own* its state internally (`var text by remember {...}` inside it) or have the state **hoisted** — moved up to the caller, with the composable receiving the current `value` as a parameter and reporting changes through an `onValueChange` lambda. The composable becomes *stateless*: a pure function of its inputs that holds nothing itself. This is literally how Compose's own components work — `TextField(value, onValueChange)`, `Checkbox(checked, onCheckedChange)` — none of them store their own value.",
      },
      {
        t: "list",
        items: [
          "**Single source of truth**: without hoisting, the text lives both inside the widget and in your ViewModel, and they *will* drift apart. Hoisted, exactly one place owns it.",
          "**The parent gains control**: it can validate input, transform it (force uppercase), share it between widgets, persist it — impossible when the state is locked inside a child.",
          "**Reusability + previews + tests**: a stateless composable can be dropped into any screen, previewed with any state (`@Preview` can't provide ViewModels), and tested by passing values directly.",
          "**It completes UDF**: state flows down as parameters, events flow up as lambdas — same pattern as ViewModel↔UI, applied recursively down the tree.",
        ],
      },
      {
        t: "p",
        text: "**The judgment part**: don't hoist dogmatically. Hoist to the **lowest common ancestor** of everything that reads or writes the state — and no higher. A dropdown's open/closed flag that nobody else cares about is fine staying internal; hoisting it to the ViewModel is noise. The interview-ready phrasing: \"internal state for UI-only concerns, hoisted state the moment a second party needs it.\"",
      },
    ],
  },
  {
    level: "junior",
    q: "Why doesn't the UI update when I add items to a remember { mutableListOf() }?",
    a: [
      {
        t: "p",
        text: "**The concept behind the bug**: Compose doesn't watch your objects' *contents* — it watches **snapshot state objects**. `remember { mutableListOf<String>() }` stores a plain `ArrayList` in the composition. When you call `list.add(item)`, the list mutates internally, but nothing observable happened from Compose's perspective: no `State` was written, so no scope is invalidated, so nothing recomposes. The data is there — the screen just never re-reads it.",
      },
      {
        t: "code",
        title: "Three correct alternatives",
        code: `// 1) Observable collection — element operations trigger recomposition
val items = remember { mutableStateListOf<String>() }
items.add("new")            // recomposes readers

// 2) Immutable value in observable holder — replace, don't mutate
var items by remember { mutableStateOf(listOf<String>()) }
items = items + "new"       // new list assigned -> write -> recomposes

// 3) Real app: state lives in the ViewModel as StateFlow<List<T>>
//    and the UI just collects it`,
      },
      {
        t: "p",
        text: "**The deeper lesson interviewers want**: mutation vs replacement. Compose's model favors **immutable values replaced through observable writes** — replacement is what the snapshot system can see, and equality of immutable values is what powers skipping. `mutableStateListOf` exists as the escape hatch for genuinely list-shaped local state, but if you find yourself mutating shared objects hoping the UI notices, the design is fighting the framework.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does the 'by' keyword do in `var count by remember { mutableStateOf(0) }`?",
    a: [
      {
        t: "p",
        text: "**The concept**: `remember { mutableStateOf(0) }` gives you a `MutableState<Int>` — a *box* with a `.value` property. Without any sugar, you'd read `count.value` and write `count.value = 5` everywhere. Kotlin's **property delegation** (`by`) lets an object handle a property's get/set: `MutableState` provides `getValue`/`setValue` operator functions, so `var count by ...` makes plain-looking `count` reads and writes secretly go through `.value`.",
      },
      {
        t: "p",
        text: "**What it changes — and doesn't**: purely syntax; the same state object is involved, the same read-tracking and recomposition happen (reading `count` still registers the read; assigning still triggers invalidation). Two practical notes: use `=` (not `by`) when you want to pass the `State` object itself around — `val countState = remember { mutableStateOf(0) }` — for example to hand a stable reference into a lambda; and the delegate imports (`androidx.compose.runtime.getValue/setValue`) are needed for `by` to compile, the source of a classic head-scratcher error for newcomers.",
      },
    ],
  },
  {
    level: "junior",
    q: "collectAsState vs collectAsStateWithLifecycle — which one and why?",
    a: [
      {
        t: "p",
        text: "**The concept**: a `StateFlow` in your ViewModel isn't something composables can read directly — Compose needs snapshot state. Both functions bridge this: they collect the flow inside the composition and mirror each emission into a `State<T>`, so your composable recomposes on new values. The difference is *when collection is active*.",
      },
      {
        t: "p",
        text: "`collectAsState()` collects for as long as the composable is in the composition — **including while the app is in the background**, because backgrounding doesn't dispose the composition. `collectAsStateWithLifecycle()` additionally respects the lifecycle: it uses `repeatOnLifecycle(STARTED)` internally, so collection **stops at ON_STOP and restarts at ON_START**. Combined with the standard `stateIn(SharingStarted.WhileSubscribed(5000))` in the ViewModel, backgrounding the app stops not just the collection but the whole upstream chain (DB observation, location, sockets) — no wasted work while invisible.",
      },
      {
        t: "p",
        text: "**Answer**: on Android, default to `collectAsStateWithLifecycle` (it's in `lifecycle-runtime-compose`). `collectAsState` remains for contexts without an Android lifecycle — previews, desktop/multiplatform targets. If asked \"what actually goes wrong with plain collectAsState?\": a flow of, say, GPS updates keeps the location pipeline alive with the app minimized — battery drain and pointless processing until the process is killed.",
      },
    ],
  },
  {
    level: "junior",
    q: "Where should state live — the composable, a state holder, or the ViewModel?",
    a: [
      {
        t: "p",
        text: "**The concept**: Compose apps have a spectrum of state owners, and the skill is matching state to the cheapest owner that satisfies its consumers. The question to ask of every piece of state: *who needs to read or write this, and how long must it live?*",
      },
      {
        t: "list",
        items: [
          "**Inside the composable** (`remember`/`rememberSaveable`): UI-element state nobody else cares about — is the dropdown expanded, current text-field selection, animation scratch. Dies with the composable, and that's correct.",
          "**Plain state-holder class** (`remember`ed, like `rememberLazyListState()`): several intertwined pieces of *UI logic* — scroll position + 'show jump button', drag state + snap targets. Still UI-lifetime, but organized and reusable; this is Compose's own pattern for every `rememberXxxState` API.",
          "**ViewModel**: *screen* state and anything involving business/data — loaded content, loading/error flags, user input that must survive configuration change or feed validation. Survives rotation, integrates SavedStateHandle for process death, testable on the JVM.",
        ],
      },
      {
        t: "p",
        text: "**The boundary rule**: business state never lives in `remember`; pure UI mechanics never need a ViewModel. And when one piece of state is needed at two levels (query text shown in the field *and* driving search), hoist it to the higher owner — the ViewModel — and pass it down; duplicating it at both levels is the drift bug hoisting exists to prevent.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain derivedStateOf: what problem it solves, how it works, and when it's the wrong tool.",
    a: [
      {
        t: "p",
        text: "**The problem**: recomposition frequency is driven by how often *read state changes* — not by how often the UI actually needs to look different. Scroll offset changes every frame while scrolling; if your composable reads `listState.firstVisibleItemIndex > 3`, the scope recomposes every frame even though the boolean answer flips maybe twice in the whole gesture. You're paying per-input-change for a per-output-change need.",
      },
      {
        t: "p",
        text: "**How it works**: `derivedStateOf { ... }` creates an intermediate state node. Its lambda runs whenever any snapshot state it reads changes (cheap — just the lambda, not your UI), and the node compares the new result to the previous one by equality. **Only when the result differs** does it invalidate scopes that read the derived value. It's a change-frequency filter between fast inputs and slow outputs — conceptually the snapshot-world version of `distinctUntilChanged`.",
      },
      {
        t: "list",
        items: [
          "**Wrong tool #1 — output changes as often as input**: `derivedStateOf { a + b }` where the sum changes on every write adds tracking overhead and filters nothing; plain inline computation or `remember(a, b)` is cheaper.",
          "**Wrong tool #2 — inputs aren't snapshot state**: it only observes snapshot reads. Deriving from a plain function parameter observes nothing and silently never updates — the parameter changing causes recomposition anyway, so use `remember(param) { compute(param) }` instead. This distinction (parameter changes → remember with keys; state-object changes at higher frequency → derivedStateOf) is the crispest way to show mastery.",
          "**Bug to name**: forgetting to wrap it in `remember { derivedStateOf { ... } }` — recreated every recomposition, the comparison history is lost and the optimization silently vanishes.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "How does Compose's snapshot state system actually work? (How does reading state subscribe, and why is it thread-safe?)",
    a: [
      {
        t: "p",
        text: "**The design**: Compose state is built on **snapshots** — an MVCC (multi-version concurrency control) scheme, the same family databases use for isolation. Each `mutableStateOf` object internally keeps a *list of value records*, each stamped with the id of the snapshot that wrote it. Code always runs *inside* some snapshot, and reading a state object returns the newest record valid for that snapshot — so every computation sees one consistent version of the world, unaffected by writes happening elsewhere mid-flight.",
      },
      {
        t: "p",
        text: "**How reading subscribes**: snapshots support **read observers**. When the Recomposer runs composition, it opens a snapshot whose read observer logs every state object read, attributed to the currently-executing recomposition scope. That log *is* the subscription table — no listeners registered by you, reading is subscribing. **How writing notifies**: writes in a mutable snapshot create new records invisible to others until the snapshot is atomically **applied** (a commit); apply-observers then receive the set of changed objects, and the Recomposer intersects 'objects changed' with 'scopes that read them' to invalidate exactly the right scopes for the next frame.",
      },
      {
        t: "p",
        text: "**Why thread-safe**: because writes go into isolated snapshots and only become visible at atomic apply, a background thread writing `mutableStateOf` can't tear a half-finished composition — the composition's snapshot simply doesn't see the write until its next run. Concurrent conflicting snapshots detect collisions at apply time (optimistic concurrency). Practical corollaries worth naming: writing snapshot state from any thread is safe (unusual for UI frameworks); `Snapshot.withMutableSnapshot { }` batches multi-write consistency; and `snapshotFlow { }` is the same read-observer trick repackaged to emit into a Flow — the bridge *out* of the snapshot world, mirroring `collectAsState` bridging in.",
      },
    ],
  },
  {
    level: "senior",
    q: "A callback registered once keeps seeing stale state. Explain why lambdas capture stale values and the fixes.",
    a: [
      {
        t: "p",
        text: "**The concept**: every recomposition creates *new* lambda instances capturing the *current* values. That's fine for lambdas Compose re-reads each time (like `onClick` passed to Button — the newest lambda replaces the old in the composition). The trap is a lambda handed to something **long-lived that won't be replaced**: a broadcast receiver registered in a `DisposableEffect(Unit)`, a delayed coroutine in `LaunchedEffect(Unit)`, a listener on a singleton. That lambda was created during one particular composition and captured that moment's values — later recompositions create new lambdas, but the long-lived consumer still holds the original. It's not Compose magic misbehaving; it's ordinary closure capture meeting an unusual re-execution model.",
      },
      {
        t: "code",
        title: "The bug and the idiomatic fix",
        code: `@Composable
fun Timer(onTimeout: () -> Unit) {
    // BUG: effect keyed to Unit runs once, capturing the FIRST onTimeout.
    // If the parent recomposes with a new handler, timeout calls the old one.
    LaunchedEffect(Unit) {
        delay(60_000)
        onTimeout()               // stale!
    }

    // FIX: rememberUpdatedState gives a stable State box whose
    // .value is refreshed every recomposition
    val currentOnTimeout by rememberUpdatedState(onTimeout)
    LaunchedEffect(Unit) {
        delay(60_000)
        currentOnTimeout()        // always the latest handler
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Fix 1 — `rememberUpdatedState`**: capture a stable `State` wrapper instead of the value; the wrapper's `.value` is written on each recomposition, so the old closure dereferences fresh data. Use when the effect must *not* restart (a timer, a registered receiver).",
          "**Fix 2 — key the effect on the value**: `LaunchedEffect(onTimeout)` cancels and relaunches with the new capture. Correct when restarting is acceptable/desired; wrong for the one-shot-timer case (it would reset the countdown).",
          "**The decision rule to state**: 'should this ongoing work restart when the value changes?' Yes → put it in the keys. No → `rememberUpdatedState`. That sentence is the whole topic.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "What is a 'backwards write' and what happens if you write state during composition?",
    a: [
      {
        t: "p",
        text: "**The concept**: composition is supposed to be a *read-only derivation* — run functions, read state, emit UI. A **backwards write** breaks the direction: writing a state object during composition that composition (the same pass or an enclosing scope) has already read. The result is a self-invalidating loop: the pass reads X, then writes X → the write invalidates the scope that read it → next frame recomposes → reads and writes again → an **infinite recomposition loop**, burning a full extra frame of work forever. Compose detects simple cases and logs a 'backwards write' warning, but the loop still runs.",
      },
      {
        t: "code",
        title: "Bug vs the correct homes for the logic",
        code: `@Composable
fun Bad(items: List<Item>) {
    var count by remember { mutableStateOf(0) }
    count = items.size          // WRITE during composition of state read below
    Text("Count: " + count)     // READ -> loop
}

// If it's derivable — don't store it at all:
@Composable
fun Good(items: List<Item>) {
    Text("Count: " + items.size)
}

// If it must react to a change — that's an effect, not composition:
LaunchedEffect(items) { analytics.log(items.size) }`,
      },
      {
        t: "p",
        text: "**The rule and its exceptions**: writes belong in **event handlers** (clicks) and **effects** (`LaunchedEffect`, `SideEffect`) — never in the composable body. Two refinements that show depth: initializing state *inside* `remember { mutableStateOf(initial) }` is fine (it's construction, not a tracked write to observed state); and 'derive, don't sync' — most backwards writes are people caching something computable, and the real fix is deleting the stored state, not relocating the write. If genuine derived-state caching is needed, that's `remember(key)` or `derivedStateOf` doing it safely.",
      },
    ],
  },
  {
    level: "senior",
    q: "Compare holding screen state as StateFlow in the ViewModel vs mutableStateOf in the ViewModel. Trade-offs?",
    a: [
      {
        t: "p",
        text: "**Both are legitimate** — this is a real design choice, not a trick. `var uiState by mutableStateOf(UiState())` (private set) in a ViewModel works because snapshot state is observable from composables directly; Google's own samples have used it. `MutableStateFlow` + `asStateFlow` is the more traditional shape. What differs:",
      },
      {
        t: "list",
        items: [
          "**Toolkit coupling**: `mutableStateOf` ties the ViewModel to the Compose *runtime* (a dependency, though not the UI toolkit). StateFlow is pure kotlinx — matters enormously in **KMP** (iOS consumes StateFlow via SKIE/adapters; snapshot state has no Swift story) and if any non-Compose consumer exists.",
          "**Operators & derivation**: StateFlow plugs into the whole Flow world — `combine`, `debounce`, `flatMapLatest`, `stateIn` chains from repositories. Snapshot state has `snapshotFlow` as a bridge but no native operator algebra.",
          "**Lifecycle-aware collection**: StateFlow + `collectAsStateWithLifecycle` + `WhileSubscribed` gives automatic stop-upstream-when-backgrounded. Compose state read directly has no such notion — the state just sits there (fine for cheap state, a non-feature for expensive upstreams).",
          "**Ergonomics**: mutableStateOf wins on simplicity — no `.update {}`, no initial-value duplication, granular per-field states are trivial. Also no equality-conflation surprises (though StateFlow's skip-equal behavior is usually what you want for state).",
          "**Testing**: StateFlow tests with Turbine/standard Flow tooling; Compose-state ViewModels test fine too but pull the Compose runtime into JVM tests.",
        ],
      },
      {
        t: "p",
        text: "**Recommendation to give**: StateFlow as the default — especially for KMP-bound code (which, for an Android/KMP engineer, is decisive) and screens with derived/combined streams; `mutableStateOf` in ViewModels is a pragmatic choice for Compose-only Android apps that value ergonomics. Either way, expose read-only, mutate only inside the ViewModel — the UDF contract is the invariant; the container is negotiable.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is 'state' in Compose, fundamentally?",
    a: [
      {
        t: "p",
        text: "State in Compose is any value that can change over time and that the UI should reflect. Because Compose re-runs functions instead of mutating widgets, state must satisfy two needs at once: it must *survive* recomposition (a plain local variable would reset every re-run), and it must be *observable* (Compose must know when it changed so it can recompose the parts that read it).",
      },
      {
        t: "list",
        items: [
          "**`mutableStateOf(value)`** provides the *observability* — it creates a `MutableState<T>` holder; reading `.value` subscribes the current composable, writing `.value` triggers recomposition of subscribers.",
          "**`remember { }`** provides the *survival* — it stores the value in the slot table so it persists across recompositions.",
          "**Together** — `var x by remember { mutableStateOf(0) }` gives you state that both survives re-runs and triggers recomposition on change.",
        ],
      },
      {
        t: "p",
        text: "The mental model 'UI = f(state)' makes state central: the whole screen is derived from state, so what state you have and where it lives *is* your app's design. Reading state inside a composable is how it 'subscribes' — there's no manual observer registration. Understanding that state needs both survival (`remember`) and observability (`mutableStateOf`) is the foundation of everything else in Compose state.",
      },
      {
        t: "note",
        text: "State = a changing value the UI reflects, needing *survival* (remember) + *observability* (mutableStateOf). Reading it subscribes the composable; writing it recomposes subscribers. UI = f(state), so state is your app's design.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is MutableState and the State<T> interface?",
    a: [
      {
        t: "p",
        text: "`State<T>` is a read-only holder of an observable value — reading its `.value` from a composable subscribes that composable to changes. `MutableState<T>` extends it with a settable `.value`, so you can write to it. `mutableStateOf()` returns a `MutableState`; several APIs (like `collectAsState`, `derivedStateOf`) return a read-only `State`.",
      },
      {
        t: "code",
        title: "State vs MutableState",
        code: `val count: MutableState<Int> = mutableStateOf(0)   // read + write
count.value = 5                                     // write -> recomposes readers
val len: State<Int> = derivedStateOf { count.value * 2 }  // read-only

// The 'by' delegate unwraps .value:
var c by remember { mutableStateOf(0) }   // 'c' reads/writes .value transparently
val readOnly by remember { derivedStateOf { c * 2 } }`,
      },
      {
        t: "list",
        items: [
          "**`State<T>`** — read-only observable value (`collectAsState`, `derivedStateOf` return this). Reading `.value` subscribes.",
          "**`MutableState<T>`** — read/write. `mutableStateOf` returns this.",
          "**Exposing read-only** — you often store a `MutableState` privately but expose it as `State` so callers can read but not write (encapsulation, single-writer).",
        ],
      },
      {
        t: "note",
        text: "State<T> = read-only observable value (reading .value subscribes); MutableState<T> adds a settable .value. mutableStateOf returns MutableState; derivedStateOf/collectAsState return read-only State. Expose State to prevent outside writes.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are mutableStateListOf and mutableStateMapOf, and when do you use them?",
    a: [
      {
        t: "p",
        text: "`mutableStateListOf()` and `mutableStateMapOf()` are *observable collections* — like `MutableList`/`MutableMap`, but Compose recomposes readers when you add, remove, or change elements. They solve the problem that a plain `remember { mutableListOf() }` doesn't trigger recomposition when you mutate it (because the list reference never changed and the list isn't observable).",
      },
      {
        t: "code",
        title: "Observable collections vs the broken plain version",
        code: `// BROKEN: mutating a plain list doesn't recompose (reference unchanged, not observable)
val items = remember { mutableListOf<String>() }
items.add("x")   // UI does NOT update

// FIXED option 1: observable collection — element ops trigger recomposition
val items = remember { mutableStateListOf<String>() }
items.add("x")   // UI updates

// FIXED option 2: immutable list in a MutableState — replace, don't mutate
var items by remember { mutableStateOf(listOf<String>()) }
items = items + "x"   // new list assigned -> recomposes`,
      },
      {
        t: "list",
        items: [
          "**`mutableStateListOf`** — observable at the *element* level; `add`/`remove`/`set` each trigger recomposition. Good for a list you mutate frequently in place.",
          "**`mutableStateMapOf`** — same for maps (put/remove trigger recomposition).",
          "**The alternative** — an immutable `listOf()` inside a `mutableStateOf`, replaced with `copy`/`+`. This is often preferred for state that flows from a ViewModel (immutable, stable for skipping), while `mutableStateListOf` suits local, mutation-heavy UI state.",
        ],
      },
      {
        t: "note",
        text: "mutableStateListOf/mutableStateMapOf are observable collections — element operations trigger recomposition (a plain mutableListOf doesn't). Use them for local mutation-heavy state; prefer immutable list + mutableStateOf for VM-driven state (stable for skipping).",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the primitive state variants like mutableIntStateOf, and why do they exist?",
    a: [
      {
        t: "p",
        text: "`mutableIntStateOf`, `mutableLongStateOf`, `mutableFloatStateOf`, `mutableDoubleStateOf` are specialized state holders for primitive types that *avoid autoboxing*. A regular `mutableStateOf<Int>(0)` boxes the `Int` into an `Integer` object; the primitive variants store the primitive directly, saving allocations — which matters for state that changes very frequently (animations, scroll offsets, counters).",
      },
      {
        t: "code",
        title: "Boxed vs unboxed primitive state",
        code: `var count by remember { mutableStateOf(0) }        // boxes Int -> Integer on each set
var count by remember { mutableIntStateOf(0) }     // stores primitive int, no boxing

var offset by remember { mutableFloatStateOf(0f) } // ideal for frequently-changing values`,
      },
      {
        t: "list",
        items: [
          "**Avoids autoboxing** — the primitive variants store the value without wrapping it in an object, reducing allocations and GC pressure.",
          "**Matters for high-frequency state** — a scroll offset or animation value that updates 60×/second benefits; a counter tapped occasionally doesn't really.",
          "**Same API** — used exactly like `mutableStateOf` with `by`, just typed for the primitive.",
        ],
      },
      {
        t: "note",
        text: "mutableIntStateOf/FloatStateOf/etc. store primitives without autoboxing, cutting allocations — worth it for high-frequency state (animations, scroll offsets). Lint even suggests them. Same API as mutableStateOf.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle text input (TextField) state in Compose?",
    a: [
      {
        t: "p",
        text: "A `TextField` is stateless by design — it takes the current text `value` and an `onValueChange` callback, and holds *no* text state itself. You own the state (hoisted), update it in `onValueChange`, and pass it back down. This is state hoisting applied to text input, and it's what lets you validate, transform, or share the text.",
      },
      {
        t: "code",
        title: "Hoisted text state",
        code: `var query by rememberSaveable { mutableStateOf("") }   // survives rotation
TextField(
    value = query,
    onValueChange = { newText ->
        query = newText.take(50)          // you control it: e.g. limit length, validate
    },
    label = { Text("Search") },
)
// Real screens hoist this to the ViewModel so it can drive search:
// TextField(value = uiState.query, onValueChange = viewModel::onQueryChange)`,
      },
      {
        t: "list",
        items: [
          "**TextField is stateless** — `value` + `onValueChange`, no internal text. *You* own the text.",
          "**Use `rememberSaveable`** so the typed text survives rotation (or hoist to the ViewModel/SavedStateHandle for process-death survival).",
          "**You control the input** — transform/validate in `onValueChange` (uppercase, length limits, digit-only). Because *you* hold the state, you can.",
        ],
      },
      {
        t: "p",
        text: "A performance note for very high-frequency typing: routing every keystroke through the full state loop (especially up to a ViewModel with a debounced search) is standard, but for the *raw text field* itself, some apps keep the immediate text as local `rememberSaveable` state and only push committed/debounced values up — to avoid a full recomposition cascade per keystroke. Compose also has newer `TextFieldState`-based APIs that manage text state more efficiently.",
      },
      {
        t: "note",
        text: "TextField is stateless (value + onValueChange) — you hoist and own the text, letting you validate/transform it. Use rememberSaveable (rotation) or the ViewModel (process death). Newer TextFieldState APIs handle high-frequency text more efficiently.",
      },
    ],
  },
  {
    level: "junior",
    q: "What survives a configuration change vs process death for Compose state?",
    a: [
      {
        t: "p",
        text: "This is the crux of choosing `remember` vs `rememberSaveable` vs a ViewModel. Different mechanisms survive different events: `remember` survives recomposition but *not* configuration changes; `rememberSaveable` survives both configuration changes *and* process death (via the saved-instance Bundle); a ViewModel survives configuration changes but *not* process death.",
      },
      {
        t: "table",
        headers: ["", "Recomposition", "Config change (rotation)", "Process death"],
        rows: [
          ["`remember { }`", "survives", "lost", "lost"],
          ["`rememberSaveable { }`", "survives", "survives", "survives (Bundle)"],
          ["ViewModel state", "survives", "survives", "lost (unless SavedStateHandle)"],
          ["plain `var`", "lost", "lost", "lost"],
        ],
      },
      {
        t: "p",
        text: "So the decision: `remember` for transient UI state you're fine losing on rotation (animation scratch values); `rememberSaveable` for small UI state a user would be annoyed to lose (text input, selected tab); the ViewModel for screen data (survives config change in memory); and `SavedStateHandle` in the ViewModel for the *ids/inputs* needed to rebuild after process death. The robust pattern combines them: ViewModel (config change) + SavedStateHandle (process death) + rememberSaveable for widget-level state.",
      },
      {
        t: "note",
        text: "remember: survives recomposition only. rememberSaveable: + config change + process death (Bundle). ViewModel: + config change, NOT process death (needs SavedStateHandle). Combine them: ViewModel for data, SavedStateHandle for process-death ids, rememberSaveable for widget state.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you write a custom Saver for rememberSaveable?",
    a: [
      {
        t: "p",
        text: "`rememberSaveable` can only save types the `Bundle` understands (primitives, String, Parcelable, Serializable). For a custom type, you provide a **`Saver`** — an object that tells Compose how to convert your type *to* something saveable and *back*. Then your custom type survives rotation and process death.",
      },
      {
        t: "code",
        title: "A custom Saver",
        code: `data class Filter(val tag: String, val enabled: Boolean)

// listSaver: convert to/from a List of Bundle-able values
val FilterSaver = listSaver<Filter, Any>(
    save = { listOf(it.tag, it.enabled) },              // Filter -> saveable list
    restore = { Filter(it[0] as String, it[1] as Boolean) },  // list -> Filter
)

var filter by rememberSaveable(stateSaver = FilterSaver) {
    mutableStateOf(Filter("all", true))
}

// Or mapSaver for named fields; or @Parcelize on the data class (simplest):
@Parcelize data class Filter2(val tag: String, val enabled: Boolean) : Parcelable
var f by rememberSaveable { mutableStateOf(Filter2("all", true)) }  // no Saver needed`,
      },
      {
        t: "list",
        items: [
          "**`listSaver`** — save your object as a list of Bundle-able values, restore by reading positions.",
          "**`mapSaver`** — same but with named keys (more readable for many fields).",
          "**`Saver` object** — full control via `save`/`restore` for complex cases.",
          "**Simplest — `@Parcelize`** — if the type is `Parcelable`, no Saver is needed; `rememberSaveable` handles it automatically. Prefer this when you control the type.",
        ],
      },
      {
        t: "note",
        text: "rememberSaveable only saves Bundle-able types; a custom Saver (listSaver/mapSaver/Saver) defines to-saveable and back. Simplest path: make the type @Parcelize Parcelable — then no Saver is needed at all.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why should UiState be immutable, and what breaks if it isn't?",
    a: [
      {
        t: "p",
        text: "UiState should be an immutable data class (all `val`, immutable collections) that you replace wholesale via `copy()`. If it's mutable — a `var` field or a `mutableListOf` inside — you break two things Compose relies on: *recomposition triggering* (mutating in place doesn't change the reference, so Compose doesn't notice) and *skipping* (unstable types aren't skippable, and equality checks become meaningless).",
      },
      {
        t: "code",
        title: "Mutable UiState breaks updates and skipping",
        code: `// BAD: mutable — in-place changes don't recompose, and it's unstable
data class UiState(var items: MutableList<Item>, var isLoading: Boolean)
state.items.add(item)   // reference unchanged -> no recomposition

// GOOD: immutable — replace via copy, recomposes reliably, stable/skippable
data class UiState(val items: List<Item>, val isLoading: Boolean)
_state.update { it.copy(items = it.items + item) }   // new object -> recomposes`,
      },
      {
        t: "list",
        items: [
          "**Recomposition needs a new reference** — Compose (and StateFlow) detect change by equality/reference. Mutating a `var` or a list in place doesn't produce a new state object, so nothing recomposes.",
          "**Stability for skipping** — a data class with `var` or a mutable collection is *unstable*, so composables taking it as a parameter can't be skipped, hurting performance.",
          "**Predictability** — immutable state is a snapshot; you can't have code accidentally mutating it from elsewhere. It's also what makes 'time-travel' and equality-based diffing possible.",
        ],
      },
      {
        t: "note",
        text: "Immutable UiState (val + immutable collections, replaced via copy) is required so recomposition triggers (new reference), the type is stable/skippable, and state is a predictable snapshot. Mutating in place = no recomposition + unstable + unpredictable.",
      },
    ],
  },
  {
    level: "senior",
    q: "Should UiState be a single data class or a sealed hierarchy?",
    a: [
      {
        t: "p",
        text: "Both are valid; the choice depends on whether your screen's states are *mutually exclusive* or can *overlap*. A sealed interface (`Loading`/`Content`/`Error`) makes states exclusive and forces exhaustive handling; a single data class with flags allows overlapping states (showing cached content *while* refreshing *with* an error banner).",
      },
      {
        t: "code",
        title: "Sealed vs data class",
        code: `// SEALED: mutually exclusive states, exhaustive when, impossible combos can't exist
sealed interface UiState {
    data object Loading : UiState
    data class Content(val items: List<Item>) : UiState
    data class Error(val msg: String) : UiState
}
// DATA CLASS: overlapping states possible (content + refreshing + error together)
data class UiState(
    val items: List<Item> = emptyList(),
    val isRefreshing: Boolean = false,
    val error: String? = null,
)`,
      },
      {
        t: "list",
        items: [
          "**Sealed** — best when states truly exclude each other; the compiler forces an exhaustive `when` and impossible combinations (loading *and* error) can't be represented. Great for simple load flows.",
          "**Data class** — best when states overlap: showing existing content while a refresh spins with a transient error. Sealed classes would force awkward state duplication here.",
          "**Hybrid** — a data class whose fields include sealed sub-states (e.g. `val loadState: LoadState`) — exclusive where it should be, overlapping where it should be.",
        ],
      },
      {
        t: "p",
        text: "The judgment: a pure load screen (nothing to show until loaded) suits sealed; a screen that keeps content visible during refresh (most real feeds) suits a data class. 'One UiState per screen' is a guideline, not a law — the right shape is whichever makes illegal states unrepresentable *without* forcing duplication for states that legitimately coexist.",
      },
      {
        t: "note",
        text: "Sealed UiState for mutually-exclusive states (exhaustive when, impossible combos can't exist); data class for overlapping states (content + refreshing + error together). Real feeds usually need the data class; pure load screens suit sealed. Hybrid is common.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does collectAsState turn a Flow into Compose State?",
    a: [
      {
        t: "p",
        text: "`collectAsState()` (and `collectAsStateWithLifecycle()`) bridge a `Flow`/`StateFlow` into Compose's world by *collecting* the flow inside the composition and mirroring each emission into a `State<T>` that composables can read. Under the hood it launches a coroutine (in the composition's scope) that collects the flow and updates a backing `mutableStateOf` on each emission — so a new emission recomposes the readers.",
      },
      {
        t: "code",
        title: "Flow -> State",
        code: `// StateFlow<UiState> in the ViewModel becomes State<UiState> the UI can read
val state: State<UiState> by viewModel.uiState.collectAsStateWithLifecycle()
// each emission from the flow -> updates the backing State -> recomposes readers`,
      },
      {
        t: "list",
        items: [
          "**It collects inside the composition** — launches a coroutine that collects the flow and writes each value into a `mutableStateOf`.",
          "**`collectAsState` vs `collectAsStateWithLifecycle`** — the lifecycle variant stops collecting when the app is backgrounded (`repeatOnLifecycle`), pairing with `stateIn(WhileSubscribed)`; plain `collectAsState` keeps collecting in the background. Prefer the lifecycle variant on Android.",
          "**Needs an initial value for a plain Flow** — `StateFlow` has one; a plain `Flow` requires you to pass an `initial`.",
        ],
      },
      {
        t: "note",
        text: "collectAsState launches a coroutine that collects the flow and mirrors emissions into a mutableStateOf, so new values recompose readers. Use collectAsStateWithLifecycle on Android (stops collecting when backgrounded, pairs with WhileSubscribed).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you reset or recreate state when an input changes?",
    a: [
      {
        t: "p",
        text: "You pass a *key* to `remember` — `remember(key) { ... }` recomputes (and thus resets) its value whenever the key changes. This solves the common bug where remembered state 'sticks' to the first value and doesn't update when the relevant input changes.",
      },
      {
        t: "code",
        title: "Keyed remember resets state on input change",
        code: `// BUG: keeps the FIRST item's expanded state even when 'item' changes
var expanded by remember { mutableStateOf(item.defaultExpanded) }

// FIX: keyed on item.id -> resets when a different item is passed
var expanded by remember(item.id) { mutableStateOf(item.defaultExpanded) }`,
      },
      {
        t: "list",
        items: [
          "**`remember(key)`** — re-runs the calculation when `key` changes, giving fresh state. Use when the remembered value *derives from* or *should reset with* an input.",
          "**Multiple keys** — `remember(a, b) { }` recomputes if either changes.",
          "**In lazy lists** — this is why item state needs care: reusing a composable for a different item must reset per-item state; `key()` and item keys handle identity so remembered state migrates correctly.",
        ],
      },
      {
        t: "note",
        text: "remember(key) { } recomputes when the key changes — the fix for 'remembered state sticks to the first value'. Key on the input the state should reset with (e.g. item.id). Without a key, remember keeps the first value regardless of input changes.",
      },
    ],
  },
  {
    level: "junior",
    q: "When does remembered state get forgotten?",
    a: [
      {
        t: "p",
        text: "Remembered state lives as long as its call site stays in the composition. It's forgotten — permanently discarded — when the composable *leaves the composition*: its `if` branch stops being emitted, it's removed from a lazy list far off-screen, or the whole composition is torn down (like a configuration change, since `remember` doesn't survive that). State lifetime equals presence in the tree.",
      },
      {
        t: "list",
        items: [
          "**Leaving a conditional branch** — `if (show) { val x = remember { ... } }` — when `show` becomes false, `x` is forgotten; when true again, it's re-initialized fresh.",
          "**Scrolled out of a lazy list** — items scrolled far away are disposed, forgetting their remembered state (unless hoisted or made saveable).",
          "**Composition teardown** — a configuration change rebuilds the whole composition, wiping all `remember`ed state (this is why `rememberSaveable` exists).",
          "**Moving position** — moving a composable between branches changes its slot-table position, so its remembered state is forgotten (use `key()` to preserve identity).",
        ],
      },
      {
        t: "note",
        text: "Remembered state is forgotten when the composable leaves the composition: a conditional branch closes, a lazy-list item scrolls far away, position changes, or the composition is torn down (config change). State lifetime = presence in the tree — use rememberSaveable/hoisting to outlive it.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you share state between two sibling composables?",
    a: [
      {
        t: "p",
        text: "You *hoist* the state to their nearest common ancestor and pass it down to both — the state lives in one place (the parent), and both children receive it as parameters plus callbacks to change it. Neither child owns the state; the parent does. This is state hoisting applied to sharing.",
      },
      {
        t: "code",
        title: "Hoist to the common ancestor",
        code: `@Composable fun Parent() {
    var selectedTab by remember { mutableStateOf(0) }   // shared state lives here
    Column {
        TabRow(selected = selectedTab, onSelect = { selectedTab = it })   // child A writes
        TabContent(tab = selectedTab)                                     // child B reads
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Hoist to the lowest common ancestor** — the state lives in the composable that's a parent of everyone who needs it, and no higher.",
          "**Pass down state + events** — readers get the value; writers get a callback. State flows down, events flow up (UDF).",
          "**For app-wide/screen-level sharing** — the ViewModel is the shared owner; both composables read its state and call its functions. For truly ambient values (theme, current user) across a deep tree, `CompositionLocal` is an option — but prefer explicit hoisting for normal data.",
        ],
      },
      {
        t: "note",
        text: "Hoist shared state to the siblings' lowest common ancestor; pass value down to readers and a callback to writers (UDF). For screen-wide sharing use the ViewModel; for ambient values across deep trees, CompositionLocal — but prefer explicit hoisting.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is SnapshotMutationPolicy and when would you change it?",
    a: [
      {
        t: "p",
        text: "A `SnapshotMutationPolicy` tells Compose *how to decide whether a state value actually changed* when you write it — which determines whether a write triggers recomposition. The default is `structuralEqualityPolicy()` (uses `equals()`), so setting a value `equals` to the current one is a no-op (no recomposition). You can change it for special cases.",
      },
      {
        t: "list",
        items: [
          "**`structuralEqualityPolicy()` (default)** — compares with `equals()`. Writing an equal value doesn't recompose. Right for most immutable data.",
          "**`referentialEqualityPolicy()`** — compares by reference (`===`). Even an `equals`-equal but different instance counts as a change. Useful when identity matters or `equals` is expensive/misleading.",
          "**`neverEqualPolicy()`** — *every* write is treated as a change, always recomposing. Useful when you need to force re-emission of a value that's `equals` to the previous (e.g. a mutable object you mutated in place and want to signal changed).",
        ],
      },
      {
        t: "code",
        title: "Choosing a policy",
        code: `// Force recomposition even when the new value equals the old:
var trigger by remember { mutableStateOf(Unit, neverEqualPolicy()) }
// Setting it re-triggers readers even though Unit == Unit`,
      },
      {
        t: "p",
        text: "You rarely change it — the default structural equality is correct for the immutable-data model Compose encourages. But knowing it exists explains subtle behavior (why setting an `equals`-equal value doesn't recompose) and gives an escape hatch: `neverEqualPolicy` when you genuinely must re-emit an equal value, or `referentialEqualityPolicy` when identity is what matters. Reaching for these is usually a sign the state should be modeled differently (an equal value you must re-emit is often really an *event*, not state).",
      },
      {
        t: "note",
        text: "SnapshotMutationPolicy decides if a write counts as a change: structural (default, equals — equal writes don't recompose), referential (===), or neverEqual (always recompose). Rarely changed; needing neverEqual usually means the thing is an event, not state.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the checklist of reasons 'my Compose UI doesn't update when state changes'?",
    a: [
      {
        t: "p",
        text: "'The state changed but the UI didn't update' is the most common Compose bug, and it almost always comes down to the state not being observable, not being remembered, or being mutated in place. Here's the diagnostic checklist.",
      },
      {
        t: "list",
        items: [
          "**Not a snapshot state type** — you used a plain `var` or a normal `Flow` without `collectAsState`. Only `mutableStateOf`/`State` (and collected flows) are observable. Fix: wrap in `mutableStateOf`.",
          "**Mutated in place** — you did `list.add(x)` on a `remember { mutableListOf() }`, or changed a `var` field of a data class. The reference didn't change, so no recomposition. Fix: `mutableStateListOf`, or replace with an immutable copy via `copy()`.",
          "**`mutableStateOf` without `remember`** — state resets to the initial value every recomposition, so it looks 'stuck'. Fix: `remember { mutableStateOf(...) }`.",
          "**Writing an `equals`-equal value** — structural equality means an equal value is a no-op. Fix: ensure the value genuinely differs, or reconsider (it may be an event).",
          "**Reading a different instance than you're writing** — two separate state objects, or reading `.value` of one and writing another. Fix: single source.",
          "**Collecting the wrong flow / not collecting** — a cold `stateIn(WhileSubscribed)` flow does nothing until collected; reading `.value` shows only the initial value. Fix: `collectAsStateWithLifecycle`.",
          "**Reading state outside a composition** — reading in a callback that captured an old value, not the State object. Fix: read the `State`/`rememberUpdatedState`.",
        ],
      },
      {
        t: "note",
        text: "'UI won't update' checklist: (1) not a snapshot state type, (2) mutated in place (reference unchanged), (3) mutableStateOf without remember (resets), (4) writing an equal value (structural equality no-op), (5) reading a different instance, (6) an uncollected cold flow. Almost always #1–3.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you model one-off events (navigate, show snackbar) versus state?",
    a: [
      {
        t: "p",
        text: "State and events are different: *state* is a value that persists and can be re-read (the current list, isLoading); an *event* is a one-off instruction that should fire exactly once (navigate to detail, show a snackbar, play a sound). Modeling an event as state causes bugs — on recomposition or config change the UI re-reads the 'navigate' state and navigates again.",
      },
      {
        t: "list",
        items: [
          "**Don't put events in UiState as a flag** — `data class UiState(val navigateToDetail: Boolean)` re-triggers after rotation because the flag is still true. If you use a flag, you must immediately reset it after consuming (error-prone).",
          "**Preferred: a `Channel` exposed as a `Flow`** — `Channel(Capacity.BUFFERED).receiveAsFlow()`; each event is delivered exactly once to a single collector. The UI collects it in a `LaunchedEffect`/`collectAsStateWithLifecycle`-driven block and acts.",
          "**Alternative: `SharedFlow`** with `replay = 0` — also fires once, but be careful about drops when there's no collector; a `Channel` is safer for guaranteed-once delivery.",
          "**The rule of thumb** — if re-reading the value after rotation should re-do the action, it's wrongly modeled. Navigation/snackbars are events, not state.",
        ],
      },
      {
        t: "code",
        title: "Events via a Channel",
        code: `// ViewModel
private val _events = Channel<UiEvent>(Channel.BUFFERED)
val events = _events.receiveAsFlow()
fun onSaved() { viewModelScope.launch { _events.send(UiEvent.NavigateBack) } }

// UI: collect once, act once
LaunchedEffect(Unit) {
    viewModel.events.collect { event -> when (event) { /* navigate, snackbar */ } }
}`,
      },
      {
        t: "note",
        text: "State persists and is re-read; events fire once. Modeling navigation/snackbar as a UiState flag re-fires after rotation. Deliver one-off events via a Channel.receiveAsFlow() (guaranteed-once) collected in a LaunchedEffect — not as state.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you debounce a search field with Compose state and Flow?",
    a: [
      {
        t: "p",
        text: "You keep the text as Compose state (updates instantly as the user types) but push the *query* into a Flow so you can apply `debounce` before hitting the network — avoiding a request per keystroke. The typical shape holds the query in a StateFlow in the ViewModel and transforms it with `debounce` + `distinctUntilChanged` + `flatMapLatest`.",
      },
      {
        t: "code",
        title: "Debounced search",
        code: `// ViewModel
private val query = MutableStateFlow("")
fun onQueryChange(q: String) { query.value = q }   // called from TextField.onValueChange

@OptIn(FlowPreview::class, ExperimentalCoroutinesApi::class)
val results = query
    .debounce(300)                 // wait for typing to pause
    .distinctUntilChanged()        // ignore no-op changes
    .flatMapLatest { q ->          // cancel the previous search when query changes
        if (q.isBlank()) flowOf(emptyList()) else repo.search(q)
    }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())`,
      },
      {
        t: "list",
        items: [
          "**Text is instant, search is debounced** — the TextField shows every keystroke (state), but the network query waits for a 300ms pause (Flow `debounce`).",
          "**`flatMapLatest`** — cancels the in-flight search when a newer query arrives, so stale results never overwrite fresh ones.",
          "**`distinctUntilChanged`** — skips redundant searches (e.g. same text after trimming).",
        ],
      },
      {
        t: "note",
        text: "Hold the text as instant Compose state, push the query into a StateFlow, then debounce(300) + distinctUntilChanged + flatMapLatest (cancels stale searches) + stateIn. Text updates every keystroke; the network fires only after a typing pause.",
      },
    ],
  },
  {
    level: "senior",
    q: "When should ViewModel state be exposed as mutableStateOf vs StateFlow?",
    a: [
      {
        t: "p",
        text: "Both work for driving Compose UI, and the choice is mostly about ecosystem fit. `StateFlow` is the mainstream choice because it's Compose-agnostic (testable without Compose, usable in KMP, composes with other flows via operators), while Compose `mutableStateOf` in a ViewModel is simpler and skips the `collectAsState` bridge but couples the ViewModel to the Compose runtime.",
      },
      {
        t: "table",
        headers: ["", "StateFlow", "mutableStateOf in ViewModel"],
        rows: [
          ["Compose dependency", "none (pure Kotlin)", "depends on Compose runtime"],
          ["KMP-friendly", "yes", "only with Compose Multiplatform"],
          ["Flow operators", "yes (combine, debounce…)", "no (not a flow)"],
          ["UI usage", "`collectAsStateWithLifecycle()`", "read directly (no collect)"],
          ["Lifecycle-aware collection", "yes (WhileSubscribed)", "always 'hot'"],
        ],
      },
      {
        t: "list",
        items: [
          "**Prefer `StateFlow`** for most apps — it's Compose-independent (easy unit tests, KMP shared ViewModels), composes with other flows, and `collectAsStateWithLifecycle()` + `WhileSubscribed` gives lifecycle-aware, backgrounding-safe collection.",
          "**`mutableStateOf` in the ViewModel** is fine for small Compose-only apps — no `collectAsState` boilerplate — but ties the ViewModel to Compose and can't be combined with flow operators.",
          "**Consistency matters** — pick one per codebase. Mixing both for the same screen's state is confusing.",
        ],
      },
      {
        t: "note",
        text: "StateFlow is the default: Compose-agnostic (testable, KMP), composable with flow operators, and collectAsStateWithLifecycle + WhileSubscribed is lifecycle-safe. mutableStateOf in the VM is simpler (no collect) but couples to Compose and can't use flow operators. Pick one per codebase.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why must you never do side effects directly in a composable body when computing state?",
    a: [
      {
        t: "p",
        text: "A composable body can run *any number of times* (every recomposition), on *any thread*, in *any order*, and can be *skipped* or *abandoned*. So writing to a variable, launching a coroutine, or mutating external state directly in the body runs unpredictably — maybe 0 times, maybe 60×/second. Side effects belong in the effect APIs (`LaunchedEffect`, `SideEffect`, `DisposableEffect`) that give controlled, lifecycle-aware execution.",
      },
      {
        t: "code",
        title: "Side effect in the body vs in an effect",
        code: `// BAD: runs on every recomposition, unpredictably
@Composable fun Screen(id: String) {
    viewModel.load(id)          // fires again on every recomposition!
    var x = mutableStateOf(0)   // and not remembered -> resets every time
}

// GOOD: effect runs once per key change, lifecycle-aware
@Composable fun Screen(id: String) {
    LaunchedEffect(id) { viewModel.load(id) }   // runs when id changes, cancels on leave
    var x by remember { mutableStateOf(0) }     // survives recomposition
}`,
      },
      {
        t: "list",
        items: [
          "**Composables are restartable and skippable** — the body isn't a one-time init; treating it like `onCreate` causes repeated/duplicate work.",
          "**Use the right effect** — `LaunchedEffect` for coroutine work keyed to inputs, `DisposableEffect` for setup/teardown (listeners), `SideEffect` for publishing state to non-Compose code each successful composition.",
          "**State must be `remember`ed** — declaring `mutableStateOf` in the body without `remember` resets it every recomposition (a side-effect-like bug).",
        ],
      },
      {
        t: "note",
        text: "Composable bodies run any number of times, any thread, any order, and can be skipped — so side effects there run unpredictably (0 to 60×/sec). Put them in LaunchedEffect/DisposableEffect/SideEffect (controlled, lifecycle-aware) and always remember your state.",
      },
    ],
  },
];

export default qa;
