// Collections & Sequences — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is the difference between List and MutableList?",
    a: [
      {
        t: "p",
        text: "**The concept**: Kotlin separates collections into read-only and mutable interfaces. `List<T>` is read-only — it has access methods (`get`, `size`, `contains`) but *no* methods to add or remove elements. `MutableList<T>` extends it with mutation methods (`add`, `remove`, `clear`). You pick the type based on whether the code holding it should be able to modify it.",
      },
      {
        t: "code",
        title: "The two types",
        code: `val ro: List<Int> = listOf(1, 2, 3)          // no add/remove
val mut: MutableList<Int> = mutableListOf(1) // can modify
mut.add(2)`,
      },
      {
        t: "p",
        text: "The important nuance: **read-only is not the same as immutable.** `List` is just an *interface* without mutators — but the actual object could be a `MutableList` referenced elsewhere and changed through that other reference. So `val list: List<Int>` prevents modification *through that variable*, not modification of the data entirely. The idiomatic pattern for safe encapsulation is to keep a private mutable collection and expose it as read-only (`private val _items = mutableListOf(); val items: List<T> = _items`), so only the owner can mutate. For genuine immutability you'd use `kotlinx.collections.immutable`. Default to read-only types unless you actually need mutation.",
      },
    ],
  },
  {
    level: "junior",
    q: "Explain map, filter, and a few other common collection operators.",
    a: [
      {
        t: "list",
        items: [
          "**`map { }`** — transform each element into a new one, returning a new list: `users.map { it.name }` → list of names.",
          "**`filter { }`** — keep only elements matching a predicate: `users.filter { it.age >= 18 }`.",
          "**`first { }` / `firstOrNull { }` / `find { }`** — get the first matching element; `first` throws if none, `firstOrNull`/`find` return null.",
          "**`any { }` / `all { }` / `none { }`** — boolean checks: at least one matches / all match / none match.",
          "**`groupBy { }` / `associateBy { }`** — build maps: `groupBy` buckets elements by a key into lists; `associateBy` makes a lookup map keyed by a property.",
          "**`sumOf { }` / `maxByOrNull { }` / `sortedBy { }`** — aggregate, find extremes, sort (returning a new sorted list).",
        ],
      },
      {
        t: "p",
        text: "These are extension functions on `Iterable` that return *new* collections without modifying the original — functional style. They compose into readable pipelines: `users.filter { it.active }.sortedBy { it.name }.map { it.email }`. The one thing to keep in mind is that each operator on a regular collection is *eager* — it processes the whole collection and creates a new intermediate list — which matters for large data (where sequences help) but is fine for typical small lists.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between map and flatMap?",
    a: [
      {
        t: "p",
        text: "**`map` is one-to-one; `flatMap` is one-to-many, flattened.** `map { }` transforms each element into exactly one result, giving a list of the same size. `flatMap { }` transforms each element into a *list* (or iterable), then concatenates all those lists into one flat result.",
      },
      {
        t: "code",
        title: "The difference",
        code: `val users = listOf(
    User("A", tags = listOf("x", "y")),
    User("B", tags = listOf("z")),
)

users.map { it.tags }        // [[x, y], [z]]  — a list of lists
users.flatMap { it.tags }    // [x, y, z]       — flattened into one list`,
      },
      {
        t: "p",
        text: "Use `map` when each element becomes one new element (names from users). Use `flatMap` when each element expands into *multiple* elements you want combined — like collecting all tags across all users into a single list, or all order-items across all orders. It's essentially `map` followed by `flatten`. This is the collections analog of `flatMapConcat` in Flow — the same 'each element produces a collection, merge them all' idea.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a Sequence and how is it different from a List?",
    a: [
      {
        t: "p",
        text: "**The concept**: a `List`'s operators are *eager* — each one (`map`, `filter`) processes the whole list immediately and produces a new intermediate list. A `Sequence`'s operators are *lazy* — nothing runs until a terminal operation (like `toList()` or `first()`), and then elements flow through the *entire chain one at a time* instead of the whole collection passing through each operator.",
      },
      {
        t: "code",
        title: "Lazy vs eager",
        code: `// List (eager): map processes all, then filter processes all, then take
list.map { f(it) }.filter { g(it) }.take(5)

// Sequence (lazy): each element flows through map->filter->take;
// stops as soon as 5 elements pass
list.asSequence().map { f(it) }.filter { g(it) }.take(5).toList()`,
      },
      {
        t: "p",
        text: "The practical difference: with a List, a chain of operators creates a new intermediate collection at each step and iterates multiple times. With a Sequence, there are no intermediate collections, it's a single pass, and short-circuiting operators like `take(5)`/`first` can *stop early* without processing the rest. So sequences shine for large collections with long operator chains or early termination. But for *small* collections, sequences are actually slower (the lazy machinery has per-element overhead), so you shouldn't convert everything to sequences reflexively. It's essentially the collections version of Kotlin Flow.",
      },
    ],
  },
  {
    level: "senior",
    q: "When should you use a Sequence over regular collection operators, and when would it hurt?",
    a: [
      {
        t: "p",
        text: "**The decision comes down to collection size, chain length, and whether you can short-circuit.** The costs sequences avoid — intermediate collection allocations and multiple passes — only matter when there's enough data and enough operators for those costs to be significant. Sequences also add a *fixed per-element overhead* (each element is pushed through the operator chain via iterator calls), which can dominate for small data.",
      },
      {
        t: "list",
        items: [
          "**Use a Sequence when**: (1) the collection is *large*, (2) you chain *multiple* operators (each intermediate list you avoid is a real saving), or (3) you can *short-circuit* — `take(n)`, `first { }`, `any { }` — so lazy evaluation stops early instead of processing everything. The classic win: `hugeList.asSequence().map { }.filter { }.first { }` processes only until the first match, whereas the eager version transforms and filters the *entire* list first.",
          "**Sequences HURT when**: the collection is *small* (dozens of elements) — the lazy iterator overhead per element outweighs the avoided allocations, so plain operators are measurably faster. Also when you have a *single* operator (no intermediate list to avoid) or need the result materialized anyway.",
          "**A subtle correctness point**: some operations (like `sorted`) are inherently *stateful* — they must see all elements, so within a sequence they materialize the whole thing internally, negating the laziness up to that point. Sequences help most with *stateless* operations (map/filter/take).",
        ],
      },
      {
        t: "code",
        title: "The clearest win — early termination on large data",
        code: `// EAGER: transforms and filters ALL million items to find one
millionItems.map { expensive(it) }.filter { it.valid }.first()

// LAZY: stops at the first valid item — maybe processes only a handful
millionItems.asSequence().map { expensive(it) }.filter { it.valid }.first()`,
      },
      {
        t: "p",
        text: "**The senior takeaway**: don't cargo-cult `.asSequence()`. The heuristic is 'large collection + multiple operators, or short-circuiting'. For a list of 20 UI items with two operators, plain collection functions are simpler and faster. For a million-element pipeline with a `first`/`take`, sequences can be dramatically faster. Measure if unsure — the crossover point depends on element count and operator cost.",
      },
    ],
  },
  {
    level: "senior",
    q: "'Read-only' collections aren't truly immutable. Explain the risk and how to get real immutability.",
    a: [
      {
        t: "p",
        text: "**The subtlety**: `List<T>` is a read-only *interface* — it lacks mutator methods, so you can't modify the collection *through a `List` reference*. But the underlying object at runtime might actually be a `MutableList`, and if another reference to it exists as `MutableList`, that reference can still change the data — and your `List` view reflects the change. Read-only means 'this view can't mutate', not 'this data can never change'.",
      },
      {
        t: "code",
        title: "The read-only view can change under you",
        code: `val mutable = mutableListOf(1, 2, 3)
val readOnly: List<Int> = mutable          // a read-only VIEW of the same object

mutable.add(4)                              // mutate via the mutable reference
println(readOnly)                           // [1, 2, 3, 4] — the view changed!`,
      },
      {
        t: "list",
        items: [
          "**The risk in practice**: you expose a `List` from a class thinking it's safe, but you kept a `MutableList` internally and hand out the *same object* upcast to `List`. If the caller downcasts (`readOnly as MutableList`) or if the internal mutation happens while the caller iterates, you get surprises — including `ConcurrentModificationException` or, in Compose, stale UI because the 'immutable' state actually mutated in place (breaking equality-based skipping).",
          "**Real immutability option 1 — defensive copy**: expose `_items.toList()`, which creates a genuinely separate list. Safe, but copies on every access (cost for large/frequent).",
          "**Real immutability option 2 — `kotlinx.collections.immutable`**: `persistentListOf()` / `toImmutableList()` give truly immutable collections (`ImmutableList`) that *cannot* be mutated by anyone, with efficient structural sharing for 'modifications' (they return new versions). These are also what Compose recognizes as stable for recomposition skipping.",
          "**Real immutability option 3 — don't share the mutable reference**: keep the `MutableList` strictly private and only ever expose copies or immutable types, never the same object upcast.",
        ],
      },
      {
        t: "p",
        text: "**Why it matters for Android specifically**: Compose stability relies on immutability — an `@Immutable`/`@Stable` data class holding a `List` is only safe if that list truly never mutates; a read-only view of a mutable list breaks that promise and causes stale UI. So for Compose state, prefer `ImmutableList` (compiler-recognized) or defensive copies over exposing read-only views of internally-mutable collections. The general principle: read-only is an *access restriction*, immutability is a *data guarantee* — know which one you actually have.",
      },
    ],
  },
];

export default qa;
