// ============================================================================
// CONTENT DATA — single source of truth for everything shown on the site.
// 🖼️  PLACEHOLDER IMAGES: every image used on the site is imported HERE and
//     only here. To swap a placeholder for a real asset, drop the new file in
//     src/Assets/ and change the import path below. Nothing else to touch.
// ============================================================================

// ---- Images currently in the repo (some are real, some acting as placeholders)
import profileImg from "../Assets/revanth.png"; // 🖼️ swap: about photo
// ✅ HERO IMAGE — workspace portrait (4:5), right side of the headline
import heroWorkspaceImg from "../Assets/main_banner_image.jpg";
import mifosMobileImg from "../Assets/mifos_mobile.png"; // 🖼️ swap: Mifos Mobile shots
import androidClientImg from "../Assets/android_studio.png"; // 🖼️ swap: Android-Client shots
import abhiyanthImg from "../Assets/Projects/abhiyanth.png";
import memeImg from "../Assets/meme.png";
import swipeAssignImg from "../Assets/swipe_assign.png";
import kisanImg from "../Assets/Projects/kisan.png";
import financeImg from "../Assets/Projects/Finance.png";
import departmentImg from "../Assets/Projects/department.png";
// ✅ Play Store feature graphics (1024×500) — live apps
import psExpenseTrackrImg from "../Assets/images/playstore_expense_tracker.png";
import psPocketTunesImg from "../Assets/images/playstore_pocket_tunes.png";
import psStatusSaverImg from "../Assets/images/playstore_status_saver.png";

import resumePdf from "../Assets/Revanth_final_version.pdf";

// ---------------------------------------------------------------------------
export const identity = {
  name: "Revanth Kumar Jilakara",
  shortName: "Revanth",
  monogram: "RJ",
  headline: "I build production Android & Kotlin Multiplatform apps used by thousands of businesses.",
  subline: "SDE 1 @ Swipe (YC S21) · Mifos open-source mentor",
  roles: ["Android Engineer", "Kotlin Multiplatform Specialist", "Open-Source Mentor"],
  location: "Andhra Pradesh, India",
  openToOpportunities: true,
  email: "jrevanth101@gmail.com",
  resume: resumePdf,
  photo: profileImg, // 🖼️ swap with a high-res photo later
  heroImage: heroWorkspaceImg, // 🖼️ 4:5 workspace portrait (null → placeholder)
};

export const socials = [
  { name: "GitHub", url: "https://github.com/revanthkumarJ", icon: "github" },
  { name: "LinkedIn", url: "https://www.linkedin.com/in/jilakararevanthkumar/", icon: "linkedin" },
  { name: "Email", url: "mailto:jrevanth101@gmail.com", icon: "mail" },
];

export const heroStats = [
  { value: 120, suffix: "+", label: "Open-source PRs merged" },
  { value: 98, suffix: "%", label: "PR merge rate" },
  { value: 300, suffix: "+", label: "Contributor PRs reviewed" },
  { value: 1000, suffix: "+", label: "DSA problems solved" },
];

// ---------------------------------------------------------------------------
// PLAY STORE APPS — live, published apps. Shown right after About.
export const playStore = {
  developerUrl: "https://play.google.com/store/apps/dev?id=5399113798198807031",
  apps: [
    {
      name: "ExpenseTrackr",
      tagline: "Track every expense. Take control of your money.",
      blurb: "Offline, private personal-finance tracker with smart analytics, budgets, categories, app lock, and Google AdMob monetization.",
      highlights: ["100% Offline", "PIN & Biometric Lock", "Smart Analytics", "Google AdMob"],
      image: psExpenseTrackrImg,
      accent: "emerald",
      url: "https://play.google.com/store/apps/details?id=com.revanthdev.expensetrackr",
    },
    {
      name: "Pocket Tunes",
      tagline: "Your music, in your pocket.",
      blurb: "A fast, lightweight offline music player — seamless playback, playlists, and a clean modern UI.",
      highlights: ["Offline Playback", "Playlists", "Fast & Lightweight"],
      image: psPocketTunesImg,
      accent: "emerald",
      url: "https://play.google.com/store/apps/details?id=com.revanthapps.pocketunes",
    },
    {
      name: "Status Saver",
      tagline: "No ads. Just save.",
      blurb: "Save WhatsApp statuses — images & videos — with a built-in gallery and auto refresh. Private, no ads.",
      highlights: ["No Ads", "Images & Videos", "100% Private"],
      image: psStatusSaverImg,
      accent: "cyan",
      url: "https://play.google.com/store/apps/details?id=com.revanthapps.statussavernoads",
    },
  ],
};

