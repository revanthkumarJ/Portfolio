// Android & Compose Testing — Content tab. Teaching-first.

const content = [
  {
    heading: "Testing ViewModels — the sweet spot",
    blocks: [
      {
        t: "p",
        text: "ViewModels are the ideal unit-test target: they hold the presentation logic, and (if well-designed) they're framework-free plain classes taking dependencies via constructor. You test a ViewModel by injecting fakes, invoking its functions, and asserting its exposed state — no device needed. This is where most of your *behavior* coverage should come from.",
      },
      {
        t: "code",
        title: "A ViewModel test",
        code: `@get:Rule val mainDispatcherRule = MainDispatcherRule()

@Test fun refresh_showsLoadingThenContent() = runTest {
    val repo = FakeArticleRepository(articles = listOf(article))
    val viewModel = FeedViewModel(repo)

    viewModel.uiState.test {
        assertEquals(FeedUiState.Loading, awaitItem())
        viewModel.refresh()
        assertEquals(FeedUiState.Content(listOf(article)), awaitItem())
        cancelAndIgnoreRemainingEvents()
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Inject a fake repository**, invoke ViewModel functions, assert the emitted `UiState` — this verifies the ViewModel's *behavior* (given this data/input, it produces this state).",
          "**Needs the `MainDispatcherRule`** (for `viewModelScope`) and, for flows, Turbine + virtual time (covered in the coroutine-testing topic).",
          "**Assert state, not implementation** — check what state the ViewModel *produces*, not which repository methods it called (prefer fakes over mocks here). This makes tests robust to refactoring.",
          "Because ViewModels concentrate logic and are cheaply testable, thorough ViewModel tests give high confidence for little cost — the heart of the pyramid's base.",
        ],
      },
    ],
  },
  {
    heading: "Testing Room (DAOs)",
    blocks: [
      {
        t: "p",
        text: "Room DAO tests verify your queries and database logic against a *real* SQLite database — so they're **instrumented tests** (run on a device/emulator) using an *in-memory* database (fast, discarded after the test). You can't meaningfully unit-test SQL against a fake; you test it against real SQLite.",
      },
      {
        t: "code",
        title: "A DAO test with an in-memory database",
        code: `@RunWith(AndroidJUnit4::class)
class UserDaoTest {
    private lateinit var db: AppDatabase
    private lateinit var dao: UserDao

    @Before fun setup() {
        db = Room.inMemoryDatabaseBuilder(   // in-memory: fast, no persistence
            ApplicationProvider.getApplicationContext(), AppDatabase::class.java
        ).build()
        dao = db.userDao()
    }
    @After fun teardown() = db.close()

    @Test fun insertAndRetrieve() = runTest {
        dao.insert(UserEntity("1", "Revanth"))
        assertEquals("Revanth", dao.getUser("1")?.name)
    }
}`,
      },
      {
        t: "list",
        items: [
          "**In-memory database** (`Room.inMemoryDatabaseBuilder`) — a real Room/SQLite instance that lives only in memory, so tests are fast and isolated (fresh DB per test, discarded after). This tests your actual queries against real SQLite behavior.",
          "**Instrumented** — DAO tests run on a device/emulator because they need the real SQLite engine. (You *can* run them on the JVM via Robolectric, which some teams do for speed.)",
          "**Also test migrations** — use `MigrationTestHelper` with exported schemas to verify migrations preserve data (covered in the Room topic). Migration tests are critical since they touch real user data.",
        ],
      },
    ],
  },
  {
    heading: "Compose UI testing",
    blocks: [
      {
        t: "p",
        text: "Compose UI tests use `createComposeRule()` (or `createAndroidComposeRule<Activity>()`), which sets your composable content and lets you interact with it. The pattern is **find → act → assert** against the *semantics tree* (Compose's parallel description of the UI that both accessibility and tests read).",
      },
      {
        t: "code",
        title: "A Compose UI test",
        code: `@get:Rule val composeRule = createComposeRule()

@Test fun clickingIncrement_updatesCount() {
    composeRule.setContent { AppTheme { Counter() } }

    composeRule.onNodeWithText("Count: 0").assertIsDisplayed()   // find + assert
    composeRule.onNodeWithText("Increment").performClick()        // act
    composeRule.onNodeWithText("Count: 1").assertExists()         // assert
}`,
      },
      {
        t: "list",
        items: [
          "**Finders** — `onNodeWithText`, `onNodeWithContentDescription`, `onNodeWithTag` (paired with `Modifier.testTag(\"...\")`), `onNode(matcher)` with rich matchers (`hasText`, `isEnabled`, `hasClickAction`).",
          "**Actions** — `performClick`, `performTextInput`, `performScrollTo`, `performTouchInput { swipeUp() }`.",
          "**Assertions** — `assertIsDisplayed`, `assertExists`, `assertIsEnabled`, `assertTextEquals`.",
          "**Auto-synchronization** — the test automatically waits for recomposition and Compose-driven animations to settle before each assertion, so you rarely need manual waits (a big convenience over Espresso's idling resources). For indefinite animations, control the clock (`mainClock.autoAdvance = false`).",
          "**Test stateless content composables** with fake state + lambdas for fast, focused UI tests; reserve full route+ViewModel tests for integration.",
        ],
      },
    ],
  },
  {
    heading: "Espresso and the View system",
    blocks: [
      {
        t: "p",
        text: "**Espresso** is the classic UI testing framework for the *View* system (XML-based UIs), still relevant for legacy screens and hybrid apps. It follows the same find-act-assert idea with a different API: `onView(matcher)` to find a View, `perform(action)` to interact, `check(assertion)` to verify.",
      },
      {
        t: "code",
        title: "An Espresso test",
        code: `@Test fun login_showsError_onEmptyPassword() {
    onView(withId(R.id.username)).perform(typeText("user"))
    onView(withId(R.id.loginButton)).perform(click())
    onView(withText("Password required")).check(matches(isDisplayed()))
}`,
      },
      {
        t: "list",
        items: [
          "**`onView(withId(...))` / `withText(...)`** find a View; **`perform(click()/typeText(...))`** interact; **`check(matches(...))`** assert. `onData` handles AdapterView/list items.",
          "**Idling resources** — Espresso synchronizes with the main thread automatically, but for background async work you register `IdlingResource`s so it waits (the clunky part Compose testing improved on).",
          "For a Compose app you use Compose testing; for a View app, Espresso; for a hybrid, both (Espresso can drive into `ComposeView` content via interop).",
        ],
      },
    ],
  },
  {
    heading: "Robolectric, screenshot tests, and CI",
    blocks: [
      {
        t: "list",
        items: [
          "**Robolectric** — runs Android framework code on the *JVM* by providing a simulated Android environment. This lets you test Android-dependent code (some `Context` usage, resources, even Compose/DAO tests) *without a device*, so they run fast in CI as 'local' tests. The trade-off: it's a *simulation*, so it may not perfectly match real device behavior — for genuine device fidelity you still need instrumented tests. Robolectric is great for the middle ground (framework-touching logic that doesn't need a real device).",
          "**Screenshot testing** (Paparazzi by Cash App, Roborazzi, or Compose Preview screenshot tests) — renders composables/screens to images and compares against a stored 'golden' reference, catching *visual* regressions (a broken layout, wrong color) without a device. Increasingly standard for design-system components. Paparazzi runs on the JVM (no device), which is a big advantage.",
          "**CI (Continuous Integration)** — run tests automatically on every push/PR (GitHub Actions, Bitrise, etc.). Fast JVM unit tests run on every PR; slower instrumented/UI tests run on emulators (or a device farm like Firebase Test Lab) — often on a schedule or pre-merge, given their cost. The pyramid shape matters here: a fast unit suite gives quick PR feedback; the slow UI layer runs less often.",
          "**Test coverage** — tools (JaCoCo, Kover) measure what percentage of code tests exercise. Useful as a *signal* (uncovered critical logic is a gap) but not a goal in itself — 100% coverage of trivial code with no meaningful assertions is worthless; coverage of critical logic with good assertions is what matters.",
        ],
      },
      {
        t: "note",
        text: "Android testing: ViewModels — inject fakes, assert state (the pyramid's base, needs MainDispatcherRule). Room DAOs — instrumented tests with an in-memory database (real SQLite); test migrations too. Compose UI — createComposeRule, find (onNodeWithText/Tag) → act (performClick) → assert (assertIsDisplayed) against the semantics tree, auto-synced. Espresso — the View-system equivalent (onView/perform/check, idling resources). Robolectric runs Android on the JVM (fast, simulated); screenshot tests (Paparazzi) catch visual regressions; CI runs unit tests per-PR, UI tests less often.",
      },
    ],
  },
];

export default content;
