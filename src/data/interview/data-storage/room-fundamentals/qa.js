// Room & SQLite Fundamentals — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is Room and why use it instead of raw SQLite?",
    a: [
      {
        t: "p",
        text: "**Room is a Jetpack library that acts as an ORM (object-relational mapping) layer over SQLite.** SQLite is the embedded database built into Android, but using it directly means writing SQL as raw strings, manually iterating `Cursor` results and mapping them to objects, and getting no compile-time safety. Room lets you define your schema with annotated Kotlin classes and your queries as annotated methods, and it generates all that boilerplate for you.",
      },
      {
        t: "list",
        items: [
          "**Compile-time SQL verification** — the headline benefit. Room checks your `@Query` SQL against your schema *at build time*, so a misspelled column or wrong type is a compile error, not a runtime crash. Raw SQLite fails only at runtime.",
          "**Less boilerplate** — no manual `Cursor` handling or object mapping; Room maps rows to your objects automatically.",
          "**Reactive & coroutine support** — queries can return `Flow` (auto-updating when data changes), be `suspend` (main-safe), or return LiveData, integrating cleanly with modern Android.",
        ],
      },
      {
        t: "p",
        text: "Room is the recommended approach for local databases on Android; you'd only touch raw SQLite for unusual cases. The three building blocks are `@Entity` (a table), `@Dao` (your queries), and `@Database` (which ties them together and holds the version number).",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the three main components of Room?",
    a: [
      {
        t: "list",
        items: [
          "**`@Entity`** — a Kotlin class mapped to a database *table*, where each property is a column. You mark the primary key with `@PrimaryKey`, and can customize column names with `@ColumnInfo`. This defines your schema.",
          "**`@Dao`** (Data Access Object) — an interface declaring your database operations as annotated methods: `@Query` for SQL queries (verified at compile time), and `@Insert`/`@Update`/`@Delete`/`@Upsert` for common operations. Methods can be `suspend` (one-shot) or return `Flow`/`LiveData` (observable).",
          "**`@Database`** — an abstract class that lists all your entities, exposes the DAOs, and carries a `version` number (used for migrations). You build a single instance of it with `Room.databaseBuilder`.",
        ],
      },
      {
        t: "code",
        title: "The three together",
        code: `@Entity data class User(@PrimaryKey val id: String, val name: String)

@Dao interface UserDao {
    @Query("SELECT * FROM User") fun observeAll(): Flow<List<User>>
    @Insert suspend fun insert(user: User)
}

@Database(entities = [User::class], version = 1)
abstract class AppDb : RoomDatabase() { abstract fun userDao(): UserDao }`,
      },
      {
        t: "p",
        text: "Mental model: Entity = *what* you store (the table), DAO = *how* you access it (the queries), Database = the *container* that wires them together and versions the schema. You typically build one Database singleton and provide the DAOs through it via dependency injection.",
      },
    ],
  },
  {
    level: "junior",
    q: "What happens when a Room query returns a Flow?",
    a: [
      {
        t: "p",
        text: "**The Flow automatically re-emits a fresh result whenever the underlying data changes.** Room tracks which tables a query reads from; when *any* write modifies one of those tables (an insert, update, or delete), Room re-runs the query and emits the new result to every active collector. So a `Flow<List<User>>` from a query keeps your UI in sync with the database without any manual refresh.",
      },
      {
        t: "p",
        text: "This is what makes Room the ideal **single source of truth**. The pattern is: the UI *observes* a Room Flow, and all writes (including network responses) go *into* the database. When you refresh from the network and write the results to Room, the Flow re-emits automatically and the UI updates — you never manually push data to the screen. Multiple screens observing the same query all update together. It also means offline works naturally, since reads always come from the local database. Contrast this with a `suspend` query, which runs *once* and returns a single result — you use `suspend` for one-shot operations (a single lookup, an insert) and `Flow` for data the UI should track over time.",
      },
    ],
  },
  {
    level: "junior",
    q: "Can you run Room queries on the main thread?",
    a: [
      {
        t: "p",
        text: "**No — and Room actively enforces this.** By default, if you try to run a synchronous (non-suspend, non-Flow) query on the main thread, Room throws an `IllegalStateException` telling you not to. This is because database operations involve disk I/O, which can be slow and would block the UI thread, causing jank or an ANR.",
      },
      {
        t: "p",
        text: "The correct approach is to make your DAO methods either `suspend` functions (for one-shot operations) or return `Flow`/`LiveData` (for observable queries). Both are **main-safe** — Room automatically runs the actual database work on a background executor and delivers results appropriately, so you can call them from a main-thread coroutine (like `viewModelScope.launch`) without any manual threading. You do *not* need to wrap them in `withContext(Dispatchers.IO)` — Room already handles the threading, so that wrapping is redundant. There is an escape hatch, `allowMainThreadQueries()`, but you should essentially never use it; it exists for niche cases and defeats the safety Room provides.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a Room transaction and when do you need @Transaction?",
    a: [
      {
        t: "p",
        text: "**A transaction groups multiple database operations so they execute atomically — all of them succeed together, or all roll back together, with no partially-applied state ever visible.** You mark a DAO method `@Transaction`, and Room wraps its operations in a single SQLite transaction.",
      },
      {
        t: "list",
        items: [
          "**Atomicity — the primary reason**: when a logical operation spans several writes that must be consistent. Example: replacing a cart means deleting old items *and* inserting new ones. Without a transaction, a crash or error between the delete and insert leaves an empty cart. With `@Transaction`, if the insert fails, the delete is rolled back too — the cart is never left in a broken intermediate state.",
          "**Read consistency**: `@Transaction` on a query method ensures all reads within it see a *consistent snapshot* of the database. This matters especially for `@Relation` queries, which internally do multiple reads (one for the parent, one for the children) — without a transaction, a concurrent write could change the data between those reads, giving an inconsistent combined result. Room actually requires/recommends `@Transaction` on relation queries for this reason.",
          "**Performance — a big one**: batching many writes in a single transaction is dramatically faster than doing them individually. Each standalone insert is its own implicit transaction with its own disk-sync (fsync) overhead. Wrapping 1000 inserts in one transaction turns 1000 syncs into one, which can be orders of magnitude faster. So `@Transaction` is both a correctness *and* a performance tool for bulk operations.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: reach for `@Transaction` whenever (a) multiple operations must be all-or-nothing, (b) a read must see a consistent snapshot across multiple internal queries (relations), or (c) you're doing bulk writes and want the performance of a single sync. It's the database-level guarantee that your multi-step operations don't leave corrupt or inconsistent state — the same 'atomic' guarantee databases are built to provide.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Room make the database a 'single source of truth', and why is that valuable?",
    a: [
      {
        t: "p",
        text: "**Room enables the single-source-of-truth (SSOT) pattern through its auto-updating Flow queries: you designate the database as the one place the app reads from, and everything — including network data — flows *into* it, so the UI is always a reflection of the local database.** The mechanism is Room's table-change tracking: a `Flow` query re-emits whenever its tables are written, so writing fresh network data to the DB automatically propagates to every observer.",
      },
      {
        t: "code",
        title: "The SSOT repository pattern",
        code: `class ArticleRepository(private val dao: ArticleDao, private val api: Api) {
    // UI observes the DB — the single source of truth
    fun observeArticles(): Flow<List<Article>> =
        dao.observeArticles().map { it.map(ArticleEntity::toDomain) }

    // Network writes INTO the DB; observers update automatically
    suspend fun refresh() {
        val fresh = api.getArticles()
        dao.upsertAll(fresh.map { it.toEntity() })   // Flow above re-emits
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Consistency across the app**: every screen observing the same query shows the *same* data and updates *together* when it changes — no screen can drift out of sync, because there's exactly one source. This eliminates a whole class of 'screen A shows the new value but screen B still shows the old' bugs.",
          "**Offline-first for free**: since reads *always* come from the local DB, the app works offline by default — the network is just a mechanism to *update* the DB, not a dependency for *displaying* data. When offline, the user sees the last-cached data; when back online, a refresh updates the DB and the UI follows.",
          "**Decoupled refresh**: writing data and displaying data are separate concerns. A pull-to-refresh, a push notification, or a background sync can all write to the DB from anywhere, and the UI updates automatically — no screen-to-screen communication, no event bus, no manual 'notify the UI' code.",
          "**Simpler mental model**: the UI is a pure function of the database (`UI = f(DB)`), which is easy to reason about and test — you can verify behavior by writing to the DB and asserting emissions.",
        ],
      },
      {
        t: "p",
        text: "**Why it's valuable overall**: SSOT with Room turns 'keep the UI, the cache, and the network in sync' — a notoriously bug-prone coordination problem — into a one-directional flow where the database is authoritative and everything observes it. It's the foundation of Google's recommended offline-first architecture, and it's why Room's reactive Flow queries are considered its most important feature, not just a convenience.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is an @Entity, and how do you define a table?",
    a: [
      {
        t: "p",
        text: "An `@Entity` is a Kotlin data class annotated to map to a *database table* — each property becomes a column, and you mark a `@PrimaryKey`. Room generates the `CREATE TABLE` and column mapping from it. Annotations like `@ColumnInfo`, `@Ignore`, and `tableName` customize the mapping.",
      },
      {
        t: "code",
        title: "An entity",
        code: `@Entity(tableName = "users")
data class User(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "full_name") val name: String,
    val age: Int,
    @Ignore val transientField: String = "",   // not persisted
)`,
      },
      {
        t: "list",
        items: [
          "**`@Entity`** — maps a class to a table (properties → columns).",
          "**`@PrimaryKey`** — the unique key (`autoGenerate = true` for auto ids).",
          "**`@ColumnInfo`** — custom column name/type.",
          "**`@Ignore`** — a field not stored; `tableName`/`indices`/`foreignKeys` in the annotation.",
        ],
      },
      {
        t: "note",
        text: "An @Entity data class maps to a table — properties become columns, with a @PrimaryKey (autoGenerate for auto ids). Customize via @ColumnInfo (column name), @Ignore (not persisted), and @Entity's tableName/indices/foreignKeys. Room generates the schema from it.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the DAO annotations (@Query, @Insert, @Update, @Delete)?",
    a: [
      {
        t: "p",
        text: "A `@Dao` interface declares database operations. `@Query(\"...\")` runs arbitrary SQL (with compile-time verification); `@Insert`, `@Update`, `@Delete` generate the SQL for you from entity parameters. DAO functions can be `suspend` (one-shot) or return a `Flow` (observable).",
      },
      {
        t: "code",
        title: "A DAO",
        code: `@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE id = :id")
    suspend fun getById(id: String): User?

    @Query("SELECT * FROM users ORDER BY name")
    fun observeAll(): Flow<List<User>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: User)

    @Update suspend fun update(user: User)
    @Delete suspend fun delete(user: User)
}`,
      },
      {
        t: "list",
        items: [
          "**`@Query`** — arbitrary SQL, verified at compile time.",
          "**`@Insert`/`@Update`/`@Delete`** — generated SQL from entity params.",
          "**`suspend`** — one-shot; **`Flow`** — observable stream.",
          "**Return values** — `@Insert` returns rowId(s); `@Update`/`@Delete` return affected count.",
        ],
      },
      {
        t: "note",
        text: "A @Dao declares operations: @Query (arbitrary compile-verified SQL), @Insert/@Update/@Delete (generated from entity params). Functions are suspend (one-shot) or Flow-returning (observable). @Insert returns rowId(s); @Update/@Delete return the affected row count.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the @Insert onConflict strategies?",
    a: [
      {
        t: "p",
        text: "`@Insert(onConflict = ...)` decides what happens when inserting a row that violates a unique/primary-key constraint. `REPLACE` deletes the old row and inserts the new (upsert-like, but it *deletes* — triggering foreign-key cascades and losing the old rowId); `IGNORE` keeps the existing row and skips the new one; `ABORT` (default) rolls back with an exception.",
      },
      {
        t: "list",
        items: [
          "**`REPLACE`** — replace the conflicting row (delete + insert; watch cascades/rowId change).",
          "**`IGNORE`** — keep the existing, skip the new insert.",
          "**`ABORT` (default)** — throw and roll back the transaction.",
          "**Prefer `@Upsert`** — for a true insert-or-update without the delete side effects.",
        ],
      },
      {
        t: "note",
        text: "@Insert onConflict: REPLACE (delete old + insert new — beware FK cascades and changed rowId), IGNORE (keep existing, skip new), ABORT (default — throw and roll back). For a true insert-or-update without REPLACE's delete side effects, use @Upsert.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is @Upsert, and how does it differ from @Insert(REPLACE)?",
    a: [
      {
        t: "p",
        text: "`@Upsert` (Room 2.5+) *inserts if new, updates if it exists* — a genuine upsert. Unlike `@Insert(onConflict = REPLACE)`, which *deletes* the conflicting row and inserts a fresh one (triggering foreign-key cascade deletes and changing the auto-generated id), `@Upsert` *updates in place*, preserving relationships and the id.",
      },
      {
        t: "code",
        title: "@Upsert",
        code: `@Upsert
suspend fun upsert(user: User)   // insert if new, update if exists (in place)`,
      },
      {
        t: "list",
        items: [
          "**`@Upsert`** — insert-or-update in place.",
          "**vs `@Insert(REPLACE)`** — REPLACE deletes+inserts (cascades fire, id changes).",
          "**Preserves relationships** — no cascade deletes on update.",
          "**Room 2.5+** — the clean way to do idempotent writes.",
        ],
      },
      {
        t: "note",
        text: "@Upsert (Room 2.5+) inserts if new, updates in place if existing — a true upsert. Unlike @Insert(REPLACE) which deletes the conflicting row and inserts fresh (firing FK cascades, changing auto ids), @Upsert updates in place, preserving relationships and ids. Prefer it for idempotent writes.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does Room verify queries at compile time?",
    a: [
      {
        t: "p",
        text: "Room's annotation processor *parses your `@Query` SQL at compile time* against the known schema — catching typos, wrong column/table names, and type mismatches between the query result and the return type *before you run the app*. This is a major advantage over raw SQLite (where such errors surface as runtime crashes).",
      },
      {
        t: "list",
        items: [
          "**Compile-time SQL validation** — column/table names, syntax checked.",
          "**Return-type checking** — result columns must match the return type.",
          "**Fails the build** — errors caught early, not at runtime.",
          "**vs raw SQLite** — those are runtime crashes there.",
        ],
      },
      {
        t: "note",
        text: "Room parses @Query SQL at compile time against the schema — catching typos, wrong column/table names, and result/return-type mismatches before running. A big win over raw SQLite (runtime crashes). This is why Room is preferred: SQL errors fail the build.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you build and provide a Room database instance?",
    a: [
      {
        t: "p",
        text: "Build it with `Room.databaseBuilder(context, AppDatabase::class.java, \"name\").build()`. The database is *expensive* to create, so make it a *singleton* (one instance per app) — typically provided via DI (Hilt `@Singleton`) or a manual double-checked singleton. Use the `applicationContext` to avoid leaks.",
      },
      {
        t: "code",
        title: "Singleton database",
        code: `@Provides @Singleton
fun provideDb(@ApplicationContext ctx: Context): AppDatabase =
    Room.databaseBuilder(ctx, AppDatabase::class.java, "app.db")
        .addMigrations(MIGRATION_1_2)
        .build()`,
      },
      {
        t: "list",
        items: [
          "**`Room.databaseBuilder`** — creates the database; add migrations/callbacks.",
          "**Singleton** — expensive to build; one instance app-wide (DI `@Singleton`).",
          "**`applicationContext`** — avoid leaking an Activity.",
          "**In-memory variant** — `Room.inMemoryDatabaseBuilder` for tests.",
        ],
      },
      {
        t: "note",
        text: "Room.databaseBuilder(context, Db::class.java, \"name\").build() — but the database is expensive, so make it a singleton (Hilt @Singleton or double-checked), using applicationContext to avoid leaks. Add migrations/callbacks on the builder. Room.inMemoryDatabaseBuilder for tests.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between a suspend DAO function and a Flow-returning one?",
    a: [
      {
        t: "p",
        text: "A `suspend` DAO function is a *one-shot* query — it runs once and returns the current result. A `Flow`-returning DAO function is *observable* — Room re-runs the query and emits a new result whenever any table it reads *changes* (via the invalidation tracker). Use suspend for a single read/write; use Flow to keep the UI in sync with the database.",
      },
      {
        t: "code",
        title: "One-shot vs observable",
        code: `@Query("SELECT * FROM users WHERE id = :id")
suspend fun getUser(id: String): User?          // one-shot

@Query("SELECT * FROM users")
fun observeUsers(): Flow<List<User>>            // re-emits on any change to 'users'`,
      },
      {
        t: "list",
        items: [
          "**`suspend`** — runs once; current result.",
          "**`Flow`** — re-emits on table changes (invalidation tracking).",
          "**Reactive UI** — collect the Flow so the screen updates automatically.",
          "**Writes** — always `suspend` (or `Flow` doesn't apply).",
        ],
      },
      {
        t: "note",
        text: "suspend DAO = one-shot query (current result). Flow DAO = observable — Room re-runs and re-emits whenever a read table changes (invalidation tracker). Use suspend for single reads/writes; Flow to keep the UI reactively in sync with the DB (single source of truth).",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Room's invalidation tracker make Flows re-emit?",
    a: [
      {
        t: "p",
        text: "Room maintains an *InvalidationTracker* that watches which tables each observable query reads. When a write modifies a table (via triggers Room installs), the tracker notifies the affected queries, which re-run and emit fresh results to their `Flow` collectors. This is how a `Flow<List<User>>` automatically updates after an insert/update/delete anywhere in the app.",
      },
      {
        t: "list",
        items: [
          "**InvalidationTracker** — tracks table→query dependencies.",
          "**Triggers on write** — modifications mark tables dirty.",
          "**Re-run + emit** — affected observable queries re-execute and emit.",
          "**Table-level** — granular to tables, not rows (any change to a read table re-emits).",
        ],
      },
      {
        t: "note",
        text: "Room's InvalidationTracker watches which tables each observable query reads; on any write (via installed triggers) it marks tables dirty and the affected Flow queries re-run and emit fresh results. It's table-level (any change to a read table re-emits) — how Flow DAOs auto-update the UI after writes.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are @ColumnInfo, @Ignore, and @Embedded?",
    a: [
      {
        t: "p",
        text: "These customize how entity fields map to columns. `@ColumnInfo(name = ...)` renames a column (or sets its type/index). `@Ignore` excludes a field from persistence (computed/transient values). `@Embedded` flattens a nested object's fields into the parent table's columns (e.g. an `Address` object stored as `street`, `city` columns).",
      },
      {
        t: "code",
        title: "Field mapping",
        code: `@Entity data class User(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "full_name") val name: String,
    @Embedded val address: Address,        // street/city become columns
    @Ignore val cachedAvatar: Bitmap? = null,  // not stored
)
data class Address(val street: String, val city: String)`,
      },
      {
        t: "list",
        items: [
          "**`@ColumnInfo`** — column name/type/index override.",
          "**`@Ignore`** — exclude from the table.",
          "**`@Embedded`** — flatten a nested object into columns (prefix optional).",
          "**Composition** — model structured data without extra tables.",
        ],
      },
      {
        t: "note",
        text: "@ColumnInfo renames/configures a column; @Ignore excludes a field from persistence (computed/transient); @Embedded flattens a nested object's fields into the parent table's columns (Address → street/city). @Embedded composes structured data without a separate table.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you write a dynamic query with @RawQuery?",
    a: [
      {
        t: "p",
        text: "`@RawQuery` lets you pass a `SupportSQLiteQuery` built at *runtime* — for cases where the SQL structure varies (dynamic sorting, optional filters) and can't be a fixed `@Query` string. You lose compile-time verification, so build the query carefully (and use bound arguments to avoid SQL injection).",
      },
      {
        t: "code",
        title: "@RawQuery",
        code: `@RawQuery(observedEntities = [User::class])
fun search(query: SupportSQLiteQuery): Flow<List<User>>

// Build at runtime:
val q = SimpleSQLiteQuery("SELECT * FROM users ORDER BY \$sortColumn", arrayOf())
dao.search(q)`,
      },
      {
        t: "list",
        items: [
          "**`@RawQuery`** — runtime-built `SupportSQLiteQuery`.",
          "**Dynamic SQL** — variable sorting/filtering not expressible statically.",
          "**No compile-time check** — verify manually; use bound args (avoid injection).",
          "**`observedEntities`** — needed so a `Flow` `@RawQuery` knows what to observe.",
        ],
      },
      {
        t: "note",
        text: "@RawQuery takes a runtime-built SupportSQLiteQuery for dynamic SQL (variable sorting/filters) that a static @Query can't express — but you lose compile-time verification, so build carefully with bound args (avoid injection). For Flow @RawQuery, set observedEntities so it knows what to observe.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you return a subset of columns (a projection) from a query?",
    a: [
      {
        t: "p",
        text: "Define a plain data class (POJO) with just the fields you want, and write a `@Query` that `SELECT`s exactly those columns — Room maps the result to the POJO. This avoids loading full entities when you only need a few fields (e.g. a list of id+name for a dropdown), improving efficiency.",
      },
      {
        t: "code",
        title: "Projection",
        code: `data class UserSummary(val id: String, @ColumnInfo(name = "full_name") val name: String)

@Query("SELECT id, full_name FROM users")
fun summaries(): Flow<List<UserSummary>>`,
      },
      {
        t: "list",
        items: [
          "**Projection POJO** — a class with only the needed fields.",
          "**`SELECT` those columns** — Room maps to the POJO.",
          "**Efficiency** — don't load full entities for a few fields.",
          "**Column names must match** — or use `@ColumnInfo`/aliases.",
        ],
      },
      {
        t: "note",
        text: "Define a POJO with only the fields you need and SELECT exactly those columns — Room maps the result to the POJO (a projection). Avoids loading full entities for a few fields (id+name for a dropdown). Column names must match the POJO (use @ColumnInfo or SQL aliases).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you pass parameters, including a list, to a @Query?",
    a: [
      {
        t: "p",
        text: "Bind parameters with `:name` in the SQL, matching function parameters — Room binds them safely (no injection). For an `IN` clause with a *collection*, use `IN (:ids)` with a `List` parameter — Room expands it to the right number of placeholders at runtime.",
      },
      {
        t: "code",
        title: "Parameters and IN",
        code: `@Query("SELECT * FROM users WHERE age > :minAge")
suspend fun olderThan(minAge: Int): List<User>

@Query("SELECT * FROM users WHERE id IN (:ids)")
suspend fun byIds(ids: List<String>): List<User>   // IN clause with a list`,
      },
      {
        t: "list",
        items: [
          "**`:name` binding** — safe parameter binding (no injection).",
          "**`IN (:list)`** — pass a `List`; Room expands placeholders.",
          "**Type-checked** — parameter types verified against the query.",
          "**Multiple params** — as many `:name` bindings as needed.",
        ],
      },
      {
        t: "note",
        text: "Bind parameters with :name matching function params (safe, no injection). For an IN clause with a collection, use IN (:ids) with a List param — Room expands it to the right number of placeholders at runtime. Types are verified against the query.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Room handle threading for queries?",
    a: [
      {
        t: "p",
        text: "Room runs queries on background executors, not the main thread. `suspend` DAO functions dispatch to Room's *query/transaction executors* (so they're main-safe — you can call them from the main dispatcher). `Flow`-returning queries also run off the main thread. Room *forbids* synchronous (blocking) queries on the main thread by default (throws), forcing you to use suspend/Flow.",
      },
      {
        t: "list",
        items: [
          "**Background executors** — Room's query/transaction executors run the SQL.",
          "**suspend/Flow are main-safe** — dispatch off the main thread internally.",
          "**Main-thread blocking queries forbidden** — throws unless `allowMainThreadQueries` (don't).",
          "**Custom executors** — configurable on the builder if needed.",
        ],
      },
      {
        t: "note",
        text: "Room runs queries on background executors; suspend and Flow DAO functions are main-safe (dispatch off main internally). Synchronous blocking queries on the main thread are forbidden by default (throws) — use suspend/Flow. You can set custom query/transaction executors on the builder.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you prepopulate a Room database?",
    a: [
      {
        t: "p",
        text: "Use `createFromAsset(\"path\")` (ship a prebuilt `.db` file in assets) or `createFromFile(file)` on the database builder to seed initial data. Alternatively, use a `RoomDatabase.Callback`'s `onCreate` to insert seed data programmatically the first time the database is created. Prepopulation is useful for reference/static data (e.g. a list of countries).",
      },
      {
        t: "code",
        title: "Prepopulate",
        code: `Room.databaseBuilder(ctx, AppDatabase::class.java, "app.db")
    .createFromAsset("database/seed.db")      // ship a prebuilt DB
    .build()
// or:
.addCallback(object : RoomDatabase.Callback() {
    override fun onCreate(db: SupportSQLiteDatabase) { /* insert seed rows */ }
})`,
      },
      {
        t: "list",
        items: [
          "**`createFromAsset`/`createFromFile`** — seed from a prebuilt DB.",
          "**`Callback.onCreate`** — insert seed data programmatically on first create.",
          "**Reference data** — static lists (countries, categories).",
          "**Version carefully** — prepackaged DBs must match your schema version.",
        ],
      },
      {
        t: "note",
        text: "Prepopulate with createFromAsset(\"path\") / createFromFile(file) (ship a prebuilt .db) or a RoomDatabase.Callback.onCreate to insert seed rows on first create. Good for reference/static data. The prepackaged DB must match your schema version, or migrations apply.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test Room with an in-memory database?",
    a: [
      {
        t: "p",
        text: "Use `Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java)` — it creates a database that lives only in memory and is wiped when the process ends, perfect for fast, isolated instrumented tests of DAOs. Allow main-thread queries in tests if needed, insert test data, and assert query results. Run these as instrumented tests (Room needs the SQLite runtime).",
      },
      {
        t: "code",
        title: "In-memory DB test",
        code: `@Before fun setup() {
    db = Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java)
        .allowMainThreadQueries().build()
    dao = db.userDao()
}
@Test fun insertAndRead() = runTest {
    dao.insert(User("1", "Sam", 30))
    assertEquals("Sam", dao.getById("1")?.name)
}`,
      },
      {
        t: "list",
        items: [
          "**`inMemoryDatabaseBuilder`** — ephemeral DB for tests.",
          "**Instrumented** — needs the Android SQLite runtime (or Robolectric).",
          "**Test DAOs** — insert, query, assert.",
          "**Isolated** — each test gets a fresh DB.",
        ],
      },
      {
        t: "note",
        text: "Room.inMemoryDatabaseBuilder(context, Db::class.java) creates an ephemeral DB (wiped on process end) for fast, isolated DAO tests — insert data, run queries, assert. Run as instrumented tests (needs SQLite runtime; or Robolectric). Each test gets a fresh DB.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is exportSchema, and why enable it?",
    a: [
      {
        t: "p",
        text: "`exportSchema = true` on `@Database` makes Room write the schema as a JSON file at build time (into a schemas directory). This is valuable for *migration testing* (Room's `MigrationTestHelper` uses the exported schemas to verify migrations) and for tracking schema changes in version control. Keep it on and commit the schema files.",
      },
      {
        t: "code",
        title: "exportSchema",
        code: `@Database(entities = [User::class], version = 2, exportSchema = true)
abstract class AppDatabase : RoomDatabase() { ... }
// Configure the schema output dir in build.gradle (room.schemaLocation)`,
      },
      {
        t: "list",
        items: [
          "**`exportSchema = true`** — writes schema JSON per version at build time.",
          "**Migration testing** — `MigrationTestHelper` uses these to validate migrations.",
          "**Version control** — commit schema files to track changes.",
          "**Configure output** — `room.schemaLocation` in the build config.",
        ],
      },
      {
        t: "note",
        text: "exportSchema = true writes Room's schema as JSON per version at build time (set room.schemaLocation). It powers migration testing (MigrationTestHelper validates migrations against exported schemas) and lets you track schema changes in version control. Keep it on and commit the schema files.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you write count, exists, and aggregate queries in Room?",
    a: [
      {
        t: "p",
        text: "Use SQL aggregate functions in a `@Query` and return the appropriate type — `SELECT COUNT(*)` returning `Int`, `SELECT EXISTS(...)` returning `Boolean`, `SELECT SUM/AVG/MAX(...)`. These can be `suspend` (one-shot) or `Flow` (observable count that updates as data changes — great for badges).",
      },
      {
        t: "code",
        title: "Aggregates",
        code: `@Query("SELECT COUNT(*) FROM users")
fun count(): Flow<Int>

@Query("SELECT EXISTS(SELECT 1 FROM users WHERE id = :id)")
suspend fun exists(id: String): Boolean

@Query("SELECT AVG(age) FROM users")
suspend fun averageAge(): Double`,
      },
      {
        t: "list",
        items: [
          "**`COUNT(*)`** → `Int`/`Flow<Int>` (observable badge count).",
          "**`EXISTS(...)`** → `Boolean`.",
          "**`SUM`/`AVG`/`MAX`/`MIN`** → numeric types.",
          "**Grouping** — `GROUP BY` with a POJO for grouped results.",
        ],
      },
      {
        t: "note",
        text: "Use SQL aggregates in @Query with matching return types: COUNT(*) → Int/Flow<Int> (observable badge counts), EXISTS(...) → Boolean, SUM/AVG/MAX/MIN → numeric. Flow variants update automatically as data changes. Use GROUP BY + a POJO for grouped aggregates.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Room compare to raw SQLite and to SQLDelight?",
    a: [
      {
        t: "p",
        text: "*Raw SQLite* (SQLiteOpenHelper) is verbose and error-prone (cursors, manual mapping, runtime SQL errors). *Room* is an abstraction over SQLite with compile-time query verification, annotations, coroutines/Flow support, and migration tools — the Android-recommended default. *SQLDelight* is an alternative that generates typesafe Kotlin from `.sq` SQL files, is multiplatform (KMP), and gives SQL-first ergonomics.",
      },
      {
        t: "table",
        headers: ["", "Room", "SQLDelight", "Raw SQLite"],
        rows: [
          ["Verification", "compile-time", "compile-time", "runtime"],
          ["KMP", "no (Android)", "yes", "no"],
          ["Style", "annotations", "SQL files → Kotlin", "manual"],
          ["Recommended", "Android default", "KMP / SQL-first", "avoid directly"],
        ],
      },
      {
        t: "list",
        items: [
          "**Room** — Android default; annotations, compile-time checks, Flow, migrations.",
          "**SQLDelight** — SQL-first, typesafe generation, multiplatform (KMP).",
          "**Raw SQLite** — low-level; avoid directly.",
          "**Choose** — Room for Android-only; SQLDelight for KMP/SQL-first teams.",
        ],
      },
      {
        t: "note",
        text: "Raw SQLite = verbose, runtime errors (avoid). Room = Android-recommended abstraction with compile-time verification, annotations, Flow, migrations. SQLDelight = SQL-first typesafe generation, multiplatform (KMP). Choose Room for Android-only, SQLDelight for KMP/SQL-first.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you observe a single row reactively, and handle it being absent?",
    a: [
      {
        t: "p",
        text: "Return `Flow<User?>` from a single-row `@Query` — Room emits the row when present and `null` when it's absent (or deleted), re-emitting on changes. Make the return type nullable so a missing row is `null` rather than an error, and handle the null in the UI (empty/not-found state).",
      },
      {
        t: "code",
        title: "Observing one row",
        code: `@Query("SELECT * FROM users WHERE id = :id")
fun observeUser(id: String): Flow<User?>   // null when absent, re-emits on change`,
      },
      {
        t: "list",
        items: [
          "**`Flow<User?>`** — emits the row or null, reactively.",
          "**Nullable** — a missing row is `null`, not a crash.",
          "**Re-emits** — updates when the row changes/appears/disappears.",
          "**UI** — handle null as a not-found/empty state.",
        ],
      },
      {
        t: "note",
        text: "Return Flow<User?> for a single row — Room emits the row or null (when absent/deleted) and re-emits on changes. Make it nullable so a missing row is null, not an error; handle null as a not-found/empty state in the UI.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a @DatabaseView, and when is it useful?",
    a: [
      {
        t: "p",
        text: "A `@DatabaseView` is a read-only, predefined SQL query treated like a virtual table — you can query it and map results to it like an entity, but it isn't stored. It's useful for encapsulating a complex join/aggregation you reuse across queries, keeping DAO SQL simpler.",
      },
      {
        t: "code",
        title: "@DatabaseView",
        code: `@DatabaseView("""
    SELECT u.id, u.name, COUNT(o.id) AS orderCount
    FROM users u LEFT JOIN orders o ON o.userId = u.id GROUP BY u.id
""")
data class UserWithOrderCount(val id: String, val name: String, val orderCount: Int)

@Query("SELECT * FROM UserWithOrderCount")
fun observe(): Flow<List<UserWithOrderCount>>`,
      },
      {
        t: "list",
        items: [
          "**`@DatabaseView`** — a named, read-only query (virtual table).",
          "**Reuse** — encapsulate a complex join/aggregation.",
          "**Query it like an entity** — but it's not stored.",
          "**Register** — add it to `@Database(views = [...])`.",
        ],
      },
      {
        t: "note",
        text: "A @DatabaseView is a predefined read-only SQL query treated as a virtual table — query it like an entity (but not stored). Use it to encapsulate a reusable complex join/aggregation, simplifying DAO queries. Register it in @Database(views = [...]).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you clear all data from the database?",
    a: [
      {
        t: "p",
        text: "Call `db.clearAllTables()` — it deletes all rows from every table (resetting auto-increment counters) in a single transaction, without dropping the schema. Use it for logout/reset scenarios. Run it off the main thread (it's a blocking call). To delete specific data, use `@Delete` or `@Query(\"DELETE FROM ...\")`.",
      },
      {
        t: "list",
        items: [
          "**`clearAllTables()`** — empties every table; keeps the schema.",
          "**Logout/reset** — a common use.",
          "**Off main thread** — it's blocking; run in a coroutine (`withContext(IO)`).",
          "**Targeted** — `@Delete` / `@Query(\"DELETE FROM table\")` for specific rows.",
        ],
      },
      {
        t: "note",
        text: "db.clearAllTables() empties every table (resets auto-increment) in one transaction, keeping the schema — for logout/reset. It's blocking, so run off the main thread (withContext(IO)). For specific deletions use @Delete or @Query(\"DELETE FROM table\").",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you enable and use full-text search (FTS) in Room?",
    a: [
      {
        t: "p",
        text: "Annotate an entity with `@Fts4` (or `@Fts3`) to create a full-text-search virtual table, then use the `MATCH` operator in queries for fast text search (ranking, prefix matching). FTS is far faster than `LIKE '%...%'` for searching large text bodies, at the cost of extra storage and a separate table synced with the source.",
      },
      {
        t: "code",
        title: "FTS entity",
        code: `@Fts4
@Entity(tableName = "notes_fts")
data class NoteFts(val title: String, val body: String)

@Query("SELECT * FROM notes_fts WHERE notes_fts MATCH :query")
fun search(query: String): Flow<List<NoteFts>>`,
      },
      {
        t: "list",
        items: [
          "**`@Fts4`/`@Fts3`** — creates an FTS virtual table.",
          "**`MATCH`** — fast text search (prefix, ranking) vs slow `LIKE '%...%'`.",
          "**Cost** — extra storage; keep the FTS table synced with the source (or use `contentEntity`).",
          "**Uses** — searching notes, messages, articles.",
        ],
      },
      {
        t: "note",
        text: "Annotate an entity @Fts4/@Fts3 to make an FTS virtual table, then query with the MATCH operator for fast text search (prefix/ranking) — far faster than LIKE '%...%' for large text. Cost: extra storage and keeping the FTS table synced (use contentEntity to link to the source). Great for notes/messages search.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you run multiple DAO operations atomically in Room?",
    a: [
      {
        t: "p",
        text: "Wrap them in a transaction. For a DAO method combining several operations, annotate it `@Transaction` (and make it a default/suspend method calling other DAO functions). For arbitrary work, use `db.withTransaction { }` (the coroutine-friendly API) — everything inside commits together or rolls back on failure, ensuring consistency.",
      },
      {
        t: "code",
        title: "withTransaction",
        code: `suspend fun transfer(from: String, to: String, amount: Int) = db.withTransaction {
    dao.debit(from, amount)
    dao.credit(to, amount)      // both commit together, or both roll back
}`,
      },
      {
        t: "list",
        items: [
          "**`@Transaction`** — on a DAO method combining operations (also for multi-step reads consistency).",
          "**`db.withTransaction { }`** — coroutine-friendly transaction block.",
          "**Atomic** — all-or-nothing; rollback on exception.",
          "**Use** — transfers, multi-table writes, read-then-write consistency.",
        ],
      },
      {
        t: "note",
        text: "Run atomic multi-op writes in a transaction: @Transaction on a DAO method, or db.withTransaction { } (coroutine-friendly) — everything commits together or rolls back on failure. Use for transfers, multi-table writes, and consistent read-then-write sequences.",
      },
    ],
  },
  {
    level: "junior",
    q: "What return types can Room DAO functions have?",
    a: [
      {
        t: "p",
        text: "Room supports many return types: for reads, a single object or `List`, nullable for optional, `Flow<T>` for observable, and `PagingSource` for Paging 3; for writes, `Unit`/`suspend`, `Long`/`List<Long>` (inserted rowIds), or `Int` (rows affected by update/delete). It also integrates with `LiveData`, RxJava types, and `Cursor` for interop.",
      },
      {
        t: "list",
        items: [
          "**Reads** — `T`, `T?`, `List<T>`, `Flow<T>`, `PagingSource<Int, T>`, `LiveData<T>`.",
          "**`@Insert`** — `Long`/`List<Long>` (rowIds) or `Unit`.",
          "**`@Update`/`@Delete`** — `Int` (rows affected) or `Unit`.",
          "**Interop** — RxJava (`Single`/`Flowable`), `Cursor`.",
        ],
      },
      {
        t: "note",
        text: "Room DAO return types: reads — T/T?/List<T>/Flow<T>/PagingSource/LiveData; @Insert — Long/List<Long> (rowIds) or Unit; @Update/@Delete — Int (rows affected) or Unit; plus RxJava types and Cursor for interop. Choose Flow for observable, suspend for one-shot.",
      },
    ],
  },
];

export default qa;
