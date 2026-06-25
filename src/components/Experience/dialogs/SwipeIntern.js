import React from "react";
import swipe from "../../../Assets/images/swipe.jpg";
import {
  DialogHero,
  Section,
  BulletList,
  TechBadges,
  MetricGrid,
  LinkRow,
} from "../dialogPrimitives";

export default function SwipeIntern() {
  return (
    <>
      <DialogHero
        logo={swipe}
        company="Swipe (YC S21)"
        role="Android Developer Intern"
        timeframe="Dec 2025 – Jun 2026"
      />

      <Section title="Overview">
        <p>
          Modernized production Android experiences by migrating legacy
          XML-based UI to Jetpack Compose, redesigning flows, upgrading API
          integrations, and restructuring a messy, monolithic codebase into a
          scalable multi-module Clean Architecture following MVI — not migrating
          blindly, but improving the user experience along the way.
        </p>
      </Section>

      <Section title="What I Built">
        <BulletList
          items={[
            "Migrated the onboarding screen — the first screen users see after login — to Jetpack Compose with a fresh, stunning UI, shaping the app's first impression.",
            "Migrated the document settings and template screens, critical surfaces for a billing software.",
            "Migrated the create expenses, indirect income, and create product screens, among others.",
            "Refactored 70+ screens during migration — not porting blindly, but improving the user experience along the way.",
            "Restructured messy, monolithic files into a multi-module Clean Architecture following MVI, built for future scale.",
            "Investigated and resolved production crashes and UI defects via Firebase Crashlytics and Intercom.",
          ]}
        />
      </Section>

      <Section title="Tech Stack">
        <TechBadges
          items={[
            "Kotlin",
            "Jetpack Compose",
            "Coroutines",
            "Flow",
            "Koin",
            "Retrofit",
            "Room",
            "Firebase Crashlytics",
            "MVI",
          ]}
        />
      </Section>

      <Section title="Impact">
        <MetricGrid
          metrics={[
            { value: "10", label: "Production flows modernized" },
            { value: "70+", label: "Screens migrated to Compose" },
          ]}
        />
      </Section>

      <Section title="Links">
        <LinkRow
          links={[
            {
              text: "Swipe App",
              url: "https://play.google.com/store/apps/details?id=com.swipe.bill",
            },
          ]}
        />
      </Section>
    </>
  );
}
