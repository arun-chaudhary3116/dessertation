import { useEffect, useState } from "react";
import { Save, SlidersHorizontal } from "lucide-react";
import { DEFAULT_THRESHOLDS, loadThresholds, saveThresholds, type Thresholds } from "@/lib/thresholds";
import { toast } from "sonner";

export function ThresholdSettings() {
  const [t, setT] = useState<Thresholds>(DEFAULT_THRESHOLDS);

  useEffect(() => setT(loadThresholds()), []);

  const update = (k: keyof Thresholds, v: string) =>
    setT((prev) => ({ ...prev, [k]: Number(v) || 0 }));

  const fields: { key: keyof Thresholds; label: string; suffix: string }[] = [
    { key: "tempMin", label: "Temp min", suffix: "°C" },
    { key: "tempMax", label: "Temp max", suffix: "°C" },
    { key: "humMin", label: "Humidity min", suffix: "%" },
    { key: "humMax", label: "Humidity max", suffix: "%" },
    { key: "gasMax", label: "Gas max", suffix: "" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-predict text-primary-foreground">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Alert Thresholds</h3>
            <p className="text-xs text-muted-foreground">Trigger alerts when readings cross these limits.</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">{f.label}</span>
            <div className="relative">
              <input
                type="number"
                value={t[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring"
              />
              {f.suffix && (
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {f.suffix}
                </span>
              )}
            </div>
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            saveThresholds(t);
            toast.success("Thresholds saved");
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Save className="h-4 w-4" /> Save thresholds
        </button>
        <button
          onClick={() => {
            setT(DEFAULT_THRESHOLDS);
            saveThresholds(DEFAULT_THRESHOLDS);
            toast("Reset to defaults");
          }}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
