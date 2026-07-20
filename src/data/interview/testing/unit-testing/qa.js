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
];

export default qa;
