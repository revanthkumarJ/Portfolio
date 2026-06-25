import React from "react";
import mifosLogo from "../../../Assets/mifos.jpg";
import {
  DialogHero,
  Section,
  BulletList,
  TechBadges,
  MetricGrid,
} from "../dialogPrimitives";

export default function MifosMentor() {
  return (
    <>
      <DialogHero
        logo={mifosLogo}
        company="Mifos Initiative"
        role="Mentor"
        timeframe="Mar 2026 – Present"
        currentlyWorking
      />

      <Section title="Overview">
        <p>
          Mentoring and supporting open-source contributors by reviewing pull
          requests, conducting standups, and guiding discussions on Kotlin
          Multiplatform and mobile architecture.
        </p>
      </Section>

      <Section title="What I Do">
        <BulletList
          items={[
            "Conduct interviews for Google Summer of Code (GSoC) and Code4GovTech (C4GT).",
            "Help contributors onboard successfully into the community.",
            "Review pull requests across community projects.",
            "Run standups and guide architecture discussions.",
          ]}
        />
      </Section>

      <Section title="Focus Areas">
        <TechBadges
          items={[
            "Kotlin Multiplatform",
            "Mobile Architecture",
            "Code Review",
            "Mentorship",
            "Open Source",
          ]}
        />
      </Section>

      <Section title="Impact">
        <MetricGrid
          metrics={[
            { value: "230+", label: "PRs reviewed" },
            { value: "GSoC / C4GT", label: "Programs supported" },
          ]}
        />
      </Section>
    </>
  );
}
