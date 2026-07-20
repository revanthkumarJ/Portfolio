// Collections & Sequences — Content tab. Teaching-first.

const content = [
  {
    heading: "Read-only vs mutable collections",
    blocks: [
      {
        t: "p",
        text: "Kotlin splits collections into **read-only** and **mutable** interfaces. `List<T>`, `Set<T>`, `Map<K,V>` are read-only (no add/remove methods). `MutableList<T>`, `MutableSet<T>`, `MutableMap<K,V>` add modification methods. You choose the type by whether callers should be able to modify it.",
      },
      {
        t: "code",
        title: "Creating collections",
        code: `val readOnly = listOf(1, 2, 3)          // List<Int> — no add/remove
val mutable = mutableListOf(1, 2, 3)   // MutableList<Int> — can modify
mutable.add(4)

val map = mapOf("a" to 1, "b" to 2)    // read-only Map
val mmap = mutableMapOf<String, Int>() // mutable

val set = setOf(1, 2, 2, 3)            // Set — duplicates removed -> {1,2,3}`,
      },
      {
        t: "list",
        items: [
          "**Read-only is not immutable**: `List` is an *interface* without mutators, but the underlying object might still be a mutable list held elsewhere. A `val list: List<Int>` prevents *you* from modifying it through that reference, but doesn't guarantee the data can't change via another reference. For true immutability use `kotlinx.collections.immutable` (`persistentListOf`).",
          "**Expose read-only, use mutable internally**: the idiom is to keep a `private val _items = mutableListOf()` and expose `val items: List<T> = _items` — so only the owner mutates. (Same principle as the StateFlow backing-property pattern.)",
          "**Default to read-only**: prefer `listOf`/`mapOf` unless you specifically need mutation — it communicates intent and prevents accidental modification.",
        ],
      },
    ],
  },
  {
    heading: "The functional operators — map, filter, and friends",
    blocks: [
      {
        t: "code",
        title: "The everyday transformations",
        code: `val users = listOf(User("A", 25), User("B", 17), User("C", 30))

users.map { it.name }                    // [A, B, C] — transform each
users.filter { it.age >= 18 }            // adults only
users.first { it.age > 20 }              // first match (throws if none)
users.firstOrNull { it.age > 100 }       // null if none
users.any { it.age < 18 }                // true — at least one matches
users.all { it.age > 0 }                 // true — every element matches
users.count { it.age >= 18 }             // 2
users.sortedBy { it.age }                // sorted copy
users.groupBy { it.age >= 18 }           // Map<Boolean, List<User>>
users.associateBy { it.name }            // Map<String, User> keyed by name
users.sumOf { it.age }                   // 72
users.maxByOrNull { it.age }             // User C
users.partition { it.age >= 18 }         // Pair<adults, minors>
users.flatMap { it.tags }                // flatten nested lists`,
      },
      {
        t: "list",
        items: [
          "**These are extension functions on `Iterable`** returning *new* collections — the originals are never modified (functional style). `map`/`filter` are the core; the rest cover common needs (grouping, aggregation, searching).",
          "**`map` vs `flatMap`**: `map` is 1:1 (each element → one result); `flatMap` is 1:many flattened (each element → a list, all concatenated).",
          "**`associate`/`associateBy`/`groupBy`**: build maps from lists — `associateBy { it.id }` makes a lookup map, `groupBy { it.category }` buckets elements.",
          "**`first`/`find`/`single`**: `first { }` throws if no match, `firstOrNull`/`find` returns null, `single { }` requires exactly one.",
        ],
      },
    ],
  },
  {
    heading: "The eager evaluation problem",
    blocks: [
      {
        t: "p",
        text: "Standard collection operators are **eager**: each one processes the *entire* collection and creates a *new intermediate collection* before the next operator runs. Chaining several means allocating a full list at each step and iterating multiple times — fine for small collections, wasteful for large ones.",
      },
      {
        t: "code",
        title: "Eager: multiple passes and intermediate lists",
        code: `val result = hugeList
    .map { it * 2 }        // creates a full new list (pass 1)
    .filter { it > 10 }    // creates ANOTHER full list (pass 2)
    .take(5)               // creates ANOTHER list, then takes 5 (pass 3)
// Even though we only wanted 5 items, map ran over the ENTIRE list first.`,
      },
      {
        t: "p",
        text: "In that example, `map` transforms all million elements, then `filter` scans all of them, then `take(5)` keeps just 5 — we did a million transforms and a million filters to get 5 results, plus two throwaway intermediate lists. That's the eager evaluation cost.",
      },
    ],
  },
  {
    heading: "Sequences — lazy evaluation",
    blocks: [
      {
        t: "p",
        text: "A **`Sequence`** evaluates **lazily**: operators aren't applied until a *terminal* operation pulls values, and elements flow through the *whole chain one at a time* rather than the whole collection through each operator. No intermediate collections, and short-circuiting operators like `take`/`first` stop early. It's the collections analog of Kotlin Flow (Sequence is to collections what Flow is to async streams).",
      },
      {
        t: "code",
        title: "Lazy: one element at a time, short-circuits",
        code: `val result = hugeList.asSequence()
    .map { it * 2 }        // lazy — not run yet
    .filter { it > 10 }    // lazy
    .take(5)               // lazy
    .toList()              // TERMINAL — now it runs

// Now each element flows through map->filter one at a time, and the
// whole thing STOPS as soon as 5 pass the filter. No intermediate lists.`,
      },
      {
        t: "list",
        items: [
          "**How it differs**: eager processes *operator by operator* (all elements through map, then all through filter); lazy processes *element by element* (element 1 through the whole chain, then element 2…), stopping when a terminal like `take(5)`/`first` is satisfied.",
          "**Terminal vs intermediate**: sequence operators are intermediate (lazy) until a terminal operation (`toList`, `first`, `sum`, `count`) triggers evaluation — exactly like Flow.",
          "**When sequences win**: large collections, long operator chains, and short-circuiting (`take`, `first`, `any`) where you don't need to process everything. They avoid intermediate allocations and can stop early.",
          "**When they DON'T help (or hurt)**: small collections — the lazy machinery has per-element overhead that outweighs the benefit, so eager is actually faster for small data. Don't reflexively `.asSequence()` everything.",
        ],
      },
    ],
  },
  {
    heading: "Collections vs Sequences — the decision",
    blocks: [
      {
        t: "table",
        headers: ["", "Collection (eager)", "Sequence (lazy)"],
        rows: [
          ["Evaluation", "each operator processes all elements immediately", "elements flow through the whole chain lazily"],
          ["Intermediate collections", "one per operator", "none"],
          ["Passes over data", "one per operator", "single pass, element by element"],
          ["Short-circuits (take/first)", "no — earlier operators already ran fully", "yes — stops as soon as satisfied"],
          ["Best for", "small collections, few operators", "large data, long chains, early termination"],
        ],
      },
      {
        t: "note",
        text: "Rule of thumb: use plain collection operators by default (simpler, faster for small data). Switch to `.asSequence()` when the collection is large *and* you have multiple chained operations *or* can short-circuit (take/first/any) — that's when avoiding intermediate lists and early termination pays off. For small lists, sequences can be slower due to overhead.",
      },
    ],
  },
  {
    heading: "Other collection essentials",
    blocks: [
      {
        t: "list",
        items: [
          "**`Array` vs `List`**: `Array<T>` is a fixed-size, mutable, JVM-array-backed structure (use for performance-critical fixed data or interop); `List` is the general-purpose interface. Prefer `List` unless you need array semantics. Specialized `IntArray`/`FloatArray` avoid boxing.",
          "**Destructuring**: `for ((key, value) in map) { }`, `val (a, b) = pair` — works with data classes, pairs, and map entries via `componentN()`.",
          "**`zip`/`unzip`**: `listA zip listB` pairs elements; useful for combining parallel lists.",
          "**`fold`/`reduce`**: accumulate to a single value — `fold(0) { acc, x -> acc + x }` (with initial value), `reduce { acc, x -> ... }` (uses first element as initial, throws on empty).",
          "**`windowed`/`chunked`**: `chunked(3)` splits into groups of 3; `windowed(2)` creates sliding windows — handy for batching and pairwise processing.",
          "**Null handling in collections**: `filterNotNull()`, `mapNotNull { }` (map and drop nulls in one step), `firstNotNullOfOrNull { }`.",
        ],
      },
    ],
  },
];

export default content;
