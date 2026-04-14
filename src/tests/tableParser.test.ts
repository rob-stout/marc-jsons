import { describe, it, expect } from "vitest";
import { parseMarkdownTable, splitTableRow, stripBackticks } from "../parser/tableParser";

// MARK: - splitTableRow

describe("splitTableRow", () => {
  it("splits a row with leading and trailing pipes", () => {
    const cells = splitTableRow("| Name | Value | Notes |");
    expect(cells).toEqual(["Name", "Value", "Notes"]);
  });

  it("splits a row without outer pipes", () => {
    const cells = splitTableRow("Name | Value | Notes");
    expect(cells).toEqual(["Name", "Value", "Notes"]);
  });

  it("trims whitespace from each cell", () => {
    const cells = splitTableRow("|  spaced  |  value  |");
    expect(cells).toEqual(["spaced", "value"]);
  });
});

// MARK: - stripBackticks

describe("stripBackticks", () => {
  it("removes backticks from a code-formatted value", () => {
    expect(stripBackticks("`#FF0000`")).toBe("#FF0000");
  });

  it("removes all backticks from a string with multiple", () => {
    expect(stripBackticks("`bold` `italic`")).toBe("bold italic");
  });

  it("returns string unchanged when no backticks", () => {
    expect(stripBackticks("plain text")).toBe("plain text");
  });
});

// MARK: - parseMarkdownTable

describe("parseMarkdownTable", () => {
  const validTable = [
    "| Name | Hex | Notes |",
    "|------|-----|-------|",
    "| Primary | #007AFF | Main blue |",
    "| Danger | #FF3B30 | Error state |",
  ];

  it("parses headers correctly", () => {
    const result = parseMarkdownTable(validTable);
    expect(result?.headers).toEqual(["Name", "Hex", "Notes"]);
  });

  it("parses row count correctly", () => {
    const result = parseMarkdownTable(validTable);
    expect(result?.rows).toHaveLength(2);
  });

  it("maps row cells to header keys", () => {
    const result = parseMarkdownTable(validTable);
    expect(result?.rows[0]["Name"]).toBe("Primary");
    expect(result?.rows[0]["Hex"]).toBe("#007AFF");
  });

  it("strips backticks from cell values", () => {
    const tableWithBackticks = [
      "| Token | Value |",
      "|-------|-------|",
      "| `spacing-md` | `16px` |",
    ];
    const result = parseMarkdownTable(tableWithBackticks);
    expect(result?.rows[0]["Token"]).toBe("spacing-md");
    expect(result?.rows[0]["Value"]).toBe("16px");
  });

  it("returns null when fewer than 2 headers", () => {
    const result = parseMarkdownTable(["| OnlyOne |", "|---------|", "| val |"]);
    expect(result).toBeNull();
  });

  it("returns null when there are no data rows", () => {
    const result = parseMarkdownTable([
      "| Name | Value |",
      "|------|-------|",
    ]);
    expect(result).toBeNull();
  });
});
