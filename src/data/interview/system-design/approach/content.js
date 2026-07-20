// Approaching Mobile System Design — Content tab. Teaching-first.

const content = [
  {
    heading: "What a mobile system design interview tests",
    blocks: [
      {
        t: "p",
        text: "A **mobile system design interview** asks you to design a feature or app component (an image loader, a chat feature, an offline-sync system, a news feed) — testing whether you can make sound *architectural* decisions, handle *mobile-specific constraints* (unreliable network, limited memory/battery, lifecycle, offline), reason about *trade-offs*, and communicate a coherent design. Unlike backend system design (which centers on servers, databases, and scale), *mobile* system design centers on the *client*: data flow, caching, offline behavior, the UI/data layers, and the constraints of running on a device.",
      },
      {
        t: "list",
        items: [
          "**It's about judgment, not memorized answers** — there's rarely one 'right' design. The interviewer wants to see how you *think*: how you clarify requirements, decompose the problem, weigh options, and justify choices.",
          "**Mobile-specific focus** — the distinguishing concerns are *client-side*: caching strategies, offline-first behavior, network efficiency, memory/battery constraints, lifecycle handling, and the layered app architecture — not primarily server scaling (though the client↔server contract matters).",
          "**Communication is half the evaluation** — a great design poorly explained scores worse than a good design clearly communicated. Think aloud, structure your answer, and check in with the interviewer.",
        ],
      },
    ],
  },
  {
    heading: "A framework for answering",
    blocks: [
      {
        t: "p",
        text: "Have a *structured approach* so you don't ramble or miss key areas. A common, effective framework:",
      },
      {
        t: "list",
        items: [
          "**1. Clarify requirements & scope** — *don't start designing immediately*. Ask questions to define what you're building: functional requirements (what features?), non-functional (offline support? real-time? scale? which platforms?), and constraints. Nail down scope — 'design Instagram' is too broad; clarify to 'the photo feed with offline caching'. This step is critical and often where candidates fail (jumping in without understanding the problem).",
          "**2. Define the API / data contract** — what data does the client get from the server, and how? Sketch the key endpoints/models (or note it's given). This grounds the design in the actual data.",
          "**3. High-level architecture** — sketch the layers and data flow: UI (Compose/Views) → ViewModel/presentation → domain (use cases) → data (repository → local DB + network). Establish the *single source of truth* and how data flows. This is your architectural backbone.",
          "**4. Deep-dive the core components** — pick the *interesting* parts (the ones the question is really about — caching, offline sync, pagination, real-time) and design them in detail: data models, caching strategy, sync logic, error handling. This is where you show depth.",
          "**5. Address mobile concerns** — offline behavior, network efficiency, caching, memory/battery, lifecycle/process death, error/edge cases. These are the mobile-specific differentiators.",
          "**6. Discuss trade-offs & alternatives** — for key decisions, explain *why* you chose one approach over another (and when you'd choose differently). This demonstrates senior judgment.",
        ],
      },
    ],
  },
  {
    heading: "The mobile-specific concerns to always cover",
    blocks: [
      {
        t: "list",
        items: [
          "**Data flow & single source of truth** — where does data live authoritatively (usually a local DB), and how does it flow to the UI? The SSOT/offline-first pattern (UI observes the DB, network updates the DB) is the backbone of most mobile designs.",
          "**Caching strategy** — what's cached, where (memory/disk), how it's invalidated (TTL/ETag/events), and the read strategy (cache-then-network, etc.). Caching is central to mobile UX and a near-universal topic.",
          "**Offline support** — how the app behaves offline (serve cache), and how *offline writes* sync when back online (local-first + background sync + conflict resolution). Offline is *the* mobile differentiator.",
          "**Network efficiency** — minimizing requests and data (batching, pagination, delta sync, compression, image optimization), respecting the user's data plan and battery.",
          "**Memory & performance** — bounded memory (don't load everything — paginate, recycle, downsample images), avoiding jank/leaks, efficient rendering.",
          "**Lifecycle & reliability** — handling process death (persist state), configuration changes, background execution limits, and graceful error/retry handling.",
          "**Real-time (if relevant)** — WebSockets/push for live features, with connection management.",
        ],
      },
    ],
  },
  {
    heading: "How to communicate well",
    blocks: [
      {
        t: "list",
        items: [
          "**Think aloud and structure** — narrate your reasoning, and signal structure ('First I'll clarify requirements, then sketch the architecture, then deep-dive caching'). This makes you easy to follow and shows organized thinking.",
          "**Drive the conversation, but check in** — lead the design, but periodically confirm scope/priorities with the interviewer ('Should I focus on the offline sync or the real-time part?'). It's collaborative, not a monologue.",
          "**Draw diagrams** — a layered architecture diagram (UI → ViewModel → repository → DB/network) and data-flow arrows make your design concrete and easy to discuss. Use the whiteboard/tool.",
          "**Justify with trade-offs** — every significant choice should come with a 'because' and an acknowledgment of alternatives. 'I'd use a local DB as the source of truth *because* it gives offline support and consistency; the alternative — reading directly from the network — is simpler but breaks offline.' This is the senior signal.",
          "**Manage time & prioritize** — you can't design everything; spend time on the *core, interesting* parts (what the question is testing), and mention the rest briefly. Don't rabbit-hole on a minor detail.",
          "**Connect to real patterns** — ground your design in the established Android patterns (clean architecture, SSOT/offline-first, Room, WorkManager, Paging, Coil, coroutines/Flow) — you're not inventing from scratch; you're *applying* the toolkit appropriately.",
        ],
      },
      {
        t: "note",
        text: "Mobile system design tests architectural judgment, mobile-constraint handling (offline, network, memory, battery, lifecycle), trade-off reasoning, and communication. Framework: (1) clarify requirements/scope FIRST, (2) define the data contract, (3) high-level layered architecture + SSOT, (4) deep-dive core components, (5) address mobile concerns (caching, offline, network efficiency, memory, lifecycle), (6) discuss trade-offs. Always cover: SSOT/data flow, caching, offline (incl. writes/sync), network efficiency, memory, lifecycle/process death. Communicate: think aloud, structure, diagram, justify with trade-offs, prioritize the core, ground in real patterns.",
      },
    ],
  },
];

export default content;
