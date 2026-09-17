import { mifosPullRequests } from "./mifosPullRequests.js";

/* Mifos Initiative — one page covering both the open-source contributor work
   and the Mifos Summer of Code 2025 internship. The repos are public, so every
   PR is linked; Jira keys come from the PR descriptions where they exist. */
export const mifos = {
  slug: "mifos-initiative",
  company: "Mifos Initiative",
  role: "Open Source Mobile Developer · MSoC 2025 Intern",
  discipline: "Kotlin Multiplatform & Compose Multiplatform",
  period: "Nov 2024 — Present",
  accent: "emerald",
  eyebrow: "Experience · Open source",
  titleLead: "Banking software for the",
  titleAccent: "financially excluded",
  tagline: "Two years of Kotlin Multiplatform in public",
  summary:
    "Mifos builds open-source core banking used by microfinance institutions serving people that conventional banks don't reach. I've been contributing to its mobile apps since November 2024 — first as an open-source contributor, then through Mifos Summer of Code 2025, and now as a mentor. Everything below is public and linked: 123 pull requests, 365 reviews, and the migration of two production fintech apps from Android-only code to Kotlin Multiplatform.",

  stats: [
    { value: 123, label: "Pull requests authored" },
    { value: 111, label: "Merged — a 90% merge rate" },
    { value: 365, label: "Pull requests reviewed" },
    { value: 6, label: "Repositories contributed to" },
  ],

  meta: [
    { label: "Since", value: "Nov 2024" },
    { label: "MSoC 2025", value: "Jun — Sep 2025" },
    { label: "Stipend", value: "$2,500" },
    { label: "Now", value: "GSoC & C4GT mentor" },
    { label: "Everything", value: "Public & linked" },
  ],

  /* Shown above the category tables — the work worth explaining out loud. */
  highlights: [
    {
      icon: "layers",
      title: "Migrating two apps to Kotlin Multiplatform",
      scale: "11 PRs · ~16.9k lines",
      body: "Both flagship apps were Android-only. I moved the shared foundations — :core:ui, :core:network, :core:datastore and :libs:passcode — into commonMain across Mifos Mobile and the Field Officer app, which meant replacing Android-specific APIs with expect/actual declarations and Ktor, then deleting the legacy Android module once nothing depended on it.",
    },
    {
      icon: "smartphone",
      title: "Feature modules into Compose Multiplatform",
      scale: "12 PRs · ~7.6k lines",
      body: "Help, Savings, Settings and Location in Mifos Mobile; Home Drawer, Activate, Center, Search, Collection Sheet and Document in the Field Officer app. The interesting cases were the ones with no multiplatform equivalent — the signature capture screen had to move to commonMain on top of a Compose signature library rather than the Android view it was built on.",
    },
    {
      icon: "award",
      title: "Mifos Summer of Code 2025",
      scale: "Jun — Sep 2025 · $2,500",
      body: "Selected for the competitive MSoC program to lead the Kotlin Multiplatform migration of the Field Officer app — the tool loan officers use in the field. Across the internship I shipped the CMP migration of six feature modules, a complete client-management redesign, and the multi-step loan account creation flow.",
    },
    {
      icon: "grid",
      title: "A design system, then 25 screens on top of it",
      scale: "25 PRs · ~15.8k lines",
      body: "Rather than redrawing screens one by one, I landed a DesignToken file and a set of shared listing and stepper components first, then rebuilt client list, profile, transfer, closure, collateral and staff-assignment screens against them. The same approach carried into Mifos Mobile's transactions, charges and settings redesign.",
    },
    {
      icon: "gitBranch",
      title: "Type-safe navigation and breadcrumbs",
      scale: "Architecture",
      body: "The Field Officer app navigated by string routes, which fail at runtime rather than compile time. I migrated it to type-safe navigation and added breadcrumbs, so a loan officer four screens deep into a client record can see and jump back through the path they took.",
    },
    {
      icon: "bug",
      title: "Forty bug fixes, mostly other people's",
      scale: "40 PRs",
      body: "Serialization errors that stopped savings screens loading, unauthorized API states, a build failure from unresolved string resources, filter logic that returned the wrong accounts, dialogs with the wrong colours in dark mode. Unglamorous, and the part that decides whether the apps are usable.",
    },
    {
      icon: "users",
      title: "365 pull requests reviewed",
      scale: "More than I authored",
      body: "I now mentor for Google Summer of Code and Code4GovTech — conducting interviews, running standups, and reviewing contributor PRs. Reviewing three times as much as I write has taught me more about architecture than writing ever did.",
    },
    {
      icon: "share",
      title: "Upstream into the shared template",
      scale: "KMP Template",
      body: "Work that wasn't specific to one app went back into the organisation's KMP project template — share utilities, onboarding scaffolding, time-based sorting — so the next Mifos app starts with them rather than reinventing them.",
    },
  ],

  /* Collapsible PR tables. `key` indexes into the generated PR data. */
  categories: [
    {
      key: "kmp",
      icon: "layers",
      title: "Kotlin Multiplatform migration",
      blurb:
        "Moving shared infrastructure out of Android-only code and into commonMain, so the same logic compiles for Android, iOS and desktop. Mostly expect/actual declarations, swapping Retrofit for Ktor, and unpicking Android dependencies that had leaked into business logic.",
    },
    {
      key: "cmp",
      icon: "smartphone",
      title: "Compose Multiplatform migration",
      blurb:
        "Whole feature modules lifted from Android Jetpack Compose into Compose Multiplatform — screens, ViewModels, navigation and resources — including screens that had no multiplatform equivalent and needed rebuilding rather than moving.",
    },
    {
      key: "redesign",
      icon: "grid",
      title: "UI redesign & design system",
      blurb:
        "Design tokens and shared components first, then the screens rebuilt on top of them: client list, profile and details, transfers, closure, collateral, staff assignment, and Mifos Mobile's transactions, charges, passcode and settings surfaces.",
    },
    {
      key: "feature",
      icon: "plus",
      title: "New feature flows",
      blurb:
        "Capability that didn't exist before — multi-step loan account creation, beneficiary management and filtering, QR binding for savings and loan accounts, recurring deposits, transaction filters, and send-money changes in the wallet app.",
    },
    {
      key: "bugfix",
      icon: "bug",
      title: "Bug fixes",
      blurb:
        "Serialization crashes, unauthorized API states, broken filters, navigation dead ends, dark-mode colour bugs and a build failure from unresolved string resources. The largest category by count and the smallest by line change, which is usually how it goes.",
    },
    {
      key: "infra",
      icon: "gitBranch",
      title: "Architecture & tooling",
      blurb:
        "Type-safe navigation, navigation breadcrumbs, replacing Result with DataState in the datastore layer, enabling Compose previews across every module, dependency cleanup, Firebase distribution and localisation groundwork.",
    },
    {
      key: "community",
      icon: "users",
      title: "Community & docs",
      blurb: "Documentation and standup-link housekeeping — small, but it's what keeps an open-source project navigable for newcomers.",
    },
  ],

  prs: mifosPullRequests,

  productsBlurb:
    "Six public repositories, two of them apps on the Play Store used by real microfinance institutions. Everything here is open source — the code, the review discussions and the decisions that were reversed.",

  products: [
    {
      name: "Mifos Mobile",
      prs: 53,
      note: "Self-service banking app for microfinance customers",
      shipped: true,
      url: "https://play.google.com/store/apps/details?id=org.mifos.mobile",
    },
    {
      name: "Field Officer App",
      prs: 55,
      note: "The tool loan officers use in the field — my MSoC project",
      shipped: true,
      url: "https://play.google.com/store/apps/details?id=com.mifos.mifosxdroid",
    },
    { name: "Mifos Pay", prs: 10, note: "Kotlin Multiplatform digital wallet reference app" },
    { name: "KMP Template", prs: 3, note: "The org's shared multiplatform project template" },
    { name: "Group Banking", prs: 1, note: "Mifos X group banking setup" },
    { name: "Passcode CMP", prs: 1, note: "Shared passcode library, multiplatform" },
  ],

  takeaways: [
    {
      title: "Reviewing teaches more than writing",
      body: "365 reviews against 123 PRs authored. Reading other people's approaches to the same architecture — and having to explain why something won't work — sharpened my judgement far faster than shipping my own code did.",
    },
    {
      title: "Migration is mostly deletion",
      body: "The satisfying part of moving an app to Kotlin Multiplatform isn't writing the common code. It's finally deleting the Android-only module once nothing imports it any more.",
    },
    {
      title: "Build the system before the screens",
      body: "Landing design tokens and shared components before redrawing 25 screens meant the screens were small PRs that reviewers could actually check, instead of one unreviewable redesign.",
    },
    {
      title: "Open source is a public record",
      body: "Every decision here is linked and readable, including the ten PRs that were closed rather than merged. Working somewhere the record is permanent changes how you write code, and how you argue for it in review.",
    },
  ],

  cta: {
    headlineLead: "All of it is",
    headlineAccent: "public",
    body: "Nothing on this page needs taking on trust — the pull requests, the reviews and the apps themselves are all open.",
  },

  stack: [
    { title: "Language & UI", items: ["Kotlin", "Kotlin Multiplatform", "Compose Multiplatform", "Jetpack Compose"] },
    { title: "Architecture", items: ["MVI", "Clean Architecture", "Modularization", "Type-safe Navigation"] },
    { title: "Data", items: ["Ktor", "DataStore", "Room", "Kotlinx Serialization"] },
    { title: "Platform", items: ["expect/actual", "Koin", "Compose Resources"] },
    { title: "Process", items: ["Jira", "GitHub Actions", "Code Review", "Firebase Distribution"] },
  ],

  links: [
    { text: "Mifos Mobile", url: "https://play.google.com/store/apps/details?id=org.mifos.mobile", store: true },
    { text: "Field Officer App", url: "https://play.google.com/store/apps/details?id=com.mifos.mifosxdroid", store: true },
    {
      text: "All my openMF PRs",
      url: "https://github.com/pulls?q=is%3Apr+author%3ArevanthKumarJ+org%3AopenMF+",
    },
    {
      text: "PRs I reviewed",
      url: "https://github.com/pulls?q=is%3Apr+reviewed-by%3ArevanthKumarJ+org%3AopenMF+",
    },
    { text: "MSoC writeup", url: "https://gist.github.com/revanthkumarJ/133c9e8ce0abb111fb19873ad902cb70" },
  ],
};
