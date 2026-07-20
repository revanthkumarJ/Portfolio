// Unit Testing (JUnit, Fakes vs Mocks) — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is the structure of a good unit test?",
    a: [
      {
        t: "p",
        text: "**A good unit test follows the Arrange–Act–Assert (AAA), also called Given–When–Then, structure: set up the inputs and dependencies, perform the single action under test, then assert the expected outcome.** This keeps tests readable and focused.",
      },
      {
        t: "code",
        title: "AAA in practice",
        code: `@Test fun premiumUser_gets20PercentOff() {
    // Arrange
    val calculator = DiscountCalculator()
    val user = User(isPremium = true)
    // Act
    val price = calculator.finalPrice(100.0, user)
    // Assert
    assertEquals(80.0, price, 0.001)
}`,
      },
      {
        t: "list",
        items: [
          "**One behavior per test** — each test verifies a single thing, with a descriptive name that states what it checks (`premiumUser_gets20PercentOff`). If a test needs multiple unrelated assertions, it's probably testing too much.",
          "**FIRST properties** — Fast (milliseconds), Isolated (independent of other tests and external state), Repeatable (same result every run), Self-validating (clearly pass/fail), Timely (written close to the code).",
          "**Clear assertions** — use `assertEquals`, `assertTrue`, etc., or fluent libraries like Truth/AssertK for readable failure messages.",
        ],
      },
      {
        t: "p",
        text: "The AAA structure matters because it makes tests *documentation* — a reader immediately sees the setup, the action, and the expected result. Tests that mix these (asserting mid-setup, multiple actions) are hard to follow and often brittle. Keeping each test small, focused, and clearly structured is what makes a test suite maintainable and trustworthy.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a test double? Name the main kinds.",
    a: [
      {
        t: "p",
        text: "**A test double is a stand-in object that replaces a real dependency in a test, so you can test a class in isolation with controlled behavior.** 'Test double' is the general term (like a stunt double); there are several specific kinds:",
      },
      {
        t: "list",
        items: [
          "**Dummy** — a placeholder object passed to satisfy a parameter but never actually used.",
          "**Stub** — returns hardcoded, canned responses to method calls (no logic, just 'return this').",
          "**Fake** — a real, working but simplified implementation, like an in-memory repository backed by a `MutableList` instead of a real database. It genuinely *behaves* like the real thing.",
          "**Mock** — a double you program with expected returns and then *verify* how it was called (was this method invoked, with what arguments, how many times).",
          "**Spy** — wraps a real object, recording interactions while delegating to the real implementation (a partial mock).",
        ],
      },
      {
        t: "p",
        text: "In practice, the two you use most and that matter most in interviews are **fakes** and **mocks**. The reason for doubles at all is *isolation* — to unit-test a ViewModel, you don't want a real network call or database, so you replace the repository with a fake (in-memory) or a mock (programmed). Which you choose (fake vs mock) is a meaningful decision that affects how robust your tests are — fakes test outcomes and survive refactors, mocks test interactions and can be brittle.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is MockK and why use it over Mockito on Android?",
    a: [
      {
        t: "p",
        text: "**MockK is a Kotlin-first mocking library — it's designed for Kotlin and handles Kotlin's features natively, whereas Mockito is the older Java library that struggles with some Kotlin constructs.** You use MockK to create mocks, program their return values, and verify how they were called.",
      },
      {
        t: "list",
        items: [
          "**Handles Kotlin's final-by-default classes** — Kotlin classes are `final` unless marked `open`, and Mockito historically couldn't mock final classes without an extra plugin. MockK mocks them out of the box.",
          "**Coroutine support** — `coEvery { }` and `coVerify { }` for stubbing and verifying `suspend` functions, which is essential since modern Android code is full of them.",
          "**Kotlin idioms** — it understands objects, extension functions, and provides a clean Kotlin DSL (`every { } returns`, `just Runs` for Unit functions, `slot`/`capture` for arguments).",
        ],
      },
      {
        t: "code",
        title: "MockK basics",
        code: `val repo = mockk<UserRepository>()
coEvery { repo.getUser("42") } returns testUser   // stub a suspend fn
// ... run code ...
coVerify(exactly = 1) { repo.getUser("42") }       // verify it was called`,
      },
      {
        t: "p",
        text: "So on a Kotlin Android project, MockK is the natural choice — it speaks Kotlin fluently (suspend functions, final classes, objects), which Mockito needs workarounds for. (Mockito is still usable via the mockito-kotlin wrapper, and some teams use it for legacy reasons.) That said, a common piece of guidance is to *prefer fakes over mocks* for your own types and use MockK's mocking mainly for verifying interactions/side effects or for dependencies that are awkward to fake — so you'd reach for MockK selectively rather than mocking everything.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between a fake and a mock, and which should you prefer?",
    a: [
      {
        t: "p",
        text: "**A fake is a real, working (but simplified) implementation of a dependency — you use it and assert on the *outcome/state* it produces. A mock is a programmed object where you specify return values and *verify the interactions* (which methods were called, how). The fundamental difference is *state-based testing* (fakes) vs *interaction-based testing* (mocks) — and for most cases, fakes are preferred.**",
      },
      {
        t: "code",
        title: "The distinction in code",
        code: `// FAKE — real in-memory implementation; assert the OUTCOME
class FakeRepo : Repo { private val m = mutableMapOf<String,User>()
    fun seed(u: User){ m[u.id]=u }; override suspend fun get(id:String)=m[id]!! }
val vm = ViewModel(FakeRepo().apply{ seed(user) })
vm.load("1"); assertEquals(user, vm.state.value.user)   // assert state

// MOCK — programmed; verify the CALL
val repo = mockk<Repo>(); coEvery { repo.get("1") } returns user
val vm2 = ViewModel(repo)
vm2.load("1"); coVerify { repo.get("1") }               // assert interaction`,
      },
      {
        t: "list",
        items: [
          "**Fakes test behavior/state and are robust**: you assert what the code *produced* (the ViewModel's state contains the user), not *how* it got there. This means the test survives refactoring — if you change the ViewModel's internal calls but the outcome is the same, the fake test still passes. Fakes also read like real usage and one fake serves many tests.",
          "**Mocks test interactions and are brittle**: you assert *specific method calls*, so the test is coupled to the implementation's exact call pattern. Refactor the implementation (even without changing behavior) and mock verifications break — a *false failure* that wastes time. Worse, a mock-heavy test can 'pass' while verifying almost nothing real, because you programmed both the input (stub) and check the output against your own setup — you can end up testing your mock configuration rather than the code.",
          "**When mocks are the right tool**: when the *interaction itself is the behavior you care about* and there's no observable state to assert — verifying that an analytics event was logged, that a callback was invoked, that a fire-and-forget side effect happened. Also for replacing an awkward-to-fake external dependency where writing a full fake isn't worth it. In these cases, verifying the call *is* the meaningful assertion.",
          "**The modern guidance (Google's testing docs)**: prefer *fakes for your own types* (repositories, data sources — write a simple in-memory fake, ideally provided by the owner of the interface), and use *mocks sparingly* for interaction verification and side effects. Avoid mocking types you don't own (their behavior can change, and your mock encodes assumptions about them).",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the fake-vs-mock choice is really about *what you're asserting* — outcomes or interactions. Outcome-based tests (fakes) are more valuable because they verify *what the code does* in a way that's decoupled from *how*, so they catch real behavior changes and survive refactors — exactly the properties that make a test suite trustworthy and maintainable. Interaction-based tests (mocks) are appropriate specifically when the interaction is the observable behavior (side effects with no state). Over-reliance on mocks is a common testing anti-pattern that produces brittle suites coupled to implementation details, so the mature default is 'fakes for state, mocks for verifying side effects', with a bias toward fakes.",
      },
    ],
  },
  {
    level: "senior",
    q: "What makes tests brittle or flaky, and how do you avoid it?",
    a: [
      {
        t: "p",
        text: "**A *brittle* test breaks when you change implementation details even though behavior is correct (a false failure that generates maintenance churn); a *flaky* test passes or fails non-deterministically across runs without code changes (eroding trust in the suite). Both undermine the value of testing, and both have identifiable causes and fixes.**",
      },
      {
        t: "list",
        items: [
          "**Brittleness cause — testing implementation, not behavior**: over-mocking (verifying exact method calls) couples tests to *how* code works, so any refactor breaks them. Fix: prefer state/outcome assertions (fakes) over interaction verification; test through the public API, not internals; don't assert on private details.",
          "**Brittleness cause — UI tests coupled to presentation**: asserting on exact text/positions breaks on cosmetic changes. Fix: use stable test tags/semantics, assert on behavior not layout, keep UI tests few and focused on critical flows.",
          "**Flakiness cause — real time and async**: tests that use real delays, real threads, or wall-clock time race non-deterministically. Fix: use *virtual time* (`runTest` with `TestDispatcher`) so coroutine delays are controlled, and *inject dispatchers* so tests control threading. Never use real `Thread.sleep`/`delay` in tests to 'wait' for async work.",
          "**Flakiness cause — shared/external state**: tests depending on shared mutable state, execution order, real network, real files, or a real database that persists between tests. Fix: make each test *isolated* — fresh state per test (`@Before` setup), fakes instead of real external resources, no dependence on other tests' side effects. Reset singletons/global state.",
          "**Flakiness cause — UI timing**: animations, unsynchronized async in UI tests. Fix: rely on the test framework's idle synchronization (Compose auto-syncs, Espresso idling resources), control the clock for animations, disable animations on test devices, use `waitUntil` for genuine async.",
          "**Flakiness cause — hidden nondeterminism**: relying on `Set`/`Map` iteration order, random values, current date/time. Fix: inject a `Clock`/random source you control; assert on sorted/normalized data; avoid order-dependent assertions on unordered collections.",
        ],
      },
      {
        t: "list",
        items: [
          "**The cost of ignoring it**: a brittle suite generates constant false-failure maintenance that isn't catching real bugs; a flaky suite trains the team to *ignore failures* ('just re-run it'), at which point the tests protect nothing — a flaky test is arguably worse than no test, because it costs time and provides false confidence. So flakiness must be treated as a real bug to fix (or the test quarantined), not tolerated.",
          "**The unifying principle**: test *behavior through public interfaces* with *controlled, isolated, deterministic* inputs — inject time and dispatchers (control async), inject dependencies (use fakes, avoid real external resources), keep each test independent with fresh state, and assert on outcomes rather than implementation details or presentation. Do that, and tests are neither brittle nor flaky.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: brittleness and flakiness are the two ways a test suite loses its value — one by breaking on non-changes (maintenance burden, no real signal), the other by failing randomly (destroys trust). The root causes are *testing implementation instead of behavior* (brittleness) and *uncontrolled nondeterminism — real time, threads, shared state* (flakiness). The fixes are the same disciplines that define good testing: assert outcomes not internals, inject and control time/dispatchers/dependencies, and isolate every test. Being able to diagnose *why* a test is brittle or flaky and name the specific fix (virtual time, injected dispatchers, fakes, isolation, behavior-based assertions) — and recognizing that a flaky test is a bug to fix, not tolerate — is exactly the testing maturity these questions probe.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is JUnit, and what's the difference between JUnit 4 and 5?",
    a: [
      {
        t: "p",
        text: "JUnit is the standard Java/Kotlin unit-testing framework — you annotate methods `@Test` and run assertions. *JUnit 4* uses `@Test`, `@Before`, `@Rule`, and `@RunWith`. *JUnit 5* (Jupiter) modernizes it: `@BeforeEach`/`@AfterEach`, `@Nested` classes, `@ParameterizedTest`, extensions (`@ExtendWith`) instead of rules, and better Kotlin support. Android historically used JUnit 4 (much tooling assumes it), though JUnit 5 is usable.",
      },
      {
        t: "list",
        items: [
          "**JUnit 4** — `@Test`/`@Before`/`@Rule`/`@RunWith`.",
          "**JUnit 5** — `@BeforeEach`, `@Nested`, `@ParameterizedTest`, extensions.",
          "**Android** — JUnit 4 is the default; JUnit 5 needs extra setup.",
          "**Assertions** — `assertEquals` etc., or a library (Truth/AssertJ).",
        ],
      },
      {
        t: "note",
        text: "JUnit is the standard unit-test framework (@Test + assertions). JUnit 4: @Test/@Before/@Rule/@RunWith. JUnit 5 (Jupiter): @BeforeEach, @Nested, @ParameterizedTest, extensions (@ExtendWith) over rules, better Kotlin support. Android defaults to JUnit 4 (tooling assumes it); JUnit 5 is usable with setup.",
      },
    ],
  },
  {
    level: "junior",
    q: "What do @Before, @After, and setup/teardown do?",
    a: [
      {
        t: "p",
        text: "`@Before` runs *before each test* — set up the subject and fresh test doubles so tests are independent. `@After` runs *after each test* — clean up (close resources, reset globals like `Dispatchers.resetMain`). `@BeforeClass`/`@AfterClass` run *once* for the class (expensive shared setup). Fresh per-test setup prevents tests from affecting each other (a key to reliability).",
      },
      {
        t: "code",
        title: "Setup/teardown",
        code: `@Before fun setup() { repo = FakeRepo(); vm = MyViewModel(repo) }
@After fun tearDown() { Dispatchers.resetMain() }`,
      },
      {
        t: "list",
        items: [
          "**`@Before`** — per-test setup (fresh subject/doubles).",
          "**`@After`** — per-test cleanup (resources/globals).",
          "**`@BeforeClass`/`@AfterClass`** — once per class (expensive shared).",
          "**Independence** — fresh setup prevents cross-test contamination.",
        ],
      },
      {
        t: "note",
        text: "@Before runs before each test (fresh subject/doubles → independent tests); @After after each (cleanup — close resources, Dispatchers.resetMain). @BeforeClass/@AfterClass run once per class (expensive shared setup). Fresh per-test setup prevents tests affecting each other.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a JUnit @Rule / TestRule?",
    a: [
      {
        t: "p",
        text: "A `@Rule` is a reusable piece of test setup/teardown logic that wraps test execution — like `InstantTaskExecutorRule` (runs LiveData synchronously), `MainDispatcherRule` (swaps `Dispatchers.Main`), or `TemporaryFolder`. It factors out common cross-test boilerplate into a declarative `@get:Rule` field. JUnit 5 replaces rules with *extensions* (`@ExtendWith`).",
      },
      {
        t: "code",
        title: "@Rule",
        code: `@get:Rule val instantTaskExecutorRule = InstantTaskExecutorRule()   // LiveData sync
@get:Rule val mainDispatcherRule = MainDispatcherRule()             // swap Main`,
      },
      {
        t: "list",
        items: [
          "**`@Rule`** — reusable setup/teardown wrapping tests.",
          "**Examples** — InstantTaskExecutorRule, MainDispatcherRule, TemporaryFolder.",
          "**`@get:Rule`** — in Kotlin (property with a getter).",
          "**JUnit 5** — extensions (`@ExtendWith`) replace rules.",
        ],
      },
      {
        t: "note",
        text: "A @Rule wraps test execution with reusable setup/teardown (InstantTaskExecutorRule for sync LiveData, MainDispatcherRule to swap Dispatchers.Main, TemporaryFolder). In Kotlin, @get:Rule. It factors out cross-test boilerplate. JUnit 5 replaces rules with extensions (@ExtendWith).",
      },
    ],
  },
  {
    level: "junior",
    q: "What assertion library should you use, and why?",
    a: [
      {
        t: "p",
        text: "Beyond JUnit's `assertEquals`, use a *fluent* assertion library like *Truth* (Google) or *AssertJ* — they read naturally (`assertThat(result).isEqualTo(expected)`, `assertThat(list).containsExactly(...)`) and give *better failure messages* than bare JUnit asserts. Kotlin also has `kotlin.test` assertions. Fluent assertions make tests more readable and debuggable.",
      },
      {
        t: "code",
        title: "Fluent assertions",
        code: `assertThat(user.name).isEqualTo("Sam")            // Truth
assertThat(items).containsExactly(a, b, c).inOrder()
assertThat(result).isInstanceOf(Error::class.java)`,
      },
      {
        t: "list",
        items: [
          "**Truth/AssertJ** — fluent, readable assertions.",
          "**Better messages** — clearer failures than bare JUnit.",
          "**Rich matchers** — collections, types, null, ordering.",
          "**`kotlin.test`** — Kotlin assertions (assertEquals/assertFailsWith).",
        ],
      },
      {
        t: "note",
        text: "Use a fluent assertion library — Truth (Google) or AssertJ — for readable assertions (assertThat(x).isEqualTo(...), containsExactly) with better failure messages than bare JUnit asserts. kotlin.test provides Kotlin assertions. Fluent assertions improve readability and debuggability.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is parameterized testing?",
    a: [
      {
        t: "p",
        text: "Parameterized tests run the *same test logic* with *multiple input sets* — instead of copy-pasting a test for each case, you provide a list of inputs/expected outputs and the framework runs the test once per case. JUnit 4 uses `@RunWith(Parameterized::class)`; JUnit 5 uses `@ParameterizedTest` with `@ValueSource`/`@CsvSource`/`@MethodSource`. It's great for testing many edge cases of a pure function concisely.",
      },
      {
        t: "code",
        title: "Parameterized (JUnit 5)",
        code: `@ParameterizedTest
@CsvSource("0, false", "17, false", "18, true", "100, true")
fun isAdult(age: Int, expected: Boolean) {
    assertThat(isAdult(age)).isEqualTo(expected)
}`,
      },
      {
        t: "list",
        items: [
          "**Same logic, many inputs** — one test per case.",
          "**JUnit 4** — `@RunWith(Parameterized)`.",
          "**JUnit 5** — `@ParameterizedTest` + sources.",
          "**Edge cases** — concise coverage of pure functions.",
        ],
      },
      {
        t: "note",
        text: "Parameterized tests run the same logic with multiple input sets (one run per case) instead of duplicating tests: JUnit 4 @RunWith(Parameterized), JUnit 5 @ParameterizedTest + @ValueSource/@CsvSource/@MethodSource. Great for covering many edge cases of a pure function concisely.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you test that a function throws an exception?",
    a: [
      {
        t: "p",
        text: "Use `assertFailsWith<T> { }` (kotlin.test) or `assertThrows<T> { }` (JUnit 5) — it runs the block and asserts it throws the expected exception type, returning the exception so you can also assert its message. This verifies error paths (invalid input → `IllegalArgumentException`). Avoid try/catch-with-fail boilerplate.",
      },
      {
        t: "code",
        title: "assertFailsWith",
        code: `val ex = assertFailsWith<IllegalArgumentException> { validate("") }
assertThat(ex.message).contains("must not be blank")`,
      },
      {
        t: "list",
        items: [
          "**`assertFailsWith<T> { }`** — kotlin.test; asserts the throw.",
          "**`assertThrows<T> { }`** — JUnit 5.",
          "**Returns the exception** — assert its message/details.",
          "**Error paths** — verify invalid input throws.",
        ],
      },
      {
        t: "note",
        text: "Use assertFailsWith<T> { } (kotlin.test) or assertThrows<T> { } (JUnit 5) — runs the block, asserts it throws the expected type, and returns the exception (assert its message). Cleaner than try/catch-with-fail. For verifying error paths (invalid input → IllegalArgumentException).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a stub, and how does it differ from a mock?",
    a: [
      {
        t: "p",
        text: "A *stub* provides *canned answers* to calls (returns preset data) — it's about *state* (feeding inputs). A *mock* additionally *records and verifies interactions* — it's about *behavior* (was this method called with these args?). Both are test doubles: a stub just returns values you configured; a mock lets you assert *how* the subject used its dependency. MockK can act as either.",
      },
      {
        t: "list",
        items: [
          "**Stub** — canned return values; state-based.",
          "**Mock** — records + verifies calls; behavior-based.",
          "**Stub** — 'when asked, return X'.",
          "**Mock** — 'assert it was called with Y'.",
        ],
      },
      {
        t: "note",
        text: "A stub provides canned answers (returns preset data — state-based, 'when asked, return X'). A mock additionally records and verifies interactions (behavior-based, 'assert it was called with Y'). Both are test doubles; MockK can act as either (every for stubbing, verify for interactions).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a spy, and when do you use one?",
    a: [
      {
        t: "p",
        text: "A *spy* wraps a *real object* — calls go to the real implementation *unless* you stub specific methods, and you can *verify* interactions. Use it to test a real object while overriding one troublesome method, or to verify calls on a mostly-real collaborator. Spies are a code smell if overused (they mix real and fake behavior); prefer fakes/mocks for clarity.",
      },
      {
        t: "code",
        title: "Spy (MockK)",
        code: `val service = spyk(RealService())
every { service.expensiveCall() } returns cached   // override one method
service.doWork()
verify { service.log(any()) }                       // verify a real call happened`,
      },
      {
        t: "list",
        items: [
          "**Spy** — wraps a real object; real calls unless stubbed.",
          "**Override selectively** — stub specific methods.",
          "**Verify** — check interactions on a real object.",
          "**Use sparingly** — mixing real/fake is a smell.",
        ],
      },
      {
        t: "note",
        text: "A spy wraps a real object — calls hit the real implementation unless you stub specific methods, and you can verify interactions (spyk in MockK). Use to test a real object while overriding one method. Overusing spies (mixing real and fake) is a smell — prefer fakes/mocks for clarity.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you verify interactions with verify() in MockK?",
    a: [
      {
        t: "p",
        text: "`verify { mock.method(args) }` asserts the method was called; `verify(exactly = n)`, `verify(atLeast = ...)`, `verifyOrder`, and `confirmVerified` add precision. For suspend functions use `coVerify`. But *behavior verification* (checking calls) can make tests brittle — prefer verifying *outcomes* (state) over *interactions* unless the interaction itself is the contract (e.g. analytics was logged).",
      },
      {
        t: "code",
        title: "verify",
        code: `verify(exactly = 1) { analytics.log("purchase") }
coVerify { repo.save(user) }                       // suspend
verify(exactly = 0) { api.call() }                  // asserts NOT called`,
      },
      {
        t: "list",
        items: [
          "**`verify { }`** — assert a call happened.",
          "**`exactly`/`atLeast`/`verifyOrder`** — precision.",
          "**`coVerify`** — for suspend functions.",
          "**Prefer state** — behavior verification is brittle; verify outcomes.",
        ],
      },
      {
        t: "note",
        text: "verify { mock.method(args) } asserts a call (with exactly/atLeast/verifyOrder/confirmVerified; coVerify for suspend). But behavior verification is brittle — prefer verifying outcomes (state) over interactions, unless the interaction IS the contract (analytics logged, a specific API called).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a relaxed mock, and when is it useful?",
    a: [
      {
        t: "p",
        text: "By default MockK requires you to *stub every method* the subject calls (or it throws for unstubbed calls). A *relaxed* mock (`mockk(relaxed = true)`/`relaxedUnitFun`) returns *sensible defaults* (0, empty, null, or a nested mock) for unstubbed methods — so you only stub what matters. Useful when a dependency has many methods but you only care about a few; the trade-off is it can hide unexpected calls.",
      },
      {
        t: "code",
        title: "Relaxed mock",
        code: `val logger = mockk<Logger>(relaxed = true)   // unstubbed methods return defaults
val repo = mockk<Repo>(relaxUnitFun = true)  // Unit-returning methods relaxed`,
      },
      {
        t: "list",
        items: [
          "**Default MockK** — throws on unstubbed calls.",
          "**Relaxed** — returns sensible defaults for unstubbed methods.",
          "**Only stub what matters** — for many-method dependencies.",
          "**Trade-off** — can hide unexpected calls.",
        ],
      },
      {
        t: "note",
        text: "By default MockK throws on unstubbed calls; a relaxed mock (mockk(relaxed = true)/relaxUnitFun) returns sensible defaults (0/empty/null/nested mock) for unstubbed methods, so you stub only what matters — useful for many-method dependencies. Trade-off: it can hide unexpected calls.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you mock suspend functions and coroutines with MockK?",
    a: [
      {
        t: "p",
        text: "Use the `co`-prefixed functions: `coEvery { mock.suspendFn() } returns value` to stub, and `coVerify { mock.suspendFn() }` to verify. These handle the suspend context. Run the test in `runTest` so the coroutines execute. MockK's coroutine support makes testing suspend-heavy code (repositories, use cases) straightforward.",
      },
      {
        t: "code",
        title: "coEvery / coVerify",
        code: `coEvery { repo.getUser("1") } returns fakeUser
val vm = MyViewModel(repo)
vm.load(); advanceUntilIdle()
coVerify(exactly = 1) { repo.getUser("1") }`,
      },
      {
        t: "list",
        items: [
          "**`coEvery { }`** — stub a suspend function.",
          "**`coVerify { }`** — verify a suspend call.",
          "**`runTest`** — execute the coroutines.",
          "**Suspend-heavy code** — repositories, use cases.",
        ],
      },
      {
        t: "note",
        text: "MockK coroutine support: coEvery { mock.suspendFn() } returns value (stub), coVerify { } (verify) — handling the suspend context. Run tests in runTest so coroutines execute. Makes testing suspend-heavy code (repositories/use cases) straightforward. Prefer fakes for repositories where practical.",
      },
    ],
  },
  {
    level: "senior",
    q: "Should you test private methods, and how?",
    a: [
      {
        t: "p",
        text: "Generally *don't test private methods directly* — test them *through the public API* that uses them (they're implementation details; testing them couples tests to internals and makes refactoring hard). If a private method has complex logic worth testing in isolation, that's a signal to *extract it* into its own class/function with a public interface. Reflection to test privates is a smell.",
      },
      {
        t: "list",
        items: [
          "**Test via the public API** — privates are implementation details.",
          "**Complex private logic** — extract it to a testable class/function.",
          "**Don't use reflection** — to test privates (a smell).",
          "**Refactor-friendly** — testing behavior, not internals.",
        ],
      },
      {
        t: "note",
        text: "Don't test private methods directly — test them through the public API that uses them (they're implementation details; testing internals couples tests and blocks refactoring). If private logic is complex enough to test in isolation, extract it into its own testable class/function. Reflection to test privates is a smell.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is code coverage, and is 100% the goal?",
    a: [
      {
        t: "p",
        text: "Code coverage measures what percentage of code your tests *execute* (line/branch). It's a useful *indicator* of untested areas, but *not a goal in itself* — 100% coverage doesn't mean the tests are *good* (you can execute code without asserting meaningful behavior), and chasing it wastes effort on trivial code. Aim for *high coverage of important logic* (business rules, edge cases) and use coverage to find *gaps*, not as a target.",
      },
      {
        t: "list",
        items: [
          "**Coverage** — % of code executed by tests (line/branch).",
          "**Not a goal** — 100% ≠ good tests (execution isn't assertion).",
          "**Find gaps** — use it to spot untested important logic.",
          "**Focus** — business rules/edge cases over trivial code.",
        ],
      },
      {
        t: "note",
        text: "Code coverage = % of code executed by tests — a useful indicator of gaps, not a goal. 100% doesn't mean good tests (executing ≠ asserting behavior), and chasing it wastes effort on trivial code. Aim for high coverage of important logic (business rules/edge cases); use coverage to find gaps, not as a target.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Test-Driven Development (TDD)?",
    a: [
      {
        t: "p",
        text: "TDD is writing the *test first*, then the code to make it pass, in a *red-green-refactor* cycle: (1) *Red* — write a failing test for the next small behavior; (2) *Green* — write the minimal code to pass it; (3) *Refactor* — clean up with the test as a safety net. It drives simple designs, ensures testability, and gives fast feedback. You don't have to do strict TDD, but writing tests early improves design.",
      },
      {
        t: "list",
        items: [
          "**Red** — write a failing test first.",
          "**Green** — minimal code to pass.",
          "**Refactor** — clean up safely.",
          "**Benefits** — testable design, fast feedback, simple code.",
        ],
      },
      {
        t: "note",
        text: "TDD: write the test first, then code to pass it — red (failing test for the next behavior), green (minimal passing code), refactor (clean up with the test as a net). It drives testable, simple designs and fast feedback. Strict TDD is optional, but writing tests early improves design.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you make code testable?",
    a: [
      {
        t: "p",
        text: "Testable code: use *dependency injection* (inject collaborators so you can pass fakes), favor *pure functions* (deterministic, no side effects — trivial to test), depend on *interfaces/abstractions* (swap implementations), inject sources of non-determinism (a `Clock`, dispatchers, random) so you control them, and keep functions *small and single-responsibility*. Hard-to-test code (static singletons, hidden dependencies, side effects) signals a design problem.",
      },
      {
        t: "list",
        items: [
          "**Dependency injection** — pass fakes for collaborators.",
          "**Pure functions** — deterministic, no side effects.",
          "**Interfaces** — swap implementations.",
          "**Inject non-determinism** — Clock/dispatchers/random.",
        ],
      },
      {
        t: "note",
        text: "Testable code: dependency injection (pass fakes), pure functions (deterministic, no side effects), depend on interfaces (swap impls), inject non-determinism (Clock/dispatchers/random), small single-responsibility functions. Hard-to-test code (static singletons, hidden deps, side effects) signals a design problem — testability drives good design.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between state and behavior verification?",
    a: [
      {
        t: "p",
        text: "*State verification* checks the *result*/*state* after the action (assert the returned value or the object's new state) — robust, refactor-friendly. *Behavior verification* checks *how* the subject interacted with dependencies (verify a method was called) — necessary when the interaction *is* the contract (analytics logged, an email sent), but brittle when overused (couples tests to implementation). Prefer state verification; use behavior verification only for genuine interaction contracts.",
      },
      {
        t: "list",
        items: [
          "**State** — assert the result/state; robust.",
          "**Behavior** — verify interactions; for interaction contracts.",
          "**Prefer state** — refactor-friendly.",
          "**Behavior when** — the call itself is the observable outcome.",
        ],
      },
      {
        t: "note",
        text: "State verification asserts the result/state after the action (robust, refactor-friendly); behavior verification checks how the subject interacted with dependencies (verify calls — brittle when overused). Prefer state; use behavior verification only when the interaction IS the contract (analytics logged, email sent).",
      },
    ],
  },
  {
    level: "junior",
    q: "What makes a good test name?",
    a: [
      {
        t: "p",
        text: "A good test name describes *what's being tested and the expected outcome* under a condition — readable as a sentence. Common patterns: `methodName_condition_expectedResult` (`login_withInvalidPassword_returnsError`) or backtick Kotlin names (`` `login with invalid password returns error` ``). The name should tell you what broke *without reading the test body*, so failures are self-documenting.",
      },
      {
        t: "code",
        title: "Descriptive names",
        code: `@Test fun \`load returns Error when the network fails\`() { }
@Test fun isAdult_ageUnder18_returnsFalse() { }`,
      },
      {
        t: "list",
        items: [
          "**Describe outcome** — what + expected result + condition.",
          "**Patterns** — `method_condition_result` or backtick sentences.",
          "**Self-documenting** — the name explains the failure.",
          "**Readable** — like a spec.",
        ],
      },
      {
        t: "note",
        text: "A good test name describes what's tested + the expected outcome under a condition, readable as a sentence: method_condition_result (login_withInvalidPassword_returnsError) or Kotlin backtick names. The name should explain what broke without reading the body — self-documenting failures.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test time-dependent code?",
    a: [
      {
        t: "p",
        text: "Don't call `System.currentTimeMillis()`/`Instant.now()` directly — *inject a `Clock`* (or a time provider) so tests can supply a *fixed* time. Then you can test 'is this token expired?' or 'is it after 5 PM?' deterministically. For coroutine delays, `runTest`'s virtual clock handles them. Injecting the source of time is the key to testing time-dependent logic.",
      },
      {
        t: "code",
        title: "Inject a Clock",
        code: `class Token(val expiresAt: Instant, private val clock: Clock) {
    fun isExpired() = clock.instant().isAfter(expiresAt)
}
// Test: Token(expiresAt, Clock.fixed(now, UTC))`,
      },
      {
        t: "list",
        items: [
          "**Inject a `Clock`** — supply a fixed time in tests.",
          "**Deterministic** — no real-time flakiness.",
          "**`runTest` virtual clock** — for coroutine delays.",
          "**Don't call `now()` directly** — inject the time source.",
        ],
      },
      {
        t: "note",
        text: "Inject a Clock (or time provider) instead of calling System.currentTimeMillis()/Instant.now() directly — tests supply a fixed time (Clock.fixed) for deterministic time-dependent logic (expiry, after-5-PM). runTest's virtual clock handles coroutine delays. Injecting the time source is the key.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you make a good fake for a repository?",
    a: [
      {
        t: "p",
        text: "A fake repository is a *working in-memory implementation* of the repository interface — it stores data in a map/list, returns it, and lets you preload data or simulate errors (a flag to throw). It behaves like the real thing (correct semantics) but without network/DB, making it *reusable* across tests and more *realistic* than a mock. Expose helpers to seed data and control error behavior.",
      },
      {
        t: "code",
        title: "Fake repository",
        code: `class FakeUserRepository : UserRepository {
    private val users = mutableMapOf<String, User>()
    var shouldThrow = false
    fun seed(user: User) { users[user.id] = user }
    override suspend fun getUser(id: String): User =
        if (shouldThrow) throw IOException() else users[id] ?: error("not found")
}`,
      },
      {
        t: "list",
        items: [
          "**In-memory impl** — of the repository interface.",
          "**Seed helpers** — preload data.",
          "**Simulate errors** — a flag to throw.",
          "**Reusable + realistic** — behaves like the real thing.",
        ],
      },
      {
        t: "note",
        text: "A fake repository is a working in-memory implementation of the interface (data in a map/list, seed helpers, an error flag to simulate failures) — realistic (correct semantics) and reusable across tests, without network/DB. More robust than a mock; the preferred double for repositories.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a unit test and an integration test?",
    a: [
      {
        t: "p",
        text: "A *unit test* verifies a *single unit* (a class/function) in *isolation*, with dependencies faked/mocked — fast, deterministic, run on the JVM. An *integration test* verifies that *multiple components work together* (a repository with a real DB, or a ViewModel + repository) — slower, more realistic, catches wiring/interaction bugs units miss. You need both: many unit tests + fewer integration tests (the pyramid).",
      },
      {
        t: "list",
        items: [
          "**Unit** — one unit in isolation; fast, faked deps.",
          "**Integration** — components together; slower, realistic.",
          "**Integration catches** — wiring/interaction bugs.",
          "**Both** — many unit + fewer integration (pyramid).",
        ],
      },
      {
        t: "note",
        text: "A unit test verifies one class/function in isolation (faked deps — fast, deterministic, JVM). An integration test verifies multiple components together (repository + real DB, ViewModel + repository — slower, realistic, catches wiring bugs). Need both: many unit + fewer integration tests (the pyramid).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you keep unit tests fast and deterministic?",
    a: [
      {
        t: "p",
        text: "Keep them *pure JVM* (no Android framework — use Robolectric only when needed), avoid *real I/O* (fake network/DB), avoid *real time* (inject Clock, use `runTest`'s virtual clock — never `Thread.sleep`), inject *test dispatchers*, avoid *shared mutable state* between tests (fresh setup), and don't depend on *ordering* or external systems. Fast, deterministic tests run in CI reliably and give quick feedback.",
      },
      {
        t: "list",
        items: [
          "**Pure JVM** — no framework/real I/O.",
          "**No real time** — inject Clock; `runTest` virtual clock; no `Thread.sleep`.",
          "**Test dispatchers** — deterministic coroutines.",
          "**Isolated** — fresh setup, no shared state/ordering.",
        ],
      },
      {
        t: "note",
        text: "Fast/deterministic unit tests: pure JVM (no framework — Robolectric only when needed), no real I/O (fake network/DB), no real time (inject Clock, runTest virtual clock, never Thread.sleep), test dispatchers, isolated (fresh setup, no shared state/ordering). Reliable in CI with quick feedback.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is mutation testing?",
    a: [
      {
        t: "p",
        text: "Mutation testing measures test *quality* (not just coverage): a tool (e.g. PIT) introduces small *mutations* (change `>` to `>=`, negate a condition, replace a return) and checks whether your tests *catch* them (a test fails). Surviving mutations reveal weak tests that execute code but don't *assert* meaningfully. It's a stronger quality signal than coverage but slower to run.",
      },
      {
        t: "list",
        items: [
          "**Introduces mutations** — small code changes.",
          "**Tests should catch them** — surviving mutations = weak tests.",
          "**Stronger than coverage** — measures assertion quality.",
          "**Slower** — run periodically, not every build.",
        ],
      },
      {
        t: "note",
        text: "Mutation testing (PIT) introduces small code mutations (> → >=, negate conditions) and checks if tests catch them (fail). Surviving mutations reveal weak tests that execute code without meaningfully asserting. A stronger quality signal than coverage, but slower — run periodically.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you organize test files and structure a test class?",
    a: [
      {
        t: "p",
        text: "Mirror the source structure — `src/test/.../MyViewModelTest.kt` next to the package of `MyViewModel`. Within a test class: a `@Before` setup creating the subject with fakes, then grouped tests (by method or scenario), each following Arrange-Act-Assert. Use `@Nested` classes (JUnit 5) or naming prefixes to group related cases. Keep one behavior per test and descriptive names.",
      },
      {
        t: "list",
        items: [
          "**Mirror source** — `XTest` in the same package under `src/test`.",
          "**`@Before` setup** — subject + fakes.",
          "**Group tests** — by method/scenario (`@Nested` or naming).",
          "**One behavior per test** — AAA + descriptive names.",
        ],
      },
      {
        t: "note",
        text: "Organize tests mirroring the source (XTest in the same package under src/test/androidTest). In a class: @Before setup (subject + fakes), grouped tests (by method/scenario via @Nested or naming), each Arrange-Act-Assert, one behavior per test with descriptive names.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the Arrange-Act-Assert (Given-When-Then) structure?",
    a: [
      {
        t: "p",
        text: "A clear test has three phases: *Arrange* (set up the subject and inputs/test doubles), *Act* (invoke the behavior under test — ideally one action), and *Assert* (verify the outcome). *Given-When-Then* is the same idea in BDD terms. Separating these visually (blank lines/comments) makes tests readable and keeps each test focused on one behavior.",
      },
      {
        t: "code",
        title: "AAA",
        code: `@Test fun \`load sets Content on success\`() = runTest {
    val vm = MyViewModel(FakeRepo(data))   // Arrange
    vm.load(); advanceUntilIdle()          // Act
    assertThat(vm.state.value).isEqualTo(UiState.Content(data))  // Assert
}`,
      },
      {
        t: "list",
        items: [
          "**Arrange** — set up subject, inputs, doubles.",
          "**Act** — invoke the behavior (one action).",
          "**Assert** — verify the outcome.",
          "**Given-When-Then** — the BDD phrasing of the same.",
        ],
      },
      {
        t: "note",
        text: "Arrange-Act-Assert (Given-When-Then): Arrange (set up subject/inputs/doubles), Act (invoke one behavior), Assert (verify the outcome). Separate the phases visually and keep one behavior per test — makes tests readable and focused.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you avoid over-mocking, and why does it matter?",
    a: [
      {
        t: "p",
        text: "*Over-mocking* — mocking everything and verifying every interaction — produces *brittle* tests that break on any refactor and test the *implementation* rather than *behavior*. Avoid it by: preferring *fakes* over mocks (realistic, reusable), mocking only at true *boundaries* (network/DB), verifying *outcomes* (state) over interactions, and not mocking value objects/data classes (just use them). Tests should survive refactoring that preserves behavior.",
      },
      {
        t: "list",
        items: [
          "**Over-mocking** — brittle tests coupled to implementation.",
          "**Prefer fakes** — realistic, reusable.",
          "**Mock boundaries only** — network/DB, not everything.",
          "**Verify outcomes** — not every interaction; don't mock value objects.",
        ],
      },
      {
        t: "note",
        text: "Over-mocking (mocking everything, verifying every call) makes brittle tests coupled to implementation, breaking on refactors. Avoid it: prefer fakes (realistic/reusable), mock only true boundaries (network/DB), verify outcomes (state) over interactions, don't mock value objects. Tests should survive behavior-preserving refactors.",
      },
    ],
  },
];

export default qa;
