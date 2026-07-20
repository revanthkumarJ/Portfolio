// Firebase Auth & Databases — Content tab. Teaching-first.

const content = [
  {
    heading: "Firebase Authentication",
    blocks: [
      {
        t: "p",
        text: "**Firebase Authentication** provides ready-made user sign-in — it handles the complex, security-sensitive work of authenticating users so you don't build it yourself. It supports many *providers*: email/password, phone (SMS OTP), and federated sign-in (Google, Apple, Facebook, etc.), plus anonymous auth. You get a signed-in user with a stable UID and a token you use to authorize requests, without implementing password hashing, OAuth flows, or SMS verification yourself.",
      },
      {
        t: "list",
        items: [
          "**Providers** — email/password, phone (SMS), Google/Apple/Facebook/GitHub (OAuth), anonymous (a temporary account you can later 'upgrade' to a real one when the user signs up). You enable the providers you want and Firebase handles the flows.",
          "**What you get** — a `FirebaseUser` with a unique UID (stable identity for that user), and an **ID token** (a JWT) you send to your backend or use to secure Firebase services; the backend/services verify it to authenticate the request.",
          "**Session management** — Firebase persists the auth state (the user stays signed in across launches) and handles token refresh automatically. You observe auth state to react to sign-in/out.",
          "**Security handled for you** — password storage, OAuth token exchange, SMS verification, and token signing/verification are all managed by Firebase, which is more secure than most teams rolling their own. This is a strong reason to use it — auth is easy to get *wrong* in ways that are catastrophic.",
        ],
      },
    ],
  },
  {
    heading: "Firestore and Realtime Database",
    blocks: [
      {
        t: "p",
        text: "Firebase offers two cloud NoSQL databases with *real-time sync* and *offline support*: the older **Realtime Database** and the newer, more capable **Cloud Firestore**. Both let clients read/write data that *syncs in real time* across devices and *works offline* (caching locally, syncing when back online) — powerful for collaborative/real-time apps without you building a backend + sync layer.",
      },
      {
        t: "table",
        headers: ["", "Realtime Database", "Cloud Firestore"],
        rows: [
          ["Data model", "one big JSON tree", "collections of documents (structured, nested collections)"],
          ["Queries", "limited (basic filtering/sorting)", "richer (compound queries, better indexing)"],
          ["Scaling", "single-region, less scalable", "multi-region, scales better"],
          ["Pricing", "by bandwidth + storage", "by document reads/writes + storage"],
          ["Recommendation", "legacy / simple real-time cases", "the modern default for most new apps"],
        ],
      },
      {
        t: "list",
        items: [
          "**Real-time sync** — you *listen* to data and get *live updates* when it changes anywhere (another user, another device) — ideal for chat, collaborative editing, live dashboards. No polling; changes push to listeners.",
          "**Offline support** — the SDK caches data locally and lets the app read/write offline, syncing when connectivity returns (with conflict handling). Offline-capable by default.",
          "**Firestore is the modern default** — a document/collection model (more structured than RTDB's single JSON tree), richer queries, better scaling and multi-region. Use Firestore for new apps unless you have a specific reason for RTDB (e.g. very simple real-time state, presence).",
          "**Security Rules** — access control is enforced by server-side *Security Rules* (declarative rules on who can read/write what, based on auth and data). Since clients talk to the database directly, these rules are your security boundary — getting them right is critical (a common mistake is overly permissive rules exposing data).",
        ],
      },
    ],
  },
  {
    heading: "The tradeoff: BaaS vs a custom backend",
    blocks: [
      {
        t: "p",
        text: "Firestore/RTDB are **Backend-as-a-Service (BaaS)** — the client talks *directly* to a managed database (secured by Security Rules), with no server code in between (though Cloud Functions can add server logic). This is a different architecture from a traditional *custom backend* (your server + API in front of a database), with real tradeoffs.",
      },
      {
        t: "list",
        items: [
          "**BaaS pros** — extremely fast to build (no backend to write/operate), real-time sync and offline built in, scales without ops work. Great for MVPs, real-time apps, and small teams — you ship features instead of building infrastructure.",
          "**BaaS cons** — *limited queries* (NoSQL, no complex joins/aggregations like SQL), *cost at scale* (Firestore bills per read/write — a query pattern cheap at small scale can get expensive), *business logic on the client or in Cloud Functions* (no traditional server layer — sensitive logic in the client is a concern, so it moves to Security Rules + Functions), and *vendor lock-in* (the data model couples you to Firestore).",
          "**When to use BaaS** — real-time/collaborative features, MVPs, standard CRUD apps where speed matters and query needs are simple. **When to prefer a custom backend** — complex relational data and queries, heavy server-side business logic, specific compliance/data-residency needs, or cost/control requirements at scale.",
          "**Hybrid is common** — many apps use Firebase for *some* things (auth, push, crashes, analytics, maybe a real-time feature) and a custom backend for their *core* data/logic. You don't have to go all-in.",
        ],
      },
    ],
  },
  {
    heading: "Other Firebase services (brief)",
    blocks: [
      {
        t: "list",
        items: [
          "**Cloud Functions** — serverless backend code (run on events like a Firestore write, an auth event, or an HTTP call) — for server-side logic without managing servers (validation, triggers, integrations, sending FCM messages).",
          "**Cloud Storage** — file storage (images, videos, user uploads) with security rules, integrated with Auth.",
          "**App Check** — protects your backend/Firebase resources by verifying requests come from *your genuine app* (not a bot/emulator/repackaged app) — an abuse/security layer.",
          "**Dynamic Links** (being deprecated) / **Hosting**, **In-App Messaging**, **ML Kit** (on-device ML), and more — the suite is broad; you adopt what you need.",
        ],
      },
      {
        t: "note",
        text: "Firebase Auth: ready-made sign-in (email/password, phone, Google/Apple/etc., anonymous) — handles security-sensitive work (password storage, OAuth, SMS, tokens); gives a UID + ID token; manages sessions/refresh. Databases: Firestore (modern default — document/collection, richer queries, scales) and Realtime DB (older, JSON tree) — both real-time sync + offline, secured by server-side Security Rules (your security boundary). BaaS (client talks directly to DB) vs custom backend: BaaS = fast/real-time/offline but limited queries, cost at scale, lock-in — use for MVPs/real-time; hybrid is common. Also Cloud Functions (serverless), Storage, App Check.",
      },
    ],
  },
];

export default content;
