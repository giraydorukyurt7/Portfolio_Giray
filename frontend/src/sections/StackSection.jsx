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
  const wrapper =
    "flex flex-col items-center gap-1.5 p-2 rounded-lg border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition";

  const content = (
    <div className={wrapper} title={label}>
      {src ? (
        <img
          src={src}
          alt={label}
          className="h-9 w-9 object-contain"
          height={36}
          width={36}
          loading="lazy"
        />
      ) : (
        <div className="h-9 w-9 rounded-md bg-white/10 grid place-items-center text-xs">
          {label?.[0] || "?"}
        </div>
      )}
      <div className="text-[11px] text-center leading-tight truncate max-w-[7.5rem]">
        {label}
      </div>
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
    <Section
      id="stack"
      title="🛠️ Technologies & Tools"
      subtitle="My day-to-day stack & tools"
    >
      {categories.length === 0 && (
        <p className="text-white/60">No stack items yet.</p>
      )}

      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat}>
            <h3 className="mb-2 text-base font-semibold">
              <span className="mr-2">{EMOJI[cat] || "🧰"}</span>
              {cat}
            </h3>

            {/* Daha kompakt grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10 gap-2">
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
