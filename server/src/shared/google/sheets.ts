import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

export function extractSpreadsheetId(url: string): string {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!m) throw new Error("Not a valid Google Sheets URL");
  return m[1];
}

export async function validateAndSnapshot(
  spreadsheetId: string,
  range: string,
  auth: OAuth2Client
): Promise<{ label: string; rows: string[][] }> {
  const sheets = google.sheets({ version: "v4", auth });
  const [meta, values] = await Promise.all([
    sheets.spreadsheets.get({ spreadsheetId }),
    sheets.spreadsheets.values.get({ spreadsheetId, range }),
  ]);
  return {
    label: meta.data.properties?.title ?? spreadsheetId,
    rows: (values.data.values ?? []) as string[][],
  };
}

export async function fetchRange(
  spreadsheetId: string,
  range: string,
  auth: OAuth2Client
): Promise<string[][]> {
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return (res.data.values ?? []) as string[][];
}
