import React, { useMemo, useState, useEffect } from "react";
import {
  EMOJI,
  TYPE_COLOR,
  TYPE_LABEL,
  normalizeEvents,
  monthLabel,
  fmtDate,
  MPR,
  CELL_W,
  MARGIN_X,
  MARGIN_Y,
  RAIL_W,
  BAND_W,
  buildMonthsRange,
  endOfMonthU,
  mix,
  hashStr,
} from "../lib/timeline-utils";

/* ---------- LTR yardımcıları (dikey ay yok) ---------- */
const ROW_H = 160;                   // rahat bir yükseklik
const LANE_STEP = 12;                // lane step (aşağı doğru)
const LANE_EXTRA_GAP = 6;            // şeritler arası ufak boşluk
const BORDER_DELTA = 2;              // border için dış stroke farkı
const CHEV_W = 14, CHEV_H = 9;       // büyütülmüş devam üçgeni
const PANEL_HALF_W = 180;            // paneli kenarlarda kırpmak için yaklaşık yarı genişlik

function posOfMonthLTR(index) {
  const row = Math.floor(index / MPR);
  const col = index % MPR; // LTR
  const left = MARGIN_X + col * CELL_W;
  const center = left + CELL_W / 2;
  const right = left + CELL_W;
  const yCenter = MARGIN_Y + row * ROW_H + ROW_H / 2;
  return { row, left, center, right, yCenter };
}
function xForDateLTR(u, months) {
  const idxMap = new Map(months.map((m, i) => [m.key, i]));
  const d = new Date(u * 1000);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const i = idxMap.get(key);
  if (i == null) return { x: null, row: 0, left: 0, right: 0, y: 0 };
  const { row, left, right, yCenter } = posOfMonthLTR(i);
  const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const frac = Math.max(0, Math.min(1, d.getDate() / Math.max(1, days)));
  const x = left + frac * CELL_W; // LTR
  return { x, row, left, right, y: yCenter };
}

/* Daha güçlü ton varyasyonu (±%35 beyaz/siyah karışım) */
function variantColorStrong(baseHex, id) {
  const MAX = 0.35;
  const frac = (hashStr(String(id)) % 1000) / 999; // 0..1
  const signed = (frac - 0.5) * 2;                 // -1..1
  const amt = Math.abs(signed) * MAX;
  return signed >= 0 ? mix(baseHex, "#ffffff", amt) : mix(baseHex, "#000000", amt);
}

/* ---- İSTENEN RENK KURALLARI ----
   - Tutorial/Course projeler: gri
   - Seminar sertifikalar: koyu turuncu
   - Diğerleri: TYPE_COLOR
*/
function baseColorFor(ev) {
  if (ev?.type === "project") {
    const o = String(ev?.meta?.origin || "").toLowerCase();
    if (o.includes("tutorial") || o.includes("course")) {
      return "#9ca3af"; // gray-400
    }
  }
  if (ev?.type === "certificate") {
    const cat = String(ev?.meta?.category || "").toLowerCase();
    if (cat.includes("seminar")) {
      return "#c2410c"; // orange-700 (koyu turuncu)
    }
  }
  return TYPE_COLOR[ev?.type] || "#ffffff";
}

