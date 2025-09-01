import { useEffect, useState, useCallback } from "react";

/**
 * public/content altındaki json'ları çeker.
 * BASE_URL (Vite) dikkate alınır: local dev'de "/" – GH Pages'de "/<repo>/" olur.
 * İlk yol çalışmazsa /content/... ve relative "content/..." fallback denenir.
 */
export default function usePortfolioContent() {
  const [data, setData] = useState({
    info: null,
    stack: [],
    experience: [],
    competitions: [],
    projects: [],
    certificates: [],
    courses: [],
    socials: [],            // <-- eklendi
  });
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const withBase = useCallback((p) => {
    const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "/");
    return `${base}${String(p).replace(/^\/+/, "")}`;
  }, []);

  const fetchWithFallback = useCallback(async (name) => {
    const candidates = [
      withBase(`content/${name}.json`), // en doğrusu
      `/content/${name}.json`,          // kökten
      `content/${name}.json`,           // relative
    ];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) return await res.json();
      } catch (_) {}
    }
    return null;
  }, [withBase]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      const names = [
        "info",
        "stack",
        "experience",
        "competitions",
        "projects",
        "certificates",
        "courses",
        "socials",         // <-- eklendi
      ];
      const results = await Promise.all(names.map((n) => fetchWithFallback(n)));

      if (!alive) return;

      const [
        info,
        stack,
        experience,
        competitions,
        projects,
        certificates,
        courses,
        socials,
      ] = results;

      setData({
        info: info ?? null,
        stack: Array.isArray(stack) ? stack : [],
        experience: Array.isArray(experience) ? experience : [],
        competitions: Array.isArray(competitions) ? competitions : [],
        projects: Array.isArray(projects) ? projects : [],
        certificates: Array.isArray(certificates) ? certificates : [],
        courses: Array.isArray(courses) ? courses : [],
        socials: Array.isArray(socials) ? socials : [],     // <-- eklendi
      });
      setError(null);
      setLoading(false);
    })().catch((e) => {
      if (!alive) return;
      setError(e);
      setLoading(false);
    });

    return () => { alive = false; };
  }, [fetchWithFallback]);

  return { ...data, loading, error };
}
