import { ColorToken } from "../parser/types";
import {
  SWATCH_SIZE,
  SWATCH_GAP,
  COLORS,
  LABEL_SPACING,
} from "../constants";
import {
  hexToRgb,
  createAutoLayoutFrame,
  createSectionTitle,
  createLabel,
  createSectionFrame,
  appendFill,
} from "./shared";

export async function generateColors(
  colors: ColorToken[],
  sectionTitle: string
): Promise<FrameNode> {
  const section = createSectionFrame(sectionTitle);

  const title = await createSectionTitle(sectionTitle);
  section.appendChild(title);

  // Group colors by prefix (e.g., "Brand.Teal" → group "Brand")
  const groups = groupColors(colors);

  for (const [groupName, groupColors] of groups) {
    // Group label
    if (groups.size > 1) {
      const groupLabel = await createLabel(groupName, 13, COLORS.textSecondary);
      section.appendChild(groupLabel);
    }

    // Swatch grid
    const grid = createAutoLayoutFrame(`${groupName} Grid`, "HORIZONTAL", SWATCH_GAP);
    grid.layoutWrap = "WRAP";
    grid.counterAxisSpacing = SWATCH_GAP;

    for (const color of groupColors) {
      const swatchCol = await createSwatchColumn(color);
      grid.appendChild(swatchCol);
    }

    appendFill(section, grid);
  }

  return section;
}

export async function generateDarkColors(
  colors: ColorToken[]
): Promise<FrameNode> {
  const section = createSectionFrame("Dark Mode Colors");

  const title = await createSectionTitle("Dark Mode Colors");
  section.appendChild(title);

  // Dark background container
  const darkBg = createAutoLayoutFrame("Dark Background", "HORIZONTAL", SWATCH_GAP);
  darkBg.layoutWrap = "WRAP";
  darkBg.counterAxisSpacing = SWATCH_GAP;
  darkBg.fills = [{ type: "SOLID", color: COLORS.darkBackground }];
  darkBg.paddingTop = 24;
  darkBg.paddingRight = 24;
  darkBg.paddingBottom = 24;
  darkBg.paddingLeft = 24;
  darkBg.cornerRadius = 12;

  for (const color of colors) {
    const swatchCol = await createSwatchColumn(color, true);
    darkBg.appendChild(swatchCol);
  }

  appendFill(section, darkBg);
  return section;
}

async function createSwatchColumn(
  color: ColorToken,
  onDark = false
): Promise<FrameNode> {
  const col = createAutoLayoutFrame(color.name, "VERTICAL", LABEL_SPACING);

  // Color swatch
  const swatch = figma.createRectangle();
  swatch.name = `Swatch ${color.name}`;
  swatch.resize(SWATCH_SIZE, SWATCH_SIZE);
  swatch.cornerRadius = 8;
  swatch.fills = [{ type: "SOLID", color: hexToRgb(color.hex) }];

  // Add a light border for very light colors
  const rgb = hexToRgb(color.hex);
  if (rgb.r > 0.9 && rgb.g > 0.9 && rgb.b > 0.9) {
    swatch.strokes = [{ type: "SOLID", color: COLORS.divider }];
    swatch.strokeWeight = 1;
  }

  col.appendChild(swatch);

  // Token name
  const nameLabel = await createLabel(
    formatTokenName(color.name),
    10,
    onDark ? COLORS.textOnDark : COLORS.textPrimary
  );
  nameLabel.resize(SWATCH_SIZE, nameLabel.height);
  nameLabel.textAutoResize = "HEIGHT";
  col.appendChild(nameLabel);

  // Hex value
  const hexLabel = await createLabel(
    color.hex.toUpperCase(),
    10,
    onDark ? { r: 0.7, g: 0.7, b: 0.7 } : COLORS.textSecondary
  );
  col.appendChild(hexLabel);

  return col;
}

export function formatTokenName(name: string): string {
  // Shorten long dot-path names to last 2 segments
  const parts = name.split(".");
  if (parts.length > 2) {
    return parts.slice(-2).join(".");
  }
  return name;
}

export function groupColors(colors: ColorToken[]): Map<string, ColorToken[]> {
  const groups = new Map<string, ColorToken[]>();
  for (const color of colors) {
    const parts = color.name.split(".");
    const group = parts.length > 1 ? parts[0] : "Colors";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(color);
  }
  return groups;
}
