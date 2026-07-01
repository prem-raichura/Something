import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./routes/Login";
import AppLayout from "./components/AppLayout";
import OverviewTab from "./routes/OverviewTab";
import SheetsTab from "./routes/SheetsTab";
import TrackingTab from "./routes/TrackingTab";
import ActivityTab from "./routes/ActivityTab";
import SheetDetail from "./routes/SheetDetail";
import BrandMark from "./components/BrandMark";
import { getMe } from "./lib/auth";
import { User } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    getMe().then(setUser);
  }, []);

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="flex items-center gap-2 opacity-60">
          <BrandMark className="h-5 w-5 animate-pulse" />
          <span className="font-mono text-sm text-ink-400">loading…</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/overview" replace /> : <Login />}
        />
        {user ? (
          <Route element={<AppLayout user={user} />}>
            <Route path="/overview" element={<OverviewTab />} />
            <Route path="/sheets" element={<SheetsTab />} />
            <Route path="/tracking" element={<TrackingTab />} />
            <Route path="/activity" element={<ActivityTab />} />
            <Route path="/history/:id" element={<SheetDetail />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
        <Route
          path="*"
          element={<Navigate to={user ? "/overview" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
