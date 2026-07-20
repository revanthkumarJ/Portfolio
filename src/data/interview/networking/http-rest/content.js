// HTTP & REST Fundamentals — Content tab. Teaching-first.

const content = [
  {
    heading: "HTTP — the request/response protocol",
    blocks: [
      {
        t: "p",
        text: "**HTTP (HyperText Transfer Protocol)** is the protocol apps use to talk to servers. It's a **request/response** model: the client (your app) sends a *request* to a URL, the server processes it and sends back a *response*. It's *stateless* — each request is independent, carrying everything the server needs (the server doesn't remember previous requests unless you send state like a token or cookie each time). Understanding the anatomy of requests and responses is the foundation of all networking.",
      },
      {
        t: "code",
        title: "Anatomy of a request and response",
        code: `// REQUEST
GET /api/users/42 HTTP/1.1          // method + path + version
Host: api.example.com               // headers (metadata)
Authorization: Bearer eyJ...
Accept: application/json
// (body — for POST/PUT: the data being sent)

// RESPONSE
HTTP/1.1 200 OK                     // status line: version + status code
Content-Type: application/json      // headers
{ "id": "42", "name": "Revanth" }   // body — the returned data`,
      },
      {
        t: "list",
        items: [
          "**A request has**: a *method* (GET, POST…), a *URL/path*, *headers* (metadata: auth token, content type, accept), and optionally a *body* (data sent to the server, for POST/PUT).",
          "**A response has**: a *status code* (200, 404…), *headers* (content type, caching info), and a *body* (the returned data, usually JSON).",
          "**Stateless**: the server treats each request independently. To maintain a 'session', the client includes identifying state (an auth token in the `Authorization` header) on every request.",
        ],
      },
    ],
  },
  {
    heading: "HTTP methods (verbs)",
    blocks: [
      {
        t: "table",
        headers: ["Method", "Purpose", "Has body?", "Idempotent?"],
        rows: [
          ["GET", "read/retrieve data", "no", "yes (safe — no side effects)"],
          ["POST", "create a new resource / submit data", "yes", "no (repeating creates duplicates)"],
          ["PUT", "replace/update a resource fully", "yes", "yes (same result if repeated)"],
          ["PATCH", "partially update a resource", "yes", "not necessarily"],
          ["DELETE", "remove a resource", "usually no", "yes (deleting twice = still deleted)"],
        ],
      },
      {
        t: "list",
        items: [
          "**GET** — retrieve data; should have *no side effects* (safe) and be cacheable. Never use GET to change server state.",
          "**POST** — create a resource or submit data (a form, a new item). *Not idempotent*: sending it twice creates two resources — which is why retrying a POST needs care (idempotency keys).",
          "**PUT vs PATCH** — PUT replaces the *entire* resource (send all fields); PATCH updates *part* of it (send only changed fields). PUT is idempotent (same result each time); PATCH may not be.",
          "**Idempotent** means repeating the request produces the same result — important for *retries*: safe to retry GET/PUT/DELETE, risky to blindly retry POST.",
        ],
      },
    ],
  },
  {
    heading: "Status codes",
    blocks: [
      {
        t: "table",
        headers: ["Range", "Meaning", "Examples"],
        rows: [
          ["2xx", "success", "200 OK, 201 Created, 204 No Content"],
          ["3xx", "redirection", "301 Moved Permanently, 304 Not Modified"],
          ["4xx", "client error (your request is wrong)", "400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests"],
          ["5xx", "server error (the server failed)", "500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable"],
        ],
      },
      {
        t: "list",
        items: [
          "**The first digit is the category** — 2xx success, 3xx redirect, 4xx client's fault, 5xx server's fault. Knowing the category tells you how to react.",
          "**Key ones to handle**: 401 (unauthenticated — refresh the token or log in), 403 (forbidden — no permission), 404 (not found), 429 (rate-limited — back off and retry), 500/503 (server error — retry with backoff).",
          "**4xx vs 5xx for retries**: 5xx (server errors) are often *transient* — retrying may succeed. 4xx (client errors) mean *your request is wrong* — retrying the same request will fail identically, so don't retry (except 401 after refreshing auth, or 429 after waiting).",
          "**304 Not Modified** — the caching response: 'the data hasn't changed since your cached version', so no body is sent (efficient conditional requests via ETag).",
        ],
      },
    ],
  },
  {
    heading: "REST — the API design style",
    blocks: [
      {
        t: "p",
        text: "**REST (Representational State Transfer)** is an architectural style for designing web APIs around *resources* (nouns) manipulated with the standard HTTP methods (verbs). A resource is identified by a URL, and you act on it with GET/POST/PUT/DELETE. Most Android apps consume REST APIs, so recognizing RESTful design is important.",
      },
      {
        t: "code",
        title: "RESTful resource design",
        code: `GET    /api/users          // list all users
POST   /api/users          // create a new user (body = user data)
GET    /api/users/42       // get user 42
PUT    /api/users/42       // replace user 42
PATCH  /api/users/42       // partially update user 42
DELETE /api/users/42       // delete user 42
GET    /api/users/42/posts // user 42's posts (nested resource)`,
      },
      {
        t: "list",
        items: [
          "**Resources as nouns, methods as verbs**: the URL names *what* (a user, a collection of users), the HTTP method says *what to do* (read, create, update, delete). Well-designed REST URLs don't have verbs (`/getUser` is not RESTful; `GET /users/42` is).",
          "**Statelessness**: each request is self-contained (carries its own auth); the server keeps no client session state between requests.",
          "**JSON is the common data format** — requests and responses carry JSON bodies (covered in the serialization topic).",
          "**Alternatives to know**: **GraphQL** (client specifies exactly what data it wants in one flexible query — avoids over/under-fetching), **gRPC** (binary protocol over HTTP/2, efficient for service-to-service). REST is still the most common for mobile, but knowing the alternatives shows breadth.",
        ],
      },
    ],
  },
  {
    heading: "Headers, auth, and content negotiation",
    blocks: [
      {
        t: "list",
        items: [
          "**`Authorization` header** — carries credentials, most commonly `Bearer <token>` for token-based auth. Sent on every request (statelessness) to identify the user.",
          "**`Content-Type`** — declares the format of the *request body* you're sending (`application/json`). **`Accept`** — tells the server what format you want *back*. Together they're 'content negotiation'.",
          "**Caching headers** — `Cache-Control`, `ETag`, `Last-Modified` control HTTP-level caching. An `ETag` is a version fingerprint; sending `If-None-Match: <etag>` lets the server reply `304 Not Modified` (no body) if unchanged — efficient conditional fetching.",
          "**HTTPS is mandatory** — all traffic should be encrypted (TLS). Android blocks cleartext (plain HTTP) by default since Android 9. For extra security, **certificate pinning** restricts which certificates your app trusts (preventing man-in-the-middle attacks) — important for sensitive apps.",
        ],
      },
      {
        t: "note",
        text: "HTTP/REST essentials: request (method + URL + headers + optional body) / response (status code + headers + body); stateless (send auth each time). Methods: GET (read, safe), POST (create, not idempotent), PUT (replace, idempotent), PATCH (partial), DELETE. Status codes by category: 2xx success, 4xx client error (don't blindly retry), 5xx server error (retry with backoff). REST = resources (URLs) + verbs (methods). Use HTTPS; know GraphQL/gRPC as alternatives.",
      },
    ],
  },
];

export default content;
