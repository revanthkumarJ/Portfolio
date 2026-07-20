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
  {
    level: "junior",
    q: "What is Ktor, and why use it for KMP networking?",
    a: [
      {
        t: "p",
        text: "*Ktor Client* is JetBrains' *multiplatform* HTTP client — it works in `commonMain` (unlike Retrofit, which is JVM-only). You write shared networking code once, and Ktor uses a platform-specific *engine* under the hood (OkHttp on Android, Darwin/`NSURLSession` on iOS) selected per source set. It integrates with *kotlinx.serialization* for JSON, coroutines for async, and supports interceptors/auth/logging. It's the de-facto networking choice for shared KMP code because it's coroutine-first and truly cross-platform.",
      },
      {
        t: "list",
        items: [
          "**Ktor Client** — multiplatform HTTP (works in commonMain).",
          "**Engines** — OkHttp (Android), Darwin (iOS).",
          "**Integrates** — kotlinx.serialization, coroutines.",
          "**De-facto** — shared KMP networking.",
        ],
      },
      {
        t: "note",
        text: "Ktor Client is JetBrains' multiplatform HTTP client — works in commonMain (Retrofit is JVM-only). Write networking once; Ktor uses a platform engine (OkHttp on Android, Darwin/NSURLSession on iOS) per source set. Integrates with kotlinx.serialization, coroutines, interceptors/auth. The de-facto choice for shared KMP networking — coroutine-first and truly cross-platform.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is SQLDelight, and how does it enable shared persistence?",
    a: [
      {
        t: "p",
        text: "*SQLDelight* is a *multiplatform database* library: you write *SQL* (in `.sq` files), and it generates *type-safe Kotlin APIs* from your queries, backed by a platform *SQLite driver* (Android driver, Native driver for iOS). This gives shared, type-checked persistence in `commonMain` — unlike *Room*, which is Android-only. It supports coroutines/Flow for reactive queries and transactions. It's the standard KMP DB choice: SQL-first, compile-time-verified queries, cross-platform SQLite.",
      },
      {
        t: "list",
        items: [
          "**SQLDelight** — multiplatform, SQL-first DB.",
          "**Generates** — type-safe Kotlin from `.sq` queries.",
          "**Drivers** — Android + Native (iOS) SQLite.",
          "**Reactive** — coroutines/Flow queries; vs Android-only Room.",
        ],
      },
      {
        t: "note",
        text: "SQLDelight is a multiplatform DB: write SQL in .sq files, it generates type-safe Kotlin APIs backed by a platform SQLite driver (Android + Native/iOS). Shared, compile-time-verified persistence in commonMain (Room is Android-only). Supports coroutines/Flow reactive queries and transactions. The standard KMP DB choice — SQL-first, cross-platform SQLite.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does dependency injection work in KMP (Koin vs Hilt)?",
    a: [
      {
        t: "p",
        text: "*Hilt/Dagger* are *JVM/Android-only* (annotation processing tied to Android) — you *can't* use them in `commonMain`. For shared DI you use *Koin* (multiplatform, runtime DI via a DSL) or *kotlin-inject* (compile-time multiplatform DI), or *manual DI* (factory functions). Koin is popular: define modules in common, `initKoin()` from both apps, and resolve dependencies anywhere. On Android you may still use Hilt in the *Android app layer* and bridge to the shared Koin/manual graph. Choose Koin/manual for the shared module; keep Hilt (if used) at the Android edge.",
      },
      {
        t: "list",
        items: [
          "**Hilt/Dagger** — Android-only; not in commonMain.",
          "**Shared DI** — Koin (runtime) or kotlin-inject (compile-time) or manual.",
          "**Koin** — modules in common, `initKoin()` both apps.",
          "**Bridge** — Hilt at the Android edge if used.",
        ],
      },
      {
        t: "note",
        text: "Hilt/Dagger are Android/JVM-only (can't be in commonMain). For shared DI use Koin (multiplatform runtime DSL), kotlin-inject (compile-time MP), or manual DI. Koin is popular: modules in common, initKoin() from both apps. You may still use Hilt in the Android app layer bridging to the shared graph. Koin/manual for shared; Hilt at the Android edge.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is kotlinx.serialization, and why is it used in KMP?",
    a: [
      {
        t: "p",
        text: "*kotlinx.serialization* is the *multiplatform* JSON (and other formats) library — it works in `commonMain` (unlike Gson/Moshi, which are JVM-only). You annotate a class `@Serializable`, and it *generates* the serialization code at *compile time* (no reflection — good for Native and R8). It integrates directly with *Ktor* for request/response bodies. It's the default serializer for shared KMP code: cross-platform, compile-time-safe, reflection-free. Define your DTOs `@Serializable` in common and both platforms parse identically.",
      },
      {
        t: "code",
        title: "Shared serializable DTO",
        code: `@Serializable\ndata class User(val id: String, val name: String)\n// works in commonMain; Ktor uses it for JSON bodies; no reflection`,
      },
      {
        t: "note",
        text: "kotlinx.serialization is the multiplatform serializer — works in commonMain (Gson/Moshi are JVM-only). Annotate @Serializable and it generates code at compile time (no reflection — Native/R8-friendly), integrating with Ktor for bodies. The default for shared KMP: cross-platform, compile-time-safe, reflection-free. Define @Serializable DTOs in common; both platforms parse identically.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Compose Multiplatform render UI on different platforms?",
    a: [
      {
        t: "p",
        text: "Compose Multiplatform runs the *same Compose runtime and compiler* everywhere, but the *rendering backend* differs: on Android it uses the native Android Compose (as usual); on *desktop and iOS* it renders via *Skia* (Skiko) — Compose draws its own pixels onto a surface (a `UIViewController` on iOS). Web uses Wasm/Canvas or DOM. So the *composables and state* are shared; the *drawing* is handled per platform. This is why iOS shows Compose-drawn UI (not UIKit views) — powerful for sharing, but a different rendering model than native.",
      },
      {
        t: "list",
        items: [
          "**Same** — Compose runtime/compiler everywhere.",
          "**Android** — native Android Compose.",
          "**Desktop/iOS** — Skia (Skiko) rendering.",
          "**Shared composables** — per-platform drawing.",
        ],
      },
      {
        t: "note",
        text: "Compose Multiplatform shares the Compose runtime/compiler; the rendering backend differs: Android uses native Android Compose, desktop/iOS render via Skia (Skiko — Compose draws its own pixels, iOS into a UIViewController), web via Wasm/Canvas/DOM. Composables and state are shared; drawing is per-platform. Why iOS shows Compose-drawn (not UIKit) UI.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a multiplatform library, and how do you know if one exists?",
    a: [
      {
        t: "p",
        text: "A *multiplatform library* publishes artifacts for multiple targets (common + platform), so you can add it to `commonMain` and use it on all platforms. To find them: check *klibs.io* / awesome-kmp lists, the library's docs (does it list `iosArm64` etc.?), or its Gradle metadata. Core ecosystem libs are multiplatform: *Ktor, SQLDelight, kotlinx.serialization/coroutines/datetime, Koin, Kermit, Multiplatform Settings, Store, Apollo (GraphQL)*. If a library is JVM-only (Retrofit, Room, Hilt, Gson), it *can't* go in common — you need the multiplatform alternative.",
      },
      {
        t: "list",
        items: [
          "**Multiplatform lib** — artifacts for common + platforms.",
          "**Find** — klibs.io, docs (lists iOS targets?), metadata.",
          "**Core** — Ktor, SQLDelight, kotlinx, Koin, Kermit, Settings.",
          "**JVM-only** — can't go in common; use the MP alternative.",
        ],
      },
      {
        t: "note",
        text: "A multiplatform library publishes artifacts for multiple targets, so it works in commonMain everywhere. Find them via klibs.io/awesome-kmp, docs (does it list iosArm64?), or Gradle metadata. Core MP libs: Ktor, SQLDelight, kotlinx.serialization/coroutines/datetime, Koin, Kermit, Multiplatform Settings, Store, Apollo. JVM-only libs (Retrofit/Room/Hilt/Gson) can't go in common — use the MP alternative.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you share a repository/data layer in KMP?",
    a: [
      {
        t: "p",
        text: "Put the *repository, use-cases, models, DTOs, and mappers* in `commonMain`, using *Ktor* (remote), *SQLDelight* (local), and *kotlinx.serialization* (parsing) — all multiplatform. The repository exposes *suspend functions/Flows* of *domain models*, implementing offline-first/caching logic once. Platform-specific needs (secure storage, connectivity) are injected via interfaces/expect-actual. Both apps consume the same repository through DI. This is the *sweet spot* of KMP: the entire data layer shared and tested once, with native UI on top.",
      },
      {
        t: "list",
        items: [
          "**In common** — repository, use-cases, models, mappers.",
          "**Libs** — Ktor + SQLDelight + serialization.",
          "**Exposes** — suspend/Flow of domain models.",
          "**Sweet spot** — data layer shared + tested once.",
        ],
      },
      {
        t: "note",
        text: "Share the data layer by putting repository/use-cases/models/DTOs/mappers in commonMain using Ktor (remote), SQLDelight (local), kotlinx.serialization (parsing) — all multiplatform. The repository exposes suspend/Flow of domain models with offline-first logic written once; platform needs (secure storage) injected via interfaces. Both apps consume it via DI. KMP's sweet spot: data layer shared + tested once, native UI on top.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Kermit / Napier, and why use a multiplatform logger?",
    a: [
      {
        t: "p",
        text: "*Kermit* and *Napier* are *multiplatform logging* libraries — they let shared code log once and route output to each platform's native logging (Logcat on Android, `NSLog`/os_log on iOS). Since `android.util.Log` is Android-only, you can't use it in `commonMain`; a multiplatform logger fills that gap. They support log levels, tags, and can forward to Crashlytics. Use one so your shared logic can log diagnostics visible on both platforms — important for debugging shared code you can't easily step through in Xcode.",
      },
      {
        t: "list",
        items: [
          "**Kermit/Napier** — multiplatform logging.",
          "**Routes** — Logcat (Android), NSLog/os_log (iOS).",
          "**Fills gap** — `android.util.Log` is Android-only.",
          "**Can forward** — to Crashlytics; aids shared-code debugging.",
        ],
      },
      {
        t: "note",
        text: "Kermit/Napier are multiplatform loggers — shared code logs once, routed to native logging (Logcat/NSLog/os_log). Needed because android.util.Log is Android-only (unusable in commonMain). They support levels/tags and can forward to Crashlytics. Use one so shared logic's diagnostics are visible on both platforms — key for debugging shared code you can't easily step through in Xcode.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the KMP alternatives to common Android libraries?",
    a: [
      {
        t: "p",
        text: "Map each Android/JVM-only lib to its multiplatform counterpart: *Retrofit/OkHttp → Ktor Client*; *Room → SQLDelight* (or the newer multiplatform Room); *Hilt/Dagger → Koin / kotlin-inject / manual*; *Gson/Moshi → kotlinx.serialization*; *SharedPreferences/DataStore → Multiplatform Settings* (or multiplatform DataStore); *android.util.Log → Kermit/Napier*; *WorkManager → platform-specific (expect/actual)*; *java.time → kotlinx-datetime*; *Glide/Coil → Coil 3 (now multiplatform) / Kamel*. Knowing these mappings is essential for planning a shared module.",
      },
      {
        t: "table",
        headers: ["Android/JVM", "Multiplatform"],
        rows: [
          ["Retrofit/OkHttp", "Ktor Client"],
          ["Room", "SQLDelight / MP Room"],
          ["Hilt/Dagger", "Koin / kotlin-inject"],
          ["Gson/Moshi", "kotlinx.serialization"],
          ["DataStore/Prefs", "Multiplatform Settings"],
        ],
      },
      {
        t: "note",
        text: "KMP alternatives: Retrofit→Ktor, Room→SQLDelight (or MP Room), Hilt→Koin/kotlin-inject/manual, Gson/Moshi→kotlinx.serialization, Prefs/DataStore→Multiplatform Settings, Log→Kermit/Napier, java.time→kotlinx-datetime, Coil/Glide→Coil 3 (MP)/Kamel, WorkManager→expect/actual. Knowing these mappings is essential to plan a shared module.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Multiplatform Settings, and what does it replace?",
    a: [
      {
        t: "p",
        text: "*Multiplatform Settings* is a small library for *key-value preferences* in shared code — it wraps each platform's native storage (`SharedPreferences`/`DataStore` on Android, `NSUserDefaults` on iOS) behind a common API. It replaces direct use of `SharedPreferences` (Android-only) in `commonMain`. Good for simple settings/flags; it can expose values as Flows and integrate with serialization. For larger structured local data, use SQLDelight instead. It's the go-to for lightweight shared preferences.",
      },
      {
        t: "list",
        items: [
          "**Multiplatform Settings** — shared key-value prefs.",
          "**Wraps** — SharedPreferences/DataStore + NSUserDefaults.",
          "**Replaces** — Android-only SharedPreferences in common.",
          "**For larger data** — use SQLDelight.",
        ],
      },
      {
        t: "note",
        text: "Multiplatform Settings wraps each platform's key-value storage (SharedPreferences/DataStore on Android, NSUserDefaults on iOS) behind a common API — replacing Android-only SharedPreferences in commonMain. Good for simple settings/flags (can expose Flows, integrate serialization). For larger structured local data, use SQLDelight. The go-to for lightweight shared preferences.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you structure navigation in a Compose Multiplatform app?",
    a: [
      {
        t: "p",
        text: "Options: *Jetpack Navigation* now has multiplatform support, or dedicated MP navigation libraries like *Decompose* (component-based, lifecycle-aware, great for shared navigation logic) or *Voyager* (Compose-focused, simple). These let you define navigation/back-stack in *shared* code driving the shared Compose UI. If sharing only logic (native UI), each platform handles its own navigation (Navigation Compose / SwiftUI navigation) driven by shared state. Choose based on whether UI is shared: shared UI → Decompose/Voyager/Nav-MP; native UI → native navigation per platform.",
      },
      {
        t: "list",
        items: [
          "**Shared-UI nav** — Decompose, Voyager, Navigation-MP.",
          "**Decompose** — component/lifecycle-based shared nav.",
          "**Native-UI** — each platform's own navigation, shared state.",
          "**Choose** — by whether UI is shared.",
        ],
      },
      {
        t: "note",
        text: "CMP navigation: Jetpack Navigation (now MP), Decompose (component-based, lifecycle-aware — great for shared nav logic), or Voyager (Compose-focused, simple) — define back-stack in shared code driving shared Compose UI. If sharing only logic, each platform navigates natively (Navigation Compose/SwiftUI) on shared state. Shared UI → Decompose/Voyager/Nav-MP; native UI → per-platform navigation.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle images and resources in Compose Multiplatform?",
    a: [
      {
        t: "p",
        text: "CMP provides a *multiplatform resources* system (`compose.components.resources`) — you put images, strings, fonts in `commonMain/composeResources` and access them with generated accessors (`Res.drawable.logo`, `stringResource(Res.string.title)`), working across platforms. For *network images*, use a multiplatform image loader — *Coil 3* (now multiplatform) or *Kamel* — that loads/caches on all targets. This replaces Android-only resource access (`R.drawable`) and Coil/Glide's Android-only versions. So shared UI can reference shared resources and load remote images uniformly.",
      },
      {
        t: "list",
        items: [
          "**compose.components.resources** — shared images/strings/fonts.",
          "**Access** — `Res.drawable.*`, `stringResource(Res.string.*)`.",
          "**Network images** — Coil 3 (MP) / Kamel.",
          "**Replaces** — Android-only `R.drawable`/Glide.",
        ],
      },
      {
        t: "note",
        text: "CMP has a multiplatform resources system (compose.components.resources) — put images/strings/fonts in commonMain/composeResources, access via generated Res.drawable.*/stringResource(Res.string.*) across platforms. For network images use a multiplatform loader (Coil 3, now MP, or Kamel). Replaces Android-only R.drawable/Glide. Shared UI references shared resources and loads remote images uniformly.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why can't you use Room or Retrofit in commonMain?",
    a: [
      {
        t: "p",
        text: "Both are *JVM/Android-only*: Retrofit depends on `java.*`/OkHttp and Android; Room's compiler and runtime target Android's SQLite/framework. `commonMain` must compile to *all* targets including *Kotlin/Native (iOS)*, where these JVM/Android APIs don't exist — so referencing them there won't compile. You use their *multiplatform equivalents* (Ktor for Retrofit, SQLDelight for Room) in common, or keep the JVM library in `androidMain` behind an `expect`/`actual` interface. The rule: commonMain code must be portable to Native.",
      },
      {
        t: "list",
        items: [
          "**JVM/Android-only** — Retrofit (java/OkHttp), Room (Android SQLite).",
          "**commonMain** — compiles to Native too; those APIs absent.",
          "**Use** — Ktor / SQLDelight in common.",
          "**Or** — keep in androidMain behind expect/actual.",
        ],
      },
      {
        t: "note",
        text: "Retrofit (java.*/OkHttp/Android) and Room (Android SQLite/compiler) are JVM/Android-only. commonMain compiles to all targets including Kotlin/Native (iOS), where those APIs don't exist — so they won't compile there. Use multiplatform equivalents (Ktor, SQLDelight) in common, or keep the JVM lib in androidMain behind an expect/actual interface. commonMain must be Native-portable.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the newer multiplatform Room, and how does it compare to SQLDelight?",
    a: [
      {
        t: "p",
        text: "Google has released *Room with KMP support* (works on iOS/Native, not just Android) — so if you know Room, you can now use its *DAO/entity/annotation* model in shared code. *SQLDelight* is *SQL-first* (write SQL, generate Kotlin) and has been multiplatform for years (mature, driver-based, reactive). Choice: Room-KMP for teams preferring Room's ORM-style API and existing Room knowledge; SQLDelight for SQL-first control, maturity, and its ecosystem. Both give shared SQLite persistence — pick by API preference and maturity needs.",
      },
      {
        t: "list",
        items: [
          "**Room-KMP** — Room's DAO/annotation model, now on Native.",
          "**SQLDelight** — SQL-first, generate Kotlin, long-mature.",
          "**Room** — for existing Room knowledge/ORM style.",
          "**SQLDelight** — SQL control + maturity.",
        ],
      },
      {
        t: "note",
        text: "Room now has KMP support (works on iOS/Native) — use its DAO/entity/annotation model in shared code. SQLDelight is SQL-first (write SQL → generate Kotlin), multiplatform for years, mature and reactive. Choose Room-KMP for ORM-style API/existing Room knowledge, SQLDelight for SQL-first control and maturity. Both give shared SQLite — pick by API preference and maturity.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you architect a KMP project's modules for maximum sharing?",
    a: [
      {
        t: "p",
        text: "Layer it: a *shared domain/data* module (models, use-cases, repositories, networking, DB — all multiplatform), optionally a *shared presentation* module (ViewModels/state with StateFlow), and *thin platform app modules* (Android Compose, iOS SwiftUI) that only render state and dispatch actions. Push logic *down* into common; keep platform modules as thin as possible. Use *interfaces + DI* for platform services. For very large apps, split shared into *feature modules* (each multiplatform). The goal: everything portable lives in shared, only UI/entry points are platform-specific.",
      },
      {
        t: "list",
        items: [
          "**Shared domain/data** — models, use-cases, repo, network, DB.",
          "**Shared presentation** — ViewModels/state (optional).",
          "**Thin platform apps** — render + dispatch only.",
          "**Push logic down** — into common; UI stays platform.",
        ],
      },
      {
        t: "note",
        text: "Architect for sharing: a shared domain/data module (models/use-cases/repos/networking/DB — all MP), optionally a shared presentation module (ViewModels/StateFlow), and thin platform app modules (Compose/SwiftUI) that only render state and dispatch actions. Push logic into common; platform services via interfaces + DI; split shared into feature modules at scale. Everything portable in shared, only UI/entry points platform-specific.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is expect/actual's role when using platform-specific libraries?",
    a: [
      {
        t: "p",
        text: "When a capability needs a *different library per platform* (e.g. secure storage: Android Keystore vs iOS Keychain), you *declare* the API in `commonMain` (`expect`) and *implement* it in each platform set (`actual`) using that platform's library. Common code depends only on the expected API; the platform provides the real implementation. This lets you use the *best native library* on each side while presenting a *single shared interface* — the primary mechanism (alongside DI'd interfaces) for bridging platform-specific dependencies into shared code.",
      },
      {
        t: "list",
        items: [
          "**expect** — declare the capability in common.",
          "**actual** — implement per platform with its library.",
          "**Best native lib** — each side; single shared API.",
          "**Bridges** — platform-specific deps into shared code.",
        ],
      },
      {
        t: "note",
        text: "When a capability needs a different library per platform (secure storage: Keystore vs Keychain), declare it in commonMain (expect) and implement in each platform set (actual) with that platform's library. Common depends only on the expected API; platforms provide the real impl — using the best native library each side behind one shared interface. The primary mechanism (with DI'd interfaces) for platform-specific deps.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the Compose compiler's role in Compose Multiplatform?",
    a: [
      {
        t: "p",
        text: "The *Compose compiler plugin* transforms `@Composable` functions (adding the composer, stability inference, recomposition scopes) — and it's the *same compiler* whether you target Android or Compose Multiplatform. So all the *stability/recomposition* concepts (skippable functions, stable parameters, `remember`) apply identically in CMP. The difference is only the *runtime/rendering* backend (Skia off Android). This means your Compose performance knowledge transfers directly to CMP, and the same optimization rules (immutability, keys, deferring reads) hold across platforms.",
      },
      {
        t: "list",
        items: [
          "**Same Compose compiler** — Android and CMP.",
          "**Adds** — composer, stability, recomposition scopes.",
          "**Concepts transfer** — skippable, stable params, remember.",
          "**Differs** — only runtime/rendering backend.",
        ],
      },
      {
        t: "note",
        text: "The Compose compiler plugin (composer injection, stability inference, recomposition scopes) is the same whether targeting Android or Compose Multiplatform — so stability/recomposition concepts (skippable functions, stable params, remember) apply identically in CMP. Only the runtime/rendering backend differs (Skia off Android). Your Compose performance knowledge transfers directly; the same optimization rules hold.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle date and time in shared KMP code?",
    a: [
      {
        t: "p",
        text: "Use *kotlinx-datetime* — the multiplatform date/time library — instead of `java.time` (JVM-only) or platform date APIs. It provides `Instant`, `LocalDateTime`, `TimeZone`, and arithmetic that work in `commonMain` across Android and iOS. For formatting/parsing and time-zone handling you use its APIs (with platform time-zone data). This keeps date logic shared and consistent. Don't reach for `java.time` in common (won't compile on Native) or duplicate date logic per platform — kotlinx-datetime is the standard.",
      },
      {
        t: "list",
        items: [
          "**kotlinx-datetime** — multiplatform dates/times.",
          "**Provides** — Instant, LocalDateTime, TimeZone, arithmetic.",
          "**Avoid** — `java.time` (JVM-only) in common.",
          "**Keeps** — date logic shared and consistent.",
        ],
      },
      {
        t: "note",
        text: "Use kotlinx-datetime (multiplatform) for dates/times in shared code — Instant, LocalDateTime, TimeZone, arithmetic working in commonMain across Android/iOS — instead of java.time (JVM-only) or platform date APIs. Keeps date logic shared and consistent. Don't use java.time in common (won't compile on Native) or duplicate per platform. The standard KMP date library.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you manage the Gradle build for a KMP + Compose Multiplatform project?",
    a: [
      {
        t: "p",
        text: "Apply the *Kotlin Multiplatform* plugin and the *Compose Multiplatform* plugin (`org.jetbrains.compose`), declare *targets* (android, iosX64/Arm64/SimulatorArm64, desktop), configure *source sets* and their dependencies (Compose UI in `commonMain`), and set up *iOS framework export* (CocoaPods/XCFramework). Use a *version catalog* for consistent dependency versions and *convention plugins* to share build logic across modules. Keep the Compose compiler and Kotlin versions aligned. The build orchestrates producing the Android app, iOS framework, and desktop artifact from shared code.",
      },
      {
        t: "list",
        items: [
          "**Plugins** — KMP + Compose Multiplatform.",
          "**Targets + source sets** — Compose UI in commonMain.",
          "**iOS export** — CocoaPods/XCFramework.",
          "**Version catalog + convention plugins** — consistency.",
        ],
      },
      {
        t: "note",
        text: "Apply the KMP plugin + Compose Multiplatform plugin (org.jetbrains.compose), declare targets (android, iOS, desktop), configure source sets (Compose UI in commonMain), set up iOS framework export (CocoaPods/XCFramework). Use a version catalog + convention plugins for consistency, keeping Compose/Kotlin versions aligned. The build produces Android app, iOS framework, and desktop artifact from shared code.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the maturity trade-offs of Compose Multiplatform on iOS?",
    a: [
      {
        t: "p",
        text: "CMP on iOS is *stable* but *newer* than Android Compose or native SwiftUI. Trade-offs: you get *maximal UI sharing*, but iOS renders *Compose (Skia)* — so *native-feel details* (system components, exact iOS look, some accessibility/text behaviors, deep OS integrations) may lag native SwiftUI, and you're on a faster-moving/less-battle-tested stack. Interop with UIKit/SwiftUI is possible but adds seams. Weigh: if pixel-perfect native iOS UX and full SwiftUI access matter, share only logic; if UI-sharing velocity matters more, CMP is increasingly viable. Assess per product.",
      },
      {
        t: "list",
        items: [
          "**Stable but newer** — than Android Compose/SwiftUI.",
          "**Pro** — maximal UI sharing.",
          "**Con** — native-feel/components/accessibility may lag.",
          "**Weigh** — native UX vs UI-sharing velocity.",
        ],
      },
      {
        t: "note",
        text: "CMP on iOS is stable but newer: pro — maximal UI sharing; con — iOS renders Compose (Skia), so native-feel details (system components, exact iOS look, some accessibility/text, OS integrations) may lag SwiftUI, on a faster-moving stack (UIKit/SwiftUI interop adds seams). If pixel-perfect native UX matters, share only logic; if UI-sharing velocity matters, CMP is increasingly viable. Assess per product.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Apollo Kotlin / Store, and where do they fit in KMP?",
    a: [
      {
        t: "p",
        text: "*Apollo Kotlin* is a *multiplatform GraphQL* client — if your backend is GraphQL, it generates type-safe models and works in `commonMain` (like Ktor for REST). *Store* is a multiplatform library for *building a caching/data layer* (combining network + local source with a single-source-of-truth, offline-first policy) — it standardizes fetch/cache/refresh logic. Both fit the *shared data layer*: Apollo for GraphQL networking, Store for orchestrating caching. They're examples of the maturing KMP ecosystem covering more of the stack.",
      },
      {
        t: "list",
        items: [
          "**Apollo Kotlin** — multiplatform GraphQL client.",
          "**Store** — caching/data layer (network + local SSOT).",
          "**Fit** — the shared data layer.",
          "**Ecosystem** — maturing, covers more of the stack.",
        ],
      },
      {
        t: "note",
        text: "Apollo Kotlin is a multiplatform GraphQL client (type-safe, works in commonMain — like Ktor for REST) if your backend is GraphQL. Store is a multiplatform caching/data-layer library (network + local single-source-of-truth, offline-first fetch/cache/refresh). Both fit the shared data layer — Apollo for GraphQL, Store for caching orchestration. Examples of the maturing KMP ecosystem.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Coil 3, and how does it enable shared image loading?",
    a: [
      {
        t: "p",
        text: "*Coil 3* is now *multiplatform* — the popular Android image loader works in `commonMain`/Compose Multiplatform, loading and caching images across Android, iOS, and desktop. You use `AsyncImage`/`rememberAsyncImagePainter` in shared Compose UI to display remote images with the same API everywhere. This replaces relying on Android-only Coil 2 or Glide in shared code. For non-Compose shared code, *Kamel* is an alternative. Coil 3 is the go-to for image loading in Compose Multiplatform apps.",
      },
      {
        t: "list",
        items: [
          "**Coil 3** — multiplatform image loading (was Android-only).",
          "**Works in** — commonMain / Compose Multiplatform.",
          "**API** — `AsyncImage` in shared Compose UI.",
          "**Alternative** — Kamel; replaces Coil 2/Glide in shared code.",
        ],
      },
      {
        t: "note",
        text: "Coil 3 is now multiplatform — the Android image loader works in commonMain/Compose Multiplatform, loading/caching across Android/iOS/desktop with the same AsyncImage API. Replaces Android-only Coil 2/Glide in shared code. Kamel is an alternative for non-Compose. The go-to for image loading in Compose Multiplatform apps.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test shared code that uses multiplatform libraries?",
    a: [
      {
        t: "p",
        text: "Test in `commonTest` (runs on all targets). For *Ktor*, use its *MockEngine* to stub HTTP responses without a network — verify your repository parses/handles them. For *SQLDelight*, use the *in-memory/JVM driver* in tests to exercise queries. For *coroutines/Flow*, use `kotlinx-coroutines-test` (`runTest`, test dispatchers, Turbine for Flows). Inject *fakes* for platform-abstraction interfaces. Because these libraries are multiplatform, the *same tests validate behavior on Native too* — run them on the iOS target in CI to catch Native-only issues.",
      },
      {
        t: "list",
        items: [
          "**Ktor** — MockEngine to stub HTTP.",
          "**SQLDelight** — in-memory/JVM driver.",
          "**Coroutines/Flow** — `runTest` + Turbine.",
          "**Run on Native** — same tests catch Native-only issues.",
        ],
      },
      {
        t: "note",
        text: "Test shared code in commonTest: Ktor MockEngine to stub HTTP (verify repo parsing), SQLDelight in-memory/JVM driver for queries, kotlinx-coroutines-test (runTest, test dispatchers, Turbine) for Flows, and fakes for platform interfaces. Since the libs are multiplatform, the same tests validate Native too — run them on the iOS target in CI to catch Native-only issues.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a common dependency and a platform dependency in Gradle?",
    a: [
      {
        t: "p",
        text: "In a KMP module, you add dependencies *per source set*. A *common dependency* (in `commonMain`'s dependencies) must be *multiplatform* — it's available to all targets (e.g. Ktor core, kotlinx.serialization). A *platform dependency* (in `androidMain`/`iosMain`) is available *only to that platform* and can be platform-specific (e.g. the OkHttp Ktor engine in `androidMain`, the Darwin engine in `iosMain`, or an Android-only library). So you put shared libs in common and platform-specific engines/libs in the matching platform set — a common pattern is 'common API + per-platform engine'.",
      },
      {
        t: "code",
        title: "Per-source-set dependencies",
        code: `sourceSets {\n  commonMain.dependencies { implementation(libs.ktor.core) }        // multiplatform\n  androidMain.dependencies { implementation(libs.ktor.engine.okhttp) } // Android engine\n  iosMain.dependencies { implementation(libs.ktor.engine.darwin) }     // iOS engine\n}`,
      },
      {
        t: "note",
        text: "In KMP you add dependencies per source set: a common dependency (commonMain) must be multiplatform (Ktor core, serialization — all targets); a platform dependency (androidMain/iosMain) is platform-only (OkHttp engine on Android, Darwin engine on iOS, Android-only libs). Pattern: common API + per-platform engine — shared libs in common, platform engines in the matching set.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you decide whether to share UI (CMP) or keep it native?",
    a: [
      {
        t: "p",
        text: "Decide by *UX bar, team, and reuse goals*. Share UI (CMP) when: UI is *fairly uniform* across platforms, you want to *minimize duplicated UI work*, the team is Kotlin-centric, and near-native (not pixel-perfect-native) iOS feel is acceptable. Keep UI native when: you need *best-in-class platform UX* (exact iOS conventions, latest SwiftUI, deep platform integration), have iOS expertise, or the UI differs significantly per platform. A common pragmatic path: *share logic first* (proven, low-risk), then adopt CMP for *some* screens where sharing UI clearly pays off.",
      },
      {
        t: "list",
        items: [
          "**Share UI (CMP)** — uniform UI, minimize dup, Kotlin team.",
          "**Native UI** — best platform UX, iOS expertise, divergent UI.",
          "**Pragmatic** — share logic first, CMP for select screens.",
          "**Decide** — UX bar vs reuse; per product/team.",
        ],
      },
      {
        t: "note",
        text: "Share UI (CMP) when UI is fairly uniform, you want minimal duplicated UI work, the team is Kotlin-centric, and near-native iOS feel is acceptable. Keep native when you need best-in-class platform UX (exact iOS conventions, latest SwiftUI, deep integration), have iOS expertise, or UI diverges. Pragmatic path: share logic first (low-risk), adopt CMP for select screens where it clearly pays.",
      },
    ],
  },
];

export default qa;
