import crypto from "crypto";
import { CellChange } from "../types";

export function hashGrid(rows: string[][]): string {
  return crypto.createHash("sha1").update(JSON.stringify(rows)).digest("hex");
}

export function diffGrid(oldRows: string[][] = [], newRows: string[][] = []): CellChange[] {
  const changes: CellChange[] = [];
  const maxRows = Math.max(oldRows.length, newRows.length);
  for (let r = 0; r < maxRows; r++) {
    const o = oldRows[r] || [];
    const n = newRows[r] || [];
    const maxCols = Math.max(o.length, n.length);
    for (let c = 0; c < maxCols; c++) {
      const before = o[c] ?? "";
      const after = n[c] ?? "";
      if (before !== after) changes.push({ cell: `R${r + 1}C${c + 1}`, before, after });
    }
  }
  return changes;
}
