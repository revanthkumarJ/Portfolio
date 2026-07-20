// KMP Common Libraries & Compose Multiplatform — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What libraries do you use for networking, serialization, and DI in shared KMP code?",
    a: [
      {
        t: "p",
        text: "**In shared `commonMain` code you must use *multiplatform* libraries, so the Android-only defaults are replaced with multiplatform equivalents: Ktor (networking) instead of Retrofit, kotlinx.serialization (JSON) instead of Gson/Moshi, and Koin (DI) instead of Hilt.** These substitutions are a common KMP interview point.",
      },
      {
        t: "list",
        items: [
          "**Networking — Ktor Client** (replaces Retrofit): a multiplatform, coroutine-native HTTP client with pluggable engines per platform (OkHttp on Android, Darwin on iOS). Retrofit is JVM/Android-only, so it can't go in commonMain.",
          "**Serialization — kotlinx.serialization** (replaces Gson/Moshi): compile-time and reflection-free, so it works on Kotlin/Native (iOS). Gson and Moshi use reflection and are JVM-only, so they don't work in shared code.",
          "**DI — Koin** (replaces Hilt): a multiplatform runtime DI library, so the DI graph lives in commonMain and starts per platform. Hilt is Android-only (compile-time codegen, JVM). Some teams use manual DI in shared code instead.",
        ],
      },
      {
        t: "p",
        text: "The reason for these substitutions is that shared code compiles for *all* targets including Kotlin/Native (iOS), so it can only use libraries that provide implementations for every target. The JVM-only libraries (Retrofit, Gson, Moshi, Hilt) rely on JVM features (reflection, JVM bytecode) that don't exist on Kotlin/Native. The good news is the multiplatform equivalents are mature — Ktor, kotlinx.serialization, and Koin are production-ready — plus coroutines/Flow, SQLDelight (database), and the multiplatform androidx ViewModel. Together they let you build a complete data/domain/presentation layer entirely in commonMain.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Compose Multiplatform and how does it relate to KMP?",
    a: [
      {
        t: "p",
        text: "**Compose Multiplatform (CMP) extends Jetpack Compose to run on other platforms — Android, iOS, desktop, and web — so you can write your UI *once* in Compose and share it across platforms. It's a UI framework *built on* KMP.** This goes beyond KMP's default 'share logic, keep native UI' by letting you share the *UI too*.",
      },
      {
        t: "list",
        items: [
          "**The relationship**: KMP shares *logic* (and by default each platform keeps its native UI — SwiftUI on iOS, Compose on Android). CMP is a layer that lets you *also* share the Compose UI, so even iOS runs your Compose code — moving KMP closer to the Flutter/RN 'one UI codebase' model, but using Compose (which Android developers already know) instead of Dart/JS.",
          "**How the iOS UI renders**: CMP renders the Compose UI via Skia (a graphics engine), *not* native UIKit/SwiftUI components. So the UI is Compose-drawn, similar to how Flutter draws its own UI.",
          "**Maturity**: CMP is stable on Android (it's just Compose) and desktop; iOS reached stable in 2025 (production-ready but younger); web (Wasm) is still maturing.",
        ],
      },
      {
        t: "p",
        text: "The key thing CMP gives you is a *choice on the sharing spectrum*: you can share *only logic* (native UIs — the conservative default that preserves perfect native feel) or *also share the UI* via CMP (maximum code sharing, but a Compose-rendered iOS UI). This is a distinctive KMP strength — you pick your sharing level, and can even mix (CMP for some screens, native SwiftUI for others). The tradeoff for CMP-on-iOS is the same as Flutter's UI question: the iOS UI is Compose-rendered rather than native, so it may not feel perfectly native or use the latest native UI features — teams accept that for the code-sharing benefit. For an Android developer, CMP is attractive because it's *Compose* — the same UI toolkit you already use.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why can't you use Retrofit or Hilt in commonMain?",
    a: [
      {
        t: "p",
        text: "**Because Retrofit and Hilt are JVM/Android-only — they rely on features (JVM reflection, dynamic proxies, JVM bytecode) that don't exist on Kotlin/Native (iOS). Shared `commonMain` code compiles for *all* targets including iOS, so it can only use libraries that work on *every* target.**",
      },
      {
        t: "list",
        items: [
          "**Retrofit** — built on JVM dynamic proxies (it generates the API implementation from your interface at runtime using reflection) and OkHttp (JVM). None of that works on Kotlin/Native. So networking in shared code uses **Ktor** instead (pure Kotlin, coroutine-native, pluggable per-platform engines).",
          "**Hilt** — a compile-time code-generation DI framework tied to the JVM/Android (Android components, JVM). It has no Kotlin/Native support. So shared-code DI uses **Koin** (multiplatform runtime DI) or manual DI.",
          "**Gson/Moshi** — reflection-based (JVM) serialization, so they also don't work in commonMain; **kotlinx.serialization** (compile-time, no reflection) is the multiplatform replacement.",
        ],
      },
      {
        t: "p",
        text: "The general principle is that commonMain code runs on *every* target, so any library it uses must provide implementations for all of them. JVM-specific libraries (relying on reflection, dynamic proxies, or JVM-only APIs) can't satisfy Kotlin/Native, so they're excluded from shared code. This is why the KMP stack has a distinct set of *substitutions* for the familiar Android libraries — Ktor for Retrofit, kotlinx.serialization for Gson/Moshi, Koin for Hilt, SQLDelight for Room. Note that these Android-only libraries can *still* be used in the `androidMain` source set or the Android app module (which target only the JVM) — the restriction is specifically that they can't go in *common* code. So a common pattern is: shared logic in commonMain with the multiplatform stack, and any Android-specific needs in androidMain.",
      },
    ],
  },
  {
    level: "senior",
    q: "How would you architect a KMP project to maximize meaningful code sharing?",
    a: [
      {
        t: "p",
        text: "**I'd apply clean architecture with a framework-free, dependency-injected design so the domain, data, and presentation layers live in `commonMain` (shared), with only the UI and thin platform primitives platform-specific — modularized for larger apps, and using the multiplatform library stack throughout. The key is that *good architecture is what enables sharing*: the same separation that makes code testable makes it shareable.**",
      },
      {
        t: "list",
        items: [
          "**Domain layer in commonMain**: pure-Kotlin domain models, use cases, and repository *interfaces* — no platform dependencies, so it drops into commonMain unchanged. This is the most shareable layer and the most valuable to share (business logic must not diverge between platforms).",
          "**Data layer in commonMain**: repository *implementations* using the multiplatform stack — Ktor (networking), kotlinx.serialization (JSON), SQLDelight (database), DataStore/multiplatform-settings (prefs). Platform-specific pieces (the database *driver*, secure storage) are provided per-platform via `expect/actual` or injected interfaces. So the entire data layer — the caching, SSOT, offline logic — is shared.",
          "**Presentation layer in commonMain**: ViewModels (using the multiplatform androidx lifecycle ViewModel) exposing `StateFlow<UiState>`. Share the state-management logic; only the thin UI-binding adapter differs per platform (Compose collects the flow on Android; a SwiftUI `ObservableObject` adapter on iOS). This shares even the presentation logic.",
          "**UI platform-specific (or CMP)**: native Compose on Android and SwiftUI on iOS (logic-only sharing, native feel), *or* Compose Multiplatform to share the UI too — a per-project choice based on whether native iOS feel or maximum sharing matters more.",
          "**Platform primitives via expect/actual or DI**: the thin native layer — database driver, secure storage, platform info, date formatting — using `expect/actual` for simple primitives and injected interfaces for testable/complex ones.",
        ],
      },
      {
        t: "list",
        items: [
          "**Modularize for larger apps**: split shared code into `shared:domain`, `shared:data`, `shared:feature-x` modules (applying the modularization patterns), with an *umbrella* module exporting them into a single iOS framework (multi-framework consumption breaks type identity). This combines KMP with clean module boundaries.",
          "**DI with Koin (or manual)**: define the DI graph in commonMain (Koin modules) and start it per platform (Android Application, iOS init) — so the wiring is shared too. On Android you might *also* use Hilt at the app layer, bridging to the shared Koin graph.",
          "**The architecture-enables-sharing insight**: the discipline that makes code *testable* (framework-free logic, dependency inversion through interfaces, injected dispatchers, no platform coupling) is *exactly* what makes it *shareable* — a well-architected Android app is already ~80% of the way to KMP. So investing in clean architecture pays off doubly. Conversely, code tangled with `android.*` or static platform calls can't be shared, so refactoring toward clean architecture is often the first step in KMP adoption.",
          "**Share incrementally**: don't rewrite everything at once — start by sharing a high-value slice (the data layer, or one feature's full stack), prove it, and expand. This de-risks adoption and lets you migrate an existing app gradually.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: architecting for maximum *meaningful* sharing in KMP is really about applying *clean architecture* rigorously — framework-free domain/data/presentation layers, dependencies inverted through interfaces, the multiplatform library stack (Ktor/serialization/SQLDelight/Koin/lifecycle) — so those layers naturally live in commonMain, with only genuinely platform-specific code (UI, native primitives) per-platform via `expect/actual` or DI. The unifying insight is that *testable design and shareable design are the same thing*: the separation-of-concerns and dependency-injection that make code testable are precisely what let it compile and run on every target, so good architecture is the enabler of sharing (and a well-architected Android app is most of the way to KMP already). For scale, you combine this with modularization (shared sub-modules + iOS umbrella framework) and share the DI graph too. And the pragmatic wisdom is *incremental adoption* — share a high-value slice first and expand — plus a deliberate choice about *how far up the stack* to share (logic-only with native UIs, or also-UI with CMP). The metric throughout is *meaningful* sharing (eliminating real duplication/divergence in the complex core), not maximizing shared-line count. Demonstrating the clean-architecture-enables-sharing principle, the layer-by-layer sharing plan with the multiplatform stack, the modularization-for-scale point, and the incremental/deliberate adoption approach is the comprehensive senior answer that an Android/KMP interviewer specifically wants — it shows you can *lead* a KMP adoption, not just write commonMain code.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle a KMP project's build, iOS integration, and multi-module structure?",
    a: [
      {
        t: "p",
        text: "**The build is Gradle-based (Kotlin Multiplatform plugin declaring targets and source sets), the iOS app consumes the shared code as a framework built via a Gradle task in the Xcode build, and multi-module projects use an *umbrella* module to export several shared modules into one iOS framework. The complexity concentrates at the iOS boundary and the multi-module framework packaging.**",
      },
      {
        t: "list",
        items: [
          "**Gradle build with the KMP plugin**: the shared module's `build.gradle.kts` declares *targets* (`androidTarget()`, `iosX64()`/`iosArm64()`/`iosSimulatorArm64()`, maybe `jvm()`/`js()`), configures *source set dependencies* (common dependencies available to all, platform dependencies per source set), and the *framework* output for iOS. Android consumes the shared module as a normal Gradle dependency; the multiplatform plugin handles compiling each target appropriately (JVM bytecode, Kotlin/Native binaries).",
          "**iOS integration**: the shared module compiles into an Obj-C framework/XCFramework. The Xcode project consumes it — historically via a Gradle build-phase script (a 'run script' phase that invokes a Gradle task to build the framework), or more modern setups via CocoaPods integration or direct XCFramework/SPM. So building the iOS app triggers the Kotlin framework build as part of the Xcode build. This coupling (Gradle ↔ Xcode) is the main integration complexity, and Kotlin/Native compile times (LLVM) can make iOS builds slower — a real consideration.",
          "**Multi-module structure and the umbrella framework**: larger apps split shared code into multiple KMP modules (`shared:domain`, `shared:data`, `shared:feature-x`). But iOS wants *one* framework, and consuming *multiple* Kotlin frameworks directly *breaks type identity* (the same Kotlin class exported by two frameworks becomes two incompatible Obj-C classes). So you add an **umbrella module** that depends on and `export`s the others, producing a *single* XCFramework the iOS app imports — one framework, consistent types. You *curate* what the umbrella exports (each exported module grows the binary and iOS compile time — export only what iOS needs, and keep the iOS-facing API in exported modules).",
        ],
      },
      {
        t: "list",
        items: [
          "**Source set hierarchy**: use intermediate source sets (e.g. `appleMain` shared by iOS variants, or a `commonMain` shared by all) to avoid duplicating code across the multiple iOS target variants (x64 simulator, arm64 device, arm64 simulator). The Kotlin plugin's default hierarchy template handles common cases.",
          "**Build performance and tooling**: Kotlin/Native compilation is the slow part of iOS builds — mitigate with the usual Gradle caching/config-cache and by keeping the exported iOS surface lean. Tooling like KMMBridge (Touchlab) helps distribute pre-built frameworks so iOS developers don't rebuild the Kotlin every time. SKIE runs on the umbrella framework to enhance the Swift API.",
          "**CI considerations**: CI must build both the Android artifact (Gradle) and the iOS framework (Gradle + Xcode), which needs a macOS runner for the iOS side. Distributing pre-built frameworks (KMMBridge) can decouple iOS developers from the Kotlin build, improving their workflow.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: a KMP project's build is fundamentally *Gradle orchestrating multiple compilation targets* (JVM for Android, Kotlin/Native for iOS, etc.), with the notable complexity at the *iOS boundary* — the shared code compiles to a framework consumed by Xcode (via a Gradle build phase / CocoaPods / SPM), coupling the two build systems and introducing Kotlin/Native's slower compile times. The multi-module wrinkle is that iOS wants *one* framework, so you use an *umbrella module* to `export` several shared modules into a single XCFramework (avoiding the type-identity-breaking multi-framework problem), *curating* the export surface to control binary size and iOS build time. Around this, you use source-set hierarchies to avoid duplication across iOS target variants, mitigate build performance (caching, lean exports, KMMBridge for pre-built framework distribution), run SKIE on the umbrella for Swift ergonomics, and set up CI with macOS runners for the iOS build. Understanding that the build complexity concentrates at the Gradle↔Xcode framework boundary and the multi-module umbrella packaging — and knowing the mitigations (umbrella export curation, source-set hierarchy, KMMBridge, build caching) — is the practical KMP-project-setup competence that distinguishes someone who's actually *shipped* a KMP app to both stores from someone who's only written shared logic. It ties KMP together with the modularization patterns and demonstrates the operational, not just conceptual, mastery an Android/KMP role requires.",
      },
    ],
  },
];

export default qa;
