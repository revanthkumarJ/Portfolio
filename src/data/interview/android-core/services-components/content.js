// Services, Receivers & Providers — Content tab. Teaching-first.

const content = [
  {
    heading: "The four app components — a quick map",
    blocks: [
      {
        t: "p",
        text: "Android apps are built from four types of **components**, each an entry point the system can start: **Activity** (a screen — covered separately), **Service** (long-running background work with no UI), **BroadcastReceiver** (responds to system/app-wide events), and **ContentProvider** (shares data between apps). This topic covers the latter three. All are declared in the manifest (except some runtime-registered receivers), and the system can instantiate any of them.",
      },
    ],
  },
  {
    heading: "Services — background work without UI",
    blocks: [
      {
        t: "p",
        text: "A **Service** is a component for work that should continue *without a UI*, potentially when the user isn't in the app. Important modern caveat: a Service does **not** automatically run on a background thread — it runs on the main thread by default, so you still move work to a background thread/coroutine yourself. There are three flavors:",
      },
      {
        t: "table",
        headers: ["Type", "What it is", "Use for"],
        rows: [
          ["Foreground service", "runs with a persistent notification; user-visible ongoing work", "music playback, navigation, active file upload, fitness tracking"],
          ["Background service", "runs without a notification (heavily restricted since Android 8)", "mostly deprecated — use WorkManager instead"],
          ["Bound service", "other components bind to it and call its methods (client-server)", "an in-app API surface, IPC via AIDL"],
        ],
      },
      {
        t: "list",
        items: [
          "**Foreground service** — for ongoing, *user-aware* work. It must show a persistent notification (so the user knows it's running) and, since Android 10+, declare a `foregroundServiceType`. This is the correct tool for music, navigation, an in-progress upload the user is watching.",
          "**Background services are heavily restricted**: since Android 8 (Oreo), the system kills background services shortly after the app leaves the foreground. So 'just start a Service to do background work' no longer works — for deferrable/guaranteed background work you use **WorkManager**, and for immediate user-visible work you use a foreground service.",
          "**Bound service** — components `bindService()` to it and get an interface to call; the service lives while bound. Used for a client-server relationship within an app, or cross-process IPC (via AIDL). `startService`/`stopService` (started services) vs `bindService`/`unbindService` (bound) are the two interaction models.",
          "**Lifecycle**: started services have `onStartCommand`; bound services have `onBind`. The return value of `onStartCommand` (`START_STICKY` etc.) tells the system whether to recreate the service if killed.",
        ],
      },
    ],
  },
  {
    heading: "Choosing the right background tool",
    blocks: [
      {
        t: "table",
        headers: ["Need", "Tool"],
        rows: [
          ["Ongoing user-visible work (music, navigation)", "Foreground Service"],
          ["Deferrable, guaranteed work (sync, upload) surviving process death/reboot", "WorkManager"],
          ["Short async tied to a screen", "coroutine in viewModelScope"],
          ["Exact-time work (alarm, reminder)", "AlarmManager"],
          ["In-app client-server / IPC", "Bound Service (AIDL for cross-process)"],
        ],
      },
      {
        t: "note",
        text: "The single most common Services interview question is 'when do you use a Service vs WorkManager?' Answer: a foreground service for *ongoing, immediate, user-visible* work (must show a notification); WorkManager for *deferrable, guaranteed* work that must survive process death and reboots (it internally uses a foreground service when needed). Plain background services are effectively deprecated by the Android 8+ restrictions.",
      },
    ],
  },
  {
    heading: "BroadcastReceivers — responding to events",
    blocks: [
      {
        t: "p",
        text: "A **BroadcastReceiver** listens for **broadcast** messages — system-wide or app-wide events delivered as Intents. The system broadcasts events like connectivity changes, battery low, boot completed, airplane mode toggled; apps can send custom broadcasts too. A receiver's `onReceive` runs briefly to react.",
      },
      {
        t: "code",
        title: "Two ways to register a receiver",
        code: `// 1) Runtime (context-registered) — tied to a component's lifecycle
val receiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // react — keep it FAST (onReceive runs on main thread, ~10s limit)
    }
}
registerReceiver(receiver, IntentFilter(Intent.ACTION_BATTERY_LOW))
// must unregisterReceiver(receiver) later to avoid leaks

// 2) Manifest-declared (static) — for a few allowed system broadcasts
// <receiver android:name=".BootReceiver" android:exported="true">
//   <intent-filter><action android:name="android.intent.action.BOOT_COMPLETED"/></intent-filter>
// </receiver>`,
      },
      {
        t: "list",
        items: [
          "**Runtime-registered** — you register in code (usually in an Activity/Service) and *must* unregister (in the mirror lifecycle callback) or leak. Only active while registered. Preferred for most cases; in Compose, register/unregister in a `DisposableEffect`.",
          "**Manifest-declared (static)** — declared in the manifest so it can be triggered even when the app isn't running. **Heavily restricted since Android 8**: most implicit broadcasts can no longer be received via manifest declaration (to stop apps waking up constantly). A few exceptions remain (like `BOOT_COMPLETED`).",
          "**`onReceive` must be fast**: it runs on the main thread with a short time limit (~10 seconds); do no heavy work there. For real work, hand off to WorkManager or a foreground service. It's a *trigger*, not a place to do the work.",
          "**Security**: broadcasts can be a vector for attacks — use `exported=false` for internal receivers, permission-protect sensitive broadcasts, and prefer `LocalBroadcastManager` alternatives (now deprecated — use a shared Flow/StateFlow in a repository for in-app events instead).",
        ],
      },
    ],
  },
  {
    heading: "ContentProviders — sharing data across apps",
    blocks: [
      {
        t: "p",
        text: "A **ContentProvider** exposes an app's data to *other apps* through a standard interface (query/insert/update/delete) identified by a `content://` URI. It's Android's mechanism for **structured data sharing across app boundaries** with permission control. You interact with providers via a `ContentResolver`.",
      },
      {
        t: "code",
        title: "Reading from a system ContentProvider (contacts)",
        code: `val cursor = contentResolver.query(
    ContactsContract.Contacts.CONTENT_URI,   // content:// URI
    projection, selection, selectionArgs, sortOrder
)
cursor?.use { while (it.moveToNext()) { /* read columns */ } }`,
      },
      {
        t: "list",
        items: [
          "**When you consume one**: to read *system* data — contacts, calendar, media store, call log — you query the relevant system ContentProvider via `contentResolver` (with the right runtime permission).",
          "**When you build one**: to *share your app's data with other apps* (e.g. a dictionary app exposing definitions), or historically to feed certain framework features. If your data is *only* used within your own app, you generally *don't* need a ContentProvider — use a database/repository directly. Building one just for internal use is over-engineering.",
          "**`FileProvider`** — a special ContentProvider for securely sharing *files* with other apps via `content://` URIs (instead of exposing raw `file://` paths, which is forbidden since Android 7). Used for sharing images, PDFs, camera output.",
          "**A hidden role**: ContentProviders are initialized very early in app startup (before `Application.onCreate` in some cases), which libraries exploit to auto-initialize themselves (the AndroidX `App Startup` library and Firebase use a ContentProvider to bootstrap without you writing init code) — a piece of trivia that explains 'why is there a provider I didn't add?'.",
        ],
      },
    ],
  },
  {
    heading: "Manifest, exported, and component security",
    blocks: [
      {
        t: "list",
        items: [
          "**All components are declared in the manifest** (except runtime-registered receivers) — `<activity>`, `<service>`, `<receiver>`, `<provider>`. The manifest is how the OS knows what your app contains and can launch.",
          "**`android:exported`** — whether *other apps* can start/access the component. Since Android 12, you *must* explicitly set it for any component with an intent filter. Default to `exported=false` unless the component genuinely needs to be reachable by other apps (a shared provider, a public deep-link Activity) — an exported component is an attack surface.",
          "**Permissions** — components can be protected by permissions (`android:permission`) so only callers holding that permission can access them. Providers can enforce read/write permissions separately.",
        ],
      },
    ],
  },
];

export default content;
