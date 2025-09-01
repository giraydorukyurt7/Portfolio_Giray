import React, { useMemo, useState } from "react";
import Card from "../components/Card";
import Section from "../components/Section";
import StackBadge from "../components/StackBadge";
import { safeGet } from "../lib/utils";

// dd/mm/yyyy veya yyyy-mm-dd vb. esnek parse -> UNIX
function toUnix(dateStr) {
  if (!dateStr) return null;
  if (typeof dateStr === "number") return dateStr;
  const s = String(dateStr).trim();

  // DD/MM/YYYY
  const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (m) {
    const [_, dd, mm, yyyy] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return isNaN(d) ? null : Math.floor(d.getTime() / 1000);
  }
  // ISO
  const d = new Date(s);
  return isNaN(d) ? null : Math.floor(d.getTime() / 1000);
}

function pickProjectDateUnix(p) {
  // Tercih: end -> start -> start_unix/end_unix -> null
  const endU =
    toUnix(p?.end_unix) ?? toUnix(p?.end) ??
    (p?.present ? Math.floor(Date.now() / 1000) : null);
  const startU = toUnix(p?.start_unix) ?? toUnix(p?.start);
  return endU ?? startU ?? null;
}

export default function ProjectsSection({ projects = [], stackIndex = {} }) {
  // mode: default (order_index), date_desc (Newest→Oldest), date_asc (Oldest→Newest)
  const [mode, setMode] = useState("default");

  const sorted = useMemo(() => {
    const arr = [...(projects || [])];
    if (mode === "default") {
      return arr.sort((a, b) => (a.order_index ?? 1e9) - (b.order_index ?? 1e9));
    }
    if (mode === "date_desc") {
      return arr.sort((a, b) => (pickProjectDateUnix(b) ?? -1) - (pickProjectDateUnix(a) ?? -1));
    }
    if (mode === "date_asc") {
      return arr.sort((a, b) => (pickProjectDateUnix(a) ?? 1e15) - (pickProjectDateUnix(b) ?? 1e15));
    }
    return arr;
  }, [projects, mode]);

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
      {sorted.length === 0 && <p className="text-white/60">No projects yet.</p>}

      {/* Daha düzgün görünüm için card grid güçlendirildi */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((p, i) => {
          const title = safeGet(p, "title.en", "Project");
          const summary = safeGet(p, "summary.en", "");
          const links = p?.links || {};
          const gh = links.github || links.GitHub || "";
          const demo = links.demo || links.Demo || "";
          const stacks = Array.isArray(p?.stack) ? p.stack : [];

          // Görsel
          const cover =
            (Array.isArray(p?.images) && p.images[0]) ||
            p?.icon ||
            "";

          return (
            <Card key={`${title}-${i}`}>
              <article className="flex flex-col h-full">
                {cover ? (
                  <div className="mb-3 overflow-hidden rounded-lg border border-white/10">
                    <img
                      src={cover}
                      alt={title}
                      className="h-40 w-full object-cover"
                      height={160}
                    />
                  </div>
                ) : null}

                <h3 className="text-lg font-semibold leading-tight">{title}</h3>

                {summary && (
                  <p className="mt-1 text-sm text-white/80 line-clamp-4">{summary}</p>
                )}

                {stacks.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {stacks.map((s, idx) => (
                      <StackBadge key={`${i}-stack-${idx}`} name={s} index={stackIndex} />
                    ))}
                  </div>
                )}

                {(gh || demo) && (
                  <div className="mt-3 flex items-center gap-3 text-sm">
                    {gh && (
                      <a className="underline underline-offset-4" href={gh} target="_blank" rel="noreferrer">
                        GitHub
                      </a>
                    )}
                    {demo && (
                      <a className="underline underline-offset-4" href={demo} target="_blank" rel="noreferrer">
                        Live Demo
                      </a>
                    )}
                  </div>
                )}
              </article>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
