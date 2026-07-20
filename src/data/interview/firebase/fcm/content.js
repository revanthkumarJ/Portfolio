// Firebase Cloud Messaging (FCM) — Content tab. Teaching-first.

const content = [
  {
    heading: "What FCM is and why it matters",
    blocks: [
      {
        t: "p",
        text: "**Firebase Cloud Messaging (FCM)** is Google's service for sending **push notifications** and data messages from a server to devices. It's the standard way to deliver real-time, server-initiated updates to an app — a chat message, a breaking-news alert, a 'your order shipped' notification. Crucially, FCM is *far more battery-efficient* than the app polling a server, because it uses a *single, shared, persistent connection* the OS maintains for all apps, and it can wake an app even from Doze. This is why 'use push, not polling' is the recommended pattern for real-time server-driven updates.",
      },
      {
        t: "list",
        items: [
          "**Server → device**: your backend tells FCM 'send this to this device/topic', and FCM delivers it — the app doesn't have to be running or polling.",
          "**Battery-efficient**: the OS maintains *one* connection to Google's servers shared across all apps (not one per app), and delivers messages over it — vastly cheaper than every app holding its own connection or polling. A *high-priority* message can even wake the app from Doze.",
          "**The alternative it replaces**: polling (the app repeatedly asking 'anything new?') wastes battery and data and is laggy. FCM push notifies only when there's genuinely something, in near-real-time.",
        ],
      },
    ],
  },
  {
    heading: "Registration tokens",
    blocks: [
      {
        t: "p",
        text: "To send a message to a specific device, the server needs to address it — that's the **registration token** (FCM token). Each app instance gets a unique token from FCM; the app sends this token to *your* backend, which stores it and uses it to target messages to that device. Managing the token lifecycle correctly is essential and a common interview point.",
      },
      {
        t: "code",
        title: "Getting and refreshing the token",
        code: `// Get the current token
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    val token = task.result
    sendTokenToYourServer(token)     // your backend stores it to target this device
}

// The token can CHANGE — you must handle refresh
class MyMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        sendTokenToYourServer(token)  // send the NEW token to your backend
    }
}`,
      },
      {
        t: "list",
        items: [
          "**The token identifies the app instance on this device** — your server uses it as the 'address' to send a message to that device.",
          "**Tokens can change / rotate** — on app reinstall, data clear, restore to a new device, or periodically for security. FCM calls `onNewToken` when it does; you *must* send the new token to your backend, or messages will stop reaching that device (they'd go to a dead token). Not handling `onNewToken` is a classic bug (notifications silently stop for some users).",
          "**Topics** — instead of individual tokens, devices can *subscribe to topics* (`subscribeToTopic(\"news\")`), and the server sends to a topic to reach all subscribers at once — good for broadcast-style messaging (news, announcements) without managing individual tokens.",
        ],
      },
    ],
  },
  {
    heading: "Notification vs data messages — the critical distinction",
    blocks: [
      {
        t: "p",
        text: "FCM has two message types, and their *handling behavior differs significantly* depending on whether the app is in the foreground or background — this is *the* most important FCM concept and a very common interview question.",
      },
      {
        t: "table",
        headers: ["", "Notification message", "Data message"],
        rows: [
          ["Contains", "a `notification` payload (title, body)", "custom key-value `data` only"],
          ["App in foreground", "delivered to onMessageReceived (you handle it)", "delivered to onMessageReceived"],
          ["App in background", "**system auto-displays it** in the tray; onMessageReceived NOT called", "delivered to onMessageReceived (you build the notification)"],
          ["Control over display", "limited (system builds it when backgrounded)", "full (you always build it in code)"],
        ],
      },
      {
        t: "list",
        items: [
          "**Notification message** — has a `notification` block (title/body). When the app is *backgrounded*, the *system automatically displays* it in the notification tray, and your `onMessageReceived` is *not* called. When *foregrounded*, it comes to `onMessageReceived` for you to handle. So you get automatic display when backgrounded but *limited control*.",
          "**Data message** — has only a custom `data` payload (your key-value pairs). It's *always* delivered to `onMessageReceived` (foreground *and* background), and *you build the notification in code*. This gives *full control* (custom logic, conditional display, updating app state) but *you're responsible* for showing anything.",
          "**The common gotcha**: developers send a *notification* message and wonder why `onMessageReceived` isn't called when the app is backgrounded (it's the system displaying it, not your code). If you need to *always* run your code (to build a custom notification, update the DB, decide whether to notify), use a *data* message. Many apps use data messages precisely for this control.",
          "**Combined messages** (both `notification` and `data`) exist but have the notification-message backgrounding behavior — so for guaranteed code execution, prefer pure data messages.",
        ],
      },
    ],
  },
  {
    heading: "Handling messages and building notifications",
    blocks: [
      {
        t: "code",
        title: "onMessageReceived and posting a notification",
        code: `class MyMessagingService : FirebaseMessagingService() {
    override fun onMessageReceived(message: RemoteMessage) {
        // For a DATA message (or foreground notification message):
        val title = message.data["title"]
        val body = message.data["body"]

        // Build and show the notification yourself
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntentToOpenScreen())  // where tapping goes
            .build()
        NotificationManagerCompat.from(this).notify(id, notification)
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Notification channels** (required since Android 8) — every notification must belong to a *channel* (a category the user can configure — sound, importance, on/off per channel). You create channels once; the user controls them in system settings.",
          "**`POST_NOTIFICATIONS` runtime permission** (Android 13+) — you must request this permission to show notifications; without it, notifications are silently dropped. A newer requirement to handle.",
          "**Tapping a notification** — set a `PendingIntent` (usually with a deep link) so tapping opens the right screen with the right data.",
          "**`onMessageReceived` is for foreground + data messages** — do quick work there (build the notification, update local state); for heavy work, hand off to WorkManager. There's a time limit (~10-20s) and, for background data messages, high-priority is needed to run reliably.",
        ],
      },
      {
        t: "note",
        text: "FCM: server→device push, battery-efficient (one shared OS connection, wakes from Doze) — use it instead of polling for real-time updates. Registration token addresses a device; handle onNewToken (tokens rotate — send new ones to your backend or notifications stop) and topics for broadcast. Notification message: system auto-displays when backgrounded (onMessageReceived NOT called), limited control. Data message: always delivered to onMessageReceived (you build the notification), full control — use for guaranteed code execution. Notification channels (Android 8+) and POST_NOTIFICATIONS permission (Android 13+) required.",
      },
    ],
  },
];

export default content;
