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
];

export default qa;
