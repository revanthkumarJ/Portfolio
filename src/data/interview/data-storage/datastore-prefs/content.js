// DataStore & SharedPreferences — Content tab. Teaching-first.

const content = [
  {
    heading: "The problem: storing small key-value data",
    blocks: [
      {
        t: "p",
        text: "Apps need to store small pieces of data — user settings, a theme choice, an auth token, a 'has the user seen onboarding' flag, the last-selected tab. This is too small and simple for a database. Android's tools for this are **SharedPreferences** (the old way) and **DataStore** (the modern replacement). Both store key-value data, but DataStore fixes serious flaws in SharedPreferences.",
      },
    ],
  },
  {
    heading: "SharedPreferences and its problems",
    blocks: [
      {
        t: "p",
        text: "**SharedPreferences** is the classic API: a simple key-value store backed by an XML file, accessed synchronously. It works, but it has well-known flaws that DataStore was created to solve:",
      },
      {
        t: "code",
        title: "SharedPreferences — simple but flawed",
        code: `val prefs = context.getSharedPreferences("settings", Context.MODE_PRIVATE)
prefs.edit().putString("theme", "dark").apply()   // async write
val theme = prefs.getString("theme", "light")     // SYNCHRONOUS read — on main thread!`,
      },
      {
        t: "list",
        items: [
          "**Synchronous API that can block the main thread**: reads (`getString`) are synchronous, and the first access to a SharedPreferences file loads and parses the entire XML *on the calling thread* — often the main thread — which can cause jank or ANRs (a documented source of ANRs).",
          "**`apply()` vs `commit()` gotcha**: `commit()` writes synchronously (blocks); `apply()` writes asynchronously but can still cause issues (it blocks the main thread on `fsync` during certain lifecycle events like `onPause`).",
          "**No error signaling**: if a write fails, you don't find out — errors are silently swallowed.",
          "**No type safety**: keys are strings, values are untyped — easy to mismatch a key or type at runtime.",
          "**Not reactive**: to observe changes you register an `OnSharedPreferenceChangeListener` (clunky, error-prone) — there's no Flow of updates.",
          "**Runtime exceptions on parse errors / not transactional**: partial updates are possible; no strong consistency guarantees.",
        ],
      },
    ],
  },
  {
    heading: "DataStore — the modern replacement",
    blocks: [
      {
        t: "p",
        text: "**DataStore** is Jetpack's modern key-value (and typed) storage, built on **Kotlin coroutines and Flow**. It stores data asynchronously, exposes it as a `Flow` (reactive), handles errors, and never blocks the main thread. It comes in two flavors: **Preferences DataStore** (key-value, like SharedPreferences but better) and **Proto DataStore** (typed, schema-defined with Protocol Buffers).",
      },
      {
        t: "code",
        title: "Preferences DataStore",
        code: `// Define the DataStore (once, as a top-level property)
val Context.dataStore by preferencesDataStore(name = "settings")
private val THEME_KEY = stringPreferencesKey("theme")

// READ — a Flow that emits on every change (async, main-safe)
val themeFlow: Flow<String> = context.dataStore.data
    .map { prefs -> prefs[THEME_KEY] ?: "light" }

// WRITE — a suspend function (async, transactional, error-aware)
suspend fun setTheme(theme: String) {
    context.dataStore.edit { prefs -> prefs[THEME_KEY] = theme }
}`,
      },
      {
        t: "list",
        items: [
          "**Fully asynchronous & main-safe**: reads are a `Flow` and writes are `suspend` functions — no blocking, no ANR risk. All I/O happens off the main thread via coroutines.",
          "**Reactive by default**: `dataStore.data` is a `Flow` that emits the current value and re-emits on every change — perfect for observing settings in the UI (collect it like any Flow).",
          "**Transactional & consistent**: writes are atomic (via `edit { }`), and DataStore guarantees consistency — no partial/corrupt states.",
          "**Error handling**: reads can surface errors (e.g. `IOException` on a read failure) that you can `catch` in the Flow, rather than silently failing.",
          "**Type-safe keys**: `stringPreferencesKey`, `intPreferencesKey`, etc. give typed keys, reducing runtime mistakes.",
        ],
      },
    ],
  },
  {
    heading: "Preferences DataStore vs Proto DataStore",
    blocks: [
      {
        t: "table",
        headers: ["", "Preferences DataStore", "Proto DataStore"],
        rows: [
          ["Data shape", "key-value pairs (untyped keys)", "a defined schema (typed object) via Protocol Buffers"],
          ["Type safety", "typed keys, but no schema for the whole object", "full type safety — the whole structure is a typed message"],
          ["Setup", "minimal (just define keys)", "more (define a .proto schema + serializer)"],
          ["Best for", "simple, independent settings (theme, flags)", "structured, related settings (a UserPreferences object)"],
        ],
      },
      {
        t: "list",
        items: [
          "**Preferences DataStore** — the direct SharedPreferences replacement: key-value, quick to set up, for loose independent settings. Its limitation: no schema, so you can still typo a key or store the wrong shape.",
          "**Proto DataStore** — stores a *typed object* defined by a Protocol Buffers schema, giving full type safety across the whole structure and validation. More setup (define the `.proto`, a serializer), but ideal when your preferences form a cohesive structured object (all of a user's settings together).",
          "**Choose Preferences DataStore** for simple cases (most apps); **Proto DataStore** when you want a strongly-typed, schema-validated settings object.",
        ],
      },
    ],
  },
  {
    heading: "When to use what — the storage decision",
    blocks: [
      {
        t: "table",
        headers: ["Data", "Storage"],
        rows: [
          ["Small key-value settings, flags, tokens", "DataStore (Preferences or Proto)"],
          ["Structured, queryable, relational data (lists, entities)", "Room"],
          ["Large files, images, media", "the file system (internal/external storage)"],
          ["Legacy code already using it", "SharedPreferences (migrate to DataStore over time)"],
        ],
      },
      {
        t: "list",
        items: [
          "**DataStore for settings, Room for data**: DataStore is for a *handful* of key-value settings, not for structured or large data — you can't query it, and it loads everything into memory. Lists of entities, anything you filter/sort/relate → Room.",
          "**Migration path**: DataStore provides a `SharedPreferencesMigration` to import existing SharedPreferences data into DataStore automatically, so you can migrate legacy prefs cleanly.",
          "**Not for secrets in plaintext**: DataStore/SharedPreferences store data unencrypted by default. For sensitive data (tokens, keys), use encryption — `EncryptedSharedPreferences`, or encrypt values before storing, or the Android Keystore for keys.",
        ],
      },
      {
        t: "note",
        text: "The comparison to nail: SharedPreferences is synchronous (can block the main thread → ANRs), swallows errors, and isn't reactive. DataStore is coroutine/Flow-based — fully async and main-safe, reactive (data is a Flow), transactional, and error-aware. Preferences DataStore = key-value replacement; Proto DataStore = typed schema. Use DataStore for small settings, Room for structured data, files for large blobs. DataStore is the recommended modern choice.",
      },
    ],
  },
];

export default content;
