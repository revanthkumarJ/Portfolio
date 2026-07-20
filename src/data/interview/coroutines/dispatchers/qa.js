// Dispatchers & Context — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What are the main coroutine dispatchers and what is each for?",
    a: [
      {
        t: "list",
        items: [
          "**`Dispatchers.Main`** — the Android main/UI thread. For updating UI, calling ViewModel functions, and light work. UI can only be touched here.",
          "**`Dispatchers.IO`** — a large elastic thread pool (64+ threads) for *blocking I/O*: network requests, disk reads/writes, database queries. These operations spend their time *waiting*, so a big pool lets many block cheaply at once.",
          "**`Dispatchers.Default`** — a pool sized to the number of CPU cores, for *CPU-intensive* work: parsing large JSON, sorting big lists, image processing, computations. These keep a core busy, so more threads than cores wouldn't help.",
          "**`Dispatchers.Unconfined`** — starts in the calling thread and isn't confined to any specific thread after suspension. Rarely used in app code; mostly advanced scenarios and some testing.",
        ],
      },
      {
        t: "p",
        text: "The everyday split is Main / IO / Default. The key judgment is IO vs Default: IO for things that *wait* (network, disk), Default for things that *compute* (parsing, sorting). You switch to the right one with `withContext(dispatcher) { }` around the relevant work.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between Dispatchers.IO and Dispatchers.Default?",
    a: [
      {
        t: "p",
        text: "**The distinction is blocking-and-waiting vs CPU-bound work, and it's reflected in the pool sizes.** `Dispatchers.IO` is for operations that spend most of their time *waiting* on something external — a network response, a disk read, a database query. Because a waiting thread isn't using the CPU, you can afford *many* of them, so IO's pool is large (64+ threads by default). `Dispatchers.Default` is for work that *keeps the CPU busy* — parsing, sorting, computation. Here more threads than CPU cores would just cause context-switching overhead without speedup, so Default's pool is sized to the core count.",
      },
      {
        t: "list",
        items: [
          "**Using the wrong one has real costs**: run CPU-heavy work on `IO` and you can spawn dozens of CPU-bound threads competing for a few cores (thrashing). Run blocking IO on `Default` and a handful of blocked threads exhaust the small pool, starving other CPU work.",
          "**Rule of thumb**: 'Does this operation mostly *wait* or mostly *compute*?' Wait → IO. Compute → Default.",
          "**Implementation detail**: IO and Default actually share an underlying thread pool, and switching between them may not physically change threads — but the semantics (how many concurrent tasks each permits) still matter, so choose by the nature of the work.",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "What does withContext do?",
    a: [
      {
        t: "p",
        text: "**The concept**: `withContext(dispatcher) { }` runs its block on the specified dispatcher, *suspends* until the block finishes, returns the block's result, and then continues on the original context. It's the standard way to move a piece of work to the appropriate thread within a suspend function — without launching a separate coroutine.",
      },
      {
        t: "code",
        title: "Moving blocking work off the main thread",
        code: `suspend fun loadData(): Data = withContext(Dispatchers.IO) {
    val json = file.readText()   // blocking IO on an IO thread
    parse(json)                   // returns the result
}
// A caller on Main can call this; it hops to IO and back automatically.`,
      },
      {
        t: "p",
        text: "It's how you make a suspend function *main-safe* — safe to call from the main thread because it internally switches to the right dispatcher for its heavy work. Unlike `launch`/`async`, `withContext` is *sequential* — it doesn't start concurrent work, it just switches threads for a block and gives you the result. So use `withContext` for 'run this part elsewhere and give me the answer', and `async` for 'run these things in parallel'.",
      },
    ],
  },
  {
    level: "junior",
    q: "Where should you call withContext(Dispatchers.IO) — in the ViewModel or the repository?",
    a: [
      {
        t: "p",
        text: "**In the repository (or wherever the blocking work actually happens), not the ViewModel.** The principle is *main-safety owned by the layer doing the work*: the function that performs blocking IO wraps *itself* in `withContext(IO)`, so that every caller — including a ViewModel on the main thread — can call it safely without thinking about threads.",
      },
      {
        t: "list",
        items: [
          "**Why not the ViewModel**: if ViewModels wrap every repository call in `withContext(IO)` 'to be safe', threading policy gets scattered across the whole app, it's easy to forget one, and it hides which layer actually blocks. Centralizing it in the data layer means one correct place per operation.",
          "**The ViewModel just launches**: `viewModelScope.launch { val data = repository.load() }` — no dispatcher juggling, because `repository.load()` is main-safe.",
          "**Don't double-wrap main-safe calls**: Retrofit and Room suspend functions already switch threads internally, so wrapping *those* in `withContext(IO)` is redundant. You add `withContext` for *your own* blocking code (a manual file read, a heavy parse), not for libraries that are already main-safe.",
        ],
      },
      {
        t: "p",
        text: "So the clean architecture: repositories/use-cases are main-safe (own their `withContext`), the ViewModel calls them from `viewModelScope` (Main) freely, and the UI stays responsive. This keeps threading decisions in one predictable place.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a CoroutineContext, and how is it inherited by child coroutines?",
    a: [
      {
        t: "p",
        text: "**The concept**: a `CoroutineContext` is the set of elements defining how a coroutine runs — it's an indexed collection (like a typed map) of elements combined with the `+` operator. The main elements are the **`Job`** (lifecycle and tree position), the **`CoroutineDispatcher`** (threading), an optional **`CoroutineExceptionHandler`**, and a **`CoroutineName`** (debugging). You retrieve elements by key: `coroutineContext[Job]`, `coroutineContext[CoroutineDispatcher]`.",
      },
      {
        t: "list",
        items: [
          "**Inheritance with override**: a child coroutine's context is computed as *parent context + whatever you pass to the builder*. So `launch(Dispatchers.IO)` takes the parent's context and overrides just the dispatcher — the child keeps the parent's other elements (name, handler) unless you also override them. This is why children run on the parent's dispatcher by default.",
          "**The Job is special**: a child does NOT inherit the parent's Job as its own — it always gets a *new Job that is a child of* the parent's Job. That's the mechanism that builds the structured-concurrency tree. Every other element is inherited by value; the Job is always freshly parented.",
          "**Combining**: `SupervisorJob() + Dispatchers.Main + CoroutineName(\"x\")` builds a context; later elements of the same key win (`Dispatchers.IO + Dispatchers.Main` yields Main).",
          "**`withContext(element)`** temporarily overrides context elements for its block (commonly the dispatcher) and restores them after — a scoped, sequential context change.",
        ],
      },
      {
        t: "p",
        text: "**Why this matters**: understanding context inheritance explains real behavior — why a coroutine launched in a Main scope runs on Main (inherited dispatcher), why a launched child's failure reaches the parent (new child Job under the parent Job), and how to override just one aspect (pass one element to the builder). It's the unifying model beneath dispatchers, Jobs, and exception handlers — they're all just context elements.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why should you inject dispatchers rather than hardcode Dispatchers.IO, and how does it help testing?",
    a: [
      {
        t: "p",
        text: "**Because hardcoded dispatchers make coroutine code non-deterministic and slow to test.** If a repository hardcodes `withContext(Dispatchers.IO)`, that work runs on real background threads during tests — outside the test's control. The test can't make it deterministic, can't fast-forward `delay`s, and may get flaky timing. Injecting the dispatcher lets the test substitute a `TestDispatcher` that runs on the test's scheduler with *virtual time*.",
      },
      {
        t: "code",
        title: "Injected dispatcher enables test control",
        code: `class UserRepository(
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO,  // injected
) {
    suspend fun load() = withContext(ioDispatcher) { /* work */ }
}

// In tests:
val testDispatcher = StandardTestDispatcher()
val repo = UserRepository(ioDispatcher = testDispatcher)   // controllable
// runTest can now advance virtual time, run deterministically`,
      },
      {
        t: "list",
        items: [
          "**Virtual time**: a `TestDispatcher` runs inside `runTest`, where `delay(1000)` completes instantly by advancing a fake clock. Hardcoded `Dispatchers.IO` escapes that — a `delay` there really waits, making tests slow. Injecting lets tests of debounce/retry/timeout run in milliseconds.",
          "**Determinism**: `StandardTestDispatcher` queues coroutines so you control execution order with `advanceUntilIdle()`/`runCurrent()` and can assert intermediate states (like a `Loading` before `Content`). Real dispatchers give you races.",
          "**Common pattern**: inject a `CoroutineDispatcher` (or a small `DispatcherProvider` interface bundling Main/IO/Default) as a constructor default `= Dispatchers.IO`, so production uses the real one and tests inject the test one. Zero production cost, full test control.",
          "**Also improves flexibility**: you can swap dispatchers per environment or tune them without touching call sites.",
        ],
      },
      {
        t: "p",
        text: "**The principle**: a hardcoded dispatcher is a hidden dependency on real threads and real time. Injecting it makes threading an explicit, substitutable dependency — the same reason you inject a repository instead of `new`-ing one. It's a small habit that makes the difference between testable and untestable coroutine code.",
      },
    ],
  },
  {
    level: "senior",
    q: "When would you create a custom dispatcher, and what must you be careful about?",
    a: [
      {
        t: "p",
        text: "**The standard dispatchers cover almost everything, so custom dispatchers are for specific needs — most commonly *confining work to a specific thread or a bounded set of threads*.** The classic case: serializing access to a resource that isn't thread-safe. A single-threaded dispatcher guarantees all operations on that resource happen on one thread, in order — a lock-free way to prevent concurrent access.",
      },
      {
        t: "list",
        items: [
          "**`newSingleThreadContext(\"name\")`** — a dispatcher backed by one dedicated thread. Use to serialize access to a non-thread-safe library, a legacy single-threaded native component, or to guarantee ordering. It replaces manual synchronization with confinement.",
          "**`newFixedThreadPoolContext(n, \"name\")`** — a fixed pool of `n` threads, for when you need a bounded, isolated pool separate from IO/Default (e.g. to cap concurrency to a specific external system).",
          "**`Executor.asCoroutineDispatcher()`** — wrap an existing Java `Executor` (a thread pool you already manage, or one with special properties) as a coroutine dispatcher. Common when integrating with existing threading infrastructure.",
          "**`Dispatchers.IO.limitedParallelism(n)`** — a modern, lighter alternative: get a *view* of the IO pool limited to `n` concurrent coroutines, without creating new threads. Good for capping parallelism to a rate-limited API while reusing the shared pool.",
        ],
      },
      {
        t: "list",
        items: [
          "**The big caution — they hold real threads**: `newSingleThreadContext`/`newFixedThreadPoolContext` create actual OS threads that are NOT automatically released. You must `close()` them when done (or scope them to something), or you leak threads. This is why `limitedParallelism` is often preferred — it doesn't create threads.",
          "**Don't create dispatchers per-call**: creating a `newSingleThreadContext` inside a frequently-called function leaks a thread every time. Create once, reuse, close on teardown.",
          "**Prefer the standard dispatchers unless you have a concrete confinement/isolation need** — custom dispatchers add resource management burden for benefits most code doesn't need.",
        ],
      },
    ],
  },
];

export default qa;
