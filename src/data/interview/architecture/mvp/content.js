// MVP — Content tab.

const content = [
  {
    heading: "What is MVP",
    blocks: [
      {
        t: "p",
        text: "**MVP (Model–View–Presenter)** evolved from MVC (Taligent, 1990s; popularized on Android ~2014–2016) to fix MVC's two coupling problems: the View talking to the Model, and logic having no testable home. In MVP, **all** communication between View and Model flows through the **Presenter**.",
      },
      {
        t: "list",
        items: [
          "**Model** — data layer: repositories, data sources, business logic. Same as in MVVM.",
          "**View** — Activity/Fragment implementing a **View interface**. Completely passive: forwards user input to the Presenter, exposes methods like `showLoading()`, `showUser(user)`, `showError(msg)` that just mutate widgets.",
          "**Presenter** — plain Kotlin/Java class holding a reference to the View *interface*. Receives events (`onRefreshClicked()`), talks to the Model, and drives the View by calling its methods. Contains all presentation logic; zero Android imports.",
        ],
      },
      {
        t: "note",
        text: "The defining wiring: **the Presenter holds a View reference and pushes to it imperatively**. Compare MVVM, where the ViewModel holds no View reference and the View pulls/observes. Every MVP strength and weakness follows from that one arrow.",
      },
    ],
  },
  {
    heading: "The contract — canonical MVP code",
    blocks: [
      {
        t: "code",
        title: "Contract interface (the signature MVP artifact)",
        code: `interface UserContract {
    interface View {
        fun showLoading()
        fun hideLoading()
        fun showUser(name: String, isPremium: Boolean)
        fun showError(message: String)
    }
    interface Presenter {
        fun attach(view: View)
        fun detach()
        fun onLoadUser(id: String)
    }
}`,
      },
      {
        t: "code",
        title: "Presenter — pure JVM, fully unit-testable",
        code: `class UserPresenter(
    private val repository: UserRepository,
    private val mainScheduler: Scheduler, // era-typical: RxJava
) : UserContract.Presenter {

    private var view: UserContract.View? = null
    private val disposables = CompositeDisposable()

    override fun attach(view: UserContract.View) { this.view = view }

    override fun onLoadUser(id: String) {
        view?.showLoading()
        disposables += repository.getUser(id)
            .observeOn(mainScheduler)
            .subscribe(
                { user ->
                    view?.hideLoading()
                    view?.showUser(user.name, user.isPremium)
                },
                { error ->
                    view?.hideLoading()
                    view?.showError(error.message ?: "Unknown error")
                }
            )
    }

    override fun detach() {
        disposables.clear()
        view = null // critical — otherwise the destroyed Activity leaks
    }
}`,
      },
      {
        t: "code",
        title: "View — passive Activity",
        code: `class UserActivity : AppCompatActivity(), UserContract.View {

    private lateinit var presenter: UserContract.Presenter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_user)
        presenter = UserPresenter(repository, AndroidSchedulers.mainThread())
        presenter.attach(this)
        refreshButton.setOnClickListener {
            presenter.onLoadUser(intent.getStringExtra("id")!!)
        }
    }

    override fun onDestroy() {
        presenter.detach()
        super.onDestroy()
    }

    override fun showLoading() { progress.isVisible = true }
    override fun hideLoading() { progress.isVisible = false }
    override fun showUser(name: String, isPremium: Boolean) {
        nameText.text = if (isPremium) "⭐ " + name else name
    }
    override fun showError(message: String) {
        Snackbar.make(root, message, Snackbar.LENGTH_SHORT).show()
    }
}`,
      },
    ],
  },
  {
    heading: "Passive View vs Supervising Controller",
    blocks: [
      {
        t: "p",
        text: "Martin Fowler split MVP into two flavors — a favorite senior distinction:",
      },
      {
        t: "list",
        items: [
          "**Passive View** — the View is *completely* dumb: every label, every visibility flag is set through an explicit Presenter call. Maximum testability (the whole UI decision surface is presenter logic), maximum boilerplate. The Android-common flavor.",
          "**Supervising Controller** — the View handles simple declarative binding from the Model itself (e.g. data binding for trivial fields), and the Presenter only handles complex logic and input. Less boilerplate, but logic starts seeping back into the View.",
        ],
      },
      {
        t: "p",
        text: "Worth saying in interviews: Supervising Controller with data binding is already halfway to MVVM — the history is a smooth slide, not a jump.",
      },
    ],
  },
  {
    heading: "Lifecycle & configuration changes — MVP's hardest problem",
    blocks: [
      {
        t: "p",
        text: "The Presenter holds a View reference, and Android destroys Views on rotation. Everything painful about MVP on Android radiates from this:",
      },
      {
        t: "list",
        items: [
          "**attach/detach ceremony**: the View must attach in `onCreate`/`onStart` and detach in `onDestroy`/`onStop`; forgetting `detach()` (or nulling the reference) leaks the destroyed Activity through the Presenter.",
          "**The null-view dance**: every async callback must guard `view?.` because the result may arrive while detached — and then the update is silently *dropped*: rotate during load and the data never shows unless you re-request or cache.",
          "**Presenter survival options** (none great): recreate it every time and re-fetch (wasteful, flicker); retain it via a retained Fragment / static cache / Loader (pre-Jetpack hacks with their own leaks); libraries like Mosby and Nucleus existed specifically to manage keep-alive + view re-attachment + delivering pending results.",
          "**State restoration**: a re-attached View is blank; the Presenter needs a 'replay current state onto the new view' step — which MVP has no standard mechanism for. (MVVM gets this for free: the new collector immediately receives the current `StateFlow` value.)",
        ],
      },
      {
        t: "note",
        text: "This section is *the* answer to \"why did MVVM win?\": Jetpack ViewModel + observable state solves attach/detach, the null-view dance, presenter survival AND state replay in one stroke. Being able to enumerate the four MVP pains and map each to its MVVM fix is a strong senior answer.",
      },
    ],
  },
  {
    heading: "Testing Presenters",
    blocks: [
      {
        t: "p",
        text: "MVP's headline feature in its era: the Presenter is a plain class, and the View is an interface you mock — so tests read as \"event in → view calls out\":",
      },
      {
        t: "code",
        title: "Classic presenter test (JUnit + Mockito)",
        code: `@Test
fun loadUser_success_showsUser() {
    val view: UserContract.View = mock()
    val repository: UserRepository = mock()
    whenever(repository.getUser("42"))
        .thenReturn(Single.just(User(name = "Revanth", isPremium = true)))

    val presenter = UserPresenter(repository, Schedulers.trampoline())
    presenter.attach(view)

    presenter.onLoadUser("42")

    inOrder(view) {
        verify(view).showLoading()
        verify(view).hideLoading()
        verify(view).showUser("Revanth", true)
    }
    verify(view, never()).showError(any())
}`,
      },
      {
        t: "list",
        items: [
          "Style difference from MVVM testing: MVP tests **verify interactions** (mock method calls, ordering); MVVM tests **assert emitted state values**. State assertion is generally more robust — interaction tests break when you rename or reorder view calls even if behavior is identical.",
          "Threading in tests: replace `AndroidSchedulers.mainThread()` with `Schedulers.trampoline()` (Rx) — the era's equivalent of today's `Dispatchers.setMain(TestDispatcher)`.",
          "Edge cases worth testing then and now: events arriving while detached, double-clicks (re-entrancy), error-then-retry sequences.",
        ],
      },
    ],
  },
  {
    heading: "Why MVVM replaced MVP — and where you'll still meet MVP",
    blocks: [
      {
        t: "table",
        headers: ["Pain in MVP", "MVVM's answer"],
        rows: [
          ["Presenter → View interface + attach/detach ceremony", "No view reference at all — observation"],
          ["Presenter dies on rotation / retain hacks", "Jetpack ViewModel survives config changes natively"],
          ["Dropped updates while detached; manual state replay", "StateFlow/LiveData replays current state to every new observer"],
          ["One View interface + implementation per screen (boilerplate)", "One state class; the View renders it"],
          ["Lifecycle-safety hand-rolled", "repeatOnLifecycle / collectAsStateWithLifecycle"],
        ],
      },
      {
        t: "list",
        items: [
          "You will still meet MVP in: long-lived codebases started 2014–2017 (banking, e-commerce), interviews for teams maintaining them, and some TV/embedded projects.",
          "MVP remains *conceptually* fine where the platform lacks lifecycle churn or an observation toolkit — but on Android/KMP today there is no reason to start a new MVP screen.",
          "Migration MVP→MVVM is mechanical: each `view.showX(args)` call becomes a field on `UiState`; the Presenter's methods become ViewModel functions; the contract dies; tests convert from interaction-verification to state-assertion (and usually get simpler).",
        ],
      },
    ],
  },
];

export default content;
