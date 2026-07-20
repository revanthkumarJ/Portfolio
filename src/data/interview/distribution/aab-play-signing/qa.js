// AAB, APK & Play App Signing — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is an APK?",
    a: [
      {
        t: "p",
        text: "**An APK (Android Package) is the file that packages a complete app for installation on a device — it contains the compiled code (DEX), resources, assets, the manifest, and native libraries, all cryptographically signed. It's what actually gets installed and run on the device.** It's the on-device runtime format.",
      },
      {
        t: "list",
        items: [
          "A **universal APK** contains everything for every device — all screen densities, all CPU architectures, all languages — so any device can install it. The downside is size: every device downloads resources it can't use.",
          "**Split APKs** are the modern approach — an app is delivered as a *base* APK plus *configuration* APKs (per density, per architecture, per language), so each device installs only the base plus the splits matching it. This is what Play generates from an App Bundle.",
          "You still **build and test with APKs** during development, but for publishing you upload an App Bundle (AAB), from which Play generates the APKs.",
        ],
      },
      {
        t: "p",
        text: "So the APK is the fundamental installable/runnable unit — a device runs an APK. The evolution has been from shipping one universal APK (simple but wasteful) to Play generating device-tailored split APKs from an App Bundle (smaller downloads). Understanding that the APK is what's *installed* — while the AAB is what you *publish* — is the key distinction.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is an Android App Bundle (AAB) and why did Google make it mandatory?",
    a: [
      {
        t: "p",
        text: "**An AAB (Android App Bundle) is a *publishing format* — you upload one AAB containing all your app's code and resources for all configurations, and Google Play generates optimized, device-specific split APKs from it, delivering only what each device needs. The AAB itself is not installable; it's an intermediate format Play processes.** Google made it mandatory for new apps (since 2021) primarily to reduce download sizes.",
      },
      {
        t: "list",
        items: [
          "**The problem it solves**: a universal APK forces every device to download resources for densities, CPU architectures, and languages it doesn't use. That's wasteful.",
          "**How the AAB fixes it**: Play splits the bundle by density, architecture, and language, delivering a tailored, smaller APK per device — often 15-35% smaller downloads, with no code changes on your part.",
          "**AAB vs APK**: the APK is the *installable* artifact a device runs; the AAB is a *publishing* format you upload (not directly installable). Develop/test with APKs, publish an AAB.",
        ],
      },
      {
        t: "p",
        text: "Beyond size, the AAB format also enables dynamic feature delivery (on-demand modules), asset packs (large assets delivered separately, useful for games), and conditional/instant delivery. Google made it mandatory because the download-size reduction benefits users (faster installs, less data/storage) at essentially no cost to developers, and it lets Play optimize delivery centrally. One practical note: since Play generates the actual delivered APKs (not you), testing the *real* output requires `bundletool` (to generate device-specific APKs from the AAB locally) or Play's internal test track — you can't just install the AAB directly.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Play App Signing?",
    a: [
      {
        t: "p",
        text: "**Play App Signing is the system where Google Play holds your app's real signing key and signs the APKs it delivers to users, while you sign your *uploads* with a separate *upload key*.** It's required for publishing App Bundles, because Play *generates* the device-specific APKs from your AAB and therefore must be the one to sign them.",
      },
      {
        t: "list",
        items: [
          "**Two keys**: the **app signing key** (the real key end-user APKs are signed with — Google holds it securely) and the **upload key** (which you use to sign the AAB you upload — Play verifies it, then re-signs the generated APKs with the app signing key).",
          "**Why it's needed for AAB**: Play generates the split APKs *after* you upload the bundle (they didn't exist at your build time), so Play must sign them — which means Play needs to hold a signing key. That's the app signing key.",
          "**The big benefit — recoverability**: if your *upload key* is lost or compromised, you can reset it with Google's help; you're not locked out. The real app signing key stays safely with Google, so it can't be lost and updates always remain possible.",
        ],
      },
      {
        t: "p",
        text: "This directly solves the catastrophic 'lose your key, can't update your app' risk of holding your single irreplaceable signing key yourself. With Play App Signing, the irreplaceable key is safe with Google (better secured than most developers can manage), and the key *you* handle (the upload key) is *replaceable*. When enrolling, Play can either generate the app signing key for you or let you upload your existing one. So Play App Signing both enables AAB delivery (Play can sign the generated APKs) and removes the single-point-of-failure of key loss.",
      },
    ],
  },
  {
    level: "senior",
    q: "Walk through what happens from building an AAB to a user installing the app, including signing.",
    a: [
      {
        t: "p",
        text: "**The pipeline separates *your* responsibility (build and upload a bundle signed with your upload key) from *Play's* (generate device-specific split APKs and sign them with the app signing key it holds), ending with the device downloading only the splits it needs. The signing has two distinct keys at two distinct stages.**",
      },
      {
        t: "list",
        items: [
          "**1. You build the AAB, signed with the *upload key***: `./gradlew bundleRelease` produces an `.aab` containing all your app's code and resources for every configuration (all densities, architectures, languages). It's signed with your *upload key* — the key you hold and that authenticates the upload to Play. (R8 has already shrunk/obfuscated the code, and you've kept the mapping file.)",
          "**2. You upload the AAB to Play Console**: Play *verifies the upload key signature* to confirm the bundle genuinely came from you. If the upload key doesn't match, Play rejects it. At this point the AAB is Play's to process.",
          "**3. Play generates device-specific split APKs from the AAB**: Play's server-side build system carves the bundle into a *base* APK plus *configuration* APKs — split by density, ABI (architecture), and language. These are the actual installable artifacts, and they *did not exist* when you built the bundle — Play created them.",
          "**4. Play signs the generated APKs with the *app signing key***: because Play generated these APKs, Play must sign them — using the *app signing key* it holds (a different key from your upload key). This is why Play App Signing is required for AAB: the entity that generates the APKs (Play) must sign them, so Play holds the real signing key.",
          "**5. A device installs the matching splits**: when a specific device installs your app, Play delivers the base APK plus only the config splits matching *that device* (its screen density, its CPU architecture, its languages). The device assembles them into the running app — a small, tailored download excluding all the other densities/architectures/languages.",
        ],
      },
      {
        t: "list",
        items: [
          "**The two-key separation is the crux**: the *upload key* (yours, resettable) authenticates *you* to Play at upload; the *app signing key* (Google's, safe) signs the *delivered APKs* to the user. They're decoupled so that (a) Play *can* sign the APKs it generates, and (b) if your upload key is compromised you reset it without affecting the app's actual signature or locking you out. From the user's device's perspective, the app is signed by the app signing key — consistent across all versions (satisfying the same-key-for-updates rule), managed by Google.",
          "**Update consistency**: because Play always signs delivered APKs with the same app signing key, updates always verify correctly (same-key rule), even though you only ever handle the upload key. This is what makes key loss non-catastrophic — the update-critical key never leaves Google.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the pipeline works by *deferring both packaging and final signing to Play*, which has what you lack — the specific installing device (for splitting) and secure key custody (for signing). The elegance is the two-key indirection: you authenticate uploads with a *replaceable* upload key, while the *irreplaceable* app signing key that satisfies the same-key-update rule is held by Google, generated fresh per-device-APK at delivery. This simultaneously enables the App Bundle's per-device optimization (Play must generate and sign the splits, so it must hold a key) *and* removes the historical single-point-of-failure of developers guarding one irreplaceable key. Understanding *why* the two keys exist (Play generates the APKs so Play must sign them; the upload key is decoupled so it's resettable), *what each stage does* (build+upload-key → verify → generate splits → app-signing-key → deliver matching splits), and *how it preserves update consistency* (same app signing key always) is the comprehensive answer that ties together the AAB, split delivery, and Play App Signing into one coherent system.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test the actual APKs that Play will deliver to users from your AAB?",
    a: [
      {
        t: "p",
        text: "**Because Play generates the device-specific split APKs from your AAB (you never build them directly), testing the *actual delivered artifacts* requires either `bundletool` (to generate device-specific APKs from your AAB locally) or Play's internal/closed testing tracks (which serve the real Play-generated APKs). You can't fully validate delivery by just installing a universal/debug APK, because that's not what users receive.**",
      },
      {
        t: "list",
        items: [
          "**Why this is a real concern**: the split-APK delivery introduces things that a monolithic debug APK doesn't exercise — per-density resource loading, per-ABI native libraries, per-language resource splits, and (if used) dynamic feature module installation. A bug could exist in the *split* delivery (a resource in the wrong split, a missing language, a native lib not delivered for an architecture, a dynamic feature that fails to install) that never appears when you run a universal debug build. So testing the real output matters.",
          "**`bundletool` — local testing of the real splits**: `bundletool` is the same tool Play uses to generate APKs from a bundle. You can run it locally to produce a set of APKs (`.apks`) from your AAB, then either extract the APKs for a *specific device configuration* (using `bundletool build-apks --connected-device` to build exactly what that device would get) and install them, or generate a *universal* APK from the bundle for broad testing. `bundletool install-apks` deploys the correct device-specific splits to a connected device — so you're testing the *actual* split composition that device would receive from Play.",
          "**Play internal/closed testing tracks — the real thing**: uploading the AAB to Play's *internal testing* track (fast, for a small trusted group) or *closed testing* track and installing through Play delivers the *genuinely Play-generated and Play-signed* APKs to testers' devices — the exact artifacts production users would get, including the correct splits and app-signing-key signature. This is the highest-fidelity test because it exercises the entire real delivery pipeline (generation, signing, per-device splitting, even staged rollout mechanics).",
        ],
      },
      {
        t: "list",
        items: [
          "**A practical testing progression**: develop/debug with normal (universal) debug APKs for speed; use `bundletool` to validate the *release* AAB's device-specific splits locally on representative devices before uploading; then use Play *internal testing* to verify the real Play-delivered, Play-signed artifacts (and the release process itself) before promoting to closed/open/production. Each step increases fidelity to what users actually receive.",
          "**Dynamic features especially need this**: if you use dynamic feature modules, on-demand installation *only* works through the Play delivery mechanism (or `bundletool`'s local simulation), so you *must* test via internal testing / bundletool — you can't validate on-demand module install with a plain debug build at all.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the App Bundle model means *you no longer build the final installable artifact* — Play does — so the thing users install is not the thing you compiled, and validating delivery requires reproducing or using Play's generation. `bundletool` lets you *locally* generate and install the exact device-specific splits (the same tool Play uses), and Play's *internal testing track* delivers the *genuinely* Play-generated-and-signed artifacts end-to-end — the highest fidelity. The insight is that split delivery introduces device-configuration-specific behavior (density/ABI/language splits, dynamic features, Play signing) that a universal debug build can't exercise, so 'it works when I install the debug APK' is *not* sufficient validation for an AAB-published app. Knowing to reach for `bundletool` (local, per-device splits) and Play internal testing (real end-to-end delivery) — and *why* (you don't build the final APKs, Play does) — is the practical release-engineering competence these questions probe.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between an APK and an AAB?",
    a: [
      {
        t: "p",
        text: "An *APK* is the final installable package delivered to a device. An *AAB (Android App Bundle)* is a *publishing format* you upload to Play — it contains all your compiled code and resources for *every* configuration, but isn't installed directly. Play uses it to *generate optimized APKs per device* (right density, language, ABI) via *split APKs*, so users download only what they need (smaller). Since Aug 2021, new apps must publish as AAB. You test the generated APKs with bundletool.",
      },
      {
        t: "table",
        headers: ["", "APK", "AAB"],
        rows: [
          ["Role", "Installable package", "Publishing format"],
          ["Contains", "One config", "All configs"],
          ["Delivered to device", "Yes", "No (Play generates APKs)"],
          ["Download size", "Universal (larger)", "Per-device (smaller)"],
        ],
      },
      {
        t: "note",
        text: "An APK is the installable package; an AAB (App Bundle) is a publishing format you upload to Play containing all configs. Play generates optimized per-device split APKs from it (right density/language/ABI) — smaller downloads. New apps must publish as AAB (since Aug 2021). Test generated APKs with bundletool.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is bundletool, and what do you use it for?",
    a: [
      {
        t: "p",
        text: "`bundletool` is the tool Play uses internally to build APKs from an AAB — and you can run it locally to *test what Play will deliver*. It generates an `.apks` set from your AAB (optionally for a specific device spec) and can *install* the right split APKs to a connected device. Use it to verify per-device splits, check sizes, and reproduce the exact artifact users get. It's the way to test an AAB locally since you can't install an AAB directly.",
      },
      {
        t: "code",
        title: "Build & install APKs from an AAB",
        code: `bundletool build-apks --bundle=app.aab --output=app.apks \\\n  --ks=release.jks --ks-key-alias=upload\nbundletool install-apks --apks=app.apks   # installs the right splits for the device`,
      },
      {
        t: "note",
        text: "bundletool builds APKs from an AAB (what Play does internally) and lets you test locally: generate an .apks set (optionally per device spec) and install the correct splits to a device. Use it to verify per-device splits, sizes, and reproduce the exact user artifact — the way to test an AAB since you can't install one directly.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are split APKs, and what types are there?",
    a: [
      {
        t: "p",
        text: "From your AAB, Play generates *split APKs* so a device downloads only what it needs: a *base APK* (core code/resources) plus *configuration splits* for the device's *density*, *language*, and *ABI*. They install together and behave as one app. There are also *feature splits* (dynamic feature modules). This is why AAB downloads are smaller than a universal APK — the device skips other densities, unused languages, and other ABIs.",
      },
      {
        t: "list",
        items: [
          "**Base APK** — core code/resources.",
          "**Config splits** — density, language, ABI for the device.",
          "**Feature splits** — dynamic feature modules.",
          "**Install together** — behave as one app; smaller download.",
        ],
      },
      {
        t: "note",
        text: "Play generates split APKs from an AAB: a base APK (core) plus configuration splits for the device's density, language, and ABI (and feature splits for dynamic modules). They install together as one app. This makes AAB downloads smaller than a universal APK — the device skips other densities/languages/ABIs.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a universal APK, and when do you need one?",
    a: [
      {
        t: "p",
        text: "A *universal APK* is a single APK (generated from the AAB) containing *all* configurations — every density, language, and ABI — so it installs on any device without splits. It's *larger* than per-device splits. You need it for *non-Play distribution* (sideloading, alternate stores, CI device testing, some enterprise/MDM setups) where the Play split mechanism isn't available. Generate it via `bundletool build-apks --mode=universal`. For Play delivery you don't use it — splits are smaller.",
      },
      {
        t: "list",
        items: [
          "**Universal APK** — one APK with all configs.",
          "**Installs anywhere** — no splits needed; larger.",
          "**Use for** — sideloading, other stores, CI, enterprise.",
          "**Generate** — `bundletool --mode=universal`.",
        ],
      },
      {
        t: "note",
        text: "A universal APK is one APK (from the AAB) with all configs (every density/language/ABI) — installs anywhere without splits, but larger. Need it for non-Play distribution: sideloading, alternate stores, CI device testing, enterprise/MDM. Generate with bundletool build-apks --mode=universal. Not for Play (splits are smaller).",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Play App Signing change your release/signing workflow?",
    a: [
      {
        t: "p",
        text: "With *Play App Signing*, you sign the uploaded AAB with your *upload key*; Google holds the *app signing key* and re-signs the delivered APKs with it. So your CI/local build uses the *upload* keystore (which is resettable if lost), and you never handle the app signing key after enrollment. Benefits: the critical key is safe with Google, it enables per-device split signing, and key rotation. You enroll once (Play generates or you provide the app key).",
      },
      {
        t: "list",
        items: [
          "**You sign** — the AAB with the upload key.",
          "**Google re-signs** — delivered APKs with the app key.",
          "**Upload key** — resettable if lost.",
          "**Enables** — split signing, key rotation, safe key storage.",
        ],
      },
      {
        t: "note",
        text: "With Play App Signing you sign the uploaded AAB with the upload key; Google holds the app signing key and re-signs delivered APKs. Your CI/build uses the upload keystore (resettable if lost) and never handles the app key post-enrollment. Benefits: critical key safe with Google, per-device split signing, key rotation. Enroll once.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why did Google make the AAB format mandatory?",
    a: [
      {
        t: "p",
        text: "To deliver *smaller, optimized downloads* automatically: by uploading all configurations once (the AAB), Play can generate *per-device APKs* so users download only their density/language/ABI — typically a meaningful size reduction versus a universal APK. It also enables *features* only possible when Play controls packaging: dynamic feature delivery, asset packs, and per-device optimization. Mandatory since Aug 2021 for *new* apps on Play. The trade-off is Play App Signing (Google holds the app key).",
      },
      {
        t: "list",
        items: [
          "**Smaller downloads** — per-device APKs (skip unused configs).",
          "**Enables** — dynamic features, asset packs, per-device optimization.",
          "**Mandatory** — new apps since Aug 2021.",
          "**Trade-off** — requires Play App Signing.",
        ],
      },
      {
        t: "note",
        text: "Google mandated the AAB to deliver smaller, optimized downloads automatically — uploading all configs once lets Play generate per-device APKs (users download only their density/language/ABI). It also enables dynamic feature delivery and asset packs. Mandatory for new apps since Aug 2021; trade-off is Play App Signing (Google holds the app key).",
      },
    ],
  },
  {
    level: "senior",
    q: "What are asset packs and how do they differ from feature modules?",
    a: [
      {
        t: "p",
        text: "*Asset packs* (part of Play Asset Delivery) let large *non-code assets* (textures, media — common in games) be delivered separately from the base APK, with delivery modes: *install-time*, *fast-follow* (downloaded right after install), or *on-demand*. *Feature modules* (dynamic delivery) deliver *code + resources* for optional features on demand. Both keep the base install small, but asset packs are for *assets* (up to large sizes) and feature modules for *functionality/code*. Games use asset packs heavily.",
      },
      {
        t: "list",
        items: [
          "**Asset packs** — large non-code assets; install-time/fast-follow/on-demand.",
          "**Feature modules** — code + resources for optional features.",
          "**Both** — keep the base install small.",
          "**Asset packs** — for assets (games); features for functionality.",
        ],
      },
      {
        t: "note",
        text: "Asset packs (Play Asset Delivery) deliver large non-code assets (textures/media, common in games) separately — install-time, fast-follow, or on-demand. Feature modules (dynamic delivery) deliver code + resources for optional features on demand. Both shrink the base install; asset packs are for assets, feature modules for functionality/code.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you test the exact APKs Play will deliver from your AAB?",
    a: [
      {
        t: "p",
        text: "Use `bundletool` to generate an `.apks` set from your AAB and install the right splits to a device (`build-apks` then `install-apks`), reproducing what a user gets. Or use Play's *internal app sharing* (upload the AAB, get a link, install on a device — Play generates the real delivered APKs). Also use *internal testing track* for a full end-to-end Play delivery test. Testing the *release AAB's output* (not just a debug APK) catches split/signing/shrinking issues before production.",
      },
      {
        t: "list",
        items: [
          "**bundletool** — build-apks + install-apks (local).",
          "**Internal app sharing** — Play generates the real APKs from a link.",
          "**Internal testing track** — end-to-end Play delivery.",
          "**Test the release AAB's output** — catches split/signing issues.",
        ],
      },
      {
        t: "note",
        text: "Test the delivered APKs via bundletool (build-apks + install-apks reproduces the user's splits), Play internal app sharing (upload AAB → link → Play generates real APKs), or the internal testing track (full Play delivery). Testing the release AAB's output — not a debug APK — catches split/signing/shrinking issues before production.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is Play internal app sharing, and how is it different from internal testing?",
    a: [
      {
        t: "p",
        text: "*Internal app sharing* is for *quick, ad-hoc* sharing: upload any AAB/APK (even debuggable, no version bump needed), get a *shareable link*, and testers install the *Play-generated* build instantly — great for QA and reproducing delivered artifacts. *Internal testing (track)* is a *managed release track* with a tester list, going through the release flow (versioned, reviewed-lite), a step toward production. Use internal app sharing for fast one-off builds; internal testing for structured pre-release testing.",
      },
      {
        t: "list",
        items: [
          "**Internal app sharing** — ad-hoc link, any build, instant.",
          "**Internal testing track** — managed, versioned, tester list.",
          "**Sharing** — quick QA / reproduce delivery.",
          "**Track** — structured pre-release step.",
        ],
      },
      {
        t: "note",
        text: "Internal app sharing: quick ad-hoc — upload any AAB/APK (no version bump), get a link, testers install the Play-generated build instantly (great for QA). Internal testing track: a managed, versioned release track with a tester list, part of the release flow. Sharing = fast one-offs; track = structured pre-release testing.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does the AAB reduce app size compared to a universal APK, concretely?",
    a: [
      {
        t: "p",
        text: "A universal APK ships *all* drawable densities, *all* language translations, and *all* ABI native libs — most of which a given device never uses. The AAB lets Play send only the device's *one* density bucket, *its* languages, and *its* ABI — so it drops the other ~4 density variants, dozens of unused translations, and other-architecture `.so` files. For apps with many locales or large native libs, this can cut download size substantially (often 20–50%+).",
      },
      {
        t: "list",
        items: [
          "**Universal** — all densities/languages/ABIs bundled.",
          "**AAB** — device's density + languages + ABI only.",
          "**Drops** — other densities, unused locales, other-arch `.so`.",
          "**Savings** — often 20–50%+ for multi-locale/native apps.",
        ],
      },
      {
        t: "note",
        text: "A universal APK ships all densities, all translations, and all ABI native libs — most unused per device. The AAB sends only the device's density bucket, its languages, and its ABI — dropping ~4 other density variants, dozens of unused locales, and other-architecture .so files. Often cuts download size 20–50%+ for multi-locale/native-heavy apps.",
      },
    ],
  },
  {
    level: "junior",
    q: "Can you still distribute an APK outside Google Play with an AAB workflow?",
    a: [
      {
        t: "p",
        text: "Yes — the AAB requirement is *only for publishing on Google Play*. For other channels (direct download, alternate stores, enterprise/MDM, sideloading), you generate an *APK* from your AAB with `bundletool` (typically a *universal* APK, or device-specific ones). You sign it with your own key. So one build (the AAB) can serve Play (splits) and everything else (an APK via bundletool). Many CI setups produce both an AAB (Play) and a universal APK (other distribution).",
      },
      {
        t: "list",
        items: [
          "**AAB required** — only for Play publishing.",
          "**Other channels** — generate an APK via bundletool.",
          "**Usually** — a universal APK, self-signed.",
          "**One build** — AAB for Play + APK for the rest.",
        ],
      },
      {
        t: "note",
        text: "Yes — the AAB requirement is only for publishing on Google Play. For other channels (direct download, alternate stores, enterprise, sideloading) generate an APK from the AAB with bundletool (usually universal), signed with your key. One AAB build serves Play (splits) and everything else (an APK). CI often produces both.",
      },
    ],
  },
  {
    level: "senior",
    q: "What happens to signing when Play generates split APKs?",
    a: [
      {
        t: "p",
        text: "Each generated *split APK* must be signed so the device accepts them as one app — with Play App Signing, *Play signs every split with the app signing key* it holds. You never sign the splits yourself; you only sign the *uploaded AAB* with your upload key (proving authorship). This is one reason Play App Signing is required for AAB delivery: Play needs the app key to sign the many per-device APKs it generates on the fly.",
      },
      {
        t: "list",
        items: [
          "**Splits signed** — by Play with the app signing key.",
          "**You sign** — only the uploaded AAB (upload key).",
          "**Devices** — accept co-signed splits as one app.",
          "**Why Play App Signing** — Play needs the app key to sign splits.",
        ],
      },
      {
        t: "note",
        text: "Play signs every generated split APK with the app signing key it holds (so the device accepts them as one app); you only sign the uploaded AAB with your upload key. This is why Play App Signing is required for AAB delivery — Play needs the app key to sign the many per-device APKs it generates on the fly.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between versionCode and versionName in a release?",
    a: [
      {
        t: "p",
        text: "`versionCode` is an *integer* Play (and the system) use to order versions — must strictly increase per upload; users update only to a higher code. `versionName` is a *human-readable string* (e.g. `2.4.1`) shown to users, with no ordering meaning. You bump `versionName` for marketing/semantic clarity and `versionCode` for every uploaded build. They're independent: many `versionCode` bumps can share a `versionName`, or vice versa.",
      },
      {
        t: "list",
        items: [
          "**`versionCode`** — integer; strictly increasing; ordering.",
          "**`versionName`** — human string (e.g. 2.4.1); display only.",
          "**Update** — only to a higher versionCode.",
          "**Independent** — bump code every build, name semantically.",
        ],
      },
      {
        t: "note",
        text: "versionCode: an integer Play uses to order versions — strictly increasing per upload; users update only to a higher code. versionName: a human string (2.4.1) shown to users, no ordering meaning. Bump versionCode every uploaded build, versionName for semantic/marketing clarity. They're independent.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you migrate an existing app to Play App Signing safely?",
    a: [
      {
        t: "p",
        text: "For an existing app, you can let Google *use your existing app key* as the app signing key (upload it securely via the Play Console's provided tooling) and then create a *new upload key* for future uploads — so existing installs (signed with the original key) keep updating seamlessly. Do it carefully: back up keys first, follow the Console's export/upload steps, and verify with a test release. After migration you upload with the *upload* key and Play re-signs with the original app key, preserving update continuity.",
      },
      {
        t: "list",
        items: [
          "**Existing key** — becomes the app signing key (uploaded securely).",
          "**New upload key** — for future uploads.",
          "**Continuity** — existing installs keep updating.",
          "**Do carefully** — back up, follow Console steps, test-release.",
        ],
      },
      {
        t: "note",
        text: "Migrate an existing app by letting Google use your existing app key as the app signing key (upload securely via the Console) and creating a new upload key for future uploads — existing installs (original-key-signed) keep updating. Back up keys, follow the export/upload steps, verify with a test release. Then you upload with the upload key; Play re-signs with the original app key.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is targetSdkVersion, and why does Play enforce a minimum?",
    a: [
      {
        t: "p",
        text: "`targetSdkVersion` declares the API level your app is *tested and designed against* — the system applies *behavior changes* for that level (and runs compatibility behaviors for newer OS features you haven't adopted). Play *requires* new apps and updates to target a *recent* API level (updated yearly) to ensure apps use modern privacy/security/behavior standards. So you must periodically raise `targetSdk` (and handle its behavior changes) to keep publishing updates. It's separate from `minSdk` (lowest supported).",
      },
      {
        t: "list",
        items: [
          "**`targetSdk`** — API level you're designed/tested against.",
          "**Applies** — that level's behavior changes.",
          "**Play requires** — a recent target (yearly bump) to publish.",
          "**Separate** — from `minSdk` (lowest supported).",
        ],
      },
      {
        t: "note",
        text: "targetSdkVersion declares the API level your app is designed/tested against — the system applies that level's behavior changes. Play requires new apps/updates to target a recent API level (raised yearly) for modern privacy/security standards, so you must periodically bump targetSdk (and handle its behavior changes) to keep publishing. Separate from minSdk.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between minSdk, targetSdk, and compileSdk?",
    a: [
      {
        t: "p",
        text: "*`minSdk`* — the *lowest* API level the app runs on (Play won't offer it to older devices; you must guard newer APIs). *`targetSdk`* — the level you *designed/tested against* (determines applied behavior changes). *`compileSdk`* — the level you *compile* against (which APIs are *available* to call at build time; usually the latest). You can call an API up to `compileSdk` but must *runtime-guard* anything above `minSdk`. Typical: compile latest, target recent (Play requirement), min as low as you support.",
      },
      {
        t: "table",
        headers: ["", "Means", "Typical"],
        rows: [
          ["minSdk", "Lowest device it runs on", "As low as you support"],
          ["targetSdk", "Designed/tested against", "Recent (Play requires)"],
          ["compileSdk", "APIs available at build", "Latest"],
        ],
      },
      {
        t: "note",
        text: "minSdk: lowest API the app runs on (guard newer APIs above it). targetSdk: what you designed/tested against (applied behavior changes; Play requires recent). compileSdk: what you compile against (available APIs; usually latest). You can call APIs up to compileSdk but must runtime-guard anything above minSdk.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you generate a signed AAB in Android Studio and via CI?",
    a: [
      {
        t: "p",
        text: "In Android Studio: *Build → Generate Signed Bundle / APK → Android App Bundle*, choose your (upload) keystore, and it produces a signed AAB. In CI: configure a `signingConfig` (credentials from secrets/env) and run `./gradlew bundleRelease` — the output AAB is at `app/build/outputs/bundle/release/`. Then upload to Play (manually or via the *Play Developer API*/fastlane/Gradle Play Publisher). CI signing keeps the keystore/passwords in secure secrets, never in the repo.",
      },
      {
        t: "code",
        title: "CI: build a signed AAB",
        code: `./gradlew bundleRelease\n# output: app/build/outputs/bundle/release/app-release.aab\n# then upload via Play Developer API / fastlane / gradle-play-publisher`,
      },
      {
        t: "note",
        text: "Studio: Build → Generate Signed Bundle → App Bundle with your upload keystore. CI: set a signingConfig (secrets/env) and run ./gradlew bundleRelease (output in app/build/outputs/bundle/release/), then upload via the Play Developer API/fastlane/gradle-play-publisher. Keep keystore/passwords in secure secrets, never in the repo.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the trade-offs of dynamic feature modules for delivery?",
    a: [
      {
        t: "p",
        text: "*Pros*: smaller base install, features fetched on demand (or install-time/conditional), and code separation. *Cons*: added complexity — you must handle the *download flow* (`SplitInstallManager`), *availability* (the feature's code/resources aren't present until installed, so guard access), possible download failures/latency, and testing more delivery paths. They shine for genuinely large or rarely-used features; for small features the complexity outweighs the size savings — prefer them only when the size win is real.",
      },
      {
        t: "list",
        items: [
          "**Pros** — smaller base, on-demand fetch, separation.",
          "**Cons** — download flow, availability guarding, failure handling.",
          "**More testing** — multiple delivery paths.",
          "**Use** — only when the size win is genuinely large.",
        ],
      },
      {
        t: "note",
        text: "Dynamic feature modules: pros — smaller base install, on-demand (or install-time/conditional) delivery, code separation. Cons — complexity: handle the SplitInstallManager download flow, guard availability (code absent until installed), handle failures/latency, test more paths. Worth it for large/rare features; overkill for small ones — use only when the size win is real.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the app signing key certificate (SHA-1/SHA-256) used for?",
    a: [
      {
        t: "p",
        text: "The app signing certificate's *fingerprints* (SHA-1/SHA-256) identify your app to external services: you register them for *Google Sign-In*, *Firebase*, *Maps*, *App Links (Digital Asset Links)*, and other APIs that verify your app's identity. With *Play App Signing*, the relevant fingerprint is the *app signing key's* (from Google), plus your *upload key's* for some flows — both are shown in the Play Console. If sign-in/links break in production, a mismatched/missing fingerprint is a common cause.",
      },
      {
        t: "list",
        items: [
          "**Fingerprints** — SHA-1/SHA-256 of the signing cert.",
          "**Register for** — Google Sign-In, Firebase, Maps, App Links.",
          "**Play App Signing** — use the app key's fingerprint (+ upload key).",
          "**Common bug** — mismatched fingerprint breaks prod sign-in/links.",
        ],
      },
      {
        t: "note",
        text: "The app signing certificate's SHA-1/SHA-256 fingerprints identify your app to services (Google Sign-In, Firebase, Maps, App Links/Digital Asset Links). With Play App Signing use the app signing key's fingerprint (from the Console), plus the upload key's for some flows. Mismatched/missing fingerprints are a common cause of broken production sign-in/links.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do App Links relate to signing and the AAB?",
    a: [
      {
        t: "p",
        text: "*Verified App Links* (opening `https://` URLs directly in your app, no chooser) require a *Digital Asset Links* file (`assetlinks.json`) on your domain listing your app's package and *signing certificate fingerprint (SHA-256)*. With Play App Signing, that fingerprint is the *app signing key's* (Google's) — a frequent mistake is registering the upload key's fingerprint, so verification fails in production. Get the correct SHA-256 from the Play Console's App Signing page and publish it in `assetlinks.json`.",
      },
      {
        t: "list",
        items: [
          "**Verified App Links** — need `assetlinks.json` with the SHA-256.",
          "**Play App Signing** — use the *app signing key's* fingerprint.",
          "**Common mistake** — using the upload key's fingerprint.",
          "**Source** — Play Console App Signing page.",
        ],
      },
      {
        t: "note",
        text: "Verified App Links (open https:// URLs directly, no chooser) need a Digital Asset Links assetlinks.json on your domain with your package + signing cert SHA-256. With Play App Signing use the app signing key's fingerprint (Google's) — using the upload key's is a common mistake that fails verification. Get the correct SHA-256 from the Console's App Signing page.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between a release track's rollout and the AAB it serves?",
    a: [
      {
        t: "p",
        text: "The *AAB* is the *artifact* (your compiled code/resources for all configs). A *release* on a *track* (internal/closed/open/production) is a *distribution decision*: which AAB (versionCode) goes to which audience, at what *rollout percentage*. The same AAB can be *promoted* across tracks (e.g. from internal → production) without rebuilding. So 'build once (AAB), release many' — the artifact is fixed; the track/rollout controls exposure. This separation enables safe staged releases.",
      },
      {
        t: "list",
        items: [
          "**AAB** — the fixed artifact (versionCode).",
          "**Release/track** — who gets it, at what rollout %.",
          "**Promote** — same AAB across tracks without rebuild.",
          "**Build once, release many** — artifact fixed, exposure controlled.",
        ],
      },
      {
        t: "note",
        text: "The AAB is the artifact (compiled code for all configs); a release on a track (internal/closed/open/production) is a distribution decision — which AAB goes to which audience at what rollout %. The same AAB promotes across tracks without rebuilding. Build once, release many: artifact fixed, track/rollout controls exposure — enabling safe staged releases.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle native libraries (ABIs) with the App Bundle?",
    a: [
      {
        t: "p",
        text: "The AAB *automatically* creates ABI splits (arm64-v8a, armeabi-v7a, x86_64) and delivers only the device's ABI — you don't need manual `abiFilters`/APK splits for Play. Just include all the ABIs you support in the build; Play handles per-device delivery. For *non-Play* distribution you may still use `abiFilters` or build a universal APK. This is a key AAB win for native-heavy apps (large `.so` files no longer multiply into every download).",
      },
      {
        t: "list",
        items: [
          "**Automatic ABI splits** — Play delivers the device's ABI.",
          "**Include all supported ABIs** — Play splits them.",
          "**No manual** — `abiFilters`/APK splits needed for Play.",
          "**Non-Play** — may still use `abiFilters`/universal APK.",
        ],
      },
      {
        t: "note",
        text: "The AAB automatically creates ABI splits (arm64-v8a, armeabi-v7a, x86_64) and delivers only the device's ABI — no manual abiFilters/APK splits needed for Play. Include all supported ABIs; Play handles per-device delivery. A key win for native-heavy apps (large .so files no longer bloat every download). Non-Play may still use abiFilters/universal.",
      },
    ],
  },
  {
    level: "senior",
    q: "Walk through what happens from building an AAB to a user installing the app.",
    a: [
      {
        t: "p",
        text: "You build a signed AAB (`bundleRelease`, signed with the *upload key*) and upload it to a Play track. Play verifies the upload signature, then *stores* the AAB. When a user on a specific device requests install/update, Play *generates the split APKs* for that device (base + its density/language/ABI), *signs each split with the app signing key* (which Google holds), and delivers just those. The device installs the co-signed splits as one app. You test this path locally with bundletool or internal app sharing.",
      },
      {
        t: "list",
        items: [
          "**Build + sign AAB** — upload key; upload to a track.",
          "**Play verifies + stores** — the AAB.",
          "**On install** — generates + app-key-signs device splits.",
          "**Device** — installs co-signed splits as one app.",
        ],
      },
      {
        t: "note",
        text: "Build a signed AAB (bundleRelease, upload key) → upload to a Play track → Play verifies the upload signature and stores it → on a device's install/update, Play generates split APKs (base + device density/language/ABI), signs each with the app signing key it holds, and delivers just those → device installs the co-signed splits as one app. Test via bundletool/internal app sharing.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between an AAB and an APK for CI/artifact storage?",
    a: [
      {
        t: "p",
        text: "For Play, your CI produces and archives the *AAB* (`bundleRelease`) as the release artifact — it's the single source Play delivers from. If you also need installable APKs (device testing, QA, non-Play channels), CI can *additionally* generate them from the AAB with bundletool (or build `assembleRelease`). Best practice: archive the AAB *and* its `mapping.txt` (for deobfuscation) per release, tagged with the versionCode, so you can always reproduce/deobfuscate a shipped build.",
      },
      {
        t: "list",
        items: [
          "**Archive** — the AAB as the release artifact (for Play).",
          "**Also generate** — APKs via bundletool for testing/non-Play.",
          "**Keep** — `mapping.txt` per release for deobfuscation.",
          "**Tag** — by versionCode to reproduce a shipped build.",
        ],
      },
      {
        t: "note",
        text: "CI archives the AAB (bundleRelease) as the Play release artifact; additionally generate installable APKs from it (bundletool/assembleRelease) for device testing/non-Play. Archive the AAB and its mapping.txt per release, tagged by versionCode, so you can always reproduce and deobfuscate a shipped build.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you inspect the size breakdown of what each device will download?",
    a: [
      {
        t: "p",
        text: "Use the Play Console's *App Bundle Explorer* (per-device download/install sizes for a release) or `bundletool get-size total --apks=app.apks` (with a device spec) to see the *actual delivered size* per configuration. The *APK Analyzer* on the AAB shows contents but not the split-adjusted per-device size — bundletool/Console give the real number. This tells you the *download* size users see (which affects install conversion), separate from the raw AAB size.",
      },
      {
        t: "list",
        items: [
          "**App Bundle Explorer** — per-device sizes in the Console.",
          "**`bundletool get-size`** — delivered size per config locally.",
          "**APK Analyzer** — contents, not split-adjusted per-device size.",
          "**Matters** — real download size affects install conversion.",
        ],
      },
      {
        t: "note",
        text: "Inspect per-device download size with the Play Console's App Bundle Explorer or bundletool get-size total (with a device spec) — the actual delivered size per config. The APK Analyzer shows AAB contents but not the split-adjusted per-device size. The real download size (not raw AAB size) is what affects install conversion.",
      },
    ],
  },
];

export default qa;
