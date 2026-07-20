// Network Error Handling & Auth — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What are the different kinds of network errors you need to handle?",
    a: [
      {
        t: "list",
        items: [
          "**Connectivity / IO failures** (`IOException`) — no network, connection dropped, DNS failure, timeout. The request never completed. These are *transient*, so retrying may work; show a 'check your connection' message.",
          "**HTTP error responses** (`HttpException` in Retrofit) — the server responded with a non-2xx status. The specific code matters: 401 (re-authenticate), 403 (no permission), 404 (not found), 429 (rate-limited), 5xx (server error).",
          "**Parsing/serialization errors** — the response arrived but couldn't be deserialized (malformed or unexpected JSON). Usually a bug or API mismatch, not transient — don't retry, log it.",
          "**Cancellation** (`CancellationException`) — the coroutine was cancelled because the user left the screen. This is *normal*, not an error, and must be rethrown, not caught as a failure.",
        ],
      },
      {
        t: "p",
        text: "The reason to distinguish them is that each needs a *different* response. A network failure should offer retry and keep showing cached data; a 401 should trigger token refresh; a 404 should show an empty state; a parse error should be logged as a bug; and a cancellation should be ignored. Treating all failures as a generic 'error' gives poor UX (a retry button on a 403 that will never succeed) and wrong behavior (retrying a request that can't succeed, or breaking cancellation by swallowing `CancellationException`).",
      },
    ],
  },
  {
    level: "junior",
    q: "Why should you map network exceptions to a typed result instead of letting them propagate?",
    a: [
      {
        t: "p",
        text: "**Because network failures are *expected outcomes* on mobile (the network is unreliable), not exceptional bugs — so modeling them as typed values makes handling explicit, exhaustive, and decoupled from library details.** Instead of letting `IOException`/`HttpException` propagate up through your layers, you catch them at the data-layer boundary and return a typed result — a sealed error type in your app's own vocabulary.",
      },
      {
        t: "code",
        title: "Typed errors handled exhaustively",
        code: `sealed interface DataError { object NoConnection; object Unauthorized; data class Server(val code: Int) }

// ViewModel handles each case — compiler ensures all are covered
when (error) {
    DataError.NoConnection -> showOfflineMessage()
    DataError.Unauthorized -> navigateToLogin()
    is DataError.Server -> showRetry()
}`,
      },
      {
        t: "list",
        items: [
          "**Explicit and exhaustive** — a sealed error type forces the ViewModel to handle every case in a `when`, so you can't forget to handle 'offline' or 'unauthorized'. Exceptions are easy to forget to catch.",
          "**Decoupled from libraries** — mapping `HttpException`/`IOException` to your own `DataError` at the boundary means the rest of your app never depends on Retrofit/OkHttp exception types. If you swap networking libraries, only the mapper changes.",
          "**Better UX mapping** — each typed error maps cleanly to a UX response (offline message, login redirect, retry), rather than parsing exception messages.",
          "**Reserves exceptions for real bugs** — expected failures become data; a thrown exception then genuinely means something is wrong (a programming error), making crash reports meaningful.",
        ],
      },
      {
        t: "p",
        text: "The one caution: when catching broadly to build the result, always rethrow `CancellationException` first (or catch specific types), or you'll break coroutine cancellation. This 'errors as values' approach is the modern recommended pattern and ties into Clean Architecture's layered error handling.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does token-based authentication work in an Android app with Retrofit?",
    a: [
      {
        t: "p",
        text: "**The app obtains a token at login and then attaches it to every request via an OkHttp interceptor, so the server can identify the user on each stateless request.** The typical setup uses two OkHttp mechanisms: an *Interceptor* to attach the token, and an *Authenticator* to refresh it when it expires.",
      },
      {
        t: "list",
        items: [
          "**Login** — the user posts credentials; the server returns an access token (and usually a refresh token).",
          "**Attach with an Interceptor** — an `AuthInterceptor` adds `Authorization: Bearer <accessToken>` to every outgoing request automatically, so you don't add it manually on each API call.",
          "**Refresh with an Authenticator** — when a request returns 401 (token expired), OkHttp calls the `Authenticator`, which uses the refresh token to get a new access token and retries the request with it — transparently, without the user noticing.",
          "**Store securely** — tokens go in `EncryptedSharedPreferences` or encrypted storage, never plaintext.",
        ],
      },
      {
        t: "p",
        text: "The access token is usually short-lived (for security — if it leaks, it expires soon), and the refresh token is longer-lived and used only to mint new access tokens. If refreshing *also* fails (the refresh token expired or was revoked), the app clears the session and sends the user to login — the 'you've been logged out' flow. This design works precisely because HTTP is stateless: the server doesn't remember you between requests, so you re-present the token every time, and the interceptor makes that automatic.",
      },
    ],
  },
  {
    level: "junior",
    q: "When should you retry a failed network request and when should you not?",
    a: [
      {
        t: "p",
        text: "**Retry *transient* failures — ones that might succeed on a second attempt — and don't retry failures that will fail identically no matter how many times you try.** The distinction comes from the error type and HTTP status code.",
      },
      {
        t: "list",
        items: [
          "**Retry**: network/IO failures (`IOException`, timeouts) — the request may have just hit a temporary connectivity blip. And 5xx server errors — the server had a transient problem that may resolve.",
          "**Don't retry**: 4xx client errors — they mean *your request is wrong* (400 bad request, 403 forbidden, 404 not found), so retrying the same request fails the same way. Also don't retry parse errors (a bug/API mismatch).",
          "**Special cases**: retry a 401 *after* refreshing the token (the retry uses the new token); retry a 429 (rate-limited) only *after* waiting the required delay.",
        ],
      },
      {
        t: "p",
        text: "And when you do retry, do it properly: use *exponential backoff* (increasing delays between attempts) so you don't hammer a struggling server, add *jitter* (randomness) so many clients don't retry in sync, and *bound* the attempts (e.g. 3) so a persistent failure doesn't loop forever draining battery. One more critical point: only blindly retry *idempotent* requests (GET/PUT/DELETE); for a POST that has side effects (placing an order), a blind retry could duplicate the action, so those need an idempotency key. The short rule: retry transient errors (network, 5xx) with bounded exponential backoff + jitter; never blindly retry client errors or non-idempotent operations.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you implement automatic token refresh, and what's the concurrency challenge?",
    a: [
      {
        t: "p",
        text: "**You use an OkHttp `Authenticator`, which OkHttp invokes automatically when a response comes back 401. In it, you refresh the access token using the refresh token and return the original request rebuilt with the new token — OkHttp then automatically retries it. Returning `null` signals 'give up' (refresh failed → log out).** The `Authenticator` is specifically designed for this reactive 'refresh on 401' flow, distinct from the `Interceptor` that proactively attaches the token.",
      },
      {
        t: "code",
        title: "The Authenticator with refresh dedup",
        code: `class TokenAuthenticator(private val store: TokenStore, private val authApi: AuthApi) : Authenticator {
    override fun authenticate(route: Route?, response: Response): Request? {
        synchronized(this) {
            // If another thread already refreshed, use the new token instead of refreshing again
            val current = store.access()
            if (response.request.header("Authorization") != "Bearer $current") {
                return response.request.newBuilder()
                    .header("Authorization", "Bearer $current").build()
            }
            val refreshed = runBlocking { authApi.refresh(store.refresh()) } ?: return null
            store.saveAccess(refreshed.access)
            return response.request.newBuilder()
                .header("Authorization", "Bearer \${refreshed.access}").build()
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**The concurrency challenge — the thundering herd of refreshes**: if the token expires while *several* requests are in flight, they *all* come back 401 around the same time, and each would independently trigger a refresh. That means N simultaneous refresh calls — wasteful, and worse, dangerous: many auth servers *rotate* the refresh token on use (return a new refresh token and invalidate the old), so parallel refreshes race, some using an already-invalidated refresh token, and you can end up logging the user out incorrectly.",
          "**The fix — serialize and deduplicate the refresh**: use a lock (`synchronized`/`Mutex`) so only one refresh happens at a time. Critically, *before* refreshing inside the lock, check whether the token was *already refreshed* by a concurrent request (compare the failing request's token to the current stored token) — if so, just retry with the already-new token instead of refreshing again. This 'check-then-refresh under a lock' ensures exactly one refresh serves all the 401s.",
          "**On refresh failure** — return `null` from the `Authenticator` so OkHttp stops retrying, and trigger the logout flow (clear session, navigate to login). Distinguish 'refresh token expired' (log out) from a transient network error during refresh (which you might retry).",
          "**Avoid infinite loops** — if the retried request *also* 401s (e.g. the new token is immediately rejected), the Authenticator could loop; guard against retrying more than once (OkHttp limits this, but check `responseCount`).",
          "**`runBlocking` caveat** — the `Authenticator` API is synchronous, so calling a suspend refresh requires `runBlocking`, which is acceptable here because it runs on OkHttp's background thread (not the main thread), but it's a known friction point.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: automatic token refresh is straightforward in the happy path but the *concurrency* is where it goes wrong in production — concurrent 401s causing racing refreshes and (with rotating refresh tokens) spurious logouts. The robust implementation serializes refresh with a lock, deduplicates by checking if the token was already refreshed, handles refresh failure by logging out, and guards against retry loops. Getting this right is what makes 'the session silently keeps working' feel seamless instead of randomly logging users out.",
      },
    ],
  },
  {
    level: "senior",
    q: "In an offline-first app, how should a failed network refresh affect the UI?",
    a: [
      {
        t: "p",
        text: "**It should *not* blank the screen or replace content with a full-screen error — because the app has cached data to show. Instead, keep displaying the cached content and surface the refresh failure *non-destructively* (e.g. a snackbar or a subtle indicator), so the user still sees useful data and just knows the latest fetch didn't succeed.** This follows directly from the single-source-of-truth architecture: the UI reads from the local database, and a failed network refresh simply means the database wasn't updated — it doesn't affect the UI's ability to show what's already cached.",
      },
      {
        t: "list",
        items: [
          "**The mechanism**: because the UI observes the local DB (SSOT), it *always* has data to display. A refresh is a separate operation that *tries* to update the DB. If the refresh fails (offline, server error), the DB keeps its previous data, the observing UI keeps showing it, and you report the *refresh's* failure separately from the *data display*.",
          "**Separate 'data' state from 'refresh' state**: the UI state should distinguish 'here's the data' (from the DB, always present if cached) from 'the last refresh failed' (a transient status). A common shape: `UiState(items = cached, isRefreshing = false, refreshError = \"Couldn't update\")`. The list shows `items`; the error shows as a snackbar; neither wipes the other.",
          "**Contrast with the empty case**: if there's *no* cached data at all (first launch, offline), *then* a failure does warrant a full-screen error/empty state with retry — because there's genuinely nothing to show. So the rule is conditional: show cached data + gentle error if cache exists; show full-screen error + retry only if there's nothing cached.",
          "**Offer retry appropriately**: for transient errors (network, 5xx), a retry affordance (pull-to-refresh, a retry button on the snackbar) makes sense. For a 403, retry is pointless — guide the user differently.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: this is a defining benefit of offline-first / SSOT architecture — errors become *non-blocking* because the UI's data source (the DB) is decoupled from the network. The design principle is 'never punish the user for a failed background refresh when you already have data to show' — degrade gracefully by keeping cached content visible and reporting the refresh failure gently, reserving full-screen error states for the genuine 'no data at all' case. An app that shows a full-screen error and loses the user's content every time a refresh fails on a flaky network is exactly the fragile experience offline-first exists to prevent.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you model network results as a sealed type (Result/Resource)?",
    a: [
      {
        t: "p",
        text: "Wrap network outcomes in a sealed type — `Result<T>` (Kotlin's) or a custom `Resource<T>`/`ApiResult<T>` with `Success(data)`, `Error(type/message)`, and optionally `Loading`. The repository catches exceptions and maps them to this type, so callers handle outcomes with an exhaustive `when` instead of try/catch scattered everywhere — errors become data.",
      },
      {
        t: "code",
        title: "Sealed result",
        code: `sealed interface ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>
    data class Error(val type: ErrorType, val message: String?) : ApiResult<Nothing>
}
suspend fun getUser(id: String): ApiResult<User> = try {
    ApiResult.Success(api.getUser(id))
} catch (e: IOException) { ApiResult.Error(ErrorType.Network, null) }
  catch (e: HttpException) { ApiResult.Error(ErrorType.from(e.code()), e.message()) }`,
      },
      {
        t: "list",
        items: [
          "**Sealed `Success`/`Error`** — outcomes as data.",
          "**Repository maps** — catch exceptions, produce the result.",
          "**Exhaustive `when`** — callers handle all cases.",
          "**Preserve cancellation** — rethrow `CancellationException`.",
        ],
      },
      {
        t: "note",
        text: "Model outcomes as a sealed type (Result<T>/Resource<T> with Success/Error, optional Loading). The repository catches exceptions and maps to it, so callers use an exhaustive when instead of scattered try/catch — errors as data. Rethrow CancellationException in the mapping.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you implement exponential backoff with jitter for retries?",
    a: [
      {
        t: "p",
        text: "Retry transient failures with a delay that grows exponentially (`base * 2^attempt`) plus random *jitter* (so many clients don't retry in sync — the thundering herd). Cap the number of attempts and the max delay, and only retry idempotent/transient errors (5xx, timeouts, connectivity) — not 4xx. In coroutines, `delay` makes the wait cancellable.",
      },
      {
        t: "code",
        title: "Backoff retry",
        code: `suspend fun <T> retry(times: Int = 3, block: suspend () -> T): T {
    var delayMs = 500L
    repeat(times - 1) { attempt ->
        try { return block() }
        catch (e: CancellationException) { throw e }
        catch (e: Exception) { if (!e.isTransient()) throw e }
        delay(delayMs + Random.nextLong(0, 250)); delayMs = (delayMs * 2).coerceAtMost(8000)
    }
    return block()
}`,
      },
      {
        t: "list",
        items: [
          "**Exponential** — `base * 2^attempt`; spreads retries.",
          "**Jitter** — randomness avoids synchronized retries.",
          "**Cap** — max attempts + max delay.",
          "**Transient only** — 5xx/timeouts/connectivity; not 4xx or cancellation.",
        ],
      },
      {
        t: "note",
        text: "Retry transient failures with delay = base * 2^attempt + random jitter (avoid thundering herd), capping attempts and max delay, only for transient errors (5xx/timeouts/connectivity — not 4xx). Rethrow CancellationException. delay makes the wait cancellable in coroutines.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you securely store authentication tokens?",
    a: [
      {
        t: "p",
        text: "Don't store tokens in plain SharedPreferences/DataStore. Use the Android *Keystore* to hold an encryption key (hardware-backed, non-exportable) and encrypt the token before persisting, or use `EncryptedSharedPreferences`. Prefer *short-lived access tokens* + a refresh token so a leaked access token expires quickly. On logout, clear all tokens.",
      },
      {
        t: "list",
        items: [
          "**Not plaintext** — never plain prefs/DataStore for tokens.",
          "**Keystore-encrypted** — hardware-backed key; encrypt the token.",
          "**Short-lived access + refresh** — limit exposure of a leaked token.",
          "**Clear on logout** — wipe tokens.",
        ],
      },
      {
        t: "note",
        text: "Store tokens encrypted: use the Android Keystore (hardware-backed, non-exportable key) to encrypt before persisting, or EncryptedSharedPreferences — never plaintext prefs/DataStore. Prefer short-lived access tokens + refresh tokens to limit leaked-token exposure; clear all tokens on logout.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between an interceptor and an Authenticator for auth?",
    a: [
      {
        t: "p",
        text: "An *interceptor* runs on *every* request — use it to *proactively add* the `Authorization` header. An *Authenticator* is called *reactively* by OkHttp only when a response is `401 Unauthorized` — use it to *refresh* the token and retry. So the interceptor attaches the current token; the Authenticator recovers from an expired one. They work together.",
      },
      {
        t: "list",
        items: [
          "**Interceptor** — proactive; adds the auth header to every request.",
          "**Authenticator** — reactive; called on 401 to refresh + retry.",
          "**Together** — interceptor attaches token, Authenticator refreshes on expiry.",
          "**Authenticator can return null** — to give up (logout).",
        ],
      },
      {
        t: "note",
        text: "An interceptor runs on every request (proactively add Authorization); an Authenticator is called by OkHttp only on 401 (reactively refresh the token and retry, or return null to give up). Interceptor attaches the current token; Authenticator recovers from expiry. They complement each other.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you distinguish between different network error types?",
    a: [
      {
        t: "p",
        text: "Map exceptions/status codes to distinct types: `IOException`/`UnknownHostException` → *no connectivity*; `SocketTimeoutException` → *timeout* (retryable); `HttpException` with 401 → *unauthorized* (refresh); 403 → *forbidden*; 404 → *not found*; 4xx → *client error*; 5xx → *server error* (retryable); `SerializationException` → *parse error* (a bug/API change). Each maps to different UI and retry behavior.",
      },
      {
        t: "list",
        items: [
          "**Connectivity** — `IOException`/`UnknownHostException` → offline UI.",
          "**Timeout** — `SocketTimeoutException` → retryable.",
          "**HTTP** — `HttpException` code: 401 refresh, 403/404 surface, 5xx retry.",
          "**Parse** — `SerializationException` → a bug/API change (report).",
        ],
      },
      {
        t: "note",
        text: "Map to types: IOException/UnknownHostException = offline; SocketTimeoutException = timeout (retryable); HttpException by code (401 refresh, 403/404 surface, 4xx client, 5xx retryable); SerializationException = parse error (bug/API change — report). Each drives different UI and retry behavior.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle a 401 that means the session is truly expired?",
    a: [
      {
        t: "p",
        text: "A 401 first triggers a *token refresh* attempt. If the refresh *also fails* (refresh token expired/revoked), the session is genuinely over — you should *log the user out*: clear tokens, clear user data, and navigate to login. Emit a global 'session expired' event (a Channel/SharedFlow the app observes) so this happens once, cleanly, regardless of which request hit the 401.",
      },
      {
        t: "list",
        items: [
          "**401 → refresh** — try to get a new token first.",
          "**Refresh fails → logout** — clear tokens/data, go to login.",
          "**Global event** — emit 'session expired' once (Channel/SharedFlow).",
          "**Clean, single logout** — regardless of which request triggered it.",
        ],
      },
      {
        t: "note",
        text: "401 first triggers a refresh; if refresh also fails (refresh token expired/revoked), the session is over — log out: clear tokens/user data, navigate to login. Emit a global 'session expired' event (Channel/SharedFlow) so logout happens once cleanly, no matter which request hit the 401.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you show errors to the user meaningfully?",
    a: [
      {
        t: "p",
        text: "Map typed errors to *helpful, actionable* messages: 'You're offline — check your connection' (with retry) for connectivity, 'Something went wrong, try again' for 5xx (retry), specific validation messages for 4xx, and 'Session expired, please log in' for auth. Avoid raw exception text/codes. Distinguish transient (retry) from permanent (fix/inform) errors, and keep the app usable (cached data) where possible.",
      },
      {
        t: "list",
        items: [
          "**Actionable messages** — 'offline, retry', not raw stack traces.",
          "**Match error type** — connectivity/server/validation/auth.",
          "**Retry affordance** — for transient errors.",
          "**Keep usable** — show cached data when offline.",
        ],
      },
      {
        t: "note",
        text: "Map typed errors to actionable messages: 'offline — check connection' (retry) for connectivity, 'try again' for 5xx, specific validation for 4xx, 'session expired' for auth — never raw exception text/codes. Distinguish transient (retry) from permanent (fix/inform); keep the app usable with cached data.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a circuit breaker, and when is it useful?",
    a: [
      {
        t: "p",
        text: "A circuit breaker stops hammering a failing service: after a threshold of failures, it 'opens' (fails fast without calling the network) for a cooldown, then 'half-opens' to test recovery. This prevents wasting resources and worsening an outage, and gives a fast, predictable failure to the UI. It's more common server-side but useful on the client for a repeatedly-failing endpoint.",
      },
      {
        t: "list",
        items: [
          "**Open on repeated failures** — fail fast without calling.",
          "**Cooldown then half-open** — test if the service recovered.",
          "**Avoids hammering** — a struggling service and wasting battery/data.",
          "**Client use** — a repeatedly-failing endpoint; combine with backoff.",
        ],
      },
      {
        t: "note",
        text: "A circuit breaker opens after repeated failures (fail fast without calling), waits a cooldown, then half-opens to test recovery — preventing hammering a failing service and giving fast predictable failures. More common server-side but useful client-side for a repeatedly-failing endpoint; combine with backoff.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle authentication for WebSockets or long-lived connections?",
    a: [
      {
        t: "p",
        text: "WebSockets can't easily add per-message auth headers, so authenticate at *connection time*: pass the token in the connection request headers (or a query param, less ideal — it's logged), or send an auth message as the first frame after connecting. When the token expires, you typically *reconnect* with a fresh token. Handle 401/auth-failure on connect by refreshing and retrying the connection.",
      },
      {
        t: "list",
        items: [
          "**Auth at connect** — token in the upgrade request headers (preferred).",
          "**Or first-frame auth** — send an auth message after connecting.",
          "**Token expiry** — reconnect with a refreshed token.",
          "**Avoid token in query** — it gets logged.",
        ],
      },
      {
        t: "note",
        text: "WebSockets authenticate at connection time: pass the token in the upgrade request headers (preferred) or send an auth message as the first frame; avoid tokens in the query (logged). On expiry, reconnect with a refreshed token; handle connect-time auth failure by refreshing and retrying.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test error and auth handling?",
    a: [
      {
        t: "p",
        text: "Use `MockWebServer` to enqueue error responses (500, 401, timeouts via `setBodyDelay`, malformed bodies) and assert your code maps them to the right typed errors and UI states. Test the *refresh flow*: enqueue a 401 then a successful retry after refresh, and assert one refresh happened and the request succeeded. Test the *give-up* path (refresh fails → logout).",
      },
      {
        t: "list",
        items: [
          "**MockWebServer error responses** — 500/401/timeouts/malformed.",
          "**Assert error mapping** — correct typed errors/UI states.",
          "**Refresh flow** — 401 then success; assert single refresh.",
          "**Give-up path** — refresh fails → logout event.",
        ],
      },
      {
        t: "note",
        text: "Test with MockWebServer: enqueue error responses (500/401/timeouts via setBodyDelay/malformed) and assert correct typed-error mapping and UI states. Test the refresh flow (401 → success after one refresh) and the give-up path (refresh fails → logout event). Verify concurrency (simultaneous 401s → one refresh).",
      },
    ],
  },
  {
    level: "junior",
    q: "Why should errors be handled in the repository, not the UI?",
    a: [
      {
        t: "p",
        text: "The repository is the boundary between the network/data layer and the app. Handling errors there — catching exceptions, mapping to typed domain errors — means the UI receives clean, typed results (`Success`/`Error` states) and doesn't need to know about `HttpException`/`IOException`/parsing. This decouples the UI from network details, centralizes error logic, and makes both layers simpler and more testable.",
      },
      {
        t: "list",
        items: [
          "**Boundary** — the repository translates network errors to domain errors.",
          "**Clean UI** — receives typed results, not framework exceptions.",
          "**Centralized** — one place for error mapping.",
          "**Testable** — the UI tests use typed states; the repo tests cover mapping.",
        ],
      },
      {
        t: "note",
        text: "Handle errors in the repository (the data-layer boundary): catch exceptions and map to typed domain errors, so the UI gets clean Success/Error states without knowing HttpException/IOException/parsing. Decouples the UI from network details, centralizes error logic, and makes both layers simpler and testable.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle partial failures when loading multiple sources?",
    a: [
      {
        t: "p",
        text: "When a screen loads several independent things (profile, feed, ads) and one fails, don't fail the whole screen. Use `supervisorScope` + `async` so one failure doesn't cancel the others, wrap each in `runCatching`, and render the successful sections with an error/placeholder only for the failed one. This gives partial content instead of an all-or-nothing screen.",
      },
      {
        t: "list",
        items: [
          "**`supervisorScope` + `async`** — isolate each source's failure.",
          "**`runCatching` per source** — a failure becomes a local error state.",
          "**Partial rendering** — show successes, error only the failed section.",
          "**vs `coroutineScope`** — that would fail the whole load.",
        ],
      },
      {
        t: "note",
        text: "For a screen loading independent sources, use supervisorScope + async so one failure doesn't cancel the rest, with runCatching per source turning a failure into a local error/placeholder — render successful sections and error only the failed one. Partial content beats an all-or-nothing screen (coroutineScope would fail everything).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you propagate a global logout event across the app?",
    a: [
      {
        t: "p",
        text: "When auth fails irrecoverably (refresh failed), you need *one* logout regardless of which request triggered it. Emit a global event from an app-scoped source — a `SharedFlow`/`Channel` in a session/auth manager (singleton). The app (or a root observer) collects it, clears session data, and navigates to login. Using a shared event source avoids each failing request trying to log out separately.",
      },
      {
        t: "code",
        title: "Global logout event",
        code: `object SessionManager {
    private val _events = MutableSharedFlow<SessionEvent>(extraBufferCapacity = 1)
    val events = _events.asSharedFlow()
    fun forceLogout() { _events.tryEmit(SessionEvent.LoggedOut) }
}
// App root collects events -> clear data, navigate to login`,
      },
      {
        t: "list",
        items: [
          "**App-scoped event source** — `SharedFlow`/`Channel` in a session manager.",
          "**Single logout** — one event handled once, not per request.",
          "**Root observer** — clears data, navigates to login.",
          "**Triggered by** — failed refresh / irrecoverable 401.",
        ],
      },
      {
        t: "note",
        text: "For an app-wide logout (e.g. failed refresh), emit a global event from an app-scoped SharedFlow/Channel in a session manager; a root observer collects it once, clears session data, and navigates to login — avoiding each failing request logging out separately. One clean logout regardless of trigger.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you add auth to a multi-module app cleanly?",
    a: [
      {
        t: "p",
        text: "Keep auth concerns in a *network/auth module* that provides the configured `OkHttpClient` (with the auth interceptor + Authenticator) and a `TokenStore` interface. Feature modules depend on the API interfaces, not the auth wiring. The token store and session manager are singletons in the auth module, injected via DI — so every feature's requests are authenticated without each module handling auth.",
      },
      {
        t: "list",
        items: [
          "**Auth in one module** — client + interceptor + Authenticator + TokenStore.",
          "**Feature modules** — depend on API interfaces, not auth wiring.",
          "**DI** — singleton token store/session manager injected.",
          "**Centralized** — auth logic in one place, reused everywhere.",
        ],
      },
      {
        t: "note",
        text: "Put auth in a network/auth module: it provides the configured OkHttpClient (auth interceptor + Authenticator) and a TokenStore interface, all singletons via DI. Feature modules depend on API interfaces, not the auth wiring — so every request is authenticated with auth logic centralized in one place.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you avoid leaking sensitive data through logs and errors?",
    a: [
      {
        t: "p",
        text: "Don't log request/response bodies or headers containing tokens/PII in production (gate `HttpLoggingInterceptor` behind `BuildConfig.DEBUG`, `redactHeader` for auth). Don't include raw server errors or tokens in crash reports/analytics. Sanitize error messages shown to users (no internal details). Store tokens encrypted. Treat any logged/reported string as potentially visible.",
      },
      {
        t: "list",
        items: [
          "**No body/header logging in prod** — gate on debug; redact auth headers.",
          "**Sanitize crash reports** — no tokens/PII/raw server data.",
          "**User-facing messages** — no internal details.",
          "**Encrypt tokens** — and never log them.",
        ],
      },
      {
        t: "note",
        text: "Avoid leaking data: don't log bodies/headers with tokens/PII in production (gate logging on BuildConfig.DEBUG, redactHeader auth); keep tokens/PII/raw server data out of crash reports/analytics; sanitize user-facing messages; encrypt tokens and never log them. Treat any logged/reported string as potentially exposed.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you implement request deduplication for identical concurrent calls?",
    a: [
      {
        t: "p",
        text: "If multiple parts of the app request the *same* data simultaneously, dedupe so only one network call happens and all share the result. Use a shared in-flight cache keyed by request (a map of `Deferred`), or expose the data as a shared hot flow (`shareIn`) so collectors reuse one upstream. This avoids redundant calls (and is how a well-designed repository serves multiple observers).",
      },
      {
        t: "list",
        items: [
          "**In-flight map** — key → shared `Deferred`; callers await the same one.",
          "**Shared flow** — `shareIn`/`stateIn` so collectors reuse one upstream.",
          "**Avoids redundant calls** — one fetch serves many callers.",
          "**Repository role** — a good repository dedupes for its observers.",
        ],
      },
      {
        t: "note",
        text: "Dedupe identical concurrent requests: keep an in-flight map (key → shared Deferred) so callers await the same fetch, or expose data as a shared hot flow (shareIn/stateIn) so collectors reuse one upstream. One network call serves many callers — a well-designed repository does this for its observers.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is refresh token rotation, and how do you handle it?",
    a: [
      {
        t: "p",
        text: "With *rotation*, each time you use a refresh token to get a new access token, the server *also issues a new refresh token* and *invalidates the old one*. This limits the damage of a stolen refresh token (it's single-use). The client must *store the new refresh token* atomically after each refresh — and if two refreshes race, one gets an invalid-token error, so you must serialize refresh (single-flight) to avoid invalidating your own token.",
      },
      {
        t: "list",
        items: [
          "**Rotation** — refresh returns a new refresh token; old one invalidated.",
          "**Store the new one** — atomically after each refresh.",
          "**Single-flight** — serialize refresh so races don't invalidate the token.",
          "**Security** — a stolen refresh token is single-use.",
        ],
      },
      {
        t: "note",
        text: "Refresh token rotation issues a NEW refresh token on each refresh and invalidates the old (single-use — limits theft damage). The client must store the new token atomically; because a race could invalidate your own token, serialize refresh (single-flight with a Mutex). Handle 'invalid refresh token' by logging out.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you refresh tokens proactively and handle clock skew?",
    a: [
      {
        t: "p",
        text: "Rather than only reacting to 401s, you can *proactively* refresh when the access token is *about to expire* (check `expiresAt` before a request). To handle *clock skew* (the device clock differing from the server's), refresh a bit *early* (e.g. 60s before expiry) so a slightly-fast device clock doesn't send an already-expired token. Combine proactive refresh with the reactive 401 Authenticator as a fallback.",
      },
      {
        t: "list",
        items: [
          "**Proactive refresh** — refresh before expiry (check `expiresAt`).",
          "**Skew buffer** — refresh early (e.g. 60s) to tolerate clock differences.",
          "**Fallback** — the 401 Authenticator still catches unexpected expiry.",
          "**Fewer 401s** — smoother UX than reacting after failure.",
        ],
      },
      {
        t: "note",
        text: "Proactively refresh when the access token is near expiry (check expiresAt), with an early buffer (~60s) to tolerate clock skew (a fast device clock could send an expired token). Keep the reactive 401 Authenticator as a fallback. Proactive refresh reduces 401s and smooths UX.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you bound the total time of a network operation?",
    a: [
      {
        t: "p",
        text: "Beyond OkHttp's per-phase timeouts, you can bound a whole *operation* (which might involve several calls or retries) with `withTimeout(duration) { }` in the coroutine — it cancels the block and throws `TimeoutCancellationException` if it overruns. Use `withTimeoutOrNull` to fall back to cached data instead of throwing. This guarantees the user isn't waiting indefinitely.",
      },
      {
        t: "code",
        title: "Operation timeout",
        code: `val data = withTimeoutOrNull(5000) { repo.loadWithRetries() } ?: cachedData()`,
      },
      {
        t: "list",
        items: [
          "**OkHttp timeouts** — per connect/read/write/call.",
          "**`withTimeout`** — bound a whole coroutine operation (multiple calls/retries).",
          "**`withTimeoutOrNull`** — fall back to cache instead of throwing.",
          "**Guarantee** — the user never waits indefinitely.",
        ],
      },
      {
        t: "note",
        text: "OkHttp bounds per-request phases; withTimeout(duration) { } bounds a whole coroutine operation (multiple calls/retries) — cancels + throws TimeoutCancellationException on overrun. withTimeoutOrNull falls back to cache instead of throwing. Guarantees the user isn't waiting indefinitely.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle SSL/TLS errors gracefully?",
    a: [
      {
        t: "p",
        text: "TLS errors (`SSLHandshakeException`, `SSLPeerUnverifiedException`) mean the secure connection couldn't be established or verified — often a proxy/MITM, an expired/invalid server cert, a clock issue, or a pinning mismatch. *Never* disable certificate validation to 'fix' it (that removes security). Surface a clear error ('Secure connection failed'), log for diagnosis, and check certificate/pinning configuration. For dev, use a debug-only network config, never in release.",
      },
      {
        t: "list",
        items: [
          "**TLS errors** — handshake/verification failures (MITM, bad cert, clock, pinning).",
          "**Never disable validation** — it removes security (a major vulnerability).",
          "**Surface clearly** — 'secure connection failed'; log for diagnosis.",
          "**Debug-only config** — for dev servers; never trust-all in release.",
        ],
      },
      {
        t: "note",
        text: "TLS errors (SSLHandshakeException/SSLPeerUnverifiedException) = failed/unverified secure connection (MITM, bad/expired cert, clock skew, pinning mismatch). NEVER disable cert validation to 'fix' it (removes security). Surface a clear error, log, check cert/pinning config. Use debug-only network config for dev, never trust-all in release.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is request signing (HMAC), and when is it used?",
    a: [
      {
        t: "p",
        text: "Request signing computes a cryptographic signature (e.g. HMAC-SHA256 over the method, path, body, timestamp, and a secret) and sends it in a header; the server recomputes it to verify the request wasn't tampered with and came from a legitimate client. It's used by some APIs (payments, AWS-style) for integrity/authenticity beyond bearer tokens. On mobile, protect the signing secret carefully (it's a client secret — inherently at some risk).",
      },
      {
        t: "list",
        items: [
          "**HMAC signature** — over method/path/body/timestamp + secret.",
          "**Server verifies** — integrity + authenticity (tamper detection).",
          "**Timestamp** — prevents replay (with a nonce/short window).",
          "**Secret protection** — a client-embedded secret is a risk; minimize exposure.",
        ],
      },
      {
        t: "note",
        text: "Request signing computes an HMAC (over method/path/body/timestamp + secret) sent in a header; the server recomputes to verify integrity/authenticity (tamper detection), with a timestamp/nonce against replay. Used by payment/AWS-style APIs beyond bearer tokens. Protect the signing secret — a client-embedded secret is inherently at some risk.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle a required app update triggered by the API?",
    a: [
      {
        t: "p",
        text: "When a backend introduces a breaking change, it may return a specific status/error (or a version-check endpoint) indicating the client is too old. The app detects this (via a response header/code or a config check) and shows a *force-update* screen linking to the Play Store, blocking further use. Combine with API versioning and Play *in-app updates* (immediate flow) for a smooth forced upgrade.",
      },
      {
        t: "list",
        items: [
          "**Version signal** — a status/header/config indicating min supported version.",
          "**Force-update screen** — block use, link to Play Store.",
          "**In-app updates** — Play's immediate update flow.",
          "**API versioning** — keep old clients working until forced upgrade.",
        ],
      },
      {
        t: "note",
        text: "For a breaking API change, the backend signals the client is too old (a status/header or version-check/Remote Config). The app shows a force-update screen (link to Play, block use), ideally via Play In-App Updates (immediate flow). Combine with API versioning so old clients work until they must upgrade.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you cancel and clean up in-flight requests on logout?",
    a: [
      {
        t: "p",
        text: "On logout, cancel any in-flight work so authenticated requests don't complete (or update UI) after the session ends. Because requests run in scopes (`viewModelScope`), navigating away cancels them; for app-scoped work, cancel that scope or the specific jobs. Also clear the token so no new authenticated requests go out, and clear cached user data. Coroutine cancellation aborts the underlying OkHttp calls.",
      },
      {
        t: "list",
        items: [
          "**Cancel scopes/jobs** — abort in-flight authenticated requests.",
          "**Clear the token** — stop new authenticated requests.",
          "**Clear user data** — DB/cache/prefs.",
          "**Coroutine cancellation** — aborts the underlying OkHttp calls.",
        ],
      },
      {
        t: "note",
        text: "On logout, cancel in-flight work (scope/job cancellation aborts the underlying OkHttp calls) so authenticated requests don't complete after the session ends, clear the token (no new authenticated requests), and wipe cached user data. viewModelScope work cancels on navigation; cancel app-scoped work explicitly.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is graceful degradation for network features?",
    a: [
      {
        t: "p",
        text: "Graceful degradation means the app stays *useful* when the network is unavailable or degraded, rather than showing a dead screen. Serve cached data (offline-first), disable/queue actions that need connectivity (with clear messaging), show reduced functionality instead of errors, and recover automatically when connectivity returns. The principle: degrade the experience proportionally, don't fail completely.",
      },
      {
        t: "list",
        items: [
          "**Serve cache** — offline-first content stays available.",
          "**Queue/disable network actions** — with clear messaging.",
          "**Reduced functionality** — over dead screens/errors.",
          "**Auto-recover** — resume when connectivity returns.",
        ],
      },
      {
        t: "note",
        text: "Graceful degradation keeps the app useful under poor/no network: serve cached data (offline-first), queue or disable connectivity-dependent actions with clear messaging, show reduced functionality instead of errors, and auto-recover when online. Degrade proportionally — don't fail completely.",
      },
    ],
  },
];

export default qa;
