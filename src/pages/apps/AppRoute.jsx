import React from "react";
import { useParams, Navigate } from "react-router-dom";
import AppCaseStudy from "./AppCaseStudy.jsx";
import { appsBySlug } from "../../data/apps.js";

/* /apps/:slug — renders the case study for a registered app, or bounces
   an unknown slug back to the Play Store section on the home page. */
export default function AppRoute() {
  const { slug } = useParams();
  const app = appsBySlug[(slug || "").toLowerCase()];
  if (!app) return <Navigate to="/#apps" replace />;
  return <AppCaseStudy key={app.slug} app={app} />;
}
