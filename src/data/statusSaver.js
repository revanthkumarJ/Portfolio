// ============================================================================
// STATUS SAVER — data for the /apps/statussaver case-study page.
// Grounded in the StatusSaverNoAds repo at 1.5.0 (manifest, dependencies,
// locale resources, CLAUDE.md) and its store-listing/ assets.
// ============================================================================

import banner from "../Assets/images/playstore_status_saver.webp";
import listingIndia from "../Assets/statusSaver/listing-india.webp";
import listingArabic from "../Assets/statusSaver/listing-arabic.webp";
import shotSave from "../Assets/statusSaver/shot-01_save.webp";
import shotDownloads from "../Assets/statusSaver/shot-02_downloads.webp";
import shotEdit from "../Assets/statusSaver/shot-03_edit.webp";
import shotTools from "../Assets/statusSaver/shot-04_tools.webp";
import shotPreview from "../Assets/statusSaver/shot-05_preview.webp";
import shotThemes from "../Assets/statusSaver/shot-06_themes.webp";
import shotChat from "../Assets/statusSaver/shot-07_chat.webp";
import shotLanguage from "../Assets/statusSaver/shot-08_language.webp";

export const statusSaver = {
  slug: "statussaver",
  path: "/apps/statussaver",
  accent: "cyan",

  name: "Status Saver",
  fullName: "Status Saver",
  titleLead: "Status",
  titleAccent: "Saver",
  eyebrow: "Play Store app · Solo project",
  tagline: "Save WhatsApp statuses in one tap.",
  shortDescription:
    "Save WhatsApp statuses — photos and videos — in original quality, then trim, crop or turn them into GIFs and collages on the phone. Every feature is free, no account, and your statuses never leave your phone.",

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
    { label: "Version", value: "1.5.0" },
    { label: "Requires", value: "Android 7.0+" },
    { label: "Content rating", value: "Everyone" },
    { label: "Role", value: "Solo — design, build, release" },
  ],

  intro: [
    "The app reads WhatsApp's own .Statuses folder, shows you what is there before it expires in 24 hours, and copies what you pick into your phone in original quality. It started as a single-purpose saver and grew, release by release, into a small media toolkit: trim and crop, GIFs, collages, splitting a long video into status-sized parts, a locked vault and home-screen widgets.",
    "It is a top-of-funnel product: every feature is free, nothing is behind a paywall, and the core job — viewing and saving statuses — is never gated. Ads are light by design: nothing ad-related runs for the first week after install, and never on the Statuses tab, the vault, at launch or next to a Save button. Every feature works offline, and no status, file or file name ever leaves the phone.",
  ],

  stats: [
    { value: 25, label: "Languages shipped" },
    { value: 6, label: "On-device video & photo tools" },
    { value: 7, label: "Days ad-free after install" },
    { value: 0, label: "Features that need the network" },
  ],

  // Play Store reviews, quoted verbatim. Reviewers are shortened to first name
  // and initial — they posted on Play, not on this site.
  reviews: [
    {
      name: "LayaSree V.",
      date: "18 Sep 2026",
      rating: 5,
      text: "Really useful and easy-to-use the app. The interface is simple, the status saving process is quick, and photos and videos can be saved without any hassle. Everything works smoothly and the app is very convenient for everyday use. Great work by the developer.",
    },
    {
      name: "Venkata V.",
      date: "2 Oct 2026",
      rating: 5,
      text: "I’ve been using this for a while and really like it. It’s simple, quick, and has no annoying ads. Just works without any hassle. Saving photos and videos is simple and quick.",
    },
    {
      name: "Bharath K.",
      date: "2 Sep 2026",
      rating: 5,
      text: "It's a good app. able to download the whatsapp statuses soo easily",
    },
  ],

  features: [
    {
      icon: "image",
      title: "Everything currently in your statuses",
      body: "A live grid of what is sitting in WhatsApp's .Statuses folder right now, filtered by All, Photos or Videos, with a NEW badge, a time-left pill and a one-tap \"Save N new\". WhatsApp Business statuses are picked up alongside regular WhatsApp.",
    },
    {
      icon: "download",
      title: "Saved before they expire",
      body: "Statuses vanish after 24 hours. Anything you save is copied in original quality into Downloads or the Gallery, and survives the expiry. The Downloads tab adds search, favourites, sorting, multi-select and a 30-day Recently deleted bin.",
    },
    {
      icon: "scissors",
      title: "Trim, crop and save frames",
      body: "Crop a photo, trim a video, save a single frame or just the audio — Media3 Transformer and uCrop, all on the phone, with a preview before anything is saved.",
    },
    {
      icon: "play",
      title: "Creative tools, made on your phone",
      body: "Video to GIF through a hand-written encoder, compress, remove sound, change speed, photo collages, and Split for status — a long video cut into 30 or 60-second parts and posted to WhatsApp in order.",
    },
    {
      icon: "lock",
      title: "A vault behind your screen lock",
      body: "Move saved files into private storage opened with the phone's own fingerprint or PIN, re-locked the moment you leave the app, and excluded from cloud backups — with export and import to carry it across a reset.",
    },
    {
      icon: "globe",
      title: "25 languages, nine accents, two widgets",
      body: "Ships in 25 languages, with light, dark and pure-black themes, nine accent colours, Material You and a glass style. Direct chat, picture-in-picture, launcher shortcuts, a Quick Settings tile and two home-screen widgets round it out.",
    },
  ],

  screensBlurb:
    "Three bottom-bar destinations — Statuses, Downloads, Settings — with the viewer, editor, tools, vault and direct chat on top. Jetpack Compose with Material 3; these are the Play Store screenshots.",

  shotAspect: "9/16",

  screenshots: [
    { src: shotSave, title: "Statuses", caption: "Everything currently in WhatsApp's folder, with NEW badges, time left on each tile and a one-tap Save N new." },
    { src: shotDownloads, title: "Downloads", caption: "Everything you saved, kept after the 24-hour expiry — search, sort, star, share or re-post." },
    { src: shotEdit, title: "Trim & crop", caption: "Cut a clip, save a frame or crop a photo before saving, all on the phone." },
    { src: shotTools, title: "Tools", caption: "Video to GIF, compress, remove sound, change speed and collages — nothing is uploaded." },
    { src: shotPreview, title: "Viewer", caption: "Swipe through statuses full screen and save, crop, set as wallpaper, re-post or share." },
    { src: shotThemes, title: "Themes", caption: "Light, dark and pure black, nine accent colours, Material You and a glass style." },
    { src: shotChat, title: "Direct chat", caption: "Open a WhatsApp chat with any number without saving it — the number is never stored." },
    { src: shotLanguage, title: "25 languages", caption: "Pick your language on first launch or change it any time in Settings." },
  ],

  // Play custom store listings — the same app, a feature graphic per market.
  storeListings: {
    blurb:
      "I'm experimenting with Play's custom store listings: the same app, shown to each market with its own feature graphic and screenshots filled with imagery that market would actually be saving.",
    items: [
      { src: banner, title: "Default", market: "Shown everywhere without a custom listing", caption: "The default listing — the baseline every custom one is measured against." },
      { src: listingIndia, title: "India", market: "Indian market", caption: "Statuses of the Taj Mahal, a tiger and Indian landmarks behind the same screens." },
      { src: listingArabic, title: "Arabic", market: "One listing across Arabic-speaking countries", caption: "Fully Arabic copy, laid out right to left, with desert, mosque and skyline imagery." },
    ],
  },

  architecture: {
    summary:
      "A deliberately single-module app. Clean architecture is enforced by package boundaries rather than by Gradle modules — at this size, multi-module plus convention plugins would be pure overhead — but the layering is kept strict enough that it could be promoted to real modules if the app grows. Features depend on core; features never import each other, and only one class in core touches the ad SDK.",
    layers: [
      {
        name: "core",
        modules: ["model", "data", "designsystem", "ui"],
        note: "Status models and unit-tested ad rules, the WhatsApp storage layer (SAF tree URIs, MediaStore on API 29+, File fallbacks below), the media editor and GIF encoder, DataStore, theme and shared composables.",
      },
      {
        name: "feature",
        modules: ["statuses", "downloads", "preview", "editor", "tools", "vault", "directchat", "onboarding", "settings"],
        note: "One ViewModel + Screen + components package per destination, plus the full-screen viewer and editors that sit above the bottom bar.",
      },
      {
        name: "app shell",
        modules: ["navigation", "di", "MainActivity", "widgets & tile"],
        note: "A single edge-to-edge activity hosting Compose, a typed nav graph, Koin modules started from the Application class, two home-screen widgets and a Quick Settings tile.",
      },
    ],
  },

  techStack: [
    {
      title: "Language & UI",
      items: ["Kotlin", "Jetpack Compose", "Material 3", "Material You", "Compose Navigation", "Core SplashScreen"],
    },
    {
      title: "Media",
      items: ["Coil (images, video, GIF)", "Media3 ExoPlayer", "Media3 Transformer", "uCrop", "Custom GIF encoder", "Picture-in-picture"],
    },
    {
      title: "Storage & DI",
      items: ["Storage Access Framework", "MediaStore", "DocumentFile", "DataStore Preferences", "AndroidX Biometric", "Koin", "kotlinx.serialization"],
    },
    {
      title: "Build & release",
      items: ["R8 minification", "Single :app module", "minSdk 24 · targetSdk 36", "Firebase Crashlytics & Analytics", "AdMob + UMP consent", "Play In-App Review & Updates"],
    },
  ],

  privacy: {
    headline: "Your statuses and saved files never leave your phone.",
    body:
      "The app reads WhatsApp's statuses folder and copies, edits and hides what you choose — all of it on the device. To find and fix bugs it sends anonymous crash reports and usage counts to Firebase. Every event comes from a fixed list with fixed parameters, so a file name, path or URI cannot reach it by accident. After the first week the app shows ads through AdMob, with Google's consent form and \"Ad privacy choices\" for users in the EEA and UK.",
    points: [
      "Every feature is free — no paywall, no 'pro' tier",
      "No account and no sign-in",
      "No file, file name or phone number is ever sent",
      "The in-app privacy notice says exactly what is sent, in all 25 languages",
    ],
  },

  permissions: [
    { name: "Folder access (SAF)", why: "On Android 10 and up you pick WhatsApp's .Statuses folder once — this needs no permission at all." },
    { name: "Storage (Android 9 and below)", why: "Only on older phones, to read the statuses folder and save into Downloads. Asked when you tap Save, never on launch." },
    { name: "Internet", why: "Used only by Firebase, for anonymous crash reports and usage counts, and by AdMob after the first week." },
    { name: "Advertising ID", why: "For AdMob only, once ads start after the first week. Firebase Analytics' own ad-ID collection is switched off." },
  ],

  nonGoals: ["No paywall", "No account", "No uploads of your media", "No sources beyond WhatsApp"],

  cta: {
    headlineLead: "Save WhatsApp statuses",
    headlineAccent: "in one tap",
    body: "Free, every feature included, and no account needed. Available now on Google Play.",
  },
};

export default statusSaver;
