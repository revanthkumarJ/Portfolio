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
  {
    level: "junior",
    q: "What are default and named arguments, and how do they replace overloads?",
    a: [
      {
        t: "p",
        text: "Default arguments let a parameter have a value used when the caller omits it (`fun f(x: Int = 0)`), and named arguments let callers specify parameters by name in any order (`f(x = 5)`). Together they replace most method overloading — one function with defaults covers many call shapes, and named args make calls with many parameters readable.",
      },
      {
        t: "code",
        title: "Defaults + named args",
        code: `fun createUser(name: String, role: String = "user", active: Boolean = true) { }

createUser("Sam")                          // uses defaults
createUser("Sam", active = false)          // named, skip role
createUser(name = "Sam", role = "admin")   // named for clarity`,
      },
      {
        t: "list",
        items: [
          "**Default arguments** — omit params that have defaults.",
          "**Named arguments** — specify by name, any order; skip middle params.",
          "**Replace overloads** — one function covers many signatures.",
          "**`@JvmOverloads`** — generate overloads for Java callers (Java has no defaults).",
        ],
      },
      {
        t: "note",
        text: "Default arguments (fun f(x = 0)) provide values when omitted; named arguments (f(x = 5)) specify by name in any order (skip middle params). Together they replace most overloading — one function covers many call shapes, and named args make many-param calls readable. @JvmOverloads exposes overloads to Java.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a function type and a lambda?",
    a: [
      {
        t: "p",
        text: "A *function type* like `(Int) -> String` is a *type* — the signature of a function value. A *lambda* `{ x: Int -> x.toString() }` is a *value* of that type — an anonymous function expression. So a function type describes what's expected (a parameter or variable type), and a lambda is one way to create such a value (function references are another).",
      },
      {
        t: "code",
        title: "Type vs value",
        code: `val transform: (Int) -> String = { it.toString() }   // type is (Int)->String; value is the lambda
fun process(op: (Int) -> Int) { }                    // parameter type
process { it * 2 }                                    // lambda argument
process(::square)                                     // function reference`,
      },
      {
        t: "list",
        items: [
          "**Function type** — `(A, B) -> R`; the type of a function value.",
          "**Lambda** — `{ params -> body }`; an anonymous function value.",
          "**Function reference** — `::name` / `obj::method`; another way to supply a function value.",
          "**Trailing lambda** — a lambda as the last argument can go outside the parens.",
        ],
      },
      {
        t: "note",
        text: "A function type ((Int)->String) is a type (signature of a function value); a lambda ({ it.toString() }) is a value of that type (anonymous function). Function references (::name, obj::method) are another way to make such values. The last-argument lambda can go outside the parentheses (trailing lambda syntax).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a trailing lambda, and how does the it parameter work?",
    a: [
      {
        t: "p",
        text: "If a function's *last* parameter is a function type, you can move the lambda *outside* the parentheses — `list.filter { it > 0 }`. And when a lambda has a *single* parameter, you can omit its declaration and refer to it as the implicit `it`. These two conventions make Kotlin's higher-order calls read cleanly.",
      },
      {
        t: "code",
        title: "Trailing lambda + it",
        code: `list.filter { it > 0 }                     // trailing lambda + implicit it
list.fold(0) { acc, x -> acc + x }         // multiple params -> name them
run { println("hi") }                       // only-lambda call: no parens needed`,
      },
      {
        t: "list",
        items: [
          "**Trailing lambda** — a last function-type arg goes outside the parens.",
          "**Only argument** — if the lambda is the sole argument, drop the parens entirely.",
          "**`it`** — the implicit name for a single-parameter lambda.",
          "**Multiple params** — must be named explicitly (no `it`).",
        ],
      },
      {
        t: "note",
        text: "If the last parameter is a function type, the lambda goes outside the parentheses (trailing lambda); if it's the only argument, drop the parens entirely. A single-parameter lambda's parameter is the implicit `it`; multiple parameters must be named. These make higher-order calls read cleanly.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a function reference (::), and what kinds are there?",
    a: [
      {
        t: "p",
        text: "A function reference passes an existing function as a value instead of wrapping it in a lambda. `::topLevel` references a top-level/local function, `obj::method` a bound method (on a specific instance), `Class::method` an unbound one, and `::ClassName` a constructor reference. They're concise and often clearer than `{ x -> f(x) }`.",
      },
      {
        t: "code",
        title: "Reference kinds",
        code: `list.map(::square)              // top-level function reference
list.forEach(viewModel::log)   // bound reference (on viewModel)
list.map(String::uppercase)    // unbound (receiver is the arg)
val users = names.map(::User)  // constructor reference`,
      },
      {
        t: "list",
        items: [
          "**`::function`** — top-level/local function.",
          "**`obj::method`** — bound to a specific instance.",
          "**`Class::method`** — unbound; the receiver becomes the first argument.",
          "**`::ClassName`** — constructor reference.",
        ],
      },
      {
        t: "note",
        text: "Function references pass existing functions as values: ::topLevel, obj::method (bound), Class::method (unbound — receiver is the arg), ::ClassName (constructor). Cleaner than { x -> f(x) } and enable point-free style (list.map(::square)).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between run, with, let, apply, and also?",
    a: [
      {
        t: "p",
        text: "The five scope functions differ on two axes: how they refer to the context object (`it` vs `this`) and what they return (the object vs the lambda result). `let`/`also` use `it`; `run`/`with`/`apply` use `this`. `apply`/`also` return the *object*; `let`/`run`/`with` return the *lambda result*.",
      },
      {
        t: "table",
        headers: ["Function", "Refers as", "Returns"],
        rows: [
          ["let", "it", "lambda result"],
          ["run", "this", "lambda result"],
          ["with", "this", "lambda result"],
          ["apply", "this", "the object"],
          ["also", "it", "the object"],
        ],
      },
      {
        t: "list",
        items: [
          "**`let`** — transform/null-check; `it`; returns result. `x?.let { }`.",
          "**`run`** — compute a result with `this`; also a non-extension `run { }` block.",
          "**`with`** — like `run` but a regular function: `with(x) { }`.",
          "**`apply`** — configure an object; `this`; returns the object. `Builder().apply { }`.",
          "**`also`** — side effect; `it`; returns the object. `x.also { log(it) }`.",
        ],
      },
      {
        t: "note",
        text: "Scope functions differ by receiver (it: let/also; this: run/with/apply) and return (object: apply/also; result: let/run/with). let: transform/null-check; run/with: compute a result; apply: configure and return the object; also: side effect and return the object. Pick by whether you need the result or the object, and it vs this.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a receiver in a lambda (lambda with receiver), and how do DSLs use it?",
    a: [
      {
        t: "p",
        text: "A *lambda with receiver* has type `Receiver.() -> R` — inside it, `this` is the receiver, so you can call the receiver's members directly without qualification. This is the foundation of Kotlin DSLs (like Compose, Gradle Kotlin, `buildString`): the builder is the receiver, so the lambda body reads like a mini-language operating on it.",
      },
      {
        t: "code",
        title: "Lambda with receiver",
        code: `fun buildUser(block: UserBuilder.() -> Unit): User =
    UserBuilder().apply(block).build()

val user = buildUser {
    name = "Sam"        // 'this' is UserBuilder — direct member access
    age = 30
}
// buildString { append("a"); append("b") }  // StringBuilder receiver`,
      },
      {
        t: "list",
        items: [
          "**`Receiver.() -> R`** — `this` inside the lambda is the receiver.",
          "**Direct member access** — call the receiver's methods/properties unqualified.",
          "**DSLs** — builders as receivers create readable domain-specific syntax (Compose, Gradle).",
          "**`apply`/`with`/`buildString`** — standard examples of receiver lambdas.",
        ],
      },
      {
        t: "note",
        text: "A lambda with receiver (Receiver.() -> R) makes `this` the receiver inside, so you call its members directly without qualification — the basis of Kotlin DSLs (Compose, Gradle, buildString): the builder is the receiver, so the body reads like a domain language. apply/with use this pattern.",
      },
    ],
  },
  {
    level: "senior",
    q: "What does noinline do, and when do you need it?",
    a: [
      {
        t: "p",
        text: "In an `inline` function, all function-type parameters are inlined by default. `noinline` marks a specific lambda parameter to *not* be inlined — needed when you must treat that lambda as an object (store it, pass it to a non-inline function, or return it), which inlined lambdas can't be.",
      },
      {
        t: "code",
        title: "noinline",
        code: `inline fun process(
    action: () -> Unit,             // inlined
    noinline callback: () -> Unit,  // kept as an object
) {
    action()
    registerLater(callback)          // needs a real object -> noinline
}`,
      },
      {
        t: "list",
        items: [
          "**Default** — inline function lambdas are inlined (no object created).",
          "**`noinline`** — keep a lambda as an object; use when you store/pass/return it.",
          "**Why** — inlined lambdas have no object identity to hold onto.",
          "**Related** — `crossinline` for lambdas used in another execution context.",
        ],
      },
      {
        t: "note",
        text: "In an inline function, lambda params are inlined by default; noinline keeps a specific lambda as a real object — needed when you store it, pass it to a non-inline function, or return it (inlined lambdas have no object). crossinline is the related modifier for non-local-return control.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is crossinline, and what problem does it solve?",
    a: [
      {
        t: "p",
        text: "`crossinline` marks an inline function's lambda parameter that will be called from a *different execution context* (e.g. inside another lambda, a `Runnable`, or a nested object) — where a non-local `return` from the lambda would be unsafe. It keeps the lambda inlined but *forbids non-local returns* from it, resolving the conflict.",
      },
      {
        t: "code",
        title: "crossinline",
        code: `inline fun runOnUi(crossinline block: () -> Unit) {
    Handler(Looper.getMainLooper()).post {
        block()   // called inside another lambda -> crossinline required
    }
}
// crossinline forbids: return from block would be non-local and unsafe here`,
      },
      {
        t: "list",
        items: [
          "**`crossinline`** — inlined, but non-local `return` disallowed.",
          "**Why** — the lambda runs in a nested context where a non-local return can't work.",
          "**Still inlined** — no object created (unlike `noinline`).",
          "**Use** — passing an inline lambda into a `post`/`Runnable`/nested lambda.",
        ],
      },
      {
        t: "note",
        text: "crossinline keeps a lambda inlined but forbids non-local returns — needed when the lambda is invoked from a different execution context (inside another lambda/Runnable/object) where a non-local return would be unsafe. Unlike noinline, it stays inlined (no object).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a non-local return, and how does it relate to inline functions?",
    a: [
      {
        t: "p",
        text: "Normally you can't `return` from a lambda to exit the *enclosing* function. But in an *inline* function's lambda, a bare `return` *does* return from the enclosing function (a *non-local return*), because the lambda body is inlined into it. This is why `forEach { return }` can exit the outer function — `forEach` is inline. For labeled/local returns, use `return@forEach`.",
      },
      {
        t: "code",
        title: "Non-local vs local return",
        code: `fun find(list: List<Int>): Int? {
    list.forEach { if (it > 10) return it }   // non-local: returns from find()
    return null
}
list.forEach { if (it > 10) return@forEach }  // local: continues the loop`,
      },
      {
        t: "list",
        items: [
          "**Non-local return** — `return` from an inline lambda exits the enclosing function.",
          "**Enabled by inline** — the lambda is inlined, so the return targets the outer function.",
          "**Local return** — `return@label` returns only from the lambda (like `continue`).",
          "**Non-inline lambdas** — can't do non-local return (no enclosing frame to return to).",
        ],
      },
      {
        t: "note",
        text: "In an inline function's lambda, a bare return exits the ENCLOSING function (non-local return) because the lambda is inlined into it — that's why forEach { return } exits the outer function. Use return@forEach for a local return (like continue). Non-inline lambdas can't do non-local returns.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are reified type parameters, and why do they need inline?",
    a: [
      {
        t: "p",
        text: "Normally generic type arguments are *erased* at runtime, so you can't do `T::class` or `is T`. A `reified` type parameter (only allowed on `inline` functions) preserves the type at the call site — because the function is inlined, the concrete type is substituted in, making `T::class`, `is T`, and `as T` work. This powers APIs like `fromJson<User>()`.",
      },
      {
        t: "code",
        title: "reified",
        code: `inline fun <reified T> Gson.fromJson(json: String): T =
    fromJson(json, T::class.java)                // T::class works because reified

val user = gson.fromJson<User>(jsonString)
inline fun <reified T> List<*>.filterByType() = filterIsInstance<T>()`,
      },
      {
        t: "list",
        items: [
          "**`reified`** — preserves the type argument at runtime; requires `inline`.",
          "**Enables** — `T::class`, `is T`, `as T` inside the function.",
          "**Why inline** — inlining substitutes the concrete type at the call site.",
          "**Uses** — type-safe serialization, `filterIsInstance`, DI lookups, `getSystemService<T>()`.",
        ],
      },
      {
        t: "note",
        text: "A reified type parameter (only on inline functions) preserves the type argument at runtime — enabling T::class, is T, as T (normally impossible due to erasure) because inlining substitutes the concrete type at the call site. Powers fromJson<User>(), filterIsInstance<T>(), getSystemService<T>().",
      },
    ],
  },
  {
    level: "junior",
    q: "What is an extension property, and how does it differ from an extension function?",
    a: [
      {
        t: "p",
        text: "An extension property adds a *property* (with a getter, and setter if `var`) to an existing type — `val String.firstWord: String get() = split(\" \").first()`. Like extension functions, it's resolved statically and can't add *state* (no backing field), so it must be computed. It's just syntactic sugar for a getter/setter over the receiver.",
      },
      {
        t: "code",
        title: "Extension property",
        code: `val String.wordCount: Int
    get() = trim().split(Regex("\\\\s+")).size

"hello world".wordCount   // 2`,
      },
      {
        t: "list",
        items: [
          "**Extension property** — a computed property on an existing type (custom getter).",
          "**No backing field** — can't store state; must be computed.",
          "**Statically resolved** — like extension functions (based on declared type).",
          "**Uses** — convenient derived values (`list.lastIndex`, custom accessors).",
        ],
      },
      {
        t: "note",
        text: "An extension property adds a computed property (getter, and setter for var) to an existing type — no backing field (can't store state), statically resolved like extension functions. Sugar for a getter over the receiver; use for convenient derived values.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a vararg parameter, and how does the spread operator work?",
    a: [
      {
        t: "p",
        text: "`vararg` lets a function accept a variable number of arguments of a type — `fun sum(vararg nums: Int)`, callable as `sum(1, 2, 3)`. Inside, `nums` is an array. To pass an existing array *as* the varargs, use the spread operator `*`: `sum(*intArray)`.",
      },
      {
        t: "code",
        title: "vararg + spread",
        code: `fun log(vararg messages: String) { messages.forEach { println(it) } }
log("a", "b", "c")

val arr = arrayOf("x", "y")
log(*arr)                 // spread: pass the array as varargs
log("first", *arr, "last")   // combine`,
      },
      {
        t: "list",
        items: [
          "**`vararg`** — variable number of args; treated as an array inside.",
          "**Spread `*`** — pass an existing array as the varargs.",
          "**Combine** — mix literal args and a spread array.",
          "**One vararg per function** — usually the last parameter.",
        ],
      },
      {
        t: "note",
        text: "vararg accepts a variable number of args (an array inside the function): fun log(vararg m: String), called log(\"a\", \"b\"). The spread operator * passes an existing array as varargs: log(*arr). One vararg per function (usually last); you can mix literals with a spread.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is an infix function, and when should you use one?",
    a: [
      {
        t: "p",
        text: "An `infix fun` can be called without the dot and parentheses — `a to b` instead of `a.to(b)`. It must be a member or extension function with a *single* parameter. Use it sparingly for readable, operator-like DSL syntax (`1 to \"one\"`, `x shl 2`, custom matchers) — only where it genuinely reads better.",
      },
      {
        t: "code",
        title: "infix",
        code: `infix fun Int.times(str: String) = str.repeat(this)
2 times "Bye "          // "Bye Bye "
val pair = "key" to 1   // 'to' is an infix function creating a Pair`,
      },
      {
        t: "list",
        items: [
          "**`infix fun`** — call as `a name b` (no dot/parens).",
          "**Single parameter** — member or extension, exactly one arg.",
          "**Readable DSLs** — `to`, bitwise (`shl`, `and`), test matchers.",
          "**Use sparingly** — only where it clearly improves readability.",
        ],
      },
      {
        t: "note",
        text: "infix fun enables a name b syntax (no dot/parens) — must be a single-parameter member/extension. Examples: to (Pair), bitwise shl/and, test matchers. Use sparingly for operator-like readability where it genuinely reads better; overuse hurts clarity.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is tail recursion (tailrec), and what problem does it solve?",
    a: [
      {
        t: "p",
        text: "`tailrec` marks a recursive function whose recursive call is the *last* operation, letting the compiler convert it into a *loop* — avoiding stack growth and `StackOverflowError` for deep recursion. The recursion must be in tail position (nothing done after the recursive call) for the compiler to optimize it.",
      },
      {
        t: "code",
        title: "tailrec",
        code: `tailrec fun factorial(n: Int, acc: Long = 1): Long =
    if (n <= 1) acc else factorial(n - 1, acc * n)   // recursive call is last -> compiled to a loop`,
      },
      {
        t: "list",
        items: [
          "**`tailrec`** — compiler rewrites tail-recursive functions as loops.",
          "**No stack growth** — avoids `StackOverflowError` for deep recursion.",
          "**Tail position required** — the recursive call must be the last thing done.",
          "**Accumulator pattern** — carry state in a parameter to keep the call in tail position.",
        ],
      },
      {
        t: "note",
        text: "tailrec converts a tail-recursive function (recursive call is the LAST operation) into a loop — no stack growth, no StackOverflowError for deep recursion. Requires true tail position (nothing after the recursive call); use an accumulator parameter to keep it in tail position.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a local function, and when is it useful?",
    a: [
      {
        t: "p",
        text: "A local function is a function *declared inside another function*. It can access the enclosing function's local variables and parameters (a closure), and it's not visible outside. Use it to factor out repeated logic within a function without polluting the class namespace or passing many parameters.",
      },
      {
        t: "code",
        title: "Local function",
        code: `fun processOrder(order: Order): Result {
    fun validate(field: String) {          // local, sees 'order'
        require(field.isNotBlank()) { "invalid" }
    }
    validate(order.name)
    validate(order.address)
    return submit(order)
}`,
      },
      {
        t: "list",
        items: [
          "**Local function** — declared inside a function; not visible outside.",
          "**Closure** — accesses enclosing locals/params without passing them.",
          "**Encapsulation** — factor out repeated logic without a private method.",
          "**Recursion** — can be recursive (and `tailrec`).",
        ],
      },
      {
        t: "note",
        text: "A local function is declared inside another function — it closes over the enclosing locals/params (no need to pass them) and isn't visible outside. Use it to factor out repeated logic within a function without adding a private class method. Can be recursive/tailrec.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a single-expression function, and when do you use it?",
    a: [
      {
        t: "p",
        text: "When a function just returns one expression, you can write it with `=` instead of a block and `return` — `fun square(x: Int) = x * x`. The return type is inferred (though you can annotate it). It makes small functions concise; use a block body when there's more than a single expression.",
      },
      {
        t: "code",
        title: "Expression body",
        code: `fun square(x: Int) = x * x                     // inferred Int
fun greet(name: String): String = "Hi \$name"   // annotated return
fun statusOf(u: User) = when (u.state) {        // expression when
    Active -> "on"; else -> "off"
}`,
      },
      {
        t: "list",
        items: [
          "**`fun f() = expr`** — single-expression (expression body) function.",
          "**Return type inferred** — or annotate for public API clarity.",
          "**Concise** — for one-liners, `when`/`if` expressions.",
          "**Block body** — use `{ return ... }` for multi-statement logic.",
        ],
      },
      {
        t: "note",
        text: "A single-expression function uses = instead of a block: fun square(x) = x * x (return type inferred; annotate for public API). Great for one-liners and expression when/if. Use a block body { return ... } when there's more than one expression.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do inline functions affect lambda performance?",
    a: [
      {
        t: "p",
        text: "Normally a lambda passed to a function is compiled into an *object* (a `Function` instance), and capturing variables adds allocation. An `inline` function copies its body — and its lambda bodies — directly into the call site, so *no lambda object is created* and there's no call overhead. This is why the standard library's higher-order functions (`map`, `filter`, `forEach`) are inline: zero-overhead functional style.",
      },
      {
        t: "list",
        items: [
          "**Non-inline lambda** — allocates a `Function` object (and captures) per call.",
          "**`inline`** — copies the body to the call site; no lambda object, no call overhead.",
          "**Std lib** — `map`/`filter`/`let`/`run` are inline for zero-cost lambdas.",
          "**Cost** — inlining increases bytecode size; use for small, lambda-taking functions, not large ones.",
        ],
      },
      {
        t: "note",
        text: "A non-inline lambda compiles to a Function object (allocation, call overhead); an inline function copies its body and lambdas into the call site — no lambda object, no call overhead. That's why map/filter/let/run are inline (zero-cost functional style). Trade-off: larger bytecode, so inline small lambda-taking functions, not big ones.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a closure, and what can a lambda capture?",
    a: [
      {
        t: "p",
        text: "A closure is a lambda (or local/anonymous function) that *captures* variables from its enclosing scope — it can read and, unlike Java, *modify* captured `var`s. The lambda keeps those variables alive as long as it exists. This is powerful but can cause leaks if a long-lived lambda captures a large object (or an Activity).",
      },
      {
        t: "code",
        title: "Capturing",
        code: `fun counter(): () -> Int {
    var count = 0
    return { ++count }     // captures and mutates 'count'
}
val next = counter()
next(); next()             // 1, 2 — 'count' persists in the closure`,
      },
      {
        t: "list",
        items: [
          "**Captures enclosing variables** — reads and (unlike Java) mutates `var`s.",
          "**Keeps them alive** — captured variables live as long as the lambda.",
          "**Leak risk** — a retained lambda capturing an Activity/large object leaks it.",
          "**Kotlin vs Java** — Kotlin closures can modify captured variables (Java requires effectively-final).",
        ],
      },
      {
        t: "note",
        text: "A closure is a lambda that captures variables from its enclosing scope — reading and (unlike Java's effectively-final) modifying captured vars, keeping them alive as long as the lambda. Powerful, but a retained lambda capturing an Activity/large object leaks it — be mindful in callbacks/coroutines.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between a top-level function and a method?",
    a: [
      {
        t: "p",
        text: "Kotlin allows *top-level functions* — declared directly in a file, not inside a class. They're great for utilities and don't require a wrapper class (unlike Java's static methods in a `Utils` class). A *method* is a function that belongs to a class/object and has access to its state. Prefer top-level functions for stateless utilities; methods when behavior operates on instance state.",
      },
      {
        t: "list",
        items: [
          "**Top-level function** — file-level, no class; for stateless utilities.",
          "**Method** — member of a class/object; accesses instance state.",
          "**No Utils classes** — top-level replaces Java's static-method holders.",
          "**JVM** — top-level functions compile to static methods in a `FileNameKt` class (for Java interop).",
        ],
      },
      {
        t: "note",
        text: "Top-level functions are declared at file level (no class) — ideal for stateless utilities, replacing Java's static-method Utils classes. Methods belong to a class/object and access its state. On the JVM, top-level functions become static methods in a FileNameKt class for Java interop.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you choose between let, run, apply, also, and with in practice?",
    a: [
      {
        t: "p",
        text: "Pick by intent: `apply` to *configure* an object and return it (`Builder().apply { }`); `also` for a *side effect* that returns the object (`x.also { log(it) }`); `let` to *transform* or null-check (`x?.let { }`); `run`/`with` to *compute a result* from an object's members. Consistency and readability matter more than rigid rules.",
      },
      {
        t: "list",
        items: [
          "**Configure + return object** → `apply` (`this`).",
          "**Side effect + return object** → `also` (`it`).",
          "**Transform / null-check → result** → `let` (`it`).",
          "**Compute result from members** → `run`/`with` (`this`).",
        ],
      },
      {
        t: "code",
        title: "In practice",
        code: `val user = User().apply { name = "Sam"; age = 30 }   // configure
val len = text?.let { it.trim().length } ?: 0        // transform + null-check
logger.also { it.log("start") }                       // side effect
val area = rect.run { width * height }                // compute from members`,
      },
      {
        t: "note",
        text: "Choose by intent: apply = configure and return the object (this); also = side effect returning the object (it); let = transform/null-check returning a result (it); run/with = compute a result from members (this). Consistency/readability beats rigid rules — many teams standardize on a subset.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a higher-order function, and why are they powerful?",
    a: [
      {
        t: "p",
        text: "A higher-order function *takes a function as a parameter and/or returns one*. This enables passing behavior as data — you parameterize *what* to do, not just *with what*. It's the basis of the collection operators (`map`, `filter`), callbacks, and building reusable abstractions (retry, measureTime, resource management).",
      },
      {
        t: "code",
        title: "Behavior as a parameter",
        code: `fun <T> retry(times: Int, block: () -> T): T {   // takes a function
    repeat(times - 1) { runCatching { return block() } }
    return block()
}
fun multiplier(factor: Int): (Int) -> Int = { it * factor }   // returns a function
retry(3) { api.load() }`,
      },
      {
        t: "list",
        items: [
          "**Takes/returns functions** — behavior passed as values.",
          "**Parameterize behavior** — the caller supplies the 'what to do'.",
          "**Reusable abstractions** — retry, timing, transactions, resource wrappers.",
          "**Foundation** — collection ops, callbacks, DSLs.",
        ],
      },
      {
        t: "note",
        text: "A higher-order function takes and/or returns functions — parameterizing behavior (the 'what to do'), not just data. It's the basis of collection operators, callbacks, and reusable abstractions (retry, timing, resource management). Combined with inline, it's zero-overhead.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does the use function work for resource management?",
    a: [
      {
        t: "p",
        text: "`use { }` is an extension on `Closeable`/`AutoCloseable` that runs a block and *guarantees the resource is closed* afterward — even on exception — returning the block's result. It's Kotlin's try-with-resources equivalent, and it correctly handles exceptions during close (adding them as suppressed).",
      },
      {
        t: "code",
        title: "use for auto-close",
        code: `val text = File("data.txt").bufferedReader().use { reader ->
    reader.readText()          // reader.close() called automatically, even on error
}
FileInputStream(path).use { stream -> stream.readBytes() }`,
      },
      {
        t: "list",
        items: [
          "**`use { }`** — runs the block, closes the resource in a `finally`.",
          "**Exception-safe** — closes even if the block throws; close errors added as suppressed.",
          "**Returns the block result** — assign it directly.",
          "**Replaces** — manual try/finally close boilerplate.",
        ],
      },
      {
        t: "note",
        text: "use { } (on Closeable/AutoCloseable) runs a block and guarantees close() afterward — even on exception (close errors added as suppressed), returning the block's result. Kotlin's try-with-resources; replaces manual try/finally close boilerplate.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between a lambda and an anonymous function?",
    a: [
      {
        t: "p",
        text: "A *lambda* (`{ x -> x + 1 }`) is concise but has restrictions: no explicit return type, and `return` means non-local return. An *anonymous function* (`fun(x: Int): Int { return x + 1 }`) looks like a regular function without a name — it lets you specify the return type explicitly and use a normal (local) `return`. Use anonymous functions when you need an explicit return type or a local return in the function value.",
      },
      {
        t: "code",
        title: "Lambda vs anonymous function",
        code: `val a = { x: Int -> x + 1 }                       // lambda
val b = fun(x: Int): Int { return x + 1 }         // anonymous function (explicit return type)
list.filter(fun(x): Boolean {
    if (x < 0) return false                        // LOCAL return (returns from the anon fn)
    return x % 2 == 0
})`,
      },
      {
        t: "list",
        items: [
          "**Lambda** — concise; return type inferred; `return` is non-local (in inline contexts).",
          "**Anonymous function** — explicit return type; `return` is local to it.",
          "**Use anon fn** — when you need an explicit return type or local returns.",
          "**Prefer lambdas** — for most cases (shorter, idiomatic).",
        ],
      },
      {
        t: "note",
        text: "A lambda ({ x -> ... }) is concise (inferred return type; return is non-local). An anonymous function (fun(x): Int { return ... }) allows an explicit return type and normal LOCAL return. Use anonymous functions when you need an explicit return type or local returns; prefer lambdas otherwise.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do labels work for returning from or continuing a lambda?",
    a: [
      {
        t: "p",
        text: "Labels let you control *where* a `return`/`break`/`continue` targets. `return@forEach` returns from just the lambda (like `continue` for the loop), while a bare `return` in an inline lambda returns from the enclosing function. You can also define custom labels (`loop@ for ... break@loop`) for nested loops.",
      },
      {
        t: "code",
        title: "Labeled returns",
        code: `list.forEach {
    if (it == 0) return@forEach     // skip this element (like continue)
    process(it)
}
outer@ for (i in rows) {
    for (j in cols) { if (done) break@outer }   // break the outer loop
}`,
      },
      {
        t: "list",
        items: [
          "**`return@lambda`** — local return from the lambda (continue-like).",
          "**Bare `return`** — non-local (exits the enclosing function) in inline lambdas.",
          "**Custom labels** — `label@` on loops; `break@label`/`continue@label`.",
          "**Implicit label** — the function name (`return@forEach`).",
        ],
      },
      {
        t: "note",
        text: "Labels target control flow: return@forEach does a LOCAL return from the lambda (continue-like), while a bare return in an inline lambda is non-local (exits the enclosing function). Custom labels (outer@ for ... break@outer) control nested loops. The implicit lambda label is the function name.",
      },
    ],
  },
];

export default qa;
