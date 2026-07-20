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
  {
    level: "junior",
    q: "Who created Clean Architecture and what are the concentric circles?",
    a: [
      {
        t: "p",
        text: "Clean Architecture was described by Robert C. Martin ('Uncle Bob') in 2012 as a synthesis of earlier layered ideas — Hexagonal (Ports & Adapters), Onion Architecture, and others. It's usually drawn as concentric circles, with the most stable, abstract code at the center and the most volatile, concrete code (frameworks, UI, DB) at the edges.",
      },
      {
        t: "list",
        items: [
          "**Entities (innermost)** — enterprise-wide business rules and core domain objects. The most stable, least likely to change.",
          "**Use Cases** — application-specific business rules (the operations your app performs).",
          "**Interface Adapters** — presenters, controllers, gateways that convert data between the use cases and the outer world.",
          "**Frameworks & Drivers (outermost)** — the UI, database, network, Android SDK — the volatile details.",
        ],
      },
      {
        t: "p",
        text: "The whole thing hangs on one rule — the **Dependency Rule**: source-code dependencies may only point *inward*. Inner circles know nothing about outer ones (not their names, not their types, not their frameworks). So the domain has no idea Retrofit or Room or Android even exist. On Android these circles collapse to three practical layers (domain, data, presentation), but the principle is the same: business logic at the center, frameworks at the edges, dependencies pointing in.",
      },
      {
        t: "note",
        text: "Clean Architecture = Uncle Bob's synthesis of Hexagonal/Onion; concentric circles (Entities → Use Cases → Adapters → Frameworks) governed by one law: dependencies point *inward*, so the center never knows about frameworks.",
      },
    ],
  },
  {
    level: "junior",
    q: "What belongs in the Domain layer specifically?",
    a: [
      {
        t: "p",
        text: "The Domain layer is the core of the app — the part that would be identical regardless of what UI framework, database, or network library you use. It's pure Kotlin with *no Android imports*, containing your business concepts and rules. It's the innermost, most stable layer.",
      },
      {
        t: "list",
        items: [
          "**Domain models (entities)** — immutable business objects with invariants (`Order`, `Money`, `Subscription`), often using value classes for type safety (`UserId` not raw `String`).",
          "**Use cases (interactors)** — one business operation each (`GetPersonalizedFeedUseCase`), encoding real business policy.",
          "**Repository interfaces (in strict Clean)** — the *ports* the domain defines for what it needs; the data layer implements them.",
          "**Business rules and logic** — validation, calculations, eligibility rules — expressed in framework-free code.",
        ],
      },
      {
        t: "code",
        title: "Domain layer — pure Kotlin, no framework",
        code: `// model with an invariant
data class Order(val id: OrderId, val items: List<Item>) {
    val total: Money = items.sumOf { it.price }        // business rule on the entity
    fun canBeCancelled(): Boolean = items.all { !it.shipped }
}
// repository PORT — the domain declares what it needs
interface OrderRepository {
    suspend fun getOrder(id: OrderId): Order
}
// use case — one business operation
class CancelOrderUseCase(private val repo: OrderRepository) {
    suspend operator fun invoke(id: OrderId): Result<Unit> {
        val order = repo.getOrder(id)
        return if (order.canBeCancelled()) repo.cancel(id) else Result.failure(...)
    }
}`,
      },
      {
        t: "p",
        text: "Why it's framework-free: this gives you three things — it's unit-testable on the JVM (no device), it's stable (Android APIs churn, business rules don't), and it's *portable* (it drops straight into KMP `commonMain`). The common mistake is letting Android or library types leak in (`Context`, a Retrofit DTO, a Room `@Entity`) — the moment that happens, the domain is no longer the stable, portable core.",
      },
      {
        t: "note",
        text: "The Domain layer is 'the part identical if you rewrote the entire UI and swapped the database' — pure Kotlin, no Android. Any framework import in it is a design bug.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the Data layer's responsibility?",
    a: [
      {
        t: "p",
        text: "The Data layer is where the app actually gets and stores data — it's the outer layer that deals with the concrete details (network, database, files) that the domain deliberately avoids. It implements the repository interfaces the domain declares, hiding *where* data comes from behind a clean API.",
      },
      {
        t: "list",
        items: [
          "**Repository implementations** — implement the domain's repository interfaces, deciding between network/cache/DB and exposing domain models.",
          "**Data sources** — one class per origin: a `RemoteDataSource` wrapping Retrofit/Ktor, a `LocalDataSource` wrapping Room/DataStore.",
          "**DTOs and entities** — the network models (DTOs) and database models (entities), shaped by the API and storage respectively.",
          "**Mappers** — convert DTO/entity ↔ domain model at the boundary.",
          "**The Single Source of Truth** — usually a local DB that the app reads from; network writes into it.",
        ],
      },
      {
        t: "code",
        title: "A repository (data layer) implementing a domain port",
        code: `class OrderRepositoryImpl(
    private val api: OrderApi,       // network detail
    private val dao: OrderDao,        // database detail
    private val io: CoroutineDispatcher,
) : OrderRepository {                  // implements the DOMAIN's interface
    override fun observeOrders(): Flow<List<Order>> =
        dao.observeAll().map { entities -> entities.map { it.toDomain() } }  // map at boundary
    override suspend fun refresh() = withContext(io) {    // main-safe
        dao.replaceAll(api.getOrders().map { it.toEntity() })  // network -> DB (SSOT)
    }
}`,
      },
      {
        t: "p",
        text: "The key discipline: the data layer depends *inward* on the domain (it implements the domain's interfaces and returns domain models), but the domain depends on *nothing* from the data layer. The data layer absorbs all the volatile detail — Retrofit, Room, JSON, caching strategy — so the rest of the app never sees it. That's what makes the details swappable and the domain stable.",
      },
      {
        t: "note",
        text: "The Data layer implements the domain's repository ports and absorbs all the volatile detail (network, DB, mapping, caching, SSOT). It depends inward on the domain; the domain never depends on it.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the Presentation layer in Clean Architecture?",
    a: [
      {
        t: "p",
        text: "The Presentation layer is the outer layer that handles the UI — it's where the user-facing screens and the logic that drives them live. In modern Android it's the Compose/View UI plus the ViewModels. It depends inward on the domain (calling use cases or repositories) and turns domain data into something ready to render.",
      },
      {
        t: "list",
        items: [
          "**UI** — Composables or Activities/Fragments that render state and forward user events. As dumb as possible.",
          "**ViewModels** — hold UI state, call use cases/repositories, and map domain models into UI-ready state (formatted strings, resolved flags). Framework-free-ish (no View references).",
          "**UI models / UiState** — the presentation-shaped data the UI renders (formatted, with stable keys), distinct from domain models.",
        ],
      },
      {
        t: "code",
        title: "Presentation layer — ViewModel driving UI from the domain",
        code: `class FeedViewModel(
    observeFeed: ObserveFeedUseCase,      // depends INWARD on domain
) : ViewModel() {
    val uiState: StateFlow<FeedUiState> = observeFeed()
        .map { articles -> FeedUiState.Content(articles.map { it.toUiModel() }) }  // domain -> UI
        .stateIn(viewModelScope, WhileSubscribed(5000), FeedUiState.Loading)
}`,
      },
      {
        t: "p",
        text: "The boundary rule: the presentation layer knows the domain (it calls use cases), but the domain knows *nothing* about presentation — a use case returning a `UiState` would be a layering violation (the domain would depend outward on presentation concerns). The ViewModel is where domain→UI mapping happens, so the UI receives render-ready data and the domain stays presentation-agnostic. In practice this is where Clean Architecture and MVVM meet — the ViewModel is the presentation layer's core.",
      },
      {
        t: "note",
        text: "Presentation = UI + ViewModels; it depends inward on the domain and maps domain models → UI state. A use case returning UiState is a layering bug — the domain must stay presentation-agnostic.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does data flow from the network to the UI through the layers?",
    a: [
      {
        t: "p",
        text: "Data flows *inward* through the layers on the way in, and the dependencies point inward too — but it's worth tracing concretely because it shows how the mapping and boundaries work in practice. The network's raw data is transformed at each boundary until the UI gets exactly what it needs.",
      },
      {
        t: "code",
        title: "Network → UI, with mapping at each boundary",
        code: `// 1. DATA layer: network returns a DTO (shaped by the API)
val dto: UserDto = api.getUser(id)          // { "user_name": "...", nullable fields }

// 2. DATA layer: map DTO -> domain model (resolve nullability, clean names)
val user: User = dto.toDomain()             // non-null, business-shaped

// 3. DATA layer: repository returns the DOMAIN model (not the DTO)
//    (optionally cached in Room as an entity first — the SSOT)

// 4. DOMAIN layer: a use case may apply business logic
val ranked: Feed = rankFeedUseCase(user)    // pure business rule

// 5. PRESENTATION: ViewModel maps domain -> UI model (formatted for display)
val uiState = FeedUiState.Content(ranked.items.map { it.toUiModel() })

// 6. UI: renders the UI model`,
      },
      {
        t: "list",
        items: [
          "**DTO → Domain** (in the data layer) — nullability resolved, API names normalized, mapped to business-shaped models.",
          "**Domain → UI model** (in the ViewModel) — formatted for display (strings, resolved colors, stable keys).",
          "**Each layer sees only its own models** — the UI never sees a `UserDto`; the domain never sees a UI model.",
        ],
      },
      {
        t: "p",
        text: "The reason for the mapping at each boundary is *isolation of change*: a server field rename touches only the DTO and one mapper, not the whole app; a UI formatting change touches only the presentation mapping, not the domain. Dependencies point inward (presentation→domain←data), but *data* flows through with transformations at each boundary so every layer works with models shaped for its concerns.",
      },
      {
        t: "note",
        text: "Trace it as DTO → domain (data layer) → UI model (ViewModel), mapping at each boundary. The mapping isolates change: a server rename hits one mapper, not the whole app.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is dependency inversion and how does Clean Architecture use it?",
    a: [
      {
        t: "p",
        text: "Dependency inversion (the 'D' in SOLID) says high-level modules should depend on *abstractions*, not on low-level concrete details. Normally, high-level code (business logic) would depend on low-level code (a database) — but that couples your important logic to a volatile detail. Inversion flips it: both depend on an abstraction (an interface), so the detail is swappable and the logic is stable.",
      },
      {
        t: "code",
        title: "Inversion via an interface the domain owns",
        code: `// DOMAIN (high-level) defines and depends on the ABSTRACTION:
interface UserRepository { suspend fun getUser(id: String): User }
class GetUserUseCase(private val repo: UserRepository)   // depends on interface, not impl

// DATA (low-level) implements the abstraction:
class UserRepositoryImpl(private val api: Api) : UserRepository { ... }

// DI wires interface -> impl at the outermost layer.
// The domain NEVER names UserRepositoryImpl or Api.`,
      },
      {
        t: "p",
        text: "Clean Architecture *is* dependency inversion applied at architectural scale. The Dependency Rule ('dependencies point inward') is literally DIP: the inner domain defines repository *ports* (interfaces), the outer data layer provides *adapters* (implementations), and the dependency arrow points from the concrete implementation *toward* the abstraction — inverted from the naive 'business logic uses the database' direction. This is what makes the whole app substitutable and testable: the domain depends on an interface, so tests inject a fake and production injects the real thing.",
      },
      {
        t: "p",
        text: "The concrete payoff: because `GetUserUseCase` depends on the `UserRepository` *interface*, you can (a) unit-test it with a `FakeUserRepository`, (b) swap the data source (network → local → different backend) without touching the use case, and (c) keep the domain compilable without the data layer even existing (crucial in KMP). Dependency inversion is the *mechanism*; Clean Architecture's layering is the *structure* it produces.",
      },
      {
        t: "note",
        text: "Clean Architecture is dependency inversion at architectural scale: the domain defines repository interfaces (ports), the data layer implements them (adapters), so the dependency arrow points inward toward the abstraction — making the app testable and details swappable.",
      },
    ],
  },
  {
    level: "junior",
    q: "Show a complete vertical slice through all three layers.",
    a: [
      {
        t: "p",
        text: "A vertical slice — one feature through domain, data, and presentation — is the clearest way to see Clean Architecture in action and how the Dependency Rule holds. Here's a 'load articles' feature.",
      },
      {
        t: "code",
        title: "Domain (pure Kotlin, defines the port)",
        code: `data class Article(val id: String, val title: String, val publishedAt: Instant)

interface ArticleRepository {                        // PORT owned by domain
    fun observeArticles(): Flow<List<Article>>
    suspend fun refresh(): Result<Unit>
}
class ObserveSortedArticlesUseCase(private val repo: ArticleRepository) {
    operator fun invoke(): Flow<List<Article>> =
        repo.observeArticles().map { it.sortedByDescending { a -> a.publishedAt } }
}`,
      },
      {
        t: "code",
        title: "Data (implements the port; absorbs Retrofit/Room)",
        code: `class ArticleRepositoryImpl(
    private val api: ArticleApi, private val dao: ArticleDao, private val io: CoroutineDispatcher,
) : ArticleRepository {
    override fun observeArticles() = dao.observeAll().map { it.map(Entity::toDomain) }
    override suspend fun refresh() = withContext(io) {
        runCatching { dao.replaceAll(api.getArticles().map { it.toEntity() }) }
    }
}`,
      },
      {
        t: "code",
        title: "Presentation (depends inward on the domain)",
        code: `class FeedViewModel(observe: ObserveSortedArticlesUseCase, private val refresh: RefreshUseCase)
    : ViewModel() {
    val uiState = observe().map { FeedUiState.Content(it.map(Article::toUiModel)) }
        .stateIn(viewModelScope, WhileSubscribed(5000), FeedUiState.Loading)
    fun onRefresh() = viewModelScope.launch { refresh() }
}`,
      },
      {
        t: "p",
        text: "Trace the Dependency Rule: presentation imports domain; data imports domain; **domain imports nothing** from either. At runtime control flows UI→domain→data, but the *source dependency* from data to domain is inverted through the `ArticleRepository` interface — the data layer depends on the domain's abstraction, not vice versa. DI (Hilt/Koin) wires `ArticleRepositoryImpl` to `ArticleRepository` at the outermost layer, which is the only place that knows all the concrete types.",
      },
      {
        t: "note",
        text: "In a vertical slice, both presentation and data point *inward* to the domain, and the domain points nowhere. The inverted data→domain dependency (via the repository interface) is the heart of Clean Architecture.",
      },
    ],
  },
  {
    level: "senior",
    q: "Are Clean Architecture and MVVM competing or complementary?",
    a: [
      {
        t: "p",
        text: "They're complementary — they operate at different scopes. MVVM is a *presentation-layer* pattern (how the UI, ViewModel, and state relate). Clean Architecture is a *whole-app layering* strategy (domain, data, presentation with dependencies pointing inward). MVVM describes the *inside* of Clean Architecture's presentation layer.",
      },
      {
        t: "list",
        items: [
          "**Different scopes** — MVVM answers 'how does the UI get its state?' (ViewModel exposes state, View observes). Clean answers 'how is the whole app layered?' (domain at center, frameworks at edges).",
          "**They compose** — a typical modern Android app is *both*: Clean Architecture's three layers, with MVVM inside the presentation layer (the ViewModel calls use cases in the domain, which call repositories in the data layer).",
          "**Neither replaces the other** — you don't choose MVVM *or* Clean; you use MVVM as the presentation pattern within a Clean-layered app.",
        ],
      },
      {
        t: "code",
        title: "MVVM living inside Clean's presentation layer",
        code: `// PRESENTATION layer (MVVM):
class FeedViewModel(private val getFeed: GetFeedUseCase) : ViewModel() {  // MVVM VM
    val uiState = getFeed()...   // calls INTO the domain layer (Clean)
}
// DOMAIN layer: GetFeedUseCase -> FeedRepository (interface)
// DATA layer: FeedRepositoryImpl`,
      },
      {
        t: "p",
        text: "The nuance worth adding: you can do MVVM *without* full Clean Architecture (a ViewModel calling a repository directly, no separate domain layer — Google's recommended architecture makes the domain optional). So MVVM is the smaller, always-useful pattern; Clean Architecture is the larger layering you *add* when the app's complexity justifies a domain layer. They're a small pattern and a big structure that fit together, not alternatives.",
      },
      {
        t: "note",
        text: "MVVM is the presentation-layer pattern *inside* Clean Architecture's larger app layering — complementary, not competing. You can do MVVM without full Clean (domain optional), but not vice versa.",
      },
    ],
  },
  {
    level: "senior",
    q: "Is the domain layer always necessary? When can you skip it?",
    a: [
      {
        t: "p",
        text: "No — the domain layer (use cases + domain models + repository interfaces) is *optional*, and this is where strict Clean Architecture and Google's recommended architecture openly diverge. Google's guidance makes the domain layer optional: 'add it if complexity warrants'. So the answer is 'add the domain layer when it earns its keep, skip it when it's ceremony'.",
      },
      {
        t: "list",
        items: [
          "**Skip the domain layer when** — the app is simple CRUD: the ViewModel can call the repository directly, and use cases would just forward calls (pass-through use cases that add a file and a stack frame but no logic). A domain layer here is ceremony.",
          "**Add the domain layer when** — business logic is *complex* (ranking, pricing, eligibility, multi-step rules), logic is *reused across multiple ViewModels* (so it needs a shared home), you're doing *KMP* (the domain must be framework-free to share, so a clean domain layer pays off doubly), or the app is large/long-lived and you want the extra boundary.",
        ],
      },
      {
        t: "code",
        title: "When a use case is pure ceremony vs when it earns its keep",
        code: `// CEREMONY: forwards to the repo, adds nothing -> skip it, call the repo directly
class GetUserUseCase(private val repo: Repo) { operator fun invoke(id: String) = repo.getUser(id) }

// EARNS IT: real business logic combining sources -> keep it
class GetPersonalizedFeedUseCase(private val feedRepo: FeedRepo, private val userRepo: UserRepo) {
    suspend operator fun invoke(): Feed {
        val user = userRepo.getUser()
        return feedRepo.getFeed().rankFor(user.interests)   // actual policy
    }
}`,
      },
      {
        t: "p",
        text: "The judgment is per-project, and stating that shows maturity: strict Clean insists on always having the domain layer (and use cases for every interaction); Google's guidance is pragmatic (domain optional, ViewModels can call repositories). I'd add the domain layer when there's genuine business logic to house or KMP sharing to enable, and skip it for simple CRUD — rather than dogmatically layering everything or nothing.",
      },
      {
        t: "note",
        text: "The domain layer is *optional* (Google's guidance) — add it for complex/reused business logic or KMP sharing; skip it for simple CRUD where use cases would just forward calls. Judgment per project, not dogma.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the signs that someone has applied Clean Architecture wrong (over-engineered it)?",
    a: [
      {
        t: "p",
        text: "Clean Architecture over-engineering happens when the *ceremony* is applied without the *benefit* — layers, abstractions, and mappings added for their own sake on an app that doesn't need them. The costs (indirection, boilerplate, slower navigation) are real, so misapplied Clean Architecture is genuinely worse than a simpler design.",
      },
      {
        t: "list",
        items: [
          "**Pass-through use cases everywhere** — a use case for every repository method that just forwards the call, adding files and stack frames but zero logic. Ceremony, not architecture.",
          "**Four model types for trivial data** — DTO → entity → domain → UI model with identical fields and pure-copy mappers, for a two-field object. Mapping machinery for mappings that never vary.",
          "**Interfaces with exactly one implementation, never faked** — a repository interface + impl where the interface exists 'for Clean Architecture' but is never substituted or tested against. Abstraction theater.",
          "**Five modules for a two-screen app** — modularization overhead (navigation, build config) with no team-size or build-speed payoff.",
          "**Debugging requires opening six files** — following one button tap through VM → use case → interface → impl → data source → mapper, when a direct repository call would do.",
          "**Dogmatic reviews** — enforcing layer 'compliance' in code review while shipping slowly; means and ends inverted.",
        ],
      },
      {
        t: "p",
        text: "The tell of *good* judgment is scaling architecture to stakes: start with ViewModel + repository + SSOT (cheap, huge payoff), add a domain layer when business logic or KMP demands it, add modules when team size or build speed demands it. The critics of Clean Architecture are right that over-layered codebases forgot the economy of simpler patterns — so the mature position is 'add exactly as much architecture as buys testability/team-boundaries/portability, and no more'.",
      },
      {
        t: "note",
        text: "Over-engineering signs: pass-through use cases, four identical model types, one-impl interfaces never faked, modules without payoff, six-file debugging. Good judgment scales architecture to stakes — add layers when they buy something, not for compliance.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Google's recommended architecture differ from strict Clean Architecture?",
    a: [
      {
        t: "p",
        text: "Google's recommended app architecture is heavily *inspired* by Clean Architecture but deliberately *relaxes* several of its stricter rules for pragmatism. Knowing the differences signals you've read the primary sources rather than following a blog's version of 'Clean Architecture on Android'.",
      },
      {
        t: "table",
        headers: ["", "Strict Clean (Uncle Bob / community)", "Google's recommended architecture"],
        rows: [
          ["Domain layer", "mandatory core", "*optional* — 'add if complexity warrants'"],
          ["Use cases", "every interaction goes through one", "only when logic is complex or reused"],
          ["Repository interface lives in", "domain (dependency inversion)", "data layer defines and exposes it"],
          ["Data flow", "UI → UseCase → Repository", "UI → Repository directly is fine"],
          ["Guiding philosophy", "framework independence above all", "SSOT + UDF + layering, without ceremony"],
        ],
      },
      {
        t: "p",
        text: "The biggest concrete divergences: Google makes the *domain layer optional* (ViewModels can call repositories directly), and puts *repository interfaces in the data layer* (whereas strict Clean puts them in the domain, for dependency inversion). Google's version keeps the *valuable* parts — single source of truth, unidirectional data flow, a clear data/UI split — while dropping the ceremony that doesn't pay for typical apps.",
      },
      {
        t: "p",
        text: "The reconciliation I'd give: I choose per project. For a shared-KMP app or one with complex business rules, strict Clean's domain layer and domain-owned repository interfaces pay off (framework-free, portable, dependency-inverted). For a standard Android CRUD app, Google's pragmatic version is enough — SSOT + UDF + a repository, without a domain layer. The point is that 'Clean Architecture' isn't one fixed thing; even Google deviates from the strict form deliberately, so applying it well means picking the right *amount* for the context.",
      },
      {
        t: "note",
        text: "Google's version relaxes strict Clean: domain layer *optional*, repository interfaces in the *data* layer, ViewModels may call repositories directly — keeping SSOT/UDF/layering while dropping ceremony. Citing this divergence shows you read primary sources.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you enforce the Dependency Rule in a real codebase so it doesn't erode?",
    a: [
      {
        t: "p",
        text: "The Dependency Rule ('dependencies point inward') erodes at the rate reviewers get tired — a convention that's only checked by humans in code review will drift. So durable enforcement means making violations *impossible to compile* or *caught by a machine*, not just discouraged.",
      },
      {
        t: "list",
        items: [
          "**Modularize by layer (strongest)** — put the domain in its own Gradle module that *has no dependency on* the data or presentation modules. Then a domain class *cannot* import a Retrofit DTO or an Android type — it's a *compile error*, not a review comment. The build system enforces the arrow.",
          "**Architecture tests (Konsist / ArchUnit)** — executable rules run in CI: 'classes in ..domain.. must not import android.*', 'domain must not depend on data'. Turn architectural drift into a red build.",
          "**Custom lint / detekt rules** — for idiom-level rules (no Android imports in domain packages, no repository *impl* types referenced from presentation).",
          "**Module-graph checks** — plugins that validate the dependency DAG against a declared spec (no data→presentation edges, no upward dependencies).",
          "**Structural friction** — `internal` visibility + api/impl module splits so consumers can't even *see* the classes they shouldn't depend on.",
        ],
      },
      {
        t: "p",
        text: "The principle to state: convention < detection < prevention. Convention (a style guide) decays. Detection (CI architecture tests) catches drift but after the fact. Prevention (module boundaries that make violations non-compilable) is best — which is exactly why modularizing by layer is the gold standard for enforcing Clean Architecture: the Dependency Rule becomes a *build constraint*, so the domain physically cannot depend on frameworks. This is also why KMP is such a good fit — `commonMain` literally cannot import Android, so the compiler enforces the rule for free.",
      },
      {
        t: "note",
        text: "Enforce the Dependency Rule with *structure*, not vigilance: module boundaries make violations non-compilable (best), CI architecture tests (Konsist/ArchUnit) catch drift, lint for idioms. Convention < detection < prevention — modularizing by layer is the gold standard.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do use cases combine data from multiple repositories?",
    a: [
      {
        t: "p",
        text: "One of the clearest justifications for a use case (over calling repositories directly from the ViewModel) is when a business operation needs data from *multiple* repositories combined by real logic. The use case orchestrates the repositories and encodes the business rule, keeping that logic out of both the ViewModel and any single repository.",
      },
      {
        t: "code",
        title: "A use case combining repositories",
        code: `class GetPersonalizedFeedUseCase(
    private val feedRepo: FeedRepository,        // domain interfaces
    private val userRepo: UserRepository,
    private val settingsRepo: SettingsRepository,
    private val defaultDispatcher: CoroutineDispatcher,   // injected, main-safe
) {
    suspend operator fun invoke(): Result<Feed> = withContext(defaultDispatcher) {
        val user = userRepo.getUser()
        val settings = settingsRepo.getSettings()
        feedRepo.getFeed()
            .map { feed -> feed.rankFor(user.interests)          // business rule
                               .filterBy(settings.contentFilters) }  // more logic
    }
}`,
      },
      {
        t: "code",
        title: "Reactive combination with Flow",
        code: `class ObserveCartSummaryUseCase(
    private val cartRepo: CartRepository, private val pricingRepo: PricingRepository,
) {
    operator fun invoke(): Flow<CartSummary> =
        combine(cartRepo.observeItems(), pricingRepo.observeDiscounts()) { items, discounts ->
            CartSummary(subtotal = items.sumOf { it.price },
                        discount = discounts.applyTo(items))   // combining logic in one place
        }
}`,
      },
      {
        t: "list",
        items: [
          "**Orchestration** — the use case calls multiple repositories and *combines* their results with business logic (ranking, filtering, pricing).",
          "**Main-safety** — the use case wraps CPU-heavy combination in `withContext(defaultDispatcher)` so callers stay main-safe.",
          "**Single home for the rule** — the combining logic lives in *one* place, so it's reused across ViewModels and unit-testable in isolation (inject fake repositories).",
        ],
      },
      {
        t: "p",
        text: "This is the litmus test for 'does this use case earn its keep?': if it *combines multiple sources* or *encodes real policy*, yes — it's the right home for logic that belongs to no single repository and shouldn't be duplicated in every ViewModel. If it just forwards one repository call, it's pass-through ceremony. The multi-repository combination case is the archetypal 'earns its keep' use case.",
      },
      {
        t: "note",
        text: "Use cases that *combine multiple repositories* with real logic (ranking, pricing, filtering) are the archetypal 'earns its keep' case — one testable home for logic that belongs to no single repository. Use `combine` for reactive sources.",
      },
    ],
  },
];

export default qa;
