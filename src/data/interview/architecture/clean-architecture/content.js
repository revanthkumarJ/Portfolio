// Clean Architecture — Content tab.

const content = [
  {
    heading: "The original Clean Architecture — circles and the Dependency Rule",
    blocks: [
      {
        t: "p",
        text: "**Clean Architecture** is Robert C. Martin's (Uncle Bob, 2012) synthesis of earlier layered ideas (Hexagonal/Ports & Adapters, Onion Architecture). Concentric circles: **Entities** (enterprise business rules) at the core, then **Use Cases** (application business rules), then **Interface Adapters** (presenters, controllers, gateways), then **Frameworks & Drivers** (UI, DB, network, devices) outermost.",
      },
      {
        t: "p",
        text: "Everything hangs on one law — the **Dependency Rule**: *source-code dependencies may only point inward*. Inner circles know nothing about outer ones — not names, not types, not frameworks. The result: business rules that can be compiled, tested, and reasoned about with no UI, no database, no Android — and outer details (Room vs SQLDelight, Retrofit vs Ktor) that are swappable without touching the core.",
      },
      {
        t: "list",
        items: [
          "When the inner layer must *call outward* (a use case needs data), it defines an **interface (port)** that an outer layer implements (adapter) — that's **Dependency Inversion (the D in SOLID)** doing the load-bearing work.",
          "Data crossing boundaries is converted at each boundary — inner layers never see outer-layer types (no Retrofit DTOs inside use cases).",
          "\"Clean\" is about **dependency direction**, not folder names — a project with domain/data/presentation folders where domain imports Retrofit is not Clean Architecture.",
        ],
      },
      {
        t: "note",
        text: "One-liner: \"Clean Architecture = business logic at the center, frameworks at the edges, all dependencies pointing inward, with interfaces + dependency inversion wherever the flow of control must go outward.\"",
      },
    ],
  },
  {
    heading: "The Android adaptation — three layers, and Google's pragmatic version",
    blocks: [
      {
        t: "p",
        text: "Android collapsed the circles into three layers. Know **both** the strict mapping and Google's official recommendation — and that they differ:",
      },
      {
        t: "list",
        items: [
          "**Presentation (UI) layer** — Activities/Composables + ViewModels. Maps to Interface Adapters + Frameworks.",
          "**Domain layer** — use cases + domain models + repository *interfaces*. Pure Kotlin, zero Android imports. Maps to Entities + Use Cases.",
          "**Data layer** — repository *implementations* + data sources (Retrofit, Room, DataStore) + DTOs/entities + mappers. Outer circle.",
        ],
      },
      {
        t: "table",
        headers: ["", "Strict Clean (community)", "Google's recommended architecture"],
        rows: [
          ["Domain layer", "mandatory core of the design", "**optional** — 'add if complexity warrants'"],
          ["Repository interface lives in", "domain layer (dependency inversion: data implements domain's port)", "data layer defines and exposes it"],
          ["Use cases", "every interaction goes through one", "only when logic is complex or reused"],
          ["Data flow", "UI → UseCase → Repository", "UI → Repository directly is fine"],
          ["Philosophy", "framework independence above all", "pragmatism: SSOT, UDF, layered — without ceremony"],
        ],
      },
      {
        t: "note",
        text: "High-signal interview move: explicitly name this divergence. \"Strict Clean puts repository interfaces in domain and mandates use cases; Google's guide makes domain optional and lets ViewModels call repositories. I choose per project: shared-KMP or complex business rules → strict; CRUD app → Google-pragmatic.\"",
      },
    ],
  },
  {
    heading: "Domain layer deep dive — entities, use cases, and when they're worth it",
    blocks: [
      {
        t: "h3",
        text: "Domain models (entities)",
      },
      {
        t: "list",
        items: [
          "Plain immutable Kotlin data classes expressing business concepts — `Order`, `Money`, `Subscription` — with invariants enforced in construction (value classes for `UserId`, no raw strings for money).",
          "No serialization annotations, no Room annotations, no framework anything — those belong to the layer-specific models (DTO/entity).",
          "Business rules that belong to the concept live on it (`Order.canBeCancelled`), not in a ViewModel.",
        ],
      },
      {
        t: "h3",
        text: "Use cases (interactors)",
      },
      {
        t: "code",
        title: "Use case conventions",
        code: `// Naming: VerbNounUseCase; single public operator invoke
class GetPersonalizedFeedUseCase(
    private val feedRepository: FeedRepository,       // domain interfaces
    private val userRepository: UserRepository,
    private val defaultDispatcher: CoroutineDispatcher, // injected, main-safe
) {
    suspend operator fun invoke(): Result<Feed> = withContext(defaultDispatcher) {
        val user = userRepository.getUser()
        feedRepository.getFeed()
            .map { feed -> feed.rankFor(user.interests) } // the actual business value
    }
}

// Flow-returning variant for observation:
class ObserveCartTotalUseCase(
    private val cartRepository: CartRepository,
) {
    operator fun invoke(): Flow<Money> =
        cartRepository.observeItems()
            .map { items -> items.sumOf { it.price * it.quantity } }
}`,
      },
      {
        t: "list",
        items: [
          "**Earn their keep when**: logic combines multiple repositories, is reused by several ViewModels, or encodes real business policy (ranking, pricing, eligibility).",
          "**Pure ceremony when**: `class GetUserUseCase(repo) { operator fun invoke(id) = repo.getUser(id) }` — a rename of the repository call. Teams mandating these for uniformity trade boilerplate for consistency; know the argument on both sides.",
          "Use cases are **stateless** and reusable; they may call other use cases; they should be main-safe (own their `withContext`).",
          "They do **not** know about UI state, navigation, or Android — a use case returning `UiState` is a layering bug.",
        ],
      },
    ],
  },
  {
    heading: "Data layer deep dive — repositories, data sources, SSOT, offline-first",
    blocks: [
      {
        t: "list",
        items: [
          "**Repository** = the public API of the data layer for one domain concept: hides *where* data comes from, exposes suspend functions + Flows of **domain models**, owns the merge strategy between sources.",
          "**Data sources** = one class per origin (RemoteDataSource wrapping Retrofit/Ktor, LocalDataSource wrapping Room/SQLDelight DAO); repositories orchestrate them, never the reverse; data sources never know each other.",
          "**Single Source of Truth**: pick one source (usually the DB) that the app *reads from*; network writes into it, UI observes it. Reads are then consistent, offline works, and the 'flash of stale then fresh' is handled uniformly.",
          "**Offline-first**: reads always serve local; writes go local-first then sync (WorkManager, outbox pattern); conflict policy (last-write-wins vs merge) is a repository concern.",
          "Repositories also own: in-memory caching, request de-duplication, pagination glue (Paging sources), and mapping DTO/entity → domain.",
        ],
      },
      {
        t: "code",
        title: "Repository implementing SSOT (network → DB → UI)",
        code: `class ArticleRepositoryImpl(
    private val remote: ArticleRemoteDataSource,
    private val local: ArticleLocalDataSource,
    private val ioDispatcher: CoroutineDispatcher,
) : ArticleRepository {

    // Reads: always from the local SSOT
    override fun observeArticles(): Flow<List<Article>> =
        local.observeAll().map { entities -> entities.map { it.toDomain() } }

    // Refresh: network writes INTO the SSOT; UI updates via the observation above
    override suspend fun refresh(): Result<Unit> = withContext(ioDispatcher) {
        runCatching {
            val dtos = remote.fetchArticles()
            local.replaceAll(dtos.map { it.toEntity() })
        }
    }
}`,
      },
    ],
  },
  {
    heading: "Model mapping — DTO vs entity vs domain vs UI model",
    blocks: [
      {
        t: "table",
        headers: ["Model", "Layer", "Shaped by", "Example concern"],
        rows: [
          ["DTO", "data (network)", "the API contract", "`@SerialName(\"user_name\")`, nullable everything"],
          ["DB entity", "data (local)", "storage & queries", "`@Entity`, indices, foreign keys"],
          ["Domain model", "domain", "business meaning", "non-null invariants, value classes, behavior"],
          ["UI model / UiState", "presentation", "what the screen renders", "formatted strings, resolved flags, stable keys"],
        ],
      },
      {
        t: "list",
        items: [
          "Mapping happens **at layer boundaries**: DTO→domain and entity→domain inside the data layer; domain→UI in the ViewModel (or a mapper it uses).",
          "Why bother: a server field rename touches the DTO + one mapper — not forty composables. Nullability gets resolved *once*, at the boundary, so the domain stays honest.",
          "Pragmatic seniority: for a tiny app, one model reused everywhere is a defensible YAGNI call — but say you'd split the moment API shape and UI needs diverge, or the DB schema needs to evolve independently.",
          "Mappers are plain functions/extension functions (`fun ArticleDto.toDomain(): Article`) — trivially unit-tested, and the place where defaulting/validation of dirty server data lives.",
        ],
      },
    ],
  },
  {
    heading: "A full vertical slice — every layer in one example",
    blocks: [
      {
        t: "code",
        title: "Domain layer (pure Kotlin — no Android, no libraries)",
        code: `// model
data class Article(val id: String, val title: String, val publishedAt: Instant)

// repository PORT — interface owned by domain (strict Clean)
interface ArticleRepository {
    fun observeArticles(): Flow<List<Article>>
    suspend fun refresh(): Result<Unit>
}

// use case
class ObserveSortedArticlesUseCase(
    private val repository: ArticleRepository,
) {
    operator fun invoke(): Flow<List<Article>> =
        repository.observeArticles()
            .map { articles -> articles.sortedByDescending { it.publishedAt } }
}`,
      },
      {
        t: "code",
        title: "Data layer (implements the domain port)",
        code: `class ArticleRepositoryImpl(
    private val remote: ArticleRemoteDataSource,
    private val local: ArticleLocalDataSource,
    private val ioDispatcher: CoroutineDispatcher,
) : ArticleRepository { /* SSOT impl from the previous section */ }`,
      },
      {
        t: "code",
        title: "Presentation layer",
        code: `class FeedViewModel(
    observeSortedArticles: ObserveSortedArticlesUseCase,
    private val refreshArticles: RefreshArticlesUseCase,
) : ViewModel() {

    val uiState: StateFlow<FeedUiState> = observeSortedArticles()
        .map { articles -> FeedUiState.Content(articles.map { it.toUiModel() }) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), FeedUiState.Loading)

    fun onPullToRefresh() {
        viewModelScope.launch { refreshArticles() }
    }
}`,
      },
      {
        t: "p",
        text: "Trace the Dependency Rule through it: presentation imports domain; data imports domain; **domain imports nothing** from either. Control flows UI→domain→data at runtime, but the *source dependency* from domain to data is inverted through the `ArticleRepository` interface — that inversion is the exam-question heart of Clean Architecture.",
      },
    ],
  },
  {
    heading: "Error handling across layers",
    blocks: [
      {
        t: "list",
        items: [
          "**Data layer**: catch transport-level garbage (IOException, HTTP codes, serialization) at the boundary and translate to **typed domain errors** — `sealed interface DataError { NoConnection; NotFound; Unauthorized; Unknown }` — via `Result`/Either or error-emitting Flows. Never let Retrofit's `HttpException` leak upward.",
          "**Domain layer**: business failures are *values*, not exceptions — `InsufficientFunds`, `CartExpired` as sealed results; exceptions are reserved for bugs.",
          "**Presentation**: map typed errors to UX — retry affordance for connectivity, sign-in flow for auth, toast for the rest. The ViewModel `when`s over the sealed error, never string-matches messages.",
          "**Flows**: remember `catch` only handles *upstream* exceptions, terminal failures kill the collection — repositories should catch inside and emit error values so long-lived observation streams survive individual failures.",
          "**CancellationException must always be rethrown** — a blanket `runCatching` in every layer that swallows it silently breaks structured concurrency; use a helper that rethrows it.",
        ],
      },
    ],
  },
  {
    heading: "Threading rules across layers",
    blocks: [
      {
        t: "list",
        items: [
          "**Main-safety contract**: every suspend function in repositories/use cases must be safe to call from the main thread — the layer *doing* blocking work wraps itself (`withContext(ioDispatcher)`); callers never pre-emptively hop dispatchers.",
          "**Inject dispatchers** everywhere (`ioDispatcher`, `defaultDispatcher` as constructor params or a DispatcherProvider) — testability + a single place to tune.",
          "Room/Retrofit suspend calls are already main-safe (they manage their own threading) — wrapping them in `withContext(IO)` again is harmless but cargo-cult; know that nuance.",
          "`Flow` work moves off-main with `flowOn` applied in the layer that owns the heavy operator, not by the collector.",
          "CPU-heavy mapping of big lists → `defaultDispatcher`, IO → `ioDispatcher`; the UI layer stays on `Main.immediate` via `viewModelScope`.",
        ],
      },
    ],
  },
  {
    heading: "SOLID mapped to Android Clean Architecture",
    blocks: [
      {
        t: "table",
        headers: ["Principle", "Where it shows up in this architecture"],
        rows: [
          ["**S**ingle Responsibility", "one use case = one business action; repository per concept; ViewModel per screen; the anti-God-class principle"],
          ["**O**pen/Closed", "sealed hierarchies for state/errors extend by adding variants; new data sources plug in behind the repository without touching consumers"],
          ["**L**iskov Substitution", "fake repositories in tests must honor the interface contract (same semantics for edge inputs) — if tests need to know which impl is behind the port, LSP is broken"],
          ["**I**nterface Segregation", "small per-concept repository interfaces instead of one `AppRepository` with 40 methods; ViewModels depend only on the slice they use"],
          ["**D**ependency Inversion", "the load-bearing one: domain defines repository ports, data implements them; high-level policy never depends on low-level detail"],
        ],
      },
    ],
  },
  {
    heading: "Clean Architecture in KMP",
    blocks: [
      {
        t: "list",
        items: [
          "Clean's layering maps perfectly onto KMP: **domain + data in `commonMain`**, presentation shared (CMP ViewModels) or per-platform (SwiftUI adapters over shared state).",
          "The domain layer's 'no framework imports' rule becomes *enforced by compilation*: `commonMain` literally cannot import Android classes — KMP is Clean Architecture's dependency rule with a compiler behind it.",
          "Data layer in common code: **Ktor** (network), **SQLDelight/Room-KMP** (DB), **multiplatform DataStore** (prefs); platform specifics (file paths, drivers, engines) injected via `expect/actual` or DI.",
          "The strict-Clean choice (repository interfaces in domain) pays off doubly here: platforms and tests substitute implementations without touching shared business logic.",
          "Typical module shape: `:shared:domain`, `:shared:data`, `:shared:feature-x` consumed by `:androidApp` and the iOS framework — which is where Clean Architecture meets modularization.",
        ],
      },
    ],
  },
  {
    heading: "Criticisms & pragmatism — the question that separates seniors",
    blocks: [
      {
        t: "list",
        items: [
          "**Over-engineering small apps**: five modules, four model types and pass-through use cases for a two-screen app is architecture cosplay — the cost (navigation overhead reading code, mapper churn) is real and the payoff absent.",
          "**Pass-through layers**: wrappers that only forward calls add nothing but stack frames; add a layer when it has *responsibility*, not for symmetry.",
          "**Dogma vs delivery**: 'framework independence' is worth little if you'll never actually swap Room — the real, recurring payoff is **testability and team-scale boundaries**, so argue from those.",
          "**Uncle Bob's version isn't gospel on mobile**: Google's guide deliberately deviates (optional domain, repo interfaces in data) — citing that shows you read primary sources, not blog cargo cult.",
          "**When to invest**: multiple developers, KMP sharing, complex/regulated business rules, long lifespan → strict layering compounds. Hackathon/MVP → ViewModel + repository and ship.",
        ],
      },
      {
        t: "note",
        text: "Best closing sentence in a Clean Architecture interview: \"Layers are a means; the ends are testable business logic, independent teams, and replaceable details. I add exactly as much architecture as buys those — and no more.\"",
      },
    ],
  },
];

export default content;
