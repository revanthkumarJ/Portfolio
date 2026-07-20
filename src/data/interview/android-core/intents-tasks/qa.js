// Intents, Tasks & Launch Modes — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is the difference between an explicit and an implicit Intent?",
    a: [
      {
        t: "p",
        text: "**An Intent is a messaging object that requests an action — usually to start an Activity. The difference is whether you name the target or describe what you want done.** An *explicit* intent names the exact component (`Intent(this, DetailActivity::class.java)`) — you know precisely what to launch, used for navigation within your own app. An *implicit* intent describes an *action* (`ACTION_VIEW`, `ACTION_SEND`) and optional data, and lets the system find an app that can handle it.",
      },
      {
        t: "code",
        title: "Both kinds",
        code: `// Explicit — launch a known component
startActivity(Intent(this, DetailActivity::class.java))

// Implicit — 'open this URL', system finds a browser
startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://x.com")))`,
      },
      {
        t: "p",
        text: "Use **explicit** for internal navigation (and it's required for security when starting your own components). Use **implicit** for cross-app actions where you don't care *which* app does it — sharing text, opening a URL, dialing a number, picking a photo. The system matches implicit intents against apps' declared `<intent-filter>`s; if multiple apps can handle it, the user gets a chooser. You attach data with `putExtra` (extras) and the receiver reads it from its `intent`.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is an intent filter?",
    a: [
      {
        t: "p",
        text: "**The concept**: an `<intent-filter>` is a manifest declaration that tells the system *what implicit intents a component can handle*. It specifies an **action** (what to do, like `VIEW` or `SEND`), optional **data** (a URI scheme/host/path or MIME type), and a **category**. When an implicit intent is fired, Android matches it against every app's intent filters to find components that can respond.",
      },
      {
        t: "list",
        items: [
          "**It's how implicit intents get resolved**: your intent says 'ACTION_VIEW this https URL', and any Activity whose filter declares it handles `VIEW` + `https` data becomes a candidate.",
          "**Deep links** use intent filters — declaring a filter for your app's URLs (`scheme=https, host=shop.example.com`) lets those links open your app. Adding `autoVerify` + a Digital Asset Links file makes it an **App Link** that opens directly without a chooser.",
          "**The launcher icon** comes from a special filter: `ACTION_MAIN` + `CATEGORY_LAUNCHER` marks the Activity as the app's entry point in the drawer.",
          "**Security implication**: declaring an intent filter makes the component *exported* (other apps can invoke it) unless you explicitly set `android:exported=\"false\"`.",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "What is a task and the back stack in Android?",
    a: [
      {
        t: "p",
        text: "**The concept**: a *task* is a collection of Activities the user works through to accomplish something, and the *back stack* is how those Activities are arranged — a stack (last-in, first-out). When you launch an Activity, it's pushed onto the current task's back stack; pressing the Back button pops the top one, returning to the previous. A task is what appears as a card in the Recents/Overview screen.",
      },
      {
        t: "p",
        text: "By default it's simple LIFO: navigate A → B → C and the stack is [A, B, C]; Back takes you C → B → A. One thing to know is that, by default, launching an Activity *always creates a new instance* — so A → B → A leaves two separate A instances on the stack. Sometimes that's not what you want (you'd rather return to the existing A), which is exactly what launch modes and Intent flags let you control. Also, when a task is in the background, the system may destroy its Activities to reclaim memory and recreate them from saved instance state when the user returns — which is why saving state matters.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a PendingIntent?",
    a: [
      {
        t: "p",
        text: "**The concept**: a `PendingIntent` is a wrapper around an Intent that you hand to *another* app or the system so *they* can execute it *later, on your behalf* — with your app's identity and permissions. A normal Intent you fire yourself, immediately; a PendingIntent is a 'token' that lets someone else fire your intent at a future time.",
      },
      {
        t: "p",
        text: "**Where it's used**: notifications (when the user taps the notification, the system fires your PendingIntent to open your app), alarms (`AlarmManager` fires it at the scheduled time), app widgets, and any callback where an external component needs to trigger your Activity/Service later. You create it with `PendingIntent.getActivity(...)` / `getBroadcast(...)` / `getService(...)`. Two things to know: on Android 12+ you *must* specify mutability (`FLAG_IMMUTABLE` or `FLAG_MUTABLE`) — usually `FLAG_IMMUTABLE` for security unless something needs to fill in the intent; and flags like `FLAG_UPDATE_CURRENT` control what happens if a matching PendingIntent already exists. The key idea is that it delegates the *permission to execute* your intent to another process safely.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain the four launch modes and when you'd use each.",
    a: [
      {
        t: "p",
        text: "**Launch modes control whether launching an Activity creates a new instance or reuses an existing one, and in which task.** They're set via `android:launchMode` in the manifest.",
      },
      {
        t: "list",
        items: [
          "**`standard`** (default) — every launch creates a *new* instance pushed onto the current task, duplicates allowed. Correct for most screens (a detail screen you can stack multiple of). Use unless you have a reason not to.",
          "**`singleTop`** — if an instance is *already at the top* of the stack, reuse it (its `onNewIntent()` is called) instead of creating a duplicate. Use to avoid consecutive duplicates — e.g. a search results screen or a notification target that shouldn't stack a second copy when it's already showing. Note: it only reuses if the instance is *on top*; if it's lower in the stack, a new one is still created.",
          "**`singleTask`** — only *one* instance can exist system-wide. Launching it brings its task to the front and *clears any Activities above it* in that task (delivering the intent via `onNewIntent()`). Use for a unique entry point — a home/main screen or a document root that should have exactly one instance you return to, not multiple.",
          "**`singleInstance`** — like `singleTask`, but the Activity is the *only* Activity allowed in its task; any Activity it launches goes into a *different* task. The strictest and rarest — for special standalone screens (a launcher, an incoming-call screen) that must be isolated.",
        ],
      },
      {
        t: "p",
        text: "**How to reason about it**: the question is always 'should launching this create a new instance or reuse an existing one, and should it be unique?' Most screens → `standard`. Don't-duplicate-when-on-top → `singleTop`. Unique-entry-point-that-clears-above-it → `singleTask`. Fully-isolated-single-instance → `singleInstance`. A subtle senior point: launch modes interact with Intent *flags* (which apply per-launch at runtime and can override the manifest mode), and `singleTask`/`singleInstance` affect *task affinity* and can produce surprising back-stack behavior, so they should be used deliberately, not casually.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you clear the back stack when a user logs out, returning to the login screen with no history?",
    a: [
      {
        t: "p",
        text: "**You launch the login (or home) Activity with Intent flags that clear the existing task, so the user can't press Back into the now-invalid authenticated screens.** The standard combination is `FLAG_ACTIVITY_NEW_TASK` + `FLAG_ACTIVITY_CLEAR_TASK`, which finishes all Activities in the current task and starts the target as the new root — an empty back stack behind it.",
      },
      {
        t: "code",
        title: "Clearing the stack on logout",
        code: `fun logout() {
    authRepository.clearSession()
    val intent = Intent(this, LoginActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
    }
    startActivity(intent)
    finish()   // finish the current Activity too
}`,
      },
      {
        t: "list",
        items: [
          "**`FLAG_ACTIVITY_CLEAR_TASK`** (requires `NEW_TASK`) — clears the *entire* existing task before starting the target, so nothing remains behind it. Pressing Back from login exits the app, not into the authenticated screens. This is the cleanest logout approach.",
          "**Alternative — `FLAG_ACTIVITY_CLEAR_TOP` + `SINGLE_TOP`**: if login is already lower in the stack, this clears everything above it and reuses it. But `CLEAR_TASK` is more robust for logout because it doesn't depend on login being in the stack.",
          "**In single-Activity / Navigation-component apps**: you'd instead use the Navigation API — `navController.navigate(loginRoute) { popUpTo(0) { inclusive = true } }` (or `popUpTo(nav_graph) { inclusive = true }`) to pop the entire back stack. Same concept (clear history), expressed through Navigation rather than task flags. In Navigation-Compose it's `popUpTo` with `inclusive`.",
          "**Why it matters beyond UX**: leaving authenticated Activities on the back stack after logout is also a *security/privacy* issue — the user (or someone else) could Back-navigate into screens showing personal data from the previous session. Clearing the stack prevents that.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: logout isn't just navigation — it's invalidating a security boundary, so you must ensure no path (Back button, Recents) leads back into authenticated state. `CLEAR_TASK` + `NEW_TASK` (or `popUpTo(inclusive)` in Navigation) enforces that by wiping the history, and you pair it with clearing the session/tokens so even a restored Activity can't show stale authenticated data.",
      },
    ],
  },
];

export default qa;
