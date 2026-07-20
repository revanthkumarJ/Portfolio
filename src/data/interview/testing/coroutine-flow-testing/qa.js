// Coroutine & Flow Testing — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "How do you test coroutines? What does runTest do?",
    a: [
      {
        t: "p",
        text: "**You test coroutines with `runTest`, which runs your suspend code in a controlled test scope with *virtual time* — so `delay`s complete instantly instead of actually waiting, making async tests fast and deterministic.** It provides a `TestScope` with a test dispatcher and a virtual clock.",
      },
      {
        t: "code",
        title: "A coroutine test",
        code: `@Test fun test() = runTest {
    val vm = MyViewModel(fakeRepo)
    vm.load()
    advanceUntilIdle()               // run all pending coroutines
    assertEquals(expected, vm.state.value)
}`,
      },
      {
        t: "list",
        items: [
          "**Virtual time** — a `delay(1000)` inside the code under test completes *instantly* because `runTest` advances a fake clock rather than waiting a real second. So testing a debounce or a timeout takes microseconds, not real time.",
          "**Control functions** — `advanceUntilIdle()` runs all pending coroutines to completion; `advanceTimeBy(ms)` moves the virtual clock forward (running tasks scheduled up to then, useful for debounce); `runCurrent()` runs tasks scheduled at the current moment.",
          "**Deterministic** — because the scheduler runs tasks in a controlled order with no real threads racing, async tests are as reliable as synchronous ones.",
        ],
      },
      {
        t: "p",
        text: "The old way (`runBlockingTest`, `TestCoroutineDispatcher`) is deprecated; `runTest` is the modern API. The key mental shift is that you're not *waiting* for async work — you're *controlling* time explicitly, advancing the clock and running scheduled tasks when you choose, which is what makes coroutine tests both fast and precise.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why do you need Dispatchers.setMain when testing a ViewModel?",
    a: [
      {
        t: "p",
        text: "**Because `viewModelScope` uses `Dispatchers.Main`, and `Dispatchers.Main` doesn't exist on the JVM where unit tests run — it's provided by the Android UI thread, which isn't present in a local test.** So a ViewModel that launches a coroutine in `viewModelScope` throws 'Module with the Main dispatcher had failed to initialize' in a plain JVM test. `Dispatchers.setMain(testDispatcher)` substitutes a controllable test dispatcher for `Main` so the ViewModel's coroutines can run under the test's control.",
      },
      {
        t: "code",
        title: "MainDispatcherRule",
        code: `class MainDispatcherRule(
    private val d: TestDispatcher = UnconfinedTestDispatcher(),
) : TestWatcher() {
    override fun starting(desc: Description) = Dispatchers.setMain(d)
    override fun finished(desc: Description) = Dispatchers.resetMain()
}

@get:Rule val mainDispatcherRule = MainDispatcherRule()`,
      },
      {
        t: "p",
        text: "You typically wrap this in a reusable `MainDispatcherRule` (a JUnit `TestWatcher`) that calls `setMain` before each test and `resetMain` after — standard ViewModel-test infrastructure you write once. This is *the* reason a ViewModel test needs setup beyond just constructing the ViewModel: without it, anything launched in `viewModelScope` fails immediately. It also has a bonus — by setting Main to a `TestDispatcher`, the ViewModel's `viewModelScope` coroutines now run on the controllable test scheduler with virtual time, so you can advance the clock and assert states deterministically.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you test a Flow?",
    a: [
      {
        t: "p",
        text: "**The cleanest way is the Turbine library: `flow.test { }` collects the flow and gives you `awaitItem()` to assert each emission in order, `awaitComplete()` for completion, and `awaitError()` for exceptions — all inside `runTest` so you have virtual time.**",
      },
      {
        t: "code",
        title: "Turbine test",
        code: `@Test fun test() = runTest {
    viewModel.uiState.test {
        assertEquals(UiState.Loading, awaitItem())
        viewModel.load()
        assertEquals(UiState.Content(data), awaitItem())
        cancelAndIgnoreRemainingEvents()
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`flow.test { }`** starts collecting; `awaitItem()` returns the next emitted value, `awaitComplete()`/`awaitError()`/`expectNoEvents()` assert completion, error, or silence. Turbine fails the test if emissions are left unconsumed, catching accidental over-emission.",
          "**Combine with virtual time** for operators like `debounce` — `advanceTimeBy(300)` inside the `test { }` block to skip the debounce deterministically.",
          "You *can* test flows without Turbine (collect into a list with `toList()` for finite flows, or launch a collector), but Turbine's await-based API is far cleaner for the typical 'assert these emissions in order' case.",
        ],
      },
      {
        t: "p",
        text: "One important gotcha: a `StateFlow` produced with `stateIn(WhileSubscribed(...))` is *cold until collected* — it does nothing until someone subscribes. So if you construct a ViewModel and immediately assert `uiState.value`, you'll only see the `initialValue`. Using Turbine's `.test { }` subscribes to the flow, which triggers the upstream to actually run and emit — so you must collect it (via Turbine or a `backgroundScope.launch { collect() }`) before you can observe real emissions.",
      },
    ],
  },
  {
    level: "senior",
    q: "What's the difference between StandardTestDispatcher and UnconfinedTestDispatcher, and when do you use each?",
    a: [
      {
        t: "p",
        text: "**They differ in *when* launched coroutines execute. `StandardTestDispatcher` *queues* coroutines — they don't run until you explicitly advance time (`advanceUntilIdle`/`runCurrent`), giving you precise step-by-step control. `UnconfinedTestDispatcher` runs coroutines *eagerly* — immediately, until they suspend — which is simpler but gives up fine control.** The choice affects what you can observe in a test.",
      },
      {
        t: "list",
        items: [
          "**`StandardTestDispatcher`** (the `runTest` default): launched coroutines are *scheduled but not run* until you advance the virtual clock. This lets you assert *intermediate states* and *exact ordering* — for example, verifying that a ViewModel emits `Loading` *before* it emits `Content`. You control execution: launch the operation, assert the loading state, then `advanceUntilIdle()` to let it complete, then assert the final state. Use it when the *transient states or ordering* matter.",
          "**`UnconfinedTestDispatcher`**: launched coroutines run *eagerly and immediately* until their first suspension point, without you advancing anything. This is simpler — the code 'just runs' — but you may *miss intermediate states* because they've already transitioned by the time your assertion runs. For instance, by the time you check, the state may already be `Content` and you never saw `Loading`. Use it for tests where you only care about the *final outcome*.",
        ],
      },
      {
        t: "list",
        items: [
          "**How to choose**: if your test needs to verify a *sequence* of states (Loading → Content, or that something happens before something else), use `StandardTestDispatcher` and step through with `advance*`. If you just want to run everything and assert the end result, `UnconfinedTestDispatcher` is simpler and less error-prone (no forgetting to advance). Many ViewModel tests use Unconfined for the `MainDispatcherRule` for simplicity, switching to Standard for the specific tests that assert intermediate states.",
          "**A subtle trap with Standard**: because coroutines don't run until you advance, forgetting to call `advanceUntilIdle()`/`runCurrent()` means your assertion runs *before the code executed* — the test sees the initial state and may pass or fail misleadingly. With Standard you must remember to advance; with Unconfined you don't (but lose control). Understanding this trade-off is what prevents confusing test failures.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the two dispatchers represent a control-vs-simplicity trade-off in async testing. `StandardTestDispatcher` gives you a 'single-stepping debugger' for coroutines — nothing runs until you say so, so you can observe every intermediate state and ordering, at the cost of having to drive execution explicitly. `UnconfinedTestDispatcher` is 'run it all and check the result' — simpler, but blind to transient states. The mature approach is to default to whichever fits the test's needs: Unconfined when asserting final state (most tests), Standard when the *timeline* of states or ordering is what you're verifying. Knowing that Standard requires explicit advancing (and that forgetting to advance is a common source of confusing failures) is the practical depth that distinguishes someone who's actually written coroutine tests.",
      },
    ],
  },
  {
    level: "senior",
    q: "Walk through testing a ViewModel that has a debounced search with stateIn(WhileSubscribed). What are the pitfalls?",
    a: [
      {
        t: "p",
        text: "**This combines all the coroutine-testing challenges: the Main dispatcher, virtual time for the debounce, and the cold-until-collected nature of `stateIn(WhileSubscribed)`. The test must set up the Main dispatcher, collect the flow to trigger it, and advance virtual time past the debounce — miss any of these and the test fails misleadingly.**",
      },
      {
        t: "code",
        title: "The complete test",
        code: `@get:Rule val mainDispatcherRule = MainDispatcherRule(StandardTestDispatcher())

@Test fun search_debouncesAndEmitsResults() = runTest {
    val repo = FakeSearchRepository(results = mapOf("kotlin" to listOf(item)))
    val viewModel = SearchViewModel(repo)   // uses viewModelScope + stateIn(WhileSubscribed)

    viewModel.uiState.test {                 // MUST collect — triggers the cold stateIn
        assertEquals(SearchState.Empty, awaitItem())   // initialValue

        viewModel.onQueryChange("kotlin")
        advanceTimeBy(300)                    // skip the debounce via virtual time
        runCurrent()

        assertEquals(SearchState.Loading, awaitItem())
        assertEquals(SearchState.Results(listOf(item)), awaitItem())
        cancelAndIgnoreRemainingEvents()
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Pitfall 1 — the Main dispatcher**: `viewModelScope` uses `Dispatchers.Main`, absent on the JVM, so you need `Dispatchers.setMain(testDispatcher)` via the `MainDispatcherRule`. Without it, the test throws immediately on any `viewModelScope.launch`.",
          "**Pitfall 2 — cold `stateIn(WhileSubscribed)`**: this is the big one. `WhileSubscribed` makes the flow *cold until collected* — it does nothing until a subscriber appears. So if you assert `viewModel.uiState.value` right after construction, you *only ever see the `initialValue`* (`Empty`), never the real emissions — the upstream never started because nothing subscribed. You *must* collect the flow (Turbine's `.test { }` subscribes, triggering the upstream) or launch a collector in `backgroundScope`. This trips up almost everyone the first time — the test 'passes' or 'fails' based on initialValue and you can't figure out why real values never appear.",
          "**Pitfall 3 — virtual time for debounce**: the `debounce(300)` won't emit until 300ms of silence. In a test you *advance virtual time* (`advanceTimeBy(300)` then `runCurrent()`) to skip past it deterministically — you never actually wait. Forgetting to advance means the debounced value never emits and `awaitItem()` times out.",
          "**Pitfall 4 — dispatcher choice for intermediate states**: to assert Loading *then* Results, use `StandardTestDispatcher` (so you can control the stepping); with Unconfined you might skip past Loading. And ensure the repository/flow uses *injected* dispatchers so they run on the test scheduler, not a hardcoded `Dispatchers.IO` that escapes virtual time.",
          "**Pitfall 5 — injected dispatchers**: if the ViewModel or repository hardcodes `Dispatchers.IO`, that work runs on real threads outside the test's control, breaking virtual time and determinism. Dispatchers must be injected so the test substitutes a `TestDispatcher`.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: this scenario is a favorite because it requires understanding *all* the coroutine-testing machinery working together — the Main dispatcher substitution (for `viewModelScope`), virtual time control (for `debounce`), the cold-until-collected behavior of `stateIn(WhileSubscribed)` (must subscribe to trigger it), the Standard-vs-Unconfined choice (to observe intermediate states), and injected dispatchers (so everything runs on the test scheduler). The single most common and confusing failure is the `stateIn(WhileSubscribed)` one — 'why does my ViewModel only ever emit the initial value?' — and knowing the answer (it's cold, you must collect it to start the upstream) is the tell that someone has genuinely tested modern ViewModels rather than just read about it. Being able to enumerate these pitfalls and their fixes demonstrates real, hands-on coroutine-testing competence.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the TestScope and testScheduler in runTest?",
    a: [
      {
        t: "p",
        text: "`runTest { }` runs the test body in a `TestScope` backed by a `TestCoroutineScheduler` (the *virtual clock*). The scheduler controls time — `delay` doesn't wait real time; it advances virtually. You share this `testScheduler` with any test dispatchers so all coroutines run on the same virtual clock, making the test deterministic. `this.testScheduler` (or `testScheduler` in the scope) exposes it.",
      },
      {
        t: "list",
        items: [
          "**`TestScope`** — the coroutine scope for the test body.",
          "**`TestCoroutineScheduler`** — the virtual clock.",
          "**Share the scheduler** — with test dispatchers.",
          "**Deterministic** — all coroutines on one virtual clock.",
        ],
      },
      {
        t: "note",
        text: "runTest runs in a TestScope backed by a TestCoroutineScheduler (virtual clock — delay advances virtually, not real time). Share this testScheduler with your test dispatchers so all coroutines run on the same clock, making tests deterministic. Access via testScheduler in the scope.",
      },
    ],
  },
  {
    level: "junior",
    q: "What do advanceUntilIdle, advanceTimeBy, and runCurrent do?",
    a: [
      {
        t: "p",
        text: "These drive the virtual clock in `runTest`: `advanceUntilIdle()` runs *all* scheduled coroutines until nothing is left to do (the common choice to 'let everything finish'); `advanceTimeBy(ms)` advances the clock by a duration (running work scheduled within it — for testing `delay`/`debounce` at specific points); `runCurrent()` runs work scheduled at the *current* time without advancing. They give precise control over coroutine execution.",
      },
      {
        t: "list",
        items: [
          "**`advanceUntilIdle()`** — run everything to completion.",
          "**`advanceTimeBy(ms)`** — advance the clock (test delays/debounce).",
          "**`runCurrent()`** — run current-time work without advancing.",
          "**Precise control** — over coroutine execution.",
        ],
      },
      {
        t: "note",
        text: "In runTest: advanceUntilIdle() runs all scheduled coroutines to completion ('let everything finish'); advanceTimeBy(ms) advances the virtual clock (test delay/debounce at specific points); runCurrent() runs current-time work without advancing. Precise control over coroutine execution and timing.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does the MainDispatcherRule work, and why do you need it?",
    a: [
      {
        t: "p",
        text: "`Dispatchers.Main` requires the Android UI looper, which doesn't exist in JVM unit tests — so any code using `viewModelScope` (which uses `Main.immediate`) throws. A `MainDispatcherRule` (a JUnit rule) calls `Dispatchers.setMain(testDispatcher)` before each test and `resetMain()` after — replacing Main with a test dispatcher so ViewModel coroutines run on the virtual clock. It's boilerplate you write once and reuse.",
      },
      {
        t: "code",
        title: "MainDispatcherRule",
        code: `class MainDispatcherRule(val dispatcher: TestDispatcher = UnconfinedTestDispatcher()) : TestWatcher() {
    override fun starting(d: Description) = Dispatchers.setMain(dispatcher)
    override fun finished(d: Description) = Dispatchers.resetMain()
}`,
      },
      {
        t: "list",
        items: [
          "**`Dispatchers.Main` needs a looper** — absent in JVM tests.",
          "**`setMain(testDispatcher)`/`resetMain()`** — swap it.",
          "**Rule** — applies before/after each test.",
          "**Enables** — viewModelScope on the virtual clock.",
        ],
      },
      {
        t: "note",
        text: "Dispatchers.Main needs the Android looper (absent in JVM tests), so viewModelScope code throws. A MainDispatcherRule (JUnit TestWatcher) calls Dispatchers.setMain(testDispatcher) before each test and resetMain() after — swapping Main for a test dispatcher so ViewModel coroutines run on the virtual clock. Write once, reuse.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a Flow with Turbine?",
    a: [
      {
        t: "p",
        text: "Turbine's `flow.test { }` collects the flow and lets you assert emissions one at a time: `awaitItem()` (next value), `awaitError()` (an error), `awaitComplete()` (completion), and `expectNoEvents()`. It's ideal for hot/infinite flows (which `toList()` can't handle) and for asserting *sequences* of emissions interactively. End with `cancelAndIgnoreRemainingEvents()`.",
      },
      {
        t: "code",
        title: "Turbine",
        code: `viewModel.uiState.test {
    assertThat(awaitItem()).isEqualTo(UiState.Loading)
    viewModel.load()
    assertThat(awaitItem()).isEqualTo(UiState.Content(data))
    cancelAndIgnoreRemainingEvents()
}`,
      },
      {
        t: "list",
        items: [
          "**`flow.test { }`** — collect and assert emissions.",
          "**`awaitItem`/`awaitError`/`awaitComplete`** — sequence assertions.",
          "**Hot/infinite flows** — where `toList()` hangs.",
          "**`cancelAndIgnoreRemainingEvents()`** — end cleanly.",
        ],
      },
      {
        t: "note",
        text: "Turbine's flow.test { } collects a flow and asserts emissions one at a time: awaitItem (next), awaitError, awaitComplete, expectNoEvents. Ideal for hot/infinite flows (toList hangs) and asserting emission sequences interactively. End with cancelAndIgnoreRemainingEvents().",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a StateFlow-based ViewModel's state sequence?",
    a: [
      {
        t: "p",
        text: "With a `MainDispatcherRule`, inject a fake repository, and assert the `StateFlow` — either read `.value` after `advanceUntilIdle()` (final state) or use Turbine's `test { }` to assert the sequence (Loading → Content). For `stateIn(WhileSubscribed)` flows, the upstream only starts with an active collector, so Turbine's collection (or reading `.value`) activates it. Drive actions between assertions to test transitions.",
      },
      {
        t: "code",
        title: "State sequence test",
        code: `@Test fun loadsContent() = runTest {
    val vm = MyViewModel(FakeRepo(data))
    vm.state.test {
        assertThat(awaitItem()).isEqualTo(UiState.Loading)
        assertThat(awaitItem()).isEqualTo(UiState.Content(data))
        cancelAndIgnoreRemainingEvents()
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`MainDispatcherRule` + fake repo** — setup.",
          "**Turbine sequence** — Loading → Content.",
          "**Or `.value`** — after `advanceUntilIdle` (final).",
          "**`WhileSubscribed`** — needs an active collector to start.",
        ],
      },
      {
        t: "note",
        text: "Test StateFlow ViewModels with a MainDispatcherRule + fake repo: assert .value after advanceUntilIdle (final state) or Turbine's test { } for the sequence (Loading → Content). WhileSubscribed upstream needs an active collector — Turbine/reading .value activates it. Drive actions between assertions for transitions.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you inject test dispatchers into the code under test?",
    a: [
      {
        t: "p",
        text: "Inject dispatchers rather than hardcoding `Dispatchers.IO` — a constructor parameter (`ioDispatcher: CoroutineDispatcher = Dispatchers.IO`) with a production default. In tests, pass a `TestDispatcher` sharing the `runTest` `testScheduler`, so the code's coroutines run on the virtual clock. A `DispatcherProvider` interface bundling Main/IO/Default is common for larger apps. This makes all coroutine code deterministic in tests.",
      },
      {
        t: "code",
        title: "Injected dispatcher",
        code: `class Repo(private val io: CoroutineDispatcher = Dispatchers.IO) { ... }
// Test:
val repo = Repo(StandardTestDispatcher(testScheduler))`,
      },
      {
        t: "list",
        items: [
          "**Inject dispatchers** — constructor param, production default.",
          "**Test dispatcher** — sharing `runTest`'s `testScheduler`.",
          "**`DispatcherProvider`** — bundle Main/IO/Default for larger apps.",
          "**Deterministic** — coroutines on the virtual clock.",
        ],
      },
      {
        t: "note",
        text: "Inject dispatchers (constructor param, default Dispatchers.IO) instead of hardcoding, so tests pass a TestDispatcher sharing runTest's testScheduler — coroutines run on the virtual clock (deterministic). Larger apps inject a DispatcherProvider bundling Main/IO/Default.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a debounced search flow?",
    a: [
      {
        t: "p",
        text: "In `runTest`, drive the query (via a `MutableStateFlow` or the ViewModel's input), then `advanceTimeBy` past the debounce window and assert the resulting emission/search call. The virtual clock skips the real 300ms wait. Test that rapid changes produce *one* search (debounce collapses them) and that `distinctUntilChanged`/`flatMapLatest` behave (only the latest query searches).",
      },
      {
        t: "code",
        title: "Debounce test",
        code: `val query = MutableStateFlow("")
val results = query.debounce(300).distinctUntilChanged()...
results.test {
    query.value = "a"; query.value = "ab"
    advanceTimeBy(301)                      // past debounce
    assertThat(awaitItem()).isEqualTo(searchFor("ab"))   // only the last
}`,
      },
      {
        t: "list",
        items: [
          "**Drive the query** — `MutableStateFlow`/input.",
          "**`advanceTimeBy`** — past the debounce window.",
          "**Assert one search** — debounce collapses rapid changes.",
          "**Latest only** — `flatMapLatest`/`distinctUntilChanged`.",
        ],
      },
      {
        t: "note",
        text: "Test debounced search in runTest: drive the query (MutableStateFlow/input), advanceTimeBy past the debounce window (virtual clock skips the real wait), assert one search for the latest query. Verify rapid changes collapse to one search (debounce) and only the latest searches (flatMapLatest/distinctUntilChanged).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test that a coroutine is cancelled properly?",
    a: [
      {
        t: "p",
        text: "In `runTest`, launch the coroutine, then cancel it and assert the observable effects: cleanup ran (`finally`/flags), no further state changes, resources released. Use `advanceTimeBy` to position cancellation mid-work. Assert that `CancellationException` wasn't swallowed (the coroutine actually stopped). This verifies structured cancellation behaves correctly.",
      },
      {
        t: "code",
        title: "Cancellation test",
        code: `@Test fun cleansUpOnCancel() = runTest {
    var cleaned = false
    val job = launch { try { delay(10_000) } finally { cleaned = true } }
    advanceTimeBy(100); job.cancelAndJoin()
    assertThat(cleaned).isTrue()
}`,
      },
      {
        t: "list",
        items: [
          "**Launch + cancel** — `cancelAndJoin()` to wait.",
          "**Assert effects** — cleanup ran, no further changes.",
          "**`advanceTimeBy`** — position cancellation mid-work.",
          "**Not swallowed** — the coroutine actually stopped.",
        ],
      },
      {
        t: "note",
        text: "Test cancellation in runTest: launch, position with advanceTimeBy, cancelAndJoin(), then assert observable effects — cleanup ran (finally/flags), no further state changes, resources released, CancellationException not swallowed. Verifies structured cancellation works.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a flow that emits errors?",
    a: [
      {
        t: "p",
        text: "Inject a fake that throws, then assert with Turbine's `awaitError()` (for a propagated error) or `awaitItem()` (for a mapped error state if the flow has a `catch`). Test both paths: an uncaught error propagates (`awaitError`), and a `catch`-guarded flow emits a fallback/error state. Also verify `CancellationException` isn't caught by error handling.",
      },
      {
        t: "code",
        title: "Flow error test",
        code: `flow<Int> { throw IOException() }.catch { emit(-1) }.test {
    assertThat(awaitItem()).isEqualTo(-1)   // fallback
    awaitComplete()
}`,
      },
      {
        t: "list",
        items: [
          "**Fake throws** — inject the error.",
          "**`awaitError()`** — propagated error.",
          "**`awaitItem()`** — mapped error/fallback state.",
          "**Cancellation** — ensure it isn't swallowed.",
        ],
      },
      {
        t: "note",
        text: "Test flow errors with a fake that throws: Turbine awaitError() for propagated errors, or awaitItem() for a catch-guarded fallback/error state. Test both paths (uncaught propagates, catch emits fallback) and verify CancellationException isn't swallowed by error handling.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the pitfalls of testing stateIn(WhileSubscribed) StateFlows?",
    a: [
      {
        t: "p",
        text: "`stateIn(WhileSubscribed(5000))` upstream *only starts when there's a collector* — so in a test, if you just read `.value` without collecting, you get the initial value and the upstream never runs. Fixes: collect it (Turbine's `test { }` counts as a collector, or `launch { flow.collect { } }` in a background job), and `advanceUntilIdle()`. Also, the 5s stop-timeout is virtual — the test clock handles it. Forgetting the collector is the classic pitfall (state stuck at initial).",
      },
      {
        t: "list",
        items: [
          "**No collector = no upstream** — `.value` stays initial.",
          "**Collect it** — Turbine `test { }` or a background `launch { collect }`.",
          "**`advanceUntilIdle`** — let the upstream run.",
          "**Classic pitfall** — state stuck at initial (no collector).",
        ],
      },
      {
        t: "note",
        text: "stateIn(WhileSubscribed) upstream only starts with a collector — so reading .value without collecting gives the initial value and the upstream never runs (the classic pitfall: state stuck at initial). Collect it (Turbine test { } or a background launch { collect }) + advanceUntilIdle. The 5s timeout is virtual (test clock handles it).",
      },
    ],
  },
  {
    level: "junior",
    q: "Why can't you use Thread.sleep or real delays in coroutine tests?",
    a: [
      {
        t: "p",
        text: "`Thread.sleep` and real time make tests *slow* (a `delay(10_000)` would wait 10 real seconds) and *flaky* (timing-dependent). `runTest`'s *virtual clock* solves this — `delay` is skipped/advanced instantly and deterministically. Never `Thread.sleep` to 'wait for a coroutine'; use `advanceUntilIdle()`/`advanceTimeBy()` to control the virtual clock. This makes coroutine tests fast and reliable.",
      },
      {
        t: "list",
        items: [
          "**Real time = slow + flaky** — timing-dependent.",
          "**Virtual clock** — `runTest` skips/advances `delay` instantly.",
          "**`advanceUntilIdle`/`advanceTimeBy`** — control time.",
          "**Never `Thread.sleep`** — to wait for coroutines.",
        ],
      },
      {
        t: "note",
        text: "Thread.sleep/real delays make tests slow (delay(10_000) waits 10 real seconds) and flaky (timing-dependent). runTest's virtual clock skips/advances delay instantly and deterministically — use advanceUntilIdle()/advanceTimeBy() to control time, never Thread.sleep to wait for coroutines.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test coroutines launched in a custom scope?",
    a: [
      {
        t: "p",
        text: "Inject the scope (or its dispatcher) so the test controls it. For a class using an app-scoped `CoroutineScope`, inject a `TestScope`/scope built with a `TestDispatcher` sharing the `testScheduler`, so launched coroutines run on the virtual clock and you can `advanceUntilIdle()`. Avoid hardcoded `GlobalScope`/scopes you can't control — inject them for testability, like dispatchers.",
      },
      {
        t: "list",
        items: [
          "**Inject the scope/dispatcher** — control it in tests.",
          "**`TestScope`/test dispatcher** — share the `testScheduler`.",
          "**`advanceUntilIdle`** — drive launched coroutines.",
          "**Don't hardcode** — GlobalScope/uncontrollable scopes.",
        ],
      },
      {
        t: "note",
        text: "Inject the CoroutineScope (or its dispatcher) so tests control it — pass a TestScope/scope with a TestDispatcher sharing the testScheduler, so launched coroutines run on the virtual clock (advanceUntilIdle). Don't hardcode GlobalScope/uncontrollable scopes — inject them for testability, like dispatchers.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you test a suspend function?",
    a: [
      {
        t: "p",
        text: "Call it inside `runTest { }` (which provides a coroutine context) and assert the result — since a suspend function returns a value directly, it's like testing a normal function but in a coroutine scope. Inject fakes for its dependencies (a fake repository/API), and use `advanceUntilIdle()` if it launches child coroutines. Most suspend-function tests are simple: call, await, assert.",
      },
      {
        t: "code",
        title: "Suspend test",
        code: `@Test fun loadsUser() = runTest {
    val repo = FakeRepo(user)
    val result = repo.getUser("1")   // suspend call
    assertThat(result).isEqualTo(user)
}`,
      },
      {
        t: "list",
        items: [
          "**`runTest { }`** — provides the coroutine context.",
          "**Call + assert** — like a normal function.",
          "**Fakes** — for dependencies.",
          "**`advanceUntilIdle`** — if it launches children.",
        ],
      },
      {
        t: "note",
        text: "Test a suspend function inside runTest { } (provides the coroutine context) — call it, assert the result (it returns a value directly). Inject fakes for dependencies; advanceUntilIdle() if it launches child coroutines. Most suspend tests are simple: call, await, assert.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test that emissions happen in the right order and timing?",
    a: [
      {
        t: "p",
        text: "Use Turbine to assert the *order* (`awaitItem()` returns emissions in sequence) and `advanceTimeBy` to test *timing* (a value emitted after a delay appears only after advancing the clock). For time-based operators (`debounce`, `sample`, `delay`), advance the clock to specific points and assert what's emitted at each. This deterministically verifies both order and timing without real waits.",
      },
      {
        t: "list",
        items: [
          "**Turbine `awaitItem()`** — order of emissions.",
          "**`advanceTimeBy`** — timing (emit after delay).",
          "**Time operators** — advance to points, assert emissions.",
          "**Deterministic** — no real waits.",
        ],
      },
      {
        t: "note",
        text: "Test order with Turbine (awaitItem() returns emissions in sequence) and timing with advanceTimeBy (a value emitted after a delay appears only after advancing). For debounce/sample/delay, advance the clock to specific points and assert emissions at each — deterministic order/timing verification without real waits.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between launch and async when testing?",
    a: [
      {
        t: "p",
        text: "When testing code that uses `launch` (fire-and-forget), you need `advanceUntilIdle()` (or `runCurrent()`) to let the launched coroutine run before asserting. Code using `async` requires `await()` to get the result. In tests, the key is *driving the virtual clock* so launched/async coroutines execute — reading state too early (before advancing) gives the pre-execution value, a common test bug.",
      },
      {
        t: "list",
        items: [
          "**`launch`** — `advanceUntilIdle()` to run it before asserting.",
          "**`async`** — `await()` for the result.",
          "**Drive the clock** — so coroutines execute.",
          "**Common bug** — asserting before advancing (pre-execution value).",
        ],
      },
      {
        t: "note",
        text: "Testing launch (fire-and-forget): advanceUntilIdle()/runCurrent() to let it run before asserting. async: await() for the result. The key is driving the virtual clock so coroutines execute — reading state before advancing gives the pre-execution value (a common test bug).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test retry logic with backoff in a flow?",
    a: [
      {
        t: "p",
        text: "Use a fake that fails N times then succeeds (an attempt counter), collect the flow with `retry`/`retryWhen` in `runTest`, `advanceTimeBy` past the backoff delays (virtual clock skips them), and assert the final success and attempt count. Also test the give-up path (a fake that always fails surfaces the error after the cap). The virtual clock makes backoff testing instant.",
      },
      {
        t: "code",
        title: "Retry test",
        code: `var attempts = 0
val flow = flow { attempts++; if (attempts < 3) throw IOException() else emit("ok") }
    .retryWhen { _, a -> if (a < 3) { delay(1000); true } else false }
flow.test { assertThat(awaitItem()).isEqualTo("ok"); awaitComplete() }
assertThat(attempts).isEqualTo(3)`,
      },
      {
        t: "list",
        items: [
          "**Fail-then-succeed fake** — attempt counter.",
          "**`advanceTimeBy`** — past backoff (virtual clock).",
          "**Assert result + attempts** — success after N.",
          "**Give-up path** — always-fail surfaces error after cap.",
        ],
      },
      {
        t: "note",
        text: "Test retry+backoff with a fake failing N times then succeeding (attempt counter): collect with retry/retryWhen in runTest, advanceTimeBy past the backoff delays (virtual clock skips them), assert final success + attempt count. Also test the give-up path (always-fail surfaces the error after the cap).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you assert a Flow emits nothing (no unexpected emissions)?",
    a: [
      {
        t: "p",
        text: "With Turbine, use `expectNoEvents()` to assert nothing has been emitted at that point (e.g. before a trigger, or during a debounce window before it elapses). This verifies a flow *doesn't* emit prematurely — important for debounce (no emission before the pause) or conditional logic (no emission when the condition isn't met).",
      },
      {
        t: "code",
        title: "expectNoEvents",
        code: `query.debounce(300).test {
    query.value = "a"
    advanceTimeBy(100); expectNoEvents()   // debounce not elapsed
    advanceTimeBy(250); awaitItem()         // now it emits
}`,
      },
      {
        t: "list",
        items: [
          "**`expectNoEvents()`** — assert nothing emitted.",
          "**Debounce** — no emission before the pause.",
          "**Conditional** — no emission when the condition is false.",
          "**Verifies absence** — not just presence.",
        ],
      },
      {
        t: "note",
        text: "Use Turbine's expectNoEvents() to assert a flow hasn't emitted at that point — verifying it doesn't emit prematurely (debounce before the window elapses, conditional logic when the condition isn't met). Testing absence of emissions, not just presence.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a callbackFlow or channelFlow?",
    a: [
      {
        t: "p",
        text: "For a `callbackFlow` wrapping a callback API, inject a *fake* of the underlying API you can trigger — collect the flow with Turbine, invoke the fake's callback to produce emissions, and assert them. Also verify *cleanup*: check the listener is unregistered (via the fake) when the flow is cancelled (`awaitClose`). This tests both emission and resource cleanup.",
      },
      {
        t: "list",
        items: [
          "**Fake the callback source** — trigger it in the test.",
          "**Turbine** — collect and assert emissions.",
          "**Invoke the callback** — produce emissions.",
          "**Verify `awaitClose`** — listener unregistered on cancel.",
        ],
      },
      {
        t: "note",
        text: "Test callbackFlow/channelFlow by injecting a fake of the underlying callback API you can trigger: collect with Turbine, invoke the fake's callback to produce emissions, assert them. Also verify cleanup — the listener is unregistered (via the fake) on cancel (awaitClose). Tests emission AND resource cleanup.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you avoid the 'test passes but coroutine didn't run' problem?",
    a: [
      {
        t: "p",
        text: "The bug: you assert state *before* the launched coroutine executed, so the test checks the pre-execution value and passes incorrectly. Avoid it by *advancing the clock* before asserting — `advanceUntilIdle()` runs all pending coroutines, `runCurrent()` runs current-time work. With `UnconfinedTestDispatcher`, coroutines run eagerly (may not need advancing); with `StandardTestDispatcher`, you *must* advance. Understand your dispatcher's execution model.",
      },
      {
        t: "list",
        items: [
          "**Assert too early** — checks pre-execution state; false pass.",
          "**Advance first** — `advanceUntilIdle()`/`runCurrent()`.",
          "**`StandardTestDispatcher`** — must advance.",
          "**`UnconfinedTestDispatcher`** — eager; may not need advancing.",
        ],
      },
      {
        t: "note",
        text: "The 'test passes but coroutine didn't run' bug: asserting state before the launched coroutine executed (checks the pre-execution value, false pass). Fix: advance the clock before asserting (advanceUntilIdle/runCurrent). StandardTestDispatcher requires advancing; UnconfinedTestDispatcher runs eagerly (may not). Know your dispatcher's model.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you collect a Flow into a list for assertion?",
    a: [
      {
        t: "p",
        text: "For a *finite* flow, `flow.toList()` inside `runTest` collects all emissions into a list you assert. For a *hot/infinite* flow, `toList()` hangs (never completes) — bound it with `take(n).toList()` or use Turbine. For a `StateFlow`, collect emissions in a background `launch` into a list (and cancel it), since it never completes. Choose based on whether the flow completes.",
      },
      {
        t: "code",
        title: "toList",
        code: `@Test fun emits() = runTest {
    val result = repo.numbers().map { it * 2 }.toList()   // finite flow
    assertThat(result).containsExactly(2, 4, 6)
}`,
      },
      {
        t: "list",
        items: [
          "**Finite** — `toList()` collects and asserts.",
          "**Hot/infinite** — `take(n).toList()` or Turbine.",
          "**StateFlow** — background `launch` collecting into a list.",
          "**Choose** — by whether the flow completes.",
        ],
      },
      {
        t: "note",
        text: "Finite flow: toList() in runTest collects emissions to assert. Hot/infinite: toList() hangs — use take(n).toList() or Turbine. StateFlow: collect in a background launch into a list (cancel it) since it never completes. Choose by whether the flow completes.",
      },
    ],
  },
  {
    level: "junior",
    q: "What replaced the deprecated runBlockingTest, and why?",
    a: [
      {
        t: "p",
        text: "`runBlockingTest` (and `TestCoroutineDispatcher`/`TestCoroutineScope`) were *deprecated* in favor of `runTest` (with `TestScope`, `StandardTestDispatcher`, `UnconfinedTestDispatcher`). The new API has a *cleaner virtual-clock model*, better handles uncaught exceptions and unfinished coroutines, and integrates the scheduler properly. Use `runTest` for all new coroutine tests; migrate old `runBlockingTest` code.",
      },
      {
        t: "list",
        items: [
          "**`runBlockingTest` deprecated** — replaced by `runTest`.",
          "**`runTest`** — TestScope + Standard/UnconfinedTestDispatcher.",
          "**Cleaner model** — better exceptions/unfinished-coroutine handling.",
          "**Migrate** — use runTest for all new tests.",
        ],
      },
      {
        t: "note",
        text: "runBlockingTest (and TestCoroutineDispatcher/Scope) were deprecated in favor of runTest (TestScope, StandardTestDispatcher, UnconfinedTestDispatcher) — a cleaner virtual-clock model with better exception/unfinished-coroutine handling. Use runTest for all new coroutine tests.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test one-off events (Channel/SharedFlow) from a ViewModel?",
    a: [
      {
        t: "p",
        text: "Collect the events *before* triggering the action (events aren't replayed, so a late collector misses them). With Turbine, start `viewModel.events.test { }`, then trigger the action, and `awaitItem()` the event. Because a `Channel`/`SharedFlow(replay=0)` delivers each event once, the collector must be active at emit time — so order matters in the test.",
      },
      {
        t: "code",
        title: "Event test",
        code: `viewModel.events.test {
    viewModel.onSaved()                       // trigger AFTER collection starts
    assertThat(awaitItem()).isEqualTo(UiEvent.NavigateBack)
    cancelAndIgnoreRemainingEvents()
}`,
      },
      {
        t: "list",
        items: [
          "**Collect first** — before triggering (no replay).",
          "**Turbine `test { }`** — start collection.",
          "**Trigger then `awaitItem()`** — assert the event.",
          "**Order matters** — collector active at emit time.",
        ],
      },
      {
        t: "note",
        text: "Test one-off events (Channel/SharedFlow replay=0) by collecting BEFORE triggering — start Turbine's test { }, trigger the action, awaitItem() the event. Events aren't replayed, so the collector must be active at emit time; order matters in the test.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a combine of multiple flows?",
    a: [
      {
        t: "p",
        text: "Drive controllable input flows (`MutableStateFlow`s) with values in `runTest`, collect the combined output with Turbine, and assert emissions after each input change. `combine` emits the latest-of-each on any change, so push values one at a time and assert the recomputed result. Advance virtual time past any `debounce` in the pipeline.",
      },
      {
        t: "code",
        title: "combine test",
        code: `val a = MutableStateFlow(1); val b = MutableStateFlow(10)
combine(a, b) { x, y -> x + y }.test {
    assertThat(awaitItem()).isEqualTo(11)
    a.value = 2
    assertThat(awaitItem()).isEqualTo(12)
    cancelAndIgnoreRemainingEvents()
}`,
      },
      {
        t: "list",
        items: [
          "**Controllable inputs** — `MutableStateFlow`s.",
          "**Turbine** — collect combined output.",
          "**Push one at a time** — assert recomputed result.",
          "**Advance time** — past any debounce.",
        ],
      },
      {
        t: "note",
        text: "Test combine by driving controllable input flows (MutableStateFlows) with values in runTest, collecting the combined output with Turbine, and asserting after each input change (combine emits latest-of-each). Push values one at a time; advance virtual time past any debounce.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test collectLatest or conflate behavior?",
    a: [
      {
        t: "p",
        text: "To test that `collectLatest` cancels stale processing: emit values with delays, and assert that only the *latest* value's processing completes (earlier ones are cancelled — e.g. track completions and assert only the last ran). Use the virtual clock (`advanceTimeBy`) to emit values before the prior processing finishes. This verifies cancel-and-restart semantics deterministically.",
      },
      {
        t: "list",
        items: [
          "**Emit with delays** — trigger cancel-and-restart.",
          "**Assert only latest completes** — earlier cancelled.",
          "**Track completions** — verify which ran.",
          "**Virtual clock** — control timing precisely.",
        ],
      },
      {
        t: "note",
        text: "Test collectLatest/conflate by emitting values with delays (via the virtual clock) so a new value arrives before the prior processing finishes, then assert only the LATEST value's processing completes (earlier cancelled) — e.g. track completions. Verifies cancel-and-restart semantics deterministically.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you assert uncaught exceptions and unfinished coroutines in runTest?",
    a: [
      {
        t: "p",
        text: "`runTest` *fails the test* if a child coroutine throws an uncaught exception or if coroutines are still *unfinished* when the test body completes (it waits for them) — catching leaked/hung coroutines. So a background `launch` that throws will surface as a test failure. If you *expect* an uncaught exception, use a `CoroutineExceptionHandler` or structure the test to catch it. This safety net catches bugs a naive test would miss.",
      },
      {
        t: "list",
        items: [
          "**Uncaught exception** — fails the test.",
          "**Unfinished coroutines** — runTest waits; hung ones fail it.",
          "**Catches leaks** — background launches that throw/hang.",
          "**Expected exceptions** — handle deliberately.",
        ],
      },
      {
        t: "note",
        text: "runTest fails the test on an uncaught child-coroutine exception or unfinished coroutines when the body completes (it waits for them) — catching leaked/hung coroutines a naive test would miss. A background launch that throws surfaces as a failure. For expected exceptions, handle them deliberately (handler/structure).",
      },
    ],
  },
];

export default qa;
