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
];

export default qa;
