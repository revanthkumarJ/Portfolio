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
];

export default qa;
