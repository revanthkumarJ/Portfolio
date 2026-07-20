// HTTP & REST Fundamentals — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What are the main HTTP methods and what is each for?",
    a: [
      {
        t: "list",
        items: [
          "**GET** — retrieve data. It should be *safe* (no side effects) and is cacheable. Use it for reads only; never change server state with a GET.",
          "**POST** — create a new resource or submit data (a form, a new item). It carries a body and is *not idempotent* — sending it twice creates two resources.",
          "**PUT** — replace/update a resource *fully* (you send all its fields). It's idempotent — the same request produces the same result each time.",
          "**PATCH** — partially update a resource (send only the changed fields).",
          "**DELETE** — remove a resource. Idempotent (deleting something twice leaves it deleted).",
        ],
      },
      {
        t: "p",
        text: "The concept that ties these together is *idempotency* — whether repeating a request has the same effect as doing it once. GET, PUT, and DELETE are idempotent, which makes them safe to retry (important when a request times out and you're unsure if it went through). POST is *not* idempotent, so blindly retrying it can create duplicates — which is why retrying a POST needs care (like an idempotency key the server uses to dedupe). Knowing which methods are safe to retry directly informs how you build resilient networking.",
      },
    ],
  },
  {
    level: "junior",
    q: "What do HTTP status code categories mean?",
    a: [
      {
        t: "p",
        text: "**The first digit of a status code tells you the category of outcome**, which tells you how to react:",
      },
      {
        t: "list",
        items: [
          "**2xx — Success**: the request worked. `200 OK` (here's the data), `201 Created` (resource created), `204 No Content` (success, nothing to return).",
          "**3xx — Redirection**: further action needed. `301 Moved Permanently`, `304 Not Modified` (your cached version is still current — no body sent, used for efficient caching).",
          "**4xx — Client error**: *your request* is wrong. `400 Bad Request`, `401 Unauthorized` (not authenticated), `403 Forbidden` (no permission), `404 Not Found`, `429 Too Many Requests` (rate-limited).",
          "**5xx — Server error**: the *server* failed. `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable`.",
        ],
      },
      {
        t: "p",
        text: "The practical distinction for handling errors: **5xx errors are often transient** (the server hiccupped), so retrying with backoff may succeed. **4xx errors mean your request is fundamentally wrong**, so retrying the *same* request will fail identically — don't retry (with two exceptions: retry after a `401` if you can refresh the auth token, and retry after a `429` once you've waited the required time). Mapping status codes to the right reaction — retry, re-authenticate, show an error, back off — is core to robust networking.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is REST?",
    a: [
      {
        t: "p",
        text: "**REST (Representational State Transfer) is an architectural style for web APIs, organized around *resources* (nouns) that you act on with the standard HTTP *methods* (verbs).** A resource — a user, a post, a collection of orders — is identified by a URL, and you manipulate it with GET (read), POST (create), PUT/PATCH (update), and DELETE (remove).",
      },
      {
        t: "code",
        title: "RESTful design",
        code: `GET    /users        // list users
POST   /users        // create a user
GET    /users/42     // read user 42
PUT    /users/42     // replace user 42
DELETE /users/42     // delete user 42`,
      },
      {
        t: "p",
        text: "The key ideas: **URLs name resources (nouns), not actions** — `/getUser` is not RESTful, but `GET /users/42` is (the verb is the HTTP method, not part of the URL). It's **stateless** — each request carries everything the server needs (like an auth token), and the server keeps no session between requests. Data is typically exchanged as **JSON**. Most Android apps consume REST APIs. Worth knowing as alternatives: **GraphQL** (the client specifies exactly what fields it wants in one query, avoiding over- and under-fetching) and **gRPC** (an efficient binary protocol over HTTP/2, common for backend-to-backend). REST remains the most common for mobile, but recognizing when an API is or isn't RESTful, and knowing the alternatives, shows solid fundamentals.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does authentication typically work in a REST API?",
    a: [
      {
        t: "p",
        text: "**Because HTTP is stateless, the client must prove its identity on *every* request — most commonly by sending a token in the `Authorization` header.** The typical flow: the user logs in (POST credentials), the server returns a token (often a JWT), and the app then includes `Authorization: Bearer <token>` on every subsequent request. The server validates the token to identify the user, without keeping any session state itself.",
      },
      {
        t: "list",
        items: [
          "**Token-based (Bearer)** — the standard for mobile. The token is a credential the server issues and the client presents on each request. Tokens usually expire for security.",
          "**Access + refresh tokens** — a common pattern: a short-lived *access token* (used on requests) plus a long-lived *refresh token* (used to get a new access token when it expires, without re-login). This limits the damage if an access token leaks.",
          "**Where to store tokens** — securely: `EncryptedSharedPreferences`, or encrypted storage, or the Android Keystore — never in plaintext.",
          "**How it's applied** — in Android you typically add the token to every request automatically with an OkHttp *interceptor* (rather than manually on each call), and handle token refresh in an `Authenticator` when a request returns 401.",
        ],
      },
      {
        t: "p",
        text: "The stateless nature of HTTP is *why* auth works this way — the server can't 'remember' you're logged in between requests, so you re-assert your identity every time via the token. This is different from older cookie/session server-side approaches; mobile APIs almost always use stateless token auth.",
      },
    ],
  },
  {
    level: "senior",
    q: "Which HTTP requests are safe to retry, and why does idempotency matter for a mobile app?",
    a: [
      {
        t: "p",
        text: "**Idempotent requests — those where repeating them has the same effect as doing them once — are safe to retry; non-idempotent ones are not, because a retry could duplicate an action.** GET, PUT, and DELETE are idempotent (reading twice, replacing twice, or deleting twice all leave the same end state). POST is *not* idempotent — each POST typically creates a new resource, so retrying it can create duplicates.",
      },
      {
        t: "list",
        items: [
          "**Why this matters acutely on mobile**: mobile networks are flaky. A request can *time out or lose the connection after the server processed it but before the response reached the app* — so the app doesn't know whether it succeeded. For an idempotent request (GET/PUT/DELETE), you can just retry safely. For a POST (say, 'place order' or 'send payment'), a blind retry might place *two* orders or charge *twice* — a serious bug.",
          "**The solution for non-idempotent requests — idempotency keys**: the client generates a unique key (a UUID) per logical operation and sends it (e.g. in an `Idempotency-Key` header). The server records processed keys; if it sees the same key again (from a retry), it returns the *original* result instead of performing the action again. This makes even POST safe to retry. Payment APIs (Stripe, etc.) universally use this.",
          "**Which errors to retry**: retry on network failures and 5xx (transient server errors), typically with *exponential backoff* (increasing delays) to avoid hammering a struggling server. Do *not* retry 4xx client errors (the request is wrong — it'll fail identically), except 401 after refreshing the token and 429 after honoring the rate-limit delay.",
          "**Bound retries**: cap the number of attempts and add jitter (randomized backoff) so many clients don't retry in lockstep (the 'thundering herd' problem).",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: retry logic isn't just 'try again on failure' — it's a correctness concern rooted in idempotency. On unreliable mobile networks you *will* face ambiguous failures (did it go through?), so you design for them: retry idempotent operations freely, make critical non-idempotent operations idempotent via keys, retry only transient (5xx/network) errors with bounded exponential backoff and jitter, and never blindly retry a POST that could double a side effect. This is what separates a robust networking layer from one that occasionally double-charges users.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is an ETag and how does conditional caching with 304 work?",
    a: [
      {
        t: "p",
        text: "**An ETag (Entity Tag) is a version fingerprint the server assigns to a resource — a short identifier (like a hash) that changes whenever the resource's content changes. It enables *conditional requests*: the client can ask 'give me this resource, but only if it changed since the version I have', letting the server skip sending the body when nothing changed.**",
      },
      {
        t: "list",
        items: [
          "**How it flows**: the first response includes an `ETag: \"abc123\"` header. The client caches the response *and* the ETag. On the next request for that resource, the client sends `If-None-Match: \"abc123\"`. The server compares: if the resource still has ETag `abc123` (unchanged), it responds `304 Not Modified` with *no body* — telling the client 'your cached copy is current'. If it changed, the server responds `200 OK` with the new body and a new ETag.",
          "**Why it's efficient**: a `304` response is tiny (just headers, no body), so you 'refresh' the data — confirming it's current — without re-downloading it. For large responses or frequent polling, this saves enormous bandwidth and time. The client keeps showing its cached data on a 304, and only replaces it on a 200.",
          "**`Last-Modified` / `If-Modified-Since`** is a timestamp-based alternative to ETags (same idea, using a modification date instead of a fingerprint). ETags are more precise (they detect any content change, even if the timestamp is the same).",
          "**In Android**: OkHttp handles this automatically at the HTTP layer if you configure a `Cache` — it stores responses with their ETags and transparently sends conditional requests, serving the cached body on a 304. You get efficient caching for free without app-level code.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: ETags implement 'stale-while-revalidate' efficiently at the protocol level — you can check freshness *cheaply* (a conditional request that usually returns a bodyless 304) rather than re-fetching. This is complementary to app-level caching (Room as SSOT): ETags optimize the *network* layer's freshness checks, while Room gives you queryable, offline, observable structured data. For frequently-polled or large resources that rarely change, ETag-based conditional caching is the right tool to minimize data usage — and it's why understanding HTTP caching headers matters even when you also cache in a database.",
      },
    ],
  },
];

export default qa;
