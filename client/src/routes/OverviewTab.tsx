import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useOverview } from "../hooks/useOverview";
import { api } from "../lib/api";
import { ChangeLogWithSheet } from "../types";
import PulseDot from "../components/PulseDot";
import { SkeletonStats, SkeletonRows } from "../components/Skeleton";

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Stat({
  value,
  label,
  tone = "ink",
  to,
}: {
  value: number | string;
  label: string;
  tone?: "ink" | "teal" | "coral";
  to?: string;
}) {
  const color =
    tone === "teal" ? "text-teal-600" : tone === "coral" ? "text-coral-600" : "text-ink-900";
  const inner = (
    <div className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-card transition-colors hover:border-ink-300">
      <div className={`font-display text-3xl font-bold tracking-tight ${color}`}>{value}</div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-400">
        {label}
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function OverviewTab() {
  const { overview, loading } = useOverview();
  const [recent, setRecent] = useState<ChangeLogWithSheet[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    api
      .get<ChangeLogWithSheet[]>("/api/changes")
      .then((c) => setRecent(c.slice(0, 5)))
      .catch(() => {})
      .finally(() => setRecentLoading(false));
  }, []);

  return (
    <div className="animate-fade-up space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">Overview</h1>
        <p className="mt-1 text-sm text-ink-500">
          {overview?.lastChangeAt
            ? `Last change ${timeAgo(overview.lastChangeAt)}.`
            : "No changes recorded yet."}
        </p>
      </div>

      {loading || !overview ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={overview.active} label="Watching" tone="teal" to="/tracking" />
          <Stat value={overview.changesToday} label="Changes today" to="/activity" />
          <Stat value={overview.errored} label="Errors" tone={overview.errored ? "coral" : "ink"} to="/tracking" />
          <Stat value={overview.projects} label="Projects" to="/tracking" />
        </div>
      )}

      {overview && overview.paused > 0 && (
        <p className="font-mono text-xs text-ink-400">
          {overview.paused} sheet{overview.paused !== 1 ? "s" : ""} paused ·{" "}
          {overview.tracked} total
        </p>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-ink-900">Recent activity</h2>
          <Link to="/activity" className="font-mono text-[11px] text-ink-400 hover:text-ink-700">
            all →
          </Link>
        </div>
        {recentLoading ? (
          <SkeletonRows count={3} />
        ) : recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-10 text-center">
            <p className="text-sm text-ink-400">
              Track a sheet on{" "}
              <Link to="/sheets" className="font-medium text-teal-600 hover:underline">
                Sheets
              </Link>{" "}
              to start seeing changes.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((c) => (
              <Link
                key={c.id}
                to={`/history/${c.sheetId}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-card transition-colors hover:border-ink-300"
              >
                <PulseDot tone="alert" />
                <span className="flex-1 truncate font-display text-sm font-semibold text-ink-900">
                  {c.sheet.label}
                </span>
                <span className="hidden font-mono text-xs text-ink-500 sm:block">
                  {c.summary}
                </span>
                <span className="font-mono text-[11px] text-ink-400">{timeAgo(c.createdAt)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
