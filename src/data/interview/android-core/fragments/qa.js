// Fragments — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is a Fragment and why do Fragments exist?",
    a: [
      {
        t: "p",
        text: "**The concept**: a Fragment is a reusable, modular piece of UI with its own lifecycle and layout that lives *inside* an Activity. It's like a sub-screen or UI component hosted by an Activity — it can't exist on its own. You add it to a container in the Activity via the `FragmentManager`.",
      },
      {
        t: "p",
        text: "**Why they exist**: two main reasons. First, **adaptive layouts for different screen sizes** — on a tablet you might show a list Fragment and a detail Fragment side by side, while on a phone you show them one at a time; Fragments let you compose the same UI pieces differently per device. Second, **reusable UI and single-Activity navigation** — instead of one Activity per screen (heavy, manifest-declared, awkward to share state), you have one Activity hosting many Fragments that you navigate between, sharing an activity-scoped ViewModel. Modern Android favors this single-Activity architecture with the Navigation component. With Jetpack Compose, Fragments become optional (Compose destinations replace them), but they remain everywhere in existing codebases.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a Fragment and an Activity?",
    a: [
      {
        t: "list",
        items: [
          "**Ownership/management**: an Activity is an app entry point managed by the *OS* and declared in the manifest; a Fragment is a UI module managed by *your* `FragmentManager` and not in the manifest. Fragments live inside Activities.",
          "**Weight**: Activities are heavier (full window, OS-tracked); Fragments are lighter UI components you can add, remove, and swap within one Activity.",
          "**Multiplicity**: one Activity can host many Fragments simultaneously (multi-pane layouts) or swap them (navigation), enabling single-Activity architecture.",
          "**Lifecycle**: both have lifecycles, but a Fragment has *two* (instance and view), and its lifecycle is tied to — but distinct from — its host Activity's.",
        ],
      },
      {
        t: "p",
        text: "The practical takeaway: use Activities as coarse app entry points (often just one, or a few), and Fragments (or Compose destinations) as the actual screens within them. This gives simpler shared state (activity-scoped ViewModels), smoother transitions, and a cleaner manifest than one-Activity-per-screen. The main cost is Fragment lifecycle complexity — especially the two-lifecycle issue — which is why they have a reputation for being tricky.",
      },
    ],
  },
  {
    level: "junior",
    q: "Where should you set up UI and observe data in a Fragment — onCreateView, onViewCreated, or onCreate?",
    a: [
      {
        t: "p",
        text: "**Set up UI and observe data in `onViewCreated`.** The reasoning: `onCreate` runs before the view exists (so you can't touch views there); `onCreateView` is specifically for *creating/inflating* the view hierarchy and returning it (with ViewBinding, this is where you inflate); and `onViewCreated` runs right after, when the view is fully created and ready — the correct place to configure views, set click listeners, and start observing data to render into the view.",
      },
      {
        t: "code",
        title: "The standard structure",
        code: `override fun onCreateView(inflater, container, saved): View {
    _binding = FragmentBinding.inflate(inflater, container, false)
    return binding.root                       // just create the view
}

override fun onViewCreated(view: View, saved: Bundle?) {
    super.onViewCreated(view, saved)
    binding.button.setOnClickListener { }     // configure views here
    viewLifecycleOwner.lifecycleScope.launch { // observe data here
        viewModel.uiState.collect { render(it) }
    }
}

override fun onDestroyView() {
    super.onDestroyView()
    _binding = null                            // avoid leaking the view
}`,
      },
      {
        t: "p",
        text: "And crucially, when observing, use `viewLifecycleOwner` (not `this`), because the observation should be tied to the *view's* lifetime, not the Fragment instance's. Do fragment-instance-level setup (that doesn't touch views) in `onCreate`, and view-level setup in `onViewCreated`.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do two Fragments communicate with each other?",
    a: [
      {
        t: "p",
        text: "**The modern, recommended way is a shared ViewModel** — scope a ViewModel to the host Activity (or a navigation graph) with `by activityViewModels()`, so both Fragments get the *same* ViewModel instance and communicate through its shared state. Fragment A updates the ViewModel's state; Fragment B observes it. This is clean, lifecycle-safe, and decoupled — neither Fragment references the other.",
      },
      {
        t: "list",
        items: [
          "**Shared ViewModel** (`activityViewModels()` or nav-graph-scoped) — for ongoing shared state between Fragments. The go-to approach.",
          "**Fragment Result API** — `setFragmentResult(key, bundle)` and `setFragmentResultListener(key) { }` — for one-off results, like a picker Fragment returning a selection to the Fragment that launched it. Replaces the old callback-interface pattern.",
          "**Navigation component with arguments** — for passing data when navigating from one Fragment to another (type-safe args).",
        ],
      },
      {
        t: "p",
        text: "What to *avoid*: direct references from one Fragment to another (tight coupling, and lifecycle hazards since Fragments come and go), and the old pattern where a Fragment defines a callback interface that the Activity implements to relay messages (boilerplate and leak-prone). The principle is the same as elsewhere in Android — communicate through shared state or explicit result channels, not direct object references.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain the difference between a Fragment's lifecycle and its view lifecycle, and why it matters.",
    a: [
      {
        t: "p",
        text: "**A Fragment has two distinct lifecycles: the *instance* lifecycle (`onCreate` → `onDestroy`, tracking the Fragment object) and the *view* lifecycle (`onCreateView` → `onDestroyView`, tracking its UI). The critical fact is that the view can be destroyed and recreated while the Fragment instance stays alive.** This happens on the back stack: when you navigate away from a Fragment that's added to the back stack, Android calls `onDestroyView` to tear down its view (freeing memory) but does *not* call `onDestroy` — the Fragment instance is retained. Navigate back, and `onCreateView` runs again, creating a *brand-new view* for the *same* Fragment instance.",
      },
      {
        t: "list",
        items: [
          "**Why it matters — leaks and crashes**: if you observe data or hold references using the Fragment's *own* lifecycle (`this`), those observers survive across `onDestroyView`. So when you return to the Fragment, you have the old observer (still trying to update the *destroyed* view — crash, or a leak of that view) *plus* a new observer registered in the new `onViewCreated` — duplicate observers, one of them pointed at a dead view.",
          "**The fix — `viewLifecycleOwner`**: for anything view-related (observing LiveData/Flow, updating views), use `viewLifecycleOwner`, whose lifecycle matches the *view* (created in `onCreateView`, destroyed in `onDestroyView`). Then observers are automatically removed in `onDestroyView`, so there's exactly one live observer tied to the current view, and none pointing at destroyed views.",
          "**The ViewBinding corollary**: a ViewBinding holds references to the view hierarchy, so keeping it past `onDestroyView` leaks the whole destroyed view. The standard pattern is a nullable backing field set to null in `onDestroyView` (`_binding = null`), forcing you to only access the binding while the view exists.",
        ],
      },
      {
        t: "code",
        title: "The bug the two-lifecycle distinction causes",
        code: `// BUG: 'this' (fragment lifecycle) outlives the view
lifecycleScope.launch { viewModel.data.collect { binding.text.text = it } }
// After back-stack return: old collector alive (binding is stale/null) + new one

// CORRECT: viewLifecycleOwner matches the view
viewLifecycleOwner.lifecycleScope.launch {
    viewLifecycleOwner.repeatOnLifecycle(STARTED) {
        viewModel.data.collect { binding.text.text = it }
    }
}`,
      },
      {
        t: "p",
        text: "**The senior framing**: the two lifecycles exist because Fragments optimize memory by destroying views of back-stacked Fragments while keeping the (cheaper) instance and its state. That optimization means 'the Fragment' and 'the Fragment's view' have different lifetimes, and *every* view-touching operation must be scoped to the view lifecycle (`viewLifecycleOwner`) or you get the classic leak/crash. This single distinction explains the majority of Fragment bugs, which is why it's such a common senior question.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is a ViewModel scoped to a Fragment vs its Activity vs a navigation graph, and how do you choose?",
    a: [
      {
        t: "p",
        text: "**A ViewModel's scope determines how long it lives and who shares it — you choose the scope to match the lifetime and sharing you need.** Each scope corresponds to a `ViewModelStoreOwner` whose lifecycle bounds the ViewModel.",
      },
      {
        t: "list",
        items: [
          "**Fragment-scoped** (`by viewModels()`) — the ViewModel lives as long as *this* Fragment, cleared when the Fragment is permanently removed. Use for state private to one screen. It survives that Fragment's configuration changes but is not shared with anyone.",
          "**Activity-scoped** (`by activityViewModels()`) — one ViewModel shared by *all* Fragments in the host Activity, living as long as the Activity. Use to **share state between sibling Fragments** (the classic master-detail communication) or for state that should persist across several Fragments in the same Activity. The caution: it lives for the whole Activity, so it can accumulate state and be overkill if only a couple of Fragments need it briefly.",
          "**Navigation-graph-scoped** (`by navGraphViewModels(R.id.checkout_graph)` / `hiltViewModel(backStackEntry)`) — one ViewModel shared by all Fragments *within a specific navigation (sub)graph*, cleared when you leave that graph. Use for **multi-step flows** — a checkout or onboarding wizard — where several screens share state that should be scoped to *just that flow* and cleaned up when it ends. This is often better than activity-scoping because the lifetime matches the flow, not the whole app session.",
        ],
      },
      {
        t: "p",
        text: "**How to choose**: match the ViewModel's lifetime to the *breadth and duration* of what needs the state. State for one screen → Fragment scope. State shared across sibling screens for the Activity's lifetime → Activity scope. State shared across a bounded multi-screen flow that should be discarded afterward → nav-graph scope (the sweet spot for wizards). The anti-pattern to avoid is activity-scoping *everything* as a lazy 'share it globally' habit — that outlives its usefulness, accumulates stale state, and blurs data ownership. The right scope gives you sharing *and* correct, automatic cleanup.",
      },
    ],
  },
];

export default qa;
