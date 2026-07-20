import content from "./content.js";
import qa from "./qa.js";

export default {
  id: "serialization",
  title: "JSON Serialization",
  tagline:
    "Serialize/deserialize, kotlinx.serialization vs Moshi vs Gson, @Serializable/@SerialName, robustness (ignoreUnknownKeys), DTO vs domain, and polymorphic JSON.",
  tags: ["JSON", "kotlinx.serialization", "Moshi", "DTO", "Serialization"],
  content,
  qa,
};
