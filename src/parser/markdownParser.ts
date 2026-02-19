import {
  DesignSystem,
  ColorToken,
  TypographyToken,
  SpacingToken,
  RadiusToken,
  ShadowToken,
  ComponentSpec,
  SystemMeta,
  emptyDesignSystem,
} from "./types";
import { parseMarkdownTable, ParsedTable } from "./tableParser";

const HEX_RE = /#([0-9A-Fa-f]{3,8})\b/;

export function parseMarkdown(input: string): DesignSystem {
  const ds = emptyDesignSystem();
  const lines = input.split("\n");

  ds.meta = extractMeta(lines);

  // Split content into sections by headings
  const sections = splitByHeadings(lines);

  for (const section of sections) {
    const heading = section.heading.toLowerCase();
    const isDarkSection =
      heading.includes("dark") ||
      heading.includes("night") ||
      heading.includes("dark mode");

    // Try to parse tables in this section
    const tables = extractTables(section.lines);
    for (const table of tables) {
      classifyAndAddTable(ds, table, isDarkSection);
    }

    // Try to parse component specs (bullet-point properties)
    const componentSpec = extractComponentSpec(section.heading, section.lines);
    if (componentSpec) {
      ds.components.push(componentSpec);
    }
  }

  return ds;
}

// --- Meta extraction ---

function extractMeta(lines: string[]): SystemMeta {
  const meta: SystemMeta = {
    name: "Design System",
    version: "",
    tagline: "",
    brandColor: "",
    fonts: [],
  };

  // First H1 → system name (with optional version in parentheses)
  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)/);
    if (h1Match) {
      const titleRaw = h1Match[1].trim();
      const versionMatch = titleRaw.match(/\(v?([\d.]+)\)/);
      if (versionMatch) {
        meta.version = versionMatch[1];
        meta.name = titleRaw.replace(/\s*\(v?[\d.]+\)/, "").trim();
      } else {
        meta.name = titleRaw;
      }
      break;
    }
  }

  // Scan first ~20 lines for tagline, brand color, fonts
  const scanLines = lines.slice(0, 30);
  for (const line of scanLines) {
    // Tagline
    const taglineMatch = line.match(/\*\*Tagline:\*\*\s*(.+)/i);
    if (taglineMatch) meta.tagline = taglineMatch[1].trim();

    // Also check for tagline as italic or plain after title
    const italicTagline = line.match(/^>\s*\*(.+)\*\s*$/);
    if (italicTagline && !meta.tagline) meta.tagline = italicTagline[1].trim();

    // Brand color
    if (!meta.brandColor) {
      const hexMatch = line.match(HEX_RE);
      if (hexMatch && line.toLowerCase().includes("brand")) {
        meta.brandColor = "#" + hexMatch[1];
      }
    }

    // Font names — look for **Font:** or **Fonts:** or font-family mentions
    const fontMatch = line.match(
      /\*\*(?:Font|Fonts|Primary Font|Secondary Font|Display Font|Body Font):\*\*\s*(.+)/i
    );
    if (fontMatch) {
      const fontNames = fontMatch[1]
        .split(/[,/]/)
        .map((f) => f.trim())
        .filter(Boolean);
      meta.fonts.push(...fontNames);
    }
  }

  return meta;
}

// --- Section splitting ---

interface Section {
  heading: string;
  level: number;
  lines: string[];
}

function splitByHeadings(lines: string[]): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      if (current) sections.push(current);
      current = {
        heading: headingMatch[2].trim(),
        level: headingMatch[1].length,
        lines: [],
      };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);
  return sections;
}

// --- Table extraction ---

function extractTables(lines: string[]): ParsedTable[] {
  const tables: ParsedTable[] = [];
  let i = 0;

  while (i < lines.length) {
    // Find start of a table (line with pipes)
    if (lines[i].includes("|") && lines[i].trim().length > 1) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const parsed = parseMarkdownTable(tableLines);
      if (parsed) tables.push(parsed);
    } else {
      i++;
    }
  }

  return tables;
}

// --- Table classification ---

