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
  {
    level: "senior",
    q: "What are the layers of a feed's client architecture?",
    a: [
      {
        t: "p",
        text: "A feed client typically has: a *paginated list UI* (LazyColumn/RecyclerView with efficient item reuse), a *ViewModel* exposing paged UI state, a *Paging library* (Paging 3) coordinating page loads, a *RemoteMediator/repository* that fetches pages from the API and *caches them in a local DB* (Room) as the single source of truth (so the feed shows cached content offline and while refreshing), and the *network layer*. Images load via a *caching image loader* (Coil). This 'network → DB → UI' flow with paging is the canonical feed architecture — describe it clearly.",
      },
      {
        t: "list",
        items: [
          "**Paginated list UI** — efficient item reuse.",
          "**ViewModel** — paged UI state.",
          "**Paging + RemoteMediator** — pages into a local DB (SSOT).",
          "**Image loader** — cached (Coil); offline-capable.",
        ],
      },
      {
        t: "note",
        text: "Feed client layers: paginated list UI (LazyColumn/RecyclerView, efficient reuse), ViewModel (paged state), Paging library + RemoteMediator/repository fetching pages into a local DB (Room SSOT — shows cached content offline/while refreshing), network layer, and a caching image loader (Coil). The 'network → DB → UI' paged flow is the canonical feed architecture.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you decide between server-side and client-side feed ranking?",
    a: [
      {
        t: "p",
        text: "*Server-side ranking* (the norm for large feeds) computes the ordered feed on the backend (using signals, ML, freshness) and the client just *displays* it — keeps ranking logic centralized, updatable without an app release, and leverages server data/compute. *Client-side* ranking/re-ordering is limited (the client lacks full signals and compute) but can do *light personalization* (recently viewed, local preferences) or *merge* multiple sources. Generally: *rank on the server, render on the client*. Discuss that the client shouldn't own core ranking, but may apply small local adjustments and handles *presentation* (dedup, seen-state).",
      },
      {
        t: "list",
        items: [
          "**Server-side** — centralized ranking, updatable, full signals.",
          "**Client-side** — light personalization/merging only.",
          "**Rule** — rank on server, render on client.",
          "**Client handles** — dedup, seen-state, presentation.",
        ],
      },
      {
        t: "note",
        text: "Rank on the server (centralized, ML/signals, updatable without release, full compute); the client displays. Client-side ranking is limited (lacks signals/compute) — only light personalization (recently viewed) or merging sources. Rule: rank on server, render on client. The client handles presentation (dedup, seen-state), not core ranking.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between push and pull (fan-out) models for a feed?",
    a: [
      {
        t: "p",
        text: "This is a *backend* feed-generation choice: *fan-out on write* (push) — when a user posts, the post is *pushed into all followers' precomputed feeds* (fast reads, expensive writes, bad for celebrities with millions of followers). *Fan-out on read* (pull) — a user's feed is *assembled on request* from the people they follow (cheap writes, expensive reads). Large systems use a *hybrid* (push for most, pull for high-follower accounts). As the *mobile* candidate, you *mention* this to show awareness, but keep focus on the *client* (how it consumes/paginates/caches the feed) unless asked to go backend-deep.",
      },
      {
        t: "list",
        items: [
          "**Fan-out on write (push)** — into followers' feeds; fast reads.",
          "**Fan-out on read (pull)** — assembled per request; cheap writes.",
          "**Hybrid** — push most, pull celebrities.",
          "**Mobile focus** — mention it, focus on client consumption.",
        ],
      },
      {
        t: "note",
        text: "Backend feed generation: fan-out on write (push) — post pushed into all followers' precomputed feeds (fast reads, costly writes, bad for celebrities); fan-out on read (pull) — feed assembled per request (cheap writes, costly reads); large systems hybrid (push most, pull high-follower). As the mobile candidate, mention it for awareness but focus on client consumption (paginate/cache) unless asked to go backend-deep.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle images and media efficiently in a feed?",
    a: [
      {
        t: "p",
        text: "Use a *caching image loader* (Coil/Glide) that: *downsamples* images to the display size (never decode full-res into a small view), decodes *off the main thread*, caches in *memory + disk*, and *cancels* requests for recycled items (avoiding the 'wrong image' bug). Request *appropriately-sized* images from the server/CDN (thumbnails for the list, full-res on tap) rather than downloading huge originals. *Prefetch* upcoming images during scroll for smoothness. Media (video) should *lazy-load/autoplay only visible* items. Image handling is often the biggest feed performance factor — cover it concretely.",
      },
      {
        t: "list",
        items: [
          "**Image loader** — downsample, off-main, memory+disk cache.",
          "**Cancel** — recycled requests (no wrong-image bug).",
          "**Server-sized** — thumbnails in list, full-res on tap.",
          "**Prefetch + lazy video** — smooth scroll, only visible autoplay.",
        ],
      },
      {
        t: "note",
        text: "Use a caching image loader (Coil/Glide): downsample to display size, decode off-main, cache memory+disk, cancel recycled requests (no wrong-image bug). Request appropriately-sized images from the CDN (thumbnails in list, full-res on tap), prefetch during scroll, lazy-load/autoplay only visible video. Image handling is often the biggest feed performance factor — cover it concretely.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you keep a feed fresh (pull-to-refresh, new items)?",
    a: [
      {
        t: "p",
        text: "Support *pull-to-refresh* (fetch the latest page, prepend/replace, update the cache) and optionally a *'new posts' pill* when new content is available (fetched in background via polling/push) that the user taps to jump up — avoiding jarring auto-inserts that disrupt reading position. Use *cursor-based* fetching so refresh gets items *newer than* the top cursor. Preserve *scroll position* and *seen state* across refreshes. Balance freshness with *data/battery* (don't over-poll). For real-time-ish feeds, a lightweight push can signal 'new content' to fetch. Freshness UX matters as much as the mechanism.",
      },
      {
        t: "list",
        items: [
          "**Pull-to-refresh** — fetch latest, update cache.",
          "**'New posts' pill** — non-disruptive; tap to jump.",
          "**Cursor** — fetch newer-than-top.",
          "**Preserve** — scroll/seen state; balance freshness vs battery.",
        ],
      },
      {
        t: "note",
        text: "Freshness: pull-to-refresh (fetch latest, update cache) + a 'new posts' pill when new content arrives (background poll/push) that the user taps to jump up (avoid jarring auto-inserts). Cursor-fetch newer-than-top; preserve scroll/seen state; don't over-poll (data/battery). A lightweight push can signal new content. Freshness UX matters as much as the mechanism.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you choose a transport for real-time chat, and why?",
    a: [
      {
        t: "p",
        text: "*WebSockets* are the usual choice for chat — a *persistent, bidirectional* connection giving low-latency send/receive both ways, ideal for instant messaging and typing/presence indicators. Alternatives: *long-polling/SSE* (server→client only, a fallback), *MQTT* (lightweight pub/sub, used by some chat apps for efficiency), and *FCM push* for *delivering messages when the app is backgrounded/killed* (the socket isn't alive then). A robust design uses *WebSocket (or MQTT) while foregrounded* + *push for background delivery*, plus a *fetch-on-open* reconciliation. Justify by latency (bidirectional) and mobile background constraints.",
      },
      {
        t: "list",
        items: [
          "**WebSocket** — persistent bidirectional, low-latency (chat).",
          "**MQTT** — lightweight pub/sub alternative.",
          "**FCM push** — background/killed delivery (socket not alive).",
          "**Robust** — socket foreground + push background + reconcile.",
        ],
      },
      {
        t: "note",
        text: "Chat transport: WebSocket (persistent bidirectional, low-latency — ideal for messaging + typing/presence), with MQTT as a lightweight alternative, SSE/long-poll as fallback, and FCM push for background/killed delivery (the socket's dead then). Robust design: socket (or MQTT) while foreground + push for background + fetch-on-open reconciliation. Justify by bidirectional latency and mobile background limits.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you guarantee message ordering and no-loss in chat?",
    a: [
      {
        t: "p",
        text: "Don't rely on network arrival order. Give each message a *server-assigned sequence number/timestamp* (or a logical clock) and *order by it* on the client, not by receipt time. For *no-loss*: the server is the *source of truth*; the client *fetches missed messages on (re)connect* using a *last-seen cursor/sequence* (so a dropped socket message is recovered on sync). Use *acknowledgements* (server acks receipt; client acks delivery/read) and *idempotent message IDs* (client-generated) so retries don't duplicate. Combine live socket delivery with *gap-detection + fetch* to guarantee completeness. Reliability comes from server-as-truth + reconciliation, not the transport alone.",
      },
      {
        t: "list",
        items: [
          "**Order by** — server sequence/timestamp, not arrival.",
          "**No-loss** — server SSOT; fetch missed via last-seen cursor.",
          "**Acks + idempotent IDs** — no dupes on retry.",
          "**Gap-detection + fetch** — guarantees completeness.",
        ],
      },
      {
        t: "note",
        text: "Order by server-assigned sequence/timestamp (not arrival). No-loss: server is SSOT, client fetches missed messages on reconnect via a last-seen cursor (recovers dropped socket messages); use acks (receipt/delivery/read) and idempotent client-generated message IDs (no dupe on retry); detect sequence gaps and fetch. Reliability = server-as-truth + reconciliation, not transport alone.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you make sending a message feel instant but reliable?",
    a: [
      {
        t: "p",
        text: "*Optimistic UI*: when the user sends, *immediately* show the message locally in a *'sending'* state (with a client-generated ID) — the UI feels instant. In the background, send it (over socket/API) with *retry*; on *server ack*, mark it *'sent/delivered'* (reconcile the client ID with the server ID); on *failure*, show a *'failed' with retry* affordance. Persist unsent messages locally (an *outbox*) so they survive app restart and send when back online. This decouples *perceived* speed from *actual* delivery — instant feedback, guaranteed eventual delivery. Classic optimistic-write pattern applied to chat.",
      },
      {
        t: "list",
        items: [
          "**Optimistic** — show 'sending' immediately (client ID).",
          "**Background send + retry** — ack → 'sent/delivered'.",
          "**Failure** — 'failed' with retry.",
          "**Outbox** — persist unsent; survive restart/offline.",
        ],
      },
      {
        t: "note",
        text: "Optimistic UI: on send, immediately show the message locally in 'sending' (client-generated ID) — feels instant. Background send with retry; on server ack mark 'sent/delivered' (reconcile IDs); on failure show 'failed' + retry. Persist unsent in a local outbox (survives restart/offline). Decouples perceived speed from actual delivery — instant feedback, guaranteed eventual delivery.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle chat message persistence and history?",
    a: [
      {
        t: "p",
        text: "Store messages in a *local database* (Room/SQLDelight) keyed by conversation and ordered by sequence/timestamp — the UI reads from the DB (offline-capable, fast). Load history with *pagination* (fetch older messages on scroll-up via a cursor). New messages (socket/push) are *written to the DB*, and the UI observes the DB (single source of truth) so it updates reactively. Sync fills gaps. This 'DB as source of truth, network writes into it' pattern gives offline access, smooth scrolling of history, and reactive updates — the standard chat persistence design.",
      },
      {
        t: "list",
        items: [
          "**Local DB** — per conversation, ordered; UI reads it (offline).",
          "**History** — paginate older via cursor on scroll-up.",
          "**New messages** — write to DB; UI observes (SSOT).",
          "**Sync** — fills gaps; reactive updates.",
        ],
      },
      {
        t: "note",
        text: "Persist messages in a local DB (Room/SQLDelight) per conversation, ordered by sequence, UI reads it (offline, fast). Paginate history (older messages on scroll-up via cursor). Write new socket/push messages to the DB; the UI observes it (SSOT) for reactive updates. Sync fills gaps. 'DB as source of truth, network writes into it' — the standard chat persistence design.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you implement typing indicators and presence?",
    a: [
      {
        t: "p",
        text: "These are *ephemeral, high-frequency, best-effort* signals — don't persist them like messages. *Typing*: send a lightweight 'typing' event over the socket, *throttled/debounced* (e.g. every few seconds while typing), with a client-side *timeout* to auto-clear if no update arrives. *Presence* (online/last-seen): the server tracks socket connect/disconnect and heartbeats; clients *subscribe* to presence for visible conversations only (not everyone). Keep these *out of the durable message store*, minimize their frequency (battery/bandwidth), and treat missed ones as harmless. They add liveliness without the reliability guarantees of messages.",
      },
      {
        t: "list",
        items: [
          "**Ephemeral/best-effort** — not persisted.",
          "**Typing** — throttled event + auto-clear timeout.",
          "**Presence** — server tracks connect/heartbeat; subscribe to visible.",
          "**Minimize frequency** — battery/bandwidth; missed = harmless.",
        ],
      },
      {
        t: "note",
        text: "Typing/presence are ephemeral, high-frequency, best-effort — don't persist them. Typing: throttled/debounced socket event + client timeout to auto-clear. Presence: server tracks socket connect/disconnect/heartbeats; clients subscribe only for visible conversations. Keep out of the message store, minimize frequency (battery/bandwidth), treat misses as harmless. Liveliness without message-level guarantees.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle connection management for a chat socket?",
    a: [
      {
        t: "p",
        text: "Manage the socket's *lifecycle*: *connect* when the app/chat is foregrounded, *disconnect* when backgrounded (rely on push for background messages, saving battery). *Reconnect* automatically with *exponential backoff + jitter* on drops, *heartbeat/ping* to detect dead connections, and *re-authenticate* on reconnect. On (re)connection, *reconcile* (fetch missed messages via last-seen cursor). Handle *network changes* (WiFi↔cellular) by reconnecting. Tie the socket to a lifecycle-aware scope so it's cleaned up properly. Robust connection management is what makes real-time chat reliable on flaky mobile networks.",
      },
      {
        t: "list",
        items: [
          "**Lifecycle** — connect foreground, disconnect background (push covers it).",
          "**Reconnect** — backoff + jitter; heartbeat detects dead sockets.",
          "**On reconnect** — re-auth + reconcile missed via cursor.",
          "**Network changes** — reconnect; lifecycle-scoped cleanup.",
        ],
      },
      {
        t: "note",
        text: "Connection management: connect when foreground, disconnect when backgrounded (push covers background — saves battery); reconnect with exponential backoff + jitter, heartbeat/ping to detect dead sockets, re-authenticate on reconnect, and reconcile (fetch missed via last-seen cursor). Handle WiFi↔cellular changes by reconnecting; lifecycle-scope the socket. Robust management makes chat reliable on flaky networks.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle read receipts and delivery status?",
    a: [
      {
        t: "p",
        text: "Model message status as a progression: *sending → sent (server received) → delivered (recipient's device got it) → read (recipient opened it)*. Each transition is driven by an *acknowledgement*: the server acks 'sent', the recipient's client acks 'delivered' on receipt and 'read' when displayed, propagated back to the sender (via socket/push). Store status per message; update the UI (single/double/blue ticks). Batch read receipts to avoid chattiness. Respect *privacy* (some apps let users disable read receipts). It's an ack-driven state machine layered on the messaging pipeline.",
      },
      {
        t: "list",
        items: [
          "**Status** — sending → sent → delivered → read.",
          "**Ack-driven** — server/recipient acks each transition.",
          "**Propagate back** — to sender; update ticks.",
          "**Batch + privacy** — avoid chattiness; allow disabling.",
        ],
      },
      {
        t: "note",
        text: "Read receipts/delivery status = an ack-driven state machine: sending → sent (server ack) → delivered (recipient device ack) → read (recipient displayed), propagated back to the sender via socket/push. Store status per message, update ticks. Batch receipts to reduce chattiness; respect privacy (allow disabling). Layered on the messaging pipeline as acknowledgements.",
      },
    ],
  },
  {
    level: "senior",
    q: "How would you support group chat differently from 1:1?",
    a: [
      {
        t: "p",
        text: "Group chat adds *fan-out* (a message goes to N members — the server delivers to all, and for large groups this is a scaling concern), *membership management* (join/leave, roles/admins), *per-member read state* (who has read — more complex than 1:1's single receipt), and *presence/typing* aggregated across members. Delivery still uses socket + push per member. Consider *large-group* optimizations (don't send full presence for everyone; limit read-receipt granularity). Encryption (if E2EE) is harder (key distribution to all members). Note these deltas from 1:1 — it shows you can extend a design to added complexity.",
      },
      {
        t: "list",
        items: [
          "**Fan-out** — to N members; scaling for large groups.",
          "**Membership + roles** — join/leave, admins.",
          "**Per-member read state** — more complex than 1:1.",
          "**Large-group** — limit presence/receipt granularity; E2EE harder.",
        ],
      },
      {
        t: "note",
        text: "Group chat vs 1:1 adds: fan-out to N members (scaling for large groups), membership management (join/leave, roles/admins), per-member read state (vs single receipt), and aggregated presence/typing. Delivery still socket+push per member; large groups need optimizations (limit presence/receipt granularity). E2EE is harder (key distribution to all). Note these deltas — shows you extend a design to added complexity.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle media messages (images/video) in chat?",
    a: [
      {
        t: "p",
        text: "Don't send media inline over the message socket. Instead: *upload the file* to blob storage/CDN (resumable, off the message path), get a *URL/reference*, and send a *message containing that reference + metadata* (thumbnail, size, dimensions). Recipients get the reference and *download/cache* the media via an image/media loader (downsampled, cached). Show a *thumbnail/placeholder* immediately and *progress* for up/download. This keeps the message pipeline lightweight, leverages CDN for delivery, and lets media load lazily. Same 'reference, not payload' principle as elsewhere — media travels out-of-band.",
      },
      {
        t: "list",
        items: [
          "**Upload to CDN/blob** — resumable, off the message path.",
          "**Message** — carries a URL/reference + metadata/thumbnail.",
          "**Recipient** — downloads/caches lazily via media loader.",
          "**Show** — thumbnail + progress; media travels out-of-band.",
        ],
      },
      {
        t: "note",
        text: "Media in chat: upload the file to blob storage/CDN (resumable, off the message path), send a message with the URL/reference + metadata (thumbnail/size); recipients download/cache lazily via a media loader (downsampled). Show a thumbnail/placeholder + up/download progress. Keeps the message pipeline light, uses CDN for delivery. 'Reference, not payload' — media travels out-of-band.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the key performance considerations for a feed?",
    a: [
      {
        t: "p",
        text: "*Scrolling smoothness* (efficient list recycling, cheap item binding/composition, stable keys, no main-thread work), *image efficiency* (downsampled, cached, cancelled on recycle, prefetched), *pagination* (load incrementally, prefetch before the end), *memory* (bounded caches, don't retain all pages), *network* (compact paginated payloads, cache to avoid refetch, avoid over-fetching), and *perceived performance* (skeletons/placeholders while loading). Also *Baseline Profiles* for the scroll path. A feed is a performance-critical surface — enumerate these concretely and tie them to smooth 60fps scrolling.",
      },
      {
        t: "list",
        items: [
          "**Scroll** — recycling, cheap binding, stable keys, off-main.",
          "**Images** — downsample, cache, cancel, prefetch.",
          "**Paging + memory** — incremental, bounded caches.",
          "**Network + perceived** — compact/cached; skeletons; Baseline Profile.",
        ],
      },
      {
        t: "note",
        text: "Feed performance: smooth scroll (recycling, cheap binding/composition, stable keys, off-main), image efficiency (downsample, cache, cancel on recycle, prefetch), pagination (incremental + prefetch), bounded memory (don't retain all pages), efficient network (compact/paginated/cached, no over-fetch), perceived performance (skeletons), and a Baseline Profile for the scroll path. Tie to smooth 60fps.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle offline support in a feed or chat?",
    a: [
      {
        t: "p",
        text: "Make the *local DB the source of truth*: the feed/chat UI reads cached content from the DB, so it *works offline* (shows the last-synced feed/messages). *Writes* (post, send message, like) are applied *optimistically* to the local DB and *queued* for sync (retry when back online). New remote data is *written into the DB* and the UI observes it. Show *connectivity/sync state* (offline banner, 'sending' status). On reconnect, sync pushes queued actions and pulls updates. This offline-first pattern applies to both feed and chat — the DB decouples the UI from network availability.",
      },
      {
        t: "list",
        items: [
          "**Local DB SSOT** — UI reads cached; works offline.",
          "**Writes** — optimistic local + queued sync.",
          "**Remote data** — written to DB; UI observes.",
          "**Show** — offline/sync state; reconcile on reconnect.",
        ],
      },
      {
        t: "note",
        text: "Offline: local DB as SSOT — feed/chat UI reads cached content (works offline, shows last-synced). Writes (post/send/like) applied optimistically to the DB and queued for sync (retry online). Remote data written to the DB, UI observes it. Show connectivity/sync state (offline banner, 'sending'). Reconnect pushes queued + pulls updates. The DB decouples UI from network for both feed and chat.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle the 'jump to unread' / scroll position in chat?",
    a: [
      {
        t: "p",
        text: "Track the user's *last-read message* (persisted, synced across devices) and, on opening a conversation, *position the list at the first unread* (with a divider), not always the bottom. Handle *scroll anchoring* so loading older history (prepending) doesn't jump the viewport. When new messages arrive while the user is *scrolled up*, don't auto-scroll — show a *'new messages' button*; only auto-scroll if they're already at the bottom. Preserve position across config changes/process death. These UX details (anchoring, unread positioning) are what make a chat feel polished — worth calling out.",
      },
      {
        t: "list",
        items: [
          "**Last-read** — persisted/synced; open at first unread.",
          "**Scroll anchoring** — prepending history doesn't jump.",
          "**New while scrolled up** — 'new messages' button, no auto-scroll.",
          "**Preserve position** — across config/process death.",
        ],
      },
      {
        t: "note",
        text: "Track last-read (persisted, cross-device synced), open at the first unread (with a divider) not always the bottom. Anchor scroll so prepending older history doesn't jump the viewport. New messages while scrolled up → a 'new messages' button, no auto-scroll (auto only if at bottom). Preserve position across config/process death. These anchoring/unread details make chat feel polished.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you address end-to-end encryption in chat (at a high level)?",
    a: [
      {
        t: "p",
        text: "With *E2EE*, messages are *encrypted on the sender's device and decrypted only on the recipient's* — the server relays *ciphertext* it can't read. This needs *key management*: each device has a key pair, public keys are exchanged (a key server), and protocols like *Signal's Double Ratchet* provide forward secrecy. Challenges on mobile: *multi-device* (sync keys/messages across a user's devices), *key backup/recovery* (lose the device → lose history unless backed up encrypted), *group E2EE* (distribute keys to all members), and *push* (can't decrypt server-side, so notifications show generic text until the app decrypts). It's a deep topic — show you understand the *model and trade-offs*, not full crypto.",
      },
      {
        t: "list",
        items: [
          "**E2EE** — encrypt on sender, decrypt on recipient; server relays ciphertext.",
          "**Keys** — per-device pairs, key exchange, Double Ratchet.",
          "**Challenges** — multi-device, backup/recovery, group keys.",
          "**Push** — generic text (server can't decrypt).",
        ],
      },
      {
        t: "note",
        text: "E2EE: encrypt on sender, decrypt only on recipient; server relays unreadable ciphertext. Needs key management (per-device key pairs, public-key exchange, Signal Double Ratchet for forward secrecy). Mobile challenges: multi-device key/message sync, key backup/recovery (lost device = lost history unless encrypted-backed-up), group key distribution, and push (generic text since server can't decrypt). Show the model + trade-offs, not full crypto.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you structure the data model for a chat app?",
    a: [
      {
        t: "p",
        text: "Core entities: *Conversation* (id, participants, last-message preview, unread count, timestamps), *Message* (id, conversationId, senderId, content/media-ref, sequence/timestamp, status), and *User* (id, name, avatar, presence). Locally (Room/SQLDelight): a `conversations` table and a `messages` table (indexed by conversationId + sequence for ordered pagination), with a *denormalized* last-message on the conversation for the list. The message's *client-generated ID* enables optimistic send + dedup. Design the schema for the *queries* you need (conversation list ordered by recent activity; messages per conversation paginated).",
      },
      {
        t: "list",
        items: [
          "**Conversation** — participants, last-message, unread, timestamps.",
          "**Message** — conversationId, sender, content/ref, sequence, status.",
          "**Indexed** — messages by conversationId + sequence.",
          "**Denormalized** — last-message on conversation for the list.",
        ],
      },
      {
        t: "note",
        text: "Chat data model: Conversation (id, participants, denormalized last-message preview, unread, timestamps), Message (id, conversationId, senderId, content/media-ref, sequence/timestamp, status), User (id, name, avatar, presence). Locally: conversations + messages tables, messages indexed by conversationId + sequence for ordered pagination; client-generated message ID for optimistic send/dedup. Design the schema for your queries.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle backend push for messages when the app is killed?",
    a: [
      {
        t: "p",
        text: "When the app is *backgrounded/killed*, the WebSocket is dead, so the server sends a *high-priority FCM message* to wake the app / show a notification. Use a *data message* (or notification + data) so the app can *fetch the actual message(s)* from the server (push as a signal, not the payload — payloads are size-limited and shouldn't carry sensitive/full content). On tap, *deep-link* to the conversation. Handle *reliability* (FCM is best-effort — reconcile on next open via the last-seen cursor) and *ordering* (fetch, don't trust push order). This 'socket foreground, push background, fetch-to-reconcile' combo covers all app states.",
      },
      {
        t: "list",
        items: [
          "**App killed** — socket dead → high-priority FCM.",
          "**Data message** — signal to fetch actual message(s).",
          "**Tap** — deep-link to conversation.",
          "**Reliability** — reconcile on open (best-effort push).",
        ],
      },
      {
        t: "note",
        text: "App killed → socket dead → server sends high-priority FCM to wake/notify. Use a data (or notification+data) message so the app fetches the actual message(s) — push as a signal, not payload (size-limited, no sensitive content). Deep-link on tap. Handle reliability (FCM best-effort — reconcile on open via last-seen cursor) and ordering (fetch, don't trust push order). 'Socket foreground, push background, fetch-to-reconcile' covers all states.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle feed item interactions (like, comment) reliably?",
    a: [
      {
        t: "p",
        text: "Apply *optimistic updates*: on like, *immediately* toggle the UI and update the local cache, then send the request in the background; on failure, *revert* and optionally notify. Use *idempotent* operations (a like is idempotent — repeating it is safe) and *dedupe* rapid taps (debounce). Persist the *intent* (queue it) so it survives offline/restart and syncs later. Reconcile with the server's authoritative count on next fetch. For comments (a write with content), the same optimistic + outbox pattern applies with a 'posting' state. Interactions should feel instant while guaranteeing eventual consistency.",
      },
      {
        t: "list",
        items: [
          "**Optimistic** — toggle UI + cache instantly, send in background.",
          "**Idempotent + debounce** — safe repeats, dedupe taps.",
          "**Queue intent** — survives offline/restart; sync later.",
          "**Failure** — revert; reconcile with server on fetch.",
        ],
      },
      {
        t: "note",
        text: "Feed interactions (like/comment): optimistic — toggle UI + local cache instantly, send in background, revert on failure. Use idempotent ops (like is idempotent) and debounce rapid taps; queue the intent (survives offline/restart, syncs later); reconcile with the server's authoritative count on next fetch. Comments use the same optimistic + outbox pattern with a 'posting' state. Instant feel, eventual consistency.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle deep-linking into a feed item or conversation?",
    a: [
      {
        t: "p",
        text: "Support *deep links* (app links / URIs like `app://post/123` or `https://app.com/chat/abc`) that open the *specific screen* — a feed post or a conversation. On open, *parse the link*, *navigate* to the target (building a sensible back stack so 'back' works), and *load the entity* (fetch if not cached). Handle the *cold-start* case (app not running — initialize, then route) and *not-found/permission* cases gracefully. Deep links power *notifications* (tap → conversation) and *sharing* (share a post link). Use *verified App Links* for `https` to open directly without a chooser.",
      },
      {
        t: "list",
        items: [
          "**Deep link** — URI to a specific post/conversation.",
          "**Parse + navigate** — with a sensible back stack.",
          "**Load entity** — fetch if uncached; handle not-found.",
          "**Cold start + verified App Links** — route on launch, no chooser.",
        ],
      },
      {
        t: "note",
        text: "Deep-linking: app links/URIs (app://post/123, https://app.com/chat/abc) open the specific screen. Parse the link, navigate (sensible back stack), load the entity (fetch if uncached), handle cold-start (init then route) and not-found/permission cases. Powers notification taps and sharing. Use verified App Links for https (open directly, no chooser).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you design a feed to minimize data usage?",
    a: [
      {
        t: "p",
        text: "Data efficiency matters on metered/slow networks: request *compact, screen-shaped payloads* (only fields the feed needs — a BFF/GraphQL helps), *paginate* (don't bulk-download), *cache aggressively* (avoid refetching unchanged content — ETags/conditional requests), request *appropriately-sized images* from the CDN (thumbnails, WebP), *lazy-load* media (only visible/near-visible), and *prefetch conservatively* (respect data-saver/metered-connection settings). Compress responses (gzip). Optionally offer a *data-saver mode* (lower-res images, no autoplay). Data usage affects retention in data-conscious markets — design for it explicitly.",
      },
      {
        t: "list",
        items: [
          "**Compact payloads** — screen-shaped (BFF/GraphQL), paginated.",
          "**Cache + ETags** — avoid refetching unchanged content.",
          "**Images** — CDN-sized thumbnails/WebP, lazy-load.",
          "**Prefetch conservatively** — respect data-saver; gzip.",
        ],
      },
      {
        t: "note",
        text: "Minimize feed data: compact screen-shaped payloads (BFF/GraphQL), pagination (no bulk download), aggressive caching (ETags/conditional requests avoid refetching), CDN-sized images (thumbnails/WebP), lazy-load media (only visible), conservative prefetch (respect data-saver/metered), gzip. Offer a data-saver mode (lower-res, no autoplay). Data usage affects retention in data-conscious markets.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle message editing and deletion in chat?",
    a: [
      {
        t: "p",
        text: "Model edits/deletes as *operations on an existing message* referenced by its *stable server ID*: an *edit* sends new content + an edited flag/timestamp; a *delete* marks the message deleted (tombstone) rather than hard-removing (so all clients converge). Apply *optimistically* locally, sync to the server, and propagate to other participants (socket/push) who *update their local copy*. Handle *ordering/consistency* (an edit must apply to the right message even if it arrives before the original on a slow client — reconcile via ID). Show 'edited'/'deleted' states. This is CRUD-on-messages with the same optimistic + sync + reconcile discipline as sends.",
      },
      {
        t: "list",
        items: [
          "**Reference by stable ID** — edit = new content+flag, delete = tombstone.",
          "**Optimistic** — apply locally, sync, propagate to participants.",
          "**Converge** — tombstones not hard-delete; reconcile by ID.",
          "**Show** — edited/deleted states.",
        ],
      },
      {
        t: "note",
        text: "Edit/delete = operations on an existing message by stable server ID: edit sends new content + edited flag/timestamp; delete marks a tombstone (not hard-remove, so clients converge). Apply optimistically, sync, propagate to participants (socket/push) who update their local copy; reconcile by ID for ordering. Show edited/deleted states. CRUD-on-messages with the same optimistic + sync + reconcile discipline as sends.",
      },
    ],
  },
  {
    level: "senior",
    q: "What non-functional requirements matter most for feed and chat?",
    a: [
      {
        t: "p",
        text: "For a *feed*: smooth scrolling performance, offline viewing, image efficiency, freshness, and low data usage. For *chat*: low-latency delivery, message reliability/ordering (no-loss), offline send/receive, real-time presence, and battery-efficient connections. *Both*: work on flaky/slow networks, degrade gracefully, secure data (auth, maybe E2EE for chat), scale to large histories/lists, and observability (delivery metrics, crash-free). Call out that these *non-functional* concerns often *drive the design* more than the features — and prioritize them per the product (a chat lives or dies on reliability; a feed on scroll performance).",
      },
      {
        t: "list",
        items: [
          "**Feed** — scroll perf, offline, images, freshness, data use.",
          "**Chat** — low-latency, reliability/ordering, offline, battery.",
          "**Both** — flaky networks, security, scale, observability.",
          "**Drive the design** — prioritize per product.",
        ],
      },
      {
        t: "note",
        text: "Feed NFRs: scroll performance, offline viewing, image efficiency, freshness, low data. Chat NFRs: low-latency delivery, reliability/ordering (no-loss), offline send/receive, presence, battery-efficient connections. Both: flaky networks, graceful degradation, security (E2EE for chat), scale to large histories, observability. These non-functional concerns drive the design more than features — prioritize per product (chat=reliability, feed=scroll).",
      },
    ],
  },
];

export default qa;
