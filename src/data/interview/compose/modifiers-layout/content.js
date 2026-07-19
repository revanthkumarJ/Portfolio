// Modifiers & Layout — Content tab. Teaching-first.

const content = [
  {
    heading: "Modifiers — what they are and how they really work",
    blocks: [
      {
        t: "p",
        text: "A **Modifier** is Compose's way of decorating or configuring a composable: sizing, padding, backgrounds, clicks, scrolling, drawing — all attach through the `modifier` parameter instead of dozens of constructor parameters or XML attributes. `Modifier.padding(16.dp).background(Blue)` builds an **ordered chain** of modifier elements; each element wraps the element after it, forming a pipeline the layout/draw/input systems walk from left to right.",
      },
      {
        t: "list",
        items: [
          "Modifiers are **immutable**: each call like `.padding(...)` returns a *new* chain — you can safely store, share and reuse them (`val cardModifier = Modifier...` reused across items is a real optimization).",
          "**Order is semantics, not style** — the single most-asked modifier fact. Each element applies to everything to its *right*: `padding` then `background` pads first, then paints inside the padded area; reversed, the background paints the full size and then content is inset.",
          "Under the hood (Modifier.Node system): the chain materializes into persistent node objects attached to the LayoutNode, each participating in the phases it cares about — layout modifiers adjust measurement, draw modifiers wrap drawing, pointer-input modifiers join hit testing. On recomposition the chain is *diffed* and nodes updated in place, which is why modifiers are cheap.",
        ],
      },
      {
        t: "code",
        title: "Order changes meaning — the classic quartet",
        code: `// 1) Background BEHIND the padding (paints full area, then insets content)
Modifier.background(Color.Blue).padding(16.dp)

// 2) Background INSIDE the padding (pads first, paints smaller area)
Modifier.padding(16.dp).background(Color.Blue)

// 3) Whole padded area clickable (ripple covers padding)
Modifier.clickable { }.padding(16.dp)

// 4) Only the inner content clickable (padding is dead space)
Modifier.padding(16.dp).clickable { }

// size constraints resolve left-to-right too:
Modifier.size(100.dp).size(50.dp)   // stays 100.dp — first size fixes
                                    // constraints; later ones can't override`,
      },
      {
        t: "note",
        text: "Convention interviewers check: every reusable composable should take a `modifier: Modifier = Modifier` as its **first optional parameter** and pass it to its **outermost** layout — so callers can size/pad/position your component without you predicting their needs. Accepting-but-ignoring the modifier, or applying it to an inner child, are the review bugs to name.",
      },
    ],
  },
  {
    heading: "The layout model: constraints down, sizes up, placement",
    blocks: [
      {
        t: "p",
        text: "Compose layout is a single-pass negotiation in three steps. Understanding it precisely unlocks every sizing question (\"why is fillMaxSize ignored here?\") and custom layouts:",
      },
      {
        t: "list",
        items: [
          "**1. Constraints go down**: a parent hands each child a `Constraints` object — `minWidth..maxWidth`, `minHeight..maxHeight` in pixels. `fillMaxWidth()` means \"take maxWidth\"; `wrapContentSize()` means \"prefer min\"; a fixed `size(50.dp)` *tries* to be 50 but is **coerced into the incoming constraints** — this coercion is the answer to most \"my size modifier is ignored\" mysteries.",
          "**2. Sizes go up**: each child measures itself within the constraints (measuring *its* children first, recursively) and reports one final size. A parent may measure each child **exactly once**.",
          "**3. Placement**: knowing all children's sizes, the parent positions each one (`placeable.place(x, y)`). Alignment, arrangement and offset all happen here.",
        ],
      },
      {
        t: "code",
        title: "Reading a constraints bug",
        code: `// Why is the Box not 50.dp? Because fillMaxSize already fixed
// constraints to exactly the parent size, and size() cannot escape
// the incoming min == max constraints:
Box(Modifier.fillMaxSize()) {
    Box(Modifier.fillMaxSize().size(50.dp)) { }  // still full size!
}

// requiredSize() is the escape hatch — it IGNORES incoming constraints
Box(Modifier.fillMaxSize().requiredSize(50.dp)) { } // truly 50.dp
// (parent still lays it out as if it were the constrained size;
// content visually overflows centered)`,
      },
    ],
  },
  {
    heading: "The standard layouts: Row, Column, Box — and their alignment vocabulary",
    blocks: [
      {
        t: "code",
        title: "The three workhorses",
        code: `Column(
    verticalArrangement = Arrangement.spacedBy(8.dp),   // main axis
    horizontalAlignment = Alignment.CenterHorizontally, // cross axis
) {
    Text("one")
    Text("two")
    Spacer(Modifier.weight(1f))   // weight: share leftover space
    Text("pinned to bottom")
}

Row(verticalAlignment = Alignment.CenterVertically) {
    Icon(Icons.Default.Star, contentDescription = null)
    Text("title", Modifier.weight(1f))   // takes all remaining width
    Text("meta")
}

Box {                                    // stacking (like FrameLayout)
    Image(painter, contentDescription = null)
    Text("badge", Modifier.align(Alignment.TopEnd))
}`,
      },
      {
        t: "list",
        items: [
          "**Arrangement** = distribution along the **main axis** (Column: vertical; Row: horizontal): `spacedBy`, `SpaceBetween`, `SpaceEvenly`, `Center`… **Alignment** = positioning on the **cross axis**. Mixing these up is the #1 layout-API confusion.",
          "**`weight(n)`** (Row/Column-scoped): children *without* weight measure first; leftover space is split among weighted children proportionally. `weight(1f, fill = false)` lets a child take *up to* its share. This replaces LinearLayout's layout_weight — and is also the idiomatic 'push to the end' tool (a weighted Spacer).",
          "Scoped modifiers are typed: `align()` exists only inside Box/Column/Row scopes, `weight()` only in Row/Column — the compiler stops you using them elsewhere (a nicety over XML worth mentioning).",
          "**Slot APIs**: composables taking composable lambdas as parameters (`TopAppBar(title = { ... }, actions = { ... })`, Scaffold's slots) — Compose's pattern for customizable containers; you'll be asked to *design* one for a component library question.",
        ],
      },
    ],
  },
  {
    heading: "Custom layouts with Layout — when Row/Column aren't enough",
    blocks: [
      {
        t: "p",
        text: "Any layout you can describe, you can implement with the `Layout` composable — the same primitive Row/Column are built on. You receive the children as `measurables` and the incoming `constraints`, and you implement the measure-place contract yourself:",
      },
      {
        t: "code",
        title: "A real custom layout: simple flow/chip layout that wraps lines",
        code: `@Composable
fun FlowRow(
    modifier: Modifier = Modifier,
    spacing: Dp = 8.dp,
    content: @Composable () -> Unit,
) {
    Layout(content = content, modifier = modifier) { measurables, constraints ->
        val gap = spacing.roundToPx()
        // 1) MEASURE each child once, with loose constraints
        val placeables = measurables.map { it.measure(constraints.copy(minWidth = 0, minHeight = 0)) }

        // 2) Break into rows against maxWidth
        var x = 0; var y = 0; var rowHeight = 0
        val positions = placeables.map { p ->
            if (x + p.width > constraints.maxWidth && x > 0) {
                x = 0; y += rowHeight + gap; rowHeight = 0
            }
            val pos = IntOffset(x, y)
            x += p.width + gap
            rowHeight = maxOf(rowHeight, p.height)
            pos
        }
        val totalHeight = (y + rowHeight).coerceIn(constraints.minHeight, constraints.maxHeight)

        // 3) Report size, then PLACE
        layout(constraints.maxWidth, totalHeight) {
            placeables.forEachIndexed { i, p -> p.place(positions[i]) }
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "The contract in words: measure every child **once**, decide your own size within `constraints`, call `layout(w, h) { ... }` and place children. That's the entire layout system — no onMeasure/onLayout pairs, no MeasureSpec bit-packing.",
          "**`SubcomposeLayout`**: for the rare case where composing one child depends on another's *measured size* (e.g. Scaffold measuring bars before content) — it defers *composition* of some content until measure time. Heavier; use only when measurement genuinely drives what to compose (this is also how LazyColumn composes only visible items).",
          "**Intrinsic measurements** (`Modifier.height(IntrinsicSize.Max)` etc.): pre-query 'what size would you want?' without consuming the single measure — for match-the-tallest-sibling cases. Costs an extra tree walk; fine when localized.",
          "`Modifier.layout { measurable, constraints -> ... }` is the single-child version — for tweaking one child's measurement/placement without a full Layout (e.g. custom baseline padding).",
        ],
      },
    ],
  },
  {
    heading: "Common modifier families you must be fluent in",
    blocks: [
      {
        t: "table",
        headers: ["Family", "Members", "Notes / gotchas"],
        rows: [
          ["Size", "`size`, `fillMaxWidth/Height/Size`, `wrapContentSize`, `requiredSize`, `sizeIn`, `aspectRatio`", "`size` obeys incoming constraints; `requiredSize` overrides them; `fillMaxWidth(0.5f)` takes a fraction"],
          ["Spacing", "`padding`", "there is no margin — outer spacing is just padding placed earlier in the chain, or parent `spacedBy`"],
          ["Drawing", "`background`, `border`, `clip`, `shadow`, `alpha`, `drawBehind`, `drawWithContent`, `graphicsLayer`", "`clip(RoundedCornerShape(...))` must come *before* `background` to round it; `graphicsLayer` changes render without re-layout"],
          ["Interaction", "`clickable`, `combinedClickable`, `toggleable`, `selectable`, `pointerInput`", "`clickable` adds ripple + semantics + focus; raw `pointerInput` gives gesture detectors but no accessibility for free"],
          ["Scroll", "`verticalScroll(rememberScrollState())`, `horizontalScroll`", "composes ALL children (unlike lazy lists); gives content infinite max height — nesting a LazyColumn inside is the classic crash"],
          ["Position", "`offset` (and its lambda form), `zIndex`, `align` (scoped)", "`offset` moves placement without affecting measurement of siblings; lambda form defers the state read to layout phase"],
        ],
      },
      {
        t: "note",
        text: "Two chain-reading rules that resolve most puzzles: (1) each modifier wraps what's to its right — read left = outermost; (2) constraints only tighten as they travel right — once fixed, later size modifiers can't loosen them (except the `required*` family).",
      },
    ],
  },
  {
    heading: "ConstraintLayout in Compose — and why you rarely need it",
    blocks: [
      {
        t: "p",
        text: "`ConstraintLayout` exists in Compose (separate artifact) with references and constraint DSL. But its *original reason to exist* — avoiding nested-layout double measurement in the View system — is gone: Compose measures in a single pass, so **nesting Rows/Columns is cheap and idiomatic**. Reach for ConstraintLayout only for genuinely relational designs (align this to that's baseline across branches, barrier/chain behavior, guideline percentages), not as the default screen scaffold. Saying exactly this — with the *why* — is a well-known interview checkpoint.",
      },
    ],
  },
  {
    heading: "BoxWithConstraints and adaptive layouts",
    blocks: [
      {
        t: "code",
        title: "Responding to available space",
        code: `BoxWithConstraints {
    if (maxWidth < 600.dp) {
        CompactList()
    } else {
        Row {
            ListPane(Modifier.weight(1f))
            DetailPane(Modifier.weight(2f))
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "`BoxWithConstraints` exposes the incoming constraints *during composition* — letting you compose different trees per available size. Cost: it's built on SubcomposeLayout (composition deferred to measure), so don't sprinkle it everywhere; use it at adaptive-layout decision points.",
          "For app-level adaptivity prefer **WindowSizeClass** (compact/medium/expanded buckets from Material3-adaptive) — decisions follow the window, not any one box, and it standardizes breakpoints for phones/foldables/tablets.",
          "Related: `Spacer` for pure space, `Surface` for themed containers (color/elevation/shape + content color propagation), `Scaffold` for screen chrome (app bars, FAB, snackbar host) with correct insets via its `paddingValues` — forgetting to apply Scaffold's padding to content is a favorite \"spot the bug\".",
        ],
      },
    ],
  },
];

export default content;
