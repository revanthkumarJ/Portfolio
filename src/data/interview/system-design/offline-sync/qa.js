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
];

export default qa;
