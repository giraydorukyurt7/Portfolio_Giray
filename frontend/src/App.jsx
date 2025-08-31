// src/App.jsx
import React, { useMemo } from "react";
import usePortfolioContent from "./hooks/usePortfolioContent.js";
import { safeGet } from "./lib/utils";

// components
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

// sections
import Hero from "./sections/Hero.jsx";
import StackSection from "./sections/StackSection.jsx";
import ExperienceSection from "./sections/ExperienceSection.jsx";
import CompetitionsSection from "./sections/CompetitionsSection.jsx";
import ProjectsSection from "./sections/ProjectsSection.jsx";
import CertificatesSection from "./sections/CertificatesSection.jsx";
import ContactSection from "./sections/ContactSection.jsx";

function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-2/3 rounded bg-white/10" />
        <div className="h-4 w-1/2 rounded bg-white/10" />
        <div className="h-4 w-1/3 rounded bg-white/10" />
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24">
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
        <p className="text-sm">{message || "Failed to load content."}</p>
      </div>
    </div>
  );
}

export default function App() {
  const {
    info,
    projects,
    experience,
    competitions,
    certificates,
    socials,
    stack,
    loading,
    error,
  } = usePortfolioContent();

  const stackIndex = useMemo(() => {
    const idx = {};
    (stack || []).forEach((it) => {
      const key = String(it?.name || "").trim().toLowerCase();
      if (!key) return;
      idx[key] = {
        name: it.name || "",
        category: it.category || "",
        link: it.link || "",
        logo_path: it.logo_path || "",
        logo_url: it.logo_url || "",
      };
    });
    return idx;
  }, [stack]);

  const fullName = safeGet(info, "full_name", "");

  return (
    <div className="min-h-screen text-white bg-[#0b0b10]">
      <Navbar fullName={fullName} />

      {loading && <Loading />}
      {error && !loading && <ErrorState message={error} />}

      {!loading && !error && (
        <>
          {/* Info */}
          <Hero info={info || {}} />

          {/* Stack */}
          <StackSection items={stack || []} />

          {/* Experience */}
          <ExperienceSection items={experience} stackIndex={stackIndex} />

          {/* Competition */}
          <CompetitionsSection items={competitions} stackIndex={stackIndex} />

          {/* Projects */}
          <ProjectsSection items={projects} stackIndex={stackIndex} />

          {/* Certificates */}
          <CertificatesSection items={certificates} stackIndex={stackIndex} />

          {/* Contact */}
          <ContactSection info={info || {}} socials={socials} />
        </>
      )}

      <Footer />
    </div>
  );
}
