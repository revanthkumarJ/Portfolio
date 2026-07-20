// Theming & Animation — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "How does theming work in Jetpack Compose?",
    a: [
      {
        t: "p",
        text: "**The concept**: instead of global XML style attributes resolved through a `Context`, Compose provides theme values *implicitly down the composition tree* using **CompositionLocal**. `MaterialTheme` is a composable that wraps your app and provides three things to everything inside it — a `ColorScheme`, a `Typography`, and `Shapes`. Any composable below can read them through the `MaterialTheme` accessor: `MaterialTheme.colorScheme.primary`, `MaterialTheme.typography.bodyLarge`.",
      },
      {
        t: "p",
        text: "**Why this is nice**: the theme is 'ambient' — a `Text` deep in the tree reads the current color without anyone passing it down. And because reading a theme value is a *state read*, toggling light↔dark automatically recomposes exactly the composables that used the changed values — reactive theming with no manual work. You also style by *semantic role* (`onSurface` = content on a surface) rather than raw colors, so the same components render correctly across light, dark, and dynamic themes without separate layouts.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is CompositionLocal and when should you use it?",
    a: [
      {
        t: "p",
        text: "**The concept**: a CompositionLocal is a mechanism to pass data implicitly through the composition — you *provide* a value at one level and *read* it (`.current`) anywhere below, without threading it through every function's parameters in between. Compose uses it for ambient things every composable might need: `LocalContext`, `LocalDensity`, `LocalConfiguration`, `LocalContentColor`, and the theme locals.",
      },
      {
        t: "code",
        title: "Provide and read",
        code: `val LocalSpacing = staticCompositionLocalOf { Spacing() }

CompositionLocalProvider(LocalSpacing provides Spacing(large = 24.dp)) {
    MyScreen()   // anything inside:
}
// val spacing = LocalSpacing.current`,
      },
      {
        t: "p",
        text: "**When to use it**: genuinely cross-cutting, ambient values that a wide subtree needs — theme extensions (custom spacing/elevation tokens beyond Material's), the current user for a deep screen, an analytics logger. **When NOT to** (the important half): it makes data flow *implicit*, which hurts readability, testability, and previews — you can't tell a composable's dependencies from its signature. So for ordinary data, **prefer explicit parameters**. The rule: reach for CompositionLocal only when passing the value as a parameter through many layers would clearly be worse, *and* the value is truly ambient.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you support light and dark themes, and what is dynamic color?",
    a: [
      {
        t: "p",
        text: "**Light/dark**: define two `ColorScheme` instances (a light one and a dark one), then pick between them with `isSystemInDarkTheme()` and pass the choice to `MaterialTheme`. That's it — because all your components read *semantic color roles* (`primary`, `surface`, `onSurface`) rather than hardcoded colors, the exact same composables render correctly in both modes. There's no separate dark layout; the role values differ, the UI code doesn't.",
      },
      {
        t: "p",
        text: "**Dynamic color (Material You, Android 12+)**: instead of your hand-picked palette, the color scheme is *generated from the user's wallpaper* via `dynamicLightColorScheme(context)` / `dynamicDarkColorScheme(context)`. It personalizes the app to the device. You gate it on `Build.VERSION.SDK_INT >= S` and fall back to your static schemes on older devices. A related detail worth mentioning: wrapping regions in `Surface` propagates the correct content color automatically (`LocalContentColor`), so text/icons inside pick the right 'on' color for the surface — which is why `Surface` is preferred over a raw `Box` with a background.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you animate a simple value change, like a color or size, in Compose?",
    a: [
      {
        t: "p",
        text: "**The concept**: Compose animation is state-driven — you don't imperatively run an animation, you change a *target* value and an animation API smoothly interpolates toward it. The simplest tool is the `animate*AsState` family: you give it a target, it returns a `State` that moves there whenever the target changes.",
      },
      {
        t: "code",
        title: "animate*AsState — declarative single-value animation",
        code: `val bgColor by animateColorAsState(
    targetValue = if (selected) Color.Blue else Color.Gray,
    animationSpec = tween(300),
    label = "bgColor",
)
val padding by animateDpAsState(if (expanded) 24.dp else 8.dp, label = "padding")

Box(Modifier.background(bgColor).padding(padding)) { /* ... */ }`,
      },
      {
        t: "p",
        text: "There's a typed variant for each common type — `animateColorAsState`, `animateDpAsState`, `animateFloatAsState`, `animateOffsetAsState`, and so on. You just read the returned value like any state; when the target flips (e.g. `selected` changes), the value animates rather than jumping. For appearing/disappearing content there's `AnimatedVisibility`, and for animating *between different contents* there's `AnimatedContent` — but `animate*AsState` covers the everyday 'this value should change smoothly' case.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between tween and spring animation specs?",
    a: [
      {
        t: "p",
        text: "**The concept**: an `AnimationSpec` describes *how* a value travels to its target over time, and there are two philosophies. **`tween`** is duration-based: you specify a fixed duration and an easing curve (`tween(300, easing = FastOutSlowInEasing)`), and the value follows that curve for exactly that long. **`spring`** is physics-based: there's no fixed duration — the value moves as if pulled by a spring, controlled by `dampingRatio` (how bouncy) and `stiffness` (how fast), and it settles naturally.",
      },
      {
        t: "list",
        items: [
          "**Predictability vs naturalness**: `tween` is deterministic — good when you need a transition to take a known time (a scripted onboarding step). `spring` feels more organic and matches how physical objects move.",
          "**The decisive difference — interruptibility**: if the target changes *mid-animation*, a spring smoothly redirects from its current position *and velocity* toward the new target. A tween, by contrast, tends to restart. So for anything gesture-driven or frequently-changing (a value that can be re-targeted while animating), spring feels right and tween looks janky. That's why spring is the default for many Compose animations.",
          "Other specs to know: `keyframes` (values at specific timestamps for multi-stage motion) and `infiniteRepeatable` (looping animations like a pulse or shimmer).",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "Explain staticCompositionLocalOf vs compositionLocalOf. What's the performance implication?",
    a: [
      {
        t: "p",
        text: "**The concept**: both create a CompositionLocal, but they differ in whether Compose *tracks reads* of the value — and that changes what happens when the value changes.",
      },
      {
        t: "list",
        items: [
          "**`compositionLocalOf`** — tracks reads. Compose records which composables read `.current`, so when the provided value changes, it recomposes **only those readers**. Slightly more bookkeeping per read, but changes are surgical. Use for values that **change at runtime** and where only some composables care — e.g. the current user, a runtime setting.",
          "**`staticCompositionLocalOf`** — does *not* track reads. Reading `.current` is a plain lookup with zero tracking overhead. The catch: because Compose doesn't know who read it, when the value changes it must recompose the **entire subtree** under the provider. Cheap to read, expensive to change. Use for values that essentially **never change** after being provided — a design-system spacing object, a fixed logger, the theme's static tokens.",
        ],
      },
      {
        t: "p",
        text: "**The performance decision**: match the tool to the change frequency. A theme's spacing tokens that are set once at app start → `staticCompositionLocalOf` (fast reads, and the 'recompose everything' cost never triggers because it never changes). A value that flips during use → `compositionLocalOf` (you *want* read tracking so a change doesn't blow away the whole subtree). Getting this backwards is a real, subtle performance bug: a frequently-changing `staticCompositionLocalOf` recomposes enormous subtrees on every change.",
      },
    ],
  },
  {
    level: "senior",
    q: "When would you use Animatable or Transition instead of animate*AsState?",
    a: [
      {
        t: "p",
        text: "**The tiers**: `animate*AsState` is the declarative, fire-and-forget top layer — perfect when a value should smoothly follow a target and you don't need fine control. You drop to lower-level APIs when you need *control* or *coordination* that the declarative form can't express.",
      },
      {
        t: "list",
        items: [
          "**`Animatable`** — the imperative, coroutine-driven primitive underneath `animate*AsState`. You call `animateTo()` / `snapTo()` from a coroutine, and you can read current **velocity**, **cancel** mid-flight, and chain animations. This is what you need for **gesture-driven** animation: a swipe-to-dismiss or draggable card where the user's finger drives the value directly (`snapTo` during drag) and then you `animateTo` a settle target with the drag's velocity for a natural fling. The declarative API can't do velocity handoff from a gesture — Animatable can.",
          "**`Transition` (`updateTransition`)** — for coordinating **multiple animations that must stay in sync off one state change**. If selecting an item should animate color *and* size *and* elevation together, driving three separate `animate*AsState` risks them drifting; a `Transition` runs them as one synchronized unit keyed to the state, and exposes named child animations that show up nicely in the Animation Preview tooling.",
          "**`rememberInfiniteTransition`** — for endless, state-independent animations (shimmer loading, pulsing indicators).",
        ],
      },
      {
        t: "p",
        text: "**Rule of thumb**: `animate*AsState` until you need (a) gesture/velocity control or manual cancellation → `Animatable`, or (b) several animations coordinated by one state → `Transition`. Reaching for the low-level API without one of those needs is over-engineering.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you make an animation performant — what's the connection between animation and the three phases?",
    a: [
      {
        t: "p",
        text: "**The core insight**: an animation changes a value ~60 times a second, and *where you read that value* decides how much work each of those 60 frames costs. If the animated value is read during **composition**, every frame recomposes the composable (re-executing it, re-diffing children) — the most expensive path, and the usual cause of janky Compose animations. If it's read during **layout**, composition is skipped and only measurement/placement re-runs. If read during **draw**, only the paint step re-runs. So performant animation means reading the animated value as *late* in the pipeline as possible.",
      },
      {
        t: "code",
        title: "Same animation, escalating efficiency",
        code: `// COMPOSITION read -> recomposes every frame (avoid for animations)
Box(Modifier.offset(x = animatedX.value.dp))

// LAYOUT read (lambda defers it) -> composition skipped
Box(Modifier.offset { IntOffset(animatedX.value.roundToPx(), 0) })

// DRAW read -> only redraw, for purely visual properties
Box(Modifier.graphicsLayer { alpha = animatedAlpha.value; scaleX = scale.value })`,
      },
      {
        t: "list",
        items: [
          "**The mechanism**: the *lambda* forms of `offset`, plus `graphicsLayer`/`drawBehind`/`drawWithContent`, invoke their lambda during the layout or draw phase. Reading the animated state *inside* that lambda records the read against that phase, so the state change only invalidates layout/draw — not composition.",
          "**Property-to-phase mapping**: positional changes (offset, size) → layout-phase reads; purely visual changes (alpha, scale, rotation, translation, clip) → `graphicsLayer` draw-phase reads. Only animate in composition if the animation genuinely changes *what is composed* (e.g. `AnimatedContent` swapping content).",
          "**`graphicsLayer` bonus**: it renders into a separate layer, so transformations are GPU-cheap and don't even trigger redraw of the content itself for things like alpha/scale.",
          "This is the exact intersection the interviewer is testing: you understand *both* the animation APIs *and* the phase model, and you connect them — 'animate with deferred reads so the 60fps updates hit layout/draw, never composition.'",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "How would you build a custom design system on top of (or beside) MaterialTheme in Compose?",
    a: [
      {
        t: "p",
        text: "**The concept**: `MaterialTheme` provides exactly three CompositionLocals (color scheme, typography, shapes). A real design system usually needs *more* — custom spacing tokens, elevation levels, brand-specific color roles, custom shapes — and sometimes wants to fully replace Material's vocabulary. Compose supports both extending and replacing because a theme is 'just' a set of CompositionLocals plus an accessor object; you can make your own.",
      },
      {
        t: "list",
        items: [
          "**Approach 1 — extend MaterialTheme**: keep `MaterialTheme` for standard tokens and *add* your own CompositionLocals for what it lacks. Define `val LocalSpacing = staticCompositionLocalOf { Spacing() }`, provide it inside your `AppTheme`, and expose a convenient accessor object (often an `object AppTheme { val spacing @Composable get() = LocalSpacing.current; val colors @Composable get() = MaterialTheme.colorScheme }`) so call sites read `AppTheme.spacing.large`. Low-friction, interoperates with Material components.",
          "**Approach 2 — fully custom theme**: define your *own* `ColorScheme`/`Typography` data classes and CompositionLocals, provide them, and build your own accessor — used when the brand's system doesn't map to Material's roles at all. More work (you re-implement what Material gave you and lose automatic component theming), so justify it only for strong brand systems.",
          "**Provider choice matters**: static tokens (spacing, shapes) that never change at runtime → `staticCompositionLocalOf` (fast reads); anything that can change during use → `compositionLocalOf`.",
          "**Reactive theming falls out for free**: because tokens are read via CompositionLocal (a state read), a theme change recomposes only the readers.",
          "**Testability note**: keep the accessor thin and the tokens as plain data so previews can wrap content in `AppTheme { }` easily — a design system nobody can preview is a failed one.",
        ],
      },
      {
        t: "p",
        text: "The senior framing: a Compose design system is a small set of CompositionLocals + immutable token data classes + a thin accessor, layered on or beside MaterialTheme — and the key decisions are *what to add vs replace*, and *static vs tracked* locals per token's change frequency.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the three pillars of MaterialTheme (color, typography, shape)?",
    a: [
      {
        t: "p",
        text: "`MaterialTheme` provides three theming systems your whole UI reads from: a `ColorScheme` (semantic colors like `primary`, `surface`, `onSurface`), a `Typography` (named text styles like `bodyLarge`, `headlineSmall`), and `Shapes` (corner styles for `small`/`medium`/`large` components). Composables and Material components read these via `MaterialTheme.colorScheme`/`.typography`/`.shapes`, so changing the theme restyles everything consistently.",
      },
      {
        t: "code",
        title: "Setting and reading the theme",
        code: `MaterialTheme(
    colorScheme = if (dark) darkColorScheme() else lightColorScheme(),
    typography = AppTypography,
    shapes = AppShapes,
) { AppContent() }

// Reading it anywhere inside:
Text("Hi", color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.bodyLarge)`,
      },
      {
        t: "list",
        items: [
          "**`ColorScheme`** — semantic roles (`primary`, `secondary`, `surface`, `error`, and their `on*` pairs) — use roles, not raw hex, so dark mode and theming work.",
          "**`Typography`** — named text styles; apply `style = MaterialTheme.typography.*` instead of hardcoding font sizes.",
          "**`Shapes`** — `small`/`medium`/`large` corner shapes used by components (cards, buttons).",
          "**Propagated via CompositionLocal** — `MaterialTheme` sets locals so any descendant reads the current values without prop drilling.",
        ],
      },
      {
        t: "note",
        text: "MaterialTheme provides ColorScheme (semantic roles: primary/surface/onSurface…), Typography (named styles: bodyLarge…), and Shapes (small/medium/large corners), propagated via CompositionLocal. Read roles/styles (MaterialTheme.colorScheme.primary), never raw hex/sizes — that's what makes dark mode and re-theming work.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why use semantic color roles (onSurface, primary) instead of hardcoded colors?",
    a: [
      {
        t: "p",
        text: "Semantic roles describe a color's *purpose* (`primary`, `surface`, `onSurface`) rather than its value. When you use roles, switching to dark theme (or a different brand theme) just swaps the `ColorScheme`, and everything recolors correctly — including the `on*` pairs that guarantee readable contrast. Hardcoded `Color(0xFF...)` breaks in dark mode and duplicates values everywhere.",
      },
      {
        t: "list",
        items: [
          "**Roles adapt** — `surface`/`onSurface` resolve to light values in the light scheme and dark values in the dark scheme automatically.",
          "**`on*` pairs = guaranteed contrast** — text on `primary` uses `onPrimary`, ensuring legibility in both themes.",
          "**Single source of truth** — change the brand color once in the scheme, not in dozens of composables.",
          "**Hardcoded hex** — looks fine in light mode, becomes invisible/ugly in dark mode, and can't be re-themed.",
        ],
      },
      {
        t: "code",
        title: "Roles vs hex",
        code: `// BAD: breaks in dark mode
Surface(color = Color(0xFFFFFFFF)) { Text("Hi", color = Color.Black) }
// GOOD: adapts to the scheme, correct contrast in both themes
Surface(color = MaterialTheme.colorScheme.surface) {
    Text("Hi", color = MaterialTheme.colorScheme.onSurface)
}`,
      },
      {
        t: "note",
        text: "Semantic roles (primary/surface/onSurface) describe purpose, so swapping the ColorScheme (dark/brand) recolors everything correctly, and on* pairs guarantee contrast. Hardcoded hex breaks in dark mode and duplicates values. Always pair a background role with its on* role for text.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is animateContentSize, and when do you use it?",
    a: [
      {
        t: "p",
        text: "`Modifier.animateContentSize()` smoothly animates a composable's size change when its content changes size — for example, an expanding/collapsing card whose text goes from one line to many. Instead of snapping to the new size, it interpolates, giving a polished expand/collapse without manually animating a height value.",
      },
      {
        t: "code",
        title: "Expand/collapse with animateContentSize",
        code: `Column(
    Modifier
        .clickable { expanded = !expanded }
        .animateContentSize()          // animates the height change automatically
) {
    Text(title)
    if (expanded) Text(longDescription)   // adding/removing this animates the size
}`,
      },
      {
        t: "list",
        items: [
          "**Automatic size animation** — no need to compute/animate a height; it interpolates between measured sizes.",
          "**Customizable** — pass an `animationSpec` (tween/spring) to control feel.",
          "**Placement in the chain** — where you put it matters; typically after size-affecting modifiers you want animated and before padding you don't.",
          "**Great for** — expandable cards, showing/hiding detail, content that grows as data loads.",
        ],
      },
      {
        t: "note",
        text: "Modifier.animateContentSize() smoothly interpolates a composable's size when its content changes size (expand/collapse cards, growing text) — no manual height animation. Pass an animationSpec for feel; mind its position in the modifier chain. The easiest way to animate reveal/hide of content.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you animate appearance and disappearance with AnimatedVisibility?",
    a: [
      {
        t: "p",
        text: "`AnimatedVisibility(visible)` animates a composable in and out with enter/exit transitions (fade, slide, expand, shrink). When `visible` flips, it plays the enter or exit animation and adds/removes the content — the standard way to animate showing/hiding UI like a FAB, banner, or expandable section.",
      },
      {
        t: "code",
        title: "AnimatedVisibility with enter/exit",
        code: `AnimatedVisibility(
    visible = showBanner,
    enter = fadeIn() + slideInVertically(),
    exit = fadeOut() + slideOutVertically(),
) {
    Banner()   // animated in/out; removed from composition when fully hidden
}`,
      },
      {
        t: "list",
        items: [
          "**Enter/exit transitions** — combine `fadeIn/Out`, `slideIn/Out`, `expandIn`/`shrinkOut`, `scaleIn/Out` with `+`.",
          "**Content is removed when hidden** — after the exit animation, the content leaves the composition (its state is forgotten unless hoisted).",
          "**Children can animate individually** — inside its scope, `Modifier.animateEnterExit()` gives per-child transitions.",
          "**`AnimatedContent`** is the sibling API for animating *between* different contents (e.g. count changes, tab switches).",
        ],
      },
      {
        t: "note",
        text: "AnimatedVisibility(visible) animates content in/out via enter/exit specs (fadeIn/slideIn/expandIn + fadeOut/…). Content leaves the composition after the exit (state forgotten unless hoisted); children can use Modifier.animateEnterExit(). Use AnimatedContent to animate BETWEEN different contents.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is AnimatedContent, and how does it differ from Crossfade?",
    a: [
      {
        t: "p",
        text: "`AnimatedContent` animates a transition *between different values/contents* — when a state changes, it animates the old content out and the new content in, with full control over the transition (and even size changes). `Crossfade` is the simpler special case that just fades between two contents. Use `AnimatedContent` for count changes, tab/step switches, or loading→loaded transitions.",
      },
      {
        t: "code",
        title: "AnimatedContent for a changing value",
        code: `AnimatedContent(
    targetState = count,
    transitionSpec = {
        if (targetState > initialState) slideInVertically { it } togetherWith slideOutVertically { -it }
        else slideInVertically { -it } togetherWith slideOutVertically { it }
    },
) { c -> Text("\$c", style = MaterialTheme.typography.headlineLarge) }`,
      },
      {
        t: "list",
        items: [
          "**`AnimatedContent`** — animate between arbitrary contents keyed on `targetState`; `transitionSpec` controls direction/feel; can animate size between states (`SizeTransform`).",
          "**`Crossfade`** — just cross-dissolves between contents; less control, simpler API. Good for screen/tab swaps where a fade suffices.",
          "**`togetherWith`** — pairs the enter and exit specs.",
          "**Reads the target in the content lambda** — always render `targetState` (the lambda parameter), not the outer state, so each in/out frame shows the right content.",
        ],
      },
      {
        t: "note",
        text: "AnimatedContent animates BETWEEN contents keyed on targetState with a transitionSpec (direction, SizeTransform) — for counters, tab/step switches, loading→loaded. Crossfade is the simple fade-only special case. Render the lambda's targetState param (not outer state) so each frame shows the correct content.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does updateTransition let you coordinate multiple animations together?",
    a: [
      {
        t: "p",
        text: "`updateTransition(targetState)` creates a `Transition` driven by one state, and you derive *multiple* animated values from it with `transition.animateColor`, `animateDp`, `animateFloat`, etc. All of them animate in sync when the state changes — perfect for a selected/unselected or expanded/collapsed component where color, size, and elevation should change together.",
      },
      {
        t: "code",
        title: "Coordinated animations",
        code: `val transition = updateTransition(selected, label = "chip")
val color by transition.animateColor(label = "color") { if (it) Primary else Surface }
val elevation by transition.animateDp(label = "elev") { if (it) 8.dp else 2.dp }
val scale by transition.animateFloat(label = "scale") { if (it) 1.05f else 1f }
Card(Modifier.graphicsLayer { scaleX = scale; scaleY = scale }) { /* uses color, elevation */ }`,
      },
      {
        t: "list",
        items: [
          "**One source, many values** — all child animations share the transition's clock and target, staying coordinated.",
          "**Per-value specs** — each `animate*` can have its own `transitionSpec` (different durations/easings) while still synced to the state.",
          "**Labels** — help the Animation Preview/inspector tools.",
          "**vs `animate*AsState`** — use that for a single independent value; use `updateTransition` when several values must change as a set.",
        ],
      },
      {
        t: "note",
        text: "updateTransition(state) drives MULTIPLE animated values (animateColor/animateDp/animateFloat) from one state, all synced — ideal for selected/expanded components where color+size+elevation change together. Each value can have its own spec. Use animate*AsState for a single value; updateTransition for a coordinated set.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you create an infinitely repeating animation (pulsing, loading)?",
    a: [
      {
        t: "p",
        text: "Use `rememberInfiniteTransition()` with `animateFloat`/`animateColor` and an `infiniteRepeatable` spec. It runs forever (while in composition), looping or reversing — ideal for pulsing dots, shimmer loading effects, rotating spinners, or breathing highlights.",
      },
      {
        t: "code",
        title: "A pulsing alpha",
        code: `val transition = rememberInfiniteTransition(label = "pulse")
val alpha by transition.animateFloat(
    initialValue = 0.3f, targetValue = 1f,
    animationSpec = infiniteRepeatable(tween(800), RepeatMode.Reverse),
    label = "alpha",
)
Box(Modifier.alpha(alpha).background(Primary))`,
      },
      {
        t: "list",
        items: [
          "**`rememberInfiniteTransition`** — the source; animations run while it's in composition and stop when it leaves.",
          "**`infiniteRepeatable(spec, RepeatMode.Restart/Reverse)`** — loop (restart) or ping-pong (reverse).",
          "**Cheap-to-animate targets** — animate `alpha`/`scale`/`rotation` via `graphicsLayer` for draw-phase efficiency; avoid animating layout-affecting properties infinitely.",
          "**Shimmer** — a common use: animate a gradient offset infinitely across placeholder shapes.",
        ],
      },
      {
        t: "note",
        text: "rememberInfiniteTransition() + animateFloat/Color with infiniteRepeatable(spec, RepeatMode.Reverse/Restart) makes forever-looping animations (pulse, shimmer, spinner) — stops when it leaves composition. Animate draw-phase props (alpha/scale/rotation via graphicsLayer), not layout-affecting ones, for efficiency.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you build a custom shape or draw custom graphics in Compose?",
    a: [
      {
        t: "p",
        text: "For custom outlines (a shape to clip/background), implement the `Shape` interface's `createOutline`. For freeform drawing, use the `Canvas` composable (or `Modifier.drawBehind`/`drawWithContent`), which gives a `DrawScope` with `drawRect`, `drawCircle`, `drawPath`, etc. This is how you make progress rings, charts, badges, and decorative graphics.",
      },
      {
        t: "code",
        title: "Canvas drawing and a custom Shape",
        code: `Canvas(Modifier.size(120.dp)) {
    drawArc(color = Primary, startAngle = -90f, sweepAngle = 270f * progress,
        useCenter = false, style = Stroke(width = 12.dp.toPx(), cap = StrokeCap.Round))
}

// Custom Shape for clipping:
class TicketShape(val notch: Dp) : Shape {
    override fun createOutline(size: Size, dir: LayoutDirection, density: Density): Outline {
        val path = Path().apply { /* build with lines/arcs */ }
        return Outline.Generic(path)
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`Canvas`/`drawBehind`/`drawWithContent`** — `DrawScope` primitives (`drawLine`, `drawPath`, `drawArc`, `drawImage`) for custom visuals.",
          "**`Shape` + `createOutline`** — a reusable outline for `clip`/`background`/`border` (tickets, chat bubbles).",
          "**`Path`** — build complex geometry; reuse/`remember` paths rather than allocating each draw.",
          "**Draw phase** — drawing happens in the draw phase; animate draw inputs (a `progress` state) to animate the graphic cheaply.",
        ],
      },
      {
        t: "note",
        text: "Custom graphics: Canvas/drawBehind/drawWithContent give a DrawScope (drawArc/drawPath/drawCircle) for charts/rings/badges; implement Shape.createOutline for reusable clip/background outlines (tickets, bubbles). remember Paths to avoid per-draw allocation. Drawing is draw-phase — animating a progress state is cheap.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do gesture-driven animations work (draggable, swipeable, Animatable)?",
    a: [
      {
        t: "p",
        text: "Gesture-driven animation combines a gesture modifier (`draggable`, `pointerInput` + `detectDragGestures`, or the anchored-draggable APIs) with an `Animatable` value you update from the gesture and then `animateTo` a resting position on release. `Animatable` is the low-level, coroutine-based animation primitive that lets you both snap (`snapTo`) during the drag and animate (`animateTo`) on fling/settle.",
      },
      {
        t: "code",
        title: "Drag then settle with Animatable",
        code: `val offsetX = remember { Animatable(0f) }
val scope = rememberCoroutineScope()
Box(Modifier.pointerInput(Unit) {
    detectHorizontalDragGestures(
        onHorizontalDrag = { _, delta -> scope.launch { offsetX.snapTo(offsetX.value + delta) } },
        onDragEnd = { scope.launch { offsetX.animateTo(0f, spring()) } },  // settle back
    )
}.offset { IntOffset(offsetX.value.roundToInt(), 0) })`,
      },
      {
        t: "list",
        items: [
          "**`Animatable`** — coroutine-driven value with `snapTo` (instant, during drag) and `animateTo` (animated, on settle); supports `animateDecay` for flings.",
          "**Gesture source** — `draggable`, `pointerInput` + `detectDragGestures`, or `anchoredDraggable` (the modern swipe-between-anchors API replacing `swipeable`).",
          "**Read the offset in a lambda modifier** — `offset { }`/`graphicsLayer { }` to keep the drag in layout/draw (no recomposition per frame).",
          "**Velocity & fling** — capture velocity to decide the target anchor / decay the fling naturally.",
        ],
      },
      {
        t: "note",
        text: "Gesture animation = a gesture modifier (draggable / detectDragGestures / anchoredDraggable) feeding an Animatable: snapTo during the drag, animateTo/animateDecay to settle or fling on release. Read the value in an offset{}/graphicsLayer{} lambda (no per-frame recomposition). anchoredDraggable replaces the old swipeable.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the common animationSpecs (tween, spring, keyframes) and when to use each?",
    a: [
      {
        t: "p",
        text: "An `animationSpec` defines *how* a value travels from start to end over time. The three you'll use most: `tween` (duration + easing curve), `spring` (physics-based, defined by stiffness/damping — no fixed duration), and `keyframes` (explicit values at specific times). Choosing the right one is what makes motion feel natural vs mechanical.",
      },
      {
        t: "list",
        items: [
          "**`spring`** — physics-based, interruptible, natural feel; great default for gesture/state-driven motion because it handles velocity when a target changes mid-animation. Tune `dampingRatio` and `stiffness`.",
          "**`tween`** — fixed `durationMillis` + `easing` (e.g. `FastOutSlowInEasing`); use when you need a precise duration/curve (branded motion, timed reveals).",
          "**`keyframes`** — set values at specific millis for multi-stage motion (overshoot then settle, custom paths).",
          "**`repeatable`/`infiniteRepeatable`** — wrap a spec to loop; **`snap`** — jump instantly (no animation).",
        ],
      },
      {
        t: "code",
        title: "Specifying the feel",
        code: `animateDpAsState(size, animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy))
animateFloatAsState(alpha, animationSpec = tween(300, easing = FastOutSlowInEasing))
animateDpAsState(x, animationSpec = keyframes { durationMillis = 400; 20.dp at 100; 0.dp at 400 })`,
      },
      {
        t: "note",
        text: "animationSpec = how the value travels: spring (physics, interruptible, natural — best default for state/gesture motion), tween (fixed duration + easing — precise/branded timing), keyframes (values at specific times — multi-stage). Wrap in repeatable to loop, snap to jump instantly. Spring handles mid-animation target changes gracefully.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you avoid providing a CompositionLocal for data that should be a parameter?",
    a: [
      {
        t: "p",
        text: "`CompositionLocal` is for *ambient* values many composables read but that aren't part of a composable's core contract — theme, density, current locale. It's tempting to use it to avoid 'prop drilling', but overusing it makes data flow implicit and hard to trace, breaks reuse (a composable silently depends on an ambient it may not receive), and hurts testability. The rule: pass explicit parameters for a composable's actual inputs; reserve CompositionLocal for truly cross-cutting ambient values.",
      },
      {
        t: "list",
        items: [
          "**Good CompositionLocal uses** — theme, typography, `LocalContext`, `LocalDensity`, current logged-in user for a whole app, a design-system's tokens — things read widely and rarely passed explicitly.",
          "**Bad uses** — passing a screen's ViewModel, a specific item's data, or a callback via a local to skip parameters; it hides dependencies.",
          "**Costs of overuse** — implicit dependencies (composable breaks if the provider is missing), harder testing (must provide locals), and no compile-time guarantee the value exists.",
          "**Default value** — `compositionLocalOf { error(\"not provided\") }` forces a provider; a sensible default can mask missing setup.",
        ],
      },
      {
        t: "note",
        text: "CompositionLocal is for ambient, widely-read, rarely-passed values (theme, density, context, design tokens) — NOT to dodge prop drilling for a composable's real inputs (ViewModel, item data, callbacks). Overuse makes data flow implicit, breaks reuse/testability, and risks missing-provider crashes. Prefer explicit parameters.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you implement shared-element transitions in Compose?",
    a: [
      {
        t: "p",
        text: "Compose provides shared-element transitions via `SharedTransitionLayout` + `Modifier.sharedElement(...)`/`sharedBounds(...)` tied to an `AnimatedContent`/`AnimatedVisibility` scope. You mark the 'same' element in two states (e.g. a thumbnail in a list and the hero image on the detail screen) with a matching key, and Compose animates its position/size/shape between them.",
      },
      {
        t: "code",
        title: "Shared element sketch",
        code: `SharedTransitionLayout {
    AnimatedContent(targetState = screen) { s ->
        when (s) {
            List -> Thumb(Modifier.sharedElement(rememberSharedContentState(key = "img-\$id"), this@AnimatedContent))
            Detail -> Hero(Modifier.sharedElement(rememberSharedContentState(key = "img-\$id"), this@AnimatedContent))
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`SharedTransitionLayout`** — the container that coordinates shared elements.",
          "**Matching keys** — the same `rememberSharedContentState(key)` in both states tells Compose these are the 'same' element to morph between.",
          "**`sharedElement` vs `sharedBounds`** — `sharedElement` for identical content that moves/resizes; `sharedBounds` for containers whose content differs but the bounds morph.",
          "**Needs an animation scope** — works within `AnimatedContent`/`AnimatedVisibility`/nav transitions; integrate with Navigation Compose's animated destinations.",
        ],
      },
      {
        t: "note",
        text: "SharedTransitionLayout + Modifier.sharedElement/sharedBounds with matching rememberSharedContentState(key) morph an element (thumbnail→hero image) between two states inside an AnimatedContent/AnimatedVisibility scope. sharedElement = same content moves/resizes; sharedBounds = differing content, morphing bounds. Integrates with Navigation Compose transitions.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you provide fonts and a custom Typography in Compose?",
    a: [
      {
        t: "p",
        text: "Define a `FontFamily` from font resources (or downloadable/Google Fonts), build a `Typography` mapping each named style (`bodyLarge`, `titleMedium`, etc.) to a `TextStyle` using that family, and pass it to `MaterialTheme`. Then components and your `Text`s read `MaterialTheme.typography.*` for consistent, themeable text.",
      },
      {
        t: "code",
        title: "Custom font + typography",
        code: `val Inter = FontFamily(
    Font(R.font.inter_regular, FontWeight.Normal),
    Font(R.font.inter_bold, FontWeight.Bold),
)
val AppTypography = Typography(
    bodyLarge = TextStyle(fontFamily = Inter, fontSize = 16.sp, lineHeight = 24.sp),
    titleLarge = TextStyle(fontFamily = Inter, fontWeight = FontWeight.Bold, fontSize = 22.sp),
)
MaterialTheme(typography = AppTypography) { AppContent() }`,
      },
      {
        t: "list",
        items: [
          "**`FontFamily`** — group weights/styles from `res/font` (or `GoogleFont`/downloadable fonts to avoid bundling).",
          "**`Typography`** — assign a `TextStyle` per Material role; use roles in UI (`style = MaterialTheme.typography.bodyLarge`).",
          "**Downloadable fonts** — reduce APK size and load asynchronously via the Google Fonts provider.",
          "**Consistency** — always reference typography roles; hardcoding `fontSize` scatters values and breaks scaling/theming.",
        ],
      },
      {
        t: "note",
        text: "Build a FontFamily from res/font (or Google/downloadable fonts), map named roles in a Typography (bodyLarge/titleLarge → TextStyle with the family), pass it to MaterialTheme, and use style = MaterialTheme.typography.* everywhere. Downloadable fonts cut APK size. Reference roles, don't hardcode sizes.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you respect the user's font scale and accessibility settings?",
    a: [
      {
        t: "p",
        text: "Use scalable pixel units (`sp`) for text so it honors the system font-scale accessibility setting, and avoid fixed pixel/dp sizing for text or fixed-height text containers that would clip enlarged text. Compose applies the user's font scale automatically to `sp`; your job is to build layouts that adapt when text grows.",
      },
      {
        t: "list",
        items: [
          "**`sp` for text, `dp` for everything else** — `sp` scales with the accessibility font-size setting; using `dp` for font size ignores it.",
          "**Don't fix text container heights** — an enlarged font in a fixed-height box clips; let containers wrap content.",
          "**Test at large scales** — enable the largest font size / display size in settings and verify no clipping or overlap.",
          "**Content descriptions & semantics** — provide `contentDescription` for images/icons and use semantics so TalkBack works; touch targets ≥ 48dp.",
          "**Non-linear font scaling** — modern Android applies non-linear scaling at large sizes; using `sp` gets this for free.",
        ],
      },
      {
        t: "note",
        text: "Use sp for text (scales with the accessibility font-size setting) and dp for other dimensions; never fix text-container heights (enlarged text clips). Test at max font/display size, add contentDescription/semantics for TalkBack, keep touch targets ≥48dp. sp also gets non-linear large-font scaling for free.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is dynamic color (Material You), and how do you implement it with a fallback?",
    a: [
      {
        t: "p",
        text: "Dynamic color (Material You) derives your app's `ColorScheme` from the user's wallpaper on Android 12+, so the app matches their system palette. You implement it by using `dynamicLightColorScheme`/`dynamicDarkColorScheme` when available, and falling back to your brand `ColorScheme` on older versions or when you want a fixed brand identity.",
      },
      {
        t: "code",
        title: "Dynamic color with fallback",
        code: `val context = LocalContext.current
val colorScheme = when {
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
        if (dark) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
    dark -> BrandDarkColors
    else -> BrandLightColors
}
MaterialTheme(colorScheme = colorScheme) { AppContent() }`,
      },
      {
        t: "list",
        items: [
          "**Android 12+ only** — `dynamic*ColorScheme` needs API 31+; gate it and fall back to brand colors below.",
          "**Brand vs personalization trade-off** — dynamic color delights users but weakens brand consistency; some apps offer it as a toggle.",
          "**Still use roles** — because you use semantic roles everywhere, swapping to a dynamic scheme just works.",
          "**Test both** — verify contrast and brand-critical colors (logos) still look right under arbitrary wallpaper-derived palettes.",
        ],
      },
      {
        t: "note",
        text: "Dynamic color (Material You) builds the ColorScheme from the user's wallpaper on API 31+ via dynamicLight/DarkColorScheme(context); gate by SDK and fall back to brand colors below (or as a user toggle for brand consistency). It works because you use semantic roles. Test contrast under arbitrary palettes.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you animate between values as a low-level primitive with Animatable vs animate*AsState?",
    a: [
      {
        t: "p",
        text: "`animate*AsState` is the *declarative* high-level API: you give it a target and it animates whenever that target changes — no coroutine, ideal for simple state-driven animations. `Animatable` is the *imperative* low-level primitive: you control it in a coroutine with `animateTo`/`snapTo`/`stop`, giving precise control needed for gestures, sequences, and interruption logic.",
      },
      {
        t: "table",
        headers: ["", "animate*AsState", "Animatable"],
        rows: [
          ["Style", "declarative (target → auto-animate)", "imperative (coroutine calls)"],
          ["Control", "just set target", "animateTo / snapTo / stop / decay"],
          ["Best for", "simple state-driven values", "gestures, sequences, precise control"],
          ["Interruption", "auto (retargets)", "manual but fully controllable"],
        ],
      },
      {
        t: "list",
        items: [
          "**`animate*AsState`** — `val size by animateDpAsState(if (expanded) 200.dp else 100.dp)`; set-and-forget, retargets automatically.",
          "**`Animatable`** — for drag-and-settle, animation *sequences* (`animateTo(a); animateTo(b)`), decays/flings, and reading/stopping mid-flight.",
          "**Both are interruptible** — but `Animatable` lets you decide exactly how (e.g. capture current velocity into a fling).",
        ],
      },
      {
        t: "note",
        text: "animate*AsState = declarative (set a target, it auto-animates on change) — for simple state-driven values. Animatable = imperative coroutine primitive (animateTo/snapTo/stop/decay) — for gestures, sequences, flings, and precise interruption control. Reach for Animatable when set-a-target isn't enough.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle system bars and edge-to-edge theming (status bar color/icons)?",
    a: [
      {
        t: "p",
        text: "With edge-to-edge (the modern default), you don't set opaque status/navigation bar colors; instead you make the bars transparent and control the *icon* appearance (light vs dark icons) to contrast with your content behind them. `enableEdgeToEdge()` in the Activity sets this up, and you adjust icon appearance based on your theme.",
      },
      {
        t: "list",
        items: [
          "**`enableEdgeToEdge()`** — call in `onCreate`; content draws behind transparent system bars.",
          "**Icon appearance** — set light/dark status-bar icons to contrast with whatever your content shows there (via the systemBars style in `enableEdgeToEdge`, or `WindowCompat`/`WindowInsetsControllerCompat`).",
          "**Apply insets** — pad content with `statusBarsPadding`/`navigationBarsPadding`/`safeDrawingPadding` so it isn't hidden under the bars.",
          "**Deprecated approach** — directly setting `window.statusBarColor` is deprecated; prefer transparent bars + inset handling + icon appearance.",
        ],
      },
      {
        t: "note",
        text: "Edge-to-edge (default): call enableEdgeToEdge(), make bars transparent, and control status-bar ICON light/dark to contrast with your content — don't set opaque bar colors (window.statusBarColor is deprecated). Pad content with statusBarsPadding/safeDrawingPadding so it isn't hidden behind the bars.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you preview themes and dark mode in Android Studio?",
    a: [
      {
        t: "p",
        text: "Use `@Preview` annotations with parameters to render composables in the IDE without running the app, including dark mode via `uiMode = UI_MODE_NIGHT_YES`, different font scales, locales, and device sizes. Wrapping previews in your `AppTheme` shows real themed output; multipreview annotations render several variants at once.",
      },
      {
        t: "code",
        title: "Theme and dark-mode previews",
        code: `@Preview(name = "Light")
@Preview(name = "Dark", uiMode = Configuration.UI_MODE_NIGHT_YES)
@Preview(name = "Large font", fontScale = 1.5f)
@Composable
fun CardPreview() {
    AppTheme { ProfileCard(sampleUser) }   // wrap in the real theme
}
// Custom multipreview: annotate once to get all variants
@Preview(uiMode = UI_MODE_NIGHT_YES) @Preview annotation class ThemePreviews`,
      },
      {
        t: "list",
        items: [
          "**`@Preview` params** — `uiMode` (dark), `fontScale`, `locale`, `device`, `showBackground`, `widthDp`.",
          "**Wrap in `AppTheme`** — otherwise you see unthemed defaults; always theme previews.",
          "**Multipreview annotations** — define one annotation (e.g. `@ThemePreviews`) combining several `@Preview`s to render light/dark/large-font together.",
          "**`@PreviewParameter`** — feed sample data variants (empty, long text, error) into a preview.",
        ],
      },
      {
        t: "note",
        text: "Preview themes with @Preview(uiMode = UI_MODE_NIGHT_YES) for dark, plus fontScale/locale/device params — always wrap the preview in AppTheme. Combine variants with a custom multipreview annotation (@ThemePreviews) and feed sample data via @PreviewParameter (empty/long/error states). Renders in-IDE, no app run.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are staticCompositionLocalOf and compositionLocalOf's recomposition implications, restated with a concrete example?",
    a: [
      {
        t: "p",
        text: "`compositionLocalOf` tracks reads and, when its provided value changes, recomposes only the composables that *read* it. `staticCompositionLocalOf` does *not* track reads — changing its value recomposes the *entire* content under the provider. So the choice hinges on how often the value changes: frequently-changing → `compositionLocalOf`; rarely/never-changing → `staticCompositionLocalOf` (faster reads, cheaper because no tracking).",
      },
      {
        t: "list",
        items: [
          "**`compositionLocalOf`** — read-tracked; a value change recomposes only readers. Use for values that change during runtime (e.g. a theme the user can toggle live, current elevation).",
          "**`staticCompositionLocalOf`** — not tracked; changing it recomposes everything below the provider. Use for values that are effectively constant for a subtree (e.g. `LocalContext`, a logging tag) — reads are cheaper.",
          "**Concrete** — a live-toggleable accent color → `compositionLocalOf` (only accented widgets recompose). An app-wide immutable config → `staticCompositionLocalOf` (never changes, so no tracking overhead).",
          "**Getting it wrong** — a frequently-changing `staticCompositionLocalOf` causes huge recomposition; a never-changing `compositionLocalOf` just wastes a little tracking overhead (less harmful).",
        ],
      },
      {
        t: "note",
        text: "compositionLocalOf tracks reads → value change recomposes only readers (use for values that change at runtime). staticCompositionLocalOf skips tracking → value change recomposes the WHOLE subtree, but reads are cheaper (use for effectively-constant values like LocalContext). Wrong static choice = massive recomposition.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you structure a scalable design system on top of Material in a large app?",
    a: [
      {
        t: "p",
        text: "Build a thin layer that *wraps* MaterialTheme: define your own semantic tokens (colors, spacing, typography, elevation) exposed via a small `CompositionLocal`-backed `AppTheme`, plus a set of branded components (buttons, cards) that consume those tokens. This gives one source of truth, enforces consistency, and lets you extend beyond Material's slots (custom spacing scale, extra color roles) without fighting the framework.",
      },
      {
        t: "list",
        items: [
          "**Token layer** — colors/spacing/typography/shape as named tokens; extend Material's `ColorScheme` with extra roles via a custom `LocalAppColors` CompositionLocal for what Material lacks.",
          "**`AppTheme` wrapper** — sets `MaterialTheme` *and* provides your extra locals; the single entry point.",
          "**Component library** — `AppButton`, `AppCard`, etc. reading tokens, so screens never touch raw Material components or hex.",
          "**Spacing scale** — a `LocalSpacing` (e.g. `xs/sm/md/lg`) since Material has no spacing system; enforces rhythm.",
          "**Governance** — lint/detekt rules banning raw `Color(...)`/`.dp` literals in feature code to force token use; document usage.",
        ],
      },
      {
        t: "note",
        text: "Wrap MaterialTheme in an AppTheme that also provides custom tokens (extra color roles, a spacing scale) via CompositionLocals, plus a branded component library (AppButton/AppCard) reading those tokens. One source of truth, extends Material's gaps (spacing), and lint rules banning raw hex/dp keep feature code consistent.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you animate a color, and why not just use animateColorAsState blindly?",
    a: [
      {
        t: "p",
        text: "`animateColorAsState(targetColor)` animates a color whenever the target changes — it interpolates in a perceptually reasonable color space. The caveat is *where* you read the animated color: reading it in composition recomposes each frame, so for hot paths prefer reading it in a draw-phase modifier (`drawBehind`, `graphicsLayer`) or applying it to a property that only triggers redraw, not relayout.",
      },
      {
        t: "code",
        title: "Animated color, read efficiently",
        code: `val bg by animateColorAsState(if (selected) Primary else Surface, label = "bg")
// Fine (background just redraws):
Box(Modifier.background(bg))
// Hot path: read in draw phase to avoid recomposition each frame
Box(Modifier.drawBehind { drawRect(bg) })`,
      },
      {
        t: "list",
        items: [
          "**`animateColorAsState`** — declarative; set the target and it animates, interpolating across the color space.",
          "**Read location matters** — background/tint typically only redraw (cheap); avoid animated colors driving layout.",
          "**Spec control** — pass `animationSpec = tween/spring` for feel.",
          "**Batch related changes** — if color + size change together, use `updateTransition` so they stay synced.",
        ],
      },
      {
        t: "note",
        text: "animateColorAsState(target) animates on target change (interpolating in color space). It's cheap for background/tint (redraw only); for hot paths read it in a draw modifier (drawBehind) to avoid per-frame recomposition, and use updateTransition when color changes alongside size/elevation.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test animations and make them deterministic in UI tests?",
    a: [
      {
        t: "p",
        text: "Compose UI tests run with an automatically-controlled clock: the test framework advances the animation clock manually so tests are deterministic. By default `waitForIdle`/auto-sync waits for animations to finish; when you need to assert *mid-animation* state, disable auto-advance and step the clock with `mainClock.advanceTimeBy`.",
      },
      {
        t: "code",
        title: "Controlling the test clock",
        code: `composeTestRule.mainClock.autoAdvance = false   // stop auto-advancing
composeTestRule.onNodeWithText("Expand").performClick()
composeTestRule.mainClock.advanceTimeBy(150)    // step into the middle of the animation
// assert an intermediate state...
composeTestRule.mainClock.advanceTimeBy(1000)   // finish it
composeTestRule.onNodeWithText("Details").assertIsDisplayed()`,
      },
      {
        t: "list",
        items: [
          "**Auto-advance (default)** — the clock advances and `waitForIdle` blocks until animations settle; good for asserting end state.",
          "**Manual clock** — set `mainClock.autoAdvance = false` and use `advanceTimeBy`/`advanceTimeByFrame` to assert intermediate frames deterministically.",
          "**Infinite animations** — with an active infinite animation, the tree is never 'idle'; you must control the clock manually or the test hangs.",
          "**Disable system animations** for instrumented tests, but Compose's own clock control is separate and reliable.",
        ],
      },
      {
        t: "note",
        text: "Compose UI tests use a controllable animation clock: by default it auto-advances and waitForIdle waits for animations to settle (assert end state). Set mainClock.autoAdvance = false + advanceTimeBy to assert mid-animation frames deterministically. Infinite animations never idle — you MUST control the clock or the test hangs.",
      },
    ],
  },
];

export default qa;
