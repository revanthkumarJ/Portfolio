import React from "react";
import { Col, Row } from "react-bootstrap";
import {
  SiVisualstudiocode,
  SiSlack,
  SiPostman,
  SiAndroid,
  SiGithub,
  SiDocker,
  SiWebpack,
  SiNpm,
  SiKubernetes,
  SiFigma,
  SiVercel,
  SiPostgresql,
  SiAmazonaws,
  SiJenkins,
  SiNotion,
  SiVisualstudio,
} from "react-icons/si";
import { FaJira, FaDiscord, FaTrello } from "react-icons/fa";

function Toolstack() {
  const tools = [
    { name: "VS Code", icon: <SiVisualstudiocode /> },
    { name: "Android Studio", icon: <SiAndroid /> },
    { name: "Slack", icon: <SiSlack /> },
    { name: "Postman", icon: <SiPostman /> },
    { name: "Discord", icon: <FaDiscord /> },
    { name: "Jira", icon: <FaJira /> },
    { name: "GitHub", icon: <SiGithub /> },
    { name: "NPM", icon: <SiNpm /> },
    { name: "Figma", icon: <SiFigma /> },
    { name: "Vercel", icon: <SiVercel /> },
    
  ];

  return (
    <Row style={{ justifyContent: "center", paddingBottom: "50px" }}>
      {tools.map((tool, index) => (
        <Col key={index} xs={4} md={2} className="tech-icons text-center">
          {tool.icon}
          <div style={{ marginTop: "8px", fontSize: "14px" }}>{tool.name}</div>
        </Col>
      ))}
    </Row>
  );
}

export default Toolstack;
