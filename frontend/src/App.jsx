import React, { useMemo } from "react";
import usePortfolioContent from "./hooks/usePortfolioContent";

// Sections
import Hero from "./sections/Hero";
import StackSection from "./sections/StackSection";
import ExperienceSection from "./sections/ExperienceSection";
import CompetitionsSection from "./sections/CompetitionsSection";
import ProjectsSection from "./sections/ProjectsSection";
import CertificatesSection from "./sections/CertificatesSection";
import CoursesSection from "./sections/CoursesSection";
import ContactSection from "./sections/ContactSection";
import TimelineSection from "./sections/TimelineSection"; // <-- YENİ

// Layout
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function App() {
  const {
    info,
    stack,
    experience,
    competitions,
    projects,
    certificates,
    courses,
    socials,
    loading,
    error,
  } = usePortfolioContent();

  // Stack rozetleri için hızlı erişim
  const stackIndex = useMemo(() => {
    const idx = {};
    (stack || []).forEach((s) => {
      if (s?.name) idx[String(s.name).trim().toLowerCase()] = s;
    });
    return idx;
  }, [stack]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-white/80">Loading content…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-red-400">Content load failed. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {typeof Navbar === "function" ? <Navbar fullName={info?.full_name} /> : null}

      <main>
        <Hero info={info} />

        <div className="mx-auto max-w-6xl px-4 space-y-14 md:space-y-20">
          <StackSection items={stack} />
          <ExperienceSection items={experience} stackIndex={stackIndex} />
          <CompetitionsSection items={competitions} stackIndex={stackIndex} />
          <ProjectsSection projects={projects} stackIndex={stackIndex} />
          <CertificatesSection certificates={certificates} />
          <CoursesSection items={courses} />
          <ContactSection info={info} socials={socials} />

          {/* En aşağıda Timeline */}
          <TimelineSection
            data={{ experience, competitions, certificates, projects, courses }}
          />
        </div>
      </main>

      {typeof Footer === "function" ? <Footer /> : null}
    </div>
  );
}
