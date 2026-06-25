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

export default function MifosDeveloper() {
  return (
    <>
      <DialogHero
        logo={mifosLogo}
        company="Mifos Initiative"
        role="Open Source Mobile Developer"
        timeframe="Nov 2024 – Present"
        currentlyWorking
      />

      <Section title="Overview">
        <p>
          Contributing to production repositories focused on financial
          inclusion — authoring features, migrating modules to Kotlin
          Multiplatform, and reviewing community PRs to keep the organization's
          mobile ecosystem consistent. A large share of this work overlapped
          with Mifos Summer of Code 2025, with contributions continuing before
          and after the program.
        </p>
      </Section>

      <Section title="By the Numbers">
        <MetricGrid
          metrics={[
            { value: "110+", label: "Pull requests authored" },
            { value: "98%", label: "Merge rate" },
            { value: "20+", label: "Modules migrated to KMP" },
            { value: "230+", label: "PRs reviewed" },
            { value: "5", label: "Repositories contributed" },
          ]}
        />
      </Section>

      <Section title="Repositories">
        <ProjectBlock
          name="Android Client (Field Officer app)"
          repoLabel="openMF/android-client"
          repoUrl="https://github.com/openMF/android-client"
          about="Kotlin Multiplatform field-officer app on the MifosX core banking platform, with robust offline support."
          highlights={[
            "50+ PRs migrating UI from Compose to KMP & CMP.",
            "Refactored client screens to the latest Figma designs and added type-safe navigation.",
          ]}
          prLink="https://github.com/openMF/android-client/pulls?q=is%3Amerged+is%3Apr+author%3ArevanthkumarJ+"
        />

        <ProjectBlock
          name="Mifos Mobile"
          repoLabel="openMF/mifos-mobile"
          repoUrl="https://github.com/openMF/mifos-mobile"
          about="Kotlin Multiplatform self-service client letting customers transact on their own accounts and loans across platforms."
          highlights={[
            "39+ PRs migrating modules to KMP/CMP and building new Figma-based screens.",
            "Added QR-code binding, localization, and improved state handling.",
          ]}
          prLink="https://github.com/openMF/mifos-mobile/pulls?q=is%3Amerged+is%3Apr+author%3ArevanthkumarJ+"
        />

        <ProjectBlock
          name="Mobile Wallet"
          repoLabel="openMF/mobile-wallet"
          repoUrl="https://github.com/openMF/mobile-wallet"
          about="Kotlin Multiplatform reference digital wallet on Apache Fineract for financial-inclusion use cases."
          highlights={[
            "Migrated APIs to the Self API and updated the flows.",
            "Refactored and enhanced UI screens around the new flows.",
          ]}
          prLink="https://github.com/openMF/mobile-wallet/pulls?q=is%3Amerged+is%3Apr+author%3ArevanthKumarJ+"
        />

        <ProjectBlock
          name="Mifos-X Group Banking"
          repoLabel="openMF/mifos-x-group-banking"
          repoUrl="https://github.com/openMF/mifos-x-group-banking"
          about="Contributed project setup work to bootstrap the repository."
          highlights={[
            "Added a run script and renamed files to initialize the project.",
          ]}
          prLink="https://github.com/openMF/mifos-x-group-banking/pulls?q=is%3Apr+author%3ArevanthkumarJ+is%3Amerged+"
        />

        <ProjectBlock
          name="KMP Project Template"
          repoLabel="openMF/kmp-project-template"
          repoUrl="https://github.com/openMF/kmp-project-template"
          about="The organization's Kotlin Multiplatform starter template used to bootstrap new Mifos projects."
          highlights={[
            "Implemented shared utility functions used across the template.",
          ]}
          prLink="https://github.com/openMF/kmp-project-template/pulls?q=is%3Amerged+is%3Apr+author%3ArevanthkumarJ+"
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
            "Clean Architecture",
            "MVI",
          ]}
        />
      </Section>

      <Section title="Links">
        <LinkRow
          links={[
            {
              text: "All Merged PRs (openMF)",
              url: "https://github.com/pulls?q=is%3Apr+is%3Amerged+author%3ArevanthKumarJ+org%3AopenMF+",
            },
            {
              text: "PRs Reviewed (openMF)",
              url: "https://github.com/pulls?q=is%3Apr+reviewed-by%3ArevanthKumarJ+org%3AopenMF+",
            },
            {
              text: "Mifos Mobile App",
              url: "https://play.google.com/store/apps/details?id=org.mifos.mobile",
            },
            {
              text: "Android Client App",
              url: "https://play.google.com/store/apps/details?id=com.mifos.mifosxdroid",
            },
            {
              text: "Mifos Pay App",
              url: "https://play.google.com/store/apps/details?id=org.mifospay",
            },
          ]}
        />
      </Section>
    </>
  );
}
