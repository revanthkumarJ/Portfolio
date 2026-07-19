// Lazy Lists — Content tab. Teaching-first.

const content = [
  {
    heading: "Why lazy lists exist — the RecyclerView problem, solved differently",
    blocks: [
      {
        t: "p",
        text: "A list of 10,000 items can't create 10,000 UI elements — memory and time forbid it. The View system solved this with **RecyclerView**: a machine that *recycles* a small pool of ViewHolders, rebinding them as you scroll (with adapters, view types, DiffUtil — a lot of ceremony). Compose solves the same problem with **lazy composition**: `LazyColumn` composes **only the items currently visible** (plus a small buffer), and as you scroll, items leaving the viewport are *disposed* while entering ones are *composed*. No adapter, no ViewHolder, no DiffUtil — the item lambda is the whole API.",
      },
      {
        t: "code",
        title: "The core API",
        code: `LazyColumn(
    state = rememberLazyListState(),
    contentPadding = PaddingValues(16.dp),
    verticalArrangement = Arrangement.spacedBy(8.dp),
) {
    item { Header() }                              // single item

    items(
        items = articles,
        key = { it.id },                           // STABLE identity — crucial
        contentType = { "article" },               // reuse hint
    ) { article ->
        ArticleCard(article)
    }

    item { Footer() }
}`,
      },
      {
        t: "list",
        items: [
          "**The DSL, not composables**: the `LazyColumn` block is a `LazyListScope` — `item { }` / `items(...)` are *descriptions* registered up front; the lambdas run only when their item scrolls into view. You cannot call arbitrary composables directly in the scope (compile error) — a common early confusion.",
          "Under the hood it's built on **SubcomposeLayout**: at measure time, knowing the viewport, it subcomposes items one by one until the viewport (plus `beyondBoundsItemCount` buffer) is filled.",
          "**Contrast with `Column + verticalScroll`**: that composes *every* child immediately — fine for a settings page of 15 rows, catastrophic for a feed. The decision rule: bounded, small, static content → scrollable Column; unbounded/large/dynamic → LazyColumn.",
          "The family: `LazyRow`, `LazyVerticalGrid`/`LazyHorizontalGrid` (with `GridCells.Fixed(2)` / `Adaptive(120.dp)`), `LazyVerticalStaggeredGrid`, and `HorizontalPager`/`VerticalPager` (same lazy machinery, page-snapping behavior).",
        ],
      },
    ],
  },
  {
    heading: "Keys — the most important parameter you can pass",
    blocks: [
      {
        t: "p",
        text: "By default, an item's identity is its **position** (index). That's fine for a static list, and quietly wrong for anything that changes. Suppose item #0 is deleted: every remaining item shifts to a new index — to Compose, *every item changed*, so every visible item recomposes, and worse, **item state migrates to the wrong items**: the `remember`ed 'expanded' flag of old item 3 now belongs to whatever sits at index 3.",
      },
      {
        t: "code",
        title: "What keys fix",
        code: `// WITHOUT key: delete one item ->
//  - every item after it recomposes (index identity shifted)
//  - remembered state (expanded flags, animations) attaches to WRONG items
//  - no sensible item animations possible

items(messages) { msg -> MessageRow(msg) }

// WITH key: identity follows the DATA ->
//  - unmoved items untouched, moved items keep their state
//  - animateItem() can animate reorders/insertions/deletions
items(messages, key = { it.id }) { msg ->
    MessageRow(msg, Modifier.animateItem())
}`,
      },
      {
        t: "list",
        items: [
          "**Key requirements**: stable (same item → same key across updates), unique within the list, and **saveable** (keys go into saved instance state so scroll position survives recreation — a data-class id is fine, an unparcelable object is not).",
          "**Never use the index as the key** — that's just re-stating the default with extra steps.",
          "Keys are also what `rememberLazyListState()` uses to keep **scroll position anchored to an item** when the list changes above the viewport: with keys, inserting items above doesn't visually jump the list.",
          "`contentType` is the *other* hint: items of the same type can **reuse each other's node structure** when scrolled (Compose keeps a small reuse pool per type, RecyclerView-style but automatic) — meaningful for mixed feeds (ads vs posts); harmless to omit for uniform lists.",
        ],
      },
    ],
  },
  {
    heading: "LazyListState — scroll position, programmatic control, derived facts",
    blocks: [
      {
        t: "code",
        title: "The state object and the standard patterns around it",
        code: `val listState = rememberLazyListState()
val scope = rememberCoroutineScope()

LazyColumn(state = listState) { /* ... */ }

// Programmatic scrolling (suspend — needs a coroutine)
Button(onClick = {
    scope.launch { listState.animateScrollToItem(0) }
}) { Text("Back to top") }

// Reacting to scroll WITHOUT recomposing every frame:
val showFab by remember {
    derivedStateOf { listState.firstVisibleItemIndex > 5 }
}

// Infinite scroll / load-more trigger:
val shouldLoadMore by remember {
    derivedStateOf {
        val last = listState.layoutInfo.visibleItemsInfo.lastOrNull()
        last != null && last.index >= listState.layoutInfo.totalItemsCount - 5
    }
}
LaunchedEffect(shouldLoadMore) {
    if (shouldLoadMore) viewModel.loadNextPage()
}`,
      },
      {
        t: "list",
        items: [
          "`rememberLazyListState()` survives recomposition *and* recreation (it's internally saveable — scroll position restores after rotation, keyed to item + offset).",
          "`firstVisibleItemIndex` / `firstVisibleItemScrollOffset` change **every scroll frame** — reading them raw in composition recomposes continuously; wrap scroll-derived booleans in **`derivedStateOf`** (the canonical use case for it).",
          "`layoutInfo` exposes the full visible-items snapshot (indices, offsets, sizes, viewport) — the basis for load-more triggers, scroll analytics, and 'current section' headers.",
          "`scrollToItem` (instant) vs `animateScrollToItem` (animated) — both suspend functions, called from `rememberCoroutineScope()` in event handlers.",
        ],
      },
    ],
  },
  {
    heading: "Performance rules for lazy lists",
    blocks: [
      {
        t: "list",
        items: [
          "**Always provide keys** for changeable data — identity correctness *is* performance (prevents cascade recomposition on inserts/removals).",
          "**Keep item composables cheap and skippable**: stable parameters (immutable item models), no heavy computation in item bodies — an item composes *during scroll*, on the frame deadline; expensive items = dropped frames at the scroll edge.",
          "**Don't fetch/compute per item-composition**: item lambdas re-run whenever items scroll back into view — image loading must go through a caching loader (Coil handles this), formatting should live in the UI model, not the item body.",
          "**Never nest a lazy list inside a same-direction scrollable** (`LazyColumn` in `verticalScroll` Column) — infinite max-height constraints crash at runtime (\"Vertically scrollable component was measured with an infinity maximum height\"). Restructure: make everything items of ONE LazyColumn (`item { Header() }` + `items(feed)`), which is also the correct virtualization.",
          "**Cross-direction nesting is fine and idiomatic**: `LazyRow` inside `LazyColumn` items (Netflix-style carousels) — give the rows `contentType` and their own keys.",
          "**Avoid 0-pixel initial layouts**: a LazyColumn inside a parent that measures it with zero height composes nothing, then everything when sized — a subtle jank source in dynamically-sized containers.",
          "**Item animations**: `Modifier.animateItem()` (placement/appearance/disappearance) requires keys; without keys there is no 'same item moved' concept to animate.",
          "In debug builds lazy scrolling is notably janky — **judge scroll performance only on release/R8 builds** (or at least with baseline profiles applied); this one sentence defuses a very common false alarm.",
        ],
      },
    ],
  },
  {
    heading: "Sticky headers, multiple item types, and real feed structure",
    blocks: [
      {
        t: "code",
        title: "A realistic sectioned feed",
        code: `LazyColumn {
    contactsByLetter.forEach { (letter, contacts) ->
        stickyHeader(key = "header-" + letter) {   // pins until next header pushes it
            LetterHeader(letter)
        }
        items(contacts, key = { it.id }, contentType = { "contact" }) {
            ContactRow(it)
        }
    }

    item(contentType = "loader") {
        if (isLoadingMore) LoadingRow()
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Heterogeneous lists need no view-type enums**: the item lambda is code — `when (item) { is Ad -> AdCard(item); is Post -> PostCard(item) }`; `contentType = { it::class }` keeps the reuse pool efficient per type.",
          "**`stickyHeader`** pins the current section header to the top until the next one arrives — the RecyclerView ItemDecoration nightmare reduced to one DSL call.",
          "Building sections by iterating a grouped map inside the DSL is normal — the DSL executes eagerly (it's cheap registration); only item *content* lambdas are lazy.",
        ],
      },
    ],
  },
  {
    heading: "Paging 3 integration — infinite lists from the data layer",
    blocks: [
      {
        t: "p",
        text: "For genuinely unbounded data (network pages, DB + network), hand-rolling load-more triggers gets messy — **Paging 3** formalizes it: the data layer exposes `Flow<PagingData<T>>`, and Compose consumes it with `collectAsLazyPagingItems()`:",
      },
      {
        t: "code",
        title: "Paging 3 in Compose",
        code: `val pagingItems = viewModel.articles.collectAsLazyPagingItems()

LazyColumn {
    items(
        count = pagingItems.itemCount,
        key = pagingItems.itemKey { it.id },
        contentType = pagingItems.itemContentType { "article" },
    ) { index ->
        val article = pagingItems[index]           // triggers page loads
        if (article != null) ArticleCard(article)
        else ArticlePlaceholder()                  // placeholders enabled
    }

    when (pagingItems.loadState.append) {          // footer states
        is LoadState.Loading -> item { LoadingRow() }
        is LoadState.Error -> item { RetryRow { pagingItems.retry() } }
        else -> Unit
    }
}`,
      },
      {
        t: "list",
        items: [
          "Accessing `pagingItems[index]` near the loaded edge is what triggers fetching the next page — the 'load more' logic lives in the library, not your scroll math.",
          "`loadState.refresh` / `append` / `prepend` give you first-load spinners, end-of-list errors and retry — model them as list items, not overlays, for correct UX.",
          "Mention-worthy nuance: `PagingData` is a stream of *self-updating list snapshots* — it doesn't fit `stateIn`/normal Flow operators; it's cached with `cachedIn(viewModelScope)` (mandatory, or rotation re-fetches everything).",
        ],
      },
    ],
  },
];

export default content;
