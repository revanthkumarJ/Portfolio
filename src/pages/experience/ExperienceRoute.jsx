import React from "react";
import { useParams, Navigate } from "react-router-dom";
import ExperienceCaseStudy from "./ExperienceCaseStudy.jsx";
import { experienceBySlug } from "../../data/experience/index.js";

/* /experience/:slug — renders a company case study, or bounces an unknown
   slug back to the experience timeline on the home page. */
export default function ExperienceRoute() {
  const { slug } = useParams();
  const entry = experienceBySlug[(slug || "").toLowerCase()];
  if (!entry) return <Navigate to="/#experience" replace />;
  return <ExperienceCaseStudy key={entry.slug} entry={entry} />;
}
