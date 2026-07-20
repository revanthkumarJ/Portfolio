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
];

export default qa;
