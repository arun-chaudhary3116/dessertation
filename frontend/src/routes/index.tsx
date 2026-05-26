import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  Cloud,
  Droplets,
  Flame,
  LayoutDashboard,
  LineChart as LineChartIcon,
  Settings2,
  ShieldAlert,
  Sparkles,
  Thermometer,
  Wifi,
  WifiOff,
} from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, History as HistoryIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SensorChart } from "@/components/dashboard/SensorChart";
import { ActualVsPredictedChart } from "@/components/dashboard/ActualVsPredictedChart";
import { ThresholdSettings } from "@/components/dashboard/ThresholdSettings";
import { getApiUrl, setApiUrl, useSensorData, type Reading } from "@/lib/sensor-api";
import { usePredictions } from "@/lib/predict-api";
import { computeAlerts, useThresholds, type Thresholds } from "@/lib/thresholds";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Environmental Monitoring Dashboard" },
      {
        name: "description",
        content:
          "Real-time IoT dashboard for temperature, humidity and air quality with predictive insights and threshold alerts.",
      },
    ],
  }),
});

const tempStatus = (t: number, th: Thresholds) =>
  t >= th.tempMax || t <= th.tempMin ? "high" : t >= th.tempMax - 4 || t <= th.tempMin + 4 ? "moderate" : "normal";
const humStatus = (h: number, th: Thresholds) =>
  h >= th.humMax || h <= th.humMin ? "high" : h >= th.humMax - 8 || h <= th.humMin + 8 ? "moderate" : "normal";
const gasStatus = (g: number, th: Thresholds) =>
  g >= th.gasMax ? "high" : g >= th.gasMax * 0.75 ? "moderate" : "normal";

const predict = (data: Reading[], key: keyof Reading) => {
  if (data.length < 3) return null;
  const recent = data.slice(-12).map((r) => Number(r[key]));
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const trend = recent[recent.length - 1] - recent[0];
  return avg + trend * 0.3;
};

