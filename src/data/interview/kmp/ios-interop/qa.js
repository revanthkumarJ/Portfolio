// KMP iOS Interop — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "How does iOS use shared Kotlin code in a KMP project?",
    a: [
      {
        t: "p",
        text: "**Kotlin/Native compiles the shared module into an Objective-C-compatible framework (or XCFramework), which the iOS app imports and calls from Swift — the bridge goes Kotlin → Objective-C → Swift.** Kotlin/Native generates Obj-C headers for your shared code, and since Swift can call Obj-C, Swift can call your Kotlin classes and functions like any imported library.",
      },
      {
        t: "list",
        items: [
          "**The framework** — the shared KMP module builds into a `.framework`/`.xcframework` (a compiled binary plus Obj-C headers). The iOS (Xcode) app adds it as a dependency, does `import shared`, and calls the shared code directly.",
          "**The Obj-C intermediary** — Kotlin/Native exposes to Obj-C, not directly to Swift. Swift then consumes the Obj-C interface. This intermediary is where interop friction comes from, because Obj-C's type system is less rich than Kotlin's/Swift's.",
          "**Multiple modules → one framework** — if shared code spans several KMP modules, you export them through an 'umbrella' module into a single framework (consuming multiple frameworks directly breaks type identity across them).",
        ],
      },
      {
        t: "p",
        text: "So calling *into* shared Kotlin from Swift is straightforward — Swift calls Kotlin functions/constructors natively (that direction works well). The complications arise from *how certain Kotlin features translate* through Obj-C: coroutines/Flow, sealed classes, generics, and exceptions don't map cleanly. Tools like SKIE smooth these over to make the Swift experience idiomatic. The typical project shape is a `shared` module consumed by both an `androidApp` (Gradle dependency) and an `iosApp` (the framework in Xcode).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is SKIE and what problem does it solve?",
    a: [
      {
        t: "p",
        text: "**SKIE (Swift Kotlin Interface Enhancer) is a tool that generates a nicer, more idiomatic Swift layer over the Obj-C interface of your shared Kotlin code. It solves the problem that raw Kotlin→Obj-C interop produces an awkward, un-idiomatic Swift API — most importantly by turning Kotlin `Flow`s into Swift `AsyncSequence` and sealed classes into proper Swift enums.**",
      },
      {
        t: "list",
        items: [
          "**Flow → Swift `AsyncSequence`** — the most valuable feature. Without SKIE, a Kotlin `Flow` has no native Swift equivalent, so Swift can't just collect it — you'd write manual bridging. SKIE makes it collectable natively with `for await value in flow`. Since reactive streams (StateFlow for UI state) are central to KMP apps, this is huge.",
          "**Sealed classes → Swift enums** — SKIE converts Kotlin sealed hierarchies into real Swift enums, restoring *exhaustive `switch`* (the compiler ensures every case is handled). Raw interop loses this — sealed classes become plain classes needing `is` checks with no exhaustiveness guarantee.",
          "**Better suspend functions, default arguments, and more** — SKIE improves several translations so the shared API feels like a native Swift library rather than an Obj-C one.",
        ],
      },
      {
        t: "p",
        text: "The reason it matters is *adoption and productivity on the iOS side*. Without SKIE, Swift developers consuming your shared Kotlin face an unpleasant API (completion handlers instead of async, manual Flow bridging, no exhaustive enums), which creates friction and resistance to KMP. SKIE makes the shared code *pleasant* to use from Swift — which is important for getting the iOS team on board with a KMP approach. It's essentially become a standard part of the KMP-for-iOS toolchain precisely because the two things it fixes (Flow bridging and sealed-class exhaustiveness) are the two most painful raw-interop issues.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why can't Swift directly use Kotlin coroutines and Flows?",
    a: [
      {
        t: "p",
        text: "**Because Swift and Objective-C have no concept of Kotlin coroutines, and the Kotlin→Obj-C bridge can't represent them natively. Coroutines are a Kotlin-specific mechanism (with continuations, structured concurrency, and `Flow` as a reactive stream type) that has no direct equivalent in the Obj-C type system the interop goes through.**",
      },
      {
        t: "list",
        items: [
          "**Suspend functions** — Kotlin/Native translates a `suspend` function into a *completion-handler-based* function (or, in newer Kotlin, a Swift `async` function). So Swift *can* call it, but it's not the same as Kotlin's structured concurrency — the coroutine machinery doesn't cross the boundary; it's adapted to Swift's callback/async model.",
          "**Flow** — this is the harder one. `Flow`/`StateFlow` are Kotlin reactive stream types with *no* native Swift/Obj-C equivalent. Raw interop exposes a Flow as a class you'd have to manually subscribe to via callbacks — Swift can't just `for await` it or collect it idiomatically. There's no built-in mapping to Swift's `AsyncSequence` or Combine publishers.",
          "**The consequence** — consuming the reactive state that a shared ViewModel exposes (a `StateFlow<UiState>`) from SwiftUI requires *bridging*: either hand-written wrapper classes that subscribe to the Flow and republish, or a tool like SKIE that converts Flows to Swift `AsyncSequence` automatically.",
        ],
      },
      {
        t: "p",
        text: "The practical upshot: because reactive streams (StateFlow for UI state) are how KMP shared ViewModels expose state, and Swift can't natively consume them, the Flow→Swift bridge is *the* central interop concern. This is why SKIE (Flow → AsyncSequence) is so valuable, and why the standard pattern for iOS is a thin Swift `ObservableObject` adapter that collects the shared StateFlow (via SKIE) and republishes into a `@Published` property SwiftUI observes. The mismatch stems from coroutines being a Kotlin language feature that the Obj-C-based interop layer simply has no way to express directly — so it's adapted (suspend → callbacks/async) or requires tooling (Flow → SKIE).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you expose a shared ViewModel's state to SwiftUI, and what lifecycle/threading concerns arise?",
    a: [
      {
        t: "p",
        text: "**You wrap the shared Kotlin ViewModel in a thin Swift `ObservableObject` adapter that subscribes to the ViewModel's `StateFlow` (as a Swift `AsyncSequence` via SKIE), republishes each emission into a `@Published` property, and lets the SwiftUI view observe *that* — while calling method(s) on the shared ViewModel for user intents (which is a direct, easy Kotlin call). The concerns are lifecycle (the shared VM has no automatic iOS lifecycle) and threading (state must reach SwiftUI on the main thread).**",
      },
      {
        t: "code",
        title: "The adapter pattern",
        code: `@MainActor
class ProfileObservable: ObservableObject {
    @Published var state: ProfileUiState = ProfileUiState.Loading()
    private let viewModel: ProfileViewModel

    init(viewModel: ProfileViewModel) {
        self.viewModel = viewModel
        Task {
            for await s in viewModel.uiState {   // SKIE: StateFlow -> AsyncSequence
                self.state = s                    // republish to SwiftUI
            }
        }
    }
    func onRefresh() { viewModel.refresh() }      // intent -> direct Kotlin call
    deinit { viewModel.clear() }                  // lifecycle cleanup
}`,
      },
      {
        t: "list",
        items: [
          "**The bridging pattern**: the shared ViewModel exposes state as `StateFlow<UiState>` (works identically on both platforms). On Android, Compose collects it directly (`collectAsStateWithLifecycle`). On iOS, SwiftUI can't collect a Flow, so the `ObservableObject` adapter collects it (via SKIE's AsyncSequence) and mirrors it into `@Published var state`, which the SwiftUI view observes with `@StateObject`/`@ObservedObject`. *Intents* go the other direction — Swift calls the ViewModel's methods directly (Kotlin→Swift function calls are easy), so `onRefresh()` just invokes `viewModel.refresh()`. The *presentation logic* (the ViewModel) is shared; only this thin adapter is platform-specific.",
          "**Lifecycle concern — no automatic iOS lifecycle**: the shared Kotlin ViewModel has no iOS lifecycle owner managing it (on Android, `viewModelScope` is cleared automatically; iOS has no equivalent). So the adapter must *own* the ViewModel's lifetime — cancel the collection and call `viewModel.clear()` (cancelling `viewModelScope`) on `deinit`, or the ViewModel's coroutines leak. Managing this correctly (creating the VM per screen, clearing on deinit) is a real responsibility that Android handles for you but iOS doesn't.",
          "**Threading concern — main thread for SwiftUI**: SwiftUI requires `@Published` updates on the main thread. The state emissions from the Kotlin Flow must land on the main thread — either the shared VM emits on `Dispatchers.Main`, or the adapter hops to main (`@MainActor` on the class handles this in the example). Getting this wrong causes SwiftUI update warnings/crashes or missed updates.",
          "**Error/exception concern**: uncaught Kotlin exceptions crossing to Swift *crash* the app, so the shared VM should model errors as *state* (an error variant in UiState) or use `@Throws`/Result — never let exceptions propagate across the boundary into Swift.",
        ],
      },
      {
        t: "list",
        items: [
          "**Alternatives/evolution**: libraries like **KMP-ObservableViewModel** or frameworks like **Decompose** (with its lifecycle-aware components) or **MVIKotlin** provide more structured cross-platform state/lifecycle handling, reducing the boilerplate of hand-written adapters. Newer Swift `@Observable` (Observation framework) can replace `ObservableObject`/`@Published`. But the core pattern — collect the shared Flow, republish to SwiftUI, manage lifetime, handle threading — is the same.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the essence of KMP done well is that the *presentation logic* (the ViewModel exposing `StateFlow<UiState>`) is *shared*, and only a *thin, platform-specific UI-binding adapter* differs — Compose collects the flow directly on Android; a Swift `ObservableObject` adapter collects it (via SKIE) and republishes to SwiftUI on iOS. The concerns that arise are precisely the things Android's framework handles *for* you but iOS doesn't: *lifecycle* (you must own the shared VM's lifetime and `clear()` on deinit — no automatic `viewModelScope` clearing) and *threading* (state must reach SwiftUI on the main thread — `@MainActor`/main-dispatched emissions), plus *error handling* (never let Kotlin exceptions cross to Swift — model errors as state). Understanding that the shared-VM-with-per-platform-adapter is the target architecture, that SKIE's Flow→AsyncSequence is what makes the iOS side feasible, and that iOS requires *manual* lifecycle/threading management the shared VM doesn't get for free — is exactly the KMP iOS-integration depth an Android/KMP interviewer probes, and it demonstrates you've actually shipped shared code to iOS, not just written commonMain logic.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the main friction points in Kotlin-to-Swift interop, and how do you mitigate them?",
    a: [
      {
        t: "p",
        text: "**The friction comes from Kotlin features translating imperfectly through the Obj-C bridge (which is less expressive than both Kotlin and Swift): coroutines/Flow have no native Swift mapping, sealed classes lose exhaustiveness, generics are erased, exceptions crash Swift if uncaught, and default arguments/some Kotlin idioms don't survive. The mitigations are SKIE (for the biggest ones), careful API design at the boundary, and modeling errors as values.**",
      },
      {
        t: "list",
        items: [
          "**Friction — Coroutines/Flow (the biggest)**: `suspend` functions become completion-handler/async functions (usable but not structured-concurrency), and `Flow` has *no* native Swift equivalent, so Swift can't collect it directly. **Mitigation**: use **SKIE**, which turns Flows into Swift `AsyncSequence` (collectable with `for await`) and improves suspend translation — the single most impactful tool. Without SKIE, hand-written wrapper classes subscribing to the Flow.",
          "**Friction — sealed classes lose exhaustiveness**: Kotlin's exhaustive `when` becomes, in raw Swift, `is`-check chains with no compiler guarantee all cases are handled — losing a key safety feature (and risking unhandled cases when you add a variant). **Mitigation**: **SKIE** converts sealed classes to real Swift enums, restoring exhaustive `switch`. This is especially important for UI state (a sealed `UiState`), where you *want* Swift forced to handle every state.",
          "**Friction — generics erased**: Kotlin generics mostly don't survive to Obj-C, so type safety weakens across the boundary (things become `Any`/opaque). **Mitigation**: design the *public* shared API to minimize exposed generics at the boundary — return concrete types or well-defined sealed hierarchies rather than heavily-generic signatures; keep generics *internal* to commonMain where they work fully.",
          "**Friction — exceptions crash Swift**: an uncaught Kotlin exception crossing to Swift *terminates the app* unless the function is `@Throws`-annotated (mapping it to a Swift error). **Mitigation**: *model errors as values* (a `Result` type or a sealed error, or an error variant in UiState) rather than throwing across the boundary — the errors-as-values approach (from clean-architecture error handling) is doubly valuable in KMP because it avoids the exception-crashes-Swift problem entirely. Where you must throw, annotate `@Throws`.",
          "**Friction — default arguments, some idioms**: Obj-C doesn't support default arguments, so Swift must provide all arguments; certain Kotlin constructs (extension functions, some collection types) translate awkwardly. **Mitigation**: design the boundary API to be *Swift-friendly* — explicit parameters, simple types, avoid relying on Kotlin-only conveniences at the public surface; keep the clever Kotlin internal.",
        ],
      },
      {
        t: "list",
        items: [
          "**Overarching mitigation — treat the shared API as a *public product* for Swift consumers**: the shared module's public surface is an API that Swift developers use, so design it deliberately for that audience — SKIE-enhanced (Flow/enums), errors-as-values (no crossing exceptions), concrete boundary types (limit exposed generics), explicit parameters (no default-arg reliance), and a thin, clear interface (not exposing every internal Kotlin detail). Keep the rich Kotlin idioms *internal* to commonMain and expose a clean, Swift-idiomatic boundary.",
          "**Frameworks that structure this**: Decompose, MVIKotlin, and KMP-ObservableViewModel provide patterns/tooling that reduce boilerplate and handle the state/lifecycle bridging more robustly than hand-rolled adapters — worth adopting for larger apps.",
          "**The trend — improving**: the interop story keeps improving (SKIE, better Swift-export in newer Kotlin/Native, the upcoming direct Swift export). So while friction is real *today*, it's diminishing, and the mitigations (SKIE especially) make it manageable in production now.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: Kotlin-to-Swift friction is fundamentally the *impedance mismatch* between Kotlin's rich features and the Obj-C bridge (less expressive than either language), concentrated in coroutines/Flow, sealed-class exhaustiveness, generics, and exceptions. The mitigation strategy has two pillars: *tooling* (SKIE, which directly fixes the two worst — Flow→AsyncSequence and sealed→enum) and *deliberate boundary API design* (treat the shared module's public surface as a product for Swift consumers — errors-as-values not exceptions, concrete types not exposed generics, explicit parameters, SKIE-enhanced idioms, and a clean thin interface with clever Kotlin kept internal). The key mindset is that the shared code isn't just 'Kotlin that also runs on iOS' — its *public API* must be *designed for Swift ergonomics*, because a KMP project's success on iOS depends on Swift developers finding the shared code pleasant to use. And the honest note is that this friction is *real but shrinking* (SKIE and evolving Swift-export make it manageable today, and improving). Demonstrating the specific frictions *with* their mitigations, the 'design the boundary as a Swift-facing product' mindset, the errors-as-values connection, and the balanced 'real but improving' assessment is the comprehensive senior answer that shows genuine KMP-on-iOS production experience rather than surface familiarity.",
      },
    ],
  },
];

export default qa;
