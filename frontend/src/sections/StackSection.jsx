// src/sections/StackSection.jsx
import React from "react";
import Section from "../components/Section";
import { resolveAsset } from "../lib/utils";

const ORDER = [
  "Programming Languages",
  "AI & Data Science",
  "Web & UI Development",
  "Databases",
  "Embedded & IoT",
  "Tools & Others",
];

const EMOJI = {
  "Programming Languages": "💻",
  "AI & Data Science": "📊",
  "Web & UI Development": "🌐",
  "Databases": "🗄️",
  "Embedded & IoT": "🔌",
  "Tools & Others": "🧰",
};

function StackLogo({ item }) {
  const src = resolveAsset(item.logo_path || "") || item.logo_url || "";
  const label = item.name || "";
  const content = (
    <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
      {src ? (
        <img
          src={src}
          alt={label}
          className="h-12 w-12 object-contain"
          height={48}
          width={48}
          loading="lazy"
        />
      ) : (
        <div className="h-12 w-12 rounded-lg bg-white/10 grid place-items-center text-sm">
          {label?.[0] || "?"}
        </div>
      )}
      <div className="text-xs text-center leading-tight">{label}</div>
    </div>
  );

  if (item.link) {
    return (
      <a href={item.link} target="_blank" rel="noreferrer" className="block">
        {content}
      </a>
    );
  }
  return content;
}

export default function StackSection({ items }) {
  // Gruplama
  const groups =
    items?.reduce((acc, it) => {
      const cat = it.category || "Tools & Others";
      acc[cat] = acc[cat] || [];
      acc[cat].push(it);
      return acc;
    }, {}) || {};

  // Sıralı kategori listesi (önce ORDER'dakiler, sonra kalanlar)
  const categories = [
    ...ORDER.filter((c) => groups[c]?.length),
    ...Object.keys(groups).filter((c) => !ORDER.includes(c)),
  ];

  return (
    <Section id="stack" title="🛠️ Technologies & Tools" subtitle="My day-to-day stack & tools">
      {categories.length === 0 && <p className="text-white/60">No stack items yet.</p>}

      <div className="space-y-10">
        {categories.map((cat) => (
          <div key={cat}>
            <h3 className="mb-4 text-lg font-semibold">
              <span className="mr-2">{EMOJI[cat] || "🧰"}</span>
              {cat}
            </h3>

            {/* Responsive grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {groups[cat].map((it, i) => (
                <StackLogo key={`${cat}-${i}-${it.name}`} item={it} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
