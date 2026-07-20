// Side Effects — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is a side effect in Compose and why can't you just write it in the composable body?",
    a: [
      {
        t: "p",
        text: "**The concept**: a side effect is anything a composable does beyond describing UI — starting a coroutine, showing a snackbar, registering a listener, logging analytics, calling a repository. A composable body is supposed to be a *pure description*: given the same inputs, it emits the same UI and does nothing else observable.",
      },
      {
        t: "p",
        text: "**Why the body is unsafe for them**: composables don't run in a predictable, once-per-thing way. They recompose (possibly many times a second), can be **skipped** when inputs are unchanged, run in **any order**, and can even be **abandoned** mid-execution and restarted. So a network call written directly in the body might fire zero times (skipped), once, or dozens of times (every recomposition of an animation) — completely unpredictable. A snackbar would re-show on every recomposition.",
      },
      {
        t: "p",
        text: "**The solution**: Compose provides *effect APIs* — `LaunchedEffect`, `DisposableEffect`, `SideEffect`, etc. — that run your effect at a *defined moment* in the composition lifecycle (enter, leave, key change) rather than 'whenever the body happens to run', and handle cleanup. Learning side effects is learning which API pins your code to which moment.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does LaunchedEffect do, and what is the role of its keys?",
    a: [
      {
        t: "p",
        text: "**The concept**: `LaunchedEffect(keys) { }` launches a coroutine when the composable **enters the composition**, and automatically **cancels** it when the composable **leaves**. Because it's a coroutine, it's the home for suspend work driven by the UI: loading data when a screen appears, running an animation, or collecting a Flow of one-shot events.",
      },
      {
        t: "p",
        text: "**The keys are the restart contract** — they answer the question 'when should this work be thrown away and redone?'. `LaunchedEffect(Unit)` (a constant that never changes) runs **once** for the composable's entire lifetime. `LaunchedEffect(userId)` runs now, and if `userId` changes it **cancels the running coroutine and starts a fresh one** — exactly what you want when the work belongs to a specific input.",
      },
      {
        t: "code",
        title: "Right key vs wrong key",
        code: `// CORRECT: reloads whenever userId changes
LaunchedEffect(userId) { viewModel.loadUser(userId) }

// BUG: Unit never changes -> loads the FIRST userId, ignores later ones
LaunchedEffect(Unit) { viewModel.loadUser(userId) }`,
      },
      {
        t: "p",
        text: "So the single most common LaunchedEffect bug is a **wrong key**: keying on `Unit` when the effect actually depends on a value means it never re-runs when that value changes. The rule: put every value the effect *depends on* into the keys.",
      },
    ],
  },
  {
    level: "junior",
    q: "When do you use rememberCoroutineScope instead of LaunchedEffect?",
    a: [
      {
        t: "p",
        text: "**The concept**: both launch coroutines tied to the composition's lifetime, but they answer different triggers. `LaunchedEffect` launches its coroutine *as part of composition* — it runs when the composable appears or a key changes. `rememberCoroutineScope()` gives you a `CoroutineScope` you can `launch` from *anywhere*, including places that aren't composition — most importantly **event handlers** like `onClick`.",
      },
      {
        t: "p",
        text: "**Why you can't just use LaunchedEffect in a click**: an `onClick` lambda is ordinary (non-composable) code, so you can't call `LaunchedEffect` (a composable) or a suspend function inside it. `rememberCoroutineScope().launch { }` bridges that gap.",
      },
      {
        t: "list",
        items: [
          "**Decision rule**: coroutine started *because composition happened or a key changed* → `LaunchedEffect`. Started *because the user did something* → `rememberCoroutineScope().launch`.",
          "Example: animating a scroll when a tab is *selected via state* → `LaunchedEffect(selectedTab)`. Animating a scroll when a *button is clicked* → `scope.launch { }` in the onClick.",
          "Both scopes cancel when the composable leaves the composition. Never hand-roll `CoroutineScope(...)` in a composable — it's not lifecycle-aware and leaks.",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "What is DisposableEffect and when do you need it instead of LaunchedEffect?",
    a: [
      {
        t: "p",
        text: "**The concept**: `DisposableEffect` is for side effects that **register something you must later unregister** — a listener, a callback, a `BroadcastReceiver`, a sensor subscription, a lifecycle observer. It runs a setup block when the composable enters (or a key changes) and *forces* you to return an `onDispose { }` block that runs when the composable leaves (or before the effect re-runs on a key change).",
      },
      {
        t: "p",
        text: "**Why not LaunchedEffect**: LaunchedEffect is for *coroutines*, and its cleanup is automatic cancellation of that coroutine. When there's no coroutine but there *is* a resource to release, LaunchedEffect gives you nowhere to put the cleanup — so you'd leak. DisposableEffect's whole reason to exist is the guaranteed teardown.",
      },
      {
        t: "code",
        title: "The setup/teardown shape",
        code: `DisposableEffect(Unit) {
    val callback = SensorEventListener { /* ... */ }
    sensorManager.registerListener(callback, sensor, RATE)
    onDispose { sensorManager.unregisterListener(callback) }  // required
}`,
      },
      {
        t: "p",
        text: "Mental model: **DisposableEffect = setup + mandatory teardown; LaunchedEffect = a coroutine with automatic teardown.** Forgetting `onDispose` (or worse, doing a registration inside LaunchedEffect with no cleanup) is the classic Compose memory leak — a receiver that outlives its screen.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle one-time events like navigation or showing a snackbar from a ViewModel in Compose?",
    a: [
      {
        t: "p",
        text: "**The concept and the trap**: navigation and snackbars must happen **exactly once**, but Compose state is *sticky* — if you put `showSnackbar = true` in state, it re-fires on every recomposition and after rotation. So one-shot events need a mechanism that delivers once and doesn't replay.",
      },
      {
        t: "p",
        text: "**The common approach**: expose events from the ViewModel as a `Channel` (or `SharedFlow`) turned into a `Flow`, and collect it inside a `LaunchedEffect` in the UI. The LaunchedEffect runs the collection for the screen's lifetime and performs the action per event.",
      },
      {
        t: "code",
        title: "Event channel + LaunchedEffect collection",
        code: `// ViewModel
private val _events = Channel<UiEvent>(Channel.BUFFERED)
val events = _events.receiveAsFlow()

// UI
LaunchedEffect(Unit) {
    viewModel.events.collect { event ->
        when (event) {
            is UiEvent.ShowSnackbar -> snackbarHostState.showSnackbar(event.message)
            is UiEvent.NavigateBack -> navController.popBackStack()
        }
    }
}`,
      },
      {
        t: "p",
        text: "**The nuance to mention** (shows you know the debate): Google actually recommends modeling even these as *state* with a consumption callback, because Channel/SharedFlow events can be dropped or double-handled around lifecycle gaps — a snackbar message field cleared via `onMessageShown()` survives config change and process death. Both are acceptable; the interview signal is knowing *why* raw state is wrong for events and naming at least one correct solution.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain rememberUpdatedState. What exact problem does it solve, and how do you decide between it and keying the effect?",
    a: [
      {
        t: "p",
        text: "**The problem**: some effects must run **exactly once** and never restart — a 5-minute auto-logout timer, a one-time registration — so they're keyed on `Unit`. But such an effect may need to call a callback or read a value that the parent *updates over time*. Because the effect's coroutine closure captured the value at the moment it started (when `Unit` first ran), it will forever use the **stale** original — later recompositions create new callbacks, but the running effect never sees them.",
      },
      {
        t: "p",
        text: "**How `rememberUpdatedState` fixes it**: instead of capturing the raw value, you capture a stable `State` box whose `.value` is **refreshed on every recomposition**. The effect's closure holds the box (which never changes identity, so no restart) but dereferences `.value` at call time, getting the latest. It's a controlled indirection: 'restart nothing, but always read fresh'.",
      },
      {
        t: "code",
        title: "The pattern",
        code: `@Composable
fun LandingScreen(onTimeout: () -> Unit) {
    val currentOnTimeout by rememberUpdatedState(onTimeout)
    LaunchedEffect(Unit) {           // key = Unit: MUST NOT restart on new onTimeout
        delay(5_000)
        currentOnTimeout()           // latest handler, even if the parent recomposed
    }
}`,
      },
      {
        t: "list",
        items: [
          "**The decision rule** (the heart of the question): ask 'should this ongoing work *restart* when the value changes?' If **yes** → put the value in the effect's keys (`LaunchedEffect(value)`), which cancels and relaunches. If **no** → use `rememberUpdatedState`, which keeps the work running but feeds it the current value.",
          "Concretely: the auto-logout timer must NOT reset just because the parent passed a new `onTimeout` lambda (that would delay logout forever) → `rememberUpdatedState`. But a data load that IS about `userId` *should* restart when `userId` changes → key it.",
          "Same reasoning applies to any long-lived registration (DisposableEffect capturing a callback): if it shouldn't re-register, wrap the callback in `rememberUpdatedState`.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "Compare LaunchedEffect, SideEffect, and DisposableEffect. When is each correct?",
    a: [
      {
        t: "list",
        items: [
          "**`LaunchedEffect(keys)`** — runs a **coroutine** on enter, cancels on leave, restarts on key change. For anything suspend/async or time-based: loading, collecting flows, animations, delays. Teardown is automatic (cancellation).",
          "**`DisposableEffect(keys)`** — runs a **synchronous setup** on enter and a **required `onDispose`** on leave (and before each key-change re-run). For non-coroutine resources that must be released: listeners, receivers, observers, sensors, third-party subscriptions. Teardown is manual and mandatory.",
          "**`SideEffect { }`** — runs **synchronously after every successful recomposition**, no keys, no cleanup. For pushing a freshly-composed value *out* to non-Compose imperative code that isn't lifecycle-scoped: updating an analytics user property, configuring an external object with the current state. It intentionally has no restart control because it runs every time.",
        ],
      },
      {
        t: "p",
        text: "**The distinguishing questions**: 'Is it a coroutine / async?' → LaunchedEffect. 'Does it register something needing cleanup?' → DisposableEffect. 'Do I just need to publish the latest composed value to imperative code each frame?' → SideEffect. A subtle SideEffect point that shows depth: it runs only on *successful* recomposition (not abandoned ones), which is precisely why it's the safe place to notify external systems — you won't publish a value from a composition that got rolled back.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are snapshotFlow and produceState, and when would you reach for each?",
    a: [
      {
        t: "p",
        text: "**They bridge Compose state and the Flow world in opposite directions.** `produceState` goes *Flow/callback/suspend → Compose State*; `snapshotFlow` goes *Compose State → Flow*.",
      },
      {
        t: "p",
        text: "**`produceState(initial, keys) { }`** launches a coroutine (LaunchedEffect under the hood) and gives you a mutable `value` to set; it returns a `State<T>` the UI reads. Use it to produce *local, screen-scoped* async state without spinning up a ViewModel — e.g. loading an image or a detail object for a small composable: `val result by produceState<Result>(Loading, id) { value = repository.load(id) }`. It also supports `awaitDispose` for cleanup if it wraps a callback source.",
      },
      {
        t: "p",
        text: "**`snapshotFlow { }`** observes the Compose state read inside its lambda and emits a new value into a cold Flow whenever that state changes. You reach for it when you want to apply **Flow operators to Compose state** — the textbook case is debouncing: turn a `query` state or `listState.firstVisibleItemIndex` into a Flow and `.debounce().distinctUntilChanged().collect { }`. It only emits on actual changes (deduped), and being cold, it starts when collected (inside a LaunchedEffect).",
      },
      {
        t: "code",
        title: "snapshotFlow to react to scroll with operators",
        code: `LaunchedEffect(listState) {
    snapshotFlow { listState.firstVisibleItemIndex }
        .distinctUntilChanged()
        .filter { it > 0 }
        .collect { analytics.trackScrolled(it) }
}`,
      },
      {
        t: "p",
        text: "**When NOT to use them**: `produceState` for anything that belongs to business logic or must survive rotation → that's a ViewModel/StateFlow, not a composable-scoped producer. `snapshotFlow` when a simple `derivedStateOf` suffices — snapshotFlow is for when you specifically need *Flow operators* (debounce, buffering, combine); for a plain 'compute boolean from scroll position', `derivedStateOf` is lighter.",
      },
    ],
  },
  {
    level: "senior",
    q: "A composable registers a BroadcastReceiver but it keeps leaking / firing after the screen is gone. Diagnose and fix.",
    a: [
      {
        t: "p",
        text: "**The likely cause**: the receiver was registered in a place with no cleanup — either directly in the composable body (so it re-registers on every recomposition, stacking up dozens of live receivers), or inside a `LaunchedEffect` (which has no teardown hook, so it's registered but never unregistered when the composable leaves). Both leave receivers alive past the screen's lifetime, firing into a dead UI and retaining it in memory.",
      },
      {
        t: "code",
        title: "The correct pattern — DisposableEffect with balanced setup/teardown",
        code: `DisposableEffect(context) {
    val receiver = object : BroadcastReceiver() {
        override fun onReceive(c: Context?, intent: Intent?) {
            viewModel.onConnectivityChanged(/* ... */)
        }
    }
    val filter = IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION)
    ContextCompat.registerReceiver(context, receiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED)

    onDispose {
        context.unregisterReceiver(receiver)   // the fix: guaranteed cleanup
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Why DisposableEffect**: it runs setup exactly on enter (and on key change), and its `onDispose` runs exactly on leave (and before re-running on key change) — so registrations and unregistrations always balance, one-to-one.",
          "**Watch the keys**: keying on something that changes often (like a lambda) would re-register/unregister repeatedly — key on stable values (`context`), and if the receiver needs the latest callback without re-registering, wrap that callback in `rememberUpdatedState`.",
          "**The deeper fix for many cases**: this kind of app-wide signal (connectivity, auth state) is usually better owned by a repository exposing a `Flow`, which the ViewModel observes — then the UI just collects state and no composable touches receivers at all. Mention this: the *most* robust answer moves the effect out of the UI layer entirely.",
          "**Also consider lifecycle**: if the receiver should only be active while the screen is resumed, combine with a `LifecycleEventObserver` (also in a DisposableEffect) or use `Lifecycle.repeatOnLifecycle` semantics rather than composition presence.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "Why is it wrong to launch long-running work (like an upload that must complete) from LaunchedEffect, and where should it go?",
    a: [
      {
        t: "p",
        text: "**The concept**: `LaunchedEffect`'s coroutine is scoped to the *composable's presence in the composition*. The instant the composable leaves — the user navigates away, the screen is popped, a config change disposes and (for some hosts) recreates it — that coroutine is **cancelled**. That lifetime is correct for UI work (an animation, a screen-scoped load) but *wrong* for work that must finish regardless of what the UI does.",
      },
      {
        t: "p",
        text: "**Concretely**: start a file upload in `LaunchedEffect` and the user backs out mid-upload → the upload is cancelled halfway. Even keeping the screen open, a rotation can interrupt it. The UI's lifetime is simply not the work's lifetime.",
      },
      {
        t: "list",
        items: [
          "**Screen-scoped-but-survives-config-change work** → the **ViewModel**, in `viewModelScope`. It survives rotation (the ViewModel outlives the composable) and is cancelled only when the ViewModel is cleared (screen truly gone). Most 'load data for this screen' work belongs here, not in LaunchedEffect — LaunchedEffect should usually just *trigger* a ViewModel function or collect its state.",
          "**Work that must outlive even the screen** (uploads, syncs that should complete after the user leaves) → an **application-scoped `CoroutineScope`** injected into a repository, or an app-level component. It's not tied to any UI lifetime.",
          "**Work that must survive process death / reboot / needs constraints** (guaranteed uploads, periodic sync) → **WorkManager**. It persists across process death and app restarts and enforces constraints (network, charging).",
          "**So what IS LaunchedEffect for**: genuinely UI-lifetime, cancel-when-gone work — animations, collecting the ViewModel's event flow, one-shot 'on appear' triggers that call into the ViewModel. The rule: LaunchedEffect *initiates and observes*; it should rarely *own* important work.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "Should you load screen data in a LaunchedEffect or in the ViewModel? Why?",
    a: [
      {
        t: "p",
        text: "For most screen data, load it in the ViewModel (in `init` or lazily via a `StateFlow` with `WhileSubscribed`), not in a `LaunchedEffect`. The ViewModel survives configuration changes, so the data isn't re-fetched on rotation; a `LaunchedEffect` lives with the composition and is a UI concern. Reserve `LaunchedEffect` for effects that are genuinely tied to the composition's presence or to composable inputs.",
      },
      {
        t: "code",
        title: "ViewModel-driven load vs LaunchedEffect",
        code: `// PREFERRED: ViewModel owns loading; survives rotation, no refetch
class ScreenVM(repo: Repo) : ViewModel() {
    val state = repo.observeData()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), Loading)
}

// LaunchedEffect is right when the effect depends on a composable input:
LaunchedEffect(itemId) { viewModel.load(itemId) }   // re-run when itemId changes`,
      },
      {
        t: "list",
        items: [
          "**ViewModel load** — survives config change (no refetch on rotation), testable without Compose, the single source of truth. Use `stateIn(WhileSubscribed)` so it starts when observed and stops when not.",
          "**`LaunchedEffect`** — right when the trigger is a *composable input* (a passed `id` that changes) or a UI-lifetime concern; but note it *re-runs after process death recreation* and doesn't survive config change, so don't rely on it for expensive one-time fetches.",
          "**Anti-pattern** — `LaunchedEffect(Unit) { viewModel.load() }` to load once: works, but rotation-safe loading belongs in the VM; use this only if the VM truly can't own it.",
        ],
      },
      {
        t: "note",
        text: "Load screen data in the ViewModel (init or stateIn(WhileSubscribed)) — it survives config change, so no refetch on rotation, and it's testable. Use LaunchedEffect when the trigger is a composable input that changes (LaunchedEffect(id)). Avoid LaunchedEffect(Unit) as a poor-man's one-time loader.",
      },
    ],
  },
  {
    level: "senior",
    q: "Does LaunchedEffect re-run on recomposition? On configuration change? When exactly does it restart or cancel?",
    a: [
      {
        t: "p",
        text: "A `LaunchedEffect` launches its coroutine when it enters the composition and *keeps it running across recompositions* as long as its keys are unchanged. It restarts (cancels the old coroutine, launches a new one) only when a key changes, and it cancels when the composable leaves the composition. It does *not* survive a configuration change (the composition is recreated, so the effect launches again).",
      },
      {
        t: "table",
        headers: ["Event", "LaunchedEffect behavior"],
        rows: [
          ["Recomposition (same keys)", "keeps running — does NOT restart"],
          ["A key changes", "cancels old coroutine, launches new one"],
          ["Leaves composition (branch closes, disposed)", "cancels the coroutine"],
          ["Configuration change (rotation)", "composition recreated → effect launches again"],
          ["Process death & restore", "recreated → effect launches again"],
        ],
      },
      {
        t: "list",
        items: [
          "**Recomposition alone doesn't restart it** — that's the whole point of keys; a re-run of the composable body doesn't relaunch the effect.",
          "**Key change = restart** — the previous coroutine is cancelled (cooperatively) and a fresh one starts with the new key values.",
          "**Leaving composition = cancel** — structured concurrency tears the coroutine down.",
          "**Config change = relaunch** — because the composition is destroyed and rebuilt; this is why rotation-sensitive one-time work belongs in the ViewModel.",
        ],
      },
      {
        t: "note",
        text: "LaunchedEffect runs on enter, KEEPS running across recompositions (same keys), restarts on key change (cancels old + launches new), cancels on leaving composition, and relaunches on config change/process-death (composition rebuilt). Recomposition alone never restarts it — that's what keys are for.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you run code exactly once when a composable first appears, and what are the pitfalls?",
    a: [
      {
        t: "p",
        text: "Use `LaunchedEffect(Unit)` (or `LaunchedEffect(true)`) — a constant key means the effect launches once on enter and never restarts due to recomposition. But 'once' is scoped to *this composition instance*: it runs again if the composable leaves and re-enters, and after a configuration change or process-death recreation.",
      },
      {
        t: "code",
        title: "Run-once-on-appear",
        code: `LaunchedEffect(Unit) {          // launches once when this composable enters
    analytics.logScreenView("Home")
}`,
      },
      {
        t: "list",
        items: [
          "**`LaunchedEffect(Unit)`** — one launch per composition entry; won't re-run on recomposition.",
          "**Pitfall 1 — re-entry** — navigating away and back re-enters the composable, running it again. If you need truly-once (per app session/user), track it in the ViewModel.",
          "**Pitfall 2 — config change** — rotation recreates the composition and re-runs the effect. Again, put session-once logic in the VM.",
          "**Pitfall 3 — one-off events** — don't use `LaunchedEffect(Unit)` to consume a state flag as an event; model events as a Flow/Channel instead.",
        ],
      },
      {
        t: "note",
        text: "LaunchedEffect(Unit) runs once per composition entry (not per recomposition) — good for a screen-view log. But it re-runs on re-entry and config change/process death, so 'truly once per session' belongs in the ViewModel. Don't use it to consume event flags — use a Channel/Flow.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you collect a Flow in Compose safely with respect to lifecycle?",
    a: [
      {
        t: "p",
        text: "The safe way is `collectAsStateWithLifecycle()` (from lifecycle-runtime-compose), which collects only while the lifecycle is at least STARTED and stops when the app is backgrounded — avoiding wasted work and updates while off-screen. If you're collecting for a *side effect* (not state), use `LaunchedEffect` + `repeatOnLifecycle(STARTED)`.",
      },
      {
        t: "code",
        title: "Two safe patterns",
        code: `// For STATE the UI reads:
val ui by viewModel.uiState.collectAsStateWithLifecycle()

// For SIDE EFFECTS (events) — collect only while STARTED:
LaunchedEffect(Unit) {
    lifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.events.collect { handle(it) }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`collectAsStateWithLifecycle`** — the default for turning a StateFlow into UI state; lifecycle-aware, pairs with `stateIn(WhileSubscribed)`.",
          "**Plain `collectAsState`** — keeps collecting even in the background (multiplatform-safe but not Android-lifecycle-aware); avoid on Android when the source is hot/expensive.",
          "**`repeatOnLifecycle` in a `LaunchedEffect`** — for collecting events/effects; it re-collects on each STARTED and cancels on STOP, preventing missed/duplicated handling.",
        ],
      },
      {
        t: "note",
        text: "Use collectAsStateWithLifecycle() for UI state (collects only while STARTED, stops when backgrounded, pairs with WhileSubscribed). For side-effect/event collection, LaunchedEffect + repeatOnLifecycle(STARTED). Plain collectAsState keeps running in the background — avoid for hot/expensive Android sources.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you show a snackbar in Compose, and why does it need a coroutine?",
    a: [
      {
        t: "p",
        text: "Snackbars are shown through a `SnackbarHostState`, whose `showSnackbar()` is a *suspend* function — it suspends until the snackbar is dismissed or its action is clicked, returning a `SnackbarResult`. So you call it from a coroutine (a `rememberCoroutineScope` for user actions, or a `LaunchedEffect` collecting events).",
      },
      {
        t: "code",
        title: "Snackbar wiring",
        code: `val snackbarHostState = remember { SnackbarHostState() }
Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { padding ->
    // Trigger from a collected event (recommended):
    LaunchedEffect(Unit) {
        viewModel.messages.collect { msg ->
            val result = snackbarHostState.showSnackbar(msg, actionLabel = "Undo")
            if (result == SnackbarResult.ActionPerformed) viewModel.undo()
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`showSnackbar` suspends** — it waits for dismissal/action, so it must run in a coroutine and it naturally queues (one at a time).",
          "**Drive from events, not state** — showing a snackbar is a one-off event; collect it from a `Channel`/`SharedFlow` in a `LaunchedEffect` rather than reading a UiState flag (which re-shows on rotation).",
          "**Return value** — `SnackbarResult.ActionPerformed` vs `Dismissed` lets you implement 'Undo'.",
        ],
      },
      {
        t: "note",
        text: "Show snackbars via SnackbarHostState.showSnackbar() — a suspend fn that waits for dismissal/action (queues automatically) and returns SnackbarResult (ActionPerformed → Undo). Drive it from an event Flow/Channel in a LaunchedEffect, not a UiState flag (which re-fires on rotation).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you observe Android Lifecycle events (ON_RESUME, ON_PAUSE) from a composable?",
    a: [
      {
        t: "p",
        text: "Add a `LifecycleEventObserver` to the current `LifecycleOwner` inside a `DisposableEffect`, and remove it in `onDispose`. This lets a composable react to `ON_START`/`ON_RESUME`/`ON_PAUSE`/`ON_STOP` — for example, to pause a video, refresh on resume, or start/stop a sensor.",
      },
      {
        t: "code",
        title: "Lifecycle observer in Compose",
        code: `val lifecycleOwner = LocalLifecycleOwner.current
DisposableEffect(lifecycleOwner) {
    val observer = LifecycleEventObserver { _, event ->
        when (event) {
            Lifecycle.Event.ON_RESUME -> player.play()
            Lifecycle.Event.ON_PAUSE  -> player.pause()
            else -> {}
        }
    }
    lifecycleOwner.lifecycle.addObserver(observer)
    onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }  // cleanup!
}`,
      },
      {
        t: "list",
        items: [
          "**`DisposableEffect`** — needed because you must *remove* the observer when the composable leaves (else a leak).",
          "**`LocalLifecycleOwner`** — gives the right lifecycle (Activity/Fragment/nav entry).",
          "**Use cases** — pause/resume media, start/stop location or sensors, refresh-on-resume.",
          "**Reusable helper** — many codebases wrap this in an `OnLifecycleEvent`/`LifecycleResumeEffect` composable (AndroidX now provides `LifecycleResumeEffect`/`LifecycleStartEffect`).",
        ],
      },
      {
        t: "note",
        text: "Observe lifecycle via a LifecycleEventObserver added in DisposableEffect(lifecycleOwner) and removed in onDispose (or use AndroidX LifecycleResumeEffect/LifecycleStartEffect). Get the owner from LocalLifecycleOwner. Classic uses: pause/resume media, start/stop sensors, refresh on resume. DisposableEffect prevents the observer leak.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is SideEffect and when is it the right choice?",
    a: [
      {
        t: "p",
        text: "`SideEffect { }` runs its block *after every successful recomposition* (i.e. when the composition commits). It's for publishing Compose state to *non-Compose* code that needs the latest value on each successful frame — not for coroutines (use `LaunchedEffect`) or setup/teardown (use `DisposableEffect`).",
      },
      {
        t: "code",
        title: "SideEffect publishing to non-Compose code",
        code: `SideEffect {
    // runs after each successful recomposition, with the latest values
    analytics.setCurrentScreen(screenName)          // update a non-Compose singleton
    thirdPartySdk.updateUser(userId)
}`,
      },
      {
        t: "list",
        items: [
          "**Runs on every successful recomposition** — not once; if that's not what you want, use `LaunchedEffect(key)`.",
          "**No cleanup, no coroutine** — it's a synchronous block; for cleanup use `DisposableEffect`, for async use `LaunchedEffect`.",
          "**Only on success** — unlike code in the composable body (which can run during abandoned/failed compositions), `SideEffect` runs only when the composition actually commits — safe for publishing state outward.",
          "**Typical uses** — syncing state into an analytics SDK, a legacy controller, or `View`-world objects each frame.",
        ],
      },
      {
        t: "note",
        text: "SideEffect { } runs after every SUCCESSFUL recomposition (commit) — for pushing Compose state into non-Compose code (analytics SDK, legacy controller) that needs the latest value each frame. Not for coroutines (LaunchedEffect) or cleanup (DisposableEffect). Safer than the body: only runs on committed compositions.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is produceState and when would you use it over LaunchedEffect + mutableStateOf?",
    a: [
      {
        t: "p",
        text: "`produceState` is a convenience that combines `remember { mutableStateOf(initial) }` with a `LaunchedEffect` that populates it — returning a `State<T>` you read directly. It's ideal for converting a non-Compose async source (a suspend call, a callback API) into observable state, with a clean initial value.",
      },
      {
        t: "code",
        title: "produceState",
        code: `@Composable
fun loadUser(id: String): State<Result<User>> = produceState<Result<User>>(
    initialValue = Result.Loading,
    key1 = id,                         // re-launches when id changes
) {
    value = try { Result.Success(api.getUser(id)) } catch (e: Exception) { Result.Error(e) }
    // awaitDispose { } here if you registered a callback that needs cleanup
}`,
      },
      {
        t: "list",
        items: [
          "**= `mutableStateOf` + `LaunchedEffect`** — less boilerplate; you set `value` inside the producer.",
          "**Keyed** — pass keys so it relaunches when inputs change (like LaunchedEffect keys).",
          "**`awaitDispose`** — for callback sources, register in the block and clean up in `awaitDispose { }` (it suspends until the effect leaves).",
          "**When to prefer explicit LaunchedEffect + state** — if you need more control, multiple state values, or to update a ViewModel instead of local state. For screen data, the ViewModel is still usually better; `produceState` shines for local, composable-scoped async values (e.g. loading a bitmap).",
        ],
      },
      {
        t: "note",
        text: "produceState = remember { mutableStateOf(initial) } + LaunchedEffect that sets `value` — a tidy way to turn a suspend/callback source into observable State, keyed to inputs, with awaitDispose for cleanup. Great for composable-scoped async (load a bitmap); for screen data, prefer the ViewModel.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why shouldn't you launch coroutines with GlobalScope or a raw CoroutineScope in a composable?",
    a: [
      {
        t: "p",
        text: "Coroutines started with `GlobalScope` (or a manually created scope) aren't tied to the composition or any lifecycle — they keep running after the composable leaves the screen, leaking work and capturing stale references. Compose gives you scoped alternatives (`LaunchedEffect`, `rememberCoroutineScope`) that cancel automatically when the composable is disposed.",
      },
      {
        t: "list",
        items: [
          "**`GlobalScope`** — app-lifetime; the coroutine outlives the screen, leaking and possibly updating gone UI. Almost never correct.",
          "**Raw `CoroutineScope(...)` in the body** — created anew each recomposition (unless remembered) and never cancelled; leaks.",
          "**Use `LaunchedEffect`** — for work tied to composition presence/keys; cancelled on leave.",
          "**Use `rememberCoroutineScope()`** — for launching from callbacks (button clicks); its scope is cancelled when the composable leaves.",
          "**Use `viewModelScope`** — for work that should survive config change (data loading).",
        ],
      },
      {
        t: "note",
        text: "GlobalScope/raw scopes aren't lifecycle-tied — coroutines outlive the screen, leak, and touch dead UI. Use LaunchedEffect (composition-tied), rememberCoroutineScope() (launch from callbacks, cancels on leave), or viewModelScope (survives config change). Never GlobalScope in UI.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are common mistakes with LaunchedEffect keys?",
    a: [
      {
        t: "p",
        text: "Keys control when a `LaunchedEffect` restarts, so getting them wrong causes either stale effects (missing keys) or thrashing (over-keying). The classic mistakes: omitting a key the effect depends on, passing an unstable/newly-created object as a key, or keying on something that changes every recomposition.",
      },
      {
        t: "list",
        items: [
          "**Missing a dependency** — `LaunchedEffect(Unit) { load(id) }` captures the *first* `id` and never reloads when `id` changes. Fix: `LaunchedEffect(id)`.",
          "**Unstable/new key each recomposition** — passing a freshly-created lambda, list, or object as a key makes the effect restart every recomposition (it's never 'equal'). Fix: key on stable/primitive values, or use `rememberUpdatedState` for callbacks you want fresh *without* restarting.",
          "**Over-keying** — keying on a whole object when only one field matters restarts on unrelated changes. Key on the specific field.",
          "**Using a mutable object as key** — mutating it in place doesn't change equality, so the effect won't restart when you expect.",
        ],
      },
      {
        t: "code",
        title: "Right keys",
        code: `LaunchedEffect(userId) { load(userId) }   // restarts only when userId changes
// For a callback that must stay fresh but not restart the effect:
val current by rememberUpdatedState(onEvent)
LaunchedEffect(Unit) { delay(3000); current() }   // uses latest onEvent, no restart`,
      },
      {
        t: "note",
        text: "Key mistakes: (1) missing a dependency → stale captured value (LaunchedEffect(Unit){load(id)}); (2) unstable/new key each recomposition (lambda/list/object) → constant restarts; (3) over-keying on a whole object; (4) mutable-object keys. Fix: key on the exact stable values; rememberUpdatedState for fresh callbacks without restart.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you trigger a refresh or retry as a side effect when some trigger changes?",
    a: [
      {
        t: "p",
        text: "Key a `LaunchedEffect` on a trigger value (a counter, a query, a retry token). Each time the trigger changes, the effect cancels and relaunches, running your refresh. This is a clean way to turn 'user tapped retry' or 'filter changed' into a re-fetch.",
      },
      {
        t: "code",
        title: "Retry via a keyed effect",
        code: `var retryToken by remember { mutableStateOf(0) }
LaunchedEffect(query, retryToken) {     // relaunch when query OR retryToken changes
    result = repo.search(query)
}
Button(onClick = { retryToken++ }) { Text("Retry") }   // bump token -> effect reruns`,
      },
      {
        t: "list",
        items: [
          "**Key on the trigger** — changing the key (a token counter, or the query) restarts the effect, re-running the fetch.",
          "**Retry token pattern** — increment an Int to force a re-run even when other inputs are unchanged.",
          "**Often better in the VM** — for data, expose a `refresh()` on the ViewModel that re-emits; the UI stays declarative. Use the keyed-effect approach for composable-local async.",
        ],
      },
      {
        t: "note",
        text: "Key a LaunchedEffect on the trigger (query, or a retryToken Int you increment) — changing the key cancels + relaunches the effect, re-running the fetch. The retry-token bump forces a rerun with unchanged inputs. For screen data, a ViewModel refresh() is usually cleaner than a UI-side keyed effect.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you request a runtime permission or launch an activity-for-result from Compose?",
    a: [
      {
        t: "p",
        text: "Use `rememberLauncherForActivityResult` with an `ActivityResultContract`. It returns a launcher you call (from a click handler or an effect) to start the request; the result comes back in the callback. For permissions specifically, Accompanist/`rememberPermissionState` wraps this with permission status.",
      },
      {
        t: "code",
        title: "Permission and activity result launchers",
        code: `val cameraPermission = rememberLauncherForActivityResult(
    ActivityResultContracts.RequestPermission()
) { granted -> if (granted) openCamera() else showRationale() }

Button(onClick = { cameraPermission.launch(Manifest.permission.CAMERA) }) { Text("Scan") }

// Pick an image:
val pickImage = rememberLauncherForActivityResult(
    ActivityResultContracts.GetContent()
) { uri -> uri?.let { viewModel.onImagePicked(it) } }
// pickImage.launch("image/*")`,
      },
      {
        t: "list",
        items: [
          "**`rememberLauncherForActivityResult`** — the Compose-friendly wrapper over the Activity Result API; survives recomposition.",
          "**Launch from a callback/effect** — call `launcher.launch(input)` in `onClick` (or a `LaunchedEffect` for auto-request).",
          "**Permissions** — `RequestPermission`/`RequestMultiplePermissions` contracts, or Accompanist's `rememberPermissionState`/`rememberMultiplePermissionsState` for status + rationale handling.",
          "**Don't call `launch` during composition** — only from effects/callbacks; calling it in the body would fire every recomposition.",
        ],
      },
      {
        t: "note",
        text: "Use rememberLauncherForActivityResult(contract) { result -> } and call launcher.launch(input) from a click/effect — never in the composable body. Permissions: RequestPermission/RequestMultiplePermissions contracts, or Accompanist rememberPermissionState for status + rationale. It's the Compose wrapper over the Activity Result API.",
      },
    ],
  },
  {
    level: "senior",
    q: "What dispatcher does LaunchedEffect run on, and what is withFrameNanos?",
    a: [
      {
        t: "p",
        text: "A `LaunchedEffect` coroutine runs on the composition's `CoroutineContext`, whose dispatcher is `AndroidUiDispatcher.Main` — it dispatches work aligned with the Choreographer frame, on the main thread. So effect code runs on the main thread by default; move blocking/CPU work off it with `withContext(Dispatchers.IO/Default)`. `withFrameNanos` suspends until the next frame and gives you its timestamp — the basis of Compose animations.",
      },
      {
        t: "list",
        items: [
          "**Main-thread by default** — `LaunchedEffect` uses `AndroidUiDispatcher.Main`; safe to touch state/UI, but offload heavy work with `withContext`.",
          "**Frame-aligned** — the UI dispatcher batches with the frame, so state written in effects is applied efficiently per frame.",
          "**`withFrameNanos { frameTime -> }`** — suspends until the next display frame, returning its time in nanos; animation clocks (`Animatable`, `animate*AsState`) are built on it to advance per frame.",
          "**Implication** — you can hand-roll frame-perfect animations with a `while (true) { withFrameNanos { ... } }` loop, though the animation APIs usually do this for you.",
        ],
      },
      {
        t: "note",
        text: "LaunchedEffect runs on AndroidUiDispatcher.Main (main thread, frame-aligned) — safe for state but offload heavy work with withContext(IO/Default). withFrameNanos suspends until the next frame and returns its timestamp; it's the primitive under Compose animations (per-frame advancement).",
      },
    ],
  },
  {
    level: "junior",
    q: "Why is remember { } wrong for running work, and how does it differ from LaunchedEffect?",
    a: [
      {
        t: "p",
        text: "`remember { }` is for *caching a value* across recompositions — its block runs during composition to compute something, and it must be side-effect-free. `LaunchedEffect` is for *running side effects* (coroutines) tied to the composition lifecycle. Putting a network call or a coroutine launch in `remember` runs it during composition (which can happen unexpectedly, be abandoned, or run on the wrong thread) and isn't lifecycle-managed.",
      },
      {
        t: "code",
        title: "Wrong vs right",
        code: `// WRONG: side effect during composition, not lifecycle-aware, may be abandoned
val data = remember { repo.blockingLoad() }     // runs in composition; blocks; no cancel

// RIGHT: value caching only
val formatter = remember { DateFormatter(locale) }   // pure computation, cached

// RIGHT: side effect
LaunchedEffect(id) { data = repo.load(id) }          // coroutine, cancellable, lifecycle-tied`,
      },
      {
        t: "list",
        items: [
          "**`remember`** — compute-and-cache a value; the block should be pure (no I/O, no launching coroutines).",
          "**`LaunchedEffect`** — perform side effects; lifecycle-managed and cancellable.",
          "**Why it matters** — composition can run, be skipped, or be abandoned; work in `remember` inherits that unpredictability and runs on the composition thread.",
        ],
      },
      {
        t: "note",
        text: "remember { } caches a PURE computed value across recompositions; its block must be side-effect-free. LaunchedEffect runs SIDE EFFECTS (coroutines), lifecycle-tied and cancellable. Doing I/O or launching in remember runs it during composition — unpredictable, uncancellable, wrong thread.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle the system back press from a composable?",
    a: [
      {
        t: "p",
        text: "Use the `BackHandler(enabled) { }` composable — it registers an `OnBackPressedCallback` tied to the composition, intercepting back while `enabled` is true. Use it to close a drawer, dismiss a custom sheet, confirm unsaved changes, or implement custom back navigation. It's effectively a lifecycle-scoped effect for the back button.",
      },
      {
        t: "code",
        title: "BackHandler",
        code: `var showDialog by remember { mutableStateOf(false) }
BackHandler(enabled = hasUnsavedChanges) {
    showDialog = true        // intercept back to confirm, instead of leaving
}
// Or close a drawer on back:
BackHandler(enabled = drawerState.isOpen) { scope.launch { drawerState.close() } }`,
      },
      {
        t: "list",
        items: [
          "**`enabled` gates it** — when false, back behaves normally (navigates/exits). Toggle it based on state (drawer open, unsaved edits).",
          "**Composition-scoped** — the callback is added/removed with the composable automatically (no manual cleanup).",
          "**Order** — multiple enabled `BackHandler`s: the innermost (most recently composed) wins, like a stack.",
          "**Predictive back** — for the newer predictive-back animations, use `PredictiveBackHandler` to react to the in-progress gesture.",
        ],
      },
      {
        t: "note",
        text: "BackHandler(enabled) { } intercepts the back press while enabled — for closing drawers/sheets, confirming unsaved changes, or custom back nav. It's composition-scoped (auto add/remove), innermost enabled handler wins. Use PredictiveBackHandler for predictive-back gesture animations.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you run periodic work like a ticking clock or countdown in Compose?",
    a: [
      {
        t: "p",
        text: "Put a loop with `delay` inside a `LaunchedEffect`, writing to state each tick. Because the effect is cancelled when the composable leaves, the loop stops automatically — no leak. Key the effect if the interval or target should reset it.",
      },
      {
        t: "code",
        title: "A countdown timer",
        code: `var secondsLeft by remember { mutableIntStateOf(60) }
LaunchedEffect(Unit) {
    while (secondsLeft > 0) {
        delay(1000)
        secondsLeft--
    }
    onFinished()
}
Text("\$secondsLeft s")`,
      },
      {
        t: "list",
        items: [
          "**`while + delay` in `LaunchedEffect`** — the coroutine ticks and updates state; cancelled on leave, so it stops cleanly.",
          "**For a clock** — read `System.currentTimeMillis()` each tick, or use `withFrameNanos` for frame-accurate animation timing.",
          "**Lifecycle-pause** — wrap in `repeatOnLifecycle(STARTED)` if you want the timer to pause when backgrounded.",
          "**Prefer the VM for logic that must survive rotation** — a countdown that shouldn't reset on rotation belongs in the ViewModel; the UI just displays it.",
        ],
      },
      {
        t: "note",
        text: "Ticking work = while + delay inside LaunchedEffect, updating state each tick; it auto-cancels on leave (no leak). Use repeatOnLifecycle(STARTED) to pause when backgrounded, withFrameNanos for frame-accurate timing. If it must survive rotation, run it in the ViewModel and just display the state.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you bridge a callback-based API (like location updates) into Compose state?",
    a: [
      {
        t: "p",
        text: "You register the callback when the composable enters and unregister when it leaves — either with `DisposableEffect` (writing into `mutableStateOf`) or `produceState` (with `awaitDispose`). For a stream you'll transform, wrap the callback in a `callbackFlow` in the data layer and collect it; for a purely UI-scoped listener, `DisposableEffect`/`produceState` is fine.",
      },
      {
        t: "code",
        title: "Callback → state with cleanup",
        code: `val location by produceState<Location?>(initialValue = null) {
    val listener = LocationListener { value = it }
    locationManager.requestUpdates(listener)
    awaitDispose { locationManager.removeUpdates(listener) }   // cleanup on leave
}

// Or DisposableEffect:
DisposableEffect(Unit) {
    val l = LocationListener { current = it }
    locationManager.requestUpdates(l)
    onDispose { locationManager.removeUpdates(l) }
}`,
      },
      {
        t: "list",
        items: [
          "**`produceState` + `awaitDispose`** — register in the block, write `value` from the callback, unregister in `awaitDispose`.",
          "**`DisposableEffect` + `onDispose`** — same idea if you're writing to your own `mutableStateOf`.",
          "**`callbackFlow`** — the cleaner data-layer approach: wrap the callback as a Flow (`awaitClose { }` for cleanup), expose it, and collect with `collectAsStateWithLifecycle`. Preferred when the source is shared or needs operators.",
          "**Always unregister** — the whole point is that the effect's disposal removes the listener, preventing leaks and callbacks into dead UI.",
        ],
      },
      {
        t: "note",
        text: "Bridge callbacks via produceState + awaitDispose or DisposableEffect + onDispose — register on enter, write state from the callback, unregister on leave (no leak). For shared/streamed sources, wrap in a data-layer callbackFlow (awaitClose cleanup) and collectAsStateWithLifecycle. The disposal removing the listener is the key.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you decide what to pass as keys to LaunchedEffect or DisposableEffect?",
    a: [
      {
        t: "p",
        text: "Pass as keys every value the effect *depends on* whose change should restart the effect — and nothing that shouldn't. The mental test: 'if this value changes, do I want the effect to cancel and start over?' If yes, it's a key; if no (you just want the latest value without restarting), use `rememberUpdatedState` instead.",
      },
      {
        t: "list",
        items: [
          "**Include restart-worthy dependencies** — the `id` you're loading, the `query` you're searching, the interval a timer uses. Changing them should re-run the effect.",
          "**Exclude 'latest value' callbacks** — an `onTimeout` lambda you want current but that shouldn't restart the timer: capture with `rememberUpdatedState`, key on `Unit`.",
          "**Use stable/primitive keys** — Strings, Ints, stable data; avoid freshly-allocated lambdas/lists (never equal → constant restarts).",
          "**`Unit`/`true`** — deliberately 'run once and never restart'; make sure that's really the intent (it captures initial values).",
          "**Match to lifetime** — `DisposableEffect` keys decide when the listener is torn down and re-registered; over-keying causes churny register/unregister cycles.",
        ],
      },
      {
        t: "note",
        text: "Key on every dependency whose change SHOULD restart the effect ('if this changes, redo the work?') — id/query/interval. For 'want the latest value but don't restart' (callbacks), use rememberUpdatedState + Unit key. Keys must be stable/primitive (fresh lambdas/lists restart every recomposition). Unit = run-once, captures initial values.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you debounce fast-changing Compose state (like a text field) using snapshotFlow?",
    a: [
      {
        t: "p",
        text: "`snapshotFlow { }` converts snapshot state into a cold Flow that emits when the read state changes, so you can apply Flow operators like `debounce` to it inside a `LaunchedEffect` — debouncing a search on the UI side without pushing raw keystrokes anywhere. (In MVVM, you'd usually debounce in the ViewModel's Flow instead, but `snapshotFlow` is the composable-side tool.)",
      },
      {
        t: "code",
        title: "snapshotFlow debounce",
        code: `var text by remember { mutableStateOf("") }
LaunchedEffect(Unit) {
    snapshotFlow { text }              // emits on each text change
        .debounce(300)                 // wait for a typing pause
        .distinctUntilChanged()
        .collect { q -> onSearch(q) }  // fires only after the pause
}
TextField(value = text, onValueChange = { text = it })`,
      },
      {
        t: "list",
        items: [
          "**`snapshotFlow { text }`** — bridges Compose state → Flow; the block re-reads on change and emits distinct values.",
          "**Apply operators** — `debounce`, `filter`, `mapLatest` work as on any Flow, inside the `LaunchedEffect`.",
          "**Stays alive with the composable** — the collection is scoped to the effect, cancelled on leave.",
          "**Prefer VM for real search** — a shared/testable search flow belongs in the ViewModel; use `snapshotFlow` when the state genuinely lives in the composable.",
        ],
      },
      {
        t: "note",
        text: "snapshotFlow { state } turns Compose state into a Flow so you can debounce/filter it inside a LaunchedEffect (scoped, cancels on leave). Good for composable-side debouncing of a text field. For shared/testable search logic, debounce in the ViewModel's Flow instead.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between LaunchedEffect and rememberCoroutineScope in practice?",
    a: [
      {
        t: "p",
        text: "Both give you a composition-scoped coroutine, but the trigger differs: `LaunchedEffect` launches *automatically* when it enters composition (or a key changes), while `rememberCoroutineScope()` gives you a scope to launch from *imperatively* — inside a callback like `onClick`. Use `LaunchedEffect` for effects driven by state/entering; use `rememberCoroutineScope` for effects driven by user events.",
      },
      {
        t: "code",
        title: "Event-driven vs entry-driven",
        code: `// Entry/state driven -> LaunchedEffect
LaunchedEffect(itemId) { data = repo.load(itemId) }

// User-event driven -> rememberCoroutineScope
val scope = rememberCoroutineScope()
Button(onClick = {
    scope.launch { snackbarHostState.showSnackbar("Saved") }   // launch on click
}) { Text("Save") }`,
      },
      {
        t: "list",
        items: [
          "**`LaunchedEffect`** — you can't call `launch` inside `onClick` from it; it's for automatic, keyed effects.",
          "**`rememberCoroutineScope`** — returns a `CoroutineScope` tied to the composition; call `scope.launch { }` from callbacks. Cancelled when the composable leaves.",
          "**Don't create your own scope** — `rememberCoroutineScope` gives the correctly-cancelled one.",
        ],
      },
      {
        t: "note",
        text: "LaunchedEffect launches automatically on enter/key-change (state-driven); rememberCoroutineScope() gives a composition-scoped CoroutineScope to launch from callbacks like onClick (event-driven). You can't launch from a click inside a LaunchedEffect — use the scope. Both cancel on leave.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the correct way to consume one-time events so they don't re-fire on rotation?",
    a: [
      {
        t: "p",
        text: "Deliver one-time events (navigate, snackbar, toast) through a `Channel` exposed as a `Flow` (or a `SharedFlow` with `replay = 0`), and collect them in a lifecycle-aware effect. Because a `Channel` delivers each item exactly once to a single collector, rotation (which re-collects) won't replay past events — unlike a state flag, which is re-read after recreation and re-fires.",
      },
      {
        t: "code",
        title: "Channel-based events, collected safely",
        code: `// ViewModel
private val _events = Channel<UiEvent>()
val events = _events.receiveAsFlow()
fun onDone() { viewModelScope.launch { _events.send(UiEvent.NavigateBack) } }

// UI
LaunchedEffect(Unit) {
    lifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.events.collect { e -> when (e) { is NavigateBack -> nav.popBackStack() } }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Why not a state flag** — `uiState.navigate = true` is re-read after rotation/process death and navigates again; you'd have to reset it immediately, which is fragile.",
          "**`Channel.receiveAsFlow()`** — exactly-once delivery to one collector; buffered so events aren't lost if briefly no collector.",
          "**`SharedFlow(replay = 0)`** — an alternative, but events can drop if emitted with no active collector; a `Channel` is safer for guaranteed handling.",
          "**Collect with `repeatOnLifecycle`/`collectAsStateWithLifecycle` semantics** — so you don't handle events while the UI is stopped.",
        ],
      },
      {
        t: "note",
        text: "Emit one-time events via a Channel.receiveAsFlow() (exactly-once, buffered) and collect with repeatOnLifecycle(STARTED) — rotation re-collects but won't replay past events. A UiState flag re-fires after recreation (must reset, fragile). SharedFlow(replay=0) works but can drop with no collector; Channel is safer.",
      },
    ],
  },
];

export default qa;