function Dashboard() {
  const { data, loading, error, lastUpdated, source } = useSensorData(5000);
  const th = useThresholds();
  const [active, setActive] = useState<"dashboard" | "analytics" | "predictions">("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiInput, setApiInput] = useState("");
  const lastAlertedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setApiInput(getApiUrl());
  }, []);

  const latest = data[data.length - 1];
  const predTemp = predict(data, "temperature");
  const predHum = predict(data, "humidity");

  const alerts = useMemo(() => computeAlerts(latest, th), [latest, th]);
  const { data: predictData } = usePredictions(15000);
  const emailAlertsActive = alerts.length > 0;

  // Local fallback: build actual+predicted from recent readings if backend /predict is unreachable
  const localPredict = useMemo(() => {
    if (predictData || data.length < 3) return null;
    const recent = data.slice(-20);
    const linReg = (ys: number[]) => {
      const n = ys.length;
      const xs = ys.map((_, i) => i);
      const mx = xs.reduce((a, b) => a + b, 0) / n;
      const my = ys.reduce((a, b) => a + b, 0) / n;
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
      const slope = den === 0 ? 0 : num / den;
      const intercept = my - slope * mx;
      return (x: number) => intercept + slope * x;
    };
    const tFn = linReg(recent.map((r) => r.temperature));
    const hFn = linReg(recent.map((r) => r.humidity));
    const future = Array.from({ length: 5 }, (_, i) => ({
      step: i + 1,
      predicted_temperature: +tFn(recent.length - 1 + (i + 1)).toFixed(2),
      predicted_humidity: +hFn(recent.length - 1 + (i + 1)).toFixed(2),
    }));
    const cur = recent[recent.length - 1];
    const next = future[0].predicted_temperature;
    const trend: "increasing" | "decreasing" | "stable" =
      next > cur.temperature + 0.05 ? "increasing" : next < cur.temperature - 0.05 ? "decreasing" : "stable";
    return {
      current: { temperature: cur.temperature, humidity: cur.humidity },
      trend,
      actual_data: recent.map((r) => ({ timestamp: r.timestamp, temperature: r.temperature, humidity: r.humidity })),
      future_predictions: future,
    };
  }, [predictData, data]);

  const effectivePredict = predictData ?? localPredict;

  // Toast on new alerts
  useEffect(() => {
    const current = new Set(alerts.map((a) => a.key));
    alerts.forEach((a) => {
      if (!lastAlertedRef.current.has(a.key)) {
        toast.error(`${a.label} alert`, { description: a.message });
      }
    });
    lastAlertedRef.current = current;
  }, [alerts]);

  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "analytics" as const, label: "Analytics", icon: LineChartIcon },
    { id: "predictions" as const, label: "Predictions", icon: Brain },
  ];

  return (
    <div className="min-h-screen bg-background bg-aurora text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-predict text-primary-foreground shadow-glow">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-none sm:text-lg">
                Environmental Monitoring Dashboard
              </h1>
              <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                Smart Environmental Monitoring & Prediction System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium md:inline-flex ${
                source === "live"
                  ? "bg-[oklch(0.95_0.05_155)] text-[var(--success-foreground)]"
                  : "bg-[oklch(0.96_0.06_85)] text-[var(--warning-foreground)]"
              }`}
            >
              {source === "live" ? (
                <>
                  <Wifi className="h-3.5 w-3.5" />
                  <span className="live-dot inline-block h-2 w-2 rounded-full bg-[var(--success)]" />
                  Live
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5" />
                  Demo Mode
                </>
              )}
            </div>
            <Link
              to="/history"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-card transition hover:opacity-90"
            >
              <HistoryIcon className="h-4 w-4" />
              History
            </Link>
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground"
              aria-label="Settings"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {settingsOpen && (
          <div className="border-t border-border bg-muted/40">
            <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center lg:px-8">
              <label className="text-xs font-medium text-muted-foreground">Backend API URL</label>
              <input
                value={apiInput}
                onChange={(e) => setApiInput(e.target.value)}
                placeholder="http://localhost:5000/data or https://your-tunnel.ngrok.io/data"
                className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={() => {
                  setApiUrl(apiInput.trim());
                  window.location.reload();
                }}
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Save & reload
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 lg:px-8">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-card text-foreground shadow-card"
                      : "text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
            <div className="mt-6 rounded-xl border border-border bg-card p-4 text-xs">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> System
              </div>
              <p className="mt-1 text-muted-foreground">
                Auto-refresh every 5s. Showing up to last 100 readings.
              </p>
            </div>
          </nav>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 space-y-6">
          {/* Status bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Live Overview</h2>
              <p className="text-sm text-muted-foreground">
                {lastUpdated
                  ? `Last updated ${lastUpdated.toLocaleTimeString()}`
                  : "Awaiting first reading…"}
              </p>
            </div>
            {error && (
              <div className="flex max-w-md items-start gap-2 rounded-lg border border-[oklch(0.85_0.1_85)] bg-[oklch(0.98_0.04_85)] px-3 py-2 text-xs text-[var(--warning-foreground)]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Active alerts banner */}
          {alerts.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-[oklch(0.8_0.15_27)] bg-gradient-to-r from-[oklch(0.97_0.05_27)] to-[oklch(0.95_0.07_15)] p-4 shadow-card">
              <div className="flex items-start gap-3">
                <div className="alert-pulse flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--danger)] text-white">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-[var(--danger)]">
                    {alerts.length} active alert{alerts.length > 1 ? "s" : ""}
                  </h3>
                  <ul className="mt-1.5 space-y-1 text-sm text-foreground">
                    {alerts.map((a) => (
                      <li key={a.key} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
                        <span className="font-medium">{a.label}:</span>
                        <span className="text-muted-foreground">{a.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Metric cards */}
          {loading && !latest ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-card shadow-card" />
              ))}
            </div>
          ) : latest ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard
                label="Temperature"
                value={latest.temperature.toFixed(1)}
                unit="°C"
                status={tempStatus(latest.temperature, th)}
                icon={<Thermometer className="h-5 w-5" />}
                gradientClass="bg-gradient-temp"
                hint={`Limits ${th.tempMin}–${th.tempMax} °C`}
              />
              <MetricCard
                label="Humidity"
                value={String(Math.round(latest.humidity))}
                unit="%"
                status={humStatus(latest.humidity, th)}
                icon={<Droplets className="h-5 w-5" />}
                gradientClass="bg-gradient-humidity"
                hint={`Limits ${th.humMin}–${th.humMax} %`}
              />
              <MetricCard
                label="Air Quality (Gas)"
                value={String(Math.round(latest.gas))}
                unit=""
                status={gasStatus(latest.gas, th)}
                icon={<Flame className="h-5 w-5" />}
                gradientClass="bg-gradient-gas"
                hint={`Max ${th.gasMax} (MQ analog)`}
              />
            </div>
          ) : null}

          {/* Charts */}
          {(active === "dashboard" || active === "analytics") && (
            <div className="grid gap-4 xl:grid-cols-2">
              <SensorChart
                title="Temperature over time"
                data={data}
                dataKey="temperature"
                color="oklch(0.65 0.21 35)"
                unit="°C"
                legendName="Temperature (°C)"
              />
              <SensorChart
                title="Humidity over time"
                data={data}
                dataKey="humidity"
                color="oklch(0.6 0.16 230)"
                unit="%"
                legendName="Humidity (%)"
              />
              <div className="xl:col-span-2">
                <SensorChart
                  title="Air Quality (Gas) over time"
                  data={data}
                  dataKey="gas"
                  color="oklch(0.62 0.18 145)"
                  legendName="Gas value"
                />
              </div>
            </div>
          )}

          {/* Threshold settings */}
          <ThresholdSettings />

          {/* Predictions */}
          {(active === "dashboard" || active === "predictions") && (
            <section className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <PredictionCard
                  title="Predicted Temperature (next hour)"
                  value={predTemp != null ? `${predTemp.toFixed(1)}°C` : "—"}
                  icon={<Thermometer className="h-5 w-5" />}
                  description="Trend-weighted estimate from recent readings."
                />
                <PredictionCard
                  title="Predicted Humidity (next hour)"
                  value={predHum != null ? `${Math.round(predHum)}%` : "—"}
                  icon={<Cloud className="h-5 w-5" />}
                  description="Calculated from rolling average and slope."
                />
              </div>

              {/* Email notification status */}
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${emailAlertsActive ? "bg-[var(--danger)] text-white" : "bg-muted text-muted-foreground"}`}>
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">Email notifications</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Backend (Flask + SMTP)
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Backend triggers email alerts on: Temperature &gt; 30°C or &lt; 10°C, Humidity &gt; 70%, Gas &gt; 300.
                    {emailAlertsActive
                      ? " ⚠️ Conditions currently met — emails being sent on each new reading."
                      : " ✅ All readings within safe range — no emails being sent."}
                  </p>
                </div>
              </div>

              {/* Actual vs Predicted from /predict */}
              {effectivePredict && effectivePredict.actual_data?.length > 0 && (
                <div className="grid gap-4 xl:grid-cols-2">
                  <ActualVsPredictedChart
                    metric="temperature"
                    unit="°C"
                    actual={effectivePredict.actual_data}
                    future={effectivePredict.future_predictions}
                    color="oklch(0.65 0.21 35)"
                  />
                  <ActualVsPredictedChart
                    metric="humidity"
                    unit="%"
                    actual={effectivePredict.actual_data}
                    future={effectivePredict.future_predictions}
                    color="oklch(0.6 0.16 230)"
                  />
                </div>
              )}

              {/* Multi-step future predictions table */}
              {effectivePredict && (
                <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-base font-semibold">Future predictions (next 5 minutes)</h3>
                    <TrendBadge trend={effectivePredict.trend} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="py-2 pr-4">Step</th>
                          <th className="py-2 pr-4">In</th>
                          <th className="py-2 pr-4">Predicted Temp</th>
                          <th className="py-2 pr-4">Predicted Humidity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {effectivePredict.future_predictions.map((f) => (
                          <tr key={f.step}>
                            <td className="py-2 pr-4 font-medium">#{f.step}</td>
                            <td className="py-2 pr-4 text-muted-foreground">+{f.step} min</td>
                            <td className="py-2 pr-4 tabular-nums">{f.predicted_temperature} °C</td>
                            <td className="py-2 pr-4 tabular-nums">{Math.round(f.predicted_humidity)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

          <footer className="pt-4 text-center text-xs text-muted-foreground">
            Smart Environmental Monitoring & Prediction System · Built with React + Recharts
          </footer>
        </main>
      </div>
    </div>
  );
}

function PredictionCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-predict p-5 text-primary-foreground shadow-glow">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary-foreground/80">
            Prediction
          </p>
          <h3 className="mt-1 text-sm font-medium text-primary-foreground/90">{title}</h3>
          <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums">{value}</p>
          <p className="mt-2 max-w-xs text-xs text-primary-foreground/80">{description}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
          {icon}
        </div>
      </div>
    </div>
  );
}

function TrendBadge({ trend }: { trend: "increasing" | "decreasing" | "stable" }) {
  const cfg =
    trend === "increasing"
      ? { Icon: TrendingUp, cls: "bg-[oklch(0.95_0.08_27)] text-[var(--danger)]", label: "Increasing" }
      : trend === "decreasing"
        ? { Icon: TrendingDown, cls: "bg-[oklch(0.95_0.08_230)] text-[oklch(0.45_0.18_230)]", label: "Decreasing" }
        : { Icon: Minus, cls: "bg-muted text-muted-foreground", label: "Stable" };
  const { Icon, cls, label } = cfg;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}
