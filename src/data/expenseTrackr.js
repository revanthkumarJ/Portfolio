// ============================================================================
// EXPENSETRACKR — data for the /apps/expensetrackr case-study page.
// Grounded in the live Play Store listing and the public ExpenseTrackr repo
// (module graph, version catalog, locale resources, README).
// 🖼️  SCREENSHOTS: drop phone shots into src/Assets/expenseTrackr/ and add
//     them to `screenshots` below. Until then the section shows placeholders.
// ============================================================================

import banner from "../Assets/images/playstore_expense_tracker.png";
import shotDashboard from "../Assets/expenseTrackr/2.webp";
import shotAdd from "../Assets/expenseTrackr/5.webp";
import shotAnalytics from "../Assets/expenseTrackr/1.webp";
import shotSearch from "../Assets/expenseTrackr/8.webp";
import shotDownloads from "../Assets/expenseTrackr/3.webp";
import shotReport from "../Assets/expenseTrackr/7.webp";
import shotBackup from "../Assets/expenseTrackr/6.webp";
import shotLanguage from "../Assets/expenseTrackr/4.webp";

export const expenseTrackr = {
  slug: "expensetrackr",
  path: "/apps/expensetrackr",
  accent: "emerald",

  name: "ExpenseTrackr",
  fullName: "Expense Tracker: Money Manager",
  titleLead: "Expense",
  titleAccent: "Trackr",
  titleTight: true, // renders as one word: ExpenseTrackr
  eyebrow: "Play Store app · Kotlin Multiplatform",
  tagline: "Track every rupee. Stay in control.",
  shortDescription:
    "Offline, private personal-finance tracker — expenses, income, budgets and analytics, with PDF and Excel reports generated entirely on-device.",

  storeUrl: "https://play.google.com/store/apps/details?id=com.revanthdev.expensetrackr",
  privacyUrl: "https://revanthkumarj.github.io/ExpenseTrackr/privacy-policy.html",
  repoUrl: "https://github.com/revanthkumarJ/ExpenseTrackr",
  developerUrl: "https://play.google.com/store/apps/dev?id=5399113798198807031",

  banner,

  meta: [
    { label: "Category", value: "Finance" },
    { label: "Version", value: "1.0.7" },
    { label: "Requires", value: "Android 8.0+" },
    { label: "Content rating", value: "Everyone" },
    { label: "Role", value: "Solo — design, build, release" },
  ],

  intro: [
    "Most budgeting apps want an account, a subscription, and a copy of your bank data on someone else's server. ExpenseTrackr takes the opposite position: log what you spend and earn, set budgets, see where the money actually goes — and keep every rupee of it on your own device.",
    "It is a single Kotlin Multiplatform codebase that renders a native UI on Android, iOS and Desktop through Compose Multiplatform, laid out as 16 Gradle modules in a clean, MVI architecture. The Android build is live on Google Play; iOS and Desktop share the same domain and data layers and are being finished next.",
  ],

  stats: [
    { value: 16, label: "Gradle modules" },
    { value: 24, label: "Languages shipped" },
    { value: 3, label: "Target platforms" },
    { value: 0, label: "Third-party report libraries" },
  ],

  platforms: [
    { name: "Android", status: "Shipped", shipped: true, note: "Live on Google Play, feature-complete." },
    { name: "iOS", status: "In progress", shipped: false, note: "Runs the shared Compose app; native host being finished." },
    { name: "Desktop (JVM)", status: "In progress", shipped: false, note: "Compose Desktop target wired against the same shared logic." },
  ],

  features: [
    {
      icon: "wallet",
      title: "Expenses and income, separately",
      body: "Log spending in three taps or fewer — amount, category, sub-category, date and notes. Income and salary are tracked apart from spend math, so budgets and savings figures stay honest.",
    },
    {
      icon: "target",
      title: "Budgets that warn before you blow them",
      body: "Set an overall monthly budget plus optional per-category limits. Progress is colour-coded green / amber / red, with a warning before you cross the line — and an 'allow over budget' escape hatch when you need it.",
    },
    {
      icon: "chart",
      title: "Analytics you can interrogate",
      body: "An interactive donut chart you can tap to drill into a category, a spent-vs-saved split, spending-over-time bars, and stat cards for top category, daily average and savings rate.",
    },
    {
      icon: "folder",
      title: "Categories your way",
      body: "Nine pre-seeded categories plus unlimited custom ones, each with its own emoji icon and colour, and sub-categories underneath. Deletes warn you when transactions are still linked.",
    },
    {
      icon: "file",
      title: "PDF and Excel reports, written from scratch",
      body: "Export a paginated PDF report or a real .xlsx workbook for any range — with category and sub-category breakdowns. Both are produced by hand-rolled, dependency-free generators in shared Kotlin, so a report looks identical on every platform.",
    },
    {
      icon: "lock",
      title: "App lock and 24 languages",
      body: "A 6-digit PIN stored as a SHA-256 hash, with optional fingerprint or face unlock handled by the OS. The interface ships in 24 languages with an in-app switcher that needs no restart, RTL included.",
    },
  ],

  screensBlurb:
    "Compose Multiplatform with Material 3 (Material You), light and dark themes, and dynamic colour on Android 12+.",

  shotAspect: "9/20", // raw device screenshots

  screenshots: [
    { src: shotDashboard, title: "Dashboard", caption: "This week at a glance — income remaining against budget, then every category ranked by share of spend." },
    { src: shotAdd, title: "Add a transaction", caption: "Expense or income, amount, date and time, then pick a category from the sheet." },
    { src: shotAnalytics, title: "Analytics", caption: "Interactive donut chart with top category, daily average, and a spent-vs-saved split showing the savings rate." },
    { src: shotSearch, title: "Search and filter", caption: "Search every transaction and filter by range, expense or income." },
    { src: shotDownloads, title: "Reports", caption: "Export the full transaction table as a formatted PDF or a sortable Excel workbook." },
    { src: shotReport, title: "Generated PDF report", caption: "Paginated report with income/expense/net totals plus category- and sub-category-wise breakdowns — written by a dependency-free PDF writer in shared Kotlin." },
    { src: shotBackup, title: "Backup & restore", caption: "Back up to CSV in shared storage that survives clearing app data or reinstalling, then restore and merge." },
    { src: shotLanguage, title: "24 languages", caption: "Language picked during onboarding and changeable any time from Settings." },
  ],

  architecture: {
    summary:
      "One Kotlin Multiplatform codebase across 16 Gradle modules, with a strict one-way dependency direction: platform hosts → shared Compose nav host → feature modules → core. Every screen follows the same MVI contract — State, Action, Event, a ViewModel exposing a StateFlow plus an event channel, a stateless Screen, and a Root that wires DI and navigation.",
    layers: [
      {
        name: "hosts + shared",
        modules: ["androidApp", "iosApp", "desktopApp", "shared"],
        note: "Thin platform hosts over one shared Compose App() and navigation graph.",
      },
      {
        name: "core",
        modules: ["domain", "data", "database", "presentation", "design-system"],
        note: "Pure-Kotlin models and repository interfaces, Room + DataStore implementations, shared UI utilities and the design system.",
      },
      {
        name: "feature",
        modules: ["onboarding", "applock", "dashboard", "expenses", "analytics", "budget", "categories", "settings"],
        note: "Eight presentation-only modules, each a self-contained MVI screen set that never imports a sibling.",
      },
    ],
  },

  techStack: [
    {
      title: "Language & UI",
      items: ["Kotlin Multiplatform 2.4", "Compose Multiplatform", "Material 3", "Material Icons Extended", "Coroutines & Flow", "Glance app widget"],
    },
    {
      title: "Architecture",
      items: ["Clean Architecture", "MVI (State / Action / Event)", "Koin", "Type-safe Compose Navigation", "expect / actual bridges"],
    },
    {
      title: "Data",
      items: ["Room (KMP)", "androidx.sqlite bundled driver", "DataStore Preferences", "kotlinx.serialization", "kotlinx.datetime"],
    },
    {
      title: "Reporting & security",
      items: ["In-house PDF 1.4 writer", "In-house SpreadsheetML (.xlsx) writer", "AndroidX Biometric", "Security Crypto", "SHA-256 PIN hashing"],
    },
    {
      title: "Build & release",
      items: ["AGP 9 · Gradle convention plugins", "KSP", "R8 + resource shrinking", "Firebase Crashlytics", "Play in-app updates", "Google AdMob", "minSdk 26 · targetSdk 36"],
    },
    {
      title: "Testing & tooling",
      items: ["JUnit 5", "Turbine", "assertk", "kotlinx-coroutines-test", "Kermit logging"],
    },
  ],

  privacy: {
    headline: "Your financial data never leaves your phone.",
    body:
      "Every expense, income entry, budget and category lives in a local database on your device. There is no account, no cloud sync of your records, and nothing to sell. Firebase collects anonymous crash reports and aggregate usage so stability problems can be found and fixed — never your financial data.",
    points: [
      "No sign-up and no account",
      "Works fully offline",
      "Financial records are never uploaded",
      "Play Data safety: no data collected, no data shared",
    ],
  },

  permissions: [
    { name: "Biometrics", why: "Optional fingerprint or face unlock for app lock — handled by the OS, and no biometric data is stored." },
    { name: "Storage (exports)", why: "To write CSV, PDF and Excel reports into a folder you can open in any other app." },
    { name: "Notifications", why: "For budget warnings and reminders you have switched on." },
    { name: "Internet", why: "For anonymous crash and usage diagnostics, and ad delivery." },
  ],

  nonGoals: ["No account", "No cloud sync of records", "No bank linking", "No subscription"],

  cta: {
    headlineLead: "Know exactly where",
    headlineAccent: "every rupee goes",
    body: "Free, offline-first, and private by design. Available now on Google Play.",
  },
};

export default expenseTrackr;
