/* Mobile Byte Sensei — condensed case study.
   The full version (every PR, deep dives, interview notes) is kept outside this
   repo, in revanthkumarJ/work-records. */
export const mobileByteSensei = {
  slug: "mobile-byte-sensei",
  company: "Mobile Byte Sensei",
  role: "Mobile Development Intern",
  discipline: "Kotlin Multiplatform & Compose Multiplatform",
  period: "Apr 2025 — Nov 2025",
  accent: "cyan",
  eyebrow: "Experience · Internship",
  titleLead: "Eight products,",
  titleAccent: "one shared architecture",
  tagline: "Eight months of shipping Kotlin Multiplatform apps",
  summary:
    "I joined as a mobile intern and worked across eight products built on one in-house Kotlin Multiplatform template — three of which shipped to Google Play. The work ran the full range: whole feature modules built from scratch, a networking layer for a fintech app, production crash fixes surfaced through Crashlytics, and localisation into 20+ languages.",

  stats: [
    { value: 3, label: "Apps shipped to Google Play" },
    { value: 8, label: "Products on one shared KMP foundation" },
    { value: 20, suffix: "+", label: "Languages shipped to users" },
    { value: 3, label: "Modules built from scratch" },
  ],

  meta: [
    { label: "Period", value: "Apr — Nov 2025" },
    { label: "Stack", value: "KMP · CMP" },
    { label: "Domain", value: "Consumer · Fintech" },
    { label: "Locales shipped", value: "20+" },
    { label: "Process", value: "Agile · Jira" },
  ],

  /* The major work, kept short. Depth belongs in the markdown record. */
  highlights: [
    {
      icon: "download",
      title: "WhatsApp status downloader",
      scale: "New feature module, shipped",
      body: "WhatsApp keeps statuses in a directory Android blocks other apps from reading. I built a whole feature module around the Storage Access Framework — a one-time folder grant persisted across reboots, DocumentFile enumeration, and a guided permission dialog, because SAF asks users to do something genuinely confusing. Shipped to production.",
    },
    {
      icon: "layers",
      title: "Networking layer from zero",
      scale: "Fintech lending app",
      body: "The app was pure UI over mock data. I built core/network end to end: a Ktorfit client with an expect/actual HTTP engine so it compiled for Android and iOS, a DataManager facade, the full typed DTO set for the lending domain, and Koin qualifiers separating authenticated from public clients. Every data-backed feature after it was built on this.",
    },
    {
      icon: "activity",
      title: "Analytics designed as an abstraction",
      scale: "New core module",
      body: "You can't call the Firebase Android SDK from common code, and you don't want every ViewModel importing it anyway. I put one AnalyticsHelper interface in commonMain with Firebase and stub implementations behind Koin, enriched every event with device and version context, and truncated params to Firebase's limits so a long URL could never silently drop an event.",
    },
    {
      icon: "bug",
      title: "A crash inside the crash reporting",
      scale: "Production fix",
      body: "Crashlytics showed crashes clustered on older devices. The analytics logger read PackageInfo.longVersionCode — a field that only exists from API 28 — so the call meant to give us data was killing the app on exactly the devices we needed data from. I version-gated the read and made logEvent non-throwing: analytics should never be able to take down the app.",
    },
    {
      icon: "smartphone",
      title: "Rescuing Android 9 and below",
      scale: "Legacy storage support",
      body: "The status downloader had been written for scoped storage only, so on pre-Android-10 devices the download button was simply disabled. I added a parallel legacy write path selected at runtime on SDK level, with runtime storage permissions requested only where they still mean something — turning a dead feature into a working one without touching the modern path.",
    },
    {
      icon: "globe",
      title: "Localisation into 20+ languages",
      scale: "Two codebases · RTL included",
      body: "Strings were hardcoded across feature modules with no key convention. I did a cleanup pass across every feature module, standardised the naming, then built out resources for Arabic through Urdu — and repeated the exercise on the rewritten codebase so the new app launched localised rather than retrofitting it. Then fixed the layout breakage long translations always cause.",
    },
    {
      icon: "plus",
      title: "Taking an app from nothing to the Play Store",
      scale: "0 → shipped",
      body: "Stories Downloader started as an empty repository. I bootstrapped it from the shared multiplatform template, repackaged the whole project into its own namespace, wired up Firebase and the build, then took it through store compliance and release. Shipping is a skill separate from building, and this is where I learned the second half of it.",
    },
    {
      icon: "grid",
      title: "The security boundary of a lending app",
      scale: "Passcode & session gating",
      body: "A loan app needs an app-level passcode that can't be navigated around. I built the entry, confirmation and change flows, persisted state through DataStore as a flow, and gated it at the root of navigation — so what the user sees on launch is decided by persisted state, not by a check bolted onto each screen. That distinction is what makes the lock real rather than cosmetic.",
    },
  ],

  productsBlurb:
    "Eight products, all built on one in-house Kotlin Multiplatform template — so the architecture carried from one to the next. Three reached the Play Store.",

  products: [
    { name: "Reels Downloader", note: "Social media video downloader, live on Play Store", shipped: true },
    { name: "Financiera Bienestar", note: "Spanish-language lending app for the Mexican market" },
    { name: "Reels Downloader (rewrite)", note: "Ground-up rebuild on a newer KMP template" },
    { name: "GoCheapCab", note: "Cab aggregator and ride comparison" },
    { name: "Mood Movies", note: "Mood-based movie recommendations" },
    { name: "Stories Downloader", note: "Stories saver — bootstrapped and shipped", shipped: true },
    { name: "Byte Wallpaper", note: "Wallpaper app, live on Play Store", shipped: true },
    { name: "MBS AI Hub", note: "AI-agent management tool for the engineering team" },
  ],

  takeaways: [
    {
      title: "Platform constraints are design problems",
      body: "Android blocking the statuses directory wasn't only an API puzzle — it meant asking users to complete a folder-picker flow they'd never seen. The engineering was half the work.",
    },
    {
      title: "Fix the class, not the line",
      body: "Version-gating one field would have closed the crash ticket. Making the analytics path non-throwing closed every future version of it.",
    },
    {
      title: "Separation isn't free",
      body: "More modules, more ViewModels and more destinations all carry a cost. The interesting judgement is knowing which abstractions are paying for themselves.",
    },
    {
      title: "Not everything I built shipped",
      body: "A reworked analytics attempt, a restructured loan flow, a redesigned onboarding screen, an ad feature closed on a product call. Dropping your own work when the direction changes is part of shipping, and arguing for it past that point is not.",
    },
  ],

  cta: {
    headlineLead: "Three of these are",
    headlineAccent: "on Google Play",
    body: "Built on one shared Kotlin Multiplatform foundation, then shipped and maintained in production.",
  },

  stack: [
    { title: "Language & UI", items: ["Kotlin", "Kotlin Multiplatform", "Compose Multiplatform", "Jetpack Compose"] },
    { title: "Architecture", items: ["MVI", "Clean Architecture", "Modularization", "Convention Plugins"] },
    { title: "Data", items: ["Ktor", "Ktorfit", "Room", "DataStore", "WorkManager"] },
    { title: "Platform", items: ["Storage Access Framework", "FileProvider", "expect/actual", "Koin"] },
    { title: "Production", items: ["Firebase Analytics", "Crashlytics", "GitHub Actions", "Play Console"] },
  ],

  links: [
    { text: "Reels Downloader", url: "https://play.google.com/store/apps/details?id=com.sensei.social", store: true },
    { text: "Stories Downloader", url: "https://play.google.com/store/apps/details?id=com.sensei.stories", store: true },
    { text: "Byte Wallpaper", url: "https://play.google.com/store/apps/details?id=org.mobilebytesensei.wallpaper", store: true },
  ],
};
