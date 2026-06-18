import { useSheets } from "../hooks/useSheets";
import { usePushPermission } from "../hooks/usePushPermission";
import SheetRow from "../components/SheetRow";
import AddSheetBox from "../components/AddSheetBox";
import ChangeFeed from "../components/ChangeFeed";
import { User } from "../types";
import { logout } from "../lib/auth";

interface Props {
  user: User;
}

export default function Dashboard({ user }: Props) {
  const { sheets, loading, error, refetch } = useSheets();
  const { permission, requestPermission } = usePushPermission();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">SheetWatch</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">{user.email}</span>
          {permission !== "granted" && (
            <button
              onClick={requestPermission}
              className="text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded px-2 py-1"
            >
              Enable push
            </button>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <AddSheetBox onAdded={refetch} />

        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tracked Sheets</h2>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : sheets.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No sheets tracked yet. Paste a Google Sheets URL above.
            </p>
          ) : (
            <div className="space-y-3">
              {sheets.map((sheet) => (
                <SheetRow key={sheet.id} sheet={sheet} onUpdated={refetch} />
              ))}
            </div>
          )}
        </section>

        <ChangeFeed />
      </main>
    </div>
  );
}
