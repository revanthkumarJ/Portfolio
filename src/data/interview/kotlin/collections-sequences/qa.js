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
  {
    level: "junior",
    q: "What are the main collection types, and when do you use each?",
    a: [
      {
        t: "p",
        text: "Kotlin's core collections are `List` (ordered, allows duplicates, indexed access), `Set` (unordered, no duplicates, fast membership), and `Map` (key→value lookups). Each has read-only and `Mutable` variants. Pick by access pattern: ordered/indexed → List; uniqueness/contains → Set; keyed lookup → Map.",
      },
      {
        t: "list",
        items: [
          "**`List`** — ordered, indexed, allows duplicates; the default sequence of items.",
          "**`Set`** — no duplicates, fast `contains`; use for uniqueness/membership.",
          "**`Map`** — key→value; fast lookup by key.",
          "**Read-only vs `Mutable`** — `List` vs `MutableList`, etc.; expose read-only, mutate privately.",
        ],
      },
      {
        t: "code",
        title: "The three",
        code: `val list = listOf(1, 2, 2, 3)          // [1,2,2,3]
val set = setOf(1, 2, 2, 3)            // [1,2,3]
val map = mapOf("a" to 1, "b" to 2)    // key -> value`,
      },
      {
        t: "note",
        text: "List (ordered, indexed, duplicates allowed), Set (unique, fast contains), Map (key→value lookup) — each with read-only and Mutable variants. Choose by access: ordered/indexed → List, uniqueness/membership → Set, keyed lookup → Map. Expose read-only, mutate privately.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between listOf, mutableListOf, emptyList, and buildList?",
    a: [
      {
        t: "p",
        text: "`listOf(...)` creates a read-only list; `mutableListOf(...)` a mutable one; `emptyList()` a read-only empty list (shared singleton, allocation-free); `buildList { }` lets you construct a list imperatively (add in a lambda) and returns a read-only result — combining mutation during building with immutability after.",
      },
      {
        t: "code",
        title: "Building lists",
        code: `val a = listOf(1, 2, 3)             // read-only
val b = mutableListOf(1, 2)         // mutable
b.add(3)
val c = emptyList<Int>()            // read-only empty
val d = buildList {                 // build then freeze
    add(1); if (cond) add(2)
}   // returns read-only List`,
      },
      {
        t: "list",
        items: [
          "**`listOf`** — read-only, fixed contents.",
          "**`mutableListOf`** — mutable, add/remove.",
          "**`emptyList()`** — read-only empty (shared, no allocation).",
          "**`buildList { }`** — imperative construction, read-only result; cleaner than build-a-mutable-then-return.",
        ],
      },
      {
        t: "note",
        text: "listOf = read-only; mutableListOf = mutable; emptyList() = read-only empty (shared singleton, no allocation); buildList { add(...) } = imperative construction returning a read-only list (mutate while building, immutable after). Same family: buildSet/buildMap.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between an Array and a List, and IntArray vs Array<Int>?",
    a: [
      {
        t: "p",
        text: "An `Array` is a fixed-size, mutable, JVM-backed array; a `List` is a richer collection interface (read-only or mutable, resizable for `MutableList`). For primitives, `IntArray`/`DoubleArray` map to JVM primitive arrays (`int[]`) with *no boxing*, while `Array<Int>` boxes each element (`Integer[]`). Prefer `List` for general use; use primitive arrays in performance-critical numeric code.",
      },
      {
        t: "code",
        title: "Array vs List, boxing",
        code: `val arr = intArrayOf(1, 2, 3)     // IntArray -> int[], no boxing
val boxed = arrayOf(1, 2, 3)      // Array<Int> -> Integer[], boxed
val list = listOf(1, 2, 3)        // List<Int> -> boxed too, but richer API`,
      },
      {
        t: "list",
        items: [
          "**`Array`** — fixed size, mutable elements; lower-level.",
          "**`List`** — collection interface, richer operators; `MutableList` is resizable.",
          "**`IntArray` etc.** — primitive arrays, no boxing; use in hot numeric loops.",
          "**`Array<Int>`/`List<Int>`** — box elements; fine for general code.",
        ],
      },
      {
        t: "note",
        text: "Array = fixed-size mutable JVM array; List = richer collection interface (MutableList resizable). Primitive arrays (IntArray→int[]) avoid boxing; Array<Int>/List<Int> box elements (Integer). Prefer List generally; use IntArray/DoubleArray in performance-critical numeric code.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does groupBy do?",
    a: [
      {
        t: "p",
        text: "`groupBy { key }` transforms a collection into a `Map` where each key maps to the *list* of elements that produced it — grouping elements by a computed key. `groupBy(keySelector, valueTransform)` also transforms the grouped values. It's the go-to for bucketing data (by category, first letter, date).",
      },
      {
        t: "code",
        title: "groupBy",
        code: `val byFirst = words.groupBy { it.first() }        // Map<Char, List<String>>
val namesByAge = users.groupBy({ it.age }, { it.name })   // Map<Int, List<String>>
// For counts, groupingBy + eachCount:
val counts = words.groupingBy { it.first() }.eachCount()`,
      },
      {
        t: "list",
        items: [
          "**`groupBy { key }`** — `Map<Key, List<Element>>`.",
          "**With value transform** — `groupBy(key, value)` maps to transformed values.",
          "**`groupingBy { }.eachCount()`** — efficient counting per group.",
          "**Uses** — bucketing by category, section headers, histograms.",
        ],
      },
      {
        t: "note",
        text: "groupBy { key } → Map<Key, List<Element>> (bucket elements by a computed key); groupBy(key, valueTransform) maps grouped values. For counts use groupingBy { }.eachCount(). Great for categories, section lists, histograms.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between associate, associateBy, and associateWith?",
    a: [
      {
        t: "p",
        text: "These build a `Map` from a collection but differ in what becomes the key/value. `associateBy { key }` uses the element as the *value* and a selector as the *key* (index by id); `associateWith { value }` uses the element as the *key* and a selector as the *value*; `associate { key to value }` lets you produce both from each element.",
      },
      {
        t: "code",
        title: "The three associates",
        code: `users.associateBy { it.id }              // Map<Id, User> — index by id
ids.associateWith { fetch(it) }          // Map<Id, Data> — key is the element
users.associate { it.id to it.name }     // Map<Id, String> — custom both`,
      },
      {
        t: "list",
        items: [
          "**`associateBy { key }`** — element as value, selector as key (common: index by id).",
          "**`associateWith { value }`** — element as key, selector as value.",
          "**`associate { k to v }`** — both from the element.",
          "**Duplicate keys** — later entries overwrite earlier ones.",
        ],
      },
      {
        t: "note",
        text: "associateBy { key } → element as value, selector as key (index by id); associateWith { value } → element as key, selector as value; associate { k to v } → both from the element. Duplicate keys: later wins. associateBy is the usual 'index a list by id' tool.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between fold and reduce for collections?",
    a: [
      {
        t: "p",
        text: "Both combine a collection into a single value. `reduce { acc, x -> }` starts with the *first element* as the accumulator (and throws on an empty collection). `fold(initial) { acc, x -> }` starts with an *explicit initial value*, so it handles empty collections and can produce a *different result type* than the elements.",
      },
      {
        t: "code",
        title: "fold vs reduce",
        code: `listOf(1, 2, 3).reduce { acc, x -> acc + x }        // 6 (throws if empty)
listOf(1, 2, 3).fold(10) { acc, x -> acc + x }      // 16 (seed, safe on empty)
listOf("a", "b").fold(StringBuilder()) { sb, s -> sb.append(s) }  // different type`,
      },
      {
        t: "list",
        items: [
          "**`reduce`** — seed is the first element; throws on empty; result type = element type.",
          "**`fold(initial)`** — explicit seed; safe on empty; result type can differ.",
          "**`runningFold`/`runningReduce`** — produce intermediate accumulations.",
          "**`foldRight`/`reduceRight`** — combine from the end.",
        ],
      },
      {
        t: "note",
        text: "reduce { acc, x } seeds with the first element (throws on empty, result = element type); fold(initial) { acc, x } uses an explicit seed (safe on empty, result type can differ). Use fold for empty-safety and type changes; runningFold/runningReduce for intermediate steps.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does partition do, and how is it different from filter?",
    a: [
      {
        t: "p",
        text: "`partition { predicate }` splits a collection into *two* lists in one pass — a `Pair` of (matching, non-matching). `filter` gives only the matching elements (you'd need a second `filterNot` for the rest). Use `partition` when you need both groups.",
      },
      {
        t: "code",
        title: "partition",
        code: `val (adults, minors) = people.partition { it.age >= 18 }
// vs two passes:
val adults2 = people.filter { it.age >= 18 }
val minors2 = people.filterNot { it.age >= 18 }`,
      },
      {
        t: "list",
        items: [
          "**`partition { }`** — `Pair<List, List>` of (true, false) in one pass, destructurable.",
          "**`filter`** — only the matching elements.",
          "**One pass** — `partition` avoids iterating twice.",
          "**Destructure** — `val (yes, no) = ...`.",
        ],
      },
      {
        t: "note",
        text: "partition { } splits into a Pair of (matching, non-matching) lists in ONE pass (destructurable: val (yes, no) = ...); filter returns only matches (needs a second filterNot for the rest). Use partition when you need both groups.",
      },
    ],
  },
  {
    level: "junior",
    q: "What do zip and unzip do?",
    a: [
      {
        t: "p",
        text: "`zip` pairs elements of two collections positionally into a list of `Pair`s (stopping at the shorter one), optionally with a transform. `unzip` does the reverse — turns a list of pairs into a `Pair` of two lists. Useful for combining parallel lists (names + ages) or splitting them.",
      },
      {
        t: "code",
        title: "zip / unzip",
        code: `val names = listOf("A", "B"); val ages = listOf(1, 2, 3)
names.zip(ages)                       // [(A,1), (B,2)] — stops at shorter
names.zip(ages) { n, a -> "\$n:\$a" }   // ["A:1", "B:2"]
listOf("A" to 1, "B" to 2).unzip()    // (["A","B"], [1,2])`,
      },
      {
        t: "list",
        items: [
          "**`zip`** — positional pairs; stops at the shorter collection.",
          "**`zip { }`** — combine with a transform.",
          "**`unzip`** — split a list of pairs into two lists.",
          "**Uses** — combining/splitting parallel data.",
        ],
      },
      {
        t: "note",
        text: "zip pairs two collections positionally (stops at the shorter), optionally with a transform; unzip splits a list of pairs back into two lists. Use for combining or splitting parallel data (names + ages).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you sort collections with multiple criteria?",
    a: [
      {
        t: "p",
        text: "`sortedBy { selector }` sorts by one key ascending; `sortedByDescending` descends. For *multiple* criteria, use `sortedWith(compareBy({ ... }).thenBy({ ... }))` — sort by the first key, breaking ties with the next. `compareByDescending`/`thenByDescending` handle descending keys.",
      },
      {
        t: "code",
        title: "Multi-key sorting",
        code: `users.sortedBy { it.age }                       // single key
users.sortedWith(
    compareBy<User> { it.lastName }
        .thenBy { it.firstName }
        .thenByDescending { it.age }
)`,
      },
      {
        t: "list",
        items: [
          "**`sortedBy`/`sortedByDescending`** — single key.",
          "**`sortedWith(comparator)`** — custom/multi-key ordering.",
          "**`compareBy(...).thenBy(...)`** — primary then tie-breakers.",
          "**Stable sort** — equal elements keep their relative order.",
        ],
      },
      {
        t: "note",
        text: "sortedBy/sortedByDescending for one key; sortedWith(compareBy { }.thenBy { }.thenByDescending { }) for multiple criteria (primary then tie-breakers). Kotlin's sort is stable (equal elements keep order). Returns a new sorted list; sortedArray/sort() for in-place on mutable.",
      },
    ],
  },
  {
    level: "junior",
    q: "What do distinct and distinctBy do?",
    a: [
      {
        t: "p",
        text: "`distinct()` removes duplicate elements (by `equals`), preserving first-occurrence order. `distinctBy { selector }` removes elements with duplicate *keys* — keeping the first element per key even if other fields differ. Useful for deduping by an id while keeping the rest of the object.",
      },
      {
        t: "code",
        title: "distinct / distinctBy",
        code: `listOf(1, 2, 2, 3).distinct()                 // [1, 2, 3]
users.distinctBy { it.email }                 // one user per unique email`,
      },
      {
        t: "list",
        items: [
          "**`distinct()`** — remove `equals`-duplicates, keep first occurrence.",
          "**`distinctBy { key }`** — dedupe by a selected key, keep first per key.",
          "**Order preserved** — first occurrences retained.",
          "**Alternative** — `toSet()` dedupes but loses order (for a `Set`).",
        ],
      },
      {
        t: "note",
        text: "distinct() removes equals-duplicates (keeps first occurrence, order preserved); distinctBy { key } dedupes by a selected key (one per key, keeping the first). Use distinctBy to dedupe objects by id/email. toSet() also dedupes but loses order.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are chunked and windowed?",
    a: [
      {
        t: "p",
        text: "`chunked(n)` splits a collection into consecutive *non-overlapping* sublists of size `n` (the last may be smaller). `windowed(size, step)` creates *sliding windows* of a given size, moving by `step` — overlapping by default. Use `chunked` for batching (e.g. paginate a list); `windowed` for moving averages or comparing neighbors.",
      },
      {
        t: "code",
        title: "chunked / windowed",
        code: `(1..7).chunked(3)                      // [[1,2,3], [4,5,6], [7]]
(1..5).windowed(3, step = 1)           // [[1,2,3], [2,3,4], [3,4,5]]
(1..5).windowed(2).map { (a, b) -> b - a }   // pairwise diffs`,
      },
      {
        t: "list",
        items: [
          "**`chunked(n)`** — non-overlapping batches of size n.",
          "**`windowed(size, step, partialWindows)`** — sliding windows.",
          "**`chunked` uses** — batching API calls, grid rows.",
          "**`windowed` uses** — moving averages, comparing adjacent elements.",
        ],
      },
      {
        t: "note",
        text: "chunked(n) = consecutive non-overlapping sublists of size n (last may be smaller — batching, grid rows). windowed(size, step) = sliding (overlapping) windows — moving averages, comparing neighbors. Both have transform overloads.",
      },
    ],
  },
  {
    level: "junior",
    q: "What do any, all, none, and count do?",
    a: [
      {
        t: "p",
        text: "These are predicate-testing terminal operations. `any { }` returns true if *at least one* element matches; `all { }` if *every* element matches; `none { }` if *no* element matches; `count { }` returns *how many* match. Without a predicate, `any()` checks non-emptiness, `count()` returns size.",
      },
      {
        t: "code",
        title: "Predicate checks",
        code: `list.any { it > 10 }        // at least one > 10
list.all { it > 0 }         // all positive
list.none { it.isBlank() }  // none blank
list.count { it % 2 == 0 }  // how many even
list.any()                  // is not empty`,
      },
      {
        t: "list",
        items: [
          "**`any { }`** — at least one matches (short-circuits).",
          "**`all { }`** — every element matches.",
          "**`none { }`** — no element matches.",
          "**`count { }`** — number matching; `count()` = size.",
        ],
      },
      {
        t: "note",
        text: "any { } (≥1 matches, short-circuits), all { } (every matches), none { } (zero match), count { } (how many). No-predicate: any() checks non-empty, count() = size. Prefer any()/isNotEmpty() over size > 0, and any { } over filter { }.isNotEmpty() (short-circuits).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you find elements: first, firstOrNull, find, single?",
    a: [
      {
        t: "p",
        text: "`first { }` returns the first matching element (throws if none); `firstOrNull { }`/`find { }` return the match or `null` (safe). `single { }` expects *exactly one* match (throws if zero or more than one). Prefer the `OrNull`/`find` variants unless you're certain a match exists.",
      },
      {
        t: "code",
        title: "Finding elements",
        code: `list.first { it > 5 }          // first > 5 (throws if none)
list.firstOrNull { it > 5 }    // or null
list.find { it.id == id }      // == firstOrNull, reads nicely
list.single { it.isDefault }   // exactly one expected`,
      },
      {
        t: "list",
        items: [
          "**`first { }`** — first match; throws `NoSuchElementException` if none.",
          "**`firstOrNull { }`/`find { }`** — first match or null (same thing).",
          "**`single { }`** — exactly one match; throws otherwise.",
          "**`last`/`lastOrNull`** — from the end.",
        ],
      },
      {
        t: "note",
        text: "first { } (first match, throws if none), firstOrNull { }/find { } (match or null — same), single { } (exactly one, throws on 0 or >1), last/lastOrNull (from the end). Prefer firstOrNull/find unless a match is guaranteed; single when you truly expect one.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you aggregate numbers: sumOf, maxByOrNull, minByOrNull, average?",
    a: [
      {
        t: "p",
        text: "`sumOf { selector }` sums a numeric projection; `maxByOrNull { }`/`minByOrNull { }` return the element with the max/min selected value (null if empty); `maxOfOrNull { }`/`minOfOrNull { }` return the max/min *value*; `average()` computes the mean. The `OrNull` variants avoid exceptions on empty collections.",
      },
      {
        t: "code",
        title: "Numeric aggregation",
        code: `orders.sumOf { it.total }              // sum of totals
users.maxByOrNull { it.age }           // the oldest user (or null)
prices.minOfOrNull { it }              // smallest price value
scores.average()                        // mean (Double)`,
      },
      {
        t: "list",
        items: [
          "**`sumOf { }`** — sum a numeric projection (typed Int/Long/Double).",
          "**`maxByOrNull`/`minByOrNull`** — the *element* with the extreme key.",
          "**`maxOfOrNull`/`minOfOrNull`** — the extreme *value*.",
          "**`average()`** — mean as Double; empty → NaN.",
        ],
      },
      {
        t: "note",
        text: "sumOf { } sums a numeric projection; maxByOrNull/minByOrNull return the ELEMENT with the extreme key; maxOfOrNull/minOfOrNull return the extreme VALUE; average() the mean. Use OrNull variants for empty-safety (non-OrNull throw on empty).",
      },
    ],
  },
  {
    level: "junior",
    q: "What do filterNotNull, filterIsInstance, and mapNotNull do?",
    a: [
      {
        t: "p",
        text: "`filterNotNull()` removes null elements (turning `List<T?>` into `List<T>`); `filterIsInstance<T>()` keeps only elements of a type (typed as `T`); `mapNotNull { }` maps and drops null results in one step. All three clean or narrow a collection concisely.",
      },
      {
        t: "code",
        title: "Cleaning collections",
        code: `listOf(1, null, 2).filterNotNull()             // [1, 2]
items.filterIsInstance<Post>()                  // only Posts, typed
strings.mapNotNull { it.toIntOrNull() }         // parse, drop failures`,
      },
      {
        t: "list",
        items: [
          "**`filterNotNull()`** — drop nulls; `List<T?>` → `List<T>`.",
          "**`filterIsInstance<T>()`** — keep one type, smart-typed.",
          "**`mapNotNull { }`** — transform + drop nulls.",
          "**Uses** — parsing (drop failures), narrowing heterogeneous lists.",
        ],
      },
      {
        t: "note",
        text: "filterNotNull() drops nulls (List<T?>→List<T>); filterIsInstance<T>() keeps one type (typed); mapNotNull { } maps and drops null results. Great for parsing (mapNotNull { it.toIntOrNull() }) and narrowing heterogeneous lists.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between forEach and map?",
    a: [
      {
        t: "p",
        text: "`map` *transforms* each element and returns a *new collection* of results. `forEach` performs a *side effect* per element and returns `Unit` (nothing). Use `map` when you want a transformed collection; use `forEach` for effects (logging, mutation of external state). Using `map` and ignoring its result is a smell — use `forEach`.",
      },
      {
        t: "code",
        title: "Transform vs side effect",
        code: `val names = users.map { it.name }       // new List<String>
users.forEach { log(it) }               // side effects, returns Unit
// smell: users.map { log(it) }         // ignores the created list`,
      },
      {
        t: "list",
        items: [
          "**`map`** — transform → new collection.",
          "**`forEach`** — side effect → Unit.",
          "**`onEach`** — side effect but returns the collection (chainable).",
          "**Don't misuse** — `map` for effects wastes an allocated list.",
        ],
      },
      {
        t: "note",
        text: "map transforms each element → a new collection; forEach performs a side effect → Unit. Use map for transformations, forEach for effects (logging/mutation). onEach does a side effect but returns the collection (chainable). Don't use map for side effects (wastes the result list).",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the common Set operations?",
    a: [
      {
        t: "p",
        text: "Sets support mathematical operations: `union` (all elements of both), `intersect` (elements in both), and `subtract` (in the first but not the second). Sets also give fast `contains` and automatic deduplication. Use them for membership tests and comparing groups.",
      },
      {
        t: "code",
        title: "Set operations",
        code: `val a = setOf(1, 2, 3); val b = setOf(2, 3, 4)
a union b        // [1, 2, 3, 4]
a intersect b    // [2, 3]
a subtract b     // [1]
2 in a           // true — fast membership`,
      },
      {
        t: "list",
        items: [
          "**`union`** — all elements of both (deduped).",
          "**`intersect`** — common elements.",
          "**`subtract`** — in the first, not the second.",
          "**Fast `contains`** — O(1) membership (hash set).",
        ],
      },
      {
        t: "note",
        text: "Set operations: union (both), intersect (common), subtract (first minus second) — plus O(1) contains and auto-dedup. Use for membership tests and comparing groups. Works on any collection (returns a Set).",
      },
    ],
  },
  {
    level: "junior",
    q: "What are useful Map operations (getOrDefault, getOrPut, iteration)?",
    a: [
      {
        t: "p",
        text: "Maps offer safe access and lazy population: `get`/`[]` returns `null` for a missing key; `getOrDefault(key, default)` returns a default; `getOrElse(key) { }` computes one; `getOrPut(key) { }` (on a MutableMap) returns the existing value or *inserts and returns* a computed one. Iterate with `for ((k, v) in map)`.",
      },
      {
        t: "code",
        title: "Map access patterns",
        code: `map["missing"]                       // null
map.getOrDefault("k", 0)             // default if absent
val cache = mutableMapOf<String, Data>()
cache.getOrPut("k") { expensiveLoad() }   // memoize
for ((key, value) in map) println("\$key=\$value")`,
      },
      {
        t: "list",
        items: [
          "**`[]`/`get`** — value or null.",
          "**`getOrDefault`/`getOrElse { }`** — fallback for missing keys.",
          "**`getOrPut { }`** — get-or-insert; great for memoization/caches.",
          "**Iteration** — destructure entries `(k, v)`; `keys`, `values`, `entries`.",
        ],
      },
      {
        t: "note",
        text: "Map access: [] / get → value or null; getOrDefault/getOrElse { } → fallback; getOrPut { } (MutableMap) → get-or-insert (memoization/caches). Iterate with for ((k, v) in map); use keys/values/entries. mapValues/filterKeys transform maps.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you convert between collection types?",
    a: [
      {
        t: "p",
        text: "Use the `toX()` functions: `toList()`, `toMutableList()`, `toSet()`, `toMutableSet()`, `toTypedArray()`, `associate`/`toMap()`. These create a *new* collection of the target type. `toList()` also snapshots a mutable collection into a read-only copy.",
      },
      {
        t: "code",
        title: "Conversions",
        code: `val set = list.toSet()                 // dedupe into a Set
val mutable = list.toMutableList()     // mutable copy
val array = list.toTypedArray()        // Array<T>
val map = pairs.toMap()                // List<Pair> -> Map
val snapshot = mutableList.toList()    // read-only copy (defensive)`,
      },
      {
        t: "list",
        items: [
          "**`toList`/`toMutableList`** — list copies (read-only / mutable).",
          "**`toSet`/`toMutableSet`** — deduped set copies.",
          "**`toTypedArray`/`toIntArray`** — arrays.",
          "**`toMap`** — pairs to a map; defensive copies to avoid shared mutation.",
        ],
      },
      {
        t: "note",
        text: "toList/toMutableList (list copies), toSet/toMutableSet (deduped), toTypedArray/toIntArray (arrays), toMap (pairs→map) — each creates a NEW collection of the target type. toList() also makes a read-only defensive copy of a mutable collection.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why can't you compare arrays with ==, and what do you use instead?",
    a: [
      {
        t: "p",
        text: "For arrays, `==` (and `.equals()`) checks *reference* identity, not contents — two arrays with the same elements are `!=`. Use `contentEquals` for a shallow content comparison, and `contentDeepEquals` for nested arrays. (Lists, by contrast, compare by content with `==`.) This is a common gotcha for Java developers.",
      },
      {
        t: "code",
        title: "Array comparison",
        code: `val a = intArrayOf(1, 2, 3); val b = intArrayOf(1, 2, 3)
a == b                 // false — reference comparison
a.contentEquals(b)     // true — content
arrayOf(a).contentDeepEquals(arrayOf(b))   // nested arrays`,
      },
      {
        t: "list",
        items: [
          "**Array `==`** — reference identity (not content).",
          "**`contentEquals`** — shallow content comparison.",
          "**`contentDeepEquals`** — nested arrays.",
          "**Lists differ** — `List` `==` compares content; prefer `List` when you want value equality.",
        ],
      },
      {
        t: "note",
        text: "Array == compares references, not contents (a common gotcha) — use contentEquals (shallow) or contentDeepEquals (nested). Lists, unlike arrays, compare by content with ==. Prefer List over Array when you want value equality (and data classes with arrays need custom equals).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you decide between chained operators and a manual loop?",
    a: [
      {
        t: "p",
        text: "Chained operators (`map`/`filter`/`groupBy`) are declarative and readable, and are the default choice. But each intermediate operator on a `List` allocates a *new list*, so a long chain over a large collection can be wasteful — there, use a `Sequence` (lazy, no intermediate lists) or a single loop. For small collections, readability wins; for large/hot paths, measure and consider sequences or loops.",
      },
      {
        t: "list",
        items: [
          "**Operators** — readable, declarative; the default for clarity.",
          "**Intermediate allocations** — each list operator creates a new list; long chains over big data add up.",
          "**`Sequence`** — lazy evaluation, no intermediate lists, for large collections / long chains.",
          "**Manual loop** — occasionally clearest/fastest for complex single-pass logic; don't prematurely optimize.",
        ],
      },
      {
        t: "note",
        text: "Prefer chained operators for readability (the default). But list operators allocate an intermediate list each step — for large collections / long chains, use a Sequence (lazy, no intermediates) or a single loop. Small data: readability wins. Large/hot paths: measure, then optimize with sequences/loops.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between flatten and flatMap?",
    a: [
      {
        t: "p",
        text: "`flatten()` collapses a collection *of collections* into a single flat collection. `flatMap { }` does two steps at once — it maps each element to a collection and then flattens the results. So `flatMap` = `map { }` producing collections + `flatten()`.",
      },
      {
        t: "code",
        title: "flatten vs flatMap",
        code: `listOf(listOf(1, 2), listOf(3, 4)).flatten()   // [1, 2, 3, 4]
users.flatMap { it.roles }                       // all roles across users, flattened
// equivalent: users.map { it.roles }.flatten()`,
      },
      {
        t: "list",
        items: [
          "**`flatten()`** — `List<List<T>>` → `List<T>`.",
          "**`flatMap { }`** — map each element to a collection, then flatten.",
          "**Equivalence** — `flatMap { f(it) }` == `map { f(it) }.flatten()`.",
          "**Uses** — gathering nested data (all tags, all children) into one list.",
        ],
      },
      {
        t: "note",
        text: "flatten() collapses List<List<T>> → List<T>. flatMap { } maps each element to a collection then flattens (= map { }.flatten()). Use flatMap to gather nested data (all roles/tags/children) into one flat list.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you build a collection imperatively with buildList/buildMap?",
    a: [
      {
        t: "p",
        text: "`buildList { }`, `buildSet { }`, and `buildMap { }` give you a *mutable* builder inside the lambda and return an immutable (read-only) result. They're cleaner than creating a `mutableListOf`, populating it conditionally, and returning it — you get imperative construction with an immutable result in one expression.",
      },
      {
        t: "code",
        title: "buildList",
        code: `val items = buildList {
    add(header)
    if (showAds) add(adItem)
    addAll(posts)
    if (hasMore) add(loadingItem)
}   // returns an immutable List
val config = buildMap { put("a", 1); if (cond) put("b", 2) }`,
      },
      {
        t: "list",
        items: [
          "**`buildList { }`** — mutable inside, read-only result.",
          "**Conditional construction** — add items based on logic cleanly.",
          "**`buildSet`/`buildMap`** — same for sets and maps.",
          "**Better than** — a `mutableListOf` you populate and return (no leaked mutability).",
        ],
      },
      {
        t: "note",
        text: "buildList/buildSet/buildMap { } give a mutable builder in the lambda and return an immutable result — clean imperative construction (conditional adds) without leaking a mutable list. Prefer over creating a mutableListOf, populating, and returning it.",
      },
    ],
  },
  {
    level: "senior",
    q: "What's the difference between count() and size, and any() and isNotEmpty()?",
    a: [
      {
        t: "p",
        text: "For a `Collection`, `size` is a property (O(1)) and `count()` (no predicate) just returns `size` — so use `size`. But on a `Sequence` or `Iterable` without a known size, `count()` iterates (O(n)). Similarly, `isNotEmpty()` is the clear way to check non-emptiness; `any()` (no predicate) also works. Use predicate versions (`count { }`, `any { }`) when filtering.",
      },
      {
        t: "list",
        items: [
          "**`size`** — O(1) property on collections; prefer it over `count()`.",
          "**`count()`** — O(1) on collections, but O(n) (iterates) on sequences/iterables.",
          "**`count { }`/`any { }`** — with a predicate, count/check matches (any short-circuits).",
          "**`isNotEmpty()`/`isEmpty()`** — clearest emptiness checks; avoid `size > 0`.",
        ],
      },
      {
        t: "note",
        text: "For collections, size is an O(1) property and count() (no predicate) just returns it — use size. On sequences/iterables, count() iterates (O(n)). Use count { }/any { } with predicates (any short-circuits). Prefer isNotEmpty()/isEmpty() over size > 0/== 0.",
      },
    ],
  },
];

export default qa;
