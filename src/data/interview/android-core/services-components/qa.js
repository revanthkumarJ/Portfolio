// Services, Receivers & Providers — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What are the four main Android app components?",
    a: [
      {
        t: "list",
        items: [
          "**Activity** — a single screen with a UI; the entry point for user interaction.",
          "**Service** — a component for long-running work without a UI (like music playback), which can continue when the user isn't looking at the app.",
          "**BroadcastReceiver** — responds to system-wide or app-wide broadcast events (connectivity change, boot completed, battery low).",
          "**ContentProvider** — exposes structured data to other apps through a standard query interface, identified by a `content://` URI.",
        ],
      },
      {
        t: "p",
        text: "All four are *entry points* the Android system can instantiate and start — the OS, not just your app, decides when to create them. Three of the four (Activity, Service, BroadcastReceiver, and Provider) are declared in the manifest so the system knows they exist (runtime-registered receivers are the exception). Understanding these components — especially their lifecycles and the modern restrictions on Services and background receivers — is core Android knowledge.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a Service and does it run on a background thread?",
    a: [
      {
        t: "p",
        text: "**A Service is a component for work that runs without a UI, potentially continuing when the user leaves the app.** The critical thing to know — and a common interview trap — is that **a Service does NOT run on a background thread by default. It runs on the main thread.** So if you do heavy or blocking work directly in a Service, you'll freeze the UI (or ANR) just like anywhere else. You must still move the actual work to a background thread or coroutine yourself.",
      },
      {
        t: "list",
        items: [
          "**Foreground service** — for ongoing, *user-visible* work; shows a persistent notification so the user knows it's running (music, navigation, active upload).",
          "**Background service** — heavily restricted since Android 8: the system kills it soon after the app leaves the foreground, so it's rarely usable now.",
          "**Bound service** — other components bind to it to call its methods (a client-server relationship, or IPC).",
        ],
      },
      {
        t: "p",
        text: "The practical modern guidance: for immediate, ongoing, user-aware work use a *foreground service* (with its required notification); for deferrable/guaranteed background work use *WorkManager*, not a plain Service. And always remember to do the actual work off the main thread — the Service is just the component that keeps your process running, not a background executor.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a BroadcastReceiver and when would you use one?",
    a: [
      {
        t: "p",
        text: "**A BroadcastReceiver listens for broadcast events — messages delivered as Intents, either from the system or from apps.** The system broadcasts things like connectivity changes, boot completed, battery low, airplane mode toggled; apps can send custom broadcasts too. When a matching broadcast arrives, the receiver's `onReceive` runs to react to it.",
      },
      {
        t: "list",
        items: [
          "**Runtime-registered**: you register in code (`registerReceiver`) tied to a component's lifecycle, and must unregister to avoid leaks. Only active while registered — preferred for most cases.",
          "**Manifest-declared (static)**: declared in the manifest so it can trigger even when the app isn't running — but this is heavily restricted since Android 8 (most implicit broadcasts can't be received statically anymore, to stop apps constantly waking up). A few exceptions like `BOOT_COMPLETED` remain.",
        ],
      },
      {
        t: "p",
        text: "The most important rule: **`onReceive` runs on the main thread and must be fast** (there's about a 10-second limit). It's a *trigger*, not a place to do work — if you need to do real work in response, hand off to WorkManager or a foreground service. Use a BroadcastReceiver to *react* to system events; for *in-app* event communication, don't use broadcasts at all — expose a shared Flow/StateFlow from a repository instead (the old `LocalBroadcastManager` is deprecated).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a ContentProvider and do you always need one?",
    a: [
      {
        t: "p",
        text: "**A ContentProvider exposes an app's structured data to *other apps* through a standard interface (query/insert/update/delete), addressed by a `content://` URI.** It's Android's mechanism for sharing data across app boundaries with permission control. You access providers through a `ContentResolver`.",
      },
      {
        t: "p",
        text: "**No, you don't always need one — and that's the key insight.** You need to *consume* a ContentProvider to read *system* data (contacts, calendar, media store) via `contentResolver`. But you only need to *build* one if you're **sharing your app's data with other apps**. If your data is used only within your own app, a ContentProvider is unnecessary over-engineering — just use a database/repository directly. A related special case is `FileProvider`, a built-in ContentProvider for securely sharing *files* with other apps via `content://` URIs (required since Android 7 forbade sharing raw `file://` paths). One piece of trivia worth knowing: ContentProviders initialize very early in app startup, which libraries like Firebase and AndroidX App Startup exploit to auto-initialize themselves — so if you see a provider in the merged manifest you didn't add, that's usually why.",
      },
    ],
  },
  {
    level: "senior",
    q: "When would you use a foreground Service versus WorkManager?",
    a: [
      {
        t: "p",
        text: "**The distinction is immediate-and-user-visible versus deferrable-and-guaranteed.** A *foreground service* is for work that must run *right now* and that the *user is aware of* — it shows a persistent notification. WorkManager is for work that can be *deferred*, must be *guaranteed* to eventually run (surviving process death and reboots), and may have *constraints*.",
      },
      {
        t: "list",
        items: [
          "**Use a foreground service when**: the work is ongoing and user-facing and must run immediately and continuously — music playback, turn-by-turn navigation, an active workout tracker, a live location share, a file upload the user is actively watching. The notification is mandatory precisely because the work is user-visible and consumes resources. It runs until you stop it (or the user does).",
          "**Use WorkManager when**: the work is deferrable and must be *reliable* — syncing data, uploading logs, periodic backups, processing that should happen 'sometime soon' under conditions (on Wi-Fi, while charging). WorkManager persists the work request in a database, so it survives the app being killed and even device reboots, and it retries on failure with backoff. It respects Doze/battery restrictions and enforces constraints.",
          "**They're not mutually exclusive**: WorkManager can *itself* run as a long-running foreground worker (`setForeground`) when a task needs to run immediately and show progress — so 'guaranteed AND immediate AND user-visible' work (a large download) is often a WorkManager foreground worker, getting both reliability and immediacy.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: since Android 8's background restrictions, you can't just 'start a background service' for deferred work — the system kills it. So the decision collapses to: is it *immediate + user-visible*? → foreground service. Is it *deferrable + must-not-be-lost*? → WorkManager. And for anything tied to a screen's lifetime, neither — a coroutine in `viewModelScope`. Naming that WorkManager persists across process death/reboot (which a service does not) and that it can escalate to a foreground worker is what demonstrates real understanding.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why are background services and manifest-declared broadcast receivers restricted on modern Android, and what do you use instead?",
    a: [
      {
        t: "p",
        text: "**The restrictions (starting with Android 8 Oreo) exist to fix a systemic battery-and-performance problem: apps were abusing background services and static broadcast receivers to run constantly and wake up on every system event, draining battery and consuming resources even when the user wasn't using them.** A device with dozens of apps each listening for `CONNECTIVITY_CHANGE` and spinning up services on every network blip had terrible battery life. Android clamped down to protect the user.",
      },
      {
        t: "list",
        items: [
          "**Background service restriction**: an app in the background can no longer freely run background services — the system stops them shortly after the app leaves the foreground. This prevents apps from doing indefinite invisible work.",
          "**Implicit broadcast restriction**: apps can no longer register for most *implicit* broadcasts (like `CONNECTIVITY_CHANGE`) in the *manifest* — that was the mechanism for waking up when not running. This stopped the 'every app wakes on every event' storm. Explicitly-targeted broadcasts and a small allowlist (e.g. `BOOT_COMPLETED`) still work statically; runtime-registered receivers still work while the app is active.",
          "**Doze and App Standby** (from Android 6) added further deferral — batching background work into maintenance windows when the device is idle.",
        ],
      },
      {
        t: "list",
        items: [
          "**What to use instead — deferrable guaranteed work → WorkManager**: it batches work respecting Doze/Standby, persists across process death and reboots, and enforces constraints — the sanctioned replacement for 'do work in the background reliably'.",
          "**Immediate user-visible ongoing work → foreground service** (with its notification), which is exempt from the background limits because the user knows about it.",
          "**Reacting to events while the app is active → runtime-registered receiver** (register in `onStart`/`DisposableEffect`, unregister when done). For *in-app* events, don't use broadcasts at all — expose a shared Flow/StateFlow from a repository.",
          "**Waking on connectivity/state to do work → WorkManager constraints** (e.g. a work request that runs when the network is available) rather than a receiver that triggers a service.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: modern Android deliberately made 'run freely in the background' hard because unbounded background execution was the primary cause of poor battery life. The design shift is from 'services + receivers that keep the app awake' to 'declare *what* work you need and *under what conditions*, and let WorkManager schedule it efficiently within the OS's battery-protection rules'. Understanding *why* (battery/UX at the OS level) and the replacement toolset (WorkManager + foreground services + runtime receivers) is the complete answer.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between a started and a bound Service?",
    a: [
      {
        t: "p",
        text: "A *started* Service (`startService`/`startForegroundService`) runs independently until it stops itself (`stopSelf`) or is stopped — for fire-and-forget work. A *bound* Service (`bindService`) provides a client-server interface (via `onBind` returning an `IBinder`) and lives only while clients are bound — for ongoing interaction. A Service can be both.",
      },
      {
        t: "list",
        items: [
          "**Started** — runs until `stopSelf`/`stopService`; independent of callers.",
          "**Bound** — clients `bindService`, communicate via `IBinder`; dies when the last client unbinds.",
          "**Both** — a started+bound service persists until stopped *and* unbound.",
          "**Modern** — most background work should be WorkManager/coroutines, not raw Services.",
        ],
      },
      {
        t: "note",
        text: "Started Service (startService) runs independently until stopSelf/stopService — fire-and-forget. Bound Service (bindService) offers an IBinder client interface and lives only while clients are bound. A service can be both (persists until stopped AND unbound). Prefer WorkManager/coroutines for most background work.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a foreground Service, and what does it require?",
    a: [
      {
        t: "p",
        text: "A *foreground* Service performs user-visible ongoing work (music playback, navigation, active tracking) and must show a *persistent notification* so the user knows it's running. Since Android 8+ you start it with `startForegroundService` and must call `startForeground(id, notification)` within ~5 seconds, and (API 34+) declare a `foregroundServiceType` in the manifest.",
      },
      {
        t: "code",
        title: "Foreground service",
        code: `override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    startForeground(1, buildNotification())   // required promptly
    // do work...
    return START_STICKY
}
// Manifest: <service android:foregroundServiceType="mediaPlayback" />`,
      },
      {
        t: "list",
        items: [
          "**Persistent notification** — mandatory; users can see/stop it.",
          "**`startForegroundService` + `startForeground`** — within ~5s or it crashes (ANR).",
          "**`foregroundServiceType`** — declare the type (API 34+ requires it + permissions).",
          "**Uses** — music, navigation, active location, calls, uploads in progress.",
        ],
      },
      {
        t: "note",
        text: "A foreground Service does user-visible ongoing work (playback, navigation, tracking) with a mandatory persistent notification. Start via startForegroundService + startForeground(id, notification) within ~5s (or crash), and declare foregroundServiceType (required + permission-gated on API 34+). For deferrable work, use WorkManager instead.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you register a BroadcastReceiver, and what are the restrictions?",
    a: [
      {
        t: "p",
        text: "Two ways: *statically* in the manifest (`<receiver>`) — but since Android 8, most implicit broadcasts *can't* be received this way (background execution limits); or *dynamically* via `registerReceiver` in code (tied to a lifecycle, must `unregisterReceiver`). For app-internal events, prefer a `LocalBroadcastManager` replacement like a shared Flow. Explicit broadcasts and a few exempt system broadcasts still work statically.",
      },
      {
        t: "list",
        items: [
          "**Static (manifest)** — most implicit broadcasts blocked since API 26; a few exemptions remain.",
          "**Dynamic (`registerReceiver`)** — works while registered; unregister to avoid leaks.",
          "**`RECEIVER_EXPORTED`/`NOT_EXPORTED`** — required flag on API 34+.",
          "**In-app events** — use Flow/LiveData instead of broadcasts.",
        ],
      },
      {
        t: "note",
        text: "Register a receiver statically (<receiver> — but most implicit broadcasts are blocked since API 26) or dynamically (registerReceiver, tied to lifecycle, must unregister). API 34+ requires RECEIVER_EXPORTED/NOT_EXPORTED. For app-internal events prefer a shared Flow over broadcasts (LocalBroadcastManager is deprecated).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between stopSelf and stopService?",
    a: [
      {
        t: "p",
        text: "`stopSelf()` is called by the Service *itself* to stop when its work is done; `stopService(intent)` is called by a *client* to stop it externally. For started services handling multiple commands, `stopSelf(startId)` stops only if that's the most recent start command (avoiding stopping while newer work is pending).",
      },
      {
        t: "list",
        items: [
          "**`stopSelf()`** — the Service stops itself after finishing work.",
          "**`stopService(intent)`** — a client stops the Service.",
          "**`stopSelf(startId)`** — stop only if `startId` is the latest command (safe with concurrent starts).",
          "**Bound services** — stop when the last client unbinds (not via stopSelf/stopService alone).",
        ],
      },
      {
        t: "note",
        text: "stopSelf() — the Service stops itself when done; stopService(intent) — a client stops it externally. stopSelf(startId) stops only if that's the most recent start command (safe under concurrent starts). Bound services stop when the last client unbinds.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does a bound Service communicate with clients (IBinder, Messenger, AIDL)?",
    a: [
      {
        t: "p",
        text: "A bound Service returns an `IBinder` from `onBind`. For *same-process* binding, a `LocalBinder` exposing the service instance is simplest. For *cross-process* IPC, use a `Messenger` (message-based, serialized, single-threaded) or `AIDL` (for a full method interface with concurrent calls). Most modern apps avoid this in favor of coroutines/Flow within the app.",
      },
      {
        t: "list",
        items: [
          "**`LocalBinder`** — same-process; expose the service directly (simplest).",
          "**`Messenger`** — cross-process, message-based, serialized (one at a time).",
          "**AIDL** — cross-process method interface with concurrency; more complex.",
          "**Modern** — prefer in-app coroutines/Flow; bound-service IPC is niche.",
        ],
      },
      {
        t: "note",
        text: "A bound Service returns an IBinder from onBind: LocalBinder for same-process (expose the instance, simplest), Messenger for cross-process message passing (serialized), AIDL for a full cross-process method interface with concurrency. Most apps avoid this now — use coroutines/Flow in-app; reserve IPC for genuine cross-process needs.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does onStartCommand's return value (START_STICKY etc.) mean?",
    a: [
      {
        t: "p",
        text: "`onStartCommand` returns how the system should behave if it *kills* the Service and later has resources to restart it: `START_STICKY` (recreate the service, but with a null Intent — for ongoing work like playback), `START_NOT_STICKY` (don't recreate unless there's a pending Intent — for work that's fine to skip), and `START_REDELIVER_INTENT` (recreate and redeliver the last Intent — for work that must complete).",
      },
      {
        t: "list",
        items: [
          "**`START_STICKY`** — recreate with null Intent; ongoing services (media).",
          "**`START_NOT_STICKY`** — don't recreate unless a pending Intent; skippable work.",
          "**`START_REDELIVER_INTENT`** — recreate and redeliver the Intent; must-complete work.",
          "**Choose by** — whether restarting and/or redelivering the command makes sense.",
        ],
      },
      {
        t: "note",
        text: "onStartCommand's return controls restart-after-kill: START_STICKY (recreate with null Intent — ongoing like media), START_NOT_STICKY (don't recreate unless pending Intent — skippable), START_REDELIVER_INTENT (recreate + redeliver the last Intent — must-complete). Choose by whether restart/redelivery makes sense.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the modern alternatives to Services and BroadcastReceivers?",
    a: [
      {
        t: "p",
        text: "Because background Services and manifest receivers are restricted, modern apps replace them: *WorkManager* for deferrable guaranteed background work; *coroutines/Flow* for in-app async and eventing (instead of Services and `LocalBroadcastManager`); *foreground Services* only for user-visible ongoing work; and specific APIs (`ConnectivityManager.NetworkCallback`, `AlarmManager` for exact timing) instead of broad system broadcasts.",
      },
      {
        t: "list",
        items: [
          "**WorkManager** — deferrable, guaranteed, constraint-aware background work.",
          "**Coroutines/Flow** — in-app async and events (replace LocalBroadcastManager).",
          "**Foreground Service** — user-visible ongoing work only.",
          "**Targeted APIs** — `NetworkCallback`, `AlarmManager`, lifecycle callbacks over broad broadcasts.",
        ],
      },
      {
        t: "note",
        text: "Modern replacements: WorkManager (deferrable guaranteed work), coroutines/Flow (in-app async + events, replacing Services and LocalBroadcastManager), foreground Services (user-visible ongoing only), and targeted APIs (NetworkCallback, AlarmManager) over broad system broadcasts. Raw background Services/manifest receivers are last resorts.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is JobScheduler, and how does it relate to WorkManager?",
    a: [
      {
        t: "p",
        text: "`JobScheduler` is the framework API for scheduling deferrable background jobs with constraints (network, charging), batching them for battery efficiency. `WorkManager` is the recommended *higher-level* library that wraps JobScheduler (and older mechanisms) — adding guaranteed execution, chaining, observability, and backward compatibility. You almost always use WorkManager, not JobScheduler directly.",
      },
      {
        t: "list",
        items: [
          "**`JobScheduler`** — framework job scheduling with constraints/batching (API 21+).",
          "**`WorkManager`** — wraps it; guarantees, chaining, observability, retro-compat.",
          "**Use WorkManager** — the recommended abstraction for deferrable work.",
          "**Under the hood** — WorkManager picks JobScheduler on modern APIs.",
        ],
      },
      {
        t: "note",
        text: "JobScheduler is the framework API for deferrable constraint-aware jobs (battery-batched). WorkManager is the recommended library wrapping it (and older mechanisms) with guaranteed execution, chaining, observability, and backward compatibility. Use WorkManager; it uses JobScheduler underneath on modern APIs.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the BOOT_COMPLETED receiver used for, and what are its constraints?",
    a: [
      {
        t: "p",
        text: "A `BOOT_COMPLETED` receiver (with the `RECEIVE_BOOT_COMPLETED` permission) runs after the device restarts — the classic use is *rescheduling* work that was lost on reboot (alarms, WorkManager jobs). It's one of the few implicit broadcasts still deliverable to a manifest receiver. Keep its `onReceive` fast (it runs on the main thread with a short window) — just enqueue work, don't do it inline.",
      },
      {
        t: "list",
        items: [
          "**Reschedule after reboot** — alarms, WorkManager (WorkManager auto-reschedules persisted work).",
          "**`RECEIVE_BOOT_COMPLETED` permission** — required.",
          "**Still manifest-deliverable** — an exempt implicit broadcast.",
          "**Keep `onReceive` fast** — enqueue work, don't run it inline (short window, main thread).",
        ],
      },
      {
        t: "note",
        text: "A BOOT_COMPLETED receiver (needs RECEIVE_BOOT_COMPLETED) reschedules work lost on reboot (alarms; WorkManager already auto-reschedules persisted work) — one of the few implicit broadcasts still deliverable to a manifest receiver. Keep onReceive fast (enqueue work, don't run inline — short window, main thread).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you run a long-running task in a Service correctly today?",
    a: [
      {
        t: "p",
        text: "If it's user-visible and immediate, use a *foreground Service*: extend `LifecycleService`, call `startForeground` with a notification, and run the work in `lifecycleScope` (coroutines), calling `stopSelf` when done. If it's deferrable/guaranteed, use *WorkManager* instead. Never do blocking work on the Service's main thread, and always provide the required notification/type for foreground services.",
      },
      {
        t: "code",
        title: "Coroutines in a service",
        code: `class UploadService : LifecycleService() {
    override fun onStartCommand(i: Intent?, f: Int, id: Int): Int {
        super.onStartCommand(i, f, id)
        startForeground(1, notification())
        lifecycleScope.launch { upload(); stopSelf() }   // off main thread
        return START_NOT_STICKY
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Foreground + `LifecycleService`** — visible ongoing work; notification required.",
          "**`lifecycleScope` coroutines** — off the main thread; `stopSelf` when done.",
          "**WorkManager** — for deferrable/guaranteed work instead.",
          "**Type + permission** — declare `foregroundServiceType` (API 34+).",
        ],
      },
      {
        t: "note",
        text: "Long-running work: foreground Service (LifecycleService + startForeground(notification) + lifecycleScope coroutines + stopSelf when done) for user-visible immediate work; WorkManager for deferrable/guaranteed. Never block the Service's main thread; declare foregroundServiceType (API 34+).",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the security considerations for exported components?",
    a: [
      {
        t: "p",
        text: "An *exported* component can be invoked by other apps, so it's an attack surface. Set `android:exported` explicitly (mandatory on API 31+), keep internal components `exported=false`, protect sensitive ones with custom `permission`s, validate all incoming Intent data as untrusted, and be careful with `PendingIntent` mutability and implicit intents that could be intercepted.",
      },
      {
        t: "list",
        items: [
          "**Explicit `android:exported`** — mandatory API 31+; false unless external access is needed.",
          "**Permissions** — guard sensitive exported components.",
          "**Validate input** — treat incoming Intents/URIs as untrusted.",
          "**`PendingIntent` immutable** — and avoid leaking implicit intents.",
        ],
      },
      {
        t: "note",
        text: "Exported components are an attack surface: set android:exported explicitly (mandatory API 31+, false unless needed), protect sensitive ones with permissions, validate incoming Intent data as untrusted, and use FLAG_IMMUTABLE PendingIntents / avoid interceptable implicit intents. Only export what genuinely needs external access.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the manifest, and what does it declare about components?",
    a: [
      {
        t: "p",
        text: "`AndroidManifest.xml` declares the app's components (Activities, Services, Receivers, Providers), their intent filters, the `application` element, permissions requested/defined, hardware/software features, the min/target SDK, and metadata. The system reads it to know what your app can do and how to launch its components — components not declared there can't be started.",
      },
      {
        t: "list",
        items: [
          "**Component declarations** — `<activity>`, `<service>`, `<receiver>`, `<provider>` (+ intent filters).",
          "**Permissions** — `<uses-permission>` and custom `<permission>`.",
          "**App config** — `<application>` (name, theme, backup), features, SDK levels.",
          "**Must declare** — undeclared components can't be instantiated.",
        ],
      },
      {
        t: "note",
        text: "AndroidManifest.xml declares components (Activity/Service/Receiver/Provider + intent filters), permissions, the <application> config, hardware/software features, and SDK levels. The system reads it to know and launch your components — undeclared components can't be started. Manifest merging combines library manifests.",
      },
    ],
  },
  {
    level: "senior",
    q: "What was IntentService, and why is it deprecated?",
    a: [
      {
        t: "p",
        text: "`IntentService` was a Service subclass that ran each incoming Intent sequentially on a *background worker thread* and stopped itself when the queue emptied — a convenient way to do off-main-thread work. It's *deprecated* because of background execution limits (a background app can't reliably start it) and because coroutines + `WorkManager` do the job better with lifecycle awareness and guarantees.",
      },
      {
        t: "list",
        items: [
          "**Background worker thread** — processed Intents serially, auto-stopped.",
          "**Deprecated** — hit background start limits; not lifecycle-aware.",
          "**Replacements** — `WorkManager` (deferrable/guaranteed), or coroutines in a `LifecycleService`.",
          "**`JobIntentService`** — a stopgap; also superseded by WorkManager.",
        ],
      },
      {
        t: "note",
        text: "IntentService ran incoming Intents serially on a background worker thread and self-stopped — convenient but deprecated (background start limits, not lifecycle-aware). Use WorkManager (deferrable/guaranteed) or coroutines in a LifecycleService instead. JobIntentService was a stopgap, also superseded.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a LifecycleService?",
    a: [
      {
        t: "p",
        text: "`LifecycleService` is a Service that implements `LifecycleOwner`, giving it a `Lifecycle` and thus a `lifecycleScope` — so you can launch coroutines that are automatically cancelled when the service is destroyed, and use lifecycle-aware components. It's the modern base class for services that run coroutine-based work.",
      },
      {
        t: "code",
        title: "LifecycleService",
        code: `class SyncService : LifecycleService() {
    override fun onStartCommand(i: Intent?, f: Int, id: Int): Int {
        super.onStartCommand(i, f, id)
        lifecycleScope.launch { sync(); stopSelf() }   // cancelled on destroy
        return START_NOT_STICKY
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`LifecycleOwner` service** — has a `Lifecycle` and `lifecycleScope`.",
          "**Coroutines** — auto-cancelled when the service is destroyed.",
          "**Lifecycle-aware** — can use observers/components.",
          "**Modern base** — for coroutine-driven services.",
        ],
      },
      {
        t: "note",
        text: "LifecycleService is a Service that is a LifecycleOwner — it has a Lifecycle and lifecycleScope, so coroutines launched in it auto-cancel on destroy and it can use lifecycle-aware components. The modern base class for coroutine-based services.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you show and update a foreground Service's notification?",
    a: [
      {
        t: "p",
        text: "Build a notification (on a channel), call `startForeground(id, notification)` to make the service foreground, and to *update* it, build a new notification with the same id and call `NotificationManager.notify(id, updated)` (or `startForeground` again). This is how progress bars for downloads/uploads update while the service runs.",
      },
      {
        t: "code",
        title: "Update the notification",
        code: `startForeground(1, buildNotification(progress = 0))
// later, as work progresses:
notificationManager.notify(1, buildNotification(progress = 50))`,
      },
      {
        t: "list",
        items: [
          "**Notification channel** — required (API 26+).",
          "**`startForeground(id, notification)`** — enter foreground.",
          "**Update** — `notify(id, updated)` with the same id (e.g. progress).",
          "**Remove** — `stopForeground(true/STOP_FOREGROUND_REMOVE)` or stopping the service.",
        ],
      },
      {
        t: "note",
        text: "Build a notification on a channel, startForeground(id, notification) to go foreground, then update with notificationManager.notify(id, updated) using the same id (e.g. progress). Remove via stopForeground(STOP_FOREGROUND_REMOVE) or stopping the service. This drives download/upload progress notifications.",
      },
    ],
  },
  {
    level: "senior",
    q: "What do the bindService flags like BIND_AUTO_CREATE do?",
    a: [
      {
        t: "p",
        text: "`bindService(intent, connection, flags)` takes flags controlling the binding. `BIND_AUTO_CREATE` creates the service if it isn't running (the common choice). Others include `BIND_IMPORTANT` (raise the service's process priority) and `BIND_ABOVE_CLIENT`. You supply a `ServiceConnection` whose `onServiceConnected`/`onServiceDisconnected` give you the `IBinder`.",
      },
      {
        t: "list",
        items: [
          "**`BIND_AUTO_CREATE`** — start the service if needed while bound (usual).",
          "**`BIND_IMPORTANT`** — bump the service process's importance.",
          "**`ServiceConnection`** — receives the `IBinder` on connect.",
          "**Unbind** — `unbindService(connection)` when done (or you leak the binding).",
        ],
      },
      {
        t: "note",
        text: "bindService(intent, connection, flags): BIND_AUTO_CREATE creates the service if not running (usual), BIND_IMPORTANT raises its process priority. A ServiceConnection's onServiceConnected gives the IBinder. Always unbindService(connection) when done or you leak the binding (and keep the service alive).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you communicate from a Service to the UI?",
    a: [
      {
        t: "p",
        text: "Modern approach: expose state from the service via a *shared observable* the UI can collect — a `StateFlow`/`SharedFlow` in a repository or a bound service's exposed flow, or update a data source (DB/DataStore) the UI already observes. Avoid broadcasts for this. For a bound service, the UI can call methods and collect flows; for a started service, route through a shared repository.",
      },
      {
        t: "list",
        items: [
          "**Shared observable** — a repository `StateFlow`/`SharedFlow` the UI collects.",
          "**Bound service** — expose flows/methods via the `IBinder`.",
          "**Data source** — update Room/DataStore the UI already observes.",
          "**Avoid broadcasts** — for in-app service→UI communication.",
        ],
      },
      {
        t: "note",
        text: "Service → UI: expose state via a shared observable (repository StateFlow/SharedFlow the UI collects) or update a data source (DB/DataStore) the UI observes. A bound service can expose flows/methods via its IBinder. Avoid broadcasts for in-app communication.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a wakelock, and when do you need one?",
    a: [
      {
        t: "p",
        text: "A `WakeLock` (via `PowerManager`) keeps the CPU (or screen) awake so work continues while the device would otherwise sleep. You rarely need one directly — WorkManager and foreground services manage wake state for you. If you must, use a `PARTIAL_WAKE_LOCK` for the *shortest* time and always release it (a held wakelock drains the battery — a common bug).",
      },
      {
        t: "list",
        items: [
          "**`WakeLock`** — keep CPU/screen awake during work.",
          "**Rarely needed** — WorkManager/foreground services handle it.",
          "**`PARTIAL_WAKE_LOCK`** — CPU only; acquire briefly, release promptly.",
          "**Leak = battery drain** — a forgotten wakelock keeps the device awake.",
        ],
      },
      {
        t: "note",
        text: "A WakeLock (PowerManager) keeps the CPU/screen awake during work. You rarely need it directly — WorkManager and foreground services manage wake state. If required, use PARTIAL_WAKE_LOCK for the shortest time and always release it; a held wakelock drains the battery (a classic bug).",
      },
    ],
  },
  {
    level: "senior",
    q: "What restrictions apply to starting a foreground service from the background (API 31+)?",
    a: [
      {
        t: "p",
        text: "On Android 12 (API 31), apps generally *can't start a foreground service while in the background* — attempting it throws `ForegroundServiceStartNotAllowedException`. There are exemptions (a high-priority FCM message, an exact alarm, the user interacting). For deferrable background-initiated work, use `WorkManager` (which can run expedited work as a foreground job under the hood) instead.",
      },
      {
        t: "list",
        items: [
          "**API 31+ restriction** — can't start a foreground service from the background (with exemptions).",
          "**Exception** — `ForegroundServiceStartNotAllowedException` if you violate it.",
          "**Exemptions** — high-priority FCM, exact alarm, recent user interaction, etc.",
          "**Use WorkManager** — expedited work handles background-triggered tasks compliantly.",
        ],
      },
      {
        t: "note",
        text: "API 31+ generally forbids starting a foreground service while backgrounded (throws ForegroundServiceStartNotAllowedException), with exemptions (high-priority FCM, exact alarm, recent user interaction). For background-triggered deferrable work, use WorkManager (expedited work runs as a foreground job compliantly).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you observe connectivity changes without a broadcast receiver?",
    a: [
      {
        t: "p",
        text: "Use `ConnectivityManager.registerNetworkCallback` (or `registerDefaultNetworkCallback`) with a `NetworkCallback` — it delivers `onAvailable`/`onLost`/`onCapabilitiesChanged` for the network(s) you care about. This replaced the deprecated `CONNECTIVITY_ACTION` broadcast, and you typically wrap it in a `callbackFlow` to expose connectivity as a Flow.",
      },
      {
        t: "code",
        title: "Connectivity as a Flow",
        code: `fun connectivity(cm: ConnectivityManager): Flow<Boolean> = callbackFlow {
    val cb = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(n: Network) { trySend(true) }
        override fun onLost(n: Network) { trySend(false) }
    }
    cm.registerDefaultNetworkCallback(cb)
    awaitClose { cm.unregisterNetworkCallback(cb) }
}`,
      },
      {
        t: "list",
        items: [
          "**`registerNetworkCallback`** — `onAvailable`/`onLost`/`onCapabilitiesChanged`.",
          "**Replaces `CONNECTIVITY_ACTION`** — the deprecated connectivity broadcast.",
          "**`callbackFlow`** — expose connectivity as a Flow; `unregister` in `awaitClose`.",
          "**WorkManager** — has network constraints built in for background work.",
        ],
      },
      {
        t: "note",
        text: "Use ConnectivityManager.registerNetworkCallback (or registerDefaultNetworkCallback) with a NetworkCallback (onAvailable/onLost/onCapabilitiesChanged) — replacing the deprecated CONNECTIVITY_ACTION broadcast. Wrap it in a callbackFlow to expose connectivity as a Flow (unregister in awaitClose). WorkManager has network constraints for background work.",
      },
    ],
  },
  {
    level: "junior",
    q: "What was LocalBroadcastManager, and what replaces it?",
    a: [
      {
        t: "p",
        text: "`LocalBroadcastManager` let you send broadcasts *within your own app* (not exposed to other apps) — a common pattern for in-app eventing. It's *deprecated* because it mixes the observer pattern awkwardly with the broadcast system. Replace it with app-architecture observables: a `SharedFlow`/`LiveData` in a shared ViewModel/repository that components observe.",
      },
      {
        t: "list",
        items: [
          "**In-app broadcasts** — no cross-app exposure.",
          "**Deprecated** — awkward pattern; better tools exist.",
          "**Replacement** — `SharedFlow`/`StateFlow` (or LiveData) in a shared component.",
          "**Benefits** — type-safe, lifecycle-aware, testable, no Intent plumbing.",
        ],
      },
      {
        t: "note",
        text: "LocalBroadcastManager sent in-app-only broadcasts for eventing — deprecated (awkward observer-over-broadcast pattern). Replace with a SharedFlow/StateFlow (or LiveData) in a shared ViewModel/repository that components observe — type-safe, lifecycle-aware, testable, no Intent plumbing.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the Storage Access Framework / DocumentsProvider for?",
    a: [
      {
        t: "p",
        text: "The Storage Access Framework (SAF) lets your app access files the user picks from *any* provider (local storage, Google Drive, etc.) via a system picker — using `ACTION_OPEN_DOCUMENT`/`ACTION_CREATE_DOCUMENT`. A `DocumentsProvider` is how a storage backend *exposes* its files to SAF. SAF is the scoped-storage-friendly way to read/write user-selected files without broad storage permissions.",
      },
      {
        t: "list",
        items: [
          "**SAF** — user picks files from any provider via a system picker.",
          "**`ACTION_OPEN_DOCUMENT`/`ACTION_CREATE_DOCUMENT`** — pick/create, returns a `content://` URI.",
          "**`DocumentsProvider`** — expose a storage backend to SAF.",
          "**Scoped storage** — access user-chosen files without broad `READ/WRITE_EXTERNAL_STORAGE`.",
        ],
      },
      {
        t: "note",
        text: "The Storage Access Framework lets the user pick files from any provider via a system picker (ACTION_OPEN_DOCUMENT/CREATE_DOCUMENT → content:// URI); a DocumentsProvider exposes a storage backend to SAF. It's the scoped-storage-friendly way to read/write user-selected files without broad storage permissions.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are app shortcuts, and how do you create them?",
    a: [
      {
        t: "p",
        text: "App shortcuts are quick actions exposed on long-press of the launcher icon (or via Assistant). *Static* shortcuts are defined in an XML resource; *dynamic* shortcuts are added at runtime via `ShortcutManager`/`ShortcutManagerCompat` (push based on user behavior); *pinned* shortcuts the user places on the home screen. Each shortcut is an Intent into a specific screen.",
      },
      {
        t: "list",
        items: [
          "**Static** — declared in a shortcuts XML resource.",
          "**Dynamic** — `ShortcutManagerCompat.pushDynamicShortcut(...)` at runtime.",
          "**Pinned** — user-placed on the home screen.",
          "**Each = an Intent** — deep-links into a specific screen.",
        ],
      },
      {
        t: "note",
        text: "App shortcuts are quick actions on the launcher icon long-press: static (XML resource), dynamic (ShortcutManagerCompat.pushDynamicShortcut at runtime, based on behavior), and pinned (user-placed). Each shortcut is an Intent deep-linking into a specific screen. Also feeds Assistant/Google shortcuts.",
      },
    ],
  },
  {
    level: "senior",
    q: "What determines an Android component's lifetime versus the process lifetime?",
    a: [
      {
        t: "p",
        text: "A component's lifetime (an Activity's create→destroy, a Service's start→stop) is managed by the system based on user interaction and your calls. The *process* lifetime is separate and coarser — the OS keeps the process alive based on its importance (running components) and kills it under memory pressure. A component can be destroyed while the process lives on (cached), and the process can be killed independently, skipping `onDestroy`.",
      },
      {
        t: "list",
        items: [
          "**Component lifetime** — driven by user actions and your start/stop/finish calls.",
          "**Process lifetime** — OS-managed by importance; killed under memory pressure.",
          "**Decoupled** — a destroyed component can leave the process cached; process death can skip `onDestroy`.",
          "**Implication** — save state (don't rely on `onDestroy`); design for process death.",
        ],
      },
      {
        t: "note",
        text: "Component lifetime (Activity create→destroy, Service start→stop) is driven by user actions/your calls; process lifetime is coarser, OS-managed by importance and killed under memory pressure. They're decoupled — a component can be destroyed while the process is cached, and process death can skip onDestroy. Save state; design for process death.",
      },
    ],
  },
];

export default qa;
