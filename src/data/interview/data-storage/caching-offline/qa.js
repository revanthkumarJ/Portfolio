// Caching & Offline-First — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What does 'offline-first' mean and why is it good?",
    a: [
      {
        t: "p",
        text: "**Offline-first is an architecture where the app is designed to work from *local data* by default, treating the network as a way to *update* that local data rather than a prerequisite for showing anything.** Instead of 'fetch from network → show result (or spinner/error if offline)', the flow is 'show local data instantly → update it from the network in the background when possible'.",
      },
      {
        t: "list",
        items: [
          "**It feels fast**: reads come from a local database instantly, with no network round-trip — the UI appears immediately with cached content.",
          "**It works offline**: because the app displays local data, it's usable with no connection — you see the last-synced content instead of an error screen.",
          "**It's resilient**: a failed network refresh doesn't blank the screen; you keep showing cached data and surface the error gently.",
          "**It saves data and battery**: you fetch only to update, not on every view, and can batch/schedule syncs efficiently.",
        ],
      },
      {
        t: "p",
        text: "The foundation is the *single source of truth* pattern: a local store (usually Room) is authoritative, the UI observes it, and the network writes into it. This is Google's recommended architecture because mobile networks are unreliable, and an app that gracefully handles being offline is far better than one that's helpless without a connection.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the single source of truth pattern and how does it enable offline support?",
    a: [
      {
        t: "p",
        text: "**Single source of truth (SSOT) means one local store — typically a Room database — is the *authoritative* source the app reads from, and everything (including network responses) writes *into* it.** The UI never reads directly from the network; it observes the local store, and the network's only job is to keep that store updated.",
      },
      {
        t: "code",
        title: "Observe local, refresh remote",
        code: `fun observeData(): Flow<List<Item>> = dao.observeAll()  // UI reads the DB
suspend fun refresh() { dao.upsertAll(api.fetch()) }    // network writes to DB`,
      },
      {
        t: "p",
        text: "**How it enables offline support**: since the UI always reads from the local DB, it *always has data to show* — the last-cached data — regardless of connectivity. The network being available or not only affects whether a *refresh* succeeds; it never affects whether the app can display something. When you're online and a refresh succeeds, the DB updates and (because Room's Flow queries auto-emit) the UI updates automatically. When you're offline, you simply see the cached data and can surface the connection error without wiping the screen. This cleanly separates 'displaying data' (always from the DB) from 'fetching data' (an independent update mechanism), which is exactly what makes offline behavior natural rather than a special case you bolt on.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is 'cache-then-network' and why is it a popular strategy?",
    a: [
      {
        t: "p",
        text: "**Cache-then-network means: show the cached data immediately, and *simultaneously* start a network request that updates the cache (and thus the UI) when it returns.** The user gets instant content from the cache, and it silently refreshes to the latest data a moment later. It's also called 'stale-while-revalidate'.",
      },
      {
        t: "p",
        text: "**Why it's popular**: it gives the best of both worlds — *fast* (no waiting for the network to see something) and *fresh* (the data updates to current). Compare the alternatives: network-first makes the user wait for the network before seeing anything (slow, and blocked when offline); cache-only never updates (stale); network-only is always slow and has no offline support. Cache-then-network avoids all those downsides. And it falls out *naturally* from the SSOT pattern: the UI observes the database (so it shows the cache instantly), and you trigger a refresh that writes to the database (so the UI updates when the network returns). The main trade-off is a brief moment of potentially-stale data before the refresh completes — acceptable for most content like feeds, though not for data that must always be current (a bank balance), where you'd use network-first instead.",
      },
    ],
  },
  {
    level: "junior",
    q: "How should you cache images in an Android app?",
    a: [
      {
        t: "p",
        text: "**Use an established image-loading library — Coil (Kotlin-first, coroutine-based) or Glide — and let it handle caching; never hand-roll image caching.** These libraries automatically manage a two-tier cache: a *memory cache* (an in-memory LRU cache of decoded bitmaps for the fastest repeat access) and a *disk cache* (persisted encoded images so they survive app restarts and don't need re-downloading), falling back to the network only when neither has the image.",
      },
      {
        t: "list",
        items: [
          "They also handle the hard parts you'd otherwise get wrong: downsampling images to the target view size (avoiding huge bitmaps and out-of-memory crashes), lifecycle awareness (cancelling loads when the view/Activity is gone), placeholder/error images, and request deduplication.",
          "In Compose, Coil's `AsyncImage` / `rememberAsyncImagePainter` integrates directly; in Views, `imageView.load(url)` (Coil) or `Glide.with(...).load(url)`.",
          "The reason not to hand-roll: correct image caching involves memory management, bitmap decoding/downsampling, disk eviction policies, and lifecycle handling — all easy to get subtly wrong (OOM crashes, leaks, jank). The libraries have solved this thoroughly.",
        ],
      },
      {
        t: "p",
        text: "This fits the general caching hierarchy — memory (fastest, volatile) → disk (persistent) → network (source) — applied specifically to images. It's complementary to your app-data caching (Room), which handles structured data; images are binary blobs best left to a dedicated loader.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle cache invalidation — deciding when cached data is too stale?",
    a: [
      {
        t: "p",
        text: "**Cache invalidation is deciding when cached data can no longer be trusted and must be refreshed — famously one of the hard problems in computing, because the goal is a balance: refresh too often and you waste data/battery and load; refresh too rarely and users see stale data.** There are several strategies, usually combined:",
      },
      {
        t: "list",
        items: [
          "**Time-based (TTL)**: store a timestamp alongside cached data and treat it as stale after a defined interval ('refresh if older than 5 minutes'). Simple, predictable, and covers most cases. You check the age on access or on screen open and refresh if expired.",
          "**Event-based**: invalidate on specific triggers — an explicit pull-to-refresh, a push notification signaling that server data changed, or a user action that you know altered the data. This keeps caches fresh precisely when it matters without polling.",
          "**Version/ETag-based (conditional fetch)**: the server tags data with a version (ETag or Last-Modified). On refresh you send the tag; the server replies '304 Not Modified' (cheap, no body) if nothing changed, or sends new data. This makes refreshing *efficient* — you 'refresh' frequently but only pay for actual changes. HTTP caching in OkHttp supports this at the network layer.",
          "**App-lifecycle triggers**: refresh on app foreground, on screen entry, or on a periodic background sync (WorkManager) — often combined with TTL so you don't refresh redundantly.",
        ],
      },
      {
        t: "list",
        items: [
          "**Choose per data type**: a rarely-changing config can have a long TTL (hours); a live feed a short one (minutes) plus pull-to-refresh; a chat needs push-based invalidation (real-time). Match the strategy to how fast the data actually changes and how bad staleness is.",
          "**Combine strategies**: a robust approach is TTL (baseline freshness) + explicit refresh (user control) + ETags (efficient checks) + push invalidation for critical real-time data.",
          "**Don't over-engineer**: for many apps, 'refresh on screen open if the cache is older than N minutes, plus pull-to-refresh' is entirely sufficient. Reserve ETags/push invalidation for cases where efficiency or real-time freshness genuinely matter.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: there's no universal answer — invalidation is a per-data-type trade-off between freshness and cost. The skill is picking the *cheapest* strategy that meets the data's freshness requirement: TTL for most, ETags when you refresh often and want efficiency, push/event-based for real-time. And it's why the SSOT pattern helps — invalidation just means 'trigger a refresh that updates the DB', and the observing UI follows automatically; you're never manually reconciling cache and UI.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle writes that happen while the user is offline?",
    a: [
      {
        t: "p",
        text: "**The pattern is local-first writes plus background sync: apply the change to the local database *immediately* (so the UI updates and the user isn't blocked), mark it as pending synchronization, and have a durable background worker push it to the server when connectivity returns.** Reading offline is easy (serve from cache); *writing* offline is the genuinely hard part, and this pattern makes it reliable.",
      },
      {
        t: "list",
        items: [
          "**1. Write locally, optimistically**: when the user creates or edits data offline, immediately write it to the local DB (the single source of truth) and flag it — e.g. a `syncStatus = PENDING` column, or an 'outbox' table of queued operations. The UI reflects the change instantly (optimistic update), so the app feels responsive even offline.",
          "**2. Sync in the background with WorkManager**: a worker with a *network constraint* reads the pending changes and sends them to the server, then marks them `SYNCED`. WorkManager is the right tool because it *persists the work across process death and reboots* and *automatically runs when the network is available* — so the sync is guaranteed to eventually happen without the user doing anything. A plain coroutine wouldn't survive the app being killed.",
          "**3. Handle conflicts**: the hard part. While offline, the same record may have changed on the server. When syncing, you need a conflict-resolution policy: *last-write-wins* (compare timestamps, newest wins — simplest), *server-wins*, *client-wins*, or a *field-level merge* (combine non-conflicting changes). This is a domain/repository decision, and there's no universal right answer — it depends on the data's semantics (a collaborative doc needs merging; a single-user note can use last-write-wins).",
          "**4. Use the outbox pattern for durability**: queue outgoing operations as durable records in the DB (not just in-memory), so they survive app kills and are retried with backoff until they succeed. This guarantees *eventual delivery* — no offline change is silently lost.",
        ],
      },
      {
        t: "list",
        items: [
          "**Optimistic UI + rollback**: since you apply the change locally before the server confirms, you need to handle the case where the server *rejects* it (validation failure, conflict lost) — roll back the local change or surface an error, keeping the user informed.",
          "**Idempotency**: give each operation a client-generated id so that retries (WorkManager may retry) don't create duplicates on the server — the server dedupes by the id.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: offline writes turn a simple 'send to server' into a distributed-systems problem — you're reconciling two copies of data that can diverge. The robust solution is: write local-first (responsive + durable), queue the operation in an outbox, sync via WorkManager (survives kills, runs on reconnect), resolve conflicts with a policy appropriate to the data, and use idempotency keys so retries are safe. Naming the conflict-resolution challenge and WorkManager's role in guaranteed delivery is what demonstrates you understand offline writes are fundamentally harder than offline reads.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the NetworkBoundResource pattern?",
    a: [
      {
        t: "p",
        text: "NetworkBoundResource is a pattern that unifies cache and network into one reactive flow: it *emits cached data immediately* (from the DB), decides whether to *fetch fresh data* (based on staleness), fetches and *saves it to the DB* (which re-emits via the observable query), and emits loading/error states along the way. The DB is the single source of truth; the network updates it.",
      },
      {
        t: "code",
        title: "The shape",
        code: `fun user(id: String): Flow<Resource<User>> = flow {
    emit(Resource.Loading)
    val cached = dao.observe(id).first()
    if (shouldFetch(cached)) {
        try { dao.upsert(api.getUser(id)) }
        catch (e: IOException) { emit(Resource.Error(e, cached)) }
    }
    emitAll(dao.observe(id).map { Resource.Success(it) })   // DB is source of truth
}`,
      },
      {
        t: "list",
        items: [
          "**Emit cache first** — instant content from the DB.",
          "**Decide to fetch** — based on staleness (`shouldFetch`).",
          "**Save to DB** — network writes; the observable query re-emits.",
          "**Resource states** — Loading/Success/Error the UI renders.",
        ],
      },
      {
        t: "note",
        text: "NetworkBoundResource unifies cache+network: emit cached data immediately, decide whether to fetch (staleness), fetch and save to the DB (which re-emits via the observable query), emitting Loading/Success/Error. The DB is the single source of truth; the network updates it. Instant cached UI + background refresh.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the main caching strategies (cache-first, network-first, stale-while-revalidate)?",
    a: [
      {
        t: "p",
        text: "Common strategies trade freshness vs speed/offline: *cache-first* (serve cache, only hit network on miss — fast, offline-friendly, may be stale); *network-first* (try network, fall back to cache — fresh, but slow/fails offline); *stale-while-revalidate* (serve cache immediately, refresh in the background — fast *and* eventually fresh, the common mobile choice); *cache-only*/*network-only* for special cases.",
      },
      {
        t: "table",
        headers: ["Strategy", "Behavior", "Use"],
        rows: [
          ["Cache-first", "cache, network on miss", "static/rarely-changing data"],
          ["Network-first", "network, cache fallback", "must-be-fresh data"],
          ["Stale-while-revalidate", "cache now + refresh in bg", "feeds (fast + fresh)"],
        ],
      },
      {
        t: "list",
        items: [
          "**Cache-first** — fast/offline; may be stale.",
          "**Network-first** — fresh; slow/fails offline.",
          "**Stale-while-revalidate** — instant cache + background refresh (common).",
          "**Choose per data** — freshness requirements vs speed/offline.",
        ],
      },
      {
        t: "note",
        text: "Cache-first (cache, network on miss — fast/offline, may be stale); network-first (network, cache fallback — fresh, slow/offline-fragile); stale-while-revalidate (serve cache now + refresh in bg — fast AND eventually fresh, common for feeds). Choose per data's freshness needs.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does HTTP caching (ETag, Cache-Control) work with OkHttp?",
    a: [
      {
        t: "p",
        text: "OkHttp has a built-in HTTP response cache honoring standard headers: `Cache-Control` (max-age, no-cache), `ETag`/`If-None-Match`, and `Last-Modified`/`If-Modified-Since`. You install a `Cache` on the OkHttpClient; then cacheable responses are stored, and conditional requests (`If-None-Match`) let the server return `304 Not Modified` (no body) when data is unchanged — saving bandwidth. This is transport-level caching, distinct from your DB cache.",
      },
      {
        t: "code",
        title: "OkHttp cache",
        code: `val client = OkHttpClient.Builder()
    .cache(Cache(File(context.cacheDir, "http"), 10L * 1024 * 1024))   // 10MB
    .build()
// Server sends ETag; OkHttp revalidates with If-None-Match -> 304 reuses cache`,
      },
      {
        t: "list",
        items: [
          "**`Cache` on OkHttpClient** — stores HTTP responses on disk.",
          "**`Cache-Control`** — max-age/no-cache directives control caching.",
          "**`ETag`/`If-None-Match`** — conditional requests → `304 Not Modified`.",
          "**Transport-level** — complements (not replaces) your DB source of truth.",
        ],
      },
      {
        t: "note",
        text: "OkHttp's built-in Cache honors Cache-Control (max-age/no-cache), ETag/If-None-Match, Last-Modified — install a Cache on the client; conditional requests get 304 Not Modified (no body) when unchanged, saving bandwidth. It's transport-level caching, complementary to a DB source of truth.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you sync offline writes back to the server (write queue)?",
    a: [
      {
        t: "p",
        text: "Write to the *local DB first* (optimistic update — the UI reflects it immediately) and enqueue a *sync operation* (mark the row `pending`, or add to an outbox table). A `WorkManager` job (with a network constraint) processes the queue when connectivity returns, sends changes to the server, and marks them synced (or handles conflicts). This gives offline-capable writes that reconcile later.",
      },
      {
        t: "list",
        items: [
          "**Optimistic local write** — update the DB and UI immediately.",
          "**Outbox/pending flag** — track unsynced changes.",
          "**WorkManager (network constraint)** — flush the queue when online.",
          "**Reconcile** — mark synced, resolve conflicts, retry with backoff.",
        ],
      },
      {
        t: "note",
        text: "Offline writes: write to the local DB first (optimistic — UI updates instantly) and enqueue a sync op (pending flag / outbox table). A WorkManager job with a network constraint flushes the queue when online, sends to the server, and marks synced (handling conflicts/retries). Offline-capable writes that reconcile later.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you resolve conflicts when offline changes clash with server changes?",
    a: [
      {
        t: "p",
        text: "When a local change and a server change conflict, you need a resolution policy: *last-write-wins* (by timestamp — simple, can lose data), *server-wins*/*client-wins* (authoritative side), *merge* (field-level or CRDT-based — complex but lossless), or *prompt the user*. Track versions/timestamps to detect conflicts, and choose the policy per data's importance (e.g. server-wins for reference data, merge/prompt for user documents).",
      },
      {
        t: "list",
        items: [
          "**Detect** — compare versions/timestamps (or use `updatedAt`/vector clocks).",
          "**Last-write-wins** — simplest; may drop a change.",
          "**Server/client-wins** — an authoritative side.",
          "**Merge / prompt** — field-level merge or ask the user (for important data).",
        ],
      },
      {
        t: "note",
        text: "Conflict resolution policies: last-write-wins (timestamp — simple, lossy), server-wins/client-wins (authoritative side), field-level merge/CRDT (lossless, complex), or prompt the user. Detect via versions/timestamps; choose per data importance (server-wins for reference data, merge/prompt for user documents).",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the levels of caching in an Android app (memory, disk, network)?",
    a: [
      {
        t: "p",
        text: "Caching happens at layers, fastest to slowest: *in-memory* (a `StateFlow`/LruCache — instant, lost on process death), *disk* (Room DB, DataStore, OkHttp cache, image disk cache — survives restarts), and the *network* (the source of truth, slowest). A good architecture serves from the fastest available layer and refreshes from deeper ones (memory → disk → network).",
      },
      {
        t: "list",
        items: [
          "**In-memory** — LruCache/StateFlow; instant, volatile.",
          "**Disk** — Room/DataStore/OkHttp/image cache; survives restarts.",
          "**Network** — source of truth; slowest.",
          "**Layered** — serve from fastest, refresh from deeper.",
        ],
      },
      {
        t: "note",
        text: "Caching layers fastest→slowest: in-memory (LruCache/StateFlow — instant, lost on process death), disk (Room/DataStore/OkHttp/image cache — survives restarts), network (source of truth, slowest). Serve from the fastest available and refresh from deeper layers (memory → disk → network).",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Coil/Glide cache images, and how do you tune it?",
    a: [
      {
        t: "p",
        text: "Image loaders use a two-tier cache: an in-memory `LruCache` of decoded bitmaps (instant re-display) and a disk cache of the original bytes (survives restarts, avoids re-download). They key by URL (+ transformations). You tune the memory/disk cache sizes, set cache policies per request (`memoryCachePolicy`), and control keys — and always request the *displayed size* so cached bitmaps aren't oversized.",
      },
      {
        t: "list",
        items: [
          "**Memory cache** — decoded bitmaps (LruCache); instant re-display.",
          "**Disk cache** — original bytes; avoids re-download across sessions.",
          "**Keyed by URL + transforms** — with per-request cache policies.",
          "**Tune** — cache sizes, request the displayed size (avoid oversized bitmaps).",
        ],
      },
      {
        t: "note",
        text: "Coil/Glide use two tiers: in-memory LruCache of decoded bitmaps (instant re-display) + disk cache of original bytes (avoid re-download), keyed by URL + transformations. Tune cache sizes and per-request memoryCachePolicy, and request the displayed size so cached bitmaps aren't oversized (memory/jank).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you implement cache expiration / TTL?",
    a: [
      {
        t: "p",
        text: "Store a *timestamp* with cached data (a `fetchedAt`/`updatedAt` column, or a separate metadata table), and treat data as stale when `now - fetchedAt > ttl`. Your fetch logic (e.g. `shouldFetch`) checks this to decide whether to refresh. For HTTP-level caching, rely on `Cache-Control: max-age`. Choose the TTL per data volatility (seconds for prices, hours for profiles).",
      },
      {
        t: "code",
        title: "TTL check",
        code: `fun shouldFetch(cached: CachedData?): Boolean =
    cached == null || System.currentTimeMillis() - cached.fetchedAt > TTL_MILLIS`,
      },
      {
        t: "list",
        items: [
          "**Store `fetchedAt`** — with the cached row/metadata.",
          "**Stale check** — `now - fetchedAt > ttl`.",
          "**Drive refresh** — `shouldFetch` uses it.",
          "**TTL by volatility** — short for prices, long for profiles; HTTP `max-age` for transport.",
        ],
      },
      {
        t: "note",
        text: "Store a fetchedAt/updatedAt timestamp with cached data and treat it stale when now - fetchedAt > ttl — your shouldFetch logic uses this to trigger refresh. For HTTP-level, use Cache-Control: max-age. Pick TTL by data volatility (seconds for prices, hours for profiles).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you show optimistic updates while a write is in flight?",
    a: [
      {
        t: "p",
        text: "Apply the change to local state/DB *immediately* (optimistically) so the UI responds instantly, then send the request in the background. If it *succeeds*, keep the change (or reconcile with the server response). If it *fails*, *roll back* to the previous state and show an error. Track a pending/failed status so the UI can indicate in-flight or retryable items.",
      },
      {
        t: "list",
        items: [
          "**Apply immediately** — update DB/state before the network call.",
          "**On success** — keep/reconcile with the server result.",
          "**On failure** — roll back and show an error.",
          "**Status tracking** — pending/failed flags for UI indicators/retry.",
        ],
      },
      {
        t: "note",
        text: "Optimistic update: apply the change to local DB/state immediately (instant UI), send the request in the background; on success keep/reconcile, on failure roll back to the previous state and show an error. Track pending/failed status so the UI can indicate in-flight items and offer retry.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why is the database (not the network) the right single source of truth?",
    a: [
      {
        t: "p",
        text: "Making the *local database* the single source of truth means the UI always observes one consistent, always-available store — it works offline, updates reactively (Room `Flow`), and doesn't flicker between network and cache. The network's job is just to *update the database*; the UI never talks to the network directly. This decouples UI from connectivity and gives a smooth, offline-first experience.",
      },
      {
        t: "list",
        items: [
          "**UI observes the DB** — one consistent, always-available source.",
          "**Offline-capable** — the DB works without network.",
          "**Reactive** — Room `Flow` re-emits on any update.",
          "**Network updates the DB** — the UI never reads the network directly.",
        ],
      },
      {
        t: "note",
        text: "The local DB as single source of truth: the UI observes one consistent, always-available store (works offline, reactive via Room Flow, no cache/network flicker). The network's only job is to update the DB; the UI never reads the network directly — decoupling UI from connectivity (offline-first).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle pagination with offline caching (RemoteMediator)?",
    a: [
      {
        t: "p",
        text: "Use Paging 3's `RemoteMediator` with Room: the `PagingSource` reads pages *from the DB* (source of truth), and the `RemoteMediator` fetches network pages and *writes them into the DB* as the user scrolls near the end. This gives paginated, offline-capable lists — cached pages show instantly, new pages load and persist, and the DB drives the UI.",
      },
      {
        t: "list",
        items: [
          "**`PagingSource` from Room** — the DB is the source of truth for pages.",
          "**`RemoteMediator`** — fetches network pages, writes to the DB.",
          "**Offline** — cached pages display without network.",
          "**Triggered by scroll** — loads more near the list end, persists it.",
        ],
      },
      {
        t: "note",
        text: "Paging 3 + Room via RemoteMediator: the PagingSource reads pages from the DB (source of truth), and RemoteMediator fetches network pages and writes them to the DB as the user nears the end. Cached pages show instantly offline; new pages load, persist, and the DB drives the UI.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you avoid stale data problems in a cache?",
    a: [
      {
        t: "p",
        text: "Combine strategies: use TTL/timestamps to detect staleness and refresh; invalidate cache on relevant writes (Room `Flow` auto-refreshes); use HTTP `ETag`/`Cache-Control` for conditional refresh; and pull-to-refresh for user-initiated updates. The goal is to serve fast (cache) while ensuring the user isn't stuck with outdated data — refresh in the background and on demand.",
      },
      {
        t: "list",
        items: [
          "**TTL/timestamps** — refresh when stale.",
          "**Write invalidation** — Room `Flow` re-emits on writes.",
          "**Conditional refresh** — `ETag`/`Cache-Control`.",
          "**Pull-to-refresh** — user-initiated freshness.",
        ],
      },
      {
        t: "note",
        text: "Avoid stale data by combining TTL/timestamps (refresh when stale), write invalidation (Room Flow auto-refreshes), conditional HTTP refresh (ETag/Cache-Control), and pull-to-refresh (user-initiated). Serve fast from cache while refreshing in the background and on demand so the user isn't stuck with old data.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between an in-memory LruCache and a disk cache?",
    a: [
      {
        t: "p",
        text: "An `LruCache` holds recently-used items *in memory* — extremely fast but volatile (lost on process death) and bounded by RAM (evicts least-recently-used when full). A *disk cache* (Room, files, OkHttp/image disk cache) is slower but *persistent* across restarts and larger. Layer them: check memory first, then disk, then network.",
      },
      {
        t: "list",
        items: [
          "**`LruCache`** — in-memory, fast, volatile, RAM-bounded (LRU eviction).",
          "**Disk cache** — persistent, larger, slower.",
          "**Layered** — memory → disk → network.",
          "**Size limits** — memory sized to avoid OOM; disk to a byte budget.",
        ],
      },
      {
        t: "note",
        text: "LruCache = in-memory, very fast, volatile (lost on process death), RAM-bounded with LRU eviction. Disk cache (Room/files/OkHttp) = persistent across restarts, larger, slower. Layer them: memory → disk → network. Size memory to avoid OOM, disk to a byte budget.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test offline-first behavior?",
    a: [
      {
        t: "p",
        text: "Abstract the network and DB behind repositories with fakes: test that data is served from the cache when the network fails, that a fetch updates the DB (which re-emits), and that writes queue when offline and flush when online. Use a fake network that can be toggled offline/error, an in-memory Room DB, and `runTest` to drive the flows deterministically.",
      },
      {
        t: "list",
        items: [
          "**Fake network** — toggle offline/error to exercise fallbacks.",
          "**In-memory Room** — real DB behavior in tests.",
          "**Assert cache-serving** — data returned when network fails.",
          "**Assert sync** — queued writes flush when 'online'.",
        ],
      },
      {
        t: "note",
        text: "Test offline-first with a fake network (toggle offline/error) + an in-memory Room DB: assert data is served from cache when the network fails, a fetch updates the DB (re-emits), and offline writes queue then flush when online. Drive flows with runTest for determinism.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is optimistic vs pessimistic UI updating?",
    a: [
      {
        t: "p",
        text: "*Optimistic* updating applies the change to the UI *immediately*, assuming the server call will succeed (rolling back on failure) — feels instant and responsive. *Pessimistic* updating waits for the server to confirm before updating the UI (showing a spinner) — safer but slower. Optimistic is preferred for common, low-risk actions (like/favorite); pessimistic for critical operations (payments) where you must confirm first.",
      },
      {
        t: "list",
        items: [
          "**Optimistic** — update now, roll back on failure; instant feel.",
          "**Pessimistic** — wait for confirmation; safer, slower.",
          "**Optimistic for** — likes, toggles, low-risk edits.",
          "**Pessimistic for** — payments, irreversible/critical actions.",
        ],
      },
      {
        t: "note",
        text: "Optimistic: update the UI immediately (roll back on failure) — instant, for common low-risk actions (like/favorite). Pessimistic: wait for server confirmation (spinner) — safer/slower, for critical operations (payments). Choose by risk and reversibility.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you decide what to cache and how much storage to use?",
    a: [
      {
        t: "p",
        text: "Cache data that's *expensive to fetch and frequently re-read* (feeds, images, profiles) and *safe to store* (not sensitive without encryption). Bound storage: set size limits on caches (LRU eviction for memory, byte budgets for disk/image caches), use `cacheDir` for clearable data, and periodically prune stale entries. Don't cache everything — balance UX (offline/speed) against storage and privacy.",
      },
      {
        t: "list",
        items: [
          "**Cache** — expensive-to-fetch, frequently-read, non-sensitive data.",
          "**Bound it** — size limits (LRU/byte budgets), `cacheDir` for clearable data.",
          "**Prune** — evict stale/oldest entries.",
          "**Don't over-cache** — balance offline/speed vs storage and privacy.",
        ],
      },
      {
        t: "note",
        text: "Cache data that's expensive to fetch and frequently re-read (feeds/images/profiles) and non-sensitive. Bound storage with size limits (LRU for memory, byte budgets for disk/image caches), use cacheDir for clearable data, and prune stale entries. Balance UX (offline/speed) against storage and privacy — don't cache everything.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between HTTP caching and app-level database caching?",
    a: [
      {
        t: "p",
        text: "*HTTP caching* (OkHttp cache with ETag/Cache-Control) is *transport-level* — it caches raw responses and revalidates with the server, saving bandwidth transparently. *App-level DB caching* (Room) is *domain-level* — it stores parsed, queryable, relational data as the single source of truth the UI observes. HTTP caching helps efficiency; DB caching provides offline-first structure. They complement each other.",
      },
      {
        t: "list",
        items: [
          "**HTTP cache** — raw responses, revalidation (ETag), bandwidth savings; transparent.",
          "**DB cache** — parsed/queryable domain data; single source of truth; offline-first.",
          "**Complementary** — HTTP for efficiency, DB for structure/offline.",
          "**UI observes the DB** — not the HTTP cache directly.",
        ],
      },
      {
        t: "note",
        text: "HTTP caching (OkHttp ETag/Cache-Control) is transport-level — caches raw responses, revalidates, saves bandwidth transparently. App DB caching (Room) is domain-level — parsed, queryable data as the single source of truth the UI observes (offline-first). They complement: HTTP for efficiency, DB for structure/offline.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you clear the cache on logout or user switch?",
    a: [
      {
        t: "p",
        text: "On logout, wipe user-specific cached data so the next user doesn't see it: `db.clearAllTables()` (or delete user-scoped rows), clear DataStore user prefs, clear the HTTP/image caches if they hold user data, and cancel in-flight sync work. Do it in a transaction/coordinated step, off the main thread, before navigating to login. Keep app-level (non-user) caches if appropriate.",
      },
      {
        t: "list",
        items: [
          "**Wipe user data** — `clearAllTables()`/delete user rows.",
          "**Clear prefs/tokens** — DataStore user keys, encrypted token.",
          "**Clear caches** — HTTP/image caches holding user data.",
          "**Cancel sync work** — WorkManager jobs; then navigate to login.",
        ],
      },
      {
        t: "note",
        text: "On logout/user switch, wipe user-specific data: db.clearAllTables() (or delete user rows), clear DataStore user prefs + token, clear HTTP/image caches with user data, and cancel in-flight sync work — off the main thread, before navigating to login. Prevents the next user seeing stale data.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a cache stampede, and how do you avoid it?",
    a: [
      {
        t: "p",
        text: "A cache stampede (or 'thundering herd') is when a cached item expires and *many* concurrent requests all miss and hit the network/DB simultaneously to refill it — overloading the source. Avoid it by *deduplicating* in-flight refreshes (one fetch shared among callers, e.g. via `flatMapLatest`/a shared Flow), staggering TTLs with jitter, and serving stale data while a single background refresh runs (stale-while-revalidate).",
      },
      {
        t: "list",
        items: [
          "**Stampede** — many concurrent misses refill the same item at once.",
          "**Dedup in-flight fetches** — one shared refresh (shared Flow / single-flight).",
          "**TTL jitter** — stagger expirations to avoid synchronized misses.",
          "**Stale-while-revalidate** — serve stale during a single refresh.",
        ],
      },
      {
        t: "note",
        text: "A cache stampede is many concurrent requests all missing an expired item and refilling it at once (overloading the source). Avoid via single-flight/dedup of in-flight refreshes (one shared fetch), TTL jitter (stagger expirations), and stale-while-revalidate (serve stale during one background refresh).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you design periodic background sync?",
    a: [
      {
        t: "p",
        text: "Use `WorkManager` with a `PeriodicWorkRequest` and constraints (network, maybe charging) to sync data at intervals — it's battery-friendly (batched by the system) and survives reboots. The worker fetches updates, writes to the DB (source of truth), and handles failures with retry/backoff. For push-driven freshness, complement it with FCM data messages triggering an immediate one-off sync.",
      },
      {
        t: "list",
        items: [
          "**`PeriodicWorkRequest`** — interval sync (min 15 min) with constraints.",
          "**Constraints** — network/charging; battery-friendly, survives reboot.",
          "**Write to DB** — the source of truth; retry/backoff on failure.",
          "**FCM-triggered** — push a one-off sync for immediate freshness.",
        ],
      },
      {
        t: "note",
        text: "Periodic sync: WorkManager PeriodicWorkRequest (≥15 min) with constraints (network/charging) — battery-friendly, survives reboot; the worker fetches, writes to the DB (source of truth), retries with backoff. Complement with FCM data messages triggering a one-off expedited sync for immediate freshness.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between full sync and delta (incremental) sync?",
    a: [
      {
        t: "p",
        text: "*Full sync* re-downloads the entire dataset each time — simple but wasteful (bandwidth, battery) and slow for large data. *Delta sync* only fetches *changes since the last sync* (using a timestamp/cursor/version the server understands), applying them to the local DB — far more efficient. Delta sync needs server support (a 'changes since X' endpoint) and careful handling of deletions and conflicts.",
      },
      {
        t: "list",
        items: [
          "**Full sync** — re-fetch everything; simple, wasteful, slow at scale.",
          "**Delta sync** — fetch only changes since a cursor/timestamp; efficient.",
          "**Needs server support** — a 'changes since X' endpoint; handle deletions.",
          "**Use delta** — for large/frequently-synced datasets.",
        ],
      },
      {
        t: "note",
        text: "Full sync re-downloads everything (simple, wasteful, slow at scale); delta sync fetches only changes since a cursor/timestamp/version and applies them locally (efficient). Delta needs server support (a 'changes since X' endpoint) and careful deletion/conflict handling. Prefer delta for large/frequent syncs.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is idempotency important for retried offline writes?",
    a: [
      {
        t: "p",
        text: "Offline writes are retried (on reconnect, after failures), so the *same* request may reach the server *multiple times*. Without idempotency, that could create duplicate records or double-apply an action (e.g. two identical orders). Attach an *idempotency key* (a client-generated unique id per operation) so the server can detect and dedupe retries — applying the operation exactly once.",
      },
      {
        t: "list",
        items: [
          "**Retries cause duplicates** — the same write may arrive multiple times.",
          "**Idempotency key** — a client-generated unique id per operation.",
          "**Server dedupes** — applies the operation once, ignores retries with the same key.",
          "**Exactly-once effect** — safe retries for offline sync.",
        ],
      },
      {
        t: "note",
        text: "Retried offline writes may reach the server multiple times, risking duplicates/double-applied actions. Attach a client-generated idempotency key per operation so the server dedupes retries and applies it exactly once. Essential for safe offline-write sync.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you show connectivity/offline status in the UI?",
    a: [
      {
        t: "p",
        text: "Observe connectivity via `ConnectivityManager.NetworkCallback` (wrapped in a `callbackFlow`) and expose it as a `Flow<Boolean>`; the UI collects it to show an offline banner/indicator. Combine it with sync state (pending writes) to communicate 'offline — changes will sync later'. Keep the app usable offline (serving from the DB) rather than blocking the UI.",
      },
      {
        t: "list",
        items: [
          "**Observe connectivity** — `NetworkCallback` → `callbackFlow` → `Flow<Boolean>`.",
          "**Offline banner** — the UI collects and shows status.",
          "**Combine with sync state** — 'changes will sync when online'.",
          "**Stay usable** — serve from the DB; don't block offline.",
        ],
      },
      {
        t: "note",
        text: "Observe connectivity (ConnectivityManager.NetworkCallback wrapped in callbackFlow → Flow<Boolean>) and show an offline banner; combine with pending-sync state to convey 'offline — changes will sync later'. Keep the app usable offline (serve from the DB), don't block the UI.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle flaky or intermittent connectivity?",
    a: [
      {
        t: "p",
        text: "Design for it: serve from the DB cache so the UI works regardless of connectivity; retry failed requests with *exponential backoff + jitter* (only transient errors); use timeouts so a flaky connection doesn't hang; queue writes to sync when a stable connection returns (WorkManager network constraint); and debounce connectivity flapping so you don't thrash retries on every brief reconnect.",
      },
      {
        t: "list",
        items: [
          "**DB-backed UI** — works despite connectivity gaps.",
          "**Retry with backoff + jitter** — transient errors only.",
          "**Timeouts** — don't hang on a stalled connection.",
          "**Queue + WorkManager** — flush writes when stably online; debounce flapping.",
        ],
      },
      {
        t: "note",
        text: "For flaky connectivity: serve from the DB cache (UI works offline), retry transient failures with exponential backoff + jitter, use timeouts (don't hang), queue writes to sync via WorkManager (network constraint) when stably online, and debounce connectivity flapping to avoid thrashing retries.",
      },
    ],
  },
];

export default qa;
