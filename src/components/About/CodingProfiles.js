import React from "react";
import { Col, Row } from "react-bootstrap";
import {
  SiLeetcode,
  SiCodechef,
  SiGeeksforgeeks,
  SiHackerrank,
} from "react-icons/si";
import { GiNinjaHead } from "react-icons/gi";

function CodingProfiles() {
  const platforms = [
    {
      name: "LeetCode",
      icon: <SiLeetcode title="LeetCode" />,
      link: "https://leetcode.com/u/RevanthKumarJ/",
    },
    {
      name: "CodeChef",
      icon: <SiCodechef title="CodeChef" />,
      link: "https://www.codechef.com/users/revanthkumarj1",
    },
    {
      name: "GeeksforGeeks",
      icon: <SiGeeksforgeeks title="GeeksforGeeks" />,
      link: "https://www.geeksforgeeks.org/user/jrevanth/",
    },
    {
      name: "HackerRank",
      icon: <SiHackerrank  title="HackerRank" />,
      link: "https://www.hackerrank.com/jrevanth101",
    },
  ];

  return (
    <Row style={{ justifyContent: "center", paddingBottom: "50px" }}>
      {platforms.map((platform, index) => (
        <Col xs={6} md={2} className="tech-icons text-center" key={index}>
          <a
            href={platform.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "white", textDecoration: "none" }}
          >
            {platform.icon}
            <div style={{ marginTop: "8px", fontSize: "18px" }}>{platform.name}</div>
          </a>
        </Col>
      ))}
    </Row>
  );
}

export default CodingProfiles;
