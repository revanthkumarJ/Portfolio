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
];

export default qa;
