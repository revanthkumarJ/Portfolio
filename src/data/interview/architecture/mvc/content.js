// MVC — Content tab.

const content = [
  {
    heading: "What is MVC and where it came from",
    blocks: [
      {
        t: "p",
        text: "**MVC (Model–View–Controller)** is the oldest UI architecture pattern — invented by Trygve Reenskaug at Xerox PARC in **1979** for Smalltalk. It splits an interactive application into three roles: the **Model** (data + business logic), the **View** (what the user sees), and the **Controller** (interprets user input and updates the Model).",
      },
      {
        t: "list",
        items: [
          "**Model** — owns application data and rules; notifies observers when it changes. Knows nothing about View or Controller.",
          "**View** — renders the Model. In *classic* MVC the View observes the Model directly and re-reads it on change notifications.",
          "**Controller** — receives raw user input (clicks, keystrokes), translates it into Model operations. In classic MVC it does *not* update the View — the Model's change notification does.",
        ],
      },
      {
        t: "note",
        text: "Key structural fact interviewers probe: in classic MVC the **View talks to the Model directly** (reads it, observes it). That's the fundamental difference from MVP/MVVM, where the middle layer fully insulates the View from the Model.",
      },
    ],
  },
  {
    heading: "The variants that confuse everyone",
    blocks: [
      {
        t: "p",
        text: "\"MVC\" means different things in different ecosystems, and untangling them is a classic senior question:",
      },
      {
        t: "table",
        headers: ["Variant", "How it wires up", "Where you see it"],
        rows: [
          ["Classic (Smalltalk) MVC", "View observes Model; Controller handles input only", "original desktop GUIs; mostly historical"],
          ["Web MVC (a.k.a. Model 2)", "Controller receives the HTTP request, manipulates the Model, *selects and populates* the View (template); no live observation — one-shot request/response", "Spring MVC, Rails, Django (MTV), ASP.NET MVC"],
          ["Apple MVC (Cocoa)", "Controller sits *between* Model and View, mediating both directions", "iOS UIKit — famously degrades into \"Massive View Controller\""],
          ["\"Android MVC\"", "Activity/Fragment plays View *and* Controller simultaneously; XML layout is the (dumb) View skeleton", "pre-2017 Android codebases"],
        ],
      },
      {
        t: "p",
        text: "So when an interviewer asks \"is Android MVC?\", the accurate answer: Android's framework never enforced any pattern; the *default* shape people wrote — everything in the Activity — is closest to Apple-style MVC where the controller absorbed everything, and that failure mode is exactly why the community moved on.",
      },
    ],
  },
  {
    heading: "MVC on Android in practice — the God Activity",
    blocks: [
      {
        t: "p",
        text: "Here's what \"MVC\" Android code actually looked like — the Activity finds views, handles clicks, calls the network, parses responses, mutates widgets, and manages lifecycle, all in one class:",
      },
      {
        t: "code",
        title: "The classic God Activity (what NOT to do — but know how to critique it)",
        code: `class UserActivity : AppCompatActivity() {

    private lateinit var nameText: TextView
    private lateinit var progress: ProgressBar
    private var call: Call<UserDto>? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_user)
        nameText = findViewById(R.id.name)
        progress = findViewById(R.id.progress)

        progress.visibility = View.VISIBLE
        call = api.getUser(intent.getStringExtra("id")!!)
        call!!.enqueue(object : Callback<UserDto> {
            override fun onResponse(c: Call<UserDto>, r: Response<UserDto>) {
                progress.visibility = View.GONE
                // business rule buried in the "view":
                val display = if (r.body()!!.isPremium) "⭐ " + r.body()!!.name
                              else r.body()!!.name
                nameText.text = display
            }
            override fun onFailure(c: Call<UserDto>, t: Throwable) {
                progress.visibility = View.GONE
                Toast.makeText(this@UserActivity, t.message, Toast.LENGTH_SHORT).show()
            }
        })
    }

    override fun onDestroy() {
        super.onDestroy()
        call?.cancel() // manual lifecycle management, easy to forget
    }
}`,
      },
      {
        t: "list",
        items: [
          "The Activity is simultaneously **View** (mutating widgets), **Controller** (handling input, orchestrating the call), and partly **Model** (the premium-star business rule).",
          "Rotation destroys everything mid-flight: the request either dies or, worse, its callback touches a destroyed Activity — the historical source of countless `IllegalStateException`s and leaks.",
          "Nothing is unit-testable: every line needs an Android device/emulator because it's welded to framework classes.",
        ],
      },
    ],
  },
  {
    heading: "Why MVC breaks down on Android specifically",
    blocks: [
      {
        t: "list",
        items: [
          "**No separate Controller slot in the framework**: Android hands you one entry-point class (Activity/Fragment) that already owns the view hierarchy and the lifecycle — the V and C roles collapse into it by gravity.",
          "**Lifecycle hostility**: classic MVC assumes long-lived View/Controller objects; Android destroys and recreates them on rotation, so any in-controller state is lost and any Model→View observation must be re-wired constantly.",
          "**View–Model coupling**: even done \"correctly\", classic MVC lets the View read the Model — so Model refactors ripple into layouts/adapters, and you can't fake the Model easily for UI tests.",
          "**Testability**: controllers welded to Activities need instrumented tests; JVM unit tests are impossible for the interesting logic.",
          "**SRP violation at scale**: 2000-line Activities where a bug fix in networking risks breaking click handling — the maintenance cost that drove MVP adoption around 2014–2016.",
        ],
      },
      {
        t: "note",
        text: "Interview framing: don't just trash MVC. Say *why it made sense* (simple, no indirection, fine for tiny screens) and *what specifically about Android* (lifecycle + merged roles) made it fail — that shows architectural judgment rather than memorized dogma.",
      },
    ],
  },
  {
    heading: "MVC vs MVP vs MVVM — the exact deltas",
    blocks: [
      {
        t: "table",
        headers: ["Question", "MVC", "MVP", "MVVM"],
        rows: [
          ["Does the View know the Model?", "**Yes** — reads/observes it directly", "No — Presenter mediates everything", "No — ViewModel exposes prepared state"],
          ["Does the middle layer know the View?", "Controller: often yes (Android: they're the same object)", "Yes — via a View **interface**", "**No** — View observes the VM"],
          ["Input handling", "Controller", "View forwards to Presenter", "View calls VM functions"],
          ["Testability of logic", "poor (framework-welded)", "good (mock View interface)", "good (assert observable state)"],
          ["Config-change story", "none", "manual (retain/detach)", "built-in (Jetpack ViewModel)"],
        ],
      },
      {
        t: "p",
        text: "Evolution in one sentence: MVC → MVP moved all View↔Model traffic through a testable Presenter with a View interface; MVP → MVVM replaced the Presenter→View interface calls with **observable state**, removing the attach/detach ceremony and gaining lifecycle survival.",
      },
    ],
  },
  {
    heading: "Migrating away from a God-Activity MVC codebase",
    blocks: [
      {
        t: "list",
        items: [
          "**Extract the data layer first**: move API/database code behind repositories — highest value, lowest risk, benefits every later step.",
          "**Then extract presentation logic per screen** into ViewModels (going straight to MVVM — migrating MVC→MVP in 2026 would be moving into another condemned building).",
          "**Characterize before you cut**: God Activities hide implicit behavior (ordering, double-click guards, toast timing); pin it with UI tests (Espresso/Compose) before splitting.",
          "**Kill silent couplings**: God Activities often communicate via static fields, singletons and sticky broadcasts — replace with explicit repository state as you go.",
          "Strangler pattern, screen by screen; new features in the new architecture only.",
        ],
      },
    ],
  },
];

export default content;
