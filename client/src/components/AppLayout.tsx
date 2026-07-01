import { NavLink, Outlet } from "react-router-dom";
import { User } from "../types";
import { logout } from "../lib/auth";
import { api } from "../lib/api";
import { usePushPermission } from "../hooks/usePushPermission";
import { useToast } from "./Toast";
import BrandMark from "./BrandMark";
import PulseDot from "./PulseDot";

interface Props {
  user: User;
}

const tabs = [
  { to: "/overview", label: "Overview" },
  { to: "/sheets", label: "Sheets" },
  { to: "/tracking", label: "Tracking" },
  { to: "/activity", label: "Activity" },
];

export default function AppLayout({ user }: Props) {
  const { permission, requestPermission } = usePushPermission();
  const toast = useToast();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const sendTestPush = async () => {
    try {
      await api.post("/api/push/test");
      toast.success("Test notification sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn’t send test");
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur">
        <div className="flex w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-10">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-6 w-6" />
            <span className="font-display text-lg font-bold tracking-tight text-ink-900">
              SheetWatch
            </span>
            <span className="ml-2 hidden items-center gap-1.5 rounded-full border border-line bg-teal-soft px-2.5 py-1 sm:flex">
              <PulseDot tone="live" />
              <span className="font-mono text-[11px] font-medium text-teal-600">
                watching · 3 min
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {permission !== "granted" ? (
              <button
                onClick={requestPermission}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-sm transition-all hover:border-teal/40 hover:text-teal-600 active:scale-[0.97]"
              >
                <PulseDot tone="muted" />
                Enable push
              </button>
            ) : (
              <button
                onClick={sendTestPush}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-sm transition-all hover:border-teal/40 hover:text-teal-600 active:scale-[0.97]"
              >
                <PulseDot tone="live" />
                Test push
              </button>
            )}
            <div className="hidden text-right sm:block">
              <div className="text-xs font-medium text-ink-700">{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-400 transition-colors hover:bg-coral-soft hover:text-coral-600"
            >
              Sign out
            </button>
          </div>
        </div>

        <nav className="w-full px-4 sm:px-6 lg:px-10">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) =>
                  `relative -mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "border-teal text-ink-900"
                      : "border-transparent text-ink-400 hover:text-ink-700"
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="w-full px-4 py-8 sm:px-6 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}
