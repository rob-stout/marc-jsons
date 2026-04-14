import { describe, it, expect } from "vitest";
import { hexToRgb, hexToAlpha } from "../generators/shared";

// MARK: - hexToRgb

describe("hexToRgb", () => {
  it("converts 6-digit hex to normalised RGB", () => {
    const result = hexToRgb("#FF8000");
    expect(result.r).toBeCloseTo(1.0);
    expect(result.g).toBeCloseTo(0.502, 2);
    expect(result.b).toBeCloseTo(0.0);
  });

  it("expands 3-digit hex shorthand", () => {
    const result = hexToRgb("#F00");
    expect(result.r).toBeCloseTo(1.0);
    expect(result.g).toBeCloseTo(0.0);
    expect(result.b).toBeCloseTo(0.0);
  });

  it("ignores alpha channel in 8-digit hex — returns RGB only", () => {
    // #00000026 → black with alpha 0x26=38, but hexToRgb should return black
    const result = hexToRgb("#00000026");
    expect(result.r).toBeCloseTo(0);
    expect(result.g).toBeCloseTo(0);
    expect(result.b).toBeCloseTo(0);
  });
});

// MARK: - hexToAlpha (regression: commit 38ea79e — shadow alpha parsing broken)

describe("hexToAlpha", () => {
  it("returns correct alpha for 8-digit hex #00000026", () => {
    // 0x26 = 38 decimal → 38/255 ≈ 0.149
    const alpha = hexToAlpha("#00000026");
    expect(alpha).toBeCloseTo(38 / 255, 4);
  });

  it("returns correct alpha for full-opacity 8-digit hex #000000FF", () => {
    expect(hexToAlpha("#000000FF")).toBeCloseTo(1.0, 4);
  });

  it("returns correct alpha for half-opacity 8-digit hex #00000080", () => {
    // 0x80 = 128 → 128/255 ≈ 0.502
    expect(hexToAlpha("#00000080")).toBeCloseTo(128 / 255, 4);
  });

  it("returns 1.0 for 6-digit hex (no alpha channel)", () => {
    // Regression note: old code returned 0.15 as fallback for 6-digit — now 1.0 (fully opaque)
    expect(hexToAlpha("#FF3B30")).toBe(1.0);
  });

  it("handles hex without leading #", () => {
    // resolves gracefully — slice still works on 8-char string
    expect(hexToAlpha("00000026")).toBeCloseTo(38 / 255, 4);
  });
});
