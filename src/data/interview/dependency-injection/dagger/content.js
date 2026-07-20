// Dagger Fundamentals — Content tab. Teaching-first.

const content = [
  {
    heading: "What Dagger is and its defining trait",
    blocks: [
      {
        t: "p",
        text: "**Dagger** is a dependency injection framework that generates the wiring code for you — but its defining trait is that it does so **at compile time**, using annotation processing. You annotate your classes and 'recipes' for providing dependencies, and Dagger *generates* the code that constructs your object graph *during the build*. This is fundamentally different from runtime DI (like Koin): if a dependency is missing or the graph has a cycle, you get a **compile error**, not a runtime crash — the correctness of your dependency graph is verified at build time.",
      },
      {
        t: "list",
        items: [
          "**Compile-time = safety + performance**: the graph is validated when you build (missing dependencies fail the build), and there's no runtime reflection (the generated code is plain, fast constructor calls).",
          "**Hilt is built on Dagger**: Hilt (the recommended Android DI) is a *layer on top of Dagger* that removes most of Dagger's boilerplate and provides Android-specific integration. Understanding Dagger's concepts explains what Hilt generates for you — which is exactly what interviewers probe.",
          "**The trade-off**: Dagger has a notoriously steep learning curve and can produce cryptic error messages, which is precisely why Hilt was created to simplify it.",
        ],
      },
    ],
  },
  {
    heading: "The core annotations",
    blocks: [
      {
        t: "table",
        headers: ["Annotation", "Meaning"],
        rows: [
          ["`@Inject`", "on a constructor: 'Dagger, you can create this class'; on a field: 'inject here'"],
          ["`@Module`", "a class that tells Dagger *how* to provide types it can't construct itself"],
          ["`@Provides`", "a method inside a module that returns an instance of a type"],
          ["`@Binds`", "a more efficient way to bind an interface to its implementation"],
          ["`@Component`", "the bridge that connects modules to where dependencies are injected"],
          ["`@Singleton` / scopes", "mark a dependency to be reused (one instance) within a scope"],
        ],
      },
      {
        t: "code",
        title: "@Inject — Dagger can construct this",
        code: `// @Inject constructor tells Dagger how to CREATE this class,
// and what its dependencies are (which Dagger will also provide)
class UserRepository @Inject constructor(
    private val api: UserApi,        // Dagger provides these
    private val dao: UserDao,
)`,
      },
      {
        t: "p",
        text: "When a class has an `@Inject constructor`, Dagger knows how to build it *and* what it depends on — so it recursively provides those dependencies too. This is the ideal case: no extra configuration needed, Dagger figures out the whole chain. You only need modules for types Dagger *can't* construct via `@Inject constructor`.",
      },
    ],
  },
  {
    heading: "Modules — providing types Dagger can't construct",
    blocks: [
      {
        t: "p",
        text: "Some types you *can't* add an `@Inject constructor` to — interfaces (you can't construct an interface), classes from libraries (Retrofit, OkHttp, Room — you don't own their source), or types needing custom construction logic. For these, you write a **`@Module`** with **`@Provides`** methods that tell Dagger how to build them.",
      },
      {
        t: "code",
        title: "@Provides for library types",
        code: `@Module
class NetworkModule {
    @Provides
    @Singleton
    fun provideOkHttp(): OkHttpClient = OkHttpClient.Builder().build()

    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient): Retrofit =   // Dagger passes the OkHttpClient
        Retrofit.Builder().baseUrl("...").client(client).build()

    @Provides
    fun provideUserApi(retrofit: Retrofit): UserApi = retrofit.create(UserApi::class.java)
}`,
      },
      {
        t: "list",
        items: [
          "**`@Provides`** — a method that *returns* an instance. Its parameters are *its* dependencies, which Dagger supplies (note `provideRetrofit` takes an `OkHttpClient`, which Dagger gets from `provideOkHttp`). This is how you build a chain of library objects.",
          "**`@Binds`** — a more efficient alternative for the common 'bind interface to implementation' case. Instead of a `@Provides` method that just returns the impl, `@Binds` is an *abstract* method that tells Dagger 'when someone asks for the interface, give them this implementation' — Dagger generates less code for it.",
          "**Why `@Binds` over `@Provides` for interfaces**: `@Provides` requires a full method body and generates a factory; `@Binds` is a declaration with no body (abstract), so Dagger produces more efficient generated code. Use `@Binds` for interface→impl bindings, `@Provides` when you need construction logic.",
        ],
      },
      {
        t: "code",
        title: "@Binds — bind interface to implementation efficiently",
        code: `@Module
abstract class RepositoryModule {
    @Binds
    abstract fun bindUserRepository(impl: UserRepositoryImpl): UserRepository
    // 'when someone needs UserRepository, provide UserRepositoryImpl'
}`,
      },
    ],
  },
  {
    heading: "Components — connecting the graph",
    blocks: [
      {
        t: "p",
        text: "A **`@Component`** is the central piece that ties everything together: it lists the modules (sources of dependencies) and declares where dependencies can be injected. Dagger generates the actual implementation of the component — the code that constructs and wires the whole graph. In plain Dagger, you create and manage components yourself; **this is the tedious part that Hilt automates** (Hilt provides pre-made components tied to Android lifecycles).",
      },
      {
        t: "code",
        title: "A Dagger component",
        code: `@Singleton
@Component(modules = [NetworkModule::class, RepositoryModule::class])
interface AppComponent {
    fun inject(activity: MainActivity)      // where to inject
    fun userRepository(): UserRepository    // or expose a dependency
}

// You build and hold it (usually in Application):
val appComponent = DaggerAppComponent.create()
appComponent.inject(mainActivity)`,
      },
      {
        t: "list",
        items: [
          "The component is the *composition root* — it knows all the modules and generates the graph. `DaggerAppComponent` is the generated implementation.",
          "**Subcomponents / scoped components** create scoped sub-graphs (a per-activity or per-fragment graph inheriting from the app graph) — how Dagger models different lifetimes. Managing this hierarchy manually is complex, which is the main thing Hilt removes.",
          "**What Hilt does with all this**: Hilt provides the standard components (`SingletonComponent`, `ActivityComponent`, `ViewModelComponent`, etc.) already defined and wired to Android lifecycles, so you never write `@Component` or `DaggerAppComponent` — you just add modules with `@InstallIn(...)`. That's the boilerplate Hilt eliminates.",
        ],
      },
    ],
  },
  {
    heading: "Scopes — controlling instance lifetime",
    blocks: [
      {
        t: "p",
        text: "A **scope** annotation tells Dagger to *reuse* a single instance of a dependency within a component's lifetime, rather than creating a new one each time it's requested. `@Singleton` is the app-wide scope; you can define custom scopes (`@ActivityScope`) for narrower lifetimes.",
      },
      {
        t: "list",
        items: [
          "**Unscoped (default)**: Dagger creates a *new instance every time* the dependency is requested. Fine for cheap, stateless objects.",
          "**Scoped (`@Singleton`, custom scopes)**: Dagger creates *one instance* and reuses it for all requests within that component's lifetime. Use for expensive-to-create or stateful objects that should be shared (a database, a Retrofit instance, a repository).",
          "**Scope must match the component**: a `@Singleton` dependency lives in the singleton (app) component; an activity-scoped one lives in the activity component. A scoped binding in the wrong component is an error.",
          "**Don't over-scope**: making everything `@Singleton` keeps objects alive for the whole app even when not needed (memory), and can cause issues with stateful objects being shared unexpectedly. Scope deliberately — singletons for genuinely app-lived shared resources, narrower scopes (or unscoped) otherwise.",
        ],
      },
      {
        t: "note",
        text: "Dagger essentials: a compile-time DI framework (graph verified at build → missing deps are build errors, no reflection). @Inject constructor = 'Dagger can build this'; @Module + @Provides = how to build types Dagger can't (libraries, interfaces); @Binds = efficient interface→impl binding; @Component = the graph connector (composition root); scopes (@Singleton) control instance reuse within a component. Hilt is built on Dagger and generates the components/wiring for you — knowing Dagger's pieces explains what Hilt does under the hood.",
      },
    ],
  },
];

export default content;
