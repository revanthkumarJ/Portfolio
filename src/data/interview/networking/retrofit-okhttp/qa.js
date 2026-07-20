// Retrofit & OkHttp — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is the relationship between Retrofit and OkHttp?",
    a: [
      {
        t: "p",
        text: "**They're two layers of the same networking stack. OkHttp is the actual HTTP client — the engine that does the network work; Retrofit is a type-safe wrapper on top of OkHttp that makes calling REST APIs ergonomic.**",
      },
      {
        t: "list",
        items: [
          "**OkHttp** handles the low-level HTTP: opening and pooling connections, sending requests, receiving responses, TLS, caching, timeouts, retries, and interceptors. You *can* use it directly, but it's manual — you build requests and parse responses yourself.",
          "**Retrofit** sits on top: you declare your API as a Kotlin interface with annotations (`@GET(\"users/{id}\")`), and Retrofit generates the code that turns a method call into an OkHttp request and parses the JSON response into your objects. It delegates the actual HTTP work to OkHttp.",
        ],
      },
      {
        t: "p",
        text: "So the division is: Retrofit gives you the *type-safe, declarative interface* (describe the API, get parsed results), and OkHttp is the *underlying HTTP machinery* it runs on. When you configure things like timeouts, interceptors (for auth/logging), and caching, you do that on the OkHttpClient and hand it to Retrofit. Together they're the standard Android REST networking stack.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you define an API endpoint in Retrofit?",
    a: [
      {
        t: "p",
        text: "**You declare a Kotlin interface where each method represents an endpoint, annotated with the HTTP method and path, and Retrofit generates the implementation.** The method's parameters are annotated to describe how they map into the request.",
      },
      {
        t: "code",
        title: "An interface with common annotations",
        code: `interface UserApi {
    @GET("users/{id}")
    suspend fun getUser(@Path("id") id: String): UserDto      // path param

    @GET("users")
    suspend fun getUsers(@Query("page") page: Int): List<UserDto>  // query param

    @POST("users")
    suspend fun create(@Body body: CreateUserRequest): UserDto     // JSON body
}`,
      },
      {
        t: "list",
        items: [
          "**Method annotations** — `@GET`, `@POST`, `@PUT`, `@DELETE`, `@PATCH`, with the relative path in the annotation.",
          "**Parameter annotations** — `@Path` (substitute into the URL), `@Query` (add a `?key=value`), `@Body` (serialize an object as the JSON request body), `@Header` (add a header).",
          "**`suspend`** — make the function `suspend` and it's automatically main-safe (Retrofit runs the network off the main thread) and returns the parsed result directly.",
        ],
      },
      {
        t: "p",
        text: "You then get the working implementation with `retrofit.create(UserApi::class.java)` — Retrofit builds it via a dynamic proxy. Returning `T` directly gives you the parsed body (throwing on HTTP errors), or you can return `Response<T>` to access the status code and headers for manual handling. This declarative approach means you describe *what* the API looks like and Retrofit handles all the request-building and response-parsing boilerplate.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does making a Retrofit function 'suspend' do?",
    a: [
      {
        t: "p",
        text: "**Making a Retrofit API function `suspend` gives you native coroutine support: the function is main-safe (Retrofit automatically runs the network call off the main thread) and returns the parsed result directly, so you can `await` it in sequential-looking code.** You call it from a coroutine and it suspends while the network request happens, then resumes with the result.",
      },
      {
        t: "code",
        title: "Calling a suspend Retrofit function",
        code: `// In a repository (main-safe — no withContext needed)
suspend fun loadUser(id: String): User = api.getUser(id).toDomain()

// In a ViewModel
viewModelScope.launch {
    val user = repository.loadUser("42")   // suspends during network, resumes with result
    _state.value = UiState.Content(user)
}`,
      },
      {
        t: "p",
        text: "The key points: it's **main-safe**, so you can call it from a main-thread coroutine (`viewModelScope`) without wrapping it in `withContext(Dispatchers.IO)` — Retrofit handles the threading internally (wrapping it is redundant). It returns the parsed body directly (throwing `HttpException` on non-2xx or `IOException` on network failure), which you handle with try/catch or by returning `Response<T>`. And it integrates with structured concurrency — if the calling coroutine is cancelled (the user leaves the screen), Retrofit cancels the underlying HTTP call. This is the modern approach; older Retrofit used `Call<T>` with `enqueue` callbacks (verbose, leak-prone) or RxJava. Suspend functions make networking read like simple sequential code.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is an OkHttp interceptor and what would you use one for?",
    a: [
      {
        t: "p",
        text: "**An interceptor is OkHttp's middleware — it sits in the request/response pipeline and can observe, modify, or short-circuit requests and responses.** Every outgoing request passes through the chain of interceptors, and every incoming response comes back through them, so it's the place to add *cross-cutting* networking concerns that should apply to many or all requests.",
      },
      {
        t: "code",
        title: "Adding an auth token to every request",
        code: `class AuthInterceptor(private val token: () -> String) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request().newBuilder()
            .addHeader("Authorization", "Bearer \${token()}")
            .build()
        return chain.proceed(request)
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Adding auth headers** — attach the `Authorization` token to every request in one place, instead of repeating it on each API method.",
          "**Logging** — `HttpLoggingInterceptor` logs requests/responses for debugging (BODY level in debug, NONE in release).",
          "**Adding common headers** — API keys, trace/analytics headers, `Accept-Language`, app version.",
          "**Retry / caching logic** — custom retry on specific failures, or tweaking cache behavior.",
        ],
      },
      {
        t: "p",
        text: "The value is *centralization* — a concern like auth applies to every request, and an interceptor lets you implement it once rather than in every call. You add them with `addInterceptor` on the OkHttpClient builder. They run in the order added, and calling `chain.proceed(request)` continues the chain (you can also short-circuit by returning a response without proceeding, which is how response mocking in tests works).",
      },
    ],
  },
  {
    level: "senior",
    q: "Why should you share a single OkHttpClient/Retrofit instance across the app?",
    a: [
      {
        t: "p",
        text: "**Because OkHttp maintains shared, expensive resources — a connection pool, a thread pool, and optionally a response cache — that are meant to be reused across all requests. Creating a new client per request (or per screen) discards those benefits and wastes resources.**",
      },
      {
        t: "list",
        items: [
          "**Connection pooling** — the big one. OkHttp *reuses* TCP/TLS connections across requests (keep-alive) instead of opening a new one each time. Establishing a connection, especially the TLS handshake, is *expensive* (multiple round trips). A shared client reuses warm connections, dramatically reducing latency for subsequent requests to the same host. A new client per request means a cold connection (full handshake) every time — much slower and more battery/data.",
          "**Thread pool** — OkHttp has a dispatcher with a thread pool for async requests; each client creates its own. Many clients = many thread pools = wasted memory and threads.",
          "**Response cache** — if you configure an HTTP cache, it's tied to the client; multiple clients would have separate (or conflicting) caches, defeating caching.",
          "**Consistent configuration** — interceptors (auth, logging), timeouts, and TLS settings live on the client. One shared, correctly-configured client ensures every request behaves consistently; ad-hoc clients drift.",
        ],
      },
      {
        t: "list",
        items: [
          "**How to share it**: provide the OkHttpClient and Retrofit as *singletons* via dependency injection (Hilt `@Singleton`). All API interfaces are created from the one Retrofit instance, which uses the one OkHttpClient.",
          "**When you DO create variants**: sometimes you need a *specialized* client (different timeouts for a long-polling endpoint, a different interceptor set for an unauthenticated auth endpoint) — but you create it by *sharing the base client's pool* (`baseClient.newBuilder()...build()`), which reuses the underlying connection pool and thread pool while overriding specific settings. You never build a fully independent client just to change one setting.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: OkHttp is *designed* around a shared client — the connection pool is the performance heart of the library, and it only helps if reused. Creating clients per request is a classic performance mistake that shows up as slow requests (repeated TLS handshakes), excess memory (duplicate thread pools), and broken caching. The correct pattern — one DI-provided singleton, with `newBuilder()` for the rare specialized variant that still shares the pool — is both the performance-correct and the maintainability-correct choice.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do timeouts work in OkHttp, and why are they important?",
    a: [
      {
        t: "p",
        text: "**Timeouts bound how long different phases of a request can take before OkHttp gives up and fails the request. Without them, a request can hang indefinitely on a bad network, holding resources and leaving the user staring at a spinner forever.** OkHttp has several distinct timeouts for different phases:",
      },
      {
        t: "list",
        items: [
          "**`connectTimeout`** — the maximum time to *establish* the connection to the server (TCP + TLS handshake). If the server is unreachable or very slow to connect, this fires.",
          "**`readTimeout`** — the maximum time to wait for *data* once connected — specifically, the max gap between bytes arriving. If the server accepts the connection but then stalls (sends nothing), this fires. This is the most commonly hit one on flaky networks.",
          "**`writeTimeout`** — the maximum time to *send* the request body to the server (relevant for large uploads).",
          "**`callTimeout`** — an overall cap on the *entire* call (connect + write + read + redirects). A safety net that bounds total time regardless of the per-phase timeouts.",
        ],
      },
      {
        t: "list",
        items: [
          "**Why they're important**: mobile networks fail in ways that *hang* rather than cleanly error — a connection that never completes, a server that stops responding mid-response. Without timeouts, the coroutine/thread waits forever, the UI shows an eternal spinner, resources (connections, threads) are tied up, and the user can't tell if it's working. Timeouts convert 'hung forever' into a *prompt, handleable failure* so you can show an error and offer retry.",
          "**Choosing values**: too short and you fail requests that would have succeeded on a slow-but-working network (frustrating on poor connections); too long and the user waits ages before seeing an error. Typical values are 10-30 seconds, tuned per endpoint — a quick API call might use 15s, while a large file upload needs a longer write/call timeout. You can override per-request with `newBuilder()` for endpoints with different needs.",
          "**Timeouts + retries together**: a timeout produces an `IOException`/`SocketTimeoutException`, which your retry logic can catch and retry (with backoff) — since a timeout is often transient. So timeouts and retry policy work together to make networking resilient.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: timeouts are a *reliability* requirement, not an optional tuning knob — on unreliable mobile networks, requests hang, and unbounded waits are a real UX and resource-leak problem. The discipline is: always set sensible timeouts (never rely on 'no timeout'), pick per-phase values matched to the endpoint (short for quick APIs, longer for uploads), use `callTimeout` as an overall safety net, and pair timeouts with retry-on-transient-failure so a timed-out request gets a bounded retry rather than either hanging or failing permanently.",
      },
    ],
  },
];

export default qa;
