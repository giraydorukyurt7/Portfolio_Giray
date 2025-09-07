// src/lib/utils.js
// Minimal utilities used across the app (with robust date helpers)

// === classnames ===
export const cn = (...classes) => classes.filter(Boolean).join(" ");

// === safe deep getter ===
export const safeGet = (obj, path, fallback = "") => {
  try {
    const val = String(path)
      .split(".")
      .reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
    return val ?? fallback;
  } catch {
    return fallback;
  }
};

// === base asset path ===
export const asset = (p) => {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const rel = String(p || "").replace(/^\/*/, "");
  return `${base}/${rel}`;
};

// === resolve public/ or remote assets ===
export const resolveAsset = (p) => {
  if (!p) return "";
  const s = String(p);
  if (/^https?:\/\//i.test(s)) return s;          // remote
  if (/^[a-zA-Z]:\\/.test(s)) return "";          // Windows local path -> not loadable in browser
  return asset(s.replace(/^\/*/, ""));            // public/
};

// === pick first defined & non-empty ===
export const first = (...vals) => vals.find((v) => v != null && v !== "") ?? "";

/* =============================================================================
   Date helpers (kept for backward compatibility, but FIXED)
   - Accepts: YYYY, YYYY-MM, YYYY/MM, YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY, D/M/YYYY
   - Returns TR short month names consistently (Oca, Şub, ...).
   ========================================================================== */

const MONTHS_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

// internal: parse flexible input into { y, m|null, d|null } or null
function parseToYMD(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;

  // D/M/YYYY or DD/MM/YYYY (sep: / . -)
  let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const y = parseInt(m[3], 10);
    if (mo >= 1 && mo <= 12) return { y, m: mo, d };
  }

  // YYYY-M-D or YYYY/M/D (day optional)
  m = s.match(/^(\d{4})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{1,2}))?$/);
  if (m) {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const d = m[3] ? parseInt(m[3], 10) : null;
    if (mo >= 1 && mo <= 12) return { y, m: mo, d };
  }

  // MM/YYYY
  m = s.match(/^(\d{1,2})[\/\-\.](\d{4})$/);
  if (m) {
    const mo = parseInt(m[1], 10);
    const y = parseInt(m[2], 10);
    if (mo >= 1 && mo <= 12) return { y, m: mo, d: null };
  }

  // YYYY
  m = s.match(/^(\d{4})$/);
  if (m) return { y: parseInt(m[1], 10), m: null, d: null };

  return null;
}

// Backward-compatible YM formatter (TR)
export function formatYM(input) {
  const p = parseToYMD(input);
  if (!p) return "";
  if (p.m == null) return String(p.y);
  return `${MONTHS_TR[p.m - 1]} ${p.y}`;
}

// Flexible full date -> "DD Mon YYYY" (TR month short)
export function formatDate(input) {
  const p = parseToYMD(input);
  if (!p) return "";
  if (p.d && p.m) {
    const dd = String(p.d).padStart(2, "0");
    return `${dd} ${MONTHS_TR[p.m - 1]} ${p.y}`;
  }
  // fall back to YM
  return formatYM(input);
}

// === fetch JSON helper ===
export async function fetchJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}
