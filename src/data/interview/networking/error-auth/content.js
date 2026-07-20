// Network Error Handling & Auth — Content tab. Teaching-first.

const content = [
  {
    heading: "The kinds of network failures",
    blocks: [
      {
        t: "p",
        text: "Networking fails in several distinct ways, and robust apps distinguish them because each needs a different response. Lumping all failures into 'something went wrong' gives poor UX and wrong retry behavior.",
      },
      {
        t: "list",
        items: [
          "**No connectivity / IO failure** — `IOException` (no network, connection dropped, DNS failure, timeout). Transient — the request never reached the server or got cut off. *Retry-able*; show 'check your connection'.",
          "**HTTP error responses** — the server responded, but with a non-2xx status. Retrofit surfaces these as `HttpException` (with the status code). Sub-cases matter: 401 (re-authenticate), 403 (no permission), 404 (not found), 429 (rate-limited — back off), 5xx (server error — retry).",
          "**Serialization/parsing errors** — the response arrived but couldn't be parsed (malformed JSON, unexpected shape). Usually a bug or API mismatch, not transient — don't retry; log it.",
          "**Cancellation** — the coroutine was cancelled (user left the screen). This is *normal*, not an error — `CancellationException` must be rethrown, not treated as a failure.",
        ],
      },
    ],
  },
  {
    heading: "Modeling errors as values (Result types)",
    blocks: [
      {
        t: "p",
        text: "The recommended approach: don't let raw exceptions propagate up through your layers. Instead, **catch technical exceptions at the data-layer boundary and map them into a typed result** — a sealed error type in domain terms. The ViewModel then handles that result as an expected branch (map to UI state), never dealing with `HttpException`/`IOException` directly.",
      },
      {
        t: "code",
        title: "A typed error vocabulary + safe API call wrapper",
        code: `sealed interface DataError {
    data object NoConnection : DataError
    data object Unauthorized : DataError
    data object NotFound : DataError
    data class Server(val code: Int) : DataError
    data class Unknown(val cause: Throwable) : DataError
}

suspend fun <T> safeApiCall(call: suspend () -> T): Result<T, DataError> = try {
    Result.Success(call())
} catch (e: CancellationException) {
    throw e                                    // NEVER swallow cancellation
} catch (e: IOException) {
    Result.Failure(DataError.NoConnection)     // no network / timeout
} catch (e: HttpException) {
    Result.Failure(when (e.code()) {
        401 -> DataError.Unauthorized
        404 -> DataError.NotFound
        in 500..599 -> DataError.Server(e.code())
        else -> DataError.Unknown(e)
    })
} catch (e: Exception) {
    Result.Failure(DataError.Unknown(e))       // parse errors, etc.
}`,
      },
      {
        t: "list",
        items: [
          "**Map technical → domain errors at the boundary**: the data layer translates `IOException`/`HttpException` into a domain vocabulary (`NoConnection`, `Unauthorized`), so upper layers never depend on library-specific exception types.",
          "**Always rethrow `CancellationException`** — a broad catch would swallow it and break coroutine cancellation. Catch it first and rethrow (or catch specific types only).",
          "**The ViewModel handles the result exhaustively** — `when (error) { NoConnection -> showOffline(); Unauthorized -> goToLogin(); ... }` — mapping each error to the right UX, with the compiler ensuring every case is covered.",
        ],
      },
    ],
  },
  {
    heading: "Mapping errors to good UX",
    blocks: [
      {
        t: "table",
        headers: ["Error", "UX response"],
        rows: [
          ["No connection", "'You're offline' + retry; keep showing cached data if available"],
          ["Unauthorized (401)", "attempt token refresh; if that fails, send to login"],
          ["Forbidden (403)", "'You don't have access' — not a retry situation"],
          ["Not found (404)", "'Not found' / empty state"],
          ["Rate limited (429)", "back off and retry after the delay; maybe a gentle 'try again shortly'"],
          ["Server error (5xx)", "'Something went wrong' + retry (with backoff)"],
        ],
      },
      {
        t: "list",
        items: [
          "**Don't blank the screen on error if you have cached data** — in an offline-first app, a failed refresh should keep showing the cached content and surface the error non-destructively (a snackbar), not replace everything with a full-screen error.",
          "**Distinguish retryable from not** — offer retry for transient errors (network, 5xx); for a 403 or a 404, retry is pointless, so guide the user differently.",
          "**Be specific but not technical** — 'Check your connection' is helpful; 'HttpException 503' is not. Map error types to human messages.",
        ],
      },
    ],
  },
  {
    heading: "Token authentication and automatic refresh",
    blocks: [
      {
        t: "p",
        text: "Most APIs use token auth: a short-lived **access token** on each request, and a long-lived **refresh token** to get a new access token when it expires. The two mechanisms in OkHttp: an **Interceptor** to *attach* the token to every request, and an **Authenticator** to *refresh* it automatically on a 401.",
      },
      {
        t: "code",
        title: "Interceptor (attach) + Authenticator (refresh on 401)",
        code: `// Attach the current access token to every request
class AuthInterceptor(private val tokens: TokenStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response =
        chain.proceed(
            chain.request().newBuilder()
                .header("Authorization", "Bearer \${tokens.access()}")
                .build()
        )
}

// When a request comes back 401, refresh the token and retry automatically
class TokenAuthenticator(private val tokens: TokenStore, private val authApi: AuthApi) : Authenticator {
    override fun authenticate(route: Route?, response: Response): Request? {
        synchronized(this) {                     // avoid many parallel refreshes
            val newToken = runBlocking { authApi.refresh(tokens.refresh()) }
            tokens.saveAccess(newToken.access)
            return response.request.newBuilder()
                .header("Authorization", "Bearer \${newToken.access}")
                .build()                         // OkHttp retries with the new token
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Interceptor attaches the token** to every outgoing request — so you never manually add it per call.",
          "**Authenticator handles refresh**: when a response is 401 (token expired), OkHttp calls the `Authenticator`; you refresh the access token using the refresh token, and return the retried request with the new token. OkHttp automatically re-sends it. Returning `null` means 'give up' (refresh failed → log out).",
          "**Concurrency care**: if many requests 401 at once, you don't want N simultaneous refresh calls — synchronize/deduplicate the refresh (a mutex, or check if the token was already refreshed) so only one refresh happens and the others use the new token.",
          "**On refresh failure** (refresh token also expired/invalid) → clear the session and route to login. This is the 'you've been logged out' flow.",
          "**Store tokens securely** — `EncryptedSharedPreferences` or encrypted storage, never plaintext.",
        ],
      },
    ],
  },
  {
    heading: "Retry strategy",
    blocks: [
      {
        t: "list",
        items: [
          "**Retry only transient errors** — network failures and 5xx (server errors). Don't retry 4xx client errors (they'll fail identically), except 401 (after refresh) and 429 (after the rate-limit delay).",
          "**Exponential backoff with jitter** — increase the delay between attempts (1s, 2s, 4s…) and add randomness (jitter) so many clients don't retry in perfect sync (the 'thundering herd' that overwhelms a recovering server).",
          "**Bound the attempts** — cap retries (e.g. 3) so a persistent failure doesn't loop forever draining battery.",
          "**Idempotency for non-idempotent requests** — only blindly retry idempotent operations (GET/PUT/DELETE); for POST, use an idempotency key so a retry doesn't duplicate the action.",
          "**Where to implement** — a Flow `retryWhen` operator, a custom OkHttp interceptor, or explicit logic in the repository. `retryWhen` in a Flow pipeline is clean for observable data.",
        ],
      },
      {
        t: "note",
        text: "Error/auth essentials: distinguish failure types (IOException = transient/retry; HttpException by code — 401 refresh, 403/404 don't retry, 429 back off, 5xx retry; parse errors = bug; cancellation = normal, rethrow). Model errors as typed values at the data-layer boundary; handle exhaustively in the ViewModel mapping to UX (keep cached data on refresh failure). Token auth: Interceptor attaches the token, Authenticator refreshes on 401 (deduplicated); refresh failure → logout; store tokens encrypted. Retry only transient errors with bounded exponential backoff + jitter.",
      },
    ],
  },
];

export default content;
