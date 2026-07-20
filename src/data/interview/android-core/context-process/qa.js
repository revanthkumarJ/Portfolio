// Context, Processes & App Startup — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is Context in Android?",
    a: [
      {
        t: "p",
        text: "**The concept**: `Context` is your handle to the Android app environment — the bridge between your code and the Android system. Almost everything needs it because it provides access to resources (strings, drawables), system services (`getSystemService`), the ability to start components (`startActivity`), file and database access, and app information.",
      },
      {
        t: "list",
        items: [
          "You need a Context to: inflate a layout, show a Toast or dialog, read a string resource, get a system service (connectivity, notifications), start an Activity or Service, open a database or file.",
          "It's an abstract class; the concrete Contexts you actually use are `Application`, `Activity`, and `Service` — they *are* Contexts (they extend it).",
          "The two you pick between most are the **Application Context** (lives for the whole app) and the **Activity Context** (lives only as long as that Activity) — and choosing correctly matters for avoiding leaks.",
        ],
      },
      {
        t: "p",
        text: "Think of Context as 'the environment handle' — whenever an Android API needs to know *which app* or *which screen* it's acting on behalf of, or needs access to system-provided things, it asks for a Context.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between Application Context and Activity Context?",
    a: [
      {
        t: "p",
        text: "**The core difference is lifetime.** The Application Context lives for the *entire app process* (it's a singleton). An Activity Context lives only as long as *that specific Activity* — it dies when the Activity is destroyed. This lifetime difference dictates which you should use where.",
      },
      {
        t: "list",
        items: [
          "**Use the Activity Context for UI**: showing a dialog, inflating a view into the Activity, anything needing the Activity's theme or window. The Application Context has no theme or window, so UI operations with it look wrong or crash.",
          "**Use the Application Context for long-lived objects**: singletons, repositories, a database, WorkManager — anything that outlives an Activity. Giving these an Activity Context would keep the Activity alive after it should be destroyed — a memory leak.",
        ],
      },
      {
        t: "code",
        title: "The classic leak",
        code: `// LEAK: singleton holding an Activity Context keeps the Activity alive forever
object Manager { lateinit var ctx: Context }
Manager.ctx = this   // 'this' is an Activity -> leaked

// CORRECT: give long-lived objects the application context
Manager.ctx = applicationContext`,
      },
      {
        t: "p",
        text: "The rule of thumb: if the object using the Context lives *longer* than an Activity, use the Application Context; if the operation needs UI/theme/window, use the Activity Context. With dependency injection you inject `@ApplicationContext` into repositories and managers, and reserve the Activity Context for local UI work inside the Activity.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the Application class and what do you use it for?",
    a: [
      {
        t: "p",
        text: "**The concept**: the `Application` class is a singleton created before any other component when your app's process starts, living for the whole process lifetime. It *is* the Application Context. You can subclass it (declared in the manifest with `android:name`) to run app-wide initialization and hold process-global setup.",
      },
      {
        t: "list",
        items: [
          "**`onCreate()` runs once per process**, before the first Activity — the place for app-wide setup: initializing the DI graph (Hilt generates an Application subclass for this), crash reporting, logging frameworks.",
          "**Keep it lean**: `Application.onCreate` runs on the *main thread* on *every* cold start, so heavy work here directly slows down every app launch. Defer non-critical initialization (lazy init, background threads, the App Startup library).",
          "**Don't use it as a global-variable dump**: storing mutable 'global state' in the Application class is an anti-pattern — untestable and easy to leak. Use proper DI-scoped singletons instead.",
        ],
      },
      {
        t: "p",
        text: "So it's for genuine app-wide, process-lifetime concerns (initialization, providing the Application Context), not a convenient bag for globals. The main performance caution is that a bloated `onCreate` is a very common cause of slow cold starts, since it's squarely on the critical launch path.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is an ANR and what causes it?",
    a: [
      {
        t: "p",
        text: "**ANR stands for 'Application Not Responding'** — a dialog the system shows (and a event it logs) when your app's *main thread* is blocked for too long and can't process user input or draw. The main thresholds: the main thread unresponsive to input for ~5 seconds, a BroadcastReceiver's `onReceive` taking more than ~10 seconds, or a Service not completing startup in time.",
      },
      {
        t: "p",
        text: "**The cause is always the same fundamental mistake: doing slow work on the main thread.** The main thread (UI thread) is responsible for rendering the UI and handling input events; if you block it — with a network request, a large database query, heavy computation, or file I/O — it can't do its job, the UI freezes, and after ~5 seconds the system declares an ANR. The fix is to move all slow work *off* the main thread: use coroutines with `Dispatchers.IO`/`Default`, `withContext`, or background threads, keeping the main thread free to render and respond. This is *the* reason Android emphasizes coroutines and background threading so heavily — every 'don't block the main thread' rule exists to prevent ANRs and jank.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do Android processes work, and what is process death?",
    a: [
      {
        t: "p",
        text: "**Each Android app runs in its own Linux process** with its own instance of the Android Runtime (ART) and a unique Linux user ID. This process is a *security sandbox* — apps can't directly access each other's memory or data; cross-app interaction goes through controlled channels (Intents, ContentProviders, permissions). By default, all of an app's components run in this single process, and specifically on its **main thread**.",
      },
      {
        t: "list",
        items: [
          "**The system manages processes by priority to reclaim memory**: it ranks processes — foreground (a visible Activity or foreground service) is highest priority and protected; visible, service, background (cached) processes descend in priority. When the system needs memory, it kills the *lowest-priority* processes first, starting with cached background ones.",
          "**Process death** is when the system terminates your app's process (usually while it's in the background) to free resources. Everything in memory is gone — the ViewModel, singletons, static state, in-flight work. When the user returns, Android *recreates* the process and the Activity from scratch, restoring only the saved-instance-state Bundle.",
          "**Why it matters for architecture**: because process death loses all in-memory state, robust apps must be able to rebuild from persisted state — the source of truth is the database/repository (for data) plus `SavedStateHandle`/`onSaveInstanceState` (for transient input/ids). Relying on in-memory state or singletons to 'always be there' is the bug process death exposes.",
          "**Multi-process apps** exist (`android:process` in the manifest puts a component in a separate process — used to isolate a memory-heavy or crash-prone component, or for security isolation), but they add significant complexity: separate memory spaces, the Application class runs *per process*, and communication requires IPC (bound services/AIDL, ContentProviders). It's a deliberate choice for specific needs, not a default.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the process model is fundamentally about the OS treating memory as a shared, reclaimable resource and apps as disposable/recreatable. Understanding that your process can be killed at any time in the background — and that recovery means rebuilding from persisted state, not assuming memory survives — is what separates apps that lose the user's place on return from ones that restore seamlessly. It's the deeper 'why' behind the whole state-saving discipline.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between cold, warm, and hot start, and how do you optimize cold start?",
    a: [
      {
        t: "p",
        text: "**These describe how much work Android must do to bring your app to the foreground, from most to least.** A *cold start* means the process doesn't exist yet — the system must create it (fork the process, initialize ART), run `Application.onCreate`, then create and draw the first Activity. A *warm start* means the process is alive but the Activity needs recreating (e.g. it was destroyed in the background) — less work. A *hot start* means the Activity is still in memory and just needs bringing to the front — the fastest.",
      },
      {
        t: "list",
        items: [
          "**Cold start is the one to optimize** — it does the most work and users judge the app's speed by it (especially first launch). It's measured as 'time to initial display' (first frame) and 'time to fully drawn'.",
          "**What slows cold start**: a heavy `Application.onCreate` (runs synchronously on the main thread before anything), eager initialization of many libraries, synchronous disk/network on the startup path, large/complex initial layouts, and — a big one — JIT compilation of the startup code path happening *during* launch.",
        ],
      },
      {
        t: "list",
        items: [
          "**Optimization 1 — lean Application.onCreate**: initialize only what's needed to draw the first screen; lazy-initialize or defer everything else (analytics, non-critical SDKs). Move eager work to background threads or trigger it after first frame.",
          "**Optimization 2 — App Startup library**: consolidates library initializers into a single, ordered ContentProvider instead of each library adding its *own* ContentProvider (each provider adds measurable startup cost). It also lets you control initialization order and laziness.",
          "**Optimization 3 — Baseline Profiles**: this is often the biggest single win. Without them, the startup code path is JIT-compiled *during* the user's launch. A Baseline Profile ships a list of the hot startup methods that get AOT-compiled at install time, so the launch path is already native — commonly 20-40% faster cold start and smoother first frames.",
          "**Optimization 4 — avoid work before the first frame**: don't block the first draw on data loading (show a skeleton/placeholder and load asynchronously); keep the initial layout simple; use a proper splash screen (the SplashScreen API) rather than a heavy custom one.",
          "**Measure it**: use `adb shell am start -W` for start time, Macrobenchmark with `StartupTimingMetric` for reliable numbers on release builds, and Perfetto/system traces to find what's on the critical path — optimize based on measurement, not guesses.",
        ],
      },
    ],
  },
];

export default qa;
