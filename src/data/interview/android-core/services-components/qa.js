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
];

export default qa;