export const about = {
  paragraphs: [
    "I'm a Software Engineer from Andhra Pradesh, India, specializing in Android and Kotlin Multiplatform development. Currently SDE 1 – Android Developer at Swipe (YC S21), where I was promoted from intern after migrating 70+ screens to Jetpack Compose and restructuring a monolith into multi-module Clean Architecture.",
    "I'm an active contributor and mentor at the Mifos Initiative — 120+ merged PRs at a 98% merge rate, 300+ contributor PRs reviewed, and 20+ modules migrated to Kotlin Multiplatform across production fintech apps used worldwide. I was a Mifos Summer of Code 2025 intern and now mentor contributors for GSoC and Code4GovTech.",
    "I hold a B.Tech in CSE from RGUKT RK Valley and qualified GATE CS 2025. Off the keyboard: badminton, chess, and poking at new tools.",
  ],
  quote: "Consistency and curiosity are the keys to growth.",
};

// Primary = the headline skill set (Android/KMP). Secondary = supporting.
export const techStack = {
  primary: {
    title: "Android & Kotlin Multiplatform",
    subtitle: "My core craft — what I ship to production every day",
    items: [
      "Kotlin", "Jetpack Compose", "Kotlin Multiplatform", "Compose Multiplatform",
      "Coroutines & Flow", "MVI", "Clean Architecture", "Multi-module Architecture",
      "Room (KMP)", "SQLDelight", "DataStore", "Koin", "Dagger / Hilt", "Ktor / Ktorfit", "Retrofit", "WorkManager",
      "Compose Navigation", "Material 3", "kotlinx.serialization",
      "Gradle Convention Plugins", "R8 / Play Store Releases",
      "Firebase Crashlytics & Analytics", "Lottie", "GitHub Actions (CI/CD)",
    ],
  },
  secondary: [
    {
      title: "Web & Backend",
      items: ["React", "JavaScript", "TypeScript", "Node.js", "Express", "Tailwind CSS", "Firebase", "MongoDB", "MySQL"],
    },
    {
      title: "Languages & Tools",
      items: ["Java", "Python", "C", "Git & GitHub", "Postman", "Figma-to-UI"],
    },
  ],
};

export const codingProfiles = [
  { name: "LeetCode", detail: "Knight · 800+ solved", url: "https://leetcode.com/u/RevanthKumarJ/" },
  { name: "GeeksforGeeks", detail: "Institute Rank 1 · 1000+ solved", url: "https://www.geeksforgeeks.org/user/jrevanth/" },
];

// ---------------------------------------------------------------------------
// Company → official website. Company names in Experience link here when present.
export const companyWebsites = {
  "Swipe (YC S21)": "https://getswipe.in/",
  "Mifos Initiative": "https://mifos.org/",
  "Mobile Byte Sensei": "https://play.google.com/store/apps/dev?id=8035184358048594730",
};

// Hero company names link to the company's Play Store apps (not website).
export const companyApps = {
  swipe: "https://play.google.com/store/apps/details?id=in.swipe.app",
  mifos: "https://play.google.com/store/apps/developer?id=Mifos+Initiative",
};

