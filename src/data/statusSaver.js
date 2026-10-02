// ============================================================================
// STATUS SAVER — data for the /apps/statussaver case-study page.
// Grounded in the live Play Store listing (1.0.4) and the StatusSaverNoAds repo
// (manifest, dependencies, locale resources, architecture notes).
// ============================================================================

import banner from "../Assets/images/playstore_status_saver.webp";
import listingIndia from "../Assets/statusSaver/listing-india.webp";
import listingArabic from "../Assets/statusSaver/listing-arabic.webp";
import listingKenya from "../Assets/statusSaver/listing-kenya.webp";
import shotStatuses from "../Assets/statusSaver/1.webp";
import shotDownloads from "../Assets/statusSaver/3.webp";
import shotThemes from "../Assets/statusSaver/2.webp";
import shotLanguage from "../Assets/statusSaver/4.webp";
import shotSettings from "../Assets/statusSaver/5.webp";

export const statusSaver = {
  slug: "statussaver",
  path: "/apps/statussaver",
  accent: "cyan",

  name: "Status Saver",
  fullName: "StatusSave – No Ads",
  titleLead: "Status",
  titleAccent: "Saver",
  eyebrow: "Play Store app · Solo project",
  tagline: "No ads. Just save.",
  shortDescription:
    "Save WhatsApp statuses — photos and videos — in original quality. No ads, no account, and your statuses never leave your phone.",

  storeUrl: "https://play.google.com/store/apps/details?id=com.revanthapps.statussavernoads",
  privacyUrl: "https://revanthkumarj.github.io/ExpenseTrackr/status-saver-privacy-policy.html",
  developerUrl: "https://play.google.com/store/apps/dev?id=5399113798198807031",

  banner,

  // Public write-up of the release process behind this app.
  writeup: {
    text: "How I ship to Play",
    url: "https://medium.com/@jrevanth101/from-jetpack-compose-app-to-play-store-complete-guide-signing-testing-release-a4a92a6dd3b0",
  },

  meta: [
    { label: "Category", value: "Entertainment" },
    { label: "Version", value: "1.0.4" },
    { label: "Requires", value: "Android 7.0+" },
    { label: "Content rating", value: "Everyone" },
    { label: "Role", value: "Solo — design, build, release" },
  ],

  intro: [
    "Every status saver on the Play Store is stuffed with ads — full-screen interstitials between taps, banners over the grid, a rewarded video before a download. That is the whole reason this one exists: it does the same job, and it never shows you an ad.",
    "The app reads WhatsApp's own .Statuses folder, shows you what is there before it expires in 24 hours, and copies what you pick into your Downloads. Every feature works offline; the only network traffic is anonymous crash reports and usage counts, and no status, file or file name is ever part of it.",
  ],

  stats: [
    { value: 3, label: "Screens, no more" },
    { value: 25, label: "Languages shipped" },
    { value: 24, suffix: "h", label: "Before statuses expire" },
    { value: 0, label: "Ads, ever" },
  ],

  features: [
    {
      icon: "image",
      title: "Everything currently in your statuses",
      body: "A live list of what is sitting in WhatsApp's .Statuses folder right now, filtered by All, Photos or Videos. WhatsApp Business statuses are picked up alongside regular WhatsApp.",
    },
    {
      icon: "download",
      title: "Saved before they expire",
      body: "Statuses vanish after 24 hours. Anything you save is copied into Downloads/StatusSaver/WhatsApp in original quality and survives the expiry, a WhatsApp cache clear, and a reinstall.",
    },
    {
      icon: "play",
      title: "Full-screen preview",
      body: "Swipe between statuses in a full-screen pager — images through Coil, videos through Media3 ExoPlayer — and save the one you are looking at without going back.",
    },
    {
      icon: "share",
      title: "Share, re-post, delete",
      body: "From the Downloads tab, share a saved status anywhere, re-post it straight back to WhatsApp, or delete it. No file manager needed.",
    },
    {
      icon: "shield",
      title: "Your media never leaves the phone",
      body: "No feature touches the network. Firebase is the only SDK allowed to, and only for anonymous crash reports and usage counts — never a file, a file name or an advertising ID.",
    },
    {
      icon: "globe",
      title: "25 languages and your theme",
      body: "Ships in 25 languages, with light, dark and system themes, Material 3 styling and an edge-to-edge single-activity Compose UI.",
    },
  ],

  screensBlurb:
    "Three bottom-bar destinations — Statuses, Downloads, Settings — plus a full-screen preview. Jetpack Compose with Material 3.",

  shotAspect: "9/16",

  screenshots: [
    { src: shotStatuses, title: "Statuses", caption: "Everything currently in WhatsApp's folder, filtered by All, Photos or Videos, with a save button on each tile." },
    { src: shotDownloads, title: "Downloads", caption: "Everything you saved, kept after the 24-hour expiry — share, re-post or delete from here." },
    { src: shotThemes, title: "Light or dark", caption: "The same Material 3 interface in both themes, following your system setting by default." },
    { src: shotLanguage, title: "25 languages", caption: "Pick your language on first launch or change it any time in Settings." },
    { src: shotSettings, title: "Settings", caption: "Folder access, theme, and cross-promotion kept where it belongs — never a popup or an interstitial." },
  ],

  // Play custom store listings — the same app, a feature graphic per market.
  storeListings: {
    blurb:
      "I'm experimenting with Play's custom store listings: the same app, shown to each market with its own feature graphic — local landmarks, local language, and screenshots filled with imagery that market would actually be saving.",
    items: [
      { src: banner, title: "Default", market: "Shown everywhere without a custom listing", caption: "The default listing — the baseline every custom one is measured against." },
      { src: listingIndia, title: "India", market: "Indian market", caption: "Taj Mahal and India Gate, a tricolour sweep, and statuses of temples, cricket and street food." },
      { src: listingArabic, title: "Arabic", market: "One listing across 10+ Arabic-speaking countries", caption: "Fully Arabic copy, laid out right to left, with mosques, desert and skyline imagery." },
      { src: listingKenya, title: "Kenya", market: "Kenyan market", caption: "Kilimanjaro, savannah wildlife and Kenyan colours behind the same three screens." },
    ],
    footnote: "Plus more markets, each tuned the same way.",
  },

  architecture: {
    summary:
      "A deliberately single-module app. Clean architecture is enforced by package boundaries rather than by Gradle modules — at this size, multi-module plus convention plugins would be pure overhead — but the layering is kept strict enough that it could be promoted to real modules if the app grows. Features depend on core; features never import each other.",
    layers: [
      {
        name: "core",
        modules: ["model", "data", "designsystem", "ui"],
        note: "Status models, the WhatsApp storage layer (SAF tree URIs, MediaStore on API 29+, File fallbacks below), DataStore, theme and shared composables.",
      },
      {
        name: "feature",
        modules: ["statuses", "downloads", "settings", "preview"],
        note: "One ViewModel + Screen + components package per destination, plus the full-screen pager that sits above the bottom bar.",
      },
      {
        name: "app shell",
        modules: ["navigation", "di", "MainActivity"],
        note: "A single edge-to-edge activity hosting Compose, a typed nav graph, and Koin modules started from the Application class.",
      },
    ],
  },

  techStack: [
    {
      title: "Language & UI",
      items: ["Kotlin", "Jetpack Compose", "Material 3", "Material Icons Extended", "Compose Navigation", "Core SplashScreen"],
    },
    {
      title: "Media",
      items: ["Coil (images)", "Coil Video", "Media3 ExoPlayer", "Media3 UI"],
    },
    {
      title: "Storage & DI",
      items: ["Storage Access Framework", "MediaStore.Downloads", "DocumentFile", "DataStore Preferences", "Koin", "kotlinx.serialization"],
    },
    {
      title: "Build & release",
      items: ["R8 minification", "Single :app module", "minSdk 24 · targetSdk 36", "Firebase Crashlytics", "Firebase Analytics", "Play In-App Review", "Play Store release"],
    },
  ],

  privacy: {
    headline: "Your statuses and saved files never leave your phone.",
    body:
      "The app reads WhatsApp's statuses folder and copies what you choose into Downloads — all of it on the device. To find and fix bugs it sends anonymous crash reports and usage counts (which screens are opened, which buttons are tapped) to Firebase. Every event comes from a fixed list with fixed parameters, so a file name, path or URI cannot reach it by accident, and the advertising-ID permissions Firebase would add are stripped from the build.",
    points: [
      "No ads, no paywall, no 'pro' tier",
      "No account and no sign-in",
      "No file, file name or advertising ID is ever sent",
      "The in-app privacy notice says exactly what is sent, in all 25 languages",
    ],
  },

  permissions: [
    { name: "Folder access (SAF)", why: "On Android 10 and up you pick WhatsApp's .Statuses folder once — this needs no permission at all." },
    { name: "Storage (Android 9 and below)", why: "Only on older phones, to read the statuses folder and save into Downloads. Asked when you tap Save, never on launch." },
    { name: "Internet", why: "Used only by Firebase, for anonymous crash reports and usage counts." },
  ],

  nonGoals: ["No ads", "No account", "No uploads of your media", "No sources beyond WhatsApp"],

  cta: {
    headlineLead: "Save WhatsApp statuses",
    headlineAccent: "without the ads",
    body: "Free, no ads, and no account needed. Available now on Google Play.",
  },
};

export default statusSaver;
