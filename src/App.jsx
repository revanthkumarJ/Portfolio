import React, { Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Lenis from "lenis";
import Nav from "./sections/Nav.jsx";
import Hero from "./sections/Hero.jsx";
import About from "./sections/About.jsx";
import Experience from "./sections/Experience.jsx";
import PlayStoreApps from "./sections/PlayStoreApps.jsx";
import Writing from "./sections/Writing.jsx";
import Achievements from "./sections/Achievements.jsx";
import Testimonial from "./sections/Testimonial.jsx";
import WhyHireMe from "./sections/WhyHireMe.jsx";
import Contact from "./sections/Contact.jsx";
import Footer from "./sections/Footer.jsx";
import { ResumeProvider } from "./ui/resume.jsx";

/* Secondary routes load on demand. The interview-prep tree alone is a few
   megabytes of content — keeping it out of the home-page chunk is the point. */
const InterviewHome = React.lazy(() => import("./pages/interview/InterviewHome.jsx"));
const TopicPage = React.lazy(() => import("./pages/interview/TopicPage.jsx"));
const AppRoute = React.lazy(() => import("./pages/apps/AppRoute.jsx"));
const ExperienceRoute = React.lazy(() => import("./pages/experience/ExperienceRoute.jsx"));

/* Shown while a route chunk is in flight — page background, no layout shift. */
function RouteFallback() {
  return <div className="min-h-screen bg-ink" />;
}

function Home() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
    let raf;
    function loop(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    // Anchor navigation through Lenis
    function onClick(e) {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = document.querySelector(a.getAttribute("href"));
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -72 });
      }
    }
    document.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis.destroy();
    };
  }, []);

  return (
    <ResumeProvider>
    <div className="noise relative min-h-screen bg-ink text-body">
      <Nav />
      <main>
        <Hero />
        <About />
        <PlayStoreApps />
        <Experience />
        <Writing />
        <Achievements />
        <Testimonial />
        <WhyHireMe />
        <Contact />
      </main>
      <Footer />
    </div>
    </ResumeProvider>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/interview_preparation" element={<InterviewHome />} />
          <Route path="/interview_preparation/:categoryId/:topicId" element={<TopicPage />} />
          <Route path="/apps/:slug" element={<AppRoute />} />
          <Route path="/experience/:slug" element={<ExperienceRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
