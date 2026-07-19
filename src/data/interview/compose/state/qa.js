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
];

export default qa;
