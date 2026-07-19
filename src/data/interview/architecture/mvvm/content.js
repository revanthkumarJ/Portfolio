// MVVM — Content tab. Sections of { heading, blocks }.
// Block types: p, h3, list, code, table, note (see src/pages/interview/README.md)

const content = [
  {
    heading: "What is MVVM and why it exists",
    blocks: [
      {
        t: "p",
        text: "**MVVM (Model–View–ViewModel)** is a UI architecture pattern that separates *what is shown* (View) from *the state and logic that decides what to show* (ViewModel) and from *where data comes from* (Model). It was introduced by Microsoft (WPF, 2005) and became the de-facto standard on Android after Google shipped Jetpack **Architecture Components** (2017) with a first-class `ViewModel` class.",
      },
      {
        t: "list",
        items: [
          "**Model** — the data layer: repositories, data sources (network, database, preferences), and domain/business logic. It knows nothing about UI.",
          "**View** — Activity / Fragment / Composable. Renders state and forwards user input. It is as dumb as possible: no business logic, no data access.",
          "**ViewModel** — holds UI state, exposes it as an observable stream, and contains presentation logic. It transforms Model data into something renderable and reacts to user events.",
        ],
      },
      {
        t: "p",
        text: "The defining rule is the **direction of references**: the View knows the ViewModel, the ViewModel knows the Model, but **never the other way around**. The ViewModel has *no reference to the View* — the View *observes* the ViewModel. This one-way dependency is what makes MVVM testable and lifecycle-safe, and it is the main difference from MVP (where the Presenter holds a View interface and calls it directly).",
      },
      {
        t: "note",
        text: "Interview one-liner: \"MVVM separates UI from logic through **observable state** — the ViewModel exposes state, the View subscribes to it, and events flow the opposite way. The ViewModel never touches the View, which gives us testability, lifecycle safety and free survival of configuration changes.\"",
      },
    ],
  },
  {
    heading: "The three layers on Android — minimal example",
    blocks: [
      {
        t: "p",
        text: "A canonical modern stack: Repository (Model) → ViewModel exposing `StateFlow<UiState>` → Compose UI collecting it. The same shape works with XML views observing via `repeatOnLifecycle`.",
      },
      {
        t: "code",
        title: "Model — repository",
        code: `class UserRepository(
    private val api: UserApi,
    private val dao: UserDao,
) {
    fun observeUser(id: String): Flow<User> = dao.observeUser(id)

    suspend fun refreshUser(id: String) {
        val remote = api.fetchUser(id)
        dao.upsert(remote.toEntity())
    }
}`,
      },
      {
        t: "code",
        title: "ViewModel — state + presentation logic",
        code: `data class UserUiState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val error: String? = null,
)

class UserViewModel(
    private val repository: UserRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val userId: String = checkNotNull(savedStateHandle["userId"])

    private val _uiState = MutableStateFlow(UserUiState(isLoading = true))
    val uiState: StateFlow<UserUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.observeUser(userId)
                .catch { e -> _uiState.update { it.copy(isLoading = false, error = e.message) } }
                .collect { user ->
                    _uiState.update { it.copy(isLoading = false, user = user, error = null) }
                }
        }
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            runCatching { repository.refreshUser(userId) }
                .onFailure { e -> _uiState.update { it.copy(isLoading = false, error = e.message) } }
        }
    }
}`,
      },
      {
        t: "code",
        title: "View — Compose",
        code: `@Composable
fun UserScreen(viewModel: UserViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    when {
        state.isLoading -> LoadingIndicator()
        state.error != null -> ErrorMessage(state.error, onRetry = viewModel::refresh)
        state.user != null -> UserContent(state.user)
    }
}`,
      },
      {
        t: "list",
        items: [
          "State flows **down** (ViewModel → View), events flow **up** (View → ViewModel) — this is **Unidirectional Data Flow (UDF)** and modern MVVM on Android is always described together with it.",
          "The View never mutates state directly; it calls ViewModel functions (`viewModel.refresh()`), and the new state arrives through the observed stream.",
          "The backing-property pattern (`_uiState` private mutable, `uiState` public read-only) guarantees only the ViewModel can change state.",
        ],
      },
    ],
  },
  {
    heading: "Jetpack ViewModel deep dive — lifecycle & internals",
    blocks: [
      {
        t: "p",
        text: "Important distinction: **\"ViewModel\" the pattern role** vs **`androidx.lifecycle.ViewModel` the Jetpack class**. The class is Google's implementation of the role with two extra superpowers: it **survives configuration changes** and it gets a **cleanup callback** (`onCleared`). You could implement MVVM without it, but you'd lose both.",
      },
      {
        t: "h3",
        text: "How it survives rotation (the internals interviewers love)",
      },
      {
        t: "list",
        items: [
          "ViewModels are stored in a `ViewModelStore` — essentially a `Map<String, ViewModel>`.",
          "Every `ViewModelStoreOwner` (Activity, Fragment, NavBackStackEntry) owns one store.",
          "On a configuration change the Activity is destroyed and recreated, but the system retains its `NonConfigurationInstances` — the `ViewModelStore` rides along inside it. The recreated Activity gets the *same* store back, so `ViewModelProvider` returns the *same* ViewModel instance.",
          "`onCleared()` is only called when the owner is destroyed **for good** — `Activity.isFinishing == true`, Fragment permanently removed, or back-stack entry popped. On rotation it is *not* called.",
          "Consequence: a ViewModel **outlives** the Activity/Fragment instance — which is exactly why it must never reference one (that would leak the destroyed Activity until the ViewModel dies).",
        ],
      },
      {
        t: "h3",
        text: "Creation: providers, factories, CreationExtras",
      },
      {
        t: "p",
        text: "You never call the constructor yourself in production code — you go through `ViewModelProvider` (or `by viewModels()`, `hiltViewModel()`, `koinViewModel()`), which checks the store first and only creates a new instance on a miss. Constructor arguments require a **Factory**; with Hilt, `@HiltViewModel` + `@Inject constructor` generates it for you, and `SavedStateHandle` can simply be added as a constructor parameter.",
      },
      {
        t: "code",
        title: "Manual factory (what Hilt generates for you)",
        code: `class UserViewModelFactory(
    private val repository: UserRepository,
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>, extras: CreationExtras): T {
        val handle = extras.createSavedStateHandle()
        @Suppress("UNCHECKED_CAST")
        return UserViewModel(repository, handle) as T
    }
}

// In the Fragment/Activity:
private val viewModel: UserViewModel by viewModels { UserViewModelFactory(repo) }`,
      },
      {
        t: "h3",
        text: "viewModelScope",
      },
      {
        t: "list",
        items: [
          "`viewModelScope` is a `CoroutineScope` bound to the ViewModel: `SupervisorJob() + Dispatchers.Main.immediate`.",
          "All jobs launched in it are **cancelled automatically in `onCleared()`** — no manual cleanup, no leaked coroutines.",
          "`SupervisorJob` means one failed child coroutine does not cancel the siblings.",
          "`Main.immediate` executes without an extra dispatch if you're already on the main thread — avoids one-frame delays.",
          "Never expose `viewModelScope` publicly or launch UI-lifetime work in it that must outlive the screen (e.g. an upload that should finish after the user leaves) — that belongs in an application-scoped scope or `WorkManager`.",
        ],
      },
      {
        t: "h3",
        text: "Scoping options (know all of them)",
      },
      {
        t: "table",
        headers: ["Scope", "How", "Lives as long as"],
        rows: [
          ["Activity", "`by viewModels()` in Activity", "the Activity (across rotations)"],
          ["Fragment", "`by viewModels()` in Fragment", "the Fragment"],
          ["Shared between fragments", "`by activityViewModels()`", "the host Activity — classic way to share state between sibling fragments"],
          ["Navigation graph", "`hiltViewModel(backStackEntry)` / `navGraphViewModels()`", "the nav (sub)graph — great for multi-step flows like checkout or onboarding"],
          ["Parent fragment", "`by viewModels({ requireParentFragment() })`", "the parent fragment"],
        ],
      },
      {
        t: "note",
        text: "Edge case: `by viewModels()` is lazy — the ViewModel isn't created until first access. And two `by viewModels()` for the *same type with the same owner and key* return the same instance; pass a different `key` if you genuinely need two.",
      },
    ],
  },
  {
    heading: "Exposing state: LiveData vs StateFlow vs SharedFlow vs Compose State",
    blocks: [
      {
        t: "table",
        headers: ["", "LiveData", "StateFlow", "SharedFlow", "Compose mutableStateOf"],
        rows: [
          ["Initial value", "optional", "**required**", "none", "required"],
          ["Lifecycle-aware out of the box", "yes", "no — use `repeatOnLifecycle` / `collectAsStateWithLifecycle`", "no — same", "n/a (Compose-managed)"],
          ["Conflates equal values", "no (re-emits same value)", "**yes — skips `equals()` duplicates**", "no (replay/buffer configurable)", "skips duplicates (structural equality policy)"],
          ["Operators", "limited (`map`, `switchMap`)", "full Flow API", "full Flow API", "n/a"],
          ["KMP compatible", "**no** (Android-only)", "yes", "yes", "Compose Multiplatform only"],
          ["Backing for one-shot events", "bad (sticky)", "bad (sticky, conflated)", "possible (replay=0), with caveats", "bad"],
        ],
      },
      {
        t: "p",
        text: "Modern guidance: **`StateFlow` for state, and prefer state over events**. LiveData is in maintenance mode — fine in legacy code, but it's Android-only (a dealbreaker for KMP), has weak operators and no natural coroutine interop. Compose `mutableStateOf` inside a ViewModel is acceptable for Compose-only apps, but `StateFlow` keeps the ViewModel toolkit-agnostic and easier to test with Flow tooling.",
      },
      {
        t: "code",
        title: "The canonical exposure pattern",
        code: `private val _uiState = MutableStateFlow(UiState())
val uiState: StateFlow<UiState> = _uiState.asStateFlow()

// Always mutate with update {} — it's atomic (compare-and-set loop),
// safe against concurrent updates from multiple coroutines:
fun onQueryChange(query: String) {
    _uiState.update { it.copy(query = query) }
}`,
      },
      {
        t: "list",
        items: [
          "**Why expose the read-only type?** Encapsulation: if the View could call `_uiState.value = ...`, state changes could originate anywhere and UDF collapses. The ViewModel must be the *single writer*.",
          "**`update {}` vs `value =`**: `update` retries on CAS failure, so concurrent `copy()`-based mutations don't lose writes. `value = _uiState.value.copy(...)` from two threads can drop one update.",
          "**Conflation edge case**: `StateFlow` never emits a value equal to the current one, and a slow collector only sees the *latest* value, not every intermediate one. If you must observe every emission (e.g. analytics of each step), StateFlow is the wrong tool — use `SharedFlow`.",
          "**Deriving state**: use `map`/`combine` + `stateIn` instead of manually copying values between flows.",
        ],
      },
      {
        t: "code",
        title: "Derived state with combine + stateIn",
        code: `val uiState: StateFlow<SearchUiState> = combine(
    queryFlow,
    repository.observeResults(),
    filtersFlow,
) { query, results, filters ->
    SearchUiState(query = query, results = results.applyFilters(filters))
}.stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5_000),
    initialValue = SearchUiState(),
)`,
      },
    ],
  },
  {
    heading: "Modeling UiState — one data class vs sealed hierarchy",
    blocks: [
      {
        t: "code",
        title: "Option A — single data class (flags)",
        code: `data class ScreenUiState(
    val isLoading: Boolean = false,
    val items: List<Item> = emptyList(),
    val error: String? = null,
)`,
      },
      {
        t: "code",
        title: "Option B — sealed interface (mutually exclusive states)",
        code: `sealed interface ScreenUiState {
    data object Loading : ScreenUiState
    data class Success(val items: List<Item>) : ScreenUiState
    data class Error(val message: String) : ScreenUiState
}`,
      },
      {
        t: "list",
        items: [
          "**Sealed** shines when states are truly exclusive — the compiler forces exhaustive `when`, and impossible combinations (loading *and* error) can't be represented.",
          "**Data class** shines when states overlap — e.g. showing cached items *while* refreshing *with* an error snackbar. With sealed classes that becomes state duplication.",
          "Common hybrid: a data class whose fields include sealed sub-states (e.g. `val loadState: LoadState`).",
          "Keep it **immutable** (val + immutable collections). Mutable state inside the object breaks Compose recomposition skipping and makes time-travel/debugging impossible.",
          "Senior point: one `UiState` per screen is a guideline, not a law — very complex screens may expose a few cohesive streams instead of one giant object that recomposes everything.",
        ],
      },
      {
        t: "note",
        text: "Classic follow-up: \"where do you transform domain models into UI models?\" — in the ViewModel (or a dedicated mapper it calls). The View should receive data that is *ready to render* (formatted strings, resolved colors as semantic enums, stable list keys), so formatting logic is testable.",
      },
    ],
  },
  {
    heading: "One-shot events — the classic hard problem",
    blocks: [
      {
        t: "p",
        text: "Navigation, snackbars, toasts — things that must happen **exactly once** — don't fit naturally into sticky state: put `showSnackbar = true` in a `StateFlow` and it re-fires after rotation. Every approach has trade-offs; interviewers want you to know all of them.",
      },
      {
        t: "table",
        headers: ["Approach", "How", "Problems"],
        rows: [
          ["`SingleLiveEvent`", "LiveData subclass that delivers once", "legacy hack; only one observer; race-prone — avoid"],
          ["`SharedFlow(replay = 0)`", "emit events, collect in View", "**events emitted while no collector is active are dropped** (e.g. during rotation or in background)"],
          ["`Channel` + `receiveAsFlow()`", "buffered; delivery is suspended until a collector exists", "events survive gaps in collection, but delivery to *multiple* collectors is fan-out (each event to only one); still lost on process death"],
          ["**State-based events (Google's recommendation)**", "model the event as state; View performs it and calls back `eventConsumed()`", "slightly more ceremony, but survives config change AND process death (if in SavedStateHandle); no delivery-guarantee ambiguity"],
        ],
      },
      {
        t: "code",
        title: "Channel-based events (pragmatic, widely used)",
        code: `private val _events = Channel<UiEvent>(Channel.BUFFERED)
val events: Flow<UiEvent> = _events.receiveAsFlow()

fun onSaveClicked() {
    viewModelScope.launch {
        repository.save()
        _events.send(UiEvent.NavigateBack)
    }
}

// View:
LaunchedEffect(Unit) {
    viewModel.events.collect { event ->
        when (event) {
            UiEvent.NavigateBack -> navController.popBackStack()
            is UiEvent.ShowSnackbar -> snackbarHostState.showSnackbar(event.message)
        }
    }
}`,
      },
      {
        t: "code",
        title: "State-based events (most robust)",
        code: `data class UiState(
    val savedMessage: String? = null, // non-null == "show it"
)

fun onMessageShown() {
    _uiState.update { it.copy(savedMessage = null) }
}

// View:
state.savedMessage?.let { message ->
    LaunchedEffect(message) {
        snackbarHostState.showSnackbar(message)
        viewModel.onMessageShown()
    }
}`,
      },
      {
        t: "note",
        text: "Senior answer: \"I default to modeling events as state per Google's guidance, because Channel/SharedFlow events can be dropped or double-handled around lifecycle gaps. Where true fire-and-forget is fine (analytics, haptics), a Channel is acceptable. And navigation-as-state also plays better with deep links and process death.\"",
      },
    ],
  },
  {
    heading: "Configuration changes vs process death (know the difference cold)",
    blocks: [
      {
        t: "table",
        headers: ["", "Configuration change (rotation, locale, dark mode, resize)", "System-initiated process death"],
        rows: [
          ["Activity", "destroyed & recreated", "whole process killed"],
          ["ViewModel", "**survives** (same instance)", "**destroyed** — recreated from scratch"],
          ["In-memory state (StateFlow values)", "survives", "**lost**"],
          ["SavedStateHandle / onSaveInstanceState", "available (not needed)", "**restored** — this is what it's for"],
          ["How to test", "rotate device", "background the app → \"Terminate\" in Android Studio, or `adb shell am kill <pkg>` — then relaunch from recents"],
        ],
      },
      {
        t: "p",
        text: "**`SavedStateHandle`** is a key-value map injected into the ViewModel that participates in the saved-instance-state mechanism. It also receives **navigation arguments** (Navigation component puts destination args into it). Constraint: values must be `Bundle`-compatible (primitives, `Parcelable`, `Serializable`) and **small** — the Binder transaction limit (~1 MB shared across the whole transaction) means you save *identifiers and input*, never lists of data. Restore heavy data from the repository/database using the saved id.",
      },
      {
        t: "code",
        title: "SavedStateHandle + StateFlow integration",
        code: `class SearchViewModel(
    private val savedStateHandle: SavedStateHandle,
    repository: SearchRepository,
) : ViewModel() {

    // Survives config change AND process death; also writable:
    val query: StateFlow<String> = savedStateHandle.getStateFlow("query", "")

    fun onQueryChange(newQuery: String) {
        savedStateHandle["query"] = newQuery // updates the StateFlow too
    }

    @OptIn(ExperimentalCoroutinesApi::class)
    val results: StateFlow<List<Result>> = query
        .debounce(300)
        .flatMapLatest { q -> repository.search(q) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
}`,
      },
      {
        t: "note",
        text: "Interview trap: \"does ViewModel survive process death?\" — **No.** A surprising number of candidates say yes. ViewModel survives *configuration changes only*. Process death recovery = SavedStateHandle (for input/ids) + persistent layer (for data). A senior answer also mentions that over-relying on `savedInstanceState` for big data causes `TransactionTooLargeException` crashes.",
      },
    ],
  },
  {
    heading: "Collecting safely: lifecycle-aware collection & WhileSubscribed(5000)",
    blocks: [
      {
        t: "list",
        items: [
          "Flows are **not lifecycle-aware**; collecting in `lifecycleScope.launch { }` naively keeps collecting while the app is backgrounded — wasted work, possible crashes touching views after stop.",
          "**XML views**: `viewLifecycleOwner.lifecycleScope.launch { repeatOnLifecycle(Lifecycle.State.STARTED) { flow.collect { ... } } }` — collection is **cancelled** at STOP and **restarted** at START.",
          "**Why not `launchWhenStarted`?** It only *suspends* the collector while stopped — the upstream flow (e.g. a location listener) stays active, buffering. Deprecated for this reason. `repeatOnLifecycle` cancels the whole collection.",
          "**Compose**: `collectAsStateWithLifecycle()` (lifecycle-runtime-compose) does the same; plain `collectAsState()` keeps collecting when the app is backgrounded.",
          "Fragment gotcha: always use `viewLifecycleOwner`, not the Fragment's own lifecycle — the view can be destroyed and recreated (back stack) while the Fragment instance lives, leaking observers or touching a dead view.",
        ],
      },
      {
        t: "p",
        text: "**Why `SharingStarted.WhileSubscribed(5_000)`?** With `stateIn`, this stops the upstream flow 5 seconds after the last collector disappears. The magic number 5000 exists because a **configuration change** briefly drops all collectors — the timeout keeps the upstream (DB query, network observation) alive through rotation, but shuts it down for a real backgrounding (onStop → more than 5s). `Eagerly` never stops (fine for cheap, always-needed state); `Lazily` starts on first collector and never stops.",
      },
    ],
  },
  {
    heading: "MVVM with Clean Architecture — repositories, use cases, mapping",
    blocks: [
      {
        t: "p",
        text: "MVVM only prescribes the *presentation* boundary. In real apps it's combined with a layered data architecture. Google's recommended architecture: **UI layer (View + ViewModel) → optional Domain layer (use cases) → Data layer (repositories → data sources)**.",
      },
      {
        t: "list",
        items: [
          "**Repository**: single source of truth for one data type; decides between network/cache/DB; exposes `Flow` and suspend functions; hides data-source details from the ViewModel.",
          "**Use case (interactor)**: a class encapsulating one business action (`GetUserProfileUseCase`), usually with a single `operator fun invoke()`. Add them when logic is *reused across ViewModels* or complex enough to isolate — a use case that only forwards to a repository is ceremony; be ready to defend either stance.",
          "**Model mapping**: DTO (network) → entity (DB) → domain model → UI model. Each layer owns its model; mapping at boundaries prevents e.g. a server field rename from rippling into composables.",
          "**Threading rule**: the ViewModel should be able to call the data layer from the main thread — repositories/use cases are *main-safe* and move themselves to the right dispatcher (`withContext(ioDispatcher)`) internally.",
          "**Dependency rule**: dependencies point inward (UI → domain → data interfaces). The domain layer has no Android imports — which is exactly what makes it shareable in KMP.",
        ],
      },
    ],
  },
  {
    heading: "MVVM in Kotlin Multiplatform",
    blocks: [
      {
        t: "p",
        text: "KMP is where MVVM choices really get stress-tested, because the ViewModel and Model can move into `commonMain` while each platform keeps its native (or Compose Multiplatform) UI.",
      },
      {
        t: "list",
        items: [
          "**`androidx.lifecycle:lifecycle-viewmodel` is multiplatform since 2.8** — `ViewModel`, `viewModelScope` and `onCleared` are usable in `commonMain`. `SavedStateHandle` support arrived for CMP in later releases. Before that, the community standard was **moko-mvvm** or hand-rolled `expect/actual` ViewModels.",
          "**LiveData does not exist in KMP** — one of the strongest practical reasons the ecosystem standardized on `StateFlow`.",
          "**Compose Multiplatform**: `viewModel()` / koin's `koinViewModel()` work in common code; ViewModel scoping ties into CMP navigation back-stack entries just like on Android.",
          "**iOS with native SwiftUI**: Swift doesn't understand coroutines/Flow generics natively. Options: expose `StateFlow` and wrap it with a closure-based observer class in Kotlin; use **SKIE** (turns Flows into Swift `AsyncSequence` and adds proper enum bridging); or KMP-NativeCoroutines. In SwiftUI you typically wrap the shared ViewModel in an `ObservableObject`/`@Observable` adapter that subscribes and republishes state.",
          "**Lifecycle mismatch**: iOS has no Activity recreation, so \"survives configuration change\" is meaningless there — but `onCleared`-style cleanup still matters. The shared VM's lifetime is managed by whoever owns the adapter (e.g. deinit of the SwiftUI wrapper calls `clear()`).",
          "**Threading**: with the new K/N memory manager, freezing is gone; still, ensure state updates land on the main thread when driving SwiftUI (`Dispatchers.Main` in shared code).",
        ],
      },
      {
        t: "code",
        title: "Shared ViewModel in commonMain (lifecycle 2.8+)",
        code: `// commonMain
class ProfileViewModel(
    private val repository: ProfileRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<ProfileUiState>(ProfileUiState.Loading)
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.observeProfile()
                .catch { _uiState.value = ProfileUiState.Error(it.message ?: "Unknown") }
                .collect { _uiState.value = ProfileUiState.Content(it) }
        }
    }
}`,
      },
      {
        t: "code",
        title: "iOS consumption (SwiftUI adapter, with SKIE)",
        code: `@MainActor
final class ProfileObservable: ObservableObject {
    @Published var state: ProfileUiState = ProfileUiState.Loading()
    private let viewModel: ProfileViewModel

    init(viewModel: ProfileViewModel) {
        self.viewModel = viewModel
        Task {
            // SKIE exposes StateFlow as an AsyncSequence
            for await state in viewModel.uiState {
                self.state = state
            }
        }
    }

    deinit { viewModel.clear() }
}`,
      },
      {
        t: "note",
        text: "Strong senior talking point: \"In KMP I keep the ViewModel in commonMain exposing StateFlow, which Android/CMP consume directly; for SwiftUI I bridge via SKIE into an ObservableObject adapter. The pattern stays MVVM everywhere — only the observation mechanism is platform-specific.\"",
      },
    ],
  },
  {
    heading: "Testing ViewModels",
    blocks: [
      {
        t: "p",
        text: "Testability is MVVM's headline benefit — the ViewModel is a plain class with no Android UI dependencies, tested on the JVM with fake/mock repositories. Two pieces of infrastructure make coroutine ViewModels testable:",
      },
      {
        t: "code",
        title: "MainDispatcherRule — viewModelScope uses Dispatchers.Main",
        code: `class MainDispatcherRule(
    private val dispatcher: TestDispatcher = UnconfinedTestDispatcher(),
) : TestWatcher() {
    override fun starting(description: Description) = Dispatchers.setMain(dispatcher)
    override fun finished(description: Description) = Dispatchers.resetMain()
}`,
      },
      {
        t: "code",
        title: "Testing state emissions with Turbine",
        code: `@get:Rule val mainDispatcherRule = MainDispatcherRule()

@Test
fun refresh_emitsLoadingThenContent() = runTest {
    val repository = FakeUserRepository(user = testUser)
    val viewModel = UserViewModel(repository, SavedStateHandle(mapOf("userId" to "42")))

    viewModel.uiState.test {
        assertEquals(true, awaitItem().isLoading)
        val loaded = awaitItem()
        assertEquals(testUser, loaded.user)
        assertEquals(false, loaded.isLoading)
        cancelAndIgnoreRemainingEvents()
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`StandardTestDispatcher` vs `UnconfinedTestDispatcher`**: Standard queues coroutines until you `advanceUntilIdle()`/`runCurrent()` — precise control, good for testing intermediate states. Unconfined runs them eagerly — convenient, but you can miss transient states like `isLoading`.",
          "**`stateIn(WhileSubscribed)` gotcha**: the flow does nothing until collected — a test asserting `viewModel.uiState.value` right after construction sees only `initialValue`. Collect it (Turbine, or `backgroundScope.launch { uiState.collect() }`) to start the upstream.",
          "**Inject dispatchers** (`ioDispatcher: CoroutineDispatcher` constructor param) instead of hardcoding `Dispatchers.IO`, so tests can substitute the TestDispatcher and control virtual time (`advanceTimeBy` for `debounce`).",
          "Prefer **fakes** (in-memory repository implementations) over mocks for the data layer — tests read better and don't break on refactors.",
        ],
      },
    ],
  },
  {
    heading: "Anti-patterns & common mistakes (rapid-fire checklist)",
    blocks: [
      {
        t: "list",
        items: [
          "**Holding a `Context`, View, Activity or Fragment reference in a ViewModel** — leaks the destroyed instance across rotation. If you truly need app context, use `AndroidViewModel`'s application (or better, inject what you need — a resource provider / use case).",
          "**Exposing `MutableStateFlow`/`MutableLiveData` publicly** — breaks single-writer UDF.",
          "**God ViewModel** — thousands of lines handling half the app. Fix: one ViewModel per screen, delegate logic to use cases, split independent widgets into their own state holders.",
          "**Business logic in the View** — `if (user.age > 18)` in a composable/fragment means untestable logic. Views map state to pixels, nothing else.",
          "**Doing data-layer work in the ViewModel** — Retrofit/Room calls directly in the VM couples presentation to data details; go through a repository.",
          "**Observing with the wrong lifecycle owner** in fragments (`this` instead of `viewLifecycleOwner`).",
          "**`GlobalScope` / hardcoded dispatchers** — untestable, leak-prone; use `viewModelScope` + injected dispatchers.",
          "**Sticky-state events** — `showToast = true` in state without a consumed callback replays the toast on every rotation.",
          "**Kicking off loads in `init` without thought** — it makes the VM eager and harder to test/paginate; `stateIn`-driven lazy starts or explicit triggers are often cleaner (know the trade-off; `init` is not *wrong*).",
          "**Passing ViewModels down the composable tree** — pass state and lambdas instead; deep VM references kill previews and reusability.",
          "**Storing big data in SavedStateHandle** — `TransactionTooLargeException`; save ids, reload data.",
          "**Mutable collections in UiState** — breaks Compose stability/skipping and equality-based conflation.",
        ],
      },
    ],
  },
  {
    heading: "MVVM vs MVC vs MVP vs MVI — the comparison question",
    blocks: [
      {
        t: "table",
        headers: ["", "MVC (classic Android)", "MVP", "MVVM", "MVI"],
        rows: [
          ["Who updates the UI", "Activity does everything", "Presenter calls View interface methods", "View observes ViewModel state", "View renders a single immutable state from a reducer loop"],
          ["Middle layer → View reference", "n/a (they're merged)", "**yes** (interface)", "**no** (observation)", "no (observation)"],
          ["Survives config change", "no", "no (needs retain hacks)", "**yes** (Jetpack ViewModel)", "yes (built on VM usually)"],
          ["State shape", "scattered", "scattered across presenter calls", "one or few observable streams", "**single state object + explicit intents**"],
          ["Testability", "poor", "good (mock the View interface)", "good (assert emitted state)", "excellent (pure reducer)"],
          ["Boilerplate", "low", "high (View interfaces)", "medium", "medium-high"],
        ],
      },
      {
        t: "list",
        items: [
          "MVP died on Android largely because the Presenter↔View interface pair was boilerplate-heavy and lifecycle-blind; MVVM's observation model plus the Jetpack ViewModel's config-change survival won.",
          "MVI is best understood as **MVVM with stricter rules**: exactly one state object, events as explicit Intent objects, state changes only through a reducer. Modern \"MVVM with UDF + single UiState\" is already 80% of MVI.",
          "Good senior close: \"I don't pick dogmatically — Compose + StateFlow + UDF naturally lands between MVVM and MVI, and that's what Google's architecture guidance recommends.\"",
        ],
      },
    ],
  },
];

export default content;
