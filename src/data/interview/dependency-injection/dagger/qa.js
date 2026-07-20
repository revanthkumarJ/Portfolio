// Dagger Fundamentals — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is Dagger and how is it different from a runtime DI framework?",
    a: [
      {
        t: "p",
        text: "**Dagger is a dependency injection framework that generates the wiring code *at compile time* using annotation processing.** You annotate your classes and provider recipes, and during the build Dagger generates the code that constructs your object graph. This compile-time nature is its defining trait and the main difference from a runtime DI framework like Koin.",
      },
      {
        t: "list",
        items: [
          "**Compile-time verification**: because Dagger builds the graph at compile time, a missing dependency or a cycle is a *build error*, not a runtime crash. You find out something's wrong when you build, not when a user hits that screen.",
          "**No reflection**: Dagger generates plain code (factory classes, direct constructor calls), so there's no runtime reflection overhead. Koin, by contrast, resolves dependencies at runtime via a registry.",
          "**The trade-off**: this safety and performance come at the cost of a steep learning curve and sometimes cryptic error messages, plus added build time from annotation processing.",
        ],
      },
      {
        t: "p",
        text: "It's worth knowing that **Hilt is built on top of Dagger** — Hilt is Google's recommended Android DI, and it's essentially Dagger with the boilerplate removed and Android integration added. So understanding Dagger's concepts (`@Inject`, `@Module`, `@Provides`, `@Component`, scopes) explains what Hilt is doing under the hood, which is exactly what deeper DI interview questions probe.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does @Inject on a constructor do in Dagger?",
    a: [
      {
        t: "p",
        text: "**Putting `@Inject` on a constructor tells Dagger two things: 'you can create this class', and 'here are its dependencies'.** Dagger reads the constructor parameters, understands what the class needs, and knows how to build it — recursively providing those dependencies too (as long as they're also injectable).",
      },
      {
        t: "code",
        title: "@Inject constructor",
        code: `class UserRepository @Inject constructor(
    private val api: UserApi,    // Dagger will provide these
    private val dao: UserDao,
)`,
      },
      {
        t: "p",
        text: "This is the *ideal* case in Dagger — when a class has an `@Inject constructor`, you need no extra configuration; Dagger figures out the whole construction chain automatically. If `UserRepository` needs a `UserApi`, and `UserApi` is also provided somehow, Dagger wires it all up. You only have to write *modules* (`@Provides`/`@Binds`) for types that *can't* have an `@Inject constructor` — interfaces (can't construct an interface), library classes (you don't own their source, like Retrofit/OkHttp), or types needing custom construction logic. So the strategy is: annotate your own classes' constructors with `@Inject` (most of your codebase), and write modules only for the types Dagger can't construct itself.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a Dagger Module and when do you need one?",
    a: [
      {
        t: "p",
        text: "**A `@Module` is a class that tells Dagger *how to provide* types it can't construct on its own.** Dagger can automatically build any class with an `@Inject constructor`, but for types where that's not possible, you write a module with methods that supply the instances.",
      },
      {
        t: "list",
        items: [
          "**You need a module for**: interfaces (Dagger can't instantiate an interface — you must tell it which implementation to use); library/framework classes you don't own (Retrofit, OkHttp, Room database — you can't add `@Inject` to their constructors); and types requiring custom construction (a builder, configuration, conditional logic).",
          "**`@Provides` methods** — a method that returns an instance of a type. Its parameters are its own dependencies, which Dagger supplies. This lets you build chains of library objects (a Retrofit method taking an OkHttpClient that another method provides).",
        ],
      },
      {
        t: "code",
        title: "A module providing library types",
        code: `@Module
class NetworkModule {
    @Provides @Singleton
    fun provideRetrofit(client: OkHttpClient): Retrofit =
        Retrofit.Builder().baseUrl("...").client(client).build()
}`,
      },
      {
        t: "p",
        text: "So the mental split is: your own classes get `@Inject constructor` (no module needed), and everything you *can't* annotate (interfaces + third-party classes) goes in a module with `@Provides`. In Hilt, modules work the same way but you add `@InstallIn(SomeComponent::class)` to say which scope they belong to, and Hilt handles the component wiring.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are scopes in Dagger, like @Singleton?",
    a: [
      {
        t: "p",
        text: "**A scope tells Dagger to reuse a *single instance* of a dependency within a component's lifetime, instead of creating a new one every time it's requested.** By default (unscoped), Dagger creates a fresh instance on each request; a scope annotation makes it cache and reuse one.",
      },
      {
        t: "list",
        items: [
          "**`@Singleton`** is the app-wide scope — one instance for the whole application lifetime. Use it for expensive or shared objects: the Retrofit instance, the database, repositories.",
          "**Unscoped (default)** — a new instance every time. Fine for cheap, stateless objects where sharing doesn't matter.",
          "**Custom scopes** (`@ActivityScoped`, `@ViewModelScoped` in Hilt) — narrower lifetimes tied to a component, so an instance is shared within, say, one Activity and recreated for the next.",
        ],
      },
      {
        t: "p",
        text: "The key idea is matching the *lifetime* of an object to how it should be shared: a database should be a `@Singleton` (one for the app — creating multiple is wasteful and can conflict), while a screen-specific helper might be activity-scoped or unscoped. A caution: don't make everything `@Singleton` — that keeps objects alive for the whole app even when unneeded (memory cost), and sharing stateful objects app-wide can cause surprising bugs. Scope deliberately based on the object's intended lifetime and sharing. In Hilt, scopes are tied to its predefined components (`SingletonComponent`, `ActivityComponent`, `ViewModelComponent`), so you pick the scope matching the Android lifecycle you want.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between @Provides and @Binds, and why prefer @Binds for interfaces?",
    a: [
      {
        t: "p",
        text: "**Both tell Dagger how to satisfy a dependency, but `@Binds` is a more efficient way to express the specific 'bind this interface to that implementation' case. `@Provides` is a concrete method with a body that *returns* an instance; `@Binds` is an *abstract* method with no body that just *declares* a mapping from an interface to an implementation.**",
      },
      {
        t: "code",
        title: "The same binding, two ways",
        code: `// @Provides — a full method with a body
@Provides
fun provideRepo(impl: UserRepositoryImpl): UserRepository = impl

// @Binds — abstract, no body, just declares the mapping
@Binds
abstract fun bindRepo(impl: UserRepositoryImpl): UserRepository`,
      },
      {
        t: "list",
        items: [
          "**Why `@Binds` is more efficient**: for `@Provides`, Dagger generates a full *factory class* that calls your method to produce the instance. For `@Binds`, since it's just declaring 'the interface *is* this implementation' (which Dagger already knows how to construct via its `@Inject constructor`), Dagger can generate much *less* code — often no factory at all, just a direct cast/reference. Less generated code means smaller binary and slightly faster build.",
          "**The constraint**: `@Binds` only works when the implementation is already constructable by Dagger (has an `@Inject constructor` or is provided elsewhere) and you're purely *aliasing* one type to another. It can't have a body, so it can't do construction logic. It must be in an *abstract* module (an abstract class or interface).",
          "**When to use each**: use `@Binds` for the common 'bind interface to its implementation' pattern (which is most of your repository/use-case bindings) — it's the idiomatic, efficient choice. Use `@Provides` when you need to *construct* something with logic — a library object built via a builder (Retrofit, OkHttp, Room), an object requiring configuration, or conditional provision. You can't `@Binds` a Retrofit instance because there's no `@Inject constructor` for it; you must `@Provides` it.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the rule of thumb is 'binding an interface to an implementation you own → `@Binds`; constructing a concrete object (especially library types) with logic → `@Provides`'. `@Binds` exists specifically to optimize the extremely common interface-aliasing case, generating minimal code, while `@Provides` handles everything requiring actual construction. Knowing to reach for `@Binds` on interface bindings (and that it must be abstract, in an abstract module, with the impl being Dagger-constructable) demonstrates you understand not just *how* to wire Dagger but how to do it efficiently — a genuine depth signal.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a Dagger Component, and what does Hilt do with components that plain Dagger makes you do manually?",
    a: [
      {
        t: "p",
        text: "**A `@Component` is the central connector of a Dagger graph — it lists the modules (where dependencies come from) and declares the injection points (where dependencies are needed), and Dagger generates its implementation (the code that actually constructs and wires the whole object graph). It's the composition root. In plain Dagger, *you* define, create, hold, and manage the lifecycle of every component and subcomponent yourself — and that manual management is the primary tedium Hilt eliminates.**",
      },
      {
        t: "list",
        items: [
          "**What plain Dagger requires you to do manually**: define an `@Component` interface listing modules; build it (`DaggerAppComponent.create()`); hold the instance somewhere (usually the Application); define *subcomponents* or scoped components for narrower lifetimes (an activity component, a fragment component); manage the *hierarchy* between them (which component is a child of which); and wire each Android entry point (Activity/Fragment) to the right component, injecting at the right lifecycle moment. For a real app with app/activity/fragment/view-model scopes, this is a lot of intricate, boilerplate-heavy, easy-to-get-wrong code.",
          "**What Hilt provides instead**: a *standard, predefined set of components* already wired to Android's lifecycles — `SingletonComponent` (app), `ActivityRetainedComponent`, `ViewModelComponent`, `ActivityComponent`, `FragmentComponent`, `ViewComponent`, `ServiceComponent` — with the parent-child hierarchy already established (fragment component is a child of activity, which is a child of singleton, etc.). You *never* write `@Component`, never call `DaggerAppComponent`, never manage component lifecycles.",
          "**How you use Hilt's components**: annotate the Application with `@HiltAndroidApp` (Hilt generates and manages the singleton component), annotate Android entry points with `@AndroidEntryPoint` (Hilt injects them from the right component at the right time), and put modules with `@InstallIn(SomeComponent::class)` to say which scope a module belongs to. Hilt generates all the component code and wiring that you'd hand-write in Dagger.",
          "**Corollary — scopes map to components**: Hilt's scope annotations (`@Singleton`, `@ActivityScoped`, `@ViewModelScoped`) correspond directly to its predefined components, so 'scope' and 'which component' become the same decision, and Hilt enforces the lifecycle. In plain Dagger you'd define these scopes and their components yourself.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the component (and especially the *component hierarchy* with scopes and subcomponents) is the most complex, boilerplate-heavy part of Dagger, and it's boilerplate that's essentially identical across all Android apps (everyone needs app/activity/fragment/viewmodel scopes tied to those lifecycles). Hilt's core insight was to *standardize* that — provide the components and hierarchy every Android app needs, pre-wired to the lifecycles, so developers only declare modules and injection points. So 'what does Hilt do?' at the component level: it replaces the manual, error-prone `@Component`/subcomponent/lifecycle management with a fixed set of lifecycle-bound components you opt into via `@InstallIn` and `@AndroidEntryPoint`. Understanding that Hilt = 'Dagger + standard Android components + reduced boilerplate' is the complete answer.",
      },
    ],
  },
];

export default qa;
