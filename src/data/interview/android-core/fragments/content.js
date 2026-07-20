// Fragments & their Lifecycle — Content tab. Teaching-first.

const content = [
  {
    heading: "What a Fragment is",
    blocks: [
      {
        t: "p",
        text: "A **Fragment** is a reusable, modular portion of UI that lives *inside* an Activity (or another Fragment). Think of it as a 'sub-screen' with its own lifecycle, layout, and behavior, hosted by an Activity. Fragments were introduced to support **multiple screen sizes** (a tablet showing a list and detail side-by-side, a phone showing one at a time) and to enable **reusable UI components** and **navigation** within a single Activity.",
      },
      {
        t: "list",
        items: [
          "A Fragment can't exist on its own — it must be hosted by an Activity (or parent Fragment) and added to a container view via the `FragmentManager`.",
          "**Single-Activity architecture**: the modern Android pattern is one Activity hosting many Fragments (or many Compose destinations), with the Navigation component managing transitions — rather than one Activity per screen.",
          "Fragments have their own lifecycle that's *tied to but distinct from* the host Activity's — which is the source of most Fragment complexity and bugs.",
        ],
      },
    ],
  },
  {
    heading: "The Fragment lifecycle — and the crucial view lifecycle",
    blocks: [
      {
        t: "p",
        text: "A Fragment has *two* lifecycles you must distinguish: the **Fragment instance lifecycle** and the **Fragment's view lifecycle**. This distinction is the #1 source of Fragment bugs and interview questions.",
      },
      {
        t: "code",
        title: "The main callbacks",
        code: `onAttach()          // attached to its host (Activity)
onCreate()          // fragment instance created (no view yet)
onCreateView()      // create/inflate the fragment's VIEW hierarchy
onViewCreated()     // view is ready — set up UI, observe data HERE
onStart / onResume  // visible / interactive (mirrors Activity)
onPause / onStop    // losing focus / not visible
onDestroyView()     // the fragment's VIEW is destroyed (but the fragment lives!)
onDestroy()         // the fragment instance is destroyed
onDetach()          // detached from host`,
      },
      {
        t: "list",
        items: [
          "**The instance lifecycle** (`onCreate` → `onDestroy`) tracks the Fragment *object*. **The view lifecycle** (`onCreateView` → `onDestroyView`) tracks the Fragment's *UI*. The key insight: **a Fragment's view can be destroyed and recreated while the Fragment instance stays alive.**",
          "This happens when a Fragment goes onto the **back stack**: navigate away, and `onDestroyView` runs (the view is torn down to save memory), but `onDestroy` does *not* — the Fragment instance is retained. Navigate back, and `onCreateView` runs again, building a *new* view for the *same* Fragment instance.",
          "**Consequence**: the Fragment instance can outlive multiple views. Observing data or holding view references using the Fragment's own lifecycle (instead of the view's) leaks the old destroyed view or crashes when the callback fires on a dead view.",
        ],
      },
    ],
  },
  {
    heading: "viewLifecycleOwner — the fix for the two-lifecycle problem",
    blocks: [
      {
        t: "p",
        text: "Because the view can be destroyed while the Fragment lives, you must tie view-related work (observing LiveData/Flow, view bindings) to the **view's** lifecycle, not the Fragment's. `viewLifecycleOwner` is a `LifecycleOwner` scoped to the current view — it's created in `onCreateView` and destroyed in `onDestroyView`.",
      },
      {
        t: "code",
        title: "Always observe with viewLifecycleOwner",
        code: `override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    // CORRECT — tied to the view's lifecycle
    viewLifecycleOwner.lifecycleScope.launch {
        viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
            viewModel.uiState.collect { render(it) }
        }
    }

    // WRONG — tied to the FRAGMENT's lifecycle:
    // lifecycleScope.launch { viewModel.uiState.collect { } }
    // On back-stack return, the OLD collector is still active AND a new one
    // starts -> duplicate collectors, updating a destroyed view -> crash/leak.
}`,
      },
      {
        t: "list",
        items: [
          "**Use `viewLifecycleOwner`** (not `this`) for: observing LiveData, collecting flows, anything touching views. Its lifecycle matches the view, so observers are removed in `onDestroyView` — no leaks, no updates to dead views.",
          "**The ViewBinding leak**: the same reason you null out a ViewBinding in `onDestroyView` (`_binding = null`) — the binding references views that are destroyed, so holding it past `onDestroyView` leaks the view hierarchy. The standard pattern uses a nullable backing property cleared in `onDestroyView`.",
          "**Rule**: view-related → `viewLifecycleOwner`; fragment-instance-related (rare) → `this`. When in doubt for UI work, it's the view lifecycle.",
        ],
      },
    ],
  },
  {
    heading: "Communication: between Fragments and with the Activity",
    blocks: [
      {
        t: "list",
        items: [
          "**Shared ViewModel** (the modern way): scope a ViewModel to the host Activity (`by activityViewModels()`) or a navigation graph, so multiple Fragments share the same instance and communicate through its state. Clean and lifecycle-safe.",
          "**Fragment Result API**: `setFragmentResult(key, bundle)` / `setFragmentResultListener(key) { }` — for one-off results between a Fragment and its parent (e.g. a picker Fragment returning a selection). Replaces the old interface-callback pattern.",
          "**Navigation component**: for moving between Fragments with type-safe arguments and a managed back stack — the standard for Fragment navigation, analogous to Navigation Compose.",
          "**Avoid**: direct references between Fragments (tight coupling, lifecycle hazards) and the old 'Fragment implements a callback interface the Activity calls' pattern (boilerplate, leak-prone).",
        ],
      },
    ],
  },
  {
    heading: "Fragments vs Activities, and the modern picture",
    blocks: [
      {
        t: "list",
        items: [
          "**Activity** = an entry point / window managed by the OS, heavier, declared in the manifest. **Fragment** = a lighter UI module hosted within an Activity, managed by your `FragmentManager`, not in the manifest. Fragments enable multiple UI panels in one Activity and reusable UI.",
          "**Single-Activity architecture** became the recommendation: one Activity, many Fragments (or Compose destinations) + Navigation component. Fewer Activities means simpler manifest, easier shared state (activity-scoped ViewModel), and smoother transitions.",
          "**With Jetpack Compose**, Fragments become largely optional — you can have a single Activity hosting Compose destinations with Navigation-Compose and no Fragments at all. But Fragments remain ubiquitous in existing codebases, and interop (`ComposeView` in a Fragment, or a Fragment in a Compose-based app) is common — so understanding Fragment lifecycle is still essential.",
        ],
      },
      {
        t: "note",
        text: "The Fragment essentials to nail: the two lifecycles (instance vs view) and why they differ (back stack destroys the view but keeps the instance); always use `viewLifecycleOwner` for view-related observation and null ViewBinding in `onDestroyView`; communicate via shared ViewModels or the Fragment Result API, never direct references; and know that single-Activity + Navigation (or Compose) is the modern architecture.",
      },
    ],
  },
];

export default content;
