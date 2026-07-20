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
  {
    level: "junior",
    q: "What is Context actually used for?",
    a: [
      {
        t: "p",
        text: "`Context` is the handle to the Android application environment — it provides access to resources, assets, system services, app-level operations, and the ability to launch other components. Almost every Android API that needs to interact with the system takes a `Context`.",
      },
      {
        t: "list",
        items: [
          "**Resources/assets** — `getString`, `getDrawable`, `resources`.",
          "**System services** — `getSystemService()` (ConnectivityManager, NotificationManager…).",
          "**Launch components** — `startActivity`, `startService`, `sendBroadcast`.",
          "**App info/files** — `packageName`, `filesDir`, `getSharedPreferences`, `getDatabasePath`.",
          "**Theming/inflation** — inflating views needs a themed Context.",
        ],
      },
      {
        t: "note",
        text: "Context is the handle to the app environment: access resources/assets, system services (getSystemService), launch components (startActivity/Service/broadcast), app files/prefs, and theming for view inflation. Almost every system-interacting API needs one.",
      },
    ],
  },
  {
    level: "senior",
    q: "Which Context should you use for what, and what are the leak risks?",
    a: [
      {
        t: "p",
        text: "Use the *Activity Context* for UI things tied to the Activity (inflating views, showing dialogs, themed operations) because it carries the theme and window. Use the *Application Context* for anything that lives *longer* than the Activity (singletons, DI, databases, long-lived listeners) — holding an Activity Context in a long-lived object *leaks the whole Activity*.",
      },
      {
        t: "code",
        title: "Right context, no leak",
        code: `// BAD: singleton holds an Activity -> leaks it
object Manager { lateinit var context: Context }   // if set to an Activity -> leak

// GOOD: use application context for long-lived needs
class Repo(context: Context) {
    private val appContext = context.applicationContext   // safe to retain
}`,
      },
      {
        t: "list",
        items: [
          "**Activity Context** — UI: inflate views, dialogs, themed resources; don't retain it long-term.",
          "**Application Context** — long-lived: singletons, DB, DI, listeners; safe to hold.",
          "**Leak** — a static/singleton/long-lived object holding an Activity Context prevents GC of the Activity.",
          "**Rule** — need it after the Activity dies? Use `applicationContext`.",
        ],
      },
      {
        t: "note",
        text: "Activity Context for UI (inflation, dialogs, themed resources) — don't retain it. Application Context for anything longer-lived than the Activity (singletons, DB, DI, listeners) — safe to hold. Holding an Activity Context in a long-lived object leaks the whole Activity. Need it after the Activity dies? Use applicationContext.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you get and use system services?",
    a: [
      {
        t: "p",
        text: "Call `context.getSystemService(...)` to obtain framework managers — connectivity, notifications, alarms, clipboard, input methods, etc. The Kotlin-friendly `getSystemService<T>()` (core-ktx) or `ContextCompat.getSystemService` gives type-safe access. These managers are your gateway to system features.",
      },
      {
        t: "code",
        title: "System services",
        code: `val nm = context.getSystemService<NotificationManager>()!!
val cm = ContextCompat.getSystemService(context, ConnectivityManager::class.java)
val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager`,
      },
      {
        t: "list",
        items: [
          "**`getSystemService<T>()`** — type-safe (core-ktx) system manager access.",
          "**Common services** — NotificationManager, ConnectivityManager, AlarmManager, InputMethodManager, ClipboardManager.",
          "**Use app or activity context** — most services work with either; some (WindowManager for a window) need an Activity/UI context.",
          "**Cache carefully** — obtain via the right context; don't leak an Activity context.",
        ],
      },
      {
        t: "note",
        text: "getSystemService gives framework managers (Notification/Connectivity/Alarm/InputMethod/Clipboard…). Use the type-safe getSystemService<T>() (core-ktx) or ContextCompat.getSystemService. Most work with app or activity context; UI/window services need an Activity context. Obtain via the correct context to avoid leaks.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a ContextWrapper / ContextThemeWrapper?",
    a: [
      {
        t: "p",
        text: "`ContextWrapper` is a Context that *delegates* to another Context — it's the base for Activity, Service, and Application (they wrap a base context). `ContextThemeWrapper` additionally applies a *theme*, which is why an Activity (a themed context) can inflate styled views. You can wrap a context to override the theme for a specific inflation.",
      },
      {
        t: "code",
        title: "Theming a context",
        code: `val themed = ContextThemeWrapper(baseContext, R.style.MyDialogTheme)
val view = LayoutInflater.from(themed).inflate(R.layout.dialog, null)   // uses the theme`,
      },
      {
        t: "list",
        items: [
          "**`ContextWrapper`** — delegates to a base context; the base class of Activity/Service/Application.",
          "**`ContextThemeWrapper`** — adds a theme; why Activity can inflate themed views.",
          "**Override a theme** — wrap a context to inflate with a specific style.",
          "**Application context isn't themed** — inflating with it uses the default theme (a common bug).",
        ],
      },
      {
        t: "note",
        text: "ContextWrapper delegates to a base Context (the base class for Activity/Service/Application). ContextThemeWrapper adds a theme — why an Activity inflates styled views. Wrap a context to inflate with a specific theme. The Application context isn't themed, so inflating with it uses the default theme (a common styling bug).",
      },
    ],
  },
  {
    level: "junior",
    q: "What can't you do with the Application context?",
    a: [
      {
        t: "p",
        text: "The Application context lacks a *theme* and a *window/UI scope*, so you shouldn't use it to: inflate themed views or show dialogs (they'll be unstyled or crash — dialogs need an Activity), or `startActivity` without adding `FLAG_ACTIVITY_NEW_TASK` (it has no task to launch into). Use the Activity context for UI-related operations.",
      },
      {
        t: "list",
        items: [
          "**No theme** — inflating themed views/dialogs looks wrong; dialogs require an Activity context.",
          "**`startActivity` needs `NEW_TASK`** — from app context there's no task; add the flag.",
          "**No window** — UI/window operations need an Activity.",
          "**Fine for** — resources, system services, files, DB, long-lived non-UI work.",
        ],
      },
      {
        t: "note",
        text: "The Application context has no theme or window, so don't use it to inflate themed views / show dialogs (dialogs need an Activity) or startActivity without FLAG_ACTIVITY_NEW_TASK (no task to launch into). It's fine for resources, system services, files, DB, and long-lived non-UI work. UI → Activity context.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a process and a thread?",
    a: [
      {
        t: "p",
        text: "A *process* is an isolated instance of your app with its own memory space (by default, your app runs in one process). A *thread* is a unit of execution *within* a process, sharing that memory. Android gives each app a main (UI) thread plus a pool of binder threads; you create more threads (via coroutines/executors) for background work — but they share the process's memory.",
      },
      {
        t: "list",
        items: [
          "**Process** — isolated app instance, own memory; killed as a unit by the OS.",
          "**Thread** — execution within a process, shared memory.",
          "**Main thread** — the UI thread; binder threads handle IPC.",
          "**Background threads** — coroutines/executors for work off the main thread.",
        ],
      },
      {
        t: "note",
        text: "A process is an isolated app instance with its own memory (your app = one process by default), killed as a unit by the OS. A thread is execution within a process sharing memory (main/UI thread + binder threads + your background threads). Process death loses all threads/memory; the OS restores from saved state.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does the OS decide which process to kill under memory pressure?",
    a: [
      {
        t: "p",
        text: "Android ranks processes by *importance* and, under memory pressure, kills the *least important* first (via the Low Memory Killer). The hierarchy: foreground (visible/active) processes are killed last; then visible, then service, then *cached/background* processes (killed first). So a backgrounded app is a prime candidate for process death — which is why you save state.",
      },
      {
        t: "list",
        items: [
          "**Foreground** — has a visible Activity/foreground service; killed last.",
          "**Visible** — visible but not focused; next.",
          "**Service** — running a background service; mid-priority.",
          "**Cached/background** — no visible components; killed first.",
          "**Implication** — backgrounded apps get killed; persist state (SavedStateHandle) to restore.",
        ],
      },
      {
        t: "note",
        text: "The OS ranks processes by importance and kills the least important first (Low Memory Killer): foreground (visible/active) last, then visible, then service, then cached/background first. A backgrounded app is a prime process-death candidate — save state (SavedStateHandle/saved instance) so it restores cleanly.",
      },
    ],
  },
  {
    level: "senior",
    q: "What constraints apply to Application.onCreate?",
    a: [
      {
        t: "p",
        text: "`Application.onCreate` runs *once* when the process starts, *before* any Activity/Service — so it's a place for global initialization (DI, logging, crash reporting). But it runs on the *main thread* and blocks the app's cold start, so keep it *fast*: avoid heavy/blocking work, defer non-critical init (lazy, App Startup, background), or you'll slow every launch.",
      },
      {
        t: "list",
        items: [
          "**Runs once, first** — before any component; global setup (DI, Timber, Crashlytics).",
          "**Main thread** — blocks cold start; keep it minimal.",
          "**Defer non-critical init** — lazy initialization, App Startup, or background threads.",
          "**Don't do I/O/network here** — it delays the first frame.",
        ],
      },
      {
        t: "note",
        text: "Application.onCreate runs once at process start, before any component (global init: DI, logging, crash reporting) — but on the main thread, blocking cold start. Keep it fast: defer non-critical init (lazy/App Startup/background), no heavy I/O/network. Slow onCreate = slow every launch.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the App Startup library, and why use it?",
    a: [
      {
        t: "p",
        text: "`androidx.startup` (App Startup) provides a single, shared `ContentProvider` to initialize components at app startup — replacing the pattern where *each library* declares its own auto-init `ContentProvider` (which adds startup overhead, one per library). You define `Initializer`s with dependencies, and App Startup runs them in order through one provider.",
      },
      {
        t: "code",
        title: "An Initializer",
        code: `class TimberInitializer : Initializer<Unit> {
    override fun create(context: Context) { Timber.plant(Timber.DebugTree()) }
    override fun dependencies(): List<Class<out Initializer<*>>> = emptyList()
}`,
      },
      {
        t: "list",
        items: [
          "**One shared `ContentProvider`** — instead of one per auto-initializing library.",
          "**`Initializer<T>`** — define init logic and dependencies (ordering).",
          "**Faster startup** — fewer providers to instantiate.",
          "**Manual init** — you can disable auto-init and call `AppInitializer` lazily.",
        ],
      },
      {
        t: "note",
        text: "App Startup (androidx.startup) uses ONE shared ContentProvider to run Initializers (with declared dependencies for ordering) — replacing the per-library auto-init ContentProviders that each add startup cost. Fewer providers = faster cold start; you can also disable auto-init and initialize lazily via AppInitializer.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do libraries like Firebase and WorkManager auto-initialize?",
    a: [
      {
        t: "p",
        text: "Many libraries auto-initialize by declaring a `ContentProvider` in their manifest — `ContentProvider.onCreate` runs *before* `Application.onCreate`, giving them a hook to set up with the app `Context` without you writing init code. The downside is each such provider adds cold-start cost, which is why App Startup consolidates them.",
      },
      {
        t: "list",
        items: [
          "**Auto-init via `ContentProvider`** — runs before `Application.onCreate`.",
          "**No user code needed** — the library initializes itself with the context.",
          "**Cost** — each provider instantiation adds startup time.",
          "**Consolidate/disable** — App Startup, or remove the provider via manifest merge and init manually.",
        ],
      },
      {
        t: "note",
        text: "Libraries auto-initialize by declaring a ContentProvider whose onCreate runs before Application.onCreate — self-setup with the app Context, no user code. Cost: each provider adds cold-start time. Consolidate with App Startup, or disable a library's provider (manifest merge) and initialize it manually to speed startup.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you detect the app moving to the background or foreground?",
    a: [
      {
        t: "p",
        text: "Use `ProcessLifecycleOwner`, which provides a `Lifecycle` for the *whole app process* (not a single Activity) — its `ON_START`/`ON_STOP` fire when the app as a whole enters the foreground/background. Observe it to run app-level logic (pause syncing, lock the app, log sessions) without tracking every Activity manually.",
      },
      {
        t: "code",
        title: "App-level foreground/background",
        code: `ProcessLifecycleOwner.get().lifecycle.addObserver(object : DefaultLifecycleObserver {
    override fun onStart(owner: LifecycleOwner) { /* app foregrounded */ }
    override fun onStop(owner: LifecycleOwner) { /* app backgrounded */ }
})`,
      },
      {
        t: "list",
        items: [
          "**`ProcessLifecycleOwner`** — a lifecycle for the whole process.",
          "**ON_START/ON_STOP** — app foreground/background (debounced across Activity transitions).",
          "**Uses** — app lock, session tracking, pausing sync when backgrounded.",
          "**Not per-Activity** — it aggregates all Activities.",
        ],
      },
      {
        t: "note",
        text: "ProcessLifecycleOwner exposes a Lifecycle for the whole app process — ON_START/ON_STOP fire on app-level foreground/background (debounced across Activity transitions), so you don't track each Activity. Use for app lock, session tracking, or pausing sync when backgrounded.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is StrictMode, and what does it catch?",
    a: [
      {
        t: "p",
        text: "`StrictMode` is a developer tool that detects accidental *main-thread violations* (disk/network I/O on the UI thread) and *VM policy violations* (leaked Activities, unclosed resources like cursors/streams). Enable it in debug builds to catch jank/leak sources early — it logs or crashes on violations you'd otherwise miss.",
      },
      {
        t: "code",
        title: "Enabling StrictMode",
        code: `if (BuildConfig.DEBUG) {
    StrictMode.setThreadPolicy(StrictMode.ThreadPolicy.Builder()
        .detectDiskReads().detectNetwork().penaltyLog().build())
    StrictMode.setVmPolicy(StrictMode.VmPolicy.Builder()
        .detectActivityLeaks().detectLeakedClosableObjects().penaltyLog().build())
}`,
      },
      {
        t: "list",
        items: [
          "**Thread policy** — main-thread disk/network I/O detection.",
          "**VM policy** — leaked Activities, unclosed closables, SQLite issues.",
          "**Debug only** — enable in debug; `penaltyLog`/`penaltyDeath`.",
          "**Catches early** — jank and leaks you'd otherwise ship.",
        ],
      },
      {
        t: "note",
        text: "StrictMode detects main-thread violations (disk/network I/O on the UI thread) and VM violations (leaked Activities, unclosed cursors/streams). Enable in debug builds (penaltyLog/penaltyDeath) to catch jank and leak sources early — it surfaces mistakes you'd otherwise miss until production.",
      },
    ],
  },
  {
    level: "senior",
    q: "What threads exist in an Android app process?",
    a: [
      {
        t: "p",
        text: "Every app process has a *main (UI) thread* (runs the Looper/message queue, handles UI and lifecycle), a pool of *binder threads* (handle incoming IPC calls, e.g. from the system), and any *background threads* you create (coroutine dispatchers, executors). Only the main thread may touch UI; binder threads shouldn't be blocked (they serve system calls).",
      },
      {
        t: "list",
        items: [
          "**Main/UI thread** — Looper-driven; UI, lifecycle, input; never block it.",
          "**Binder thread pool** — handles incoming IPC (system callbacks, bound services).",
          "**Background threads** — your coroutine dispatchers/executors for work.",
          "**Rule** — UI only on main; offload heavy work; don't block binder threads.",
        ],
      },
      {
        t: "note",
        text: "An app process has: the main/UI thread (Looper — UI, lifecycle, input; never block), a binder thread pool (incoming IPC/system callbacks), and background threads you create (dispatchers/executors). Only main touches UI; offload heavy work; don't block binder threads (they serve system calls).",
      },
    ],
  },
  {
    level: "junior",
    q: "Why should singletons and DI use the application context?",
    a: [
      {
        t: "p",
        text: "Singletons and DI-provided objects live as long as the *process*, so if they hold an *Activity* context, they keep that (now-destroyed) Activity alive — a leak. Using `applicationContext` (which lives for the whole process anyway) avoids the leak. In Hilt, `@ApplicationContext` provides exactly this.",
      },
      {
        t: "code",
        title: "Application context in DI",
        code: `class AnalyticsManager @Inject constructor(
    @ApplicationContext private val context: Context,   // safe, process-lived
) { }`,
      },
      {
        t: "list",
        items: [
          "**Long-lived objects** — singletons/DI live for the process.",
          "**Activity context in them** — leaks the Activity.",
          "**`applicationContext`** — process-lived, safe to retain.",
          "**Hilt `@ApplicationContext`** — injects the app context.",
        ],
      },
      {
        t: "note",
        text: "Singletons/DI objects live for the whole process, so holding an Activity context leaks that Activity. Use applicationContext (process-lived, safe) — in Hilt, inject @ApplicationContext. Never retain an Activity context in a long-lived object.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a multi-process app, and what are the trade-offs?",
    a: [
      {
        t: "p",
        text: "By default an app runs in one process, but you can declare `android:process` on a component to run it in a *separate* process (e.g. an isolated media/crash-handling process). Trade-offs: isolation and separate memory (a crash in one process doesn't kill the other), but *no shared memory* (statics/singletons are duplicated), IPC overhead to communicate, and a separate `Application.onCreate` per process.",
      },
      {
        t: "list",
        items: [
          "**`android:process`** — run a component in another process.",
          "**Isolation** — separate memory; one process crashing doesn't kill the other.",
          "**No shared state** — statics/singletons/DI graphs are duplicated per process.",
          "**Cost** — IPC to communicate; `Application.onCreate` runs in each process (guard init).",
          "**Uses** — isolated risky work (media codecs, WebView), reducing main-process memory.",
        ],
      },
      {
        t: "note",
        text: "android:process runs a component in a separate process — isolation/separate memory (a crash there doesn't kill the main app) but NO shared memory (statics/singletons/DI duplicated), IPC overhead, and Application.onCreate runs per process (guard init by process name). Used for isolated risky work (media/WebView) or memory separation.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is Binder / IPC, and how does it relate to TransactionTooLargeException?",
    a: [
      {
        t: "p",
        text: "Binder is Android's IPC mechanism — the kernel driver that lets processes communicate (your app ↔ system services, bound services, `startActivity` with extras). Data passed through Binder goes into a fixed-size *transaction buffer* (~1MB shared per process). Passing too much (huge `Bundle` extras, saved state) throws `TransactionTooLargeException`, which is why you keep IPC payloads (Intents, saved state) small.",
      },
      {
        t: "list",
        items: [
          "**Binder** — the IPC driver for cross-process calls (system services, bound services, Intents).",
          "**Transaction buffer** — ~1MB shared per process for in-flight IPC.",
          "**`TransactionTooLargeException`** — from oversized payloads (big Intent extras, saved state).",
          "**Keep small** — pass ids, not large objects, across process boundaries.",
        ],
      },
      {
        t: "note",
        text: "Binder is Android's IPC mechanism (app ↔ system services/bound services, Intent delivery). Data crosses through a fixed ~1MB transaction buffer per process — oversized payloads (huge Intent extras, saved state) throw TransactionTooLargeException. Keep IPC payloads small (pass ids, not large objects).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the role of the Application class in dependency injection?",
    a: [
      {
        t: "p",
        text: "The `Application` class is the process-lifetime root, so it's the natural place to host the app-wide DI container. In Hilt, you annotate it `@HiltAndroidApp`, which generates the application-level component (the DI graph root) that lives as long as the process and provides `@ApplicationContext` and singleton-scoped dependencies.",
      },
      {
        t: "code",
        title: "Hilt application",
        code: `@HiltAndroidApp
class MyApp : Application() {
    override fun onCreate() { super.onCreate(); /* global init */ }
}`,
      },
      {
        t: "list",
        items: [
          "**Process-lifetime root** — hosts the app-wide DI graph.",
          "**`@HiltAndroidApp`** — generates the application component (DI root).",
          "**Provides** — `@ApplicationContext`, `@Singleton` dependencies.",
          "**Other frameworks** — Koin/Dagger also initialize their graph in `Application`.",
        ],
      },
      {
        t: "note",
        text: "The Application class is the process-lifetime root, so it hosts the app-wide DI container: @HiltAndroidApp generates the application component (DI graph root) living for the process, providing @ApplicationContext and @Singleton dependencies. Koin/Dagger similarly initialize their graph in Application.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does an app restore after process death?",
    a: [
      {
        t: "p",
        text: "When the user returns to a process-killed app, Android *recreates the task and the top Activity*, passing back the saved instance state `Bundle` (which includes `SavedStateHandle` contents). A fresh process starts (`Application.onCreate` runs again), the Activity is recreated with `savedInstanceState`, and your ViewModel rebuilds data from the restored ids. The user ideally can't tell it was killed.",
      },
      {
        t: "list",
        items: [
          "**Task restored** — the back stack of the top task is recreated.",
          "**Fresh process** — `Application.onCreate` runs again (new DI graph).",
          "**Saved state returned** — `onCreate(savedInstanceState)` + `SavedStateHandle`.",
          "**Rebuild data** — the ViewModel re-fetches from restored ids (data itself wasn't saved).",
        ],
      },
      {
        t: "note",
        text: "After process death, returning recreates the task and top Activity with the saved instance-state Bundle (incl. SavedStateHandle); a fresh process starts (Application.onCreate reruns), the Activity restores small UI state, and the ViewModel rebuilds data from restored ids. Save ids (not large data) so restoration is seamless.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between Application.onCreate and Activity.onCreate?",
    a: [
      {
        t: "p",
        text: "`Application.onCreate` runs *once per process* when the app starts, before any component — for global, app-wide initialization. `Activity.onCreate` runs *each time an Activity is created* (including on every configuration change) — for screen-specific setup. They differ in scope and frequency: app-global-once vs screen-specific-many.",
      },
      {
        t: "list",
        items: [
          "**`Application.onCreate`** — once per process; global init (DI, logging).",
          "**`Activity.onCreate`** — per Activity creation (and every config change); screen setup.",
          "**Frequency** — app: once; activity: potentially many times.",
          "**Keep both lean** — they block startup/screen-display respectively.",
        ],
      },
      {
        t: "note",
        text: "Application.onCreate: once per process at app start, before any component — global init. Activity.onCreate: each Activity creation (incl. every config change) — screen setup. Scope/frequency differ: app-global-once vs screen-specific-many. Keep both lean (they block startup / screen display).",
      },
    ],
  },
  {
    level: "senior",
    q: "Why must you guard initialization in a multi-process app's Application.onCreate?",
    a: [
      {
        t: "p",
        text: "In a multi-process app, `Application.onCreate` runs *once in each process* — so global initialization (analytics, DI, heavy setup) would run redundantly (or incorrectly) in a secondary process (e.g. a `:media` process). Guard by checking the current process name and only running the main-process init where appropriate.",
      },
      {
        t: "code",
        title: "Process-guarded init",
        code: `override fun onCreate() {
    super.onCreate()
    if (getProcessName() == packageName) {   // main process only
        initAnalytics(); initHeavyStuff()
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Runs per process** — each process instantiates `Application`.",
          "**Guard by process name** — `getProcessName()`/`Application.getProcessName()`.",
          "**Avoid redundant init** — don't run main-process setup in secondary processes.",
          "**Lightweight secondary** — secondary processes should init only what they need.",
        ],
      },
      {
        t: "note",
        text: "In a multi-process app, Application.onCreate runs once per process — so guard global init (analytics/DI) by checking getProcessName() == packageName to run main-process setup only in the main process, avoiding redundant/incorrect init in secondary processes (e.g. :media). Init secondary processes minimally.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you avoid leaking a Context, in practice?",
    a: [
      {
        t: "p",
        text: "Leaks happen when a long-lived object retains a short-lived Context (usually an Activity). Avoid them by: using `applicationContext` for anything outliving the Activity, not keeping static/singleton references to Activities/Views, unregistering listeners in the paired lifecycle callback, and using `WeakReference` only as a last resort. Tools like LeakCanary catch these automatically.",
      },
      {
        t: "list",
        items: [
          "**`applicationContext` for long-lived** — singletons, DB, DI, managers.",
          "**No static Activity/View** — a static field holding a View/Activity leaks it.",
          "**Unregister** — listeners/receivers/observers in the paired teardown.",
          "**LeakCanary** — detects retained Activities/Fragments in debug builds.",
        ],
      },
      {
        t: "note",
        text: "Avoid Context leaks: use applicationContext for anything outliving the Activity, never keep static/singleton references to Activities/Views, unregister listeners in the paired callback, and rely on LeakCanary (debug) to catch retained Activities/Fragments. WeakReference is a last resort, not a first fix.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between the process lifecycle and the Activity lifecycle?",
    a: [
      {
        t: "p",
        text: "The *Activity lifecycle* tracks a single screen (create→resume→pause→destroy). The *process lifecycle* is coarser — the process exists from `Application.onCreate` until the OS kills it, spanning many Activities. A process can outlive individual Activities (backgrounded app kept in memory) and can be killed independently of any Activity's lifecycle (process death without `onDestroy`).",
      },
      {
        t: "list",
        items: [
          "**Activity lifecycle** — per-screen callbacks; recreated on config change.",
          "**Process lifecycle** — `Application.onCreate` → OS kill; spans all Activities.",
          "**Independence** — process death can skip `onDestroy`; a process outlives backgrounded Activities.",
          "**`ProcessLifecycleOwner`** — observes app-level foreground/background.",
        ],
      },
      {
        t: "note",
        text: "Activity lifecycle = per-screen (create→destroy, recreated on config change). Process lifecycle = coarser, Application.onCreate until OS kill, spanning many Activities. Process death can skip onDestroy and happens independently of any Activity. ProcessLifecycleOwner observes app-level foreground/background.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why does starting an Activity from a non-Activity context require FLAG_ACTIVITY_NEW_TASK?",
    a: [
      {
        t: "p",
        text: "Activities normally launch into the *task* of the Activity that started them. A non-Activity context (Application, Service, BroadcastReceiver) has *no task* to launch into, so `startActivity` from it requires `FLAG_ACTIVITY_NEW_TASK` to create/find a task — otherwise it throws `AndroidRuntimeException: Calling startActivity() from outside of an Activity context`.",
      },
      {
        t: "code",
        title: "NEW_TASK from app context",
        code: `val intent = Intent(appContext, DetailActivity::class.java)
    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)   // required from non-Activity context
appContext.startActivity(intent)`,
      },
      {
        t: "list",
        items: [
          "**Activities launch into a task** — the starter Activity's task by default.",
          "**Non-Activity context has no task** — Application/Service/Receiver.",
          "**`FLAG_ACTIVITY_NEW_TASK`** — required to create/find a task.",
          "**Without it** — throws (calling startActivity outside an Activity context).",
        ],
      },
      {
        t: "note",
        text: "Activities launch into the starter's task, but a non-Activity context (Application/Service/Receiver) has no task — so startActivity from it needs FLAG_ACTIVITY_NEW_TASK to create/find one, else it throws 'Calling startActivity() from outside of an Activity context'.",
      },
    ],
  },
  {
    level: "senior",
    q: "What causes an ANR, and how do you diagnose one?",
    a: [
      {
        t: "p",
        text: "An ANR (Application Not Responding) fires when the *main thread* is blocked too long: ~5s for input events, ~10s for a `BroadcastReceiver`'s `onReceive`, or foreground service start timeouts. Causes: heavy work/I/O on the main thread, deadlocks, or slow binder calls. Diagnose via the ANR trace (`/data/anr/traces.txt` / Play Console → Android vitals), which shows the main thread's stack at the freeze.",
      },
      {
        t: "list",
        items: [
          "**Thresholds** — ~5s input, ~10s broadcast receiver, service start limits.",
          "**Causes** — main-thread I/O/computation, deadlocks, slow synchronous IPC.",
          "**Diagnose** — ANR traces (main-thread stack), Play Console Android vitals, Perfetto/systrace.",
          "**Fix** — move work off the main thread (coroutines), avoid blocking calls, use StrictMode to catch early.",
        ],
      },
      {
        t: "note",
        text: "ANR = main thread blocked too long (~5s input, ~10s BroadcastReceiver, service-start timeouts) — from main-thread I/O/computation, deadlocks, or slow IPC. Diagnose via ANR traces (main-thread stack), Play Console Android vitals, Perfetto. Fix by moving work off main (coroutines) and catching early with StrictMode.",
      },
    ],
  },
];

export default qa;
