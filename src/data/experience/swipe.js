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
    "Swipe is billing, invoicing and GST-compliance software for Indian businesses. I joined as an Android intern in December 2025 and converted to SDE 1 in June 2026. The work moved with the role: as an intern, features and fixes across the document, payment and compliance flows; since converting, the platform itself — 22 of the 28 feature flows I've rebuilt in Compose, then deleting the legacy versions, cutting the build's per-module boilerplate, and taking on the crash and performance work that comes with owning it.",

  stats: [
    { value: 28, label: "Feature flows rebuilt in Jetpack Compose" },
    { value: 16, label: "Legacy flows and feature flags deleted" },
    { value: 80, suffix: "%", label: "Less per-module Gradle boilerplate" },
    { value: 24, label: "Production crashes resolved" },
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
      body: "Moved shared module build config into Gradle convention plugins and centralised navigation arguments.",
      link: {
        text: "I wrote up how",
        url: "https://medium.com/@jrevanth101/how-i-shrunk-every-feature-modules-build-gradle-to-12-lines-c6341a73921f",
      },
    },
    {
      icon: "layers",
      title: "Leading the tail of the Compose migration",
      scale: "28 feature flows rebuilt",
      body: "Rebuilt settings, product, payment, expense, online store and analytics flows in Jetpack Compose.",
    },
    {
      icon: "scissors",
      title: "Then actually finishing it",
      scale: "7 flags · 9 legacy flows deleted",
      body: "Deleted migration flags and the legacy XML screens behind them once each Compose flow was stable.",
    },
    {
      icon: "activity",
      title: "Cutting remote-config fetch volume",
      scale: "Fleet-wide performance",
      body: "Longer fetch interval with realtime updates, so config changes still arrive without constant polling.",
    },
    {
      icon: "bug",
      title: "Crash fixes & reliability",
      scale: "~65% lower crash rate",
      body: "Resolved 24 production crashes from Crashlytics — crash-free sessions 99.84% → 99.95%, users 99.56% → 99.83%.",
    },
    {
      icon: "globe",
      title: "Multi-currency across the whole app",
      scale: "Cross-cutting change",
      body: "Added multi-currency support across documents, payments, expenses and PDFs.",
    },
    {
      icon: "grid",
      title: "Tax compliance is the hard part, not the UI",
      scale: "GST · E-way bill · E-invoice",
      body: "Features and fixes across GST, E-way bills, E-invoices, TDS and TCS.",
    },
    {
      icon: "cpu",
      title: "Shipping AI features people can correct",
      scale: "Product AI",
      body: "AI for notes, terms, product descriptions and expense capture, with custom instructions and feedback.",
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
