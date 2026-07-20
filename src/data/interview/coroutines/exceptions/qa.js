// Coroutine Exception Handling — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "How do you handle an exception from a coroutine started with launch?",
    a: [
      {
        t: "p",
        text: "**The concept**: in a `launch` coroutine, an uncaught exception propagates immediately (up to the parent scope, and ultimately to a handler or a crash). The simplest way to handle it is a `try/catch` *inside* the coroutine around the risky suspend calls.",
      },
      {
        t: "code",
        title: "try/catch inside launch",
        code: `viewModelScope.launch {
    try {
        val data = repository.load()
        _state.value = UiState.Content(data)
    } catch (e: CancellationException) {
        throw e                       // always rethrow cancellation
    } catch (e: Exception) {
        _state.value = UiState.Error(e.message)
    }
}`,
      },
      {
        t: "p",
        text: "The one rule you must not forget: rethrow `CancellationException`. Since it's a subclass of `Exception`, a broad catch grabs it, and swallowing it breaks cancellation. So catch it first and rethrow, or catch only the specific exceptions you expect. For a single operation like this, try/catch is clean and clear. For app architecture, many teams prefer returning errors as values (a `Result` type) from the repository so the ViewModel handles failure as an explicit branch rather than catching exceptions.",
      },
    ],
  },
  {
    level: "junior",
    q: "How is exception handling different between launch and async?",
    a: [
      {
        t: "p",
        text: "**The difference is *when* the exception surfaces.** In `launch`, an exception is thrown *immediately* when it occurs and propagates up right away. In `async`, the exception is *captured inside the returned `Deferred`* and only re-thrown when you call `await()` on it.",
      },
      {
        t: "code",
        title: "launch throws now, async throws at await",
        code: `launch { throw IOException() }          // propagates immediately

val d = async { throw IOException() }   // captured, not thrown yet
d.await()                                // throws here`,
      },
      {
        t: "list",
        items: [
          "**`launch`**: handle with try/catch inside, or a `CoroutineExceptionHandler` at the scope root.",
          "**`async`**: handle by wrapping `await()` in try/catch. If you never call `await()` on a standalone async, its exception can go unnoticed.",
          "**Both, as children of a scope**: an unhandled failure also propagates to the parent scope (cancelling siblings, with a regular Job) — that's structured concurrency and is separate from the 'when is it thrown' question.",
        ],
      },
      {
        t: "p",
        text: "So the practical guidance: for fire-and-forget work use `launch` and catch inside; for concurrent results use `async` and catch around `await()`. A common mistake is expecting a `CoroutineExceptionHandler` to catch an `async` exception — it won't, because async exceptions are meant to be surfaced through `await()`.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a CoroutineExceptionHandler and when does it work?",
    a: [
      {
        t: "p",
        text: "**The concept**: a `CoroutineExceptionHandler` is a coroutine context element that catches *uncaught* exceptions reaching the root of a coroutine tree. You install it in a scope's context, and it acts as a global net — typically for logging or crash reporting.",
      },
      {
        t: "code",
        title: "Installing one",
        code: `val handler = CoroutineExceptionHandler { _, e ->
    Log.e("App", "Uncaught", e)
}
val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main + handler)
scope.launch { risky() }   // uncaught exception -> handler`,
      },
      {
        t: "list",
        items: [
          "**Works only for `launch`**, not `async` (async exceptions surface via `await()`).",
          "**Works only at the *root* coroutine** — it must be in the scope or root launch; installing it on a nested child does nothing, because the exception propagates up to the root before the handler fires.",
          "**It's a net, not a control-flow tool**: by the time it runs, the coroutine has already failed. Use it for logging/reporting and last-resort handling, not for handling expected errors (use try/catch or Result types for those).",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "Why doesn't a try/catch around a launch block catch exceptions from coroutines launched inside it?",
    a: [
      {
        t: "p",
        text: "**Because a child coroutine's exception propagates through the *Job hierarchy*, not up the call stack through your try/catch.** When you `launch` a child coroutine, it runs independently as a node in the coroutine tree. If it throws, the exception travels up the *parent-child Job relationship* — it does not 'return' to the point where you called `launch`, so the surrounding try/catch never sees it.",
      },
      {
        t: "code",
        title: "The mistake and the fix",
        code: `// WRONG — try never catches the child's exception
launch {
    try {
        launch { throw IOException() }   // child; propagates via Job tree
    } catch (e: Exception) { /* never runs */ }
}

// RIGHT — catch inside the child
launch {
    launch {
        try { risky() } catch (e: Exception) { handle(e) }
    }
}`,
      },
      {
        t: "p",
        text: "The fix is to put the try/catch *inside the coroutine that does the risky work* (so it's on the same call stack), or use a `CoroutineExceptionHandler` for uncaught exceptions at the root. This is a direct consequence of structured concurrency: exceptions flow along Job parent-child edges, not along synchronous call stacks. Understanding this prevents the common bug of 'my try/catch isn't catching anything'.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does exception propagation interact with SupervisorJob and CoroutineExceptionHandler?",
    a: [
      {
        t: "p",
        text: "**The interaction is subtle and a favorite senior question.** With a *regular* Job, a child's uncaught exception propagates up to the parent, cancels the parent and siblings, and continues to the root where a `CoroutineExceptionHandler` (if present) handles it. With a `SupervisorJob`, the exception does **not** propagate to the parent — so the behavior changes:",
      },
      {
        t: "list",
        items: [
          "**Under a `SupervisorJob`, each direct child is treated as a 'root' for exception purposes.** A child's uncaught exception doesn't cancel siblings or the parent — but it still needs handling, and a `CoroutineExceptionHandler` installed on the *supervisor scope* WILL catch the uncaught exceptions of its direct `launch` children (because for a supervised child, the scope is effectively its root).",
          "**Placement of the handler matters**: with a regular Job, only a handler at the *root* matters (child handlers are ignored, since exceptions propagate to the root first). With a SupervisorJob, a handler on the supervisor catches direct children's failures. So `SupervisorJob() + handler` in the scope is a common pattern for 'isolate failures AND log them'.",
          "**Still only `launch`, never `async`**: regardless of Job type, `CoroutineExceptionHandler` never handles `async` exceptions — those must be caught at `await()`.",
          "**Depth caveat**: a SupervisorJob only supervises *direct* children. A grandchild (launched by a child with a regular Job) that fails will cancel *its* parent (the child), because that inner level uses a normal Job — the top supervisor doesn't reach down.",
        ],
      },
      {
        t: "code",
        title: "Isolate + log pattern",
        code: `val handler = CoroutineExceptionHandler { _, e -> log(e) }
val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main + handler)

scope.launch { widgetA() }   // if it fails: isolated (siblings survive) AND logged
scope.launch { widgetB() }   // unaffected by A's failure`,
      },
      {
        t: "p",
        text: "**The complete mental model**: `SupervisorJob` controls *whether* a failure propagates to siblings/parent (it doesn't); `CoroutineExceptionHandler` controls *what happens* to an exception once it becomes uncaught at a root. Together: supervisor isolates, handler logs. Knowing that the handler works on direct supervised children (but not on children under a regular Job, where only the root handler fires) is the depth signal.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is 'errors as values' often preferred over exceptions for coroutine error handling in app code?",
    a: [
      {
        t: "p",
        text: "**Because most failures in an app are *expected outcomes*, not exceptional bugs — and modeling them as values makes handling explicit, exhaustive, and decoupled from coroutine mechanics.** A network being down or a 404 isn't a programming error; it's a normal case the UI must handle. Throwing exceptions for these means every caller must remember to try/catch (easy to forget), the exception's type is untyped in the signature, and you're relying on exceptions crossing coroutine boundaries correctly (with all the launch/async/SupervisorJob subtleties).",
      },
      {
        t: "list",
        items: [
          "**Explicit and type-safe**: a repository returning `Result<User>` or a sealed `Either<DataError, User>` puts the failure *in the type signature*. Callers can't ignore it, and a `when` over a sealed error is exhaustive (the compiler ensures every case is handled).",
          "**Failures become normal control flow**: `repository.getUser().onSuccess { }.onFailure { }` handles the error as a branch, no try/catch, no reliance on exception propagation rules.",
          "**Separation of concerns**: exceptions are reserved for genuine *bugs* (a null where there shouldn't be one) which *should* crash in debug, while expected failures (offline, not-found) are data. This makes crash reports meaningful — a crash is a real bug, not 'the network was down'.",
          "**Boundary translation**: the data layer catches technical exceptions (`IOException`, `HttpException`) at its edge and maps them to a domain error vocabulary (`DataError.NoConnection`, `DataError.NotFound`), so upper layers never depend on library exception types.",
        ],
      },
      {
        t: "code",
        title: "The pattern (with the runCatching cancellation caveat)",
        code: `suspend fun getUser(id: String): Result<User> = withContext(io) {
    runCatching { api.getUser(id).toUser() }
        .onFailure { if (it is CancellationException) throw it }  // don't swallow cancellation
}`,
      },
      {
        t: "p",
        text: "**The important caveat**: `runCatching` catches *everything*, including `CancellationException` — so you must rethrow cancellation (or use a `runSuspendCatching` helper), or you'll break structured cancellation while trying to model errors as values. With that handled, errors-as-values gives you the cleanest, most testable error handling — and it's why modern Android architecture guidance leans on Result/sealed types rather than exceptions crossing coroutine boundaries.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle errors in a plain suspend function?",
    a: [
      {
        t: "p",
        text: "With an ordinary `try/catch` at the call site — a suspend function throws exceptions like any function, and you catch them synchronously. This is the simplest, most common error handling in coroutine code, and it's a big improvement over callbacks where errors arrive in a separate branch.",
      },
      {
        t: "code",
        title: "Synchronous-style handling",
        code: `suspend fun loadUser(id: String): UserResult = try {
    val user = api.getUser(id)       // suspend call may throw
    UserResult.Success(user)
} catch (e: IOException) {
    UserResult.NetworkError
} catch (e: HttpException) {
    UserResult.ServerError(e.code())
}`,
      },
      {
        t: "list",
        items: [
          "**Normal `try/catch`** — wraps the suspend call sequence; the failing call throws at that point.",
          "**Catch specific types** — `IOException`, `HttpException`, etc., not broad `Exception` (which swallows `CancellationException`).",
          "**Rethrow `CancellationException`** if you must catch broadly.",
          "**Direct calls throw** — unlike `launch` (where exceptions propagate via the job), a direct suspend call throws to you.",
        ],
      },
      {
        t: "note",
        text: "Use ordinary try/catch — a suspend function throws like any function and you catch it synchronously at the call site. Catch specific types (IOException/HttpException), not broad Exception (which swallows CancellationException). This is the common, simplest case; launch/async differ in how exceptions surface.",
      },
    ],
  },
  {
    level: "junior",
    q: "Does Kotlin have checked exceptions, and what does that mean for error handling?",
    a: [
      {
        t: "p",
        text: "No — Kotlin has *no checked exceptions*. Nothing forces you to declare or catch an exception; the compiler won't warn you that `api.getUser()` can throw `IOException`. This means error handling is entirely your discipline: you must *know* which calls can fail and choose to handle them. It's flexible but easy to forget, which is one reason many teams prefer modeling errors as return values.",
      },
      {
        t: "list",
        items: [
          "**No `throws` clause enforcement** — the compiler doesn't require catching or declaring exceptions.",
          "**Your responsibility** — you must know and handle the failure modes; nothing prompts you.",
          "**Interop** — Java checked exceptions become unchecked in Kotlin; `@Throws` documents them for Java callers.",
          "**Motivates errors-as-values** — `Result`/sealed types make failures explicit and compiler-checked (`when` exhaustiveness).",
        ],
      },
      {
        t: "note",
        text: "Kotlin has NO checked exceptions — the compiler never forces you to handle or declare them, so error handling is pure discipline (you must know what can throw). Java checked exceptions become unchecked in Kotlin (@Throws documents them for Java). This is a key reason teams model errors as values (Result/sealed) for compiler-checked handling.",
      },
    ],
  },
  {
    level: "junior",
    q: "What happens to an uncaught exception in a launch coroutine by default?",
    a: [
      {
        t: "p",
        text: "If a `launch` coroutine throws an exception you don't handle (no inner try/catch, no `CoroutineExceptionHandler`), it propagates up the job tree and is ultimately delivered to the *default uncaught exception handler* — which, on Android, crashes the app (like any uncaught exception on a thread). It also cancels the parent scope (with a regular Job).",
      },
      {
        t: "list",
        items: [
          "**Propagates up** — through the parent job; with a regular Job it cancels the parent and siblings.",
          "**Reaches the default handler** — the platform's uncaught exception handler; on Android that crashes the app and logs it.",
          "**Not silent** — you'll see a crash + stack trace (and Crashlytics reports it if installed).",
          "**Handle it** — inner try/catch, a `CoroutineExceptionHandler` on the scope, or model errors as values.",
        ],
      },
      {
        t: "note",
        text: "An unhandled launch exception propagates up the job tree (cancelling the parent/siblings with a regular Job) and reaches the platform's default uncaught handler — on Android, it crashes the app (with a stack trace, reported to Crashlytics). Handle it with inner try/catch, a CoroutineExceptionHandler, or errors-as-values.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle exceptions from multiple concurrent async operations?",
    a: [
      {
        t: "p",
        text: "Each `async`'s exception surfaces at its `await()`. Wrap the concurrent block in a `coroutineScope` (or `supervisorScope`) and a `try/catch` around the awaits. With `coroutineScope`, the first failure cancels the siblings and rethrows to your catch. If you want partial results, use `supervisorScope` and handle each `await` individually (e.g. `runCatching` per deferred, rethrowing cancellation).",
      },
      {
        t: "code",
        title: "Fail-fast vs partial",
        code: `// Fail-fast: any failure aborts all
val combined = try {
    coroutineScope { Data(a().await(), b().await()) }   // 'a','b' are async
} catch (e: Exception) { fallback() }

// Partial: independent results
supervisorScope {
    val a = async { fetchA() }; val b = async { fetchB() }
    val ra = a.runCatchingAwait(); val rb = b.runCatchingAwait()   // handle each
}`,
      },
      {
        t: "list",
        items: [
          "**Exception at `await()`** — `async` holds the exception until awaited, then rethrows it.",
          "**`coroutineScope` + try/catch** — first failure cancels siblings, rethrows; good for all-or-nothing.",
          "**`supervisorScope` + per-await handling** — isolate failures for partial results.",
          "**Don't leave a failing `async` un-awaited** — its exception may be lost.",
        ],
      },
      {
        t: "note",
        text: "Each async's exception surfaces at await(). Wrap in coroutineScope + try/catch for fail-fast (first failure cancels siblings and rethrows), or supervisorScope with per-await handling (runCatching, rethrow cancellation) for partial results. Never leave a failing async un-awaited — its exception can be lost.",
      },
    ],
  },
  {
    level: "senior",
    q: "What happens if you never await an async that fails?",
    a: [
      {
        t: "p",
        text: "In a `coroutineScope`/structured context, an `async` child that throws will still propagate its exception to the parent (cancelling the scope) even if you don't `await` it — because it's a child of the scope's Job. But if you use `async` in a *detached* or supervisor context and never await, the exception can be effectively swallowed (held in the `Deferred` no one inspects). Relying on this is fragile.",
      },
      {
        t: "list",
        items: [
          "**Structured `async`** — the child's failure propagates to the parent job regardless of `await` (cancels the scope).",
          "**Un-awaited in supervisor/detached** — the exception stays in the `Deferred`; if never awaited, it's lost/uncaught.",
          "**Best practice** — always `await` (or `awaitAll`) every `async` you start, so exceptions surface predictably.",
          "**Don't use `async` for fire-and-forget** — use `launch` (its exceptions propagate) if you won't await.",
        ],
      },
      {
        t: "note",
        text: "In structured scope, an async child's failure propagates to the parent even un-awaited (cancels the scope). But in supervisor/detached contexts, an un-awaited async's exception sits in the Deferred and can be lost. Always await every async you start; use launch (not async) for fire-and-forget so exceptions propagate.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you convert exceptions to a Result or sealed error type at the repository boundary?",
    a: [
      {
        t: "p",
        text: "Catch the low-level exceptions in the repository and map them to a domain result type — either Kotlin's `Result<T>` or a custom sealed hierarchy (`Success`/`NetworkError`/`ServerError`). This keeps exception handling in one place, hides framework details (Retrofit's `HttpException`) from the UI, and makes the ViewModel handle errors as data via an exhaustive `when`.",
      },
      {
        t: "code",
        title: "Mapping at the boundary",
        code: `sealed interface UserResult {
    data class Success(val user: User) : UserResult
    data object Offline : UserResult
    data class Server(val code: Int) : UserResult
}
suspend fun getUser(id: String): UserResult = try {
    UserResult.Success(api.getUser(id))
} catch (e: IOException) { UserResult.Offline }
  catch (e: HttpException) { UserResult.Server(e.code()) }
  // (let CancellationException propagate — don't catch it here)`,
      },
      {
        t: "list",
        items: [
          "**Map exceptions → domain results** — one place (the repository) translates failures.",
          "**Hide framework types** — the UI never sees `HttpException`; it sees `UserResult`.",
          "**Exhaustive handling** — a sealed result + `when` forces the UI to handle every case.",
          "**Preserve cancellation** — don't catch `CancellationException` in the mapping.",
        ],
      },
      {
        t: "note",
        text: "In the repository, catch low-level exceptions (IOException/HttpException) and map to a domain sealed result (Success/Offline/Server) or Result<T> — one place, hides framework types, and forces exhaustive when-handling in the UI. Don't catch CancellationException in the mapping (let it propagate).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do exceptions differ from cancellation in propagation?",
    a: [
      {
        t: "p",
        text: "A regular exception is a *failure*: with a normal Job it cancels the parent and all siblings, and propagates up to the default handler if unhandled. `CancellationException` is *not* a failure: it's a controlled stop that a coroutine uses to unwind itself; it doesn't cancel the parent upward, and it's expected. This is why the two are handled so differently.",
      },
      {
        t: "table",
        headers: ["", "Regular exception", "CancellationException"],
        rows: [
          ["Meaning", "failure", "controlled stop"],
          ["Cancels parent (regular Job)", "yes", "no (doesn't propagate up)"],
          ["Cancels siblings", "yes", "no"],
          ["Should you catch it", "handle it", "rethrow — never swallow"],
          ["Reaches default handler", "yes (if unhandled)", "no"],
        ],
      },
      {
        t: "list",
        items: [
          "**Exception = failure** — cancels the family (regular Job) and crashes if unhandled.",
          "**`CancellationException` = normal** — unwinds the one coroutine; doesn't fail the parent.",
          "**Handling** — handle real exceptions; rethrow cancellation.",
        ],
      },
      {
        t: "note",
        text: "A regular exception is a failure — it cancels parent+siblings (regular Job) and crashes if unhandled. CancellationException is a controlled stop — it unwinds only that coroutine, doesn't propagate up as failure, and must be rethrown (never swallowed). That asymmetry is why broad catch(Exception) is dangerous.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you idiomatically handle network errors (IOException, HttpException)?",
    a: [
      {
        t: "p",
        text: "Catch the two main categories from Retrofit/OkHttp: `IOException` (no connectivity, timeouts, DNS — a *connectivity* problem) and `HttpException` (a non-2xx HTTP response — a *server/response* problem, with a status code). Map them to distinct user-facing states so you can show 'You're offline' vs 'Something went wrong (500)' appropriately.",
      },
      {
        t: "code",
        title: "Two error categories",
        code: `try {
    api.getData()
} catch (e: IOException) {
    // network/connectivity: offline, timeout, DNS
    UiState.Offline
} catch (e: HttpException) {
    when (e.code()) {
        401 -> UiState.Unauthorized
        in 500..599 -> UiState.ServerError
        else -> UiState.Error(e.code())
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`IOException`** — connectivity failures (offline, timeout); suggest retry/offline UI.",
          "**`HttpException`** — the request reached the server but got an error status; branch on `code()` (401 → re-auth, 5xx → retry, 4xx → show message).",
          "**Timeouts** — `SocketTimeoutException` is an `IOException`; treat as retryable.",
          "**Don't catch `Exception` broadly** — you'd swallow cancellation and mask programming bugs.",
        ],
      },
      {
        t: "note",
        text: "Catch IOException (connectivity: offline/timeout/DNS → offline UI, retry) and HttpException (non-2xx response → branch on code(): 401 re-auth, 5xx retry, 4xx message). SocketTimeoutException is an IOException (retryable). Avoid broad catch(Exception) — it swallows cancellation and hides bugs.",
      },
    ],
  },
  {
    level: "senior",
    q: "Does CoroutineExceptionHandler catch exceptions from async? Why or why not?",
    a: [
      {
        t: "p",
        text: "No. `CoroutineExceptionHandler` only handles *uncaught* exceptions from `launch`-style coroutines (that have nowhere else to go). `async` *exposes* its exception through the `Deferred` — it's your job to catch it at `await()`. So an `async` exception is considered 'handled by await', and the handler is never invoked for it.",
      },
      {
        t: "list",
        items: [
          "**Handler is for `launch`** — catches uncaught exceptions that propagate to the root.",
          "**`async` defers to `await`** — the exception lives in the `Deferred`; you catch it around `await()`.",
          "**Consequence** — installing a handler doesn't protect against `async` failures; wrap `await` in try/catch.",
          "**Root-level only** — the handler must be on the scope/root coroutine, not an inner child.",
        ],
      },
      {
        t: "code",
        title: "async needs try/catch at await",
        code: `val d = scope.async { risky() }
try { d.await() } catch (e: Exception) { handle(e) }   // handler won't fire for this`,
      },
      {
        t: "note",
        text: "No — CoroutineExceptionHandler only catches uncaught launch exceptions at the root; async exposes its exception via the Deferred, so you must try/catch around await(). Installing a handler doesn't protect against async failures. And the handler only works on the scope/root, not inner children.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you install a global last-resort handler for uncaught coroutine exceptions?",
    a: [
      {
        t: "p",
        text: "Put a `CoroutineExceptionHandler` in the context of your *root* application/feature scope, so any uncaught `launch` exception in that scope's tree is delivered to it — where you can log/report it (e.g. to Crashlytics) rather than crash silently or unhelpfully. It's a safety net, not a substitute for local handling.",
      },
      {
        t: "code",
        title: "App-scope handler",
        code: `val handler = CoroutineExceptionHandler { _, e ->
    Firebase.crashlytics.recordException(e)
    Log.e("App", "Uncaught coroutine exception", e)
}
val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default + handler)
appScope.launch { backgroundWork() }   // uncaught -> handler`,
      },
      {
        t: "list",
        items: [
          "**On the root/app scope** — catches uncaught `launch` exceptions in that tree.",
          "**Log/report** — send to Crashlytics/analytics; optionally show a generic error.",
          "**Pair with `SupervisorJob`** — so one child's handled failure doesn't cancel the whole scope.",
          "**Not for `async`** — those need `await` try/catch; and it doesn't replace local handling of expected errors.",
        ],
      },
      {
        t: "note",
        text: "Install a CoroutineExceptionHandler in the ROOT/app scope's context to catch uncaught launch exceptions (log/report to Crashlytics). Pair with SupervisorJob so a handled failure doesn't kill the scope. It's a last-resort net — not for async (use await try/catch) and not a replacement for local handling of expected errors.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does supervisorScope change exception handling compared to coroutineScope?",
    a: [
      {
        t: "p",
        text: "In `coroutineScope`, a child's failure cancels its siblings and rethrows to the caller (all-or-nothing). In `supervisorScope`, child failures are *isolated* — one child failing doesn't cancel the others, and the failure isn't rethrown to the scope; you must handle each child's exception locally (try/catch or a handler). Choose based on whether the children are interdependent.",
      },
      {
        t: "list",
        items: [
          "**`coroutineScope`** — first child failure cancels siblings, rethrows to caller. Catch it around the scope.",
          "**`supervisorScope`** — failures isolated; siblings continue; not rethrown to the scope. Handle per child.",
          "**Per-child handling in supervisor** — try/catch inside each `launch`, or a `CoroutineExceptionHandler`.",
          "**Use** — `coroutineScope` for a combined operation; `supervisorScope` for independent tasks (screen sections, workers).",
        ],
      },
      {
        t: "note",
        text: "coroutineScope: a child failure cancels siblings and rethrows to the caller (catch around it). supervisorScope: failures isolated — siblings survive, not rethrown to the scope, so handle each child locally (try/catch or handler). Combined op → coroutineScope; independent tasks → supervisorScope.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you retry only on specific (transient) exceptions?",
    a: [
      {
        t: "p",
        text: "In your retry loop, catch and retry only the exceptions that are worth retrying (transient: timeouts, 5xx, connectivity), and immediately rethrow the rest (4xx client errors, programming bugs, cancellation). Retrying a 400 or a `NullPointerException` is pointless and hides bugs.",
      },
      {
        t: "code",
        title: "Selective retry",
        code: `suspend fun <T> retryTransient(times: Int, block: suspend () -> T): T {
    repeat(times - 1) {
        try { return block() }
        catch (e: CancellationException) { throw e }        // never retry cancellation
        catch (e: IOException) { /* transient: retry */ }
        catch (e: HttpException) { if (e.code() < 500) throw e /* client error: don't retry */ }
        delay(1000)
    }
    return block()
}`,
      },
      {
        t: "list",
        items: [
          "**Retry transient** — `IOException` (network), 5xx server errors, timeouts.",
          "**Don't retry** — 4xx client errors (bad request/auth), programming exceptions, and `CancellationException` (rethrow it).",
          "**Backoff + jitter** — space retries; add randomness to avoid thundering herds.",
          "**Cap attempts** — surface the error after N tries.",
        ],
      },
      {
        t: "note",
        text: "Retry only transient failures (IOException, 5xx, timeouts) and rethrow the rest (4xx client errors, bugs, and always CancellationException). Retrying a 400 or NPE is pointless and hides bugs. Add backoff + jitter and cap attempts. Selectivity is what makes retry safe and useful.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do exceptions propagate through withContext?",
    a: [
      {
        t: "p",
        text: "An exception thrown inside a `withContext(dispatcher) { }` block propagates out to the caller normally — `withContext` runs in the current coroutine, so the exception is thrown at the `withContext` call site and you catch it with an ordinary `try/catch`. It behaves like a regular function call for error purposes.",
      },
      {
        t: "code",
        title: "Catch around withContext",
        code: `try {
    val data = withContext(Dispatchers.IO) { api.load() }   // throws here on failure
    render(data)
} catch (e: IOException) {
    showError()
}`,
      },
      {
        t: "list",
        items: [
          "**Propagates to the caller** — the exception is rethrown at the `withContext` call site.",
          "**Ordinary `try/catch`** — wrap the `withContext` call.",
          "**Unlike `launch`** — `withContext` doesn't need a handler; it's sequential.",
          "**Cancellation flows too** — a `CancellationException` propagates through as well.",
        ],
      },
      {
        t: "note",
        text: "An exception in withContext(dispatcher){} propagates to the caller and is thrown at the withContext call site — catch it with ordinary try/catch, like a normal function call. Unlike launch, withContext is sequential and needs no handler. CancellationException flows through too.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you catch exceptions without breaking cancellation?",
    a: [
      {
        t: "p",
        text: "Catch *specific* exception types, or if you catch broadly, rethrow `CancellationException` first. Because `CancellationException` is an `Exception`, a naive `catch (e: Exception)` swallows it and breaks cancellation. The safe pattern makes the coroutine's cancellation survive while still handling real errors.",
      },
      {
        t: "code",
        title: "Cancellation-safe catch",
        code: `try {
    doWork()
} catch (e: CancellationException) {
    throw e                         // let cancellation propagate
} catch (e: Exception) {
    handle(e)                       // real errors
}
// Better: catch specific types so cancellation isn't caught at all
try { doWork() } catch (e: IOException) { handle(e) }`,
      },
      {
        t: "list",
        items: [
          "**Prefer specific types** — `IOException`, `HttpException`; cancellation isn't caught.",
          "**If broad, rethrow cancellation first** — `catch (CancellationException) { throw e }` before the generic catch.",
          "**Avoid `runCatching`/`catch (Throwable)` in coroutines** — they swallow cancellation.",
          "**Consistency** — apply this everywhere you handle coroutine errors.",
        ],
      },
      {
        t: "note",
        text: "Catch specific types (IOException/HttpException) so cancellation isn't caught, or if catching broadly, rethrow CancellationException first (catch it, throw e; then catch Exception). Avoid runCatching/catch(Throwable) in coroutines — they swallow cancellation and break structured concurrency.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you distinguish expected errors from programming bugs in coroutine code?",
    a: [
      {
        t: "p",
        text: "*Expected errors* are normal outcomes of the domain (network offline, 404, validation failure) — model them as data (`Result`/sealed) and show appropriate UI. *Programming bugs* (`NullPointerException`, `IllegalStateException`, index out of bounds) are defects — don't 'handle' them as recoverable; let them crash (in debug) and report them (in production) so you fix the root cause. Conflating the two hides bugs behind generic error screens.",
      },
      {
        t: "list",
        items: [
          "**Expected → data** — catch specific exceptions and map to result states (offline, not-found).",
          "**Bugs → surface/report** — don't swallow `NPE`/`IllegalState`; let them reach Crashlytics; fix the cause.",
          "**Broad catch hides bugs** — `catch (Exception) { showError() }` turns a crash you'd fix into a silent generic error.",
          "**Fail fast in debug** — crash on bugs during development to catch them early.",
        ],
      },
      {
        t: "note",
        text: "Expected errors (offline, 404, validation) → model as data (Result/sealed) with proper UI. Programming bugs (NPE, IllegalState) → don't 'handle' as recoverable; let them crash/report to Crashlytics so you fix the root cause. Broad catch(Exception){showError()} conflates them, hiding bugs behind generic error screens.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test that a coroutine surfaces errors correctly?",
    a: [
      {
        t: "p",
        text: "Use a fake that throws the exception you want to simulate, run the code under `runTest`, and assert the observable outcome — the error state emitted, the exception rethrown, or the fallback taken. For exceptions expected to propagate, assert with `assertFailsWith`; for errors mapped to state, assert the resulting UiState.",
      },
      {
        t: "code",
        title: "Testing error paths",
        code: `@Test fun mapsNetworkErrorToOffline() = runTest {
    val repo = FakeRepo(throws = IOException())
    val vm = UserViewModel(repo)
    vm.load(); advanceUntilIdle()
    assertEquals(UiState.Offline, vm.state.value)
}
@Test fun rethrows() = runTest {
    assertFailsWith<IllegalStateException> { subject.doWork() }
}`,
      },
      {
        t: "list",
        items: [
          "**Fake that throws** — inject a test double raising the target exception.",
          "**Assert the outcome** — the mapped error state, or `assertFailsWith` for propagation.",
          "**`runTest` + `advanceUntilIdle`** — drive the coroutine to completion deterministically.",
          "**Cover cancellation** — assert `CancellationException` isn't swallowed (the operation actually stops).",
        ],
      },
      {
        t: "note",
        text: "Inject a fake that throws the target exception, run under runTest + advanceUntilIdle, and assert the observable result: the mapped error UiState, or assertFailsWith for propagation. Also test that CancellationException isn't swallowed. Fakes throwing on demand are the cleanest way to exercise error paths.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you make sure coroutine exceptions reach your crash reporter?",
    a: [
      {
        t: "p",
        text: "Uncaught `launch` exceptions already reach the default handler (which Crashlytics hooks into), so they're reported and crash. For exceptions you *catch* but want to log (non-fatal), explicitly report them (`recordException`). And install a `CoroutineExceptionHandler` on app-level scopes to catch and report anything that would otherwise be lost.",
      },
      {
        t: "list",
        items: [
          "**Uncaught `launch`** — reaches the default uncaught handler → Crashlytics reports it as a crash.",
          "**Caught-but-notable** — call `Firebase.crashlytics.recordException(e)` to log non-fatals you handle.",
          "**App-scope handler** — a `CoroutineExceptionHandler` that reports, so no uncaught coroutine exception goes unlogged.",
          "**`async` exceptions** — reach the reporter only if you rethrow/record them at `await` (they won't hit the default handler on their own).",
        ],
      },
      {
        t: "note",
        text: "Uncaught launch exceptions hit the default handler → Crashlytics reports them (crash). For handled-but-notable errors, call recordException() (non-fatal). Add an app-scope CoroutineExceptionHandler that reports, so nothing is lost. async exceptions only reach the reporter if you rethrow/record them at await.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you provide a fallback value when an operation fails?",
    a: [
      {
        t: "p",
        text: "Catch the failure and return a default, use `withTimeoutOrNull`/`getOrDefault`, or fall back to a cached value. The goal is graceful degradation — a failed remote call falls back to cache or a sensible default rather than breaking the screen.",
      },
      {
        t: "code",
        title: "Fallback strategies",
        code: `// Fallback to cache on network failure
suspend fun getConfig(): Config = try {
    api.getConfig().also { cache.save(it) }
} catch (e: IOException) {
    cache.load() ?: Config.DEFAULT       // cached, then default
}
// Timeout fallback
val data = withTimeoutOrNull(3000) { fetch() } ?: cachedData()`,
      },
      {
        t: "list",
        items: [
          "**Catch → default** — return a sensible default on expected failures.",
          "**Cache fallback** — serve last-known-good data when the network fails (offline-first).",
          "**`withTimeoutOrNull` / `getOrDefault`** — concise fallbacks for timeouts/`Result`.",
          "**Don't mask everything** — fall back for expected errors; let bugs surface.",
        ],
      },
      {
        t: "note",
        text: "Provide fallbacks for expected failures: catch → default, serve cached last-known-good data (offline-first), or withTimeoutOrNull/getOrDefault for concise timeout/Result fallbacks. Degrade gracefully — but fall back only for expected errors; let programming bugs surface, don't mask them.",
      },
    ],
  },
  {
    level: "senior",
    q: "What happens if an exception is thrown during cleanup in a finally block?",
    a: [
      {
        t: "p",
        text: "If a `finally` block throws, that exception can *mask* the original exception (the one being handled during unwinding) — the finally's exception propagates and the original may be lost or attached as suppressed. So cleanup code should be robust: wrap risky cleanup in its own try/catch, and never let cleanup throw over a more important original error.",
      },
      {
        t: "code",
        title: "Safe cleanup",
        code: `try {
    useResource()
} finally {
    try { resource.close() } catch (e: Exception) { log(e) }   // don't let close() mask the real error
}`,
      },
      {
        t: "list",
        items: [
          "**Finally exceptions mask** — a throw in `finally` can replace/hide the original exception.",
          "**Guard cleanup** — wrap risky cleanup in its own try/catch (log, don't rethrow).",
          "**`use { }`** — Kotlin's `use` handles this correctly for `Closeable`, adding cleanup failures as suppressed.",
          "**Cancellation cleanup** — remember suspending cleanup needs `NonCancellable`.",
        ],
      },
      {
        t: "note",
        text: "A throw in finally can mask the original exception (it propagates instead, original lost/suppressed). Guard risky cleanup in its own try/catch (log, don't rethrow), or use Kotlin's use { } (adds cleanup failures as suppressed). And suspending cleanup during cancellation needs NonCancellable.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you surface errors to the UI as state?",
    a: [
      {
        t: "p",
        text: "Represent errors as part of your `UiState` — an `Error` variant of a sealed state, or an `error` field/one-off event — so the UI renders them declaratively (error screen, snackbar, retry button). The ViewModel catches exceptions, maps them to these states, and the UI reacts; the UI itself never touches exceptions.",
      },
      {
        t: "code",
        title: "Errors as UI state",
        code: `fun load() = viewModelScope.launch {
    _state.value = UiState.Loading
    _state.value = try {
        UiState.Content(repo.load())
    } catch (e: CancellationException) { throw e }
      catch (e: Exception) { UiState.Error(e.toUserMessage()) }
}`,
      },
      {
        t: "list",
        items: [
          "**Model errors in state** — an `Error` variant with a message/retry, or a transient event for snackbars.",
          "**ViewModel maps** — catch exceptions, translate to a user-facing message/state.",
          "**Declarative UI** — the UI renders whatever state it's given; no exception handling in composables/views.",
          "**Distinguish persistent vs transient** — full error screen vs snackbar depending on severity/context.",
        ],
      },
      {
        t: "note",
        text: "Model errors as UiState (an Error variant with message/retry, or a one-off event for snackbars); the ViewModel catches exceptions (rethrowing CancellationException) and maps them to those states, and the UI renders declaratively. The UI never handles exceptions directly. Use full-screen error vs snackbar by severity/context.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why shouldn't repositories leak low-level exceptions to the UI layer?",
    a: [
      {
        t: "p",
        text: "If a repository lets `HttpException`, `SQLiteException`, or `JsonParseException` bubble up to the ViewModel/UI, the upper layers become coupled to framework details, must know about every library's exception types, and tend to catch broadly (swallowing cancellation, hiding bugs). Mapping to domain errors at the boundary decouples layers and centralizes translation.",
      },
      {
        t: "list",
        items: [
          "**Decoupling** — the UI shouldn't know Retrofit/Room exist; it works with domain results.",
          "**Single translation point** — one place maps low-level exceptions to domain errors.",
          "**Avoids broad catches upstream** — the ViewModel handles a small set of domain results, not a zoo of framework exceptions.",
          "**Swappability** — changing the network/DB library doesn't ripple error handling through the UI.",
        ],
      },
      {
        t: "note",
        text: "Leaking HttpException/SQLiteException to the UI couples layers to framework details, forces the UI to know every library's exceptions, and encourages broad catches (swallowing cancellation/hiding bugs). Map to domain errors at the repository boundary — one translation point, decoupled layers, swappable libraries.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does error handling differ for launch vs async in a ViewModel?",
    a: [
      {
        t: "p",
        text: "With `launch` (the common ViewModel case), handle errors *inside* the coroutine with try/catch and map to state — a try/catch around `launch` catches nothing. With `async`, the exception surfaces at `await()`, so wrap the `await` in try/catch. Most ViewModel operations use `launch` and handle errors by updating state.",
      },
      {
        t: "code",
        title: "launch vs async error handling",
        code: `// launch: catch inside
fun load() = viewModelScope.launch {
    try { _state.value = Content(repo.load()) }
    catch (e: CancellationException) { throw e }
    catch (e: Exception) { _state.value = Error(e) }
}
// async: catch at await
fun combine() = viewModelScope.launch {
    try {
        coroutineScope { Data(a().await(), b().await()) }
    } catch (e: Exception) { _state.value = Error(e) }
}`,
      },
      {
        t: "list",
        items: [
          "**`launch`** — try/catch *inside* the block; map to state. (Around `launch` catches nothing.)",
          "**`async`** — try/catch around `await()`, where the exception surfaces.",
          "**Rethrow cancellation** — in both, don't swallow `CancellationException`.",
          "**Most VM code is `launch`** — set Loading → Content/Error in one place.",
        ],
      },
      {
        t: "note",
        text: "launch: handle errors INSIDE the block (try/catch around launch catches nothing) and map to state. async: handle at await() where the exception surfaces. Rethrow CancellationException in both. Most ViewModel operations are launch — set Loading then Content/Error inside.",
      },
    ],
  },
  {
    level: "senior",
    q: "When multiple parallel operations fail, how are the exceptions aggregated?",
    a: [
      {
        t: "p",
        text: "In a structured scope, the *first* exception to reach the parent becomes the reported cause and cancels the siblings; later exceptions from other children are attached as *suppressed* exceptions on the first (available via `Throwable.suppressed`). So you get one primary cause plus the secondary failures for diagnostics, and cancellation-induced `CancellationException`s are ignored.",
      },
      {
        t: "list",
        items: [
          "**First failure wins** — it's the thrown/reported cause and triggers sibling cancellation.",
          "**Others suppressed** — added to the first via `addSuppressed`, not lost.",
          "**Inspect** — `exception.suppressed` lists the additional failures.",
          "**If you need all results** — use `supervisorScope` and collect each `runCatching`/`await` result individually instead of aggregating exceptions.",
        ],
      },
      {
        t: "note",
        text: "In structured scope, the first exception to reach the parent is the reported cause (and cancels siblings); later failures attach as suppressed (Throwable.suppressed), not lost; cascade CancellationExceptions are ignored. To collect every result instead, use supervisorScope with per-child runCatching/await.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why doesn't a try/catch around launch catch the coroutine's exception?",
    a: [
      {
        t: "p",
        text: "`launch` returns immediately after *scheduling* the coroutine — the body runs later, concurrently. By the time the body throws, the `try/catch` around the `launch` statement has already completed. The exception has no way to travel back to that finished catch block; instead it propagates through the coroutine's job. So you must catch *inside* the `launch` block.",
      },
      {
        t: "code",
        title: "Inside, not around",
        code: `// WRONG — catches nothing
try { scope.launch { throw IOException() } } catch (e: Exception) { }
// RIGHT — catch in the body
scope.launch { try { risky() } catch (e: Exception) { handle(e) } }`,
      },
      {
        t: "list",
        items: [
          "**`launch` schedules and returns** — the body runs after the surrounding try/catch is done.",
          "**Exception goes to the job tree** — not back to the call site.",
          "**Catch inside** — put try/catch within the coroutine body, or use a `CoroutineExceptionHandler`.",
          "**`async` is different** — its exception surfaces at `await()`, so try/catch around `await` works.",
        ],
      },
      {
        t: "note",
        text: "launch schedules the coroutine and returns immediately, so the surrounding try/catch has already finished by the time the body throws — the exception propagates through the job tree, not back to the call site. Catch INSIDE the launch body (or use a CoroutineExceptionHandler). async differs: catch around await().",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is 'errors as values' often preferred over exceptions in coroutine app code?",
    a: [
      {
        t: "p",
        text: "Modeling expected failures as return values (`Result<T>` or a sealed type) makes them *explicit and compiler-checked*: the caller can't forget to handle them (an exhaustive `when`), the type signature documents what can go wrong, and you avoid the pitfalls of broad exception catching (swallowing `CancellationException`, masking bugs). Exceptions remain appropriate for truly exceptional/programming errors.",
      },
      {
        t: "list",
        items: [
          "**Explicit** — the return type shows failure is possible; callers must handle it.",
          "**Compiler-checked** — sealed result + `when` exhaustiveness forces handling of each case.",
          "**Avoids catch pitfalls** — no broad `catch (Exception)` that swallows cancellation or hides bugs.",
          "**Still use exceptions** — for programming errors and truly exceptional conditions; convert them to results at boundaries for expected domain errors.",
        ],
      },
      {
        t: "note",
        text: "Errors-as-values (Result/sealed) make expected failures explicit and compiler-checked (exhaustive when), self-documenting in the signature, and avoid broad-catch pitfalls (swallowed cancellation, hidden bugs). Reserve exceptions for programming errors/exceptional conditions; map them to result types at boundaries for expected domain errors.",
      },
    ],
  },
];

export default qa;
