import { describe, it, expect } from "vitest";
import {
  parseMarkdown,
  extractMeta,
  splitByHeadings,
  classifyAndAddTable,
} from "../parser/markdownParser";
import { emptyDesignSystem } from "../parser/types";
import type { ParsedTable } from "../parser/tableParser";

// MARK: - extractMeta

describe("extractMeta", () => {
  it("extracts system name from H1", () => {
    const lines = ["# Acme Design System", "", "Some intro text"];
    const meta = extractMeta(lines);
    expect(meta.name).toBe("Acme Design System");
  });

  it("extracts version from H1 parenthetical", () => {
    const lines = ["# Acme Design System (v2.4)", ""];
    const meta = extractMeta(lines);
    expect(meta.name).toBe("Acme Design System");
    expect(meta.version).toBe("2.4");
  });

  it("falls back to 'Design System' when no H1 is present", () => {
    const lines = ["Just some text", "No heading here"];
    const meta = extractMeta(lines);
    expect(meta.name).toBe("Design System");
  });

  it("extracts brand color when line includes 'brand' and a hex", () => {
    const lines = ["# DS", "**Brand color:** #5856D6"];
    const meta = extractMeta(lines);
    expect(meta.brandColor).toBe("#5856D6");
  });
});

// MARK: - splitByHeadings

describe("splitByHeadings", () => {
  it("splits content into sections by heading", () => {
    const lines = [
      "# Title",
      "intro text",
      "## Colors",
      "color content",
      "## Typography",
      "type content",
    ];
    const sections = splitByHeadings(lines);
    expect(sections).toHaveLength(3);
    expect(sections[0].heading).toBe("Title");
    expect(sections[1].heading).toBe("Colors");
    expect(sections[2].heading).toBe("Typography");
  });

  it("captures lines belonging to each section", () => {
    const lines = ["## Colors", "row1", "row2", "## Spacing", "row3"];
    const sections = splitByHeadings(lines);
    expect(sections[0].lines).toEqual(["row1", "row2"]);
    expect(sections[1].lines).toEqual(["row3"]);
  });

  it("returns empty array when input has no headings", () => {
    const sections = splitByHeadings(["just text", "more text"]);
    expect(sections).toHaveLength(0);
  });
});

// MARK: - classifyAndAddTable — dark-mode detection

describe("classifyAndAddTable — dark mode detection", () => {
  const darkColorTable: ParsedTable = {
    headers: ["Name", "Hex"],
    rows: [{ Name: "Background", Hex: "#1C1C1E" }],
  };

  it("routes colors to darkColors when isDarkSection is true", () => {
    const ds = emptyDesignSystem();
    classifyAndAddTable(ds, darkColorTable, true);
    expect(ds.darkColors).toHaveLength(1);
    expect(ds.colors).toHaveLength(0);
  });

  it("routes colors with 'dark' in the token name to darkColors", () => {
    const table: ParsedTable = {
      headers: ["Name", "Hex"],
      rows: [{ Name: "dark-background", Hex: "#1C1C1E" }],
    };
    const ds = emptyDesignSystem();
    classifyAndAddTable(ds, table, false);
    expect(ds.darkColors).toHaveLength(1);
  });

  it("routes colors with 'night' keyword to darkColors", () => {
    const table: ParsedTable = {
      headers: ["Name", "Hex"],
      rows: [{ Name: "night-surface", Hex: "#2C2C2E" }],
    };
    const ds = emptyDesignSystem();
    classifyAndAddTable(ds, table, false);
    expect(ds.darkColors).toHaveLength(1);
  });

  it("routes normal colors to colors array", () => {
    const table: ParsedTable = {
      headers: ["Name", "Hex"],
      rows: [{ Name: "Primary", Hex: "#007AFF" }],
    };
    const ds = emptyDesignSystem();
    classifyAndAddTable(ds, table, false);
    expect(ds.colors).toHaveLength(1);
    expect(ds.darkColors).toHaveLength(0);
  });
});

// MARK: - parseMarkdown (integration)

describe("parseMarkdown", () => {
  it("parses a full markdown style guide correctly", () => {
    const md = `# Bloom Design System (v1.0)

## Colors

| Name | Hex | Description |
|------|-----|-------------|
| Primary | #5856D6 | Brand purple |
| Danger | #FF3B30 | Error state |

## Dark Mode Colors

| Name | Hex |
|------|-----|
| Background | #1C1C1E |
`;
    const ds = parseMarkdown(md);
    expect(ds.meta.name).toBe("Bloom Design System");
    expect(ds.meta.version).toBe("1.0");
    expect(ds.colors.length).toBeGreaterThanOrEqual(2);
    expect(ds.darkColors.length).toBeGreaterThanOrEqual(1);
  });
});
