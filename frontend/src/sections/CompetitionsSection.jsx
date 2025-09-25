// src/sections/CompetitionsSection.jsx
import { useMemo, useState, useEffect, useCallback } from "react";
import Section from "../components/Section";
import Card from "../components/Card";
import StackBadge from "../components/StackBadge";
import { safeGet, resolveAsset } from "../lib/utils";

// TR kısaltmalı ay isimleri
const MONTHS_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

// "DD/MM/YYYY" (tek haneli gün/ay da olur), "YYYY-MM-DD", "YYYY/MM/DD", "MM/YYYY", "YYYY"
function parseToYearMonth(input) {
  if (!input || typeof input !== "string") return null;
  const s = input.trim();
  if (!s) return null;

  // D/M/YYYY veya DD/MM/YYYY (ayırıcı: / . -)
  let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) {
    const month = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    if (month >= 1 && month <= 12) return { y: year, m: month };
  }

  // YYYY-M-D veya YYYY/M/D (gün opsiyonel)
  m = s.match(/^(\d{4})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{1,2}))?$/);
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    if (month >= 1 && month <= 12) return { y: year, m: month };
  }

  // MM/YYYY
  m = s.match(/^(\d{1,2})[\/\-\.](\d{4})$/);
  if (m) {
    const month = parseInt(m[1], 10);
    const year = parseInt(m[2], 10);
    if (month >= 1 && month <= 12) return { y: year, m: month };
  }

  // YYYY
  m = s.match(/^(\d{4})$/);
  if (m) return { y: parseInt(m[1], 10), m: null };

  return null;
}

function formatYMStrict(value) {
  const d = parseToYearMonth(value);
  if (!d) return "";
  if (d.m == null) return String(d.y);
  return `${MONTHS_TR[d.m - 1]} ${d.y}`;
}

// Küçük yardımcı: item içinden görselleri topla (images, photos, media.images vs.)
function useImages(item) {
  return useMemo(() => {
    const arrays = [
      item?.images,
      item?.photos,
      safeGet(item, "media.images", []),
      safeGet(item, "gallery", []),
    ].filter(Array.isArray);

    const flat = arrays.flat().map((p) => resolveAsset(p)).filter(Boolean);
    // Aynı yolu tekrar etme
    return Array.from(new Set(flat));
  }, [item]);
}

// Lightbox bileşeni (çok basit)
function Lightbox({ open, images, index, onClose, onIndex }) {
  // ESC ile kapat
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const prev = useCallback(() => {
    if (!images?.length) return;
    onIndex((index - 1 + images.length) % images.length);
  }, [images, index, onIndex]);

  const next = useCallback(() => {
    if (!images?.length) return;
    onIndex((index + 1) % images.length);
  }, [images, index, onIndex]);

  if (!open || !images?.length) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-6xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[index]}
          alt=""
          className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10"
          loading="eager"
        />
        {/* Sol / Sağ oklar */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full px-3 py-2 text-white"
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full px-3 py-2 text-white"
              aria-label="Next"
            >
              ›
            </button>
          </>
        )}
        {/* Kapat */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white text-black rounded-full w-8 h-8 shadow-lg"
          aria-label="Close"
          title="Close"
        >
          ✕
        </button>
        {/* Sayaç */}
        <div className="absolute bottom-2 right-3 text-xs text-white/90 bg-black/40 px-2 py-1 rounded">
          {index + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}

export default function CompetitionsSection({ items, stackIndex }) {
  const [lbOpen, setLbOpen] = useState(false);
  const [lbImages, setLbImages] = useState([]);
  const [lbIndex, setLbIndex] = useState(0);

  const openLightbox = (images, idx = 0) => {
    setLbImages(images);
    setLbIndex(idx);
    setLbOpen(true);
  };

  return (
    <Section id="competitions" title="Competitions">
      {(!items || items.length === 0) && (
        <p className="text-white/60">No competitions yet.</p>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {items?.map((c, idx) => {
          const name = safeGet(c, "name.en") || safeGet(c, "title.en");
          const role = safeGet(c, "role.en");
          const org = c?.organization;
          const result = c?.result;
          const details = safeGet(c, "details.en");
          const highlights = safeGet(c, "highlights.en", []);
          const start = formatYMStrict(c?.start);
          const end = c?.present ? "Present" : formatYMStrict(c?.end);
          const range = [start, end].filter(Boolean).join(" — ");
          const stack = Array.isArray(c?.stack) ? c.stack : [];

          // görseller
          const images = useImages(c);
          const coverIndex = Math.min(
            Math.max(0, Number(c?.cover_index ?? 0)),
            Math.max(0, images.length - 1)
          );
          const cover = images[coverIndex];

          return (
            <Card key={idx}>
              <div className="flex flex-col gap-3">
                {/* Kapak + thumb şeridi */}
                {images.length > 0 && (
                  <div className="group">
                    {/* Kapak görseli */}
                    <button
                      type="button"
                      onClick={() => openLightbox(images, coverIndex)}
                      className="w-full block overflow-hidden rounded-xl border border-white/10"
                      title="Click to enlarge"
                    >
                      <div className="aspect-[16/9] w-full">
                        <img
                          src={cover}
                          alt={name || "Competition image"}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02] select-none"
                          loading="lazy"
                        />
                      </div>
                    </button>

                    {/* Küçük önizlemeler */}
                    {images.length > 1 && (
                      <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                        {images.map((src, i) => {
                          const active = i === coverIndex;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => openLightbox(images, i)}
                              className={[
                                "shrink-0 rounded-lg border overflow-hidden",
                                active
                                  ? "border-emerald-400/70 ring-2 ring-emerald-400/30"
                                  : "border-white/10 hover:border-white/20",
                              ].join(" ")}
                              title={`Preview ${i + 1}`}
                            >
                              <img
                                src={src}
                                alt=""
                                className="w-20 h-14 md:w-24 md:h-16 object-cover"
                                loading="lazy"
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Başlık ve tarih */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-lg">{name || "Competition"}</h3>
                  <div className="text-xs text-white/60">{range}</div>
                </div>

                {/* Organizasyon/rol/sonuç */}
                <div className="text-sm text-white/80">
                  <span className="font-medium">{org}</span>
                  {role && <span className="text-white/60"> • {role}</span>}
                  {result && <span className="ml-2 text-emerald-300/90">{result}</span>}
                </div>

                {/* Detay metni */}
                {details && (
                  <p className="text-sm text-white/80 whitespace-pre-line">
                    {details}
                  </p>
                )}

                {/* Madde madde öne çıkanlar */}
                {Array.isArray(highlights) && highlights.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-sm text-white/80 space-y-1">
                    {highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                )}

                {/* Stack rozetleri */}
                {stack.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-2">
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

      {/* Lightbox */}
      <Lightbox
        open={lbOpen}
        images={lbImages}
        index={lbIndex}
        onClose={() => setLbOpen(false)}
        onIndex={setLbIndex}
      />
    </Section>
  );
}
