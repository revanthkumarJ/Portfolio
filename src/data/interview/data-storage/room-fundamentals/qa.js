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
];

export default qa;
