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
  {
    level: "junior",
    q: "What is the cost/speed/reliability trade-off across test types?",
    a: [
      {
        t: "p",
        text: "As you go up the pyramid, tests get *slower, more expensive to write/maintain, and flakier*, but *more realistic*. Unit tests are fast/cheap/reliable but narrow; UI/E2E tests catch integration bugs but are slow, brittle, and flaky. This trade-off is *why* the pyramid recommends *many* fast unit tests, *some* integration tests, and *few* UI/E2E tests — maximizing confidence per unit of cost.",
      },
      {
        t: "table",
        headers: ["", "Unit", "Integration", "UI/E2E"],
        rows: [
          ["Speed", "fast", "medium", "slow"],
          ["Cost/maintenance", "low", "medium", "high"],
          ["Flakiness", "low", "medium", "high"],
          ["Realism", "narrow", "moderate", "full"],
        ],
      },
      {
        t: "list",
        items: [
          "**Unit** — fast, cheap, reliable, narrow.",
          "**UI/E2E** — realistic but slow, expensive, flaky.",
          "**Pyramid** — many unit, some integration, few UI.",
          "**Maximize confidence per cost.**",
        ],
      },
      {
        t: "note",
        text: "Up the pyramid: slower, costlier, flakier, but more realistic. Unit tests are fast/cheap/reliable but narrow; UI/E2E catch integration bugs but are slow/brittle/flaky. This trade-off drives the pyramid — many fast unit tests, some integration, few UI/E2E — for maximum confidence per cost.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a smoke test?",
    a: [
      {
        t: "p",
        text: "A *smoke test* is a quick, shallow check that the *most critical paths work* — 'does the app launch, log in, and show the main screen without crashing?' It's run early (after a build/deploy) to catch catastrophic failures before deeper testing. Smoke tests are broad but shallow (breadth over depth), giving fast confidence that the build is fundamentally sound.",
      },
      {
        t: "list",
        items: [
          "**Quick, shallow** — critical paths work at all.",
          "**Run early** — after build/deploy.",
          "**Breadth over depth** — cover key flows superficially.",
          "**Catch catastrophic failures** — before deeper testing.",
        ],
      },
      {
        t: "note",
        text: "A smoke test is a quick, shallow check of the most critical paths (launch, log in, main screen — no crash), run early after a build/deploy to catch catastrophic failures before deeper testing. Broad but shallow — fast confidence the build is fundamentally sound.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is regression testing?",
    a: [
      {
        t: "p",
        text: "Regression testing verifies that *new changes haven't broken existing functionality* — re-running the test suite (or the relevant subset) after every change. Automated tests are the primary defense against regressions: a good suite catches when a fix or feature accidentally breaks something else. This is a core value of tests — they let you change code confidently.",
      },
      {
        t: "list",
        items: [
          "**Catch broken existing functionality** — after changes.",
          "**Re-run the suite** — every change/PR (CI).",
          "**Automated** — the main defense against regressions.",
          "**Confidence** — change code without fear.",
        ],
      },
      {
        t: "note",
        text: "Regression testing verifies new changes haven't broken existing functionality — re-running the suite (or relevant subset) after every change, automated in CI. It's a core value of tests: catching when a fix/feature accidentally breaks something else, so you can change code confidently.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is end-to-end (E2E) testing, and where does it fit?",
    a: [
      {
        t: "p",
        text: "E2E tests exercise a *complete user journey* through the *real app* (and often real/staging backend) — e.g. sign up → browse → purchase. They give the highest confidence that the whole system works together, but are the *slowest, flakiest, and most expensive* to maintain. Keep them *few* (top of the pyramid) — cover only the *most critical* happy paths, and rely on unit/integration tests for detailed logic.",
      },
      {
        t: "list",
        items: [
          "**Full user journey** — real app (+ backend).",
          "**Highest confidence** — the whole system works.",
          "**Slow/flaky/expensive** — keep them few.",
          "**Critical happy paths only** — top of the pyramid.",
        ],
      },
      {
        t: "note",
        text: "E2E tests exercise a complete user journey through the real app (+ real/staging backend) — highest confidence the whole system works, but slowest/flakiest/most expensive. Keep them few (pyramid top), covering only the most critical happy paths; rely on unit/integration for detailed logic.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between black-box and white-box testing?",
    a: [
      {
        t: "p",
        text: "*Black-box* testing tests behavior through the *public interface* without knowing the internal implementation — you verify inputs→outputs (most unit/integration/UI tests). *White-box* testing uses *knowledge of the internals* to target specific code paths/branches (coverage-driven). Black-box tests are more robust (survive refactoring); white-box helps ensure thorough path coverage. Prefer black-box for behavior, using white-box knowledge to find edge cases.",
      },
      {
        t: "list",
        items: [
          "**Black-box** — test via the interface; input→output.",
          "**White-box** — use internal knowledge; target paths/branches.",
          "**Black-box** — robust to refactoring.",
          "**White-box** — thorough path coverage.",
        ],
      },
      {
        t: "note",
        text: "Black-box testing verifies behavior through the public interface without knowing internals (input→output — most tests); white-box uses internal knowledge to target specific paths/branches (coverage-driven). Black-box is refactor-robust; white-box ensures path coverage. Prefer black-box, using white-box knowledge to find edge cases.",
      },
    ],
  },
  {
    level: "senior",
    q: "What should you NOT test?",
    a: [
      {
        t: "p",
        text: "Don't test: *third-party/framework code* (trust that Room, Retrofit, the SDK work — test *your* usage, not their internals), *trivial code* (getters/setters, simple data classes with no logic), *generated code*, and *implementation details* (private methods, exact internal calls) that would make tests brittle. Focus tests on *your business logic, edge cases, and integration points* — where bugs actually live.",
      },
      {
        t: "list",
        items: [
          "**Third-party/framework** — trust it; test your usage.",
          "**Trivial code** — getters/setters, plain data classes.",
          "**Generated code** — not worth testing.",
          "**Implementation details** — brittle; test behavior.",
        ],
      },
      {
        t: "note",
        text: "Don't test third-party/framework internals (test your usage, not Room/Retrofit's internals), trivial code (getters/setters, plain data classes), generated code, or implementation details (private methods, exact internal calls — brittle). Focus on your business logic, edge cases, and integration points — where bugs live.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between verification and validation?",
    a: [
      {
        t: "p",
        text: "*Verification* asks 'are we building the product *right*?' — does the code meet its specification (correct behavior, no bugs)? Tests are verification. *Validation* asks 'are we building the *right* product?' — does it actually solve the user's problem/meet their needs? Validation involves user feedback, usability testing, analytics. Both matter: verification ensures correctness; validation ensures usefulness.",
      },
      {
        t: "list",
        items: [
          "**Verification** — building it right (meets spec); tests.",
          "**Validation** — building the right thing (meets user needs).",
          "**Validation** — user feedback, usability, analytics.",
          "**Both matter** — correct AND useful.",
        ],
      },
      {
        t: "note",
        text: "Verification: 'are we building it right?' — does the code meet its spec (tests verify this). Validation: 'are we building the right thing?' — does it solve the user's problem (user feedback, usability, analytics). Verification ensures correctness; validation ensures usefulness. Both matter.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you decide what to test first (risk-based testing)?",
    a: [
      {
        t: "p",
        text: "Prioritize by *risk* — test the areas where a bug would be *most costly* and *most likely*: core business logic (payments, auth), complex logic with many edge cases, frequently-changed code, and critical user paths. Deprioritize trivial, stable, or low-impact code. Risk-based testing focuses limited effort where it delivers the most confidence, rather than testing everything equally.",
      },
      {
        t: "list",
        items: [
          "**High impact** — payments, auth, data integrity.",
          "**High likelihood** — complex/frequently-changed code.",
          "**Critical paths** — core user journeys.",
          "**Deprioritize** — trivial/stable/low-impact.",
        ],
      },
      {
        t: "note",
        text: "Risk-based testing prioritizes where a bug is most costly AND most likely: core business logic (payments/auth/data integrity), complex/edge-case-heavy code, frequently-changed code, critical user paths. Deprioritize trivial/stable/low-impact code. Focus limited effort for maximum confidence.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is contract testing?",
    a: [
      {
        t: "p",
        text: "Contract testing verifies that a *consumer* (the app) and a *provider* (the API/backend) agree on the *contract* (request/response shapes) — without full integration. A *consumer-driven contract* (e.g. Pact) records the app's expectations and verifies the provider satisfies them. This catches API changes that would break the app *before* deployment, more reliably than hoping E2E tests catch them.",
      },
      {
        t: "list",
        items: [
          "**Consumer + provider agree** — on request/response contracts.",
          "**Consumer-driven (Pact)** — record app expectations, verify provider.",
          "**Catches API changes** — before they break the app.",
          "**More reliable** — than hoping E2E catches it.",
        ],
      },
      {
        t: "note",
        text: "Contract testing verifies a consumer (app) and provider (API) agree on the contract (request/response shapes) without full integration — consumer-driven contracts (Pact) record app expectations and verify the provider meets them. Catches breaking API changes before deployment, more reliably than E2E.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the role of manual and exploratory testing?",
    a: [
      {
        t: "p",
        text: "Automated tests can't catch everything — *manual/exploratory* testing (a human freely exploring the app) finds *usability issues*, *visual glitches*, *unexpected interactions*, and things you didn't think to automate. It complements automation: automate the *repetitive, deterministic* checks (regression), and use human testing for *judgment-based* exploration and UX. Both are part of a complete strategy.",
      },
      {
        t: "list",
        items: [
          "**Exploratory** — human freely exploring; finds the unexpected.",
          "**Usability/visual/UX** — hard to automate.",
          "**Complements automation** — not a replacement.",
          "**Automate** — repetitive regression; explore for judgment.",
        ],
      },
      {
        t: "note",
        text: "Manual/exploratory testing (a human freely exploring) finds usability issues, visual glitches, unexpected interactions, and things you didn't automate — complementing automation (which handles repetitive deterministic regression). Automate the repetitive; use human testing for judgment-based UX exploration. Both matter.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you add tests to legacy code that has none?",
    a: [
      {
        t: "p",
        text: "Start with *characterization tests* — tests that capture the *current* behavior (even if buggy) so you have a safety net before refactoring. Then refactor to *break dependencies* (introduce interfaces/DI at *seams*) so the code becomes testable, adding proper unit tests as you go. Focus on the areas you're changing (don't try to test everything at once). Michael Feathers' 'Working Effectively with Legacy Code' is the reference.",
      },
      {
        t: "list",
        items: [
          "**Characterization tests** — capture current behavior as a net.",
          "**Break dependencies** — introduce seams (interfaces/DI).",
          "**Refactor to testable** — then add unit tests.",
          "**Focus on changed areas** — incremental, not all at once.",
        ],
      },
      {
        t: "note",
        text: "For untested legacy code: write characterization tests (capture current behavior as a safety net), then break dependencies at seams (interfaces/DI) to make it testable, adding unit tests as you refactor. Focus on the areas you're changing, incrementally. See Feathers' 'Working Effectively with Legacy Code'.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is 'shift-left' testing, and why does it matter?",
    a: [
      {
        t: "p",
        text: "'Shift-left' means testing *earlier* in development (moving testing 'left' on the timeline) — writing unit tests as you code, running tests in CI on every commit, catching bugs *before* they reach QA or production. It matters because the *cost of a bug grows dramatically* the later it's found (a bug caught in code review is cheap; one in production is expensive and damaging). Early testing = cheaper, faster fixes.",
      },
      {
        t: "list",
        items: [
          "**Test earlier** — unit tests while coding, CI on commits.",
          "**Catch bugs early** — before QA/production.",
          "**Cost grows** — bugs are far costlier later.",
          "**Cheaper/faster fixes** — the shift-left payoff.",
        ],
      },
      {
        t: "note",
        text: "Shift-left = testing earlier in development (unit tests while coding, CI on every commit) to catch bugs before QA/production. It matters because a bug's cost grows dramatically the later it's found (code review = cheap; production = expensive/damaging). Early testing means cheaper, faster fixes.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle flaky tests in CI?",
    a: [
      {
        t: "p",
        text: "Flaky tests (pass/fail non-deterministically) *erode trust* in the suite — people start ignoring failures. Handle them: *quarantine* flaky tests (mark them so they don't block CI while you fix them), *investigate root causes* (real time/`Thread.sleep`, shared state, race conditions, network dependence), *fix* them (inject clocks/dispatchers, proper synchronization, fakes), and *don't just retry* (retries hide real bugs). A reliable suite is more valuable than a large flaky one.",
      },
      {
        t: "list",
        items: [
          "**Quarantine** — isolate flaky tests from blocking CI.",
          "**Root-cause** — timing, shared state, races, network.",
          "**Fix** — inject clocks/dispatchers, synchronize, use fakes.",
          "**Don't just retry** — retries hide real bugs.",
        ],
      },
      {
        t: "note",
        text: "Flaky tests erode trust (people ignore failures). Handle them: quarantine (don't block CI while fixing), root-cause (real time/Thread.sleep, shared state, races, network), fix (inject clocks/dispatchers, proper synchronization, fakes) — don't just retry (that hides bugs). A reliable suite beats a large flaky one.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a characterization test?",
    a: [
      {
        t: "p",
        text: "A characterization (or 'golden master') test *documents the existing behavior* of code — you write a test that asserts what the code *currently does* (not what it *should* do), creating a safety net for refactoring legacy code. If a refactor changes the captured behavior, the test fails, alerting you. It's about *pinning down* current behavior before you change the implementation.",
      },
      {
        t: "list",
        items: [
          "**Captures current behavior** — what the code does now.",
          "**Safety net** — for refactoring legacy code.",
          "**Fails on behavior change** — alerts you.",
          "**Not correctness** — pins current behavior (even if buggy).",
        ],
      },
      {
        t: "note",
        text: "A characterization (golden master) test documents what code CURRENTLY does (not what it should) — a safety net for refactoring legacy code. If a refactor changes the captured behavior, it fails, alerting you. It pins current behavior before you change the implementation.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is acceptance testing / BDD?",
    a: [
      {
        t: "p",
        text: "*Acceptance tests* verify the software meets *business requirements/user acceptance criteria* — 'given a logged-in user, when they add an item, then the cart count increases'. *BDD* (Behavior-Driven Development) expresses these in natural language (Gherkin: Given/When/Then, tools like Cucumber), bridging business and code. They're higher-level, focused on user-facing behavior and shared understanding rather than internal units.",
      },
      {
        t: "list",
        items: [
          "**Acceptance tests** — verify business/user criteria.",
          "**BDD** — Given/When/Then natural-language scenarios.",
          "**Bridges business + code** — shared understanding.",
          "**User-facing behavior** — higher-level than units.",
        ],
      },
      {
        t: "note",
        text: "Acceptance tests verify the software meets business/user acceptance criteria (Given a logged-in user, When they add an item, Then the cart count increases). BDD expresses these in natural language (Gherkin Given/When/Then, Cucumber), bridging business and code — higher-level, user-facing behavior and shared understanding.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between functional and non-functional testing?",
    a: [
      {
        t: "p",
        text: "*Functional* testing verifies *what* the app does — features work correctly (login, purchase). *Non-functional* testing verifies *how well* it does it — performance (speed/jank), security, accessibility, battery, memory, usability, compatibility across devices. Both matter: a feature can be functionally correct but fail non-functionally (correct but slow/inaccessible). Mobile especially needs non-functional testing (fragmentation, resources).",
      },
      {
        t: "list",
        items: [
          "**Functional** — features work (what it does).",
          "**Non-functional** — performance/security/accessibility/battery (how well).",
          "**Both matter** — correct AND performant/accessible.",
          "**Mobile** — non-functional is critical (fragmentation/resources).",
        ],
      },
      {
        t: "note",
        text: "Functional testing verifies what the app does (features work — login/purchase); non-functional verifies how well (performance/jank, security, accessibility, battery, memory, compatibility). Both matter — a feature can be functionally correct but slow/inaccessible. Mobile especially needs non-functional testing.",
      },
    ],
  },
  {
    level: "senior",
    q: "What mobile-specific concerns should your test strategy cover?",
    a: [
      {
        t: "p",
        text: "Mobile adds concerns beyond logic: *device fragmentation* (screen sizes, API levels, OEMs — test on a matrix or use Firebase Test Lab), *configuration changes* (rotation, process death — verify state restoration), *offline/flaky networks*, *permissions* (grant/deny paths), *lifecycle* (background/foreground), *performance* on low-end devices, and *accessibility*. A mobile test strategy must cover these, not just business logic.",
      },
      {
        t: "list",
        items: [
          "**Fragmentation** — screens/API levels/OEMs (Test Lab matrix).",
          "**Config change/process death** — state restoration.",
          "**Offline/permissions/lifecycle** — real-world conditions.",
          "**Performance/accessibility** — on low-end devices.",
        ],
      },
      {
        t: "note",
        text: "Mobile test strategy must cover: device fragmentation (screens/API levels/OEMs — Firebase Test Lab matrix), config changes/process death (state restoration), offline/flaky networks, permission grant/deny paths, lifecycle (background/foreground), low-end performance, and accessibility — not just business logic.",
      },
    ],
  },
  {
    level: "senior",
    q: "How much testing is enough — balancing coverage and development speed?",
    a: [
      {
        t: "p",
        text: "There's no fixed number — balance *risk* against *effort*. Test *thoroughly* where bugs are costly/likely (core logic, edge cases) and *lightly* where they're not (trivial/stable code). Fast, focused tests that give real confidence are worth writing; exhaustive tests of trivial code slow development for little value. The goal is *confidence to ship and refactor*, not a coverage number — enough tests that you trust the suite.",
      },
      {
        t: "list",
        items: [
          "**Balance risk vs effort** — no fixed target.",
          "**Thorough** — costly/likely-bug areas (core logic/edge cases).",
          "**Light** — trivial/stable code.",
          "**Goal** — confidence to ship/refactor, not a coverage %.",
        ],
      },
      {
        t: "note",
        text: "Enough testing = balance risk vs effort (no fixed number): thorough where bugs are costly/likely (core logic/edge cases), light where not (trivial/stable). Fast focused tests that give real confidence are worth it; exhaustive trivial-code tests slow development. The goal is confidence to ship/refactor, not a coverage number.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do tests serve as living documentation?",
    a: [
      {
        t: "p",
        text: "Well-written tests *document how code is meant to be used and behave* — a test named `` `withdraw fails when balance is insufficient` `` with clear Arrange-Act-Assert shows the contract better than comments (which drift out of date). Because tests are *executed*, they can't lie — if the behavior changes, the test fails. New developers can read tests to understand a component's behavior and edge cases.",
      },
      {
        t: "list",
        items: [
          "**Document usage/behavior** — how code is meant to work.",
          "**Can't drift** — executed, so always current.",
          "**Better than comments** — which go stale.",
          "**Onboarding** — read tests to understand a component.",
        ],
      },
      {
        t: "note",
        text: "Tests are living documentation — a descriptive test with clear AAA shows how code is meant to be used and behave, better than comments (which drift). Because tests execute, they can't lie: behavior change fails the test. New developers read tests to understand components and edge cases.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is accessibility testing, and why include it?",
    a: [
      {
        t: "p",
        text: "Accessibility testing verifies the app works for users with disabilities — screen readers (TalkBack) announce elements correctly (content descriptions), touch targets are large enough (≥48dp), color contrast is sufficient, and the app is navigable without sight/precise touch. Include it because accessibility is a *legal/ethical requirement* and broadens your audience. Tools: Accessibility Scanner, Espresso accessibility checks, Compose semantics assertions.",
      },
      {
        t: "list",
        items: [
          "**Screen reader** — content descriptions, TalkBack navigation.",
          "**Touch targets/contrast** — ≥48dp, sufficient contrast.",
          "**Legal/ethical** — and broadens audience.",
          "**Tools** — Accessibility Scanner, Espresso/Compose checks.",
        ],
      },
      {
        t: "note",
        text: "Accessibility testing verifies the app works for users with disabilities: screen readers (TalkBack, content descriptions), touch targets ≥48dp, sufficient color contrast, navigability without sight/precise touch. Include it — it's a legal/ethical requirement and broadens your audience. Tools: Accessibility Scanner, Espresso/Compose semantics checks.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between a test suite, test case, and test scenario?",
    a: [
      {
        t: "p",
        text: "A *test case* is a single test verifying one behavior (`login_withValidCredentials_succeeds`). A *test suite* is a *collection* of test cases (a class's tests, or a curated set run together, e.g. a 'smoke suite'). A *test scenario* is a higher-level *situation* being tested (a user journey), which may span multiple cases. Suites organize cases; scenarios describe what's being exercised.",
      },
      {
        t: "list",
        items: [
          "**Test case** — one test, one behavior.",
          "**Test suite** — a collection of cases run together.",
          "**Test scenario** — a higher-level situation/journey.",
          "**Suites organize; scenarios describe.**",
        ],
      },
      {
        t: "note",
        text: "Test case = one test verifying one behavior; test suite = a collection of cases run together (a class's tests, a smoke suite); test scenario = a higher-level situation/journey being tested (may span cases). Suites organize cases; scenarios describe what's exercised.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you integrate testing into a CI/CD pipeline?",
    a: [
      {
        t: "p",
        text: "Run tests automatically on every push/PR: *unit tests* on every commit (fast — block merge on failure), *instrumented/UI tests* on emulators/Firebase Test Lab (slower — maybe on merge to main or nightly), *lint/static analysis*, and *coverage* reporting. Gate merges on passing tests (required checks). Keep the fast feedback loop tight (unit tests in minutes) and run expensive tests less frequently. This enforces quality continuously.",
      },
      {
        t: "list",
        items: [
          "**Unit tests** — every commit/PR; block on failure.",
          "**Instrumented/UI** — Firebase Test Lab; on merge/nightly.",
          "**Lint/static analysis + coverage** — in the pipeline.",
          "**Gate merges** — required passing checks.",
        ],
      },
      {
        t: "note",
        text: "CI/CD testing: run unit tests on every commit/PR (fast — block merge on failure), instrumented/UI tests on emulators/Firebase Test Lab (slower — on merge to main/nightly), plus lint/static analysis and coverage. Gate merges on required passing checks. Keep the fast feedback loop tight; run expensive tests less often.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does the Testing Trophy differ from the pyramid?",
    a: [
      {
        t: "p",
        text: "The *Testing Trophy* (Kent C. Dodds) reweights the pyramid to emphasize *integration tests* as the sweet spot — from bottom to top: static analysis (types/lint), unit tests, a *large* integration layer, and few E2E tests. The idea: integration tests give the best *confidence-to-cost* ratio (they test real interactions without full E2E fragility). On Android, this translates to testing ViewModel+repository or feature slices heavily, with focused unit and few UI tests.",
      },
      {
        t: "list",
        items: [
          "**Trophy** — static → unit → *large* integration → few E2E.",
          "**Integration emphasis** — best confidence-to-cost.",
          "**vs pyramid** — pyramid weights unit heaviest.",
          "**Android** — test feature slices (VM+repo) heavily.",
        ],
      },
      {
        t: "note",
        text: "The Testing Trophy (Kent C. Dodds) emphasizes integration tests as the sweet spot: static analysis → unit → large integration → few E2E — integration gives the best confidence-to-cost (real interactions without E2E fragility). vs the pyramid (unit-heaviest). On Android: test feature slices (ViewModel+repo) heavily.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a test failing and a test erroring?",
    a: [
      {
        t: "p",
        text: "A test *failure* means an *assertion* didn't hold — the code ran but produced the wrong result (`assertEquals` mismatch). A test *error* means an *unexpected exception* was thrown (a `NullPointerException`, a setup crash) — the test couldn't even complete its checks. Failures point to a behavior bug; errors often point to a test-setup problem or a crash. Both fail the build, but they indicate different things.",
      },
      {
        t: "list",
        items: [
          "**Failure** — an assertion didn't hold (wrong result).",
          "**Error** — an unexpected exception/crash.",
          "**Failure → behavior bug** — the code is wrong.",
          "**Error → setup/crash** — often a test problem.",
        ],
      },
      {
        t: "note",
        text: "A failure = an assertion didn't hold (code ran, wrong result — a behavior bug). An error = an unexpected exception (NPE, setup crash — the test couldn't complete, often a setup problem or a real crash). Both fail the build but indicate different things.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test error handling and edge cases systematically?",
    a: [
      {
        t: "p",
        text: "Don't just test the happy path — enumerate the *failure modes* and *boundaries* for each unit: null/empty inputs, boundary values (0, max, off-by-one), error responses (network failure, 4xx/5xx), concurrent access, and unexpected states. Techniques: *equivalence partitioning* (group inputs that behave the same, test one per group) and *boundary value analysis* (test at and around edges). Systematically covering these catches the bugs that happy-path tests miss.",
      },
      {
        t: "list",
        items: [
          "**Enumerate failure modes** — null/empty, errors, concurrency.",
          "**Boundary values** — 0, max, off-by-one.",
          "**Equivalence partitioning** — one test per behavior group.",
          "**Not just happy path** — where real bugs hide.",
        ],
      },
      {
        t: "note",
        text: "Test edge cases systematically: enumerate failure modes (null/empty inputs, boundary values, error responses, concurrency, unexpected states) per unit. Use equivalence partitioning (one test per behavior group) and boundary value analysis (at/around edges). Happy-path-only tests miss the bugs that live at the boundaries.",
      },
    ],
  },
];

export default qa;