// ---------------------------------------------------------------------------
// EXPERIENCE — ordered newest first. `highlights` powers the expandable panel.
export const experience = [
  {
    company: "Swipe (YC S21)",
    role: "SDE 1 — Android Developer",
    period: "Jun 15, 2026 — Present",
    current: true,
    summary:
      "Owning end-to-end feature flows in the Swipe billing app — settings, products, expenses, and indirect income — while improving architecture, build tooling, and reliability for thousands of businesses.",
    highlights: [
      "Built all settings pages — document, general, thermal print, and product settings.",
      "Own the entire products, expenses, and indirect-income flows (list / create / edit).",
      "Introduced build-logic convention plugins, cutting app build.gradle complexity by ~80%.",
      "Work on notifications, thermal prints, PDF generation; fix production crashes via Crashlytics.",
    ],
    tech: ["Kotlin", "Jetpack Compose", "MVI", "Koin", "Room", "Convention Plugins"],
    links: [{ text: "Swipe on Play Store", url: "https://play.google.com/store/apps/details?id=com.swipe.bill" }],
  },
  {
    company: "Swipe (YC S21)",
    role: "Android Developer Intern",
    period: "Dec 2025 — Jun 14, 2026",
    summary:
      "Migrated 70+ screens from legacy XML to Jetpack Compose across 15 production flows — improving UX along the way — and restructured a monolithic codebase into multi-module Clean Architecture with MVI.",
    highlights: [
      "Migrated the onboarding screen — the first thing users see — with a fresh Compose UI.",
      "Migrated document settings, templates, create-expense, and create-product screens.",
      "Restructured monolithic files into multi-module Clean Architecture built for scale.",
      "Resolved production crashes and UI defects via Crashlytics and Intercom.",
    ],
    tech: ["Kotlin", "Jetpack Compose", "Coroutines", "Flow", "Retrofit", "Room"],
    links: [{ text: "Swipe on Play Store", url: "https://play.google.com/store/apps/details?id=com.swipe.bill" }],
  },
  {
    company: "Mifos Initiative",
    role: "Mentor — GSoC & C4GT",
    period: "Mar 2026 — Present",
    current: true,
    summary:
      "Mentoring open-source contributors: reviewing PRs, running standups, conducting GSoC and Code4GovTech interviews, and guiding Kotlin Multiplatform architecture discussions.",
    highlights: [
      "Conduct interviews for Google Summer of Code and Code4GovTech.",
      "Review contributor pull requests across community projects (300+ reviewed).",
      "Run standups and guide mobile-architecture discussions.",
      "Help new contributors onboard into the Mifos ecosystem.",
    ],
    tech: ["Kotlin Multiplatform", "Code Review", "Mentorship"],
    links: [],
  },
  {
    company: "Mifos Initiative",
    role: "Open Source Mobile Developer",
    period: "Nov 2024 — Present",
    current: true,
    summary:
      "120+ PRs at a 98% merge rate across 5 production fintech repositories. Migrated 20+ modules to Kotlin Multiplatform in apps focused on financial inclusion.",
    highlights: [
      "android-client: 50+ PRs migrating UI to KMP/CMP, Figma redesigns, type-safe navigation.",
      "mifos-mobile: 45+ PRs — module migrations, QR binding, localization, new screens.",
      "mobile-wallet: migrated APIs to the Self API and refreshed the surrounding flows.",
      "Contributed to kmp-project-template and mifos-x-group-banking setup.",
    ],
    tech: ["Kotlin Multiplatform", "Compose Multiplatform", "Ktor", "Koin", "MVI"],
    links: [
      { text: "All merged PRs", url: "https://github.com/pulls?q=is%3Apr+is%3Amerged+author%3ArevanthKumarJ+org%3AopenMF+" },
      { text: "PRs reviewed", url: "https://github.com/pulls?q=is%3Apr+reviewed-by%3ArevanthKumarJ+org%3AopenMF+" },
      { text: "Mifos Mobile", url: "https://play.google.com/store/apps/details?id=org.mifos.mobile" },
      { text: "Android Client", url: "https://play.google.com/store/apps/details?id=com.mifos.mifosxdroid" },
    ],
  },
  {
    company: "Mifos Initiative",
    role: "Mifos Summer of Code 2025 Intern",
    period: "Jun 2025 — Sep 2025",
    summary:
      "Selected for the competitive MSoC program ($2,500 stipend). Led the Kotlin Multiplatform migration of the Field Officer app and modernized UI across 100+ screens in three repositories.",
    highlights: [
      "100+ PRs authored and 150+ reviewed during the program window.",
      "Migrated core modules of android-client and mifos-mobile to KMP/CMP.",
      "Implemented new Figma-based UIs: transactions, charges, beneficiaries, passcode, and more.",
      "Grew from struggling to raise a single PR to redesigning two production apps.",
    ],
    tech: ["Kotlin Multiplatform", "Compose Multiplatform", "GitHub Actions", "Clean Architecture"],
    links: [
      { text: "Full MSoC writeup", url: "https://gist.github.com/revanthkumarJ/133c9e8ce0abb111fb19873ad902cb70" },
      { text: "Weekly progress", url: "https://github.com/revanthkumarJ/MSOC_progress" },
    ],
  },
  {
    company: "Mobile Byte Sensei",
    role: "Mobile Development Intern (KMP & CMP)",
    period: "Apr 2025 — Nov 2025",
    summary:
      "Delivered 7 production-grade Kotlin Multiplatform apps — reusable UI components, file management, Firebase Analytics, and Crashlytics fixes in an Agile team.",
    highlights: [
      "Shipped Reels Downloader, Stories Downloader, and Byte Wallpaper to the Play Store.",
      "Built reusable Compose Multiplatform components and CI/CD pipelines.",
      "Resolved critical Crashlytics-reported issues in production.",
    ],
    tech: ["Kotlin Multiplatform", "Compose Multiplatform", "Firebase", "CI/CD"],
    links: [
      { text: "Reels Downloader", url: "https://play.google.com/store/apps/details?id=com.sensei.social" },
      { text: "Stories Downloader", url: "https://play.google.com/store/apps/details?id=com.sensei.stories" },
      { text: "Byte Wallpaper", url: "https://play.google.com/store/apps/details?id=org.mobilebytesensei.wallpaper" },
    ],
  },
];

