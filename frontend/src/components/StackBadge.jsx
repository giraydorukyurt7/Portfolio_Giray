// src/components/StackBadge.jsx
import { resolveAsset } from "../lib/utils";


export default function StackBadge({ name, index }) {
if (!name) return null;
const key = String(name).trim().toLowerCase();
const item = index[key];
const label = item?.name || name;


const logo = (item?.logo_path ? resolveAsset(item.logo_path) : "") || (item?.logo_url ? item.logo_url : "");


const content = (
<span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-xs">
{logo ? (
<img src={logo} alt={label} className="h-4 w-4 object-contain" height="16" width="16" loading="lazy" />
) : null}
<span className="whitespace-nowrap">{label}</span>
</span>
);


if (item?.link) {
return (
<a href={item.link} target="_blank" rel="noreferrer" className="hover:opacity-90">
{content}
</a>
);
}
return content;
}