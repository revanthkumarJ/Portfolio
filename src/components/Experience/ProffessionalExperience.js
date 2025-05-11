import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import Particle from "../Particle";

// Reusable section component
function ExperienceSection({ title, experiences }) {
    return (
        <div style={{ marginBottom: "40px" }}>
            <h2 className="project-heading" style={{ marginTop: "40px" }}>
                {title}
            </h2>
            <Row style={{ justifyContent: "center", paddingBottom: "20px" }}>
                {experiences.map((exp, index) => (
                    <Col md={6} key={index} className="project-card">
                        <Card className="project-card-view">
                            <Card.Body>
                                {/* 1. Company Name */}
                                <Card.Title style={{ color: "white", fontWeight: "bold" }}>
                                    {exp.company}
                                </Card.Title>

                                {/* 2. Current Status */}
                                {exp.currentlyWorking && (
                                    <p style={{ color: "lightgreen", marginBottom: "6px" }}>
                                        Currently Working
                                    </p>
                                )}

                                {/* 3. Position and Timeframe */}
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        color: "white",
                                        fontWeight: "500",
                                    }}
                                >
                                    <span>{exp.position}</span>
                                    <span>{exp.timeframe}</span>
                                </div>

                                {/* 4. Role Description */}
                                <p style={{ color: "white", marginTop: "10px" }}>
                                    {exp.roleDescription}
                                </p>

                                {/* 5. Number of Merged PRs */}
                                {exp.mergedPRs > 0 && 
                                (<p style={{ color: "white" }}>
                                    <strong>Merged PRs:</strong> {exp.mergedPRs}
                                </p>)}

                                {/* 6. Product Links */}
                                {exp.productLinks.length > 0 && (
                                    <div style={{ marginTop: "10px" }}>
                                        <strong style={{ color: "white" }}>Links:</strong>
                                        <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                            {exp.productLinks.map((link, linkIdx) => (
                                                <a
                                                    key={linkIdx}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-outline-info btn-sm"
                                                >
                                                    {link.text}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
}

// Main Experience Component
function Experience() {
    const technicalExperiences = [
  {
    company: "Mifos Initiative",
    currentlyWorking: true,
    position: "Open Source Android Developer",
    timeframe: "Nov 2024 – Present",
    roleDescription:
      "Contributing to a Kotlin multi-modular Jetpack Compose project migration to CMP & KMP. Merged 19+ PRs involving architecture changes, UI enhancements, and documentation updates. Collaborating with open-source teams via standup calls.",
    mergedPRs: 19,
    productLinks: [
      { text: "Mifos Mobile Github", url: "https://github.com/revanthkumarJ/mifos-mobile" },
      { text: "Android Client Github", url: "https://github.com/revanthkumarJ/android-client" },
      { text: "Mobile Wallet Github", url: "https://github.com/revanthkumarJ/mobile-wallet" },
      
    ],
  },
  {
  company: "Mobile Byte Sensei",
  currentlyWorking: true,
  position: "Kotlin Developer (KMP & CMP)",
  timeframe: "May 2025 – Present",
  roleDescription:
    "Working at a startup focused on enhancing real-time KMP (Kotlin Multiplatform) applications already deployed on the Play Store. Contributing to Kotlin codebases using Jetpack Compose, KMP, and CMP to deliver cross-platform feature improvements.",
  mergedPRs: 4,
  productLinks: [
    { text: "Project Repo", url: "https://github.com/yourproject" },
  ],
},
  {
    company: "Abhiyanth 2K25",
    currentlyWorking: false,
    position: "Frontend Lead & Social Media Manager",
    timeframe: "Dec 2024 – Feb 2025",
    roleDescription:
      "Led frontend development using React, handled Firebase deployment, and maintained the GitHub repo. Collaborated with UI/UX team and ensured timely PR reviews and merges.",
    mergedPRs: 88,
    productLinks: [
      { text: "GitHub Repo", url: "https://github.com/revanthkumarJ/Abhiyanth-Client" },
      { text: "Live Site", url: "https://abhiyanthrkv.in/" },
    ],
  },
  {
    company: "GeeksforGeeks",
    currentlyWorking: false,
    position: "Campus Ambassador",
    timeframe: "Apr 2024 – Apr 2025",
    roleDescription:
      "Promoted GFG initiatives, shared resources like premium MongoDB course, organized coding contests, and improved peer engagement with GFG platforms.",
    mergedPRs: 0,
    productLinks: [
      { text: "GFG DSA 160-Day Challenge", url: "https://example.com/gfg-dsa-challenge" },
    ],
  },
  
];


    const leadershipExperiences = [
  {
    company: "SRC Student Club",
    currentlyWorking: false,
    position: "DSA Coordinator and Mentor",
    timeframe: "Apr 2024 – Mar 2025",
    roleDescription:
      "Led weekly coding contests and mentoring sessions to uplift peers’ DSA performance. Fostered active learning in the department.",
    mergedPRs: 0,
    productLinks: [
      
    ],
  },
  {
    company: "Dept. of CSE, RGUKT RK Valley",
    currentlyWorking: false,
    position: "Social Media Manager",
    timeframe: "Apr 2024 – Mar 2025",
    roleDescription:
      "Handled department's social media presence. Created regular updates, tracked analytics, and collaborated with club members to highlight achievements.",
    mergedPRs: 0,
    productLinks: [],
  },
  {
    company: "National Service Scheme (NSS)",
    currentlyWorking: true,
    position: "Volunteer",
    timeframe: "Jan 2024 – Present",
    roleDescription:
      "Engaged in social outreach and volunteering activities under NSS to serve the community and support institutional initiatives.",
    mergedPRs: 0,
    productLinks: [],
  },
  {
  company: "Dept. of CSE, RGUKT RK Valley",
  currentlyWorking: false,
  position: "Class Representative",
  timeframe: "E3 Sem 1",
  roleDescription:
    "Acted as Class Representative for E3 Sem 1, serving as a bridge between faculty and students, coordinating classes, and strengthening leadership and communication skills.",
  mergedPRs: 0,
  productLinks: [],
}

];

    return (
        <Container fluid className="project-section">
            <Particle />
            <Container>
                <h1 className="project-heading">
                    My <strong className="purple">Experience</strong>
                </h1>
                <p style={{ color: "white" }}>
                    These are the organizations I’ve worked with and the impact I’ve made.
                </p>

                <ExperienceSection
                    title="Technical Experience"
                    experiences={technicalExperiences}
                />
                <ExperienceSection
                    title="Leadership & Volunteer Experience"
                    experiences={leadershipExperiences}
                />
            </Container>
        </Container>
    );
}

export default Experience;
