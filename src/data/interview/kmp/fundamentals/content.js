// KMP Fundamentals — Content tab. Teaching-first.

const content = [
  {
    heading: "What Kotlin Multiplatform is",
    blocks: [
      {
        t: "p",
        text: "**Kotlin Multiplatform (KMP)** lets you write code *once* in Kotlin and run it on *multiple platforms* — Android, iOS, desktop, web, and server. The key idea is **sharing *logic*, not necessarily UI**: you write your business logic, data layer, networking, and domain models once in shared Kotlin code, and each platform keeps its own native UI (or uses Compose Multiplatform for shared UI too). This is fundamentally different from cross-platform frameworks like Flutter or React Native, which typically abstract the UI too — KMP shares the *logic* and lets each platform be natively itself.",
      },
      {
        t: "list",
        items: [
          "**Share logic, keep native**: the appeal is writing the *hard, business-critical logic* once (so it can't diverge between platforms) while each app stays natively performant and platform-idiomatic. An iOS app using KMP is still a real iOS app (Swift UI, native feel), just with a shared Kotlin brain.",
          "**How it compiles**: Kotlin compiles to different targets — JVM bytecode (Android), native binaries via **Kotlin/Native** (iOS, using LLVM), JavaScript/Wasm (web). The *same* Kotlin source produces platform-appropriate output.",
          "**Not 'write once, run anywhere' for UI** — it's 'write the logic once, build native UIs' (unless you opt into Compose Multiplatform). This distinction is the most important thing to understand about KMP's philosophy.",
          "**Maturity** — KMP reached *Stable* (the core, in 2023); it's used in production by major companies (Netflix, McDonald's, Cash App, etc.). It's a mature, Google- and JetBrains-backed approach for an Android/KMP engineer.",
        ],
      },
    ],
  },
  {
    heading: "Source sets: commonMain and platform-specific",
    blocks: [
      {
        t: "p",
        text: "A KMP module organizes code into **source sets**. **`commonMain`** holds the *shared* code that compiles for *all* targets — it can only use Kotlin's multiplatform standard library and multiplatform libraries (no platform-specific APIs). Each platform has its own source set (`androidMain`, `iosMain`, `desktopMain`, `jsMain`) for platform-specific code that can use that platform's APIs.",
      },
      {
        t: "code",
        title: "The source set structure",
        code: `src/
  commonMain/     // shared — pure Kotlin, multiplatform libs only (no android.*, no Foundation)
    kotlin/
      Repository.kt
      DomainModels.kt
  androidMain/    // Android-specific — can use android.* APIs
    kotlin/
      AndroidDatabaseDriver.kt
  iosMain/        // iOS-specific — can use Foundation/UIKit via cinterop
    kotlin/
      IosDatabaseDriver.kt
  commonTest/     // shared tests
  androidUnitTest/, iosTest/  // platform tests`,
      },
      {
        t: "list",
        items: [
          "**`commonMain`** — the heart of KMP: your shared logic (repositories, use cases, models, networking, ViewModels). It can't reference `android.*`, iOS `Foundation`, or any single platform's API — only *multiplatform* code, which is enforced by the compiler.",
          "**Platform source sets** (`androidMain`, `iosMain`, …) — for code that *needs* platform APIs. When shared code needs something platform-specific (a database driver, secure storage, the current time formatted per locale), the platform source set provides it.",
          "**Hierarchy / intermediate source sets** — you can have intermediate sets shared by *some* targets (e.g. an `appleMain` shared by iOS/macOS), so code common to a subset of platforms isn't duplicated.",
          "**The rule** — put as much as possible in `commonMain` (that's the sharing benefit); drop to platform source sets only for genuinely platform-specific needs, connected via `expect/actual`.",
        ],
      },
    ],
  },
  {
    heading: "expect/actual — the platform bridge",
    blocks: [
      {
        t: "p",
        text: "When shared `commonMain` code needs something that's *implemented differently per platform* — the current platform name, a database driver, secure storage, a UUID generator — you use the **`expect`/`actual`** mechanism. In `commonMain` you declare an **`expect`** (a promise: 'this exists, each platform provides it'), and each platform source set provides the **`actual`** implementation. The compiler enforces that every target has an `actual` for every `expect`.",
      },
      {
        t: "code",
        title: "expect/actual for platform-specific behavior",
        code: `// commonMain — declare the expectation
expect class Platform() {
    val name: String
}
expect fun getSecureStorage(): SecureStorage

// androidMain — provide the Android implementation
actual class Platform actual constructor() {
    actual val name: String = "Android \${Build.VERSION.SDK_INT}"
}
actual fun getSecureStorage(): SecureStorage = AndroidKeystoreStorage()

// iosMain — provide the iOS implementation
actual class Platform actual constructor() {
    actual val name: String = UIDevice.currentDevice.systemName
}
actual fun getSecureStorage(): SecureStorage = IosKeychainStorage()`,
      },
      {
        t: "list",
        items: [
          "**`expect`** (in commonMain) — declares *what* is needed without *how*. Shared code uses it as a normal type/function. Can be a class, function, property, or object.",
          "**`actual`** (in each platform source set) — provides the *how* for that platform, using its native APIs. Every platform *must* supply an actual (compile-enforced), so there's no missing implementation.",
          "**When to use it** — for the *thin* platform-specific layer beneath shared logic: database drivers (Room/SQLDelight need a platform driver), secure storage (Keystore vs Keychain), platform info, date/locale formatting, random/UUID. The shared logic calls the `expect` and each platform fills in the `actual`.",
          "**The alternative — interfaces + DI**: instead of `expect/actual`, you can define an *interface* in commonMain and *inject* a platform implementation (constructed in platform code). Often preferred for testability (you can inject a fake) and flexibility — `expect/actual` is more rigid (exactly one implementation per platform, harder to fake). Many teams use interfaces+DI for most cases and `expect/actual` for simple platform primitives.",
        ],
      },
    ],
  },
  {
    heading: "Targets and project structure",
    blocks: [
      {
        t: "list",
        items: [
          "**Targets** — you declare which platforms your module builds for in the Gradle config: `androidTarget()`, `iosX64()`/`iosArm64()`/`iosSimulatorArm64()` (the iOS variants), `jvm()` (desktop/server), `js()`/`wasmJs()` (web). Each target gets its source set and produces its platform artifact.",
          "**Typical project shape** — a `shared` module (KMP, with commonMain + platform source sets) consumed by an `androidApp` (a normal Android app depending on `shared` as a Gradle dependency) and an `iosApp` (an Xcode project consuming the shared code as a *framework*).",
          "**The iOS framework** — Kotlin/Native compiles the shared module into an Obj-C-compatible *framework* (or XCFramework) that the iOS app imports and calls like any Swift/Obj-C library. This is how Swift code uses your shared Kotlin (covered in the iOS interop topic).",
          "**Gradle-based** — KMP is configured via the Kotlin Multiplatform Gradle plugin; you declare targets, source set dependencies, and shared libraries in `build.gradle.kts`. Dependencies can be common (available to all — Ktor, kotlinx.serialization, coroutines) or platform-specific.",
        ],
      },
      {
        t: "note",
        text: "KMP: write logic once in Kotlin, run on Android/iOS/desktop/web — shares LOGIC (not necessarily UI; each platform keeps native UI unless using Compose Multiplatform). Compiles via JVM bytecode (Android), Kotlin/Native (iOS, LLVM), JS/Wasm (web). Source sets: commonMain (shared, multiplatform-only, no platform APIs) + androidMain/iosMain/etc (platform-specific). expect/actual bridges platform differences (expect in common declares what, actual per platform provides how — for db drivers, secure storage, platform info); interfaces+DI is a testable alternative. Targets declared in Gradle; shared module → framework for iOS.",
      },
    ],
  },
];

export default content;
