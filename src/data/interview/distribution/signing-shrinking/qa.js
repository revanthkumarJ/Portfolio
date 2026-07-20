// Signing, R8 & Versioning — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "Why must Android apps be signed?",
    a: [
      {
        t: "p",
        text: "**Every Android app must be cryptographically signed to be installed, for two reasons: signing *identifies the author* (proving updates come from the same developer) and lets Android *verify integrity* (the app wasn't tampered with since it was signed).** The system uses the signature to establish trust in who published the app and that it hasn't been modified.",
      },
      {
        t: "list",
        items: [
          "**Author identity** — the signature ties the app to a developer's key. This is how Android knows an update genuinely comes from the same source as the installed app.",
          "**Integrity** — the signature verifies the app's contents haven't been altered (by malware, a repackaging attack) since signing.",
          "**The critical rule** — an *update must be signed with the same key* as the installed version. Android rejects an update signed with a different key.",
        ],
      },
      {
        t: "p",
        text: "The practical consequence of that rule is that your signing key is *precious and permanent*: if you lose it, you can never update your app again (a different key would be rejected as an update) — you'd have to publish a *new* app with a new package name and lose your existing users' upgrade path. So the keystore holding your key, and its passwords, must be securely stored and backed up. During development, Android Studio auto-signs with a throwaway debug key (fine for testing), but for release you sign with your own carefully-guarded key. This is also why Play App Signing exists — to let Google securely hold your app signing key so you can't lose it.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between versionCode and versionName?",
    a: [
      {
        t: "p",
        text: "**`versionCode` is an integer used by the *system and Play* to determine which version is newer; `versionName` is a string shown to *users*.** They serve different audiences and roles.",
      },
      {
        t: "list",
        items: [
          "**`versionCode`** — a positive integer (e.g. `42`) that Android and Play use to order versions. It **must strictly increase** with every release you upload — Play rejects an upload whose versionCode is ≤ an existing one, and an update only applies if the new versionCode is higher. Users never see it. It's the *technical* version identifier.",
          "**`versionName`** — a human-readable string (e.g. `2.3.1`) shown in the Play listing and app settings, typically following semantic versioning (major.minor.patch). It has *no* technical role in update ordering — that's entirely `versionCode`'s job. It's the *user-facing* version.",
        ],
      },
      {
        t: "p",
        text: "The rule that matters in practice: **always increase `versionCode` for every Play release** — forgetting to (or reusing one) causes an upload rejection, and it's what determines whether users get the update. `versionName` you bump for meaningful releases per your versioning scheme, but technically you could ship the same versionName with different versionCodes. A common mistake is bumping only versionName and forgetting versionCode, which Play rejects. So: versionCode = the integer the system uses to know 'this is newer' (must go up); versionName = the string users read.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a keystore and how do you keep signing credentials secure?",
    a: [
      {
        t: "p",
        text: "**A keystore is a file (`.jks`/`.keystore`) that holds your app's signing key(s), protected by passwords. It's the cryptographic identity of your app — you use it to sign release builds.** Because an app update must be signed with the same key, the keystore is effectively permanent and irreplaceable: lose it and you can't update your app.",
      },
      {
        t: "list",
        items: [
          "**Never commit credentials to version control** — the keystore file, and especially its passwords, must *not* be hardcoded in `build.gradle` (which is committed) or checked into git. Doing so leaks your signing identity to anyone with repo access.",
          "**Load credentials from outside source control** — from environment variables, a git-ignored `keystore.properties` file, or (for CI) encrypted secrets. The build script reads them at build time without them being in the committed code.",
          "**Back up the keystore securely** — since losing it means never being able to update the app, keep secure backups (encrypted, in a safe place). This is a genuine business risk.",
        ],
      },
      {
        t: "p",
        text: "The modern best practice that mitigates the risk is **Play App Signing**: instead of holding the real app signing key yourself, you let Google Play hold it, and you sign your *uploads* with a separate *upload key*. If the upload key is ever compromised, you can reset it with Google's help — but the actual app signing key stays safely with Google, so you can't lose it and updates always work. This is why Play App Signing is required for AAB and strongly recommended: it removes the single-point-of-failure risk of you losing your one irreplaceable key.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why do R8 keep rules matter, and what's the classic bug they cause?",
    a: [
      {
        t: "p",
        text: "**R8 keep rules matter because R8 uses *static analysis* to determine which code is reachable and removes/renames the rest — but it *cannot see* code accessed *reflectively* (by name at runtime), so without keep rules, R8 wrongly removes or renames that code, causing crashes. The classic bug is 'works in debug, crashes only in release' — because R8 runs only on release builds.**",
      },
      {
        t: "list",
        items: [
          "**Why it happens**: R8 traces reachability through *static* references (direct method calls, type usage). Code that's only referenced *by name at runtime* — via reflection — is invisible to this analysis, so R8 thinks it's unused and removes it, or renames it (obfuscation) so the reflective lookup by the original name fails. Common culprits: serialization libraries that look up data classes/fields by name, dependency injection using reflection, JNI/native code calling Java by name, classes referenced only from the manifest or XML layouts, and enums used reflectively.",
          "**The classic symptom — release-only crashes**: the app works perfectly in *debug* (where R8 is off — code isn't shrunk or renamed) but *crashes in release* with `ClassNotFoundException`, `NoSuchMethodError`, serialization failures, or a library silently misbehaving. Because the difference is R8, and R8 only runs on release, the bug is invisible during normal debug development — it appears only when you build/test a release, or worse, only in production if you didn't test the release build.",
          "**The fix — `-keep` rules**: you add rules in `proguard-rules.pro` telling R8 to *preserve* (not remove, not rename) the reflectively-accessed classes/members. Well-behaved libraries *ship their own* keep rules (consumer rules bundled in the library), so their reflective needs are handled automatically — but you must add rules for *your own* reflective code (e.g. keeping your serializable model classes if using a reflection-based serializer, though kotlinx.serialization avoids this by being compile-time).",
        ],
      },
      {
        t: "list",
        items: [
          "**Prevention — test the release build**: the reliable way to catch missing keep rules is to *build and test a minified (release or staging) build* before shipping, not just debug. Many teams have a minified `staging` build type and run QA/automated tests against it. Shipping a release you only tested in debug is exactly how R8 crashes reach users.",
          "**Reduce reliance on reflection**: using compile-time tools (kotlinx.serialization instead of reflection-based Gson, KSP-based DI) minimizes the reflective code R8 can't see, reducing the keep-rule surface and the risk entirely.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the root cause is a *mismatch between R8's static analysis and runtime reflection* — R8 optimizes based on what it can *see* statically, and reflection is invisible to it, so reflectively-used code gets removed/renamed unless explicitly kept. This produces the insidious 'debug works, release crashes' bug precisely because R8 only runs on release, so the failure mode is hidden during ordinary development. The defenses are: keep rules for necessary reflection, *testing the release/minified build* (the discipline that catches it), and preferring compile-time libraries that avoid reflection. Knowing *why* it happens (static analysis vs runtime reflection), the *signature symptom* (release-only crashes), and the *prevention* (keep rules + test the minified build + avoid reflection) is exactly the practical R8 competence these questions probe — it's a bug that has burned nearly every Android developer.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is the R8 mapping file important, and what happens without it?",
    a: [
      {
        t: "p",
        text: "**The mapping file (`mapping.txt`) records how R8 renamed every class, method, and field during obfuscation (original name → obfuscated name). It's important because obfuscation makes *release crash stack traces unreadable* — they show meaningless names like `a.b.c()` instead of real names — and the mapping file is what *de-obfuscates* them back to the original names. Without it, production crash reports are essentially useless.**",
      },
      {
        t: "list",
        items: [
          "**What obfuscation does to crashes**: R8 renames `com.myapp.PaymentProcessor.processPayment()` to something like `a.b.a()`. When that code crashes in production, the stack trace reported from users' devices shows the *obfuscated* names — `at a.b.a(Unknown Source)` — which tells you nothing about *where* or *what* actually crashed. You can't debug from unreadable stack traces.",
          "**What the mapping file does**: it's the dictionary mapping obfuscated names back to originals. A de-obfuscation tool (or Play / your crash reporter) uses it to translate the obfuscated stack trace back into `at com.myapp.PaymentProcessor.processPayment()`, making the crash report readable and debuggable.",
          "**Where it goes**: you **upload the mapping file to Play** (Play Console associates it with the release and de-obfuscates crash reports in Android Vitals) *and/or* to your crash-reporting SDK (Crashlytics uploads it automatically via a Gradle plugin, so Crashlytics de-obfuscates traces). Either way, the mapping must reach wherever you read crash reports.",
        ],
      },
      {
        t: "list",
        items: [
          "**It's per-build — you must keep every release's mapping**: R8 renames things *differently* on each build (a change in code can shift the obfuscated names), so *each release has its own mapping file*, and it only de-obfuscates crashes from *that specific build*. So you must retain (or upload) the mapping file for *every* release you ship — if a crash comes from version 2.3.1 and you've lost 2.3.1's mapping, you can't de-obfuscate it. CI pipelines archive/upload the mapping per release automatically.",
          "**The consequence of not having it**: production crashes from real users become undebuggable — you see that *something* crashed and how often, but not *what*, so you can't fix it. For an obfuscated release app, the mapping file is the difference between actionable crash reports and useless ones. This makes 'upload the mapping file for every release' a non-negotiable part of the release process.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: obfuscation is a *tradeoff* — it shrinks the app and lightly protects the code, but it *destroys* the readability of stack traces, and the mapping file is what recovers that readability for *your* debugging while keeping the shipped code obfuscated. So the mapping file is the essential companion to R8 obfuscation: without it, you get the size/security benefits but lose the ability to diagnose production crashes, which is unacceptable. The operational requirements — upload it to Play and/or your crash reporter, and *retain it per release* (since each build's obfuscation is unique) — must be baked into the release/CI process, because a crash report you can't de-obfuscate is a bug you can't fix. Understanding that obfuscation and the mapping file are two halves of one mechanism (obscure the release, but keep the key to read its crashes), and that the mapping is per-build and must be preserved for every version, is the complete answer.",
      },
    ],
  },
];

export default qa;
