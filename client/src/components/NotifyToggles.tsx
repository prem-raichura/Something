import { useState } from "react";
import { Sheet } from "../types";
import { api } from "../lib/api";

interface Props {
  sheet: Sheet;
  onUpdated: () => void;
}

export default function NotifyToggles({ sheet, onUpdated }: Props) {
  const [email, setEmail] = useState(sheet.notifyEmail);
  const [push, setPush] = useState(sheet.notifyPush);
  const [saving, setSaving] = useState(false);

  const toggle = async (field: "notifyEmail" | "notifyPush", value: boolean) => {
    setSaving(true);
    try {
      await api.patch<Sheet>(`/api/sheets/${sheet.id}`, { [field]: value });
      if (field === "notifyEmail") setEmail(value);
      else setPush(value);
      onUpdated();
    } catch {
      // revert optimistic state
      if (field === "notifyEmail") setEmail(!value);
      else setPush(!value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3 text-xs text-gray-600">
      <label className="flex items-center gap-1 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={email}
          disabled={saving}
          onChange={(e) => toggle("notifyEmail", e.target.checked)}
          className="rounded text-indigo-600 focus:ring-indigo-500"
        />
        Email
      </label>
      <label className="flex items-center gap-1 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={push}
          disabled={saving}
          onChange={(e) => toggle("notifyPush", e.target.checked)}
          className="rounded text-indigo-600 focus:ring-indigo-500"
        />
        Push
      </label>
    </div>
  );
}
