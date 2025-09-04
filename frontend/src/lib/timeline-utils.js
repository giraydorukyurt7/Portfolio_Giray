// Utilities for TimelineSection — dates, colors, types, geometry

/* ========== Date helpers ========== */
export function toUnix(x) {
  if (x === 0 || x) {
    if (typeof x === "number") return x > 1e12 ? Math.floor(x / 1000) : x; // ms or s
    if (x instanceof Date) return Math.floor(x.getTime() / 1000);
    const s = String(x).trim();
    if (!s) return null;

    // Y-M-D (e.g., 2025-01-15 or 2025/01/15)
    let m = s.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})$/);
    if (m) {
      const [, yyyy, mm, dd] = m;
      const d = new Date(+yyyy, +mm - 1, +dd);
      return isNaN(d) ? null : Math.floor(d.getTime() / 1000);
    }

    // D-M-Y (e.g., 15/11/2025)
    m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      const d = new Date(+yyyy, +mm - 1, +dd);
      return isNaN(d) ? null : Math.floor(d.getTime() / 1000);
    }

    // Y-M (month-only like 2025/07 -> first day of that month)
    m = s.match(/^(\d{4})[\/.-](\d{1,2})$/);
    if (m) {
      const [, yyyy, mm] = m;
      const d = new Date(+yyyy, +mm - 1, 1);
      return isNaN(d) ? null : Math.floor(d.getTime() / 1000);
    }

    // Year-only
    m = s.match(/^(\d{4})$/);
    if (m) {
      const [, yyyy] = m;
      const d = new Date(+yyyy, 0, 1);
      return Math.floor(d.getTime() / 1000);
    }

    // Fallback (ISO strings etc.)
    const d = new Date(s);
    return isNaN(d) ? null : Math.floor(d.getTime() / 1000);
  }
  return null;
}

export const uJan = (Y) => Math.floor(new Date(Y, 0, 1).getTime() / 1000);
export const uDecEnd = (Y) => Math.floor(new Date(Y, 11, 31, 23, 59, 59).getTime() / 1000);

export function startOfMonthU(u) {
  const d = new Date((u ?? Date.now()) * 1000);
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), 1).getTime() / 1000);
}

export function endOfMonthU(u) {
  const d = new Date((u ?? Date.now()) * 1000);
  return Math.floor(new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime() / 1000);
}

export function addMonthsU(u, k) {
  const d = new Date(u * 1000);
  const nd = new Date(d.getFullYear(), d.getMonth() + k, 1);
  return Math.floor(nd.getTime() / 1000);
}

