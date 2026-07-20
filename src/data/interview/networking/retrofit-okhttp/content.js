// Retrofit & OkHttp — Content tab. Teaching-first.

const content = [
  {
    heading: "The two-layer stack: Retrofit on top of OkHttp",
    blocks: [
      {
        t: "p",
        text: "Android's standard networking stack has two layers. **OkHttp** is the *HTTP client* — it does the actual network work: opening connections, sending requests, receiving responses, connection pooling, caching, retries, timeouts. **Retrofit** is a *type-safe wrapper on top of OkHttp* — you define your API as a Kotlin interface with annotations, and Retrofit generates the code that turns method calls into HTTP requests (using OkHttp underneath) and parses responses into your objects. You describe *what* the API looks like; Retrofit handles *how* to call it.",
      },
      {
        t: "list",
        items: [
          "**OkHttp** = the engine (raw HTTP: connections, interceptors, caching, pooling). You can use it directly, but it's low-level (manual request building, response parsing).",
          "**Retrofit** = the ergonomic layer (declare an interface, get type-safe methods, automatic JSON parsing). It uses OkHttp as its HTTP client.",
          "Together they're the de-facto standard for REST networking on Android. (Ktor is the KMP alternative — covered separately.)",
        ],
      },
    ],
  },
  {
    heading: "Defining an API with Retrofit",
    blocks: [
      {
        t: "code",
        title: "A Retrofit API interface",
        code: `interface UserApi {
    @GET("users")
    suspend fun getUsers(@Query("page") page: Int): List<UserDto>

    @GET("users/{id}")
    suspend fun getUser(@Path("id") id: String): UserDto

    @POST("users")
    suspend fun createUser(@Body user: CreateUserRequest): UserDto

    @PUT("users/{id}")
    suspend fun updateUser(@Path("id") id: String, @Body user: UserDto): UserDto

    @DELETE("users/{id}")
    suspend fun deleteUser(@Path("id") id: String)

    @GET("search")
    suspend fun search(@Query("q") query: String, @Header("X-Trace") trace: String): SearchDto
}`,
      },
      {
        t: "list",
        items: [
          "**HTTP method annotations**: `@GET`, `@POST`, `@PUT`, `@DELETE`, `@PATCH` — the path (relative to the base URL) goes in the annotation.",
          "**`@Path`** — substitute a value into the URL path (`users/{id}`). **`@Query`** — add a query parameter (`?page=2`). **`@Body`** — send an object as the request body (serialized to JSON). **`@Header`/`@Headers`** — add headers. **`@Field`/`@FormUrlEncoded`** — form submissions.",
          "**`suspend` functions** — Retrofit natively supports coroutines: a `suspend` API function is *main-safe* (Retrofit runs the network call off the main thread) and returns the parsed result directly. This is the modern way (older Retrofit used `Call<T>` with callbacks, or RxJava).",
          "**Return types**: `suspend fun ...(): T` returns the parsed body directly (throwing on error); `suspend fun ...(): Response<T>` gives you the full response (status code, headers) for manual handling.",
        ],
      },
    ],
  },
  {
    heading: "Building Retrofit and the converter",
    blocks: [
      {
        t: "code",
        title: "Wiring it up",
        code: `val okHttpClient = OkHttpClient.Builder()
    .connectTimeout(15, TimeUnit.SECONDS)
    .readTimeout(15, TimeUnit.SECONDS)
    .addInterceptor(loggingInterceptor)      // interceptors here
    .build()

val retrofit = Retrofit.Builder()
    .baseUrl("https://api.example.com/")     // must end with /
    .client(okHttpClient)
    .addConverterFactory(                      // how to parse bodies
        Json.asConverterFactory("application/json".toMediaType())  // kotlinx.serialization
    )
    .build()

val userApi: UserApi = retrofit.create(UserApi::class.java)  // Retrofit generates the impl`,
      },
      {
        t: "list",
        items: [
          "**`baseUrl`** — the API root (endpoint paths are relative to it). **`client`** — the configured OkHttpClient. **A converter factory** — tells Retrofit how to serialize request bodies and parse responses (kotlinx.serialization, Moshi, or Gson).",
          "**`retrofit.create(...)`** generates the interface implementation via a dynamic proxy — you call methods, Retrofit builds and executes the OkHttp request and parses the response.",
          "**Provide these as singletons via DI** (Hilt) — building Retrofit/OkHttp is expensive, and OkHttp's connection pool and cache should be shared across the app. Never create a new client per request.",
        ],
      },
    ],
  },
  {
    heading: "OkHttp interceptors — the powerful middleware",
    blocks: [
      {
        t: "p",
        text: "**Interceptors** are OkHttp's middleware — they sit in the request/response pipeline and can observe, modify, or short-circuit requests and responses. Every request passes through the chain of interceptors on the way out, and every response on the way back. This is where you add cross-cutting networking concerns: auth, logging, headers, retries.",
      },
      {
        t: "code",
        title: "An auth interceptor adds the token to every request",
        code: `class AuthInterceptor(private val tokenProvider: TokenProvider) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request().newBuilder()
            .addHeader("Authorization", "Bearer \${tokenProvider.token()}")
            .build()
        return chain.proceed(request)          // continue the chain
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Common uses**: adding auth tokens/headers to every request (so you don't repeat it per call), logging (`HttpLoggingInterceptor`), adding analytics/trace headers, custom retry logic, response caching tweaks, and mocking responses in tests.",
          "**Two types**: *application interceptors* (added with `addInterceptor` — called once per request, see the request as your app made it) and *network interceptors* (`addNetworkInterceptor` — closer to the wire, see redirects/retries, can observe the actual network request). Application interceptors are the common choice.",
          "**`HttpLoggingInterceptor`** — logs requests/responses for debugging (set level to BODY in debug, NONE in release — never log bodies with sensitive data in production).",
          "**Order matters**: interceptors run in the order added; the auth interceptor should run before logging so the logged request includes the header (or after, if you want to hide it).",
        ],
      },
    ],
  },
  {
    heading: "Timeouts, connection pooling, and caching",
    blocks: [
      {
        t: "list",
        items: [
          "**Timeouts** — configure `connectTimeout` (time to establish a connection), `readTimeout` (time waiting for data), `writeTimeout` (time to send the body). Sensible defaults (10-30s) prevent requests from hanging forever on a bad network. Without timeouts, a stalled request blocks resources indefinitely.",
          "**Connection pooling** — OkHttp *reuses* TCP connections across requests (keep-alive) instead of opening a new one each time. This is a major performance win (connection setup, especially TLS handshake, is expensive) and is why you share one OkHttpClient — each client has its own pool.",
          "**HTTP caching** — configure a `Cache` on the client, and OkHttp automatically caches responses per HTTP headers (`Cache-Control`, ETag), serving cached responses and doing conditional requests (304). Complementary to app-level DB caching.",
          "**HTTP/2 support** — OkHttp supports HTTP/2 (multiplexing multiple requests over one connection), automatically negotiated — more efficient than HTTP/1.1's one-request-per-connection.",
          "**Retries** — OkHttp automatically retries some connection failures; for application-level retry (on specific status codes with backoff), you add a custom interceptor or handle it in the repository.",
        ],
      },
      {
        t: "note",
        text: "Retrofit + OkHttp essentials: OkHttp = the HTTP engine (connections, pooling, caching, interceptors, timeouts); Retrofit = type-safe interface layer on top (annotations → requests, auto JSON parsing, suspend support = main-safe). Define APIs as annotated interfaces; build Retrofit with a baseUrl, the OkHttpClient, and a converter factory — as DI singletons. Interceptors are middleware for auth/logging/headers/retry. Configure timeouts; rely on connection pooling and HTTP caching. Share one client for pooling.",
      },
    ],
  },
];

export default content;
