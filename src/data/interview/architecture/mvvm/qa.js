// MVVM — Interview Prep tab. Array of { level: "junior" | "senior", q, a: blocks[] }.
// Answers are written to be spoken aloud: direct answer → why → edge cases.

const qa = [
  // ---------------- JUNIOR ----------------
  {
    level: "junior",
    q: "What is MVVM? Explain each component.",
    a: [
      {
        t: "p",
        text: "MVVM is a UI architecture pattern with three roles. The **Model** is the data layer — repositories and data sources, plus business logic; it knows nothing about UI. The **View** (Activity, Fragment, or Composable) renders state and forwards user input. The **ViewModel** sits between them: it holds UI state, exposes it as an observable stream (`StateFlow`/`LiveData`), and contains presentation logic.",
      },
      {
        t: "p",
        text: "The key rule is that references go one way: View → ViewModel → Model. The ViewModel **never references the View** — the View subscribes to the ViewModel. That makes the ViewModel testable on the JVM and safe across configuration changes.",
      },
    ],
  },
  {
    level: "junior",
    q: "How is MVVM different from MVP and MVC?",
    a: [
      {
        t: "p",
        text: "In classic Android **MVC**, the Activity ends up being controller *and* view — everything in one class, untestable. In **MVP**, a Presenter holds a reference to a View *interface* and calls methods on it (`view.showLoading()`); logic becomes testable by mocking that interface, but you write a lot of interface boilerplate and the Presenter must be manually attached/detached to avoid leaks.",
      },
      {
        t: "p",
        text: "**MVVM inverts that last relationship**: the ViewModel exposes observable state and doesn't know who's watching. No View interface, no attach/detach, and with Jetpack's `ViewModel` you also get configuration-change survival for free — which Presenters never had. That's essentially why the Android community moved from MVP to MVVM after Architecture Components shipped.",
      },
    ],
  },
  {
    level: "junior",
    q: "Is the Jetpack ViewModel class the same thing as the ViewModel in MVVM?",
    a: [
      {
        t: "p",
        text: "Related but not identical. The MVVM ViewModel is a *pattern role* — any class holding UI state and presentation logic qualifies. `androidx.lifecycle.ViewModel` is Google's concrete implementation of that role with two extras: it **survives configuration changes** (stored in a `ViewModelStore` that's retained across recreation) and provides **`onCleared()`** for cleanup plus `viewModelScope` for coroutines. You could do MVVM without the Jetpack class, but you'd re-implement those features yourself.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does a ViewModel survive screen rotation?",
    a: [
      {
        t: "p",
        text: "ViewModels live in a `ViewModelStore`, owned by a `ViewModelStoreOwner` (Activity, Fragment, or nav back-stack entry). On a configuration change the Activity instance is destroyed, but the system retains its non-configuration state — and the `ViewModelStore` is carried inside it. The recreated Activity receives the same store, so when it asks `ViewModelProvider` for the ViewModel, it gets the **same instance** back instead of a new one.",
      },
      {
        t: "p",
        text: "`onCleared()` only fires when the owner goes away permanently — the Activity is finishing, the Fragment is removed for good, or the back-stack entry is popped. Important corollary: the ViewModel outlives the Activity instance, so it must never hold a reference to it.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is viewModelScope and what happens to it in onCleared()?",
    a: [
      {
        t: "p",
        text: "`viewModelScope` is a `CoroutineScope` attached to the ViewModel, built from `SupervisorJob() + Dispatchers.Main.immediate`. Anything launched in it is **automatically cancelled when `onCleared()` runs**, so you never leak coroutines when the screen is gone. `SupervisorJob` means one failing child doesn't cancel its siblings, and `Main.immediate` avoids an extra dispatch when you're already on the main thread.",
      },
      {
        t: "p",
        text: "Edge case worth adding: work that must **outlive the screen** (say, finishing an upload) doesn't belong in `viewModelScope` — use an application-scoped `CoroutineScope` injected into the repository, or `WorkManager` if it must survive process death.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why must a ViewModel never hold a reference to an Activity, Fragment, View, or their Context?",
    a: [
      {
        t: "p",
        text: "Because the ViewModel outlives them. On rotation the Activity is destroyed and recreated, but the ViewModel instance stays — if it held the old Activity (or anything holding one, like a View or an adapter), the garbage collector can't reclaim it: a **memory leak** of the entire view hierarchy, until the ViewModel itself dies.",
      },
      {
        t: "p",
        text: "If application-level context is genuinely needed (rare — usually a sign work belongs in the data layer), `AndroidViewModel` exposes the `Application`, which is a singleton and safe. The cleaner answer is to inject an abstraction — a resource provider or a use case — so the ViewModel stays free of Android classes and unit-testable.",
      },
    ],
  },
  {
    level: "junior",
    q: "LiveData vs StateFlow — what are the differences and which should you use?",
    a: [
      {
        t: "list",
        items: [
          "`StateFlow` **requires an initial value**; LiveData can be empty.",
          "LiveData is **lifecycle-aware by itself** (observers auto-pause/auto-remove); StateFlow needs `repeatOnLifecycle` or `collectAsStateWithLifecycle` to collect safely.",
          "`StateFlow` **conflates equal values** — setting the same value twice emits once; LiveData re-notifies.",
          "StateFlow has the **full Flow operator set** and clean coroutine interop; LiveData has only a handful of transformations.",
          "LiveData is **Android-only**; StateFlow is pure Kotlin — the deciding factor for **KMP**.",
        ],
      },
      {
        t: "p",
        text: "Default today: **StateFlow**. LiveData is in maintenance mode and fine to keep in legacy code, but new code — especially anything that might share logic with KMP — should use StateFlow.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why do we expose StateFlow instead of MutableStateFlow from the ViewModel?",
    a: [
      {
        t: "p",
        text: "Encapsulation and single-writer discipline. If the View got the mutable type, any code could set state, and you lose the unidirectional flow that makes the app predictable. The convention is a private `_uiState: MutableStateFlow` plus a public `uiState: StateFlow` via `asStateFlow()`, so the **ViewModel is the only writer** and the View can only read and observe.",
      },
      {
        t: "p",
        text: "Detail: `asStateFlow()` is preferred over just upcasting, because upcast state can be cast back to mutable, while `asStateFlow()` returns a read-only wrapper.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does the View observe the ViewModel in XML-based UIs vs Compose?",
    a: [
      {
        t: "code",
        title: "XML / Fragment",
        code: `viewLifecycleOwner.lifecycleScope.launch {
    viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.uiState.collect { state -> render(state) }
    }
}`,
      },
      {
        t: "code",
        title: "Compose",
        code: `val state by viewModel.uiState.collectAsStateWithLifecycle()`,
      },
      {
        t: "p",
        text: "In both cases the point is **lifecycle-safe collection**: stop collecting when the UI isn't visible, resume when it is. In fragments, always use `viewLifecycleOwner` — the fragment instance can outlive its view on the back stack, and observing with `this` leaks or touches dead views.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you pass arguments (like an id) into a ViewModel?",
    a: [
      {
        t: "p",
        text: "Constructor injection through a **factory** — you never construct a ViewModel directly, so extra parameters must go through `ViewModelProvider.Factory`. With Hilt, `@HiltViewModel` with an `@Inject constructor` generates the factory, and runtime values like a user id are best passed via **`SavedStateHandle`**: the Navigation component automatically places destination arguments into it, so the ViewModel reads `savedStateHandle[\"userId\"]` — and that value also survives process death.",
      },
      {
        t: "p",
        text: "For assisted injection of values not in navigation args, Hilt supports `@AssistedInject` ViewModel factories (or you write a small custom factory).",
      },
    ],
  },
  {
    level: "junior",
    q: "Where should business logic live in MVVM? What belongs in the View?",
    a: [
      {
        t: "p",
        text: "**Business/domain logic** (rules, validation, calculations) belongs in the domain or data layer — use cases and repositories. **Presentation logic** (combining streams, mapping domain models to UI state, deciding what's visible) belongs in the ViewModel. The **View** only maps state to widgets and forwards events — if you see `if (user.balance < 0)` deciding colors in a Fragment, that condition should have produced a semantic field in UiState instead.",
      },
      {
        t: "p",
        text: "Litmus test: could you unit-test the decision without instrumented tests? If not, it's in the wrong layer.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a Repository and why doesn't the ViewModel call Retrofit/Room directly?",
    a: [
      {
        t: "p",
        text: "A repository is the data layer's public API for one type of data — the **single source of truth**. It decides between cache, database, and network; exposes `Flow`s and suspend functions; and hides the data-source libraries entirely. The ViewModel calling Retrofit directly couples presentation to transport details, duplicates caching/merging logic across screens, and makes the ViewModel hard to test. With a repository interface, tests swap in an in-memory fake.",
      },
      {
        t: "p",
        text: "Bonus rule: repositories should be **main-safe** — the ViewModel can call them from the main thread and they handle `withContext(ioDispatcher)` internally.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Unidirectional Data Flow (UDF)?",
    a: [
      {
        t: "p",
        text: "A cycle with one direction: **state flows down, events flow up**. The View sends user events to the ViewModel (`onQueryChange(...)`), the ViewModel updates state, and the new state flows back down through the observable stream to be rendered. The View never mutates state itself. Benefits: a single place where state changes (easy to debug), state that's a pure function of data (easy to reason about), and natural fit with Compose's declarative model. Modern MVVM on Android is always practiced together with UDF.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do two Fragments share data using a ViewModel?",
    a: [
      {
        t: "p",
        text: "Scope one ViewModel to a **shared owner**. Sibling fragments in the same Activity use `by activityViewModels()` — both get the same instance because the Activity's `ViewModelStore` is shared. With the Navigation component, scoping to a **navigation graph** (`hiltViewModel(parentEntry)` / `navGraphViewModels(R.id.checkout_graph)`) is usually better: the ViewModel lives exactly as long as the flow (e.g. a checkout wizard) and is cleared when the user leaves it, instead of lingering for the whole Activity.",
      },
    ],
  },
  {
    level: "junior",
    q: "What happens to the ViewModel when the user presses back vs when they rotate the screen?",
    a: [
      {
        t: "p",
        text: "**Rotation**: configuration change — the Activity is recreated but `isFinishing` is false, the `ViewModelStore` is retained, the same ViewModel instance is reused, `onCleared()` is *not* called. **Back press**: the Activity is finishing — the store is cleared, **`onCleared()` runs**, `viewModelScope` is cancelled, and the ViewModel is gone. Same logic for fragments (permanent removal vs recreation) and nav back-stack entries (popped vs kept).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you show a one-time message (Snackbar/Toast) from a ViewModel?",
    a: [
      {
        t: "p",
        text: "The ViewModel can't touch UI, so it signals the View. The naive way — a `showMessage: Boolean` in sticky state — replays after rotation. Standard options: a **`Channel` collected as a Flow** in the View (buffered, delivered once), or Google's recommended **state-based event**: put `message: String?` in UiState, the View shows it and calls `viewModel.onMessageShown()` which nulls it out. State-based is the most robust across config change and process death; Channel is pragmatic and common. What matters in the interview is naming the rotation-replay problem and one correct solution.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is SavedStateHandle and when do you need it?",
    a: [
      {
        t: "p",
        text: "A key-value map handed to the ViewModel that plugs into the saved-instance-state system. Two jobs: it carries **navigation arguments**, and anything you write into it **survives system-initiated process death** (which the ViewModel itself does not). It exposes values as `getStateFlow(key, default)` / `getLiveData`. Constraints: values must be Bundle-compatible (primitives/Parcelable) and small — store *ids and user input*, then reload real data from the repository.",
      },
    ],
  },
  {
    level: "junior",
    q: "Is data binding required for MVVM on Android?",
    a: [
      {
        t: "p",
        text: "No. MVVM only requires that the View *observes* the ViewModel — the mechanism is an implementation detail. XML **DataBinding** (binding expressions in layouts) was one popular mechanism and is what people historically associated with MVVM, but it's effectively legacy now; most XML projects use ViewBinding plus manual `collect`, and Compose observes state natively. Saying \"MVVM = data binding\" is a red flag answer.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you represent loading, success and error in the UI state?",
    a: [
      {
        t: "p",
        text: "Two idioms. A **single data class** with fields (`isLoading`, `data`, `error`) — flexible, allows overlapping states like \"showing cached data while refreshing with an error banner\". Or a **sealed interface** (`Loading / Success / Error`) — states are mutually exclusive and the compiler forces exhaustive handling. Choose sealed when states truly exclude each other; choose the data class when they can overlap. Either way the state object stays **immutable** and is replaced wholesale via `copy()`.",
      },
    ],
  },
  {
    level: "junior",
    q: "Can you create a ViewModel with 'new'/direct constructor call? Why or why not?",
    a: [
      {
        t: "p",
        text: "You *can* (it's just a class — unit tests do exactly this), but in production you must go through `ViewModelProvider` / `by viewModels()` / `hiltViewModel()`. The provider first checks the owner's `ViewModelStore` and returns the existing instance if present — that lookup is the entire survival mechanism. A directly-constructed ViewModel is never stored, so you'd get a fresh object on every rotation and `onCleared` would never be managed for it.",
      },
    ],
  },

  // ---------------- SENIOR ----------------
  {
    level: "senior",
    q: "Walk me through exactly how a ViewModel survives configuration change under the hood.",
    a: [
      {
        t: "p",
        text: "`ComponentActivity` implements `ViewModelStoreOwner` and owns a `ViewModelStore` — a map of key → ViewModel. When a config change begins, the framework calls `onRetainNonConfigurationInstance()`; ComponentActivity packs the `ViewModelStore` into its `NonConfigurationInstances` object, which the ActivityThread keeps in memory across the destroy/recreate (the process never dies). The new Activity instance retrieves it via `getLastNonConfigurationInstance()` and adopts the store. So `ViewModelProvider.get()` computes the same default key (`androidx.lifecycle.ViewModelProvider.DefaultKey:` + class name), finds the entry, and returns the same object.",
      },
      {
        t: "p",
        text: "The cleanup path: ComponentActivity observes its own lifecycle; on `ON_DESTROY` it checks `isChangingConfigurations` — only when that's **false** does it call `viewModelStore.clear()`, which iterates ViewModels and invokes `onCleared()` (also closing `viewModelScope`). Fragments do the analogous dance through `FragmentManagerViewModel`, and Navigation scopes stores to `NavBackStackEntry`s cleared on pop.",
      },
    ],
  },
  {
    level: "senior",
    q: "Configuration change vs process death — what exactly survives each, and how do you build for both?",
    a: [
      {
        t: "list",
        items: [
          "**Config change**: process lives. ViewModel instance and all in-memory state survive; the Activity/views are recreated. `SavedStateHandle` isn't needed but keeps working.",
          "**Process death**: the OS kills the backgrounded process. ViewModel is gone; only the saved-instance-state Bundle survives (the system holds it) — restored into `SavedStateHandle` on relaunch. In-memory caches, singletons, StateFlows — all gone.",
        ],
      },
      {
        t: "p",
        text: "Strategy: treat `SavedStateHandle` as the place for **identity and transient input** (selected id, query text, scroll anchor), and the **persistent layer as the source of truth for data**. On recreation the ViewModel reads the id from the handle and re-subscribes to the repository — the same code path as first launch, so process-death recovery isn't a special case. Watch the Binder limit (~1 MB per transaction, shared): dumping lists into the handle causes `TransactionTooLargeException`. Test it honestly: background the app, kill via Android Studio's Terminate (or `adb shell am kill`), relaunch from Recents — rotation tests prove nothing about process death.",
      },
    ],
  },
  {
    level: "senior",
    q: "StateFlow conflation — when is it a problem and what do you do about it?",
    a: [
      {
        t: "p",
        text: "Two distinct behaviors. First, **equality skipping**: `StateFlow` won't emit a value `equals()` to the current one. That bites with mutable objects (mutate-and-reset looks unchanged) or when you *want* re-emission (retry the same 'scroll to top' command). Second, **conflation proper**: a slow collector only ever sees the latest value — intermediate states can be skipped entirely. For *state* this is exactly right (the screen only cares about now); for anything where **every emission matters** — analytics events, a queue of animations, commands — it's wrong.",
      },
      {
        t: "p",
        text: "Fixes: keep state immutable data classes so equality is meaningful; for must-not-miss streams use `SharedFlow` with an explicit `replay`/`extraBufferCapacity`/`onBufferOverflow` policy or a `Channel`; and don't model events as state values (a `counter` field to force emission is a design smell — that's an event stream in disguise).",
      },
    ],
  },
  {
    level: "senior",
    q: "Why exactly 5000 ms in SharingStarted.WhileSubscribed(5000)? Compare with Eagerly and Lazily.",
    a: [
      {
        t: "p",
        text: "`WhileSubscribed(5_000)` stops the upstream flow 5 s after the last collector unsubscribes and restarts it when someone re-subscribes. The 5 s exists for **configuration changes**: during rotation, collectors vanish for a few hundred milliseconds; without the timeout the upstream (a Room query, a socket subscription) would be torn down and cold-restarted — flicker, wasted IO, re-shown loading states. 5 s comfortably covers recreation while still stopping work shortly after a genuine backgrounding (ON_STOP with `repeatOnLifecycle(STARTED)`). It also pairs with `replay`/initial value so the returning collector gets the last state instantly.",
      },
      {
        t: "list",
        items: [
          "`Eagerly` — starts immediately with the scope, never stops until scope cancellation. Fine for cheap, always-relevant state; wasteful for expensive upstreams.",
          "`Lazily` — starts on the first collector, then never stops. Rarely what you want for UI.",
          "`WhileSubscribed(0)` — stops instantly on unsubscribe; restarts upstream on every rotation (the exact problem 5000 solves).",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "Why was launchWhenStarted deprecated in favor of repeatOnLifecycle?",
    a: [
      {
        t: "p",
        text: "`launchWhenStarted` only **suspends** the coroutine below STARTED — the upstream flow stays **active**. A location provider, a Room observer, a socket keeps producing while the app is backgrounded; emissions pile up (or hot hardware stays on), and work resumes with a burst on return. It also silently never cancels — the producer runs until the scope dies. `repeatOnLifecycle(STARTED)` instead **cancels the whole collection** at ON_STOP and **restarts the block** at ON_START — the upstream is genuinely stopped. That cancel/restart semantic is honest about lifecycle and is why the `launchWhenX` family was deprecated.",
      },
      {
        t: "p",
        text: "Compose equivalent: `collectAsStateWithLifecycle()` (uses `repeatOnLifecycle` internally) vs plain `collectAsState()` which keeps collecting in background. Pairing detail: `repeatOnLifecycle` + `stateIn(WhileSubscribed(5000))` compose perfectly — background for >5 s and the upstream stops too.",
      },
    ],
  },
  {
    level: "senior",
    q: "Deep-dive the one-shot event problem: compare SingleLiveEvent, SharedFlow, Channel, and state-based events, with their failure modes.",
    a: [
      {
        t: "list",
        items: [
          "**SingleLiveEvent** — LiveData hack with an 'handled' flag. Only one observer gets the event, racy with multiple, relies on LiveData; legacy — name it only to dismiss it.",
          "**`MutableSharedFlow(replay = 0)`** — hot with no buffer for absent collectors: an event emitted while the View is between `repeatOnLifecycle` windows (rotation! backgrounded!) is **silently dropped**. `tryEmit` with no buffer simply fails. Setting `replay = 1` fixes dropping but re-introduces stickiness — replayed after rotation. Fundamentally awkward for events.",
          "**`Channel(BUFFERED).receiveAsFlow()`** — `send` suspends/buffers until a collector receives, so events **wait through collection gaps** — the usual pragmatic winner. Caveats: fan-out (each event goes to exactly *one* collector — a bug if two collectors are accidentally active); buffered events are lost on process death; and an event can be received *just* before the UI stops, then the Snackbar never shows.",
          "**State-based (Google's guidance)** — the 'event' becomes a state field; the View executes it and calls a `consumed()` callback to clear it. Survives config change, and process death too if mirrored in `SavedStateHandle`; no delivery ambiguity because state is always there to re-render. Cost: consumption ceremony and modeling multiple queued events takes a list.",
        ],
      },
      {
        t: "p",
        text: "My default: state-based for anything that changes what the user sees or where they are (navigation, dialogs); Channel for genuine fire-and-forget side effects. The senior signal is explaining the **dropped-event window** — most candidates don't know SharedFlow silently drops.",
      },
    ],
  },
  {
    level: "senior",
    q: "MVVM vs MVI — real differences, and when would you pick MVI?",
    a: [
      {
        t: "p",
        text: "MVI is MVVM with three extra constraints: **a single immutable state object** per screen (MVVM allows several streams), **reified user intents** (sealed `Intent`/`Action` objects through one entry point, vs plain method calls), and **state mutation only through a reducer** — a pure `(state, action) -> state` function. That gives you an auditable event log, trivially testable reducers, and time-travel debugging; it costs boilerplate, indirection for trivial screens, and a learning curve.",
      },
      {
        t: "p",
        text: "When I'd pick MVI: screens with genuinely complex state machines (editors, players, multi-step flows), or a team that wants the discipline enforced rather than by convention. Otherwise, modern MVVM — single `UiState` + `update {}` + UDF — already captures most of the benefit; frameworks like Orbit or MVIKotlin (popular in KMP with Decompose) formalize it when needed. Honest close: the industry converged on a middle ground, and Google's guidance is exactly that hybrid.",
      },
    ],
  },
  {
    level: "senior",
    q: "Your ViewModel has grown to 1500 lines. How do you fix a God ViewModel?",
    a: [
      {
        t: "list",
        items: [
          "**Push logic down**: business rules move into use cases; data orchestration into repositories. The VM should mostly wire streams and map models — extracting logic usually halves it.",
          "**Split by feature, not screen**: independent widgets on one screen (search bar, feed, stories row) can have their own state holders or even ViewModels; a screen-level VM composes them.",
          "**Extract plain state-holder classes** for reusable UI logic that doesn't need VM lifetime, hoisted in Compose (`remember { ... }`).",
          "**Extract mapping** into dedicated mapper/formatter classes with their own tests.",
          "**Split the UiState** if it has become a dumping ground — several cohesive streams beat one 40-field object recomposing the world.",
        ],
      },
      {
        t: "p",
        text: "Guardrail I apply in review: if a ViewModel imports a data-source library (Retrofit/Room types) or exceeds a few hundred lines, the layering has broken down somewhere below it.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a ViewModel that uses viewModelScope, debounce, and stateIn(WhileSubscribed)? Include the gotchas.",
    a: [
      {
        t: "p",
        text: "Infrastructure first: `viewModelScope` runs on `Dispatchers.Main`, which doesn't exist on the JVM — a `MainDispatcherRule` calls `Dispatchers.setMain(TestDispatcher)`/`resetMain()`. Tests run in `runTest`, which gives **virtual time**.",
      },
      {
        t: "list",
        items: [
          "**Dispatcher choice**: `StandardTestDispatcher` queues coroutines until `advanceUntilIdle()`/`runCurrent()` — lets you assert intermediate states (`isLoading`). `UnconfinedTestDispatcher` runs eagerly — simpler, but transient states may be skipped before you can observe them.",
          "**`stateIn(WhileSubscribed)` gotcha**: cold until collected. Asserting `uiState.value` right after constructing the VM only ever shows `initialValue` — you must collect (Turbine's `uiState.test { }`, or `backgroundScope.launch { uiState.collect() }`) to trigger the upstream.",
          "**`debounce` / delays**: virtual time — `advanceTimeBy(300)` then assert; no real sleeping. Requires the debounce to run on the test scheduler, which leads to:",
          "**Inject dispatchers** — a hardcoded `Dispatchers.IO` inside the VM or repository escapes virtual time and makes tests flaky/slow. Constructor-inject `CoroutineDispatcher` (or a dispatcher provider) and pass the TestDispatcher in tests.",
          "Use **fakes over mocks** for repositories — behavioral fidelity, refactor-friendly; and **Turbine** for asserting emission sequences (`awaitItem()`, `expectNoEvents()`).",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "How do you share a ViewModel (or its equivalent) between Android and iOS in KMP, and what are the pain points?",
    a: [
      {
        t: "p",
        text: "Since androidx lifecycle 2.8, `ViewModel` + `viewModelScope` are multiplatform — the VM moves to `commonMain` exposing `StateFlow<UiState>`. Android and Compose Multiplatform consume it natively (`collectAsStateWithLifecycle`, `koinViewModel`). The friction is **native iOS**: Objective-C interop erases Flow's generics and has no suspend-stream concept, so SwiftUI can't just subscribe.",
      },
      {
        t: "list",
        items: [
          "**Bridging**: SKIE (converts `Flow` to Swift `AsyncSequence`, sealed classes to Swift enums — nicest DX), KMP-NativeCoroutines, or a hand-written closure-based `watch { }` wrapper. On the Swift side, an `ObservableObject`/`@Observable` adapter subscribes and republishes into SwiftUI.",
          "**Lifecycle**: iOS has no config changes, so 'VM survives rotation' is moot — but ownership is manual: the Swift adapter must call `clear()`/cancel on deinit or the VM's coroutines leak. moko-mvvm and Decompose formalize this; Decompose in particular replaces ViewModel with lifecycle-aware 'components' shared across platforms.",
          "**Main-thread delivery**: state driving SwiftUI must land on the main thread — keep VM emissions on `Dispatchers.Main` in shared code or hop in the adapter.",
          "**Errors**: Kotlin exceptions crossing to Swift need `@Throws` or Result-typed state — uncaught Kotlin exceptions crash the app on the Swift side.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "How does SavedStateHandle.getStateFlow work with the rest of your state, and what are its limits?",
    a: [
      {
        t: "p",
        text: "`getStateFlow(key, initial)` returns a `StateFlow` backed by the handle: writing `savedStateHandle[key] = value` emits to the flow *and* marks the value for saved-state persistence — so a field both drives UI reactively and survives process death with one line. Typical pattern: persist raw inputs (query, selected filters) via handle-backed flows, `combine` them with repository flows, and `stateIn` the result; the heavy derived state is rebuilt on restore instead of persisted.",
      },
      {
        t: "list",
        items: [
          "Values must be Bundle-able (primitives, Parcelable, Serializable) — arbitrary domain objects need mapping or `SavedStateHandle.setSavedStateProvider` for custom serialization.",
          "Size: part of the Binder-limited saved state (~1 MB total) — ids and inputs only, `TransactionTooLargeException` otherwise.",
          "Saving happens at `onSaveInstanceState` time — mutations after the Activity is stopped may not be captured if the process dies immediately.",
          "It's per-owner: a nav-graph-scoped VM's handle restores with the graph entry; also note `SavedStateHandle` in Compose Multiplatform arrived later than the VM itself — check versions in KMP.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "Should the ViewModel know about navigation? Discuss the approaches.",
    a: [
      {
        t: "list",
        items: [
          "**VM emits navigation events** (Channel/state), View executes with NavController — most common; keeps NavController (a UI-layer object) out of the VM; testable by asserting emitted events. Downside: event-delivery caveats.",
          "**Navigation as state** — a `destination` field in UiState (or Compose Navigation 3-style back stack derived from state); most robust across process death and deep links, aligns with state-driven navigation direction the ecosystem is moving in.",
          "**Injecting a Navigator abstraction** into the VM — an interface the VM calls (`navigator.goToDetails(id)`), implemented over NavController. Reads nicely and mocks easily, but the VM now triggers UI actions imperatively and the navigator implementation must handle lifecycle (not firing while stopped).",
          "**NavController directly in the VM — never**: it's tied to views/lifecycle; holding it in a VM is the leak/lifecycle bug the pattern forbids.",
        ],
      },
      {
        t: "p",
        text: "My answer: decisions about *whether/where* to navigate are presentation logic and belong in the VM; the *mechanics* belong in the View. Events or navigation-state both satisfy that — I lean state-based for anything that must survive process death.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you implement debounced search properly in a ViewModel?",
    a: [
      {
        t: "code",
        title: "The canonical reactive pipeline",
        code: `private val query = savedStateHandle.getStateFlow("query", "")

@OptIn(ExperimentalCoroutinesApi::class, FlowPreview::class)
val results: StateFlow<SearchUiState> = query
    .debounce(300)
    .distinctUntilChanged()
    .flatMapLatest { q ->
        if (q.isBlank()) flowOf(SearchUiState.Idle)
        else repository.search(q)
            .map<List<Item>, SearchUiState> { SearchUiState.Results(it) }
            .onStart { emit(SearchUiState.Searching) }
            .catch { emit(SearchUiState.Error(it.message)) }
    }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SearchUiState.Idle)

fun onQueryChange(q: String) { savedStateHandle["query"] = q }`,
      },
      {
        t: "list",
        items: [
          "`debounce(300)` — wait for typing to pause; `distinctUntilChanged` — skip no-op changes (StateFlow gives this for the query itself, but it matters post-debounce).",
          "**`flatMapLatest`** is the load-bearing operator: a new query **cancels** the in-flight search, killing the classic race where a slow old response overwrites fresh results. (`flatMapConcat` would queue, `flatMapMerge` would race.)",
          "`catch` *inside* the inner flow: an error kills only that search, not the whole pipeline — a `catch` on the outer flow would end results forever.",
          "SavedStateHandle-backed query → search state survives process death; test with virtual time (`advanceTimeBy(300)`).",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "Error handling strategy in a ViewModel: exceptions, CoroutineExceptionHandler, Result types?",
    a: [
      {
        t: "list",
        items: [
          "**Prefer errors as data**: repositories return sealed results (`Result`/`Either`, or emit error states in flows) so the VM handles failure as an expected branch and maps it into UiState. Exceptions escaping into `viewModelScope` mean a crash (in a `launch`, an uncaught exception hits the thread's handler → app crash; `SupervisorJob` only protects *siblings*).",
          "**`runCatching`/try-catch at the call site** for suspend calls; but never blanket-catch `CancellationException` — swallowing it breaks structured cancellation (rethrow it, or catch specific exceptions).",
          "**Flows**: `catch` operator placed to scope the failure correctly (inner flow for per-operation errors); `retry`/`retryWhen` for transient network errors with backoff.",
          "**CoroutineExceptionHandler** installed into the scope is a *last-resort* logger/crash-prevention net, not a control-flow mechanism — by the time it fires the coroutine is dead.",
          "Map technical errors to **semantic UI errors** in the VM (offline vs server vs validation) — the View shouldn't parse exception types.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "What's wrong with starting data loads in a ViewModel's init block? Is there a better pattern?",
    a: [
      {
        t: "p",
        text: "It's common and works, but know the trade-offs. Problems: work starts at *construction* — in tests the coroutine races your setup (especially with `UnconfinedTestDispatcher`) before you can install fakes' behavior or attach Turbine; with lazy `by viewModels()` the start time is 'whenever first accessed', which is implicit; retry-on-failure needs a separate public function anyway; and `init` work runs even if the UI never actually collects.",
      },
      {
        t: "p",
        text: "The alternative: build state as a **cold chain started by collection** — repository flow + `onStart`/`flatMapLatest` + `stateIn(WhileSubscribed(5000))`. Loading begins when the UI subscribes, stops when it leaves, restarts on return, and tests control it by choosing when to collect. Google's samples largely moved to this 'lazy observable state' shape. `init` remains fine for cheap wiring or fire-once triggers — the senior answer is knowing *why* you'd choose each.",
      },
    ],
  },
  {
    level: "senior",
    q: "Compose specifics: collectAsState vs collectAsStateWithLifecycle, and should you pass the ViewModel down the tree?",
    a: [
      {
        t: "p",
        text: "`collectAsState()` collects in the composition's scope — it keeps collecting while the app is backgrounded (composition isn't disposed on ON_STOP). `collectAsStateWithLifecycle()` wraps collection in `repeatOnLifecycle(STARTED)` — collection stops in background and, combined with `WhileSubscribed(5000)`, the upstream stops too. Default to the lifecycle variant on Android; plain `collectAsState` is acceptable in previews/desktop CMP where the lifecycle concept differs.",
      },
      {
        t: "p",
        text: "ViewModel placement: inject it at the **screen-level composable only**; children receive **state and lambdas** (`state: UiState, onRetry: () -> Unit`). Passing VMs deep kills `@Preview`s (they can't build VMs), couples reusable components to one screen's VM, and makes recomposition reasoning harder. Also know the scoping subtlety: `viewModel()`/`hiltViewModel()` scope to the nearest `ViewModelStoreOwner` — the nav back-stack entry — so the same call in two destinations returns different instances.",
      },
    ],
  },
  {
    level: "senior",
    q: "Two screens need to observe and mutate the same data. Shared ViewModel or something else?",
    a: [
      {
        t: "p",
        text: "Reach for the **data layer first**: make the repository the single source of truth exposing a hot/observed `Flow` (Room queries, an in-memory `MutableStateFlow` cache); each screen's ViewModel observes it independently and mutations go through repository functions. This survives any navigation topology, process recreation per-screen, and keeps ViewModels screen-scoped. A **shared ViewModel** (activity- or nav-graph-scoped) is the right tool for *transient flow state* that has no business in the data layer — wizard steps, in-progress form input across a checkout graph — where the nav-graph scope also gives automatic cleanup on flow exit.",
      },
      {
        t: "p",
        text: "Anti-pattern to call out: an activity-scoped God ViewModel used as a message bus between unrelated screens — outlives its usefulness, accumulates state, and hides data-flow direction.",
      },
    ],
  },
  {
    level: "senior",
    q: "Where do memory leaks still happen in MVVM apps, and how do you find them?",
    a: [
      {
        t: "list",
        items: [
          "**VM → UI references**: holding Context/View/Fragment/listener in the VM (including via lambda captures — an `onClick` stored in the VM capturing the Fragment).",
          "**Wrong lifecycle owner in fragments**: observing/collecting with the Fragment's lifecycle instead of `viewLifecycleOwner` — view recreated on back-stack return, old bindings/adapters leak; same for keeping a `_binding` not nulled in `onDestroyView`.",
          "**Un-cancelled collections**: collecting in `GlobalScope` or an application scope from UI code; callbacks registered on singletons and never unregistered (VM registering a listener on a singleton repository without removing it in `onCleared`).",
          "**Anonymous inner classes / handlers** capturing the Activity outliving it.",
          "**Static/companion caches** of UI objects.",
        ],
      },
      {
        t: "p",
        text: "Detection: **LeakCanary** in debug builds (watches destroyed activities/fragments/view models automatically), Android Studio Memory Profiler heap dumps (search retained Activity instances, follow the shortest GC-root path), and StrictMode for some cases. Process discipline: `onCleared` must undo everything `init` registered.",
      },
    ],
  },
  {
    level: "senior",
    q: "Critique MVVM: what are its genuine weaknesses, and when would you not use it?",
    a: [
      {
        t: "list",
        items: [
          "**Under-specified**: MVVM says nothing about state shape, events, or the data layer — two 'MVVM apps' can look wildly different; teams need added conventions (UDF, single UiState) to stay consistent — which is effectively drifting toward MVI.",
          "**The event problem is unsolved by the pattern itself** — one-shot delivery needs bolt-on idioms, each with failure modes.",
          "**ViewModel as god-object gravity**: the VM is the easiest place to dump code, and the pattern has no built-in pressure against it.",
          "**Overkill for trivial UI**: a static screen or a tiny utility app doesn't need the ceremony; and heavily server-driven UIs may fit a different shape entirely.",
          "**Debugging indirection**: with many combined streams, answering 'why did this render?' means tracing reactive graphs — worse without discipline around naming and derived state.",
        ],
      },
      {
        t: "p",
        text: "When not: throwaway prototypes, screens with no state (pure display), or when the team is committed to a stricter framework (MVI/Redux-style, or Decompose components in KMP) where adding classic MVVM alongside would fragment the codebase. The mature position: MVVM-with-UDF is the pragmatic default on Android/KMP, applied with judgment rather than dogma.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is AndroidViewModel and why is it discouraged?",
    a: [
      {
        t: "p",
        text: "`AndroidViewModel` is a ViewModel subclass that receives the `Application` in its constructor — the sanctioned way to have a context in a VM, safe from leaks because Application is a process-lifetime singleton. It's discouraged because needing a context in the VM usually signals **misplaced responsibility**: resource strings belong in the View or come via a resource-provider abstraction; file/database/preferences access belongs in the data layer. It also drags an Android dependency into the class — killing plain-JVM unit tests (Robolectric or instrumentation needed) and making the VM unshareable in KMP `commonMain`. With DI you can inject `@ApplicationContext` anyway, so the base class adds little; prefer injecting narrow abstractions instead.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain cold vs hot flows in the context of a ViewModel, and where each appears.",
    a: [
      {
        t: "p",
        text: "**Cold** flows (`flow { }`, Room/Retrofit-adapter flows, repository chains) run their producer *per collector*, starting on collection — each collector gets its own execution. **Hot** flows (`StateFlow`, `SharedFlow`, channels) exist and emit independently of any particular collector, multicasting to all of them.",
      },
      {
        t: "list",
        items: [
          "The typical VM is a **cold-to-hot converter**: cold repository chain → operators → `stateIn`/`shareIn` → hot state the UI observes. Without `stateIn`, two collectors of the same chain (or recollection after rotation) would re-execute the query — duplicate work, duplicate network calls.",
          "`stateIn` = hot + latest-value cache + initial value (state); `shareIn` = hot multicast with configurable replay (streams). Both take a `SharingStarted` policy.",
          "Interview edge: `StateFlow.collect` never completes (hot flows don't end) — so code *after* `collect { }` in the same coroutine is unreachable; each hot collection needs its own `launch`. Also `Flow.asLiveData()` exists for legacy bridges.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "How would you migrate a legacy MVP (or God-Activity) codebase to MVVM incrementally?",
    a: [
      {
        t: "list",
        items: [
          "**Strangler approach, screen by screen** — never a big-bang rewrite; both patterns coexist behind the same repository layer.",
          "**Step 0: carve out the data layer** — if Presenters/Activities call APIs directly, extract repositories first; this benefits both old and new code and is where most risk hides.",
          "**Mechanical MVP→MVVM per screen**: the Presenter's logic moves into a ViewModel; every `view.showX(...)` call becomes a field in a `UiState` emitted through StateFlow; the View interface is deleted and the Activity/Fragment becomes a renderer of state. Attach/detach lifecycle code disappears (viewModelScope + repeatOnLifecycle replace it).",
          "**Characterization tests first** on the Presenter where coverage is thin — then port; the new VM tests assert emitted states instead of verified view-mock calls (usually *simpler*).",
          "**Prioritize** screens that are actively changing or crash-prone; leave stable dead screens for last (or forever). New features: MVVM only.",
          "**Team conventions before scale**: agree the UiState/event/DI idioms on the first migrated screen and document it — otherwise you get N dialects of MVVM.",
        ],
      },
    ],
  },
];

export default qa;
