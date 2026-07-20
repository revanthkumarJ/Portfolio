// JSON Serialization — Content tab. Teaching-first.

const content = [
  {
    heading: "What serialization is and why it's needed",
    blocks: [
      {
        t: "p",
        text: "**Serialization** is converting an object into a format that can be stored or transmitted (like a JSON string), and **deserialization** (or parsing) is the reverse — turning that format back into objects. APIs communicate in JSON (text), but your app works with Kotlin objects, so you need to convert between them: your `User` object → JSON to send in a request body, and JSON response → your `User` object to use in code. A serialization library automates this mapping so you don't hand-write parsing.",
      },
      {
        t: "code",
        title: "The conversion in both directions",
        code: `// Deserialization: JSON string -> Kotlin object
val json = """{"id":"42","name":"Revanth","is_premium":true}"""
val user: User = decode(json)     // -> User(id="42", name="Revanth", premium=true)

// Serialization: Kotlin object -> JSON string
val body: String = encode(user)   // -> {"id":"42",...}`,
      },
    ],
  },
  {
    heading: "The three main libraries",
    blocks: [
      {
        t: "table",
        headers: ["Library", "How it works", "Notes"],
        rows: [
          ["kotlinx.serialization", "compile-time codegen via a compiler plugin", "Kotlin-first, KMP-compatible, no reflection — the modern choice"],
          ["Moshi", "reflection or codegen (codegen recommended)", "Square library, good Kotlin support, widely used"],
          ["Gson", "runtime reflection", "older, Google's; works but has Kotlin pitfalls (ignores defaults/nullability) — legacy"],
        ],
      },
      {
        t: "list",
        items: [
          "**kotlinx.serialization** — the modern, Kotlin-first choice: it's a compiler plugin that generates serialization code *at compile time* (no runtime reflection), respects Kotlin's null safety and default values, and works in **KMP** (crucial for multiplatform). Use `@Serializable` on your classes.",
          "**Moshi** — Square's library, a solid choice especially with its codegen (`moshi-kotlin-codegen`), which avoids reflection and handles Kotlin properly. Common in Retrofit apps.",
          "**Gson** — Google's older library using runtime reflection. It works but has real Kotlin problems: it *ignores* default values and can put `null` into non-null Kotlin properties (breaking null safety) because it doesn't understand Kotlin's constructor semantics. Prefer kotlinx.serialization or Moshi for new code.",
          "**For an Android/KMP engineer, kotlinx.serialization is the default recommendation** — it's Kotlin-native, KMP-ready, and avoids reflection.",
        ],
      },
    ],
  },
  {
    heading: "kotlinx.serialization in practice",
    blocks: [
      {
        t: "code",
        title: "Annotating a data class",
        code: `@Serializable
data class UserDto(
    val id: String,
    val name: String,
    @SerialName("is_premium") val premium: Boolean = false,  // map JSON key -> property
    val email: String? = null,                                // nullable + default
    @Transient val localOnly: String = "",                    // excluded from JSON
)

// Configure the Json instance
val json = Json {
    ignoreUnknownKeys = true      // don't crash on extra JSON fields
    coerceInputValues = true      // use defaults for null/invalid where possible
    explicitNulls = false         // omit null fields when encoding
}`,
      },
      {
        t: "list",
        items: [
          "**`@Serializable`** — marks a class for serialization; the compiler plugin generates the serializer. **`@SerialName`** — maps a JSON key to a differently-named property (JSON `is_premium` → Kotlin `premium`), so your Kotlin code uses idiomatic names while matching the API's JSON.",
          "**`@Transient`** — excludes a property from serialization (for computed or local-only fields). **`@Required`** — makes a property with a default mandatory in JSON.",
          "**`ignoreUnknownKeys = true`** — *critical for robustness*: without it, an unexpected extra field in the JSON (which servers add over time) *crashes* parsing. With it, unknown fields are ignored. Almost always set this.",
          "**Default values** — kotlinx.serialization respects Kotlin defaults: if a field is missing from the JSON, the default is used (not a crash). This makes your models resilient to optional/absent fields.",
        ],
      },
    ],
  },
  {
    heading: "The DTO vs domain model distinction",
    blocks: [
      {
        t: "p",
        text: "A best practice: your **DTOs** (Data Transfer Objects — the classes that mirror the API's JSON exactly) should be *separate* from your **domain models** (the clean objects your app logic uses). The DTO is shaped by the *API contract* (nullable fields, snake_case names, exactly the server's structure); the domain model is shaped by *your app's needs* (non-null invariants, idiomatic names, only the fields you use). You map DTO → domain at the data-layer boundary.",
      },
      {
        t: "code",
        title: "DTO mirrors JSON; domain model is clean",
        code: `// DTO — matches the API's JSON exactly (nullable, server names)
@Serializable
data class UserDto(
    @SerialName("user_id") val id: String?,
    @SerialName("full_name") val name: String?,
    @SerialName("is_premium") val premium: Boolean?,
)

// Domain model — clean, non-null, what your app uses
data class User(val id: String, val name: String, val premium: Boolean)

// Mapper at the boundary — resolves nullability, renames, validates
fun UserDto.toDomain() = User(
    id = id ?: error("missing id"),
    name = name ?: "Unknown",
    premium = premium ?: false,
)`,
      },
      {
        t: "list",
        items: [
          "**Why separate them**: the API's JSON changes independently of your app. Keeping DTOs separate means a server field rename or added field touches only the DTO and its mapper — not your whole codebase. The domain model stays stable and clean.",
          "**Nullability resolved once**: servers often make everything nullable. The mapper resolves nullability at the boundary (providing defaults, validating), so the rest of your app works with clean non-null domain types instead of `?` everywhere.",
          "**Pragmatic caveat**: for a tiny app, one model reused as both DTO and domain is a defensible shortcut — but split them the moment the API shape and your app's needs diverge (which they will). This ties into Clean Architecture's model-mapping principle.",
        ],
      },
    ],
  },
  {
    heading: "Robustness and common pitfalls",
    blocks: [
      {
        t: "list",
        items: [
          "**Always handle unknown/missing fields gracefully**: `ignoreUnknownKeys = true` (extra fields don't crash) and default values (missing fields use defaults). APIs evolve, and brittle parsing that crashes on any change is a common production bug.",
          "**Polymorphic/sealed JSON**: for JSON that can be one of several shapes (a `type` discriminator field), kotlinx.serialization supports `@Serializable` sealed classes with a class discriminator — cleanly modeling 'this response is one of N types'.",
          "**Dates and custom types**: JSON has no native date type — dates come as strings or numbers. Use a custom serializer (`@Serializable(with = ...)`) to convert to/from a proper type (`Instant`, `LocalDate`).",
          "**Gson's Kotlin trap** (why to avoid it): Gson uses reflection and Java constructor semantics, so it *bypasses* Kotlin's default-value and null-check logic — it can leave a non-null property as `null` (a latent crash) or ignore your defaults. kotlinx.serialization and Moshi-codegen understand Kotlin properly.",
          "**Retrofit integration**: add the converter factory (`Json.asConverterFactory(...)` for kotlinx.serialization, `MoshiConverterFactory`, or `GsonConverterFactory`) to your Retrofit builder, and Retrofit uses it to parse response bodies and serialize request bodies automatically.",
        ],
      },
      {
        t: "note",
        text: "Serialization essentials: converting objects ↔ JSON. kotlinx.serialization (compile-time, Kotlin-first, KMP, no reflection) is the modern choice; Moshi is solid; Gson is legacy with Kotlin pitfalls (ignores defaults/nullability). Use @Serializable/@SerialName; set ignoreUnknownKeys=true and use default values for robustness against API changes. Separate DTOs (mirror the API) from domain models (clean, non-null), mapping at the boundary. Integrate with Retrofit via a converter factory.",
      },
    ],
  },
];

export default content;
