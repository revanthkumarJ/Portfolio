import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Lenis from "lenis";
import InterviewHome from "./pages/interview/InterviewHome.jsx";
import TopicPage from "./pages/interview/TopicPage.jsx";
import AppRoute from "./pages/apps/AppRoute.jsx";
import ExperienceRoute from "./pages/experience/ExperienceRoute.jsx";
import Nav from "./sections/Nav.jsx";
import Hero from "./sections/Hero.jsx";
import About from "./sections/About.jsx";
// import Projects from "./sections/Projects.jsx"; // hidden — see note below
import Experience from "./sections/Experience.jsx";
import PlayStoreApps from "./sections/PlayStoreApps.jsx";
import Writing from "./sections/Writing.jsx";
import Achievements from "./sections/Achievements.jsx";
import Testimonial from "./sections/Testimonial.jsx";
import WhyHireMe from "./sections/WhyHireMe.jsx";
import Contact from "./sections/Contact.jsx";
import Footer from "./sections/Footer.jsx";
import { ResumeProvider } from "./ui/resume.jsx";

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
        {/* Work / Projects section is hidden for now — the shipped Play Store apps
            and the company case studies carry this better at SDE 1 level.
            To restore: uncomment the import above and this line, re-add the
            "Work" link in content.js navLinks, point the Hero CTA back at
            #projects, and renumber the sections below it (Writing 04 -> 05,
            Achievements 05 -> 06, What I bring 06 -> 07, Contact 07 -> 08). */}
        {/* <Projects /> */}
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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/interview_preparation" element={<InterviewHome />} />
        <Route path="/interview_preparation/:categoryId/:topicId" element={<TopicPage />} />
        <Route path="/apps/:slug" element={<AppRoute />} />
        <Route path="/experience/:slug" element={<ExperienceRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
