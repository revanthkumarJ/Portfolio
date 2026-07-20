// KMP iOS Interop — Content tab. Teaching-first.

const content = [
  {
    heading: "How shared Kotlin reaches Swift",
    blocks: [
      {
        t: "p",
        text: "For iOS to use your shared Kotlin code, **Kotlin/Native compiles the shared module into an Obj-C-compatible framework** (or XCFramework) that the iOS app imports and calls from Swift. The bridge goes Kotlin → Objective-C → Swift: Kotlin/Native generates Obj-C headers for your shared code, and Swift can call Obj-C, so Swift calls your Kotlin. This works, but the *Kotlin→Obj-C* translation is where the friction lives — because Obj-C's type system is less rich than Kotlin's (and Swift's), some Kotlin features translate awkwardly.",
      },
      {
        t: "list",
        items: [
          "**The framework** — the shared module builds into a `.framework`/`.xcframework` (a binary + Obj-C headers). The iOS app adds it as a dependency and `import shared`, then calls the shared classes/functions like any library.",
          "**The Obj-C intermediary** — because Kotlin/Native exposes to Obj-C (not directly to Swift), everything passes through Obj-C's model, which loses some of Kotlin's type information. This is the root of most interop rough edges.",
          "**Multi-module → umbrella framework** — if the shared code spans multiple KMP modules, you export them into *one* framework via an 'umbrella' module (direct multi-framework consumption breaks type identity across frameworks). One framework, one import.",
        ],
      },
    ],
  },
  {
    heading: "The interop pain points",
    blocks: [
      {
        t: "table",
        headers: ["Kotlin feature", "How it translates to Swift", "Issue"],
        rows: [
          ["suspend functions", "become completion-handler / async functions", "usable but not idiomatic; no structured concurrency across the boundary"],
          ["Flow / StateFlow", "no native equivalent — needs wrapping", "Swift can't collect a Flow directly"],
          ["sealed classes", "become classes with no exhaustiveness", "Swift loses the exhaustive `switch` — must use `is` checks"],
          ["Generics", "largely erased to Any/Obj-C types", "type safety lost across the boundary"],
          ["Kotlin exceptions", "must be @Throws-annotated or they crash Swift", "uncaught Kotlin exceptions terminate the app"],
          ["Default arguments", "not supported in Obj-C", "Swift must provide all arguments"],
        ],
      },
      {
        t: "list",
        items: [
          "**Coroutines/Flow** — the biggest one. Obj-C/Swift have no coroutines, so `suspend` functions become completion handlers (or Swift `async` in newer Kotlin), and `Flow` has *no* native mapping — Swift can't just `for await` a Kotlin Flow. You need a bridge (SKIE or hand-written wrappers).",
          "**Sealed classes → no exhaustiveness** — Kotlin's exhaustive `when` becomes, in Swift, a chain of `is` type checks with no compiler guarantee you handled every case — you lose a key safety feature.",
          "**Generics erased** — Kotlin generics mostly don't survive to Obj-C, so type safety across the boundary is weakened.",
          "**Exceptions** — an uncaught Kotlin exception crossing to Swift *crashes* the app unless the function is `@Throws`-annotated (which maps it to a Swift error). So error handling needs care — prefer modeling errors as return values (Result/sealed) over throwing across the boundary.",
        ],
      },
    ],
  },
  {
    heading: "SKIE — smoothing the Swift experience",
    blocks: [
      {
        t: "p",
        text: "**SKIE** (Swift Kotlin Interface Enhancer, by Touchlab) is a tool that dramatically improves the Swift-facing API of your shared Kotlin code. It's a compiler plugin that generates a nicer Swift layer over the Obj-C interface, translating Kotlin features into *idiomatic Swift* — the most important being **turning Flows into Swift `AsyncSequence`** and **sealed classes into proper Swift enums** (restoring exhaustiveness).",
      },
      {
        t: "list",
        items: [
          "**Flow → Swift `AsyncSequence`** — SKIE makes a Kotlin `Flow` collectable in Swift with `for await value in flow`, natively — the single most valuable thing it does, since reactive streams are central and otherwise painful.",
          "**Sealed classes → Swift enums** — SKIE turns Kotlin sealed hierarchies into real Swift enums, so Swift gets *exhaustive `switch`* (the compiler ensures every case is handled) — restoring the safety lost in raw Obj-C interop.",
          "**Better suspend functions, default arguments, and more** — SKIE improves several translations, making the shared API feel like a native Swift library rather than an Obj-C one.",
          "**Why it matters** — without SKIE, Swift developers consuming your shared Kotlin get an awkward, un-idiomatic API (completion handlers, no enums, manual Flow bridging), which hurts adoption and productivity. SKIE makes the shared code pleasant to use from Swift, which is important for the iOS team accepting KMP.",
        ],
      },
    ],
  },
  {
    heading: "Bridging state to SwiftUI",
    blocks: [
      {
        t: "p",
        text: "A shared ViewModel exposes state as `StateFlow<UiState>`. SwiftUI is state-driven (via `@Published`/`@Observable`), so you bridge the Kotlin StateFlow to a SwiftUI-observable object — typically a thin Swift `ObservableObject` adapter that collects the flow (via SKIE's AsyncSequence) and republishes into a `@Published` property SwiftUI observes.",
      },
      {
        t: "code",
        title: "Swift adapter over a shared ViewModel (with SKIE)",
        code: `@MainActor
class ProfileObservable: ObservableObject {
    @Published var state: ProfileUiState = ProfileUiState.Loading()
    private let viewModel: ProfileViewModel   // shared Kotlin ViewModel

    init(viewModel: ProfileViewModel) {
        self.viewModel = viewModel
        Task {
            for await state in viewModel.uiState {   // SKIE: Flow -> AsyncSequence
                self.state = state
            }
        }
    }
    deinit { viewModel.clear() }   // clean up the shared ViewModel
}
// SwiftUI view observes ProfileObservable.state`,
      },
      {
        t: "list",
        items: [
          "**The pattern** — a Swift `ObservableObject` wraps the shared ViewModel, subscribes to its `StateFlow` (as an AsyncSequence via SKIE), and republishes into `@Published` state; the SwiftUI view observes *that*. Intents are just method calls into the shared ViewModel (Swift calls Kotlin functions natively — that direction is easy).",
          "**Lifecycle/threading** — the adapter must call `clear()`/cancel on `deinit` (the shared VM has no automatic iOS lifecycle), and state updates must land on the *main thread* for SwiftUI (`@MainActor`).",
          "**The result** — the *same* Kotlin ViewModel drives both a Compose UI on Android (which collects the StateFlow directly) and a SwiftUI UI on iOS (via the adapter). The presentation *logic* is shared; only the thin UI-binding adapter differs — the essence of KMP done well.",
        ],
      },
      {
        t: "note",
        text: "iOS interop: Kotlin/Native compiles shared code to an Obj-C framework (multi-module → umbrella/XCFramework) that Swift imports. Friction from Kotlin→Obj-C translation: coroutines/Flow have no native Swift mapping (suspend → completion handlers/async; Flow needs wrapping), sealed classes lose exhaustiveness, generics erased, uncaught exceptions crash Swift (use @Throws / errors-as-values). SKIE fixes the worst: Flow → Swift AsyncSequence, sealed classes → Swift enums (exhaustive switch). Bridge shared StateFlow to SwiftUI via an ObservableObject adapter (collect flow → @Published), calling clear() on deinit; intents are direct Kotlin calls.",
      },
    ],
  },
];

export default content;
