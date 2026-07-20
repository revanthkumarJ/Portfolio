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
];

export default qa;
