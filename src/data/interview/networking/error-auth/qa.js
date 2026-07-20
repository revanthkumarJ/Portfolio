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
];

export default qa;
