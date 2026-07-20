// Coroutine & Flow Testing — Content tab. Teaching-first.

const content = [
  {
    heading: "The challenge: testing async code",
    blocks: [
      {
        t: "p",
        text: "Testing coroutines and flows is harder than testing plain functions because the code is *asynchronous* — things happen over time, on different threads, with delays. Naively, a test might finish before the coroutine's work completes, or use real `delay`s that make it slow. The coroutines test library solves this with **`runTest`** and **virtual time**: it runs your suspend code in a controlled scope where `delay`s complete *instantly* (a virtual clock is advanced instead of real waiting), giving fast, deterministic async tests.",
      },
    ],
  },
  {
    heading: "runTest and virtual time",
    blocks: [
      {
        t: "code",
        title: "runTest — the coroutine test builder",
        code: `@Test
fun loadUser_succeeds() = runTest {          // provides a TestScope
    val repo = FakeUserRepository(user = testUser)
    val viewModel = UserViewModel(repo)

    viewModel.load("42")                      // launches a coroutine
    advanceUntilIdle()                        // run all pending coroutines to completion

    assertEquals(testUser, viewModel.state.value.user)
}

@Test
fun debounce_test() = runTest {
    // delay(300) inside completes INSTANTLY via virtual time:
    viewModel.onQueryChange("kotlin")
    advanceTimeBy(300)                         // advance the virtual clock past debounce
    runCurrent()                               // run tasks scheduled up to now
    assertEquals(expectedResults, viewModel.results.value)
}`,
      },
      {
        t: "list",
        items: [
          "**`runTest { }`** — the entry point for coroutine tests. It provides a `TestScope` with a `TestDispatcher` and a virtual clock, and it *auto-advances* time so `delay`s don't actually wait. A test of a 300ms debounce runs in microseconds.",
          "**Virtual time controls**: `advanceUntilIdle()` (run all pending coroutines until none are left), `advanceTimeBy(ms)` (move the clock forward by a duration, running tasks scheduled up to then), `runCurrent()` (run tasks scheduled at the current time). These let you *deterministically* step through async execution.",
          "**Why it's fast and reliable**: no real waiting (delays are virtual), no real threads racing — the scheduler runs tasks in a controlled order, so async tests are as deterministic as synchronous ones.",
        ],
      },
    ],
  },
  {
    heading: "TestDispatcher: Standard vs Unconfined",
    blocks: [
      {
        t: "p",
        text: "`runTest` uses a **`TestDispatcher`**, and there are two kinds with different execution semantics — choosing the right one matters for what you can test.",
      },
      {
        t: "table",
        headers: ["", "StandardTestDispatcher", "UnconfinedTestDispatcher"],
        rows: [
          ["Execution", "queues coroutines — they don't run until you advance", "runs coroutines eagerly (immediately, until they suspend)"],
          ["Control", "precise — you step execution with advance*", "less control — things just run"],
          ["Intermediate states", "can assert them (e.g. Loading before Content)", "may skip past them"],
          ["Use for", "testing step-by-step behavior, transient states", "simpler tests where you don't need intermediate states"],
        ],
      },
      {
        t: "list",
        items: [
          "**`StandardTestDispatcher`** (the `runTest` default) *queues* launched coroutines — they don't execute until you call `advanceUntilIdle()`/`runCurrent()`. This gives precise control, letting you assert *intermediate* states — e.g. that the ViewModel shows `Loading` before it shows `Content`.",
          "**`UnconfinedTestDispatcher`** runs coroutines *eagerly* (immediately, until first suspension). Simpler for tests where you only care about the final state, but you may miss transient states because they've already passed by the time you assert.",
          "**Choosing**: use `StandardTestDispatcher` when you need to verify intermediate states or exact ordering; `UnconfinedTestDispatcher` for simpler 'just give me the final result' tests. Many ViewModel tests use Unconfined for simplicity, Standard when asserting Loading→Content transitions.",
        ],
      },
    ],
  },
  {
    heading: "The Main dispatcher rule",
    blocks: [
      {
        t: "p",
        text: "`viewModelScope` uses `Dispatchers.Main`, which *doesn't exist* on the JVM (it's provided by the Android UI thread). So a plain JVM unit test of a ViewModel that launches in `viewModelScope` fails with 'Module with the Main dispatcher had failed to initialize'. The fix: replace `Dispatchers.Main` with a `TestDispatcher` for the test's duration, via `Dispatchers.setMain()`. A reusable JUnit rule does this cleanly.",
      },
      {
        t: "code",
        title: "MainDispatcherRule",
        code: `class MainDispatcherRule(
    val dispatcher: TestDispatcher = UnconfinedTestDispatcher(),
) : TestWatcher() {
    override fun starting(description: Description) = Dispatchers.setMain(dispatcher)
    override fun finished(description: Description) = Dispatchers.resetMain()
}

// In the test class:
@get:Rule val mainDispatcherRule = MainDispatcherRule()

@Test fun test() = runTest {
    val vm = UserViewModel(fakeRepo)   // viewModelScope now uses the test dispatcher
    // ...
}`,
      },
      {
        t: "list",
        items: [
          "**`Dispatchers.setMain(testDispatcher)`** substitutes a test dispatcher for `Dispatchers.Main` so `viewModelScope` (and any `Main`-dispatched code) runs on the controllable test scheduler. **`Dispatchers.resetMain()`** restores it after.",
          "The `MainDispatcherRule` (a `TestWatcher`) applies this automatically before/after each test — a standard piece of ViewModel-test infrastructure you'll write once and reuse.",
          "This is *the* reason a ViewModel test needs setup beyond just constructing it — without the Main dispatcher rule, launching in `viewModelScope` throws.",
        ],
      },
    ],
  },
  {
    heading: "Testing Flows with Turbine",
    blocks: [
      {
        t: "p",
        text: "Flows emit multiple values over time, which is awkward to assert with plain collection. **Turbine** (a small library) makes it clean: `flow.test { }` collects the flow and gives you `awaitItem()`/`awaitComplete()`/`awaitError()` to assert emissions one by one.",
      },
      {
        t: "code",
        title: "Turbine flow test",
        code: `@Test fun state_emitsLoadingThenContent() = runTest {
    val viewModel = SearchViewModel(FakeRepo(results = listOf(item)))

    viewModel.uiState.test {                       // collect the flow
        assertEquals(UiState.Loading, awaitItem())  // first emission
        viewModel.search("query")
        assertEquals(UiState.Content(listOf(item)), awaitItem())  // next emission
        cancelAndIgnoreRemainingEvents()            // stop collecting
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`flow.test { }`** — starts collecting; inside, `awaitItem()` returns the next emission, `awaitComplete()` asserts the flow finished, `awaitError()` asserts an exception, `expectNoEvents()` asserts nothing emitted. It fails the test if you leave unconsumed emissions — catching accidental over-emission.",
          "**The `stateIn(WhileSubscribed)` gotcha**: a flow produced with `WhileSubscribed` is cold until collected, so asserting `.value` right after constructing the ViewModel sees only the `initialValue`. You must *collect* it (Turbine's `.test { }` subscribes and triggers the upstream), or launch a collector in `backgroundScope`.",
          "**Combine with virtual time** for time-based operators: `advanceTimeBy(300)` inside a Turbine test to skip a `debounce` deterministically.",
        ],
      },
      {
        t: "note",
        text: "Coroutine/Flow testing essentials: runTest gives a TestScope with virtual time (delays complete instantly), controlled with advanceUntilIdle/advanceTimeBy/runCurrent. TestDispatcher: Standard (queues — precise control, assert intermediate states) vs Unconfined (eager — simpler). ViewModels need Dispatchers.setMain(testDispatcher) via a MainDispatcherRule (viewModelScope uses Main, absent on JVM). Test Flows with Turbine (.test { awaitItem() }); remember stateIn(WhileSubscribed) is cold until collected. Inject dispatchers so tests control them.",
      },
    ],
  },
];

export default content;
