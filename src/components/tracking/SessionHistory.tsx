import { ClayPanel } from "@/components/common/Clay";
import { SimulatedTag, TechBadge } from "@/components/common/Tags";
import { api } from "@/convex/_generated/api";
import { SIM, fmt } from "@/lib/tracking-engine";
import { useQuery } from "convex/react";
import { CalendarClock } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MODE_LABEL: Record<string, string> = {
  manual: "Manual",
  assisted: "Assisted",
  auto: "Auto",
};

/**
 * Two views of the same story: the live trace of the run in progress, and the
 * sessions that were saved to the database for the signed-in operator.
 */
export function SessionHistory({
  trace,
}: {
  trace: Array<{ t: number; errorDeg: number; confidence: number }>;
}) {
  const sessions = useQuery(api.simulation.recentSessions, { limit: 6 });
  const stats = useQuery(api.simulation.sessionStats, {});

  const chartData = trace.map((point) => ({
    t: Math.round((point.t / SIM.fps) * 10) / 10,
    error: point.errorDeg,
    confidence: Math.round(point.confidence * 1000) / 10,
  }));

  return (
    <div className="grid gap-4">
      <ClayPanel className="p-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="hud-label">Alignment trace</p>
            <h2 className="mt-1 text-base font-semibold text-foreground">
              Bearing error &amp; confidence over time
            </h2>
          </div>
          <SimulatedTag />
        </header>

        {chartData.length > 2 ? (
          <div className="clay-inset mt-4 h-56 w-full rounded-2xl p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="errorFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="confidenceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-4)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 6" vertical={false} />
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  unit="s"
                  minTickGap={24}
                />
                <YAxis
                  yAxisId="error"
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <YAxis yAxisId="confidence" orientation="right" domain={[0, 100]} hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: 18,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                  formatter={(value, name) => [
                    `${value}`,
                    name === "error" ? "Error (°)" : "Confidence (%)",
                  ]}
                  labelFormatter={(label) => `t+${label}s`}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">
                      {value === "error" ? "Bearing error (°)" : "Confidence (%)"}
                    </span>
                  )}
                />
                <Area
                  yAxisId="error"
                  type="monotone"
                  dataKey="error"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fill="url(#errorFill)"
                />
                <Area
                  yAxisId="confidence"
                  type="monotone"
                  dataKey="confidence"
                  stroke="var(--color-chart-4)"
                  strokeWidth={2}
                  fill="url(#confidenceFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="clay-inset mt-4 rounded-2xl px-4 py-10 text-center text-xs text-muted-foreground">
            The alignment trace appears once a session has been running for a moment. Start
            tracking to stream simulated offset estimates.
          </p>
        )}
      </ClayPanel>

      <ClayPanel className="p-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="hud-label">Alignment history</p>
            <h2 className="mt-1 text-base font-semibold text-foreground">
              Persisted simulation sessions
            </h2>
          </div>
          <TechBadge tone={stats && stats.total > 0 ? "ok" : "idle"}>
            {stats ? `${stats.aligned}/${stats.total} aligned` : "loading"}
          </TechBadge>
        </header>

        {sessions === undefined ? (
          <div className="mt-4 space-y-2" aria-live="polite">
            {[0, 1, 2].map((index) => (
              <div key={index} className="clay-inset h-12 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="clay-inset mt-4 flex items-center gap-2 rounded-2xl px-4 py-6 text-xs text-muted-foreground">
            <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
            No saved sessions yet. Each completed coarse alignment run is stored against your
            account and listed here.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-separate border-spacing-y-2 text-left">
              <caption className="sr-only">
                Persisted simulation sessions with their simulated alignment error
              </caption>
              <thead>
                <tr>
                  {["Started", "Duration", "Mode", "Peak error", "Final error", "Outcome"].map(
                    (heading) => (
                      <th key={heading} scope="col" className="hud-label pb-1 pl-3">
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session._id} className="clay-inset text-xs text-foreground/85">
                    <td className="rounded-l-2xl px-3 py-2.5">
                      <span className="hud-value">
                        {new Date(session.startedAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 hud-value">{session.durationSeconds.toFixed(1)} s</td>
                    <td className="px-3 py-2.5">{MODE_LABEL[session.mode] ?? session.mode}</td>
                    <td className="px-3 py-2.5 hud-value">{session.peakErrorDeg.toFixed(2)}°</td>
                    <td className="px-3 py-2.5 hud-value">{fmt.deg(session.finalErrorDeg)}</td>
                    <td className="rounded-r-2xl px-3 py-2.5">
                      <TechBadge tone={session.outcome === "aligned" ? "ok" : "warn"}>
                        {session.outcome === "aligned" ? "Aligned" : "Aborted"}
                      </TechBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats && stats.total > 0 && (
              <p className="mt-2 pl-3 text-[11px] text-muted-foreground">
                Mean final error {fmt.deg(stats.averageFinalErrorDeg)} · best{" "}
                {fmt.deg(stats.bestFinalErrorDeg)} across the last {stats.total} saved runs.
                All values simulated.
              </p>
            )}
          </div>
        )}
      </ClayPanel>
    </div>
  );
}
