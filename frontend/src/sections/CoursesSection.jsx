// src/sections/CoursesSection.jsx
import Section from "../components/Section";
import Card from "../components/Card";
import { cn } from "../lib/utils";

function Badge({ children, intent = "default" }) {
  const cls = {
    default: "border-white/10 bg-white/10 text-white/80",
    mandatory: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    elective: "border-sky-400/20 bg-sky-400/10 text-sky-200",
    sub: "border-white/10 bg-white/5 text-white/70",
  }[intent];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]", cls)}>
      {children}
    </span>
  );
}

export default function CoursesSection({ items }) {
  const has = Array.isArray(items) && items.length > 0;

  return (
    <Section id="courses" title="Technical Courses" subtitle="Career-related courses only">
      {!has && <p className="text-white/60">No courses yet.</p>}
      {has && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((c, i) => {
            const name = c?.name || "Course";
            const semester = c?.semester; // e.g., "5th semester"
            const type = c?.type === "elective" ? "elective" : "mandatory";
            const sub = c?.elective_type; // "Area Elective" | "Non-area Elective" | "Universitive Elective"

            return (
              <Card key={i}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge intent={type}>{type === "elective" ? "Elective" : "Mandatory"}</Badge>
                    </div>
                  </div>
                  {semester && <div className="text-xs text-white/60">{semester}</div>}
                  {type === "elective" && sub && <Badge intent="sub">{sub}</Badge>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Section>
  );
}
