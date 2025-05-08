import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import ProjectCard from "./ProjectCards";
import Particle from "../Particle";
import leaf from "../../Assets/Projects/leaf.png";
import emotion from "../../Assets/Projects/emotion.png";
import editor from "../../Assets/Projects/codeEditor.png";
import chatify from "../../Assets/Projects/chatify.png";
import suicide from "../../Assets/Projects/suicide.png";
import bitsOfCode from "../../Assets/Projects/blog.png";

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

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={chatify}
              isBlog={false}
              title="Migration of Mifos-Mobile to KMP and CMP"
    description="Migrated 7 modules in Mifos-Mobile to KMP and CMP, supporting Android, iOS, Web, WASMJS, and Desktop. Merged a total of 11 PRs, handling migration and resolving bugs in a production-level application."
    ghLink="https://github.com/soumyajit4419/Chatify"
              demoLink="https://chatify-49.web.app/"
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={bitsOfCode}
              isBlog={false}
              title="Migration of MifosX-Droid to KMP and CMP"
    description="Migrated 5 modules in MifosX-Droid to KMP and CMP, supporting Android, iOS, Web, WASMJS, and Desktop. Merged a total of 7 PRs, handling migration and resolving bugs in a production-level application."
    ghLink="https://github.com/soumyajit4419/Bits-0f-C0de"
              demoLink="https://blogs.soumya-jit.tech/"
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={editor}
              isBlog={false}
              title="Abhiyanth-Fest Website (Team Lead)"
    description="Led the frontend team for Abhiyanth-Fest Website development, using React, Redux, Firebase, and Material UI. Integrated Firebase for authentication and database management, and implemented CashFree Payments for secure online transactions. Managed project progress, reviewed and merged PRs, and collaborated with the team for deployment on Firebase Hosting, ensuring scalability and performance optimization."
    ghLink="https://github.com/soumyajit4419/Editor.io"
              demoLink="https://editor.soumya-jit.tech/"              
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={leaf}
              isBlog={false}
              title="Finance Client and API"
    description="Developed a RESTful finance API using Node.js, Express, and TypeScript to handle bank statements, supporting data uploads and analysis features. Built a React frontend website to interact with the API, allowing users to filter and analyze financial data efficiently. Used Material UI for the frontend design."
    ghLink="https://github.com/soumyajit4419/Plant_AI"
              demoLink="https://plant49-ai.herokuapp.com/"
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={suicide}
              isBlog={false}
              title="KisanConnect Client and API"
    description="Kisan Connect is an innovative platform designed to bridge the gap between farmers and customers, streamlining communication and deliveries. Developed dedicated interfaces for different user roles, including farmers, customers, delivery personnel, and administrators, ensuring a smooth and intuitive experience. Built using React, Node.js, Express, TypeScript, and Material UI."
    ghLink="https://github.com/soumyajit4419/AI_For_Social_Good"
              // demoLink="https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley" <--------Please include a demo link here
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={emotion}
              isBlog={false}
              title="Sports Auction Website"
              description="A web application designed to conduct a Mock IPL Auction event, displaying 250 player profiles from an Excel file. It includes features like player details display, navigation, and an engaging auction experience for 150+ students across 30 teams."
              ghLink="https://github.com/soumyajit4419/Face_And_Emotion_Detection"
              // demoLink="https://blogs.soumya-jit.tech/"      <--------Please include a demo link here 
            />
          </Col>


          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={suicide}
              isBlog={false}
              title="Departmental Resource Management App"
    description="A mobile app that streamlines announcements, complaints, timetable management, and faculty-student-HOD interactions within a department. Developed with Kotlin, Jetpack Compose, and Firebase integration."
    ghLink="https://github.com/soumyajit4419/AI_For_Social_Good"
              // demoLink="https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley" <--------Please include a demo link here
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={suicide}
              isBlog={false}
              title="Netflix Clone (UI)"
    description="A Netflix clone UI created using Jetpack Compose, showcasing the power of Compose for creating modern, responsive, and smooth user interfaces. The app replicates the layout of Netflix with sections like featured content, categories, and more."
    ghLink="https://github.com/soumyajit4419/AI_For_Social_Good"
              // demoLink="https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley" <--------Please include a demo link here
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={suicide}
              isBlog={false}
              title="Instagram Clone (UI)"
    description="A simple Instagram clone UI developed with Jetpack Compose, demonstrating how Compose can be used to design clean and attractive interfaces. Features a feed layout, profile page, and basic UI elements that mimic Instagram's aesthetic."
    ghLink="https://github.com/soumyajit4419/AI_For_Social_Good"
              // demoLink="https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley" <--------Please include a demo link here
            />
          </Col>
        </Row>
      </Container>
    </Container>
  );
}

export default Projects;
