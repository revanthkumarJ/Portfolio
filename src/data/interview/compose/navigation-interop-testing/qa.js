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
];

export default qa;
