// Intents, Tasks & Launch Modes — Content tab. Teaching-first.

const content = [
  {
    heading: "Intents — the messaging system",
    blocks: [
      {
        t: "p",
        text: "An **Intent** is a messaging object used to request an action from a component — most commonly to *start an Activity*, but also to start services or deliver broadcasts. It's how components (even across different apps) communicate. There are two kinds: **explicit** (you name the exact component) and **implicit** (you describe *what you want done* and let the system find a component that can do it).",
      },
      {
        t: "code",
        title: "Explicit vs implicit intents",
        code: `// EXPLICIT — you name the target component (within your app)
val intent = Intent(this, DetailActivity::class.java).apply {
    putExtra("itemId", 42)
}
startActivity(intent)

// IMPLICIT — describe an action; the system finds a handler
val share = Intent(Intent.ACTION_SEND).apply {
    type = "text/plain"
    putExtra(Intent.EXTRA_TEXT, "Check this out")
}
startActivity(Intent.createChooser(share, "Share via"))

// Implicit: open a URL — any browser can handle it
startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://example.com")))`,
      },
      {
        t: "list",
        items: [
          "**Explicit intent** — names the target class directly. Used for navigation *within your app* (you know exactly what to launch). Required for starting your own components securely.",
          "**Implicit intent** — specifies an *action* (`ACTION_VIEW`, `ACTION_SEND`, `ACTION_DIAL`), optional *data* (a URI), and *category*; the system matches it against apps' declared `<intent-filter>`s and either launches the handler or shows a chooser. Used for cross-app actions: share, open URL, dial, pick a photo.",
          "**Extras** — key/value data attached via `putExtra`; the receiver reads them from `intent`. Also `data` (a URI) and `flags` (task/launch behavior).",
          "**`PendingIntent`** — a wrapper that lets *another* app or the system fire an intent *on your behalf later* (used by notifications, alarms, widgets). It grants the holder permission to execute your intent.",
        ],
      },
    ],
  },
  {
    heading: "Intent filters — how implicit intents get resolved",
    blocks: [
      {
        t: "p",
        text: "An app declares what implicit intents it can handle via **`<intent-filter>`** elements in the manifest. When an implicit intent is sent, the system matches it against all installed apps' filters by **action**, **data** (scheme/host/mime type), and **category**. If exactly one matches it launches directly; if several match, the user sees a chooser.",
      },
      {
        t: "code",
        title: "Declaring the app can handle a deep link",
        code: `<activity android:name=".ProductActivity">
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" android:host="shop.example.com"
              android:pathPrefix="/product" />
    </intent-filter>
</activity>`,
      },
      {
        t: "list",
        items: [
          "This is how **deep links** work: a URL or notification intent resolves to your Activity because its filter matches. `autoVerify` + a Digital Asset Links file makes it an **App Link** (opens your app directly without a chooser).",
          "The `LAUNCHER` filter (`ACTION_MAIN` + `CATEGORY_LAUNCHER`) is what puts an Activity's icon in the app drawer as the entry point.",
          "Security note: an Activity with an intent filter is **exported** (callable by other apps) unless you set `android:exported=\"false\"` — a common security consideration.",
        ],
      },
    ],
  },
  {
    heading: "Tasks and the back stack",
    blocks: [
      {
        t: "p",
        text: "A **task** is a collection of Activities the user interacts with to accomplish something, arranged in a **back stack** (a stack of Activities). When you launch an Activity, it's normally *pushed* onto the current task's back stack; pressing Back *pops* it. The task is what you see in the Recents/Overview screen. Understanding tasks and the back stack is essential for controlling navigation behavior.",
      },
      {
        t: "list",
        items: [
          "**Default behavior**: `startActivity` pushes the new Activity onto the current task's stack. Back pops to the previous one. Simple LIFO.",
          "**The back stack can contain multiple instances** of the same Activity by default — navigate A → B → A and you have two A instances stacked. Sometimes that's wrong (you want to return to the *existing* A, not create a new one), which is what launch modes and flags control.",
          "**Recents**: each task appears as a card; the OS may destroy Activities within a backgrounded task to reclaim memory (process death), recreating them from saved state when the user returns.",
        ],
      },
    ],
  },
  {
    heading: "Launch modes — controlling how Activities are added to tasks",
    blocks: [
      {
        t: "p",
        text: "**Launch modes** control whether launching an Activity creates a new instance or reuses an existing one, and in which task. Set via `android:launchMode` in the manifest (or Intent flags at runtime). The four modes:",
      },
      {
        t: "table",
        headers: ["Mode", "Behavior"],
        rows: [
          ["`standard` (default)", "always creates a new instance, pushed on the current task — duplicates allowed"],
          ["`singleTop`", "if an instance is already at the TOP of the stack, reuse it (onNewIntent) instead of creating a new one"],
          ["`singleTask`", "only one instance exists in the whole system; if it exists, bring its task forward and clear Activities above it (onNewIntent)"],
          ["`singleInstance`", "like singleTask, but the Activity is the ONLY one in its task — no other Activities can join it"],
        ],
      },
      {
        t: "list",
        items: [
          "**`standard`** — the default; every launch is a new instance. Fine for most screens.",
          "**`singleTop`** — prevents *consecutive duplicates*. If A is on top and you launch A again, the existing one receives the new intent via `onNewIntent()` rather than stacking a second A. Common for a search or notification target you don't want duplicated when already showing.",
          "**`singleTask`** — a *single* system-wide instance; launching it brings its task to the front and clears everything above it in that task. Used for a main/home Activity or a document root — an entry point that should be unique.",
          "**`singleInstance`** — the strictest: sole instance in its own dedicated task, nothing else allowed in that task. Rare — for special standalone screens (e.g. a launcher, some telephony screens).",
        ],
      },
    ],
  },
  {
    heading: "Intent flags — runtime control of task behavior",
    blocks: [
      {
        t: "list",
        items: [
          "**`FLAG_ACTIVITY_NEW_TASK`** — start the Activity in a new task (required when launching from a non-Activity context like a Service or notification).",
          "**`FLAG_ACTIVITY_CLEAR_TOP`** — if the target already exists in the stack, clear all Activities above it and deliver the intent to it (rather than making a new one). Common for 'go back to home and clear the stack'.",
          "**`FLAG_ACTIVITY_SINGLE_TOP`** — the flag equivalent of `singleTop` behavior for this launch.",
          "**`CLEAR_TASK` + `NEW_TASK`** — clear the entire task and start fresh (e.g. logout → return to login with no back-stack history).",
          "Flags let you apply launch behavior *per launch* at runtime, whereas `launchMode` sets it *per Activity* in the manifest. Flags override/augment the manifest mode for that specific launch.",
        ],
      },
      {
        t: "note",
        text: "The essentials: Intents (explicit = name the target, implicit = describe an action for the system to resolve via intent filters); PendingIntent lets others fire your intent later; tasks are back stacks of Activities; launch modes (standard/singleTop/singleTask/singleInstance) and Intent flags (NEW_TASK, CLEAR_TOP, SINGLE_TOP, CLEAR_TASK) control instance reuse and task placement. onNewIntent() delivers intents to a reused instance.",
      },
    ],
  },
];

export default content;
