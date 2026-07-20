// Room & SQLite Fundamentals — Content tab. Teaching-first.

const content = [
  {
    heading: "SQLite and why Room exists",
    blocks: [
      {
        t: "p",
        text: "**SQLite** is a lightweight, embedded relational database built into Android — every app can use it for structured local storage, with no server. You *could* use it directly through the raw `SQLiteOpenHelper`/`SQLiteDatabase` APIs, but that means writing SQL as strings, manually mapping `Cursor` rows to objects, and getting no compile-time checking — error-prone and verbose. **Room** is a Jetpack library that sits on top of SQLite as an **ORM (Object-Relational Mapping)** layer: you define your schema with annotated Kotlin classes, write queries as annotated methods, and Room generates the boilerplate with *compile-time verification* of your SQL.",
      },
      {
        t: "list",
        items: [
          "**Room's headline benefit — compile-time SQL verification**: your `@Query` SQL is checked against your schema *when you build*, so a typo in a column name or a wrong type is a compile error, not a runtime crash. Raw SQLite would only fail at runtime.",
          "**Less boilerplate**: no manual `Cursor` iteration, no manual object mapping — Room maps query results to your objects automatically.",
          "**Reactive & coroutine support built in**: queries can return `Flow` (auto-updating), `suspend` functions (main-safe), LiveData — first-class integration with modern Android.",
          "Room is the recommended way to use a database on Android; raw SQLite is legacy/niche.",
        ],
      },
    ],
  },
  {
    heading: "The three Room components: Entity, DAO, Database",
    blocks: [
      {
        t: "code",
        title: "The complete minimal setup",
        code: `// 1) ENTITY — a table, defined by a data class
@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "full_name") val name: String,
    val email: String,
    val createdAt: Long,
)

// 2) DAO — Data Access Object: your queries as annotated methods
@Dao
interface UserDao {
    @Query("SELECT * FROM users ORDER BY createdAt DESC")
    fun observeUsers(): Flow<List<UserEntity>>          // reactive, auto-updates

    @Query("SELECT * FROM users WHERE id = :id")
    suspend fun getUser(id: String): UserEntity?        // suspend = main-safe

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(user: UserEntity)

    @Delete
    suspend fun delete(user: UserEntity)
}

// 3) DATABASE — ties entities and DAOs together
@Database(entities = [UserEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}`,
      },
      {
        t: "list",
        items: [
          "**`@Entity`** — a class mapped to a *table*; each property is a *column*. `@PrimaryKey` marks the unique key (can be `autoGenerate = true`); `@ColumnInfo` customizes column names; `@Ignore` excludes a property.",
          "**`@Dao`** — an interface of database operations. `@Query` for SQL (verified at compile time), `@Insert`/`@Update`/`@Delete`/`@Upsert` for convenience operations. Methods can be `suspend` (one-shot, main-safe) or return `Flow`/`LiveData` (observable).",
          "**`@Database`** — an abstract class listing the entities and exposing the DAOs, with a `version` number (critical for migrations). You build one instance (a singleton) with `Room.databaseBuilder(...)`.",
        ],
      },
    ],
  },
  {
    heading: "Reactive queries with Flow — Room as the source of truth",
    blocks: [
      {
        t: "p",
        text: "The most powerful Room feature: a `@Query` returning **`Flow<T>`** *automatically re-emits whenever the underlying data changes*. Room tracks which tables a query touches and, when any write modifies those tables, it re-runs the query and emits the new result to all collectors. This is what makes Room the ideal **single source of truth** — the UI observes the database, writes go into the database, and the UI updates automatically.",
      },
      {
        t: "code",
        title: "The observe-local, write-anywhere pattern",
        code: `// Repository: UI observes the DB; network writes INTO the DB
class UserRepository(private val dao: UserDao, private val api: Api) {
    // Reads always come from the DB (single source of truth)
    fun observeUsers(): Flow<List<User>> =
        dao.observeUsers().map { it.map(UserEntity::toDomain) }

    // Refresh writes into the DB; the Flow above re-emits automatically
    suspend fun refresh() {
        val remote = api.getUsers()
        dao.upsertAll(remote.map { it.toEntity() })   // triggers Flow re-emission
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Why it's powerful**: multiple screens observing the same query all update in the same frame when a write happens — no manual notification, no event bus. Offline works because reads always come from the DB.",
          "**suspend vs Flow**: use `suspend` for one-shot operations (insert, a single lookup); use `Flow` for data the UI should *observe* over time. A `suspend` query runs once and returns; a `Flow` query keeps emitting.",
          "**Room handles threading**: `suspend` DAO functions and `Flow` queries are main-safe — Room runs the actual query on a background executor. You don't need to wrap them in `withContext(IO)` (doing so is redundant).",
        ],
      },
    ],
  },
  {
    heading: "Transactions and atomicity",
    blocks: [
      {
        t: "p",
        text: "A **transaction** groups multiple database operations so they happen **atomically** — all succeed together or all roll back together, with no partial state visible to other queries. Use `@Transaction` when a logical operation spans several writes/reads that must be consistent.",
      },
      {
        t: "code",
        title: "@Transaction for multi-step consistency",
        code: `@Dao
interface OrderDao {
    @Transaction
    suspend fun replaceCart(items: List<CartItem>) {
        clearCart()              // delete old
        insertAll(items)         // insert new
        // If insertAll fails, clearCart is rolled back too — atomic
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Atomicity**: without a transaction, a crash between `clearCart()` and `insertAll()` would leave an empty cart. With `@Transaction`, either both happen or neither does.",
          "**Consistency for reads**: `@Transaction` on a query method ensures the reads within it see a consistent database snapshot — important for relation queries (`@Relation`) that do multiple reads, so they don't see the DB change mid-way.",
          "**Performance**: batching many inserts in one transaction is *much* faster than many individual inserts (each insert is otherwise its own implicit transaction with fsync overhead). Inserting 1000 rows in a transaction can be orders of magnitude faster.",
        ],
      },
    ],
  },
  {
    heading: "Building and configuring the database",
    blocks: [
      {
        t: "code",
        title: "Creating the singleton (usually via DI)",
        code: `val db = Room.databaseBuilder(
    context.applicationContext,       // application context — it's app-lived
    AppDatabase::class.java,
    "app.db",
)
    .fallbackToDestructiveMigration() // dev-only: wipe on schema change (DON'T ship)
    .build()`,
      },
      {
        t: "list",
        items: [
          "**Make it a singleton**: opening a database is expensive and multiple instances cause conflicts — build one instance for the whole app (provide it via Hilt/DI as `@Singleton`).",
          "**Use the application context**: the database outlives any Activity, so it must not hold an Activity context.",
          "**Never do DB work on the main thread**: Room *enforces* this — a non-suspend, non-Flow query on the main thread throws (unless you explicitly `allowMainThreadQueries()`, which you shouldn't). Use `suspend`/`Flow`.",
          "**Type converters**: SQLite only stores primitives/String/blob. For custom types (a `Date`, an enum, a list), you write a `@TypeConverter` telling Room how to convert to/from a storable type (`Date` ↔ `Long`).",
        ],
      },
      {
        t: "note",
        text: "Room essentials: it's a compile-time-verified ORM over SQLite. Three parts — @Entity (table), @Dao (queries), @Database (config + version). Flow queries auto-update, making Room the single source of truth (observe local, write into it). suspend/Flow queries are main-safe. @Transaction gives atomicity and speeds up batch writes. Build one singleton with the application context; never query on the main thread.",
      },
    ],
  },
];

export default content;
