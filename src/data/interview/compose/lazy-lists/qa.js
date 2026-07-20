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
  {
    level: "junior",
    q: "What's the difference between item {}, items(), and itemsIndexed() in a LazyListScope?",
    a: [
      {
        t: "p",
        text: "Inside a `LazyColumn`/`LazyRow` you don't write children directly — you describe them in a `LazyListScope` using DSL functions. `item { }` adds a single item, `items(list) { }` adds one per element, and `itemsIndexed(list) { index, element -> }` adds one per element with its index.",
      },
      {
        t: "code",
        title: "The lazy DSL",
        code: `LazyColumn {
    item { Header() }                         // one fixed item (header)
    items(users, key = { it.id }) { user ->   // one per element
        UserRow(user)
    }
    itemsIndexed(users) { index, user ->      // element + index
        Text("\${index + 1}. \${user.name}")
    }
    item { Footer() }                         // one fixed footer
}`,
      },
      {
        t: "list",
        items: [
          "**`item { }`** — a single item; use for headers, footers, or a loading spinner at the end.",
          "**`items(list) { }`** — the workhorse; pass `key` and `contentType` here for correctness and performance.",
          "**`itemsIndexed(list) { i, e -> }`** — when you need the position (numbering, alternating backgrounds).",
          "**Important** — these are *not* composables you loop over with a `for`; they're DSL calls that let the list compose only visible items. Don't call composables directly in the LazyColumn body outside these.",
        ],
      },
      {
        t: "note",
        text: "item{} adds one item (headers/footers/spinners); items(list){} one per element (put key + contentType here); itemsIndexed gives index too. They're LazyListScope DSL calls — the list uses them to compose only visible items, so don't hand-loop composables in the body.",
      },
    ],
  },
  {
    level: "junior",
    q: "What lazy containers exist besides LazyColumn (rows, grids, staggered)?",
    a: [
      {
        t: "p",
        text: "Compose has a family of lazy containers, all sharing the same key/contentType/state concepts but differing in axis and arrangement. Knowing which to pick avoids reinventing layouts.",
      },
      {
        t: "list",
        items: [
          "**`LazyColumn` / `LazyRow`** — vertical / horizontal lists.",
          "**`LazyVerticalGrid` / `LazyHorizontalGrid`** — grids; you specify `columns`/`rows` as `GridCells.Fixed(n)` or `GridCells.Adaptive(minSize)`.",
          "**`LazyVerticalStaggeredGrid` / `LazyHorizontalStaggeredGrid`** — Pinterest-style grids where items have varying heights and pack tightly.",
          "**`FlowRow` / `FlowColumn`** — wrap content onto multiple lines (chips, tags); *not* lazy (composes all children), so only for small counts.",
        ],
      },
      {
        t: "code",
        title: "A grid",
        code: `LazyVerticalGrid(columns = GridCells.Adaptive(minSize = 128.dp)) {
    items(photos, key = { it.id }) { PhotoCell(it) }
    item(span = { GridItemSpan(maxLineSpan) }) { SectionHeader() }  // full-width row
}`,
      },
      {
        t: "note",
        text: "LazyColumn/LazyRow (lists), LazyVerticalGrid/LazyHorizontalGrid (grids, Fixed(n) or Adaptive(minSize)), LazyStaggeredGrid (varying-height Pinterest style). FlowRow/FlowColumn wrap chips but are NOT lazy — small counts only.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you configure columns in LazyVerticalGrid, and make an item span the full width?",
    a: [
      {
        t: "p",
        text: "`LazyVerticalGrid` takes a `columns` parameter that decides how many columns and how they size. `GridCells.Fixed(n)` gives exactly n equal columns; `GridCells.Adaptive(minSize)` fits as many columns as possible at ≥ minSize each (responsive). To make an item (like a section header) span all columns, set its `span`.",
      },
      {
        t: "code",
        title: "Fixed vs Adaptive, and spanning",
        code: `LazyVerticalGrid(
    columns = GridCells.Adaptive(minSize = 120.dp),   // responsive column count
    // columns = GridCells.Fixed(3),                  // always 3 columns
    horizontalArrangement = Arrangement.spacedBy(8.dp),
    verticalArrangement = Arrangement.spacedBy(8.dp),
) {
    item(span = { GridItemSpan(maxLineSpan) }) { Header() }   // spans all columns
    items(items, key = { it.id }) { Cell(it) }
}`,
      },
      {
        t: "list",
        items: [
          "**`GridCells.Fixed(n)`** — exactly n columns; simple, but not responsive across screen sizes.",
          "**`GridCells.Adaptive(minSize)`** — as many columns as fit at ≥ minSize; adapts to phone/tablet automatically. Usually preferred.",
          "**Spanning** — `item(span = { GridItemSpan(maxLineSpan) })` (or per-item in `items(span = ...)`) makes headers/full-width rows.",
        ],
      },
      {
        t: "note",
        text: "columns = GridCells.Fixed(n) for exactly n columns, or GridCells.Adaptive(minSize) for responsive (as many as fit ≥ minSize — prefer this). Span the full width with span = { GridItemSpan(maxLineSpan) } on an item — the standard way to add grid section headers.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you add sticky headers to a LazyColumn?",
    a: [
      {
        t: "p",
        text: "`stickyHeader { }` is a LazyListScope function that pins a header to the top of the viewport while its section scrolls beneath it, then pushes it up when the next section's header arrives — the classic contacts/section-list behavior. You typically group your data and emit a `stickyHeader` before each group's items.",
      },
      {
        t: "code",
        title: "Sticky section headers",
        code: `LazyColumn {
    grouped.forEach { (letter, names) ->
        stickyHeader { SectionHeader(letter) }   // pinned while this section scrolls
        items(names, key = { it }) { Name(it) }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`stickyHeader`** — the header stays visible at the top while its section is on screen.",
          "**Group first** — build a `Map<Key, List<Item>>` (e.g. by first letter) and iterate, emitting a sticky header per group.",
          "**Keys still matter** — give items stable keys for correct scrolling/animation; headers can key by their group value.",
          "**Caveat** — it was experimental for a while; ensure you're on a version where it's stable, and be mindful that heavy header content recomposes as it pins.",
        ],
      },
      {
        t: "note",
        text: "stickyHeader { } pins a header to the top while its section scrolls beneath, replaced by the next section's header. Group data (e.g. Map by first letter) and emit a stickyHeader before each group's items(). Keep stable keys; keep header content light.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is contentType in items(), and why does it matter for performance?",
    a: [
      {
        t: "p",
        text: "`contentType` tells the lazy list what *kind* of item each entry is, so its item-reuse pool can recycle a scrolled-off composable of the same type for a new item — reusing the underlying composition/nodes instead of building fresh. In a list with multiple item types (header, ad, post), providing `contentType` dramatically improves scroll performance.",
      },
      {
        t: "code",
        title: "contentType in a mixed list",
        code: `LazyColumn {
    items(
        feed,
        key = { it.id },
        contentType = { it.type },   // "post", "ad", "header" -> separate reuse pools
    ) { entry ->
        when (entry.type) { "post" -> Post(entry); "ad" -> Ad(entry); else -> Header(entry) }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Enables structural reuse** — Compose keeps reuse pools *per contentType*; scrolling reuses a matching composition, skipping re-creation of the node tree.",
          "**Only helps with heterogeneous lists** — a single-type list already reuses fine; the win is when types differ (mixed feeds).",
          "**Wrong/absent contentType** — mixing types in one pool means reuse can't happen (structures differ), so every item rebuilds — visible as jank.",
          "**Pair with `key`** — `key` is for item identity (state/animation correctness); `contentType` is for reuse efficiency. Provide both in mixed lists.",
        ],
      },
      {
        t: "note",
        text: "contentType groups items into per-type reuse pools so scrolling reuses a matching composition instead of rebuilding — a big scroll-perf win for mixed feeds (post/ad/header). Single-type lists reuse fine already. key = identity (state/anim); contentType = reuse. Use both in heterogeneous lists.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you react to scroll state (e.g. first visible item) without recomposing every frame?",
    a: [
      {
        t: "p",
        text: "`LazyListState` exposes `firstVisibleItemIndex`, `firstVisibleItemScrollOffset`, and `layoutInfo` — but these change on *every* scroll frame. Reading them directly in composition recomposes 60×/second. The fix is `derivedStateOf`, which recomputes on every scroll but only *emits a new value* (triggering recomposition) when your derived boolean/coarse value actually changes.",
      },
      {
        t: "code",
        title: "derivedStateOf to throttle scroll-driven recomposition",
        code: `val listState = rememberLazyListState()
val showScrollToTop by remember {
    derivedStateOf { listState.firstVisibleItemIndex > 3 }  // only true/false transitions recompose
}
if (showScrollToTop) ScrollToTopFab(onClick = { /* scroll to 0 */ })`,
      },
      {
        t: "list",
        items: [
          "**Direct read = per-frame recomposition** — `if (listState.firstVisibleItemIndex > 3)` re-reads the raw index every frame.",
          "**`derivedStateOf`** — computes each frame internally but only recomposes readers when the *result* changes (crossing the threshold), collapsing 60 changes/sec into ~1.",
          "**`snapshotFlow`** — alternatively, convert the state to a Flow for side effects (analytics, load-more) with `distinctUntilChanged`/`filter`.",
        ],
      },
      {
        t: "note",
        text: "Scroll state (firstVisibleItemIndex/offset) changes every frame — reading it directly recomposes 60×/sec. Wrap coarse derivations in derivedStateOf (recomputes each frame, recomposes only when the result changes). Use snapshotFlow for side effects like load-more/analytics.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you animate item insertions, removals, and reordering in a lazy list?",
    a: [
      {
        t: "p",
        text: "Use `Modifier.animateItem()` (formerly `animateItemPlacement()`) on the item content — the lazy list then animates items sliding to new positions on reorder, and (in newer versions) fading in/out on insert/remove. This *requires* stable `key`s, because animation is driven by tracking each keyed item's position between frames.",
      },
      {
        t: "code",
        title: "Animated list changes",
        code: `LazyColumn {
    items(items, key = { it.id }) { item ->   // stable key is REQUIRED
        Row(Modifier.animateItem()) { ItemContent(item) }   // animates move/place, and fade on add/remove
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Needs `key`** — without stable keys, the list can't tell which item moved, so nothing animates (and state gets misattributed).",
          "**`animateItem()`** — animates placement changes (reorder) and, on recent Compose, appearance/disappearance (fade in/out) with configurable specs.",
          "**Reorder** — when you emit the list in a new order, keyed items animate to their new slots automatically.",
          "**Caveat** — animations only apply to items that stay in/near the viewport; items far off-screen just appear.",
        ],
      },
      {
        t: "note",
        text: "Modifier.animateItem() (was animateItemPlacement) animates reorder/insert/remove in lazy lists — but ONLY with stable keys, since animation tracks keyed positions between frames. Emit the list in the new order and keyed items slide to place. No keys = no animation + state bugs.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you implement pull-to-refresh with a lazy list?",
    a: [
      {
        t: "p",
        text: "Material3 provides `PullToRefreshBox` (or the `pullToRefresh` modifier + `PullToRefreshState`) that wraps your `LazyColumn`, shows a refresh indicator on over-scroll at the top, and calls your `onRefresh` when the user pulls far enough. You drive it with an `isRefreshing` boolean from your ViewModel.",
      },
      {
        t: "code",
        title: "PullToRefreshBox",
        code: `val isRefreshing by viewModel.isRefreshing.collectAsStateWithLifecycle()
PullToRefreshBox(
    isRefreshing = isRefreshing,
    onRefresh = { viewModel.refresh() },
) {
    LazyColumn { items(data, key = { it.id }) { Row(it) } }
}
// ViewModel sets isRefreshing=true during the fetch, false when done`,
      },
      {
        t: "list",
        items: [
          "**Wrap the list** — `PullToRefreshBox` handles the gesture, indicator, and threshold.",
          "**State-driven** — the indicator shows while your `isRefreshing` state is true; the ViewModel owns that flag around the refresh call.",
          "**Don't reset scroll** — refreshing should update data in place (keyed items) so the user's scroll position and item animations are preserved.",
        ],
      },
      {
        t: "note",
        text: "Wrap the LazyColumn in Material3's PullToRefreshBox (or pullToRefresh modifier); it shows the indicator and calls onRefresh on pull. Drive the spinner with an isRefreshing StateFlow the ViewModel toggles around the fetch. Update data in place (keys) so scroll position is kept.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle empty, loading, and error states in a list screen?",
    a: [
      {
        t: "p",
        text: "A list screen has more states than 'has items' — it can be loading (first load), empty (loaded but zero items), error (load failed), or content. Model these explicitly in your UiState and branch in the UI so users never see a blank screen or a spinner forever.",
      },
      {
        t: "code",
        title: "Branching on list state",
        code: `when (val s = uiState) {
    is UiState.Loading -> FullScreenSpinner()
    is UiState.Error   -> ErrorView(s.message, onRetry = viewModel::retry)
    is UiState.Empty   -> EmptyView("No items yet")           // distinct from loading!
    is UiState.Content -> LazyColumn { items(s.items, key = { it.id }) { Row(it) } }
}
// For paging: show inline append spinner/error at the list's end via item {}`,
      },
      {
        t: "list",
        items: [
          "**Empty ≠ loading** — a loaded-but-empty list needs an empty state (illustration + CTA), not a spinner. Distinguish them.",
          "**Error with retry** — always give a way to recover; for refresh errors keep existing content and show a snackbar instead of replacing the whole screen.",
          "**Paging states** — append/prepend loading and errors render as extra `item { }` entries at the list ends (Paging 3's `LoadState`).",
          "**Skeletons** — for first load, placeholder skeleton items feel faster than a centered spinner.",
        ],
      },
      {
        t: "note",
        text: "Model list state as Loading/Empty/Error/Content and branch — empty is NOT the same as loading (show an empty-state CTA). Errors need retry; for refresh keep content + snackbar. Paging append/prepend states render as extra item{} at the ends. Skeletons beat a bare spinner.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you implement swipe-to-dismiss on list items?",
    a: [
      {
        t: "p",
        text: "Material3's `SwipeToDismissBox` wraps each item; the user swipes it away, revealing a background (e.g. a delete color/icon), and you handle the dismissed state to remove the item. It's driven by a `SwipeToDismissBoxState` per item.",
      },
      {
        t: "code",
        title: "SwipeToDismissBox per item",
        code: `items(list, key = { it.id }) { item ->
    val state = rememberSwipeToDismissBoxState(
        confirmValueChange = { if (it == SwipeToDismissBoxValue.EndToStart) { viewModel.delete(item.id); true } else false }
    )
    SwipeToDismissBox(
        state = state,
        backgroundContent = { DeleteBackground() },
        modifier = Modifier.animateItem(),    // animate the collapse after removal
    ) { ItemRow(item) }
}`,
      },
      {
        t: "list",
        items: [
          "**Per-item state** — each row has its own `SwipeToDismissBoxState`; keyed items keep that state correct as the list changes.",
          "**`confirmValueChange`** — decide whether the swipe commits (and trigger the delete) or snaps back.",
          "**Combine with `animateItem()`** — so the list smoothly closes the gap after removal.",
          "**Offer undo** — deleting on swipe pairs well with a snackbar 'Undo' rather than a confirm dialog.",
        ],
      },
      {
        t: "note",
        text: "Wrap rows in Material3 SwipeToDismissBox with a per-item rememberSwipeToDismissBoxState; confirmValueChange commits the delete or snaps back, backgroundContent shows the reveal. Combine with animateItem() to close the gap, and offer snackbar undo. Stable keys keep per-item state right.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you track item impressions/analytics using LazyListState and snapshotFlow?",
    a: [
      {
        t: "p",
        text: "To log which items became visible (impressions for analytics/ads), observe `LazyListState.layoutInfo.visibleItemsInfo` via `snapshotFlow`. `snapshotFlow` turns snapshot state into a cold Flow that emits when the observed state changes, letting you debounce and dedupe impression events off the UI thread of recomposition.",
      },
      {
        t: "code",
        title: "Impression tracking",
        code: `val listState = rememberLazyListState()
LaunchedEffect(listState) {
    snapshotFlow { listState.layoutInfo.visibleItemsInfo.map { it.key } }
        .distinctUntilChanged()
        .collect { visibleKeys -> analytics.onItemsVisible(visibleKeys) }
}`,
      },
      {
        t: "list",
        items: [
          "**`snapshotFlow { }`** — reads snapshot state (the visible items) and emits when it changes; runs in the `LaunchedEffect` coroutine, not per-recomposition.",
          "**Dedupe/debounce** — `distinctUntilChanged`, `debounce`, or a threshold (e.g. item ≥50% visible for ≥1s) to count a genuine impression, not a fast scroll-by.",
          "**Use item `key`** — track by stable keys so impressions map to real items across recomposition.",
          "**Why not recompose-based** — reading visibleItemsInfo in composition recomposes every frame; `snapshotFlow` is the correct side-effect channel.",
        ],
      },
      {
        t: "note",
        text: "Track impressions with snapshotFlow { listState.layoutInfo.visibleItemsInfo.map { it.key } } inside a LaunchedEffect, then distinctUntilChanged/debounce and a visibility-duration threshold for real impressions. It emits off the recomposition path — never read visibleItemsInfo directly in composition.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does a lazy list decide what to compose, and what is item prefetching?",
    a: [
      {
        t: "p",
        text: "A lazy list composes only the items currently in (or just outside) the viewport, plus a *prefetch* buffer: as the user scrolls, it proactively composes and measures the next item(s) just beyond the visible edge on a background frame, so they're ready to display without a hitch. Items scrolled far away are disposed and their compositions recycled.",
      },
      {
        t: "list",
        items: [
          "**Viewport + buffer** — only visible items (and a small ahead-of-scroll prefetch) are composed; the rest exist only as a lightweight description in the `LazyListScope`.",
          "**Prefetching** — the next item is composed/measured ahead of time during idle frame budget, reducing jank when it scrolls in. This is why smooth debug scrolling can still jank if items are expensive.",
          "**Disposal + reuse** — items that scroll far off are disposed (their `remember`ed state forgotten unless hoisted); their compositions feed the reuse pool (keyed by `contentType`).",
          "**Implications** — keep item composition cheap (heavy per-item work defeats prefetch), and never rely on off-screen items keeping state.",
        ],
      },
      {
        t: "note",
        text: "Lazy lists compose only visible items plus a prefetch buffer (next items composed ahead on idle frames for smooth scroll-in); far-off items are disposed and their compositions reused (by contentType). Keep item composition cheap or prefetch can't keep up — and don't rely on off-screen item state.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you preserve a list's scroll position across navigation and process death?",
    a: [
      {
        t: "p",
        text: "`rememberLazyListState()` survives recomposition and, because it's saveable, configuration changes (rotation) — but it's tied to the composable's lifetime. When you navigate away and back, the composable is disposed, so you need the state to be restored: `rememberLazyListState()` uses `rememberSaveable` under the hood, so it restores across config change and process death *as long as the composable is recreated at the same position with the same saver scope*.",
      },
      {
        t: "list",
        items: [
          "**Within a screen** — `rememberLazyListState()` already restores scroll position across rotation/process death (it's backed by a Saver).",
          "**Across navigation** — Navigation Compose saves/restores the back stack entry's saved state; a list state remembered in the composable is restored when you return, provided the destination is recreated (not a fresh instance). If you pop and re-push, it resets.",
          "**Data must match** — restored scroll index only makes sense if the list has the same items; restore data (e.g. from cache) before or alongside, or the index points at different content.",
          "**For paged/remote lists** — you may need to re-fetch to the saved position; keying items stably lets the state re-anchor.",
        ],
      },
      {
        t: "note",
        text: "rememberLazyListState() is Saver-backed, so it restores scroll position across rotation and process death automatically, and across Navigation Compose back-stack restoration. Caveat: the list must have the same items on restore (load cache first), or the saved index points at different content.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you nest a horizontal list inside a vertical list (e.g. a 'shelf' UI)?",
    a: [
      {
        t: "p",
        text: "Nesting a `LazyRow` inside a `LazyColumn` is fully supported and common (Play Store / Netflix 'shelves') because the two scroll on *different axes* — there's no ambiguity about which handles a gesture. Each `LazyRow` is one item of the `LazyColumn`. (Contrast with nesting same-axis scrollables, which is what crashes.)",
      },
      {
        t: "code",
        title: "Vertical list of horizontal shelves",
        code: `LazyColumn {
    items(shelves, key = { it.id }) { shelf ->
        Text(shelf.title)
        LazyRow {                                    // horizontal — different axis, OK
            items(shelf.items, key = { it.id }) { Card(it) }
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Different axes = fine** — `LazyRow` in `LazyColumn` (or vice-versa) works; the outer scrolls vertically, inner horizontally.",
          "**Give each `LazyRow` its own state** if you need to control/observe its scroll (`rememberLazyListState()` per row — key it by shelf if reused).",
          "**Same axis = crash** — a `LazyColumn` directly inside a vertically-scrolling parent throws (infinite height constraints). Keep nesting cross-axis.",
          "**Performance** — each row prefetches independently; keep card content light since many rows may be near the viewport.",
        ],
      },
      {
        t: "note",
        text: "LazyRow inside LazyColumn (shelves) is supported — different scroll axes, no gesture conflict. Each LazyRow is one LazyColumn item; give rows their own keyed state if you observe them. Only SAME-axis nesting (LazyColumn in a verticalScroll) crashes on infinite constraints.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you add uniform spacing between lazy list items?",
    a: [
      {
        t: "p",
        text: "Use the container's `verticalArrangement = Arrangement.spacedBy(dp)` (or `horizontalArrangement` for a LazyRow) to put a consistent gap between items — cleaner than adding padding to each item or emitting Spacers. Combine with `contentPadding` for space at the list's outer edges.",
      },
      {
        t: "code",
        title: "Spacing done right",
        code: `LazyColumn(
    verticalArrangement = Arrangement.spacedBy(12.dp),   // gap BETWEEN items only
    contentPadding = PaddingValues(16.dp),               // space around the whole content
) {
    items(list, key = { it.id }) { Row(it) }
}`,
      },
      {
        t: "list",
        items: [
          "**`Arrangement.spacedBy`** — one gap between adjacent items, none at the ends (no leading/trailing extra space).",
          "**`contentPadding`** — space at the top/bottom (and sides) of the scrollable content, scrolled-through and clipped at the edge.",
          "**Avoid per-item padding for gaps** — it double-spaces adjacent items and adds padding at the very ends where you may not want it.",
        ],
      },
      {
        t: "note",
        text: "Use verticalArrangement/horizontalArrangement = Arrangement.spacedBy(dp) for uniform gaps BETWEEN items (none at the ends), plus contentPadding for outer edge space. Don't put padding on each item for gaps — it double-spaces neighbors and pads the ends.",
      },
    ],
  },
  {
    level: "senior",
    q: "What's your checklist for keeping a large/complex lazy list smooth?",
    a: [
      {
        t: "p",
        text: "Lazy-list jank almost always comes from expensive item composition, missing keys/contentType, or reading rapidly-changing state during composition. Here's the practical checklist to keep 60/120fps.",
      },
      {
        t: "list",
        items: [
          "**Provide stable `key`** — correct state/animation and better reuse.",
          "**Provide `contentType`** for mixed lists — enables per-type composition reuse.",
          "**Keep item content cheap** — no heavy work in the item body; precompute in the ViewModel, hoist derived values, avoid large `Modifier` chains and unnecessary nesting.",
          "**Ensure items are stable/skippable** — pass immutable data; unstable params force item recomposition on unrelated changes.",
          "**Don't read scroll state directly** — use `derivedStateOf`/`snapshotFlow` so you don't recompose items every frame.",
          "**Defer state reads to draw** — use `graphicsLayer { }` lambda for scroll-driven visual effects instead of layout-affecting modifiers.",
          "**Image loading** — use Coil with proper sizing/placeholders; oversized bitmaps cause GC jank.",
          "**Generate a Baseline Profile** — precompiles Compose/list code so first scrolls aren't interpreted (huge real-device win).",
          "**Profile on a release build** on a real mid-tier device — never judge on debug.",
        ],
      },
      {
        t: "note",
        text: "Smooth-list checklist: stable key + contentType, cheap/stable item content (immutable data), no direct scroll-state reads (derivedStateOf/snapshotFlow), graphicsLayer for scroll effects, right-sized image loading, a Baseline Profile, and profile on a RELEASE build on a real device. Jank = expensive items or missing keys.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between scrollToItem and animateScrollToItem, and how do you use a scroll offset?",
    a: [
      {
        t: "p",
        text: "Both move a `LazyColumn` to a target item via its `LazyListState`, but `scrollToItem` jumps *instantly* while `animateScrollToItem` *smoothly animates* the scroll. Both are `suspend` functions (call them from a coroutine) and accept an optional pixel `scrollOffset` to fine-tune the final position.",
      },
      {
        t: "code",
        title: "Programmatic scrolling",
        code: `val state = rememberLazyListState()
val scope = rememberCoroutineScope()

scope.launch { state.scrollToItem(index = 0) }               // instant jump to top
scope.launch { state.animateScrollToItem(index = 20) }       // smooth scroll to item 20
scope.launch { state.animateScrollToItem(index = 20, scrollOffset = -32) } // 32px above the top edge`,
      },
      {
        t: "list",
        items: [
          "**`scrollToItem`** — instant; use for 'jump to top' on tab reselect, or restoring a position without animation.",
          "**`animateScrollToItem`** — animated; use for user-visible navigation to a section.",
          "**`scrollOffset`** — pixels to offset the item from the viewport start (e.g. leave room for a sticky header).",
          "**They're `suspend`** — launch from `rememberCoroutineScope()` (a click handler) or inside a `LaunchedEffect`.",
        ],
      },
      {
        t: "note",
        text: "scrollToItem = instant jump, animateScrollToItem = smooth animated; both suspend (launch from a scope) and take a pixel scrollOffset to fine-tune (e.g. leave room under a sticky header). Use instant for jump-to-top/restore, animated for user-facing navigation.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you build a chat-style list that starts at the bottom (reverseLayout)?",
    a: [
      {
        t: "p",
        text: "Set `reverseLayout = true` on the `LazyColumn` — items are laid out from the bottom up, so index 0 sits at the bottom and the list starts scrolled to the newest message. You typically also reverse (or emit newest-first) your data so the freshest item is at index 0.",
      },
      {
        t: "code",
        title: "Chat list",
        code: `LazyColumn(
    reverseLayout = true,               // index 0 at the bottom; starts at newest
    verticalArrangement = Arrangement.spacedBy(4.dp),
) {
    items(messagesNewestFirst, key = { it.id }) { MessageBubble(it) }
}
// On a new message, scroll to keep the newest visible:
LaunchedEffect(messages.size) { if (atBottom) state.animateScrollToItem(0) }`,
      },
      {
        t: "list",
        items: [
          "**`reverseLayout = true`** — bottom-anchored; naturally starts at the newest message and grows upward.",
          "**Data order** — provide messages newest-first (index 0 = newest) so the reversed layout shows them chronologically.",
          "**Auto-scroll on new message** — only auto-scroll if the user is already at the bottom (check `firstVisibleItemIndex == 0`), so you don't yank them away while reading history.",
          "**Load older on scroll up** — detect nearing the end (top, visually) to page in history.",
        ],
      },
      {
        t: "note",
        text: "reverseLayout = true anchors the list to the bottom (index 0 at bottom) — ideal for chat: starts at the newest, grows upward. Provide messages newest-first, auto-scroll to item 0 on new messages ONLY if the user is already at the bottom, and page history on scroll-up.",
      },
    ],
  },
  {
    level: "junior",
    q: "When should you NOT use a LazyColumn?",
    a: [
      {
        t: "p",
        text: "Lazy lists have real overhead (the lazy machinery, item reuse pools, scroll state). For a small, fixed number of items you know will all be shown, a plain `Column` (with `verticalScroll` if needed) is simpler and often faster — and it lets children measure normally without lazy constraints.",
      },
      {
        t: "list",
        items: [
          "**Small, fixed count** — a handful of items (a settings screen, a form): use `Column`; the lazy overhead isn't worth it.",
          "**Non-scrolling content** — if it fits on screen, `Column` alone; no scroll container needed.",
          "**All items always visible** — no benefit to lazy composition when nothing is off-screen.",
          "**Use `LazyColumn` when** — the list is long, unbounded, or dynamically sized, so composing only visible items matters.",
          "**Gotcha** — never put a `LazyColumn` inside a `verticalScroll` `Column`; if you need a scrolling screen with a list section, make the whole thing a `LazyColumn` and use `item { }` for the non-list parts.",
        ],
      },
      {
        t: "note",
        text: "Use a plain Column (± verticalScroll) for small, fixed, all-visible content (settings, forms) — LazyColumn's machinery is overkill and can't nest in a verticalScroll anyway. Reserve LazyColumn for long/unbounded/dynamic lists where composing only visible items pays off; wrap mixed screens as one LazyColumn with item{}.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you show a loading footer / 'load more' spinner at the end of a list?",
    a: [
      {
        t: "p",
        text: "Emit an extra `item { }` at the end of the `LazyColumn` that renders a spinner (or an error-with-retry row) based on your append/load-more state. Because it's a real lazy item, it only composes when the user scrolls to the bottom — which is also the natural trigger point for loading the next page.",
      },
      {
        t: "code",
        title: "Append footer",
        code: `LazyColumn {
    items(items, key = { it.id }) { Row(it) }
    if (appendState == LoadState.Loading) {
        item { Box(Modifier.fillMaxWidth().padding(16.dp), Alignment.Center) { CircularProgressIndicator() } }
    }
    if (appendState is LoadState.Error) {
        item { RetryRow(onRetry = viewModel::retryAppend) }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Footer as an `item { }`** — composes only when scrolled into view; render spinner or error/retry from your append state.",
          "**Paging 3** — exposes this as `loadState.append` (Loading/Error/NotLoading); wire the footer to it instead of hand-rolling.",
          "**Distinct from refresh** — the *append* footer is separate from the top *refresh* indicator; model both states.",
        ],
      },
      {
        t: "note",
        text: "Add a trailing item { } that shows a spinner or retry row based on your append/loadState — it only composes when scrolled to the bottom. Paging 3 gives loadState.append (Loading/Error/NotLoading) to wire it directly. Keep append state separate from top-refresh state.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you scroll a specific item into view when it receives focus or on demand (BringIntoViewRequester)?",
    a: [
      {
        t: "p",
        text: "`BringIntoViewRequester` lets a child ask its scrollable ancestors to scroll it into the visible area — useful when a field gains focus (so the keyboard doesn't cover it) or when you programmatically need to reveal a nested element whose index you don't track. You attach a requester to the element and call `bringIntoView()` from a coroutine.",
      },
      {
        t: "code",
        title: "BringIntoViewRequester",
        code: `val requester = remember { BringIntoViewRequester() }
val scope = rememberCoroutineScope()
TextField(
    modifier = Modifier
        .bringIntoViewRequester(requester)
        .onFocusEvent { if (it.isFocused) scope.launch { requester.bringIntoView() } },
    ...
)`,
      },
      {
        t: "list",
        items: [
          "**Element-driven scrolling** — unlike `animateScrollToItem` (which needs an index), this works from the child; the scroll parents cooperate to reveal it.",
          "**Common for forms** — bring a focused `TextField` above the IME so it isn't hidden (pair with `imePadding`).",
          "**Works across nested scrollables** — the request propagates up through scroll parents.",
        ],
      },
      {
        t: "note",
        text: "BringIntoViewRequester lets a child ask scroll ancestors to reveal it (call bringIntoView() in a coroutine) — no index needed, unlike animateScrollToItem. Classic use: scroll a focused TextField above the keyboard (with imePadding). It propagates through nested scrollables.",
      },
    ],
  },
];

export default qa;
