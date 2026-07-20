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
  {
    level: "junior",
    q: "What does @HiltAndroidApp do?",
    a: [
      {
        t: "p",
        text: "`@HiltAndroidApp` on your `Application` class triggers Hilt's code generation — it creates the application-level DI component (the root of the dependency graph) and a base `Application` that attaches it. It's the mandatory entry point: every Hilt app needs it, and it enables field injection in other Android classes.",
      },
      {
        t: "code",
        title: "@HiltAndroidApp",
        code: `@HiltAndroidApp
class MyApp : Application()`,
      },
      {
        t: "list",
        items: [
          "**On the `Application`** — generates the app-level component (graph root).",
          "**Mandatory** — every Hilt app needs it.",
          "**Enables injection** — into `@AndroidEntryPoint` classes.",
          "**Register in manifest** — `android:name=\".MyApp\"`.",
        ],
      },
      {
        t: "note",
        text: "@HiltAndroidApp on the Application class generates Hilt's application-level DI component (the graph root) and wiring — mandatory for every Hilt app, and it enables field injection into @AndroidEntryPoint classes. Register the Application in the manifest.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does @AndroidEntryPoint do?",
    a: [
      {
        t: "p",
        text: "`@AndroidEntryPoint` on an Android class (Activity, Fragment, Service, BroadcastReceiver, View) tells Hilt to *inject dependencies* into it — Hilt generates a component tied to that class's lifecycle and populates its `@Inject` fields. Without it, field injection into that class won't happen. Its container class must also be annotated (a `@AndroidEntryPoint` Fragment needs its Activity annotated too).",
      },
      {
        t: "code",
        title: "@AndroidEntryPoint",
        code: `@AndroidEntryPoint
class HomeFragment : Fragment() {
    @Inject lateinit var analytics: Analytics   // injected by Hilt
    private val viewModel: HomeViewModel by viewModels()   // Hilt-provided
}`,
      },
      {
        t: "list",
        items: [
          "**On Android classes** — Activity/Fragment/Service/Receiver/View.",
          "**Enables field injection** — populates `@Inject` fields.",
          "**Lifecycle-scoped component** — generated per class.",
          "**Container must be annotated** — Fragment needs its Activity annotated.",
        ],
      },
      {
        t: "note",
        text: "@AndroidEntryPoint marks an Android class (Activity/Fragment/Service/Receiver/View) for Hilt injection — it generates a lifecycle-scoped component and populates @Inject fields. Required for field injection into that class; the container must also be annotated (a Fragment's host Activity needs it too).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is @HiltViewModel, and how are ViewModels provided?",
    a: [
      {
        t: "p",
        text: "`@HiltViewModel` lets you *constructor-inject* a ViewModel — Hilt generates the `ViewModelProvider.Factory` so you can request it with `by viewModels()`/`hiltViewModel()` and get its dependencies injected (including `SavedStateHandle`). This replaces writing a manual ViewModel factory for each ViewModel with dependencies.",
      },
      {
        t: "code",
        title: "@HiltViewModel",
        code: `@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repo: Repository,
    private val handle: SavedStateHandle,   // provided automatically
) : ViewModel()`,
      },
      {
        t: "list",
        items: [
          "**Constructor-inject the ViewModel** — deps as params.",
          "**Generated factory** — `by viewModels()`/`hiltViewModel()` just work.",
          "**`SavedStateHandle`** — injected automatically.",
          "**No manual factory** — Hilt writes it.",
        ],
      },
      {
        t: "note",
        text: "@HiltViewModel enables constructor injection of a ViewModel — Hilt generates the ViewModelProvider.Factory, so by viewModels()/hiltViewModel() supply its dependencies (including SavedStateHandle automatically). Replaces writing a manual factory per ViewModel.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the Hilt component hierarchy?",
    a: [
      {
        t: "p",
        text: "Hilt predefines a hierarchy of components tied to Android lifecycles: `SingletonComponent` (Application), `ActivityRetainedComponent` (survives config change), `ViewModelComponent` (a ViewModel), `ActivityComponent`, `FragmentComponent`, `ViewComponent`, `ServiceComponent`. A binding installed in a component is available to it and its children. This lets you scope dependencies to the right lifetime.",
      },
      {
        t: "list",
        items: [
          "**`SingletonComponent`** — app lifetime.",
          "**`ActivityRetainedComponent`** — survives config change (like a ViewModel).",
          "**`ViewModelComponent`** — a ViewModel's lifetime.",
          "**`Activity`/`Fragment`/`View`/`ServiceComponent`** — those lifecycles.",
        ],
      },
      {
        t: "note",
        text: "Hilt's component hierarchy maps to Android lifecycles: SingletonComponent (Application) → ActivityRetainedComponent (survives config change) → ViewModelComponent, ActivityComponent → FragmentComponent → ViewComponent, plus ServiceComponent. Bindings installed in a component are available to it and its children — scope deps to the right lifetime.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are Hilt's predefined scopes?",
    a: [
      {
        t: "p",
        text: "Each component has a scope annotation that makes a binding a *single instance* within that component: `@Singleton` (app-wide), `@ActivityRetainedScoped` (survives config change), `@ViewModelScoped` (per ViewModel), `@ActivityScoped`, `@FragmentScoped`, `@ViewScoped`, `@ServiceScoped`. An unscoped binding creates a new instance per injection. Scope to match the dependency's intended lifetime.",
      },
      {
        t: "list",
        items: [
          "**`@Singleton`** — one app-wide instance.",
          "**`@ActivityRetainedScoped`** — survives config change.",
          "**`@ViewModelScoped`** — one per ViewModel.",
          "**`@ActivityScoped`/etc.** — per that lifecycle; unscoped = new each time.",
        ],
      },
      {
        t: "note",
        text: "Hilt scopes make a binding a single instance within a component: @Singleton (app), @ActivityRetainedScoped (survives config change), @ViewModelScoped, @ActivityScoped/@FragmentScoped/@ViewScoped/@ServiceScoped. Unscoped = new instance per injection. Scope to the dependency's intended lifetime.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you write a Hilt module with @Provides?",
    a: [
      {
        t: "p",
        text: "A `@Module @InstallIn(component)` object with `@Provides` functions tells Hilt how to create dependencies it can't construct directly — like third-party classes (Retrofit, Room) or interfaces. Each `@Provides` function's parameters are themselves injected. Add a scope annotation to make the provided instance scoped.",
      },
      {
        t: "code",
        title: "@Provides module",
        code: `@Module @InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides @Singleton
    fun provideRetrofit(client: OkHttpClient): Retrofit =
        Retrofit.Builder().baseUrl(BASE_URL).client(client).build()
}`,
      },
      {
        t: "list",
        items: [
          "**`@Module @InstallIn`** — where the bindings live.",
          "**`@Provides`** — construct a dependency; params are injected.",
          "**Scope** — `@Singleton` etc. for a single instance.",
          "**Use for** — third-party classes and interfaces you can't `@Inject`.",
        ],
      },
      {
        t: "note",
        text: "A @Module @InstallIn(component) with @Provides functions tells Hilt how to create dependencies it can't construct (third-party classes like Retrofit/Room, or interfaces); each function's params are injected. Add a scope annotation (@Singleton) for a single instance.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you use @Binds in a Hilt module, and why prefer it for interfaces?",
    a: [
      {
        t: "p",
        text: "`@Binds` maps an interface to its implementation efficiently — in an *abstract* module (or interface), an abstract function takes the implementation and returns the interface. Prefer `@Binds` over `@Provides` for interface bindings because it generates *less code* (no factory method body) and is more efficient — Hilt just knows to substitute the implementation.",
      },
      {
        t: "code",
        title: "@Binds",
        code: `@Module @InstallIn(SingletonComponent::class)
abstract class RepoModule {
    @Binds abstract fun bindRepo(impl: RepositoryImpl): Repository
}`,
      },
      {
        t: "list",
        items: [
          "**`@Binds`** — interface → implementation; abstract function.",
          "**Efficient** — less generated code than `@Provides`.",
          "**Impl must be `@Inject`-constructable** — Hilt builds it.",
          "**Abstract module** — `@Binds` requires an abstract class/interface.",
        ],
      },
      {
        t: "note",
        text: "@Binds maps an interface to its (constructor-injectable) implementation via an abstract function in an abstract module — prefer it over @Provides for interfaces because it generates less code (no factory body). The implementation must be @Inject-constructable.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are @ApplicationContext and @ActivityContext?",
    a: [
      {
        t: "p",
        text: "Hilt provides the `Context` via two built-in qualifiers: `@ApplicationContext` (the application context — for long-lived dependencies, safe to retain) and `@ActivityContext` (the Activity context — for UI/theme-dependent needs, not retained). Inject the right one to avoid leaks (long-lived deps must use the application context).",
      },
      {
        t: "code",
        title: "Context qualifiers",
        code: `class Analytics @Inject constructor(
    @ApplicationContext private val context: Context,   // long-lived, safe
)`,
      },
      {
        t: "list",
        items: [
          "**`@ApplicationContext`** — app context; long-lived, retainable.",
          "**`@ActivityContext`** — Activity context; UI/theme, not retained.",
          "**Avoid leaks** — long-lived deps use the application context.",
          "**Predefined** — Hilt provides these qualifiers.",
        ],
      },
      {
        t: "note",
        text: "Hilt's built-in qualifiers: @ApplicationContext (app context — long-lived deps, safe to retain) and @ActivityContext (Activity context — UI/theme needs, don't retain). Inject the right one; long-lived dependencies must use @ApplicationContext to avoid leaking an Activity.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you inject dependencies into a WorkManager Worker?",
    a: [
      {
        t: "p",
        text: "Use `@HiltWorker` on the Worker with an `@AssistedInject` constructor — the `Context` and `WorkerParameters` are `@Assisted` (provided by WorkManager at runtime), and your dependencies are injected by Hilt. You also configure a custom `WorkerFactory` (via `HiltWorkerFactory`) in the Application's `Configuration.Provider`.",
      },
      {
        t: "code",
        title: "@HiltWorker",
        code: `@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val repo: Repository,          // injected by Hilt
) : CoroutineWorker(context, params)
// Application implements Configuration.Provider using HiltWorkerFactory`,
      },
      {
        t: "list",
        items: [
          "**`@HiltWorker` + `@AssistedInject`** — Hilt injects a Worker.",
          "**`@Assisted`** — Context/WorkerParameters from WorkManager.",
          "**`HiltWorkerFactory`** — configured in `Configuration.Provider`.",
          "**Injected deps** — repositories/etc. as normal.",
        ],
      },
      {
        t: "note",
        text: "Inject into a Worker with @HiltWorker + @AssistedInject: Context and WorkerParameters are @Assisted (from WorkManager), your dependencies injected by Hilt. Configure HiltWorkerFactory in the Application's Configuration.Provider (and disable WorkManager's default initializer).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is @EntryPoint, and when do you need it?",
    a: [
      {
        t: "p",
        text: "`@EntryPoint` lets *non-Hilt* code access the Hilt graph — for classes Hilt doesn't support directly (a `ContentProvider`, or code in a library/module without `@AndroidEntryPoint`). You define an interface annotated `@EntryPoint @InstallIn(component)` with accessor methods, then retrieve it via `EntryPointAccessors`. It's an escape hatch to bridge Hilt with un-annotatable code.",
      },
      {
        t: "code",
        title: "@EntryPoint",
        code: `@EntryPoint @InstallIn(SingletonComponent::class)
interface AnalyticsEntryPoint { fun analytics(): Analytics }

val entryPoint = EntryPointAccessors.fromApplication(context, AnalyticsEntryPoint::class.java)
entryPoint.analytics().track("event")`,
      },
      {
        t: "list",
        items: [
          "**Access the graph from non-Hilt code** — ContentProviders, libraries.",
          "**`@EntryPoint` interface** — accessor methods, `@InstallIn`.",
          "**`EntryPointAccessors`** — retrieve it (from application/activity).",
          "**Escape hatch** — bridge Hilt with un-annotatable classes.",
        ],
      },
      {
        t: "note",
        text: "@EntryPoint bridges Hilt to non-Hilt code (ContentProviders, library classes without @AndroidEntryPoint): define an @EntryPoint @InstallIn interface with accessor methods, retrieve it via EntryPointAccessors.fromApplication/Activity. An escape hatch to access the graph from un-annotatable classes.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you write Hilt tests with @HiltAndroidTest, @BindValue, and @UninstallModules?",
    a: [
      {
        t: "p",
        text: "For instrumented tests, `@HiltAndroidTest` sets up the test graph, a `HiltAndroidRule` performs injection, and `@BindValue` binds a test double into the graph (replacing a real binding). `@UninstallModules` removes a production module so you can provide a test module instead. This lets tests substitute fakes throughout the DI graph.",
      },
      {
        t: "code",
        title: "Hilt test",
        code: `@HiltAndroidTest
@UninstallModules(NetworkModule::class)
class MyTest {
    @get:Rule val hiltRule = HiltAndroidRule(this)
    @BindValue val fakeRepo: Repository = FakeRepository()
    @Before fun setup() { hiltRule.inject() }
}`,
      },
      {
        t: "list",
        items: [
          "**`@HiltAndroidTest` + `HiltAndroidRule`** — test graph + injection.",
          "**`@BindValue`** — bind a test double into the graph.",
          "**`@UninstallModules`** — remove a production module.",
          "**Substitute fakes** — throughout the DI graph.",
        ],
      },
      {
        t: "note",
        text: "Hilt tests: @HiltAndroidTest + HiltAndroidRule (test graph + inject()), @BindValue to bind a test double into the graph, @UninstallModules to remove a production module (replace with a test module). Lets you substitute fakes throughout the DI graph for instrumented tests.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you get a Hilt ViewModel in Compose?",
    a: [
      {
        t: "p",
        text: "Use `hiltViewModel()` (from `androidx.hilt:hilt-navigation-compose`) inside a composable — it retrieves the `@HiltViewModel` scoped to the current nav back-stack entry (or Activity), with dependencies injected. For a graph-scoped shared ViewModel, pass the parent back-stack entry.",
      },
      {
        t: "code",
        title: "hiltViewModel()",
        code: `@Composable fun HomeScreen() {
    val viewModel: HomeViewModel = hiltViewModel()   // Hilt-provided, scoped to the entry
}`,
      },
      {
        t: "list",
        items: [
          "**`hiltViewModel()`** — Hilt-provided ViewModel in Compose.",
          "**Scoped to the nav entry** — or Activity.",
          "**Requires** — `@HiltViewModel` + `@AndroidEntryPoint` Activity.",
          "**Shared** — pass a parent back-stack entry for a graph-scoped VM.",
        ],
      },
      {
        t: "note",
        text: "Use hiltViewModel() (hilt-navigation-compose) in a composable — it provides the @HiltViewModel scoped to the current nav back-stack entry (or Activity) with deps injected. Requires @HiltViewModel + an @AndroidEntryPoint Activity. Pass a parent entry for a graph-scoped shared ViewModel.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Hilt reduce Dagger boilerplate?",
    a: [
      {
        t: "p",
        text: "Plain Dagger makes you *define components*, *component interfaces*, *manage their lifecycles*, and *wire injection* into Android classes manually. Hilt *predefines* the standard Android components and scopes, *generates* the component classes, and *handles* injecting Android classes (`@AndroidEntryPoint`) and ViewModels (`@HiltViewModel`) — so you just write modules and annotations. It's opinionated Dagger for Android, removing the repetitive component plumbing.",
      },
      {
        t: "list",
        items: [
          "**Predefined components/scopes** — no manual component definitions.",
          "**Generated wiring** — Hilt creates the components and injectors.",
          "**Android integration** — `@AndroidEntryPoint`/`@HiltViewModel` built in.",
          "**You write** — modules + annotations, not component plumbing.",
        ],
      },
      {
        t: "note",
        text: "Plain Dagger requires defining components, their interfaces, lifecycles, and manual Android injection. Hilt predefines standard Android components/scopes, generates the component classes, and handles injecting Android classes (@AndroidEntryPoint) and ViewModels (@HiltViewModel) — so you just write modules + annotations. Opinionated Dagger for Android.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you choose which component to @InstallIn?",
    a: [
      {
        t: "p",
        text: "Install a module in the component matching where the dependency should be *available* and *scoped*. `SingletonComponent` for app-wide singletons (repositories, Retrofit, database); `ViewModelComponent` for ViewModel-scoped things; `ActivityComponent` for Activity-lifecycle dependencies. Installing too high (Singleton for everything) can over-retain; too low limits availability. Match availability + lifetime.",
      },
      {
        t: "list",
        items: [
          "**`SingletonComponent`** — app-wide (repos, network, DB).",
          "**`ViewModelComponent`** — ViewModel-scoped deps.",
          "**`ActivityComponent`** — Activity-lifecycle deps.",
          "**Match** — availability + intended lifetime; don't over-scope.",
        ],
      },
      {
        t: "note",
        text: "Install a module in the component matching where the dependency should be available/scoped: SingletonComponent (app-wide singletons — repos/network/DB), ViewModelComponent (ViewModel-scoped), ActivityComponent (Activity lifecycle). Don't install everything in Singleton (over-retention); match availability + lifetime.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you provide different bindings for debug versus release?",
    a: [
      {
        t: "p",
        text: "Put build-variant-specific modules in the corresponding source sets (`src/debug`, `src/release`), each providing the same binding differently (e.g. a real vs a fake/mock implementation, or different config). Gradle compiles the right one per variant. Alternatively, use a `BuildConfig` flag inside a shared module's `@Provides`. This lets debug builds use test servers/loggers without affecting release.",
      },
      {
        t: "list",
        items: [
          "**Variant source sets** — `src/debug`/`src/release` modules.",
          "**Same binding, different impl** — real vs fake/config per variant.",
          "**Or `BuildConfig` flag** — branch inside a shared `@Provides`.",
          "**Uses** — debug loggers/test servers/mock data.",
        ],
      },
      {
        t: "note",
        text: "Provide variant-specific bindings by placing modules in src/debug and src/release source sets (each providing the same type differently — real vs fake, different config); Gradle picks per variant. Or branch on a BuildConfig flag in a shared @Provides. Lets debug use test servers/loggers without affecting release.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Hilt handle a ViewModel's SavedStateHandle and process death?",
    a: [
      {
        t: "p",
        text: "Hilt automatically provides `SavedStateHandle` to a `@HiltViewModel`'s constructor — you just declare it as a parameter. This gives the ViewModel access to saved state that survives process death (the ids/inputs you store there), combining Hilt's DI with process-death resilience. No extra factory or wiring is needed; Hilt integrates with the ViewModel's `SavedStateHandle`.",
      },
      {
        t: "code",
        title: "SavedStateHandle injection",
        code: `@HiltViewModel
class DetailViewModel @Inject constructor(
    private val repo: Repository,
    savedStateHandle: SavedStateHandle,   // survives process death; Hilt provides it
) : ViewModel() {
    private val id: String = savedStateHandle["id"]!!
}`,
      },
      {
        t: "list",
        items: [
          "**Auto-provided** — declare `SavedStateHandle` as a constructor param.",
          "**Process-death survival** — saved state restores after a kill.",
          "**DI + resilience** — Hilt deps + SavedStateHandle together.",
          "**No extra wiring** — Hilt integrates it.",
        ],
      },
      {
        t: "note",
        text: "Hilt auto-provides SavedStateHandle to a @HiltViewModel constructor — just declare it as a parameter. It gives the ViewModel process-death-surviving saved state (ids/inputs), combining Hilt DI with resilience, no extra factory/wiring needed.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are common Hilt errors, and how do you fix them?",
    a: [
      {
        t: "p",
        text: "Frequent build errors: *missing binding* ('cannot be provided without an @Inject constructor or @Provides') — add a `@Provides`/`@Binds` or `@Inject` constructor; *wrong component* — a binding installed in a lower component than where it's injected; *missing `@AndroidEntryPoint`* — field injection into an un-annotated class; *missing `@HiltAndroidApp`*; and *scope mismatch* (a scoped binding in the wrong component). Read the error — Hilt's messages usually name the missing type and location.",
      },
      {
        t: "list",
        items: [
          "**Missing binding** — add `@Provides`/`@Binds`/`@Inject`.",
          "**Wrong `@InstallIn`** — binding not available where injected.",
          "**Missing `@AndroidEntryPoint`/`@HiltAndroidApp`** — no injection setup.",
          "**Scope mismatch** — scoped binding in the wrong component.",
        ],
      },
      {
        t: "note",
        text: "Common Hilt errors: missing binding ('cannot be provided...' — add @Provides/@Binds/@Inject), wrong @InstallIn component (not available where injected), missing @AndroidEntryPoint/@HiltAndroidApp, scope mismatch. Hilt's compile errors usually name the missing type and location — read them.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is @ActivityRetainedScoped, and how does it differ from @Singleton?",
    a: [
      {
        t: "p",
        text: "`@ActivityRetainedScoped` (in `ActivityRetainedComponent`) makes a binding a single instance that *survives configuration changes* but is *scoped to the Activity* (cleared when the Activity truly finishes) — the same lifetime as a ViewModel. `@Singleton` lives for the *whole app*. Use `@ActivityRetainedScoped` for state that should be shared across a screen's config changes but not app-wide.",
      },
      {
        t: "list",
        items: [
          "**`@ActivityRetainedScoped`** — survives config change; cleared on Activity finish (ViewModel-like).",
          "**`@Singleton`** — app lifetime.",
          "**Use retained** — per-screen state across rotation, not app-wide.",
          "**Component** — `ActivityRetainedComponent` vs `SingletonComponent`.",
        ],
      },
      {
        t: "note",
        text: "@ActivityRetainedScoped (ActivityRetainedComponent) is a single instance surviving config changes but scoped to the Activity (cleared on true finish — ViewModel lifetime); @Singleton lives for the whole app. Use retained scope for per-screen state that survives rotation but isn't app-wide.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the minimal setup to add Hilt to an app?",
    a: [
      {
        t: "p",
        text: "Add the Hilt Gradle plugin and dependencies (with KSP/kapt), annotate the `Application` with `@HiltAndroidApp`, annotate Android classes that need injection with `@AndroidEntryPoint`, mark ViewModels `@HiltViewModel`, and create `@Module @InstallIn` classes with `@Provides`/`@Binds` for dependencies Hilt can't construct. Then constructor/field injection works throughout.",
      },
      {
        t: "list",
        items: [
          "**Plugin + deps** — Hilt Gradle plugin, KSP/kapt.",
          "**`@HiltAndroidApp`** — on the Application.",
          "**`@AndroidEntryPoint`/`@HiltViewModel`** — on Android classes/ViewModels.",
          "**Modules** — `@Provides`/`@Binds` for un-constructable deps.",
        ],
      },
      {
        t: "note",
        text: "Hilt setup: add the plugin + deps (KSP/kapt), @HiltAndroidApp on the Application, @AndroidEntryPoint on injected Android classes, @HiltViewModel on ViewModels, and @Module @InstallIn classes with @Provides/@Binds for un-constructable dependencies. Then injection works throughout.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you migrate from manual Dagger to Hilt?",
    a: [
      {
        t: "p",
        text: "Migrate incrementally: add Hilt, annotate the `Application` `@HiltAndroidApp`, then convert your existing Dagger modules to `@InstallIn` the appropriate Hilt components (reusing the `@Provides`/`@Binds`), replace manual component injection with `@AndroidEntryPoint`, and convert ViewModel factories to `@HiltViewModel`. Hilt can coexist with custom Dagger components during the transition via `@EntryPoint`/`@DefineComponent`.",
      },
      {
        t: "list",
        items: [
          "**Add `@HiltAndroidApp`** — the entry point.",
          "**Reuse modules** — add `@InstallIn` to existing `@Provides`/`@Binds`.",
          "**Replace injection** — `@AndroidEntryPoint`, `@HiltViewModel`.",
          "**Coexist** — `@EntryPoint`/custom components during transition.",
        ],
      },
      {
        t: "note",
        text: "Migrate to Hilt incrementally: @HiltAndroidApp on the Application, add @InstallIn to existing Dagger modules (reuse @Provides/@Binds), replace manual injection with @AndroidEntryPoint, convert ViewModel factories to @HiltViewModel. Hilt coexists with custom Dagger components via @EntryPoint/@DefineComponent during the transition.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you do assisted injection with Hilt?",
    a: [
      {
        t: "p",
        text: "For a class needing both DI-provided and *runtime* parameters, use `@AssistedInject` with `@Assisted` on the runtime params and an `@AssistedFactory` interface — Hilt generates the factory, which you can then inject. Common for objects that need a runtime id along with injected dependencies (though ViewModels usually use `SavedStateHandle` instead).",
      },
      {
        t: "code",
        title: "Assisted injection in Hilt",
        code: `class ImageLoader @AssistedInject constructor(
    private val cache: Cache,               // injected
    @Assisted private val config: Config,   // runtime
)
@AssistedFactory interface ImageLoaderFactory { fun create(config: Config): ImageLoader }`,
      },
      {
        t: "list",
        items: [
          "**`@AssistedInject` + `@Assisted`** — mix injected + runtime params.",
          "**`@AssistedFactory`** — generated factory you inject.",
          "**Uses** — objects needing a runtime arg + dependencies.",
          "**ViewModels** — often use SavedStateHandle for the runtime id.",
        ],
      },
      {
        t: "note",
        text: "Hilt assisted injection: @AssistedInject constructor with @Assisted on runtime params + an @AssistedFactory interface Hilt generates and you inject. For objects needing a runtime arg alongside injected deps. ViewModels usually use SavedStateHandle for the runtime id instead.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you inject dependencies into a Service or BroadcastReceiver?",
    a: [
      {
        t: "p",
        text: "Annotate the `Service` or `BroadcastReceiver` with `@AndroidEntryPoint` and use field injection (`@Inject lateinit var`). Hilt generates a `ServiceComponent`/handles the receiver and populates the fields. For a receiver, Hilt injects in `onReceive`; ensure the receiver isn't doing long work there. This is the same pattern as Activities/Fragments.",
      },
      {
        t: "code",
        title: "@AndroidEntryPoint Service",
        code: `@AndroidEntryPoint
class SyncService : Service() {
    @Inject lateinit var repo: Repository   // injected by Hilt
}`,
      },
      {
        t: "list",
        items: [
          "**`@AndroidEntryPoint`** — on the Service/Receiver.",
          "**Field injection** — `@Inject lateinit var`.",
          "**`ServiceComponent`** — for service-scoped deps.",
          "**Receiver** — injected in `onReceive`; keep it fast.",
        ],
      },
      {
        t: "note",
        text: "Inject into a Service/BroadcastReceiver by annotating it @AndroidEntryPoint and using field injection (@Inject lateinit var) — Hilt generates the ServiceComponent/handles the receiver. Receivers are injected in onReceive (keep it fast). Same pattern as Activities/Fragments.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you provide a coroutine dispatcher or scope via Hilt?",
    a: [
      {
        t: "p",
        text: "Provide dispatchers through a module with qualifiers so they're injectable and swappable in tests. Define `@Qualifier` annotations (`@IoDispatcher`, `@DefaultDispatcher`) and `@Provides` each; also provide an application-scoped `CoroutineScope` for app-lifetime work. Then repositories inject the dispatcher instead of hardcoding `Dispatchers.IO`, enabling test dispatchers.",
      },
      {
        t: "code",
        title: "Dispatcher module",
        code: `@Qualifier annotation class IoDispatcher
@Module @InstallIn(SingletonComponent::class)
object DispatchersModule {
    @Provides @IoDispatcher fun io(): CoroutineDispatcher = Dispatchers.IO
    @Provides @Singleton fun appScope(@IoDispatcher d: CoroutineDispatcher) =
        CoroutineScope(SupervisorJob() + d)
}`,
      },
      {
        t: "list",
        items: [
          "**Qualified dispatchers** — `@IoDispatcher`/`@DefaultDispatcher` `@Provides`.",
          "**Inject, don't hardcode** — repos take the dispatcher.",
          "**App scope** — provide a `@Singleton CoroutineScope` for app-lifetime work.",
          "**Testable** — swap a test dispatcher via `@BindValue`/test module.",
        ],
      },
      {
        t: "note",
        text: "Provide dispatchers via a module with @Qualifier annotations (@IoDispatcher/@DefaultDispatcher @Provides), plus a @Singleton application CoroutineScope. Repositories inject the dispatcher instead of hardcoding Dispatchers.IO — enabling a test dispatcher in tests (via @BindValue/test module).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you provide a dependency that itself depends on multiple others?",
    a: [
      {
        t: "p",
        text: "Just declare the dependencies as *parameters* of the `@Provides` function (or the `@Inject` constructor) — Hilt resolves and injects each of them transitively. You never construct the dependency graph manually; Hilt builds it. As long as each parameter is itself provided (via `@Provides`/`@Binds`/`@Inject`), Hilt wires the whole chain.",
      },
      {
        t: "code",
        title: "Transitive provides",
        code: `@Provides @Singleton
fun provideRepo(api: Api, dao: UserDao, dispatcher: CoroutineDispatcher): Repository =
    RepositoryImpl(api, dao, dispatcher)   // Hilt injects api, dao, dispatcher
`,
      },
      {
        t: "list",
        items: [
          "**Params are injected** — `@Provides`/constructor parameters resolved transitively.",
          "**No manual wiring** — Hilt builds the graph.",
          "**Each must be provided** — via `@Provides`/`@Binds`/`@Inject`.",
          "**Chain resolved** — the whole dependency tree assembled.",
        ],
      },
      {
        t: "note",
        text: "Declare the sub-dependencies as parameters of the @Provides function or @Inject constructor — Hilt resolves and injects each transitively, building the whole graph. You never wire it manually; as long as every parameter is itself provided (@Provides/@Binds/@Inject), Hilt assembles the chain.",
      },
    ],
  },
];

export default qa;
