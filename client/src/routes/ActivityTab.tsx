import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { ChangeLogWithSheet } from "../types";
import PulseDot from "../components/PulseDot";
import { SkeletonRows } from "../components/Skeleton";

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function ActivityTab() {
  const [changes, setChanges] = useState<ChangeLogWithSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api
      .get<ChangeLogWithSheet[]>("/api/changes")
      .then(setChanges)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  return (
    <div className="animate-fade-up space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">Activity</h1>
        <p className="mt-1 text-sm text-ink-500">
          Every change we caught. Click one to see the exact cells.
        </p>
      </div>

      {loading ? (
        <SkeletonRows count={5} />
      ) : changes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
          <p className="text-sm font-medium text-ink-700">No changes yet</p>
          <p className="mt-1 text-sm text-ink-400">
            When a tracked sheet changes, it shows up here.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-2 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-line">
          {changes.map((c) => {
            const isOpen = open[c.id];
            return (
              <li key={c.id} className="relative flex gap-4 pl-6">
                <span className="absolute left-0 top-3.5">
                  <PulseDot tone="alert" />
                </span>
                <div className="flex-1 overflow-hidden rounded-xl border border-line bg-surface shadow-card">
                  <button
                    onClick={() => toggle(c.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-paper/60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-display text-sm font-semibold text-ink-900">
                        {c.sheet.label}
                      </span>
                      <span className="font-mono text-xs text-ink-500">{c.summary}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-[11px] text-ink-400">
                        {timeAgo(c.createdAt)}
                      </span>
                      <span
                        className={`text-ink-300 transition-transform ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      >
                        ›
                      </span>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="divide-y divide-line border-t border-line">
                      {c.details.slice(0, 15).map((d, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-4 py-2 font-mono text-xs"
                        >
                          <span className="shrink-0 rounded bg-paper px-1.5 py-0.5 text-[10px] text-ink-400">
                            {d.cell}
                          </span>
                          <span className="truncate text-coral-600 line-through">
                            {d.before || "∅"}
                          </span>
                          <span className="text-ink-300">→</span>
                          <span className="truncate text-teal-600">{d.after || "∅"}</span>
                        </div>
                      ))}
                      {c.details.length > 15 && (
                        <div className="px-4 py-2">
                          <Link
                            to={`/history/${c.sheetId}`}
                            className="font-mono text-[11px] text-teal-600 hover:underline"
                          >
                            +{c.details.length - 15} more · open history →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
