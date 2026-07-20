// Paging 3 — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What problem does Paging 3 solve?",
    a: [
      {
        t: "p",
        text: "**Paging 3 handles loading large or unbounded lists in small chunks ('pages') as the user scrolls, instead of loading everything at once.** For a feed, search results, or a long message history, loading all the data would exhaust memory, be slow, and waste bandwidth on data the user never reaches. Pagination loads a page at a time, on demand.",
      },
      {
        t: "p",
        text: "The reason to use the library rather than rolling your own is that manual pagination is deceptively hard: you'd have to track the current page, detect when the user is near the end (scroll math), avoid firing duplicate load requests, handle errors and retries, show loading indicators in the right place, and keep memory bounded by discarding far-away pages. Paging 3 encapsulates all of that. It integrates with Room (as the local source of truth), with Compose and RecyclerView on the UI side, and with coroutines/Flow, exposing paged data as a `Flow<PagingData<T>>`. It's the recommended solution whenever a list is genuinely large or unbounded.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the main components of Paging 3?",
    a: [
      {
        t: "list",
        items: [
          "**`PagingSource`** — defines *how* to load a page. You implement `load()`: given a key (usually a page number or cursor), fetch that page and return the items plus the previous and next keys (which chain the pages together), or an error. This is where your actual data-fetching logic lives.",
          "**`Pager`** — configured with a `PagingConfig` (page size, prefetch distance), it turns your `PagingSource` into a `Flow<PagingData<T>>`.",
          "**`PagingData`** — a container for a snapshot of paged data; it's a self-updating stream of paged list snapshots that the ViewModel exposes and the UI consumes.",
          "**UI consumer** — `collectAsLazyPagingItems()` in Compose or a `PagingDataAdapter` in RecyclerView, which displays the items and triggers loads as you scroll.",
        ],
      },
      {
        t: "p",
        text: "The flow is: `PagingSource` (how to load) → `Pager` (configuration) → `Flow<PagingData>` (exposed by the ViewModel, cached with `cachedIn`) → UI consumer (displays and triggers loading). Optionally a `RemoteMediator` sits alongside to fill a local Room database from the network for offline-first paging. Accessing an item near the end of the loaded data is what automatically triggers loading the next page — you never write scroll-position math yourself.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does the UI load more data as the user scrolls in Paging 3?",
    a: [
      {
        t: "p",
        text: "**Automatically — accessing an item near the edge of the currently-loaded data triggers the next page load; you don't write any scroll-detection logic.** When you display paged items (via `collectAsLazyPagingItems` in Compose or `PagingDataAdapter` in RecyclerView) and the user scrolls so that they're accessing items close to the end of what's loaded, Paging detects this (based on the `prefetchDistance` in `PagingConfig`) and calls your `PagingSource.load()` (or `RemoteMediator`) to fetch the next page.",
      },
      {
        t: "code",
        title: "Accessing items drives loading",
        code: `val items = viewModel.feed.collectAsLazyPagingItems()
LazyColumn {
    items(items.itemCount, key = items.itemKey { it.id }) { index ->
        val item = items[index]   // near the edge -> triggers next-page load
        if (item != null) Row(item) else Placeholder()
    }
}`,
      },
      {
        t: "p",
        text: "This is the big convenience over hand-rolled pagination, where you'd add a scroll listener, compute whether the last visible item is within N of the end, guard against firing while a load is in progress, and manually append results. Paging does all of that internally. You also get `loadState` to render the loading spinner (for the append) and an error/retry row as list items, so the 'loading more…' UI at the bottom is handled cleanly too.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does cachedIn do and why is it important?",
    a: [
      {
        t: "p",
        text: "**`cachedIn(scope)` caches the loaded pages in the given coroutine scope (usually `viewModelScope`) so they survive configuration changes.** You apply it at the end of the paging pipeline in the ViewModel: `pager.flow.cachedIn(viewModelScope)`.",
      },
      {
        t: "p",
        text: "**Why it's important — and why interviewers check for it**: without `cachedIn`, the `PagingData` flow is cold and tied to the collector, so when a configuration change happens (rotation), the whole thing restarts and **re-fetches from page 1**, losing all the pages the user had scrolled through and their scroll position. With `cachedIn(viewModelScope)`, the loaded pages are kept alive in the ViewModel's scope (which survives configuration changes), so after rotation the UI re-attaches to the *same* cached data — no re-fetch, scroll position preserved. It also makes the paging flow shareable/multicast-safe. Forgetting `cachedIn` is one of the most common Paging 3 bugs: everything *works*, but every rotation silently reloads from the start, wasting requests and jarring the user. So the rule is: always end your ViewModel's paging pipeline with `cachedIn(viewModelScope)` (after any `PagingData` transformations).",
      },
    ],
  },
  {
    level: "senior",
    q: "How does RemoteMediator enable offline-first pagination with Room?",
    a: [
      {
        t: "p",
        text: "**`RemoteMediator` implements the offline-first pattern for paging: the `PagingSource` reads pages from *Room* (the single source of truth), and the `RemoteMediator` *fills Room from the network* when the local data runs out. So the UI always reads from the local database — giving instant, offline-capable display of cached pages — while the network is only used to fetch *new* pages as the user scrolls past what's cached.**",
      },
      {
        t: "list",
        items: [
          "**The architecture**: the `Pager` is built with Room's `PagingSource` (Room auto-generates one for a paged query — a DAO method returning `PagingSource<Int, Entity>`) as the *source of items*, and a `RemoteMediator` as the *boundary callback* that runs when the source is about to run out of loaded items. The mediator fetches the next network page, writes it into Room (in a transaction), and Room's `PagingSource` then serves those newly-inserted rows to the UI.",
          "**`RemoteMediator.load()` handles three load types**: `REFRESH` (initial or pull-to-refresh — often clears Room and loads the first network page), `APPEND` (user scrolled to the end — fetch and insert the next page), and `PREPEND` (load earlier data, if applicable). It returns whether it reached the end of pagination.",
          "**Remote keys tracking**: since the network uses page tokens/cursors that don't map cleanly to Room rows, you typically keep a separate `remote_keys` table storing the next/prev key per item or per page, so on `APPEND` the mediator knows what to fetch next. Managing these keys correctly is the fiddly part.",
          "**The offline benefit**: because the UI reads from Room, previously-loaded pages display *instantly and offline* — no network needed to re-show them. The network only fetches genuinely new pages. When offline, the user sees all cached pages; scrolling past them shows an error/end state until connectivity returns. This is the pagination-specific realization of the SSOT/offline-first architecture.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: `RemoteMediator` + Room is Paging's answer to 'how do I paginate a network list *and* have it work offline and survive process death?' The key insight is that Room remains the single source of truth — the UI never reads the network directly; the mediator's only job is to *populate* Room from the network at the right times. This gives you all the SSOT benefits (instant cached reads, offline support, consistency) applied to an unbounded, incrementally-loaded list. It's more setup than a pure-network `PagingSource` (you write the mediator, the remote-keys handling, and the Room queries), so you use it specifically when offline paging and caching matter — for a pure in-memory network list, a plain `PagingSource` without Room is simpler.",
      },
    ],
  },
  {
    level: "senior",
    q: "When should you NOT use Paging 3, and how does PagingData differ from a normal list/Flow?",
    a: [
      {
        t: "p",
        text: "**Don't use Paging 3 for bounded lists that fit comfortably in memory** — a user's settings, a fixed menu, a small fixed result set (a few dozen items). Paging's machinery — implementing a `PagingSource` (or `RemoteMediator`), handling load states, `cachedIn`, the special `PagingData` consumption API — is real complexity that only pays off for *genuinely large or unbounded* data, usually network-backed. For a small list, a plain `items(list)` over a `StateFlow<List<T>>` is far simpler and correct. Reaching for Paging on a 20-item list is over-engineering.",
      },
      {
        t: "list",
        items: [
          "**`PagingData` is NOT a normal list or a normal Flow of values** — it's a *stream of self-updating paged snapshots* with its own internal diffing and state. This has concrete consequences that trip people up:",
          "**You can't use regular Flow operators on its contents**: `stateIn`, `combine`, a plain `map` over the *list* don't apply. Instead, `PagingData` has its *own* operators — `PagingData.map`, `PagingData.filter`, `PagingData.insertSeparators` — which transform individual items *within* the paged stream, and you apply them *before* `cachedIn`. Trying to treat `PagingData` like a `Flow<List<T>>` and operate on it with normal collection/Flow functions doesn't work.",
          "**It doesn't hold a materialized list you can index freely**: you access items through the UI consumer (`collectAsLazyPagingItems`, which returns a `LazyPagingItems` you index by position, possibly getting null for not-yet-loaded placeholders). You don't get a `List<T>` you can call `.size` or `.filter` on directly.",
          "**It manages its own loading/error state** (`loadState` for refresh/append/prepend) rather than you tracking a separate `isLoading` boolean — because loading is per-page and ongoing, not a single state.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the decision is about data size and boundedness — Paging earns its complexity only for large/unbounded lists where incremental loading and bounded memory genuinely matter; for small lists it's needless ceremony. And understanding that `PagingData` is a *specialized reactive paging primitive*, not a list or ordinary Flow (hence its own `map`/`filter`/`insertSeparators`, `cachedIn`, and `loadState`), is what prevents the common mistakes of trying to `stateIn` it or operate on it with standard Flow/collection operators.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a PagingSource, and how do you implement one?",
    a: [
      {
        t: "p",
        text: "A `PagingSource<Key, Value>` defines how to load a page of data — you implement `load(params)` to fetch the page for a given key (e.g. a page number or item offset) and return a `LoadResult.Page` with the data, the previous key, and the next key (or `LoadResult.Error`). Paging calls it as the user scrolls. `getRefreshKey` tells Paging where to reload from on refresh.",
      },
      {
        t: "code",
        title: "A network PagingSource",
        code: `class UserPagingSource(private val api: Api) : PagingSource<Int, User>() {
    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, User> = try {
        val page = params.key ?: 1
        val users = api.getUsers(page, params.loadSize)
        LoadResult.Page(users, prevKey = if (page == 1) null else page - 1,
            nextKey = if (users.isEmpty()) null else page + 1)
    } catch (e: IOException) { LoadResult.Error(e) }
    override fun getRefreshKey(state: PagingState<Int, User>) = state.anchorPosition?.let { … }
}`,
      },
      {
        t: "list",
        items: [
          "**`load(params)`** — fetch a page; return `LoadResult.Page(data, prevKey, nextKey)`.",
          "**Keys** — page number/offset; `nextKey = null` signals the end.",
          "**`getRefreshKey`** — where to reload from on refresh.",
          "**Errors** — `LoadResult.Error` (retryable).",
        ],
      },
      {
        t: "note",
        text: "A PagingSource<Key, Value> implements load(params) — fetch a page for the key, return LoadResult.Page(data, prevKey, nextKey) (nextKey=null = end) or LoadResult.Error. getRefreshKey says where to reload on refresh. Paging calls it as the user scrolls. Room can generate a PagingSource from a @Query.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a Pager, and how do you configure it?",
    a: [
      {
        t: "p",
        text: "A `Pager` ties together a `PagingConfig` and a `PagingSource` factory to produce a `Flow<PagingData<T>>`. `PagingConfig` sets the `pageSize`, `prefetchDistance` (how far ahead to load), `initialLoadSize`, and `enablePlaceholders`. You build the `Pager` in the ViewModel/repository and expose its flow to the UI.",
      },
      {
        t: "code",
        title: "Building a Pager",
        code: `val pager = Pager(
    config = PagingConfig(pageSize = 20, prefetchDistance = 5, enablePlaceholders = false),
    pagingSourceFactory = { UserPagingSource(api) },
).flow.cachedIn(viewModelScope)`,
      },
      {
        t: "list",
        items: [
          "**`Pager(config, sourceFactory)`** — produces `Flow<PagingData<T>>`.",
          "**`PagingConfig`** — `pageSize`, `prefetchDistance`, `initialLoadSize`, `enablePlaceholders`.",
          "**`.cachedIn(scope)`** — cache the paged stream across config changes.",
          "**Expose the flow** — the UI collects and submits it.",
        ],
      },
      {
        t: "note",
        text: "A Pager(config, pagingSourceFactory) produces Flow<PagingData<T>>; PagingConfig sets pageSize/prefetchDistance/initialLoadSize/enablePlaceholders. Build it in the ViewModel/repo, .cachedIn(scope) to survive config changes, and expose the flow to the UI.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you display PagingData in Compose and in Views?",
    a: [
      {
        t: "p",
        text: "In Compose, collect the flow with `collectAsLazyPagingItems()` and render with `items(lazyPagingItems.itemCount) { }` (or the key/contentType overloads) inside a `LazyColumn`, handling `loadState`. In Views, use a `PagingDataAdapter` (a `RecyclerView.Adapter`) and call `submitData(pagingData)` from a coroutine. Both handle incremental loading and diffing automatically.",
      },
      {
        t: "code",
        title: "Compose paging list",
        code: `val items = viewModel.pagingFlow.collectAsLazyPagingItems()
LazyColumn {
    items(items.itemCount, key = items.itemKey { it.id }) { index ->
        items[index]?.let { UserRow(it) }
    }
    when (items.loadState.append) { is LoadState.Loading -> item { Spinner() }; else -> {} }
}`,
      },
      {
        t: "list",
        items: [
          "**Compose** — `collectAsLazyPagingItems()` + `LazyColumn`; handle `loadState`.",
          "**Views** — `PagingDataAdapter` + `submitData(pagingData)`.",
          "**Automatic** — incremental loading, diffing, placeholders.",
          "**Load states** — show append/refresh spinners and errors.",
        ],
      },
      {
        t: "note",
        text: "Compose: collectAsLazyPagingItems() + LazyColumn (items by itemCount, itemKey), handle loadState. Views: PagingDataAdapter + submitData(pagingData) from a coroutine. Both do incremental loading + diffing automatically; render append/refresh load states (spinners/errors).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle load states (loading, error, retry) in Paging 3?",
    a: [
      {
        t: "p",
        text: "Paging exposes `CombinedLoadStates` via `loadState` — with `refresh`, `append`, and `prepend` states, each `Loading`/`NotLoading`/`Error`. You render a full-screen spinner/error for `refresh`, inline spinners/retry rows for `append`/`prepend`, and call `retry()` on error. In Compose you read `lazyPagingItems.loadState`; in Views you add a `LoadStateAdapter` or observe `loadStateFlow`.",
      },
      {
        t: "list",
        items: [
          "**`refresh`** — initial/refresh load; full-screen spinner/error.",
          "**`append`/`prepend`** — loading more; inline spinner/retry row.",
          "**`retry()`** — re-attempt failed loads.",
          "**Compose `loadState` / Views `LoadStateAdapter`** — render the states.",
        ],
      },
      {
        t: "note",
        text: "Paging's CombinedLoadStates (loadState) has refresh/append/prepend, each Loading/NotLoading/Error. Render a full-screen spinner/error for refresh, inline spinner/retry for append/prepend, and call retry() on error. Compose reads lazyPagingItems.loadState; Views use a LoadStateAdapter/loadStateFlow.",
      },
    ],
  },
  {
    level: "senior",
    q: "What do placeholders do in Paging 3, and when should you enable them?",
    a: [
      {
        t: "p",
        text: "With `enablePlaceholders = true`, Paging reports the *total item count* up front and returns `null` items for not-yet-loaded positions — so the list shows placeholder UI (skeletons) and has an accurate scrollbar. It requires the data source to know the total count (`COUNT(*)` for Room). Disable placeholders when the count is unknown/expensive (most network sources) or you don't want null items.",
      },
      {
        t: "list",
        items: [
          "**Placeholders on** — total count known; null items for unloaded positions; accurate scrollbar/skeletons.",
          "**Needs a count** — Room provides it; many network sources don't.",
          "**Handle nulls** — your UI must render a placeholder for null items.",
          "**Off** — when count is unknown/expensive or nulls are undesirable.",
        ],
      },
      {
        t: "note",
        text: "enablePlaceholders = true reports the total count up front and returns null for unloaded positions (skeleton UI, accurate scrollbar) — needs the source to know the count (Room COUNT(*)). Your UI must render placeholders for null items. Disable when the count is unknown/expensive (network) or nulls are undesirable.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you transform PagingData (map, filter, insert separators)?",
    a: [
      {
        t: "p",
        text: "Apply transformations on the `PagingData` flow so they run per-page as data loads: `.map { }`/`.filter { }` transform items, and `.insertSeparators { before, after -> }` inserts header/separator items (e.g. date dividers). Do these *after* `cachedIn` if the transform is presentation-only (so it re-runs cheaply), or before if it should be cached. Filtering paged data can leave short pages, so prefer filtering at the source.",
      },
      {
        t: "code",
        title: "Transforming PagingData",
        code: `pager.flow
    .map { pagingData -> pagingData.map { it.toUiModel() } }
    .map { it.insertSeparators { before, after ->
        if (before?.date != after?.date) DateHeader(after?.date) else null } }
    .cachedIn(viewModelScope)`,
      },
      {
        t: "list",
        items: [
          "**`PagingData.map`/`filter`** — per-item transforms (run per page).",
          "**`insertSeparators`** — add headers/dividers between items.",
          "**Placement vs `cachedIn`** — cache expensive transforms; presentation ones after.",
          "**Filtering caveat** — can produce short pages; prefer filtering at the source.",
        ],
      },
      {
        t: "note",
        text: "Transform the PagingData flow (runs per page): .map/.filter for items, .insertSeparators for headers/dividers (date sections). Cache expensive transforms before cachedIn; presentation-only after. Filtering paged data can leave short pages — prefer filtering at the source query/API.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does RemoteMediator coordinate network and database for paging?",
    a: [
      {
        t: "p",
        text: "`RemoteMediator` implements `load(loadType, state)` for the *network* side of a DB-backed pager: on `REFRESH`/`APPEND` it fetches the next network page, writes it into Room (and updates remote keys tracking pagination), and returns `MediatorResult`. The `Pager`'s `PagingSource` comes from Room (`@Query ... PagingSource`), so the UI always reads from the DB while the mediator keeps it topped up — offline-first pagination.",
      },
      {
        t: "code",
        title: "Pager with RemoteMediator",
        code: `Pager(
    config = PagingConfig(pageSize = 20),
    remoteMediator = UserRemoteMediator(api, db),   // network -> DB
    pagingSourceFactory = { db.userDao().pagingSource() },  // DB -> UI
).flow`,
      },
      {
        t: "list",
        items: [
          "**`RemoteMediator.load`** — fetch network pages, write to Room.",
          "**Remote keys** — a table tracking next/prev page keys per item.",
          "**PagingSource from Room** — the UI reads the DB (source of truth).",
          "**Offline-first** — cached pages show offline; mediator refills online.",
        ],
      },
      {
        t: "note",
        text: "RemoteMediator.load(loadType, state) handles the network side of a DB-backed pager: fetch the next page, write to Room, update a remote-keys table, return MediatorResult. The PagingSource comes from Room (the UI reads the DB), so cached pages show offline and the mediator refills online — offline-first pagination.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you refresh or invalidate a paged list?",
    a: [
      {
        t: "p",
        text: "Call `refresh()` on the paging adapter/`LazyPagingItems` to reload from the start (re-invoking `getRefreshKey`). Underneath, a `PagingSource` is *invalidated* when its data changes — for a Room-backed source, any write to the observed tables auto-invalidates it and Paging creates a new `PagingSource`, reloading. For pull-to-refresh, call `refresh()`.",
      },
      {
        t: "list",
        items: [
          "**`refresh()`** — reload from the start (pull-to-refresh).",
          "**Invalidation** — a `PagingSource` invalidates when its data changes.",
          "**Room-backed** — writes to observed tables auto-invalidate and reload.",
          "**New PagingSource** — Paging recreates it on invalidation.",
        ],
      },
      {
        t: "note",
        text: "Call refresh() on the adapter/LazyPagingItems to reload from the start (pull-to-refresh; re-runs getRefreshKey). A PagingSource invalidates when its data changes — a Room-backed source auto-invalidates on writes to observed tables, and Paging creates a new PagingSource to reload.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is cachedIn important, and where do you place it?",
    a: [
      {
        t: "p",
        text: "`cachedIn(scope)` caches the `PagingData` stream in a `CoroutineScope` (usually `viewModelScope`) so it *survives configuration changes* and is *shared* among multiple collectors without re-fetching. It also makes the flow safe to collect multiple times (a raw `Pager.flow` can only be collected once). Place it as the *last* operator in the ViewModel, after any caching-worthy transforms.",
      },
      {
        t: "list",
        items: [
          "**Survives config change** — no re-fetch on rotation.",
          "**Multi-collect safe** — a raw Pager flow is single-collection.",
          "**Shared** — multiple collectors reuse the cached data.",
          "**Placement** — last in the ViewModel, after cache-worthy transforms.",
        ],
      },
      {
        t: "note",
        text: "cachedIn(scope) caches the PagingData stream in a scope (viewModelScope) so it survives config changes and is shared/multi-collectable (a raw Pager.flow can only be collected once). Place it last in the ViewModel, after transforms you want cached. Without it, rotation re-fetches and multi-collect crashes.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a PagingSource?",
    a: [
      {
        t: "p",
        text: "Test the `PagingSource` directly by calling `load()` with `LoadParams.Refresh`/`Append` and asserting the returned `LoadResult.Page` (data, prevKey, nextKey) or `LoadResult.Error`. Use a fake API/DAO. For the whole flow (adapter behavior, diffing), the `AsyncPagingDataDiffer`/snapshot APIs let you assert the presented items. Test edge cases: first page, empty result (nextKey null), and errors.",
      },
      {
        t: "code",
        title: "Testing load()",
        code: `@Test fun firstPage() = runTest {
    val source = UserPagingSource(fakeApi)
    val result = source.load(LoadParams.Refresh(key = null, loadSize = 20, false))
    assertEquals(expectedUsers, (result as LoadResult.Page).data)
    assertEquals(2, result.nextKey)
}`,
      },
      {
        t: "list",
        items: [
          "**Call `load()`** — assert `LoadResult.Page`/`Error` and keys.",
          "**Fake API/DAO** — controlled data/errors.",
          "**Edge cases** — first page, end (nextKey null), errors.",
          "**Full flow** — `AsyncPagingDataDiffer`/snapshot for presented items.",
        ],
      },
      {
        t: "note",
        text: "Test a PagingSource by calling load(LoadParams.Refresh/Append) and asserting LoadResult.Page (data, prevKey, nextKey) or Error, with a fake API/DAO — cover first page, end (nextKey null), and errors. For the full presented flow, use AsyncPagingDataDiffer/snapshot to assert items after diffing.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does prefetchDistance control loading, and how do you tune page size?",
    a: [
      {
        t: "p",
        text: "`prefetchDistance` is how many items from the edge of the loaded data the user must scroll before Paging loads the *next* page — a larger value loads earlier (smoother, more eager) but uses more data upfront. `pageSize` is items per page (and roughly the load granularity). Tune them so pages load *before* the user reaches the end (avoiding visible spinners) without over-fetching; `initialLoadSize` (default 3×pageSize) sizes the first load.",
      },
      {
        t: "list",
        items: [
          "**`prefetchDistance`** — how far from the edge to trigger the next load.",
          "**`pageSize`** — items per page (load granularity).",
          "**`initialLoadSize`** — first load (default 3× pageSize).",
          "**Tune** — load before the user hits the end, without over-fetching.",
        ],
      },
      {
        t: "note",
        text: "prefetchDistance = how many items from the loaded edge trigger the next page load (larger = earlier/smoother, more data upfront); pageSize = items per page; initialLoadSize = first load (default 3× pageSize). Tune so pages load before the user reaches the end (no visible spinners) without over-fetching.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Paging 3 handle duplicate or changing items across pages?",
    a: [
      {
        t: "p",
        text: "Paging uses `DiffUtil` (via a `DiffUtil.ItemCallback`) to diff presented items and animate insertions/updates/removals — so provide accurate `areItemsTheSame` (by id) and `areContentsTheSame`. Server-side pagination that reorders/inserts items can cause *duplicates or skips* across pages; mitigate with stable keyset (cursor) pagination rather than offset pagination, which is prone to shifting.",
      },
      {
        t: "list",
        items: [
          "**`DiffUtil.ItemCallback`** — `areItemsTheSame` (id) + `areContentsTheSame`.",
          "**Diffing** — animates changes, avoids full rebinds.",
          "**Offset pagination** — prone to duplicates/skips when data shifts.",
          "**Keyset/cursor pagination** — stable against inserts/reorders.",
        ],
      },
      {
        t: "note",
        text: "Paging diffs presented items via DiffUtil.ItemCallback (areItemsTheSame by id, areContentsTheSame) to animate changes. Offset pagination can duplicate/skip items when the dataset shifts between page loads — prefer keyset (cursor) pagination, which is stable against inserts/reorders.",
      },
    ],
  },
  {
    level: "junior",
    q: "When should you NOT use Paging 3?",
    a: [
      {
        t: "p",
        text: "Paging adds complexity (PagingSource, load states, PagingData) that isn't worth it for *small, bounded* lists you can load at once — a settings list, a fixed set of categories, a short search result. Use a plain `List`/`Flow<List>` there. Reserve Paging for *large or unbounded* datasets (feeds, search over big corpora, chat history) where loading everything is wasteful or impossible.",
      },
      {
        t: "list",
        items: [
          "**Small/bounded lists** — load at once with `Flow<List>`; skip Paging.",
          "**Fixed data** — settings, categories, short results.",
          "**Use Paging for** — large/unbounded feeds, big search, infinite scroll.",
          "**Complexity cost** — PagingSource/load states aren't free.",
        ],
      },
      {
        t: "note",
        text: "Skip Paging 3 for small, bounded lists you can load at once (settings, categories, short results) — use a plain Flow<List>. Its machinery (PagingSource, load states, PagingData) is worth it only for large/unbounded datasets (feeds, big search, chat history) where loading everything is wasteful/impossible.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you combine paged data with other reactive state (e.g. a filter)?",
    a: [
      {
        t: "p",
        text: "Drive the `Pager` from a trigger flow (the filter/query) using `flatMapLatest` — when the filter changes, create a *new* `Pager` (new `PagingSource`), and `cachedIn` the result. For presentation-only combos (a favorites set overlaid on items), transform the `PagingData` with `.map` combining the external state. Don't try to `combine` a `PagingData` flow with a normal flow directly — recreate the pager on filter changes.",
      },
      {
        t: "code",
        title: "Filter-driven paging",
        code: `val paged = queryFlow.flatMapLatest { query ->
    Pager(config) { UserPagingSource(api, query) }.flow
}.cachedIn(viewModelScope)`,
      },
      {
        t: "list",
        items: [
          "**`flatMapLatest`** — recreate the `Pager` when the filter/query changes.",
          "**`cachedIn`** — after the flatMapLatest.",
          "**Presentation combos** — transform `PagingData` with `.map`.",
          "**Don't `combine` PagingData** — recreate the pager instead.",
        ],
      },
      {
        t: "note",
        text: "Drive the Pager from a trigger flow (filter/query) with flatMapLatest — a filter change creates a new Pager/PagingSource — then cachedIn. For presentation-only combos (favorites overlay), transform PagingData with .map. Don't combine a PagingData flow with a normal flow; recreate the pager on changes.",
      },
    ],
  },
  {
    level: "junior",
    q: "What problem does pagination solve compared to loading everything?",
    a: [
      {
        t: "p",
        text: "Loading an entire large dataset at once is slow (long initial wait), memory-heavy (thousands of items in RAM), and wasteful (the user may scroll only a bit). *Pagination* loads data in *chunks as needed* — fast initial display, bounded memory, and less bandwidth. Paging 3 automates the mechanics (loading, diffing, states, retries) so you don't hand-roll scroll listeners and offsets.",
      },
      {
        t: "list",
        items: [
          "**Fast initial load** — show the first page immediately.",
          "**Bounded memory** — only loaded pages held.",
          "**Less bandwidth** — load only what's viewed.",
          "**Paging 3 automates** — loading triggers, diffing, states, retries.",
        ],
      },
      {
        t: "note",
        text: "Loading everything is slow (long wait), memory-heavy (thousands in RAM), and wasteful (user scrolls a little). Pagination loads chunks as needed — fast initial display, bounded memory, less bandwidth. Paging 3 automates the mechanics (load triggers, diffing, states, retries) vs hand-rolled scroll listeners/offsets.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between offset and keyset (cursor) pagination?",
    a: [
      {
        t: "p",
        text: "*Offset* pagination uses `LIMIT n OFFSET m` (or page numbers) — simple, but slow for deep pages (the DB scans/skips m rows) and *unstable* when items are inserted/deleted (rows shift, causing duplicates/skips). *Keyset* (cursor) pagination uses a `WHERE id > lastSeenId ORDER BY id LIMIT n` — fast at any depth (uses an index) and *stable* against inserts. Prefer keyset for large or actively-changing datasets.",
      },
      {
        t: "table",
        headers: ["", "Offset", "Keyset (cursor)"],
        rows: [
          ["Deep pages", "slow (scans/skips)", "fast (indexed)"],
          ["Stability", "shifts on insert/delete", "stable"],
          ["Simplicity", "simple", "needs a stable sort key"],
        ],
      },
      {
        t: "list",
        items: [
          "**Offset** — `LIMIT/OFFSET`/page numbers; simple; slow deep; unstable.",
          "**Keyset** — `WHERE key > cursor`; fast (indexed); stable.",
          "**Keyset needs** — a stable, unique sort key (id/timestamp).",
          "**Prefer keyset** — for large/changing data.",
        ],
      },
      {
        t: "note",
        text: "Offset pagination (LIMIT/OFFSET/page numbers): simple but slow for deep pages (scans/skips) and unstable when items shift (duplicates/skips). Keyset/cursor (WHERE key > cursor ORDER BY key): fast at any depth (indexed) and stable against inserts. Prefer keyset for large/actively-changing datasets.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the three LoadTypes in RemoteMediator?",
    a: [
      {
        t: "p",
        text: "`RemoteMediator.load` receives a `LoadType`: `REFRESH` (initial load or `refresh()` — load the first page, often clearing the cache), `APPEND` (user scrolled to the end — load the next page after the last item), and `PREPEND` (scrolled to the start — load before the first item, often returning success with `endOfPaginationReached = true` if you don't support backward loading).",
      },
      {
        t: "list",
        items: [
          "**`REFRESH`** — initial/refresh; load the first page (may clear cache in a transaction).",
          "**`APPEND`** — end reached; load the next page after the last item.",
          "**`PREPEND`** — start reached; load before the first (or signal end).",
          "**`endOfPaginationReached`** — return in `MediatorResult.Success` when no more pages.",
        ],
      },
      {
        t: "note",
        text: "RemoteMediator LoadTypes: REFRESH (initial/refresh — load first page, often clearing cache), APPEND (end reached — next page after the last item), PREPEND (start reached — before the first, or signal end). Return MediatorResult.Success(endOfPaginationReached = true) when there are no more pages.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the remote keys table, and why does RemoteMediator need it?",
    a: [
      {
        t: "p",
        text: "Because the `PagingSource` reads from the DB (which doesn't know network page numbers), `RemoteMediator` needs to *track pagination keys* — so you keep a `RemoteKeys` table mapping each item (or page) to its `prevKey`/`nextKey`. On `APPEND`, you look up the last item's `nextKey` to fetch the next network page; on `REFRESH`, you clear and rebuild. Without it, the mediator can't know which page to fetch.",
      },
      {
        t: "code",
        title: "Remote keys",
        code: `@Entity data class RemoteKeys(
    @PrimaryKey val itemId: String, val prevKey: Int?, val nextKey: Int?)
// APPEND: fetch remoteKeysForLastItem(state)?.nextKey`,
      },
      {
        t: "list",
        items: [
          "**Tracks pagination** — maps items/pages to prev/next network keys.",
          "**`APPEND`** — look up the last item's `nextKey`.",
          "**`REFRESH`** — clear keys + data in a transaction, refetch.",
          "**Needed** — the DB-backed PagingSource doesn't know network page numbers.",
        ],
      },
      {
        t: "note",
        text: "A RemoteKeys table maps items/pages to prevKey/nextKey so RemoteMediator knows which network page to fetch (the DB-backed PagingSource doesn't track network page numbers). APPEND uses the last item's nextKey; REFRESH clears keys+data in a transaction and refetches. Essential for DB-backed paging.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you show an empty state in a paged list?",
    a: [
      {
        t: "p",
        text: "Detect empty by checking that the `refresh` load state is `NotLoading` (finished) *and* `itemCount == 0` — then show an empty-state UI instead of the list. You must combine the load state with the item count, because a zero count during loading isn't 'empty', it's 'not loaded yet'.",
      },
      {
        t: "code",
        title: "Empty detection",
        code: `val items = flow.collectAsLazyPagingItems()
val isEmpty = items.loadState.refresh is LoadState.NotLoading && items.itemCount == 0
if (isEmpty) EmptyView() else LazyColumn { /* items */ }`,
      },
      {
        t: "list",
        items: [
          "**Empty = refresh NotLoading + itemCount 0** — finished loading with no items.",
          "**Not during load** — zero count while loading isn't empty.",
          "**Distinct states** — loading, empty, error, content.",
          "**Show empty UI** — illustration/CTA instead of the list.",
        ],
      },
      {
        t: "note",
        text: "Empty state = loadState.refresh is NotLoading AND itemCount == 0 (finished loading with no items) — combine load state with count, since zero count while loading is 'not loaded yet', not 'empty'. Show a distinct empty UI (illustration/CTA) vs loading/error/content.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you implement pull-to-refresh with Paging?",
    a: [
      {
        t: "p",
        text: "Wrap the paged list in a pull-to-refresh container and call `lazyPagingItems.refresh()` (Compose) or `adapter.refresh()` (Views) on pull. Drive the refresh indicator from the `refresh` load state (`loadState.refresh is LoadState.Loading`). Paging reloads from the start; for DB-backed paging, `RemoteMediator`'s `REFRESH` refetches and updates the DB.",
      },
      {
        t: "code",
        title: "Pull-to-refresh",
        code: `val items = flow.collectAsLazyPagingItems()
val refreshing = items.loadState.refresh is LoadState.Loading
PullToRefreshBox(isRefreshing = refreshing, onRefresh = { items.refresh() }) {
    LazyColumn { /* items */ }
}`,
      },
      {
        t: "list",
        items: [
          "**`refresh()`** — reload from the start on pull.",
          "**Indicator from load state** — `loadState.refresh is Loading`.",
          "**RemoteMediator REFRESH** — refetches and updates the DB.",
          "**Don't reset scroll manually** — Paging handles the reload.",
        ],
      },
      {
        t: "note",
        text: "Wrap the paged list in a pull-to-refresh container and call lazyPagingItems.refresh() (Compose) / adapter.refresh() (Views) on pull, driving the indicator from loadState.refresh is Loading. Paging reloads from the start; RemoteMediator's REFRESH refetches and updates the DB.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the maxSize config, and when are pages dropped?",
    a: [
      {
        t: "p",
        text: "By default Paging keeps *all* loaded pages in memory as you scroll. Setting `PagingConfig.maxSize` caps the loaded window — when it's exceeded, Paging *drops* pages furthest from the viewport (and reloads them if you scroll back). This bounds memory for very long scrolls, at the cost of re-loading dropped pages. It requires placeholders (or careful handling) so positions stay stable.",
      },
      {
        t: "list",
        items: [
          "**Default** — keeps all loaded pages in memory.",
          "**`maxSize`** — caps the loaded window; drops far-from-viewport pages.",
          "**Trade-off** — bounded memory vs reloading dropped pages on scroll-back.",
          "**Placeholders** — needed for stable positions when dropping.",
        ],
      },
      {
        t: "note",
        text: "By default Paging keeps all loaded pages in memory. PagingConfig.maxSize caps the loaded window — exceeding it drops pages furthest from the viewport (reloaded on scroll-back). Bounds memory for very long lists at the cost of reloads; needs placeholders for stable positions. Only set it for extreme cases.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you paginate a debounced search?",
    a: [
      {
        t: "p",
        text: "Hold the query in a `StateFlow`, `debounce` + `distinctUntilChanged` it, then `flatMapLatest` to a new `Pager` per query (`Pager(config) { SearchPagingSource(api, query) }.flow`), and `cachedIn`. Each new query cancels the previous pager and starts a fresh paged search — combining debounced input with paginated results.",
      },
      {
        t: "code",
        title: "Paged search",
        code: `val results = queryFlow
    .debounce(300).distinctUntilChanged()
    .flatMapLatest { q -> Pager(config) { SearchPagingSource(api, q) }.flow }
    .cachedIn(viewModelScope)`,
      },
      {
        t: "list",
        items: [
          "**Query `StateFlow`** — updated from the text field.",
          "**`debounce` + `distinctUntilChanged`** — one search per typing pause.",
          "**`flatMapLatest` → new `Pager`** — cancels the old search, paginates the new.",
          "**`cachedIn`** — after the flatMapLatest.",
        ],
      },
      {
        t: "note",
        text: "Paged search: query StateFlow → debounce(300) + distinctUntilChanged → flatMapLatest to a new Pager per query (Pager(config){ SearchPagingSource(api, q) }.flow) → cachedIn. Each query cancels the previous pager and starts a fresh paginated search. Combines debounced input with pagination.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you add header/footer load-state UI to a paged list?",
    a: [
      {
        t: "p",
        text: "In Compose, add `item { }` blocks at the top/bottom of the `LazyColumn` conditioned on `loadState.prepend`/`loadState.append` (spinner or retry row). In Views, use `adapter.withLoadStateHeaderAndFooter(header, footer)` with `LoadStateAdapter`s that render the loading/error/retry views. This shows progress/retry inline at the list ends as more data loads.",
      },
      {
        t: "code",
        title: "Compose append footer",
        code: `LazyColumn {
    items(pagingItems.itemCount) { /* row */ }
    when (val append = pagingItems.loadState.append) {
        is LoadState.Loading -> item { Spinner() }
        is LoadState.Error -> item { RetryRow { pagingItems.retry() } }
        else -> {}
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Compose** — conditional `item { }` on `loadState.append`/`prepend`.",
          "**Views** — `withLoadStateHeaderAndFooter(LoadStateAdapter)`.",
          "**States** — loading spinner, error + retry.",
          "**Inline** — at the list ends as more loads.",
        ],
      },
      {
        t: "note",
        text: "Header/footer load-state UI: Compose adds conditional item { } blocks on loadState.prepend/append (spinner/retry); Views use adapter.withLoadStateHeaderAndFooter(LoadStateAdapter). Render loading spinners and error+retry rows inline at the list ends as more data loads.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you keep paged list item rendering performant?",
    a: [
      {
        t: "p",
        text: "Same principles as any lazy list, plus paging specifics: provide stable `key`s (`itemKey { it.id }`) and `contentType` for mixed items; keep item composition cheap (precompute in a mapper, avoid heavy work per item); size images to the display; use accurate `DiffUtil` callbacks so only changed items rebind; and don't over-transform `PagingData` on the hot path. Profile on a release build.",
      },
      {
        t: "list",
        items: [
          "**Stable keys + contentType** — correct diffing/reuse.",
          "**Cheap item content** — precompute; avoid heavy per-item work.",
          "**Right-sized images** — Coil to the display size.",
          "**Accurate DiffUtil** — minimal rebinds; profile on release.",
        ],
      },
      {
        t: "note",
        text: "Performant paged lists: stable keys (itemKey { it.id }) + contentType, cheap item content (precompute in a mapper), right-sized image loading, accurate DiffUtil callbacks (minimal rebinds), and avoid heavy PagingData transforms on the hot path. Profile on a release build on a real device.",
      },
    ],
  },
];

export default qa;
