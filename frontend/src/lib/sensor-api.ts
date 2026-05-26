import { useEffect, useRef, useState } from "react";

export type Reading = {
  temperature: number;
  humidity: number;
  gas: number;
  timestamp: string;
};

const DEFAULT_API = "http://localhost:5000/data";
const STORAGE_KEY = "env_dashboard_api_url";

export const getApiUrl = () => {
  if (typeof window === "undefined") return DEFAULT_API;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_API;
};

export const setApiUrl = (url: string) => {
  if (typeof window === "undefined") return;
  if (url) localStorage.setItem(STORAGE_KEY, url);
  else localStorage.removeItem(STORAGE_KEY);
};

// Backend rows: [id, temperature, humidity, gas_value, timestamp]
const normalize = (raw: unknown): Reading[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row): Reading | null => {
      if (Array.isArray(row)) {
        const [, t, h, g, ts] = row;
        return {
          temperature: Number(t),
          humidity: Number(h),
          gas: Number(g),
          timestamp: String(ts ?? new Date().toISOString()),
        };
      }
      if (row && typeof row === "object") {
        const r = row as Record<string, unknown>;
        return {
          temperature: Number(r.temperature),
          humidity: Number(r.humidity),
          gas: Number(r.gas ?? r.gas_value),
          timestamp: String(r.timestamp ?? new Date().toISOString()),
        };
      }
      return null;
    })
    .filter((x): x is Reading => x !== null && Number.isFinite(x.temperature));
};

// Simulated data generator — used when backend is unreachable (e.g. preview env)
let simBase = { t: 23.5, h: 50, g: 110 };
const simulateOne = (): Reading => {
  simBase.t += (Math.random() - 0.5) * 0.6;
  simBase.h += (Math.random() - 0.5) * 1.2;
  simBase.g += (Math.random() - 0.5) * 6;
  simBase.t = Math.max(15, Math.min(40, simBase.t));
  simBase.h = Math.max(20, Math.min(90, simBase.h));
  simBase.g = Math.max(50, Math.min(400, simBase.g));
  return {
    temperature: +simBase.t.toFixed(1),
    humidity: Math.round(simBase.h),
    gas: Math.round(simBase.g),
    timestamp: new Date().toISOString(),
  };
};

const seedSimulated = (n = 40): Reading[] => {
  const out: Reading[] = [];
  const now = Date.now();
  for (let i = n; i > 0; i--) {
    const r = simulateOne();
    r.timestamp = new Date(now - i * 5000).toISOString();
    out.push(r);
  }
  return out;
};

export type SensorState = {
  data: Reading[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  source: "live" | "demo";
};

export function useSensorData(intervalMs = 5000) {
  const [state, setState] = useState<SensorState>({
    data: [],
    loading: true,
    error: null,
    lastUpdated: null,
    source: "live",
  });
  const failsRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const fetchOnce = async () => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(getApiUrl(), { signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rows = normalize(json).reverse(); // backend returns DESC; oldest-first for charts
        if (cancelled) return;
        failsRef.current = 0;
        setState((prev) => ({
          data: rows.length ? rows.slice(-100) : prev.data,
          loading: false,
          error: null,
          lastUpdated: new Date(),
          source: "live",
        }));
      } catch (err) {
        failsRef.current += 1;
        if (cancelled) return;
        // After 2 failed attempts, switch to demo simulator so UI is usable
        if (failsRef.current >= 2) {
          setState((prev) => {
            const seed = prev.data.length ? prev.data : seedSimulated();
            const next = [...seed, simulateOne()].slice(-100);
            return {
              data: next,
              loading: false,
              error: "Backend unreachable — showing simulated demo data.",
              lastUpdated: new Date(),
              source: "demo",
            };
          });
        } else {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: (err as Error).message,
          }));
        }
      }
    };

    fetchOnce();
    const id = setInterval(fetchOnce, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return state;
}
