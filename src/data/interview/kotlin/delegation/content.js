// Delegation & Advanced — Content tab. Teaching-first.

const content = [
  {
    heading: "The 'by' keyword — delegation in one word",
    blocks: [
      {
        t: "p",
        text: "Kotlin's **`by`** keyword implements the **delegation pattern** — forwarding work to another object — at the language level. It comes in two flavors: **class delegation** (implement an interface by forwarding to another instance) and **property delegation** (let another object handle a property's get/set). Both replace boilerplate you'd otherwise write by hand.",
      },
    ],
  },
  {
    heading: "Class delegation — composition over inheritance",
    blocks: [
      {
        t: "p",
        text: "Class delegation lets a class implement an interface by **delegating all its methods to another object** that already implements it — without manually writing forwarding methods. `class MyList(list: List<T>) : List<T> by list` implements the entire `List` interface by forwarding to `list`. You can then override just the methods you want to customize.",
      },
      {
        t: "code",
        title: "Implement an interface by delegation",
        code: `interface Repository { fun getAll(): List<Item>; fun save(item: Item) }

// Delegate everything to 'base', override only what you need:
class LoggingRepository(
    private val base: Repository,
) : Repository by base {          // forwards getAll() and save() to base
    override fun save(item: Item) {
        Log.d("Repo", "saving \$item")
        base.save(item)           // add behavior, then delegate
    }
    // getAll() is auto-forwarded to base — no boilerplate
}`,
      },
      {
        t: "list",
        items: [
          "**Composition over inheritance**: instead of subclassing (tight coupling, fragile base class problem), you *compose* — wrap an object and forward to it, overriding selectively. This is the decorator pattern with zero boilerplate.",
          "**The compiler generates the forwarding methods** for every interface member, delegating to the `by` object. You override only the ones you want to change.",
          "**Uses**: decorators (logging, caching, validation wrappers around a repository), adapting one implementation, and avoiding deep inheritance hierarchies. It's why Kotlin favors 'prefer composition' — the language makes it easy.",
        ],
      },
    ],
  },
  {
    heading: "Property delegation — by lazy, by Delegates, custom",
    blocks: [
      {
        t: "p",
        text: "Property delegation lets *another object* handle a property's get/set logic. `val x by SomeDelegate()` means reads and writes of `x` are routed to the delegate's `getValue`/`setValue`. The standard library provides ready-made delegates for common needs:",
      },
      {
        t: "code",
        title: "Standard property delegates",
        code: `// lazy — compute once, on first access, then cache; thread-safe by default
val config: Config by lazy {
    loadExpensiveConfig()          // runs only on first access to config
}

// Delegates.observable — run a callback whenever the property changes
var name: String by Delegates.observable("") { _, old, new ->
    println("name changed: \$old -> \$new")
}

// map-backed delegate — property reads from a map (common for JSON/config)
class User(map: Map<String, Any?>) {
    val id: String by map          // reads map["id"]
    val age: Int by map
}

// vetoable — validate/reject a change
var age: Int by Delegates.vetoable(0) { _, _, new -> new >= 0 }  // reject negatives`,
      },
      {
        t: "list",
        items: [
          "**`by lazy { }`** — the most common: computes the value *once*, lazily on first access, caches it, and is *thread-safe* by default (`LazyThreadSafetyMode.SYNCHRONIZED` — only one thread computes it). For single-threaded use, `lazy(LazyThreadSafetyMode.NONE)` is faster (no locking).",
          "**`Delegates.observable`** — fires a callback on every change (old → new); great for reacting to property changes without manual setters.",
          "**`Delegates.vetoable`** — like observable but can *reject* the change (return false).",
          "**Map delegation** — a property backed by a map entry; handy for dynamic/config objects.",
          "**Custom delegates** — implement `getValue`/`setValue` (or `ReadWriteProperty`) to encapsulate any get/set logic (e.g. a SharedPreferences-backed property).",
        ],
      },
    ],
  },
  {
    heading: "lateinit vs lazy — the classic comparison",
    blocks: [
      {
        t: "table",
        headers: ["", "lateinit var", "by lazy { }"],
        rows: [
          ["Keyword", "`lateinit var`", "`val ... by lazy { }`"],
          ["Mutability", "var (mutable, reassignable)", "val (read-only)"],
          ["Who initializes", "you, explicitly, later", "the lazy block, on first access"],
          ["When initialized", "whenever you assign it", "automatically, on first read"],
          ["If accessed before init", "throws UninitializedPropertyAccessException", "can't happen (initializes on access)"],
          ["Nullable / primitives", "non-null objects only (no Int/Boolean)", "any type"],
          ["Thread safety", "none (you manage it)", "thread-safe by default"],
        ],
      },
      {
        t: "code",
        title: "When to use each",
        code: `// lateinit — value set by a framework/DI later, and it's mutable
class MyFragment : Fragment() {
    private lateinit var binding: FragmentBinding   // assigned in onCreateView
    // ::binding.isInitialized  can check if it's been set
}

// lazy — expensive read-only value computed on first use
class ViewModel {
    val repository: Repository by lazy { createRepository() }
}`,
      },
      {
        t: "list",
        items: [
          "**Use `lateinit`** for a non-null property that will be assigned *later by external code* (DI, a framework lifecycle callback like `onCreate`) and may be reassigned — you promise 'I'll set this before using it'. Accessing it before assignment throws (a clear error, better than a null).",
          "**Use `lazy`** for a read-only property that's *expensive to compute* and should be created *once on first use* — the delegate handles initialization and caching. It's a `val`, so it can't be reassigned.",
          "**`lateinit` can't be used with nullable types or primitives** (use a nullable `var` with null as the 'uninitialized' state instead); `lazy` works with anything.",
          "**`::prop.isInitialized`** checks whether a lateinit has been assigned — useful to avoid the exception.",
        ],
      },
    ],
  },
  {
    heading: "How property delegation works under the hood",
    blocks: [
      {
        t: "p",
        text: "`val x by delegate` compiles to calls on the delegate object: reading `x` calls `delegate.getValue(thisRef, property)`, and writing (for `var`) calls `delegate.setValue(thisRef, property, value)`. The delegate must provide these operator functions (or implement `ReadOnlyProperty`/`ReadWriteProperty`). This is why you can write your own delegates — it's just a convention of implementing two functions.",
      },
      {
        t: "code",
        title: "A custom delegate — SharedPreferences-backed property",
        code: `class PrefDelegate(
    private val prefs: SharedPreferences,
    private val key: String,
    private val default: String,
) : ReadWriteProperty<Any?, String> {
    override fun getValue(thisRef: Any?, property: KProperty<*>): String =
        prefs.getString(key, default) ?: default
    override fun setValue(thisRef: Any?, property: KProperty<*>, value: String) {
        prefs.edit().putString(key, value).apply()
    }
}

// Usage — property reads/writes go straight to SharedPreferences:
var authToken: String by PrefDelegate(prefs, "token", "")`,
      },
      {
        t: "note",
        text: "Delegation summary: **`by` (class delegation)** = implement an interface by forwarding to another object (composition over inheritance, zero boilerplate). **`by` (property delegation)** = another object handles a property's get/set. **`by lazy`** = compute-once, thread-safe, read-only. **`lateinit var`** = non-null, assigned-later, mutable, throws if accessed early. Custom delegates just implement `getValue`/`setValue`.",
      },
    ],
  },
];

export default content;
