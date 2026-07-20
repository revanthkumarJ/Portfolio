// MVP — Interview Prep tab.

const qa = [
  {
    level: "junior",
    q: "What is MVP and how does data flow through it?",
    a: [
      {
        t: "p",
        text: "Model–View–Presenter. The **View** (Activity/Fragment implementing a View interface) is passive: it forwards user events to the **Presenter** and exposes methods like `showUser(...)` that only mutate widgets. The **Presenter** — a plain class with no Android imports — receives events, calls the **Model** (repositories), and pushes results back by calling View interface methods. Flow: user input → View → Presenter → Model → Presenter → View. Nothing goes View↔Model directly — that's the fix over MVC.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a 'contract' in MVP?",
    a: [
      {
        t: "p",
        text: "A container interface (usually `SomethingContract`) declaring the paired `View` and `Presenter` interfaces for one screen — the explicit API between the two. Benefits: the whole screen's interaction surface is readable in one place, the Presenter depends only on the abstract View (mockable in tests), and either side can be swapped. Cost: one more file of ceremony per screen — part of why MVP felt heavy.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why is the Presenter easy to unit test?",
    a: [
      {
        t: "p",
        text: "Because it's a plain JVM class whose only 'UI' dependency is the View *interface* — in a test you mock the View and the repository, call presenter methods, and **verify** the expected View calls happened (`verify(view).showUser(...)`), including their order. No emulator, no Robolectric. The one thing to handle is threading: swap the main-thread scheduler/dispatcher for a synchronous test one.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why must you call detach() (or null the view) in MVP, and what happens if you forget?",
    a: [
      {
        t: "p",
        text: "The Presenter holds a strong reference to the View, which on Android is the Activity/Fragment. When the Activity is destroyed (rotation, back), the Presenter's reference keeps the entire destroyed Activity — and its view hierarchy — reachable, so the GC can't reclaim it: a **memory leak**. Worse, an async result arriving after destruction would call methods on a dead Activity (crashes touching views, `IllegalStateException`s). Hence the ceremony: `attach(view)` in onCreate/onStart, `detach()` (nulling the reference and cancelling work) in onDestroy/onStop — and `view?.` guards on every async callback.",
      },
    ],
  },
  {
    level: "junior",
    q: "Presenter vs ViewModel — what's the core difference?",
    a: [
      {
        t: "p",
        text: "The direction of the arrow to the View. A **Presenter** holds a View reference and *pushes* imperatively: `view.showLoading()`. A **ViewModel** holds no View reference; it exposes observable state and the View *pulls/observes*. Consequences: the ViewModel needs no attach/detach and can't leak the Activity; it survives configuration changes (Jetpack); and a new observer automatically receives current state, whereas a re-attached MVP View is blank until the Presenter replays state manually.",
      },
    ],
  },
  {
    level: "junior",
    q: "What happens in MVP when the screen rotates during a network call?",
    a: [
      {
        t: "p",
        text: "The Activity detaches and is destroyed; the new Activity attaches (usually to a *new* Presenter). The in-flight result then hits `view?.showUser(...)` with a null or stale view — so the update is **silently dropped** and the new screen either re-fetches (flicker, wasted request) or shows nothing. Solving this properly required retaining the Presenter (retained fragment, static cache, or libraries like Mosby/Nucleus that also buffer results and replay them to the re-attached view) — exactly the machinery Jetpack ViewModel + StateFlow made obsolete.",
      },
    ],
  },
  {
    level: "junior",
    q: "Is the Activity the View or something else in MVP?",
    a: [
      {
        t: "p",
        text: "The Activity/Fragment **is the View** — it implements the View interface and does nothing but widget mutation and event forwarding. That's the philosophical shift from Android MVC: instead of fighting to make the Activity a controller, MVP demotes it to a dumb rendering shell and moves the brain into a framework-free Presenter. Follow-up worth volunteering: 'passive view' is the ideal — any `if` beyond trivial rendering that appears in the Activity is logic escaping the Presenter.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain Passive View vs Supervising Controller and the trade-off between them.",
    a: [
      {
        t: "p",
        text: "Fowler's two MVP flavors. **Passive View**: the View is entirely driven by explicit Presenter calls — every text, every visibility. All UI decisions become presenter logic, so test coverage of presentation is total; the price is an interface method for every pixel-level change and verbose presenters. **Supervising Controller**: trivial, declarative bindings go straight View↔Model (e.g. data binding for a name field), and the Presenter handles only complex logic and input — less boilerplate, but simple-binding decisions escape testability and logic gradually leaks viewward.",
      },
      {
        t: "p",
        text: "Senior observation: the industry's path Passive View → Supervising Controller → MVVM is one continuous slide — each step replaces imperative view calls with declarative binding, and MVVM is the endpoint where *all* of it is binding/observation.",
      },
    ],
  },
  {
    level: "senior",
    q: "How did production MVP apps keep Presenters alive across configuration changes before Jetpack?",
    a: [
      {
        t: "list",
        items: [
          "**Retained fragment** (`setRetainInstance(true)`) holding the Presenter — the sanctioned pre-Jetpack survival hack (deprecated since).",
          "**Static/application-scoped presenter caches** keyed by screen id, with manual eviction on real finish — leak-prone and easy to get wrong on multi-window/multi-instance.",
          "**Loaders** (`LoaderManager`) — framework-retained async, awkward API, sometimes abused as presenter hosts.",
          "**Libraries**: Mosby (presenter retention + `ViewState` replayed onto re-attached views), Nucleus (retention + delivering cached Rx results on re-attach).",
        ],
      },
      {
        t: "p",
        text: "Two follow-up points that score: all of these still lose the Presenter on **process death** — input state needed `onSaveInstanceState` handling separately (same split as ViewModel vs SavedStateHandle today); and the very existence of this hack zoo is the evidence that the pattern fought the platform — the Jetpack ViewModel is institutionally 'the retained presenter done right'.",
      },
    ],
  },
  {
    level: "senior",
    q: "MVP interaction-based tests vs MVVM state-based tests — which are better and why?",
    a: [
      {
        t: "p",
        text: "MVP tests **verify calls**: `verify(view).showUser(\"Revanth\", true)` with `inOrder` for sequencing. MVVM tests **assert values**: collect the state flow and check emitted `UiState`s. State-based is generally more robust: interaction tests are coupled to the *names and granularity* of view methods — split `showUser` into two calls and every test breaks with identical behavior; mock-verification also can't easily express 'the final state is X regardless of path'. Interaction tests do have one edge: they naturally catch *unwanted* calls (`verify(view, never()).showError(...)`) and exact ordering/timing of imperative effects. Net: assert state where possible, verify interactions only for genuine one-shot effects — which is precisely the shape modern MVVM testing (state assertions + event-channel assertions) converged on.",
      },
    ],
  },
  {
    level: "senior",
    q: "Sketch the mechanical recipe for migrating one MVP screen to MVVM.",
    a: [
      {
        t: "list",
        items: [
          "**Inventory the View interface** — it's a specification of the screen's states: each `showX(args)` becomes a field (or variant) of a new `UiState` data class; overlapping calls (`showLoading` + stale list visible) tell you whether you need flags or a sealed hierarchy.",
          "**Presenter → ViewModel**: same constructor deps (repositories); each event method stays; every `view?.callX(...)` becomes `_uiState.update { ... }`. One-shot calls (`navigateTo`, `showToast`) move to an event channel or consumed-state fields.",
          "**Delete attach/detach**; `CompositeDisposable`/manual cancellation becomes `viewModelScope`; Rx chains become coroutines/Flow (or keep Rx with `asFlow` bridges initially — smaller diff).",
          "**View side**: contract implementation replaced by one render function collecting state via `repeatOnLifecycle` (or the screen goes Compose in the same step if the team allows).",
          "**Tests**: each `verify(view).x(...)` assertion becomes an `awaitItem()` state assertion — usually a line-for-line translation.",
        ],
      },
      {
        t: "p",
        text: "Sequencing advice: migrate the *most-edited* screens first (highest interest earned), keep both patterns behind the same repositories, and forbid new MVP screens from day one.",
      },
    ],
  },
  {
    level: "senior",
    q: "In MVP, where do one-shot actions like navigation and toasts go, and how does that compare to MVVM's event problem?",
    a: [
      {
        t: "p",
        text: "MVP handles them *trivially*: the Presenter just calls `view.navigateToDetails(id)` — imperative push makes one-shot actions natural, no stickiness possible. The catch is the detached window: fire it while the view is detached and it's dropped (rotate right after a save completes → the navigation never happens), so retained-presenter setups had to queue pending view commands and flush on re-attach — Nucleus/Mosby did exactly this. MVVM inverted the trade: state observation made *continuous* UI trivial but made *one-shot* delivery the hard problem (sticky state, dropped SharedFlow emissions, Channel semantics). It's a genuinely symmetric trade-off, and framing it that way — each pattern is awkward exactly where the other is natural — is a strong senior answer.",
      },
    ],
  },
  {
    level: "senior",
    q: "Could you use MVP in a KMP project? Why does the ecosystem not do it?",
    a: [
      {
        t: "p",
        text: "Technically yes — a Presenter is a plain class, and contract interfaces cross platforms fine; early KMM experiments did exactly this. The ecosystem rejected it for three reasons. First, the **lifecycle ceremony multiplies per platform**: every host (Activity, Fragment, UIViewController, SwiftUI view) must implement attach/detach correctly — the leak-prone part is now duplicated. Second, **imperative push doesn't fit SwiftUI/Compose**, which are state-driven by construction: a `view.showUser(...)` call has nowhere natural to land in declarative UI, whereas an observable `StateFlow<UiState>` maps directly onto both. Third, shared observable state via coroutines/Flow was the piece MVP existed to avoid needing — and in KMP it's already there. So shared code converged on ViewModel-shaped state holders (androidx KMP ViewModel, moko-mvvm, Decompose components) exposing StateFlow.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the failure modes of MVP at scale that you'd warn a team about?",
    a: [
      {
        t: "list",
        items: [
          "**Contract explosion** — hundreds of near-identical View/Presenter interface pairs; renaming a UI behavior touches interface + implementation + presenter + tests.",
          "**God Presenters** — the God Activity relocated: without a data/domain layer discipline, presenters absorb caching, mapping and business rules. MVP doesn't prevent it; it just moves the pile.",
          "**View methods becoming a remote control** — dozens of granular `setXVisible(Boolean)` methods whose valid *combinations* are undocumented; the screen's actual state space lives implicitly in call ordering (MVVM's single UiState fixes this by making the state space explicit).",
          "**Lifecycle bug taxes** — every new async source re-introduces the detached-window/null-view/leak class of bugs; code review must police it forever.",
          "**Interaction-test brittleness** — large mock-verification suites that break on refactors, training the team to rubber-stamp test changes.",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "What problem did MVP solve that MVC couldn't?",
    a: [
      {
        t: "p",
        text: "The core problem with Android MVC was that the Activity was both View and Controller, so presentation logic had no home outside the framework — making it untestable and tangled. MVP solved this by extracting all presentation logic into a **Presenter**, a plain class with no Android dependencies, leaving the Activity as a passive View.",
      },
      {
        t: "list",
        items: [
          "**Testability** — the Presenter is a pure Kotlin/Java class, so you can unit-test presentation logic on the JVM by mocking the View interface. In MVC that logic was welded to the Activity and needed an emulator.",
          "**A home for logic** — MVC gave logic no structural place, so it accreted in the Activity. MVP designates the Presenter as that home.",
          "**Decoupling View from Model** — in MVC the View reads the Model directly (coupling); in MVP the Presenter mediates all View↔Model traffic, so the View never touches the Model.",
        ],
      },
      {
        t: "p",
        text: "The key insight is *why* MVP came before MVVM historically: when teams hit the God-Activity wall (~2013–2015), Android had no observability primitives (no LiveData, no lifecycle-aware anything). MVP needed nothing new — just plain interfaces and classes, instantly testable with JUnit + Mockito. MVVM only became practical when Jetpack shipped the ViewModel and LiveData in 2017. So MVP was the pragmatic fix available at the time.",
      },
      {
        t: "note",
        text: "MVP's one-line pitch: 'move presentation logic into a framework-free Presenter so it's testable' — and note it won because it needed no new tooling, unlike MVVM which waited for Architecture Components.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the Presenter's responsibilities?",
    a: [
      {
        t: "p",
        text: "The Presenter is the middle layer that holds all presentation logic. It receives user events forwarded from the View, talks to the Model (repositories/use cases) to get or change data, and then tells the View what to display by calling methods on a View interface. It contains zero Android imports — it's a plain class.",
      },
      {
        t: "list",
        items: [
          "**Handle user events** — the View forwards input (`onRefreshClicked()`); the Presenter decides what to do.",
          "**Talk to the Model** — call repositories/use cases to fetch or mutate data.",
          "**Drive the View via its interface** — `view.showLoading()`, `view.showUser(name)`, `view.showError(msg)` — the Presenter *pushes* to the View imperatively.",
          "**Presentation logic** — formatting, deciding what's visible, mapping domain data to display form.",
          "**Manage its View reference** — attach the View on start, detach (null it) on stop to avoid leaks.",
        ],
      },
      {
        t: "code",
        title: "A Presenter's shape",
        code: `class UserPresenter(private val repo: UserRepository) : UserContract.Presenter {
    private var view: UserContract.View? = null
    override fun attach(v: UserContract.View) { view = v }
    override fun detach() { view = null }   // critical: avoid leaking the Activity

    override fun onLoadUser(id: String) {
        view?.showLoading()
        repo.getUser(id,
            onSuccess = { user -> view?.showUser(user.name) },   // push to View
            onError   = { e -> view?.showError(e.message) })
    }
}`,
      },
      {
        t: "p",
        text: "The distinguishing trait vs a ViewModel: the Presenter *holds a View reference and pushes to it imperatively* (`view.showX()`), whereas a ViewModel holds no View reference and exposes state the View observes. Every MVP strength (simple, testable) and weakness (attach/detach ceremony, leak risk) flows from that one arrow — the Presenter → View reference.",
      },
      {
        t: "note",
        text: "The Presenter 'pushes' to a View interface (imperative); the ViewModel exposes state the View 'pulls' (observation). That single difference explains all of MVP's ceremony.",
      },
    ],
  },
  {
    level: "junior",
    q: "Show a complete MVP implementation — contract, presenter, and view.",
    a: [
      {
        t: "p",
        text: "The signature artifact of MVP is the **contract** — a single interface pairing the View and Presenter interfaces for one screen, so the whole interaction surface is readable in one place and both sides are mockable. Here's a full example.",
      },
      {
        t: "code",
        title: "The contract",
        code: `interface UserContract {
    interface View {                       // what the Presenter can do TO the View
        fun showLoading()
        fun hideLoading()
        fun showUser(name: String)
        fun showError(message: String)
    }
    interface Presenter {                  // what the View can ask the Presenter
        fun attach(view: View)
        fun detach()
        fun onLoadUser(id: String)
    }
}`,
      },
      {
        t: "code",
        title: "The Presenter (plain class — unit-testable)",
        code: `class UserPresenter(private val repo: UserRepository) : UserContract.Presenter {
    private var view: UserContract.View? = null
    override fun attach(view: UserContract.View) { this.view = view }
    override fun detach() { view = null }

    override fun onLoadUser(id: String) {
        view?.showLoading()
        repo.getUser(id) { result ->
            view?.hideLoading()
            result.onSuccess { view?.showUser(it.name) }
                  .onFailure { view?.showError(it.message ?: "Error") }
        }
    }
}`,
      },
      {
        t: "code",
        title: "The View (a passive Activity)",
        code: `class UserActivity : AppCompatActivity(), UserContract.View {
    private lateinit var presenter: UserContract.Presenter
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_user)
        presenter = UserPresenter(repository)
        presenter.attach(this)                     // attach on start
        loadButton.setOnClickListener { presenter.onLoadUser("42") }
    }
    override fun onDestroy() { presenter.detach(); super.onDestroy() }  // detach on stop

    override fun showLoading() { progress.isVisible = true }
    override fun hideLoading() { progress.isVisible = false }
    override fun showUser(name: String) { nameText.text = name }
    override fun showError(message: String) { toast(message) }
}`,
      },
      {
        t: "p",
        text: "Notice the ceremony: the contract file, the attach/detach lifecycle, and the `view?.` null-guard on every callback (the view may be detached when the async result arrives). This boilerplate — one View interface + implementation per screen, plus lifecycle plumbing — is exactly why MVVM's observation model eventually replaced it.",
      },
      {
        t: "note",
        text: "The contract interface is MVP's signature — mention it names the whole screen's interaction surface and makes both sides mockable, then note the boilerplate it implies.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle loading and error states in MVP?",
    a: [
      {
        t: "p",
        text: "In MVP you handle loading/error by adding explicit methods to the View interface and having the Presenter call them imperatively at the right moments — `view.showLoading()` before an async call, `view.hideLoading()` and `view.showUser()` or `view.showError()` in the callback. The View just implements each method by mutating widgets.",
      },
      {
        t: "code",
        title: "Loading/error as View-interface methods",
        code: `// Contract View methods:
fun showLoading(); fun hideLoading()
fun showContent(data: Data); fun showError(msg: String)

// Presenter drives them:
override fun onLoad() {
    view?.showLoading()
    repo.load { result ->
        view?.hideLoading()                    // must remember in BOTH branches
        result.onSuccess { view?.showContent(it) }
              .onFailure { view?.showError(it.message ?: "Error") }
    }
}`,
      },
      {
        t: "p",
        text: "The awkwardness — and a good thing to point out — is that the *state* isn't represented as a single value; it's implied by which combination of `showX()` methods were last called. This is the imperative-UI problem: you must remember every transition (show loading → hide loading → hide error → show content), and forgetting one leaves stale UI (spinner stuck, error lingering under content). It's testable (you can `verify(view).showLoading()` then `showContent()`), but brittle to the exact call sequence.",
      },
      {
        t: "p",
        text: "MVVM fixes this by modeling the screen as a single immutable `UiState` (Loading/Content/Error) that the ViewModel emits and the View renders wholesale — one value, no forgotten transitions. That contrast (imperative view-method calls vs a single observable state) is the crux of why MVP gave way to MVVM.",
      },
      {
        t: "note",
        text: "In MVP loading/error are View-interface *methods* the Presenter calls; the weakness is state lives implicitly in the call sequence — MVVM's single UiState value is the fix.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you pass dependencies and arguments into a Presenter?",
    a: [
      {
        t: "p",
        text: "Because a Presenter is a plain class you construct yourself (unlike a ViewModel), you pass its dependencies through its constructor — repositories, use cases, schedulers — and runtime arguments (like an id) either through the constructor or through the method that starts the work. With a DI framework you inject the Presenter's dependencies via `@Inject constructor`.",
      },
      {
        t: "code",
        title: "Constructor injection + runtime args",
        code: `// Dependencies via constructor (DI-friendly)
class UserPresenter @Inject constructor(
    private val repo: UserRepository,
    private val analytics: Analytics,
) : UserContract.Presenter {
    // Runtime arg passed to the method that starts work:
    override fun onLoadUser(id: String) { /* use id */ }
}

// The Activity creates/injects it and passes the id:
presenter.attach(this)
presenter.onLoadUser(intent.getStringExtra("id")!!)`,
      },
      {
        t: "p",
        text: "This is actually *simpler* than ViewModel construction historically: a ViewModel with constructor arguments needed a hand-written `ViewModelProvider.Factory` (before Hilt generated it), whereas a Presenter is just `UserPresenter(repo)`. The trade-off is that the Presenter's *lifecycle* is now your responsibility — you construct it, attach the View, and must detach/recreate it correctly across configuration changes, which the ViewModel handles automatically.",
      },
      {
        t: "p",
        text: "The gotcha: because you construct the Presenter in `onCreate`, a naive implementation creates a *new* Presenter on every rotation, losing in-flight work and state. Production MVP had to keep the Presenter alive across rotation (retained fragments, loaders, or libraries like Mosby/Nucleus) — the very machinery the Jetpack ViewModel made obsolete.",
      },
      {
        t: "note",
        text: "Presenters take deps via constructor (easy, DI-friendly) — but you own their lifecycle, so surviving rotation needs retain hacks that ViewModel later eliminated.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does 'Passive View' mean, and why is it the ideal in MVP?",
    a: [
      {
        t: "p",
        text: "A Passive View is a View that does *nothing on its own* — it has no logic, no decisions, no direct Model access. It only implements methods that mutate widgets (`showUser(name)` sets a text field) and forwards raw user input to the Presenter (`onClick { presenter.onSave() }`). Every decision about *what* to show lives in the Presenter.",
      },
      {
        t: "p",
        text: "It's the ideal in MVP because it maximizes testability: if the View is truly passive, then *all* the interesting logic (what to show, when, in what format) is in the Presenter, which is unit-testable. Any `if` beyond trivial rendering that creeps into the View is logic escaping the Presenter — untestable and a design smell.",
      },
      {
        t: "code",
        title: "Passive vs leaky View",
        code: `// PASSIVE (ideal): View just renders what it's told
override fun showUser(displayName: String) { nameText.text = displayName }
// Presenter decided the format: view.showUser(if (premium) "⭐ $name" else name)

// LEAKY (bad): logic in the View — now untestable
override fun showUser(user: User) {
    nameText.text = if (user.isPremium) "⭐ \${user.name}" else user.name  // decision in View!
}`,
      },
      {
        t: "p",
        text: "The contrast is with 'Supervising Controller' (the other MVP flavor), where the View handles *simple* declarative binding itself and the Presenter only handles complex logic. Supervising Controller has less boilerplate but lets some logic leak into the View. Passive View is stricter (more boilerplate, total testability); Supervising Controller is pragmatic (less boilerplate, some untestable binding). The industry slide from Passive View → Supervising Controller → MVVM is one continuous move toward declarative binding.",
      },
      {
        t: "note",
        text: "Passive View = the View makes zero decisions, so 100% of logic is in the testable Presenter. The litmus test: any `if` in the View (beyond trivial rendering) is logic that leaked out.",
      },
    ],
  },
  {
    level: "senior",
    q: "How exactly does unit-testing a Presenter work?",
    a: [
      {
        t: "p",
        text: "You unit-test a Presenter by mocking the View interface and the repository, calling the Presenter's event methods, and then *verifying* that the expected View methods were called (with the right arguments, in the right order). Because the Presenter's only 'UI' dependency is the View *interface*, you never need a real Activity or device.",
      },
      {
        t: "code",
        title: "A Presenter test (JUnit + MockK)",
        code: `@Test fun loadUser_success_showsUser() {
    val view: UserContract.View = mockk(relaxed = true)
    val repo: UserRepository = mockk()
    every { repo.getUser("42", any()) } answers {
        secondArg<(Result<User>) -> Unit>()(Result.success(User("Revanth", premium = true)))
    }
    val presenter = UserPresenter(repo)
    presenter.attach(view)

    presenter.onLoadUser("42")

    verifyOrder {                                  // assert INTERACTIONS
        view.showLoading()
        view.hideLoading()
        view.showUser("⭐ Revanth")               // and the formatted output
    }
    verify(exactly = 0) { view.showError(any()) }  // and what did NOT happen
}`,
      },
      {
        t: "list",
        items: [
          "**Interaction-based** — you assert 'these View methods were called', not 'this state equals X'. This is the key stylistic difference from MVVM testing (which asserts emitted state).",
          "**Mock the View interface** — the passive View is trivial to mock; you check what the Presenter told it to do.",
          "**No device** — pure JVM, fast, deterministic.",
        ],
      },
      {
        t: "p",
        text: "The downside of interaction-based tests: they're coupled to the *exact* View method calls, so refactoring the Presenter's implementation (splitting `showUser` into two calls) breaks tests even when behavior is identical. MVVM's state assertions are more robust because they check the *outcome* (the final state) rather than *how* it was produced.",
      },
      {
        t: "note",
        text: "MVP tests are *interaction-based* (`verify(view).showUser(...)`); MVVM tests are *state-based* (assert the emitted UiState). State-based is more refactor-proof — a good comparison to volunteer.",
      },
    ],
  },
  {
    level: "junior",
    q: "MVC vs MVP — what specifically changed between them?",
    a: [
      {
        t: "p",
        text: "The single structural change from MVC to MVP is *who the View talks to*. In MVC the View reads/observes the Model directly. In MVP the View is fully insulated from the Model — all traffic goes through the Presenter, which holds a reference to the View (via an interface) and pushes updates to it.",
      },
      {
        t: "table",
        headers: ["", "MVC", "MVP"],
        rows: [
          ["View ↔ Model", "View observes Model directly", "fully separated — Presenter mediates"],
          ["Middle → View", "Controller usually doesn't touch View", "Presenter holds a View interface, pushes to it"],
          ["Where logic lives", "Activity (View+Controller fused)", "the Presenter (framework-free)"],
          ["Testability", "poor (welded to Android)", "good (mock the View interface)"],
          ["Boilerplate", "low", "higher (contract interfaces per screen)"],
        ],
      },
      {
        t: "p",
        text: "The practical consequences: MVP made presentation logic *testable* (the Presenter is a plain class) and *decoupled* the View from the Model (so Model refactors don't ripple into the UI). The cost was boilerplate — a View interface and Presenter interface (the contract) per screen, plus attach/detach lifecycle management. MVC has less ceremony but no testable seam.",
      },
      {
        t: "note",
        text: "The one-sentence delta: 'MVP inserts a testable Presenter between View and Model, so the View never touches the Model and logic leaves the Activity — at the cost of contract boilerplate.'",
      },
    ],
  },
  {
    level: "senior",
    q: "For a brand-new Android project, would you choose MVP or MVVM? Defend it.",
    a: [
      {
        t: "p",
        text: "For any new Android project, I'd choose MVVM (with UDF and a single UiState), not MVP. There's essentially no scenario in modern Android where MVP is the better choice for new code — MVVM solves every MVP pain point using tooling that's now standard, and MVP's only historical advantage (no new tooling required) is irrelevant now.",
      },
      {
        t: "list",
        items: [
          "**Config-change survival** — the Jetpack ViewModel survives rotation for free; MVP needs retain hacks (retained fragments, loaders, Mosby/Nucleus).",
          "**No attach/detach ceremony** — MVVM's observation model means no View reference to manage, no `view?.` null dance, no leak risk from a forgotten `detach()`.",
          "**Less boilerplate** — one `UiState` class vs a View interface + implementation per screen.",
          "**State replay for free** — a new observer of a `StateFlow` immediately gets the current state; a re-attached MVP View is blank until the Presenter replays.",
          "**KMP-ready** — MVVM's state (StateFlow) works in shared code; MVP's imperative view-interface model doesn't fit SwiftUI/Compose declarative UI.",
        ],
      },
      {
        t: "p",
        text: "The honest caveat: MVP is *conceptually fine* and you'll meet it in codebases from 2014–2017. But 'would you *choose* it for new code?' — no. Every MVP pain (rotation, ceremony, boilerplate, state replay) maps to a MVVM feature that eliminates it, and MVP as a stepping stone to MVVM just doubles the work. The senior signal is being able to enumerate *pain → MVVM fix* rather than just saying 'MVVM is newer'.",
      },
      {
        t: "note",
        text: "Answer decisively (MVVM) but justify with the pain→fix mapping: attach/detach→observation, retain hacks→retained ViewModel, view-interface boilerplate→single UiState, blank-on-reattach→state replay.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does a Presenter leak the Activity, and how do you prevent it?",
    a: [
      {
        t: "p",
        text: "A Presenter leaks the Activity when it holds a reference to the View (which on Android is the Activity/Fragment) and *outlives* it without releasing the reference. If the Activity is destroyed but the Presenter still references it — because you forgot to `detach()`, or the Presenter is retained/static, or an async callback captured the old View — the garbage collector can't reclaim the Activity and its entire view hierarchy. That's the leak.",
      },
      {
        t: "code",
        title: "The leak and the fix",
        code: `class UserPresenter : UserContract.Presenter {
    private var view: UserContract.View? = null
    override fun attach(v: UserContract.View) { view = v }   // holds the Activity

    override fun detach() { view = null }   // THE FIX: release on destroy

    override fun onLoad() {
        repo.getUser(id) { user ->
            // if the Activity was destroyed and 'view' NOT nulled,
            // this callback touches a dead Activity -> crash or leak
            view?.showUser(user.name)   // '?.' guards, but you must also detach
        }
    }
}
// Activity: override fun onDestroy() { presenter.detach(); super.onDestroy() }`,
      },
      {
        t: "list",
        items: [
          "**Cause 1 — forgotten detach()** — the Presenter keeps the View reference after the Activity is destroyed. Always `detach()` in `onDestroy`/`onStop`.",
          "**Cause 2 — stale async callbacks** — a network callback captured the View; it fires after destruction and touches a dead view. Guard with `view?.` *and* cancel work on detach.",
          "**Cause 3 — retained Presenter holding a live View** — if you retain the Presenter across rotation (to survive config change) but don't swap the View reference on re-attach, the old destroyed Activity is pinned.",
        ],
      },
      {
        t: "p",
        text: "The deeper point: this whole class of bug exists *because* the Presenter holds a View reference. The ViewModel eliminates it by design — it holds *no* View reference (the View observes the ViewModel), so there's nothing to leak and no attach/detach to forget. The MVP leak is the concrete cost of the Presenter→View arrow.",
      },
      {
        t: "note",
        text: "The MVP leak = Presenter holds the Activity + outlives it. Fix: detach() + cancel work. But the real lesson is that the ViewModel's no-View-reference design makes this bug *structurally impossible*.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why did MVVM ultimately replace MVP? Map each MVP pain to its MVVM fix.",
    a: [
      {
        t: "p",
        text: "MVVM replaced MVP because it eliminated every one of MVP's structural pain points — all of which radiate from a single root cause: the Presenter holds a reference to the View and pushes to it imperatively. MVVM's inversion (the View observes state the ViewModel exposes, no View reference) dissolves the whole class of problems.",
      },
      {
        t: "table",
        headers: ["MVP pain", "Root cause", "MVVM fix"],
        rows: [
          ["Presenter dies on rotation / retain hacks", "you own the Presenter's lifecycle", "Jetpack ViewModel survives config changes natively"],
          ["attach/detach ceremony + null-view dance", "Presenter holds a View reference", "no View reference — the View observes state"],
          ["Leaks the Activity if detach forgotten", "Presenter → View reference outlives Activity", "no View reference to leak"],
          ["Re-attached View is blank until replay", "imperative push, no current value", "StateFlow replays current state to new observers"],
          ["View interface + impl per screen (boilerplate)", "imperative view-method contract", "one immutable UiState the View renders"],
          ["Doesn't fit declarative/KMP UI", "imperative view.showX() model", "observable state maps to Compose/SwiftUI"],
        ],
      },
      {
        t: "p",
        text: "The single sentence: MVP is 'the middle layer pushes to a View it holds'; MVVM is 'the middle layer exposes state a View observes'. Flipping that arrow removes the lifecycle ceremony, the leak risk, the boilerplate, and the blank-on-reattach problem simultaneously — plus it makes state work in KMP shared code. That's why the industry moved wholesale once Jetpack made it easy.",
      },
      {
        t: "note",
        text: "Every MVP pain traces to one thing — the Presenter holds and pushes to the View. MVVM inverts it to observation, and *all* the pains vanish together. Delivering that unified explanation beats listing fixes.",
      },
    ],
  },
  {
    level: "senior",
    q: "Is MVP dead? Where, if anywhere, would you still use it?",
    a: [
      {
        t: "p",
        text: "MVP isn't 'dead' as a concept — it's conceptually sound and still runs in huge production codebases — but it's effectively *legacy* for new Android code: there's no scenario where you'd choose it over MVVM for a fresh Android project. So the honest answer is 'you'll maintain it, but you won't start with it'.",
      },
      {
        t: "list",
        items: [
          "**You'll meet it in** — codebases started 2014–2017 (banking, e-commerce, enterprise apps), and interviews for teams maintaining them. Knowing MVP is a maintenance skill.",
          "**Conceptually still valid where** — a platform *lacks* an observation toolkit and lifecycle-aware state (MVP needs no special tooling). But modern Android/KMP has all of that, so the advantage is gone.",
          "**Where you would NOT use it** — any new Android app (MVVM wins on every axis), and anything KMP (imperative view-interfaces don't fit shared code / declarative UI).",
        ],
      },
      {
        t: "p",
        text: "The nuance worth adding: migrating MVP → MVVM is mechanical (each `view.showX(args)` call becomes a field on `UiState`; the Presenter's methods become ViewModel functions; the contract dies; interaction tests convert to state assertions, usually getting simpler). So even in a legacy MVP codebase, the path forward is well-understood — you don't rewrite, you migrate screen by screen. Recognizing MVP as 'maintain and migrate, don't start' is the mature position.",
      },
      {
        t: "note",
        text: "'MVP is legacy, not dead' — you'll maintain and migrate it (migration is mechanical: view.showX → UiState field), but never choose it for new Android/KMP work.",
      },
    ],
  },
  {
    level: "senior",
    q: "How would you inject Presenters with Dagger/Hilt?",
    a: [
      {
        t: "p",
        text: "Since a Presenter is a plain class you construct, you inject its dependencies with `@Inject constructor` and let Dagger/Hilt build it — then the Activity/Fragment gets the Presenter injected as a field (because the framework instantiates Activities, so you can't constructor-inject them). The Presenter's *dependencies* are constructor-injected; the Presenter *itself* is field-injected into the View.",
      },
      {
        t: "code",
        title: "Injecting a Presenter with Hilt",
        code: `// Presenter deps via constructor injection
class UserPresenter @Inject constructor(
    private val repo: UserRepository,
) : UserContract.Presenter { /* ... */ }

// Bind the interface to the impl
@Module @InstallIn(ActivityComponent::class)
abstract class PresenterModule {
    @Binds abstract fun bindUserPresenter(impl: UserPresenter): UserContract.Presenter
}

// Field-inject the Presenter into the (framework-created) Activity
@AndroidEntryPoint
class UserActivity : AppCompatActivity(), UserContract.View {
    @Inject lateinit var presenter: UserContract.Presenter
    override fun onCreate(s: Bundle?) {
        super.onCreate(s)
        presenter.attach(this)   // still must manage attach/detach yourself
    }
}`,
      },
      {
        t: "p",
        text: "The catch DI *doesn't* solve: the Presenter's *lifecycle*. Even with Hilt injecting it, you still manage attach/detach and (harder) surviving configuration changes — Hilt scopes the Presenter to the Activity component, so it's recreated on rotation by default, losing state. To retain it you'd scope it more carefully or use `ActivityRetainedComponent`, which is fiddly. This is another place where the ViewModel wins: `@HiltViewModel` gives you injection *and* automatic config-change survival *and* no attach/detach — all the things you're hand-managing in injected MVP.",
      },
      {
        t: "note",
        text: "Deps → constructor-inject; Presenter → field-inject into the Activity. But DI doesn't fix MVP's lifecycle — you still manage attach/detach and retention, which @HiltViewModel handles for free.",
      },
    ],
  },
  {
    level: "senior",
    q: "You inherit an MVP codebase full of God Presenters. How do you improve it?",
    a: [
      {
        t: "p",
        text: "A God Presenter is the same failure as a God Activity relocated one layer over: without a disciplined data/domain layer, the Presenter absorbs networking, caching, business rules, and mapping. So the fix is the same shape — give logic below the Presenter a home, and thin the Presenter to orchestration — whether or not you also migrate to MVVM.",
      },
      {
        t: "list",
        items: [
          "**Push logic down first** — extract networking/DB into repositories and business rules into use cases. This is mechanical, low-risk, and immediately shrinks Presenters (often by half). The Presenter should mostly wire events to use cases and format results.",
          "**Extract mapping and formatting** — into dedicated mapper classes with their own tests, out of the Presenter.",
          "**Split by responsibility** — if a Presenter handles several independent widgets, consider splitting it; a screen-level Presenter can coordinate smaller ones.",
          "**Add characterization tests before big changes** — Presenters *are* testable (mock the View), so pin current behavior with interaction tests, then refactor safely.",
          "**Then decide: migrate to MVVM or not** — if the team is investing long-term, migrate screen by screen (view.showX → UiState field, Presenter → ViewModel); the interaction tests convert to state tests. If not, at least the extraction above makes the MVP maintainable.",
        ],
      },
      {
        t: "p",
        text: "The guardrail I'd apply in review: if a Presenter imports a data-source library (Retrofit/Room types) or exceeds a few hundred lines, the layering has broken down below it — the same rule as for a bloated ViewModel. God Presenters aren't an MVP problem specifically; they're a 'no data/domain layer' problem that any pattern suffers without discipline.",
      },
      {
        t: "note",
        text: "God Presenter = God Activity moved one layer over. Fix it the same way: extract repositories/use cases so logic has a home, thin the Presenter to orchestration — then optionally migrate to MVVM screen by screen.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between Passive View and Supervising Controller in one practical example?",
    a: [
      {
        t: "p",
        text: "Both are MVP flavors; the difference is how much the View is allowed to do. In **Passive View**, the Presenter drives *every* pixel — even simple data binding goes through a `view.showX()` call. In **Supervising Controller**, the View handles *simple, declarative* binding itself (like data binding a name field directly), and the Presenter only steps in for *complex* logic.",
      },
      {
        t: "code",
        title: "Same feature, two flavors",
        code: `// PASSIVE VIEW: Presenter formats and pushes everything
// Presenter:  view.showUserName(if (u.premium) "⭐ " + u.name else u.name)
// View:       fun showUserName(s: String) { nameText.text = s }

// SUPERVISING CONTROLLER: View binds the simple field itself...
// View (XML data binding): android:text="@{user.name}"
// ...and the Presenter only handles the complex 'premium badge' logic:
// Presenter:  view.setPremiumBadgeVisible(u.premium)`,
      },
      {
        t: "list",
        items: [
          "**Passive View** — maximum testability (all display decisions are in the testable Presenter), maximum boilerplate (a view method for everything).",
          "**Supervising Controller** — less boilerplate (simple binding is declarative), but the simple-binding decisions escape testability, and logic can creep into the View.",
        ],
      },
      {
        t: "p",
        text: "The reason this matters historically: Supervising Controller with data binding is *already halfway to MVVM* — 'the View declaratively binds to data' is the MVVM idea. So the industry path Passive View → Supervising Controller → MVVM is one smooth slide, each step replacing imperative `view.showX()` calls with more declarative binding, until MVVM makes *all* of it observation.",
      },
      {
        t: "note",
        text: "Passive View (Presenter drives everything, testable, verbose) vs Supervising Controller (View binds simple fields, less verbose, some logic leaks) — and note Supervising Controller is a step toward MVVM.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why does every async callback in a Presenter need a `view?.` null check?",
    a: [
      {
        t: "p",
        text: "Because the View reference can be *null* when an async result arrives. The Presenter holds the View only between `attach()` and `detach()`. If the Activity is destroyed (rotation, back press) while a network call is in flight, `detach()` sets the reference to null — but the callback still fires later, and touching a null (or dead) View would crash. The `view?.` safe call makes the update a no-op when detached.",
      },
      {
        t: "code",
        title: "The null-view dance",
        code: `override fun onLoad() {
    view?.showLoading()
    repo.getUser(id) { user ->
        // by now the user may have rotated -> detach() nulled 'view'
        view?.showUser(user.name)   // '?.' = do nothing if detached
    }
}`,
      },
      {
        t: "p",
        text: "The subtle bug this *creates*: if the View was detached, the update is silently *dropped*. So if you rotate during a load, the data never shows on the new screen unless the Presenter re-requests or caches — the re-attached View is blank. This 'dropped update on re-attach' is one of MVP's real pain points, and it's why production MVP needed retained Presenters that replay state on re-attach (Mosby's ViewState). MVVM's StateFlow fixes it for free: a new observer immediately gets the current state.",
      },
      {
        t: "note",
        text: "`view?.` guards against updating a detached View — but the update is *dropped*, so a re-attached View is blank. That dropped-update problem is exactly what StateFlow's state-replay solves in MVVM.",
      },
    ],
  },
  {
    level: "senior",
    q: "In MVP, how do you handle a result that arrives while the View is detached (e.g. rotation during a load)?",
    a: [
      {
        t: "p",
        text: "This is MVP's genuinely hard problem. When a result arrives while the View is detached, a naive `view?.showX()` simply drops it, so the re-attached View shows nothing. To handle it correctly, the Presenter must *survive* the rotation and *remember the last state* so it can replay it onto the new View when it re-attaches.",
      },
      {
        t: "list",
        items: [
          "**Retain the Presenter across rotation** — via a retained fragment, a Loader, a static cache, or a library (Mosby, Nucleus). Without this, a new Presenter is created and the in-flight work + result are lost entirely.",
          "**Cache the last state in the Presenter** — the Presenter stores the latest result/loading/error (a 'ViewState'). When a result arrives while detached, it updates this cached state instead of (or in addition to) calling the View.",
          "**Replay on re-attach** — in `attach()`, the Presenter pushes its cached state onto the fresh View, so the new screen shows the loaded data immediately. Mosby's `MvpViewStatePresenter` formalizes exactly this.",
          "**Or buffer pending view commands** — queue the `showX()` calls that arrived while detached and flush them on re-attach (Nucleus's approach).",
        ],
      },
      {
        t: "code",
        title: "Cache-and-replay pattern",
        code: `class UserPresenter {
    private var view: View? = null
    private var lastState: UiState = UiState.Idle   // remembered across detach

    override fun attach(v: View) { view = v; render(lastState) }  // replay!
    override fun detach() { view = null }

    override fun onLoad() {
        lastState = UiState.Loading; render(lastState)
        repo.getUser(id) { user ->
            lastState = UiState.Content(user)   // update state even if detached
            render(lastState)                   // no-op if view == null, but state is kept
        }
    }
    private fun render(s: UiState) { view?.let { /* apply s to it */ } }
}`,
      },
      {
        t: "p",
        text: "The tell here is recognizing that this machinery — retain the Presenter, cache the state, replay on re-attach — is *exactly* what the Jetpack ViewModel + StateFlow give you automatically. The ViewModel survives rotation (no retain hack), holds the current state (no manual cache), and a re-collecting View instantly receives it (no manual replay). So MVP's hardest problem is MVVM's free lunch — which is the point to make.",
      },
      {
        t: "note",
        text: "MVP's answer to detached-result: retain the Presenter + cache state + replay on re-attach (Mosby's ViewState). That whole dance is what ViewModel+StateFlow does for free — the clearest illustration of why MVVM won.",
      },
    ],
  },
];

export default qa;
