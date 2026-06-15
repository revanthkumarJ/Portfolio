import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import myImg from "../../Assets/revanth3.jpeg";
import Tilt from "react-parallax-tilt";
import { AiFillGithub, AiFillInstagram } from "react-icons/ai";
import { FaLinkedinIn } from "react-icons/fa";
import CodingProfiles from "../About/CodingProfiles";
import Github from "../About/Github";

function Home2() {
  return (
    <Container fluid className="home-about-section" id="about">
      <Container>
        <Row>
          <Col md={8} className="home-about-description">
            <h1 style={{ fontSize: "2.6em" }}>
              LET ME <span className="purple"> INTRODUCE </span> MYSELF
            </h1>
            <p className="home-about-body">
              I'm a passionate <b className="purple">Android Developer</b> focused on
              building scalable, high-quality mobile applications and delivering impactful
              user experiences.
              <br />
              <br />

              I primarily work with
              <b className="purple"> Kotlin, Jetpack Compose, Kotlin Multiplatform (KMP) </b>
              and modern Android development practices, while maintaining a strong
              foundation in
              <b className="purple"> Data Structures and Algorithms</b>.
              <br />
              <br />

              I've contributed to
              <b className="purple"> 10+ production applications </b>,
              authored
              <b className="purple"> 110+ open-source pull requests </b>,
              reviewed
              <b className="purple"> 230+ community contributions </b>,
              and mentored contributors through open-source programs such as
              <b className="purple"> GSoC and C4GT</b>.
              <br />
              <br />

              My experience spans
              <b className="purple">
                {" "}Android, Kotlin Multiplatform, Compose Multiplatform,
                Clean Architecture, MVI, React, Node.js </b>
               and modern backend integrations.
              <br />
              <br />

              Currently, I am working as an
              <b className="purple"> SDE 1 - Android Developer at Swipe (YC S21) </b>
              while actively contributing to and mentoring within the
              <b className="purple"> Mifos open-source community</b>.
            </p>
          </Col>

          <Col md={4} className="myAvtar">
            <Tilt>
              <img src={myImg} className="img-fluid" alt="avatar" />
            </Tilt>
          </Col>
        </Row>
        <Github />
        <h1 className="project-heading">
          <strong className="purple">My Coding Profiles</strong>
        </h1>
        <CodingProfiles />

        <Row>
          <Col md={12} className="home-about-social">
            <h1>FIND ME ON</h1>
            <p>
              Feel free to <span className="purple">connect </span>with me
            </p>
            <ul className="home-about-social-links">
              <li className="social-icons">
                <a
                  href="https://github.com/revanthkumarJ"
                  target="_blank"
                  rel="noreferrer"
                  className="icon-colour  home-social-icons"
                >
                  <AiFillGithub />
                </a>
              </li>
              {/* <li className="social-icons">
                <a
                  href="https://twitter.com/Soumyajit4419"
                  target="_blank"
                  rel="noreferrer"
                  className="icon-colour  home-social-icons"
                >
                  <AiOutlineTwitter />
                </a>
              </li> */}
              <li className="social-icons">
                <a
                  href="https://www.linkedin.com/in/jilakararevanthkumar/"
                  target="_blank"
                  rel="noreferrer"
                  className="icon-colour  home-social-icons"
                >
                  <FaLinkedinIn />
                </a>
              </li>
              <li className="social-icons">
                <a
                  href="https://www.instagram.com/revanth_kumar_j"
                  target="_blank"
                  rel="noreferrer"
                  className="icon-colour home-social-icons"
                >
                  <AiFillInstagram />
                </a>
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
    </Container>
  );
}
export default Home2;
