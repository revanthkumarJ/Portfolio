// Null Safety & Types — Content tab. Teaching-first.

const content = [
  {
    heading: "Null safety — nullability is part of the type",
    blocks: [
      {
        t: "p",
        text: "Kotlin's headline feature is **null safety**: the type system distinguishes a type that can hold null from one that can't. `String` is a non-null type — it can *never* be null, guaranteed by the compiler. `String?` is a nullable type — it might be null. This turns the billion-dollar `NullPointerException` from a runtime crash into a compile-time check: you literally cannot assign null to a non-null type, and you can't use a nullable value without handling the null case.",
      },
      {
        t: "code",
        title: "The compiler enforces nullability",
        code: `var a: String = "hello"
a = null            // COMPILE ERROR — String is non-null

var b: String? = "hi"
b = null            // OK — String? is nullable

val len = b.length  // COMPILE ERROR — b might be null, must handle it first`,
      },
      {
        t: "list",
        items: [
          "The guarantee is *compile-time*: non-null types can't hold null, and nullable types force you to handle the null before use. NPEs become nearly impossible in pure Kotlin.",
          "This shifts null handling from 'remember to check everywhere' (Java) to 'the compiler won't let you forget' — a systemic safety improvement.",
        ],
      },
    ],
  },
  {
    heading: "The null-handling operators",
    blocks: [
      {
        t: "code",
        title: "Safe call, Elvis, not-null assertion",
        code: `val user: User? = getUser()

// ?. safe call — returns null if the receiver is null (short-circuits)
val name: String? = user?.name
val city: String? = user?.address?.city   // chains — null if any link is null

// ?: Elvis — provide a default when the left side is null
val displayName: String = user?.name ?: "Guest"

// ?.let — run a block only if non-null
user?.let { u -> println(u.name) }         // block skipped if user is null

// !! not-null assertion — assert non-null, THROW NPE if wrong (dangerous)
val forced: String = user!!.name           // crashes if user is null`,
      },
      {
        t: "list",
        items: [
          "**`?.` (safe call)** — access a member only if the receiver is non-null; the whole expression is null otherwise. Chainable (`a?.b?.c`), short-circuiting at the first null.",
          "**`?:` (Elvis operator)** — supply a fallback value (or throw / return) when the left side is null: `name ?: \"default\"`, `id ?: return`, `token ?: throw IllegalStateException()`.",
          "**`?.let { }`** — execute a block with the non-null value, skipped entirely if null — a common way to 'do something only if present'.",
          "**`!!` (not-null assertion)** — force a nullable into non-null, throwing NPE if it's actually null. It reintroduces the exact crash null safety prevents, so it's a code smell — use only when you can *prove* non-null and the alternative is worse. Overusing `!!` is a red flag in review.",
        ],
      },
    ],
  },
  {
    heading: "Smart casts — the compiler narrows types for you",
    blocks: [
      {
        t: "p",
        text: "After you *check* a value's type or nullability, Kotlin **smart-casts** it — automatically treating it as the narrower type within that scope, so you don't cast manually.",
      },
      {
        t: "code",
        title: "Smart casts in action",
        code: `fun describe(x: Any) {
    if (x is String) {
        // x is smart-cast to String here — call String methods directly
        println(x.length)
    }
}

fun greet(name: String?) {
    if (name != null) {
        // name is smart-cast to non-null String inside this branch
        println(name.uppercase())
    }
}`,
      },
      {
        t: "list",
        items: [
          "After `if (x is Type)`, `x` is treated as `Type` in that branch. After `if (x != null)`, `x` is non-null there. Also works with `&&`, early returns, and `when` branches.",
          "**Smart cast requires the value can't change between check and use** — it works on `val`s and local `var`s, but **not** on mutable properties that could be changed by another thread or a custom getter (a `var` property could return different values on each access). That's why you sometimes must copy a nullable property to a local val first: `val n = name; if (n != null) n.uppercase()`.",
        ],
      },
    ],
  },
  {
    heading: "val vs var, and immutability",
    blocks: [
      {
        t: "list",
        items: [
          "**`val`** — a read-only reference (assigned once, can't be reassigned). **`var`** — a mutable reference (can be reassigned). Prefer `val` by default; reach for `var` only when reassignment is genuinely needed. `val` makes code easier to reason about (the reference won't change under you).",
          "**`val` is not deep immutability**: `val list = mutableListOf(1)` — you can't reassign `list`, but you *can* `list.add(2)` (the object it points to is mutable). Immutability of the *reference* is separate from immutability of the *object*. For an immutable collection, use `listOf()` (read-only) or a truly immutable type.",
          "**`const val`** — a compile-time constant (only for top-level or `object` primitives/Strings); inlined at compile time. Different from a regular `val`, which is computed at runtime.",
        ],
      },
    ],
  },
  {
    heading: "Kotlin type system essentials",
    blocks: [
      {
        t: "list",
        items: [
          "**Everything is an object**: there are no Java-style primitives in the language — `Int`, `Boolean`, `Double` are classes. The compiler optimizes them to JVM primitives where possible (a non-null `Int` becomes `int`), but a nullable `Int?` becomes a boxed `Integer`.",
          "**`Any`** — the root of all non-null types (like Java's `Object`). **`Any?`** — the root of *everything*, including nullables. **`Unit`** — the type of functions that return no meaningful value (like `void`, but an actual type/object). **`Nothing`** — the type that has no values; a function returning `Nothing` never returns normally (it always throws or loops forever) — used for `throw`, `TODO()`, and to make the compiler's flow analysis smarter.",
          "**Type inference**: Kotlin infers types, so you rarely write them — `val x = 5` infers `Int`. You add explicit types for public API clarity or when inference is ambiguous.",
        ],
      },
    ],
  },
  {
    heading: "Platform types — the Java interop gap",
    blocks: [
      {
        t: "p",
        text: "When Kotlin calls Java code, Java has *no* nullability information (any reference can be null in Java). Kotlin represents these as **platform types** (written `String!` in errors/docs), meaning 'nullability unknown'. The compiler *relaxes* null checks for them — it lets you treat a platform type as non-null, trusting you. The risk: if the Java method actually returns null and you treated it as non-null, you get an NPE at runtime — the one place Kotlin's null safety can be bypassed.",
      },
      {
        t: "list",
        items: [
          "**Why they exist**: forcing every Java call to be nullable would make interop unbearable (every result would need `?.`); treating every Java call as non-null would hide real nulls. Platform types are the pragmatic middle — you decide.",
          "**Best practice**: when consuming Java APIs, *explicitly annotate* the type you assign to (`val name: String = javaObj.getName()` asserts non-null and will NPE early if wrong; `val name: String? = ...` treats it as nullable and safe). Don't let platform types flow deep into your code untyped.",
          "**Nullability annotations help**: Java code annotated with `@Nullable`/`@NonNull` (JetBrains, AndroidX, JSpecify) *does* carry nullability into Kotlin, eliminating the platform-type gap — which is why AndroidX APIs interop cleanly.",
        ],
      },
      {
        t: "note",
        text: "Interview-ready: \"Kotlin encodes nullability in the type system (`String` vs `String?`), enforced at compile time, handled with `?.`, `?:`, `?.let`, and (sparingly) `!!`. Smart casts narrow types after checks. The one hole is *platform types* from unannotated Java — nullability-unknown types the compiler trusts you on, which can still NPE; annotate them explicitly at the boundary.\"",
      },
    ],
  },
];

export default content;
