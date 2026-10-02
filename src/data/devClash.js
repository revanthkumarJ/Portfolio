// ============================================================================
// DEV CLASH — data for the /apps/devclash case-study page.
// Grounded in the live Play Store listing and the DevClash repo (module
// layout, scorers, data sources, release notes for 1.1.0).
// ============================================================================

import banner from "../Assets/devClash/banner.png";
import shotDevBattle from "../Assets/devClash/1.webp";
import shotGitHubSpotlight from "../Assets/devClash/2.webp";
import shotLeetCodeBattle from "../Assets/devClash/3.webp";
import shotLeetCodeMetrics from "../Assets/devClash/4.webp";
import shotCoderSpotlight from "../Assets/devClash/5.webp";
import shotAnalytics from "../Assets/devClash/6.webp";
import shotCard from "../Assets/devClash/7.webp";
import shotCardPdf from "../Assets/devClash/8.webp";

export const devClash = {
  slug: "devclash",
  path: "/apps/devclash",
  accent: "violet",

  name: "Dev Clash",
  fullName: "Dev Clash",
  titleLead: "Dev",
  titleAccent: "Clash",
  eyebrow: "Play Store app · Solo project",
  tagline: "Real developer data. Meaningful comparisons.",
  shortDescription:
    "Compare two developers side by side on public GitHub, LeetCode and Codeforces data — scored across independent categories, with no overall winner, and shareable as a card.",

  storeUrl: "https://play.google.com/store/apps/details?id=com.revanthdev.devclash",
  privacyUrl: "https://revanthkumarj.github.io/ExpenseTrackr/devclash-privacy-policy.html",
  developerUrl: "https://play.google.com/store/apps/dev?id=5399113798198807031",

  banner,

  meta: [
    { label: "Category", value: "Education" },
    { label: "Version", value: "1.1.0" },
    { label: "Requires", value: "Android 8.0+" },
    { label: "Content rating", value: "Everyone" },
    { label: "Role", value: "Solo — design, build, release" },
  ],

  intro: [
    "Developer comparisons usually end in one number — a score, a rank, a winner. Dev Clash refuses to produce one. It reads what GitHub, LeetCode and Codeforces already show the world, scores each side across independent categories, and puts the numbers behind every category on screen.",
    "Stars, repo counts and problem totals measure visibility and habit, not engineering ability, so the categories are never added up. You get six honest signals instead of one dishonest number — and a card you can share that says the same thing.",
  ],

  stats: [
    { value: 3, label: "Data sources compared" },
    { value: 6, label: "GitHub categories, never summed" },
    { value: 14, label: "Gradle modules" },
    { value: 89, label: "Unit tests" },
  ],

  platforms: [
    { name: "Android", status: "Shipped", shipped: true, note: "Live on Google Play." },
    { name: "iOS", status: "Not released", shipped: false, note: "Runs the same shared Compose app in a SwiftUI host; not yet on the App Store." },
  ],

  features: [
    {
      icon: "target",
      title: "Dev battle on GitHub",
      body: "Two handles, six categories — Project builder, Project impact, Open source, Consistency, Community and Repo quality — each scored 0–100 on a log curve, alongside a full metric table and a language split.",
    },
    {
      icon: "chart",
      title: "LeetCode and Codeforces clashes",
      body: "Five categories over solved counts, difficulty mix, contest rating and practice history. Ranks are won by the smaller number, and Depth is a share of Hard problems rather than a count.",
    },
    {
      icon: "search",
      title: "Developer spotlight",
      body: "One profile in depth: animated stat tiles, a language ring over original repositories, an activity timeline with a 30-day filter, and the top repositories — each tapping through to the source.",
    },
    {
      icon: "list",
      title: "Analytics for a cohort",
      body: "Save up to four handles and chart them against each other. A missing measure is absent rather than zero, and a profile that fails to load stays in the cohort instead of vanishing.",
    },
    {
      icon: "file",
      title: "Your own dev card",
      body: "Collect GitHub, LeetCode, LinkedIn, portfolio, résumé and contact links in one card, in five colour schemes, and export it as an image or a PDF whose links still work.",
    },
    {
      icon: "shield",
      title: "Honest about the data",
      body: "Forks never count as projects. GitHub's public feed is capped, so activity is shown as a floor, and a number the API did not return renders as “—”, never as zero.",
    },
  ],

  screensBlurb:
    "A GitHub tab, a Code tab for LeetCode and Codeforces, Analytics, your Profile card and Settings. Compose Multiplatform, dark only, on an aurora-and-glass design system.",

  shotAspect: "9/20",

  screenshots: [
    { src: shotDevBattle, title: "Dev battle", caption: "Six strength categories side by side, with how many each developer leads — and no overall winner." },
    { src: shotGitHubSpotlight, title: "Developer spotlight", caption: "One GitHub profile in depth: stat tiles, the language mix and the top repositories." },
    { src: shotLeetCodeBattle, title: "LeetCode battle", caption: "Problem solver, Depth, Competitor, Consistency and Precision, each explained under its bar." },
    { src: shotLeetCodeMetrics, title: "The numbers behind it", caption: "Problems, contests and practice, metric by metric, with the leading side highlighted." },
    { src: shotCoderSpotlight, title: "Coder spotlight", caption: "A difficulty ring, per-difficulty progress against each pool, and the contest record." },
    { src: shotAnalytics, title: "Analytics", caption: "A saved cohort charted together — problems solved stacked by difficulty, Hard problems, contest rating." },
    { src: shotCard, title: "Your dev card", caption: "Every profile you keep, in one card you build once and share anywhere." },
    { src: shotCardPdf, title: "Exported as PDF", caption: "The same card as a PDF, with every link still clickable." },
  ],

  architecture: {
    summary:
      "Kotlin Multiplatform with one shared Compose UI for Android and iOS, split into core and feature modules. Screens never see a DTO: the network layer speaks each API's shapes and the data layer maps them into domain models, so an unofficial LeetCode source can disappear without touching a screen. Scoring is pure domain logic, which is why it is tested exhaustively.",
    layers: [
      {
        name: "core",
        modules: ["domain", "network", "data", "presentation", "design-system"],
        note: "Models and the pure scorers, Ktor clients per source, mappers with a short in-memory cache and DataStore, the string catalog, and the aurora, glass and chart components shared by screens and exported cards.",
      },
      {
        name: "feature",
        modules: ["home", "profile", "compare", "code", "leetcode", "analytics", "card"],
        note: "One MVI presentation module per surface — State, Action and Event, with a Root composable that owns the ViewModel and a stateless Screen.",
      },
      {
        name: "app shell",
        modules: ["shared", "androidApp", "iosApp"],
        note: "The shared App(), bottom bar, nav graph and Koin modules, hosted by an Android activity and a SwiftUI app.",
      },
    ],
  },

  techStack: [
    {
      title: "Language & UI",
      items: ["Kotlin", "Kotlin Multiplatform", "Compose Multiplatform", "Material 3", "Canvas-drawn charts", "Compose Navigation"],
    },
    {
      title: "Data",
      items: ["Ktor", "kotlinx.serialization", "Coil 3", "DataStore", "GitHub REST API", "Codeforces API", "LeetCode with a GraphQL fallback"],
    },
    {
      title: "Architecture",
      items: ["MVI", "Koin", "Clean architecture", "Convention plugins (build-logic)", "14 Gradle modules"],
    },
    {
      title: "Build & release",
      items: ["R8 minification", "minSdk 26 · targetSdk 36", "Android + iOS targets", "Play Store release"],
    },
  ],

  privacy: {
    headline: "Only public data, and nothing kept about the people you compare.",
    body:
      "Dev Clash reads what GitHub, LeetCode and Codeforces already publish anonymously. Beyond a short in-memory cache and your own recent-handle list, it stores nothing about the developers you compare. Your dev card lives on your device and goes wherever you share it, nowhere else.",
    points: [
      "No ads, no paywall",
      "No account and no sign-up",
      "Optional GitHub token, stored on your device only",
      "Never writes to GitHub — a token with no scopes is enough",
    ],
  },

  permissions: [
    { name: "Internet", why: "To read public profiles from GitHub, LeetCode and Codeforces." },
  ],

  nonGoals: ["No overall winner", "No account", "No ads", "Forks never count"],

  cta: {
    headlineLead: "Compare developers",
    headlineAccent: "without a single number",
    body: "Free, no account needed. Available now on Google Play.",
  },
};

export default devClash;
