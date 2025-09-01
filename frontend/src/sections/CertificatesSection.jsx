import React, { useMemo, useState, useEffect, useCallback } from "react";
import Card from "../components/Card";
import Section from "../components/Section";
import { safeGet } from "../lib/utils";

// dd/mm/yyyy veya yyyy-mm-dd -> UNIX
function toUnix(dateStr) {
  if (!dateStr) return null;
  if (typeof dateStr === "number") return dateStr;
  const s = String(dateStr).trim();
  const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (m) {
    const [_, dd, mm, yyyy] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return isNaN(d) ? null : Math.floor(d.getTime() / 1000);
  }
  const d = new Date(s);
  return isNaN(d) ? null : Math.floor(d.getTime() / 1000);
}

function pickIssuedUnix(c) {
  return (
    toUnix(c?.issued_at_unix) ??
    toUnix(c?.issued_at_iso) ??
    toUnix(c?.issued_at) ??
    null
  );
}

export default function CertificatesSection({ certificates = [] }) {
  // İSTEK: Editor sırası yok → yalnız iki seçenek
  // Varsayılan: Newest → Oldest
  const [mode, setMode] = useState("date_desc"); // 'date_desc' | 'date_asc'

  // Lightbox state
  const [lightbox, setLightbox] = useState(null);
  const openLightbox = useCallback((src, name, credUrl, credId) => {
    setLightbox({ src, name, credUrl, credId });
  }, []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, closeLightbox]);

  const sorted = useMemo(() => {
    const arr = [...(certificates || [])];
    if (mode === "date_desc") {
      return arr.sort((a, b) => (pickIssuedUnix(b) ?? -1) - (pickIssuedUnix(a) ?? -1));
    }
    if (mode === "date_asc") {
      return arr.sort((a, b) => (pickIssuedUnix(a) ?? 1e15) - (pickIssuedUnix(b) ?? 1e15));
    }
    return arr;
  }, [certificates, mode]);

  return (
    <>
      <Section
        id="certificates"
        title="Certificates"
        subtitle="Latest trainings & achievements"
        toolbar={
          <select
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            aria-label="Sort certificates"
          >
            <option value="date_desc">Newest → Oldest</option>
            <option value="date_asc">Oldest → Newest</option>
          </select>
        }
      >
        {sorted.length === 0 && <p className="text-white/60">No certificates yet.</p>}

        {/* Daha geniş görsel + dengeli grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((c, i) => {
            const name = safeGet(c, "name.en", "Certificate");
            const issuer = c?.issuer || "";
            const dtUnix = pickIssuedUnix(c);
            const dateLabel = dtUnix ? new Date(dtUnix * 1000).toLocaleDateString() : "";

            const cover =
              (Array.isArray(c?.images) && c.images[0]) ||
              c?.icon ||
              "";

            const credUrl = c?.credential_url || "";
            const credId  = c?.credential_id || "";

            return (
              <Card key={`${name}-${i}`}>
                <article className="flex flex-col h-full">
                  {cover ? (
                    <button
                      type="button"
                      onClick={() => openLightbox(cover, name, credUrl, credId)}
                      className="mb-3 overflow-hidden rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                      aria-label={`Open ${name} image`}
                    >
                      <img
                        src={cover}
                        alt={name}
                        className="h-56 w-full object-cover cursor-zoom-in"
                        height={224}
                        loading="lazy"
                      />
                    </button>
                  ) : null}

                  <h3 className="text-lg font-semibold leading-tight">{name}</h3>
                  <div className="mt-1 text-sm text-white/70">
                    {issuer && <span>{issuer}</span>}
                    {issuer && dateLabel && <span className="mx-1">•</span>}
                    {dateLabel && <span>{dateLabel}</span>}
                  </div>

                  {(credUrl || credId) && (
                    <div className="mt-3 text-sm">
                      {credUrl && (
                        <a
                          className="underline underline-offset-4"
                          href={credUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Verify
                        </a>
                      )}
                      {credUrl && credId && <span className="mx-2 text-white/40">|</span>}
                      {credId && <span className="text-white/80">ID: {credId}</span>}
                    </div>
                  )}
                </article>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Certificate preview"
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeLightbox}
              className="absolute -top-10 right-0 text-white/90 hover:text-white text-2xl"
              aria-label="Close"
              title="Close"
            >
              ×
            </button>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
              <img
                src={lightbox.src}
                alt={lightbox.name}
                className="max-h-[80vh] w-full object-contain bg-black/20"
                loading="eager"
              />
              <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-sm text-white/80 truncate">{lightbox.name}</div>
                <div className="flex items-center gap-3">
                  {lightbox.credUrl && (
                    <a
                      href={lightbox.credUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
                    >
                      View on web
                    </a>
                  )}
                  {lightbox.credId && (
                    <span className="text-xs text-white/70">ID: {lightbox.credId}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
