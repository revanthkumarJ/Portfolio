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
  {
    level: "junior",
    q: "What is R8, and what does it do?",
    a: [
      {
        t: "p",
        text: "R8 is Android's default *code shrinker, optimizer, and obfuscator* (it replaced ProGuard). In release builds it: *shrinks* (tree-shakes unused classes/methods/fields), *optimizes* (inlining, dead-code removal, simplification), *obfuscates* (renames to short names, making reverse-engineering harder), and *dexes* (produces the final dex). The result is a smaller, faster-to-load, harder-to-reverse app. It's driven by `keep` rules that protect code R8 can't see is used (reflection, JNI, entry points).",
      },
      {
        t: "list",
        items: [
          "**Shrink** — remove unused code (tree-shaking).",
          "**Optimize** — inline, dead-code elimination.",
          "**Obfuscate** — rename to short names.",
          "**Driven by** — keep rules protecting reflectively-used code.",
        ],
      },
      {
        t: "note",
        text: "R8 (replaced ProGuard) is Android's release shrinker/optimizer/obfuscator: shrinks unused code (tree-shaking), optimizes (inlining, dead-code removal), obfuscates (renames), and dexes — smaller, faster-loading, harder-to-reverse app. Keep rules protect code R8 can't see is used (reflection, JNI, entry points).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between shrinking, optimization, and obfuscation?",
    a: [
      {
        t: "p",
        text: "*Shrinking* removes code/resources that are never used (smaller app). *Optimization* rewrites the remaining code to be faster/smaller (inlining, removing dead branches, merging). *Obfuscation* renames classes/methods to meaningless short names — it doesn't remove anything but makes the app harder to reverse-engineer (and slightly smaller). R8 does all three together in release. They're distinct goals: less code, faster code, and harder-to-read code.",
      },
      {
        t: "table",
        headers: ["Step", "Does", "Goal"],
        rows: [
          ["Shrink", "Remove unused code/resources", "Smaller app"],
          ["Optimize", "Rewrite code (inline, dead-code)", "Faster/smaller"],
          ["Obfuscate", "Rename to short names", "Harder to reverse"],
        ],
      },
      {
        t: "note",
        text: "Shrinking removes unused code/resources (smaller); optimization rewrites remaining code faster/smaller (inline, dead-code); obfuscation renames to meaningless names (harder to reverse, slightly smaller). R8 does all three in release. Distinct goals: less code, faster code, harder-to-read code.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you write and scope keep rules correctly?",
    a: [
      {
        t: "p",
        text: "Add `-keep` rules only for code R8 *can't see* is used: classes accessed by *reflection* (some DI, serialization), *JNI/native* entry points, classes referenced by name from the manifest/XML, and public library APIs. Scope them *narrowly* — keep specific classes/members, not whole packages (`-keep class **` bloats the app and defeats shrinking/obfuscation). Prefer annotations (`@Keep`) for individual members. Test the *release* build thoroughly — missing keeps cause `ClassNotFoundException`/`NoSuchMethodError` only in release.",
      },
      {
        t: "list",
        items: [
          "**Keep only** — reflection/JNI/manifest-referenced/library-API code.",
          "**Scope narrowly** — specific classes/members, not whole packages.",
          "**`@Keep`** — for individual members.",
          "**Test release** — missing keeps crash only there.",
        ],
      },
      {
        t: "note",
        text: "Write keep rules only for code R8 can't see is used (reflection, JNI, manifest/XML-referenced, public library APIs). Scope narrowly (specific classes/members, not -keep class ** which bloats and defeats shrinking); prefer @Keep for members. Test the release build — missing keeps cause ClassNotFoundException/NoSuchMethodError only in release.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between APK Signature Scheme v1, v2, v3, and v4?",
    a: [
      {
        t: "p",
        text: "*v1* (JAR signing) signs individual files — slow to verify, and doesn't protect the whole archive. *v2* (API 24+) signs the *entire APK* as a blob (faster, tamper-evident, protects everything). *v3* (API 28+) adds *key rotation* support (change signing key while trusting the old one). *v4* (API 30+) enables *incremental delivery* (fast ADB install / Play streaming) via a separate signature file. Modern signing uses v2+v3 (and v4 where applicable); enable all your min-SDK supports.",
      },
      {
        t: "table",
        headers: ["Scheme", "Since", "Adds"],
        rows: [
          ["v1 (JAR)", "Always", "Per-file signing (slow)"],
          ["v2", "API 24", "Whole-APK signing (fast, tamper-evident)"],
          ["v3", "API 28", "Key rotation"],
          ["v4", "API 30", "Incremental delivery"],
        ],
      },
      {
        t: "note",
        text: "v1 (JAR): per-file signing, slow, partial protection. v2 (API 24): whole-APK blob signing — fast, tamper-evident. v3 (API 28): key rotation. v4 (API 30): incremental delivery (fast ADB/Play streaming). Use v2+v3 (and v4 where applicable); enable all schemes your minSdk supports.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a signing config, and how do you set one up in Gradle?",
    a: [
      {
        t: "p",
        text: "A `signingConfig` tells Gradle *which keystore/key* to sign a build type with. You define it in `android { signingConfigs {} }` (store file, store password, key alias, key password) and reference it from a build type (`release { signingConfig = ... }`). Keep the *credentials out of source* (read from `local.properties`/env). With *Play App Signing*, you sign the *upload* artifact with your upload key and Play re-signs with the app key — so your local signing config uses the *upload* key.",
      },
      {
        t: "code",
        title: "Signing config (credentials externalized)",
        code: `signingConfigs {\n  create("release") {\n    storeFile = file(providers.gradleProperty("STORE_FILE").get())\n    storePassword = providers.gradleProperty("STORE_PASSWORD").get()\n    keyAlias = providers.gradleProperty("KEY_ALIAS").get()\n    keyPassword = providers.gradleProperty("KEY_PASSWORD").get()\n  }\n}\nbuildTypes { release { signingConfig = signingConfigs.getByName("release") } }`,
      },
      {
        t: "note",
        text: "A signingConfig specifies the keystore/key to sign a build type (store file/password, key alias/password) in android { signingConfigs {} }, referenced from a build type. Keep credentials out of source (local.properties/env). With Play App Signing, your local config uses the upload key; Play re-signs with the app key.",
      },
    ],
  },
  {
    level: "senior",
    q: "What happens if you lose your keystore (without Play App Signing)?",
    a: [
      {
        t: "p",
        text: "Without Play App Signing, the app-signing key *is* your keystore — losing it (or its password) means you *cannot update the app*: Play rejects any upload not signed with the original key, and users can't update (a differently-signed APK is treated as a different app requiring uninstall/reinstall). There's no recovery. This is exactly why *Play App Signing* is strongly recommended: Google securely holds the app key, and if you lose your *upload* key you can *reset* it — the app key is safe.",
      },
      {
        t: "list",
        items: [
          "**Key = keystore** — losing it blocks all future updates.",
          "**Play rejects** — uploads not signed with the original key.",
          "**No recovery** — users must uninstall/reinstall a re-signed app.",
          "**Play App Signing** — Google holds the app key; upload key is resettable.",
        ],
      },
      {
        t: "note",
        text: "Without Play App Signing, losing the app-signing keystore/password means you can never update the app — Play rejects differently-signed uploads and users can't update (a re-signed APK is a different app). No recovery. This is why Play App Signing is recommended: Google holds the app key; a lost upload key is resettable.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is key rotation, and how does Play App Signing support it?",
    a: [
      {
        t: "p",
        text: "*Key rotation* (APK Signature Scheme v3) lets you *change your signing key* while the platform still trusts apps signed by the old key (via a signed *proof of rotation*), so updates keep working. With Play App Signing you can *upgrade* the app-signing key (e.g. to a stronger key) and Play manages the rotation for compatible devices. Rotation is useful if a key is weak or potentially compromised; older devices may still rely on the original key.",
      },
      {
        t: "list",
        items: [
          "**Rotation (v3)** — change key while trusting the old one.",
          "**Proof of rotation** — links old → new key.",
          "**Play App Signing** — can upgrade/manage the app key.",
          "**Use** — weak/compromised key; older devices keep the original.",
        ],
      },
      {
        t: "note",
        text: "Key rotation (Signature Scheme v3) changes the signing key while the platform still trusts the old key via a signed proof of rotation, so updates keep working. Play App Signing can upgrade/manage the app key. Useful for a weak/compromised key; older devices may still rely on the original.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between the upload key and the app signing key?",
    a: [
      {
        t: "p",
        text: "With *Play App Signing*, there are two keys: the *upload key* signs the AAB you *upload* to Play (Play verifies it's really you), and the *app signing key* is what Play uses to *re-sign* the APKs delivered to users (the key devices actually trust). Google securely stores the app signing key. If you lose the *upload* key, you can request a reset (the app key is unaffected). Separating them means your most critical key never leaves Google.",
      },
      {
        t: "list",
        items: [
          "**Upload key** — signs your AAB upload; Play verifies it.",
          "**App signing key** — Play re-signs delivered APKs; devices trust it.",
          "**Google stores** — the app signing key securely.",
          "**Lost upload key** — resettable; app key safe.",
        ],
      },
      {
        t: "note",
        text: "Play App Signing uses two keys: the upload key signs the AAB you upload (Play verifies it's you), and the app signing key is what Play uses to re-sign delivered APKs (what devices trust — Google stores it). Lose the upload key → request a reset; the app key is unaffected. Your critical key never leaves Google.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does versionCode interact with Play's update model?",
    a: [
      {
        t: "p",
        text: "`versionCode` is an integer Play uses to order releases — a new upload must have a *higher* versionCode than any already on that track, and users are offered an update only to a *higher* code. You can't reuse or lower a versionCode. With multiple APKs/splits, each must have a distinct code. Common practice: derive versionCode from CI build number or a monotonic scheme so it always increases. `versionName` is the human string and doesn't affect update ordering.",
      },
      {
        t: "list",
        items: [
          "**Higher wins** — new upload must exceed existing codes.",
          "**Users update** — only to a higher versionCode.",
          "**No reuse/lower** — strictly increasing.",
          "**Practice** — derive from CI/monotonic scheme.",
        ],
      },
      {
        t: "note",
        text: "versionCode is the integer Play uses to order releases — a new upload must exceed existing codes on that track, and users update only to a higher code (no reuse/lowering). Derive it from a monotonic/CI scheme so it always increases. versionName is the human string and doesn't affect update ordering.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you debug a release-only crash caused by R8?",
    a: [
      {
        t: "p",
        text: "R8-related crashes (missing keep rules) appear only in release: `ClassNotFoundException`, `NoSuchMethodError`, or a library failing to find a class by reflection. Steps: *deobfuscate the stack trace* with the `mapping.txt` (via the Play Console or `retrace`), identify the removed/renamed class, and add a *narrow* keep rule for it. To confirm R8 is the cause, temporarily set `minifyEnabled false` — if the crash disappears, it's a shrinking/obfuscation issue. Then fix with a scoped keep, not by disabling R8.",
      },
      {
        t: "list",
        items: [
          "**Symptom** — ClassNotFound/NoSuchMethod only in release.",
          "**Deobfuscate** — with `mapping.txt` (retrace/Play).",
          "**Confirm** — `minifyEnabled false` makes it vanish.",
          "**Fix** — a narrow keep rule, not disabling R8.",
        ],
      },
      {
        t: "note",
        text: "R8 release-only crashes (missing keeps): ClassNotFoundException/NoSuchMethodError/reflection failures. Deobfuscate the trace with mapping.txt (retrace/Play), find the removed/renamed class, add a narrow keep. Confirm by temporarily setting minifyEnabled false (crash vanishes → shrinking issue). Fix with a scoped keep, not by disabling R8.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the mapping.txt file, and why must you retain it per release?",
    a: [
      {
        t: "p",
        text: "When R8 obfuscates, it produces `mapping.txt` — the map from *obfuscated names back to original*. Without it, production stack traces are unreadable (obfuscated names). You *upload it to Play (or Crashlytics) per release* so crash reports are *deobfuscated* automatically. Each release has a *unique* mapping (names differ per build), so you must retain the exact mapping for every version you ship. Losing it means you can't decode that version's crashes.",
      },
      {
        t: "list",
        items: [
          "**`mapping.txt`** — obfuscated → original names.",
          "**Upload per release** — Play/Crashlytics deobfuscate traces.",
          "**Unique per build** — retain each version's mapping.",
          "**Lost** — that version's crashes are undecodable.",
        ],
      },
      {
        t: "note",
        text: "R8 produces mapping.txt (obfuscated → original names). Upload it to Play/Crashlytics per release so production stack traces are deobfuscated automatically. Each build has a unique mapping — retain the exact one for every shipped version; losing it makes that version's crashes undecodable.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do libraries provide their own R8/ProGuard rules (consumer rules)?",
    a: [
      {
        t: "p",
        text: "Libraries ship *consumer ProGuard rules* (`consumerProguardFiles`) bundled in their AAR — these rules are *automatically applied* to any app that depends on them, so the app doesn't need to know the library's internal keep requirements. That's why most well-behaved libraries 'just work' with R8. If a library misbehaves under R8, check whether it ships consumer rules (or you must add keeps yourself). You add your app's own rules in `proguard-rules.pro`.",
      },
      {
        t: "list",
        items: [
          "**Consumer rules** — shipped in the library's AAR.",
          "**Auto-applied** — to dependent apps.",
          "**Why libraries 'just work'** — under R8.",
          "**App rules** — your own `proguard-rules.pro`.",
        ],
      },
      {
        t: "note",
        text: "Libraries ship consumer ProGuard rules (consumerProguardFiles) in their AAR, automatically applied to dependent apps — so apps don't need to know a library's internal keep requirements (why most libs 'just work' with R8). If a library breaks under R8, check for missing consumer rules or add keeps yourself. Your app's rules go in proguard-rules.pro.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why should you not disable R8 to fix a crash?",
    a: [
      {
        t: "p",
        text: "Disabling R8 (`minifyEnabled false`) makes a keep-rule crash disappear, but it's the *wrong fix*: you lose shrinking (bigger app), optimization (slower/larger), and obfuscation (easier to reverse-engineer). The right fix is a *narrow keep rule* for the specific class R8 wrongly removed. Disabling R8 for release also diverges your production build from best practice. Use `minifyEnabled false` only *temporarily* to *diagnose* that R8 is the cause, then re-enable and add the keep.",
      },
      {
        t: "list",
        items: [
          "**Disabling** — loses shrinking/optimization/obfuscation.",
          "**Right fix** — a narrow keep rule.",
          "**Diagnostic only** — toggle off to confirm R8 is the cause.",
          "**Re-enable** — then add the scoped keep.",
        ],
      },
      {
        t: "note",
        text: "Disabling R8 to kill a crash loses shrinking (bigger app), optimization (slower/larger), and obfuscation (easier to reverse). The right fix is a narrow keep rule for the wrongly-removed class. Use minifyEnabled false only temporarily to diagnose that R8 is the cause, then re-enable and add the scoped keep.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is full mode versus compatibility mode in R8?",
    a: [
      {
        t: "p",
        text: "R8 has a more aggressive *full mode* (default in recent AGP) that optimizes harder than the ProGuard-*compatibility* mode (which mimics ProGuard's more conservative behavior for easier migration). Full mode can shrink/optimize more but may need *additional or more precise keep rules* (it makes fewer conservative assumptions). If migrating from ProGuard-compat and hitting issues, you may need to tighten rules. Full mode is recommended for the best results once your rules are correct.",
      },
      {
        t: "list",
        items: [
          "**Full mode** — aggressive; default in recent AGP.",
          "**Compatibility mode** — mimics ProGuard (conservative).",
          "**Full mode** — better results but needs precise keeps.",
          "**Migrating** — may require tightening rules.",
        ],
      },
      {
        t: "note",
        text: "R8 full mode (recent-AGP default) optimizes more aggressively than ProGuard-compatibility mode (which mimics ProGuard's conservative behavior for easy migration). Full mode shrinks/optimizes harder but makes fewer conservative assumptions — may need additional/precise keep rules. Prefer full mode for best results once rules are correct.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you verify an APK's signature and which schemes it uses?",
    a: [
      {
        t: "p",
        text: "Use `apksigner verify --verbose app.apk` (from the build-tools) — it reports whether the APK is verified and *which schemes* (v1/v2/v3/v4) it's signed with, plus the signer certificate. `apksigner` can also *sign* an APK. For an AAB you inspect via bundletool. Verifying schemes matters: an APK signed only with v1 is slow/weaker; you want v2+ for modern devices. Check the certificate to confirm it's your key.",
      },
      {
        t: "code",
        title: "Verify signing",
        code: `apksigner verify --verbose --print-certs app.apk\n# prints: Verified using v1/v2/v3 scheme: true/false, signer certificate details`,
      },
      {
        t: "note",
        text: "apksigner verify --verbose app.apk reports whether the APK is verified, which schemes (v1/v2/v3/v4) it's signed with, and the signer certificate; apksigner can also sign. Inspect AABs via bundletool. Verify you have v2+ (not v1-only) and that the certificate is your key.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the security benefits of obfuscation, and its limits?",
    a: [
      {
        t: "p",
        text: "Obfuscation (renaming) makes decompiled code *harder to read* — raising the effort to reverse-engineer logic, find keys, or tamper. But it's *not encryption*: a determined attacker can still decompile and analyze, and *strings/resources aren't obfuscated*. So don't rely on it to hide secrets (they're extractable) or enforce security. Treat it as *defense-in-depth* — combine with server-side validation, no embedded secrets, integrity checks (Play Integrity), and encryption for real protection.",
      },
      {
        t: "list",
        items: [
          "**Benefit** — harder to read/reverse; raises attacker effort.",
          "**Not encryption** — code is still decompilable.",
          "**Strings/resources** — not obfuscated.",
          "**Defense-in-depth** — + server validation, Play Integrity, no embedded secrets.",
        ],
      },
      {
        t: "note",
        text: "Obfuscation makes decompiled code harder to read (raises reverse-engineering effort) but isn't encryption — code is still decompilable and strings/resources aren't obfuscated. Don't rely on it to hide secrets (extractable). Treat as defense-in-depth: combine with server-side validation, Play Integrity, no embedded secrets, and encryption.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does R8 handle resource shrinking, and what is the strict vs safe mode?",
    a: [
      {
        t: "p",
        text: "Resource shrinking (`shrinkResources true`) removes resources unreferenced by the *kept code*. It has a *safe* (default) mode that keeps resources referenced *dynamically* (e.g. `Resources.getIdentifier`) to avoid breaking them, and a *strict* mode that removes even those unless explicitly kept — smaller but riskier. Protect dynamically-referenced resources with a `keep.xml` (`tools:keep`/`tools:discard`). Verify the release build actually shows the intended resources (missing images/strings signal over-shrinking).",
      },
      {
        t: "list",
        items: [
          "**Removes** — resources unreferenced by kept code.",
          "**Safe mode** — keeps dynamically-referenced resources.",
          "**Strict mode** — removes those too unless kept (smaller, riskier).",
          "**Protect** — `keep.xml` (`tools:keep`/`tools:discard`).",
        ],
      },
      {
        t: "note",
        text: "Resource shrinking removes resources unreferenced by kept code. Safe mode (default) keeps dynamically-referenced ones (getIdentifier); strict mode removes those too unless kept (smaller, riskier). Protect dynamic resources with keep.xml (tools:keep/tools:discard). Verify the release build shows intended resources — missing images/strings mean over-shrinking.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is zipalign, and does it still matter?",
    a: [
      {
        t: "p",
        text: "`zipalign` aligns uncompressed data in the APK on 4-byte (or, for native libs, page) boundaries so the OS can *mmap* them directly, reducing runtime memory. It's a required release step — but with modern tooling and Play App Signing / the App Bundle, *Play/Gradle handle alignment automatically* (the AGP and `apksigner` pipeline aligns). You rarely run `zipalign` manually now; just know it's part of producing a correctly-packaged release APK.",
      },
      {
        t: "list",
        items: [
          "**Aligns** — uncompressed data on boundaries for mmap.",
          "**Benefit** — lower runtime memory.",
          "**Automatic** — AGP/apksigner/Play handle it.",
          "**Rarely manual** — but part of a correct release.",
        ],
      },
      {
        t: "note",
        text: "zipalign aligns uncompressed APK data on 4-byte/page boundaries so the OS can mmap directly (lower runtime memory) — a required release step, but modern AGP/apksigner/Play handle it automatically. You rarely run it manually now; just know it's part of a correctly-packaged release.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you keep model classes used by reflection (Gson/serialization) from being stripped?",
    a: [
      {
        t: "p",
        text: "Reflection-based serializers (Gson, older Moshi reflective mode) access model fields *by name at runtime* — R8, seeing no direct references, may *rename or remove* fields, breaking (de)serialization silently (nulls) or with errors. Fix: keep the model classes/fields (`-keep class com.app.model.** { *; }` scoped to models, or `@Keep`). Better: use *codegen* serializers (kotlinx.serialization, Moshi codegen) that generate direct code R8 can see — no keep rules needed and faster.",
      },
      {
        t: "code",
        title: "Keeping reflective models (or avoid via codegen)",
        code: `# scoped keep for reflectively-serialized models\n-keep class com.app.data.model.** { *; }\n# BETTER: kotlinx.serialization / Moshi codegen needs no keep rules`,
      },
      {
        t: "note",
        text: "Reflection serializers (Gson, reflective Moshi) access fields by name — R8 may rename/remove them, breaking (de)serialization (silent nulls/errors). Fix: scoped keep of the model classes/fields or @Keep. Better: codegen serializers (kotlinx.serialization, Moshi codegen) generate direct code R8 sees — no keep rules, faster.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between debug signing and release signing?",
    a: [
      {
        t: "p",
        text: "*Debug* builds are auto-signed with a *debug keystore* (`~/.android/debug.keystore`) generated by the SDK — shared, insecure, only for development/testing (not accepted by Play). *Release* builds must be signed with *your own release key* (a keystore you create and guard), which establishes app identity for Play and updates. Never publish a debug-signed build. The debug key is convenient for local runs; the release key is a guarded, long-lived secret.",
      },
      {
        t: "list",
        items: [
          "**Debug** — auto debug keystore; dev only, not for Play.",
          "**Release** — your own guarded release key.",
          "**Release key** — app identity + update chain.",
          "**Never** — publish a debug-signed build.",
        ],
      },
      {
        t: "note",
        text: "Debug builds are auto-signed with the shared debug keystore (~/.android/debug.keystore) — dev/testing only, not accepted by Play. Release builds use your own guarded release key (app identity + update chain). Never publish a debug-signed build. Debug key = convenience; release key = a guarded long-lived secret.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you validate that shrinking didn't break anything before release?",
    a: [
      {
        t: "p",
        text: "Always test the *actual release (minified) build*, not just debug. Run your full test suite against a release build (or a `minifyEnabled true` benchmark variant), do a manual QA pass over reflection-heavy paths (serialization, DI, navigation, deep links), and use the *Play pre-launch report* to catch crashes on real devices. Add *instrumentation tests* that exercise serialization/reflection. Missing keeps only manifest in minified builds, so debug passing tells you nothing about R8 correctness.",
      },
      {
        t: "list",
        items: [
          "**Test the minified build** — not just debug.",
          "**QA reflection paths** — serialization, DI, deep links.",
          "**Pre-launch report** — real-device crash detection.",
          "**Debug passing** — says nothing about R8 correctness.",
        ],
      },
      {
        t: "note",
        text: "Validate shrinking by testing the actual release (minified) build: run the test suite against it, QA reflection-heavy paths (serialization, DI, navigation, deep links), and use the Play pre-launch report for real-device crashes. Missing keeps only show in minified builds — debug passing tells you nothing about R8 correctness.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is Play Integrity API, and how does it relate to app protection?",
    a: [
      {
        t: "p",
        text: "The *Play Integrity API* lets your app/server verify that a request comes from a *genuine, unmodified app binary* installed from Play, running on a *genuine Android device* — helping detect tampered APKs, emulators, or abusive clients. It returns a signed verdict your *server* validates before trusting sensitive actions. It complements obfuscation/signing (which don't stop a determined attacker) by moving trust decisions server-side. Use it for anti-abuse, not as the only defense.",
      },
      {
        t: "list",
        items: [
          "**Verifies** — genuine unmodified app + genuine device + Play install.",
          "**Signed verdict** — validated server-side.",
          "**Detects** — tampered APKs, emulators, abuse.",
          "**Complements** — signing/obfuscation; server-side trust.",
        ],
      },
      {
        t: "note",
        text: "The Play Integrity API verifies a request comes from a genuine, unmodified app (Play-installed) on a genuine device, returning a signed verdict your server validates before trusting sensitive actions — detecting tampered APKs, emulators, abuse. It complements signing/obfuscation by moving trust server-side. Use for anti-abuse, not as the sole defense.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you create a release keystore and keep it safe?",
    a: [
      {
        t: "p",
        text: "Create one with `keytool -genkeypair` (or Android Studio's *Generate Signed Bundle* wizard), choosing a *long validity* (25+ years) and strong passwords. Then guard it: *back it up securely* (it's irreplaceable without Play App Signing), *never commit it* to VCS, store passwords in a secret manager/CI secrets (not in `build.gradle`), and restrict access. Enroll in *Play App Signing* so a lost *upload* key is recoverable. Treat the keystore as a top-tier secret.",
      },
      {
        t: "code",
        title: "Generate a keystore",
        code: `keytool -genkeypair -v -keystore release.jks \\\n  -keyalg RSA -keysize 2048 -validity 10000 -alias upload\n# then: back up securely, never commit, store passwords in secrets`,
      },
      {
        t: "note",
        text: "Create a release keystore with keytool -genkeypair (or Studio's wizard) — long validity, strong passwords. Guard it: back up securely (irreplaceable without Play App Signing), never commit, store passwords in CI/secret manager not build.gradle, restrict access. Enroll in Play App Signing so a lost upload key is recoverable. Top-tier secret.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between R8 and ProGuard?",
    a: [
      {
        t: "p",
        text: "*ProGuard* was the older, separate shrinker/optimizer/obfuscator. *R8* replaced it as Android's default — it does the same job (shrink/optimize/obfuscate) *plus dexing* in one integrated, faster pass, and generally optimizes better. Crucially, R8 *reuses ProGuard's rules syntax* (`proguard-rules.pro`, `-keep`), so existing rules carry over. Today you use R8; 'ProGuard rules' just refers to the rule file format R8 consumes. There's no reason to use standalone ProGuard on modern AGP.",
      },
      {
        t: "list",
        items: [
          "**ProGuard** — older, separate tool.",
          "**R8** — default replacement; shrink+optimize+obfuscate+dex, faster.",
          "**Same rule syntax** — `-keep` carries over.",
          "**Today** — use R8; 'ProGuard rules' = the rule format.",
        ],
      },
      {
        t: "note",
        text: "ProGuard was the older separate shrinker/optimizer/obfuscator; R8 replaced it as the default — same job plus dexing in one faster, better-optimizing pass, reusing ProGuard's rule syntax (-keep, proguard-rules.pro). Use R8 today; 'ProGuard rules' just means the rule format R8 consumes. No reason for standalone ProGuard on modern AGP.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you reduce app size with shrinking beyond the defaults?",
    a: [
      {
        t: "p",
        text: "Beyond `minifyEnabled`/`shrinkResources`: remove unused *dependencies* and unused *resources/translations* (`resConfigs` to limit locales you actually ship), use *R8 full mode*, prefer *vectors/WebP*, split via the *App Bundle* (per-device delivery), avoid reflection-heavy libraries (they force broad keeps), and audit with the *APK Analyzer*. Ensure keep rules are *tight* (broad keeps prevent shrinking). Measure the result and iterate on the biggest contributors.",
      },
      {
        t: "list",
        items: [
          "**Remove** — unused deps, resources, `resConfigs` locales.",
          "**R8 full mode + tight keeps** — maximize shrinking.",
          "**App Bundle** — per-device delivery.",
          "**Audit** — APK Analyzer for biggest contributors.",
        ],
      },
      {
        t: "note",
        text: "Beyond minify/shrinkResources: drop unused dependencies/resources, limit locales (resConfigs), use R8 full mode with tight keeps (broad keeps block shrinking), vectors/WebP, App Bundle per-device delivery, avoid reflection-heavy libs (force broad keeps). Audit with the APK Analyzer and iterate on the biggest contributors.",
      },
    ],
  },
];

export default qa;
