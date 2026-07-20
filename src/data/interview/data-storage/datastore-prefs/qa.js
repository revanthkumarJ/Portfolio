// DataStore & SharedPreferences — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is SharedPreferences used for and what are its main problems?",
    a: [
      {
        t: "p",
        text: "**SharedPreferences is a simple key-value store backed by an XML file, used for small pieces of data** — settings, a theme choice, feature flags, an auth token, a 'seen onboarding' flag. It's the classic Android API for lightweight persistent data that's too small for a database.",
      },
      {
        t: "list",
        items: [
          "**Synchronous, can block the main thread**: reads are synchronous, and the first access loads and parses the whole XML file on the calling thread — often the main thread — which is a documented cause of jank and ANRs.",
          "**No error handling**: if a write fails, it's silently swallowed; you have no way to know.",
          "**Not reactive**: observing changes requires a clunky `OnSharedPreferenceChangeListener`; there's no Flow of updates.",
          "**No type safety**: string keys and untyped values make mismatches easy at runtime.",
          "**`apply()` vs `commit()` confusion**: `commit()` blocks; `apply()` is async but can still block on `fsync` during lifecycle events.",
        ],
      },
      {
        t: "p",
        text: "These flaws — especially the main-thread blocking and lack of reactivity — are why Google introduced **DataStore** as the modern replacement. SharedPreferences still works and is fine in legacy code, but new code should use DataStore, which is fully async (coroutines/Flow), reactive, transactional, and error-aware.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is DataStore and how is it better than SharedPreferences?",
    a: [
      {
        t: "p",
        text: "**DataStore is Jetpack's modern key-value (and typed) storage, built on Kotlin coroutines and Flow.** It solves SharedPreferences' problems by being fully asynchronous and reactive: reads are exposed as a `Flow`, and writes are `suspend` functions, so nothing blocks the main thread.",
      },
      {
        t: "list",
        items: [
          "**Fully async & main-safe** — reads (`Flow`) and writes (`suspend`) run off the main thread via coroutines, eliminating the ANR risk SharedPreferences had.",
          "**Reactive** — `dataStore.data` is a `Flow` that emits the current value and re-emits on every change, so you observe settings in the UI like any other Flow (no manual change listeners).",
          "**Transactional & consistent** — writes go through `edit { }` atomically; no partial or corrupt states.",
          "**Error-aware** — read failures surface as catchable errors in the Flow, instead of being silently swallowed.",
          "**Typed keys** — `stringPreferencesKey`, `intPreferencesKey`, etc. reduce runtime key/type mistakes.",
        ],
      },
      {
        t: "code",
        title: "The reactive read + suspend write",
        code: `val theme: Flow<String> = context.dataStore.data.map { it[THEME_KEY] ?: "light" }
suspend fun setTheme(v: String) = context.dataStore.edit { it[THEME_KEY] = v }`,
      },
      {
        t: "p",
        text: "It comes in two forms: **Preferences DataStore** (key-value, the direct SharedPreferences replacement) and **Proto DataStore** (a typed object defined by a Protocol Buffers schema, for full type safety). DataStore is the recommended modern choice for small persistent data.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between Preferences DataStore and Proto DataStore?",
    a: [
      {
        t: "p",
        text: "**Both are DataStore, but they differ in how strongly typed the stored data is.** *Preferences DataStore* stores loose key-value pairs (like SharedPreferences, but async and reactive) — you use typed keys, but there's no schema for the overall data. *Proto DataStore* stores a single *typed object* defined by a Protocol Buffers schema, giving full type safety and validation across the whole structure.",
      },
      {
        t: "list",
        items: [
          "**Preferences DataStore** — minimal setup (just define keys), good for a handful of simple, independent settings (theme, a flag, a token). Its limitation: no schema, so you can still typo a key or store an unexpected shape; the 'object' is just a bag of keys.",
          "**Proto DataStore** — more setup (define a `.proto` schema and a serializer), but the entire stored value is a strongly-typed message, so the compiler enforces the structure and you get validation. Ideal when your preferences form a cohesive, structured object — e.g. a `UserSettings` with several related fields you want to treat as one typed unit.",
        ],
      },
      {
        t: "p",
        text: "**How to choose**: Preferences DataStore for most apps and simple independent settings; Proto DataStore when you want a strongly-typed, schema-validated settings object and are willing to define the schema. The trade-off is setup effort vs type safety — Proto gives more guarantees at the cost of more boilerplate.",
      },
    ],
  },
  {
    level: "junior",
    q: "When would you use DataStore vs Room vs the file system?",
    a: [
      {
        t: "list",
        items: [
          "**DataStore** — for *small key-value settings*: theme, flags, an auth token, last-selected tab, onboarding-seen. A handful of simple values you read and write, not query.",
          "**Room** — for *structured, queryable, relational data*: lists of entities, anything you filter, sort, join, or that has relationships. A cached feed, saved items, a local database of records.",
          "**File system** — for *large files and binary blobs*: images, videos, downloaded documents, cached media. Internal storage (private to your app) or external/scoped storage.",
        ],
      },
      {
        t: "p",
        text: "The decision comes down to the data's shape and size. DataStore holds everything in memory and can't be queried, so it's wrong for lists or large data — a few settings, yes; a hundred cached articles, no (that's Room). Room is for structured data you need to query. Files are for large binary content that doesn't belong in a database or key-value store. A common mistake is stuffing a serialized list into SharedPreferences/DataStore as a JSON string — it works for tiny data but doesn't scale and can't be queried; use Room instead. One more consideration: none of these encrypt data by default, so for sensitive values (tokens) you'd add encryption (EncryptedSharedPreferences, or encrypt before storing, or the Keystore for keys).",
      },
    ],
  },
  {
    level: "senior",
    q: "Why exactly does SharedPreferences cause ANRs, and how does DataStore's design prevent that?",
    a: [
      {
        t: "p",
        text: "**SharedPreferences causes ANRs because of *when and where* its I/O happens: the first read of a preferences file synchronously loads and parses the entire XML file on the calling thread, and certain writes force a synchronous disk sync on the main thread.** The two specific mechanisms:",
      },
      {
        t: "list",
        items: [
          "**Synchronous first load**: `getSharedPreferences` returns immediately, but the XML file is loaded lazily on first *access* (`getString`, etc.), and that load/parse is *blocking*. If it happens on the main thread (common — reading a setting to configure UI), and the file is large or the disk is busy, the main thread blocks. Enough blocking → ANR.",
          "**`apply()` and lifecycle fsync**: `apply()` writes to memory immediately and schedules the disk write asynchronously — but Android *waits* for all pending `apply()` disk writes to complete during certain lifecycle transitions (notably `Activity.onPause`/`onStop` and service commands), *on the main thread*. So a burst of `apply()` calls can turn into a blocking `fsync` at `onPause`, stalling the transition — a well-documented ANR source. `commit()` is even worse (synchronous by design).",
        ],
      },
      {
        t: "list",
        items: [
          "**DataStore's design eliminates both**: it's built on coroutines, so *all* I/O — reads and writes — happens on a background dispatcher (`Dispatchers.IO` internally), never on the main thread. Reads are a `Flow` you collect (suspending, off-main); writes are `suspend` functions (off-main). There is no synchronous main-thread I/O path at all, so the blocking-load and fsync-at-onPause problems simply can't occur.",
          "**No lifecycle-coupled fsync**: because writes are already async coroutine operations that you `await` where appropriate, there's no hidden 'block the main thread at onPause to flush pending writes' behavior.",
          "**Transactional consistency**: DataStore serializes writes through a single actor and guarantees atomic updates, so it also avoids the partial-write/corruption issues SharedPreferences could have — without any main-thread cost.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the SharedPreferences ANR problem isn't 'it's slow', it's that its *synchronous API forces disk I/O onto the main thread* at read time and at lifecycle-coupled flush time. DataStore fixes it at the API level — by making I/O exclusively asynchronous through coroutines, there's no way to accidentally do main-thread disk I/O. That architectural shift (from a synchronous API to a coroutine/Flow-based one) is the whole reason DataStore exists and why it's the recommended replacement, even though for tiny apps the practical ANR risk of SharedPreferences is small.",
      },
    ],
  },
  {
    level: "senior",
    q: "How would you migrate from SharedPreferences to DataStore in a shipping app without losing data?",
    a: [
      {
        t: "p",
        text: "**DataStore provides a built-in `SharedPreferencesMigration` that automatically imports existing SharedPreferences data into DataStore the first time the DataStore is accessed, so you migrate without manual copying or data loss.** You configure the DataStore with the migration, pointing at the old SharedPreferences file(s), and DataStore reads the old values in and (optionally) deletes the old file once migrated.",
      },
      {
        t: "code",
        title: "Configuring the automatic migration",
        code: `val Context.dataStore by preferencesDataStore(
    name = "settings",
    produceMigrations = { context ->
        listOf(SharedPreferencesMigration(context, "old_prefs_name"))
    }
)
// On first access, values from 'old_prefs_name' are copied into DataStore.`,
      },
      {
        t: "list",
        items: [
          "**The migration runs once, lazily**: the first time DataStore's `data` Flow is collected or edited, the migration copies the SharedPreferences keys/values into DataStore, then marks the file as migrated (and can clean it up). Subsequent accesses skip it. So it's transparent and one-time.",
          "**Do it incrementally, not all at once**: in a large app, you don't rewrite every SharedPreferences usage in one PR. Migrate one settings area at a time — set up the DataStore with the migration, switch the *reads and writes* for that area to DataStore, ship, verify, then move to the next. The migration handles the data; you handle the code call sites gradually.",
          "**Watch for concurrent access during transition**: while migrating, make sure code isn't *still writing* to the old SharedPreferences after DataStore has taken over (or those writes would be lost/ignored) — the migration is a one-way import. Route all access for a migrated key through DataStore.",
          "**Test the migration path**: write a test (or manual QA) that starts with a populated old SharedPreferences file, accesses DataStore, and verifies the values came through correctly — since this touches real user settings on update, you want to confirm nothing is dropped or type-mismatched.",
          "**Proto DataStore migration**: if migrating to Proto DataStore, you map the old key-value pairs into the typed proto message in the migration's transform — a bit more work but the same one-time-import mechanism.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the migration itself is a solved problem (`SharedPreferencesMigration` does the data copy safely and once), so the real work is *rolling it out incrementally* — migrating settings area by area, ensuring each migrated key is accessed *only* through DataStore afterward, and testing that existing users' data survives the update. This lets you modernize a shipping app's storage without a risky big-bang rewrite or any user-facing data loss.",
      },
    ],
  },
];

export default qa;
