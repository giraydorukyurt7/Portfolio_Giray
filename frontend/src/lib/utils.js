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
  // normalize separators
  const norm = s.replace(/\//g, "-");
  const parts = norm.split("-").filter(Boolean);
  // parts: [YYYY] or [YYYY, MM]
  const year = parseInt(parts[0], 10);
  const month = parts[1] ? Math.max(1, Math.min(12, parseInt(parts[1], 10))) : 1;
  if (!Number.isFinite(year)) return s;
  try {
    const dt = new Date(year, month - 1, 1);
    // if only year provided
    if (parts.length === 1) return dt.toLocaleString(undefined, { year: "numeric" });
    return dt.toLocaleString(undefined, { month: "short", year: "numeric" });
  } catch {
    return s;
  }
}

// prepend base path (vite.config.js -> base)
// e.g. asset("content/foo.json") -> "/Portfolio_Giray/content/foo.json" when BASE_URL=/Portfolio_Giray
export const asset = (p) => {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const rel = String(p || "").replace(/^\/*/, "");
  return `${base}/${rel}`;
};

// If path is http(s) keep, if looks like Windows path, ignore (browser cannot read C:\ files)
// Otherwise treat as relative to public/
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
