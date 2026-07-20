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
];

export default qa;
