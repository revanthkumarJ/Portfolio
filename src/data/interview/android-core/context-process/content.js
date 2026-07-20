// Context, Processes & App Startup — Content tab. Teaching-first.

const content = [
  {
    heading: "What Context is",
    blocks: [
      {
        t: "p",
        text: "**`Context`** is your handle to the Android application environment — it provides access to resources, system services, app-level operations, and information about the app. Almost everything in Android needs a Context: inflating layouts, starting Activities, accessing `getSystemService`, reading resources/strings, opening databases and files, showing toasts. It's 'the bridge between your code and the Android system'.",
      },
      {
        t: "list",
        items: [
          "**Things Context gives you**: resources (`getString`, `getDrawable`), system services (`getSystemService` for connectivity, notifications, etc.), starting components (`startActivity`, `startService`), file/database access, and app info (`packageName`).",
          "It's an *abstract class*; the concrete instances you actually use are `Application`, `Activity`, and `Service` (they all *are* Contexts), plus a few wrappers.",
        ],
      },
    ],
  },
  {
    heading: "Application Context vs Activity Context — the crucial distinction",
    blocks: [
      {
        t: "p",
        text: "The two Contexts you use most are the **Application Context** and the **Activity Context**, and choosing the wrong one causes memory leaks. The key difference is *lifetime*: the Application Context lives for the *entire app process*; an Activity Context lives only as long as *that Activity*.",
      },
      {
        t: "table",
        headers: ["", "Application Context", "Activity Context"],
        rows: [
          ["Lifetime", "the whole app process (singleton)", "only while that Activity exists"],
          ["Get it via", "`applicationContext` / injected", "`this` in an Activity"],
          ["UI operations (dialogs, theming)", "wrong — no theme/window", "correct — themed, tied to a window"],
          ["Long-lived references (singletons, WorkManager)", "correct — won't leak", "wrong — leaks the Activity"],
        ],
      },
      {
        t: "list",
        items: [
          "**Use the Activity Context for UI-related things**: showing a dialog, inflating a view into the Activity, anything that needs the Activity's theme or window. The Application Context lacks a theme and window, so UI operations with it misbehave or crash.",
          "**Use the Application Context for long-lived things**: singletons, repositories, WorkManager, a database instance — anything that outlives an Activity. Storing an *Activity* Context in a long-lived object leaks the entire Activity (and its view hierarchy) because the object keeps the Activity alive after it should be destroyed.",
          "**The classic leak**: a singleton holding an Activity Context (`object Manager { lateinit var ctx: Context }` set to an Activity) — the Activity can never be garbage-collected. Always pass `applicationContext` to anything that lives longer than the Activity.",
          "**In practice with DI**: inject `@ApplicationContext` (Hilt) into repositories/managers, and only use the Activity Context locally within the Activity for UI.",
        ],
      },
    ],
  },
  {
    heading: "The Application class",
    blocks: [
      {
        t: "p",
        text: "The **`Application`** class is a singleton created *before any other component* when your app's process starts, and it lives for the entire process lifetime. It *is* the Application Context. You can subclass it (declared in the manifest via `android:name`) to do app-wide initialization and hold app-global state.",
      },
      {
        t: "code",
        title: "A custom Application class",
        code: `class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // App-wide init: DI graph, crash reporting, logging
        // BUT keep this FAST — it delays every app start
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`onCreate()` runs once per process**, before the first Activity. It's where DI frameworks initialize (Hilt generates an `Application` subclass), and where you'd set up crash reporting, logging, etc.",
          "**Keep `Application.onCreate` lean**: it runs on the *main thread* on *every* cold start, so heavy work here directly increases startup time. Defer non-critical initialization (lazy init, App Startup library, background init) — a bloated `onCreate` is a common cause of slow app launches.",
          "**Don't use it as a global variable dump**: it's tempting to store 'global state' here, but that's an anti-pattern (untestable, leak-prone). Use proper scoping (DI singletons) instead.",
        ],
      },
    ],
  },
  {
    heading: "Processes — apps run in their own sandbox",
    blocks: [
      {
        t: "list",
        items: [
          "**Each app runs in its own Linux process** with its own instance of the Android Runtime (ART) and its own user ID — a security *sandbox* isolating apps from each other. By default all of an app's components run in this single process on the **main thread** (also called the UI thread).",
          "**The main thread** handles UI rendering and event dispatch. Blocking it (heavy work, network, disk) freezes the UI and triggers an **ANR** (Application Not Responding) if blocked ~5 seconds — hence all the emphasis on moving work to background threads/coroutines.",
          "**The system manages process lifetime by priority**: foreground processes (visible Activity) are protected; background/cached processes are killed first when memory is needed. This is *process death* — your app's process is terminated, and it must restore from saved state when relaunched.",
          "**Multi-process apps** (rare): you *can* run components in separate processes (`android:process` in the manifest) — e.g. isolating a crash-prone or memory-heavy component. But it complicates everything (separate memory, IPC needed to communicate, the Application class runs per-process), so it's used only for specific needs.",
        ],
      },
    ],
  },
  {
    heading: "App startup and cold/warm/hot start",
    blocks: [
      {
        t: "table",
        headers: ["Start type", "What it involves", "Speed"],
        rows: [
          ["Cold start", "process created from scratch: fork, Application.onCreate, first Activity", "slowest — full setup"],
          ["Warm start", "process alive but Activity recreated (e.g. returned after being destroyed)", "faster"],
          ["Hot start", "Activity already in memory, just brought to front", "fastest"],
        ],
      },
      {
        t: "list",
        items: [
          "**Cold start** is the one to optimize — it does the most work (create the process, run `Application.onCreate`, inflate and draw the first frame). Users judge the app by it.",
          "**What slows cold start**: heavy `Application.onCreate`, eager initialization of libraries, doing work before the first frame, large layouts, synchronous disk/network on the startup path.",
          "**How to speed it up**: lean `Application.onCreate` (defer/lazy-init), the **App Startup** library (to order and consolidate initializers, avoiding multiple ContentProvider-based inits), **Baseline Profiles** (AOT-compile the startup path so it isn't JIT-compiled during launch — often 20-40% faster cold start), and avoiding heavy work before the first frame.",
          "**The AndroidX App Startup library** replaces the old pattern where each library added its own ContentProvider to auto-initialize (each provider adding startup cost) — it consolidates them into a single, ordered initializer.",
        ],
      },
      {
        t: "note",
        text: "Context essentials: it's the bridge to the Android environment (resources, services, components). Use Activity Context for UI (needs theme/window), Application Context for long-lived objects (won't leak the Activity). The Application class is a per-process singleton for app-wide init — keep its onCreate fast. Each app runs in an isolated process on a main thread that must never block (ANR at ~5s). Optimize cold start with a lean Application.onCreate, App Startup, and Baseline Profiles.",
      },
    ],
  },
];

export default content;
