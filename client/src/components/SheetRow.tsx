import { useState } from "react";
import { Sheet } from "../types";
import NotifyToggles from "./NotifyToggles";
import { api } from "../lib/api";

interface Props {
  sheet: Sheet;
  onUpdated: () => void;
}

export default function SheetRow({ sheet, onUpdated }: Props) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Stop tracking "${sheet.label}"?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/api/sheets/${sheet.id}`);
      onUpdated();
    } catch {
      setDeleting(false);
    }
  };

  const lastChecked = sheet.lastCheckedAt
    ? new Date(sheet.lastCheckedAt).toLocaleString()
    : "Never";

  return (
    <div className="bg-white rounded-lg border px-4 py-3 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <a
          href={`https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-indigo-600 hover:text-indigo-800 truncate block"
        >
          {sheet.label}
        </a>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-gray-400">Checked: {lastChecked}</span>
          {sheet.errorMessage && (
            <span className="text-xs text-red-500">{sheet.errorMessage}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <NotifyToggles sheet={sheet} onUpdated={onUpdated} />
        <a
          href={`/sheets/${sheet.id}`}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          History
        </a>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
        >
          {deleting ? "Removing…" : "Remove"}
        </button>
      </div>
    </div>
  );
}
