// Classes & Objects — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is a data class and what does it generate?",
    a: [
      {
        t: "p",
        text: "**The concept**: a `data class` is designed to hold data, and the compiler auto-generates the boilerplate you'd otherwise write from the properties declared in the primary constructor.",
      },
      {
        t: "list",
        items: [
          "**`equals()` / `hashCode()`** — structural equality: two data classes are equal if their contents match (not their references). This makes them safe as map keys and lets Compose skip recomposition when state is unchanged.",
          "**`toString()`** — a readable representation like `User(id=1, name=Revanth)`.",
          "**`copy()`** — create a new instance with some fields changed: `user.copy(premium = true)`. The idiomatic way to 'modify' an immutable object.",
          "**`componentN()`** — enables destructuring: `val (id, name) = user`.",
        ],
      },
      {
        t: "p",
        text: "Data classes are everywhere in Android — UI state, domain models, API responses — because `equals`-by-content and `copy()` are exactly what immutable state management needs. One caveat: only *primary-constructor* properties count toward the generated methods (a property declared in the class body is excluded), and you should keep them `val` with immutable collections, since a data class with `var` fields breaks the equality-based caching that makes them useful.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a sealed class and why is it useful?",
    a: [
      {
        t: "p",
        text: "**The concept**: a `sealed` class or interface defines a *closed* set of subtypes — all direct subclasses must be in the same module, so the compiler knows every possible subtype at compile time. The main benefit is **exhaustive `when`**: a `when` over a sealed type doesn't need an `else`, the compiler verifies you handled every case, and if you add a new subtype later, every non-exhaustive `when` fails to compile until you handle it.",
      },
      {
        t: "code",
        title: "Modeling UI state",
        code: `sealed interface Result {
    data class Success(val data: List<Item>) : Result
    data class Error(val message: String) : Result
    data object Loading : Result
}

when (result) {                          // exhaustive — no else
    is Result.Success -> show(result.data)   // smart-cast to Success
    is Result.Error -> showError(result.message)
    Result.Loading -> showSpinner()
}`,
      },
      {
        t: "p",
        text: "It's ideal for anything that's 'one of a fixed set of shapes, each possibly carrying different data' — UI states (Loading/Success/Error), API results, navigation events. The exhaustiveness is a real correctness tool: add a new state and the compiler *points you to every place* that needs updating, instead of you discovering a missed case at runtime. Combined with smart casts, each `when` branch gives you typed access to that variant's data.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a sealed class and an enum?",
    a: [
      {
        t: "p",
        text: "**Both represent a fixed, closed set of options and both give exhaustive `when` — the difference is what each 'option' can be.** An `enum` is a fixed set of *singleton constants*: each value is one instance, and while an enum can have properties, *all* instances share the same shape (the same constructor parameters). A `sealed` type is a fixed set of *subtypes*: each variant can be a different class carrying *different data*, and you can have multiple instances of each.",
      },
      {
        t: "list",
        items: [
          "**Use an enum** for a simple set of constants where each is just a named value — a `Status` (ACTIVE/PAUSED/ARCHIVED), a day of the week. All the same shape.",
          "**Use a sealed type** when the variants carry *different* data — `Loading` (no data), `Success(val data)`, `Error(val message)`. An enum can't do this because each constant would need the same fields.",
        ],
      },
      {
        t: "code",
        title: "The distinguishing case",
        code: `// enum — all constants share the same shape
enum class Direction { NORTH, SOUTH, EAST, WEST }

// sealed — each variant has its OWN data shape
sealed interface Payment {
    data class Card(val number: String) : Payment
    data class Cash(val amount: Int) : Payment
    data object Free : Payment
}`,
      },
      {
        t: "p",
        text: "Rule of thumb: if the options differ only by name/label, enum; if they differ by *structure* (different data per option), sealed. Sealed is essentially 'an enum where each case can be a different type'.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a companion object and how does it relate to Java's static?",
    a: [
      {
        t: "p",
        text: "**The concept**: Kotlin has no `static` keyword. Instead, to have members accessible on the class itself (rather than an instance), you put them in a `companion object` — a single special object declared inside the class. You then call them via the class name, just like Java statics: `User.create()`, `User.MAX_LENGTH`.",
      },
      {
        t: "code",
        title: "Factory + constant via companion",
        code: `class User private constructor(val name: String) {
    companion object {
        const val MAX_LENGTH = 50
        fun create(name: String) = User(name.take(MAX_LENGTH))
    }
}
User.create("Revanth")`,
      },
      {
        t: "p",
        text: "The key difference from Java statics: a companion object is a **real object instance**, not just a namespace. That means it can implement interfaces, be passed around as a value, hold state, and receive extension functions — none of which Java statics can do. So 'statics' in Kotlin are first-class objects. Common uses: factory methods (often with a `private` constructor so the only way to create instances is through the factory), constants (`const val` for compile-time constants), and anything you'd have made static in Java. Each class can have at most one companion object.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a class and an object declaration?",
    a: [
      {
        t: "p",
        text: "**A `class` is a blueprint you instantiate (possibly many times with `new`/constructor calls); an `object` declaration is a singleton — it declares the class *and* creates its single instance at the same time.** You never instantiate an `object`; you just use it directly by name.",
      },
      {
        t: "code",
        title: "class vs object",
        code: `class Counter { var count = 0 }         // make instances
val c1 = Counter(); val c2 = Counter()  // two separate instances

object Config {                          // exactly ONE instance, ever
    val baseUrl = "https://api.example.com"
}
Config.baseUrl                           // used directly, no instantiation`,
      },
      {
        t: "list",
        items: [
          "**`object`** is Kotlin's built-in singleton: created lazily on first access, thread-safely, with no boilerplate. Use for stateless utilities, single shared instances, and things you'd make a static utility class for.",
          "**`data object`** adds a sensible `toString`/`equals` — used for singleton sealed variants like `Loading` where you want it to print nicely.",
          "**Anonymous objects** (`object : SomeInterface { }`) are one-off instances, Kotlin's version of Java anonymous classes — common for one-shot listener implementations.",
          "The caution with `object`: since it's a single shared instance, don't put mutable state in it carelessly — that state is global and shared across the whole app (and can leak or cause concurrency issues).",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "What is a value class (inline class) and when would you use one?",
    a: [
      {
        t: "p",
        text: "**The concept**: a `value class` (annotated `@JvmInline`) wraps a single value to create a *distinct type* at compile time, but the compiler **inlines the wrapper away at runtime** — so there's no object allocation, no boxing overhead. You get type safety for free. `@JvmInline value class UserId(val value: String)` is, at runtime, just a `String` in most cases.",
      },
      {
        t: "code",
        title: "Preventing argument mix-ups with zero cost",
        code: `@JvmInline value class UserId(val value: String)
@JvmInline value class OrderId(val value: String)

fun cancel(order: OrderId, requestedBy: UserId) { }

cancel(OrderId("o-1"), UserId("u-9"))    // OK
// cancel(UserId("u-9"), OrderId("o-1")) // COMPILE ERROR — can't swap them`,
      },
      {
        t: "list",
        items: [
          "**The problem it solves**: when domain identifiers are all raw `String`/`Int`, you lose meaning and can accidentally pass a userId where an orderId belongs (both are Strings, so the compiler can't catch it). Wrapping each in a value class makes them distinct types the compiler enforces — a whole class of bugs eliminated at *zero runtime cost*.",
          "**vs a regular (data) class wrapper**: a normal wrapper class would allocate an object for every id, adding memory and GC pressure — often unacceptable for pervasive types like ids used in tight loops or large collections. Value classes give the same type safety without the allocation.",
          "**Requirements & limits**: exactly one property (the wrapped value); `@JvmInline` on the JVM. It can have methods and computed properties. The inlining is *dropped* (a real object is boxed) in specific situations — when used as a nullable (`UserId?`), as a generic type argument, or when stored as `Any`/in a collection of interface type — so it's 'usually free', not 'always free'.",
          "**Other uses**: units of measure (`value class Meters(val value: Double)`), validated wrappers (an `Email` value class with validation in `init`), and making primitive-obsessed APIs type-safe.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: value classes are how you get the safety and expressiveness of strong domain types (no more 'stringly-typed' code) without paying the traditional wrapper-object tax — the compiler gives you the type at compile time and erases it at runtime. They're underused and a good thing to bring up when discussing modeling domain primitives.",
      },
    ],
  },
  {
    level: "senior",
    q: "When would you choose a sealed interface over a sealed class, and what are the trade-offs?",
    a: [
      {
        t: "p",
        text: "**Both create a closed, exhaustive hierarchy — the choice mirrors the general interface-vs-abstract-class decision, plus a few sealed-specific points.** Prefer a **`sealed interface`** by default; use a **`sealed class`** when you need shared *state* or a common constructor in the base type.",
      },
      {
        t: "list",
        items: [
          "**Multiple inheritance of type**: a class can implement *several* sealed interfaces but can only extend *one* sealed class. So sealed interfaces compose — a type can belong to more than one closed hierarchy, which is impossible with sealed classes. This flexibility is the main reason to prefer them.",
          "**No state/constructor in interfaces**: a `sealed interface` can't hold properties with backing fields or have a constructor. If every variant genuinely shares stored state (say a common `timestamp` field with a backing field, or init logic), a `sealed class` with that state in the base is cleaner than repeating it in each variant.",
          "**A variant can be a `data class`, `data object`, or regular class under either** — that's independent of whether the parent is a sealed class or interface. So you don't lose data-class benefits either way.",
          "**Interoperability & design**: interfaces impose fewer constraints on implementers (no forced single-inheritance slot), which keeps the hierarchy open to future composition. This is the same 'prefer interfaces for flexibility' principle from general OO design.",
        ],
      },
      {
        t: "code",
        title: "When shared state pushes you to a sealed class",
        code: `// sealed interface — no shared state needed, most flexible
sealed interface NetworkResult {
    data class Success(val body: String) : NetworkResult
    data class Failure(val code: Int) : NetworkResult
}

// sealed class — genuine shared state/behavior in the base
sealed class Screen(val route: String) {   // every screen HAS a route
    data object Home : Screen("home")
    data class Detail(val id: String) : Screen("detail/$id")
}`,
      },
      {
        t: "p",
        text: "**Rule of thumb**: default to `sealed interface` (flexible, composable, no downsides for most modeling); switch to `sealed class` only when the variants share stored state or constructor logic that's cleaner to centralize in the base. The exhaustiveness benefit is identical for both — the choice is purely about whether you need base-level state and single vs multiple inheritance.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a primary constructor, and what does the init block do?",
    a: [
      {
        t: "p",
        text: "The primary constructor is declared in the class header (`class User(val name: String)`) — its parameters can directly declare properties with `val`/`var`. Since the primary constructor can't contain code, initialization logic goes in `init { }` blocks, which run when an instance is created, in the order they and property initializers appear.",
      },
      {
        t: "code",
        title: "Primary constructor + init",
        code: `class User(val name: String, age: Int) {   // 'name' is a property; 'age' is just a param
    val isAdult: Boolean
    init {
        require(age >= 0) { "age must be non-negative" }   // validation
        isAdult = age >= 18                                 // init logic
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Primary constructor** — in the header; `val`/`var` params become properties.",
          "**`init { }`** — holds construction logic (validation, derived properties).",
          "**Order** — property initializers and `init` blocks run top-to-bottom.",
          "**Params without `val`/`var`** — usable in `init`/initializers but not stored as properties.",
        ],
      },
      {
        t: "note",
        text: "The primary constructor is in the class header; val/var params become properties. Since it holds no code, put initialization/validation in init { } blocks, which run at construction in declaration order alongside property initializers. Params without val/var are constructor-scoped, not stored.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are secondary constructors, and when do you need them?",
    a: [
      {
        t: "p",
        text: "Secondary constructors (`constructor(...)`) provide alternative ways to construct an instance; they must delegate to the primary constructor with `this(...)`. In Kotlin you often don't need them because *default parameter values* on the primary constructor cover most 'overloaded constructor' cases more concisely.",
      },
      {
        t: "code",
        title: "Secondary vs default params",
        code: `class User(val name: String, val role: String) {
    constructor(name: String) : this(name, "guest")   // delegates to primary
}
// Often better — default parameter:
class User2(val name: String, val role: String = "guest")   // no secondary needed`,
      },
      {
        t: "list",
        items: [
          "**Secondary** — `constructor(...) : this(...)`, delegates to the primary.",
          "**Prefer default params** — `role: String = \"guest\"` replaces most overloads.",
          "**When needed** — different init logic per constructor, or Java interop requiring specific constructors.",
          "**`@JvmOverloads`** — generate overloads for Java callers from default params.",
        ],
      },
      {
        t: "note",
        text: "Secondary constructors (constructor(...) : this(...)) delegate to the primary. Usually unnecessary in Kotlin — default parameter values cover most overloaded-constructor cases more concisely. Use secondaries for distinct init logic or Java interop; @JvmOverloads generates Java-visible overloads from defaults.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a backing field, and how do custom getters/setters work?",
    a: [
      {
        t: "p",
        text: "A Kotlin property is really a getter (and setter for `var`) plus an optional *backing field* referenced as `field`. When you write a custom getter/setter, you use `field` to access the stored value (using the property name inside would recurse infinitely). A property with a custom getter that doesn't use `field` is *computed* — no backing field is generated.",
      },
      {
        t: "code",
        title: "Custom accessors and backing field",
        code: `class Temperature {
    var celsius: Double = 0.0
        set(value) {
            require(value >= -273.15)
            field = value                 // 'field' is the backing field
        }
    val fahrenheit: Double                // computed — no backing field
        get() = celsius * 9 / 5 + 32
}`,
      },
      {
        t: "list",
        items: [
          "**Property = accessors** — get (and set for `var`), optionally over a backing field.",
          "**`field`** — the backing field, used inside custom accessors to avoid recursion.",
          "**Computed property** — a custom getter without `field`; derived each access, no storage.",
          "**Validation/transformation** — custom setters enforce invariants.",
        ],
      },
      {
        t: "note",
        text: "A property is a getter (+ setter for var) over an optional backing field, accessed as `field` inside custom accessors (using the property name recurses). A custom getter without `field` = a computed property (derived each access, no storage). Custom setters enforce validation/invariants.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between an abstract class and an interface?",
    a: [
      {
        t: "p",
        text: "Both define contracts with abstract members, but: a class can implement *many* interfaces but extend only *one* abstract class; interfaces *can't hold state* (no backing fields — only abstract or computed properties), while abstract classes can have state and constructors. Use an interface for a capability/role; an abstract class for a partial base implementation with shared state.",
      },
      {
        t: "table",
        headers: ["", "Interface", "Abstract class"],
        rows: [
          ["Multiple", "implement many", "extend only one"],
          ["State", "no backing fields", "can have fields/state"],
          ["Constructor", "no", "yes"],
          ["Default methods", "yes", "yes"],
        ],
      },
      {
        t: "list",
        items: [
          "**Interface** — multiple inheritance of behavior; no state; models a capability (`Comparable`, `Clickable`).",
          "**Abstract class** — single inheritance; can hold state and a constructor; a partial base implementation.",
          "**Choose interface** — when types share a role but not a hierarchy.",
          "**Choose abstract class** — when subclasses share state/implementation and one 'is-a' relationship.",
        ],
      },
      {
        t: "note",
        text: "Interface: implement many, no backing-field state, no constructor — models a capability/role. Abstract class: extend one, can hold state + constructor — a partial base implementation. Both allow default methods. Prefer interfaces for shared roles; abstract classes for shared state/impl in a single hierarchy.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why is everything final by default in Kotlin, and how do you allow inheritance?",
    a: [
      {
        t: "p",
        text: "Kotlin classes and members are `final` (non-inheritable/non-overridable) by default — you must mark them `open` to allow subclassing or overriding. This is deliberate: it prevents the 'fragile base class' problem (subclasses breaking when a base changes unexpectedly) and makes inheritance an intentional, documented choice rather than an accident.",
      },
      {
        t: "code",
        title: "open for inheritance",
        code: `open class Animal {          // open — can be subclassed
    open fun sound() = "..."   // open — can be overridden
}
class Dog : Animal() {
    override fun sound() = "Woof"   // override required
}
// class Cat : Animal2()   // error if Animal2 isn't 'open'`,
      },
      {
        t: "list",
        items: [
          "**Final by default** — classes and members can't be extended/overridden unless `open`.",
          "**`open`** — opt into inheritance/overriding explicitly.",
          "**`override`** — required keyword when overriding (documents intent).",
          "**Why** — avoids fragile base classes; favors composition over accidental inheritance.",
        ],
      },
      {
        t: "note",
        text: "Kotlin is final by default — classes/members need `open` to be subclassed/overridden, and overriding requires the `override` keyword. This prevents fragile-base-class bugs and makes inheritance intentional. It nudges toward composition; use open deliberately where extension is designed for.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a nested class and an inner class?",
    a: [
      {
        t: "p",
        text: "A *nested* class (default) does *not* hold a reference to the outer class — it's like a Java `static` nested class. An *inner* class (marked `inner`) *does* hold a reference to the outer instance and can access its members. Use nested for grouping without coupling; use `inner` only when you genuinely need the outer instance (and beware it can cause leaks).",
      },
      {
        t: "code",
        title: "nested vs inner",
        code: `class Outer {
    val x = 10
    class Nested {                 // no reference to Outer
        // fun f() = x            // error — can't access x
    }
    inner class Inner {            // holds Outer reference
        fun f() = x                // OK — accesses Outer.x
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Nested (default)** — no outer reference; like Java `static` nested.",
          "**`inner`** — holds the outer instance; can access outer members.",
          "**Leak risk** — an `inner` class outliving its purpose retains the outer instance.",
          "**Prefer nested** — unless you specifically need the outer reference.",
        ],
      },
      {
        t: "note",
        text: "Nested class (default) has NO outer reference (like Java static nested); inner class holds the outer instance and can access its members. Prefer nested to avoid coupling/leaks; use inner only when you truly need the outer instance (an inner class outliving its scope leaks the outer).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is an object expression (anonymous object)?",
    a: [
      {
        t: "p",
        text: "An object expression creates an *anonymous* object on the spot — often to implement an interface or extend a class without naming a new class, similar to a Java anonymous class. `object : Listener { ... }` produces a one-off instance implementing `Listener`. Unlike a lambda, it can implement multiple methods and hold state.",
      },
      {
        t: "code",
        title: "Anonymous object",
        code: `val listener = object : ClickListener {
    override fun onClick() { }
    override fun onLongClick() { }   // multiple methods — a lambda can't do this
}
// Can also extend a class and add ad-hoc members:
val point = object { val x = 1; val y = 2 }`,
      },
      {
        t: "list",
        items: [
          "**`object : Type { }`** — a one-off instance implementing/extending a type.",
          "**Multiple methods/state** — unlike a lambda (single method).",
          "**Captures scope** — can use enclosing variables.",
          "**vs SAM lambda** — a single-method interface can just be a lambda; use object expressions for multi-method ones.",
        ],
      },
      {
        t: "note",
        text: "An object expression (object : Type { }) creates an anonymous one-off instance implementing/extending a type — like a Java anonymous class, with multiple methods and state (unlike a lambda). For single-method (SAM) interfaces, prefer a lambda; use object expressions for multi-method implementations.",
      },
    ],
  },
  {
    level: "junior",
    q: "What can an enum class do beyond simple constants?",
    a: [
      {
        t: "p",
        text: "An `enum class` is a fixed set of named instances, but each constant can carry *properties*, the enum can have *methods*, and constants can *override* methods with per-constant behavior. Enums also get `values()`, `valueOf()`, `entries`, `ordinal`, and `name`, and work great in exhaustive `when` expressions.",
      },
      {
        t: "code",
        title: "Rich enum",
        code: `enum class Planet(val mass: Double, val radius: Double) {
    EARTH(5.97e24, 6.37e6),
    MARS(6.42e23, 3.39e6) {
        override fun describe() = "The red planet"   // per-constant override
    };
    val gravity: Double get() = mass / (radius * radius)
    open fun describe() = name
}`,
      },
      {
        t: "list",
        items: [
          "**Constants with properties** — each entry carries data (`mass`, `radius`).",
          "**Methods + per-constant overrides** — shared and specialized behavior.",
          "**Built-ins** — `entries`/`values()`, `valueOf`, `ordinal`, `name`.",
          "**Exhaustive `when`** — the compiler checks all constants are handled.",
        ],
      },
      {
        t: "note",
        text: "enum class = fixed named instances that can carry properties, have methods, and override methods per-constant. Built-ins: entries/values(), valueOf, ordinal, name. Great in exhaustive when. For richer hierarchies (varying data shapes per case), use a sealed class instead.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a data object, and when do you use it?",
    a: [
      {
        t: "p",
        text: "A `data object` (Kotlin 1.9+) is a singleton `object` that also gets a proper `toString()` (printing the object name) and structural `equals`/`hashCode`. It's mainly used for stateless singletons in sealed hierarchies — e.g. a `Loading` state — so it prints nicely (`Loading`) instead of the default `Object@hash`.",
      },
      {
        t: "code",
        title: "data object in a sealed hierarchy",
        code: `sealed interface UiState {
    data object Loading : UiState           // toString() == "Loading"
    data class Content(val items: List<Item>) : UiState
    data object Empty : UiState
}`,
      },
      {
        t: "list",
        items: [
          "**`data object`** — singleton with generated `toString`/`equals`/`hashCode`.",
          "**Sealed hierarchies** — stateless cases (`Loading`, `Empty`) that print their name.",
          "**vs plain `object`** — plain `object` has an ugly default `toString`.",
          "**Consistency** — pairs with `data class` cases for logging/debugging clarity.",
        ],
      },
      {
        t: "note",
        text: "data object (Kotlin 1.9+) is a singleton object with generated toString (prints the name), equals, and hashCode — for stateless cases in sealed hierarchies (Loading/Empty) that should print nicely instead of Object@hash. Pairs with data class cases for clean logging.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between const val and val?",
    a: [
      {
        t: "p",
        text: "`val` is a read-only property assigned at *runtime* (once). `const val` is a *compile-time constant* — its value is inlined at compile time, so it must be a primitive or `String` known at compile time, and it can only be declared at the top level or in an `object`/`companion object`. Use `const` for true constants (config keys, magic numbers).",
      },
      {
        t: "code",
        title: "const vs val",
        code: `const val MAX_COUNT = 100          // compile-time, inlined
const val BASE_URL = "https://..."  // String OK
val runtimeValue = computeAtRuntime()   // val — runtime assignment

class C { companion object { const val KEY = "key" } }   // const in companion`,
      },
      {
        t: "list",
        items: [
          "**`val`** — read-only, assigned at runtime; any type.",
          "**`const val`** — compile-time constant, inlined; only primitives/String; top-level or (companion) object.",
          "**Use `const`** — for literal constants (keys, limits, URLs).",
          "**Annotations** — `const` values can be used in annotations (compile-time required).",
        ],
      },
      {
        t: "note",
        text: "val = read-only, assigned at runtime, any type. const val = compile-time constant (inlined at call sites), only primitives/String, only top-level or in (companion) object. Use const for literal constants (keys/limits/URLs) — and it's required for values used in annotations.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are Kotlin's visibility modifiers, including internal?",
    a: [
      {
        t: "p",
        text: "Kotlin has four visibility modifiers: `public` (default — visible everywhere), `private` (visible in the file or class), `protected` (visible in the class and subclasses — not for top-level), and `internal` (visible within the same *module*). `internal` is unique to Kotlin — great for exposing something across a module's packages while hiding it from other modules/consumers.",
      },
      {
        t: "table",
        headers: ["Modifier", "Visible in"],
        rows: [
          ["public (default)", "everywhere"],
          ["private", "the file (top-level) or the class"],
          ["protected", "the class and its subclasses"],
          ["internal", "the same module"],
        ],
      },
      {
        t: "list",
        items: [
          "**`public`** — default; everywhere.",
          "**`private`** — file-scoped (top-level) or class-scoped.",
          "**`protected`** — class + subclasses (not for top-level declarations).",
          "**`internal`** — same module; ideal for library internals shared across packages but hidden from consumers.",
        ],
      },
      {
        t: "note",
        text: "public (default, everywhere), private (file or class), protected (class + subclasses, not top-level), internal (same module). internal is Kotlin-specific — perfect for sharing across a module's packages while hiding from other modules/library consumers.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is destructuring, and how does componentN work?",
    a: [
      {
        t: "p",
        text: "Destructuring lets you unpack an object into multiple variables — `val (name, age) = user`. It works via `componentN()` operator functions: `component1()`, `component2()`, etc. Data classes generate these automatically for their primary-constructor properties (in order); you can also define them manually for any class.",
      },
      {
        t: "code",
        title: "Destructuring",
        code: `data class User(val name: String, val age: Int)
val (name, age) = User("Sam", 30)     // name="Sam", age=30

for ((key, value) in map) { }          // Map.Entry has component1/component2
val (a, _, c) = triple                  // skip with _`,
      },
      {
        t: "list",
        items: [
          "**`val (a, b) = obj`** — unpacks via `component1()`, `component2()`.",
          "**Data classes** — auto-generate `componentN` for primary-constructor props (positional).",
          "**Maps/pairs** — destructure entries and pairs.",
          "**`_`** — skip a component you don't need.",
        ],
      },
      {
        t: "note",
        text: "Destructuring (val (a, b) = obj) unpacks via componentN() operator functions. Data classes auto-generate them for primary-constructor properties positionally — so order matters, not names. Works for pairs/map entries; use _ to skip. You can define componentN manually for non-data classes.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does copy() do on a data class, and why is it important?",
    a: [
      {
        t: "p",
        text: "`copy()` creates a new instance of a data class with the same values, optionally overriding some via named arguments — `user.copy(name = \"New\")`. It's the idiomatic way to produce a modified version of an *immutable* object without mutating it, which is central to state management (updating UiState, Redux-style updates).",
      },
      {
        t: "code",
        title: "copy for immutable updates",
        code: `data class UiState(val loading: Boolean, val items: List<Item>)
val next = state.copy(loading = false)         // only change loading
val updated = user.copy(name = "New", age = 31)  // change several fields`,
      },
      {
        t: "list",
        items: [
          "**`copy(overrides)`** — new instance with named fields changed.",
          "**Immutable updates** — modify state without mutation (thread-safe, predictable).",
          "**State management** — `_state.update { it.copy(...) }` is the core pattern.",
          "**Shallow copy** — nested mutable objects are shared; copy those too if needed.",
        ],
      },
      {
        t: "note",
        text: "copy() makes a new data-class instance with named fields overridden — the idiomatic immutable update (state.copy(loading = false)), central to state management. It's a shallow copy (nested mutable objects are shared, so copy those too). Pairs with StateFlow.update { it.copy(...) }.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a fun interface (SAM interface), and how does it relate to lambdas?",
    a: [
      {
        t: "p",
        text: "A `fun interface` is a *functional interface* — an interface with exactly one abstract method (Single Abstract Method). Marking it `fun` lets you implement it with a *lambda* instead of an `object : Interface { }`, via SAM conversion. This is how you get concise lambda syntax for your own single-method interfaces.",
      },
      {
        t: "code",
        title: "fun interface + SAM conversion",
        code: `fun interface Validator {
    fun validate(input: String): Boolean
}
val notEmpty = Validator { it.isNotEmpty() }   // lambda instead of object
notEmpty.validate("hi")   // true`,
      },
      {
        t: "list",
        items: [
          "**`fun interface`** — exactly one abstract method; enables SAM conversion.",
          "**Lambda implementation** — `Validator { ... }` instead of `object : Validator { }`.",
          "**Java SAM interop** — Java functional interfaces also support lambda conversion from Kotlin.",
          "**vs function type** — a `(String) -> Boolean` type is often simpler; use `fun interface` when you want a named type or Java interop.",
        ],
      },
      {
        t: "note",
        text: "A fun interface is a functional (single-abstract-method) interface; marking it `fun` enables SAM conversion so you implement it with a lambda (Validator { it.isNotEmpty() }) instead of an object expression. Prefer a plain function type ((String)->Boolean) when you don't need a named type or Java interop.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does operator overloading work in Kotlin?",
    a: [
      {
        t: "p",
        text: "You overload operators by defining functions with the `operator` modifier and specific names — `plus` for `+`, `get` for `[]`, `invoke` for `()`, `compareTo` for `<`/`>`, `equals` for `==`, etc. This lets your types use natural operator syntax (e.g. vector math, DSLs). Use it judiciously — only where the operator's meaning is intuitive.",
      },
      {
        t: "code",
        title: "Overloading operators",
        code: `data class Vec(val x: Int, val y: Int) {
    operator fun plus(o: Vec) = Vec(x + o.x, y + o.y)   // enables v1 + v2
    operator fun get(i: Int) = if (i == 0) x else y      // enables v[0]
}
val sum = Vec(1, 2) + Vec(3, 4)   // Vec(4, 6)`,
      },
      {
        t: "list",
        items: [
          "**`operator fun`** — named conventionally (`plus`, `times`, `get`, `invoke`, `compareTo`, `contains`, `rangeTo`).",
          "**Natural syntax** — `+`, `[]`, `()`, `in`, `..`, comparisons.",
          "**Use judiciously** — only where the operator meaning is obvious (math, collections, DSLs).",
          "**`invoke`** — makes an object callable like a function.",
        ],
      },
      {
        t: "note",
        text: "Overload operators with operator fun named by convention: plus (+), times (*), get ([]), invoke (()), compareTo (< >), contains (in), rangeTo (..), equals (==). Enables natural syntax for math/collections/DSLs. Use only where the operator's meaning is intuitive — don't surprise readers.",
      },
    ],
  },
  {
    level: "senior",
    q: "What does a data class generate, and what are its limitations?",
    a: [
      {
        t: "p",
        text: "A `data class` auto-generates `equals()`, `hashCode()`, `toString()`, `componentN()`, and `copy()` — based *only* on the *primary constructor* properties. Key limitations: properties declared in the *body* (not the primary constructor) are excluded from these; a data class can't be `abstract`/`open`/`sealed`/`inner`; and it needs at least one primary-constructor parameter.",
      },
      {
        t: "code",
        title: "Only primary-constructor props count",
        code: `data class User(val id: Int, val name: String) {
    var lastSeen: Long = 0   // in the body — NOT part of equals/hashCode/toString/copy
}
val a = User(1, "Sam").apply { lastSeen = 100 }
val b = User(1, "Sam").apply { lastSeen = 999 }
a == b   // true! lastSeen is ignored`,
      },
      {
        t: "list",
        items: [
          "**Generated** — `equals`/`hashCode`/`toString`/`componentN`/`copy`.",
          "**Only primary-constructor props** — body properties are excluded (a common gotcha for `equals`).",
          "**Restrictions** — not `abstract`/`open`/`sealed`/`inner`; ≥1 primary param.",
          "**Override** — you can provide custom `equals`/`hashCode` if needed.",
        ],
      },
      {
        t: "note",
        text: "data class generates equals/hashCode/toString/componentN/copy from PRIMARY-CONSTRUCTOR properties only — body properties are excluded (so two instances differing only in a body var compare equal — a classic gotcha). It can't be abstract/open/sealed/inner and needs ≥1 primary param.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the class initialization order in Kotlin?",
    a: [
      {
        t: "p",
        text: "When an instance is created, initialization runs in this order: the primary constructor's arguments are evaluated, then *property initializers and `init` blocks execute top-to-bottom in declaration order*, and finally the secondary constructor body (if used) runs. For inheritance, the base class is fully initialized before the derived class's initializers — which is why calling an `open` method from `init` is dangerous (the subclass override runs before the subclass is initialized).",
      },
      {
        t: "code",
        title: "Init order gotcha",
        code: `open class Base {
    init { greet() }              // calls overridden greet() — runs before Derived init!
    open fun greet() = println("base")
}
class Derived : Base() {
    val name = "Sam"
    override fun greet() = println(name)   // prints "null" — name not yet initialized
}`,
      },
      {
        t: "list",
        items: [
          "**Order** — constructor args → property initializers + `init` blocks (top-to-bottom) → secondary constructor body.",
          "**Base before derived** — the superclass initializes fully first.",
          "**Danger** — calling an `open` method from `init` runs the subclass override before the subclass is initialized (sees uninitialized state).",
          "**Avoid** — don't call open/overridable members from constructors/`init`.",
        ],
      },
      {
        t: "note",
        text: "Init order: constructor args → property initializers + init blocks (declaration order) → secondary constructor body; base class fully before derived. Gotcha: calling an open method from init runs the subclass override before the subclass initializes (sees null/uninitialized state) — never call overridable members from constructors/init.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do interface default methods work, and how are conflicts resolved?",
    a: [
      {
        t: "p",
        text: "Interfaces can provide *default implementations* for methods. If a class implements two interfaces that both provide the same method (a diamond conflict), the compiler *forces* you to override it and resolve the ambiguity explicitly, using `super<Interface>.method()` to pick which one(s) to call.",
      },
      {
        t: "code",
        title: "Resolving a diamond conflict",
        code: `interface A { fun greet() = "A" }
interface B { fun greet() = "B" }
class C : A, B {
    override fun greet() = super<A>.greet() + super<B>.greet()   // must resolve
}`,
      },
      {
        t: "list",
        items: [
          "**Default methods** — interfaces can implement methods (not just declare).",
          "**Conflict** — two defaults for the same signature forces an override.",
          "**`super<Interface>.method()`** — explicitly call a specific interface's version.",
          "**No state** — interface defaults can't rely on backing fields.",
        ],
      },
      {
        t: "note",
        text: "Interfaces can provide default method implementations. When two implemented interfaces both provide the same method (diamond), the compiler forces you to override it and disambiguate with super<Interface>.method(). Interface defaults can't use backing-field state.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you use a companion object as a factory or for constants?",
    a: [
      {
        t: "p",
        text: "A `companion object` holds members tied to the *class* rather than instances (like Java statics). Common uses: factory functions (`create()`), constants, and grouping class-level utilities. You call them via the class name (`User.create()`), and you can name the companion or have it implement interfaces.",
      },
      {
        t: "code",
        title: "Factory + constants",
        code: `class User private constructor(val name: String) {
    companion object {
        const val MAX_NAME = 50
        fun create(name: String): User =
            User(name.take(MAX_NAME))   // factory; can access private constructor
    }
}
val u = User.create("Sam")`,
      },
      {
        t: "list",
        items: [
          "**Class-level members** — accessed via the class name, one per class.",
          "**Factory pattern** — a `create()` in the companion can call a private constructor.",
          "**Constants** — `const val` / grouped values.",
          "**Named/interface** — `companion object Factory` or implement an interface for polymorphic factories.",
        ],
      },
      {
        t: "note",
        text: "A companion object holds class-level members (like Java statics), called via the class name. Uses: factory functions (create() — can access a private constructor to control instantiation), constants (const val), and class utilities. It can be named and implement interfaces for polymorphic factories.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you create a singleton, and is it thread-safe?",
    a: [
      {
        t: "p",
        text: "An `object` declaration creates a *singleton* — a single, lazily-initialized instance. Kotlin guarantees its initialization is *thread-safe* (the object is created safely on first access, like the initialization-on-demand holder idiom). Use it for stateless helpers, a single shared manager, or a registry.",
      },
      {
        t: "code",
        title: "object singleton",
        code: `object Analytics {
    private val events = mutableListOf<String>()
    fun log(event: String) { events += event }
}
Analytics.log("open")   // single shared instance, thread-safe init`,
      },
      {
        t: "list",
        items: [
          "**`object`** — one lazily-created, thread-safe-initialized instance.",
          "**Use** — stateless utilities, shared managers, registries, sealed-hierarchy singletons.",
          "**Mutable state caveat** — thread-safe *init* doesn't make its mutable state thread-safe; guard shared mutable data.",
          "**vs DI singleton** — for testability, prefer DI-scoped singletons over global `object`s holding state.",
        ],
      },
      {
        t: "note",
        text: "An object declaration is a singleton — one instance, lazily and thread-safely initialized. Use for stateless helpers/managers/registries. Caveat: safe INITIALIZATION doesn't make its mutable state thread-safe — guard shared mutable data. For testability, prefer DI-scoped singletons over global stateful objects.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you correctly override equals and hashCode for a non-data class?",
    a: [
      {
        t: "p",
        text: "If you override `equals`, you *must* override `hashCode` consistently — equal objects must have equal hash codes, or hash-based collections (`HashMap`/`HashSet`) break. Base both on the same fields. For most value types, a `data class` generates these correctly; override manually only for custom equality (e.g. comparing by a subset of fields).",
      },
      {
        t: "code",
        title: "Consistent equals/hashCode",
        code: `class Money(val amount: Int, val currency: String) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Money) return false
        return amount == other.amount && currency == other.currency
    }
    override fun hashCode(): Int = 31 * amount + currency.hashCode()
}`,
      },
      {
        t: "list",
        items: [
          "**Override both together** — equal objects must share a hash code.",
          "**Same fields** — base `equals` and `hashCode` on the same properties.",
          "**Contract** — reflexive, symmetric, transitive, consistent.",
          "**Prefer `data class`** — it generates correct implementations; override only for custom semantics.",
        ],
      },
      {
        t: "note",
        text: "Override equals and hashCode together, based on the same fields — equal objects MUST have equal hash codes or HashMap/HashSet break. Follow the equals contract (reflexive/symmetric/transitive/consistent). Prefer a data class (generates them correctly); override manually only for custom equality semantics.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a class and an interface property?",
    a: [
      {
        t: "p",
        text: "A class property can have a *backing field* (stored state) with an initial value. An interface property *cannot* store state — it can only be abstract (no initializer) or provide a custom getter (computed each access). This is why interfaces model behavior/contracts, not state.",
      },
      {
        t: "code",
        title: "Interface vs class properties",
        code: `interface Named {
    val name: String                 // abstract — no backing field
    val displayName: String get() = "Mr. \$name"   // computed — allowed
    // val count: Int = 0            // ERROR — interfaces can't hold state
}
class Person(override val name: String) : Named   // class provides storage`,
      },
      {
        t: "list",
        items: [
          "**Class property** — can have a backing field (stored value).",
          "**Interface property** — abstract or computed (custom getter); no state.",
          "**Implementers store it** — a class implementing the interface provides the backing field.",
          "**Why** — interfaces define contracts; state belongs to classes.",
        ],
      },
      {
        t: "note",
        text: "Class properties can have backing fields (stored state); interface properties can't — they're abstract or computed (custom getter) only. The implementing class provides the storage. This is why interfaces model contracts/behavior, not state.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between an object declaration and a class with a private constructor?",
    a: [
      {
        t: "p",
        text: "An `object` declaration is a *language-level singleton* — one instance, thread-safe lazy init, no way to make more. A class with a `private constructor` restricts instantiation but can still create multiple instances internally (e.g. a factory that caches a few). Use `object` for a true single instance; use a private constructor when you want *controlled* instantiation (factories, a fixed set of instances, builders).",
      },
      {
        t: "list",
        items: [
          "**`object`** — exactly one instance, guaranteed by the language.",
          "**Private constructor** — controlled creation; a companion factory can make one or several instances.",
          "**Use `object`** — global stateless singleton.",
          "**Use private constructor** — factory patterns, instance caching, enforcing invariants at creation.",
        ],
      },
      {
        t: "code",
        title: "Controlled creation",
        code: `class Config private constructor(val env: String) {
    companion object {
        fun of(env: String) = Config(env)   // controlled instantiation
    }
}`,
      },
      {
        t: "note",
        text: "object = a language-guaranteed singleton (one instance, thread-safe lazy init). A class with a private constructor restricts external creation but a companion factory can still make one or several instances (caching, fixed sets). object for a true singleton; private constructor for controlled instantiation/factories.",
      },
    ],
  },
  {
    level: "senior",
    q: "When should you use a sealed class versus an enum for representing states?",
    a: [
      {
        t: "p",
        text: "Use an `enum` when the cases are a *fixed set of constants* that all carry the *same shape* of data (or none) — like `Status.ACTIVE/INACTIVE`. Use a `sealed class/interface` when different cases carry *different data* — like `Result.Success(data)` vs `Result.Error(exception)`. Both give exhaustive `when`, but only sealed types let each case have its own properties.",
      },
      {
        t: "code",
        title: "enum vs sealed",
        code: `enum class Status { LOADING, LOADED, FAILED }   // no per-case data

sealed interface Result {                        // per-case data
    data class Success(val data: List<Item>) : Result
    data class Error(val exception: Throwable) : Result
    data object Loading : Result
}`,
      },
      {
        t: "list",
        items: [
          "**enum** — fixed constants, uniform (or no) data; lightweight.",
          "**sealed** — cases with *different* data shapes; richer state modeling.",
          "**Both** — exhaustive `when` without `else`.",
          "**Rule of thumb** — same data across cases → enum; different data per case → sealed.",
        ],
      },
      {
        t: "note",
        text: "enum for a fixed set of constants with uniform (or no) data (Status.ACTIVE/INACTIVE); sealed class/interface when cases carry DIFFERENT data (Success(data) vs Error(exception)). Both give exhaustive when. Same data shape → enum; different data per case → sealed.",
      },
    ],
  },
];

export default qa;
