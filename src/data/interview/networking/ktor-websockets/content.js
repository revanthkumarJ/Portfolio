// Ktor & WebSockets — Content tab. Teaching-first.

const content = [
  {
    heading: "Ktor Client — the KMP networking library",
    blocks: [
      {
        t: "p",
        text: "**Ktor** is a Kotlin networking library from JetBrains. The **Ktor Client** is the relevant part for apps — it's an HTTP client written in pure Kotlin with coroutines, and crucially it's **multiplatform**: the same networking code runs on Android, iOS, desktop, and web. This is why Ktor is the standard networking choice for **Kotlin Multiplatform (KMP)** projects, where Retrofit (JVM/Android-only) can't be used in shared code.",
      },
      {
        t: "code",
        title: "A Ktor client and a request",
        code: `val client = HttpClient(CIO) {                 // CIO = the engine (platform-specific)
    install(ContentNegotiation) {
        json(Json { ignoreUnknownKeys = true })  // kotlinx.serialization
    }
    install(HttpTimeout) { requestTimeoutMillis = 15_000 }
    install(Logging) { level = LogLevel.HEADERS }
    defaultRequest { url("https://api.example.com/") }
}

// Requests are suspend functions returning typed results
suspend fun getUser(id: String): UserDto =
    client.get("users/$id").body()            // auto-parsed via ContentNegotiation

suspend fun createUser(user: CreateUserRequest): UserDto =
    client.post("users") {
        contentType(ContentType.Application.Json)
        setBody(user)                          // serialized to JSON
    }.body()`,
      },
      {
        t: "list",
        items: [
          "**Engine + config**: a Ktor client has an *engine* (the actual HTTP implementation — `CIO`, `OkHttp`, `Darwin` for iOS, `Android`) and a set of installed *plugins* (features). The engine is platform-specific (chosen per target via expect/actual); the client code is shared.",
          "**Plugins (features)**: `ContentNegotiation` (serialization, integrates kotlinx.serialization), `HttpTimeout`, `Logging`, `Auth` (token auth), `HttpRequestRetry` (retries), `HttpCache`. You install what you need — Ktor is modular.",
          "**Coroutine-native**: all requests are `suspend` functions; responses are parsed with `.body<T>()`. No interface-generation like Retrofit — you write request functions directly.",
        ],
      },
    ],
  },
  {
    heading: "Ktor vs Retrofit",
    blocks: [
      {
        t: "table",
        headers: ["", "Retrofit (+OkHttp)", "Ktor Client"],
        rows: [
          ["Platform", "JVM/Android only", "Multiplatform (Android, iOS, desktop, web)"],
          ["API style", "declarative interface + annotations", "imperative request functions (DSL)"],
          ["Underlying engine", "OkHttp", "pluggable (CIO, OkHttp, Darwin, ...)"],
          ["Maturity on Android", "very mature, huge ecosystem", "growing; standard for KMP"],
          ["Best for", "Android-only apps", "KMP / shared networking code"],
        ],
      },
      {
        t: "list",
        items: [
          "**Choose Retrofit** for Android-only apps — it's extremely mature, has a huge ecosystem, and the declarative interface style is concise for REST.",
          "**Choose Ktor** for KMP projects, where networking must live in `commonMain` and run on iOS too — Retrofit can't. On an all-Android project Ktor is also fine but has less momentum.",
          "**They share concepts**: both are coroutine-based, both integrate kotlinx.serialization, both support interceptors/plugins for auth/logging/retry — so the mental model transfers. Ktor can even use OkHttp as its engine on Android (getting OkHttp's connection pooling under Ktor's API).",
          "**For an Android/KMP engineer**: know both — Retrofit for Android-specific code, Ktor for the shared KMP layer.",
        ],
      },
    ],
  },
  {
    heading: "WebSockets — real-time bidirectional communication",
    blocks: [
      {
        t: "p",
        text: "HTTP is request/response — the client asks, the server answers, then the connection is done. For **real-time** features (chat, live updates, presence, live scores), that's inefficient: you'd have to poll (repeatedly ask 'anything new?'). A **WebSocket** is a *persistent, bidirectional* connection: after an initial handshake (which upgrades an HTTP connection), both client and server can send messages to each other *at any time* over the open connection, until one side closes it.",
      },
      {
        t: "list",
        items: [
          "**Persistent** — the connection stays open, unlike HTTP's one-shot request/response. No repeated connection setup.",
          "**Bidirectional (full-duplex)** — the *server* can push messages to the client without the client asking (impossible with plain HTTP request/response). And the client can send anytime too.",
          "**Efficient for real-time** — no polling overhead, low latency, instant delivery. Ideal for chat, live feeds, collaborative editing, notifications, live dashboards.",
          "**Starts as HTTP** — a WebSocket connection begins with an HTTP request with an `Upgrade: websocket` header; the server agrees, and the connection 'upgrades' to the WebSocket protocol (`ws://` or secure `wss://`).",
        ],
      },
    ],
  },
  {
    heading: "WebSockets in practice — polling vs WebSockets vs SSE",
    blocks: [
      {
        t: "code",
        title: "A WebSocket with Ktor, exposed as a Flow",
        code: `fun observeMessages(): Flow<ChatMessage> = callbackFlow {
    client.webSocket(urlString = "wss://chat.example.com/ws") {
        try {
            for (frame in incoming) {                 // receive messages as they arrive
                if (frame is Frame.Text) {
                    trySend(Json.decodeFromString(frame.readText()))
                }
            }
        } finally { /* connection closed */ }
    }
    awaitClose { /* cleanup */ }
}`,
      },
      {
        t: "table",
        headers: ["Approach", "How", "Use when"],
        rows: [
          ["Polling", "repeatedly GET on a timer", "simple, infrequent updates; wasteful and laggy for real-time"],
          ["Long polling", "hold a request open until data is ready", "near-real-time without WebSockets; a middle ground"],
          ["WebSockets", "persistent bidirectional connection", "true real-time, bidirectional (chat, live collab)"],
          ["Server-Sent Events (SSE)", "server pushes over a one-way HTTP stream", "server→client only updates (live feed, notifications) — simpler than WS"],
        ],
      },
      {
        t: "list",
        items: [
          "**WebSockets vs polling**: polling wastes battery/data (constant requests, most returning 'nothing new') and adds latency (updates only arrive on the next poll). WebSockets push instantly with one connection. But WebSockets need connection management (reconnection, heartbeats).",
          "**SSE (Server-Sent Events)** — a simpler alternative when you only need *server → client* pushing (a live feed, notifications). It's a one-way HTTP stream, easier to implement and more firewall-friendly than WebSockets, but not bidirectional.",
          "**Connection management is the hard part**: WebSockets drop (network changes, backgrounding, server restarts), so you need *reconnection with backoff*, *heartbeats/pings* to detect dead connections, and handling of message ordering/buffering across reconnects. Expose the stream as a Flow (via `callbackFlow`) so the UI observes it cleanly.",
          "**Both OkHttp and Ktor support WebSockets** — OkHttp has a `WebSocket` API with a listener; Ktor has `client.webSocket { }` with coroutine-based `incoming`/`send`.",
        ],
      },
      {
        t: "note",
        text: "Ktor = pure-Kotlin, multiplatform HTTP client (engine + plugins, coroutine-native) — the KMP networking standard where Retrofit (Android-only) can't go; use Retrofit for Android-only, Ktor for shared KMP code. WebSockets = persistent, bidirectional connection for real-time (chat, live updates) — the server can push, no polling; starts as an HTTP upgrade. Alternatives: polling (simple, wasteful), long polling (middle ground), SSE (server→client only, simpler). Key challenge: connection management (reconnect + backoff, heartbeats); expose as a Flow via callbackFlow.",
      },
    ],
  },
];

export default content;
