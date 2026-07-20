// Paging 3 — Content tab. Teaching-first.

const content = [
  {
    heading: "The problem Paging solves",
    blocks: [
      {
        t: "p",
        text: "Some lists are effectively unbounded — a social feed, search results, a message history with thousands of entries. Loading *all* of it at once is impossible: it would exhaust memory, take forever, and waste bandwidth on data the user never scrolls to. The solution is **pagination** — loading the data in small chunks ('pages') as the user scrolls. **Paging 3** is Jetpack's library that handles this: it loads pages on demand, manages the in-memory list, triggers the next load as the user approaches the end, and integrates loading/error states.",
      },
      {
        t: "list",
        items: [
          "Doing pagination by hand is surprisingly hard: tracking the current page, detecting when to load more (scroll math), deduplicating requests, handling errors and retries, showing loading indicators at the right place, and keeping memory bounded. Paging 3 encapsulates all of it.",
          "It's the recommended solution for large/unbounded lists, integrating with Room (as the source of truth), Compose/RecyclerView (UI), and coroutines/Flow.",
        ],
      },
    ],
  },
  {
    heading: "The core pieces: PagingSource, Pager, PagingData",
    blocks: [
      {
        t: "code",
        title: "The three building blocks",
        code: `// 1) PagingSource — defines HOW to load a page (given a key, return items + next key)
class ArticlePagingSource(private val api: Api) : PagingSource<Int, Article>() {
    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, Article> {
        return try {
            val page = params.key ?: 1
            val response = api.getArticles(page, params.loadSize)
            LoadResult.Page(
                data = response.items,
                prevKey = if (page == 1) null else page - 1,
                nextKey = if (response.items.isEmpty()) null else page + 1,
            )
        } catch (e: Exception) {
            LoadResult.Error(e)
        }
    }
    override fun getRefreshKey(state: PagingState<Int, Article>): Int? = null
}

// 2) Pager — configures paging and produces a stream of PagingData
val pager = Pager(PagingConfig(pageSize = 20)) { ArticlePagingSource(api) }

// 3) PagingData — a stream of paged data the ViewModel exposes
val articles: Flow<PagingData<Article>> = pager.flow.cachedIn(viewModelScope)`,
      },
      {
        t: "list",
        items: [
          "**`PagingSource`** — you implement `load()`: given a *key* (usually a page number or a cursor), return a `LoadResult.Page` with the items plus the *previous* and *next* keys (or `LoadResult.Error` on failure). This is where you define *how* to fetch a page. The keys chain the pages together.",
          "**`Pager`** — configured with `PagingConfig` (page size, prefetch distance, etc.), it turns your `PagingSource` into a `Flow<PagingData<T>>`.",
          "**`PagingData`** — a container for one snapshot of paged data. It's a *stream of self-updating list snapshots*, not a normal list — which is why it needs its own consumption API and doesn't work with regular Flow operators like `stateIn`.",
          "**`cachedIn(scope)`** — *mandatory* in the ViewModel: it caches the loaded pages in the given scope so they survive configuration changes. Without it, rotating the device re-fetches everything from page 1.",
        ],
      },
    ],
  },
  {
    heading: "Consuming PagingData in the UI",
    blocks: [
      {
        t: "code",
        title: "In Compose",
        code: `val items = viewModel.articles.collectAsLazyPagingItems()

LazyColumn {
    items(
        count = items.itemCount,
        key = items.itemKey { it.id },
        contentType = items.itemContentType { "article" },
    ) { index ->
        val article = items[index]          // accessing near the edge triggers next load
        if (article != null) ArticleCard(article) else PlaceholderCard()
    }

    // Load states as list items:
    when (items.loadState.append) {
        is LoadState.Loading -> item { LoadingRow() }
        is LoadState.Error -> item { RetryRow { items.retry() } }
        else -> Unit
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`collectAsLazyPagingItems()`** (Compose) / `PagingDataAdapter` (RecyclerView) — the UI-side consumer. Accessing an item near the loaded edge is what *triggers* the next page load — no manual scroll listeners.",
          "**`loadState`** — exposes the loading/error/success state for `refresh` (initial load), `append` (loading more at the end), and `prepend` (loading at the start). You render these as list items (a spinner row, a retry row) or full-screen states — giving proper first-load spinners, end-of-list loaders, and retry.",
          "**Placeholders** — if enabled, Paging can show placeholder items (null entries) before their data loads, so the scrollbar reflects the full count and there's no visual jump.",
        ],
      },
    ],
  },
  {
    heading: "RemoteMediator — network + database paging (offline-first)",
    blocks: [
      {
        t: "p",
        text: "The most powerful Paging 3 setup combines network *and* database: the **`RemoteMediator`** loads pages from the network *into Room*, and the `PagingSource` reads pages *from Room*. Room is the single source of truth; the network fills it as the user scrolls. This gives offline-first pagination — cached pages are available offline, and scrolling fetches new pages when online.",
      },
      {
        t: "list",
        items: [
          "**How it fits together**: the `Pager` uses Room's `PagingSource` (Room generates one for a paged query — `@Query ... : PagingSource<Int, Entity>`) as the source, and a `RemoteMediator` as the thing that *fills* Room when the source runs out. As you scroll past the cached data, the mediator fetches the next network page and writes it to Room, which the `PagingSource` then serves.",
          "**Offline benefit**: because the UI reads from Room (the SSOT), previously-loaded pages are shown instantly and work offline; the network only fetches *new* pages. This is the pagination version of the offline-first / SSOT pattern.",
          "**`RemoteMediator.load()`** handles `REFRESH`/`APPEND`/`PREPEND` load types, writing fetched pages to Room in a transaction (often clearing on refresh), and tracks remote keys (the next-page tokens) in a separate table so it knows what to fetch next.",
        ],
      },
    ],
  },
  {
    heading: "Transformations and gotchas",
    blocks: [
      {
        t: "list",
        items: [
          "**Transforming PagingData**: use the dedicated operators (`map`, `filter`, `insertSeparators` on `PagingData`) *before* `cachedIn`, not regular Flow operators — `PagingData` isn't a normal Flow of values. `insertSeparators` adds headers/separators (e.g. date dividers) between items.",
          "**`cachedIn` is mandatory and interviewers check it**: forget it and every configuration change re-fetches from scratch (rotation reloads page 1, losing scroll position and wasting requests). Put it at the end of the pipeline in the ViewModel.",
          "**Keys must be stable**: pass `itemKey`/`itemContentType` in the UI (as with any lazy list) so inserts/updates don't cause cascade recomposition and item state migrates correctly.",
          "**When NOT to use Paging**: bounded lists that fit comfortably in memory (a user's 20 settings, a fixed menu) — Paging's ceremony (PagingSource, load states, cachedIn) is overkill. Use a plain `items(list)`. Paging earns its complexity only for genuinely large or unbounded, usually network-backed, data.",
        ],
      },
      {
        t: "note",
        text: "Paging 3 essentials: PagingSource (how to load a page — key → items + next/prev keys), Pager (config → Flow<PagingData>), PagingData (self-updating paged snapshots, needs cachedIn in the ViewModel — mandatory, or rotation re-fetches). Consume with collectAsLazyPagingItems / PagingDataAdapter; accessing near the edge triggers loads; loadState gives loading/error/retry as list items. RemoteMediator + Room = offline-first paging (network fills Room, UI reads Room). Only use Paging for genuinely large/unbounded lists.",
      },
    ],
  },
];

export default content;