// ---------------------------------------------------------------------------
// PROJECTS — one unified grid, most significant first.
export const gridProjects = [
  {
    title: "Mifos Mobile — KMP Migration",
    description:
      "Migrated 7 modules of a worldwide self-service banking app to Kotlin Multiplatform & Compose Multiplatform — Android, iOS, Web/WASM, and Desktop. 45+ merged PRs.",
    tech: ["KMP", "CMP", "Ktor", "Koin"],
    image: mifosMobileImg,
    links: [
      { text: "GitHub", url: "https://github.com/openMF/mifos-mobile", kind: "github" },
      { text: "PRs", url: "https://github.com/openMF/mifos-mobile/pulls?q=is%3Amerged+is%3Apr+author%3ArevanthkumarJ+", kind: "prs" },
      { text: "Play Store", url: "https://play.google.com/store/apps/details?id=org.mifos.mobile", kind: "playstore" },
    ],
  },
  {
    title: "Android Client — KMP Migration",
    description:
      "52 merged PRs migrating 10 modules of the Mifos Field Officer app to KMP/CMP — Figma redesigns, type-safe navigation, and offline-first flows.",
    tech: ["KMP", "CMP", "Room", "MVI"],
    image: androidClientImg,
    links: [
      { text: "GitHub", url: "https://github.com/openMF/android-client", kind: "github" },
      { text: "PRs", url: "https://github.com/openMF/android-client/pulls?q=is%3Amerged+is%3Apr+author%3ArevanthkumarJ+", kind: "prs" },
      { text: "Play Store", url: "https://play.google.com/store/apps/details?id=com.mifos.mifosxdroid", kind: "playstore" },
    ],
  },
  {
    title: "Abhiyanth Fest Platform",
    description:
      "Led the frontend team for the Abhiyanth 2K25 college-fest platform — React, Redux, Firebase auth/hosting, CashFree payments, and a full admin panel.",
    tech: ["React", "Redux", "Firebase", "Material UI"],
    image: abhiyanthImg,
    links: [{ text: "GitHub", url: "https://github.com/revanthkumarJ/abhiyanth-client", kind: "github" }],
  },
  {
    title: "Meme Studio",
    description: "Kotlin Multiplatform meme editor with templates and custom editing, built on Compose Multiplatform.",
    tech: ["KMP", "CMP"],
    image: memeImg,
    links: [{ text: "GitHub", url: "https://github.com/revanthkumarJ/MemeStudio", kind: "github" }],
  },
  {
    title: "Swipe Assignment App",
    description: "Modern Android app — onboarding, product listing with search, offline-first Room sync, theming.",
    tech: ["Kotlin", "Room", "Retrofit"],
    image: swipeAssignImg,
    links: [{ text: "GitHub", url: "https://github.com/revanthkumarJ/swipe-assignment", kind: "github" }],
  },
  {
    title: "KisanConnect",
    description: "Platform connecting farmers and customers — role-based UIs with React, Express, and TypeScript.",
    tech: ["React", "Express", "TypeScript"],
    image: kisanImg,
    links: [
      { text: "Client", url: "https://github.com/revanthkumarJ/kisan_connect_client", kind: "github" },
      { text: "API", url: "https://github.com/revanthkumarJ/Kisan_connect_API", kind: "github" },
    ],
  },
  {
    title: "Finance Tracker (Web)",
    description: "Node.js + TypeScript API with a React/MUI frontend to manage and analyze bank statements.",
    tech: ["Node.js", "TypeScript", "React"],
    image: financeImg,
    links: [
      { text: "Client", url: "https://github.com/revanthkumarJ/Finance-Client", kind: "github" },
      { text: "API", url: "https://github.com/revanthkumarJ/Finance-API", kind: "github" },
    ],
  },
  {
    title: "Dept. Resource Manager",
    description: "Kotlin app managing announcements, complaints, and timetables for students, faculty, and HOD.",
    tech: ["Kotlin", "Firebase"],
    image: departmentImg,
    links: [{ text: "GitHub", url: "https://github.com/revanthkumarJ/Departmental-Resource-Management-App", kind: "github" }],
  },
];

