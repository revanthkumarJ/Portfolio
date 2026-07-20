// Hilt (Android DI) — Content tab. Teaching-first.

const content = [
  {
    heading: "What Hilt is",
    blocks: [
      {
        t: "p",
        text: "**Hilt** is Google's recommended dependency injection library for Android — it's a layer built *on top of Dagger* that removes most of Dagger's boilerplate and adds Android-specific integration. Where Dagger makes you define and manage components, subcomponents, scopes, and their lifecycles by hand, Hilt provides a *standard set of components already wired to Android lifecycles* (Application, Activity, Fragment, ViewModel, Service). You just declare how to provide dependencies and where to inject them; Hilt generates and manages all the component code. It keeps Dagger's compile-time safety (missing dependencies = build errors, no reflection) while being far easier to use.",
      },
    ],
  },
  {
    heading: "The basic setup",
    blocks: [
      {
        t: "code",
        title: "The four things you need",
        code: `// 1) Annotate the Application — Hilt generates the app-level component
@HiltAndroidApp
class MyApp : Application()

// 2) Annotate Android entry points — Hilt can inject into them
@AndroidEntryPoint
class MainActivity : AppCompatActivity() {
    @Inject lateinit var analytics: Analytics    // field injection (framework-created)
}

// 3) Your own classes use @Inject constructor
class UserRepository @Inject constructor(private val api: UserApi)

// 4) Modules for types you can't construct (interfaces, libraries)
@Module
@InstallIn(SingletonComponent::class)             // which scope/component
object NetworkModule {
    @Provides @Singleton
    fun provideRetrofit(): Retrofit = Retrofit.Builder().baseUrl("...").build()
}`,
      },
      {
        t: "list",
        items: [
          "**`@HiltAndroidApp`** on your Application class — bootstraps Hilt and generates the app-level (`SingletonComponent`) dependency container. Required, and it's the root.",
          "**`@AndroidEntryPoint`** on Activities, Fragments, Services, BroadcastReceivers, Views — tells Hilt it can inject into them (via field injection, since the framework creates them). Without it, injection into that component fails.",
          "**`@Inject constructor`** on your own classes — same as Dagger; Hilt constructs them and provides their dependencies.",
          "**`@Module` + `@InstallIn`** — modules work like Dagger, but `@InstallIn(component)` tells Hilt which of its predefined components (scope) the bindings belong to. No manual `@Component` — that's the boilerplate Hilt removes.",
        ],
      },
    ],
  },
  {
    heading: "Hilt components and scopes",
    blocks: [
      {
        t: "p",
        text: "Hilt provides a fixed hierarchy of **components**, each tied to an Android lifecycle, and each with a matching **scope** annotation. You pick which component a module installs into (and which scope to use) based on the lifetime you want.",
      },
      {
        t: "table",
        headers: ["Component", "Scope annotation", "Lifetime"],
        rows: [
          ["SingletonComponent", "@Singleton", "the whole application"],
          ["ActivityRetainedComponent", "@ActivityRetainedScoped", "across config changes (like ViewModel)"],
          ["ViewModelComponent", "@ViewModelScoped", "one ViewModel"],
          ["ActivityComponent", "@ActivityScoped", "one Activity"],
          ["FragmentComponent", "@FragmentScoped", "one Fragment"],
          ["ServiceComponent", "@ServiceScoped", "one Service"],
        ],
      },
      {
        t: "list",
        items: [
          "**The hierarchy is nested**: Fragment ⊂ Activity ⊂ ActivityRetained ⊂ Singleton. A component can access dependencies from its parents (a Fragment-scoped thing can use Activity- and Singleton-scoped dependencies), but not children.",
          "**Choosing a scope**: `@Singleton` for app-wide shared resources (database, network, repositories); `@ViewModelScoped` for something shared within one ViewModel's dependencies; `@ActivityScoped` for something tied to one Activity. Unscoped (no annotation) = new instance each time.",
          "**`@InstallIn` matches the scope**: a `@Singleton` binding goes in a module `@InstallIn(SingletonComponent::class)`; a `@ViewModelScoped` binding goes in `@InstallIn(ViewModelComponent::class)`. The scope and component must correspond.",
        ],
      },
    ],
  },
  {
    heading: "ViewModel injection with Hilt",
    blocks: [
      {
        t: "p",
        text: "One of Hilt's best features is seamless **ViewModel injection** — a very common need. You annotate the ViewModel with `@HiltViewModel` and use `@Inject constructor`, and Hilt handles creating it with its dependencies (including `SavedStateHandle`), scoped correctly to the ViewModel's lifecycle.",
      },
      {
        t: "code",
        title: "Injecting a ViewModel",
        code: `@HiltViewModel
class UserViewModel @Inject constructor(
    private val repository: UserRepository,       // Hilt provides it
    private val savedStateHandle: SavedStateHandle, // Hilt provides it too
) : ViewModel()

// In a @AndroidEntryPoint Activity/Fragment:
private val viewModel: UserViewModel by viewModels()   // Hilt wires it up

// In Compose:
@Composable fun Screen(viewModel: UserViewModel = hiltViewModel()) { }`,
      },
      {
        t: "list",
        items: [
          "**`@HiltViewModel` + `@Inject constructor`** — Hilt generates the ViewModel factory, so `by viewModels()` (Views) or `hiltViewModel()` (Compose) automatically construct it with its injected dependencies.",
          "**`SavedStateHandle` is available for injection** — just add it as a constructor parameter and Hilt provides it, giving you access to navigation arguments and process-death survival with no extra wiring.",
          "**No manual factory** — before Hilt, injecting a ViewModel with constructor arguments required writing a `ViewModelProvider.Factory` by hand. Hilt generates it, which is a major convenience.",
        ],
      },
    ],
  },
  {
    heading: "Qualifiers, and injecting the same type twice",
    blocks: [
      {
        t: "p",
        text: "What if you need *two different instances of the same type* — two `OkHttpClient`s (one authenticated, one not), or two `String`s (a base URL and an API key)? Dagger/Hilt can't tell them apart by type alone. **Qualifiers** are annotations that distinguish bindings of the same type.",
      },
      {
        t: "code",
        title: "Qualifiers disambiguate same-type bindings",
        code: `@Qualifier annotation class AuthClient
@Qualifier annotation class PublicClient

@Module @InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides @AuthClient
    fun provideAuthClient(): OkHttpClient = OkHttpClient.Builder().addInterceptor(auth).build()

    @Provides @PublicClient
    fun providePublicClient(): OkHttpClient = OkHttpClient.Builder().build()
}

// Request the specific one with the qualifier:
class Repo @Inject constructor(@AuthClient private val client: OkHttpClient)`,
      },
      {
        t: "list",
        items: [
          "**`@Qualifier`** — you define a custom annotation, mark each provider with a different qualifier, and request the specific one at the injection site. This resolves the 'multiple bindings for the same type' ambiguity.",
          "**Built-in `@ApplicationContext` / `@ActivityContext`** — Hilt provides these qualifiers so you can inject the correct `Context` (app-scoped vs activity-scoped) — important for avoiding the context-leak issues (inject `@ApplicationContext` into long-lived objects).",
          "**Without a qualifier, duplicate bindings of the same type are a compile error** — Hilt (via Dagger) can't guess which you want, so it fails the build, prompting you to add qualifiers.",
        ],
      },
      {
        t: "note",
        text: "Hilt essentials: Dagger + standard Android components + less boilerplate. Setup: @HiltAndroidApp (Application), @AndroidEntryPoint (Activities/Fragments/Services), @Inject constructor (your classes), @Module + @InstallIn(component) (types you can't construct). Predefined components/scopes map to Android lifecycles (@Singleton, @ViewModelScoped, @ActivityScoped...). @HiltViewModel + hiltViewModel() gives seamless ViewModel injection with SavedStateHandle. Qualifiers (@Qualifier, @ApplicationContext) distinguish same-type bindings. Keeps compile-time safety.",
      },
    ],
  },
];

export default content;