export function monthKey(u) {
  const d = new Date(u * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(u) {
  const d = new Date(u * 1000);
  const mo = d.toLocaleString("en-US", { month: "short" });
  const yy = String(d.getFullYear()).slice(-2);
  return `${mo} ’${yy}`; // Jan ’24 format
}

export function fmtDate(u) {
  if (u == null) return "";
  const d = new Date(u * 1000);
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export function daysInMonthFromUnix(u) {
  const d = new Date(u * 1000);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function dayOfMonthFromUnix(u) {
  return new Date(u * 1000).getDate();
}

/* ========== Types / labels / base colors ========== */
export const EMOJI = {
  experience: "💼",
  competition: "🏆",
  project: "🧪",
  certificate: "📜",
  course: "📚",
};

export const TYPE_COLOR = {
  experience: "#38bdf8",
  competition: "#e879f9",
  project: "#34d399",
  certificate: "#fbbf24",
  course: "#a78bfa",
};

export const TYPE_LABEL = {
  experience: "Experience",
  competition: "Competition",
  project: "Project",
  certificate: "Certificate",
  course: "Course",
};

/* ========== Normalize incoming data into events ========== */
export function normalizeEvents({ experience, competitions, certificates, projects, courses }) {
  const out = [];
  const nowU = Math.floor(Date.now() / 1000);

  (experience || []).forEach((e, i) => {
    let s = toUnix(e?.start);
    const present = !!e?.present;
    let eU = toUnix(e?.end);

    // If "present" set but start is in the future, make it a 1-day point at start
    if (present && !eU) eU = nowU;
    if (s && present && s > nowU && !toUnix(e?.end)) {
      eU = s; // clamp to start
    }

    if (!s && !eU) return;
    const startU = s ?? eU;
    const endU = eU ?? s;
    out.push({
      id: `exp-${i}`,
      type: "experience",
      title: e?.title?.en || "Experience",
      startU,
      endU,
      present: present && endU >= nowU && startU <= nowU, // only mark present if actually ongoing now
      meta: { organization: e?.organization || "", team: e?.team || "", location: e?.location || "" },
    });
  });

  (competitions || []).forEach((c, i) => {
    let s = toUnix(c?.start);
    const present = !!c?.present;
    let eU = toUnix(c?.end);

    if (present && !eU) eU = nowU;
    if (s && present && s > nowU && !toUnix(c?.end)) {
      eU = s; // upcoming marked as present -> show as point at start
    }

    if (!s && !eU) return;
    const startU = s ?? eU;
    const endU = eU ?? s;
    out.push({
      id: `cmp-${i}`,
      type: "competition",
      title: c?.name?.en || c?.title?.en || "Competition",
      startU,
      endU,
      present: present && endU >= nowU && startU <= nowU,
      meta: { organization: c?.organization || c?.organizer || "", team: c?.team || c?.team_name || "" },
    });
  });

  (projects || []).forEach((p, i) => {
    let s = toUnix(p?.start_unix) ?? toUnix(p?.start);
    const present = !!p?.present;
    let eU = toUnix(p?.end_unix) ?? toUnix(p?.end);

    if (present && !eU) eU = nowU;
    if (s && present && s > nowU && !toUnix(p?.end)) {
      eU = s;
    }

    if (!s && !eU) return;
    const startU = s ?? eU;
    const endU = eU ?? s;
    out.push({
      id: `prj-${i}`,
      type: "project",
      title: p?.title?.en || "Project",
      startU,
      endU,
      present: present && endU >= nowU && startU <= nowU,
      meta: { organization: p?.organization || "", team: p?.team || "" },
    });
  });

  (certificates || []).forEach((c, i) => {
    const when = toUnix(c?.issued_at_unix) ?? toUnix(c?.issued_at_iso) ?? toUnix(c?.issued_at);
    if (!when) return;
    out.push({
      id: `crt-${i}`,
      type: "certificate",
      title: c?.name?.en || "Certificate",
      startU: when,
      endU: when,
      present: false,
      meta: { organization: c?.issuer || "" },
    });
  });

  (courses || []).forEach((c, i) => {
    const when = toUnix(c?.date);
    if (!when) return;
    out.push({
      id: `crs-${i}`,
      type: "course",
      title: c?.name || "Course",
      startU: when,
      endU: when,
      present: false,
      meta: { organization: c?.issuer || "" },
    });
  });

  // fix reversed intervals if any
  out.forEach((ev) => {
    if (ev.startU && ev.endU && ev.startU > ev.endU) {
      const t = ev.startU; ev.startU = ev.endU; ev.endU = t;
    }
  });
  return out;
}

/* ========== Color helpers (per-event shade) ========== */
export function hexToRgb(hex) {
  let c = hex.replace('#','');
  if (c.length === 3) c = c.split('').map(ch => ch+ch).join('');
  const num = parseInt(c, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
export function rgbToHex({r,g,b}) {
  const h = (n) => n.toString(16).padStart(2,'0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
export function mix(hex1, hex2, t) { // t in [0,1]
  const a = hexToRgb(hex1), b = hexToRgb(hex2);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const b2 = Math.round(a.b + (b.b - a.b) * t);
  return rgbToHex({ r, g, b: b2 });
}
export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function variantColor(baseHex, id) {
  const MAX = 0.18; // +/- 18% mix toward white/black
  const frac = (hashStr(String(id)) % 1000) / 999; // 0..1
  const signed = (frac - 0.5) * 2; // -1..1
  const amt = Math.abs(signed) * MAX;
  return signed >= 0 ? mix(baseHex, '#ffffff', amt) : mix(baseHex, '#000000', amt);
}

/* ========== Geometry & style ========== */
export const MPR = 6; // months per row
export const CELL_W = 170;
export const ROW_H = 180;
export const MARGIN_X = 32, MARGIN_Y = 28;
export const RAIL_W = 22;
export const BAND_W = 18;
export const TICK_H = 14;
export const STACK_OFFSET = 12; // lane offset (px)
export const V_OFF_BASE = 6;  // elbow base offset (px)
export const V_OFF_STEP = 8;  // per-lane extra offset (px)

export function posOfMonth(index) {
  const row = Math.floor(index / MPR);
  const col = index % MPR;
  const rtl = row % 2 === 1;
  const vCol = rtl ? MPR - 1 - col : col;
  const left = MARGIN_X + vCol * CELL_W;
  const center = left + CELL_W / 2;
  const right = left + CELL_W;
  const yCenter = MARGIN_Y + row * ROW_H + ROW_H / 2;
  return { row, rtl, left, center, right, yCenter };
}

export const rowStartX = (r) => (r % 2 === 1 ? MARGIN_X + MPR * CELL_W : MARGIN_X);
export const rowEndX = (r) => (r % 2 === 1 ? MARGIN_X : MARGIN_X + MPR * CELL_W);

export function buildMonthsRange(events) {
  const baseStartY = 2024, baseEndY = 2026; // default window
  const years = events
    .flatMap((e) => [new Date(e.startU * 1000).getFullYear(), new Date(e.endU * 1000).getFullYear()])
    .filter((y) => !Number.isNaN(y));

  const startU = uJan(Math.min(baseStartY, years.length ? Math.min(...years) : baseStartY));
  const endU = uDecEnd(Math.max(baseEndY, years.length ? Math.max(...years) : baseEndY));

  const months = [];
  for (let u = startU; u <= endU; u = addMonthsU(u, 1)) months.push({ u, key: monthKey(u), label: monthLabel(u) });
  return months;
}

export function xForDate(u, months) {
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

// Only open lanes ABOVE center when overlapping
export function laneOffsetFromIndex(idx) { return idx === 0 ? 0 : -idx * STACK_OFFSET; }
