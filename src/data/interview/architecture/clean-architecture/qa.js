// Clean Architecture — Interview Prep tab.

const qa = [
  {
    level: "junior",
    q: "What is Clean Architecture and what is the Dependency Rule?",
    a: [
      {
        t: "p",
        text: "Clean Architecture (Uncle Bob, 2012) organizes code in concentric layers — business entities and use cases at the center, interface adapters around them, frameworks (UI, DB, network) at the edge. The **Dependency Rule** is its single law: source-code dependencies may only point **inward** — inner layers never know about outer ones. On Android that means the domain layer has zero Android/library imports, and things like Retrofit or Room are outer details the core never names. The payoff: business logic that's testable without an emulator and details you can swap without touching the core.",
      },
    ],
  },
  {
    level: "junior",
    q: "Describe the three layers of a typical Android Clean Architecture app.",
    a: [
      {
        t: "list",
        items: [
          "**Presentation/UI**: Activities/Composables render state; ViewModels hold UI state and call the layer below.",
          "**Domain**: pure Kotlin — domain models, use cases, and (in strict Clean) repository *interfaces*. No Android imports.",
          "**Data**: repository *implementations*, remote/local data sources (Retrofit/Ktor, Room/SQLDelight), DTOs and DB entities, and mappers to domain models.",
        ],
      },
      {
        t: "p",
        text: "Dependencies: presentation → domain ← data. Both outer layers depend on domain; domain depends on nothing — the data layer's arrow points inward because it *implements* interfaces the domain defines.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a use case (interactor) and when should you create one?",
    a: [
      {
        t: "p",
        text: "A class encapsulating **one business action** — `GetPersonalizedFeedUseCase` — conventionally with a single `operator fun invoke()`, stateless, main-safe, depending on repository interfaces. Create one when logic **combines multiple repositories**, is **reused across ViewModels**, or encodes **real business policy** (ranking, eligibility, pricing). A use case that only forwards `repo.getUser(id)` adds nothing but a file — some teams still mandate them for uniformity and future-proofing; be able to argue both sides and note Google's guidance makes the whole domain layer optional.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the Repository pattern and what problems does it solve?",
    a: [
      {
        t: "p",
        text: "A repository is the single entry point for one kind of data — it hides *where* data lives (network, DB, cache), decides the merge/refresh strategy, and exposes clean domain types via suspend functions and Flows. Problems solved: ViewModels no longer know about Retrofit/Room (swap or add sources freely), caching and offline logic exist **once** instead of per-screen, tests substitute an in-memory fake behind the interface, and the app gets a **single source of truth** so two screens can't disagree about the same data.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why does the domain layer have no Android dependencies?",
    a: [
      {
        t: "p",
        text: "Three concrete wins. **Testability**: pure Kotlin runs as plain JVM unit tests — fast, no Robolectric/emulator. **Portability**: an Android-free domain drops into KMP `commonMain` unchanged — the iOS app runs the same business rules. **Stability**: Android APIs, UI toolkits and libraries churn constantly; business rules shouldn't have to change when the framework does. The Dependency Rule is what protects all three — one `import android.*` in domain and you've lost them.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a DTO, a database entity, and a domain model? Why not one class for all?",
    a: [
      {
        t: "p",
        text: "A **DTO** mirrors the API contract (serialization names, everything nullable because servers lie); a **DB entity** mirrors storage (Room annotations, indices, foreign keys); a **domain model** mirrors business meaning (non-null invariants, value types, behavior). One class serving all three masters means a server field rename touches your database schema and your composables, Room annotations leak into business code, and nullability from the network infects every layer. Mapping at boundaries (`ArticleDto.toDomain()`) contains each concern. Honest caveat worth adding: in a tiny app, one model is a defensible YAGNI shortcut — split when shapes start diverging.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does 'Single Source of Truth' mean in the data layer?",
    a: [
      {
        t: "p",
        text: "One designated place — usually the local database — is what the app *reads*; everything else feeds it. The network never returns data straight to the UI: a refresh **writes into the DB**, and the UI updates because it *observes* the DB (Room/SQLDelight Flows). Benefits: every screen shows consistent data, offline reads work automatically, and there's exactly one merge point for remote and local changes. This is the pattern behind 'observe local, refresh remote' repositories.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does dependency injection relate to Clean Architecture?",
    a: [
      {
        t: "p",
        text: "Clean Architecture *requires* construction to happen somewhere outside the layers: the ViewModel needs a use case, the use case needs an `ArticleRepository`, and the actual `ArticleRepositoryImpl` lives in a layer the domain must not know. A DI container (Hilt/Koin) is that assembly point — the composition root binds interface → implementation (`@Binds ArticleRepositoryImpl into ArticleRepository`), so every layer receives its dependencies as abstractions through constructors. Side benefits: swapping fakes in tests is a binding change, and scoping (singleton repository, screen-scoped ViewModel) is declared in one place. DI isn't *part* of Clean Architecture — it's the mechanism that makes the Dependency Rule practical.",
      },
    ],
  },
  {
    level: "senior",
    q: "Where should repository interfaces live — domain or data layer? Argue it properly.",
    a: [
      {
        t: "p",
        text: "**Strict Clean: in domain.** The interface is the *port* the domain defines for what it needs; data implements it. This is dependency inversion doing its job — domain compiles standalone, use cases are testable against the port, and in KMP/multi-module setups the domain module genuinely doesn't depend on the data module. **Google's guide: in data.** Their reasoning: most apps don't swap implementations, the domain layer is optional in their architecture, and one interface + one impl in different modules is ceremony for typical apps — so the data layer just exposes its API.",
      },
      {
        t: "p",
        text: "My resolution: it's decided by **who needs the seam**. If a domain layer exists and use cases must be testable/portable without data-layer code (KMP especially), the interface belongs to domain — that's the whole point of the port. If ViewModels call repositories directly and there's no domain module, an interface in data (or even a concrete class with a fake for tests) is honest. The failure mode to name: interface-in-domain but *shaped exactly like the impl* (leaking DTO-ish types, one method per endpoint) — that's inversion theater; the port should be expressed in domain vocabulary.",
      },
    ],
  },
  {
    level: "senior",
    q: "Your team writes a pass-through use case for every repository method 'for consistency'. Defend or attack this policy.",
    a: [
      {
        t: "p",
        text: "**Attack**: pass-throughs violate the reason use cases exist — they add a class, a file, DI wiring and a stack frame while encoding zero business knowledge. Cost is real: navigation overhead reading code, slower onboarding ('is there logic in here? no, never'), and diluted signal — when every call has a use case, the ones containing actual policy don't stand out. YAGNI says add the class when logic appears; refactoring a direct repository call into a use case later is a five-minute, tooling-assisted change.",
      },
      {
        t: "p",
        text: "**Steelman before concluding**: uniformity has value at scale — 'ViewModels never touch repositories' is a rule a lint check can enforce without judgment calls, it pre-creates the seam so adding cross-cutting logic (analytics, authorization) later touches one layer, and juniors can't pick the wrong dependency. Verdict I'd give: for a large org with codegen/lint enforcement, mandatory use cases are a defensible *convention* tax; for a small team, rule-of-three pragmatism wins. What's non-negotiable either way is the direction: when a use case exists, the ViewModel must not *also* bypass it.",
      },
    ],
  },
  {
    level: "senior",
    q: "Design the error-handling strategy across all three layers. Where are exceptions caught, and what crosses each boundary?",
    a: [
      {
        t: "list",
        items: [
          "**Data**: catch transport garbage at the source (IOException, HTTP codes, JSON errors) and translate into a **typed error vocabulary** — `sealed interface DataError` (NoConnection, Unauthorized, NotFound, Unknown(cause)). Nothing library-specific crosses upward: `HttpException` escaping the data layer is a layering bug.",
          "**Domain**: business failures are **values in return types** (`Result<Order, OrderError>` / sealed results) — `InsufficientFunds` is an expected outcome, not an exception. Use cases may *translate* data errors into business terms (NotFound → `ProductDiscontinued`).",
          "**Presentation**: exhaustive `when` over the sealed error → UX decision (retry UI for connectivity, auth flow for Unauthorized, generic toast + log for Unknown). Never string-match messages.",
          "**Two global rules**: `CancellationException` is always rethrown, at every layer — a blanket `runCatching` that swallows it breaks structured concurrency (use a `runSuspendCatching` helper); and long-lived observation Flows must catch *inside* (emit error values) because a terminal exception kills the collection permanently.",
        ],
      },
      {
        t: "p",
        text: "The design principle to state: **each layer speaks errors in its own vocabulary**, translated at the same boundaries where models are mapped — errors *are* part of the model.",
      },
    ],
  },
  {
    level: "senior",
    q: "What does 'main-safe' mean and which layer owns dispatcher switching? What are the common mistakes?",
    a: [
      {
        t: "p",
        text: "Main-safe: any suspend function can be called from the main thread without blocking it — the function itself moves work where it belongs. **The layer doing the blocking work owns the switch**: a repository doing heavy mapping wraps in `withContext(ioDispatcher/defaultDispatcher)`; use cases wrap their own CPU work; the ViewModel then simply launches in `viewModelScope` with no dispatcher juggling.",
      },
      {
        t: "list",
        items: [
          "Mistake 1 — **caller-side hopping**: ViewModels wrapping every call in `withContext(IO)` 'just in case'; scatters threading policy everywhere and hides which layer actually blocks.",
          "Mistake 2 — **hardcoding `Dispatchers.IO`**: kills virtual-time testing; inject dispatchers (constructor params / DispatcherProvider).",
          "Mistake 3 — cargo-cult wrapping of **Room/Retrofit suspend calls** — they're already main-safe; the extra `withContext` is noise (harmless, but shows shallow understanding when probed).",
          "Mistake 4 — collector-side `flowOn` confusion: `flowOn` affects *upstream* only; the layer owning the heavy operator applies it, not the UI.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "How do you structure Clean Architecture in a KMP project, and what changes versus Android-only?",
    a: [
      {
        t: "list",
        items: [
          "**Domain + data move to `commonMain`**: models, use cases, repository ports and implementations shared; Ktor/SQLDelight (or Room KMP) as common data sources, with platform bits (DB driver, HTTP engine, file paths) injected via `expect/actual` or DI.",
          "**The Dependency Rule becomes compiler-enforced**: `commonMain` physically cannot import Android — KMP turns Clean's discipline from convention into a build error, which is the strongest practical argument for strict layering there.",
          "**Presentation splits by strategy**: Compose Multiplatform → shared ViewModels (androidx KMP ViewModel) all the way; native SwiftUI → shared state holders bridged via SKIE/adapters, with thin platform view layers.",
          "**Strict-Clean choices start paying rent**: ports-in-domain, injected dispatchers, typed errors — all the things that felt ceremonial on Android-only become load-bearing when two platforms and their tests consume the same core.",
          "What changes in judgment: the 'is a domain layer worth it?' question mostly disappears — sharing *is* the payoff; the new hard questions are where presentation logic lives (shared vs per-platform) and keeping the iOS bridge thin.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "How does Clean Architecture interact with Jetpack Paging, WorkManager, and other framework libraries that want to cross layers?",
    a: [
      {
        t: "p",
        text: "This is the honest pain point — several Jetpack libraries are architecturally invasive, and the senior answer is knowing where to bend. **Paging**: `PagingData`/`Flow<PagingData<T>>` is designed to flow from data layer to UI *as a type* — purists wrap it, but fighting it costs the library's main value (state handling, invalidation); the pragmatic standard is treating Paging types as an allowed cross-layer vocabulary while keeping the *items* as domain/UI models via `map`. **WorkManager**: workers are entry points like Activities — they should be thin, immediately delegating to injected use cases/repositories (HiltWorker), never containing business logic. **Room/DataStore observation**: expose as Flows of domain types at the repository boundary — that one's easy.",
      },
      {
        t: "p",
        text: "The generalizable principle: framework types may act as **plumbing across layers** when a library's core value depends on it, but **decisions** stay in your layers, and the framework type never becomes a parameter of business logic. State it as a trade-off you make knowingly, not a rule you broke.",
      },
    ],
  },
  {
    level: "senior",
    q: "A pull-to-refresh must update data shown on three different screens simultaneously. Walk through how your architecture handles it.",
    a: [
      {
        t: "p",
        text: "This is the SSOT pattern's showcase. All three screens' ViewModels observe the same repository stream (`observeArticles(): Flow<List<Article>>`), which reads from the database. The refresh — triggered from any screen — calls `repository.refresh()`, which fetches from network and **writes into the database**. Room/SQLDelight invalidation re-emits the query, every observing Flow fires, and all three screens update in the same frame — no screen-to-screen communication, no event bus, no 'notify others' code at all.",
      },
      {
        t: "list",
        items: [
          "Loading/error state for the *gesture* is per-screen (the initiating ViewModel tracks its own `isRefreshing` around the suspend call) — shared data, local UI state: an important separation to name.",
          "In-flight de-duplication (two screens refreshing at once) is a repository concern — a mutex or shared in-flight job, solved once.",
          "Contrast the alternatives interviewers are fishing for you to reject: shared ViewModels stretched across unrelated screens, or broadcast/event buses — both reinvent SSOT badly.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "Critique Clean Architecture: when is it the wrong choice, and what do its critics get right?",
    a: [
      {
        t: "list",
        items: [
          "**The ceremony critique is correct in the small**: for a 2-screen app, four model types, mandatory use cases and five modules are cost without benefit — you're maintaining translation machinery for translations that never vary.",
          "**'Swap the framework' is mostly a myth**: nobody replaces Room with realm on a whim; arguing Clean from swappability is weak. The *real* recurring payoffs are unit-testable logic, parallel team workstreams, and KMP portability — argue from those.",
          "**Indirection has a comprehension price**: following one button tap through VM → use case → port → impl → source is six files; without strong naming conventions this actively slows debugging.",
          "**Dogma drift**: teams enforcing pattern compliance in review while shipping slowly have inverted means and ends; Google's own guide (optional domain layer) is the institutional acknowledgment.",
          "**When I'd skip it**: prototypes/MVPs, single-developer utility apps, heavily server-driven UI where the client has little logic to protect.",
        ],
      },
      {
        t: "p",
        text: "Then land it: the judgment skill is *scaling architecture to stakes* — start with ViewModel + repository + SSOT (cheap, huge payoff), add domain/use cases when business logic or team size demands, add strict ports when KMP or module boundaries appear. Architecture is bought in increments, not installed as a religion.",
      },
    ],
  },
  {
    level: "senior",
    q: "Map each SOLID principle to a concrete decision in an Android Clean Architecture codebase.",
    a: [
      {
        t: "list",
        items: [
          "**S** — one use case per business action; repository per domain concept; screen-scoped ViewModels. Violation smell: a 'UserManager' doing auth + profile + settings.",
          "**O** — sealed error/state hierarchies grow by adding variants (compiler finds every `when` to update); new data source slots in behind the repository with zero consumer changes.",
          "**L** — the test fake for `ArticleRepository` must honor the port's contract (same behavior for empty results, same error types) — if production code needs `is RoomArticleRepository` checks, substitution is broken.",
          "**I** — per-concept repository interfaces, not a 40-method `AppRepository`; a ViewModel needing read-only data depends on an observe-only interface if you split reads/writes.",
          "**D** — the architecture's spine: domain defines `ArticleRepository`, data implements it, DI binds them; high-level policy (use cases) never names low-level detail (Retrofit).",
        ],
      },
      {
        t: "p",
        text: "Strong close: note that the Dependency Rule *is* DIP applied at architectural scale, and SRP at file level is what the layer boundaries are at system level — SOLID isn't a checklist beside the architecture, it's what the architecture is made of.",
      },
    ],
  },
];

export default qa;
