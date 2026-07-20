// Flow Error Handling & Testing — Content tab. Teaching-first.

const content = [
  {
    heading: "How exceptions travel through a flow",
    blocks: [
      {
        t: "p",
        text: "An exception thrown anywhere in a flow — in the producer, in an operator like `map`, or in the collector's block — **propagates downstream** and, if unhandled, surfaces at the terminal operator (`collect`), where it can be caught with an ordinary try/catch or the `catch` operator. The important principle Flow enforces is **exception transparency**: operators should not hide exceptions from downstream, and you handle them declaratively rather than wrapping random pieces in try/catch.",
      },
      {
        t: "code",
        title: "The naive way vs the Flow way",
        code: `// Works but discouraged — imperative, easy to get wrong:
try {
    flow.collect { value -> render(value) }
} catch (e: Exception) {
    showError(e)
}

// Idiomatic — declarative, composable:
flow
    .catch { e -> emit(fallbackValue) }   // handle UPSTREAM errors
    .collect { render(it) }`,
      },
    ],
  },
  {
    heading: "The catch operator — handle upstream errors only",
    blocks: [
      {
        t: "p",
        text: "`catch { }` catches exceptions that occur **upstream** of it (in the producer and any operators above it). It does *not* catch exceptions thrown *downstream* (in operators below it or in the `collect` block) — this is deliberate and follows the 'catch only what's above you' rule, so placement matters.",
      },
      {
        t: "code",
        title: "Placement determines what's caught",
        code: `flow
    .map { riskyTransform(it) }   // errors here ARE caught below
    .catch { e ->
        // only sees exceptions from the producer and the map above
        emit(defaultValue)        // you can emit a fallback,
        // or rethrow, or log — but you're 'above' the collect
    }
    .map { it.toUiModel() }       // errors here are NOT caught by the catch above
    .collect { render(it) }       // errors here are NOT caught either`,
      },
      {
        t: "list",
        items: [
          "**Inside `catch` you can**: emit a fallback value (`emit(...)`), rethrow (to propagate), or just log/handle. It gives you the exception and an `emit` capability.",
          "**Why not catch downstream too**: catching the collector's own errors would conflate 'the data source failed' with 'my rendering code has a bug' — Flow keeps them separate. To handle collector errors, use a try/catch around `collect` or move logic into an operator above the `catch`.",
          "**Placement pattern**: put `catch` right after the risky upstream and before the UI-facing operators, so it handles data errors but not UI-code bugs.",
        ],
      },
    ],
  },
  {
    heading: "The inner-flow catch pattern (critical for pipelines)",
    blocks: [
      {
        t: "p",
        text: "A subtle but vital pattern: in a `flatMapLatest`/`combine` pipeline (like search), where you place `catch` decides whether one error kills the *entire* pipeline or just one operation. A `catch` on the **outer** flow ends everything permanently after the first error — the user can never search again. A `catch` on the **inner** flow contains the error to that one operation, leaving the pipeline alive.",
      },
      {
        t: "code",
        title: "Inner catch keeps the pipeline recoverable",
        code: `queryFlow
    .flatMapLatest { query ->
        repository.search(query)
            .map { SearchState.Results(it) }
            .onStart { emit(SearchState.Loading) }
            .catch { emit(SearchState.Error(it.message)) }  // INNER: this search fails,
    }                                                        // but the next keystroke works
    .collect { render(it) }
// A catch placed AFTER flatMapLatest (outer) would terminate the whole
// pipeline on the first failed search — no recovery.`,
      },
    ],
  },
  {
    heading: "retry and retryWhen — recovering from transient failures",
    blocks: [
      {
        t: "code",
        title: "Retry with backoff",
        code: `flow
    .retryWhen { cause, attempt ->
        // return true to retry, false to give up
        if (cause is IOException && attempt < 3) {
            delay(1000 * (attempt + 1))   // exponential-ish backoff
            true
        } else {
            false                          // propagate the error downstream
        }
    }
    .catch { emit(cachedFallback) }
    .collect { render(it) }`,
      },
      {
        t: "list",
        items: [
          "**`retry(count)`** — re-collect the flow up to `count` times on any exception (optionally filtered by a predicate). Simple case.",
          "**`retryWhen { cause, attempt -> }`** — full control: inspect the exception and attempt number, `delay` for backoff, return `true` to retry or `false` to propagate. The standard way to retry network calls with exponential backoff, only on transient errors (`IOException`) and a bounded attempt count.",
          "**Retry re-runs the upstream** (it's cold) — so a `retry` on a network flow re-issues the request. Combine with `catch` as the final fallback after retries are exhausted.",
        ],
      },
    ],
  },
  {
    heading: "onStart, onEmpty, onCompletion — lifecycle hooks",
    blocks: [
      {
        t: "list",
        items: [
          "**`onStart { }`** — runs *before* the first value; use to emit a loading state or trigger a side effect when collection begins (`.onStart { emit(Loading) }`).",
          "**`onCompletion { cause -> }`** — runs when the flow finishes, whether normally (`cause == null`) or due to an exception/cancellation (`cause != null`). Use for cleanup or 'hide loading' logic. Note it *observes* the cause but doesn't handle it — the exception still propagates (put `catch` before it to handle).",
          "**`onEmpty { }`** — runs if the flow completes without emitting anything; emit a default or empty state.",
        ],
      },
      {
        t: "code",
        title: "Composing lifecycle hooks with error handling",
        code: `repository.observeData()
    .onStart { emit(UiState.Loading) }
    .map { UiState.Content(it) }
    .catch { emit(UiState.Error(it.message)) }       // handle before onCompletion
    .onCompletion { cause -> if (cause != null) log("flow ended: $cause") }
    .collect { render(it) }`,
      },
      {
        t: "note",
        text: "Order matters: `onStart`/`onCompletion` and `catch` are order-sensitive because each only sees what's upstream of it. The idiomatic order is `onStart` (loading) → transform → `catch` (errors → error state) → `onCompletion` (observe end). `CancellationException` must be rethrown, never swallowed — the `catch` operator already ignores it correctly, but a manual try/catch around a suspend call must rethrow it.",
      },
    ],
  },
  {
    heading: "Testing flows — Turbine and virtual time",
    blocks: [
      {
        t: "p",
        text: "Flows are tested inside `runTest` (which provides a `TestScope` with **virtual time** — `delay`s complete instantly by advancing a virtual clock). Collecting a flow and asserting its emissions is far cleaner with **Turbine**, a small library that turns collection into an await-based API.",
      },
      {
        t: "code",
        title: "Testing a flow with Turbine",
        code: `@Test
fun searchEmitsLoadingThenResults() = runTest {
    val viewModel = SearchViewModel(FakeRepository(results = listOf(item)))

    viewModel.uiState.test {                     // Turbine: collect the flow
        assertEquals(SearchState.Loading, awaitItem())
        viewModel.onQueryChange("kotlin")
        advanceTimeBy(300)                        // skip debounce via virtual time
        assertEquals(SearchState.Results(listOf(item)), awaitItem())
        cancelAndIgnoreRemainingEvents()
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Turbine basics**: `flow.test { }` collects the flow; inside, `awaitItem()` gets the next emission, `awaitComplete()` asserts completion, `awaitError()` asserts an exception, `expectNoEvents()` asserts nothing emitted. It fails the test if you leave unconsumed events (catching over-emission).",
          "**Virtual time**: `runTest` runs `delay`s instantly by advancing a virtual clock; `advanceTimeBy(ms)` / `advanceUntilIdle()` let you test `debounce`, `sample`, and retry backoff *deterministically and fast* — no real waiting.",
          "**The `stateIn(WhileSubscribed)` gotcha**: such a flow is cold until collected, so asserting `.value` right after construction sees only the `initialValue`. You must *collect* it (Turbine's `.test { }`, or `backgroundScope.launch { flow.collect() }`) to start the upstream and see real emissions.",
          "**Inject a TestDispatcher**: with `viewModelScope` (which uses `Dispatchers.Main`), install `Dispatchers.setMain(StandardTestDispatcher())` via a JUnit rule so virtual time controls the ViewModel's coroutines; use `StandardTestDispatcher` when you need to assert intermediate states, `UnconfinedTestDispatcher` for eager execution.",
        ],
      },
    ],
  },
];

export default content;
