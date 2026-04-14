import { describe, it, expect } from "vitest";
import {
  parseJSON,
  inferType,
  resolveValue,
  parseNumericValue,
  CollectedToken,
} from "../parser/jsonParser";

// MARK: - inferType

describe("inferType", () => {
  it("classifies hex values as color", () => {
    expect(inferType("anything", "#FF0000")).toBe("color");
  });

  it("classifies 8-digit hex as color", () => {
    expect(inferType("shadowColor", "#00000026")).toBe("color");
  });

  it("classifies rgba() values as color", () => {
    expect(inferType("key", "rgba(0,0,0,0.5)")).toBe("color");
  });

  it("classifies spacing key with numeric value as spacing", () => {
    expect(inferType("spacing-md", "16px")).toBe("spacing");
  });

  it("classifies radius key with numeric value as borderRadius", () => {
    expect(inferType("border-radius-sm", "4px")).toBe("borderRadius");
  });

  it("classifies corner key as borderRadius", () => {
    expect(inferType("cornerRadiusLg", "12px")).toBe("borderRadius");
  });

  it("returns null for unrecognised key/value pairs", () => {
    expect(inferType("componentName", "Button")).toBeNull();
  });
});

// MARK: - resolveValue

describe("resolveValue", () => {
  it("resolves W3C DTCG token references like {color.primary}", () => {
    const tokens = new Map<string, CollectedToken>([
      ["color.primary", { type: "color", value: "#007AFF", description: "" }],
    ]);
    const result = resolveValue("{color.primary}", tokens);
    expect(result).toBe("#007AFF");
  });

  it("resolves nested references recursively", () => {
    const tokens = new Map<string, CollectedToken>([
      ["alias.brand", { type: "color", value: "{color.primary}", description: "" }],
      ["color.primary", { type: "color", value: "#007AFF", description: "" }],
    ]);
    expect(resolveValue("{alias.brand}", tokens)).toBe("#007AFF");
  });

  it("returns the value unchanged when it is not a reference", () => {
    const tokens = new Map<string, CollectedToken>();
    expect(resolveValue("#FF0000", tokens)).toBe("#FF0000");
    expect(resolveValue(42, tokens)).toBe(42);
  });

  it("returns the raw string when a reference target does not exist", () => {
    const tokens = new Map<string, CollectedToken>();
    expect(resolveValue("{missing.token}", tokens)).toBe("{missing.token}");
  });
});

// MARK: - parseNumericValue

describe("parseNumericValue", () => {
  it("parses a plain number", () => {
    expect(parseNumericValue(8)).toBe(8);
  });

  it("parses a px string", () => {
    expect(parseNumericValue("16px")).toBe(16);
  });

  it("parses a rem string", () => {
    expect(parseNumericValue("1.5rem")).toBe(1.5);
  });

  it("returns null for non-numeric strings", () => {
    expect(parseNumericValue("auto")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(parseNumericValue(null)).toBeNull();
  });
});

// MARK: - parseJSON (integration)

describe("parseJSON", () => {
  it("parses W3C DTCG format with $type/$value", () => {
    const input = JSON.stringify({
      $name: "Test DS",
      colors: {
        primary: { $type: "color", $value: "#007AFF" },
      },
    });
    const ds = parseJSON(input);
    expect(ds.meta.name).toBe("Test DS");
    expect(ds.colors).toHaveLength(1);
    expect(ds.colors[0].hex).toBe("#007AFF");
  });

  it("resolves token references in W3C DTCG format", () => {
    const input = JSON.stringify({
      brand: { $type: "color", $value: "#5856D6" },
      primary: { $type: "color", $value: "{brand}" },
    });
    const ds = parseJSON(input);
    // Both should resolve to #5856D6
    expect(ds.colors.some((c) => c.hex === "#5856D6")).toBe(true);
  });

  it("routes dark-named colors to darkColors array", () => {
    const input = JSON.stringify({
      dark: {
        background: { $type: "color", $value: "#1C1C1E" },
      },
    });
    const ds = parseJSON(input);
    expect(ds.darkColors.some((c) => c.hex === "#1C1C1E")).toBe(true);
    expect(ds.colors).toHaveLength(0);
  });

  it("parses Tokens Studio format with type/value", () => {
    const input = JSON.stringify({
      spacing: {
        md: { type: "spacing", value: "16" },
      },
    });
    const ds = parseJSON(input);
    expect(ds.spacing).toHaveLength(1);
    expect(ds.spacing[0].value).toBe(16);
  });
});
