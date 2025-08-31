// src/hooks/usePortfolioContent.js
// FIX: useState/useEffect kesinlikle import ediliyor
import React, { useEffect, useState } from "react";
import { asset, fetchJSON } from "../lib/utils";

export default function usePortfolioContent() {
  const [state, setState] = useState({
    info: null,
    projects: [],
    experience: [],
    competitions: [],
    certificates: [],
    socials: [],
    stack: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [
          info,
          projects,
          experience,
          competitions,
          certificates,
          socials,
          stack,
        ] = await Promise.all([
          fetchJSON(asset("content/info.json")).catch(() => null),
          fetchJSON(asset("content/projects.json")).catch(() => []),
          fetchJSON(asset("content/experience.json")).catch(() => []),
          fetchJSON(asset("content/competitions.json")).catch(() => []),
          fetchJSON(asset("content/certificates.json")).catch(() => []),
          fetchJSON(asset("content/socials.json")).catch(() => []),
          fetchJSON(asset("content/stack.json")).catch(() => []),
        ]);
        if (!alive) return;
        setState({
          info,
          projects,
          experience,
          competitions,
          certificates,
          socials,
          stack,
          loading: false,
          error: null,
        });
      } catch (e) {
        if (!alive) return;
        setState((s) => ({
          ...s,
          loading: false,
          error: e?.message || "Failed to load content.",
        }));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
