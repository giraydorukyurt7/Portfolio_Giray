// src/lib/utils.js
// Small utilities used across the app


export const cn = (...classes) => classes.filter(Boolean).join(" ");


export const safeGet = (obj, path, fallback = "") => {
try {
return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj) ?? fallback;
} catch {
return fallback;
}
};


export const formatYM = (ym) => {
if (!ym) return "";
const [y, m] = String(ym).split("-");
if (!y) return ym;
const dt = new Date(parseInt(y, 10), m ? parseInt(m, 10) - 1 : 0, 1);
try {
return dt.toLocaleString(undefined, { month: "short", year: "numeric" });
} catch {
return `${y}${m ? "-" + m : ""}`;
}
};


// prepend base path (vite.config.js -> base)
// e.g. asset("content/foo.json") -> "/Portfolio_Giray/content/foo.json" when BASE_URL=/Portfolio_Giray
export const asset = (p) => {
const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const rel = String(p).replace(/^\//, "");
return `${base}/${rel}`;
};


// normalize icon/image paths coming from JSON (relative to public/)
export const resolveAsset = (p) => {
if (!p) return "";
const s = String(p);
if (/^https?:\/\//i.test(s)) return s;
return asset(s.replace(/^\//, "")); // relative to public/
};


export async function fetchJSON(path) {
const res = await fetch(path, { cache: "no-store" });
if (!res.ok) throw new Error(`${path} ${res.status}`);
return res.json();
}