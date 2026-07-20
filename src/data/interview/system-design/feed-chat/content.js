// Design a Feed & Chat — Content tab. Teaching-first.

const content = [
  {
    heading: "Designing a paginated feed",
    blocks: [
      {
        t: "p",
        text: "'Design a news/social feed' (Twitter, Instagram, a news app) is a very common question. The core challenges: an *effectively infinite* list (can't load it all — paginate), *smooth scrolling* (efficient rendering, image loading), *caching/offline* (show cached content instantly and offline), and *freshness* (new content, pull-to-refresh). It brings together pagination, caching/SSOT, image loading, and rendering performance.",
      },
      {
        t: "list",
        items: [
          "**Pagination** — the feed is unbounded, so load it in *pages* as the user scrolls (cursor-based pagination: `GET /feed?cursor=X&limit=20` returning items + a next-cursor). Cursor-based is preferred over offset-based for feeds because it's stable when items are inserted/removed (offset pagination duplicates/skips items when the list shifts).",
          "**Architecture** — Paging 3 with a `RemoteMediator` + Room: the network fills Room *page by page*, and the UI reads *from Room*. This gives *offline-capable pagination* — cached pages show instantly and offline; scrolling fetches new pages when online (the SSOT/offline-first pattern applied to an infinite list).",
          "**Rendering** — a `LazyColumn` (or RecyclerView) that recycles views (only visible items composed/bound), with stable *keys* (so inserts don't cascade recomposition), and a caching *image loader* (Coil) with downsampling for feed images. This keeps memory bounded and scrolling smooth.",
          "**Freshness** — pull-to-refresh (fetch the newest page, prepend to Room); optionally a 'new posts' indicator; and for real-time feeds, a push/WebSocket to signal new content. Cache invalidation via TTL or refresh-on-open.",
        ],
      },
    ],
  },
  {
    heading: "Feed deep-dives: memory, prefetch, and mixed content",
    blocks: [
      {
        t: "list",
        items: [
          "**Bounded memory** — never hold the whole feed in memory. Paging keeps only a window of items in memory (dropping far-away pages), the list recycles views, and images are downsampled + LRU-cached. So even a feed scrolled for hours stays memory-safe. This is the key mobile constraint for a feed.",
          "**Prefetch** — load the *next* page slightly *before* the user reaches the end (Paging's `prefetchDistance`), so the next content is ready when they get there — smooth infinite scroll with no visible loading pause. Balance against wasted data (don't prefetch too far).",
          "**Mixed content types** — feeds have heterogeneous items (text posts, image posts, videos, ads). Model as a sealed type and render each variant (`when (item) { is Post -> ...; is Ad -> ... }`); use `contentType` in the lazy list for efficient view recycling per type.",
          "**Image/video optimization** — images downsampled to display size (Coil); videos loaded lazily and only played when visible (autoplay-on-scroll with lifecycle-aware players); placeholders during load to avoid layout jank.",
          "**Read state / analytics** — track which items were seen (impressions) for analytics, and read state if relevant — efficiently (batch, don't fire per item).",
          "**Trade-offs** — Paging 3 + RemoteMediator (offline, robust, but complex) vs a simpler in-memory paginated list (simpler, no offline); cursor vs offset pagination (stability vs simplicity); how much to prefetch/cache (smoothness vs data/battery).",
        ],
      },
    ],
  },
  {
    heading: "Designing a chat feature",
    blocks: [
      {
        t: "p",
        text: "'Design a chat/messaging feature' is a rich question because it needs *real-time* delivery, *offline* support (send/read messages offline), *reliable* delivery (messages must not be lost), *ordering*, and *state* (sent/delivered/read). It combines real-time (WebSockets/push), offline-first, and sync.",
      },
      {
        t: "list",
        items: [
          "**Real-time transport** — a *WebSocket* (persistent bidirectional connection) for live message send/receive while the app is active, so messages arrive instantly with no polling. Plus *FCM push* for delivering messages/notifications when the app is *backgrounded* (a WebSocket isn't kept alive in the background). So: WebSocket when active, push when backgrounded.",
          "**Local DB as SSOT** — messages stored in Room; the chat UI *observes* Room (so it shows history offline and updates live). Incoming messages (from WebSocket/push/sync) write to Room → UI updates. This is the offline-first foundation.",
          "**Sending messages — optimistic + reliable**: on send, write the message to Room immediately with status `SENDING` (shows instantly in the chat, optimistic), then send via WebSocket (or queue for sync if offline). On server ack, update to `SENT`; on delivery/read receipts, `DELIVERED`/`READ`. If sending fails or offline, it stays queued (outbox) and retries — so a message sent offline reliably delivers when back online.",
          "**Message status** — the sent/delivered/read lifecycle (the checkmarks) — each message carries a status updated by acks and receipts from the server.",
        ],
      },
    ],
  },
  {
    heading: "Chat deep-dives: ordering, reliability, and sync",
    blocks: [
      {
        t: "list",
        items: [
          "**Ordering** — messages must display in the correct order despite async delivery and clock differences. Use *server-assigned* sequence numbers or timestamps (not just client time, which varies across devices) to order messages consistently. A locally-sent message shows immediately (optimistic) and settles into the correct position when the server assigns its sequence.",
          "**Reliable delivery — push is best-effort, so sync is the backbone**: WebSocket/push can *drop* or *delay* messages (device offline, connection lost), so they are *not* the reliable transport. The *source of truth* is the server + local DB — when the app opens/reconnects, it *syncs missed messages* (fetch messages since the last-known message id). So push/WebSocket give *timely* delivery, but *sync* guarantees *completeness* — never treat a push as the only way a message arrives (a dropped push must not mean a lost message).",
          "**Pagination of history** — a chat can have thousands of messages; load them paginated (load recent, fetch older as the user scrolls up — reverse pagination). Room + Paging, reading from the local cache.",
          "**Offline sending** — messages sent offline queue in the outbox (Room, `SENDING`/`PENDING`), and a sync/WorkManager job (or the WebSocket on reconnect) sends them when online, with idempotency ids so retries don't duplicate. Same offline-write pattern as the sync topic.",
          "**Deduplication** — because a message might arrive via *both* WebSocket and sync (or a retry), dedup by message id so it's not shown twice.",
          "**Typing indicators / presence** — ephemeral real-time signals (typing, online status) sent over the WebSocket, *not* persisted (they're transient) — a lighter-weight real-time channel alongside message delivery.",
          "**Group chat / scale** — fan-out (deliver to all members' devices), read receipts per member, and efficient delivery (the server handles fan-out; the client receives its messages).",
        ],
      },
      {
        t: "note",
        text: "Feed: unbounded → paginate (cursor-based, stable); Paging 3 + RemoteMediator + Room = offline-capable pagination (network fills Room, UI reads Room); LazyColumn recycling + keys + Coil (downsampled) for smooth memory-safe scrolling; prefetch for seamless infinite scroll; sealed types + contentType for mixed items; pull-to-refresh + optional push for freshness. Chat: WebSocket (active) + FCM push (backgrounded) for real-time; Room SSOT (offline history + live updates); optimistic send (SENDING → SENT → DELIVERED → READ) + outbox for offline; ORDER by server sequence/timestamp; push is BEST-EFFORT so SYNC on reconnect guarantees completeness (dropped push ≠ lost message); paginate history; dedup by id; ephemeral typing/presence over WebSocket.",
      },
    ],
  },
];

export default content;
