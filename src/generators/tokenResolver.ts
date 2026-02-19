// Smart token resolvers — search DesignSystem by semantic intent, not exact name

import { DesignSystem, ColorToken, RadiusToken, SpacingToken, TypographyToken } from "../parser/types";

type ColorIntent =
  | "primary"
  | "secondary"
  | "destructive"
  | "surface"
  | "border"
  | "textPrimary"
  | "textSecondary"
  | "textOnPrimary";

type SizeIntent = "small" | "medium" | "large";

type TypographyRole = "heading" | "body" | "caption" | "label";

// Keyword sets for each intent
var COLOR_KEYWORDS: Record<ColorIntent, string[][]> = {
  primary: [["primary"], ["brand"], ["main"], ["accent"]],
  secondary: [["secondary"], ["brand", "second"]],
  destructive: [["error"], ["destructive"], ["danger"], ["red"]],
  surface: [["surface"], ["background"], ["card"], ["bg"]],
  border: [["border"], ["divider"], ["separator"], ["stroke"], ["outline"]],
  textPrimary: [["text", "primary"], ["text", "main"], ["foreground"]],
  textSecondary: [["text", "secondary"], ["text", "muted"], ["caption"]],
  textOnPrimary: [["text", "on"], ["on", "primary"], ["inverse"]],
};

var RADIUS_KEYWORDS: Record<SizeIntent, string[][]> = {
  small: [["sm"], ["small"], ["xs"]],
  medium: [["md"], ["medium"], ["default"], ["base"]],
  large: [["lg"], ["large"], ["xl"]],
};

var SPACING_KEYWORDS: Record<SizeIntent, string[][]> = {
  small: [["sm"], ["small"], ["xs"]],
  medium: [["md"], ["medium"], ["default"], ["base"]],
  large: [["lg"], ["large"], ["xl"]],
};

var TYPO_KEYWORDS: Record<TypographyRole, string[][]> = {
  heading: [["heading"], ["title"], ["display"], ["h1"], ["h2"]],
  body: [["body"], ["paragraph"], ["text"], ["base"]],
  caption: [["caption"], ["small"], ["footnote"], ["overline"]],
  label: [["label"], ["button"], ["subtitle"], ["subhead"]],
};

// --- Color resolver ---

function matchesKeywords(name: string, keywordSets: string[][]): boolean {
  var lower = name.toLowerCase();
  for (var i = 0; i < keywordSets.length; i++) {
    var keywords = keywordSets[i];
    var allMatch = true;
    for (var j = 0; j < keywords.length; j++) {
      if (lower.indexOf(keywords[j]) === -1) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) return true;
  }
  return false;
}

export function getColorToken(ds: DesignSystem, intent: ColorIntent): string {
  var allColors = ds.colors.concat(ds.darkColors);
  var keywords = COLOR_KEYWORDS[intent];

  // Search by keywords
  for (var i = 0; i < allColors.length; i++) {
    if (matchesKeywords(allColors[i].name, keywords)) {
      return allColors[i].hex;
    }
  }

  // Fallback defaults
  switch (intent) {
    case "primary":
      if (ds.meta.brandColor) return ds.meta.brandColor;
      if (ds.colors.length > 0) return ds.colors[0].hex;
      return "#007AFF";
    case "secondary":
      if (ds.colors.length > 1) return ds.colors[1].hex;
      return "#5856D6";
    case "destructive":
      return "#FF3B30";
    case "surface":
      return "#F2F2F7";
    case "border":
      return "#E5E5EA";
    case "textPrimary":
      return "#000000";
    case "textSecondary":
      return "#8E8E93";
    case "textOnPrimary":
      return "#FFFFFF";
    default:
      return "#007AFF";
  }
}

// --- Radius resolver ---

