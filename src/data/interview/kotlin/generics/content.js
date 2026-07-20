// Generics & Variance — Content tab. Teaching-first.

const content = [
  {
    heading: "Generics — writing type-safe reusable code",
    blocks: [
      {
        t: "p",
        text: "**Generics** let you write code that works with *any* type while keeping full type safety. Instead of a `Box` that holds `Any` (and needs casting), a `Box<T>` holds a specific type `T` chosen at the use site — `Box<String>` holds strings, `Box<Int>` holds ints, and the compiler enforces it. The `T` is a **type parameter** — a placeholder filled in when the type is used.",
      },
      {
        t: "code",
        title: "Generic class and function",
        code: `class Box<T>(val value: T) {
    fun get(): T = value
}
val stringBox = Box("hello")     // Box<String> — T inferred as String
val intBox = Box(42)             // Box<Int>

// Generic function
fun <T> firstOrNull(list: List<T>): T? = if (list.isEmpty()) null else list[0]

// Type constraints (upper bounds): T must be Comparable
fun <T : Comparable<T>> max(a: T, b: T): T = if (a > b) a else b`,
      },
      {
        t: "list",
        items: [
          "**Type safety without casting**: `stringBox.get()` returns a `String`, not `Any` — no cast, no `ClassCastException` risk.",
          "**Type constraints (`T : Bound`)**: restrict `T` to subtypes of a bound so you can use that bound's methods — `<T : Comparable<T>>` lets you use `>`. Multiple bounds use a `where` clause.",
          "**Type inference**: you rarely write the type argument explicitly (`Box(\"hi\")` infers `Box<String>`); specify it when inference can't (`emptyList<String>()`).",
        ],
      },
    ],
  },
  {
    heading: "Type erasure — generics are compile-time only",
    blocks: [
      {
        t: "p",
        text: "On the JVM, generics use **type erasure**: the type argument exists at *compile time* for type-checking but is *erased* at runtime. At runtime, a `List<String>` and a `List<Int>` are both just `List` — the JVM doesn't know the element type. This is inherited from Java's generics and has real consequences.",
      },
      {
        t: "code",
        title: "What erasure prevents",
        code: `// CAN'T check a generic type at runtime — the type arg is erased:
if (list is List<String>) { }    // ERROR: cannot check erased type
if (list is List<*>) { }          // OK: can only check the raw type (star)

// CAN'T create an array of a generic type directly:
// val arr = Array<T>(10) { }     // ERROR without a reified type

// Two functions differing only by generic type CLASH after erasure:
fun process(list: List<String>) {}
fun process(list: List<Int>) {}   // ERROR: same signature after erasure`,
      },
      {
        t: "list",
        items: [
          "**You can't do `x is List<String>`** — at runtime there's no `String` info, only `List`. You can check `is List<*>` (the raw type) but not the type argument.",
          "**You can't overload on generic type alone** — `f(List<String>)` and `f(List<Int>)` have the same erased signature and clash.",
          "**Workaround — `reified`**: an `inline fun <reified T>` keeps the type at runtime (because the function is inlined, the concrete type is pasted in). This is why `inline fun <reified T> Gson.fromJson(json)` works and a non-inline one can't. Reified is the escape hatch from erasure.",
        ],
      },
    ],
  },
  {
    heading: "Variance — the core hard topic",
    blocks: [
      {
        t: "p",
        text: "**Variance** answers: if `Dog` is a subtype of `Animal`, is `Box<Dog>` a subtype of `Box<Animal>`? By default in Kotlin, **no** — generics are *invariant*: `Box<Dog>` and `Box<Animal>` are unrelated types, even though `Dog` and `Animal` are related. This is safe but restrictive. **Variance annotations** (`out` and `in`) let you relax it safely.",
      },
      {
        t: "code",
        title: "Why invariance is the safe default",
        code: `// If MutableList<Dog> WERE a subtype of MutableList<Animal>, this would break:
val dogs: MutableList<Dog> = mutableListOf(Dog())
val animals: MutableList<Animal> = dogs   // (hypothetically allowed)
animals.add(Cat())                         // adding a Cat to a list of Dogs!
val dog: Dog = dogs[0]                      // now a Cat is in here — corruption
// So Kotlin makes MutableList INVARIANT: the assignment above is a compile error.`,
      },
    ],
  },
  {
    heading: "out — covariance (producers)",
    blocks: [
      {
        t: "p",
        text: "**`out T`** makes a type parameter **covariant**: `Box<out Animal>` accepts `Box<Dog>`. It's allowed when the type is only ever *produced* (returned/read), never *consumed* (taken as input). Marking `out` is a promise: 'this class only outputs `T`, never accepts it as a parameter'. Because it only produces, it's safe to treat a producer of `Dog` as a producer of `Animal` (a Dog is an Animal).",
      },
      {
        t: "code",
        title: "out enables covariance",
        code: `// List<out E> is declared covariant — that's why this works:
val dogs: List<Dog> = listOf(Dog())
val animals: List<Animal> = dogs   // OK! List only PRODUCES elements (get), never adds

// Declaration-site: the class promises to only produce T
interface Producer<out T> {
    fun produce(): T          // OK — T is in output position
    // fun consume(t: T) { }  // ERROR — can't have T in input position with 'out'
}`,
      },
      {
        t: "list",
        items: [
          "**Read-only `List<out E>` is covariant** (that's why `List<Dog>` is a `List<Animal>`), while `MutableList<E>` is invariant (it consumes elements via `add`, so covariance would be unsafe).",
          "**The restriction**: with `out T`, `T` can only appear in *output* positions (return types), never *input* positions (parameters) — the compiler enforces this so the covariance is sound.",
          "**Mnemonic**: `out` = 'produces/outputs T' = covariant = you can *up*cast the generic (Box<Dog> → Box<Animal>).",
        ],
      },
    ],
  },
  {
    heading: "in — contravariance (consumers)",
    blocks: [
      {
        t: "p",
        text: "**`in T`** makes a type parameter **contravariant**: `Box<in Dog>` accepts `Box<Animal>`. It's allowed when the type is only ever *consumed* (taken as input), never *produced*. If something can consume any `Animal`, it can certainly consume a `Dog` — so a consumer of `Animal` is usable as a consumer of `Dog`. The subtyping *reverses*.",
      },
      {
        t: "code",
        title: "in enables contravariance",
        code: `// A Comparator<in T> that compares Animals can compare Dogs:
val animalComparator: Comparator<Animal> = Comparator { a, b -> a.age - b.age }
val dogComparator: Comparator<Dog> = animalComparator   // OK with 'in'

interface Consumer<in T> {
    fun consume(t: T)          // OK — T is in input position
    // fun produce(): T        // ERROR — can't have T in output position with 'in'
}`,
      },
      {
        t: "list",
        items: [
          "**The restriction**: with `in T`, `T` can only appear in *input* positions (parameters), never output — enforced by the compiler.",
          "**Mnemonic**: `in` = 'consumes/inputs T' = contravariant = subtyping reverses (Consumer<Animal> is a Consumer<Dog>).",
          "**The unifying rule — PECS / 'producer out, consumer in'**: if a type parameter is *produced* (output), mark it `out`; if *consumed* (input), mark it `in`. This is Kotlin's version of Java's PECS ('Producer Extends, Consumer Super').",
        ],
      },
    ],
  },
  {
    heading: "Declaration-site vs use-site variance, and star projection",
    blocks: [
      {
        t: "list",
        items: [
          "**Declaration-site variance** (Kotlin's advantage): you declare `out`/`in` *once*, at the class/interface definition (`interface List<out E>`). Every use of `List` is then covariant automatically. Java can't do this — it only has use-site variance (wildcards).",
          "**Use-site variance (type projection)**: you apply variance at a specific *use* instead — `fun copy(from: Array<out Any>, to: Array<Any>)`. Kotlin supports this too (it's how you handle invariant classes like `Array` at a call site). It's Kotlin's equivalent of Java's `? extends`/`? super` wildcards.",
          "**Star projection `<*>`**: when you don't know or care about the type argument — `List<*>` means 'a List of *something*'. You can read elements as the upper bound (`Any?`) but can't add anything (except null-related edge cases), because the actual type is unknown. Useful for 'I just need to know it's a List' situations.",
        ],
      },
      {
        t: "note",
        text: "The variance summary to state: generics are *invariant* by default (safe). `out` = covariant = for producers (T in output positions) = you can upcast (List<Dog> is List<Animal>). `in` = contravariant = for consumers (T in input positions) = subtyping reverses (Consumer<Animal> is Consumer<Dog>). Rule: 'producer out, consumer in'. Kotlin allows declaration-site variance (declare once) which Java can't; `<*>` is star projection for unknown type arguments.",
      },
    ],
  },
];

export default content;
