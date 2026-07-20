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
  {
    level: "junior",
    q: "How do you define and start a Koin module?",
    a: [
      {
        t: "p",
        text: "A Koin `module { }` is a DSL declaring how to create dependencies — `single { }` for singletons, `factory { }` for new instances, `viewModel { }` for ViewModels. You then `startKoin { modules(...) }` (usually in the Application) to build the container. It's runtime DI: definitions are resolved when requested.",
      },
      {
        t: "code",
        title: "Koin module",
        code: `val appModule = module {
    single { Retrofit.Builder()...create(Api::class.java) }
    single<Repository> { RepositoryImpl(get(), get()) }   // get() resolves deps
    viewModel { HomeViewModel(get()) }
}
// Application: startKoin { androidContext(this@App); modules(appModule) }`,
      },
      {
        t: "list",
        items: [
          "**`module { }`** — DSL of definitions.",
          "**`single`/`factory`/`viewModel`** — instance strategies.",
          "**`get()`** — resolve a dependency inside a definition.",
          "**`startKoin { modules(...) }`** — build the container.",
        ],
      },
      {
        t: "note",
        text: "A Koin module { } declares definitions: single { } (singleton), factory { } (new each time), viewModel { } (ViewModel); get() resolves dependencies inside a definition. startKoin { androidContext(...); modules(...) } builds the container (in the Application). It's runtime DI — resolved on request.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you inject dependencies with Koin (by inject, get, by viewModel)?",
    a: [
      {
        t: "p",
        text: "In Android classes, use `by inject<T>()` (lazy) or `get<T>()` (eager) to retrieve dependencies, and `by viewModel<T>()` for ViewModels. Constructor injection works by having definitions call `get()`. Koin resolves the type from its modules at the point of retrieval — no annotations or code generation.",
      },
      {
        t: "code",
        title: "Retrieving dependencies",
        code: `class MyActivity : ComponentActivity() {
    private val repo: Repository by inject()      // lazy
    private val viewModel: HomeViewModel by viewModel()
}`,
      },
      {
        t: "list",
        items: [
          "**`by inject()`** — lazy dependency retrieval.",
          "**`get()`** — eager retrieval.",
          "**`by viewModel()`** — Koin-provided ViewModel.",
          "**No annotations** — runtime resolution from modules.",
        ],
      },
      {
        t: "note",
        text: "Koin retrieval: by inject<T>() (lazy) / get<T>() (eager) for dependencies, by viewModel<T>() for ViewModels; definitions use get() for constructor deps. No annotations or codegen — Koin resolves types from modules at retrieval time (runtime DI).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you scope dependencies in Koin?",
    a: [
      {
        t: "p",
        text: "Beyond `single` (app-wide) and `factory` (new each time), Koin has *scopes* — `scope<MyActivity> { scoped { ... } }` creates instances tied to a scope's lifetime (e.g. an Activity), released when the scope closes. Koin also provides lifecycle-aware scopes (`activityScope`, `fragmentScope`). Scoped instances are single within their scope, like Dagger's lifecycle scopes but resolved at runtime.",
      },
      {
        t: "list",
        items: [
          "**`single`** — app-wide singleton.",
          "**`factory`** — new instance each request.",
          "**`scoped` in a `scope`** — tied to a scope's lifetime.",
          "**Lifecycle scopes** — `activityScope`/`fragmentScope`.",
        ],
      },
      {
        t: "note",
        text: "Koin scoping: single (app-wide), factory (new each time), and scope<T> { scoped { } } for lifetime-tied instances (released when the scope closes), plus lifecycle-aware activityScope/fragmentScope. Scoped instances are single within their scope — like Dagger scopes but resolved at runtime.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the trade-offs of Koin versus Hilt?",
    a: [
      {
        t: "p",
        text: "*Koin* is runtime DI (a Kotlin DSL) — simple setup, no annotation processing/codegen (fast builds), KMP-friendly, easy to learn. But errors surface *at runtime* (missing definition = crash when requested), and there's a small runtime cost. *Hilt* is compile-time — errors caught at build, no reflection (fast runtime), but more build time and ceremony. Choose Koin for simplicity/KMP/fast builds; Hilt for compile-time safety in large Android apps.",
      },
      {
        t: "table",
        headers: ["", "Koin", "Hilt"],
        rows: [
          ["Resolution", "runtime (DSL)", "compile-time (codegen)"],
          ["Errors", "at runtime", "at build"],
          ["Build cost", "low", "annotation processing"],
          ["KMP", "yes", "no"],
        ],
      },
      {
        t: "list",
        items: [
          "**Koin** — runtime DSL, simple, fast builds, KMP; runtime errors.",
          "**Hilt** — compile-time safe, no reflection; more build cost/ceremony.",
          "**Koin for** — simplicity, KMP, small/medium apps.",
          "**Hilt for** — compile-time safety in large Android apps.",
        ],
      },
      {
        t: "note",
        text: "Koin: runtime DSL — simple, no codegen (fast builds), KMP-friendly, but errors at runtime (missing definition crashes) + slight runtime cost. Hilt: compile-time — errors caught at build, no reflection, but more build cost/ceremony. Koin for simplicity/KMP; Hilt for compile-time safety in large Android apps.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you expose a shared Koin graph to iOS in a KMP project?",
    a: [
      {
        t: "p",
        text: "Define the shared Koin modules in `commonMain` and provide a Kotlin *initializer function* (e.g. `initKoin()`) that iOS calls from Swift to start Koin. Since iOS can't use Koin's DSL directly from Swift ergonomically, expose *helper accessor functions* (or a `KoinComponent` facade) in shared code that Swift calls to obtain dependencies. This lets the iOS app bootstrap and use the shared graph.",
      },
      {
        t: "list",
        items: [
          "**Shared modules** — in `commonMain`.",
          "**`initKoin()`** — a Kotlin function iOS calls to start Koin.",
          "**Accessor facade** — helper functions Swift calls for deps.",
          "**Bootstrap** — iOS app starts and uses the shared graph.",
        ],
      },
      {
        t: "note",
        text: "Expose the shared Koin graph to iOS: define modules in commonMain, provide a Kotlin initializer (initKoin()) iOS calls from Swift, and expose accessor helper functions (or a KoinComponent facade) in shared code that Swift calls to obtain dependencies — since Swift can't ergonomically use Koin's DSL directly.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you swap dependencies for testing in Koin?",
    a: [
      {
        t: "p",
        text: "Because Koin resolves at runtime, you can override definitions easily: start Koin with a *test module* that provides fakes (or use `koinApplication`/`startKoin` with `modules(testModule)`), or use Koin's test support (`KoinTest`, `declareMock`, `checkModules`). Overriding a definition with the same type replaces the real one — simple to inject fakes without recompiling a component.",
      },
      {
        t: "list",
        items: [
          "**Test module** — provide fakes; start Koin with it.",
          "**Override** — same-type definition replaces the real one.",
          "**`KoinTest`/`declareMock`** — test support.",
          "**`checkModules`** — verify the graph resolves.",
        ],
      },
      {
        t: "note",
        text: "Koin's runtime resolution makes test-swapping easy: start Koin with a test module providing fakes (or override definitions — same type replaces the real one), using KoinTest/declareMock. checkModules verifies the graph resolves. No component recompile needed to inject fakes.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle constructor injection with Koin's DSL?",
    a: [
      {
        t: "p",
        text: "In a Koin definition, call `get()` for each constructor parameter — Koin resolves them from the graph. So a class uses normal constructor injection (dependencies as parameters), and the module's definition wires them with `get()`. This keeps classes framework-agnostic (they don't know about Koin) while the module does the wiring.",
      },
      {
        t: "code",
        title: "get() wiring",
        code: `class UserRepository(private val api: Api, private val dao: UserDao)   // plain constructor
val module = module {
    single { UserRepository(get(), get()) }   // Koin resolves api and dao
}`,
      },
      {
        t: "list",
        items: [
          "**`get()` per parameter** — Koin resolves each from the graph.",
          "**Plain constructors** — classes are framework-agnostic.",
          "**Module wires** — the definition supplies dependencies.",
          "**Named/params** — `get(named(\"x\"))` / `get { parametersOf(...) }`.",
        ],
      },
      {
        t: "note",
        text: "In a Koin definition, call get() for each constructor parameter — Koin resolves them from the graph. Classes use plain constructor injection (framework-agnostic, don't know Koin); the module does the wiring. Use get(named(\"x\")) for qualified deps and parametersOf for runtime params.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you bind an interface to an implementation in Koin?",
    a: [
      {
        t: "p",
        text: "Specify the *interface type* on the definition — `single<Repository> { RepositoryImpl(get()) }` binds the `Repository` interface to `RepositoryImpl`, so injecting `Repository` gives you the impl. Without the explicit type, Koin registers it as `RepositoryImpl`. This is how you program to interfaces with Koin (the equivalent of Dagger's `@Binds`).",
      },
      {
        t: "code",
        title: "Interface binding",
        code: `single<Repository> { RepositoryImpl(get()) }   // inject Repository -> RepositoryImpl
// consumer:
class ViewModel(private val repo: Repository)   // depends on the interface`,
      },
      {
        t: "list",
        items: [
          "**`single<Interface> { Impl(...) }`** — bind interface → impl.",
          "**Without the type** — registered as the concrete class.",
          "**Program to interfaces** — consumers depend on the abstraction.",
          "**= Dagger `@Binds`** — the runtime equivalent.",
        ],
      },
      {
        t: "note",
        text: "Specify the interface type: single<Repository> { RepositoryImpl(get()) } binds Repository → RepositoryImpl (injecting Repository gives the impl). Without the type it registers as the concrete class. This is programming-to-interfaces in Koin — the runtime equivalent of Dagger's @Binds.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you verify a Koin graph is complete?",
    a: [
      {
        t: "p",
        text: "Since Koin resolves at runtime, a missing definition only crashes when that dependency is requested — potentially in production. Mitigate with `checkModules()` (a Koin test that attempts to resolve every definition, catching missing dependencies at test time), and `verify()` for module verification. Running these in CI recovers some of the compile-time safety Koin otherwise lacks.",
      },
      {
        t: "list",
        items: [
          "**Runtime resolution risk** — missing definition crashes on request.",
          "**`checkModules()`** — a test resolving all definitions.",
          "**`verify()`** — module verification.",
          "**CI** — run these to catch missing deps before production.",
        ],
      },
      {
        t: "note",
        text: "Koin resolves at runtime, so a missing definition crashes only when requested. Use checkModules() (a test that resolves every definition, catching missing deps at test time) and verify() in CI — recovering some of the compile-time safety Koin lacks. Run them to catch graph gaps before production.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you inject a ViewModel with Koin?",
    a: [
      {
        t: "p",
        text: "Declare it in a module with `viewModel { HomeViewModel(get()) }`, then retrieve it with `by viewModel()` (Android) or `koinViewModel()` (Compose). Koin's `koin-androidx-viewmodel` integration handles the `ViewModelProvider.Factory` and scoping. For a runtime parameter, use `viewModel { (id: String) -> DetailViewModel(id, get()) }` and pass it via `parametersOf`.",
      },
      {
        t: "code",
        title: "Koin ViewModel",
        code: `val module = module {
    viewModel { HomeViewModel(get()) }
    viewModel { (id: String) -> DetailViewModel(id, get()) }
}
// Compose: val vm = koinViewModel<HomeViewModel>()
// with param: koinViewModel { parametersOf(id) }`,
      },
      {
        t: "list",
        items: [
          "**`viewModel { }`** — declare the ViewModel definition.",
          "**`by viewModel()`/`koinViewModel()`** — retrieve (Views/Compose).",
          "**Parameters** — `viewModel { (arg) -> }` + `parametersOf`.",
          "**Integration** — koin-androidx-viewmodel handles the factory.",
        ],
      },
      {
        t: "note",
        text: "Koin ViewModel: declare viewModel { HomeViewModel(get()) }, retrieve with by viewModel() (Views) or koinViewModel() (Compose); koin-androidx-viewmodel handles the factory/scoping. For runtime params: viewModel { (id) -> DetailViewModel(id, get()) } passed via parametersOf(id).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you pass runtime parameters to a Koin definition?",
    a: [
      {
        t: "p",
        text: "Koin supports *parameter injection*: a definition can take runtime parameters via a lambda `{ (param) -> ... }`, and you pass them at retrieval with `parametersOf(value)`. This handles the same case as Dagger's assisted injection (mixing injected deps with a runtime id) but at runtime, without a generated factory.",
      },
      {
        t: "code",
        title: "Parameters",
        code: `single { (userId: String) -> UserSession(userId, get()) }
val session: UserSession = get { parametersOf(currentUserId) }`,
      },
      {
        t: "list",
        items: [
          "**`{ (param) -> }`** — definition takes runtime params.",
          "**`parametersOf(value)`** — pass at retrieval.",
          "**Runtime + injected** — like assisted injection.",
          "**No generated factory** — resolved at runtime.",
        ],
      },
      {
        t: "note",
        text: "Koin parameter injection: a definition takes runtime params via { (param) -> ... } and you pass them with parametersOf(value) at retrieval — handling the assisted-injection case (injected deps + a runtime id) at runtime, without a generated factory.",
      },
    ],
  },
  {
    level: "senior",
    q: "What DI options exist for Kotlin Multiplatform, and how do they compare?",
    a: [
      {
        t: "p",
        text: "The main KMP DI options are *Koin* (runtime DSL, most popular, simple, multiplatform) and *Kodein-DI* (another runtime multiplatform container). *Hilt/Dagger are Android-only* (JVM annotation processing) so they can't be used in shared KMP code. Some teams use *manual DI* in `commonMain` (a shared container class) to avoid a framework entirely. Koin is the common choice.",
      },
      {
        t: "list",
        items: [
          "**Koin** — runtime DSL, popular, simple, multiplatform.",
          "**Kodein-DI** — another multiplatform container.",
          "**Manual DI** — a shared container in `commonMain`.",
          "**Not Hilt/Dagger** — Android-only.",
        ],
      },
      {
        t: "note",
        text: "KMP DI options: Koin (runtime DSL, popular, simple, multiplatform), Kodein-DI (another multiplatform container), or manual DI (a shared container in commonMain). Hilt/Dagger are Android-only (JVM annotation processing) — unusable in shared code. Koin is the common choice.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle Android context and platform dependencies in Koin?",
    a: [
      {
        t: "p",
        text: "Pass the Android `Context` into Koin at startup with `androidContext(this)` in `startKoin { }`, then retrieve it in definitions with `androidContext()` (or `get()`). For platform-specific dependencies in KMP, use `expect`/`actual` factory functions or separate platform Koin modules — the Android module provides Android impls, the iOS module provides iOS impls.",
      },
      {
        t: "code",
        title: "androidContext",
        code: `startKoin { androidContext(this@App); modules(appModule) }
val module = module {
    single { AppDatabase.build(androidContext()) }   // Context available
}`,
      },
      {
        t: "list",
        items: [
          "**`androidContext(this)`** — provide the Context at startup.",
          "**`androidContext()`** — retrieve it in definitions.",
          "**Platform deps** — `expect`/`actual` or platform modules.",
          "**KMP** — per-platform module provides platform impls.",
        ],
      },
      {
        t: "note",
        text: "Provide the Android Context with androidContext(this) in startKoin, retrieve with androidContext() in definitions. For KMP platform-specific dependencies, use expect/actual factories or separate platform Koin modules (Android module = Android impls, iOS module = iOS impls).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a fake versus a mock, and which should you inject in tests?",
    a: [
      {
        t: "p",
        text: "A *fake* is a working lightweight implementation (an in-memory repository) you write; a *mock* is a generated object whose behavior you stub and whose calls you verify (Mockito/MockK). *Prefer fakes* for most tests — they're more realistic, less brittle, and reusable; use mocks for verifying interactions (was `analytics.log()` called?) or when a fake is impractical. Both are enabled by DI.",
      },
      {
        t: "list",
        items: [
          "**Fake** — a real lightweight implementation (in-memory).",
          "**Mock** — stubbed behavior + verifiable calls (MockK/Mockito).",
          "**Prefer fakes** — realistic, less brittle, reusable.",
          "**Mocks for** — interaction verification / impractical fakes.",
        ],
      },
      {
        t: "note",
        text: "A fake is a working lightweight implementation you write (in-memory repo); a mock is a generated stub with verifiable calls (MockK/Mockito). Prefer fakes (realistic, less brittle, reusable); use mocks to verify interactions (was log() called?) or when a fake is impractical. DI enables injecting either.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you organize DI modules in a large app?",
    a: [
      {
        t: "p",
        text: "Split modules by *concern* or *feature*: a network module, database module, and per-feature modules — rather than one giant module. In multi-module apps, each Gradle module owns its DI module(s). This keeps DI maintainable, makes dependencies discoverable, allows feature modules to declare their own bindings, and supports testing modules in isolation. Aggregate them at the app level.",
      },
      {
        t: "list",
        items: [
          "**Split by concern/feature** — network, DB, per-feature modules.",
          "**Per Gradle module** — each owns its DI module(s).",
          "**Discoverable + maintainable** — not one giant module.",
          "**Aggregate at app** — combine into the graph.",
        ],
      },
      {
        t: "note",
        text: "Organize DI modules by concern/feature (network, DB, per-feature) rather than one giant module; in multi-module apps each Gradle module owns its DI module(s), aggregated at the app level. Keeps DI maintainable/discoverable, lets features declare their own bindings, and supports isolated testing.",
      },
    ],
  },
  {
    level: "junior",
    q: "What Koin extensions exist for Android and Compose?",
    a: [
      {
        t: "p",
        text: "Koin has Android-specific artifacts: `koin-android` (for `androidContext`, `by inject`, scopes), `koin-androidx-viewmodel` (`by viewModel`), `koin-androidx-workmanager` (worker injection), and `koin-androidx-compose` (`koinViewModel()`, `koinInject()` in composables). These integrate Koin with Android/Compose lifecycles and components idiomatically.",
      },
      {
        t: "list",
        items: [
          "**`koin-android`** — `androidContext`, `by inject`, scopes.",
          "**`koin-androidx-viewmodel`** — `by viewModel`.",
          "**`koin-androidx-compose`** — `koinViewModel()`/`koinInject()`.",
          "**`koin-androidx-workmanager`** — Worker injection.",
        ],
      },
      {
        t: "note",
        text: "Koin Android/Compose extensions: koin-android (androidContext, by inject, scopes), koin-androidx-viewmodel (by viewModel), koin-androidx-compose (koinViewModel()/koinInject()), koin-androidx-workmanager (worker injection) — integrating Koin with Android/Compose lifecycles idiomatically.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle DI for feature modules that can be dynamically loaded?",
    a: [
      {
        t: "p",
        text: "Dynamic feature modules complicate DI because they load at runtime. In *Koin*, load the feature's module when the feature starts (`loadKoinModules(featureModule)`) and unload it when done. In *Hilt*, dynamic feature modules can't add to the app component directly — you use `@EntryPoint`/a separate component or expose dependencies from the base module. Koin's runtime nature makes dynamic loading simpler.",
      },
      {
        t: "list",
        items: [
          "**Koin** — `loadKoinModules`/`unloadKoinModules` at feature load/unload.",
          "**Hilt** — dynamic features can't extend the app component; use `@EntryPoint`.",
          "**Base exposes deps** — features consume from the base module.",
          "**Koin simpler** — runtime loading fits dynamic features.",
        ],
      },
      {
        t: "note",
        text: "Dynamic feature modules load at runtime. Koin: loadKoinModules(featureModule) on load, unloadKoinModules on unload. Hilt: dynamic features can't extend the app component — use @EntryPoint or expose deps from the base module. Koin's runtime nature makes dynamic-feature DI simpler than Hilt.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you test a repository with an injected fake data source?",
    a: [
      {
        t: "p",
        text: "Construct the repository with a *fake* API/DAO (an in-memory or scripted implementation of the interface) and test its logic — caching, mapping, error handling — without real network/DB. Since the repository takes its data sources via constructor, you just pass fakes. Assert the repository returns the expected domain data and handles errors correctly.",
      },
      {
        t: "code",
        title: "Repository test",
        code: `val repo = UserRepository(FakeApi(cannedUsers), FakeDao())
val result = repo.getUsers()
assertEquals(expectedUsers, result)`,
      },
      {
        t: "list",
        items: [
          "**Fake data sources** — in-memory/scripted API/DAO.",
          "**Constructor injection** — pass fakes directly.",
          "**Test logic** — caching, mapping, errors.",
          "**No real I/O** — fast, deterministic.",
        ],
      },
      {
        t: "note",
        text: "Construct the repository with fake data sources (in-memory/scripted API/DAO implementing the interfaces) and test its logic — caching, mapping, error handling — without real network/DB. Constructor injection lets you pass fakes directly; assert the repo returns expected domain data and handles errors.",
      },
    ],
  },
  {
    level: "senior",
    q: "When would you choose manual DI over Koin or Hilt?",
    a: [
      {
        t: "p",
        text: "Manual DI (a hand-written container) suits *small apps*, *simple graphs*, *learning*, or *KMP without a framework* — it's explicit, has no dependencies/build cost, and no learning curve. Choose a framework (Hilt/Koin) when the graph grows complex (scopes, lifecycles, many dependencies, ViewModel injection) where manual wiring becomes tedious and error-prone. The threshold is roughly when scope management and boilerplate outweigh the framework's cost.",
      },
      {
        t: "list",
        items: [
          "**Manual DI** — small apps, simple graphs, learning, framework-free KMP.",
          "**Explicit, no cost** — no build/learning overhead.",
          "**Framework** — complex graphs, scopes, lifecycles, ViewModels.",
          "**Threshold** — when boilerplate/scoping outweighs framework cost.",
        ],
      },
      {
        t: "note",
        text: "Manual DI suits small apps, simple graphs, learning, or framework-free KMP — explicit, no build/learning cost. Choose Hilt/Koin when the graph grows complex (scopes, lifecycles, many deps, ViewModel injection) where manual wiring gets tedious/error-prone. The threshold: when boilerplate/scope management outweighs the framework's cost.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you inject platform-specific implementations in KMP?",
    a: [
      {
        t: "p",
        text: "Use `expect`/`actual` for the *declaration* (define an `expect` function/class in `commonMain`, `actual` implementations per platform) or provide platform-specific *Koin modules* that bind platform impls. For example, a `DatabaseDriverFactory` is `expect` in common, `actual` on Android (Room/SQLDelight Android driver) and iOS (native driver), and the shared code depends on the common interface.",
      },
      {
        t: "list",
        items: [
          "**`expect`/`actual`** — common declaration, per-platform implementation.",
          "**Platform Koin modules** — bind platform impls.",
          "**Shared code depends on the common interface** — impls injected per platform.",
          "**Example** — DatabaseDriverFactory, platform APIs.",
        ],
      },
      {
        t: "note",
        text: "KMP platform impls: use expect/actual (common declaration, per-platform actual) or platform-specific Koin modules binding platform impls. Shared code depends on the common interface; each platform provides its implementation (e.g. DatabaseDriverFactory: Room/SQLDelight driver on Android, native on iOS).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the role of the Application class in DI setup?",
    a: [
      {
        t: "p",
        text: "The `Application` is the process-lifetime root, so it's where you *initialize* the DI container: `@HiltAndroidApp` for Hilt (generates the root component), or `startKoin { }` for Koin. It hosts the app-scoped graph and provides the application `Context`. Every DI framework bootstraps from the `Application`.",
      },
      {
        t: "list",
        items: [
          "**Process-lifetime root** — hosts the app-scoped graph.",
          "**Hilt** — `@HiltAndroidApp` generates the root component.",
          "**Koin** — `startKoin { modules(...) }`.",
          "**Provides app Context** — for the container.",
        ],
      },
      {
        t: "note",
        text: "The Application (process-lifetime root) initializes the DI container: @HiltAndroidApp (Hilt — generates the root component) or startKoin { modules(...) } (Koin). It hosts the app-scoped graph and provides the application Context. Every DI framework bootstraps from the Application.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you avoid the service-locator anti-pattern while using Koin?",
    a: [
      {
        t: "p",
        text: "Koin *can* be used like a service locator (calling `get()`/`inject()` everywhere), which reintroduces hidden dependencies. Avoid it by using *constructor injection* — have definitions call `get()` to build objects, but make classes themselves receive dependencies via their *constructors* (not by calling Koin inside). Reserve `by inject()`/`get()` for the entry points (Activities/Fragments) where constructor injection isn't possible.",
      },
      {
        t: "list",
        items: [
          "**Constructor injection** — classes receive deps via constructors.",
          "**`get()` in definitions** — to build, not inside class logic.",
          "**Entry-point retrieval only** — `by inject()` in Activities/Fragments.",
          "**Avoid** — calling Koin throughout class code (hidden deps).",
        ],
      },
      {
        t: "note",
        text: "Koin can degrade into a service locator if you call get()/inject() everywhere (hidden deps). Avoid it: use constructor injection (definitions call get() to build, but classes receive deps via constructors), reserving by inject()/get() for entry points (Activities/Fragments) where constructor injection isn't possible.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you use named qualifiers in Koin?",
    a: [
      {
        t: "p",
        text: "To register multiple definitions of the same type, give them *names* (qualifiers): `single(named(\"auth\")) { ... }` and `single(named(\"public\")) { ... }`, then retrieve with `get(named(\"auth\"))` or `by inject(named(\"auth\"))`. This is Koin's equivalent of Dagger qualifiers for disambiguating same-typed bindings.",
      },
      {
        t: "code",
        title: "Named definitions",
        code: `single(named("auth")) { authClient() }
single(named("public")) { publicClient() }
val client: OkHttpClient = get(named("auth"))`,
      },
      {
        t: "list",
        items: [
          "**`named(\"x\")`** — qualify a definition.",
          "**Retrieve** — `get(named(\"x\"))`/`by inject(named(\"x\"))`.",
          "**Disambiguate** — multiple same-typed definitions.",
          "**= Dagger qualifiers** — the runtime equivalent.",
        ],
      },
      {
        t: "note",
        text: "Koin named qualifiers disambiguate same-typed definitions: single(named(\"auth\")) { } / single(named(\"public\")) { }, retrieve with get(named(\"auth\")). The runtime equivalent of Dagger's @Qualifier/@Named for two OkHttpClients, multiple config strings, etc.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a ViewModel with a fake in a DI-agnostic way?",
    a: [
      {
        t: "p",
        text: "The cleanest ViewModel tests bypass DI entirely: construct the ViewModel directly with fakes (`HomeViewModel(FakeRepo())`) — no Hilt/Koin needed. Because the ViewModel takes dependencies via its constructor, tests provide test doubles and assert its state/behavior with `runTest` + a test dispatcher. Reserve DI-framework test setup (Hilt test rules, Koin test modules) for integration tests.",
      },
      {
        t: "code",
        title: "DI-agnostic VM test",
        code: `@Test fun loads() = runTest {
    val vm = HomeViewModel(FakeRepo(cannedData))   // no DI framework
    vm.load(); advanceUntilIdle()
    assertEquals(UiState.Content(cannedData), vm.state.value)
}`,
      },
      {
        t: "list",
        items: [
          "**Construct directly** — pass fakes, no DI framework.",
          "**Constructor injection** — makes this possible.",
          "**`runTest` + test dispatcher** — deterministic.",
          "**DI test setup** — reserve for integration tests.",
        ],
      },
      {
        t: "note",
        text: "Test ViewModels DI-agnostically: construct directly with fakes (HomeViewModel(FakeRepo())) — no Hilt/Koin needed, since constructor injection lets you pass test doubles. Use runTest + a test dispatcher for determinism. Reserve DI-framework test setup (Hilt rules, Koin test modules) for integration tests.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the pros and cons of runtime DI for a large team?",
    a: [
      {
        t: "p",
        text: "Runtime DI (Koin) *pros*: fast builds (no annotation processing), easy onboarding (simple DSL), KMP support, flexible dynamic loading. *Cons* for large teams/codebases: missing bindings crash *at runtime* (not caught in CI unless you run `checkModules`), the service-locator temptation, and less tooling for large graphs. Large Android teams often prefer *compile-time* DI (Hilt) for the safety net; smaller teams/KMP favor Koin's simplicity.",
      },
      {
        t: "list",
        items: [
          "**Pros** — fast builds, easy onboarding, KMP, flexible.",
          "**Cons** — runtime errors (mitigate with checkModules in CI), service-locator risk.",
          "**Large Android teams** — often prefer Hilt's compile-time safety.",
          "**Small teams/KMP** — favor Koin's simplicity.",
        ],
      },
      {
        t: "note",
        text: "Runtime DI (Koin) pros: fast builds, easy onboarding, KMP, flexible dynamic loading. Cons for large teams: runtime errors on missing bindings (mitigate with checkModules in CI), service-locator temptation, less large-graph tooling. Large Android teams often prefer Hilt's compile-time safety; small teams/KMP favor Koin.",
      },
    ],
  },
];

export default qa;
