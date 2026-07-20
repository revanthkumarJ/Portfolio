// Generics & Variance — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What are generics and why are they useful?",
    a: [
      {
        t: "p",
        text: "**The concept**: generics let you write code that works with any type while keeping type safety. Instead of a container that holds `Any` (forcing casts and risking `ClassCastException`), you write `Box<T>` where `T` is a type parameter chosen at the use site — `Box<String>` holds strings, `Box<Int>` holds ints, and the compiler enforces the type throughout.",
      },
      {
        t: "code",
        title: "Generic class and function",
        code: `class Box<T>(val value: T) { fun get(): T = value }
val b = Box("hi")            // Box<String>, get() returns String — no cast

fun <T> firstOrNull(list: List<T>): T? =
    if (list.isEmpty()) null else list[0]`,
      },
      {
        t: "p",
        text: "The benefits: **type safety** (the compiler knows `box.get()` is a `String`, no cast needed), **reusability** (one `Box` class works for every type), and **clearer APIs** (a `List<User>` documents exactly what it holds). You can also constrain a type parameter with an upper bound — `fun <T : Comparable<T>> max(a: T, b: T)` requires `T` to be comparable so you can use `>` inside. The standard library is built on generics: `List<T>`, `Map<K,V>`, `Result<T>` all use them.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is type erasure?",
    a: [
      {
        t: "p",
        text: "**The concept**: on the JVM, a generic type argument exists only at *compile time* — the compiler uses it to check your code, then *erases* it. At runtime, `List<String>` and `List<Int>` are both just `List`; the JVM has no idea what element type it holds. Kotlin inherits this from Java's generics.",
      },
      {
        t: "list",
        items: [
          "**You can't check a generic type at runtime**: `if (x is List<String>)` is a compile error because there's no `String` info at runtime. You can only check the raw type: `if (x is List<*>)`.",
          "**You can't overload on generic type alone**: `fun f(x: List<String>)` and `fun f(x: List<Int>)` have the *same* signature after erasure, so they clash.",
          "**You can't directly instantiate a generic type**: `Array<T>(n)` doesn't work without more info, because `T` isn't known at runtime.",
        ],
      },
      {
        t: "p",
        text: "The escape hatch is `reified` type parameters on `inline` functions: because an inline function's body (including its type argument) is pasted into each call site, the concrete type *is* available at runtime there. That's why `inline fun <reified T> fromJson(json: String): T` can do `T::class` while a non-inline version can't. So type erasure is the default limitation, and `reified` is how you work around it when you genuinely need the type at runtime.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does the 'reified' keyword do?",
    a: [
      {
        t: "p",
        text: "**The concept**: normally a generic type parameter is erased at runtime, so you can't reference it (`T::class` doesn't compile, `x is T` doesn't work). Marking an `inline` function's type parameter `reified` keeps the type available at runtime. It works *because* the function is inlined — the compiler pastes the function body into each call site with the actual type substituted in, so at that pasted location the concrete type is known.",
      },
      {
        t: "code",
        title: "reified makes the type usable at runtime",
        code: `inline fun <reified T> Gson.fromJson(json: String): T =
    fromJson(json, T::class.java)     // T::class works because reified

val user: User = gson.fromJson(jsonString)   // no need to pass User::class

// Also enables runtime type checks:
inline fun <reified T> List<*>.filterByType(): List<T> =
    filterIsInstance<T>()`,
      },
      {
        t: "p",
        text: "The practical wins: you avoid passing `Class` objects around (`fromJson(json)` instead of `fromJson(json, User::class.java)`), you can do `x is T` and `T::class` inside the function, and it makes generic APIs much cleaner (Android's `viewModels<T>()`, `intent.getParcelableExtra` wrappers, DI's `get<T>()` all use it). The constraint: `reified` *requires* `inline`, so it only works on inline functions — and like all inlining, it duplicates code, so keep those functions small.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain variance, and why generics are invariant by default.",
    a: [
      {
        t: "p",
        text: "**Variance answers a subtyping question**: given that `Dog` is a subtype of `Animal`, what's the relationship between `Container<Dog>` and `Container<Animal>`? By default in Kotlin, generics are **invariant** — `Container<Dog>` and `Container<Animal>` are *unrelated* types, despite `Dog` and `Animal` being related. You can't assign one to the other.",
      },
      {
        t: "p",
        text: "**Why invariance is the safe default** — because covariance-by-default would break type safety for mutable containers:",
      },
      {
        t: "code",
        title: "Why MutableList can't be covariant",
        code: `val dogs: MutableList<Dog> = mutableListOf(Dog())
// IF this were allowed (it's not — compile error):
val animals: MutableList<Animal> = dogs
animals.add(Cat())          // Cat added to a list that's really List<Dog>!
val d: Dog = dogs[0]         // ClassCastException waiting to happen`,
      },
      {
        t: "list",
        items: [
          "If `MutableList<Dog>` were a subtype of `MutableList<Animal>`, you could view a dog-list as an animal-list and `add(Cat())` to it — corrupting the dog-list with a cat. The next read of a `Dog` would blow up. So Kotlin makes `MutableList` invariant, making that assignment a compile error.",
          "**The insight**: whether covariance is safe depends on whether the container *produces* or *consumes* the type. A container that only *produces* T (like read-only `List`, which you only read from) *can* safely be covariant. A container that *consumes* T (via `add`) cannot. Invariance is the default because it's safe for *both* cases; you opt into covariance (`out`) or contravariance (`in`) when you know the usage is one-directional.",
        ],
      },
      {
        t: "p",
        text: "This is exactly why `List<Dog>` *is* assignable to `List<Animal>` (List is declared covariant, `List<out E>`, because it only produces) while `MutableList<Dog>` is *not* assignable to `MutableList<Animal>` (invariant, because it consumes). Understanding that variance safety hinges on produce-vs-consume is the heart of the topic.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain the 'out' and 'in' variance modifiers with the producer/consumer rule.",
    a: [
      {
        t: "p",
        text: "**`out` and `in` relax invariance safely, based on whether the type parameter is produced or consumed.** The guiding rule is 'producer `out`, consumer `in`' (Kotlin's version of Java's PECS — Producer Extends, Consumer Super).",
      },
      {
        t: "list",
        items: [
          "**`out T` — covariance, for producers**: mark a type parameter `out` when the class only ever *produces* (returns/outputs) `T`, never consumes it as a parameter. Then `Producer<Dog>` becomes a subtype of `Producer<Animal>` — subtyping goes the *same* direction. It's safe because if it only outputs Dogs, treating those outputs as Animals is fine (a Dog is an Animal). The compiler enforces that `T` appears only in *output* positions (return types).",
          "**`in T` — contravariance, for consumers**: mark a type parameter `in` when the class only ever *consumes* (takes as input) `T`, never produces it. Then `Consumer<Animal>` becomes a subtype of `Consumer<Dog>` — subtyping *reverses*. It's safe because something that can consume any Animal can certainly consume a Dog. The compiler enforces that `T` appears only in *input* positions (parameters).",
        ],
      },
      {
        t: "code",
        title: "Both in action",
        code: `interface Producer<out T> { fun next(): T }        // out -> covariant
val animalProducer: Producer<Animal> = dogProducer  // Producer<Dog> works

interface Consumer<in T> { fun accept(item: T) }   // in -> contravariant
val dogConsumer: Consumer<Dog> = animalConsumer     // Consumer<Animal> works

// Real examples: List<out E> (covariant), Comparator<in T> (contravariant)`,
      },
      {
        t: "list",
        items: [
          "**Mnemonic**: `out` = output = produce = covariant = upcast the generic (`List<Dog>` is a `List<Animal>`). `in` = input = consume = contravariant = reverse (`Comparator<Animal>` is a `Comparator<Dog>`).",
          "**Kotlin's edge — declaration-site variance**: you write `out`/`in` *once* at the class declaration (`interface List<out E>`), and every use is variant automatically. Java can only do use-site variance (wildcards `? extends`/`? super` at each call). Kotlin supports use-site variance too (type projections like `Array<out Any>`), for cases like the inherently-invariant `Array`.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "What is star projection (<*>) and when do you use it?",
    a: [
      {
        t: "p",
        text: "**The concept**: `<*>` (star projection) is how you say 'a generic type with *some* type argument, but I don't know or care which'. `List<*>` means 'a List of something' — you know it's a List, but not its element type. It's a safe way to work with a generic type when the specific type parameter is unknown or irrelevant.",
      },
      {
        t: "code",
        title: "Star projection",
        code: `fun printSize(list: List<*>) {          // any List, element type unknown
    println(list.size)                   // OK — size doesn't depend on T
    val item: Any? = list[0]             // reads come back as Any? (the upper bound)
    // list.add(...)                     // NOT allowed for MutableList<*> — can't
                                         // safely add when the real type is unknown
}`,
      },
      {
        t: "list",
        items: [
          "**What you can do with `<*>`**: read elements as the *upper bound* of the type parameter — for `List<*>` that's `Any?`, since any element is at least `Any?`. And use members that don't involve the type parameter (`size`, `isEmpty`).",
          "**What you can't do**: *write* a value of the projected type into a consumer position, because the real type is unknown — adding to a `MutableList<*>` is disallowed (you might add the wrong type). The compiler treats the 'in' positions as unusable.",
          "**How it relates to variance**: `<*>` is essentially projecting the type as `out (upperBound)` for reading and `in Nothing` for writing — 'I can get an `Any?` out, but I can't put anything in'. It's the Kotlin equivalent of Java's unbounded wildcard `<?>`.",
          "**When to use it**: when you have a generic type but genuinely don't need its type argument — logging/inspecting a collection generically, storing heterogeneous generic instances (`List<Box<*>>`), or writing a function that only uses type-independent members. If you *do* need the type, use a generic function with a real type parameter instead.",
        ],
      },
      {
        t: "p",
        text: "**The distinction to make**: `<*>` (star projection) is 'unknown specific type' — safe, read-as-upper-bound. `<Any?>` is 'explicitly the Any? type'. And `<T>` (a real type parameter on a generic function) is 'I don't know it *here* but I want to *capture and use* it' — which is what you'd choose when you need to actually work with the element type rather than just inspect the container. Star projection is specifically for 'I don't care what T is'.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you write a generic function and a generic class?",
    a: [
      {
        t: "p",
        text: "You declare type parameters in angle brackets. For a function, they go before the function name — `fun <T> singletonList(item: T): List<T>`. For a class, after the class name — `class Box<T>(val value: T)`. The type parameter (`T`) then stands in for a concrete type the caller provides (or that's inferred).",
      },
      {
        t: "code",
        title: "Generic function and class",
        code: `fun <T> firstOrNull(list: List<T>): T? = if (list.isEmpty()) null else list[0]
class Box<T>(val value: T) { fun get(): T = value }

val b = Box("hi")          // T inferred as String
val n = firstOrNull(listOf(1, 2))   // T inferred as Int`,
      },
      {
        t: "list",
        items: [
          "**Function** — `fun <T> name(...)`; type params before the name.",
          "**Class** — `class Name<T>(...)`; type params after the name.",
          "**Inference** — the compiler infers `T` from arguments where possible.",
          "**Multiple params** — `<K, V>` for maps, etc.",
        ],
      },
      {
        t: "note",
        text: "Declare type parameters in angle brackets: functions put them before the name (fun <T> f(...)), classes after (class Box<T>). T stands for a concrete type the caller provides or the compiler infers from arguments. Multiple params: <K, V>.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a generic constraint (upper bound)?",
    a: [
      {
        t: "p",
        text: "A constraint restricts what types a type parameter can be. `<T : Number>` means `T` must be `Number` or a subtype, so you can call `Number`'s methods on `T`. The default upper bound is `Any?` (any type, nullable). For multiple bounds, use a `where` clause.",
      },
      {
        t: "code",
        title: "Upper bounds",
        code: `fun <T : Comparable<T>> max(a: T, b: T): T = if (a > b) a else b   // T is Comparable
fun <T> f(x: T) where T : CharSequence, T : Appendable { }         // multiple bounds`,
      },
      {
        t: "list",
        items: [
          "**`<T : Bound>`** — `T` must be `Bound` or a subtype; enables calling `Bound`'s members.",
          "**Default** — `Any?` (any nullable type) when no bound is given.",
          "**Non-null bound** — `<T : Any>` forces non-nullable `T`.",
          "**`where`** — multiple constraints on the same parameter.",
        ],
      },
      {
        t: "note",
        text: "A constraint (upper bound) restricts a type parameter: <T : Number> means T is Number or a subtype (so you can use Number's members). Default bound is Any? (any nullable). <T : Any> forces non-null. Use a where clause for multiple bounds: where T : A, T : B.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why are generics invariant by default, and what problem does that prevent?",
    a: [
      {
        t: "p",
        text: "Generics are *invariant*: `List<String>` is *not* a subtype of `List<Any>` even though `String` is a subtype of `Any`. This prevents type-safety holes — if `MutableList<String>` were a `MutableList<Any>`, you could add a non-`String` to it, corrupting the list. Variance (`out`/`in`) lets you safely relax this where it's provably safe.",
      },
      {
        t: "code",
        title: "Why invariance is needed",
        code: `val strings: MutableList<String> = mutableListOf("a")
// val objs: MutableList<Any> = strings   // if allowed...
// objs.add(42)                            // ...you'd corrupt the String list
// val bad: String = strings[1]           // ClassCastException`,
      },
      {
        t: "list",
        items: [
          "**Invariant** — `List<String>` isn't a `List<Any>` by default.",
          "**Prevents corruption** — you can't sneak a wrong type into a container.",
          "**Type safety** — the compiler rejects unsafe subtyping.",
          "**Relax with variance** — `out`/`in` when the usage is safe (produce-only / consume-only).",
        ],
      },
      {
        t: "note",
        text: "Generics are invariant (List<String> isn't a List<Any>) to prevent type-safety holes — if it were, you could add a non-String into a String list and get a ClassCastException on read. Variance modifiers (out/in) safely relax this for produce-only/consume-only usage.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is declaration-site vs use-site variance?",
    a: [
      {
        t: "p",
        text: "*Declaration-site* variance puts `out`/`in` on the type parameter *where the class is declared* (`interface Producer<out T>`), so *all* uses are covariant/contravariant — cleaner and the Kotlin-preferred approach. *Use-site* variance (type projection) applies variance at a specific *usage* (`Array<out Any>`), useful when a class is invariant but a particular function only produces or only consumes.",
      },
      {
        t: "code",
        title: "Declaration-site vs use-site",
        code: `interface Source<out T> { fun next(): T }        // declaration-site: always covariant

fun copy(from: Array<out Any>, to: Array<Any>) { } // use-site: 'from' is covariant here`,
      },
      {
        t: "list",
        items: [
          "**Declaration-site** — `out`/`in` on the class's type param; applies everywhere. Kotlin-preferred.",
          "**Use-site (projection)** — `Array<out T>` at a specific usage; for invariant classes used one-directionally.",
          "**Java wildcards** — `? extends`/`? super` are use-site variance; Kotlin has both.",
          "**Prefer declaration-site** — when the class is inherently producer/consumer.",
        ],
      },
      {
        t: "note",
        text: "Declaration-site variance: out/in on the class's type parameter (interface Source<out T>) — applies to all uses, Kotlin-preferred. Use-site variance (projection): out/in at a specific usage (Array<out Any>) for an invariant class used one-directionally. Java's ? extends/? super are use-site.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is variance in function types?",
    a: [
      {
        t: "p",
        text: "Function types are naturally *contravariant in parameters* and *covariant in return types*. That is, `(Animal) -> Dog` is a subtype of `(Dog) -> Animal` — you can substitute a function that accepts a *broader* parameter and returns a *narrower* result. Kotlin models this because `Function1<in P, out R>` declares `in` on the parameter and `out` on the result.",
      },
      {
        t: "code",
        title: "Function subtyping",
        code: `val broad: (Animal) -> Dog = { Dog() }
val narrow: (Dog) -> Animal = broad     // OK — accepts fewer, returns more specific
// Function1<in P, out R>: contravariant param, covariant return`,
      },
      {
        t: "list",
        items: [
          "**Parameters** — contravariant (`in`): accept a broader (super) type.",
          "**Return** — covariant (`out`): return a narrower (sub) type.",
          "**`Function1<in P, out R>`** — the declaration encoding this.",
          "**Practical** — a more general function can stand in for a more specific one.",
        ],
      },
      {
        t: "note",
        text: "Function types are contravariant in parameters (in) and covariant in returns (out): (Animal)->Dog is a subtype of (Dog)->Animal. FunctionN<in P, out R> encodes this — a function accepting a broader param and returning a narrower result can substitute a more specific one.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between a type parameter and a type argument?",
    a: [
      {
        t: "p",
        text: "A *type parameter* is the placeholder declared with the generic (`T` in `class Box<T>` or `fun <T> f()`). A *type argument* is the concrete type supplied when you *use* it (`String` in `Box<String>`). Parameter = the declaration side; argument = the call/usage side. It's the generic equivalent of parameter vs argument for values.",
      },
      {
        t: "code",
        title: "Parameter vs argument",
        code: `class Box<T>(val value: T)     // T is a type PARAMETER (declaration)
val b = Box<String>("hi")      // String is a type ARGUMENT (usage)
fun <T> id(x: T): T = x        // T is a parameter
id<Int>(5)                     // Int is the argument (often inferred)`,
      },
      {
        t: "list",
        items: [
          "**Type parameter** — the placeholder in the declaration (`<T>`).",
          "**Type argument** — the concrete type at the use site (`Box<String>`).",
          "**Analogy** — like function parameter (declaration) vs argument (call).",
          "**Inference** — arguments are often inferred, not written.",
        ],
      },
      {
        t: "note",
        text: "A type parameter is the placeholder in the declaration (T in class Box<T>); a type argument is the concrete type supplied at usage (String in Box<String>). Declaration side vs usage side — like function parameter vs argument. Arguments are often inferred.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you constrain a type parameter to be non-nullable?",
    a: [
      {
        t: "p",
        text: "The default upper bound is `Any?`, which *includes* nullable types — so a generic `T` could be `String?`. To forbid nullable arguments, bound it with `Any`: `<T : Any>`. Then `T` is guaranteed non-nullable, and you can't pass a nullable type or return null as `T`.",
      },
      {
        t: "code",
        title: "Non-null bound",
        code: `fun <T> f(x: T) { }            // T can be String? (default Any?)
fun <T : Any> g(x: T) { }      // T must be non-null; g<String?>() is an error
fun <T : Any> firstNonNull(list: List<T?>): T? = list.firstOrNull { it != null }`,
      },
      {
        t: "list",
        items: [
          "**Default `Any?`** — allows nullable type arguments.",
          "**`<T : Any>`** — forces non-nullable `T`.",
          "**Use** — APIs that must not accept/return null for the generic type.",
          "**`T & Any`** — definitely-non-nullable type for finer control in generic overrides.",
        ],
      },
      {
        t: "note",
        text: "The default upper bound Any? allows nullable type arguments (T could be String?). Bound with <T : Any> to force a non-nullable T (T=String? becomes an error). Use for APIs that must not accept/return null; T & Any is the definitely-non-nullable form for generic overrides.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are common generics pitfalls caused by type erasure?",
    a: [
      {
        t: "p",
        text: "Erasure removes type arguments at runtime, causing several classic pitfalls: you can't overload two functions that differ only by generic type (`fun f(x: List<String>)` and `fun f(x: List<Int>)` clash — same erased signature); `is T` / `is List<String>` don't work (only `is List<*>`); and you can't create `Array<T>` directly. Solutions include `reified` inline functions and passing `Class<T>`.",
      },
      {
        t: "list",
        items: [
          "**Overload clash** — functions differing only by generic type have the same JVM signature (`@JvmName` can help, or restructure).",
          "**`is` checks** — can't check the type argument; only `is List<*>`; use `reified` for `is T`.",
          "**Generic arrays** — no `Array<T>(n)`; use `reified` or `List<T>`.",
          "**Runtime type** — pass `Class<T>`/`KClass<T>` when you need the type at runtime without `reified`.",
        ],
      },
      {
        t: "note",
        text: "Erasure pitfalls: can't overload functions differing only by generic type (same erased signature — use @JvmName/restructure); can't do is List<String> (only is List<*> — use reified for is T); can't create Array<T> (use reified or List<T>). Pass Class<T>/KClass<T> for runtime type info without reified.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why can't you create an array of a generic type (Array<T>)?",
    a: [
      {
        t: "p",
        text: "Because of type erasure, the runtime doesn't know `T`, and arrays are *reified* on the JVM (they carry their component type at runtime) — so `Array<T>(n)` can't be created directly. Workarounds: use a `reified` type parameter (`inline fun <reified T> makeArray()`), pass a factory/`Class<T>`, or use collections (`List<T>`) which don't have this problem.",
      },
      {
        t: "code",
        title: "Generic array workarounds",
        code: `// fun <T> make(n: Int): Array<T> = Array(n) { ... }   // error
inline fun <reified T> make(n: Int, init: (Int) -> T): Array<T> = Array(n, init)   // OK

// Or just use a List:
fun <T> makeList(n: Int, init: (Int) -> T): List<T> = List(n, init)`,
      },
      {
        t: "list",
        items: [
          "**Arrays are reified** — they need the component type at runtime, which erasure removes.",
          "**`reified` inline** — lets you create `Array<T>` (type known at call site).",
          "**Pass `Class<T>`** — an alternative for reflection-based creation.",
          "**Prefer `List<T>`** — collections avoid the reified-array problem.",
        ],
      },
      {
        t: "note",
        text: "Arrays are reified on the JVM (carry component type at runtime) but generics are erased, so Array<T>(n) can't be created directly. Fixes: inline fun <reified T> (type known at call site), pass a Class<T>, or use List<T> (collections don't have this problem).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between out T and in T in practice?",
    a: [
      {
        t: "p",
        text: "`out T` (covariant) makes `Container<Sub>` a subtype of `Container<Super>` — the container only *outputs* T (like a read-only `List<out E>`). `in T` (contravariant) makes `Container<Super>` a subtype of `Container<Sub>` — the container only *inputs* T (like a `Comparator<in T>`). They point subtyping in opposite directions based on producing vs consuming.",
      },
      {
        t: "code",
        title: "out vs in subtyping",
        code: `val producers: List<out Animal> = listOf<Dog>()      // out: List<Dog> is a List<out Animal>
val comparator: Comparator<Dog> = Comparator<Animal> { a, b -> ... }  // in: Comparator<Animal> works for Dog`,
      },
      {
        t: "list",
        items: [
          "**`out T`** — covariant; `C<Sub>` ⊆ `C<Super>`; producer/output only.",
          "**`in T`** — contravariant; `C<Super>` ⊆ `C<Sub>`; consumer/input only.",
          "**`List<out E>`** — read-only, covariant (Kotlin's `List` is `out`).",
          "**`Comparator<in T>`** — consumes T, contravariant.",
        ],
      },
      {
        t: "note",
        text: "out T (covariant): C<Sub> is a subtype of C<Super> — output-only (Kotlin's List<out E>). in T (contravariant): C<Super> is a subtype of C<Sub> — input-only (Comparator<in T>). They point subtyping opposite ways based on producing (out) vs consuming (in).",
      },
    ],
  },
  {
    level: "junior",
    q: "How does the compiler infer generic types, and when must you specify them?",
    a: [
      {
        t: "p",
        text: "The compiler infers type arguments from the actual arguments and expected return type — `listOf(1, 2)` infers `List<Int>`, `emptyList<String>()` needs the explicit type because there's nothing to infer from. Specify explicitly when there are no arguments to infer from, when inference would pick a too-broad/narrow type, or to disambiguate.",
      },
      {
        t: "code",
        title: "Inference vs explicit",
        code: `val a = listOf(1, 2)              // inferred List<Int>
val b = emptyList<String>()      // explicit — nothing to infer
val c = mutableListOf<User>()    // explicit element type for an empty list
val d: Box<Number> = Box(1)      // explicit to widen (else Box<Int>)`,
      },
      {
        t: "list",
        items: [
          "**Inferred** — from arguments/return context.",
          "**Explicit needed** — no arguments (empty collections, `emptyList<T>()`).",
          "**Widen/narrow** — annotate to get a broader/narrower type than inferred.",
          "**Disambiguate** — when inference is ambiguous.",
        ],
      },
      {
        t: "note",
        text: "The compiler infers type arguments from arguments and expected return type (listOf(1,2) → List<Int>). Specify explicitly when there's nothing to infer from (emptyList<String>(), empty mutable collections), to widen/narrow the inferred type, or to disambiguate.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a recursive generic bound (like Comparable<T>)?",
    a: [
      {
        t: "p",
        text: "A recursive (F-bounded) generic bound references the type parameter itself — `<T : Comparable<T>>` means 'T is comparable to itself'. This is common for self-referential contracts like ordering, builders, or the Curiously Recurring Template Pattern, where a type's operations should return/accept its own type.",
      },
      {
        t: "code",
        title: "Recursive bound",
        code: `fun <T : Comparable<T>> maxOf(a: T, b: T): T = if (a >= b) a else b
// T must implement Comparable<T> — comparable to its own type
maxOf("a", "b")     // String : Comparable<String>
maxOf(1, 2)         // Int : Comparable<Int>`,
      },
      {
        t: "list",
        items: [
          "**`<T : Comparable<T>>`** — T is bounded by a type parameterized on T itself.",
          "**Self-referential contracts** — ordering, fluent builders returning `T`.",
          "**Type safety** — ensures operations stay within the same type.",
          "**Common** — sorting helpers, `max`/`min`/`coerceIn`.",
        ],
      },
      {
        t: "note",
        text: "A recursive (F-bounded) generic bound references the parameter itself: <T : Comparable<T>> ('T comparable to its own type'). Used for self-referential contracts — ordering (max/min), fluent builders returning T. Ensures operations stay within the same type.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do Kotlin's variance modifiers map to Java wildcards?",
    a: [
      {
        t: "p",
        text: "Kotlin's declaration-site `out T` corresponds to Java's `? extends T` (covariant), and `in T` to `? super T` (contravariant). Kotlin's use-site projections `Foo<out T>`/`Foo<in T>` map directly to Java wildcards. When Kotlin code is called from Java, `out`/`in` generate the appropriate `extends`/`super` wildcards.",
      },
      {
        t: "table",
        headers: ["Kotlin", "Java"],
        rows: [
          ["`out T` / `Foo<out T>`", "`? extends T`"],
          ["`in T` / `Foo<in T>`", "`? super T`"],
          ["`Foo<*>`", "`Foo<?>`"],
          ["invariant `Foo<T>`", "`Foo<T>`"],
        ],
      },
      {
        t: "list",
        items: [
          "**`out` ↔ `? extends`** — covariant/producer.",
          "**`in` ↔ `? super`** — contravariant/consumer.",
          "**`<*>` ↔ `<?>`** — unknown type.",
          "**Interop** — Kotlin variance generates Java wildcards for Java callers.",
        ],
      },
      {
        t: "note",
        text: "Kotlin out T ↔ Java ? extends T (covariant); in T ↔ ? super T (contravariant); <*> ↔ <?>. Kotlin's declaration-site variance generates the right Java wildcards for Java callers. Same PECS concept, different syntax (Kotlin prefers declaration-site).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a generic extension function?",
    a: [
      {
        t: "p",
        text: "A generic extension function adds a method to a generic type, with its own type parameters — `fun <T> List<T>.second(): T = this[1]`. Many standard-library functions (`map`, `filter`, `firstOrNull`) are exactly this: generic extensions on `Iterable<T>`/`List<T>`. They let you write reusable, type-safe utilities on generic receivers.",
      },
      {
        t: "code",
        title: "Generic extension",
        code: `fun <T> List<T>.secondOrNull(): T? = getOrNull(1)
fun <T : Comparable<T>> List<T>.isSorted(): Boolean =
    zipWithNext().all { (a, b) -> a <= b }
listOf(1, 2, 3).isSorted()   // true`,
      },
      {
        t: "list",
        items: [
          "**`fun <T> Receiver<T>.ext()`** — extension with type parameters.",
          "**Reusable utilities** — type-safe helpers on generic types.",
          "**Constraints** — add bounds (`<T : Comparable<T>>`) for typed operations.",
          "**Std lib** — most collection operators are generic extensions.",
        ],
      },
      {
        t: "note",
        text: "A generic extension function adds a type-safe method to a generic type (fun <T> List<T>.secondOrNull(): T?). It's how the standard library's map/filter/firstOrNull are built (generic extensions on Iterable<T>). Add bounds for typed operations (<T : Comparable<T>>).",
      },
    ],
  },
  {
    level: "senior",
    q: "Why can't out and in types appear in the wrong position, and what does the compiler enforce?",
    a: [
      {
        t: "p",
        text: "Variance modifiers come with position rules the compiler enforces. An `out T` parameter can only appear in *output* positions (return types) — not as a function *parameter* (input), because that would let you pass a wrong type in and break covariance. An `in T` can only appear in *input* positions. This guarantees the variance is actually safe.",
      },
      {
        t: "code",
        title: "Position enforcement",
        code: `interface Producer<out T> {
    fun get(): T           // OK — output position
    // fun set(item: T)    // ERROR — T in input position with 'out'
}
interface Consumer<in T> {
    fun consume(item: T)   // OK — input position
    // fun produce(): T    // ERROR — T in output position with 'in'
}`,
      },
      {
        t: "list",
        items: [
          "**`out T`** — output positions only (returns); not as a parameter.",
          "**`in T`** — input positions only (parameters); not as a return type.",
          "**Enforced** — the compiler rejects wrong-position usage.",
          "**Why** — guarantees the covariance/contravariance is type-safe.",
        ],
      },
      {
        t: "note",
        text: "The compiler enforces variance positions: out T only in output positions (return types, not parameters — else you'd break covariance); in T only in input positions (parameters, not returns). This guarantees the declared variance is actually type-safe. @UnsafeVariance can override it (rarely, deliberately).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a generic type alias, and when is it useful?",
    a: [
      {
        t: "p",
        text: "A `typealias` gives an existing (often generic or complex) type a shorter, meaningful name — `typealias UserCache = Map<String, User>` or `typealias Handler<T> = (T) -> Unit`. It doesn't create a new type (it's the same type), but improves readability for verbose generic/function types.",
      },
      {
        t: "code",
        title: "typealias",
        code: `typealias UserMap = Map<String, User>
typealias ClickHandler = (View) -> Unit
typealias Result<T> = Either<Error, T>

fun process(handler: ClickHandler) { }   // clearer than (View) -> Unit`,
      },
      {
        t: "list",
        items: [
          "**`typealias`** — an alias for an existing type; not a new type.",
          "**Readability** — name verbose generic/function types.",
          "**Generic aliases** — `typealias Handler<T> = (T) -> Unit`.",
          "**No new type** — fully interchangeable with the underlying type.",
        ],
      },
      {
        t: "note",
        text: "typealias gives an existing (often verbose generic/function) type a readable name — typealias ClickHandler = (View) -> Unit. It's NOT a new type (fully interchangeable with the original), just an alias for clarity. Can be generic: typealias Handler<T> = (T) -> Unit.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do generic constraints enable calling methods on a type parameter?",
    a: [
      {
        t: "p",
        text: "Without a bound, a type parameter `T` is `Any?`, so you can only call `Any`'s methods (`toString`, `equals`). Adding a constraint (`<T : Number>`, `<T : Comparable<T>>`) tells the compiler `T` has that type's members, so you can call them. Constraints thus *unlock* the operations you need inside a generic function.",
      },
      {
        t: "code",
        title: "Constraint unlocks methods",
        code: `fun <T> sumAll(items: List<T>): Double =
    items.sumOf { (it as Number).toDouble() }   // needs a cast — no bound

fun <T : Number> sumAll2(items: List<T>): Double =
    items.sumOf { it.toDouble() }               // toDouble() available — T is Number`,
      },
      {
        t: "list",
        items: [
          "**No bound** — `T` is `Any?`; only `Any`'s members.",
          "**Bounded** — `<T : X>` lets you call `X`'s members on `T`.",
          "**Avoids casts** — the constraint proves the operations are valid.",
          "**Multiple bounds** — `where` for combining capabilities.",
        ],
      },
      {
        t: "note",
        text: "Without a bound, T is Any? (only Any's members). A constraint (<T : Number>) tells the compiler T has that type's members, so you can call them (it.toDouble()) without casts. Constraints unlock the operations you need inside a generic function; use where for multiple.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between List<Any> and List<*>?",
    a: [
      {
        t: "p",
        text: "`List<Any>` is a list whose elements are declared to be `Any` — you know the type is `Any`. `List<*>` is a list of an *unknown but specific* type (could be `List<String>`, `List<Int>`, etc.) — you don't know which. You can pass a `List<String>` where `List<*>` is expected (unknown type), but *not* where `List<Any>` is expected unless it's covariant.",
      },
      {
        t: "list",
        items: [
          "**`List<Any>`** — elements known to be `Any`; accepts any element (since `List` is `out`, also accepts `List<String>`).",
          "**`List<*>`** — unknown element type; read as `Any?`, can't write.",
          "**Accepting any list** — `List<*>` is the way to accept 'some list of unknown type'.",
          "**Kotlin `List` is covariant** — so `List<String>` *is* a `List<Any>` too (unlike `MutableList`).",
        ],
      },
      {
        t: "note",
        text: "List<Any> = elements known to be Any. List<*> = unknown but specific element type (read as Any?, can't write). Use List<*> to accept 'any list'. Note Kotlin's List is covariant (out E), so List<String> IS a List<Any> — but MutableList (invariant) is not.",
      },
    ],
  },
  {
    level: "senior",
    q: "When would you use @UnsafeVariance or @JvmSuppressWildcards?",
    a: [
      {
        t: "p",
        text: "`@UnsafeVariance` lets you deliberately use a type parameter in a position variance rules forbid, when *you* guarantee it's safe (rare, e.g. `Comparable`'s definition uses it internally). `@JvmSuppressWildcards`/`@JvmWildcard` control the Java wildcard generation for Kotlin variance at the interop boundary — useful when Java callers need a specific wildcard form.",
      },
      {
        t: "list",
        items: [
          "**`@UnsafeVariance`** — override a variance position rule when you're sure it's safe; rare, deliberate.",
          "**`@JvmSuppressWildcards`** — stop Kotlin from generating `? extends`/`? super` for Java callers.",
          "**`@JvmWildcard`** — force wildcard generation at a specific spot.",
          "**Interop-focused** — mostly for library APIs consumed from Java.",
        ],
      },
      {
        t: "note",
        text: "@UnsafeVariance deliberately uses a type param in a variance-forbidden position when you guarantee safety (rare — e.g. Comparable's internals). @JvmSuppressWildcards/@JvmWildcard control Java wildcard generation for Kotlin variance at the interop boundary (for Java callers needing a specific form). Library/interop concerns.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a generic interface, and how do you implement it?",
    a: [
      {
        t: "p",
        text: "A generic interface declares type parameters used by its methods — `interface Repository<T> { suspend fun get(id: String): T }`. Implementers either fix the type argument (`class UserRepo : Repository<User>`) or remain generic (`class MemoryRepo<T> : Repository<T>`). This is how you write reusable abstractions (repositories, mappers, data sources) parameterized by the entity type.",
      },
      {
        t: "code",
        title: "Generic interface",
        code: `interface Repository<T> {
    suspend fun get(id: String): T?
    suspend fun save(item: T)
}
class UserRepository : Repository<User> {          // fixes T = User
    override suspend fun get(id: String): User? = ...
    override suspend fun save(item: User) { }
}`,
      },
      {
        t: "list",
        items: [
          "**`interface Foo<T>`** — type parameters used across its members.",
          "**Fix the type** — `class Bar : Foo<Concrete>`.",
          "**Stay generic** — `class Baz<T> : Foo<T>`.",
          "**Uses** — repositories, mappers, `Comparable<T>`, data sources.",
        ],
      },
      {
        t: "note",
        text: "A generic interface parameterizes its methods (interface Repository<T> { get(): T }). Implementers fix the type (class UserRepo : Repository<User>) or stay generic (class MemoryRepo<T> : Repository<T>). It's how you build reusable abstractions (repositories, mappers) parameterized by the entity type.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you use Class<T> or KClass<T> when reified isn't available?",
    a: [
      {
        t: "p",
        text: "When you need the runtime type but can't use `reified` (e.g. a non-inline function, or storing it), pass the type explicitly as `Class<T>` (Java) or `KClass<T>` (Kotlin reflection). Libraries like Gson (`fromJson(json, User::class.java)`) and older DI frameworks use this. You can then call `clazz.newInstance()`, `clazz.isInstance(x)`, etc.",
      },
      {
        t: "code",
        title: "Passing the type token",
        code: `fun <T> parse(json: String, clazz: Class<T>): T = gson.fromJson(json, clazz)
parse(json, User::class.java)

fun <T : Any> create(kClass: KClass<T>): T = kClass.constructors.first().call()`,
      },
      {
        t: "list",
        items: [
          "**`Class<T>`/`KClass<T>`** — pass the type as a value (token) when `reified` can't be used.",
          "**Runtime operations** — `isInstance`, reflection, instantiation.",
          "**`reified` wrapper** — often an `inline reified` function forwards to the `Class<T>` version.",
          "**Uses** — serialization, DI, Room/Retrofit internals.",
        ],
      },
      {
        t: "note",
        text: "When reified isn't available (non-inline, or storing the type), pass Class<T> (Java) or KClass<T> (Kotlin) as a type token — enabling runtime type operations (isInstance, reflection, instantiation). Gson/DI use this (fromJson(json, User::class.java)). Often a reified inline wrapper forwards to the Class<T> version.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you build a type-safe builder or DSL with generics?",
    a: [
      {
        t: "p",
        text: "Combine generic type parameters, lambdas with receiver, and (optionally) `@DslMarker` to build fluent, type-safe DSLs. The builder holds typed state, methods return the builder or use receiver lambdas for nesting, and generics keep the result strongly typed — like `buildList<Int> { }` or a custom query builder.",
      },
      {
        t: "code",
        title: "A tiny typed DSL",
        code: `@DslMarker annotation class QueryDsl

@QueryDsl
class QueryBuilder<T> {
    private val filters = mutableListOf<(T) -> Boolean>()
    fun where(predicate: (T) -> Boolean) { filters += predicate }
    fun build(): (T) -> Boolean = { item -> filters.all { it(item) } }
}
fun <T> query(block: QueryBuilder<T>.() -> Unit) = QueryBuilder<T>().apply(block).build()

val isAdult = query<User> { where { it.age >= 18 } }`,
      },
      {
        t: "list",
        items: [
          "**Generic builder** — `QueryBuilder<T>` keeps the DSL typed to `T`.",
          "**Receiver lambda** — `block: Builder.() -> Unit` for the DSL body.",
          "**`@DslMarker`** — prevents accidentally calling outer-scope methods in nested DSLs.",
          "**Type-safe result** — generics carry the entity type through.",
        ],
      },
      {
        t: "note",
        text: "Type-safe DSLs combine generic type parameters + lambdas with receiver (block: Builder<T>.() -> Unit) + @DslMarker (blocks outer-scope calls in nested DSLs). The generic builder keeps the DSL and its result strongly typed to T — like buildList<Int> { } or a custom query builder.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you use where clauses for multiple type constraints?",
    a: [
      {
        t: "p",
        text: "When a type parameter needs *more than one* upper bound, list them in a `where` clause after the signature — `fun <T> copy(x: T) where T : CharSequence, T : Appendable`. This requires `T` to satisfy *all* the listed bounds, so you can use members from each. A single bound can go inline (`<T : Bound>`); multiple bounds need `where`.",
      },
      {
        t: "code",
        title: "Multiple bounds",
        code: `fun <T> appendAll(target: T, items: List<T>)
    where T : CharSequence, T : Appendable {
    // can use both CharSequence and Appendable members on T
}`,
      },
      {
        t: "list",
        items: [
          "**`where T : A, T : B`** — `T` must satisfy all listed bounds.",
          "**Single bound** — inline `<T : Bound>` suffices.",
          "**Access all members** — from every bound.",
          "**Multiple params** — `where` can constrain several parameters.",
        ],
      },
      {
        t: "note",
        text: "A where clause adds multiple upper bounds: fun <T> f(...) where T : CharSequence, T : Appendable — T must satisfy ALL bounds, so you can use members from each. A single bound goes inline (<T : Bound>); multiple bounds require where (which can also constrain several type parameters).",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is Kotlin's List covariant but MutableList invariant?",
    a: [
      {
        t: "p",
        text: "`List<out E>` is declared covariant because it's *read-only* — it only *produces* elements (via `get`, iteration), never accepts them, so it's safe for `List<String>` to be a `List<Any>`. `MutableList<E>` is *invariant* because it also *consumes* elements (`add`), and allowing `MutableList<String>` as `MutableList<Any>` would let you `add(42)` — corrupting the list. Read-only can be covariant; read-write can't.",
      },
      {
        t: "code",
        title: "Covariant read-only, invariant mutable",
        code: `val strs: List<String> = listOf("a")
val anys: List<Any> = strs             // OK — List is covariant (out E), read-only

val mstrs: MutableList<String> = mutableListOf("a")
// val manys: MutableList<Any> = mstrs // ERROR — would allow manys.add(42)`,
      },
      {
        t: "list",
        items: [
          "**`List<out E>`** — produces only; covariant; `List<String>` is a `List<Any>`.",
          "**`MutableList<E>`** — produces and consumes; invariant for safety.",
          "**Why** — a covariant mutable container would let you insert a wrong type.",
          "**General rule** — read-only → covariant; read-write → invariant.",
        ],
      },
      {
        t: "note",
        text: "List<out E> is covariant because it's read-only (only produces elements) — safe for List<String> to be List<Any>. MutableList is invariant because it also consumes (add) — covariance would let you add(42) to a String list. Read-only can be covariant; read-write must be invariant.",
      },
    ],
  },
];

export default qa;
