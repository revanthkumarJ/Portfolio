// Android & Compose Testing — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "How do you test a ViewModel?",
    a: [
      {
        t: "p",
        text: "**You inject a fake repository, call the ViewModel's functions, and assert its exposed state — no device needed, because a well-designed ViewModel is a plain framework-free class taking dependencies via constructor.** ViewModels are the ideal unit-test target since they hold the presentation logic and are cheaply testable.",
      },
      {
        t: "code",
        title: "The pattern",
        code: `@get:Rule val mainDispatcherRule = MainDispatcherRule()

@Test fun test() = runTest {
    val vm = FeedViewModel(FakeRepository(articles = listOf(article)))
    vm.uiState.test {
        assertEquals(FeedUiState.Loading, awaitItem())
        vm.refresh()
        assertEquals(FeedUiState.Content(listOf(article)), awaitItem())
        cancelAndIgnoreRemainingEvents()
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Inject a fake**, invoke functions, assert the emitted `UiState` — this verifies behavior: given this data/input, the ViewModel produces this state.",
          "**Needs the `MainDispatcherRule`** (because `viewModelScope` uses `Dispatchers.Main`, absent on the JVM) and, for flows, Turbine + virtual time.",
          "**Assert state, not method calls** — check what the ViewModel *produces*, not which repository methods it called; prefer fakes over mocks so tests survive refactoring.",
        ],
      },
      {
        t: "p",
        text: "This is where most of your behavior coverage should come from — ViewModels concentrate the logic and test cheaply on the JVM, so thorough ViewModel tests give high confidence for low cost. It's the base of the testing pyramid. The main setup beyond constructing the ViewModel is the Main dispatcher rule and, for observing state flows, collecting with Turbine.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you test a Room DAO?",
    a: [
      {
        t: "p",
        text: "**You test DAOs against a *real* in-memory database using instrumented tests, because you can't meaningfully fake SQL — you need real SQLite to verify your queries.** You create an in-memory Room database (fast, discarded after the test), run your DAO operations, and assert the results.",
      },
      {
        t: "code",
        title: "In-memory database test",
        code: `@Before fun setup() {
    db = Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java).build()
    dao = db.userDao()
}
@Test fun insertAndRetrieve() = runTest {
    dao.insert(UserEntity("1", "Rev"))
    assertEquals("Rev", dao.getUser("1")?.name)
}`,
      },
      {
        t: "list",
        items: [
          "**`Room.inMemoryDatabaseBuilder`** creates a real Room/SQLite database that lives only in memory — fast, isolated (fresh per test), and discarded afterward. This exercises your actual queries against real SQLite behavior.",
          "**Instrumented** — these run on a device/emulator because they need the real SQLite engine (though you can run them on the JVM via Robolectric for speed).",
          "**Also test migrations** — use `MigrationTestHelper` with exported schemas to verify migrations preserve data; these are critical because migrations touch real user data.",
        ],
      },
      {
        t: "p",
        text: "The key insight is that database queries are exactly the kind of thing you can't unit-test with a fake — the whole point is verifying that your SQL and Room annotations produce correct results against real SQLite. So DAO tests are a legitimate use of an integration/instrumented test with a real (in-memory) database, testing the query logic itself. Above the DAO, the repository can be tested with a fake DAO (unit test), and the DAO's own correctness is verified with these database tests.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you write a Compose UI test?",
    a: [
      {
        t: "p",
        text: "**You use `createComposeRule()`, set your composable content, then follow find → act → assert against the semantics tree.** The test finds UI nodes, performs actions on them, and asserts on their state.",
      },
      {
        t: "code",
        title: "Find, act, assert",
        code: `@get:Rule val rule = createComposeRule()

@Test fun test() {
    rule.setContent { AppTheme { Counter() } }
    rule.onNodeWithText("Count: 0").assertIsDisplayed()   // find + assert
    rule.onNodeWithText("Increment").performClick()        // act
    rule.onNodeWithText("Count: 1").assertExists()         // assert
}`,
      },
      {
        t: "list",
        items: [
          "**Finders** — `onNodeWithText`, `onNodeWithContentDescription`, `onNodeWithTag` (with `Modifier.testTag`), or `onNode(matcher)` with matchers like `hasText`, `isEnabled`.",
          "**Actions** — `performClick`, `performTextInput`, `performScrollTo`, `performTouchInput { swipeUp() }`.",
          "**Assertions** — `assertIsDisplayed`, `assertExists`, `assertIsEnabled`, `assertTextEquals`.",
          "**Auto-synchronization** — the test automatically waits for recomposition and Compose animations to settle before each assertion, so you rarely need manual waits (a big improvement over Espresso's idling resources).",
        ],
      },
      {
        t: "p",
        text: "Compose tests query the *semantics tree* — the same parallel description of the UI that accessibility services read — which is why writing accessible UI (content descriptions, semantics) also makes it testable. For fast, focused UI tests, test *stateless content composables* by passing fake state and lambdas directly (they settle instantly, no async); reserve full route + ViewModel + navigation tests for the few integration cases that need them.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Robolectric and when do you use it?",
    a: [
      {
        t: "p",
        text: "**Robolectric runs Android framework code on the JVM by providing a *simulated* Android environment — so you can test Android-dependent code without deploying to a real device or emulator, making those tests fast enough to run as 'local' JVM tests.** It fills in fake implementations of Android classes (Context, resources, etc.) so framework-touching code can run in a plain JVM test.",
      },
      {
        t: "list",
        items: [
          "**Use it for** framework-dependent logic that you want to test *fast* without a device — code that uses `Context`, resources, or some Android APIs, and increasingly even Room DAO tests or Compose tests (Robolectric can run them on the JVM for speed).",
          "**The trade-off** — it's a *simulation* of Android, not the real thing, so its behavior may not perfectly match a real device. For genuine device fidelity (real rendering, real system behavior, real hardware), you still need instrumented tests on an actual device/emulator.",
          "**It occupies the middle ground** — faster than instrumented tests (no device), but more realistic than pure JVM tests that have no Android at all.",
        ],
      },
      {
        t: "p",
        text: "So the decision is: pure logic with no Android → plain JVM unit test (fastest); Android-touching logic you want fast → Robolectric (JVM, simulated Android); genuine device behavior needed (real UI rendering, hardware, exact system behavior) → instrumented test on a device. Robolectric lets you pull some framework-dependent tests down from the slow instrumented layer into the fast local layer, which speeds up CI — but you accept that it's an approximation, so critical device-specific behavior should still be verified with real instrumented tests.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a screenshot test and where does it fit in your testing strategy?",
    a: [
      {
        t: "p",
        text: "**A screenshot (or 'snapshot') test renders a composable or screen to an image and compares it against a stored reference image (the 'golden'), failing if they differ. It catches *visual* regressions — a broken layout, wrong spacing, incorrect color, a component that renders differently after a change — which functional tests (that check behavior and semantics) don't catch.**",
      },
      {
        t: "list",
        items: [
          "**What it verifies that other tests don't**: functional UI tests assert *behavior and structure* ('the button exists and is clickable', 'the text says X') but not *appearance* — a layout could be visually broken (overlapping, wrong padding, clipped text) while all semantic assertions pass. Screenshot tests catch exactly these visual regressions by comparing pixels.",
          "**Tools**: **Paparazzi** (Cash App) renders composables to images *on the JVM* — no device needed, so it's fast and CI-friendly, a major advantage. **Roborazzi** does similar via Robolectric. **Compose Preview screenshot testing** (Google's official tooling) generates screenshots from `@Preview` functions. Older approaches used instrumented tests capturing device screenshots (slower).",
          "**How it works**: you write a test that renders the component with specific state, generate the golden image once (reviewed and committed), and thereafter every run compares against it. A visual change fails the test, showing a diff; if the change is intentional, you *re-record* the golden.",
        ],
      },
      {
        t: "list",
        items: [
          "**Where it fits — especially design systems and components**: screenshot tests shine for *design-system components* and reusable UI, where you want to guarantee that a `Button`, `Card`, or `Chip` renders identically across changes and in different states (enabled/disabled, light/dark, different sizes). They're increasingly standard for component libraries. They also catch theme regressions (a color-scheme change breaking contrast) and layout regressions across screen sizes/font scales.",
          "**Trade-offs and cautions**: screenshot tests can be *brittle* — they fail on *any* pixel difference, including intentional cosmetic changes (which then require re-recording goldens) and, if not careful, on font-rendering or anti-aliasing differences across environments (which is why JVM-based rendering like Paparazzi, with a consistent environment, is preferred over device screenshots that vary). They also don't test *behavior* — a screenshot can be pixel-perfect while the button does nothing. So they *complement* functional tests, not replace them.",
          "**In the pyramid**: they're a specialized layer — cheaper than full UI tests (JVM-based ones need no device) but focused purely on visual correctness. Use them for design-system components and key screens' visual states, alongside unit tests for logic and a thin layer of functional UI tests for critical flows.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: screenshot testing fills a specific gap — *visual* correctness — that behavior-based tests structurally cannot cover, and it's become practical and fast thanks to JVM rendering (Paparazzi/Roborazzi) that needs no device. It's most valuable for design systems and reusable components, where visual consistency across changes and states is a real requirement, and for catching theme/layout regressions. The mature view is that it's a *complement*: it verifies 'does it look right', while unit tests verify 'does the logic work' and functional UI tests verify 'does the flow work' — three different questions, and a robust strategy uses screenshot tests specifically for the visual one, being mindful of their brittleness (re-recording goldens on intentional changes, consistent rendering environments). Knowing when to reach for them (component libraries, visual regression) and their limits (don't test behavior, can be pixel-brittle) shows a well-rounded testing perspective.",
      },
    ],
  },
  {
    level: "senior",
    q: "How would you structure the test suite for a feature, and integrate it into CI?",
    a: [
      {
        t: "p",
        text: "**I'd structure it as a pyramid mapped onto the architecture's layers — thorough fast unit tests for logic, targeted integration tests for component wiring, and a thin layer of UI tests for the critical flow — then wire it into CI so fast tests gate every PR and slow tests run appropriately.** Concretely, for a typical feature (say a search screen):**",
      },
      {
        t: "list",
        items: [
          "**Unit tests (the bulk, JVM, fast)**: the *ViewModel* (inject a fake repository, assert `UiState` for each input — loading, results, empty, error; needs MainDispatcherRule + Turbine); *use cases / domain logic* (pure functions, straightforward assertions); *mappers* (DTO→domain→UI, plain input/output tests); *repository* (with a fake DAO and fake API, testing the caching/merge logic). These cover the vast majority of behavior, run in milliseconds, and pinpoint failures.",
          "**Integration tests (some)**: the *DAO* against an in-memory Room database (real SQLite, verifying queries and migrations); the *repository against a real DAO* (verifying the actual DB integration, not just a fake); optionally a *serialization* round-trip test (real JSON → DTO). These catch wiring/integration bugs unit tests with fakes miss.",
          "**UI tests (few, targeted)**: a *Compose UI test* of the screen's stateless content with fake states (fast — verifies the UI renders each state correctly: shows results, shows empty state, shows error), plus *one end-to-end test of the critical flow* (search → see results → tap → detail) through the real ViewModel and navigation for integration confidence. Keep these minimal — they're the slow, brittle layer.",
          "**Screenshot tests (specialized)**: for any reusable components the feature introduces, a Paparazzi test locking their visual appearance across states.",
        ],
      },
      {
        t: "list",
        items: [
          "**CI integration — gate by speed**: run the *fast JVM unit tests on every push/PR* (they finish in seconds/a couple minutes, giving quick feedback — this is the gate that must be green to merge). Run *instrumented/UI tests* less frequently and on emulators or a device farm (Firebase Test Lab, Gradle Managed Devices) — pre-merge for critical suites, or on a schedule/nightly given their cost and flakiness. This mirrors the pyramid: the fast base gates everything, the slow top runs selectively.",
          "**Make CI reliable**: quarantine or fix flaky tests immediately (a flaky suite that fails randomly trains people to ignore CI); run instrumented tests on consistent managed emulators (not developer machines) to reduce environment flakiness; parallelize test execution to keep wall-clock time down.",
          "**Coverage as a signal, not a target**: measure coverage (Kover/JaCoCo) to *find gaps* in critical logic, but don't chase a coverage number — 100% coverage with weak assertions is worthless; meaningful assertions on critical paths are what matter. Perhaps enforce a floor for new code to prevent untested additions, without dogmatically requiring a global percentage.",
          "**Fast local loop**: developers should be able to run the unit tests locally in seconds before pushing (the pyramid's base enables this), catching most issues before CI even runs.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: structuring a feature's tests is about *mapping the pyramid onto the architecture* — each layer (ViewModel, use case, repository, DAO, UI) gets the *cheapest* test that meaningfully verifies it (unit with fakes where possible, integration with real infrastructure where the integration itself is the point like DAOs, UI tests only for critical flows), producing mostly fast tests and few slow ones. CI then *gates on the fast tests* (quick PR feedback, must be green) and *runs the slow ones selectively* (emulators/device farm, pre-merge or scheduled), with discipline around flakiness and coverage-as-signal. The insight that ties it together is that good architecture (DI, framework-free logic, separated layers) is what *makes* this structure possible — testable code lets most tests be fast unit tests, which is what makes the whole strategy sustainable. Being able to lay out the layer-by-layer test plan *and* the CI gating strategy — and connect both back to architecture and the pyramid — is the comprehensive answer.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between local (unit) and instrumented tests?",
    a: [
      {
        t: "p",
        text: "*Local* (unit) tests live in `src/test/`, run on the *JVM* (your machine), are *fast*, and can't use the Android framework (unless with Robolectric). *Instrumented* tests live in `src/androidTest/`, run on a *real device/emulator*, are *slower*, and *can* use the framework (real Room, Espresso, Compose UI tests). Put logic tests (ViewModels, use cases) in local; UI/DB/integration tests in instrumented.",
      },
      {
        t: "list",
        items: [
          "**Local (`src/test/`)** — JVM, fast, no framework (or Robolectric).",
          "**Instrumented (`src/androidTest/`)** — device/emulator, slower, full framework.",
          "**Local** — ViewModels, use cases, logic.",
          "**Instrumented** — UI, Room, Espresso, integration.",
        ],
      },
      {
        t: "note",
        text: "Local (unit) tests: src/test/, run on the JVM, fast, no Android framework (or Robolectric). Instrumented tests: src/androidTest/, run on a device/emulator, slower, full framework (Room/Espresso/Compose UI). Put logic (ViewModels/use cases) in local; UI/DB/integration in instrumented.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you find and interact with composables in a Compose UI test?",
    a: [
      {
        t: "p",
        text: "Compose tests work on the *semantics tree*: *find* nodes with `onNodeWithText`/`onNodeWithContentDescription`/`onNodeWithTag`, *assert* with `assertIsDisplayed`/`assertTextEquals`/`assertIsEnabled`, and *act* with `performClick`/`performTextInput`/`performScrollTo`. `testTag` (via `Modifier.testTag`) gives a stable handle independent of visible text. Tests auto-synchronize (wait for idle) before each action.",
      },
      {
        t: "code",
        title: "Find/act/assert",
        code: `composeTestRule.onNodeWithTag("email").performTextInput("a@b.com")
composeTestRule.onNodeWithText("Submit").performClick()
composeTestRule.onNodeWithText("Welcome").assertIsDisplayed()`,
      },
      {
        t: "list",
        items: [
          "**Finders** — `onNodeWithText`/`ContentDescription`/`Tag`.",
          "**Assertions** — `assertIsDisplayed`/`assertTextEquals`.",
          "**Actions** — `performClick`/`performTextInput`/`performScrollTo`.",
          "**`testTag`** — stable handle; auto-sync before actions.",
        ],
      },
      {
        t: "note",
        text: "Compose tests operate on the semantics tree: find (onNodeWithText/ContentDescription/Tag), assert (assertIsDisplayed/assertTextEquals/assertIsEnabled), act (performClick/performTextInput/performScrollTo). Modifier.testTag gives a stable handle independent of visible text. Tests auto-wait for idle before actions.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is createComposeRule vs createAndroidComposeRule?",
    a: [
      {
        t: "p",
        text: "`createComposeRule()` hosts composables in a test *without* a specific Activity — lighter/faster, for self-contained composable tests. `createAndroidComposeRule<MyActivity>()` launches a real *Activity* — needed when the composable depends on the Activity (Hilt injection, `LocalContext` specifics, or the Activity already sets the content). Call `setContent { }` to render the composable under test.",
      },
      {
        t: "code",
        title: "Compose rules",
        code: `@get:Rule val rule = createComposeRule()
@Test fun greets() {
    rule.setContent { AppTheme { Greeting("Sam") } }
    rule.onNodeWithText("Hello Sam").assertIsDisplayed()
}`,
      },
      {
        t: "list",
        items: [
          "**`createComposeRule()`** — no Activity; light, self-contained.",
          "**`createAndroidComposeRule<A>()`** — launches Activity A.",
          "**`setContent { }`** — render the composable.",
          "**Android variant** — for Hilt/Context/Activity-set content.",
        ],
      },
      {
        t: "note",
        text: "createComposeRule() hosts composables without an Activity (light, self-contained tests); createAndroidComposeRule<A>() launches a real Activity (for Hilt/Context-dependent UI or Activity-set content). Call rule.setContent { AppTheme { … } } to render — wrap in the theme, pass fakes.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does test synchronization work in Compose tests?",
    a: [
      {
        t: "p",
        text: "Compose tests *auto-synchronize* — each assertion/action first waits for the app to be *idle* (no pending recomposition or animation). For async data, use `waitUntil { condition }` (poll with a timeout, no `Thread.sleep`). For animations, control the clock: `mainClock.autoAdvance = false` + `advanceTimeBy` to assert mid-animation. Infinite animations keep the tree never-idle, so you must control the clock or the test hangs.",
      },
      {
        t: "list",
        items: [
          "**Auto-sync** — waits for idle before each action.",
          "**`waitUntil { }`** — poll for async conditions.",
          "**`mainClock`** — control animation timing.",
          "**Infinite animations** — never idle; must control the clock.",
        ],
      },
      {
        t: "note",
        text: "Compose tests auto-synchronize (wait for idle — no pending recomposition/animation — before each action). For async: waitUntil { condition } (poll, no Thread.sleep). For animations: mainClock.autoAdvance = false + advanceTimeBy. Infinite animations never idle — control the clock or the test hangs.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a Compose screen that uses a ViewModel?",
    a: [
      {
        t: "p",
        text: "Inject a *fake ViewModel* (or a real one with fakes) exposing a controllable `StateFlow`, set it as the screen's content, and drive the UI by emitting states — asserting the UI reflects each. Push Loading → Content → Error and assert the rendered UI per state. Verify the ViewModel's functions are called on interactions (via a spy/fake). Keep it a UI test of the screen; unit-test the ViewModel separately.",
      },
      {
        t: "code",
        title: "Screen + fake VM",
        code: `val state = MutableStateFlow<UiState>(UiState.Loading)
rule.setContent { ProductScreen(viewModel = FakeVm(state)) }
rule.onNodeWithTag("spinner").assertIsDisplayed()
state.value = UiState.Content(product)
rule.onNodeWithText(product.name).assertIsDisplayed()`,
      },
      {
        t: "list",
        items: [
          "**Fake VM** — controllable `StateFlow`.",
          "**Emit states** — Loading → Content → Error; assert UI.",
          "**Verify interactions** — VM functions called on clicks.",
          "**Separate** — unit-test the VM logic elsewhere.",
        ],
      },
      {
        t: "note",
        text: "Test a Compose screen with a fake ViewModel exposing a controllable StateFlow: set it as content, emit states (Loading → Content → Error), assert the UI per state, verify VM functions are called on interactions. Keep it a UI test of the screen; unit-test the ViewModel logic separately.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle semantics merging in Compose tests?",
    a: [
      {
        t: "p",
        text: "Compose *merges* a composable's semantics with its descendants when a parent sets `mergeDescendants` (buttons, list items do this) — so a button reads as one node to tests and TalkBack. This means a child's text/testTag can be hidden inside the merged node. Tests use the *merged* tree by default; to assert on a specific child, request the *unmerged* tree with `useUnmergedTree = true`.",
      },
      {
        t: "code",
        title: "Unmerged tree",
        code: `rule.onNode(hasTestTag("badge"), useUnmergedTree = true).assertIsDisplayed()`,
      },
      {
        t: "list",
        items: [
          "**Merging** — parent combines descendant semantics (Button/ListItem).",
          "**Hidden children** — child text/tag subsumed in the merged node.",
          "**`useUnmergedTree = true`** — reach specific children.",
          "**a11y parallel** — merging aids TalkBack too.",
        ],
      },
      {
        t: "note",
        text: "Compose merges a composable's semantics with descendants when a parent sets mergeDescendants (Button/ListItem) — one node for tests/TalkBack, hiding child text/tags. Tests use the merged tree by default; use useUnmergedTree = true to assert on specific children. Semantics that aid testing also aid accessibility.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test navigation in a Compose app?",
    a: [
      {
        t: "p",
        text: "Set up a `TestNavHostController`, render your `NavHost` with it, perform the UI action, and assert `navController.currentBackStackEntry?.destination?.route` matches the expected destination (and arguments). Alternatively, assert the destination screen's content is displayed (more behavioral). This verifies the click→navigation wiring; test screen content separately.",
      },
      {
        t: "code",
        title: "Navigation test",
        code: `lateinit var navController: TestNavHostController
rule.setContent {
    navController = TestNavHostController(LocalContext.current).apply {
        navigatorProvider.addNavigator(ComposeNavigator()) }
    AppNavHost(navController)
}
rule.onNodeWithText("Open").performClick()
assertThat(navController.currentBackStackEntry?.destination?.route).isEqualTo("detail/{id}")`,
      },
      {
        t: "list",
        items: [
          "**`TestNavHostController`** — controllable nav controller.",
          "**Perform action** — then assert the route.",
          "**Or assert content** — destination screen displayed.",
          "**Wiring** — click→navigation; content tested separately.",
        ],
      },
      {
        t: "note",
        text: "Test navigation with a TestNavHostController (add ComposeNavigator): render the NavHost with it, perform the click, assert currentBackStackEntry?.destination?.route (and args) — or assert the destination content is displayed. Verifies click→navigation wiring; test screen content separately.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you provide custom semantics for testing a custom composable?",
    a: [
      {
        t: "p",
        text: "Custom-drawn or gesture-based composables (raw `Canvas`/`pointerInput`) have *no built-in semantics*, so tests (and TalkBack) can't find them. Add `Modifier.semantics { }` with `contentDescription`, `role`, `stateDescription`, `testTag`, or custom actions — making the composable both *testable* and *accessible*. Well-designed semantics serve both purposes.",
      },
      {
        t: "code",
        title: "Custom semantics",
        code: `Box(Modifier.pointerInput(Unit) { detectTapGestures { toggle() } }
    .semantics { role = Role.Switch; stateDescription = if (on) "On" else "Off"; testTag = "wifiToggle" })`,
      },
      {
        t: "list",
        items: [
          "**Custom composables** — no built-in semantics.",
          "**`Modifier.semantics { }`** — contentDescription/role/state/testTag.",
          "**Testable + accessible** — same metadata serves both.",
          "**`clearAndSetSemantics`** — present a subtree as one node.",
        ],
      },
      {
        t: "note",
        text: "Custom-drawn/gesture composables (Canvas/pointerInput) lack built-in semantics, so add Modifier.semantics { } (contentDescription/role/stateDescription/testTag/custom actions) — making them testable AND accessible. clearAndSetSemantics presents a subtree as one node. Good semantics serve both tests and TalkBack.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you test a Compose list (LazyColumn)?",
    a: [
      {
        t: "p",
        text: "Because a `LazyColumn` only composes *visible* items, tests must *scroll* to off-screen items before asserting them: `onNodeWithText(...).performScrollTo()` or `onNode(...).performScrollToIndex(n)` on the list. Assert visible items directly. Give items stable `testTag`s or use their text. This handles the lazy nature — you can't assert an item that isn't composed yet.",
      },
      {
        t: "code",
        title: "Scrolling to an item",
        code: `rule.onNodeWithTag("list").performScrollToIndex(20)
rule.onNodeWithText("Item 20").assertIsDisplayed()`,
      },
      {
        t: "list",
        items: [
          "**Lazy = only visible composed** — scroll to off-screen items.",
          "**`performScrollTo`/`performScrollToIndex`** — bring into view.",
          "**Assert visible items** — directly.",
          "**Stable tags/text** — to find items.",
        ],
      },
      {
        t: "note",
        text: "A LazyColumn only composes visible items, so scroll to off-screen ones before asserting: onNodeWithText(...).performScrollTo() or performScrollToIndex(n) on the list. Assert visible items directly. Use stable testTags/text. You can't assert an item that isn't composed yet.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you use @Preview to create screenshot tests?",
    a: [
      {
        t: "p",
        text: "Compose Preview Screenshot Testing turns your existing `@Preview` composables into screenshot tests — you add the plugin, mark previews for testing, and Gradle tasks *generate* golden images (`updateDebugScreenshotTest`) and *verify* against them (`validateDebugScreenshotTest`). This reuses the previews you already write for design, giving low-effort visual regression coverage across states (light/dark, different data).",
      },
      {
        t: "code",
        title: "Preview screenshot test",
        code: `@Preview(showBackground = true)
@Composable fun ProfileCardPreview() { AppTheme { ProfileCard(sampleUser) } }
// ./gradlew updateDebugScreenshotTest  (record)
// ./gradlew validateDebugScreenshotTest (verify)`,
      },
      {
        t: "list",
        items: [
          "**Reuse `@Preview`s** — as screenshot tests.",
          "**Record** — `updateScreenshotTest` generates goldens.",
          "**Verify** — `validateScreenshotTest` diffs.",
          "**Low effort** — cover states you already preview.",
        ],
      },
      {
        t: "note",
        text: "Compose Preview Screenshot Testing turns @Preview composables into screenshot tests — add the plugin, record goldens (updateScreenshotTest) and verify (validateScreenshotTest) via Gradle. Reuses previews you write for design → low-effort visual regression coverage across states (light/dark, different data).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test animations in Compose?",
    a: [
      {
        t: "p",
        text: "Compose tests use a *controllable animation clock*. By default it auto-advances and `waitForIdle` waits for animations to finish (assert the end state). To assert *mid-animation*, set `mainClock.autoAdvance = false` and step with `mainClock.advanceTimeBy(ms)` to specific points. Infinite animations never let the tree idle, so you *must* control the clock manually or the test hangs.",
      },
      {
        t: "code",
        title: "Animation clock",
        code: `rule.mainClock.autoAdvance = false
rule.onNodeWithText("Expand").performClick()
rule.mainClock.advanceTimeBy(150)   // mid-animation
// assert intermediate state
rule.mainClock.advanceTimeBy(1000)  // finish`,
      },
      {
        t: "list",
        items: [
          "**Controllable clock** — auto-advance or manual.",
          "**End state** — auto-advance + waitForIdle.",
          "**Mid-animation** — `autoAdvance = false` + `advanceTimeBy`.",
          "**Infinite animations** — must control the clock or hang.",
        ],
      },
      {
        t: "note",
        text: "Compose tests use a controllable animation clock: default auto-advances (waitForIdle waits for animations — assert end state); mainClock.autoAdvance = false + advanceTimeBy asserts mid-animation. Infinite animations never idle — you MUST control the clock or the test hangs.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you write Espresso tests for View-based UI?",
    a: [
      {
        t: "p",
        text: "Espresso tests View-based UI: `onView(withId(R.id.button))` finds a view, `.perform(click())` acts, `.check(matches(isDisplayed()))` asserts. It auto-synchronizes with the UI thread (waits for idle). Use `IdlingResource` for async work Espresso can't see. For interacting with the system UI (dialogs, other apps, notifications), use `UIAutomator`. Espresso is for in-app View testing; Compose has its own test API.",
      },
      {
        t: "code",
        title: "Espresso",
        code: `onView(withId(R.id.email)).perform(typeText("a@b.com"))
onView(withText("Submit")).perform(click())
onView(withText("Welcome")).check(matches(isDisplayed()))`,
      },
      {
        t: "list",
        items: [
          "**`onView(matcher)`** — find a view.",
          "**`.perform(action)`** — click/type/scroll.",
          "**`.check(matches(...))`** — assert.",
          "**`IdlingResource`/UIAutomator** — async / system UI.",
        ],
      },
      {
        t: "note",
        text: "Espresso tests Views: onView(matcher).perform(action).check(matches(...)) — auto-syncs with the UI thread; IdlingResource for invisible async work. UIAutomator for system UI (dialogs, other apps, notifications). Espresso for in-app Views; Compose has its own test API (both can coexist).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you test a Room database with migrations?",
    a: [
      {
        t: "p",
        text: "For DAO logic, use an *in-memory* database (`Room.inMemoryDatabaseBuilder`) in instrumented tests — insert data, run queries, assert. For *migrations*, use `MigrationTestHelper` (with exported schemas): create the DB at the old version, insert data, run `runMigrationsAndValidate`, and assert the schema and data survived. Both need instrumented tests (or Robolectric) since Room needs the SQLite runtime.",
      },
      {
        t: "list",
        items: [
          "**In-memory DB** — fast DAO tests (insert/query/assert).",
          "**`MigrationTestHelper`** — test migrations against exported schemas.",
          "**Create old → migrate → validate** — assert data/schema.",
          "**Instrumented/Robolectric** — Room needs SQLite runtime.",
        ],
      },
      {
        t: "note",
        text: "DAO tests: Room.inMemoryDatabaseBuilder (fast, insert/query/assert). Migration tests: MigrationTestHelper (exported schemas) — create at old version, insert data, runMigrationsAndValidate, assert schema+data survived. Both need instrumented tests (or Robolectric) — Room needs the SQLite runtime.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you use Hilt in instrumented tests?",
    a: [
      {
        t: "p",
        text: "Annotate the test `@HiltAndroidTest`, use a `HiltAndroidRule` (to inject), a custom test runner (`HiltTestRunner` extending `AndroidJUnitRunner` with `HiltTestApplication`), and swap dependencies with `@BindValue` (bind a fake) or `@UninstallModules` (remove a production module, provide a test one). This lets instrumented tests run against the real DI graph with test doubles substituted.",
      },
      {
        t: "code",
        title: "Hilt test",
        code: `@HiltAndroidTest
class ScreenTest {
    @get:Rule(order = 0) val hiltRule = HiltAndroidRule(this)
    @get:Rule(order = 1) val composeRule = createAndroidComposeRule<MainActivity>()
    @BindValue val repo: Repository = FakeRepository()
    @Before fun setup() { hiltRule.inject() }
}`,
      },
      {
        t: "list",
        items: [
          "**`@HiltAndroidTest` + `HiltAndroidRule`** — test graph + inject.",
          "**Custom runner** — `HiltTestApplication`.",
          "**`@BindValue`/`@UninstallModules`** — swap dependencies.",
          "**Rule order** — Hilt rule before the Compose/Activity rule.",
        ],
      },
      {
        t: "note",
        text: "Hilt instrumented tests: @HiltAndroidTest, HiltAndroidRule (inject), a custom runner with HiltTestApplication, and @BindValue (bind a fake) / @UninstallModules (replace a production module). Order the Hilt rule before the Compose/Activity rule. Runs against the real DI graph with test doubles.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you run instrumented tests efficiently (Firebase Test Lab, Gradle Managed Devices)?",
    a: [
      {
        t: "p",
        text: "Instrumented tests are slow and need devices — run them efficiently with *Firebase Test Lab* (run on a *matrix* of real/virtual devices in the cloud, catching device-specific issues) or *Gradle Managed Devices* (define emulators in Gradle; the build spins them up, runs tests, tears down — reproducible in CI). Both let you test across API levels/devices without maintaining physical hardware, integrated into CI.",
      },
      {
        t: "list",
        items: [
          "**Firebase Test Lab** — cloud device matrix; real device coverage.",
          "**Gradle Managed Devices** — emulators defined in Gradle; reproducible.",
          "**Across API levels/devices** — without physical hardware.",
          "**CI integration** — automated instrumented runs.",
        ],
      },
      {
        t: "note",
        text: "Run instrumented tests efficiently with Firebase Test Lab (cloud device matrix — real device coverage across API levels) or Gradle Managed Devices (emulators defined in Gradle, auto spun-up/torn-down — reproducible CI). Both test across devices without maintaining physical hardware, integrated into CI.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you test text input and form validation in Compose?",
    a: [
      {
        t: "p",
        text: "Use `performTextInput(\"...\")` on the `TextField` node, then assert the resulting state — an error message appears (`onNodeWithText(\"invalid email\").assertIsDisplayed()`), the submit button enables/disables (`assertIsEnabled`/`assertIsNotEnabled`), or the value updates. Test both valid and invalid inputs and the boundary between them. Use `testTag`s on fields for reliable selection.",
      },
      {
        t: "code",
        title: "Form test",
        code: `rule.onNodeWithTag("email").performTextInput("invalid")
rule.onNodeWithText("Enter a valid email").assertIsDisplayed()
rule.onNodeWithText("Submit").assertIsNotEnabled()`,
      },
      {
        t: "list",
        items: [
          "**`performTextInput`** — type into a field.",
          "**Assert validation** — error messages, enabled state.",
          "**Valid + invalid** — and the boundary.",
          "**`testTag`s** — reliable field selection.",
        ],
      },
      {
        t: "note",
        text: "Test forms with performTextInput on the TextField node, then assert the resulting state: error messages (onNodeWithText.assertIsDisplayed), submit enabled/disabled (assertIsEnabled/assertIsNotEnabled), value updates. Test valid + invalid inputs and the boundary. Use testTags for reliable field selection.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between testing recomposition and testing behavior?",
    a: [
      {
        t: "p",
        text: "*Behavior* testing (the norm) verifies *what the user sees/can do* — the UI shows the right content, responds to clicks — via the semantics tree, robust to implementation. *Recomposition* testing (rare, performance-focused) checks *how often* composables recompose — done via the Layout Inspector's recomposition counts or Compose benchmark tests, not the standard test API. UI tests assert behavior; performance tools measure recomposition.",
      },
      {
        t: "list",
        items: [
          "**Behavior** — what the user sees/does (semantics; robust).",
          "**Recomposition** — how often composables recompose (performance).",
          "**UI tests** — assert behavior.",
          "**Perf tools** — Layout Inspector/benchmarks for recomposition.",
        ],
      },
      {
        t: "note",
        text: "Behavior testing (the norm) verifies what the user sees/does via the semantics tree (robust). Recomposition testing (rare, performance) checks how often composables recompose — via Layout Inspector counts or Compose benchmarks, not the standard test API. UI tests assert behavior; perf tools measure recomposition.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a feature end-to-end within the app?",
    a: [
      {
        t: "p",
        text: "Write an integration/UI test that exercises the *feature's full slice* — launch the screen (with a fake backend via MockWebServer or fake repositories, not the real network), perform the user flow (type, click, navigate), and assert the outcomes at each step. Use Hilt to swap in fakes, Compose/Espresso to drive the UI, and assert both UI state and side effects. This catches wiring bugs unit tests miss, without full E2E fragility.",
      },
      {
        t: "list",
        items: [
          "**Feature slice** — full flow with fakes (MockWebServer/fake repos).",
          "**Drive the UI** — Compose/Espresso through the flow.",
          "**Assert at each step** — UI state + side effects.",
          "**Hilt swaps fakes** — catches wiring bugs, less fragile than E2E.",
        ],
      },
      {
        t: "note",
        text: "Test a feature end-to-end (within the app) with an integration/UI test: launch the screen with fakes (MockWebServer/fake repos, not real network), perform the user flow (type/click/navigate), assert outcomes at each step. Hilt swaps in fakes; Compose/Espresso drives the UI. Catches wiring bugs without full E2E fragility.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you assert a composable does NOT exist or is hidden?",
    a: [
      {
        t: "p",
        text: "Use `assertDoesNotExist()` (the node isn't in the tree at all) or `assertIsNotDisplayed()` (present but not visible). For example, after dismissing a dialog, assert it `assertDoesNotExist()`; a scrolled-off item might exist but `assertIsNotDisplayed()`. Testing *absence* verifies conditional UI (an error message *shouldn't* show when input is valid).",
      },
      {
        t: "code",
        title: "Asserting absence",
        code: `rule.onNodeWithText("Error").assertDoesNotExist()      // not in the tree
rule.onNodeWithTag("offscreen").assertIsNotDisplayed()  // present but hidden`,
      },
      {
        t: "list",
        items: [
          "**`assertDoesNotExist()`** — not in the tree.",
          "**`assertIsNotDisplayed()`** — present but not visible.",
          "**Conditional UI** — error shouldn't show when valid.",
          "**Test absence** — not just presence.",
        ],
      },
      {
        t: "note",
        text: "assertDoesNotExist() (node not in the tree — e.g. dismissed dialog) vs assertIsNotDisplayed() (present but not visible — e.g. scrolled off). Testing absence verifies conditional UI (an error message shouldn't show when input is valid). Test absence, not just presence.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a dialog or bottom sheet in Compose?",
    a: [
      {
        t: "p",
        text: "Trigger the dialog/sheet (perform the action that shows it), then assert its content is displayed (`onNodeWithText(...).assertIsDisplayed()`), interact (click a button), and assert it dismisses (`assertDoesNotExist()`). Note dialogs render in a *separate window/layer*, but the Compose test API sees them through the semantics tree. For custom dismiss behavior (back press, outside tap), test those paths too.",
      },
      {
        t: "code",
        title: "Dialog test",
        code: `rule.onNodeWithText("Delete").performClick()          // shows dialog
rule.onNodeWithText("Are you sure?").assertIsDisplayed()
rule.onNodeWithText("Confirm").performClick()
rule.onNodeWithText("Are you sure?").assertDoesNotExist()  // dismissed`,
      },
      {
        t: "list",
        items: [
          "**Trigger** — the action that shows it.",
          "**Assert displayed** — content visible.",
          "**Interact + dismiss** — click, then `assertDoesNotExist`.",
          "**Separate window** — still visible via semantics.",
        ],
      },
      {
        t: "note",
        text: "Test dialogs/sheets: trigger the show action, assert content displayed (onNodeWithText.assertIsDisplayed), interact (click), assert dismissed (assertDoesNotExist). Dialogs render in a separate window/layer but the Compose test API sees them via the semantics tree. Test dismiss paths (back press, outside tap) too.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is an IdlingResource, and when do you need one?",
    a: [
      {
        t: "p",
        text: "Espresso auto-synchronizes with the *UI thread* but can't see *background* async work (a network call, a custom thread pool) — so a test might assert before the async work finishes. An `IdlingResource` tells Espresso 'I'm busy' until the async work completes, so Espresso waits. Modern coroutine-based apps often don't need it (Compose tests handle idle, and test dispatchers control timing), but it's essential for legacy async.",
      },
      {
        t: "list",
        items: [
          "**Espresso sees the UI thread** — not background async.",
          "**`IdlingResource`** — signals busy until async completes.",
          "**Espresso waits** — for registered resources.",
          "**Modern** — often unneeded (Compose idle, test dispatchers).",
        ],
      },
      {
        t: "note",
        text: "Espresso auto-syncs with the UI thread but not background async work — an IdlingResource signals 'busy' until that async completes, so Espresso waits (avoiding asserting too early). Modern coroutine apps often don't need it (Compose handles idle, test dispatchers control timing); essential for legacy async.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you test that clicking a button triggers the right action?",
    a: [
      {
        t: "p",
        text: "Set the composable's content with a *callback you can observe* (a lambda that records it was called, or a fake ViewModel), perform the click (`onNodeWithText(\"Submit\").performClick()`), and assert the callback fired / the ViewModel function was called / the state changed. This verifies the click wiring — the UI invokes the correct action.",
      },
      {
        t: "code",
        title: "Click test",
        code: `var clicked = false
rule.setContent { MyButton(onClick = { clicked = true }) }
rule.onNodeWithText("Submit").performClick()
assertThat(clicked).isTrue()`,
      },
      {
        t: "list",
        items: [
          "**Observable callback** — record the invocation.",
          "**`performClick()`** — trigger the button.",
          "**Assert** — callback fired / state changed.",
          "**Wiring** — UI invokes the correct action.",
        ],
      },
      {
        t: "note",
        text: "Set content with an observable callback (a lambda recording it fired, or a fake ViewModel), performClick() the button, and assert the callback/ViewModel function was invoked (or state changed). Verifies the click wiring — the UI invokes the correct action.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test different UI states (loading, error, empty, content)?",
    a: [
      {
        t: "p",
        text: "For each state, render the screen with a `UiState` (via a controllable `StateFlow` or by passing the state directly to a stateless composable) and assert the correct UI: Loading → spinner shown; Error → error message + retry; Empty → empty view; Content → the data. Stateless composables (state hoisted) make this trivial — just pass the state and assert. Cover all states, not just the happy path.",
      },
      {
        t: "code",
        title: "State tests",
        code: `@Test fun showsError() {
    rule.setContent { ProductScreen(uiState = UiState.Error("Failed")) }
    rule.onNodeWithText("Failed").assertIsDisplayed()
    rule.onNodeWithText("Retry").assertIsDisplayed()
}`,
      },
      {
        t: "list",
        items: [
          "**Render per state** — pass each `UiState`.",
          "**Assert the right UI** — spinner/error/empty/content.",
          "**Stateless composables** — make this trivial.",
          "**Cover all states** — not just happy path.",
        ],
      },
      {
        t: "note",
        text: "Test each UI state by rendering the screen with that UiState (controllable StateFlow or passing state to a stateless composable) and asserting the correct UI (Loading→spinner, Error→message+retry, Empty→empty view, Content→data). Stateless composables make this trivial. Cover all states, not just the happy path.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test accessibility (semantics) in Compose?",
    a: [
      {
        t: "p",
        text: "Assert the *semantics* your UI exposes for accessibility: content descriptions (`onNodeWithContentDescription(...)`), roles (`assert(hasRole(Role.Button))`), state descriptions, and that interactive elements have labels. The `printToLog()` helper dumps the semantics tree to inspect what a screen reader would see. Because Compose tests *are* semantics-based, testing findability by content description also verifies TalkBack accessibility.",
      },
      {
        t: "list",
        items: [
          "**Content descriptions** — `onNodeWithContentDescription`.",
          "**Roles/state** — `hasRole`, state descriptions.",
          "**`printToLog()`** — dump the semantics tree.",
          "**Tests = semantics** — findability verifies TalkBack too.",
        ],
      },
      {
        t: "note",
        text: "Test accessibility by asserting semantics: content descriptions (onNodeWithContentDescription), roles (hasRole(Role.Button)), state descriptions, and that interactive elements have labels. printToLog() dumps the semantics tree (what a screen reader sees). Since Compose tests are semantics-based, testing findability by content description also verifies TalkBack accessibility.",
      },
    ],
  },
];

export default qa;