export function getRadiusToken(ds: DesignSystem, size: SizeIntent): number {
  if (ds.radius.length === 0) {
    switch (size) {
      case "small": return 4;
      case "medium": return 8;
      case "large": return 16;
    }
  }

  var keywords = RADIUS_KEYWORDS[size];

  for (var i = 0; i < ds.radius.length; i++) {
    if (matchesKeywords(ds.radius[i].name, keywords)) {
      return ds.radius[i].value;
    }
  }

  // Fallback: pick by position in sorted list
  var sorted = ds.radius.slice().sort(function (a, b) { return a.value - b.value; });
  switch (size) {
    case "small": return sorted[0].value;
    case "large": return sorted[sorted.length - 1].value;
    default: return sorted[Math.floor(sorted.length / 2)].value;
  }
}

// --- Spacing resolver ---

export function getSpacingToken(ds: DesignSystem, size: SizeIntent): number {
  if (ds.spacing.length === 0) {
    switch (size) {
      case "small": return 8;
      case "medium": return 16;
      case "large": return 24;
    }
  }

  var keywords = SPACING_KEYWORDS[size];

  for (var i = 0; i < ds.spacing.length; i++) {
    if (matchesKeywords(ds.spacing[i].name, keywords)) {
      return ds.spacing[i].value;
    }
  }

  // Fallback: pick by position in sorted list
  var sorted = ds.spacing.slice().sort(function (a, b) { return a.value - b.value; });
  switch (size) {
    case "small": return sorted[0].value;
    case "large": return sorted[sorted.length - 1].value;
    default: return sorted[Math.floor(sorted.length / 2)].value;
  }
}

// --- Typography resolver ---

export interface ResolvedTypography {
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  lineHeight: number;
}

export function getTypographyToken(ds: DesignSystem, role: TypographyRole): ResolvedTypography {
  var keywords = TYPO_KEYWORDS[role];

  for (var i = 0; i < ds.typography.length; i++) {
    if (matchesKeywords(ds.typography[i].name, keywords)) {
      var t = ds.typography[i];
      return {
        fontFamily: t.fontFamily || "Inter",
        fontWeight: t.fontWeight || "Regular",
        fontSize: parseFloat(t.fontSize) || 16,
        lineHeight: parseFloat(t.lineHeight) || 24,
      };
    }
  }

  // Fallback defaults
  switch (role) {
    case "heading":
      return { fontFamily: "Inter", fontWeight: "Bold", fontSize: 24, lineHeight: 32 };
    case "body":
      return { fontFamily: "Inter", fontWeight: "Regular", fontSize: 16, lineHeight: 24 };
    case "caption":
      return { fontFamily: "Inter", fontWeight: "Regular", fontSize: 12, lineHeight: 16 };
    case "label":
      return { fontFamily: "Inter", fontWeight: "Semi Bold", fontSize: 14, lineHeight: 20 };
    default:
      return { fontFamily: "Inter", fontWeight: "Regular", fontSize: 16, lineHeight: 24 };
  }
}

// --- Figma font style mapping ---
// Convert weight names like "Bold", "Semi Bold" to Figma font style strings

var WEIGHT_TO_STYLE: Record<string, string> = {
  "100": "Thin",
  "200": "Extra Light",
  "300": "Light",
  "400": "Regular",
  "500": "Medium",
  "600": "Semi Bold",
  "700": "Bold",
  "800": "Extra Bold",
  "900": "Black",
  "thin": "Thin",
  "extralight": "Extra Light",
  "light": "Light",
  "regular": "Regular",
  "medium": "Medium",
  "semibold": "Semi Bold",
  "semi bold": "Semi Bold",
  "bold": "Bold",
  "extrabold": "Extra Bold",
  "extra bold": "Extra Bold",
  "black": "Black",
};

export function weightToFigmaStyle(weight: string): string {
  var normalized = weight.toLowerCase().trim();
  return WEIGHT_TO_STYLE[normalized] || "Regular";
}

// --- Shadow resolver ---

export function getFirstShadow(ds: DesignSystem): { x: number; y: number; blur: number; spread: number; color: string } | null {
  if (ds.shadows.length === 0) return null;
  var s = ds.shadows[0];
  return { x: s.x, y: s.y, blur: s.blur, spread: s.spread, color: s.color };
}
