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
  {
    level: "junior",
    q: "Which HTTP methods are idempotent and safe, and what do those terms mean?",
    a: [
      {
        t: "p",
        text: "*Safe* means the request has no side effects (read-only): `GET`, `HEAD`, `OPTIONS`. *Idempotent* means making the request multiple times has the same effect as once: `GET`, `PUT`, `DELETE` (deleting twice ends in the same state). `POST` is *neither* — it creates a new resource each time, so retrying it can duplicate. This matters for safe retries.",
      },
      {
        t: "table",
        headers: ["Method", "Safe", "Idempotent"],
        rows: [
          ["GET/HEAD", "yes", "yes"],
          ["PUT/DELETE", "no", "yes"],
          ["POST", "no", "no"],
          ["PATCH", "no", "usually not"],
        ],
      },
      {
        t: "list",
        items: [
          "**Safe** — read-only, no side effects (GET/HEAD/OPTIONS).",
          "**Idempotent** — same result if repeated (GET/PUT/DELETE).",
          "**POST** — neither; retrying can create duplicates.",
          "**Retry policy** — safely retry idempotent methods; use idempotency keys for POST.",
        ],
      },
      {
        t: "note",
        text: "Safe = no side effects (GET/HEAD/OPTIONS). Idempotent = repeating gives the same result (GET/PUT/DELETE). POST is neither (retrying can duplicate); PATCH usually isn't. Retry idempotent methods freely; use an idempotency key to safely retry POST.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between PUT and PATCH?",
    a: [
      {
        t: "p",
        text: "`PUT` *replaces* the entire resource with the provided representation — you send the full object, and missing fields are cleared. `PATCH` *partially updates* — you send only the fields to change. Use `PUT` for a full replace (idempotent), `PATCH` for targeted updates (often smaller payloads).",
      },
      {
        t: "list",
        items: [
          "**`PUT`** — full replacement; send the whole resource; idempotent.",
          "**`PATCH`** — partial update; send only changed fields.",
          "**Payload** — PUT is complete; PATCH is minimal.",
          "**Semantics** — PUT clears omitted fields; PATCH leaves them.",
        ],
      },
      {
        t: "note",
        text: "PUT replaces the entire resource (send the full object; omitted fields cleared; idempotent). PATCH partially updates (send only changed fields). Use PUT for full replace, PATCH for targeted updates with smaller payloads.",
      },
    ],
  },
  {
    level: "junior",
    q: "What do the key HTTP status codes mean, and how should you handle each category?",
    a: [
      {
        t: "p",
        text: "Categories: *2xx* success (200 OK, 201 Created, 204 No Content), *3xx* redirect (301/302/304), *4xx* client error (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Too Many Requests), *5xx* server error (500, 502, 503). Handling differs: 4xx means *you* sent something wrong (usually don't retry — fix the request or surface the error); 5xx is a *server* problem (retry with backoff).",
      },
      {
        t: "list",
        items: [
          "**2xx** — success; process the body (204 has none).",
          "**401/403** — auth: refresh token (401) or show forbidden (403).",
          "**404/409** — not found / conflict: surface to the user.",
          "**429** — rate limited: back off (respect `Retry-After`).",
          "**5xx** — server error: retry with backoff.",
        ],
      },
      {
        t: "note",
        text: "2xx success (200/201/204), 3xx redirect (301/302/304), 4xx client error (400/401/403/404/409/429), 5xx server error (500/502/503). 4xx = your request is wrong (usually don't retry — fix/surface; 401→refresh, 429→back off with Retry-After); 5xx = server problem (retry with backoff).",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the principles of good REST resource/URI design?",
    a: [
      {
        t: "p",
        text: "REST models *resources* (nouns) addressed by URIs, manipulated with HTTP methods. Good design: use plural nouns (`/users`, `/users/42`), nest for relationships (`/users/42/orders`), avoid verbs in URIs (the method is the verb), use query params for filtering/sorting/pagination, and keep URIs consistent and hierarchical. Actions map to methods, not URL segments (`DELETE /users/42`, not `/deleteUser`).",
      },
      {
        t: "list",
        items: [
          "**Resources as nouns** — `/users`, `/users/42` (plural, hierarchical).",
          "**Nesting** — `/users/42/orders` for relationships.",
          "**Methods are verbs** — no `/deleteUser`; use `DELETE`.",
          "**Query params** — filtering/sorting/pagination (`?sort=&page=`).",
        ],
      },
      {
        t: "note",
        text: "REST design: resources as plural nouns (/users, /users/42), nest for relationships (/users/42/orders), no verbs in URIs (the HTTP method is the verb), query params for filter/sort/paginate. Consistent, hierarchical URIs; actions map to methods (DELETE /users/42), not URL segments.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is content negotiation (Accept / Content-Type)?",
    a: [
      {
        t: "p",
        text: "Content negotiation lets client and server agree on the data format. The `Content-Type` header describes the format of the *body being sent* (e.g. `application/json`), and the `Accept` header tells the server what formats the client *can handle* in the response. The server responds in a supported format (with its own `Content-Type`). Most mobile APIs use `application/json` for both.",
      },
      {
        t: "list",
        items: [
          "**`Content-Type`** — format of the request body (`application/json`).",
          "**`Accept`** — formats the client accepts in the response.",
          "**Server picks** — a supported format; sets response `Content-Type`.",
          "**Versioning** — some APIs negotiate versions via `Accept` media types.",
        ],
      },
      {
        t: "note",
        text: "Content negotiation: Content-Type describes the body being sent (application/json); Accept tells the server what the client can handle in the response; the server replies in a supported format (with its Content-Type). Mostly application/json in mobile; some APIs version via Accept media types.",
      },
    ],
  },
  {
    level: "senior",
    q: "How is pagination typically done in REST APIs?",
    a: [
      {
        t: "p",
        text: "Common approaches: *offset/limit* (`?offset=40&limit=20` or `?page=3&size=20`) — simple but shifts on inserts; *cursor/keyset* (`?cursor=abc`) — stable and efficient for large data; and *Link headers* (RFC 5988, with `rel=\"next\"`/`\"prev\"` URLs) so the client follows links rather than constructing them. The server also returns total counts or a `next` token.",
      },
      {
        t: "list",
        items: [
          "**Offset/page** — `?page=&size=`; simple, but shifts on inserts.",
          "**Cursor/keyset** — `?cursor=`; stable, efficient for big data.",
          "**Link headers** — `Link: <url>; rel=\"next\"` to follow.",
          "**Client** — follow `next` (with `@Url`) or build the next page.",
        ],
      },
      {
        t: "note",
        text: "REST pagination: offset/page (?page=&size= — simple, shifts on inserts), cursor/keyset (?cursor= — stable/efficient for large data), or Link headers (rel=\"next\"/\"prev\" URLs to follow). Servers return total counts or a next token. Prefer cursor pagination for large/changing datasets.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle rate limiting (429) on the client?",
    a: [
      {
        t: "p",
        text: "A `429 Too Many Requests` means you've hit the API's rate limit. The response usually includes a `Retry-After` header (seconds or a date) telling you when to retry. Honor it — wait that long before retrying — and proactively throttle your requests (debounce, batch, cache) to avoid hitting the limit. Don't retry immediately in a loop (that makes it worse).",
      },
      {
        t: "list",
        items: [
          "**429** — rate limit exceeded.",
          "**`Retry-After`** — wait the specified time before retrying.",
          "**Throttle proactively** — debounce, batch, cache to stay under limits.",
          "**No tight retry loop** — worsens the situation.",
        ],
      },
      {
        t: "note",
        text: "429 Too Many Requests = rate limited. Honor the Retry-After header (wait before retrying), and proactively throttle (debounce/batch/cache) to avoid hitting limits. Never retry immediately in a loop — that worsens it. Some APIs also send X-RateLimit-Remaining/Reset headers to pace requests.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between authentication and authorization?",
    a: [
      {
        t: "p",
        text: "*Authentication* verifies *who you are* (login — proving identity with credentials/tokens). *Authorization* determines *what you're allowed to do* (permissions/roles). In HTTP, a `401 Unauthorized` means *not authenticated* (log in / refresh token), while `403 Forbidden` means *authenticated but not authorized* (you don't have permission).",
      },
      {
        t: "list",
        items: [
          "**Authentication** — who you are (login/token); `401` if missing/invalid.",
          "**Authorization** — what you can do (roles/permissions); `403` if disallowed.",
          "**Order** — authenticate first, then authorize.",
          "**Handling** — 401 → re-auth/refresh; 403 → show 'no permission'.",
        ],
      },
      {
        t: "note",
        text: "Authentication = who you are (login/token) → 401 if missing/invalid. Authorization = what you're allowed to do (roles/permissions) → 403 if authenticated but not permitted. Handle 401 by re-authenticating/refreshing, 403 by showing 'no permission'.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does OAuth2 / bearer token authentication work at a high level?",
    a: [
      {
        t: "p",
        text: "The client obtains an *access token* (short-lived) — often via an OAuth2 flow (e.g. authorization code, or exchanging credentials) — and sends it in the `Authorization: Bearer <token>` header on each request. When the access token expires, a longer-lived *refresh token* is exchanged for a new access token (without re-login). The server validates the token per request.",
      },
      {
        t: "list",
        items: [
          "**Access token** — short-lived; sent as `Authorization: Bearer`.",
          "**Refresh token** — longer-lived; exchanged for new access tokens.",
          "**OAuth2 flows** — authorization code (with PKCE for mobile), etc.",
          "**Storage** — keep tokens securely (Keystore/encrypted), not plaintext.",
        ],
      },
      {
        t: "note",
        text: "OAuth2/bearer: obtain a short-lived access token (via an OAuth2 flow, e.g. auth code + PKCE on mobile), send it as Authorization: Bearer on each request; when it expires, exchange the longer-lived refresh token for a new one (no re-login). Store tokens securely (Keystore/encrypted). Server validates per request.",
      },
    ],
  },
  {
    level: "senior",
    q: "What do Cache-Control headers do?",
    a: [
      {
        t: "p",
        text: "`Cache-Control` directives tell caches (including OkHttp's) how to handle a response: `max-age=N` (fresh for N seconds), `no-cache` (must revalidate before using), `no-store` (don't cache at all), `private` (only client caches, not shared), `public`. Combined with `ETag`/`Last-Modified`, they control HTTP-level caching and revalidation transparently.",
      },
      {
        t: "list",
        items: [
          "**`max-age=N`** — cache is fresh for N seconds.",
          "**`no-cache`** — cache but revalidate before use.",
          "**`no-store`** — never cache (sensitive data).",
          "**`private`/`public`** — client-only vs shared caches.",
        ],
      },
      {
        t: "note",
        text: "Cache-Control directs caches: max-age=N (fresh for N sec), no-cache (revalidate before use), no-store (never cache — sensitive), private (client-only), public. With ETag/Last-Modified it controls HTTP-level caching/revalidation. OkHttp honors these automatically when a Cache is installed.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between REST and GraphQL?",
    a: [
      {
        t: "p",
        text: "*REST* exposes multiple endpoints returning fixed resource shapes — you may over-fetch (get fields you don't need) or under-fetch (need several calls). *GraphQL* has a single endpoint where the *client specifies exactly which fields* it wants in one query, avoiding over/under-fetching and reducing round trips. GraphQL is more flexible but adds server/schema complexity and complicates HTTP caching.",
      },
      {
        t: "table",
        headers: ["", "REST", "GraphQL"],
        rows: [
          ["Endpoints", "many (per resource)", "one"],
          ["Fetching", "fixed shapes (over/under-fetch)", "client picks fields"],
          ["Round trips", "possibly several", "often one"],
          ["Caching", "HTTP caching easy", "harder (POST queries)"],
        ],
      },
      {
        t: "list",
        items: [
          "**REST** — multiple endpoints, fixed shapes; simple, HTTP-cacheable.",
          "**GraphQL** — one endpoint, client-selected fields; avoids over/under-fetch.",
          "**Trade-off** — GraphQL flexibility vs server complexity/caching difficulty.",
          "**Android** — Apollo is the common GraphQL client.",
        ],
      },
      {
        t: "note",
        text: "REST: many endpoints, fixed resource shapes (over/under-fetch, HTTP-cacheable, simple). GraphQL: one endpoint, client picks exactly the fields it needs in one query (avoids over/under-fetch, fewer round trips) but adds server/schema complexity and complicates caching. Apollo is the common Android GraphQL client.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between HTTP/1.1, HTTP/2, and HTTP/3?",
    a: [
      {
        t: "p",
        text: "*HTTP/1.1* uses one request per connection at a time (head-of-line blocking; browsers open multiple connections). *HTTP/2* multiplexes many concurrent requests over one connection with header compression — faster, fewer connections. *HTTP/3* runs over QUIC (UDP-based), eliminating TCP head-of-line blocking and connecting faster (better on flaky mobile networks). OkHttp supports HTTP/2 (and HTTP/3 is emerging).",
      },
      {
        t: "list",
        items: [
          "**HTTP/1.1** — one request at a time per connection; head-of-line blocking.",
          "**HTTP/2** — multiplexed streams, header compression; one connection.",
          "**HTTP/3 (QUIC/UDP)** — no TCP head-of-line blocking; faster on flaky networks.",
          "**OkHttp** — HTTP/2 supported; HTTP/3 emerging.",
        ],
      },
      {
        t: "note",
        text: "HTTP/1.1: one request at a time per connection (head-of-line blocking). HTTP/2: multiplexed concurrent streams + header compression over one connection. HTTP/3: over QUIC (UDP) — no TCP head-of-line blocking, faster on flaky mobile networks. OkHttp supports HTTP/2; HTTP/3 is emerging.",
      },
    ],
  },
  {
    level: "junior",
    q: "What do the redirect status codes (301, 302, 307, 308) mean?",
    a: [
      {
        t: "p",
        text: "3xx redirects tell the client the resource is elsewhere. `301 Moved Permanently` and `308 Permanent Redirect` mean update your URL permanently; `302 Found` and `307 Temporary Redirect` are temporary. The difference between 301/302 and 307/308 is method preservation: 307/308 *preserve* the original method/body (a POST stays a POST), while 301/302 historically may change POST to GET. OkHttp follows redirects automatically.",
      },
      {
        t: "list",
        items: [
          "**301/308** — permanent (update the URL); 308 preserves method.",
          "**302/307** — temporary; 307 preserves method/body.",
          "**Method preservation** — 307/308 keep POST as POST.",
          "**OkHttp** — follows redirects automatically (configurable).",
        ],
      },
      {
        t: "note",
        text: "3xx redirects: 301/308 permanent (update the URL), 302/307 temporary. 307/308 preserve the original method/body (POST stays POST); 301/302 historically may change POST→GET. OkHttp follows redirects automatically (followRedirects/followSslRedirects configurable).",
      },
    ],
  },
  {
    level: "junior",
    q: "Why is HTTPS/TLS essential, and how does it work at a high level?",
    a: [
      {
        t: "p",
        text: "HTTPS wraps HTTP in *TLS*, which *encrypts* the traffic (so it can't be read on the wire), *authenticates* the server (via its certificate signed by a trusted CA), and ensures *integrity* (tamper detection). Without it, credentials and data are exposed to anyone on the network. Modern Android blocks *cleartext* (HTTP) traffic by default; you must use HTTPS (or explicitly allow cleartext, which you shouldn't for real APIs).",
      },
      {
        t: "list",
        items: [
          "**Encryption** — traffic unreadable on the wire.",
          "**Authentication** — the server's certificate proves identity (CA-signed).",
          "**Integrity** — tampering is detected.",
          "**Cleartext blocked** — modern Android forbids HTTP by default; use HTTPS.",
        ],
      },
      {
        t: "note",
        text: "HTTPS = HTTP over TLS: encrypts traffic (unreadable on the wire), authenticates the server (CA-signed certificate), and ensures integrity (tamper detection). Without it, data/credentials are exposed. Modern Android blocks cleartext HTTP by default — use HTTPS (Network Security Config controls exceptions).",
      },
    ],
  },
  {
    level: "junior",
    q: "What are common HTTP request and response headers?",
    a: [
      {
        t: "p",
        text: "*Request* headers include `Authorization` (credentials), `Content-Type` (body format), `Accept` (desired response format), `User-Agent`, `Accept-Encoding` (gzip). *Response* headers include `Content-Type`, `Content-Length`, `Cache-Control`/`ETag` (caching), `Set-Cookie`, `Location` (redirects/created resources), and `Retry-After` (rate limits). Headers carry metadata about the request/response.",
      },
      {
        t: "list",
        items: [
          "**Request** — `Authorization`, `Content-Type`, `Accept`, `Accept-Encoding`, `User-Agent`.",
          "**Response** — `Content-Type`, `Cache-Control`/`ETag`, `Location`, `Retry-After`.",
          "**Metadata** — headers describe the body and control behavior.",
          "**Custom** — `X-` headers for API-specific data (rate limits, request ids).",
        ],
      },
      {
        t: "note",
        text: "Request headers: Authorization, Content-Type, Accept, Accept-Encoding (gzip), User-Agent. Response headers: Content-Type, Cache-Control/ETag, Location, Retry-After, Set-Cookie. Plus custom X- headers (rate limits, request ids). Headers carry metadata and control caching/auth/negotiation.",
      },
    ],
  },
  {
    level: "junior",
    q: "When do you use path parameters, query parameters, and the request body?",
    a: [
      {
        t: "p",
        text: "*Path* parameters identify a specific resource (`/users/42` — the id is part of the resource's address). *Query* parameters filter/sort/paginate a collection (`/users?role=admin&sort=name`). The *body* carries the data payload for create/update (`POST`/`PUT`/`PATCH`). Use path for identity, query for options, body for content.",
      },
      {
        t: "list",
        items: [
          "**Path** — resource identity (`/users/42`).",
          "**Query** — filtering/sorting/pagination (`?role=&sort=&page=`).",
          "**Body** — the payload for create/update.",
          "**Don't put secrets in the URL** — path/query are logged/cached.",
        ],
      },
      {
        t: "note",
        text: "Path params identify a resource (/users/42); query params filter/sort/paginate a collection (?role=&sort=&page=); the body carries create/update payloads (POST/PUT/PATCH). Path = identity, query = options, body = content. Never put secrets in path/query (they're logged/cached).",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the HEAD and OPTIONS methods for?",
    a: [
      {
        t: "p",
        text: "`HEAD` is like `GET` but returns *only headers, no body* — useful to check if a resource exists, get its size/`ETag`, or test freshness without downloading it. `OPTIONS` asks what methods/capabilities a resource supports (used in CORS preflight on the web). Both are safe and idempotent.",
      },
      {
        t: "list",
        items: [
          "**`HEAD`** — headers only (existence, size, `ETag`) without the body.",
          "**`OPTIONS`** — supported methods/capabilities (CORS preflight on web).",
          "**Safe + idempotent** — no side effects.",
          "**Mobile** — HEAD occasionally for cheap existence/freshness checks.",
        ],
      },
      {
        t: "note",
        text: "HEAD = GET without the body (headers only — check existence, size, ETag, freshness cheaply). OPTIONS = query supported methods/capabilities (CORS preflight on web). Both safe and idempotent. On mobile, HEAD is occasionally used for cheap existence/freshness checks.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a 202 Accepted response, and how do you handle async processing?",
    a: [
      {
        t: "p",
        text: "`202 Accepted` means the server *accepted the request for processing* but hasn't completed it — common for long-running operations (video processing, report generation). The response often includes a status URL or job id; the client then *polls* that endpoint (or receives a *webhook*/push) until the operation completes. Design the client to handle the pending state, not assume immediate completion.",
      },
      {
        t: "list",
        items: [
          "**202 Accepted** — request accepted, processing not done.",
          "**Status URL/job id** — poll for completion.",
          "**Poll or push** — polling with backoff, or a webhook/FCM notification.",
          "**Client UX** — show a pending/processing state.",
        ],
      },
      {
        t: "note",
        text: "202 Accepted = the server accepted the request but processing isn't complete (long-running ops). It usually returns a status URL/job id; the client polls it (with backoff) or receives a webhook/push until done. Design the client for the pending state, not immediate completion.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you safely retry a POST with an idempotency key?",
    a: [
      {
        t: "p",
        text: "Since `POST` isn't idempotent, retrying it (after a timeout where you're unsure it succeeded) risks creating duplicates. Send a client-generated *idempotency key* (a unique id per logical operation) in a header; the server records it and, on a retry with the same key, returns the *original result* instead of creating a duplicate. This makes POST safely retryable — essential for payments/orders.",
      },
      {
        t: "code",
        title: "Idempotency key",
        code: `@POST("orders")
suspend fun createOrder(
    @Header("Idempotency-Key") key: String,   // client-generated UUID per order
    @Body order: OrderRequest,
): Order`,
      },
      {
        t: "list",
        items: [
          "**Client-generated key** — unique per logical operation (UUID).",
          "**Server dedupes** — same key returns the original result.",
          "**Safe retry** — no duplicate orders/payments.",
          "**Requires server support** — the API must honor the key.",
        ],
      },
      {
        t: "note",
        text: "POST isn't idempotent, so retrying risks duplicates. Send a client-generated idempotency key (UUID per operation) in a header; the server records it and returns the original result on retries with the same key — making POST safely retryable. Essential for payments/orders; requires server support.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a webhook, and how does it differ from polling?",
    a: [
      {
        t: "p",
        text: "A *webhook* is a server-to-server push: when an event happens, the server sends an HTTP request to a *callback URL* you registered — so you're notified immediately without asking. *Polling* is the client repeatedly asking 'anything new?' — simpler but wasteful and delayed. On mobile, the equivalent of a webhook is *FCM push* (the server notifies the app via Firebase), avoiding constant polling.",
      },
      {
        t: "list",
        items: [
          "**Webhook** — server pushes to a callback URL on an event (immediate).",
          "**Polling** — client repeatedly asks; wasteful, delayed.",
          "**Mobile equivalent** — FCM push notifies the app (no constant polling).",
          "**Trade-off** — push (efficient, needs infra) vs polling (simple, laggy).",
        ],
      },
      {
        t: "note",
        text: "A webhook is a server-to-server push to a registered callback URL on an event (immediate, efficient) vs polling (client repeatedly asks — wasteful/delayed). On mobile, FCM push is the webhook equivalent: the server notifies the app via Firebase, avoiding constant polling.",
      },
    ],
  },
  {
    level: "senior",
    q: "How should you handle 4xx versus 5xx errors differently?",
    a: [
      {
        t: "p",
        text: "*4xx* means the *client* did something wrong — retrying the same request won't help; you should fix the request (400), re-authenticate (401), show 'forbidden' (403), 'not found' (404), or handle a conflict (409). *5xx* means the *server* failed — the same request might succeed later, so *retry with exponential backoff*. Treating them the same (e.g. retrying a 400 forever) wastes resources and hides bugs.",
      },
      {
        t: "list",
        items: [
          "**4xx** — client error; don't blindly retry; fix/surface (401→refresh, 429→back off).",
          "**5xx** — server error; retry with exponential backoff.",
          "**Distinguish** — check the status code before retrying.",
          "**Don't retry 400/404** — the same request will fail again.",
        ],
      },
      {
        t: "note",
        text: "4xx = client error — don't blindly retry; fix/surface (400 fix request, 401 refresh, 403 forbidden, 404 not found, 429 back off). 5xx = server error — retry with exponential backoff (may succeed later). Check the status before retrying; retrying a 400/404 wastes resources and hides bugs.",
      },
    ],
  },
  {
    level: "senior",
    q: "What does a well-designed API error response look like?",
    a: [
      {
        t: "p",
        text: "A good error response uses the *right status code* and a *structured JSON body* with a machine-readable error `code`, a human-readable `message`, and optionally `details`/`field` errors for validation. Consistency lets the client map errors to typed domain errors and show appropriate UI. Avoid returning `200` with an error in the body (breaks status-based handling).",
      },
      {
        t: "code",
        title: "Structured error",
        code: `// 422 Unprocessable Entity
{ "code": "VALIDATION_ERROR", "message": "Invalid input",
  "errors": [{ "field": "email", "message": "must be a valid email" }] }`,
      },
      {
        t: "list",
        items: [
          "**Correct status code** — not `200` for errors.",
          "**Machine-readable `code`** — map to typed errors.",
          "**Human-readable `message`** — for display/logging.",
          "**Field/validation details** — for form errors.",
        ],
      },
      {
        t: "note",
        text: "A good error response: correct status code + structured JSON (machine-readable code, human-readable message, optional field/validation details). Consistency lets the client map to typed domain errors and show the right UI. Never return 200 with an error body — it breaks status-based handling.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between REST and gRPC?",
    a: [
      {
        t: "p",
        text: "*REST* uses HTTP/JSON — human-readable, ubiquitous, easy to debug. *gRPC* uses HTTP/2 + Protocol Buffers (binary) with a defined service schema — much smaller/faster payloads, strongly-typed generated clients, and support for streaming (bidirectional). gRPC suits high-performance internal/microservice communication; REST is simpler and more universal for public/mobile APIs (though gRPC is used on mobile too).",
      },
      {
        t: "table",
        headers: ["", "REST", "gRPC"],
        rows: [
          ["Format", "JSON (text)", "Protobuf (binary)"],
          ["Transport", "HTTP/1.1 or 2", "HTTP/2"],
          ["Schema", "optional (OpenAPI)", "required (.proto)"],
          ["Streaming", "limited", "first-class (bidi)"],
        ],
      },
      {
        t: "list",
        items: [
          "**REST/JSON** — human-readable, universal, easy to debug.",
          "**gRPC/protobuf** — binary, fast, typed clients, streaming.",
          "**gRPC** — performance/microservices; needs a `.proto` schema.",
          "**Choose** — REST for simplicity/reach; gRPC for performance/streaming.",
        ],
      },
      {
        t: "note",
        text: "REST = HTTP/JSON (readable, universal, easy to debug). gRPC = HTTP/2 + Protobuf (binary — smaller/faster, strongly-typed generated clients, first-class streaming, needs a .proto schema). gRPC for high-performance/streaming/microservices; REST for simplicity and reach.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between PUT and POST for creating resources?",
    a: [
      {
        t: "p",
        text: "`POST /users` creates a new resource where the *server* assigns the id (not idempotent — repeating creates multiple). `PUT /users/42` creates-or-replaces the resource *at a client-specified id* (idempotent — repeating yields the same resource). Use `POST` when the server generates the id (the common case); `PUT` when the client controls the identity.",
      },
      {
        t: "list",
        items: [
          "**`POST`** — server assigns id; not idempotent (repeats create duplicates).",
          "**`PUT`** — client-specified id; idempotent (repeats replace).",
          "**Common** — `POST` for creation (server ids).",
          "**`PUT` for creation** — when the client controls the id.",
        ],
      },
      {
        t: "note",
        text: "POST /users creates a resource with a server-assigned id (not idempotent — repeats duplicate). PUT /users/42 creates-or-replaces at a client-specified id (idempotent — repeats yield the same resource). Use POST when the server generates ids (common); PUT when the client controls identity.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you version a REST API, and why does it matter for mobile?",
    a: [
      {
        t: "p",
        text: "APIs are versioned so changes don't break existing clients — critical for mobile because *old app versions stay installed* for a long time. Common approaches: *URI versioning* (`/v1/users`), *header versioning* (`Accept: application/vnd.api.v2+json`), or *query param*. The client sends its expected version; the server maintains backward compatibility (additive changes) and deprecates old versions gradually. Never break a shipped app's API contract abruptly.",
      },
      {
        t: "list",
        items: [
          "**URI versioning** — `/v1/`, `/v2/` (most common, explicit).",
          "**Header versioning** — via `Accept` media type.",
          "**Mobile constraint** — old app versions linger; can't force-update everyone.",
          "**Backward compatibility** — additive changes; deprecate gradually.",
        ],
      },
      {
        t: "note",
        text: "Version APIs (URI /v1/, Accept-header media type, or query param) so changes don't break existing clients — critical on mobile where old app versions stay installed for months/years. Keep backward compatibility (additive changes), deprecate old versions gradually, and never abruptly break a shipped app's contract.",
      },
    ],
  },
];

export default qa;
