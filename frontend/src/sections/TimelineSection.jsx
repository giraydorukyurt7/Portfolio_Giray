import React, { useMemo, useState, useEffect } from "react";

// Section component wrapper
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

/* ========== Date helpers ========== */
function toUnix(x) {
  if (x === 0 || x) {
    if (typeof x === "number") return x > 1e12 ? Math.floor(x / 1000) : x;
    if (x instanceof Date) return Math.floor(x.getTime() / 1000);
    const s = String(x).trim();
    const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      const d = new Date(+yyyy, +mm - 1, +dd);
      return isNaN(d) ? null : Math.floor(d.getTime() / 1000);
    }
    const d = new Date(s);
    return isNaN(d) ? null : Math.floor(d.getTime() / 1000);
  }
  return null;
}

const uJan = (Y) => Math.floor(new Date(Y, 0, 1).getTime() / 1000);
const uDecEnd = (Y) => Math.floor(new Date(Y, 11, 31, 23, 59, 59).getTime() / 1000);

function startOfMonthU(u) {
  const d = new Date((u ?? Date.now()) * 1000);
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), 1).getTime() / 1000);
}

function endOfMonthU(u) {
  const d = new Date((u ?? Date.now()) * 1000);
  return Math.floor(new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime() / 1000);
}

function addMonthsU(u, k) {
  const d = new Date(u * 1000);
  const nd = new Date(d.getFullYear(), d.getMonth() + k, 1);
  return Math.floor(nd.getTime() / 1000);
}

