// Caching & Offline-First — Content tab. Teaching-first.

const content = [
  {
    heading: "Why caching and offline-first matter",
    blocks: [
      {
        t: "p",
        text: "Mobile networks are unreliable — slow, intermittent, or absent. An app that shows a spinner and nothing else when offline is a poor experience. **Caching** means storing data locally so it's available instantly and without the network; **offline-first** is an architecture where the app is *designed* to work from local data by default, treating the network as a way to *update* that local data rather than a prerequisite for showing anything. Done well, the app feels fast (instant local reads), works offline, and uses less data/battery.",
      },
    ],
  },
  {
    heading: "Single source of truth — the foundation",
    blocks: [
      {
        t: "p",
        text: "Offline-first is built on the **single source of truth (SSOT)** pattern: one local store (usually a Room database) is the *authoritative* source the app reads from, and everything — including network responses — writes *into* it. The UI never reads directly from the network; it observes the local store, which the network updates. This is the same pattern covered in Room and Architecture, and it's what makes offline-first natural.",
      },
      {
        t: "code",
        title: "The SSOT / observe-local, refresh-remote pattern",
        code: `class ArticleRepository(
    private val dao: ArticleDao,     // the single source of truth
    private val api: Api,
) {
    // READS always come from the local DB — works offline, instant
    fun observeArticles(): Flow<List<Article>> =
        dao.observeArticles().map { it.map(Entity::toDomain) }

    // NETWORK writes into the DB; the Flow above re-emits automatically
    suspend fun refresh(): Result<Unit> = runCatching {
        val fresh = api.getArticles()
        dao.upsertAll(fresh.map { it.toEntity() })
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Reads never depend on the network**: the UI observes the DB Flow, so it always has *something* to show (the last-cached data), even offline. When a refresh succeeds, the DB updates and the UI follows automatically.",
          "**Writes go into the DB**: a network fetch is just a mechanism to *update the local source of truth*. This decouples 'display data' from 'fetch data' — the two happen independently.",
          "**Errors don't blank the screen**: if a refresh fails (offline), you still show the cached data and surface the error non-destructively (a snackbar), rather than an empty error screen.",
        ],
      },
    ],
  },
  {
    heading: "Caching strategies",
    blocks: [
      {
        t: "table",
        headers: ["Strategy", "How it works", "Trade-off"],
        rows: [
          ["Cache-first (offline-first)", "read cache immediately; refresh from network in background", "instant + offline, but may briefly show stale data"],
          ["Network-first", "try network; fall back to cache on failure", "freshest data, but slow/blocked when network is slow"],
          ["Cache-then-network", "show cache instantly, then update with network result", "best UX — fast AND fresh (the common choice)"],
          ["Network-only", "always fetch, no cache", "always fresh, but no offline and slow"],
        ],
      },
      {
        t: "list",
        items: [
          "**Cache-then-network** (a.k.a. stale-while-revalidate) is the most common for offline-first: show the cached data immediately (instant, works offline), and *simultaneously* kick off a network refresh that updates the cache (and thus the UI) when it returns. The user sees content instantly and it silently updates. The SSOT Flow pattern gives this naturally — observe the DB (instant cache), trigger a refresh (updates DB → UI).",
          "**Network-first** suits data that must be current (a bank balance) where showing stale data is worse than waiting — but degrade to cache on failure.",
          "**Choose per data type**: a feed → cache-then-network; a rarely-changing config → cache-first with occasional refresh; a payment confirmation → network-only or network-first.",
        ],
      },
    ],
  },
  {
    heading: "Cache invalidation and freshness",
    blocks: [
      {
        t: "p",
        text: "\"There are only two hard things in computer science: cache invalidation and naming things.\" The core challenge of caching is knowing *when* cached data is too stale to trust. Strategies:",
      },
      {
        t: "list",
        items: [
          "**Time-based (TTL)**: store a timestamp with cached data; consider it stale after N minutes and refresh. Simple and common — 'refresh if the cache is older than 5 minutes'.",
          "**Event-based**: invalidate on specific triggers — a pull-to-refresh, a push notification signaling new data, a user action that changes the data.",
          "**Version/ETag-based**: the server provides a version tag (ETag); on refresh you send it, and the server responds 'not modified' (cheap) or with new data — efficient conditional fetching (HTTP caching).",
          "**Manual/explicit**: the app decides when to refresh (on screen open, on app foreground, on a timer). Common combined with TTL.",
          "**The trade-off**: refresh too often → wasted data/battery and unnecessary load; refresh too rarely → stale data. TTL + explicit refresh (pull-to-refresh) covers most cases.",
        ],
      },
    ],
  },
  {
    heading: "Offline writes and syncing",
    blocks: [
      {
        t: "p",
        text: "Reading offline is straightforward (serve from cache). *Writing* offline is harder — the user creates or edits data with no network. Offline-first apps handle this with **local-first writes and background sync**:",
      },
      {
        t: "list",
        items: [
          "**Write locally first**: apply the change to the local DB immediately (so the UI updates and the user isn't blocked), and mark the record as 'pending sync' (a `syncStatus` flag or a separate outbox table).",
          "**Sync in the background**: a background worker (WorkManager, so it survives process death and runs when network returns) reads pending changes and pushes them to the server, then marks them synced. WorkManager's network constraint means it runs the sync automatically when connectivity is available.",
          "**Conflict resolution**: when local and server versions diverge (the record changed on the server while you were offline), you need a policy — last-write-wins (simplest), server-wins, client-wins, or a merge. This is the genuinely hard part of offline sync and is a repository/domain concern.",
          "**The outbox pattern**: queue outgoing operations durably (in the DB) so they survive app kills and are retried until they succeed — a reliable way to guarantee eventual delivery of offline changes.",
        ],
      },
    ],
  },
  {
    heading: "HTTP caching and memory caching",
    blocks: [
      {
        t: "list",
        items: [
          "**HTTP-level caching (OkHttp)**: OkHttp can cache HTTP *responses* automatically based on `Cache-Control`/`ETag` headers (`Cache` set on the client). This caches at the network layer — useful for images and responses that rarely change — and is complementary to app-level DB caching (which gives you queryable, structured, observable data).",
          "**Memory cache**: an in-memory cache (a `Map`, an `LruCache`) for the fastest access to recently-used data, backed by the DB (disk) which is backed by the network — a three-tier hierarchy (memory → disk → network). Image loaders (Coil, Glide) do exactly this: memory cache → disk cache → network.",
          "**Image caching specifically**: use a library (Coil/Glide) — they handle memory + disk caching, downsampling, and lifecycle automatically. Never hand-roll image caching.",
          "**Layering**: a mature app has memory cache (fastest, volatile) → Room/disk (persistent, queryable, SSOT) → network (source of new data). Reads try the fastest available; writes populate the layers.",
        ],
      },
      {
        t: "note",
        text: "Offline-first essentials: build on SSOT (Room as authoritative; UI observes DB, network writes into it). Cache-then-network (show cache instantly, refresh in background) is the common strategy. Invalidate with TTL/events/ETags — balancing freshness vs waste. Offline writes go local-first + a WorkManager background sync (with a conflict-resolution policy and an outbox for durability). Layer caches memory → disk → network; use Coil/Glide for images.",
      },
    ],
  },
];

export default content;
