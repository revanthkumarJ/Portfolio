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
];

export default qa;
