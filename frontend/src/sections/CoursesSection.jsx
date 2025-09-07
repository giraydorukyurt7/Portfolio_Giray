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
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] leading-5",
        cls
      )}
    >
      {children}
    </span>
  );
}

function GroupCard({ title, items, type }) {
  return (
    <Card>
      <div className="space-y-2">
        {/* Mini başlık */}
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-wider text-[11px] text-white/60">
            {title}
          </span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        {/* Yoğun liste */}
        {items.length === 0 ? (
          <div className="text-xs text-white/40">No {title.toLowerCase()} courses.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((c, i) => {
              const name = c?.name || "Course";
              const semester = c?.semester; // e.g., "5th semester"
              const electiveSub = c?.elective_type; // Area / Non-area / University

              return (
                <li key={i} className="flex items-center justify-between py-1.5">
                  <span className="truncate text-sm leading-5">{name}</span>
                  <div className="ml-3 flex items-center gap-2">
                    {semester && (
                      <span className="text-[11px] leading-5 text-white/50">{semester}</span>
                    )}
                    {type === "elective" && electiveSub && (
                      <Badge intent="sub">{electiveSub}</Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}

export default function CoursesSection({ items = [] }) {
  const has = Array.isArray(items) && items.length > 0;
  const elective = has ? items.filter((c) => c?.type === "elective") : [];
  const mandatory = has ? items.filter((c) => c?.type !== "elective") : [];

  return (
    <Section
      id="courses"
      title="Technical Courses"
      subtitle="Compact view (career-related)"
    >
      {!has && <p className="text-white/60">No courses yet.</p>}

      {has && (
        <div className="grid md:grid-cols-2 gap-4">
          <GroupCard title="Mandatory" items={mandatory} type="mandatory" />
          <GroupCard title="Elective" items={elective} type="elective" />
        </div>
      )}
    </Section>
  );
}
