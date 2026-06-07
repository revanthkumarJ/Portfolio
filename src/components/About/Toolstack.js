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
import { SiIntercom } from "react-icons/si";
import { FaEye } from "react-icons/fa";

function Toolstack() {
const tools = [
  { name: "Android Studio", icon: <SiAndroid /> },
  { name: "GitHub", icon: <SiGithub /> },
  { name: "Postman", icon: <SiPostman /> },
  { name: "VS Code", icon: <SiVisualstudiocode /> },

  { name: "Jira", icon: <FaJira /> },
  { name: "Slack", icon: <SiSlack /> },
  { name: "Intercom", icon: <SiIntercom /> },

  { name: "Figma", icon: <SiFigma /> },
  { name: "NPM", icon: <SiNpm /> },
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
