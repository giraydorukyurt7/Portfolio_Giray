// src/sections/CompetitionsSection.jsx
import Section from "../components/Section";
import Card from "../components/Card";
import StackBadge from "../components/StackBadge";
import { safeGet, formatYM } from "../lib/utils";

export default function CompetitionsSection({ items, stackIndex }) {
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
          const stack = Array.isArray(c.stack) ? c.stack : [];

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
                {stack.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {stack.map((t, i) => (
                      <StackBadge key={i} name={t} index={stackIndex} />
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
