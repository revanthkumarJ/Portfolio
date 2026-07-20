// Firebase Auth & Databases — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is Firebase Authentication and what does it provide?",
    a: [
      {
        t: "p",
        text: "**Firebase Authentication provides ready-made user sign-in — it handles the complex, security-sensitive work of authenticating users so you don't build it yourself.** It supports many providers (email/password, phone via SMS, Google/Apple/Facebook OAuth, anonymous) and gives you a signed-in user with a stable identity and a token, without you implementing password hashing, OAuth flows, or SMS verification.",
      },
      {
        t: "list",
        items: [
          "**Providers** — you enable the sign-in methods you want (email/password, phone OTP, federated Google/Apple/etc., or anonymous accounts you can later upgrade), and Firebase handles each flow.",
          "**What you get** — a `FirebaseUser` with a unique UID (stable identity) and an *ID token* (a JWT) that your backend or Firebase services verify to authenticate requests.",
          "**Session management** — Firebase persists auth state (users stay signed in across launches) and refreshes tokens automatically; you observe auth state to react to sign-in/out.",
          "**Security handled for you** — password storage, OAuth token exchange, SMS verification, and token signing/verification are all managed by Firebase.",
        ],
      },
      {
        t: "p",
        text: "The main reason to use it is that *authentication is easy to get catastrophically wrong* — insecure password storage, flawed OAuth, token vulnerabilities. Firebase Auth is built and maintained by Google's security teams, so it's far more secure than most teams rolling their own, and it saves enormous effort (OAuth flows and SMS verification alone are significant work). You get robust, multi-provider auth by configuring it rather than building it — which is why it's one of the commonly-adopted Firebase services even for apps that use a custom backend for everything else (they use Firebase Auth's token to authenticate to their own backend).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between Firestore and Realtime Database?",
    a: [
      {
        t: "p",
        text: "**Both are Firebase's cloud NoSQL databases with real-time sync and offline support, but Firestore is the newer, more capable one and the recommended default for new apps; Realtime Database is the older, simpler option.** The main differences are the data model, query capabilities, and scaling.",
      },
      {
        t: "list",
        items: [
          "**Data model** — Realtime Database stores everything as *one big JSON tree*; Firestore uses *collections of documents* (a more structured model with nested sub-collections), which is easier to organize and scale.",
          "**Queries** — Firestore has *richer* querying (compound queries, better indexing); Realtime Database's queries are more *limited* (basic filtering/sorting).",
          "**Scaling** — Firestore scales better and supports multi-region; Realtime Database is single-region and less scalable.",
          "**Pricing** — Realtime DB bills by bandwidth + storage; Firestore bills by *document reads/writes* + storage (so query patterns affect cost differently).",
        ],
      },
      {
        t: "p",
        text: "Both share the core Firebase database strengths: *real-time sync* (you listen to data and get live updates when it changes anywhere — no polling, great for chat/collaboration) and *offline support* (the SDK caches locally and syncs when back online). For new apps, **use Firestore** unless you have a specific reason for RTDB (like very simple real-time state or presence, where RTDB's simplicity or lower latency for tiny frequent updates can fit). Both are secured by server-side *Security Rules* — since clients talk to the database directly, those rules are your security boundary, and getting them right (not overly permissive) is critical.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are Firebase Security Rules and why do they matter?",
    a: [
      {
        t: "p",
        text: "**Firebase Security Rules are server-side, declarative access-control rules that define who can read or write what data in Firestore/Realtime Database/Storage, based on the authenticated user and the data itself. They matter because clients talk to the database *directly* — so these rules are the *only* thing standing between a malicious client and your data. They're your security boundary.**",
      },
      {
        t: "list",
        items: [
          "**Why they're essential**: in the Firebase/BaaS model, there's no server-side API layer enforcing access — the client SDK reads/writes the database directly. So access control *must* live in Security Rules, enforced by Firebase's servers. Without proper rules, any client could read or write any data.",
          "**What they express**: rules like 'a user can only read/write documents where the document's `ownerId` matches their auth UID', or 'only authenticated users can read this collection', or validation ('a message must have a non-empty body and a valid timestamp'). They combine *auth* state and *data* conditions.",
          "**The common mistake**: overly permissive rules (e.g. `allow read, write: if true` left from a prototype, or `if request.auth != null` when finer control is needed) that expose or allow tampering with data. Firebase even warns about test-mode rules that expire.",
        ],
      },
      {
        t: "p",
        text: "The key insight is that in a direct-client-to-database architecture, security *cannot* be in the client (which an attacker controls) — it must be in the server-enforced Security Rules. So writing correct, restrictive rules is not optional polish; it's the core of securing a Firebase app. This is a genuine tradeoff of the BaaS model versus a custom backend (where the server API enforces access): the convenience of no backend comes with the responsibility of getting Security Rules right, which requires care and testing (Firebase provides a rules simulator and emulator for this). A Firebase data breach is almost always a Security Rules failure.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is Backend-as-a-Service (BaaS), and what are the tradeoffs of Firestore versus a custom backend?",
    a: [
      {
        t: "p",
        text: "**Backend-as-a-Service (BaaS) means the client talks *directly* to a managed database (Firestore/RTDB), secured by Security Rules, with *no server API layer* you write in between (though Cloud Functions can add server logic). This is architecturally different from a traditional custom backend (your server + API in front of a database), and the tradeoff is *speed and simplicity* versus *control, query power, and cost predictability*.**",
      },
      {
        t: "list",
        items: [
          "**BaaS pros — speed and built-in capabilities**: you build extremely fast because there's *no backend to write or operate* — no API, no server infrastructure, no ops. Real-time sync and offline support come *built in* (huge for collaborative/real-time apps — building a reliable sync+offline layer yourself is a major undertaking). It scales without you managing servers. For MVPs, small teams, and real-time apps, this is enormous leverage — you ship features instead of building and running infrastructure.",
          "**BaaS con — limited queries**: Firestore is NoSQL, so you *lose* SQL's power — no complex joins, no aggregations, restricted compound queries, and you often must *denormalize* data (duplicate it across documents) to support your read patterns. Data modeling is driven by *how you'll query* (design for reads), which is a different discipline than relational modeling. Apps with complex relational data or ad-hoc querying needs chafe against this.",
          "**BaaS con — cost at scale**: Firestore bills *per document read/write*, so a design that's cheap at small scale can get expensive at large scale — e.g. a feed that reads many documents per user per session, or listeners that re-read data, can rack up costs. You must design *cost-consciously* (denormalization, pagination, careful listeners), and at very large scale a custom backend with a database you control may be cheaper.",
          "**BaaS con — business logic placement**: with no server layer, business logic goes in the *client* (visible to and modifiable by attackers — bad for sensitive logic) or in *Cloud Functions* (serverless, but a different model than a traditional backend). Security-sensitive logic *must* be in Security Rules + Functions, not the client.",
          "**BaaS con — vendor lock-in**: your data model and access patterns become coupled to Firestore; migrating off is costly.",
        ],
      },
      {
        t: "list",
        items: [
          "**When to choose BaaS (Firestore)**: real-time/collaborative features (chat, shared docs, live updates), MVPs and prototypes, standard CRUD apps where speed matters and query needs are simple, and small teams without backend expertise. The built-in real-time+offline is often the deciding factor.",
          "**When to prefer a custom backend**: complex relational data and rich/ad-hoc queries (where SQL shines), heavy server-side business logic, specific compliance/data-residency requirements, or predictable cost/control at large scale.",
          "**Hybrid is very common and often the right answer**: use Firebase for what it's great at (Auth, push, crashes, analytics, and maybe a real-time feature or two) and a *custom backend* for the *core* data and business logic. You're not forced to go all-in — many production apps use Firebase Auth + a custom backend, or Firestore for one real-time feature alongside a traditional API for the rest.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: BaaS inverts the traditional architecture — instead of client → your API → database, it's client → (Security Rules) → managed database. This trades away the *control point* of a server API (rich queries, business logic, cost control, flexibility) for *speed* (no backend to build/run) and *built-in real-time + offline sync* (genuinely hard to build yourself). The decision hinges on your *query complexity*, *scale/cost trajectory*, *business-logic needs*, and *how much real-time/offline matters* — Firestore wins decisively for real-time/collaborative MVPs with simple queries, while relational-heavy, logic-heavy, or cost-sensitive-at-scale apps favor a custom backend. The mature view rejects the all-or-nothing framing: it's a *per-concern* choice, and hybrids (Firebase for auth/push/observability/real-time, custom backend for core data) are common and sensible. Understanding the architectural inversion (no server layer → security in Rules, logic in client/Functions), the specific tradeoffs (query power, cost model, lock-in, real-time/offline benefit), and the differentiated/hybrid decision approach — rather than 'Firestore is great' or 'always build your own' — is the comprehensive senior answer, and it mirrors the general Firebase buy-vs-build tradeoff applied specifically to the data layer.",
      },
    ],
  },
  {
    level: "senior",
    q: "How would you design data in Firestore for a social feed, and what would you watch out for?",
    a: [
      {
        t: "p",
        text: "**I'd design the data model *around the read patterns* (denormalizing as needed), because Firestore is NoSQL with limited queries and per-read billing — so the goal is to make the feed cheap and fast to *read*, accepting duplication and write-time work as the cost. Key concerns: denormalization for read efficiency, the fan-out-on-write vs fan-out-on-read tradeoff, avoiding expensive queries, pagination, and Security Rules.**",
      },
      {
        t: "list",
        items: [
          "**Design for reads, not normalization**: unlike SQL where you normalize and join at read time, Firestore has no joins and bills per document read — so you *denormalize*. For a post displayed in a feed, embed the data needed to render it (author name, avatar URL, post text, counts) *in the feed document itself*, so rendering the feed reads *one document per item* rather than reading the post *and* joining to the author *and* to counts. Duplication is the accepted cost of cheap reads.",
          "**The fan-out decision — the core social-feed tradeoff**: how does a user's feed get populated? *Fan-out on write* — when someone posts, *write a copy of that post into each follower's feed collection* (so reading a feed is a simple, cheap query of one collection, but a post by a user with millions of followers triggers millions of writes). *Fan-out on read* — store posts once, and *build the feed by querying the posts of everyone the user follows at read time* (cheap writes, but expensive/complex reads, and Firestore's query limits make 'posts from these 1000 people, sorted by time' hard). Most large social feeds use *fan-out on write* (often via Cloud Functions triggered on a new post) because reads vastly outnumber writes and reads must be fast/cheap — accepting the write amplification and using strategies for celebrity accounts (hybrid: fan-out for normal users, fan-out-on-read for high-follower accounts).",
          "**Avoid expensive query patterns**: Firestore can't do many things efficiently — no 'count all', limited compound queries, no full-text search (use a dedicated service like Algolia for search). Design so the feed is a *simple ordered query with pagination* (`orderBy(timestamp).limit(20)` with cursor-based paging via `startAfter`), not a complex query. Store aggregates (like counts) as *maintained fields* (updated on write, or via Functions/distributed counters) rather than computing them at read time.",
          "**Watch listener costs**: real-time listeners re-read documents on changes and bill accordingly — a feed with live listeners on many documents can be costly. Use listeners judiciously (maybe on the visible window), and prefer paginated one-time reads with pull-to-refresh where real-time isn't essential.",
          "**Security Rules**: since clients read/write directly, rules must enforce that users can only write their *own* posts, can only read feeds they're allowed to, can't tamper with counts/denormalized fields (those should be written by Cloud Functions, not clients — rules can restrict who writes them), etc. The denormalized/aggregate fields especially need protection so a client can't forge a like count.",
          "**Offline and consistency**: Firestore's offline support means the feed works offline (cached), and writes queue — good UX. But denormalized data raises *consistency* concerns: if an author changes their name, all the copies of it embedded in feed items are stale until updated (a background job/Function must propagate the change, or you accept eventual/approximate consistency for such fields). This is the classic denormalization tradeoff — fast reads, but you own keeping copies in sync.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: designing Firestore for a feed is fundamentally about *inverting the relational instinct* — instead of normalizing and joining at read time (SQL), you *denormalize and design around read patterns* because Firestore has no joins, limited queries, and per-read billing, so cheap fast reads are the priority and duplication + write-time work are the accepted costs. The defining architectural decision is *fan-out on write vs read* (write copies into follower feeds for cheap reads, vs query-at-read for cheap writes) — usually fan-out-on-write via Cloud Functions for read-heavy feeds, with special handling for high-follower accounts. Around that, you paginate with cursors, maintain aggregates as fields (protected by rules/Functions, not client-computed), delegate search to a dedicated service, use listeners cost-consciously, and accept eventual consistency for denormalized fields (with propagation jobs). The pitfalls to watch — write amplification, listener/read costs, denormalization staleness, query limitations, and Security-Rules protection of derived fields — are exactly where naive Firestore feed designs fail at scale. Demonstrating the design-for-reads/denormalize mindset, the fan-out tradeoff, and the cost/consistency/security pitfalls is the comprehensive answer that shows you understand NoSQL data modeling and Firestore's specific constraints, not just the API.",
      },
    ],
  },
];

export default qa;
