export interface TableRow {
  [key: string]: string;
}

export interface ParsedTable {
  headers: string[];
  rows: TableRow[];
}

/**
 * Parse a markdown table into header names and row objects.
 * Handles pipes at start/end, trims whitespace, strips backticks from values.
 */
export function parseMarkdownTable(lines: string[]): ParsedTable | null {
  // Find header row (first line with pipes)
  const headerIdx = lines.findIndex((l) => l.includes("|"));
  if (headerIdx < 0) return null;

  const headers = splitTableRow(lines[headerIdx]);
  if (headers.length < 2) return null;

  // Next line should be separator (---|---)
  const sepIdx = headerIdx + 1;
  if (sepIdx >= lines.length) return null;
  if (!/^[\s|:-]+$/.test(lines[sepIdx])) return null;

  const rows: TableRow[] = [];
  for (let i = sepIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !line.includes("|")) break;
    const cells = splitTableRow(line);
    const row: TableRow = {};
    headers.forEach((h, idx) => {
      row[h] = stripBackticks(cells[idx] || "").trim();
    });
    rows.push(row);
  }

  if (rows.length === 0) return null;
  return { headers, rows };
}

function splitTableRow(line: string): string[] {
  // Remove leading/trailing pipes and split
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map((c) => c.trim());
}

function stripBackticks(s: string): string {
  return s.replace(/`/g, "");
}
