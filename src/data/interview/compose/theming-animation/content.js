// Theming & Animation — Content tab. Teaching-first.

const content = [
  {
    heading: "How theming works in Compose — CompositionLocal, not global styles",
    blocks: [
      {
        t: "p",
        text: "In the View system, themes were global XML attributes resolved through a `Context`. Compose does it differently: a theme is a set of values (colors, typography, shapes) **provided implicitly down the composition tree** via **CompositionLocal**, and composables read them where needed. `MaterialTheme` is just a composable that provides three CompositionLocals — `LocalColorScheme`, `LocalTypography`, `LocalShapes` — to everything inside it.",
      },
      {
        t: "code",
        title: "A theme is a provider + accessor object",
        code: `@Composable
fun AppTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    val colors = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colors,
        typography = AppTypography,
        shapes = AppShapes,
        content = content,
    )
}

// Read anywhere below via the MaterialTheme accessor object:
Text(
    text = "Title",
    color = MaterialTheme.colorScheme.primary,     // reads LocalColorScheme
    style = MaterialTheme.typography.headlineMedium // reads LocalTypography
)`,
      },
      {
        t: "list",
        items: [
          "**Why CompositionLocal**: it lets a value be available to a whole subtree *without threading it through every function's parameters*. The theme is 'ambient' — any composable can read `MaterialTheme.colorScheme` without being passed it.",
          "Because reading a CompositionLocal is a **state read**, switching the theme (light→dark) *recomposes exactly the composables that read the changed values* — theming is reactive for free.",
          "Nesting themes is natural: wrap a subtree in another `MaterialTheme(...)` to override values just there (a red-accented section), because the inner provider shadows the outer for that subtree.",
        ],
      },
    ],
  },
  {
    heading: "Material 3, color schemes, and dynamic color",
    blocks: [
      {
        t: "list",
        items: [
          "**Material 3 (Material You)** is the current design system: `ColorScheme` has semantic roles — `primary`, `onPrimary`, `secondary`, `surface`, `onSurface`, `error`, `surfaceVariant`, etc. You style by *role* (`onSurface` = 'content on a surface'), never by raw hex, so light/dark and dynamic themes swap automatically.",
          "**Light & dark** are two `ColorScheme` instances; you pick based on `isSystemInDarkTheme()`. Because components read roles, the same composables render correctly in both — no separate dark layouts.",
          "**Dynamic color** (Android 12+): `dynamicDarkColorScheme(context)` / `dynamicLightColorScheme(context)` derive the scheme from the user's wallpaper — the 'Material You' personalization. Gate it on `Build.VERSION >= S` with a static fallback for older devices.",
          "**Content color propagation**: `Surface` sets a `LocalContentColor` matching its background, so `Text`/`Icon` inside automatically use the correct 'on' color — a big reason to wrap regions in `Surface` rather than raw `Box` with a background.",
        ],
      },
      {
        t: "code",
        title: "Dynamic color with fallback",
        code: `val colorScheme = when {
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
        if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
    darkTheme -> DarkColorScheme
    else -> LightColorScheme
}`,
      },
    ],
  },
  {
    heading: "CompositionLocal — the mechanism, and when to create your own",
    blocks: [
      {
        t: "p",
        text: "A **CompositionLocal** is a way to pass data implicitly through the composition tree. You *provide* a value at some level and *read* it anywhere below, without parameters in between. Compose ships many: `LocalContext`, `LocalDensity`, `LocalConfiguration`, `LocalLifecycleOwner`, `LocalContentColor`.",
      },
      {
        t: "code",
        title: "Defining and providing a custom CompositionLocal",
        code: `// Two flavors:
val LocalSpacing = staticCompositionLocalOf { Spacing() }     // rarely changes
val LocalUser = compositionLocalOf<User?> { null }            // changes over time

// Provide:
CompositionLocalProvider(LocalSpacing provides Spacing(large = 24.dp)) {
    Screen()   // everything inside can read LocalSpacing.current
}

// Read:
val spacing = LocalSpacing.current`,
      },
      {
        t: "list",
        items: [
          "**`staticCompositionLocalOf` vs `compositionLocalOf`**: the *static* one doesn't track reads — changing it recomposes the **entire** provided subtree (cheap to read, expensive to change; use for values that essentially never change, like a design-system spacing object). The regular one tracks reads and recomposes only actual readers (use for values that change at runtime, like the current user).",
          "**When to create one**: genuinely cross-cutting, ambient values many composables need — theme extensions (custom spacing/elevation tokens), the current logged-in user for deep trees, analytics loggers. ",
          "**When NOT to** (the interview caveat): CompositionLocal is implicit — it hides dependencies, hurts testability and preview-ability, and makes data flow hard to follow. For normal data, **prefer explicit parameters**. Rule of thumb: use it only when passing the value as a parameter through many layers would be clearly worse, and the value is truly 'ambient'.",
        ],
      },
    ],
  },
  {
    heading: "Animations — the high-level APIs (cover 90% of needs)",
    blocks: [
      {
        t: "p",
        text: "Compose animations are **state-driven**: you animate by changing state and letting an animation API interpolate toward the new value. The high-level APIs are named for what they animate:",
      },
      {
        t: "code",
        title: "The everyday animation toolkit",
        code: `// 1) animate*AsState — animate a single value toward a target
val color by animateColorAsState(if (selected) Blue else Gray, label = "color")
val size by animateDpAsState(if (expanded) 200.dp else 100.dp, label = "size")

// 2) AnimatedVisibility — animate appearance/disappearance
AnimatedVisibility(
    visible = showDetails,
    enter = fadeIn() + expandVertically(),
    exit = fadeOut() + shrinkVertically(),
) { DetailsPanel() }

// 3) AnimatedContent — animate BETWEEN different contents/states
AnimatedContent(targetState = count, label = "count") { value ->
    Text("$value")   // old value animates out, new animates in
}

// 4) Modifier.animateContentSize — animate size changes automatically
Column(Modifier.animateContentSize()) { /* grows/shrinks smoothly */ }

// 5) animateItem() — lazy-list item placement animations (needs keys)
items(list, key = { it.id }) { Row(Modifier.animateItem()) { /* ... */ } }`,
      },
      {
        t: "list",
        items: [
          "**`animate*AsState`** is the workhorse: give it a *target* value; it returns a `State` that smoothly moves there whenever the target changes. Variants for every type (`Float`, `Dp`, `Color`, `Offset`, `IntSize`…), plus `animateValueAsState` with a custom `TwoWayConverter` for your own types.",
          "**`AnimatedVisibility`** animates a composable entering/leaving; enter/exit transitions compose with `+` (`fadeIn() + slideInHorizontally()`).",
          "**`AnimatedContent`** cross-fades/transitions between *different content* for different states (a counter, a loading→loaded swap) with configurable `transitionSpec`.",
          "**`Modifier.animateContentSize()`** smoothly animates a composable's own size changes — great for expandable cards.",
        ],
      },
    ],
  },
  {
    heading: "AnimationSpec — controlling the motion",
    blocks: [
      {
        t: "p",
        text: "Every animation takes an **`AnimationSpec`** describing *how* the value moves over time. The two families:",
      },
      {
        t: "list",
        items: [
          "**Duration-based — `tween`**: fixed duration + easing curve. `tween(300, easing = FastOutSlowInEasing)`. Predictable; use for deterministic transitions (a panel sliding in).",
          "**Physics-based — `spring`**: no fixed duration; motion follows spring dynamics via `dampingRatio` (bounciness) and `stiffness` (speed). `spring(dampingRatio = Spring.DampingRatioMediumBouncy)`. Feels natural and, crucially, is **interruptible**: if the target changes mid-animation, a spring smoothly redirects from its current velocity rather than restarting — the right default for gesture-driven and frequently-changing values.",
          "**`keyframes`**: specify values at specific timestamps for complex multi-stage motion.",
          "**`repeatable`/`infiniteRepeatable`**: loop an animation (pulsing, loading shimmer) — used with `rememberInfiniteTransition`.",
        ],
      },
      {
        t: "code",
        title: "Specs and an infinite animation",
        code: `val offset by animateDpAsState(
    targetValue = target,
    animationSpec = spring(stiffness = Spring.StiffnessLow),
    label = "offset",
)

// Infinite pulse:
val infinite = rememberInfiniteTransition(label = "pulse")
val scale by infinite.animateFloat(
    initialValue = 1f, targetValue = 1.2f,
    animationSpec = infiniteRepeatable(tween(600), RepeatMode.Reverse),
    label = "scale",
)`,
      },
    ],
  },
  {
    heading: "Lower-level animation: Animatable, Transition, and performance",
    blocks: [
      {
        t: "list",
        items: [
          "**`Animatable`** — the imperative, coroutine-based primitive underneath `animate*AsState`. You `animateTo()`/`snapTo()` from a coroutine and can read velocity, cancel, and chain — needed for **gesture-driven** animation (swipe-to-dismiss, draggable with fling) where you drive the value manually. `val offset = remember { Animatable(0f) }` then `offset.animateTo(target)`.",
          "**`Transition` (`updateTransition`)** — coordinates **multiple animations off one state change**, all staying in sync (e.g. a selection toggling color + size + elevation together). Also gives named child animations for tooling.",
          "**`rememberInfiniteTransition`** — for endless animations (shimmer, pulse) decoupled from state.",
          "**Performance rule** (ties to the Performance topic): high-frequency animation values should be read in **layout/draw**, not composition — `Modifier.offset { }`, `Modifier.graphicsLayer { }` — so each frame re-lays-out or re-draws instead of recomposing. Reading `animatedValue.value` directly in a modifier's non-lambda argument recomposes every frame; the lambda form defers it. This single point is the intersection of the animation and performance topics interviewers love to probe.",
          "Always pass a **`label`** to animations — it names them in the Animation Preview/inspector tooling (and is required-ish in newer APIs).",
        ],
      },
    ],
  },
];

export default content;
