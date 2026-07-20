// Flow Operators — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is the difference between map and transform?",
    a: [
      {
        t: "p",
        text: "**The concept**: both transform values flowing through a pipeline, but they differ in how many values they can produce per input. `map { }` is strictly **one-to-one** — each upstream value becomes exactly one downstream value. `transform { }` is the general form: for each upstream value you can call `emit` **zero, one, or many** times, producing any number of downstream values.",
      },
      {
        t: "code",
        title: "map is 1:1, transform is 1:many (or 1:0)",
        code: `flowOf(1, 2).map { it * 10 }          // 10, 20  (one out per one in)

flowOf(1, 2).transform { n ->
    emit(n)                              // pass through
    emit(n * 10)                         // AND an extra value
}                                        // 1, 10, 2, 20`,
      },
      {
        t: "p",
        text: "In fact `map` and `filter` are both implemented on top of `transform` — `map` just emits once, `filter` emits zero-or-one based on the predicate. You reach for `transform` directly only when the 1:1 shape doesn't fit: emitting a loading placeholder before a value, expanding one value into several, or conditionally emitting a variable number. For everyday 'change each value', `map` is clearer.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does debounce do, and how is it different from sample?",
    a: [
      {
        t: "p",
        text: "**`debounce(ms)`** emits a value only after the flow has been *silent* for `ms` — every new value resets the timer. It's the 'wait until they stop' operator: in a search box, `debounce(300)` means you only search after the user pauses typing for 300ms, so you don't fire a request per keystroke.",
      },
      {
        t: "p",
        text: "**`sample(ms)`** is different: it emits the *most recent* value on a fixed periodic tick, every `ms`, regardless of whether emissions are ongoing. Debounce reacts to *pauses*; sample takes *regular snapshots*. Example contrast: for a fast-moving sensor emitting continuously, `debounce` might emit *nothing* (there's never a pause) while `sample(1000)` gives you the latest reading once a second. Rule of thumb: use `debounce` to wait out bursts of activity (typing, rapid clicks); use `sample` to throttle a continuous stream to a manageable rate.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does distinctUntilChanged do and why is it useful?",
    a: [
      {
        t: "p",
        text: "**The concept**: `distinctUntilChanged()` suppresses *consecutive* duplicate values — it only lets a value through if it's different from the one immediately before it (by `equals`). Note 'consecutive': `1,1,2,2,1` becomes `1,2,1` (the final 1 passes because the value right before it was 2). It's not global deduplication.",
      },
      {
        t: "p",
        text: "**Why it's useful**: it prevents redundant downstream work when a source re-emits the same value. A common case: a flow derived with `map` might produce the same result for several different upstream values (e.g. mapping user objects to just their `isPremium` flag), and you don't want to re-render or re-query when nothing meaningful changed. `distinctUntilChangedBy { it.id }` compares by a key instead of the whole object. Worth knowing: `StateFlow` already has this behavior built in (it never emits a value equal to the current one), so you add `distinctUntilChanged` mainly on plain cold flows or after a `map` that collapses distinctions.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you combine two flows into one? When would you use combine?",
    a: [
      {
        t: "p",
        text: "**The concept**: `combine` merges multiple flows by taking the *latest value of each* and running your lambda whenever *any* of them emits. It's how you compose one derived value out of several independent streams. The most common Android use is building a single `UiState` from separate sources:",
      },
      {
        t: "code",
        title: "combine to build UI state from several streams",
        code: `combine(
    userRepository.observeUser(),
    settingsRepository.observeSettings(),
    cartRepository.observeCart(),
) { user, settings, cart ->
    HomeUiState(name = user.name, darkMode = settings.dark, cartCount = cart.size)
}.collect { render(it) }`,
      },
      {
        t: "p",
        text: "So whenever the user, settings, *or* cart changes, `combine` recomputes `HomeUiState` with the latest of all three. Two things to remember: it only starts emitting once *every* input has emitted at least once (so give sources an initial value if you need output before all have fired), and it always uses the newest value of each — it doesn't pair them up. That last point is what distinguishes it from `zip`, which pairs values one-to-one and waits for a fresh value from *both* before emitting.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does onEach do, and how is it different from map?",
    a: [
      {
        t: "p",
        text: "**`onEach { }`** runs a side effect for each value and passes the value through **unchanged** — the flow's type and values are identical before and after. **`map { }`** *transforms* each value into a (possibly different) new value, changing the stream. So `onEach` is for doing something *with* each value (logging, analytics, triggering an update) without altering the stream, while `map` is for *producing* new values.",
      },
      {
        t: "p",
        text: "Two practical notes: `onEach` is excellent for debugging a pipeline — drop `.onEach { println(it) }` anywhere to peek at values at that stage without disturbing anything. And `onEach` combined with `launchIn(scope)` is a very common idiom: `flow.onEach { updateState(it) }.launchIn(viewModelScope)` starts collecting in a scope and handles each value, equivalent to `viewModelScope.launch { flow.collect { updateState(it) } }` but flatter.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain flatMapConcat, flatMapMerge, and flatMapLatest. When do you use each?",
    a: [
      {
        t: "p",
        text: "**The setup**: you use a flatMap operator when each value in a flow maps to *another flow* (a userId → a flow of that user's data), producing a `Flow<Flow<T>>` you need flattened to `Flow<T>`. The three variants differ entirely in **what happens when a new value arrives while the previous inner flow is still running** — that's the whole distinction.",
      },
      {
        t: "list",
        items: [
          "**`flatMapConcat`** — *sequential/queued*. It fully collects the current inner flow before starting the next. New upstream values wait their turn. Use when **order matters** and inner flows must not overlap — e.g. processing a queue of operations where each must complete before the next.",
          "**`flatMapMerge`** — *concurrent*. It starts inner flows as values arrive and runs them **simultaneously**, interleaving their emissions (with an optional `concurrency` limit). Use for **parallel fan-out where order is irrelevant** — e.g. kicking off several independent fetches at once. Watch out: unbounded concurrency over a large upstream can launch too many parallel operations.",
          "**`flatMapLatest`** — *cancel-and-replace*. When a new value arrives, it **cancels the current inner flow** and starts a fresh one for the new value. Use when **only the latest matters** — search-as-you-type, reacting to the latest selected item. It kills the stale-result race where an old, slow inner flow finishes after a newer one and overwrites correct data.",
        ],
      },
      {
        t: "code",
        title: "The definitive example — search",
        code: `queryFlow
    .debounce(300)
    .flatMapLatest { query ->            // old search cancelled on new query
        repository.search(query)         // returns Flow<Results>
    }
    .collect { showResults(it) }`,
      },
      {
        t: "p",
        text: "**Mnemonic**: Concat = queue (one at a time, ordered), Merge = parallel (all at once, unordered), Latest = cancel-and-replace (only the newest). `flatMapLatest` is by far the most common in UI code; `flatMapConcat` when sequencing is required; `flatMapMerge` for deliberate parallelism.",
      },
    ],
  },
  {
    level: "senior",
    q: "Deep-dive combine vs zip vs merge — the exact semantics and a pitfall of each.",
    a: [
      {
        t: "list",
        items: [
          "**`combine`** — emits whenever *any* input emits, using the *latest* value of *every* input. It waits until all inputs have emitted at least once before the first emission. **Pitfall**: because it uses latest-of-each, rapid emissions on one input can produce combinations you didn't 'intend' pairing-wise, and if one input never emits, `combine` never emits at all (a flow that's slow to produce its first value blocks all output — give it an initial/`onStart` value). It's the right tool for deriving UI state, wrong for strict pairing.",
          "**`zip`** — emits only when it can form a *new pair*: it takes the next value from each input and pairs them 1:1, waiting for both. **Pitfall**: it advances in lockstep and **completes when the shortest flow completes**, so mismatched-length or mismatched-rate flows leave values unpaired and dropped. It's for positional correspondence (value #n of A with value #n of B), not for reacting to whichever changed.",
          "**`merge`** — takes several flows of the *same type* and **interleaves** all their values into one stream, no pairing, no transformation, emitting each value as it arrives from any source. **Pitfall**: you lose track of which source a value came from (wrap values in a sealed type if you need to know), and a fast source can dominate the merged stream.",
        ],
      },
      {
        t: "p",
        text: "**The one-line differentiator**: `combine` = 'latest of each, recompute on any change' (for derived state); `zip` = 'strict 1:1 pairing, waits for both, stops at shorter' (for positional pairing); `merge` = 'flatten many into one interleaved stream' (for pooling same-typed events). The interview trap is using `combine` when you meant `zip` (getting extra recompositions) or `zip` when you meant `combine` (getting stuck waiting for a slow input).",
      },
    ],
  },
  {
    level: "senior",
    q: "Build a debounced, cancel-stale search pipeline with flow operators and explain each operator's role.",
    a: [
      {
        t: "code",
        title: "The production-grade search pipeline",
        code: `val results: StateFlow<SearchUiState> = queryFlow
    .debounce(300)                          // 1
    .distinctUntilChanged()                 // 2
    .flatMapLatest { query ->               // 3
        if (query.length < 2) flowOf(SearchUiState.Empty)
        else repository.search(query)       // returns Flow<Results>
            .map { SearchUiState.Results(it) }
            .onStart { emit(SearchUiState.Loading) }   // 4
            .catch { emit(SearchUiState.Error(it.message)) } // 5
    }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), SearchUiState.Empty) // 6`,
      },
      {
        t: "list",
        items: [
          "**1 — `debounce(300)`**: waits until the user pauses typing, so you issue at most one search per burst of keystrokes instead of one per letter. The single biggest reduction in wasted requests.",
          "**2 — `distinctUntilChanged`**: if the debounced query equals the last one searched (e.g. they typed and deleted a character), skip re-searching — no redundant work.",
          "**3 — `flatMapLatest`**: the crux. When a new query arrives, it **cancels the in-flight search** for the old query. This eliminates the stale-result race (a slow old response arriving after a newer one) *and* saves the abandoned request's remaining work.",
          "**4 — `onStart { emit(Loading) }`**: emits a loading state as each new search begins, so the UI shows a spinner immediately.",
          "**5 — `catch` inside the inner flow**: placing `catch` on the *inner* flow means an error in one search maps to an error state without tearing down the whole outer pipeline — the next keystroke can still search. A `catch` on the outer flow would end everything permanently after the first error.",
          "**6 — `stateIn(WhileSubscribed(5000))`**: converts the cold pipeline into a hot `StateFlow` the UI observes, keeping it alive across configuration changes (the 5s window) but stopping the upstream when the screen is truly gone.",
        ],
      },
      {
        t: "p",
        text: "The senior signal is (a) reaching for `flatMapLatest` specifically for cancellation, (b) placing `catch` on the *inner* flow so errors are recoverable, and (c) knowing why `debounce` + `distinctUntilChanged` come *before* the flatMap (filter the query stream before spending a request). Each operator maps to a concrete failure it prevents — wasted requests, stale results, unrecoverable errors, lost state on rotation.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is mapLatest, and how does it differ from map?",
    a: [
      {
        t: "p",
        text: "`map` transforms every value and waits for each transformation to finish before the next. `mapLatest` *cancels* the in-progress transformation when a new value arrives and restarts with the newest — so if a value's mapping is slow (a suspend call) and a newer value comes, the stale one is abandoned. It's the transform-side equivalent of `collectLatest`.",
      },
      {
        t: "code",
        title: "map vs mapLatest",
        code: `// map: awaits each transform fully
query.map { slowLookup(it) }        // every query's lookup completes

// mapLatest: cancels the previous transform when a new value arrives
query.mapLatest { slowLookup(it) }  // only the latest query's lookup survives`,
      },
      {
        t: "list",
        items: [
          "**`map`** — 1→1, awaits each; no cancellation of prior work.",
          "**`mapLatest`** — cancels the previous (suspending) transform when a newer value arrives.",
          "**Use `mapLatest`** — search/lookup where only the latest input matters.",
          "**Related** — `transformLatest`, `flatMapLatest`, `collectLatest` share the cancel-on-new behavior.",
        ],
      },
      {
        t: "note",
        text: "map transforms every value, awaiting each; mapLatest cancels the in-progress (suspending) transform when a newer value arrives and restarts with the latest — the transform-side collectLatest. Use mapLatest for search/lookup where only the newest input matters; the *Latest family all cancel-and-restart.",
      },
    ],
  },
  {
    level: "junior",
    q: "What do mapNotNull, filterNotNull, and filterIsInstance do?",
    a: [
      {
        t: "p",
        text: "These combine transformation/filtering with type or null handling. `mapNotNull { }` transforms and drops results that are `null`; `filterNotNull()` drops null emissions; `filterIsInstance<T>()` keeps only emissions of a given type (and smart-casts them). They're concise ways to clean or narrow a stream.",
      },
      {
        t: "code",
        title: "Cleaning a stream",
        code: `flow.mapNotNull { parseOrNull(it) }        // transform, drop nulls
flow.filterNotNull()                        // drop null values
events.filterIsInstance<ClickEvent>()       // keep only ClickEvents (typed)`,
      },
      {
        t: "list",
        items: [
          "**`mapNotNull { }`** — map, then drop `null` results in one step.",
          "**`filterNotNull()`** — remove null emissions from a `Flow<T?>` → `Flow<T>`.",
          "**`filterIsInstance<T>()`** — keep only values of type `T`, typed as `T` downstream.",
          "**Use** — narrowing a heterogeneous event flow, dropping unparseable items.",
        ],
      },
      {
        t: "note",
        text: "mapNotNull { } maps and drops null results; filterNotNull() removes nulls (Flow<T?> → Flow<T>); filterIsInstance<T>() keeps only values of a type (smart-cast downstream). Concise ways to clean/narrow a stream — e.g. drop unparseable items or filter a heterogeneous event flow to one type.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does zip pair values, and what happens with different-length flows?",
    a: [
      {
        t: "p",
        text: "`zip` pairs the *nth* emission of one flow with the *nth* emission of another — it waits for both to emit before producing a combined value. When the flows have different lengths, `zip` completes as soon as *either* flow completes, so extra values from the longer flow are dropped. This lockstep pairing differs from `combine`, which emits on *any* change using the latest of each.",
      },
      {
        t: "code",
        title: "zip pairs by index",
        code: `val letters = flowOf("a", "b", "c")
val numbers = flowOf(1, 2)          // shorter
letters.zip(numbers) { l, n -> "\$l\$n" }
    .collect { println(it) }         // a1, b2 — "c" dropped (numbers completed)`,
      },
      {
        t: "list",
        items: [
          "**Index-paired** — nth with nth; waits for both to emit each pair.",
          "**Completes with the shorter** — stops when either flow ends; extras dropped.",
          "**vs `combine`** — combine emits on any source change using the latest of each (not paired).",
          "**Use `zip`** — when values genuinely correspond positionally (two parallel sequences).",
        ],
      },
      {
        t: "note",
        text: "zip pairs nth-with-nth, waiting for both flows to emit each pair; it completes when EITHER flow ends, dropping the longer flow's extras. Contrast combine (emits on any change using the latest of each). Use zip for positionally-corresponding sequences; combine for 'latest of each' state.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you combine three or more flows, and what is combineTransform?",
    a: [
      {
        t: "p",
        text: "`combine` has overloads for multiple flows — `combine(a, b, c) { av, bv, cv -> ... }` — emitting whenever *any* source emits, using the latest of each. `combineTransform` is the flexible version that gives you an `emit` so you can produce zero, one, or many outputs per combination (e.g. emit a loading state then a result).",
      },
      {
        t: "code",
        title: "combine N flows and combineTransform",
        code: `combine(user, settings, notifications) { u, s, n -> ScreenState(u, s, n) }
    .collect { render(it) }

combineTransform(a, b) { av, bv ->
    emit(Loading)
    emit(compute(av, bv))       // multiple emissions per combination
}`,
      },
      {
        t: "list",
        items: [
          "**`combine(a,b,c,...)`** — up to several flows; emits latest-of-each on any change.",
          "**List overload** — `combine(flows) { array -> }` for a dynamic number of flows.",
          "**`combineTransform`** — emit 0/1/many per combination (interstitial states, filtering).",
          "**Common use** — assembling a screen's `UiState` from several independent streams.",
        ],
      },
      {
        t: "note",
        text: "combine(a, b, c) { … } combines multiple flows, emitting latest-of-each on any change (there's also combine(listOfFlows) { array }). combineTransform gives an emit for 0/1/many outputs per combination (e.g. Loading then result). Classic use: build a screen's UiState from several independent streams.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is transformLatest, and when would you use it?",
    a: [
      {
        t: "p",
        text: "`transformLatest { }` is like `transform` (you `emit` freely) but *cancels* the previous transform block when a new upstream value arrives — combining flexible emission with cancel-on-new semantics. Use it when each input triggers a multi-step or long-running emission process that should be abandoned if a newer input comes.",
      },
      {
        t: "code",
        title: "transformLatest",
        code: `queryFlow.transformLatest { query ->
    emit(SearchState.Loading)          // show loading immediately
    delay(300)                          // debounce-ish (cancelled if new query)
    emit(SearchState.Results(search(query)))   // abandoned if a newer query arrives
}`,
      },
      {
        t: "list",
        items: [
          "**Flexible + cancel-on-new** — `emit` any number of values, but a new upstream value cancels the block.",
          "**Use** — search flows that emit Loading then Results, where stale searches must be dropped.",
          "**Family** — alongside `mapLatest`/`flatMapLatest`/`collectLatest`.",
          "**Avoids stale UI** — only the latest input's emissions survive.",
        ],
      },
      {
        t: "note",
        text: "transformLatest { } = transform (emit freely) + cancel-on-new (a new upstream value cancels the current block). Use it when each input drives a multi-step emission (Loading → Results) that should be abandoned if a newer input arrives — e.g. a search that shows loading then results, dropping stale searches.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are runningReduce and runningFold, and how do they relate to scan?",
    a: [
      {
        t: "p",
        text: "`runningFold(initial) { acc, value -> }` is the same as `scan` — it emits each intermediate accumulated value (starting with the initial). `runningReduce { acc, value -> }` is like it but without an initial value (the first emission is the first element). They produce a *stream of accumulations* rather than a single final result.",
      },
      {
        t: "code",
        title: "Running accumulations",
        code: `flowOf(1, 2, 3, 4).runningReduce { acc, x -> acc + x }
    .collect { println(it) }     // 1, 3, 6, 10

flowOf(1, 2, 3).runningFold(100) { acc, x -> acc + x }
    .collect { println(it) }     // 100, 101, 103, 106 (same as scan)`,
      },
      {
        t: "list",
        items: [
          "**`runningFold(initial)` = `scan`** — emits each running accumulation from the seed.",
          "**`runningReduce`** — no seed; first emission is the first value.",
          "**Stream of states** — great for running totals, accumulating lists, building state from events.",
          "**vs `reduce`/`fold`** — those are terminal (one result); these are intermediate (a stream).",
        ],
      },
      {
        t: "note",
        text: "runningFold(initial) is identical to scan — emits each running accumulation from the seed. runningReduce has no seed (first emission = first value). Both are INTERMEDIATE (stream of accumulations) vs terminal reduce/fold (one result). Use for running totals, accumulating lists, or building state from an event stream.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you get the index of each emission (withIndex)?",
    a: [
      {
        t: "p",
        text: "`withIndex()` wraps each emission in an `IndexedValue(index, value)`, giving you a zero-based position alongside the value — useful for numbering, alternating logic, or skipping the first emission by index.",
      },
      {
        t: "code",
        title: "withIndex",
        code: `flow.withIndex().collect { (index, value) ->
    if (index == 0) initialSetup(value) else handle(value)
}`,
      },
      {
        t: "list",
        items: [
          "**`withIndex()`** — emits `IndexedValue(index, value)` with a 0-based index.",
          "**Uses** — numbering, first-vs-rest logic, alternating behavior.",
          "**Destructure** — `collect { (i, v) -> }` for clean access.",
          "**Alternative** — `runningReduce`/an external counter for more complex stateful indexing.",
        ],
      },
      {
        t: "note",
        text: "withIndex() wraps emissions in IndexedValue(index, value) (0-based), destructurable as collect { (i, v) -> }. Use for numbering, first-vs-rest logic, or index-based skipping. For richer stateful counting, use runningReduce or an external counter.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does onEmpty do, and how does it differ from onStart?",
    a: [
      {
        t: "p",
        text: "`onStart { }` runs *before* the first emission (always, even if the flow is empty) — good for emitting an initial/loading value. `onEmpty { }` runs *only if the flow completes without emitting anything* — good for supplying a fallback/empty-state value when there was no data.",
      },
      {
        t: "code",
        title: "onStart vs onEmpty",
        code: `flow
    .onStart { emit(UiState.Loading) }    // always, before upstream
    .onEmpty { emit(UiState.Empty) }      // only if upstream emitted nothing
    .collect { render(it) }`,
      },
      {
        t: "list",
        items: [
          "**`onStart { }`** — runs before the first upstream emission (loading state, logging start).",
          "**`onEmpty { }`** — runs only when the flow completes with zero emissions (empty-state fallback).",
          "**`onCompletion { }`** — runs when the flow finishes (success, error, or cancellation) with the cause.",
          "**Together** — model Loading (onStart) → Content (upstream) / Empty (onEmpty).",
        ],
      },
      {
        t: "note",
        text: "onStart { } runs before the first emission (always — loading state); onEmpty { } runs only if the flow completes with zero emissions (empty-state fallback); onCompletion { cause } runs on any finish. Combine: onStart emits Loading, upstream emits Content, onEmpty emits Empty.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you add a timeout to a Flow?",
    a: [
      {
        t: "p",
        text: "Use the `timeout(duration)` operator, which throws a `TimeoutCancellationException` if the flow doesn't emit within the given time between emissions (or before the first). Combine it with `catch` to convert the timeout into a fallback emission. It bounds how long you'll wait for the next value from a slow or stalled source.",
      },
      {
        t: "code",
        title: "Flow timeout with fallback",
        code: `flow
    .timeout(5.seconds)                    // throws if no emission within 5s
    .catch { e -> if (e is TimeoutCancellationException) emit(cached) else throw e }
    .collect { render(it) }`,
      },
      {
        t: "list",
        items: [
          "**`timeout(duration)`** — errors if the gap between emissions (or to the first) exceeds the limit.",
          "**Pairs with `catch`** — turn a timeout into a fallback value or an error state.",
          "**Per-emission** — it's a between-emissions timeout, not a total-duration cap.",
          "**Alternative** — `withTimeout` around the whole collection for a total bound.",
        ],
      },
      {
        t: "note",
        text: "Flow.timeout(duration) throws TimeoutCancellationException if no emission arrives within the limit (between emissions or before the first); pair with catch to emit a fallback/error state. It's a between-emissions timeout — for a total-duration cap, wrap the whole collect in withTimeout.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is distinctUntilChangedBy, and when do you use it?",
    a: [
      {
        t: "p",
        text: "`distinctUntilChanged()` skips consecutive duplicate emissions (by `equals`). `distinctUntilChangedBy { selector }` skips consecutive emissions that have the same *selected key* — so you can dedupe based on one field (e.g. ignore updates unless the `id` changed), even if other fields differ.",
      },
      {
        t: "code",
        title: "Dedupe by a key",
        code: `userFlow.distinctUntilChangedBy { it.id }        // only emit when id changes
locationFlow.distinctUntilChanged { a, b -> a.roughlyEquals(b) }  // custom equality`,
      },
      {
        t: "list",
        items: [
          "**`distinctUntilChanged()`** — skip consecutive `equals` duplicates.",
          "**`distinctUntilChangedBy { key }`** — skip when the selected key is unchanged.",
          "**Custom comparator** — `distinctUntilChanged { old, new -> ... }` for bespoke equality.",
          "**Uses** — avoid redundant UI updates/network calls when only irrelevant fields changed.",
        ],
      },
      {
        t: "note",
        text: "distinctUntilChanged() skips consecutive equals-duplicates; distinctUntilChangedBy { key } skips when a selected field is unchanged (even if others differ); distinctUntilChanged { old, new -> } uses custom equality. Use to avoid redundant UI updates/network calls when only irrelevant fields changed.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you flatten a Flow<Flow<T>>?",
    a: [
      {
        t: "p",
        text: "Use the flattening operators: `flattenConcat()` (sequential — collect each inner flow fully before the next), `flattenMerge(concurrency)` (concurrent — collect multiple inner flows at once), or the `flatMap*` operators when you also transform. These handle a flow whose values are themselves flows (nested streams).",
      },
      {
        t: "code",
        title: "Flattening nested flows",
        code: `flowOfFlows.flattenConcat()          // sequential
flowOfFlows.flattenMerge(concurrency = 4)   // up to 4 concurrent inner flows
// With transform, use flatMapConcat/Merge/Latest instead:
ids.flatMapMerge { id -> fetchFlow(id) }`,
      },
      {
        t: "list",
        items: [
          "**`flattenConcat()`** — one inner flow at a time, in order.",
          "**`flattenMerge(n)`** — up to `n` inner flows concurrently (order not guaranteed).",
          "**`flatMapConcat`/`flatMapMerge`/`flatMapLatest`** — flatten *and* transform each value into a flow.",
          "**Choose by semantics** — order (Concat), throughput (Merge), latest-only (Latest).",
        ],
      },
      {
        t: "note",
        text: "Flatten a Flow<Flow<T>> with flattenConcat() (sequential, ordered), flattenMerge(concurrency) (concurrent, unordered), or the flatMap* operators when transforming a value into a flow. Choose by semantics: Concat (order), Merge (throughput), Latest (cancel stale, latest only).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do debounce, sample, and throttle differ for high-frequency streams?",
    a: [
      {
        t: "p",
        text: "All three reduce a rapid stream, but differently. `debounce(t)` emits a value only after the stream has been *quiet* for `t` (waits for a pause) — ideal for search-as-you-type. `sample(t)` emits the *latest* value every `t` regardless of pauses — ideal for periodic snapshots of a continuous stream. There's no built-in `throttleFirst`, but the concept (emit the first, then ignore for `t`) is implemented manually or via libraries.",
      },
      {
        t: "table",
        headers: ["Operator", "Emits", "Use"],
        rows: [
          ["debounce(t)", "after t of silence", "search input (wait for typing pause)"],
          ["sample(t)", "latest value every t", "periodic snapshot of a fast stream"],
          ["throttleFirst (manual)", "first, then ignore for t", "prevent double-clicks"],
        ],
      },
      {
        t: "list",
        items: [
          "**`debounce`** — waits for a pause; drops rapid intermediate values; good for text input.",
          "**`sample`** — time-sliced; emits the most recent value each interval; good for continuous sensors/scroll.",
          "**throttle-first** — emit immediately, then ignore for a window; good for click de-bounce (not built-in; roll your own).",
          "**Pick by intent** — 'wait until they stop' (debounce) vs 'check every N ms' (sample).",
        ],
      },
      {
        t: "note",
        text: "debounce(t) emits after t of silence (wait for a pause — search input); sample(t) emits the latest value every t regardless of pauses (periodic snapshot — sensors/scroll); throttle-first (manual) emits the first then ignores for t (double-click guard). Pick by 'wait until they stop' vs 'check every N ms'.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you access the previous emission alongside the current one?",
    a: [
      {
        t: "p",
        text: "Use `runningReduce`/`scan` to carry a pair, or `zip` the flow with itself offset by one. The common idiom is `scan(null to null) { acc, value -> acc.second to value }` producing `(previous, current)` pairs, letting you compare consecutive emissions (deltas, transitions).",
      },
      {
        t: "code",
        title: "Previous + current pairs",
        code: `flow
    .scan<Int, Pair<Int?, Int>>(null to 0) { (_, prev), curr -> prev to curr }
    .drop(1)     // drop the seed
    .collect { (prev, curr) -> println("changed \$prev -> \$curr") }`,
      },
      {
        t: "list",
        items: [
          "**`scan`/`runningReduce`** — carry the previous value in the accumulator, emit `(prev, curr)`.",
          "**`drop(1)`** — discard the seed pair if it's not meaningful.",
          "**Uses** — computing deltas, detecting transitions (e.g. state A→B), diffing consecutive states.",
          "**`zip` self-offset** — an alternative for pairing element n with n+1.",
        ],
      },
      {
        t: "note",
        text: "Carry the previous value with scan/runningReduce, emitting (previous, current) pairs (drop the seed) — for deltas, transitions, or diffing consecutive emissions. scan(prev to curr) { (_, p), c -> p to c } is the idiom; zipping the flow with itself offset by one is an alternative.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you pace or add a delay between emissions?",
    a: [
      {
        t: "p",
        text: "For a flow you build, put `delay` between `emit` calls in the builder. For an existing flow, use `onEach { delay(t) }` to space out emissions. Note that in a sequential flow this delays the whole pipeline (producer and collector share a coroutine), which is usually what you want for pacing.",
      },
      {
        t: "code",
        title: "Spacing emissions",
        code: `// In a builder
flow { items.forEach { emit(it); delay(200) } }
// On an existing flow
sourceFlow.onEach { delay(200) }.collect { render(it) }`,
      },
      {
        t: "list",
        items: [
          "**`delay` in the builder** — between emits for a paced producer.",
          "**`onEach { delay(t) }`** — space out an existing flow's emissions.",
          "**Sequential effect** — delaying holds the whole pipeline (natural for pacing/animation).",
          "**Cancellable** — `delay` respects cancellation, so pacing stops when the collector is cancelled.",
        ],
      },
      {
        t: "note",
        text: "Pace a flow with delay between emit calls in the builder, or onEach { delay(t) } on an existing flow. In a sequential flow this holds the whole pipeline (natural for pacing/reveal animations). delay is cancellable, so pacing stops when the collector is cancelled.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is transformWhile, and how do you stop a flow conditionally?",
    a: [
      {
        t: "p",
        text: "`transformWhile { }` emits values and returns a `Boolean` deciding whether to *continue* — when you return `false`, the flow stops (after optionally emitting). It's like `takeWhile` but with the flexibility of `transform` (you control emission and the stop condition together). Use it to consume a stream until a sentinel/condition and then complete.",
      },
      {
        t: "code",
        title: "Stop on a condition",
        code: `flow.transformWhile { value ->
    emit(value)
    value != SENTINEL          // continue while not the sentinel; stop after emitting it
}`,
      },
      {
        t: "list",
        items: [
          "**`transformWhile { }`** — emit as needed, return `false` to stop the flow.",
          "**vs `takeWhile`** — `takeWhile` stops *before* emitting the failing value; `transformWhile` lets you emit it then stop.",
          "**Uses** — read until a terminator, stop after a completion marker.",
          "**Completes upstream** — returning `false` cancels the upstream flow.",
        ],
      },
      {
        t: "note",
        text: "transformWhile { emit(...); continueBoolean } emits freely and stops when you return false — like takeWhile but you control emission and the stop together (e.g. emit the sentinel THEN stop, which takeWhile can't). Returning false completes/cancels upstream. Use to consume until a terminator.",
      },
    ],
  },
  {
    level: "senior",
    q: "What does the concurrency parameter of flatMapMerge control?",
    a: [
      {
        t: "p",
        text: "`flatMapMerge(concurrency = N)` limits how many inner flows are collected *concurrently* — the default is `DEFAULT_CONCURRENCY` (16). It lets you run multiple transformations in parallel (e.g. fetch details for many ids at once) while bounding the parallelism so you don't overwhelm the network/server.",
      },
      {
        t: "code",
        title: "Bounded parallel fetches",
        code: `ids.asFlow()
    .flatMapMerge(concurrency = 4) { id -> flow { emit(api.getDetails(id)) } }
    .collect { store(it) }   // up to 4 concurrent detail fetches`,
      },
      {
        t: "list",
        items: [
          "**`concurrency`** — max inner flows collected at once (default 16).",
          "**Parallelism with a cap** — run many fetches in parallel without unbounded load.",
          "**Order not preserved** — merged results arrive as they complete (use `flatMapConcat` for order).",
          "**Tune it** — match the server's rate limits / device capacity.",
        ],
      },
      {
        t: "note",
        text: "flatMapMerge(concurrency = N) caps how many inner flows collect concurrently (default 16) — parallel transformations (e.g. fetch details for many ids) with a bound so you don't overwhelm the server. Results arrive out of order (use flatMapConcat to preserve order). Tune N to rate limits/capacity.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you switch to a different flow whenever a trigger changes (flatMapLatest)?",
    a: [
      {
        t: "p",
        text: "`flatMapLatest { }` maps each upstream value to a *new flow* and collects it, cancelling the previous inner flow when a new upstream value arrives. This is the pattern for 'when the input changes, switch to a fresh stream' — e.g. a selected filter driving a database query, where changing the filter cancels the old query and starts a new one.",
      },
      {
        t: "code",
        title: "Trigger-driven switching",
        code: `selectedCategory
    .flatMapLatest { category ->
        repository.observeItems(category)   // new DB flow per category; old one cancelled
    }
    .collect { render(it) }`,
      },
      {
        t: "list",
        items: [
          "**`flatMapLatest`** — each upstream value → a new inner flow; the previous is cancelled on change.",
          "**Uses** — filter/tab/query changes that should re-subscribe to a new source.",
          "**No stale data** — the old stream is abandoned, so you never see results for a previous selection.",
          "**Search** — combined with `debounce` for search-as-you-type over a query flow.",
        ],
      },
      {
        t: "note",
        text: "flatMapLatest { } maps each upstream value to a new inner flow and cancels the previous when a new value arrives — the 'input changed, switch streams' pattern (filter → new DB query, tab → new source). No stale data since the old stream is abandoned. With debounce it powers search-as-you-type.",
      },
    ],
  },
  {
    level: "senior",
    q: "When do you use merge versus combine for independent streams?",
    a: [
      {
        t: "p",
        text: "`merge` *interleaves* multiple flows of the *same type* into one, forwarding each emission as it arrives — you get a unified stream of events. `combine` produces a *tuple of the latest value from each* flow, emitting whenever any changes — you get combined state. Use `merge` to funnel several event sources together; use `combine` to derive state from multiple inputs.",
      },
      {
        t: "code",
        title: "merge vs combine",
        code: `// merge: unify event sources (same type)
merge(clicks, swipes, keyEvents).collect { handleEvent(it) }

// combine: latest-of-each state
combine(query, filters) { q, f -> Search(q, f) }.collect { runSearch(it) }`,
      },
      {
        t: "list",
        items: [
          "**`merge`** — interleave same-typed flows into one event stream; each emission forwarded as-is.",
          "**`combine`** — emit the latest of each source together, on any change (state derivation).",
          "**Type** — `merge` needs a common type; `combine` mixes types into a tuple/object.",
          "**Intent** — funnel events (merge) vs compute combined state (combine).",
        ],
      },
      {
        t: "note",
        text: "merge interleaves same-typed flows into one event stream (each emission forwarded) — funnel event sources. combine emits the latest of each flow together on any change (mixes types) — derive combined state. Merge for events, combine for state.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you assemble a screen's UiState from several independent flows?",
    a: [
      {
        t: "p",
        text: "Use `combine` to merge the latest values of each source flow into a single `UiState`, then `stateIn` it in the ViewModel for the UI to collect. Whenever any source changes, `combine` recomputes the state, giving a single reactive source of truth composed from user data, settings, network status, etc.",
      },
      {
        t: "code",
        title: "Composed UiState",
        code: `val uiState: StateFlow<UiState> = combine(
    userRepo.user,
    settingsRepo.settings,
    connectivity.isOnline,
) { user, settings, online ->
    UiState(user, settings, online)
}.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UiState.Loading)`,
      },
      {
        t: "list",
        items: [
          "**`combine` the sources** — latest-of-each into one `UiState` on any change.",
          "**`stateIn`** — expose as a `StateFlow` with an initial Loading value.",
          "**Single source of truth** — the UI collects one flow; all inputs feed it reactively.",
          "**`WhileSubscribed`** — upstream active only while the UI observes (efficient).",
        ],
      },
      {
        t: "note",
        text: "combine the source flows (user, settings, connectivity) into one UiState (recomputed on any change), then stateIn(viewModelScope, WhileSubscribed(5000), Loading) for the UI. One reactive source of truth composed from independent inputs; WhileSubscribed keeps upstream active only while observed.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do the flattening strategies map to real UI scenarios?",
    a: [
      {
        t: "p",
        text: "The three `flatMap*` operators each fit different real-world needs, decided by what should happen to in-flight work when a new value arrives. Picking the wrong one causes stale results, dropped work, or ordering bugs.",
      },
      {
        t: "table",
        headers: ["Operator", "On new value", "Scenario"],
        rows: [
          ["flatMapLatest", "cancel previous inner", "search-as-you-type (drop stale)"],
          ["flatMapConcat", "queue, run in order", "sequential uploads / ordered ops"],
          ["flatMapMerge", "run concurrently", "parallel independent fetches"],
        ],
      },
      {
        t: "list",
        items: [
          "**`flatMapLatest`** — search, filters, any 'only the latest input matters' case.",
          "**`flatMapConcat`** — ordered processing where each must finish before the next (upload queue, sequential steps).",
          "**`flatMapMerge`** — independent parallel work (fetch many resources at once), optionally bounded by `concurrency`.",
          "**Decide by** — cancel-stale (Latest), preserve-order (Concat), maximize-throughput (Merge).",
        ],
      },
      {
        t: "note",
        text: "flatMapLatest → cancel stale (search-as-you-type); flatMapConcat → queue in order (sequential uploads/steps); flatMapMerge → run concurrently (parallel fetches, bound with concurrency). Pick by what happens to in-flight work: cancel-stale, preserve-order, or maximize-throughput. Wrong choice = stale/dropped/misordered results.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you prevent double-clicks or rapid duplicate actions with flow operators?",
    a: [
      {
        t: "p",
        text: "Model the clicks as a flow and apply a throttle-first behavior: emit the first click, then ignore subsequent ones for a short window. Since Flow has no built-in `throttleFirst`, you either implement it (track the last-accepted time) or use `debounce` if 'wait for the taps to stop' is acceptable. For a submit button, disabling it in state during the operation is often simpler and more reliable.",
      },
      {
        t: "code",
        title: "Throttle-first for clicks",
        code: `fun <T> Flow<T>.throttleFirst(windowMs: Long): Flow<T> = flow {
    var last = 0L
    collect { value ->
        val now = System.currentTimeMillis()
        if (now - last >= windowMs) { last = now; emit(value) }
    }
}
clicks.throttleFirst(500).onEach { submit() }.launchIn(scope)`,
      },
      {
        t: "list",
        items: [
          "**Throttle-first** — accept the first, ignore for a window; ideal for buttons (act immediately, block repeats).",
          "**`debounce`** — waits for a pause; wrong for buttons (delays the action).",
          "**State-based guard** — often cleaner: set `isSubmitting = true` and disable the button until done.",
          "**Combine** — throttle plus a disabled state for robustness.",
        ],
      },
      {
        t: "note",
        text: "Use throttle-first (accept first, ignore for a window) for buttons — implement it (track last-accepted time) since Flow lacks it built-in. debounce is wrong here (delays the action). Often simpler: guard with state (isSubmitting → disable the button until done). Combine both for robustness.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between filter and takeWhile for stopping a stream?",
    a: [
      {
        t: "p",
        text: "`filter { }` *skips* non-matching values but keeps the flow going (it never stops the stream). `takeWhile { }` *stops* the flow as soon as the predicate is false. So `filter` is for selecting a subset across the whole stream; `takeWhile` is for consuming a prefix and then completing.",
      },
      {
        t: "code",
        title: "filter vs takeWhile",
        code: `flowOf(1, 5, 2, 8, 3).filter { it < 5 }       // 1, 2, 3 (skips 5, 8; continues)
flowOf(1, 5, 2, 8, 3).takeWhile { it < 5 }    // 1 (stops at 5)`,
      },
      {
        t: "list",
        items: [
          "**`filter`** — drops non-matching values, keeps collecting the rest.",
          "**`takeWhile`** — emits until the predicate fails, then completes/cancels upstream.",
          "**Choose** — subset selection (filter) vs prefix-then-stop (takeWhile).",
          "**`transformWhile`** — the flexible version of `takeWhile` (emit then decide to stop).",
        ],
      },
      {
        t: "note",
        text: "filter skips non-matching values but never stops the flow (subset selection). takeWhile stops the flow the moment the predicate fails (prefix, then complete/cancel upstream). Use filter to select across the whole stream, takeWhile to consume a prefix. transformWhile is the flexible takeWhile.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you build a debounced, distinct, cancel-stale search pipeline?",
    a: [
      {
        t: "p",
        text: "Chain the operators that each solve one problem: `debounce` (wait for a typing pause), `distinctUntilChanged` (ignore no-op query changes), `filter` (skip too-short/blank queries), and `flatMapLatest` (cancel the previous search when a new query arrives). Together they produce a responsive, efficient search that never shows stale results.",
      },
      {
        t: "code",
        title: "The full search pipeline",
        code: `queryFlow
    .debounce(300)                       // wait for typing to pause
    .distinctUntilChanged()              // ignore identical queries
    .filter { it.length >= 2 }           // skip trivial queries
    .flatMapLatest { q ->                // cancel prior search on new query
        repository.search(q)
            .catch { emit(SearchResult.Error) }   // per-search error handling
    }
    .collect { render(it) }`,
      },
      {
        t: "list",
        items: [
          "**`debounce(300)`** — one network call per typing pause, not per keystroke.",
          "**`distinctUntilChanged`** — skip redundant identical queries.",
          "**`filter`** — avoid searching blank/too-short input.",
          "**`flatMapLatest`** — cancel the in-flight search when the query changes (no stale results).",
          "**`catch` inside `flatMapLatest`** — so one failed search doesn't kill the whole pipeline.",
        ],
      },
      {
        t: "note",
        text: "Search pipeline: debounce(300) (per-pause, not per-keystroke) → distinctUntilChanged (skip identical) → filter (skip trivial) → flatMapLatest (cancel stale search on new query) → catch INSIDE flatMapLatest (a failed search doesn't kill the pipeline). Each operator solves one problem; together = responsive, efficient, no stale results.",
      },
    ],
  },
];

export default qa;
