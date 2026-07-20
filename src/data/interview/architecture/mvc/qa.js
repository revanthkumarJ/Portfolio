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
  {
    level: "junior",
    q: "What does 'separation of concerns' mean, and how does MVC try to achieve it?",
    a: [
      {
        t: "p",
        text: "Separation of concerns is the idea that each part of a program should be responsible for one kind of thing, so you can understand, change, and test each part in isolation. When 'concerns' are mixed — say networking, business rules, and UI all in one class — a change to any one risks breaking the others, and nothing can be tested without dragging in everything else.",
      },
      {
        t: "p",
        text: "MVC's answer is to split responsibilities into three concerns: the **Model** owns data and business rules, the **View** owns rendering, and the **Controller** owns input handling. The intent is that you could swap the View (a different UI) without touching business rules, or test the Model without any UI. That's the *promise* of MVC.",
      },
      {
        t: "list",
        items: [
          "**Model** — 'what the data is and the rules that govern it' (a user, a cart, pricing logic).",
          "**View** — 'how it looks on screen' (widgets, layout).",
          "**Controller** — 'what happens when the user does something' (translate a tap into a model change).",
        ],
      },
      {
        t: "p",
        text: "The common mistake is thinking any code organized into three files 'is MVC'. Separation of concerns is about *dependencies and responsibilities*, not file names — if your Controller contains business rules and directly formats views, you've mixed concerns even with three files. On Android specifically, MVC's separation breaks because the framework fuses View and Controller into the Activity, so the concern-separation the pattern promises isn't actually enforceable.",
      },
      {
        t: "note",
        text: "Frame separation of concerns as 'each part changes for one reason' (Single Responsibility) — it makes the answer land as a principle, not a file-layout convention.",
      },
    ],
  },
  {
    level: "junior",
    q: "What exactly are the Model's responsibilities in MVC?",
    a: [
      {
        t: "p",
        text: "The Model is the part of the app that has nothing to do with the screen. It holds the application's *data* and the *business logic* that operates on that data, and it knows nothing about how it's displayed — no reference to a View, a Controller, or any UI framework class.",
      },
      {
        t: "list",
        items: [
          "**Owns the data** — the domain state (the current user, the shopping cart, the list of messages).",
          "**Owns the business rules** — validation, calculations, invariants ('a cart total can't be negative', 'a premium user gets 20% off').",
          "**Notifies observers of changes** — in classic MVC the Model fires change events so the View can re-read it (the observer pattern).",
          "**Independent of the UI** — no Android imports, so it can be unit-tested on the JVM with no device.",
        ],
      },
      {
        t: "code",
        title: "A framework-free Model",
        code: `// Pure Kotlin — no Android, no View reference
class CartModel {
    private val items = mutableListOf<Item>()
    private val observers = mutableListOf<() -> Unit>()

    fun addObserver(o: () -> Unit) { observers.add(o) }

    fun addItem(item: Item) {
        items.add(item)
        observers.forEach { it() }   // notify: "something changed, re-read me"
    }

    fun total(): Money = items.sumOf { it.price }   // business rule lives here
}`,
      },
      {
        t: "p",
        text: "A frequent confusion is treating the Model as 'just the data classes' (the DTOs). In proper MVC the Model is the *whole* business layer — data *and* the logic. Reducing it to plain data objects and pushing the logic into the Controller/Activity is exactly how the God Activity forms.",
      },
      {
        t: "note",
        text: "Say 'the Model is the part that would be identical if you rewrote the entire UI' — that captures its framework-independence crisply.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the Observer pattern, and why is it central to MVC?",
    a: [
      {
        t: "p",
        text: "The Observer pattern is a way for one object (the subject) to notify other objects (observers) when it changes, without knowing who they are. The subject keeps a list of observers and calls them on every change; observers register and unregister themselves. This decouples 'the thing that changed' from 'the things that react to it'.",
      },
      {
        t: "p",
        text: "It's central to MVC because it's how the View stays in sync with the Model *without the Model knowing the View exists*. The View registers as an observer of the Model; when the Controller mutates the Model, the Model notifies its observers, and the View re-reads and re-renders. This one-way dependency (View knows Model, Model doesn't know View) is what keeps the Model framework-free.",
      },
      {
        t: "code",
        title: "The observer wiring in MVC",
        code: `// View registers on the Model
model.addObserver { render(model) }   // "when you change, I'll re-read you"

// Controller mutates the Model (never touches the View directly)
fun onAddClicked() { model.addItem(item) }
// -> model notifies observers -> View's render() runs automatically`,
      },
      {
        t: "p",
        text: "The reason this matters beyond MVC: modern reactive UI is the *same* idea industrialized. `LiveData`, `StateFlow`, and Compose's recomposition are all 'the UI observes state and re-renders on change' — the observer pattern with better lifecycle handling and observing *prepared UI state* instead of the raw Model. So understanding MVC's observer wiring is understanding the ancestor of everything reactive on Android.",
      },
      {
        t: "note",
        text: "Connect it forward: 'StateFlow + collectAsState is the observer pattern with lifecycle safety' — it shows you see patterns as an evolving lineage.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does data flow through classic MVC, step by step?",
    a: [
      {
        t: "p",
        text: "In classic MVC the flow is a loop: the user acts on the View, the Controller interprets that action and updates the Model, the Model notifies observers, and the View re-reads the Model and re-renders. The key is that the Controller never paints the screen and the Model never knows about the View — the View updates itself by observing.",
      },
      {
        t: "code",
        title: "The classic MVC loop",
        code: `// 1. User taps a button in the View
// 2. Controller handles the input:
fun onAddToCartClicked(item: Item) {
    cartModel.addItem(item)        // Controller -> Model (update)
}
// 3. Model changes and notifies observers:
//    items.add(item); observers.forEach { it() }
// 4. View (an observer) re-reads the Model and re-renders:
//    render(cartModel.items, cartModel.total())`,
      },
      {
        t: "list",
        items: [
          "**View → Controller**: user input (taps, gestures).",
          "**Controller → Model**: translate input into a state change.",
          "**Model → View**: change notification (observer), View re-reads.",
          "The Controller→View arrow does *not* exist in classic MVC — that's the difference from MVP/Apple-MVC.",
        ],
      },
      {
        t: "p",
        text: "On Android this pure loop collapses because the Activity is *both* the View and the Controller — so 'Controller updates Model, View observes' becomes 'Activity mutates data and also directly sets widget text', erasing the separation. That's why 'Android MVC' rarely matches the textbook loop.",
      },
      {
        t: "note",
        text: "Draw the triangle and stress the missing Controller→View arrow in classic MVC — interviewers use that arrow to test whether you actually know the variants apart.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between MVC, MVP, and MVVM at a glance?",
    a: [
      {
        t: "p",
        text: "All three separate UI from logic through a 'middle' component, and they differ mainly in *who talks to whom* — specifically whether the middle layer holds a reference to the View, and whether the View sees the Model directly.",
      },
      {
        t: "table",
        headers: ["", "MVC", "MVP", "MVVM"],
        rows: [
          ["Middle component", "Controller", "Presenter", "ViewModel"],
          ["View ↔ Model", "View observes Model directly", "fully separated (Presenter mediates)", "fully separated (VM exposes state)"],
          ["Middle → View link", "Controller: usually none (View observes)", "Presenter holds a View interface, pushes", "VM holds no View ref; View observes"],
          ["How View updates", "re-reads Model on change", "Presenter calls view.showX()", "View observes VM state"],
          ["Config-change survival", "none", "manual (retain hacks)", "built-in (Jetpack ViewModel)"],
          ["Testability", "poor (framework-welded)", "good (mock the View interface)", "good (assert emitted state)"],
        ],
      },
      {
        t: "p",
        text: "The one-sentence evolution: MVC → MVP moved all View↔Model traffic through a testable Presenter with a View interface; MVP → MVVM replaced the Presenter's imperative `view.showX()` calls with observable *state*, removing the attach/detach ceremony and gaining config-change survival. Each step reduces coupling between the middle layer and the View.",
      },
      {
        t: "note",
        text: "If you can state the single differentiator — 'does the middle layer hold a View reference?' (MVC no/observer, MVP yes/interface, MVVM no/observation) — you've captured the whole comparison.",
      },
    ],
  },
  {
    level: "junior",
    q: "Show a typical Android MVC implementation and point out what's wrong with it.",
    a: [
      {
        t: "p",
        text: "'Android MVC' in practice means the Activity plays View and Controller, an XML layout is the passive View skeleton, and the Model is whatever data/logic the Activity touches. It looks organized but concentrates everything in one class.",
      },
      {
        t: "code",
        title: "The classic God Activity",
        code: `class UserActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_user)

        val id = intent.getStringExtra("id")!!
        progress.isVisible = true
        api.getUser(id).enqueue(object : Callback<UserDto> {   // networking (data)
            override fun onResponse(c: Call<UserDto>, r: Response<UserDto>) {
                progress.isVisible = false
                val user = r.body()!!
                // business rule buried in the "view":
                nameText.text = if (user.isPremium) "⭐ " + user.name else user.name
            }
            override fun onFailure(c: Call<UserDto>, t: Throwable) {
                progress.isVisible = false
                Toast.makeText(this@UserActivity, t.message, Toast.LENGTH_SHORT).show()
            }
        })
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Mixed concerns** — networking, a business rule (premium star), and view mutation are all in one method. Nothing is separable.",
          "**Untestable** — every line needs the Android framework; there's no JVM-unit-testable seam.",
          "**Lifecycle-unsafe** — rotate mid-request and the callback touches a destroyed Activity (crash or leak).",
          "**No home for logic** — the 'premium' rule lives in a UI callback; the next rule will land wherever the cursor is.",
        ],
      },
      {
        t: "p",
        text: "The fix isn't 'make the Activity smaller' — it's to give logic a *structural home*: extract a repository (data), and move presentation logic + state into a ViewModel the UI observes. The Activity becomes a thin renderer.",
      },
      {
        t: "note",
        text: "When shown MVC code, critique the *structure* ('there's no enforceable boundary between data, logic, and UI'), not just the size — that's the senior-level read.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you show a loading spinner in Android MVC, and why is it awkward?",
    a: [
      {
        t: "p",
        text: "In MVC you show a spinner by imperatively toggling the progress view: set it visible before the async call, hide it in the callback. It works, but it's awkward because the *state* ('we are loading') isn't represented anywhere — it's implied by scattered `visibility` mutations, so it's easy to get into inconsistent UI (spinner and error both showing, or spinner stuck on after rotation).",
      },
      {
        t: "code",
        title: "MVC: imperative visibility toggling",
        code: `progress.isVisible = true          // start loading
api.getUser(id).enqueue(object : Callback<UserDto> {
    override fun onResponse(...) {
        progress.isVisible = false     // stop loading
        // ... but did you also clear a previous error? easy to forget
    }
    override fun onFailure(...) {
        progress.isVisible = false     // must remember here TOO
        errorView.isVisible = true
    }
})`,
      },
      {
        t: "p",
        text: "The awkwardness is the general problem with imperative UI: you must remember *every* transition (start → hide previous error → show spinner; success → hide spinner → hide error → show content). Miss one and you get stale UI. And on rotation, the in-flight `progress.isVisible = true` is lost, so the spinner may never come back or never go away.",
      },
      {
        t: "p",
        text: "The modern fix is to model loading as *state*: a `UiState` (Loading / Content / Error) that the ViewModel emits and the UI renders wholesale. Then 'loading' is a single explicit value, transitions are impossible to half-apply, and it survives rotation. This contrast is exactly why MVC gave way to state-based patterns.",
      },
      {
        t: "note",
        text: "Use the spinner example to explain 'forgotten transitions' — it's the concrete bug that motivates modeling UI as immutable state instead of imperative toggles.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does MVC handle configuration changes like rotation, and what breaks?",
    a: [
      {
        t: "p",
        text: "MVC has *no* built-in answer to configuration changes. On rotation Android destroys and recreates the Activity — and since in Android MVC the Activity *is* the View and Controller (and often holds the Model references and in-flight work), everything is lost or corrupted unless you manually preserve it.",
      },
      {
        t: "list",
        items: [
          "**In-flight async work** — a network call started in `onCreate` either leaks (its callback holds the destroyed Activity) or its result touches a dead view and crashes (`IllegalStateException`, or a NPE on a recreated view).",
          "**UI/loading state** — imperatively-set visibility (`progress.isVisible = true`) is gone; the spinner may vanish or stick.",
          "**Model references** — if the Activity created the Model, a new Model is built on recreation, discarding the loaded data → the screen re-fetches or blanks.",
          "**Manual workarounds** — retained fragments, `onSaveInstanceState`, or `android:configChanges` to suppress recreation — all hacks with their own bugs.",
        ],
      },
      {
        t: "code",
        title: "The rotation bug in MVC",
        code: `// onCreate: request started, holding 'this' (the Activity)
api.getUser(id).enqueue(callback)  // callback captures this@UserActivity
// user rotates -> Activity destroyed, new one created
// old request completes -> callback.onResponse runs on the DEAD Activity:
nameText.text = user.name          // NPE / IllegalStateException / leak`,
      },
      {
        t: "p",
        text: "This is precisely the gap Jetpack ViewModel filled: a ViewModel *survives* configuration changes, so the in-flight work (in `viewModelScope`) and the state live across rotation, and the recreated Activity just re-observes. MVC predates that slot, so it fights the lifecycle by hand.",
      },
      {
        t: "note",
        text: "The clean framing: 'MVC has no config-change story because the Activity is stateful and disposable — the ViewModel exists precisely to be the retained, framework-free home MVC lacked.'",
      },
    ],
  },
  {
    level: "senior",
    q: "Which SOLID principles does the God-Activity form of MVC violate?",
    a: [
      {
        t: "p",
        text: "The God Activity violates most of SOLID, but the headline offenders are Single Responsibility and Dependency Inversion — and understanding *which* principle each successor pattern restores is a strong way to explain architecture evolution.",
      },
      {
        t: "list",
        items: [
          "**Single Responsibility (S)** — the most flagrant: the Activity handles input, networking, business rules, formatting, and view mutation. It changes for many unrelated reasons, so a networking change can break click handling.",
          "**Dependency Inversion (D)** — high-level policy (business rules) is welded to low-level detail (Retrofit callbacks, Android views). There are no abstractions to depend on, so nothing is substitutable or testable.",
          "**Open/Closed (O)** — adding a feature means editing the one giant class rather than extending; every change risks the whole file.",
          "**Interface Segregation (I)** — less directly, but the Activity depends on a huge surface (the whole Android framework) rather than narrow abstractions.",
        ],
      },
      {
        t: "p",
        text: "The insight: each successor pattern is essentially a targeted SOLID fix. MVP restores testability by inverting the View dependency (depend on a View *interface*). MVVM restores SRP and DIP by giving presentation logic a dedicated, framework-free home (the ViewModel) that depends on abstractions (repositories). Clean Architecture generalizes DIP across the whole app.",
      },
      {
        t: "note",
        text: "Answer with 'S and D are the core violations; every successor pattern is a SOLID fix' — mapping patterns to principles signals you understand *why* they exist, not just their shapes.",
      },
    ],
  },
  {
    level: "senior",
    q: "Can MVC coexist with Clean Architecture, or are they mutually exclusive?",
    a: [
      {
        t: "p",
        text: "They operate at different levels, so in principle they aren't mutually exclusive — MVC is a *presentation* pattern (how UI, input, and the presentation-facing model relate), while Clean Architecture is about *layering the whole app* (domain, data, presentation with dependencies pointing inward). You could have a Clean data/domain layer with an MVC presentation layer on top.",
      },
      {
        t: "p",
        text: "In practice, though, they fit poorly on Android. Clean Architecture's whole point is testable, framework-independent business logic — but Android MVC's Controller *is* the Activity, which is framework-welded and untestable. So while the *data* and *domain* layers could be clean, the *presentation* would still concentrate logic in the Activity, undermining the benefits. That mismatch is why Clean Architecture on Android is paired with MVVM/MVI (which give the presentation layer a framework-free home), not MVC.",
      },
      {
        t: "list",
        items: [
          "**Compatible in theory** — Clean = layering; MVC = presentation wiring; different axes.",
          "**Poor fit in practice** — MVC's Controller (Activity) can't be the clean, testable presentation layer Clean Architecture wants.",
          "**The real pairing** — Clean Architecture + MVVM/MVI, where the ViewModel is the framework-free presentation layer that observes the domain.",
        ],
      },
      {
        t: "note",
        text: "Distinguish the axes explicitly: 'MVC is presentation wiring, Clean is app layering' — then note they *technically* compose but Android MVC's untestable Controller defeats the purpose.",
      },
    ],
  },
  {
    level: "senior",
    q: "If you were forced to use MVC on Android, how would you make it less terrible?",
    a: [
      {
        t: "p",
        text: "The core problem is that the Activity has no seam to keep logic out of it. So even within 'MVC', I'd introduce discipline that pulls concerns out of the Activity, effectively nudging toward MVP without a full rewrite. The goal is to make the Activity thin and give logic a testable home.",
      },
      {
        t: "list",
        items: [
          "**Extract a real Model layer** — all networking/DB/prefs behind repositories, and business rules in framework-free classes. This alone removes the biggest untestable chunk from the Activity and can be done incrementally.",
          "**Keep the Activity as a dumb 'render + forward' shell** — it should only read model state to update widgets and forward input; no business rules, no direct networking.",
          "**Use observer-based updates** — have the Activity observe the Model (via a listener or a small state holder) rather than imperatively mutating widgets from scattered callbacks, so UI updates flow from one place.",
          "**Handle lifecycle deliberately** — cancel in-flight work when the Activity is destroyed; don't let callbacks touch dead views.",
          "**Add characterization tests** — since you can't easily unit test, add Espresso tests around critical flows so you can refactor safely later.",
        ],
      },
      {
        t: "p",
        text: "Honestly, this migration path *is* the path to MVP/MVVM — extracting the Model and thinning the Activity is exactly step one of a proper migration. So 'make MVC less terrible' converges on 'start moving off MVC', which is the point to make: the disciplines that fix MVC are the disciplines of the patterns that replaced it.",
      },
      {
        t: "note",
        text: "Turn the constraint into a migration: 'the way to survive MVC is to do the first steps of leaving it — extract the data layer and thin the Activity.' That reframes a bad-pattern question as an architectural-judgment answer.",
      },
    ],
  },
  {
    level: "senior",
    q: "A junior on your team puts all logic in the Activity. How do you review and guide them?",
    a: [
      {
        t: "p",
        text: "The goal of the review isn't just 'move this code' — it's to transfer the *principle* so they internalize why, and to do it without discouraging them. I'd anchor on a concrete, felt pain (testing) rather than abstract purity, because that's what makes the lesson stick.",
      },
      {
        t: "list",
        items: [
          "**Lead with a question, not a verdict** — 'How would you write a unit test for this pricing rule?' They'll discover it's impossible because it's tangled with the Activity — the lesson teaches itself.",
          "**Name the principle simply** — 'Let's give this logic a home where it's not tied to the screen. The Activity should mostly show state and forward taps.'",
          "**Show the target shape concretely** — pair on extracting one piece: the business rule into a testable class or the network call into a repository, then write the test that's now possible. One worked example beats a lecture.",
          "**Explain the payoff in their terms** — 'When this crashes on rotation, this structure is why; moving state to a ViewModel fixes a whole class of bugs.' Tie it to bugs they'll actually hit.",
          "**Keep it incremental and kind** — praise what's right, refactor one concern at a time, and point to the codebase's existing patterns so they have a template.",
        ],
      },
      {
        t: "p",
        text: "The meta-point: good architecture reviews teach *heuristics* ('can I test this in isolation?', 'does logic have one home?') rather than enforcing a specific pattern by fiat. A junior who leaves the review able to *ask themselves the right question* is a better outcome than one who just copied your diff.",
      },
      {
        t: "note",
        text: "The reviewer move that lands: ask 'how would you test this?' — untestability reveals the design problem better than any style argument, and it teaches a durable heuristic.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why can't you unit-test a God Activity?",
    a: [
      {
        t: "p",
        text: "A unit test runs on the JVM (your machine, no device) and tests one piece of logic in isolation with fake dependencies. A God Activity can't be unit-tested because its logic is welded to Android framework classes — `Context`, `View`, `Activity` lifecycle, static Android calls — none of which exist on the plain JVM, and none of which can be substituted with fakes because the logic never depended on abstractions.",
      },
      {
        t: "list",
        items: [
          "**No JVM without Android** — instantiating or running Activity code needs the Android framework (or Robolectric to simulate it), so tests are slow instrumented/Robolectric tests, not fast unit tests.",
          "**No seams to inject fakes** — the logic calls Retrofit and touches views directly; there's no interface to swap a fake repository or fake view for, so you can't isolate the rule under test.",
          "**Nothing is isolatable** — the pricing rule, the network call, and the widget update are in one method, so you can't test the rule without also running the network and UI.",
        ],
      },
      {
        t: "p",
        text: "Contrast: a ViewModel with an injected repository is a plain class — you construct it with a fake repository, call a method, and assert the emitted state, all on the JVM in milliseconds. The difference isn't 'ViewModels are magic'; it's that constructor injection + framework-free logic *create the seams* unit testing requires. So 'can't unit test' is really 'no seams and framework-welded' — a design symptom, not an Android limitation.",
      },
      {
        t: "note",
        text: "'Untestable' = 'framework-welded + no injection seams'. Naming both causes (not just 'it's in the Activity') shows you understand testability as a design property.",
      },
    ],
  },
  {
    level: "senior",
    q: "What causes the 'Massive View Controller' problem, and how is it the same as the God Activity?",
    a: [
      {
        t: "p",
        text: "'Massive View Controller' is the iOS name for the same failure mode as Android's God Activity: the framework provides one class that owns the view lifecycle *and* is the natural place to handle input and coordinate the model, so all logic gravitates into it and it balloons. Both stem from the platform fusing MVC's roles into a single framework-owned object.",
      },
      {
        t: "list",
        items: [
          "**Apple MVC** intends the ViewController to *mediate* between Model and View (both directions) — structurally closer to MVP. But because it also owns the view lifecycle and is the OS entry point, everything accretes there.",
          "**Android** gives you the Activity/Fragment as View+Controller in one object with the lifecycle — same gravity well.",
          "**Root cause (identical)** — the platform provides no *other* structural home for presentation logic, so it lands in the one class the framework instantiates.",
        ],
      },
      {
        t: "p",
        text: "The shared lesson: the God Activity / Massive View Controller isn't caused by 'bad developers' — it's caused by the *architecture providing no enforceable boundary* between decisions and effects. That's why both ecosystems evolved patterns (MVVM, VIPER, unidirectional architectures) that *add* a home for logic the framework didn't give — and it's a great cross-platform observation to make in an interview.",
      },
      {
        t: "note",
        text: "Naming the iOS parallel ('Massive View Controller') and the shared root cause (framework fuses the roles, no home for logic) demonstrates architecture understanding beyond one platform.",
      },
    ],
  },
  {
    level: "senior",
    q: "You're building a throwaway proof-of-concept in a day. Would you use MVC? Defend your answer.",
    a: [
      {
        t: "p",
        text: "For a genuine one-day throwaway POC, putting logic straight in the Activity (MVC-ish) can be a defensible, honest choice — the costs of MVC (untestability, lifecycle bugs, unbounded growth) are costs that accrue *over time and team size*, and a throwaway that will never be maintained doesn't pay them. Adding layers you'll delete tomorrow is ceremony.",
      },
      {
        t: "p",
        text: "But I'd qualify it heavily. First, the modern 'simple baseline' has shifted: a minimal `ViewModel` + `StateFlow` costs almost nothing and immediately buys config-change survival — so even for a POC, MVVM-lite is barely more effort and avoids the rotation crashes that waste demo time. Second, POCs have a habit of becoming production ('temporary' is the most permanent state in software), so 'throwaway' is a risky assumption. Third, if I'm demoing to stakeholders, a crash on rotation looks bad — and MVC's classic failure is exactly that.",
      },
      {
        t: "list",
        items: [
          "**Defensible when** — truly throwaway, single screen, no async that outlives the screen, solo, deleted after the demo.",
          "**Prefer MVVM-lite when** — any chance it survives, any async work, any stakeholder demo (rotation must not crash).",
        ],
      },
      {
        t: "p",
        text: "So my honest answer: I *could* justify MVC for a true throwaway, but I'd probably still reach for a minimal ViewModel because the cost is now negligible and it dodges the demo-killing rotation bug. The senior signal is weighing the *context* (lifespan, audience, risk of surviving) rather than dogmatically saying 'always layer' or 'never bother'.",
      },
      {
        t: "note",
        text: "Show judgment both ways: MVC is defensible for a true throwaway, but 'ViewModel-lite is nearly free and dodges rotation crashes' — deciding by context, not dogma, is the answer they want.",
      },
    ],
  },
  {
    level: "senior",
    q: "A legacy pure-MVC app crashes on rotation for some users. How do you triage it?",
    a: [
      {
        t: "p",
        text: "Rotation crashes in MVC almost always trace to the Activity being destroyed and recreated while something still references the old one or touches a recreated-but-not-ready view. I'd triage by confirming the pattern, finding the specific reference, and applying the smallest safe fix — then consider the structural fix.",
      },
      {
        t: "list",
        items: [
          "**1. Confirm it's rotation-related** — reproduce by rotating during the suspect flow (mid-load), and check the crash reports for `IllegalStateException`/NPE with a stack trace pointing at a view access or a callback. Correlate with 'happens after backgrounding/rotating'.",
          "**2. Find the dangling reference** — the usual culprit is an async callback (network, timer) that captured the old Activity/View and fires after recreation, touching a dead view. Or `onSaveInstanceState` not preserving state the recreated Activity assumes exists.",
          "**3. Smallest safe fix** — cancel in-flight work when the Activity is destroyed (so stale callbacks don't run), null-check/guard view access, and ensure any state the recreated Activity reads is restored. This stops the crash.",
          "**4. Structural fix** — move the async work and state into a ViewModel (survives rotation) so the recreated Activity just re-observes. This eliminates the *class* of bug, not just the one crash. Do it for the affected screen first (incremental).",
          "**5. Prevent regression** — add a test that rotates during the flow, and consider StrictMode/LeakCanary to catch the leaked-Activity pattern in debug.",
        ],
      },
      {
        t: "p",
        text: "The judgment call is 'stop the bleeding vs fix the disease': the smallest fix (cancel callbacks, guard views) ships fast and stops the crash; the structural fix (ViewModel) prevents recurrence but is a bigger change. I'd usually ship the guard first, then migrate the screen to a ViewModel to remove the root cause.",
      },
      {
        t: "note",
        text: "Triage answer structure that impresses: confirm the pattern → find the exact dangling reference → smallest safe fix (cancel work) → structural fix (ViewModel) → regression test. It shows incident discipline plus root-cause thinking.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does the Controller communicate with the View across the different MVC variants?",
    a: [
      {
        t: "p",
        text: "This is the detail that actually distinguishes the MVC variants, so it's worth being precise. The variants differ in whether the Controller (or its equivalent) *pushes* to the View or whether the View *pulls* from the Model by observing.",
      },
      {
        t: "list",
        items: [
          "**Classic (Smalltalk) MVC** — the Controller does *not* update the View. The Controller mutates the Model; the View observes the Model and re-renders itself. Controller→View communication essentially doesn't exist.",
          "**Web MVC (Model 2)** — the Controller *does* select and populate the View: it handles the request, updates the Model, then picks a template and fills it, returning the rendered result. One-shot, no observation (there's no long-lived View to observe across HTTP).",
          "**Apple MVC** — the ViewController mediates *both* directions: it reads the Model and pushes to the View, and handles View input to update the Model. This bidirectional mediation is why it's structurally close to MVP.",
          "**Android 'MVC'** — the Activity (View+Controller fused) mutates widgets directly from input handlers, so 'Controller→View' is just 'the Activity sets its own views' — the separation is gone.",
        ],
      },
      {
        t: "p",
        text: "The reason 'MVC' is such a slippery term is exactly this: the *role names* stayed constant while the *communication paths* changed per platform's runtime model (live objects vs stateless HTTP vs framework-owned controllers). So 'do you know MVC?' really means 'do you know which variant, and how its View gets updated?'.",
      },
      {
        t: "note",
        text: "The discriminator is 'push vs observe': classic = View observes Model (no Controller→View), Web/Apple = Controller pushes to View. Knowing that separates people who memorized 'MVC = three boxes' from people who understand it.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain why 'the Activity is both View and Controller' is the root architectural flaw, not just an inconvenience.",
    a: [
      {
        t: "p",
        text: "It's tempting to see the God Activity as merely 'a big class' — a code-hygiene issue. But the deeper problem is *structural*: because the Activity is simultaneously View and Controller (and framework-owned, with the lifecycle), the architecture provides no *enforceable boundary* between decisions (business/presentation logic) and effects (mutating widgets). Logic has no designated home, so it accretes wherever it's convenient.",
      },
      {
        t: "list",
        items: [
          "**No home for logic** — since V and C are one object, there's no slot that means 'this is where presentation logic lives, free of the framework'. Rules end up in click listeners, in `onResponse` callbacks, in adapters — anywhere.",
          "**No boundary to enforce** — you can't lint or review your way to separation when the *architecture* offers no seam. Discipline is fighting the structure, not supported by it.",
          "**Testability follows from the boundary** — with no framework-free home for decisions, there's nothing to unit-test in isolation. Testability is a *consequence* of the missing boundary, not a separate problem.",
        ],
      },
      {
        t: "p",
        text: "This reframes every successor pattern: MVP, MVVM, and MVI are each fundamentally an answer to 'where do decisions live, and how do we keep effects out of there?' — the Presenter, the ViewModel, the reducer are all *the home for decisions* that MVC's fused roles denied. So 'the Activity is View and Controller' isn't an inconvenience; it's the absence of the boundary that all of Android architecture has been trying to restore ever since.",
      },
      {
        t: "note",
        text: "The senior framing: 'an architecture is good exactly to the degree that logic has one obvious, testable home' — MVC's flaw is that the fused Activity denies logic any home, and every successor pattern is a home for decisions.",
      },
    ],
  },
];

export default qa;
