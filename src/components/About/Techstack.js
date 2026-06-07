import React from "react";
import { Col, Row } from "react-bootstrap";
import {
  DiJava,
  DiJavascript1,
  DiNodejs,
  DiReact,
  DiMongodb,
  DiGit,
  DiPython
} from "react-icons/di";
// import { TbBrandJetpack } from "react-icons/tb";
import { MdPhoneIphone, MdDevices , MdViewModule  } from "react-icons/md";
import {
  SiKotlin,
  SiFirebase,
  SiExpress,
  SiMysql,
  SiGithub,
} from "react-icons/si";

function Techstack() {
const techs = [
  { name: "Kotlin", icon: <SiKotlin /> },
  { name: "Android", icon: <MdPhoneIphone /> },
  { name: "Jetpack Compose", icon: <MdViewModule /> },
  { name: "Kotlin Multiplatform", icon: <MdDevices /> },
  { name: "Compose Multiplatform", icon: <MdPhoneIphone /> },

  { name: "Java", icon: <DiJava /> },
  { name: "Firebase", icon: <SiFirebase /> },
  { name: "Git", icon: <DiGit /> },
  { name: "GitHub", icon: <SiGithub /> },

  { name: "JavaScript", icon: <DiJavascript1 /> },
  { name: "React", icon: <DiReact /> },
  { name: "Node.js", icon: <DiNodejs /> },
  { name: "Express", icon: <SiExpress /> },

  { name: "MongoDB", icon: <DiMongodb /> },
  { name: "MySQL", icon: <SiMysql /> },

  { name: "Python", icon: <DiPython /> },
];

  return (
    <Row style={{ justifyContent: "center", paddingBottom: "50px" }}>
      {techs.map((tech, index) => (
        <Col key={index} xs={4} md={2} className="tech-icons text-center">
          {tech.icon}
          <div style={{ marginTop: "8px", fontSize: "14px" }}>{tech.name}</div>
        </Col>
      ))}
    </Row>
  );
}

export default Techstack;
