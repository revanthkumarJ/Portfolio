// Hilt — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is Hilt and how does it relate to Dagger?",
    a: [
      {
        t: "p",
        text: "**Hilt is Google's recommended dependency injection library for Android, built as a layer on top of Dagger.** It keeps Dagger's benefits — compile-time verification (missing dependencies are build errors) and no runtime reflection — while removing most of Dagger's boilerplate and adding Android-specific integration.",
      },
      {
        t: "p",
        text: "The core thing Hilt does is provide a *standard set of components already wired to Android lifecycles* — Application, Activity, Fragment, ViewModel, Service. In plain Dagger you have to define these components, their scopes, their parent-child hierarchy, and manage their lifecycles yourself, which is a lot of intricate boilerplate that's essentially the same in every Android app. Hilt standardizes it: you annotate your Application with `@HiltAndroidApp`, your entry points with `@AndroidEntryPoint`, use `@Inject constructor` on your classes, and install modules into predefined components with `@InstallIn`. You never write a `@Component`. So the relationship is: **Dagger is the engine, Hilt is Dagger pre-configured for Android with the boilerplate removed.** Understanding Dagger explains what Hilt generates under the hood, but for day-to-day Android work, Hilt is what you use.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the basic annotations you need to set up Hilt?",
    a: [
      {
        t: "list",
        items: [
          "**`@HiltAndroidApp`** — on your `Application` class. It bootstraps Hilt and generates the app-level component. This is the required entry point.",
          "**`@AndroidEntryPoint`** — on Activities, Fragments, Services, BroadcastReceivers, and Views where you want to inject dependencies. It tells Hilt these framework-created classes can receive injections (via field injection).",
          "**`@Inject constructor`** — on your own classes (repositories, use cases). Hilt uses this to construct them and provide their dependencies, exactly like Dagger.",
          "**`@Module` + `@InstallIn(Component::class)`** — for types you can't construct yourself (interfaces, library classes). The `@InstallIn` says which Hilt component (scope) the bindings belong to.",
        ],
      },
      {
        t: "code",
        title: "The minimal setup",
        code: `@HiltAndroidApp class MyApp : Application()

@AndroidEntryPoint class MainActivity : AppCompatActivity() {
    @Inject lateinit var analytics: Analytics
}

class Repo @Inject constructor(private val api: Api)`,
      },
      {
        t: "p",
        text: "That's the whole setup for basic usage — no `@Component`, no manual factory, no `DaggerXxx` calls. The `@HiltAndroidApp` is the root, `@AndroidEntryPoint` marks where injection happens, `@Inject constructor` handles your classes, and modules handle the rest. Forgetting `@AndroidEntryPoint` on an Activity/Fragment is the most common beginner mistake — injection into it will fail because Hilt doesn't know it's an injection target.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you inject a ViewModel with Hilt?",
    a: [
      {
        t: "p",
        text: "**You annotate the ViewModel with `@HiltViewModel` and use `@Inject constructor`, then retrieve it with `by viewModels()` (Views) or `hiltViewModel()` (Compose). Hilt handles constructing it with its dependencies and scoping it correctly.**",
      },
      {
        t: "code",
        title: "ViewModel injection",
        code: `@HiltViewModel
class UserViewModel @Inject constructor(
    private val repository: UserRepository,
    private val savedStateHandle: SavedStateHandle,   // Hilt provides this too
) : ViewModel()

// Compose
@Composable fun Screen(vm: UserViewModel = hiltViewModel()) { }
// Views (in an @AndroidEntryPoint Activity/Fragment)
private val vm: UserViewModel by viewModels()`,
      },
      {
        t: "p",
        text: "This is one of Hilt's most valued features because ViewModel injection used to be painful. Before Hilt, a ViewModel with constructor arguments required hand-writing a `ViewModelProvider.Factory` for every ViewModel — significant boilerplate. Hilt generates that factory automatically, so `hiltViewModel()`/`by viewModels()` just work. It also makes `SavedStateHandle` injectable as a simple constructor parameter, giving you navigation arguments and process-death survival with no extra code. The only requirements: the ViewModel needs `@HiltViewModel`, and the Activity/Fragment hosting it (or the composition) must be under an `@AndroidEntryPoint` component. This seamless ViewModel support is a big part of why Hilt is the standard Android DI choice.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is @InstallIn and why is it needed?",
    a: [
      {
        t: "p",
        text: "**`@InstallIn(Component::class)` on a Hilt module declares *which Hilt component (and therefore which scope/lifecycle) the module's bindings belong to*.** Since Hilt has a predefined set of components tied to Android lifecycles (SingletonComponent for the app, ViewModelComponent for a ViewModel, ActivityComponent for an Activity, etc.), every module must say where it installs, so Hilt knows the lifetime and availability of the dependencies it provides.",
      },
      {
        t: "code",
        title: "Installing a module into the app-level component",
        code: `@Module
@InstallIn(SingletonComponent::class)   // these bindings live app-wide
object NetworkModule {
    @Provides @Singleton
    fun provideRetrofit(): Retrofit = ...
}`,
      },
      {
        t: "p",
        text: "It's needed because in plain Dagger you'd manually attach a module to a specific `@Component` you defined; Hilt replaces that with `@InstallIn` pointing at one of its standard components. The choice determines *where the dependency is available and how long it lives*: `@InstallIn(SingletonComponent::class)` makes bindings available app-wide (for app-scoped things like Retrofit, the database, repositories — the common case); `@InstallIn(ViewModelComponent::class)` makes them available only within ViewModels; and so on. The `@InstallIn` component must be consistent with any scope annotation you use — a `@Singleton` binding must be in a module installed in `SingletonComponent`. So `@InstallIn` is how you tell Hilt 'these dependencies belong to this lifecycle', which is the Hilt-simplified version of Dagger's manual component assignment.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you inject two different instances of the same type (e.g. two OkHttpClients)?",
    a: [
      {
        t: "p",
        text: "**You use *qualifiers* — custom annotations that distinguish bindings of the same type, so Hilt/Dagger knows which one you want at each injection site.** By type alone, Dagger can't tell two `OkHttpClient`s apart (one authenticated, one public) — it sees two bindings for the same type, which is ambiguous and a compile error. A qualifier annotation resolves the ambiguity.",
      },
      {
        t: "code",
        title: "Qualifiers for same-type bindings",
        code: `@Qualifier annotation class AuthClient
@Qualifier annotation class PublicClient

@Module @InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides @AuthClient
    fun authClient(): OkHttpClient = OkHttpClient.Builder().addInterceptor(authInterceptor).build()

    @Provides @PublicClient
    fun publicClient(): OkHttpClient = OkHttpClient.Builder().build()
}

// Request the specific one by its qualifier
class ApiRepo @Inject constructor(@AuthClient private val client: OkHttpClient)`,
      },
      {
        t: "list",
        items: [
          "**Define a `@Qualifier` annotation** for each variant, mark each `@Provides` method with a different qualifier, and annotate the injection site (constructor parameter) with the qualifier for the one you want. Now Hilt knows exactly which binding to use.",
          "**Common real cases**: two HTTP clients (authenticated vs public/refresh), two dispatchers (`@IoDispatcher` vs `@DefaultDispatcher` — a very common pattern for injecting `CoroutineDispatcher`s testably), a base URL and an API key (both `String`), or different database instances.",
          "**Built-in qualifiers**: Hilt provides `@ApplicationContext` and `@ActivityContext` so you can inject the correct `Context` — this is important for avoiding leaks (inject `@ApplicationContext` into long-lived objects like repositories, never an Activity context).",
          "**Alternative for grouping — `@Named`**: Hilt also has a built-in `@Named(\"...\")` string qualifier, but custom `@Qualifier` annotations are preferred (type-safe, refactorable, no string typos).",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: qualifiers solve the 'multiple bindings, same type' problem that arises constantly in real apps — dispatchers, HTTP clients, contexts, config strings. Without them, Hilt fails the build (which is actually good — it forces you to be explicit rather than silently picking one). The idiomatic approach is custom type-safe `@Qualifier` annotations, and knowing the built-in `@ApplicationContext`/`@ActivityContext` (and using the right one to avoid context leaks) shows practical Hilt fluency. This is also a favorite question because it reveals whether someone has used Hilt beyond the trivial single-instance case.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Hilt work with dynamic feature modules or WorkManager, and what are the gotchas?",
    a: [
      {
        t: "p",
        text: "**Hilt integrates smoothly with most Android components, but two areas have specific gotchas: WorkManager (needs a special integration for injecting Workers) and dynamic feature modules (which invert Hilt's normal dependency direction and can't use standard `@AndroidEntryPoint`).**",
      },
      {
        t: "list",
        items: [
          "**WorkManager — `@HiltWorker` + custom factory**: a `Worker` is instantiated by the WorkManager framework, not by you, so you can't just `@Inject constructor` it normally. Hilt provides `@HiltWorker` and `@AssistedInject` — you annotate the worker `@HiltWorker`, use `@AssistedInject constructor` with `@Assisted` for the framework-provided `Context` and `WorkerParameters`, and your real dependencies as normal parameters. You also configure a `HiltWorkerFactory` in the WorkManager initialization (disabling the default initializer and providing Hilt's factory). Once set up, workers get their dependencies injected. The gotcha is the extra setup — forgetting the factory configuration means injection silently fails.",
          "**Dynamic feature modules — the graph is inverted**: normally Hilt's components flow app → feature (the app depends on features' code at compile time, so Hilt can aggregate their bindings). But a *dynamic feature module* depends *on* the app module (the reverse), so at compile time the app can't see the dynamic module's Hilt code — meaning **you can't use `@AndroidEntryPoint`/standard Hilt injection in a dynamic feature module**, because Hilt's aggregation can't reach it.",
          "**The workaround for dynamic features — `@EntryPoint`**: you define an `@EntryPoint` interface (installed in the appropriate component) listing the dependencies the dynamic module needs, and retrieve them at runtime via `EntryPointAccessors.fromApplication(context, MyEntryPoint::class.java)`. This is a manual, reflection-like accessor rather than clean field injection — clunky by design, because you're pulling from a graph the module can't participate in normally.",
          "**Other `@EntryPoint` uses**: the same mechanism is needed anywhere Hilt can't reach with `@AndroidEntryPoint` — content providers (which initialize very early), or accessing Hilt dependencies from a class the framework instantiates in a way Hilt doesn't support.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: Hilt covers the common Android components (Activities, Fragments, Services, ViewModels, and — with `@HiltWorker` — WorkManager) cleanly, but its *compile-time aggregation* model means it struggles when the dependency direction is inverted (dynamic features depending on the app) or when a class is created by a framework in an unsupported way. The escape hatch is `@EntryPoint` + `EntryPointAccessors`, which lets you *reach into* a Hilt component from code Hilt can't inject into directly. Knowing that dynamic feature modules can't use `@AndroidEntryPoint` (and why — the inverted graph) and that `@HiltWorker` + a factory is needed for WorkManager are the two gotchas that separate someone who's used Hilt on a real, multi-module app from someone who's only done the basic single-module setup. It's also a reason some heavily-dynamic apps consider Koin, whose runtime resolution doesn't care about compile-time graph direction.",
      },
    ],
  },
];

export default qa;
