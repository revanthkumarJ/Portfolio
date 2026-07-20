// Ktor & WebSockets — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is Ktor and when would you use it over Retrofit?",
    a: [
      {
        t: "p",
        text: "**Ktor is a Kotlin networking library from JetBrains; its client is a pure-Kotlin, coroutine-based HTTP client that is *multiplatform* — the same networking code runs on Android, iOS, desktop, and web.** That multiplatform capability is the main reason to choose it: in a **Kotlin Multiplatform (KMP)** project, networking code lives in shared `commonMain`, and Retrofit — which is JVM/Android-only — can't be used there, but Ktor can.",
      },
      {
        t: "list",
        items: [
          "**Use Retrofit** for Android-only apps — it's very mature, has a large ecosystem, and its declarative interface-with-annotations style is concise for REST.",
          "**Use Ktor** for KMP projects where the networking layer must be shared and run on iOS too. It's the standard KMP networking choice.",
          "They share concepts — both are coroutine-based, both integrate kotlinx.serialization, both support plugins/interceptors for auth/logging/retry — so knowledge transfers. Ktor can even use OkHttp as its engine on Android.",
        ],
      },
      {
        t: "p",
        text: "The difference in style: Retrofit generates an implementation from an annotated interface, while Ktor uses imperative request functions (`client.get(\"users/$id\").body()`). For an Android/KMP engineer, the practical answer is 'Retrofit for Android-specific code, Ktor for the shared multiplatform layer' — and knowing both is expected.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a WebSocket and how is it different from HTTP?",
    a: [
      {
        t: "p",
        text: "**A WebSocket is a persistent, bidirectional connection between client and server, used for real-time communication. It's different from HTTP's request/response model: with HTTP, the client asks and the server answers, then it's done; with a WebSocket, the connection stays open and *both sides can send messages at any time*.**",
      },
      {
        t: "list",
        items: [
          "**Persistent** — the connection stays open (unlike HTTP's one-shot exchange), so there's no repeated connection setup for each message.",
          "**Bidirectional (full-duplex)** — crucially, the *server can push messages to the client* without the client asking. Plain HTTP can't do this; the client always has to initiate.",
          "**Real-time & efficient** — messages arrive instantly with no polling, low latency and overhead. Ideal for chat, live feeds, presence, collaborative editing, live scores.",
          "**Starts as HTTP** — a WebSocket begins with an HTTP request carrying an `Upgrade: websocket` header; the server agrees and the connection 'upgrades' to the WebSocket protocol (`ws://` or secure `wss://`).",
        ],
      },
      {
        t: "p",
        text: "The core distinction to state: HTTP is *pull* (client requests, server responds, connection closes), while a WebSocket is a *persistent two-way channel* where the server can *push*. That's what makes real-time features practical — without WebSockets you'd have to constantly poll ('anything new?'), which is wasteful and laggy. The trade-off is that WebSockets require connection management (reconnection, heartbeats), which HTTP's stateless model doesn't.",
      },
    ],
  },
  {
    level: "junior",
    q: "When would you use WebSockets versus polling?",
    a: [
      {
        t: "p",
        text: "**Use WebSockets for genuine real-time, frequent, or bidirectional updates; use polling for simple, infrequent updates where near-real-time is fine.** The trade-off is real-time efficiency vs implementation simplicity.",
      },
      {
        t: "list",
        items: [
          "**Polling** (repeatedly GET on a timer) is simple — just a normal HTTP request on a schedule — and fine for data that changes infrequently and where a delay is acceptable (checking for a status update every 30 seconds). But it's *wasteful* (most requests return 'nothing new', burning battery and data) and *laggy* (updates only arrive on the next poll interval). For anything needing instant updates, it's a poor fit.",
          "**WebSockets** give *instant* delivery with a single persistent connection and support the server *pushing* to the client — essential for chat, live collaboration, live feeds, or anything where the server needs to notify the client immediately. The cost is complexity: you must manage the connection (reconnect on drops, heartbeats to detect dead connections).",
        ],
      },
      {
        t: "p",
        text: "There are middle grounds worth knowing: **long polling** (the server holds a request open until it has data, then responds — near-real-time without full WebSockets) and **Server-Sent Events (SSE)** (the server pushes over a one-way HTTP stream — simpler than WebSockets and firewall-friendly, but *server→client only*, so good for live feeds/notifications but not bidirectional chat). The decision: infrequent updates + simplicity → polling; server→client real-time only → SSE; full bidirectional real-time → WebSockets. Don't reach for WebSockets' complexity if simple polling or SSE meets the need.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you consume a WebSocket stream in a Compose/ViewModel architecture?",
    a: [
      {
        t: "p",
        text: "**You wrap the WebSocket in a `callbackFlow` (or `channelFlow`) to expose incoming messages as a Kotlin `Flow`, which the ViewModel collects and turns into UI state — just like any other reactive data source.** This bridges the WebSocket's callback/streaming nature into the coroutine world so it fits cleanly into the standard architecture.",
      },
      {
        t: "code",
        title: "WebSocket as a Flow",
        code: `fun observeMessages(): Flow<ChatMessage> = callbackFlow {
    client.webSocket("wss://chat.example.com/ws") {
        for (frame in incoming) {                       // suspends, receives frames
            if (frame is Frame.Text) trySend(parse(frame.readText()))
        }
    }
    awaitClose { /* close connection / cleanup */ }
}
// ViewModel collects it into StateFlow like any other Flow`,
      },
      {
        t: "p",
        text: "Exposing it as a Flow means the rest of your app treats real-time messages the same as any observable data — the repository provides `Flow<ChatMessage>`, the ViewModel collects it (often accumulating into a `StateFlow<List<ChatMessage>>`), and the UI observes that state. The `callbackFlow` + `awaitClose` pattern ensures the WebSocket is properly closed when collection stops (the user leaves the screen), tying the connection's lifetime to the observer via structured concurrency. For sending messages, the repository exposes a suspend function that writes to the socket's `send`. The key idea is that WebSockets don't need a *special* architecture — bridge them to a Flow and they slot into the same unidirectional-data-flow pattern as everything else.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the challenges of managing a WebSocket connection on mobile, and how do you handle them?",
    a: [
      {
        t: "p",
        text: "**The core challenge is that mobile connections are *unstable and lifecycle-constrained* — networks change (Wi-Fi ↔ cellular), the app gets backgrounded, the device sleeps, servers restart — so a WebSocket *will* drop repeatedly, and naive code that assumes a stable persistent connection breaks. Robust WebSocket handling is mostly about connection lifecycle management, not the messaging itself.**",
      },
      {
        t: "list",
        items: [
          "**Reconnection with backoff**: the connection drops, and you must automatically reconnect — but with *exponential backoff* (increasing delays) and *jitter*, so you don't hammer the server (especially if it's down and thousands of clients reconnect at once — the thundering herd). Cap the backoff at a maximum and keep retrying. On reconnect, re-establish any subscriptions/state the server needs.",
          "**Heartbeats / ping-pong**: a dropped connection often *doesn't* raise an error immediately — the socket looks open but is dead (a 'half-open' connection). You send periodic pings and expect pongs; if a pong doesn't arrive in time, you consider the connection dead and reconnect. Without heartbeats, you'd silently stop receiving messages while thinking you're connected.",
          "**Lifecycle awareness**: keeping a WebSocket open while the app is backgrounded wastes battery and the OS may kill it anyway. Typically you *close* the connection when the app backgrounds (or the screen is not visible) and *reopen* on foreground — tying the connection to `lifecycleScope`/`repeatOnLifecycle(STARTED)` or the Compose lifecycle. For truly background real-time (a chat needing to notify when closed), you'd use push notifications (FCM) instead of holding a socket open.",
          "**Message ordering & gap handling across reconnects**: while disconnected, you may have missed messages. On reconnect, you need a strategy — the server sends a 'since timestamp/id' catch-up, or you re-fetch missed data via REST — so the user doesn't have holes in their message history. Give messages sequence numbers/ids to detect gaps and dedupe.",
          "**Send buffering**: messages the user sends while momentarily disconnected should be queued and sent on reconnect (or shown as 'sending…' and retried), not silently dropped.",
          "**Authentication on (re)connect**: the connection needs auth (a token in the handshake or a first message); on reconnect with a possibly-expired token, you may need to refresh the token before reconnecting.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: a WebSocket on mobile is not 'open it once and read forever' — it's a *managed, self-healing connection* that must survive constant network changes and lifecycle events. The robust implementation wraps the socket in a layer that handles reconnection (backoff + jitter), liveness (heartbeats), lifecycle (connect/disconnect on foreground/background), and continuity (catch-up on reconnect, send queue, dedup). You expose the *result* as a clean Flow of messages to the app, hiding all that management. Underestimating the connection-management complexity — treating a WebSocket like a reliable pipe — is the classic mistake; on mobile, the management *is* the hard part, and for background delivery you often complement WebSockets with push notifications rather than trying to keep a socket alive indefinitely.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Ktor's engine/plugin architecture work, and why is it well-suited to KMP?",
    a: [
      {
        t: "p",
        text: "**Ktor Client separates the *engine* (the actual platform HTTP implementation) from the *client API and plugins* (the shared, platform-agnostic features). This separation is exactly what makes it multiplatform: the API and your networking code are written once in shared code, while the engine is swapped per platform via the `expect/actual` mechanism.**",
      },
      {
        t: "list",
        items: [
          "**The engine** is the low-level HTTP implementation — how bytes actually go over the network. Ktor provides several: `CIO` (pure Kotlin, cross-platform), `OkHttp` and `Android` (JVM/Android), `Darwin` (iOS, using Apple's URLSession), `Js` (browser). You pick the appropriate engine per target (often via `expect/actual`), and the *rest of your code doesn't change* — it talks to the same `HttpClient` API regardless of engine.",
          "**Plugins (features)** are modular, installable capabilities that live in the shared layer: `ContentNegotiation` (serialization with kotlinx.serialization — itself multiplatform), `Auth` (token auth with refresh), `Logging`, `HttpTimeout`, `HttpRequestRetry`, `HttpCache`, `WebSockets`. You `install()` the ones you need. They're implemented against the engine-agnostic API, so they work on every platform.",
          "**Why this suits KMP**: the value proposition of KMP is 'write business/data logic once, run on Android and iOS'. Networking is a big part of the data layer, and Ktor lets the *entire* networking layer — request definitions, serialization, auth, retry, error handling — live in `commonMain` and be shared. Only the engine (a single line choosing the platform implementation) differs per target. Retrofit can't do this because it's fundamentally tied to the JVM (dynamic proxies, OkHttp), so it can never run on iOS.",
          "**Pairs with kotlinx.serialization**: since Ktor's ContentNegotiation uses kotlinx.serialization (also multiplatform, compile-time, reflection-free), the whole serialize→request→parse pipeline is shared and works on Kotlin/Native (iOS) where reflection-based libraries like Gson/Moshi don't.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: Ktor's engine/plugin split is a deliberate design for portability — abstract the *what* (the HTTP semantics, features, and your API code) away from the *how* (the platform-specific byte transport), so the former is shared and only the latter is platform-specific. This mirrors KMP's whole philosophy (`expect/actual` for platform specifics, shared code for everything else) and is why Ktor + kotlinx.serialization is *the* KMP networking stack. On an Android-only project you'd still likely pick Retrofit for its maturity, but the moment iOS shares the networking code, Ktor's architecture is what makes that possible.",
      },
    ],
  },
];

export default qa;