function classifyAndAddTable(
  ds: DesignSystem,
  table: ParsedTable,
  isDarkSection: boolean
): void {
  const headersLower = table.headers.map((h) => h.toLowerCase());

  // Check for hex values in any row → color table
  const hasHex = table.rows.some((row) =>
    Object.values(row).some((v) => HEX_RE.test(v))
  );

  // Check for typography keywords in headers
  const isTypography = headersLower.some(
    (h) =>
      h.includes("font") ||
      h.includes("weight") ||
      h.includes("size") ||
      h.includes("line height") ||
      h.includes("lineheight")
  );

  // Check for spacing in token name column
  const firstCol = headersLower[0] || "";
  const tokenNames = table.rows.map((r) =>
    (r[table.headers[0]] || "").toLowerCase()
  );

  const isSpacing =
    tokenNames.some((n) => n.includes("space") || n.includes("spacing")) ||
    firstCol.includes("spacing");

  const isRadius =
    tokenNames.some((n) => n.includes("radius") || n.includes("corner")) ||
    firstCol.includes("radius");

  const isShadow =
    tokenNames.some((n) => n.includes("shadow") || n.includes("elevation")) ||
    firstCol.includes("shadow");

  if (isTypography && !hasHex) {
    ds.typography.push(...parseTypographyTable(table));
  } else if (isShadow) {
    ds.shadows.push(...parseShadowTable(table));
  } else if (isRadius) {
    ds.radius.push(...parseRadiusTable(table));
  } else if (isSpacing) {
    ds.spacing.push(...parseSpacingTable(table));
  } else if (hasHex) {
    const colors = parseColorTable(table);
    // Further split: tokens with dark-related names go to darkColors
    for (const color of colors) {
      const nameLower = color.name.toLowerCase();
      const isDarkToken =
        isDarkSection ||
        nameLower.includes("dark") ||
        nameLower.includes("night");
      if (isDarkToken) {
        color.isDark = true;
        ds.darkColors.push(color);
      } else {
        ds.colors.push(color);
      }
    }
  }
}

// --- Token parsers ---

function parseColorTable(table: ParsedTable): ColorToken[] {
  const colors: ColorToken[] = [];
  const headers = table.headers;

  // Find which column has hex values
  const hexColIdx = findHexColumn(table);
  const nameCol = headers[0];
  const descCol = headers[headers.length - 1];

  for (const row of table.rows) {
    const hexVal = hexColIdx >= 0 ? row[headers[hexColIdx]] : "";
    const hexMatch = hexVal.match(HEX_RE);
    if (!hexMatch) continue;

    colors.push({
      name: row[nameCol] || "",
      hex: "#" + hexMatch[1],
      description: hexColIdx !== headers.length - 1 ? row[descCol] || "" : "",
      isDark: false,
    });
  }

  return colors;
}

function findHexColumn(table: ParsedTable): number {
  for (let col = 0; col < table.headers.length; col++) {
    const hasHex = table.rows.some((row) =>
      HEX_RE.test(row[table.headers[col]] || "")
    );
    if (hasHex) return col;
  }
  return -1;
}

function parseTypographyTable(table: ParsedTable): TypographyToken[] {
  const tokens: TypographyToken[] = [];
  const hMap = mapHeaders(table.headers, [
    ["name", "token", "style", "role"],
    ["font", "family", "typeface"],
    ["weight"],
    ["size"],
    ["line", "lineheight", "line height", "leading"],
    ["description", "usage", "use", "notes"],
  ]);

  for (const row of table.rows) {
    tokens.push({
      name: getCol(row, table.headers, hMap[0]) || "",
      fontFamily: getCol(row, table.headers, hMap[1]) || "",
      fontWeight: getCol(row, table.headers, hMap[2]) || "Regular",
      fontSize: getCol(row, table.headers, hMap[3]) || "16",
      lineHeight: getCol(row, table.headers, hMap[4]) || "",
      description: getCol(row, table.headers, hMap[5]) || "",
    });
  }

  return tokens;
}

function parseSpacingTable(table: ParsedTable): SpacingToken[] {
  return parseNumericTokenTable(table);
}

function parseRadiusTable(table: ParsedTable): RadiusToken[] {
  return parseNumericTokenTable(table);
}

function parseNumericTokenTable(
  table: ParsedTable
): Array<{ name: string; value: number; description: string }> {
  const tokens: Array<{ name: string; value: number; description: string }> =
    [];
  const headers = table.headers;
  const nameCol = headers[0];

  // Find numeric value column
  const valueColIdx = headers.findIndex((h, i) => {
    if (i === 0) return false;
    const lower = h.toLowerCase();
    return (
      lower.includes("value") ||
      lower.includes("size") ||
      lower.includes("px") ||
      lower === "rem"
    );
  });
  const valueCol = valueColIdx >= 0 ? headers[valueColIdx] : headers[1];
  const descCol = headers[headers.length - 1];

  for (const row of table.rows) {
    const rawVal = row[valueCol] || "";
    const num = parseFloat(rawVal.replace(/[^0-9.]/g, ""));
    if (isNaN(num)) continue;

    tokens.push({
      name: row[nameCol] || "",
      value: num,
      description: row[descCol] || "",
    });
  }

  return tokens;
}

