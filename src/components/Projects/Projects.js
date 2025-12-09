import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import ProjectCard from "./ProjectCards";
import Particle from "../Particle";

// Image imports
import netflix from "../../Assets/Projects/netflix.png";
import abhiyanth from "../../Assets/Projects/abhiyanth.png";
import insta from "../../Assets/Projects/insta.png";
import mifosMobile from "../../Assets/Projects/mifosMobile.png";
import androidClient from "../../Assets/Projects/androidClient.png";
import kisan from "../../Assets/Projects/kisan.png";
import finance from "../../Assets/Projects/Finance.png";
import ipl from "../../Assets/Projects/ipl.png";
import department from "../../Assets/Projects/department.png";

const projectList = [
  {
    imgPath: mifosMobile,
    title: "Migration of Mifos-Mobile to KMP and CMP",
    description:
      "Migrated 7 modules in Mifos-Mobile to KMP and CMP, supporting Android, iOS, Web, WASMJS, and Desktop. Merged a total of 39 PRs, handling migration and resolving bugs in a production-level application.",
    ghLinks: [
      { text: "GitHub", link: "https://github.com/openMF/mifos-mobile" },
      { text: "My Contributions", link: "https://github.com/openMF/mifos-mobile/pulls?q=is%3Amerged+is%3Apr+author%3ArevanthkumarJ+" }
    ],
    demoLinks: [
      { text: "Play Store", link: "https://play.google.com/store/apps/details?id=org.mifos.mobile" }
    ]
  },
  {
    imgPath: abhiyanth,
    title: "Abhiyanth-Fest Website (Team Lead)",
    description:
      "Led the frontend team for Abhiyanth-Fest Website using React, Redux, Firebase, and Material UI. Integrated authentication, CashFree Payments, and hosted on Firebase.",
    ghLinks: [
      { text: "Client", link: "https://github.com/revanthkumarJ/abhiyanth-client" },
    ],
    demoLinks: [
      
    ]
  },
  {
    imgPath: androidClient,
    title: "Migration of Android-Client to KMP and CMP",
    description:
      "Migrated 5 modules in Android-Client to KMP and CMP, supporting multiple platforms. Merged 52 PRs, resolving production-level bugs and creating new ui screens , enhancing screens.",
    ghLinks: [
      { text: "GitHub", link: "https://github.com/openMF/android-client" },
      { text: "My Contributions", link: "https://github.com/openMF/android-client/pulls?q=is%3Amerged+is%3Apr+author%3ArevanthkumarJ+" }
    ],
    demoLinks: [
      { text: "Play Store", link: "https://play.google.com/store/apps/details?id=com.mifos.mifosxdroid" }
    ]
  },{
    imgPath: department,
    title: "Departmental Resource Management App",
    description:
      "Kotlin app for managing announcements, complaints, timetables, and interactions among students, faculty, and HOD. Firebase-powered backend.",
    ghLinks: [
      { text: "GitHub", link: "https://github.com/revanthkumarJ/Departmental-Resource-Management-App" }
    ],
    demoLinks: []
  },
  {
    imgPath: kisan,
    title: "KisanConnect Client and API",
    description:
      "Platform to connect farmers and customers. Built role-based UIs with React, Express, and TypeScript. Ensured seamless communication and delivery tracking.",
    ghLinks: [
      { text: "GitHub Client", link: "https://github.com/revanthkumarJ/kisan_connect_client" },
      { text: "GitHub API", link: "https://github.com/revanthkumarJ/Kisan_connect_API" },
      { text: "GitHub App", link: "https://github.com/revanthkumarJ/KisanConnectApp" }
    ],
    demoLinks: []
  },
  {
    imgPath: finance,
    title: "Finance Client and API",
    description:
      "Developed a finance API using Node.js & TypeScript and a React frontend to manage and analyze bank statements. Used Material UI for design.",
    ghLinks: [
      { text: "GitHub Client", link: "https://github.com/revanthkumarJ/Finance-Client" },
      { text: "GitHub API", link: "https://github.com/revanthkumarJ/Finance-API" },
    ],
    demoLinks: [
      
    ]
  },
  {
    imgPath: ipl,
    title: "Sports Auction Website",
    description:
      "Mock IPL Auction web app that displayed 250 players, organized bidding for 150+ students across 30 teams.",
    ghLinks: [
      { text: "GitHub", link: "https://github.com/revanthkumarJ/Sports-Auction" }
    ],
    demoLinks: [
      { text: "Live Link", link: "https://sports-auction.vercel.app/" }
    ]
  },
  {
    imgPath: insta,
    title: "Instagram Clone (UI)",
    description:
      "Instagram UI clone using Jetpack Compose to demonstrate feed, profile screen, and modern UI design.",
    ghLinks: [
      { text: "GitHub", link: "https://github.com/revanthkumarJ/InstaUI" }
    ],
    demoLinks: []
  },
  {
    imgPath: netflix,
    title: "Netflix Clone (UI)",
    description:
      "Netflix UI clone built with Jetpack Compose, showcasing featured sections and layout aesthetics.",
    ghLinks: [
      { text: "GitHub", link: "https://github.com/revanthkumarJ/NetFlixUI" }
    ],
    demoLinks: []
  },
];

function Projects() {
  return (
    <Container fluid className="project-section">
      <Particle />
      <Container>
        <h1 className="project-heading">
          My <strong className="purple">Projects</strong> and <strong className="purple">Contributions</strong>
        </h1>
        <p style={{ color: "white" }}>
          Here are some of the projects and contributions I've made throughout my journey as a programmer.
        </p>

        <Row style={{ justifyContent: "center", paddingBottom: "10px" }}>
          {projectList.map((project, index) => (
            <Col md={4} className="project-card" key={index}>
              <ProjectCard
                imgPath={project.imgPath}
                isBlog={false}
                title={project.title}
                description={project.description}
                ghLinks={project.ghLinks}
                demoLinks={project.demoLinks}
              />
            </Col>
          ))}
        </Row>
      </Container>
    </Container>
  );
}

export default Projects;
