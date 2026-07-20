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
  {
    level: "junior",
    q: "How do you set up kotlinx.serialization for a data class?",
    a: [
      {
        t: "p",
        text: "Apply the `kotlin-serialization` Gradle plugin, annotate your data class with `@Serializable`, and use a `Json` instance to encode/decode. The compiler *generates* the serializer at compile time (no reflection), so it's fast and works on KMP. Property names map to JSON keys by default.",
      },
      {
        t: "code",
        title: "@Serializable",
        code: `@Serializable
data class User(val id: String, val name: String, val age: Int)

val json = Json { ignoreUnknownKeys = true }
val user = json.decodeFromString<User>(jsonString)
val text = json.encodeToString(user)`,
      },
      {
        t: "list",
        items: [
          "**Plugin + `@Serializable`** — compile-time generated serializer (no reflection).",
          "**`Json` instance** — configure once; `decodeFromString`/`encodeToString`.",
          "**KMP-friendly** — works across platforms.",
          "**Retrofit** — `Json.asConverterFactory(...)` integrates it.",
        ],
      },
      {
        t: "note",
        text: "Apply the kotlin-serialization plugin, annotate data classes @Serializable, and use a configured Json instance (decodeFromString/encodeToString). The serializer is generated at compile time (no reflection — fast, KMP-friendly). Integrate with Retrofit via Json.asConverterFactory.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you provide default values and handle missing fields?",
    a: [
      {
        t: "p",
        text: "Give the property a *default value* in the data class — if the JSON omits that field, the default is used (so the response doesn't fail). By default kotlinx.serialization *encodes* defaults; set `encodeDefaults = false` to omit them when serializing. Defaults make your models resilient to optional/absent fields.",
      },
      {
        t: "code",
        title: "Defaults",
        code: `@Serializable
data class Settings(
    val theme: String = "system",       // used if JSON omits it
    val notifications: Boolean = true,
)
val json = Json { encodeDefaults = false }   // omit defaults when serializing`,
      },
      {
        t: "list",
        items: [
          "**Default value** — used when the field is absent.",
          "**Resilient** — missing optional fields don't crash.",
          "**`encodeDefaults`** — control whether defaults are serialized.",
          "**Distinguish absent vs null** — nullable + default for both cases.",
        ],
      },
      {
        t: "note",
        text: "Give properties default values — absent JSON fields use the default (no crash). encodeDefaults (default true) controls whether defaults are serialized; set false to omit them. Use nullable + default to distinguish absent from explicit null. Defaults make models resilient to optional fields.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between missing, null, and default in JSON parsing?",
    a: [
      {
        t: "p",
        text: "Three distinct cases: a field can be *absent* (not in the JSON at all), present with a value of `null`, or present with a value. A *non-nullable* property with a *default* handles 'absent' (uses the default) but *fails on explicit null*. A *nullable* property handles null. To fully distinguish absent vs null (e.g. for PATCH semantics), use a nullable type with a default of `null` — but note that then you can't tell 'absent' from 'null' without extra tooling.",
      },
      {
        t: "list",
        items: [
          "**Absent** — field not in JSON; a default fills it.",
          "**Null** — field present, value null; needs a nullable type.",
          "**Value** — present with data.",
          "**Both absent+null** — nullable + default `null` (can't distinguish the two without custom handling).",
        ],
      },
      {
        t: "note",
        text: "Absent (not in JSON — default fills it), null (present but null — needs nullable type), or a value. A non-nullable property with a default handles absent but fails on explicit null. Nullable + default null handles both, but you can't distinguish absent from null without extra tooling (matters for PATCH).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle nested objects and lists in JSON?",
    a: [
      {
        t: "p",
        text: "Nest `@Serializable` data classes and use `List<T>`/`Map<K, V>` of serializable types — the serializer handles them recursively. A response with an object containing an array of objects maps directly to a data class with a `List<Child>` property. No special handling needed beyond marking every type `@Serializable`.",
      },
      {
        t: "code",
        title: "Nested structures",
        code: `@Serializable data class Response(val user: User, val posts: List<Post>)
@Serializable data class User(val id: String, val name: String)
@Serializable data class Post(val id: String, val tags: List<String>)`,
      },
      {
        t: "list",
        items: [
          "**Nest `@Serializable` classes** — recursive serialization.",
          "**`List`/`Map`/`Set`** — of serializable types.",
          "**Direct mapping** — JSON structure ↔ class structure.",
          "**Mark all types** — every nested type needs `@Serializable`.",
        ],
      },
      {
        t: "note",
        text: "Nest @Serializable data classes and use List<T>/Map<K,V> of serializable types — the serializer handles them recursively, mapping the JSON structure directly to the class structure. Every nested type must be @Serializable. No special handling beyond that.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you write a custom serializer for a non-standard type?",
    a: [
      {
        t: "p",
        text: "Implement `KSerializer<T>` (define `serialize`/`deserialize` and a `descriptor`) for types the library doesn't handle out of the box — like a `Date`/`Instant` in a specific format, or a value wrapped differently. Apply it with `@Serializable(with = MySerializer::class)` on the property, or register it in the `Json` module for global use.",
      },
      {
        t: "code",
        title: "Custom serializer",
        code: `object InstantSerializer : KSerializer<Instant> {
    override val descriptor = PrimitiveSerialDescriptor("Instant", PrimitiveKind.STRING)
    override fun serialize(e: Encoder, v: Instant) = e.encodeString(v.toString())
    override fun deserialize(d: Decoder): Instant = Instant.parse(d.decodeString())
}
@Serializable data class Event(@Serializable(with = InstantSerializer::class) val at: Instant)`,
      },
      {
        t: "list",
        items: [
          "**`KSerializer<T>`** — implement `serialize`/`deserialize` + `descriptor`.",
          "**Apply** — `@Serializable(with = ...)` per property, or a contextual/module registration.",
          "**Uses** — dates/times, custom formats, value classes.",
          "**Contextual** — `contextualSerializer` for types you can't annotate.",
        ],
      },
      {
        t: "note",
        text: "Implement KSerializer<T> (serialize/deserialize + descriptor) for unsupported types (dates in a specific format, custom wrappers), applied via @Serializable(with = ...) per property or registered in the Json module (contextual). Handles types the library doesn't serialize out of the box.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you configure the Json instance (lenient, ignoreUnknownKeys, etc.)?",
    a: [
      {
        t: "p",
        text: "Build a `Json { }` with the options your API needs: `ignoreUnknownKeys = true` (don't fail on new/extra fields — important for forward compatibility), `coerceInputValues = true` (use defaults for null/invalid values), `isLenient = true` (accept malformed JSON like unquoted keys), `explicitNulls = false` (omit nulls), and `encodeDefaults`. Configure one shared instance.",
      },
      {
        t: "code",
        title: "Json config",
        code: `val json = Json {
    ignoreUnknownKeys = true      // forward-compatible with new fields
    coerceInputValues = true       // null/invalid -> default
    explicitNulls = false          // omit null fields when encoding
    isLenient = false              // strict JSON (usually)
}`,
      },
      {
        t: "list",
        items: [
          "**`ignoreUnknownKeys`** — tolerate extra/new fields (forward-compat).",
          "**`coerceInputValues`** — fall back to defaults for null/invalid.",
          "**`explicitNulls`** — omit nulls on encode.",
          "**`isLenient`** — accept malformed JSON (usually keep strict).",
        ],
      },
      {
        t: "note",
        text: "Configure one shared Json { }: ignoreUnknownKeys = true (forward-compatible with new fields), coerceInputValues = true (null/invalid → default), explicitNulls = false (omit nulls), encodeDefaults, isLenient (usually strict). These control resilience and output shape.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you rename a JSON field with @SerialName?",
    a: [
      {
        t: "p",
        text: "When the JSON key doesn't match your Kotlin property name (e.g. `snake_case` JSON vs `camelCase` Kotlin), annotate the property with `@SerialName(\"json_key\")`. For a whole API using snake_case, you can instead configure a `JsonNamingStrategy` (SnakeCase) to convert automatically rather than annotating every field.",
      },
      {
        t: "code",
        title: "@SerialName / naming strategy",
        code: `@Serializable data class User(
    @SerialName("full_name") val fullName: String,
    @SerialName("created_at") val createdAt: String,
)
// Or globally:
val json = Json { namingStrategy = JsonNamingStrategy.SnakeCase }`,
      },
      {
        t: "list",
        items: [
          "**`@SerialName(\"key\")`** — map a property to a specific JSON key.",
          "**`JsonNamingStrategy.SnakeCase`** — convert all names automatically.",
          "**Use per-field** — for one-off mismatches.",
          "**Use strategy** — for a consistently snake_case API.",
        ],
      },
      {
        t: "note",
        text: "Use @SerialName(\"json_key\") to map a property to a differently-named JSON key (snake_case JSON vs camelCase Kotlin). For a wholly snake_case API, configure Json { namingStrategy = JsonNamingStrategy.SnakeCase } to convert automatically instead of annotating every field.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle a field that can be different types (e.g. sometimes a string, sometimes an object)?",
    a: [
      {
        t: "p",
        text: "This 'union type' JSON is awkward. Options: parse it as `JsonElement` and inspect/branch manually; write a custom serializer that checks the shape and produces a sealed type; or (better) push back on the API for consistency. For a field that's sometimes a value and sometimes null/absent, use a nullable type. Avoid designing this into your own APIs.",
      },
      {
        t: "list",
        items: [
          "**`JsonElement`** — parse raw, inspect the shape, branch.",
          "**Custom serializer** — detect the type, map to a sealed result.",
          "**Nullable** — for value-or-null fields.",
          "**Prefer consistent APIs** — push back on shape-shifting fields.",
        ],
      },
      {
        t: "note",
        text: "For a field that changes type, parse it as JsonElement and branch on the shape, or write a custom serializer producing a sealed type. For value-or-null, use a nullable type. Best: push the API toward consistent shapes — don't design shape-shifting fields into your own APIs.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you serialize sealed classes / polymorphic types with a discriminator?",
    a: [
      {
        t: "p",
        text: "Mark the sealed hierarchy `@Serializable` — kotlinx.serialization adds a *class discriminator* field (default `\"type\"`) whose value selects the subtype on decode. You can customize the discriminator name and each subtype's name with `@SerialName`. This handles responses that are 'one of several types' (e.g. a feed of different item kinds).",
      },
      {
        t: "code",
        title: "Polymorphic sealed types",
        code: `@Serializable
sealed interface FeedItem {
    @Serializable @SerialName("post") data class Post(val text: String) : FeedItem
    @Serializable @SerialName("ad") data class Ad(val url: String) : FeedItem
}
val json = Json { classDiscriminator = "kind" }   // customize the discriminator field`,
      },
      {
        t: "list",
        items: [
          "**`@Serializable` sealed** — auto discriminator (default `\"type\"`).",
          "**`@SerialName`** — subtype names in the discriminator.",
          "**`classDiscriminator`** — customize the field name.",
          "**Uses** — mixed feeds, event types, one-of responses.",
        ],
      },
      {
        t: "note",
        text: "Mark the sealed hierarchy @Serializable — kotlinx.serialization adds a class discriminator field (default \"type\") whose value picks the subtype; customize with @SerialName per subtype and Json { classDiscriminator = \"kind\" }. Handles one-of responses (mixed feeds, event types).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you parse an enum, and handle unknown enum values gracefully?",
    a: [
      {
        t: "p",
        text: "Mark the enum `@Serializable` (map values with `@SerialName`). The problem: if the API adds a new enum value your app doesn't know, parsing *fails*. Handle it by including an `UNKNOWN` fallback and setting `coerceInputValues = true` (with the fallback as the default), or use a custom serializer that maps unrecognized strings to `UNKNOWN` — so a new server value doesn't crash old apps.",
      },
      {
        t: "code",
        title: "Enum with fallback",
        code: `@Serializable enum class Status {
    @SerialName("active") ACTIVE,
    @SerialName("inactive") INACTIVE,
    UNKNOWN;   // fallback for new/unrecognized values
}
val json = Json { coerceInputValues = true }   // unknown -> UNKNOWN (if it's the default)`,
      },
      {
        t: "list",
        items: [
          "**`@Serializable` enum + `@SerialName`** — map JSON values.",
          "**Unknown values crash** — new server enum breaks old apps.",
          "**`UNKNOWN` fallback + `coerceInputValues`** — degrade gracefully.",
          "**Or custom serializer** — map unrecognized → `UNKNOWN`.",
        ],
      },
      {
        t: "note",
        text: "Mark enums @Serializable (@SerialName per value). Unknown server values crash parsing — add an UNKNOWN fallback + coerceInputValues (fallback as default), or a custom serializer mapping unrecognized strings to UNKNOWN. Prevents a new server enum from crashing old app versions.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between reflection-based (Gson) and codegen (Moshi/kotlinx) serialization?",
    a: [
      {
        t: "p",
        text: "*Reflection-based* (Gson, Moshi-reflect) inspects classes at *runtime* to map fields — flexible but slower, larger (keeps reflection metadata), and doesn't respect Kotlin nullability/defaults well (Gson can create nulls in non-null fields). *Codegen* (kotlinx.serialization, Moshi-codegen) generates serializers at *compile time* — faster, smaller, Kotlin-aware (nullability, defaults), and KMP-capable. Prefer codegen.",
      },
      {
        t: "table",
        headers: ["", "Reflection (Gson)", "Codegen (kotlinx/Moshi)"],
        rows: [
          ["When", "runtime", "compile time"],
          ["Speed", "slower", "faster"],
          ["Kotlin-aware", "poor (nulls)", "yes"],
          ["KMP", "no", "yes (kotlinx)"],
        ],
      },
      {
        t: "list",
        items: [
          "**Reflection (Gson)** — runtime mapping; flexible but slow, Kotlin-unaware.",
          "**Codegen (kotlinx/Moshi)** — compile-time serializers; fast, Kotlin-aware.",
          "**Gson pitfall** — can put null in non-null Kotlin fields.",
          "**Prefer codegen** — kotlinx.serialization for new/KMP code.",
        ],
      },
      {
        t: "note",
        text: "Reflection-based (Gson) maps at runtime — flexible but slower, larger, and Kotlin-unaware (can put null in non-null fields). Codegen (kotlinx.serialization, Moshi-codegen) generates serializers at compile time — faster, smaller, respects nullability/defaults, KMP-capable. Prefer codegen (kotlinx) for new code.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you serialize and parse a raw JSON tree without a data class?",
    a: [
      {
        t: "p",
        text: "Use `JsonElement` (and `JsonObject`/`JsonArray`/`JsonPrimitive`) to work with JSON dynamically — parse with `Json.parseToJsonElement(str)`, navigate (`jsonObject[\"key\"]`), and read primitives. Useful for unstructured/dynamic data, inspecting before deciding a type, or extracting one field from a large response. Prefer typed data classes when the structure is known.",
      },
      {
        t: "code",
        title: "JsonElement",
        code: `val element = Json.parseToJsonElement(jsonString)
val name = element.jsonObject["user"]?.jsonObject?.get("name")?.jsonPrimitive?.content`,
      },
      {
        t: "list",
        items: [
          "**`JsonElement`/`JsonObject`/`JsonArray`** — dynamic JSON tree.",
          "**`parseToJsonElement`** — parse without a target class.",
          "**Navigate** — `jsonObject[\"key\"]`, `jsonPrimitive.content`.",
          "**Prefer typed classes** — when the structure is known.",
        ],
      },
      {
        t: "note",
        text: "Use JsonElement/JsonObject/JsonArray/JsonPrimitive for dynamic JSON: Json.parseToJsonElement(str), navigate with jsonObject[\"key\"], read jsonPrimitive.content. For unstructured/dynamic data or extracting one field. Prefer typed data classes when the structure is known.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle dates and times in JSON?",
    a: [
      {
        t: "p",
        text: "JSON has no date type, so dates come as strings (ISO-8601, e.g. `2024-01-15T10:30:00Z`) or epoch numbers. Parse them into a proper type (`Instant`/`LocalDateTime` via kotlinx-datetime or java.time) with a custom serializer or by storing the string and converting in your mapper. Always be explicit about *time zones* (prefer UTC/ISO-8601 with offset) to avoid bugs.",
      },
      {
        t: "list",
        items: [
          "**Dates as strings/numbers** — ISO-8601 or epoch millis.",
          "**Parse to a type** — `Instant`/`LocalDateTime` (kotlinx-datetime/java.time).",
          "**Custom serializer** — map the string format to the type.",
          "**Time zones** — use UTC/ISO-8601 with offset; convert for display.",
        ],
      },
      {
        t: "note",
        text: "JSON has no date type — dates arrive as ISO-8601 strings or epoch numbers. Parse to Instant/LocalDateTime (kotlinx-datetime/java.time) via a custom serializer (or store the string, convert in the mapper). Be explicit about time zones (prefer UTC/ISO-8601 with offset) to avoid bugs.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why should you make DTO fields nullable or defaulted defensively?",
    a: [
      {
        t: "p",
        text: "Servers can send incomplete, unexpected, or evolving responses (a field missing, null where you expected a value, new fields). Making DTO fields *nullable or defaulted* prevents a single unexpected field from crashing the *entire* parse. You then map to a clean, non-null *domain model* — handling the messiness once at the boundary rather than letting it propagate.",
      },
      {
        t: "list",
        items: [
          "**Servers are imperfect** — missing/null/new fields happen.",
          "**Nullable/defaulted DTOs** — one bad field doesn't crash the whole parse.",
          "**Map to domain** — clean, non-null models after validation.",
          "**Boundary handling** — deal with messiness once, at parsing.",
        ],
      },
      {
        t: "note",
        text: "Servers send incomplete/unexpected/evolving responses, so make DTO fields nullable or defaulted defensively — one bad field won't crash the whole parse. Then map DTOs to clean non-null domain models, handling the messiness once at the boundary rather than letting it propagate.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test serialization code?",
    a: [
      {
        t: "p",
        text: "Test round-trips (encode then decode equals the original) and, importantly, *decode real/sample JSON* (including edge cases: missing fields, nulls, unknown fields, wrong types) to assert your DTOs and config handle them without crashing. Keep sample JSON fixtures from the actual API. These tests catch mapping bugs and guard against API changes breaking parsing.",
      },
      {
        t: "code",
        title: "Serialization test",
        code: `@Test fun parsesMissingFields() {
    val user = json.decodeFromString<User>("""{"id":"1"}""")   // name absent
    assertEquals("default", user.name)   // default used, no crash
}`,
      },
      {
        t: "list",
        items: [
          "**Round-trip** — encode→decode equals the original.",
          "**Decode sample JSON** — real responses + edge cases (missing/null/unknown/wrong types).",
          "**Fixtures** — keep sample JSON from the actual API.",
          "**Catch mapping bugs** — and API-change regressions.",
        ],
      },
      {
        t: "note",
        text: "Test serialization with round-trips (encode→decode equals original) and by decoding real/sample JSON including edge cases (missing/null/unknown fields, wrong types) to assert no crashes and correct defaults. Keep API JSON fixtures. Catches mapping bugs and guards against API changes breaking parsing.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the performance cost of JSON parsing, and how do you optimize it?",
    a: [
      {
        t: "p",
        text: "Parsing large JSON is CPU-bound and allocates — it can jank the UI if done on the main thread. Optimize by: parsing off the main thread (Retrofit suspend functions do this), using codegen serializers (no reflection), streaming very large responses instead of buffering, requesting only needed fields (or a leaner endpoint), and avoiding re-parsing (cache the parsed model). For huge datasets, consider a binary format (protobuf).",
      },
      {
        t: "list",
        items: [
          "**Off main thread** — Retrofit suspend functions parse in the background.",
          "**Codegen serializers** — faster than reflection.",
          "**Stream large responses** — avoid buffering everything.",
          "**Request less** — leaner endpoints; consider binary (protobuf) for huge data.",
        ],
      },
      {
        t: "note",
        text: "JSON parsing is CPU-bound and allocating — off the main thread (Retrofit suspend does this) to avoid jank. Optimize with codegen serializers (no reflection), streaming large responses, requesting only needed fields, caching parsed models, and considering a binary format (protobuf) for very large datasets.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does the DTO-to-domain mapping layer work?",
    a: [
      {
        t: "p",
        text: "DTOs (data transfer objects) mirror the API's JSON shape (nullable, snake_case, server quirks). *Mappers* convert them to clean *domain models* (non-null, validated, in your app's terms) at the repository boundary. This decouples the app from the API — if the API changes, you fix the DTO/mapper, not the whole app — and lets the domain be exactly what the app needs.",
      },
      {
        t: "code",
        title: "DTO → domain",
        code: `@Serializable data class UserDto(val id: String?, val full_name: String?)
data class User(val id: String, val name: String)   // clean domain model
fun UserDto.toDomain() = User(id = id.orEmpty(), name = full_name ?: "Unknown")`,
      },
      {
        t: "list",
        items: [
          "**DTO** — mirrors the API (nullable, snake_case, quirks).",
          "**Domain model** — clean, non-null, app-centric.",
          "**Mapper** — converts DTO→domain at the boundary.",
          "**Decoupling** — API changes stay isolated to DTO/mapper.",
        ],
      },
      {
        t: "note",
        text: "DTOs mirror the API's JSON (nullable, snake_case, quirks); mappers convert them to clean non-null domain models at the repository boundary. This decouples the app from the API — API changes only touch the DTO/mapper — and lets the domain be exactly what the app needs.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you exclude a field from serialization with @Transient?",
    a: [
      {
        t: "p",
        text: "Annotate a property `@Transient` to exclude it from serialization/deserialization — it won't be written or read, and must have a default value (since it's not populated from JSON). Use it for computed, cached, or runtime-only fields that shouldn't cross the wire.",
      },
      {
        t: "code",
        title: "@Transient",
        code: `@Serializable data class User(
    val id: String,
    val name: String,
    @Transient val isSelected: Boolean = false,   // not serialized; needs a default
)`,
      },
      {
        t: "list",
        items: [
          "**`@Transient`** — exclude from serialization/deserialization.",
          "**Needs a default** — it's not read from JSON.",
          "**Uses** — computed/cached/runtime-only fields.",
          "**vs `@Ignore`** — that's Room; `@Transient` is serialization.",
        ],
      },
      {
        t: "note",
        text: "@Transient excludes a property from serialization/deserialization (needs a default, since it's not read from JSON) — for computed/cached/runtime-only fields that shouldn't cross the wire. (Room's equivalent is @Ignore.)",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you require a field to be present with @Required?",
    a: [
      {
        t: "p",
        text: "A property *with a default* is optional (parsing succeeds if it's absent). To make a defaulted property *mandatory* — fail if the JSON omits it — annotate it `@Required`. This is useful when a field is critical and a missing value indicates a malformed response you'd rather catch than silently default.",
      },
      {
        t: "code",
        title: "@Required",
        code: `@Serializable data class Config(
    @Required val apiVersion: String = "",   // must be present despite the default
    val optional: String = "x",
)`,
      },
      {
        t: "list",
        items: [
          "**Default = optional** — absent field uses the default.",
          "**`@Required`** — forces presence even if defaulted.",
          "**Fails on absence** — throws if the field is missing.",
          "**Use** — critical fields where absence is an error.",
        ],
      },
      {
        t: "note",
        text: "A property with a default is optional (absent → default). @Required forces it to be present in the JSON despite the default (throws if missing) — for critical fields where absence indicates a malformed response you'd rather catch than silently default.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle large numbers and precision in JSON?",
    a: [
      {
        t: "p",
        text: "JSON numbers can exceed `Int` range or lose precision as `Double` (money!). Use `Long` for large integers (ids/timestamps) and *never* store currency as `Double` (floating-point errors) — represent money as an integer of minor units (cents) or as a `String`/`BigDecimal` in JSON. Large ids from some servers should be `String` or `Long`, not `Int`, to avoid overflow.",
      },
      {
        t: "list",
        items: [
          "**`Long` for large ints** — ids/timestamps beyond `Int` range.",
          "**Money ≠ `Double`** — floating-point errors; use minor units (cents) or String/BigDecimal.",
          "**Large ids as `String`** — avoid overflow/precision loss.",
          "**Precision** — JSON parsers may coerce big numbers to `Double`; be deliberate.",
        ],
      },
      {
        t: "note",
        text: "Use Long for large integers (ids/timestamps beyond Int); never store money as Double (floating-point errors) — use integer minor units (cents) or String/BigDecimal. Represent very large ids as String/Long to avoid overflow. Be deliberate about number types to prevent precision loss.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does kotlinx.serialization support formats other than JSON?",
    a: [
      {
        t: "p",
        text: "kotlinx.serialization is format-agnostic: the same `@Serializable` classes can be encoded/decoded with different formats — `Json`, `Cbor` (compact binary), `Protobuf` (schema-compatible binary), and `Properties`. You pick the format instance; the serializers are the same. This lets you use JSON for APIs and a binary format (CBOR/Protobuf) where size/speed matters (e.g. caching, IPC).",
      },
      {
        t: "code",
        title: "Multiple formats",
        code: `@Serializable data class User(val id: String, val name: String)
val jsonBytes = Json.encodeToString(user)
val cborBytes = Cbor.encodeToByteArray(user)      // compact binary
val protoBytes = ProtoBuf.encodeToByteArray(user)  // protobuf-compatible`,
      },
      {
        t: "list",
        items: [
          "**Format-agnostic** — one `@Serializable`, many formats.",
          "**`Json`/`Cbor`/`Protobuf`/`Properties`** — pick the encoder.",
          "**Binary** — smaller/faster for caching, IPC, storage.",
          "**Same serializers** — no per-format annotations.",
        ],
      },
      {
        t: "note",
        text: "kotlinx.serialization is format-agnostic: the same @Serializable classes encode/decode with Json, Cbor (compact binary), Protobuf (schema-compatible), or Properties — pick the format instance. Use JSON for APIs, binary (CBOR/Protobuf) where size/speed matters (caching/IPC/storage). Same serializers throughout.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you evolve a JSON schema without breaking old app versions?",
    a: [
      {
        t: "p",
        text: "Make changes *additive and backward-compatible*: add new fields (old apps ignore them via `ignoreUnknownKeys`; new fields need defaults so absence is fine for old servers), never remove/rename fields old apps rely on (use `@SerialName` to keep old keys), and don't change types. For breaking changes, version the API. Because old app versions persist, the server must tolerate old clients and vice versa.",
      },
      {
        t: "list",
        items: [
          "**Additive changes** — add fields with defaults; `ignoreUnknownKeys` on the client.",
          "**Don't remove/rename** — old apps break; keep old keys via `@SerialName`.",
          "**Don't change types** — breaks parsing.",
          "**Version for breaking changes** — old app versions linger.",
        ],
      },
      {
        t: "note",
        text: "Evolve JSON additively: add fields with defaults (old apps ignore extras via ignoreUnknownKeys), never remove/rename fields old apps use (keep old keys with @SerialName), don't change types. Version the API for breaking changes. Old app versions persist, so both sides must tolerate each other.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is contextual serialization, and when do you need it?",
    a: [
      {
        t: "p",
        text: "Contextual serialization lets you use a serializer for a type you *can't annotate* (a third-party class, or where you want to swap serializers per context). You register a serializer in the `Json` module (`serializersModule = SerializersModule { contextual(...) }`) and mark the property `@Contextual`. It's the way to serialize types you don't own or want configured centrally.",
      },
      {
        t: "code",
        title: "Contextual",
        code: `val json = Json {
    serializersModule = SerializersModule { contextual(InstantSerializer) }
}
@Serializable data class Event(@Contextual val at: Instant)`,
      },
      {
        t: "list",
        items: [
          "**`@Contextual`** — use a serializer registered in the module.",
          "**Module registration** — `contextual(Serializer)`.",
          "**For un-annotatable types** — third-party classes.",
          "**Central config** — swap serializers per `Json` instance.",
        ],
      },
      {
        t: "note",
        text: "Contextual serialization uses a serializer registered in the Json module (serializersModule { contextual(...) }) with @Contextual on the property — for types you can't annotate (third-party classes) or want configured centrally. Lets you serialize types you don't own or vary the serializer per context.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do Moshi adapters compare to kotlinx.serialization?",
    a: [
      {
        t: "p",
        text: "Both are modern JSON libraries. *Moshi* uses `JsonAdapter`s (with codegen via KSP or reflection) — mature, great error messages, adapter-based customization. *kotlinx.serialization* uses compiler-plugin-generated serializers — no reflection, *multiplatform* (KMP), format-agnostic (JSON/CBOR/Protobuf). For KMP or a fully-Kotlin stack, kotlinx.serialization is the natural choice; Moshi is excellent for Android-only projects.",
      },
      {
        t: "table",
        headers: ["", "Moshi", "kotlinx.serialization"],
        rows: [
          ["Mechanism", "JsonAdapter (codegen/reflect)", "compiler plugin"],
          ["KMP", "no", "yes"],
          ["Formats", "JSON", "JSON/CBOR/Protobuf"],
          ["Maturity", "very mature", "mature, Kotlin-first"],
        ],
      },
      {
        t: "list",
        items: [
          "**Moshi** — JsonAdapters, codegen (KSP), mature; Android-focused.",
          "**kotlinx** — compiler plugin, no reflection, KMP, multi-format.",
          "**KMP / all-Kotlin** — kotlinx.serialization.",
          "**Android-only** — either; both are solid.",
        ],
      },
      {
        t: "note",
        text: "Moshi (JsonAdapters via KSP codegen/reflection — mature, great errors, JSON-only, Android) vs kotlinx.serialization (compiler-plugin serializers — no reflection, KMP, JSON/CBOR/Protobuf). Choose kotlinx for KMP/all-Kotlin stacks; Moshi is excellent for Android-only. Both are modern and solid.",
      },
    ],
  },
];

export default qa;
