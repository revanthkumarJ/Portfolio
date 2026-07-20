// StateFlow & SharedFlow — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is the difference between a cold flow and a hot flow like StateFlow?",
    a: [
      {
        t: "p",
        text: "**The concept**: a *cold* flow (plain `Flow` from `flow { }`) runs its producer separately for each collector, starting only when collected and stopping when collection ends — every collector gets a private, independent run. A *hot* flow (`StateFlow`, `SharedFlow`) exists on its own and **broadcasts** the same emissions to all current collectors; it emits whether or not anyone is listening, and collectors share one underlying stream.",
      },
      {
        t: "p",
        text: "**Concrete difference**: collect a cold repository flow twice → two network calls. Collect a `StateFlow` twice → both collectors read from the same single value, no duplication. Also, a hot flow like `StateFlow` never completes (there's always potentially a next value), so collecting it suspends until the collecting coroutine is cancelled, whereas a cold flow of finite values completes on its own. Hot flows are for *shared state and events*; cold flows are for *per-consumer, lazy work*.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is StateFlow and how do you use it in a ViewModel?",
    a: [
      {
        t: "p",
        text: "**The concept**: `StateFlow<T>` is a hot flow that always holds one *current value* and emits it (plus every update) to collectors. It's an observable state holder — the modern replacement for `LiveData`. The standard ViewModel pattern uses the backing-property idiom: a private `MutableStateFlow` you write to, exposed publicly as a read-only `StateFlow`.",
      },
      {
        t: "code",
        title: "The pattern",
        code: `private val _uiState = MutableStateFlow(UiState())     // initial value required
val uiState: StateFlow<UiState> = _uiState.asStateFlow()

fun onNameChange(name: String) {
    _uiState.update { it.copy(name = name) }          // immutable, atomic update
}`,
      },
      {
        t: "list",
        items: [
          "**Initial value required** — there's always a current state; `MutableStateFlow(initial)`.",
          "**Read `.value` anytime** — synchronous access to the current state without collecting.",
          "**Only the ViewModel writes** — exposing the read-only `StateFlow` enforces single-source-of-truth / unidirectional data flow; the UI can only observe.",
          "**Update immutably with `update { }`** — replace via `copy()`; `update` is an atomic compare-and-set safe against concurrent writers (unlike `value = value.copy()` which can lose writes under concurrency).",
          "**Collect safely in UI** — `collectAsStateWithLifecycle()` in Compose or `repeatOnLifecycle` in Views (StateFlow isn't lifecycle-aware itself).",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "When should you use StateFlow vs SharedFlow?",
    a: [
      {
        t: "p",
        text: "**The rule**: **StateFlow for state, SharedFlow for events.** StateFlow always has a *current value* that a new observer should immediately see — perfect for UI state, a selected item, a toggle, anything that has a 'value right now'. SharedFlow has *no* current value and is a configurable broadcast — perfect for *events* that happen and are gone: navigation commands, snackbar triggers, one-shot signals.",
      },
      {
        t: "list",
        items: [
          "**Why not StateFlow for events**: StateFlow conflates and drops duplicates — two identical events (`ShowError` twice) collapse into one emission, and a slow collector only sees the latest. For events, every occurrence must be delivered, so that behavior is wrong.",
          "**Why not SharedFlow for state**: SharedFlow has no 'current value', so a fresh collector sees nothing until the next emission — a screen that subscribes late would show no state. StateFlow is purpose-built to give new collectors the current value immediately.",
          "**Practical setup**: `MutableStateFlow(initialState)` for UI state; `MutableSharedFlow<Event>(replay = 0)` (often with `extraBufferCapacity`) for events.",
        ],
      },
      {
        t: "p",
        text: "Mental model: StateFlow is an *observable variable*; SharedFlow is an *event bus*. Match the tool to whether the thing has a persistent 'current value' or is a transient occurrence.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why does StateFlow require an initial value but SharedFlow doesn't?",
    a: [
      {
        t: "p",
        text: "**Because of what each represents.** `StateFlow` models *state* — a value that always exists 'right now'. There's no such thing as state with no value, so it must be initialized, and `.value` can always return something. That's also why a new collector instantly receives the current value: there's always one to give.",
      },
      {
        t: "p",
        text: "`SharedFlow` models a *stream of events/broadcasts*, which has no inherent 'current value' — before the first event, there simply is nothing, and that's valid. A new collector, by default (`replay = 0`), receives only events emitted *after* it subscribes. If you *want* SharedFlow to replay the last value to new collectors you set `replay = 1` — and at that point you've essentially reconstructed StateFlow-like behavior (which is literally how StateFlow is implemented: a specialized SharedFlow with replay 1, conflation, and an initial value). The initial-value requirement is the API encoding the semantic difference: state always has a value, events don't.",
      },
    ],
  },
  {
    level: "junior",
    q: "How is StateFlow different from LiveData?",
    a: [
      {
        t: "list",
        items: [
          "**Platform**: LiveData is Android-only; StateFlow is pure Kotlin, so it works in KMP `commonMain`. For an Android/KMP engineer this is the decisive difference — shared ViewModels need StateFlow.",
          "**Lifecycle awareness**: LiveData is lifecycle-aware out of the box (observers auto-pause/resume). StateFlow is *not* — you must collect it safely with `collectAsStateWithLifecycle` (Compose) or `repeatOnLifecycle` (Views), or it keeps collecting in the background.",
          "**Initial value**: LiveData can start empty (null); StateFlow requires an initial value (and is non-null-friendly).",
          "**Operators & async**: StateFlow has the full Flow operator set and native coroutine integration; LiveData has only a few transformations and awkward async.",
        ],
      },
      {
        t: "p",
        text: "**Bottom line**: StateFlow is the modern default and LiveData is in maintenance mode. The one thing StateFlow *costs* you is automatic lifecycle handling — you opt back into it with the lifecycle-aware collectors. Migrating LiveData→StateFlow is usually mechanical, and worth it especially if any code might be shared with KMP.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain replay, extraBufferCapacity, and onBufferOverflow in MutableSharedFlow.",
    a: [
      {
        t: "p",
        text: "These three parameters define a SharedFlow's buffering behavior — how it handles values relative to collectors that may be absent or slow.",
      },
      {
        t: "list",
        items: [
          "**`replay`** — how many of the most recent values a *newly subscribing* collector immediately receives. `replay = 0`: new collectors get only future emissions (correct for events — you don't want a late subscriber replaying an old navigation command). `replay = 1`: the last value is re-delivered to new collectors (StateFlow-like caching). Replayed values are also held in the buffer.",
          "**`extraBufferCapacity`** — buffer slots *in addition to* replay. Their purpose: let the producer `emit` (or `tryEmit`) *without suspending* as long as buffer space remains. With `extraBufferCapacity > 0` and the default SUSPEND policy, a fast producer can get ahead of a slow collector up to the buffer size before it has to wait.",
          "**`onBufferOverflow`** — what happens when the buffer (replay + extra) is full and a new value arrives: `SUSPEND` (default — the emitting coroutine suspends until space frees up, applying backpressure), `DROP_OLDEST` (evict the oldest buffered value, keep flowing — good for 'latest wins' like sensor data), or `DROP_LATEST` (discard the incoming value, keep what's buffered).",
        ],
      },
      {
        t: "p",
        text: "**How they interact with emit/tryEmit**: `emit` respects SUSPEND (waits when full); `tryEmit` never suspends and returns `false` if it couldn't place the value (which, with a full buffer and SUSPEND policy, means the value is *dropped*). A subtle senior point: `tryEmit` can *always* succeed if `onBufferOverflow` is a DROP policy (it evicts to make room), so pairing `tryEmit` with `DROP_OLDEST` gives a non-suspending, never-failing emitter that keeps the newest values — a common configuration for high-frequency non-critical streams.",
      },
    ],
  },
  {
    level: "senior",
    q: "You used SharedFlow(replay=0) for navigation events but some events are getting lost. Why, and how do you fix it?",
    a: [
      {
        t: "p",
        text: "**Why events are lost**: a `SharedFlow` broadcasts to *currently active* collectors only. With `replay = 0` and no buffer, a value emitted while **no collector is active is dropped entirely** — nobody was subscribed to receive it, and there's no replay to catch up. This bites hardest around lifecycle transitions: during a configuration change (rotation) the UI's collector is torn down and re-created, and any event emitted in that gap vanishes. If you emit with `tryEmit` and there's no buffer space, it also silently fails (returns false).",
      },
      {
        t: "list",
        items: [
          "**Fix 1 — buffer so emissions survive the gap**: `MutableSharedFlow(replay = 0, extraBufferCapacity = 1, onBufferOverflow = SUSPEND)`. Now an event emitted with `tryEmit` while the collector is briefly gone is *buffered* and delivered when collection resumes. Cheap and often sufficient.",
          "**Fix 2 — use a `Channel` + `receiveAsFlow()`**: a `Channel(BUFFERED)` whose `send` *suspends until the value is actually received*. Events wait through collection gaps instead of being dropped — the common pragmatic choice for one-shot events. Caveat: a Channel fans out to a *single* collector (each event goes to exactly one), which is usually what you want for navigation but not for broadcasting to many listeners.",
          "**Fix 3 — model events as consumable state (Google's recommendation)**: put the event in your `StateFlow` UI state as a nullable field, have the UI perform it and call back `onEventConsumed()` to clear it. This survives configuration change *and* process death (if in SavedStateHandle), with no delivery-gap ambiguity. More ceremony, most robust.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: SharedFlow is a *hot broadcast*, and hot broadcasts inherently can't deliver to absent listeners — so it's the wrong primitive for 'must happen exactly once' events unless you add buffering. Name the lifecycle-gap mechanism as the root cause, then pick the fix by delivery guarantee needed: buffer (good enough), Channel (suspends-until-delivered), or consumable state (survives process death).",
      },
    ],
  },
  {
    level: "senior",
    q: "How does StateFlow's conflation and distinct-until-changed behavior affect what you can use it for?",
    a: [
      {
        t: "p",
        text: "**Two behaviors, both intentional for state:** (1) **distinct** — StateFlow never emits a value that `equals` the current one, so setting the same value twice emits once. (2) **conflation** — a slow collector only ever sees the *latest* value; intermediate values it was too slow to process are skipped, never queued.",
      },
      {
        t: "list",
        items: [
          "**Why this is correct for state**: a UI only cares about the *current* state. If state changes A→B→C faster than the UI can render, rendering only C is exactly right — rendering A and B first would be wasted frames showing stale data. And re-emitting an equal state would cause needless recomposition. So conflation + distinct make StateFlow efficient for its purpose.",
          "**Where it makes StateFlow the WRONG tool**: anything where *every emission matters*. Analytics that must log each step (conflation drops steps under load). Animations queued per value (skipped intermediates break them). Events (two identical events collapse to one; a missed intermediate is a missed event). For these, use `SharedFlow` (buffered, no conflation) or a `Channel`.",
          "**A concrete gotcha**: mutating a mutable object held in StateFlow and re-assigning it won't emit if `equals`/reference is unchanged — and even a `copy()` producing an equal value won't emit. If you *need* a re-emission of an 'equal' value (rare — usually a design smell), StateFlow can't express it; that's a sign the thing is an *event*, not state.",
        ],
      },
      {
        t: "p",
        text: "**The principle**: StateFlow is optimized for 'what is the value now', trading away 'every individual change'. Choose it when you only care about the latest state; choose SharedFlow/Channel when you must observe each discrete emission.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you create a MutableStateFlow and expose it read-only?",
    a: [
      {
        t: "p",
        text: "Create a private `MutableStateFlow(initial)` that the ViewModel writes to, and expose it publicly as a read-only `StateFlow` via `asStateFlow()`. This enforces a single writer (the ViewModel) — the UI can read/collect but can't mutate the state, preserving unidirectional data flow.",
      },
      {
        t: "code",
        title: "Private mutable, public read-only",
        code: `private val _uiState = MutableStateFlow(UiState.Loading)
val uiState: StateFlow<UiState> = _uiState.asStateFlow()

fun load() { _uiState.value = UiState.Content(data) }   // only VM writes`,
      },
      {
        t: "list",
        items: [
          "**Private `MutableStateFlow`** — the writable backing state the VM updates.",
          "**Public `StateFlow` via `asStateFlow()`** — read-only view; callers can't cast back to mutate.",
          "**Single writer** — enforces UDF; UI sends events, VM updates state.",
          "**Same pattern for events** — `MutableSharedFlow` + `asSharedFlow()`.",
        ],
      },
      {
        t: "note",
        text: "private val _state = MutableStateFlow(initial); val state = _state.asStateFlow() — the VM writes, the UI reads (asStateFlow prevents outside mutation). Enforces single-writer UDF. Same for events: MutableSharedFlow + asSharedFlow(). Never expose the Mutable type publicly.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you update a StateFlow safely: value = vs update { }?",
    a: [
      {
        t: "p",
        text: "For a simple set, `_state.value = newState` works. But when the new value *depends on the current one* (e.g. toggling a field), `_state.value = _state.value.copy(...)` can race under concurrent updates (read-then-write). `_state.update { it.copy(...) }` does an atomic compare-and-set loop, making it safe from multiple coroutines.",
      },
      {
        t: "code",
        title: "Atomic update",
        code: `// Simple set:
_state.value = UiState.Loading

// Derive from current — use update (atomic):
_state.update { it.copy(count = it.count + 1) }
// Risky under concurrency: _state.value = _state.value.copy(count = _state.value.count + 1)`,
      },
      {
        t: "list",
        items: [
          "**`value = x`** — fine for a direct set not derived from the current value.",
          "**`update { current -> new }`** — atomic compare-and-set; safe when the new value derives from the old.",
          "**Avoid read-then-write** — `value = value.copy(...)` can lose concurrent updates.",
          "**`getAndUpdate`/`updateAndGet`** — variants returning the old/new value.",
        ],
      },
      {
        t: "note",
        text: "Use value = x for a direct set; use update { it.copy(...) } (atomic compare-and-set) when the new value derives from the current — value = value.copy(...) can race under concurrency (read-then-write loses updates). getAndUpdate/updateAndGet return old/new.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is StateFlow always conflated, and when can it lose intermediate values?",
    a: [
      {
        t: "p",
        text: "StateFlow holds a *single current value* and conflates — it only keeps the latest, and a slow collector may skip intermediate values that were superseded before it collected them. It also skips *equal* consecutive values (`distinctUntilChanged` built in). This makes it perfect for *state* (you only care about the current value) but wrong for *events* (where every occurrence matters).",
      },
      {
        t: "code",
        title: "Conflation drops intermediates",
        code: `// If updates happen faster than collection:
_state.value = 1
_state.value = 2
_state.value = 3
// A slow collector might see only 3 (1 and 2 conflated away)`,
      },
      {
        t: "list",
        items: [
          "**Single latest value** — StateFlow always has a current value; new collectors get it immediately.",
          "**Conflated** — intermediate values can be skipped if the collector is slower than updates.",
          "**Distinct** — equal consecutive values are not re-emitted.",
          "**Implication** — great for UI state (latest wins); use `SharedFlow`/`Channel` for events where you can't drop occurrences.",
        ],
      },
      {
        t: "note",
        text: "StateFlow keeps a single current value and conflates — a slow collector may skip intermediates, and equal consecutive values are dropped (built-in distinctUntilChanged). Perfect for state (only the latest matters), wrong for events (occurrences would be lost) — use SharedFlow/Channel for those.",
      },
    ],
  },
  {
    level: "senior",
    q: "What thread-safety guarantees does StateFlow provide?",
    a: [
      {
        t: "p",
        text: "StateFlow is thread-safe: reading `.value` and setting it (or `update { }`) can happen from any thread without external synchronization. `update { }` performs an atomic compare-and-set. So you can update UI state from background coroutines directly, and collectors on the main thread will observe a consistent latest value.",
      },
      {
        t: "list",
        items: [
          "**Thread-safe reads/writes** — `.value` get/set from any thread is safe.",
          "**Atomic `update`** — compare-and-set avoids lost updates under concurrency.",
          "**No manual locks** — you don't need a `Mutex` around state updates.",
          "**Update from anywhere** — background coroutines can update state; UI collects the latest safely.",
        ],
      },
      {
        t: "note",
        text: "StateFlow is thread-safe — .value get/set and update { } (atomic compare-and-set) work from any thread without external locks. So background coroutines can update UI state directly and main-thread collectors see a consistent latest value. This is a key reason StateFlow is the go-to for VM state.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is tryEmit, and how does it differ from emit for SharedFlow?",
    a: [
      {
        t: "p",
        text: "`emit(value)` is a *suspend* function — if the SharedFlow's buffer is full (and overflow is SUSPEND), it suspends until there's space. `tryEmit(value)` is *non-suspending* — it emits immediately if there's buffer space and returns `true`, or returns `false` without emitting if it can't. Use `tryEmit` from non-suspend contexts (like a synchronous callback), accepting that emission may fail.",
      },
      {
        t: "code",
        title: "emit vs tryEmit",
        code: `private val _events = MutableSharedFlow<Event>(extraBufferCapacity = 1)
suspend fun send(e: Event) { _events.emit(e) }         // suspends if buffer full
fun sendNow(e: Event): Boolean = _events.tryEmit(e)    // non-blocking; false if it couldn't`,
      },
      {
        t: "list",
        items: [
          "**`emit`** — suspend; waits for buffer space (with SUSPEND overflow).",
          "**`tryEmit`** — non-suspend; emits if possible, returns `false` otherwise.",
          "**`tryEmit` needs buffer** — with `extraBufferCapacity` (or DROP overflow), else it can't emit and returns false.",
          "**Use `tryEmit`** — from callbacks/non-suspend code where you can't suspend.",
        ],
      },
      {
        t: "note",
        text: "emit is suspend (waits for buffer space with SUSPEND overflow); tryEmit is non-suspending (emits if there's space, returns true/false). tryEmit needs buffer capacity (extraBufferCapacity or a DROP policy) to succeed. Use tryEmit from non-suspend callbacks, accepting it may return false.",
      },
    ],
  },
  {
    level: "senior",
    q: "What do replay and extraBufferCapacity control in MutableSharedFlow?",
    a: [
      {
        t: "p",
        text: "`replay` is how many past values a *new* collector immediately receives on subscription (a replay cache). `extraBufferCapacity` is additional buffer *beyond* replay for values not yet collected — it lets `tryEmit` succeed and emitters run ahead without suspending. Together with `onBufferOverflow`, they define the SharedFlow's buffering and delivery.",
      },
      {
        t: "code",
        title: "Configuring a SharedFlow",
        code: `MutableSharedFlow<Event>(
    replay = 0,                     // new collectors get no history (events)
    extraBufferCapacity = 1,        // room so tryEmit works without a collector ready
    onBufferOverflow = BufferOverflow.DROP_OLDEST,
)`,
      },
      {
        t: "list",
        items: [
          "**`replay`** — values replayed to new subscribers (e.g. `1` for latest-value caching; `0` for events).",
          "**`extraBufferCapacity`** — buffer beyond replay so emitters don't suspend and `tryEmit` can succeed.",
          "**`onBufferOverflow`** — SUSPEND (default), DROP_OLDEST, or DROP_LATEST when full.",
          "**StateFlow** — is like `SharedFlow(replay = 1)` + conflation + initial value + distinct.",
        ],
      },
      {
        t: "note",
        text: "replay = how many past values a NEW collector gets on subscription (replay cache); extraBufferCapacity = buffer beyond replay so emitters run ahead / tryEmit succeeds; onBufferOverflow = SUSPEND/DROP_OLDEST/DROP_LATEST when full. StateFlow ≈ SharedFlow(replay=1) + conflation + initial value + distinct.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you correctly emit one-off events (navigation, snackbar)?",
    a: [
      {
        t: "p",
        text: "Use a `Channel` exposed as a `Flow` (`receiveAsFlow()`) or a `SharedFlow(replay = 0)` — *not* a StateFlow (its conflation/replay would re-deliver on rotation). The `Channel` guarantees each event is delivered exactly once to a single collector, so navigation/snackbar events don't repeat when the screen recreates.",
      },
      {
        t: "code",
        title: "Channel-based events",
        code: `private val _events = Channel<UiEvent>()
val events = _events.receiveAsFlow()               // exactly-once delivery
fun onSaved() { viewModelScope.launch { _events.send(UiEvent.NavigateBack) } }
// UI collects with repeatOnLifecycle/collectAsStateWithLifecycle`,
      },
      {
        t: "list",
        items: [
          "**`Channel` + `receiveAsFlow()`** — exactly-once, buffered; the safest for single-consumer events.",
          "**`SharedFlow(replay = 0)`** — multicast, but events can drop if no collector; add buffer/`tryEmit` carefully.",
          "**Not StateFlow** — its latest-value semantics re-fire on recreation.",
          "**Collect lifecycle-aware** — so events aren't handled while stopped.",
        ],
      },
      {
        t: "note",
        text: "One-off events: a Channel exposed via receiveAsFlow() (exactly-once, buffered — safest for single-consumer) or SharedFlow(replay=0) (multicast, but can drop with no collector). NOT StateFlow (conflation/replay re-fires on rotation). Collect lifecycle-aware so events aren't handled while stopped.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a hot flow, and how does it change subscription semantics?",
    a: [
      {
        t: "p",
        text: "A *hot* flow (StateFlow, SharedFlow) exists and emits *independently of collectors* — it's always 'on', and collectors observe whatever is happening when they subscribe (they don't restart the producer). A *cold* flow starts fresh per collector. So hot flows are shared broadcast sources; late subscribers may miss earlier emissions (except replay).",
      },
      {
        t: "list",
        items: [
          "**Hot** — produces regardless of collectors; multiple collectors share one stream; late subscribers miss past emissions (beyond replay).",
          "**Cold** — starts per collector; each gets the full sequence from the beginning.",
          "**StateFlow/SharedFlow** — hot; `flow { }` is cold.",
          "**Implication** — hot flows suit shared state/events; you use `shareIn`/`stateIn` to make a cold flow hot.",
        ],
      },
      {
        t: "note",
        text: "Hot flows (StateFlow/SharedFlow) emit independently of collectors — always on, shared among collectors, late subscribers miss past emissions (except replay). Cold flows (flow{}) restart per collector with the full sequence. Use shareIn/stateIn to make a cold flow hot for sharing.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you convert a cold flow into a StateFlow?",
    a: [
      {
        t: "p",
        text: "Use `stateIn(scope, started, initialValue)` — it collects the cold flow once in the given scope and exposes the latest value as a `StateFlow`. This is the standard way to turn a repository's cold flow (Room, network) into observable UI state, sharing one upstream collection among all UI collectors.",
      },
      {
        t: "code",
        title: "stateIn",
        code: `val uiState: StateFlow<UiState> = repository.observe()
    .map { UiState.Content(it) }
    .stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = UiState.Loading,
    )`,
      },
      {
        t: "list",
        items: [
          "**`stateIn(scope, started, initial)`** — hot `StateFlow` backed by the cold flow.",
          "**`WhileSubscribed(5000)`** — upstream active only while collected (+5s across config change).",
          "**Initial value required** — StateFlow always has a current value (e.g. `Loading`).",
          "**Shares upstream** — one collection feeds all collectors (no duplicate work).",
        ],
      },
      {
        t: "note",
        text: "stateIn(scope, started, initial) collects a cold flow once and exposes the latest as a StateFlow — the standard way to turn a repository flow (Room/network) into UI state. WhileSubscribed(5000) keeps upstream active only while observed (+5s for config change); an initial value is required.",
      },
    ],
  },
  {
    level: "senior",
    q: "How is StateFlow different from a SharedFlow with replay = 1?",
    a: [
      {
        t: "p",
        text: "They're close but not identical. `StateFlow` is essentially a `SharedFlow(replay = 1)` with three extras: it *requires an initial value* (always has a current value via `.value`), it *conflates* (only keeps the latest), and it *skips equal consecutive values* (`distinctUntilChanged` built in). A `SharedFlow(replay = 1)` has none of those guarantees by default.",
      },
      {
        t: "table",
        headers: ["", "StateFlow", "SharedFlow(replay=1)"],
        rows: [
          ["Initial value", "required", "none"],
          ["`.value` accessor", "yes", "no"],
          ["Conflation", "always", "no (buffers per config)"],
          ["Distinct (skip equal)", "yes", "no"],
        ],
      },
      {
        t: "list",
        items: [
          "**StateFlow** — value-holder semantics: current value, conflated, distinct; for state.",
          "**SharedFlow(replay=1)** — replays the last value to new collectors but re-emits duplicates and buffers per config; more flexible for events with recent history.",
          "**Choose** — StateFlow for state, SharedFlow for events (with tuned replay/buffer).",
        ],
      },
      {
        t: "note",
        text: "StateFlow ≈ SharedFlow(replay=1) PLUS: required initial value + .value accessor, always conflated, and distinct (skips equal consecutive). SharedFlow(replay=1) replays the last value but re-emits duplicates and has no .value/initial. StateFlow for state; SharedFlow for events with recent history.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you model a whole screen's state with a single StateFlow?",
    a: [
      {
        t: "p",
        text: "Define one immutable `UiState` data class (or sealed type) holding everything the screen needs, back it with a `MutableStateFlow`, and update it via `update { it.copy(...) }`. The UI collects this single source of truth and renders declaratively — one state in, one screen out, matching `UI = f(state)`.",
      },
      {
        t: "code",
        title: "One UiState StateFlow",
        code: `data class UiState(
    val isLoading: Boolean = false,
    val items: List<Item> = emptyList(),
    val error: String? = null,
)
private val _state = MutableStateFlow(UiState())
val state = _state.asStateFlow()

fun refresh() = viewModelScope.launch {
    _state.update { it.copy(isLoading = true, error = null) }
    _state.update { runCatching { repo.load() }
        .fold({ it2 -> UiState(items = it2) }, { UiState(error = it.message) }) }
}`,
      },
      {
        t: "list",
        items: [
          "**Single immutable `UiState`** — all screen data in one class.",
          "**`MutableStateFlow` + `update`** — atomic, immutable updates.",
          "**One source of truth** — the UI collects one flow.",
          "**Declarative UI** — render whatever state is emitted.",
        ],
      },
      {
        t: "note",
        text: "One immutable UiState data class (all screen data) backed by MutableStateFlow, updated via update { it.copy(...) }, exposed read-only. The UI collects this single source of truth and renders declaratively (UI = f(state)). Atomic immutable updates keep it race-free and predictable.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you combine multiple StateFlows into one derived StateFlow?",
    a: [
      {
        t: "p",
        text: "Use `combine` on the source StateFlows, then `stateIn` the result to get a derived `StateFlow`. `combine` emits whenever any source changes, using the latest of each; `stateIn` gives it a current value and shares one computation. This derives combined UI state reactively from independent state sources.",
      },
      {
        t: "code",
        title: "Derived StateFlow",
        code: `val screenState: StateFlow<ScreenState> = combine(
    userFlow, cartFlow, isOnlineFlow,
) { user, cart, online -> ScreenState(user, cart, online) }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), ScreenState.Empty)`,
      },
      {
        t: "list",
        items: [
          "**`combine`** — recompute the derived value on any source change (latest-of-each).",
          "**`stateIn`** — turn the combined cold flow back into a hot `StateFlow` with an initial value.",
          "**Reactive** — the derived state updates automatically when any input does.",
          "**Alternative** — a `MutableStateFlow` you update manually, but `combine` is cleaner for derivations.",
        ],
      },
      {
        t: "note",
        text: "combine the source StateFlows (latest-of-each on any change), then stateIn to get a derived StateFlow with an initial value and shared computation. It updates automatically when any input changes — cleaner than manually syncing a MutableStateFlow. Standard for building combined UI state.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you collect a StateFlow in the UI (Compose and Views)?",
    a: [
      {
        t: "p",
        text: "In Compose, use `collectAsStateWithLifecycle()` to get a `State` the UI reads. In Views, collect inside `repeatOnLifecycle(STARTED)` within `lifecycleScope`. Both are lifecycle-aware — they stop collecting when the UI is backgrounded and resume on return, which pairs with `stateIn(WhileSubscribed)` upstream.",
      },
      {
        t: "code",
        title: "Collecting StateFlow",
        code: `// Compose
val state by viewModel.uiState.collectAsStateWithLifecycle()
// Views
lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.uiState.collect { binding.render(it) }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Compose** — `collectAsStateWithLifecycle()` (preferred over `collectAsState`).",
          "**Views** — `repeatOnLifecycle(STARTED)` collection.",
          "**Lifecycle-aware** — stops when backgrounded; resumes on foreground.",
          "**Immediate value** — a new collector gets the current StateFlow value right away.",
        ],
      },
      {
        t: "note",
        text: "Compose: collectAsStateWithLifecycle(). Views: repeatOnLifecycle(STARTED) in lifecycleScope. Both are lifecycle-aware (stop when backgrounded, resume on return) and pair with stateIn(WhileSubscribed). New collectors immediately get StateFlow's current value.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does a slow collector interact with StateFlow versus SharedFlow?",
    a: [
      {
        t: "p",
        text: "With a `StateFlow`, a slow collector *conflates* — it may skip intermediate values and just see the latest, because StateFlow only holds the current value. With a `SharedFlow`, behavior depends on `onBufferOverflow`: SUSPEND makes fast emitters wait for the slow collector (backpressure), while DROP_OLDEST/DROP_LATEST drop values. So StateFlow is inherently lossy for intermediates; SharedFlow is configurable.",
      },
      {
        t: "list",
        items: [
          "**StateFlow** — conflated; slow collector sees the latest, intermediates dropped.",
          "**SharedFlow + SUSPEND** — emitters suspend until the collector catches up (no loss, backpressure).",
          "**SharedFlow + DROP_*** — values dropped to keep emitters unblocked.",
          "**Implication** — for state, conflation is fine; for events you must choose overflow behavior deliberately.",
        ],
      },
      {
        t: "note",
        text: "StateFlow conflates — a slow collector sees only the latest (intermediates lost). SharedFlow depends on onBufferOverflow: SUSPEND applies backpressure (emitters wait, no loss), DROP_OLDEST/LATEST drop to keep emitters unblocked. State → conflation is fine; events → choose overflow deliberately.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why shouldn't you expose MutableStateFlow or MutableSharedFlow publicly?",
    a: [
      {
        t: "p",
        text: "Exposing the mutable type lets any collector *write* to your state/events, breaking unidirectional data flow and encapsulation — the UI could mutate the ViewModel's state directly, causing hard-to-trace bugs. Expose the read-only `StateFlow`/`SharedFlow` (via `asStateFlow()`/`asSharedFlow()`) so only the owner mutates.",
      },
      {
        t: "list",
        items: [
          "**Encapsulation** — only the ViewModel should change its state; the UI reads and sends events.",
          "**UDF** — a public mutable flow invites the UI to write state, breaking the one-way loop.",
          "**`asStateFlow()`/`asSharedFlow()`** — return a read-only view that can't be cast back to mutable.",
          "**Testability/clarity** — a single writer makes state changes traceable.",
        ],
      },
      {
        t: "note",
        text: "A public MutableStateFlow/MutableSharedFlow lets collectors write your state/events, breaking encapsulation and UDF (the UI could mutate VM state). Expose read-only via asStateFlow()/asSharedFlow() so only the owner writes — keeping the one-way data loop and making changes traceable.",
      },
    ],
  },
  {
    level: "senior",
    q: "Is StateFlow lossy, and what does that mean for what you can build with it?",
    a: [
      {
        t: "p",
        text: "Yes, for *intermediate* values — StateFlow conflates, so rapid successive updates may not all be observed; only the latest is guaranteed. This is exactly right for *state* (you render the current value) but means you can't use StateFlow for anything where every value must be processed (counters incremented by observing each change, event streams, analytics per-change).",
      },
      {
        t: "list",
        items: [
          "**Lossy for intermediates** — fast updates can be conflated away.",
          "**Fine for state** — the UI only needs the latest value.",
          "**Not for 'process every value'** — use `SharedFlow`/`Channel` where each occurrence matters.",
          "**Not for events** — a repeated identical event wouldn't even emit (distinct), and rotation could re-deliver.",
        ],
      },
      {
        t: "note",
        text: "StateFlow is lossy for intermediates (conflated — only the latest is guaranteed) and skips equal values (distinct). Perfect for state (render the latest), but don't use it where every value must be processed or for events — use SharedFlow/Channel there.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a StateFlow's emissions?",
    a: [
      {
        t: "p",
        text: "Two common approaches: read `.value` after driving the ViewModel (simple for the final state), or collect emissions into a list within `runTest` (to assert the *sequence* Loading → Content). The Turbine library makes sequence assertions clean. Because a StateFlow needs an active collector to run `WhileSubscribed` upstream, tests often collect in a background job or use `.value` with `advanceUntilIdle`.",
      },
      {
        t: "code",
        title: "Testing emissions",
        code: `@Test fun emitsLoadingThenContent() = runTest {
    val vm = MyViewModel(fakeRepo)
    vm.uiState.test {                    // Turbine
        assertEquals(UiState.Loading, awaitItem())
        vm.load()
        assertEquals(UiState.Content(data), awaitItem())
        cancelAndIgnoreRemainingEvents()
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`.value`** — assert the current/final state after `advanceUntilIdle()`.",
          "**Turbine `test { }`** — assert the sequence of emissions cleanly.",
          "**Collect in a background job** — for `WhileSubscribed` flows, an active collector starts the upstream.",
          "**Test dispatcher + `runTest`** — deterministic scheduling.",
        ],
      },
      {
        t: "note",
        text: "Test StateFlow by reading .value after advanceUntilIdle (final state) or collecting the sequence with Turbine's test { awaitItem() } (Loading → Content). WhileSubscribed upstream needs an active collector to start, so collect in a background job. Use runTest + a test dispatcher for determinism.",
      },
    ],
  },
  {
    level: "junior",
    q: "Does a new collector of a StateFlow get the current value immediately?",
    a: [
      {
        t: "p",
        text: "Yes — because StateFlow always holds a current value (like `replay = 1`), any new collector immediately receives the latest value on subscription, then subsequent updates. This is why StateFlow is ideal for UI state: a screen that starts collecting instantly renders the current state without waiting for the next emission.",
      },
      {
        t: "list",
        items: [
          "**Immediate current value** — new collectors get `.value` right away.",
          "**Then updates** — followed by future changes.",
          "**Contrast `SharedFlow(replay=0)`** — a new collector gets *no* history, only future emissions.",
          "**Good for UI** — the screen renders immediately on subscription.",
        ],
      },
      {
        t: "note",
        text: "Yes — StateFlow always has a current value (like replay=1), so a new collector immediately gets the latest, then subsequent updates. That's why it's ideal for UI state (instant render on subscription). SharedFlow(replay=0) gives new collectors no history — only future emissions.",
      },
    ],
  },
  {
    level: "senior",
    q: "When would you choose StateFlow over Compose's mutableStateOf for ViewModel state?",
    a: [
      {
        t: "p",
        text: "Prefer `StateFlow` when you want the ViewModel to be *Compose-independent* — testable without Compose, usable in KMP, and composable with Flow operators (`combine`, `debounce`). `mutableStateOf` in the ViewModel couples it to the Compose runtime and can't be transformed with Flow operators. For most apps, `StateFlow` is the default; `mutableStateOf` in the VM suits small Compose-only apps.",
      },
      {
        t: "list",
        items: [
          "**`StateFlow`** — Compose-agnostic (unit-testable, KMP), works with Flow operators, lifecycle-aware collection.",
          "**`mutableStateOf` in VM** — simpler (no `collectAsState`), but ties the VM to Compose and lacks Flow operators.",
          "**Consistency** — pick one per codebase.",
          "**UI reads either** — `collectAsStateWithLifecycle()` for StateFlow; direct read for `mutableStateOf`.",
        ],
      },
      {
        t: "note",
        text: "Choose StateFlow to keep the ViewModel Compose-independent (testable, KMP) and composable with Flow operators (combine/debounce); collect with collectAsStateWithLifecycle. mutableStateOf in the VM is simpler (no collect) but couples to Compose and lacks operators. StateFlow is the default; pick one per codebase.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the onBufferOverflow strategies for SharedFlow, and when do you use each?",
    a: [
      {
        t: "p",
        text: "`onBufferOverflow` decides what happens when a `MutableSharedFlow`'s buffer is full and a new value is emitted: `SUSPEND` (default) makes the emitter wait (backpressure), `DROP_OLDEST` discards the oldest buffered value to make room, and `DROP_LATEST` discards the new value. The choice trades backpressure against data loss.",
      },
      {
        t: "table",
        headers: ["Strategy", "On full buffer", "Use"],
        rows: [
          ["SUSPEND", "emitter waits", "no loss; emitter can suspend"],
          ["DROP_OLDEST", "drop oldest buffered", "keep newest (latest-value feeds)"],
          ["DROP_LATEST", "drop the new value", "keep the earliest until consumed"],
        ],
      },
      {
        t: "list",
        items: [
          "**SUSPEND** — backpressure; use when the emitter is a coroutine that can wait and no value should be lost.",
          "**DROP_OLDEST** — keep the freshest data; good when only recent values matter (sensor/latest-state feeds) and with `tryEmit`.",
          "**DROP_LATEST** — keep already-buffered values, drop new ones under pressure.",
          "**With `tryEmit`** — you need a non-SUSPEND policy (or spare buffer) for `tryEmit` to succeed.",
        ],
      },
      {
        t: "note",
        text: "onBufferOverflow on a full buffer: SUSPEND (default — emitter waits, no loss), DROP_OLDEST (discard oldest — keep freshest, good with tryEmit/sensors), DROP_LATEST (discard the new value). tryEmit needs a non-SUSPEND policy or spare buffer to succeed. Trade backpressure vs loss.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does StateFlow compare to LiveData, and why is it often preferred?",
    a: [
      {
        t: "p",
        text: "Both are observable state holders, but `StateFlow` is a Kotlin/coroutines-native primitive: it's not Android-tied (usable in pure Kotlin/KMP and unit-testable without Robolectric), composes with Flow operators, and always has a value. `LiveData` is lifecycle-aware out of the box but Android-only and lacks operators. StateFlow + `collectAsStateWithLifecycle`/`repeatOnLifecycle` matches LiveData's lifecycle-awareness while being more powerful.",
      },
      {
        t: "table",
        headers: ["", "StateFlow", "LiveData"],
        rows: [
          ["Platform", "pure Kotlin (KMP)", "Android-only"],
          ["Operators", "full Flow operators", "limited (map/switchMap)"],
          ["Lifecycle", "via collectAsStateWithLifecycle/repeatOnLifecycle", "built-in"],
          ["Initial value", "required", "optional (nullable)"],
          ["Testing", "plain JVM", "needs InstantTaskExecutorRule"],
        ],
      },
      {
        t: "list",
        items: [
          "**StateFlow** — coroutines-native, KMP, operator-rich, always has a value; needs lifecycle-aware collection.",
          "**LiveData** — Android-only, lifecycle-aware by default, limited operators, nullable.",
          "**Migration** — new code favors StateFlow; LiveData remains fine in existing Android-only apps.",
        ],
      },
      {
        t: "note",
        text: "StateFlow is coroutines-native (pure Kotlin/KMP, JVM-testable, full Flow operators, always has a value) but needs lifecycle-aware collection (collectAsStateWithLifecycle/repeatOnLifecycle). LiveData is Android-only, lifecycle-aware by default, with limited operators. New code prefers StateFlow; LiveData is fine in existing Android apps.",
      },
    ],
  },
  {
    level: "senior",
    q: "How can a SharedFlow react to whether it has subscribers (subscriptionCount)?",
    a: [
      {
        t: "p",
        text: "`MutableSharedFlow.subscriptionCount` is a `StateFlow<Int>` of the current number of active collectors. You can observe it to start/stop upstream work only when someone is listening — this is exactly the mechanism `SharingStarted.WhileSubscribed` uses internally, and you can use it directly for custom hot sources (e.g. connect a WebSocket only while subscribed).",
      },
      {
        t: "code",
        title: "React to subscribers",
        code: `private val _events = MutableSharedFlow<Event>()
val events = _events.asSharedFlow()

init {
    scope.launch {
        _events.subscriptionCount
            .map { it > 0 }
            .distinctUntilChanged()
            .collect { hasSubscribers ->
                if (hasSubscribers) connectSocket() else disconnectSocket()
            }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`subscriptionCount`** — a `StateFlow<Int>` of active collectors.",
          "**Start/stop upstream** — connect/disconnect a resource based on `> 0`.",
          "**`WhileSubscribed` uses it** — the standard sharing strategy is built on this signal (plus a timeout).",
          "**Custom hot sources** — manage expensive connections (sockets, sensors) tied to real demand.",
        ],
      },
      {
        t: "note",
        text: "MutableSharedFlow.subscriptionCount is a StateFlow<Int> of active collectors — observe it (map { it > 0 }.distinctUntilChanged()) to start/stop upstream work only when someone's listening (connect a socket only while subscribed). It's the mechanism behind SharingStarted.WhileSubscribed; use it directly for custom hot sources.",
      },
    ],
  },
];

export default qa;
