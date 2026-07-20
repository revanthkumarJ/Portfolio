// KMP Common Libraries & Compose Multiplatform — Content tab. Teaching-first.

const content = [
  {
    heading: "The multiplatform library ecosystem",
    blocks: [
      {
        t: "p",
        text: "Shared `commonMain` code can only use *multiplatform* libraries (ones that provide implementations for all your targets). Fortunately, the essential ones for a data/logic layer are all mature and multiplatform — the ecosystem for the *logic* layer (which is what KMP shares) is solid. Knowing the standard KMP library stack is important for an Android/KMP engineer.",
      },
      {
        t: "table",
        headers: ["Need", "Multiplatform library"],
        rows: [
          ["Concurrency", "kotlinx.coroutines (Flow, coroutines — multiplatform)"],
          ["Networking", "Ktor Client (multiplatform HTTP client)"],
          ["Serialization", "kotlinx.serialization (compile-time, multiplatform)"],
          ["Local database", "SQLDelight (or Room KMP)"],
          ["Key-value storage", "multiplatform-settings, or DataStore (multiplatform)"],
          ["Dependency injection", "Koin (multiplatform)"],
          ["Date/time", "kotlinx-datetime"],
          ["ViewModel / lifecycle", "androidx.lifecycle (multiplatform since 2.8)"],
        ],
      },
      {
        t: "list",
        items: [
          "**These cover a full data/domain/presentation layer in commonMain**: coroutines/Flow for async, Ktor for networking, kotlinx.serialization for JSON, SQLDelight for the database, Koin for DI, and the multiplatform ViewModel for presentation. You can build the entire non-UI app in shared code with these.",
          "**Why these specifically** — they're *reflection-free* and *pure Kotlin* where possible (kotlinx.serialization is compile-time; Ktor is coroutine-native), so they work on Kotlin/Native (iOS), unlike JVM-only libraries (Retrofit, Gson, Moshi, Hilt) that *can't* go in commonMain.",
          "**The Android-only equivalents don't work in commonMain** — Retrofit (JVM/Android), Gson/Moshi (reflection, JVM), Hilt (Android). So the KMP stack *substitutes*: Ktor for Retrofit, kotlinx.serialization for Gson/Moshi, Koin for Hilt. Knowing these substitutions is a common KMP interview point.",
        ],
      },
    ],
  },
  {
    heading: "Key libraries in depth",
    blocks: [
      {
        t: "list",
        items: [
          "**Ktor Client** — the multiplatform HTTP client (covered in Networking). Pluggable engines per platform (OkHttp on Android, Darwin on iOS), coroutine-native, ContentNegotiation with kotlinx.serialization. Your entire networking layer lives in commonMain.",
          "**SQLDelight** — a multiplatform database library that generates *type-safe Kotlin APIs from SQL* (you write `.sq` SQL files, it generates Kotlin). Works via platform database drivers (Android SQLite driver, native driver on iOS) provided per-platform. The KMP alternative to Room (though Room now has experimental KMP support too).",
          "**kotlinx.serialization** — compile-time, reflection-free JSON (and other formats) — works everywhere including Kotlin/Native, unlike Gson/Moshi. The KMP serialization standard.",
          "**Koin** — runtime DI that's multiplatform, so your DI graph is defined in commonMain and started per platform. The KMP DI choice (Hilt is Android-only). Some teams use manual DI in shared code instead.",
          "**androidx.lifecycle (ViewModel)** — since 2.8, `ViewModel`, `viewModelScope`, and (later) `SavedStateHandle` are multiplatform, so you can put ViewModels in commonMain and share presentation logic. Before this, teams used moko-mvvm or hand-rolled expect/actual ViewModels.",
        ],
      },
    ],
  },
  {
    heading: "Compose Multiplatform — sharing the UI too",
    blocks: [
      {
        t: "p",
        text: "**Compose Multiplatform (CMP)** extends Jetpack Compose to *other platforms* — you can write your UI *once* in Compose and run it on Android, iOS, desktop, and web. This goes beyond KMP's default 'share logic, keep native UI': with CMP you share the *UI too*, moving KMP closer to the Flutter/RN model (one UI codebase) — but using Compose, which Android developers already know.",
      },
      {
        t: "list",
        items: [
          "**How it relates to KMP** — CMP is a UI framework *built on* KMP. Plain KMP shares logic and keeps native UIs (SwiftUI on iOS); CMP lets you *also* share the Compose UI across platforms, so even iOS runs your Compose code (rendered via Skia, not native UIKit components).",
          "**Maturity by platform** — CMP is *stable* on Android (it's just Compose) and *desktop*; **iOS** reached stable in 2025 (production-ready but younger); web (Wasm) is still maturing. So the 'share the UI on iOS too' story is now viable but newer than the logic-sharing story.",
          "**The tradeoff — same as Flutter/RN's UI question**: sharing the UI via CMP maximizes code sharing (one Compose UI everywhere) but the iOS UI is *Compose-rendered* (via Skia), not native SwiftUI/UIKit — so it may not feel perfectly native or use the latest iOS-native UI features, similar to the Flutter tradeoff. Teams choosing CMP-on-iOS accept a Compose UI on iOS for the code-sharing benefit.",
          "**The spectrum** — KMP gives you a *choice* on the sharing spectrum: share *only logic* (native UIs — the conservative, native-feel-preserving default), or *also share the UI* (Compose Multiplatform — maximum sharing, Compose-rendered iOS UI). You can even mix (CMP for some screens, native for others). This flexibility — pick your sharing level per need — is a distinctive KMP strength.",
        ],
      },
    ],
  },
  {
    heading: "Project structure and the full picture",
    blocks: [
      {
        t: "code",
        title: "A typical KMP project layout",
        code: `myproject/
  shared/                    // KMP module — the shared logic (and maybe UI)
    src/commonMain/          // repositories, use cases, models, networking, ViewModels
    src/androidMain/         // Android actuals (db driver, etc.)
    src/iosMain/             // iOS actuals
  androidApp/                // Android app — Compose UI, depends on :shared
  iosApp/                    // Xcode project — SwiftUI (or CMP), imports shared framework
  // (multi-module: shared:domain, shared:data, shared:feature-x, umbrella for iOS)`,
      },
      {
        t: "list",
        items: [
          "**The shape** — a `shared` module (commonMain + platform source sets) consumed by an `androidApp` (Gradle dependency, Compose UI) and an `iosApp` (Xcode, the shared framework, SwiftUI or CMP UI).",
          "**Multi-module KMP** — larger apps modularize the shared code (`shared:domain`, `shared:data`, `shared:feature-x`), with an *umbrella* module exporting them into one iOS framework — combining KMP with the modularization patterns from that topic.",
          "**Build with Gradle** — the Kotlin Multiplatform plugin configures targets, source sets, and dependencies; the iOS app builds the framework as part of its Xcode build (via a Gradle task).",
        ],
      },
      {
        t: "note",
        text: "KMP libraries: commonMain uses MULTIPLATFORM libs — coroutines/Flow, Ktor (networking, replaces Retrofit), kotlinx.serialization (replaces Gson/Moshi), SQLDelight or Room-KMP (database), Koin (DI, replaces Hilt), kotlinx-datetime, androidx ViewModel (multiplatform since 2.8). JVM-only libs (Retrofit/Gson/Hilt) can't go in commonMain — hence the substitutions. Compose Multiplatform: share the UI too (Compose on Android/iOS/desktop/web) — stable on Android/desktop, iOS stable 2025, web maturing; iOS UI is Compose-rendered (Skia), not native — the Flutter-like tradeoff. KMP lets you choose the sharing level: logic-only (native UI) or also-UI (CMP).",
      },
    ],
  },
];

export default content;
