// src/sections/Hero.jsx
import Card from "../components/Card";
import ExternalLink from "../components/ExternalLink";
import { safeGet, resolveAsset, first } from "../lib/utils";

function Avatar({ src, alt }) {
  if (!src) return null;
  return (
    <div className="relative inline-block">
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-fuchsia-500/50 to-sky-400/50 blur-xl"></div>
      <img
        src={src}
        alt={alt}
        className="relative h-36 w-36 md:h-44 md:w-44 rounded-full object-cover ring-4 ring-white/10 shadow-lg"
        height={176}
        width={176}
      />
    </div>
  );
}

export default function Hero({ info }) {
  const fullName = safeGet(info, "full_name", "Your Name");
  const title = safeGet(info, "title.en", "Student");
  const university = safeGet(info, "university", "");
  const summary = safeGet(info, "summary.en", "");
  const links = info?.links || {};

  // Photo fallbacks: profile_photo.url -> photo -> photos[0] -> profile_photo.path (if relative)
  const photo = first(
    safeGet(info, "profile_photo.url", ""),
    resolveAsset(info?.photo),
    resolveAsset(Array.isArray(info?.photos) ? info.photos[0] : null),
    resolveAsset(safeGet(info, "profile_photo.path", ""))
  );

  // University logo fallbacks: university_logo.url -> university_logo.path -> university_logos[0] -> info.logo
  const uniLogo = first(
    resolveAsset(safeGet(info, "university_logo.url", "")),
    resolveAsset(safeGet(info, "university_logo.path", "")),
    resolveAsset(Array.isArray(info?.university_logos) ? info.university_logos[0] : null),
    resolveAsset(info?.logo)
  );

  return (
    <section id="home" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(120,119,198,0.25),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-white/[0.02]" />

      <div className="mx-auto max-w-6xl px-4 pt-16 pb-8 md:pt-24 md:pb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex items-start gap-5">
            <Avatar src={photo} alt={fullName} />
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">{fullName}</h1>
              <p className="mt-2 text-lg text-white/80">{title}</p>
              {university && (
                <div className="mt-1 flex items-center gap-2 text-sm text-white/60">
                  {uniLogo ? <img src={uniLogo} alt="university" className="h-5 w-5 object-contain" /> : null}
                  <span>{university}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {summary && <p className="mt-6 text-base leading-7 text-white/80 whitespace-pre-line max-w-3xl">{summary}</p>}

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
    </section>
  );
}
