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
  {
    level: "junior",
    q: "Which Modifiers should every Compose developer know by heart?",
    a: [
      {
        t: "p",
        text: "Modifiers decorate a composable — sizing, spacing, background, click handling, and more. A handful cover the vast majority of UI. Knowing them (and that *order matters*) lets you build most layouts without reaching for anything exotic.",
      },
      {
        t: "list",
        items: [
          "**Sizing** — `size`, `fillMaxWidth`/`fillMaxHeight`/`fillMaxSize`, `width`/`height`, `weight` (in Row/Column), `wrapContentSize`.",
          "**Spacing** — `padding` (there's no margin; padding + a `Spacer` do it all).",
          "**Appearance** — `background`, `clip`, `border`, `alpha`, `graphicsLayer`.",
          "**Interaction** — `clickable`, `pointerInput`, `scrollable`/`verticalScroll`.",
          "**Positioning** — `offset`, `align` (in a Box scope), `zIndex`.",
          "**Measurement callbacks** — `onGloballyPositioned`, `onSizeChanged`.",
        ],
      },
      {
        t: "code",
        title: "A typical chain",
        code: `Text(
    "Hi",
    modifier = Modifier
        .fillMaxWidth()
        .padding(16.dp)          // outer space (order matters!)
        .background(Color.Blue)  // painted inside the padding
        .clip(RoundedCornerShape(8.dp))
        .clickable { onClick() }
        .padding(12.dp),         // inner space between bg edge and text
)`,
      },
      {
        t: "note",
        text: "Core Modifiers: sizing (size/fillMax*/weight), spacing (padding + Spacer — no margins), appearance (background/clip/border), interaction (clickable/pointerInput), positioning (offset/align/zIndex). Order matters — each wraps the next.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between size, requiredSize, fillMaxSize, and wrapContentSize?",
    a: [
      {
        t: "p",
        text: "These all affect sizing but interact with parent *constraints* differently. The key insight: `size` is a *preference* the parent can override via constraints, `requiredSize` *forces* a size ignoring parent constraints, `fillMaxSize` takes all available space, and `wrapContentSize` shrinks to content and can re-center within a larger bound.",
      },
      {
        t: "list",
        items: [
          "**`size(100.dp)`** — asks for 100dp, but the parent's constraints win; if the parent forces min 200dp, you get 200dp.",
          "**`requiredSize(100.dp)`** — forces exactly 100dp even if it violates parent constraints (the child may then be clipped or overflow). Use sparingly.",
          "**`fillMaxSize()`** — expand to the maximum the parent allows (needs a bounded parent; inside an infinite-height scroll it can crash/misbehave).",
          "**`wrapContentSize()`** — measure the child at its content size within the incoming constraints, then position it (default center) in the leftover space — handy to center a small child inside a `fillMaxSize` parent.",
        ],
      },
      {
        t: "code",
        title: "size vs requiredSize under a constraining parent",
        code: `Box(Modifier.size(50.dp)) {                 // parent forces 50dp
    Box(Modifier.size(100.dp))              // -> becomes 50dp (constraint wins)
    Box(Modifier.requiredSize(100.dp))      // -> stays 100dp (overflows the 50dp box)
}`,
      },
      {
        t: "note",
        text: "size = preferred (parent constraints can override); requiredSize = forced (ignores parent, may overflow); fillMaxSize = take all available (needs bounded parent); wrapContentSize = shrink to content and re-position in leftover space. 'size can be overridden' trips people up constantly.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do Constraints work in Compose layout (min/max, bounded, infinity)?",
    a: [
      {
        t: "p",
        text: "`Constraints` are the bounds a parent passes to a child during measurement: `minWidth`, `maxWidth`, `minHeight`, `maxHeight`. The child must choose a size *within* these bounds. This is the core of Compose's single-pass layout: constraints flow *down*, chosen sizes flow *up*.",
      },
      {
        t: "list",
        items: [
          "**Bounded** — a finite max (e.g. maxWidth = screen width). `fillMaxWidth` picks maxWidth.",
          "**Unbounded / infinity** — `Constraints.Infinity` max (e.g. the child of a vertically scrolling Column has infinite max height — it can be as tall as it wants). `fillMaxHeight` in an infinite-height parent is meaningless/crashes, which is why you can't put a `fillMaxSize` or nested `LazyColumn` directly in a `verticalScroll` Column.",
          "**Exact (tight) constraints** — min == max, forcing a specific size (what `size()` produces for its child when it resolves).",
          "**Modifiers reshape constraints** — `padding` shrinks the max passed down; `size` tightens them; `fillMax*` reads the max.",
        ],
      },
      {
        t: "code",
        title: "Reading constraints in a custom layout",
        code: `Layout(content) { measurables, constraints ->
    // constraints.maxWidth may be a finite number or Constraints.Infinity
    val childConstraints = constraints.copy(minWidth = 0)  // loosen min
    val placeables = measurables.map { it.measure(childConstraints) }
    layout(constraints.maxWidth, placeables.maxOf { it.height }) { /* place */ }
}`,
      },
      {
        t: "note",
        text: "Constraints (min/max width & height) flow down; chosen sizes flow up — one pass. Bounded = finite max; unbounded = Constraints.Infinity (a scroll child's cross-axis). fillMax* in an infinite dimension is undefined — that's why fillMaxHeight/nested LazyColumn breaks inside verticalScroll.",
      },
    ],
  },
  {
    level: "junior",
    q: "When do you use Box vs Row vs Column?",
    a: [
      {
        t: "p",
        text: "These are the three fundamental layout composables. `Column` stacks children vertically, `Row` stacks them horizontally, and `Box` overlaps children on top of each other (z-stacked). Choosing among them is the first decision in any layout.",
      },
      {
        t: "list",
        items: [
          "**`Column`** — vertical stack. Use `verticalArrangement` (spacing/distribution along the main axis) and `horizontalAlignment` (cross-axis).",
          "**`Row`** — horizontal stack. `horizontalArrangement` + `verticalAlignment`.",
          "**`Box`** — overlap children; later children draw on top. Use `contentAlignment` and per-child `Modifier.align()` to position. Great for badges, overlays, backgrounds behind content, centering a single child.",
        ],
      },
      {
        t: "code",
        title: "Box for overlap, Column/Row for stacks",
        code: `Box(contentAlignment = Alignment.Center) {          // overlap + center
    Image(...)                                       // background layer
    CircularProgressIndicator()                      // on top, centered
    Text("NEW", Modifier.align(Alignment.TopEnd))    // badge in a corner
}
Column(verticalArrangement = Arrangement.spacedBy(8.dp)) { /* vertical list */ }
Row(horizontalArrangement = Arrangement.SpaceBetween) { /* horizontal bar */ }`,
      },
      {
        t: "note",
        text: "Column = vertical stack, Row = horizontal stack, Box = overlapping z-stack (later children on top, align per child). Box is the go-to for overlays, badges, backgrounds, and centering a single child. They're the flex/frame equivalents of Compose.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does Modifier.clickable work, and how do you customize or remove the ripple?",
    a: [
      {
        t: "p",
        text: "`Modifier.clickable` makes any composable respond to taps: it adds click handling, a ripple indication, accessibility semantics (role, focus), and keyboard/D-pad support. Because it's a modifier, you can make *anything* clickable — a Box, an Image, a Row — not just buttons.",
      },
      {
        t: "code",
        title: "clickable and controlling the ripple",
        code: `// Default: includes ripple + a11y
Modifier.clickable { onClick() }

// With role/label for accessibility
Modifier.clickable(
    onClickLabel = "Open profile",
    role = Role.Button,
) { onClick() }

// Remove the ripple (e.g. for a custom-drawn press effect):
val interaction = remember { MutableInteractionSource() }
Modifier.clickable(
    interactionSource = interaction,
    indication = null,     // no ripple
) { onClick() }`,
      },
      {
        t: "list",
        items: [
          "**Adds more than onClick** — ripple `indication`, semantics (`Role.Button`), focus, and enabled state.",
          "**Customize the ripple** — pass a custom `indication` (e.g. `ripple(bounded = false, color = ...)`), or `null` to disable.",
          "**Use `combinedClickable`** for long-press/double-tap; use `pointerInput` + `detectTapGestures` for fully custom gesture handling.",
          "**Accessibility caveat** — if you strip semantics or use raw `pointerInput`, you may lose the button role/label; add `Modifier.semantics` back.",
        ],
      },
      {
        t: "note",
        text: "Modifier.clickable adds tap handling + ripple + accessibility (role/focus/keyboard) to any composable. Customize via indication (custom ripple or null to remove) and an InteractionSource; combinedClickable for long-press/double-tap. Don't lose a11y semantics with raw pointerInput.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do clip, background, and border interact, and why does their order matter?",
    a: [
      {
        t: "p",
        text: "`clip(shape)` restricts drawing (and touch) to a shape; `background(color, shape)` paints a shape; `border(width, color, shape)` draws an outline. Because modifiers wrap outward-in, the order determines whether the background/border respects the clip and where padding sits relative to them.",
      },
      {
        t: "code",
        title: "Ordering shapes correctly",
        code: `// Rounded card: clip first so background AND content are rounded
Modifier
    .clip(RoundedCornerShape(12.dp))   // everything after is clipped to rounded
    .background(Color.White)
    .border(1.dp, Color.Gray, RoundedCornerShape(12.dp))
    .padding(16.dp)                    // inner content padding

// background(color, shape) is shorthand that paints a shape without clipping content
Modifier.background(Color.White, RoundedCornerShape(12.dp))`,
      },
      {
        t: "list",
        items: [
          "**`clip` before `background`/content** — so both the fill and the children are rounded. Clipping after background rounds nothing you already painted.",
          "**`background(color, shape)`** paints a shape but does *not* clip child content — use `clip` if children (like an Image) must be rounded too.",
          "**Padding position** — padding *before* background = space outside the colored area; padding *after* = space between the background edge and content.",
        ],
      },
      {
        t: "note",
        text: "clip restricts drawing to a shape; background paints one; border outlines one. Put clip first so background AND children are clipped to the shape. background(color, shape) paints but doesn't clip content — use clip for rounded images. Padding before vs after background changes what's spaced.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you build a responsive layout that adapts to available width?",
    a: [
      {
        t: "p",
        text: "Compose gives you the available space at layout time, and you adapt by reading it. The main tools are `BoxWithConstraints` (exposes the incoming constraints so you can branch on `maxWidth`), `WindowSizeClass` (standardized breakpoints for phone/tablet/desktop), and adaptive layout APIs. You branch on size to choose one-pane vs two-pane, grid columns, etc.",
      },
      {
        t: "code",
        title: "BoxWithConstraints and WindowSizeClass",
        code: `BoxWithConstraints {
    if (maxWidth < 600.dp) {
        SinglePaneList()          // phone
    } else {
        Row { ListPane(); DetailPane() }   // tablet: two panes
    }
}

// App-level: WindowSizeClass gives semantic breakpoints
val widthClass = windowSizeClass.widthSizeClass
when (widthClass) {
    WindowWidthSizeClass.Compact -> CompactLayout()
    WindowWidthSizeClass.Medium, WindowWidthSizeClass.Expanded -> WideLayout()
}`,
      },
      {
        t: "list",
        items: [
          "**`BoxWithConstraints`** — local, gives `minWidth`/`maxWidth`/etc. of *this* slot; good for a single component's responsiveness. Note it uses SubcomposeLayout, so it's slightly heavier.",
          "**`WindowSizeClass`** — app/screen-level standardized breakpoints (Compact/Medium/Expanded); better for top-level navigation decisions.",
          "**Adaptive APIs** — `androidx.compose.material3.adaptive` (list-detail, supporting-pane scaffolds) for canonical responsive patterns.",
        ],
      },
      {
        t: "note",
        text: "Adapt to size with BoxWithConstraints (local maxWidth branching — uses SubcomposeLayout, slightly heavier) or WindowSizeClass (app-level Compact/Medium/Expanded breakpoints for navigation). Material3 adaptive scaffolds give canonical list-detail patterns. Branch on size, don't hardcode.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why can't you read a composable's size during composition, and how do you get it?",
    a: [
      {
        t: "p",
        text: "Composition (building the tree) happens *before* layout (measuring/placing), so at composition time nothing has a size yet — the size doesn't exist until the layout phase runs. To get an actual pixel size you must wait for layout and read it via a callback modifier, then (if you need to react in UI) store it in state.",
      },
      {
        t: "code",
        title: "onSizeChanged / onGloballyPositioned",
        code: `var sizePx by remember { mutableStateOf(IntSize.Zero) }
Box(
    Modifier.onSizeChanged { sizePx = it }   // called after layout, gives the measured size
) { /* content */ }

// onGloballyPositioned also gives position in window/root coordinates:
Modifier.onGloballyPositioned { coords -> val bounds = coords.boundsInWindow() }`,
      },
      {
        t: "list",
        items: [
          "**Phase ordering** — composition → layout → draw. Size is a layout-phase result, unknown during composition.",
          "**`onSizeChanged`** — gives the measured size after layout; store it in state to use it in composition next frame.",
          "**`onGloballyPositioned`** — gives size *and* position (coordinates), useful for anchoring popups or measuring relative positions.",
          "**Beware feedback loops** — reading size into state that changes size can loop; and this adds a frame of latency. Prefer a custom `Layout` or intrinsics when you need size *during* layout, not after.",
        ],
      },
      {
        t: "note",
        text: "Size is a layout-phase result; composition runs first, so no size exists yet. Read it after layout via onSizeChanged (size) or onGloballyPositioned (size + position), storing in state. Watch for feedback loops and the one-frame lag; use a custom Layout/intrinsics when you need size during layout.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does Modifier.graphicsLayer do, and when should you prefer it?",
    a: [
      {
        t: "p",
        text: "`Modifier.graphicsLayer` applies transformations (translation, scale, rotation, alpha, clip, shadow) by drawing the composable into a separate render layer. Crucially, these transforms happen in the *draw* phase without re-triggering layout — so animating them is cheap. It's the performant way to animate movement, fades, and scaling.",
      },
      {
        t: "code",
        title: "graphicsLayer for cheap animation",
        code: `val scale by animateFloatAsState(if (pressed) 0.95f else 1f)
Box(
    Modifier.graphicsLayer {
        scaleX = scale; scaleY = scale     // draw-phase only — no relayout per frame
        alpha = 0.9f
        rotationZ = 10f
    }
)
// vs Modifier.offset/size in an animation -> re-runs layout every frame (more costly)`,
      },
      {
        t: "list",
        items: [
          "**Draw-phase transforms** — translation/scale/rotation/alpha skip layout, so per-frame animation is cheap (no remeasure).",
          "**Lambda form** — `graphicsLayer { }` reads animated state *inside* the lambda, deferring the state read to the draw phase (avoids recomposition/relayout).",
          "**Also does** — `clip = true` + `shape`, `shadowElevation`, `compositingStrategy` (offscreen buffer for alpha over overlapping content).",
          "**Prefer over `offset`/`size` for animation** — animating `offset`/`size` re-runs layout each frame; `graphicsLayer.translationX`/`scale` doesn't.",
        ],
      },
      {
        t: "note",
        text: "graphicsLayer applies scale/rotation/translation/alpha/shadow in the DRAW phase — no relayout, so animating it is cheap. Use the lambda form to defer the state read to draw. Prefer graphicsLayer.translationX/scale over animating offset/size (which re-runs layout every frame).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you conditionally apply modifiers, and what is Modifier.then?",
    a: [
      {
        t: "p",
        text: "Because a `Modifier` is an immutable, chainable value, you can build it conditionally like any expression. `Modifier.then(other)` concatenates two modifier chains. The clean pattern is to conditionally append a modifier (or `Modifier` — the no-op identity — when the condition is false).",
      },
      {
        t: "code",
        title: "Conditional modifiers",
        code: `Modifier
    .fillMaxWidth()
    .then(if (selected) Modifier.border(2.dp, Color.Blue) else Modifier)  // Modifier = no-op

// A common helper for readability:
fun Modifier.conditional(condition: Boolean, block: Modifier.() -> Modifier) =
    if (condition) this.then(block()) else this

Modifier.conditional(selected) { border(2.dp, Color.Blue) }`,
      },
      {
        t: "list",
        items: [
          "**`Modifier` (bare) is the identity** — a no-op you can substitute when a condition is false.",
          "**`then`** concatenates chains; useful for merging a passed-in `modifier` parameter with local ones — always apply the caller's `modifier` at the right spot.",
          "**Watch ordering** — where you insert the conditional modifier in the chain still matters (padding vs background etc.).",
          "**Don't over-engineer** — a plain `if (x) Modifier.a() else Modifier` inside `.then()` is perfectly idiomatic.",
        ],
      },
      {
        t: "note",
        text: "Modifiers are immutable values, so build them conditionally: `.then(if (cond) Modifier.x() else Modifier)` — bare `Modifier` is the no-op identity. A `Modifier.conditional{}` extension reads nicely. Ordering within the chain still matters.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between offset and padding for moving a composable?",
    a: [
      {
        t: "p",
        text: "Both can shift a composable, but they work in different phases and have different effects on layout. `padding` reserves space and pushes neighbors (it changes the element's laid-out bounds); `offset` moves the element *visually* during placement without affecting the space it reserved, so it can overlap neighbors.",
      },
      {
        t: "list",
        items: [
          "**`padding`** — layout-affecting; adds space that displaces siblings and shrinks the child's available area. Use for genuine spacing.",
          "**`offset(x, y)`** — placement-phase shift; the element occupies its original slot but is drawn shifted, so it can overlap adjacent content. Use for nudging/overlap effects.",
          "**`absoluteOffset`** — like offset but ignores layout direction (LTR/RTL).",
          "**`graphicsLayer { translationX = }`** — draw-phase move, best for *animated* movement (cheapest, no relayout).",
        ],
      },
      {
        t: "code",
        title: "offset overlaps; padding displaces",
        code: `Modifier.padding(start = 20.dp)   // pushes the element right, moves neighbors
Modifier.offset(x = 20.dp)        // draws it 20dp right, neighbors unaffected (may overlap)
Modifier.graphicsLayer { translationX = animatedX }  // animated move, no relayout`,
      },
      {
        t: "note",
        text: "padding reserves space and displaces siblings (layout-affecting); offset shifts placement visually without changing reserved space (can overlap); graphicsLayer.translationX is the cheapest for animated movement (draw-phase). Pick by whether neighbors should move.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you create a reusable custom modifier, and why prefer Modifier.Node over composed{}?",
    a: [
      {
        t: "p",
        text: "A reusable modifier is just an extension function on `Modifier` that appends behavior. For *stateless* combinations, a plain factory function is enough. For modifiers that need their own state, coordinate access, or lifecycle, the modern approach is a `Modifier.Node` implementation, which replaced the older `composed { }` factory because `composed` was slow (it created a composition per usage and defeated skipping/reuse).",
      },
      {
        t: "code",
        title: "Simple factory vs Modifier.Node",
        code: `// Simple, stateless: just chain existing modifiers
fun Modifier.card() = this
    .clip(RoundedCornerShape(12.dp))
    .background(Color.White)
    .padding(16.dp)

// Stateful / needs draw or pointer access: Modifier.Node (modern, performant)
// class MyNode : Modifier.Node(), DrawModifierNode { override fun ContentDrawScope.draw() {...} }
// then a ModifierNodeElement to create/update it.`,
      },
      {
        t: "list",
        items: [
          "**Plain extension function** — for composing existing modifiers with no new state. Cheap, idiomatic.",
          "**`Modifier.Node` + `ModifierNodeElement`** — for custom draw/layout/pointer/focus behavior or per-usage state. Nodes are allocated once and *updated* in place (not recreated), avoiding recomposition.",
          "**Why not `composed { }`** — it ran a composable per modifier application, breaking modifier reuse/skipping and hurting performance. `Modifier.Node` is the official replacement.",
        ],
      },
      {
        t: "note",
        text: "Reusable modifier = extension fn on Modifier. Stateless combos: a plain factory. Stateful/custom draw-layout-pointer: Modifier.Node + ModifierNodeElement (allocated once, updated in place). Avoid the old composed{} — it spun up a composition per use and killed reuse/skipping.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Modifier.matchParentSize inside a Box, and how does it differ from fillMaxSize?",
    a: [
      {
        t: "p",
        text: "Inside a `Box`, `Modifier.matchParentSize()` sizes a child to match the Box's size *without influencing* that size. `fillMaxSize()` fills the max available and *does* participate in measuring. The difference matters when the Box sizes itself to its content: `matchParentSize` won't inflate the Box, `fillMaxSize` can.",
      },
      {
        t: "code",
        title: "matchParentSize for backgrounds",
        code: `Box {
    // This child DECIDES the Box size (e.g. the content):
    Text("Some content of variable size")
    // A background that matches the Box without affecting its size:
    Box(Modifier.matchParentSize().background(Color.LightGray))   // sits behind, same size
    // fillMaxSize() here would try to fill max constraints and could blow up the Box
}`,
      },
      {
        t: "list",
        items: [
          "**`matchParentSize`** — Box-scope only; measured *after* the Box knows its size, so it matches without contributing to sizing. Perfect for a background layer behind content.",
          "**`fillMaxSize`** — participates in measurement, filling the incoming max constraints; if it's the only child, the Box becomes max-sized.",
          "**Draw order** — put the background child before content (earlier = behind), or it covers the content.",
        ],
      },
      {
        t: "note",
        text: "matchParentSize (Box-scope) sizes a child to the Box WITHOUT affecting the Box's size — ideal for a background behind variable content. fillMaxSize participates in measuring and fills max constraints (can inflate the Box). Order children so the background draws first.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle safe areas, insets, and the status/navigation bars in Compose?",
    a: [
      {
        t: "p",
        text: "With edge-to-edge display (default on modern Android), your content draws behind the system bars, so you must apply *window insets* to avoid content hiding under the status bar, navigation bar, or IME (keyboard). Compose exposes insets via the `WindowInsets` API and helper modifiers.",
      },
      {
        t: "code",
        title: "Applying insets",
        code: `// Pad content away from system bars:
Modifier.windowInsetsPadding(WindowInsets.systemBars)
// Common shortcuts:
Modifier.statusBarsPadding()
Modifier.navigationBarsPadding()
Modifier.imePadding()              // move content above the keyboard
Modifier.safeDrawingPadding()      // all of the above combined

// Scaffold applies insets for you and passes contentPadding:
Scaffold { innerPadding -> Content(Modifier.padding(innerPadding)) }`,
      },
      {
        t: "list",
        items: [
          "**Edge-to-edge is the default** — `enableEdgeToEdge()`; content goes behind bars, so insets are your responsibility.",
          "**Inset modifiers** — `statusBarsPadding`, `navigationBarsPadding`, `imePadding`, `safeDrawingPadding`, or the general `windowInsetsPadding(insets)`.",
          "**`Scaffold` handles most of it** — apply the `innerPadding` it gives you; ignoring it causes content under the app bar.",
          "**`consumeWindowInsets`** — prevents double-applying insets in nested scrollables.",
        ],
      },
      {
        t: "note",
        text: "Edge-to-edge draws behind system bars, so apply WindowInsets: statusBarsPadding/navigationBarsPadding/imePadding/safeDrawingPadding, or windowInsetsPadding(insets). Scaffold gives innerPadding — always apply it. Use consumeWindowInsets to avoid double-padding in nested scrolls.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does Modifier.zIndex do, and how is draw order determined in Compose?",
    a: [
      {
        t: "p",
        text: "By default, Compose draws children in *declaration order* — later children (and later modifiers) draw on top. `Modifier.zIndex(z)` overrides this within a layout, letting a child draw above siblings regardless of its declaration order, without reordering the layout itself.",
      },
      {
        t: "list",
        items: [
          "**Default order = declaration order** — in a Box, the last-declared child is on top. Often the simplest fix is just reordering children.",
          "**`Modifier.zIndex(z)`** — higher z draws later (on top); affects *drawing* within the same parent, not measurement/placement.",
          "**Scope** — zIndex only compares siblings in the same layout; it doesn't let a child escape its parent's stacking.",
          "**Elevation/shadow** — `graphicsLayer { shadowElevation = }` or Material elevation also creates visual depth (and can affect draw order via elevation overlays).",
        ],
      },
      {
        t: "code",
        title: "zIndex to lift a child",
        code: `Box {
    Card(Modifier.zIndex(1f)) { /* draws above */ }
    Overlay()                       // declared later but drawn below due to zIndex above
}`,
      },
      {
        t: "note",
        text: "Draw order defaults to declaration order (later = on top). Modifier.zIndex(z) overrides draw order among siblings (higher = on top) without reordering layout. It only compares siblings in the same parent. Often just reordering children is simpler than zIndex.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do alignment lines (like baselines) work, and how do you use them for relational layout?",
    a: [
      {
        t: "p",
        text: "An *alignment line* is a horizontal or vertical line a composable exposes so parents can align other composables to it — the most common being text `FirstBaseline`/`LastBaseline`. Layouts read children's alignment lines during measurement and can position siblings relative to them, enabling things like aligning a label's baseline to a value's baseline.",
      },
      {
        t: "code",
        title: "Aligning to a baseline",
        code: `Row {
    Text("42", fontSize = 32.sp, modifier = Modifier.alignByBaseline())
    Text("points", fontSize = 14.sp, modifier = Modifier.alignByBaseline())  // baselines line up
}

// Custom: read a child's baseline in a Layout
Layout(content) { measurables, constraints ->
    val p = measurables.first().measure(constraints)
    val baseline = p[FirstBaseline]        // access the alignment line value
    layout(p.width, p.height) { p.place(0, 0) }
}`,
      },
      {
        t: "list",
        items: [
          "**`alignByBaseline()`** in a Row aligns children's text baselines — crucial for mixed font sizes looking correct.",
          "**`paddingFromBaseline`** sets distance from a baseline (Material spacing specs use this).",
          "**Custom alignment lines** — you can define your own with `AlignmentLine` and expose them from a custom layout for advanced relational positioning.",
          "**Reading them costs a measure** — accessing an alignment line forces measuring that child, so use judiciously.",
        ],
      },
      {
        t: "note",
        text: "Alignment lines (esp. text FirstBaseline/LastBaseline) let parents position siblings relative to a child's line. Use alignByBaseline() in a Row for mixed font sizes, paddingFromBaseline for spec spacing. You can define custom AlignmentLines. Reading one forces measuring that child.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Spacer, and when do you use it versus padding or Arrangement.spacedBy?",
    a: [
      {
        t: "p",
        text: "`Spacer` is an empty composable that just occupies space — you give it a size and it creates a gap. It's one of three ways to create spacing (alongside `padding` and `Arrangement.spacedBy`), each suited to a different situation.",
      },
      {
        t: "list",
        items: [
          "**`Spacer(Modifier.height(8.dp))`** — an explicit, one-off gap between two specific elements. Also `Spacer(Modifier.weight(1f))` to push elements apart (fill remaining space).",
          "**`Arrangement.spacedBy(8.dp)`** — uniform gaps between *all* children of a Row/Column; cleaner than a Spacer between each item.",
          "**`padding`** — space around a single element (inside or outside), independent of siblings.",
        ],
      },
      {
        t: "code",
        title: "Three spacing tools",
        code: `Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {   // uniform gaps
    ItemA(); ItemB(); ItemC()
}
Row {
    Text("Left")
    Spacer(Modifier.weight(1f))   // push next item to the far right
    Text("Right")
}`,
      },
      {
        t: "note",
        text: "Spacer is an empty sized composable for one-off gaps (or Spacer(Modifier.weight(1f)) to push items apart). Prefer Arrangement.spacedBy for uniform gaps between all children; padding for space around a single element. There are no margins — these three cover all spacing.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Modifier.layout work, and how is it different from the Layout composable?",
    a: [
      {
        t: "p",
        text: "`Modifier.layout { measurable, constraints -> }` lets you customize the measurement and placement of a *single* composable inline, without writing a whole custom `Layout`. You measure the (one) incoming measurable, then report a size and place it — adjusting position or reported size. Use it for one-off tweaks; use the `Layout` composable when you're arranging *multiple* children.",
      },
      {
        t: "code",
        title: "Modifier.layout for a custom padding-like effect",
        code: `fun Modifier.firstBaselineToTop(top: Dp) = layout { measurable, constraints ->
    val placeable = measurable.measure(constraints)
    val baseline = placeable[FirstBaseline]
    val placeableY = top.roundToPx() - baseline
    val height = placeable.height + placeableY
    layout(placeable.width, height) { placeable.placeRelative(0, placeableY) }
}`,
      },
      {
        t: "list",
        items: [
          "**`Modifier.layout`** — one measurable in, one placeable out; customize a single element's size/position inline.",
          "**`Layout` composable** — multiple children (`measurables`), you measure and place all of them; for building new layout containers (a custom flow row, a radial menu).",
          "**Both follow the same contract** — measure children within constraints, call `layout(width, height) { place... }`.",
        ],
      },
      {
        t: "note",
        text: "Modifier.layout customizes ONE composable's measure/placement inline (one measurable → one placeable). The Layout composable arranges MULTIPLE children into a new container. Same contract (measure within constraints, then layout(w,h){ place }). Reach for Modifier.layout for one-off tweaks.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is contentPadding in scrollable containers, and why not just use Modifier.padding?",
    a: [
      {
        t: "p",
        text: "Scrollable containers like `LazyColumn` take a `contentPadding` parameter that adds padding *inside* the scroll area — around the items — while still letting items scroll into that padded region. `Modifier.padding` on the LazyColumn instead pads the *whole viewport*, clipping items at the padded edge so they can't scroll through it.",
      },
      {
        t: "list",
        items: [
          "**`contentPadding`** — space at the start/end (and sides) of the scrollable content; the first/last items can scroll fully into view *past* the padding, and content is clipped at the true container edge (nice fade-at-edge behavior).",
          "**`Modifier.padding`** — shrinks the scroll viewport itself; items are clipped at the padded boundary, so you lose the 'scroll under the edge' effect and the first item starts inset permanently.",
          "**Common use** — `contentPadding = PaddingValues(vertical = 16.dp)` gives breathing room at top/bottom of a list without clipping mid-scroll; also used to offset for a floating app bar / FAB.",
        ],
      },
      {
        t: "code",
        title: "contentPadding vs Modifier.padding",
        code: `LazyColumn(
    contentPadding = PaddingValues(16.dp),   // items scroll through this space, clipped at edge
) { items(list) { Row(it) } }

// vs — pads the viewport, items clipped at 16dp inset, no scroll-under:
LazyColumn(Modifier.padding(16.dp)) { /* ... */ }`,
      },
      {
        t: "note",
        text: "contentPadding pads INSIDE a scrollable — items scroll through it and clip at the true edge (breathing room top/bottom, offset for FAB/app bar). Modifier.padding shrinks the viewport, clipping items at the inset and killing the scroll-under effect. Use contentPadding for list edges.",
      },
    ],
  },
];

export default qa;
