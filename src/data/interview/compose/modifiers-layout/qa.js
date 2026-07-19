// Modifiers & Layout — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is a Modifier and why does its order matter?",
    a: [
      {
        t: "p",
        text: "**The concept**: a Modifier is an ordered chain of decorations and behaviors attached to a composable — sizing, padding, background, clicks, scrolling. Instead of widgets exposing hundreds of properties, Compose factors all of that into one composable-agnostic chain: `Modifier.padding(16.dp).background(Blue).clickable { }`. Each call returns a new immutable chain with one more element.",
      },
      {
        t: "p",
        text: "**Why order matters**: the chain isn't a bag of settings — it's a **pipeline** where each element wraps everything to its right. `background(Blue).padding(16.dp)` paints the background over the full area *then* insets the content — the padding is blue. `padding(16.dp).background(Blue)` insets *first*, so the background only covers the smaller inner area — the padding is transparent. Same two modifiers, visibly different UI. The same logic governs clickable areas (`clickable` before `padding` = padded area is tappable and rippled; after = only the content is) and size constraints (`size(100.dp).size(50.dp)` stays 100 — constraints fix left-to-right and later elements can't loosen them).",
      },
      {
        t: "p",
        text: "**How to never get confused**: read the chain left to right as \"outermost to innermost\". And there's no `margin` in Compose precisely because of this — outer spacing is just a `padding` placed *earlier* in the chain than the background/border, which is arguably cleaner than the View system's two separate concepts.",
      },
    ],
  },
  {
    level: "junior",
    q: "Explain how measurement works in Compose (constraints, sizes, placement).",
    a: [
      {
        t: "p",
        text: "**The model**: layout is a single-pass negotiation. First, **constraints travel down** — every parent gives each child a `Constraints` object: acceptable min/max width and height in pixels. The child doesn't get to demand a size; it gets a range. Second, **sizes travel up** — the child (after measuring its own children the same way) picks its final size *within* that range and reports it. Third, **placement**: the parent, now knowing every child's size, positions them with x/y coordinates. Each child is measured exactly once per pass — enforced by the runtime.",
      },
      {
        t: "p",
        text: "**How modifiers plug in**: size modifiers just transform the constraints flowing through the chain. `fillMaxWidth()` = 'set min = max = the available maxWidth'; `wrapContentWidth()` = 'prefer the minimum'; `size(50.dp)` = 'try to fix constraints to 50, **coerced into what came in**'. That coercion answers the classic confusion: inside a parent that already fixed the size (`fillMaxSize` set min == max), a later `size(50.dp)` is silently overridden — the constraints leave it no room. The `requiredSize` family is the explicit escape hatch that ignores incoming constraints.",
      },
      {
        t: "p",
        text: "**Why single-pass is a feature to name**: the View system allowed parents to measure children repeatedly, so nested weights/RelativeLayouts could go exponential with depth — the origin of \"flatten your hierarchy\". Compose's one-measure rule makes cost linear in tree size, so nesting Columns and Rows freely is idiomatic, not a smell.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between Arrangement and Alignment in Row/Column?",
    a: [
      {
        t: "p",
        text: "**The concept**: Row and Column each have a *main axis* (the direction they stack children — horizontal for Row, vertical for Column) and a *cross axis* (the perpendicular one). The two parameters control one axis each: **Arrangement** distributes children and leftover space **along the main axis**; **Alignment** positions each child **on the cross axis**.",
      },
      {
        t: "p",
        text: "So in a `Column`: `verticalArrangement` decides vertical distribution (`Arrangement.spacedBy(8.dp)` for gaps, `SpaceBetween`, `Center`, `Bottom`…), while `horizontalAlignment` decides whether children sit left/center/right. In a `Row` it flips: `horizontalArrangement` + `verticalAlignment`. Two useful details: `Arrangement.spacedBy` is the idiomatic replacement for putting padding on every child; and individual children can override the cross-axis alignment with `Modifier.align(...)`, which only compiles inside the right scope — the type system prevents using `align` where it's meaningless. If you remember one sentence: **Arrangement = the stacking axis, Alignment = the other one.**",
      },
    ],
  },
  {
    level: "junior",
    q: "How does Modifier.weight work, and what does it replace from the View system?",
    a: [
      {
        t: "p",
        text: "**The concept**: `weight` divides *leftover* space. Inside a Row or Column, measurement happens in two rounds: first, all children **without** weight measure normally and take what they need; then the remaining space is split among weighted children **proportionally to their weights** — `weight(1f)` and `weight(2f)` split leftovers 1:2. A weighted child's size is thus decided by the parent's arithmetic, not its content.",
      },
      {
        t: "code",
        title: "The three everyday uses",
        code: `Row {
    Icon(Icons.Default.Star, null)
    Text("Title that truncates", Modifier.weight(1f), maxLines = 1)  // absorb space
    Text("3:45")
}

Column(Modifier.fillMaxHeight()) {
    Content()
    Spacer(Modifier.weight(1f))   // push the button to the bottom
    SubmitButton()
}

Row { // equal-width segmented buttons
    repeat(3) { OptionButton(Modifier.weight(1f)) }
}`,
      },
      {
        t: "p",
        text: "It replaces LinearLayout's `layout_weight`, minus its famous pitfalls (no `0dp`-width trick needed, no double-measure cost). Details worth knowing: `weight(1f, fill = false)` means \"take *up to* your share\" (child can be smaller); weight only exists in Row/Column scope (compile-checked); and a weighted child receives its share as *fixed constraints* — so it will be exactly that size unless `fill = false`.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why should every reusable composable take a `modifier: Modifier = Modifier` parameter?",
    a: [
      {
        t: "p",
        text: "**The concept**: a component author cannot predict how callers will use the component — one screen wants it full-width, another wants it 100.dp with extra padding, a third wants it clickable and semi-transparent. Rather than adding parameters for each possibility, Compose's convention is: accept a single `modifier` parameter (first optional parameter, defaulting to `Modifier`) and apply it to your **outermost** layout. Callers then compose whatever sizing/spacing/behavior they need from the outside.",
      },
      {
        t: "list",
        items: [
          "**Apply it to the root, once**: applying the caller's modifier to an inner child means their `fillMaxWidth` sizes the wrong thing; applying it to multiple children duplicates paddings and clicks — both are real review bugs.",
          "**Chain yours after theirs**: `modifier.then(internalStuff)` or simply `modifier.padding(...)` — caller's elements sit outermost, so their positioning wins, and your internal decorations stay inside.",
          "**Don't accept-and-ignore**: silently dropping the parameter breaks every caller's layout expectations and is worse than not having it.",
          "**Why a parameter and not hardcoding**: it keeps components context-free — the same `ProfileCard` works in a list, a grid, a dialog — which is the composability Compose is named after.",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "There's no margin in Compose — how do you create spacing between elements?",
    a: [
      {
        t: "p",
        text: "**The concept**: the View system had two spacing ideas — padding (inside the border) and margin (outside it). Compose deliberately has only `padding`, because with ordered modifier chains one concept covers both: padding applied *before* the background/border in the chain acts like a margin (space outside the visible surface), padding applied *after* acts like classic padding (space inside it). `Modifier.padding(8.dp).background(Blue).padding(16.dp)` gives 8dp of 'margin' and 16dp of 'padding' with one API.",
      },
      {
        t: "p",
        text: "**The idiomatic toolbox for spacing**: `Arrangement.spacedBy(8.dp)` on Row/Column/LazyColumn for uniform gaps between children (preferred over per-child padding — no doubled edges); `Spacer(Modifier.height(8.dp))` for one-off gaps; `contentPadding` on lazy lists for space at the edges *inside* the scrolling region (so content scrolls under the edge, unlike outer padding which clips the scroll area — a distinction interviewers like); and weighted Spacers to push things apart. If asked why this design is better: one concept + explicit order beats two concepts + implicit rules about how they interact.",
      },
    ],
  },
  {
    level: "senior",
    q: "Implement (or walk through) a custom layout with the Layout composable. What contract must you satisfy?",
    a: [
      {
        t: "p",
        text: "**The concept**: `Layout` is the primitive underneath Row, Column, Box — all of them are just measure policies. You provide the children (`content`) and a `MeasurePolicy` lambda receiving `measurables` (unmeasured children) and `constraints` (from your parent). The contract has three obligations: **measure each child at most once** (`measurable.measure(childConstraints)` → a `Placeable` with real width/height; measuring twice throws), **choose your own size within the incoming constraints** and report it via `layout(width, height) { ... }`, and inside that block **place every child** (`placeable.place(x, y)`) — unplaced children simply don't render.",
      },
      {
        t: "code",
        title: "Skeleton every custom layout follows",
        code: `Layout(content = content, modifier = modifier) { measurables, constraints ->
    // 1. Measure children — you choose their constraints
    //    (often loosened: minWidth = 0 so children can be small)
    val placeables = measurables.map {
        it.measure(constraints.copy(minWidth = 0, minHeight = 0))
    }

    // 2. Compute your layout's geometry from the measured sizes
    val height = placeables.sumOf { it.height }.coerceIn(
        constraints.minHeight, constraints.maxHeight
    )

    // 3. Report size and place
    layout(constraints.maxWidth, height) {
        var y = 0
        placeables.forEach { p ->
            p.place(x = 0, y = y)
            y += p.height
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Decisions you own**: what constraints children get (pass yours through, loosen them, or fix them — this *is* your layout's behavior), and the placement math. Everything is plain Kotlin over `Placeable` sizes — no MeasureSpec bit-twiddling.",
          "**Edge cases that show seniority**: respect min constraints when reporting size (`coerceIn`) or parents may reject it; use `placeRelative` for automatic RTL mirroring; density is in scope (`8.dp.roundToPx()`); and if your algorithm needs to know one child's size *before deciding what else to compose* — that's not Layout anymore, that's `SubcomposeLayout`.",
          "**When asked 'why not just nest Rows/Columns?'**: custom Layout is for genuinely novel geometry (flow layouts, circular menus, staggered arrangements, text-baseline systems) — nesting stays the answer for anything expressible with the standard vocabulary, since single-pass measurement makes it free.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "What are intrinsic measurements, why do they exist if Compose is single-pass, and what do they cost?",
    a: [
      {
        t: "p",
        text: "**The problem they solve**: single-pass measurement means a parent can't measure a child, look at the result, and re-measure others accordingly. But some designs need exactly that shape of information — the classic: a Row of two texts separated by a divider, where the divider should match the *taller text's* height. The Row can't know that height until children measure, and can't re-measure the divider after. Deadlock with the one-measure rule.",
      },
      {
        t: "p",
        text: "**The mechanism**: intrinsics are a separate, lightweight *query* pass that doesn't count as measurement. Every layout node can answer four questions — min/max intrinsic width for a given height, min/max intrinsic height for a given width — computed recursively from its children (`Text` answers from its text metrics, a Row sums children's widths, etc.). `Modifier.height(IntrinsicSize.Max)` on the Row asks children \"what's the largest height you'd want?\", takes the max, and then runs the *real* single measure pass with that height as a fixed constraint. One query walk + one measure walk — the invariant survives.",
      },
      {
        t: "list",
        items: [
          "**Cost**: an extra recursive tree walk under the intrinsic-modified node, potentially per layout pass. Fine localized (a card, a row); a smell if wrapping whole screens or appearing inside frequently re-laid-out ancestors.",
          "**Accuracy caveat**: intrinsics are *estimates* computed outside real constraints — custom layouts that don't implement them sensibly (default falls back to measuring behavior approximations) can give wrong answers; if you write a serious custom Layout, consider overriding the intrinsic methods too.",
          "**Alternatives to name**: restructure so the design doesn't need it (often possible); `SubcomposeLayout` when the *composition itself* should depend on a measured size (heavier); or fixed heights from the design system when honesty allows.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "SubcomposeLayout: what is it, where does Compose itself use it, and why should you be reluctant to use it?",
    a: [
      {
        t: "p",
        text: "**The concept**: normally, *composition* (running your composables) fully finishes before *layout* (measuring) begins — layout can only rearrange what composition already created. `SubcomposeLayout` breaks that ordering deliberately: it lets you delay composing part of your content until **measure time**, so you can measure something first and then decide *what to compose* — even feeding one child's measured size into another child's composition as a parameter.",
      },
      {
        t: "list",
        items: [
          "**Where the framework uses it**: `LazyColumn`/`LazyRow`/grids — they can't compose a million items, so at measure time (knowing the viewport size) they subcompose only the visible slice, item by item, until the viewport fills. `Scaffold` — measures top/bottom bars first, then subcomposes content with the bars' sizes available as `paddingValues`. `BoxWithConstraints` — your lambda literally runs at measure time, which is how it can hand you real constraints during composition.",
          "**Why be reluctant**: cost and contract. Subcomposition runs composition machinery inside the measure phase — heavier than a normal measure, defeats some skipping optimizations, and content inside composes *later* than siblings (observable if you do effects at odd times). Most 'I need the size' impulses have cheaper answers: `BoxWithConstraints` gives available space; `onSizeChanged`/`onGloballyPositioned` report sizes after layout (fine for non-layout reactions); intrinsics handle match-the-sibling sizing.",
          "**The interview litmus**: reach for SubcomposeLayout only when *what to compose* genuinely depends on a measurement — building a lazy container, a 'measure A, size B from it' widget pair. If the composition set is fixed and only geometry varies, it's a custom `Layout`.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "Explain the Modifier.Node system — what actually happens to a modifier chain at runtime, and why was the older composed {} approach replaced?",
    a: [
      {
        t: "p",
        text: "**The concept**: `Modifier.padding(8.dp).clickable{}.background(Blue)` is, at face value, an immutable linked description — cheap to build, but something must turn it into working behavior on the UI tree. The modern runtime does this with **Modifier.Node**: each modifier *element* in the chain materializes a persistent **node** object attached to the composable's LayoutNode. Nodes are typed by capability — `LayoutModifierNode` participates in measurement, `DrawModifierNode` wraps drawing, `PointerInputModifierNode` joins hit-testing, `SemanticsModifierNode` contributes accessibility — and the chain of nodes is what the layout/draw/input systems actually traverse.",
      },
      {
        t: "p",
        text: "**The key property is persistence across recomposition**: when the chain 'changes', the runtime **diffs** the new element list against the existing nodes — unchanged elements keep their node (with all its internal state: gesture-in-progress, animation, focus), changed elements get an in-place `update()`, only added/removed elements create/destroy nodes. So recomposing with an equivalent chain costs near zero, and stateful modifiers don't lose state on recomposition.",
      },
      {
        t: "p",
        text: "**Why `composed {}` was retired for framework use**: the old way to make a stateful modifier was `Modifier.composed { remember { ... } }` — a modifier factory invoking *composition* per use site. That meant every element of every chain ran its own little composition (slot table entries, remember lookups), materialized fresh on every recomposition, unskippable, and unresolvable at chain-construction time. Measurably slow at scale — clickable/padding on thousands of nodes added real frame cost. Modifier.Node moves the state *into the node object* (no composition involved), enabling the diff-and-reuse machinery above; framework modifiers were migrated and custom stateful modifiers should use the `ModifierNodeElement` API today. Knowing this migration story — and that `composed {}` still works but is the slow path — is a genuine depth signal.",
      },
    ],
  },
  {
    level: "senior",
    q: "A design needs text aligned to another element's baseline, and a divider matching the tallest sibling. Which tools solve relational layout in Compose, and when is ConstraintLayout actually justified?",
    a: [
      {
        t: "list",
        items: [
          "**Baseline alignment**: Row's `verticalAlignment = Alignment.CenterVertically` is wrong for text pairs of different sizes — use `Modifier.alignByBaseline()` on the texts (Row scope), or `alignBy(FirstBaseline)`/`paddingFrom(FirstBaseline, ...)` for distance-from-baseline specs straight from redlines. Baselines propagate through the layout system as `AlignmentLine`s — custom layouts can expose their own.",
          "**Match-the-tallest sibling**: `Modifier.height(IntrinsicSize.Max)` on the Row + `fillMaxHeight()` on the divider — the intrinsic query gets the max desired height, the real pass fixes everyone to it.",
          "**Percentage/guideline positioning**: fractional sizes (`fillMaxWidth(0.4f)`), weights, or `BoxWithConstraints` arithmetic cover most 'guideline at 30%' cases without any library.",
          "**Overlap and anchoring**: Box with `align` + `offset`; `zIndex` for stacking order.",
        ],
      },
      {
        t: "p",
        text: "**ConstraintLayout's honest niche**: in Views it existed to flatten hierarchies because nesting was expensive — that rationale is void in Compose (single-pass measurement). It remains justified when the design is *inherently relational in ways the above don't express*: barriers (position after the longest of several elements), chains with complex distribution, many elements constrained to each other where nesting would obscure the relationships, or porting an existing complex XML screen where the constraint graph is the clearest spec. Even then it's a normal library choice, not a performance one — and that reframing ('in Compose, ConstraintLayout is about expressiveness, never performance') is exactly the sentence interviewers wait for.",
      },
    ],
  },
];

export default qa;
