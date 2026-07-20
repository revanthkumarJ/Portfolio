// Dispatchers & Coroutine Context — Content tab. Teaching-first.

const content = [
  {
    heading: "CoroutineContext — the environment a coroutine runs in",
    blocks: [
      {
        t: "p",
        text: "Every coroutine carries a **`CoroutineContext`** — a set of elements describing *how and where* it runs. Think of it as a map of typed elements combined with `+`. The main elements: a **`Job`** (its lifecycle/tree position), a **`CoroutineDispatcher`** (which thread(s) it runs on), an optional **`CoroutineExceptionHandler`**, and an optional **`CoroutineName`** (for debugging).",
      },
      {
        t: "code",
        title: "Building and inspecting context",
        code: `val scope = CoroutineScope(
    SupervisorJob() + Dispatchers.Main + CoroutineName("ui")
)

scope.launch(Dispatchers.IO + CoroutineName("sync")) {
    // this coroutine's context = parent's context, with IO and name overridden
}`,
      },
      {
        t: "list",
        items: [
          "**Context is inherited and overridable**: a child coroutine inherits its parent's context, and any element you pass to the builder *overrides* that element for the child (e.g. `launch(Dispatchers.IO)` keeps the parent's Job-parentage but switches the dispatcher).",
          "**The Job in a child's context is always a *new child Job*** — you don't inherit the parent's Job as your own; you get a fresh child of it (that's how the tree forms). Other elements (dispatcher, name) are inherited by value.",
          "Elements are combined with `+` and retrieved by key (`coroutineContext[Job]`, `coroutineContext[CoroutineDispatcher]`).",
        ],
      },
    ],
  },
  {
    heading: "Dispatchers — which thread(s) the coroutine uses",
    blocks: [
      {
        t: "p",
        text: "A **`CoroutineDispatcher`** determines what thread or thread pool a coroutine runs on. There are four standard dispatchers, each tuned for a kind of work:",
      },
      {
        t: "table",
        headers: ["Dispatcher", "Backed by", "Use for"],
        rows: [
          ["`Dispatchers.Main`", "the Android main/UI thread", "UI updates, calling into ViewModel, light work"],
          ["`Dispatchers.IO`", "a large elastic thread pool (64+)", "blocking I/O — network, disk, database"],
          ["`Dispatchers.Default`", "a pool sized to CPU cores", "CPU-intensive work — parsing, sorting, image processing"],
          ["`Dispatchers.Unconfined`", "no confinement (runs in caller thread until first suspension)", "rarely — advanced/testing; not for app logic"],
        ],
      },
      {
        t: "list",
        items: [
          "**IO vs Default — the key distinction**: `IO` is for *blocking* operations that spend most of their time *waiting* (a network call, a file read) — so its pool is large (many threads can be blocked waiting cheaply). `Default` is for *CPU-bound* work that *keeps a core busy* — so its pool matches core count (more threads than cores would just thrash). Using IO for CPU work wastes threads; using Default for blocking IO starves CPU work.",
          "**`Dispatchers.Main.immediate`** — a variant that skips re-dispatching if you're *already* on the main thread (avoids an unnecessary post to the message queue / one-frame delay). `viewModelScope` uses it.",
          "**`IO` and `Default` share threads**: switching between them (`withContext(Default)` from an IO coroutine) may not actually change threads — the dispatcher framework optimizes this. But the semantics (pool sizing/limits) still apply.",
        ],
      },
    ],
  },
  {
    heading: "withContext — switching dispatchers within a coroutine",
    blocks: [
      {
        t: "p",
        text: "`withContext(dispatcher) { }` runs its block on the given dispatcher and **suspends until it returns the result**, then continues on the original context. It's the primary tool for moving a *piece* of work to the right thread without launching a new coroutine — and it's how you make suspend functions **main-safe**.",
      },
      {
        t: "code",
        title: "withContext for main-safety",
        code: `suspend fun loadUser(id: String): User = withContext(Dispatchers.IO) {
    val response = api.getUser(id)   // blocking-ish network on IO
    response.toUser()                 // parse
}
// Caller (on Main) can call this safely; it hops to IO internally and back.

// Heavy CPU work -> Default:
suspend fun sortLarge(list: List<Item>): List<Item> = withContext(Dispatchers.Default) {
    list.sortedByDescending { it.score }
}`,
      },
      {
        t: "list",
        items: [
          "**`withContext` returns a value and doesn't create a new coroutine tree branch for concurrency** — it's sequential. Use it to *switch threads for a block*, not to run things in parallel (that's `async`).",
          "**Main-safety rule**: the layer *doing* the blocking/CPU work owns the `withContext`. A repository's suspend function wraps its own IO in `withContext(IO)`, so a ViewModel can call it from the main thread without any dispatcher juggling. Callers should *not* pre-emptively wrap calls in `withContext(IO)`.",
          "**Don't double-wrap main-safe calls**: Retrofit and Room suspend functions are already main-safe (they manage their own threading), so wrapping them in `withContext(IO)` is redundant (harmless but reveals shallow understanding).",
          "**Inject dispatchers, don't hardcode**: take a `CoroutineDispatcher` as a constructor parameter (`ioDispatcher: CoroutineDispatcher = Dispatchers.IO`) so tests can substitute a `TestDispatcher` and control virtual time — hardcoding `Dispatchers.IO` makes code untestable.",
        ],
      },
    ],
  },
  {
    heading: "withContext vs launch/async for threading",
    blocks: [
      {
        t: "list",
        items: [
          "**`withContext(d) { }`** — switch context for a block, get the result back, *sequentially*. 'Run this part on IO and give me the answer.' The default choice for 'do this work on the right thread'.",
          "**`launch(d) { }`** — start a *new concurrent coroutine* on dispatcher `d`. Use when you want fire-and-forget work on a specific thread, not when you just need a result.",
          "**`async(d) { }`** — start a *concurrent* coroutine on `d` that returns a result via `await()`. Use for parallel work on specific threads.",
          "The mistake to avoid: using `launch`/`async` + immediate `await`/`join` just to switch threads for a single result — that's what `withContext` is for, and it's clearer and cheaper.",
        ],
      },
    ],
  },
  {
    heading: "Context preservation and dispatcher confinement",
    blocks: [
      {
        t: "list",
        items: [
          "A coroutine **stays on its dispatcher across suspension points** — after a `delay` or a suspend call resumes, it comes back on the same dispatcher (not necessarily the same *thread* within a pool, but the same dispatcher). So `Dispatchers.Main` code that suspends resumes back on Main — safe to touch UI.",
          "**`withContext` restores the outer context** when its block ends — so `withContext(IO){}` inside a Main coroutine runs the block on IO and then continues on Main automatically.",
          "**Custom dispatchers**: you can create your own with `newSingleThreadContext` / `newFixedThreadPoolContext` (for confinement to specific threads, e.g. a single-threaded dispatcher to serialize access to a non-thread-safe resource) or wrap a Java `Executor` with `.asCoroutineDispatcher()`. Close them when done (they hold real threads).",
          "**`Dispatchers.Main` requires a main-thread implementation** — on Android it's provided by the coroutines-android artifact; in pure JVM unit tests it doesn't exist, which is why you `Dispatchers.setMain(testDispatcher)` in tests.",
        ],
      },
      {
        t: "note",
        text: "The threading trio to state cleanly: \"Main for UI, IO for blocking waits (network/disk — large pool), Default for CPU work (parsing/sorting — core-sized pool). Switch with withContext, owned by the layer doing the work, and inject dispatchers for testability.\"",
      },
    ],
  },
];

export default content;
