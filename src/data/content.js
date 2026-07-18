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
import iplImg from "../Assets/Projects/ipl.png";
import departmentImg from "../Assets/Projects/department.png";
import instaImg from "../Assets/Projects/insta.png";
import netflixImg from "../Assets/Projects/netflix.png";
import expenseTrackrImg from "../Assets/images/expense_tracker.png"; // ✅ real banner

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
  { name: "Instagram", url: "https://www.instagram.com/revanth_kumar_j", icon: "instagram" },
  { name: "Email", url: "mailto:jrevanth101@gmail.com", icon: "mail" },
];

export const heroStats = [
  { value: 120, suffix: "+", label: "Open-source PRs merged" },
  { value: 98, suffix: "%", label: "PR merge rate" },
  { value: 230, suffix: "+", label: "Contributor PRs reviewed" },
  { value: 1000, suffix: "+", label: "DSA problems solved" },
];

export const about = {
  paragraphs: [
    "I'm a Software Engineer from Andhra Pradesh, India, specializing in Android and Kotlin Multiplatform development. Currently SDE 1 – Android Developer at Swipe (YC S21), where I was promoted from intern after migrating 70+ screens to Jetpack Compose and restructuring a monolith into multi-module Clean Architecture.",
    "I'm an active contributor and mentor at the Mifos Initiative — 120+ merged PRs at a 98% merge rate, 230+ contributor PRs reviewed, and 20+ modules migrated to Kotlin Multiplatform across production fintech apps used worldwide. I was a Mifos Summer of Code 2025 intern and now mentor contributors for GSoC and Code4GovTech.",
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
  { name: "CodeChef", detail: "3★ Coder", url: "https://www.codechef.com/users/revanthkumarj1" },
  { name: "HackerRank", detail: "5★ Problem Solving", url: "https://www.hackerrank.com/jrevanth101" },
];

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
      "Review contributor pull requests across community projects (230+ reviewed).",
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
  {
    company: "TLDE Technologies",
    role: "Software Development Intern",
    period: "Nov 2025 — Dec 2025",
    summary:
      "Built onboarding experiences for a Kotlin Multiplatform app using Compose Multiplatform and Lottie animations.",
    highlights: [],
    tech: ["Kotlin Multiplatform", "Compose Multiplatform", "Lottie"],
    links: [],
  },
  {
    company: "Abhiyanth 2K25",
    role: "Frontend Team Lead & Developer",
    period: "Dec 2024 — Mar 2025",
    summary:
      "Led frontend development of the college fest platform in React — Firebase integration, admin panel, repo management, PR reviews, and UI/UX coordination.",
    highlights: [],
    tech: ["React", "Redux", "Firebase", "Material UI"],
    links: [{ text: "GitHub repo", url: "https://github.com/revanthkumarJ/Abhiyanth-Client" }],
  },
  {
    company: "DevDisplay",
    role: "Open Source Contributor — React",
    period: "Jan 2025 — Feb 2025",
    summary:
      "10 merged PRs of UI enhancements and page development with React and Tailwind CSS — Sponsors, About Us, and Journey pages.",
    highlights: [],
    tech: ["React", "Tailwind CSS"],
    links: [{ text: "Merged PRs", url: "https://github.com/codeaashu/DevDisplay/pulls?q=is%3Apr+is%3Amerged+author%3ArevanthkumarJ" }],
  },
  {
    company: "GeeksforGeeks",
    role: "Campus Ambassador",
    period: "Apr 2024 — Apr 2025",
    summary:
      "Promoted coding culture on campus, coordinated contests and events, and was recognized among the top-performing campus ambassadors.",
    highlights: [],
    tech: [],
    links: [],
  },
];

export const leadership = [
  {
    role: "DSA Coordinator & Mentor",
    org: "SRC Student Club",
    period: "Apr 2024 — Mar 2025",
    note: "Weekly coding contests and mentoring sessions to uplift peers' DSA performance.",
  },
  {
    role: "NSS Unit Coordinator",
    org: "National Service Scheme",
    period: "Jan 2024 — Jan 2026",
    note: "Organized social-outreach activities; maintain the NSS Unit-2 LinkedIn page.",
  },
  {
    role: "Social Media Manager",
    org: "Dept. of CSE, RGUKT RK Valley",
    period: "Apr 2024 — Mar 2025",
    note: "Ran the department's social presence and analytics.",
  },
  {
    role: "Class Representative",
    org: "Dept. of CSE, RGUKT RK Valley",
    period: "Jun 2024 — Nov 2024",
    note: "Bridge between faculty and students for E3 Sem 1.",
  },
];

