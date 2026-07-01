export interface User {
  id: string;
  email: string;
  googleId: string;
  createdAt: string;
}

export type WatchMode = "range" | "rowmatch";

export interface Project {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  notifyEmail: boolean;
  notifyPush: boolean;
  sheetCount?: number;
}

export interface Sheet {
  id: string;
  userId: string;
  projectId: string | null;
  project?: { id: string; name: string; color: string } | null;
  spreadsheetId: string;
  range: string;
  tab: string | null;
  watchMode: WatchMode;
  matchColumn: string | null;
  matchValue: string | null;
  label: string;
  pollInterval: number;
  lastCheckedAt: string | null;
  notifyEmail: boolean;
  notifyPush: boolean;
  paused: boolean;
  errorMessage: string | null;
  createdAt: string;
}

export interface Overview {
  tracked: number;
  paused: number;
  active: number;
  errored: number;
  projects: number;
  changesToday: number;
  lastChangeAt: string | null;
}

export interface AvailableSheet {
  spreadsheetId: string;
  name: string;
  ownedByMe: boolean;
  modifiedTime: string;
  tracked: boolean;
  sheetId: string | null;
}

export interface CellChange {
  cell: string;
  before: string;
  after: string;
}

export interface ChangeLog {
  id: string;
  sheetId: string;
  summary: string;
  details: CellChange[];
  createdAt: string;
}

export interface ChangeLogWithSheet extends ChangeLog {
  sheet: { label: string; spreadsheetId: string };
}
