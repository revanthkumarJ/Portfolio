// KMP Fundamentals — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is Kotlin Multiplatform and how is it different from Flutter or React Native?",
    a: [
      {
        t: "p",
        text: "**Kotlin Multiplatform (KMP) lets you write code once in Kotlin and run it on multiple platforms — Android, iOS, desktop, web. The defining characteristic is that it shares *logic*, not necessarily UI: you write business logic, data, networking, and domain models once in shared Kotlin, while each platform keeps its own *native* UI.** This is fundamentally different from Flutter and React Native, which typically abstract the UI too.",
      },
      {
        t: "list",
        items: [
          "**KMP — shares logic, keeps native UI**: your shared Kotlin code is the 'brain' (repositories, use cases, models), and the iOS app is a *real* iOS app with SwiftUI (or the Android app with Compose). Each app is natively performant and platform-idiomatic; only the logic is shared.",
          "**Flutter — shares everything including UI**: Flutter draws its *own* UI with its own rendering engine (not native components), using one Dart codebase for both logic and UI. The apps look/behave identically but aren't using native UI toolkits.",
          "**React Native — shares logic + a UI abstraction**: JavaScript logic plus a bridge to native components, with a shared UI layer.",
        ],
      },
      {
        t: "p",
        text: "So the philosophy differs: Flutter/RN aim for 'write once, run anywhere' *including UI* (maximizing code sharing, accepting a non-native UI layer), while KMP aims for 'write the *logic* once, build *native* UIs' (sharing the risky/complex business logic while keeping each UI natively excellent). KMP's bet is that the *logic* is where duplication hurts most (and where bugs diverge between platforms), while the UI benefits from being native. It compiles via JVM bytecode for Android, Kotlin/Native (LLVM) for iOS, and JS/Wasm for web. For an Android engineer, KMP is especially appealing because it's *Kotlin* — you already know the language, and you can incrementally share logic without rewriting UIs. It reached Stable in 2023 and is used in production by major companies.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is commonMain and what can you put in it?",
    a: [
      {
        t: "p",
        text: "**`commonMain` is the shared source set in a KMP module — the code here compiles for *all* target platforms, so it's where your shared logic lives (repositories, use cases, domain models, networking, ViewModels). The constraint is that it can only use *multiplatform* code: Kotlin's common standard library and multiplatform libraries — no platform-specific APIs.**",
      },
      {
        t: "list",
        items: [
          "**What goes in it**: business logic, domain models, repository implementations, networking (via Ktor), serialization (kotlinx.serialization), coroutines/Flow-based logic, ViewModels (with the multiplatform lifecycle library) — the platform-agnostic core of your app.",
          "**What you *cannot* use**: `android.*` APIs, iOS `Foundation`/`UIKit`, or anything specific to one platform. The compiler enforces this — `commonMain` only sees multiplatform declarations. So you can't call `Context`, `Log`, `UIDevice`, etc. directly here.",
          "**When shared code needs a platform API**: you bridge to it via `expect/actual` (declare the need in commonMain, implement per platform) or an interface injected from platform code.",
        ],
      },
      {
        t: "p",
        text: "`commonMain` is the heart of KMP — the more you can put here, the more you share. The discipline is to keep it *platform-agnostic*: write logic against multiplatform libraries and abstractions, and push anything platform-specific down to the platform source sets (`androidMain`, `iosMain`) via `expect/actual` or DI. This is also why KMP rewards clean architecture — a framework-free domain/data layer (no Android imports) drops straight into `commonMain` unchanged, while logic tangled with `android.*` can't be shared. The compiler enforcing 'commonMain sees only multiplatform code' is what guarantees the shared code genuinely runs everywhere.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is expect/actual in KMP?",
    a: [
      {
        t: "p",
        text: "**`expect`/`actual` is KMP's mechanism for handling things that must be *implemented differently on each platform*. In `commonMain` you declare an `expect` (a promise that something exists — 'each platform provides this'), and each platform's source set provides the `actual` implementation using that platform's native APIs. The compiler requires every platform to supply an `actual` for every `expect`.**",
      },
      {
        t: "code",
        title: "Platform-specific implementation via expect/actual",
        code: `// commonMain
expect fun platformName(): String

// androidMain
actual fun platformName(): String = "Android \${Build.VERSION.SDK_INT}"

// iosMain
actual fun platformName(): String = UIDevice.currentDevice.systemName`,
      },
      {
        t: "list",
        items: [
          "**`expect`** (commonMain) — declares *what* the shared code needs, without the *how*. Shared code uses it like a normal function/class/property. The shared logic stays platform-agnostic while relying on it.",
          "**`actual`** (each platform source set) — provides the *how* for that platform, free to use native APIs (`Build.VERSION` on Android, `UIDevice` on iOS). Every target must provide one, so there's never a missing implementation.",
          "**Common uses**: database drivers (SQLDelight/Room need a platform driver), secure storage (Android Keystore vs iOS Keychain), platform/device info, date/locale formatting, UUID/random generation — the thin platform-specific layer beneath shared logic.",
        ],
      },
      {
        t: "p",
        text: "It's the bridge that lets shared code depend on platform-specific behavior without knowing the platform. An alternative many teams prefer for most cases is defining an *interface* in commonMain and *injecting* a platform implementation via DI — that's more testable (you can inject a fake) and flexible than `expect/actual` (which allows exactly one implementation per platform and is harder to mock). So a common pattern is: interfaces + DI for most platform dependencies (testable), and `expect/actual` for simple platform primitives. Either way, the goal is the same — keep the shared logic in commonMain and fill in platform-specific pieces per target.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you decide what code to share in commonMain versus keep platform-specific?",
    a: [
      {
        t: "p",
        text: "**The principle is to share everything that's *platform-agnostic logic* (the more the better — that's the value of KMP) and keep platform-specific only what genuinely *requires* a platform's APIs or is inherently native (UI, platform integrations). The decision is driven by *whether the code needs platform APIs* and *whether sharing it reduces meaningful duplication/divergence risk*.**",
      },
      {
        t: "list",
        items: [
          "**Share (put in commonMain)**: business logic and rules, domain models, use cases, repository implementations, networking (Ktor), serialization (kotlinx.serialization), data mapping, validation, caching logic, ViewModels/presentation logic (with multiplatform lifecycle), and anything expressible in pure Kotlin against multiplatform libraries. This is the *bulk* of an app's non-UI code, and it's exactly where you *want* one source of truth — the business logic shouldn't diverge between iOS and Android, and sharing it eliminates the double-implementation bugs.",
          "**Keep platform-specific**: the UI (native SwiftUI/UIKit on iOS, Compose on Android — unless using Compose Multiplatform), platform integrations (permissions, notifications, camera, biometrics, deep links — each platform's APIs differ), and the *thin* platform primitives beneath shared logic (database driver, secure storage, file paths, platform info) — accessed from shared code via `expect/actual` or injected interfaces.",
          "**The gray area — presentation logic**: ViewModels can be shared (KMP's ViewModel is multiplatform since lifecycle 2.8), which is valuable (share state management), but the *observation* mechanism differs per platform (Compose collects StateFlow directly; SwiftUI needs a bridge). So you often share the ViewModel logic but have a thin per-platform adapter for UI binding.",
        ],
      },
      {
        t: "list",
        items: [
          "**The architectural leverage**: clean architecture makes this decision natural — a *framework-free domain and data layer* (no Android/iOS imports, dependencies inverted through interfaces) drops straight into commonMain. So the same discipline that makes code testable (separate logic from framework, inject dependencies) is what makes it *shareable*. Code that's tangled with `android.*` can't be shared; well-layered code can. This is a strong practical argument for clean architecture in KMP projects.",
          "**Incremental adoption**: you don't have to share everything at once. A common path is to start by sharing a *slice* — the networking + data layer, or one feature's logic — and expand. This lets teams adopt KMP with low risk, sharing the high-value logic first while keeping UIs native.",
          "**Don't force-share the un-shareable**: fighting to share something inherently platform-specific (UI, a platform-only capability) via awkward abstractions is counterproductive — the goal is to share what *benefits* from being shared (logic that would otherwise be duplicated and diverge), not to maximize the shared-line count for its own sake.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the share-vs-platform decision is fundamentally 'share the logic, keep the platform-native' — put the *platform-agnostic business logic* (the risky, complex, duplication-prone core) in commonMain where it becomes a single source of truth across platforms, and keep *genuinely platform-specific* code (UI, platform integrations, and the thin native primitives beneath shared logic via `expect/actual`/DI) per-platform. The enabling insight is that *clean architecture and testable design are the same thing as shareable design* — framework-free, dependency-injected layers move to commonMain for free, so the effort you spend on good architecture pays off doubly in KMP. And the pragmatic wisdom is to share *incrementally* (start with a high-value slice, expand) and to *not force-share* the inherently native — the metric is 'does sharing this reduce meaningful duplication/divergence?', not raw code-sharing percentage. Demonstrating the logic-vs-native principle, the architecture-enables-sharing insight, the presentation-layer nuance, and incremental/pragmatic adoption is the comprehensive senior answer — and it's exactly what an interviewer for an Android/KMP role wants to hear.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the tradeoffs of adopting KMP, and when would you (not) use it?",
    a: [
      {
        t: "p",
        text: "**KMP's core tradeoff is *shared logic and reduced duplication* versus *added build/tooling complexity and an evolving ecosystem, particularly on iOS*. I'd adopt it when the app has substantial non-UI logic worth sharing across Android and iOS and the team has (or can build) the Kotlin/KMP expertise; I'd be cautious for UI-heavy apps with little shared logic, single-platform apps, or teams without iOS/Kotlin cross-competence.**",
      },
      {
        t: "list",
        items: [
          "**Benefit — single source of truth for logic**: the business logic, data layer, and models are written once, so they *can't diverge* between platforms — a bug fixed once is fixed everywhere, and behavior is guaranteed consistent. This is the biggest win: eliminating the double-implementation-and-drift problem for the app's complex core.",
          "**Benefit — native UIs preserved**: unlike Flutter/RN, each app stays natively excellent (SwiftUI/Compose), so you don't sacrifice platform feel, performance, or access to the latest native UI features. You share what benefits from sharing (logic) and keep native what benefits from being native (UI).",
          "**Benefit — leverage existing Kotlin skills**: for an Android team, KMP is *Kotlin* — the same language, coroutines, Flow — so the learning curve is far gentler than adopting Dart (Flutter) or a JS stack (RN), and you can share code with the *existing* Android codebase incrementally.",
        ],
      },
      {
        t: "list",
        items: [
          "**Cost — build/tooling complexity**: KMP adds Gradle multiplatform configuration, source-set management, and a more complex build. The iOS integration (Kotlin/Native compiling to a framework/XCFramework, consumed by Xcode) adds friction — slower Kotlin/Native compile times, and the iOS build setup is more involved than a pure-Swift project.",
          "**Cost — iOS interop friction**: the Kotlin→Swift boundary has rough edges — coroutines/Flow don't map natively to Swift (you need SKIE or wrappers), Kotlin generics and sealed classes translate imperfectly to Obj-C, and Swift developers consuming the shared code face a somewhat un-idiomatic API. Tooling (SKIE) has improved this a lot, but it's still a real consideration.",
          "**Cost — evolving ecosystem**: while the core is stable, the ecosystem (especially some libraries and Compose Multiplatform for iOS) is younger than pure-native. Fewer battle-tested libraries exist for every need in common code, though the essential ones (Ktor, kotlinx.serialization, SQLDelight, coroutines, Koin) are solid.",
          "**Cost — team dynamics**: it works best when the team has *both* Android/Kotlin and iOS competence (someone must own the iOS integration and Swift consumption). A pure-Android team adopting KMP still needs iOS knowledge to ship the iOS app well.",
        ],
      },
      {
        t: "list",
        items: [
          "**When to use it**: apps with *substantial shared logic* across Android and iOS (complex business rules, significant data/networking/domain layers) where duplication and divergence are real pain; teams wanting to leverage Kotlin skills; and organizations that value *native UIs* (so Flutter/RN's non-native UI is a dealbreaker) but want logic sharing. It's ideal for logic-heavy, multi-platform apps where consistency of the core matters.",
          "**When to be cautious / not use it**: *single-platform* apps (no sharing benefit — just added complexity); *UI-heavy apps with thin logic* (little to share — the shared layer would be small relative to the complexity added); teams *without* iOS or KMP expertise and no capacity to build it; and cases where a fully-shared-UI approach (Flutter/RN) genuinely fits better (rapid prototyping where native feel matters less, or teams standardized on Dart/JS).",
          "**Incremental adoption reduces risk**: because KMP shares *logic* and integrates with existing native apps, you can adopt it *gradually* — share one feature or the data layer first, prove the value, and expand. This de-risks the decision versus an all-or-nothing rewrite, and is a strong point in KMP's favor for existing apps.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the KMP decision is a *shared-logic-value vs added-complexity* tradeoff, and the answer is contextual, not dogmatic. KMP shines when there's *substantial, complex, duplication-prone logic* to share across Android and iOS, the team values *native UIs* (ruling out Flutter/RN's shared-UI model), and Kotlin expertise exists — then the single-source-of-truth-for-logic benefit outweighs the build/interop/ecosystem costs. It's a poor fit for single-platform apps, UI-heavy/logic-thin apps, or teams lacking cross-platform competence. The key *risk mitigator* is incremental adoption — KMP's logic-sharing, native-UI-preserving design lets you start small (share the data layer or one feature) and expand, so you can validate the value with low commitment. And the honest acknowledgment of costs — iOS interop friction (coroutines/Flow bridging, Obj-C translation, though SKIE helps), build complexity, and a younger ecosystem — is what distinguishes a mature assessment from KMP boosterism. Demonstrating the contextual, tradeoff-driven decision (with specific benefits *and* costs), the incremental-adoption de-risking, and the honest iOS-friction acknowledgment is the comprehensive senior answer — especially valuable for an Android/KMP engineer expected to advocate for KMP *credibly*, not blindly.",
      },
    ],
  },
];

export default qa;
