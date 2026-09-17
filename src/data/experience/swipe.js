import { swipeWork, swipeCategoryMeta } from "./swipeWork.js";

/* Swipe (YC S21) — one page covering both the internship and the SDE 1 role.
   The source repository is private and commercially sensitive: this page carries
   no pull request links, numbers or titles anywhere, and the category tables show
   work areas with real counts instead. */
export const swipe = {
  slug: "swipe",
  company: "Swipe (YC S21)",
  role: "Android Developer Intern → SDE 1",
  discipline: "Kotlin & Jetpack Compose",
  period: "Dec 2025 — Present",
  accent: "violet",
  eyebrow: "Experience · Full-time",
  titleLead: "Billing software where",
  titleAccent: "the maths has to be right",
  tagline: "From intern to SDE 1 on a YC-backed billing app",
  summary:
    "Swipe is billing, invoicing and GST-compliance software for Indian businesses. I joined as an Android intern in December 2025 and converted to SDE 1 in June 2026. The work moved with the role: as an intern, features and fixes across the document, payment and compliance flows; since converting, the platform itself — rebuilding 23 feature flows in Compose and then deleting the legacy versions, cutting the build's per-module boilerplate, and taking on the crash and performance work that comes with owning it.",

  stats: [
    { value: 23, label: "Feature flows rebuilt in Jetpack Compose" },
    { value: 8, label: "Legacy flows and feature flags deleted" },
    { value: 80, suffix: "%", label: "Less per-module Gradle boilerplate" },
    { value: 10, label: "Production crashes resolved" },
  ],

  meta: [
    { label: "Joined", value: "Dec 2025" },
    { label: "Converted", value: "Jun 2026" },
    { label: "Domain", value: "Billing · GST" },
    { label: "Stack", value: "Kotlin · Compose" },
    { label: "Market", value: "India" },
  ],

  highlights: [
    {
      icon: "gitBranch",
      title: "Convention plugins for the Gradle build",
      scale: "~80% less module boilerplate",
      body: "Every feature module carried a near-identical build script — the same Android config, Compose setup and dependency block, copied per module and drifting apart over time. I moved it into Gradle convention plugins so a module declares its plugin and little else, and centralised navigation arguments in the same change, which is where typos used to become runtime crashes.",
    },
    {
      icon: "layers",
      title: "Leading the tail of the Compose migration",
      scale: "23 feature flows rebuilt",
      body: "The app was legacy XML/Views. Each flow was rebuilt in Compose against new designs and shipped behind a remote flag, so old and new ran side by side in production and traffic moved gradually. A flow is rarely one screen — a product or settings flow is several, plus its sheets and dialogs. I shipped roughly a third of the migration, across settings, products, payments, expenses and analytics.",
    },
    {
      icon: "scissors",
      title: "Then actually finishing it",
      scale: "3 flags · 5 legacy flows deleted",
      body: "A feature flag at full rollout for months is not a safety net — it is an untested branch in every code path and two sets of bugs nobody can tell apart. Once each migrated flow was stable I deleted the flag and the XML screens, layouts and adapters behind it. Every one of these landed after I converted, because deletion is invisible on an intern's scorecard and unavoidable on an owner's.",
    },
    {
      icon: "activity",
      title: "Cutting remote-config fetch volume",
      scale: "Fleet-wide performance",
      body: "Configuration was being fetched far more often than it needed to be, and every fetch is a network round trip paid for by every device in the fleet. I moved it to a much longer minimum fetch interval backed by realtime updates, so changes still propagate promptly without the app effectively polling — then gated the config logging and removed redundant activation calls.",
    },
    {
      icon: "bug",
      title: "Reliability, including a bug no client could fix",
      scale: "Crashes & resilience",
      body: "Document numbers could collide when two devices created invoices at the same moment. Client-generated sequence numbers don't survive concurrency and no amount of local locking fixes it — that one had to be resolved server-side. Alongside it: resolving the production crash backlog from Crashlytics, and making the app degrade rather than dead-end when an external government tax portal is unavailable mid-onboarding.",
    },
    {
      icon: "globe",
      title: "Multi-currency across the whole app",
      scale: "Cross-cutting change",
      body: "Currency touches everything: document totals, tax calculation, payment recording, expenses, list filtering and PDF output. Adding it to an app that had assumed a single denomination meant finding every place an amount was implicitly in rupees — the kind of change that is only partly about writing code and mostly about knowing where to look.",
    },
    {
      icon: "grid",
      title: "Tax compliance is the hard part, not the UI",
      scale: "GST · E-way bill · E-invoice",
      body: "GST, E-way bills, E-invoices, TDS and TCS have rules that are unforgiving: get the maths wrong and a business files an incorrect return. A meaningful share of my bug fixes were compliance-logic bugs wearing a UI bug's clothes, and you cannot fix those without actually learning the domain.",
    },
    {
      icon: "cpu",
      title: "Shipping AI features people can correct",
      scale: "Product AI",
      body: "AI assistance for notes, terms, product descriptions and expense capture — plus the two parts that decide whether it is useful: user-level standing instructions so output matches how a business actually writes, and reason-based feedback rather than thumbs up or down, because a thumbs-down tells you something is wrong and a reason tells you what to fix.",
    },
  ],

  categories: swipeCategoryMeta,
  work: swipeWork,

  categoriesBlurb:
    "What I worked on, grouped by the kind of work, and the areas each one covered.",

  productsBlurb:
    "One app, eight surfaces. Document creation is the centre of it — everything else either feeds that flow or reports on it.",

  products: [
    { name: "Document creation & editing", note: "Line items, discounts, currencies, serial numbers, barcode scanning, PDF options" },
    { name: "Tax compliance", note: "GST, E-way bills, E-invoices, TDS and TCS — rules that decide whether a return is correct" },
    { name: "Products & inventory", note: "Listing, categorisation, batches, serial numbers and stock visibility" },
    { name: "Payments & banking", note: "Recording payments, payment history, credits and bank details" },
    { name: "Online store & coupons", note: "Storefront settings, order detail and activity, coupon creation" },
    { name: "Parties", note: "Customers and vendors — detail, credit limits, addresses, custom fields" },
    { name: "Expenses", note: "Creation, listing, categories, and AI-assisted capture" },
    { name: "Settings & onboarding", note: "New-user activation, preferences, print settings and in-app search" },
  ],

  takeaways: [
    {
      title: "The role change shows in the work",
      body: "As an intern I worked inside the app — features on surfaces that already existed, and the bugs in them. Since converting, the work has been the platform underneath: the build, the migration and its cleanup, and most of the crash and performance work. Working within the thing versus being responsible for it.",
    },
    {
      title: "Migrations are judged by what you delete",
      body: "Shipping a Compose flow behind a flag is the easy half. The migration isn't done until the flag and the old screens are gone — and that work never feels urgent, which is exactly why it gets left.",
    },
    {
      title: "Learn the domain or you'll fix the wrong thing",
      body: "Plenty of my bug reports looked like UI problems and were actually tax-rule problems. In compliance software the domain isn't context around the work, it is the work.",
    },
    {
      title: "The same bug turns up everywhere",
      body: "A checkbox whose label wasn't clickable, numbers rendering in scientific notation, an unescaped character breaking a route. I'd hit versions of all three in other codebases. Pattern recognition is most of debugging.",
    },
  ],

  cta: {
    headlineLead: "The app is",
    headlineAccent: "on Google Play",
    body: "All of it ships inside one app, used by businesses across India to invoice, get paid and stay compliant.",
  },

  stack: [
    { title: "Language & UI", items: ["Kotlin", "Jetpack Compose", "Material 3", "Coroutines", "Flow"] },
    { title: "Architecture", items: ["MVI", "Modularization", "Convention Plugins", "Centralized Navigation"] },
    { title: "Data", items: ["Retrofit", "Room", "DataStore", "Kotlinx Serialization"] },
    { title: "Firebase", items: ["Crashlytics", "Remote Config", "Analytics"] },
    { title: "Domain", items: ["GST compliance", "E-way Bill", "E-Invoice", "TDS / TCS", "Multi-currency"] },
  ],

  links: [
    { text: "Swipe on Play Store", url: "https://play.google.com/store/apps/details?id=com.swipe.bill", store: true },
  ],
};
