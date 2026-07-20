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
];

export default qa;
