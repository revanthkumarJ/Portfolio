// Classes & Objects — Content tab. Teaching-first.

const content = [
  {
    heading: "data class — value-holding classes with generated methods",
    blocks: [
      {
        t: "p",
        text: "A **`data class`** is for holding data. The compiler auto-generates the boilerplate you'd otherwise write by hand from the properties in the primary constructor: `equals()`/`hashCode()` (structural equality by content), `toString()` (readable), `copy()` (create a modified duplicate), and `componentN()` functions (for destructuring).",
      },
      {
        t: "code",
        title: "What a data class gives you",
        code: `data class User(val id: String, val name: String, val premium: Boolean = false)

val a = User("1", "Revanth")
val b = User("1", "Revanth")
a == b                       // true — structural equality (same content)

val updated = a.copy(premium = true)   // new instance, one field changed
val (id, name) = a                     // destructuring via componentN()
println(a)                             // User(id=1, name=Revanth, premium=false)`,
      },
      {
        t: "list",
        items: [
          "**`equals`/`hashCode` compare by content**, not reference — two data classes with equal fields are equal. This is why they're perfect for UI state (Compose skips recomposition when state is `equals`) and as map keys.",
          "**`copy()`** is the idiomatic way to make a modified version of an immutable object — central to state management (`state.copy(loading = false)`).",
          "**Rules/limits**: needs at least one primary-constructor parameter; only *primary-constructor properties* count toward the generated methods (a property in the body is excluded from equals/hashCode/toString); can't be abstract/open in the usual sense; components come from the constructor order.",
          "**Immutability caveat**: `data class` doesn't force `val` — a `data class` with `var` or mutable collections is a mutable value holder, which breaks `equals`-based caching and is a common bug (prefer `val` + immutable collections).",
        ],
      },
    ],
  },
  {
    heading: "sealed class / sealed interface — restricted hierarchies",
    blocks: [
      {
        t: "p",
        text: "A **`sealed`** class or interface defines a *closed* set of subtypes — all direct subclasses must be declared in the same module/package, so the compiler knows *every* possible subtype. The payoff: a `when` over a sealed type can be **exhaustive** — the compiler verifies you've handled every case and doesn't require an `else`, and it *errors* if you add a new subtype without handling it.",
      },
      {
        t: "code",
        title: "Sealed hierarchy + exhaustive when",
        code: `sealed interface UiState {
    data object Loading : UiState
    data class Success(val data: List<Item>) : UiState
    data class Error(val message: String) : UiState
}

fun render(state: UiState) = when (state) {   // no 'else' needed
    UiState.Loading -> showSpinner()
    is UiState.Success -> showList(state.data)   // smart-cast to Success
    is UiState.Error -> showError(state.message)
    // add a new subtype -> this 'when' fails to compile until handled
}`,
      },
      {
        t: "list",
        items: [
          "**Exhaustiveness is the killer feature**: model your states/results as a sealed type, and the compiler guarantees you handle every case — add a new state later and every `when` that isn't exhaustive breaks the build, pointing you to what to update. Huge for correctness.",
          "**`sealed interface` vs `sealed class`**: interfaces are more flexible (a type can implement multiple sealed interfaces; no constructor). Prefer `sealed interface` unless you need shared state/constructor in the base.",
          "**Ideal for**: UI states (Loading/Success/Error), navigation events, API results (Success/Failure), any 'one of a fixed set of shapes'. Combined with smart casts in `when` branches, you get typed access to each variant's data.",
          "**vs enum**: an enum is a fixed set of *singleton instances* (no per-instance data beyond constructor values shared by all); a sealed type is a fixed set of *subtypes* that can each carry different data and have multiple instances. Use enum for simple constants, sealed for variants-with-data.",
        ],
      },
    ],
  },
  {
    heading: "enum class — a fixed set of constants",
    blocks: [
      {
        t: "code",
        title: "Enums can hold data and methods",
        code: `enum class Status(val label: String) {
    ACTIVE("Active"),
    PAUSED("Paused"),
    ARCHIVED("Archived");

    fun isVisible() = this != ARCHIVED
}

Status.ACTIVE.label         // "Active"
Status.values()             // all constants (or entries in newer Kotlin)
Status.valueOf("PAUSED")    // lookup by name`,
      },
      {
        t: "list",
        items: [
          "An `enum` is a fixed set of named constant *instances*, each a singleton. They can have constructor parameters, properties, and methods (even per-constant overrides via anonymous bodies).",
          "`when` over an enum is also exhaustive (no `else` needed if all constants are covered).",
          "Use for a simple closed set of options where each option is just a labeled constant. When options need to carry *different* data shapes, use a sealed type instead.",
        ],
      },
    ],
  },
  {
    heading: "value class (inline class) — zero-overhead wrappers",
    blocks: [
      {
        t: "p",
        text: "A **`value class`** (formerly `inline class`) wraps a single value to add type safety *without* the runtime cost of an object allocation. At runtime, the compiler **inlines** the wrapper away — a `value class UserId(val value: String)` is represented as just a `String` in most cases, so you get a distinct type at compile time with no boxing overhead.",
      },
      {
        t: "code",
        title: "Type-safe wrappers with no allocation",
        code: `@JvmInline
value class UserId(val value: String)
@JvmInline
value class Email(val value: String)

fun sendEmail(to: Email, from: UserId) { }

// Compile-time safety — can't swap the arguments:
sendEmail(Email("a@b.com"), UserId("42"))   // OK
// sendEmail(UserId("42"), Email("a@b.com")) // COMPILE ERROR — types don't match
// At runtime, these are just Strings — no wrapper objects allocated`,
      },
      {
        t: "list",
        items: [
          "**The problem it solves**: passing raw `String`/`Int` everywhere loses meaning and lets you mix up arguments (a userId and an orderId are both Strings). Wrapping them in value classes makes the compiler enforce which is which — with *zero* runtime cost (no allocation).",
          "**Requirements**: exactly one property (the wrapped value), `@JvmInline` annotation on the JVM. Can have methods and computed properties, but no `init` state beyond the single value.",
          "**When it *does* box**: the inlining is dropped (a real object is allocated) in cases where a concrete type is needed — e.g. when used as a nullable (`UserId?`), in generics, or stored in a collection of `Any`. Mostly it's free, but not always.",
        ],
      },
    ],
  },
  {
    heading: "object and companion object — singletons and statics",
    blocks: [
      {
        t: "code",
        title: "object declarations",
        code: `// object — a singleton (one instance, lazily created, thread-safe)
object Analytics {
    fun track(event: String) { }
}
Analytics.track("open")     // access directly, no instantiation

// companion object — 'static' members tied to a class
class User private constructor(val name: String) {
    companion object {
        fun create(name: String): User = User(name)   // factory
        const val MAX_NAME_LENGTH = 50
    }
}
User.create("Revanth")      // called on the class, like a static method`,
      },
      {
        t: "list",
        items: [
          "**`object`** — a **singleton**: declares a class *and* its single instance at once, created lazily on first access, thread-safely. Use for stateless helpers, singletons, and (Kotlin-idiomatically) things you'd make static utility classes for. `data object` adds a nice `toString`/`equals` (used for singleton sealed variants like `Loading`).",
          "**`companion object`** — Kotlin has no `static`; instead, a class can have *one* companion object holding members accessible via the class name (`User.create()`). Used for factory methods, constants, and anything you'd make static in Java.",
          "**Companion is a real object**: unlike Java statics, a companion object is an actual object instance — it can implement interfaces, be passed as a value, and have extension functions. This makes 'statics' first-class.",
          "**Anonymous objects** (`object : Listener { }`) create one-off instances implementing an interface — Kotlin's version of anonymous classes.",
        ],
      },
      {
        t: "note",
        text: "Quick chooser: **data class** for value holders (auto equals/copy); **sealed** for a closed set of variants-with-data (exhaustive when); **enum** for a fixed set of simple constants; **value class** for zero-cost type-safe wrappers; **object** for singletons; **companion object** for statics/factories.",
      },
    ],
  },
];

export default content;