// ---------------------------------------------------------------------------
export const achievements = [
  { title: "C4GT 2026 Mentor", detail: "Mentor for the Mifos Pay project under Code for GovTech 2026.", tag: "Mentorship" },
  { title: "Mifos Summer of Code 2025", detail: "Selected for the competitive program with a $2,500 stipend.", tag: "Open Source" },
  { title: "120+ Open-Source PRs", detail: "Merged across production repos at a 98% merge rate.", tag: "Open Source" },
  { title: "GATE CS 2025", detail: "Qualified — strong command of core CS fundamentals.", tag: "Academics" },
  { title: "LeetCode Knight", detail: "800+ problems solved with a consistent contest rating.", tag: "DSA" },
  { title: "GFG Institute Rank 1", detail: "1000+ problems — first among all institute peers.", tag: "DSA" },
];

export const testimonial = {
  quote:
    "I highly recommend Jilakara Revanth Kumar as a Kotlin Multiplatform Developer who consistently delivers high-quality, scalable solutions. Revanth brings strong expertise in Kotlin Multiplatform development, with a deep understanding of building efficient, cross-platform architectures. His approach to system design and architecture is thoughtful, well-structured, and aligned with best practices, ensuring maintainable and future-ready codebases. One of his standout strengths is his debugging ability — he has a sharp eye for identifying complex issues and resolving them with clarity and precision. He approaches challenges methodically and remains solution-oriented, even in high-pressure situations. Beyond his technical skills, Revanth is reliable, proactive, and a great collaborator, making him a valuable asset to any development team. I strongly recommend him for any role requiring expertise in Kotlin Multiplatform and robust software architecture.",
  author: "Rajan Maurya",
  title: "Engineering Manager · Kotlin Multiplatform Expert",
  proofUrl: "https://www.linkedin.com/in/jilakararevanthkumar/details/recommendations/",
};

