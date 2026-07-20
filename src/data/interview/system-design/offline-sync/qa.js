// Design Offline-First Sync — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What's the difference between offline reads and offline writes, and why are writes harder?",
    a: [
      {
        t: "p",
        text: "**Offline *reads* mean showing data when there's no network — easy: serve it from a local cache/database. Offline *writes* mean letting the user *change* data offline and then *synchronizing* those changes with the server when connectivity returns — much harder, because it's a distributed-systems problem involving reliable delivery and conflict resolution.**",
      },
      {
        t: "list",
        items: [
          "**Offline reads (easy)**: use a local database as the single source of truth. The UI always reads from it, so data displays with or without a network. The network just *updates* the local DB. This is the standard offline-first read pattern.",
          "**Offline writes (hard)**: the user edits something offline. That change must (1) persist locally and show in the UI immediately, (2) *reliably reach the server* when back online — surviving app kills, retrying on failure, and (3) be *reconciled* if the same data changed on the server meanwhile (a conflict).",
        ],
      },
      {
        t: "p",
        text: "Writes are harder because they turn the app into a *distributed system* with two (or more) copies of data that can *diverge*. Reads just display a cached copy — nothing diverges. But an offline write creates a local version that must eventually merge with the server's version, and if both changed (e.g. edited on two devices), you have a genuine conflict with no obvious resolution. Plus, the sync must be *reliable* — a change made offline can't be lost just because the app was killed before it synced. So offline writes require: local-first optimistic writes (instant UI), a durable sync queue (the outbox pattern, so changes survive), background sync via WorkManager (guaranteed, network-aware), idempotency (safe retries), and a conflict-resolution policy. This is why 'design offline-first sync' is a rich question — the write/sync half is where all the interesting distributed-systems challenges live.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is optimistic (local-first) writing?",
    a: [
      {
        t: "p",
        text: "**Optimistic (local-first) writing means applying a change to the local database *immediately* — so the UI updates instantly and the user isn't blocked — and syncing it to the server *later* in the background, rather than waiting for the server to confirm before showing the change.** You 'optimistically' assume the write will succeed and reflect it right away.",
      },
      {
        t: "list",
        items: [
          "**The flow**: the user makes a change → write it to the local DB immediately and mark it as `PENDING` sync → the UI (observing the DB) updates instantly → a background sync later pushes it to the server.",
          "**Why**: it makes the app *responsive* and *offline-capable*. The user's action takes effect immediately regardless of network — no spinner waiting for the server, and it works with no connection at all. The network round-trip happens invisibly in the background.",
          "**The trade-off**: since you show the change before the server confirms it, you must handle the case where the server later *rejects* it (validation failure, a lost conflict) — by rolling back the local change or showing an error. This is 'optimistic UI with rollback'.",
        ],
      },
      {
        t: "p",
        text: "The alternative — *pessimistic* writing (wait for the server to confirm before updating the UI) — is simpler to reason about but gives a worse experience: the user waits on every action, and it doesn't work offline at all. Optimistic writing is essential for offline-first because the whole point is that the app works without waiting on the network. The pattern pairs with the single-source-of-truth design: writes go into the local DB (which the UI observes), marked pending, and a background sync engine (WorkManager) reliably pushes them to the server, handling retries and conflicts. So optimistic local writes give the *responsiveness and offline capability*, while the background sync gives the *eventual consistency* with the server.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why use WorkManager for syncing offline changes?",
    a: [
      {
        t: "p",
        text: "**Because syncing offline changes must be *guaranteed* (it can't be lost if the app is killed), *network-aware* (it should run when connectivity returns), and *retried* on failure — which is exactly what WorkManager provides. A plain coroutine can't guarantee the sync happens, because it dies with the process.**",
      },
      {
        t: "list",
        items: [
          "**Guaranteed execution** — WorkManager persists the work request in its database, so the sync survives the app being killed and even a device reboot. An offline change queued for sync will *eventually* sync, no matter what happens to the app. A coroutine in `viewModelScope` would be cancelled when the screen/app goes away, losing the sync.",
          "**Network-aware** — you add a network *constraint*, so WorkManager automatically runs the sync *when connectivity returns* — you don't have to poll for connectivity or manually retry when the network comes back.",
          "**Automatic retry with backoff** — if a sync attempt fails (transient server error, connection drop), WorkManager retries with exponential backoff, so a temporary failure doesn't lose the change.",
        ],
      },
      {
        t: "p",
        text: "The core requirement offline sync has is *reliability* — a change the user made offline must not be silently lost, and it must sync as soon as it can. WorkManager is purpose-built for exactly this: *deferrable, guaranteed, constraint-aware* background work that survives process death and reboots. This is why it's the right tool over a coroutine (which is tied to a lifecycle and dies with it) or a background service (killed by Android 8+ restrictions, gone on reboot). The design pairs WorkManager with the outbox pattern — durable operations queued in the DB — so the worker reads pending operations and pushes them, WorkManager guaranteeing the worker eventually runs. Together they ensure *eventual delivery*: no offline change is lost, and sync happens automatically when the network is available.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle conflict resolution in a sync system?",
    a: [
      {
        t: "p",
        text: "**A conflict occurs when the same data changed in two places (e.g. edited offline on one device while also edited on the server/another device), producing two divergent versions that must be reconciled. There's no universal solution — you choose a resolution *strategy* based on the *data's semantics*: last-write-wins, field-level merge, CRDTs, or manual resolution. Stating that the strategy depends on the data (not one-size-fits-all) is the key insight.**",
      },
      {
        t: "list",
        items: [
          "**First — detecting the conflict**: each record carries a *version* (or timestamp). The client sends its *base version* with a push; the server accepts only if that matches the current server version (optimistic concurrency) — a mismatch means the server changed since the client last synced, i.e. a conflict. Alternatively, detect on pull (local `PENDING` change + a changed remote version).",
          "**Last-write-wins (LWW)** — the simplest: whichever edit has the newer timestamp wins, discarding the other. Fine for *single-user, low-conflict* data (a personal note usually edited on one device at a time), but it *silently loses* the losing edit — unacceptable for important data where losing a change matters.",
          "**Server-wins / client-wins** — one side always wins. Simple and predictable, but arbitrarily discards the other side's changes.",
          "**Field-level merge** — if the two versions changed *different fields*, merge both changes (there's no real conflict — one changed the title, the other the body). Only a genuine *same-field* conflict needs a resolution decision. Preserves far more data than LWW; more complex to implement (track per-field changes).",
          "**CRDTs / Operational Transformation** — conflict-free replicated data types (or OT) are data structures/algorithms that *automatically merge* concurrent edits with *no data loss* — the foundation of real-time collaborative editing (Google Docs, Figma). Very powerful (concurrent edits just merge correctly) but complex; appropriate for genuine multi-user real-time collaboration.",
          "**Manual / user-resolved** — present both conflicting versions and let the *user* choose or merge. No data loss, but it interrupts the user — appropriate for high-value data where automatic resolution risks losing something important (like a document the user cares deeply about).",
        ],
      },
      {
        t: "list",
        items: [
          "**Choosing by data semantics**: LWW for simple single-user data where conflicts are rare and occasional loss is tolerable; field-merge for structured records with independent fields; CRDTs for real-time collaborative editing; manual for critical data where no automatic policy is safe. The *nature and value of the data* dictates the choice — a to-do checkbox can use LWW, a collaborative document needs CRDTs, a legal contract might need manual resolution.",
          "**Practical considerations**: mark conflicted records with a `CONFLICT` status so they're surfaced (for manual resolution) or handled by the policy; log conflicts for debugging; and design to *minimize* conflicts where possible (fine-grained records reduce the chance two edits collide; frequent syncing reduces the divergence window).",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: conflict resolution is the genuinely *hard* part of offline sync because it's a *distributed-systems* problem — two replicas of data diverged, and merging them is fundamentally ambiguous when both changed. The crucial insight (and the senior signal) is that *there is no universal right answer — the strategy must match the data's semantics and value*: last-write-wins for simple single-user data (accepting possible loss for simplicity), field-level merge for independent-field records (preserving more), CRDTs for real-time collaboration (automatic, lossless, complex), and manual resolution for critical data (no loss, but user-interrupting). Detection relies on *versioning* (optimistic concurrency — reject pushes with a stale base version). Around the core, you minimize conflicts (fine-grained records, frequent sync), surface unresolvable ones (CONFLICT status), and handle the practical edges (deletion/tombstones, ordering). The immature answer is 'just use last-write-wins' as if it's universal; the mature answer *analyzes the data* — 'for a personal note, LWW is fine and simple; but if this were collaborative editing, LWW would lose edits and I'd need CRDTs; and for critical data I'd surface it to the user' — demonstrating that you understand conflict resolution as a *contextual trade-off between simplicity and data preservation* rooted in what the data *is*. Demonstrating the strategies, the detection-via-versioning, the choose-by-data-semantics principle, and the conflict-minimization practices is the comprehensive senior answer to the hardest part of offline sync.",
      },
    ],
  },
  {
    level: "senior",
    q: "Design the full architecture of an offline-first note-taking app that syncs across devices.",
    a: [
      {
        t: "p",
        text: "**I'd build it on a single-source-of-truth local database with optimistic local-first writes, a durable outbox-based sync engine driven by WorkManager, versioning for conflict detection with a data-appropriate resolution policy, and delta sync for efficiency — plus a push/WebSocket layer for near-real-time convergence across devices. Let me lay out the layers and the sync flow.**",
      },
      {
        t: "list",
        items: [
          "**Local database as SSOT (Room)**: notes stored locally with sync metadata per record — `id`, `content`, `updatedAt`, `version`, `syncStatus` (SYNCED/PENDING/CONFLICT), and a `deleted` soft-delete flag. The UI *always* observes the DB (via Flow), so notes display instantly and fully offline. This is the read foundation.",
          "**Optimistic local-first writes**: creating/editing/deleting a note writes to the DB *immediately* (marked PENDING), so the UI updates instantly and the user never waits on the network. Deletes are *soft* (set `deleted = true`, PENDING) so the deletion syncs like any change (a hard local delete could resurrect on the next pull).",
          "**Outbox + WorkManager sync engine**: pending changes form a durable queue (the PENDING records, or a separate outbox table preserving operation order). A WorkManager worker with a *network constraint* runs the sync — guaranteed (survives app kill/reboot), automatic on reconnect, retried with backoff. Each operation carries a *client-generated id* for idempotency (safe retries — the server dedupes).",
          "**Sync flow — push then pull**: (1) *Push* PENDING changes to the server, sending each note's *base version*; the server accepts (bumping the version, returning it → mark SYNCED) or *rejects with a conflict* if its version changed. (2) *Pull* remote changes via *delta sync* — request changes since the last sync token/timestamp, apply them to the local DB (which the UI observes). Delta sync (not full fetch) keeps it efficient for large note sets.",
          "**Conflict resolution**: on a rejected push, detect the conflict via version mismatch. For a *personal* note-taking app (mostly single-user, edited on one device at a time), *last-write-wins by `updatedAt`* is a reasonable default (simple, rare conflicts) — but I'd note that if notes could be *collaboratively* edited, LWW would lose edits and I'd move to field/text-level merge or CRDTs. For safety on important notes, I could mark genuine conflicts `CONFLICT` and surface both versions for the user to resolve, avoiding silent loss.",
          "**Optimistic UI + rollback**: since changes show before server confirmation, handle rejections (validation, lost conflict) by rolling back or flagging the note, keeping the user informed.",
          "**Near-real-time cross-device convergence**: add an FCM push (or WebSocket) so that when a note changes on one device, the server *notifies* the user's other devices to sync promptly — rather than only syncing on app open. This combines offline-first *durability* with near-real-time *freshness* across devices.",
        ],
      },
      {
        t: "list",
        items: [
          "**Edge cases I'd address**: *deletion* (soft deletes/tombstones to prevent resurrection); *operation ordering* (create-then-edit must sync in order — the outbox preserves it); *idempotency* (client ids so retries don't duplicate); *conflict minimization* (fine-grained notes, frequent sync to shrink the divergence window); *first sync / large data* (paginate the initial pull); and *auth* (the sync worker needs a valid token — refresh if expired).",
          "**Trade-offs to state**: LWW (simple, possible loss) vs merge/manual (safer, complex) — chosen for the *personal-notes* semantics but flagged as data-dependent; delta vs full sync (efficiency vs simplicity — delta for scale); soft vs hard deletes (correctness vs storage); and push/WebSocket for freshness (complexity + battery vs faster convergence — worth it for multi-device).",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the design assembles the offline-first toolkit into a coherent whole — *SSOT local DB* (offline reads + the UI's data source), *optimistic local-first writes* (responsive, offline-capable, with rollback), a *durable outbox + WorkManager sync engine* (guaranteed eventual delivery surviving app kills, running on reconnect, retrying, idempotent), *versioning-based conflict detection* with a *data-appropriate resolution policy* (LWW for personal notes, but explicitly flagged as depending on whether editing is collaborative), *delta sync* (efficiency at scale), *soft deletes and operation ordering* (correctness edges), and an optional *push/WebSocket* layer (near-real-time cross-device freshness). The unifying architecture is that the *local DB is authoritative and the UI reads it*, while a *reliable background sync engine* reconciles it with the server — decoupling the user's experience (instant, offline) from the network reality (eventual, reconciled). The senior signals are: recognizing offline *writes* as a distributed-systems problem (not just caching), choosing conflict resolution *by data semantics* (and saying so — LWW here but CRDTs if collaborative), handling the *failure/edge cases* (kill-survival, deletes, ordering, idempotency, rollback) rather than just the happy path, and stating the *trade-offs* explicitly. This demonstrates the ability to design a genuinely robust offline-first system — combining the SSOT/caching, WorkManager, and conflict-resolution concepts into a real, failure-aware architecture — which is exactly what this rich system-design question tests.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the single-source-of-truth pattern in offline-first design?",
    a: [
      {
        t: "p",
        text: "The *local database* (Room/SQLDelight) is the *single source of truth* — the UI *always reads from it* (as a Flow), never directly from the network. Network responses are *written into the DB*, which then emits updated data to the UI. This decouples the UI from network availability (works offline), gives a *consistent* reactive data flow, and means 'syncing' is just 'keep the DB updated'. Writes go to the DB (optimistically) and are synced out. The mantra: *UI observes the DB; the network feeds the DB*. This pattern underpins every robust offline-first app — state it clearly.",
      },
      {
        t: "list",
        items: [
          "**Local DB** — the single source of truth.",
          "**UI reads DB** — as a Flow; never network directly.",
          "**Network** — writes into the DB; DB emits to UI.",
          "**Offline-capable** — reactive, consistent flow.",
        ],
      },
      {
        t: "note",
        text: "Single source of truth: the local DB (Room/SQLDelight) — the UI always reads it (as a Flow), never the network directly; network responses are written into the DB which emits to the UI. Decouples UI from network (works offline), gives consistent reactive flow; syncing = keeping the DB updated; writes go to the DB optimistically then sync out. UI observes the DB; the network feeds the DB.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the outbox pattern for offline writes?",
    a: [
      {
        t: "p",
        text: "The *outbox* (pending-operations queue) is how you make writes reliable offline: when the user makes a change, you *apply it locally* (optimistic) *and* record a *pending operation* (create/update/delete + payload) in an outbox table. A *sync worker* (WorkManager) later reads the outbox and *sends each operation* to the server, *removing* it on success or *retrying* on failure. This guarantees writes *survive app restart and offline periods* and are *eventually delivered* in order. Mark each operation with status/retry-count and *idempotency keys* so retries don't duplicate. The outbox is the backbone of reliable offline writes.",
      },
      {
        t: "list",
        items: [
          "**Outbox** — pending operations queue (create/update/delete).",
          "**Apply local + enqueue** — optimistic + durable.",
          "**Sync worker** — sends each, removes on success, retries on fail.",
          "**Idempotency keys** — no duplicates on retry.",
        ],
      },
      {
        t: "note",
        text: "The outbox pattern: on a write, apply locally (optimistic) AND record a pending operation (create/update/delete + payload) in an outbox table. A sync worker (WorkManager) sends each to the server, removing on success / retrying on failure. Writes survive restart/offline and are eventually delivered in order; use status/retry-count + idempotency keys to avoid duplicates. The backbone of reliable offline writes.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why are offline writes harder than offline reads?",
    a: [
      {
        t: "p",
        text: "Offline *reads* are easy: serve cached data — worst case it's stale. Offline *writes* are hard because they must be *reconciled with a shared server state* that may have changed: you get *conflicts* (someone else edited the same data), *ordering* concerns (operations must apply in the right sequence), *duplication* risk (retries), *causal dependencies* (create must precede update), and *eventual consistency* (the local optimistic state may diverge until sync). Reads have one direction (server→client); writes are bidirectional with contention. So writes need an outbox, conflict resolution, idempotency, and careful state management — reads just need a cache.",
      },
      {
        t: "list",
        items: [
          "**Reads** — serve cache; worst case stale.",
          "**Writes** — reconcile with changing shared state.",
          "**Hard parts** — conflicts, ordering, dedup, dependencies.",
          "**Writes need** — outbox, conflict resolution, idempotency.",
        ],
      },
      {
        t: "note",
        text: "Offline reads are easy (serve cache — worst case stale). Writes are hard: they reconcile with a shared server state that may have changed — conflicts (concurrent edits), ordering, duplication (retries), causal dependencies (create before update), eventual consistency (local optimistic state diverges). Reads are one-directional; writes bidirectional with contention. Writes need an outbox, conflict resolution, idempotency; reads just need a cache.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is optimistic UI, and how does it apply to sync?",
    a: [
      {
        t: "p",
        text: "*Optimistic UI* applies a change *locally and immediately* (assuming it'll succeed), so the app feels instant, then syncs to the server in the background — *reverting* if it ultimately fails. In an offline-first app, every write is optimistic: update the local DB (UI reflects it at once), enqueue the operation (outbox), and later confirm with the server. Show a subtle *pending/syncing* indicator. On server *success*, reconcile (e.g. replace a temp ID with the server ID); on *permanent failure*, revert and inform the user. Optimistic UI is what makes an offline-first app feel *responsive* despite async sync.",
      },
      {
        t: "list",
        items: [
          "**Apply locally now** — instant feel.",
          "**Sync in background** — outbox; confirm with server.",
          "**Success** — reconcile (temp → server ID).",
          "**Failure** — revert + inform; show pending state.",
        ],
      },
      {
        t: "note",
        text: "Optimistic UI applies a change locally/immediately (assuming success) — instant feel — then syncs in the background, reverting on failure. In offline-first, every write is optimistic: update the local DB (UI reflects at once), enqueue in the outbox, confirm with the server (reconcile temp→server ID on success, revert on permanent failure). Show a pending indicator. It makes offline-first feel responsive despite async sync.",
      },
    ],
  },
  {
    level: "senior",
    q: "What conflict-resolution strategies can you use?",
    a: [
      {
        t: "p",
        text: "Options by complexity: *Last-write-wins (LWW)* — the latest timestamp/version wins (simple, but can silently lose data); *server-wins/client-wins* — a fixed authority; *field-level merge* — merge non-conflicting fields (Firestore does per-field LWW); *operational transform / CRDTs* — for real collaborative editing (automatically mergeable, complex); or *manual resolution* — surface the conflict to the user to choose. Choose by *data semantics*: a like count tolerates LWW; a collaborative doc needs CRDTs/OT; a note edit might merge or prompt. Discuss *how you detect* conflicts (version numbers/vector clocks) and the *trade-off between simplicity and data safety*.",
      },
      {
        t: "table",
        headers: ["Strategy", "Use", "Trade-off"],
        rows: [
          ["Last-write-wins", "Simple data", "Can lose data"],
          ["Field merge", "Independent fields", "Not for logical conflicts"],
          ["CRDT/OT", "Collaborative editing", "Complex"],
          ["Manual", "Important conflicts", "User friction"],
        ],
      },
      {
        t: "note",
        text: "Conflict strategies: last-write-wins (simple, may lose data), server/client-wins (fixed authority), field-level merge (Firestore per-field), CRDT/OT (collaborative editing, auto-mergeable but complex), or manual (surface to user). Choose by data semantics (like count → LWW; collaborative doc → CRDT; note → merge/prompt). Detect via version numbers/vector clocks. Trade-off: simplicity vs data safety.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you detect conflicts (versioning, vector clocks)?",
    a: [
      {
        t: "p",
        text: "Attach a *version* to each record: a *version number/updatedAt* the server increments on write. When the client syncs an update, it sends the *base version* it edited from; if the server's current version is *higher* (someone else changed it), that's a *conflict* to resolve. This is *optimistic concurrency* (like an ETag/If-Match). For distributed/multi-device causality, *vector clocks* (or Lamport timestamps) track *which updates causally precede others* — detecting concurrent (conflicting) vs sequential edits precisely, where a single timestamp can't. Versioning is enough for most apps; vector clocks for complex multi-writer scenarios. Detection precedes resolution.",
      },
      {
        t: "list",
        items: [
          "**Version/updatedAt** — server increments; compare base vs current.",
          "**Optimistic concurrency** — like ETag/If-Match.",
          "**Vector clocks** — causal ordering for multi-device.",
          "**Detect** — concurrent vs sequential edits.",
        ],
      },
      {
        t: "note",
        text: "Detect conflicts with versioning: each record has a version/updatedAt the server increments; the client sends the base version it edited — if the server's is higher, it's a conflict (optimistic concurrency, like ETag/If-Match). For multi-device causality, vector clocks/Lamport timestamps track which updates causally precede others (concurrent vs sequential precisely). Versioning suffices for most apps; vector clocks for complex multi-writer. Detection precedes resolution.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle a create-then-edit-then-delete sequence made offline?",
    a: [
      {
        t: "p",
        text: "A user might *create*, *edit*, then *delete* an entity all while offline — the outbox would hold three operations for it. *Naively* syncing all three wastes requests (and the server never needed to know it existed). *Coalesce* dependent operations before sync: create+edit+delete of a never-synced entity → *drop all* (it was never on the server); create+edit → send *one create* with the final state; edit+edit → keep the last. This *compaction* reduces requests and avoids sending a delete for a server ID that doesn't exist. Handle *ordering/causality* carefully (don't send an edit for a create that was coalesced away). Operation coalescing is an advanced but important efficiency/correctness detail.",
      },
      {
        t: "list",
        items: [
          "**Sequence offline** — create → edit → delete queued.",
          "**Coalesce** — create+edit+delete of unsynced → drop all.",
          "**Create+edit** — send one create with final state.",
          "**Compaction** — fewer requests; careful causality.",
        ],
      },
      {
        t: "note",
        text: "Offline create→edit→delete queues three ops. Coalesce before sync: create+edit+delete of a never-synced entity → drop all (never on server); create+edit → one create with final state; edit+edit → keep last. Compaction reduces requests and avoids deleting a nonexistent server ID. Handle causality carefully (don't send an edit for a coalesced-away create). An advanced efficiency/correctness detail.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do CRDTs enable conflict-free collaborative sync?",
    a: [
      {
        t: "p",
        text: "*CRDTs (Conflict-free Replicated Data Types)* are data structures designed so that *concurrent edits from multiple replicas merge automatically* to the same result, *without conflicts or coordination*. Examples: a *G-Counter* (grow-only counter), *OR-Set* (add/remove set), or sequence CRDTs for collaborative text. Each replica applies operations locally (offline-friendly) and, on sync, merges others' operations *commutatively* — order doesn't matter, and everyone converges. They eliminate manual conflict resolution for the data types they cover, at the cost of *complexity* and *metadata overhead*. Use them for *real collaborative editing* (docs, whiteboards); for simple data, LWW/versioning is simpler. Mention CRDTs to show awareness of advanced sync.",
      },
      {
        t: "list",
        items: [
          "**CRDT** — merges concurrent edits automatically, no conflict.",
          "**Commutative** — order-independent; all replicas converge.",
          "**Examples** — counters, sets, sequence (collaborative text).",
          "**Cost** — complexity/metadata; use for real collaboration.",
        ],
      },
      {
        t: "note",
        text: "CRDTs (Conflict-free Replicated Data Types) are structures where concurrent edits from replicas merge automatically to the same result without coordination — operations are commutative, so order doesn't matter and everyone converges. Examples: G-Counter, OR-Set, sequence CRDTs (collaborative text). Offline-friendly, eliminating manual conflict resolution, at the cost of complexity/metadata. Use for real collaborative editing; LWW/versioning is simpler for basic data.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why is WorkManager suited for durable background sync?",
    a: [
      {
        t: "p",
        text: "Sync must run *reliably* even after the app closes, and *only under the right conditions* — WorkManager provides exactly that. It *guarantees execution* (persists across process death and reboots via its own store), supports *constraints* (network connected, charging, battery-not-low), *retries with backoff*, and lets the *system batch/defer* work for battery efficiency (Doze-aware). Enqueue a *unique* sync worker so triggers coalesce instead of stacking duplicates. A plain coroutine/`Service` wouldn't survive app death or respect constraints. For durable, constraint-aware, battery-friendly background sync, WorkManager is the standard Android tool.",
      },
      {
        t: "list",
        items: [
          "**Guaranteed** — survives process death/reboot.",
          "**Constraints + backoff** — network/charging; retry.",
          "**System-batched** — Doze-aware, battery-friendly.",
          "**Unique work** — coalesce triggers.",
        ],
      },
      {
        t: "note",
        text: "WorkManager suits durable sync: guaranteed execution (survives process death/reboot via its store), constraints (network/charging/battery), retry with backoff, system batching/deferral (Doze-aware, battery-friendly). Use unique work so triggers coalesce, not stack. A plain coroutine/Service won't survive app death or respect constraints. The standard Android tool for durable, constraint-aware background sync.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is delta sync, and why is it better than full sync?",
    a: [
      {
        t: "p",
        text: "*Full sync* re-downloads everything each time — simple but wasteful (bandwidth, battery, time), impractical for large data. *Delta sync* transfers *only what changed* since the last sync: the client sends a *sync token/cursor/last-sync timestamp*, and the server returns *only created/updated/deleted records* since then (plus a new token). This is far more efficient and scales to large datasets. It requires the server to *track changes* (change log / updatedAt / tombstones for deletes) and the client to *apply the delta* to its local DB. Delta sync is the standard for efficient offline sync — mention the token/cursor and tombstones for deletes.",
      },
      {
        t: "list",
        items: [
          "**Full sync** — re-download all; wasteful.",
          "**Delta sync** — only changes since last sync (token/cursor).",
          "**Server tracks** — change log/updatedAt; tombstones for deletes.",
          "**Efficient** — scales to large data.",
        ],
      },
      {
        t: "note",
        text: "Full sync re-downloads everything (wasteful, doesn't scale). Delta sync transfers only changes since the last sync: client sends a sync token/cursor/last-sync timestamp, server returns created/updated/deleted since then + a new token. Needs server change-tracking (change log/updatedAt, tombstones for deletes) and client delta application. The standard for efficient offline sync — mention token/cursor + tombstones.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle deletes in a sync system?",
    a: [
      {
        t: "p",
        text: "Deletes are tricky because a *removed* record can't be 'seen' as changed by a delta sync — if you hard-delete on the server, clients that missed it never learn it's gone. Use *tombstones*: mark records *deleted* (a flag + timestamp) instead of removing them immediately, so *delta sync includes the deletion* and clients remove their local copy. After all clients have synced (or a retention period), the server can *purge* tombstones. On the client, a locally-deleted record is queued as a delete operation (outbox) and applied to the DB. Tombstones make deletes *sync-visible* — a commonly-missed detail worth raising.",
      },
      {
        t: "list",
        items: [
          "**Problem** — hard-delete isn't visible to delta sync.",
          "**Tombstone** — mark deleted (flag + timestamp).",
          "**Delta includes deletion** — clients remove local copy.",
          "**Purge** — tombstones after retention.",
        ],
      },
      {
        t: "note",
        text: "Deletes are tricky: a hard-deleted record isn't visible to delta sync (clients that missed it never learn). Use tombstones — mark deleted (flag + timestamp) so delta sync includes the deletion and clients remove their local copy; purge tombstones after a retention period. Locally-deleted records queue as delete ops (outbox). Tombstones make deletes sync-visible — a commonly-missed detail worth raising.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle temporary IDs versus server-assigned IDs?",
    a: [
      {
        t: "p",
        text: "When you create an entity *offline*, the server hasn't assigned an ID yet — so you generate a *client-side temporary ID* (a UUID) to reference it locally (in the DB and UI). On sync, the server *creates the record and returns its real ID*; you then *reconcile* — update the local record and *any references* (e.g. a comment pointing to the temp post ID) to the server ID. Using *client-generated UUIDs as the permanent ID* (letting the client assign IDs) sidesteps the remapping entirely and aids idempotency — a common clean approach. Either way, handle the *ID mapping* so offline-created entities and their relationships stay consistent after sync.",
      },
      {
        t: "list",
        items: [
          "**Offline create** — client generates a temp UUID.",
          "**On sync** — server returns real ID; reconcile references.",
          "**Or** — client-generated UUID as the permanent ID (no remap).",
          "**Keep** — relationships consistent after sync.",
        ],
      },
      {
        t: "note",
        text: "Offline creation has no server ID yet — generate a client temp ID (UUID) for local reference; on sync the server returns the real ID and you reconcile the record + any references (a comment's temp post ID). Or use client-generated UUIDs as the permanent ID (client assigns IDs) — no remapping, aids idempotency. Either way, handle ID mapping so offline-created entities and relationships stay consistent.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you ensure sync operations are ordered and idempotent?",
    a: [
      {
        t: "p",
        text: "*Ordering*: process the outbox *in the order operations were created* (a sequence/timestamp), and respect *causal dependencies* (a create before its update; don't sync a comment before its post). *Idempotency*: give each operation a *unique idempotency key* (client-generated) so if a retry re-sends it (the ack was lost but the server processed it), the server *recognizes the duplicate and no-ops* rather than applying it twice. Together they guarantee that a flaky network with retries produces the *same result as one clean run*. This is essential — without idempotency, retries double-create; without ordering, updates apply to nonexistent records.",
      },
      {
        t: "list",
        items: [
          "**Ordering** — process outbox in creation order; respect dependencies.",
          "**Idempotency key** — server no-ops duplicates on retry.",
          "**Together** — retries produce the same result as one run.",
          "**Without** — double-creates / updates to missing records.",
        ],
      },
      {
        t: "note",
        text: "Ordering: process the outbox in creation order (sequence/timestamp), respecting causal dependencies (create before update, post before comment). Idempotency: a unique client-generated key per op so a retry (lost ack, server already processed) is recognized as a duplicate and no-op'd. Together, flaky-network retries produce the same result as one clean run. Without them: double-creates / updates to missing records.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you show sync status and pending changes to the user?",
    a: [
      {
        t: "p",
        text: "Give feedback so the user trusts their data is safe: a per-item *pending/syncing* indicator (e.g. a clock icon on an unsynced note), a global *sync status* (syncing / synced / offline), and clear handling of *failures* (a 'failed to sync — retry' affordance). Reflect *offline* state (a banner) so the user knows changes are queued, not lost. On success, remove the indicator. Avoid blocking the UI on sync — it happens in the background. Good sync-status UX turns an invisible, anxiety-inducing process into a transparent one — important because offline apps ask users to trust deferred persistence.",
      },
      {
        t: "list",
        items: [
          "**Per-item** — pending/syncing indicator.",
          "**Global** — syncing/synced/offline status.",
          "**Failures** — 'failed — retry' affordance.",
          "**Non-blocking** — background sync; build trust.",
        ],
      },
      {
        t: "note",
        text: "Show sync status for trust: per-item pending/syncing indicators (clock icon on unsynced items), a global status (syncing/synced/offline), clear failure handling ('failed — retry'), and an offline banner (changes queued, not lost). Remove indicators on success; never block the UI on sync (background). Good sync-status UX makes an invisible, anxiety-inducing process transparent — key since offline apps ask users to trust deferred persistence.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you trigger sync (on-change, periodic, on-connectivity)?",
    a: [
      {
        t: "p",
        text: "Combine triggers: *on local change* (enqueue a sync when the user makes a write — with constraints so it waits for network), *on connectivity regained* (a network constraint or a connectivity callback resumes queued sync), *periodic* (a background sync every N hours to pull updates), *on app foreground/open* (reconcile fresh), and optionally *push-triggered* (server sends an FCM signal when data changed → sync). Use *unique* WorkManager work so triggers coalesce rather than stack. The combination ensures changes sync *promptly when possible* and *eventually* regardless — balancing freshness with battery. Mention debouncing rapid changes into one sync.",
      },
      {
        t: "list",
        items: [
          "**On change** — enqueue with a network constraint.",
          "**On connectivity** — resume queued sync.",
          "**Periodic + on foreground** — pull updates, reconcile.",
          "**Push-triggered** — FCM signals a change; unique work coalesces.",
        ],
      },
      {
        t: "note",
        text: "Trigger sync via multiple signals: on local change (enqueue with network constraint), on connectivity regained (resume queued), periodic (pull updates every N hours), on app foreground (reconcile), and optionally push-triggered (FCM signals server changes). Use unique WorkManager work so triggers coalesce, not stack; debounce rapid changes into one sync. Ensures prompt-when-possible + eventual sync, balancing freshness and battery.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle a sync failure or partial sync?",
    a: [
      {
        t: "p",
        text: "*Retry* transient failures (network/5xx) with *exponential backoff* (WorkManager handles this). Make sync *resumable and incremental* — process the outbox operation-by-operation, *committing progress* (remove synced ops, advance the cursor) so a failure mid-batch doesn't redo everything. Keep operations *idempotent* so a retried partial op is safe. For *permanent* failures (4xx, validation, unresolvable conflict), don't retry forever — mark the item *failed*, surface it to the user, and stop. Ensure the local DB stays *consistent* even if sync is interrupted (transactions). Robust partial-failure handling is what separates a toy sync from a production one.",
      },
      {
        t: "list",
        items: [
          "**Transient** — retry with backoff (WorkManager).",
          "**Incremental** — commit progress; resume, don't redo.",
          "**Permanent** — mark failed, surface, stop retrying.",
          "**Consistent** — transactions; idempotent retries.",
        ],
      },
      {
        t: "note",
        text: "Sync failures: retry transient (network/5xx) with exponential backoff (WorkManager); make sync incremental/resumable — process the outbox op-by-op, committing progress (remove synced, advance cursor) so a mid-batch failure doesn't redo all; keep ops idempotent. Permanent failures (4xx/validation/unresolvable conflict) → mark failed, surface, stop retrying. Keep the local DB consistent (transactions). Robust partial-failure handling = production-grade sync.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is eventual consistency, and why does it apply to offline apps?",
    a: [
      {
        t: "p",
        text: "*Eventual consistency* means the local and server state may *temporarily diverge* but will *converge* once sync completes — you don't get instant global consistency (impossible offline). An offline app *accepts* this: a user's optimistic local change isn't on the server yet, and another device won't see it until sync. You design *for* it — reconcile on sync, resolve conflicts, show pending state — rather than assume strong consistency. The trade-off is *availability/responsiveness* (works offline, feels instant) *over immediate consistency*. Acknowledging eventual consistency and designing for convergence is core to offline-first thinking.",
      },
      {
        t: "list",
        items: [
          "**Eventual consistency** — states diverge, then converge on sync.",
          "**Offline** — instant global consistency is impossible.",
          "**Design for it** — reconcile, resolve conflicts, pending state.",
          "**Trade** — availability/responsiveness over immediate consistency.",
        ],
      },
      {
        t: "note",
        text: "Eventual consistency: local and server state may temporarily diverge but converge once sync completes (instant global consistency is impossible offline). Offline apps accept it — an optimistic local change isn't on the server yet; other devices see it after sync. Design for it (reconcile, resolve conflicts, show pending) rather than assume strong consistency. Trade availability/responsiveness for immediate consistency — core offline-first thinking.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you design the local database schema for sync?",
    a: [
      {
        t: "p",
        text: "Augment entities with *sync metadata*: a *stable ID* (client UUID or server ID), a *version/updatedAt*, a *sync status* (synced/pending/failed), and a *dirty/deleted flag* (for tombstones). Add an *outbox/pending-operations* table (operation type, entity ref, payload, idempotency key, retry count, created-at for ordering). Store the *last-sync cursor/token* for delta sync. This lets you query 'what needs syncing' (dirty/pending rows), apply deltas, and reconcile. The schema is designed around the *sync lifecycle*, not just the domain data — that metadata is what makes reliable sync possible.",
      },
      {
        t: "list",
        items: [
          "**Entity metadata** — stable ID, version, sync status, dirty/deleted.",
          "**Outbox table** — op type, ref, payload, idempotency key, retry.",
          "**Last-sync cursor** — for delta sync.",
          "**Query** — 'what needs syncing'; designed around sync lifecycle.",
        ],
      },
      {
        t: "note",
        text: "Schema for sync: augment entities with sync metadata (stable ID, version/updatedAt, sync status synced/pending/failed, dirty/deleted flag for tombstones); add an outbox table (op type, entity ref, payload, idempotency key, retry count, created-at for ordering); store a last-sync cursor/token for delta. Lets you query what needs syncing, apply deltas, reconcile. Designed around the sync lifecycle, not just domain data.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does multi-device sync differ from single-device offline?",
    a: [
      {
        t: "p",
        text: "*Single-device* offline just reconciles one client with the server. *Multi-device* adds that *the same user edits from multiple devices*, so *conflicts between a user's own devices* arise, changes on device A must *propagate* to device B (via sync + optionally push to prompt a sync), and each device maintains its *own last-sync cursor* and local state. You need robust *conflict resolution* (LWW/merge/CRDT) since concurrent edits are more likely, *causal tracking* (vector clocks help), and *prompt propagation* (push a 'data changed' signal so other devices sync quickly). It's the same offline-first machinery, but conflicts and propagation become first-class concerns.",
      },
      {
        t: "list",
        items: [
          "**Multi-device** — same user edits from several devices.",
          "**Conflicts** — between the user's own devices; more likely.",
          "**Propagation** — A's changes → B (sync + push signal).",
          "**Per-device cursor** — + robust conflict/causal handling.",
        ],
      },
      {
        t: "note",
        text: "Single-device offline reconciles one client with the server. Multi-device adds: the same user edits from multiple devices (conflicts between their own devices), changes on A must propagate to B (sync + push-to-prompt-sync), and each device has its own last-sync cursor. Needs robust conflict resolution (LWW/merge/CRDT), causal tracking (vector clocks), and prompt propagation. Same machinery, but conflicts + propagation become first-class.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you test an offline-sync system?",
    a: [
      {
        t: "p",
        text: "Test the *pieces* and the *scenarios*. Unit-test the *repository/sync logic* with a *fake network* (MockWebServer) and an *in-memory DB* — verify optimistic writes hit the DB, the outbox enqueues, sync drains it, and conflicts resolve correctly. Test key *scenarios*: offline write → reconnect → syncs; conflict → resolved per strategy; failed sync → retried; delete → tombstone propagates; temp ID → reconciled. Simulate *network toggling* and *interrupted sync* (partial failure). Integration-test the WorkManager sync. Because the DB is the SSOT, most logic is testable without UI. Thorough scenario testing is essential — sync bugs corrupt user data.",
      },
      {
        t: "list",
        items: [
          "**Unit** — repo/sync logic, fake network + in-memory DB.",
          "**Scenarios** — offline write→sync, conflict, retry, delete, temp ID.",
          "**Simulate** — network toggling, interrupted sync.",
          "**Integration** — WorkManager sync; SSOT aids testability.",
        ],
      },
      {
        t: "note",
        text: "Test offline-sync: unit-test repo/sync logic with a fake network (MockWebServer) + in-memory DB (optimistic writes hit DB, outbox enqueues, sync drains, conflicts resolve). Test scenarios: offline write→reconnect→sync, conflict resolution, failed→retry, delete→tombstone, temp ID→reconcile. Simulate network toggling + interrupted sync. Integration-test WorkManager. The SSOT DB makes most logic UI-free testable. Essential — sync bugs corrupt user data.",
      },
    ],
  },
  {
    level: "senior",
    q: "When is full offline-first worth the complexity, and when is caching enough?",
    a: [
      {
        t: "p",
        text: "Full *offline-first* (local SSOT + outbox + conflict resolution + sync) is complex — justify it when *offline usage is a core requirement* (field apps, note/task apps, messaging, poor-connectivity markets) or *responsiveness/reliability* of writes matters greatly. If the app is *mostly read* and *online-assumed*, a simpler *cache* (stale-while-revalidate reads, online-only writes with retry) is enough — far less complexity, no conflict machinery. Decide by *how important offline writes are*: read-caching for occasional-offline convenience, full offline-first when users genuinely work offline and create data. Right-sizing this is senior judgment — don't over-engineer sync you don't need.",
      },
      {
        t: "list",
        items: [
          "**Full offline-first** — offline is core; writes must be reliable.",
          "**Caching** — mostly-read, online-assumed apps.",
          "**Decide** — how important offline writes are.",
          "**Don't over-engineer** — sync you don't need.",
        ],
      },
      {
        t: "note",
        text: "Full offline-first (local SSOT + outbox + conflict resolution + sync) is complex — justify it when offline usage is core (field/note/task/messaging apps, poor-connectivity markets) or write reliability matters. If mostly-read and online-assumed, simple caching (stale-while-revalidate reads, online-only writes with retry) suffices. Decide by how important offline writes are. Right-sizing is senior judgment — don't over-engineer unneeded sync.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between cache-based offline and true offline-first?",
    a: [
      {
        t: "p",
        text: "*Cache-based offline* opportunistically shows *previously-loaded* data when offline (read-through cache) but treats the *network as primary* — writes usually require connectivity, and offline is a *degraded* fallback. *True offline-first* treats the *local database as primary* (SSOT): the app is *designed to work fully offline*, writes are first-class (optimistic + queued), and the network is a *sync mechanism*, not a requirement. The difference is *philosophy*: cache = 'online app that tolerates offline'; offline-first = 'local app that syncs'. Offline-first is more work but gives a seamless offline experience; caching is lighter but limited.",
      },
      {
        t: "list",
        items: [
          "**Cache-based** — network primary; offline is a read fallback.",
          "**Offline-first** — local DB primary (SSOT); network syncs.",
          "**Writes** — cache: need connectivity; offline-first: first-class.",
          "**Philosophy** — 'online tolerating offline' vs 'local that syncs'.",
        ],
      },
      {
        t: "note",
        text: "Cache-based offline: network is primary, previously-loaded data shown when offline (read fallback), writes usually need connectivity — offline is degraded. True offline-first: local DB is primary (SSOT), designed to work fully offline, writes first-class (optimistic + queued), network is a sync mechanism. Philosophy: 'online app tolerating offline' vs 'local app that syncs'. Offline-first is more work but seamless; caching lighter but limited.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you keep sync battery- and data-efficient?",
    a: [
      {
        t: "p",
        text: "Use *delta sync* (transfer only changes, not everything), *batch* operations (send the outbox in one request rather than many), *defer* non-urgent sync to favorable conditions (WorkManager constraints — charging/unmetered) and let the system *batch* it (Doze-friendly), *debounce* rapid changes into one sync, *compress* payloads, and avoid *chatty polling* (prefer push-triggered sync or reasonable intervals). Respect *data-saver* settings. Don't hold a wakelock or sync aggressively in the background. Efficiency matters because sync runs repeatedly in the background — a wasteful sync drains battery and data, hurting retention. Tie efficiency to the same principles as any background work.",
      },
      {
        t: "list",
        items: [
          "**Delta + batch** — minimal transfer, one request.",
          "**Defer/constrain** — charging/unmetered; system batching.",
          "**Debounce + compress** — coalesce changes, smaller payloads.",
          "**Avoid** — chatty polling; respect data-saver.",
        ],
      },
      {
        t: "note",
        text: "Efficient sync: delta sync (only changes), batch outbox ops (one request), defer non-urgent to favorable conditions (WorkManager charging/unmetered, system batching, Doze-friendly), debounce rapid changes, compress payloads, avoid chatty polling (prefer push-triggered), respect data-saver. Don't hold wakelocks or sync aggressively in background. Sync runs repeatedly — wasteful sync drains battery/data, hurting retention.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle authentication and token expiry during sync?",
    a: [
      {
        t: "p",
        text: "Background sync must handle *expired tokens*: use an *authenticator/interceptor* that, on a 401, *refreshes* the access token (with the refresh token) and retries the request transparently — so sync doesn't fail just because the token lapsed. If the *refresh token is invalid* (user logged out/revoked), *stop syncing* and surface a re-login requirement (don't silently retry forever). Store tokens *securely* (Keystore/encrypted). Ensure only *one* refresh happens under concurrency (a mutex) to avoid a refresh storm. Handling auth in background sync is easy to overlook but essential — a stale token shouldn't break the user's queued changes.",
      },
      {
        t: "list",
        items: [
          "**401 → refresh + retry** — transparently (authenticator).",
          "**Invalid refresh** — stop, require re-login.",
          "**Single refresh** — under concurrency (mutex).",
          "**Secure storage** — Keystore/encrypted.",
        ],
      },
      {
        t: "note",
        text: "Background sync handles token expiry: an authenticator/interceptor refreshes the access token on 401 and retries transparently (sync doesn't fail on a lapsed token). If the refresh token is invalid (logout/revoke), stop syncing and require re-login (don't retry forever). Serialize refresh under concurrency (mutex) to avoid a storm; store tokens securely (Keystore). Easy to overlook but essential — a stale token shouldn't break queued changes.",
      },
    ],
  },
  {
    level: "senior",
    q: "Walk through the end-to-end flow of an offline edit reaching the server.",
    a: [
      {
        t: "p",
        text: "(1) User edits a note offline → the app writes it to the *local DB* (marked dirty/pending) and updates the UI *optimistically*. (2) A *pending operation* is recorded in the *outbox* (update, entity ref, payload, idempotency key, base version). (3) *WorkManager* sync is enqueued (network constraint). (4) On connectivity, the worker reads the outbox *in order*, sends each op to the server *with the idempotency key and base version*. (5) Server *checks the version* — no conflict → apply, return new version; conflict → resolve per strategy (or return conflict for the client). (6) On success, the worker *removes the op*, updates the local record's *version/synced status*; on failure, *retry with backoff*. (7) Delta sync later *pulls others' changes*. The UI (observing the DB) reflects the final synced state.",
      },
      {
        t: "list",
        items: [
          "**Edit** — local DB (dirty) + optimistic UI.",
          "**Outbox** — pending op (idempotency key, base version).",
          "**WorkManager** — send in order on connectivity.",
          "**Server** — version check/resolve → success removes op, updates status.",
        ],
      },
      {
        t: "note",
        text: "Offline edit flow: (1) write to local DB (dirty) + optimistic UI; (2) record a pending op in the outbox (idempotency key, base version); (3) enqueue WorkManager sync (network constraint); (4) worker sends ops in order with key + version; (5) server checks version (apply or resolve conflict); (6) success removes the op + updates local version/status, failure retries with backoff; (7) delta sync pulls others' changes. The UI (observing the DB) shows the final synced state.",
      },
    ],
  },
];

export default qa;
