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
  {
    level: "senior",
    q: "What are the thread-safety modes of lazy (SYNCHRONIZED, PUBLICATION, NONE)?",
    a: [
      {
        t: "p",
        text: "`lazy { }` takes a `LazyThreadSafetyMode`. `SYNCHRONIZED` (the default) locks so the initializer runs *once* even across threads. `PUBLICATION` allows multiple threads to run the initializer concurrently but the *first result* wins (all get the same value). `NONE` skips synchronization entirely — fastest, but only safe when accessed from a single thread.",
      },
      {
        t: "code",
        title: "lazy modes",
        code: `val a by lazy { compute() }                                    // SYNCHRONIZED (default)
val b by lazy(LazyThreadSafetyMode.PUBLICATION) { compute() }  // first result wins
val c by lazy(LazyThreadSafetyMode.NONE) { compute() }         // single-thread only, fastest`,
      },
      {
        t: "list",
        items: [
          "**`SYNCHRONIZED` (default)** — thread-safe; initializer runs exactly once (locking).",
          "**`PUBLICATION`** — concurrent init allowed, first result published to all.",
          "**`NONE`** — no synchronization; fastest; only for single-threaded access (e.g. main-thread UI).",
          "**Trade-off** — safety vs the small locking overhead; `NONE` when you know it's single-threaded.",
        ],
      },
      {
        t: "note",
        text: "lazy modes: SYNCHRONIZED (default — locks, runs once across threads), PUBLICATION (concurrent init, first result wins), NONE (no sync, fastest, single-thread only). Use the default for shared state; NONE for main-thread-only properties to skip locking overhead.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Delegates.observable, and how do you react to property changes?",
    a: [
      {
        t: "p",
        text: "`Delegates.observable(initial) { property, old, new -> }` is a built-in delegate whose callback fires *after* the property changes — giving you the old and new values. It's a clean way to run logic on assignment (logging, triggering updates) without a custom setter.",
      },
      {
        t: "code",
        title: "observable",
        code: `var name: String by Delegates.observable("") { prop, old, new ->
    println("\${prop.name}: \$old -> \$new")
    if (old != new) onNameChanged(new)
}
name = "Sam"   // triggers the callback`,
      },
      {
        t: "list",
        items: [
          "**`Delegates.observable(init) { }`** — callback runs after each assignment.",
          "**Old + new values** — react to the change.",
          "**Uses** — logging, invalidating caches, notifying observers.",
          "**vs custom setter** — no backing-field boilerplate.",
        ],
      },
      {
        t: "note",
        text: "Delegates.observable(initial) { prop, old, new -> } fires a callback AFTER each assignment with the old and new values — for logging, cache invalidation, or notifying observers, without writing a custom setter. Delegates.vetoable is the variant that can reject changes.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Delegates.vetoable, and how does it differ from observable?",
    a: [
      {
        t: "p",
        text: "`Delegates.vetoable(initial) { property, old, new -> Boolean }` runs *before* the change and can *reject* it — if the lambda returns `false`, the assignment is discarded and the property keeps its old value. `observable` fires *after* and can't prevent the change. Use `vetoable` for validation that should block invalid values.",
      },
      {
        t: "code",
        title: "vetoable",
        code: `var age: Int by Delegates.vetoable(0) { _, old, new ->
    new >= 0        // reject negatives; property stays at old value
}
age = -5    // rejected; age stays 0
age = 30    // accepted`,
      },
      {
        t: "list",
        items: [
          "**`vetoable(init) { } : Boolean`** — return `false` to reject the assignment.",
          "**Runs before** — validates before committing.",
          "**vs `observable`** — observable runs after and can't reject.",
          "**Uses** — enforce invariants/ranges on assignment.",
        ],
      },
      {
        t: "note",
        text: "Delegates.vetoable(initial) { _, old, new -> Boolean } runs BEFORE the change and rejects it if the lambda returns false (property keeps the old value) — for validation. observable runs AFTER and can't reject. Use vetoable to enforce invariants on assignment.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a map-backed property delegate (by map)?",
    a: [
      {
        t: "p",
        text: "A property can be delegated to a `Map` — `val name: String by map` reads the value from `map[\"name\"]`. This is handy for dynamic data like parsing JSON into a typed object, or configuration. A `MutableMap` supports `var` properties (writes go back to the map).",
      },
      {
        t: "code",
        title: "by map",
        code: `class User(map: Map<String, Any?>) {
    val name: String by map        // reads map["name"]
    val age: Int by map            // reads map["age"]
}
val u = User(mapOf("name" to "Sam", "age" to 30))
u.name   // "Sam"`,
      },
      {
        t: "list",
        items: [
          "**`by map`** — property reads from the map by its name.",
          "**`MutableMap`** — enables `var` (writes update the map).",
          "**Uses** — dynamic/loosely-typed data (JSON, config) mapped to typed properties.",
          "**Caveat** — missing keys / type mismatches fail at runtime.",
        ],
      },
      {
        t: "note",
        text: "val name: String by map reads the property from map[\"name\"] (MutableMap enables var, writing back) — handy for mapping dynamic/loosely-typed data (JSON, config) to typed properties. Caveat: missing keys or type mismatches fail at runtime, not compile time.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is Delegates.notNull, and how does it compare to lateinit?",
    a: [
      {
        t: "p",
        text: "`Delegates.notNull<T>()` is a delegate for a non-null property initialized later — accessing it before assignment throws `IllegalStateException`. It's similar to `lateinit`, but works for *primitive types* (which `lateinit` doesn't support) at the cost of boxing. Prefer `lateinit` for object types; use `Delegates.notNull` when you need a late-initialized primitive.",
      },
      {
        t: "code",
        title: "notNull for primitives",
        code: `var count: Int by Delegates.notNull()   // lateinit doesn't work for Int
fun init() { count = 5 }
// count before init() -> IllegalStateException`,
      },
      {
        t: "list",
        items: [
          "**`Delegates.notNull<T>()`** — late-initialized non-null property; throws if accessed before set.",
          "**Works for primitives** — unlike `lateinit` (which needs object types).",
          "**Boxing cost** — the delegate boxes the value.",
          "**Prefer `lateinit`** — for non-primitive types (no delegate overhead).",
        ],
      },
      {
        t: "note",
        text: "Delegates.notNull<T>() is a delegate for a late-initialized non-null property (throws if accessed before set) — works for PRIMITIVES (which lateinit can't do), at a boxing cost. Prefer lateinit for object types; use Delegates.notNull for a late-init primitive like Int.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does a custom property delegate work (getValue/setValue)?",
    a: [
      {
        t: "p",
        text: "A delegate is any object providing `operator fun getValue(thisRef, property)` (and `setValue(...)` for `var`). Kotlin translates `val x by delegate` into calls to these. You can implement them directly, or implement `ReadOnlyProperty`/`ReadWriteProperty` interfaces. The `property` parameter (a `KProperty`) gives metadata like the property name.",
      },
      {
        t: "code",
        title: "A custom delegate",
        code: `class Preference(private val key: String, private val default: String) {
    operator fun getValue(thisRef: Any?, property: KProperty<*>): String =
        prefs.getString(key, default)!!
    operator fun setValue(thisRef: Any?, property: KProperty<*>, value: String) {
        prefs.edit().putString(key, value).apply()
    }
}
var username: String by Preference("username", "")`,
      },
      {
        t: "list",
        items: [
          "**`getValue(thisRef, property)`** — returns the value (for `val`/`var`).",
          "**`setValue(thisRef, property, value)`** — stores it (for `var`).",
          "**`ReadWriteProperty<R, T>`** — an interface bundling both.",
          "**`property.name`** — the delegated property's name (useful as a key).",
        ],
      },
      {
        t: "note",
        text: "A custom delegate provides operator fun getValue(thisRef, property) (and setValue for var) — Kotlin translates `val x by delegate` into these calls. Implement directly or via ReadOnlyProperty/ReadWriteProperty. property.name gives the name (handy as a storage key, e.g. a SharedPreferences-backed property).",
      },
    ],
  },
  {
    level: "senior",
    q: "Does class delegation forward calls to overridden methods?",
    a: [
      {
        t: "p",
        text: "This is a subtle gotcha. With `class C(b: Base) : Base by b`, calls to `C`'s inherited methods forward to the delegate `b`. But if `C` *overrides* a method, the delegate `b` doesn't know about that override — internal calls *within* `b` still call `b`'s own implementation, not `C`'s override. So class delegation doesn't give you the polymorphism you'd get from inheritance.",
      },
      {
        t: "code",
        title: "Override isn't seen by the delegate",
        code: `interface Base { fun a(); fun b() }
class Impl : Base {
    override fun a() { println("Impl.a"); b() }   // calls Impl.b, not the override
    override fun b() { println("Impl.b") }
}
class Deco(base: Base) : Base by base {
    override fun b() { println("Deco.b") }
}
Deco(Impl()).a()   // prints "Impl.a" then "Impl.b" — Deco.b NOT called`,
      },
      {
        t: "list",
        items: [
          "**Forwarding** — inherited methods delegate to the wrapped object.",
          "**Override gotcha** — the delegate's internal calls don't dispatch to your override.",
          "**No inheritance polymorphism** — delegation composes, it doesn't subclass.",
          "**Design around it** — don't expect overrides to intercept the delegate's internal calls.",
        ],
      },
      {
        t: "note",
        text: "Class delegation (C : Base by b) forwards inherited methods to b, but b's internal calls do NOT dispatch to C's overrides (b doesn't know about C). So overriding a method doesn't intercept the delegate's internal usage — delegation composes, it isn't inheritance polymorphism. Design around this.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does 'by viewModels()' delegation work in Android?",
    a: [
      {
        t: "p",
        text: "`by viewModels()` is a property delegate (from the fragment/activity-ktx libraries) that lazily obtains a `ViewModel` scoped to the component. It handles the `ViewModelProvider` boilerplate and returns the same instance across configuration changes. Variants include `by activityViewModels()` (Activity-scoped, shared across fragments) and Hilt's `by hiltViewModel()` (in Compose).",
      },
      {
        t: "code",
        title: "viewModels delegate",
        code: `class MyFragment : Fragment() {
    private val viewModel: MyViewModel by viewModels()             // fragment-scoped
    private val shared: SharedViewModel by activityViewModels()    // activity-scoped
}`,
      },
      {
        t: "list",
        items: [
          "**`by viewModels()`** — lazy, component-scoped ViewModel; hides `ViewModelProvider` boilerplate.",
          "**`by activityViewModels()`** — Activity-scoped, shared across the Activity's fragments.",
          "**Survives config change** — returns the retained instance.",
          "**Factory** — pass a factory lambda for constructor args (or use Hilt).",
        ],
      },
      {
        t: "note",
        text: "by viewModels() is a lazy property delegate that obtains a component-scoped ViewModel (hiding ViewModelProvider boilerplate, returning the retained instance across config changes). by activityViewModels() scopes to the Activity (shared across fragments); pass a factory for constructor args, or use Hilt.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does 'by remember' work as a delegate in Compose?",
    a: [
      {
        t: "p",
        text: "`var count by remember { mutableStateOf(0) }` uses property delegation: `MutableState<T>` provides `getValue`/`setValue` operators, so `by` unwraps `.value` automatically — reading `count` reads `state.value`, writing `count` writes `state.value`. This gives clean `count++` syntax instead of `count.value++`.",
      },
      {
        t: "code",
        title: "by mutableStateOf",
        code: `var count by remember { mutableStateOf(0) }   // delegate unwraps .value
count++          // == count.value++
// vs without delegation:
val state = remember { mutableStateOf(0) }
state.value++`,
      },
      {
        t: "list",
        items: [
          "**`MutableState` is a delegate** — provides `getValue`/`setValue` for `.value`.",
          "**`by`** — transparently reads/writes `.value`.",
          "**Cleaner syntax** — `count++` instead of `count.value++`.",
          "**Import** — needs `getValue`/`setValue` imports (usually auto-added).",
        ],
      },
      {
        t: "note",
        text: "var x by remember { mutableStateOf(0) } uses property delegation — MutableState provides getValue/setValue, so `by` unwraps .value, giving clean x++/x = ... syntax instead of x.value. Needs the getValue/setValue imports (auto-added).",
      },
    ],
  },
  {
    level: "senior",
    q: "When is lazy inappropriate, and what should you use instead?",
    a: [
      {
        t: "p",
        text: "`lazy` computes its value *once* and caches it forever — so it's wrong for values that need to *recompute* when dependencies change, or that depend on state not available at first access. For values derived from changing inputs, use a computed property (custom getter) or `derivedStateOf` (Compose); for late-but-settable values, use `lateinit`/`Delegates.notNull`.",
      },
      {
        t: "list",
        items: [
          "**`lazy`** — one-time, cached; for expensive values that never change once computed.",
          "**Not for changing values** — it won't recompute; use a computed property (`get()`).",
          "**Compose derivations** — `derivedStateOf` for values from changing state.",
          "**Late-settable** — `lateinit`/`Delegates.notNull` for values assigned later (not computed once).",
        ],
      },
      {
        t: "note",
        text: "lazy computes once and caches forever — wrong for values that must recompute when inputs change, or depend on not-yet-available state. Use a computed property (custom getter) or derivedStateOf (Compose) for changing values; lateinit/Delegates.notNull for late-but-settable values.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you compose behavior by delegating an interface to multiple objects?",
    a: [
      {
        t: "p",
        text: "You can implement several interfaces by delegating each to a different object — `class C : A by a, B by b` — composing behaviors from independent implementations without inheritance. This is powerful for mixing capabilities (e.g. a class that is both a `Logger` and a `Cache`) while keeping each concern in its own reusable object.",
      },
      {
        t: "code",
        title: "Composing via delegation",
        code: `interface Logger { fun log(m: String) }
interface Cache { fun get(k: String): String? }
class Service(
    logger: Logger, cache: Cache,
) : Logger by logger, Cache by cache      // composes both behaviors`,
      },
      {
        t: "list",
        items: [
          "**Multiple `by`** — delegate each interface to a separate implementation.",
          "**Composition** — mix capabilities without deep inheritance.",
          "**Reusable parts** — each behavior lives in its own object.",
          "**Override selectively** — provide your own version of specific methods.",
        ],
      },
      {
        t: "note",
        text: "class C : A by a, B by b composes behaviors by delegating each interface to a separate object — mixing capabilities (Logger + Cache) without inheritance, keeping each concern reusable. Override specific methods where you need custom behavior (mind the delegate-override gotcha).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the overhead of property delegation?",
    a: [
      {
        t: "p",
        text: "Each delegated property involves an extra object (the delegate) and an indirection through `getValue`/`setValue` calls, and often stores a `KProperty` metadata reference. For most code this is negligible, but in *very* hot paths or when creating huge numbers of instances, the extra allocation/indirection can matter — a plain field or computed property may be leaner.",
      },
      {
        t: "list",
        items: [
          "**Extra object** — the delegate instance per property.",
          "**Indirection** — `getValue`/`setValue` calls instead of direct field access.",
          "**Metadata** — a `KProperty` reference is generated.",
          "**Usually negligible** — matters only in hot paths / mass instantiation; then prefer plain fields.",
        ],
      },
      {
        t: "note",
        text: "Property delegation adds an extra delegate object, indirection through getValue/setValue, and a KProperty reference — negligible for most code, but in very hot paths or mass object creation the allocation/indirection can matter; a plain field or computed property is leaner there.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you delegate a property to another object's property?",
    a: [
      {
        t: "p",
        text: "Using the `::property` reference and the `getValue`/`setValue` extensions, you can delegate one property to another — `val x: Int by other::y` makes `x` read/write `other.y`. This is useful for renaming, forwarding, or exposing a nested property at a higher level.",
      },
      {
        t: "code",
        title: "Delegating to another property",
        code: `class Wrapper(val inner: Inner) {
    var value: Int by inner::count    // reads/writes inner.count
}`,
      },
      {
        t: "list",
        items: [
          "**`by other::prop`** — delegate to another object's property.",
          "**Forwarding** — expose or rename a nested property.",
          "**`var` support** — writes forward if the target is mutable.",
          "**Refactoring aid** — delegate a deprecated name to the new one.",
        ],
      },
      {
        t: "note",
        text: "val x by other::y delegates a property to another object's property (reads/writes forward). Useful for exposing/renaming a nested property or forwarding a deprecated name to a new one. var works if the target is mutable.",
      },
    ],
  },
  {
    level: "junior",
    q: "Is a lazy property computed once, and is the result cached?",
    a: [
      {
        t: "p",
        text: "Yes — `by lazy { }` runs its initializer on the *first* access and *caches* the result; every subsequent access returns the same cached value without re-running the initializer. This makes it ideal for expensive one-time initialization (parsing config, building a heavy object) that you want deferred until needed.",
      },
      {
        t: "code",
        title: "lazy caches",
        code: `val config by lazy {
    println("computing")   // prints only on first access
    parseConfig()
}
config   // "computing" + value
config   // cached value, no re-computation`,
      },
      {
        t: "list",
        items: [
          "**First access** — runs the initializer.",
          "**Cached** — subsequent accesses return the stored value.",
          "**Deferred** — nothing happens until first use.",
          "**One-time init** — expensive setup you may not always need.",
        ],
      },
      {
        t: "note",
        text: "Yes — by lazy { } runs its initializer on first access and caches the result; later accesses return the cached value without recomputing. Ideal for deferred, expensive one-time initialization (parsing config, building a heavy object) you may not always need.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between a property delegate and a computed property?",
    a: [
      {
        t: "p",
        text: "A *computed property* (custom `get()`) recomputes its value on *every* access — no storage. A *delegated property* (`by`) routes access through a delegate object that decides how to store/compute/cache. So `by lazy` caches (unlike a computed getter that recomputes), and delegates can add behavior (observation, persistence) a plain getter can't.",
      },
      {
        t: "list",
        items: [
          "**Computed property** — `get()` recomputes each access; no state.",
          "**Delegated property** — `by delegate`; delegate controls storage/behavior (caching, persistence, observation).",
          "**`by lazy`** — caches (computed getter wouldn't).",
          "**Reusable** — a delegate encapsulates behavior across many properties; a getter is per-property.",
        ],
      },
      {
        t: "note",
        text: "A computed property (custom get()) recomputes on every access (no storage); a delegated property (by) routes access through a delegate that controls storage/behavior — so by lazy caches, and delegates add reusable behavior (observation, persistence) a getter can't. Delegates are reusable across properties.",
      },
    ],
  },
  {
    level: "senior",
    q: "How would you build a SharedPreferences-backed property delegate?",
    a: [
      {
        t: "p",
        text: "Implement a delegate whose `getValue` reads from `SharedPreferences` and `setValue` writes to it, using the property name (or a passed key) as the preference key. This gives you clean, typed access to preferences as ordinary properties — `var darkMode: Boolean by BooleanPref(\"dark_mode\", false)`.",
      },
      {
        t: "code",
        title: "Preference delegate",
        code: `class BooleanPref(
    private val prefs: SharedPreferences,
    private val key: String,
    private val default: Boolean,
) : ReadWriteProperty<Any?, Boolean> {
    override fun getValue(thisRef: Any?, property: KProperty<*>) =
        prefs.getBoolean(key, default)
    override fun setValue(thisRef: Any?, property: KProperty<*>, value: Boolean) =
        prefs.edit().putBoolean(key, value).apply()
}
var darkMode: Boolean by BooleanPref(prefs, "dark_mode", false)`,
      },
      {
        t: "list",
        items: [
          "**`ReadWriteProperty`** — implement `getValue`/`setValue`.",
          "**Reads/writes prefs** — typed access, key from name or param.",
          "**Reusable** — one delegate class for many preference properties.",
          "**Modern note** — DataStore is preferred over SharedPreferences, but the delegate pattern is the same idea.",
        ],
      },
      {
        t: "note",
        text: "Implement a ReadWriteProperty delegate: getValue reads SharedPreferences, setValue writes it (key from property name or a param). Gives typed preference access as plain properties (var darkMode by BooleanPref(...)). Reusable across properties. (DataStore is the modern preference store, same delegate idea.)",
      },
    ],
  },
  {
    level: "senior",
    q: "How does the 'by' keyword desugar for class versus property delegation?",
    a: [
      {
        t: "p",
        text: "For *class delegation* (`class C : Base by b`), the compiler generates forwarding methods for each `Base` member that call the delegate `b`. For *property delegation* (`val x by d`), the compiler stores the delegate and translates reads/writes of `x` into `d.getValue(...)`/`d.setValue(...)` calls. Both use `by`, but one forwards *interface methods* and the other routes *property accessors*.",
      },
      {
        t: "list",
        items: [
          "**Class delegation** — generates method forwarders to the delegate for each interface member.",
          "**Property delegation** — routes get/set through the delegate's `getValue`/`setValue`.",
          "**Shared keyword** — `by` in both, but different desugaring.",
          "**Both** — reduce boilerplate (forwarding methods / accessor logic).",
        ],
      },
      {
        t: "note",
        text: "by desugars differently: class delegation (C : Base by b) generates forwarding methods to b for each interface member; property delegation (val x by d) routes reads/writes through d.getValue/setValue. Same keyword, different mechanism — one forwards interface methods, the other routes property accessors.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is lateinit good for, and what are its restrictions?",
    a: [
      {
        t: "p",
        text: "`lateinit var` declares a non-null property you'll initialize later — perfect for values set in lifecycle callbacks, DI, or `setUp()` in tests. Restrictions: it works only on `var` (not `val`), only non-nullable *object* types (not primitives), can't have a custom accessor, and throws `UninitializedPropertyAccessException` if read before assignment.",
      },
      {
        t: "list",
        items: [
          "**Use** — DI-injected fields, view binding, lifecycle-initialized values, test fixtures.",
          "**`var` only** — not `val`.",
          "**Non-null object types** — no primitives (use `Delegates.notNull`).",
          "**Access before init** — throws `UninitializedPropertyAccessException`; check `::prop.isInitialized`.",
        ],
      },
      {
        t: "note",
        text: "lateinit var = non-null property initialized later (DI, view binding, lifecycle, test setup). Restrictions: var only, non-nullable object types only (not primitives — use Delegates.notNull), no custom accessor, throws UninitializedPropertyAccessException if read before set (check ::prop.isInitialized).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the provideDelegate operator, and when is it useful?",
    a: [
      {
        t: "p",
        text: "`operator fun provideDelegate(thisRef, property)` lets a delegate *factory* run logic when the delegate is *created* (at property initialization), returning the actual delegate. It's used for validation (checking the property name/type up front) or registering the property — for example, verifying a key exists before the property is ever read.",
      },
      {
        t: "code",
        title: "provideDelegate",
        code: `class PrefProvider(private val key: String) {
    operator fun provideDelegate(thisRef: Any?, property: KProperty<*>): ReadWriteProperty<Any?, String> {
        require(isValidKey(key)) { "invalid key" }   // validate at creation
        return PrefDelegate(key)
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`provideDelegate`** — runs at delegate creation; returns the real delegate.",
          "**Up-front logic** — validation, registration, resource acquisition.",
          "**Access to metadata** — the `property` before any get/set.",
          "**Advanced** — a library feature, rarely needed in app code.",
        ],
      },
      {
        t: "note",
        text: "provideDelegate(thisRef, property) runs when the delegate is created (property init) and returns the actual delegate — for up-front validation, registration, or resource acquisition using the property metadata before any get/set. Advanced/library feature; rare in app code.",
      },
    ],
  },
  {
    level: "junior",
    q: "When should you use delegation instead of a helper function or inheritance?",
    a: [
      {
        t: "p",
        text: "Use *class delegation* to compose reusable behavior (implement an interface by wrapping an existing implementation) — favoring composition over inheritance. Use *property delegation* to reuse property behavior (lazy, observable, persistence) across many properties. Use a plain *helper function* when there's no property/interface to reuse — don't over-engineer with delegates when a function suffices.",
      },
      {
        t: "list",
        items: [
          "**Class delegation** — compose/reuse behavior without subclassing (decorators, mixins).",
          "**Property delegation** — reuse property logic (lazy/observable/persisted) across properties.",
          "**Helper function** — simple, one-off logic with no reuse pattern.",
          "**Avoid over-engineering** — delegates add indirection; use them when the reuse is real.",
        ],
      },
      {
        t: "note",
        text: "Class delegation to compose/reuse behavior without inheritance (decorators, mixins); property delegation to reuse property logic (lazy/observable/persisted) across properties; a plain helper function for one-off logic with no reuse. Don't over-engineer — delegates add indirection, so use them when the reuse pattern is real.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does class delegation help you build the decorator pattern?",
    a: [
      {
        t: "p",
        text: "Class delegation makes decorators trivial: implement the interface `by` delegating to the wrapped object, then override *only* the methods you want to augment — the rest forward automatically. This gives you a decorator with minimal boilerplate (no manual forwarding of every method), wrapping and extending behavior.",
      },
      {
        t: "code",
        title: "A logging decorator",
        code: `interface Repository { fun get(id: String): Data; fun save(d: Data) }

class LoggingRepository(private val delegate: Repository) : Repository by delegate {
    override fun save(d: Data) {          // augment only save
        log("saving \$d")
        delegate.save(d)                  // still call the real one
    }
    // get() forwards to delegate automatically
}`,
      },
      {
        t: "list",
        items: [
          "**`by delegate`** — auto-forwards all interface methods.",
          "**Override selectively** — only the methods you decorate.",
          "**No boilerplate** — unforwarded methods delegate for free.",
          "**Uses** — logging, caching, validation, metrics wrappers.",
        ],
      },
      {
        t: "note",
        text: "Class delegation makes decorators trivial: implement the interface by delegate (auto-forwards all methods), then override only the ones you augment (calling delegate for the real work). No manual forwarding boilerplate. Great for logging/caching/validation/metrics wrappers.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you unit-test a class that uses lazy or lateinit properties?",
    a: [
      {
        t: "p",
        text: "For `lateinit`, set the property in the test's `setUp()` (or via the constructor/DI) before exercising the class — accessing it unset throws. For `by lazy`, it initializes on first access, so tests just use the property normally; if the lazy computation has dependencies, inject them so the lazy block uses test doubles. Prefer constructor injection over `lateinit` for testability.",
      },
      {
        t: "list",
        items: [
          "**`lateinit`** — assign in `@Before`/`setUp()` or inject before use; unset access throws.",
          "**`by lazy`** — initializes on first access; ensure its dependencies are injectable test doubles.",
          "**Prefer constructor injection** — more testable than field `lateinit` (no hidden init order).",
          "**`::prop.isInitialized`** — assert init state if relevant.",
        ],
      },
      {
        t: "note",
        text: "lateinit: assign in setUp()/inject before use (unset access throws). by lazy: initializes on first access — make its dependencies injectable test doubles. Prefer constructor injection over field lateinit for testability (no hidden init-order coupling). Check ::prop.isInitialized if needed.",
      },
    ],
  },
  {
    level: "junior",
    q: "What built-in property delegates does the Kotlin standard library provide?",
    a: [
      {
        t: "p",
        text: "The standard library ships several ready-made delegates so you rarely write your own: `lazy` (compute-once, cached), `Delegates.observable` (callback after change), `Delegates.vetoable` (reject changes), `Delegates.notNull` (late-init for any type), and map-backed properties (`by map`). Knowing these covers most delegation needs.",
      },
      {
        t: "list",
        items: [
          "**`lazy { }`** — lazily computed, cached read-only value.",
          "**`Delegates.observable(init) { }`** — react after each assignment (old/new).",
          "**`Delegates.vetoable(init) { }`** — validate/reject an assignment before it commits.",
          "**`Delegates.notNull()`** — late-initialized non-null property (works for primitives).",
          "**`by map`/`by mutableMap`** — read/write properties from a map.",
        ],
      },
      {
        t: "note",
        text: "Standard-library delegates: lazy (compute-once, cached), Delegates.observable (post-change callback), Delegates.vetoable (reject changes), Delegates.notNull (late-init, any type incl. primitives), and by map (map-backed properties). These cover most needs — write a custom delegate only for bespoke storage/behavior.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you delegate a ViewModel property to SavedStateHandle for process-death survival?",
    a: [
      {
        t: "p",
        text: "`SavedStateHandle` behaves like a map, so you can create a property delegate that reads/writes through it — persisting the value across process death. AndroidX provides `savedStateHandle.saveable { }` (Compose) and you can build a simple delegate wrapping `handle[key]`/`handle[key] = value` or expose a `StateFlow` via `getStateFlow`.",
      },
      {
        t: "code",
        title: "SavedStateHandle-backed property",
        code: `class MyViewModel(private val handle: SavedStateHandle) : ViewModel() {
    var query: String
        get() = handle["query"] ?: ""
        set(value) { handle["query"] = value }   // survives process death

    val queryFlow = handle.getStateFlow("query", "")   // observable variant
}`,
      },
      {
        t: "list",
        items: [
          "**`SavedStateHandle` is map-like** — read/write by key survives process death.",
          "**Custom getter/setter or delegate** — route the property through the handle.",
          "**`getStateFlow(key, default)`** — an observable, saved StateFlow.",
          "**`saveable { }`** — Compose-friendly saved state in a ViewModel.",
        ],
      },
      {
        t: "note",
        text: "SavedStateHandle is map-like, so route a ViewModel property through handle[key] (custom getter/setter or a delegate) to survive process death; getStateFlow(key, default) gives an observable saved StateFlow, and saveable { } is the Compose-friendly variant. It's the process-death companion to viewModelScope's config-change survival.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does property delegation give you over a plain custom getter/setter?",
    a: [
      {
        t: "p",
        text: "A custom getter/setter is *per-property* boilerplate; a property delegate *encapsulates* the get/set logic in a reusable object you can apply to many properties with `by`. So instead of writing the same validation/persistence/observation accessors on every property, you write one delegate and reuse it — cleaner and DRY.",
      },
      {
        t: "code",
        title: "Reusable vs repeated",
        code: `// Repeated custom accessors on each property:
var a: String get() = prefs.getString("a", "")!!; set(v) { prefs.edit()... }
var b: String get() = prefs.getString("b", "")!!; set(v) { prefs.edit()... }

// One reusable delegate:
var a: String by StringPref("a")
var b: String by StringPref("b")`,
      },
      {
        t: "list",
        items: [
          "**Custom accessor** — logic lives on each property (repeated).",
          "**Delegate** — logic in one reusable object, applied via `by`.",
          "**DRY** — validation/persistence/observation written once.",
          "**Composable** — the same delegate across many properties/classes.",
        ],
      },
      {
        t: "note",
        text: "A custom getter/setter repeats accessor logic per property; a property delegate encapsulates that logic in one reusable object applied with `by` across many properties — DRY (validation/persistence/observation written once). Use a delegate when the same accessor behavior recurs; a plain getter for one-off logic.",
      },
    ],
  },
];

export default qa;
