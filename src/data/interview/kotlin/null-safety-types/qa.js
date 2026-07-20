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
];

export default qa;
