import React from "react";
import { Modal } from "react-bootstrap";
import "./ExperienceDialog.css";

/* Reusable building blocks shared by every experience dialog.
   Each dialog component composes these however it likes, so the
   layout/UI of each dialog can diverge while staying consistent. */

export function DialogHero({ logo, company, role, timeframe, currentlyWorking }) {
  return (
    <div className="exp-hero">
      {logo && <img className="exp-hero-logo" src={logo} alt={company} />}
      <div className="exp-hero-text">
        <h2>{company}</h2>
        <p className="exp-hero-role">{role}</p>
        <div className="exp-hero-meta">
          {timeframe && <span>{timeframe}</span>}
          {currentlyWorking && <span className="exp-badge-live">Currently Working</span>}
        </div>
      </div>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <div className="exp-section">
      {title && <div className="exp-section-title">{title}</div>}
      {children}
    </div>
  );
}

export function BulletList({ items }) {
  return (
    <ul className="exp-bullets">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function TechBadges({ items }) {
  return (
    <div className="exp-tech">
      {items.map((tech, i) => (
        <span key={i}>{tech}</span>
      ))}
    </div>
  );
}

export function MetricGrid({ metrics }) {
  return (
    <div className="exp-metrics">
      {metrics.map((m, i) => (
        <div className="exp-metric" key={i}>
          <div className="exp-metric-value">{m.value}</div>
          <div className="exp-metric-label">{m.label}</div>
        </div>
      ))}
    </div>
  );
}

export function ProjectBlock({ name, repoLabel, repoUrl, about, highlights, prLink }) {
  return (
    <div className="exp-project">
      <div className="exp-project-head">
        <h3 className="exp-project-name">{name}</h3>
        {repoUrl && (
          <a
            className="exp-project-repo"
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {repoLabel || "Repository"}
          </a>
        )}
      </div>
      {about && <p className="exp-project-about">{about}</p>}
      {highlights && highlights.length > 0 && <BulletList items={highlights} />}
      {prLink && (
        <a
          className="exp-project-prlink"
          href={prLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          View merged PRs &rarr;
        </a>
      )}
    </div>
  );
}

export function LinkRow({ links }) {
  return (
    <div className="exp-links">
      {links.map((link, i) => (
        <a
          key={i}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline-info btn-sm"
        >
          {link.text}
        </a>
      ))}
    </div>
  );
}

/* Full-screen modal wrapper. Renders whichever dialog component the
   registry maps the active detailKey to. */
export function ExperienceDetailModal({ show, onHide, registry, detailKey }) {
  const Content = detailKey ? registry[detailKey] : null;
  return (
    <Modal
      show={show}
      onHide={onHide}
      fullscreen
      scrollable
      dialogClassName="exp-dialog"
      contentClassName="exp-dialog-content"
    >
      <Modal.Header closeButton />
      <Modal.Body>
        <div className="exp-dialog-inner">{Content ? <Content /> : null}</div>
      </Modal.Body>
    </Modal>
  );
}
