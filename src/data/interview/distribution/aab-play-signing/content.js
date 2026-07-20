// AAB, APK & Play App Signing — Content tab. Teaching-first.

const content = [
  {
    heading: "APK — the installable artifact",
    blocks: [
      {
        t: "p",
        text: "An **APK (Android Package)** is the file format that packages a complete app for installation on a device — it contains the compiled code (DEX), resources, assets, the manifest, and native libraries, all signed. It's what actually gets installed and run. Historically you built and published a single APK; today you still build APKs for development/testing, but you *publish* an App Bundle (from which Play generates APKs).",
      },
      {
        t: "list",
        items: [
          "**A universal APK** contains *everything* for *every* device — all screen densities, all CPU architectures (arm64, armv7, x86), all languages — so any device can install it. The downside: every device downloads resources it can't use, making it larger than necessary.",
          "**Split APKs** — the modern approach: instead of one universal APK, an app is delivered as a *base* APK plus *configuration* APKs (per density, per architecture, per language), so a device installs only the base plus the splits matching it. This is what Play generates from an App Bundle.",
          "**You install/test APKs**; you publish an AAB. APKs remain the on-device runtime format.",
        ],
      },
    ],
  },
  {
    heading: "AAB — the publishing format",
    blocks: [
      {
        t: "p",
        text: "The **Android App Bundle (`.aab`)** is the *publishing format* required for new apps on Play since 2021. You upload one AAB — a bundle of all your app's compiled code and resources for all configurations — and **Google Play generates optimized split APKs per device** from it, delivering only what each device needs. The AAB itself is *not installable*; it's an intermediate format Play processes.",
      },
      {
        t: "list",
        items: [
          "**Why it exists — smaller downloads**: a universal APK forces every device to download resources for densities/architectures/languages it doesn't use. The AAB lets Play split by those dimensions and deliver a tailored, smaller APK per device — often 15-35% smaller downloads, with no code changes.",
          "**AAB vs APK, precisely**: an APK is the *installable* artifact a device runs; an AAB is a *publishing* format you upload (not directly installable). You develop and test with APKs; you publish an AAB.",
          "**It enables more than size** — dynamic feature delivery (on-demand modules), asset packs (large assets delivered separately, for games), and conditional/instant delivery all build on the bundle format.",
          "**Testing the real output** — since Play generates the device-specific APKs (not you), to test the *actual* delivered artifacts locally you use **`bundletool`** (generates device-specific APKs from your AAB) or Play's internal test track.",
        ],
      },
    ],
  },
  {
    heading: "Play App Signing — why it's needed and how it works",
    blocks: [
      {
        t: "p",
        text: "Because Play *generates and delivers* the per-device APKs from your AAB, *Play* must sign those APKs — they didn't exist when you built the bundle. **Play App Signing** is the system where **Google holds your app signing key** and signs the generated APKs, while *you* sign your *uploads* with a separate **upload key**. This is required for AAB publishing and solves the 'lose your key, can't update' problem.",
      },
      {
        t: "list",
        items: [
          "**Two keys**: the **app signing key** (the real key that end-user APKs are signed with — Google holds it securely) and the **upload key** (which you use to sign the AAB you upload — Play verifies it, then re-signs the generated APKs with the app signing key). They're different keys serving different roles.",
          "**The key benefit — recoverability**: if your *upload key* is ever lost or compromised, you can *reset* it with Google's help — you're not locked out. The real *app signing key* stays safely with Google, so it can't be lost, and updates always remain possible. This removes the catastrophic single-point-of-failure of holding your one irreplaceable key yourself.",
          "**Enrollment options**: Play can *generate* the app signing key for you, or you can *upload* your existing key (opting into Play App Signing for an existing app). Once enrolled, Google manages the app signing key.",
          "**Security posture**: Google's key management is more secure than most developers' (HSM-backed, access-controlled), and the upload-key indirection means a compromised upload key doesn't compromise the app's actual signature.",
        ],
      },
    ],
  },
  {
    heading: "The full picture — how it fits together",
    blocks: [
      {
        t: "code",
        title: "The publishing pipeline",
        code: `// 1. You build an AAB, signed with your UPLOAD key
./gradlew bundleRelease            // produces app-release.aab

// 2. Upload the AAB to Play Console
//    Play verifies the upload key signature

// 3. Play generates device-specific split APKs from the AAB
//    and signs them with the APP SIGNING KEY (held by Google)

// 4. A device installs the base APK + config splits matching it
//    (its density, architecture, languages) — a small, tailored download`,
      },
      {
        t: "list",
        items: [
          "**Your responsibility**: build and upload an AAB signed with your upload key; keep the upload key reasonably safe (but it's resettable).",
          "**Play's responsibility**: verify the upload, generate optimized split APKs, sign them with the app signing key it holds, and deliver the right splits to each device.",
          "**The device's experience**: a smaller, tailored download (only its density/architecture/languages), assembled into the running app.",
        ],
      },
      {
        t: "note",
        text: "APK = installable artifact a device runs (universal = everything; splits = base + per-density/ABI/language). AAB = publishing format you upload (not installable); Play generates optimized split APKs from it → 15-35% smaller downloads. Required for new Play apps since 2021. Test the real output with bundletool. Play App Signing: Google holds the app signing key (signs the generated APKs), you use a resettable upload key — required for AAB, and it solves 'lose your key = can't update' since the real key can't be lost and the upload key is recoverable.",
      },
    ],
  },
];

export default content;
