// Room Relations & Migrations — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "How do you model a one-to-many relationship in Room?",
    a: [
      {
        t: "p",
        text: "**You use `@Relation` together with `@Embedded` in a combined data class that Room populates.** The child entity holds a foreign-key column pointing to the parent, and you define a result class that embeds the parent and declares the related children.",
      },
      {
        t: "code",
        title: "A user with their posts",
        code: `data class UserWithPosts(
    @Embedded val user: User,                          // parent columns inlined
    @Relation(parentColumn = "id", entityColumn = "userId")
    val posts: List<Post>,                             // matching children
)

@Transaction @Query("SELECT * FROM User")
fun getUsersWithPosts(): Flow<List<UserWithPosts>>`,
      },
      {
        t: "list",
        items: [
          "**`@Embedded`** inlines the parent object's columns into the result. **`@Relation`** tells Room to fetch the child rows whose `entityColumn` (`userId`) matches the parent's `parentColumn` (`id`) and put them in the list.",
          "**Annotate the query `@Transaction`** — Room runs the parent query and the children query separately, so a transaction ensures they see a consistent snapshot with no write in between.",
          "The same pattern covers one-to-one (a single related object instead of a list) and many-to-many (adding a `@Junction` through an associative table).",
        ],
      },
      {
        t: "p",
        text: "Room assembles the combined objects for you — you get a list of users each with their posts populated, in one observable query. Optionally add `@ForeignKey` on the child entity for database-level referential integrity (and cascade-delete behavior), though `@Relation` works without it.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a Room migration and why is it needed?",
    a: [
      {
        t: "p",
        text: "**A migration is code that transforms the database from one schema version to the next while preserving the user's existing data.** As your app evolves, you change the schema — add a column, add a table, add an index. But users already have the *old* schema on their devices *with their data in it*. A migration bridges the old schema to the new one without losing that data.",
      },
      {
        t: "p",
        text: "**Why it's needed**: Room tracks a schema `version` number. At startup, it compares the schema your code expects against the database actually on the device. If they differ and there's no migration path, Room throws an exception — the app crashes. So whenever you bump the version (because you changed the schema), you must provide a migration from the previous version. The stakes are high because this is *user data* — an incorrect migration or a missing one can crash the app or lose data the user cares about (offline content, saved items). You write a `Migration(from, to)` containing SQL (`ALTER TABLE ADD COLUMN`, `CREATE TABLE`, etc.) that changes the schema while keeping existing rows, register it with `addMigrations(...)`, and — importantly — test it.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does fallbackToDestructiveMigration do and when is it acceptable?",
    a: [
      {
        t: "p",
        text: "**`fallbackToDestructiveMigration()` tells Room that, if it can't find a migration path for a schema change, it should *drop the entire database and recreate it from scratch* — destroying all existing data.** It's a shortcut to avoid writing migrations: instead of transforming the data, Room just wipes it and starts fresh with the new schema.",
      },
      {
        t: "p",
        text: "**When it's acceptable: only during development, never in production.** While you're actively iterating on the schema locally, your test data is disposable, and constantly writing migrations for every experimental change is tedious — so destructive fallback lets you change the schema freely without migrations. But shipping it to production means **every user loses all their local data whenever you change the schema** in an app update — a serious bug that would wipe accounts' offline content, saved items, drafts, etc. Production apps must have real migrations (hand-written or `@AutoMigration`) for every version bump. The rule of thumb: if you see `fallbackToDestructiveMigration()` in code destined for release, that's a red flag to fix before shipping.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a TypeConverter in Room?",
    a: [
      {
        t: "p",
        text: "**A TypeConverter tells Room how to store a type that SQLite can't store natively.** SQLite only understands a few storage types — integers, real numbers, text, and blobs. So a custom type like `Date`, an enum, or a `List` has no direct representation. A `@TypeConverter` is a pair of functions that convert your custom type *to* a storable type (for writing) and *back* (for reading).",
      },
      {
        t: "code",
        title: "Storing a Date as a Long",
        code: `class Converters {
    @TypeConverter fun fromDate(date: Date?): Long? = date?.time
    @TypeConverter fun toDate(millis: Long?): Date? = millis?.let { Date(it) }
}
// Register with @TypeConverters(Converters::class) on the @Database`,
      },
      {
        t: "p",
        text: "Here, Room stores a `Date` as its millisecond `Long` value and reconstructs the `Date` when reading. You register the converter class on your `@Database` (or a specific entity/DAO) with `@TypeConverters`, and then you can use `Date` fields in entities transparently. Common uses: dates (↔ Long), enums (↔ String name or Int ordinal), and small lists/objects (↔ a JSON String via a serialization library). One caution: converting a big object to JSON and storing it as a String works but you lose the ability to query on its contents — for data you need to query, model it as proper columns/tables instead of a serialized blob.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle a complex migration, like changing a column type or splitting a table?",
    a: [
      {
        t: "p",
        text: "**Complex migrations usually require the 'create new table, copy transformed data, drop old, rename' pattern, because SQLite's `ALTER TABLE` is limited — it can add columns and rename, but can't change a column's type, drop a column (in older versions), or add constraints to an existing table.** So for anything beyond a simple add, you rebuild the table.",
      },
      {
        t: "code",
        title: "The create-copy-drop-rename dance",
        code: `val MIGRATION_3_4 = object : Migration(3, 4) {
    override fun migrate(db: SupportSQLiteDatabase) {
        // 1. Create the new table with the desired schema
        db.execSQL("""
            CREATE TABLE users_new (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                age INTEGER NOT NULL DEFAULT 0   -- new column / new type
            )
        """)
        // 2. Copy and transform existing data
        db.execSQL("""
            INSERT INTO users_new (id, name, age)
            SELECT id, name, CAST(age_text AS INTEGER) FROM users
        """)
        // 3. Drop the old table
        db.execSQL("DROP TABLE users")
        // 4. Rename the new table to the original name
        db.execSQL("ALTER TABLE users_new RENAME TO users")
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Why the four steps**: since you can't alter the column in place, you create a fresh table with the correct schema, `INSERT ... SELECT` to copy data (applying any transformation like `CAST`, splitting a column, or providing defaults for NOT NULL additions), drop the old table, and rename the new one to take its place. Data is preserved because you explicitly copy it.",
          "**Splitting a table** follows the same idea: create the two new tables, `INSERT ... SELECT` the appropriate columns into each from the old table, drop the old one. For moving data to a related table, you populate the child table with a foreign key derived from the old rows.",
          "**Recreate indices and foreign keys** on the new table — dropping the old table drops its indices, so re-add them in the migration.",
          "**Test it rigorously** with `MigrationTestHelper`: export the schema JSON per version (`room.schemaLocation`), create a DB at the old version with representative data, run the migration, and assert both the resulting schema *and* that the data was correctly transformed and preserved. Migration bugs corrupt or lose real user data, so this testing is not optional.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: complex migrations are where the 'preserve user data' responsibility gets real — you're hand-transforming production data through SQL, and a mistake is unrecoverable for users who've already updated. So the discipline is: use the create-copy-drop-rename pattern for anything SQLite can't do in place, be meticulous about transforming and copying every column, re-establish indices/constraints, and *test with the schema-export + MigrationTestHelper* on realistic data before shipping. For simple additive changes, prefer `@AutoMigration` to eliminate the chance of hand-written SQL errors entirely.",
      },
    ],
  },
  {
    level: "senior",
    q: "When should you add an index to a Room entity, and what are the trade-offs?",
    a: [
      {
        t: "p",
        text: "**Add an index to a column when you frequently query, filter (`WHERE`), sort (`ORDER BY`), or join on it — an index is a separate sorted data structure that lets SQLite find matching rows quickly instead of scanning the whole table.** Without an index, a query filtering on a column does a full table scan (O(n)); with one, it's a fast lookup (roughly O(log n)). For large tables, this is the difference between an instant query and a slow one.",
      },
      {
        t: "list",
        items: [
          "**Index foreign-key columns**: columns you join on (a `userId` in a posts table) should almost always be indexed — Room even warns you if a `@ForeignKey` column isn't indexed, because joins on an unindexed column are slow.",
          "**Index columns in frequent WHERE/ORDER BY clauses**: if you constantly query `WHERE status = ?` or `ORDER BY createdAt`, indexing those columns speeds those queries dramatically on large tables.",
          "**Unique indices** (`Index(value = [...], unique = true)`) also enforce uniqueness at the DB level, useful for natural keys.",
        ],
      },
      {
        t: "list",
        items: [
          "**Trade-off 1 — storage**: each index is an additional data structure stored on disk, so indices increase the database size. Many indices on a large table add up.",
          "**Trade-off 2 — slower writes**: every insert/update/delete must *also* update every index on the affected columns. So a table with many indices has slower writes. If a table is write-heavy and rarely queried by a given column, indexing that column costs more than it saves.",
          "**Trade-off 3 — over-indexing is a real anti-pattern**: indexing every column 'just in case' bloats storage and slows all writes while most indices go unused. Index based on *actual query patterns*, not speculatively.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: indexing is a read-vs-write trade-off — you speed up reads on the indexed column at the cost of storage and write speed. The heuristic is 'index the columns you query by, especially foreign keys and frequent filter/sort columns, on tables large enough for scans to matter; don't index write-heavy columns you rarely filter on.' On a small table (a few dozen rows), indices barely matter since a full scan is already fast. The right approach is to profile actual slow queries (SQLite's `EXPLAIN QUERY PLAN` shows whether an index is used) and add indices where the query patterns and table size justify them.",
      },
    ],
  },
];

export default qa;
