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
];

export default qa;
