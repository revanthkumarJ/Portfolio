// Design a Feed & Chat — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "How would you design an infinitely-scrolling news feed?",
    a: [
      {
        t: "p",
        text: "**The feed is effectively infinite, so you *paginate* — load it in pages as the user scrolls — and use a local database as the source of truth so the feed is fast and works offline. The standard architecture is Paging 3 + a RemoteMediator + Room: the network fills Room page by page, and the UI reads from Room.**",
      },
      {
        t: "list",
        items: [
          "**Pagination** — load pages of ~20 items as the user approaches the end (cursor-based: `GET /feed?cursor=X&limit=20`), rather than loading everything (impossible) or all upfront (slow, memory-heavy).",
          "**Offline-capable via Room SSOT** — the network writes pages *into Room*, and the UI reads *from Room* (via Paging). So cached pages show instantly and offline, and scrolling fetches new pages when online — the offline-first pattern applied to an infinite list. Paging 3's `RemoteMediator` orchestrates this.",
          "**Smooth rendering** — a LazyColumn (or RecyclerView) recycles views (only visible items are composed), stable *keys* prevent cascade recomposition on updates, and a caching image loader (Coil) with downsampling keeps feed images memory-safe.",
          "**Freshness** — pull-to-refresh fetches the newest page; cache invalidation via TTL or refresh-on-open; optionally push for real-time new content.",
        ],
      },
      {
        t: "p",
        text: "The key mobile constraints are *bounded memory* (never hold the whole feed — Paging keeps a window in memory, the list recycles, images are downsampled) and *smooth scrolling* (cheap item binds, prefetch the next page before the user reaches it). So the design combines pagination (for the infinite list), SSOT/Room (for offline + consistency), efficient rendering (LazyColumn + keys + Coil), and prefetch (for seamless scroll). This grounds the feed in the established Android toolkit — Paging 3, Room, Coil, coroutines/Flow — applied to the feed's specific challenges of infinite length, memory limits, and offline support.",
      },
    ],
  },
  {
    level: "junior",
    q: "What transport would you use for a real-time chat app?",
    a: [
      {
        t: "p",
        text: "**A combination: a WebSocket for real-time messaging while the app is *active* (a persistent bidirectional connection delivering messages instantly), and FCM push for delivering messages/notifications when the app is *backgrounded* (a WebSocket can't be kept alive in the background). So WebSocket when foregrounded, push when backgrounded.**",
      },
      {
        t: "list",
        items: [
          "**WebSocket (active)** — a persistent, bidirectional connection so messages send and arrive *instantly* with no polling, and the server can push messages to the client in real time. Ideal while the user is in the chat.",
          "**FCM push (backgrounded)** — when the app is in the background, you can't keep a WebSocket alive (battery, OS limits), so the server sends messages via push notification. High-priority pushes can even wake the app to sync.",
          "**Local DB (Room) as the source of truth** — incoming messages (from WebSocket, push, or sync) write to Room, and the chat UI observes Room — so it shows offline history and updates live.",
        ],
      },
      {
        t: "p",
        text: "The critical insight beyond the transport choice is that *push and WebSocket are best-effort, not reliable* — they can drop or delay messages (device offline, connection lost). So they must *not* be the sole delivery mechanism. The reliable backbone is *sync*: when the app opens or reconnects, it fetches any missed messages from the server (messages since the last-known id), guaranteeing completeness. So WebSocket/push give *timely* delivery, and *sync* guarantees *nothing is lost* — a dropped push never means a lost message, because the app will sync it. This decoupling of *notification* (real-time but unreliable) from *message delivery* (reliable via sync from the server-and-DB source of truth) is the key architectural principle for reliable chat.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle sending a message so it feels instant but is reliable?",
    a: [
      {
        t: "p",
        text: "**You use optimistic sending with a reliable outbox: write the message to the local DB *immediately* with a `SENDING` status (so it appears in the chat instantly), then send it via WebSocket (or queue it if offline); update its status as acknowledgments come back (`SENT` → `DELIVERED` → `READ`), and retry from the queue if it fails.**",
      },
      {
        t: "list",
        items: [
          "**Optimistic display** — on send, immediately write the message to Room (marked `SENDING`) so the UI (observing Room) shows it *instantly*, with no waiting on the network. This is what makes sending feel immediate, even offline.",
          "**Reliable delivery** — the message is durably queued (in Room / an outbox), so if the send fails or the user is offline, it's *not lost* — a sync/WorkManager job (or the WebSocket on reconnect) retries sending it when online. It carries an *idempotency id* so retries don't create duplicates server-side.",
          "**Status lifecycle** — the server acks the send (→ `SENT`), then delivery/read receipts update it (→ `DELIVERED` → `READ`) — the checkmarks users see. If it permanently fails, mark it `FAILED` with a retry option.",
        ],
      },
      {
        t: "p",
        text: "This is the same optimistic-local-first-write + outbox pattern as offline sync, applied to messages: the *local write* gives instant, offline-capable UX, and the *durable queue + background retry* gives reliability (the message eventually delivers). The message *appears* the moment you tap send (optimistic), reflects its true state via status updates, and is *guaranteed* to eventually send even if you were offline or the app was killed. The key is separating the *UX* (instant, via the local write) from the *delivery guarantee* (eventual, via the outbox + retry) — you don't block the user on the network, but you also don't lose their message. Handling the failure case (mark FAILED, allow retry) and idempotency (no duplicates on retry) completes the picture.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you ensure messages appear in the correct order and none are lost in a chat app?",
    a: [
      {
        t: "p",
        text: "**Ordering: use *server-assigned* sequence numbers (or server timestamps), not client clocks, so all devices order messages consistently. Reliability: treat WebSocket/push as best-effort *notification* and use *sync from the server as the source of truth* to guarantee completeness — on reconnect/open, fetch all messages since the last-known id, so a dropped push never means a lost message. Dedup by message id since a message may arrive via multiple paths.**",
      },
      {
        t: "list",
        items: [
          "**Ordering via server sequence, not client time**: client clocks differ across devices (and can be wrong), so ordering by client timestamp produces inconsistent order. Instead, the *server* assigns each message a monotonic *sequence number* (or authoritative timestamp) when it receives it, and clients order by that. A locally-sent message shows *immediately* (optimistic, at the bottom) and *settles* into its correct position once the server assigns its sequence — so the ordering converges to the server's canonical order across all devices.",
          "**Reliability — sync is the backbone, push is best-effort**: the crucial principle is that WebSocket and push can *drop or delay* messages (offline, connection loss, push throttling), so they are *not* a reliable transport. The reliable source of truth is the *server + local DB*. When the app opens or reconnects, it *syncs* — requests all messages *since the last message id it has* — filling any gaps. So push/WebSocket provide *timely* delivery when they work, and *sync* provides *completeness* regardless. A dropped push is fine because the next sync retrieves the message. Never treat a push/WebSocket message as the *only* way a message arrives.",
          "**Gap detection**: because messages have sequence numbers, the client can *detect a gap* (received sequence 5 then 8 — missing 6, 7) and trigger a sync to fetch the missing ones, ensuring no silent holes in the conversation.",
          "**Deduplication by id**: a message might arrive via WebSocket *and* via sync (or a retry sends it twice) — so dedup by the message's unique id (upsert into Room by id) to avoid showing it twice. Client-generated ids for sent messages also enable idempotent sending (the server dedupes retries).",
        ],
      },
      {
        t: "list",
        items: [
          "**Offline sending fits in**: messages sent offline queue in the outbox and send on reconnect with idempotency ids; the server assigns their sequence on receipt, so they slot into the correct order once delivered. So both *receiving* (sync fills gaps, sequence orders) and *sending* (outbox guarantees delivery, server assigns order) are covered.",
          "**Read/delivery state consistency**: sync also reconciles message *status* (delivered/read) across devices, so a message read on one device shows read on others — another reason sync (not just real-time) is the backbone.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: correct ordering and no-loss in chat come from two principles. *Ordering*: rely on *server-assigned sequence numbers*, not client clocks (which diverge) — the server is the ordering authority, and optimistically-shown local messages settle into the server's canonical order, so all devices converge. *No loss*: recognize that *real-time transport (WebSocket/push) is best-effort and unreliable*, so it cannot be the delivery *guarantee* — the guarantee comes from *sync against the server-and-local-DB source of truth*, which fills gaps on reconnect (detectable via sequence gaps) and reconciles state. This *decouples timeliness from completeness*: push/WebSocket make messages *fast*, sync makes them *complete*, and neither depends on the other. Deduplication by id handles the multiple-delivery-paths reality, and idempotency handles retries. The insight that distinguishes a senior answer is understanding that a chat app is fundamentally a *sync problem with a real-time optimization* — the server + local DB is the reliable source of truth reconciled via sync, and WebSocket/push is a *latency optimization* layered on top, *not* the reliability mechanism. Treating push as reliable (and thus losing messages when it drops) is the naive mistake; treating the app as 'sync for completeness + real-time for speed, ordered by server sequence, deduped by id' is the robust design. Demonstrating the server-sequence ordering, the push-is-best-effort/sync-is-the-backbone principle, gap detection, and deduplication is the comprehensive senior answer to chat reliability.",
      },
    ],
  },
  {
    level: "senior",
    q: "For a feed, what are the key performance and efficiency considerations, and how do you handle them?",
    a: [
      {
        t: "p",
        text: "**The key considerations are *bounded memory* (never hold the whole feed), *smooth scrolling* (cheap per-frame work, prefetch), *efficient networking* (paginate, cache, don't over-fetch), and *efficient media* (downsampled, lazily-loaded images/videos) — all stemming from the feed being effectively infinite on a resource-constrained device. Each has a specific technique.**",
      },
      {
        t: "list",
        items: [
          "**Bounded memory** — the feed is unbounded, so you *cannot* hold it all in memory. Paging keeps only a *window* of loaded items in memory (dropping far-away pages), the LazyColumn/RecyclerView *recycles* views (only visible items are composed/bound), and images are *downsampled* to display size and LRU-cached. So even after scrolling for hours, memory stays bounded — no OOM. This is the primary mobile constraint for a feed.",
          "**Smooth scrolling (frame budget)** — each item binds/composes *on the frame* as it scrolls in, so per-item work must be *cheap*: precompute/format data in the ViewModel (the UI gets render-ready data), keep item composables skippable (stable/immutable models, keys), and load images via a caching loader (not synchronously decoding on the bind). Heavy per-item work drops frames at the scroll edge. Also, judge scroll performance on *release* builds with baseline profiles (debug is janky by nature).",
          "**Prefetch for seamless infinite scroll** — load the *next* page *before* the user reaches the end (Paging's `prefetchDistance`), so content is ready with no visible loading pause. Balance against wasted bandwidth (don't prefetch too aggressively on metered connections).",
          "**Efficient networking** — paginate (fetch ~20 at a time, not the whole feed), cache pages in Room (avoid re-fetching what's cached — the SSOT gives instant cached reads and offline), use *cursor-based* pagination (stable under inserts), and support conditional/delta fetches if the API allows (don't re-download unchanged content). Respect the user's data plan.",
          "**Efficient media** — feed images are the biggest data/memory cost: downsample to display size (Coil handles it), lazy-load (only fetch images for visible/near-visible items), use appropriate formats/quality, and for videos, load lazily and play only when visible (lifecycle-aware players, autoplay-on-scroll). Placeholders prevent layout jank during load.",
        ],
      },
      {
        t: "list",
        items: [
          "**Mixed content efficiency** — heterogeneous items (posts, images, videos, ads) modeled as a sealed type with `contentType` in the lazy list, so view recycling is efficient per type (a post reuses a post's structure).",
          "**Measurement** — profile scroll performance (Perfetto/Macrobenchmark on release builds), watch Layout Inspector recomposition counts, and add baseline profiles for the scroll path (often the biggest first-scroll-jank win). Optimize based on measurement, not guessing.",
          "**Trade-offs** — how much to cache/prefetch (smoothness/offline vs storage/data/battery); Paging 3's robustness vs its complexity for simpler feeds; aggressive image quality vs data usage. State these as data-driven choices.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: a feed's performance challenges all stem from one fact — it's *effectively infinite* running on a *memory-, battery-, and bandwidth-constrained device with a frame budget*. So the design is a set of *bounding and efficiency techniques*: *bound memory* (paging window + view recycling + image downsampling — never hold it all), *hit the frame budget* (cheap per-item binds via render-ready data and stable/skippable composables, plus baseline profiles), *bound network* (pagination + Room caching + cursor stability + delta where possible — don't over-fetch), and *bound media cost* (downsampled, lazily-loaded images/videos — the biggest consumer). Prefetch makes the infinite scroll *seamless*, mixed-content typing keeps recycling *efficient*, and *measurement* (Perfetto/Macrobenchmark on release) ensures you optimize the real bottleneck. The unifying insight is that every technique is about *not doing more than necessary given the constraints* — only load what's visible (+ a prefetch margin), only keep in memory what's near, only decode images to display size, only fetch pages as needed — which is exactly the discipline mobile's constraints demand. Connecting the feed's specific concerns (memory, frame budget, network, media) to concrete techniques (paging, recycling, downsampling, prefetch, caching, baseline profiles) grounded in the real toolkit (Paging 3, Room, Coil, LazyColumn), plus the measurement discipline and trade-offs, is the comprehensive senior answer that shows you understand feed performance as a bounded-resource problem, not just 'make it fast'.",
      },
    ],
  },
];

export default qa;
