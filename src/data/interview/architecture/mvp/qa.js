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
];

export default qa;
