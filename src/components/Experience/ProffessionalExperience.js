import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import Particle from "../Particle";
import mifosLogo from "../../Assets/mifos.jpg"
import MBSLogo from "../../Assets/MBS.avif"
import gfg from "../../Assets/GFG.png"
import nss from "../../Assets/nss.webp"
import abhiyanth from "../../Assets/Abhiyanthlogo2.png"
import SRC from "../../Assets/src_logo_white.jpeg"


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
            logo:mifosLogo,
            currentlyWorking: true,
            position: "Open Source Android Developer",
            timeframe: "Nov 2024 – Present",
            roleDescription:
                "Contributing to a Kotlin multi-modular Jetpack Compose project migration to CMP & KMP. Merged 19+ PRs involving architecture changes, UI enhancements, and documentation updates. Collaborating with open-source teams via standup calls.",
            mergedPRs: 19,
            productLinks: [
                { text: "Mifos Mobile Github", url: "https://github.com/revanthkumarJ/mifos-mobile" },
                { text: "Android Client Github", url: "https://github.com/revanthkumarJ/android-client" },
                { text: "Mifos Pay Github", url: "https://github.com/revanthkumarJ/mobile-wallet" },
                { text: "Mifos Mobile App", url: "https://play.google.com/store/apps/details?id=org.mifos.mobile" },
                { text: "Android Client App", url: "https://play.google.com/store/apps/details?id=com.mifos.mifosxdroid" },
                { text: "Mifos Pay App", url: "https://play.google.com/store/apps/details?id=org.mifospay" },

            ],
        },
        {
            company: "Mobile Byte Sensei",
            logo:MBSLogo,
            currentlyWorking: true,
            position: "Kotlin Developer (KMP & CMP)",
            timeframe: "May 2025 – Present",
            roleDescription:
                "Working at a startup focused on enhancing real-time KMP (Kotlin Multiplatform) applications already deployed on the Play Store. Contributing to Kotlin codebases using Jetpack Compose, KMP, and CMP to deliver cross-platform feature improvements.",
            mergedPRs: 4,
            productLinks: [
                { text: "Reels Downloader App", url: "https://play.google.com/store/apps/details?id=com.sensei.social" },
                { text: "Byte Wallpaper App", url: "https://play.google.com/store/apps/details?id=org.mobilebytesensei.wallpaper" },
            ],
        },
        {
            company: "Abhiyanth 2K25",
            logo:abhiyanth,
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
            logo:gfg,
            currentlyWorking: false,
            position: "Campus Ambassador",
            timeframe: "Apr 2024 – Apr 2025",
            roleDescription:
                "Promoted GFG initiatives, shared resources like premium MongoDB course, organized coding contests, and improved peer engagement with GFG platforms.",
            mergedPRs: 0,
            productLinks: [
                
            ],
        },

    ];


    const leadershipExperiences = [
        {
            company: "SRC Student Club",
            logo:SRC,
            currentlyWorking: false,
            position: "DSA Coordinator and Mentor",
            timeframe: "Apr 2024 – Mar 2025",
            roleDescription:
                "Led weekly coding contests and mentoring sessions to uplift peers’ DSA performance. Fostered active learning in the department.",
            mergedPRs: 0,
            productLinks: [
                {
                    text:"Conducted DSA Contest by GFG",url:"https://www.linkedin.com/posts/src-rgukt-rkvalley_abhiyanth2k25-geeksforgeeks-codingcontest-activity-7308086683910959105-5zJw?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEctTzYBhihGV9nORrzokaSCEYL9d3vTebY"
                },
                {
                    text:"App Development Session",url:"https://www.linkedin.com/posts/src-rgukt-rkvalley_share-and-grow-session-5-app-development-activity-7230602791776309250-xbXg?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEctTzYBhihGV9nORrzokaSCEYL9d3vTebY"
                },
                {
                    text:"Career Guidance to E1 Students",url:"https://www.linkedin.com/posts/src-rgukt-rkvalley_todays-learn-and-grow-session-4-with-newly-activity-7222986989250207746-phrZ?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEctTzYBhihGV9nORrzokaSCEYL9d3vTebY"
                },
                {
                    text:"DSA Session",url:"https://www.linkedin.com/posts/src-rgukt-rkvalley_as-a-part-of-share-and-grow-session-3-we-activity-7220446663411216384-NSHt?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEctTzYBhihGV9nORrzokaSCEYL9d3vTebY"
                }
                
            ],
        },
        {
            company: "Dept. of CSE, RGUKT RK Valley",
            logo:SRC,
            currentlyWorking: false,
            position: "Social Media Manager",
            timeframe: "Apr 2024 – Mar 2025",
            roleDescription:
                "Handled department's social media presence. Created regular updates, tracked analytics, and collaborated with club members to highlight achievements.",
            mergedPRs: 0,
            productLinks: [
                {
                    text:"Dept LinkdeIn Page",url:"https://www.linkedin.com/company/src-rgukt-rkvalley"
                }
            ],
        },
        {
            company: "National Service Scheme (NSS)",
            logo:nss,
            currentlyWorking: true,
            position: "Unit Coordinator & LinkedIn Page Maintainer (Unit-2)",
            timeframe: "Jan 2024 – Present",
            roleDescription:
                "Serving as NSS Unit Coordinator, organizing and leading social outreach activities. Also managing the LinkedIn page for NSS Unit-2, sharing updates, and promoting events to enhance public engagement.",
            mergedPRs: 0,
            productLinks: [
                { text: "NSS Unit-2 LinkedIn", url: "https://www.linkedin.com/showcase/nss-unit2" }
            ],
        },

        {
            company: "Dept. of CSE, RGUKT RK Valley",
            logo:SRC,
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
