// Navigation, Interop & Testing — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "How does navigation work in Jetpack Compose?",
    a: [
      {
        t: "p",
        text: "**The concept**: Navigation Compose treats screens as composables managed in a **back stack** by a `NavController`. You set up a `NavHost` that lists your destinations — each `composable(route) { ScreenContent() }` — and the NavController decides which one is currently shown and keeps the history for the back button. A whole app can be a single Activity hosting many composable destinations, rather than many Activities/Fragments.",
      },
      {
        t: "code",
        title: "Minimal setup",
        code: `val navController = rememberNavController()
NavHost(navController, startDestination = "feed") {
    composable("feed") {
        FeedScreen(onOpen = { id -> navController.navigate("detail/$id") })
    }
    composable("detail/{id}") { entry ->
        DetailScreen(entry.arguments?.getString("id"))
    }
}`,
      },
      {
        t: "p",
        text: "You navigate with `navController.navigate(route)` (push) and `popBackStack()`/`navigateUp()` (pop). Arguments ride in the route string (`detail/{id}`) and are read from the destination's `backStackEntry.arguments`. You can also control the stack with options like `popUpTo` and `launchSingleTop` — the Compose equivalent of Activity launch modes — and map external URIs with deep links. Modern Navigation also supports *type-safe* routes using `@Serializable` classes so arguments are real typed fields instead of strings.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you pass arguments to a destination, and why shouldn't you pass large objects?",
    a: [
      {
        t: "p",
        text: "**How**: with string routes, arguments are placeholders in the route (`\"detail/{itemId}\"`), supplied when navigating (`navigate(\"detail/42\")`) and read from `backStackEntry.arguments`. With type-safe routes, they're constructor parameters of a `@Serializable` route class (`navigate(Detail(itemId = \"42\"))`), read back via `backStackEntry.toRoute<Detail>()`. Either way they also flow into the destination's `SavedStateHandle`, so a ViewModel scoped to that destination receives them automatically — which is the cleanest way to consume them.",
      },
      {
        t: "p",
        text: "**Why not large objects**: navigation arguments are serialized into the back stack's saved state (and, for deep links, into URIs). That mechanism is meant for small, identifier-like values — passing a whole parcelable object couples screens tightly, risks exceeding saved-state size limits (the same `TransactionTooLargeException` family as any Bundle abuse), and means the object can go stale. The idiomatic approach is to **pass an id** and have the destination load the actual data from a repository (which is the single source of truth anyway). If you truly need to hand a result *back* to the previous screen, use the previous back-stack entry's SavedStateHandle rather than forward arguments.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you embed a classic Android View (like a MapView or WebView) in Compose?",
    a: [
      {
        t: "p",
        text: "**The concept**: some UI isn't available in Compose or is expensive to reimplement — Google Maps' `MapView`, `WebView`, ad SDK views, camera preview, complex legacy custom Views. The `AndroidView` composable embeds any classic `View` inside a composition.",
      },
      {
        t: "code",
        title: "AndroidView with factory + update",
        code: `AndroidView(
    factory = { context -> WebView(context) },   // created ONCE
    update = { webView -> webView.loadUrl(url) }, // runs on recomposition
    modifier = Modifier.fillMaxSize(),
)`,
      },
      {
        t: "p",
        text: "`factory` builds the View a single time and Compose caches it; `update` runs whenever the composable recomposes, and it's where you *imperatively push new state into the View* (the old mutate-the-widget way) — bridging Compose's declarative world to the View's imperative one. The important gotcha to mention: Views like `MapView`/`WebView` have their own lifecycle (`onResume`/`onPause`/`onDestroy`) that Compose won't call — you forward those using a `DisposableEffect` with a `LifecycleEventObserver`, or the view leaks/freezes. The reverse direction (Compose inside Views) uses `ComposeView` — a normal View you place in XML or a Fragment and call `setContent { }` on, which is how apps migrate to Compose screen by screen.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you write a basic UI test for a composable?",
    a: [
      {
        t: "p",
        text: "**The concept**: Compose UI tests use a `ComposeTestRule` (from `createComposeRule()`), which lets you set content and then interact with it. The pattern is always **find → act → assert**: find a node in the semantics tree, perform an action, assert on the result. There are no Espresso view matchers — you query what the UI *means*, not View objects.",
      },
      {
        t: "code",
        title: "Find, act, assert",
        code: `@get:Rule val rule = createComposeRule()

@Test fun increments() {
    rule.setContent { AppTheme { Counter() } }

    rule.onNodeWithText("Count: 0").assertIsDisplayed()  // find + assert
    rule.onNodeWithText("Increment").performClick()       // act
    rule.onNodeWithText("Count: 1").assertExists()        // assert
}`,
      },
      {
        t: "list",
        items: [
          "**Finders**: `onNodeWithText`, `onNodeWithContentDescription`, `onNodeWithTag` (with `Modifier.testTag(\"...\")` in the UI).",
          "**Actions**: `performClick`, `performTextInput`, `performScrollTo`, `performTouchInput { swipeUp() }`.",
          "**Assertions**: `assertIsDisplayed`, `assertExists`, `assertTextEquals`, `assertIsEnabled`.",
          "**Auto-sync**: the test automatically waits for recomposition and Compose animations to settle before each assertion, so you rarely write manual waits. A big convenience over Espresso's idling resources.",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "What is the semantics tree in Compose?",
    a: [
      {
        t: "p",
        text: "**The concept**: because Compose draws everything into essentially one custom View, there are no individual View objects for accessibility services or test frameworks to inspect. So Compose maintains a *parallel* tree — the **semantics tree** — that describes what the UI *means* rather than how it's drawn: 'this node is a button', 'its label is Submit', 'it's disabled', 'this text says Count: 3'. It's the machine-readable meaning of the screen.",
      },
      {
        t: "p",
        text: "**Who reads it**: two audiences, and that's the key insight — **accessibility services** (TalkBack announces nodes from it) and **UI tests** (finders like `onNodeWithText` query it). Material components populate it automatically (a `Button` reports itself as a button), and you enrich it with `contentDescription` for images, `Modifier.semantics { }`, and `Modifier.testTag` for test handles. The practical consequence worth stating: because tests and accessibility read the *same* tree, writing accessible UI is simultaneously writing testable UI — and a custom gesture built on raw `pointerInput` (which adds no semantics) is invisible to *both* TalkBack and tests until you add semantics explicitly.",
      },
    ],
  },
  {
    level: "senior",
    q: "How are ViewModels scoped in Navigation Compose, and how do you share one across a multi-screen flow?",
    a: [
      {
        t: "p",
        text: "**The foundation**: each destination's `NavBackStackEntry` is a `ViewModelStoreOwner`. So calling `hiltViewModel()` inside a `composable(route) { }` scopes that ViewModel to *that back-stack entry* — it's created when you navigate to the destination and `onCleared()` when the entry is popped off the stack. This gives precise, automatic lifetimes: a detail screen's ViewModel lives exactly as long as the detail screen is on the stack, surviving that screen's own configuration changes but not outliving it.",
      },
      {
        t: "list",
        items: [
          "**Sharing across a flow** — the main technique: define a **nested navigation graph** for the flow (e.g. a checkout with address → payment → review screens) and scope the ViewModel to the *graph's* back-stack entry instead of an individual screen: `val parentEntry = remember(entry) { navController.getBackStackEntry(\"checkout_graph\") }; val vm = hiltViewModel(parentEntry)`. All three screens get the *same* ViewModel, and it's cleared only when the entire flow is popped. Perfect for wizard-style state that must persist across steps but not leak beyond the flow.",
          "**Returning results to a previous screen**: write into `navController.previousBackStackEntry?.savedStateHandle` before popping; the previous screen observes that SavedStateHandle (as state/flow). This is the Compose replacement for `startActivityForResult` / `setFragmentResult` — used for pickers and selection screens.",
          "**Avoid the anti-pattern**: scoping shared state to the *Activity* ViewModel to 'share it everywhere' — that outlives every flow, accumulates state, and obscures data flow. Graph scoping gives sharing *with* correct cleanup.",
          "**Arguments → SavedStateHandle**: because destination arguments land in the SavedStateHandle, a scoped ViewModel can read `savedStateHandle.toRoute<Detail>()` (or `savedStateHandle[\"id\"]`) directly — no need to pass args through the composable into the ViewModel manually, and it survives process death.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "Compare string-based routes and type-safe navigation. What are the trade-offs?",
    a: [
      {
        t: "p",
        text: "**String routes** (`\"detail/{itemId}\"`) were the original model: destinations and arguments are encoded as strings, navigation is `navigate(\"detail/$id\")`, and you declare argument types with `navArgument`. **Type-safe routes** (recent) use `@Serializable` objects/classes as destinations — `@Serializable data class Detail(val itemId: String)` — so `navigate(Detail(itemId = id))` and `backStackEntry.toRoute<Detail>()` are fully typed.",
      },
      {
        t: "list",
        items: [
          "**Compile-time safety**: string routes fail at *runtime* on a typo or wrong argument type ('detial/42' compiles fine, crashes on navigate); type-safe routes are checked by the compiler — the biggest advantage.",
          "**Argument handling**: strings require manual placeholders, `navArgument` type declarations, and parsing (`getString`, `getInt`); type-safe routes make arguments plain constructor properties with correct types, including nullable and default values, no parsing.",
          "**Refactoring**: renaming a type-safe destination or changing an argument is a compiler-guided refactor; with strings you grep and pray.",
          "**Readability & discoverability**: a route class documents exactly what arguments a screen needs; a route string hides it in a format convention.",
          "**Costs of type-safe**: requires kotlinx.serialization setup; complex/custom argument types need custom `NavType`; and existing large codebases are full of string routes, so you must still read and maintain them.",
        ],
      },
      {
        t: "p",
        text: "**Recommendation**: type-safe routes for new code — they eliminate a whole class of runtime navigation crashes and make arguments first-class. String routes remain valid and ubiquitous, so know both; a migration can be incremental since they interoperate within the same NavHost.",
      },
    ],
  },
  {
    level: "senior",
    q: "You're embedding a MapView in Compose and it leaks / goes blank on backgrounding. What's wrong and how do you fix it?",
    a: [
      {
        t: "p",
        text: "**The root cause**: `MapView` (like `WebView`, camera preview, and other stateful legacy Views) is a lifecycle-aware component — it *requires* `onCreate`/`onStart`/`onResume`/`onPause`/`onStop`/`onDestroy` to be called at the right times to allocate/release its rendering resources. When you drop it into `AndroidView`, Compose creates the View but has **no idea** it needs these callbacks — nothing forwards them. So the map never gets `onResume` (goes blank) and never gets `onDestroy` (leaks native/graphics resources and often the Context).",
      },
      {
        t: "code",
        title: "The fix — forward the lifecycle via DisposableEffect + observer",
        code: `@Composable
fun MapViewContainer(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    val mapView = remember { MapView(context) }

    // Forward host lifecycle events into the MapView
    DisposableEffect(lifecycle, mapView) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_CREATE  -> mapView.onCreate(Bundle())
                Lifecycle.Event.ON_START   -> mapView.onStart()
                Lifecycle.Event.ON_RESUME  -> mapView.onResume()
                Lifecycle.Event.ON_PAUSE   -> mapView.onPause()
                Lifecycle.Event.ON_STOP    -> mapView.onStop()
                Lifecycle.Event.ON_DESTROY -> mapView.onDestroy()
                else -> {}
            }
        }
        lifecycle.addObserver(observer)
        onDispose {
            lifecycle.removeObserver(observer)
            mapView.onDestroy()   // release when the composable leaves
        }
    }

    AndroidView(factory = { mapView }, modifier = modifier)
}`,
      },
      {
        t: "list",
        items: [
          "**Why `remember` the MapView**: creating it in `AndroidView`'s factory is fine, but you need a stable reference to forward callbacks to — `remember { MapView(context) }` gives it, surviving recomposition.",
          "**Why `DisposableEffect`**: it registers the lifecycle observer on enter and, crucially, its `onDispose` both removes the observer and calls `mapView.onDestroy()` when the composable leaves the composition — closing the leak.",
          "**The general principle**: any stateful, lifecycle-owning View embedded via `AndroidView` needs its lifecycle bridged this way. In practice, use the official wrappers when they exist (Maps Compose's `GoogleMap`, Accompanist/AndroidX WebView wrappers) — they encapsulate exactly this. Hand-rolling it is the fallback and the thing to demonstrate you understand.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle test synchronization and animations in Compose UI tests?",
    a: [
      {
        t: "p",
        text: "**What Compose does for you**: the test framework maintains an *idling* concept synchronized with the Compose runtime — before each assertion/action it waits until there are no pending recompositions, no pending layout/draw, and no running Compose-driven animations. This auto-synchronization is why Compose tests rarely need the manual `IdlingResource` dance Espresso required — you write `performClick()` then immediately `assertExists()` and the framework guarantees the recomposition settled in between.",
      },
      {
        t: "list",
        items: [
          "**Where auto-sync breaks — indefinite animations**: an infinite animation (loading shimmer, pulsing indicator) never goes idle, so the test would hang waiting. Fix: take control of the clock with `composeRule.mainClock.autoAdvance = false`, then manually `mainClock.advanceTimeBy(millis)` to step the animation to known points and assert frame by frame.",
          "**External async (network, other threads)**: Compose can only sync with *its own* work, not your coroutines hitting a fake repository. Use fakes with controllable completion, or `composeRule.waitUntil(timeout) { condition }` to poll the semantics tree until the expected state appears.",
          "**`waitForIdle()` / `awaitIdle()`**: explicit sync points when you've disabled auto-advance or need to force a flush.",
          "**Controlling the clock is also a feature, not just a workaround**: pausing the clock lets you assert intermediate animation states deterministically (e.g. 'at 150ms the fade is half done'), which is impossible with a free-running clock.",
          "**Testing strategy that avoids the pain**: prefer testing *stateless content composables* with injected fake state and lambdas — they have no async and settle instantly — and reserve full route+ViewModel+animation integration tests for the few flows that need them. Fast, stable unit-style UI tests plus a thin layer of integration tests.",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "What are the core pieces of Navigation Compose (NavController, NavHost, composable destinations)?",
    a: [
      {
        t: "p",
        text: "Navigation Compose has three core pieces: a `NavController` (holds the back stack and performs navigation), a `NavHost` (maps routes to composable screens and shows the current one), and `composable(route) { }` entries (the destinations). You navigate by calling `navController.navigate(route)`; the `NavHost` swaps the displayed screen.",
      },
      {
        t: "code",
        title: "Minimal navigation graph",
        code: `val navController = rememberNavController()
NavHost(navController, startDestination = "home") {
    composable("home") { HomeScreen(onOpen = { navController.navigate("detail/\$it") }) }
    composable("detail/{id}") { entry ->
        DetailScreen(id = entry.arguments?.getString("id"))
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`NavController`** — the single owner of the back stack; `navigate`, `popBackStack`, `navigateUp`.",
          "**`NavHost`** — binds the controller to a graph and renders the current destination (each destination is a back-stack entry with its own lifecycle and saved state).",
          "**`composable(route)`** — a destination; routes can carry path (`{id}`) and query (`?q=`) arguments.",
          "**`rememberNavController()`** — creates/remembers the controller; hoist it if multiple composables need it.",
        ],
      },
      {
        t: "note",
        text: "Navigation Compose = NavController (owns the back stack: navigate/popBackStack/navigateUp) + NavHost (maps routes→screens, renders current, each destination a lifecycle-owning back-stack entry) + composable(route){} destinations. Navigate via navController.navigate(route); the NavHost swaps the screen.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you navigate back, and control the back stack (popUpTo, launchSingleTop)?",
    a: [
      {
        t: "p",
        text: "You go back with `navController.popBackStack()` or `navigateUp()`. To shape the stack when navigating forward, `navigate` takes options: `popUpTo` (pop destinations up to a given route before navigating) and `launchSingleTop` (don't create a duplicate if that destination is already on top). These prevent back-stack bloat and duplicate screens.",
      },
      {
        t: "code",
        title: "Back-stack control",
        code: `// After login, go to home and clear the auth flow so back doesn't return to login:
navController.navigate("home") {
    popUpTo("login") { inclusive = true }   // remove login (and above) from the stack
    launchSingleTop = true                  // avoid a duplicate home on top
}
// Bottom-nav tab switch (avoid stacking tabs):
navController.navigate(route) {
    popUpTo(navController.graph.startDestinationId) { saveState = true }
    launchSingleTop = true
    restoreState = true
}`,
      },
      {
        t: "list",
        items: [
          "**`popBackStack()` / `navigateUp()`** — go back; `navigateUp` respects the nav host's up behavior.",
          "**`popUpTo(route) { inclusive }`** — pop the stack up to (and optionally including) a route before navigating — clearing flows (login) or resetting.",
          "**`launchSingleTop`** — reuse the top instance instead of duplicating (double-tap protection, tabs).",
          "**`saveState`/`restoreState`** — preserve each tab's back stack in bottom navigation.",
        ],
      },
      {
        t: "note",
        text: "Back: popBackStack()/navigateUp(). Shape the forward stack in navigate {}: popUpTo(route){inclusive} to clear a flow (e.g. login), launchSingleTop to avoid duplicates, saveState/restoreState for per-tab back stacks in bottom nav. These stop back-stack bloat and duplicate screens.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you return a result from one screen to a previous one in Navigation Compose?",
    a: [
      {
        t: "p",
        text: "There's no `startActivityForResult` equivalent; instead you use the previous back-stack entry's `SavedStateHandle`. The destination that produced the result writes it into `previousBackStackEntry.savedStateHandle`, and the origin screen observes that key (as state or a flow) after popping back.",
      },
      {
        t: "code",
        title: "Passing a result back",
        code: `// On the picker screen, set the result then pop:
navController.previousBackStackEntry?.savedStateHandle?.set("picked", selectedId)
navController.popBackStack()

// On the origin screen, observe it:
val entry = navController.currentBackStackEntry
val picked by entry?.savedStateHandle
    ?.getStateFlow<String?>("picked", null)
    ?.collectAsStateWithLifecycle() ?: return`,
      },
      {
        t: "list",
        items: [
          "**Use `SavedStateHandle` of the previous entry** — write on the producer, read on the consumer; it survives config change/process death.",
          "**Observe as a flow/state** — `getStateFlow(key, default)` so you react when the result arrives after `popBackStack`.",
          "**Clear after consuming** — remove the key so it doesn't re-deliver on the next recomposition/return.",
          "**Alternative** — a shared ViewModel scoped to a nav graph for richer cross-screen data (see the shared-ViewModel question).",
        ],
      },
      {
        t: "note",
        text: "Return results via the previousBackStackEntry.savedStateHandle: producer sets the key then popBackStack(); consumer observes getStateFlow(key) and clears it after reading. Survives config change/process death. For richer sharing, use a ViewModel scoped to a nav graph instead.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you set up bottom navigation with Navigation Compose?",
    a: [
      {
        t: "p",
        text: "Render a `NavigationBar` with items whose selection is driven by the current back-stack entry's route, and navigate on tap with `popUpTo(startDestination){ saveState }` + `restoreState` + `launchSingleTop` so each tab keeps its own back stack and you don't pile up destinations.",
      },
      {
        t: "code",
        title: "Bottom nav wiring",
        code: `val backStack by navController.currentBackStackEntryAsState()
val current = backStack?.destination
NavigationBar {
    tabs.forEach { tab ->
        NavigationBarItem(
            selected = current?.hierarchy?.any { it.route == tab.route } == true,
            onClick = {
                navController.navigate(tab.route) {
                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                    launchSingleTop = true; restoreState = true
                }
            },
            icon = { Icon(tab.icon, null) }, label = { Text(tab.label) },
        )
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Selection from route** — `currentBackStackEntryAsState()` gives the current destination; check the hierarchy so nested destinations still highlight the right tab.",
          "**`saveState`/`restoreState`** — preserve each tab's scroll/back stack across switches.",
          "**`launchSingleTop`** — re-tapping a tab doesn't stack duplicates.",
          "**`popUpTo(startDestination)`** — keeps the back stack shallow (back from any tab goes to start/exit, per your UX).",
        ],
      },
      {
        t: "note",
        text: "Bottom nav: drive NavigationBarItem selection from currentBackStackEntryAsState() (check destination.hierarchy for nested routes), and navigate with popUpTo(startDestination){saveState=true} + launchSingleTop + restoreState so each tab keeps its own back stack without piling up duplicates.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do nested navigation graphs work, and when do you use them?",
    a: [
      {
        t: "p",
        text: "A nested graph (`navigation(startDestination, route) { ... }`) groups related destinations under a parent route — e.g. an onboarding flow or a feature module's screens. It gives that flow its own start destination, a scope for a shared ViewModel, and a clean boundary you can navigate to/pop as a unit.",
      },
      {
        t: "code",
        title: "A nested graph",
        code: `NavHost(navController, startDestination = "main") {
    composable("main") { MainScreen() }
    navigation(startDestination = "step1", route = "onboarding") {   // nested graph
        composable("step1") { Step1() }
        composable("step2") { Step2() }
    }
}
navController.navigate("onboarding")   // enters at step1`,
      },
      {
        t: "list",
        items: [
          "**Grouping + encapsulation** — a self-contained flow with its own start destination; feature modules expose a nested graph.",
          "**Shared ViewModel scope** — a ViewModel scoped to the graph's back-stack entry is shared across the flow's screens and cleared when the flow is popped.",
          "**Navigate as a unit** — `navigate(\"onboarding\")` enters the flow; `popUpTo(\"onboarding\") { inclusive = true }` exits the whole flow.",
          "**Modularization** — each feature contributes its graph (`NavGraphBuilder` extension), keeping the app module thin.",
        ],
      },
      {
        t: "note",
        text: "Nested graphs (navigation(startDestination, route){}) group a flow (onboarding, a feature) with its own start destination, a shared-ViewModel scope (the graph back-stack entry), and unit navigation (enter with navigate(route), exit with popUpTo(route){inclusive}). They're how feature modules contribute self-contained nav graphs.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you implement deep links with Navigation Compose?",
    a: [
      {
        t: "p",
        text: "Add `deepLinks = listOf(navDeepLink { uriPattern = ... })` to a `composable` destination; Navigation matches an incoming `Uri` (from an intent, notification, or App Link) to that destination and extracts arguments from the pattern. You also declare the intent filter in the manifest for external links.",
      },
      {
        t: "code",
        title: "A deep-linkable destination",
        code: `composable(
    route = "product/{id}",
    arguments = listOf(navArgument("id") { type = NavType.StringType }),
    deepLinks = listOf(navDeepLink { uriPattern = "https://shop.com/product/{id}" }),
) { entry -> ProductScreen(id = entry.arguments?.getString("id")) }
// + an <intent-filter> with the host/scheme in AndroidManifest for external App Links`,
      },
      {
        t: "list",
        items: [
          "**`navDeepLink { uriPattern }`** — maps a URI (with `{arg}` placeholders) to the destination; args are parsed automatically.",
          "**Manifest intent filter** — required for links coming from outside the app (App Links with `autoVerify` for verified https links).",
          "**NavController handling** — `NavController` reads the launching intent and navigates, building the proper back stack.",
          "**Testing** — `adb shell am start -d \"https://shop.com/product/42\"` to verify.",
        ],
      },
      {
        t: "note",
        text: "Deep links: add deepLinks = listOf(navDeepLink { uriPattern = \"https://…/{id}\" }) to the composable destination (args auto-parsed), plus a manifest <intent-filter> (autoVerify for App Links) for external URIs. NavController matches the launching intent and builds the back stack. Test with adb am start -d.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you add screen transition animations in Navigation Compose?",
    a: [
      {
        t: "p",
        text: "`composable()` accepts `enterTransition`, `exitTransition`, `popEnterTransition`, and `popExitTransition` lambdas (with access to the initial/target states) so you can define slide/fade animations per destination or on the whole `NavHost`. This replaced the older Accompanist Navigation-Animation, which is now built in.",
      },
      {
        t: "code",
        title: "Per-destination transitions",
        code: `composable(
    "detail/{id}",
    enterTransition = { slideInHorizontally { it } + fadeIn() },
    exitTransition = { slideOutHorizontally { -it } + fadeOut() },
    popEnterTransition = { slideInHorizontally { -it } + fadeIn() },
    popExitTransition = { slideOutHorizontally { it } + fadeOut() },
) { DetailScreen() }`,
      },
      {
        t: "list",
        items: [
          "**Four hooks** — enter/exit for forward navigation, popEnter/popExit for back navigation (so back animates in reverse).",
          "**Set on NavHost or per-destination** — a default on the `NavHost`, overridden per `composable`.",
          "**Access transition scope** — the lambdas expose `initialState`/`targetState` to vary the animation by route.",
          "**Shared elements** — combine with `SharedTransitionLayout` for hero transitions between destinations.",
        ],
      },
      {
        t: "note",
        text: "Set enterTransition/exitTransition/popEnterTransition/popExitTransition on the NavHost or per composable() (slide/fade with access to initial/target states); pop* handle the reverse animation on back. Built-in now (replaced Accompanist Navigation-Animation). Combine with SharedTransitionLayout for hero transitions.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you find and interact with composables in a UI test (finders, matchers, actions)?",
    a: [
      {
        t: "p",
        text: "Compose testing works on the *semantics tree*: you find nodes with finders (`onNodeWithText`, `onNodeWithContentDescription`, `onNodeWithTag`), assert with matchers (`assertIsDisplayed`, `assertTextEquals`, `assertIsEnabled`), and act with actions (`performClick`, `performTextInput`, `performScrollTo`). A `testTag` gives a stable handle independent of visible text.",
      },
      {
        t: "code",
        title: "Find, act, assert",
        code: `// In the composable: Modifier.testTag(\"submit\")
composeTestRule.onNodeWithTag(\"emailField\").performTextInput(\"a@b.com\")
composeTestRule.onNodeWithTag(\"submit\").performClick()
composeTestRule.onNodeWithText(\"Welcome\").assertIsDisplayed()
composeTestRule.onNodeWithText(\"Error\").assertDoesNotExist()`,
      },
      {
        t: "list",
        items: [
          "**Finders** — `onNodeWithText`, `onNodeWithContentDescription`, `onNodeWithTag`, `onAllNodes...`; add `useUnmergedTree = true` when a merged node hides children.",
          "**Matchers/assertions** — `assertIsDisplayed`, `assertExists`/`assertDoesNotExist`, `assertTextEquals`, `assertIsEnabled`, `assertIsSelected`.",
          "**Actions** — `performClick`, `performTextInput`, `performScrollTo`, `performTouchInput { swipeUp() }`.",
          "**`testTag`** — a stable id for testing that survives copy changes and localization.",
        ],
      },
      {
        t: "note",
        text: "Compose tests operate on the semantics tree: find (onNodeWithText/ContentDescription/Tag, useUnmergedTree for hidden children), assert (assertIsDisplayed/assertTextEquals/assertDoesNotExist), act (performClick/performTextInput/performScrollTo). Use Modifier.testTag for stable handles independent of visible text/locale.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is testTag and mergeDescendants, and how do semantics merging affect tests?",
    a: [
      {
        t: "p",
        text: "Compose *merges* semantics of a composable and its descendants into one accessible node when a parent sets `mergeDescendants = true` (buttons, list items do this) — so a whole button reads as one node to accessibility and to tests. This means a child's `testTag` or text can be hidden inside a merged parent; tests use the *merged* tree by default but can request the *unmerged* tree to reach children.",
      },
      {
        t: "list",
        items: [
          "**Merging** — a semantically-merging parent (`Modifier.semantics(mergeDescendants = true)`, or components like `Button`) combines descendant semantics into one node.",
          "**Effect on tests** — `onNodeWithText` on child text inside a merged button finds the merged node; to assert on a specific child, use `useUnmergedTree = true`.",
          "**`testTag`** — by default a tag participates in merging; a child tag may be subsumed. Place tags thoughtfully, or read the unmerged tree.",
          "**Accessibility parallel** — merging is why TalkBack reads a button as one item; good semantics = testable *and* accessible.",
        ],
      },
      {
        t: "code",
        title: "Reaching a merged child",
        code: `composeTestRule.onNode(hasTestTag(\"badge\"), useUnmergedTree = true).assertIsDisplayed()`,
      },
      {
        t: "note",
        text: "Merging (mergeDescendants=true, as Button/ListItem do) combines a subtree's semantics into one node — good for TalkBack, but it hides child text/tags from the default (merged) test tree. Use useUnmergedTree = true to assert on specific children. Semantics that make tests work also make the app accessible.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you provide custom semantics for accessibility and testing?",
    a: [
      {
        t: "p",
        text: "Use `Modifier.semantics { }` to add accessibility/testing metadata — `contentDescription`, `role`, `stateDescription`, custom actions, or a `testTag` (via `testTagsAsResourceId` for UIAutomator). This makes custom-drawn or gesture-based composables (which have no built-in semantics) both accessible to TalkBack and findable in tests.",
      },
      {
        t: "code",
        title: "Custom semantics on a custom control",
        code: `Box(
    Modifier
        .pointerInput(Unit) { detectTapGestures { toggle() } }
        .semantics {
            role = Role.Switch
            stateDescription = if (on) \"On\" else \"Off\"
            contentDescription = \"Wi-Fi\"
            // custom action for accessibility services:
            customActions = listOf(CustomAccessibilityAction(\"Toggle\") { toggle(); true })
        }
)`,
      },
      {
        t: "list",
        items: [
          "**`semantics { }`** — attach `contentDescription`, `role`, `stateDescription`, `onClick`/custom actions.",
          "**Why needed** — raw `pointerInput`/`Canvas` composables have no semantics, so TalkBack can't announce them and tests can't find them by role/state.",
          "**`clearAndSetSemantics { }`** — replace a subtree's semantics wholesale (e.g. present a complex graphic as a single labeled element).",
          "**`stateDescription`** — announces on/off/selected changes; keep it in sync with state so accessibility and tests reflect reality.",
        ],
      },
      {
        t: "note",
        text: "Modifier.semantics { } adds contentDescription/role/stateDescription/custom actions to composables that lack built-in semantics (custom pointerInput/Canvas controls) — making them TalkBack-accessible AND test-findable. Use clearAndSetSemantics to present a complex subtree as one labeled node. Keep stateDescription synced with state.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is createComposeRule vs createAndroidComposeRule, and how do you set content in a test?",
    a: [
      {
        t: "p",
        text: "`createComposeRule()` hosts composables in a test without a specific Activity — fast, for pure UI/unit-level composable tests. `createAndroidComposeRule<MyActivity>()` launches a real Activity, needed when the composable depends on the Activity (permissions, `LocalContext` specifics, Hilt injection). You call `setContent { }` to render the composable under test.",
      },
      {
        t: "code",
        title: "Setting content",
        code: `@get:Rule val rule = createComposeRule()

@Test fun showsGreeting() {
    rule.setContent { AppTheme { Greeting(name = \"Sam\") } }
    rule.onNodeWithText(\"Hello Sam\").assertIsDisplayed()
}
// Activity-backed: @get:Rule val rule = createAndroidComposeRule<MainActivity>()`,
      },
      {
        t: "list",
        items: [
          "**`createComposeRule()`** — no Activity class; lighter and faster; use when the composable is self-contained.",
          "**`createAndroidComposeRule<A>()`** — launches Activity `A`; use for Activity-dependent behavior or when the content is already set by the Activity (then don't call `setContent`).",
          "**`setContent { }`** — render your composable, usually wrapped in `AppTheme` and any test doubles (fake ViewModel).",
          "**Hilt** — `createAndroidComposeRule` + `HiltAndroidRule` for injected dependencies.",
        ],
      },
      {
        t: "note",
        text: "createComposeRule() hosts composables without an Activity (fast, self-contained tests); createAndroidComposeRule<A>() launches a real Activity (for Activity/Context/Hilt-dependent UI). Call rule.setContent { AppTheme { … } } to render — wrap in the theme and pass fakes. Use Hilt rule with the Android variant for DI.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does test synchronization work in Compose, and how do you handle async content?",
    a: [
      {
        t: "p",
        text: "Compose tests auto-synchronize with the composition and animation clock: each assertion/action first waits for the app to be *idle* (no pending recomposition or animation). For async work (a coroutine loading data), you either let idling handle it or explicitly wait with `waitUntil { }` for a condition to become true, avoiding flaky `Thread.sleep`.",
      },
      {
        t: "code",
        title: "Waiting for async content",
        code: `rule.setContent { ProductScreen(viewModel = fakeVmThatLoadsAsync) }
rule.waitUntil(timeoutMillis = 5000) {
    rule.onAllNodesWithTag(\"product\").fetchSemanticsNodes().isNotEmpty()
}
rule.onNodeWithText(\"Loaded\").assertIsDisplayed()`,
      },
      {
        t: "list",
        items: [
          "**Auto-sync** — actions/assertions block until idle (no recomposition/animation pending), so most UI updates are handled automatically.",
          "**`waitUntil { }`** — poll a condition with a timeout for async data; better than sleeping.",
          "**`mainClock` control** — for animations, advance the clock manually (auto-advance off) to test intermediate states.",
          "**Idling resources** — a genuinely-async source not tracked by Compose (an external executor) may need coordination; prefer injecting a test dispatcher so coroutines run deterministically.",
        ],
      },
      {
        t: "note",
        text: "Compose tests auto-wait for idle (no pending recomposition/animation) before each action/assert. For async data use waitUntil { condition } with a timeout (never Thread.sleep); control mainClock for animations; inject a test dispatcher so ViewModel coroutines run deterministically. Idling makes most updates handled automatically.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a screen that uses a ViewModel and Compose state together?",
    a: [
      {
        t: "p",
        text: "Inject a *fake* or real-with-fakes ViewModel that exposes controllable state (a `MutableStateFlow` you push values into), set it as the screen's content, and drive the UI by emitting states — asserting the UI reflects each. Keep the ViewModel's coroutines on an injected test dispatcher so state changes are synchronous within the test.",
      },
      {
        t: "code",
        title: "Driving the screen via fake state",
        code: `val state = MutableStateFlow<UiState>(UiState.Loading)
val fakeVm = FakeVm(state)
rule.setContent { ProductScreen(viewModel = fakeVm) }

rule.onNodeWithTag(\"spinner\").assertIsDisplayed()      // Loading
state.value = UiState.Content(sampleProduct)            // emit new state
rule.onNodeWithText(sampleProduct.name).assertIsDisplayed()  // UI updated`,
      },
      {
        t: "list",
        items: [
          "**Controllable state** — a `MutableStateFlow` in the fake VM lets you script Loading → Content → Error and assert each.",
          "**Assert events** — verify the VM's functions are called on interactions (spy/fake capturing calls) rather than testing the VM's internals here.",
          "**Test dispatcher** — inject `StandardTestDispatcher`/`UnconfinedTestDispatcher` so VM coroutines resolve deterministically.",
          "**Scope** — this is a UI test of the screen; test the ViewModel's logic separately as a unit test.",
        ],
      },
      {
        t: "note",
        text: "Test screens with a fake ViewModel exposing a MutableStateFlow you push states into (Loading→Content→Error), assert the UI per state, and verify VM functions are called on interactions. Inject a test dispatcher for deterministic coroutines. Keep it a UI test — unit-test the VM's logic separately.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you embed a Compose UI inside an existing View-based screen (ComposeView)?",
    a: [
      {
        t: "p",
        text: "Add a `ComposeView` to your XML layout (or create one in code) and call `setContent { }` on it to render Compose inside the View hierarchy. This is the primary interop direction for incremental migration — dropping Compose into a Fragment/Activity that's still View-based.",
      },
      {
        t: "code",
        title: "Compose in a View layout",
        code: `<!-- in XML -->
<androidx.compose.ui.platform.ComposeView
    android:id=\"@+id/compose_view\" ... />

// in the Fragment/Activity
binding.composeView.apply {
    setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
    setContent { AppTheme { MyComposable() } }
}`,
      },
      {
        t: "list",
        items: [
          "**`ComposeView.setContent { }`** — hosts Compose inside Views; use it in Fragments/Activities during migration.",
          "**`ViewCompositionStrategy`** — set `DisposeOnViewTreeLifecycleDestroyed` (Fragments) so the composition is disposed with the view lifecycle (prevents leaks).",
          "**Two-way interop** — Compose→View via `AndroidView`; View→Compose via `ComposeView`.",
          "**Theming** — wrap in your `AppTheme`/`MdcTheme` bridge so the embedded Compose matches the app.",
        ],
      },
      {
        t: "note",
        text: "Embed Compose in Views via ComposeView.setContent { } (Fragments/Activities during migration). Set ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed in Fragments to dispose with the view lifecycle (avoid leaks). Compose→View uses AndroidView; wrap embedded Compose in your theme bridge.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you keep a View (like a MapView) in sync with Compose state via AndroidView's update block?",
    a: [
      {
        t: "p",
        text: "`AndroidView` has a `factory` (creates the View once) and an `update` block (runs on every recomposition where read state changed) to push Compose state into the View's imperative API. You create the View in `factory`, remember any handle, and mutate it in `update` when state changes — bridging the declarative and imperative worlds.",
      },
      {
        t: "code",
        title: "AndroidView factory + update",
        code: `AndroidView(
    factory = { ctx -> MyChartView(ctx) },     // created once
    update = { view -> view.setData(chartData) }, // re-runs when chartData changes
    modifier = Modifier.fillMaxWidth(),
)`,
      },
      {
        t: "list",
        items: [
          "**`factory`** — called once to construct the View; do expensive setup here.",
          "**`update`** — called after every recomposition that read changed state; push new values into the View (`setData`, `moveCamera`).",
          "**Lifecycle** — for lifecycle-aware Views (MapView), forward lifecycle events (via a `DisposableEffect`/`LifecycleEventObserver`) or use the AndroidView `onRelease`/`onReset` callbacks; otherwise it leaks or goes blank on backgrounding.",
          "**Don't recreate** — keep the View in `factory`; recreating it each recomposition is expensive and loses state.",
        ],
      },
      {
        t: "note",
        text: "AndroidView(factory, update): factory builds the View once; update runs on each recomposition with changed reads to push state into the View's imperative API (setData/moveCamera). For lifecycle Views (MapView), forward lifecycle events (DisposableEffect + observer) and use onRelease, or it leaks/blanks on backgrounding. Never recreate in factory.",
      },
    ],
  },
  {
    level: "senior",
    q: "How are ViewModels obtained and scoped correctly in Compose (viewModel() and scoping)?",
    a: [
      {
        t: "p",
        text: "`viewModel()` (or `hiltViewModel()`) returns a ViewModel scoped to the nearest `ViewModelStoreOwner` — by default the host Activity/Fragment, or in Navigation Compose the *nav back-stack entry*. This scoping determines the ViewModel's lifetime: a destination-scoped VM is cleared when that destination leaves the back stack, while an Activity-scoped one lives as long as the Activity.",
      },
      {
        t: "list",
        items: [
          "**`viewModel()`/`hiltViewModel()`** — scoped to the current back-stack entry in a NavHost, so each screen gets its own VM cleared on pop.",
          "**Graph-scoped sharing** — to share a VM across a flow, scope it to the *parent nav graph* entry: `hiltViewModel(navController.getBackStackEntry(\"onboarding\"))`.",
          "**Activity-scoped** — pass the Activity as the owner to share across screens (use sparingly; couples lifetimes).",
          "**Don't hoist a VM manually across screens** — rely on the correct `ViewModelStoreOwner` so lifecycle/clearing is handled.",
        ],
      },
      {
        t: "code",
        title: "Sharing a VM across a nav flow",
        code: `@Composable fun Step2(navController: NavController) {
    val parentEntry = remember(navController) { navController.getBackStackEntry(\"onboarding\") }
    val shared: OnboardingVm = hiltViewModel(parentEntry)   // same instance as Step1
}`,
      },
      {
        t: "note",
        text: "viewModel()/hiltViewModel() scope to the nearest ViewModelStoreOwner — in a NavHost that's the back-stack entry, so each screen's VM clears on pop. Share across a flow by scoping to the parent graph entry: hiltViewModel(navController.getBackStackEntry(\"graphRoute\")). Let the store owner manage lifetime; don't hand-hoist VMs across screens.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the trade-offs of type-safe navigation (Navigation Compose 2.8+) vs string routes?",
    a: [
      {
        t: "p",
        text: "Type-safe navigation (using `@Serializable` route classes/objects) replaces stringly-typed routes with Kotlin types: you `navigate(ProductRoute(id = 42))` and receive a typed object, with the compiler checking arguments. It removes a whole class of bugs (typos, missing/mis-typed args, manual encoding) at the cost of some boilerplate and being newer.",
      },
      {
        t: "code",
        title: "Type-safe route",
        code: `@Serializable data class ProductRoute(val id: String)

NavHost(navController, startDestination = HomeRoute) {
    composable<ProductRoute> { entry ->
        val route: ProductRoute = entry.toRoute()   // typed args, no manual parsing
        ProductScreen(route.id)
    }
}
navController.navigate(ProductRoute(id = \"42\"))       // compile-checked args`,
      },
      {
        t: "table",
        headers: ["", "Type-safe routes", "String routes"],
        rows: [
          ["Arg safety", "compile-time checked", "runtime (typos, missing args)"],
          ["Encoding", "automatic", "manual (URL-encode strings)"],
          ["Refactoring", "rename-safe", "fragile string edits"],
          ["Complex args", "serializable types", "must flatten to strings"],
          ["Maturity", "newer (2.8+)", "long-established, lots of samples"],
        ],
      },
      {
        t: "list",
        items: [
          "**Type-safe pros** — compile-time argument checking, automatic encoding, safe refactors, real objects instead of string parsing.",
          "**String-route pros** — mature, ubiquitous examples, trivial for deep-link URI patterns.",
          "**Guidance** — prefer type-safe for new apps on recent Nav versions; string routes remain fine and are still how raw deep-link URIs are matched.",
        ],
      },
      {
        t: "note",
        text: "Type-safe nav (@Serializable route classes, composable<Route>, entry.toRoute()) gives compile-checked args, automatic encoding, and safe refactors vs stringly-typed routes' runtime typos/manual encoding. Cost: newer, some boilerplate. Prefer it for new apps on Nav 2.8+; string routes still fine and used for raw deep-link URI patterns.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you pass complex or large data between destinations safely?",
    a: [
      {
        t: "p",
        text: "Pass only small identifiers (an id) in the route and re-fetch the full object on the destination from your repository/ViewModel — don't serialize large objects into navigation arguments. Navigation args go through a `Bundle` (size-limited) and represent app state that must survive process death; passing an id and reloading is robust and cheap.",
      },
      {
        t: "list",
        items: [
          "**Pass an id, load the rest** — the detail screen's ViewModel fetches by id (from cache/DB/network); survives process death because you can always re-fetch.",
          "**Why not the whole object** — `Bundle` has a size limit (TransactionTooLarge risk), objects may be stale, and everything in the arg must be serializable.",
          "**Small primitives are fine** — ids, flags, short strings as path/query args.",
          "**Shared data** — for a genuinely shared object across a flow, a graph-scoped ViewModel holds it instead of routing it.",
        ],
      },
      {
        t: "code",
        title: "Id in, object loaded",
        code: `navController.navigate(\"detail/\${product.id}\")   // pass the id only
// DetailViewModel(savedStateHandle) reads id, then repo.getProduct(id)`,
      },
      {
        t: "note",
        text: "Pass small ids in the route and re-fetch the full object on the destination (survives process death, no stale/oversized data). Don't serialize large objects into nav args — Bundle size limits (TransactionTooLarge) and staleness. For truly shared objects across a flow, hold them in a graph-scoped ViewModel.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test navigation itself (that tapping navigates to the right destination)?",
    a: [
      {
        t: "p",
        text: "Set up a `TestNavHostController` in the test, render your `NavHost` with it, perform the UI action, and assert the controller's `currentBackStackEntry.destination.route` matches the expected destination. This tests the wiring (clicks → navigation) without launching real screens' full behavior.",
      },
      {
        t: "code",
        title: "Testing navigation wiring",
        code: `lateinit var navController: TestNavHostController
rule.setContent {
    navController = TestNavHostController(LocalContext.current).apply {
        navigatorProvider.addNavigator(ComposeNavigator())
    }
    AppNavHost(navController)
}
rule.onNodeWithText(\"Open product\").performClick()
assertEquals(\"product/{id}\", navController.currentBackStackEntry?.destination?.route)`,
      },
      {
        t: "list",
        items: [
          "**`TestNavHostController`** — a controllable NavController for tests; add the `ComposeNavigator`.",
          "**Assert the route** — check `currentBackStackEntry?.destination?.route` (or arguments) after the action.",
          "**Scope** — this verifies the graph/click wiring; screen content is tested separately.",
          "**Alternative** — assert the destination screen's content appears (`onNodeWithText(...).assertIsDisplayed()`) for a more behavioral test.",
        ],
      },
      {
        t: "note",
        text: "Test navigation with a TestNavHostController (add ComposeNavigator): render the NavHost with it, perform the click, then assert currentBackStackEntry?.destination?.route (and arguments). Verifies click→navigation wiring; test screen content separately, or assert the destination content is displayed for a behavioral check.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you write a screenshot test for a composable?",
    a: [
      {
        t: "p",
        text: "Screenshot (snapshot) tests render a composable and compare its rendered image against a stored 'golden' image, failing if pixels differ — catching unintended visual regressions. Tools include Compose Preview Screenshot Testing (official, from previews), Paparazzi (JVM, no device), and Roborazzi (Robolectric-based).",
      },
      {
        t: "list",
        items: [
          "**Compose Preview Screenshot Testing** — official; turns `@Preview`s into screenshot tests, generates/updates goldens via Gradle tasks.",
          "**Paparazzi** — renders on the JVM (no emulator/device), fast in CI; records and verifies PNGs.",
          "**Roborazzi** — uses Robolectric to capture Compose/View screenshots on the JVM.",
          "**Workflow** — record goldens once, commit them, then CI compares; review diffs on intentional UI changes and re-record.",
          "**Best for** — design-system components and key screens in multiple states (light/dark, large font, empty/error).",
        ],
      },
      {
        t: "note",
        text: "Screenshot tests render a composable and diff it against a committed golden image to catch visual regressions. Options: official Compose Preview Screenshot Testing (from @Preview), Paparazzi (JVM, no device), Roborazzi (Robolectric). Record goldens, commit, CI compares; re-record on intentional changes. Great for design-system components across states.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you show the current destination's title or handle per-screen app bars with Navigation Compose?",
    a: [
      {
        t: "p",
        text: "Observe the current back-stack entry with `currentBackStackEntryAsState()` and derive the app-bar content (title, actions, whether to show a back arrow) from the current route. You typically keep a single `Scaffold` around the `NavHost` and vary its `topBar` based on the current destination.",
      },
      {
        t: "code",
        title: "Route-driven app bar",
        code: `val backStack by navController.currentBackStackEntryAsState()
val route = backStack?.destination?.route
Scaffold(topBar = {
    TopAppBar(
        title = { Text(titleFor(route)) },
        navigationIcon = {
            if (navController.previousBackStackEntry != null)
                IconButton(onClick = { navController.navigateUp() }) { Icon(Icons.Default.ArrowBack, null) }
        },
    )
}) { padding -> NavHost(navController, startDestination = \"home\", Modifier.padding(padding)) { /* … */ } }`,
      },
      {
        t: "list",
        items: [
          "**`currentBackStackEntryAsState()`** — recomposes the app bar when the destination changes.",
          "**Show back arrow conditionally** — only when `previousBackStackEntry != null` (i.e. not the start destination).",
          "**Alternative: per-screen bars** — each screen renders its own `Scaffold`/`TopAppBar` for full control (often cleaner than a giant central `when`).",
          "**Keep it declarative** — derive bar state from the route, don't imperatively mutate a shared bar.",
        ],
      },
      {
        t: "note",
        text: "Drive the app bar from currentBackStackEntryAsState(): derive title/actions from the route and show the back arrow only when previousBackStackEntry != null (navigateUp). Either vary a central Scaffold's topBar by route, or (often cleaner) give each screen its own Scaffold/TopAppBar. Keep bar state derived, not imperatively mutated.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are common Compose/View interop pitfalls and how do you avoid them?",
    a: [
      {
        t: "p",
        text: "Interop between Compose and Views works well but has sharp edges around lifecycle, scrolling, and performance. Knowing the common pitfalls saves hours of debugging leaks and blank/janky content during migration.",
      },
      {
        t: "list",
        items: [
          "**Lifecycle leaks with `ComposeView`** — not setting a `ViewCompositionStrategy` in a Fragment leaks the composition; use `DisposeOnViewTreeLifecycleDestroyed`.",
          "**Lifecycle Views in `AndroidView`** — a `MapView`/`WebView` needs its lifecycle forwarded (observe lifecycle in a `DisposableEffect`) or it goes blank/leaks on backgrounding.",
          "**Nested scrolling conflicts** — a Compose scrollable inside a `RecyclerView` (or vice-versa) can fight for touch; use the nested-scroll interop APIs (`rememberNestedScrollInteropConnection`).",
          "**Performance of many small ComposeViews** — hundreds of tiny `ComposeView`s in a `RecyclerView` are costly; prefer migrating the whole list to `LazyColumn`.",
          "**Theming mismatch** — embedded Compose without your theme bridge looks wrong; wrap in `AppTheme`/use the Material theme adapter.",
          "**Recreating Views in `factory`** — keep the View creation in `factory` (once), mutate in `update`; recreating each recomposition is slow and drops state.",
        ],
      },
      {
        t: "note",
        text: "Interop pitfalls: ComposeView leaks without a ViewCompositionStrategy (use DisposeOnViewTreeLifecycleDestroyed); lifecycle Views (MapView/WebView) in AndroidView need lifecycle forwarding or they blank/leak; nested-scroll conflicts need rememberNestedScrollInteropConnection; many tiny ComposeViews in a RecyclerView are slow (migrate the list); wrap embedded Compose in your theme; never recreate Views in factory.",
      },
    ],
  },
];

export default qa;
