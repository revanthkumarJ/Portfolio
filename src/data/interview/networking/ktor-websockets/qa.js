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
  {
    level: "junior",
    q: "How do you make a basic HTTP request with Ktor Client?",
    a: [
      {
        t: "p",
        text: "Create an `HttpClient` (with an engine and plugins), then call suspend request functions — `client.get(url)`, `client.post(url) { setBody(...) }` — and read the typed body with `.body<T>()` (using content negotiation). Ktor is coroutine-first, so requests are suspend functions.",
      },
      {
        t: "code",
        title: "Ktor request",
        code: `val client = HttpClient(CIO) {
    install(ContentNegotiation) { json() }
}
suspend fun getUser(id: String): User = client.get("https://api.example.com/users/\$id").body()
suspend fun create(u: User): User = client.post("https://api.example.com/users") {
    contentType(ContentType.Application.Json); setBody(u)
}.body()`,
      },
      {
        t: "list",
        items: [
          "**`HttpClient(engine) { plugins }`** — configure once.",
          "**`get`/`post`/…** — suspend request functions.",
          "**`.body<T>()`** — typed deserialization (ContentNegotiation).",
          "**Coroutine-first** — all requests are suspend.",
        ],
      },
      {
        t: "note",
        text: "Ktor: create an HttpClient(engine) { install plugins }, call suspend functions (client.get/post { setBody }) and read .body<T>() via ContentNegotiation. It's coroutine-first (all requests suspend). Configure the client once and share it, like OkHttp.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Ktor's plugin (feature) architecture work?",
    a: [
      {
        t: "p",
        text: "Ktor Client is built from *plugins* installed on the `HttpClient` — each intercepts the request/response pipeline to add behavior: `ContentNegotiation` (serialization), `Logging`, `Auth` (bearer/refresh), `HttpTimeout`, `HttpRequestRetry`, `WebSockets`, `HttpCache`. You compose exactly the features you need. This modular design is lightweight and KMP-friendly (no Android-specific dependencies in the core).",
      },
      {
        t: "code",
        title: "Installing plugins",
        code: `HttpClient(CIO) {
    install(ContentNegotiation) { json() }
    install(Logging) { level = LogLevel.HEADERS }
    install(HttpTimeout) { requestTimeoutMillis = 30_000 }
    install(Auth) { bearer { loadTokens { BearerTokens(access, refresh) } } }
}`,
      },
      {
        t: "list",
        items: [
          "**Plugins** — intercept the pipeline to add features.",
          "**Compose** — ContentNegotiation, Logging, Auth, Timeout, Retry, WebSockets.",
          "**Modular** — install only what you need.",
          "**KMP-friendly** — core has no platform dependencies.",
        ],
      },
      {
        t: "note",
        text: "Ktor Client composes plugins on the HttpClient, each intercepting the request/response pipeline: ContentNegotiation, Logging, Auth (bearer/refresh), HttpTimeout, HttpRequestRetry, WebSockets, HttpCache. Install exactly what you need — modular, lightweight, KMP-friendly (core has no platform deps).",
      },
    ],
  },
  {
    level: "senior",
    q: "What are Ktor engines, and how do they relate to KMP?",
    a: [
      {
        t: "p",
        text: "A Ktor `HttpClient` needs an *engine* — the platform-specific HTTP implementation: `OkHttp`/`CIO`/`Android` on Android/JVM, `Darwin` on iOS, `Js` on web. The API is the same across engines, so your networking code is *shared* in KMP `commonMain` and each platform plugs in its engine. This is why Ktor is the go-to networking library for Kotlin Multiplatform.",
      },
      {
        t: "list",
        items: [
          "**Engine** — platform HTTP impl (OkHttp/CIO/Android, Darwin/iOS, Js).",
          "**Same API** — engine-agnostic client code.",
          "**KMP** — shared networking in commonMain; per-platform engine.",
          "**Choice** — pick the engine per platform's strengths.",
        ],
      },
      {
        t: "note",
        text: "A Ktor HttpClient uses a platform engine (OkHttp/CIO/Android on JVM, Darwin on iOS, Js on web) behind a common API — so networking code is shared in KMP commonMain and each platform plugs in its engine. This engine abstraction is why Ktor is the standard KMP networking library.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle authentication and token refresh in Ktor?",
    a: [
      {
        t: "p",
        text: "Install the `Auth` plugin with `bearer { }`: `loadTokens` supplies the current access/refresh tokens, and `refreshTokens` is called automatically on a 401 to fetch new tokens (returning new `BearerTokens`). Ktor handles attaching the header and retrying — analogous to OkHttp's interceptor + Authenticator, but built-in and configured in one place.",
      },
      {
        t: "code",
        title: "Ktor Auth",
        code: `install(Auth) {
    bearer {
        loadTokens { BearerTokens(store.access(), store.refresh()) }
        refreshTokens {   // called on 401
            val new = api.refresh(oldTokens?.refreshToken)
            store.save(new); BearerTokens(new.access, new.refresh)
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`Auth { bearer { } }`** — built-in bearer token support.",
          "**`loadTokens`** — supply current tokens.",
          "**`refreshTokens`** — auto-called on 401 to refresh.",
          "**One place** — attaching + refreshing configured together.",
        ],
      },
      {
        t: "note",
        text: "Ktor's Auth plugin with bearer { }: loadTokens supplies current tokens, refreshTokens is auto-called on 401 to fetch new BearerTokens. Ktor attaches the header and retries — like OkHttp's interceptor + Authenticator but built-in and configured in one place.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you send and receive messages over a WebSocket in Ktor?",
    a: [
      {
        t: "p",
        text: "Install the `WebSockets` plugin, then open a session with `client.webSocket(url) { }`. Inside the session you `send(...)` frames and receive them by iterating `incoming` (a `ReceiveChannel<Frame>`) — reading `Frame.Text`/`Frame.Binary`. The session block is a coroutine, so it's structured and cancellable; leaving it closes the connection.",
      },
      {
        t: "code",
        title: "WebSocket session",
        code: `client.webSocket("wss://example.com/chat") {
    send(Frame.Text("hello"))
    for (frame in incoming) {
        if (frame is Frame.Text) handle(frame.readText())
    }
}   // leaving the block closes the connection`,
      },
      {
        t: "list",
        items: [
          "**`install(WebSockets)`** + **`client.webSocket(url) { }`** — open a session.",
          "**`send(Frame.Text/Binary)`** — send messages.",
          "**`for (frame in incoming)`** — receive frames.",
          "**Structured** — the session is a coroutine; leaving closes it.",
        ],
      },
      {
        t: "note",
        text: "Install WebSockets, open client.webSocket(url) { }: send(Frame.Text/Binary) to send, iterate incoming (ReceiveChannel<Frame>) to receive (readText/readBytes). The session is a coroutine (structured, cancellable) — leaving the block closes the connection.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you reconnect a WebSocket after a drop?",
    a: [
      {
        t: "p",
        text: "WebSockets drop on network changes, timeouts, or server restarts. Implement reconnection: wrap the session in a loop that, on disconnect/exception, waits with *exponential backoff + jitter* and reconnects — until cancelled. Re-authenticate and *re-subscribe* to any channels/topics on reconnect, and consider resuming from a last-received message id if the protocol supports it (to avoid missed messages).",
      },
      {
        t: "code",
        title: "Reconnect loop",
        code: `while (isActive) {
    try { client.webSocket(url) { collectMessages() } }
    catch (e: Exception) { /* connection dropped */ }
    delay(backoff()); backoff.increase()   // exponential + jitter
}`,
      },
      {
        t: "list",
        items: [
          "**Reconnect loop** — retry on drop with backoff + jitter.",
          "**Re-auth + re-subscribe** — restore state on reconnect.",
          "**Resume** — from a last message id if supported (avoid gaps).",
          "**Cancellable** — stop reconnecting when the scope is cancelled.",
        ],
      },
      {
        t: "note",
        text: "WebSockets drop on network changes/timeouts/restarts. Reconnect: loop that on disconnect waits (exponential backoff + jitter) and reconnects until cancelled; re-authenticate and re-subscribe to channels on reconnect, and resume from a last-received message id if the protocol supports it (avoid missed messages).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you keep a WebSocket alive (heartbeat/ping-pong)?",
    a: [
      {
        t: "p",
        text: "Idle connections can be dropped by intermediaries (NATs, proxies) or die silently. WebSockets use *ping/pong* control frames as a heartbeat — Ktor's `WebSockets` plugin can send periodic pings (`pingInterval`), and a missing pong signals a dead connection to trigger reconnection. Some apps also send app-level heartbeat messages. Heartbeats detect half-open connections the OS hasn't noticed.",
      },
      {
        t: "code",
        title: "Ping interval",
        code: `install(WebSockets) { pingInterval = 20_000 }   // ping every 20s`,
      },
      {
        t: "list",
        items: [
          "**Ping/pong frames** — keep the connection alive and detect death.",
          "**`pingInterval`** — Ktor sends periodic pings.",
          "**Missing pong** — signals a dead connection → reconnect.",
          "**App-level heartbeat** — some protocols add their own.",
        ],
      },
      {
        t: "note",
        text: "Idle WebSockets get dropped by intermediaries or die silently. Use ping/pong heartbeats — Ktor's WebSockets plugin sends periodic pings (pingInterval); a missing pong signals a dead connection to trigger reconnection. Detects half-open connections the OS hasn't noticed. Some protocols add app-level heartbeats.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the WebSocket handshake, and how does it upgrade from HTTP?",
    a: [
      {
        t: "p",
        text: "A WebSocket connection starts as an *HTTP request* with an `Upgrade: websocket` header (and `Connection: Upgrade`). If the server agrees (responding `101 Switching Protocols`), the same TCP connection is *upgraded* to the WebSocket protocol — a persistent, full-duplex channel. After the handshake, HTTP is gone; both sides send frames anytime. This is why WebSocket URLs use `ws://`/`wss://`.",
      },
      {
        t: "list",
        items: [
          "**Starts as HTTP** — `Upgrade: websocket` request.",
          "**`101 Switching Protocols`** — server accepts the upgrade.",
          "**Persistent full-duplex** — the connection becomes a WebSocket.",
          "**`ws://`/`wss://`** — WebSocket (and secure) schemes.",
        ],
      },
      {
        t: "note",
        text: "A WebSocket begins as an HTTP request with Upgrade: websocket; the server responds 101 Switching Protocols, upgrading the same TCP connection to a persistent full-duplex WebSocket channel (HTTP is then gone — both sides send frames anytime). URLs use ws://wss://.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you expose a WebSocket stream as a Flow?",
    a: [
      {
        t: "p",
        text: "Wrap the WebSocket session in a `callbackFlow` (or `flow`) that opens the connection, emits each incoming message, and closes it in `awaitClose`. Combine with a reconnect loop so the Flow re-establishes the connection transparently. Expose it (often via `shareIn`) so the UI collects messages reactively, with lifecycle-aware collection stopping the socket when off-screen.",
      },
      {
        t: "code",
        title: "WebSocket → Flow",
        code: `fun messages(): Flow<Message> = flow {
    client.webSocket(url) {
        for (frame in incoming) if (frame is Frame.Text) emit(parse(frame.readText()))
    }
}.retryWhen { _, _ -> delay(backoff()); true }   // reconnect
    .flowOn(Dispatchers.IO)`,
      },
      {
        t: "list",
        items: [
          "**`callbackFlow`/`flow`** — emit incoming messages; `awaitClose` cleanup.",
          "**Reconnect** — `retryWhen`/loop re-establishes the connection.",
          "**`shareIn`** — share one socket among collectors.",
          "**Lifecycle-aware** — stop the socket when the UI is off-screen.",
        ],
      },
      {
        t: "note",
        text: "Wrap the WebSocket session in a callbackFlow/flow that emits incoming messages (awaitClose cleanup), with a reconnect loop (retryWhen + backoff). Expose via shareIn so the UI collects reactively; collect lifecycle-aware so the socket stops when off-screen (WhileSubscribed).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Server-Sent Events (SSE), and how does it compare to WebSockets?",
    a: [
      {
        t: "p",
        text: "*Server-Sent Events* is a one-way (server→client) streaming protocol over plain HTTP — the server keeps the response open and pushes text events. It's simpler than WebSockets (no upgrade handshake, works over standard HTTP, auto-reconnect built in) but only *one direction* and text-only. Use SSE for server-push-only streams (notifications, live scores, progress); use WebSockets when you also need to send *to* the server.",
      },
      {
        t: "list",
        items: [
          "**SSE** — server→client only, over HTTP, text events, auto-reconnect.",
          "**Simpler** — no upgrade handshake; standard HTTP infrastructure.",
          "**One direction** — can't send to the server (use a separate POST).",
          "**WebSocket** — when bidirectional communication is needed.",
        ],
      },
      {
        t: "note",
        text: "SSE is one-way server→client streaming over plain HTTP (text events, built-in auto-reconnect) — simpler than WebSockets (no handshake, standard HTTP) but single-direction and text-only. Use SSE for server-push-only (notifications/scores/progress); WebSockets when you also send to the server.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the mobile-specific challenges of maintaining a WebSocket?",
    a: [
      {
        t: "p",
        text: "Mobile connections are unstable: networks switch (Wi-Fi↔cellular), the app is backgrounded (the OS may kill the connection or the process), radios sleep (Doze), and battery/data are constrained. So a persistent WebSocket needs robust reconnection, must handle backgrounding (often closing the socket and relying on FCM push when backgrounded), and shouldn't hold the connection open needlessly (battery drain). Tie it to a lifecycle/foreground scope.",
      },
      {
        t: "list",
        items: [
          "**Network switches** — Wi-Fi↔cellular drops the connection; reconnect.",
          "**Backgrounding/Doze** — OS may kill it; close on background, use FCM push.",
          "**Battery/data** — a held socket drains; don't keep it open needlessly.",
          "**Lifecycle-scoped** — connect while foreground/visible.",
        ],
      },
      {
        t: "note",
        text: "Mobile WebSocket challenges: network switches (Wi-Fi↔cellular) drop connections; backgrounding/Doze can kill the socket/process; battery/data constraints. So: robust reconnection, close on background and rely on FCM push, don't hold the socket needlessly (drain), and scope it to foreground/visible lifecycle.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle timeouts and retries in Ktor?",
    a: [
      {
        t: "p",
        text: "Install the `HttpTimeout` plugin (`requestTimeoutMillis`, `connectTimeoutMillis`, `socketTimeoutMillis`) to bound requests, and the `HttpRequestRetry` plugin to retry failed requests with a configurable policy (which responses/exceptions to retry, max retries, exponential delay). Both are composed on the client, so timeout/retry behavior is centralized rather than per-call.",
      },
      {
        t: "code",
        title: "Timeout + retry plugins",
        code: `HttpClient(CIO) {
    install(HttpTimeout) { requestTimeoutMillis = 30_000; connectTimeoutMillis = 10_000 }
    install(HttpRequestRetry) {
        retryOnServerErrors(maxRetries = 3)
        exponentialDelay()
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`HttpTimeout`** — request/connect/socket timeouts.",
          "**`HttpRequestRetry`** — retry policy (which, how many, delay).",
          "**`retryOnServerErrors` / `exponentialDelay`** — sensible defaults.",
          "**Centralized** — configured on the client, not per call.",
        ],
      },
      {
        t: "note",
        text: "Ktor: install HttpTimeout (requestTimeoutMillis/connect/socket) to bound requests, and HttpRequestRetry (retryOnServerErrors, maxRetries, exponentialDelay) for retries — both composed on the client, centralizing timeout/retry behavior rather than per-call.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle backpressure with a high-frequency WebSocket stream?",
    a: [
      {
        t: "p",
        text: "If the server pushes messages faster than the UI can process, apply Flow backpressure: `conflate()` or `sample()` to show only the latest (live prices), `buffer()` to decouple and process all, or `collectLatest` to cancel stale processing. Process/parse messages off the main thread (`flowOn(Default)`), and batch UI updates. Don't update the UI per message at high frequency — it janks.",
      },
      {
        t: "list",
        items: [
          "**Latest-only** — `conflate`/`sample` for live values (prices).",
          "**Process all** — `buffer` to decouple; parse off main.",
          "**`collectLatest`** — cancel stale processing.",
          "**Batch UI** — don't render per message at high frequency.",
        ],
      },
      {
        t: "note",
        text: "For a fast WebSocket stream, apply Flow backpressure: conflate/sample (latest-only — live prices), buffer (process all, decoupled), or collectLatest (cancel stale). Parse off the main thread (flowOn(Default)) and batch UI updates — don't render per message at high frequency (jank).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test WebSocket or Ktor networking code?",
    a: [
      {
        t: "p",
        text: "Ktor provides `MockEngine` — you supply a lambda that returns canned responses for requests, so you test the client's request building and response handling without a real server. For WebSockets, abstract the connection behind a repository interface with a fake that emits scripted messages, and test your reconnection/backpressure logic against it (with `runTest`).",
      },
      {
        t: "list",
        items: [
          "**Ktor `MockEngine`** — canned responses; no real server.",
          "**Abstract the socket** — a repository interface + fake stream.",
          "**Test reconnection/backpressure** — against scripted messages.",
          "**`runTest`** — deterministic coroutine testing.",
        ],
      },
      {
        t: "note",
        text: "Ktor: use MockEngine (return canned responses per request) to test request building/response handling without a server. For WebSockets, abstract the connection behind a repository interface with a fake emitting scripted messages, and test reconnection/backpressure logic against it under runTest.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a WebSocket frame, and what types are there?",
    a: [
      {
        t: "p",
        text: "WebSocket data is sent in *frames*. The main data frames are `Text` (UTF-8 strings, usually JSON) and `Binary` (raw bytes). There are also *control frames*: `Ping`/`Pong` (heartbeat) and `Close` (graceful shutdown with a status code/reason). In Ktor you match on `Frame.Text`/`Frame.Binary`/`Frame.Close` when reading `incoming`.",
      },
      {
        t: "list",
        items: [
          "**`Text`** — UTF-8 strings (JSON messages).",
          "**`Binary`** — raw bytes (protobuf, files).",
          "**`Ping`/`Pong`** — heartbeat control frames.",
          "**`Close`** — graceful shutdown (status + reason).",
        ],
      },
      {
        t: "note",
        text: "WebSocket data is framed: Text (UTF-8 strings, usually JSON) and Binary (raw bytes) data frames, plus control frames Ping/Pong (heartbeat) and Close (graceful shutdown with status/reason). In Ktor, match Frame.Text/Binary/Close on incoming.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you manage a single shared WebSocket connection across the app?",
    a: [
      {
        t: "p",
        text: "Wrap the connection in a *singleton repository* (app-scoped) that owns one `HttpClient` session, exposes incoming messages as a *shared hot flow* (`shareIn` with `WhileSubscribed`), and provides send/subscribe methods. All features use this one connection instead of each opening their own — saving battery and coordinating subscriptions. The connection lives while subscribed and reconnects transparently.",
      },
      {
        t: "list",
        items: [
          "**Singleton repository** — owns one connection.",
          "**Shared hot flow** — `shareIn(WhileSubscribed)` for messages.",
          "**One connection** — all features multiplex over it.",
          "**Transparent reconnect** — inside the repository.",
        ],
      },
      {
        t: "note",
        text: "Own the WebSocket in an app-scoped singleton repository: one session, incoming messages exposed as a shared hot flow (shareIn WhileSubscribed), with send/subscribe methods. All features share one connection (saves battery, coordinates subscriptions); it lives while subscribed and reconnects transparently.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do WebSockets interact with app backgrounding and Doze?",
    a: [
      {
        t: "p",
        text: "When the app is backgrounded or the device enters *Doze*, the OS restricts network access and may kill the connection or the process — so you *can't reliably keep a WebSocket open in the background*. The pattern: keep the socket only while foregrounded, close it on background, and use *FCM push* to wake the app or deliver messages when backgrounded. For must-stay-connected apps (calls), use a foreground service.",
      },
      {
        t: "list",
        items: [
          "**Background/Doze** — network restricted; connection likely killed.",
          "**Foreground only** — keep the socket while visible; close on background.",
          "**FCM push** — deliver/wake when backgrounded.",
          "**Foreground service** — for must-stay-connected apps (calls).",
        ],
      },
      {
        t: "note",
        text: "Backgrounding/Doze restrict network access and can kill the WebSocket/process — you can't reliably keep it open in the background. Keep the socket foreground-only (close on background) and use FCM push to deliver/wake when backgrounded; use a foreground service for must-stay-connected apps (calls).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle content negotiation and serialization in Ktor?",
    a: [
      {
        t: "p",
        text: "Install the `ContentNegotiation` plugin with a serializer (`json()` using kotlinx.serialization) — then request/response bodies are automatically serialized/deserialized based on `Content-Type`. You call `.body<T>()` to get a typed result and `setBody(obj)` to send one; Ktor handles the JSON conversion. You can register multiple content types (JSON, XML) and Ktor picks by negotiation.",
      },
      {
        t: "code",
        title: "ContentNegotiation",
        code: `HttpClient(CIO) {
    install(ContentNegotiation) {
        json(Json { ignoreUnknownKeys = true })
    }
}
val user: User = client.get(url).body()     // auto-deserialized`,
      },
      {
        t: "list",
        items: [
          "**`ContentNegotiation` + `json()`** — kotlinx.serialization integration.",
          "**`.body<T>()` / `setBody(obj)`** — typed (de)serialization.",
          "**By `Content-Type`** — negotiated automatically.",
          "**Multiple formats** — register JSON/XML; Ktor picks.",
        ],
      },
      {
        t: "note",
        text: "Install ContentNegotiation with json() (kotlinx.serialization) — bodies auto-(de)serialize by Content-Type; call .body<T>() for typed results and setBody(obj) to send. Register multiple content types (JSON/XML) and Ktor negotiates. Configure the Json (ignoreUnknownKeys) as usual.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle message ordering and delivery guarantees over WebSockets?",
    a: [
      {
        t: "p",
        text: "WebSockets deliver messages *in order* over a single connection (TCP guarantees ordering), but a *reconnect* can create gaps (messages sent while disconnected are missed) unless the protocol supports resuming from a last-received id/sequence. For at-least-once delivery, the app acknowledges messages and the server resends unacknowledged ones; for exactly-once, dedupe by message id. Design the protocol for your delivery needs — WebSockets alone don't guarantee delivery across reconnects.",
      },
      {
        t: "list",
        items: [
          "**In-order on one connection** — TCP guarantees ordering.",
          "**Reconnect gaps** — resume from a last id/sequence to avoid missing messages.",
          "**At-least-once** — ack + server resend of unacked.",
          "**Exactly-once** — dedupe by message id.",
        ],
      },
      {
        t: "note",
        text: "WebSockets deliver in order over one connection (TCP), but reconnects create gaps unless you resume from a last-received id/sequence. For at-least-once: ack messages + server resends unacked; for exactly-once: dedupe by message id. WebSockets alone don't guarantee delivery across reconnects — design the protocol.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between Ktor Client and Ktor Server?",
    a: [
      {
        t: "p",
        text: "Ktor is *both* a client and a server framework. *Ktor Client* is the HTTP client you use in an app to *call* APIs (what mobile devs use, often in KMP). *Ktor Server* is a framework to *build* backend HTTP servers/APIs in Kotlin. They share concepts (plugins, coroutines) but are separate libraries — on Android you use Ktor Client.",
      },
      {
        t: "list",
        items: [
          "**Ktor Client** — call APIs from an app (mobile/KMP use).",
          "**Ktor Server** — build backends/APIs in Kotlin.",
          "**Shared concepts** — plugins, coroutine-based, pipelines.",
          "**Android** — you use Ktor Client.",
        ],
      },
      {
        t: "note",
        text: "Ktor is both: Ktor Client (an HTTP client to call APIs — what mobile/KMP apps use) and Ktor Server (a framework to build backends in Kotlin). They share plugin/coroutine concepts but are separate libraries. On Android you use Ktor Client.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you manage the HttpClient lifecycle (sharing and closing)?",
    a: [
      {
        t: "p",
        text: "Creating an `HttpClient` is expensive (it holds an engine, connection pool, coroutine scope), so create *one shared instance* (a DI singleton) and reuse it — like sharing an OkHttpClient. It should live for the app's lifetime; call `client.close()` only when truly done (rarely in an app). Don't create a new client per request — that leaks resources and defeats connection pooling.",
      },
      {
        t: "list",
        items: [
          "**Expensive** — engine, connection pool, coroutine scope.",
          "**Share one** — DI singleton, app-lifetime.",
          "**`close()`** — only when truly done (rare in an app).",
          "**Never per-request** — leaks resources, no pooling.",
        ],
      },
      {
        t: "note",
        text: "An HttpClient is expensive (engine, connection pool, coroutine scope) — create one shared DI singleton for the app's lifetime and reuse it (like OkHttpClient). Call close() only when truly done (rare in an app). Never create a client per request (leaks resources, defeats connection pooling).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you gracefully close a WebSocket, and what are close codes?",
    a: [
      {
        t: "p",
        text: "To close cleanly, send a *Close frame* with a *status code* and reason (`close(CloseReason(CloseReason.Codes.NORMAL, \"done\"))`) — both sides then tear down the TCP connection. Standard codes include `1000` (normal), `1001` (going away), `1011` (server error). Reading a `Frame.Close` from `incoming` tells you the peer initiated closure. Always close in a `finally`/`awaitClose` so the connection isn't leaked.",
      },
      {
        t: "list",
        items: [
          "**Close frame + code** — `close(CloseReason(NORMAL, ...))`.",
          "**Codes** — 1000 normal, 1001 going away, 1011 server error.",
          "**`Frame.Close`** — peer-initiated closure.",
          "**Clean up** — close in finally/awaitClose to avoid leaks.",
        ],
      },
      {
        t: "note",
        text: "Close gracefully with a Close frame + status code (close(CloseReason(NORMAL, \"done\"))) — both sides tear down TCP. Codes: 1000 normal, 1001 going away, 1011 server error. A Frame.Close on incoming = peer-initiated close. Always close in finally/awaitClose to avoid leaking the connection.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you multiplex multiple subscriptions over one WebSocket?",
    a: [
      {
        t: "p",
        text: "Instead of one connection per topic, use *one* WebSocket and a *message protocol* with a `type`/`channel`/`subscriptionId` field. The client sends `subscribe`/`unsubscribe` messages, and each incoming message carries its channel so you route it to the right subscriber (a `Flow` per topic, filtered from the shared stream). This saves connections/battery and is how real apps handle many live data streams over one socket.",
      },
      {
        t: "list",
        items: [
          "**One connection** — multiplex topics with a channel/id in each message.",
          "**Subscribe/unsubscribe** — control messages manage topics.",
          "**Route by channel** — filter the shared stream into per-topic flows.",
          "**Efficient** — one socket vs many; less battery.",
        ],
      },
      {
        t: "note",
        text: "Multiplex over one WebSocket with a message protocol (type/channel/subscriptionId): the client sends subscribe/unsubscribe control messages, and each incoming message's channel routes it to the right per-topic Flow (filtered from the shared stream). One connection for many streams — saves connections/battery.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is long polling, and how does it compare to WebSockets?",
    a: [
      {
        t: "p",
        text: "*Long polling* is an HTTP technique where the client makes a request and the server *holds it open* until it has data (or a timeout), then responds; the client immediately re-requests. It simulates push over plain HTTP without a persistent protocol — simpler and firewall-friendly, but higher overhead (repeated requests/headers) and latency than WebSockets. Use it as a fallback when WebSockets aren't available; prefer WebSockets/SSE for true real-time.",
      },
      {
        t: "list",
        items: [
          "**Long polling** — server holds the request open until data, then client re-requests.",
          "**Simulates push** — over plain HTTP; firewall-friendly.",
          "**Overhead** — repeated request/header cost, more latency.",
          "**Fallback** — when WebSockets aren't available.",
        ],
      },
      {
        t: "note",
        text: "Long polling: the client requests, the server holds it open until data (or timeout), responds, and the client immediately re-requests — simulating push over plain HTTP (simple, firewall-friendly) but with higher overhead/latency than WebSockets. Use as a fallback; prefer WebSockets/SSE for true real-time.",
      },
    ],
  },
];

export default qa;
