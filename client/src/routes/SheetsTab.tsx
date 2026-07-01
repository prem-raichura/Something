import { useState } from "react";
import { useAvailableSheets } from "../hooks/useAvailableSheets";
import AvailableSheets from "../components/AvailableSheets";
import AddSheetBox from "../components/AddSheetBox";

export default function SheetsTab() {
  const { available, loading, error, refetch } = useAvailableSheets();
  const [showAddByUrl, setShowAddByUrl] = useState(false);
  const [query, setQuery] = useState("");

  const trackedCount = available.filter((s) => s.tracked).length;
  const q = query.trim().toLowerCase();
  const filtered = q
    ? available.filter((s) => s.name.toLowerCase().includes(q))
    : available;

  return (
    <div className="animate-fade-up space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">
            Your sheets
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Everything in your Google Drive. Flip{" "}
            <span className="font-medium text-ink-700">Track</span> to watch a sheet
            for changes.
          </p>
        </div>
        {!loading && !error && (
          <span className="font-mono text-xs text-ink-400">
            {trackedCount} / {available.length} tracked
          </span>
        )}
      </div>

      {!loading && !error && available.length > 0 && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your sheets…"
          className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm shadow-card outline-none transition-shadow focus:border-[#0FA3A3] focus:ring-4 focus:ring-[#0FA3A3]/10"
        />
      )}

      <AvailableSheets
        available={filtered}
        loading={loading}
        error={error}
        onRefresh={refetch}
        onChanged={refetch}
      />

      <div className="border-t border-line pt-6">
        <button
          onClick={() => setShowAddByUrl((v) => !v)}
          className="font-mono text-xs text-ink-400 transition-colors hover:text-ink-700"
        >
          {showAddByUrl ? "− hide" : "+ add by URL instead"}
        </button>
        {showAddByUrl && (
          <div className="mt-4">
            <AddSheetBox onAdded={refetch} />
          </div>
        )}
      </div>
    </div>
  );
}
