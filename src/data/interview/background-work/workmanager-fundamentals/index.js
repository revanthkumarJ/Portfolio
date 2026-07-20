import content from "./content.js";
import qa from "./qa.js";

export default {
  id: "workmanager-fundamentals",
  title: "WorkManager Fundamentals",
  tagline:
    "Deferrable guaranteed work, when (not) to use it, CoroutineWorker & results, OneTime vs Periodic, observing WorkInfo, and how it survives kill/reboot.",
  tags: ["WorkManager", "CoroutineWorker", "Background", "Periodic", "WorkInfo"],
  content,
  qa,
};
