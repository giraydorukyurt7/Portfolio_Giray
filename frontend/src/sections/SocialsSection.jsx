// src/sections/SocialsSection.jsx
import Section from "../components/Section";

export default function SocialsSection({ items }) {
  const has = Array.isArray(items) && items.length > 0;
  return (
    <Section id="socials" title="Socials" subtitle="Find me around the web">
      {!has && <p className="text-white/60">No social links yet.</p>}
      {has && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((s, i) => (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              {s.icon ? (
                <img src={s.icon} alt="icon" className="h-8 w-8 object-contain" height={32} width={32} />
              ) : (
                <div className="h-8 w-8 rounded bg-white/10 grid place-items-center text-xs">{(s.platform || "?")[0]}</div>
              )}
              <div className="text-xs text-center leading-tight">
                {s.label || s.platform || s.username || s.url}
              </div>
            </a>
          ))}
        </div>
      )}
    </Section>
  );
}