function monthKey(u) {
  const d = new Date(u * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(u) {
  const d = new Date(u * 1000);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function fmtDate(u) {
  if (u == null) return "";
  const d = new Date(u * 1000);
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function daysInMonthFromUnix(u) {
  const d = new Date(u * 1000);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function dayOfMonthFromUnix(u) { 
  return new Date(u * 1000).getDate(); 
}

/* ========== Data normalize ========== */
const EMOJI = { 
  experience: "💼", 
  competition: "🏆", 
  project: "🧪", 
  certificate: "📜", 
  course: "📚" 
};

const TYPE_COLOR = {
  experience: "#38bdf8",
  competition: "#e879f9",
  project: "#34d399",
  certificate: "#fbbf24",
  course: "#a78bfa",
};

const TYPE_LABEL = {
  experience: "Experience",
  competition: "Competition",
  project: "Project",
  certificate: "Certificate",
  course: "Course",
};

function normalizeEvents({ experience, competitions, certificates, projects, courses }) {
  const out = [];
  const nowU = Math.floor(Date.now() / 1000);

  (experience || []).forEach((e, i) => {
    const s = toUnix(e?.start);
    const present = !!e?.present;
    const eU = toUnix(e?.end) ?? (present ? nowU : null);
    if (!s && !eU) return;
    const startU = s ?? eU, endU = eU ?? s;
    out.push({
      id: `exp-${i}`, type: "experience",
      title: e?.title?.en || "Experience",
      startU, endU, present,
      meta: { organization: e?.organization || "", team: e?.team || "", location: e?.location || "" }
    });
  });

  (competitions || []).forEach((c, i) => {
    const s = toUnix(c?.start);
    const present = !!c?.present;
    const eU = toUnix(c?.end) ?? (present ? nowU : null);
    if (!s && !eU) return;
    const startU = s ?? eU, endU = eU ?? s;
    out.push({
      id: `cmp-${i}`, type: "competition",
      title: c?.name?.en || c?.title?.en || "Competition",
      startU, endU, present,
      meta: { organization: c?.organization || c?.organizer || "", team: c?.team || c?.team_name || "" }
    });
  });

  (projects || []).forEach((p, i) => {
    const s = toUnix(p?.start_unix) ?? toUnix(p?.start);
    const present = !!p?.present;
    const eU = toUnix(p?.end_unix) ?? toUnix(p?.end) ?? (present ? nowU : null);
    if (!s && !eU) return;
    const startU = s ?? eU, endU = eU ?? s;
    out.push({
      id: `prj-${i}`, type: "project",
      title: p?.title?.en || "Project",
      startU, endU, present,
      meta: { organization: p?.organization || "", team: p?.team || "" }
    });
  });

  (certificates || []).forEach((c, i) => {
    const when = toUnix(c?.issued_at_unix) ?? toUnix(c?.issued_at_iso) ?? toUnix(c?.issued_at);
    if (!when) return;
    out.push({
      id: `crt-${i}`, type: "certificate",
      title: c?.name?.en || "Certificate",
      startU: when, endU: when, present: false,
      meta: { organization: c?.issuer || "" }
    });
  });

  (courses || []).forEach((c, i) => {
    const when = toUnix(c?.date);
    if (!when) return;
    out.push({
      id: `crs-${i}`, type: "course",
      title: c?.name || "Course", 
      startU: when, endU: when, present: false,
      meta: { organization: c?.issuer || "" }
    });
  });

  out.forEach((ev) => {
    if (ev.startU && ev.endU && ev.startU > ev.endU) { 
      const t = ev.startU; 
      ev.startU = ev.endU; 
      ev.endU = t; 
    }
  });
  return out;
}

/* ========== Geometry & style ========== */
const MPR = 6;
const CELL_W = 170;
const ROW_H = 180;
const MARGIN_X = 32, MARGIN_Y = 28;
const RAIL_W = 22;
const BAND_W = 18;
const TICK_H = 14;
const STACK_OFFSET = 12;

function posOfMonth(index) {
  const row = Math.floor(index / MPR);
  const col = index % MPR;
  const rtl = row % 2 === 1;
  const vCol = rtl ? (MPR - 1 - col) : col;
  const left = MARGIN_X + vCol * CELL_W;
  const center = left + CELL_W / 2;
  const right = left + CELL_W;
  const yCenter = MARGIN_Y + row * ROW_H + ROW_H / 2;
  return { row, rtl, left, center, right, yCenter };
}

const rowStartX = (r) => (r % 2 === 1 ? (MARGIN_X + MPR * CELL_W) : MARGIN_X);
const rowEndX = (r) => (r % 2 === 1 ? MARGIN_X : (MARGIN_X + MPR * CELL_W));

function buildMonthsRange(events) {
  const baseStartY = 2024, baseEndY = 2025;
  const years = events.flatMap((e) => [
    new Date(e.startU * 1000).getFullYear(), 
    new Date(e.endU * 1000).getFullYear()
  ]).filter((y) => !Number.isNaN(y));
  
  const startU = uJan(Math.min(baseStartY, years.length ? Math.min(...years) : baseStartY));
  const endU = uDecEnd(Math.max(baseEndY, years.length ? Math.max(...years) : baseEndY));

  const months = [];
  for (let u = startU; u <= endU; u = addMonthsU(u, 1)) {
    months.push({ u, key: monthKey(u), label: monthLabel(u) });
  }
  return months;
}

function xForDate(u, months) {
  const idxMap = new Map(months.map((m, i) => [m.key, i]));
  const key = monthKey(startOfMonthU(u));
  const i = idxMap.get(key);
  if (i == null) return { x: null, row: 0, rtl: false, left: 0, right: 0, y: 0 };
  
  const { row, rtl, left, right, yCenter } = posOfMonth(i);
  const day = dayOfMonthFromUnix(u);
  const days = daysInMonthFromUnix(u);
  const frac = Math.max(0, Math.min(1, day / Math.max(1, days)));
  const x = rtl ? right - frac * CELL_W : left + frac * CELL_W;
  return { x, row, rtl, left, right, y: yCenter };
}

function laneOffsetFromIndex(idx) {
  if (idx === 0) return 0;
  const k = Math.ceil(idx / 2);
  const sign = idx % 2 === 1 ? -1 : +1;
  return sign * k * STACK_OFFSET;
}

/* ========== Demo Data ========== */
const demoData = {
  experience: [
    {
      title: { en: "Senior Software Engineer" },
      organization: "TechCorp Inc.",
      team: "Frontend Team",
      start: "2023-03-15",
      present: true
    },
    {
      title: { en: "Software Developer" },
      organization: "StartupXYZ",
      start: "2022-01-10",
      end: "2023-02-28"
    }
  ],
  projects: [
    {
      title: { en: "AI Dashboard" },
      organization: "Personal",
      start: "2024-01-15",
      end: "2024-06-30"
    },
    {
      title: { en: "Mobile App" },
      start: "2023-09-01",
      end: "2023-12-15"
    }
  ],
  competitions: [
    {
      name: { en: "Hackathon 2024" },
      organizer: "Tech University",
      start: "2024-03-20",
      end: "2024-03-22"
    }
  ],
  certificates: [
    {
      name: { en: "AWS Solutions Architect" },
      issuer: "Amazon Web Services",
      issued_at: "2023-08-15"
    },
    {
      name: { en: "React Developer Certificate" },
      issuer: "Meta",
      issued_at: "2024-02-10"
    }
  ],
  courses: [
    {
      name: "Advanced JavaScript",
      issuer: "Online Academy",
      date: "2023-05-20"
    }
  ]
};

/* ========== Component ========== */
export default function TimelineSection({ data = demoData }) {
  const events = useMemo(() => normalizeEvents(data || {}), [data]);
  const months = useMemo(() => buildMonthsRange(events), [events]);

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
    return (
      <Section 
        id="timeline" 
        title="Timeline" 
        subtitle="No dated events to show yet." 
      />
    );
  }

  const rows = Math.ceil(months.length / MPR);
  const width = MARGIN_X * 2 + MPR * CELL_W;
  const height = MARGIN_Y * 2 + rows * ROW_H;

  const idxMap = new Map(months.map((m, i) => [m.key, i]));
  const idxFromU = (u) => idxMap.get(monthKey(startOfMonthU(u)));

  const H = [];
  const V_raw = [];
  const P_raw = [];

  events.forEach((ev) => {
    const a = idxFromU(ev.startU);
    const b = idxFromU(ev.endU);
    if (a == null && b == null) return;
    
    let i0 = a ?? 0, i1 = b ?? months.length - 1;
    if (i0 > i1) [i0, i1] = [i1, i0];

    const sameMonth = i0 === i1;
    const firstRow = Math.floor(i0 / MPR);
    const lastRow = Math.floor(i1 / MPR);

    for (let r = firstRow; r <= lastRow; r++) {
      const rowStart = r * MPR;
      const rowEnd = Math.min(rowStart + MPR - 1, months.length - 1);
      const sIdx = Math.max(i0, rowStart);
      const eIdx = Math.min(i1, rowEnd);

      const startX = xForDate(ev.startU, months).x ?? posOfMonth(sIdx).left;
      const endX = xForDate(ev.endU, months).x ?? posOfMonth(eIdx).right;

      if (sameMonth) {
        const { x, row } = xForDate(ev.startU, months);
        P_raw.push({ id: ev.id, x, row, event: ev });
      } else {
        let x1, x2, isLastSeg = false, dir = 0;

        if (r === firstRow && r === lastRow) {
          x1 = startX; x2 = endX;
          dir = x2 >= x1 ? 1 : -1;
          isLastSeg = true;
        } else if (r === firstRow) {
          x1 = startX; x2 = rowEndX(r);
          dir = x2 >= x1 ? 1 : -1;
        } else if (r === lastRow) {
          x1 = rowStartX(r); x2 = endX;
          dir = x2 >= x1 ? 1 : -1;
          isLastSeg = true;
        } else {
          x1 = rowStartX(r); x2 = rowEndX(r);
          dir = x2 >= x1 ? 1 : -1;
        }

        H.push({ id: ev.id, row: r, x1, x2, event: ev, isLastSeg, dir });

        if (!isLastSeg) {
          const x = rowEndX(r);
          V_raw.push({ id: ev.id, x, rowFrom: r, rowTo: r + 1, event: ev });
        }
      }
    }
  });

  const byRow = Array.from({ length: rows }, () => []);
  H.forEach((s) => byRow[s.row].push(s));

  const segLane = new Map();
  const laneByIdRow = new Map();

  for (let r = 0; r < rows; r++) {
    const segs = byRow[r].sort((a, b) => a.x1 - b.x1);
    const laneEnds = [];
    let maxLane = -1;

    for (const s of segs) {
      let lane = -1;
      for (let L = 0; L <= laneEnds.length; L++) {
        if (laneEnds[L] == null || s.x1 >= (laneEnds[L] + 2)) { 
          lane = L; 
          break; 
        }
      }
      if (lane === -1) lane = laneEnds.length;
      
      laneEnds[lane] = Math.max(laneEnds[lane] ?? -Infinity, s.x2);
      segLane.set(s, lane);
      laneByIdRow.set(`${s.id}#${s.row}`, lane);
      if (lane > maxLane) maxLane = lane;
    }
  }

  const railY = (row) => MARGIN_Y + row * ROW_H + ROW_H / 2;
  const laneY = (row, lane) => railY(row) + laneOffsetFromIndex(lane);

  const V = V_raw.map((v) => {
    const laneFrom = laneByIdRow.get(`${v.id}#${v.rowFrom}`) ?? 0;
    const laneTo = laneByIdRow.get(`${v.id}#${v.rowTo}`) ?? 0;
    return { ...v, y1: laneY(v.rowFrom, laneFrom), y2: laneY(v.rowTo, laneTo) };
  });

  const P = [];
  const clusters = new Map();
  const OFFSETS = [0, -10, +10, -20, +20, -30, +30];

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

  const labelByEvent = new Map();
  {
    const segsWithY = H.map((s) => ({
      ...s, y: laneY(s.row, segLane.get(s) ?? 0),
    }));
    const byId = new Map();
    segsWithY.forEach((s) => { 
      if (!byId.has(s.id)) byId.set(s.id, []); 
      byId.get(s.id).push(s); 
    });
    
    byId.forEach((arr, id) => {
      let sumW = 0, sumX = 0, sumY = 0;
      arr.forEach((s) => { 
        const w = Math.abs(s.x2 - s.x1); 
        sumW += w; 
        sumX += ((s.x1 + s.x2) / 2) * w; 
        sumY += s.y * w; 
      });
      if (sumW > 0) {
        labelByEvent.set(id, { x: sumX / sumW, y: sumY / sumW + 18 });
      }
    });
  }

  const openMonthPanel = (index) => {
    const mStart = months[index].u;
    const mEnd = endOfMonthU(months[index].u);
    const items = events
      .filter((ev) => ev.endU >= mStart && ev.startU <= mEnd)
      .sort((a, b) => a.startU - b.startU);
    setOpenMonth({ index, items });
  };

  const closeMonthPanel = () => setOpenMonth(null);
  const openEventPanel = (ev) => setSelectedEvent(ev);
  const closeEventPanel = () => setSelectedEvent(null);

  const renderTooltip = () => {
    if (!hoverState) return null;
    const ev = hoverState.ev;
    const col = TYPE_COLOR[ev.type] || "#fff";
    const clean = (t) => (t && String(t).trim().length ? String(t).trim() : null);

    const lines = [
      `${EMOJI[ev.type] || "•"} ${TYPE_LABEL[ev.type]}`,
      clean(ev.title),
      clean(ev.meta?.team),
      clean(ev.meta?.organization),
      ev.startU === ev.endU
        ? `${fmtDate(ev.startU)}`
        : `${fmtDate(ev.startU)} → ${ev.present ? "Present" : fmtDate(ev.endU)}`
    ].filter(Boolean);

    const w = Math.min(460, Math.max(240, 28 + 7 * Math.max(...lines.map((t) => t.length))));
    const h = 16 + 22 * lines.length + 12;
    const x = Math.max(8, Math.min(width - w - 8, hoverState.x - w / 2));
    const upY = hoverState.y - RAIL_W - 18 - h;
    const downY = hoverState.y + RAIL_W + 18;
    const y = upY > 8 ? upY : downY;

    return (
      <g className="pointer-events-none">
        <rect x={x + 2} y={y + 3} width={w} height={h} rx="12" fill="rgba(0,0,0,0.35)" />
        <rect x={x} y={y} width={w} height={h} rx="12" fill="#0f172a" opacity="0.98" stroke={col} strokeOpacity="0.6" />
        <rect x={x} y={y} width="7" height={h} rx="12" fill={col} opacity="0.95" />
        {lines.map((t, i) => (
          <text key={i} x={x + 16} y={y + 22 + 18 * i}
                fill="#fff" fontSize={i <= 1 ? 13 : 12} fontWeight={i <= 1 ? 700 : 500}>
            {t}
          </text>
        ))}
        <line x1={hoverState.x} y1={hoverState.y}
              x2={hoverState.x} y2={y > hoverState.y ? y : y + h}
              stroke={col} strokeWidth="2" />
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Section 
        id="timeline" 
        title="Timeline" 
        subtitle="Six months per row • second snake appears only on overlaps"
      >
        <div className="relative w-full overflow-x-auto">
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            width="100%" 
            height={Math.max(480, height)} 
            role="img" 
            aria-label="Serpentine timeline"
            className="bg-slate-900"
          >
            {Array.from({ length: rows }).map((_, r) => {
              const xL = MARGIN_X, xR = MARGIN_X + MPR * CELL_W;
              const [xs, xe] = r % 2 === 1 ? [xR, xL] : [xL, xR];
              const y = railY(r);
              return (
                <g key={`rail-${r}`}>
                  <line 
                    x1={xs} y1={y} x2={xe} y2={y}
                    stroke="rgba(255,255,255,0.22)" 
                    strokeWidth={RAIL_W} 
                    strokeLinecap="round" 
                  />
                  {r < rows - 1 && (
                    <line 
                      x1={xe} y1={y} x2={xe} y2={railY(r + 1)}
                      stroke="rgba(255,255,255,0.22)" 
                      strokeWidth={RAIL_W} 
                      strokeLinecap="round" 
                    />
                  )}
                </g>
              );
            })}

            {months.map((m, i) => {
              const { left, center, yCenter } = posOfMonth(i);
              const labelY = yCenter - RAIL_W - 16;
              const rectY = yCenter - (RAIL_W + 24);
              return (
                <g key={`m-${m.key}`} className="cursor-pointer" onClick={() => openMonthPanel(i)}>
                  <rect 
                    x={left} y={rectY} width={CELL_W} height={RAIL_W + 48} 
                    fill="transparent" 
                  />
                  <line 
                    x1={center} y1={yCenter - TICK_H / 2} 
                    x2={center} y2={yCenter + TICK_H / 2}
                    stroke="rgba(255,255,255,0.5)" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                  />
                  <text 
                    x={center} y={labelY} 
                    textAnchor="middle" 
                    fontSize="12" 
                    fill="rgba(255,255,255,0.85)"
                  >
                    {m.label}
                  </text>
                </g>
              );
            })}

            {[...H].sort((a, b) => {
              const la = (segLane.get(a) ?? 0), lb = (segLane.get(b) ?? 0);
              const ya = laneY(a.row, la), yb = laneY(b.row, lb);
              return ya - yb || a.x1 - b.x1;
            }).map((s, i) => {
              const col = TYPE_COLOR[s.event.type] || "white";
              const lane = segLane.get(s) ?? 0;
              const y = laneY(s.row, lane);
              const anchorX = (s.x1 + s.x2) / 2;
              const isLast = s.isLastSeg && s.event.present;

              return (
                <g key={`seg-${i}`} className="cursor-pointer"
                   onMouseEnter={() => setHoverState({ x: anchorX, y, ev: s.event })}
                   onMouseLeave={() => setHoverState(null)}
                   onClick={() => openEventPanel(s.event)}>
                  <line 
                    x1={s.x1} y1={y} x2={s.x2} y2={y}
                    stroke={col} 
                    strokeWidth={BAND_W} 
                    strokeLinecap="round" 
                    opacity="0.97" 
                  />
                  {isLast && (
                    <path
                      d={s.dir >= 0
                          ? `M ${s.x2} ${y} l 10 -6 l 0 12 z`
                          : `M ${s.x2} ${y} l -10 -6 l 0 12 z`}
                      fill={col} 
                      opacity="0.95"
                    />
                  )}
                </g>
              );
            })}

            {[...labelByEvent.entries()].map(([id, L]) => {
              const ev = events.find((e) => e.id === id);
              if (!ev) return null;
              return (
                <text 
                  key={`lbl-${id}`} 
                  x={L.x} y={L.y} 
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

            {V.map((v, i) => {
              const col = TYPE_COLOR[v.event.type] || "white";
              const anchorX = v.x, anchorY = (v.y1 + v.y2) / 2;
              return (
                <g key={`v-${i}`} className="cursor-pointer"
                   onMouseEnter={() => setHoverState({ x: anchorX, y: anchorY, ev: v.event })}
                   onMouseLeave={() => setHoverState(null)}
                   onClick={() => openEventPanel(v.event)}>
                  <line 
                    x1={v.x} y1={v.y1} x2={v.x} y2={v.y2}
                    stroke={col} 
                    strokeWidth={BAND_W} 
                    strokeLinecap="round" 
                    opacity="0.97" 
                  />
                </g>
              );
            })}

            {P.map((p, i) => {
              const col = TYPE_COLOR[p.event.type] || "white";
              const r = BAND_W / 2;
              return (
                <g key={`pt-${i}`} className="cursor-pointer"
                   onMouseEnter={() => setHoverState({ x: p.x, y: p.y, ev: p.event })}
                   onMouseLeave={() => setHoverState(null)}
                   onClick={() => openEventPanel(p.event)}>
                  <circle cx={p.x} cy={p.y} r={r} fill={col} opacity="0.97" />
                </g>
              );
            })}

            {renderTooltip()}
          </svg>

          {/* Month Panel */}
          {openMonth && (
            <div className="month-panel absolute bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl"
                 style={{ 
                   left: posOfMonth(openMonth.index).center,
                   top: railY(Math.floor(openMonth.index / MPR)) - 100,
                   transform: 'translateX(-50%)',
                   minWidth: '200px',
                   zIndex: 50
                 }}>
              <button className="absolute top-2 right-2 text-white" onClick={closeMonthPanel}>✕</button>
              <h3 className="text-white font-bold mb-2">
                {monthLabel(months[openMonth.index].u)}
              </h3>
              <ul className="text-white text-sm">
                {openMonth.items.map((item, i) => (
                  <li key={i} className="mb-1">
                    {EMOJI[item.type]} {item.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Event Panel */}
          {selectedEvent && (
            <div className="event-panel absolute bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl"
                 style={{
                   left: '50%',
                   top: '50%',
                   transform: 'translate(-50%, -50%)',
                   minWidth: '300px',
                   zIndex: 50
                 }}>
              <button className="absolute top-2 right-2 text-white" onClick={closeEventPanel}>✕</button>
              <h3 className="text-white font-bold mb-2">
                {EMOJI[selectedEvent.type]} {TYPE_LABEL[selectedEvent.type]}
              </h3>
              <p className="text-white">{selectedEvent.title}</p>
              {selectedEvent.meta.organization && (
                <p className="text-gray-400">Organization: {selectedEvent.meta.organization}</p>
              )}
              {selectedEvent.meta.team && (
                <p className="text-gray-400">Team: {selectedEvent.meta.team}</p>
              )}
              <p className="text-gray-400">
                {selectedEvent.startU === selectedEvent.endU
                  ? fmtDate(selectedEvent.startU)
                  : `${fmtDate(selectedEvent.startU)} → ${selectedEvent.present ? 'Present' : fmtDate(selectedEvent.endU)}`}
              </p>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}