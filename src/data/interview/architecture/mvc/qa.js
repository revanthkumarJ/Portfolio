// MVC — Interview Prep tab.

const qa = [
  {
    level: "junior",
    q: "What is MVC? Explain the three components.",
    a: [
      {
        t: "p",
        text: "MVC splits an app into **Model** (data + business logic, notifies observers on change), **View** (renders the model), and **Controller** (interprets user input and updates the model). It's the oldest UI pattern — Smalltalk, 1979. The defining wiring of classic MVC: the **View reads/observes the Model directly**, and the Controller handles input — it doesn't paint the screen.",
      },
    ],
  },
  {
    level: "junior",
    q: "In Android MVC, which component is the Activity?",
    a: [
      {
        t: "p",
        text: "Both View **and** Controller — and that's precisely the problem. Android gives you one class that owns the view hierarchy, receives input, and holds the lifecycle, so the roles merge into a \"God Activity\". The XML layout is only the static skeleton of the View, not the View role itself (it has no behavior). Because V and C are one object, you can't test controller logic without an emulator, and there's no seam to keep business rules out of UI code.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the main problems with MVC on Android?",
    a: [
      {
        t: "list",
        items: [
          "**God Activity** — UI mutation, input handling, networking and business rules in one class violating single-responsibility.",
          "**Untestable** — logic welded to framework classes needs instrumented tests; no JVM unit tests.",
          "**Lifecycle pain** — rotation destroys the Activity mid-operation: leaked callbacks, lost state, crashes touching dead views.",
          "**View–Model coupling** — the View reading the Model directly means model refactors ripple into UI code.",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a Controller and a Presenter?",
    a: [
      {
        t: "p",
        text: "A **Controller** handles *input*: it translates user gestures into Model operations, and in classic MVC the View then updates itself by observing the Model — the Controller may never touch the View. A **Presenter** additionally owns *output*: all Model data reaches the View through it, and it actively drives the View via an interface (`view.showUser(...)`). So MVP fully insulates View from Model, while MVC does not. Mnemonic: Controller = input router; Presenter = input **and** presentation logic.",
      },
    ],
  },
  {
    level: "junior",
    q: "Is MVC ever an acceptable choice for an Android app?",
    a: [
      {
        t: "p",
        text: "For a genuinely trivial app — a one-screen utility, a prototype, a hackathon demo — putting logic straight into the Activity is honest pragmatism, and adding layers would be ceremony. The moment the app has real state, async work, or a second developer, the costs (untestability, lifecycle bugs, unbounded class growth) outweigh the simplicity. A good answer also notes that with modern tools the \"simple\" baseline has shifted: a minimal `ViewModel` + `StateFlow` costs almost nothing, so there's rarely a reason to start with God-Activity MVC even for small apps.",
      },
    ],
  },
  {
    level: "junior",
    q: "In classic MVC, how does the View update when data changes?",
    a: [
      {
        t: "p",
        text: "Through the **observer pattern**: the View registers as an observer of the Model; when the Controller mutates the Model, the Model fires change notifications and the View re-reads the data it renders. This is worth knowing because it shows MVC already contained the seed of reactive UI — MVVM's `StateFlow` observation is the same idea with the crucial twist that the View observes *prepared UI state* rather than the raw domain model.",
      },
    ],
  },
  {
    level: "senior",
    q: "Compare classic MVC, Web MVC, and Apple's MVC. Why does 'MVC' mean such different things?",
    a: [
      {
        t: "list",
        items: [
          "**Classic (Smalltalk)**: live objects; View observes Model directly; Controller strictly handles input devices. Designed for always-alive desktop GUIs.",
          "**Web MVC (Model 2 — Rails/Spring/Django)**: request/response, not observation. The Controller receives an HTTP request, calls the Model, then *selects and fills a View template* and returns it. Nothing is long-lived; 'observing' is impossible across HTTP, so the Controller took over view population.",
          "**Apple MVC**: the ViewController deliberately mediates both directions between Model and View — closer to MVP structurally, but because it also owns the view lifecycle it absorbs everything → 'Massive View Controller'.",
        ],
      },
      {
        t: "p",
        text: "The name survived while the wiring changed because each platform kept the *role names* and adapted the *communication paths* to its runtime model (live objects vs stateless requests vs framework-owned view controllers). That's the real lesson: patterns are shaped by platform constraints — the same reason Android 'MVC' degraded into the God Activity and the community eventually needed the Jetpack ViewModel to get a slot the framework didn't provide.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why did MVC's failure on Android lead to MVP first rather than straight to MVVM?",
    a: [
      {
        t: "p",
        text: "Chronology and tooling. When teams hit the God-Activity wall (~2013–2015), Android had **no observability primitives** in the toolkit — no LiveData, no lifecycle-aware anything; RxJava existed but was a heavy adoption bet. MVP required nothing new: plain interfaces and classes, instantly unit-testable with JUnit + Mockito, which matched the era's testing push. MVVM only became the obvious default when Google shipped **Architecture Components (2017)** — a `ViewModel` that survives rotation plus `LiveData` for safe observation solved exactly the two things MVP handled awkwardly (config changes and lifecycle-safe view updates). So the sequence was driven by infrastructure availability, not pattern merit alone.",
      },
    ],
  },
  {
    level: "senior",
    q: "You inherit a 3000-line God Activity. Walk me through your migration plan and its risks.",
    a: [
      {
        t: "list",
        items: [
          "**Stabilize first**: add characterization tests (Espresso) for the critical flows — God Activities are full of implicit behavior (ordering assumptions, double-tap guards) that naive extraction breaks.",
          "**Extract the data layer**: all network/DB/prefs access behind repository classes. Mechanical, low-risk, immediately shrinks the Activity and creates the seam every later step needs.",
          "**Extract state and presentation logic** into a ViewModel exposing a `UiState` — go directly to MVVM; MVP as a stepping stone doubles the work. Replace each 'mutate widget here' site with a state field + one render function.",
          "**Untangle hidden channels**: statics, singletons-as-buses, `onActivityResult` chains, sticky intents — replace with repository state or explicit results; this is where the surprises live.",
          "**Slice by responsibility, not by line count**: pull one feature (e.g. search) end-to-end at a time; ship after each slice.",
        ],
      },
      {
        t: "p",
        text: "Biggest risks: behavioral regressions from implicit ordering, team velocity stalling on a long-lived refactor branch (avoid — keep slices mergeable), and the half-migrated state becoming permanent — mitigate with an explicit definition of done per screen and architecture checks in review/CI.",
      },
    ],
  },
  {
    level: "senior",
    q: "Defend MVC: what did it get right that modern architectures still use?",
    a: [
      {
        t: "list",
        items: [
          "**Separation of data from presentation** — the Model as an independent, observable source of truth is the direct ancestor of the repository + reactive stream stack.",
          "**Observer-based UI updates** — 'the view re-renders when the model changes' *is* modern declarative UI; Compose recomposing on state change is classic-MVC observation industrialized.",
          "**Role vocabulary** — Model/View/middle-thing framing is how every successor (MVP, MVVM, MVI) still explains itself; MVC defined the axis they all vary along: *who may talk to whom*.",
          "**Minimal indirection** — for genuinely simple UIs, MVC's directness is a feature; part of why over-layered 'clean' codebases get criticized is that they forgot MVC's economy.",
        ],
      },
      {
        t: "p",
        text: "Sharp closing line: MVC didn't fail conceptually — it failed *operationally* on platforms that merged its roles into one framework class. The fix (MVP, then MVVM) was re-separating roles the platform had fused, not abandoning MVC's ideas.",
      },
    ],
  },
  {
    level: "senior",
    q: "Does Jetpack Compose bring Android back to MVC?",
    a: [
      {
        t: "p",
        text: "Interesting framing question — the honest answer is 'closer to classic MVC's *spirit*, but no'. Compose restores the classic-MVC loop: state changes → observing UI re-renders automatically; the framework View role (composables) is finally dumb and stateless like MVC intended. But two things differ fundamentally: the UI observes **prepared UI state from a ViewModel**, never the domain Model directly (that's the MVVM boundary MVC lacked), and input flows through **explicit event callbacks up to a state holder** (UDF), not a controller mutating shared objects. So the modern stack is best described as MVVM/UDF that *finally implements* MVC's original observe-and-render dream with the coupling problems fixed. Saying that shows you understand patterns as evolving wiring, not brand names.",
      },
    ],
  },
  {
    level: "senior",
    q: "Where does business logic actually live in Android 'MVC', and why is that the core architectural flaw?",
    a: [
      {
        t: "p",
        text: "In practice it lives **everywhere**: validation in click listeners, pricing rules in `onResponse` callbacks, formatting in adapters, caching in statics. Because the Activity is both V and C, there is no *structural* place that business logic belongs, so it accretes wherever the cursor happens to be. That's the core flaw — not that the Activity is 'too big', but that the architecture provides **no enforceable boundary** between decisions (business/presentation logic) and effects (widget mutation). Every successor pattern is essentially an answer to 'where do decisions live and how do we keep effects out of there': Presenter (MVP), ViewModel (MVVM), reducer (MVI). When asked this, land on the principle: an architecture is good exactly to the degree that logic has one obvious, testable home.",
      },
    ],
  },
];

export default qa;