// ---------------------------------------------------------------------------
// PROJECTS — first 4 are the FEATURED cinematic cards, in order.
export const featuredProjects = [
  {
    title: "ExpenseTrackr",
    tagline: "Privacy-first offline finance tracker — one Kotlin codebase, three platforms",
    description:
      "A personal finance tracker where every expense, budget, and category lives on-device. Built as a single Kotlin Multiplatform codebase rendering native UI on Android, iOS, and Desktop via Compose Multiplatform — 16 Gradle modules, 18 screens, Clean MVI, 24 languages with an in-app switcher, PIN + biometric app-lock, and CSV backup that survives reinstalls.",
    metrics: [
      { value: "16", label: "Gradle modules" },
      { value: "24", label: "Languages" },
      { value: "3", label: "Platforms" },
    ],
    tech: ["Kotlin Multiplatform", "Compose Multiplatform", "Clean MVI", "Room (KMP)", "Koin", "Material 3"],
    image: expenseTrackrImg, // 🖼️ null → styled placeholder; swap with real screenshot
    accent: "emerald",
    links: [
      { text: "GitHub", url: "https://github.com/revanthkumarJ/ExpenseTrackr", kind: "github" },
      // 🚀 PLAY STORE — app is in closed testing. Uncomment when public:
      // { text: "Play Store", url: "https://play.google.com/store/apps/details?id=YOUR_APP_ID", kind: "playstore" },
    ],
    badge: "Play Store — closed testing",
  },
  {
    title: "Mifos Mobile — KMP Migration",
    tagline: "Production banking app, migrated to every platform",
    description:
      "Migrated 7 modules of Mifos Mobile — a self-service banking client used worldwide — to Kotlin Multiplatform and Compose Multiplatform, targeting Android, iOS, Web/WASM, and Desktop. 45+ merged PRs covering module migrations, new Figma-based screens, QR-code binding, and localization.",
    metrics: [
      { value: "45+", label: "PRs merged" },
      { value: "7", label: "Modules migrated" },
      { value: "5", label: "Platform targets" },
    ],
    tech: ["Kotlin Multiplatform", "Compose Multiplatform", "Ktor", "Koin"],
    image: mifosMobileImg, // 🖼️ swap with device-framed screenshots
    accent: "violet",
    links: [
      { text: "GitHub", url: "https://github.com/openMF/mifos-mobile", kind: "github" },
      { text: "My contributions", url: "https://github.com/openMF/mifos-mobile/pulls?q=is%3Amerged+is%3Apr+author%3ArevanthkumarJ+", kind: "prs" },
      { text: "Play Store", url: "https://play.google.com/store/apps/details?id=org.mifos.mobile", kind: "playstore" },
    ],
  },
  {
    title: "Android Client — KMP Migration",
    tagline: "Field-officer banking app for offline-first microfinance",
    description:
      "52 merged PRs migrating 10 modules of the Mifos Field Officer app to KMP/CMP — refactoring client screens to the latest Figma designs, adding type-safe navigation, fixing production bugs, and building new UI components for an app processing real financial transactions in remote areas.",
    metrics: [
      { value: "52", label: "PRs merged" },
      { value: "10", label: "Modules migrated" },
      { value: "100%", label: "Offline-capable" },
    ],
    tech: ["Kotlin Multiplatform", "Compose Multiplatform", "Room", "MVI"],
    image: androidClientImg, // 🖼️ swap with device-framed screenshots
    accent: "cyan",
    links: [
      { text: "GitHub", url: "https://github.com/openMF/android-client", kind: "github" },
      { text: "My contributions", url: "https://github.com/openMF/android-client/pulls?q=is%3Amerged+is%3Apr+author%3ArevanthkumarJ+", kind: "prs" },
      { text: "Play Store", url: "https://play.google.com/store/apps/details?id=com.mifos.mifosxdroid", kind: "playstore" },
    ],
  },
  {
    title: "Abhiyanth Fest Platform",
    tagline: "College fest platform — led the frontend team",
    description:
      "Led the frontend team building the official platform for Abhiyanth 2K25 — React, Redux, and Material UI with Firebase auth and hosting, CashFree payment integration, and a full admin panel. Managed the repo, reviewed PRs, and coordinated with UI/UX.",
    metrics: [
      { value: "Lead", label: "Frontend team" },
      { value: "Live", label: "Payments (CashFree)" },
    ],
    tech: ["React", "Redux", "Firebase", "Material UI"],
    image: abhiyanthImg, // 🖼️ swap with real site screenshot
    accent: "amber",
    links: [{ text: "GitHub", url: "https://github.com/revanthkumarJ/abhiyanth-client", kind: "github" }],
  },
];

