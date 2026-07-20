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
  {
    level: "senior",
    q: "What are the core components of an image-loading library?",
    a: [
      {
        t: "p",
        text: "A *request* API (load(url).into(view)/AsyncImage), a *request manager* that dedupes and ties requests to a *lifecycle*/target, a *memory cache* (LRU of decoded bitmaps), a *disk cache* (encoded bytes), a *fetcher* (network/file/content source), a *decoder* (bytes → bitmap, with downsampling), a *transformation* pipeline (resize/crop/blur), a *thread pool* (off-main decode/fetch), and *target/callback* handling (set the bitmap, placeholder/error). Requests flow: check memory → disk → network, decode/transform, cache, deliver on main. Naming these components and the flow is the backbone of the answer.",
      },
      {
        t: "list",
        items: [
          "**Request API + manager** — dedupe, lifecycle-bound.",
          "**Memory + disk cache** — decoded bitmaps / encoded bytes.",
          "**Fetcher + decoder** — source bytes → downsampled bitmap.",
          "**Transformations + thread pool** — off-main; deliver on main.",
        ],
      },
      {
        t: "note",
        text: "Image loader components: request API + manager (dedupe, lifecycle-bound), memory cache (LRU decoded bitmaps), disk cache (encoded bytes), fetcher (network/file), decoder (bytes → downsampled bitmap), transformation pipeline, thread pool (off-main), target/callback (placeholder/error/set). Flow: memory → disk → network → decode/transform → cache → deliver on main.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does the memory cache work, and how do you size it?",
    a: [
      {
        t: "p",
        text: "The memory cache is an *LRU cache of decoded bitmaps* keyed by request (URL + size + transformations) — a hit means *instant* display with no decode. Size it as a *fraction of available heap* (e.g. ~1/4 or an amount from `ActivityManager.memoryClass`), measured in *bytes* (`sizeOf` = bitmap byte count), not entry count, since bitmaps vary hugely. Evict least-recently-used when full, and *trim* on `onTrimMemory`/low-memory. Too large → OOM/GC pressure; too small → excessive re-decoding. The key must include the *target size* so different sizes of the same URL don't collide.",
      },
      {
        t: "list",
        items: [
          "**LRU of decoded bitmaps** — keyed by URL+size+transforms.",
          "**Size** — fraction of heap, measured in bytes (`sizeOf`).",
          "**Evict LRU + trim** — on onTrimMemory.",
          "**Key includes size** — avoid cross-size collisions.",
        ],
      },
      {
        t: "note",
        text: "Memory cache = LRU of decoded bitmaps keyed by URL+size+transformations (hit = instant, no decode). Size as a fraction of heap in bytes (sizeOf = bitmap byteCount), not entry count (bitmaps vary). Evict LRU when full, trim on onTrimMemory. Too large → OOM/GC; too small → re-decoding. Key must include target size to avoid cross-size collisions.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does the disk cache differ from the memory cache?",
    a: [
      {
        t: "p",
        text: "The *disk cache* stores *encoded bytes* (the original JPEG/PNG/WebP) persistently, so images survive process death and avoid re-downloading (saving network/data). The *memory cache* stores *decoded bitmaps* for instant display but is volatile and small. On a request you check *memory first* (fastest — no decode), then *disk* (avoids network but must decode), then *network* (fetch + cache to disk + decode + cache in memory). The disk cache is *bounded* (LRU by bytes) and can respect *HTTP cache headers*. Two tiers because decode and download are different costs — memory saves decode, disk saves download.",
      },
      {
        t: "table",
        headers: ["", "Memory cache", "Disk cache"],
        rows: [
          ["Stores", "Decoded bitmaps", "Encoded bytes"],
          ["Persists", "No (volatile)", "Yes"],
          ["Saves", "Decode cost", "Download cost"],
          ["Size", "Small (heap fraction)", "Larger (disk)"],
        ],
      },
      {
        t: "note",
        text: "Disk cache: encoded bytes, persistent — survives process death, avoids re-download (saves network/data). Memory cache: decoded bitmaps, volatile, small — instant display, saves decode. Request order: memory → disk (decode) → network (fetch + cache both). Disk is bounded (LRU by bytes), can respect HTTP headers. Two tiers: memory saves decode, disk saves download.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why must image decoding and downsampling happen off the main thread?",
    a: [
      {
        t: "p",
        text: "Decoding an image (bytes → bitmap) is *CPU-intensive* and allocates *large amounts of memory* — doing it on the main thread would *block frames* (jank/ANR) while decoding, especially for big images. So the library decodes on a *background thread pool* and delivers the finished bitmap to the main thread to set on the view. *Downsampling* (decoding to the *target size*, not full resolution) also happens during decode — it drastically reduces memory and decode time. The rule: fetch and decode off-main, touch the UI only to display. Blocking the main thread with image work is a classic performance bug.",
      },
      {
        t: "list",
        items: [
          "**Decode** — CPU + memory heavy; blocks frames on main.",
          "**Background pool** — decode off-main, deliver to main.",
          "**Downsample** — decode to target size (less memory/time).",
          "**Rule** — fetch/decode off-main, UI only to display.",
        ],
      },
      {
        t: "note",
        text: "Decoding (bytes → bitmap) is CPU-intensive and allocates a lot — on the main thread it blocks frames (jank/ANR), especially for big images. Decode on a background thread pool, deliver the bitmap to main to set. Downsample (decode to target size, not full-res) cuts memory/decode time. Rule: fetch/decode off-main, touch UI only to display.",
      },
    ],
  },
  {
    level: "senior",
    q: "How would you support progressive/blur-up image loading?",
    a: [
      {
        t: "p",
        text: "Show a *low-quality preview* first, then swap in the full image — improving perceived speed. Techniques: *progressive JPEG* (decode partial passes as bytes arrive), a *tiny thumbnail/blurhash* embedded in the API response (decode instantly, blurred, as a placeholder), or loading a *small cached version* then the full one. Crossfade from preview to full. The blurhash/thumbnail approach is popular for feeds — the server sends a compact placeholder string, the client renders it immediately while the real image loads. This makes image-heavy screens feel instant even on slow networks.",
      },
      {
        t: "list",
        items: [
          "**Low-quality preview first** — then swap to full.",
          "**Techniques** — progressive JPEG, blurhash/thumbnail, small-then-full.",
          "**Blurhash** — compact placeholder string from the API.",
          "**Crossfade** — preview → full; feels instant.",
        ],
      },
      {
        t: "note",
        text: "Progressive/blur-up: show a low-quality preview first, then swap the full image. Techniques: progressive JPEG (decode partial passes), an embedded thumbnail/blurhash (compact placeholder string from the API, rendered instantly blurred), or small-cached-then-full. Crossfade preview → full. Blurhash is popular for feeds — makes image-heavy screens feel instant on slow networks.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you tie image requests to a lifecycle?",
    a: [
      {
        t: "p",
        text: "Associate each request with its *lifecycle* (Activity/Fragment/composable): *pause* loading when the screen stops and *cancel* requests when it's destroyed — so you don't waste network/CPU on off-screen work or leak the target. Libraries like Glide/Coil hook the *lifecycle owner* (or the composition) to do this automatically. In Compose, the loader keys off the composition — cancelling when the composable leaves. This prevents *leaks* (a completed request holding a destroyed view), *wasted work*, and *callbacks after teardown*. Lifecycle-awareness is essential for correctness and efficiency in a real app.",
      },
      {
        t: "list",
        items: [
          "**Bind to lifecycle** — Activity/Fragment/composition.",
          "**Pause on stop, cancel on destroy** — no wasted work.",
          "**Prevents** — leaks, callbacks after teardown.",
          "**Automatic** — Glide/Coil hook the lifecycle/composition.",
        ],
      },
      {
        t: "note",
        text: "Tie each request to its lifecycle (Activity/Fragment/composable): pause on stop, cancel on destroy — no wasted network/CPU on off-screen work, no leaked targets. Glide/Coil hook the lifecycle owner/composition automatically (Compose cancels when the composable leaves). Prevents leaks (completed request holding a destroyed view), wasted work, post-teardown callbacks. Essential for correctness + efficiency.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle memory pressure and onTrimMemory in the loader?",
    a: [
      {
        t: "p",
        text: "The loader should *respond to system memory signals*: on `onTrimMemory`/`onLowMemory`, *evict* (fully or partially, by level) the *memory cache* to release bitmaps the system can reclaim, reducing the chance the process is killed. On `TRIM_MEMORY_UI_HIDDEN` (app backgrounded) it can clear more aggressively (memory cache isn't needed off-screen). It keeps the *disk cache* (persistent, cheap to reload). The loader also *sizes* its memory cache relative to available heap and can shrink under pressure. Libraries (Glide/Coil) implement `ComponentCallbacks2` to do this. Responding to memory pressure is key to being a good citizen and avoiding OOM.",
      },
      {
        t: "list",
        items: [
          "**onTrimMemory/onLowMemory** — evict memory cache by level.",
          "**UI_HIDDEN** — clear aggressively (not needed off-screen).",
          "**Keep** — disk cache (cheap to reload).",
          "**ComponentCallbacks2** — how libraries implement it.",
        ],
      },
      {
        t: "note",
        text: "On memory pressure (onTrimMemory/onLowMemory), the loader evicts the memory cache (by level) to release reclaimable bitmaps (lowers kill risk); on TRIM_MEMORY_UI_HIDDEN it clears aggressively (off-screen). Keep the disk cache (cheap reload). Size the memory cache to available heap, shrink under pressure. Glide/Coil implement ComponentCallbacks2 for this — key to avoiding OOM and being a good citizen.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between fit/center-crop scaling and why does it matter for decoding?",
    a: [
      {
        t: "p",
        text: "*Fit/centerInside* scales the image to fit *within* the target (whole image visible, may letterbox); *centerCrop* scales to *fill* the target (crops overflow, no letterbox). This matters for *decoding* because the loader uses the *scale type + target size* to pick the *decode dimensions*: for centerCrop it decodes just enough to cover the target (then crops), for fit it decodes to fit — either way avoiding a giant bitmap. Getting the scale/size right ensures the decoded bitmap is *appropriately sized* (memory-efficient) and the displayed result is correct. The loader ties scale type into the downsampling computation.",
      },
      {
        t: "list",
        items: [
          "**Fit/centerInside** — whole image within target (may letterbox).",
          "**centerCrop** — fill target, crop overflow.",
          "**Affects decode** — dimensions chosen from scale + size.",
          "**Ensures** — appropriately-sized bitmap, correct result.",
        ],
      },
      {
        t: "note",
        text: "Fit/centerInside fits the whole image within the target (may letterbox); centerCrop fills the target and crops overflow. It affects decoding: the loader uses scale type + target size to choose decode dimensions (centerCrop decodes to cover, fit to fit) — avoiding a giant bitmap. Right scale/size = memory-efficient, correctly-displayed image. The loader ties scale type into downsampling.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you observe and debug an image loader's performance?",
    a: [
      {
        t: "p",
        text: "Track *cache hit rates* (memory/disk — low hits suggest bad keys or sizing), *decode times*, *memory usage* (Memory Profiler — bitmap allocations, cache size), and *jank* during scroll (system trace to see decode/main-thread work per frame). Log or expose *request lifecycle* events (start/cancel/complete/error) for debugging the wrong-image or leak issues. Watch for *OOM* and *GC churn* from oversized/uncached bitmaps. Coil/Glide offer debug logging. Use a real *release build on a low-end device* with a fast-scrolling image list as the benchmark. Instrumenting the cache and decode path turns 'images are slow' into a specific, fixable metric.",
      },
      {
        t: "list",
        items: [
          "**Cache hit rates** — memory/disk (keys/sizing).",
          "**Decode times + memory** — Memory Profiler, allocations.",
          "**Jank** — system trace decode/main-thread per frame.",
          "**Lifecycle logs + OOM/GC** — debug wrong-image/leaks.",
        ],
      },
      {
        t: "note",
        text: "Debug image-loader perf: cache hit rates (memory/disk — low = bad keys/sizing), decode times, memory (Memory Profiler — bitmap allocations, cache size), scroll jank (system trace: decode/main-thread per frame), request lifecycle logs (wrong-image/leaks), OOM/GC churn. Coil/Glide have debug logging. Benchmark on a release build, low-end device, fast-scrolling list. Instrumentation turns 'images are slow' into fixable metrics.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does the request deduplication work?",
    a: [
      {
        t: "p",
        text: "If multiple targets request the *same image* (same URL + size + transforms) *concurrently* (common in a grid), the library should *fetch/decode once* and deliver to all — not do N downloads. It maintains a map of *in-flight requests* keyed by the request signature; a new identical request *attaches* to the existing job rather than starting another. When it completes, all attached targets are updated (and the result cached). This saves network, CPU, and memory. Dedup plus the memory cache means the same image is loaded minimally. It's an important efficiency mechanism for image-heavy screens.",
      },
      {
        t: "list",
        items: [
          "**Same request concurrently** — fetch/decode once.",
          "**In-flight map** — new identical request attaches to the job.",
          "**On complete** — update all attached targets + cache.",
          "**Saves** — network, CPU, memory.",
        ],
      },
      {
        t: "note",
        text: "Dedup: concurrent identical requests (same URL+size+transforms) fetch/decode once, not N times. Keep an in-flight-requests map by signature; a new identical request attaches to the existing job; on completion all attached targets update and the result caches. Saves network/CPU/memory. With the memory cache, the same image loads minimally — key efficiency for image-heavy screens.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do placeholders, errors, and transitions work?",
    a: [
      {
        t: "p",
        text: "While loading, show a *placeholder* (a drawable/skeleton) so the layout is stable and the user sees progress. On *failure*, show an *error drawable* (and optionally allow retry). When the image arrives, apply a *transition* (crossfade) for a smooth appearance instead of a jarring pop. In a list, set the placeholder *immediately on (re)bind* (and clear the previous image) to avoid showing a stale/wrong image during load. These states (placeholder/error/success + transition) are part of the request API and matter for perceived quality — a good loader makes loading feel smooth.",
      },
      {
        t: "list",
        items: [
          "**Placeholder** — stable layout, progress feedback.",
          "**Error drawable** — on failure; optional retry.",
          "**Crossfade** — smooth appearance, no pop.",
          "**On rebind** — set placeholder, clear stale image.",
        ],
      },
      {
        t: "note",
        text: "Placeholder while loading (stable layout, progress), error drawable on failure (+ optional retry), crossfade transition on success (no jarring pop). In a list, set the placeholder immediately on rebind and clear the previous image to avoid a stale/wrong image during load. These states are part of the request API and drive perceived loading quality.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do transformations (resize, crop, blur) fit into the pipeline?",
    a: [
      {
        t: "p",
        text: "*Transformations* modify the decoded bitmap before display: resize/scale to fit, center-crop/circle-crop, rounded corners, blur, grayscale. They run *off the main thread* as a *pipeline* step after decode. Crucially, the *transformation is part of the cache key* — a circle-cropped 100px version is cached separately from the original, so you don't re-transform each time. Apply *cheap* transforms and be mindful that heavy ones (blur) cost CPU. Prefer *decoding to the needed size* over decoding large then scaling (saves memory). Transformations let you get exactly the displayed image while keeping caching correct.",
      },
      {
        t: "list",
        items: [
          "**Transforms** — resize, crop, corners, blur, grayscale.",
          "**Off-main** — pipeline step after decode.",
          "**Part of cache key** — cached per transformation.",
          "**Decode to size** — over decode-large-then-scale.",
        ],
      },
      {
        t: "note",
        text: "Transformations (resize, crop, rounded corners, blur, grayscale) modify the decoded bitmap off-main as a pipeline step after decode. The transformation is part of the cache key (a circle-cropped 100px version cached separately) so you don't re-transform. Prefer decoding to the needed size over decode-large-then-scale (memory). Heavy transforms (blur) cost CPU — apply mindfully.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle prefetching and priorities?",
    a: [
      {
        t: "p",
        text: "*Prefetching* loads images the user is *about to see* (upcoming list items during scroll) into the cache so they display instantly when scrolled to — improving perceived smoothness. Balance it against *data/battery* (don't prefetch aggressively on metered connections). *Priorities* let *visible* requests preempt *prefetch* ones — the currently-on-screen image should load before a speculative prefetch. The thread pool/scheduler orders requests by priority, and prefetches are *low priority* and *cancellable*. Together, prefetch + priority give a fast-feeling scroll without starving on-screen loads. Mention respecting data-saver settings.",
      },
      {
        t: "list",
        items: [
          "**Prefetch** — upcoming items into cache; instant on scroll.",
          "**Priority** — visible preempts prefetch.",
          "**Prefetch** — low priority, cancellable.",
          "**Balance** — data/battery; respect data-saver.",
        ],
      },
      {
        t: "note",
        text: "Prefetch upcoming images (next list items during scroll) into the cache for instant display; balance against data/battery (not aggressive on metered). Priorities let visible requests preempt speculative prefetches (on-screen loads first); prefetches are low-priority and cancellable. Together they give fast-feeling scroll without starving on-screen loads. Respect data-saver settings.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you support different image sources (network, file, resource)?",
    a: [
      {
        t: "p",
        text: "Abstract the source behind a *Fetcher* interface: the library inspects the *data type* (URL string, `File`, `Uri`, resource id, content provider) and picks the matching fetcher (HTTP fetcher, file fetcher, resource fetcher, content-resolver fetcher). Each returns *bytes/a stream* fed to the shared *decoder* and pipeline. This *pluggable* design means one API (`load(anything)`) handles many sources, and you can add custom fetchers (e.g. for a special protocol). It cleanly separates *where bytes come from* (fetcher) from *how they become a bitmap* (decoder) — a good extensibility point in the architecture.",
      },
      {
        t: "list",
        items: [
          "**Fetcher interface** — per source type.",
          "**Sources** — network, file, Uri, resource, content.",
          "**Returns bytes** — to the shared decoder.",
          "**Pluggable** — one API, add custom fetchers.",
        ],
      },
      {
        t: "note",
        text: "Abstract sources behind a Fetcher interface: inspect the data type (URL, File, Uri, resource id, content) and pick the matching fetcher (HTTP/file/resource/content), each returning bytes/a stream to the shared decoder + pipeline. Pluggable: one load(anything) API handles many sources, add custom fetchers. Separates where bytes come from (fetcher) from how they become a bitmap (decoder).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you decode efficiently (inSampleSize, region decoding)?",
    a: [
      {
        t: "p",
        text: "Use `BitmapFactory.Options`: first decode with `inJustDecodeBounds=true` to read the image's *dimensions without allocating*, compute an `inSampleSize` (power-of-two subsample) so the decoded size is *just above the target*, then decode for real — this avoids allocating a huge bitmap. Choose `inPreferredConfig` (RGB_565 if no alpha) to halve memory. For *very large images* (viewing a huge photo/map), use `BitmapRegionDecoder` to decode *only the visible region* at higher detail. These techniques minimize memory and decode time — the difference between smooth and OOM. Efficient decoding is the heart of a good image loader.",
      },
      {
        t: "list",
        items: [
          "**Bounds first** — `inJustDecodeBounds` (no allocation).",
          "**`inSampleSize`** — subsample to just above target.",
          "**`inPreferredConfig`** — RGB_565 to halve memory.",
          "**Region decode** — only visible region for huge images.",
        ],
      },
      {
        t: "note",
        text: "Efficient decode: read dimensions with inJustDecodeBounds=true (no allocation), compute inSampleSize (power-of-two) so decoded size is just above target, then decode. Set inPreferredConfig=RGB_565 if no alpha (half memory). For huge images use BitmapRegionDecoder (decode only the visible region). Minimizes memory + decode time — the difference between smooth and OOM.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you make the image loader thread pool efficient?",
    a: [
      {
        t: "p",
        text: "Use *separate, bounded thread pools* for different work: network fetching (I/O-bound, can have more threads) and decoding (CPU-bound, size ~ number of cores). Bounding prevents *too many concurrent decodes* exhausting memory (each in-flight decode allocates a bitmap) or starving the app. Add a *priority queue* so visible/high-priority requests run first, support *cancellation* (skip cancelled work), and reuse threads (a pool, not new threads per request). Coroutines with appropriate dispatchers (IO for fetch, a bounded Default-like for decode) model this well. Right-sized pools keep throughput high without OOM or contention.",
      },
      {
        t: "list",
        items: [
          "**Separate pools** — I/O fetch vs CPU decode.",
          "**Bounded** — decode pool ~ cores; avoid concurrent-decode OOM.",
          "**Priority queue + cancellation** — visible first, skip cancelled.",
          "**Reuse threads** — pool, not per-request.",
        ],
      },
      {
        t: "note",
        text: "Efficient pools: separate bounded pools for network fetch (I/O, more threads) and decode (CPU, ~cores). Bounding prevents too many concurrent decodes exhausting memory or starving the app. Priority queue (visible first), cancellation (skip cancelled), thread reuse (pool). Coroutines with IO (fetch) + bounded (decode) dispatchers model this. Right-sized pools = high throughput without OOM/contention.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does the cache key get computed, and why does it matter?",
    a: [
      {
        t: "p",
        text: "The cache key must uniquely identify the *exact bitmap requested* — typically a hash of the *source (URL)* + *target size* + *transformations* + relevant options. This matters because the *same URL at different sizes or with different transforms produces different bitmaps* — if the key ignored size, a small thumbnail and a large image would collide (wrong image or wasted memory). Memory cache keys include the decoded parameters; disk cache keys usually key the *original bytes* by URL (before transform). A correct key is essential for cache *correctness* (no wrong hits) and *effectiveness* (proper reuse).",
      },
      {
        t: "list",
        items: [
          "**Key** — URL + size + transformations + options.",
          "**Why** — same URL, different size/transform = different bitmap.",
          "**Wrong key** — collisions (wrong image / wasted memory).",
          "**Disk** — often keys original bytes by URL.",
        ],
      },
      {
        t: "note",
        text: "The cache key uniquely identifies the exact requested bitmap — a hash of source URL + target size + transformations + options. Matters because the same URL at different sizes/transforms is a different bitmap; ignoring size collides (wrong image/wasted memory). Memory keys include decoded params; disk usually keys original bytes by URL. A correct key ensures cache correctness (no wrong hits) and reuse.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle animated images (GIF, WebP) and their memory cost?",
    a: [
      {
        t: "p",
        text: "Animated images are *multi-frame* — decoding all frames into memory is expensive, so use a *drawable that decodes frames on demand* (`AnimatedImageDrawable` / `ImageDecoder` on modern Android, or the library's animated support) and *drive the animation* frame-by-frame, releasing frames not shown. Cache the *encoded* animation (disk) rather than all decoded frames (memory). *Pause* animation when off-screen/backgrounded to save CPU/battery. Be cautious with many animated images in a list (each animating costs CPU). Treat them as a special decoder path with careful memory/CPU management — they can dwarf static-image costs.",
      },
      {
        t: "list",
        items: [
          "**Multi-frame** — decode on demand, don't hold all frames.",
          "**`AnimatedImageDrawable`/ImageDecoder** — frame-by-frame.",
          "**Cache encoded** — not all decoded frames.",
          "**Pause off-screen** — save CPU/battery; careful in lists.",
        ],
      },
      {
        t: "note",
        text: "Animated images (GIF/WebP) are multi-frame — don't decode all frames to memory. Use a frame-on-demand drawable (AnimatedImageDrawable/ImageDecoder or the library's support), cache the encoded animation (disk) not decoded frames, and pause animation off-screen/backgrounded (CPU/battery). Many animating images in a list are costly. A special decoder path with careful memory/CPU management.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you integrate an image loader with Compose?",
    a: [
      {
        t: "p",
        text: "Use the Compose API (Coil's `AsyncImage`/`rememberAsyncImagePainter`): it *launches the request tied to the composition*, exposes *loading/success/error* states you can render (placeholder/error composables), and *cancels* when the composable leaves. Pass the *target size* (Compose can provide it via the layout) so it downsamples correctly. It recomposes when the state changes. Under the hood it's the same caching/decoding engine, adapted to Compose's declarative model and lifecycle. This gives declarative image loading with automatic cancellation and state handling — the idiomatic Compose approach.",
      },
      {
        t: "list",
        items: [
          "**`AsyncImage`** — request tied to composition.",
          "**States** — loading/success/error composables.",
          "**Cancels** — when the composable leaves.",
          "**Target size** — from layout; same engine underneath.",
        ],
      },
      {
        t: "note",
        text: "In Compose, use Coil's AsyncImage/rememberAsyncImagePainter: launches the request tied to the composition, exposes loading/success/error states (placeholder/error composables), cancels when the composable leaves, and takes a target size (from layout) to downsample. Same caching/decoding engine adapted to Compose's declarative model — idiomatic declarative loading with auto-cancellation.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle network fetching efficiently in the loader?",
    a: [
      {
        t: "p",
        text: "Reuse a *shared HTTP client* (OkHttp) with *connection pooling* and *HTTP caching* (respect cache-control/ETags to avoid re-downloading), support *cancellation* (cancel the call when the request is cancelled), and handle *retries/timeouts* sensibly. Stream the response to the *disk cache* while decoding (don't buffer huge images fully in memory if avoidable). Coalesce with *dedup* so one URL fetches once. Consider *modern formats* (WebP/AVIF — smaller) and requesting *sized* images from a CDN. Efficient fetching (pooled, cached, cancellable) minimizes data and latency — important on mobile networks.",
      },
      {
        t: "list",
        items: [
          "**Shared OkHttp** — pooling + HTTP caching (ETags).",
          "**Cancellation** — cancel the call on request cancel.",
          "**Stream to disk** — avoid buffering huge images in memory.",
          "**Dedup + CDN-sized + WebP** — less data/latency.",
        ],
      },
      {
        t: "note",
        text: "Efficient fetching: shared OkHttp client (connection pooling + HTTP caching, respect ETags), cancellation (cancel the call), sensible retries/timeouts, stream to disk cache while decoding (don't fully buffer huge images), dedup (one URL fetches once), modern formats (WebP/AVIF), CDN-sized images. Pooled/cached/cancellable fetching minimizes data + latency on mobile networks.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test an image-loading library?",
    a: [
      {
        t: "p",
        text: "Unit-test the *pieces* with fakes: cache LRU eviction/sizing, the cache-key computation, the fetcher/decoder selection, and dedup logic. Test the *request lifecycle* (cancellation on rebind/lifecycle, the wrong-image guard) deterministically by driving a fake target and controlling completion timing. Use a *fake HTTP source* (MockWebServer/mock fetcher) to test fetch → cache → decode without real network. Integration-test on a device for *actual decode/memory* behavior. Also test *edge cases* (corrupt image → error state, OOM handling, huge image downsampling). Testability comes from clean component boundaries (fetcher/decoder/cache interfaces).",
      },
      {
        t: "list",
        items: [
          "**Unit** — cache LRU, key, fetcher/decoder selection, dedup.",
          "**Lifecycle** — cancellation, wrong-image guard (fake target/timing).",
          "**Fake HTTP** — fetch→cache→decode without network.",
          "**Edge cases** — corrupt image, OOM, downsampling.",
        ],
      },
      {
        t: "note",
        text: "Test the pieces with fakes: cache LRU/sizing, cache-key computation, fetcher/decoder selection, dedup. Test the request lifecycle (cancellation on rebind/lifecycle, wrong-image guard) via a fake target + controlled completion timing. Fake HTTP (MockWebServer) for fetch→cache→decode. Device integration test for real decode/memory. Edge cases: corrupt image, OOM, downsampling. Testability from clean component interfaces.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you decide the target size to decode to?",
    a: [
      {
        t: "p",
        text: "Decode to the *size the image will be displayed at* — the target `ImageView`/composable's measured dimensions — not the source resolution. The loader *measures the target* (or you specify a size), then computes the subsample so the decoded bitmap is just large enough. This is the *single biggest memory/perf win*: a 4000px photo shown in a 200px thumbnail should decode to ~200px (~0.16MB) not 48MB. In lists, the item size is known/consistent, making this easy. If the target size isn't known yet (async layout), the loader waits for measurement. Always size to the *display*, never the *source*.",
      },
      {
        t: "list",
        items: [
          "**Decode to display size** — target view/composable dims.",
          "**Biggest win** — 4000px→200px = ~0.16MB not 48MB.",
          "**Measure target** — or specify size; wait for layout if async.",
          "**Never** — decode at source resolution.",
        ],
      },
      {
        t: "note",
        text: "Decode to the display size (target view/composable dimensions), not source resolution — measure the target (or specify), compute the subsample so the bitmap is just large enough. The single biggest memory/perf win: a 4000px photo in a 200px thumbnail should decode to ~200px (~0.16MB) not 48MB. In lists item size is known. Wait for measurement if async. Size to display, never source.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle errors and retries in image loading?",
    a: [
      {
        t: "p",
        text: "On failure (network error, decode failure, 404), show the *error drawable* and don't crash. Distinguish *transient* errors (network — worth *retrying* with backoff, or on reconnect) from *permanent* ones (404/corrupt — don't retry). Offer *manual retry* (tap to reload) where appropriate. Avoid *retry storms* in a list (don't hammer failing URLs). *Cache negative results* briefly to avoid re-requesting a known-bad URL repeatedly. For decode OOM, catch it and fail gracefully (or retry with a smaller sample size). Graceful, bounded error handling keeps a scrolling list stable even when some images fail.",
      },
      {
        t: "list",
        items: [
          "**Error drawable** — never crash.",
          "**Transient vs permanent** — retry network, not 404/corrupt.",
          "**Bounded** — no retry storms; cache negatives briefly.",
          "**OOM** — catch, fail gracefully / smaller sample.",
        ],
      },
      {
        t: "note",
        text: "Image errors: show an error drawable (never crash), distinguish transient (network — retry with backoff/on reconnect) from permanent (404/corrupt — don't retry), offer manual retry, avoid retry storms in lists (cache negatives briefly), and catch decode OOM (fail gracefully or retry smaller sample). Graceful, bounded error handling keeps a scrolling list stable when some images fail.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why is request cancellation important in an image loader?",
    a: [
      {
        t: "p",
        text: "Cancellation avoids *wasted work and bugs* when a request is no longer needed — a fast-scrolling list can create and discard many requests, and a screen can be closed mid-load. Cancelling *stops the fetch/decode* (freeing network, CPU, threads for the requests that matter), prevents *setting a stale image* on a recycled view, and avoids *leaks* (a completed request holding a destroyed target). The loader cancels on *rebind* (view reused), *recycle*, and *lifecycle end*. Without cancellation, a scroll through 100 items could keep decoding all of them, starving the visible ones and thrashing memory. It's essential for both correctness and efficiency.",
      },
      {
        t: "list",
        items: [
          "**Stops fetch/decode** — frees network/CPU/threads.",
          "**Prevents** — stale image on recycled view, leaks.",
          "**Cancels on** — rebind, recycle, lifecycle end.",
          "**Without it** — decode everything, starve visible items.",
        ],
      },
      {
        t: "note",
        text: "Cancellation avoids wasted work + bugs when a request isn't needed (fast scroll, closed screen): it stops the fetch/decode (frees network/CPU/threads for what matters), prevents setting a stale image on a recycled view, and avoids leaks (completed request holding a destroyed target). Cancel on rebind/recycle/lifecycle end. Without it, scrolling decodes everything, starving visible items. Essential for correctness + efficiency.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the trade-offs of building versus using an existing image loader?",
    a: [
      {
        t: "p",
        text: "In practice you'd *use* a mature library (Coil, Glide, Fresco) — they've solved caching, decoding, lifecycle, cancellation, and edge cases battle-tested across devices; building your own means reinventing all of that plus ongoing maintenance. The interview asks you to *design* one to test your understanding of the *concepts* (caching tiers, memory, threading, cancellation), not to advocate building it. Mention you'd use an existing one in reality, and note *why* (correctness, maintenance, device coverage), while demonstrating you *understand what's inside*. Choosing Coil (lightweight, Kotlin/coroutines/Compose-first) vs Glide (mature, feature-rich) is a reasonable real answer.",
      },
      {
        t: "list",
        items: [
          "**Use a library** — Coil/Glide/Fresco (battle-tested).",
          "**Building** — reinvents caching/decode/lifecycle + maintenance.",
          "**Interview** — tests concept understanding, not build advocacy.",
          "**Real** — Coil (Kotlin/Compose) vs Glide (mature).",
        ],
      },
      {
        t: "note",
        text: "In reality, use a mature library (Coil/Glide/Fresco) — they've solved caching/decode/lifecycle/cancellation/edge-cases across devices; building your own reinvents all that plus maintenance. The interview asks you to design one to test concept understanding (cache tiers, memory, threading, cancellation), not to advocate building. Say you'd use Coil (Kotlin/coroutines/Compose) or Glide, while showing you know what's inside.",
      },
    ],
  },
];

export default qa;
