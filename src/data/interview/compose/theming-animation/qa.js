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
];

export default qa;
