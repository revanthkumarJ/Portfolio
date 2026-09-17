/* Mifos mentoring — the review side of the work.
   Every quote below is a verbatim excerpt from a public review comment, trimmed
   only for length. Each `url` opens the original comment on GitHub. */
export const mifosMentor = {
  slug: "mifos-mentor",
  company: "Mifos Initiative",
  role: "Mentor — GSoC & Code4GovTech",
  discipline: "Code review & contributor mentoring",
  period: "Mar 2026 — Present",
  accent: "amber",
  eyebrow: "Experience · Mentoring",
  titleLead: "I review more code",
  titleAccent: "than I write",
  tagline: "365 pull requests reviewed across the Mifos mobile apps",
  summary:
    "I started at Mifos as an outside contributor waiting on review. Now I'm on the other side of it — conducting Google Summer of Code and Code4GovTech interviews, running standups, and reviewing contributor pull requests across seven repositories. Reviewing three times as much as I author has taught me more about architecture than writing ever did: you can ship working code without being able to say why it's right, and review removes that option.",

  stats: [
    { value: 365, label: "Pull requests reviewed" },
    { value: 35, label: "Contributors mentored" },
    { value: 357, label: "Review comments left" },
    { value: 7, label: "Repositories covered" },
  ],

  meta: [
    { label: "Reviewing since", value: "Jan 2025" },
    { label: "Mentor since", value: "Mar 2026" },
    { label: "Programs", value: "GSoC · C4GT" },
    { label: "Also", value: "Interviews · standups" },
    { label: "Everything", value: "Public" },
  ],

  /* The floating wall. Each card links to the real comment. */
  reviewsBlurb:
    "A sample of review comments, drifting past. Hover to hold one still, click to open the original thread on GitHub — all of it is public and permanent.",

  reviews: [
    {
      theme: "Localisation",
      quote:
        "I think toString method to StringResource won't give actual string, it may return address or reference something like that. So use it like below — getString(event.message) inside scope.launch",
      lesson: "Calling toString() on a string resource yields a reference, not the translated text.",
      repo: "mifos-pay",
      pr: 1882,
      url: "https://github.com/openMF/mifos-pay/pull/1882#discussion_r2209126746",
    },
    {
      theme: "Localisation",
      quote:
        "can't we pass some enum to StatusChip instead of String? if we implement multiple languages the text may be different… but when you use stringResource(Res.string.…) it will change based on language",
      lesson: "Passing display strings across a component boundary quietly breaks translation.",
      repo: "mifos-pay",
      pr: 1879,
      url: "https://github.com/openMF/mifos-pay/pull/1879#discussion_r2195525078",
    },
    {
      theme: "Localisation",
      quote:
        "i think we have 18 languages in mifos-mobile but in your pr i am seeing changes in 14 folders, can you confirm once — in settings feature module you can find all available languages",
      lesson: "A partially translated release ships broken strings to four locales.",
      repo: "mifos-mobile",
      pr: 3117,
      url: "https://github.com/openMF/mifos-mobile/pull/3117#pullrequestreview-3837116083",
    },
    {
      theme: "State modelling",
      quote:
        "it is decided not to place CircularProgressbar inside dialog state — create another internal state, and if it is Loading show loader, if success show screen",
      lesson: "Loading isn't a kind of dialog. Conflating them makes impossible states representable.",
      repo: "mifos-x-field-officer-app",
      pr: 2495,
      url: "https://github.com/openMF/mifos-x-field-officer-app/pull/2495#discussion_r2324211999",
    },
    {
      theme: "State modelling",
      quote:
        "create handle functions for each and don't update it inside handleAction — is NewLoanAccountAction.DismissDialog -> handleDismissAddCollateralDialog()",
      lesson: "One growing when-branch hides logic. Named handlers keep each transition findable.",
      repo: "mifos-x-field-officer-app",
      pr: 2495,
      url: "https://github.com/openMF/mifos-x-field-officer-app/pull/2495#discussion_r2324213655",
    },
    {
      theme: "Multiplatform",
      quote:
        "i think you wrote in xml in androidMain. But this project is Kotlin Multiplatform using Jetpack Compose, and the ui code should be placed inside commonMain",
      lesson: "UI written in androidMain silently excludes every other target.",
      repo: "mifos-x-field-officer-app",
      pr: 2511,
      url: "https://github.com/openMF/mifos-x-field-officer-app/pull/2511#pullrequestreview-3304412341",
    },
    {
      theme: "Reuse",
      quote:
        "androidx-compose-ui … androidx-compose-ui-tooling-preview are already there in libs.versions.toml, then why are you adding them again with different names",
      lesson: "Duplicate catalog entries drift into two versions of the same dependency.",
      repo: "mifos-x-field-officer-app",
      pr: 2361,
      url: "https://github.com/openMF/mifos-x-field-officer-app/pull/2361#discussion_r2040572067",
    },
    {
      theme: "Reuse",
      quote:
        "create these 2 composables in the UI module — HorizontalSpacer(width) and VerticalSpacer(height) — and use them whenever needed instead of Spacer(Modifier.height())",
      lesson: "Spacing repeated inline is spacing nobody can change later in one place.",
      repo: "mifos-save-mobile-app",
      pr: 14,
      url: "https://github.com/openMF/mifos-save-mobile-app/pull/14",
    },
    {
      theme: "Reuse",
      quote:
        "1. remove inline comments  2. make sure everything looks good in both modes  3. use VerticalSpacer() and HorizontalSpacer()  4. instead of hardcoding values use KptTheme.spacing",
      lesson: "Design tokens or literals — pick one, and it can't be literals.",
      repo: "mifos-save-mobile-app",
      pr: 22,
      url: "https://github.com/openMF/mifos-save-mobile-app/pull/22#pullrequestreview-4702741922",
    },
    {
      theme: "Simplicity",
      quote:
        "we don't need a viewmodel here. use an array instead — refer mifos mobile and do the things exactly the same, just change images and string values accordingly",
      lesson: "A ViewModel with no business logic is ceremony, not architecture.",
      repo: "mifos-x-field-officer-app",
      pr: 2377,
      url: "https://github.com/openMF/mifos-x-field-officer-app/pull/2377#pullrequestreview-2851450136",
    },
    {
      theme: "PR hygiene",
      quote:
        "if it is about module migration PR then why are there search module changes in this PR. do the things i mentioned, remove the search changes from this PR",
      lesson: "A migration PR with unrelated changes can't be reviewed or reverted cleanly.",
      repo: "mifos-x-field-officer-app",
      pr: 2363,
      url: "https://github.com/openMF/mifos-x-field-officer-app/pull/2363#pullrequestreview-2838603108",
    },
    {
      theme: "Accessibility",
      quote:
        "keep each in a line — principal one line, second line interest, third line fees. otherwise based on user font size the things may not be visible clearly",
      lesson: "Layouts that fit only at the default font size fail the people who change it.",
      repo: "mifos-save-mobile-app",
      pr: 53,
      url: "https://github.com/openMF/mifos-save-mobile-app/pull/53#pullrequestreview-4890660563",
    },
    {
      theme: "Accessibility",
      quote:
        "from the pr video, while loading or dialog shown the background content is not showing — the background should not hide, we have to use overlay loading and dialog comes on top of existing content",
      lesson: "Blanking the screen to load loses the user's place and their context.",
      repo: "mifos-x-field-officer-app",
      pr: 2580,
      url: "https://github.com/openMF/mifos-x-field-officer-app/pull/2580#pullrequestreview-3849276924",
    },
    {
      theme: "PR hygiene",
      quote:
        "you haven't pulled the latest changes — if you had, all of these should be uncommented because all modules except qr and notifications are merged",
      lesson: "Reviewing against a stale base wastes the reviewer's time and the author's.",
      repo: "mifos-mobile",
      pr: 2811,
      url: "https://github.com/openMF/mifos-mobile/pull/2811",
    },
  ],

  highlights: [
    {
      icon: "users",
      title: "Reviewing is the fastest way to learn architecture",
      scale: "3× more reviewed than authored",
      body: "Writing code only requires that it work. Reviewing requires you to say why someone else's doesn't, in terms they can act on — and to be right, because they will push back. That pressure taught me more about state modelling and module boundaries than any amount of shipping did.",
    },
    {
      icon: "award",
      title: "Interviewing for GSoC and C4GT",
      scale: "Selection, not just review",
      body: "I conduct interviews for Google Summer of Code and Code4GovTech candidates. Having been through the equivalent selection myself — Mifos Summer of Code 2025 — I know what the program is trying to find: not the person who already knows the codebase, but the one who reads it before changing it.",
    },
    {
      icon: "grid",
      title: "The same five notes, over and over",
      scale: "Patterns, not nitpicks",
      body: "Most of my review comments fall into a handful of buckets: strings that break translation, loading conflated with dialog state, UI written outside commonMain, duplicated spacing and dependency entries, and PRs doing more than one thing. Recognising the pattern is what turns a review from a list of fixes into something the contributor keeps.",
    },
    {
      icon: "bug",
      title: "Requesting changes is the useful part",
      scale: "126 change requests",
      body: "Approving is easy and teaches nobody anything. A third of my reviews asked for changes, usually with the corrected code written out and a link to a PR where it was already done that way — because 'this is wrong' helps far less than 'here is what it should be, and here is one that got it right'.",
    },
  ],

  takeaways: [
    {
      title: "Explain, then link a precedent",
      body: "Almost every comment I leave points at an existing PR that solved the same thing. It answers the real question — what does this codebase consider correct — instead of making the contributor take my word for it.",
    },
    {
      title: "Say when you're unsure",
      body: "Several of my reviews open with 'I'm not sure' or tag someone who knows better. A review that projects false certainty is worse than one that admits its limits, because the contributor can't tell which parts to push back on.",
    },
    {
      title: "Review the diff, not the person",
      body: "Contributors are volunteers, often students, often writing Kotlin Multiplatform for the first time. The bar stays where it is; the tone can't be the thing that makes them leave.",
    },
    {
      title: "It made me a better author",
      body: "Most of what I catch now, I once shipped. My first contribution here was closed and reopened four times before it merged — that experience is what I'm drawing on when I write the comment I wish I'd received.",
    },
  ],

  productsBlurb: "Where the reviewing happened, across the Mifos mobile ecosystem.",

  products: [
    { name: "Field Officer App", note: "The app loan officers use in the field — the busiest review surface" },
    { name: "Mifos Mobile", note: "Self-service banking for microfinance customers" },
    { name: "Mifos Save", note: "Savings-focused mobile app" },
    { name: "KMP Project Template", note: "The starter every new Mifos mobile project is generated from" },
    { name: "Mifos Pay", note: "Kotlin Multiplatform digital wallet" },
    { name: "Open Banking & Group Banking", note: "Smaller surfaces across the wider Mifos X platform" },
  ],

  cta: {
    headlineLead: "Every review is",
    headlineAccent: "public",
    body: "Nothing here needs taking on trust — the threads, the pushback and the code that came out of them are all open.",
  },

  stack: [
    { title: "Reviewing", items: ["Kotlin Multiplatform", "Compose Multiplatform", "MVI", "Modularization"] },
    { title: "What I look for", items: ["State modelling", "Localisation", "Design tokens", "PR scope", "Accessibility"] },
    { title: "Mentoring", items: ["GSoC interviews", "C4GT interviews", "Standups", "Onboarding"] },
  ],

  links: [
    {
      text: "All 365 reviews",
      url: "https://github.com/pulls?q=is%3Apr+reviewed-by%3ArevanthKumarJ+org%3AopenMF+",
    },
    { text: "My openMF PRs", url: "https://github.com/pulls?q=is%3Apr+author%3ArevanthKumarJ+org%3AopenMF+" },
  ],
};
