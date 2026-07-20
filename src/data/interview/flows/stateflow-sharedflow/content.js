// StateFlow & SharedFlow — Content tab. Teaching-first.

const content = [
  {
    heading: "Hot flows — the opposite of cold",
    blocks: [
      {
        t: "p",
        text: "`StateFlow` and `SharedFlow` are **hot** flows. Recall cold flows run per-collector and only while collected. Hot flows are the opposite: they **exist independently of collectors** and **multicast** the same emissions to all current collectors. Emitting into a hot flow happens whether or not anyone is listening; collectors 'tune in' to a live broadcast rather than triggering their own private run.",
      },
      {
        t: "list",
        items: [
          "**One shared stream, many collectors**: ten collectors of a `StateFlow` all receive the same emissions from the one underlying stream — not ten independent executions.",
          "**Emission is decoupled from collection**: you push values in (`_state.value = x`, `emit(event)`) from anywhere; collectors receive them if they're active.",
          "**They don't complete on their own**: a `StateFlow`/`SharedFlow` never finishes (there's always potentially another value), so collecting one suspends forever until the collecting coroutine is cancelled.",
          "**Use case**: representing *shared state* (UI state everyone observes) or *broadcasting events* to multiple listeners — things that conceptually exist regardless of who's watching.",
        ],
      },
    ],
  },
  {
    heading: "StateFlow — a hot flow that always has a current value",
    blocks: [
      {
        t: "p",
        text: "**`StateFlow<T>`** is a hot flow specialized for **state**: it always holds exactly one *current value*, and new collectors immediately receive that current value, then every subsequent update. It's essentially an observable value holder — the modern replacement for `LiveData`.",
      },
      {
        t: "code",
        title: "The canonical ViewModel pattern",
        code: `class ProfileViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(ProfileUiState.Loading) // requires initial value
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()  // read-only exposure

    fun load() {
        viewModelScope.launch {
            val user = repository.getUser()
            _uiState.update { it.copy(user = user, isLoading = false) } // atomic update
        }
    }
}

// Reading the current value synchronously (no collection):
val current = uiState.value`,
      },
      {
        t: "list",
        items: [
          "**Requires an initial value** — there's always a 'current' state, so `MutableStateFlow(initial)` must be given one. (`SharedFlow` has no initial value.)",
          "**`.value`** reads/writes the current value synchronously — you can read state without collecting.",
          "**Conflated + distinct**: `StateFlow` only emits when the new value is *different* (`!=`) from the current, and a slow collector only sees the *latest* value, not every intermediate one. It's about *state*, not every event.",
          "**Always update immutably**: replace with `copy()` via `update { }` (atomic compare-and-set, safe against concurrent writers) rather than mutating the held object — mutating in place won't emit (same reference).",
          "**Backing-property pattern**: private `MutableStateFlow`, public `StateFlow` via `asStateFlow()` — so only the ViewModel writes (single source of truth, UDF).",
        ],
      },
    ],
  },
  {
    heading: "SharedFlow — a configurable hot broadcast",
    blocks: [
      {
        t: "p",
        text: "**`SharedFlow<T>`** is the general hot flow: a broadcaster with no notion of a single 'current value', configurable via **replay**, **buffer**, and **overflow** policy. `StateFlow` is actually a specialized `SharedFlow` (replay=1, conflated, with an initial value).",
      },
      {
        t: "code",
        title: "Configuring a SharedFlow",
        code: `private val _events = MutableSharedFlow<UiEvent>(
    replay = 0,                                  // how many past values new collectors get
    extraBufferCapacity = 64,                    // buffer beyond replay
    onBufferOverflow = BufferOverflow.DROP_OLDEST, // what to do when buffer full
)
val events: SharedFlow<UiEvent> = _events.asSharedFlow()

suspend fun sendEvent(e: UiEvent) = _events.emit(e)   // suspends if buffer full (SUSPEND)
fun tryEvent(e: UiEvent) = _events.tryEmit(e)         // non-suspending; may drop`,
      },
      {
        t: "list",
        items: [
          "**`replay`** — how many of the most recent values a *new* collector receives on subscribing. `replay = 0` means new collectors only get values emitted *after* they subscribe (good for events); `replay = 1` mimics StateFlow-ish behavior (last value re-delivered).",
          "**`extraBufferCapacity`** — buffer slots beyond replay, so `emit` doesn't suspend as long as there's room.",
          "**`onBufferOverflow`** — `SUSPEND` (default; producer waits), `DROP_OLDEST`, or `DROP_LATEST` when the buffer is full.",
          "**`emit` vs `tryEmit`**: `emit` suspends when the buffer is full (with SUSPEND policy); `tryEmit` never suspends and returns `false` if it couldn't buffer the value — useful in non-suspend contexts, but can silently drop.",
        ],
      },
    ],
  },
  {
    heading: "StateFlow vs SharedFlow — the comparison",
    blocks: [
      {
        t: "table",
        headers: ["", "StateFlow", "SharedFlow"],
        rows: [
          ["Initial value", "required", "none"],
          ["Current value", "yes (`.value`)", "no"],
          ["Replay to new collectors", "always 1 (the current value)", "configurable (0..n)"],
          ["Conflation / distinct", "yes — skips equal values, keeps latest", "no (configurable buffering)"],
          ["Best for", "state (UI state, a value over time)", "events (one-shot signals, broadcasts)"],
          ["Analogy", "an observable variable", "an event bus / broadcast"],
        ],
      },
      {
        t: "list",
        items: [
          "**Rule of thumb**: **state → StateFlow, events → SharedFlow** (with `replay = 0`). State has a 'current value' that a new observer should immediately see; events are transient and shouldn't replay to late subscribers.",
          "**Why not use StateFlow for events**: its conflation and distinct-until-changed drop values — two identical events collapse to one, and a slow collector misses intermediates. Fine for state (you only care about *now*), wrong for events (each must be delivered).",
          "**Why not use SharedFlow for state**: it has no current value, so a new collector sees nothing until the next emission (unless you set `replay = 1`, at which point you've basically rebuilt a worse StateFlow). StateFlow is purpose-built for the state case.",
        ],
      },
    ],
  },
  {
    heading: "The event-delivery problem SharedFlow doesn't fully solve",
    blocks: [
      {
        t: "p",
        text: "A common trap: using `SharedFlow(replay = 0)` for one-shot events (navigation, snackbars) *seems* right, but **values emitted while no collector is active are dropped**. During a configuration change the UI's collector is briefly gone — an event emitted in that window vanishes. `tryEmit` with a full/zero buffer also silently fails.",
      },
      {
        t: "list",
        items: [
          "**Mitigations**: give `extraBufferCapacity` so `emit` from a non-suspend context buffers instead of dropping; or use a **`Channel` + `receiveAsFlow()`**, where `send` *suspends until delivered* so events survive collection gaps (the common pragmatic choice).",
          "**Google's recommendation**: model even one-shot events as *state* with a consumption callback (a nullable field cleared after handling) — survives config change and process death, at the cost of some ceremony.",
          "This is the same 'one-shot event problem' covered in the Architecture (MVVM/MVI) topics — SharedFlow is one tool with real delivery caveats, not a complete solution.",
        ],
      },
      {
        t: "note",
        text: "Interview-ready summary: \"StateFlow for state (always has a value, conflated, distinct); SharedFlow for events (configurable replay/buffer, no current value). But raw SharedFlow can drop events across lifecycle gaps, so for critical one-shot events I use a Channel or model them as consumable state.\"",
      },
    ],
  },
  {
    heading: "StateFlow vs LiveData — the migration question",
    blocks: [
      {
        t: "table",
        headers: ["", "LiveData", "StateFlow"],
        rows: [
          ["Platform", "Android-only", "pure Kotlin (KMP-friendly)"],
          ["Lifecycle awareness", "built-in", "needs `repeatOnLifecycle` / `collectAsStateWithLifecycle`"],
          ["Initial value", "optional (nullable)", "required (non-null by default)"],
          ["Operators", "few (`map`, `switchMap`)", "full Flow operator set"],
          ["Threading / async", "manual", "coroutine-native"],
        ],
      },
      {
        t: "list",
        items: [
          "StateFlow is the modern default; LiveData is in maintenance mode. The decisive factor for an Android/KMP engineer is **KMP**: LiveData can't move to `commonMain`, StateFlow can.",
          "The tradeoff StateFlow introduces: it's *not* lifecycle-aware by itself, so you must collect it safely (`collectAsStateWithLifecycle` in Compose, `repeatOnLifecycle` in Views) — otherwise you keep collecting in the background. LiveData handled that automatically.",
        ],
      },
    ],
  },
];

export default content;
