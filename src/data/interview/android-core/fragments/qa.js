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
  {
    level: "junior",
    q: "What are the Fragment lifecycle callbacks, in order?",
    a: [
      {
        t: "p",
        text: "A Fragment has more callbacks than an Activity because it has *two* lifecycles — the fragment and its view. The order on creation: `onAttach` → `onCreate` → `onCreateView` → `onViewCreated` → `onViewStateRestored` → `onStart` → `onResume`; on teardown: `onPause` → `onStop` → `onDestroyView` → `onDestroy` → `onDetach`.",
      },
      {
        t: "list",
        items: [
          "**`onAttach`** — attached to the host (Activity/parent).",
          "**`onCreate`** — fragment created (no view yet); read arguments.",
          "**`onCreateView`** — inflate/return the view.",
          "**`onViewCreated`** — view ready; set up UI, observe data (with `viewLifecycleOwner`).",
          "**`onDestroyView`** — the view is destroyed (fragment may live on); null out bindings.",
          "**`onDestroy`/`onDetach`** — fragment destroyed, then detached.",
        ],
      },
      {
        t: "note",
        text: "Fragment order: onAttach → onCreate → onCreateView → onViewCreated → onViewStateRestored → onStart → onResume; teardown: onPause → onStop → onDestroyView → onDestroy → onDetach. Two lifecycles (fragment + view) — onCreateView/onViewCreated/onDestroyView are the view-lifecycle ones.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is viewLifecycleOwner, and why use it for observing data?",
    a: [
      {
        t: "p",
        text: "A Fragment's *view* has a shorter lifecycle than the Fragment itself — the view is created in `onCreateView` and destroyed in `onDestroyView`, but the Fragment instance can outlive it (e.g. on the back stack). `viewLifecycleOwner` represents the *view's* lifecycle. Observe LiveData/collect flows with it (not the Fragment's `this`) so observers are removed when the view is destroyed, preventing crashes and leaks.",
      },
      {
        t: "code",
        title: "Observe with viewLifecycleOwner",
        code: `override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    viewModel.data.observe(viewLifecycleOwner) { render(it) }   // NOT 'this'
    viewLifecycleOwner.lifecycleScope.launch {
        repeatOnLifecycle(Lifecycle.State.STARTED) { viewModel.state.collect { } }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**View lifecycle < fragment lifecycle** — view destroyed in `onDestroyView`, fragment may persist.",
          "**`viewLifecycleOwner`** — the view's lifecycle owner.",
          "**Observe with it** — observers auto-removed on `onDestroyView` (no updates to a dead view).",
          "**Bug with `this`** — using the Fragment as owner can re-add duplicate observers or update a destroyed view.",
        ],
      },
      {
        t: "note",
        text: "A Fragment's view lifecycle is shorter than the Fragment's (view: onCreateView→onDestroyView; fragment can outlive it on the back stack). Observe LiveData/flows with viewLifecycleOwner (not `this`) so observers are removed on onDestroyView — preventing updates to a destroyed view and duplicate observers.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you avoid the ViewBinding leak in a Fragment?",
    a: [
      {
        t: "p",
        text: "A Fragment can outlive its view, so a `binding` field holding the (destroyed) view's binding leaks it. The standard fix: assign the binding in `onCreateView`/`onViewCreated` and *null it out in `onDestroyView`*. A common pattern uses a nullable backing field with a non-null accessor valid only between those callbacks.",
      },
      {
        t: "code",
        title: "Null binding in onDestroyView",
        code: `private var _binding: FragmentHomeBinding? = null
private val binding get() = _binding!!   // valid between onCreateView and onDestroyView

override fun onCreateView(...): View {
    _binding = FragmentHomeBinding.inflate(inflater, container, false)
    return binding.root
}
override fun onDestroyView() { super.onDestroyView(); _binding = null }   // avoid leak`,
      },
      {
        t: "list",
        items: [
          "**Fragment outlives view** — a retained binding leaks the old view hierarchy.",
          "**Null in `onDestroyView`** — release the binding when the view is gone.",
          "**Nullable + accessor** — `_binding` nullable, `binding` non-null accessor between view callbacks.",
          "**Delegate libraries** — `viewBinding()` delegates automate the null-out.",
        ],
      },
      {
        t: "note",
        text: "A Fragment outlives its view, so a retained ViewBinding leaks the destroyed view. Fix: nullable _binding + non-null accessor, assign in onCreateView, and set _binding = null in onDestroyView. Or use a viewBinding() property delegate that auto-nulls. Only touch the binding between onCreateView and onDestroyView.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the FragmentManager, and what are transactions?",
    a: [
      {
        t: "p",
        text: "The `FragmentManager` manages a host's fragments and their back stack. You change fragments via a *transaction* (`beginTransaction()...commit()`) — a batched set of operations (add/replace/remove/show/hide) applied atomically. Optionally `addToBackStack()` so back navigation reverses the transaction.",
      },
      {
        t: "code",
        title: "A transaction",
        code: `supportFragmentManager.beginTransaction()
    .replace(R.id.container, DetailFragment())
    .addToBackStack("detail")     // back reverses this
    .commit()`,
      },
      {
        t: "list",
        items: [
          "**`FragmentManager`** — `supportFragmentManager` (Activity), `childFragmentManager`, `parentFragmentManager`.",
          "**Transaction** — batched add/replace/remove/show/hide, committed atomically.",
          "**`addToBackStack`** — makes back navigation undo the transaction.",
          "**Modern** — Navigation Component wraps this; you rarely write raw transactions.",
        ],
      },
      {
        t: "note",
        text: "FragmentManager manages a host's fragments + back stack (supportFragmentManager/childFragmentManager/parentFragmentManager). A transaction (beginTransaction()…commit()) applies batched add/replace/remove/show/hide atomically; addToBackStack makes back reverse it. Navigation Component wraps this; you rarely write raw transactions now.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between add and replace in a fragment transaction?",
    a: [
      {
        t: "p",
        text: "`add` puts a new fragment *on top* of the container, keeping the previous fragment (and its view) underneath. `replace` *removes* the existing fragment(s) in the container and adds the new one — the old fragment's view is destroyed. Use `replace` for typical screen navigation; `add` (with `hide`/`show`) when you want to keep the previous fragment's state/view alive.",
      },
      {
        t: "list",
        items: [
          "**`add`** — stack a fragment over the container; previous stays (view alive).",
          "**`replace`** — remove existing, add new; old view destroyed.",
          "**`hide`/`show`** — with `add`, toggle visibility without destroying views.",
          "**Back stack** — `addToBackStack` + `replace` re-adds the removed fragment on back.",
        ],
      },
      {
        t: "note",
        text: "add stacks a fragment over the container (previous stays, view alive underneath); replace removes existing fragments and adds the new one (old view destroyed). Use replace for screen navigation, add + hide/show to keep the previous fragment's view/state alive (e.g. bottom-nav tabs).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between commit, commitNow, and commitAllowingStateLoss?",
    a: [
      {
        t: "p",
        text: "`commit()` schedules the transaction *asynchronously* (runs on the next main-loop pass). `commitNow()` executes it *synchronously* (can't be added to the back stack). `commitAllowingStateLoss()` is like `commit` but *won't throw* if called after `onSaveInstanceState` — at the cost of potentially losing that transaction on state restore. The classic `IllegalStateException: Can not perform this action after onSaveInstanceState` comes from committing too late.",
      },
      {
        t: "list",
        items: [
          "**`commit()`** — async; throws if after `onSaveInstanceState`.",
          "**`commitNow()`** — synchronous; no back stack.",
          "**`commitAllowingStateLoss()`** — won't throw post-save-state, but may lose the transaction.",
          "**Better** — restructure so you don't commit after state is saved (e.g. `lifecycleScope` at STARTED).",
        ],
      },
      {
        t: "note",
        text: "commit() = async (throws IllegalStateException if after onSaveInstanceState); commitNow() = synchronous (no back stack); commitAllowingStateLoss() = won't throw post-save-state but may lose the transaction on restore. The 'after onSaveInstanceState' crash means committing too late — restructure to commit while at least STARTED instead of relying on allowingStateLoss.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the Fragment Result API (setFragmentResult)?",
    a: [
      {
        t: "p",
        text: "The Fragment Result API lets one fragment pass a result to another via the `FragmentManager` without direct references. The receiver registers a listener with `setFragmentResultListener(requestKey)`, and the sender calls `setFragmentResult(requestKey, bundle)`. The result is delivered when the receiver is at least STARTED, surviving configuration changes — the modern replacement for target fragments / interface callbacks.",
      },
      {
        t: "code",
        title: "Fragment results",
        code: `// Receiver
setFragmentResultListener("pickColor") { _, bundle ->
    val color = bundle.getInt("color")
}
// Sender (e.g. a DialogFragment)
setFragmentResult("pickColor", bundleOf("color" to selected))`,
      },
      {
        t: "list",
        items: [
          "**`setFragmentResultListener(key) { }`** — receiver listens for a result.",
          "**`setFragmentResult(key, bundle)`** — sender delivers it.",
          "**Via FragmentManager** — no direct references between fragments.",
          "**Lifecycle-safe** — delivered at STARTED; survives config change. Replaces setTargetFragment.",
        ],
      },
      {
        t: "note",
        text: "Fragment Result API: receiver setFragmentResultListener(requestKey) { }, sender setFragmentResult(requestKey, bundle) — passes results via the FragmentManager with no direct references, delivered when the receiver is ≥ STARTED and surviving config change. The modern replacement for setTargetFragment/interface callbacks.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you pass arguments to a Fragment, and why not use the constructor?",
    a: [
      {
        t: "p",
        text: "Pass data via the `arguments` `Bundle` (set it right after construction, usually in a `newInstance` factory). *Don't* use a custom constructor with parameters, because the system *recreates fragments* using the *no-arg constructor* on configuration change/process death — your constructor args would be lost, causing crashes. The `arguments` Bundle is restored automatically.",
      },
      {
        t: "code",
        title: "newInstance + arguments",
        code: `class DetailFragment : Fragment() {
    companion object {
        fun newInstance(id: String) = DetailFragment().apply {
            arguments = bundleOf("id" to id)
        }
    }
    private val id get() = requireArguments().getString("id")!!
}`,
      },
      {
        t: "list",
        items: [
          "**`arguments` Bundle** — set after construction; restored by the system.",
          "**No-arg constructor required** — the system recreates fragments with it.",
          "**`newInstance` factory** — the idiomatic pattern to set arguments.",
          "**Navigation Component** — Safe Args generates typed argument passing.",
        ],
      },
      {
        t: "note",
        text: "Pass data via the arguments Bundle (set in a newInstance factory) — NOT a custom constructor, because the system recreates fragments with the no-arg constructor on config change/process death, losing constructor args (crash). The arguments Bundle is restored automatically; Navigation Safe Args gives typed access.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between childFragmentManager and parentFragmentManager?",
    a: [
      {
        t: "p",
        text: "`childFragmentManager` manages fragments *nested inside* this fragment (e.g. a ViewPager's pages, or fragments in this fragment's own container). `parentFragmentManager` is the FragmentManager of whatever *hosts* this fragment (the Activity or a parent fragment). Use `childFragmentManager` for nested fragments; `parentFragmentManager` to interact with siblings/host-level navigation.",
      },
      {
        t: "list",
        items: [
          "**`childFragmentManager`** — this fragment's own nested fragments.",
          "**`parentFragmentManager`** — the host's manager (Activity or parent fragment).",
          "**Nesting** — ViewPager2/nested navigation use the child manager.",
          "**Result API scope** — set the listener on the manager the sender uses.",
        ],
      },
      {
        t: "note",
        text: "childFragmentManager manages fragments nested INSIDE this fragment (ViewPager pages, nested containers); parentFragmentManager is the host's manager (Activity or parent fragment). Use child for nested fragments, parent for sibling/host interaction. Fragment results must use the same manager on both ends.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a DialogFragment, and why prefer it over a raw Dialog?",
    a: [
      {
        t: "p",
        text: "A `DialogFragment` is a Fragment that hosts a dialog — it manages the dialog's lifecycle and, crucially, *survives configuration changes* (the system recreates it), unlike a raw `Dialog` you'd have to manually dismiss/recreate on rotation. Show it with `show(fragmentManager, tag)`.",
      },
      {
        t: "code",
        title: "DialogFragment",
        code: `class ConfirmDialog : DialogFragment() {
    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog =
        AlertDialog.Builder(requireContext())
            .setTitle("Delete?")
            .setPositiveButton("Yes") { _, _ -> setFragmentResult("confirm", bundleOf("ok" to true)) }
            .create()
}
ConfirmDialog().show(parentFragmentManager, "confirm")`,
      },
      {
        t: "list",
        items: [
          "**Lifecycle-managed** — survives config change (recreated by the system).",
          "**`onCreateDialog`** — build the dialog; or `onCreateView` for a custom layout.",
          "**`show(fm, tag)`** — display it via the FragmentManager.",
          "**Results** — pair with the Fragment Result API to return the choice.",
        ],
      },
      {
        t: "note",
        text: "A DialogFragment hosts a dialog with lifecycle management and survives configuration changes (system recreates it) — unlike a raw Dialog you'd manually handle on rotation. Build it in onCreateDialog (or onCreateView for custom UI), show via show(fm, tag), and return choices with the Fragment Result API.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the single-Activity architecture with fragments?",
    a: [
      {
        t: "p",
        text: "Single-Activity architecture uses *one* Activity hosting a `NavHostFragment`, with each screen as a *fragment* (or Compose destination) navigated via the Navigation Component. It centralizes navigation, simplifies the back stack, shares Activity-scoped state easily, and avoids the complexity of many Activities with intents. It's the recommended modern approach.",
      },
      {
        t: "list",
        items: [
          "**One Activity** — hosts a `NavHostFragment`; screens are fragments/Compose.",
          "**Navigation Component** — centralized nav graph and back stack.",
          "**Shared state** — Activity/graph-scoped ViewModels across screens.",
          "**Benefits** — simpler navigation, transitions, deep links vs multi-Activity + intents.",
        ],
      },
      {
        t: "note",
        text: "Single-Activity architecture: one Activity hosting a NavHostFragment, each screen a fragment (or Compose destination) navigated via the Navigation Component. Centralizes navigation/back stack, eases shared (graph/activity-scoped) state, and simplifies transitions/deep links vs multi-Activity + intents. The recommended modern approach.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between hide/show and add/remove/replace?",
    a: [
      {
        t: "p",
        text: "`hide`/`show` toggle a fragment's *visibility* while keeping its instance *and view* alive (state preserved, instant switch). `remove`/`replace` *destroy* the fragment's view (`onDestroyView`) and detach the fragment. Use `hide`/`show` for tabs where re-inflating is wasteful and you want to preserve scroll/state; use `replace` for normal navigation where you don't need the old screen retained.",
      },
      {
        t: "list",
        items: [
          "**`hide`/`show`** — keep instance + view; toggle visibility; state preserved.",
          "**`remove`/`replace`** — destroy the view; fragment detached/destroyed.",
          "**Tabs** — `hide`/`show` (or `add`) avoids re-creating each tab.",
          "**Navigation** — `replace` for forward navigation.",
        ],
      },
      {
        t: "note",
        text: "hide/show toggle visibility while keeping the fragment instance AND view alive (state preserved, instant switch); remove/replace destroy the view (onDestroyView) and detach the fragment. Use hide/show (or add) for bottom-nav tabs (avoid re-inflation, keep scroll/state); replace for forward navigation.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is FragmentFactory, and when do you need it?",
    a: [
      {
        t: "p",
        text: "A `FragmentFactory` customizes how the system *instantiates* fragments — needed when you want *constructor injection* of dependencies (since you can't use a custom constructor with the default factory, which requires no-arg). You register a factory that constructs fragments with their dependencies; Hilt provides this automatically for `@AndroidEntryPoint` fragments.",
      },
      {
        t: "list",
        items: [
          "**Customizes instantiation** — enables constructor injection into fragments.",
          "**Register on the FragmentManager** — `fragmentManager.fragmentFactory = ...`.",
          "**Recreation-safe** — the factory is used when the system recreates fragments too.",
          "**Hilt** — `@AndroidEntryPoint` fragments get field injection without a manual factory.",
        ],
      },
      {
        t: "note",
        text: "FragmentFactory customizes fragment instantiation, enabling constructor injection (impossible with the default no-arg factory). Register it on the FragmentManager (used even on recreation). Hilt's @AndroidEntryPoint provides field injection into fragments without writing a manual factory.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do fragments survive configuration changes?",
    a: [
      {
        t: "p",
        text: "By default, fragments are *destroyed and recreated* on configuration change along with their host Activity — their `arguments` Bundle and saved instance state are restored, and any `ViewModel` (scoped to the fragment) survives in memory. The old `retainInstance = true` (which kept the fragment instance across recreation) is *deprecated* — use a `ViewModel` instead.",
      },
      {
        t: "list",
        items: [
          "**Recreated** — fragment destroyed and rebuilt with the Activity.",
          "**`arguments` + saved state** — restored automatically.",
          "**ViewModel** — survives config change; holds data.",
          "**`retainInstance` deprecated** — use a ViewModel for retained state.",
        ],
      },
      {
        t: "note",
        text: "Fragments are destroyed and recreated on config change (with the host Activity) — arguments Bundle + saved instance state restored, and a fragment-scoped ViewModel survives in memory. The old retainInstance = true is deprecated; use a ViewModel to retain data across recreation.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are common Fragment pitfalls and how do you avoid them?",
    a: [
      {
        t: "p",
        text: "The frequent bugs: leaking the view/binding (not nulling in `onDestroyView`), observing with the Fragment instead of `viewLifecycleOwner` (updating a dead view / duplicate observers), committing transactions after `onSaveInstanceState` (IllegalStateException), using constructor args instead of `arguments`, and holding the host Activity/Context beyond the fragment's life.",
      },
      {
        t: "list",
        items: [
          "**View/binding leak** — null the binding in `onDestroyView`.",
          "**Wrong observation owner** — use `viewLifecycleOwner`, not `this`.",
          "**Late transactions** — don't commit after state is saved (or use STARTED-scoped triggers).",
          "**Constructor args** — use the `arguments` Bundle + `newInstance`.",
          "**Context retention** — don't hold the Activity/Context after `onDetach`.",
        ],
      },
      {
        t: "note",
        text: "Fragment pitfalls: view/binding leaks (null in onDestroyView), observing with `this` instead of viewLifecycleOwner (dead-view updates/duplicate observers), committing after onSaveInstanceState (IllegalStateException), constructor args instead of the arguments Bundle, and retaining the host Context past onDetach.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a BottomSheetDialogFragment?",
    a: [
      {
        t: "p",
        text: "`BottomSheetDialogFragment` is a `DialogFragment` that presents its content as a Material *bottom sheet* — sliding up from the bottom, draggable, with expand/collapse states. It gives you a modal bottom sheet with proper lifecycle management and config-change survival, without manually wiring a `BottomSheetBehavior`.",
      },
      {
        t: "list",
        items: [
          "**Modal bottom sheet** — slides up, draggable, expand/collapse.",
          "**Lifecycle-managed** — like `DialogFragment`; survives config change.",
          "**`onCreateView`** — provide the sheet's content layout.",
          "**Behavior** — control peek height, draggability, state via `BottomSheetBehavior`.",
        ],
      },
      {
        t: "note",
        text: "BottomSheetDialogFragment is a DialogFragment presenting content as a Material modal bottom sheet (slide-up, draggable, expand/collapse) with lifecycle management and config-change survival. Provide content in onCreateView; tune peek height/draggability via BottomSheetBehavior. Compose has ModalBottomSheet as the equivalent.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do fragment transactions interact with the back stack?",
    a: [
      {
        t: "p",
        text: "Calling `addToBackStack(name)` on a transaction records it so that pressing *back* (or `popBackStack()`) *reverses* it — re-adding removed fragments and removing added ones. Without `addToBackStack`, the transaction isn't undoable by back. You can pop to a named entry (`popBackStack(name, flags)`) to unwind multiple transactions at once.",
      },
      {
        t: "list",
        items: [
          "**`addToBackStack(name)`** — makes the transaction reversible by back.",
          "**`popBackStack()`** — undo the last back-stack transaction.",
          "**`popBackStack(name, INCLUSIVE)`** — unwind to (and optionally including) a named entry.",
          "**Without it** — the transaction is permanent (back won't undo it).",
        ],
      },
      {
        t: "note",
        text: "addToBackStack(name) records a transaction so back/popBackStack() reverses it (re-adding removed fragments). Without it, the transaction isn't undoable by back. popBackStack(name, INCLUSIVE) unwinds multiple transactions to a named entry — how you clear a flow (like login) from the back stack.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is FragmentContainerView, and why use it over the <fragment> tag?",
    a: [
      {
        t: "p",
        text: "`FragmentContainerView` is the recommended container for hosting fragments (including `NavHostFragment`). It fixes issues the old `<fragment>` tag and `FrameLayout` had with fragment transactions, animations, and window insets — particularly around exit animations drawing on top. Use it as your nav host container and for dynamically added fragments.",
      },
      {
        t: "code",
        title: "FragmentContainerView",
        code: `<androidx.fragment.app.FragmentContainerView
    android:id="@+id/nav_host"
    android:name="androidx.navigation.fragment.NavHostFragment"
    app:navGraph="@navigation/nav_graph"
    app:defaultNavHost="true"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />`,
      },
      {
        t: "list",
        items: [
          "**Recommended container** — for nav hosts and dynamic fragments.",
          "**Fixes** — transaction/animation/insets issues of `<fragment>`/`FrameLayout`.",
          "**Z-ordering** — correct exit-animation draw order.",
          "**Inflate a fragment** — via `android:name`, or add transactions at runtime.",
        ],
      },
      {
        t: "note",
        text: "FragmentContainerView is the recommended fragment container (nav hosts, dynamic fragments) — it fixes the old <fragment> tag/FrameLayout problems with transactions, exit-animation z-ordering, and window insets. Use it for your NavHostFragment and any runtime-added fragments.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does the Navigation Component work with fragments?",
    a: [
      {
        t: "p",
        text: "The Navigation Component uses a `NavHostFragment` (in a `FragmentContainerView`) driven by a nav graph (XML or Kotlin DSL) that declares destinations (fragments) and actions (edges). You navigate with a `NavController` (`findNavController().navigate(...)`), pass typed arguments via Safe Args, and get automatic back-stack handling, transitions, and deep links.",
      },
      {
        t: "list",
        items: [
          "**`NavHostFragment` + nav graph** — declares fragment destinations and actions.",
          "**`NavController`** — `findNavController().navigate(R.id.action)` / with Safe Args.",
          "**Safe Args** — typed argument passing between destinations.",
          "**Automatic** — back stack, transitions, deep links, up navigation.",
        ],
      },
      {
        t: "note",
        text: "Navigation Component: a NavHostFragment (in a FragmentContainerView) + a nav graph declaring fragment destinations and actions; navigate via NavController (findNavController().navigate) with Safe Args for typed arguments. It handles the back stack, transitions, deep links, and up navigation automatically — the basis of single-Activity apps.",
      },
    ],
  },
  {
    level: "junior",
    q: "Where should you inflate the view versus set up UI logic in a Fragment?",
    a: [
      {
        t: "p",
        text: "Inflate and return the view in `onCreateView` (keep it to inflation). Do UI setup — click listeners, adapters, observing data — in `onViewCreated`, where the view is guaranteed created and `viewLifecycleOwner` is available. Don't touch views in `onCreate` (no view yet).",
      },
      {
        t: "code",
        title: "onCreateView vs onViewCreated",
        code: `override fun onCreateView(inflater: LayoutInflater, ...): View {
    _binding = FragmentXBinding.inflate(inflater, container, false)
    return binding.root                       // just inflate
}
override fun onViewCreated(view: View, s: Bundle?) {
    binding.list.adapter = adapter            // set up UI here
    viewModel.state.observe(viewLifecycleOwner) { render(it) }
}`,
      },
      {
        t: "list",
        items: [
          "**`onCreateView`** — inflate and return the view only.",
          "**`onViewCreated`** — set up listeners/adapters, observe data.",
          "**`viewLifecycleOwner`** — available in `onViewCreated`.",
          "**Not `onCreate`** — no view exists there.",
        ],
      },
      {
        t: "note",
        text: "Inflate/return the view in onCreateView (inflation only); do UI setup (listeners, adapters, data observation with viewLifecycleOwner) in onViewCreated, where the view is guaranteed. Don't touch views in onCreate (no view yet).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you share a ViewModel between fragments?",
    a: [
      {
        t: "p",
        text: "Scope the ViewModel to a *common owner* both fragments share — the Activity (`by activityViewModels()`) or a navigation graph (`by navGraphViewModels(R.id.graph)`). Both fragments then get the *same* ViewModel instance, so one can update state the other observes — a clean way to share data without direct references.",
      },
      {
        t: "code",
        title: "Shared ViewModel",
        code: `class FragmentA : Fragment() {
    private val shared: SharedViewModel by activityViewModels()   // Activity-scoped
}
class FragmentB : Fragment() {
    private val shared: SharedViewModel by activityViewModels()   // same instance
}`,
      },
      {
        t: "list",
        items: [
          "**`by activityViewModels()`** — Activity-scoped; shared across all its fragments.",
          "**`by navGraphViewModels(id)`** — scoped to a nav graph (a flow).",
          "**Same instance** — both fragments share state.",
          "**Avoid over-sharing** — Activity-scope only what genuinely needs to be shared.",
        ],
      },
      {
        t: "note",
        text: "Share a ViewModel by scoping it to a common owner: by activityViewModels() (Activity-scoped, all fragments) or by navGraphViewModels(R.id.graph) (a flow). Both fragments get the same instance, so one updates state the other observes — no direct references. Scope narrowly (graph over activity) to avoid over-sharing.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a nested fragment, and when do you use childFragmentManager?",
    a: [
      {
        t: "p",
        text: "A nested fragment is a fragment hosted *inside another fragment* — added via the parent fragment's `childFragmentManager`. Common cases: a `ViewPager2` whose pages are fragments, or a screen with a sub-section that's itself a fragment. Nesting keeps the child's lifecycle tied to the parent fragment's view.",
      },
      {
        t: "list",
        items: [
          "**Nested fragment** — a fragment inside a fragment's own container.",
          "**`childFragmentManager`** — manage the nested fragments.",
          "**Uses** — `ViewPager2` with fragment pages, sub-sections, nested navigation.",
          "**Lifecycle** — the child follows the parent fragment's view lifecycle.",
        ],
      },
      {
        t: "note",
        text: "A nested fragment lives inside another fragment, managed via the parent's childFragmentManager — used for ViewPager2 fragment pages, sub-sections, or nested navigation. The child's lifecycle is tied to the parent fragment's view. Use childFragmentManager (not parentFragmentManager) for these.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you save and restore a Fragment's own state?",
    a: [
      {
        t: "p",
        text: "A Fragment has `onSaveInstanceState(outState)` for small UI state (like an Activity), restored via the `savedInstanceState` passed to `onCreate`/`onCreateView`/`onViewCreated`. For data that should survive config change, use a fragment-scoped `ViewModel`; for process-death-critical inputs, use `SavedStateHandle`. The `arguments` Bundle is also restored automatically.",
      },
      {
        t: "list",
        items: [
          "**`onSaveInstanceState`** — small UI state; restored via `savedInstanceState`.",
          "**ViewModel** — data across config change.",
          "**`SavedStateHandle`** — process-death-critical inputs.",
          "**`arguments`** — restored automatically.",
        ],
      },
      {
        t: "note",
        text: "Fragment state: onSaveInstanceState(outState) for small UI state (restored via savedInstanceState in onCreate/onCreateView/onViewCreated); a fragment-scoped ViewModel for data across config change; SavedStateHandle for process-death inputs; the arguments Bundle is restored automatically.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why was onActivityCreated deprecated, and what replaces it?",
    a: [
      {
        t: "p",
        text: "`onActivityCreated` was deprecated because it coupled the fragment's setup to the *host Activity's* creation, which is the wrong dependency — a fragment should depend on its *own view* lifecycle, not the Activity's. Move view setup to `onViewCreated` (with `viewLifecycleOwner`) and non-view initialization to `onCreate`. This decoupling makes fragments more reusable and testable.",
      },
      {
        t: "list",
        items: [
          "**Deprecated** — coupled fragment setup to the Activity's creation.",
          "**View setup → `onViewCreated`** — with `viewLifecycleOwner`.",
          "**Non-view init → `onCreate`** — reading arguments, etc.",
          "**Benefit** — fragment depends on its own lifecycle, not the host's.",
        ],
      },
      {
        t: "note",
        text: "onActivityCreated was deprecated because it tied fragment setup to the host Activity's creation — the wrong dependency. Do view setup in onViewCreated (viewLifecycleOwner) and non-view init in onCreate, so the fragment depends on its own lifecycle — more reusable and testable.",
      },
    ],
  },
];

export default qa;
