// Signing, R8 & Versioning — Content tab. Teaching-first.

const content = [
  {
    heading: "App signing — why every app is signed",
    blocks: [
      {
        t: "p",
        text: "**Every Android app must be cryptographically signed** to be installed. Signing serves two purposes: it *identifies* the app's author (proving updates come from the same developer), and it lets Android *verify integrity* (the app wasn't tampered with since signing). The critical rule: **an app update must be signed with the *same key* as the installed version** — Android rejects an update signed with a different key. So your signing key is precious: lose it, and you can't update your app (you'd have to publish a new app with a new package name).",
      },
      {
        t: "list",
        items: [
          "**Debug signing** — during development, Android Studio auto-signs with a debug keystore (a shared, insecure key). Fine for testing, never for release.",
          "**Release signing** — for publishing, you sign with *your own* keystore containing a private key you generate and guard. This is the identity of your app forever.",
          "**The keystore** — a file (`.jks`/`.keystore`) holding your key(s), protected by passwords. It (and its passwords) must be kept secure and backed up — losing it is catastrophic (you can never update the app).",
        ],
      },
    ],
  },
  {
    heading: "Configuring release signing",
    blocks: [
      {
        t: "code",
        title: "Signing config (keep credentials OUT of source)",
        code: `android {
    signingConfigs {
        create("release") {
            // Load from environment/properties — NEVER hardcode in the build file
            storeFile = file(System.getenv("KEYSTORE_PATH") ?: "release.keystore")
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = System.getenv("KEY_ALIAS")
            keyPassword = System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release { signingConfig = signingConfigs.getByName("release") }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Never commit keystore credentials** to version control — load them from environment variables, a `keystore.properties` file that's git-ignored, or CI secrets. Hardcoding passwords in `build.gradle` (which is committed) leaks them.",
          "**Signing schemes** — Android has evolved v1 (JAR signing), v2, v3 (key rotation support), and v4 signature schemes; modern builds use v2+ for faster verification and better security. AGP handles this.",
          "**With Play App Signing** (covered separately), Play holds your *app signing key* and you use an *upload key* — so even if the upload key is compromised, you can reset it, and the real signing key stays safe with Google.",
        ],
      },
    ],
  },
  {
    heading: "R8 / ProGuard — shrinking, obfuscation, keep rules",
    blocks: [
      {
        t: "p",
        text: "**R8** (the modern replacement for ProGuard) runs on release builds to shrink, obfuscate, and optimize code (covered in the Performance topic). Here the focus is the *practical build concern*: **keep rules** and the **mapping file**, which are frequent sources of release-only bugs and crash-debugging pain.",
      },
      {
        t: "list",
        items: [
          "**Keep rules (`proguard-rules.pro`)** — R8 uses static analysis to find reachable code, so anything accessed *reflectively* (by name at runtime) can be wrongly removed or renamed: some serialization (data classes referenced by name), DI, JNI/native calls, or classes referenced only from the manifest/XML. You write `-keep` rules to preserve them.",
          "**The classic bug** — the app works in debug (R8 off) but *crashes only in release* (R8 removed/renamed something reflective). Symptoms: `ClassNotFoundException`, `NoSuchMethodError`, serialization failing, or a library misbehaving. The fix is adding the right keep rules. Libraries ship their own; you add rules for *your* reflective code (and consumer rules for libraries you publish).",
          "**Mapping file** — obfuscation renames everything to `a`, `b`, `c`, so *crash stack traces from release builds are unreadable* (they show obfuscated names). R8 produces a `mapping.txt`; you **upload it to Play** (or your crash reporter — Crashlytics) so it can *de-obfuscate* stack traces back to real names. Without the mapping file, production crash reports are useless. Keep the mapping file for every release (it's per-build).",
          "**Testing** — always test the *release* build (or a minified staging build) before shipping, precisely to catch missing keep rules that only manifest with R8 on. Shipping a release you only tested in debug is how R8 crashes reach users.",
        ],
      },
    ],
  },
  {
    heading: "Versioning",
    blocks: [
      {
        t: "p",
        text: "An app has two version identifiers: **`versionCode`** (an integer, for the *system/Play* to order versions) and **`versionName`** (a string, for *users* to read). They serve different audiences and must be managed correctly for updates.",
      },
      {
        t: "code",
        title: "Version fields",
        code: `android {
    defaultConfig {
        versionCode = 42            // integer — MUST increase every Play release
        versionName = "2.3.1"       // string — shown to users (semantic versioning)
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`versionCode`** — a positive integer that the system and Play use to determine which version is *newer*. It **must strictly increase** with every release you upload to Play — Play rejects an upload with a versionCode ≤ an existing one, and updates only apply if the new versionCode is higher. Users never see it. Common schemes: simple increment, or derived from the version name / a build number.",
          "**`versionName`** — a human-readable string shown in the Play listing and app settings (e.g. `2.3.1`). Typically follows *semantic versioning* (major.minor.patch). It has *no* technical role in update ordering — that's `versionCode`'s job — so you could ship the same versionName with different versionCodes (though you normally bump both).",
          "**The rule that matters**: always increase `versionCode` for every Play release. Forgetting to (or reusing one) is a common upload rejection. With split APKs from an AAB, Play manages per-APK version codes derived from your base versionCode.",
        ],
      },
      {
        t: "note",
        text: "Signing: every app is cryptographically signed — identifies the author + verifies integrity; updates MUST use the same key (lose it = can't update). Keep the keystore + passwords secure and out of source control (env vars/CI secrets). R8/ProGuard: keep rules preserve reflectively-accessed code (missing ones = release-only crashes); upload the mapping.txt so crash reports de-obfuscate. Test the release build. Versioning: versionCode (integer, must strictly increase per Play release, for ordering) vs versionName (string, shown to users, semantic versioning).",
      },
    ],
  },
];

export default content;
