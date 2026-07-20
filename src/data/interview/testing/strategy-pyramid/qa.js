// Testing Strategy & the Pyramid — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is the testing pyramid?",
    a: [
      {
        t: "p",
        text: "**The testing pyramid is a strategy for how many of each kind of test to write, shaped like a triangle: many fast, cheap *unit tests* at the bottom, fewer *integration tests* in the middle, and a small number of slow, expensive *UI/end-to-end tests* at the top.** The shape reflects a trade-off — you get most of your coverage from the fast, reliable tests, and use only a few of the slow, brittle ones.",
      },
      {
        t: "list",
        items: [
          "**Unit tests (base, many)** — test a single class or function in isolation on the JVM with its dependencies faked. Milliseconds fast, deterministic, and they pinpoint exactly what broke. Most of your tests live here — ViewModels, use cases, mappers, repositories with fakes.",
          "**Integration tests (middle, some)** — test that several components work *together* (a repository with a real Room database, a ViewModel driving a repository). Slower, but catch wiring bugs unit tests miss.",
          "**UI / end-to-end tests (top, few)** — drive the real UI through whole flows (login → home). Most realistic, but slow (run on a device), brittle, and hard to debug — so reserve them for a few critical journeys.",
        ],
      },
      {
        t: "p",
        text: "The reason for the shape is speed and reliability: fast unit tests get run constantly and tell you precisely what broke, while slow, flaky UI tests should be a *thin* top layer. The anti-pattern is the inverted 'ice cream cone' — mostly UI tests — which is slow, flaky, and expensive to maintain. Build correctness bottom-up with cheap unit tests, and use a small set of UI tests to confirm the pieces integrate.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why write tests at all?",
    a: [
      {
        t: "p",
        text: "**The biggest reason is *confidence to change code*.** Without tests, every change risks silently breaking something elsewhere, so developers become afraid to refactor or add features. With a good test suite, you change code freely and the tests immediately tell you if you broke something — tests are a safety net that makes the codebase malleable rather than fragile.",
      },
      {
        t: "list",
        items: [
          "**Confidence to refactor** — you can improve or restructure code without fear, because tests catch regressions. This keeps a codebase healthy over time.",
          "**Regression prevention** — a bug you fix *with* a test can't silently come back; the test guards against it forever.",
          "**Living documentation** — a test is an executable spec showing how a function is meant to be used and what it should do; unlike comments, it can't go stale (it'd fail).",
          "**Fast, precise feedback** — a failing unit test tells you exactly what broke in seconds, versus discovering the bug in production or during slow manual QA.",
        ],
      },
      {
        t: "p",
        text: "The framing that lands: tests aren't primarily about *finding* bugs the first time (though they do) — they're about *preventing* the reintroduction of bugs and enabling *fearless change*. A codebase with good tests can evolve; one without them ossifies because nobody dares touch it. That's why testing is considered a core engineering discipline, not an optional extra.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between local (unit) tests and instrumented tests in Android?",
    a: [
      {
        t: "p",
        text: "**Local tests run on the JVM (your development machine) without a device; instrumented tests run on a real device or emulator with the actual Android framework.** This location difference drives everything about them.",
      },
      {
        t: "list",
        items: [
          "**Local/unit tests** live in `src/test/` and run on the JVM — very *fast* (no device deployment) and used for pure logic: ViewModels, use cases, repositories (with fakes), mappers, utilities. The catch is the Android framework isn't available, so you either test framework-free code or use *Robolectric* (which provides a simulated Android framework on the JVM).",
          "**Instrumented tests** live in `src/androidTest/` and run on a device/emulator with the *real* Android framework — needed for UI tests (Compose/Espresso), Room DAO tests, and anything that needs genuine Android behavior (real Context, real database). They're *slower* (deploy to device + execute) but realistic.",
        ],
      },
      {
        t: "p",
        text: "The practical implication is architectural: if your logic is *separated from the Android framework* (Clean Architecture — framework-free domain and ViewModel logic), most of your tests can be fast JVM unit tests. If your logic is tangled with Android APIs, you're forced into slow instrumented tests. So keeping business logic framework-independent isn't just clean design — it directly makes your test suite fast, which is a major practical reason for the layered architecture. You want the bulk of the pyramid (unit tests) to be local/JVM tests, with instrumented tests reserved for UI and genuinely Android-dependent pieces.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is the inverted testing pyramid (mostly UI tests) an anti-pattern?",
    a: [
      {
        t: "p",
        text: "**The inverted pyramid — often called the 'ice cream cone' (many UI/end-to-end tests, few unit tests) — is an anti-pattern because it optimizes for the *most realistic* tests at the expense of the properties that make a test suite actually useful: speed, reliability, and precision. It produces a suite that's slow, flaky, and hard to maintain, which paradoxically leads to *less* effective testing.**",
      },
      {
        t: "list",
        items: [
          "**Speed — it becomes too slow to run**: UI tests take seconds each on a device; a suite dominated by them takes many minutes or hours. Slow suites don't get run frequently — developers skip them locally, CI becomes a bottleneck, and feedback that arrives an hour after a change is nearly useless. Fast unit suites run on every save.",
          "**Reliability — flakiness erodes trust**: UI tests are inherently flaky (timing, animations, device/emulator state, network). A suite that fails randomly ~5% of the time trains the team to *ignore* failures ('just re-run it'), which defeats the entire purpose — a test you ignore protects nothing. Unit tests are deterministic and stay trustworthy.",
          "**Precision — poor failure localization**: when an end-to-end test fails, it tells you 'something in this whole flow broke' but not *what* or *where* — you have to debug through the entire stack. A failing unit test points at the exact function. Debugging inverted-pyramid failures is expensive.",
          "**Maintenance cost — brittle to change**: UI tests break on *any* UI change (a moved button, a renamed label), even when behavior is correct, so a UI-heavy suite generates constant maintenance churn that isn't catching real bugs. Unit tests are coupled to *behavior*, not presentation, so they survive UI refactors.",
        ],
      },
      {
        t: "list",
        items: [
          "**How it happens**: teams sometimes reach for UI tests because they *feel* more real ('it tests what the user does') and because the code wasn't architected for unit testing (logic tangled with Android/UI, so unit tests are hard to write). The fix is both cultural (value fast unit tests) and architectural (separate logic from framework so it's unit-testable).",
          "**The right shape**: build correctness *bottom-up* — thorough, fast unit tests for logic (the bulk), a moderate layer of integration tests for component wiring, and a *thin* top layer of UI tests covering only the few critical user journeys (login, checkout) for integration confidence. You get fast feedback, precise failures, and a small, high-value UI layer.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the goal of a test suite isn't 'maximum realism per test' — it's *maximum confidence per unit of time and maintenance cost*. Unit tests win overwhelmingly on that metric (fast, reliable, precise, cheap to maintain), so they should dominate; UI tests buy integration confidence but at high cost, so they should be few and targeted. The inverted pyramid mistakes 'realistic' for 'valuable' and ends up with a suite too slow and flaky to trust — which is worse than fewer, faster tests that people actually run and believe. Recognizing that testing is about *sustainable confidence*, and that architecture (framework-free logic) is what enables the healthy shape, is the mature view.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does app architecture affect testability, and what makes code easy or hard to test?",
    a: [
      {
        t: "p",
        text: "**Architecture is the single biggest factor in testability — well-architected code is easy to test almost incidentally, while poorly-architected code is hard to test no matter how much effort you put in. The core principle is *separation of concerns plus dependency injection*: isolate logic from the framework and from its collaborators, so each piece can be tested independently with fakes.**",
      },
      {
        t: "list",
        items: [
          "**Dependency injection makes code testable** — the most important factor. A class that *receives* its dependencies (constructor injection) can be tested by injecting fakes; a class that *creates* its dependencies (`val repo = RealRepository(realApi, realDb)`) forces real collaborators (real network, real DB) into every test, making them slow, flaky, or impossible. DI is what lets you construct a unit in isolation with controlled inputs.",
          "**Separating logic from the Android framework** makes tests *fast JVM unit tests* instead of slow instrumented ones. A ViewModel or use case that's pure Kotlin (no Android imports, framework accessed via injected abstractions) runs on the JVM in milliseconds. One tangled with `Context`, `View`, or static Android calls needs a device or Robolectric. Clean Architecture's framework-free domain/ViewModel layers exist partly for exactly this.",
          "**Single responsibility makes tests focused** — a class doing one thing has a small, clear set of behaviors to test; a God class doing ten things needs a sprawling, brittle test that's hard to write and understand. Small units → small, clear tests.",
          "**Depending on interfaces/abstractions enables substitution** — when a ViewModel depends on a `Repository` *interface*, tests inject a `FakeRepository`. When it depends on a concrete `RepositoryImpl`, you're stuck with the real one (or must mock a concrete class, which is more fragile). This is the dependency-inversion principle serving testability.",
          "**Pure functions / immutable state** — logic expressed as pure functions (same input → same output, no side effects) is trivially testable (just assert outputs). Code full of hidden mutable state and side effects is hard to test because behavior depends on invisible context. Unidirectional data flow and immutable UiState make ViewModels assertable ('given this input, the emitted state is X').",
        ],
      },
      {
        t: "list",
        items: [
          "**What makes code *hard* to test (the anti-patterns)**: static/global state and singletons accessed directly (can't substitute); hardcoded dependencies (`new`/direct construction); logic buried in Android components (Activities, custom Views) that need a device; hidden side effects and mutable shared state; hardcoded dispatchers/threads (can't control timing); and tight coupling to concrete classes. Each forces slow, brittle, or impossible tests.",
          "**The virtuous cycle**: designing for testability *also* produces better design — DI, separation of concerns, interfaces, pure functions, and immutability are good architecture *independent* of testing. So 'is this testable?' is a useful design lens: if a class is hard to test, it's usually because it's doing too much or is too coupled — the difficulty is a *design smell*, not just a testing inconvenience.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: testability isn't something you bolt on — it's a *property of good architecture*. The same choices that make code clean (DI, layered separation, interfaces, single responsibility, immutable state, injected dispatchers) are exactly what make it testable, and code that resists testing is usually revealing a design problem. So the mature perspective is bidirectional: architect for separation and injection, and you get testability for free; and conversely, use 'how hard is this to test?' as a signal about design quality. This is why the earlier categories (Clean Architecture, DI, framework-free ViewModels, injected dispatchers) keep connecting back to testing — they're the *enablers* of the healthy testing pyramid.",
      },
    ],
  },
];

export default qa;
