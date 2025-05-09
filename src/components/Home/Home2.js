import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import myImg from "../../Assets/avatar.svg";
import Tilt from "react-parallax-tilt";
import {
  AiFillGithub,
  AiOutlineTwitter,
  AiFillInstagram,
} from "react-icons/ai";
import { FaLinkedinIn } from "react-icons/fa";

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
      I'm passionate about <b className="purple">software development</b> and have a strong foundation in
      <i>
        <b className="purple"> Java, JavaScript, and Kotlin</b>
      </i>
      .
      <br />
      <br />
      My interests lie in building scalable and responsive{" "}
      <i>
        <b className="purple">web and mobile applications</b>
      </i>
      , and I enjoy solving complex problems through
      <b className="purple"> Data Structures and Algorithms</b>.
      <br />
      <br />
      I’ve worked with technologies like{" "}
      <b className="purple">React, Node.js, Express, Jetpack Compose,</b> and databases like{" "}
      <b className="purple">MongoDB</b>. I'm also exploring{" "}
      <b className="purple">Firebase</b> integration in mobile apps.
      <br />
      <br />
      Currently exploring{" "}
      <i>
        <b className="purple">KMP (Kotlin Multiplatform)</b>
      </i>{" "}
      and{" "}
      <i>
        <b className="purple">CMP (Compose Multiplatform) </b>
      </i>{" "}
       to build cross-platform experiences with modern UI practices.
    </p>
  </Col>
  <Col md={4} className="myAvtar">
    <Tilt>
      <img src={myImg} className="img-fluid" alt="avatar" />
    </Tilt>
  </Col>
</Row>

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
