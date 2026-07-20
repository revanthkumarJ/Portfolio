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
  {
    level: "junior",
    q: "What is Dispatchers.Main, and what does Main.immediate add?",
    a: [
      {
        t: "p",
        text: "`Dispatchers.Main` runs coroutines on the platform's main/UI thread — the only thread allowed to touch UI. `Dispatchers.Main.immediate` is an optimization: if you're *already* on the main thread, it executes the continuation *immediately* instead of scheduling it to run later on the message queue, avoiding an unnecessary re-dispatch (and a possible frame's delay).",
      },
      {
        t: "code",
        title: "Main vs Main.immediate",
        code: `// viewModelScope uses Main.immediate by default
viewModelScope.launch {            // starts on Main.immediate
    _state.value = Loading         // runs immediately (already on Main), no re-post
    val data = repo.load()         // main-safe suspend call
    _state.value = Content(data)   // back on Main
}`,
      },
      {
        t: "list",
        items: [
          "**`Main`** — the UI thread; required for UI/state updates.",
          "**`Main.immediate`** — skips re-dispatch when already on Main; used by `viewModelScope`/`lifecycleScope`.",
          "**Why it matters** — without `immediate`, a state update could be posted to run on a later loop iteration, causing a needless delay/flicker.",
          "**Still offload heavy work** — Main means UI thread; move I/O/CPU to `IO`/`Default`.",
        ],
      },
      {
        t: "note",
        text: "Dispatchers.Main = the UI thread (only thread that can touch UI). Main.immediate runs the continuation right away if already on Main instead of re-posting to the message queue (avoids a needless delay/frame). viewModelScope/lifecycleScope default to Main.immediate; still offload heavy work to IO/Default.",
      },
    ],
  },
  {
    level: "senior",
    q: "How many threads does Dispatchers.Default have, and what is it for?",
    a: [
      {
        t: "p",
        text: "`Dispatchers.Default` is for *CPU-bound* work — sorting, parsing, image processing, JSON work, complex calculations. Its thread pool size equals the number of CPU cores (at least 2), because running more CPU-bound threads than cores just causes context-switching overhead without more throughput.",
      },
      {
        t: "list",
        items: [
          "**Sized to CPU cores** — `max(2, numberOfCores)` threads; matching cores maximizes CPU throughput for compute work.",
          "**For CPU-bound work** — computation that keeps a thread busy (not waiting).",
          "**Don't do blocking I/O on it** — a blocked thread ties up a scarce core-count thread, starving other CPU work; use `IO` for that.",
          "**Default for `Default`** — it's the fallback dispatcher when none is specified in `GlobalScope`/`launch` without a context in some cases.",
        ],
      },
      {
        t: "code",
        title: "CPU work on Default",
        code: `val result = withContext(Dispatchers.Default) {
    hugeList.sortedBy { it.score }.map { transform(it) }   // CPU-bound
}`,
      },
      {
        t: "note",
        text: "Dispatchers.Default is for CPU-bound work (sorting/parsing/image/JSON/calculations); its pool = max(2, CPU cores), since more CPU threads than cores just adds context-switch overhead. Don't do blocking I/O on it — a blocked thread wastes a scarce core-sized slot; use IO for waiting work.",
      },
    ],
  },
  {
    level: "senior",
    q: "How many threads does Dispatchers.IO have, and why so many?",
    a: [
      {
        t: "p",
        text: "`Dispatchers.IO` is for *I/O-bound* work — network calls, disk/database reads, file operations — where threads spend most time *waiting*. It has a much larger pool (default 64 threads, or more if there are more cores) because I/O threads are mostly idle-waiting, so you want many of them to run many concurrent I/O operations without one blocking the next.",
      },
      {
        t: "list",
        items: [
          "**~64 threads by default** — `max(64, cores)`; sized for concurrency, not CPU throughput.",
          "**For blocking/waiting I/O** — network, disk, DB; the thread blocks waiting for the OS, so many threads let many I/O ops proceed.",
          "**Shares a pool with `Default`** — `IO` and `Default` draw from the same underlying threads; switching between them may not change the actual thread, just the parallelism limit.",
          "**Don't overload with CPU work** — 64 CPU-bound threads on a few cores thrash; keep CPU work on `Default`.",
        ],
      },
      {
        t: "note",
        text: "Dispatchers.IO is for I/O-bound work (network/disk/DB) where threads mostly wait, so it has ~64 threads (max(64, cores)) to run many concurrent blocking ops. It shares an underlying pool with Default (switching may not change the physical thread). Don't run CPU-bound work on it — that thrashes the cores.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is limitedParallelism, and when do you use it?",
    a: [
      {
        t: "p",
        text: "`dispatcher.limitedParallelism(n)` creates a *view* of a dispatcher that allows at most `n` coroutines to run concurrently on it — without creating a new thread pool. It's the modern way to cap concurrency for a resource (e.g. a server that allows only 4 simultaneous requests, or serializing DB writes) while still sharing the shared IO/Default threads.",
      },
      {
        t: "code",
        title: "Capping concurrency",
        code: `class Api {
    private val dispatcher = Dispatchers.IO.limitedParallelism(4)   // max 4 concurrent
    suspend fun call() = withContext(dispatcher) { network() }      // never more than 4 at once
}
// Serialize writes:
val writeDispatcher = Dispatchers.IO.limitedParallelism(1)          // single-writer`,
      },
      {
        t: "list",
        items: [
          "**Caps concurrency** — at most `n` coroutines run at once on the view; excess are queued.",
          "**No new pool** — it reuses the parent dispatcher's threads, avoiding the cost of a dedicated thread pool.",
          "**Uses** — rate-limiting an API, bounding parallel downloads, serializing writes (`n = 1` for single-thread-like confinement without a dedicated thread).",
          "**Replaces `newFixedThreadPoolContext`** for most bounding needs (cheaper, no separate threads to close).",
        ],
      },
      {
        t: "note",
        text: "dispatcher.limitedParallelism(n) makes a view of a dispatcher capping concurrent coroutines at n, reusing the parent's shared threads (no new pool). Use it to rate-limit an API, bound parallel downloads, or serialize writes (n=1). It's the modern, cheaper alternative to a dedicated newFixedThreadPoolContext.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Dispatchers.Unconfined, and why is it rarely used?",
    a: [
      {
        t: "p",
        text: "`Dispatchers.Unconfined` starts a coroutine on the *current* thread and, after a suspension point, resumes on whatever thread the resuming code runs on — it isn't confined to any particular thread or pool. It's an advanced/rare tool; in app code you almost never want it because you can't predict which thread you'll be on, which is dangerous for UI and thread-unsafe state.",
      },
      {
        t: "list",
        items: [
          "**Runs on the caller's thread initially** — then resumes wherever the continuation is invoked.",
          "**Unpredictable threading** — after suspension you could be on any thread; unsafe for UI/shared state.",
          "**Rare legit uses** — certain unit tests, or operators that must run synchronously up to the first suspension; not for production business logic.",
          "**Prefer explicit dispatchers** — `Main`/`IO`/`Default` give predictable, correct threading.",
        ],
      },
      {
        t: "note",
        text: "Dispatchers.Unconfined runs on the current thread and, after suspension, resumes on whatever thread resumes it — not confined to a pool. Unpredictable threading makes it unsafe for UI/shared state, so it's rarely used (some tests/synchronous-until-first-suspension cases). Prefer explicit Main/IO/Default.",
      },
    ],
  },
  {
    level: "senior",
    q: "What happens if you do blocking I/O on Dispatchers.Default (or CPU work on IO)?",
    a: [
      {
        t: "p",
        text: "Using the wrong dispatcher degrades performance. Blocking I/O on `Default` ties up one of its few core-sized threads while it waits, starving other CPU work and potentially deadlocking under load. Heavy CPU work on `IO` spins up to 64 threads all fighting for a handful of cores, causing context-switch thrash and no real speedup. Match the dispatcher to the workload.",
      },
      {
        t: "list",
        items: [
          "**Blocking I/O on `Default`** — occupies a scarce (core-count) thread while waiting; few such threads exist, so concurrent I/O quickly exhausts them and stalls CPU work.",
          "**CPU work on `IO`** — up to 64 compute-heavy threads thrash the CPU (more threads than cores = overhead), hurting throughput and battery.",
          "**Rule** — `IO` for waiting (network/disk/DB), `Default` for computing.",
          "**Symptoms** — jank, sluggish parallel work, or in the worst case starvation/deadlock.",
        ],
      },
      {
        t: "note",
        text: "Wrong dispatcher = degraded performance. Blocking I/O on Default ties up its scarce core-sized threads (waiting), starving CPU work and risking starvation. Heavy CPU on IO spawns up to 64 compute threads thrashing a few cores (no speedup, wasted battery). IO for waiting, Default for computing.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you confine shared mutable state to a single thread with a dispatcher?",
    a: [
      {
        t: "p",
        text: "Create a single-threaded dispatcher (or `limitedParallelism(1)`) and run all access to the shared state through it. Because only one coroutine runs at a time on that dispatcher, there are no concurrent modifications — an alternative to `Mutex` for protecting state (thread confinement instead of locking).",
      },
      {
        t: "code",
        title: "Single-thread confinement",
        code: `private val stateDispatcher = Dispatchers.Default.limitedParallelism(1)
private var counter = 0
suspend fun increment() = withContext(stateDispatcher) { counter++ }   // serialized, no race`,
      },
      {
        t: "list",
        items: [
          "**One coroutine at a time** — `limitedParallelism(1)` (or a single-thread dispatcher) serializes access, preventing data races.",
          "**vs `Mutex`** — confinement moves work to one thread; `Mutex` locks around a critical section on any thread. Both prevent races; pick per situation.",
          "**Coarse vs fine** — confining *all* access is simple but serializes everything; a `Mutex` can be more granular.",
          "**Legacy** — `newSingleThreadContext` also works but creates a dedicated thread you must close; `limitedParallelism(1)` is cheaper.",
        ],
      },
      {
        t: "note",
        text: "Route all access to shared mutable state through a single-threaded dispatcher (Dispatchers.X.limitedParallelism(1)) so only one coroutine touches it at a time — thread confinement instead of a Mutex. Cheaper than newSingleThreadContext (no dedicated thread to close). Mutex is the finer-grained alternative.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you create a custom dispatcher, and what must you be careful about?",
    a: [
      {
        t: "p",
        text: "You can wrap an `ExecutorService` with `asCoroutineDispatcher()`, or use `newFixedThreadPoolContext`/`newSingleThreadContext`. The main cautions: these create *real threads* you must *close* (they don't get cleaned up automatically), too many custom pools waste memory, and you usually don't need one — `IO`/`Default` + `limitedParallelism` cover most cases.",
      },
      {
        t: "code",
        title: "Executor-backed dispatcher",
        code: `val dispatcher = Executors.newFixedThreadPool(4).asCoroutineDispatcher()
try {
    withContext(dispatcher) { work() }
} finally {
    dispatcher.close()   // MUST close — releases the threads
}`,
      },
      {
        t: "list",
        items: [
          "**`asCoroutineDispatcher()`** — adapt any `Executor`/`ExecutorService` (useful to integrate an existing pool).",
          "**Close it** — custom dispatchers hold real threads; forgetting `close()` leaks threads.",
          "**Avoid proliferation** — many small pools waste memory and reduce the benefit of shared pools.",
          "**Prefer `limitedParallelism`** — for bounding concurrency without a dedicated pool.",
          "**When justified** — integrating a third-party executor, or needing strict thread affinity for a non-thread-safe native library.",
        ],
      },
      {
        t: "note",
        text: "Create custom dispatchers via Executor.asCoroutineDispatcher() or newFixed/SingleThreadContext — but they hold real threads you MUST close() (else leaks), and many pools waste memory. Prefer Dispatchers.IO/Default + limitedParallelism. Custom pools are for integrating an existing executor or strict thread affinity (non-thread-safe native libs).",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between withContext(dispatcher) and launch(dispatcher)?",
    a: [
      {
        t: "p",
        text: "`withContext(dispatcher) { }` runs a block on that dispatcher *sequentially*, suspending the caller until it returns a value — it's for switching context for a section of the *current* coroutine. `launch(dispatcher) { }` starts a *new concurrent* coroutine on that dispatcher and returns a `Job` immediately. Use `withContext` to move work; `launch` to run something alongside.",
      },
      {
        t: "code",
        title: "Switch vs start-concurrent",
        code: `// Switch this coroutine to IO for a value, then continue:
val data = withContext(Dispatchers.IO) { load() }

// Start a separate concurrent coroutine on IO (fire-and-forget):
scope.launch(Dispatchers.IO) { sync() }`,
      },
      {
        t: "list",
        items: [
          "**`withContext`** — sequential, returns a value, same coroutine; the go-to for 'do this part on IO/Default'.",
          "**`launch`** — concurrent, returns a `Job`, new child coroutine.",
          "**Don't `launch` just to switch threads** — if you need the result next, `withContext` is correct and clearer.",
          "**Both cancellable** — tied to the enclosing structure.",
        ],
      },
      {
        t: "note",
        text: "withContext(dispatcher){} switches the CURRENT coroutine to that dispatcher for a block, sequentially, returning a value — use it to move work (load on IO). launch(dispatcher){} starts a NEW concurrent coroutine (returns a Job). Don't launch merely to switch threads when you need the result next — that's withContext.",
      },
    ],
  },
  {
    level: "senior",
    q: "Does withContext add overhead, and when should you avoid switching dispatchers?",
    a: [
      {
        t: "p",
        text: "`withContext` has a small cost: potentially a thread switch (re-dispatch) and coroutine bookkeeping. It's cheap relative to actual I/O, but pointless switches add up. Avoid switching when the work is already on the right dispatcher, when calling already-main-safe functions (Room/Retrofit), or wrapping tiny non-blocking operations.",
      },
      {
        t: "list",
        items: [
          "**Cost** — a possible thread hop and scheduling; negligible next to network/disk, but wasteful if done needlessly per call.",
          "**Don't wrap main-safe functions** — Room/Retrofit suspend functions already switch internally; an extra `withContext(IO)` is redundant.",
          "**Don't switch for trivial work** — wrapping a fast in-memory operation in `withContext(Default)` costs more than it saves.",
          "**Do switch at the boundary** — one `withContext(IO)` around a chunk of blocking work, not per tiny call inside it.",
        ],
      },
      {
        t: "note",
        text: "withContext costs a possible thread hop + bookkeeping — cheap vs real I/O but wasteful if needless. Don't wrap already-main-safe Room/Retrofit calls, don't switch for trivial in-memory work, and switch once at the boundary of a blocking chunk rather than per tiny call inside it.",
      },
    ],
  },
  {
    level: "junior",
    q: "What dispatcher do Room and Retrofit suspend functions use — should you wrap them in withContext(IO)?",
    a: [
      {
        t: "p",
        text: "No — Room and Retrofit `suspend` functions are already *main-safe*: they internally move their blocking work off the main thread (Room uses its own executors/`Dispatchers.IO`; Retrofit's suspend adapter dispatches the call appropriately). Wrapping them in `withContext(Dispatchers.IO)` is redundant and just adds an unnecessary context switch.",
      },
      {
        t: "code",
        title: "No extra wrapping needed",
        code: `// Room suspend DAO — already main-safe:
suspend fun getUser(id: String) = userDao.getUser(id)          // fine from Main
// Retrofit suspend API — already main-safe:
suspend fun fetch() = api.getData()                            // fine from Main
// Only wrap YOUR OWN blocking code:
suspend fun parseBigFile() = withContext(Dispatchers.IO) { blockingParse() }`,
      },
      {
        t: "list",
        items: [
          "**Room suspend DAOs** — main-safe; Room dispatches to its query executor.",
          "**Retrofit suspend endpoints** — main-safe; the call runs off the main thread.",
          "**Wrap only your own blocking code** — file parsing, a blocking SDK, synchronous crypto.",
          "**Blocking (non-suspend) Room/OkHttp calls** — *those* need `withContext(IO)`; the suspend variants don't.",
        ],
      },
      {
        t: "note",
        text: "Room and Retrofit SUSPEND functions are already main-safe (they offload internally) — wrapping them in withContext(IO) is redundant. Only wrap your own blocking code (file parse, blocking SDK). The blocking/non-suspend Room/OkHttp variants DO need withContext(IO); the suspend ones don't.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test coroutine code that uses dispatchers?",
    a: [
      {
        t: "p",
        text: "Inject dispatchers rather than hardcoding them, so tests can pass a `TestDispatcher` that runs on `runTest`'s virtual clock. For the main dispatcher (used by `viewModelScope`), swap it with `Dispatchers.setMain(testDispatcher)` in setup and `resetMain()` in teardown. This makes coroutine scheduling deterministic and fast.",
      },
      {
        t: "code",
        title: "Dispatcher injection + setMain",
        code: `class UserRepo(private val io: CoroutineDispatcher = Dispatchers.IO) { … }

@get:Rule val mainRule = MainDispatcherRule()   // wraps setMain/resetMain

@Test fun loads() = runTest {
    val repo = UserRepo(StandardTestDispatcher(testScheduler))
    val vm = UserViewModel(repo)
    vm.load(); advanceUntilIdle()
    assertEquals(Content(user), vm.state.value)
}`,
      },
      {
        t: "list",
        items: [
          "**Inject dispatchers** — constructor params with production defaults (`Dispatchers.IO`), overridden in tests.",
          "**`Dispatchers.setMain(testDispatcher)`** — replace `Main` so `viewModelScope` runs on the test dispatcher; `resetMain()` after (often via a JUnit rule).",
          "**Share the `testScheduler`** — all test dispatchers use it so `advanceUntilIdle()` drives everything.",
          "**Deterministic + instant** — virtual clock skips real delays; no flakiness from real threading.",
        ],
      },
      {
        t: "note",
        text: "Inject dispatchers (constructor default Dispatchers.IO, override with a TestDispatcher), and swap Main via Dispatchers.setMain(testDispatcher)/resetMain() (a MainDispatcherRule). Share the testScheduler so advanceUntilIdle() drives all coroutines. Result: deterministic, instant tests with no real threading.",
      },
    ],
  },
  {
    level: "junior",
    q: "What thread does a coroutine run on if you don't specify a dispatcher?",
    a: [
      {
        t: "p",
        text: "It *inherits* the dispatcher from its parent scope/coroutine. So a coroutine launched in `viewModelScope` (Main.immediate) runs on Main; one launched inside a `withContext(IO)` block runs on IO. If nothing in the chain sets a dispatcher (rare, e.g. `GlobalScope` without one), it falls back to `Dispatchers.Default`.",
      },
      {
        t: "list",
        items: [
          "**Inheritance** — a child uses the parent context's dispatcher unless overridden.",
          "**`viewModelScope`/`lifecycleScope`** — Main.immediate, so children start on Main.",
          "**Inside `withContext(X)`** — coroutines launched there inherit `X`.",
          "**No dispatcher anywhere** — defaults to `Dispatchers.Default`.",
        ],
      },
      {
        t: "code",
        title: "Inherited dispatcher",
        code: `viewModelScope.launch {            // Main
    launch { }                     // inherits Main
    withContext(Dispatchers.IO) {
        launch { }                 // inherits IO
    }
}`,
      },
      {
        t: "note",
        text: "Without an explicit dispatcher, a coroutine inherits its parent's: viewModelScope children run on Main, coroutines inside withContext(IO) run on IO. If nothing in the chain sets one, it falls back to Dispatchers.Default. Override per-builder by passing a dispatcher.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you switch back to the main thread to update the UI after background work?",
    a: [
      {
        t: "p",
        text: "If you launched from `viewModelScope`/`lifecycleScope` (Main) and used `withContext(IO)` for the background part, you're automatically back on Main after the `withContext` block returns — no manual switch needed. If you're on a background dispatcher and must touch UI, wrap the UI update in `withContext(Dispatchers.Main)`.",
      },
      {
        t: "code",
        title: "Automatic return to Main",
        code: `viewModelScope.launch {                       // Main
    val data = withContext(Dispatchers.IO) { load() }   // background
    _state.value = Content(data)              // back on Main automatically
}
// If already on a background dispatcher:
withContext(Dispatchers.Main) { updateUi() }`,
      },
      {
        t: "list",
        items: [
          "**`withContext` returns to the caller's dispatcher** — code after it resumes on Main (if that's where you launched).",
          "**Prefer this structure** — launch on Main, `withContext(IO)` the heavy part; state updates after are main-safe.",
          "**Explicit switch** — `withContext(Dispatchers.Main) { }` only when you're genuinely on a background dispatcher.",
          "**Compose/StateFlow** — you often just update a `StateFlow` (thread-safe) and let the UI collect on Main.",
        ],
      },
      {
        t: "note",
        text: "Launch on Main (viewModelScope) and withContext(IO) only the heavy part — after that block you're automatically back on Main, so state/UI updates are safe with no manual switch. Use withContext(Dispatchers.Main) explicitly only if you're actually on a background dispatcher. StateFlow updates are thread-safe regardless.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a CoroutineDispatcher conceptually, and how does it relate to CoroutineContext?",
    a: [
      {
        t: "p",
        text: "A `CoroutineDispatcher` is a `CoroutineContext` element that decides *which thread (or pool)* runs a coroutine's continuations. Conceptually it's the bridge between coroutines and threads: when a coroutine is ready to run or resume, the dispatcher schedules that work onto its thread(s). It's one element of the context, alongside the Job, name, and exception handler.",
      },
      {
        t: "list",
        items: [
          "**A context element** — retrievable as `context[CoroutineDispatcher]`; combined with `+`.",
          "**Schedules continuations** — decides the thread for initial start and each resume after a suspension point.",
          "**Interchangeable** — `Main`/`IO`/`Default`/custom all implement the same interface; you swap them freely (including test dispatchers).",
          "**`dispatch`/`isDispatchNeeded`** — the low-level methods; `immediate` variants override `isDispatchNeeded` to skip re-posting.",
        ],
      },
      {
        t: "note",
        text: "A CoroutineDispatcher is the CoroutineContext element that maps coroutines to threads — it schedules a coroutine's start and each post-suspension resume onto its thread/pool. Retrieve via context[CoroutineDispatcher], combine with +. All dispatchers share one interface, so Main/IO/Default/test dispatchers are swappable.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you rate-limit access to a resource using dispatchers?",
    a: [
      {
        t: "p",
        text: "Use `limitedParallelism(n)` on a dispatcher to bound how many coroutines hit the resource concurrently, or a `Semaphore(n)` to gate access. Both cap concurrency to `n`; `limitedParallelism` does it at the dispatcher level (threads), while `Semaphore` is a suspending permit you acquire around the critical section regardless of dispatcher.",
      },
      {
        t: "code",
        title: "Two ways to cap concurrency",
        code: `// Dispatcher view — at most 3 concurrent
private val limited = Dispatchers.IO.limitedParallelism(3)
suspend fun download(url: String) = withContext(limited) { fetch(url) }

// Semaphore — permits, dispatcher-agnostic
private val semaphore = Semaphore(3)
suspend fun download2(url: String) = semaphore.withPermit { fetch(url) }`,
      },
      {
        t: "list",
        items: [
          "**`limitedParallelism(n)`** — bounds concurrent coroutines on that dispatcher view; simple for I/O.",
          "**`Semaphore(n)` + `withPermit`** — suspends until a permit is free; works across any dispatcher and around any code.",
          "**Uses** — respecting an API's rate limit, limiting simultaneous uploads, protecting a connection-limited resource.",
          "**Fairness/backpressure** — excess coroutines suspend (queue) rather than failing.",
        ],
      },
      {
        t: "note",
        text: "Cap concurrent access with Dispatchers.IO.limitedParallelism(n) (dispatcher-level bound) or a Semaphore(n) + withPermit (dispatcher-agnostic permits). Both suspend excess coroutines (queue, no failure). Use for API rate limits, bounded uploads, or connection-limited resources.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why should you inject dispatchers instead of hardcoding Dispatchers.IO?",
    a: [
      {
        t: "p",
        text: "Hardcoding `Dispatchers.IO` inside a class makes it untestable — tests can't substitute a deterministic dispatcher, so they run on real threads with real timing (slow, flaky). Injecting the dispatcher (a constructor parameter with a production default) lets tests pass a `TestDispatcher` on the virtual clock, and documents the class's threading dependency.",
      },
      {
        t: "code",
        title: "Injectable dispatcher",
        code: `class Repo(
    private val api: Api,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO,   // default in prod
) {
    suspend fun load() = withContext(ioDispatcher) { api.get() }
}
// Test: Repo(fakeApi, StandardTestDispatcher(testScheduler))`,
      },
      {
        t: "list",
        items: [
          "**Testability** — swap in a `TestDispatcher` for deterministic, instant tests.",
          "**Default in production** — a constructor default (`= Dispatchers.IO`) keeps call sites clean.",
          "**Often a `DispatcherProvider`** — an injected interface bundling Main/IO/Default for larger apps.",
          "**Explicit dependency** — the class declares that it needs a dispatcher, aiding DI and clarity.",
        ],
      },
      {
        t: "note",
        text: "Hardcoded Dispatchers.IO can't be swapped in tests (real threads, slow/flaky). Inject it as a constructor param with a production default (= Dispatchers.IO), so tests pass a TestDispatcher on the virtual clock. Larger apps inject a DispatcherProvider bundling Main/IO/Default. It also makes the threading dependency explicit.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is the main thread special, and what is the 'main-thread rule'?",
    a: [
      {
        t: "p",
        text: "Android's UI toolkit is single-threaded: only the main thread may create/update views, and long work on it blocks rendering and input, causing jank or an ANR (Application Not Responding). The 'main-thread rule' is therefore two-sided: never do slow work on the main thread, and never touch UI off the main thread. Dispatchers make honoring both easy.",
      },
      {
        t: "list",
        items: [
          "**UI is single-threaded** — views must be accessed on Main; off-thread access throws or corrupts state.",
          "**Don't block Main** — >~a few ms of work drops frames; >5s of input starvation triggers an ANR.",
          "**Coroutine approach** — launch on Main, `withContext(IO/Default)` for heavy work, update UI back on Main.",
          "**StateFlow/Compose** — updating a thread-safe `StateFlow` from any thread and collecting on Main sidesteps manual switching.",
        ],
      },
      {
        t: "note",
        text: "The UI toolkit is single-threaded: only Main can touch views, and slow work on Main drops frames or triggers an ANR (>5s). Main-thread rule: don't block Main, don't touch UI off Main. Coroutines honor it — launch on Main, withContext(IO/Default) for heavy work, update UI back on Main (or via a thread-safe StateFlow).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the cost of creating many thread pools / custom dispatchers, and how do you avoid it?",
    a: [
      {
        t: "p",
        text: "Each custom thread pool consumes memory (each thread has a stack, ~0.5–1MB) and OS resources, and having many pools fragments your threads so none is used efficiently — plus you must remember to close each one. The shared `Dispatchers.IO`/`Default` pools exist precisely so the whole app reuses a common set of threads.",
      },
      {
        t: "list",
        items: [
          "**Threads are expensive** — memory per thread stack; many idle pools waste RAM.",
          "**Fragmentation** — separate pools can't share load; the shared IO/Default pools balance work app-wide.",
          "**Cleanup burden** — custom dispatchers must be `close()`d; forgetting leaks threads.",
          "**Avoidance** — use `Dispatchers.IO`/`Default`; bound concurrency with `limitedParallelism` (no new threads) instead of new pools; reserve custom pools for genuine needs (thread affinity, integrating an existing executor).",
        ],
      },
      {
        t: "note",
        text: "Each custom pool costs memory (per-thread stacks) and OS resources, fragments threads (no shared load balancing), and must be close()d (leak risk otherwise). Prefer the shared Dispatchers.IO/Default, and bound concurrency with limitedParallelism (reuses shared threads, no new pool) rather than creating pools.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you move a specific blocking call off the main thread without restructuring everything?",
    a: [
      {
        t: "p",
        text: "Wrap just that blocking call in `withContext(Dispatchers.IO)` inside a suspend function. This makes the function main-safe locally without changing callers — they still call it normally, and only the blocking portion runs off-main. It's the minimal, targeted fix for a stray blocking API.",
      },
      {
        t: "code",
        title: "Targeted offload",
        code: `suspend fun readConfig(): Config = withContext(Dispatchers.IO) {
    file.readText().let { parse(it) }   // blocking file I/O + parse, off Main
}
// Callers stay unchanged:
viewModelScope.launch { val cfg = readConfig() }`,
      },
      {
        t: "list",
        items: [
          "**Wrap the blocking part** — one `withContext(IO)` around the offending call.",
          "**Keep it main-safe** — callers don't need to know or manage threads.",
          "**Push it into the data layer** — put the `withContext` in the repository, not the ViewModel, for consistency.",
          "**Don't over-wrap** — one boundary switch, not per-line.",
        ],
      },
      {
        t: "note",
        text: "Wrap the blocking call in withContext(Dispatchers.IO) inside a suspend function — it becomes main-safe locally, callers unchanged, only the blocking part runs off-Main. Put the withContext in the repository/data layer, and switch once at the boundary rather than per line.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is Dispatchers.setMain used for, and why is it necessary in tests?",
    a: [
      {
        t: "p",
        text: "`Dispatchers.setMain(dispatcher)` replaces the global `Dispatchers.Main` with a test dispatcher. It's necessary because `Dispatchers.Main` requires the Android UI looper, which doesn't exist in a plain JVM unit test — so any code using `viewModelScope` (Main) would throw. Swapping in a test dispatcher lets ViewModel tests run on the JVM with a controllable clock.",
      },
      {
        t: "code",
        title: "MainDispatcherRule",
        code: `class MainDispatcherRule(
    private val dispatcher: TestDispatcher = UnconfinedTestDispatcher(),
) : TestWatcher() {
    override fun starting(d: Description) = Dispatchers.setMain(dispatcher)
    override fun finished(d: Description) = Dispatchers.resetMain()
}
// @get:Rule val mainRule = MainDispatcherRule()`,
      },
      {
        t: "list",
        items: [
          "**Why needed** — `Dispatchers.Main` has no real looper in JVM tests; without `setMain` it throws.",
          "**`setMain` / `resetMain`** — install in setup, reset in teardown (wrap in a JUnit rule).",
          "**Which test dispatcher** — `StandardTestDispatcher` (explicit `advanceUntilIdle`) or `UnconfinedTestDispatcher` (eager execution).",
          "**Enables ViewModel testing** — `viewModelScope` now runs on the test dispatcher and virtual clock.",
        ],
      },
      {
        t: "note",
        text: "Dispatchers.setMain(testDispatcher) replaces the global Main (which needs an Android looper that JVM unit tests lack, otherwise viewModelScope throws) with a test dispatcher; resetMain() in teardown. Wrap in a MainDispatcherRule. Pick StandardTestDispatcher (manual advance) or UnconfinedTestDispatcher (eager). Enables JVM ViewModel tests.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the main dispatchers at a glance, and how do you choose?",
    a: [
      {
        t: "p",
        text: "There are four built-in dispatchers, each matched to a kind of work. Choosing correctly is mostly about whether the work *waits* (I/O) or *computes* (CPU) or *touches UI* (Main).",
      },
      {
        t: "table",
        headers: ["Dispatcher", "For", "Pool"],
        rows: [
          ["`Main`", "UI updates, light work", "the UI thread"],
          ["`IO`", "network, disk, DB (waiting)", "~64 threads"],
          ["`Default`", "CPU work (sort/parse/compute)", "= CPU cores"],
          ["`Unconfined`", "advanced/tests only", "no confinement"],
        ],
      },
      {
        t: "list",
        items: [
          "**`Main`** — anything touching UI; keep it light.",
          "**`IO`** — blocking/waiting operations; many threads for concurrency.",
          "**`Default`** — CPU-bound computation; core-sized pool.",
          "**`Unconfined`** — rarely; unpredictable threading.",
          "**Rule of thumb** — waiting → IO, computing → Default, UI → Main.",
        ],
      },
      {
        t: "note",
        text: "Four dispatchers: Main (UI, keep light), IO (network/disk/DB — waiting, ~64 threads), Default (CPU work — core-sized pool), Unconfined (advanced/tests, unpredictable). Choose by workload: waiting → IO, computing → Default, UI → Main.",
      },
    ],
  },
  {
    level: "senior",
    q: "Do IO and Default share threads, and what does switching between them actually do?",
    a: [
      {
        t: "p",
        text: "Yes — `Dispatchers.IO` and `Dispatchers.Default` are backed by the *same* shared pool of threads. Switching from `Default` to `IO` (or vice versa) via `withContext` may *not* actually move to a different physical thread; it changes the *parallelism limit* the coroutine runs under. IO permits up to ~64 concurrent, Default up to core-count.",
      },
      {
        t: "list",
        items: [
          "**Shared pool** — both draw from one common set of worker threads.",
          "**Switching = changing the concurrency view** — `IO` allows more concurrent tasks; `Default` fewer; the switch may reuse the same thread when possible (an optimization avoiding a real hop).",
          "**Why it matters** — `withContext(IO)` from `Default` is cheap when it can keep the thread; you're mainly changing the parallelism budget.",
          "**`limitedParallelism`** — carves a bounded slice out of this shared pool without new threads.",
        ],
      },
      {
        t: "note",
        text: "IO and Default share one thread pool; switching between them changes the parallelism limit (IO ~64 concurrent, Default = cores), and can reuse the same physical thread (an optimization avoiding a real hop). So withContext(IO) from Default is cheap. limitedParallelism carves a bounded slice from the same shared pool.",
      },
    ],
  },
  {
    level: "junior",
    q: "What happens if you forget to move blocking work off the main thread?",
    a: [
      {
        t: "p",
        text: "The blocking call runs *on* the main thread, freezing the UI: no frames render, no touch input is processed. Short freezes cause visible jank (dropped frames); a freeze longer than ~5 seconds triggers an ANR (Application Not Responding) dialog and can be reported as a crash-like event. The fix is to move the work to `IO`/`Default`.",
      },
      {
        t: "list",
        items: [
          "**UI freeze** — the main thread can't render or handle input while blocked.",
          "**Jank** — dropped frames for shorter blocks (>16ms at 60fps).",
          "**ANR** — >5s blocking input triggers 'App isn't responding'; a top cause of poor ratings.",
          "**Fix** — `withContext(Dispatchers.IO)` (or `Default` for CPU) around the blocking work; keep Main light.",
          "**Detection** — StrictMode flags main-thread disk/network; the ANR/jank shows in vitals.",
        ],
      },
      {
        t: "note",
        text: "Blocking on Main freezes the UI (no rendering/input): short blocks = jank (dropped frames >16ms), >5s = an ANR ('App isn't responding'). Fix by moving work to withContext(IO/Default). StrictMode catches main-thread disk/network, and Play vitals surface ANRs/jank.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does CoroutineContext inheritance interact with dispatchers across withContext boundaries?",
    a: [
      {
        t: "p",
        text: "A child coroutine inherits the parent context, including its dispatcher, unless overridden. `withContext(X)` overrides the dispatcher (and any elements you pass) *for its block*, and coroutines launched inside that block inherit `X`. When `withContext` returns, execution resumes on the *original* dispatcher — the override is scoped to the block.",
      },
      {
        t: "code",
        title: "Dispatcher inheritance and scoping",
        code: `viewModelScope.launch {                    // Main
    launch { }                             // inherits Main
    withContext(Dispatchers.IO) {          // IO for this block
        launch { }                         // inherits IO
        withContext(Dispatchers.Default) {
            // Default here
        }                                   // back to IO
    }                                       // back to Main
    // here: Main again
}`,
      },
      {
        t: "list",
        items: [
          "**Inheritance** — children take the parent's dispatcher (and other context elements) by default.",
          "**`withContext` scopes the override** — only within its block; nested `withContext` nests the scoping.",
          "**Resume on the original** — after the block, you're back on the caller's dispatcher.",
          "**Other elements too** — the same inheritance/override applies to `CoroutineName`, exception handler, etc. (but the Job is always a new child, not inherited).",
        ],
      },
      {
        t: "note",
        text: "Children inherit the parent context (including dispatcher) unless overridden; withContext(X) overrides it only within its block (coroutines launched inside inherit X), and execution resumes on the original dispatcher after. Nesting nests the scoping. Same for CoroutineName/handler — but the Job is always a fresh child, never inherited.",
      },
    ],
  },
];

export default qa;
