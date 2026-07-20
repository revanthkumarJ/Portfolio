// Flow Error Handling & Testing — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "How do you handle errors in a Flow?",
    a: [
      {
        t: "p",
        text: "**The concept**: an exception anywhere in a flow — producer, an operator, or the collect block — propagates downstream to the terminal operator. You *can* wrap `collect` in a try/catch, but the idiomatic, composable way is the **`catch` operator**, which handles exceptions declaratively as part of the pipeline.",
      },
      {
        t: "code",
        title: "The catch operator",
        code: `repository.observeData()
    .map { UiState.Content(it) }
    .catch { e -> emit(UiState.Error(e.message)) }   // handle upstream errors
    .collect { render(it) }`,
      },
      {
        t: "p",
        text: "Inside `catch` you can emit a fallback value, rethrow to propagate, or just log. The key thing to know is that `catch` only catches exceptions from **upstream** (operators and the producer *above* it), not from operators below it or from the `collect` block — so you place it after the risky part and before the UI-facing code. This 'catch only what's above you' rule keeps data-source errors separate from bugs in your rendering code. For network flows you often combine it with `retry`/`retryWhen` (retry transient failures first) and then `catch` as the final fallback.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does onStart and onCompletion do?",
    a: [
      {
        t: "list",
        items: [
          "**`onStart { }`** runs *before* the first value is emitted — and it can itself `emit`. The classic use is emitting a loading state as collection begins: `.onStart { emit(UiState.Loading) }` so the UI shows a spinner immediately, before the real data arrives.",
          "**`onCompletion { cause -> }`** runs when the flow ends — for any reason. If it completed normally, `cause` is null; if it ended from an exception or cancellation, `cause` is that throwable. Use it for cleanup or 'hide the loading indicator' logic that should run regardless of success or failure.",
        ],
      },
      {
        t: "p",
        text: "An important subtlety about `onCompletion`: it *observes* the completion cause but doesn't *handle* it — if the flow failed, the exception still propagates downstream after `onCompletion` runs. So `onCompletion` is not a substitute for `catch`; you put `catch` before it if you want to actually handle the error. The idiomatic order is `onStart` (loading) → transforms → `catch` (turn errors into an error state) → `onCompletion` (observe the end / cleanup).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you retry a flow that fails, e.g. a flaky network call?",
    a: [
      {
        t: "p",
        text: "**The concept**: since a flow is cold, re-collecting it re-runs the upstream — so 'retry' means re-executing the producer. Flow gives you two operators for this. `retry(count)` simply re-collects up to `count` times on any exception (optionally filtered by a predicate). `retryWhen { cause, attempt -> }` gives full control: you inspect the exception and the attempt number, can `delay` between attempts (for backoff), and return `true` to retry or `false` to give up.",
      },
      {
        t: "code",
        title: "Retry only transient errors, with backoff",
        code: `flow
    .retryWhen { cause, attempt ->
        if (cause is IOException && attempt < 3) {
            delay(1000 * (attempt + 1))   // wait longer each time
            true                          // retry
        } else false                      // give up -> error propagates
    }
    .catch { emit(cachedFallback) }       // final fallback after retries fail
    .collect { render(it) }`,
      },
      {
        t: "p",
        text: "Best practice is to retry *only* transient failures (like `IOException` for network blips) and *not* things like a 404 or a parsing error that will fail identically every time — retrying those just wastes time. Bound the attempts, add increasing backoff so you don't hammer a struggling server, and pair it with a final `catch` that provides a fallback (cached data, an error state) once retries are exhausted.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you test a Flow?",
    a: [
      {
        t: "p",
        text: "**The concept**: flow tests run inside `runTest`, which provides virtual time (so `delay`s complete instantly by advancing a fake clock, making tests fast and deterministic). To assert emissions, the cleanest approach is the **Turbine** library, which collects the flow and gives you an await-based API.",
      },
      {
        t: "code",
        title: "Turbine test",
        code: `@Test fun emitsValues() = runTest {
    flowOf(1, 2, 3).test {
        assertEquals(1, awaitItem())
        assertEquals(2, awaitItem())
        assertEquals(3, awaitItem())
        awaitComplete()
    }
}`,
      },
      {
        t: "list",
        items: [
          "Inside `flow.test { }`: `awaitItem()` gets the next emission, `awaitComplete()` asserts the flow finished, `awaitError()` asserts an exception, `expectNoEvents()` asserts nothing was emitted. Turbine also fails the test if emissions are left unconsumed, catching accidental over-emission.",
          "For time-based operators (`debounce`, `sample`, retry backoff), use `advanceTimeBy(ms)` or `advanceUntilIdle()` to move virtual time forward without real waiting — so a test of a 300ms debounce runs instantly.",
          "For ViewModels using `viewModelScope` (which uses `Dispatchers.Main`), install a `TestDispatcher` as Main via a JUnit rule so the test controls the coroutines.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "Explain exception transparency in Flow and why placement of the catch operator matters.",
    a: [
      {
        t: "p",
        text: "**Exception transparency** is a Flow design principle: a flow must not *catch* exceptions from downstream and *emit* in response — emissions and exception handling stay clearly separated so that downstream code can trust the contract. Concretely, this is why you can't put a try/catch *inside* a `flow { }` builder around an `emit` and then emit again from the catch (it violates transparency and throws). Handling belongs in the dedicated `catch` operator, which has well-defined scope.",
      },
      {
        t: "p",
        text: "**Why placement matters**: `catch` only sees exceptions from **upstream** of it — the producer and operators *above* it. Anything *below* the `catch` (later operators, the `collect` block) is invisible to it. This is intentional: it separates 'the data source or a transformation failed' (which `catch` should handle) from 'my rendering code threw a bug' (which should *not* be silently swallowed by a data-error handler).",
      },
      {
        t: "code",
        title: "Placement changes behavior",
        code: `flow.map { parse(it) }      // A: caught
    .catch { emit(default) } //    <- catches producer + map A
    .map { render(it) }      // B: NOT caught (a bug here surfaces at collect)
    .collect { ui(it) }      // C: NOT caught`,
      },
      {
        t: "list",
        items: [
          "Put `catch` *right after the risky upstream* (the network/DB producer and its parsing) and *before* UI-facing operators, so data errors become error states but UI bugs still surface loudly.",
          "**The pipeline corollary** (the high-value senior point): in a `flatMapLatest` search pipeline, a `catch` on the **inner** flow contains a failure to one search (the pipeline keeps working for the next query), while a `catch` on the **outer** flow terminates the entire pipeline permanently after the first error. Where you place `catch` literally decides whether the feature recovers.",
          "`catch` correctly ignores `CancellationException` (it must, to not break cancellation) — but a hand-written `try/catch (e: Exception)` around a suspend call inside a flow will swallow it and break cancellation, a classic bug.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "In a flatMapLatest search pipeline, where do you put catch and why does it matter so much?",
    a: [
      {
        t: "p",
        text: "**Put `catch` on the INNER flow** — inside the `flatMapLatest` lambda, on the per-query flow — not on the outer pipeline. This is one of the most consequential placement decisions in real Flow code, because it determines whether a single failed search breaks the feature forever.",
      },
      {
        t: "code",
        title: "Inner catch = recoverable; outer catch = broken forever",
        code: `// CORRECT — inner catch: one search fails, next keystroke still works
queryFlow.flatMapLatest { q ->
    repository.search(q)
        .map { SearchState.Results(it) }
        .onStart { emit(SearchState.Loading) }
        .catch { emit(SearchState.Error(it.message)) }   // contained here
}.collect { render(it) }

// WRONG — outer catch: first failed search terminates the WHOLE pipeline;
// queryFlow is now dead, no future query is ever processed
queryFlow.flatMapLatest { q -> repository.search(q).map { ... } }
    .catch { emit(SearchState.Error(it.message)) }
    .collect { render(it) }`,
      },
      {
        t: "list",
        items: [
          "**Why the outer catch is fatal**: when an exception reaches the outer `catch`, the outer flow *terminates* — and the outer flow is `queryFlow` itself. Once it's terminated, no further queries flow through; the user types and nothing happens. The `catch` 'handled' the error but killed the stream that feeds it.",
          "**Why the inner catch works**: each search is its own short-lived inner flow. Catching *there* turns a failed search into an `Error` state emission that `flatMapLatest` passes along, and then the inner flow completes normally. The outer `queryFlow` never sees an exception, so it stays alive — the next keystroke starts a fresh inner search.",
          "**General rule**: catch errors at the *narrowest* scope that should fail — the individual operation, not the long-lived stream that orchestrates operations. This applies to `combine`, `flatMapMerge`, and any long-lived flow driving short-lived sub-operations.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "What are the gotchas of testing a ViewModel that exposes stateIn(WhileSubscribed) StateFlow?",
    a: [
      {
        t: "p",
        text: "**The core gotcha**: a flow produced by `stateIn(scope, WhileSubscribed(...), initial)` is **cold until it has a collector** — `WhileSubscribed` specifically starts the upstream only when someone subscribes. So in a test, if you construct the ViewModel and immediately assert `viewModel.uiState.value`, you'll only ever see the **`initialValue`**, because nothing has subscribed to trigger the upstream. The real emissions never happen.",
      },
      {
        t: "list",
        items: [
          "**Fix — actually collect it**: use Turbine's `viewModel.uiState.test { }` (which subscribes, starting the upstream) and `awaitItem()` through the emissions, or launch a collector in the test's `backgroundScope` (`backgroundScope.launch { viewModel.uiState.collect() }`) so the sharing starts. Only then will `WhileSubscribed` run the upstream and produce real states.",
          "**Install a TestDispatcher as Main**: `viewModelScope` uses `Dispatchers.Main`, which doesn't exist on the JVM. A JUnit rule calling `Dispatchers.setMain(testDispatcher)` / `resetMain()` is required, and it also routes the ViewModel's coroutines through virtual time.",
          "**Dispatcher choice affects what you can observe**: `StandardTestDispatcher` queues coroutines until you `advanceUntilIdle()`/`runCurrent()`, letting you assert *intermediate* states like `Loading` before `Content`. `UnconfinedTestDispatcher` runs eagerly, which is simpler but can skip past transient states before you can assert them — pick based on whether you need to see the in-between states.",
          "**Virtual time for operators**: if the pipeline has `debounce`/`stateIn` timeouts, use `advanceTimeBy` to move the clock; note `WhileSubscribed`'s own 5s stop-timeout can matter if you test unsubscribe behavior.",
          "**Inject dispatchers into the ViewModel/repository**: hardcoded `Dispatchers.IO` inside escapes the test scheduler, making tests slow or flaky; constructor-inject dispatchers so the test substitutes the TestDispatcher and controls all timing.",
        ],
      },
      {
        t: "p",
        text: "**The one-sentence trap**: 'stateIn(WhileSubscribed) does nothing until collected, so a test must subscribe (Turbine or backgroundScope) before asserting — otherwise you only see initialValue.' Naming that, plus the Main-dispatcher rule and StandardvsUnconfined choice, is the complete senior answer.",
      },
    ],
  },
];

export default qa;
