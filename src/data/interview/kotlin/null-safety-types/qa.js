// Null Safety & Types — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "How does Kotlin's null safety work?",
    a: [
      {
        t: "p",
        text: "**The concept**: Kotlin makes nullability part of the type. `String` is a non-null type that can *never* hold null, and `String?` is a nullable type that might. The compiler enforces this: you can't assign null to a non-null type, and you can't call methods on a nullable value without first handling the possibility of null. This turns NullPointerExceptions from runtime crashes into compile-time errors.",
      },
      {
        t: "code",
        title: "The compiler catches null mistakes",
        code: `var name: String = "Kotlin"
name = null           // compile error
var nick: String? = null   // fine — nullable
println(nick.length)       // compile error — must handle null first`,
      },
      {
        t: "p",
        text: "You handle nullables with a small set of operators: `?.` (safe call — returns null instead of crashing), `?:` (Elvis — provide a default), `?.let { }` (run a block only if non-null), and `!!` (assert non-null, throwing if wrong — to be avoided). The big win is systemic: instead of *remembering* to null-check everywhere like in Java, the compiler *won't let you forget*. The only escape hatch is platform types from Java code, which the compiler can't verify.",
      },
    ],
  },
  {
    level: "junior",
    q: "What do the ?., ?:, and !! operators do?",
    a: [
      {
        t: "list",
        items: [
          "**`?.` (safe call)**: accesses a member only if the receiver is non-null; otherwise the whole expression evaluates to null. `user?.name` is the name, or null if `user` is null. It chains and short-circuits: `user?.address?.city` is null if any link is null.",
          "**`?:` (Elvis operator)**: provides a fallback when the left side is null. `user?.name ?: \"Guest\"` gives the name or 'Guest'. The right side can also be a `return` or `throw`: `val id = user?.id ?: return`.",
          "**`!!` (not-null assertion)**: forces a nullable value to non-null, throwing a `NullPointerException` if it's actually null. `user!!.name` crashes if `user` is null.",
        ],
      },
      {
        t: "p",
        text: "The first two are the safe, idiomatic tools — `?.` to safely navigate and `?:` to supply defaults. `!!` is the dangerous one: it reintroduces the exact NPE crash that null safety exists to prevent, so it's considered a code smell. Use it only when you can genuinely *prove* the value is non-null and restructuring isn't practical. A method full of `!!` usually signals nullability that should have been handled properly upstream.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a smart cast?",
    a: [
      {
        t: "p",
        text: "**The concept**: after you check a value's type or nullability, Kotlin automatically treats it as the narrower type within that scope — you don't write an explicit cast. If you write `if (x is String)`, then inside that block `x` is already a `String`, so you can call `x.length` directly. Similarly, after `if (name != null)`, `name` is treated as non-null in that branch.",
      },
      {
        t: "code",
        title: "No manual casting needed",
        code: `fun handle(value: Any?) {
    if (value is String) {
        println(value.uppercase())   // smart-cast to String
    }
    if (value != null) {
        println(value.toString())    // smart-cast to non-null
    }
}`,
      },
      {
        t: "p",
        text: "It saves boilerplate and is safe because the compiler knows the check holds. The one limitation to know: smart casts require the value *can't change* between the check and the use. It works on `val`s and local `var`s, but **not** on mutable `var` properties (a custom getter or another thread could change the value between the check and the call). In those cases you copy to a local val first: `val n = name; if (n != null) n.uppercase()`. This 'why won't it smart-cast my property?' situation is a common Kotlin gotcha.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between val and var?",
    a: [
      {
        t: "p",
        text: "**`val`** declares a read-only reference — it's assigned once and can't be reassigned. **`var`** declares a mutable reference — you can reassign it. The guidance is to prefer `val` by default and use `var` only when you genuinely need to reassign, because immutable references are easier to reason about (the value won't change out from under you).",
      },
      {
        t: "p",
        text: "The crucial subtlety: **`val` makes the *reference* immutable, not the *object* it points to.** `val list = mutableListOf(1, 2)` means you can't reassign `list` to a different list, but you *can* still mutate its contents with `list.add(3)`. If you want the contents immutable too, use a read-only type like `listOf()`. So `val` ≠ deep immutability — it's 'this variable always points to the same object', while that object may itself be mutable. There's also `const val` for compile-time constants (top-level or in an `object`, primitives/Strings only), which is inlined at compile time, unlike a regular `val` that's computed at runtime.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are Unit and Nothing in Kotlin?",
    a: [
      {
        t: "p",
        text: "**`Unit`** is the type of a function that doesn't return a meaningful value — Kotlin's equivalent of `void`, except it's a real type with a single value (the `Unit` object). A function with no explicit return type returns `Unit`. It's a proper type, so you can use it as a generic argument (`Function<Unit>`), which `void` can't do.",
      },
      {
        t: "p",
        text: "**`Nothing`** is the type that has *no values at all* — nothing can ever be an instance of it. A function declared to return `Nothing` *never returns normally*: it always throws an exception or loops forever. `throw`, `TODO()`, and `error()` all return `Nothing`. This is genuinely useful for the compiler's flow analysis: because a `Nothing`-returning expression can't complete, the compiler knows code after it is unreachable, and it lets `Nothing` fit anywhere in type inference — which is why `val x: String = someValue ?: throw Exception()` compiles (the `throw` branch has type `Nothing`, compatible with `String`). So `Unit` = 'returns, but nothing useful'; `Nothing` = 'never returns at all'.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are platform types, and how do they create a hole in Kotlin's null safety?",
    a: [
      {
        t: "p",
        text: "**The concept**: when Kotlin calls into Java, Java carries no nullability information — any Java reference could be null, and the Java type system doesn't distinguish. Kotlin represents these Java-originated types as **platform types** (shown as `Type!` in errors, e.g. `String!`), meaning 'nullability is unknown'. For platform types, the compiler *relaxes* its null checks — it lets you treat the value as either nullable or non-null, trusting your choice, rather than forcing safe calls everywhere.",
      },
      {
        t: "list",
        items: [
          "**The hole**: if you treat a platform type as non-null (`val name: String = javaObj.getName()`) but the Java method actually returns null at runtime, you get a `NullPointerException` — the exact crash Kotlin's null safety normally prevents. It's the one place pure-Kotlin's guarantee can be silently bypassed.",
          "**Why they exist rather than a stricter rule**: if every Java call returned a nullable type, interop would be miserable (safe calls on everything, even values that are never null); if every Java call returned non-null, real nulls would slip through as NPEs everywhere. Platform types are the pragmatic compromise: the compiler defers to you at the boundary.",
          "**Where the NPE actually fires**: it can be immediate (if you dereference right away) or *delayed* — a null platform value assigned to a non-null Kotlin field can travel deep into your code and crash far from the Java call, making it hard to trace. This delayed failure is the dangerous case.",
        ],
      },
      {
        t: "list",
        items: [
          "**Mitigation 1 — annotate at the boundary**: explicitly declare the type when consuming Java. `val name: String? = javaObj.getName()` treats it as nullable (safe); `val name: String = javaObj.getName()` asserts non-null and, if wrong, throws *immediately at the boundary* (an early, traceable crash) rather than deep later. Never let raw platform types flow untyped into your codebase.",
          "**Mitigation 2 — nullability annotations**: Java code annotated with `@Nullable`/`@NonNull` (JetBrains, AndroidX) or JSpecify carries nullability *into* Kotlin, eliminating the platform type entirely — the type becomes a proper `String` or `String?`. This is why modern AndroidX APIs interop cleanly with full null safety, while old unannotated Java libraries are risky.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: Kotlin's null safety is airtight *within* Kotlin, but Java interop is a trust boundary. Platform types make interop ergonomic at the cost of a null-safety gap; the discipline is to *pin down nullability explicitly at the Java boundary* so the uncertainty doesn't leak inward, and to prefer annotated Java libraries.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why won't the compiler smart-cast a nullable var property, and what are the ways around it?",
    a: [
      {
        t: "p",
        text: "**The reason**: smart casting is only sound if the value provably *cannot change* between the null-check and the use. A mutable `var` property fails that condition for two reasons: (1) another thread could reassign it after your check but before your use (a data race), and (2) the property could be a *custom getter* that computes a new value on every access — so calling it twice might return non-null then null. The compiler can't prove stability, so it refuses to smart-cast, giving the error 'smart cast to X is impossible, because the property could have been changed'.",
      },
      {
        t: "code",
        title: "The problem and the fixes",
        code: `class Foo {
    var name: String? = null
    fun p() {
        if (name != null) {
            // println(name.length)   // ERROR: name is a mutable property
        }
    }
}

// Fix 1: copy to a local val (most common)
fun p2(foo: Foo) {
    val n = foo.name
    if (n != null) println(n.length)   // n is a stable local val — smart-casts fine
}

// Fix 2: let / safe call
foo.name?.let { println(it.length) }

// Fix 3: Elvis to bail early
val n = foo.name ?: return`,
      },
      {
        t: "list",
        items: [
          "**Fix 1 — capture in a local `val`**: the most idiomatic. A local `val` is stable (can't be reassigned, no getter re-evaluation), so the compiler smart-casts it freely. This is the standard workaround.",
          "**Fix 2 — `?.let { }`**: the safe call captures the value once and passes the non-null into the block — sidestepping the property re-read entirely.",
          "**Fix 3 — Elvis with early return** (`val x = prop ?: return`): pull the value into a non-null local and bail if null.",
          "**Why not just `!!`**: `foo.name!!` works but reintroduces NPE risk and doesn't fix the underlying race — if another thread nulls it between the `!!` evaluation... actually `!!` reads once so it's safe from re-read, but it throws instead of handling, so it's inferior to capturing a local val and handling the null case.",
        ],
      },
      {
        t: "p",
        text: "**The deeper point**: the restriction is protecting you from a real concurrency/getter hazard, not being pedantic. Capturing the value in a local val *snapshots* it, which is both what makes the smart cast sound and what makes the code correct under concurrency. Understanding *why* (races + custom getters) rather than just memorizing 'copy to a local' is the senior-level answer.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a nullable and a non-nullable type?",
    a: [
      {
        t: "p",
        text: "In Kotlin, `String` (non-nullable) can *never* hold `null`, while `String?` (nullable) can. This is enforced at *compile time*: assigning `null` to a non-nullable type, or calling a method on a nullable type without a null check, is a compile error. Nullability is part of the type system, so most NullPointerExceptions are caught before you run.",
      },
      {
        t: "code",
        title: "Nullable vs non-nullable",
        code: `var a: String = "hi"
a = null            // compile error — String can't be null

var b: String? = "hi"
b = null            // OK — String? is nullable
b.length            // compile error — must handle null (b?.length)`,
      },
      {
        t: "list",
        items: [
          "**Non-nullable (`T`)** — guaranteed non-null; can be dereferenced freely.",
          "**Nullable (`T?`)** — may be null; the compiler forces a null check before use.",
          "**Compile-time enforcement** — nullability bugs surface at build time, not runtime.",
          "**Default is non-nullable** — you opt into nullability with `?`.",
        ],
      },
      {
        t: "note",
        text: "T (non-nullable) can never hold null; T? (nullable) can. The compiler enforces this — assigning null to T or dereferencing T? without a check is a compile error. Nullability is in the type system, so most NPEs are caught at build time. Types are non-nullable by default; opt in with ?.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a safe cast (as?) and an unsafe cast (as)?",
    a: [
      {
        t: "p",
        text: "`as` is an *unsafe* cast — it throws `ClassCastException` if the object isn't the target type. `as?` is a *safe* cast — it returns `null` instead of throwing when the cast fails, giving a nullable result you handle. Use `as?` (often with `?:`) when the type isn't guaranteed.",
      },
      {
        t: "code",
        title: "as vs as?",
        code: `val x: Any = "hello"
val s1 = x as String       // OK here, but throws ClassCastException if x weren't a String
val s2 = x as? String      // String? — null if not a String
val len = (x as? String)?.length ?: 0   // safe handling`,
      },
      {
        t: "list",
        items: [
          "**`as`** — throws `ClassCastException` on mismatch; use when the type is certain.",
          "**`as?`** — returns `null` on mismatch; safe for uncertain types.",
          "**Pair with `?:`** — provide a default for the null case.",
          "**Smart casts** — often you can avoid casts entirely with `is` checks.",
        ],
      },
      {
        t: "note",
        text: "as is an unsafe cast (throws ClassCastException on mismatch — use when certain); as? is a safe cast (returns null on mismatch — use when uncertain, often with ?: for a default). Prefer is checks + smart casts to avoid explicit casts where possible.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between == and === in Kotlin?",
    a: [
      {
        t: "p",
        text: "`==` checks *structural* equality — it calls `.equals()` (and is null-safe: `a == b` works even if `a` is null). `===` checks *referential* equality — whether two references point to the *same object* in memory. For data classes, `==` compares field values; `===` compares identity.",
      },
      {
        t: "code",
        title: "Structural vs referential",
        code: `val a = User("Sam"); val b = User("Sam")   // data class
a == b       // true — same field values (equals)
a === b      // false — different objects
a === a      // true — same reference`,
      },
      {
        t: "list",
        items: [
          "**`==`** — structural; calls `equals()`; null-safe (translates to `a?.equals(b) ?: (b === null)`).",
          "**`===`** — referential; same-object identity.",
          "**Data classes** — `==` compares all properties; `===` is identity.",
          "**Java note** — Kotlin's `==` is Java's `.equals()`, not Java's `==` (which is identity).",
        ],
      },
      {
        t: "note",
        text: "== is structural equality (calls equals(), null-safe); === is referential (same object in memory). For data classes, == compares field values, === compares identity. Note: Kotlin's == is Java's .equals(), while === is Java's == — the opposite of what Java devs expect.",
      },
    ],
  },
  {
    level: "junior",
    q: "What do requireNotNull, checkNotNull, and error do?",
    a: [
      {
        t: "p",
        text: "These are precondition helpers that also *smart-cast* to non-null. `requireNotNull(x)` throws `IllegalArgumentException` if `x` is null (for validating function arguments); `checkNotNull(x)` throws `IllegalStateException` (for validating object/state); `error(msg)` throws `IllegalStateException` and returns `Nothing`. On success, `requireNotNull`/`checkNotNull` return the non-null value.",
      },
      {
        t: "code",
        title: "Precondition + smart cast",
        code: `fun process(id: String?) {
    val validId = requireNotNull(id) { "id must not be null" }   // arg validation
    // validId is String (non-null) from here
}
fun useState() {
    checkNotNull(currentUser) { "must be logged in" }   // state validation
}
val x = map[key] ?: error("missing key")   // throw with Nothing return`,
      },
      {
        t: "list",
        items: [
          "**`requireNotNull`** — `IllegalArgumentException`; validate arguments; returns the non-null value.",
          "**`checkNotNull`** — `IllegalStateException`; validate state; returns the non-null value.",
          "**`error(msg)`** — throw `IllegalStateException`; returns `Nothing` (usable in `?:`).",
          "**`require`/`check`** — boolean variants for general preconditions.",
        ],
      },
      {
        t: "note",
        text: "requireNotNull (IllegalArgumentException — args), checkNotNull (IllegalStateException — state) throw on null AND return the smart-cast non-null value; error(msg) throws IllegalStateException returning Nothing (great in ?:). Plus require/check for boolean preconditions. Cleaner and more intentional than !!.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you use the Elvis operator with return or throw?",
    a: [
      {
        t: "p",
        text: "Because `return` and `throw` are expressions of type `Nothing`, you can put them on the right side of the Elvis operator `?:` — so `val x = nullable ?: return` exits the function early when the value is null, and after that line `x` is smart-cast to non-null. This is a clean 'guard clause' pattern.",
      },
      {
        t: "code",
        title: "Elvis guard clauses",
        code: `fun greet(user: User?) {
    val name = user?.name ?: return          // bail out if null
    println("Hello \$name")                   // name is non-null here
}
fun require(id: String?): String = id ?: throw IllegalArgumentException("null id")`,
      },
      {
        t: "list",
        items: [
          "**`?: return`** — early-return when null; the rest of the function has a non-null value.",
          "**`?: throw`** — fail fast when null.",
          "**Works because `Nothing`** — `return`/`throw` produce `Nothing`, which fits any type.",
          "**Guard clauses** — flatten nested null checks into linear code.",
        ],
      },
      {
        t: "note",
        text: "return/throw are Nothing-typed expressions, so they fit the right side of ?:. `val x = nullable ?: return` (or `?: throw ...`) exits early on null and smart-casts x to non-null afterward — clean guard clauses that flatten nested null checks.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you use let for null handling?",
    a: [
      {
        t: "p",
        text: "`?.let { }` runs a block *only if* the value is non-null, with the value as `it` (smart-cast to non-null inside). It's a concise way to execute code conditionally on non-null, and combined with `?:` you can handle both branches. It also scopes a temporary non-null copy, useful for nullable `var`s that can't be smart-cast.",
      },
      {
        t: "code",
        title: "?.let for non-null blocks",
        code: `user?.let {
    println(it.name)       // runs only if user != null; it is non-null
    save(it)
}
// Both branches:
val result = value?.let { transform(it) } ?: default
// Smart-cast a nullable var safely:
nullableVar?.let { render(it) }   // it is a stable non-null copy`,
      },
      {
        t: "list",
        items: [
          "**`?.let { }`** — block runs only if non-null; `it` is the non-null value.",
          "**With `?:`** — handle the null branch (`?.let { } ?: else`).",
          "**Nullable `var`s** — `?.let` captures a stable copy the compiler can smart-cast.",
          "**Don't overuse** — a plain `if (x != null)` is clearer for simple cases.",
        ],
      },
      {
        t: "note",
        text: "?.let { } runs its block only if the value is non-null (it = non-null value); pair with ?: for the null branch. It's especially useful to safely use a nullable var (captures a stable copy). Don't overuse — a plain if (x != null) is clearer for simple non-null checks.",
      },
    ],
  },
  {
    level: "senior",
    q: "When is !! acceptable, and how do you design it out?",
    a: [
      {
        t: "p",
        text: "`!!` asserts non-null and throws `NullPointerException` if wrong — it defeats null safety, so it's a code smell in most places. It's occasionally acceptable when you *know* a value is non-null but the compiler can't (e.g. after external validation), but you should prefer designing the nullability away: non-null types, `requireNotNull` with a message, `lateinit`, or restructuring so the value is never nullable.",
      },
      {
        t: "list",
        items: [
          "**`!!`** — assert non-null; throws NPE on failure; loses compile-time safety.",
          "**Rarely acceptable** — when non-nullness is guaranteed but unprovable to the compiler.",
          "**Better** — `requireNotNull(x) { \"why\" }` (meaningful message + smart cast), `?.let`, `?:`.",
          "**Design out** — use non-nullable types, `lateinit` for late-init, or model state so it's never null.",
          "**Never chain `!!`** — `a!!.b!!.c!!` hides which one is null and is a strong smell.",
        ],
      },
      {
        t: "note",
        text: "!! asserts non-null (NPE if wrong), defeating null safety — a smell. Rarely OK when non-nullness is guaranteed but unprovable. Prefer requireNotNull(x){msg} (message + smart cast), ?.let/?:, lateinit, or restructuring so the value is never nullable. Never chain a!!.b!!.c!! (hides which is null).",
      },
    ],
  },
  {
    level: "junior",
    q: "What do takeIf and takeUnless do?",
    a: [
      {
        t: "p",
        text: "`takeIf { predicate }` returns the value if the predicate is true, else `null`; `takeUnless { predicate }` is the inverse (returns the value if the predicate is *false*). They turn a condition into a nullable result you can chain with `?.` and `?:` — handy for conditional pipelines.",
      },
      {
        t: "code",
        title: "takeIf / takeUnless",
        code: `val validEmail = email.takeIf { it.contains("@") }        // email or null
val nonEmpty = input.takeUnless { it.isBlank() } ?: "default"
password.takeIf { it.length >= 8 }?.let { register(it) }  // proceed only if valid`,
      },
      {
        t: "list",
        items: [
          "**`takeIf { }`** — value if predicate true, else null.",
          "**`takeUnless { }`** — value if predicate false, else null.",
          "**Chainable** — combine with `?.let`/`?:` for conditional flows.",
          "**Readable guards** — express 'use this only if valid' inline.",
        ],
      },
      {
        t: "note",
        text: "takeIf { p } returns the value if p is true else null; takeUnless { p } is the inverse. They convert a condition into a nullable, chainable with ?.let/?: for 'use this only if valid' pipelines (e.g. email.takeIf { it.contains(\"@\") }).",
      },
    ],
  },
  {
    level: "senior",
    q: "What's the difference between List<T>?, List<T?>, and List<T?>?",
    a: [
      {
        t: "p",
        text: "Nullability position matters. `List<T>?` is a *nullable list* of non-null items (the list itself may be null, but its elements aren't). `List<T?>` is a *non-null list* of nullable items (the list exists, but items may be null). `List<T?>?` is both. Reading the position of `?` tells you exactly what can be null.",
      },
      {
        t: "code",
        title: "Where the ? is",
        code: `val a: List<String>?  = null            // the list may be null; items non-null
val b: List<String?>  = listOf("x", null)  // list non-null; items may be null
val c: List<String?>? = null            // both may be null

a?.forEach { it.length }                // safe call on the list
b.forEach { it?.length }                // safe call on each item`,
      },
      {
        t: "list",
        items: [
          "**`List<T>?`** — the list reference may be null; elements are non-null.",
          "**`List<T?>`** — the list is non-null; elements may be null.",
          "**`List<T?>?`** — both may be null.",
          "**Read the `?` position** — it tells you precisely what's nullable.",
        ],
      },
      {
        t: "note",
        text: "Position of ? matters: List<T>? = nullable list of non-null items; List<T?> = non-null list of nullable items; List<T?>? = both. Read where the ? sits to know exactly what can be null — the list reference, the elements, or both.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do Kotlin's numeric types work, and why is there no implicit conversion?",
    a: [
      {
        t: "p",
        text: "Kotlin has `Byte`, `Short`, `Int`, `Long`, `Float`, `Double` (and unsigned variants). Unlike Java, Kotlin does *not* implicitly widen numbers — you can't assign an `Int` to a `Long` variable without an explicit conversion (`toLong()`). This prevents subtle bugs from unexpected conversions; you convert explicitly with `toX()` functions.",
      },
      {
        t: "code",
        title: "Explicit conversions",
        code: `val i: Int = 10
val l: Long = i          // compile error — no implicit widening
val l2: Long = i.toLong()   // explicit
val d: Double = i.toDouble()
// Literals: 10L (Long), 10.0 (Double), 10f (Float), 0xFF (hex), 1_000_000 (underscores)`,
      },
      {
        t: "list",
        items: [
          "**Types** — Byte/Short/Int/Long, Float/Double, and UByte/UShort/UInt/ULong.",
          "**No implicit widening** — convert explicitly (`toLong()`, `toDouble()`).",
          "**Literals** — `L` suffix for Long, `f` for Float, `0x`/`0b` prefixes, `_` separators.",
          "**Why** — avoids accidental precision/type surprises common in Java.",
        ],
      },
      {
        t: "note",
        text: "Kotlin numeric types (Byte/Short/Int/Long, Float/Double, unsigned variants) require EXPLICIT conversion — no implicit widening (Int → Long needs toLong()), preventing accidental conversion bugs. Literals: 10L, 10.0, 10f, 0xFF, 1_000_000. Convert with toX() functions.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does boxing work for nullable primitives (Int vs Int?)?",
    a: [
      {
        t: "p",
        text: "A non-nullable `Int` compiles to the JVM primitive `int` (no object, no allocation). But `Int?` must be able to hold `null`, which primitives can't, so it compiles to the boxed `java.lang.Integer` object. So nullable primitives (and generics like `List<Int>`) involve *boxing* — extra allocation and indirection, worth knowing for hot paths.",
      },
      {
        t: "list",
        items: [
          "**`Int`** → primitive `int` (no allocation).",
          "**`Int?`** → boxed `Integer` (can hold null; allocates).",
          "**Generics box** — `List<Int>` holds `Integer`s (type params are objects).",
          "**Performance** — avoid unnecessary nullable primitives / boxing in tight loops; use `IntArray` over `List<Int>` for primitive arrays.",
        ],
      },
      {
        t: "code",
        title: "Boxing",
        code: `val a: Int = 5      // primitive int
val b: Int? = 5     // boxed Integer (nullable)
val arr = IntArray(100)     // primitive int[], no boxing
val list = List(100) { it } // List<Int> -> boxed Integers`,
      },
      {
        t: "note",
        text: "Int compiles to primitive int (no allocation); Int? compiles to boxed Integer (to hold null). Generics also box (List<Int> holds Integers). So nullable primitives and generic collections allocate — in hot paths prefer non-null primitives and IntArray over List<Int> to avoid boxing.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Kotlin enforce null safety at compile time versus runtime?",
    a: [
      {
        t: "p",
        text: "Null safety is primarily a *compile-time* feature — the compiler tracks nullable vs non-nullable types and rejects unsafe dereferences, so there's little runtime overhead. At runtime, Kotlin adds *intrinsic null checks* at boundaries (e.g. non-null parameters of public functions, values crossing from Java) so a null sneaking in from Java throws a clear `NullPointerException` early rather than corrupting state.",
      },
      {
        t: "list",
        items: [
          "**Compile-time** — the type system prevents unsafe null access; most safety costs nothing at runtime.",
          "**Runtime intrinsics** — `Intrinsics.checkNotNull` on non-null public API params and Java-boundary values.",
          "**Java interop** — platform types can still bring null in; runtime checks catch it at the boundary.",
          "**Result** — safety mostly free, with guard rails where the compiler can't see (Java).",
        ],
      },
      {
        t: "note",
        text: "Null safety is mostly compile-time (the type system rejects unsafe dereferences — little runtime cost). At runtime, Kotlin inserts intrinsic null checks on non-null public-API parameters and Java-boundary values, so null sneaking in from Java fails fast with a clear NPE rather than corrupting state.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a definitely non-nullable type (T & Any)?",
    a: [
      {
        t: "p",
        text: "`T & Any` is a *definitely non-nullable* type, used mainly in generics to say 'this type parameter, but never nullable'. When a generic `T` could be a nullable type (e.g. `T = String?`), `T & Any` intersects it with `Any` (the non-nullable root) to guarantee non-null. It's most relevant when overriding Java generic methods that must return non-null.",
      },
      {
        t: "code",
        title: "Definitely non-nullable",
        code: `fun <T> elvisLike(value: T?, default: T & Any): T & Any =
    value ?: default    // guarantees a non-null result even if T is nullable`,
      },
      {
        t: "list",
        items: [
          "**`T & Any`** — intersection making a possibly-nullable `T` non-nullable.",
          "**Generics** — ensures a type parameter is treated as non-null.",
          "**Java interop** — implement Java `@NotNull` generic methods precisely.",
          "**Niche** — mostly library/interop code; rarely needed in app code.",
        ],
      },
      {
        t: "note",
        text: "T & Any is a definitely non-nullable type — it intersects a possibly-nullable generic T with Any (non-nullable root) to guarantee non-null. Mainly for generics and implementing Java @NotNull generic methods precisely. Niche; mostly library/interop, rarely needed in app code.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is lateinit, and how does isInitialized work?",
    a: [
      {
        t: "p",
        text: "`lateinit var` lets you declare a non-null `var` without initializing it immediately, promising to set it before first use — useful for dependency injection or lifecycle-initialized fields. Accessing it before assignment throws `UninitializedPropertyAccessException`. You can check `::property.isInitialized` to see if it's been set.",
      },
      {
        t: "code",
        title: "lateinit",
        code: `lateinit var adapter: MyAdapter    // no initial value, non-null

fun onCreate() {
    adapter = MyAdapter()          // initialized before use
}
fun safeUse() {
    if (::adapter.isInitialized) adapter.refresh()
}`,
      },
      {
        t: "list",
        items: [
          "**`lateinit var`** — non-null, initialized later; only for `var`, non-primitive, non-nullable types.",
          "**Access before init** — throws `UninitializedPropertyAccessException`.",
          "**`::prop.isInitialized`** — check whether it's been assigned.",
          "**Use** — DI-injected fields, view binding, values set in lifecycle callbacks.",
        ],
      },
      {
        t: "note",
        text: "lateinit var declares a non-null var initialized later (DI, view binding, lifecycle) — accessing before assignment throws UninitializedPropertyAccessException. Check ::prop.isInitialized. Only for var, non-nullable, non-primitive types. Alternative to nullable + !! when init is guaranteed but deferred.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are Any and Any?, and how does Kotlin's type hierarchy work?",
    a: [
      {
        t: "p",
        text: "`Any` is the root of all *non-nullable* types (like Java's `Object`, but without nullability) — every non-null class is an `Any`. `Any?` is the root of *all* types including nullable ones. At the bottom is `Nothing` (subtype of everything, no instances). So the hierarchy goes `Any?` at the top, `Any` below it (non-null), and `Nothing`/`Nothing?` at the bottom.",
      },
      {
        t: "list",
        items: [
          "**`Any`** — supertype of all non-nullable types (has `equals`/`hashCode`/`toString`).",
          "**`Any?`** — supertype of everything, including nullable types.",
          "**`Nothing`** — the bottom type; subtype of every type; no instances (for `throw`/infinite loops).",
          "**Hierarchy** — `Any?` ⊇ `Any` ⊇ your types ⊇ `Nothing`.",
        ],
      },
      {
        t: "note",
        text: "Any = root of all non-nullable types (Java's Object minus nullability). Any? = root of everything (including nullable). Nothing = bottom type (subtype of all, no instances — for throw/infinite loops). Hierarchy: Any? ⊇ Any ⊇ your types ⊇ Nothing.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you invoke a nullable function type safely?",
    a: [
      {
        t: "p",
        text: "A nullable lambda/callback (`(() -> Unit)?`) can't be called directly — you invoke it with `?.invoke()`, which calls it only if non-null. This is common for optional callbacks (an `onClick` that might not be set).",
      },
      {
        t: "code",
        title: "Nullable callback",
        code: `var onComplete: (() -> Unit)? = null
fun finish() {
    onComplete?.invoke()          // calls only if set
}
var onResult: ((Int) -> Unit)? = null
onResult?.invoke(42)`,
      },
      {
        t: "list",
        items: [
          "**`callback?.invoke(args)`** — call only if non-null (can't use `callback()` on a nullable type).",
          "**Optional callbacks** — a nullable function type models 'maybe set'.",
          "**With `?:`** — provide a default action if unset.",
          "**Alternative** — a non-null default (`{ }`) avoids the nullability entirely.",
        ],
      },
      {
        t: "note",
        text: "Invoke a nullable function type with block?.invoke(args) (you can't call block() on a nullable type) — runs only if set. Models optional callbacks. Or give it a non-null default no-op ({ }) to avoid nullability. Pair with ?: for a fallback action.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does smart casting work with when and is?",
    a: [
      {
        t: "p",
        text: "After an `is` check, the compiler *smart-casts* the variable to that type within the scope where the check holds — no explicit cast needed. In a `when` on a sealed type, each `is` branch smart-casts to the specific subtype, and the compiler verifies exhaustiveness. This makes type-based branching clean and safe.",
      },
      {
        t: "code",
        title: "Smart cast in when",
        code: `when (result) {
    is Success -> render(result.data)   // result smart-cast to Success
    is Error   -> show(result.message)  // smart-cast to Error
    Loading    -> showSpinner()
}   // exhaustive for a sealed type — no else needed`,
      },
      {
        t: "list",
        items: [
          "**`is` smart-cast** — after `if (x is T)`, `x` is `T` in that scope.",
          "**`when` branches** — each `is` branch smart-casts to the subtype.",
          "**Exhaustiveness** — a `when` over a sealed type needs no `else` if all cases are covered.",
          "**Limitation** — smart cast requires the value can't change between check and use (e.g. `val`, local; not a mutable `var` property).",
        ],
      },
      {
        t: "note",
        text: "After an is check, the compiler smart-casts the variable to that type in scope (no explicit cast). In a when over a sealed type, each is branch smart-casts to the subtype and the compiler enforces exhaustiveness (no else). Caveat: smart cast needs the value to be stable (val/local, not a mutable var property).",
      },
    ],
  },
  {
    level: "junior",
    q: "When should you annotate types versus rely on inference?",
    a: [
      {
        t: "p",
        text: "Kotlin infers types from the initializer, so `val name = \"Sam\"` is `String` without annotation. Rely on inference for obvious locals; annotate explicitly for *public API* (return types, properties) for clarity and stability, when the inferred type would be too broad/narrow, or when initializing with `null`/an empty collection where inference can't determine the intended type.",
      },
      {
        t: "code",
        title: "Infer vs annotate",
        code: `val count = 0                 // inferred Int — fine
val items = mutableListOf<User>()   // annotate the element type
var result: Result<User>? = null    // annotate — null gives no info
fun getUser(): User = ...     // annotate public return type explicitly`,
      },
      {
        t: "list",
        items: [
          "**Infer** — obvious locals with a clear initializer.",
          "**Annotate public API** — return types/properties for readability and API stability.",
          "**Annotate when ambiguous** — `null` init, empty collections, or to widen/narrow.",
          "**Explicit return types** — recommended for non-trivial public functions.",
        ],
      },
      {
        t: "note",
        text: "Rely on inference for obvious locals (val name = \"Sam\"). Annotate public API return types/properties (clarity + API stability), and when the initializer gives no/ambiguous type info (null, empty collections) or you need to widen/narrow. Explicit return types are recommended for public functions.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle nullability at the Java interop boundary?",
    a: [
      {
        t: "p",
        text: "Java types come into Kotlin as *platform types* (`String!`) — the compiler doesn't know their nullability, so it won't force a check, but a null can sneak through and cause an NPE. Mitigate by: honoring Java nullability annotations (`@Nullable`/`@NonNull`, which Kotlin respects), explicitly typing platform values as nullable (`val s: String? = javaCall()`) to force handling, and validating at the boundary.",
      },
      {
        t: "list",
        items: [
          "**Platform types (`T!`)** — from Java; nullability unknown; the compiler is lenient (risk of NPE).",
          "**Respect annotations** — `@Nullable`/`@NonNull`/JSpecify make Kotlin treat them as `T?`/`T`.",
          "**Type explicitly** — assign a platform value to a `T?` to force null handling.",
          "**Validate at the boundary** — `requireNotNull` for values you expect non-null from Java.",
        ],
      },
      {
        t: "note",
        text: "Java values enter as platform types (String!) — nullability unknown, so the compiler won't force a check and a null can cause NPE. Mitigate: honor Java @Nullable/@NonNull annotations (Kotlin respects them), explicitly type platform values as T? to force handling, and requireNotNull at the boundary for expected-non-null values.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between an empty string and null, and what is orEmpty()?",
    a: [
      {
        t: "p",
        text: "`\"\"` (empty string) is a valid, non-null value of length 0; `null` is the absence of a value. They're different: `\"\".length` is 0, but `null.length` won't compile. `orEmpty()` converts a nullable `String?` (or collection) to a non-null empty one when it's null — a concise way to collapse null and empty into a safe default.",
      },
      {
        t: "code",
        title: "orEmpty and null vs empty",
        code: `val s: String? = null
val safe = s.orEmpty()          // "" when null, else the string
val list: List<Int>? = null
val safeList = list.orEmpty()   // emptyList() when null
// isNullOrEmpty / isNullOrBlank check both conditions:
if (input.isNullOrBlank()) showError()`,
      },
      {
        t: "list",
        items: [
          "**Empty vs null** — `\"\"` is a non-null value; `null` is absence.",
          "**`orEmpty()`** — nullable String/collection → non-null empty when null.",
          "**`isNullOrEmpty()`/`isNullOrBlank()`** — check both null and empty/blank in one call.",
          "**Simplifies** — avoids separate null and empty checks.",
        ],
      },
      {
        t: "note",
        text: "\"\" is a valid non-null length-0 value; null is absence — different things. orEmpty() turns a nullable String/collection into a non-null empty one when null. isNullOrEmpty()/isNullOrBlank() check both conditions at once. Collapses null-and-empty handling into concise, safe defaults.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the Nothing type, and how is it used in practice?",
    a: [
      {
        t: "p",
        text: "`Nothing` is the type with *no values* — it represents a computation that never completes normally (always throws or loops forever). It's the return type of `throw` expressions and functions like `error()`/`TODO()`. Because `Nothing` is a subtype of *every* type, an expression of type `Nothing` fits anywhere, which is why `val x = nullable ?: throw ...` type-checks.",
      },
      {
        t: "code",
        title: "Nothing in action",
        code: `fun fail(msg: String): Nothing = throw IllegalStateException(msg)
val user = findUser() ?: fail("not found")   // fail() returns Nothing, fits any type
fun notDone(): Int = TODO()                   // TODO() returns Nothing`,
      },
      {
        t: "list",
        items: [
          "**No instances** — represents 'never returns normally'.",
          "**Subtype of everything** — a `Nothing` expression fits any expected type.",
          "**`throw`/`error()`/`TODO()`** — all typed `Nothing`.",
          "**Enables `?:` guards** — `x ?: throw` / `x ?: return` type-check because of `Nothing`.",
        ],
      },
      {
        t: "note",
        text: "Nothing has no values — it types computations that never return normally (throw, error(), TODO(), infinite loops). It's a subtype of every type, so a Nothing expression fits anywhere — which is why `x ?: throw ...` and `x ?: return` type-check. Use it for functions that always throw.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you chain multiple nullable calls safely?",
    a: [
      {
        t: "p",
        text: "Use the safe-call operator `?.` to chain — `a?.b?.c` returns `null` if *any* link in the chain is null, short-circuiting without an NPE. Combine with `?:` at the end to provide a default. This flattens what would be nested null checks in Java into one readable line.",
      },
      {
        t: "code",
        title: "Safe-call chains",
        code: `val city = user?.address?.city ?: "Unknown"   // null if user or address is null
user?.address?.let { updateMap(it) }           // runs only if the whole chain is non-null`,
      },
      {
        t: "list",
        items: [
          "**`?.` chains** — short-circuits to `null` on the first null link.",
          "**`?:` default** — provide a fallback for the null result.",
          "**No nested ifs** — one line replaces multiple Java null checks.",
          "**`?.let`** — run a block only if the whole chain resolves non-null.",
        ],
      },
      {
        t: "note",
        text: "Chain nullable calls with ?. — a?.b?.c short-circuits to null if any link is null (no NPE); end with ?: for a default. Replaces nested Java null checks with one readable line. Use ?.let to run a block only when the whole chain is non-null.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why can't the compiler smart-cast an open or custom-getter property?",
    a: [
      {
        t: "p",
        text: "Smart casting requires the compiler to *guarantee* the value won't change between the null check and the use. It can't guarantee that for an `open`/overridable `val` (a subclass could override it with a custom getter returning different values), a `val` with a custom getter (which could return a different value each call), or a mutable `var` (another thread/code could change it). In those cases, capture it in a local `val` first.",
      },
      {
        t: "code",
        title: "Capture to smart-cast",
        code: `class Box { val value: String? get() = compute() }   // custom getter

fun use(box: Box) {
    // if (box.value != null) box.value.length  // won't smart-cast
    val v = box.value                            // capture into a local val
    if (v != null) println(v.length)             // smart-casts fine
}`,
      },
      {
        t: "list",
        items: [
          "**Needs stability** — the value must be provably unchanged between check and use.",
          "**Blocked by** — `open val`, custom getters, mutable `var` (esp. properties), delegated properties.",
          "**Fix** — assign to a local `val` (immutable, stable) and check that.",
          "**Or `?.let`** — captures a stable non-null copy for the block.",
        ],
      },
      {
        t: "note",
        text: "Smart cast needs the value provably unchanged between check and use — impossible for open vals, custom getters (could return different values each call), mutable vars, or delegated properties. Fix: capture into a local val and check that, or use ?.let (stable copy).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between ?: (Elvis) and ?. (safe call)?",
    a: [
      {
        t: "p",
        text: "They solve related but distinct problems. `?.` (safe call) accesses a member *only if* the receiver is non-null, yielding `null` otherwise. `?:` (Elvis) provides a *fallback value* when its left side is null. You often combine them: `?.` to safely navigate, `?:` to supply a default for the possibly-null result.",
      },
      {
        t: "code",
        title: "Combining them",
        code: `val length = text?.length ?: 0     // safe-call gives Int?, Elvis defaults to 0
val name = user?.name ?: "Guest"   // navigate then default`,
      },
      {
        t: "list",
        items: [
          "**`?.`** — safe navigation: member access that returns null if the receiver is null.",
          "**`?:`** — Elvis: supply a default when the left side is null.",
          "**Together** — `a?.b ?: default` navigates safely then falls back.",
          "**`!!`** — the opposite: assert non-null (throws), avoid it.",
        ],
      },
      {
        t: "note",
        text: "?. (safe call) accesses a member only if the receiver is non-null (else null); ?: (Elvis) supplies a fallback when the left side is null. Combine: a?.b ?: default navigates safely then defaults. !! is the unsafe opposite (assert non-null, throws).",
      },
    ],
  },
];

export default qa;
