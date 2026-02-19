import {
  DesignSystem,
  ColorToken,
  TypographyToken,
  SpacingToken,
  RadiusToken,
  ShadowToken,
  emptyDesignSystem,
} from "./types";

const HEX_RE = /^#([0-9A-Fa-f]{3,8})$/;

interface CollectedToken {
  type: string;
  value: unknown;
  description: string;
}

/**
 * Parse design token JSON into a DesignSystem.
 * Supports:
 *  - W3C DTCG format ($type/$value)
 *  - Tokens Studio format (type/value)
 *  - Flat key/value objects with type inference
 */
export function parseJSON(input: string): DesignSystem {
  const ds = emptyDesignSystem();
  const root = JSON.parse(input);

  // Collect all tokens first for reference resolution
  const allTokens = new Map<string, CollectedToken>();
  collectTokens(root, [], allTokens);

  // Process collected tokens
  for (const [path, token] of allTokens) {
    const value = resolveValue(token.value, allTokens);
    const name = path;
    const shortName = path.split(".").pop() || path;

    switch (token.type) {
      case "color": {
        const hex = typeof value === "string" ? value : "";
        if (!HEX_RE.test(hex)) break;
        const isDark =
          path.toLowerCase().includes("dark") ||
          path.toLowerCase().includes("night");
        const colorToken: ColorToken = {
          name: path,
          hex,
          description: token.description,
          isDark,
        };
        if (isDark) {
          ds.darkColors.push(colorToken);
        } else {
          ds.colors.push(colorToken);
        }
        break;
      }

      case "typography":
      case "fontSizes":
      case "fontWeights":
      case "fontFamilies": {
        const typo =
          typeof value === "object" && value !== null
            ? (value as Record<string, unknown>)
            : {};
        ds.typography.push({
          name: shortName,
          fontFamily: String(typo.fontFamily || typo.fontFamilies || ""),
          fontWeight: String(typo.fontWeight || typo.fontWeights || "Regular"),
          fontSize: String(typo.fontSize || typo.fontSizes || "16"),
          lineHeight: String(typo.lineHeight || typo.lineHeights || ""),
          description: token.description,
        });
        break;
      }

      case "spacing":
      case "dimension": {
        const numVal = parseNumericValue(value);
        if (numVal === null) break;
        if (
          path.toLowerCase().includes("space") ||
          path.toLowerCase().includes("spacing") ||
          path.toLowerCase().includes("gap") ||
          token.type === "spacing"
        ) {
          ds.spacing.push({ name: shortName, value: numVal, description: token.description });
        }
        break;
      }

      case "borderRadius": {
        const numVal = parseNumericValue(value);
        if (numVal === null) break;
        ds.radius.push({ name: shortName, value: numVal, description: token.description });
        break;
      }

      case "boxShadow": {
        const shadow =
          typeof value === "object" && value !== null
            ? (value as Record<string, unknown>)
            : {};
        ds.shadows.push({
          name: shortName,
          x: parseFloat(String(shadow.offsetX || shadow.x || 0)),
          y: parseFloat(String(shadow.offsetY || shadow.y || 4)),
          blur: parseFloat(String(shadow.blur || 8)),
          spread: parseFloat(String(shadow.spread || 0)),
          color: String(shadow.color || "#00000026"),
          description: token.description,
        });
        break;
      }
    }
  }

  // Extract meta from root-level properties
  ds.meta.name = String(root.$name || root.name || root.title || "Design System");
  if (root.$version || root.version) {
    ds.meta.version = String(root.$version || root.version);
  }
  if (root.$description || root.description) {
    ds.meta.tagline = String(root.$description || root.description);
  }

  return ds;
}

function collectTokens(
  obj: Record<string, unknown>,
  path: string[],
  result: Map<string, CollectedToken>
): void {
  if (typeof obj !== "object" || obj === null) return;

  // Check for explicit token: $type/$value (DTCG) or type/value (Tokens Studio)
  const hasType = "$type" in obj || "type" in obj;
  const hasValue = "$value" in obj || "value" in obj;

  if (hasType && hasValue) {
    const type = String(obj.$type || obj.type);
    const value = obj.$value !== undefined ? obj.$value : obj.value;
    const desc = String(obj.$description || obj.description || "");
    result.set(path.join("."), { type, value, description: desc });
    return;
  }

  // Check for implicit token: leaf node with a string value that looks like a color
  if (hasValue && !hasType) {
    const value = obj.$value !== undefined ? obj.$value : obj.value;
    if (typeof value === "string") {
      const inferredType = inferType(path.join("."), value);
      if (inferredType) {
        const desc = String(obj.$description || obj.description || "");
        result.set(path.join("."), { type: inferredType, value, description: desc });
        return;
      }
    }
  }

  // Recurse into children (skip meta keys)
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith("$") || key === "description" || key === "type" || key === "value") continue;
    if (typeof val === "object" && val !== null) {
      collectTokens(val as Record<string, unknown>, [...path, key], result);
    } else if (typeof val === "string" && path.length > 0) {
      // Flat leaf: "tokenName": "#hex" — infer from value
      const inferredType = inferType(key, val);
      if (inferredType) {
        result.set([...path, key].join("."), { type: inferredType, value: val, description: "" });
      }
    }
  }
}

/**
 * Infer token type from its key name and value when no explicit type is provided.
 */
function inferType(key: string, value: string): string | null {
  // Hex color
  if (HEX_RE.test(value)) return "color";
  // rgb/rgba
  if (/^rgba?\(/.test(value)) return "color";
  // hsl
  if (/^hsla?\(/.test(value)) return "color";

  const keyLower = key.toLowerCase();

  // Spacing
  if (keyLower.includes("spacing") || keyLower.includes("space") || keyLower.includes("gap")) {
    if (/[\d]/.test(value)) return "spacing";
  }
  // Radius
  if (keyLower.includes("radius") || keyLower.includes("corner")) {
    if (/[\d]/.test(value)) return "borderRadius";
  }
  // Shadow
  if (keyLower.includes("shadow") || keyLower.includes("elevation")) {
    return "boxShadow";
  }

  return null;
}

function resolveValue(
  value: unknown,
  tokens: Map<string, CollectedToken>
): unknown {
  if (typeof value === "string" && value.startsWith("{") && value.endsWith("}")) {
    const ref = value.slice(1, -1);
    const resolved = tokens.get(ref);
    if (resolved) {
      return resolveValue(resolved.value, tokens);
    }
  }
  if (typeof value === "object" && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = resolveValue(v, tokens);
    }
    return result;
  }
  return value;
}

function parseNumericValue(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = parseFloat(value.replace(/[^0-9.-]/g, ""));
    return isNaN(num) ? null : num;
  }
  return null;
}
