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
];

export default qa;
