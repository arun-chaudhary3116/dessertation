import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ActualPoint, FuturePrediction } from "@/lib/predict-api";

interface Props {
  metric: "temperature" | "humidity";
  unit: string;
  actual: ActualPoint[];
  future: FuturePrediction[];
  color: string;
}

const fmt = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export function ActualVsPredictedChart({ metric, unit, actual, future, color }: Props) {
  const lastTs = actual.length ? new Date(actual[actual.length - 1].timestamp).getTime() : Date.now();
  const futureKey = metric === "temperature" ? "predicted_temperature" : "predicted_humidity";

  // merge series for chart
  const merged = [
    ...actual.map((a) => ({
      label: fmt(a.timestamp),
      actual: a[metric],
      predicted: null as number | null,
    })),
    ...future.map((f) => ({
      label: fmt(new Date(lastTs + f.step * 60_000).toISOString()) + " ★",
      actual: null as number | null,
      predicted: f[futureKey],
    })),
  ];

  return (
    <div className="rounded-2xl bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold capitalize">{metric}: actual vs predicted</h3>
        <span className="text-xs text-muted-foreground">Next {future.length} min forecast</span>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={48} />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "0.75rem",
                fontSize: 12,
              }}
              formatter={(v: any, name: any) => (v == null ? ["—", name] : [`${v}${unit}`, name])}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="actual" stroke={color} strokeWidth={2.5} dot={false} name="Actual" connectNulls />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke={color}
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={{ r: 3, stroke: color, fill: "var(--background)" }}
              name="Predicted"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
