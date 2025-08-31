// src/lib/utils.js
// Small utilities used across the app (date parsing, asset resolving, etc.)

export const cn = (...classes) => classes.filter(Boolean).join(" ");

export const safeGet = (obj, path, fallback = "") => {
  try {
    const val = path
      .split(".")
      .reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
    return val ?? fallback;
  } catch {
    return fallback;
  }
};

// Parse YYYY, YYYY-MM, or YYYY/MM -> localized Mon YYYY
export function formatYM(input) {
  if (!input) return "";
  const s = String(input).trim();
  if (!s) return "";
  const norm = s.replace(/\//g, "-");
  const parts = norm.split("-").filter(Boolean);
  const year = parseInt(parts[0], 10);
  const month = parts[1] ? Math.max(1, Math.min(12, parseInt(parts[1], 10))) : 1;
  if (!Number.isFinite(year)) return s;
  try {
    const dt = new Date(year, month - 1, 1);
    if (parts.length === 1) return dt.toLocaleString(undefined, { year: "numeric" });
    return dt.toLocaleString(undefined, { month: "short", year: "numeric" });
  } catch {
    return s;
  }
}

// Parse flexible date strings (YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY, etc.) -> "15 Aug 2025"
export function formatDate(input) {
  if (!input) return "";
  const txt = String(input).trim();
  if (!txt) return "";
  const parts = txt.split(/[^0-9]/).filter(Boolean).map((n) => parseInt(n, 10));
  if (parts.length < 3) {
    // fallback to YM format
    return formatYM(txt);
  }
  let y, m, d;
  if (String(parts[0]).length === 4) {
    // year-first
    [y, m, d] = parts;
  } else {
    // day-first
    [d, m, y] = parts;
  }
  if (!y || !m || !d) return txt;
  const dt = new Date(y, Math.max(1, Math.min(12, m)) - 1, d);
  try {
    return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return `${String(d).padStart(2, "0")} ${String(m).padStart(2, "0")} ${y}`;
  }
}

// prepend base path (vite.config.js -> base)
export const asset = (p) => {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const rel = String(p || "").replace(/^\/*/, "");
  return `${base}/${rel}`;
};

// If http(s) keep; if Windows path, ignore (browser cannot read C:\ files);
// else treat as relative to public/
export const resolveAsset = (p) => {
  if (!p) return "";
  const s = String(p);
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[a-zA-Z]:\\/.test(s)) return ""; // Windows local path -> not loadable
  return asset(s.replace(/^\/*/, ""));
};

// Pick first defined value from a list
export const first = (...vals) => vals.find((v) => v != null && v !== "") ?? "";

export async function fetchJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}
