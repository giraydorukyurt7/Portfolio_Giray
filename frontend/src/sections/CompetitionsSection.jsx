// src/sections/CompetitionsSection.jsx
import Section from "./components/Section";
import Card from "./components/Card";
import StackBadge from "./components/StackBadge";
import { safeGet } from "./lib/utils";

// TR kısaltmalı ay isimleri
const MONTHS_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

// "DD/MM/YYYY" (tek haneli gün/ay da olur), "YYYY-MM-DD", "YYYY/MM/DD", "MM/YYYY", "YYYY"
function parseToYearMonth(input) {
  if (!input || typeof input !== "string") return null;
  const s = input.trim();
  if (!s) return null;

  // D/M/YYYY veya DD/MM/YYYY (ayırıcı: / . -)
  let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    if (month >= 1 && month <= 12) return { y: year, m: month };
  }

  // YYYY-M-D veya YYYY/M/D (gün opsiyonel)
  m = s.match(/^(\d{4})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{1,2}))?$/);
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    if (month >= 1 && month <= 12) return { y: year, m: month };
  }

  // MM/YYYY
  m = s.match(/^(\d{1,2})[\/\-\.](\d{4})$/);
  if (m) {
    const month = parseInt(m[1], 10);
    const year = parseInt(m[2], 10);
    if (month >= 1 && month <= 12) return { y: year, m: month };
  }

  // YYYY
  m = s.match(/^(\d{4})$/);
  if (m) return { y: parseInt(m[1], 10), m: null };

  return null;
}

function formatYMStrict(value) {
  const d = parseToYearMonth(value);
  if (!d) return "";
  if (d.m == null) return String(d.y);
  return `${MONTHS_TR[d.m - 1]} ${d.y}`;
}

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
          const start = formatYMStrict(c.start);
          const end = c.present ? "Present" : formatYMStrict(c.end);
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