export const gridProjects = [
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
    title: "Sports Auction",
    description: "Mock IPL auction platform — 250 players, live bidding for 150+ students across 30 teams.",
    tech: ["React"],
    image: iplImg,
    links: [
      { text: "GitHub", url: "https://github.com/revanthkumarJ/Sports-Auction", kind: "github" },
      { text: "Live", url: "https://sports-auction.vercel.app/", kind: "demo" },
    ],
  },
  {
    title: "Dept. Resource Manager",
    description: "Kotlin app managing announcements, complaints, and timetables for students, faculty, and HOD.",
    tech: ["Kotlin", "Firebase"],
    image: departmentImg,
    links: [{ text: "GitHub", url: "https://github.com/revanthkumarJ/Departmental-Resource-Management-App", kind: "github" }],
  },
  {
    title: "Instagram UI Clone",
    description: "Jetpack Compose recreation of the Instagram feed and profile screens.",
    tech: ["Jetpack Compose"],
    image: instaImg,
    links: [{ text: "GitHub", url: "https://github.com/revanthkumarJ/InstaUI", kind: "github" }],
  },
  {
    title: "Netflix UI Clone",
    description: "Netflix-style UI built with Jetpack Compose — featured rows and layout aesthetics.",
    tech: ["Jetpack Compose"],
    image: netflixImg,
    links: [{ text: "GitHub", url: "https://github.com/revanthkumarJ/NetFlixUI", kind: "github" }],
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
  { title: "CodeChef 3★", detail: "Consistent contest performance.", tag: "DSA" },
  { title: "HackerRank 5★", detail: "Problem Solving — 500+ challenges.", tag: "DSA" },
  { title: "Qualified NMMS", detail: "National Means-cum-Merit Scholarship at school level.", tag: "Academics" },
];

export const testimonial = {
  quote:
    "Revanth brings strong expertise in Kotlin Multiplatform development, with a deep understanding of building efficient, cross-platform architectures. One of his standout strengths is his debugging ability — a sharp eye for identifying complex issues and resolving them with clarity and precision. Beyond his technical skills, he is reliable, proactive, and a great collaborator. I strongly recommend him for any role requiring expertise in Kotlin Multiplatform and robust software architecture.",
  author: "Rajan Maurya",
  title: "Engineering Manager · Kotlin Multiplatform Expert",
  proofUrl: "https://www.linkedin.com/in/jilakararevanthkumar/details/recommendations/",
};

// ---------------------------------------------------------------------------
// WRITING — Medium posts. Add new posts to the TOP of this list.
// Feed source: https://medium.com/feed/@jrevanth101
export const blog = {
  profileUrl: "https://medium.com/@jrevanth101",
  posts: [
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
    {
      title: "Reducing Boilerplate in Jetpack Compose MVI: The Template I Use for Every Screen",
      url: "https://medium.com/@jrevanth101/reducing-boilerplate-in-jetpack-compose-mvi-the-template-i-use-for-every-screen-396fa55cc17d",
      date: "May 2026",
      tags: ["Jetpack Compose", "MVI", "Kotlin"],
    },
    {
      title: "Building a Comma-Separated Decimal Input in Jetpack Compose",
      url: "https://medium.com/@jrevanth101/building-a-comma-separated-decimal-input-in-jetpack-compose-bbcf82813e9c",
      date: "Mar 2026",
      tags: ["Jetpack Compose", "Kotlin"],
    },
  ],
};

export const github = {
  username: "revanthkumarJ",
  url: "https://github.com/revanthkumarJ",
};

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Achievements", href: "#achievements" },
  { label: "Writing", href: "#writing" },
  { label: "Contact", href: "#contact" },
];
