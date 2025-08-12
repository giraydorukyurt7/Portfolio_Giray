// App.jsx — React portfolio (EN default, TR disabled "soon")
// Loads JSON from public/content/*.json using RELATIVE paths.
// Tailwind v4 assumed.

import React, { useEffect, useState } from "react";

// -------- utils --------
const cn = (...xs) => xs.filter(Boolean).join(" ");

const safeGet = (obj, path, fallback = "") => {
  try {
    return path.split(".").reduce((a, k) => (a ? a[k] : undefined), obj) ?? fallback;
  } catch {
    return fallback;
  }
};

const formatYM = (ym) => {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  if (!y) return ym;
  const dt = new Date(parseInt(y, 10), m ? parseInt(m, 10) - 1 : 0, 1);
  try {
    return dt.toLocaleString(undefined, { month: "short", year: "numeric" });
  } catch {
    return `${y}${m ? "-" + m : ""}`;
  }
};

async function fetchJSON(path) {
  // RELATIVE path + cache-buster (pages cache’ini delmek için)
  const url = `${path}?v=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

// -------- data hook --------
function usePortfolioContent() {
  const [state, setState] = useState({
    info: null,
    projects: [],
    experience: [],
    competitions: [],
    certificates: [],
    socials: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [info, projects, experience, competitions, certificates, socials] = await Promise.all([
          fetchJSON("content/info.json").catch(() => null),
          fetchJSON("content/projects.json").catch(() => []),
          fetchJSON("content/experience.json").catch(() => []),
          fetchJSON("content/competitions.json").catch(() => []),
          fetchJSON("content/certificates.json").catch(() => []),
          fetchJSON("content/socials.json").catch(() => []),
        ]);
        if (!alive) return;
        setState((s) => ({ ...s, info, projects, experience, competitions, certificates, socials, loading: false }));
      } catch (e) {
        if (!alive) return;
        setState((s) => ({ ...s, loading: false, error: e?.message || "Failed to load content." }));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

// -------- UI primitives --------
const Section = ({ id, title, children, subtitle }) => (
  <section id={id} className="scroll-mt-24 py-16">
    <div className="mx-auto max-w-6xl px-4">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
        {subtitle ? <p className="text-sm text-muted-foreground mt-2">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  </section>
);

const Card = ({ children, className }) => (
  <div
    className={cn(
      "rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur shadow-sm",
      "hover:shadow-lg transition-shadow",
      className
    )}
  >
    {children}
  </div>
);

const Badge = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-xs">
    {children}
  </span>
);

const ExternalLink = ({ href, children }) => (
  <a className="underline decoration-dotted underline-offset-4 hover:opacity-90" href={href} target="_blank" rel="noreferrer">
    {children}
  </a>
);

// -------- header/nav --------
function Navbar({ fullName }) {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur supports-[backdrop-filter]:bg-white/5 border-b border-white/10">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="#home" className="font-semibold tracking-tight">
          {fullName || "My Portfolio"}
        </a>
        <div className="flex items-center gap-2">
          <a href="#projects" className="text-sm hover:opacity-80 px-3 py-1">
            Projects
          </a>
          <a href="#experience" className="text-sm hover:opacity-80 px-3 py-1">
            Experience
          </a>
          <a href="#competitions" className="text-sm hover:opacity-80 px-3 py-1">
            Competitions
          </a>
          <a href="#certificates" className="text-sm hover:opacity-80 px-3 py-1">
            Certificates
          </a>
          <a href="#contact" className="text-sm hover:opacity-80 px-3 py-1">
            Contact
          </a>

          <div className="mx-2 h-5 w-px bg-white/20" />

          {/* EN active, TR disabled (soon) */}
          <div className="flex items-center gap-1 text-sm">
            <button className="px-2 py-1 rounded-lg border border-white/10 bg-white/10 cursor-default">EN</button>
            <button className="px-2 py-1 rounded-lg border border-white/10 opacity-60 cursor-not-allowed" title="soon" disabled>
              TR <span className="ml-1 text-xs opacity-70">(soon)</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}

// -------- hero --------
function Hero({ info }) {
  const fullName = safeGet(info, "full_name", "");
  const title = safeGet(info, "title.en", "");
  const university = safeGet(info, "university", "");
  const summary = safeGet(info, "summary.en", "");
  const links = info?.links || {};

  return (
    <section id="home" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(120,119,198,0.25),rgba(255,255,255,0))]" />

      <div className="mx-auto max-w-6xl px-4 pt-16 pb-8 md:pt-24 md:pb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              {fullName || "Your Name"}
            </h1>
            <p className="mt-2 text-lg text-white/80">{title || "Student"}</p>
            {university && <p className="mt-1 text-sm text-white/60">{university}</p>}
            {summary && <p className="mt-6 text-base leading-7 text-white/80 whitespace-pre-line">{summary}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {links?.cv && (
                <a
                  href={links.cv}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
                >
                  Download CV
                </a>
              )}
              {links?.github && (
                <a
                  href={links.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
                >
                  GitHub
                </a>
              )}
              {links?.linkedin && (
                <a
                  href={links.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
                >
                  LinkedIn
                </a>
              )}
              {links?.website && (
                <a
                  href={links.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Website
                </a>
              )}
            </div>
          </div>

          <div className="md:min-w-[320px] md:max-w-[360px] w-full">
            <Card>
              <div className="text-sm text-white/80 leading-6">
                <p className="font-semibold mb-1">Quick Facts</p>
                <ul className="space-y-2 list-disc list-inside">
                  {info?.department && <li>Department: {info.department}</li>}
                  {info?.class_year && <li>Class Year: {info.class_year}</li>}
                  {info?.gpa && <li>GPA: {info.gpa}</li>}
                  {info?.location && <li>Location: {info.location}</li>}
                  {info?.email && (
                    <li>
                      Email: <a className="underline decoration-dotted underline-offset-4" href={`mailto:${info.email}`}>{info.email}</a>
                    </li>
                  )}
                  {!info?.department && !info?.class_year && !info?.gpa && !info?.location && !info?.email && (
                    <li>No additional info yet.</li>
                  )}
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

// -------- sections --------
function ExperienceSection({ items }) {
  return (
    <Section id="experience" title="Experience">
      {(!items || items.length === 0) && <p className="text-white/60">No experience entries yet.</p>}
      <div className="grid md:grid-cols-2 gap-4">
        {items?.map((exp, idx) => {
          const title = safeGet(exp, "title.en");
          const org = exp.organization;
          const loc = exp.location;
          const details = safeGet(exp, "details.en");
          const highlights = safeGet(exp, "highlights.en", []);
          const start = formatYM(exp.start);
          const end = exp.present ? "Present" : formatYM(exp.end);
          const range = [start, end].filter(Boolean).join(" — ");
          return (
            <Card key={idx}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-lg">{title || "Role"}</h3>
                  <div className="text-xs text-white/60">{range}</div>
                </div>
                <div className="text-sm text-white/80">
                  <span className="font-medium">{org}</span>
                  {loc && <span className="text-white/60"> • {loc}</span>}
                </div>
                {details && <p className="text-sm text-white/80 whitespace-pre-line">{details}</p>}
                {Array.isArray(highlights) && highlights.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-sm text-white/80 space-y-1">
                    {highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                )}
                {Array.isArray(exp.tech) && exp.tech.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {exp.tech.map((t, i) => (
                      <Badge key={i}>{t}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

function ProjectsSection({ items }) {
  return (
    <Section id="projects" title="Projects">
      {(!items || items.length === 0) && <p className="text-white/60">No projects yet.</p>}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items?.map((p, idx) => {
          const title = safeGet(p, "title.en");
          const summary = safeGet(p, "summary.en");
          const start = formatYM(p.start);
          const end = p.present ? "Present" : formatYM(p.end);
          const range = [start, end].filter(Boolean).join(" — ");
          const stack = Array.isArray(p.stack) ? p.stack : [];
          const links = p.links || {};
          return (
            <Card key={idx}>
              <div className="flex flex-col gap-3 h-full">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg leading-tight">{title || "Untitled Project"}</h3>
                  {range && <span className="text-xs text-white/60 whitespace-nowrap">{range}</span>}
                </div>
                {summary && <p className="text-sm text-white/80 whitespace-pre-line">{summary}</p>}
                {stack.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-2">
                    {stack.map((s, i) => (
                      <Badge key={i}>{s}</Badge>
                    ))}
                  </div>
                )}
                {(links?.github || links?.demo) && (
                  <div className="flex gap-3 text-sm mt-2">
                    {links?.github && <ExternalLink href={links.github}>GitHub</ExternalLink>}
                    {links?.demo && <ExternalLink href={links.demo}>Live Demo</ExternalLink>}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

function CompetitionsSection({ items }) {
  return (
    <Section id="competitions" title="Competitions">
      {(!items || items.length === 0) && <p className="text-white/60">No competitions yet.</p>}
      <div className="grid md:grid-cols-2 gap-4">
        {items?.map((c, idx) => {
          const name = safeGet(c, "name.en") || safeGet(c, "title.en");
          const role = safeGet(c, "role.en");
          const org = c.organization;
          const result = c.result;
          const details = safeGet(c, "details.en");
          const highlights = safeGet(c, "highlights.en", []);
          const start = formatYM(c.start);
          const end = c.present ? "Present" : formatYM(c.end);
          const range = [start, end].filter(Boolean).join(" — ");
          return (
            <Card key={idx}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-lg">{name || "Competition"}</h3>
                  <div className="text-xs text-white/60">{range}</div>
                </div>
                <div className="text-sm text-white/80">
                  <span className="font-medium">{org}</span>
                  {role && <span className="text-white/60"> • {role}</span>}
                  {result && <span className="ml-2 text-emerald-300/90">{result}</span>}
                </div>
                {details && <p className="text-sm text-white/80 whitespace-pre-line">{details}</p>}
                {Array.isArray(highlights) && highlights.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-sm text-white/80 space-y-1">
                    {highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

function CertificatesSection({ items }) {
  return (
    <Section id="certificates" title="Certificates">
      {(!items || items.length === 0) && <p className="text-white/60">No certificates yet.</p>}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items?.map((ce, idx) => {
          const name = safeGet(ce, "name.en");
          const issuer = ce.issuer;
          const start = formatYM(ce.start);
          const end = ce.present ? "Present" : formatYM(ce.end);
          const range = [start, end].filter(Boolean).join(" — ");
          const credUrl = ce.credential_url;
          const credId = ce.credential_id;
          const details = safeGet(ce, "details.en");
          return (
            <Card key={idx}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-lg leading-tight">{name || "Certificate"}</h3>
                  {range && <div className="text-xs text-white/60">{range}</div>}
                </div>
                <div className="text-sm text-white/80">{issuer && <span className="font-medium">{issuer}</span>}</div>
                {details && <p className="text-sm text-white/80 whitespace-pre-line">{details}</p>}
                {(credUrl || credId) && (
                  <div className="text-xs text-white/70 mt-1">
                    {credId && <div>Credential ID: {credId}</div>}
                    {credUrl && (
                      <div>
                        Verify:{" "}
                        <a className="underline decoration-dotted underline-offset-4" href={credUrl} target="_blank" rel="noreferrer">
                          {credUrl}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

function ContactSection({ info, socials }) {
  const email = info?.email;
  const hasSocials = Array.isArray(socials) && socials.length > 0;
  return (
    <Section id="contact" title="Contact">
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-white/80 text-sm">Prefer email? I usually respond within a day.</p>
            {email ? (
              <a
                href={`mailto:${email}`}
                className="mt-2 inline-flex items-center rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                {email}
              </a>
            ) : (
              <p className="text-white/60 text-sm mt-2">No email provided yet.</p>
            )}
          </div>
          <div className="md:text-right">
            <p className="text-white/80 text-sm">Socials</p>
            {hasSocials ? (
              <div className="mt-2 flex flex-wrap gap-2 md:justify-end">
                {socials.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/10 px-3 py-1 text-sm hover:bg-white/10"
                  >
                    {s.label || s.platform || s.url}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-white/60 text-sm mt-2">No social links yet.</p>
            )}
          </div>
        </div>
      </Card>
    </Section>
  );
}

// -------- footer --------
function Footer() {
  return (
    <footer className="py-10 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 text-sm text-white/60">
        <p>© {new Date().getFullYear()} — Built with React & Tailwind. English first; Türkçe <span className="opacity-70">(soon)</span>.</p>
      </div>
    </footer>
  );
}

// -------- app --------
export default function App() {
  const { info, projects, experience, competitions, certificates, socials, loading, error } = usePortfolioContent();
  const fullName = safeGet(info, "full_name", "");

  return (
    <div className="min-h-screen text-white bg-[#0b0b10]">
      <Navbar fullName={fullName} />

      {loading && (
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-2/3 rounded bg-white/10" />
            <div className="h-4 w-1/2 rounded bg-white/10" />
            <div className="h-4 w-5/6 rounded bg-white/10" />
            <div className="h-4 w-4/6 rounded bg-white/10" />
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="mx-auto max-w-6xl px-4 py-24">
          <Card>
            <p className="text-red-300">{String(error)}</p>
            <p className="text-white/70 text-sm mt-2">
              Check that your JSON files exist in <code>/public/content</code> and are valid.
            </p>
          </Card>
        </div>
      )}

      {!loading && !error && (
        <>
          <Hero info={info} />
          <ProjectsSection items={projects} />
          <ExperienceSection items={experience} />
          <CompetitionsSection items={competitions} />
          <CertificatesSection items={certificates} />
          <ContactSection info={info} socials={socials} />
          <Footer />
        </>
      )}
    </div>
  );
}