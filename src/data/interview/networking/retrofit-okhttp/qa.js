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
  {
    level: "junior",
    q: "What are the Retrofit HTTP method annotations?",
    a: [
      {
        t: "p",
        text: "Retrofit maps interface methods to HTTP requests via annotations: `@GET`, `@POST`, `@PUT`, `@PATCH`, `@DELETE`, `@HEAD` — each takes the relative URL path. `@GET` fetches, `@POST` creates, `@PUT` replaces, `@PATCH` partially updates, `@DELETE` removes. You add a request body with `@Body` for the ones that carry data.",
      },
      {
        t: "code",
        title: "Method annotations",
        code: `interface Api {
    @GET("users/{id}") suspend fun getUser(@Path("id") id: String): User
    @POST("users") suspend fun create(@Body user: User): User
    @PUT("users/{id}") suspend fun replace(@Path("id") id: String, @Body u: User): User
    @PATCH("users/{id}") suspend fun update(@Path("id") id: String, @Body u: PatchDto): User
    @DELETE("users/{id}") suspend fun delete(@Path("id") id: String)
}`,
      },
      {
        t: "list",
        items: [
          "**`@GET`/`@DELETE`** — fetch/remove (path + query params).",
          "**`@POST`/`@PUT`/`@PATCH`** — create/replace/update (with `@Body`).",
          "**Relative path** — resolved against the base URL.",
          "**`@HEAD`** — headers only.",
        ],
      },
      {
        t: "note",
        text: "Retrofit method annotations map interface functions to HTTP: @GET/@POST/@PUT/@PATCH/@DELETE/@HEAD with a relative path. @GET fetches, @POST creates, @PUT replaces, @PATCH partially updates, @DELETE removes; add @Body for data-carrying requests. Paths resolve against the base URL.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the Retrofit parameter annotations (@Path, @Query, @Body, @Header)?",
    a: [
      {
        t: "p",
        text: "Parameter annotations bind function arguments to parts of the request: `@Path` fills a URL path placeholder, `@Query` adds a query parameter, `@QueryMap` a map of them, `@Body` sets the request body (serialized), `@Header`/`@HeaderMap` add headers, and `@Field`/`@Part` for form/multipart bodies.",
      },
      {
        t: "code",
        title: "Parameter binding",
        code: `@GET("search")
suspend fun search(
    @Query("q") query: String,
    @Query("page") page: Int = 1,
    @Header("Authorization") token: String,
): SearchResult

@GET("repos/{owner}/{repo}")
suspend fun repo(@Path("owner") owner: String, @Path("repo") repo: String): Repo`,
      },
      {
        t: "list",
        items: [
          "**`@Path`** — fill a `{placeholder}` in the URL.",
          "**`@Query`/`@QueryMap`** — query string parameters.",
          "**`@Body`** — the serialized request body.",
          "**`@Header`/`@HeaderMap`** — request headers.",
        ],
      },
      {
        t: "note",
        text: "Parameter annotations bind args to the request: @Path (URL placeholder), @Query/@QueryMap (query params), @Body (serialized body), @Header/@HeaderMap (headers), @Field/@Part (form/multipart). Nullable @Query params are omitted when null — handy for optional filters.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you upload files or send form data with Retrofit?",
    a: [
      {
        t: "p",
        text: "For URL-encoded forms, use `@FormUrlEncoded` + `@Field`. For file uploads (and mixed data), use `@Multipart` + `@Part` with `MultipartBody.Part` (wrapping a `RequestBody` from the file). This sends `multipart/form-data`, the standard for uploads.",
      },
      {
        t: "code",
        title: "Form and multipart",
        code: `@FormUrlEncoded @POST("login")
suspend fun login(@Field("user") u: String, @Field("pass") p: String): Token

@Multipart @POST("upload")
suspend fun upload(
    @Part file: MultipartBody.Part,          // the file
    @Part("desc") desc: RequestBody,         // a field
): UploadResult
// file = MultipartBody.Part.createFormData("file", name, requestBody)`,
      },
      {
        t: "list",
        items: [
          "**`@FormUrlEncoded` + `@Field`** — URL-encoded form data.",
          "**`@Multipart` + `@Part`** — files + fields (`multipart/form-data`).",
          "**`MultipartBody.Part`** — wrap the file's `RequestBody`.",
          "**Large files** — stream from a source; consider progress + `@Streaming` for downloads.",
        ],
      },
      {
        t: "note",
        text: "Forms: @FormUrlEncoded + @Field. File uploads: @Multipart + @Part with MultipartBody.Part (wrapping a RequestBody from the file) — sends multipart/form-data. Stream large files from a source; track progress via a custom RequestBody.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a Converter, and how do you configure JSON parsing in Retrofit?",
    a: [
      {
        t: "p",
        text: "A `Converter.Factory` tells Retrofit how to serialize the request body and deserialize the response — i.e. the JSON library. You add one when building Retrofit: `kotlinx-serialization` (modern, no reflection), Moshi, or Gson (legacy). The converter turns your Kotlin data classes into JSON and back.",
      },
      {
        t: "code",
        title: "Adding a converter",
        code: `val retrofit = Retrofit.Builder()
    .baseUrl("https://api.example.com/")
    .client(okHttpClient)
    .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))  // kotlinx
    .build()`,
      },
      {
        t: "list",
        items: [
          "**`addConverterFactory`** — plugs in the JSON library.",
          "**kotlinx-serialization** — modern, compile-time, no reflection (recommended).",
          "**Moshi** — good, codegen or reflection.",
          "**Gson** — legacy; reflection-based, some pitfalls.",
        ],
      },
      {
        t: "note",
        text: "A Converter.Factory (addConverterFactory) tells Retrofit how to serialize/deserialize bodies — the JSON library. Prefer kotlinx-serialization (compile-time, no reflection); Moshi is solid; Gson is legacy. The converter maps Kotlin data classes ↔ JSON.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a CallAdapter, and how does Retrofit support suspend/Result?",
    a: [
      {
        t: "p",
        text: "A `CallAdapter.Factory` adapts Retrofit's `Call<T>` into another return type — `suspend` support is built in (returns `T` directly, or `Response<T>`). You can add custom adapters to return, say, `Result<T>` or a sealed `ApiResponse<T>`, moving error handling into the return type instead of try/catch at every call site.",
      },
      {
        t: "list",
        items: [
          "**`CallAdapter`** — adapts `Call<T>` to your return type.",
          "**suspend built-in** — return `T` or `Response<T>` directly.",
          "**Custom `Result`/`ApiResponse` adapter** — errors-as-values return types.",
          "**RxJava adapters** — `Single`/`Observable` (legacy).",
        ],
      },
      {
        t: "code",
        title: "suspend + custom Result",
        code: `@GET("user") suspend fun user(): User                 // built-in suspend
@GET("user") suspend fun user2(): Response<User>       // headers/status
@GET("user") suspend fun user3(): ApiResult<User>      // custom CallAdapter (errors-as-values)`,
      },
      {
        t: "note",
        text: "A CallAdapter.Factory adapts Call<T> to another return type. suspend is built in (return T or Response<T>). A custom CallAdapter can return Result<T>/sealed ApiResponse<T>, moving error handling into the return type instead of try/catch everywhere. RxJava adapters exist for legacy code.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between an application and a network interceptor?",
    a: [
      {
        t: "p",
        text: "*Application* interceptors sit at the top of the OkHttp chain — they see the original request, run once per call (not per redirect/retry), and can short-circuit without a network call. *Network* interceptors sit closer to the network — they run for each network request (including redirects/retries), see the actual request/response on the wire (including OkHttp-added headers), and can observe the redirect chain.",
      },
      {
        t: "list",
        items: [
          "**Application interceptor** — `addInterceptor`; once per call; sees the original request; can short-circuit.",
          "**Network interceptor** — `addNetworkInterceptor`; per network request (redirects/retries); sees wire-level details.",
          "**Auth headers** — usually an application interceptor (once).",
          "**Logging the actual bytes** — a network interceptor (sees compressed/redirected).",
        ],
      },
      {
        t: "note",
        text: "Application interceptors (addInterceptor): top of the chain, once per call, see the original request, can short-circuit. Network interceptors (addNetworkInterceptor): per network request (redirects/retries), see wire-level details (OkHttp-added headers). Use application for auth headers; network for wire-level logging.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you add authentication headers with an interceptor?",
    a: [
      {
        t: "p",
        text: "Add an *application interceptor* that reads the request, appends the `Authorization` header (from your token store), and proceeds. This centralizes auth so every request is authenticated without repeating the header. Read the token from a repository/DataStore; for token refresh on 401, use an `Authenticator` instead.",
      },
      {
        t: "code",
        title: "Auth interceptor",
        code: `class AuthInterceptor(private val tokens: TokenStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request().newBuilder()
            .addHeader("Authorization", "Bearer \${tokens.access()}")
            .build()
        return chain.proceed(request)
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Application interceptor** — append `Authorization` to every request.",
          "**Central** — no per-call header repetition.",
          "**Token source** — repository/DataStore (read the current token).",
          "**Refresh** — use an `Authenticator` for 401 → refresh (not the interceptor).",
        ],
      },
      {
        t: "note",
        text: "Add an application interceptor that appends the Authorization: Bearer <token> header (from your token store) to every request — centralizing auth. Read the token from a repository/DataStore. For refreshing on 401, use an OkHttp Authenticator (not the interceptor).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is an OkHttp Authenticator, and how does it handle 401 token refresh?",
    a: [
      {
        t: "p",
        text: "An `Authenticator` is called automatically by OkHttp when a response is `401 Unauthorized` — it lets you *refresh the token* and return a new request with the updated `Authorization` header, which OkHttp retries. The concurrency challenge: multiple simultaneous 401s shouldn't each refresh; synchronize so only one refresh happens and others reuse the new token.",
      },
      {
        t: "code",
        title: "Authenticator",
        code: `class TokenAuthenticator(private val tokens: TokenStore) : Authenticator {
    override fun authenticate(route: Route?, response: Response): Request? {
        synchronized(this) {
            val newToken = tokens.refreshIfNeeded(response) ?: return null   // give up -> logout
            return response.request.newBuilder()
                .header("Authorization", "Bearer \$newToken").build()
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Called on 401** — refresh the token, return a retried request.",
          "**Return `null`** — to give up (e.g. refresh failed → log out).",
          "**Concurrency** — synchronize/dedupe so one refresh serves many 401s.",
          "**Avoid loops** — check the attempt count to prevent infinite retries.",
        ],
      },
      {
        t: "note",
        text: "An OkHttp Authenticator is called on 401 — refresh the token and return a retried request with the new Authorization (or null to give up → logout). Concurrency challenge: synchronize/dedupe so simultaneous 401s trigger ONE refresh (others reuse it); guard against infinite retry loops.",
      },
    ],
  },
  {
    level: "senior",
    q: "When should a Retrofit function return Response<T> versus bare T?",
    a: [
      {
        t: "p",
        text: "Return bare `T` (or your domain type) when you only care about the successful body — Retrofit throws `HttpException` for non-2xx. Return `Response<T>` when you need the *status code*, *headers* (ETag, pagination links), or the *error body* on failure — `Response` gives you `isSuccessful`, `code()`, `headers()`, and `errorBody()`.",
      },
      {
        t: "code",
        title: "Response<T> for details",
        code: `@GET("users") suspend fun users(): Response<List<User>>
val r = api.users()
if (r.isSuccessful) handle(r.body(), r.headers()["ETag"])
else handleError(r.code(), r.errorBody()?.string())`,
      },
      {
        t: "list",
        items: [
          "**Bare `T`** — only need the success body; non-2xx throws `HttpException`.",
          "**`Response<T>`** — need status/headers/error body.",
          "**Headers** — ETag, pagination, rate limits.",
          "**Error body** — parse structured error responses.",
        ],
      },
      {
        t: "note",
        text: "Bare T when you only need the success body (non-2xx throws HttpException). Response<T> when you need the status code, headers (ETag, pagination, rate limits), or the error body — via isSuccessful/code()/headers()/errorBody(). Use Response<T> for conditional requests and structured error handling.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you parse a structured error body from a failed response?",
    a: [
      {
        t: "p",
        text: "For non-2xx responses, the error JSON is in `response.errorBody()` (or `HttpException.response()?.errorBody()`). Read it as a string or convert it with a Retrofit `Converter` for your error DTO. Do this in your repository's error mapping so the UI gets a typed domain error (message, code) rather than a raw body.",
      },
      {
        t: "code",
        title: "Parsing errorBody",
        code: `catch (e: HttpException) {
    val error = e.response()?.errorBody()?.string()?.let {
        json.decodeFromString<ApiError>(it)
    }
    return Result.failure(DomainError(error?.message ?: "Unknown", e.code()))
}`,
      },
      {
        t: "list",
        items: [
          "**`errorBody()`** — the non-2xx response body.",
          "**Convert** — deserialize to an error DTO (converter or manual).",
          "**Map to domain** — a typed error (message/code) for the UI.",
          "**`errorBody()` is one-shot** — read it once (consumes the stream).",
        ],
      },
      {
        t: "note",
        text: "Parse the error JSON from response.errorBody() (or HttpException.response()?.errorBody()) — deserialize to an error DTO and map to a typed domain error (message/code) in the repository. Note errorBody() is a one-shot stream (read once). Gives the UI structured errors, not raw bodies.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does OkHttp's connection pool and HTTP/2 improve performance?",
    a: [
      {
        t: "p",
        text: "OkHttp maintains a *connection pool* that *reuses* TCP/TLS connections (keep-alive) across requests to the same host — avoiding the expensive handshake each time. With *HTTP/2*, it multiplexes many requests over a *single* connection (concurrent streams), reducing latency and overhead. Sharing one `OkHttpClient` is what lets the whole app benefit from the shared pool.",
      },
      {
        t: "list",
        items: [
          "**Connection pool** — reuse keep-alive connections; skip handshakes.",
          "**HTTP/2 multiplexing** — many requests over one connection.",
          "**Shared client** — one pool for the whole app.",
          "**Less latency** — no repeated TCP/TLS setup.",
        ],
      },
      {
        t: "note",
        text: "OkHttp's connection pool reuses TCP/TLS keep-alive connections across requests (skipping handshakes); HTTP/2 multiplexes many concurrent requests over one connection. Sharing a single OkHttpClient means the whole app benefits from the shared pool — a key reason to reuse one client.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is certificate pinning, and when should you use it?",
    a: [
      {
        t: "p",
        text: "Certificate pinning restricts which certificates your app trusts for a host — you 'pin' the server's certificate (or public key hash) so a man-in-the-middle with a rogue-but-valid CA cert is rejected. Configure it via OkHttp's `CertificatePinner` (or Network Security Config). Use it for high-security apps (banking), but *plan for rotation* — a pinned cert expiring without an app update breaks connectivity.",
      },
      {
        t: "code",
        title: "CertificatePinner",
        code: `val client = OkHttpClient.Builder()
    .certificatePinner(CertificatePinner.Builder()
        .add("api.example.com", "sha256/AAAAAAA...")
        .build())
    .build()`,
      },
      {
        t: "list",
        items: [
          "**Pin the cert/public key** — trust only specific certs for a host.",
          "**Blocks MITM** — even with a rogue valid CA cert.",
          "**Use for** — high-security apps (finance, health).",
          "**Rotation risk** — pin backups; expiring pins break the app without an update.",
        ],
      },
      {
        t: "note",
        text: "Certificate pinning trusts only specific certs/public-key hashes for a host (OkHttp CertificatePinner or Network Security Config), blocking MITM even with a rogue valid CA cert. Use for high-security apps — but pin backup keys and plan rotation, since an expiring pin without an app update breaks connectivity.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you cancel an in-flight network request?",
    a: [
      {
        t: "p",
        text: "With suspend Retrofit functions, *coroutine cancellation* cancels the request automatically — when the enclosing coroutine (e.g. `viewModelScope`) is cancelled, Retrofit cancels the underlying OkHttp `Call`, aborting the request. So leaving a screen (which cancels the scope) stops its network calls. For manual `Call<T>`, call `call.cancel()`.",
      },
      {
        t: "list",
        items: [
          "**Coroutine cancellation** — cancels the underlying OkHttp Call automatically.",
          "**Scope teardown** — leaving a screen cancels `viewModelScope` → aborts requests.",
          "**Manual `Call<T>`** — `call.cancel()`.",
          "**Server work** — cancellation aborts the client request; the server may still finish.",
        ],
      },
      {
        t: "note",
        text: "For suspend Retrofit functions, coroutine cancellation cancels the underlying OkHttp Call automatically — so leaving a screen (cancelling viewModelScope) aborts its requests. For manual Call<T>, use call.cancel(). Cancellation aborts the client request; the server may still complete its work.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you configure a logging interceptor safely?",
    a: [
      {
        t: "p",
        text: "Add `HttpLoggingInterceptor` to log requests/responses at a chosen level (`BASIC`, `HEADERS`, `BODY`). Crucially, only enable verbose (`BODY`) logging in *debug* builds — logging bodies/headers in production leaks sensitive data (tokens, PII) and hurts performance. Redact auth headers and gate the interceptor behind `BuildConfig.DEBUG`.",
      },
      {
        t: "code",
        title: "Debug-only logging",
        code: `if (BuildConfig.DEBUG) {
    builder.addInterceptor(HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
        redactHeader("Authorization")
    })
}`,
      },
      {
        t: "list",
        items: [
          "**`HttpLoggingInterceptor`** — levels BASIC/HEADERS/BODY.",
          "**Debug only** — never log bodies/headers in production (leaks tokens/PII).",
          "**`redactHeader`** — hide sensitive headers.",
          "**Gate on `BuildConfig.DEBUG`** — strip from release.",
        ],
      },
      {
        t: "note",
        text: "Add HttpLoggingInterceptor (BASIC/HEADERS/BODY), but enable BODY only in debug builds — logging bodies/headers in production leaks tokens/PII and hurts performance. redactHeader(\"Authorization\") and gate the interceptor behind BuildConfig.DEBUG.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test Retrofit code with MockWebServer?",
    a: [
      {
        t: "p",
        text: "`MockWebServer` (OkHttp) runs a local HTTP server you point Retrofit at (`server.url(\"/\")`), enqueue canned responses (`MockResponse` with status/body/delay), and assert the requests your code makes (`server.takeRequest()`). It tests the *real* Retrofit/OkHttp stack (parsing, headers, error handling) against controlled responses — more realistic than mocking the API interface.",
      },
      {
        t: "code",
        title: "MockWebServer test",
        code: `val server = MockWebServer()
server.enqueue(MockResponse().setResponseCode(200).setBody("""{"id":"1","name":"Sam"}"""))
val api = Retrofit.Builder().baseUrl(server.url("/")).addConverterFactory(...).build().create(Api::class.java)
val user = api.getUser("1")
assertEquals("Sam", user.name)
assertEquals("/users/1", server.takeRequest().path)`,
      },
      {
        t: "list",
        items: [
          "**Point Retrofit at `server.url`** — a local test server.",
          "**`enqueue(MockResponse)`** — canned status/body/delay/errors.",
          "**`takeRequest()`** — assert the outgoing request (path, headers, body).",
          "**Tests the real stack** — parsing, converters, error handling.",
        ],
      },
      {
        t: "note",
        text: "MockWebServer runs a local server you point Retrofit at (server.url); enqueue MockResponses (status/body/delay/errors) and assert outgoing requests via takeRequest() (path/headers/body). It tests the real Retrofit/OkHttp stack (parsing/converters/error handling) against controlled responses — more realistic than mocking the API interface.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is @Streaming, and when do you need it?",
    a: [
      {
        t: "p",
        text: "By default Retrofit *buffers the entire response body into memory* before returning — fine for JSON, but bad for *large downloads* (a big file could OOM). `@Streaming` makes Retrofit return the `ResponseBody` without buffering, so you stream it to disk with a `source`/`InputStream` while tracking progress. Use it for file downloads.",
      },
      {
        t: "code",
        title: "@Streaming download",
        code: `@Streaming @GET
suspend fun download(@Url url: String): ResponseBody

val body = api.download(url)
body.byteStream().use { input -> file.outputStream().use { input.copyTo(it) } }`,
      },
      {
        t: "list",
        items: [
          "**Default buffers** — whole body in memory (OOM risk for big files).",
          "**`@Streaming`** — returns `ResponseBody` unbuffered; stream to disk.",
          "**Progress** — read in chunks and report bytes.",
          "**Downloads** — the standard for large file downloads.",
        ],
      },
      {
        t: "note",
        text: "Retrofit buffers the whole response body by default (OOM risk for large files). @Streaming returns the ResponseBody unbuffered so you stream it to disk (byteStream/source) in chunks with progress. Use it for file downloads; keep default buffering for JSON.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you use a dynamic base URL or full URL per request?",
    a: [
      {
        t: "p",
        text: "Use `@Url` to pass a complete URL as a parameter (overriding the base URL) — useful for following pagination links, CDNs, or per-environment hosts returned by the server. For switching the base URL globally, you'd rebuild Retrofit or use an interceptor that rewrites the host.",
      },
      {
        t: "code",
        title: "@Url",
        code: `@GET suspend fun page(@Url url: String): PageResponse   // full URL (e.g. next-page link)
@Streaming @GET suspend fun file(@Url fileUrl: String): ResponseBody`,
      },
      {
        t: "list",
        items: [
          "**`@Url`** — pass a full URL, overriding the base.",
          "**Uses** — pagination `next` links, CDN/asset URLs, per-response hosts.",
          "**Global base switch** — rebuild Retrofit or rewrite host in an interceptor.",
          "**Relative resolution** — `@Url` can also be relative to the base.",
        ],
      },
      {
        t: "note",
        text: "@Url passes a complete URL per request, overriding the base URL — for following pagination next-links, CDN/asset URLs, or server-returned hosts. To switch the base URL globally, rebuild Retrofit or rewrite the host in an interceptor.",
      },
    ],
  },
  {
    level: "senior",
    q: "What does retryOnConnectionFailure do, and how does it differ from app-level retry?",
    a: [
      {
        t: "p",
        text: "OkHttp's `retryOnConnectionFailure` (default on) transparently retries when a *connection* fails (e.g. a stale pooled connection, or one of multiple IPs is down) — it does *not* retry on HTTP error responses (4xx/5xx) or timeouts. App-level retry (with backoff) is what you add for *transient server errors* (5xx) or timeouts, with your own policy. They operate at different layers.",
      },
      {
        t: "list",
        items: [
          "**`retryOnConnectionFailure`** — retries connection-level failures (stale conn, multi-IP); not HTTP errors.",
          "**App-level retry** — your policy for 5xx/timeouts with backoff.",
          "**Different layers** — OkHttp handles connectivity, you handle response errors.",
          "**Idempotency** — only retry safe/idempotent requests at the app level.",
        ],
      },
      {
        t: "note",
        text: "OkHttp's retryOnConnectionFailure (default) transparently retries connection-level failures (stale pooled connection, alternate IPs) — NOT HTTP errors (4xx/5xx) or timeouts. App-level retry (backoff) handles transient server errors/timeouts with your policy. Different layers; only retry idempotent requests at the app level.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you provide Retrofit and OkHttp via dependency injection?",
    a: [
      {
        t: "p",
        text: "Provide a single `OkHttpClient` and a single `Retrofit` as `@Singleton`s (via Hilt/Koin), then provide each API interface with `retrofit.create(Api::class.java)`. This ensures one shared client/connection pool app-wide and makes APIs injectable into repositories. Interceptors (auth, logging) and converters are configured in the provider.",
      },
      {
        t: "code",
        title: "Hilt network module",
        code: `@Provides @Singleton fun okHttp(auth: AuthInterceptor): OkHttpClient =
    OkHttpClient.Builder().addInterceptor(auth).build()
@Provides @Singleton fun retrofit(client: OkHttpClient): Retrofit =
    Retrofit.Builder().baseUrl(BASE_URL).client(client).addConverterFactory(...).build()
@Provides @Singleton fun api(retrofit: Retrofit): Api = retrofit.create(Api::class.java)`,
      },
      {
        t: "list",
        items: [
          "**Singleton client + Retrofit** — one shared instance app-wide.",
          "**Provide each API** — `retrofit.create(Api::class.java)`.",
          "**Configure once** — interceptors/converters in the provider.",
          "**Inject APIs** — into repositories.",
        ],
      },
      {
        t: "note",
        text: "Provide a single @Singleton OkHttpClient and Retrofit (Hilt/Koin), then provide each API via retrofit.create(Api::class.java). One shared client/connection pool app-wide, APIs injectable into repositories, interceptors/converters configured once in the module.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between Call<T> and a suspend function in Retrofit?",
    a: [
      {
        t: "p",
        text: "`Call<T>` is Retrofit's classic callback/blocking handle — you call `enqueue(callback)` (async) or `execute()` (blocking). A `suspend` function is the modern coroutine style — Retrofit runs the request off the main thread and returns the result (or throws) directly, integrating with structured concurrency and cancellation. Prefer `suspend` for new code.",
      },
      {
        t: "list",
        items: [
          "**`Call<T>`** — `enqueue(callback)` (async) or `execute()` (blocking); manual threading.",
          "**`suspend`** — coroutine-friendly; main-safe; structured cancellation.",
          "**Modern** — prefer `suspend` (or Flow via a stream adapter).",
          "**Interop** — `Call<T>` still used in some libraries/legacy code.",
        ],
      },
      {
        t: "note",
        text: "Call<T> is the classic handle: enqueue(callback) (async) or execute() (blocking), manual threading. A suspend function is coroutine-style: main-safe, returns the result directly, integrates with structured concurrency/cancellation. Prefer suspend for new code; Call<T> remains for legacy/interop.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does interceptor ordering affect behavior?",
    a: [
      {
        t: "p",
        text: "Interceptors run in the *order added*, forming a chain: the request flows *down* through them to the network, and the response flows *back up* in reverse. So an auth interceptor added before a logging interceptor adds the header *before* logging sees it. Order matters for things like adding headers (before logging), caching, and retry — place them deliberately.",
      },
      {
        t: "list",
        items: [
          "**Order = add order** — request goes down, response comes back up.",
          "**Auth before logging** — so logging sees the added header.",
          "**Network vs application** — network interceptors sit closer to the wire.",
          "**Deliberate placement** — headers, caching, retry depend on order.",
        ],
      },
      {
        t: "note",
        text: "Interceptors run in add-order as a chain: request flows down to the network, response flows back up in reverse. So add auth before logging (logging sees the header). Application interceptors sit above network interceptors. Order matters for headers, caching, and retry — place them deliberately.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does OkHttp's Dispatcher control concurrency?",
    a: [
      {
        t: "p",
        text: "OkHttp's `Dispatcher` manages the async request queue and *concurrency limits*: `maxRequests` (total concurrent requests, default 64) and `maxRequestsPerHost` (per host, default 5). When limits are hit, requests queue. For suspend calls (async), this bounds how many run at once; you can tune it for high-throughput scenarios or to avoid overwhelming a server.",
      },
      {
        t: "list",
        items: [
          "**`maxRequests`** — total concurrent async requests (default 64).",
          "**`maxRequestsPerHost`** — per-host limit (default 5); often the real bottleneck.",
          "**Queueing** — excess requests wait.",
          "**Tune** — raise per-host for many parallel calls to one API; lower to be gentle.",
        ],
      },
      {
        t: "note",
        text: "OkHttp's Dispatcher bounds async concurrency: maxRequests (total, default 64) and maxRequestsPerHost (default 5 — often the real limit). Excess requests queue. Tune maxRequestsPerHost up for many parallel calls to one API, or keep it low to avoid overwhelming a server.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you send optional query parameters that should be omitted when null?",
    a: [
      {
        t: "p",
        text: "Make the `@Query` parameter *nullable* — Retrofit *omits* it from the URL when it's `null`. This is the clean way to handle optional filters (sort, category, cursor) without building URLs manually or sending empty params.",
      },
      {
        t: "code",
        title: "Optional queries",
        code: `@GET("products")
suspend fun products(
    @Query("category") category: String? = null,   // omitted if null
    @Query("sort") sort: String? = null,
    @Query("cursor") cursor: String? = null,
): ProductPage`,
      },
      {
        t: "list",
        items: [
          "**Nullable `@Query`** — omitted from the URL when null.",
          "**Optional filters** — sort/category/cursor without manual URL building.",
          "**`@QueryMap`** — for a dynamic set of optional params.",
          "**Defaults** — combine with Kotlin default arguments.",
        ],
      },
      {
        t: "note",
        text: "Make the @Query parameter nullable — Retrofit omits it from the URL when null. Clean handling of optional filters (sort/category/cursor) without manual URL building. Use @QueryMap for a dynamic set of optional params; combine with Kotlin default arguments.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle timeouts and slow networks gracefully?",
    a: [
      {
        t: "p",
        text: "Configure OkHttp's `connectTimeout`, `readTimeout`, and `writeTimeout` (and `callTimeout` for the whole call) to sensible values so requests fail fast instead of hanging. On timeout (`SocketTimeoutException`), treat it as a *retryable transient error* — retry with backoff for idempotent requests, or show an error with retry. Also serve cached data so a slow network doesn't block the UI.",
      },
      {
        t: "code",
        title: "Timeouts",
        code: `OkHttpClient.Builder()
    .connectTimeout(10, TimeUnit.SECONDS)
    .readTimeout(30, TimeUnit.SECONDS)
    .writeTimeout(30, TimeUnit.SECONDS)
    .callTimeout(60, TimeUnit.SECONDS)   // whole-call cap
    .build()`,
      },
      {
        t: "list",
        items: [
          "**Timeouts** — connect/read/write + `callTimeout`; fail fast, don't hang.",
          "**`SocketTimeoutException`** — treat as transient/retryable.",
          "**Retry idempotent** — with backoff; show retry for others.",
          "**Cache** — serve cached data so slow networks don't block the UI.",
        ],
      },
      {
        t: "note",
        text: "Set OkHttp connect/read/write timeouts (+ callTimeout for the whole call) so requests fail fast, not hang. Treat SocketTimeoutException as a transient/retryable error (backoff for idempotent requests, retry UI otherwise), and serve cached data so a slow network doesn't block the UI.",
      },
    ],
  },
];

export default qa;
