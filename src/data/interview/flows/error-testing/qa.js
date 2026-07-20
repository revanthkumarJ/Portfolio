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
  {
    level: "junior",
    q: "What does the catch operator catch, and how do you emit a fallback?",
    a: [
      {
        t: "p",
        text: "`catch { e -> }` handles exceptions from *upstream* (the producer and operators above it) — this is exception transparency. Inside the `catch` block you can `emit` a fallback value, rethrow, or log. It does *not* catch exceptions thrown in the *collector* (downstream); use `try/catch` around `collect` for those.",
      },
      {
        t: "code",
        title: "catch with a fallback",
        code: `repository.dataFlow()
    .map { transform(it) }
    .catch { e ->
        log(e)
        emit(fallbackData)        // provide a default and continue
    }
    .collect { render(it) }       // an exception HERE isn't caught above`,
      },
      {
        t: "list",
        items: [
          "**Catches upstream** — producer/operators above the `catch`.",
          "**Can `emit`** — supply a fallback value to keep the flow going.",
          "**Can rethrow** — `throw e` to propagate (or rethrow specific types).",
          "**Not downstream** — collector exceptions need `try/catch` around `collect`.",
        ],
      },
      {
        t: "note",
        text: "catch { e -> } handles UPSTREAM exceptions (producer + operators above — exception transparency); inside you can emit a fallback, rethrow, or log. It does NOT catch collector (downstream) exceptions — wrap collect in try/catch for those. Placement matters: catch handles failures above it.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between retry and retryWhen?",
    a: [
      {
        t: "p",
        text: "`retry(n) { cause -> Boolean }` re-collects the flow up to `n` times, retrying only if the predicate returns true for the exception. `retryWhen { cause, attempt -> Boolean }` is the flexible version — it gives you both the exception *and* the attempt number, so you can implement backoff (delay based on attempt) and conditional retry logic.",
      },
      {
        t: "code",
        title: "retry vs retryWhen",
        code: `// retry: fixed count, predicate on the exception
flow.retry(3) { it is IOException }

// retryWhen: exception + attempt index, for backoff
flow.retryWhen { cause, attempt ->
    if (cause is IOException && attempt < 3) { delay(1000 * (attempt + 1)); true } else false
}`,
      },
      {
        t: "list",
        items: [
          "**`retry(n) { }`** — up to n retries; predicate decides per exception.",
          "**`retryWhen { cause, attempt -> }`** — access the attempt number for backoff and caps.",
          "**Backoff lives in `retryWhen`** — `delay` before returning `true`.",
          "**Retry re-collects** — the whole upstream re-runs (a fresh network call, etc.).",
        ],
      },
      {
        t: "note",
        text: "retry(n) { cause -> } re-collects up to n times if the predicate matches. retryWhen { cause, attempt -> } also gives the attempt index, enabling backoff (delay before returning true) and caps. Both re-run the whole upstream. Use retryWhen for exponential backoff + conditional retry.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you implement exponential backoff with jitter for a flaky flow?",
    a: [
      {
        t: "p",
        text: "Use `retryWhen`, delaying by an exponentially increasing amount plus randomness (jitter) before each retry, and only retry transient errors up to a cap. Jitter prevents many clients retrying in sync (thundering herd). After the cap, let the exception propagate to a `catch` that surfaces an error state.",
      },
      {
        t: "code",
        title: "Backoff with jitter",
        code: `flow
    .retryWhen { cause, attempt ->
        if (cause is IOException && attempt < 3) {
            val backoff = (1000L * (1 shl attempt.toInt())) + Random.nextLong(0, 500)
            delay(backoff)   // 1s, 2s, 4s (+ jitter)
            true
        } else false
    }
    .catch { emit(UiState.Error) }   // give up after retries`,
      },
      {
        t: "list",
        items: [
          "**Exponential** — `base * 2^attempt`; spreads retries out.",
          "**Jitter** — add randomness to avoid synchronized retries.",
          "**Transient only** — retry `IOException`/5xx, not client errors.",
          "**Cap + `catch`** — stop after N attempts and surface an error state.",
        ],
      },
      {
        t: "note",
        text: "retryWhen with delay = base * 2^attempt + random jitter, retrying only transient errors (IOException/5xx) up to a cap, then let it propagate to catch (error state). Exponential spreads retries; jitter avoids a thundering herd of synchronized clients. Don't retry client errors.",
      },
    ],
  },
  {
    level: "senior",
    q: "What does onCompletion's cause tell you, and how does it differ from catch and finally?",
    a: [
      {
        t: "p",
        text: "`onCompletion { cause -> }` runs when the flow finishes for *any* reason and gives the `cause`: `null` for success, or the exception for failure/cancellation. Unlike `catch`, it does *not* handle the exception (it can't emit a fallback to recover) — it's for cleanup/logging on completion. It's the flow analog of `finally`, but with knowledge of *why* it ended.",
      },
      {
        t: "code",
        title: "onCompletion for cleanup",
        code: `flow
    .onCompletion { cause ->
        if (cause == null) log("done") else log("ended with \$cause")
        hideLoading()      // cleanup regardless of outcome
    }
    .catch { emit(fallback) }   // catch (below) actually handles the error`,
      },
      {
        t: "list",
        items: [
          "**Runs on any completion** — success, error, or cancellation; `cause` distinguishes.",
          "**Doesn't handle** — it observes; `catch` is what recovers/emits fallbacks.",
          "**Placement vs `catch`** — put `onCompletion` where you want completion observed; `catch` catches upstream of it.",
          "**Use** — hide loading spinner, logging, releasing resources on completion.",
        ],
      },
      {
        t: "note",
        text: "onCompletion { cause -> } runs on any finish (success=null, else the exception/cancellation) — for cleanup/logging, like finally-with-a-reason. It does NOT handle the error (can't emit a recovery) — that's catch's job. Use onCompletion to hide loading/log; catch to recover.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle per-item errors without stopping the whole flow?",
    a: [
      {
        t: "p",
        text: "Wrap each item's risky processing in a `map` that produces a `Result` (or catches locally), so a single item's failure becomes a value rather than terminating the flow. A `catch` operator, by contrast, ends the flow on the first upstream error — so for 'skip the bad ones, keep going', handle errors *inside* the transform.",
      },
      {
        t: "code",
        title: "Per-item error as a value",
        code: `flow
    .map { item -> runCatching { process(item) } }   // failure -> Result.failure, flow continues
    .collect { result ->
        result.onSuccess { render(it) }.onFailure { logSkipped(it) }
    }`,
      },
      {
        t: "list",
        items: [
          "**Errors as values per item** — `map { runCatching { ... } }` keeps the flow alive.",
          "**`catch` ends the flow** — it's for terminal failure handling, not skipping items.",
          "**Rethrow cancellation** — `runCatching` swallows `CancellationException`; guard if needed.",
          "**Use** — processing a stream where individual failures are tolerable (skip and continue).",
        ],
      },
      {
        t: "note",
        text: "Handle per-item errors INSIDE a transform: map { runCatching { process(it) } } turns a failure into a Result value so the flow continues (skip bad items). catch ends the flow on the first error — wrong for 'skip and continue'. Watch runCatching swallowing CancellationException.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between the catch operator and try/catch around collect?",
    a: [
      {
        t: "p",
        text: "The `catch` *operator* handles exceptions from *upstream* (producer/operators) and can emit fallbacks to keep the flow going. A `try/catch` around `collect` handles exceptions from the *collector block* (and upstream if there's no `catch`), but can't emit into the flow — it just handles the terminal failure. Use `catch` for upstream recovery; `try/catch` for the collection site.",
      },
      {
        t: "code",
        title: "Two error boundaries",
        code: `// Operator: upstream, can emit fallback
flow.catch { emit(fallback) }.collect { render(it) }

// try/catch: handles collector errors (and uncaught upstream)
try {
    flow.collect { render(it) }   // if render throws, caught here
} catch (e: Exception) { showError() }`,
      },
      {
        t: "list",
        items: [
          "**`catch` operator** — upstream exceptions; can `emit` a fallback; keeps flow alive.",
          "**`try/catch` around `collect`** — collector-block exceptions (and uncaught upstream); terminal handling.",
          "**Combine** — `catch` for producer failures, `try/catch` for rendering failures.",
          "**Placement** — `catch` only sees what's above it in the chain.",
        ],
      },
      {
        t: "note",
        text: "The catch operator handles UPSTREAM exceptions and can emit a fallback (flow continues). try/catch around collect handles the COLLECTOR block's exceptions (and uncaught upstream) but can't emit — terminal handling. Use catch for producer recovery, try/catch for rendering errors; combine both.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you catch errors in a flow without breaking cancellation?",
    a: [
      {
        t: "p",
        text: "Be careful that `catch` and error handling don't swallow `CancellationException`. The `catch` operator itself already *rethrows* `CancellationException` (it only catches real errors), which is correct. But if you use `runCatching` inside a `map` or a broad `try/catch` in the collector, you can swallow cancellation — so rethrow it or catch specific types.",
      },
      {
        t: "list",
        items: [
          "**`catch` operator is safe** — it does not catch `CancellationException` (rethrows it).",
          "**`runCatching` in operators** — swallows cancellation; rethrow `CancellationException` inside.",
          "**Broad collector `try/catch`** — rethrow `CancellationException` first, or catch specific types.",
          "**Goal** — real errors handled, cancellation still propagates so the flow stops.",
        ],
      },
      {
        t: "note",
        text: "The catch operator is cancellation-safe (it rethrows CancellationException, catching only real errors). Danger is elsewhere: runCatching in a map or a broad collector try/catch swallows cancellation — rethrow CancellationException or catch specific types. Keep errors handled while cancellation still propagates.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you retry with a limit and fall back gracefully when it's exhausted?",
    a: [
      {
        t: "p",
        text: "Combine `retry`/`retryWhen` (bounded attempts) with a `catch` that emits a fallback or error state once retries are exhausted. The retry handles transient failures; the `catch` handles the final give-up, so the UI shows an error/cached state rather than crashing.",
      },
      {
        t: "code",
        title: "Retry then fall back",
        code: `repository.stream()
    .retry(3) { it is IOException }        // transient retries
    .catch { emit(UiState.Error(it.message)) }   // give up gracefully
    .collect { render(it) }`,
      },
      {
        t: "list",
        items: [
          "**`retry(n)`** — bounded transient retries.",
          "**`catch`** — after retries fail, emit an error/fallback state.",
          "**Order** — `retry` above `catch` so `catch` handles the exhausted case.",
          "**Cached fallback** — `catch` can emit last-known-good data instead of an error.",
        ],
      },
      {
        t: "note",
        text: "retry(n) { transient } for bounded retries, then catch { emit(Error/cached) } to give up gracefully once exhausted — retry above catch so catch handles the final failure. The UI shows an error or cached state instead of crashing.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is Turbine, and why use it over toList() for testing flows?",
    a: [
      {
        t: "p",
        text: "Turbine is a testing library for flows that lets you assert emissions *one at a time* with `awaitItem()`, `awaitError()`, `awaitComplete()`. It's better than `toList()` for hot flows and infinite flows (which never complete, so `toList()` hangs) and for asserting the *sequence and timing* of emissions interactively, including errors.",
      },
      {
        t: "code",
        title: "Turbine test",
        code: `viewModel.uiState.test {
    assertEquals(UiState.Loading, awaitItem())
    viewModel.load()
    assertEquals(UiState.Content(data), awaitItem())
    cancelAndIgnoreRemainingEvents()
}`,
      },
      {
        t: "list",
        items: [
          "**`awaitItem()`/`awaitError()`/`awaitComplete()`** — assert emissions/errors/completion in order.",
          "**Works for hot/infinite flows** — unlike `toList()`, which needs completion.",
          "**Interactive** — trigger actions between assertions to test reactive sequences.",
          "**`cancelAndIgnoreRemainingEvents()`** — end the test cleanly.",
        ],
      },
      {
        t: "note",
        text: "Turbine tests flows by asserting emissions one at a time (awaitItem/awaitError/awaitComplete), interactively (trigger actions between assertions). Better than toList() for hot/infinite flows (which never complete, so toList hangs) and for asserting emission sequences including errors. End with cancelAndIgnoreRemainingEvents().",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you test a finite flow's emissions with toList()?",
    a: [
      {
        t: "p",
        text: "For a *finite* cold flow, collect all emissions into a list with `toList()` inside `runTest`, then assert the list. It's the simplest approach when the flow completes; it does *not* work for infinite/hot flows (it would wait forever), where you'd use Turbine or `take(n).toList()`.",
      },
      {
        t: "code",
        title: "toList for finite flows",
        code: `@Test fun emitsTransformed() = runTest {
    val result = repository.numbers().map { it * 2 }.toList()
    assertEquals(listOf(2, 4, 6), result)
}
// Infinite flow: bound it first
val firstThree = infiniteFlow.take(3).toList()`,
      },
      {
        t: "list",
        items: [
          "**`toList()`** — gather all emissions from a finite flow; assert the list.",
          "**Finite only** — infinite/hot flows never complete; use `take(n)` or Turbine.",
          "**`runTest`** — virtual clock skips delays for fast tests.",
          "**Simple assertions** — good for pure transformation pipelines.",
        ],
      },
      {
        t: "note",
        text: "toList() collects a FINITE cold flow's emissions into a list to assert (inside runTest). It hangs on infinite/hot flows — bound with take(n).toList() or use Turbine. Great for asserting transformation pipelines; runTest's virtual clock keeps it fast.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a flow that involves delays (debounce, timers)?",
    a: [
      {
        t: "p",
        text: "Run it in `runTest`, which uses a *virtual clock* — `delay`/`debounce` don't wait real time. Advance the clock with `advanceTimeBy(ms)` and `advanceUntilIdle()` to move past debounce windows and timers deterministically, then assert emissions. This makes time-based flow tests instant and reliable.",
      },
      {
        t: "code",
        title: "Testing debounce with virtual time",
        code: `@Test fun debounces() = runTest {
    val flow = queryFlow.debounce(300)
    flow.test {
        queryFlow.value = "a"
        queryFlow.value = "ab"
        advanceTimeBy(301)          // move past the debounce window
        assertEquals("ab", awaitItem())   // only the last survives
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Virtual clock** — `runTest` skips real delays.",
          "**`advanceTimeBy(ms)`** — move past debounce/sample/timer windows precisely.",
          "**`advanceUntilIdle()`** — run all pending scheduled work.",
          "**Deterministic** — no real waiting, no flakiness from timing.",
        ],
      },
      {
        t: "note",
        text: "Test time-based flows in runTest (virtual clock — delays don't wait real time): advanceTimeBy(ms) to move past debounce/sample/timer windows and advanceUntilIdle() for all pending work, then assert. Instant and deterministic — no real waiting or timing flakiness.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a flow that emits an error?",
    a: [
      {
        t: "p",
        text: "Make a fake that throws the error (in the producer), then assert the flow's error handling: with Turbine use `awaitError()` (or `awaitItem()` for a mapped error state), or with `toList()` on a `catch`-guarded flow assert the fallback emission. Verify both that the error is surfaced correctly and that cancellation isn't swallowed.",
      },
      {
        t: "code",
        title: "Testing error emission",
        code: `@Test fun surfacesError() = runTest {
    val flow = flow<Int> { throw IOException() }.catch { emit(-1) }
    assertEquals(listOf(-1), flow.toList())    // fallback emitted
}
@Test fun propagatesError() = runTest {
    flow<Int> { throw IOException() }.test { assertTrue(awaitError() is IOException) }
}`,
      },
      {
        t: "list",
        items: [
          "**Fake throws** — inject a producer that raises the target exception.",
          "**Turbine `awaitError()`** — assert the error type propagates (uncaught flows).",
          "**Assert fallback** — for `catch`-guarded flows, assert the emitted fallback/error state.",
          "**Check cancellation** — ensure error handling doesn't swallow `CancellationException`.",
        ],
      },
      {
        t: "note",
        text: "Inject a fake producer that throws, then assert: Turbine awaitError() for propagated errors, or the emitted fallback/error state for catch-guarded flows (toList/awaitItem). Verify the error surfaces correctly and cancellation isn't swallowed.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a ViewModel that exposes a StateFlow?",
    a: [
      {
        t: "p",
        text: "Set the Main dispatcher to a test dispatcher (`Dispatchers.setMain`), drive the ViewModel, and assert `state.value` after `advanceUntilIdle()` — or collect the sequence with Turbine. For `stateIn(WhileSubscribed)` flows, the upstream only starts with an active collector, so collect in a background job (or read `.value` which activates it) during the test.",
      },
      {
        t: "code",
        title: "StateFlow ViewModel test",
        code: `@get:Rule val mainRule = MainDispatcherRule()

@Test fun loadsContent() = runTest {
    val vm = MyViewModel(FakeRepo(data))
    vm.state.test {
        assertEquals(UiState.Loading, awaitItem())
        assertEquals(UiState.Content(data), awaitItem())
        cancelAndIgnoreRemainingEvents()
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`Dispatchers.setMain`** — so `viewModelScope` runs on the test dispatcher (via a rule).",
          "**Turbine or `.value`** — assert the sequence or the final state.",
          "**`WhileSubscribed` needs a collector** — Turbine's `test { }` provides one; or read `.value` with `advanceUntilIdle`.",
          "**Fakes** — inject fake repositories that return controlled data/errors.",
        ],
      },
      {
        t: "note",
        text: "Test StateFlow ViewModels with a MainDispatcherRule (Dispatchers.setMain), inject fakes, and assert with Turbine's test { awaitItem() } (sequence) or .value after advanceUntilIdle (final). WhileSubscribed upstream needs an active collector — Turbine provides one; otherwise read .value to activate it.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a Channel-based or SharedFlow event stream?",
    a: [
      {
        t: "p",
        text: "Collect the events with Turbine (`test { }`) started *before* triggering the action, then assert each event with `awaitItem()`. Because events aren't replayed (Channel/SharedFlow with replay 0), the collector must be active when the event is emitted — so start collecting first, then perform the action.",
      },
      {
        t: "code",
        title: "Testing events",
        code: `@Test fun emitsNavigateEvent() = runTest {
    viewModel.events.test {
        viewModel.onSaved()                       // trigger AFTER collection starts
        assertEquals(UiEvent.NavigateBack, awaitItem())
        cancelAndIgnoreRemainingEvents()
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Collect first** — start Turbine before triggering, since events aren't replayed.",
          "**`awaitItem()`** — assert each event in order.",
          "**No replay** — a late collector would miss the event; ordering matters in the test.",
          "**Deterministic** — `runTest` + test dispatcher for scheduling.",
        ],
      },
      {
        t: "note",
        text: "Test event streams (Channel/SharedFlow replay 0) with Turbine's test { }, starting collection BEFORE triggering the action (events aren't replayed, so a late collector misses them), then awaitItem() each event. runTest + test dispatcher for deterministic scheduling.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you avoid flaky flow tests?",
    a: [
      {
        t: "p",
        text: "Use `runTest`'s virtual clock (never `Thread.sleep` or real delays), inject test dispatchers so all coroutines share the same scheduler, set the Main dispatcher via `setMain`, and use Turbine or `advanceUntilIdle()` to synchronize rather than racing. Flakiness usually comes from real timing, uncontrolled dispatchers, or asserting before work completes.",
      },
      {
        t: "list",
        items: [
          "**Virtual time** — `runTest` + `advanceTimeBy`/`advanceUntilIdle`; no real delays.",
          "**Injected test dispatchers** — share the `testScheduler`; `setMain` for `viewModelScope`.",
          "**Synchronize, don't race** — Turbine `awaitItem`/`advanceUntilIdle` instead of sleeping.",
          "**Deterministic fakes** — controlled data/errors, no real network/DB.",
        ],
      },
      {
        t: "note",
        text: "Avoid flaky flow tests with runTest's virtual clock (no Thread.sleep/real delays), injected test dispatchers sharing the testScheduler, Dispatchers.setMain for viewModelScope, and Turbine/advanceUntilIdle to synchronize instead of racing. Flakiness comes from real timing, uncontrolled dispatchers, or asserting too early.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a combine or flatMapLatest pipeline?",
    a: [
      {
        t: "p",
        text: "Drive the *input* flows (e.g. `MutableStateFlow`s or `MutableSharedFlow`s) with controlled values inside `runTest`, and assert the combined output with Turbine. Emit values to the inputs step by step and check that the pipeline recomputes correctly, using `advanceUntilIdle()`/`advanceTimeBy` to handle any `debounce`.",
      },
      {
        t: "code",
        title: "Testing a combine",
        code: `@Test fun combinesInputs() = runTest {
    val a = MutableStateFlow(1); val b = MutableStateFlow(10)
    val combined = combine(a, b) { x, y -> x + y }
    combined.test {
        assertEquals(11, awaitItem())
        a.value = 2
        assertEquals(12, awaitItem())
        cancelAndIgnoreRemainingEvents()
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Controllable inputs** — `MutableStateFlow`/`MutableSharedFlow` you push values to.",
          "**Turbine** — assert the combined emissions after each input change.",
          "**Virtual time** — advance past any `debounce` in the pipeline.",
          "**`flatMapLatest`** — verify the previous inner flow is cancelled when the trigger changes.",
        ],
      },
      {
        t: "note",
        text: "Test combine/flatMapLatest pipelines by driving controllable input flows (MutableStateFlow/SharedFlow) with values in runTest and asserting the output via Turbine, advancing virtual time past any debounce. For flatMapLatest, verify the prior inner flow is cancelled when the trigger changes.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you observe or log errors in a flow without consuming them?",
    a: [
      {
        t: "p",
        text: "Use `catch { e -> log(e); throw e }` — the `catch` operator can log (or report) the exception and then *rethrow* it so downstream handling still occurs. Or use `onCompletion { cause -> if (cause != null) log(cause) }` to observe failures on completion without altering propagation.",
      },
      {
        t: "code",
        title: "Log then rethrow",
        code: `flow
    .catch { e -> analytics.logError(e); throw e }   // observe, then propagate
    .onCompletion { cause -> if (cause != null) log("ended: \$cause") }
    .collect { render(it) }`,
      },
      {
        t: "list",
        items: [
          "**`catch { log; throw e }`** — observe and rethrow (doesn't consume).",
          "**`onCompletion { cause }`** — log failures on completion without changing flow.",
          "**Rethrow to preserve handling** — downstream `catch`/`try` still runs.",
          "**Don't swallow** — logging-only shouldn't accidentally recover the error.",
        ],
      },
      {
        t: "note",
        text: "Log without consuming: catch { e -> log(e); throw e } (observe then rethrow so downstream handling still runs) or onCompletion { cause -> log if non-null } (observe on completion without altering propagation). Rethrow to preserve error handling; don't accidentally recover.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you verify a shared flow makes only one network call for multiple collectors?",
    a: [
      {
        t: "p",
        text: "Use a fake repository/data source that *counts* invocations, collect the shared flow from multiple collectors in the test, and assert the count is 1. This verifies that `shareIn`/`stateIn` truly shares one upstream execution rather than re-running it per collector.",
      },
      {
        t: "code",
        title: "Assert single upstream execution",
        code: `@Test fun sharesUpstream() = runTest {
    var calls = 0
    val shared = flow { calls++; emit(fetch()) }
        .shareIn(this, SharingStarted.Lazily, replay = 1)
    shared.first(); shared.first()         // two collectors
    advanceUntilIdle()
    assertEquals(1, calls)                 // upstream ran once
}`,
      },
      {
        t: "list",
        items: [
          "**Counting fake** — increment on each upstream execution.",
          "**Multiple collectors** — collect the shared flow more than once.",
          "**Assert count == 1** — proves sharing (vs cold re-execution).",
          "**Contrast** — the same test on a cold flow would count 2.",
        ],
      },
      {
        t: "note",
        text: "Use a fake that counts upstream invocations, collect the shared flow from multiple collectors in runTest, and assert the count is 1 — proving shareIn/stateIn shares one execution (a cold flow would count per collector). Verifies you fixed duplicate network calls.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test that a flow stops when its scope is cancelled?",
    a: [
      {
        t: "p",
        text: "Collect the flow in a `launch` within `runTest`, then cancel that job and assert no further emissions are processed (e.g. via a counter or a fake that records how far the upstream got). This verifies structured cancellation — the flow's collection and upstream stop when the scope/job is cancelled.",
      },
      {
        t: "code",
        title: "Cancellation stops collection",
        code: `@Test fun stopsOnCancel() = runTest {
    var collected = 0
    val job = launch { infiniteFlow.collect { collected++ } }
    advanceTimeBy(100)
    job.cancelAndJoin()
    val countAtCancel = collected
    advanceTimeBy(1000)
    assertEquals(countAtCancel, collected)   // no more emissions after cancel
}`,
      },
      {
        t: "list",
        items: [
          "**Collect in a job** — `launch { flow.collect { } }`.",
          "**Cancel the job** — `cancelAndJoin()`.",
          "**Assert no further work** — the count stops advancing.",
          "**Verifies structured cancellation** — upstream stops with the collector.",
        ],
      },
      {
        t: "note",
        text: "Collect the flow in a launch within runTest, cancelAndJoin() the job, then advance time and assert no further emissions were processed (via a counter/fake) — verifying the flow's collection and upstream stop when the scope is cancelled (structured cancellation).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you provide a fallback value when a flow fails?",
    a: [
      {
        t: "p",
        text: "Use `catch { emit(fallback) }` to emit a default/cached value when the upstream errors, keeping the flow alive so the UI shows something useful. For a 'last known good' fallback, emit cached data; for an error state, emit an `Error` variant of your UiState.",
      },
      {
        t: "code",
        title: "catch fallback",
        code: `repository.config()
    .catch { emit(cachedConfig ?: Config.DEFAULT) }   // fallback on error
    .collect { apply(it) }`,
      },
      {
        t: "list",
        items: [
          "**`catch { emit(...) }`** — supply a fallback value on upstream error.",
          "**Cached fallback** — serve last-known-good data (offline-friendly).",
          "**Error state** — or emit a `UiState.Error` for the UI to render.",
          "**Rethrow bugs** — only fall back for expected errors; rethrow unexpected ones if appropriate.",
        ],
      },
      {
        t: "note",
        text: "catch { emit(fallback) } supplies a default/cached value when the upstream errors, keeping the flow alive (offline-friendly last-known-good, or a UiState.Error). Fall back for expected errors; consider rethrowing unexpected bugs rather than masking them.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why does the placement of catch matter, and where should it go in a pipeline?",
    a: [
      {
        t: "p",
        text: "Because `catch` only handles exceptions from operators *above* it (exception transparency), its position determines which failures it catches. A `catch` at the very end catches everything upstream; a `catch` in the middle catches only the operators above it, letting you handle a specific stage's errors while allowing later stages to fail differently.",
      },
      {
        t: "code",
        title: "Placement changes coverage",
        code: `flow
    .map { risky1(it) }
    .catch { emit(fallback1) }    // catches only risky1 (and producer)
    .map { risky2(it) }           // a failure HERE is NOT caught above
    .catch { emit(fallback2) }    // catches risky2`,
      },
      {
        t: "list",
        items: [
          "**Catches upstream only** — operators above the `catch`.",
          "**End placement** — one `catch` at the end handles all upstream failures.",
          "**Mid-pipeline** — scope error handling to a specific stage.",
          "**In `flatMapLatest`** — put `catch` *inside* the inner flow so one failed item doesn't kill the whole search pipeline.",
        ],
      },
      {
        t: "note",
        text: "catch handles only exceptions from operators ABOVE it (exception transparency), so placement decides coverage: end placement catches all upstream; mid-pipeline scopes handling to a stage. Crucially, in a flatMapLatest search, put catch INSIDE the inner flow so one failed search doesn't terminate the whole pipeline.",
      },
    ],
  },
  {
    level: "junior",
    q: "What do onStart and onCompletion do together for loading UI?",
    a: [
      {
        t: "p",
        text: "`onStart { }` runs before the first emission (emit a Loading state, show a spinner), and `onCompletion { }` runs when the flow finishes (hide the spinner). Together they bracket the flow's active period — a clean way to manage loading indicators declaratively around a data stream.",
      },
      {
        t: "code",
        title: "Loading bracket",
        code: `repository.data()
    .onStart { emit(UiState.Loading) }        // before first value
    .onCompletion { /* hide spinner / log */ }// on finish (any reason)
    .catch { emit(UiState.Error) }
    .collect { render(it) }`,
      },
      {
        t: "list",
        items: [
          "**`onStart`** — runs (and can emit) before the upstream; ideal for Loading.",
          "**`onCompletion { cause }`** — runs on completion/error/cancellation; hide loading, log.",
          "**Declarative loading** — brackets the flow without manual flags.",
          "**Order** — `onStart`/`onCompletion` see upstream below them; place thoughtfully with `catch`.",
        ],
      },
      {
        t: "note",
        text: "onStart { emit(Loading) } runs before the first emission (show spinner); onCompletion { cause } runs on any finish (hide spinner, log). Together they bracket the flow's active period for declarative loading UI, paired with catch for the error state.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test retry logic in a flow?",
    a: [
      {
        t: "p",
        text: "Use a fake that fails a set number of times then succeeds (a call counter), collect the flow with the retry operator in `runTest`, advance virtual time past the backoff `delay`s, and assert both the final success emission and the number of attempts. This verifies the retry count, backoff timing, and that it eventually succeeds or gives up.",
      },
      {
        t: "code",
        title: "Testing retry",
        code: `@Test fun retriesThenSucceeds() = runTest {
    var attempts = 0
    val flow = flow {
        attempts++
        if (attempts < 3) throw IOException() else emit("ok")
    }.retryWhen { cause, a -> if (cause is IOException && a < 3) { delay(1000); true } else false }

    flow.test {
        assertEquals("ok", awaitItem())
        awaitComplete()
    }
    assertEquals(3, attempts)   // failed twice, succeeded on the third
}`,
      },
      {
        t: "list",
        items: [
          "**Failing-then-succeeding fake** — count attempts; throw N times, then emit.",
          "**Advance virtual time** — `runTest` skips the backoff `delay`s.",
          "**Assert attempts + result** — verify retry count and eventual success/give-up.",
          "**Test the give-up path** — a fake that always fails should surface the error after the cap.",
        ],
      },
      {
        t: "note",
        text: "Test retry with a fake that fails N times then succeeds (attempt counter): collect with the retry operator in runTest (virtual time skips backoff delays), assert the final emission and attempt count. Also test the give-up path (always-failing fake surfaces the error after the cap).",
      },
    ],
  },
];

export default qa;
