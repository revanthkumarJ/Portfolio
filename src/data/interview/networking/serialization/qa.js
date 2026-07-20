// JSON Serialization — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is JSON serialization and why do you need it?",
    a: [
      {
        t: "p",
        text: "**Serialization is converting a Kotlin object into a transmittable format (a JSON string), and deserialization is the reverse — parsing JSON back into objects.** You need it because APIs communicate in JSON (text) but your app works with Kotlin objects. So when you send data you serialize your object to JSON for the request body, and when you receive a response you deserialize the JSON into your objects to use in code.",
      },
      {
        t: "code",
        title: "Both directions",
        code: `// JSON -> object (deserialize)
val user: UserDto = json.decodeFromString("""{"id":"1","name":"Rev"}""")
// object -> JSON (serialize)
val body: String = json.encodeToString(user)`,
      },
      {
        t: "p",
        text: "A serialization library automates this mapping so you don't hand-write parsing code (which would be tedious and error-prone). On Android the main libraries are kotlinx.serialization (the modern Kotlin-first choice), Moshi, and Gson (legacy). You typically don't call serialize/deserialize manually — you configure a converter on Retrofit, and it automatically parses response bodies into your objects and serializes request bodies to JSON. The library reads your annotated data classes to know how to map between fields and JSON keys.",
      },
    ],
  },
  {
    level: "junior",
    q: "Which serialization library should you use and why?",
    a: [
      {
        t: "p",
        text: "**For new Android/KMP code, use kotlinx.serialization.** It's Kotlin-first: a compiler plugin generates serialization code *at compile time* (no runtime reflection), it fully respects Kotlin's null safety and default values, and — importantly for an Android/KMP engineer — it works in Kotlin Multiplatform, so the same models serialize on Android and iOS.",
      },
      {
        t: "list",
        items: [
          "**kotlinx.serialization** — the modern default. Compile-time, no reflection, KMP-compatible, understands Kotlin semantics. Mark classes `@Serializable`.",
          "**Moshi** — Square's library, a solid choice too, especially with its codegen (avoiding reflection). Well-integrated with Retrofit. A reasonable alternative if you're not targeting KMP.",
          "**Gson** — Google's older library, uses runtime reflection. It works but has real Kotlin pitfalls: it ignores Kotlin default values and can put `null` into non-null properties (because it bypasses Kotlin's constructor logic), silently breaking null safety. It's legacy — fine to maintain in existing code, but not for new code.",
        ],
      },
      {
        t: "p",
        text: "The short version: kotlinx.serialization for new code (Kotlin-native, KMP-ready, safe), Moshi as a solid alternative, and avoid Gson for new Kotlin code due to its null-safety and default-value problems. The KMP compatibility is often the deciding factor — Gson and Moshi are JVM-only, so a multiplatform project essentially must use kotlinx.serialization.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle a JSON field whose name doesn't match your Kotlin property?",
    a: [
      {
        t: "p",
        text: "**You use the `@SerialName` annotation (in kotlinx.serialization) to map the JSON key to your property, so your Kotlin code can use idiomatic names while still matching the API's JSON.** APIs often use snake_case (`is_premium`, `full_name`) while Kotlin convention is camelCase — `@SerialName` bridges that.",
      },
      {
        t: "code",
        title: "Mapping JSON keys to Kotlin properties",
        code: `@Serializable
data class UserDto(
    @SerialName("user_id") val id: String,        // JSON "user_id" -> id
    @SerialName("full_name") val name: String,    // JSON "full_name" -> name
    @SerialName("is_premium") val premium: Boolean = false,
)`,
      },
      {
        t: "p",
        text: "So the JSON key stays whatever the server sends (`user_id`), but in your code you use the clean name (`id`). Without this, your property name would have to exactly match the JSON key, forcing non-idiomatic Kotlin names. (Moshi uses `@Json(name = \"...\")` and Gson uses `@SerializedName(\"...\")` for the same purpose.) This is also part of why keeping DTOs separate from domain models is useful — the DTO carries the API's naming via `@SerialName`, and the mapper translates to your clean domain model, so the server's naming conventions never leak into your app logic.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you prevent parsing from crashing when the API adds a new field?",
    a: [
      {
        t: "p",
        text: "**You configure the parser to ignore unknown keys — in kotlinx.serialization, set `ignoreUnknownKeys = true` on the `Json` instance.** By default, strict parsing *crashes* when the JSON contains a field your data class doesn't declare. Since servers routinely add new fields over time (which they consider backward-compatible), strict parsing means a server-side addition can crash your released app. `ignoreUnknownKeys = true` makes the parser skip fields it doesn't recognize.",
      },
      {
        t: "code",
        title: "Robust Json configuration",
        code: `val json = Json {
    ignoreUnknownKeys = true    // extra JSON fields don't crash parsing
    coerceInputValues = true    // use defaults for null/invalid values
    explicitNulls = false       // omit null fields when encoding
}`,
      },
      {
        t: "p",
        text: "Combined with **default values** on your properties (so a *missing* field uses the default rather than failing), this makes your models resilient to API evolution in both directions — extra fields are ignored, and absent optional fields fall back to defaults. This is a genuinely important production concern: apps that crash whenever the backend adds a field are fragile, and the crash happens to *already-released* app versions you can't easily fix. Setting `ignoreUnknownKeys = true` and using sensible defaults is a standard robustness practice for any networked app.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why separate DTOs from domain models, and where does mapping happen?",
    a: [
      {
        t: "p",
        text: "**A DTO (Data Transfer Object) mirrors the API's JSON *exactly* — its structure, nullability, and field names are dictated by the API contract. A domain model is shaped by *your app's* needs — clean names, non-null invariants, only the fields you use. Keeping them separate decouples your app from the API, and you map DTO → domain at the data-layer boundary (in the repository or a mapper it calls).**",
      },
      {
        t: "list",
        items: [
          "**Decoupling from API changes** — the main reason. The server's JSON evolves independently of your app: fields get renamed, added, made nullable, restructured. If your whole app uses the DTO directly, every such change ripples through your entire codebase. With separate models, an API change touches only the DTO and its mapper — your domain model and all the code using it stay stable. It's a firewall between the external contract and your internal code.",
          "**Nullability resolved once** — servers often mark everything nullable (defensive API design). If you use the DTO directly, `?` infects your whole app (`user?.name?.length`). The mapper resolves nullability *at the boundary* — providing defaults, validating, or failing fast for truly-required fields — so the rest of your app works with clean non-null domain types.",
          "**Right shape for each layer** — the DTO can have API concerns (snake_case via `@SerialName`, serialization annotations, extra fields you ignore); the domain model has none of that noise and can add behavior/invariants. Serialization annotations don't pollute your business objects.",
          "**Where mapping happens** — in the *data layer*, at the boundary where external data enters: the repository receives the DTO from Retrofit and maps it to the domain model (`dto.toDomain()`) before anything else in the app sees it. Mappers are plain functions, trivially unit-tested, and the place where dirty/optional server data gets validated and normalized.",
        ],
      },
      {
        t: "list",
        items: [
          "**Often a three-way split**: DTO (network) → domain model (business) → UI model (presentation, formatted for display), mapping at each boundary. Plus a DB entity if you cache. Each is shaped by its layer's concerns.",
          "**Pragmatic caveat**: for a tiny app or a throwaway prototype, reusing one model as both DTO and domain is a defensible YAGNI shortcut — but the moment the API shape and your app's needs diverge (which they inevitably do), split them. The cost of splitting later is higher than doing it up front for anything non-trivial.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: this is the model-mapping principle from Clean Architecture applied to networking — each layer owns models shaped by *its* concerns, and you translate at boundaries. The payoff is a stable core that's insulated from an unstable, externally-controlled API, plus nullability and formatting resolved once at the edge instead of leaking everywhere. It's a small amount of mapping boilerplate that buys significant resilience and cleanliness.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle polymorphic JSON — a response that can be one of several types?",
    a: [
      {
        t: "p",
        text: "**You model it with a sealed class hierarchy plus a *class discriminator* — a field in the JSON (often `type`) that tells the parser which concrete type each object is. kotlinx.serialization supports this natively for `@Serializable` sealed classes.** The parser reads the discriminator field and deserializes into the matching subtype.",
      },
      {
        t: "code",
        title: "Polymorphic deserialization with a discriminator",
        code: `@Serializable
sealed class Notification {
    @Serializable @SerialName("message")
    data class Message(val text: String, val from: String) : Notification()

    @Serializable @SerialName("friend_request")
    data class FriendRequest(val userId: String) : Notification()

    @Serializable @SerialName("system")
    data class System(val code: Int) : Notification()
}

val json = Json { classDiscriminator = "type" }  // JSON's "type" field selects the subtype
// {"type":"message","text":"hi","from":"a"} -> Notification.Message(...)`,
      },
      {
        t: "list",
        items: [
          "**How it works**: each subtype is annotated with a `@SerialName` that matches its discriminator *value* (`\"message\"`, `\"friend_request\"`). The `classDiscriminator` config names the JSON *field* that holds that value (`\"type\"`). When parsing, kotlinx.serialization reads the `type` field, finds the subtype whose `@SerialName` matches, and deserializes the rest into that type.",
          "**Why sealed + discriminator is the right model**: it turns 'this response could be one of N shapes' into a type-safe sealed hierarchy, so consuming code uses an *exhaustive `when`* over the subtypes — the compiler ensures you handle every notification type, and adding a new one flags every `when` that needs updating. This is far safer than parsing into a generic map and branching on a string.",
          "**Custom discriminator handling**: if the API's discriminator doesn't fit the built-in mechanism (the type indicator is nested, or the shapes are distinguished by *presence* of fields rather than an explicit type field), you write a *custom serializer* that inspects the JSON and picks the type manually. kotlinx.serialization's `JsonContentPolymorphicSerializer` is designed for exactly the 'no explicit discriminator, distinguish by content' case.",
          "**Open polymorphism / third-party types**: for types not in a sealed hierarchy (open polymorphism across modules), you register subtypes in a `SerializersModule`. Sealed hierarchies are preferred when possible because they're closed and exhaustive.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: polymorphic JSON is common (notification feeds, event streams, content blocks, payment methods), and the robust approach is to model the closed set of shapes as a `@Serializable` sealed class with a discriminator, giving you type-safe, exhaustive handling. When the API's discrimination is irregular (no clean `type` field), you drop to a custom content-based serializer. Either way, the goal is to convert loosely-typed 'one of several JSON shapes' into a strongly-typed sealed hierarchy at the parsing boundary, so the rest of your code enjoys compile-time exhaustiveness rather than runtime string-matching.",
      },
    ],
  },
];

export default qa;
