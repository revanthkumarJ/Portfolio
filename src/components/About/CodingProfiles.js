import React from "react";
import { Col, Row } from "react-bootstrap";
import { SiLeetcode, SiCodechef, SiGeeksforgeeks, SiHackerrank } from "react-icons/si";
import { FaGithub } from "react-icons/fa";

function CodingProfiles() {
  return (
    <Row style={{ justifyContent: "center", paddingBottom: "50px" }}>
      <Col xs={6} md={2} className="tech-icons">
        <a
          href="https://leetcode.com/your_username"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "white", textDecoration: "none" }}
        >
          <SiLeetcode  title="LeetCode" />
        </a>
      </Col>
      <Col xs={6} md={2} className="tech-icons">
        <a
          href="https://www.codechef.com/users/your_username"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "white", textDecoration: "none" }}
        >
          <SiCodechef  title="CodeChef" />
        </a>
      </Col>
      <Col xs={6} md={2} className="tech-icons">
        <a
          href="https://auth.geeksforgeeks.org/user/your_username"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "white", textDecoration: "none" }}
        >
          <SiGeeksforgeeks  title="GeeksforGeeks" />
        </a>
      </Col>
      <Col xs={6} md={2} className="tech-icons">
        <a
          href="https://www.hackerrank.com/your_username"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "white", textDecoration: "none" }}
        >
          <SiHackerrank  title="HackerRank" />
        </a>
      </Col>
    </Row>
  );
}

export default CodingProfiles;
