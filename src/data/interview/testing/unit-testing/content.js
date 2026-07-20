// Unit Testing (JUnit, Fakes vs Mocks) — Content tab. Teaching-first.

const content = [
  {
    heading: "Anatomy of a unit test",
    blocks: [
      {
        t: "p",
        text: "A **unit test** verifies one small piece of code (a function, a class) in isolation. On Android/Kotlin you write them with **JUnit** (the test framework — usually JUnit4 or JUnit5), and a good test follows the **Arrange–Act–Assert** (AAA), or Given–When–Then, structure: set up the inputs and dependencies, perform the action, and assert the expected outcome.",
      },
      {
        t: "code",
        title: "A well-structured unit test",
        code: `class DiscountCalculatorTest {
    @Test
    fun premiumUser_gets20PercentOff() {
        // Arrange (Given) — set up inputs/dependencies
        val calculator = DiscountCalculator()
        val user = User(isPremium = true)

        // Act (When) — perform the action under test
        val price = calculator.finalPrice(basePrice = 100.0, user = user)

        // Assert (Then) — verify the expected outcome
        assertEquals(80.0, price, 0.001)
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`@Test`** marks a test method; JUnit runs each independently. **`@Before`/`@After`** run setup/teardown before/after each test (JUnit5: `@BeforeEach`/`@AfterEach`).",
          "**AAA structure** keeps tests readable: clear input setup, one action, focused assertions. Each test should verify *one* behavior — a descriptive name (`premiumUser_gets20PercentOff`) states what it checks.",
          "**Assertions** — `assertEquals`, `assertTrue`, `assertNull`, `assertThrows`, etc. Libraries like **Truth** (Google) or **AssertK** give fluent, readable assertions (`assertThat(price).isEqualTo(80.0)`) with better failure messages.",
          "**Tests should be FIRST**: Fast, Isolated (independent of each other and external state), Repeatable (same result every run), Self-validating (pass/fail, no manual checking), Timely (written close to the code).",
        ],
      },
    ],
  },
  {
    heading: "Test doubles — replacing real dependencies",
    blocks: [
      {
        t: "p",
        text: "To test a class in isolation, you replace its real dependencies with **test doubles** — stand-in objects you control. There are several kinds (the general term is 'test double'), but the two that matter most are **fakes** and **mocks**:",
      },
      {
        t: "table",
        headers: ["Double", "What it is"],
        rows: [
          ["Dummy", "a placeholder passed but never used"],
          ["Stub", "returns hardcoded/canned responses to calls"],
          ["Fake", "a real, working (but simplified) implementation — e.g. an in-memory repository"],
          ["Mock", "a double you set expectations on and verify interactions with (was this method called?)"],
          ["Spy", "wraps a real object, records interactions (partial mock)"],
        ],
      },
      {
        t: "list",
        items: [
          "**Fake** — a genuine, lightweight implementation of the same interface, e.g. a `FakeUserRepository` backed by an in-memory `MutableList` instead of a real database. It *behaves* like the real thing (you can add, query, etc.), just simpler and faster. Tests use it like the real dependency.",
          "**Mock** — a generated object where you *program* what its methods return and *verify* how it was called. Created with a mocking library (MockK, Mockito). You say 'when `getUser(42)` is called, return this' and later assert 'verify `getUser` was called once'.",
          "The distinction — fakes vs mocks — is one of the most-asked testing questions and shapes how you write tests.",
        ],
      },
    ],
  },
  {
    heading: "Fakes vs mocks — the key distinction",
    blocks: [
      {
        t: "code",
        title: "The same test, faked vs mocked",
        code: `// FAKE — a real in-memory implementation
class FakeUserRepository : UserRepository {
    private val users = mutableMapOf<String, User>()
    fun seed(user: User) { users[user.id] = user }
    override suspend fun getUser(id: String) = users[id] ?: error("not found")
}

@Test fun withFake() = runTest {
    val repo = FakeUserRepository().apply { seed(testUser) }
    val vm = UserViewModel(repo)
    vm.load("42")
    assertEquals(testUser, vm.state.value.user)   // assert STATE (outcome)
}

// MOCK — program returns, verify interactions (MockK)
@Test fun withMock() = runTest {
    val repo = mockk<UserRepository>()
    coEvery { repo.getUser("42") } returns testUser   // program the return
    val vm = UserViewModel(repo)
    vm.load("42")
    coVerify { repo.getUser("42") }                    // verify the INTERACTION
}`,
      },
      {
        t: "list",
        items: [
          "**Fakes test *state/behavior*** — you assert the *outcome* ('the ViewModel's state contains the user'). They read like real usage, don't break when you refactor internals, and one fake serves many tests. **Prefer fakes** for your own repositories/data sources.",
          "**Mocks test *interactions*** — you verify *how* collaborators were called ('getUser was called once with 42'). Useful when the interaction *is* the behavior (verifying an analytics event fired, a callback was invoked) or for dependencies you can't easily fake.",
          "**Why fakes are usually preferred**: mock-heavy tests are *brittle* — they're coupled to the exact method calls, so refactoring the implementation (even without changing behavior) breaks them. They can also 'pass' while testing nothing real (you programmed the return, so you're partly testing your own mock setup). Fakes verify actual behavior and survive refactors.",
          "**When mocks win**: verifying a side effect happened (an event was logged, a method was called) where there's no observable state to assert; or replacing an awkward-to-fake external dependency. Modern guidance (Google) leans toward *fakes for your own types, mocks sparingly for interactions/side effects*.",
        ],
      },
    ],
  },
  {
    heading: "MockK — the Kotlin mocking library",
    blocks: [
      {
        t: "p",
        text: "**MockK** is the Kotlin-first mocking library (Mockito is the older Java one, usable via mockito-kotlin). MockK understands Kotlin — coroutines (`coEvery`/`coVerify` for suspend functions), final classes (Kotlin classes are final by default, which trips up Mockito), objects, and extension functions.",
      },
      {
        t: "code",
        title: "MockK essentials",
        code: `val service = mockk<PaymentService>()

every { service.isAvailable() } returns true          // stub a return
coEvery { service.charge(any()) } returns Result.success()  // suspend fn
every { service.log(any()) } just Runs                // stub a Unit function

// ... run the code under test ...

verify { service.isAvailable() }                       // verify called
coVerify(exactly = 1) { service.charge(100) }          // verify with count/args
verify(exactly = 0) { service.refund(any()) }          // verify NOT called

val slot = slot<Payment>()                             // capture arguments
verify { service.charge(capture(slot)) }
assertEquals(100, slot.captured.amount)`,
      },
      {
        t: "list",
        items: [
          "**`mockk<T>()`** creates a mock; **`every { } returns`** stubs a return; **`coEvery`** for suspend functions. **`just Runs`** for `Unit`-returning functions.",
          "**`verify { }`** / **`coVerify { }`** assert a call happened (with `exactly = n`, `atLeast`, argument matchers like `any()`).",
          "**`slot` / `capture`** capture the actual arguments passed, to assert on them.",
          "**`relaxed = true`** creates a mock that returns sensible defaults without stubbing every call (handy but can hide missing stubs).",
          "**`spyk`** wraps a real object (a spy) to override some methods while keeping others real.",
        ],
      },
      {
        t: "note",
        text: "Unit testing essentials: JUnit + Arrange-Act-Assert (one behavior per test, descriptive names, FIRST properties). Test doubles replace dependencies — fakes (real simplified implementations, e.g. in-memory repo — assert STATE/outcome, prefer these) vs mocks (programmed returns + interaction verification — assert CALLS, use for side effects). Mocks are brittle (coupled to calls, break on refactor); fakes survive refactors and read like real usage. MockK is the Kotlin mocking library (coEvery/coVerify for suspend, handles final classes). Prefer fakes for your own types, mocks sparingly.",
      },
    ],
  },
];

export default content;
