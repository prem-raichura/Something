import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { ChangeLogWithSheet } from "../types";

export default function ChangeFeed() {
  const [changes, setChanges] = useState<ChangeLogWithSheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ChangeLogWithSheet[]>("/api/changes")
      .then(setChanges)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || changes.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Changes</h2>
      <div className="space-y-2">
        {changes.map((c) => (
          <div key={c.id} className="bg-white rounded-lg border px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-gray-900">{c.sheet.label}</span>
              <span className="text-xs text-gray-400">
                {new Date(c.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{c.summary}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
