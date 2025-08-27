// src/sections/ExperienceSection.jsx
import Section from "../components/Section";
import Card from "../components/Card";
import StackBadge from "../components/StackBadge";
import { safeGet, formatYM } from "../lib/utils";


export default function ExperienceSection({ items, stackIndex }) {
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
const stack = Array.isArray(exp.stack) ? exp.stack : Array.isArray(exp.tech) ? exp.tech : [];


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