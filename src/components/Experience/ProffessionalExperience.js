import React, { useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import Particle from "../Particle";
import { ExperienceDetailModal } from "./dialogPrimitives";
import dialogRegistry from "./dialogRegistry";
import mifosLogo from "../../Assets/mifos.jpg"
import MBSLogo from "../../Assets/MBS.avif"
import gfg from "../../Assets/GFG.png"
import nss from "../../Assets/nss.webp"
import abhiyanth from "../../Assets/Abhiyanthlogo2.png"
import SRC from "../../Assets/src_logo_white.jpeg"
import swipe from "../../Assets/images/swipe.jpg"
import tlde from "../../Assets/images/tlde.jpg"
import devDisplay from "../../Assets/images/dev_display.jpg"


// Reusable section component
function ExperienceSection({ title, experiences, onViewMore }) {
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
                                <Card.Title
                                    style={{
                                        color: "white",
                                        fontWeight: "bold",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center", // Centers the content horizontally
                                        textAlign: "center", // Ensures text is centered
                                        flexDirection: "row", // Default flex direction, can be omitted
                                    }}
                                >
                                    {/* Conditionally render the logo if present */}
                                    {exp.logo && (
                                        <img
                                            src={exp.logo}
                                            alt={exp.company}
                                            style={{
                                                width: "30px",
                                                height: "30px",
                                                marginRight: "10px",
                                                borderRadius: "50%",
                                            }}
                                        />
                                    )}
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

                                {/* 7. View more (only when this experience has a detail dialog) */}
                                {exp.detailKey && (
                                    <div className="exp-view-more-wrap">
                                        <Button
                                            variant="outline-light"
                                            className="exp-view-more-btn"
                                            onClick={() => onViewMore(exp.detailKey)}
                                        >
                                            View more
                                            <span className="exp-view-more-arrow">&rarr;</span>
                                        </Button>
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
    const [activeDetailKey, setActiveDetailKey] = useState(null);

    const technicalExperiences = [
  {
    company: "Swipe (YC S21)",
    logo: swipe,
    detailKey: "swipe-sde1",
    currentlyWorking: true,
    position: "SDE 1 - Android Developer",
    timeframe: "Jun 2026 – Present",
    roleDescription:
      "Promoted from Android Developer Intern to SDE 1. Owning and shipping high-impact production features, scaling the multi-module architecture, and improving app reliability for thousands of businesses.",
    productLinks: [
      {
        text: "Swipe App",
        url: "https://play.google.com/store/apps/details?id=com.swipe.bill"
      }
    ],
  },

  {
    company: "Swipe (YC S21)",
    logo: swipe,
    detailKey: "swipe-intern",
    currentlyWorking: false,
    position: "Android Developer Intern",
    timeframe: "Dec 2025 – Jun 2026",
    roleDescription:
      "Migrated 70+ screens from legacy XML to Jetpack Compose across 10 production flows, improving UX along the way, and restructured a monolithic codebase into multi-module Clean Architecture following MVI.",
    productLinks: [
      {
        text: "Swipe App",
        url: "https://play.google.com/store/apps/details?id=com.swipe.bill"
      }
    ],
  },

  {
    company: "Mifos Initiative",
    logo: mifosLogo,
    detailKey: "mifos-mentor",
    currentlyWorking: false,
    position: "Mentor",
    timeframe: "Mar 2026 – Present",
    roleDescription:
      "Mentoring and supporting open-source contributors by reviewing pull requests, running standups, and guiding Kotlin Multiplatform and mobile architecture discussions. Conducting GSoC and C4GT interviews and helping contributors onboard.",
    productLinks: [],
  },

  {
    company: "Mifos Initiative",
    logo: mifosLogo,
    detailKey: "mifos-developer",
    currentlyWorking: false,
    position: "Open Source Mobile Developer",
    timeframe: "Nov 2024 – Present",
    roleDescription:
      "Contributed to 5 production repositories focused on financial inclusion. Authored 110+ pull requests with a 98% merge rate, migrated 20+ modules to Kotlin Multiplatform, and reviewed 230+ contributor pull requests.",
    mergedPRs: 110,
    productLinks: [
      {
        text: "All Merged PRs",
        url: "https://github.com/pulls?q=is%3Apr+is%3Amerged+author%3ArevanthKumarJ+org%3AopenMF+"
      },
      {
        text: "Mifos Mobile App",
        url: "https://play.google.com/store/apps/details?id=org.mifos.mobile"
      },
      {
        text: "Android Client App",
        url: "https://play.google.com/store/apps/details?id=com.mifos.mifosxdroid"
      },
      {
        text: "Mifos Pay App",
        url: "https://play.google.com/store/apps/details?id=org.mifospay"
      }
    ],
  },

  {
    company: "Mifos Initiative",
    logo: mifosLogo,
    detailKey: "mifos-msoc",
    currentlyWorking: false,
    position: "Mifos Summer of Code 2025 Intern",
    timeframe: "Jun 2025 – Sep 2025",
    roleDescription:
      "Selected for the competitive Mifos Summer of Code 2025 program with a $2,500 stipend. Led UI modernization across 100+ screens and contributed to the migration from MVVM to MVI architecture.",
    productLinks: [
      {
        text: "MSOC Work",
        url: "https://gist.github.com/revanthkumarJ/133c9e8ce0abb111fb19873ad902cb70"
      },
      {
        text: "MSOC Weekly Progress",
        url: "https://github.com/revanthkumarJ/MSOC_progress"
      }
    ],
  },

  {
    company: "Mobile Byte Sensei",
    logo: MBSLogo,
    currentlyWorking: false,
    position: "Mobile Development Intern (KMP & CMP)",
    timeframe: "Apr 2025 – Nov 2025",
    roleDescription:
      "Delivered 7 production-grade Kotlin Multiplatform applications integrating Firebase, Compose Multiplatform, and CI/CD pipelines. Built reusable UI components, implemented file management features, integrated Firebase Analytics, and resolved critical Crashlytics-reported issues while collaborating in an Agile development environment.",
    productLinks: [
      {
        text: "Reels Downloader App",
        url: "https://play.google.com/store/apps/details?id=com.sensei.social"
      },
      {
        text: "Stories Downloader App",
        url: "https://play.google.com/store/apps/details?id=com.sensei.stories"
      },
      {
        text: "Byte Wallpaper App",
        url: "https://play.google.com/store/apps/details?id=org.mobilebytesensei.wallpaper"
      }
    ],
  },

  {
    company: "TLDE Technologies",
    logo: tlde,
    currentlyWorking: false,
    position: "Software Development Intern",
    timeframe: "Nov 2025 – Dec 2025",
    roleDescription:
      "Worked on a Kotlin Multiplatform application, focusing on UI development and onboarding experiences using Compose Multiplatform and Lottie animations.",
    productLinks: [],
  },

  {
    company: "Abhiyanth 2K25",
    logo: abhiyanth,
    currentlyWorking: false,
    position: "Frontend Team Lead & Developer + Social Media Manager",
    timeframe: "Dec 2024 – Mar 2025",
    roleDescription:
      "Led frontend development using React, integrated Firebase, built major parts of the admin panel, managed repositories, reviewed pull requests, coordinated with UI/UX teams, and handled social media promotions.",
    productLinks: [
      {
        text: "GitHub Repo",
        url: "https://github.com/revanthkumarJ/Abhiyanth-Client"
      }
    ],
  },

  {
    company: "DevDisplay",
    logo: devDisplay,
    currentlyWorking: false,
    position: "Open Source Contributor – React",
    timeframe: "Jan 2025 – Feb 2025",
    roleDescription:
      "Contributed UI enhancements and page development using React and Tailwind CSS. Worked on Sponsors, About Us, and Journey pages while delivering multiple visual and layout improvements.",
    mergedPRs: 10,
    productLinks: [
      {
        text: "Merged PRs",
        url: "https://github.com/codeaashu/DevDisplay/pulls?q=is%3Apr+is%3Amerged+author%3ArevanthkumarJ"
      }
    ],
  },

  {
    company: "GeeksforGeeks",
    logo: gfg,
    currentlyWorking: false,
    position: "Campus Ambassador",
    timeframe: "Apr 2024 – Apr 2025",
    roleDescription:
      "Promoted coding culture within the institute, coordinated contests and events, shared learning resources, and was recognized among the top-performing campus ambassadors.",
    productLinks: [],
  },
];




    const leadershipExperiences = [
        {
            company: "SRC Student Club",
            logo: SRC,
            currentlyWorking: false,
            position: "DSA Coordinator and Mentor",
            timeframe: "Apr 2024 – Mar 2025",
            roleDescription:
                "Led weekly coding contests and mentoring sessions to uplift peers’ DSA performance. Fostered active learning in the department.",
            mergedPRs: 0,
            productLinks: [
                {
                    text: "Conducted DSA Contest by GFG", url: "https://www.linkedin.com/posts/src-rgukt-rkvalley_abhiyanth2k25-geeksforgeeks-codingcontest-activity-7308086683910959105-5zJw?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEctTzYBhihGV9nORrzokaSCEYL9d3vTebY"
                },
                {
                    text: "App Development Session", url: "https://www.linkedin.com/posts/src-rgukt-rkvalley_share-and-grow-session-5-app-development-activity-7230602791776309250-xbXg?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEctTzYBhihGV9nORrzokaSCEYL9d3vTebY"
                },
                {
                    text: "Career Guidance to E1 Students", url: "https://www.linkedin.com/posts/src-rgukt-rkvalley_todays-learn-and-grow-session-4-with-newly-activity-7222986989250207746-phrZ?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEctTzYBhihGV9nORrzokaSCEYL9d3vTebY"
                },
                {
                    text: "DSA Session", url: "https://www.linkedin.com/posts/src-rgukt-rkvalley_as-a-part-of-share-and-grow-session-3-we-activity-7220446663411216384-NSHt?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEctTzYBhihGV9nORrzokaSCEYL9d3vTebY"
                }

            ],
        },
        {
            company: "Dept. of CSE, RGUKT RK Valley",
            logo: SRC,
            currentlyWorking: false,
            position: "Social Media Manager",
            timeframe: "Apr 2024 – Mar 2025",
            roleDescription:
                "Handled department's social media presence. Created regular updates, tracked analytics, and collaborated with club members to highlight achievements.",
            mergedPRs: 0,
            productLinks: [
                {
                    text: "Dept LinkdeIn Page", url: "https://www.linkedin.com/company/src-rgukt-rkvalley"
                }
            ],
        },
        {
            company: "National Service Scheme (NSS)",
            logo: nss,
            currentlyWorking: false,
            position: "Unit Coordinator & LinkedIn Page Maintainer (Unit-2)",
            timeframe: "Jan 2024 – Jan 2026",
            roleDescription:
                "Serving as NSS Unit Coordinator, organizing and leading social outreach activities. Also managing the LinkedIn page for NSS Unit-2, sharing updates, and promoting events to enhance public engagement.",
            mergedPRs: 0,
            productLinks: [
                { text: "NSS Unit-2 LinkedIn", url: "https://www.linkedin.com/showcase/nss-unit2" }
            ],
        },

        {
            company: "Dept. of CSE, RGUKT RK Valley",
            logo: SRC,
            currentlyWorking: false,
            position: "Class Representative",
            timeframe: "E3 Sem 1 (June 2024 - Nov 2024)",
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
                    onViewMore={setActiveDetailKey}
                />
                <ExperienceSection
                    title="Leadership & Volunteer Experience"
                    experiences={leadershipExperiences}
                    onViewMore={setActiveDetailKey}
                />
            </Container>

            <ExperienceDetailModal
                show={!!activeDetailKey}
                onHide={() => setActiveDetailKey(null)}
                registry={dialogRegistry}
                detailKey={activeDetailKey}
            />
        </Container>
    );
}

export default Experience;
