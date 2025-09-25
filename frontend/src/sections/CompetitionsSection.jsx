// src/sections/CompetitionsSection.jsx
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import Section from "../components/Section";
import Card from "../components/Card";
import StackBadge from "../components/StackBadge";
import { safeGet, resolveAsset } from "../lib/utils";

/* ---------- Date helpers: output dd/mm/yyyy ---------- */
function pad2(n){ return String(n).padStart(2,"0"); }
function parseAnyDate(s){
  if(!s || typeof s!=="string") return null;
  const t=s.trim(); if(!t) return null;
  let m=t.match(/^(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})$/);
  if(m){
    const y=+m[1], mo=+m[2], d=+m[3];
    const dt=new Date(Date.UTC(y,mo-1,d));
    return isNaN(dt.getTime())?null:dt;
  }
  m=t.match(/^(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})$/);
  if(m){
    const d=+m[1], mo=+m[2], y=+m[3];
    const dt=new Date(Date.UTC(y,mo-1,d));
    return isNaN(dt.getTime())?null:dt;
  }
  const dt=new Date(t);
  if(!isNaN(dt.getTime())){
    return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
  }
  return null;
}
function fmtDDMMYYYY(dt){
  if(!dt) return "";
  const d=dt.getUTCDate();
  const m=dt.getUTCMonth()+1;
  const y=dt.getUTCFullYear();
  return `${pad2(d)}/${pad2(m)}/${y}`;
}
function formatDateRangeDDMMYYYY(startStr, endStr, present=false){
  const ds=parseAnyDate(startStr);
  const de=present?null:parseAnyDate(endStr);
  if(ds && de) return `${fmtDDMMYYYY(ds)} — ${fmtDDMMYYYY(de)}`;
  if(ds && present) return `${fmtDDMMYYYY(ds)} — Present`;
  if(ds && !de) return `${fmtDDMMYYYY(ds)}`;
  return "";
}

/* ---------- Collect images ---------- */
function useImages(item){
  return useMemo(()=>{
    const arrays=[
      item?.images,
      item?.photos,
      safeGet(item,"media.images",[]),
      safeGet(item,"gallery",[]),
    ].filter(Array.isArray);
    const flat=arrays.flat().map(p=>resolveAsset(p)).filter(Boolean);
    return Array.from(new Set(flat));
  },[item]);
}

/* ---------- Lightbox ---------- */
function Lightbox({ open, images, index, onClose, onIndex }){
  useEffect(()=>{
    if(!open) return;
    const h=(e)=>{ if(e.key==="Escape") onClose?.(); };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  },[open,onClose]);
  const prev=useCallback(()=>{ if(images?.length) onIndex((index-1+images.length)%images.length); },[images,index,onIndex]);
  const next=useCallback(()=>{ if(images?.length) onIndex((index+1)%images.length); },[images,index,onIndex]);
  if(!open || !images?.length) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-6xl w-full" onClick={(e)=>e.stopPropagation()}>
        <img src={images[index]} alt="" className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10 bg-black" loading="eager"/>
        {images.length>1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full px-3 py-2 text-white" aria-label="Previous">‹</button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full px-3 py-2 text-white" aria-label="Next">›</button>
          </>
        )}
        <button onClick={onClose} className="absolute -top-3 -right-3 bg-white text-black rounded-full w-8 h-8 shadow-lg" aria-label="Close" title="Close">✕</button>
        <div className="absolute bottom-2 right-3 text-xs text-white/90 bg-black/40 px-2 py-1 rounded">{index+1} / {images.length}</div>
      </div>
    </div>
  );
}

/* ---------- Title size helper: slightly shrink long titles ---------- */
function titleSizeClass(title){
  const len = (title || "").length;
  // ~28+ karakter olanlarda bir tık küçült
  if(len >= 28) return "text-base md:text-[17px]";
  return "text-lg";
}

