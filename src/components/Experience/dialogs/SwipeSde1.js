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

export default function SwipeSde1() {
  return (
    <>
      <DialogHero
        logo={swipe}
        company="Swipe (YC S21)"
        role="SDE 1 — Android Developer"
        timeframe="Jun 2026 – Present"
        currentlyWorking
      />

      <Section title="Overview">
        <p>
          Promoted from Android Developer Intern to SDE 1, working across many
          high-impact areas of the Swipe billing app — owning entire feature
          flows end to end, resolving customer issues, and improving the app's
          architecture and build tooling.
        </p>
      </Section>

      <Section title="Feature Flows I Own">
        <BulletList
          items={[
            "Built all settings pages in the Swipe app — document settings, general settings, thermal print settings, and product settings.",
            "Owned the entire products flow — products list, create product, and edit product.",
            "Owned the entire expenses and indirect income flows — list, create, and edit.",
            "Worked on notifications, thermal prints, and PDF generation.",
          ]}
        />
      </Section>

      <Section title="Engineering & Reliability">
        <BulletList
          items={[
            "Introduced build-logic convention plugins, cutting app build.gradle size and complexity by ~80%.",
            "Migrated legacy XML screens to Jetpack Compose.",
            "Resolved customer issues and feature requests via Intercom.",
            "Investigated and fixed production crashes using Firebase Crashlytics.",
            "Reviewed code and guided architectural consistency across the team.",
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
            "Gradle Convention Plugins",
            "Firebase Crashlytics",
            "Intercom",
            "Clean Architecture",
            "MVI",
          ]}
        />
      </Section>

      <Section title="Impact">
        <MetricGrid
          metrics={[
            { value: "~80%", label: "build.gradle size & complexity cut" },
            { value: "End-to-end", label: "Feature flows owned" },
            { value: "1000s", label: "Businesses reached" },
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
