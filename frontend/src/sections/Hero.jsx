// src/sections/Hero.jsx
import Card from "../components/Card";
import ExternalLink from "../components/ExternalLink";
import { safeGet } from "../lib/utils";


export default function Hero({ info }) {
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
<h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">{fullName || "Your Name"}</h1>
<p className="mt-2 text-lg text-white/80">{title || "Student"}</p>
{university && <p className="mt-1 text-sm text-white/60">{university}</p>}
{summary && <p className="mt-6 text-base leading-7 text-white/80 whitespace-pre-line">{summary}</p>}


<div className="mt-6 flex flex-wrap items-center gap-3">
{links?.cv && (
<a href={links.cv} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15">
Download CV
</a>
)}
{links?.github && (
<a href={links.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10">
GitHub
</a>
)}
{links?.linkedin && (
<a href={links.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10">
LinkedIn
</a>
)}
{links?.website && (
<a href={links.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10">
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
Email: <ExternalLink href={`mailto:${info.email}`}>{info.email}</ExternalLink>
</li>
)}
{!info?.department && !info?.class_year && !info?.gpa && !info?.location && !info?.email && <li>No additional info yet.</li>}
</ul>
</div>
</Card>
</div>
</div>
</div>
</section>
);
}