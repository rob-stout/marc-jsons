import { COLORS, FONTS, PAGE_PADDING } from "../constants";

export function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  // Take first 6 chars (ignore alpha)
  h = h.slice(0, 6);
  const num = parseInt(h, 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

export function createAutoLayoutFrame(
  name: string,
  direction: "HORIZONTAL" | "VERTICAL",
  spacing: number,
  padding?: number | { top: number; right: number; bottom: number; left: number }
): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.layoutMode = direction;
  frame.itemSpacing = spacing;
  frame.counterAxisSizingMode = "AUTO";
  frame.primaryAxisSizingMode = "AUTO";
  frame.fills = [];

  if (typeof padding === "number") {
    frame.paddingTop = padding;
    frame.paddingRight = padding;
    frame.paddingBottom = padding;
    frame.paddingLeft = padding;
  } else if (padding) {
    frame.paddingTop = padding.top;
    frame.paddingRight = padding.right;
    frame.paddingBottom = padding.bottom;
    frame.paddingLeft = padding.left;
  }

  return frame;
}

export async function loadFontSafe(
  family: string,
  style: string
): Promise<FontName> {
  // Try the requested font
  try {
    const fontName: FontName = { family, style };
    await figma.loadFontAsync(fontName);
    return fontName;
  } catch (_e) {
    // Fallback: try Inter with the same style
    try {
      const fallback: FontName = { family: "Inter", style };
      await figma.loadFontAsync(fallback);
      return fallback;
    } catch (_e2) {
      // Last resort: Inter Regular
      const lastResort: FontName = { family: "Inter", style: "Regular" };
      await figma.loadFontAsync(lastResort);
      return lastResort;
    }
  }
}

export async function createTextNode(
  content: string,
  fontFamily: string,
  fontStyle: string,
  fontSize: number,
  color?: RGB
): Promise<TextNode> {
  const node = figma.createText();
  const font = await loadFontSafe(fontFamily, fontStyle);
  node.fontName = font;
  node.fontSize = fontSize;
  node.characters = content;
  if (color) {
    node.fills = [{ type: "SOLID", color }];
  }
  return node;
}

export async function createSectionTitle(title: string): Promise<TextNode> {
  return createTextNode(
    title,
    FONTS.heading.family,
    FONTS.heading.style,
    28,
    COLORS.textPrimary
  );
}

export async function createLabel(
  text: string,
  fontSize?: number,
  color?: RGB
): Promise<TextNode> {
  return createTextNode(
    text,
    FONTS.label.family,
    FONTS.label.style,
    fontSize || 11,
    color || COLORS.textSecondary
  );
}

export function createDivider(width: number): RectangleNode {
  const rect = figma.createRectangle();
  rect.name = "Divider";
  rect.resize(width, 1);
  rect.fills = [{ type: "SOLID", color: COLORS.divider }];
  return rect;
}

export function createSectionFrame(name: string): FrameNode {
  const frame = createAutoLayoutFrame(name, "VERTICAL", 24);
  return frame;
}

/**
 * Append a child to an auto-layout parent and set it to fill the parent's width.
 * FILL can only be set after the node is a child of an auto-layout frame.
 */
export function appendFill(parent: FrameNode, child: SceneNode): void {
  parent.appendChild(child);
  if ("layoutSizingHorizontal" in child) {
    (child as FrameNode).layoutSizingHorizontal = "FILL";
  }
}
