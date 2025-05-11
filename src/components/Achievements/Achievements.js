import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import Particle from "../Particle";

function Achievements() {
    const achievements = [
  {
    title: "Qualified GATE CS 2025",
    description:
      "Cracked the GATE 2025 Computer Science exam, demonstrating strong command over core CS subjects and problem-solving skills."
  },
  {
    title: "Leetcode Knight Badge",
    description:
      "Earned the Knight badge on LeetCode by consistently solving complex DSA problems and maintaining a solid streak. 800+ problems solved."
  },
  {
    title: "GFG Institute 1st Rank",
    description:
      "Achieved 1st rank among institute peers on GeeksforGeeks by actively solving DSA problems and participating in coding contests. 1000+ problems solved."
  },
  {
    title: "CodeChef 3-Star Coder",
    description:
      "Achieved 3-star rating on CodeChef with consistent performance in contests and solving 1000+ problems."
  },
  {
    title: "HackerRank 5-Star in Problem Solving",
    description:
      "Earned 5-star rating in Problem Solving on HackerRank by solving 500+ challenges and showcasing strong algorithmic thinking."
  },
  {
    title: "Qualified NMMS",
    description:
      "Cleared the National Means-cum-Merit Scholarship (NMMS) exam, showcasing academic excellence at the school level."
  }
];

      

  return (
    <Container fluid className="project-section">
      <Particle />
      <Container>
        <h1 className="project-heading">
          My <strong className="purple">Achievements</strong>
        </h1>
        <p style={{ color: "white" }}>
          Here are some milestones I’ve achieved along my journey.
        </p>
        <Row style={{ justifyContent: "center", paddingBottom: "20px" }}>
        {achievements.map((item, index) => (
  <Col md={4} key={index} className="project-card">
    <Card className="project-card-view">
      <Card.Body>
        <Card.Title style={{ color: "white", fontWeight: "bold" }}>
          {item.title}
        </Card.Title>
        <Card.Text style={{ color: "white" }}>
          {item.description}
        </Card.Text>
      </Card.Body>
    </Card>
  </Col>
))}

        </Row>
      </Container>
    </Container>
  );
}

export default Achievements;
