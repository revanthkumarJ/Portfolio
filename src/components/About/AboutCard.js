import React from "react";
import Card from "react-bootstrap/Card";
import { ImPointRight } from "react-icons/im";

function AboutCard() {
  return (
    <Card className="quote-card-view">
      <Card.Body>
        <blockquote className="blockquote mb-0">
          <p style={{ textAlign: "justify" }}>
            Hi everyone, I'm{" "}
            <span className="purple">Jilakara Revanth Kumar</span>, a Software
            Engineer from{" "}
            <span className="purple">Andhra Pradesh, India</span>, specializing
            in <span className="purple">Android</span> and{" "}
            <span className="purple">Kotlin Multiplatform</span> development.
            <br />
            <br />
            Currently, I work as an{" "}
            <span className="purple">SDE 1 – Android Developer at Swipe (YC S21)</span>
            , where I was promoted from an Android Developer Intern. I build and
            modernize production Android experiences using Kotlin, Jetpack
            Compose, and scalable multi-module MVI architecture, shipping
            features used by thousands of businesses.
            <br />
            <br />
            I'm an active open-source contributor and mentor at the{" "}
            <span className="purple">Mifos Initiative</span>, with 110+ merged
            pull requests (98% merge rate) and 230+ contributor PRs reviewed. I
            was a <span className="purple">Mifos Summer of Code 2025</span> intern
            and currently mentor contributors for Google Summer of Code (GSoC)
            and Code4GovTech (C4GT).
            <br />
            <br />
            I hold a B.Tech in Computer Science and Engineering from{" "}
            <span className="purple">RGUKT, RK Valley</span>, and qualified GATE
            CS 2025.
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
              <ImPointRight /> Exploring new tech tools &amp; frameworks
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
