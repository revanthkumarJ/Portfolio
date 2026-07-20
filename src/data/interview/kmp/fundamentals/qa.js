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
  {
    level: "junior",
    q: "What are Kotlin/JVM, Kotlin/Native, and Kotlin/JS?",
    a: [
      {
        t: "p",
        text: "These are Kotlin's *compiler backends/targets*. *Kotlin/JVM* compiles to JVM bytecode (Android, server). *Kotlin/Native* compiles to *native binaries* via LLVM (iOS, macOS, Linux, Windows) — no VM, produces a framework/executable. *Kotlin/JS* compiles to JavaScript (web). KMP works by compiling your *shared Kotlin* to each target with the appropriate backend — so `commonMain` code runs as JVM bytecode on Android and as a native framework on iOS. Understanding the backends explains why some platform APIs differ.",
      },
      {
        t: "list",
        items: [
          "**Kotlin/JVM** — bytecode (Android, server).",
          "**Kotlin/Native** — native binaries via LLVM (iOS, desktop).",
          "**Kotlin/JS** — JavaScript (web).",
          "**KMP** — compiles shared code to each target.",
        ],
      },
      {
        t: "note",
        text: "Kotlin's compiler backends: Kotlin/JVM (bytecode — Android/server), Kotlin/Native (native binaries via LLVM — iOS/desktop, no VM), Kotlin/JS (JavaScript — web). KMP compiles shared commonMain code to each target with the right backend (JVM bytecode on Android, a native framework on iOS). The backends explain platform API differences.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the source set hierarchy in a KMP module?",
    a: [
      {
        t: "p",
        text: "A KMP module organizes code into *source sets*: `commonMain` (shared, no platform APIs) and platform sets (`androidMain`, `iosMain`, `desktopMain`) that add platform-specific code and can use that platform's APIs. *Intermediate (hierarchical) source sets* (e.g. `appleMain` shared by `iosX64Main`/`iosArm64Main`, or a `nativeMain`) let you share code among *a subset* of targets. Each `*Main` has a matching `*Test`. Dependencies and `expect`/`actual` declarations flow down this hierarchy — common declares, platform sets implement.",
      },
      {
        t: "list",
        items: [
          "**`commonMain`** — shared, no platform APIs.",
          "**Platform sets** — `androidMain`/`iosMain`, platform APIs.",
          "**Intermediate sets** — share among a subset (e.g. `appleMain`).",
          "**`expect`/`actual`** — common declares, platform implements.",
        ],
      },
      {
        t: "note",
        text: "KMP source sets: commonMain (shared, no platform APIs) + platform sets (androidMain, iosMain) with platform code/APIs, plus intermediate/hierarchical sets (appleMain, nativeMain) to share among a subset of targets. Each *Main has a *Test. Dependencies and expect/actual flow down: common declares, platform sets implement.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does expect/actual work for functions, classes, and typealiases?",
    a: [
      {
        t: "p",
        text: "`expect` in `commonMain` declares an API *without implementation*; each platform provides the `actual`. For a *function*, common declares the signature, platforms implement it. For a *class*, common declares members (`expect class`), platforms provide `actual class` with real bodies. A powerful shortcut is *`actual typealias`*: map the expected class to an *existing platform type* (e.g. `actual typealias UUID = java.util.UUID` on JVM) — no re-implementation. Use expect/actual to abstract platform differences behind a common API.",
      },
      {
        t: "code",
        title: "expect/actual with typealias",
        code: `// commonMain\nexpect class Platform() { val name: String }\n// androidMain\nactual class Platform actual constructor() { actual val name = "Android \${Build.VERSION.SDK_INT}" }\n// or map to an existing type:\n// actual typealias UUID = java.util.UUID`,
      },
      {
        t: "note",
        text: "expect (in commonMain) declares an API without a body; each platform gives the actual. Functions: common declares, platforms implement. Classes: expect class + actual class with bodies. actual typealias maps the expected type to an existing platform type (actual typealias UUID = java.util.UUID) — no re-implementation. Abstract platform differences behind a common API.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between KMP and KMM?",
    a: [
      {
        t: "p",
        text: "*KMP (Kotlin Multiplatform)* is the general technology for sharing Kotlin across *any* targets (Android, iOS, desktop, web, server). *KMM (Kotlin Multiplatform Mobile)* was the earlier *branding* for the *mobile-focused* subset (Android + iOS). Google/JetBrains have largely consolidated on 'KMP' (and Compose Multiplatform) as the umbrella term; 'KMM' is now mostly historical. Functionally they're the same core tech — KMM was just KMP scoped to mobile. In interviews, use 'KMP' and mention KMM as the older name.",
      },
      {
        t: "list",
        items: [
          "**KMP** — general Kotlin sharing across any targets.",
          "**KMM** — older branding for the mobile (Android+iOS) subset.",
          "**Consolidated** — on 'KMP' now.",
          "**Same core tech** — KMM was KMP scoped to mobile.",
        ],
      },
      {
        t: "note",
        text: "KMP (Kotlin Multiplatform) is the general tech for sharing Kotlin across any targets (Android, iOS, desktop, web, server). KMM (Kotlin Multiplatform Mobile) was the older branding for the mobile-focused subset. The ecosystem consolidated on 'KMP'; KMM is now mostly historical. Same core tech — use 'KMP', mention KMM as the old name.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does the Kotlin/Native memory model work?",
    a: [
      {
        t: "p",
        text: "The *new* Kotlin/Native memory manager (default since Kotlin 1.7.20+) allows *sharing mutable state across threads* like the JVM (with a tracing GC), removing the old model's severe restrictions (the old one *froze* objects and forbade cross-thread mutation, which made coroutines painful). Now common concurrency (coroutines, shared state) 'just works' across platforms much more like Android. You rarely deal with `freeze()`/`@ThreadLocal` anymore. This change hugely improved the KMP developer experience, especially for coroutines/Flows shared with iOS.",
      },
      {
        t: "list",
        items: [
          "**New memory manager** — JVM-like, tracing GC (default 1.7.20+).",
          "**Shares mutable state** — across threads (no freezing).",
          "**Old model** — froze objects, forbade cross-thread mutation.",
          "**Result** — coroutines/shared state work smoothly.",
        ],
      },
      {
        t: "note",
        text: "The new Kotlin/Native memory manager (default since 1.7.20+) allows JVM-like sharing of mutable state across threads with a tracing GC — removing the old model's object freezing and cross-thread-mutation ban that made coroutines painful. Now coroutines/shared state 'just work' across platforms; you rarely touch freeze()/@ThreadLocal. A huge KMP DX improvement.",
      },
    ],
  },
  {
    level: "junior",
    q: "What targets can a KMP project produce?",
    a: [
      {
        t: "p",
        text: "KMP can target *Android* (JVM), *iOS* (arm64 device + x64/arm64 simulator, via Kotlin/Native frameworks), *desktop* (JVM — Windows/macOS/Linux), *web* (Kotlin/JS or the newer Wasm), *server* (JVM), *macOS/watchOS/tvOS*, and more. You declare targets in the Gradle KMP block; shared code compiles to each. Most mobile teams target Android + iOS (sharing logic), sometimes adding desktop/web with *Compose Multiplatform* for shared UI. The breadth means one Kotlin codebase can reach many platforms.",
      },
      {
        t: "list",
        items: [
          "**Mobile** — Android (JVM) + iOS (Native).",
          "**Desktop/server** — JVM.",
          "**Web** — Kotlin/JS or Wasm.",
          "**More** — macOS/watchOS/tvOS; declared in Gradle.",
        ],
      },
      {
        t: "note",
        text: "KMP targets Android (JVM), iOS (Native frameworks), desktop (JVM), web (Kotlin/JS or Wasm), server (JVM), and macOS/watchOS/tvOS. Declare targets in the Gradle KMP block; shared code compiles to each. Most teams target Android+iOS (shared logic), sometimes adding desktop/web with Compose Multiplatform for shared UI.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between sharing logic and sharing UI in KMP?",
    a: [
      {
        t: "p",
        text: "*Sharing logic* (the common, mature approach) puts business logic, networking, data, and ViewModels in `commonMain`, while *each platform keeps its native UI* (Jetpack Compose on Android, SwiftUI on iOS) — you get shared correctness with fully native UX. *Sharing UI* uses *Compose Multiplatform* to also share the *UI layer* across Android/iOS/desktop — more code shared, but the iOS UI is Compose-rendered (not native SwiftUI), a newer/less-battle-tested path. Many teams share logic first (lower risk) and consider shared UI selectively.",
      },
      {
        t: "table",
        headers: ["", "Share logic", "Share UI (CMP)"],
        rows: [
          ["UI", "Native per platform", "Compose everywhere"],
          ["Maturity", "Mature, low risk", "Newer"],
          ["Sharing", "Logic/data/VM", "+ UI layer"],
        ],
      },
      {
        t: "note",
        text: "Share logic (mature): business logic/networking/data/ViewModels in commonMain, native UI per platform (Compose + SwiftUI) — shared correctness, native UX. Share UI (Compose Multiplatform): also share the UI layer across platforms — more sharing but iOS renders Compose, not native SwiftUI (newer). Many teams share logic first (low risk), add shared UI selectively.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does iOS consume the shared KMP code?",
    a: [
      {
        t: "p",
        text: "The shared module compiles (via Kotlin/Native) into an *Objective-C-compatible framework* that the iOS app *imports and calls like any framework* — Swift code calls the Kotlin APIs (through the Obj-C bridge). You integrate it via *CocoaPods*, the *Swift Package Manager* export, or a direct framework, and (increasingly) with a *tool like SKIE/KMP-NativeCoroutines* to make coroutines/Flows and generics Swift-friendly. On Android it's just a regular Kotlin/JVM dependency. So Android consumes bytecode; iOS consumes a native framework.",
      },
      {
        t: "list",
        items: [
          "**iOS** — a native Obj-C-compatible framework (Kotlin/Native).",
          "**Swift calls** — Kotlin APIs via the Obj-C bridge.",
          "**Integrate** — CocoaPods/SPM/direct framework.",
          "**Android** — a regular Kotlin/JVM dependency.",
        ],
      },
      {
        t: "note",
        text: "The shared module compiles (Kotlin/Native) into an Obj-C-compatible framework the iOS app imports and calls like any framework (Swift → Kotlin via the Obj-C bridge), integrated via CocoaPods/SPM/direct framework (often with SKIE for Swift-friendly coroutines/Flows). Android consumes it as a regular Kotlin/JVM dependency. Android = bytecode; iOS = native framework.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you access platform-specific APIs from common code?",
    a: [
      {
        t: "p",
        text: "Three main patterns: (1) *`expect`/`actual`* — declare the API in common, implement per platform (good for small, well-defined platform gaps). (2) *Interface + platform implementation injected via DI* — define an interface in common, provide platform implementations and inject them (cleaner for larger abstractions, more testable). (3) *Multiplatform libraries* that already abstract the platform (Ktor for networking, SQLDelight for DB) — prefer these so you don't reinvent. Choose expect/actual for thin gaps, DI'd interfaces for substantial platform services.",
      },
      {
        t: "list",
        items: [
          "**expect/actual** — thin, well-defined platform gaps.",
          "**Interface + DI** — larger abstractions; more testable.",
          "**Multiplatform libs** — Ktor/SQLDelight abstract the platform.",
          "**Choose** — by the size of the platform surface.",
        ],
      },
      {
        t: "note",
        text: "Access platform APIs via: expect/actual (thin well-defined gaps), an interface in common with platform implementations injected via DI (larger abstractions, more testable), or multiplatform libraries that already abstract it (Ktor, SQLDelight — prefer these). Use expect/actual for small gaps, DI'd interfaces for substantial platform services.",
      },
    ],
  },
  {
    level: "junior",
    q: "How mature and stable is KMP today?",
    a: [
      {
        t: "p",
        text: "Kotlin Multiplatform reached *Stable* (production-ready) — JetBrains declared it stable, the new memory manager removed old pain, and major companies ship it. *Compose Multiplatform* is stable on Android/desktop and iOS support has matured (stable more recently). The *ecosystem* (Ktor, SQLDelight, Koin, kotlinx.serialization/coroutines/datetime) is solid for shared logic. Tooling (Android Studio + the KMP plugin, Xcode integration) keeps improving. It's a *safe choice* for sharing business logic; shared UI is viable but newer. Frame it as production-ready with an active, maturing ecosystem.",
      },
      {
        t: "list",
        items: [
          "**KMP** — Stable, production-ready; used by major companies.",
          "**Compose Multiplatform** — stable, iOS matured.",
          "**Ecosystem** — Ktor/SQLDelight/Koin/kotlinx solid.",
          "**Safe** — for shared logic; shared UI newer.",
        ],
      },
      {
        t: "note",
        text: "KMP is Stable (production-ready — JetBrains declared it stable, new memory manager removed old pain, major companies ship it). Compose Multiplatform is stable with matured iOS. The ecosystem (Ktor, SQLDelight, Koin, kotlinx) is solid for shared logic; tooling keeps improving. A safe choice for sharing business logic; shared UI is viable but newer.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you incrementally adopt KMP in an existing app?",
    a: [
      {
        t: "p",
        text: "Start *small and low-risk*: extract a *single, well-bounded piece of logic* (e.g. validation, a networking/data layer, or a feature's use-cases) into a shared KMP module, keep both apps' UI native, and verify the iOS integration works end-to-end. Then expand *feature by feature*. Wrap shared code behind clean interfaces so platform code depends on abstractions. Avoid a big-bang rewrite. This de-risks adoption: prove the toolchain/interop on one slice, build team confidence, then grow the shared surface where sharing pays off.",
      },
      {
        t: "list",
        items: [
          "**Start small** — one bounded piece (validation/data layer).",
          "**Keep UI native** — verify iOS integration end-to-end.",
          "**Expand** — feature by feature.",
          "**Avoid** — big-bang rewrite; grow where sharing pays.",
        ],
      },
      {
        t: "note",
        text: "Adopt KMP incrementally: extract one well-bounded piece of logic (validation, networking/data layer, a feature's use-cases) into a shared module, keep UI native, verify iOS integration end-to-end, then expand feature by feature behind clean interfaces. Avoid a big-bang rewrite — prove the toolchain/interop on one slice, build confidence, grow where sharing pays off.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is commonTest, and how do you test shared code?",
    a: [
      {
        t: "p",
        text: "`commonTest` holds tests for `commonMain` that run on *every target* — you write them once (using `kotlin.test`, `kotlinx-coroutines-test`, and multiplatform assertion/mocking libs) and they execute on JVM, Native, etc. This is a *big KMP benefit*: your shared business logic is tested once and validated across platforms. Platform-specific tests go in `androidTest`/`iosTest`. Prefer putting logic in common (with injected platform abstractions) so most of it is covered by fast, shared `commonTest` tests.",
      },
      {
        t: "list",
        items: [
          "**`commonTest`** — tests for common code, run on all targets.",
          "**Write once** — validated across platforms.",
          "**Tools** — `kotlin.test`, coroutines-test, MP mocking.",
          "**Benefit** — shared logic tested once, everywhere.",
        ],
      },
      {
        t: "note",
        text: "commonTest holds tests for commonMain that run on every target (kotlin.test, kotlinx-coroutines-test, MP mocking) — write once, validated across JVM/Native. A big KMP benefit: shared logic tested once, everywhere. Platform-specific tests go in androidTest/iosTest. Put logic in common (with injected platform abstractions) so most is covered by fast shared tests.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is cinterop, and when do you need it?",
    a: [
      {
        t: "p",
        text: "*cinterop* is Kotlin/Native's tool for *interoperating with C (and Objective-C) libraries* — it generates Kotlin bindings from C headers so your Native code can call platform C APIs or third-party C/Obj-C libraries. You need it when a shared module must use an *iOS/native C library* not already wrapped by a Kotlin API. For most app code you *don't* touch cinterop (multiplatform libraries cover networking/DB/etc.); it's for lower-level integration with native SDKs. It's powerful but adds build complexity — use it only when necessary.",
      },
      {
        t: "list",
        items: [
          "**cinterop** — generates Kotlin bindings from C/Obj-C headers.",
          "**Use** — call native C/Obj-C libraries from Kotlin/Native.",
          "**Most apps** — don't need it (MP libraries suffice).",
          "**Trade-off** — powerful but adds build complexity.",
        ],
      },
      {
        t: "note",
        text: "cinterop is Kotlin/Native's tool to interoperate with C/Obj-C libraries — generating Kotlin bindings from C headers so Native code calls platform/third-party C APIs. Needed when a shared module must use a native C/Obj-C library without a Kotlin wrapper. Most app code doesn't touch it (MP libraries cover the common cases); it adds build complexity — use only when necessary.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do coroutines work in shared KMP code?",
    a: [
      {
        t: "p",
        text: "`kotlinx.coroutines` is *multiplatform* — you use `suspend` functions, `Flow`, `CoroutineScope`, and dispatchers in `commonMain`, and they work on every target (thanks to the new Native memory model). On Android they run on the JVM; on iOS they run via Kotlin/Native. The main friction is *consuming* them from *Swift* (Swift can't await Kotlin coroutines natively) — solved with *SKIE* or *KMP-NativeCoroutines*, which expose suspend/Flow as Swift async/Combine. So coroutines are fully usable in shared code; only the Swift boundary needs a helper.",
      },
      {
        t: "list",
        items: [
          "**kotlinx.coroutines** — multiplatform; works on all targets.",
          "**commonMain** — `suspend`, `Flow`, scopes, dispatchers.",
          "**New memory model** — makes them smooth on Native.",
          "**Swift boundary** — SKIE/NativeCoroutines for async/Combine.",
        ],
      },
      {
        t: "note",
        text: "kotlinx.coroutines is multiplatform — suspend, Flow, scopes, dispatchers work in commonMain on every target (smooth thanks to the new Native memory model). Only friction: consuming them from Swift (can't await Kotlin coroutines natively) — solved by SKIE/KMP-NativeCoroutines exposing them as Swift async/Combine. Coroutines are fully usable in shared code; just the Swift boundary needs a helper.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between 'multiplatform' and 'cross-platform'?",
    a: [
      {
        t: "p",
        text: "*Cross-platform* frameworks (Flutter, React Native) typically ship *their own runtime/UI engine* and aim to write the *whole app once*, rendering a non-native UI (Flutter draws its own widgets; RN bridges to native views). *Multiplatform* (KMP) shares *Kotlin code* but *compiles to each platform natively* and (in the logic-sharing model) *keeps native UI* per platform — you share what makes sense and stay native where it matters. The philosophy differs: KMP is 'share code, stay native'; Flutter/RN is 'one UI everywhere'. This is why KMP integrates smoothly into existing native apps.",
      },
      {
        t: "list",
        items: [
          "**Cross-platform (Flutter/RN)** — own runtime/UI, whole app once.",
          "**Multiplatform (KMP)** — share Kotlin, compile natively.",
          "**KMP philosophy** — share code, stay native.",
          "**Integration** — KMP slots into existing native apps.",
        ],
      },
      {
        t: "note",
        text: "Cross-platform (Flutter/RN): own runtime/UI engine, write the whole app once, non-native rendering. Multiplatform (KMP): share Kotlin but compile natively per platform, keep native UI (logic-sharing model) — share what makes sense, stay native where it matters. KMP = 'share code, stay native'; Flutter/RN = 'one UI everywhere'. Why KMP integrates smoothly into existing native apps.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a shared module's output on each platform?",
    a: [
      {
        t: "p",
        text: "On *Android*, the shared module builds like a normal Kotlin/JVM library — an *AAR/JVM artifact* the app depends on directly. On *iOS*, it builds (via Kotlin/Native) into a *framework* (`.framework`, Obj-C-compatible) that the Xcode project links and Swift imports. So the *same shared source* produces a JVM dependency for Android and a native framework for iOS. The Gradle KMP plugin generates both from your one `commonMain` (plus platform sets). This dual output is the essence of 'write once, compile natively per platform'.",
      },
      {
        t: "list",
        items: [
          "**Android** — AAR/JVM artifact (direct dependency).",
          "**iOS** — a native `.framework` (Kotlin/Native).",
          "**Same source** — two native outputs.",
          "**Gradle KMP plugin** — generates both.",
        ],
      },
      {
        t: "note",
        text: "The shared module outputs an AAR/JVM artifact on Android (a direct dependency) and a native .framework (Obj-C-compatible) on iOS via Kotlin/Native (linked in Xcode, imported by Swift). Same commonMain source → two native outputs, both generated by the Gradle KMP plugin. This dual output embodies 'write once, compile natively per platform'.",
      },
    ],
  },
  {
    level: "senior",
    q: "What kinds of code should NOT go in commonMain?",
    a: [
      {
        t: "p",
        text: "Keep out of common: *platform UI* (Views/Compose Android-only, SwiftUI iOS-only — unless using Compose Multiplatform deliberately), *platform-only APIs* (Android `Context`, iOS `UIKit`) used directly, *JVM-only libraries* (Retrofit, Hilt, Room's Android artifact, `java.*`-dependent code), and anything inherently tied to one OS. Instead, abstract those behind `expect`/`actual` or interfaces and put *only portable logic* in common. If code can't compile on Kotlin/Native, it doesn't belong in `commonMain` — move it to the platform set.",
      },
      {
        t: "list",
        items: [
          "**Platform UI** — Views/Compose/SwiftUI (unless CMP).",
          "**Platform APIs** — Context/UIKit directly.",
          "**JVM-only libs** — Retrofit/Hilt/Room/`java.*`.",
          "**Rule** — if it can't compile on Native, not in common.",
        ],
      },
      {
        t: "note",
        text: "Don't put in commonMain: platform UI (Views/Compose/SwiftUI unless CMP), platform-only APIs used directly (Context, UIKit), JVM-only libraries (Retrofit, Hilt, Room-Android, java.*-dependent code), and OS-tied code. Abstract those behind expect/actual or interfaces; keep only portable logic in common. If it can't compile on Kotlin/Native, it belongs in a platform set.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Compose Multiplatform's relationship to KMP?",
    a: [
      {
        t: "p",
        text: "*Compose Multiplatform (CMP)* is a UI framework *built on KMP* that lets you write *shared UI* in Jetpack Compose that runs on Android, desktop, iOS, and web — extending code sharing from logic to the *UI layer*. KMP is the foundation (shared Kotlin, targets); CMP is one thing you can build *with* it. You can use KMP *without* CMP (share logic, native UI) or *with* it (share UI too). On iOS, CMP renders Compose (via Skia), not native SwiftUI. So: KMP = share code; CMP = share Compose UI on top of KMP.",
      },
      {
        t: "list",
        items: [
          "**CMP** — shared Compose UI, built on KMP.",
          "**Extends sharing** — logic → UI layer.",
          "**Optional** — use KMP with or without CMP.",
          "**iOS** — renders Compose (Skia), not SwiftUI.",
        ],
      },
      {
        t: "note",
        text: "Compose Multiplatform (CMP) is a UI framework built on KMP for shared Compose UI across Android/desktop/iOS/web — extending sharing from logic to UI. KMP is the foundation; CMP is optional on top (use KMP with native UI, or with CMP for shared UI). On iOS, CMP renders Compose via Skia, not native SwiftUI. KMP = share code; CMP = share Compose UI.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle platform differences like dates, files, and threading?",
    a: [
      {
        t: "p",
        text: "Use *multiplatform libraries* where they exist: `kotlinx-datetime` for dates/times, `okio`/multiplatform APIs for files, `kotlinx.coroutines` (with `Dispatchers`) for threading. For gaps, wrap the platform behind `expect`/`actual` or an injected interface (e.g. an `expect fun currentTimeMillis()` or a `PlatformFileStorage` interface). Avoid `java.time`/`java.io` in common (JVM-only). The rule: reach for a multiplatform library first, abstract the rest behind a common API, and keep the platform specifics thin and in platform source sets.",
      },
      {
        t: "list",
        items: [
          "**Dates** — `kotlinx-datetime`.",
          "**Files** — okio / multiplatform APIs.",
          "**Threading** — coroutines/dispatchers.",
          "**Gaps** — expect/actual or injected interfaces; avoid `java.*`.",
        ],
      },
      {
        t: "note",
        text: "Handle platform differences with multiplatform libraries: kotlinx-datetime (dates), okio/MP APIs (files), kotlinx.coroutines + Dispatchers (threading). For gaps, wrap the platform behind expect/actual or an injected interface. Avoid java.time/java.io in common (JVM-only). Reach for an MP library first, abstract the rest behind a common API, keep specifics thin in platform sets.",
      },
    ],
  },
  {
    level: "junior",
    q: "What tooling and IDEs do you use for KMP development?",
    a: [
      {
        t: "p",
        text: "*Android Studio* (or IntelliJ) with the *Kotlin Multiplatform plugin* is the primary IDE for shared/Kotlin code and Android; you use *Xcode* for the iOS app (and to build/run on iOS, since it needs the Apple toolchain). Gradle drives the build; the KMP Gradle plugin manages targets and framework export. JetBrains' *Kotlin Multiplatform* wizard/plugin scaffolds projects. The DX is 'Kotlin in Android Studio, iOS app in Xcode, shared module bridging both' — improving steadily but still a two-IDE workflow for full-stack mobile.",
      },
      {
        t: "list",
        items: [
          "**Android Studio + KMP plugin** — shared Kotlin + Android.",
          "**Xcode** — the iOS app + Apple toolchain.",
          "**Gradle** — build + framework export.",
          "**Workflow** — two IDEs bridged by the shared module.",
        ],
      },
      {
        t: "note",
        text: "KMP tooling: Android Studio/IntelliJ + the Kotlin Multiplatform plugin for shared Kotlin and Android; Xcode for the iOS app (needs the Apple toolchain). Gradle + the KMP plugin manage targets and framework export; a JetBrains wizard scaffolds projects. DX is 'Kotlin in Android Studio, iOS in Xcode, shared module bridging both' — improving but still a two-IDE workflow.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the performance characteristics of shared KMP code?",
    a: [
      {
        t: "p",
        text: "Shared code compiles to *native* on each platform (JVM bytecode on Android, LLVM-compiled Native on iOS) — so it runs at *near-native speed*, not through an interpreter/bridge like some cross-platform frameworks. On Android it's identical to normal Kotlin. On iOS, Kotlin/Native performance is generally good; the *Obj-C interop bridge* adds some overhead at the *boundary* (frequent fine-grained Swift↔Kotlin calls or large object conversions can cost), so design *coarse-grained* APIs across the boundary. Binary size adds the Kotlin/Native runtime. Overall: native execution, mind the interop boundary.",
      },
      {
        t: "list",
        items: [
          "**Compiles native** — JVM + LLVM Native; near-native speed.",
          "**Android** — identical to normal Kotlin.",
          "**iOS boundary** — Obj-C bridge overhead; design coarse APIs.",
          "**Size** — adds the Native runtime.",
        ],
      },
      {
        t: "note",
        text: "Shared code compiles native (JVM bytecode on Android, LLVM Native on iOS) — near-native speed, no interpreter/bridge for execution. Android = identical to normal Kotlin. iOS: good Native perf, but the Obj-C interop bridge adds boundary overhead (frequent fine-grained Swift↔Kotlin calls/large conversions cost) — design coarse-grained APIs. Binary adds the Native runtime.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the role of Gradle in a KMP project?",
    a: [
      {
        t: "p",
        text: "Gradle (with the *Kotlin Multiplatform plugin*) is the *build system* that ties everything together: it declares *targets* (android, iosArm64, etc.), defines *source sets* and their *dependencies* (common vs platform), compiles shared code to each target, and *exports the iOS framework* (via CocoaPods plugin or direct framework tasks). You configure it in the module's `build.gradle.kts` `kotlin { }` block. Gradle also handles versioning of multiplatform dependencies. It's the single place that orchestrates producing both the Android artifact and the iOS framework.",
      },
      {
        t: "list",
        items: [
          "**KMP plugin** — declares targets + source sets.",
          "**Dependencies** — per source set (common/platform).",
          "**Compiles** — shared code to each target.",
          "**Exports** — the iOS framework (CocoaPods/direct).",
        ],
      },
      {
        t: "note",
        text: "Gradle + the Kotlin Multiplatform plugin is the build system: declares targets (android, iosArm64…), defines source sets and their dependencies (common vs platform), compiles shared code to each target, and exports the iOS framework (CocoaPods plugin/direct tasks) — configured in the kotlin { } block. It orchestrates producing both the Android artifact and the iOS framework.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a typical KMP project module structure?",
    a: [
      {
        t: "p",
        text: "A common layout: a *`shared` (or `:core`) KMP module* with `commonMain` (business logic, data, ViewModels, networking) plus `androidMain`/`iosMain` for platform bits; an *`androidApp`* module (the Android app, native Compose UI depending on `shared`); and an *`iosApp`* (an Xcode project consuming the shared framework). Larger apps split `shared` into *feature/layer modules* (e.g. `:network`, `:database`, `:feature-auth`) each multiplatform. The principle: shared Kotlin modules for logic, thin platform app modules for UI/entry points.",
      },
      {
        t: "list",
        items: [
          "**`shared` module** — commonMain + platform sets.",
          "**`androidApp`** — native UI depending on shared.",
          "**`iosApp`** — Xcode project consuming the framework.",
          "**Scale** — split shared into feature/layer modules.",
        ],
      },
      {
        t: "note",
        text: "Typical KMP structure: a shared/core KMP module (commonMain logic/data/VM + androidMain/iosMain), an androidApp module (native Compose UI depending on shared), and an iosApp (Xcode consuming the shared framework). Larger apps split shared into multiplatform feature/layer modules (:network, :database, :feature-auth). Shared Kotlin for logic, thin platform app modules for UI.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between an expect class and an interface with platform implementations?",
    a: [
      {
        t: "p",
        text: "Both abstract platform differences, but differ in *binding*. `expect class` is *compile-time*: the common declaration is resolved to *the* platform `actual` at build time (one implementation per platform, chosen by the compiler) — good for a single, well-defined platform primitive. An *interface* is *runtime*: you can have *multiple implementations*, *inject* them (via DI), and *swap a fake* in tests — better for testability and larger services. Rule of thumb: `expect/actual` for thin, singular platform gaps; interfaces + DI for anything you'll want to mock or vary.",
      },
      {
        t: "table",
        headers: ["", "expect class", "Interface + DI"],
        rows: [
          ["Binding", "Compile-time", "Runtime"],
          ["Implementations", "One per platform", "Multiple, swappable"],
          ["Testability", "Harder to fake", "Easy to fake"],
          ["Best for", "Thin platform primitive", "Larger service, mockable"],
        ],
      },
      {
        t: "note",
        text: "expect class binds at compile-time to one actual per platform (good for a singular platform primitive). An interface binds at runtime — multiple implementations, injectable via DI, fakeable in tests (better for testability/larger services). Rule: expect/actual for thin singular gaps; interfaces + DI for anything you'll mock or vary.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you decide between native, KMP, and Flutter/RN for a new app?",
    a: [
      {
        t: "p",
        text: "Weigh *team skills, UX bar, code-reuse goals, and risk*. *Fully native* (separate Android/iOS): best UX/platform fit, most duplicated effort — good when platforms diverge or teams are siloed. *KMP*: share *logic* (and optionally UI), keep native UX, integrates into existing native apps, low risk for the logic layer — great when you value native UI but want one source of truth for business logic. *Flutter/RN*: fastest to one UI everywhere, non-native rendering, own ecosystem — good for UI-uniform apps or non-Kotlin teams. Choose by how much you value native UX vs maximal sharing.",
      },
      {
        t: "list",
        items: [
          "**Native** — best UX, most duplication.",
          "**KMP** — share logic, native UX, low-risk, native-integration.",
          "**Flutter/RN** — one UI fast, non-native rendering.",
          "**Decide** — native UX value vs maximal sharing + team skills.",
        ],
      },
      {
        t: "note",
        text: "Choose by team skills, UX bar, reuse goals, risk. Native: best UX, most duplication (diverging platforms/siloed teams). KMP: share logic (± UI), keep native UX, integrates into native apps, low-risk logic layer (value native UI + one logic source). Flutter/RN: fastest one-UI-everywhere, non-native rendering (UI-uniform apps/non-Kotlin teams). Trade native UX vs maximal sharing.",
      },
    ],
  },
];

export default qa;
