import { useState } from "react";
import { Link } from "react-router-dom";
import { Sheet, Project } from "../types";
import NotifyToggles from "./NotifyToggles";
import PulseDot from "./PulseDot";
import SheetSettings from "./SheetSettings";
import ConfirmModal from "./ConfirmModal";
import { useToast } from "./Toast";
import { api } from "../lib/api";

interface Props {
  sheet: Sheet;
  projects: Project[];
  onUpdated: () => void;
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function scopeLabel(sheet: Sheet): string {
  if (sheet.watchMode === "rowmatch" && sheet.matchColumn) {
    return `rows: ${sheet.matchColumn}=${sheet.matchValue ?? ""}`;
  }
  const whole = !sheet.range || sheet.range === "A1:Z1000";
  if (sheet.tab && whole) return sheet.tab;
  if (sheet.tab) return `${sheet.tab}!${sheet.range}`;
  if (whole) return "whole sheet";
  return sheet.range;
}

export default function SheetRow({ sheet, projects, onUpdated }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [checking, setChecking] = useState(false);
  const [pausing, setPausing] = useState(false);
  const toast = useToast();

  const errored = !!sheet.errorMessage;
  const paused = sheet.paused;

  const checkNow = async () => {
    setChecking(true);
    try {
      await api.post(`/api/sheets/${sheet.id}/check`);
      toast.info(`Checking “${sheet.label}” now…`);
      setTimeout(onUpdated, 2500);
    } catch {
      toast.error("Couldn’t queue a check");
    } finally {
      setChecking(false);
    }
  };

  const togglePause = async () => {
    setPausing(true);
    try {
      await api.patch(`/api/sheets/${sheet.id}`, { paused: !paused });
      toast.success(paused ? "Resumed watching" : "Paused");
      onUpdated();
    } catch {
      toast.error("Couldn’t update");
    } finally {
      setPausing(false);
    }
  };

  const remove = async () => {
    await api.delete(`/api/sheets/${sheet.id}`);
    toast.success(`Stopped watching “${sheet.label}”`);
    onUpdated();
  };

  return (
    <>
      <div
        className={`rounded-2xl border bg-surface px-4 py-3.5 shadow-card sm:px-5 ${
          paused ? "border-line opacity-70" : "border-line"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <PulseDot
                tone={paused ? "muted" : errored ? "alert" : "live"}
                title={paused ? "paused" : errored ? "error" : "watching"}
              />
              <a
                href={`https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate font-display text-sm font-semibold text-ink-900 hover:text-teal-600"
              >
                {sheet.label}
              </a>
              <span className="shrink-0 rounded bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink-500">
                {scopeLabel(sheet)}
              </span>
              {paused && (
                <span className="shrink-0 rounded bg-ink-900/5 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-ink-400">
                  paused
                </span>
              )}
            </div>
            <div className="mt-1 pl-4 font-mono text-[11px] text-ink-400">
              {errored ? (
                <span className="text-coral-600">{sheet.errorMessage}</span>
              ) : paused ? (
                <span>not being watched</span>
              ) : (
                <>
                  checked {sheet.lastCheckedAt ? timeAgo(sheet.lastCheckedAt) : "never"} · every{" "}
                  {Math.round(sheet.pollInterval / 60)} min
                </>
              )}
            </div>
          </div>

          <NotifyToggles sheet={sheet} onUpdated={onUpdated} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-line pt-2.5 pl-4">
          <button
            onClick={checkNow}
            disabled={checking || paused}
            className="rounded-md px-2 py-1 font-mono text-[11px] text-ink-400 transition-colors hover:bg-paper hover:text-teal-600 disabled:opacity-40"
          >
            {checking ? "checking…" : "↻ check now"}
          </button>
          <button
            onClick={togglePause}
            disabled={pausing}
            className="rounded-md px-2 py-1 font-mono text-[11px] text-ink-400 transition-colors hover:bg-paper hover:text-ink-900 disabled:opacity-40"
          >
            {paused ? "▶ resume" : "❚❚ pause"}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-md px-2 py-1 font-mono text-[11px] text-ink-400 transition-colors hover:bg-paper hover:text-ink-900"
          >
            ⚙ settings
          </button>
          <Link
            to={`/history/${sheet.id}`}
            className="rounded-md px-2 py-1 font-mono text-[11px] text-ink-400 transition-colors hover:bg-paper hover:text-ink-700"
          >
            history →
          </Link>
          <button
            onClick={() => setConfirmDelete(true)}
            className="ml-auto rounded-md px-2 py-1 font-mono text-[11px] text-ink-400 transition-colors hover:bg-coral-soft hover:text-coral-600 active:scale-95"
          >
            stop watching
          </button>
        </div>
      </div>

      {settingsOpen && (
        <SheetSettings
          sheet={sheet}
          projects={projects}
          onClose={() => setSettingsOpen(false)}
          onSaved={onUpdated}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Stop watching?"
          message={`“${sheet.label}” and its change history will be removed. You can track it again anytime.`}
          confirmLabel="Stop watching"
          danger
          onConfirm={remove}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
