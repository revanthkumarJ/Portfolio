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
  {
    level: "junior",
    q: "How do you pass data with an Intent, and what are the size limits?",
    a: [
      {
        t: "p",
        text: "Attach data as *extras* — `intent.putExtra(key, value)` for primitives/String, and `Parcelable`/`Serializable` for objects. Read them with `getStringExtra`/`getParcelableExtra`. But Intent extras travel through Binder (the ~1MB transaction buffer shared per process), so keep them *small* — pass ids, not large objects/bitmaps, or risk `TransactionTooLargeException`.",
      },
      {
        t: "code",
        title: "Intent extras",
        code: `val intent = Intent(this, DetailActivity::class.java).apply {
    putExtra("id", itemId)                       // small primitive
    putExtra("user", user)                       // Parcelable (keep small)
}
startActivity(intent)
// In DetailActivity:
val id = intent.getStringExtra("id")`,
      },
      {
        t: "list",
        items: [
          "**`putExtra`** — primitives, String, `Parcelable`, `Serializable`.",
          "**Prefer `Parcelable`** — faster than `Serializable` on Android (`@Parcelize`).",
          "**Keep small** — Binder ~1MB limit; oversized extras throw `TransactionTooLargeException`.",
          "**Pass ids** — re-fetch large data from cache/DB in the target.",
        ],
      },
      {
        t: "note",
        text: "Attach data as extras (putExtra: primitives/String/Parcelable/Serializable; prefer @Parcelize over Serializable). Extras cross Binder's ~1MB buffer, so keep them small — pass ids, not large objects/bitmaps (else TransactionTooLargeException), and re-fetch big data in the target.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between Parcelable and Serializable for Intent data?",
    a: [
      {
        t: "p",
        text: "Both serialize objects to pass through Intents/Bundles, but `Parcelable` is Android's optimized mechanism (no reflection, much faster, less garbage) while `Serializable` is Java's reflection-based approach (slower, more allocations). Use `Parcelable` — the `@Parcelize` annotation (kotlin-parcelize) generates the boilerplate for you.",
      },
      {
        t: "code",
        title: "@Parcelize",
        code: `@Parcelize
data class User(val id: String, val name: String) : Parcelable   // auto-generated`,
      },
      {
        t: "list",
        items: [
          "**`Parcelable`** — Android-optimized, fast, no reflection; preferred.",
          "**`Serializable`** — Java reflection-based; slower, more GC.",
          "**`@Parcelize`** — generates the `Parcelable` implementation automatically.",
          "**Still keep small** — Parcelable is faster but Binder size limits still apply.",
        ],
      },
      {
        t: "note",
        text: "Parcelable is Android's optimized serialization (no reflection, fast, low GC) — preferred; @Parcelize (kotlin-parcelize) generates it. Serializable is Java's reflection-based approach (slower, more allocations). Use Parcelable, but still keep payloads small (Binder size limits apply either way).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between startActivity and startActivityForResult (now the Result API)?",
    a: [
      {
        t: "p",
        text: "`startActivity` launches another Activity *without* expecting a result back. To *get a result* (a picked photo, a confirmation), you use the modern *Activity Result API* (`registerForActivityResult`) — the old `startActivityForResult`/`onActivityResult` with request codes is deprecated. The Result API gives typed contracts and a callback, and survives recreation.",
      },
      {
        t: "list",
        items: [
          "**`startActivity`** — fire-and-forget launch; no result.",
          "**Activity Result API** — `registerForActivityResult(contract) { result -> }` for results.",
          "**Deprecated** — `startActivityForResult`/`onActivityResult` (request codes).",
          "**Contracts** — `StartActivityForResult`, `GetContent`, `RequestPermission`, custom.",
        ],
      },
      {
        t: "note",
        text: "startActivity launches without expecting a result; for a result use the Activity Result API (registerForActivityResult(contract){result}) — typed contracts + callback, survives recreation. The old startActivityForResult/onActivityResult (request codes) is deprecated.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the common Intent flags, and what do they do?",
    a: [
      {
        t: "p",
        text: "Intent flags modify launch behavior and task/back-stack handling. Key ones: `FLAG_ACTIVITY_NEW_TASK` (launch into a new/existing task — required from non-Activity contexts), `FLAG_ACTIVITY_CLEAR_TOP` (clear activities above the target), `FLAG_ACTIVITY_SINGLE_TOP` (don't recreate if already on top), and `FLAG_ACTIVITY_CLEAR_TASK` (clear the whole task — with NEW_TASK, for logout).",
      },
      {
        t: "code",
        title: "Clearing the stack on logout",
        code: `val intent = Intent(this, LoginActivity::class.java).apply {
    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
}
startActivity(intent)   // new task, old stack cleared`,
      },
      {
        t: "list",
        items: [
          "**`NEW_TASK`** — launch into a new/existing task (required from app/service context).",
          "**`CLEAR_TOP`** — pop activities above an existing target instance.",
          "**`SINGLE_TOP`** — reuse the top instance (delivers via `onNewIntent`).",
          "**`CLEAR_TASK`** (+ NEW_TASK) — wipe the task (logout → login).",
        ],
      },
      {
        t: "note",
        text: "Intent flags modify launch/task behavior: NEW_TASK (into a new/existing task — required from non-Activity contexts), CLEAR_TOP (pop above the target), SINGLE_TOP (reuse top, onNewIntent), CLEAR_TASK+NEW_TASK (wipe the task — logout→login). They mirror launch modes but per-launch.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you use an implicit Intent to open a URL, dial, or share?",
    a: [
      {
        t: "p",
        text: "An implicit Intent declares an *action* and *data*, letting the system pick an app that can handle it. Use `ACTION_VIEW` with a URL/geo/tel URI, `ACTION_DIAL` for the dialer, or `ACTION_SEND` (often wrapped in a chooser) to share text/files. Always check there's a handler or wrap in `try/catch`/`resolveActivity` to avoid `ActivityNotFoundException`.",
      },
      {
        t: "code",
        title: "Implicit intents",
        code: `startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://example.com")))
startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:+123456789")))
val share = Intent(Intent.ACTION_SEND).apply {
    type = "text/plain"; putExtra(Intent.EXTRA_TEXT, "Check this out")
}
startActivity(Intent.createChooser(share, "Share via"))`,
      },
      {
        t: "list",
        items: [
          "**`ACTION_VIEW`** — open URLs, maps (`geo:`), etc.",
          "**`ACTION_DIAL`/`ACTION_SEND`** — dialer / share sheet.",
          "**Chooser** — `Intent.createChooser` to always show the picker.",
          "**Handle no app** — check `resolveActivity` or catch `ActivityNotFoundException`.",
        ],
      },
      {
        t: "note",
        text: "Implicit intents declare an action + data so the system picks a handler: ACTION_VIEW (URLs/geo), ACTION_DIAL (dialer), ACTION_SEND (+ createChooser for the share sheet). Guard against no handler (resolveActivity / catch ActivityNotFoundException). On Android 11+, package visibility may require <queries> in the manifest.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is package visibility, and why do implicit intents sometimes fail on Android 11+?",
    a: [
      {
        t: "p",
        text: "Android 11 (API 30) introduced *package visibility*: your app can no longer see all installed apps by default. So `resolveActivity`/`queryIntentActivities` may return null even when a handler exists, and some implicit intents fail. To query or target specific apps, declare them in a `<queries>` element in the manifest (common actions like `ACTION_VIEW` for https are auto-visible).",
      },
      {
        t: "code",
        title: "<queries> declaration",
        code: `<queries>
    <intent>
        <action android:name="android.intent.action.SEND" />
        <data android:mimeType="image/*" />
    </intent>
    <package android:name="com.some.specific.app" />
</queries>`,
      },
      {
        t: "list",
        items: [
          "**Package visibility (API 30+)** — apps can't enumerate all others by default.",
          "**Symptom** — `resolveActivity` returns null; implicit intent seems to have no handler.",
          "**Fix** — declare `<queries>` (by intent or package) in the manifest.",
          "**Auto-visible** — common web/dial/etc. handlers don't need declaring.",
        ],
      },
      {
        t: "note",
        text: "Android 11+ package visibility hides other installed apps by default, so resolveActivity/queryIntentActivities can return null and implicit intents may fail. Declare the intents/packages you query in a <queries> manifest element (common web/dial handlers are auto-visible).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between singleTop and singleTask launch modes?",
    a: [
      {
        t: "p",
        text: "`singleTop`: if an instance is already at the *top* of the stack, reuse it (deliver via `onNewIntent`) instead of creating a new one; otherwise a new instance is created (can have multiple instances lower in the stack). `singleTask`: only *one* instance exists in the system, at the *root* of its task; launching it brings its task forward and clears activities above it (`onNewIntent`).",
      },
      {
        t: "list",
        items: [
          "**`singleTop`** — reuse only if already on top; multiple instances allowed elsewhere.",
          "**`singleTask`** — a single system-wide instance at its task root; clears above on relaunch.",
          "**`onNewIntent`** — both deliver new intents to the reused instance.",
          "**Uses** — `singleTop` for a screen re-launched from notifications; `singleTask` for a main/entry screen.",
        ],
      },
      {
        t: "note",
        text: "singleTop: reuse the instance only if it's already on TOP (else create new; multiple instances allowed) — onNewIntent. singleTask: exactly one instance system-wide at its task ROOT; relaunch brings the task forward and clears activities above it — onNewIntent. singleTop for notification re-entry; singleTask for a main/entry screen.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the different types of PendingIntent and the mutability flags?",
    a: [
      {
        t: "p",
        text: "A `PendingIntent` wraps an Intent so *another* app/system component can execute it *as your app* later — used for notifications, alarms, widgets. Create one with `getActivity`/`getService`/`getBroadcast`. Since API 31 you *must* specify mutability: `FLAG_IMMUTABLE` (the safe default — the receiver can't modify it) or `FLAG_MUTABLE` (only when the system needs to fill in fields, e.g. inline reply).",
      },
      {
        t: "code",
        title: "PendingIntent with flags",
        code: `val pi = PendingIntent.getActivity(
    context, 0, intent,
    PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
)`,
      },
      {
        t: "list",
        items: [
          "**Types** — `getActivity`, `getService`/`getForegroundService`, `getBroadcast`.",
          "**`FLAG_IMMUTABLE`** — required-ish default; receiver can't alter the intent (security).",
          "**`FLAG_MUTABLE`** — only when the system must fill fields (inline reply, bubbles).",
          "**`FLAG_UPDATE_CURRENT`/`FLAG_CANCEL_CURRENT`** — reuse vs replace an existing PendingIntent.",
        ],
      },
      {
        t: "note",
        text: "A PendingIntent lets another component run an Intent as your app (notifications/alarms/widgets) via getActivity/getService/getBroadcast. Since API 31 you must set mutability: FLAG_IMMUTABLE (safe default) or FLAG_MUTABLE (only when the system fills fields, e.g. inline reply). Use FLAG_UPDATE_CURRENT to reuse/update.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle a deep link that opens a specific screen?",
    a: [
      {
        t: "p",
        text: "Declare an `<intent-filter>` with `ACTION_VIEW`, the `BROWSABLE`/`DEFAULT` categories, and a `<data>` scheme/host (or use Navigation's `<deepLink>`). When a matching URI opens the app, the target Activity receives it via `getIntent()`/`onNewIntent`; you parse the URI to navigate to the right screen and build a sensible back stack (e.g. with `TaskStackBuilder` or Navigation).",
      },
      {
        t: "code",
        title: "Deep link intent filter",
        code: `<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="shop.com" android:pathPrefix="/product" />
</intent-filter>`,
      },
      {
        t: "list",
        items: [
          "**`<intent-filter>` + `<data>`** — declare the URI scheme/host/path.",
          "**App Links** — `autoVerify=\"true\"` + a `.well-known/assetlinks.json` for verified https links (no chooser).",
          "**Parse in the target** — `getIntent().data` / `onNewIntent`.",
          "**Back stack** — build a proper up-stack (Navigation deep links, `TaskStackBuilder`).",
        ],
      },
      {
        t: "note",
        text: "Declare an <intent-filter> (ACTION_VIEW, BROWSABLE/DEFAULT, <data> scheme/host/path), or Navigation's <deepLink>. The target parses getIntent().data/onNewIntent to navigate. Use autoVerify + assetlinks.json for verified App Links (no chooser), and build a proper back stack (Navigation deep links / TaskStackBuilder).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a task, and how does affinity affect it?",
    a: [
      {
        t: "p",
        text: "A *task* is a stack of Activities the user works through for a job (e.g. composing an email), presented as one entry in Recents. *Task affinity* (`android:taskAffinity`) determines which task an Activity prefers to belong to — by default all your Activities share the app's affinity (one task). Changing affinity (with `NEW_TASK`) can place an Activity in a separate task.",
      },
      {
        t: "list",
        items: [
          "**Task** — a back-stack of Activities for one user job; a Recents entry.",
          "**Default affinity** — all app Activities share one task.",
          "**`taskAffinity`** — override which task an Activity joins.",
          "**With `NEW_TASK`** — affinity decides the target task (or a new one).",
        ],
      },
      {
        t: "note",
        text: "A task is a back-stack of Activities for one user job (one Recents entry). Task affinity (android:taskAffinity, default = app package) decides which task an Activity prefers; combined with FLAG_ACTIVITY_NEW_TASK it determines the target/new task. Most apps use one task (default affinity).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you build a proper back stack for a notification or deep link?",
    a: [
      {
        t: "p",
        text: "When a notification/deep link opens a *deep* screen, the user should still be able to press back to a logical parent — so you build a *synthetic back stack*. Use `TaskStackBuilder` (adding the parent chain) or Navigation Component's deep-link support (which constructs the back stack from the graph), rather than dropping the user on an isolated screen with nowhere to go back to.",
      },
      {
        t: "code",
        title: "TaskStackBuilder",
        code: `val pending = TaskStackBuilder.create(context)
    .addNextIntentWithParentStack(Intent(context, DetailActivity::class.java).putExtra("id", id))
    .getPendingIntent(0, PendingIntent.FLAG_IMMUTABLE)`,
      },
      {
        t: "list",
        items: [
          "**Synthetic back stack** — so back goes to a logical parent, not out of the app.",
          "**`TaskStackBuilder`** — `addNextIntentWithParentStack` uses manifest `parentActivityName`.",
          "**Navigation deep links** — build the stack from the nav graph automatically.",
          "**Avoid** — dropping the user on a dead-end screen.",
        ],
      },
      {
        t: "note",
        text: "For a notification/deep link into a deep screen, build a synthetic back stack so back reaches a logical parent — TaskStackBuilder.addNextIntentWithParentStack (uses manifest parentActivityName) or Navigation Component deep links (builds the stack from the graph). Don't strand the user on a dead-end screen.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between sending a broadcast and starting an Activity/Service via Intent?",
    a: [
      {
        t: "p",
        text: "The Intent *action verb* differs: `startActivity` launches a UI screen, `startService`/`startForegroundService` starts a background component, and `sendBroadcast` delivers an event to *any* registered receivers (one-to-many). Broadcasts are for *announcements* (something happened); activities/services are for *doing* something specific.",
      },
      {
        t: "list",
        items: [
          "**`startActivity`** — launch a screen (one target).",
          "**`startService`/`startForegroundService`** — start a background component.",
          "**`sendBroadcast`** — announce an event to many receivers (one-to-many).",
          "**Modern** — prefer in-app events (Flow/LiveData) over broadcasts within your app.",
        ],
      },
      {
        t: "note",
        text: "startActivity launches a screen; startService/startForegroundService starts a background component; sendBroadcast announces an event to any registered receivers (one-to-many). Broadcasts = announcements ('X happened'); activities/services = do a specific thing. Within your app, prefer Flow/LiveData over broadcasts.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is standard versus singleInstance launch mode?",
    a: [
      {
        t: "p",
        text: "`standard` (default) creates a *new instance* every time the Activity is launched, allowing multiple instances across tasks. `singleInstance` is the most restrictive: the Activity is the *sole* member of its *own task* — no other Activities can be placed in that task. Use `singleInstance` rarely, for a self-contained screen that must never share a task (e.g. a launcher, a call screen).",
      },
      {
        t: "list",
        items: [
          "**`standard`** — new instance per launch; multiple instances allowed.",
          "**`singleInstance`** — alone in its own task; nothing else joins that task.",
          "**Rare** — for isolated, self-contained Activities.",
          "**Others** — `singleTop`, `singleTask` sit between these.",
        ],
      },
      {
        t: "note",
        text: "standard (default): new instance every launch, multiple allowed. singleInstance: the Activity is alone in its own task — nothing else joins it. singleInstance is rare (isolated self-contained screens like a launcher/call UI). singleTop/singleTask are the in-between modes.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a sticky intent, and why is it deprecated?",
    a: [
      {
        t: "p",
        text: "A *sticky broadcast* (`sendStickyBroadcast`) stayed around after being sent, so newly-registered receivers could get the last value (e.g. battery status). It's *deprecated* because it has no security (any app can read/modify it) and no delivery guarantees. Instead, query the current state directly (e.g. `registerReceiver(null, filter)` for battery) or use proper state holders.",
      },
      {
        t: "list",
        items: [
          "**Sticky broadcast** — persisted last value for late receivers.",
          "**Deprecated** — no security, no delivery guarantees.",
          "**Battery example** — query via `registerReceiver(null, IntentFilter(ACTION_BATTERY_CHANGED))`.",
          "**Modern** — hold state in a ViewModel/repository, not sticky broadcasts.",
        ],
      },
      {
        t: "note",
        text: "Sticky broadcasts (sendStickyBroadcast) persisted the last value for late receivers (e.g. battery) — deprecated for lacking security and delivery guarantees. Query current state directly (registerReceiver(null, filter)) or hold it in a ViewModel/repository instead.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you launch another app's Activity safely?",
    a: [
      {
        t: "p",
        text: "For a *known* app, use an explicit Intent with its package/component (if you have permission and it's exported). For a *capability* (open a map, share), use an implicit Intent by action — but first check a handler exists (`resolveActivity`, plus `<queries>` on API 30+) and wrap in `try/catch` for `ActivityNotFoundException`. Never assume the target app is installed.",
      },
      {
        t: "list",
        items: [
          "**Explicit** — set package/component for a specific known app (must be exported).",
          "**Implicit** — by action for a capability; check `resolveActivity`.",
          "**`<queries>`** — declare packages/intents to see them on API 30+.",
          "**Guard** — `try/catch` `ActivityNotFoundException`; offer a fallback.",
        ],
      },
      {
        t: "note",
        text: "Known app: explicit Intent with its package/component (must be exported). Capability: implicit Intent by action, but check a handler exists (resolveActivity + <queries> on API 30+) and try/catch ActivityNotFoundException with a fallback. Never assume the target is installed.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between an ordered and a regular broadcast?",
    a: [
      {
        t: "p",
        text: "A *regular* broadcast (`sendBroadcast`) is delivered to all receivers roughly in parallel, with no defined order and no ability to pass results between them. An *ordered* broadcast (`sendOrderedBroadcast`) delivers to receivers *one at a time* by priority, letting each receiver abort the broadcast or pass a result to the next. Ordered broadcasts are heavier and rarely needed in app code.",
      },
      {
        t: "list",
        items: [
          "**Regular** — parallel-ish delivery, no order, no result passing.",
          "**Ordered** — sequential by priority; can abort or pass results.",
          "**Cost** — ordered is slower (serial).",
          "**Modern** — most in-app eventing uses Flow/LiveData, not broadcasts.",
        ],
      },
      {
        t: "note",
        text: "Regular broadcast (sendBroadcast): delivered to all receivers in no defined order, no result passing. Ordered broadcast (sendOrderedBroadcast): sequential by priority, each receiver can abort or pass a result onward (slower). Rarely needed — prefer Flow/LiveData for in-app events.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between getIntent and onNewIntent?",
    a: [
      {
        t: "p",
        text: "`getIntent()` returns the Intent that *originally started* the Activity (available from `onCreate` onward). `onNewIntent(intent)` is called when a *reused* Activity instance (singleTop/singleTask) receives a *new* Intent without being recreated — you must handle it there and call `setIntent(intent)` so subsequent `getIntent()` returns the new one.",
      },
      {
        t: "list",
        items: [
          "**`getIntent()`** — the launching Intent; static for a created instance until updated.",
          "**`onNewIntent`** — new Intent to a reused instance (no recreation).",
          "**`setIntent()`** — update the stored Intent in `onNewIntent`.",
          "**Deep links/notifications** — handle both paths (fresh create + reuse).",
        ],
      },
      {
        t: "note",
        text: "getIntent() returns the Intent that started the Activity (from onCreate on). onNewIntent(intent) fires when a reused instance (singleTop/singleTask) gets a new Intent without recreation — handle it and call setIntent(intent) so getIntent() reflects it. Handle both paths for deep links/notifications.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between an Intent action, data, category, and extras?",
    a: [
      {
        t: "p",
        text: "An Intent is described by several fields: the *action* (what to do, e.g. `ACTION_VIEW`), the *data* (a URI to act on), *categories* (additional hints like `CATEGORY_BROWSABLE`), the *type* (MIME type), the *component* (explicit target), and *extras* (a Bundle of parameters). Implicit-intent resolution matches action + data + category against intent filters.",
      },
      {
        t: "list",
        items: [
          "**Action** — the operation (`ACTION_VIEW`, `ACTION_SEND`).",
          "**Data (URI)** — what to operate on (`https://…`, `tel:…`).",
          "**Category** — extra matching hints (`DEFAULT`, `BROWSABLE`).",
          "**Extras** — parameters (`putExtra`); component — explicit target class.",
        ],
      },
      {
        t: "note",
        text: "Intent fields: action (what to do), data (URI to act on), category (matching hints), type (MIME), component (explicit target), extras (Bundle of params). Implicit resolution matches action + data + category against intent filters; extras carry the payload.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you securely receive an Intent (validate extras, exported components)?",
    a: [
      {
        t: "p",
        text: "Any exported component (Activity/Service/Receiver with an intent filter or `exported=true`) can be launched by *other apps*, so treat incoming Intents as *untrusted input*: validate/sanitize extras, don't blindly trust URIs (guard against path traversal / SSRF), check permissions, and set `android:exported` explicitly (required on API 31+). Keep internal components `exported=false`.",
      },
      {
        t: "list",
        items: [
          "**Exported = attack surface** — other apps can send Intents to it.",
          "**Validate extras/URIs** — never trust incoming data; sanitize.",
          "**`android:exported`** — set explicitly (mandatory API 31+); false for internal-only.",
          "**Permissions** — protect sensitive components with a permission.",
        ],
      },
      {
        t: "note",
        text: "Exported components can be launched by other apps, so treat incoming Intents as untrusted: validate/sanitize extras and URIs (guard path traversal/SSRF), check permissions, and set android:exported explicitly (mandatory on API 31+) — false for internal-only components. Only export what genuinely needs external access.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between finish and finishAffinity?",
    a: [
      {
        t: "p",
        text: "`finish()` closes the *current* Activity, returning to the previous one in the task. `finishAffinity()` closes the current Activity *and all Activities below it with the same task affinity* — effectively exiting the whole task/app flow. Use `finishAffinity` (or `finishAndRemoveTask`) for things like logout or a full exit.",
      },
      {
        t: "list",
        items: [
          "**`finish()`** — close this Activity; go back to the previous.",
          "**`finishAffinity()`** — close this and all same-affinity Activities below.",
          "**`finishAndRemoveTask()`** — finish and remove the task from Recents.",
          "**Uses** — `finishAffinity` for logout/exit flows.",
        ],
      },
      {
        t: "note",
        text: "finish() closes the current Activity (back to the previous). finishAffinity() closes it AND all same-affinity Activities below (exits the flow). finishAndRemoveTask() also removes the task from Recents. Use finishAffinity/CLEAR_TASK for logout/full-exit.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you grant another app temporary access to a file via an Intent?",
    a: [
      {
        t: "p",
        text: "Don't pass a raw `file://` URI (it throws `FileUriExposedException` and isn't accessible to other apps). Instead expose the file through a `FileProvider` to get a `content://` URI, and add `FLAG_GRANT_READ_URI_PERMISSION` to the Intent so the receiving app has temporary, scoped access — used for sharing images, opening PDFs, camera capture.",
      },
      {
        t: "code",
        title: "FileProvider + grant flag",
        code: `val uri = FileProvider.getUriForFile(context, "\${packageName}.fileprovider", file)
val intent = Intent(Intent.ACTION_VIEW).apply {
    setDataAndType(uri, "application/pdf")
    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
}
startActivity(intent)`,
      },
      {
        t: "list",
        items: [
          "**`FileProvider`** — turns a file into a shareable `content://` URI.",
          "**`FLAG_GRANT_READ_URI_PERMISSION`** — temporary scoped access for the receiver.",
          "**No `file://`** — raw file URIs throw `FileUriExposedException`.",
          "**Uses** — sharing images/files, camera capture output, opening documents.",
        ],
      },
      {
        t: "note",
        text: "Expose files via a FileProvider (content:// URI) — never a raw file:// (throws FileUriExposedException) — and add FLAG_GRANT_READ_URI_PERMISSION so the receiving app gets temporary scoped access. Standard for sharing images/files, camera capture, opening documents.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is an intent chooser, and when should you use one?",
    a: [
      {
        t: "p",
        text: "`Intent.createChooser(intent, title)` wraps an implicit Intent so the system *always* shows the app picker (share sheet), even if the user previously set a default. Use it for *sharing* (so the user picks the target each time) and when you want to force the disambiguation dialog rather than silently launching a default handler.",
      },
      {
        t: "code",
        title: "Chooser",
        code: `val send = Intent(Intent.ACTION_SEND).apply { type = "text/plain"; putExtra(Intent.EXTRA_TEXT, text) }
startActivity(Intent.createChooser(send, "Share via"))`,
      },
      {
        t: "list",
        items: [
          "**`createChooser`** — always shows the picker (ignores defaults).",
          "**Sharing** — let the user choose the target each time.",
          "**Force disambiguation** — when multiple handlers should be offered.",
          "**Android Sharesheet** — the modern share UI with direct-share targets.",
        ],
      },
      {
        t: "note",
        text: "Intent.createChooser(intent, title) forces the app picker (share sheet) even if a default is set — use it for sharing (user picks each time) or to force disambiguation. It surfaces the Android Sharesheet with direct-share targets.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do launch modes compare to Intent flags?",
    a: [
      {
        t: "p",
        text: "*Launch modes* (`android:launchMode` in the manifest) set an Activity's default instancing behavior for *all* launches. *Intent flags* (`FLAG_ACTIVITY_*`) set behavior for a *specific* launch at runtime. They overlap (e.g. `singleTop` mode vs `FLAG_ACTIVITY_SINGLE_TOP`); flags give per-launch control, launch modes give a fixed policy. Prefer flags when the behavior is situational.",
      },
      {
        t: "table",
        headers: ["Launch mode", "Similar flag"],
        rows: [
          ["singleTop", "FLAG_ACTIVITY_SINGLE_TOP"],
          ["singleTask", "FLAG_ACTIVITY_NEW_TASK + CLEAR_TOP"],
          ["(clear stack)", "FLAG_ACTIVITY_CLEAR_TASK"],
        ],
      },
      {
        t: "list",
        items: [
          "**Launch mode** — manifest; fixed policy for every launch of that Activity.",
          "**Intent flag** — runtime; per-launch behavior.",
          "**Overlap** — many modes have a flag equivalent.",
          "**Prefer flags** — for situational behavior; modes for an inherent property.",
        ],
      },
      {
        t: "note",
        text: "Launch modes (android:launchMode) set an Activity's default instancing for ALL launches; Intent flags (FLAG_ACTIVITY_*) set behavior per launch at runtime. They overlap (singleTop ↔ FLAG_ACTIVITY_SINGLE_TOP). Use flags for situational behavior, launch modes for an inherent property of the Activity.",
      },
    ],
  },
  {
    level: "senior",
    q: "What does FLAG_ACTIVITY_REORDER_TO_FRONT do?",
    a: [
      {
        t: "p",
        text: "`FLAG_ACTIVITY_REORDER_TO_FRONT` brings an *existing* instance of the target Activity to the *front* of its task (if it's already in the stack) instead of creating a new one — preserving the rest of the stack order below it. It's useful for tab-like or hub navigation where re-selecting a screen should surface the existing instance rather than stacking duplicates.",
      },
      {
        t: "list",
        items: [
          "**Reorders, not recreates** — moves an existing instance to the top.",
          "**Preserves the stack** — other activities keep their relative order.",
          "**vs `CLEAR_TOP`** — that pops (destroys) activities above; REORDER just moves the target up.",
          "**Uses** — hub/tab navigation avoiding duplicate instances.",
        ],
      },
      {
        t: "note",
        text: "FLAG_ACTIVITY_REORDER_TO_FRONT moves an existing instance of the target Activity to the front of its task (no new instance), preserving the rest of the stack — unlike CLEAR_TOP which destroys activities above the target. Good for hub/tab navigation avoiding duplicates.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle receiving shared content from other apps (ACTION_SEND)?",
    a: [
      {
        t: "p",
        text: "Declare an `<intent-filter>` for `ACTION_SEND` (and `ACTION_SEND_MULTIPLE`) with the MIME types you accept, so your app appears in others' share sheets. In the receiving Activity, read the shared content from the Intent — `EXTRA_TEXT` for text, `EXTRA_STREAM` (a content URI) for files/images — and take a persistable URI permission if you need longer access.",
      },
      {
        t: "code",
        title: "Receiving a share",
        code: `<intent-filter>
    <action android:name="android.intent.action.SEND" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="image/*" />
</intent-filter>
// In onCreate:
val uri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
val text = intent.getStringExtra(Intent.EXTRA_TEXT)`,
      },
      {
        t: "list",
        items: [
          "**`<intent-filter>` for `ACTION_SEND`** — with accepted MIME types; you appear in share sheets.",
          "**`EXTRA_TEXT`/`EXTRA_STREAM`** — read the shared text / content URI.",
          "**`ACTION_SEND_MULTIPLE`** — multiple items (`EXTRA_STREAM` as a list).",
          "**URI permission** — you already have temporary read; persist if needed.",
        ],
      },
      {
        t: "note",
        text: "Declare an ACTION_SEND (+ ACTION_SEND_MULTIPLE) intent filter with accepted MIME types to appear in others' share sheets; in the receiver read EXTRA_TEXT (text) or EXTRA_STREAM (content URI for files/images). You get temporary read access — persist the URI permission if you need it longer.",
      },
    ],
  },
];

export default qa;
