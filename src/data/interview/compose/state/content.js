// Compose State — Content tab. Teaching-first: basics → snapshot internals.

const content = [
  {
    heading: "State in Compose — the starting point",
    blocks: [
      {
        t: "p",
        text: "In Compose, **state is any value that can change over time and that the UI should reflect**. Because Compose re-executes functions instead of mutating widgets, state must satisfy two needs at once: it must **survive re-execution** (a local `var` would reset every recomposition) and it must be **observable** (Compose must know when it changed so it can recompose). Two APIs split these jobs:",
      },
      {
        t: "list",
        items: [
          "**`mutableStateOf(value)`** creates a `MutableState<T>` — an observable holder. Reading `.value` inside a composable silently subscribes that recomposition scope; writing `.value` triggers recomposition of subscribed scopes. This is the *observability* half.",
          "**`remember { ... }`** stores a value in the composition (the slot table) so it survives recomposition — without it, `mutableStateOf` would create a *fresh* state object on every re-run and your UI would reset each frame. This is the *survival* half.",
          "So the canonical local state line combines both: `var count by remember { mutableStateOf(0) }`.",
        ],
      },
      {
        t: "code",
        title: "Why both halves are needed",
        code: `@Composable
fun Counter() {
    // WRONG: no remember -> new state object every recomposition,
    // count visually stuck at 0 forever
    // var count by mutableStateOf(0)

    // WRONG: remember but not state -> survives recomposition,
    // but writing it notifies nobody; UI never updates
    // var count = remember { 0 }

    // RIGHT: survives + observable
    var count by remember { mutableStateOf(0) }

    Button(onClick = { count++ }) { Text("Clicked " + count) }
}`,
      },
      {
        t: "list",
        items: [
          "The `by` keyword is Kotlin **property delegation** — `by remember { mutableStateOf(0) }` unwraps `.value` reads/writes so `count` acts like a plain `Int`. Without `by`, you'd write `count.value` everywhere. Same object, nicer syntax.",
          "`remember` keys: `remember(key1) { ... }` recalculates when the key changes — used for derived objects that must rebuild when an input changes.",
          "`remember` is scoped to the **call site's position**: if the composable leaves the composition (its `if` branch stops being emitted), the remembered value is *forgotten*. State lifetime = presence in the tree.",
        ],
      },
    ],
  },
  {
    heading: "rememberSaveable — surviving configuration change and process death",
    blocks: [
      {
        t: "p",
        text: "`remember` lives in the composition, and the composition lives inside the Activity — so **rotation destroys everything `remember`ed**. `rememberSaveable` fixes that: it additionally saves the value into the Activity's saved-instance-state `Bundle`, restoring it after configuration changes *and* system-initiated process death.",
      },
      {
        t: "code",
        title: "rememberSaveable, with a custom Saver for non-Bundle types",
        code: `// primitives / Parcelable / Serializable: works out of the box
var query by rememberSaveable { mutableStateOf("") }

// custom types need a Saver — teach Compose how to (de)serialize:
data class Filter(val tag: String, val enabled: Boolean)

val FilterSaver = listSaver<Filter, Any>(
    save = { listOf(it.tag, it.enabled) },
    restore = { Filter(it[0] as String, it[1] as Boolean) }
)

var filter by rememberSaveable(stateSaver = FilterSaver) {
    mutableStateOf(Filter("all", true))
}`,
      },
      {
        t: "list",
        items: [
          "**Decision rule**: `remember` for transient visual state (animation scratch values, expanded flags you're fine losing); `rememberSaveable` for anything a user would be annoyed to lose on rotation (text input, selected tab, scroll — though scroll has its own `rememberLazyListState`, which is already saveable internally).",
          "It uses the same `Bundle` machinery as `onSaveInstanceState` — so the same limits apply: small, Bundle-compatible data only. Screen *data* still belongs in the ViewModel/SavedStateHandle; `rememberSaveable` is for **UI-element state**.",
          "Division of labor interviewers probe: **ViewModel** = screen state, survives config change in memory, needs SavedStateHandle for process death; **rememberSaveable** = widget-level state, survives both, but only Bundle-sized. They complement, not compete.",
        ],
      },
    ],
  },
  {
    heading: "State hoisting — stateless vs stateful composables",
    blocks: [
      {
        t: "p",
        text: "**State hoisting** means moving state *up* out of a composable and passing it back down as parameters: instead of a composable owning `var text`, it receives `value: String` and `onValueChange: (String) -> Unit`. The composable becomes **stateless** — a pure function of its inputs — and the caller decides where the state actually lives.",
      },
      {
        t: "code",
        title: "The hoisting pattern (this is exactly how TextField works)",
        code: `// STATEFUL: owns its state — convenient, but the parent can't
// read, control, or validate the text
@Composable
fun SearchBoxStateful() {
    var query by remember { mutableStateOf("") }
    TextField(value = query, onValueChange = { query = it })
}

// STATELESS (hoisted): state up, events up, value down
@Composable
fun SearchBox(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    TextField(value = query, onValueChange = onQueryChange, modifier = modifier)
}

// Caller owns the state and can now share/validate/persist it:
@Composable
fun SearchScreen(viewModel: SearchViewModel) {
    val query by viewModel.query.collectAsStateWithLifecycle()
    SearchBox(query = query, onQueryChange = viewModel::onQueryChange)
}`,
      },
      {
        t: "list",
        items: [
          "**Why hoist**: single source of truth (no duplicated text living both in the widget and the ViewModel), reusability (a stateless composable works in any context), testability and previews (pass any state directly), and it's what makes UDF work end-to-end — state flows down, events flow up.",
          "**How high to hoist**: to the **lowest common ancestor** of everyone who reads or writes it — no higher. UI-only state nobody else cares about (is this dropdown open?) can stay internal; state the screen logic needs goes to the ViewModel.",
          "Compose's own components are all built hoisted (`TextField`, `Checkbox`, `Slider` — all take value + onChange). When you see `value`/`onValueChange` pairs, that's hoisting as an API convention.",
          "**Plain state holder classes**: when a composable has several intertwined pieces of UI state + logic (e.g. scroll position + animation), bundle them in a `remember`ed class (`rememberScrollState()`, `rememberLazyListState()` are exactly this pattern) — a middle tier between loose `remember`s and the ViewModel.",
        ],
      },
    ],
  },
  {
    heading: "derivedStateOf — computed state without extra recomposition",
    blocks: [
      {
        t: "p",
        text: "**The problem**: you have state that changes constantly (scroll position, every keystroke) but the UI only cares about a *derived* fact that changes rarely (\"is the user past item 3?\", \"is the input valid?\"). If you compute the fact inline, the scope recomposes on **every** underlying change even when the fact's answer is identical.",
      },
      {
        t: "code",
        title: "derivedStateOf: recompose only when the ANSWER changes",
        code: `val listState = rememberLazyListState()

// BAD: firstVisibleItemIndex changes every scroll frame ->
// this scope recomposes continuously while scrolling
val showButtonBad = listState.firstVisibleItemIndex > 3

// GOOD: derivedStateOf re-evaluates on every scroll, but only
// INVALIDATES readers when the Boolean result actually flips
val showButton by remember {
    derivedStateOf { listState.firstVisibleItemIndex > 3 }
}

AnimatedVisibility(visible = showButton) { ScrollToTopButton() }`,
      },
      {
        t: "list",
        items: [
          "Mechanics: `derivedStateOf` creates a state node that observes whatever snapshot state its lambda reads. The lambda re-runs on each underlying change, but downstream scopes are invalidated **only when the computed result differs** (by equality) from last time — it's a change-frequency filter.",
          "**When to use**: input changes far more often than the output — scroll thresholds, validation flags, filtered snapshots of fast-changing sources. **When NOT to**: output changes as often as input (plain `remember(key)` is cheaper — derivedStateOf adds tracking overhead), or the inputs aren't snapshot state at all (it can't observe plain parameters — a classic misuse: `derivedStateOf` over a function parameter observes nothing).",
          "Wrap it in `remember { }` — forgetting that recreates the derived node each recomposition, silently defeating it (and it's the most common derivedStateOf bug in review).",
        ],
      },
    ],
  },
  {
    heading: "Collecting external state: ViewModels, Flows, and collectAsStateWithLifecycle",
    blocks: [
      {
        t: "p",
        text: "Screen-level state usually lives in a ViewModel as `StateFlow`. Compose bridges reactive streams into snapshot state with collect-as-state adapters — each emission writes a `State<T>` that composables read like any other state:",
      },
      {
        t: "code",
        title: "The standard screen wiring",
        code: `@Composable
fun ProfileScreen(viewModel: ProfileViewModel = hiltViewModel()) {
    // Lifecycle-aware: collection stops at ON_STOP, restarts at ON_START
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    ProfileContent(
        state = state,
        onRefresh = viewModel::refresh,
    )
}

@Composable // stateless, previewable, reusable
fun ProfileContent(state: ProfileUiState, onRefresh: () -> Unit) { /* ... */ }`,
      },
      {
        t: "list",
        items: [
          "**`collectAsStateWithLifecycle` vs `collectAsState`**: the lifecycle variant cancels collection when the app is backgrounded (via `repeatOnLifecycle(STARTED)`), pairing with `stateIn(WhileSubscribed(5000))` to stop upstream work too. Plain `collectAsState` keeps collecting in the background — use it only where lifecycle doesn't apply (previews, desktop).",
          "Pattern: **route composable** (gets the ViewModel, collects state) + **content composable** (stateless, takes state + lambdas). Previews and tests target the content one.",
          "You can also keep Compose state *in* the ViewModel (`var uiState by mutableStateOf(...)` with a private setter) — valid, Compose-runtime-dependent; `StateFlow` keeps the ViewModel toolkit-agnostic (and KMP/iOS-friendly). Know both, prefer StateFlow when sharing matters.",
        ],
      },
    ],
  },
  {
    heading: "Under the hood: the snapshot system",
    blocks: [
      {
        t: "p",
        text: "How does reading `.value` *subscribe* a scope, and how are concurrent changes safe? The answer is Compose's **snapshot state system** — an MVCC (multi-version concurrency control) design, the same family of technique databases use:",
      },
      {
        t: "list",
        items: [
          "Every snapshot-state object keeps a **linked list of value records**, each tagged with the snapshot id that wrote it. A **snapshot** is a consistent view of all state at a point in time — reading inside snapshot N sees the newest record valid for N, regardless of later writes elsewhere.",
          "**Read tracking**: snapshots can carry read observers. During composition, Compose opens a snapshot whose observer records every state object read, per recomposition scope — that recording *is* the subscription. No listeners, no annotations: reading is subscribing.",
          "**Write tracking & application**: writes inside a mutable snapshot create new records invisible to others until the snapshot is **applied** (atomically, like a commit). On apply, registered apply-observers receive the changed objects — the Recomposer intersects them with recorded reads and invalidates exactly the affected scopes.",
          "**Why MVCC**: recomposition can run concurrently with new writes (even from other threads) without tearing — each computation sees an isolated, consistent world; conflicting parallel snapshots detect collision at apply time. This is also what makes `mutableStateOf` safe to write from any thread.",
          "`snapshotFlow { }` bridges the reverse direction: it observes snapshot reads inside its lambda and emits into a cold Flow whenever they change — snapshot state → Flow, the mirror of `collectAsState`.",
        ],
      },
      {
        t: "note",
        text: "You rarely *say* 'MVCC' in an interview unprompted — but when asked \"how does Compose know what to recompose?\", the precise answer is: \"state reads are recorded per scope by snapshot read-observers during composition; state writes notify apply-observers with the changed objects; the Recomposer intersects the two sets and invalidates only scopes that read what changed.\" That one sentence is the whole system.",
      },
    ],
  },
  {
    heading: "State pitfalls checklist (the bugs interviewers describe and ask you to diagnose)",
    blocks: [
      {
        t: "list",
        items: [
          "**`mutableStateOf` without `remember`** → state resets every recomposition; UI stuck at initial value. (Compiler lint usually flags it.)",
          "**`remember` without `mutableStateOf`** → value survives but changes are invisible; UI never updates.",
          "**Mutating a remembered mutable object** (`remember { mutableListOf() }`, then `list.add(x)`) → no recomposition: the *reference* never changed and the list isn't observable. Fix: `mutableStateListOf()` / `mutableStateMapOf()` (element-level observable) or immutable copies in a `MutableState`.",
          "**Expecting recomposition from plain `var`s or normal Flows** — only snapshot state and collect-as-state adapters are observable.",
          "**State captured in stale lambdas**: a long-lived lambda (callback registered once) capturing a state *value* sees the old value forever — capture the `State` object or use `rememberUpdatedState` (Side Effects topic).",
          "**Remembered state keyed to nothing when it should follow an input**: `remember { mutableStateOf(item.isFavorite) }` keeps the *first* item's flag when `item` changes — needs `remember(item.id)`.",
          "**Losing state on conditional structure**: moving a composable between `if` branches changes its slot-table position → remembered state is forgotten; use `key()` or restructure so identity is stable.",
          "**Backwards writes** — writing state that the *same* composition pass already read (e.g. writing in the body based on a read above) → infinite recomposition loop; Compose logs a warning. Writes belong in event handlers/effects.",
        ],
      },
    ],
  },
];

export default content;
