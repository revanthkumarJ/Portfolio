// DI Fundamentals & Concepts — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is dependency injection?",
    a: [
      {
        t: "p",
        text: "**Dependency injection is a pattern where a class receives the objects it needs (its dependencies) from the outside, instead of creating them itself.** Rather than a ViewModel doing `val repo = Repository(...)` internally, it declares `class ViewModel(private val repo: Repository)` and something external provides the repository when constructing it. The 'inversion' is that the class no longer controls *how* its dependencies are built — that responsibility moves to whoever creates the class.",
      },
      {
        t: "code",
        title: "The essence",
        code: `// Not DI — creates its own dependency
class A { private val b = B() }

// DI — receives its dependency
class A(private val b: B)   // someone passes B in`,
      },
      {
        t: "p",
        text: "The simplest form is *constructor injection* — dependencies come through the constructor. DI is a *pattern*, not a specific library: you can do it manually (pass objects by hand) or use a framework (Hilt, Dagger, Koin) to automate the wiring. The whole idea reduces to 'don't create your dependencies, ask for them' — which sounds trivial but has big benefits, chiefly making classes testable (you can inject fakes) and loosely coupled (you can swap implementations).",
      },
    ],
  },
  {
    level: "junior",
    q: "Why use dependency injection? What are the benefits?",
    a: [
      {
        t: "p",
        text: "**The headline benefit is testability.** If a class creates its own dependencies (`val repo = RealRepository(realApi, realDb)`), you're stuck with those real objects in tests — real network calls, real database — which makes tests slow, flaky, and hard to control. With DI, a test injects *fakes* (a fake repository returning canned data), so you can test the class in isolation, fast and deterministically. DI is essentially what makes unit testing practical.",
      },
      {
        t: "list",
        items: [
          "**Testability** — inject fakes/mocks instead of real dependencies, enabling fast isolated unit tests.",
          "**Loose coupling** — the class depends on an abstraction (interface) that's injected, so you can swap implementations without changing the class.",
          "**Single responsibility** — the class focuses on its job, not on constructing a graph of dependencies.",
          "**Flexibility & reuse** — a class that receives its dependencies works in any context that can provide them; different builds (debug/release, different backends) inject different implementations.",
          "**Centralized wiring** — the 'what depends on what' lives in one place, making the app's structure explicit and easy to change.",
        ],
      },
      {
        t: "p",
        text: "When answering this, lead with testability because it's the most concrete and undeniable — a class that `new`s its dependencies literally cannot have them replaced in a test. The other benefits (coupling, SRP, flexibility) all flow from the same principle of receiving rather than creating dependencies.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between constructor injection and field injection, and which is preferred?",
    a: [
      {
        t: "p",
        text: "**Constructor injection passes dependencies through the constructor; field injection sets them on fields *after* the object is created. Constructor injection is strongly preferred.**",
      },
      {
        t: "list",
        items: [
          "**Constructor injection** (`class A(private val b: B)`): dependencies are provided at construction. Benefits — they can be `val` (immutable), the object is *fully valid the moment it's created* (no half-initialized state), and the dependencies are *explicit* in the signature (you can see exactly what the class needs). This is the ideal.",
          "**Field injection** (`@Inject lateinit var b: B`): the dependency is injected into a field after the object exists. Downsides — the field must be mutable (`var`), there's a window where it's accessed before being set (crash risk), and dependencies are *hidden* (not visible in the constructor signature).",
        ],
      },
      {
        t: "p",
        text: "**Why field injection exists at all**: some classes you *don't construct yourself* — Android instantiates Activities, Fragments, and Services via the framework, so you can't inject through their constructors. For those, field injection is the only option: the DI framework injects into annotated fields after the framework creates the object. So the rule is: **use constructor injection everywhere you control construction (ViewModels, repositories, use cases — the vast majority of your classes), and field injection only for framework-created entry points** where the constructor isn't yours. In Hilt, this is exactly the split — `@Inject constructor(...)` for your classes, and `@AndroidEntryPoint` + `@Inject lateinit var` for Activities/Fragments.",
      },
    ],
  },
  {
    level: "junior",
    q: "Is dependency injection the same as a DI framework like Hilt?",
    a: [
      {
        t: "p",
        text: "**No — dependency injection is a *pattern*, and Hilt/Dagger/Koin are *tools that automate* that pattern. You can do DI with no framework at all.** The pattern is just 'pass dependencies in from outside instead of creating them internally'. You can implement it *manually* by constructing objects and passing them down through constructors yourself.",
      },
      {
        t: "code",
        title: "Manual DI — no framework needed",
        code: `// A composition root that wires things by hand
val api = RetrofitApi()
val repository = UserRepositoryImpl(api)
val viewModel = UserViewModel(repository)   // manual DI`,
      },
      {
        t: "p",
        text: "For a small app, manual DI is perfectly fine and has zero library overhead. The reason frameworks exist is that as an app grows, wiring by hand becomes tedious and error-prone — deep dependency graphs mean threading objects through many constructors, and you must manually manage singletons and scopes. Frameworks *automate the wiring*: you declare how to provide each dependency and the framework builds the graph. Dagger/Hilt do this at *compile time* (generating code, so missing dependencies are build errors); Koin does it at *runtime* (a registry). So the distinction to make in an interview: DI is the concept (receive, don't create), and Hilt is one implementation that generates the boilerplate for you — understanding the concept independent of the tool is what matters.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does dependency injection relate to the Dependency Inversion Principle and clean architecture?",
    a: [
      {
        t: "p",
        text: "**Dependency injection is the *mechanism* that implements the Dependency Inversion Principle (the 'D' in SOLID), which states that high-level modules should depend on *abstractions*, not on concrete low-level details. DI delivers this by injecting an interface into the high-level class while supplying the concrete implementation from outside.**",
      },
      {
        t: "code",
        title: "Inversion via injected abstraction",
        code: `// Domain (high-level) defines and depends on the ABSTRACTION
interface UserRepository { suspend fun getUser(id: String): User }
class GetUserUseCase(private val repo: UserRepository)   // depends on interface

// Data (low-level) provides the IMPLEMENTATION
class UserRepositoryImpl(...) : UserRepository { ... }

// DI binds interface -> impl. The high-level code never names the low-level class.`,
      },
      {
        t: "list",
        items: [
          "**The 'inversion'**: normally high-level code would depend on low-level code (a use case directly creating a Retrofit-backed repository). DIP inverts this — the high-level domain defines the *interface* it needs, and the low-level data layer *implements* that interface. Now the dependency arrow points *toward* the abstraction, not toward the concrete detail. DI is what wires the implementation to the interface at runtime without the high-level code ever referencing the concrete class.",
          "**Why it matters for clean architecture**: this is *exactly* the dependency rule — dependencies point inward toward the domain, which knows nothing about the outer layers. The domain defines repository *ports* (interfaces); the data layer provides *adapters* (implementations); DI connects them. Without DI you couldn't achieve this cleanly — something has to supply the concrete implementation to the abstraction-dependent code, and that something is the DI container/composition root, which lives at the outermost layer.",
          "**Testability falls out of it**: because the high-level code depends on an interface, tests inject a fake implementation. So DIP + DI simultaneously give you clean layering *and* testability — the same structural choice serves both.",
          "**The composition root**: the one place that knows all the concrete types and wires them (the DI module setup, or a manual container) sits at the app's outer edge — it's allowed to depend on everything, precisely so the inner layers don't have to.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: DIP is the *principle* ('depend on abstractions'), and DI is the *technique* that realizes it ('inject the abstraction, supply the implementation externally'). Together they're the backbone of clean architecture — the domain defines interfaces, outer layers implement them, and DI wires it all at the composition root, giving you an app where high-level policy is independent of low-level detail, layers are substitutable, and everything is testable. That's why DI isn't just a convenience for reducing boilerplate — it's the enabling mechanism for the whole layered, testable architecture.",
      },
    ],
  },
  {
    level: "senior",
    q: "When is manual DI appropriate versus adopting a framework like Hilt, and what are the trade-offs?",
    a: [
      {
        t: "p",
        text: "**Manual DI (wiring dependencies by hand in a composition root) is appropriate for small apps, learning, and codebases where the object graph is shallow; a framework becomes worth it as the graph grows deep and scope/singleton management gets complex. The trade-off is boilerplate/complexity now (manual) versus a learning curve and build-time cost (framework) that pays off at scale.**",
      },
      {
        t: "list",
        items: [
          "**Manual DI — pros**: zero dependencies, full transparency (you can read exactly how everything is wired), no framework to learn, no build-time codegen cost, complete control. It's genuinely fine for small apps and is the best way to *understand* DI (frameworks hide the mechanics).",
          "**Manual DI — cons**: boilerplate grows with the app. A deep graph means threading dependencies through many layers of constructors; you manually manage singletons (ensuring one instance) and scopes (per-screen vs app-lifetime); and every dependency change ripples through construction code. Wiring mistakes are runtime problems, and it becomes a maintenance burden at scale.",
          "**Framework (Hilt) — pros**: automates the wiring (declare how to provide each type, framework builds the graph), manages scopes/singletons declaratively, and — for Dagger/Hilt specifically — verifies the graph *at compile time*, turning 'missing or cyclic dependency' into a *build error* rather than a runtime crash. It integrates with Android components (ViewModels, Activities, WorkManager) out of the box. At scale this eliminates enormous boilerplate.",
          "**Framework — cons**: a learning curve (Dagger/Hilt concepts — components, scopes, modules, qualifiers — are non-trivial), added build time from annotation processing (KSP mitigates this), some 'magic' that obscures the wiring, and cryptic error messages when the graph is wrong.",
        ],
      },
      {
        t: "list",
        items: [
          "**The decision heuristic**: for a small app or prototype, manual DI is often the right, simplest choice. For a professional medium-to-large app — especially multi-module, with ViewModels, background workers, and varied scopes — a framework (Hilt is the Android standard) pays for itself by removing boilerplate and catching wiring errors at build time. For KMP shared code, Koin is common (it's multiplatform; Hilt is Android-only).",
          "**A nuance**: 'framework' isn't binary with 'manual' — you can start manual and adopt Hilt later, or use lightweight Koin (runtime, less boilerplate, easier learning curve) as a middle ground between hand-wiring and Dagger's compile-time rigor.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the choice is about *scale and team*, not dogma. Manual DI's cost is linear boilerplate and manual scope management, which is acceptable when small and painful when large. A compile-time framework like Hilt trades a learning curve and build cost for automated wiring and build-time correctness guarantees — a great deal for a real app, overkill for a tiny one. Being able to articulate *why* (graph depth, scope complexity, compile-time verification, team size) rather than reflexively reaching for Hilt everywhere is the mature position.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the three types of injection (constructor, field, method)?",
    a: [
      {
        t: "p",
        text: "Dependencies can be provided three ways: *constructor injection* (passed as constructor parameters — the preferred way), *field injection* (set directly on a field, used for framework-created classes like Activities where you can't control the constructor), and *method/setter injection* (passed to a method — least common). Constructor injection is preferred because dependencies are explicit, the object is fully-formed and immutable, and it's easy to test.",
      },
      {
        t: "code",
        title: "Three ways",
        code: `class A(private val repo: Repo)           // constructor (preferred)
class MyActivity { @Inject lateinit var repo: Repo }   // field (framework classes)
class C { fun setRepo(repo: Repo) { } }   // method/setter (rare)`,
      },
      {
        t: "list",
        items: [
          "**Constructor** — deps as params; explicit, immutable, testable (preferred).",
          "**Field** — set on a field; for Activities/Fragments you don't construct.",
          "**Method/setter** — passed to a method; least common.",
          "**Prefer constructor** — fully-formed objects, easy to test.",
        ],
      },
      {
        t: "note",
        text: "Constructor injection (deps as params — explicit, immutable, testable; preferred), field injection (set on a field — for framework-created classes like Activities), method/setter injection (rare). Prefer constructor injection; use field injection only where you can't control construction.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Inversion of Control (IoC)?",
    a: [
      {
        t: "p",
        text: "Inversion of Control is the principle that an object shouldn't *create* its own dependencies — instead, control of creation/wiring is 'inverted' to an external party (a DI container or the caller). DI is one way to implement IoC. Instead of `class A { val b = B() }` (A controls B's creation), A receives B from outside — decoupling A from *how* B is made.",
      },
      {
        t: "list",
        items: [
          "**IoC** — objects don't create their dependencies; an external party does.",
          "**DI implements IoC** — dependencies are provided, not constructed internally.",
          "**Decoupling** — A doesn't know how B is built.",
          "**'Don't call us, we'll call you'** — the framework wires things.",
        ],
      },
      {
        t: "note",
        text: "Inversion of Control: an object doesn't create its own dependencies — control of creation/wiring is inverted to an external party (container/caller). DI is one implementation of IoC. It decouples a class from HOW its dependencies are built, improving flexibility and testability.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a dependency graph?",
    a: [
      {
        t: "p",
        text: "A dependency graph is the network of objects and their dependencies — a `ViewModel` depends on a `Repository`, which depends on an `ApiService` and a `Dao`, etc. A DI framework *builds this graph* by resolving each type's dependencies transitively, so requesting a `ViewModel` automatically constructs everything it needs in the right order. The graph must be acyclic (no circular dependencies).",
      },
      {
        t: "list",
        items: [
          "**Objects + dependencies** — who needs what, transitively.",
          "**Framework resolves it** — builds the whole graph from the root request.",
          "**Transitive** — requesting one type constructs its entire dependency tree.",
          "**Acyclic** — circular dependencies aren't allowed.",
        ],
      },
      {
        t: "note",
        text: "A dependency graph is the network of objects and their (transitive) dependencies (ViewModel → Repository → Api + Dao). A DI framework builds it by resolving each type's dependencies, so requesting the root constructs everything it needs in order. It must be acyclic (no circular dependencies).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between a service locator and dependency injection?",
    a: [
      {
        t: "p",
        text: "With *dependency injection*, dependencies are *pushed* into an object (via its constructor) — the object declares what it needs and receives it, staying unaware of the container. With a *service locator*, the object *pulls* dependencies by asking a global locator (`ServiceLocator.get<Repo>()`) — which hides dependencies (they're not in the signature), couples code to the locator, and is harder to test. DI is generally preferred.",
      },
      {
        t: "list",
        items: [
          "**DI** — dependencies pushed in (constructor); explicit; testable.",
          "**Service locator** — object pulls from a global registry; hidden deps.",
          "**Hidden dependencies** — locator deps aren't in the signature.",
          "**Coupling** — service locator couples to the locator; DI doesn't.",
        ],
      },
      {
        t: "note",
        text: "DI pushes dependencies into an object (constructor) — explicit, testable, container-unaware. A service locator has the object pull deps from a global registry (ServiceLocator.get()) — hidden dependencies (not in the signature), coupling to the locator, harder to test. DI is generally preferred.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a circular dependency, and how do you break it?",
    a: [
      {
        t: "p",
        text: "A circular dependency is when A depends on B and B depends on A (directly or transitively) — the graph has a cycle, so neither can be constructed first (DI frameworks error at compile/build time). Break it by: introducing an interface/abstraction, using *lazy* injection (`Lazy<T>`/`Provider<T>`) to defer one side, extracting the shared logic into a third component, or rethinking the design (a cycle often signals a responsibility problem).",
      },
      {
        t: "list",
        items: [
          "**Cycle** — A↔B; can't construct either first (build error).",
          "**Lazy/Provider** — defer one dependency's creation.",
          "**Extract** — pull shared logic into a third class.",
          "**Rethink** — a cycle often signals mixed responsibilities.",
        ],
      },
      {
        t: "note",
        text: "A circular dependency (A↔B) makes the graph cyclic — neither can be built first (DI errors at build time). Break it with lazy/Provider injection (defer one side), an interface, extracting shared logic to a third class, or redesigning (a cycle usually signals a responsibility problem).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you inject two different implementations of the same type?",
    a: [
      {
        t: "p",
        text: "Use *qualifiers* (named bindings) to disambiguate — annotate each binding and injection point with a qualifier so the framework knows which one you want. In Dagger/Hilt, `@Named(\"...\")` or custom `@Qualifier` annotations; in Koin, named definitions. Without a qualifier, two bindings of the same type are ambiguous and error.",
      },
      {
        t: "code",
        title: "Qualifiers",
        code: `@Qualifier annotation class Authenticated
@Qualifier annotation class Public

@Provides @Authenticated fun authClient(): OkHttpClient = ...
@Provides @Public fun publicClient(): OkHttpClient = ...

class Repo(@Authenticated private val client: OkHttpClient)`,
      },
      {
        t: "list",
        items: [
          "**Qualifiers** — `@Named`/custom `@Qualifier` distinguish same-typed bindings.",
          "**On both ends** — the binding and the injection point.",
          "**Custom qualifiers** — type-safe (better than string `@Named`).",
          "**Koin** — named definitions serve the same purpose.",
        ],
      },
      {
        t: "note",
        text: "Use qualifiers to inject two implementations of the same type: @Named(\"x\") or custom @Qualifier annotations (Dagger/Hilt) on both the binding and injection point (Koin: named definitions). Custom qualifiers are more type-safe than string @Named. Without one, same-typed bindings are ambiguous.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between compile-time and runtime DI?",
    a: [
      {
        t: "p",
        text: "*Compile-time* DI (Dagger/Hilt) generates the wiring code at build time — errors (missing bindings, cycles) are caught *at compilation*, and there's *no runtime reflection* (fast, small). *Runtime* DI (Koin, older frameworks) resolves the graph *at runtime* — simpler setup, no code generation/build cost, but errors surface *when the app runs* and there's some runtime overhead. Trade compile-time safety/performance vs setup simplicity.",
      },
      {
        t: "table",
        headers: ["", "Compile-time (Dagger/Hilt)", "Runtime (Koin)"],
        rows: [
          ["Errors caught", "at compile", "at runtime"],
          ["Reflection", "none (codegen)", "minimal/DSL"],
          ["Build cost", "annotation processing", "low"],
          ["Setup", "more ceremony", "simpler"],
        ],
      },
      {
        t: "list",
        items: [
          "**Compile-time** — codegen; errors at build; no reflection; fast.",
          "**Runtime** — resolve at runtime; simpler; errors at run; some overhead.",
          "**Dagger/Hilt** — compile-time; **Koin** — runtime.",
          "**Trade-off** — safety/performance vs simplicity/build speed.",
        ],
      },
      {
        t: "note",
        text: "Compile-time DI (Dagger/Hilt): generates wiring at build time — errors (missing bindings/cycles) caught at compilation, no runtime reflection (fast). Runtime DI (Koin): resolves at runtime — simpler, no codegen build cost, but errors surface at runtime with some overhead. Safety/performance vs setup simplicity.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is scope/lifetime in dependency injection?",
    a: [
      {
        t: "p",
        text: "Scope controls *how long* a dependency lives and *how many* instances exist. A *singleton* scope creates one instance shared for the container's lifetime; an *unscoped/factory* binding creates a *new* instance each time it's requested; *lifecycle scopes* (Activity, ViewModel) tie an instance to a component's lifetime. Choosing the right scope prevents leaks (over-scoping) and inconsistency (under-scoping shared state).",
      },
      {
        t: "list",
        items: [
          "**Singleton** — one instance for the container's lifetime.",
          "**Factory/unscoped** — new instance per request.",
          "**Lifecycle scopes** — Activity/ViewModel-scoped instances.",
          "**Right scope** — avoid leaks (over-scope) and inconsistency (under-scope).",
        ],
      },
      {
        t: "note",
        text: "Scope controls a dependency's lifetime and instance count: singleton (one shared for the container lifetime), factory/unscoped (new per request), lifecycle scopes (Activity/ViewModel-tied). Choose the right scope — over-scoping leaks, under-scoping loses shared state.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is lazy or provider injection, and when do you need it?",
    a: [
      {
        t: "p",
        text: "Sometimes you don't want a dependency created *eagerly* at construction. `Lazy<T>` defers creation until first accessed (`lazy.get()`); `Provider<T>` (Dagger) returns a *new* instance each `get()` call (or a fresh scoped one). Use them for expensive dependencies not always needed, to break circular dependencies, or when you need multiple instances over time.",
      },
      {
        t: "code",
        title: "Lazy / Provider",
        code: `class A(private val heavy: Lazy<HeavyThing>) {   // created on first use
    fun use() = heavy.get().doWork()
}
class B(private val factory: Provider<Item>) {   // new instance per get()
    fun make() = factory.get()
}`,
      },
      {
        t: "list",
        items: [
          "**`Lazy<T>`** — deferred creation on first access.",
          "**`Provider<T>`** — new instance per `get()`.",
          "**Uses** — expensive/rarely-used deps, breaking cycles, multiple instances.",
          "**Avoids eager construction** — of the whole graph upfront.",
        ],
      },
      {
        t: "note",
        text: "Lazy<T> defers a dependency's creation until first access; Provider<T> (Dagger) returns a new instance per get(). Use them for expensive/rarely-needed deps, breaking circular dependencies, or getting multiple instances over time — avoiding eager construction of the whole graph.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is assisted injection, and what problem does it solve?",
    a: [
      {
        t: "p",
        text: "Assisted injection handles the case where *some* constructor parameters come from the DI graph but *others* are only known at *runtime* (e.g. an id passed from the UI). You annotate the runtime params `@Assisted` and generate a factory (`@AssistedFactory`) that takes those params and supplies the injected ones. This is common for ViewModels needing a runtime argument (though `SavedStateHandle` often covers it).",
      },
      {
        t: "code",
        title: "Assisted injection",
        code: `class DetailViewModel @AssistedInject constructor(
    private val repo: Repo,                 // from DI
    @Assisted private val itemId: String,   // from runtime
)
@AssistedFactory interface Factory { fun create(itemId: String): DetailViewModel }`,
      },
      {
        t: "list",
        items: [
          "**`@Assisted`** — runtime-provided params.",
          "**`@AssistedFactory`** — a generated factory taking those params.",
          "**Mixes DI + runtime** — graph deps + runtime args.",
          "**Uses** — ViewModels/objects needing a runtime id.",
        ],
      },
      {
        t: "note",
        text: "Assisted injection mixes DI-provided and runtime params: mark runtime ones @Assisted and generate an @AssistedFactory that takes them and supplies the injected deps. For objects/ViewModels needing a runtime argument (an id). (Hilt ViewModels often use SavedStateHandle for the id instead.)",
      },
    ],
  },
  {
    level: "junior",
    q: "How does dependency injection improve testability?",
    a: [
      {
        t: "p",
        text: "Because dependencies are *injected* (not created internally), tests can pass *fakes/mocks* instead of the real ones — a `ViewModel` constructed with a fake repository, so you test its logic without a real network/DB. Without DI, the class creates its own dependencies and you can't substitute them, forcing slow/flaky integration tests. DI makes units *isolatable*.",
      },
      {
        t: "code",
        title: "Injecting a fake",
        code: `// Production: MyViewModel(realRepo)
// Test:
val vm = MyViewModel(FakeRepo(cannedData))   // no real network/DB
vm.load()
assertEquals(expected, vm.state.value)`,
      },
      {
        t: "list",
        items: [
          "**Substitute fakes** — inject test doubles instead of real deps.",
          "**Isolate the unit** — test logic without network/DB.",
          "**Fast/deterministic** — no real I/O.",
          "**Without DI** — internal creation blocks substitution.",
        ],
      },
      {
        t: "note",
        text: "DI lets tests inject fakes/mocks instead of real dependencies — construct a ViewModel with a FakeRepo to test its logic without real network/DB (fast, deterministic, isolated). Without DI, a class creates its own dependencies and you can't substitute them, forcing slow/flaky integration tests.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the 'too many constructor parameters' smell, and what does it indicate?",
    a: [
      {
        t: "p",
        text: "When a class needs *many* injected dependencies (say 6+), it's often a sign the class has *too many responsibilities* (violating the Single Responsibility Principle). The fix is usually to *split* the class or *group* related dependencies into a cohesive collaborator, not to work around it (e.g. via a service locator). DI surfaces this smell clearly — a long constructor is a design signal.",
      },
      {
        t: "list",
        items: [
          "**Many deps** — often too many responsibilities (SRP violation).",
          "**Fix by splitting** — smaller classes / grouping related deps into a collaborator.",
          "**Don't hide it** — service locators mask the smell, don't fix it.",
          "**DI surfaces it** — the constructor makes coupling visible.",
        ],
      },
      {
        t: "note",
        text: "A constructor with many (6+) injected dependencies signals too many responsibilities (SRP violation). Fix by splitting the class or grouping related dependencies into a cohesive collaborator — don't hide it with a service locator. DI makes this smell visible via the constructor.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does DI enable programming to interfaces?",
    a: [
      {
        t: "p",
        text: "DI lets you depend on *abstractions* (interfaces) and inject the *concrete* implementation — a `ViewModel` depends on a `Repository` interface, and DI binds it to `RepositoryImpl`. This decouples the consumer from the implementation, so you can swap implementations (real vs fake, or different strategies) without changing the consumer. It's the practical enabler of the Dependency Inversion Principle.",
      },
      {
        t: "code",
        title: "Interface binding",
        code: `interface Repository { suspend fun load(): Data }
class RepositoryImpl(...) : Repository
// DI binds Repository -> RepositoryImpl
class MyViewModel(private val repo: Repository)   // depends on the interface`,
      },
      {
        t: "list",
        items: [
          "**Depend on interfaces** — the consumer knows only the abstraction.",
          "**Inject the impl** — DI binds interface → implementation.",
          "**Swappable** — real/fake/alternative implementations.",
          "**Enables DIP** — high-level code doesn't depend on low-level details.",
        ],
      },
      {
        t: "note",
        text: "DI lets you depend on interfaces and inject the concrete implementation (Repository → RepositoryImpl) — decoupling the consumer from the impl so you can swap (real/fake/alternative) without changing it. It's the practical enabler of the Dependency Inversion Principle (@Binds does this efficiently in Dagger).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a DI container or component, conceptually?",
    a: [
      {
        t: "p",
        text: "A DI container (Dagger 'component', Koin 'module'/container) is the object that *holds the bindings* (how to create each type) and *resolves the graph* when you request something. It knows the recipes for all dependencies and constructs them (respecting scopes) on demand. Your code asks the container for a type; the container builds and returns it with all its dependencies wired.",
      },
      {
        t: "list",
        items: [
          "**Holds bindings** — recipes for creating each type.",
          "**Resolves the graph** — constructs a type + its dependencies on request.",
          "**Respects scopes** — reuses singletons, creates factories.",
          "**Dagger Component / Koin container** — the concrete forms.",
        ],
      },
      {
        t: "note",
        text: "A DI container/component holds the bindings (how to create each type) and resolves the graph on request — constructing a type with all its dependencies wired, respecting scopes (singletons reused, factories new). Dagger calls it a Component; Koin has modules/a container.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is eager versus lazy initialization of dependencies?",
    a: [
      {
        t: "p",
        text: "*Eager* initialization creates a dependency immediately (e.g. at app startup / when the component is built) — ready to use but adds to startup cost. *Lazy* initialization defers creation until first use — faster startup, but a small cost on first access. Balance them: eagerly init things needed immediately (a crash reporter), lazily init expensive things used later (a heavy parser).",
      },
      {
        t: "list",
        items: [
          "**Eager** — created upfront; ready but adds startup cost.",
          "**Lazy** — created on first use; faster startup.",
          "**Balance** — eager for immediately-needed, lazy for expensive/later.",
          "**Startup impact** — too much eager init slows cold start.",
        ],
      },
      {
        t: "note",
        text: "Eager init creates a dependency immediately (ready, but adds startup cost); lazy init defers to first use (faster startup, small first-access cost). Balance: eager for immediately-needed deps (crash reporter), lazy for expensive/later ones (heavy parser). Too much eager init slows cold start.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does dependency injection support modularization?",
    a: [
      {
        t: "p",
        text: "In a multi-module app, DI lets modules depend on *interfaces* defined in shared/api modules while implementations live in separate modules — so feature modules don't depend on each other's internals. The DI framework wires the concrete implementations at the app level. This keeps modules decoupled, enables replacing implementations, and supports independent development/testing.",
      },
      {
        t: "list",
        items: [
          "**Interface in api module** — implementation in a separate module.",
          "**App wires concretes** — the DI graph assembled at the top.",
          "**Decoupled modules** — features depend on abstractions, not each other.",
          "**Swappable/testable** — replace implementations per module.",
        ],
      },
      {
        t: "note",
        text: "DI supports modularization: modules depend on interfaces (in shared/api modules) while implementations live in separate modules, and the DI framework wires concretes at the app level. Keeps feature modules decoupled (depend on abstractions, not each other's internals), swappable, and independently testable.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between DI and the factory pattern?",
    a: [
      {
        t: "p",
        text: "A *factory* is a class/method whose job is to *create* objects (encapsulating construction logic). *DI* is broader — it's about *providing* dependencies to objects (which may use factories internally). DI frameworks often *generate* factories for you. You still use explicit factories for runtime-parameterized creation (assisted injection) or complex construction; DI handles the wiring of the graph.",
      },
      {
        t: "list",
        items: [
          "**Factory** — creates objects; encapsulates construction.",
          "**DI** — provides dependencies (may use factories internally).",
          "**DI generates factories** — for you (Dagger).",
          "**Explicit factories** — for runtime args / complex creation.",
        ],
      },
      {
        t: "note",
        text: "A factory creates objects (encapsulating construction logic); DI is broader — providing dependencies to objects (and DI frameworks often generate factories). Use explicit factories for runtime-parameterized/complex creation (assisted injection); DI wires the overall graph. They complement each other.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you inject dependencies into framework-created classes like Activities?",
    a: [
      {
        t: "p",
        text: "You don't construct Activities/Fragments/Services yourself (the system does), so you can't use constructor injection. Instead use *field injection*: annotate fields `@Inject` and have the framework populate them (Hilt does this automatically for `@AndroidEntryPoint`-annotated classes). The DI framework injects into the instance the system created.",
      },
      {
        t: "code",
        title: "Field injection into an Activity",
        code: `@AndroidEntryPoint
class MyActivity : AppCompatActivity() {
    @Inject lateinit var analytics: Analytics   // populated by Hilt
}`,
      },
      {
        t: "list",
        items: [
          "**Framework constructs them** — can't use constructor injection.",
          "**Field injection** — `@Inject lateinit var`.",
          "**Hilt `@AndroidEntryPoint`** — auto-injects Android classes.",
          "**ViewModels** — constructor-injected (Hilt handles the factory).",
        ],
      },
      {
        t: "note",
        text: "Activities/Fragments/Services are system-constructed, so use field injection (@Inject lateinit var) — Hilt populates them for @AndroidEntryPoint classes. ViewModels are the exception: constructor-injected (Hilt provides the factory via @HiltViewModel).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is manual DI, and what does it look like?",
    a: [
      {
        t: "p",
        text: "Manual DI means wiring the graph *by hand* — a container class (or the Application) that constructs dependencies and passes them down, with no framework. It's fine for small apps: explicit, no build cost, no learning curve. But it becomes tedious/error-prone as the graph grows (scopes, lifecycles, many dependencies) — which is when a framework (Hilt/Koin) pays off.",
      },
      {
        t: "code",
        title: "Manual container",
        code: `class AppContainer(context: Context) {
    private val db = Room.databaseBuilder(...).build()
    private val api = Retrofit.Builder()...create(Api::class.java)
    val userRepository = UserRepository(api, db.userDao())
}
// Application holds AppContainer; screens pull from it`,
      },
      {
        t: "list",
        items: [
          "**Hand-wired** — a container/Application constructs and passes deps.",
          "**No framework** — explicit, no build cost/learning curve.",
          "**Good for small apps** — clear and simple.",
          "**Scales poorly** — scopes/lifecycles/many deps get tedious → use a framework.",
        ],
      },
      {
        t: "note",
        text: "Manual DI wires the graph by hand — a container class (or Application) constructs dependencies and passes them down, no framework. Explicit, no build cost, fine for small apps. It gets tedious/error-prone with scopes, lifecycles, and many dependencies — where Hilt/Koin pays off.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the singleton anti-pattern, and how does a DI singleton scope differ?",
    a: [
      {
        t: "p",
        text: "The *singleton anti-pattern* is a globally-accessible `object`/static instance that classes reach out to directly — it hides dependencies, couples code globally, and is hard to test/replace. A *DI singleton scope* achieves one shared instance but *injects* it (explicit in constructors) and lets you *swap* it in tests — keeping the single-instance benefit without the global-access downsides.",
      },
      {
        t: "list",
        items: [
          "**Singleton anti-pattern** — global object; hidden deps, global coupling, untestable.",
          "**DI singleton scope** — one shared instance, but injected and swappable.",
          "**Explicit** — appears in constructors, not hidden global access.",
          "**Testable** — provide a fake for the scoped instance.",
        ],
      },
      {
        t: "note",
        text: "The singleton anti-pattern is a global object classes reach out to directly — hidden dependencies, global coupling, hard to test/replace. A DI singleton scope gives one shared instance but injects it (explicit in constructors) and lets tests swap it — single-instance benefit without global-access downsides.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the overhead or cost of using a DI framework?",
    a: [
      {
        t: "p",
        text: "Costs vary: *compile-time* frameworks (Dagger/Hilt) add *build time* (annotation processing/KSP) and a learning curve, but *no runtime reflection* (fast at runtime, small). *Runtime* frameworks (Koin) add slight *runtime* overhead and defer error detection to runtime, but faster builds. Both add some conceptual complexity. For most non-trivial apps the maintainability/testability benefits outweigh the costs.",
      },
      {
        t: "list",
        items: [
          "**Dagger/Hilt** — build-time cost (annotation processing), learning curve; fast runtime.",
          "**Koin** — slight runtime overhead, runtime error detection; fast builds.",
          "**Complexity** — a concept/setup cost either way.",
          "**Worth it** — for non-trivial apps (maintainability/testability).",
        ],
      },
      {
        t: "note",
        text: "DI framework costs: Dagger/Hilt add build time (annotation processing/KSP) + a learning curve but no runtime reflection (fast); Koin adds slight runtime overhead and defers errors to runtime but builds faster. Both add conceptual complexity. For non-trivial apps the maintainability/testability benefits outweigh the cost.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why is field injection generally discouraged compared to constructor injection?",
    a: [
      {
        t: "p",
        text: "Field injection hides dependencies (they're not in the constructor signature — you can construct the object incompletely), requires mutable `lateinit var` fields (risking `UninitializedPropertyAccessException`), and makes testing harder (you must reflectively set fields or use the framework). Constructor injection makes dependencies explicit, produces fully-formed immutable objects, and is trivially testable — so it's preferred everywhere you control construction.",
      },
      {
        t: "list",
        items: [
          "**Hidden deps** — not in the constructor signature.",
          "**Mutable `lateinit`** — risk of uninitialized access.",
          "**Harder to test** — can't just pass fakes to a constructor.",
          "**Constructor injection** — explicit, immutable, testable (prefer it).",
        ],
      },
      {
        t: "note",
        text: "Field injection hides dependencies (not in the signature — incomplete construction possible), needs mutable lateinit vars (UninitializedPropertyAccessException risk), and complicates testing. Constructor injection is explicit, immutable, and trivially testable — prefer it wherever you control construction (field injection only for framework classes).",
      },
    ],
  },
  {
    level: "senior",
    q: "How does DI relate to the Dependency Inversion Principle?",
    a: [
      {
        t: "p",
        text: "The Dependency Inversion Principle (the 'D' in SOLID) says high-level modules should depend on *abstractions*, not concrete low-level details, and abstractions shouldn't depend on details. DI is the *mechanism* that realizes this: high-level code declares a dependency on an interface, and DI injects the concrete implementation — so the high-level module never references the concrete class. DIP is the principle; DI is a way to apply it.",
      },
      {
        t: "list",
        items: [
          "**DIP** — depend on abstractions, not concretions.",
          "**DI realizes it** — inject the concrete for a declared interface.",
          "**High-level decoupled** — never references low-level classes.",
          "**Principle vs mechanism** — DIP is the goal; DI is the tool.",
        ],
      },
      {
        t: "note",
        text: "The Dependency Inversion Principle: high-level modules depend on abstractions, not concrete details. DI is the mechanism that realizes it — high-level code declares a dependency on an interface, DI injects the concrete implementation, so it never references the concrete class. DIP is the principle; DI applies it.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a multibinding (injecting a set or map of implementations)?",
    a: [
      {
        t: "p",
        text: "Multibindings let you contribute multiple implementations to a *collection* injected as a `Set<T>` or `Map<K, T>` — each module adds bindings with `@IntoSet`/`@IntoMap`, and a consumer injects the whole set/map. It's ideal for plugin-style architectures: many modules register handlers/initializers, and a coordinator injects and iterates them without knowing each one.",
      },
      {
        t: "code",
        title: "Multibinding",
        code: `@Binds @IntoSet fun bindA(a: HandlerA): Handler
@Binds @IntoSet fun bindB(b: HandlerB): Handler
class Dispatcher(private val handlers: Set<@JvmSuppressWildcards Handler>)   // all of them`,
      },
      {
        t: "list",
        items: [
          "**`@IntoSet`/`@IntoMap`** — contribute to a collection.",
          "**Inject `Set<T>`/`Map<K,T>`** — the aggregated implementations.",
          "**Plugin architecture** — modules register; a coordinator iterates.",
          "**Decoupled** — the consumer doesn't know each contributor.",
        ],
      },
      {
        t: "note",
        text: "Multibindings contribute multiple implementations to a Set<T>/Map<K,T> via @IntoSet/@IntoMap; a consumer injects the whole collection. Great for plugin architectures — many modules register handlers/initializers and a coordinator injects and iterates them without knowing each one.",
      },
    ],
  },
];

export default qa;
