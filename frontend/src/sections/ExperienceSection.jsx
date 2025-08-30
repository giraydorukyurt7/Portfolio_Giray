// src/sections/ExperienceSection.jsx
import Section from "../components/Section";
import Card from "../components/Card";
import StackBadge from "../components/StackBadge";
import { safeGet, formatYM } from "../lib/utils";

function TimelineItem({ when, title, subtitle, children }) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-sky-400 ring-4 ring-sky-400/20" />
      <div className="text-xs text-white/60">{when}</div>
      <div className="font-medium">{title}</div>
      {subtitle && <div className="text-sm text-white/70 mb-1">{subtitle}</div>}
      {children}
    </div>
  );
}

export default function ExperienceSection({ items, stackIndex }) {
  return (
    <Section id="experience" title="Experience" subtitle="Recent roles & internships">
      {(!items || items.length === 0) && <p className="text-white/60">No experience entries yet.</p>}
      <div className="grid md:grid-cols-2 gap-6">
        {items?.map((exp, idx) => {
          const title = safeGet(exp, "title.en", "Role");
          const org = exp.organization;
          const loc = exp.location;
          const details = safeGet(exp, "details.en", "");
          const highlights = safeGet(exp, "highlights.en", []);
          const start = formatYM(exp.start);
          const end = exp.present ? "Present" : formatYM(exp.end);
          const range = [start, end].filter(Boolean).join(" — ");
          const stack = Array.isArray(exp.stack) ? exp.stack : Array.isArray(exp.tech) ? exp.tech : [];

          return (
            <Card key={idx}>
              <div className="flex flex-col gap-3">
                <TimelineItem
                  when={range || (exp.present ? "Present" : "")}
                  title={title}
                  subtitle={[org, loc].filter(Boolean).join(" • ")}
                >
                  {details && <p className="text-sm text-white/80 whitespace-pre-line">{details}</p>}
                  {Array.isArray(highlights) && highlights.length > 0 && (
                    <ul className="mt-1 list-disc list-inside text-sm text-white/80 space-y-1">
                      {highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  )}
                  {stack.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {stack.map((t, i) => (
                        <StackBadge key={i} name={t} index={stackIndex} />
                      ))}
                    </div>
                  )}
                </TimelineItem>
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
