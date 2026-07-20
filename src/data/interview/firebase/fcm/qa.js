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
  {
    level: "senior",
    q: "How does FCM deliver a message end-to-end?",
    a: [
      {
        t: "p",
        text: "Your *app server* sends a message (with a device token or topic) to the *FCM backend* via the HTTP v1 API. FCM authenticates it, queues it, and delivers it to the device over a *persistent connection* maintained by Google Play services. On the device, Play services routes it to your `FirebaseMessagingService`. FCM handles connectivity, retries, and battery-efficient delivery — you never hold your own socket. If the device is offline, FCM stores the message (subject to TTL) and delivers when it reconnects.",
      },
      {
        t: "list",
        items: [
          "**App server** — sends via HTTP v1 API (token/topic).",
          "**FCM backend** — auth, queue, deliver.",
          "**Persistent connection** — via Play services.",
          "**Offline** — stored (TTL) and delivered on reconnect.",
        ],
      },
      {
        t: "note",
        text: "End-to-end: your app server sends to FCM (HTTP v1, token/topic) → FCM authenticates, queues, and delivers over Play services' persistent connection → the device routes to your FirebaseMessagingService. FCM handles connectivity, retries, and battery-efficient delivery; offline devices get stored messages (subject to TTL) on reconnect.",
      },
    ],
  },
  {
    level: "senior",
    q: "How is message handling different when the app is in the foreground versus background?",
    a: [
      {
        t: "p",
        text: "It depends on the *message type*. A *notification message* while the app is *backgrounded* is displayed *automatically* by the system (in the tray) — `onMessageReceived` is NOT called; the data (if any) arrives in the launch intent extras on tap. A *notification message* while *foregrounded* delivers to `onMessageReceived` (you display it). A *data message* *always* delivers to `onMessageReceived` (foreground or background) — you must build the notification yourself. This distinction trips up many developers.",
      },
      {
        t: "table",
        headers: ["Message type", "Foreground", "Background"],
        rows: [
          ["Notification", "onMessageReceived", "Auto-shown in tray (no callback)"],
          ["Data-only", "onMessageReceived", "onMessageReceived"],
          ["Notification + data", "onMessageReceived", "Auto-shown; data in tap intent"],
        ],
      },
      {
        t: "note",
        text: "Notification message backgrounded → system auto-shows it, onMessageReceived NOT called (data arrives in the tap intent). Notification foregrounded → onMessageReceived (you display). Data-only → always onMessageReceived (you build the notification). This foreground/background × type matrix is a classic FCM gotcha.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is onMessageReceived, and when is it called?",
    a: [
      {
        t: "p",
        text: "`onMessageReceived(RemoteMessage)` is the callback in your `FirebaseMessagingService` where you *receive and handle* a message. It's called for *data messages always* (foreground and background), and for *notification messages only when the app is in the foreground*. Inside it you read `remoteMessage.data`/`.notification` and typically build a notification with `NotificationCompat` or trigger a sync. It runs on a background thread with ~10–20s to finish — for longer work, enqueue WorkManager.",
      },
      {
        t: "code",
        title: "onMessageReceived",
        code: `class MyFirebaseService : FirebaseMessagingService() {\n  override fun onMessageReceived(msg: RemoteMessage) {\n    val title = msg.data["title"] ?: msg.notification?.title\n    showNotification(title, msg.data["body"])   // build with NotificationCompat\n    // for heavy work: WorkManager.getInstance(this).enqueue(...)\n  }\n}`,
      },
      {
        t: "note",
        text: "onMessageReceived (in FirebaseMessagingService) handles a message — called for data messages always, and notification messages only in the foreground. Read remoteMessage.data/.notification and build a notification or trigger a sync. It has ~10–20s on a background thread; enqueue WorkManager for longer work.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are notification channels, and why are they required?",
    a: [
      {
        t: "p",
        text: "Since Android 8 (Oreo), every notification must belong to a *channel* — a user-visible category (e.g. 'Messages', 'Promotions') with its own importance, sound, vibration, and light settings that *the user controls*. You create channels once at startup (`NotificationManager.createNotificationChannel`). If you post a notification without a valid channel on 8+, it won't show. Channels give users fine-grained control (mute promotions, keep messages) instead of all-or-nothing, improving trust and reducing opt-outs.",
      },
      {
        t: "code",
        title: "Creating a channel",
        code: `val channel = NotificationChannel("messages", "Messages", NotificationManager.IMPORTANCE_HIGH)\ngetSystemService(NotificationManager::class.java).createNotificationChannel(channel)\n// then post with NotificationCompat.Builder(ctx, "messages")`,
      },
      {
        t: "note",
        text: "Since Android 8, every notification needs a channel — a user-controlled category (importance, sound, vibration). Create channels at startup (createNotificationChannel); without a valid channel, notifications won't show on 8+. Channels let users mute categories individually (promotions vs messages) instead of all-or-nothing — better trust, fewer opt-outs.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is message priority (high vs normal) in FCM, and how does it affect delivery?",
    a: [
      {
        t: "p",
        text: "FCM messages have a *priority*: *high* priority wakes the device (even in Doze) to deliver immediately — for time-sensitive content (chat, calls). *Normal* priority may be *delayed/batched* to save battery (delivered in a maintenance window). Notification messages default to high; data messages default to normal (set `\"priority\": \"high\"` explicitly if urgent). Overusing high priority for non-urgent messages wastes battery and, if abused, Google may throttle you. Match priority to genuine urgency.",
      },
      {
        t: "list",
        items: [
          "**High** — wakes device (even Doze), immediate; for urgent content.",
          "**Normal** — may be delayed/batched to save battery.",
          "**Data messages** — default normal; set high if urgent.",
          "**Don't abuse high** — battery cost, possible throttling.",
        ],
      },
      {
        t: "note",
        text: "FCM priority: high wakes the device (even in Doze) for immediate delivery (chat/calls); normal may be batched/delayed to save battery. Notification messages default high, data messages default normal (set priority:high if urgent). Don't abuse high for non-urgent messages — battery cost and possible throttling. Match priority to real urgency.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is FCM topic messaging?",
    a: [
      {
        t: "p",
        text: "*Topics* let you send one message to *all devices subscribed to a named topic* (e.g. `news`, `weather_london`) without managing individual tokens. Devices subscribe with `subscribeToTopic(\"news\")`; your server sends to `/topics/news` and FCM fans it out. Great for broadcast content (announcements, categories the user opts into). Subscriptions are managed by FCM (persist across app restarts). Topics aren't for targeting *specific users* (use tokens for that) — they're for *group broadcast*.",
      },
      {
        t: "code",
        title: "Subscribe to a topic",
        code: `Firebase.messaging.subscribeToTopic("news")\n  .addOnCompleteListener { /* subscribed */ }\n// server sends to condition/topic \"news\" → all subscribers receive it`,
      },
      {
        t: "note",
        text: "Topics send one message to all devices subscribed to a named topic (news, weather_london) — no token management. Devices subscribeToTopic; server sends to the topic and FCM fans out. Great for opt-in broadcast content; FCM persists subscriptions. Not for targeting specific users (use tokens) — topics are for group broadcast.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you send to multiple devices (multicast, topics, conditions)?",
    a: [
      {
        t: "p",
        text: "Options: send to *individual tokens* (loop, or *batch/multicast* up to 500 tokens per request with `sendEachForMulticast`); use *topics* for opt-in broadcast groups; or use *conditions* (boolean topic expressions like `'news' in topics && 'sports' in topics`) to target intersections/unions. For large user bases, topics/conditions scale better than managing millions of tokens. FCM returns per-token results so you can *prune invalid tokens* (unregistered) from your database.",
      },
      {
        t: "list",
        items: [
          "**Tokens** — batch/multicast up to 500 per request.",
          "**Topics** — opt-in broadcast groups.",
          "**Conditions** — boolean topic expressions (intersections).",
          "**Prune** — remove invalid/unregistered tokens from per-result.",
        ],
      },
      {
        t: "note",
        text: "Send to many via: individual tokens (batch/multicast up to 500 per request), topics (opt-in broadcast), or conditions (boolean topic expressions for intersections/unions). Topics/conditions scale better than millions of tokens. Use FCM's per-token results to prune invalid/unregistered tokens from your DB.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is TTL and collapse key in FCM?",
    a: [
      {
        t: "p",
        text: "*TTL (time-to-live)* sets how long FCM stores a message for an offline device before dropping it (default ~4 weeks; set to 0 for 'deliver now or discard' — good for real-time-only data). A *collapse key* groups messages so that when the device comes online, *only the latest* message in a group is delivered (older ones collapsed) — useful for 'sync now' or state-update pings where only the newest matters, avoiding a backlog of redundant messages. Both control delivery of stored/queued messages.",
      },
      {
        t: "list",
        items: [
          "**TTL** — how long FCM stores for an offline device (0 = now-or-never).",
          "**Collapse key** — deliver only the latest of a group.",
          "**Collapse use** — sync pings/state updates (newest matters).",
          "**Both** — control stored/queued delivery.",
        ],
      },
      {
        t: "note",
        text: "TTL: how long FCM stores a message for an offline device before dropping (default ~4 weeks; 0 = deliver-now-or-discard for real-time-only). Collapse key: groups messages so only the latest in a group is delivered on reconnect (older collapsed) — for sync/state pings where only the newest matters. Both govern stored/queued delivery.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle the POST_NOTIFICATIONS permission on Android 13+?",
    a: [
      {
        t: "p",
        text: "Since Android 13 (API 33), posting notifications requires the *runtime permission* `POST_NOTIFICATIONS` — the user must grant it (like other runtime permissions). Declare it in the manifest and *request it at an appropriate moment* (with rationale — after the user sees why notifications help, not on first launch). If denied, notifications silently don't show. On pre-13 devices, notifications are allowed by default (no request). Handle the denied case gracefully and offer a path to settings.",
      },
      {
        t: "list",
        items: [
          "**Android 13+** — `POST_NOTIFICATIONS` runtime permission.",
          "**Declare + request** — at a good moment with rationale.",
          "**Denied** — notifications silently don't show.",
          "**Pre-13** — allowed by default.",
        ],
      },
      {
        t: "note",
        text: "Android 13+ requires the POST_NOTIFICATIONS runtime permission to show notifications — declare it and request at a good moment (with rationale, not on first launch). Denied → notifications silently don't show; offer a path to settings. Pre-13 devices allow notifications by default. Handle the denied case gracefully.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between the FCM HTTP v1 API and the legacy API?",
    a: [
      {
        t: "p",
        text: "The *legacy* HTTP/XMPP API used a static *server key* for auth and a flatter JSON. The *HTTP v1 API* (current, required — legacy is deprecated/shut down) uses *OAuth2 access tokens* from a *service account* (more secure, short-lived), a *structured message format* with platform-specific overrides (`android`, `apns`, `webpush`), and better error handling. Migrate to v1: generate tokens from a service account (via the Admin SDK or Google auth libraries) and use the new payload shape. Never embed a server key in the app.",
      },
      {
        t: "list",
        items: [
          "**Legacy** — static server key; deprecated/shut down.",
          "**HTTP v1** — OAuth2 from a service account (secure, short-lived).",
          "**v1 format** — platform overrides (android/apns/webpush).",
          "**Migrate** — Admin SDK/auth libs; never embed keys in the app.",
        ],
      },
      {
        t: "note",
        text: "Legacy FCM API: static server key auth, flat JSON — deprecated/shut down. HTTP v1 (current): OAuth2 access tokens from a service account (secure, short-lived), structured payload with platform overrides (android/apns/webpush), better errors. Migrate via the Admin SDK/Google auth libs. Never embed a server key in the app.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Doze mode affect FCM message delivery?",
    a: [
      {
        t: "p",
        text: "In *Doze* (device idle), *normal-priority* messages are *deferred* to maintenance windows (may be delayed significantly), while *high-priority* messages can *wake the device* and deliver immediately (with temporary allowances to run briefly). So for time-critical delivery (chat, calls), use high priority; for non-urgent, normal priority respects Doze and saves battery. Don't set everything high — Google can *throttle* apps that abuse high priority. Design your message priorities around actual urgency and Doze behavior.",
      },
      {
        t: "list",
        items: [
          "**Normal priority** — deferred to maintenance windows in Doze.",
          "**High priority** — wakes device, immediate (brief allowance).",
          "**Urgent** — high; non-urgent — normal (battery-friendly).",
          "**Abuse** — Google throttles over-use of high.",
        ],
      },
      {
        t: "note",
        text: "In Doze, normal-priority messages are deferred to maintenance windows; high-priority can wake the device for immediate delivery (with a brief run allowance). Use high for time-critical (chat/calls), normal for non-urgent (respects Doze, saves battery). Don't set everything high — Google throttles abuse. Design priorities around real urgency.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are data-only (silent) messages used for?",
    a: [
      {
        t: "p",
        text: "*Data-only* messages carry a custom key-value payload and *no notification* — they always hit `onMessageReceived`, letting the app *react silently*: trigger a background sync, update cached data, invalidate a token, or decide *whether and how* to show a notification (full client control over presentation/localization). Caveats: they're subject to *background restrictions* (normal priority may be delayed in Doze; the app must not be force-stopped), and heavy work needs WorkManager. Use them when the client should decide the UX, or for pure sync.",
      },
      {
        t: "list",
        items: [
          "**No notification** — always `onMessageReceived`.",
          "**Uses** — silent sync, cache update, client-decided UI.",
          "**Full control** — presentation/localization on-device.",
          "**Caveats** — Doze delays (normal priority); WorkManager for heavy work.",
        ],
      },
      {
        t: "note",
        text: "Data-only (silent) messages carry key-value data and no notification — always onMessageReceived, so the app reacts silently: background sync, cache update, token invalidation, or client-decided notification (full presentation/localization control). Caveats: subject to Doze delays (normal priority), app must not be force-stopped, WorkManager for heavy work. Use for client-controlled UX or pure sync.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you manage registration tokens on the server?",
    a: [
      {
        t: "p",
        text: "Store each device's token *associated with the user/account* on your server, update it when `onNewToken` fires (send the new token to your backend), and *remove stale tokens* when FCM reports them *unregistered/invalid* in send responses (app uninstalled, token rotated). Tokens can change (app restore, clear data, reinstall), so treat them as *ephemeral*. Deduplicate per device, and consider token *expiry* (refresh periodically). Clean token management avoids sending to dead endpoints and keeps delivery metrics healthy.",
      },
      {
        t: "list",
        items: [
          "**Store** — token ↔ user/account on the server.",
          "**Update** — on `onNewToken` (push to backend).",
          "**Remove** — tokens FCM reports unregistered/invalid.",
          "**Ephemeral** — tokens change; dedupe and refresh.",
        ],
      },
      {
        t: "note",
        text: "Store tokens associated with the user on your server, update on onNewToken, and remove stale ones when FCM reports unregistered/invalid (uninstall/rotation). Tokens are ephemeral (change on restore/clear-data/reinstall) — dedupe per device and refresh periodically. Clean management avoids dead endpoints and keeps delivery metrics healthy.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the notification payload size limit in FCM?",
    a: [
      {
        t: "p",
        text: "FCM message payloads are limited to *4KB* (4096 bytes) for data messages (and topic messages have a smaller ~2KB limit). This means you *can't* send large content in the push — instead send a small payload (an ID or minimal data) and have the app *fetch the full content* from your API when it arrives. This 'notification as a signal, fetch the rest' pattern is standard and also keeps sensitive data out of the push. Keep payloads lean.",
      },
      {
        t: "list",
        items: [
          "**Limit** — ~4KB (topics ~2KB).",
          "**Pattern** — send an ID, fetch full content from your API.",
          "**Benefit** — no large data in push; keeps secrets out.",
          "**Keep lean** — minimal payload.",
        ],
      },
      {
        t: "note",
        text: "FCM payloads are limited to ~4KB (topics ~2KB). Don't send large content — send a small payload (an ID/minimal data) and have the app fetch the full content from your API on arrival. This 'push as a signal, fetch the rest' pattern is standard and keeps sensitive data out of the push. Keep payloads lean.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is notification trampolining, and why did Android 12 restrict it?",
    a: [
      {
        t: "p",
        text: "*Notification trampolining* was launching an Activity *indirectly* from a notification tap — the tap started a `BroadcastReceiver`/`Service` that then started the Activity. This *delayed* the app appearing (janky) and let apps do work before the UI. Android 12 *blocks* starting an Activity from a service/receiver launched by a notification tap; you must use a `PendingIntent` that *directly starts the Activity*. Fix by setting the notification's content intent to the Activity's `PendingIntent`, doing any routing inside the Activity.",
      },
      {
        t: "list",
        items: [
          "**Trampolining** — tap → service/receiver → Activity (indirect).",
          "**Problem** — delayed UI, jank.",
          "**Android 12** — blocks Activity start from that path.",
          "**Fix** — PendingIntent directly to the Activity; route inside it.",
        ],
      },
      {
        t: "note",
        text: "Notification trampolining = launching an Activity indirectly (tap → service/receiver → Activity), which delayed the UI. Android 12 blocks starting an Activity from a service/receiver launched by a notification tap. Fix: set the content intent to a PendingIntent that directly starts the Activity, and do routing inside the Activity.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you display a rich notification with image and actions?",
    a: [
      {
        t: "p",
        text: "Use `NotificationCompat.Builder` with styles and actions: `BigPictureStyle` for a large image, `BigTextStyle` for expandable text, `addAction()` for buttons (each with its own `PendingIntent`), and set the content intent for the tap. For FCM, send a *data message* so the app builds this rich notification (auto-displayed notification messages are limited to title/body). Load images off the main thread (Coil/Glide) before building. Set the channel, small icon, and priority appropriately.",
      },
      {
        t: "code",
        title: "Rich notification",
        code: `val n = NotificationCompat.Builder(ctx, "messages")\n  .setSmallIcon(R.drawable.ic_msg)\n  .setContentTitle(title).setContentText(body)\n  .setStyle(NotificationCompat.BigPictureStyle().bigPicture(bitmap))\n  .addAction(R.drawable.ic_reply, "Reply", replyPendingIntent)\n  .setContentIntent(openPendingIntent).build()`,
      },
      {
        t: "note",
        text: "Build rich notifications with NotificationCompat: BigPictureStyle (image), BigTextStyle (expandable text), addAction (buttons with PendingIntents), content intent for tap. For FCM, use a data message so the app builds it (auto notification messages are title/body only). Load images off-main first; set channel, small icon, priority.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you test FCM messages during development?",
    a: [
      {
        t: "p",
        text: "Quick options: the *Firebase console* → Cloud Messaging → send a test message to a specific *registration token* (good for notification messages, less so for data). Or `curl` the *HTTP v1 API* with a service-account OAuth token and a JSON payload (tests data messages and platform options). Log the device token (`FirebaseMessaging.getInstance().token`) to target it. Test *all four states*: foreground/background × notification/data, since behavior differs. Also test tap deep-linking and Doze/high-priority delivery.",
      },
      {
        t: "list",
        items: [
          "**Firebase console** — send test to a token (notifications).",
          "**curl HTTP v1** — data messages + platform options.",
          "**Log the token** — to target the device.",
          "**Test all states** — fg/bg × notification/data, tap, Doze.",
        ],
      },
      {
        t: "note",
        text: "Test FCM via the Firebase console (send to a specific token — good for notifications) or curl the HTTP v1 API with a service-account token (data messages + platform options). Log the device token to target it. Test all four states (foreground/background × notification/data — behavior differs), plus tap deep-linking and high-priority/Doze delivery.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you deep-link from a notification to the right screen?",
    a: [
      {
        t: "p",
        text: "Put a *destination hint* in the message data (a screen id, entity id, or a deep-link URI), attach it to the notification's *content `PendingIntent`* (extras or an `ACTION_VIEW` deep-link intent), and in the target Activity read the extras/intent to *navigate* to the right screen. Use `TaskStackBuilder` (or a proper back stack) so 'back' returns sensibly. Ensure `PendingIntent` uses `FLAG_IMMUTABLE` and a unique request code. For auto-displayed FCM notifications, the data arrives in the launcher intent on tap.",
      },
      {
        t: "list",
        items: [
          "**Destination in data** — screen/entity id or deep-link URI.",
          "**Attach** — to the content PendingIntent (extras/ACTION_VIEW).",
          "**Navigate** — read in the Activity; TaskStackBuilder for back stack.",
          "**PendingIntent** — FLAG_IMMUTABLE + unique request code.",
        ],
      },
      {
        t: "note",
        text: "Deep-link by putting a destination hint (screen/entity id or deep-link URI) in message data, attaching it to the content PendingIntent (extras or ACTION_VIEW), and navigating from the target Activity. Use TaskStackBuilder for a sensible back stack; PendingIntent with FLAG_IMMUTABLE + unique request code. Auto-shown FCM notifications deliver data in the tap launcher intent.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why should you never embed FCM/server credentials in the app?",
    a: [
      {
        t: "p",
        text: "The *server key / service-account credentials* let anyone send messages *as your app* — embedding them in the APK means they can be *extracted* (the APK is decompilable) and abused to spam your users or impersonate you. Sending must happen *server-side* (your backend holds the credentials securely). The app only holds the *client* config (`google-services.json`, which is not a secret — it identifies the project) and its own registration token. Keep all send-side secrets on the server.",
      },
      {
        t: "list",
        items: [
          "**Server credentials** — can send as your app.",
          "**In APK** — extractable → spam/impersonation.",
          "**Send server-side** — backend holds secrets.",
          "**App holds** — only client config + its token (not secret).",
        ],
      },
      {
        t: "note",
        text: "FCM server key/service-account credentials let anyone send as your app — embedded in the APK they're extractable and abusable (spam/impersonation). Sending must be server-side (backend holds credentials). The app only holds client config (google-services.json — not a secret, just project identity) and its token. Keep all send-side secrets server-side.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you ensure notifications aren't shown twice or out of order?",
    a: [
      {
        t: "p",
        text: "Give each logical notification a *stable id* (e.g. based on the message/conversation id) so re-delivery *updates* rather than duplicates (`notify(sameId, ...)`), and use a *server-side message id* to *dedupe* if the same push could arrive twice. For ordering, don't rely on push arrival order (FCM doesn't guarantee it) — include a *timestamp/sequence* in the payload and let the client render by that. For chat, treat push as a *trigger to fetch ordered data* from your API rather than the source of truth.",
      },
      {
        t: "list",
        items: [
          "**Stable notification id** — update, don't duplicate.",
          "**Server message id** — dedupe re-delivery.",
          "**Ordering** — timestamp/sequence in payload; don't trust arrival order.",
          "**Chat** — push triggers an ordered fetch from the API.",
        ],
      },
      {
        t: "note",
        text: "Avoid duplicates with a stable notification id (notify(sameId) updates), and dedupe by a server message id if a push can arrive twice. Don't rely on FCM arrival order — include a timestamp/sequence and render by it. For chat, treat push as a trigger to fetch ordered data from your API (source of truth), not the data itself.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a foreground service notification, and how does it relate to FCM?",
    a: [
      {
        t: "p",
        text: "A *foreground service* must show an ongoing *notification* (so the user knows it's running) — used for user-visible ongoing tasks (music, navigation, an active call). FCM relates when a *high-priority data message* triggers work that needs to run reliably: on recent Android you may start a foreground service *from* an FCM message only within allowed constraints (there are background-start restrictions). For most push work, prefer *WorkManager* (Doze-aware) over a foreground service unless the task is genuinely ongoing and user-visible (e.g. an incoming call UI).",
      },
      {
        t: "list",
        items: [
          "**Foreground service** — ongoing notification; user-visible tasks.",
          "**FCM trigger** — high-priority message → reliable work.",
          "**Restrictions** — background foreground-service-start limits.",
          "**Prefer** — WorkManager unless genuinely ongoing (e.g. calls).",
        ],
      },
      {
        t: "note",
        text: "A foreground service shows an ongoing notification (user knows it runs) — for user-visible ongoing tasks (music, calls). FCM can trigger one from a high-priority message within background-start restrictions. For most push-triggered work prefer WorkManager (Doze-aware); use a foreground service only for genuinely ongoing user-visible tasks like an incoming-call UI.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you measure and improve notification delivery and engagement?",
    a: [
      {
        t: "p",
        text: "Track *delivery* (FCM's delivery data / BigQuery export shows sent vs delivered vs dropped) and *engagement* (opens/taps via Analytics, attributing which notifications drive action). Improve delivery by using correct priority, valid tokens (prune invalid), and respecting Doze; improve engagement with relevant, well-timed, *personalized* content, good channels (so users don't mute you), rich formatting, and A/B testing copy/timing. Watch *opt-out/mute rates* — over-notifying erodes delivery permission. Treat notifications as a measured, respectful channel.",
      },
      {
        t: "list",
        items: [
          "**Delivery data** — FCM/BigQuery: sent vs delivered vs dropped.",
          "**Engagement** — opens/taps via Analytics.",
          "**Improve** — correct priority, valid tokens, relevance, timing.",
          "**Watch** — opt-out/mute rates; don't over-notify.",
        ],
      },
      {
        t: "note",
        text: "Measure delivery (FCM delivery data/BigQuery export: sent vs delivered vs dropped) and engagement (opens/taps via Analytics). Improve delivery with correct priority, valid tokens (prune), Doze respect; improve engagement with relevant, well-timed, personalized content, good channels, rich formatting, A/B tests. Watch opt-out/mute rates — over-notifying erodes delivery permission.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is google-services.json, and is it a secret?",
    a: [
      {
        t: "p",
        text: "`google-services.json` is the Firebase *client config* file (project id, app id, API keys for client SDKs, sender id) that the *google-services Gradle plugin* reads at build time to wire up Firebase. It's *not a secret* in the sensitive sense — it identifies your Firebase project and is embedded in the app anyway; security comes from *Security Rules* and *server-side credentials*, not from hiding this file. That said, teams often keep it out of public repos by convention. Losing it isn't a breach; leaking your *service-account key* would be.",
      },
      {
        t: "list",
        items: [
          "**Client config** — project/app id, client API keys, sender id.",
          "**Read by** — the google-services Gradle plugin at build.",
          "**Not a secret** — embedded in the app; security via Rules/server.",
          "**Contrast** — service-account key IS sensitive.",
        ],
      },
      {
        t: "note",
        text: "google-services.json is Firebase client config (project/app id, client API keys, sender id) read by the google-services Gradle plugin at build. It's not a sensitive secret — it identifies the project and ships in the app; security comes from Security Rules and server credentials. Teams may keep it out of public repos by convention. The service-account key, by contrast, IS sensitive.",
      },
    ],
  },
  {
    level: "senior",
    q: "How would you architect push for reliability when messages must not be lost?",
    a: [
      {
        t: "p",
        text: "FCM is *best-effort* — not a guaranteed delivery bus. For must-not-lose messages, treat push as a *wake-up signal* and make the *server the source of truth*: on receipt, the client *fetches* any missed items from an ordered, idempotent API (using a cursor/last-synced marker), so even a dropped push is recovered on the next sync or app open. Persist unread state server-side, use high priority for urgency, dedupe by message id, and periodically *reconcile* (on app foreground). Never rely solely on the push payload for critical data.",
      },
      {
        t: "list",
        items: [
          "**FCM best-effort** — not guaranteed delivery.",
          "**Push = wake-up** — server is source of truth.",
          "**Fetch missed** — ordered idempotent API + cursor.",
          "**Reconcile** — on foreground; dedupe by message id.",
        ],
      },
      {
        t: "note",
        text: "FCM is best-effort, not guaranteed. For must-not-lose messages, treat push as a wake-up signal with the server as source of truth: on receipt, fetch missed items from an ordered, idempotent API (cursor/last-synced), so a dropped push is recovered on next sync/open. Persist unread server-side, use high priority, dedupe by id, reconcile on foreground. Never rely solely on the payload for critical data.",
      },
    ],
  },
  {
    level: "senior",
    q: "What happens to a token when the app is uninstalled or data is cleared?",
    a: [
      {
        t: "p",
        text: "On *uninstall* the token becomes *invalid* — FCM eventually reports it as `NotRegistered`/`UNREGISTERED` in send responses, and you should *delete it* from your server. On *clear data* or some *restores*, the token is *regenerated* and `onNewToken` fires with the new one (update the server). So a token is not permanent: always handle rotation via `onNewToken`, and prune tokens that FCM marks unregistered. Sending to a dead token wastes quota and skews delivery metrics.",
      },
      {
        t: "list",
        items: [
          "**Uninstall** — token invalid; FCM reports NotRegistered → delete it.",
          "**Clear data/restore** — token regenerated; `onNewToken` fires.",
          "**Not permanent** — handle rotation, prune dead tokens.",
          "**Dead token** — wastes quota, skews metrics.",
        ],
      },
      {
        t: "note",
        text: "On uninstall the token becomes invalid — FCM reports NotRegistered/UNREGISTERED in send responses; delete it server-side. On clear-data/some restores the token regenerates and onNewToken fires (update the server). Tokens aren't permanent — handle rotation and prune dead ones; sending to them wastes quota and skews delivery metrics.",
      },
    ],
  },
];

export default qa;