/* ---------- Main Section ---------- */
export default function CompetitionsSection({ items, stackIndex }){
  const [lbOpen,setLbOpen]=useState(false);
  const [lbImages,setLbImages]=useState([]);
  const [lbIndex,setLbIndex]=useState(0);

  // Grid & per-row alignment
  const gridRef = useRef(null);
  const cardRefs = useRef([]);
  const div1Refs = useRef([]);
  const [div1Heights, setDiv1Heights] = useState({}); // index -> px

  // Thumb scrollers (always-show scrollbar)
  const stripRefs = useRef([]);
  const stripInnerRefs = useRef([]);
  const stripGhostRefs = useRef([]);

  const openLightbox=(images,idx=0)=>{ setLbImages(images); setLbIndex(idx); setLbOpen(true); };

  /* ---- Alignment: make every row's Div-1 equal to the tallest in that row ---- */
  const alignRows = useCallback(()=>{
    const cards = cardRefs.current;
    const blocks = div1Refs.current;
    const rows = new Map(); // top -> idx[]
    cards.forEach((el,i)=>{
      if(!el) return;
      const top = Math.round(el.offsetTop);
      if(!rows.has(top)) rows.set(top, []);
      rows.get(top).push(i);
    });
    const next = {};
    rows.forEach((idxs)=>{
      let maxH = 0;
      idxs.forEach(i=>{
        const b = blocks[i];
        if(b) maxH = Math.max(maxH, b.offsetHeight);
      });
      idxs.forEach(i=>{ next[i] = maxH; });
    });
    setDiv1Heights(next);
  },[]);

  /* ---- Thumb strips: force overflow so scrollbar is ALWAYS visible ---- */
  const ensureOverflow = useCallback(()=>{
    stripRefs.current.forEach((wrapEl, i)=>{
      const inner = stripInnerRefs.current[i];
      const ghost = stripGhostRefs.current[i];
      if(!wrapEl || !inner || !ghost) return;

      // content width WITHOUT ghost
      const contentW = inner.scrollWidth - ghost.offsetWidth;
      const containerW = wrapEl.clientWidth;

      // If content ≤ container, grow ghost to force small overflow
      const needed = Math.max(0, containerW + 24 - contentW);
      ghost.style.width = `${needed || 24}px`;
    });
  },[]);

  // Observe resize & content changes
  useEffect(()=>{
    const ro = new ResizeObserver(()=>{ alignRows(); ensureOverflow(); });
    if(gridRef.current) ro.observe(gridRef.current);
    cardRefs.current.forEach(el=>{ if(el) ro.observe(el); });
    div1Refs.current.forEach(el=>{ if(el) ro.observe(el); });
    stripRefs.current.forEach(el=>{ if(el) ro.observe(el); });
    stripInnerRefs.current.forEach(el=>{ if(el) ro.observe(el); });

    const onResize = ()=>{ alignRows(); ensureOverflow(); };
    window.addEventListener("resize", onResize);

    // initial
    alignRows();
    ensureOverflow();

    return ()=>{
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  },[items, alignRows, ensureOverflow]);

  return (
    <Section id="competitions" title="Competitions">
      {/* Custom, modern scrollbar styles */}
      <style>{`
        .custom-hscroll { overflow-x: scroll; scrollbar-gutter: stable both-edges; }
        .custom-hscroll::-webkit-scrollbar { height: 8px; }
        .custom-hscroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.06); border-radius: 9999px; }
        .custom-hscroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); border-radius: 9999px; }
        .custom-hscroll:hover::-webkit-scrollbar-thumb { background: rgba(99,230,153,0.55); }
        .custom-hscroll { scrollbar-width: thin; scrollbar-color: rgba(99,230,153,0.55) rgba(255,255,255,0.06); }
      `}</style>

      {(!items || items.length===0) && (<p className="text-white/60">No competitions yet.</p>)}

      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items?.map((c,idx)=>{
          const name = safeGet(c,"name.en") || safeGet(c,"title.en");
          const role = safeGet(c,"role.en");
          const org  = c?.organization;
          const team = c?.team;
          const result = c?.result;
          const details = safeGet(c,"details.en");
          const highlights = safeGet(c,"highlights.en",[]);
          const stack = Array.isArray(c?.stack)?c.stack:[];

          const dateLine = formatDateRangeDDMMYYYY(c?.start_iso||c?.start, c?.end_iso||c?.end, !!c?.present) || "";

          // images & cover (prefer icon)
          const images = useImages(c);
          const iconResolved = resolveAsset(c?.icon);
          let coverIndex = 0;
          if(iconResolved && images.length){
            const ix = images.indexOf(iconResolved);
            if(ix>=0) coverIndex = ix;
          }else if(c?.cover_index!=null && images.length){
            const ci = Math.min(Math.max(0, Number(c.cover_index)), Math.max(0, images.length-1));
            coverIndex = isNaN(ci)?0:ci;
          }
          const cover = images[coverIndex];

          const thumbs = images.length ? images : (cover ? [cover] : []);

          return (
            <Card key={idx} ref={el=>cardRefs.current[idx]=el}>
              <div className="flex flex-col gap-3">
                {/* Cover */}
                <div className="group">
                  <button
                    type="button"
                    onClick={()=> images.length && (setLbImages(images), setLbIndex(coverIndex), setLbOpen(true))}
                    className="w-full block overflow-hidden rounded-xl border border-white/10 bg-black/20"
                    title={images.length ? "Click to enlarge" : ""}
                    disabled={!images.length}
                  >
                    <div className="aspect-[4/3] w-full">
                      {images.length ? (
                        <img
                          src={cover}
                          alt={name || "Competition image"}
                          className="w-full h-full object-contain select-none"
                          loading="lazy"
                          onLoad={()=>{ alignRows(); ensureOverflow(); }}
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-white/40 text-sm">No image</div>
                      )}
                    </div>
                  </button>

                  {/* Thumbnails row — ALWAYS visible scrollbar with custom styling */}
                  <div
                    ref={el=>stripRefs.current[idx]=el}
                    className="custom-hscroll mt-2"
                  >
                    <div
                      ref={el=>stripInnerRefs.current[idx]=el}
                      className="flex gap-2 w-max"
                    >
                      {thumbs.map((src,i)=>(
                        <button
                          key={i}
                          type="button"
                          onClick={()=> images.length && (setLbImages(images), setLbIndex(i), setLbOpen(true))}
                          className="shrink-0 rounded-lg border overflow-hidden bg-black/20 border-white/10 hover:border-white/20"
                          title={images.length ? `Preview ${i+1}` : "Preview"}
                          disabled={!images.length}
                        >
                          <div className="w-24 h-16">
                            {src ? (
                              <img src={src} alt="" className="w-full h-full object-contain" loading="lazy" onLoad={()=>{ alignRows(); ensureOverflow(); }}/>
                            ) : (
                              <div className="w-full h-full grid place-items-center text-white/30 text-xs">—</div>
                            )}
                          </div>
                        </button>
                      ))}
                      {/* ghost spacer => width is adjusted in JS; ensures tiny overflow always */}
                      <div ref={el=>stripGhostRefs.current[idx]=el} style={{width:24, height:64}} />
                    </div>
                  </div>
                </div>

                {/* -------- Div 1 -------- */}
                <div
                  ref={el=>div1Refs.current[idx]=el}
                  style={{ height: div1Heights[idx] ?? "auto" }}
                  className="space-y-1"
                >
                  {/* Date */}
                  <div className="h-5">
                    {dateLine && (
                      <div className="text-[11px] md:text-xs text-white/60 whitespace-nowrap">
                        {dateLine}
                      </div>
                    )}
                  </div>

                  {/* Title (auto-shrink for long ones) */}
                  <h3 className={`font-semibold ${titleSizeClass(name)}`}>{name || "Competition"}</h3>

                  {/* Team */}
                  {team && (
                    <div className="text-sm text-white/80 font-medium tracking-wide">
                      {String(team).toUpperCase()}{" "}TEAM
                    </div>
                  )}

                  {/* Organization */}
                  {org && (
                    <div className="text-sm text-white/80 font-medium">
                      {org}
                    </div>
                  )}

                  {/* Role */}
                  {role && (
                    <div className="text-sm text-white/60">
                      • {role}
                    </div>
                  )}

                  {/* Result */}
                  {result && (
                    <div className="text-sm text-emerald-300/90">
                      {result}
                    </div>
                  )}
                </div>

                {/* Divider — aligned per row thanks to Div-1 height sync */}
                {(details || (Array.isArray(highlights) && highlights.length>0)) && (
                  <div className="h-px bg-white/10" />
                )}

                {/* -------- Div 2 -------- */}
                <div className="space-y-2">
                  {details && (
                    <p className="text-sm text-white/80 whitespace-pre-line">
                      {details}
                    </p>
                  )}
                  {Array.isArray(highlights) && highlights.length>0 && (
                    <ul className="list-disc list-inside text-sm text-white/80 space-y-1">
                      {highlights.map((h,i)=>(
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Stack badges */}
                {stack.length>0 && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {stack.map((t,i)=>(
                      <StackBadge key={i} name={t} index={stackIndex}/>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Lightbox */}
      <Lightbox open={lbOpen} images={lbImages} index={lbIndex} onClose={()=>setLbOpen(false)} onIndex={setLbIndex}/>
    </Section>
  );
}
