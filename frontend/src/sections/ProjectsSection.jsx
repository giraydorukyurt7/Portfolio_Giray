// src/sections/ProjectsSection.jsx
import React, { useMemo, useState } from "react";
import Card from "../components/Card";
import Section from "../components/Section";
import StackBadge from "../components/StackBadge";
import { safeGet } from "../lib/utils";

// dd/mm/yyyy, yyyy-mm-dd, yyyy/mm/dd vb. esnek parse -> UNIX (seconds)
function toUnix(dateLike) {
  if (!dateLike && dateLike !== 0) return null;
  if (typeof dateLike === "number") {
    return dateLike > 1e12 ? Math.floor(dateLike / 1000) : dateLike; // ms->s
  }
  const s = String(dateLike).trim();
  if (!s) return null;

  // D/M/YYYY
  let m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return isNaN(d) ? null : Math.floor(d.getTime() / 1000);
  }

  const d = new Date(s); // ISO vs
  return isNaN(d) ? null : Math.floor(d.getTime() / 1000);
}

function pickProjectDateUnix(p) {
  const nowU = Math.floor(Date.now() / 1000);
  const endU =
    toUnix(p?.end_unix) ??
    toUnix(p?.end) ??
    (p?.present ? nowU : null);

  const startU =
    toUnix(p?.start_unix) ??
    toUnix(p?.start) ??
    toUnix(p?.date_unix) ??
    toUnix(p?.date_iso) ??
    toUnix(p?.date);

  return endU ?? startU ?? null;
}

function MiniTag({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] leading-5 text-white/70">
      {children}
    </span>
  );
}

function Separator({ space = "default" }) {
  // "spacious": özetten sonra biraz nefes payı
  // "default": meta ve link arasında sıkı çizgi
  const cls = space === "spacious" ? "mt-4 mb-2" : "my-2";
  return <div role="separator" className={`${cls} h-px bg-white/10`} />;
}

