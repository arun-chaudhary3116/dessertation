import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpDown, ChevronLeft, ChevronRight, Download, History as HistoryIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useHistory } from "@/lib/predict-api";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "Sensor History — Environmental Monitoring" },
      { name: "description", content: "Full history of temperature, humidity and gas sensor readings with pagination and sorting." },
    ],
  }),
});

function HistoryPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [filter, setFilter] = useState<"all" | "alerts">("all");

  const { rows, total, pages, loading, error } = useHistory({ page, pageSize, sort, intervalMs: 10000 });

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.temperature > 30 || r.temperature < 10 || r.humidity > 70 || r.gas > 300);
  }, [rows, filter]);

  const exportCsv = () => {
    const header = "id,temperature,humidity,gas,timestamp\n";
    const body = filtered
      .map((r) => `${r.id},${r.temperature},${r.humidity},${r.gas},${r.timestamp}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sensor-history-page${page}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background bg-aurora text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-primary" />
              <h1 className="text-base font-semibold sm:text-lg">Sensor Data History</h1>
            </div>
          </div>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-4 px-4 py-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">All readings</h2>
            <p className="text-sm text-muted-foreground">
              {loading && !rows.length ? "Loading…" : `${total.toLocaleString()} total · page ${page} of ${pages}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSort((s) => (s === "desc" ? "asc" : "desc"))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Time {sort === "desc" ? "↓ newest" : "↑ oldest"}
            </button>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
            <div className="inline-flex rounded-lg border border-border bg-card p-1 text-sm">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-md px-3 py-1 ${filter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("alerts")}
                className={`rounded-md px-3 py-1 ${filter === "alerts" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                Alerts only
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-[oklch(0.85_0.1_85)] bg-[oklch(0.98_0.04_85)] px-3 py-2 text-xs">
            Backend unreachable: {error}. Make sure your Flask server is running and reachable.
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="max-h-[65vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/60 backdrop-blur">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Temperature</th>
                  <th className="px-4 py-3">Humidity</th>
                  <th className="px-4 py-3">Gas</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => {
                  const alert =
                    r.temperature > 30 || r.temperature < 10 || r.humidity > 70 || r.gas > 300;
                  return (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{r.id}</td>
                      <td className="px-4 py-2">{new Date(r.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-2 tabular-nums">{r.temperature.toFixed(1)} °C</td>
                      <td className="px-4 py-2 tabular-nums">{Math.round(r.humidity)}%</td>
                      <td className="px-4 py-2 tabular-nums">{Math.round(r.gas)}</td>
                      <td className="px-4 py-2">
                        {alert ? (
                          <span className="rounded-full bg-[oklch(0.95_0.08_27)] px-2 py-0.5 text-xs font-medium text-[var(--danger)]">
                            Alert
                          </span>
                        ) : (
                          <span className="rounded-full bg-[oklch(0.95_0.05_155)] px-2 py-0.5 text-xs font-medium text-[var(--success-foreground)]">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination footer */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {total.toLocaleString()} rows
          </p>
          <div className="inline-flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="text-sm tabular-nums">
              {page} / {pages}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
