// MVI — Content tab.

const content = [
  {
    heading: "What is MVI",
    blocks: [
      {
        t: "p",
        text: "**MVI (Model–View–Intent)** is a reactive, unidirectional architecture inspired by Cycle.js and Redux, brought to Android by Hannes Dorfmann (~2016). Despite the name, it's less about three components and more about a **cycle**: the View emits **Intents** (user intentions, not Android `Intent`s), a processing loop reduces them into a new immutable **Model** (state), and the View **renders** that state. One loop, one direction, no side doors.",
      },
      {
        t: "list",
        items: [
          "**Intent** — a reified user action or trigger: `data class QueryChanged(val q: String)`, `object Refresh`, `object RetryClicked`. Everything that can happen is a value.",
          "**Model (State)** — a single immutable object describing the *entire* screen at a moment. Not the domain model — the rendered state.",
          "**View** — `render(state)`: a pure mapping from state to UI, plus a stream of intents. In Compose this is literally the composable signature.",
          "**Reducer** — pure function `(currentState, change) -> newState`. The only place state is produced.",
          "**Side effects** — async work (network, DB) triggered by intents, whose *results* are fed back into the reducer as changes.",
        ],
      },
      {
        t: "note",
        text: "One-line definition for interviews: \"MVI is MVVM with the screws tightened: exactly one immutable state, all inputs reified as intent objects through a single entry point, and all state transitions through a pure reducer — giving you an auditable, replayable state machine per screen.\"",
      },
    ],
  },
  {
    heading: "The cycle in code — a hand-rolled MVI ViewModel",
    blocks: [
      {
        t: "p",
        text: "MVI on Android is usually *hosted inside* a Jetpack ViewModel (for lifecycle survival) — the patterns are complementary, not competing:",
      },
      {
        t: "code",
        title: "Contract: state, intents, one-shot effects",
        code: `data class SearchState(
    val query: String = "",
    val results: List<Item> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
)

sealed interface SearchIntent {
    data class QueryChanged(val query: String) : SearchIntent
    data object Retry : SearchIntent
    data class ItemClicked(val id: String) : SearchIntent
}

sealed interface SearchEffect {
    data class NavigateToDetail(val id: String) : SearchEffect
    data class ShowSnackbar(val message: String) : SearchEffect
}`,
      },
      {
        t: "code",
        title: "The loop: single entry point, reducer, effects",
        code: `class SearchViewModel(
    private val repository: SearchRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(SearchState())
    val state: StateFlow<SearchState> = _state.asStateFlow()

    private val _effects = Channel<SearchEffect>(Channel.BUFFERED)
    val effects: Flow<SearchEffect> = _effects.receiveAsFlow()

    private var searchJob: Job? = null

    // Single entry point — every user action funnels through here
    fun onIntent(intent: SearchIntent) {
        when (intent) {
            is SearchIntent.QueryChanged -> {
                reduce { it.copy(query = intent.query, isLoading = true) }
                search(intent.query)
            }
            is SearchIntent.Retry -> search(state.value.query)
            is SearchIntent.ItemClicked ->
                viewModelScope.launch {
                    _effects.send(SearchEffect.NavigateToDetail(intent.id))
                }
        }
    }

    private fun search(query: String) {
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            runCatching { repository.search(query) }
                .onSuccess { items ->
                    reduce { it.copy(isLoading = false, results = items, error = null) }
                }
                .onFailure { e ->
                    reduce { it.copy(isLoading = false, error = e.message) }
                }
        }
    }

    // All mutations go through one reducer helper — greppable, loggable
    private fun reduce(reducer: (SearchState) -> SearchState) {
        _state.update(reducer)
    }
}`,
      },
      {
        t: "code",
        title: "View — render + intent stream (Compose)",
        code: `@Composable
fun SearchScreen(viewModel: SearchViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        viewModel.effects.collect { effect ->
            when (effect) {
                is SearchEffect.NavigateToDetail -> { /* nav */ }
                is SearchEffect.ShowSnackbar -> { /* snackbar */ }
            }
        }
    }

    SearchContent(
        state = state,
        onIntent = viewModel::onIntent, // one lambda, not N callbacks
    )
}`,
      },
      {
        t: "list",
        items: [
          "The **single `onIntent` entry point** is what enables MVI's superpowers: log every intent and every state and you have a complete, replayable history of the screen.",
          "The reducer here is the `copy` lambdas — strict MVI extracts them into a standalone pure function `reduce(state, change): State` that's trivially unit-tested with no coroutines at all.",
          "Note it still uses `StateFlow` + `viewModelScope` — MVI on Android is a *discipline layered on* the MVVM toolkit.",
        ],
      },
    ],
  },
  {
    heading: "State machine thinking & modeling rules",
    blocks: [
      {
        t: "list",
        items: [
          "**Make illegal states unrepresentable**: if loading and error can't coexist, encode that (sealed sub-states) rather than trusting flag discipline.",
          "**State is render-ready**: formatted strings, sorted lists, resolved flags — the View must not compute.",
          "**Reducers are pure and synchronous**: no IO, no clocks, no randomness inside — those enter as *inputs* (changes/results). Purity is what makes them exhaustively testable.",
          "**Long-running work is cancelled by newer intents** where it matters (`searchJob?.cancel()` / `flatMapLatest`) — the reducer alone doesn't protect you from stale-result races; effect management does.",
          "**Time-travel & debugging**: because every transition is (state, change) → state, you can log the full sequence, reproduce bugs by replaying intents, and snapshot state in bug reports — the operational argument for MVI in large teams.",
        ],
      },
      {
        t: "note",
        text: "Classic probing question: \"where do side effects go if reducers must be pure?\" Answer: an effect-handling layer *around* the reducer (the intent handler / middleware / `intent { }` block in Orbit, Executors in MVIKotlin) performs IO and feeds results back in as plain data. Redux calls the same slot middleware/thunks.",
      },
    ],
  },
  {
    heading: "One-shot effects in MVI",
    blocks: [
      {
        t: "p",
        text: "Purist MVI says *everything* is state — but navigation and snackbars fit awkwardly (the sticky-state problem, same as MVVM). In practice every MVI codebase picks one of:",
      },
      {
        t: "list",
        items: [
          "**A separate effect stream** (Channel/SharedFlow) beside the state — pragmatic standard, used by Orbit (`postSideEffect`) and MVIKotlin (Labels). Keeps state clean; inherits the usual event-delivery caveats.",
          "**Effects-as-state with consumption** — `pendingNavigation: Destination?` cleared by a `NavigationConsumed` intent; purist, replay-safe, more ceremony.",
          "**One-off state flags with IDs** — event objects carrying unique ids so re-renders can dedupe; seen in Redux-family ports.",
        ],
      },
    ],
  },
  {
    heading: "The MVI library landscape",
    blocks: [
      {
        t: "table",
        headers: ["Library", "Shape", "Notes"],
        rows: [
          ["**Orbit MVI**", "DSL inside a ViewModel: `intent { reduce { } postSideEffect() }`", "Gentlest adoption path — 'MVVM+' feel, KMP support, minimal boilerplate"],
          ["**MVIKotlin** (Arkadii Ivanov)", "Store/Executor/Reducer, framework-agnostic", "Strictest separation; pairs with **Decompose** for KMP navigation/lifecycle; popular in serious KMP apps"],
          ["**Mavericks** (Airbnb)", "ViewModel + `Async<T>` state wrappers + `setState/withState`", "Battle-tested at scale in the RecyclerView/Epoxy era; less momentum in pure-Compose codebases"],
          ["**Molecule** (Cash App)", "Compose runtime to *produce* StateFlow from composable logic", "Not an MVI framework per se — a way to write the state-production loop declaratively"],
          ["**Circuit** (Slack)", "Compose-driven Presenter+UI pairs, state classes with embedded event sinks", "A modern rethink: UDF architecture built entirely on Compose, KMP-ready"],
          ["Hand-rolled", "StateFlow + sealed intents + reduce helper", "Perfectly viable; most 'MVI' production code is exactly this"],
        ],
      },
    ],
  },
  {
    heading: "MVI vs MVVM — honest trade-offs",
    blocks: [
      {
        t: "table",
        headers: ["", "MVVM (typical)", "MVI (strict)"],
        rows: [
          ["State", "one or several observable streams", "exactly one immutable state object"],
          ["User input", "N public functions on the VM", "one entry point taking sealed intents"],
          ["Mutation", "anywhere inside the VM via update{}", "only the reducer"],
          ["Auditability", "log manually per mutation", "free: intent log + state log = full history"],
          ["Boilerplate", "lower", "higher (intent classes, changes, wiring)"],
          ["Learning curve", "low", "moderate; reducer/effect discipline must be taught"],
          ["Risk profile", "logic scattering as VM grows", "ceremony on trivial screens; giant state objects recomposing everything"],
        ],
      },
      {
        t: "list",
        items: [
          "**Choose MVI** when screens are genuinely stateful machines (editors, players, checkout flows), when the team is large enough that convention-by-discipline fails, or in KMP where MVIKotlin+Decompose is a mature stack.",
          "**Stay MVVM** for CRUD-ish screens and small teams — modern MVVM with a single `UiState` + `update {}` already delivers ~80% of MVI's value at ~50% of the ceremony.",
          "**Performance edge case**: a single giant state object means every change recomposes/diffs everything observing it — mitigate by splitting screen state into cohesive sub-objects, using `derivedStateOf`/field-level selectors, and keeping lists stable (immutable collections, stable keys).",
        ],
      },
      {
        t: "note",
        text: "The mature closing take: MVVM and MVI have converged. Google's guidance (single UiState, UDF, events-as-state) is MVI in all but name; the remaining difference is whether intents are reified and reduction is centralized — a *team-scaling* decision, not a correctness one.",
      },
    ],
  },
  {
    heading: "MVI in KMP",
    blocks: [
      {
        t: "list",
        items: [
          "MVI is arguably **more popular in KMP than on pure Android**: a framework-free state machine in `commonMain` is the perfect shared brain, with each platform just rendering state and sending intents.",
          "**MVIKotlin + Decompose** is the flagship stack: Decompose provides lifecycle-aware, navigable 'components' (BLoC-style) shared across Android/iOS/desktop/web; MVIKotlin provides the Store loop inside them.",
          "**Orbit** works in KMP too, hosted in the multiplatform androidx ViewModel.",
          "iOS consumption is the same story as MVVM: bridge the state `StateFlow`/`Value` to SwiftUI via SKIE/adapters; intents are plain function calls into shared code, which Swift handles natively.",
          "Sealed intent/state hierarchies crossing to Swift benefit hugely from **SKIE** (exhaustive Swift enums instead of class-check chains).",
        ],
      },
    ],
  },
];

export default content;
