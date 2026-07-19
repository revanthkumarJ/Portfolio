// Navigation, Interop & Testing — Content tab. Teaching-first.

const content = [
  {
    heading: "Navigation Compose — the core model",
    blocks: [
      {
        t: "p",
        text: "**Navigation Compose** manages moving between screens (composables) as a **back stack** owned by a `NavController`. You declare a `NavHost` containing `composable(route) { }` destinations; the NavController swaps which destination is shown and maintains the stack for back handling. Each destination is a composable, not an Activity or Fragment — the whole app can be a single Activity with many composable destinations.",
      },
      {
        t: "code",
        title: "The classic string-route setup",
        code: `val navController = rememberNavController()

NavHost(navController = navController, startDestination = "feed") {
    composable("feed") {
        FeedScreen(onOpenDetail = { id -> navController.navigate("detail/$id") })
    }
    composable(
        route = "detail/{itemId}",
        arguments = listOf(navArgument("itemId") { type = NavType.StringType }),
    ) { backStackEntry ->
        val itemId = backStackEntry.arguments?.getString("itemId")
        DetailScreen(itemId)
    }
}`,
      },
      {
        t: "list",
        items: [
          "`rememberNavController()` creates and remembers the controller; `navigate(route)` pushes; `popBackStack()` / `navigateUp()` pops.",
          "**Arguments** travel in the route string (`detail/{itemId}`) and are read from `backStackEntry.arguments` — but importantly, they also land in the destination's `SavedStateHandle`, so a ViewModel scoped to that destination gets them automatically.",
          "**Navigation options**: `navigate(route) { popUpTo(\"feed\") { inclusive = true }; launchSingleTop = true }` — control the stack (clear up to a destination, avoid duplicate top entries) — the Compose equivalent of Activity launch modes.",
          "**Deep links**: `composable(route, deepLinks = listOf(navDeepLink { uriPattern = \"app://detail/{itemId}\" }))` maps external URIs to destinations.",
        ],
      },
    ],
  },
  {
    heading: "Type-safe navigation (the modern approach)",
    blocks: [
      {
        t: "p",
        text: "String routes are stringly-typed — typos compile fine and crash at runtime, and argument types must be manually parsed. Recent Navigation Compose supports **type-safe routes** using `@Serializable` objects/classes as destinations, so arguments are real typed fields and the compiler catches mistakes:",
      },
      {
        t: "code",
        title: "Type-safe destinations",
        code: `@Serializable object Feed
@Serializable data class Detail(val itemId: String)

NavHost(navController, startDestination = Feed) {
    composable<Feed> {
        FeedScreen(onOpenDetail = { id -> navController.navigate(Detail(itemId = id)) })
    }
    composable<Detail> { backStackEntry ->
        val detail: Detail = backStackEntry.toRoute()   // typed, no manual parsing
        DetailScreen(detail.itemId)
    }
}`,
      },
      {
        t: "list",
        items: [
          "Arguments are constructor parameters of the route class — type-checked, no `navArgument` boilerplate, no string interpolation to get wrong.",
          "`backStackEntry.toRoute<Detail>()` reconstructs the typed object; the ViewModel can also `savedStateHandle.toRoute<Detail>()`.",
          "This is the recommended style for new code; string routes remain valid and common in existing apps — know both.",
        ],
      },
    ],
  },
  {
    heading: "ViewModel scoping in navigation, and passing data between screens",
    blocks: [
      {
        t: "list",
        items: [
          "**Each destination is a `ViewModelStoreOwner`**: `hiltViewModel()` inside a `composable(route) { }` scopes the ViewModel to *that back-stack entry* — created when you navigate in, cleared when the entry is popped. So a detail screen's ViewModel lives exactly as long as the detail screen.",
          "**Nav-graph-scoped ViewModels** for multi-step flows: scope a ViewModel to a *nested graph* (a checkout flow's several screens) so they share one ViewModel that's cleared when the whole flow is popped — `hiltViewModel(navController.getBackStackEntry(\"checkout_graph\"))`.",
          "**Returning a result to the previous screen** (e.g. a picker): write into the *previous* entry's SavedStateHandle — `navController.previousBackStackEntry?.savedStateHandle?.set(\"picked\", value)` then pop; the previous screen observes it. This replaces `startActivityForResult`/`setFragmentResult`.",
          "**Don't pass large objects as arguments**: routes/arguments go through saved state and URIs — pass *ids*, and load the data from a repository on the destination. Passing whole parcelable objects risks the same size limits as any saved state.",
        ],
      },
    ],
  },
  {
    heading: "Interop: Compose in Views, and Views in Compose",
    blocks: [
      {
        t: "p",
        text: "Real apps migrate incrementally, so Compose interoperates with the View system **both directions** — a frequent interview topic because you'll rarely start greenfield.",
      },
      {
        t: "code",
        title: "Both directions",
        code: `// VIEWS INSIDE COMPOSE: AndroidView hosts a classic View (MapView, WebView,
// AdView, a custom legacy View) inside a composition
AndroidView(
    factory = { context -> MapView(context).apply { onCreate(null) } },
    update = { mapView -> /* push new state INTO the view imperatively */ },
    modifier = Modifier.fillMaxSize(),
)

// COMPOSE INSIDE VIEWS: a ComposeView is a normal View you put in XML or
// add programmatically, then call setContent on
class LegacyFragment : Fragment() {
    override fun onCreateView(/* ... */): View =
        ComposeView(requireContext()).apply {
            setContent { MyComposableScreen() }
        }
}`,
      },
      {
        t: "list",
        items: [
          "**`AndroidView`** embeds a View in Compose: `factory` creates it once, `update` runs on recomposition to push new state into it imperatively (the View is mutated the old way). Use for things Compose lacks or that are expensive to reimplement — `MapView`, `WebView`, ad SDKs, camera preview, complex custom Views.",
          "**`ComposeView`** embeds Compose in the View world: it's a regular View you place in XML (`<androidx.compose.ui.platform.ComposeView>`) or add in code, then call `setContent { }`. This is how you add Compose to an existing Fragment/Activity screen by screen.",
          "**Lifecycle bridging gotchas**: a `MapView`/`WebView` inside `AndroidView` needs its own lifecycle callbacks (`onResume`/`onPause`/`onDestroy`) forwarded — a `DisposableEffect` + `LifecycleEventObserver` is the standard pattern, and forgetting it leaks or freezes the embedded view.",
          "**`AndroidViewBinding`** embeds a whole XML layout (via ViewBinding) inside Compose — handy for reusing an existing complex layout during migration.",
        ],
      },
    ],
  },
  {
    heading: "Semantics — how Compose UI is understood by accessibility and tests",
    blocks: [
      {
        t: "p",
        text: "Compose has no Views for accessibility services or test frameworks to inspect. Instead, every composable contributes to a parallel **semantics tree** — a description of *what the UI means* (this is a button, its text is 'Submit', it's disabled). Accessibility (TalkBack) and UI tests both read this tree, so getting semantics right serves both at once.",
      },
      {
        t: "list",
        items: [
          "Material components add semantics automatically (`Button` is announced as a button, `Text` exposes its text). You augment with `Modifier.semantics { }`, `contentDescription` (for images/icons), `Modifier.testTag(\"...\")` (a test handle), and `mergeDescendants` (treat a composable + children as one node for a11y).",
          "`clickable` adds click semantics + focus + the a11y action; a raw `pointerInput` gesture does **not** — so custom gestures need explicit semantics or they're invisible to TalkBack and hard to test. This is a real accessibility bug pattern to name.",
          "Because tests query the same tree, writing accessible UI *is* writing testable UI — a nice point to make.",
        ],
      },
    ],
  },
  {
    heading: "Testing Compose UI",
    blocks: [
      {
        t: "p",
        text: "Compose UI tests use `createComposeRule()` (or `createAndroidComposeRule<Activity>()`), which sets content and drives it. You **find** nodes in the semantics tree, **act** on them, and **assert** — no Espresso view matchers, no ViewHolders:",
      },
      {
        t: "code",
        title: "A Compose UI test",
        code: `@get:Rule val composeRule = createComposeRule()

@Test
fun clickingIncrement_updatesCount() {
    composeRule.setContent { AppTheme { Counter() } }

    composeRule.onNodeWithText("Count: 0").assertIsDisplayed()   // FIND + ASSERT
    composeRule.onNodeWithText("Increment").performClick()        // ACT
    composeRule.onNodeWithText("Count: 1").assertExists()         // ASSERT
}`,
      },
      {
        t: "list",
        items: [
          "**Finders**: `onNodeWithText`, `onNodeWithContentDescription`, `onNodeWithTag` (paired with `Modifier.testTag`), `onNode(matcher)` with rich matchers (`hasText`, `isEnabled`, `hasClickAction`).",
          "**Actions**: `performClick`, `performTextInput`, `performScrollTo`, `performTouchInput { swipeUp() }`.",
          "**Assertions**: `assertIsDisplayed`, `assertExists`, `assertIsEnabled`, `assertTextEquals`, `assert(hasText(...))`.",
          "**Synchronization**: the test **auto-waits for idle** — it synchronizes with recomposition and Compose-driven animations, so you rarely need manual waits. For indefinite animations or external async, control the clock (`composeRule.mainClock.autoAdvance = false`, `advanceTimeBy(...)`) or `waitUntil { }`.",
          "**Prefer testing stateless content composables** (pass fake state + lambdas) for fast, focused UI tests; use the full route + ViewModel only for integration tests. `createComposeRule` runs as an instrumented test on device/emulator (or Robolectric for JVM-hosted Compose tests).",
          "**Screenshot testing** (Paparazzi / Roborazzi / Compose Preview screenshot tests) catches visual regressions without a device — increasingly standard for design-system components.",
        ],
      },
    ],
  },
];

export default content;
