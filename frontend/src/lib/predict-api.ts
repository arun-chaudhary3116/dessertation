import { useEffect, useState } from "react";
import { getApiUrl } from "./sensor-api";

export type FuturePrediction = {
  step: number;
  predicted_temperature: number;
  predicted_humidity: number;
};

export type ActualPoint = {
  timestamp: string;
  temperature: number;
  humidity: number;
};

export type PredictResponse = {
  current: { temperature: number; humidity: number };
  trend: "increasing" | "decreasing" | "stable";
  actual_data: ActualPoint[];
  future_predictions: FuturePrediction[];
};

const baseUrl = () => getApiUrl().replace(/\/data\/?$/, "");

export function usePredictions(intervalMs = 15000) {
  const [data, setData] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchOnce = async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5000);
        const res = await fetch(`${baseUrl()}/predict`, { signal: ctrl.signal });
        clearTimeout(t);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as PredictResponse;
        if (cancelled) return;
        setData(json);
        setError(null);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOnce();
    const id = setInterval(fetchOnce, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return { data, error, loading };
}

export type HistoryRow = {
  id: number;
  temperature: number;
  humidity: number;
  gas: number;
  timestamp: string;
};

export type HistoryResponse = {
  rows: HistoryRow[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

const normalizeRows = (json: any): HistoryRow[] => {
  const arr = Array.isArray(json) ? json : json?.rows;
  if (!Array.isArray(arr)) return [];
  return arr.map((r: any, i: number) =>
    Array.isArray(r)
      ? {
          id: r[0] ?? i,
          temperature: Number(r[1]),
          humidity: Number(r[2]),
          gas: Number(r[3]),
          timestamp: String(r[4] ?? ""),
        }
      : {
          id: Number(r.id ?? i),
          temperature: Number(r.temperature),
          humidity: Number(r.humidity),
          gas: Number(r.gas ?? r.gas_value),
          timestamp: String(r.timestamp ?? ""),
        }
  );
};

export function useHistory(opts: { page: number; pageSize: number; sort: "asc" | "desc"; intervalMs?: number }) {
  const { page, pageSize, sort, intervalMs = 10000 } = opts;
  const [resp, setResp] = useState<HistoryResponse>({ rows: [], total: 0, page: 1, page_size: pageSize, pages: 1 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchOnce = async () => {
      setLoading(true);
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 6000);
        // Try the dedicated /history endpoint first
        const url = `${baseUrl()}/history?page=${page}&page_size=${pageSize}&sort=${sort}`;
        let res = await fetch(url, { signal: ctrl.signal });
        let json: any;
        if (res.ok) {
          json = await res.json();
        } else {
          // Fallback to /data
          res = await fetch(getApiUrl(), { signal: ctrl.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          json = await res.json();
        }
        clearTimeout(t);
        if (cancelled) return;
        if (json && typeof json === "object" && !Array.isArray(json) && "rows" in json) {
          setResp({
            rows: normalizeRows(json.rows),
            total: Number(json.total ?? 0),
            page: Number(json.page ?? page),
            page_size: Number(json.page_size ?? pageSize),
            pages: Number(json.pages ?? 1),
          });
        } else {
          // Plain array — paginate/sort client-side as a fallback
          let rows = normalizeRows(json);
          rows = rows.sort((a, b) =>
            sort === "asc"
              ? a.timestamp.localeCompare(b.timestamp)
              : b.timestamp.localeCompare(a.timestamp)
          );
          const total = rows.length;
          const pages = Math.max(1, Math.ceil(total / pageSize));
          const start = (page - 1) * pageSize;
          setResp({ rows: rows.slice(start, start + pageSize), total, page, page_size: pageSize, pages });
        }
        setError(null);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOnce();
    const id = setInterval(fetchOnce, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [page, pageSize, sort, intervalMs]);

  return { ...resp, error, loading };
}
