import fcm from "./fcm/index.js";
import crashlyticsAnalytics from "./crashlytics-analytics/index.js";
import remoteConfigDistribution from "./remote-config-distribution/index.js";
import authDatabases from "./auth-databases/index.js";

export default {
  id: "firebase",
  name: "Firebase",
  description:
    "Google's app platform — Cloud Messaging (FCM), Crashlytics & Analytics, Remote Config/A-B Testing/App Distribution, and Auth & Databases.",
  topics: [
    fcm,
    crashlyticsAnalytics,
    remoteConfigDistribution,
    authDatabases,
  ],
};
