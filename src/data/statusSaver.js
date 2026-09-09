// ============================================================================
// STATUS SAVER — data for the /apps/statussaver case-study page.
// Grounded in the live Play Store listing and the Status_Saver_No_Ads repo
// (module layout, dependencies, locale resources, architecture notes).
// 🖼️  SCREENSHOTS: drop phone shots into src/Assets/statusSaver/ and add them
//     to `screenshots` below. Until then the section shows placeholders.
// ============================================================================

import banner from "../Assets/images/playstore_status_saver.png";
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
    "Save WhatsApp statuses — photos and videos — in original quality. No ads, no tracking, no account, and no internet access at all.",

  storeUrl: "https://play.google.com/store/apps/details?id=com.revanthapps.statussavernoads",
  privacyUrl: "https://revanthkumarj.github.io/ExpenseTrackr/status-saver-privacy-policy.html",
  developerUrl: "https://play.google.com/store/apps/dev?id=5399113798198807031",

  banner,

  meta: [
    { label: "Category", value: "Entertainment" },
    { label: "Version", value: "1.0.2" },
    { label: "Requires", value: "Android 7.0+" },
    { label: "Content rating", value: "Everyone" },
    { label: "Role", value: "Solo — design, build, release" },
  ],

  intro: [
    "Every status saver on the Play Store is stuffed with ads — full-screen interstitials between taps, banners over the grid, a rewarded video before a download. That is the whole reason this one exists: it does the same job, and it never shows you an ad.",
    "The app reads WhatsApp's own .Statuses folder, shows you what is there before it expires in 24 hours, and copies what you pick into your Downloads. It requests no network permission at all, so there is nothing it could upload even if it wanted to.",
  ],

  stats: [
    { value: 3, label: "Screens, no more" },
    { value: 24, label: "Languages shipped" },
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
      title: "No internet permission at all",
      body: "The app declares no network access. It reads local files and nothing else, so there is no analytics SDK, no tracking, and no way for your media to leave the device.",
    },
    {
      icon: "globe",
      title: "24 languages and your theme",
      body: "Ships in 24 languages, with light, dark and system themes, Material 3 styling and an edge-to-edge single-activity Compose UI.",
    },
  ],

  screensBlurb:
    "Three bottom-bar destinations — Statuses, Downloads, Settings — plus a full-screen preview. Jetpack Compose with Material 3.",

  shotAspect: "9/16",

  screenshots: [
    { src: shotStatuses, title: "Statuses", caption: "Everything currently in WhatsApp's folder, filtered by All, Photos or Videos, with a save button on each tile." },
    { src: shotDownloads, title: "Downloads", caption: "Everything you saved, kept after the 24-hour expiry — share, re-post or delete from here." },
    { src: shotThemes, title: "Light or dark", caption: "The same Material 3 interface in both themes, following your system setting by default." },
    { src: shotLanguage, title: "24 languages", caption: "Pick your language on first launch or change it any time in Settings." },
    { src: shotSettings, title: "Settings", caption: "Folder access, theme, and cross-promotion kept where it belongs — never a popup or an interstitial." },
  ],

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
      items: ["R8 minification", "Single :app module", "minSdk 24 · targetSdk 36", "Play Store release"],
    },
  ],

  privacy: {
    headline: "It cannot upload your media. There is no internet permission.",
    body:
      "This is the strongest privacy guarantee an app of this kind can make: without the INTERNET permission, no status, no file and no usage data can leave your phone, whatever the app's code says. There is no analytics SDK, no crash reporter, and no account. The only outbound action is opening a Play Store link you explicitly tapped.",
    points: [
      "No ads, no paywall, no 'pro' tier",
      "No account and no sign-in",
      "No analytics or tracking SDKs",
      "Play Data safety: no data collected, no data shared",
    ],
  },

  permissions: [
    { name: "Folder access (SAF)", why: "You grant access to WhatsApp's .Statuses folder once, so the app can list what is in it." },
    { name: "Media / storage", why: "To copy the statuses you choose into your Downloads folder." },
    { name: "Notifications", why: "Optional — to confirm a save completed." },
  ],

  nonGoals: ["No ads", "No account", "No internet permission", "No sources beyond WhatsApp"],

  cta: {
    headlineLead: "Save WhatsApp statuses",
    headlineAccent: "without the ads",
    body: "Free, fully offline, and no account needed. Available now on Google Play.",
  },
};

export default statusSaver;
