// Design an Image-Loading Library — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is the cache hierarchy in an image-loading library?",
    a: [
      {
        t: "p",
        text: "**It's a multi-tier cache — memory → disk → network — where you check the fastest cache first and fall back to slower ones, populating them as you go. This makes cached images display instantly and avoids redundant downloads/decodes.**",
      },
      {
        t: "list",
        items: [
          "**Memory cache (fastest)** — an in-memory `LruCache` of *decoded Bitmaps*, keyed by URL. A hit displays the image *instantly* (no I/O, no decoding), which is what makes list scrolling smooth. It's bounded (a fraction of the app's memory) and evicts least-recently-used entries when full.",
          "**Disk cache (persistent)** — the *encoded* image bytes (the downloaded file) stored on disk, surviving app restarts. Slower than memory (needs disk I/O + decoding) but avoids re-downloading. Also LRU-bounded.",
          "**Network (source)** — download only if the image isn't in either cache; then populate *both* caches so the next request is fast.",
        ],
      },
      {
        t: "p",
        text: "The design rationale is that each tier trades off differently: memory holds *decoded* bitmaps (instant to display but volatile and large in RAM), disk holds *encoded* bytes (compact and persistent but needs decoding), and the network is the slow source of truth. So you check memory (instant), then disk (fast, avoids re-download), then network (last resort), and when you fetch from a slower tier you populate the faster ones. This hierarchy is the core of why image loaders feel fast — the same image scrolled past twice loads instantly the second time from the memory cache, and even after an app restart it loads from disk without re-downloading. Coil and Glide both implement exactly this memory+disk+network hierarchy.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why do images cause OutOfMemoryError, and how do you prevent it?",
    a: [
      {
        t: "p",
        text: "**Because a *decoded* bitmap is enormous in memory — far larger than its file size — and loading full-size images into small views wastes huge amounts of memory. The prevention is *downsampling*: decode the image only to the size the view actually needs.**",
      },
      {
        t: "list",
        items: [
          "**Why they're huge**: a decoded bitmap uses ~4 bytes per pixel (ARGB_8888), so a 4000×3000 photo is ~48MB in memory — regardless of the JPEG file being only a few MB (JPEG is compressed; the decoded bitmap is not). Load several full-size images and you exhaust the app's memory budget → OOM crash.",
          "**The wasteful mistake**: decoding a 4000px image to display in a 200px thumbnail loads the full 48MB when you only need ~0.5MB — wasting ~99% of the memory for pixels the view can't even show.",
        ],
      },
      {
        t: "list",
        items: [
          "**Downsample to target size** — the key fix. Decode the bitmap at the *view's* resolution, not the source's, using `BitmapFactory.Options.inSampleSize` (or the modern `ImageDecoder`). This alone prevents most image OOMs.",
          "**Bound the memory cache** — size the `LruCache` to a fraction of available memory and evict LRU when full, so it never grows unbounded.",
          "**Use RGB_565 when alpha isn't needed** — 2 bytes/pixel instead of 4, halving memory (slight quality trade-off).",
          "**Reuse bitmap memory** (`inBitmap`) — advanced, reduces GC churn during scrolling.",
        ],
      },
      {
        t: "p",
        text: "The core principle is *never hold more bitmap memory than the display actually needs* — decode to display size, bound the cache, and reuse memory. Images are the #1 cause of OOM on Android precisely because their decoded size is so large and easy to over-allocate. This is also a big reason to use a library (Coil/Glide) rather than hand-decoding: they downsample automatically based on the target view size, so you get memory-safe image loading without manually computing sample sizes — a naive `BitmapFactory.decodeStream` into a small ImageView loads the full-size bitmap and OOMs on large images.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why does image loading need to be off the main thread?",
    a: [
      {
        t: "p",
        text: "**Because both *downloading* (network I/O) and *decoding* (turning compressed bytes into a bitmap, which is CPU-intensive) are slow operations, and doing them on the main thread would block it — causing jank (dropped frames) or an ANR. So the download and decode happen on a background thread, and only the final bitmap is delivered to the main thread to update the view.**",
      },
      {
        t: "list",
        items: [
          "**Downloading** is network I/O — potentially slow and variable (especially on a poor connection). Blocking the main thread on it freezes the UI.",
          "**Decoding** is CPU-heavy — decompressing a JPEG and building a bitmap takes real time, especially for large images. Doing it on the main thread during scrolling drops frames.",
          "**The pattern**: download + decode on a background thread (coroutines with `Dispatchers.IO`, or a thread pool), then deliver the finished bitmap on `Dispatchers.Main` to set it on the view.",
        ],
      },
      {
        t: "p",
        text: "This is why a naive `imageView.setImageBitmap(BitmapFactory.decodeStream(URL(url).openStream()))` on the main thread is wrong — it does network I/O *and* decoding on the UI thread, freezing the app (and it'd throw `NetworkOnMainThreadException` for the network part). The correct flow moves the slow work off-main and only touches the view (which must be on-main) at the end. It connects directly to the general 'never block the main thread' principle — the main thread must stay free to render frames and handle input, so anything slow (I/O, decoding, computation) goes to a background thread. Image loaders handle this threading internally, which is another reason to use one.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle request cancellation and the 'wrong image in a list' bug?",
    a: [
      {
        t: "p",
        text: "**You cancel a request when its target is no longer valid — when a view is recycled (scrolled away) or its lifecycle owner is destroyed — and you *tag* the target so a completing request verifies it's still the intended one before setting the image. The 'wrong image in a list' bug happens when a stale in-flight request sets its image on a view that's since been recycled to show a different item.**",
      },
      {
        t: "list",
        items: [
          "**The bug explained**: in a RecyclerView/LazyColumn, view A starts loading image X (in-flight). The user scrolls, and view A is *recycled* to now display item B, which loads image Y. If image X's request completes *after* the recycle and naively sets its bitmap, you see image X on item B's row — the wrong image flashes in. It's a race between the async load and view recycling.",
          "**Fix part 1 — cancel on rebind**: when a view is rebound to a new item (recycled), *cancel* its previous in-flight request. So when view A is reused for item B, A's request for image X is cancelled — it won't complete and set the wrong image. This is the primary fix.",
          "**Fix part 2 — tag/verify the target**: tag the view (or request) with the URL/request-id it's currently loading. When a request completes, it checks the target *still* wants *this* image (the tag matches) before setting it; if the view has been rebound to something else, the stale result is discarded. This guards against races the cancellation might miss.",
        ],
      },
      {
        t: "list",
        items: [
          "**Lifecycle cancellation (leaks + waste)**: beyond recycling, a request must be cancelled when its lifecycle owner (Activity/Fragment/composition) is *destroyed* — otherwise you waste work loading an image nobody will see, and risk *leaking* the destroyed context/view the request holds. So requests are scoped to the target's lifecycle and cancelled when it ends. Coil integrates with the Android lifecycle for this; in Compose, `AsyncImage` ties to the composition and cancels when it leaves.",
          "**Structured cancellation with coroutines**: modeling each load as a *cancellable coroutine* scoped to the target makes this natural — rebinding cancels the old coroutine, destruction cancels the scope. The download and decode check for cancellation and stop promptly, freeing resources.",
          "**Request dedup (related concurrency concern)**: if the *same* URL is requested by multiple views or while already loading, dedup the in-flight request so the download/decode happens *once* and all targets receive the result — saving bandwidth and CPU. This interacts with cancellation (a shared request isn't cancelled while another target still wants it).",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the 'wrong image in a list' bug is the canonical example of an *async operation racing with view recycling* — a fundamental challenge whenever you have long-running work tied to reusable UI. The robust solution has two layers: *cancel* the stale request when the view is rebound (so it never completes), and *verify the target* on completion (so even a race that slips through doesn't set the wrong image). Both are needed because cancellation isn't instantaneous and races can occur. More broadly, every image request must be *lifecycle-scoped* — cancelled on view-recycle *and* on lifecycle destruction — to avoid both the wrong-image bug and memory leaks/wasted work, which coroutines' structured cancellation models cleanly (scope the load to the target; rebinding or destruction cancels it). Adding request *dedup* handles the concurrency dimension (same image requested multiple times → load once). Understanding that this is fundamentally a *race between async loads and recyclable views*, and that the fix is *cancel-on-rebind + verify-on-complete + lifecycle-scoping*, is exactly the depth this question tests — it's the same class of problem as the callback-stale-capture and coroutine-cancellation concerns elsewhere, applied to image loading. And it reinforces *why* you use Coil/Glide: they solve this correctly, and hand-rolling it is where the subtle wrong-image and leak bugs creep in.",
      },
    ],
  },
  {
    level: "senior",
    q: "Design the overall architecture of an image-loading library. What are the components?",
    a: [
      {
        t: "p",
        text: "**I'd decompose it into: a *request* model, a *cache* subsystem (memory + disk), a *fetcher* (gets the raw bytes), a *decoder* (bytes → downsampled bitmap), a *lifecycle/cancellation* manager, a *dispatcher* (threading), and pluggable *transformations* — orchestrated by a loader that runs the request through the cache hierarchy with proper threading and lifecycle handling. This mirrors how Coil and Glide are actually structured.**",
      },
      {
        t: "list",
        items: [
          "**Request** — models a single load: the source (URL/file/resource), the *target* (ImageView/Composable), the *target size*, transformations, placeholder/error images, and the lifecycle owner. This captures everything needed to fulfill and cancel one load.",
          "**Cache subsystem** — the multi-tier cache: a *memory cache* (`LruCache` of decoded bitmaps, bounded, for instant hits) and a *disk cache* (LRU of encoded bytes, persistent, avoids re-download). The loader checks memory → disk → network and populates back up.",
          "**Fetcher** — retrieves the raw *encoded bytes* from the source, pluggable per source type: a network fetcher (OkHttp/Ktor with the disk cache), a file fetcher, a content-URI fetcher, a resource fetcher. Extensibility comes from registering fetchers for different source types.",
          "**Decoder** — turns encoded bytes into a *bitmap*, *downsampled to the target size* (the memory-safety step), pluggable per format (JPEG/PNG, GIF, SVG, video-frame, etc.). Applies the target size and config (RGB_565 etc.).",
          "**Transformations** — pluggable post-decode effects (resize, center-crop, rounded corners, blur, grayscale) applied to the bitmap, and factored into the cache key (a transformed image is a distinct cache entry).",
          "**Dispatcher / threading** — runs fetch + decode off the main thread (coroutine dispatchers or a thread pool) and delivers the result on the main thread. Manages concurrency limits (don't decode 100 images at once).",
          "**Lifecycle/cancellation manager** — ties each request to its target's/owner's lifecycle, cancels on view-recycle and destruction, and handles request dedup (identical in-flight requests share one execution).",
        ],
      },
      {
        t: "list",
        items: [
          "**The orchestration (the load flow)**: `load(request)` → compute the cache key (URL + size + transformations) → check *memory cache* (instant deliver if hit) → else launch a *cancellable* coroutine scoped to the request's lifecycle → check *disk cache*, else *fetch* from network (deduped, populating disk) → *decode* downsampled to target size → apply *transformations* → populate *memory cache* → deliver on *main thread* *if the target is still valid* (tag check). Placeholder shows during load; error image on failure.",
          "**Design qualities**: the *pluggable* fetchers/decoders/transformations make it an *open, extensible* architecture (handle new sources/formats/effects without changing the core). The *cache key* (source + size + transformations) ensures correctness (differently-sized or transformed versions are distinct entries). The *separation of concerns* (fetch vs decode vs cache vs threading vs lifecycle) makes each part testable and replaceable.",
          "**Trade-offs to mention**: memory cache size (bigger = more hits but more RAM pressure — tune to the memory budget); disk cache size (persistence vs storage); RGB_565 vs ARGB_8888 (memory vs quality); how aggressively to preload/prefetch (smoother scrolling vs wasted bandwidth). And the meta-trade-off: you'd *use Coil/Glide*, not build this — the exercise is understanding the design, because getting all these pieces right (especially memory management, cancellation, and the cache hierarchy) is substantial, subtle work the libraries have already solved.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: designing an image loader is really about *decomposing a deceptively-simple task ('show this URL as an image') into the concerns it actually involves* — caching (the multi-tier hierarchy for speed), memory management (downsampling + bounded caches to avoid OOM), threading (off-main fetch/decode, on-main delivery, to avoid jank), lifecycle/cancellation (scope to the target, cancel on recycle/destroy, to avoid the wrong-image bug and leaks), and extensibility (pluggable fetchers/decoders/transformations). The clean architecture separates these into composable components (request, cache, fetcher, decoder, dispatcher, lifecycle manager, transformations) orchestrated by a loader that runs the cache hierarchy with correct threading and lifecycle. The *cache key* (source + size + transformations) is a subtle but crucial correctness detail. This decomposition mirrors the real libraries because those concerns are intrinsic to the problem — which is exactly why the question is a good test: it reveals whether you understand that 'load an image' encompasses caching, memory, threading, and lifecycle, and can architect a clean separation of those concerns. And the honest conclusion — that you'd *use* Coil/Glide because this is solved, hard work — demonstrates the judgment to not reinvent solved problems while understanding *why* they're designed as they are. Demonstrating the component decomposition, the orchestrated load flow, the cache-key correctness detail, the trade-offs, and the use-a-library conclusion is the comprehensive senior answer.",
      },
    ],
  },
];

export default qa;
