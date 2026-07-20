// Koin, KMP DI & Testing — Content tab. Teaching-first.

const content = [
  {
    heading: "Koin — runtime DI",
    blocks: [
      {
        t: "p",
        text: "**Koin** is a dependency injection library that takes the opposite approach to Dagger/Hilt: it resolves dependencies **at runtime** using a service-locator-style registry, written in pure Kotlin with a DSL — no annotation processing, no code generation. You declare *modules* describing how to build each dependency, start Koin with those modules, and request dependencies with `get()`/`inject()`. It's simpler and faster to learn than Dagger, and — importantly — it's **multiplatform**, so it works in KMP shared code where Hilt (Android-only) can't.",
      },
      {
        t: "code",
        title: "A Koin module and usage",
        code: `// Declare how to build each dependency (a DSL, not annotations)
val appModule = module {
    single { OkHttpClient() }                          // single = singleton
    single { Retrofit.Builder().client(get()).build() } // get() resolves dependencies
    single<UserRepository> { UserRepositoryImpl(get()) } // bind interface to impl
    factory { SomeUseCase(get()) }                     // factory = new instance each time
    viewModel { UserViewModel(get()) }                 // ViewModel support
}

// Start Koin (in Application)
startKoin { modules(appModule) }

// Retrieve dependencies
class MyActivity : ComponentActivity() {
    private val repo: UserRepository by inject()       // lazy injection
    private val vm: UserViewModel by viewModel()
}`,
      },
      {
        t: "list",
        items: [
          "**`module { }`** — a DSL block declaring providers. `single { }` = one shared instance (like `@Singleton`); `factory { }` = a new instance each request; `viewModel { }` = ViewModel support. `get()` inside resolves the needed dependencies from the registry.",
          "**No codegen** — Koin is a runtime registry; you `startKoin { modules(...) }` and then `get()`/`by inject()` pull from it. Fast build (no annotation processing), pure Kotlin.",
          "**`by inject()` (lazy) / `get()` (immediate)** — retrieve dependencies, typically in Android entry points.",
        ],
      },
    ],
  },
  {
    heading: "Koin vs Hilt/Dagger — the trade-off",
    blocks: [
      {
        t: "table",
        headers: ["", "Hilt/Dagger", "Koin"],
        rows: [
          ["Resolution", "compile-time (codegen)", "runtime (registry)"],
          ["Missing dependency", "**build error**", "**runtime crash** (when requested)"],
          ["Reflection/codegen", "codegen, no reflection", "no codegen, minimal reflection"],
          ["Build time", "slower (annotation processing)", "faster (no processing)"],
          ["Learning curve", "steep", "gentle"],
          ["Multiplatform (KMP)", "Android-only", "**multiplatform**"],
          ["Runtime performance", "faster (generated code)", "slightly slower (runtime lookup)"],
        ],
      },
      {
        t: "list",
        items: [
          "**The core trade-off — compile-time safety vs simplicity**: Hilt catches a missing/cyclic dependency at *build time* (a build error you fix before shipping); Koin only fails at *runtime* when that dependency is requested (a potential crash in production if a path wasn't exercised). That compile-time guarantee is Hilt's biggest advantage; Koin trades it for a much gentler learning curve, faster builds, and less boilerplate.",
          "**Choose Hilt** for Android-only apps where compile-time safety and Google's recommendation matter — it's the standard.",
          "**Choose Koin** for KMP (it's multiplatform — Hilt can't run in shared code), for smaller apps/teams valuing simplicity, or when build time / codegen is a concern. Many KMP projects use Koin precisely because it works across all targets.",
          "**For an Android/KMP engineer**: Hilt for Android modules, Koin for shared KMP code — a common combination.",
        ],
      },
    ],
  },
  {
    heading: "DI in Kotlin Multiplatform",
    blocks: [
      {
        t: "p",
        text: "In a KMP project, the shared code (`commonMain`) needs DI too — but Hilt/Dagger are JVM/Android-only and can't run there. The options:",
      },
      {
        t: "list",
        items: [
          "**Koin** — the most popular KMP DI choice. It's fully multiplatform, so you define your shared modules in `commonMain` and start Koin from each platform (Android's Application, iOS's app init). The same DI setup works everywhere.",
          "**Manual DI / a hand-written factory** — for smaller shared layers, a plain factory or 'component' class constructed in common code works fine, with platform-specific pieces injected via `expect/actual`. No library needed.",
          "**Kotlin-Inject / Metro / other codegen options** — newer compile-time DI libraries that support KMP are emerging, offering Dagger-like compile-time safety in multiplatform. Worth knowing they exist.",
          "**The common pattern**: shared modules define most dependencies; platform-specific ones (a database driver, a settings implementation) are provided via `expect/actual` or passed in when starting the DI container per platform. Android might *also* use Hilt at the app layer, bridging to the shared Koin/factory graph.",
        ],
      },
    ],
  },
  {
    heading: "DI and testing — the payoff",
    blocks: [
      {
        t: "p",
        text: "DI's biggest benefit is testability, and it shows up concretely in *how easy tests become*. Because classes receive their dependencies, tests simply *inject fakes* — no framework magic needed for unit tests.",
      },
      {
        t: "code",
        title: "Unit test — inject a fake, no DI framework needed",
        code: `@Test
fun loadUser_success() = runTest {
    val fakeRepo = FakeUserRepository(user = testUser)   // a fake implementation
    val viewModel = UserViewModel(fakeRepo, SavedStateHandle())  // just construct it!

    viewModel.loadUser("42")

    assertEquals(testUser, viewModel.uiState.value.user)
}`,
      },
      {
        t: "list",
        items: [
          "**Unit tests don't use the DI framework at all** — since the ViewModel takes its dependencies via constructor, you just *construct it directly* with fakes. The whole point of constructor injection is that the class is trivially instantiable in a test. This is why constructor injection is preferred and why DI is described as 'making code testable'.",
          "**Prefer fakes over mocks** — a `FakeUserRepository` (a real in-memory implementation of the interface) usually reads better and is less brittle than a mock; both work because the ViewModel depends on the interface.",
          "**For instrumented/integration tests, Hilt has test support** — `@HiltAndroidTest`, `@UninstallModules` (remove a production module), and `@BindValue` / test modules let you *replace* production dependencies with fakes in the Hilt graph for on-device tests. So Hilt swaps real modules for test ones at the framework level when you need the full graph.",
          "**Koin has `koin-test`** — utilities to declare test modules and verify the graph (`checkModules()` catches missing bindings in a test, partially recovering the compile-time safety Koin lacks).",
        ],
      },
      {
        t: "note",
        text: "Wrap-up: Koin = runtime DI (registry + DSL, no codegen, multiplatform, gentle learning curve) vs Hilt/Dagger = compile-time (codegen, build-time safety, Android-only). Trade-off: compile-time safety (Hilt catches missing deps at build) vs simplicity + KMP support (Koin). For KMP shared code use Koin (or manual DI / newer KMP codegen libs); Hilt can't go there. DI's testing payoff: constructor injection means unit tests just construct classes with fakes — no framework needed; Hilt/Koin provide test-module swapping for integration tests.",
      },
    ],
  },
];

export default content;
