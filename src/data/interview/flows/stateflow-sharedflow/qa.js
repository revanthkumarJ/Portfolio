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
];

export default qa;
