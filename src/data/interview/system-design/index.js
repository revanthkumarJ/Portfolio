import approach from "./approach/index.js";
import imageLoader from "./image-loader/index.js";
import offlineSync from "./offline-sync/index.js";
import feedChat from "./feed-chat/index.js";

export default {
  id: "system-design",
  name: "Mobile System Design",
  description:
    "Designing mobile systems — how to approach the interview, and worked designs: an image-loading library, offline-first sync, and a feed & chat.",
  topics: [
    approach,
    imageLoader,
    offlineSync,
    feedChat,
  ],
};