function LabeledRow({ label, children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-2 py-1">
      <span className="min-w-[56px] shrink-0 pt-0.5 text-[11px] uppercase tracking-wide text-white/50">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ProjectCard({ p, stackIndex }) {
  const title = safeGet(p, "title.en", "Project");
  const summary = safeGet(p, "summary.en", "");
  const links = p?.links || {};
  const gh = links.github || links.GitHub || "";
  const demo = links.demo || links.Demo || "";
  const stacks = Array.isArray(p?.stack) ? p.stack : [];
  const areas = Array.isArray(p?.areas) ? p.areas : [];
  const topics = Array.isArray(p?.topics) ? p.topics : [];

  const cover =
    (Array.isArray(p?.images) && p.images[0]) ||
    p?.icon ||
    "";

  const hasStack = stacks.length > 0;
  const hasAreas = areas.length > 0;
  const hasTopics = topics.length > 0;
  const hasMeta = hasStack || hasAreas || hasTopics;
  const hasLinks = !!(gh || demo);

  return (
    <Card>
      <article className="flex h-full flex-col">
        {cover ? (
          <div className="mb-3 overflow-hidden rounded-lg border border-white/10">
            <img
              src={cover}
              alt={title}
              className="h-40 w-full object-cover"
              height={160}
              loading="lazy"
            />
          </div>
        ) : null}

        <h3 className="text-lg font-semibold leading-tight">{title}</h3>

        {summary && (
          <p className="mt-1 text-sm text-white/80 whitespace-pre-line">
            {summary}
          </p>
        )}

        {/* — Bilgiler bitti — */}

        {hasMeta && (
          <>
            {/* Özet varsa daha ferah bir boşluk, yoksa sıkı */}
            <Separator space={summary ? "spacious" : "default"} />

            {/* Meta (Stack / Areas / Topics) */}
            <div className="space-y-0.5">
              {hasStack && (
                <LabeledRow label="Stack">
                  {stacks.map((s, idx) => (
                    <StackBadge key={`stack-${idx}`} name={s} index={stackIndex} />
                  ))}
                </LabeledRow>
              )}
              {hasAreas && (
                <LabeledRow label="Areas">
                  {areas.map((a, idx) => (
                    <MiniTag key={`area-${idx}`}>{a}</MiniTag>
                  ))}
                </LabeledRow>
              )}
              {hasTopics && (
                <LabeledRow label="Topics">
                  {topics.map((t, idx) => (
                    <MiniTag key={`topic-${idx}`}>{t}</MiniTag>
                  ))}
                </LabeledRow>
              )}
            </div>
          </>
        )}

        {/*  */}
        {hasLinks && (
          <>
            <Separator space="default" />
            <div className="flex items-center gap-3 text-sm">
              {gh && (
                <a
                  className="underline underline-offset-4"
                  href={gh}
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
              )}
              {demo && (
                <a
                  className="underline underline-offset-4"
                  href={demo}
                  target="_blank"
                  rel="noreferrer"
                >
                  Live Demo
                </a>
              )}
            </div>
          </>
        )}
      </article>
    </Card>
  );
}

export default function ProjectsSection({ projects = [], stackIndex = {} }) {
  const [mode, setMode] = useState("default");

  const sorted = useMemo(() => {
    const arr = [...(projects || [])];
    if (mode === "default") {
      return arr.sort(
        (a, b) => (a.order_index ?? 1e9) - (b.order_index ?? 1e9)
      );
    }
    if (mode === "date_desc") {
      return arr.sort(
        (a, b) =>
          (pickProjectDateUnix(b) ?? -1) - (pickProjectDateUnix(a) ?? -1)
      );
    }
    if (mode === "date_asc") {
      return arr.sort(
        (a, b) =>
          (pickProjectDateUnix(a) ?? 1e15) - (pickProjectDateUnix(b) ?? 1e15)
      );
    }
    return arr;
  }, [projects, mode]);

  const personal = useMemo(
    () =>
      sorted.filter(
        (p) =>
          String(p?.origin || "").toLowerCase() === "personal" ||
          /personal/i.test(String(p?.origin_label || ""))
      ),
    [sorted]
  );

  const tutorial = useMemo(
    () =>
      sorted.filter(
        (p) =>
          String(p?.origin || "").toLowerCase() === "tutorial" ||
          /tutorial|course/i.test(String(p?.origin_label || ""))
      ),
    [sorted]
  );

  const others = useMemo(
    () =>
      sorted.filter((p) => !personal.includes(p) && !tutorial.includes(p)),
    [sorted, personal, tutorial]
  );

  const hasAny = sorted.length > 0;

  return (
    <Section
      id="projects"
      title="Projects"
      subtitle="Selected works & experiments"
      toolbar={
        <select
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          aria-label="Sort projects"
        >
          <option value="default">Default</option>
          <option value="date_desc">Newest → Oldest</option>
          <option value="date_asc">Oldest → Newest</option>
        </select>
      }
    >
      {!hasAny && <p className="text-white/60">No projects yet.</p>}

      {personal.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-base font-semibold">
              Personal{" "}
              <span className="text-white/50 text-sm">
                (Projects completely made by me)
              </span>
            </h3>
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {personal.map((p, i) => (
              <ProjectCard key={`personal-${i}`} p={p} stackIndex={stackIndex} />
            ))}
          </div>
        </div>
      )}

      {tutorial.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-base font-semibold">
              Tutorial/Course{" "}
              <span className="text-white/50 text-sm">
                (created while learning topics with help of courses)
              </span>
            </h3>
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tutorial.map((p, i) => (
              <ProjectCard key={`tutorial-${i}`} p={p} stackIndex={stackIndex} />
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-base font-semibold">Other</h3>
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((p, i) => (
              <ProjectCard key={`other-${i}`} p={p} stackIndex={stackIndex} />
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
