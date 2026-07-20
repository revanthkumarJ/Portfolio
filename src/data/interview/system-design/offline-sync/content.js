// Design Offline-First Sync — Content tab. Teaching-first.

const content = [
  {
    heading: "The problem — a fully offline-capable app",
    blocks: [
      {
        t: "p",
        text: "'Design an offline-first sync system' (like a notes app, a to-do app, or an email client that works fully offline) is a rich mobile system design question because it forces you to handle the *hard* half of offline: not just *reading* offline (serve from cache), but *writing* offline and *synchronizing* those changes with the server when connectivity returns — including *conflict resolution* when the same data changed in two places. It's a distributed-systems problem on a mobile client.",
      },
      {
        t: "list",
        items: [
          "**Requirements**: the app works *fully* offline — read *and* write. Changes made offline persist and sync automatically when back online. Data stays consistent across the user's devices and the server. The UI is responsive (never blocked on the network).",
          "**The easy half — offline reads**: serve data from a local database (SSOT). This is the standard offline-first pattern (covered in Data/Caching).",
          "**The hard half — offline writes + sync**: a user edits a note offline; that change must be stored locally, reflected in the UI immediately, and *pushed to the server* when online — reliably (surviving app kills), and *reconciled* if the server's version also changed. This is where the design gets interesting.",
        ],
      },
    ],
  },
  {
    heading: "The foundation — SSOT and local-first writes",
    blocks: [
      {
        t: "p",
        text: "The architecture is built on the **single source of truth** (a local database, usually Room) that the UI *always* reads from, combined with **local-first (optimistic) writes**: a write is applied to the local DB *immediately* (so the UI updates and the user isn't blocked), and *then* synced to the server in the background.",
      },
      {
        t: "code",
        title: "Local-first write with a sync queue",
        code: `// Entity carries sync metadata
data class NoteEntity(
    @PrimaryKey val id: String,
    val content: String,
    val updatedAt: Long,
    val syncStatus: SyncStatus,   // PENDING, SYNCED, or CONFLICT
    val version: Int,             // for conflict detection
)

suspend fun updateNote(id: String, content: String) {
    // 1. Write locally FIRST — UI updates instantly (optimistic)
    dao.update(id, content, updatedAt = now(), syncStatus = PENDING)
    // 2. Trigger background sync (WorkManager — survives app kill)
    scheduleSyncWork()
}`,
      },
      {
        t: "list",
        items: [
          "**SSOT (local DB)** — the UI observes the DB (via Flow), so it always shows local data (offline-capable), and writes go *into* the DB. The server is a *sync partner*, not the read source.",
          "**Optimistic local writes** — apply the change locally immediately and mark it `PENDING` sync. The UI reflects it instantly (responsive, works offline), and the actual server sync happens later/in the background. The user never waits on the network to make a change.",
          "**Sync metadata on each record** — a `syncStatus` (pending/synced/conflict) and a `version`/timestamp, so the sync engine knows what needs pushing and can detect conflicts.",
        ],
      },
    ],
  },
  {
    heading: "The sync engine and the outbox pattern",
    blocks: [
      {
        t: "p",
        text: "The **sync engine** pushes local changes to the server and pulls remote changes down. For *reliability* — so offline changes are never lost even if the app is killed — you use an **outbox pattern**: queue outgoing operations durably (in the DB), and a background worker processes the queue, retrying until each succeeds.",
      },
      {
        t: "list",
        items: [
          "**Outbox pattern** — every offline mutation is recorded as a durable *operation* (in an outbox table or via the record's `PENDING` status), so it survives app kills and reboots. A background sync reads pending operations and pushes them to the server, marking them synced on success. This *guarantees eventual delivery* — no offline change is silently lost.",
          "**WorkManager for the sync worker** — the sync runs in a WorkManager job with a *network constraint*, so it *automatically runs when connectivity returns*, survives process death/reboot, and retries with backoff on failure. This is exactly WorkManager's purpose (guaranteed, deferrable, network-aware work) — a plain coroutine couldn't guarantee the sync happens.",
          "**Push then pull** — sync typically *pushes* local pending changes up, then *pulls* remote changes down (updating the local DB, which the UI observes). The pull can be *full* (fetch everything) or *incremental/delta* (fetch only changes since the last sync — far more efficient).",
          "**Idempotency** — each operation carries a client-generated id so retries (WorkManager may retry after an ambiguous failure) don't duplicate the action server-side — the server dedupes by the id. Essential because mobile failures are often ambiguous (did the request go through?).",
        ],
      },
    ],
  },
  {
    heading: "Conflict resolution — the hardest part",
    blocks: [
      {
        t: "p",
        text: "The genuinely hard problem: while a user edited a note offline, the *same note* may have changed on the server (edited on another device). When syncing, you have two divergent versions — a **conflict** — and need a *policy* to reconcile them. There's no universal right answer; it depends on the data's semantics.",
      },
      {
        t: "table",
        headers: ["Strategy", "How it resolves a conflict", "Trade-off"],
        rows: [
          ["Last-write-wins (LWW)", "compare timestamps; the newest edit wins, discarding the other", "simple, but *loses* the other edit — data loss"],
          ["Server-wins / client-wins", "one side always wins", "simple, predictable, but arbitrary loss"],
          ["Field-level merge", "merge non-conflicting field changes; conflict only on the same field", "preserves more, more complex"],
          ["CRDTs / operational transform", "data structures that merge automatically (collaborative editing)", "powerful (no loss), complex — for real-time collab (Google Docs)"],
          ["Manual / user-resolved", "present both versions, let the user choose/merge", "no data loss, but interrupts the user"],
        ],
      },
      {
        t: "list",
        items: [
          "**Detecting a conflict** — compare *versions*: each record has a version/timestamp; the server rejects a push whose *base version* doesn't match the current server version (optimistic concurrency), signaling a conflict. Or compare on pull (local `PENDING` + remote changed = conflict).",
          "**Last-write-wins** — the simplest: newest timestamp wins. Acceptable for single-user, low-conflict data (a personal note edited on one device at a time), but it *silently loses* the losing edit — bad for important data.",
          "**Field-level merge** — if two devices edited *different fields* of the same record, merge both changes (no real conflict); only a genuine same-field conflict needs resolution. Preserves more data, more complex.",
          "**CRDTs / OT** — conflict-free replicated data types (or operational transformation) *automatically merge* concurrent edits with no data loss — the basis of real-time collaborative editing (Google Docs, Figma). Powerful but complex; for genuine multi-user real-time collaboration.",
          "**Manual resolution** — present the conflicting versions and let the *user* decide/merge. No data loss, but interrupts them — appropriate for high-value data where automatic resolution risks losing something important.",
          "**The judgment**: pick the strategy matching the data — LWW for simple single-user data, field-merge for structured multi-field records, CRDTs for real-time collaboration, manual for critical data. Stating that conflict resolution *depends on data semantics* (not a one-size-fits-all) is the senior signal.",
        ],
      },
    ],
  },
  {
    heading: "Putting it together and edge cases",
    blocks: [
      {
        t: "list",
        items: [
          "**Full flow**: read from local DB (offline-capable) → write locally + mark PENDING (optimistic, instant UI) → WorkManager sync worker (network-constrained) pushes PENDING ops (idempotent) → server accepts or reports conflict → resolve per policy → pull remote changes (delta) into the DB → UI updates via the observed Flow. Rinse and repeat on each connectivity change.",
          "**Optimistic UI + rollback** — since you apply changes before server confirmation, handle *rejection* (validation failure, lost conflict): roll back the local change or surface an error, keeping the user informed.",
          "**Delta sync** — sync only *changes* since the last sync (using a sync token/timestamp), not the whole dataset — critical for efficiency (bandwidth, battery) with large data.",
          "**Deletion handling** — deletes are tricky: a hard-delete locally that isn't synced could resurrect on the next pull. Use *soft deletes* (a `deleted` flag) synced like other changes, or tombstones, so deletions propagate correctly.",
          "**Ordering & dependencies** — if offline operations have dependencies (create a note, then edit it), sync them in order; the outbox preserves ordering.",
          "**Real-time layer (optional)** — for faster convergence, add a push (FCM) or WebSocket to *notify* the app of remote changes so it syncs promptly, rather than only on app open — combining offline-first durability with near-real-time freshness.",
        ],
      },
      {
        t: "note",
        text: "Offline-first sync: foundation = SSOT (local DB, UI reads it — offline reads) + optimistic local-first writes (apply locally + mark PENDING → instant UI). Sync engine + OUTBOX pattern (durable queue of ops, survives kill) via WorkManager (network-constrained, guaranteed, retries) — push PENDING (idempotent ids) then pull (delta). CONFLICT RESOLUTION is the hard part (same data changed both places): last-write-wins (simple, data loss), field-merge, CRDTs (auto-merge, for real-time collab), or manual — choose by DATA SEMANTICS. Edge cases: optimistic rollback on rejection, delta sync, soft deletes (avoid resurrection), operation ordering, optional push/WebSocket for freshness.",
      },
    ],
  },
];

export default content;
