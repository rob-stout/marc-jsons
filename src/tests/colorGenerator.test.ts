import { describe, it, expect } from "vitest";
// Import only the pure functions — generateColors and generateDarkColors call figma.*
import { formatTokenName, groupColors } from "../generators/colorGenerator";
import type { ColorToken } from "../parser/types";

// MARK: - formatTokenName

describe("formatTokenName", () => {
  it("returns the name unchanged when it has 2 or fewer segments", () => {
    expect(formatTokenName("Primary")).toBe("Primary");
    expect(formatTokenName("Brand.Blue")).toBe("Brand.Blue");
  });

  it("shortens a deep dot-path name to last 2 segments", () => {
    expect(formatTokenName("color.brand.primary")).toBe("brand.primary");
    expect(formatTokenName("a.b.c.d")).toBe("c.d");
  });
});

// MARK: - groupColors

describe("groupColors", () => {
  it("groups colors by their first dot-path segment", () => {
    const tokens: ColorToken[] = [
      { name: "Brand.Blue", hex: "#007AFF", description: "", isDark: false },
      { name: "Brand.Purple", hex: "#5856D6", description: "", isDark: false },
      { name: "Neutral.Gray", hex: "#8E8E93", description: "", isDark: false },
    ];
    const groups = groupColors(tokens);
    expect(groups.has("Brand")).toBe(true);
    expect(groups.get("Brand")!).toHaveLength(2);
    expect(groups.has("Neutral")).toBe(true);
  });

  it("puts flat (non-dotted) names in a 'Colors' group", () => {
    const tokens: ColorToken[] = [
      { name: "Primary", hex: "#007AFF", description: "", isDark: false },
    ];
    const groups = groupColors(tokens);
    expect(groups.has("Colors")).toBe(true);
  });

  it("preserves insertion order across groups", () => {
    const tokens: ColorToken[] = [
      { name: "A.one", hex: "#111111", description: "", isDark: false },
      { name: "B.two", hex: "#222222", description: "", isDark: false },
      { name: "A.three", hex: "#333333", description: "", isDark: false },
    ];
    const groups = groupColors(tokens);
    const keys = [...groups.keys()];
    expect(keys[0]).toBe("A");
    expect(keys[1]).toBe("B");
  });
});
