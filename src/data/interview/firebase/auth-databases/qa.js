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
  {
    level: "senior",
    q: "How does Firebase Auth work under the hood (tokens)?",
    a: [
      {
        t: "p",
        text: "On sign-in, Firebase Auth issues the client a short-lived *ID token* (a signed JWT, ~1h expiry) containing the user's uid and claims, plus a long-lived *refresh token*. The SDK *auto-refreshes* the ID token before expiry. The ID token is what proves identity: *Security Rules* verify it automatically, and your *own backend* verifies it with the *Admin SDK* (`verifyIdToken`) to authenticate API calls. So the client holds tokens, the SDK refreshes them, and servers *validate the signature/claims* — never trusting a raw uid from the client.",
      },
      {
        t: "list",
        items: [
          "**ID token** — signed JWT (~1h), uid + claims.",
          "**Refresh token** — long-lived; SDK auto-refreshes.",
          "**Rules** — verify the token automatically.",
          "**Your backend** — Admin SDK `verifyIdToken`.",
        ],
      },
      {
        t: "note",
        text: "Firebase Auth issues a short-lived ID token (signed JWT, ~1h, uid + claims) + a long-lived refresh token; the SDK auto-refreshes. Security Rules verify the token automatically; your backend verifies it with the Admin SDK (verifyIdToken). Servers validate the signature/claims — never trust a raw uid from the client.",
      },
    ],
  },
  {
    level: "junior",
    q: "What sign-in methods does Firebase Auth support?",
    a: [
      {
        t: "p",
        text: "Email/password, phone (SMS OTP), and federated *identity providers*: Google, Apple, Facebook, Twitter/X, GitHub, plus generic OAuth/OIDC and SAML (enterprise). It also supports *anonymous* auth (a temporary account you can later *link* to a permanent method) and *custom auth* (mint a token from your own server via the Admin SDK for an existing auth system). *FirebaseUI* provides a drop-in flow. Choose methods by your audience; you can enable several and let users link them to one account.",
      },
      {
        t: "list",
        items: [
          "**Email/password, phone (OTP)** — basic methods.",
          "**Federated** — Google, Apple, Facebook, GitHub, OAuth/OIDC/SAML.",
          "**Anonymous** — temporary, linkable later.",
          "**Custom auth** — your own server via Admin SDK.",
        ],
      },
      {
        t: "note",
        text: "Firebase Auth supports email/password, phone (SMS OTP), federated providers (Google, Apple, Facebook, GitHub, generic OAuth/OIDC, SAML), anonymous auth (temporary, linkable to a permanent method), and custom auth (mint a token from your server via the Admin SDK). FirebaseUI offers a drop-in flow. Enable several and let users link them to one account.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is anonymous authentication, and when is it useful?",
    a: [
      {
        t: "p",
        text: "*Anonymous auth* creates a temporary account (a real uid) *without* the user signing up — so they can use the app and have data/state saved *before* committing to registration. Later you *link* the anonymous account to a permanent method (Google, email), *preserving their data* under the same uid. Useful for lowering the sign-up barrier (try before you register), cart/progress persistence, and per-device state. Caveat: anonymous accounts are lost on uninstall/clear-data if never linked — encourage linking to keep data.",
      },
      {
        t: "list",
        items: [
          "**Temporary account** — real uid, no sign-up.",
          "**Save state early** — before registration.",
          "**Link later** — to a permanent method, keep uid/data.",
          "**Caveat** — lost on uninstall if never linked.",
        ],
      },
      {
        t: "note",
        text: "Anonymous auth creates a temporary account (real uid) without sign-up, so users have saved state before registering; later link it to a permanent method (Google/email) preserving data under the same uid. Useful to lower the sign-up barrier and persist cart/progress. Caveat: unlinked anonymous accounts are lost on uninstall/clear-data — encourage linking.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do Firestore Security Rules actually work?",
    a: [
      {
        t: "p",
        text: "Security Rules are a *declarative* language evaluated *server-side* on every read/write, deciding *allow/deny* per operation. They access the *authenticated user* (`request.auth.uid`), the incoming data (`request.resource.data`), and existing data (`resource.data`), and can enforce ownership, validation, and role checks. They are *not filters* — a query only succeeds if the rules allow *every* document it could return (you must design queries to match rules). Rules are your *primary security boundary* for direct client access; test them with the emulator.",
      },
      {
        t: "code",
        title: "Ownership rule",
        code: `match /users/{userId}/notes/{noteId} {\n  allow read, write: if request.auth != null && request.auth.uid == userId;\n}`,
      },
      {
        t: "note",
        text: "Security Rules are declarative, evaluated server-side per read/write (allow/deny), using request.auth.uid, request.resource.data (incoming), and resource.data (existing) to enforce ownership/validation/roles. They're not filters — a query succeeds only if rules allow every doc it could return (design queries to match). They're the primary security boundary for direct client access; test with the emulator.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why can't you rely on client-side checks for Firestore security?",
    a: [
      {
        t: "p",
        text: "Clients are *untrusted* — anyone can modify the app, call the Firestore SDK/REST API directly, and bypass your UI's checks. So *client-side validation is only UX*; the *real* enforcement must be in *Security Rules* (server-side), which no client can bypass. If your rules are permissive ('anyone authenticated can write anything'), a malicious user can read/alter others' data regardless of your app code. Design rules as the source of truth for *who can do what*, and treat client checks as convenience only.",
      },
      {
        t: "list",
        items: [
          "**Clients untrusted** — can call the API directly, bypass UI.",
          "**Client checks** — UX only, not security.",
          "**Rules** — the real, unbypassable enforcement.",
          "**Permissive rules** — expose all data regardless of app code.",
        ],
      },
      {
        t: "note",
        text: "Clients are untrusted — anyone can modify the app or hit the Firestore SDK/REST directly, bypassing UI checks. Client-side validation is only UX; real enforcement is in server-side Security Rules that no client can bypass. Permissive rules expose everyone's data regardless of your app code. Rules are the source of truth for who-can-do-what.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Firestore's offline persistence work?",
    a: [
      {
        t: "p",
        text: "Firestore *caches data locally* and, with offline persistence (enabled by default on mobile), serves *reads from the cache* when offline and *queues writes* to sync when back online. Listeners fire immediately with cached data (and a `fromCache`/pending-writes flag), giving an *offline-first* experience. Writes are *optimistic* — reflected locally at once, then confirmed/merged with the server. Conflicts resolve *last-write-wins* per field on the server. This makes Firestore usable offline with automatic sync, but you must handle *eventual* consistency and pending-write UI states.",
      },
      {
        t: "list",
        items: [
          "**Local cache** — reads served offline.",
          "**Queued writes** — sync when back online (optimistic).",
          "**Listeners** — fire with cached data + pending/fromCache flags.",
          "**Conflicts** — last-write-wins per field server-side.",
        ],
      },
      {
        t: "note",
        text: "Firestore caches locally (offline persistence on by default): reads served from cache offline, writes queued and synced on reconnect (optimistic — reflected locally at once). Listeners fire immediately with cached data + fromCache/pending flags. Server conflict resolution is last-write-wins per field. Offline-first with auto-sync, but handle eventual consistency and pending-write UI.",
      },
    ],
  },
  {
    level: "senior",
    q: "How is Firestore data modeling different from a relational database?",
    a: [
      {
        t: "p",
        text: "Firestore is a *NoSQL document store* — you model for *how you read* (denormalize, duplicate data to avoid joins), not for normalized relations. There are *no server-side joins*; you either *nest*/duplicate data or do multiple reads. Structure into *collections → documents → subcollections*. Because you *pay per read* and queries are shallow, you often *denormalize* (store a user's name on each of their posts) and accept update fan-out. Design around your *queries and access patterns* first, unlike relational's normalize-first approach.",
      },
      {
        t: "list",
        items: [
          "**Document store** — model for reads, not normalization.",
          "**No joins** — nest/duplicate or multiple reads.",
          "**Structure** — collections → documents → subcollections.",
          "**Denormalize** — accept update fan-out; design for queries.",
        ],
      },
      {
        t: "note",
        text: "Firestore is a NoSQL document store — model for how you read (denormalize/duplicate to avoid joins) not normalized relations. No server-side joins (nest/duplicate or multiple reads); structure as collections → documents → subcollections. You pay per read, so denormalize (user name on each post) accepting update fan-out. Design around queries/access patterns first.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the query limitations of Firestore?",
    a: [
      {
        t: "p",
        text: "Firestore queries are *shallow* and constrained: no joins, no full-text search (use Algolia/Typesense), limited *`OR`* (via `in`/`array-contains-any`, capped sizes), only *one range/inequality field* per query (composite constraints), and compound queries need *composite indexes* (auto-suggested). Queries return whole documents (no partial-field selection). These limits push you to *denormalize* and shape data to your queries. Know them upfront — a data model that fights these limits leads to expensive workarounds.",
      },
      {
        t: "list",
        items: [
          "**No joins / full-text** — external search for text.",
          "**One inequality field** — per query.",
          "**Composite indexes** — needed for compound queries.",
          "**Whole documents** — no partial-field reads.",
        ],
      },
      {
        t: "note",
        text: "Firestore query limits: no joins, no full-text search (use Algolia/Typesense), limited OR (in/array-contains-any, capped), only one range/inequality field per query, compound queries need composite indexes, and reads return whole documents. These push you to denormalize and shape data to queries. Know them upfront — fighting them leads to expensive workarounds.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does Firestore pricing work, and how do you optimize it?",
    a: [
      {
        t: "p",
        text: "Firestore bills primarily by *document reads, writes, and deletes* (plus storage and network) — *not* by query complexity, and a query reading 100 docs costs *100 reads*. Optimize by: *paginating* (don't read whole collections), *caching*/using offline persistence (cache reads don't bill), *denormalizing* to avoid extra reads, *listening* efficiently (listeners bill for changed docs, not re-reads), and *aggregating* (count() aggregation vs reading all docs). Watch expensive listeners on large collections. Cost scales with reads, so design read-efficient access patterns.",
      },
      {
        t: "list",
        items: [
          "**Bills** — reads/writes/deletes (not query complexity).",
          "**100-doc query** — 100 reads.",
          "**Optimize** — paginate, cache, denormalize, aggregate.",
          "**Watch** — listeners on large collections.",
        ],
      },
      {
        t: "note",
        text: "Firestore bills by document reads/writes/deletes (+ storage/network), not query complexity — a 100-doc query = 100 reads. Optimize: paginate (don't read whole collections), use cache/offline persistence (cache reads don't bill), denormalize to cut reads, use count() aggregation, and efficient listeners. Watch listeners on big collections. Cost scales with reads — design read-efficient.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are Firestore transactions and batched writes?",
    a: [
      {
        t: "p",
        text: "A *batched write* groups multiple writes into one *atomic* commit (all succeed or none) — for updating several documents together without reading first. A *transaction* *reads then writes atomically* with *optimistic concurrency*: it reads, computes, and writes, and if the read data changed before commit, it *retries* — for operations that depend on current values (incrementing a counter, transferring balance). Use batches for independent multi-writes, transactions when a write depends on a consistent read. Both are atomic and server-enforced.",
      },
      {
        t: "list",
        items: [
          "**Batched write** — atomic multi-write, no read.",
          "**Transaction** — atomic read-then-write, retries on conflict.",
          "**Transaction** — when a write depends on current values.",
          "**Both** — atomic, server-enforced.",
        ],
      },
      {
        t: "note",
        text: "Batched write: groups multiple writes into one atomic commit (all-or-none), no read needed. Transaction: atomic read-then-write with optimistic concurrency — retries if read data changed (for counters/balance transfers depending on current values). Use batches for independent multi-writes, transactions when a write depends on a consistent read. Both atomic and server-enforced.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between get() and a realtime listener (snapshot)?",
    a: [
      {
        t: "p",
        text: "`get()` is a *one-time* read — fetch the current data once. A *snapshot listener* (`addSnapshotListener`/`snapshots()`) *subscribes* and *re-fires whenever the data changes*, giving realtime updates (and initial data). Listeners power live UIs (a chat that updates instantly) but keep a *connection* and bill for changed docs — *detach* them when not needed (lifecycle) to avoid leaks/cost. Use `get()` for data you read once (a settings load); use listeners for data that should stay live on screen.",
      },
      {
        t: "list",
        items: [
          "**`get()`** — one-time read.",
          "**Snapshot listener** — subscribes, re-fires on changes.",
          "**Listeners** — live UI; detach on lifecycle.",
          "**Choose** — get() for one-shot, listener for live data.",
        ],
      },
      {
        t: "note",
        text: "get() is a one-time read; a snapshot listener subscribes and re-fires on every change (realtime updates + initial data). Listeners power live UIs but hold a connection and bill for changed docs — detach on lifecycle to avoid leaks/cost. Use get() for one-shot reads (settings), listeners for data that should stay live on screen (chat/feed).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you structure Firestore data for a chat app?",
    a: [
      {
        t: "p",
        text: "A common model: a `chats` (or `conversations`) collection where each document holds metadata (participants, last message preview, timestamps), and a *subcollection* `messages` per chat (ordered by timestamp) for the message documents. Store a *denormalized* `lastMessage` on the chat doc for the list view (one read per chat, no fan-out to messages). Use *listeners* on the active chat's messages for realtime, and *pagination* for history. Security Rules restrict each chat to its participants. Index by timestamp for ordered queries.",
      },
      {
        t: "list",
        items: [
          "**`chats` doc** — participants, lastMessage preview, timestamps.",
          "**`messages` subcollection** — per chat, ordered by time.",
          "**Denormalize** — lastMessage for the list view.",
          "**Listener + pagination** — active chat live, history paged.",
        ],
      },
      {
        t: "note",
        text: "Chat model: a chats/conversations collection (participants, denormalized lastMessage preview, timestamps) + a messages subcollection per chat ordered by timestamp. Denormalized lastMessage powers the list (one read/chat). Listen on the active chat's messages for realtime; paginate history. Rules restrict a chat to its participants; index by timestamp.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between Firestore and Realtime Database in practice?",
    a: [
      {
        t: "p",
        text: "*Realtime Database (RTDB)* is one big *JSON tree* — very low-latency, simple, great for presence and high-frequency small updates, but limited querying (shallow, no compound queries) and harder to scale/structure. *Firestore* is a *document/collection* model with richer *queries*, *composite indexes*, *better scaling*, *stronger security rules*, and multi-region — the default for most new apps. Choose RTDB for simple, ultra-low-latency sync (presence, live cursors); Firestore for structured data, complex queries, and scale. You can use both for different jobs.",
      },
      {
        t: "table",
        headers: ["", "Realtime DB", "Firestore"],
        rows: [
          ["Model", "One JSON tree", "Documents/collections"],
          ["Queries", "Shallow/limited", "Rich, indexed"],
          ["Best for", "Presence, low-latency sync", "Structured data, scale"],
        ],
      },
      {
        t: "note",
        text: "RTDB: one JSON tree — ultra-low-latency, simple, great for presence/high-frequency small updates, but limited queries and harder to scale. Firestore: documents/collections with richer queries, composite indexes, better scaling, stronger rules, multi-region — default for new apps. RTDB for simple low-latency sync (presence/cursors); Firestore for structured data + complex queries + scale. Use both if needed.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle role-based access with custom claims?",
    a: [
      {
        t: "p",
        text: "*Custom claims* are key-value attributes (e.g. `admin: true`, `role: 'editor'`) you set on a user's token *via the Admin SDK* (server-side only — never from the client). They're embedded in the *ID token*, so *Security Rules* (`request.auth.token.admin == true`) and your backend can *authorize by role* without a database lookup. Use them for coarse roles/permissions. Caveat: claims update on *token refresh* (~1h or force-refresh), so role changes aren't instant. Keep claims small; store fine-grained permissions in the database.",
      },
      {
        t: "list",
        items: [
          "**Custom claims** — role attributes set via Admin SDK (server).",
          "**In the ID token** — Rules/backend authorize by role.",
          "**No DB lookup** — for coarse roles.",
          "**Caveat** — update on token refresh (~1h), not instant.",
        ],
      },
      {
        t: "note",
        text: "Custom claims are role attributes (admin:true) set server-side via the Admin SDK (never client), embedded in the ID token so Security Rules (request.auth.token.admin) and your backend authorize by role without a DB lookup. Use for coarse roles. Caveat: claims refresh with the token (~1h/force-refresh) — role changes aren't instant. Keep claims small; fine-grained perms in the DB.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you observe authentication state in the app?",
    a: [
      {
        t: "p",
        text: "Use an *auth state listener* (`FirebaseAuth.addAuthStateListener` / `auth.authStateChanged` as a Flow) that fires whenever the user *signs in or out* (and on startup with the restored session). Drive your navigation/UI from it — show the app when a user is present, the login screen when null — rather than checking `currentUser` once. This keeps the UI in sync with token refresh/sign-out and handles the *restored session* on launch (Firebase persists the session). It's the reactive source of truth for 'is someone logged in?'.",
      },
      {
        t: "code",
        title: "Auth state as a Flow",
        code: `val authState = callbackFlow {\n  val l = FirebaseAuth.AuthStateListener { trySend(it.currentUser) }\n  Firebase.auth.addAuthStateListener(l)\n  awaitClose { Firebase.auth.removeAuthStateListener(l) }\n}`,
      },
      {
        t: "note",
        text: "Observe auth via an auth state listener (addAuthStateListener / a callbackFlow) that fires on sign-in/out and startup (restored session). Drive navigation/UI from it (app vs login) instead of checking currentUser once — keeping UI in sync with refresh/sign-out and handling the persisted session on launch. The reactive source of truth for 'is someone logged in?'.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are common Firestore Security Rules mistakes?",
    a: [
      {
        t: "p",
        text: "Common pitfalls: leaving rules in *test mode* (`allow read, write: if true`) in production (wide-open data), assuming rules *filter* queries (they don't — a query fails unless all matched docs are allowed), not *validating incoming data* (`request.resource.data`) so clients can write bad/oversized fields, forgetting *field-level* checks, not restricting *who can set sensitive fields* (e.g. a `role` field), and not *testing* rules. Also, overly broad reads leak data. Always deny by default, validate writes, scope by `uid`, and test with the emulator.",
      },
      {
        t: "list",
        items: [
          "**Test mode** — `if true` left in production.",
          "**Rules aren't filters** — query fails if any doc disallowed.",
          "**No validation** — clients write bad/sensitive fields.",
          "**Fix** — deny by default, validate, scope by uid, test.",
        ],
      },
      {
        t: "note",
        text: "Common Rules mistakes: leaving test mode (allow if true) in prod, assuming rules filter queries (they don't — the query fails unless all matched docs are allowed), not validating request.resource.data (clients write bad/sensitive fields like role), missing field-level checks, and not testing. Deny by default, validate writes, scope by uid, and test with the emulator.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you paginate Firestore queries efficiently?",
    a: [
      {
        t: "p",
        text: "Use *cursor-based* pagination with `orderBy` + `startAfter(lastDocumentSnapshot)` + `limit(n)` — fetch a page, then start the next page *after the last doc* of the previous one. This is efficient (reads only the page) and stable. Avoid *offset*-style pagination (Firestore has no true offset; skipping still reads/bills skipped docs). Pass the *DocumentSnapshot* (not just a field value) as the cursor for correctness with ties. For infinite scroll, keep the last snapshot and load more on scroll. Combine with an index on the ordered field.",
      },
      {
        t: "code",
        title: "Cursor pagination",
        code: `val first = db.collection("posts").orderBy("createdAt").limit(20)\nval snap = first.get().await()\nval last = snap.documents.last()\nval next = db.collection("posts").orderBy("createdAt").startAfter(last).limit(20)`,
      },
      {
        t: "note",
        text: "Paginate with cursors: orderBy + startAfter(lastSnapshot) + limit(n) — fetch a page, start the next after the previous page's last doc (reads only the page, stable). Avoid offset-style (no true offset; skipped docs still bill). Pass the DocumentSnapshot as the cursor for tie correctness. Keep the last snapshot for infinite scroll; index the ordered field.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Firebase Cloud Functions, and how does it complement client apps?",
    a: [
      {
        t: "p",
        text: "*Cloud Functions* run *your backend code* (server-side) in response to events — Firestore/RTDB *triggers* (on document write), Auth events (on user create), HTTPS *callable* functions (invoked from the app), or scheduled jobs. They let you do things clients *shouldn't*: privileged writes, sending FCM, calling third-party APIs with secret keys, data validation/aggregation, and fan-out (denormalization). They complement a BaaS app by providing *trusted server logic* without managing servers. Use them for anything needing secrets or that must be authoritative.",
      },
      {
        t: "list",
        items: [
          "**Server code** — on events (Firestore/Auth triggers, HTTPS, scheduled).",
          "**Privileged work** — secret keys, FCM sends, aggregation.",
          "**Trusted logic** — what clients shouldn't do.",
          "**Serverless** — no server management.",
        ],
      },
      {
        t: "note",
        text: "Cloud Functions run your backend code on events — Firestore/RTDB triggers, Auth events, HTTPS callable functions, scheduled jobs. They do what clients shouldn't: privileged writes, sending FCM, third-party APIs with secret keys, validation/aggregation, denormalization fan-out. They give a BaaS app trusted, authoritative server logic without managing servers. Use for anything needing secrets or authority.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you keep denormalized data consistent in Firestore?",
    a: [
      {
        t: "p",
        text: "Denormalization duplicates data (a user's name on each post), so an update must *fan out* to all copies. Options: do the fan-out in a *Cloud Function* triggered on the source change (server-side, reliable, off the client), use *batched writes/transactions* for atomic multi-doc updates, or accept *eventual consistency* where staleness is tolerable. Decide *what to denormalize* by read frequency vs update cost. For large fan-outs, background the work. The trade-off is read speed/cost vs write complexity — choose per access pattern.",
      },
      {
        t: "list",
        items: [
          "**Fan-out** — update all duplicated copies.",
          "**Cloud Function** — reliable server-side fan-out on change.",
          "**Batches/transactions** — atomic multi-doc updates.",
          "**Trade-off** — read speed vs write complexity.",
        ],
      },
      {
        t: "note",
        text: "Denormalization duplicates data, so updates must fan out to all copies. Options: a Cloud Function triggered on the source change (reliable, server-side), batched writes/transactions for atomic multi-doc updates, or accept eventual consistency where tolerable. Denormalize by read frequency vs update cost; background large fan-outs. Trade-off: read speed/cost vs write complexity — choose per access pattern.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you securely store and never trust the user's uid on the client?",
    a: [
      {
        t: "p",
        text: "The client's `auth.currentUser.uid` is fine to *read* for the app's own logic, but your *backend/Rules must derive identity from the verified token* (`request.auth.uid` / Admin SDK `verifyIdToken`), *never* from a uid the client *sends in a request body* (which can be forged). So: never write 'ownerId' based on a client-supplied value without checking it against the authenticated token; enforce in Rules that `request.resource.data.ownerId == request.auth.uid`. Trust the *token*, not client-provided identifiers.",
      },
      {
        t: "list",
        items: [
          "**Client uid** — fine for app logic, not for authorization.",
          "**Server/Rules** — derive identity from the verified token.",
          "**Never trust** — a uid sent in the request body.",
          "**Enforce** — ownerId == request.auth.uid in Rules.",
        ],
      },
      {
        t: "note",
        text: "The client's uid is fine for app logic, but authorization must derive identity from the verified token (request.auth.uid / Admin SDK verifyIdToken) — never from a uid the client sends in a body (forgeable). Enforce in Rules that request.resource.data.ownerId == request.auth.uid. Trust the token, not client-provided identifiers.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the Firebase Local Emulator Suite, and why use it?",
    a: [
      {
        t: "p",
        text: "The *Emulator Suite* runs Firebase services (Auth, Firestore, Functions, RTDB, Storage) *locally* — so you develop and *test against local instances* without touching production, incurring cost, or needing network. Crucially, it lets you *unit-test Security Rules* (with the rules-unit-testing library), test Cloud Functions and triggers, and seed/reset data deterministically in CI. Use it to make Firebase-dependent code *testable and safe*: fast, offline, no prod data risk, and reproducible. It's the standard way to test rules and backend logic.",
      },
      {
        t: "list",
        items: [
          "**Local Firebase** — Auth, Firestore, Functions, Storage.",
          "**No prod/cost/network** — safe local dev.",
          "**Test Rules + Functions** — deterministically, in CI.",
          "**Reproducible** — seed/reset data.",
        ],
      },
      {
        t: "note",
        text: "The Local Emulator Suite runs Firebase services (Auth, Firestore, Functions, RTDB, Storage) locally — develop/test without touching prod, cost, or network. It enables unit-testing Security Rules (rules-unit-testing), testing Functions/triggers, and deterministic seed/reset in CI. The standard way to make Firebase-dependent code testable and safe: fast, offline, no prod-data risk, reproducible.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you architect a Firebase app to keep it testable and decoupled?",
    a: [
      {
        t: "p",
        text: "Don't scatter `Firebase.firestore`/`Firebase.auth` calls through the UI/domain. Wrap Firebase behind *repository interfaces* (e.g. `UserRepository`, `AuthRepository`) with Firebase-backed implementations, mapping Firestore documents to *domain models* at the boundary. The rest of the app depends on the interfaces (testable with fakes, swappable). Expose data as *Flows*. This isolates the SDK, keeps domain/UI Firebase-agnostic, eases testing (fake repos + emulator for integration), and would let you swap backends. Standard clean-architecture treatment of a BaaS SDK.",
      },
      {
        t: "list",
        items: [
          "**Wrap** — Firebase behind repository interfaces.",
          "**Map** — documents → domain models at the boundary.",
          "**App depends on interfaces** — fakes for tests.",
          "**Benefits** — isolation, testability, swappable backend.",
        ],
      },
      {
        t: "note",
        text: "Keep Firebase testable/decoupled: wrap it behind repository interfaces (UserRepository, AuthRepository) with Firebase-backed impls, map documents → domain models at the boundary, and have domain/UI depend on the interfaces (fakes for tests, emulator for integration), exposing Flows. Isolates the SDK, keeps the app Firebase-agnostic, swappable. Standard clean-architecture treatment of a BaaS SDK.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle account linking and multiple providers for one user?",
    a: [
      {
        t: "p",
        text: "Firebase Auth can associate *multiple sign-in providers with one account* (same uid) via *linking* (`linkWithCredential`) — e.g. a user who signed up with email later links Google, and either method logs into the same account/data. Handle the `collision` case: if the provider's email already belongs to another account, Firebase throws `account-exists-with-different-credential` — you *fetch sign-in methods for the email* and prompt the user to sign in with the existing method, then link. Designing for linking avoids duplicate accounts and preserves user data across methods.",
      },
      {
        t: "list",
        items: [
          "**Link** — multiple providers → one uid (`linkWithCredential`).",
          "**Same account/data** — via any linked method.",
          "**Collision** — `account-exists-with-different-credential`: sign in existing, then link.",
          "**Avoids** — duplicate accounts; preserves data.",
        ],
      },
      {
        t: "note",
        text: "Firebase Auth links multiple providers to one account/uid (linkWithCredential) — email user later links Google, both log into the same data. Handle account-exists-with-different-credential: fetch the email's sign-in methods, have the user sign in with the existing one, then link. Designing for linking avoids duplicate accounts and preserves data across methods.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you migrate from Firebase to (or integrate with) your own backend?",
    a: [
      {
        t: "p",
        text: "Because you should already have Firebase *wrapped behind repositories*, swapping the data source is localized. For *auth*, Firebase can *mint custom tokens* from your backend (or your backend can *verify Firebase ID tokens* with the Admin SDK), letting the two coexist during migration. For *data*, run a *dual-write / backfill* period (write to both, migrate reads gradually), keep the domain models stable, and cut over per feature. Plan for *export* (Firestore export/BigQuery) and *user migration* (custom auth). Incremental, repository-isolated migration avoids a risky big-bang.",
      },
      {
        t: "list",
        items: [
          "**Repository-wrapped** — swap is localized.",
          "**Auth coexist** — custom tokens / verify ID tokens (Admin SDK).",
          "**Data** — dual-write/backfill, migrate reads gradually.",
          "**Incremental** — per feature; export via Firestore/BigQuery.",
        ],
      },
      {
        t: "note",
        text: "With Firebase wrapped behind repositories, swapping is localized. Auth: coexist via custom tokens or verifying Firebase ID tokens (Admin SDK). Data: dual-write/backfill, migrate reads gradually, keep domain models stable, cut over per feature. Plan export (Firestore export/BigQuery) and user migration (custom auth). Incremental, repository-isolated migration beats a risky big-bang.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Firebase Storage, and how does it relate to auth and rules?",
    a: [
      {
        t: "p",
        text: "*Cloud Storage for Firebase* stores *files* (images, videos, uploads) with resumable up/downloads from the client. Like Firestore, access is governed by *Storage Security Rules* using the *authenticated user* — you scope paths per user (`/users/{uid}/...`) and validate *content type/size*. Common pattern: upload a file to Storage, then store its *download URL/path* in Firestore alongside metadata. Never make buckets world-writable; enforce ownership and size/type limits in rules. It complements the databases for binary data (which you shouldn't put in documents).",
      },
      {
        t: "list",
        items: [
          "**Storage** — files (images/video) with resumable transfer.",
          "**Storage Rules** — auth-based, per-path, validate type/size.",
          "**Pattern** — upload file, store URL/path in Firestore.",
          "**Never** — world-writable buckets.",
        ],
      },
      {
        t: "note",
        text: "Cloud Storage for Firebase stores files (images/video) with resumable transfers, governed by Storage Security Rules using the authenticated user — scope paths per uid, validate content type/size. Common pattern: upload to Storage, store the download URL/path + metadata in Firestore. Never make buckets world-writable; enforce ownership and limits in rules. Complements the databases for binary data.",
      },
    ],
  },
];

export default qa;
