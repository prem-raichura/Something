export interface User {
  id: string;
  email: string;
  googleId: string;
  createdAt: string;
}

export interface Sheet {
  id: string;
  userId: string;
  spreadsheetId: string;
  range: string;
  label: string;
  pollInterval: number;
  lastCheckedAt: string | null;
  notifyEmail: boolean;
  notifyPush: boolean;
  errorMessage: string | null;
  createdAt: string;
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
