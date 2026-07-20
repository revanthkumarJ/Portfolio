// DI Fundamentals & Concepts — Content tab. Teaching-first.

const content = [
  {
    heading: "What dependency injection is",
    blocks: [
      {
        t: "p",
        text: "**Dependency injection (DI)** is a simple idea with a fancy name: instead of a class *creating* the objects it needs (its 'dependencies'), those objects are *given to it* from the outside — usually through its constructor. A class that needs a `Repository` doesn't do `val repo = Repository(Api(), Database())` inside itself; instead it declares `class ViewModel(private val repo: Repository)` and someone *provides* the repository when creating the ViewModel. The 'inversion' is that the class no longer controls *how* its dependencies are built — that control is inverted to the caller.",
      },
      {
        t: "code",
        title: "Without DI vs with DI",
        code: `// WITHOUT DI — the class creates its own dependencies (tightly coupled)
class UserViewModel {
    private val repository = UserRepository(     // hardcoded construction
        RetrofitApi(OkHttpClient()),
        AppDatabase.getInstance()
    )
}

// WITH DI — dependencies are provided from outside (loosely coupled)
class UserViewModel(
    private val repository: UserRepository,      // just declares what it needs
)
// Someone else decides how to build the repository and passes it in.`,
      },
      {
        t: "list",
        items: [
          "**The core move**: 'don't create your dependencies, ask for them'. The class declares *what* it needs; something external decides *how* to build and supply it.",
          "**Constructor injection** is the primary and preferred form — dependencies come through the constructor. (Field/setter injection exists but is inferior — see later.)",
          "DI is a *pattern*, not a library. You can do it *manually* (pass dependencies by hand). Libraries like Hilt, Dagger, and Koin *automate* it, but the concept is independent of any tool.",
        ],
      },
    ],
  },
  {
    heading: "Why DI matters — the benefits",
    blocks: [
      {
        t: "list",
        items: [
          "**Testability** — the biggest reason. If a class creates its own dependencies, tests are stuck with the real ones (real network, real database). With DI, a test *injects fakes/mocks* — a fake repository instead of a real one — so you can test the class in isolation, fast and deterministically. DI is what makes unit testing practical.",
          "**Loose coupling / flexibility** — a class depends on an *abstraction* (an interface) that's injected, not a concrete implementation it hardcodes. You can swap implementations (a real repository, a fake, a different backend) without changing the class. This enables the dependency-inversion principle.",
          "**Single responsibility** — a class focused on its actual job shouldn't also be responsible for constructing a whole graph of dependencies. DI removes construction concerns, keeping classes focused.",
          "**Reusability** — a class that receives its dependencies works in any context that can provide them; one that hardcodes them is stuck.",
          "**Centralized, controlled object creation** — the wiring of what-depends-on-what lives in one place (the DI setup / composition root), making the app's structure explicit and changeable.",
        ],
      },
      {
        t: "note",
        text: "If asked 'why use DI?', lead with *testability* — it's the most concrete, undeniable benefit. A class that `new`s its dependencies can't have those dependencies replaced in tests, so you're forced into slow, flaky integration tests. DI lets you inject fakes and unit-test cleanly. The other benefits (loose coupling, SRP, flexibility) follow from the same 'don't create, receive' principle.",
      },
    ],
  },
  {
    heading: "DI and the dependency inversion principle",
    blocks: [
      {
        t: "p",
        text: "DI is closely tied to the **Dependency Inversion Principle** (the 'D' in SOLID): high-level modules should depend on *abstractions*, not concrete low-level details. DI is the *mechanism* that delivers this — by injecting an interface, the high-level class depends on the abstraction, and the concrete implementation is supplied from outside.",
      },
      {
        t: "code",
        title: "Injecting an abstraction",
        code: `// The ViewModel depends on the INTERFACE, not a concrete class
class UserViewModel(private val repository: UserRepository)  // UserRepository is an interface

interface UserRepository { suspend fun getUser(id: String): User }

class UserRepositoryImpl(...) : UserRepository { ... }        // real implementation
class FakeUserRepository(...) : UserRepository { ... }        // test implementation

// DI binds the interface to an implementation — production uses the real one,
// tests inject the fake. The ViewModel never changes.`,
      },
      {
        t: "list",
        items: [
          "**Depend on interfaces, inject implementations**: the class references the abstraction (`UserRepository`); DI supplies the concrete type (`UserRepositoryImpl` in production, `FakeUserRepository` in tests).",
          "This is what makes the whole app *substitutable and testable* — the essence of clean architecture's dependency rule, realized through DI.",
          "Don't over-abstract: not every class needs an interface. Add an interface when you genuinely need substitutability (across modules, for testing a boundary, for multiple implementations). A concrete class can be injected directly and faked with an open class or a test double if needed.",
        ],
      },
    ],
  },
  {
    heading: "Manual DI vs a DI framework",
    blocks: [
      {
        t: "p",
        text: "You can do DI entirely by hand — construct objects and pass them down. For a small app this is fine and has zero dependencies. But as the app grows, manual wiring becomes tedious and error-prone: a deep object graph means threading dependencies through many constructors, managing singletons and scopes manually, and updating lots of construction code when dependencies change. This is why DI *frameworks* exist.",
      },
      {
        t: "code",
        title: "Manual DI — a composition root",
        code: `// A container that builds the object graph by hand (manual DI)
class AppContainer(context: Context) {
    private val api = RetrofitApi(OkHttpClient())
    private val db = AppDatabase.build(context)
    val userRepository: UserRepository = UserRepositoryImpl(api, db.userDao())
    // ViewModels get their dependencies from here
}`,
      },
      {
        t: "list",
        items: [
          "**Manual DI** — you write the wiring yourself in a 'container' / 'composition root'. Pros: no library, full control, easy to understand. Cons: boilerplate grows with the app, manual scope/singleton management, error-prone as the graph deepens.",
          "**DI frameworks** automate the wiring: you *declare* how to provide each dependency, and the framework generates or resolves the graph. **Dagger/Hilt** do it at *compile time* (code generation, verified at build); **Koin** does it at *runtime* (a service-locator-style registry). More on these in the following topics.",
          "**When to use which**: manual DI is genuinely fine for small apps and is a good way to understand the pattern. For medium-to-large apps (the typical professional context), a framework (Hilt on Android) pays off by eliminating the boilerplate and catching wiring errors — Hilt at compile time, in particular, turns 'missing dependency' into a build error rather than a runtime crash.",
        ],
      },
    ],
  },
  {
    heading: "Types of injection",
    blocks: [
      {
        t: "table",
        headers: ["Type", "How", "Verdict"],
        rows: [
          ["Constructor injection", "dependencies passed via the constructor", "preferred — immutable, explicit, guaranteed set"],
          ["Field/property injection", "dependencies set on fields after construction", "needed for framework-created classes (Activities); otherwise avoid"],
          ["Method/setter injection", "dependencies passed to a method/setter", "rare; for optional or reconfigurable dependencies"],
        ],
      },
      {
        t: "list",
        items: [
          "**Constructor injection is preferred**: dependencies are `val` (immutable), the object is fully-formed and valid the moment it's constructed (no half-initialized state), and its needs are explicit in the signature. Prefer it always when you control construction.",
          "**Field injection** is a compromise for classes *you don't construct* — Android creates Activities/Fragments, so you can't inject via their constructor; instead the framework injects into annotated fields *after* creation (`@Inject lateinit var`). It's necessary there but inferior generally (mutable, can be accessed before injection, hidden dependencies).",
          "**The rule**: constructor injection everywhere you can; field injection only for framework-instantiated entry points (Activities, Fragments, Services) where the constructor isn't yours to control.",
        ],
      },
    ],
  },
];

export default content;
