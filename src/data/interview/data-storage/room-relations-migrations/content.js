// Room Relations & Migrations — Content tab. Teaching-first.

const content = [
  {
    heading: "Relationships between entities",
    blocks: [
      {
        t: "p",
        text: "Real data has relationships — a user *has many* posts, a playlist *contains many* songs. In a relational database these are modeled with **foreign keys** (a column in one table pointing to another table's key). Room lets you query related data together using `@Relation`, which fetches a parent and its children and assembles them into a combined object.",
      },
      {
        t: "code",
        title: "One-to-many with @Relation",
        code: `@Entity data class User(@PrimaryKey val id: String, val name: String)

@Entity data class Post(
    @PrimaryKey val id: String,
    val userId: String,           // foreign key -> User.id
    val text: String,
)

// A combined object: a user with all their posts
data class UserWithPosts(
    @Embedded val user: User,
    @Relation(parentColumn = "id", entityColumn = "userId")
    val posts: List<Post>,
)

@Dao interface UserDao {
    @Transaction                  // relations do multiple reads — keep consistent
    @Query("SELECT * FROM User")
    fun getUsersWithPosts(): Flow<List<UserWithPosts>>
}`,
      },
      {
        t: "list",
        items: [
          "**`@Embedded`** — inlines another object's columns into the query result (here the `User`'s columns). **`@Relation`** — tells Room to fetch the related rows (the posts whose `userId` matches the user's `id`) and populate the `posts` list.",
          "**Always annotate relation queries `@Transaction`** — Room does the parent query and the children query separately, so a transaction ensures they see a consistent snapshot (no write sneaking in between).",
          "**Types of relations**: one-to-one (a single related object), one-to-many (a list, as above), and many-to-many (via an intermediate 'junction'/'associative' table with `@Junction`, e.g. students↔courses).",
          "**`@ForeignKey`** — optionally declares an actual database foreign-key constraint (with `onDelete = CASCADE` etc.) for referential integrity — the DB enforces that a Post's `userId` refers to a real User. `@Relation` works without it, but foreign keys add DB-level integrity.",
        ],
      },
    ],
  },
  {
    heading: "Why migrations exist",
    blocks: [
      {
        t: "p",
        text: "Your database schema evolves — you add a column, a table, an index. But users have the *old* schema on their devices with *their data* in it. A **migration** is code that transforms the database from one schema version to the next *while preserving the user's data*. Without a correct migration, changing the schema crashes the app (Room detects the schema mismatch and throws) or, worse, loses user data.",
      },
      {
        t: "list",
        items: [
          "**The version number** in `@Database(version = N)` tracks the schema version. When you change the schema, you bump the version and provide a migration from the old version to the new one.",
          "**Room compares the schema at startup**: if the code's schema (version N) doesn't match the on-device database (version N-1) and there's no migration path, Room throws `IllegalStateException`. Migrations bridge the gap.",
          "**The stakes**: this is *user data* — losing it (an account's saved content, offline data) is a serious bug. Migrations must be correct and tested.",
        ],
      },
    ],
  },
  {
    heading: "Writing a migration",
    blocks: [
      {
        t: "code",
        title: "A migration adding a column",
        code: `val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(db: SupportSQLiteDatabase) {
        // raw SQL to transform the schema, preserving data
        db.execSQL("ALTER TABLE users ADD COLUMN phone TEXT")
    }
}

val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY NOT NULL, userId TEXT)")
    }
}

Room.databaseBuilder(context, AppDatabase::class.java, "app.db")
    .addMigrations(MIGRATION_1_2, MIGRATION_2_3)   // register all migrations
    .build()`,
      },
      {
        t: "list",
        items: [
          "A `Migration(from, to)` runs raw SQL (`ALTER TABLE`, `CREATE TABLE`, etc.) to change the schema *without dropping existing data*. Room runs the chain of migrations needed to get from the device's version to the current one (e.g. 1→2→3).",
          "**Complex migrations** (splitting a table, changing a column type, adding a NOT NULL column with a default) require careful SQL — often create a new table, copy transformed data, drop the old, rename. SQLite's limited `ALTER TABLE` sometimes forces this create-copy-drop-rename dance.",
          "**Export the schema** (`room.schemaLocation`) — Room can export a JSON schema per version, which enables *automated migration testing* (`MigrationTestHelper`) that verifies a migration produces the expected schema and preserves data. Testing migrations is essential because they touch real user data.",
        ],
      },
    ],
  },
  {
    heading: "Automated migrations and the destructive shortcut",
    blocks: [
      {
        t: "list",
        items: [
          "**`@AutoMigration`** (Room 2.4+) — for *simple* schema changes (adding a column/table), Room can *generate* the migration for you: `@Database(autoMigrations = [AutoMigration(from = 1, to = 2)])`. You only hand-write migrations for changes Room can't infer (renames, deletes, type changes — where you use `@RenameColumn`/`@DeleteColumn` spec hints). Auto-migrations reduce boilerplate and error for the common cases.",
          "**`fallbackToDestructiveMigration()`** — the shortcut that *drops and recreates* the database (losing all data) when a migration is missing. **Never ship this to production** — it wipes user data on every schema change. It's acceptable *only* during development (when your local data is disposable) to avoid writing migrations while iterating. Shipping it means users lose their data on app updates.",
          "**The decision**: production apps must have real migrations (auto or manual) for every version bump. Destructive fallback is a dev convenience only.",
        ],
      },
    ],
  },
  {
    heading: "Type converters and indices",
    blocks: [
      {
        t: "code",
        title: "TypeConverter for a non-primitive type",
        code: `class Converters {
    @TypeConverter fun fromDate(date: Date?): Long? = date?.time
    @TypeConverter fun toDate(millis: Long?): Date? = millis?.let { Date(it) }
}

@Database(entities = [Event::class], version = 1)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() { /* ... */ }`,
      },
      {
        t: "list",
        items: [
          "**Type converters** — SQLite stores only primitives, String, and blobs. For a custom type (a `Date`, an enum, a `List` serialized to JSON), you write a `@TypeConverter` pair telling Room how to convert to/from a storable type. Register them with `@TypeConverters`.",
          "**Indices** (`@Entity(indices = [Index(\"userId\")])`) — like a book's index, they speed up queries that filter/sort on a column, at the cost of extra storage and slightly slower writes. Add an index to columns you frequently query by (especially foreign keys). Room warns if a foreign key column isn't indexed.",
          "**`@Fts4`** — full-text search support for fast text search over a table.",
        ],
      },
      {
        t: "note",
        text: "Relations & migrations essentials: model relationships with @Relation + @Embedded (annotate the query @Transaction); foreign keys add DB-level integrity. Migrations transform the schema across versions while preserving user data — bump the version, provide a Migration (or @AutoMigration for simple changes), and TEST them. Never ship fallbackToDestructiveMigration (it wipes data). Type converters handle non-primitive types; indices speed up filtered queries.",
      },
    ],
  },
];

export default content;
