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
];

export default qa;
