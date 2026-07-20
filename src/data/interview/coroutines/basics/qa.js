// Coroutine Basics — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is a coroutine, and how is it different from a thread?",
    a: [
      {
        t: "p",
        text: "**The concept**: a coroutine is a computation that can be *suspended and resumed* without blocking a thread. When it hits a point where it must wait (a network response, a timer), it releases the thread it was running on — freeing that thread to do other work — and resumes later when the result is ready. This lets you write asynchronous code that reads like straightforward sequential code.",
      },
      {
        t: "list",
        items: [
          "**A thread is a heavy OS resource** — each has its own stack (~1MB) and is scheduled by the operating system. You can only have a limited number before memory and context-switching costs hurt.",
          "**A coroutine is lightweight** — it's essentially an object holding its suspended state, running *on* threads but not owning one. You can run millions of coroutines on a small thread pool because a *suspended* coroutine uses almost no resources.",
          "**Blocking vs suspending is the key**: a blocking task holds its thread while waiting (idle but occupied); a suspending coroutine gives the thread back while waiting. So 1000 coroutines waiting on network can share a few threads, whereas 1000 blocking tasks would need consideration of 1000 threads.",
        ],
      },
      {
        t: "p",
        text: "On Android this matters because the main thread must never block or the UI freezes. Coroutines let you write `val data = repository.load()` right on the main thread — it *suspends* (freeing the main thread to keep rendering) rather than blocking, and resumes with the data.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does the suspend keyword actually do?",
    a: [
      {
        t: "p",
        text: "**The concept**: `suspend` marks a function that *can suspend* — pause its coroutine at a suspension point and resume later. It's a compiler contract: a suspend function can only be called from another suspend function or from inside a coroutine, because suspension needs machinery (a hidden `Continuation` parameter) that only exists in a coroutine context.",
      },
      {
        t: "p",
        text: "**The critical thing it does NOT do**: `suspend` does *not* make the function run on a background thread. This is the most common misconception. A suspend function runs on whatever thread its calling coroutine is on — it merely gains the *ability* to suspend at suspension points (calls to other suspend functions like `delay`, `withContext`, or a Retrofit call). If you want the function's work to actually run off the main thread, that's a separate decision made with dispatchers — e.g. wrapping the heavy part in `withContext(Dispatchers.IO)`. So `suspend` = 'this can pause and resume without blocking', not 'this runs elsewhere'.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between delay() and Thread.sleep()?",
    a: [
      {
        t: "p",
        text: "**Both pause for a duration, but in fundamentally different ways.** `Thread.sleep(1000)` **blocks** the thread — the thread is occupied and unusable for that whole second, doing nothing. `delay(1000)` **suspends** the coroutine — it schedules a resume after a second and *releases the thread*, so during that second the thread is free to run other coroutines.",
      },
      {
        t: "list",
        items: [
          "**On the main thread**: `Thread.sleep` on the main thread freezes the UI for that duration (and risks an ANR). `delay` on the main thread is fine — the main thread keeps rendering while the coroutine waits.",
          "**Scalability**: a thousand coroutines all calling `delay` can share a single thread (they're all just suspended, waiting for their resume). A thousand tasks calling `Thread.sleep` would each hold a thread.",
          "**`delay` is a suspend function** (only callable from a coroutine); `Thread.sleep` is a normal blocking call.",
        ],
      },
      {
        t: "p",
        text: "This contrast is the clearest illustration of what 'suspending' means: waiting without blocking. It's why coroutines make waiting nearly free — a suspended coroutine costs almost nothing, while a blocked thread is an expensive resource sitting idle.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you run two independent network calls concurrently with coroutines?",
    a: [
      {
        t: "p",
        text: "**The concept**: by default, suspend calls run *sequentially* — `val a = fetchA(); val b = fetchB()` waits for A to finish before starting B, so the total time is A + B. To run independent calls *concurrently*, you start each with `async` (which begins immediately and returns a `Deferred`) and then `await` both. Total time becomes the *slower* of the two, not the sum.",
      },
      {
        t: "code",
        title: "async for concurrency",
        code: `suspend fun loadDashboard(): Dashboard = coroutineScope {
    val user = async { api.getUser() }      // starts now
    val feed = async { api.getFeed() }       // starts now, in parallel
    Dashboard(user.await(), feed.await())    // wait for both
}`,
      },
      {
        t: "p",
        text: "The key points: `async` starts the work immediately (not when you call `await`), so both requests are in flight at once; `await()` suspends until that particular result is ready; and you wrap them in `coroutineScope { }` so the function only returns when both complete, and if one fails the other is cancelled (structured concurrency). Use plain sequential calls when B *depends* on A's result; use `async` when they're independent and you want them overlapped.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain how coroutine suspension works under the hood (continuations and the state machine).",
    a: [
      {
        t: "p",
        text: "**The mechanism is Continuation Passing Style (CPS) plus a compiler-generated state machine.** When you write a suspend function, the Kotlin compiler rewrites it substantially:",
      },
      {
        t: "list",
        items: [
          "**Hidden Continuation parameter**: the compiler adds an extra parameter of type `Continuation<T>` to every suspend function. A `Continuation` is essentially a callback with a `resumeWith(Result<T>)` method representing 'the rest of the computation'. So `suspend fun load(): Data` compiles to something like `fun load(completion: Continuation<Data>): Any?`.",
          "**State machine transformation**: the compiler splits the function body at each suspension point into discrete states and generates a class (a `Continuation` implementation) whose `invokeSuspend` is a big `switch` over a label. Each suspension point gets a label; the class stores which label to resume at, plus the local variables that must survive the suspension.",
          "**Suspend-or-return protocol**: at a suspension point, the called suspend function either returns its result immediately (fast path, no actual suspension) or returns the sentinel `COROUTINE_SUSPENDED`. Returning that sentinel unwinds the call stack — the thread is released. When the awaited work completes, someone calls the continuation's `resumeWith`, which re-invokes the state machine, jumping (via the stored label) to right after the suspension point, with locals restored.",
        ],
      },
      {
        t: "p",
        text: "**Why this matters conceptually**: 'suspension' is not magic threading — it's *saving the computation's state, returning to free the thread, and resuming later via a callback*. There's no blocked thread in between. This also explains real behaviors: locals are stored in the continuation object (so a coroutine has a small heap footprint, not a thread stack); resumption can happen on a different thread (the dispatcher decides); and deeply nested suspend calls form a chain of continuations. When an interviewer asks 'how do coroutines work', this CPS-plus-state-machine explanation is the complete answer.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is 'suspend doesn't mean background thread' an important distinction? Give a concrete example.",
    a: [
      {
        t: "p",
        text: "**Because it's the difference between code that helps and code that still freezes your UI.** `suspend` gives a function the *ability to suspend* at suspension points, but it runs on the caller's thread. If a suspend function does *blocking* or *CPU-heavy* work without a suspension point that switches threads, and it's called from a main-thread coroutine, it runs that heavy work **on the main thread** — freezing the UI exactly as a normal blocking call would.",
      },
      {
        t: "code",
        title: "A suspend function that still blocks the main thread",
        code: `// BUG: 'suspend' but does blocking IO on whatever thread called it
suspend fun readFileBad(path: String): String {
    return File(path).readText()   // blocking! runs on caller's thread (Main!)
}

// FIX: move the blocking work off-main with a dispatcher
suspend fun readFileGood(path: String): String = withContext(Dispatchers.IO) {
    File(path).readText()          // now runs on an IO thread
}`,
      },
      {
        t: "list",
        items: [
          "The `suspend` keyword on `readFileBad` compiles fine and looks async, but calling it from `viewModelScope.launch { }` (which uses `Dispatchers.Main`) runs `readText()` on the main thread → jank/ANR. The keyword bought nothing here.",
          "**Main-safety is a separate contract**: a well-behaved suspend function is *main-safe* — safe to call from the main thread because it internally switches to the right dispatcher for any blocking/CPU work (`withContext(IO)` for IO, `withContext(Default)` for CPU). Retrofit and Room suspend functions are main-safe because they do this internally.",
          "**The layering rule**: the layer *doing* the blocking work owns the `withContext`, not the caller. So repositories/use-cases wrap their heavy work; ViewModels can then call them from the main thread safely without sprinkling `withContext` everywhere.",
        ],
      },
      {
        t: "p",
        text: "The distinction matters because it's a real, shippable bug: developers assume `suspend` = 'off the main thread', write blocking code in a suspend function, and ship UI jank. The correct mental model — `suspend` = suspendable, dispatchers = threading — prevents it.",
      },
    ],
  },
  {
    level: "senior",
    q: "Coroutines are described as 'sequential by default'. Why is that a good design, and how do you opt into concurrency safely?",
    a: [
      {
        t: "p",
        text: "**The design**: inside a coroutine, suspend calls execute one after another — `a()` fully completes before `b()` starts — exactly like ordinary synchronous code. Concurrency is not the default; you explicitly request it. This is a deliberate inversion of thread-based programming, where everything runs concurrently and you must *add* synchronization to make it safe.",
      },
      {
        t: "list",
        items: [
          "**Why sequential-by-default is good**: most bugs in concurrent code come from *accidental* concurrency — two things touching shared state at once, races, ordering assumptions. When the default is sequential, you can't have those bugs unless you deliberately introduce concurrency, and where you do, it's visible and localized. Code is predictable and reads top-to-bottom.",
          "**Opting in with `async`**: for independent work, `async { }` starts a child coroutine immediately and returns a `Deferred<T>`; `await()` gets its result. `val a = async{...}; val b = async{...}; use(a.await(), b.await())` runs both concurrently, taking `max` time instead of the `sum`.",
          "**Doing it *safely* means using structured concurrency**: wrap the `async` calls in `coroutineScope { }` (or launch them in a proper scope). Then the enclosing function won't return until all children complete, and — critically — if one child fails, the others are cancelled and the exception propagates, rather than leaking orphaned coroutines. Naked `GlobalScope.async` opts out of that safety and is an anti-pattern.",
        ],
      },
      {
        t: "code",
        title: "Safe concurrency = async inside a structured scope",
        code: `suspend fun load(): Screen = coroutineScope {   // structured boundary
    val a = async { repo.getA() }
    val b = async { repo.getB() }
    Screen(a.await(), b.await())
    // if getA() throws, getB() is cancelled and coroutineScope rethrows
}`,
      },
      {
        t: "p",
        text: "So the senior framing: sequential default eliminates whole classes of concurrency bugs and makes async code readable; when you need parallelism you add `async` *inside a structured scope*, which gives you concurrency *with* automatic cancellation and error propagation — parallel speed without orphaned work or swallowed failures.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the core vocabulary of coroutines (suspend, builder, scope, context, job, dispatcher)?",
    a: [
      {
        t: "p",
        text: "Coroutines have a small set of interlocking concepts. Understanding how they relate demystifies the whole library: a *suspend function* is work that can pause; a *builder* starts a coroutine; a *scope* defines where coroutines live and when they're cancelled; a *context* carries configuration; a *job* is the handle to a running coroutine; a *dispatcher* decides which thread runs it.",
      },
      {
        t: "list",
        items: [
          "**`suspend` function** — a function that can pause and resume without blocking a thread.",
          "**Builder** — `launch`, `async`, `runBlocking` — starts a coroutine from a scope.",
          "**`CoroutineScope`** — defines a lifecycle boundary; cancelling the scope cancels its coroutines (structured concurrency).",
          "**`CoroutineContext`** — an indexed set of elements (Job, Dispatcher, name, exception handler) that configures a coroutine.",
          "**`Job`** — the handle: lets you `cancel()`, `join()`, and observe state; forms the parent-child tree.",
          "**Dispatcher** — a context element deciding the thread pool (`Main`, `IO`, `Default`).",
        ],
      },
      {
        t: "note",
        text: "Vocabulary: suspend fn (pausable work) → builder (launch/async) starts it in a scope (lifecycle boundary) using a context (Job + Dispatcher + name + handler); the Job is the handle (cancel/join) forming the parent-child tree, and the Dispatcher picks the thread. These six concepts underlie everything.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a suspending function, and how do you call one?",
    a: [
      {
        t: "p",
        text: "A suspending function (marked `suspend`) is one that may pause execution partway through and resume later, without blocking the thread it ran on. Because pausing requires coroutine machinery, a suspend function can only be called from another suspend function or from inside a coroutine builder — not from ordinary code.",
      },
      {
        t: "code",
        title: "Declaring and calling suspend functions",
        code: `suspend fun fetchUser(id: String): User { /* may suspend on I/O */ }

// Called from another suspend function — fine:
suspend fun loadProfile(id: String): Profile {
    val user = fetchUser(id)   // suspends here, thread not blocked
    return Profile(user)
}

// From non-suspend code, launch a coroutine first:
viewModelScope.launch { val u = fetchUser(id) }   // builder provides the coroutine`,
      },
      {
        t: "list",
        items: [
          "**`suspend` marks pausable work** — the compiler transforms it so it can suspend/resume.",
          "**Call site rule** — only from another `suspend` function or a coroutine builder; the compiler enforces this.",
          "**No thread blocked while suspended** — that's the whole benefit over a blocking call.",
          "**It looks synchronous** — you write sequential code; suspension is invisible in the source.",
        ],
      },
      {
        t: "note",
        text: "A suspend function can pause and resume without blocking its thread. Call it only from another suspend function or a coroutine builder (launch/async/runBlocking) — the compiler enforces this. It reads like sequential code; the suspension is handled by the compiler-generated state machine.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do coroutines improve on callbacks and 'callback hell'?",
    a: [
      {
        t: "p",
        text: "Callback-based async code nests deeply (a callback inside a callback inside a callback) and scatters error handling and cancellation across levels — the infamous 'callback hell'. Coroutines let you write asynchronous code in a straight, sequential style: each suspending call reads like a normal function call, so the logic is linear and readable, with normal `try/catch` and structured cancellation.",
      },
      {
        t: "code",
        title: "Callbacks vs coroutines",
        code: `// Callback hell
getUser(id) { user ->
    getPosts(user) { posts ->
        getComments(posts) { comments -> show(comments) }   // nested, hard to error-handle
    }
}
// Coroutines: linear
suspend fun load(id: String) {
    val user = getUser(id)
    val posts = getPosts(user)
    val comments = getComments(posts)   // sequential, try/catch works normally
    show(comments)
}`,
      },
      {
        t: "list",
        items: [
          "**Linear code** — no nesting; the happy path reads top-to-bottom.",
          "**Normal error handling** — a single `try/catch` wraps the sequence instead of per-callback handling.",
          "**Structured cancellation** — leaving the scope cancels the whole chain; callbacks have no built-in cancellation.",
          "**Composability** — suspend functions call suspend functions, building complex flows from simple pieces.",
        ],
      },
      {
        t: "note",
        text: "Coroutines turn nested callbacks into linear, sequential code: each suspending call reads like a normal call, so logic flows top-to-bottom with ordinary try/catch and structured cancellation — eliminating callback hell's nesting, scattered error handling, and manual cancellation.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do coroutines compare to RxJava?",
    a: [
      {
        t: "p",
        text: "Both handle asynchronous work, but coroutines are a *language feature* for sequential-looking async code, while RxJava is a *library* built around observable streams and operators. For one-shot async calls, coroutines are simpler; for complex event/stream processing, RxJava's operators are powerful — though Kotlin `Flow` now covers most streaming needs on top of coroutines.",
      },
      {
        t: "table",
        headers: ["", "Coroutines (+Flow)", "RxJava"],
        rows: [
          ["Nature", "language feature", "library"],
          ["One-shot async", "`suspend` fun (simple)", "Single/Completable (heavier)"],
          ["Streams", "`Flow`", "Observable/Flowable"],
          ["Cancellation", "structured, automatic", "manual (dispose)"],
          ["Learning curve", "sequential, familiar", "many operators"],
          ["Backpressure", "suspension-based", "explicit strategies"],
        ],
      },
      {
        t: "list",
        items: [
          "**Coroutines** — sequential style, structured concurrency (auto-cancellation), lighter for simple async; Kotlin-first.",
          "**RxJava** — rich operator ecosystem for complex stream transformations; explicit backpressure; but manual disposal and a steeper curve.",
          "**Flow** — brings Rx-like streaming to coroutines with cold streams and operators; most new Android code uses coroutines + Flow.",
          "**Migration** — many apps moved from RxJava to coroutines/Flow for simpler cancellation and less boilerplate.",
        ],
      },
      {
        t: "note",
        text: "Coroutines = language feature for sequential async with structured (automatic) cancellation; RxJava = library of observable streams/operators with manual disposal and backpressure strategies. Coroutines are simpler for one-shot calls; Flow covers streaming. New Android code favors coroutines + Flow over RxJava.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does it mean that coroutines are 'lightweight', and how many can you run?",
    a: [
      {
        t: "p",
        text: "Coroutines are lightweight because they're *not* backed one-to-one by OS threads — many coroutines multiplex onto a small pool of threads. A suspended coroutine holds no thread; it's just a small object (its state machine) parked in memory. So you can run hundreds of thousands of coroutines where the equivalent number of threads would exhaust memory and crash.",
      },
      {
        t: "code",
        title: "100k coroutines vs 100k threads",
        code: `runBlocking {
    repeat(100_000) {
        launch { delay(1000); print(".") }   // fine — coroutines are cheap
    }
}
// repeat(100_000) { thread { Thread.sleep(1000) } }  // OutOfMemoryError`,
      },
      {
        t: "list",
        items: [
          "**No 1:1 thread mapping** — coroutines suspend and yield their thread; many share a few threads.",
          "**Cheap to create** — a coroutine is a small object, not a ~1MB-stack thread.",
          "**Suspended = free** — a waiting coroutine consumes no thread, unlike a blocked thread.",
          "**Practical impact** — you can freely launch a coroutine per item/request without worrying about thread limits.",
        ],
      },
      {
        t: "note",
        text: "Coroutines are lightweight because they multiplex onto a few threads instead of mapping 1:1 — a suspended coroutine holds no thread, just a small state object. You can run hundreds of thousands (vs threads, which OOM in the thousands). Launch freely per item/request.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between concurrency and parallelism in coroutines?",
    a: [
      {
        t: "p",
        text: "Concurrency is *dealing with* many tasks by interleaving them (making progress on multiple things, possibly on one thread); parallelism is *literally running* tasks at the same instant on multiple cores. Coroutines give you concurrency by default (suspension lets many tasks interleave on few threads); parallelism additionally requires a multi-threaded dispatcher.",
      },
      {
        t: "list",
        items: [
          "**Concurrency** — structure that lets tasks make progress independently; achievable on a single thread via suspension (e.g. many network waits interleaved).",
          "**Parallelism** — simultaneous execution on multiple CPU cores; needs a multi-threaded dispatcher like `Dispatchers.Default`.",
          "**Coroutines default to concurrency** — `async` two calls and they run concurrently; whether they run in *parallel* depends on the dispatcher's thread count.",
          "**CPU vs I/O** — parallelism helps CPU-bound work (use `Default`); concurrency alone suffices for I/O-bound waiting (`IO` lets many suspend).",
        ],
      },
      {
        t: "note",
        text: "Concurrency = interleaving many tasks (possible on one thread via suspension); parallelism = truly simultaneous on multiple cores (needs a multi-threaded dispatcher). Coroutines give concurrency by default; async two I/O calls interleave regardless, but CPU-bound parallelism needs Dispatchers.Default.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a Deferred, and how does await() work?",
    a: [
      {
        t: "p",
        text: "`Deferred<T>` is the result handle returned by `async` — a coroutine that will eventually produce a value of type `T`. You get that value by calling `await()`, a suspend function that pauses until the async coroutine completes and returns its result (or rethrows its exception). It's the coroutine equivalent of a `Future`/`Promise`.",
      },
      {
        t: "code",
        title: "Deferred and await",
        code: `coroutineScope {
    val userDeferred: Deferred<User> = async { fetchUser() }
    val postsDeferred: Deferred<List<Post>> = async { fetchPosts() }
    // both run concurrently; await when you need the values
    val user = userDeferred.await()
    val posts = postsDeferred.await()
    show(user, posts)
}`,
      },
      {
        t: "list",
        items: [
          "**`Deferred<T>`** — a `Job` that also carries a result; returned by `async`.",
          "**`await()`** — suspends until the value is ready; rethrows any exception the async coroutine threw.",
          "**Concurrency** — start multiple `async`s, then `await` them, to run work in parallel and combine results.",
          "**Don't `await` immediately** — `async { }.await()` in sequence defeats concurrency; start all, then await.",
        ],
      },
      {
        t: "note",
        text: "Deferred<T> is async's result handle (a Job with a value — like a Future). await() suspends until it's ready and rethrows its exception. Start several async blocks, then await them, to run concurrently and combine results — but don't await each immediately, or you serialize the work.",
      },
    ],
  },
  {
    level: "junior",
    q: "What happens if you call a suspend function without a coroutine, and how do you start one?",
    a: [
      {
        t: "p",
        text: "You can't — it won't compile. A suspend function requires a suspending context, so calling it from ordinary (non-suspend) code is a compile error: 'Suspend function can only be called within a coroutine body.' To start from regular code (a click handler, `onCreate`), use a coroutine builder from an appropriate scope.",
      },
      {
        t: "code",
        title: "Starting a coroutine from normal code",
        code: `// ERROR: can't call suspend fun here
fun onButtonClick() { fetchUser(id) }   // won't compile

// FIX: launch from a scope
fun onButtonClick() {
    viewModelScope.launch { val u = fetchUser(id) }   // or lifecycleScope in UI
}`,
      },
      {
        t: "list",
        items: [
          "**Compile error, not runtime** — the compiler stops you, which is good.",
          "**Use a builder** — `launch`/`async` from a scope (`viewModelScope`, `lifecycleScope`), or `runBlocking` in a `main`/test.",
          "**Pick the right scope** — one tied to the correct lifecycle so the coroutine is cancelled appropriately.",
          "**Not `runBlocking` in production UI** — it blocks the thread; reserve it for `main`/tests.",
        ],
      },
      {
        t: "note",
        text: "Calling a suspend function from non-suspend code is a compile error. Start one with a builder from the right scope: viewModelScope/lifecycleScope.launch { } in Android, runBlocking only in main/tests. Choosing a lifecycle-appropriate scope ensures the coroutine cancels when it should.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you convert a callback-based API into a suspend function?",
    a: [
      {
        t: "p",
        text: "Use `suspendCancellableCoroutine { continuation -> }` — it suspends the coroutine and gives you a `Continuation` you resume when the callback fires. Register the callback inside, call `continuation.resume(value)` on success or `resumeWithException(e)` on failure, and use `invokeOnCancellation { }` to unregister/clean up if the coroutine is cancelled.",
      },
      {
        t: "code",
        title: "Wrapping a callback API",
        code: `suspend fun getLocation(): Location = suspendCancellableCoroutine { cont ->
    val callback = object : LocationCallback() {
        override fun onResult(loc: Location) { cont.resume(loc) }
        override fun onError(e: Exception) { cont.resumeWithException(e) }
    }
    locationClient.request(callback)
    cont.invokeOnCancellation { locationClient.remove(callback) }   // cleanup on cancel
}`,
      },
      {
        t: "list",
        items: [
          "**`suspendCancellableCoroutine`** — bridges a one-shot callback to a suspend function; prefer over `suspendCoroutine` because it supports cancellation.",
          "**Resume once** — call `resume`/`resumeWithException` exactly once; resuming twice throws.",
          "**`invokeOnCancellation`** — unregister the callback / cancel the underlying request when the coroutine is cancelled (prevents leaks).",
          "**For streams of callbacks** — use `callbackFlow` instead (multiple emissions), not `suspendCancellableCoroutine` (single result).",
        ],
      },
      {
        t: "note",
        text: "Wrap a one-shot callback with suspendCancellableCoroutine { cont -> }: register the callback, cont.resume(value)/resumeWithException(e) exactly once, and invokeOnCancellation { } to unregister on cancel. Prefer it over suspendCoroutine (cancellation support). For multi-emission callbacks, use callbackFlow instead.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is 'main-safety', and whose responsibility is it?",
    a: [
      {
        t: "p",
        text: "Main-safety means a function is safe to call from the main (UI) thread — it won't block it, even if it does I/O or heavy computation, because it moves that work to a background dispatcher internally. The convention is that *suspend functions should be main-safe*: the caller shouldn't have to know or care which thread to use.",
      },
      {
        t: "code",
        title: "A main-safe repository function",
        code: `class UserRepository(private val io: CoroutineDispatcher = Dispatchers.IO) {
    // Main-safe: caller can invoke from the main thread freely
    suspend fun getUser(id: String): User = withContext(io) {
        api.fetchUser(id)   // heavy I/O runs on IO, not the caller's thread
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Suspend functions should be main-safe** — internally switch to `IO`/`Default` for blocking/CPU work so callers needn't manage threads.",
          "**Push `withContext` down** — the *repository/data layer* owns the dispatcher choice, not the ViewModel or UI.",
          "**Benefit** — the ViewModel just calls `repo.getUser(id)` from `viewModelScope` (Main) without wrapping it.",
          "**Room/Retrofit are already main-safe** — their generated suspend functions handle the dispatcher, so don't double-wrap them.",
        ],
      },
      {
        t: "note",
        text: "Main-safety = a function is safe to call from the main thread because it internally moves blocking/CPU work to IO/Default. Convention: suspend functions are main-safe, with withContext pushed down into the repository/data layer — so the ViewModel just calls it. Room/Retrofit suspend functions are already main-safe.",
      },
    ],
  },
  {
    level: "senior",
    q: "Does a coroutine run on a single thread, or can it change threads?",
    a: [
      {
        t: "p",
        text: "A coroutine is not bound to one thread — it can resume on a *different* thread than it suspended on, and `withContext` deliberately moves it between dispatchers. This is a key difference from thread-based code: you can't rely on thread-local state or assume 'same thread throughout'. The dispatcher decides which thread runs each resumed continuation.",
      },
      {
        t: "list",
        items: [
          "**Thread-hopping on resume** — after a suspension point, the coroutine may continue on another thread from the dispatcher's pool.",
          "**`withContext` switches deliberately** — the code before and after runs on different dispatchers/threads.",
          "**Avoid thread-locals** — they don't reliably survive suspension; use `CoroutineContext` elements (`ThreadLocal.asContextElement()`) if you truly need per-coroutine data.",
          "**`Dispatchers.Main` / single-thread confinement** — pin a coroutine to one thread when needed (e.g. UI updates, non-thread-safe libraries).",
        ],
      },
      {
        t: "code",
        title: "Thread changes across withContext",
        code: `suspend fun work() {
    // runs on caller's dispatcher (e.g. Main)
    val data = withContext(Dispatchers.IO) { loadFromDisk() }   // now on an IO thread
    updateUi(data)   // back on Main
}`,
      },
      {
        t: "note",
        text: "A coroutine isn't pinned to one thread — it can resume on a different thread after a suspension point, and withContext moves it between dispatchers on purpose. So don't rely on thread-locals or 'same thread throughout'. Use single-thread confinement (Dispatchers.Main / a single-thread dispatcher) when you truly need thread affinity.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you launch a coroutine from a non-suspend context like a click handler?",
    a: [
      {
        t: "p",
        text: "Call a coroutine builder (`launch`) on an appropriate `CoroutineScope`. In Android, that's typically `viewModelScope` (in a ViewModel) or `lifecycleScope` (in an Activity/Fragment) — scopes that cancel automatically when their owner is destroyed, so the coroutine doesn't outlive the screen.",
      },
      {
        t: "code",
        title: "Launching from callbacks",
        code: `// In a ViewModel:
fun onRefresh() {
    viewModelScope.launch {
        _state.value = Loading
        _state.value = Content(repo.load())   // suspend call inside the coroutine
    }
}
// In an Activity/Fragment for UI-lifecycle work:
button.setOnClickListener { lifecycleScope.launch { doWork() } }`,
      },
      {
        t: "list",
        items: [
          "**`viewModelScope`** — for business/data work; cancelled when the ViewModel is cleared (survives config change).",
          "**`lifecycleScope`** — for UI-lifecycle work; cancelled with the Activity/Fragment.",
          "**Don't use `GlobalScope`** — it isn't lifecycle-bound and leaks.",
          "**`launch` vs `async`** — use `launch` for fire-and-forget; `async` only when you need a returned value to `await`.",
        ],
      },
      {
        t: "note",
        text: "From a click handler, call launch on a lifecycle-bound scope: viewModelScope (business/data, survives config change) or lifecycleScope (UI-lifecycle work). Both auto-cancel with their owner. Avoid GlobalScope (leaks). Use launch for fire-and-forget, async only when you need a value.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a coroutine builder, and what are the main ones?",
    a: [
      {
        t: "p",
        text: "A coroutine builder is a function that *creates and starts* a coroutine. The three foundational ones are `launch` (fire-and-forget, returns a `Job`), `async` (returns a `Deferred<T>` result), and `runBlocking` (bridges blocking code to coroutines by blocking the current thread until done). There are also stream builders like `produce` (Channel) and `flow`.",
      },
      {
        t: "table",
        headers: ["Builder", "Returns", "Use for"],
        rows: [
          ["`launch`", "`Job`", "fire-and-forget work"],
          ["`async`", "`Deferred<T>`", "concurrent work with a result"],
          ["`runBlocking`", "`T` (blocks)", "main()/tests bridging blocking↔suspend"],
          ["`produce`", "`ReceiveChannel<T>`", "streaming values via a channel"],
          ["`withContext`", "`T`", "switch context (not really a 'builder')"],
        ],
      },
      {
        t: "list",
        items: [
          "**`launch`** — starts a coroutine, returns a `Job` to cancel/join; doesn't return a result.",
          "**`async`** — starts a coroutine that yields a value via `await()`; use for concurrency.",
          "**`runBlocking`** — blocks the calling thread until the coroutine finishes; only for `main`/tests, never on the UI thread.",
          "**`launch`/`async` are extensions on `CoroutineScope`** — they need a scope, enforcing structured concurrency.",
        ],
      },
      {
        t: "note",
        text: "Builders create+start coroutines: launch (Job, fire-and-forget), async (Deferred<T>, concurrent result), runBlocking (blocks the thread — main()/tests only), produce (ReceiveChannel stream). launch/async are CoroutineScope extensions, so they require a scope — enforcing structured concurrency.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the coroutine lifecycle (its states)?",
    a: [
      {
        t: "p",
        text: "A coroutine (via its `Job`) moves through well-defined states: *New* (created, not started), *Active* (running or suspended), *Completing* (waiting for children), *Completed* (finished), *Cancelling*, and *Cancelled*. Knowing these explains behaviors like why a parent waits for children, and how `isActive`/`isCancelled`/`isCompleted` reflect the state.",
      },
      {
        t: "list",
        items: [
          "**New** — created with `start = LAZY`, not yet running (starts on `start()`/`await()`).",
          "**Active** — the normal running/suspended state after launch.",
          "**Completing** — the coroutine's own code finished, but it waits for child coroutines to complete (structured concurrency).",
          "**Completed** — fully done, including children.",
          "**Cancelling → Cancelled** — after `cancel()` (or a failure), it winds down (running `finally`/cleanup) then reaches Cancelled.",
        ],
      },
      {
        t: "code",
        title: "Observing state",
        code: `val job = scope.launch { work() }
job.isActive      // true while running/suspended
job.cancel()      // -> Cancelling -> Cancelled
job.isCancelled   // true
job.isCompleted   // true once fully done (completed OR cancelled)`,
      },
      {
        t: "note",
        text: "Job states: New (lazy, not started) → Active (running/suspended) → Completing (waiting for children) → Completed; or Cancelling → Cancelled after cancel()/failure. 'Completing' (waiting on children) is why a parent doesn't finish before its children — the essence of structured concurrency. Query via isActive/isCancelled/isCompleted.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a suspension point, and what is yield()?",
    a: [
      {
        t: "p",
        text: "A suspension point is a place in a coroutine where it *may* pause — every call to a suspend function is a potential suspension point. `yield()` is a suspend function that voluntarily gives up the thread at that point, letting other coroutines run and also acting as a cancellation check — useful in CPU-bound loops to stay cooperative.",
      },
      {
        t: "code",
        title: "yield() in a loop",
        code: `suspend fun crunch(items: List<Int>) {
    for (item in items) {
        process(item)
        yield()   // suspension point: lets others run + checks for cancellation
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Suspension point** — any `suspend` call; the coroutine can pause here and resume later, possibly on another thread.",
          "**`yield()`** — voluntarily suspends briefly, allowing other coroutines on the dispatcher to progress (fairness).",
          "**Cancellation check** — `yield()` (and other suspend calls) throw `CancellationException` if the coroutine was cancelled, making tight loops cancellable.",
          "**CPU-bound loops** — a loop with no suspension points isn't cancellable and can starve others; add `yield()` or check `isActive`.",
        ],
      },
      {
        t: "note",
        text: "A suspension point is anywhere a coroutine may pause — every suspend call is one. yield() voluntarily suspends to let other coroutines run (fairness) and checks for cancellation (throws if cancelled). Add it to tight CPU-bound loops that otherwise have no suspension points, so they stay cancellable and don't starve the dispatcher.",
      },
    ],
  },
  {
    level: "junior",
    q: "Do suspend functions throw exceptions like normal functions?",
    a: [
      {
        t: "p",
        text: "Yes — a suspend function throws exceptions just like a regular function, and you catch them with an ordinary `try/catch` at the call site. This is a major ergonomic win over callbacks: error handling is synchronous-looking. (The subtlety is with `launch`/`async`, where exceptions propagate through the coroutine's job — but a direct suspend call in your code throws normally.)",
      },
      {
        t: "code",
        title: "try/catch around suspend calls",
        code: `suspend fun load(id: String): Result<User> = try {
    Result.success(api.fetchUser(id))   // suspend call may throw
} catch (e: IOException) {
    Result.failure(e)                    // caught like any exception
}`,
      },
      {
        t: "list",
        items: [
          "**Normal `try/catch`** — wraps a sequence of suspend calls; the failing call throws at that point.",
          "**Sequential semantics** — the exception unwinds the suspend call stack like a synchronous one.",
          "**`launch`/`async` differ** — an uncaught exception in `launch` propagates to the parent job (and handler); `async` holds it until `await()`. But your own suspend function throws normally.",
          "**`CancellationException`** — is special: don't swallow it in a broad `catch` (it signals cancellation); rethrow it.",
        ],
      },
      {
        t: "note",
        text: "Yes — suspend functions throw like normal functions; catch with ordinary try/catch at the call site (synchronous-looking error handling). The nuance is builders: launch propagates to the parent job, async defers to await(). And never swallow CancellationException in a broad catch — rethrow it.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is coroutineContext, accessible inside a coroutine?",
    a: [
      {
        t: "p",
        text: "Inside any suspend function or coroutine you can access the `coroutineContext` property — the set of context elements (Job, dispatcher, name, exception handler) the coroutine is running with. It lets you read the current Job (`coroutineContext[Job]`), check `isActive`, or inspect the dispatcher, without passing anything explicitly.",
      },
      {
        t: "code",
        title: "Reading the current context",
        code: `suspend fun work() {
    val job = coroutineContext[Job]              // the current Job
    ensureActive()                                // throws if cancelled (uses context)
    coroutineContext.isActive                     // convenience for the current Job's state
    val name = coroutineContext[CoroutineName]    // if set
}`,
      },
      {
        t: "list",
        items: [
          "**`coroutineContext`** — the ambient context available in suspend scope; indexed by element keys.",
          "**Common reads** — `[Job]`, `[CoroutineDispatcher]`, `[CoroutineName]`, `[CoroutineExceptionHandler]`.",
          "**`ensureActive()` / `isActive`** — use it for cooperative cancellation in loops.",
          "**Inherited** — child coroutines inherit the parent's context (with overrides), which is how dispatcher/Job propagate.",
        ],
      },
      {
        t: "note",
        text: "coroutineContext is the ambient context (Job, dispatcher, name, handler) readable inside any suspend function — coroutineContext[Job], isActive, ensureActive() for cancellation checks. Children inherit it (with overrides), which is how dispatcher and Job propagate down the tree.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between Job.join() and Deferred.await()?",
    a: [
      {
        t: "p",
        text: "Both suspend until a coroutine finishes, but `join()` (on a `Job` from `launch`) just *waits* — it returns `Unit` and doesn't give a result or rethrow the exception into your code the same way; `await()` (on a `Deferred` from `async`) waits *and returns the value*, rethrowing any exception the coroutine threw.",
      },
      {
        t: "list",
        items: [
          "**`join()`** — waits for completion; returns `Unit`. A failure in a `launch` coroutine propagates to its parent (not rethrown by `join`).",
          "**`await()`** — waits and returns `T`; rethrows the coroutine's exception at the `await` call site.",
          "**Choosing** — use `launch` + `join` when you only need to wait; `async` + `await` when you need the result.",
          "**Both are cancellable suspends** — cancelling the caller cancels the wait.",
        ],
      },
      {
        t: "code",
        title: "join vs await",
        code: `val job = launch { doWork() }
job.join()                       // just wait, no result

val deferred = async { compute() }
val result = deferred.await()    // wait AND get the value (rethrows on failure)`,
      },
      {
        t: "note",
        text: "join() (Job/launch) waits for completion, returns Unit, and a launch failure propagates to the parent. await() (Deferred/async) waits AND returns the value, rethrowing the coroutine's exception at the call site. Use launch+join to just wait; async+await when you need the result.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do coroutines improve on AsyncTask and Thread+Handler?",
    a: [
      {
        t: "p",
        text: "The old async patterns — `AsyncTask`, `Thread` + `Handler`, `ExecutorService` — were verbose, leak-prone, and awkward to cancel or compose. `AsyncTask` is deprecated for exactly these reasons. Coroutines replace them with concise sequential code, structured cancellation tied to lifecycle, easy thread switching, and composability.",
      },
      {
        t: "list",
        items: [
          "**Less boilerplate** — no `doInBackground`/`onPostExecute` ceremony; just suspend functions.",
          "**Lifecycle-safe cancellation** — `viewModelScope`/`lifecycleScope` cancel automatically; `AsyncTask` famously leaked the Activity.",
          "**Easy threading** — `withContext(IO)` vs juggling a `Handler` and background thread.",
          "**Composability** — chain and combine suspend functions; `AsyncTask` didn't compose.",
          "**Result + error handling** — normal return values and `try/catch` vs callback plumbing.",
        ],
      },
      {
        t: "note",
        text: "Coroutines replace AsyncTask (deprecated) and Thread+Handler with concise sequential code, lifecycle-bound automatic cancellation (no Activity leaks), easy thread switching via withContext, composability, and normal return/try-catch error handling — eliminating the boilerplate and leak-prone plumbing of the old patterns.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does a suspended coroutine free its thread, conceptually?",
    a: [
      {
        t: "p",
        text: "When a coroutine hits a suspension point and actually suspends (e.g. waiting on I/O or a `delay`), the compiler-generated state machine *saves its progress* (local variables and the resume position) into a continuation object and *returns* the thread to the dispatcher's pool. The thread is now free to run other coroutines. When the awaited event completes, the continuation is dispatched to resume — possibly on a different thread.",
      },
      {
        t: "list",
        items: [
          "**Suspend = save & return** — state is captured in a continuation; the thread is released, not blocked.",
          "**No blocked thread** — unlike `Thread.sleep`, a suspended coroutine holds no thread, so the pool serves many coroutines.",
          "**Resume = re-dispatch** — when ready, the continuation is scheduled onto a dispatcher thread to continue from the saved point.",
          "**This is why coroutines scale** — thousands can 'wait' concurrently on a handful of threads.",
        ],
      },
      {
        t: "note",
        text: "On suspension, the state machine saves the coroutine's locals + resume position into a continuation and returns the thread to the pool (freed, not blocked) — so other coroutines run on it. When the awaited event fires, the continuation is re-dispatched to resume (maybe on another thread). That's why thousands can wait on a few threads.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you structure a repository suspend function that does I/O?",
    a: [
      {
        t: "p",
        text: "A well-structured repository function is a *main-safe* suspend function: it declares `suspend`, moves blocking work to an injected `IO` dispatcher (unless the underlying library is already main-safe), returns a domain result, and lets exceptions propagate (or wraps them in a `Result`). The caller (ViewModel) just launches it from `viewModelScope`.",
      },
      {
        t: "code",
        title: "A clean repository function",
        code: `class UserRepository(
    private val api: Api,
    private val dao: UserDao,
    private val io: CoroutineDispatcher = Dispatchers.IO,
) {
    suspend fun refreshUser(id: String): User = withContext(io) {
        val user = api.getUser(id)   // Retrofit suspend fn is already main-safe; withContext for any extra blocking work
        dao.insert(user)             // Room suspend fn
        user
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`suspend` + main-safe** — internally handle threading so the ViewModel needn't.",
          "**Inject the dispatcher** — a constructor default of `Dispatchers.IO`, overridable in tests with a test dispatcher.",
          "**Don't double-wrap** — Retrofit/Room suspend functions already switch threads; `withContext(io)` is for your own blocking code.",
          "**Return domain types / `Result`** — map data-layer models to domain, and decide errors-as-exceptions vs errors-as-values at this boundary.",
        ],
      },
      {
        t: "note",
        text: "Repository function = main-safe suspend fun with an injected IO dispatcher (default Dispatchers.IO, swappable in tests), returning domain types (or Result). Use withContext(io) for your own blocking code, but don't double-wrap already-main-safe Retrofit/Room suspend calls. The ViewModel just launches it from viewModelScope.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are structured concurrency's guarantees at a glance, and why do they matter for basics?",
    a: [
      {
        t: "p",
        text: "Structured concurrency means every coroutine has a parent scope, and the scope doesn't complete until all its children do — and cancelling the scope cancels all children. Even as a 'basics' concept it's transformative: it makes coroutines *leak-free by construction* (no orphaned background work) and gives predictable cancellation and error propagation.",
      },
      {
        t: "list",
        items: [
          "**Parent waits for children** — a `coroutineScope { }` returns only after all launched children finish.",
          "**Cancellation cascades** — cancelling the parent cancels every child.",
          "**Errors propagate** — a child failure cancels siblings and surfaces to the parent (unless a `SupervisorJob` isolates them).",
          "**No leaks** — you can't accidentally start work that outlives its scope, unlike `GlobalScope`/raw threads.",
          "**Why it matters early** — it changes how you think: coroutines are owned by scopes, not free-floating, so lifecycle-bound scopes (`viewModelScope`) automatically clean up.",
        ],
      },
      {
        t: "note",
        text: "Structured concurrency: every coroutine has a parent scope that won't complete until its children do, cancelling the scope cancels all children, and child errors propagate up. Result: leak-free-by-construction, predictable cancellation and error handling. It's why lifecycle scopes (viewModelScope) auto-clean-up — coroutines are owned, not free-floating.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between launch/async and just calling a suspend function directly?",
    a: [
      {
        t: "p",
        text: "Calling a suspend function directly runs it *sequentially* — your code waits for it before continuing. `launch`/`async` *start a new coroutine* that runs concurrently with the code after it. So the difference is concurrency: a direct call is 'do this now and wait'; a builder is 'start this alongside'.",
      },
      {
        t: "code",
        title: "Sequential vs concurrent",
        code: `suspend fun example() = coroutineScope {
    // Sequential: b starts only after a finishes
    val a = fetchA(); val b = fetchB()          // ~ timeA + timeB

    // Concurrent: both start immediately
    val da = async { fetchA() }; val db = async { fetchB() }
    val total = da.await() + db.await()          // ~ max(timeA, timeB)
}`,
      },
      {
        t: "list",
        items: [
          "**Direct suspend call** — sequential; the caller suspends until it returns. Simplest, and correct when you genuinely need the result before proceeding.",
          "**`launch`** — starts concurrent fire-and-forget work; the caller continues immediately.",
          "**`async`** — starts concurrent work with a result; combine several for parallelism.",
          "**Don't over-parallelize** — sequential is the safe default; reach for `async` only when calls are independent.",
        ],
      },
      {
        t: "note",
        text: "A direct suspend call is sequential (wait for it, then continue). launch/async start a new coroutine that runs concurrently. Use direct calls when you need the result next; use async for independent work you want in parallel (start both, then await). Sequential is the safe default.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is CoroutineStart, and when would you use LAZY or ATOMIC?",
    a: [
      {
        t: "p",
        text: "The `start` parameter of `launch`/`async` controls *when and how* the coroutine begins. `DEFAULT` starts it immediately (scheduled to run). `LAZY` creates it but doesn't start until you call `start()`/`join()`/`await()`. `ATOMIC` and `UNDISPATCHED` are advanced modes affecting cancellation timing and initial dispatch.",
      },
      {
        t: "code",
        title: "Lazy start",
        code: `val job = scope.launch(start = CoroutineStart.LAZY) { expensiveWork() }
// ... not running yet ...
if (needed) job.start()   // begins only now

val d = async(start = CoroutineStart.LAZY) { compute() }
val result = d.await()    // starts on first await`,
      },
      {
        t: "list",
        items: [
          "**`DEFAULT`** — start immediately (the usual choice).",
          "**`LAZY`** — defer until `start()`/`await()`/`join()`; useful to prepare a coroutine you may or may not need, or to set up a dependency graph before running.",
          "**`ATOMIC`** — starts non-cancellably up to the first suspension point (rarely needed; guarantees the coroutine begins even if cancelled immediately).",
          "**`UNDISPATCHED`** — runs immediately on the current thread until the first suspension point (advanced; avoids an initial dispatch).",
        ],
      },
      {
        t: "note",
        text: "CoroutineStart controls startup: DEFAULT (start now — usual), LAZY (start on start()/await()/join() — prepare-but-maybe-not-run), ATOMIC (begins non-cancellably to the first suspension point), UNDISPATCHED (runs on the current thread until first suspension). You'll mostly use DEFAULT and occasionally LAZY.",
      },
    ],
  },
];

export default qa;
