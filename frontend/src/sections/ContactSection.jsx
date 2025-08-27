// src/sections/ContactSection.jsx
import Section from "../components/Section";
import Card from "../components/Card";


export default function ContactSection({ info, socials }) {
const email = info?.email;
const hasSocials = Array.isArray(socials) && socials.length > 0;


return (
<Section id="contact" title="Contact">
<Card>
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
<div>
<p className="text-white/80 text-sm">Prefer email? I usually respond within a day.</p>
{email ? (
<a href={`mailto:${email}`} className="mt-2 inline-flex items-center rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15">
{email}
</a>
) : (
<p className="text-white/60 text-sm mt-2">No email provided yet.</p>
)}
</div>


<div className="md:text-right">
<p className="text-white/80 text-sm">Socials</p>
{hasSocials ? (
<div className="mt-2 flex flex-wrap gap-2 md:justify-end">
{socials.map((s, i) => (
<a key={i} href={s.url} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 px-3 py-1 text-sm hover:bg-white/10 inline-flex items-center gap-2">
{s.icon ? (
<img src={s.icon} alt="icon" className="h-4 w-4 object-contain" height="16" width="16" />
) : null}
{s.label || s.platform || s.url}
</a>
))}
</div>
) : (
<p className="text-white/60 text-sm mt-2">No social links yet.</p>
)}
</div>
</div>
</Card>
</Section>
);
}