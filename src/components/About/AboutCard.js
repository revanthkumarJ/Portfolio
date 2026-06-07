import React from "react";
import Card from "react-bootstrap/Card";
import { ImPointRight } from "react-icons/im";

function AboutCard() {
  return (
    <Card className="quote-card-view">
      <Card.Body>
        <blockquote className="blockquote mb-0">
          <p style={{ textAlign: "justify" }}>
            Hi Everyone, I am <span className="purple">Jilakara Revanth Kumar</span>{" "}
            from <span className="purple">Andhra Pradesh, India.</span>
            <br />
            Currently, I am working as an <span className="purple">SDE 1 - Android Developer at Swipe</span>.
            <br />
            I have completed my B.Tech in Computer Science and Engineering from RGUKT, RK Valley.
            <br />

            I am passionate about building mobile applications, exploring Kotlin Multiplatform (KMP), working on new projects, and contributing to open source.
            <br />
            <br />
            Apart from coding, here are some things I love doing:
          </p>
          <ul>
            <li className="about-activity">
              <ImPointRight /> Playing Badminton
            </li>
            <li className="about-activity">
              <ImPointRight /> Playing Chess
            </li>
            <li className="about-activity">
              <ImPointRight /> Exploring Tech Tools & Frameworks
            </li>
          </ul>

          <p style={{ color: "rgb(155 126 172)" }}>
            "Consistency and curiosity are the keys to growth."{" "}
          </p>
          <footer className="blockquote-footer">Revanth</footer>
        </blockquote>
      </Card.Body>
    </Card>
  );
}

export default AboutCard;
