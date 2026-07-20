// Koin, KMP DI & Testing — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is Koin and how does it differ from Hilt?",
    a: [
      {
        t: "p",
        text: "**Koin is a dependency injection library that resolves dependencies at *runtime* using a registry, written in pure Kotlin with a DSL — no annotation processing or code generation. This is the opposite of Hilt/Dagger, which resolve dependencies at *compile time* via code generation.** You declare modules describing how to build each dependency, start Koin with them, and retrieve dependencies with `get()`/`by inject()`.",
      },
      {
        t: "code",
        title: "Koin's DSL style",
        code: `val appModule = module {
    single { Retrofit.Builder().build() }
    single<UserRepository> { UserRepositoryImpl(get()) }
    viewModel { UserViewModel(get()) }
}
startKoin { modules(appModule) }`,
      },
      {
        t: "list",
        items: [
          "**Runtime vs compile-time** — the fundamental difference. Koin builds the graph when the app runs; Hilt builds it when you compile.",
          "**Missing dependency**: with Hilt it's a *build error*; with Koin it's a *runtime crash* when that dependency is first requested. This is Koin's biggest downside.",
          "**Simplicity** — Koin has a much gentler learning curve, no codegen (faster builds), less boilerplate, and a readable DSL. That's its main appeal.",
          "**Multiplatform** — Koin works in KMP shared code; Hilt is Android-only.",
        ],
      },
      {
        t: "p",
        text: "So the short version: Koin trades Hilt's compile-time safety for simplicity and multiplatform support. Hilt is the Android standard (Google-recommended, compile-time safe); Koin is popular for smaller apps, teams preferring simplicity, and especially KMP projects where Hilt can't run.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why is dependency injection good for testing?",
    a: [
      {
        t: "p",
        text: "**Because DI lets you replace real dependencies with fakes in tests — and with constructor injection, this is trivial: you just construct the class with fake dependencies, no framework needed.** A class that takes its dependencies via constructor is directly instantiable in a test with whatever you want to pass in.",
      },
      {
        t: "code",
        title: "Testing with a fake — just construct it",
        code: `@Test fun test() = runTest {
    val fakeRepo = FakeUserRepository(user = testUser)   // fake implementation
    val vm = UserViewModel(fakeRepo, SavedStateHandle()) // construct directly

    vm.loadUser("42")
    assertEquals(testUser, vm.uiState.value.user)
}`,
      },
      {
        t: "p",
        text: "Contrast this with a class that creates its own dependencies (`val repo = RealRepository(realApi, realDb)`) — in a test you can't replace those, so you're stuck with real network calls and a real database, making tests slow, flaky, and hard to control. With DI, you inject a `FakeUserRepository` that returns canned data, and the test is fast, isolated, and deterministic. Notice that **unit tests don't use the DI framework at all** — the whole benefit of constructor injection is that the class is plainly constructable, so you bypass Hilt/Koin entirely and just `new` the object with fakes. This is the concrete reason DI is described as 'what makes code testable', and it's why constructor injection is preferred over field injection (field-injected classes are harder to set up in tests). For full integration tests that need the real graph, Hilt and Koin both provide ways to swap in test modules.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between 'single' and 'factory' in Koin?",
    a: [
      {
        t: "p",
        text: "**They control instance lifetime — `single` creates one shared instance (a singleton), while `factory` creates a new instance every time the dependency is requested.** This is Koin's equivalent of scoped vs unscoped in Dagger/Hilt.",
      },
      {
        t: "list",
        items: [
          "**`single { }`** — Koin creates the instance once and reuses it for all requests. Use for expensive or shared objects that should have one instance: the database, the Retrofit client, repositories. Equivalent to `@Singleton` in Hilt.",
          "**`factory { }`** — Koin creates a fresh instance on each request. Use for lightweight, stateless objects where a shared instance isn't needed or where you specifically want a new one each time. Equivalent to unscoped in Dagger.",
          "**`viewModel { }`** — a special one for ViewModels, scoped to the ViewModel lifecycle (like `@HiltViewModel`), so it survives configuration changes appropriately.",
          "**`scoped { }`** — instances tied to a custom scope's lifetime (e.g. an Activity scope), between singleton and factory.",
        ],
      },
      {
        t: "p",
        text: "The decision is the same as choosing scopes anywhere: match the instance's lifetime to how it should be shared. A database is a `single` (one for the app — multiple would be wasteful and could conflict); a short-lived stateless helper can be a `factory`. Getting this right matters for both correctness (sharing stateful objects unintentionally causes bugs) and resources (unnecessary singletons stay in memory). It's the runtime-DSL expression of the same scoping concept that `@Singleton`/unscoped represents in Hilt.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle dependency injection in a Kotlin Multiplatform project?",
    a: [
      {
        t: "p",
        text: "**The main constraint is that Hilt/Dagger are JVM/Android-only and cannot run in shared `commonMain` code, so you need a multiplatform-capable DI approach for the shared layer. The most common choice is Koin (fully multiplatform), with manual DI as a lightweight alternative, and newer KMP-capable codegen libraries emerging.**",
      },
      {
        t: "list",
        items: [
          "**Koin — the popular choice**: it's multiplatform, so you define your shared DI modules in `commonMain` (repositories, use cases, the network client, etc.) and start Koin from *each* platform's entry point (Android's `Application`, iOS's app initialization). The same module definitions serve all targets. This is why many KMP projects standardize on Koin — one DI setup across Android and iOS.",
          "**Manual DI** — for a smaller shared layer, a hand-written factory or 'component' class constructed in common code works without any library. Platform-specific dependencies (a SQLDelight database driver, a settings implementation, an HTTP engine) are provided via `expect/actual` or passed in when constructing the shared graph. No library overhead, full control.",
          "**Platform-specific pieces via expect/actual**: regardless of approach, some dependencies are inherently platform-specific (database driver, file paths, secure storage). These are declared `expect` in common and `actual` per platform, then injected into the shared graph — so the shared modules stay platform-agnostic while the concrete platform bits are supplied where needed.",
          "**Newer options**: KMP-capable compile-time DI libraries (kotlin-inject, Metro, etc.) are maturing, offering Dagger-like compile-time safety in multiplatform — worth knowing as the space evolves, though Koin/manual remain the pragmatic mainstream.",
        ],
      },
      {
        t: "list",
        items: [
          "**A common hybrid**: the shared KMP layer uses Koin (or manual DI), and the Android app layer *also* uses Hilt for Android-specific wiring (ViewModels, WorkManager), bridging to the shared graph. So an Android/KMP engineer often works with *both* — Hilt in the Android module, Koin in shared code.",
          "**iOS consumption**: the shared DI graph is initialized from Swift (calling the shared `startKoin`/factory), and iOS retrieves shared dependencies through the Kotlin framework interface. Koin has Swift-friendly helpers for this.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: KMP DI is fundamentally about the shared layer needing a *platform-neutral* solution, since the Android-standard Hilt can't cross the boundary. Koin is the mainstream answer (multiplatform, same modules everywhere), manual DI works for smaller graphs, and platform specifics are handled via `expect/actual`. The realistic professional setup often combines Hilt (Android app layer) with Koin/manual DI (shared KMP layer) — and being able to explain *why* Hilt stops at the Android boundary and what fills the gap in common code is exactly the KMP-aware answer an interviewer for an Android/KMP role is looking for.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you swap dependencies for testing in Hilt vs Koin?",
    a: [
      {
        t: "p",
        text: "**For pure unit tests, neither framework is involved — you construct classes directly with fakes (thanks to constructor injection). The framework-level swapping matters for *integration/instrumented tests* that exercise the real object graph, and both Hilt and Koin provide mechanisms to replace production dependencies with test doubles.**",
      },
      {
        t: "list",
        items: [
          "**The unit-test case (no framework)**: because your classes take dependencies via constructor, a unit test just does `UserViewModel(fakeRepo, SavedStateHandle())` — you bypass Hilt/Koin entirely and pass fakes directly. This is the common case and the primary testing payoff of DI; you almost never need the framework for unit tests.",
          "**Hilt integration testing**: use `@HiltAndroidTest` on the test class (with a `HiltAndroidRule`). To replace a production dependency, you either **`@UninstallModules(ProductionModule::class)`** and provide a test module in its place, or use **`@BindValue`** to bind a specific test instance into the graph for that test. Hilt then builds the graph with your test doubles instead of the real ones, so an on-device test exercises the real wiring with fakes at the boundaries (e.g. a fake network layer). This is how you test full flows through the Hilt-managed graph.",
          "**Koin integration testing (`koin-test`)**: you start Koin in the test with a *test module* that overrides the production bindings (Koin lets a later module's definitions override earlier ones), so `get()`/`by inject()` resolve to your fakes. Koin also offers **`checkModules()`** — a test that walks the graph and verifies every dependency can be resolved, which partially recovers the compile-time safety Koin otherwise lacks by catching missing bindings *in a test* rather than in production.",
        ],
      },
      {
        t: "list",
        items: [
          "**The philosophical difference in testability**: Hilt's compile-time graph means wiring errors are caught at build time regardless of tests; Koin's runtime graph means you *should* add a `checkModules()` test to catch missing bindings, since they'd otherwise only surface at runtime. So with Koin, part of your test suite compensates for the lack of compile-time verification.",
          "**Best practice regardless**: keep the *unit* test layer framework-free (construct with fakes) — it's fast and simple — and reserve framework-level module swapping (`@UninstallModules`/`@BindValue` in Hilt, override modules in Koin) for the smaller set of *integration* tests that genuinely need the assembled graph.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: DI's testing story has two layers — unit tests (bypass the framework, inject fakes via constructor; the bulk of your tests) and integration tests (use the framework's swap mechanism to substitute fakes into the real graph). Hilt provides `@UninstallModules`/`@BindValue`/test modules; Koin provides override modules plus `checkModules()` to catch its runtime-resolution risk in a test. The mature approach is to lean heavily on framework-free unit tests (which is *why* you did constructor injection) and use graph-swapping sparingly for the few tests that need it — and to add `checkModules()` when using Koin to recover some of the safety Hilt gets for free.",
      },
    ],
  },
];

export default qa;
