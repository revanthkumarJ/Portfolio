import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import myImg from "../../Assets/revanth3.jpeg";
import Tilt from "react-parallax-tilt";
import {
  AiFillGithub,
  AiOutlineTwitter,
  AiFillInstagram,
} from "react-icons/ai";
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
              I'm a passionate <b className="purple">Android Developer </b>
              focused on building modern, scalable, and user-centric applications.
              <br /><br />
              I primarily work with
              <b className="purple"> Kotlin, Java, and JavaScript</b>, and I enjoy solving
              complex problems through
              <b className="purple"> Data Structures and Algorithms</b>.
              <br /><br />
              I’ve contributed to <b className="purple">10+ production Android apps</b> and
              <b className="purple"> 100+ open-source PRs</b>, working on real-world
              applications across Android, KMP, and cross-platform environments.
              <br /><br />
              My technical toolkit includes{" "}
              <b className="purple">
                Jetpack Compose, Kotlin Multiplatform (KMP), Compose Multiplatform (CMP),
                React, Node.js, Express
              </b>{" "}
              and databases like{" "}
              <b className="purple">MongoDB, SQL, SQLite, Firebase & Firestore</b>.
              <br /><br />
              Currently, I’m working as an{" "}
              <b className="purple">Android Developer Intern at Swipe (YC S21)</b> and
              previously interned at 
              <b className="purple"> Mifos Initiative</b> ,
              <b className="purple"> MobileByteSensei</b>  , and the
              <b className="purple"> TLDE Technologies</b>.
            </p>
          </Col>

          <Col md={4} className="myAvtar">
            <Tilt>
              <img src={myImg} className="img-fluid" alt="avatar" />
            </Tilt>
          </Col>
        </Row>
        <Github/>
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
