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
  {
    level: "senior",
    q: "What is @Relation, and why does it need @Transaction?",
    a: [
      {
        t: "p",
        text: "`@Relation` lets Room populate a nested collection/object by running a *second* query and matching foreign keys — e.g. a `UserWithPosts` class with a `@Relation` list of posts. Because Room runs *two* queries (parent, then children), you annotate the DAO method `@Transaction` so both run in one atomic transaction — otherwise a concurrent write between the two queries could give inconsistent data.",
      },
      {
        t: "code",
        title: "@Relation",
        code: `data class UserWithPosts(
    @Embedded val user: User,
    @Relation(parentColumn = "id", entityColumn = "userId")
    val posts: List<Post>,
)
@Transaction
@Query("SELECT * FROM users")
fun observeUsersWithPosts(): Flow<List<UserWithPosts>>   // two queries, one transaction`,
      },
      {
        t: "list",
        items: [
          "**`@Relation`** — Room runs a second query and stitches children by key.",
          "**`@Embedded`** — the parent entity's columns.",
          "**`@Transaction`** — makes the multi-query read atomic/consistent.",
          "**Convenience** — no manual join + grouping.",
        ],
      },
      {
        t: "note",
        text: "@Relation populates a nested collection/object via a second query matching foreign keys (parentColumn/entityColumn), with @Embedded for the parent. Room runs multiple queries, so annotate the method @Transaction for a consistent atomic read. It replaces manual join + grouping.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you model a many-to-many relationship in Room?",
    a: [
      {
        t: "p",
        text: "Create a *cross-reference* (junction) entity holding the two foreign keys (e.g. `PlaylistSongCrossRef`), then use `@Relation` with `@Junction` to load the associated entities across it. This models many-to-many (a playlist has many songs; a song is in many playlists) without duplicating data.",
      },
      {
        t: "code",
        title: "Cross-ref + @Junction",
        code: `@Entity(primaryKeys = ["playlistId", "songId"])
data class PlaylistSongCrossRef(val playlistId: String, val songId: String)

data class PlaylistWithSongs(
    @Embedded val playlist: Playlist,
    @Relation(
        parentColumn = "id", entityColumn = "id",
        associateBy = Junction(PlaylistSongCrossRef::class,
            parentColumn = "playlistId", entityColumn = "songId"),
    ) val songs: List<Song>,
)`,
      },
      {
        t: "list",
        items: [
          "**Junction entity** — a table with both foreign keys (composite PK).",
          "**`@Junction`** — tells `@Relation` how to bridge via the cross-ref.",
          "**Bidirectional** — model both `PlaylistWithSongs` and `SongWithPlaylists`.",
          "**No duplication** — the join table holds the associations.",
        ],
      },
      {
        t: "note",
        text: "Many-to-many: a cross-reference (junction) entity with both foreign keys (composite PK), then @Relation + @Junction to load associated entities across it. Model both directions (PlaylistWithSongs / SongWithPlaylists). The junction table holds associations without data duplication.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you set up a foreign key with cascade actions?",
    a: [
      {
        t: "p",
        text: "Declare `foreignKeys` in `@Entity` with `@ForeignKey`, specifying the parent entity, parent/child columns, and `onDelete`/`onUpdate` actions (`CASCADE`, `SET_NULL`, `RESTRICT`, `NO_ACTION`). `CASCADE` on delete automatically removes child rows when the parent is deleted. Add an index on the foreign-key column (Room warns if you don't) for performance.",
      },
      {
        t: "code",
        title: "@ForeignKey",
        code: `@Entity(
    foreignKeys = [ForeignKey(
        entity = User::class, parentColumns = ["id"], childColumns = ["userId"],
        onDelete = ForeignKey.CASCADE,
    )],
    indices = [Index("userId")],
)
data class Post(@PrimaryKey val id: String, val userId: String, val text: String)`,
      },
      {
        t: "list",
        items: [
          "**`@ForeignKey`** — parent/child columns + actions.",
          "**`onDelete = CASCADE`** — delete children with the parent.",
          "**`SET_NULL`/`RESTRICT`/`NO_ACTION`** — other behaviors.",
          "**Index the FK column** — Room warns; improves join/lookup speed.",
        ],
      },
      {
        t: "note",
        text: "Declare foreignKeys with @ForeignKey (parentColumns/childColumns + onDelete/onUpdate actions: CASCADE, SET_NULL, RESTRICT, NO_ACTION). CASCADE deletes children with the parent. Add an index on the FK column (Room warns otherwise) for join/lookup performance.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between @Embedded and @Relation?",
    a: [
      {
        t: "p",
        text: "`@Embedded` flattens a nested object into the *same* table's columns (one-to-one, stored inline) — no extra query. `@Relation` links to a *separate* table/entity via foreign keys and loads it with an additional query (one-to-many/many-to-many). Use `@Embedded` for value objects that belong to the row; `@Relation` for genuinely separate entities.",
      },
      {
        t: "list",
        items: [
          "**`@Embedded`** — inline the object's fields into the same table; no extra query.",
          "**`@Relation`** — separate entity/table, loaded via a second query by key.",
          "**Cardinality** — `@Embedded` one-to-one inline; `@Relation` one/many-to-many.",
          "**Choose** — value object of the row (Embedded) vs independent entity (Relation).",
        ],
      },
      {
        t: "note",
        text: "@Embedded flattens a nested object into the same table's columns (inline, one-to-one, no extra query). @Relation links a separate entity/table via foreign keys, loaded with an additional query (one/many-to-many). Use @Embedded for value objects belonging to the row; @Relation for independent entities.",
      },
    ],
  },
  {
    level: "senior",
    q: "What does a Migration object look like, and how do you register it?",
    a: [
      {
        t: "p",
        text: "A `Migration(startVersion, endVersion)` overrides `migrate(db)` where you run the SQL to transform the schema from one version to the next. You register it on the database builder with `.addMigrations(...)`. When the stored DB version differs from the `@Database(version = ...)`, Room runs the matching migration path.",
      },
      {
        t: "code",
        title: "A migration",
        code: `val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE users ADD COLUMN age INTEGER NOT NULL DEFAULT 0")
    }
}
Room.databaseBuilder(ctx, AppDatabase::class.java, "app.db")
    .addMigrations(MIGRATION_1_2).build()`,
      },
      {
        t: "list",
        items: [
          "**`Migration(from, to)`** — override `migrate(db)` with SQL.",
          "**`.addMigrations(...)`** — register on the builder.",
          "**Version bump** — increment `@Database(version)` for each schema change.",
          "**Path** — Room chains migrations (1→2→3) or uses a direct 1→3 if provided.",
        ],
      },
      {
        t: "note",
        text: "A Migration(startVersion, endVersion) overrides migrate(db) with SQL to transform the schema; register via .addMigrations(...). Bump @Database(version) per change. Room chains migrations along the path (1→2→3) or uses a direct one if provided. Missing migrations crash unless destructive fallback.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you add a new column or table in a migration?",
    a: [
      {
        t: "p",
        text: "Adding a *column* is simple: `ALTER TABLE table ADD COLUMN name TYPE NOT NULL DEFAULT value`. Adding a *table* is `CREATE TABLE ...` matching Room's expected schema exactly (column names, types, constraints). The generated schema JSON (from `exportSchema`) shows the exact `CREATE TABLE` Room expects, which you can copy.",
      },
      {
        t: "code",
        title: "Add column / table",
        code: `override fun migrate(db: SupportSQLiteDatabase) {
    db.execSQL("ALTER TABLE users ADD COLUMN verified INTEGER NOT NULL DEFAULT 0")
    db.execSQL("""CREATE TABLE IF NOT EXISTS orders (
        id TEXT NOT NULL PRIMARY KEY, userId TEXT NOT NULL, total INTEGER NOT NULL)""")
}`,
      },
      {
        t: "list",
        items: [
          "**Add column** — `ALTER TABLE ... ADD COLUMN` (with `NOT NULL DEFAULT` for non-null).",
          "**Add table** — `CREATE TABLE` matching Room's exact expected schema.",
          "**Match exactly** — types/constraints must match or Room's validation fails.",
          "**Copy from schema JSON** — the exported schema shows the exact DDL.",
        ],
      },
      {
        t: "note",
        text: "Add a column with ALTER TABLE ... ADD COLUMN (NOT NULL DEFAULT for non-null); add a table with CREATE TABLE matching Room's exact expected schema (types/constraints must match or validation fails). Copy the exact DDL from the exported schema JSON.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are Room auto-migrations, and when can you use them?",
    a: [
      {
        t: "p",
        text: "`@AutoMigration(from, to)` (Room 2.4+) lets Room *generate* the migration for simple schema changes (adding tables/columns) by diffing the exported schemas — no hand-written SQL. For ambiguous changes (renames, deletions, splits), you provide an `AutoMigrationSpec` with `@RenameColumn`/`@DeleteTable` hints. Complex transformations still need a manual `Migration`.",
      },
      {
        t: "code",
        title: "Auto-migration",
        code: `@Database(
    entities = [User::class], version = 2, exportSchema = true,
    autoMigrations = [AutoMigration(from = 1, to = 2)],
)
abstract class AppDatabase : RoomDatabase()

// For a rename, provide a spec:
@RenameColumn(tableName = "users", fromColumnName = "name", toColumnName = "full_name")
class MySpec : AutoMigrationSpec`,
      },
      {
        t: "list",
        items: [
          "**`@AutoMigration`** — generated from schema diffs (needs `exportSchema`).",
          "**Simple changes** — add table/column handled automatically.",
          "**`AutoMigrationSpec`** — hints for renames/deletions.",
          "**Complex** — data transformations still need a manual `Migration`.",
        ],
      },
      {
        t: "note",
        text: "@AutoMigration(from, to) (Room 2.4+) generates migrations for simple changes (add table/column) by diffing exported schemas (needs exportSchema). Provide an AutoMigrationSpec (@RenameColumn/@DeleteTable) for ambiguous changes. Complex data transformations still require a manual Migration.",
      },
    ],
  },
  {
    level: "junior",
    q: "What happens if you bump the database version without providing a migration?",
    a: [
      {
        t: "p",
        text: "Room throws `IllegalStateException: A migration from X to Y was required but not found` at runtime when it opens the database — the app crashes. You must either provide a `Migration` (or auto-migration) covering the version change, or opt into `fallbackToDestructiveMigration()` (which *wipes and recreates* the database, losing all data). Never ship a version bump without one of these.",
      },
      {
        t: "list",
        items: [
          "**Crash** — 'migration required but not found' at DB open.",
          "**Fix 1** — provide a `Migration`/auto-migration for the path.",
          "**Fix 2** — `fallbackToDestructiveMigration()` (wipes data — only for caches).",
          "**Never ship** — a version bump with neither.",
        ],
      },
      {
        t: "note",
        text: "Bumping @Database(version) without a migration crashes at DB open ('migration required but not found'). Provide a Migration/auto-migration, or opt into fallbackToDestructiveMigration() (wipes and recreates — only acceptable for caches, not user data). Never ship a version bump with neither.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test Room migrations?",
    a: [
      {
        t: "p",
        text: "Use `MigrationTestHelper` (with the exported schema JSON). Create the database at the *old* version, insert data, run `runMigrationsAndValidate(name, newVersion, validateDroppedTables, migration)` — it applies your migration and *validates* the resulting schema matches Room's expected schema, and you assert the data survived correctly. This catches broken migrations before release.",
      },
      {
        t: "code",
        title: "Migration test",
        code: `@get:Rule val helper = MigrationTestHelper(
    InstrumentationRegistry.getInstrumentation(), AppDatabase::class.java)

@Test fun migrate1To2() {
    helper.createDatabase(TEST_DB, 1).apply { execSQL("INSERT INTO users ..."); close() }
    val db = helper.runMigrationsAndValidate(TEST_DB, 2, true, MIGRATION_1_2)
    // assert data survived / new column exists
}`,
      },
      {
        t: "list",
        items: [
          "**`MigrationTestHelper`** — uses exported schemas.",
          "**Create at old version** — insert representative data.",
          "**`runMigrationsAndValidate`** — applies + validates the schema.",
          "**Assert data** — verify it migrated correctly.",
        ],
      },
      {
        t: "note",
        text: "Test migrations with MigrationTestHelper (needs exportSchema): create the DB at the old version, insert data, then runMigrationsAndValidate(name, newVersion, ..., migration) — it applies the migration and validates the schema matches Room's expected one; assert the data survived. Catches broken migrations pre-release.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you persist an enum, a List, or a Date in Room?",
    a: [
      {
        t: "p",
        text: "SQLite has no type for these, so you write a `TypeConverter` — a pair of functions converting the type to/from a storable primitive (String/Long). For an enum, store its `name`; for a `List`, serialize to JSON; for a `Date`, store the epoch millis. Register converters with `@TypeConverters` on the database (or entity/DAO).",
      },
      {
        t: "code",
        title: "TypeConverters",
        code: `class Converters {
    @TypeConverter fun fromStatus(s: Status) = s.name
    @TypeConverter fun toStatus(s: String) = Status.valueOf(s)
    @TypeConverter fun fromList(l: List<String>) = Json.encodeToString(l)
    @TypeConverter fun toList(s: String) = Json.decodeFromString<List<String>>(s)
    @TypeConverter fun fromDate(d: Date) = d.time
    @TypeConverter fun toDate(t: Long) = Date(t)
}`,
      },
      {
        t: "list",
        items: [
          "**Enum** — store `name` (or ordinal, but name is safer against reordering).",
          "**List/object** — serialize to JSON String.",
          "**Date** — store epoch millis (`Long`).",
          "**Register** — `@TypeConverters(Converters::class)` on the database/entity/DAO.",
        ],
      },
      {
        t: "note",
        text: "Write a TypeConverter (to/from a storable primitive) for non-SQLite types: enum → name (safer than ordinal), List/object → JSON String, Date → epoch millis (Long). Register with @TypeConverters(Converters::class) on the database (or entity/DAO to scope it). Consider a real relation for complex nested data.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the N+1 query problem with relations, and how does Room avoid it?",
    a: [
      {
        t: "p",
        text: "The N+1 problem is running 1 query for parents then N queries (one per parent) for children — slow for large lists. Room's `@Relation` *avoids* this: it runs *one* query for all parents and *one* query for all children (using `WHERE key IN (...)`), then stitches them in memory — 2 queries total regardless of parent count. So `@Relation` is efficient, unlike naive per-item loading.",
      },
      {
        t: "list",
        items: [
          "**N+1** — 1 parent query + N child queries (one per parent); slow.",
          "**Room `@Relation`** — 1 parent + 1 child query (`IN` batch), stitched in memory.",
          "**2 queries total** — regardless of parent count.",
          "**Avoid manual per-item queries** — use `@Relation` or a join.",
        ],
      },
      {
        t: "note",
        text: "N+1 = 1 parent query + N per-parent child queries (slow for big lists). Room's @Relation avoids it: one query for parents, one for all children (WHERE key IN (...)), stitched in memory — 2 queries total regardless of count. So @Relation is efficient; avoid manual per-item child queries.",
      },
    ],
  },
  {
    level: "senior",
    q: "When should you denormalize instead of using relations?",
    a: [
      {
        t: "p",
        text: "Relations (normalized data) avoid duplication and keep data consistent, but require joins/multiple queries. *Denormalization* (duplicating some data, e.g. storing an author's name on each post) trades storage and update complexity for *read speed* and simpler queries. Denormalize when reads dominate, the duplicated data rarely changes, and joins are a measured bottleneck — but keep the duplicates in sync.",
      },
      {
        t: "list",
        items: [
          "**Normalized (relations)** — no duplication, consistent, but joins.",
          "**Denormalized** — duplicate some data for faster reads/simpler queries.",
          "**When** — read-heavy, rarely-changing duplicated data, joins are a bottleneck.",
          "**Cost** — must keep duplicates in sync on writes.",
        ],
      },
      {
        t: "note",
        text: "Relations (normalized) avoid duplication and keep data consistent but need joins. Denormalize (duplicate some data — e.g. author name on each post) for faster reads/simpler queries when reads dominate and the duplicated data rarely changes and joins are a measured bottleneck. Cost: keep duplicates synced on writes.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do foreign key constraints get enforced, and how do you handle nullable foreign keys?",
    a: [
      {
        t: "p",
        text: "Room enables SQLite foreign-key enforcement by default when you declare `@ForeignKey`, so inserting a child with a non-existent parent fails. For an *optional* relationship, make the foreign-key column *nullable* and use `onDelete = SET_NULL` so deleting the parent nulls the reference instead of deleting the child. Ensure the FK column is indexed.",
      },
      {
        t: "list",
        items: [
          "**Enforcement** — declaring `@ForeignKey` enables constraint checking (bad refs fail).",
          "**Nullable FK** — optional relationship; the column can be null.",
          "**`onDelete = SET_NULL`** — parent delete nulls the child's reference.",
          "**Index the FK** — for performance and to satisfy Room's warning.",
        ],
      },
      {
        t: "note",
        text: "Declaring @ForeignKey enables SQLite FK enforcement (inserting a child with a missing parent fails). For optional relationships, make the FK column nullable and use onDelete = SET_NULL (parent delete nulls the reference instead of cascading). Index the FK column.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you migrate when you need to change a column type or rename it?",
    a: [
      {
        t: "p",
        text: "SQLite can't directly change a column type or (historically) rename easily, so use the *create-copy-drop-rename* pattern: create a new table with the desired schema, `INSERT INTO new SELECT ... FROM old` (transforming as needed), `DROP TABLE old`, and `ALTER TABLE new RENAME TO old`. This preserves data through an incompatible schema change.",
      },
      {
        t: "code",
        title: "Recreate-table migration",
        code: `override fun migrate(db: SupportSQLiteDatabase) {
    db.execSQL("CREATE TABLE users_new (id TEXT PRIMARY KEY NOT NULL, age INTEGER NOT NULL)")
    db.execSQL("INSERT INTO users_new (id, age) SELECT id, CAST(age AS INTEGER) FROM users")
    db.execSQL("DROP TABLE users")
    db.execSQL("ALTER TABLE users_new RENAME TO users")
}`,
      },
      {
        t: "list",
        items: [
          "**Create new table** — with the target schema.",
          "**Copy with transform** — `INSERT ... SELECT`, casting/converting.",
          "**Drop old, rename new** — swap in the new table.",
          "**In a transaction** — the migration runs atomically.",
        ],
      },
      {
        t: "note",
        text: "For type changes/renames SQLite can't do directly, use create-copy-drop-rename: CREATE new table with the target schema, INSERT ... SELECT (transforming), DROP old, ALTER ... RENAME TO old. The migration runs in a transaction (atomic). Test it with MigrationTestHelper.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a unique index, and how does it differ from a regular index?",
    a: [
      {
        t: "p",
        text: "A regular index speeds up lookups on a column. A *unique* index additionally *enforces uniqueness* — inserting a duplicate value fails (a constraint). Declare it via `@Index(value = [\"email\"], unique = true)`. Use it to guarantee no duplicate emails/usernames while also speeding lookups on that column.",
      },
      {
        t: "code",
        title: "Unique index",
        code: `@Entity(indices = [Index(value = ["email"], unique = true)])
data class User(@PrimaryKey val id: String, val email: String)`,
      },
      {
        t: "list",
        items: [
          "**Regular index** — faster lookups; allows duplicates.",
          "**Unique index** — faster lookups AND enforces uniqueness (duplicate insert fails).",
          "**`@Index(unique = true)`** — declare on the entity.",
          "**Composite** — a unique index over multiple columns enforces combined uniqueness.",
        ],
      },
      {
        t: "note",
        text: "A regular index speeds lookups (allows duplicates); a unique index also enforces uniqueness — duplicate inserts fail. Declare @Index(value = [\"email\"], unique = true). Use for no-duplicate constraints (email/username) while speeding lookups. Composite unique indices enforce combined uniqueness.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you add an index in a migration?",
    a: [
      {
        t: "p",
        text: "Run `CREATE INDEX` (or `CREATE UNIQUE INDEX`) in the migration's `migrate` method, using Room's index naming convention (`index_TableName_columnName`) so its schema validation passes. You add the index to the entity (`indices = [...]`) *and* create it in the migration — the entity declaration is for new installs, the migration for upgrades.",
      },
      {
        t: "code",
        title: "Index migration",
        code: `override fun migrate(db: SupportSQLiteDatabase) {
    db.execSQL("CREATE INDEX IF NOT EXISTS index_posts_userId ON posts(userId)")
}`,
      },
      {
        t: "list",
        items: [
          "**`CREATE INDEX`** in `migrate` — with Room's naming (`index_Table_column`).",
          "**Update the entity too** — `indices = [Index(\"userId\")]` for new installs.",
          "**Match the schema** — name must match or validation fails.",
          "**Unique** — `CREATE UNIQUE INDEX` for uniqueness.",
        ],
      },
      {
        t: "note",
        text: "Add an index in a migration with CREATE INDEX (IF NOT EXISTS) using Room's naming (index_Table_column) so schema validation passes, AND add indices = [...] to the entity (for new installs). The migration handles upgrades, the entity declaration handles fresh installs; names must match.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you model a one-to-one relationship in Room?",
    a: [
      {
        t: "p",
        text: "Two options: *embed* the related data with `@Embedded` (stored inline in the same row — simplest for a value object), or use `@Relation` between two entities where the child has a unique foreign key to the parent (separate tables, loaded via a second query). Use `@Embedded` for tightly-coupled value data; `@Relation` for a genuinely separate entity with its own lifecycle.",
      },
      {
        t: "code",
        title: "One-to-one via @Relation",
        code: `data class UserWithProfile(
    @Embedded val user: User,
    @Relation(parentColumn = "id", entityColumn = "userId")
    val profile: Profile,   // single object, not a list
)`,
      },
      {
        t: "list",
        items: [
          "**`@Embedded`** — inline value data in the same table.",
          "**`@Relation` (single)** — separate entity via a unique FK; a single object, not a list.",
          "**Choose** — value object (Embedded) vs independent entity (Relation).",
          "**Unique FK** — ensures the one-to-one cardinality.",
        ],
      },
      {
        t: "note",
        text: "One-to-one: @Embedded (inline value data in the same row — simplest) or @Relation between two entities with a unique FK (separate tables, second query, returns a single object not a list). Use @Embedded for tightly-coupled value data, @Relation for an independent entity.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a composite primary key, and how do you declare one?",
    a: [
      {
        t: "p",
        text: "A composite primary key uses *multiple columns* together as the unique identifier — declared via `@Entity(primaryKeys = [\"a\", \"b\"])`. It's common for *junction tables* (many-to-many cross-refs) where the pair of foreign keys uniquely identifies a row, and for natural keys spanning multiple fields.",
      },
      {
        t: "code",
        title: "Composite key",
        code: `@Entity(primaryKeys = ["playlistId", "songId"])
data class PlaylistSongCrossRef(val playlistId: String, val songId: String)`,
      },
      {
        t: "list",
        items: [
          "**`primaryKeys = [...]`** — multiple columns form the key.",
          "**Junction tables** — the FK pair is the natural composite key.",
          "**Uniqueness** — the *combination* must be unique.",
          "**vs single `@PrimaryKey`** — use that for a single-column key.",
        ],
      },
      {
        t: "note",
        text: "A composite primary key uses multiple columns together as the identifier: @Entity(primaryKeys = [\"a\", \"b\"]) — the combination must be unique. Common for junction tables (the FK pair) and multi-field natural keys. Use single @PrimaryKey for one-column keys.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Room decide the migration path across multiple versions?",
    a: [
      {
        t: "p",
        text: "Room finds a *path* of registered migrations from the stored version to the current `@Database(version)`. If you provide 1→2 and 2→3, it chains them for a 1→3 upgrade; if you also provide a direct 1→3, Room uses that (more efficient). If *no* path exists for some jump, it crashes (unless destructive fallback). So you must cover every version gap your users could upgrade from.",
      },
      {
        t: "list",
        items: [
          "**Path-finding** — chains registered migrations from stored → current version.",
          "**Chaining** — 1→2 + 2→3 covers 1→3; a direct 1→3 is used if provided.",
          "**Gaps crash** — a missing path throws (unless destructive fallback).",
          "**Cover all versions** — users may upgrade from any older version.",
        ],
      },
      {
        t: "note",
        text: "Room finds a path of registered migrations from the stored version to @Database(version) — chaining (1→2 + 2→3 covers 1→3) or using a direct migration if provided. A missing path crashes (unless destructive fallback). Cover every version gap your users could upgrade from.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does @Transaction do on a DAO method?",
    a: [
      {
        t: "p",
        text: "`@Transaction` makes a DAO method run its database work inside a *single transaction* — either all operations commit together or all roll back on failure. It's required for `@Relation` methods (multiple queries → consistency), for multi-step writes that must be atomic, and to get a consistent snapshot for a multi-query read.",
      },
      {
        t: "list",
        items: [
          "**Atomic** — all-or-nothing; rollback on exception.",
          "**`@Relation`** — needed so the parent + children queries are consistent.",
          "**Multi-step writes** — group inserts/updates atomically.",
          "**Consistent reads** — a multi-query read sees one snapshot.",
        ],
      },
      {
        t: "note",
        text: "@Transaction runs a DAO method's work in one transaction (all-or-nothing, rollback on failure). Required for @Relation methods (consistent multi-query reads), atomic multi-step writes, and consistent multi-query reads. For coroutine blocks spanning DAOs, use db.withTransaction { }.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle a migration that splits one table into two?",
    a: [
      {
        t: "p",
        text: "Create the two new tables, copy the relevant columns from the old table into each (`INSERT INTO new_a SELECT ...`, `INSERT INTO new_b SELECT ...`), then drop the old table. If the split introduces a relationship, populate the foreign keys during the copy. Do it all in the migration's transaction so it's atomic, and validate with `MigrationTestHelper`.",
      },
      {
        t: "code",
        title: "Splitting a table",
        code: `override fun migrate(db: SupportSQLiteDatabase) {
    db.execSQL("CREATE TABLE profiles (userId TEXT PRIMARY KEY NOT NULL, bio TEXT)")
    db.execSQL("INSERT INTO profiles (userId, bio) SELECT id, bio FROM users")
    db.execSQL("CREATE TABLE users_new (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL)")
    db.execSQL("INSERT INTO users_new (id, name) SELECT id, name FROM users")
    db.execSQL("DROP TABLE users")
    db.execSQL("ALTER TABLE users_new RENAME TO users")
}`,
      },
      {
        t: "list",
        items: [
          "**Create new tables** — the split targets.",
          "**Copy columns** — `INSERT ... SELECT` into each.",
          "**Populate FKs** — if the split creates a relationship.",
          "**Drop old + validate** — atomic in the transaction; test with MigrationTestHelper.",
        ],
      },
      {
        t: "note",
        text: "Split a table by creating the new tables, copying relevant columns into each (INSERT ... SELECT), populating any new foreign keys, then dropping the old table — all atomic in the migration's transaction. Validate with MigrationTestHelper against the exported schema.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the trade-off of adding an index to a Room entity?",
    a: [
      {
        t: "p",
        text: "An index *speeds up reads* (WHERE/JOIN/ORDER BY on the indexed column) by maintaining a sorted structure, but *slows down writes* (each insert/update/delete must also update the index) and uses extra storage. Add indices to columns you frequently filter/join/sort on (especially foreign keys), but don't index everything — measure and index where reads dominate.",
      },
      {
        t: "list",
        items: [
          "**Faster reads** — WHERE/JOIN/ORDER BY on the column.",
          "**Slower writes** — index maintenance on every write.",
          "**Extra storage** — the index structure.",
          "**Index selectively** — FKs and frequently-queried columns; not every column.",
        ],
      },
      {
        t: "note",
        text: "An index speeds reads (WHERE/JOIN/ORDER BY on the column) but slows writes (index maintenance per write) and uses storage. Index foreign keys and frequently filtered/joined/sorted columns; don't index everything — measure and index where reads dominate.",
      },
    ],
  },
  {
    level: "junior",
    q: "When is fallbackToDestructiveMigration acceptable?",
    a: [
      {
        t: "p",
        text: "`fallbackToDestructiveMigration()` tells Room to *drop and recreate* the database (losing all data) when a migration is missing. It's acceptable only for data that can be *regenerated* — a pure *cache* of remote data you can re-fetch. It is *never* acceptable for user-generated data (notes, drafts, offline changes) that can't be recovered. Prefer real migrations for anything the user would miss.",
      },
      {
        t: "list",
        items: [
          "**Destructive** — wipes and recreates the DB on a missing migration.",
          "**OK for caches** — data you can re-fetch/regenerate.",
          "**Never for user data** — unrecoverable loss.",
          "**Variants** — `fallbackToDestructiveMigrationOnDowngrade()`, `fallbackToDestructiveMigrationFrom(versions)`.",
        ],
      },
      {
        t: "note",
        text: "fallbackToDestructiveMigration() drops and recreates the DB (losing data) when a migration is missing — acceptable ONLY for regenerable caches (re-fetchable remote data), NEVER for user-generated data. Use real migrations for anything the user would miss. Variants scope it to downgrades or specific versions.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you return a nested relation efficiently for a list screen?",
    a: [
      {
        t: "p",
        text: "For a list of parents each with children, use a `@Relation` + `@Transaction` query returning `Flow<List<ParentWithChildren>>` — Room batches it into 2 queries. But if children lists are *large* or you only need a *count*, prefer a projection (parent + child count via a subquery/JOIN) instead of loading full child lists, to avoid pulling excessive data into memory for a scrolling list.",
      },
      {
        t: "list",
        items: [
          "**`@Relation` + `@Transaction`** — 2 queries, stitched; fine for small child lists.",
          "**Large children** — prefer a count/summary projection, not full lists.",
          "**Projection** — parent + `COUNT(child)` via subquery for list screens.",
          "**Paging** — for very large data, use Paging 3 with the relation.",
        ],
      },
      {
        t: "note",
        text: "For a list of parents+children, @Relation + @Transaction (Flow<List<ParentWithChildren>>) batches into 2 queries — fine for small child lists. For large children or when you only need a count, use a projection (parent + COUNT(child) subquery) to avoid loading big lists into memory; use Paging 3 for very large data.",
      },
    ],
  },
];

export default qa;