function parseShadowTable(table: ParsedTable): ShadowToken[] {
  const tokens: ShadowToken[] = [];
  const headers = table.headers;
  const headersLower = headers.map((h) => h.toLowerCase());
  const nameCol = headers[0];

  // Try to find individual columns for X, Y, Blur, Spread, Color
  const xIdx = headersLower.findIndex((h) => h === "x" || h === "offsetx" || h === "offset-x");
  const yIdx = headersLower.findIndex((h) => h === "y" || h === "offsety" || h === "offset-y");
  const blurIdx = headersLower.findIndex((h) => h === "blur" || h === "blur radius");
  const spreadIdx = headersLower.findIndex((h) => h === "spread");
  const colorIdx = headersLower.findIndex((h) => h === "color");
  const hasColumns = xIdx >= 0 || yIdx >= 0 || blurIdx >= 0;

  for (const row of table.rows) {
    let x = 0, y = 4, blur = 8, spread = 0;
    let color = "#00000026";

    if (hasColumns) {
      if (xIdx >= 0) x = parseInt(row[headers[xIdx]] || "0") || 0;
      if (yIdx >= 0) y = parseInt(row[headers[yIdx]] || "4") || 4;
      if (blurIdx >= 0) blur = parseInt(row[headers[blurIdx]] || "8") || 8;
      if (spreadIdx >= 0) spread = parseInt(row[headers[spreadIdx]] || "0") || 0;
      if (colorIdx >= 0 && row[headers[colorIdx]]) {
        const rawColor = row[headers[colorIdx]];
        const hexMatch = rawColor.match(HEX_RE);
        if (hexMatch) color = "#" + hexMatch[1];
        else color = rawColor;
      }
    } else {
      // Fallback: join all values and extract with regex
      const valueStr = Object.values(row).join(" ");
      const shadowMatch = valueStr.match(
        /(\d+)(?:px)?\s+(\d+)(?:px)?\s+(\d+)(?:px)?(?:\s+(\d+)(?:px)?)?/
      );
      if (shadowMatch) {
        x = parseInt(shadowMatch[1]);
        y = parseInt(shadowMatch[2]);
        blur = parseInt(shadowMatch[3]);
        spread = shadowMatch[4] ? parseInt(shadowMatch[4]) : 0;
      }
      const hexMatch = valueStr.match(HEX_RE);
      if (hexMatch) color = "#" + hexMatch[1];
    }

    tokens.push({
      name: row[nameCol] || "",
      x, y, blur, spread, color,
      description: row[headers[headers.length - 1]] || "",
    });
  }

  return tokens;
}

// --- Component spec extraction ---

function extractComponentSpec(
  heading: string,
  lines: string[]
): ComponentSpec | null {
  const headingLower = heading.toLowerCase();

  // Determine component type
  let type: ComponentSpec["type"] = "unknown";
  if (headingLower.includes("button")) type = "button";
  else if (headingLower.includes("chip") || headingLower.includes("pill"))
    type = "chip";
  else if (
    headingLower.includes("card") ||
    headingLower.includes("tile") ||
    headingLower.includes("container")
  )
    type = "card";
  else if (
    headingLower.includes("input") ||
    headingLower.includes("field") ||
    headingLower.includes("text field")
  )
    type = "input";

  // Look for bullet-point properties
  const properties: Record<string, string> = {};
  const bulletRe = /^[-*]\s+\*\*(.+?):\*\*\s*(.+)/;

  for (const line of lines) {
    const match = line.match(bulletRe);
    if (match) {
      properties[match[1].trim().toLowerCase()] = match[2].trim();
    }
  }

  if (type === "unknown" && Object.keys(properties).length === 0) return null;
  if (Object.keys(properties).length === 0) return null;

  return {
    name: heading.replace(/^[\d.)]+\s*/, "").trim(),
    type,
    properties,
  };
}

// --- Helpers ---

/**
 * Map semantic column groups to actual header indices.
 * Each group is an array of possible keywords for that semantic column.
 */
function mapHeaders(
  headers: string[],
  groups: string[][]
): (number | -1)[] {
  const headersLower = headers.map((h) => h.toLowerCase());
  return groups.map((keywords) => {
    return headersLower.findIndex((h) =>
      keywords.some((k) => h.includes(k))
    );
  });
}

function getCol(
  row: Record<string, string>,
  headers: string[],
  idx: number
): string | undefined {
  if (idx < 0 || idx >= headers.length) return undefined;
  return row[headers[idx]];
}
