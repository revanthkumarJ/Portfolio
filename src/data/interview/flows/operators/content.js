// Flow Operators & Transformations — Content tab. Teaching-first.

const content = [
  {
    heading: "Operators are lazy transformations that return new flows",
    blocks: [
      {
        t: "p",
        text: "An **intermediate operator** takes a flow and returns a *new* flow with some transformation applied. They're **lazy** — calling `map { }` runs nothing; it just wraps the upstream flow in a new one that will apply the transformation *when collected*. You chain them into a pipeline, and only a terminal operator (`collect`) makes values flow through. Each operator runs in the collector's coroutine (unless `flowOn` intervenes), and processes values one at a time as they pass through.",
      },
      {
        t: "code",
        title: "A pipeline reads top-to-bottom as values flow through",
        code: `repository.observeArticles()      // Flow<List<Article>>
    .map { it.filter(Article::isPublished) }   // transform each emission
    .filter { it.isNotEmpty() }                // drop empties
    .onEach { log("emitting \${it.size} articles") } // peek (side effect)
    .catch { emit(emptyList()) }               // handle upstream errors
    .collect { render(it) }                    // terminal: starts everything`,
      },
    ],
  },
  {
    heading: "Transforming operators: map, filter, transform, and friends",
    blocks: [
      {
        t: "list",
        items: [
          "**`map { }`** — transform each value into exactly one new value (`Flow<A>` → `Flow<B>`).",
          "**`filter { }`** / **`filterNot`** / **`filterNotNull`** / **`filterIsInstance<T>()`** — keep only values matching a predicate/type.",
          "**`transform { }`** — the general operator that `map`/`filter` are built on: for each upstream value you can `emit` **zero, one, or many** downstream values. Use when the 1:1 shape of `map` doesn't fit.",
          "**`onEach { }`** — perform a side effect per value without changing it (logging, triggering something); returns the same values. Great for debugging a pipeline.",
          "**`withIndex()` / `runningReduce { }` / `scan(initial) { }`** — index values, or emit a running accumulation (scan emits the initial value then each intermediate fold — perfect for accumulating state).",
        ],
      },
      {
        t: "code",
        title: "transform and scan",
        code: `// transform: expand each value into several
flowOf(1, 2, 3).transform { n ->
    emit("start $n"); emit("end $n")
}   // start 1, end 1, start 2, end 2, ...

// scan: emit a running total (initial, then each step)
flowOf(1, 2, 3).scan(0) { acc, n -> acc + n }   // 0, 1, 3, 6`,
      },
    ],
  },
  {
    heading: "Size/time-limiting operators",
    blocks: [
      {
        t: "list",
        items: [
          "**`take(n)`** — take the first n values then cancel upstream. **`takeWhile { }`** — until the predicate fails. **`drop(n)` / `dropWhile { }`** — skip values.",
          "**`debounce(ms)`** — emit a value only after `ms` of silence; each new value resets the timer. The search-box classic: wait until the user stops typing. Drops intermediate rapid values.",
          "**`sample(ms)`** — emit the *latest* value every `ms` (a periodic snapshot). Debounce waits for a pause; sample takes regular snapshots regardless of pauses.",
          "**`distinctUntilChanged()`** — suppress consecutive duplicates (only emit when the value differs from the previous). Prevents redundant downstream work when the same value repeats.",
          "**`distinctUntilChangedBy { key }`** — same, comparing by a derived key.",
        ],
      },
      {
        t: "code",
        title: "The canonical search pipeline",
        code: `queryFlow
    .debounce(300)                 // wait for typing to pause
    .distinctUntilChanged()        // ignore no-op changes
    .filter { it.length >= 2 }     // don't search 1 char
    .flatMapLatest { q -> repository.search(q) }  // cancel old search
    .collect { render(it) }`,
      },
    ],
  },
  {
    heading: "Combining flows: zip, combine, merge",
    blocks: [
      {
        t: "p",
        text: "Three ways to bring multiple flows together — the differences are heavily tested because they behave subtly differently:",
      },
      {
        t: "table",
        headers: ["Operator", "Emits when", "Pairing behavior"],
        rows: [
          ["**`combine`**", "ANY input emits (after all have emitted once)", "latest value of each — recomputes on every change"],
          ["**`zip`**", "each input has a NEW value to pair", "strict 1:1 pairing, waits for both; stops at the shorter"],
          ["**`merge`**", "any input emits", "interleaves values from all into one stream (no pairing)"],
        ],
      },
      {
        t: "code",
        title: "combine vs zip",
        code: `// combine: recompute UI state whenever ANY source changes
combine(userFlow, settingsFlow, cartFlow) { user, settings, cart ->
    HomeUiState(user, settings, cart.itemCount)
}.collect { render(it) }

// zip: pair values 1:1 (e.g. request with its matching response index)
flowOf(1, 2, 3).zip(flowOf("a", "b", "c")) { n, s -> "$n$s" }
// -> 1a, 2b, 3c`,
      },
      {
        t: "list",
        items: [
          "**`combine`** is the one you use most in Android — it's how you build a single `UiState` from several independent streams (user + settings + cart), recomputing whenever *any* changes. Note: it only starts emitting after *every* input has emitted at least once (give each an initial value if you need earlier output).",
          "**`zip`** is for strict lockstep pairing — less common in UI, useful when two streams' values correspond positionally.",
          "**`merge`** flattens several flows of the same type into one interleaved stream (e.g. merge events from several sources).",
        ],
      },
    ],
  },
  {
    heading: "Flattening operators: flatMapConcat, flatMapMerge, flatMapLatest",
    blocks: [
      {
        t: "p",
        text: "Sometimes each value in a flow *produces another flow* (a userId → a flow of that user's posts). You then have a `Flow<Flow<T>>` that must be flattened into `Flow<T>`. The three flatMap operators differ in **how they handle a new inner flow arriving while a previous one is still active** — the single most important distinction in this topic:",
      },
      {
        t: "table",
        headers: ["Operator", "When a new value arrives while inner flow is running", "Use for"],
        rows: [
          ["**`flatMapConcat`**", "queues — waits for the current inner flow to finish first", "order matters, process sequentially"],
          ["**`flatMapMerge`**", "runs concurrently — both inner flows active at once", "parallel work, order doesn't matter"],
          ["**`flatMapLatest`**", "cancels the current inner flow, starts the new one", "only the latest matters (search, latest-selection)"],
        ],
      },
      {
        t: "code",
        title: "flatMapLatest — cancel stale work",
        code: `selectedUserId
    .flatMapLatest { id ->
        // if the user selects a different id, the in-flight
        // observation for the old id is CANCELLED
        repository.observeUserPosts(id)
    }
    .collect { render(it) }`,
      },
      {
        t: "list",
        items: [
          "**`flatMapLatest`** is the flow-pipeline equivalent of `collectLatest` — the go-to for search-as-you-type and 'react to the latest selection', because it cancels the previous inner flow (killing the stale-result race).",
          "**`flatMapConcat`** preserves order and runs one inner flow at a time — use when sequencing matters (process each item's sub-stream fully before the next).",
          "**`flatMapMerge`** runs inner flows concurrently (with a `concurrency` limit) — for parallel fan-out where order is irrelevant. Beware unbounded concurrency on large upstreams.",
          "Mnemonic: **Concat = queue, Merge = parallel, Latest = cancel-and-replace.**",
        ],
      },
    ],
  },
  {
    heading: "Converting to and from other types",
    blocks: [
      {
        t: "list",
        items: [
          "**`flow.asLiveData()`** — bridge a Flow to LiveData for legacy code (lifecycle-aware). Rarely needed in new code.",
          "**`liveData.asFlow()`**, **`Observable.asFlow()`** (RxJava) — bring legacy reactive types into the Flow world during migration.",
          "**`callbackFlow`/`channelFlow`** — from callbacks to flows (covered in the callbackFlow topic).",
          "**`stateIn` / `shareIn`** — cold Flow → hot StateFlow/SharedFlow (covered in the hot flows topic).",
          "**`flow.first()` / `flow.toList()`** — collapse a flow to a single value / a list (terminal).",
        ],
      },
      {
        t: "note",
        text: "The three questions this topic must let you answer cold: (1) map vs transform (1:1 vs 0..n); (2) combine vs zip (latest-of-each on any change vs strict 1:1 pairing); (3) flatMapConcat vs Merge vs Latest (queue vs parallel vs cancel). Those three comparisons cover the majority of Flow-operator interview questions.",
      },
    ],
  },
];

export default content;
