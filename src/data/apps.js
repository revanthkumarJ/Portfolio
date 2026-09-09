// ============================================================================
// APPS REGISTRY — every Play Store app that has a /apps/<slug> case-study page.
// Add a new app by writing its data file and registering it here; the route
// (/apps/:slug), the page and the "See details" link on the home card all
// pick it up automatically.
// ============================================================================

import {
  FiCreditCard,
  FiDownload,
  FiFileText,
  FiFolder,
  FiGlobe,
  FiImage,
  FiList,
  FiLock,
  FiMusic,
  FiPieChart,
  FiPlayCircle,
  FiScissors,
  FiSearch,
  FiShare2,
  FiShield,
  FiStar,
  FiTarget,
} from "react-icons/fi";

import { pocketTunes } from "./pocketTunes.js";
import { expenseTrackr } from "./expenseTrackr.js";
import { statusSaver } from "./statusSaver.js";

// Feature-card icons, referenced by the `icon` string in each app's features.
export const featureIcons = {
  library: FiMusic,
  play: FiPlayCircle,
  playlist: FiList,
  scissors: FiScissors,
  search: FiSearch,
  globe: FiGlobe,
  wallet: FiCreditCard,
  target: FiTarget,
  chart: FiPieChart,
  folder: FiFolder,
  file: FiFileText,
  lock: FiLock,
  image: FiImage,
  download: FiDownload,
  share: FiShare2,
  shield: FiShield,
  sparkles: FiStar, // fallback
};

export const apps = [pocketTunes, expenseTrackr, statusSaver];

export const appsBySlug = Object.fromEntries(apps.map((a) => [a.slug, a]));

export default apps;
