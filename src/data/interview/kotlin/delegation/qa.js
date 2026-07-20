// Delegation & Advanced — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is the difference between lateinit and lazy?",
    a: [
      {
        t: "p",
        text: "**Both let you delay initialization of a property, but they work differently and suit different situations.** `lateinit var` is a mutable property you promise to assign *yourself, later*, before using it — the initialization is your responsibility and can happen anytime (and be reassigned). `by lazy { }` is a read-only property whose value is computed *automatically on first access* by the lazy block, then cached.",
      },
      {
        t: "list",
        items: [
          "**`lateinit var`**: mutable (`var`), non-null object types only (no `Int`/`Boolean`), you assign it explicitly (often in a framework callback or via DI), and accessing it before assignment throws `UninitializedPropertyAccessException`. Use for values set later by external code — a Fragment's binding set in `onCreateView`, an injected dependency.",
          "**`by lazy { }`**: read-only (`val`), works with any type, initializes itself on first read, caches the result, and is thread-safe by default. Use for expensive values that should be computed once, on demand — a lazily-created repository, a parsed config.",
        ],
      },
      {
        t: "code",
        title: "Each in its place",
        code: `private lateinit var binding: FragmentBinding    // assigned later in onCreateView
val db: Database by lazy { buildExpensiveDb() }  // computed once, on first use`,
      },
      {
        t: "p",
        text: "Quick chooser: is it *mutable and set by someone else later*? → `lateinit`. Is it *read-only and expensive to compute once on demand*? → `lazy`. And remember `lateinit` can't hold primitives or nullables, while `lazy` can hold anything.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does 'by lazy' do and is it thread-safe?",
    a: [
      {
        t: "p",
        text: "**The concept**: `val x by lazy { ... }` defers computing `x` until the *first time it's read*. The block runs once, on first access, and the result is cached — every subsequent read returns the cached value without re-running the block. If the property is never accessed, the block never runs.",
      },
      {
        t: "p",
        text: "**Thread safety**: yes, by default. The default mode is `LazyThreadSafetyMode.SYNCHRONIZED`, which uses a lock to ensure that even if multiple threads access the property simultaneously on first use, the block runs *exactly once* and all threads see the same value. This makes it safe to use for shared lazy state. If you know the property is only accessed from a single thread, you can pass `LazyThreadSafetyMode.NONE` for a faster version that skips the locking (`by lazy(LazyThreadSafetyMode.NONE) { }`). There's also `PUBLICATION` mode (the block may run on multiple threads but only the first result is used). The default SYNCHRONIZED is the safe choice, and you only optimize to NONE when you're certain about single-threaded access and it's a hot path.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is class delegation with the 'by' keyword?",
    a: [
      {
        t: "p",
        text: "**The concept**: class delegation lets a class implement an interface by *forwarding all its methods to another object* that already implements that interface — without you writing the forwarding boilerplate. `class Wrapper(base: Foo) : Foo by base` automatically implements every method of `Foo` by delegating to `base`. You then override only the methods you want to change.",
      },
      {
        t: "code",
        title: "Decorator with almost no boilerplate",
        code: `interface Repository { fun getAll(): List<Item>; fun save(item: Item) }

class CachingRepository(private val base: Repository) : Repository by base {
    private val cache = mutableListOf<Item>()
    override fun getAll(): List<Item> = cache.ifEmpty { base.getAll().also { cache.addAll(it) } }
    // save() is auto-forwarded to base — no code needed
}`,
      },
      {
        t: "p",
        text: "This is Kotlin's language-level support for **composition over inheritance** — the decorator pattern. Instead of subclassing (which couples you to the base class's implementation and risks the fragile-base-class problem), you *wrap* an object and forward to it, overriding selectively. The compiler generates all the forwarding methods, so adding logging, caching, or validation around an existing implementation takes almost no code. It's a big reason Kotlin can genuinely favor composition — the boilerplate that made composition tedious in Java is gone.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does property delegation work?",
    a: [
      {
        t: "p",
        text: "**The concept**: `val x by delegate` routes the property's get (and set, for `var`) to another object — the delegate. Reading `x` doesn't read a field directly; it calls `delegate.getValue(...)`. Writing calls `delegate.setValue(...)`. The delegate encapsulates whatever logic backs the property.",
      },
      {
        t: "code",
        title: "The compiler rewrites property access into delegate calls",
        code: `val name: String by SomeDelegate()
// reading 'name'  -> SomeDelegate.getValue(thisRef, property)
// (for var) writing -> SomeDelegate.setValue(thisRef, property, value)`,
      },
      {
        t: "p",
        text: "This is how `by lazy`, `Delegates.observable`, and map-backed properties all work — they're just objects providing `getValue`/`setValue`. And because it's a simple convention, you can write *custom* delegates: implement `ReadOnlyProperty`/`ReadWriteProperty` (or the operator functions directly) to back a property with anything — SharedPreferences, a database, a network value, a computed cache. For example, a `PrefDelegate` can make `var token: String by PrefDelegate(prefs, \"token\")` read and write directly to SharedPreferences transparently. Property delegation is Kotlin's mechanism for factoring out reusable get/set behavior.",
      },
    ],
  },
  {
    level: "senior",
    q: "When would you write a custom property delegate, and what does it need to implement?",
    a: [
      {
        t: "p",
        text: "**You write a custom delegate when the same get/set *behavior* recurs across many properties and you want to factor it out cleanly.** The classic examples: properties backed by SharedPreferences/DataStore, properties that log or validate on change, properties computed from a resource, or properties with custom caching. Instead of writing a custom getter/setter on each one, you write the logic once in a delegate and apply it with `by`.",
      },
      {
        t: "code",
        title: "A reusable SharedPreferences delegate",
        code: `class StringPref(
    private val prefs: SharedPreferences,
    private val key: String,
    private val default: String = "",
) : ReadWriteProperty<Any?, String> {
    override fun getValue(thisRef: Any?, property: KProperty<*>) =
        prefs.getString(key, default) ?: default
    override fun setValue(thisRef: Any?, property: KProperty<*>, value: String) =
        prefs.edit().putString(key, value).apply()
}

// Now every pref-backed property is one line:
class Settings(prefs: SharedPreferences) {
    var authToken: String by StringPref(prefs, "token")
    var username: String by StringPref(prefs, "username")
}`,
      },
      {
        t: "list",
        items: [
          "**What it must implement**: for a read-only (`val`) property, `getValue(thisRef, property)` — either directly as an `operator fun` or by implementing `ReadOnlyProperty<R, T>`. For a mutable (`var`) property, also `setValue(thisRef, property, value)` — via `ReadWriteProperty<R, T>`. The `property: KProperty<*>` parameter gives reflection info (like the property name), which is handy — e.g. you could default the preferences key to the property's own name.",
          "**`provideDelegate`** (advanced): a delegate can also implement `provideDelegate` to run logic at the moment the delegate is *created and bound* to a property — useful for validation or registration at construction time (e.g. checking the property name, registering with a container).",
          "**Why it's powerful**: it turns cross-cutting property behavior into a reusable, testable unit. The SharedPreferences example collapses dozens of boilerplate getter/setter pairs into one-liners, and you can unit-test the delegate once instead of every property. Libraries use this extensively — Koin/Hilt-style injection (`by inject()`), navigation args (`by navArgs()`), and `viewModels()` are all custom delegates.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "Why does Kotlin favor 'composition over inheritance', and how does class delegation support that?",
    a: [
      {
        t: "p",
        text: "**The principle 'composition over inheritance' says: to reuse and extend behavior, prefer *containing* another object and forwarding to it (composition) over *subclassing* it (inheritance).** Inheritance has well-known problems: it creates tight coupling to the base class's implementation details, suffers the 'fragile base class' problem (a base-class change silently breaks subclasses), forces a single-inheritance hierarchy, and exposes all of the base's protected members. Composition avoids all of these — you depend only on the *interface* of the object you wrap, not its internals.",
      },
      {
        t: "list",
        items: [
          "**The historical friction**: composition was always 'better' in theory, but in Java it meant writing tedious forwarding methods — to wrap a `List` and change one method, you had to manually implement all ~25 `List` methods to forward to the wrapped instance. That boilerplate pushed people toward inheritance out of laziness.",
          "**How `by` removes the friction**: `class MyList(private val base: List<T>) : List<T> by base` generates *all* the forwarding methods automatically. Now wrapping-and-overriding-one-method is as little code as subclassing-and-overriding-one-method — so composition is finally as *convenient* as inheritance, not just as *correct*.",
          "**Concrete benefits in practice**: you can decorate a repository with logging/caching/retry without subclassing it (and without the base needing to be `open`); you can compose multiple behaviors by wrapping wrappers; and you depend only on the interface, so the wrapped implementation can be swapped or mocked freely. It also plays well with Kotlin's default-`final` classes — you don't need to make classes `open` for inheritance, because you compose instead.",
        ],
      },
      {
        t: "code",
        title: "Stacking behaviors via composition",
        code: `val repo: Repository =
    LoggingRepository(
        CachingRepository(
            NetworkRepository()
        )
    )
// Each layer wraps the next via 'by', overriding only what it changes.
// Impossible to express this cleanly with single inheritance.`,
      },
      {
        t: "p",
        text: "**The senior framing**: Kotlin's design nudges you toward composition in several ways — classes are `final` by default (inheritance requires explicit `open`), and `by` makes delegation nearly free. The language is deliberately making the *better* design (composition) also the *easier* one, correcting Java's accidental bias toward inheritance-via-boilerplate-avoidance. Class delegation is the concrete feature that makes 'prefer composition' practical rather than aspirational.",
      },
    ],
  },
];

export default qa;
