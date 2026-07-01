import { useState, useEffect } from "react";
import { Sheet, Project } from "../types";
import { api } from "../lib/api";
import Spinner from "./Spinner";
import { DrawerShell } from "./Modal";
import RangePickerModal from "./RangePickerModal";

type UiMode = "whole" | "range" | "rows";

interface Props {
  sheet: Sheet;
  projects: Project[];
  onClose: () => void;
  onSaved: () => void;
}

const INTERVALS = [
  { label: "1 min", value: 60 },
  { label: "3 min", value: 180 },
  { label: "5 min", value: 300 },
  { label: "15 min", value: 900 },
  { label: "1 hour", value: 3600 },
];

function initialMode(sheet: Sheet): UiMode {
  if (sheet.watchMode === "rowmatch") return "rows";
  if (sheet.range && sheet.range !== "A1:Z1000") return "range";
  return "whole";
}

export default function SheetSettings({ sheet, projects, onClose, onSaved }: Props) {
  const [label, setLabel] = useState(sheet.label);
  const [projectId, setProjectId] = useState<string>(sheet.projectId ?? "");
  const [pollInterval, setPollInterval] = useState(sheet.pollInterval);
  const [mode, setMode] = useState<UiMode>(initialMode(sheet));
  const [tab, setTab] = useState<string>(sheet.tab ?? "");
  const [range, setRange] = useState(
    sheet.range && sheet.range !== "A1:Z1000" ? sheet.range : ""
  );
  const [matchColumn, setMatchColumn] = useState(sheet.matchColumn ?? "");
  const [matchValue, setMatchValue] = useState(sheet.matchValue ?? "");
  const [scanRange, setScanRange] = useState(
    sheet.watchMode === "rowmatch" ? sheet.range : "A1:Z1000"
  );

  const [tabs, setTabs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    api
      .get<string[]>(`/api/sheets/${sheet.id}/tabs`)
      .then(setTabs)
      .catch(() => setTabs([]));
  }, [sheet.id]);

  const save = async () => {
    setSaving(true);
    setError(null);

    let payload: Record<string, unknown> = {
      label,
      projectId: projectId || null,
      pollInterval,
      tab: tab || null,
    };

    if (mode === "whole") {
      payload = { ...payload, watchMode: "range", range: "A1:Z1000", matchColumn: null, matchValue: null };
    } else if (mode === "range") {
      if (!range.trim()) {
        setError("Enter a range like B2:D50 or E11.");
        setSaving(false);
        return;
      }
      payload = { ...payload, watchMode: "range", range: range.trim().toUpperCase(), matchColumn: null, matchValue: null };
    } else {
      if (!matchColumn.trim() || !matchValue.trim()) {
        setError("Enter both a column and a value to match.");
        setSaving(false);
        return;
      }
      payload = {
        ...payload,
        watchMode: "rowmatch",
        range: (scanRange.trim() || "A1:Z1000").toUpperCase(),
        matchColumn: matchColumn.trim(),
        matchValue: matchValue.trim(),
      };
    }

    try {
      await api.patch(`/api/sheets/${sheet.id}`, payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t save settings.");
      setSaving(false);
    }
  };

  const seg = (m: UiMode, text: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
        mode === m ? "bg-[#141A2A] text-white shadow-sm" : "text-ink-500 hover:text-ink-900"
      }`}
    >
      {text}
    </button>
  );

  const field =
    "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition-shadow focus:border-[#0FA3A3] focus:ring-4 focus:ring-[#0FA3A3]/10";

  return (
    <DrawerShell onClose={onClose} maxWidth="max-w-md">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-bold text-ink-900">Watch settings</h2>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-ink-400 hover:bg-paper hover:text-ink-900">
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div>
            <label className="text-xs font-semibold text-ink-500">Name</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className={`mt-1.5 ${field}`} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink-500">Project</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={`mt-1.5 ${field}`}>
                <option value="">Ungrouped</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Check every</label>
              <select
                value={pollInterval}
                onChange={(e) => setPollInterval(Number(e.target.value))}
                className={`mt-1.5 ${field}`}
              >
                {INTERVALS.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-500">Tab</label>
            <select value={tab} onChange={(e) => setTab(e.target.value)} className={`mt-1.5 ${field}`}>
              <option value="">First tab (default)</option>
              {tabs.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-500">What to watch</label>
            <div className="mt-1.5 flex gap-1 rounded-xl border border-line bg-paper p-1">
              {seg("whole", "Whole tab")}
              {seg("range", "Range / cell")}
              {seg("rows", "Rows by value")}
            </div>

            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#0FA3A3]/40 bg-[#E4F5F4] px-3 py-2 text-xs font-semibold text-[#0B8A8A] transition-colors hover:bg-[#0FA3A3] hover:text-white"
            >
              ▦ Open sheet &amp; select a region
            </button>

            {mode === "whole" && (
              <p className="mt-3 text-xs text-ink-400">
                Watches everything on the selected tab.
              </p>
            )}

            {mode === "range" && (
              <div className="mt-3">
                <input
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  placeholder="B2:D50, E11, 5:5, or C:C"
                  className={`${field} font-mono`}
                />
                <p className="mt-1.5 font-mono text-[11px] text-ink-400">
                  A1 notation · a block, one cell, a row, or a column
                </p>
              </div>
            )}

            {mode === "rows" && (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={matchColumn}
                    onChange={(e) => setMatchColumn(e.target.value)}
                    placeholder="Column (Status or C)"
                    className={`${field}`}
                  />
                  <input
                    value={matchValue}
                    onChange={(e) => setMatchValue(e.target.value)}
                    placeholder="Value (Pending)"
                    className={`${field}`}
                  />
                </div>
                <input
                  value={scanRange}
                  onChange={(e) => setScanRange(e.target.value)}
                  placeholder="Scan range (A1:Z1000)"
                  className={`${field} font-mono`}
                />
                <p className="text-xs text-ink-400">
                  Watches only rows where{" "}
                  <span className="font-semibold text-ink-700">{matchColumn || "column"}</span> equals{" "}
                  <span className="font-semibold text-ink-700">{matchValue || "value"}</span>. Include the
                  header row so names resolve.
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-coral/30 bg-coral-soft px-3 py-2 text-xs text-coral-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-line px-5 py-4">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0FA3A3] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0B8A8A] active:scale-[0.97] disabled:opacity-50"
          >
            {saving && <Spinner />}
            {saving ? "Saving…" : "Save & re-baseline"}
          </button>
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-ink-500 hover:bg-paper">
            Cancel
          </button>
        </div>

        {pickerOpen && (
          <RangePickerModal
            sheetId={sheet.id}
            tab={tab || null}
            onClose={() => setPickerOpen(false)}
            onPick={(picked) => {
              if (mode === "rows") {
                setScanRange(picked);
              } else {
                setMode("range");
                setRange(picked);
              }
              setPickerOpen(false);
            }}
          />
        )}
    </DrawerShell>
  );
}
