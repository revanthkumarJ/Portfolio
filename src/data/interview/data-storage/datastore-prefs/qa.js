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
  {
    level: "junior",
    q: "How do you read and write with Preferences DataStore?",
    a: [
      {
        t: "p",
        text: "Preferences DataStore stores key-value pairs. You *read* by observing `dataStore.data` (a `Flow<Preferences>`) and mapping the key; you *write* with `dataStore.edit { }`, a suspend function that updates atomically. Reads are reactive (emit on change) and writes are transactional.",
      },
      {
        t: "code",
        title: "Read/write",
        code: `val THEME = stringPreferencesKey("theme")
val theme: Flow<String> = context.dataStore.data.map { it[THEME] ?: "system" }
suspend fun setTheme(value: String) {
    context.dataStore.edit { prefs -> prefs[THEME] = value }
}`,
      },
      {
        t: "list",
        items: [
          "**Read** — observe `dataStore.data` (`Flow<Preferences>`), map by key.",
          "**Write** — `edit { prefs[key] = value }` (suspend, atomic).",
          "**Typed keys** — `stringPreferencesKey`, `intPreferencesKey`, etc.",
          "**Reactive** — reads re-emit when values change.",
        ],
      },
      {
        t: "note",
        text: "Preferences DataStore: read by observing dataStore.data (Flow<Preferences>) mapped by a typed key (stringPreferencesKey/intPreferencesKey/…); write with dataStore.edit { prefs[key] = value } (suspend, atomic). Reads are reactive (re-emit on change); no synchronous get.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why is DataStore asynchronous, and what does that mean for reading a value?",
    a: [
      {
        t: "p",
        text: "DataStore is *fully asynchronous* (Flow-based, coroutine-backed) — there's no synchronous `getString` like SharedPreferences. Reading a value means collecting the `Flow` or getting `.first()`; this guarantees you never block the main thread on disk I/O. The trade-off is you can't read a value synchronously in-line; you observe it or suspend.",
      },
      {
        t: "code",
        title: "Getting a one-shot value",
        code: `val theme: String = context.dataStore.data.map { it[THEME] ?: "system" }.first()   // suspend`,
      },
      {
        t: "list",
        items: [
          "**No synchronous get** — always Flow/suspend (no main-thread blocking).",
          "**Observe** — collect the Flow for reactive updates.",
          "**One-shot** — `.first()` (suspend) for a single read.",
          "**Trade-off** — can't read in-line synchronously; must be in a coroutine.",
        ],
      },
      {
        t: "note",
        text: "DataStore is fully async (Flow/coroutine-backed) — no synchronous getString (so it never blocks the main thread on disk). Read reactively by collecting data, or one-shot with .first() (suspend). Trade-off: no in-line synchronous read; you must observe or suspend.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you use Proto DataStore with a typed schema?",
    a: [
      {
        t: "p",
        text: "Proto DataStore stores a *typed object* defined by a Protocol Buffers schema (a `.proto` file), giving compile-time type safety (no stringly-typed keys). You provide a `Serializer` to read/write the proto, then read `dataStore.data` (a `Flow<YourProto>`) and update with `dataStore.updateData { it.toBuilder()... }`. It's ideal for structured settings.",
      },
      {
        t: "code",
        title: "Proto DataStore",
        code: `val settings: Flow<Settings> = context.settingsDataStore.data
suspend fun setDarkMode(enabled: Boolean) {
    context.settingsDataStore.updateData { it.toBuilder().setDarkMode(enabled).build() }
}`,
      },
      {
        t: "list",
        items: [
          "**Typed schema** — a `.proto` defines the structure; no string keys.",
          "**`Serializer`** — you supply read/write of the proto.",
          "**`updateData { }`** — atomic typed update.",
          "**Type safety** — compile-time checked fields vs Preferences' strings.",
        ],
      },
      {
        t: "note",
        text: "Proto DataStore stores a typed object from a Protocol Buffers .proto schema (compile-time type safety, no string keys). Provide a Serializer, read dataStore.data (Flow<Proto>), update with updateData { it.toBuilder()...build() }. Ideal for structured settings; Preferences DataStore for simple key-values.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does DataStore handle concurrent writes and consistency?",
    a: [
      {
        t: "p",
        text: "DataStore serializes writes — `edit`/`updateData` run transactionally and are *ordered*, so concurrent writers don't corrupt data or lose updates (each sees the latest state). Reads always reflect a consistent snapshot. This is a key improvement over SharedPreferences' `apply()`, where concurrent edits and the commit model could race.",
      },
      {
        t: "list",
        items: [
          "**Serialized writes** — transactional and ordered; no lost updates.",
          "**Consistent reads** — always a coherent snapshot.",
          "**No corruption** — safe under concurrency.",
          "**vs SharedPreferences** — its apply/commit model had races and main-thread risks.",
        ],
      },
      {
        t: "note",
        text: "DataStore serializes writes (edit/updateData are transactional and ordered), so concurrent writers don't corrupt data or lose updates, and reads reflect a consistent snapshot. A key improvement over SharedPreferences' apply/commit model, which could race under concurrent edits.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you create a DataStore instance correctly?",
    a: [
      {
        t: "p",
        text: "Create it *once per file* — use the `preferencesDataStore` (or `dataStore`) property delegate at the *top level* (or provide a singleton via DI). Creating multiple DataStore instances for the same file throws (`IllegalStateException`), because DataStore must have a single owner to guarantee consistency.",
      },
      {
        t: "code",
        title: "Single instance",
        code: `// Top-level delegate — one instance per file
val Context.dataStore by preferencesDataStore(name = "settings")
// Or DI:
@Provides @Singleton fun provideDataStore(@ApplicationContext ctx: Context) = ctx.dataStore`,
      },
      {
        t: "list",
        items: [
          "**One instance per file** — via the `preferencesDataStore` delegate (top-level) or DI singleton.",
          "**Multiple instances throw** — DataStore enforces single ownership.",
          "**`applicationContext`** — for the singleton.",
          "**Why** — single owner guarantees consistency/ordering.",
        ],
      },
      {
        t: "note",
        text: "Create one DataStore per file — the top-level preferencesDataStore/dataStore property delegate, or a DI @Singleton. Multiple instances for the same file throw (IllegalStateException) because DataStore requires single ownership to guarantee consistency/ordering.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle read errors (like corrupted data) in DataStore?",
    a: [
      {
        t: "p",
        text: "DataStore surfaces read errors through the `data` Flow. For `IOException`s (corruption, disk issues), catch them with the `catch` operator and emit a default (`emptyPreferences()` or a default proto). For Proto DataStore, provide a `corruptionHandler` in the serializer to recover. Don't let a read error crash the app — degrade to defaults.",
      },
      {
        t: "code",
        title: "Handling read errors",
        code: `context.dataStore.data
    .catch { e -> if (e is IOException) emit(emptyPreferences()) else throw e }
    .map { it[THEME] ?: "system" }`,
      },
      {
        t: "list",
        items: [
          "**Errors via the Flow** — `IOException` on corruption/disk issues.",
          "**`catch` + emit default** — `emptyPreferences()`/default proto.",
          "**`corruptionHandler`** — recover corrupted Proto DataStore.",
          "**Don't crash** — degrade to defaults gracefully.",
        ],
      },
      {
        t: "note",
        text: "DataStore read errors come through the data Flow. Catch IOExceptions with .catch and emit a default (emptyPreferences()/default proto); rethrow other exceptions. For Proto DataStore, provide a corruptionHandler in the serializer. Degrade to defaults — don't let a read error crash the app.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you store a file, and where should app files live?",
    a: [
      {
        t: "p",
        text: "For large binary data (images, downloads, exports), write to the file system. Use *internal storage* (`context.filesDir`, `context.cacheDir`) for app-private files — no permission needed, removed on uninstall. Use `cacheDir` for regenerable data the system can clear under pressure. For user-facing files or sharing, use `MediaStore`/SAF. Never store large blobs in DataStore/Room.",
      },
      {
        t: "code",
        title: "App file storage",
        code: `File(context.filesDir, "report.pdf").writeBytes(bytes)   // private, persists
File(context.cacheDir, "thumb.jpg").writeBytes(bytes)   // private, clearable`,
      },
      {
        t: "list",
        items: [
          "**`filesDir`** — app-private persistent files; no permission; removed on uninstall.",
          "**`cacheDir`** — regenerable data; system can clear it.",
          "**MediaStore/SAF** — user-facing/shared files.",
          "**Not DataStore/Room** — for large blobs use the file system.",
        ],
      },
      {
        t: "note",
        text: "Store large binary data in the file system: filesDir (app-private, persistent, no permission, removed on uninstall), cacheDir (regenerable, system-clearable). Use MediaStore/SAF for user-facing/shared files. Never put large blobs in DataStore/Room — store the file and keep a path/id in the DB.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you store an encrypted value (like an auth token)?",
    a: [
      {
        t: "p",
        text: "Don't store secrets in plain DataStore/SharedPreferences. Use the Android *Keystore* to hold cryptographic keys and encrypt the value before storing it, or use `EncryptedSharedPreferences` (Jetpack Security) / an encrypted DataStore wrapper. The Keystore keeps the key hardware-backed and non-exportable, so even a rooted device can't easily extract it.",
      },
      {
        t: "list",
        items: [
          "**Android Keystore** — hardware-backed key storage; encrypt/decrypt values.",
          "**`EncryptedSharedPreferences`** — Jetpack Security (though maintenance-mode; consider Keystore + DataStore).",
          "**Never plaintext** — tokens/passwords shouldn't be in plain prefs/DataStore.",
          "**Short-lived tokens** — prefer refresh tokens + secure storage over long-lived secrets.",
        ],
      },
      {
        t: "note",
        text: "Never store secrets (tokens) in plain DataStore/SharedPreferences. Use the Android Keystore (hardware-backed, non-exportable keys) to encrypt values before storing, or EncryptedSharedPreferences (Jetpack Security). Prefer short-lived tokens + secure refresh over long-lived plaintext secrets.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you observe and combine multiple DataStore values?",
    a: [
      {
        t: "p",
        text: "Since `dataStore.data` is a `Flow`, map each value out and use `combine` to produce a derived settings object that emits whenever any value changes. Expose it as a `Flow`/`StateFlow` the UI collects — giving reactive, always-current settings without manual synchronization.",
      },
      {
        t: "code",
        title: "Combined settings flow",
        code: `val settings: Flow<Settings> = context.dataStore.data.map { prefs ->
    Settings(
        theme = prefs[THEME] ?: "system",
        notifications = prefs[NOTIFS] ?: true,
    )
}   // one map over all keys — emits when any changes`,
      },
      {
        t: "list",
        items: [
          "**Map the Preferences** — read multiple keys in one `map`.",
          "**Emits on any change** — the whole object re-emits.",
          "**`combine`** — for values across *different* DataStores.",
          "**Expose reactively** — as a Flow/StateFlow the UI collects.",
        ],
      },
      {
        t: "note",
        text: "dataStore.data is a Flow, so map multiple keys into a derived settings object in one map (emits when any key changes), or combine across different DataStores. Expose as a Flow/StateFlow the UI collects — reactive, always-current settings without manual sync.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you clear or remove values from DataStore?",
    a: [
      {
        t: "p",
        text: "In an `edit { }` block, remove a single key with `prefs.remove(key)` or wipe everything with `prefs.clear()`. Both are transactional. For Proto DataStore, `updateData { defaultInstance }` resets to defaults. Use this for logout (clear tokens/user prefs) or a settings reset.",
      },
      {
        t: "code",
        title: "Clearing",
        code: `context.dataStore.edit { prefs ->
    prefs.remove(TOKEN)     // remove one key
    // or prefs.clear()     // remove all
}`,
      },
      {
        t: "list",
        items: [
          "**`prefs.remove(key)`** — delete one value.",
          "**`prefs.clear()`** — wipe all values.",
          "**Proto** — `updateData { defaultInstance }` resets.",
          "**Uses** — logout, settings reset; transactional.",
        ],
      },
      {
        t: "note",
        text: "In edit { }: prefs.remove(key) for one value, prefs.clear() for all (transactional). Proto DataStore: updateData { defaultInstance } resets to defaults. Use for logout (clear token/user prefs) or settings reset.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test code that uses DataStore?",
    a: [
      {
        t: "p",
        text: "Abstract DataStore access behind a repository interface you can fake in unit tests, *or* create a real DataStore backed by a temporary file in a test (using a test `CoroutineScope` and a temp dir) and exercise it with `runTest`. The repository-abstraction approach keeps ViewModel/logic tests fast; the real-DataStore approach tests the actual read/write behavior.",
      },
      {
        t: "list",
        items: [
          "**Repository abstraction** — fake it in unit/ViewModel tests (fast).",
          "**Real DataStore + temp file** — test actual read/write with a temp dir + test scope.",
          "**`runTest`** — drive the coroutines deterministically.",
          "**Clean up** — delete the temp file after.",
        ],
      },
      {
        t: "note",
        text: "Test DataStore either by abstracting it behind a repository interface you fake (fast logic tests), or by creating a real DataStore backed by a temp file with a test CoroutineScope and exercising it under runTest (tests actual read/write). Clean up the temp file after.",
      },
    ],
  },
  {
    level: "junior",
    q: "What data types can Preferences DataStore store?",
    a: [
      {
        t: "p",
        text: "Preferences DataStore supports the same primitives as SharedPreferences: `Int`, `Long`, `Float`, `Double`, `Boolean`, `String`, and `Set<String>` — via typed key factories (`intPreferencesKey`, `stringSetPreferencesKey`, etc.). For structured/complex data (objects, lists), either serialize to a JSON String or use *Proto* DataStore (typed).",
      },
      {
        t: "list",
        items: [
          "**Primitives** — Int/Long/Float/Double/Boolean/String/Set<String>.",
          "**Typed keys** — `intPreferencesKey`, `stringSetPreferencesKey`, etc.",
          "**Complex data** — JSON String, or use Proto DataStore.",
          "**No arbitrary objects** — Preferences is key-value primitives only.",
        ],
      },
      {
        t: "note",
        text: "Preferences DataStore stores primitives (Int/Long/Float/Double/Boolean/String/Set<String>) via typed key factories. For objects/lists, serialize to a JSON String or use Proto DataStore (typed). It's key-value primitives only — no arbitrary objects.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the downsides or limitations of DataStore?",
    a: [
      {
        t: "p",
        text: "DataStore isn't a database: it has *no querying, indexing, or partial updates* — reading always deserializes the whole file, so it's unsuitable for large datasets (performance degrades as the file grows). It's also fully async (no synchronous read), which can be awkward when a value is needed immediately (e.g. very early startup). Use Room for large/queryable data.",
      },
      {
        t: "list",
        items: [
          "**No querying/indexing** — not a database; whole-file read.",
          "**Scales poorly** — large data slows reads (deserialize everything).",
          "**Async only** — no synchronous read (awkward for immediate startup needs).",
          "**Use Room** — for large, queryable, or relational data.",
        ],
      },
      {
        t: "note",
        text: "DataStore isn't a database: no querying/indexing/partial updates (whole-file read/deserialize), so it scales poorly for large data. It's async-only (no synchronous read), awkward when a value is needed immediately (early startup). Use Room for large/queryable/relational data; DataStore for small settings.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you provide a default value when a key is absent?",
    a: [
      {
        t: "p",
        text: "When mapping the `Preferences`, use the Elvis operator to supply a default — `prefs[KEY] ?: default` — since `prefs[KEY]` returns `null` for an absent key. This gives you a sensible value on first launch (before anything is written) without special-casing.",
      },
      {
        t: "code",
        title: "Defaults",
        code: `val fontScale: Flow<Float> = dataStore.data.map { it[FONT_SCALE] ?: 1.0f }
val onboarded: Flow<Boolean> = dataStore.data.map { it[ONBOARDED] ?: false }`,
      },
      {
        t: "list",
        items: [
          "**`prefs[KEY] ?: default`** — absent key returns null; provide a default.",
          "**First launch** — sensible values before any write.",
          "**Consistency** — define defaults in one place (a settings mapper).",
          "**Proto** — defaults come from the schema's default field values.",
        ],
      },
      {
        t: "note",
        text: "Map with prefs[KEY] ?: default — an absent key returns null, so Elvis supplies the default (sensible first-launch values without special-casing). Proto DataStore gets defaults from the schema's default field values. Centralize defaults in a settings mapper.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between DataStore's edit and updateData?",
    a: [
      {
        t: "p",
        text: "`edit { }` is the Preferences DataStore API — it gives you a `MutablePreferences` to set/remove keys. `updateData { }` is the Proto DataStore API — it gives you the current typed object and you return a new one (via the builder). Both are suspend, atomic, and transactional; they differ only by which DataStore flavor you're using.",
      },
      {
        t: "code",
        title: "edit vs updateData",
        code: `// Preferences DataStore
prefsDataStore.edit { it[KEY] = value }
// Proto DataStore
protoDataStore.updateData { current -> current.toBuilder().setField(value).build() }`,
      },
      {
        t: "list",
        items: [
          "**`edit { }`** — Preferences DataStore; mutate a `MutablePreferences`.",
          "**`updateData { }`** — Proto DataStore; return a new typed object.",
          "**Both** — suspend, atomic, transactional.",
          "**Flavor-specific** — same guarantees, different API shape.",
        ],
      },
      {
        t: "note",
        text: "edit { } (Preferences DataStore — mutate MutablePreferences) vs updateData { } (Proto DataStore — return a new typed object via the builder). Both are suspend, atomic, and transactional; they differ only by the DataStore flavor. Same guarantees, different API shape.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does DataStore persist data on disk, and how are writes made durable?",
    a: [
      {
        t: "p",
        text: "DataStore serializes its data to a single file in the app's private directory. Writes are made *durable and atomic* by writing to a *temporary file* and then *renaming* it over the target (an atomic filesystem operation) — so a crash mid-write can't corrupt the existing data (you either have the old or the new file, never a partial one). This is safer than SharedPreferences' XML writes.",
      },
      {
        t: "list",
        items: [
          "**Single file** — in app-private storage (Preferences or serialized proto).",
          "**Write-then-rename** — atomic; a crash can't leave a partial file.",
          "**Durable** — old or new content, never corrupt/partial.",
          "**Safer than SharedPreferences** — which could corrupt on crash.",
        ],
      },
      {
        t: "note",
        text: "DataStore serializes to a single app-private file, making writes atomic/durable via write-to-temp-then-rename (an atomic FS op) — a crash mid-write can't corrupt data (old or new file, never partial). Safer than SharedPreferences' XML writes.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you expose DataStore-backed settings to the UI cleanly?",
    a: [
      {
        t: "p",
        text: "Wrap DataStore in a *repository* that exposes settings as `Flow`s (for reads) and suspend functions (for writes), hiding the DataStore API. The ViewModel collects the flows into UI state and calls the repository's write functions. This keeps DataStore details out of the UI and makes it testable (fake the repository).",
      },
      {
        t: "code",
        title: "Settings repository",
        code: `class SettingsRepository(private val dataStore: DataStore<Preferences>) {
    val theme: Flow<Theme> = dataStore.data.map { Theme.from(it[THEME]) }
    suspend fun setTheme(theme: Theme) { dataStore.edit { it[THEME] = theme.name } }
}`,
      },
      {
        t: "list",
        items: [
          "**Repository** — expose `Flow`s (reads) + suspend functions (writes).",
          "**Hide DataStore** — the UI/ViewModel doesn't touch keys.",
          "**ViewModel** — collect flows into state; call write functions.",
          "**Testable** — fake the repository in tests.",
        ],
      },
      {
        t: "note",
        text: "Wrap DataStore in a repository exposing settings as Flows (reads) + suspend functions (writes), hiding the DataStore API and keys. The ViewModel collects the flows into UI state and calls the write functions. Keeps DataStore out of the UI and is testable (fake the repository).",
      },
    ],
  },
  {
    level: "senior",
    q: "How would you implement feature flags with DataStore or remote config?",
    a: [
      {
        t: "p",
        text: "For *local* flags (user toggles, A/B assignment cache), store them in DataStore behind a repository exposing `Flow<Boolean>` per flag. For *remotely-controlled* flags, use Firebase Remote Config (or your backend), cache the fetched values in DataStore for offline/instant access, and expose a unified flag repository. The UI observes flags reactively so toggling updates immediately.",
      },
      {
        t: "list",
        items: [
          "**Local flags** — DataStore behind a repository (`Flow<Boolean>`).",
          "**Remote flags** — Remote Config/backend, cached in DataStore.",
          "**Unified repository** — one source the app queries.",
          "**Reactive** — observe flags so changes apply without restart.",
        ],
      },
      {
        t: "note",
        text: "Feature flags: local ones in DataStore behind a repository (Flow<Boolean> per flag); remote ones via Firebase Remote Config/backend cached in DataStore for offline/instant access. Expose a unified flag repository the UI observes reactively so toggles apply immediately.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you implement a first-launch or onboarding-completed flag?",
    a: [
      {
        t: "p",
        text: "Store a boolean in DataStore (e.g. `onboarding_completed`) defaulting to `false`. On app start, observe it: if false, show onboarding; when the user finishes, write `true`. Because it's persisted, onboarding shows only once (until data is cleared/reinstalled). Using DataStore (not a runtime variable) makes it survive process death and restarts.",
      },
      {
        t: "code",
        title: "Onboarding flag",
        code: `val onboarded: Flow<Boolean> = dataStore.data.map { it[ONBOARDED] ?: false }
suspend fun completeOnboarding() { dataStore.edit { it[ONBOARDED] = true } }`,
      },
      {
        t: "list",
        items: [
          "**Persisted boolean** — default false; set true on completion.",
          "**Observe at start** — show onboarding while false.",
          "**Survives restart/process death** — because it's persisted.",
          "**Reset** — cleared on app data wipe/reinstall.",
        ],
      },
      {
        t: "note",
        text: "Store onboarding_completed as a persisted boolean (default false); observe it at start to show onboarding while false, and write true on completion. Persistence (DataStore, not a runtime var) means it survives process death/restart and shows only once until data is cleared.",
      },
    ],
  },
  {
    level: "senior",
    q: "What happens to DataStore data on uninstall, clear-data, and auto-backup?",
    a: [
      {
        t: "p",
        text: "DataStore files live in app-private storage, so they're *deleted on uninstall* and on 'Clear data'. They *can* be included in Android *Auto Backup* (cloud backup, restored on reinstall on a new device) unless you exclude them — which matters for sensitive data (you should exclude tokens/secrets from backup via `backup_rules`). So don't rely on DataStore surviving uninstall, and exclude secrets from backup.",
      },
      {
        t: "list",
        items: [
          "**Uninstall/clear-data** — DataStore files deleted (private storage).",
          "**Auto Backup** — included by default; restored on reinstall unless excluded.",
          "**Exclude secrets** — configure backup rules to omit tokens/sensitive prefs.",
          "**Don't rely on persistence** — across uninstall.",
        ],
      },
      {
        t: "note",
        text: "DataStore files (app-private) are deleted on uninstall and 'Clear data'. They're included in Android Auto Backup by default (restored on reinstall) unless excluded — exclude tokens/secrets via backup rules. Don't rely on DataStore surviving uninstall; exclude sensitive data from backup.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you evolve a Proto DataStore schema safely?",
    a: [
      {
        t: "p",
        text: "Follow Protocol Buffers evolution rules: *add* new fields with new field numbers (old data reads them as defaults); *never reuse or change* existing field numbers or types; *don't remove* required semantics. Because proto is backward/forward compatible when you follow these rules, old serialized data deserializes fine after you add fields — no explicit migration needed for additive changes.",
      },
      {
        t: "list",
        items: [
          "**Add fields with new numbers** — old data defaults them.",
          "**Never reuse/change field numbers or types** — breaks deserialization.",
          "**Additive changes are safe** — proto is backward/forward compatible.",
          "**Migrations** — needed only for semantic transformations, via the serializer.",
        ],
      },
      {
        t: "note",
        text: "Evolve Proto DataStore per protobuf rules: add fields with NEW field numbers (old data reads them as defaults), never reuse/change existing numbers or types. Additive changes are backward/forward compatible — no explicit migration needed. Semantic transformations require handling in the serializer.",
      },
    ],
  },
  {
    level: "senior",
    q: "Can DataStore be accessed from multiple processes?",
    a: [
      {
        t: "p",
        text: "Standard DataStore is *not* multi-process safe — a single DataStore instance must own its file, and accessing the same file from multiple processes can corrupt data or miss updates. For genuine multi-process needs there's a *multi-process DataStore* variant (with `MultiProcessDataStoreFactory`), but most apps are single-process and should keep DataStore access there. Avoid `android:process` splits touching the same DataStore otherwise.",
      },
      {
        t: "list",
        items: [
          "**Not multi-process by default** — one owner per file per process.",
          "**Corruption/missed updates** — if two processes touch the same file.",
          "**Multi-process variant** — `MultiProcessDataStoreFactory` for real needs.",
          "**Most apps** — single-process; keep DataStore there.",
        ],
      },
      {
        t: "note",
        text: "Standard DataStore isn't multi-process safe (one owner per file; two processes touching it can corrupt/miss updates). For genuine multi-process needs use MultiProcessDataStoreFactory. Most apps are single-process — keep DataStore access there and avoid android:process splits sharing a DataStore.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between DataStore and an in-memory StateFlow cache?",
    a: [
      {
        t: "p",
        text: "A `StateFlow` (or in-memory cache) holds state only while the *process is alive* — it's lost on process death/restart. DataStore *persists* to disk, so values survive restarts. Often you use both: DataStore as the persistent source of truth, and a `StateFlow` (via `stateIn`) as the in-memory reactive view the UI collects. Use DataStore for anything that must persist; StateFlow alone for ephemeral UI state.",
      },
      {
        t: "list",
        items: [
          "**StateFlow/in-memory** — lives only while the process runs; lost on death.",
          "**DataStore** — persisted to disk; survives restarts.",
          "**Combine** — DataStore (source of truth) → `stateIn` StateFlow (reactive view).",
          "**Choose** — persist (DataStore) vs ephemeral (StateFlow).",
        ],
      },
      {
        t: "note",
        text: "A StateFlow/in-memory cache lives only while the process runs (lost on process death); DataStore persists to disk (survives restarts). Often combine them: DataStore as the persistent source of truth, a stateIn StateFlow as the reactive in-memory view. Persist → DataStore; ephemeral UI state → StateFlow.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you build a settings screen end-to-end with DataStore?",
    a: [
      {
        t: "p",
        text: "Layer it: a *SettingsRepository* exposes each setting as a `Flow` (read) and a suspend setter (write) over DataStore; the *ViewModel* combines the flows into a `SettingsUiState` (`stateIn`) and exposes handlers calling the repository; the *UI* collects the state and renders toggles/pickers that invoke the handlers. Changes write to DataStore, which re-emits, updating the UI reactively — a clean unidirectional loop.",
      },
      {
        t: "code",
        title: "Settings flow",
        code: `// Repository: Flow reads + suspend writes over DataStore
// ViewModel:
val uiState = repo.settingsFlow.stateIn(viewModelScope, WhileSubscribed(5000), Default)
fun onToggleDarkMode(on: Boolean) = viewModelScope.launch { repo.setDarkMode(on) }
// UI: Switch(checked = uiState.darkMode, onCheckedChange = viewModel::onToggleDarkMode)`,
      },
      {
        t: "list",
        items: [
          "**Repository** — `Flow` reads + suspend writes over DataStore.",
          "**ViewModel** — `stateIn` combined state + handlers.",
          "**UI** — toggles/pickers bound to state and handlers.",
          "**Reactive loop** — write → DataStore re-emits → UI updates.",
        ],
      },
      {
        t: "note",
        text: "Settings end-to-end: SettingsRepository (Flow reads + suspend writes over DataStore) → ViewModel (stateIn combined SettingsUiState + handlers calling the repo) → UI (toggles bound to state/handlers). A change writes to DataStore, which re-emits, updating the UI reactively — a clean UDF loop.",
      },
    ],
  },
];

export default qa;
