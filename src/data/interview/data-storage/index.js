import roomFundamentals from "./room-fundamentals/index.js";
import roomRelationsMigrations from "./room-relations-migrations/index.js";
import datastorePrefs from "./datastore-prefs/index.js";
import cachingOffline from "./caching-offline/index.js";
import paging from "./paging/index.js";

export default {
  id: "data-storage",
  name: "Data & Storage",
  description:
    "Local persistence — Room & SQLite, relations & migrations, DataStore vs SharedPreferences, caching & offline-first architecture, and Paging 3.",
  topics: [
    roomFundamentals,
    roomRelationsMigrations,
    datastorePrefs,
    cachingOffline,
    paging,
  ],
};