// ---------------------------------------------------------------------------
// WHY HIRE ME — closing pitch. Evidence-backed value pillars + CTA.
export const whyHireMe = {
  lead:
    "I ship features to production, migrate apps across platforms, and own releases end-to-end. Here's the case, in four points.",
  pillars: [
    {
      icon: "smartphone",
      title: "Production Android at Swipe (YC S21)",
      body:
        "As an SDE 1, I've migrated 20+ features — 100+ screens — to Jetpack Compose and manage the app's Play Store releases for a billing product used by thousands of businesses.",
    },
    {
      icon: "layers",
      title: "Kotlin Multiplatform, at scale",
      body:
        "Migrated 20+ modules to Kotlin Multiplatform & Compose Multiplatform across production fintech apps at Mifos — and reviewed 300+ contributor PRs to keep the quality bar high.",
    },
    {
      icon: "playstore",
      title: "3 apps shipped solo, end-to-end",
      body:
        "Designed, built, and published three apps to the Google Play Store entirely on my own — architecture, UI, CI/CD, release, and store listing.",
    },
    {
      icon: "cpu",
      title: "Strong CS fundamentals",
      body:
        "GATE CS 2025 qualified, LeetCode Knight (800+ solved), and GFG Institute Rank 1 — I clear the DSA bar, not just the UI one.",
    },
  ],
};

// ---------------------------------------------------------------------------
// WRITING — Medium posts. Add new posts to the TOP of this list.
// Feed source: https://medium.com/feed/@jrevanth101
export const blog = {
  profileUrl: "https://medium.com/@jrevanth101",
  posts: [
    {
      title: "Vibe Coders Paste Files Into ChatGPT. Senior Developers Write Three Files Instead.",
      url: "https://medium.com/@jrevanth101/vibe-coders-paste-files-into-chatgpt-senior-developers-write-three-files-instead-ee0a8ff974b0",
      date: "Aug 2026",
      tags: ["AI", "Developer Workflow", "LLMs"],
    },
    {
      title: "From Jetpack Compose App to Play Store: Complete Guide (Signing → Testing → Release)",
      url: "https://medium.com/@jrevanth101/from-jetpack-compose-app-to-play-store-complete-guide-signing-testing-release-a4a92a6dd3b0",
      date: "Jul 2026",
      tags: ["Play Store", "Signing", "Release"],
    },
    {
      title: "Ship Your Android App to Testers Automatically: A Complete GitHub Actions + Firebase App Distribution Guide",
      url: "https://medium.com/@jrevanth101/ship-your-android-app-to-testers-automatically-a-complete-github-actions-firebase-app-02def952a492",
      date: "Jul 2026",
      tags: ["GitHub Actions", "Firebase", "CI/CD"],
    },
    {
      title: "How I Shrunk Every Feature Module's build.gradle from 60+ Lines to 12 Lines",
      url: "https://medium.com/@jrevanth101/how-i-shrunk-every-feature-modules-build-gradle-to-12-lines-c6341a73921f",
      date: "Jun 2026",
      tags: ["Gradle", "Convention Plugins", "Kotlin"],
    },
  ],
};

export const github = {
  username: "revanthkumarJ",
  url: "https://github.com/revanthkumarJ",
};

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Apps", href: "#apps" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Achievements", href: "#achievements" },
  { label: "Writing", href: "#writing" },
  { label: "Why Me", href: "#why" },
  { label: "Contact", href: "#contact" },
];
