import { useEffect, useState } from "react";

export type Thresholds = {
  tempMax: number;
  tempMin: number;
  humMax: number;
  humMin: number;
  gasMax: number;
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  tempMax: 32,
  tempMin: 10,
  humMax: 75,
  humMin: 25,
  gasMax: 250,
};

const KEY = "env_dashboard_thresholds";

export const loadThresholds = (): Thresholds => {
  if (typeof window === "undefined") return DEFAULT_THRESHOLDS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_THRESHOLDS;
    return { ...DEFAULT_THRESHOLDS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
};

export const saveThresholds = (t: Thresholds) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(t));
  window.dispatchEvent(new CustomEvent("thresholds:changed"));
};

export function useThresholds() {
  const [t, setT] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  useEffect(() => {
    setT(loadThresholds());
    const handler = () => setT(loadThresholds());
    window.addEventListener("thresholds:changed", handler);
    return () => window.removeEventListener("thresholds:changed", handler);
  }, []);
  return t;
}

export type AlertItem = { key: string; label: string; message: string; level: "high" };

export function computeAlerts(
  reading: { temperature: number; humidity: number; gas: number } | undefined,
  th: Thresholds
): AlertItem[] {
  if (!reading) return [];
  const out: AlertItem[] = [];
  if (reading.temperature > th.tempMax)
    out.push({ key: "t-hi", label: "Temperature", message: `Above ${th.tempMax}°C (now ${reading.temperature.toFixed(1)}°C)`, level: "high" });
  if (reading.temperature < th.tempMin)
    out.push({ key: "t-lo", label: "Temperature", message: `Below ${th.tempMin}°C (now ${reading.temperature.toFixed(1)}°C)`, level: "high" });
  if (reading.humidity > th.humMax)
    out.push({ key: "h-hi", label: "Humidity", message: `Above ${th.humMax}% (now ${Math.round(reading.humidity)}%)`, level: "high" });
  if (reading.humidity < th.humMin)
    out.push({ key: "h-lo", label: "Humidity", message: `Below ${th.humMin}% (now ${Math.round(reading.humidity)}%)`, level: "high" });
  if (reading.gas > th.gasMax)
    out.push({ key: "g-hi", label: "Air Quality", message: `Gas above ${th.gasMax} (now ${Math.round(reading.gas)})`, level: "high" });
  return out;
}
