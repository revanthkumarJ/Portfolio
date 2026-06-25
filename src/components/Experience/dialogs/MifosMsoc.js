import React from "react";
import mifosLogo from "../../../Assets/mifos.jpg";
import {
  DialogHero,
  Section,
  TechBadges,
  MetricGrid,
  ProjectBlock,
  LinkRow,
} from "../dialogPrimitives";

export default function MifosMsoc() {
  return (
    <>
      <DialogHero
        logo={mifosLogo}
        company="Mifos Initiative"
        role="Mifos Summer of Code 2025 Intern"
        timeframe="Jun 2025 – Sep 2025"
      />

      <Section title="The Project">
        <p>
          MSoC is awarded to contributors who narrowly missed Google Summer of
          Code but had already made significant prior contributions. My core
          project was the <b>migration of the Mifos Field Officer application to
          Kotlin Multiplatform</b>, but the work extended across multiple
          repositories — enhancing functionality, fixing bugs, and strengthening
          the Kotlin Multiplatform ecosystem within Mifos. Most of this work was
          done during MSoC, with related migration tasks continuing before and
          after the program.
        </p>
      </Section>

      <Section title="By the Numbers">
        <MetricGrid
          metrics={[
            { value: "$2,500", label: "Program stipend" },
            { value: "100+", label: "PRs authored" },
            { value: "150+", label: "PRs reviewed" },
            { value: "3", label: "Repos migrated to KMP" },
          ]}
        />
      </Section>

      <Section title="Repositories">
        <ProjectBlock
          name="Android Client (Field Officer app)"
          repoLabel="openMF/android-client"
          repoUrl="https://github.com/openMF/android-client"
          about="A Kotlin Multiplatform app on the MifosX core banking platform for field officers to process transactions, manage clients, and handle accounts — with robust offline support so officers can work in remote areas and sync later."
          highlights={[
            "Authored 50+ pull requests across the Android client.",
            "Migrated UI from Jetpack Compose to KMP & CMP, aligning with the org's cross-platform strategy.",
            "Refactored client screens to the latest Figma designs for a modern, consistent UX.",
            "Fixed crashes, improved state handling, and added type-safe navigation and new UI components.",
          ]}
          prLink="https://github.com/openMF/android-client/pulls?q=is%3Amerged+is%3Apr+author%3ArevanthkumarJ+"
        />

        <ProjectBlock
          name="Mifos Mobile"
          repoLabel="openMF/mifos-mobile"
          repoUrl="https://github.com/openMF/mifos-mobile"
          about="A Kotlin Multiplatform self-service client built on MifosX, letting customers securely view and transact on their own accounts and loans across Android, iOS, Desktop, and Web."
          highlights={[
            "Authored 39+ pull requests in mifos-mobile.",
            "Migrated modules — :core:datastore, :core:ui, :libs:passcode, settings, savings, help, location — to KMP/CMP.",
            "Implemented new UIs for Transaction, Charges, Beneficiary, About Us, App Info, Passcode, and Password screens from Figma.",
            "Added Scaffold structure, QR-code binding, localization, and progress/state handling, and fixed API, validation, and navigation issues.",
          ]}
          prLink="https://github.com/openMF/mifos-mobile/pulls?q=is%3Amerged+is%3Apr+author%3ArevanthkumarJ+"
        />

        <ProjectBlock
          name="Mobile Wallet"
          repoLabel="openMF/mobile-wallet"
          repoUrl="https://github.com/openMF/mobile-wallet"
          about="A Kotlin Multiplatform reference digital wallet on Apache Fineract, supporting Android, iOS, desktop, and web with Compose Multiplatform, Ktor/Ktorfit, and Koin for financial-inclusion use cases."
          highlights={[
            "Migrated existing APIs to the Self API and updated the flows accordingly.",
            "Refactored and enhanced UI screens around the new Self API flows.",
            "Improved UX by aligning the app with updated API responses and mentor designs.",
          ]}
          prLink="https://github.com/openMF/mobile-wallet/pulls?q=is%3Amerged+is%3Apr+author%3ArevanthKumarJ+"
        />
      </Section>

      <Section title="Tech Stack">
        <TechBadges
          items={[
            "Kotlin Multiplatform",
            "Compose Multiplatform",
            "Ktor / Ktorfit",
            "Koin",
            "Room",
            "GitHub Actions (CI/CD)",
            "Clean Architecture",
            "MVI",
          ]}
        />
      </Section>

      <Section title="Outcome">
        <p>
          A transformative summer — from a contributor who once struggled to
          raise a single PR, to an MSoC intern who redesigned the Mifos Mobile
          and Android Client UIs and migrated both to Kotlin Multiplatform,
          modernizing legacy code and improving maintainability across
          platforms. Grew technically and in communication, collaboration, and
          ownership through daily standups and peer reviews.
        </p>
      </Section>

      <Section title="Links">
        <LinkRow
          links={[
            {
              text: "Full MSoC Writeup",
              url: "https://gist.github.com/revanthkumarJ/133c9e8ce0abb111fb19873ad902cb70",
            },
            {
              text: "Weekly Progress",
              url: "https://github.com/revanthkumarJ/MSOC_progress",
            },
            {
              text: "All Merged PRs (openMF)",
              url: "https://github.com/pulls?q=is%3Apr+is%3Amerged+author%3ArevanthKumarJ+org%3AopenMF+",
            },
            {
              text: "PRs Reviewed (openMF)",
              url: "https://github.com/pulls?q=is%3Apr+reviewed-by%3ArevanthKumarJ+org%3AopenMF+",
            },
          ]}
        />
      </Section>
    </>
  );
}
