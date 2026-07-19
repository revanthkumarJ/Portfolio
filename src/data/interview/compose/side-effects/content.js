// Side Effects — Content tab. Teaching-first.

const content = [
  {
    heading: "What a 'side effect' is and why Compose needs special APIs for them",
    blocks: [
      {
        t: "p",
        text: "A **side effect** is anything a composable does that reaches *outside* itself and isn't just describing UI: showing a snackbar, starting a coroutine, registering a listener, logging analytics, calling a callback, writing to a repository. The problem is that composable bodies are **not** a safe place for these — recall the rules: a composable can run many times per second (recomposition), be skipped, run in any order, or be abandoned mid-execution. If you fired a network call or logged an event directly in the body, it would fire an unpredictable number of times, or not at all.",
      },
      {
        t: "p",
        text: "So Compose provides **effect APIs**: controlled entry points that run your side-effecting code at well-defined moments in the composition lifecycle — when a composable *enters* the composition, when it *leaves*, when specific *keys change* — instead of on every recomposition. Learning Compose side effects is really learning \"which API runs my code at which moment, and how is it cleaned up\".",
      },
      {
        t: "note",
        text: "Frame this in interviews as: \"composition must stay a pure description of UI; anything that isn't pure UI goes through an effect handler that ties its execution and cleanup to the composition lifecycle.\" That one sentence explains why all these APIs exist.",
      },
    ],
  },
  {
    heading: "LaunchedEffect — run suspend work tied to composition",
    blocks: [
      {
        t: "p",
        text: "`LaunchedEffect(keys)` launches a **coroutine** when the composable enters the composition, and **cancels it** when the composable leaves. If any key changes, it **cancels the old coroutine and starts a fresh one**. This is the primary way to run suspend work (load data on first show, animate, observe something) from the UI.",
      },
      {
        t: "code",
        title: "The three canonical uses",
        code: `// 1) Run once when the screen appears (key = Unit / a constant)
LaunchedEffect(Unit) {
    viewModel.trackScreenView()
}

// 2) Re-run when an input changes (key = the input)
LaunchedEffect(userId) {
    viewModel.loadUser(userId)   // old load cancelled if userId changes
}

// 3) Consume a one-shot event stream (snackbars, navigation)
LaunchedEffect(Unit) {
    viewModel.events.collect { event ->
        when (event) {
            is UiEvent.ShowSnackbar -> snackbarHostState.showSnackbar(event.msg)
            is UiEvent.NavigateBack -> navController.popBackStack()
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**The keys ARE the contract**: they answer 'when should this restart?'. `LaunchedEffect(userId)` = 'this work belongs to *this* userId; if it changes, abandon and redo'. `LaunchedEffect(Unit)` = 'run once for the composable's whole lifetime'.",
          "The coroutine runs in a scope tied to the composition — leaving the composition cancels it automatically (no manual job management), which is why `LaunchedEffect` is the safe home for `collect`, `delay`, animations, and one-shot loads.",
          "**Common bug — wrong key**: `LaunchedEffect(Unit) { load(userId) }` loads only the *first* userId and never reloads when it changes (Unit never changes). Put the real dependency in the key.",
          "**Don't** use it for work that should outlive the screen (uploads that must finish) — that belongs in the ViewModel/repository with an app-scoped scope; `LaunchedEffect` is for UI-lifetime work.",
        ],
      },
    ],
  },
  {
    heading: "rememberCoroutineScope — launch from event handlers, not composition",
    blocks: [
      {
        t: "p",
        text: "`LaunchedEffect` starts a coroutine *as part of composition*. But sometimes you need to start a coroutine in response to a **user event** (a click) — and you can't call a suspend function or `LaunchedEffect` from inside an `onClick` lambda. `rememberCoroutineScope()` gives you a `CoroutineScope` bound to the composition that you can `launch` from anywhere, including event handlers.",
      },
      {
        t: "code",
        title: "The distinction that trips people up",
        code: `val scope = rememberCoroutineScope()
val listState = rememberLazyListState()

// Event-driven -> rememberCoroutineScope (NOT LaunchedEffect)
Button(onClick = {
    scope.launch { listState.animateScrollToItem(0) }
}) { Text("Top") }

// Composition-driven -> LaunchedEffect
LaunchedEffect(selectedTab) {
    pagerState.animateScrollToPage(selectedTab)
}`,
      },
      {
        t: "list",
        items: [
          "**Decision rule**: is the coroutine started *because the composition happened / a key changed* → `LaunchedEffect`. Started *because the user did something* → `rememberCoroutineScope().launch`.",
          "Its scope is cancelled when the composable leaves the composition — same lifetime safety as LaunchedEffect.",
          "Anti-pattern: creating a scope with `CoroutineScope(...)` inside a composable — it isn't lifecycle-aware and leaks; always use `rememberCoroutineScope()`.",
        ],
      },
    ],
  },
  {
    heading: "DisposableEffect — effects that need cleanup",
    blocks: [
      {
        t: "p",
        text: "When a side effect **registers something that must be unregistered** — a listener, a callback, a broadcast receiver, a sensor — use `DisposableEffect`. It runs setup when the composable enters (or a key changes) and requires you to return an `onDispose { }` block that runs cleanup when it leaves (or before re-running on key change).",
      },
      {
        t: "code",
        title: "Registering and cleaning up a lifecycle observer",
        code: `DisposableEffect(lifecycleOwner) {
    val observer = LifecycleEventObserver { _, event ->
        if (event == Lifecycle.Event.ON_RESUME) viewModel.refresh()
    }
    lifecycleOwner.lifecycle.addObserver(observer)   // setup

    onDispose {
        lifecycleOwner.lifecycle.removeObserver(observer)  // cleanup — mandatory
    }
}`,
      },
      {
        t: "list",
        items: [
          "The mental model: `DisposableEffect` is 'setup + teardown' where the teardown is *required*; `LaunchedEffect` is 'a coroutine' where teardown is automatic cancellation. Use Disposable when there's no coroutine but there IS something to undo.",
          "On key change, the *old* effect's `onDispose` runs **before** the new setup — so registrations always balance.",
          "Forgetting `onDispose` (or registering in `LaunchedEffect` without cleanup) is the classic Compose leak — a receiver that outlives the screen.",
        ],
      },
    ],
  },
  {
    heading: "SideEffect and rememberUpdatedState — the smaller, sharper tools",
    blocks: [
      {
        t: "p",
        text: "**`SideEffect { }`** runs *after every successful recomposition* — used to publish Compose state to a non-Compose object that isn't lifecycle-scoped. Rare, but the right tool when you must push the latest composed value out to imperative code (e.g. updating an analytics user property, configuring a third-party object) on each successful composition.",
      },
      {
        t: "code",
        title: "SideEffect: publish composed state to external code",
        code: `SideEffect {
    analytics.setUserProperty("theme", if (isDark) "dark" else "light")
}`,
      },
      {
        t: "p",
        text: "**`rememberUpdatedState(value)`** solves the *stale capture* problem: when a long-running effect (keyed to `Unit`, so it must NOT restart) needs to always see the *latest* value of something. It returns a `State` box refreshed every recomposition, so the effect's closure reads the current value instead of the one captured when it started.",
      },
      {
        t: "code",
        title: "rememberUpdatedState: latest callback without restarting the effect",
        code: `@Composable
fun AutoLogout(onTimeout: () -> Unit) {
    val currentOnTimeout by rememberUpdatedState(onTimeout)
    LaunchedEffect(Unit) {          // must run exactly once — no restart
        delay(5.minutes)
        currentOnTimeout()          // always the latest handler, not the first
    }
}`,
      },
      {
        t: "list",
        items: [
          "The decision behind `rememberUpdatedState` vs keying the effect: 'should this ongoing work restart when the value changes?' No → `rememberUpdatedState`. Yes → put the value in the keys. Same one-liner from the State topic — it's the crux.",
          "`SideEffect` vs `LaunchedEffect`: `SideEffect` is synchronous, runs after *every* recomposition, no coroutine — for pushing values out. `LaunchedEffect` is a coroutine keyed to restart conditions — for doing work.",
        ],
      },
    ],
  },
  {
    heading: "produceState, snapshotFlow, and derivedStateOf — state-producing effects",
    blocks: [
      {
        t: "list",
        items: [
          "**`produceState`** turns non-Compose sources (a Flow, a callback API, a suspend load) *into* Compose `State`. It launches a coroutine (like LaunchedEffect) and gives you a `value` to write; readers recompose on change. `val user by produceState<Result>(Loading, id) { value = repo.load(id) }` — handy for local, screen-scoped async state without a ViewModel.",
          "**`snapshotFlow { }`** is the reverse bridge: it converts *Compose state reads* into a cold **Flow**, emitting when the read state changes. Use it to apply Flow operators (`debounce`, `distinctUntilChanged`, `filter`) to Compose state — e.g. react to scroll or text with debouncing.",
          "**`derivedStateOf`** (covered fully in the State topic) is the 'compute state from other state, recompose only when the result changes' tool — technically a state object, not an effect, but it lives in the same toolbox.",
        ],
      },
      {
        t: "code",
        title: "snapshotFlow: debounce a Compose-state search query",
        code: `LaunchedEffect(Unit) {
    snapshotFlow { query }            // Compose state -> Flow
        .debounce(300)
        .distinctUntilChanged()
        .collectLatest { viewModel.search(it) }
}`,
      },
    ],
  },
  {
    heading: "The decision table — which effect API when",
    blocks: [
      {
        t: "table",
        headers: ["Need", "API"],
        rows: [
          ["Run suspend work when composable appears / a key changes", "`LaunchedEffect(keys)`"],
          ["Launch a coroutine from a click / event handler", "`rememberCoroutineScope().launch`"],
          ["Register + unregister a listener/receiver/callback", "`DisposableEffect(keys) { ...; onDispose { } }`"],
          ["Publish composed state to non-Compose imperative code each recomposition", "`SideEffect { }`"],
          ["Keep a long-lived effect reading the latest value without restarting", "`rememberUpdatedState(value)`"],
          ["Turn a Flow/callback/suspend source into Compose State", "`produceState(initial, keys) { }`"],
          ["Turn Compose state into a Flow (to use Flow operators)", "`snapshotFlow { }`"],
          ["Compute state from state, recompose only when result changes", "`derivedStateOf { }`"],
        ],
      },
      {
        t: "note",
        text: "If you can articulate this table and the reasoning ('keys = restart contract', 'Disposable = has cleanup', 'rememberCoroutineScope = event-driven', 'rememberUpdatedState = don't restart but stay fresh'), you've covered the vast majority of Compose side-effect interview questions.",
      },
    ],
  },
];

export default content;
