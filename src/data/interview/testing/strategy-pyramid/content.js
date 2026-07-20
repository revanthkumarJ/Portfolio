// Testing Strategy & the Pyramid — Content tab. Teaching-first.

const content = [
  {
    heading: "Why test, and what tests give you",
    blocks: [
      {
        t: "p",
        text: "**Testing** means writing code that verifies your app's code behaves correctly, automatically. The value isn't just 'catching bugs' — it's *confidence to change code*. Without tests, every change risks silently breaking something, so you become afraid to refactor. With a good test suite, you change code freely and the tests tell you immediately if you broke something. Tests also *document* expected behavior (a test is an executable spec of what a function should do) and catch regressions (a bug you fix, plus a test, never comes back).",
      },
      {
        t: "list",
        items: [
          "**Confidence to refactor** — the biggest benefit. Tests are a safety net that lets you improve code without fear.",
          "**Regression prevention** — a bug fixed with a test can't silently return.",
          "**Living documentation** — tests show how code is *meant* to be used and what it should do.",
          "**Faster feedback** — a failing unit test tells you exactly what broke in seconds, versus discovering it in production.",
        ],
      },
    ],
  },
  {
    heading: "The testing pyramid",
    blocks: [
      {
        t: "p",
        text: "The **testing pyramid** is a strategy for *how many of each kind of test* to write. It's a triangle: lots of fast, cheap **unit tests** at the bottom; fewer **integration tests** in the middle; and a small number of slow, expensive **end-to-end / UI tests** at the top. The shape reflects a cost/speed/confidence trade-off — you want most of your coverage from the fast, cheap tests, and only a few of the slow, brittle ones.",
      },
      {
        t: "table",
        headers: ["Layer", "What it tests", "Speed / cost", "How many"],
        rows: [
          ["Unit tests (bottom)", "a single class/function in isolation (a ViewModel, a use case, a mapper)", "very fast (JVM, milliseconds), cheap", "many (the bulk)"],
          ["Integration tests (middle)", "several components together (repository + DAO, ViewModel + repository)", "slower (may need a device/Robolectric)", "some"],
          ["UI / end-to-end (top)", "whole flows through the real UI (login → home → detail)", "slow (on-device), brittle", "few (critical paths only)"],
        ],
      },
      {
        t: "list",
        items: [
          "**Unit tests (base)** — test one unit in isolation, on the JVM (no device), with dependencies faked. Fast (milliseconds), reliable, and pinpoint exactly what broke. Most of your tests should be here — ViewModels, use cases, repositories (with fakes), mappers, utilities.",
          "**Integration tests (middle)** — test that components work *together* correctly (a repository actually reading from a real Room DB, a ViewModel driving a repository). Slower, but catch wiring bugs unit tests miss.",
          "**UI / end-to-end tests (top)** — drive the real UI through a whole user flow. They give the most *realistic* confidence but are slow (run on an emulator/device), brittle (break on UI changes), and hard to debug. Reserve them for a few critical journeys (login, checkout).",
        ],
      },
    ],
  },
  {
    heading: "Why the pyramid shape (not an inverted one)",
    blocks: [
      {
        t: "list",
        items: [
          "**Speed** — unit tests run in milliseconds on the JVM; UI tests take seconds each on a device. A suite of thousands of unit tests runs in seconds; thousands of UI tests would take hours. Fast tests get run often (every save, every commit); slow ones get skipped.",
          "**Reliability** — unit tests are deterministic; UI tests are *flaky* (timing issues, animations, device state, emulator hiccups). A flaky suite that fails randomly gets ignored, defeating the point.",
          "**Precision** — a failing unit test points at the exact function; a failing end-to-end test tells you 'something in this whole flow broke' but not *what*, requiring debugging.",
          "**The anti-pattern — 'ice cream cone'**: mostly UI tests, few unit tests. It's slow, flaky, and expensive to maintain — the inverse of what you want. Aim for a pyramid: build correctness bottom-up with cheap unit tests, and use a *thin* layer of UI tests for confidence that the pieces integrate.",
        ],
      },
    ],
  },
  {
    heading: "Android's test categories: local vs instrumented",
    blocks: [
      {
        t: "table",
        headers: ["", "Local (unit) tests", "Instrumented tests"],
        rows: [
          ["Where", "`src/test/` — run on the JVM (your machine)", "`src/androidTest/` — run on a device/emulator"],
          ["Speed", "very fast (no device)", "slow (device deployment + execution)"],
          ["Android framework", "not available (or use Robolectric to fake it)", "real Android framework available"],
          ["Use for", "pure logic — ViewModels, use cases, repositories with fakes", "UI tests, Room DAO tests, things needing real Android"],
        ],
      },
      {
        t: "list",
        items: [
          "**Local/unit tests (`src/test/`)** run on the JVM — fast, no device. Pure Kotlin/Java logic tests go here. Since the Android framework isn't available, you either avoid it (test framework-free logic) or use **Robolectric** (which provides a fake Android framework on the JVM).",
          "**Instrumented tests (`src/androidTest/`)** run on a real device/emulator with the actual Android framework — needed for UI tests (Compose/Espresso) and things that need real Android behavior (some Room, real Context). Slower but realistic.",
          "**The design implication**: architecture that *separates logic from the framework* (Clean Architecture, framework-free domain/ViewModel logic) is what makes most of your tests fast JVM unit tests. Logic tangled with Android forces slow instrumented tests. This is a major practical reason for the layered architecture.",
        ],
      },
      {
        t: "note",
        text: "Testing strategy essentials: tests give confidence to refactor, prevent regressions, and document behavior. The pyramid — many fast unit tests (JVM, isolated, faked dependencies), some integration tests (components together), few UI/e2e tests (whole flows, slow/brittle) — because fast reliable tests get run and pinpoint failures, while slow flaky UI tests should be a thin top layer. Android split: local tests (src/test, JVM, fast) vs instrumented (src/androidTest, device, real framework). Framework-free architecture keeps most tests fast.",
      },
    ],
  },
];

export default content;
