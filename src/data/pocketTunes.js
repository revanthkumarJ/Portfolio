// ============================================================================
// POCKET TUNES — data for the /apps/pockettunes case-study page.
// Everything here is grounded in the shipped app: the Play Store listing,
// the store graphics in src/Assets/pocketTunes/, and the app's own build
// configuration (module list, version catalog, locale resources).
// ============================================================================

import banner from "../Assets/pocketTunes/banner.png";
import shotSearch from "../Assets/pocketTunes/1.png";
import shotRingtone from "../Assets/pocketTunes/2.png";
import shotLibrary from "../Assets/pocketTunes/3.png";
import shotPlaylists from "../Assets/pocketTunes/4.png";
import shotPlayer from "../Assets/pocketTunes/5.png";
import shotSongs from "../Assets/pocketTunes/6.png";
import shotLanguages from "../Assets/pocketTunes/7.png";

export const pocketTunes = {
  slug: "pockettunes",
  path: "/apps/pockettunes",
  accent: "emerald",

  name: "Pocket Tunes",
  fullName: "Pocket Tunes: Free Music Player",
  titleLead: "Pocket",
  titleAccent: "Tunes",
  eyebrow: "Play Store app · Solo project",
  tagline: "Your music. In your pocket.",
  shortDescription:
    "Offline music player with a built-in ringtone trimmer. No account, no sign-in.",

  storeUrl: "https://play.google.com/store/apps/details?id=com.revanthapps.pocketunes",
  privacyUrl: "https://revanthkumarj.github.io/ExpenseTrackr/pocket-tunes-privacy-policy.html",
  developerUrl: "https://play.google.com/store/apps/dev?id=5399113798198807031",

  banner,

  meta: [
    { label: "Category", value: "Music & Audio" },
    { label: "Version", value: "1.0.6" },
    { label: "Requires", value: "Android 8.0+" },
    { label: "Content rating", value: "Everyone" },
    { label: "Role", value: "Solo — design, build, release" },
  ],

  // The 30-second version.
  intro: [
    "Most new Android phones ship without a working local music player. The pushed default wants you online, stops playing your own downloaded files after a few minutes offline, and nudges you toward a subscription. The alternatives are stuffed with ads or bury the basics under menus.",
    "Pocket Tunes plays the music that is already on your phone — and nothing else. No account, no subscription, no tracking. I designed it, built it, and shipped it to the Play Store solo, from the first Gradle module to the store graphics.",
  ],

  stats: [
    { value: 17, suffix: "", label: "Gradle modules" },
    { value: 18, suffix: "", label: "Languages shipped" },
    { value: 6, suffix: "", label: "Audio formats" },
    { value: 0, suffix: "", label: "Data collected" },
  ],

  features: [
    {
      icon: "library",
      title: "Finds your music automatically",
      body: "Scans the device on first launch and lists every audio file it finds — MP3, WAV, AAC, FLAC, OGG and M4A — with title, artist, embedded album art and duration. Sort by title, artist, recently added or duration, and rescan any time.",
    },
    {
      icon: "play",
      title: "Plays without getting in the way",
      body: "Play, pause, skip and scrub, with controls on the lock screen and in the notification shade. Keeps playing with the screen off. Shuffle and repeat (off / all / one) stay set the way you left them.",
    },
    {
      icon: "playlist",
      title: "Playlists that make sense to you",
      body: "Create as many as you like and name them whatever you want — Gym, Road Trip, Study, Sleep. Add and remove songs, rename, delete. All stored on your phone.",
    },
    {
      icon: "scissors",
      title: "A real ringtone trimmer, built in",
      body: "Pick any song, see its waveform, drag the start and end handles to the exact part you want, preview it, and set it as your ringtone, notification tone or alarm. No second app, no file manager, no website.",
    },
    {
      icon: "search",
      title: "Search that finds it in seconds",
      body: "Type a few letters and find anything in your library by song title, artist or album — results filter as you type.",
    },
    {
      icon: "globe",
      title: "Music in your language",
      body: "Ships with 18 languages, picked on first launch and changeable any time. On Android 13+ the choice is mirrored into the system's per-app language setting.",
    },
  ],

  screensBlurb:
    "Every screen is Jetpack Compose with Material 3, built dark-first.",

  shotAspect: "9/16",

  screenshots: [
    { src: shotPlayer, title: "Always offline", caption: "Full-screen player — album art, favourite, shuffle and repeat. No internet needed." },
    { src: shotLibrary, title: "Your music, organised", caption: "Browse the library by songs, albums or artists." },
    { src: shotSongs, title: "Your way", caption: "Shuffle all, favourites, and sorting by title, artist or recently added." },
    { src: shotPlaylists, title: "Playlists made for you", caption: "Create and organise a playlist for every mood." },
    { src: shotSearch, title: "Find any song in seconds", caption: "Search by song, artist or album." },
    { src: shotRingtone, title: "Turn any song into a ringtone", caption: "Trim on the waveform, preview, then set as ringtone, notification or alarm." },
    { src: shotLanguages, title: "Music in your language", caption: "18 languages, chosen on first launch or from Settings." },
  ],

  // ---- Engineering -------------------------------------------------------
  architecture: {
    summary:
      "Pocket Tunes is a multi-module Android app: 17 Gradle modules split into a shared core and four self-contained features, each sliced into domain / data / presentation. Build logic lives in a composite build with six convention plugins, so a new module is three lines of Gradle instead of forty.",
    layers: [
      {
        name: ":core",
        modules: ["domain", "data", "database", "playback", "presentation", "design-system"],
        note: "Models, repositories, the Room database, the Media3 playback service, and the shared Compose design system.",
      },
      {
        name: ":feature",
        modules: ["library", "player", "playlists", "ringtone"],
        note: "Each feature owns its own domain / data / presentation modules and its own Koin module — nothing leaks sideways.",
      },
      {
        name: ":build-logic",
        modules: ["application", "library", "feature", "compose", "room", "jvm-library"],
        note: "Convention plugins that keep every module's Gradle setup identical and one line long.",
      },
    ],
  },

  techStack: [
    {
      title: "Language & UI",
      items: ["Kotlin 2.4", "Jetpack Compose", "Material 3", "Compose Navigation", "Coroutines & Flow", "Coil 3", "Palette", "Core SplashScreen"],
    },
    {
      title: "Playback & media",
      items: ["Media3 ExoPlayer", "Media3 MediaSession", "MediaStore scanning", "Lock-screen & notification controls"],
    },
    {
      title: "Data & DI",
      items: ["Room", "DataStore Preferences", "Koin", "kotlinx.serialization"],
    },
    {
      title: "Build & release",
      items: ["AGP 9 · Gradle convention plugins", "KSP", "R8 minification", "Firebase Crashlytics", "Play in-app review & updates", "minSdk 26 · targetSdk 36"],
    },
    {
      title: "Testing",
      items: ["JUnit 5", "Turbine", "assertk", "kotlinx-coroutines-test", "Compose UI tests"],
    },
  ],

  // ---- Privacy — mirrors the app's Play Data safety declaration ----------
  privacy: {
    headline: "No data collected. No data shared.",
    body:
      "Your music, playlists and preferences stay on your device — they are never uploaded. The app reaches the internet for exactly one thing: anonymous crash reports, so bugs can be found and fixed. A crash report contains the error, your device model and Android version, and nothing that identifies you.",
    points: [
      "No accounts, no sign-in, no subscription",
      "No tracking across apps or devices",
      "Play Data safety: no data collected, no data shared",
    ],
  },

  permissions: [
    { name: "Audio files", why: "To find and play the music already on your phone." },
    { name: "Notifications", why: "To show playback controls on the lock screen and in the shade." },
    { name: "Modify system settings", why: "Asked for only when you choose to set a ringtone, and used only for that." },
    { name: "Internet", why: "Only to send anonymous crash reports." },
  ],

  // What the app deliberately does not do.
  nonGoals: ["No streaming", "No cloud sync", "No sign-in", "No subscription"],

  cta: {
    headlineLead: "Play the music that's",
    headlineAccent: "already on your phone",
    body: "Free, fully offline, and no account needed. Available now on Google Play.",
  },
};

export default pocketTunes;
