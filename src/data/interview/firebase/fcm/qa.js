// Firebase Cloud Messaging (FCM) — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is FCM and why use it instead of polling?",
    a: [
      {
        t: "p",
        text: "**FCM (Firebase Cloud Messaging) is Google's service for sending push notifications and data messages from a server to devices — the standard way to deliver real-time, server-initiated updates (a chat message, a news alert, an order update).** You use it instead of polling because it's far more battery-efficient and delivers updates in near-real-time.",
      },
      {
        t: "list",
        items: [
          "**Push, not poll**: with polling, the app repeatedly asks the server 'anything new?' on a timer — wasteful (most requests return nothing, burning battery and data) and laggy (updates only arrive on the next poll). With FCM, the *server* pushes a message the moment there's something, so the app does nothing until there's genuinely an update.",
          "**Battery-efficient by design**: the OS maintains *one* persistent connection to Google's servers *shared across all apps* (not one per app), and delivers messages over it — vastly cheaper than every app holding its own connection or polling.",
          "**Wakes from Doze**: a high-priority FCM message can wake the app even when the device is in Doze (deep sleep), enabling genuinely real-time delivery — which polling can't do (it's deferred by Doze).",
        ],
      },
      {
        t: "p",
        text: "So FCM is the recommended pattern for anything requiring real-time server-driven updates. The typical flow: the app gets a registration token and sends it to your backend; when there's something to deliver, your backend tells FCM to send to that token; FCM delivers it, waking the app if needed. This 'server notifies the app' model is far more efficient than the app constantly checking — which is also why, when you need frequent updates (more often than WorkManager's 15-minute periodic minimum allows), the answer is push, not more polling.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is an FCM registration token and why must you handle onNewToken?",
    a: [
      {
        t: "p",
        text: "**A registration token (FCM token) is a unique identifier for an app instance on a specific device — it's the 'address' your server uses to target a push message to that device. The app gets its token from FCM and sends it to *your* backend, which stores it and uses it to send messages to that device.**",
      },
      {
        t: "list",
        items: [
          "**It addresses a device**: to send a message to a specific device, the server needs its token. So the app must retrieve its token and register it with your backend.",
          "**Tokens can change (rotate)** — on app reinstall, clearing app data, restoring to a new device, or periodically for security. FCM notifies you via `onNewToken(token)` when this happens.",
          "**You *must* handle `onNewToken`** — when the token changes, you have to send the *new* token to your backend. If you don't, your backend keeps using the *old, now-invalid* token, and messages to that device silently stop being delivered (they go to a dead token).",
        ],
      },
      {
        t: "p",
        text: "This is a classic FCM bug: notifications work initially, then silently stop for some users — because their token rotated (e.g. after a reinstall or restore) and the app didn't update the backend with the new one, so the backend is sending to a dead address. Correct handling means overriding `onNewToken` in your `FirebaseMessagingService` and sending the new token to your backend every time it fires, *plus* fetching and registering the current token on app start. Getting the token lifecycle right — retrieve on start, update on `onNewToken` — is essential for reliable delivery. (For broadcast-style messaging where you don't need to target individual devices, *topics* are an alternative — devices subscribe to a topic and the server sends to the topic, avoiding per-device token management.)",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle a notification when a user taps it?",
    a: [
      {
        t: "p",
        text: "**You attach a `PendingIntent` to the notification (usually one that triggers a deep link), so that tapping the notification opens the right screen with the right data.** The `PendingIntent` is set as the notification's content intent, and the system fires it when the user taps.",
      },
      {
        t: "code",
        title: "Notification with a tap destination",
        code: `val intent = Intent(this, MainActivity::class.java).apply {
    putExtra("screen", "orderDetail")
    putExtra("orderId", orderId)
}
val pendingIntent = PendingIntent.getActivity(
    this, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
)
val notification = NotificationCompat.Builder(this, CHANNEL_ID)
    .setContentTitle(title).setContentText(body)
    .setSmallIcon(R.drawable.ic_notif)
    .setContentIntent(pendingIntent)   // fired on tap
    .setAutoCancel(true)               // dismiss the notification when tapped
    .build()`,
      },
      {
        t: "p",
        text: "The `PendingIntent` is a token that lets the *system* fire your intent on your behalf when the user taps — you build the intent describing where to go (the target Activity plus extras like the order id, or a deep-link URI), wrap it in a `PendingIntent`, and set it as the notification's content intent. Best practice is to use a *deep link* so the notification routes to the correct destination and the app handles it consistently (whether cold-starting or already running), and to pass any needed data (the order id) as extras so the target screen knows what to show. On Android 12+ you must specify the PendingIntent's mutability (`FLAG_IMMUTABLE` for security unless you need it mutable). Setting `setAutoCancel(true)` dismisses the notification when tapped. So the answer connects notifications back to the PendingIntent/deep-link mechanism — tapping fires a PendingIntent that opens the intended screen.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between a notification message and a data message in FCM, and why does it matter?",
    a: [
      {
        t: "p",
        text: "**The difference is in *who displays the notification* and *whether your code runs*, and it changes based on whether the app is foreground or background — which is the single most important (and most commonly misunderstood) FCM concept. A *notification message* is auto-displayed by the system when the app is backgrounded (your code doesn't run); a *data message* is always delivered to your `onMessageReceived`, so *you* build the notification and your code always runs.**",
      },
      {
        t: "list",
        items: [
          "**Notification message** — contains a `notification` payload (title, body). When the app is in the *foreground*, it's delivered to `onMessageReceived` for you to handle. But when the app is in the *background*, **the system automatically displays it in the notification tray and your `onMessageReceived` is NOT called** — the OS handles display using the payload. So you get automatic display but *limited control* and *no code execution* when backgrounded.",
          "**Data message** — contains only a custom `data` payload (your key-value pairs, no `notification` block). It's **always delivered to `onMessageReceived`**, in *both* foreground and background, so *you* build and show the notification in code. This gives *full control* — you can run custom logic, decide whether/what to display, update local state, or do work — but *you're responsible* for showing anything (nothing appears automatically).",
        ],
      },
      {
        t: "list",
        items: [
          "**Why it matters — the classic bug**: a developer sends a *notification* message and adds logic in `onMessageReceived` (custom display, updating the database, analytics), then wonders why it doesn't run when the app is backgrounded. The reason: for a backgrounded notification message, the *system* displays it and never calls their code. The fix is to send a *data* message, which always invokes `onMessageReceived`.",
          "**When to use each**: use a *notification* message for simple 'just show this text' notifications where you're fine with the system displaying it and don't need custom handling. Use a *data* message when you need *guaranteed code execution* — building a custom/rich notification, running conditional logic (only notify if the user isn't already on that screen), updating app state (mark data as needing refresh), or doing background work. Many production apps use data messages precisely for this control, building all notifications themselves.",
          "**The combined-message caveat**: a message with *both* `notification` and `data` blocks behaves like a *notification* message when backgrounded (system displays the notification part, `onMessageReceived` gets only the data if tapped) — so it does *not* give you guaranteed background code execution. For reliable code execution on every message, use a *pure data* message.",
          "**Background data-message reliability**: to run reliably in the background (especially in Doze), data messages should be sent with *high priority*; normal-priority background messages may be deferred. And `onMessageReceived` has a time limit (~10-20s), so heavy work should be handed to WorkManager.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the notification-vs-data distinction is fundamentally about the *tradeoff between convenience and control* — notification messages are convenient (the system displays them automatically when backgrounded) but take control away (your code doesn't run in that case); data messages give full control (always deliver to your code) but require you to do the work (build everything yourself). The critical, non-obvious behavior — that backgrounded notification messages *bypass your `onMessageReceived`* — is where nearly everyone gets caught, so the mature answer leads with that. The practical rule: if you need your code to run on every message (custom display, state updates, logic), use *data* messages with high priority; if you just want to show simple text and don't care about custom handling, notification messages are simpler. Understanding the foreground/background × notification/data matrix, the 'system displays backgrounded notification messages without calling your code' gotcha, and the guidance to use data messages for guaranteed control is exactly the FCM depth these questions probe.",
      },
    ],
  },
  {
    level: "senior",
    q: "Design a reliable push notification system for a chat app. What would you consider?",
    a: [
      {
        t: "p",
        text: "**I'd use FCM data messages (for guaranteed code execution and control) with high priority (for real-time delivery through Doze), a robust token lifecycle, server-side targeting and fan-out, and careful handling of delivery edge cases — plus fallbacks, since push is best-effort. A chat app needs *timely, reliable, correctly-targeted* notifications, so each of these matters.**",
      },
      {
        t: "list",
        items: [
          "**Data messages, high priority**: use *data* messages (not notification messages) so `onMessageReceived` always runs — letting me build a rich notification (sender, message preview, avatar), decide *whether* to notify (suppress if the user is already in that chat), update the local message store, and update the unread badge. Send them *high priority* so they wake the app from Doze for real-time delivery — chat needs immediacy.",
          "**Token lifecycle done right**: retrieve the token on app start and on `onNewToken`, and register it with the backend *associated with the user account* (so messages target the right user's current devices). Handle *multiple devices per user* (a user logged in on phone + tablet — send to all their tokens), and *remove stale tokens* on logout and when the backend gets a 'not registered' error from FCM (so it stops sending to dead tokens). Token hygiene is critical — most 'notifications stopped working' bugs are token-management failures.",
          "**Server-side targeting and fan-out**: the backend maps a chat message → the recipient user(s) → their device tokens, and sends via FCM. For group chats, fan out to all members' tokens. Consider FCM's batch/multicast send for efficiency. Include the data needed to build the notification (sender, preview, chat id, message id) and to deep-link on tap.",
          "**Handle delivery is best-effort — don't rely solely on push**: FCM does *not* guarantee delivery (a device offline for a long time may have messages dropped/collapsed; push can be delayed). So the source of truth for messages is the *backend* (and local cache), not the notification — when the app opens or reconnects, it *syncs* missed messages from the server (or via a WebSocket/long-lived connection while active). Push is for *timely notification*, not the message transport itself. This is essential: never treat a push as the only way a message arrives.",
          "**Collapse and priority**: use a *collapse key* so many rapid messages in one chat collapse to the latest notification rather than flooding (or update a single notification with a count). Balance high priority (real-time, wakes device) against battery — chat justifies high priority, but not every message needs to wake a sleeping device.",
          "**Notification UX**: notification channels (a 'Messages' channel the user can configure), `POST_NOTIFICATIONS` permission handling (Android 13+), grouping notifications per chat, a *reply action* (inline reply via `RemoteInput`) so users respond from the notification, deep-link on tap to the specific chat, and marking read to clear the notification across devices.",
          "**Suppress when appropriate**: don't notify if the user is *actively viewing that chat* (check app state in `onMessageReceived`), and sync read state across devices so a message read on one device clears its notification on others.",
        ],
      },
      {
        t: "list",
        items: [
          "**Edge cases and reliability**: handle the app being killed (data message with high priority can still trigger `onMessageReceived`, but very heavy work should defer to WorkManager); handle notification permission denied (degrade gracefully — the in-app experience still works via sync); handle multiple devices and read-state sync; and monitor delivery (FCM provides some delivery data / BigQuery export) to catch systemic failures.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: a reliable chat push system rests on a few key insights — (1) use *data messages* for the control/code-execution chat needs (custom notifications, suppression, state updates), high-priority for real-time; (2) *token lifecycle hygiene* (multi-device, refresh, stale removal) is where reliability is usually won or lost; (3) *push is best-effort, not a message transport* — the backend is the source of truth and the app *syncs* missed messages on open/reconnect, so a dropped or delayed push never means a lost message; and (4) thoughtful UX (collapse, grouping, inline reply, suppress-when-viewing, cross-device read sync) makes it feel polished. The most important architectural point is decoupling *notification* (FCM, timely but unreliable) from *message delivery* (backend sync, reliable) — treating push as a nudge to sync rather than the data channel itself. Demonstrating the data-message choice, token-lifecycle rigor, the push-is-not-transport principle, and the UX considerations is the comprehensive answer that shows you've thought about real-world push reliability, not just the happy path.",
      },
    ],
  },
];

export default qa;
