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
  {
    level: "junior",
    q: "What is a Dagger @Component, and what does it do?",
    a: [
      {
        t: "p",
        text: "A `@Component` is the *bridge* between modules (which define bindings) and the classes that need dependencies — Dagger generates its implementation, which knows how to construct the whole graph. You declare it as an interface listing its modules and *provision methods* (or injection methods), and Dagger generates a `DaggerXComponent` you build and use to get dependencies.",
      },
      {
        t: "code",
        title: "@Component",
        code: `@Component(modules = [NetworkModule::class])
interface AppComponent {
    fun userRepository(): UserRepository   // provision method
    fun inject(activity: MainActivity)     // members injection
}
val component = DaggerAppComponent.create()`,
      },
      {
        t: "list",
        items: [
          "**Bridge** — connects modules to injection targets.",
          "**Generated impl** — `DaggerXComponent` builds the graph.",
          "**Provision methods** — expose dependencies; `inject(target)` for field injection.",
          "**Hilt** — predefines and generates components so you don't.",
        ],
      },
      {
        t: "note",
        text: "A @Component is the interface bridging modules (bindings) to injection targets; Dagger generates DaggerXComponent that constructs the graph. It lists modules + provision methods (or inject(target) for members injection). You build it (DaggerAppComponent.create()) and use it. Hilt predefines/generates components for you.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are Dagger subcomponents, and how do they enable scoping?",
    a: [
      {
        t: "p",
        text: "A `@Subcomponent` is a child component that *inherits* its parent's bindings and adds its own scope/bindings — creating a hierarchy (e.g. an app component → activity subcomponent → fragment subcomponent). Subcomponents enable *lifecycle scopes*: a subcomponent lives as long as its owner (an Activity), so `@ActivityScoped` bindings are single instances within it. Hilt automates this hierarchy.",
      },
      {
        t: "list",
        items: [
          "**`@Subcomponent`** — child inheriting parent bindings + own scope.",
          "**Hierarchy** — app → activity → fragment components.",
          "**Lifecycle scopes** — a subcomponent's lifetime scopes its bindings.",
          "**Hilt** — predefines this component hierarchy.",
        ],
      },
      {
        t: "note",
        text: "A @Subcomponent is a child component inheriting the parent's bindings and adding its own scope/bindings — forming a hierarchy (app → activity → fragment). Its lifetime scopes its bindings (@ActivityScoped = single instance within it). Hilt automates this whole hierarchy so you don't write subcomponents manually.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is @Inject on a field versus a constructor in Dagger?",
    a: [
      {
        t: "p",
        text: "`@Inject` on a *constructor* tells Dagger how to *create* that class (and its dependencies) — the preferred way. `@Inject` on a *field* (with `lateinit var`) marks it as an *injection target* to be populated by a component's `inject(target)` method — used for classes Dagger doesn't construct (Activities). Constructor injection is cleaner; field injection is for framework-created objects.",
      },
      {
        t: "list",
        items: [
          "**Constructor `@Inject`** — Dagger constructs the class; preferred.",
          "**Field `@Inject`** — populated via `component.inject(target)`.",
          "**Field for** — Activities/Fragments you don't construct.",
          "**Prefer constructor** — explicit, immutable, testable.",
        ],
      },
      {
        t: "note",
        text: "@Inject on a constructor tells Dagger how to create the class (preferred). @Inject on a field marks an injection target populated via component.inject(target) — for framework-created classes (Activities). Constructor injection is explicit/immutable/testable; field injection is for objects Dagger doesn't construct.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you pass runtime values into a Dagger component?",
    a: [
      {
        t: "p",
        text: "Use `@Component.Builder`/`@Component.Factory` with `@BindsInstance` to supply runtime values (like the `Application`/`Context` or a user id) into the graph when building the component. `@BindsInstance` binds the passed instance so it's injectable throughout. This is how you get the `Context` into the graph without a module.",
      },
      {
        t: "code",
        title: "@BindsInstance",
        code: `@Component
interface AppComponent {
    @Component.Factory interface Factory {
        fun create(@BindsInstance app: Application): AppComponent
    }
}
val component = DaggerAppComponent.factory().create(application)`,
      },
      {
        t: "list",
        items: [
          "**`@Component.Factory`/`Builder`** — customize component creation.",
          "**`@BindsInstance`** — bind a runtime value into the graph.",
          "**Uses** — Application/Context, config, user id.",
          "**Injectable** — the bound instance is available throughout.",
        ],
      },
      {
        t: "note",
        text: "Use @Component.Factory/@Component.Builder with @BindsInstance to pass runtime values (Application/Context, user id, config) into the graph when building the component — the bound instance becomes injectable throughout. It's how the Context enters the graph without a module. Hilt does this automatically for the Application.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a custom scope annotation in Dagger, and how does it work?",
    a: [
      {
        t: "p",
        text: "You define a `@Scope` annotation (`@UserScope`, `@ActivityScope`) and apply it to a component and its bindings — Dagger then keeps *one instance* of a scoped binding *per component instance*. The scope is enforced by the component lifetime: a new component = new scoped instances. Scopes are just annotations; the component instance defines the actual lifetime.",
      },
      {
        t: "code",
        title: "Custom scope",
        code: `@Scope @Retention(AnnotationRetention.RUNTIME) annotation class UserScope

@UserScope @Subcomponent interface UserComponent { ... }
@UserScope class UserSession @Inject constructor(...)   // one per UserComponent`,
      },
      {
        t: "list",
        items: [
          "**`@Scope` annotation** — define a custom scope.",
          "**Apply to component + bindings** — one instance per component.",
          "**Lifetime = component lifetime** — new component, new instances.",
          "**Enforcement** — Dagger checks scoped bindings match the component's scope.",
        ],
      },
      {
        t: "note",
        text: "Define a @Scope annotation (@UserScope) and apply it to a component and its bindings — Dagger keeps one instance per component instance. The scope's actual lifetime is the component's lifetime (new component = new scoped instances). Scopes are annotations; the component defines the lifetime. Hilt predefines the standard Android scopes.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is component dependency versus a subcomponent?",
    a: [
      {
        t: "p",
        text: "Both let components share bindings, but differently. A *subcomponent* is *nested* inside its parent and has full access to the parent's graph. A *component dependency* (`@Component(dependencies = [Other::class])`) is a looser link — the dependent component can only use the bindings the parent *explicitly exposes* via provision methods. Component dependencies decouple components (useful across modules that shouldn't fully share graphs); subcomponents are tighter.",
      },
      {
        t: "list",
        items: [
          "**Subcomponent** — nested; full access to the parent graph.",
          "**Component dependency** — looser; only explicitly-exposed bindings.",
          "**Decoupling** — component dependencies across modules.",
          "**Tighter** — subcomponents for a clear parent-child lifecycle.",
        ],
      },
      {
        t: "note",
        text: "Subcomponent: nested in the parent with full access to its graph (tight). Component dependency (@Component(dependencies=[...])): looser — only the parent's explicitly-exposed provision methods are available. Use component dependencies to decouple components across modules; subcomponents for a clear parent-child lifecycle.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between @Provides and @Binds again, and when is each required?",
    a: [
      {
        t: "p",
        text: "`@Provides` is a *concrete method* that returns an instance — use it when construction needs logic (a Retrofit builder) or for third-party classes. `@Binds` is an *abstract method* that just maps an interface to an already-injectable implementation — more efficient (no method body). Use `@Binds` for simple interface→impl bindings; `@Provides` when you must write construction code.",
      },
      {
        t: "list",
        items: [
          "**`@Provides`** — concrete; write construction logic; third-party classes.",
          "**`@Binds`** — abstract; interface → injectable impl; efficient.",
          "**`@Binds` needs** — the impl to be `@Inject`-constructable.",
          "**`@Provides` needs** — a method body returning the instance.",
        ],
      },
      {
        t: "note",
        text: "@Provides = concrete method returning an instance (for construction logic / third-party classes). @Binds = abstract method mapping an interface to an already-injectable impl (more efficient, no body). Use @Binds for interface→impl; @Provides when you must write construction code.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Dagger generate code, and what does that mean at runtime?",
    a: [
      {
        t: "p",
        text: "Dagger is an *annotation processor* (kapt/KSP) that generates *factory* and *component* classes at *compile time* — e.g. `User_Factory`, `DaggerAppComponent`. At runtime, these are plain Kotlin/Java calling constructors directly — *no reflection*. This makes Dagger fast and verifiable (errors caught at compile time), at the cost of build time (annotation processing).",
      },
      {
        t: "list",
        items: [
          "**Annotation processing** — generates factories/components at compile time.",
          "**No runtime reflection** — generated code calls constructors directly.",
          "**Fast + verifiable** — errors at compile, fast at runtime.",
          "**Build cost** — kapt/KSP processing time.",
        ],
      },
      {
        t: "note",
        text: "Dagger is an annotation processor (kapt/KSP) generating factory/component classes at compile time (User_Factory, DaggerAppComponent) — at runtime it's plain code calling constructors, no reflection. Fast and compile-time-verified; the cost is build-time annotation processing.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is multibinding in Dagger (@IntoSet, @IntoMap)?",
    a: [
      {
        t: "p",
        text: "Multibindings let multiple modules contribute to a `Set<T>` or `Map<K, T>` that Dagger aggregates and injects. `@IntoSet` adds an element to a set; `@IntoMap` with a `@MapKey` adds a keyed entry. This is the foundation of plugin architectures — many modules register handlers/initializers/workers, and a consumer injects the whole collection without knowing each contributor.",
      },
      {
        t: "code",
        title: "@IntoMap",
        code: `@Binds @IntoMap @ClassKey(HomeViewModel::class)
abstract fun bind(vm: HomeViewModel): ViewModel   // classic ViewModel multibinding
`,
      },
      {
        t: "list",
        items: [
          "**`@IntoSet`** — contribute to a `Set<T>`.",
          "**`@IntoMap` + `@MapKey`** — contribute a keyed entry.",
          "**Plugin architecture** — modules register; consumer injects the collection.",
          "**Classic use** — the pre-Hilt ViewModel factory multibinding map.",
        ],
      },
      {
        t: "note",
        text: "Dagger multibindings aggregate contributions into a Set<T> (@IntoSet) or Map<K,T> (@IntoMap + @MapKey) that a consumer injects. Foundation of plugin architectures (register handlers/initializers) and the classic pre-Hilt ViewModel factory (a Map<Class, ViewModel>). Hilt has its own multibinding support too.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you provide qualified bindings in Dagger?",
    a: [
      {
        t: "p",
        text: "Define a `@Qualifier` annotation (or use `@Named`) and apply it to both the binding and the injection point — Dagger uses the qualifier to disambiguate multiple bindings of the same type. Custom qualifiers are preferred over `@Named` because they're type-safe (a typo in `@Named(\"...\")` fails silently, a misspelled annotation won't compile).",
      },
      {
        t: "code",
        title: "Qualifier",
        code: `@Qualifier annotation class BaseUrl
@Provides @BaseUrl fun baseUrl(): String = "https://api.example.com/"
class Api(@BaseUrl private val url: String)`,
      },
      {
        t: "list",
        items: [
          "**`@Qualifier`/`@Named`** — disambiguate same-typed bindings.",
          "**On both ends** — binding + injection point.",
          "**Custom > `@Named`** — type-safe (no string typos).",
          "**Uses** — two clients, multiple config strings.",
        ],
      },
      {
        t: "note",
        text: "Define a @Qualifier annotation (or @Named) on both the binding and injection point to disambiguate same-typed bindings. Prefer custom qualifiers over @Named — they're type-safe (a misspelled annotation won't compile, unlike a string typo). For two OkHttpClients, multiple config strings, etc.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is lazy and provider injection in Dagger?",
    a: [
      {
        t: "p",
        text: "`Lazy<T>` defers a dependency's creation until first `.get()` (then caches it); `Provider<T>` returns a *new* instance each `.get()` (or a fresh scoped one). Use `Lazy` for expensive dependencies not always needed; `Provider` when you need multiple instances or to break a scope/cycle. Both let you control *when* and *how many* instances are created.",
      },
      {
        t: "code",
        title: "Lazy / Provider",
        code: `class A @Inject constructor(
    private val heavy: Lazy<Heavy>,       // created on first get()
    private val itemFactory: Provider<Item>,  // new per get()
)`,
      },
      {
        t: "list",
        items: [
          "**`Lazy<T>`** — deferred, cached after first `get()`.",
          "**`Provider<T>`** — new instance per `get()`.",
          "**`Lazy`** — expensive/rarely-used deps.",
          "**`Provider`** — multiple instances / breaking cycles.",
        ],
      },
      {
        t: "note",
        text: "Dagger Lazy<T> defers creation until first get() (then caches); Provider<T> returns a new instance per get(). Use Lazy for expensive/rarely-needed deps, Provider for multiple instances or breaking cycles. Both control when and how many instances are created.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does 'unscoped' mean, and what happens with an unscoped binding?",
    a: [
      {
        t: "p",
        text: "An *unscoped* binding (no scope annotation) creates a *new instance every time* it's injected — Dagger doesn't cache it. This is the default and is fine for cheap, stateless objects (mappers, use cases). Add a scope (`@Singleton`, etc.) only when you need a *shared* single instance (state, expensive resources like a database). Over-scoping wastes memory; under-scoping recreates state.",
      },
      {
        t: "list",
        items: [
          "**Unscoped** — new instance per injection (default).",
          "**Fine for** — cheap, stateless objects.",
          "**Add scope for** — shared single instances (state, expensive resources).",
          "**Balance** — over-scope leaks/wastes; under-scope recreates.",
        ],
      },
      {
        t: "note",
        text: "An unscoped binding (no scope) creates a new instance per injection (the default) — fine for cheap stateless objects (mappers/use cases). Add a scope (@Singleton) only for shared single instances (state, expensive resources like a DB). Over-scoping wastes memory; under-scoping recreates state.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you inject a ViewModel with plain Dagger (pre-Hilt)?",
    a: [
      {
        t: "p",
        text: "The classic approach: use a *multibinding map* — bind each ViewModel `@IntoMap @ClassKey(...)` to `ViewModel`, and provide a custom `ViewModelProvider.Factory` that looks up the ViewModel by class from the injected `Map<Class, Provider<ViewModel>>`. This let Dagger create ViewModels with dependencies. Hilt replaced all this boilerplate with `@HiltViewModel`.",
      },
      {
        t: "list",
        items: [
          "**Multibinding map** — `@IntoMap @ClassKey` → `ViewModel`.",
          "**Custom factory** — looks up by class from the injected map.",
          "**Enabled DI ViewModels** — before Hilt.",
          "**Hilt** — `@HiltViewModel` removes this entirely.",
        ],
      },
      {
        t: "note",
        text: "Pre-Hilt ViewModel injection used a multibinding map: bind each ViewModel @IntoMap @ClassKey to ViewModel, and a custom ViewModelProvider.Factory looks it up from the injected Map<Class, Provider<ViewModel>>. Boilerplate that @HiltViewModel replaced entirely.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is @Reusable scope, and how does it differ from @Singleton?",
    a: [
      {
        t: "p",
        text: "`@Reusable` is a *relaxed* scope: Dagger *may* cache and reuse an instance, but doesn't *guarantee* a single instance (it can create more than one, and isn't tied to a component). Use it for stateless objects where you'd *prefer* to avoid recreating them but don't *need* strict singleton semantics. `@Singleton` guarantees exactly one per component; `@Reusable` is a best-effort optimization.",
      },
      {
        t: "list",
        items: [
          "**`@Reusable`** — may cache; no single-instance guarantee.",
          "**`@Singleton`** — exactly one per component.",
          "**Use `@Reusable`** — stateless objects, avoid-recreation preference.",
          "**Best-effort** — an optimization, not strict scoping.",
        ],
      },
      {
        t: "note",
        text: "@Reusable is a relaxed scope — Dagger may cache and reuse an instance but doesn't guarantee a single one (not component-bound). Use it for stateless objects you'd prefer not to recreate but don't need strict singleton semantics. @Singleton guarantees exactly one per component; @Reusable is a best-effort optimization.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why is Dagger preferred over runtime DI for large apps?",
    a: [
      {
        t: "p",
        text: "Dagger's *compile-time* code generation means: missing/incorrect bindings and dependency cycles are caught *at build time* (not runtime crashes), there's *no reflection* (fast, small, no runtime graph resolution), and the generated code is efficient. For large apps with complex graphs, this compile-time safety and performance is valuable — worth the build-time and learning cost.",
      },
      {
        t: "list",
        items: [
          "**Compile-time verification** — missing bindings/cycles caught at build.",
          "**No reflection** — fast runtime, small footprint.",
          "**Efficient generated code** — direct constructor calls.",
          "**Trade-off** — build time + learning curve for large-graph safety.",
        ],
      },
      {
        t: "note",
        text: "Dagger's compile-time codegen catches missing bindings/cycles at build time (not runtime crashes), uses no reflection (fast, small), and generates efficient code — valuable for large apps with complex graphs. The cost is build time and a learning curve. Hilt makes this ergonomic for Android.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test code that uses Dagger?",
    a: [
      {
        t: "p",
        text: "You generally *don't* need Dagger in unit tests — since dependencies are constructor-injected, tests just pass fakes directly. For *integration* tests needing the graph, create a *test component* with test modules that provide fakes (or override production modules). But most tests bypass DI entirely by constructing the class under test with test doubles.",
      },
      {
        t: "list",
        items: [
          "**Unit tests** — construct with fakes directly; no Dagger needed.",
          "**Integration** — a test component with test modules providing fakes.",
          "**Override modules** — swap production bindings for test ones.",
          "**Constructor injection** — is what makes tests DI-free.",
        ],
      },
      {
        t: "note",
        text: "Most Dagger-based code needs no Dagger in unit tests — constructor injection lets you pass fakes directly. For integration tests needing the graph, build a test component with test modules providing fakes (overriding production modules). Constructor injection is what makes tests DI-free.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the object graph, and how does Dagger resolve it?",
    a: [
      {
        t: "p",
        text: "The object graph is the set of all objects and their dependency relationships. Dagger *resolves* it at *compile time*: it reads `@Inject` constructors, `@Provides`/`@Binds` bindings, and scopes, then generates factory code that constructs each object with its dependencies in the correct order. If a required binding is missing or a cycle exists, compilation fails with a clear error naming the type.",
      },
      {
        t: "list",
        items: [
          "**Object graph** — objects + dependency relationships.",
          "**Compile-time resolution** — reads `@Inject`/`@Provides`/`@Binds`/scopes.",
          "**Generated factories** — construct in the right order.",
          "**Errors** — missing binding/cycle fails the build with a named type.",
        ],
      },
      {
        t: "note",
        text: "The object graph is all objects + their dependency relationships. Dagger resolves it at compile time from @Inject constructors, @Provides/@Binds bindings, and scopes, generating factory code that constructs each in order. A missing binding or cycle fails compilation with a clear error naming the type.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the relationship between Dagger, Hilt, and Anvil?",
    a: [
      {
        t: "p",
        text: "*Dagger* is the core compile-time DI framework. *Hilt* is Google's opinionated layer *on top of Dagger* for Android — predefined components/scopes and Android integration. *Anvil* (Square) is a Kotlin compiler plugin that reduces Dagger boilerplate differently (contributing modules/bindings automatically, faster than kapt). All three ultimately use Dagger's model; Hilt is the mainstream Android choice.",
      },
      {
        t: "list",
        items: [
          "**Dagger** — the core compile-time DI framework.",
          "**Hilt** — Android layer on Dagger (predefined components).",
          "**Anvil** — Kotlin plugin reducing Dagger boilerplate (auto-contribution).",
          "**Mainstream** — Hilt for Android apps.",
        ],
      },
      {
        t: "note",
        text: "Dagger = the core compile-time DI framework. Hilt = Google's Android layer on Dagger (predefined components/scopes, Android integration). Anvil (Square) = a Kotlin compiler plugin cutting Dagger boilerplate via automatic contribution. All use Dagger's model; Hilt is the mainstream Android choice.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you break a dependency cycle in Dagger?",
    a: [
      {
        t: "p",
        text: "Dagger fails to compile on a cycle (A needs B, B needs A). Break it by injecting a `Lazy<T>` or `Provider<T>` on one side (deferring that dependency's creation so the graph can be built), introducing an interface to invert the dependency, or refactoring to remove the cycle (extract shared logic). A cycle usually indicates a design issue worth fixing rather than just deferring.",
      },
      {
        t: "list",
        items: [
          "**`Lazy`/`Provider`** — defer one side's creation.",
          "**Interface** — invert one dependency direction.",
          "**Refactor** — extract shared logic to a third class.",
          "**Design smell** — a cycle often signals mixed responsibilities.",
        ],
      },
      {
        t: "note",
        text: "Dagger fails to compile on a cycle (A↔B). Break it with Lazy<T>/Provider<T> on one side (defer creation), an interface to invert the dependency, or refactoring (extract shared logic). A cycle usually signals a design issue — prefer fixing it over just deferring.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the performance impact of Dagger on build and app?",
    a: [
      {
        t: "p",
        text: "At *runtime*, Dagger is essentially free — generated code calls constructors directly, no reflection, minimal overhead. The cost is at *build time*: annotation processing (kapt) can noticeably slow builds, especially for large graphs. Migrating to *KSP* (which Dagger/Hilt now support) speeds this up significantly. So Dagger trades some build time for zero-reflection runtime performance.",
      },
      {
        t: "list",
        items: [
          "**Runtime** — negligible; direct constructor calls, no reflection.",
          "**Build time** — annotation processing (kapt) can be slow.",
          "**KSP** — faster than kapt; use it where supported.",
          "**Trade-off** — build cost for fast, verified runtime.",
        ],
      },
      {
        t: "note",
        text: "Dagger's runtime cost is negligible (direct constructor calls, no reflection); the cost is build-time annotation processing (kapt can be slow for large graphs). Migrating to KSP speeds builds significantly. It trades some build time for zero-reflection, compile-verified runtime performance.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a @MapKey, and when do you use it?",
    a: [
      {
        t: "p",
        text: "`@MapKey` defines the *key type* for a multibinding `Map` — you annotate the key annotation with `@MapKey`, then use it on `@IntoMap` bindings. Built-in ones include `@ClassKey` (Class keys), `@StringKey`, `@IntKey`. It's how each `@IntoMap` entry declares its key (e.g. mapping a `Class` to a `ViewModel` in the classic ViewModel factory).",
      },
      {
        t: "code",
        title: "@MapKey",
        code: `@MapKey annotation class ViewModelKey(val value: KClass<out ViewModel>)
@Binds @IntoMap @ViewModelKey(HomeViewModel::class)
abstract fun bind(vm: HomeViewModel): ViewModel`,
      },
      {
        t: "list",
        items: [
          "**`@MapKey`** — declares the key type for a multibinding map.",
          "**Built-in** — `@ClassKey`, `@StringKey`, `@IntKey`.",
          "**On `@IntoMap`** — each entry supplies its key.",
          "**Classic use** — ViewModel factory `Map<Class, ViewModel>`.",
        ],
      },
      {
        t: "note",
        text: "@MapKey defines the key type for a multibinding Map; annotate a key annotation with it (or use built-in @ClassKey/@StringKey/@IntKey), then apply it on @IntoMap bindings so each entry declares its key. Classic use: the ViewModel factory Map<Class, ViewModel>.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you scope a dependency to a user session or feature flow?",
    a: [
      {
        t: "p",
        text: "Create a custom-scoped *subcomponent* whose lifetime matches the session/flow — build the subcomponent when the session starts, hold the reference, and *release* it (null the reference) when the session ends. Bindings annotated with that scope are single instances for the session's lifetime and are garbage-collected when you drop the subcomponent. This is how you model per-login or per-flow state cleanly.",
      },
      {
        t: "list",
        items: [
          "**Custom-scoped subcomponent** — lifetime = session/flow.",
          "**Build on start** — hold the reference; deps scoped to it.",
          "**Release on end** — drop the reference; instances GC'd.",
          "**Uses** — per-login session, per-checkout flow state.",
        ],
      },
      {
        t: "note",
        text: "Scope to a session/flow with a custom-scoped subcomponent: build it when the session starts (hold the reference), and release it (drop the reference) when it ends — scoped bindings are single instances for its lifetime and GC'd on release. Models per-login/per-flow state cleanly. Hilt has @ActivityRetainedScoped for similar needs.",
      },
    ],
  },
  {
    level: "junior",
    q: "Do you still need to know Dagger if you use Hilt?",
    a: [
      {
        t: "p",
        text: "Yes, conceptually — Hilt *is* Dagger with predefined components, so understanding Dagger's model (bindings, scopes, `@Provides`/`@Binds`, the graph, qualifiers) is essential to use Hilt well and debug its errors. Hilt saves you from writing components and wiring, but the underlying concepts (and error messages) are Dagger's. For advanced cases (custom components) you drop to Dagger constructs.",
      },
      {
        t: "list",
        items: [
          "**Hilt is Dagger** — with predefined components.",
          "**Concepts transfer** — bindings/scopes/@Provides/@Binds/qualifiers.",
          "**Debugging** — Hilt errors are Dagger errors.",
          "**Advanced** — custom components use Dagger constructs.",
        ],
      },
      {
        t: "note",
        text: "Yes — Hilt IS Dagger with predefined components, so Dagger's concepts (bindings, scopes, @Provides/@Binds, the graph, qualifiers) are essential to use Hilt well and read its (Dagger) error messages. Hilt removes the component/wiring boilerplate, but the model underneath is Dagger's; advanced cases drop to Dagger.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you migrate a Dagger app to KSP from kapt?",
    a: [
      {
        t: "p",
        text: "Dagger and Hilt now support *KSP* (Kotlin Symbol Processing), which is significantly faster than *kapt* (which generates Java stubs). Migrate by applying the KSP Gradle plugin and switching the Dagger/Hilt dependencies from `kapt(...)` to `ksp(...)` in the build file. The generated code and behavior are the same; you just get faster builds. This is a low-risk, high-value build-speed improvement.",
      },
      {
        t: "list",
        items: [
          "**KSP > kapt** — faster (no Java stub generation).",
          "**Apply KSP plugin** — and switch `kapt(...)` → `ksp(...)`.",
          "**Same behavior** — generated code unchanged.",
          "**Low-risk win** — meaningful build-speed improvement.",
        ],
      },
      {
        t: "note",
        text: "Dagger/Hilt support KSP (Kotlin Symbol Processing), much faster than kapt (which generates Java stubs). Migrate by applying the KSP plugin and switching Dagger/Hilt deps from kapt(...) to ksp(...). Same generated code/behavior, faster builds — a low-risk, high-value improvement.",
      },
    ],
  },
];

export default qa;
