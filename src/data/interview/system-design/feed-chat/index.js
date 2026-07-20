import content from "./content.js";
import qa from "./qa.js";

export default {
  id: "feed-chat",
  title: "Design a Feed & Chat",
  tagline:
    "Paginated feeds (Paging 3 + RemoteMediator, memory, prefetch, mixed content) and chat (WebSocket + push, optimistic send, ordering, sync-for-reliability).",
  tags: ["System Design", "Feed", "Chat", "Pagination", "Real-time"],
  content,
  qa,
};
