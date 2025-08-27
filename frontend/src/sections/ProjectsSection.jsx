// src/sections/ProjectsSection.jsx
import Section from "../components/Section";
import Card from "../components/Card";
import StackBadge from "../components/StackBadge";
import ExternalLink from "../components/ExternalLink";
import { safeGet, formatYM } from "../lib/utils";


export default function ProjectsSection({ items, stackIndex }) {
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
<StackBadge key={i} name={s} index={stackIndex} />
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