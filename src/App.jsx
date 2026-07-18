import React, { useEffect } from "react";
import Lenis from "lenis";
import Nav from "./sections/Nav.jsx";
import Hero from "./sections/Hero.jsx";
import About from "./sections/About.jsx";
import Experience from "./sections/Experience.jsx";
import Projects from "./sections/Projects.jsx";
import Achievements from "./sections/Achievements.jsx";
import Writing from "./sections/Writing.jsx";
import Testimonial from "./sections/Testimonial.jsx";
import Contact from "./sections/Contact.jsx";
import Footer from "./sections/Footer.jsx";
import { ResumeProvider } from "./ui/resume.jsx";

export default function App() {
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
        <Experience />
        <Projects />
        <Achievements />
        <Writing />
        <Testimonial />
        <Contact />
      </main>
      <Footer />
    </div>
    </ResumeProvider>
  );
}
