import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { ChangeLog } from "../types";

export default function SheetDetail() {
  const { id } = useParams<{ id: string }>();
  const [changes, setChanges] = useState<ChangeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<ChangeLog[]>(`/api/sheets/${id}/changes`)
      .then(setChanges)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Change History</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : changes.length === 0 ? (
          <p className="text-gray-400 text-sm">No changes recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {changes.map((c) => (
              <div key={c.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">{c.summary}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1">
                  {c.details.slice(0, 10).map((d, i) => (
                    <div
                      key={i}
                      className="text-sm font-mono bg-gray-50 rounded px-3 py-1 flex gap-2"
                    >
                      <span className="text-gray-400 shrink-0">{d.cell}</span>
                      <span className="text-red-500 line-through">{d.before || "(empty)"}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-green-600">{d.after || "(empty)"}</span>
                    </div>
                  ))}
                  {c.details.length > 10 && (
                    <p className="text-xs text-gray-400 pl-3">
                      +{c.details.length - 10} more cells
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
