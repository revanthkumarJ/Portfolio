// Design an Image-Loading Library — Content tab. Teaching-first.

const content = [
  {
    heading: "The problem and requirements",
    blocks: [
      {
        t: "p",
        text: "'Design an image-loading library' (like Coil or Glide) is a classic mobile system design question because it touches *caching, memory management, threading, and lifecycle* — all core mobile concerns — in a bounded, concrete problem. The task: given a URL, efficiently load the image, display it in a view/composable, and do so *without* jank, memory bloat, or leaks, even when scrolling a list of hundreds of images.",
      },
      {
        t: "list",
        items: [
          "**Functional**: load an image from a URL (or resource/file) into a target (ImageView/Composable); support placeholders and error images; handle transformations (resize, crop, rounded corners).",
          "**Non-functional**: *fast* (instant for cached images), *memory-safe* (no OOM even with many large images), *no jank* (loading off the main thread), *no leaks* (respect the target's lifecycle), *efficient* (don't re-download or re-decode unnecessarily, respect the network).",
          "**The hard parts**: the *cache hierarchy* (memory → disk → network), *bitmap memory management* (images are large; decode to the right size), *threading* (decode off-main, deliver on-main), *request lifecycle* (cancel when the target is gone or recycled), and *concurrency* (dedup identical in-flight requests).",
        ],
      },
    ],
  },
  {
    heading: "The cache hierarchy — the core of the design",
    blocks: [
      {
        t: "p",
        text: "The heart of an image loader is a **multi-tier cache**: check the fastest cache first, fall back to slower ones, and populate them as you go. This is what makes cached images instant and avoids redundant work.",
      },
      {
        t: "code",
        title: "The load flow through the cache hierarchy",
        code: `fun load(url: String, target: Target) {
    // 1. Memory cache — decoded Bitmap, fastest (in-RAM)
    memoryCache[url]?.let { bitmap ->
        target.setImage(bitmap)     // instant, on main thread
        return
    }
    // 2. Disk cache — encoded bytes, persistent (survives restart)
    // 3. Network — download, then decode, then populate both caches
    launchOnBackgroundThread {
        val bytes = diskCache[url] ?: download(url).also { diskCache[url] = it }
        val bitmap = decode(bytes, target.width, target.height)  // downsample to target size
        memoryCache[url] = bitmap
        deliverOnMain { target.setImage(bitmap) }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Memory cache (tier 1)** — an in-memory `LruCache` of *decoded Bitmaps*, keyed by URL (+ target size/transformations). Fastest (no decode, no I/O) — a cached image displays *instantly*, which is what makes scrolling smooth. Bounded by size (a fraction of the app's memory budget); LRU evicts the least-recently-used when full.",
          "**Disk cache (tier 2)** — *encoded* image bytes (the downloaded file) on disk, persistent across app restarts. Slower than memory (I/O + decode needed) but avoids re-downloading. Also LRU-bounded by size.",
          "**Network (tier 3)** — the source. Download only if not in either cache; then populate *both* caches so the next request is fast.",
          "**Why two tiers**: memory holds *decoded* bitmaps (fast to display but volatile and large in RAM); disk holds *encoded* bytes (compact, persistent, but needs decoding). The hierarchy trades memory (fast, small, volatile) → disk (persistent, needs decode) → network (source, slow) — each tier a fallback for the one above.",
        ],
      },
    ],
  },
  {
    heading: "Bitmap memory management — avoiding OOM",
    blocks: [
      {
        t: "p",
        text: "Images are the #1 cause of `OutOfMemoryError` on Android, because a decoded bitmap is *huge* — a 4000×3000 photo is ~48MB in memory (4 bytes/pixel), regardless of the JPEG's small file size. Loading full-size images into small views wastes enormous memory. The key technique is **downsampling**: decode the image only to the *size actually needed* for the target view.",
      },
      {
        t: "list",
        items: [
          "**Downsample to target size** — decode the bitmap at the resolution the view will display, not the source resolution. Decoding a 4000px image into a 200px thumbnail at full size wastes ~99% of the memory. Use `BitmapFactory.Options.inSampleSize` (or the modern `ImageDecoder`) to decode at a reduced size. This alone prevents most image OOMs.",
          "**Bounded memory cache** — the memory `LruCache` is sized to a *fraction* of the app's available memory (e.g. 1/8th via `ActivityManager.memoryClass`), and evicts LRU when full — so the cache never grows unbounded and OOMs.",
          "**Bitmap pooling / reuse** — advanced: reuse bitmap memory (`inBitmap`) instead of allocating a new one each time, reducing GC churn during scrolling (Glide does this heavily).",
          "**Appropriate config** — use `RGB_565` (2 bytes/pixel) instead of `ARGB_8888` (4 bytes) when alpha isn't needed, halving memory — a trade-off (slightly lower quality).",
          "**The principle**: never hold more bitmap memory than needed — decode to display size, bound the cache, and reuse memory. Images are large and volatile, so disciplined memory management is essential.",
        ],
      },
    ],
  },
  {
    heading: "Threading, request lifecycle, and concurrency",
    blocks: [
      {
        t: "list",
        items: [
          "**Threading** — downloading and *decoding* must happen *off the main thread* (both are slow — I/O and CPU), then the bitmap is delivered *on the main thread* to update the view. Use coroutines (`Dispatchers.IO` for download/decode, `Dispatchers.Main` to deliver) or a thread pool. Doing decode on the main thread causes jank; this is why a naive `imageView.setImageBitmap(decode(download(url)))` on the main thread is wrong.",
          "**Request lifecycle & cancellation** — a request must be *cancelled* when its target is no longer valid: the view is *recycled* in a RecyclerView (scrolled away — a new image is now wanted for that view), or the Activity/Fragment is *destroyed*. Otherwise you waste work and risk setting the *wrong* image on a recycled view (the classic 'wrong image flashes in a list' bug) or leaking the destroyed context. So requests are tied to the target's/lifecycle's scope and cancelled when it ends.",
          "**The recycled-view bug** — in a list, view A's image request is in-flight when the user scrolls and view A is recycled to show item B. If A's request completes and sets its image, you see item A's image on item B's row. The fix: *cancel* the previous request when a view is rebound, and *tag* the view/request so a completing request checks it's still the intended target before setting the image.",
          "**Concurrency / request dedup** — if two views request the *same* URL simultaneously (or the same image is requested while already loading), *don't* download/decode it twice — dedup identical in-flight requests so the work happens once and both targets get the result. This saves bandwidth and CPU.",
          "**Lifecycle awareness** — the request should observe the target's lifecycle (Activity/Fragment/Compose) and cancel automatically when it's destroyed — preventing leaks and wasted work. Coil integrates with the lifecycle; in Compose, `AsyncImage` ties to the composition.",
        ],
      },
    ],
  },
  {
    heading: "Putting it together — the API and full flow",
    blocks: [
      {
        t: "code",
        title: "A clean loading API (Coil-style)",
        code: `// Simple call site — the library handles all the complexity
imageView.load("https://...") {
    placeholder(R.drawable.loading)
    error(R.drawable.error)
    transformations(RoundedCornersTransformation(8f))
}
// In Compose:
AsyncImage(model = url, contentDescription = null)`,
      },
      {
        t: "list",
        items: [
          "**The full flow**: `load(url, target)` → check memory cache (instant if hit) → else launch a *cancellable* request scoped to the target's lifecycle → check disk cache, else download (deduped) → decode *downsampled to target size* off-main → populate memory + disk caches → deliver on main *if the target is still valid* → handle placeholder (during load) and error (on failure).",
          "**Components**: a *request* model (URL, target, size, transformations, placeholders), a *cache* subsystem (memory LRU + disk LRU), a *fetcher* (network/file/resource), a *decoder* (bytes → downsampled bitmap), a *lifecycle/cancellation* manager, and a *dispatcher* (threading). This decomposition mirrors real libraries.",
          "**Extensibility** — pluggable fetchers (URL, file, content URI), decoders (JPEG, GIF, SVG, video frames), and transformations (crop, blur, rounded corners) — an open architecture so the library handles varied sources and effects.",
          "**Why use Coil/Glide, not hand-roll** — the real point: correct image loading requires all of the above (cache hierarchy, downsampling, threading, cancellation, dedup, lifecycle, bitmap pooling) done right, which is a lot of subtle work. Libraries have solved it; you use one. The *design exercise* is understanding *what they do and why*.",
        ],
      },
      {
        t: "note",
        text: "Image loader design: core = multi-tier cache (memory LruCache of decoded bitmaps = instant → disk cache of encoded bytes = persistent → network = source; populate as you go). Memory management (images cause OOM): DOWNSAMPLE to target size (a 4000px photo is ~48MB!), bound the cache, reuse bitmaps, use RGB_565 when possible. Threading: download+decode off-main, deliver on-main (else jank). Lifecycle/cancellation: cancel on view-recycle (the 'wrong image in a list' bug — tag/check target) and destroy (leaks); dedup identical in-flight requests. Components: request, cache, fetcher, decoder, lifecycle manager, dispatcher. Use Coil/Glide — they've solved this.",
      },
    ],
  },
];

export default content;
