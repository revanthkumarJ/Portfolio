// Approaching Mobile System Design — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "How is mobile system design different from backend system design?",
    a: [
      {
        t: "p",
        text: "**Mobile system design centers on the *client* — data flow within the app, caching, offline behavior, the UI/data layers, and the constraints of running on a device — whereas backend system design centers on *servers* (scaling, distributed databases, load balancing, handling millions of requests).** They test different concerns.",
      },
      {
        t: "list",
        items: [
          "**Mobile focuses on**: the app's *layered architecture* (UI → ViewModel → repository → local DB + network), *caching strategies*, *offline-first* behavior (working without a network, syncing writes when back online), *network efficiency* (unreliable/metered connections), *memory and battery* constraints, and *lifecycle* handling (process death, configuration changes, background limits).",
          "**Backend focuses on**: server *scale* (handling load), *distributed systems* (sharding, replication, consistency), *databases* at scale, *caching layers* (Redis), *load balancing*, and *availability*.",
        ],
      },
      {
        t: "p",
        text: "The key distinction is that mobile design is about the *constraints of the device and the unreliable link to the server* — a phone has limited memory and battery, an intermittent network, and a lifecycle where the OS can kill your process anytime. So mobile designs emphasize *offline support*, *caching* (to be fast and work offline), *efficient networking* (respect data/battery), and *resilience to lifecycle events* — concerns that barely exist in backend design. The client↔server *contract* matters (what data the API provides), but you're not designing the server's scaling; you're designing how the *client* handles data, caching, offline, and the device's realities. This is why mobile designs almost always revolve around the single-source-of-truth/offline-first pattern (local DB as the authority, network as an updater), which is the mobile-specific architectural backbone.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the first thing you should do in a system design interview?",
    a: [
      {
        t: "p",
        text: "**Clarify the requirements and scope — do *not* start designing immediately.** Ask questions to understand exactly what you're building before proposing any architecture. Jumping straight into a design without understanding the problem is the most common way candidates fail, because they end up solving the wrong problem or missing key constraints.",
      },
      {
        t: "list",
        items: [
          "**Functional requirements** — what features are in scope? 'Design Instagram' is far too broad; clarify to something concrete like 'the photo feed with infinite scroll and offline caching'. Pin down what you're actually building.",
          "**Non-functional requirements** — does it need offline support? Real-time updates? What's the expected scale/data volume? Which platforms? These shape the whole design.",
          "**Constraints** — any limits or priorities? What should you focus on (the interviewer often has a specific area they want to explore)?",
        ],
      },
      {
        t: "p",
        text: "This step matters for two reasons. First, it ensures you *solve the right problem* — a design that's brilliant but addresses the wrong scope is useless. Second, it *demonstrates good engineering judgment* — real senior engineers clarify before building; jumping in signals inexperience. It also lets you *scope the problem to something answerable* in the time available (design the core, not everything). Spend a few minutes here, confirm your understanding with the interviewer ('So I'm designing X with offline support, focusing on the caching — is that right?'), and only then move to the architecture. The interviewer is often *deliberately* vague to see if you'll ask — treating the clarification as part of the test, not a preamble to it, is what distinguishes a strong candidate.",
      },
    ],
  },
  {
    level: "junior",
    q: "What mobile-specific concerns should you always address?",
    a: [
      {
        t: "list",
        items: [
          "**Data flow & single source of truth** — where data lives authoritatively (usually a local database) and how it flows to the UI. The SSOT/offline-first pattern (UI observes the DB; network updates the DB) is the backbone of most mobile designs.",
          "**Caching** — what's cached, where (memory/disk), how it's invalidated (TTL/ETag/events), and the read strategy (cache-then-network for instant + fresh). Central to mobile UX.",
          "**Offline support** — how the app works offline (serve cached data), and critically how *offline writes* are handled (write locally, sync in the background when online, resolve conflicts). Offline is *the* mobile differentiator.",
          "**Network efficiency** — minimizing requests and data: pagination, batching, delta/incremental sync, compression, image optimization — respecting metered connections and battery.",
          "**Memory & performance** — bounded memory (paginate, recycle, downsample images — don't load everything), avoiding jank and leaks.",
          "**Lifecycle & reliability** — surviving process death (persist state), configuration changes, background execution limits, and graceful error/retry handling.",
        ],
      },
      {
        t: "p",
        text: "These are the concerns that *distinguish mobile design* from generic software design — they stem from the realities of running on a resource-constrained device with an unreliable network and an OS that controls your lifecycle. Addressing them (especially SSOT/offline-first, caching, and offline writes) is what shows you understand *mobile* engineering, not just architecture in the abstract. A design that ignores offline behavior, caching, or memory constraints would be flagged as naive for a mobile context. So in any mobile design, proactively cover: how does this work offline? what's cached and how is it invalidated? how do writes sync? is the network use efficient? does it survive process death? Weaving these in demonstrates mobile-specific competence.",
      },
    ],
  },
  {
    level: "senior",
    q: "Walk through your framework for a mobile system design question, using a concrete example.",
    a: [
      {
        t: "p",
        text: "**I use a structured 6-step framework — clarify, define the data contract, high-level architecture, deep-dive core components, address mobile concerns, discuss trade-offs — which keeps the answer organized and ensures I cover the key areas. Let me walk through it with 'design a news feed with offline support' as the example.**",
      },
      {
        t: "list",
        items: [
          "**1. Clarify requirements & scope**: I'd ask — infinite scroll or paged? Offline reading required (yes, given the prompt)? Real-time updates or pull-to-refresh? Rich media (images)? Scale of feed? Let's say: infinite-scroll feed of articles with images, offline reading of cached articles, pull-to-refresh, no real-time. This scopes it to something concrete.",
          "**2. Define the data contract**: the API provides paginated articles — `GET /feed?cursor=X&limit=20` returning articles (id, title, body, imageUrl, timestamp) plus a next-cursor. Note I'm consuming this, not designing the server. This grounds the design.",
          "**3. High-level architecture**: layered — Compose UI → FeedViewModel (exposes `StateFlow<PagingData>`) → FeedRepository → Room (local DB, the *single source of truth*) + Ktor/Retrofit (network). The UI *observes Room*; the network *fills Room*. This SSOT backbone gives offline support and consistency for free. Diagram it: UI ↕ ViewModel ↕ Repository ↕ (Room ← Network).",
          "**4. Deep-dive core components** (the interesting parts): (a) *Pagination* — use Paging 3 with a `RemoteMediator` so the network fills Room page-by-page and the UI reads from Room (offline-capable paging). (b) *Caching/SSOT* — articles cached in Room; the feed reads from Room (instant, offline), refresh writes new pages into Room. (c) *Images* — Coil with memory+disk cache and downsampling. (d) *Offline behavior* — reads always from Room, so cached articles show offline; refresh fails gracefully (keep showing cache + a snackbar).",
          "**5. Address mobile concerns**: *offline* (Room SSOT + cached images = offline reading works); *caching invalidation* (TTL or refresh-on-open; RemoteMediator clears/replaces on refresh); *network efficiency* (paginate 20 at a time, don't over-fetch; images downsampled to view size; conditional requests/ETags if the API supports); *memory* (Paging bounds in-memory items, LazyColumn recycles, Coil downsamples — no OOM); *lifecycle* (Paging's `cachedIn` survives config changes; Room persists across process death; scroll position restorable).",
          "**6. Trade-offs**: SSOT/Room-as-truth adds complexity (mapping, RemoteMediator, remote-keys) vs a simpler network-only feed — *but* it's the only way to get offline + consistency, which the requirement demands. Paging 3 vs hand-rolled pagination — Paging handles dedup/retry/load-states but has a learning curve; justified for a real infinite feed. Coil vs custom image caching — always use a library. I'd also note where I'd change: a *real-time* feed would add WebSockets/push; a *tiny* fixed feed wouldn't need Paging.",
        ],
      },
      {
        t: "list",
        items: [
          "**Throughout, I'd communicate well**: think aloud, signal structure ('now the deep-dive on pagination'), draw the layered diagram, justify each choice with a trade-off, check in with the interviewer on where to focus, and prioritize the *interesting* parts (SSOT + paging + offline) over boilerplate.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the framework's value is that it imposes *structure* (so the answer is organized and complete, not a ramble) while ensuring I hit the areas interviewers evaluate — *clarifying first* (solving the right problem, showing judgment), *grounding in the data contract*, establishing the *architectural backbone* (SSOT/offline-first layered design), *deep-diving the interesting core* (where depth is shown), *explicitly addressing mobile concerns* (the differentiators — offline, caching, network, memory, lifecycle), and *justifying with trade-offs* (the senior signal). The concrete example shows how each step produces real design decisions grounded in the established Android toolkit (Room SSOT, Paging 3 + RemoteMediator, Coil, coroutines/Flow) — I'm *applying* proven patterns appropriately to the constraints, not inventing from scratch. And the meta-point is that *communication* (structure, thinking aloud, diagramming, trade-off justification, prioritization, checking in) is half the evaluation — a well-structured, clearly-narrated, trade-off-justified design scores far better than a technically-similar one delivered as a disorganized monologue. Demonstrating the framework, a concrete application of it, the grounding in real patterns, and the communication discipline is the comprehensive answer that shows you can *navigate* a system design interview, which is exactly what it tests.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you demonstrate senior-level judgment in a system design interview?",
    a: [
      {
        t: "p",
        text: "**Senior judgment shows in *how* you reason, not just *what* you design — specifically: clarifying and scoping before designing, justifying every significant decision with explicit trade-offs and alternatives, proactively addressing the hard mobile concerns (offline, edge cases, failure modes), prioritizing the interesting core over boilerplate, and adapting the design to the stated constraints rather than reciting a one-size-fits-all answer.**",
      },
      {
        t: "list",
        items: [
          "**Trade-off reasoning is the #1 signal**: for every meaningful choice, explain *why* this over that, and *when you'd choose differently*. 'I'd use Room as the source of truth *because* it gives offline support and consistency; the alternative — reading directly from the network — is simpler but breaks offline, so I'd only do that for a real-time-only feature where staleness is unacceptable.' This shows you understand there's no universal right answer — design depends on requirements. Reciting a design as if it's *the* answer (without trade-offs) is the junior tell.",
          "**Clarify and scope deliberately**: treating requirement-clarification as essential (not a formality), and *scoping* the problem to what matters, shows you solve the right problem — a senior instinct. Juniors jump straight to a solution.",
          "**Proactively surface the hard parts**: don't wait to be asked about offline writes, conflict resolution, error handling, process death, or edge cases — *raise* them yourself. 'Now, offline writes are the tricky part — I need local-first writes, background sync via WorkManager, and a conflict-resolution policy; let me think about last-write-wins vs merge here.' Anticipating the hard problems (rather than only the happy path) is distinctly senior.",
          "**Handle failure modes and edge cases**: designs that only cover the happy path are naive. Address what happens when the network fails mid-sync, when data conflicts, when the process is killed, when the cache is stale, when a request times out. Robustness under failure is a mark of experience.",
          "**Prioritize and manage time**: spend depth on the *core, interesting* components (what the question tests) and mention the rest briefly — don't rabbit-hole on a minor detail or spread too thin. Knowing *where* to invest depth is judgment.",
          "**Adapt to constraints**: tailor the design to the *stated* requirements (scale, offline, real-time, platform) rather than presenting a generic maximal design. 'Since this is a small fixed list, I *wouldn't* use Paging — that'd be over-engineering; a simple StateFlow<List> suffices.' Recognizing when *not* to use a heavy pattern is as senior as knowing when to.",
        ],
      },
      {
        t: "list",
        items: [
          "**Connect decisions to real-world consequences**: 'this caching choice matters because on a metered connection, re-fetching images would burn the user's data'; 'this needs to survive process death because Android kills backgrounded apps, and losing the user's place would be a bad experience'. Grounding decisions in *user and device realities* shows mobile-specific maturity.",
          "**Acknowledge what you're *not* doing and why**: explicitly noting scope boundaries ('I'm not designing the server scaling — assuming the API is given') and deferred concerns ('I'd add analytics/monitoring but let me focus on the core data flow') shows disciplined prioritization rather than trying to boil the ocean.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: system design interviews evaluate *engineering judgment under ambiguity*, and seniority shows in the *reasoning process*, not the raw design. The defining behaviors are: *trade-off reasoning* (every choice justified with why-this-over-that and when-you'd-differ — the single strongest signal, because it proves you understand design is contextual, not memorized), *deliberate clarification and scoping* (solving the right problem), *proactively surfacing the hard parts* (offline writes, conflicts, failures, edge cases — anticipating difficulty rather than only the happy path), *prioritization* (depth on the interesting core, breadth briefly elsewhere), and *adapting to constraints* (including recognizing when *not* to use a heavy pattern — avoiding over-engineering is as senior as knowing advanced patterns). Underlying all of it is *grounding decisions in real user/device consequences* (data plans, battery, process death, offline) — mobile-specific maturity. The junior anti-patterns are the mirror image: jumping in without clarifying, presenting a design as *the* answer without trade-offs, covering only the happy path, over-engineering with every pattern regardless of need, and reciting generic solutions. Demonstrating the *judgment behaviors* — trade-off justification, hard-part anticipation, constraint-adaptation, prioritization, and real-world grounding — is how you signal seniority, and it's ultimately what the interview is designed to reveal.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a good framework (like RADIO) for structuring a mobile system design answer?",
    a: [
      {
        t: "p",
        text: "A structured flow keeps you from rambling. A common one is *RADIO*: *Requirements* (clarify functional + non-functional), *Architecture* (high-level components: UI, presentation, domain, data, network), *Data model* (entities, DTOs, local schema), *Interface/API* (the client-server contract and internal component APIs), and *Optimizations/deep-dives* (caching, offline, performance, edge cases). Whatever the acronym, the point is: clarify → design the layers → define data/APIs → then deep-dive the hard parts. State your framework upfront so the interviewer follows your structure.",
      },
      {
        t: "list",
        items: [
          "**R**equirements — functional + non-functional.",
          "**A**rchitecture — UI/presentation/domain/data layers.",
          "**D**ata model + **I**nterface (API contract).",
          "**O**ptimizations — caching, offline, performance deep-dives.",
        ],
      },
      {
        t: "note",
        text: "Use a framework like RADIO: Requirements (functional + non-functional), Architecture (UI/presentation/domain/data/network layers), Data model (entities/DTOs/schema), Interface (client-server + component APIs), Optimizations/deep-dives (caching, offline, performance, edge cases). Clarify → layers → data/APIs → deep-dive. State your framework upfront so the interviewer follows.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you gather requirements in a mobile system design interview?",
    a: [
      {
        t: "p",
        text: "Split into *functional* (what the app does — e.g. 'view a feed, post, like, comment') and *non-functional* (how well — offline support, performance targets, scale, platforms, real-time needs, security). Ask clarifying questions: which platforms? Is offline needed? Real-time or polling? Expected scale? Any constraints (low-end devices, limited data)? Nail down the *scope* (you can't design everything in 45 min) and get the interviewer to confirm priorities. Explicitly listing requirements shows structure and prevents designing the wrong thing.",
      },
      {
        t: "list",
        items: [
          "**Functional** — features the app must do.",
          "**Non-functional** — offline, performance, scale, security, real-time.",
          "**Clarify** — platforms, offline, scale, constraints.",
          "**Confirm scope + priorities** — with the interviewer.",
        ],
      },
      {
        t: "note",
        text: "Gather requirements as functional (what — view feed, post, like) and non-functional (how well — offline, performance, scale, platforms, real-time, security). Ask: platforms? offline? real-time or polling? scale? device/data constraints? Nail scope (can't design everything) and confirm priorities. Listing requirements shows structure and prevents designing the wrong thing.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you decide what belongs on the client versus the server?",
    a: [
      {
        t: "p",
        text: "Put on the *client* what needs *responsiveness, offline capability, or device access* (UI state, local caching/DB, optimistic updates, rendering, device sensors). Put on the *server* what needs *trust, consistency, heavy computation, or cross-user coordination* (authoritative data, business rules that must be enforced, ranking/feed generation, fan-out, secrets). A good rule: *never trust the client* for security/authority (validate server-side), and *push heavy/shared logic server-side* while keeping the client thin but responsive. Discuss this boundary explicitly — it shapes the whole design.",
      },
      {
        t: "list",
        items: [
          "**Client** — responsiveness, offline, device access, UI state.",
          "**Server** — trust, consistency, heavy compute, cross-user.",
          "**Never trust client** — for security/authority.",
          "**Discuss the boundary** — it shapes the design.",
        ],
      },
      {
        t: "note",
        text: "Client: responsiveness, offline, device access, UI state, optimistic updates, caching. Server: authoritative data, enforced business rules, ranking/fan-out, secrets, cross-user coordination. Never trust the client for security/authority (validate server-side); push heavy/shared logic server-side, keep the client thin but responsive. Discuss this boundary explicitly — it shapes the whole design.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you design the client architecture (layers) in your answer?",
    a: [
      {
        t: "p",
        text: "Present a *layered* architecture: *UI* (Compose/SwiftUI, stateless, renders state), *presentation* (ViewModel/state holder exposing UI state via StateFlow, handling events), *domain* (use-cases/business logic, optional), *data* (repositories as the single source of truth, coordinating remote + local), and *data sources* (network client, local DB/cache). Data flows *up* (sources → repository → VM → UI as state) and events flow *down*. Mention *unidirectional data flow* and *dependency inversion* (depend on interfaces). This shows you can structure a maintainable, testable app — expected at senior level.",
      },
      {
        t: "list",
        items: [
          "**UI** — stateless, renders state.",
          "**Presentation** — ViewModel/state holder (StateFlow).",
          "**Domain** — use-cases (optional).",
          "**Data** — repository (SSOT) + network/local sources.",
        ],
      },
      {
        t: "note",
        text: "Present layers: UI (Compose/SwiftUI, stateless, renders state), presentation (ViewModel exposing StateFlow, handling events), domain (use-cases, optional), data (repository as SSOT coordinating remote+local), data sources (network, local DB). Data flows up as state, events down (UDF); depend on interfaces (dependency inversion). Shows maintainable, testable structure — expected at senior level.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you address caching in a mobile system design?",
    a: [
      {
        t: "p",
        text: "Discuss a *cache hierarchy*: in-memory (fast, small, lost on process death), disk/DB (persistent — Room/SQLDelight or file cache), and network with HTTP caching. Choose a *strategy*: cache-first (offline-friendly, may be stale), network-first (fresh, needs network), or stale-while-revalidate (show cache instantly, refresh in background — often best UX). Define *invalidation* (TTL, ETags/versioning, manual on write) and make the *repository* the single source of truth that decides when to serve cache vs fetch. Caching is central to mobile performance/offline — always cover it.",
      },
      {
        t: "list",
        items: [
          "**Hierarchy** — memory → disk/DB → network.",
          "**Strategy** — cache-first / network-first / stale-while-revalidate.",
          "**Invalidation** — TTL, ETags, on-write.",
          "**Repository** — SSOT deciding cache vs fetch.",
        ],
      },
      {
        t: "note",
        text: "Caching: a hierarchy (memory → disk/DB → network) with a strategy (cache-first for offline, network-first for fresh, stale-while-revalidate for best UX — show cache, refresh in background). Define invalidation (TTL, ETags/versioning, on-write) and make the repository the SSOT deciding cache vs fetch. Central to mobile performance/offline — always cover it.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle pagination in a design?",
    a: [
      {
        t: "p",
        text: "Prefer *cursor/keyset* pagination (the server returns a cursor/token for the next page) over *offset* pagination — cursors are stable under inserts/deletes and efficient, while offset can skip/duplicate items and gets slow. On the client, use a paging library (Paging 3 on Android) to load pages on scroll, show loading/error/empty states, and optionally *cache pages* for offline. Discuss *page size* (balance requests vs payload), *prefetch distance* (load before the user hits the end), and *deduplication*. Pagination is fundamental for feeds/lists — show you know cursor > offset.",
      },
      {
        t: "list",
        items: [
          "**Cursor/keyset** — stable, efficient (over offset).",
          "**Paging library** — load on scroll, states, cache.",
          "**Tune** — page size, prefetch distance, dedup.",
          "**Cursor > offset** — under inserts/deletes.",
        ],
      },
      {
        t: "note",
        text: "Pagination: prefer cursor/keyset (server returns a next-page token) over offset (which skips/duplicates on inserts and slows). Client: a paging library (Paging 3) loading on scroll with loading/error/empty states, optionally caching pages offline. Tune page size, prefetch distance, dedup. Fundamental for feeds — show you know cursor > offset.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle real-time updates in a mobile design?",
    a: [
      {
        t: "p",
        text: "Match the *transport* to the need: *WebSockets* for bidirectional low-latency (chat, live collaboration), *SSE/long-polling* for server→client streams, *FCM push* for background/occasional updates (and to wake the app), and *periodic polling* for simple, non-urgent freshness. Discuss *connection management* (reconnect with backoff, heartbeats, lifecycle — disconnect when backgrounded), *battery/data* cost of persistent connections, and *treating push as a signal* to fetch authoritative data. Pick the lightest transport that meets latency needs, and handle offline/reconnection gracefully.",
      },
      {
        t: "list",
        items: [
          "**WebSockets** — bidirectional low-latency (chat).",
          "**SSE/long-poll** — server→client streams.",
          "**FCM push** — background/occasional; wake the app.",
          "**Polling** — simple non-urgent; manage connection/battery.",
        ],
      },
      {
        t: "note",
        text: "Real-time transport by need: WebSockets (bidirectional low-latency — chat), SSE/long-polling (server→client streams), FCM push (background/occasional, wake the app), polling (simple non-urgent). Manage connections (reconnect+backoff, heartbeats, disconnect when backgrounded), battery/data cost, and treat push as a signal to fetch authoritative data. Pick the lightest transport meeting latency; handle reconnection.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle error states and edge cases in a design?",
    a: [
      {
        t: "p",
        text: "Explicitly model *loading, success, empty, and error* states (a sealed UI state), and design the UI for each — don't just draw the happy path. Handle *network errors* (retry with backoff, offline messaging, cached fallback), *partial failures*, *empty results*, *slow networks* (skeletons/placeholders), and *auth expiry* (refresh/re-login). Discuss *user-facing* handling (clear messages, retry affordances) and *silent recovery* where possible. Mentioning edge cases and error UX unprompted signals senior maturity — interviewers look for it.",
      },
      {
        t: "list",
        items: [
          "**Model states** — loading/success/empty/error.",
          "**Network errors** — retry/backoff, offline, cache fallback.",
          "**Edge cases** — empty, slow, partial, auth expiry.",
          "**UX** — clear messages + retry; signals maturity.",
        ],
      },
      {
        t: "note",
        text: "Model loading/success/empty/error as explicit UI states and design each (not just the happy path). Handle network errors (retry+backoff, offline messaging, cached fallback), partial failures, empty results, slow networks (skeletons), auth expiry (refresh/re-login), with clear user messages + retry. Raising edge cases and error UX unprompted signals senior maturity.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you address performance in a mobile system design?",
    a: [
      {
        t: "p",
        text: "Cover the four mobile performance axes: *rendering* (smooth scrolling — efficient lists, avoid main-thread work, image downsampling), *memory* (bounded caches, avoid leaks, right-sized bitmaps), *network* (batching, caching, pagination, compact payloads, avoiding over-fetching), and *battery* (minimize wakeups/radio use, defer/batch background work, respect Doze). Tie each to the specific design (e.g. a feed → list recycling + image cache + paginated compact API). Also mention *startup* time and *perceived* performance (skeletons, optimistic UI). Performance is a core differentiator for mobile — address it concretely, not generically.",
      },
      {
        t: "list",
        items: [
          "**Rendering** — efficient lists, off-main work, downsampling.",
          "**Memory** — bounded caches, no leaks, right-sized images.",
          "**Network** — batch, cache, paginate, compact payloads.",
          "**Battery** — minimize wakeups, defer/batch, respect Doze.",
        ],
      },
      {
        t: "note",
        text: "Address four axes: rendering (efficient lists, off-main work, image downsampling), memory (bounded caches, no leaks, right-sized bitmaps), network (batch, cache, paginate, compact payloads, no over-fetch), battery (minimize wakeups/radio, defer/batch, respect Doze). Tie each to the design; mention startup and perceived performance (skeletons, optimistic UI). Address concretely, not generically.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you address security in a mobile system design?",
    a: [
      {
        t: "p",
        text: "Cover: *authentication* (token-based — short-lived access + refresh tokens), *secure token storage* (Keystore/Keychain / EncryptedSharedPreferences, never plaintext), *transport security* (HTTPS/TLS, optionally certificate pinning for sensitive apps), *not embedding secrets* in the app (they're extractable — keep server-side), *server-side authorization* (never trust the client), *data-at-rest encryption* for sensitive local data, and *privacy/consent* (minimal data, PII handling). Match rigor to sensitivity (a banking app pins certs and encrypts; a casual app less so). Raising security unprompted shows senior awareness.",
      },
      {
        t: "list",
        items: [
          "**Auth** — access + refresh tokens.",
          "**Storage** — Keystore/Keychain; no plaintext/embedded secrets.",
          "**Transport** — HTTPS/TLS, cert pinning if sensitive.",
          "**Server-side authz** — never trust the client; encrypt sensitive data.",
        ],
      },
      {
        t: "note",
        text: "Security: token auth (short access + refresh), secure token storage (Keystore/Keychain, never plaintext), HTTPS/TLS (+ cert pinning if sensitive), no embedded secrets (extractable — server-side), server-side authorization (never trust client), encrypt sensitive local data, privacy/consent (minimal PII). Match rigor to sensitivity. Raising security unprompted shows senior awareness.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you discuss trade-offs effectively?",
    a: [
      {
        t: "p",
        text: "For each significant decision, *state the options, name the trade-off, and justify your choice for this context* — e.g. 'WebSocket gives lower latency but costs battery and connection complexity; for a chat app the latency wins, so I'd use it, disconnecting when backgrounded.' Avoid absolutes ('always X'); show you understand *why* and *when*. Acknowledge what your choice *costs* and how you'd mitigate it. This is the core of senior signal: engineering is trade-offs, and interviewers reward *reasoned* decisions over memorized 'best' answers.",
      },
      {
        t: "list",
        items: [
          "**Options + trade-off + justified choice** — per decision.",
          "**Context-specific** — why and when, not absolutes.",
          "**Acknowledge cost** — and mitigation.",
          "**Core senior signal** — reasoned over memorized.",
        ],
      },
      {
        t: "note",
        text: "For each significant decision: state the options, name the trade-off, justify your choice for this context (e.g. 'WebSocket = lower latency but battery/complexity; chat wins on latency, so use it, disconnect when backgrounded'). Avoid absolutes; show why/when and acknowledge the cost + mitigation. Engineering is trade-offs — interviewers reward reasoned decisions over memorized 'best' answers.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you design the API contract in a mobile system design?",
    a: [
      {
        t: "p",
        text: "Define the *client-server contract*: endpoints (REST resources or GraphQL queries), request/response *shapes* (DTOs), *pagination* (cursors), *error* format, and *auth* (token headers). Design APIs to be *mobile-friendly*: return *exactly what the screen needs* (avoid over/under-fetching — a reason GraphQL or BFF/aggregation endpoints help), keep payloads *compact*, support *conditional requests* (ETags) for caching, and *batch* where possible to reduce round-trips on mobile networks. Discuss versioning for backward compatibility with old app versions. A well-shaped API drives client simplicity and performance.",
      },
      {
        t: "list",
        items: [
          "**Contract** — endpoints, DTOs, pagination, errors, auth.",
          "**Mobile-friendly** — screen-shaped payloads, compact.",
          "**Efficiency** — ETags, batching, fewer round-trips.",
          "**Versioning** — backward compat with old apps.",
        ],
      },
      {
        t: "note",
        text: "Define the API contract: endpoints (REST/GraphQL), request/response DTOs, cursor pagination, error format, token auth. Make it mobile-friendly: return exactly what the screen needs (avoid over/under-fetch — GraphQL/BFF helps), compact payloads, ETags for caching, batch to cut round-trips. Version for backward compatibility with old app versions. A well-shaped API drives client simplicity and performance.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle offline support when it's a requirement?",
    a: [
      {
        t: "p",
        text: "Design *offline-first*: a *local database* (Room/SQLDelight) as the *single source of truth* the UI reads from, so the app works without network. *Reads* come from local (synced in background). *Writes* are applied *locally first* (optimistic) and *queued* for sync (via WorkManager) with retry. On reconnect, sync *pushes queued changes* and *pulls updates*, resolving *conflicts* (last-write-wins, versioning, or merge). Show pending/sync UI state. This is a whole sub-design — mention the SSOT-local pattern, the outbox/queue, and conflict strategy. Offline-first is a common senior deep-dive.",
      },
      {
        t: "list",
        items: [
          "**Local DB as SSOT** — UI reads local; works offline.",
          "**Writes** — optimistic local + queued sync (WorkManager).",
          "**Reconnect** — push queued, pull updates.",
          "**Conflicts** — LWW/versioning/merge; show sync state.",
        ],
      },
      {
        t: "note",
        text: "Offline-first: a local DB (Room/SQLDelight) as SSOT the UI reads from (works offline). Reads from local (background-synced); writes applied locally (optimistic) and queued (outbox) for sync via WorkManager with retry. On reconnect, push queued changes + pull updates, resolving conflicts (LWW/versioning/merge). Show pending/sync state. A common senior deep-dive — mention SSOT-local, outbox, conflict strategy.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you manage time and scope in a 45-minute interview?",
    a: [
      {
        t: "p",
        text: "Budget roughly: ~5 min *requirements/scope*, ~10 min *high-level architecture + data/API*, ~20+ min *deep-dives* on the 1–2 hardest parts (the interviewer will steer), ~5 min *wrap-up* (trade-offs, what you'd improve). Don't over-invest in the easy parts (basic CRUD) — get a working high-level design fast, then *go deep where the challenge is* (offline sync, real-time, feed ranking). Watch the clock, check in with the interviewer on where to focus, and don't get stuck perfecting one corner. Breadth first, then depth where it counts.",
      },
      {
        t: "list",
        items: [
          "**~5 min** — requirements/scope.",
          "**~10 min** — architecture + data/API.",
          "**~20+ min** — deep-dive the hard parts.",
          "**~5 min** — wrap-up; breadth first, depth where it counts.",
        ],
      },
      {
        t: "note",
        text: "Budget: ~5 min requirements/scope, ~10 min high-level architecture + data/API, ~20+ min deep-dives on the 1-2 hardest parts (interviewer steers), ~5 min wrap-up (trade-offs, improvements). Don't over-invest in easy CRUD — get a working high-level design fast, then go deep where the challenge is. Watch the clock, check focus, don't perfect one corner. Breadth first, then depth.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle the interviewer changing or adding requirements mid-way?",
    a: [
      {
        t: "p",
        text: "Treat it as expected — interviewers add constraints to *probe your adaptability* (e.g. 'now it must work offline', 'now scale to 10M users', 'now support real-time'). Respond by *revisiting the affected part of your design*, explaining *what changes and why*, and *how your architecture accommodates it* (a clean layered design usually adapts well — that's a payoff of good structure). Stay calm, don't scrap everything, and show you can *evolve* a design. Acknowledge new trade-offs the change introduces. Graceful adaptation is a strong senior signal.",
      },
      {
        t: "list",
        items: [
          "**Expected** — probes adaptability.",
          "**Revisit** — the affected part; explain what/why changes.",
          "**Show** — the architecture accommodates it.",
          "**Adapt gracefully** — don't scrap; new trade-offs acknowledged.",
        ],
      },
      {
        t: "note",
        text: "Requirement changes are expected — they probe adaptability ('now offline', 'now 10M users', 'now real-time'). Revisit the affected part, explain what changes and why, and how your architecture accommodates it (clean layering adapts well — a payoff of good structure). Stay calm, don't scrap everything, evolve the design, acknowledge new trade-offs. Graceful adaptation is a strong senior signal.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are common mistakes candidates make in mobile system design?",
    a: [
      {
        t: "p",
        text: "Common pitfalls: *jumping to code/details* before clarifying requirements; designing *only the happy path* (ignoring offline/errors/edge cases); *ignoring mobile-specific concerns* (memory, battery, network variability, lifecycle) and answering like a backend question; being *vague* ('I'll use a cache') without specifics; *over-engineering* for scale that wasn't asked; *not managing time* (stuck on one part); and *not communicating* (silent thinking, no structure). Avoid these by clarifying first, structuring your answer, covering mobile concerns, and narrating your reasoning and trade-offs.",
      },
      {
        t: "list",
        items: [
          "**Skipping requirements** — jumping to details.",
          "**Happy-path only** — ignoring offline/errors.",
          "**Ignoring mobile concerns** — memory/battery/lifecycle.",
          "**Vague / over-engineered / poor time & communication.**",
        ],
      },
      {
        t: "note",
        text: "Common mistakes: jumping to details before clarifying, designing only the happy path (ignoring offline/errors), ignoring mobile concerns (memory/battery/network/lifecycle) like it's a backend question, being vague ('I'll use a cache'), over-engineering for unasked scale, poor time management, and not communicating (silent, unstructured). Fix: clarify first, structure, cover mobile concerns, narrate reasoning + trade-offs.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle push notifications in a design?",
    a: [
      {
        t: "p",
        text: "Use *FCM* (and APNs on iOS) to deliver notifications from your server. Discuss: *token management* (register, store per-user server-side, handle rotation), *message types* (notification vs data — data for silent sync, notification for display), *priority* (high for urgent, matched to Doze behavior), *deep-linking* on tap to the right screen, and *treating push as best-effort* (a wake-up/signal, with the app fetching authoritative data — never rely on the payload for critical data). Cover *permission* (Android 13+ POST_NOTIFICATIONS) and *reliability* (dedupe, reconcile on open). Push is a common component in feed/chat designs.",
      },
      {
        t: "list",
        items: [
          "**FCM/APNs** — server-sent; token management.",
          "**Types** — data (silent sync) vs notification (display).",
          "**Deep-link on tap** — best-effort, fetch authoritative data.",
          "**Permission + reliability** — POST_NOTIFICATIONS, dedupe/reconcile.",
        ],
      },
      {
        t: "note",
        text: "Push: FCM (+APNs) from your server, with token management (store per-user, handle rotation), message types (data for silent sync, notification for display), priority matched to Doze, deep-link on tap, and treating push as best-effort (wake-up signal — fetch authoritative data, don't rely on payload for critical data). Cover POST_NOTIFICATIONS (Android 13+) and reliability (dedupe, reconcile on open).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you address testing and observability in a design?",
    a: [
      {
        t: "p",
        text: "Mention how you'd *validate and monitor* the system: a *testing strategy* (unit tests for logic/ViewModels/repositories with fakes, integration tests for the data layer, UI tests for critical flows — favoring the fast base of the pyramid), and *observability* (crash reporting via Crashlytics, analytics for behavior/funnels, performance monitoring for startup/jank, and logging). Note *feature flags* for safe rollout and *A/B testing*. Designing for testability (clean layers, DI, interfaces) and production visibility signals senior thinking beyond just the happy-path architecture.",
      },
      {
        t: "list",
        items: [
          "**Testing** — unit (logic/VM/repo), integration, UI; pyramid.",
          "**Observability** — crash, analytics, performance, logs.",
          "**Rollout** — feature flags, A/B testing.",
          "**Design for testability** — clean layers, DI.",
        ],
      },
      {
        t: "note",
        text: "Cover testing (unit for logic/VM/repo with fakes, integration for data layer, UI for critical flows — pyramid) and observability (Crashlytics, analytics/funnels, performance monitoring for startup/jank, logging), plus feature flags and A/B testing for safe rollout. Designing for testability (clean layers, DI, interfaces) and production visibility signals senior thinking beyond happy-path architecture.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you address accessibility and localization in a design?",
    a: [
      {
        t: "p",
        text: "Briefly note them as first-class concerns: *accessibility* (content descriptions/labels for screen readers, sufficient touch targets and contrast, dynamic font scaling, semantic structure) and *localization* (externalized strings, RTL support, locale-aware dates/numbers/currency, and accounting for text expansion in layouts). Also consider *inclusive design* (works on low-end devices, poor networks). You don't need to deep-dive unless asked, but *mentioning* them shows you design for *all users*, not just the ideal case — a mark of thoughtful, senior engineering.",
      },
      {
        t: "list",
        items: [
          "**Accessibility** — labels, contrast, touch targets, font scaling.",
          "**Localization** — externalized strings, RTL, locale formatting.",
          "**Inclusive** — low-end devices, poor networks.",
          "**Mention** — designs for all users.",
        ],
      },
      {
        t: "note",
        text: "Note accessibility (screen-reader labels, contrast, touch targets, dynamic font scaling, semantics) and localization (externalized strings, RTL, locale-aware dates/numbers, text-expansion-tolerant layouts), plus inclusive design (low-end devices, poor networks). No deep-dive needed unless asked, but mentioning them shows you design for all users — a mark of thoughtful senior engineering.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you decide what to deep-dive when the interviewer leaves it open?",
    a: [
      {
        t: "p",
        text: "Pick the *most interesting/hardest* part of *this* system — the component with real complexity or trade-offs, not the boilerplate. For a chat app, deep-dive *message reliability/ordering/real-time*; for a feed, *pagination/caching/ranking display*; for an offline app, *sync/conflict resolution*; for an image library, *caching/memory/cancellation*. *Propose* the deep-dive ('the interesting part here is offline sync — shall I go deep there?') so you show judgment and let the interviewer steer. Choosing the substantive challenge (not the easy CRUD) demonstrates you know where the engineering difficulty lies.",
      },
      {
        t: "list",
        items: [
          "**Pick the hardest part** — real complexity/trade-offs.",
          "**Chat → reliability; feed → paging/caching; offline → sync.**",
          "**Propose it** — let the interviewer steer.",
          "**Signals** — you know where difficulty lies.",
        ],
      },
      {
        t: "note",
        text: "Deep-dive the hardest/most interesting part of this system (real complexity, not boilerplate): chat → message reliability/ordering/real-time; feed → pagination/caching/ranking; offline → sync/conflicts; image lib → caching/memory/cancellation. Propose it ('the interesting part is offline sync — go deep?') to show judgment and let the interviewer steer. Choosing the substantive challenge shows you know where difficulty lies.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you communicate and drive the interview well?",
    a: [
      {
        t: "p",
        text: "*Think out loud* (narrate your reasoning so the interviewer follows), *state structure upfront* ('I'll cover requirements, architecture, data, then deep-dive X'), *use a diagram* (boxes for layers/components, arrows for data flow), *check in* ('does this scope sound right?', 'want me to go deeper on caching?'), and *manage the conversation* rather than waiting to be prompted. Be collaborative — treat it as designing *with* the interviewer. Clear communication and driving the discussion are as important as the technical content; a great design poorly communicated scores lower.",
      },
      {
        t: "list",
        items: [
          "**Think out loud** — narrate reasoning.",
          "**Structure upfront** — + a layered diagram.",
          "**Check in** — scope and depth with the interviewer.",
          "**Drive collaboratively** — communication ≈ as important as content.",
        ],
      },
      {
        t: "note",
        text: "Communicate well: think out loud (narrate reasoning), state structure upfront ('requirements → architecture → data → deep-dive X'), draw a diagram (layers + data-flow arrows), check in on scope/depth, and drive the conversation rather than waiting. Be collaborative — design with the interviewer. Communication and driving are as important as the technical content; a great design poorly communicated scores lower.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you show senior-level judgment beyond just a correct design?",
    a: [
      {
        t: "p",
        text: "Signal seniority by: *proactively* raising non-functional concerns (offline, performance, security, accessibility) without being asked; *reasoning about trade-offs* with context; *acknowledging limitations* of your choices and how you'd mitigate/evolve them; considering *the whole lifecycle* (testing, rollout, monitoring, versioning, backward compat); *scoping pragmatically* (not over-engineering); and *prioritizing* what matters for *this* product. Show you think about *real-world* concerns (low-end devices, flaky networks, app updates, team maintainability) — not just a diagram. Judgment, not just knowledge, distinguishes senior candidates.",
      },
      {
        t: "list",
        items: [
          "**Proactive** — non-functional concerns unprompted.",
          "**Trade-offs + limitations** — with mitigation.",
          "**Whole lifecycle** — testing, rollout, monitoring, versioning.",
          "**Pragmatic scoping** — real-world concerns; judgment over knowledge.",
        ],
      },
      {
        t: "note",
        text: "Show senior judgment: proactively raise non-functional concerns (offline/performance/security/accessibility), reason about trade-offs in context, acknowledge your choices' limits + mitigation, consider the whole lifecycle (testing/rollout/monitoring/versioning/backward-compat), scope pragmatically (no over-engineering), and prioritize for this product. Think real-world (low-end devices, flaky networks, updates, maintainability) — judgment, not just knowledge, distinguishes seniors.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you address analytics and instrumentation in a design?",
    a: [
      {
        t: "p",
        text: "Note that you'd *instrument key events* (a consistent event taxonomy — screen views, feature usage, conversions) to measure behavior and drive product decisions, plus *funnels* for critical flows (onboarding, checkout) to find drop-off. Discuss *what* to track (purposeful events, no PII), *privacy/consent* handling, and *how it informs* iteration (A/B testing tied to metrics). Also mention *performance/quality telemetry* (startup, jank, crash-free) so you know the system's health in production. Instrumentation turns the design into something you can *measure and improve* — a senior-level completeness point.",
      },
      {
        t: "list",
        items: [
          "**Instrument** — consistent events (usage, conversions).",
          "**Funnels** — find drop-off in key flows.",
          "**Privacy** — purposeful events, no PII, consent.",
          "**Quality telemetry** — startup/jank/crash-free; measure to improve.",
        ],
      },
      {
        t: "note",
        text: "Analytics: instrument key events (consistent taxonomy — usage/conversions), funnels for critical flows (find drop-off), with privacy/consent (purposeful events, no PII), tied to A/B testing for iteration. Add quality telemetry (startup, jank, crash-free) for production health. Instrumentation makes the design measurable and improvable — a senior completeness point.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle scale on the client side of a mobile system?",
    a: [
      {
        t: "p",
        text: "Client 'scale' isn't request-per-second — it's handling *large data and diverse devices* gracefully: *paginate/virtualize* large lists (never load everything), *bound* caches and memory (LRU, right-sized images), keep the UI responsive under *large datasets* (efficient diffing, off-main work), degrade gracefully on *low-end devices and poor networks*, and keep *app size/startup* in check as features grow. Server-side scale (fan-out, sharding, CDNs for media) is worth *mentioning* but keep the focus on the *client* in a mobile interview. Scaling the client is about efficiency and graceful degradation, not throughput.",
      },
      {
        t: "list",
        items: [
          "**Large data** — paginate/virtualize; never load all.",
          "**Bounded** — caches/memory (LRU, right-sized images).",
          "**Degrade gracefully** — low-end devices, poor networks.",
          "**Mention server scale** — but focus on the client.",
        ],
      },
      {
        t: "note",
        text: "Client scale = handling large data + diverse devices gracefully: paginate/virtualize large lists (never load all), bound caches/memory (LRU, right-sized images), keep UI responsive under large datasets (efficient diffing, off-main), degrade on low-end/poor-network, watch app size/startup. Mention server scale (fan-out/sharding/CDN) but focus on the client. It's efficiency + graceful degradation, not throughput.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you start drawing the high-level design?",
    a: [
      {
        t: "p",
        text: "After requirements, sketch a *simple box diagram*: the *client* (with its internal layers — UI, ViewModel, repository, local DB, network), the *backend* (API/gateway, services, database — kept lightweight since it's a *mobile* interview), and the *data flow arrows* between them (and any real-time/push channels). Start *high-level and coarse*, get agreement, then *zoom into* the parts that matter. Don't start with low-level detail. The diagram anchors the discussion and gives you a structure to deep-dive from. Keep the backend abstract unless the question is backend-heavy.",
      },
      {
        t: "list",
        items: [
          "**Box diagram** — client layers + backend + data flow.",
          "**High-level first** — get agreement, then zoom in.",
          "**Backend lightweight** — it's a mobile interview.",
          "**Anchors** — the discussion; structure to deep-dive from.",
        ],
      },
      {
        t: "note",
        text: "After requirements, sketch a simple box diagram: the client with its layers (UI, ViewModel, repository, local DB, network), a lightweight backend (API/gateway, services, DB — it's a mobile interview), and data-flow arrows (+ real-time/push). Start high-level and coarse, get agreement, then zoom into what matters. The diagram anchors discussion and gives structure to deep-dive from. Keep backend abstract unless it's backend-heavy.",
      },
    ],
  },
];

export default qa;
