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
import CoursesSection from "./sections/CoursesSection.jsx";
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

// Yeni varsayılan sıra (content/order.json yoksa)
const DEFAULT_ORDER = ["stack", "experience", "competitions", "projects", "certificates", "courses"];
const LABELS = {
  stack: "Stack",
  experience: "Experience",
  competitions: "Competitions",
  projects: "Projects",
  certificates: "Certificates",
  courses: "Technical Courses",
};

export default function App() {
  const {
    info,
    projects,
    experience,
    competitions,
    certificates,
    stack,
    courses,
    order,
    loading,
    error,
  } = usePortfolioContent();

  // StackBadge index
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

  // Order.json’dan; yoksa DEFAULT_ORDER
  const sectionOrder = Array.isArray(order?.sections_order) && order.sections_order.length
    ? order.sections_order
    : DEFAULT_ORDER;

  const sections = {
    stack: <StackSection items={stack} />,
    experience: <ExperienceSection items={experience} stackIndex={stackIndex} />,
    competitions: <CompetitionsSection items={competitions} stackIndex={stackIndex} />,
    projects: <ProjectsSection items={projects} stackIndex={stackIndex} />,
    certificates: <CertificatesSection items={certificates} stackIndex={stackIndex} />,
    courses: <CoursesSection items={courses} />,
  };

  const navItems = [
    ...sectionOrder.map((id) => ({ id, label: LABELS[id] || id, href: `#${id}` })),
    { id: "contact", label: "Contact", href: "#contact" },
  ];

  return (
    <div className="min-h-screen text-white bg-[#0b0b10]">
      <Navbar fullName={fullName} items={navItems} />

      {loading && <Loading />}
      {error && !loading && <ErrorState message={error} />}

      {!loading && !error && (
        <>
          {/* info */}
          <Hero info={info || {}} />

          {/* stack → … → courses */}
          {sectionOrder.map((id) => (
            <React.Fragment key={id}>{sections[id]}</React.Fragment>
          ))}

          {/* contact */}
          <ContactSection info={info || {}} />
        </>
      )}

      <Footer />
    </div>
  );
}
