// Functions, Lambdas & Scope Functions — Content tab. Teaching-first.

const content = [
  {
    heading: "Higher-order functions and lambdas",
    blocks: [
      {
        t: "p",
        text: "Kotlin treats functions as **first-class**: you can pass them as arguments, return them, and store them in variables. A **higher-order function** is one that takes or returns a function. A **lambda** is a function literal — an unnamed function you write inline, like `{ x -> x * 2 }`.",
      },
      {
        t: "code",
        title: "Function types, lambdas, and passing them around",
        code: `// A function type: (Int) -> Int  means 'takes Int, returns Int'
fun transform(x: Int, op: (Int) -> Int): Int = op(x)

transform(5) { it * 2 }          // lambda; 'it' is the single implicit param -> 10
transform(5, ::square)            // pass a named function by reference

// Storing a lambda in a variable
val adder: (Int, Int) -> Int = { a, b -> a + b }
adder(2, 3)                       // 5`,
      },
      {
        t: "list",
        items: [
          "**Function type syntax**: `(A, B) -> R` — parameter types in parens, return type after the arrow. `() -> Unit` is a no-arg function returning nothing.",
          "**`it`**: when a lambda has a single parameter, you can omit the declaration and refer to it as `it` (`list.map { it.name }`).",
          "**Trailing lambda**: if the last parameter is a function, you can move the lambda *outside* the parentheses — `transform(5) { it * 2 }`. This is what makes DSLs and things like `launch { }` read naturally.",
          "**Function references**: `::square` passes a named function; `String::length` a member reference; `user::save` a bound reference. Cleaner than wrapping in a lambda when you're just forwarding.",
        ],
      },
    ],
  },
  {
    heading: "Extension functions — adding methods to existing types",
    blocks: [
      {
        t: "p",
        text: "An **extension function** lets you add a function to an existing type *without modifying it or subclassing it* — even to types you don't own (`String`, `View`, library classes). Inside the function, `this` refers to the receiver (the object it's called on).",
      },
      {
        t: "code",
        title: "Extending types you don't own",
        code: `fun String.isValidEmail(): Boolean =
    contains("@") && contains(".")

"a@b.com".isValidEmail()          // true — called like a member

fun View.hide() { visibility = View.GONE }   // extend Android's View
myButton.hide()`,
      },
      {
        t: "list",
        items: [
          "**How it works**: extensions are *statically resolved* — the compiler turns `\"x\".isValidEmail()` into a static call passing the string as the receiver. They don't actually modify the class or add anything to it at runtime; there's no dynamic dispatch.",
          "**Consequence — no polymorphism**: because they're static, extensions are resolved by the *declared* type, not the runtime type. An extension on `Animal` won't be overridden by one on `Dog` based on the actual object — the *static* type at the call site decides which runs.",
          "**Can't access private members** of the type they extend (they're outside the class), and **a member function wins** if there's a name clash (members take precedence over extensions).",
          "**Uses**: utility functions that read naturally (`list.sumOf { }`), scoped helpers, making APIs fluent, and Kotlin's entire standard library (`map`, `filter`, `let` are all extension functions).",
        ],
      },
    ],
  },
  {
    heading: "inline functions — eliminating lambda overhead",
    blocks: [
      {
        t: "p",
        text: "Every lambda you pass is normally compiled into an **object** (a `Function` instance) — a small allocation per call. For higher-order functions called frequently, that adds up. The **`inline`** keyword tells the compiler to *copy the function's body (and the lambda's body) directly into the call site*, eliminating the function call and the lambda object entirely.",
      },
      {
        t: "code",
        title: "inline removes the lambda allocation",
        code: `inline fun measure(block: () -> Unit) {
    val start = System.nanoTime()
    block()                        // body inlined at the call site — no lambda object
    println(System.nanoTime() - start)
}

// Standard library uses inline everywhere: let, run, with, apply, also,
// map, filter, forEach — so lambdas passed to them cost nothing.`,
      },
      {
        t: "list",
        items: [
          "**Benefit**: no lambda object allocated, no function-call overhead — the code is pasted inline. This is why `list.forEach { }` is as cheap as a `for` loop, and why scope functions (`let`, `apply`) are free.",
          "**Enables non-local returns**: because the lambda body is inlined, a `return` inside a lambda passed to an inline function returns from the *enclosing* function — impossible with non-inline lambdas.",
          "**Enables `reified` type parameters**: inline functions can use `reified T`, making the type available at runtime (see the generics topic) — e.g. `inline fun <reified T> Gson.fromJson(json: String): T`.",
          "**Trade-offs / when NOT to inline**: inlining *duplicates* the body at every call site, so inlining a *large* function called in many places bloats the bytecode. Inline is for *small* higher-order functions where the lambda-overhead saving matters — not big functions. Use `noinline` (to exclude a specific lambda parameter) and `crossinline` (to forbid non-local returns from a lambda that's called from another context) for finer control.",
        ],
      },
    ],
  },
  {
    heading: "The five scope functions: let, run, with, apply, also",
    blocks: [
      {
        t: "p",
        text: "Scope functions execute a block *in the context of an object*, differing in two dimensions: (1) how they refer to the object — as **`it`** (a lambda parameter) or **`this`** (the receiver), and (2) what they **return** — the object itself or the lambda's result. This table is worth memorizing:",
      },
      {
        t: "table",
        headers: ["Function", "Object referred to as", "Returns", "Typical use"],
        rows: [
          ["`let`", "`it`", "lambda result", "null-safe ops, transform, scoping a variable"],
          ["`run`", "`this`", "lambda result", "compute a result using the object; config + return"],
          ["`with`", "`this` (arg, not extension)", "lambda result", "call multiple methods on an object"],
          ["`apply`", "`this`", "the object itself", "configure an object then return it (builders)"],
          ["`also`", "`it`", "the object itself", "side effects (logging) in a chain, keep the object"],
        ],
      },
      {
        t: "code",
        title: "Each scope function in its idiomatic use",
        code: `// let — null-safe transform; returns the result
val length = nullableStr?.let { it.trim().length }

// apply — configure and return the SAME object (builder-style)
val intent = Intent(this, MainActivity::class.java).apply {
    putExtra("id", 42)
    flags = Intent.FLAG_ACTIVITY_NEW_TASK
}   // returns the configured Intent

// also — side effect without breaking the chain; returns the object
val user = repository.load().also { Log.d("TAG", "loaded \$it") }

// run — execute a block with 'this' and return the result
val area = rectangle.run { width * height }

// with — group calls on an object (not an extension; takes it as arg)
with(canvas) { drawRect(...); drawText(...) }`,
      },
      {
        t: "list",
        items: [
          "**Choose by return + reference**: need the *object back* → `apply` (this) or `also` (it). Need the *lambda's result* → `let`/`run` (this) or `with`. Doing null-safe work → `?.let`. Configuring a builder → `apply`. Logging in a chain → `also`.",
          "**`apply` vs `also`**: both return the object; `apply` uses `this` (good for setting properties: `apply { name = \"x\" }`), `also` uses `it` (good for side effects on the whole object: `also { log(it) }`).",
          "**`let` vs `run`**: both return the lambda result; `let` uses `it` (good with `?.` and for renaming/scoping), `run` uses `this` (good for calling the object's own methods).",
          "**Don't overuse them**: nested scope functions (`apply` inside `let` inside `also`) become unreadable. Reach for a plain variable when clarity beats conciseness.",
        ],
      },
      {
        t: "note",
        text: "The memory hook: **`apply`/`also` return the object** (for chaining/config), **`let`/`run`/`with` return the result** (for computing). **`let`/`also` use `it`**, **`run`/`with`/`apply` use `this`**. All are `inline`, so they cost nothing at runtime.",
      },
    ],
  },
  {
    heading: "Default & named arguments, varargs, and more",
    blocks: [
      {
        t: "list",
        items: [
          "**Default arguments**: parameters can have defaults (`fun greet(name: String = \"Guest\")`), removing the need for Java-style method overloads. Combined with **named arguments** (`greet(name = \"Revanth\")`), you get flexible, readable calls and can skip middle parameters.",
          "**`vararg`**: a variable number of arguments (`fun sum(vararg nums: Int)`); spread an existing array with `*` (`sum(*array)`).",
          "**Infix functions**: `infix fun` allows calling without dot/parens (`1 to 2`, `x shl 3`) — for DSL-like readability.",
          "**Local functions**: functions defined *inside* other functions, with access to the outer scope — for extracting repeated logic without polluting the class namespace.",
          "**Single-expression functions**: `fun square(x: Int) = x * x` — omit braces and `return` for one-liners; type inferred.",
          "**Operator overloading**: `operator fun plus(...)` lets `+`, `[]`, `in`, etc. work on your types (`operator fun get(i: Int)` enables `obj[i]`).",
        ],
      },
    ],
  },
];

export default content;
