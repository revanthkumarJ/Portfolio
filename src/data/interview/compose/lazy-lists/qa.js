// Lazy Lists — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is the difference between LazyColumn and Column with verticalScroll?",
    a: [
      {
        t: "p",
        text: "**The concept**: both scroll vertically, but they compose their children completely differently. A `Column` with `Modifier.verticalScroll(...)` composes **every child immediately** — all of them exist in the composition at once, whether visible or not, and scrolling just moves the viewport over them. `LazyColumn` composes **only the visible items** (plus a small buffer); as you scroll, off-screen items are disposed and incoming ones composed on demand — the same virtualization idea as RecyclerView, but automatic.",
      },
      {
        t: "p",
        text: "**How to choose**: use the scrollable Column for a *bounded, small* set of children — a settings screen with 15 rows, a form. Use LazyColumn for anything *large, unbounded, or dynamic* — a feed, search results, a chat. The failure mode that makes it a real bug, not just a preference: putting hundreds (or a network-paged list) of items in a scrollable Column composes them all up front — memory spikes and the first frame stalls. And you can't fix it by nesting — a LazyColumn inside a verticalScroll Column crashes, because the scroll container offers infinite height and the lazy list can't decide what's 'visible'.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why should you provide a key in items()? What breaks without it?",
    a: [
      {
        t: "p",
        text: "**The concept**: Compose identifies each item so it knows, across list updates, which item is 'the same one'. By default that identity is the item's **index** (position). Index identity is fine while the list never changes — but the moment items are inserted, removed, or reordered, indices shift, and Compose can no longer tell 'item moved' from 'item changed'.",
      },
      {
        t: "list",
        items: [
          "**Cascade recomposition**: delete the first item and every following item now has a new index → Compose treats them all as changed → every visible item recomposes, even though their data is identical. With `key = { it.id }`, identity follows the data, so unmoved items are left completely alone.",
          "**State attaches to the wrong item** — the worst bug: an item's `remember`ed state (an expanded/collapsed flag, a half-played animation, a text field's contents) is stored by identity. With index keys, after a deletion the state that belonged to old item #3 silently reattaches to whatever is now at index #3. Users see a checkbox 'jump' to a different row.",
          "**No item animations**: `Modifier.animateItem()` needs stable keys to know an item *moved* rather than *appeared*; without keys, reorders can't be animated.",
        ],
      },
      {
        t: "p",
        text: "**Requirements for a good key**: stable, unique in the list, and saveable (a data-class `id`, not a random UUID generated in the item body — that changes every recomposition and defeats the purpose). And never pass the index as the key: that just reproduces the default.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you scroll a LazyColumn programmatically, e.g. a 'scroll to top' button?",
    a: [
      {
        t: "p",
        text: "**The concept**: scrolling is controlled through a `LazyListState` you create with `rememberLazyListState()` and pass to the list. The scroll functions are **suspend functions** (because scrolling can animate over time and must be cancellable), so you call them from a coroutine — in an event handler, that means a `rememberCoroutineScope()`.",
      },
      {
        t: "code",
        title: "The standard pattern",
        code: `val listState = rememberLazyListState()
val scope = rememberCoroutineScope()

Scaffold(
    floatingActionButton = {
        FloatingActionButton(onClick = {
            scope.launch { listState.animateScrollToItem(index = 0) }
        }) { Icon(Icons.Default.KeyboardArrowUp, null) }
    }
) { padding ->
    LazyColumn(state = listState, contentPadding = padding) { /* items */ }
}`,
      },
      {
        t: "p",
        text: "`animateScrollToItem(index)` animates smoothly; `scrollToItem(index)` jumps instantly (good for restoring a saved position). Both take an optional pixel offset. A subtle correctness point: launch from `rememberCoroutineScope`, **not** a `LaunchedEffect` triggered by a click flag, and never call the suspend function directly in the composable body — scrolling is an event-driven action, so it belongs to the event's coroutine.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you build a list with different item types (e.g. headers and rows, or ads and posts)?",
    a: [
      {
        t: "p",
        text: "**The concept**: RecyclerView made you enumerate 'view types', override `getItemViewType`, and switch in `onCreateViewHolder`. Compose needs none of that — the item content is *just code*, so you branch with an ordinary `when`.",
      },
      {
        t: "code",
        title: "Heterogeneous list — plain Kotlin branching",
        code: `LazyColumn {
    items(
        items = feed,
        key = { it.id },
        contentType = { it::class },   // reuse hint: group by type
    ) { entry ->
        when (entry) {
            is FeedItem.Post -> PostCard(entry)
            is FeedItem.Ad   -> AdBanner(entry)
            is FeedItem.Divider -> Divider()
        }
    }

    // fixed-purpose items use item {} directly:
    item(contentType = "header") { FeedHeader() }
}`,
      },
      {
        t: "p",
        text: "**The one thing to add for performance is `contentType`**: Compose keeps a small pool of disposed item node-structures to reuse as you scroll (like recycling), and it can only reuse a structure for an item of the *same* type. Passing `contentType` (e.g. `it::class`) tells it how to group the pool, so a post scrolling in reuses a post's structure instead of rebuilding from scratch. It's optional and harmless to omit on uniform lists, but for mixed feeds it's the difference between smooth and janky recycling.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does rememberLazyListState() give you, and does scroll position survive rotation?",
    a: [
      {
        t: "p",
        text: "`rememberLazyListState()` creates the `LazyListState` that owns the list's scroll position and exposes scroll control and inspection. Because it's built with a saver internally, it survives **both** recomposition and configuration change / process recreation — so yes, scroll position is preserved across rotation automatically, you don't wire anything up. It restores by remembering the first visible item's *key* and pixel offset (which is another reason stable keys matter — with index keys, a list that changed above the viewport would restore to the wrong place).",
      },
      {
        t: "p",
        text: "What it exposes: `firstVisibleItemIndex` and `firstVisibleItemScrollOffset` (the current anchor), `layoutInfo` (a full snapshot of visible items — indices, sizes, offsets, viewport bounds), `isScrollInProgress`, and the suspend scroll functions. You only need to create and pass it when you want to *observe* or *control* scrolling; a plain `LazyColumn {}` without a state parameter gets an internal one and still preserves position.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you implement infinite scroll (load-more) efficiently in Compose without recomposing on every scroll frame?",
    a: [
      {
        t: "p",
        text: "**The trap first**: the naive approach reads `listState.firstVisibleItemIndex` (or `layoutInfo`) directly in the composable to decide when to load more. Those values change on *every scroll frame*, so any composable reading them recomposes continuously while scrolling — you've turned a scroll into a recomposition storm. The fix is to compute the *boolean decision* inside `derivedStateOf`, which only invalidates readers when the decision actually flips.",
      },
      {
        t: "code",
        title: "Load-more with derivedStateOf + LaunchedEffect",
        code: `val shouldLoadMore by remember {
    derivedStateOf {
        val layoutInfo = listState.layoutInfo
        val lastVisible = layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
        // trigger when within 5 items of the end
        lastVisible >= layoutInfo.totalItemsCount - 5
    }
}

LaunchedEffect(shouldLoadMore) {
    if (shouldLoadMore) viewModel.loadNextPage()
}`,
      },
      {
        t: "list",
        items: [
          "`derivedStateOf` re-evaluates the threshold on every scroll (cheap — just arithmetic) but only *invalidates* the `LaunchedEffect` key when `shouldLoadMore` transitions false→true.",
          "Keying the `LaunchedEffect` on the boolean means the load fires once per crossing, not repeatedly; the ViewModel should also guard against concurrent/duplicate page requests (an `isLoading` flag or a single in-flight job) since the flag can stay true across a few frames.",
          "**The senior answer names the better alternative**: for real network pagination, hand-rolling this is fragile (dedup, error/retry, prepend, placeholders). **Paging 3** does it properly — accessing an item near the edge triggers the fetch inside the library, and `loadState` gives you loading/error/retry as list items. Roll your own only for simple bounded cases; reach for Paging for production infinite feeds.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "A LazyColumn scrolls smoothly in debug but users report jank. Walk through diagnosing lazy-list performance.",
    a: [
      {
        t: "list",
        items: [
          "**First, rule out the false alarm**: debug builds are *expected* to be janky — no R8, extra Compose runtime checks, no baseline profile → JIT compiling on the fly during scroll. Always measure scroll performance on a **release build** (or at least with baseline profiles). Half of 'my list is janky' reports evaporate here; say this first.",
          "**Check keys**: missing/unstable keys cause whole-list recomposition on any data change — data updating during scroll then compounds jank. Verify stable `key = { it.id }`.",
          "**Check item skippability/stability**: if item parameters are unstable types (a plain `List`, a non-`@Immutable`/`@Stable` model), items recompose needlessly. Enable the Compose compiler metrics/strong-skipping and make item models stable — an unstable item model is the most common real cause.",
          "**Check work done in the item body**: item lambdas run on the frame deadline as items scroll in. Anything heavy there — sorting, formatting, non-cached image decode, allocation — blows the budget. Move formatting into the UI model; ensure images go through a caching loader (Coil) with proper sizing.",
          "**Use the tools**: Layout Inspector recomposition counts to spot items recomposing too often; the Android Studio profiler / `Macrobenchmark` with `FrameTimingMetric` to get real jank numbers; composition tracing to see time per item.",
          "**Add a baseline profile**: for lists specifically, baseline profiles precompile the scroll/compose hot paths and are one of the biggest single wins — measurably fewer dropped frames on first scroll.",
        ],
      },
      {
        t: "p",
        text: "The framing that lands: treat it as a measurement problem — release build + profiler numbers first, then attack in order of likelihood (build type → keys → stability → item-body work → baseline profile). Guessing and sprinkling `remember` is the junior move.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why does nesting a LazyColumn inside a vertically-scrolling Column crash, and how do you restructure it?",
    a: [
      {
        t: "p",
        text: "**The mechanism**: a `Modifier.verticalScroll` container measures its content with an **infinite maximum height** — that's how it lets content be taller than the screen and scroll. A `LazyColumn`'s entire job depends on knowing its viewport height so it can decide *which items are visible* and compose only those. Given infinite height, 'visible' would mean 'all of them', which defeats laziness and is undefined — so Compose throws: *\"Vertically scrollable component was measured with an infinity maximum height.\"* The two scrollables have incompatible contracts in the same axis.",
      },
      {
        t: "p",
        text: "**The fix is to make everything one lazy list** rather than nesting. Whatever you were putting *around* the LazyColumn becomes items *of* it — headers, banners, and sections all move into the DSL:",
      },
      {
        t: "code",
        title: "Restructure: one LazyColumn owns the whole screen",
        code: `LazyColumn {
    item { ProfileHeader() }          // was above the list
    item { StatsRow() }               // was above the list
    items(posts, key = { it.id }) { PostCard(it) }
    item { Footer() }                 // was below the list
}`,
      },
      {
        t: "list",
        items: [
          "This is also *more* correct, not just a workaround: now the header/footer participate in virtualization too, and there's a single scroll container with one consistent scroll position.",
          "**Cross-axis nesting is completely fine**: a `LazyRow` inside a `LazyColumn` item (horizontal carousels in a vertical feed) — different axes, no infinite-constraint conflict. Give the rows their own keys/contentType.",
          "If you genuinely must nest same-axis (rare), you'd have to give the inner list a *fixed* height (`Modifier.height(300.dp)`) so it isn't measured with infinity — but that usually signals the one-LazyColumn restructure is what you actually want.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "Explain how LazyColumn is implemented under the hood, and how item reuse compares to RecyclerView.",
    a: [
      {
        t: "p",
        text: "**The foundation is SubcomposeLayout**: unlike normal composables (composed fully before layout), LazyColumn defers composing its items until *measure time*. At measure, it knows the viewport dimensions; starting from the current scroll anchor, it subcomposes items one at a time — measure, accumulate height — until the viewport plus a small buffer (`beyondBoundsItemCount`) is filled, then stops. Items scrolled fully out of that window are disposed (their composition removed from the slot table); items scrolling in are subcomposed fresh. So at any moment only ~viewport-worth of items exist in the composition, regardless of dataset size.",
      },
      {
        t: "list",
        items: [
          "**Reuse pool**: to avoid rebuilding node structures constantly, Compose keeps a small pool of *disposed but reusable* item layouts, grouped by `contentType`. When an item of a matching type scrolls in, it reuses a pooled structure and just updates the changed slots — conceptually RecyclerView's ViewHolder recycling, but the runtime does it for you and it operates on Compose nodes, not Views.",
          "**vs RecyclerView — what's automatic**: no `Adapter`, no `ViewHolder` class, no `onCreateViewHolder`/`onBindViewHolder`, no `getItemViewType`, no `DiffUtil`/`notifyItemChanged`. The item lambda is the bind logic; keys replace DiffUtil (Compose diffs by key + parameter equality); `contentType` replaces view types.",
          "**vs RecyclerView — the tradeoffs to be honest about**: RecyclerView's recycling is more aggressive/mature and its prefetch is very tuned, so extremely heavy lists can still favor it in edge cases; Compose leans on *stability + keys + baseline profiles* to hit smoothness instead. And RecyclerView had years of tooling; Compose lists need the stability discipline in exchange for far less boilerplate.",
          "**Consequence for correctness**: because items are genuinely disposed and recomposed as you scroll, any `remember`ed item state is lost when the item leaves the pool unless it's hoisted or made saveable — a footgun that has no RecyclerView analogue (there, state was never in the item to begin with).",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "How does Paging 3 integrate with Compose, and what problems does it solve that a hand-rolled load-more doesn't?",
    a: [
      {
        t: "p",
        text: "**The integration**: the data layer exposes `Flow<PagingData<T>>` (from a `Pager` with a `PagingSource`, or `RemoteMediator` for network+DB). In the ViewModel it must be `cachedIn(viewModelScope)`. The UI calls `collectAsLazyPagingItems()` to get a `LazyPagingItems<T>`, and drives the list with `items(count = pagingItems.itemCount, key = pagingItems.itemKey { it.id }, contentType = ...)`, reading each element via `pagingItems[index]` — which is what triggers loading the next page as you approach the edge.",
      },
      {
        t: "list",
        items: [
          "**What it solves over hand-rolled**: automatic page-fetch triggering (no derivedStateOf edge math), request **de-duplication** and cancellation, a proper `loadState` machine (`refresh`/`append`/`prepend` each Loading/NotLoading/Error) so first-load spinners, end-of-list errors, retry, and empty states are modeled uniformly — as list items, not ad-hoc overlays. It also supports **placeholders** (show item count before data loads) and `RemoteMediator` for offline-first (DB is SSOT, network fills pages).",
          "**cachedIn is mandatory, and interviewers check it**: without it, `PagingData` is re-fetched from scratch on every configuration change (rotation reloads page 1). `cachedIn` keeps the loaded pages alive in the ViewModel scope.",
          "**Nuance about the type**: `PagingData` is a stream of self-updating list snapshots — it does *not* behave like a normal Flow of values, so you can't `stateIn`/`map` its contents with ordinary operators (there are dedicated `.map`/`.filter` on PagingData instead). That's why it has its own collection API rather than `collectAsStateWithLifecycle`.",
          "**When NOT to use it**: bounded lists that fully fit in memory (a user's 20 settings, a fixed menu) — Paging's ceremony (PagingSource, load states, cachedIn) is overkill; a plain `items(list)` is correct there. Paging earns its complexity on genuinely unbounded, network-backed data.",
        ],
      },
    ],
  },
];

export default qa;
