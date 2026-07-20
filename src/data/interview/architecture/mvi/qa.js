// MVI — Interview Prep tab.

const qa = [
  {
    level: "junior",
    q: "What is MVI and how is the data flow different from MVVM?",
    a: [
      {
        t: "p",
        text: "MVI (Model–View–Intent) is a unidirectional cycle: the View emits **Intents** (reified user actions like `Refresh` or `QueryChanged`), a loop processes them and a pure **reducer** produces a new immutable **State**, and the View renders that state. Versus MVVM: instead of N public ViewModel functions there's **one entry point** taking sealed intent objects; instead of possibly several streams there's **exactly one state object**; and state may only change **through the reducer**. Same observation mechanics (StateFlow), stricter rules on top.",
      },
    ],
  },
  {
    level: "junior",
    q: "Is an MVI 'Intent' the same as an Android Intent?",
    a: [
      {
        t: "p",
        text: "No — unfortunate name collision. An MVI intent is a plain value expressing a *user's intention*: `data class ItemClicked(val id: String)`, `object Retry` — usually a sealed interface per screen. Android's `Intent` is the OS-level messaging object for launching activities/services. Zero relation; interviewers ask exactly to check you know the difference.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a reducer and why must it be pure?",
    a: [
      {
        t: "p",
        text: "A reducer is a function `(currentState, change) -> newState` — the only place a new state is produced. Pure means: no IO, no time, no randomness, no mutation — output depends only on inputs. Why it matters: pure reducers are **exhaustively unit-testable** (plain function calls, no coroutines or mocks), **deterministic** (same intent log always replays to the same state — the basis of time-travel debugging), and **safe to reason about** (all transition logic is in one greppable place). Async work happens *around* the reducer and feeds results back in as data.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does 'single source of truth' mean in MVI?",
    a: [
      {
        t: "p",
        text: "The screen has exactly **one state object**, and everything the UI shows derives from it. There's no second place where the checkbox's value or the list's loading flag lives — no view-held state drifting out of sync, no 'the widget says X but the model says Y' bugs. Practical consequences: `render(state)` can redraw the whole screen from scratch at any time (which is literally what Compose does), state can be snapshotted for bug reports, and restoring the screen equals restoring one object.",
      },
    ],
  },
  {
    level: "junior",
    q: "Does MVI replace the Jetpack ViewModel?",
    a: [
      {
        t: "p",
        text: "No — they're complementary. On Android, the MVI loop (state, intents, reducer) almost always lives **inside** a Jetpack ViewModel, which contributes what MVI itself doesn't address: surviving configuration changes, `viewModelScope`, and `SavedStateHandle`. MVI is a *discipline about how state changes*; ViewModel is *infrastructure about where state lives*. (In KMP, alternatives like Decompose components can play the infrastructure role instead.)",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the practical benefits of funneling everything through one onIntent() entry point?",
    a: [
      {
        t: "list",
        items: [
          "**Complete audit log**: log one function and you've captured every user action — attach the intent+state history to crash reports and bugs become replayable.",
          "**One lambda down the Compose tree** (`onIntent = vm::onIntent`) instead of a growing bundle of callbacks.",
          "**Cross-cutting policies in one place**: throttling double-clicks, analytics, permission gates — wrap the funnel once.",
          "**Exhaustiveness**: a sealed intent + `when` forces handling every action; adding an intent without handling it fails compilation.",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "How does the View send user actions in MVI, and what does render(state) mean?",
    a: [
      {
        t: "p",
        text: "The View converts raw UI events into intent objects and passes them to the single entry point — `onClick = { onIntent(SearchIntent.Retry) }`. `render(state)` is the other half of the contract: a function that maps the state object to the screen with **no decisions of its own** — every `if` in render should be reading a state field, not computing policy. In Compose, the composable *is* `render`: it takes `state` and `onIntent` as parameters, which also makes it trivially previewable with fake states.",
      },
    ],
  },
  {
    level: "senior",
    q: "If reducers must be pure, walk me through exactly how a network call flows through an MVI loop.",
    a: [
      {
        t: "list",
        items: [
          "1. View emits `Intent.Refresh` → entry point.",
          "2. The **effect/executor layer** (Orbit's `intent {}` block, MVIKotlin's Executor, hand-rolled handler) — *not* the reducer — receives it, immediately dispatches a synchronous change `Change.Loading` through the reducer (state now shows loading), and launches the coroutine.",
          "3. The network call runs in the effect layer; its outcome is converted into plain data: `Change.Loaded(items)` or `Change.Failed(error)`.",
          "4. That change is dispatched through the reducer → new state → View re-renders. The reducer only ever saw values.",
        ],
      },
      {
        t: "p",
        text: "Follow-ups to preempt: cancellation lives in the effect layer (`flatMapLatest` / job tracking per intent type — a new Refresh cancels the old one); stale-result races are prevented there too, or defensively in the reducer by ignoring results that don't match current input; and this layered shape is exactly Redux middleware / Elm commands — naming that shows you see the family resemblance.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test an MVI screen? What becomes easier and what becomes harder than MVVM?",
    a: [
      {
        t: "list",
        items: [
          "**Reducer tests** — the payoff: pure function, table-driven tests over (state, change) pairs, no coroutines/mocks/dispatchers. Edge transitions (error while loading, retry after error) become one-line cases.",
          "**Loop/integration tests** — same machinery as MVVM: TestDispatcher + Turbine, send intents, assert the emitted state sequence; assert effects on the effect stream separately.",
          "**Libraries ship test DSLs**: Orbit's test module asserts posted states/side effects; MVIKotlin stores are testable without any framework.",
        ],
      },
      {
        t: "p",
        text: "Easier: transition logic coverage, exhaustiveness (sealed classes force handling), reproducing bugs by replaying an intent sequence. Harder/more verbose: simple flows now need intent + change + reducer wiring for what MVVM did in one function; and asynchronous effect-ordering tests (two competing intents cancelling each other) remain exactly as tricky as in MVVM — MVI doesn't magically solve concurrency, it just localizes it.",
      },
    ],
  },
  {
    level: "senior",
    q: "A single giant state object recomposes the whole screen on every keystroke. How do you fix MVI's performance problem?",
    a: [
      {
        t: "list",
        items: [
          "**Split the screen state into cohesive sub-objects** (`SearchBarState`, `ResultsState`) and pass only the slice each composable needs — Compose skips recomposition when an unchanged stable slice is passed.",
          "**Keep the state stable in Compose's sense**: immutable collections (kotlinx.collections.immutable or `@Immutable` wrappers), no `List` that Compose must treat as unstable, stable data classes — otherwise skipping never happens regardless of splitting.",
          "**Selectors / field-level flows**: expose `state.map { it.subState }.distinctUntilChanged()` (or `derivedStateOf` in the UI) so consumers observe only their slice.",
          "**Don't put high-frequency transient values through the full loop**: text-field composition state or drag positions can stay local UI state, entering the loop debounced/committed — running an entire reduce cycle per keystroke is the actual smell.",
          "**Measure first**: Layout Inspector recomposition counts / composition tracing — most 'MVI is slow' reports are unstable-collection bugs, not the architecture.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "Compare Orbit, MVIKotlin, and hand-rolled MVI — when would you pick each?",
    a: [
      {
        t: "list",
        items: [
          "**Hand-rolled** (StateFlow + sealed intents + reduce helper): zero dependency, team learns the mechanics, fully sufficient for a handful of screens. Risk: N developers → N dialects; no test DSL; discipline decays without review pressure.",
          "**Orbit**: thin DSL over exactly that (`intent { reduce { } postSideEffect() }`) hosted in a ViewModel — lowest-friction formalization, KMP-ready, good test support. Pick when you want MVVM-adjacent ergonomics with enforced structure.",
          "**MVIKotlin**: full Store/Executor/Reducer separation, framework-independent, with time-travel tooling; pairs with Decompose for lifecycle/navigation. Pick for serious KMP (shared brain across Android/iOS/desktop) or when you want the strictest, most testable separation and accept the ceremony.",
        ],
      },
      {
        t: "p",
        text: "Also worth naming: **Mavericks** (mature, Epoxy-era, less Compose-native momentum) and **Circuit** (Slack's Compose-first rethink). Decision axis in one line: how much enforced structure does the team's size and platform spread justify?",
      },
    ],
  },
  {
    level: "senior",
    q: "How does MVI handle process death? Does the intent log help?",
    a: [
      {
        t: "p",
        text: "The intent log is an in-memory debugging artifact — it dies with the process, and replaying a persisted log on restore is impractical (effects would re-fire network calls; the world has changed). Real answer: same discipline as MVVM, but MVI's single state object makes it cleaner to execute. Persist the **minimal seed** — ids, user input, scroll anchors — into `SavedStateHandle` (some teams make the state class itself contain a small `@Parcelize` 'persistable core'), and rebuild the rest by re-running the normal load path on restore. The reducer helps here: restoration is just an ordinary `Change.Restored(seed)` flowing through the same loop, not a special code path. What you must *not* do is parcel the whole state (TransactionTooLarge risk with lists) or treat replay-from-log as a persistence strategy.",
      },
    ],
  },
  {
    level: "senior",
    q: "Steelman the case AGAINST adopting MVI on a team currently happy with MVVM.",
    a: [
      {
        t: "list",
        items: [
          "**The delta has shrunk**: MVVM done to Google's current guidance (single UiState, update{}, UDF, events-as-state) already yields most of MVI's benefits — the migration buys reified intents and a centralized reducer, which mainly pay off at large team scale.",
          "**Ceremony tax on simple screens**: a settings toggle becomes intent class + change + reducer branch + wiring; developers respond by smuggling shortcuts, and inconsistent-MVI is worse than consistent-MVVM.",
          "**Migration cost is real**: retraining, rewriting stable screens, a long bilingual period, and test-suite conversion — spent on screens that weren't causing bugs.",
          "**It doesn't solve the hard problems**: one-shot events, process death, and async races persist in MVI (just relocated); anyone selling MVI as the fix for those is overpromising.",
          "**Framework lock-in risk** if a library (with its DSL and test tooling) is adopted, versus discipline that's harder to enforce if hand-rolled — you pay one of those two costs.",
        ],
      },
      {
        t: "p",
        text: "Then the balanced close: I'd still reach for MVI selectively — the genuinely state-machine-like screens — and for KMP shared logic, where MVIKotlin/Decompose maturity changes the calculus. Showing you can argue both sides *is* the senior signal on this question.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain how MVI relates to Redux, Elm, and Flux — and why that lineage matters.",
    a: [
      {
        t: "p",
        text: "Direct family line: **Flux** (Facebook) introduced unidirectional dispatch; **Elm** formalized the pure `update : Msg -> Model -> Model` loop with effects as data (Commands); **Redux** popularized single-store + pure reducers + middleware in JS; **Cycle.js** framed UI as a stream cycle — and Hannes Dorfmann's MVI translated that stack of ideas to Android's Rx world. The mapping is one-to-one: Intent = Action/Msg, State = Store/Model, Reducer = reducer/update, effect layer = middleware/Commands, render = view function.",
      },
      {
        t: "p",
        text: "Why it matters beyond trivia: the lineage tells you MVI's properties are *inherited theorems, not marketing* — determinism, replay, time-travel come from reducer purity (Elm proved the model); the middleware slot is where every family member handles IO, so you know where effects belong in any MVI library you meet; and the known failure modes (boilerplate fatigue, giant single stores) played out in the JS ecosystem first, so their mitigations (state slicing, selectors — reselect in Redux, field-flows in MVI) are already mapped. Recognizing a 'new' architecture as an instance of a family is exactly the judgment senior interviews probe for.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does MVI stand for, and what are its three core principles?",
    a: [
      {
        t: "p",
        text: "MVI stands for **Model–View–Intent**, but the name undersells it — MVI is less about three boxes and more about a *cyclic, unidirectional* flow of data. The View emits Intents (user intentions), those are reduced into a new immutable Model (state), and the View renders that state. It grew out of Redux/Elm/Cycle.js and came to Android around 2016.",
      },
      {
        t: "list",
        items: [
          "**Single immutable state** — the entire screen is described by *one* immutable state object at any moment. Not several streams — one.",
          "**Reified intents** — every user action is a value (`data class QueryChanged(val q: String)`), funneled through a single entry point, not scattered method calls.",
          "**Pure reduction** — state only ever changes through a pure reducer function `(state, change) -> newState`; no other code mutates state.",
        ],
      },
      {
        t: "p",
        text: "These three constraints are what distinguish MVI from MVVM. MVVM allows several observable streams, N public functions for input, and mutation anywhere in the ViewModel. MVI tightens all three: one state, one input funnel, one place mutation happens. The payoff is predictability (state is a pure function of the intent history) and debuggability (log the intents and states and you can replay any bug).",
      },
      {
        t: "note",
        text: "MVI in one line: 'MVVM with the screws tightened — exactly one immutable state, all inputs as intent objects through one entry point, all changes through a pure reducer.'",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Unidirectional Data Flow (UDF), and why does MVI enforce it?",
    a: [
      {
        t: "p",
        text: "Unidirectional Data Flow means data moves in *one direction* around a cycle: state flows *down* to the UI, and events flow *up* from the UI. The UI never mutates state directly — it emits an event, something processes it into new state, and the new state flows back down to be rendered. There's no two-way binding, no UI reaching in to change data.",
      },
      {
        t: "code",
        title: "The UDF cycle",
        code: `// State flows DOWN to the UI:
render(state)                          // UI is a pure function of state

// Events flow UP from the UI:
onClick = { store.onIntent(Intent.Refresh) }   // UI emits an intent, never mutates state

// The intent produces new state, which flows down again -> cycle`,
      },
      {
        t: "p",
        text: "MVI enforces UDF strictly by making state immutable and changeable only through the reducer, and by making all input explicit intents. The benefit is that the UI can *always* be redrawn from scratch given the current state (which is exactly what Compose does), and there's a single, traceable path for every change. Bugs where 'the UI and the data disagree' become impossible because the UI is *derived* from a single state, not independently mutated.",
      },
      {
        t: "p",
        text: "Worth noting: modern MVVM on Android *also* uses UDF (single UiState, state down / events up). So UDF isn't unique to MVI — it's the shared foundation. MVI just adds stricter rules (reified intents, a formal reducer) on top of the same UDF principle.",
      },
      {
        t: "note",
        text: "UDF = state down, events up, UI never mutates state. It's shared by modern MVVM *and* MVI — MVI just formalizes it further with intents and a reducer.",
      },
    ],
  },
  {
    level: "junior",
    q: "Show a complete minimal MVI implementation.",
    a: [
      {
        t: "p",
        text: "A minimal MVI setup has four pieces: an immutable **State**, a sealed **Intent** type (all possible user actions), a single **entry point** (`onIntent`) that funnels actions, and a **reducer** that produces new state. On Android it's usually hosted inside a ViewModel for lifecycle survival.",
      },
      {
        t: "code",
        title: "State + Intent + reducer loop",
        code: `data class SearchState(
    val query: String = "",
    val results: List<Item> = emptyList(),
    val isLoading: Boolean = false,
)

sealed interface SearchIntent {                     // every action is a value
    data class QueryChanged(val q: String) : SearchIntent
    data object Retry : SearchIntent
}

class SearchViewModel(private val repo: Repo) : ViewModel() {
    private val _state = MutableStateFlow(SearchState())
    val state: StateFlow<SearchState> = _state.asStateFlow()

    fun onIntent(intent: SearchIntent) {            // SINGLE entry point
        when (intent) {
            is SearchIntent.QueryChanged -> {
                reduce { it.copy(query = intent.q, isLoading = true) }  // pure update
                search(intent.q)
            }
            is SearchIntent.Retry -> search(state.value.query)
        }
    }

    private fun search(q: String) = viewModelScope.launch {
        val items = repo.search(q)                  // side effect (outside the reducer)
        reduce { it.copy(isLoading = false, results = items) }
    }
    private fun reduce(f: (SearchState) -> SearchState) { _state.update(f) }  // one mutation point
}`,
      },
      {
        t: "code",
        title: "The View (render + intents)",
        code: `@Composable fun SearchScreen(vm: SearchViewModel) {
    val state by vm.state.collectAsStateWithLifecycle()
    SearchContent(state = state, onIntent = vm::onIntent)  // one lambda, not N callbacks
}`,
      },
      {
        t: "p",
        text: "Notice this still uses `StateFlow` + `viewModelScope` — MVI on Android is a *discipline layered on* the MVVM toolkit, not a replacement for it. The strict version extracts the reducer into a standalone pure function; here the `copy` lambdas are the reducer inline.",
      },
      {
        t: "note",
        text: "Point out that MVI runs *inside* a ViewModel using StateFlow — it's a discipline (single state, intent funnel, reducer), not a different runtime from MVVM.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between State and Effect (side effect) in MVI?",
    a: [
      {
        t: "p",
        text: "In MVI, **State** is the *persistent* description of the screen — what should be shown right now (loading, the list, an error message). It survives and is re-rendered on every recomposition/rotation. An **Effect** (or side effect / one-shot event) is something that should happen *exactly once* and isn't part of the screen's persistent picture — navigating away, showing a snackbar, triggering a vibration.",
      },
      {
        t: "list",
        items: [
          "**State** — 'what the screen looks like'. Sticky, re-rendered, survives config change. Example: `isLoading = true`, `results = [...]`.",
          "**Effect** — 'a one-time action'. Fire-and-forget, must not repeat on re-render. Example: navigate to detail, show a toast.",
        ],
      },
      {
        t: "code",
        title: "State vs Effect",
        code: `data class State(val results: List<Item>, val isLoading: Boolean)   // persistent

sealed interface Effect {                                          // one-shot
    data class NavigateTo(val id: String) : Effect
    data class ShowSnackbar(val msg: String) : Effect
}
// Effects go through a SEPARATE channel (SharedFlow/Channel), not the state:
private val _effects = Channel<Effect>()
val effects: Flow<Effect> = _effects.receiveAsFlow()`,
      },
      {
        t: "p",
        text: "Why the distinction matters: if you put a one-shot action *in* state (e.g. `navigate = true`), it re-fires on every recomposition and after rotation — the sticky-state problem. So effects need a *separate*, non-replaying channel (a `Channel` or `SharedFlow`). Purist MVI tries to model even effects as consumable state, but most implementations use a dedicated effect stream (Orbit's `postSideEffect`, MVIKotlin's Labels) precisely because true one-shot events don't fit the sticky-state model.",
      },
      {
        t: "note",
        text: "State = persistent 'what to show' (sticky, re-rendered); Effect = one-shot 'do this once' (navigation/snackbar) via a separate channel — putting effects in state causes the re-fire-on-rotation bug.",
      },
    ],
  },
  {
    level: "senior",
    q: "MVI vs MVVM — what are the honest trade-offs?",
    a: [
      {
        t: "p",
        text: "MVI is essentially MVVM with three extra constraints (single state, reified intents, pure reducer). Those constraints buy predictability and debuggability at the cost of boilerplate and ceremony. Whether it's worth it depends heavily on the screen's complexity and the team's size.",
      },
      {
        t: "table",
        headers: ["", "MVVM (typical)", "MVI (strict)"],
        rows: [
          ["State", "one or several observable streams", "exactly one immutable state object"],
          ["User input", "N public functions on the VM", "one entry point taking sealed intents"],
          ["Mutation", "anywhere in the VM via update{}", "only the reducer"],
          ["Auditability", "log manually per mutation", "free: intent log + state log = full history"],
          ["Boilerplate", "lower", "higher (intent classes, changes, wiring)"],
          ["Learning curve", "low", "moderate (reducer/effect discipline)"],
          ["Best for", "CRUD screens, small teams", "complex state machines, large teams"],
        ],
      },
      {
        t: "p",
        text: "The nuance that shows maturity: MVVM and MVI have *converged*. Google's recommended architecture — single UiState, `update {}`, UDF, events-as-state — is MVI in all but name. The remaining difference is whether intents are *reified* (sealed Intent objects vs plain method calls) and whether reduction is *centralized* (one reducer vs mutation scattered in the VM). That's a *team-scaling* decision, not a correctness one: reified intents + a central reducer give you an audit log and enforced discipline, which pays off on large teams and complex screens but is ceremony on a simple CRUD screen.",
      },
      {
        t: "note",
        text: "MVVM-with-UDF and MVI have converged; the real delta is 'reified intents + central reducer' (audit log, enforced discipline) — worth it at team/complexity scale, ceremony otherwise.",
      },
    ],
  },
  {
    level: "senior",
    q: "When should you choose MVI over MVVM?",
    a: [
      {
        t: "p",
        text: "Choose MVI when the benefits of its stricter constraints (single state, reified intents, pure reducer) outweigh their ceremony — which is specifically for *complex, stateful screens* and *large teams*, or for *KMP shared logic*. For simple CRUD screens or small teams, modern MVVM (single UiState + UDF) already gives ~80% of the benefit at ~50% of the cost.",
      },
      {
        t: "list",
        items: [
          "**Choose MVI when** — screens are genuinely state-machine-like (editors, media players, multi-step wizards, checkout flows) where impossible states and complex transitions are a real risk; the team is large enough that *convention* (MVVM's 'please use a single UiState') fails and you want the *structure enforced*; you need auditability/time-travel for debugging complex flows; or you're in KMP where MVIKotlin+Decompose is a mature shared-logic stack.",
          "**Stay with MVVM when** — screens are CRUD-ish (a list, a form, a detail), the team is small, and the ceremony (intent classes, changes, reducer wiring) would be overhead without payoff. Modern MVVM with a single UiState is already UDF and already 'MVI-lite'.",
          "**Performance caveat either way** — a single giant state object recomposes everything observing it; mitigate by splitting state into cohesive sub-objects and keeping it stable, regardless of MVI or MVVM.",
        ],
      },
      {
        t: "p",
        text: "The mature close: I don't pick dogmatically. Compose + StateFlow + UDF naturally lands *between* MVVM and MVI, which is exactly what Google's guidance recommends. I'd reach for full MVI (with a library like Orbit or MVIKotlin) selectively — the genuinely complex screens — and use MVVM-with-UDF as the default, rather than imposing MVI's ceremony everywhere.",
      },
      {
        t: "note",
        text: "MVI for complex state-machine screens + large teams + KMP; MVVM-with-UDF as the default for CRUD/small teams. Modern MVVM is already 'MVI-lite', so reserve full MVI for where its discipline actually pays.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does MVI achieve 'make illegal states unrepresentable'?",
    a: [
      {
        t: "p",
        text: "'Make illegal states unrepresentable' means designing your state type so that combinations that should never happen *cannot even be expressed* — the compiler prevents them. MVI leans into this by modeling state carefully, often with sealed hierarchies, so that mutually-exclusive states can't coexist.",
      },
      {
        t: "code",
        title: "Representable illegal states vs unrepresentable",
        code: `// BAD: flags allow impossible combinations
data class State(val isLoading: Boolean, val data: List<Item>?, val error: String?)
// isLoading=true AND error!=null AND data!=null — all three at once? Meaningless but possible.

// GOOD: sealed type — the states are mutually exclusive, illegal combos can't exist
sealed interface State {
    data object Loading : State
    data class Content(val data: List<Item>) : State
    data class Error(val message: String) : State
}
// You literally cannot be Loading AND Error at the same time.`,
      },
      {
        t: "p",
        text: "The reducer then benefits: a pure `(state, change) -> newState` over a sealed state, handled with an exhaustive `when`, means the compiler forces you to handle every state, and you can't accidentally produce an impossible one. This is a big part of MVI's correctness argument — the *type system* encodes the valid states, and the reducer is the only place they change, so invalid states are eliminated by construction rather than guarded against at runtime.",
      },
      {
        t: "p",
        text: "The caveat: sealed states are ideal for *mutually exclusive* states, but real screens often have *overlapping* concerns (showing cached data *while* refreshing *with* an error banner). Forcing those into a sealed hierarchy causes state duplication. So the pragmatic approach is a data class whose fields include sealed sub-states — you get 'illegal states unrepresentable' for the parts that are genuinely exclusive without contorting the parts that legitimately overlap.",
      },
      {
        t: "note",
        text: "Model exclusive states as a sealed hierarchy so impossible combos can't compile; use a data class (possibly with sealed sub-fields) when states legitimately overlap. Illegal-states-unrepresentable is a design goal, not a mandate to sealed-everything.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle one-shot effects (navigation, snackbars) in MVI without the re-fire bug?",
    a: [
      {
        t: "p",
        text: "One-shot effects — navigation, snackbars, toasts — must happen *exactly once*, but MVI's state is sticky (re-rendered on every recomposition and after rotation). If you put an effect in state (`navigate = true`), it re-fires on the next render. So effects need a *separate* delivery mechanism from state, and there are a few approaches with different trade-offs.",
      },
      {
        t: "list",
        items: [
          "**Separate effect channel (most common)** — a `Channel(BUFFERED).receiveAsFlow()` or a `SharedFlow(replay=0)` beside the state, carrying `Effect` values the View collects once. Orbit's `postSideEffect` and MVIKotlin's Labels do this. Pragmatic and clean; inherits the usual event-delivery caveats (a SharedFlow can drop events emitted while no collector is active; a Channel suspends until delivered, which is safer).",
          "**Effect-as-consumable-state (purist)** — a nullable field in state (`pendingNav: Destination?`) cleared by a `NavConsumed` intent after the View handles it. Survives config change and (if in SavedStateHandle) process death; replay-safe. More ceremony.",
          "**One-off events with unique ids** — event objects carrying a unique id so re-renders dedupe; seen in Redux-family ports.",
        ],
      },
      {
        t: "code",
        title: "Effect channel + collection",
        code: `private val _effects = Channel<Effect>(Channel.BUFFERED)
val effects: Flow<Effect> = _effects.receiveAsFlow()

fun onIntent(i: Intent) { if (i is Intent.ItemClicked)
    viewModelScope.launch { _effects.send(Effect.NavigateTo(i.id)) } }

// View collects once:
LaunchedEffect(Unit) { vm.effects.collect { when (it) {
    is Effect.NavigateTo -> navController.navigate(it.id) } } }`,
      },
      {
        t: "p",
        text: "This is the *same* one-shot event problem that MVVM has — MVI doesn't magically solve it; it just gives it a named home (the effect channel). My default is a `Channel` for genuine fire-and-forget (navigation, snackbars) because `send` suspends until delivered, and consumable-state for anything that must survive process death.",
      },
      {
        t: "note",
        text: "Effects go through a *separate* channel (Channel/SharedFlow), never state — putting them in state causes re-fire on rotation. MVI doesn't solve the one-shot problem, it just names it (the effect channel).",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the real costs and downsides of adopting MVI?",
    a: [
      {
        t: "p",
        text: "MVI's benefits (predictability, auditability, enforced discipline) are real, but so are its costs — and a balanced answer names them, because uncritically advocating MVI is a red flag. The costs are mostly *ceremony* and the risk of over-applying it.",
      },
      {
        t: "list",
        items: [
          "**Boilerplate** — every action needs an intent class, often a 'change' type, and reducer wiring. A settings toggle that's one line in MVVM becomes intent + change + reducer branch + wiring in strict MVI.",
          "**Ceremony tax on simple screens** — for CRUD screens, the machinery adds indirection without payoff, and developers respond by smuggling shortcuts, which makes *inconsistent* MVI (worse than consistent MVVM).",
          "**Giant single-state performance** — one state object means every change potentially recomposes everything observing it; you must split state into cohesive slices and keep it stable, or scrolling/typing janks.",
          "**Learning curve** — reducer purity, effect handling, and the intent/change/reducer separation must be taught; a team half-understanding MVI produces a mess.",
          "**It doesn't solve the hard problems** — one-shot events, process death, and async races persist in MVI (just relocated); anyone selling MVI as the fix for those is overpromising.",
          "**Framework lock-in risk** — adopting Orbit/MVIKotlin brings a DSL and test tooling you're now coupled to; hand-rolling avoids that but loses the enforcement.",
        ],
      },
      {
        t: "p",
        text: "The balanced position: MVI is excellent for genuinely complex, state-machine-like screens and large teams needing enforced structure, and increasingly for KMP. But for simple screens or small teams, modern MVVM-with-UDF captures most of the value at far less cost — so applying MVI everywhere is over-engineering. Being able to argue *against* MVI is itself the senior signal.",
      },
      {
        t: "note",
        text: "Name MVI's costs honestly: boilerplate, ceremony on simple screens, giant-state recomposition, learning curve, and that it doesn't solve events/process-death/races. Being able to argue against MVI is the senior tell.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does time-travel debugging work in MVI, and why is it possible?",
    a: [
      {
        t: "p",
        text: "Time-travel debugging means being able to step backward and forward through an app's states — replaying how the UI got to its current state, and even reproducing a bug by replaying the exact sequence of user actions. It's possible in MVI *because* of its constraints: state is immutable, changes only happen through a pure reducer, and every input is a reified intent — so the entire history is a deterministic function of a logged sequence.",
      },
      {
        t: "list",
        items: [
          "**Log the inputs and outputs** — since every action is an `Intent` value and every state is immutable, you can record the full sequence: intent → state → intent → state.",
          "**Determinism from reducer purity** — because the reducer is pure `(state, change) -> newState`, replaying the same intents from the same start *always* produces the same states. No hidden mutation means no non-reproducibility.",
          "**Replay a bug** — attach the intent log to a crash report; a developer replays the intents through the reducer and reproduces the exact state that caused the bug. No guessing 'what did the user do?'.",
          "**Snapshot state** — because state is a single immutable object, you can snapshot it at any point (for bug reports) or diff two states.",
        ],
      },
      {
        t: "p",
        text: "This is inherited from MVI's ancestors — Elm formalized the pure `update` loop, and Redux DevTools popularized time-travel in JS. MVIKotlin provides time-travel tooling on Android for exactly this reason. The caveat: the *state* is replayable, but *effects* (network calls) are not re-run on replay (the world has changed), and the log is in-memory so it dies with the process — so time-travel is a *debugging* aid, not a persistence mechanism. Still, 'reproduce any bug by replaying its intents' is a genuine, MVI-specific superpower.",
      },
      {
        t: "note",
        text: "Time-travel works because reducer purity + immutable state + reified intents make the whole history deterministic from a logged intent sequence — replay the intents, reproduce the bug. It's MVI's concrete debugging payoff.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is MVI especially popular in Kotlin Multiplatform?",
    a: [
      {
        t: "p",
        text: "MVI is arguably *more* popular in KMP than in pure Android, because a framework-free state machine (single state, reified intents, pure reducer) is the perfect *shared brain* — it lives entirely in `commonMain`, and each platform (Android Compose, iOS SwiftUI) just renders the state and sends intents. The strict, self-contained loop maps cleanly onto the 'share logic, keep native UI' KMP model.",
      },
      {
        t: "list",
        items: [
          "**A self-contained loop shares perfectly** — the State/Intent/reducer/effect loop has no platform dependencies, so it drops into `commonMain` and drives both platforms identically. Each platform observes the shared state and dispatches shared intents.",
          "**MVIKotlin + Decompose is the flagship stack** — Decompose provides lifecycle-aware, navigable 'components' shared across Android/iOS/desktop/web; MVIKotlin provides the Store loop inside them. This is a mature, production KMP architecture.",
          "**Sealed intents/states benefit from SKIE on iOS** — SKIE turns Kotlin sealed classes into exhaustive Swift enums, so the shared MVI state/intents are pleasant to consume from Swift (exhaustive `switch` instead of `is` checks).",
          "**Uniform mental model** — one architecture (the reducer loop) works everywhere, so developers reason about the app the same way regardless of platform.",
        ],
      },
      {
        t: "p",
        text: "The deeper reason: MVI's constraints (framework-free logic, single state, explicit intents) are *exactly* what makes code shareable — the same discipline that makes it testable and predictable makes it portable. iOS consumes the shared state the same way it would a shared MVVM ViewModel's StateFlow (via SKIE/an adapter), and dispatches intents as plain function calls. So MVI's popularity in KMP is really MVI's framework-independence paying off doubly — for testability *and* for sharing.",
      },
      {
        t: "note",
        text: "MVI's framework-free reducer loop is the perfect KMP 'shared brain' — MVIKotlin + Decompose is the flagship stack, and SKIE makes the sealed intents/states idiomatic in Swift. Framework-independence pays off for both testing and sharing.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between an Intent, an Action/Change, and the State in MVI?",
    a: [
      {
        t: "p",
        text: "These three (sometimes four, with Effect) are the vocabulary of the MVI loop, and mixing them up is common. An **Intent** is what the *user wants* ('I clicked retry'). A **Change/Result/Action** is the internal 'thing that happened' that the reducer applies ('data loaded', 'loading started'). The **State** is the resulting immutable description of the screen.",
      },
      {
        t: "list",
        items: [
          "**Intent** — a *user intention*, emitted by the View. `RetryClicked`, `QueryChanged(text)`. It's the input to the system.",
          "**Change / Result / Action** — an internal event the reducer consumes to produce new state. `Loading`, `DataLoaded(items)`, `Failed(error)`. Often produced by the side-effect layer after processing an intent.",
          "**State** — the immutable output describing the whole screen. `State(isLoading = false, items = [...])`.",
          "**(Effect)** — a one-shot side action (navigate, snackbar) delivered separately from state.",
        ],
      },
      {
        t: "code",
        title: "The full vocabulary in flow",
        code: `Intent.Retry
  -> (effect layer) emits Change.Loading -> reducer -> State(isLoading=true)
  -> (effect layer) does network, emits Change.DataLoaded(items)
  -> reducer -> State(isLoading=false, items=items)`,
      },
      {
        t: "p",
        text: "Why the Intent/Change split exists: it keeps the reducer *pure*. The reducer only ever sees *Changes* (plain data describing what happened), never does the async work itself. The 'effect layer' (Orbit's `intent{}`, MVIKotlin's Executor) turns an Intent into async work and emits Changes as the work completes. Simple MVI often collapses Intent and Change into one type; strict MVI (and Redux/Elm) keeps them separate for reducer purity.",
      },
      {
        t: "note",
        text: "Intent = user wants (input); Change/Result = what happened (reducer's input); State = the screen (output). The Intent→Change split keeps the reducer pure — async lives in the effect layer, the reducer only sees plain Changes.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain how MVI relates to Redux, Elm, and Flux, and why that lineage matters.",
    a: [
      {
        t: "p",
        text: "MVI is a direct descendant of a lineage of web architectures, and recognizing that isn't trivia — it tells you MVI's properties are *inherited theorems* (proven elsewhere), and where each concept comes from. The line runs Flux → Elm → Redux → Cycle.js → MVI.",
      },
      {
        t: "list",
        items: [
          "**Flux (Facebook)** — introduced *unidirectional dispatch*: actions flow one way through a dispatcher to stores. First to reject two-way binding.",
          "**Elm** — formalized the pure `update : Msg -> Model -> Model` loop with *effects as data* (Commands). This is where reducer purity and 'effects are values the runtime executes' come from — and Elm *proved* the determinism/replay properties.",
          "**Redux** — popularized *single store + pure reducers + middleware* in JS. The single-state-object and the middleware-for-side-effects slot come from here.",
          "**Cycle.js** — framed UI as a *stream cycle* (the 'Intent' terminology and the reactive-loop framing).",
          "**MVI (Hannes Dorfmann, ~2016)** — translated this whole stack to Android's RxJava/coroutines world.",
        ],
      },
      {
        t: "p",
        text: "Why it matters: the mapping is one-to-one — Intent = Action/Msg, State = Store/Model, Reducer = reducer/update, effect layer = middleware/Commands, render = view function. So MVI's guarantees (determinism, time-travel, replay) are *not* marketing — they're Elm's proven properties following from reducer purity. And knowing the middleware slot is where every family member handles side effects tells you *where effects belong* in any MVI library you meet. Recognizing a 'new' Android architecture as an instance of a well-understood family — including its known failure modes (boilerplate fatigue, giant stores, which the JS world hit first and solved with selectors/reselect) — is exactly the systems-level judgment senior interviews probe.",
      },
      {
        t: "note",
        text: "Flux→Elm→Redux→Cycle→MVI, one-to-one: Intent=Action, State=Store, Reducer=update, effect layer=middleware. MVI's replay/time-travel are *Elm's proven theorems*, not marketing — and the JS ecosystem already mapped its failure modes and fixes.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you model a form with multiple input fields in MVI?",
    a: [
      {
        t: "p",
        text: "A form is a good MVI test case because it has many inputs and validation. You model the *whole form* as one state object (all fields + validation + submit status), each field edit as an intent, and validation as pure logic in the reducer. The View renders the single state and emits an intent per keystroke.",
      },
      {
        t: "code",
        title: "A form in MVI",
        code: `data class SignupState(
    val email: String = "",
    val password: String = "",
    val emailError: String? = null,
    val isSubmitEnabled: Boolean = false,
    val isSubmitting: Boolean = false,
)

sealed interface SignupIntent {
    data class EmailChanged(val v: String) : SignupIntent
    data class PasswordChanged(val v: String) : SignupIntent
    data object Submit : SignupIntent
}

fun onIntent(i: SignupIntent) = when (i) {
    is SignupIntent.EmailChanged -> reduce {
        val err = if (i.v.contains("@")) null else "Invalid email"   // validation in reducer
        it.copy(email = i.v, emailError = err,
                isSubmitEnabled = err == null && it.password.length >= 8)
    }
    is SignupIntent.PasswordChanged -> reduce { it.copy(password = i.v,
        isSubmitEnabled = it.emailError == null && i.v.length >= 8) }
    SignupIntent.Submit -> submit()
}`,
      },
      {
        t: "p",
        text: "The benefit: the *entire* form state (values, errors, whether submit is enabled) is one object derived by pure logic, so it's trivially testable ('given this email, emailError should be X and submit disabled') and always consistent — the submit button's enabled state can never disagree with the field validity because it's computed in the same reducer.",
      },
      {
        t: "p",
        text: "The performance caveat: a single form state means every keystroke updates the whole state object, potentially recomposing every field. For a big form, split the state or use per-field `derivedStateOf`/stable slices so typing in one field doesn't recompose the others. Also, high-frequency text-field state is sometimes better kept as local UI state, entering the MVI loop debounced — running the full reduce cycle per keystroke can be overkill.",
      },
      {
        t: "note",
        text: "Model the whole form as one state with validation in the reducer (submit-enabled can't disagree with field validity). Watch recomposition: split state or debounce input so every keystroke doesn't reduce+recompose the entire form.",
      },
    ],
  },
  {
    level: "senior",
    q: "How would you migrate an existing MVVM screen to MVI incrementally?",
    a: [
      {
        t: "p",
        text: "Migrating MVVM → MVI is usually *low-risk* because modern MVVM (single UiState + UDF) is already most of the way there — you're mainly *reifying inputs* (turning public functions into intent objects) and *centralizing mutation* (into a reducer). You can do it screen by screen without touching the data/domain layers.",
      },
      {
        t: "list",
        items: [
          "**Precondition check** — if the ViewModel already exposes a single `UiState` StateFlow and follows UDF, you're 80% done. If it exposes multiple streams, consolidate to one UiState first (a pure MVVM improvement).",
          "**Reify the inputs** — replace the ViewModel's N public functions (`onQueryChange`, `onRetry`) with a single `onIntent(intent: Intent)` and a sealed `Intent` type. The View now sends intent objects through one entry point instead of calling named methods.",
          "**Centralize mutation into a reducer** — replace the scattered `_state.update { ... }` calls with a single reducer function that all state changes flow through. Extract it as a pure `(state, change) -> state` if you want strict MVI (and testability of the reducer in isolation).",
          "**Separate effects** — move one-shot events (navigation, snackbar) to a dedicated effect channel if not already.",
          "**Adopt a library if desired** — Orbit is the gentlest (a DSL over the ViewModel you already have); MVIKotlin is stricter. But you don't *need* a library — hand-rolled MVI is just the discipline above.",
        ],
      },
      {
        t: "p",
        text: "The key judgment: migrate *selectively*, not wholesale. Move the genuinely complex, state-machine-like screens to MVI where the discipline pays; leave simple CRUD screens as MVVM-with-UDF where MVI would be ceremony. Because both share the same StateFlow/ViewModel foundation, the two can coexist during migration — there's no all-or-nothing rewrite. And convert the tests: MVVM's state-assertion tests mostly carry over (MVI is also state-based), plus you gain reducer unit tests.",
      },
      {
        t: "note",
        text: "MVVM→MVI is mostly 'reify inputs (functions→intents) + centralize mutation (→reducer)' — low-risk since both share StateFlow/UDF. Migrate complex screens selectively; leave simple ones as MVVM. No wholesale rewrite needed.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you keep the reducer pure when you need randomness, timestamps, or IDs?",
    a: [
      {
        t: "p",
        text: "A pure reducer must produce the same output for the same input — so it can't call `System.currentTimeMillis()`, `Random`, or `UUID.randomUUID()` directly, because those return different values each call, breaking determinism (and time-travel replay). The rule is: *impure values enter the reducer as inputs (in the Change/Intent), never generated inside it*.",
      },
      {
        t: "code",
        title: "Impure values come in as data, not generated inside",
        code: `// BAD: reducer generates a timestamp -> not deterministic, breaks replay
fun reduce(s: State, c: Change): State = when (c) {
    is Change.AddNote -> s.copy(notes = s.notes + Note(id = UUID.randomUUID(),  // impure!
                                                        createdAt = System.now())) // impure!
}

// GOOD: the effect layer generates them and passes them IN as part of the Change
// effect layer: emit Change.AddNote(id = uuid(), createdAt = clock.now(), text = ...)
fun reduce(s: State, c: Change): State = when (c) {
    is Change.AddNote -> s.copy(notes = s.notes + Note(c.id, c.createdAt, c.text))  // pure
}`,
      },
      {
        t: "list",
        items: [
          "**Generate impure values in the effect/middleware layer** — the layer that does async work (already impure) creates the id/timestamp/random value and includes it *in the Change* it emits.",
          "**The reducer just uses the value** — it receives the id/timestamp as plain data and copies it into state, staying pure and deterministic.",
          "**Inject clocks/random for testability** — the effect layer takes a `Clock` and random source as dependencies, so tests can supply deterministic ones.",
        ],
      },
      {
        t: "p",
        text: "This is the same pattern as 'where do side effects go if reducers are pure' — the reducer is a pure function of *values*, and *all* impurity (async, IO, clocks, randomness) lives in the effect layer *around* it, feeding results in as plain data. Keeping that boundary crisp is what preserves reducer purity and its downstream benefits (testability, determinism, replay).",
      },
      {
        t: "note",
        text: "Never generate timestamps/IDs/random *in* the reducer — the effect layer generates them and passes them into the Change as data. All impurity lives around the reducer, feeding it plain values, preserving purity and replay.",
      },
    ],
  },
];

export default qa;
