// Functions, Lambdas & Scope Functions — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is a higher-order function and a lambda?",
    a: [
      {
        t: "p",
        text: "**The concept**: Kotlin treats functions as first-class values — you can pass them as arguments, return them, and store them in variables. A **higher-order function** is one that takes a function as a parameter or returns one. A **lambda** is a function literal: an unnamed function written inline, like `{ x -> x * 2 }`.",
      },
      {
        t: "code",
        title: "A higher-order function taking a lambda",
        code: `fun repeat(times: Int, action: (Int) -> Unit) {
    for (i in 0 until times) action(i)
}
repeat(3) { i -> println(i) }    // lambda passed as the action
repeat(3) { println(it) }         // single param can be 'it'`,
      },
      {
        t: "p",
        text: "The function type `(Int) -> Unit` describes 'takes an Int, returns nothing'. When a lambda's last parameter is a function, you can write it *outside* the parentheses (a 'trailing lambda') — which is why `launch { }`, `forEach { }`, and DSLs read so naturally. Higher-order functions plus lambdas are the foundation of Kotlin's expressive standard library (`map`, `filter`, `let`) and of coroutine/Compose APIs.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is an extension function and how does it work?",
    a: [
      {
        t: "p",
        text: "**The concept**: an extension function adds a function to an existing type *without modifying that type or subclassing it* — even for types you don't own like `String` or Android's `View`. You call it like a normal member, and inside it `this` refers to the object it was called on (the 'receiver').",
      },
      {
        t: "code",
        title: "Extending String",
        code: `fun String.toTitleCase(): String =
    split(" ").joinToString(" ") { it.replaceFirstChar(Char::uppercase) }

"hello world".toTitleCase()      // "Hello World"`,
      },
      {
        t: "p",
        text: "**How it works under the hood**: extensions don't actually modify the class — they're *statically resolved*. The compiler turns `\"hi\".toTitleCase()` into a static function call passing the string as an argument. This has an important consequence: because it's static, an extension is dispatched by the *declared* type at the call site, not the runtime type — so extensions aren't polymorphic (an extension on `Animal` isn't 'overridden' by one on `Dog` based on the actual object). They also can't access private members of the type they extend, and if a real member function has the same name, the member wins. Despite these limits, they're everywhere in Kotlin — most of the standard library (`map`, `filter`, `let`) is extension functions.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the scope functions and how do you choose between them?",
    a: [
      {
        t: "p",
        text: "**The concept**: the five scope functions (`let`, `run`, `with`, `apply`, `also`) all execute a block *in the context of an object*. They differ in two ways: how they refer to the object (as `it` or as `this`), and what they return (the object itself, or the block's result).",
      },
      {
        t: "table",
        headers: ["Function", "Refers as", "Returns"],
        rows: [
          ["`let`", "`it`", "block result"],
          ["`run`", "`this`", "block result"],
          ["`apply`", "`this`", "the object"],
          ["`also`", "`it`", "the object"],
          ["`with`", "`this`", "block result"],
        ],
      },
      {
        t: "list",
        items: [
          "**`let`** — null-safe operations and transformations: `value?.let { transform(it) }`. Uses `it`, returns the result.",
          "**`apply`** — configure an object and get it back (builder pattern): `Intent().apply { putExtra(...) }`. Uses `this`, returns the object.",
          "**`also`** — a side effect (like logging) in a chain without breaking it: `load().also { log(it) }`. Uses `it`, returns the object.",
          "**`run`** — compute a result using the object's members: `rect.run { width * height }`. Uses `this`, returns the result.",
          "**`with`** — group multiple calls on an object: `with(canvas) { drawX(); drawY() }`. Takes the object as an argument, returns the result.",
        ],
      },
      {
        t: "p",
        text: "The decision: need the *object back* → `apply` (set properties via `this`) or `also` (side effect via `it`); need the *block's result* → `let`/`run`/`with`. They're all `inline`, so they compile away with zero runtime cost. The main pitfall is overusing them — deeply nested scope functions hurt readability, so a plain variable is sometimes clearer.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between let and apply?",
    a: [
      {
        t: "p",
        text: "**Both run a block on an object, but they differ in what they return and how they reference the object.** `let` returns the *block's result* and refers to the object as `it`. `apply` returns *the object itself* and refers to it as `this`.",
      },
      {
        t: "code",
        title: "The contrast",
        code: `// let — transform and return a NEW result; object is 'it'
val nameLength: Int? = user?.let { it.name.length }

// apply — configure the SAME object and return it; object is 'this'
val user = User().apply {
    name = "Revanth"        // 'this.name', can omit 'this'
    age = 25
}   // returns the configured User`,
      },
      {
        t: "list",
        items: [
          "**Use `let`** when you want to *do something with* an object and get a *different result* — especially null-safe transforms (`?.let { }`). The `it` reference makes it read like 'take this value and produce that'.",
          "**Use `apply`** when you want to *configure* an object (set several properties) and get *the object back* — the builder pattern. The `this` reference lets you set properties directly (`name = ...` instead of `it.name = ...`).",
        ],
      },
      {
        t: "p",
        text: "Mnemonic: `apply` = 'apply this configuration to the object and return the object'; `let` = 'let me compute something from this object and return that'. If you find yourself writing `.apply { }` but then using the block's result, you wanted `run`; if you write `.let { }` just to configure and return the object, you wanted `apply`.",
      },
    ],
  },
  {
    level: "senior",
    q: "What does the inline keyword do, and what are its benefits and costs?",
    a: [
      {
        t: "p",
        text: "**The concept**: normally, a lambda passed to a function is compiled into an *object* (a `Function` instance) — a small heap allocation per call, plus the overhead of the function call itself. Marking a higher-order function `inline` tells the compiler to *copy the function's body — and the bodies of its lambda parameters — directly into the call site*, eliminating both the function call and the lambda object.",
      },
      {
        t: "list",
        items: [
          "**Benefit 1 — no allocation/call overhead**: the lambda isn't turned into an object; the code is pasted inline. This is why `list.forEach { }` is as cheap as a `for` loop and why scope functions (`let`, `apply`) cost nothing. For higher-order functions called in hot paths, this is a real performance win.",
          "**Benefit 2 — non-local returns**: because the lambda body is inlined into the caller, a `return` inside a lambda passed to an inline function returns from the *enclosing* function (not just the lambda). Non-inline lambdas can't do this.",
          "**Benefit 3 — reified type parameters**: only inline functions can have `reified` type parameters, which makes the generic type available at runtime (e.g. `inline fun <reified T> parse(json: String): T` can call `T::class`). This is impossible without inlining because of type erasure.",
        ],
      },
      {
        t: "list",
        items: [
          "**The cost — code bloat**: inlining *duplicates* the function body at every call site. Inline a *large* function called in *many* places and you multiply its bytecode everywhere, increasing method size and APK size. So `inline` is meant for *small* higher-order functions where the per-call lambda overhead actually matters — not big functions, and not functions without lambda parameters (the compiler even warns that inlining without a functional parameter is pointless).",
          "**Fine-grained control**: `noinline` on a specific lambda parameter excludes it from inlining (e.g. when you need to store or pass that lambda elsewhere, which inlined lambdas can't be); `crossinline` marks a lambda that's inlined but must *not* do non-local returns (because it's invoked from a different execution context, like inside another lambda or object).",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: `inline` trades bytecode size for eliminating lambda allocation and call overhead, and unlocks non-local returns and reified generics. Use it for small, frequently-called higher-order functions (which is exactly what the standard library does); avoid it for large functions where the duplication outweighs the savings. Blindly adding `inline` everywhere is an anti-pattern — it can *increase* size and even hurt performance via instruction-cache pressure.",
      },
    ],
  },
  {
    level: "senior",
    q: "Extension functions are statically resolved — what does that mean and what surprising behavior does it cause?",
    a: [
      {
        t: "p",
        text: "**Static resolution means the extension to call is decided at *compile time* based on the *declared* (static) type of the expression, not the *runtime* type of the object.** An extension function isn't really added to the class — the compiler rewrites `x.ext()` into a static call `ext(x)`, choosing which `ext` by the type it *thinks* `x` is at that line, not by what `x` actually is at runtime. This is the opposite of member functions, which are dispatched dynamically (virtually) by the runtime type.",
      },
      {
        t: "code",
        title: "The surprising non-polymorphic behavior",
        code: `open class Animal
class Dog : Animal()

fun Animal.speak() = "generic sound"
fun Dog.speak() = "woof"

val pet: Animal = Dog()      // declared type Animal, runtime type Dog
println(pet.speak())         // prints "generic sound" — NOT "woof"!
// Resolved by the DECLARED type (Animal), ignoring the runtime Dog.`,
      },
      {
        t: "list",
        items: [
          "**The surprise**: even though `pet` is really a `Dog`, `pet.speak()` calls the `Animal` extension, because the compiler resolved it by `pet`'s declared type (`Animal`). If `speak()` were a *member* function overridden in `Dog`, it would print 'woof' (dynamic dispatch). Extensions have no polymorphism.",
          "**Member wins over extension**: if the class already has a member function with the same signature, the member is always called — an extension can never override a member. So you can't use extensions to 'patch' existing behavior.",
          "**No access to private members**: since extensions live outside the class, they can only use its public/internal API, not private fields.",
          "**Practical implications**: don't rely on extensions for polymorphic behavior — if you need runtime dispatch, use a member function or an interface. Extensions are best for *stateless utility* on a type where the declared type is unambiguous (like extending `String` or `List`), not for behavior that should vary by subtype.",
        ],
      },
      {
        t: "p",
        text: "**Why it works this way**: extensions are a compile-time convenience (syntactic sugar over static helper functions), deliberately *not* modifying the class — so they can't participate in the virtual dispatch table. Knowing this prevents a genuinely confusing class of bugs where an extension 'should' be overridden but isn't, and it demonstrates you understand extensions are static helpers dressed up as members, not real methods.",
      },
    ],
  },
];

export default qa;