function Section({ id, title, subtitle, children }) {
  return (
    <section id={id} className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
          {subtitle && <p className="text-gray-400">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

export default function TimelineSection({ data }) {
  const events = useMemo(() => normalizeEvents(data || {}), [data]);
  const months = useMemo(() => buildMonthsRange(events), [events]);

  const rows = Math.ceil(months.length / MPR);
  const width = MARGIN_X * 2 + MPR * CELL_W;
  const height = MARGIN_Y * 2 + rows * ROW_H;

  const [hoverState, setHoverState] = useState(null);
  const [openMonth, setOpenMonth] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const onDown = (e) => {
      if (openMonth && !e.target.closest(".month-panel")) setOpenMonth(null);
      if (selectedEvent && !e.target.closest(".event-panel")) setSelectedEvent(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMonth, selectedEvent]);

  if (!months.length) {
    return <Section id="timeline" title="Timeline" subtitle="No dated events to show yet." />;
  }

  const idxMap = new Map(months.map((m, i) => [m.key, i]));
  const monthIndexFromU = (u) => {
    const d = new Date(u * 1000);
    return idxMap.get(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const H = [];     // yatay segmentler
  const P_raw = []; // tek günlük noktalar

  // geometri — LTR 6 ay/satır, dikey bağlayıcı yok
  events.forEach((ev) => {
    const a = monthIndexFromU(ev.startU);
    const b = monthIndexFromU(ev.endU);
    if (a == null && b == null) return;

    if (ev.startU === ev.endU) {
      const { x, row } = xForDateLTR(ev.startU, months);
      P_raw.push({ id: ev.id, x, row, event: ev });
      return;
    }

    let i0 = a ?? 0, i1 = b ?? months.length - 1;
    if (i0 > i1) [i0, i1] = [i1, i0];

    const firstRow = Math.floor(i0 / MPR);
    const lastRow = Math.floor(i1 / MPR);

    for (let r = firstRow; r <= lastRow; r++) {
      const rowStart = r * MPR;
      const rowEnd = Math.min(rowStart + MPR - 1, months.length - 1);
      const sIdx = Math.max(i0, rowStart);
      const eIdx = Math.min(i1, rowEnd);

      const startX = (r === firstRow)
        ? xForDateLTR(ev.startU, months).x
        : posOfMonthLTR(sIdx).left;
      const endX = (r === lastRow)
        ? xForDateLTR(ev.endU, months).x
        : posOfMonthLTR(eIdx).right;

      const contLeft = r > firstRow;
      const contRight = r < lastRow;
      H.push({ id: ev.id, row: r, x1: startX, x2: endX, event: ev, contLeft, contRight });
    }
  });

  // Lane hesaplama — AŞAĞI doğru aç
  const byRow = Array.from({ length: rows }, () => []);
  H.forEach((s) => byRow[s.row].push(s));

  const segLane = new Map();
  for (let r = 0; r < rows; r++) {
    const segs = byRow[r].sort((a, b) => a.x1 - b.x1);
    const laneEnds = [];
    for (const s of segs) {
      let lane = -1;
      for (let L = 0; L <= laneEnds.length; L++) {
        if (laneEnds[L] == null || s.x1 >= laneEnds[L] + 2) { lane = L; break; }
      }
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = Math.max(laneEnds[lane] ?? -Infinity, s.x2);
      segLane.set(s, lane);
    }
  }

  const railY = (row) => MARGIN_Y + row * ROW_H + ROW_H / 2;
  const laneY = (row, lane) => railY(row) + lane * (LANE_STEP + LANE_EXTRA_GAP); // ↓ aşağı doğru

  // tek gün noktalar — kümelenip ufak y ofset
  const P = [];
  const clusters = new Map();
  const OFFSETS = [0, 10, 20, 30, 40, 50]; // noktalar için aşağı yönde
  P_raw.forEach((p, idx) => {
    const key = `${p.row}:${Math.round(p.x)}`;
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key).push(idx);
  });
  P_raw.forEach((p, idx) => {
    const group = clusters.get(`${p.row}:${Math.round(p.x)}`) || [idx];
    const pos = group.indexOf(idx);
    const yOffset = OFFSETS[pos % OFFSETS.length];
    P.push({ ...p, y: railY(p.row) + yOffset });
  });

  // etiket konumları (ağırlıklı)
  const labelByEvent = new Map();
  {
    const segsWithY = H.map((s) => ({ ...s, y: laneY(s.row, segLane.get(s) ?? 0) }));
    const byId = new Map();
    segsWithY.forEach((s) => { if (!byId.has(s.id)) byId.set(s.id, []); byId.get(s.id).push(s); });
    byId.forEach((arr, id) => {
      let sumW = 0, sumX = 0, sumY = 0;
      arr.forEach((s) => { const w = Math.abs(s.x2 - s.x1); sumW += w; sumX += ((s.x1 + s.x2) / 2) * w; sumY += s.y * w; });
      if (sumW > 0) labelByEvent.set(id, { x: sumX / sumW, y: sumY / sumW + 18 });
    });
  }

  const openMonthPanel = (index) => {
    const mStart = months[index].u;
    const mEnd = endOfMonthU(months[index].u);
    const items = events
      .filter((ev) => ev.endU >= mStart && ev.startU <= mEnd)
      .map((ev) => ({ ev, showStart: Math.max(ev.startU, mStart), showEnd: Math.min(ev.endU, mEnd) }))
      .sort((a, b) => a.showStart - b.showStart);
    setOpenMonth({ index, items });
  };
  const closeMonthPanel = () => setOpenMonth(null);
  const openEventPanel = (ev) => setSelectedEvent(ev);
  const closeEventPanel = () => setSelectedEvent(null);

  const renderTooltip = () => {
    if (!hoverState) return null;
    const ev = hoverState.ev;
    const baseCol = baseColorFor(ev);
    const col = variantColorStrong(baseCol, ev.id);
    const clean = (t) => (t && String(t).trim().length ? String(t).trim() : null);

    const lines = [
      `${EMOJI[ev.type] || "•"} ${TYPE_LABEL[ev.type]}`,
      clean(ev.title),
      clean(ev.meta?.team),
      clean(ev.meta?.organization),
      ev.startU === ev.endU ? `${fmtDate(ev.startU)}` : `${fmtDate(ev.startU)} → ${ev.present ? "Present" : fmtDate(ev.endU)}`,
    ].filter(Boolean);

    const w = Math.min(460, Math.max(240, 28 + 7 * Math.max(...lines.map((t) => t.length))));
    const h = 16 + 22 * lines.length + 12;
    const x = Math.max(8, Math.min(width - w - 8, hoverState.x - w / 2));
    const y = (hoverState.y - RAIL_W - 18 - h > 8)
      ? (hoverState.y - RAIL_W - 18 - h)
      : (hoverState.y + RAIL_W + 18);

    return (
      <g className="pointer-events-none">
        <rect x={x + 2} y={y + 3} width={w} height={h} rx="12" fill="rgba(0,0,0,0.35)" />
        <rect x={x} y={y} width={w} height={h} rx="12" fill="#0f172a" opacity="0.98" stroke={baseCol} strokeOpacity="0.6" />
        <rect x={x} y={y} width="7" height={h} rx="12" fill={baseCol} opacity="0.95" />
        {lines.map((t, i) => (
          <text key={i} x={x + 16} y={y + 22 + 18 * i} fill="#fff" fontSize={i <= 1 ? 13 : 12} fontWeight={i <= 1 ? 700 : 500}>
            {t}
          </text>
        ))}
        <line x1={hoverState.x} y1={hoverState.y} x2={hoverState.x} y2={y > hoverState.y ? y : y + h} stroke={col} strokeWidth="2" />
      </g>
    );
  };

  // Yardımcı: ay panelinde tarih etiketini yaz
  const rangeLabel = (ev, showStart, showEnd) => {
    // Sertifika (veya tek günlük her şey) için tek tarih yeterli
    if (ev.type === "certificate" || ev.startU === ev.endU) {
      return fmtDate(showStart);
    }
    // Diğerleri için aralık / present
    return `${fmtDate(showStart)} → ${ev.present && showEnd === ev.endU ? "Present" : fmtDate(showEnd)}`;
  };

  return (
    <Section id="timeline" title="Timeline" subtitle="">
      <div className="relative z-20 overflow-x-auto overflow-y-visible isolate">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={Math.max(420, height)}
          role="img"
          aria-label="LTR half-year rows timeline"
          className="bg-slate-900"
          style={{ display: "block" }}
        >
          {/* Raylar (her satır için) */}
          {Array.from({ length: rows }).map((_, r) => {
            const xL = MARGIN_X, xR = MARGIN_X + MPR * CELL_W;
            const y = MARGIN_Y + r * ROW_H + ROW_H / 2;
            return (
              <g key={`rail-${r}`}>
                <line
                  x1={xL}
                  y1={y}
                  x2={xR}
                  y2={y}
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth={RAIL_W}
                  strokeLinecap="round"
                  opacity={r % 2 === 0 ? 1 : 0.85}
                />
              </g>
            );
          })}

          {/* Ay başlıkları — SOLA YASLI */}
          {months.map((m, i) => {
            const { left, yCenter } = posOfMonthLTR(i);
            const labelY = yCenter - RAIL_W - 14;
            return (
              <g key={`m-${m.key}`} className="cursor-pointer" onClick={() => openMonthPanel(i)}>
                <text
                  x={left + 8}
                  y={labelY}
                  textAnchor="start"
                  fontSize="12"
                  fill="rgba(255,255,255,0.9)"
                >
                  {m.label}
                </text>
              </g>
            );
          })}

          {/* Yatay şeritler (border + iç renk + present halka) */}
          {[...H]
            .sort((a, b) => {
              const la = segLane.get(a) ?? 0, lb = segLane.get(b) ?? 0;
              const ya = laneY(a.row, la);
              const yb = laneY(b.row, lb);
              return (yb - ya) || (a.x1 - b.x1);
            })
            .map((s, i) => {
              const baseCol = baseColorFor(s.event);
              const col = variantColorStrong(baseCol, `${s.id}-${s.row}`);
              const lane = segLane.get(s) ?? 0;
              const y = laneY(s.row, lane);
              const anchorX = (s.x1 + s.x2) / 2;
              const borderCol = mix(col, "#000000", 0.35);
              const isPresentEnd = s.event.present && !s.contRight; // son segment ve present

              return (
                <g
                  key={`seg-${i}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverState({ x: anchorX, y, ev: s.event })}
                  onMouseLeave={() => setHoverState(null)}
                  onClick={() => openEventPanel(s.event)}
                >
                  {/* dış ince border */}
                  <line x1={s.x1} y1={y} x2={s.x2} y2={y} stroke={borderCol} strokeWidth={BAND_W + BORDER_DELTA} strokeLinecap="round" opacity="0.95" />
                  {/* iç renk */}
                  <line x1={s.x1} y1={y} x2={s.x2} y2={y} stroke={col} strokeWidth={BAND_W} strokeLinecap="round" opacity="0.97" />

                  {/* Satırdan taşan devam okları */}
                  {s.contLeft && (
                    <path d={`M ${s.x1} ${y} l ${-CHEV_W} ${-CHEV_H} l 0 ${2 * CHEV_H} z`} fill={col} opacity="0.95" />
                  )}
                  {s.contRight && (
                    <path d={`M ${s.x2} ${y} l ${CHEV_W} ${-CHEV_H} l 0 ${2 * CHEV_H} z`} fill={col} opacity="0.95" />
                  )}

                  {/* Present (devam eden) — halka işaretleyici */}
                  {isPresentEnd && (
                    <>
                      <circle cx={s.x2} cy={y} r={BAND_W / 2 + 4} fill="none" stroke={borderCol} strokeWidth="2" />
                      <circle cx={s.x2} cy={y} r={BAND_W / 2 - 1} fill={col} />
                    </>
                  )}
                </g>
              );
            })}

          {/* Etiketler */}
          {[...labelByEvent.entries()].map(([id, L]) => {
            const ev = events.find((e) => e.id === id);
            if (!ev) return null;
            return (
              <text
                key={`lbl-${id}`}
                x={L.x}
                y={L.y}
                textAnchor="middle"
                fontSize="12"
                fill="rgba(255,255,255,0.92)"
                className="cursor-pointer"
                onClick={() => openEventPanel(ev)}
              >
                {EMOJI[ev.type]} {TYPE_LABEL[ev.type]}
              </text>
            );
          })}

          {/* Tek günlük noktalar (ince border + iç renk) */}
          {P.map((p, i) => {
            const baseCol = baseColorFor(p.event);
            const col = variantColorStrong(baseCol, `${p.id}-pt-${i}`);
            const r = BAND_W / 2;
            const borderCol = mix(col, "#000000", 0.35);
            return (
              <g
                key={`pt-${i}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoverState({ x: p.x, y: p.y, ev: p.event })}
                onMouseLeave={() => setHoverState(null)}
                onClick={() => openEventPanel(p.event)}
              >
                <circle cx={p.x} cy={p.y} r={r + BORDER_DELTA / 2} fill={borderCol} opacity="0.95" />
                <circle cx={p.x} cy={p.y} r={r} fill={col} opacity="0.97" />
              </g>
            );
          })}

          {renderTooltip()}
        </svg>

        {/* Ay Paneli — X pozisyonu clamp'li (sol/sağ taşma yok) */}
        {openMonth && (() => {
          const center = posOfMonthLTR(openMonth.index).center;
          const clampedX = Math.max(PANEL_HALF_W + 8, Math.min(width - PANEL_HALF_W - 8, center));
          const top = MARGIN_Y + Math.floor(openMonth.index / MPR) * ROW_H + 8;
          return (
            <div
              className="month-panel absolute bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl"
              style={{ left: clampedX, top, transform: "translateX(-50%)", minWidth: "260px", zIndex: 80 }}
            >
              <button className="absolute top-2 right-2 text-white" onClick={closeMonthPanel}>✕</button>
              <h3 className="text-white font-bold mb-3">{monthLabel(months[openMonth.index].u)}</h3>
              <ul className="text-white text-sm space-y-2 max-h-64 overflow-y-auto pr-1">
                {openMonth.items.map(({ ev, showStart, showEnd }, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">{EMOJI[ev.type]}</span>
                    <div className="leading-tight">
                      <div className="font-medium hover:underline cursor-default">{ev.title}</div>
                      <div className="text-xs text-slate-300">{rangeLabel(ev, showStart, showEnd)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

        {/* Event Panel */}
        {selectedEvent && (
          <div
            className="event-panel absolute bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl"
            style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", minWidth: "320px", zIndex: 80 }}
          >
            <button className="absolute top-2 right-2 text-white" onClick={closeEventPanel}>✕</button>
            <h3 className="text-white font-bold mb-2">{EMOJI[selectedEvent.type]} {TYPE_LABEL[selectedEvent.type]}</h3>
            <p className="text-white">{selectedEvent.title}</p>
            {selectedEvent.meta?.organization && <p className="text-gray-400">Organization: {selectedEvent.meta.organization}</p>}
            {selectedEvent.meta?.team && <p className="text-gray-400">Team: {selectedEvent.meta.team}</p>}
            <p className="text-gray-400">
              {selectedEvent.startU === selectedEvent.endU
                ? fmtDate(selectedEvent.startU)
                : `${fmtDate(selectedEvent.startU)} → ${selectedEvent.present ? "Present" : fmtDate(selectedEvent.endU)}`}
            </p>
          </div>
        )}
      </div>
    </Section>
  );
}
