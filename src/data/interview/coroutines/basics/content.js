// Coroutine Basics & Suspend Functions — Content tab. Teaching-first.

const content = [
  {
    heading: "What a coroutine is — a suspendable computation",
    blocks: [
      {
        t: "p",
        text: "A **coroutine** is a computation that can be **suspended and resumed** without blocking a thread. That's the whole idea. A normal blocking call (like a synchronous network request) *occupies* its thread while waiting — the thread sits idle, unusable, until the result arrives. A coroutine that hits a suspension point instead **releases the thread** while it waits, letting that thread do other work, and resumes later (possibly on a different thread) when the result is ready. You get asynchronous, non-blocking code that *reads* like sequential, blocking code.",
      },
      {
        t: "code",
        title: "Sequential-looking async code",
        code: `suspend fun loadProfile(id: String): Profile {
    val user = api.getUser(id)          // suspends (doesn't block) until response
    val posts = api.getPosts(id)         // suspends until response
    return Profile(user, posts)          // reads top-to-bottom like blocking code
}`,
      },
      {
        t: "list",
        items: [
          "**Not threads**: a coroutine is much lighter than a thread. Threads are OS resources (each costs ~1MB of stack and kernel scheduling); you can run *millions* of coroutines on a handful of threads because a suspended coroutine consumes almost no resources — it's just an object holding its state.",
          "**The payoff on Android**: the main thread must never block (or the UI freezes / ANR). Coroutines let you write `val data = repository.load()` on the main thread — it *suspends* while loading (freeing the main thread to render) and resumes with the result, no callbacks, no blocking.",
          "**Replaces callback hell and RxJava** for most async work: nested callbacks and complex Rx chains become flat, sequential suspend functions.",
        ],
      },
    ],
  },
  {
    heading: "Suspend functions — the building block",
    blocks: [
      {
        t: "p",
        text: "A function marked **`suspend`** is one that *can suspend*: it may pause its coroutine at a suspension point and resume later. The keyword is a **compiler contract** — a suspend function can only be called from another suspend function or from within a coroutine. That's because suspension requires machinery the compiler injects (below), which only exists inside a coroutine.",
      },
      {
        t: "list",
        items: [
          "**`suspend` doesn't mean 'runs on a background thread'** — this is the #1 misconception. A suspend function runs on whatever thread its caller's coroutine is on; it just has the *ability* to suspend. Making it main-safe (moving work off the main thread) is a separate concern handled by dispatchers/`withContext`.",
          "**Suspension points** are calls to other suspend functions — `delay()`, `withContext()`, a Retrofit suspend call, `Mutex.lock()`. Between them, code runs normally; *at* them, the coroutine may suspend.",
          "**Calling rule**: `suspend fun` → callable only from a coroutine or another `suspend fun`. To start one from normal code, you launch a coroutine (`scope.launch { }`). This mirrors `@Composable` (callable only from composables) — same 'hidden compiler parameter' idea.",
        ],
      },
      {
        t: "note",
        text: "Interview trap: \"Does marking a function `suspend` move it off the main thread?\" **No.** It only gives it the *ability to suspend*; it runs on the caller's thread. Thread-switching is done with dispatchers (`withContext(Dispatchers.IO)`). Getting this right immediately signals real understanding.",
      },
    ],
  },
  {
    heading: "How suspension actually works — Continuation Passing Style",
    blocks: [
      {
        t: "p",
        text: "Under the hood, the compiler transforms every suspend function using **Continuation Passing Style (CPS)** and a **state machine**. This is what interviewers mean by 'how do coroutines work internally':",
      },
      {
        t: "list",
        items: [
          "**Hidden `Continuation` parameter**: the compiler adds an extra parameter to every suspend function — a `Continuation<T>`, essentially a callback representing 'the rest of the computation after this point'. `suspend fun foo(): T` becomes `fun foo(cont: Continuation<T>): Any?`. Calling `cont.resumeWith(result)` continues where the function left off.",
          "**State machine**: the compiler splits the function body at each suspension point into states (like a `switch`), and generates a class that tracks which state to resume into plus the local variables needed. Each resume enters the `switch` at the right label. This is why a suspend function can 'pause' and 'continue' — it's really a state machine driven by continuation callbacks.",
          "**Suspend or return**: at a suspension point, the callee either returns a value immediately (no suspension needed) or returns a special marker `COROUTINE_SUSPENDED`, signaling the coroutine to suspend. When the awaited result is ready, the continuation is resumed, re-entering the state machine at the saved label.",
          "**So 'suspension' = saving state + returning + resuming later via a callback** — no thread is blocked in between; the thread is free to run other coroutines.",
        ],
      },
      {
        t: "code",
        title: "Roughly what the compiler generates (simplified)",
        code: `// Your code:
suspend fun load(): Data {
    val a = fetchA()   // suspension point 1
    val b = fetchB(a)  // suspension point 2
    return combine(a, b)
}

// Compiler produces (conceptually) a state machine:
// state 0 -> call fetchA(continuation); may suspend, resume into state 1
// state 1 -> have 'a'; call fetchB(a, continuation); resume into state 2
// state 2 -> have 'b'; return combine(a, b) via continuation.resumeWith(...)`,
      },
    ],
  },
  {
    heading: "suspend vs blocking — the crucial difference",
    blocks: [
      {
        t: "table",
        headers: ["", "Blocking (e.g. Thread.sleep)", "Suspending (e.g. delay)"],
        rows: [
          ["Holds the thread while waiting", "yes — thread unusable", "no — thread freed for other work"],
          ["Cost of many concurrent waits", "one thread each (expensive)", "cheap — thread shared across coroutines"],
          ["On the main thread", "freezes UI / ANR", "safe — main thread keeps rendering"],
          ["How it waits", "OS blocks the thread", "saves state, returns, resumes via callback"],
        ],
      },
      {
        t: "p",
        text: "`delay(1000)` and `Thread.sleep(1000)` both 'wait a second', but `delay` **suspends** (frees the thread — a thousand coroutines can `delay` on one thread) while `Thread.sleep` **blocks** (occupies the thread — a thousand sleeping tasks need consideration of a thousand threads). This is why coroutines scale so well: waiting is nearly free.",
      },
    ],
  },
  {
    heading: "Sequential by default; concurrency is explicit",
    blocks: [
      {
        t: "p",
        text: "Inside a coroutine, suspend function calls run **sequentially** — one completes before the next starts, just like normal code. Concurrency is opt-in, which keeps code predictable.",
      },
      {
        t: "code",
        title: "Sequential vs concurrent",
        code: `// SEQUENTIAL — total time = A + B
suspend fun sequential(): Result {
    val a = fetchA()   // wait for A
    val b = fetchB()   // then wait for B
    return Result(a, b)
}

// CONCURRENT — total time = max(A, B) — start both, then await
suspend fun concurrent(): Result = coroutineScope {
    val a = async { fetchA() }   // starts immediately
    val b = async { fetchB() }   // starts immediately
    Result(a.await(), b.await()) // await both
}`,
      },
      {
        t: "list",
        items: [
          "**Default = sequential**: `val a = fetchA(); val b = fetchB()` waits for A, then B. Simple and correct when B depends on A.",
          "**Explicit concurrency with `async`**: when A and B are independent, `async { }` starts each immediately and `await()` collects results — total time becomes the *slower* of the two, not their sum.",
          "The design philosophy: sequential is the safe default (no accidental races), and you *opt into* concurrency where it helps — the opposite of thread-based code where concurrency is the error-prone default.",
        ],
      },
    ],
  },
];

export default content;
