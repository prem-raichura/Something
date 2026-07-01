import { google, Auth } from "googleapis";

export interface DriveSpreadsheet {
  spreadsheetId: string;
  name: string;
  ownedByMe: boolean;
  modifiedTime: string;
}

const MAX_FILES = 300;

export async function listSpreadsheets(
  auth: Auth.OAuth2Client
): Promise<DriveSpreadsheet[]> {
  const drive = google.drive({ version: "v3", auth });
  const out: DriveSpreadsheet[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      fields: "nextPageToken, files(id,name,ownedByMe,modifiedTime)",
      orderBy: "modifiedTime desc",
      pageSize: 100,
      pageToken,
      corpora: "user",
      spaces: "drive",
      includeItemsFromAllDrives: false,
      supportsAllDrives: false,
    });

    for (const f of res.data.files ?? []) {
      if (!f.id) continue;
      out.push({
        spreadsheetId: f.id,
        name: f.name ?? f.id,
        ownedByMe: f.ownedByMe ?? false,
        modifiedTime: f.modifiedTime ?? "",
      });
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken && out.length < MAX_FILES);

  return out;
}
