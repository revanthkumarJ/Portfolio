import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import ProjectCard from "./ProjectCards";
import Particle from "../Particle";
import netflix from "../../Assets/Projects/netflix.png";
import abhiyanth from "../../Assets/Projects/abhiyanth.png";
import insta from "../../Assets/Projects/insta.png";
import mifosMobile from "../../Assets/Projects/mifosMobile.png";
import androidClient from "../../Assets/Projects/androidClient.png"
import kisan from "../../Assets/Projects/kisan.png"
import finance from "../../Assets/Projects/Finance.png"
import ipl from "../../Assets/Projects/ipl.png"
import department from "../../Assets/Projects/department.png"

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
              imgPath={mifosMobile}
              isBlog={false}
              title="Migration of Mifos-Mobile to KMP and CMP"
              description="Migrated 7 modules in Mifos-Mobile to KMP and CMP, supporting Android, iOS, Web, WASMJS, and Desktop. Merged a total of 11 PRs, handling migration and resolving bugs in a production-level application."
              ghLink="https://github.com/revanthkumarJ/mifos-mobile"
              demoLink="https://play.google.com/store/apps/details?id=org.mifos.mobile"
            />
          </Col>

          

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={abhiyanth}
              isBlog={false}
              title="Abhiyanth-Fest Website (Team Lead)"
              description="Led the frontend team for Abhiyanth-Fest Website development, using React, Redux, Firebase, and Material UI. Integrated Firebase for authentication and database management, and implemented CashFree Payments for secure online transactions. Managed project progress, reviewed and merged PRs, and collaborated with the team for deployment on Firebase Hosting, ensuring scalability and performance optimization."
              ghLink="https://github.com/revanthkumarJ/abhiyanth-client"
              demoLink="https://abhiyanthrkv.in/"
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={androidClient}
              isBlog={false}
              title="Migration of Android-Client to KMP and CMP"
              description="Migrated 5 modules in Android-Client to KMP and CMP, supporting Android, iOS, Web, WASMJS, and Desktop. Merged a total of 7 PRs, handling migration and resolving bugs in a production-level application."
              ghLink="https://github.com/revanthkumarJ/android-client"
              demoLink="https://play.google.com/store/apps/details?id=com.mifos.mifosxdroid"
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={finance}
              isBlog={false}
              title="Finance Client and API"
              description="Developed a RESTful finance API using Node.js, Express, and TypeScript to handle bank statements, supporting data uploads and analysis features. Built a React frontend website to interact with the API, allowing users to filter and analyze financial data efficiently. Used Material UI for the frontend design."
              ghLink="https://github.com/soumyajit4419/Plant_AI"
              demoLink="https://plant49-ai.herokuapp.com/"
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={kisan}
              isBlog={false}
              title="KisanConnect Client and API"
              description="Kisan Connect is an innovative platform designed to bridge the gap between farmers and customers, streamlining communication and deliveries. Developed dedicated interfaces for different user roles, including farmers, customers, delivery personnel, and administrators, ensuring a smooth and intuitive experience. Built using React, Node.js, Express, TypeScript, and Material UI."
              ghLink="https://github.com/soumyajit4419/AI_For_Social_Good"
            // demoLink="https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley" <--------Please include a demo link here
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={ipl}
              isBlog={false}
              title="Sports Auction Website"
              description="A web application designed to conduct a Mock IPL Auction event, displaying 250 player profiles from an Excel file. It includes features like player details display, navigation, and an engaging auction experience for 150+ students across 30 teams."
              ghLink="https://github.com/soumyajit4419/Face_And_Emotion_Detection"
            // demoLink="https://blogs.soumya-jit.tech/"      <--------Please include a demo link here 
            />
          </Col>


          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={department}
              isBlog={false}
              title="Departmental Resource Management App"
              description="A mobile app that streamlines announcements, complaints, timetable management, and faculty-student-HOD interactions within a department. Developed with Kotlin, Jetpack Compose, and Firebase integration."
              ghLink="https://github.com/soumyajit4419/AI_For_Social_Good"
            // demoLink="https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley" <--------Please include a demo link here
            />
          </Col>

         

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={insta}
              isBlog={false}
              title="Instagram Clone (UI)"
              description="A simple Instagram clone UI developed with Jetpack Compose, demonstrating how Compose can be used to design clean and attractive interfaces. Features a feed layout, profile page, and basic UI elements that mimic Instagram's aesthetic."
              ghLink="https://github.com/soumyajit4419/AI_For_Social_Good"
            // demoLink="https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley" <--------Please include a demo link here
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={netflix}
              isBlog={false}
              title="Netflix Clone (UI)"
              description="A Netflix clone UI created using Jetpack Compose, showcasing the power of Compose for creating modern, responsive, and smooth user interfaces. The app replicates the layout of Netflix with sections like featured content, categories, and more."
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
