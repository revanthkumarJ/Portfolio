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
];

export default qa;
