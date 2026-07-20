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
  {
    level: "senior",
    q: "How does the Kotlin-to-Objective-C bridge work?",
    a: [
      {
        t: "p",
        text: "Kotlin/Native compiles your shared module into an *Objective-C-compatible framework* — it generates an Obj-C *header* exposing your Kotlin classes/functions as Obj-C interfaces, which Swift consumes via its Obj-C interop. So Swift calls Kotlin *through Obj-C* (not directly). This bridge shapes what's exposed: Kotlin types map to Obj-C/Swift equivalents, but *Obj-C's limitations* (no generics richness, no default args, no sealed exhaustiveness, name mangling) leak into the Swift API — which is exactly what tools like SKIE smooth over.",
      },
      {
        t: "list",
        items: [
          "**Kotlin/Native** — outputs an Obj-C-compatible framework.",
          "**Generates** — an Obj-C header of your Kotlin API.",
          "**Swift** — calls Kotlin via Obj-C interop.",
          "**Obj-C limits** — leak into the Swift API (SKIE smooths).",
        ],
      },
      {
        t: "note",
        text: "Kotlin/Native outputs an Obj-C-compatible framework — generating an Obj-C header exposing Kotlin classes/functions, which Swift consumes via Obj-C interop (Swift → Obj-C → Kotlin). The bridge shapes the API: Obj-C limitations (weak generics, no default args, no sealed exhaustiveness, mangling) leak into Swift — exactly what SKIE smooths over.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do Kotlin types map to Swift/Objective-C?",
    a: [
      {
        t: "p",
        text: "Common mappings: Kotlin `String`↔`String`, `Int`/`Long`↔`Int`/`Int64` (boxed as `KotlinInt` in generics), `List`↔`Array`, `Map`↔`Dictionary`, nullable↔optional. But: Kotlin *generics* become loosely-typed (often `Any`/`id`) across the bridge, `sealed class`es lose exhaustiveness (Swift can't `switch` exhaustively), *default parameters* disappear (all args required), `data class` niceties (copy/componentN) aren't exposed, and companion objects/enums map awkwardly. Design shared APIs aware of this — prefer simple, explicit signatures, and use SKIE to restore sealed/Flow ergonomics.",
      },
      {
        t: "list",
        items: [
          "**Basics** — String/collections/nullable map cleanly.",
          "**Generics** — lose type info across the bridge.",
          "**Sealed classes** — no Swift exhaustiveness.",
          "**Default args/data-class niceties** — not exposed.",
        ],
      },
      {
        t: "note",
        text: "Mappings: String/Int/List/Map/nullable map to Swift equivalents (Int boxed as KotlinInt in generics). But Kotlin generics lose type info, sealed classes lose exhaustiveness, default parameters disappear (all args required), and data-class copy/componentN aren't exposed. Design shared APIs with simple explicit signatures; use SKIE to restore sealed/Flow ergonomics.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you integrate the shared framework into an Xcode project?",
    a: [
      {
        t: "p",
        text: "Three common ways: *CocoaPods* (the KMP CocoaPods Gradle plugin publishes the shared module as a pod the iOS app depends on — simplest for many teams), *Swift Package Manager* (export the framework as an SPM package/XCFramework), or a *direct framework* (a Gradle task builds the `.framework`/XCFramework, added to Xcode's linked frameworks + a build phase). CocoaPods is popular for tight Gradle integration; XCFramework/SPM is cleaner for distributing a prebuilt binary. In all cases, Swift then `import shared` and calls the Kotlin API.",
      },
      {
        t: "list",
        items: [
          "**CocoaPods** — KMP plugin publishes a pod (common).",
          "**SPM** — export as an XCFramework/package.",
          "**Direct framework** — Gradle builds `.framework`, link in Xcode.",
          "**Then** — Swift `import shared` and call Kotlin.",
        ],
      },
      {
        t: "note",
        text: "Integrate via CocoaPods (KMP CocoaPods Gradle plugin publishes the shared module as a pod — simplest), Swift Package Manager (export as an XCFramework/package), or a direct framework (Gradle builds .framework/XCFramework, linked in Xcode with a build phase). CocoaPods for tight Gradle integration; XCFramework/SPM for a prebuilt binary. Then Swift import shared and calls Kotlin.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is KMP-NativeCoroutines, and how does it differ from SKIE?",
    a: [
      {
        t: "p",
        text: "Both solve *consuming Kotlin coroutines/Flows from Swift*. *KMP-NativeCoroutines* is a library where you *annotate* suspend/Flow APIs and it generates Swift-friendly wrappers (async/await, Combine publishers, or an async-sequence), with proper cancellation. *SKIE* is a *compiler plugin* that *transparently* enhances the generated Swift API — Flows become async sequences, suspend functions become Swift `async`, and *sealed classes become exhaustive Swift enums* — with little to no annotation. SKIE is more automatic/broad; NativeCoroutines is explicit/targeted. Both address the coroutine/Flow interop gap.",
      },
      {
        t: "list",
        items: [
          "**Both** — Swift-friendly coroutines/Flows.",
          "**NativeCoroutines** — annotate APIs → generated wrappers.",
          "**SKIE** — compiler plugin, transparent, + sealed→enum.",
          "**SKIE** — broader/automatic; NativeCoroutines targeted.",
        ],
      },
      {
        t: "note",
        text: "Both make Kotlin coroutines/Flows Swift-friendly. KMP-NativeCoroutines: annotate suspend/Flow APIs → generated async/Combine wrappers with cancellation. SKIE: a compiler plugin that transparently turns Flows into async sequences, suspend into Swift async, and sealed classes into exhaustive Swift enums — minimal annotation. SKIE is broader/automatic; NativeCoroutines explicit/targeted.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle threading when Swift calls shared Kotlin code?",
    a: [
      {
        t: "p",
        text: "With the *new memory manager*, Kotlin/Native no longer requires freezing, so you can share state and run coroutines across threads much like Android. Still, be deliberate: *suspend functions* called from Swift should complete on a sensible dispatcher, and *UI updates must happen on the main thread* — ensure Flows/results are delivered on Main before Swift updates SwiftUI (tools like SKIE/NativeCoroutines and `MainScope`/`Dispatchers.Main` help). Avoid blocking the main thread with heavy shared work. The mental model is close to Android's main-safety, applied at the Swift boundary.",
      },
      {
        t: "list",
        items: [
          "**New memory model** — no freezing; threads like Android.",
          "**Deliver to Main** — before Swift updates SwiftUI.",
          "**Tools** — SKIE/NativeCoroutines, Dispatchers.Main.",
          "**Avoid** — blocking main with heavy shared work.",
        ],
      },
      {
        t: "note",
        text: "The new memory manager removes freezing — share state/coroutines across threads like Android. Still, deliver Flow/suspend results on the main thread before Swift updates SwiftUI (SKIE/NativeCoroutines, Dispatchers.Main help), and don't block main with heavy shared work. The model is close to Android main-safety, applied at the Swift boundary.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you share a ViewModel between Android and iOS?",
    a: [
      {
        t: "p",
        text: "Put a *shared ViewModel/presenter* in `commonMain` exposing state as a `StateFlow` and actions as functions. Android collects the `StateFlow` in Compose normally. iOS consumes it via *SKIE/NativeCoroutines* (as an async sequence/Combine publisher, or an observable wrapper) and drives SwiftUI. Manage the *lifecycle*: the shared VM's `CoroutineScope` must be cancelled when the screen goes away — on iOS you call a `clear()`/`onCleared` from the view's disappear, since there's no Android `ViewModelStore`. Libraries like *Moko-MVVM* or *Decompose* help standardize this cross-platform.",
      },
      {
        t: "list",
        items: [
          "**Shared VM** — StateFlow state + action functions in common.",
          "**Android** — collect StateFlow in Compose.",
          "**iOS** — SKIE/NativeCoroutines → SwiftUI.",
          "**Lifecycle** — cancel the scope on iOS disappear (no ViewModelStore).",
        ],
      },
      {
        t: "note",
        text: "Share a ViewModel/presenter in commonMain exposing StateFlow state + action functions. Android collects it in Compose; iOS consumes via SKIE/NativeCoroutines into SwiftUI. Manage lifecycle: cancel the VM's CoroutineScope on iOS view-disappear (no Android ViewModelStore). Moko-MVVM/Decompose help standardize this cross-platform.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why must UI stay native (SwiftUI) even when logic is shared?",
    a: [
      {
        t: "p",
        text: "In the *logic-sharing* KMP model, the shared module has *no UI* — each platform builds its own native UI (Compose on Android, SwiftUI on iOS) consuming the shared state/logic. This gives *fully native look, feel, and platform conventions* (navigation, gestures, accessibility) with no rendering compromise, while still guaranteeing consistent behavior via shared logic. (Compose Multiplatform can share UI too, but then iOS renders Compose, not SwiftUI.) So 'shared logic + native UI' deliberately keeps SwiftUI to preserve the best iOS UX.",
      },
      {
        t: "list",
        items: [
          "**Shared module** — no UI in the logic-sharing model.",
          "**Native UI** — Compose + SwiftUI per platform.",
          "**Benefit** — fully native UX + consistent shared behavior.",
          "**Alternative** — CMP shares UI (Compose, not SwiftUI).",
        ],
      },
      {
        t: "note",
        text: "In the logic-sharing model the shared module has no UI — each platform builds native UI (Compose/SwiftUI) over shared state/logic, giving fully native look/feel/conventions with consistent behavior. (Compose Multiplatform can share UI, but then iOS renders Compose, not SwiftUI.) 'Shared logic + native UI' keeps SwiftUI to preserve the best iOS UX.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you expose sealed classes to Swift usefully?",
    a: [
      {
        t: "p",
        text: "By default, a Kotlin *sealed class* crosses the bridge as a set of Obj-C classes *without exhaustiveness* — Swift can't `switch` over it with compiler-checked completeness (you'd use `if let ... as?` chains and a fallback). *SKIE* fixes this: it generates an *exhaustive Swift enum* for sealed classes/interfaces, so Swift gets a real `switch` with `case` per subtype and compile-time completeness. Without SKIE, expose a simpler API (e.g. an enum-like discriminator + accessors) to make consumption safe. Sealed-class ergonomics are a top reason teams adopt SKIE.",
      },
      {
        t: "list",
        items: [
          "**Default** — sealed loses Swift exhaustiveness (as? chains).",
          "**SKIE** — generates exhaustive Swift enums with switch.",
          "**Without SKIE** — expose a discriminator + accessors.",
          "**Key reason** — teams adopt SKIE for this.",
        ],
      },
      {
        t: "note",
        text: "By default a Kotlin sealed class crosses as Obj-C classes without exhaustiveness — Swift uses if-let-as? chains + fallback, no checked switch. SKIE generates an exhaustive Swift enum (real switch, compile-time completeness). Without SKIE, expose a simpler discriminator + accessors. Sealed-class ergonomics are a top reason to adopt SKIE.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle errors/exceptions across the Kotlin-Swift boundary?",
    a: [
      {
        t: "p",
        text: "Kotlin *unchecked exceptions* don't map to Swift's `throws` automatically — an uncaught Kotlin exception crossing the boundary *crashes* the app. To surface errors to Swift as `throws`, mark functions with *`@Throws`* (Kotlin) so they bridge to Swift error handling for the listed exception types. Better for domain errors: model them *in the return type* (a sealed `Result`/`Either`, or a state with an error field) so Swift handles them as *values*, not exceptions. Reserve `@Throws` for genuinely exceptional cases; prefer typed results across the boundary.",
      },
      {
        t: "list",
        items: [
          "**Unchecked exceptions** — crossing → crash.",
          "**`@Throws`** — bridge listed exceptions to Swift `throws`.",
          "**Prefer** — model errors as return values (Result/sealed).",
          "**Reserve** — `@Throws` for truly exceptional cases.",
        ],
      },
      {
        t: "note",
        text: "Kotlin unchecked exceptions don't map to Swift throws — an uncaught one crossing the boundary crashes. Mark functions @Throws to bridge listed exceptions to Swift error handling. Better: model domain errors in the return type (sealed Result/Either or an error state) so Swift handles them as values. Reserve @Throws for truly exceptional cases; prefer typed results.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is an XCFramework, and why use it?",
    a: [
      {
        t: "p",
        text: "An *XCFramework* is Apple's format bundling a framework's binaries for *multiple architectures/platforms* (device arm64, simulator arm64/x64) in one artifact — so a single XCFramework works for both real devices and the simulator. KMP can produce an XCFramework for the shared module, which you distribute (via SPM/CocoaPods or drop-in) to the iOS app. It's the modern way to ship a *prebuilt* shared binary (e.g. so iOS devs don't need the full Kotlin build), versus building the framework from source each time.",
      },
      {
        t: "list",
        items: [
          "**XCFramework** — multi-arch/platform framework bundle.",
          "**One artifact** — device + simulator.",
          "**KMP** — can produce it for the shared module.",
          "**Use** — ship a prebuilt binary (SPM/CocoaPods).",
        ],
      },
      {
        t: "note",
        text: "An XCFramework bundles a framework's binaries for multiple architectures/platforms (device + simulator) in one artifact. KMP can produce one for the shared module to distribute (SPM/CocoaPods/drop-in) to the iOS app — the modern way to ship a prebuilt shared binary (so iOS devs skip the full Kotlin build) instead of building from source each time.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you consume a Kotlin Flow from SwiftUI?",
    a: [
      {
        t: "p",
        text: "Raw, a `Flow` is hard to consume in Swift (no native collection of a suspend stream). With *SKIE*, a `Flow` becomes a Swift *async sequence* you can `for await` over (or an observable), and a `StateFlow` maps to something SwiftUI can bind. With *KMP-NativeCoroutines*, you get a Combine `Publisher` or async sequence. You then *collect* it in the SwiftUI view (e.g. in a `.task {}` or via an `@Observable`/`ObservableObject` wrapper) and update `@State`/`@Published` — always on the main thread. Cancel collection when the view disappears.",
      },
      {
        t: "list",
        items: [
          "**SKIE** — Flow → Swift async sequence (`for await`).",
          "**NativeCoroutines** — Flow → Combine Publisher/async.",
          "**Collect** — in `.task {}` / an observable wrapper.",
          "**Main thread + cancel** — on view disappear.",
        ],
      },
      {
        t: "note",
        text: "Consume a Flow in SwiftUI via SKIE (Flow → Swift async sequence, for await; StateFlow bindable) or KMP-NativeCoroutines (Combine Publisher/async sequence). Collect it in a .task {} or an @Observable/ObservableObject wrapper, updating @State/@Published on the main thread, and cancel collection when the view disappears.",
      },
    ],
  },
  {
    level: "senior",
    q: "What performance costs exist at the Kotlin-Swift interop boundary?",
    a: [
      {
        t: "p",
        text: "Crossing the Obj-C bridge isn't free: each *Swift↔Kotlin call* has overhead, and *object conversions* (Kotlin collections ↔ Swift Array/Dictionary, boxing primitives as `KotlinInt`) cost — so *chatty, fine-grained* interop (thousands of tiny calls, or converting huge collections repeatedly) can become a bottleneck. Mitigate with *coarse-grained* APIs (return a whole result object, not many getters), avoid unnecessary conversions, and don't put per-frame/hot-loop calls across the boundary. Execution *within* shared code is native-fast; the *boundary* is where you design carefully.",
      },
      {
        t: "list",
        items: [
          "**Per-call overhead** — each Swift↔Kotlin call.",
          "**Conversions** — collections/primitives cost.",
          "**Chatty interop** — many tiny calls = bottleneck.",
          "**Mitigate** — coarse APIs, fewer conversions, no hot-loop crossing.",
        ],
      },
      {
        t: "note",
        text: "The Obj-C boundary has costs: per-call overhead and object conversions (collections ↔ Array/Dictionary, boxing as KotlinInt). Chatty fine-grained interop (thousands of tiny calls, repeated huge-collection conversions) can bottleneck. Mitigate with coarse-grained APIs (return whole result objects), fewer conversions, no per-frame/hot-loop crossing. Shared execution is native-fast; design the boundary carefully.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do iOS developers debug shared Kotlin code?",
    a: [
      {
        t: "p",
        text: "Debugging spans two worlds: iOS devs debug Swift in *Xcode*, and can set breakpoints in the *shared Kotlin* (Kotlin/Native supports LLDB debugging, so you can step into Kotlin from Xcode with the right setup) — though the experience is less seamless than Android's. Kotlin devs debug shared logic in *Android Studio* (and via `commonTest`). Logging that surfaces on both platforms (a multiplatform logger like Napier/Kermit) helps. In practice, cover shared logic with *tests* (debuggable in AS) so you rarely need to step through Kotlin inside Xcode.",
      },
      {
        t: "list",
        items: [
          "**Xcode** — debug Swift; can breakpoint shared Kotlin (LLDB).",
          "**Android Studio** — debug shared logic + `commonTest`.",
          "**Logging** — multiplatform logger (Kermit/Napier).",
          "**Best** — cover shared logic with tests to avoid stepping.",
        ],
      },
      {
        t: "note",
        text: "iOS devs debug Swift in Xcode and can breakpoint shared Kotlin (Kotlin/Native LLDB support, less seamless than Android). Kotlin devs debug shared logic in Android Studio + commonTest. A multiplatform logger (Kermit/Napier) surfaces logs on both. Best practice: cover shared logic with tests (debuggable in AS) so you rarely step through Kotlin in Xcode.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you expose an enum or sealed hierarchy that Swift can switch on safely?",
    a: [
      {
        t: "p",
        text: "Kotlin `enum class`es map to Obj-C/Swift enums reasonably (Swift can switch, though not always exhaustively without help). For *sealed* hierarchies, use *SKIE* to get exhaustive Swift enums, or design the API so Swift can branch safely: expose a *discriminator property* (a Kotlin enum tag) plus typed accessors, so Swift switches on the tag. Avoid relying on Swift `as?` downcasts without a fallback (a new Kotlin subtype would silently fall through). The goal: Swift should handle *all* cases with compile-time confidence.",
      },
      {
        t: "list",
        items: [
          "**Enums** — map reasonably; Swift can switch.",
          "**Sealed** — SKIE for exhaustive Swift enums.",
          "**Or** — discriminator tag + typed accessors.",
          "**Avoid** — bare `as?` without a fallback.",
        ],
      },
      {
        t: "note",
        text: "Kotlin enum classes map to Swift enums (switchable). For sealed hierarchies, use SKIE for exhaustive Swift enums, or expose a discriminator (enum tag) + typed accessors so Swift switches safely. Avoid bare as? downcasts without a fallback (a new subtype silently falls through). Goal: Swift handles all cases with compile-time confidence.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the developer workflow for a KMP team with Android and iOS devs?",
    a: [
      {
        t: "p",
        text: "Typically: *Kotlin/Android devs* own the shared module (write logic in `commonMain`, test in `commonTest`, work in Android Studio). *iOS devs* consume the shared framework in Xcode and build SwiftUI, occasionally contributing to shared code. The shared module is a *contract* both sides depend on — changes to its API affect both apps, so coordinate (versioning, clear APIs, tests). CI builds the shared module, runs `commonTest`, and produces the iOS framework. Good communication around the shared API surface is key to smooth collaboration.",
      },
      {
        t: "list",
        items: [
          "**Kotlin devs** — own shared module (AS, commonTest).",
          "**iOS devs** — consume the framework, build SwiftUI.",
          "**Shared module** — a contract both depend on.",
          "**CI** — builds shared, runs tests, produces the framework.",
        ],
      },
      {
        t: "note",
        text: "Workflow: Kotlin/Android devs own the shared module (commonMain logic, commonTest, Android Studio); iOS devs consume the framework in Xcode and build SwiftUI, sometimes contributing to shared code. The shared module is a contract both apps depend on — coordinate API changes (versioning, tests). CI builds shared, runs commonTest, produces the iOS framework. Communication around the API surface is key.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you keep the shared API Swift-friendly by design?",
    a: [
      {
        t: "p",
        text: "Design the *public* shared API for the Obj-C bridge: prefer *simple, explicit signatures* (avoid heavy generics that lose type info), *don't rely on default arguments* (provide explicit overloads), model errors as *return values*, expose *coarse-grained* functions (fewer boundary calls), keep names clear (Obj-C mangling can produce ugly Swift), and use *SKIE* to restore Flow/sealed/async ergonomics. Treat the shared API like a *published SDK for Swift consumers* — internal Kotlin can be idiomatic, but the exposed surface should be pleasant and safe in Swift.",
      },
      {
        t: "list",
        items: [
          "**Simple signatures** — avoid type-losing generics.",
          "**Explicit overloads** — no reliance on default args.",
          "**Errors as values; coarse APIs** — fewer boundary calls.",
          "**SKIE** — restore Flow/sealed/async; treat as an SDK.",
        ],
      },
      {
        t: "note",
        text: "Design the public shared API for the Obj-C bridge: simple explicit signatures (avoid type-losing generics), explicit overloads (no default-arg reliance), errors as return values, coarse-grained functions (fewer boundary calls), clear names (avoid ugly mangling), and SKIE for Flow/sealed/async. Treat the exposed surface as a published SDK for Swift — internal Kotlin can be idiomatic, the API should be Swift-pleasant.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you manage dependency injection across the Kotlin-Swift boundary?",
    a: [
      {
        t: "p",
        text: "Use a *multiplatform DI* (Koin, or manual factory) in `commonMain` to wire shared dependencies. Expose a *single entry point* (e.g. a `KoinComponent`/factory object or a small facade) that iOS calls to obtain shared objects, rather than iOS constructing internal graph pieces. Platform-specific dependencies (an iOS keychain, a URL session) are provided via `expect`/`actual` or injected from the platform side into the shared graph at startup. Keep the graph *initialized once* (call an `initKoin()` from both apps' startup). Swift shouldn't manage Kotlin's internal DI — give it a clean facade.",
      },
      {
        t: "list",
        items: [
          "**Multiplatform DI** — Koin/manual in commonMain.",
          "**Single entry point** — facade for iOS to get shared objects.",
          "**Platform deps** — via expect/actual or injected at startup.",
          "**Init once** — `initKoin()` from both apps.",
        ],
      },
      {
        t: "note",
        text: "Use multiplatform DI (Koin/manual) in commonMain, exposing a single entry point/facade iOS calls to obtain shared objects (don't have iOS build internal graph pieces). Provide platform deps (keychain, URL session) via expect/actual or inject them into the shared graph at startup. Initialize once (initKoin() from both apps). Give Swift a clean facade, not Kotlin's internal DI.",
      },
    ],
  },
  {
    level: "junior",
    q: "Can iOS use Jetpack Compose through KMP?",
    a: [
      {
        t: "p",
        text: "Yes — via *Compose Multiplatform*, which now supports iOS (stable): you write *shared Compose UI* that renders on iOS (through Skia, in a `UIViewController` you embed in SwiftUI/UIKit). This shares the UI layer, not just logic. But it means iOS shows *Compose-rendered* UI, not native SwiftUI — a trade-off in native feel and access to the latest SwiftUI components. Teams use it when maximal UI sharing outweighs native-UI purity; others keep native SwiftUI and share only logic. So iOS *can* use Compose, but it's an explicit choice.",
      },
      {
        t: "list",
        items: [
          "**Compose Multiplatform** — shared Compose UI on iOS (stable).",
          "**Renders** — via Skia in a UIViewController.",
          "**Trade-off** — Compose UI, not native SwiftUI.",
          "**Choice** — max UI sharing vs native purity.",
        ],
      },
      {
        t: "note",
        text: "Yes — Compose Multiplatform supports iOS (stable): shared Compose UI renders on iOS via Skia (in a UIViewController embedded in SwiftUI/UIKit), sharing the UI layer. Trade-off: iOS shows Compose-rendered UI, not native SwiftUI (feel/latest-components). Use when maximal UI sharing outweighs native purity; otherwise keep SwiftUI and share only logic. Compose on iOS is an explicit choice.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle iOS-specific platform code within a KMP module?",
    a: [
      {
        t: "p",
        text: "Put it in `iosMain` (or a shared `appleMain`), where you *can call Apple platform APIs directly* — Kotlin/Native exposes *UIKit/Foundation* etc. via platform bindings (e.g. `platform.Foundation.NSDate`, `platform.UIKit`). Use `expect`/`actual` to give common code an implementation backed by these iOS APIs (e.g. `actual` reading the iOS keychain or `NSUserDefaults`). For C/Obj-C libraries without bindings, use *cinterop*. So iOS platform code lives in the iOS source set, calling Apple APIs, and satisfies `expect` declarations from common.",
      },
      {
        t: "list",
        items: [
          "**`iosMain`/`appleMain`** — call Apple APIs directly.",
          "**Bindings** — `platform.Foundation`/`platform.UIKit`.",
          "**`actual`** — iOS-backed impls (keychain, NSUserDefaults).",
          "**cinterop** — for unbound C/Obj-C libraries.",
        ],
      },
      {
        t: "note",
        text: "iOS-specific code goes in iosMain/appleMain, calling Apple APIs directly via Kotlin/Native bindings (platform.Foundation.NSDate, platform.UIKit). Use expect/actual so common declares and iosMain implements (keychain, NSUserDefaults). For unbound C/Obj-C libraries, use cinterop. iOS platform code lives in the iOS source set, calls Apple APIs, and satisfies common's expect declarations.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the main friction points of KMP iOS interop today?",
    a: [
      {
        t: "p",
        text: "Key frictions: *coroutines/Flows* aren't natively Swift-consumable (need SKIE/NativeCoroutines); *sealed classes* lose exhaustiveness; *generics* degrade across the bridge; *default arguments* and some Kotlin niceties don't survive; *debugging* shared code in Xcode is less smooth; the *two-IDE* workflow (Android Studio + Xcode); and *build/tooling* setup (framework export, CocoaPods) has a learning curve. Most are *mitigated* (SKIE, better tooling, the new memory model), and the trajectory is steadily improving — but they're the realistic rough edges to plan for.",
      },
      {
        t: "list",
        items: [
          "**Coroutines/Flows** — need SKIE/NativeCoroutines.",
          "**Sealed/generics/default args** — degrade across the bridge.",
          "**Debugging + two-IDE** — less smooth.",
          "**Mitigated** — SKIE, tooling, new memory model; improving.",
        ],
      },
      {
        t: "note",
        text: "KMP iOS interop frictions: coroutines/Flows not natively Swift-consumable (SKIE/NativeCoroutines), sealed classes lose exhaustiveness, generics degrade, default args/niceties don't survive, Xcode debugging of shared code is rough, the two-IDE workflow, and build/tooling setup. Most are mitigated (SKIE, tooling, new memory model) and steadily improving — realistic rough edges to plan for.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you version and distribute the shared framework to the iOS team?",
    a: [
      {
        t: "p",
        text: "Two models: *build from source* (the iOS build runs the Gradle framework task each time — always current, but iOS devs need the Kotlin toolchain and pay build time) or *distribute a prebuilt binary* (publish a versioned *XCFramework* via SPM/CocoaPods/a binary repo — iOS devs pull a release, faster, no Kotlin build, but you manage versioning/publishing). Larger teams often prefer prebuilt binaries with *semantic versions* and a *changelog*, treating the shared module like an internal SDK. Match the model to team size and how often the shared API changes.",
      },
      {
        t: "list",
        items: [
          "**Build from source** — always current; needs Kotlin toolchain.",
          "**Prebuilt binary** — versioned XCFramework via SPM/CocoaPods.",
          "**Prebuilt** — faster, no Kotlin build, manage versioning.",
          "**Larger teams** — semantic versions + changelog (like an SDK).",
        ],
      },
      {
        t: "note",
        text: "Distribute the shared framework by building from source (iOS build runs the Gradle task each time — current, but needs the Kotlin toolchain + build time) or a prebuilt binary (versioned XCFramework via SPM/CocoaPods/binary repo — faster, no Kotlin build, you manage versioning). Larger teams prefer prebuilt with semantic versions + changelog, treating shared as an internal SDK. Match to team size + API churn.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Skie's effect on the generated Swift API, concretely?",
    a: [
      {
        t: "p",
        text: "Concretely, SKIE transforms the auto-generated Swift API to feel *idiomatic*: Kotlin `suspend` functions become Swift `async` functions (awaitable, cancellable); `Flow`/`StateFlow` become Swift *async sequences* (and observable-friendly); *sealed classes/interfaces* become *exhaustive Swift enums* (real `switch`); and it improves *default-argument* handling and some type mappings. The net effect: iOS devs consume the shared module almost like a native Swift library, instead of wrestling with raw Obj-C-bridged signatures. It's a compiler plugin, so it works largely transparently.",
      },
      {
        t: "list",
        items: [
          "**suspend** → Swift `async` (awaitable, cancellable).",
          "**Flow** → Swift async sequence.",
          "**sealed** → exhaustive Swift enum.",
          "**Net** — consume shared like a native Swift library.",
        ],
      },
      {
        t: "note",
        text: "SKIE makes the generated Swift API idiomatic: suspend → Swift async (awaitable/cancellable), Flow/StateFlow → Swift async sequences (observable-friendly), sealed classes → exhaustive Swift enums (real switch), plus better default-arg/type handling. Net: iOS devs consume the shared module almost like a native Swift library, not raw Obj-C-bridged signatures. It's a transparent compiler plugin.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is CocoaPods integration in a KMP project?",
    a: [
      {
        t: "p",
        text: "The *Kotlin CocoaPods Gradle plugin* lets your shared module be consumed as a *CocoaPod* by the iOS app: you configure the `cocoapods { }` block (name, version, framework name), and Gradle generates a *podspec* so the iOS `Podfile` can depend on `pod 'shared'`. Running `pod install` wires the framework into Xcode, and the plugin rebuilds it as part of the iOS build. It's a popular integration path because it fits existing iOS dependency workflows and keeps the shared framework current. It also lets the shared module *depend on* other pods if needed.",
      },
      {
        t: "list",
        items: [
          "**CocoaPods plugin** — shared module as a pod.",
          "**`cocoapods { }`** — generates a podspec.",
          "**iOS Podfile** — `pod 'shared'`; `pod install` wires Xcode.",
          "**Popular** — fits existing iOS dependency workflows.",
        ],
      },
      {
        t: "note",
        text: "The Kotlin CocoaPods Gradle plugin makes the shared module a CocoaPod: configure cocoapods { } (name/version/framework), Gradle generates a podspec, the iOS Podfile does pod 'shared', pod install wires Xcode, and the plugin rebuilds the framework in the iOS build. Popular because it fits existing iOS dependency workflows and can let shared depend on other pods.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle cancellation of shared coroutines from Swift?",
    a: [
      {
        t: "p",
        text: "A Kotlin `suspend`/`Flow` launched for Swift must be *cancellable* so leaving a screen doesn't leak work. *SKIE* maps suspend to Swift `async` and Flow to async sequences that respect *Swift task cancellation* — cancelling the Swift `Task` cancels the underlying Kotlin coroutine. *KMP-NativeCoroutines* returns a cancellable handle/Combine cancellable you dispose. Without these, you'd manually expose a `Job`/`cancel()` for Swift to call on view disappear. The principle: tie the shared coroutine's lifecycle to the *SwiftUI view's lifecycle* (cancel on disappear) to avoid leaks — just like structured concurrency on Android.",
      },
      {
        t: "list",
        items: [
          "**Cancellable** — so leaving a screen doesn't leak.",
          "**SKIE** — Swift Task cancellation → cancels the coroutine.",
          "**NativeCoroutines** — cancellable handle/Combine cancellable.",
          "**Tie** — coroutine lifecycle to the SwiftUI view.",
        ],
      },
      {
        t: "note",
        text: "Make shared suspend/Flow cancellable so leaving a screen doesn't leak. SKIE ties Swift Task cancellation to the underlying Kotlin coroutine; KMP-NativeCoroutines returns a cancellable handle/Combine cancellable to dispose. Otherwise expose a Job/cancel() for Swift to call on disappear. Tie the coroutine lifecycle to the SwiftUI view's lifecycle — like structured concurrency on Android.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test the iOS integration of shared code?",
    a: [
      {
        t: "p",
        text: "Layered: cover shared *logic* with `commonTest` (runs on all targets, including the iOS/Native target — so it validates the code compiles and behaves on Native, not just JVM). Add *iosTest* for iOS-specific `actual`s. Then test the *integration* from the *Swift side* (XCTest calling the shared framework) to verify the *bridged API* works as expected (coroutines/Flows via SKIE, error mapping). Run the Native `commonTest` in CI to catch Native-only issues early (some code compiles on JVM but not Native). This catches interop regressions before iOS devs hit them.",
      },
      {
        t: "list",
        items: [
          "**`commonTest` on Native** — validates behavior + Native compilation.",
          "**`iosTest`** — iOS-specific `actual`s.",
          "**Swift XCTest** — the bridged API from the iOS side.",
          "**CI** — run Native tests to catch Native-only issues.",
        ],
      },
      {
        t: "note",
        text: "Test iOS integration in layers: commonTest (runs on the Native target too — validates behavior + that code compiles on Native), iosTest for iOS-specific actuals, and Swift XCTest calling the shared framework to verify the bridged API (SKIE Flows, error mapping). Run Native commonTest in CI (some code compiles on JVM but not Native) to catch interop regressions before iOS devs hit them.",
      },
    ],
  },
];

export default qa;
