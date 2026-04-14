import { describe, it, expect } from "vitest";
import {
  getColorToken,
  getSpacingToken,
  getRadiusToken,
  getTypographyToken,
  weightToFigmaStyle,
  matchesKeywords,
} from "../generators/tokenResolver";
import { emptyDesignSystem } from "../parser/types";

// MARK: - matchesKeywords

describe("matchesKeywords", () => {
  it("returns true when any keyword set fully matches", () => {
    expect(matchesKeywords("text-primary", [["text", "primary"]])).toBe(true);
  });

  it("returns false when no keyword set matches", () => {
    expect(matchesKeywords("unrelated-token", [["primary"], ["brand"]])).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(matchesKeywords("Brand-Color", [["brand"]])).toBe(true);
  });
});

// MARK: - weightToFigmaStyle

describe("weightToFigmaStyle", () => {
  it("maps numeric weight 700 to Bold", () => {
    expect(weightToFigmaStyle("700")).toBe("Bold");
  });

  it("maps 'semibold' to Semi Bold", () => {
    expect(weightToFigmaStyle("semibold")).toBe("Semi Bold");
  });

  it("maps 'Semi Bold' (spaced) to Semi Bold", () => {
    expect(weightToFigmaStyle("Semi Bold")).toBe("Semi Bold");
  });

  it("returns Regular for unrecognised weight", () => {
    expect(weightToFigmaStyle("unknown-weight")).toBe("Regular");
  });
});

// MARK: - getColorToken

describe("getColorToken", () => {
  it("returns matching color by intent keyword", () => {
    const ds = emptyDesignSystem();
    ds.colors = [{ name: "color-primary", hex: "#007AFF", description: "", isDark: false }];
    expect(getColorToken(ds, "primary")).toBe("#007AFF");
  });

  it("falls back to brandColor for primary intent when no keyword match", () => {
    const ds = emptyDesignSystem();
    ds.meta.brandColor = "#5856D6";
    expect(getColorToken(ds, "primary")).toBe("#5856D6");
  });

  it("falls back to hardcoded default when ds is empty", () => {
    const ds = emptyDesignSystem();
    expect(getColorToken(ds, "destructive")).toBe("#FF3B30");
  });
});

// MARK: - getSpacingToken

describe("getSpacingToken", () => {
  it("returns matching spacing by size keyword", () => {
    const ds = emptyDesignSystem();
    ds.spacing = [
      { name: "spacing-sm", value: 8, description: "" },
      { name: "spacing-lg", value: 24, description: "" },
    ];
    expect(getSpacingToken(ds, "small")).toBe(8);
    expect(getSpacingToken(ds, "large")).toBe(24);
  });

  it("falls back to sorted position when no keyword matches", () => {
    const ds = emptyDesignSystem();
    ds.spacing = [
      { name: "a", value: 4, description: "" },
      { name: "b", value: 32, description: "" },
    ];
    expect(getSpacingToken(ds, "small")).toBe(4);
    expect(getSpacingToken(ds, "large")).toBe(32);
  });

  it("uses hardcoded defaults when spacing array is empty", () => {
    const ds = emptyDesignSystem();
    expect(getSpacingToken(ds, "medium")).toBe(16);
  });
});

// MARK: - getRadiusToken

describe("getRadiusToken", () => {
  it("uses hardcoded defaults when radius array is empty", () => {
    const ds = emptyDesignSystem();
    expect(getRadiusToken(ds, "small")).toBe(4);
    expect(getRadiusToken(ds, "medium")).toBe(8);
    expect(getRadiusToken(ds, "large")).toBe(16);
  });
});

// MARK: - getTypographyToken

describe("getTypographyToken", () => {
  it("returns matching typography by role keyword", () => {
    const ds = emptyDesignSystem();
    ds.typography = [
      {
        name: "heading-1",
        fontFamily: "Helvetica",
        fontWeight: "Bold",
        fontSize: "32",
        lineHeight: "40",
        description: "",
      },
    ];
    const result = getTypographyToken(ds, "heading");
    expect(result.fontFamily).toBe("Helvetica");
    expect(result.fontSize).toBe(32);
  });

  it("falls back to Inter defaults when no match", () => {
    const ds = emptyDesignSystem();
    const result = getTypographyToken(ds, "body");
    expect(result.fontFamily).toBe("Inter");
    expect(result.fontSize).toBe(16);
  });
});
