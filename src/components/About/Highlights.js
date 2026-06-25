import React from "react";
import { Col, Row, Card } from "react-bootstrap";

function Highlights() {
  const stats = [
    { value: "110+", label: "Open-Source PRs Merged" },
    { value: "98%", label: "PR Merge Rate" },
    { value: "230+", label: "Contributor PRs Reviewed" },
    { value: "1000+", label: "DSA Problems Solved" },
    { value: "GSoC / C4GT", label: "Open-Source Mentor" },
    { value: "GATE CS 2025", label: "Qualified" },
  ];

  return (
    <Row style={{ justifyContent: "center", paddingBottom: "40px" }}>
      {stats.map((stat, index) => (
        <Col xs={6} md={4} lg={2} key={index} style={{ padding: "10px" }}>
          <Card
            className="project-card-view"
            style={{ textAlign: "center", padding: "20px 10px", height: "100%" }}
          >
            <h2
              className="purple"
              style={{ fontWeight: "bold", marginBottom: "6px" }}
            >
              {stat.value}
            </h2>
            <p style={{ color: "white", marginBottom: 0, fontSize: "14px" }}>
              {stat.label}
            </p>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default Highlights;
