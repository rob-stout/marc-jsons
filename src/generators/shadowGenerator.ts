import { ShadowToken } from "../parser/types";
import { COLORS, SHADOW_RECT_SIZE } from "../constants";
import {
  hexToRgb,
  createAutoLayoutFrame,
  createSectionTitle,
  createLabel,
  createSectionFrame,
  appendFill,
} from "./shared";

export async function generateShadows(
  tokens: ShadowToken[]
): Promise<FrameNode> {
  const section = createSectionFrame("Shadows");

  const title = await createSectionTitle("Shadows");
  section.appendChild(title);

  const grid = createAutoLayoutFrame("Shadow Grid", "HORIZONTAL", 32);
  grid.paddingTop = 16;
  grid.paddingBottom = 16;

  for (const token of tokens) {
    const item = await createShadowItem(token);
    grid.appendChild(item);
  }

  appendFill(section, grid);
  return section;
}

async function createShadowItem(token: ShadowToken): Promise<FrameNode> {
  const col = createAutoLayoutFrame(token.name, "VERTICAL", 12);
  col.counterAxisAlignItems = "CENTER";

  // Rectangle with shadow effect
  const rect = figma.createRectangle();
  rect.name = `Shadow ${token.name}`;
  rect.resize(SHADOW_RECT_SIZE, SHADOW_RECT_SIZE);
  rect.cornerRadius = 8;
  rect.fills = [{ type: "SOLID", color: COLORS.background }];

  const shadowColor = hexToRgb(token.color);
  rect.effects = [
    {
      type: "DROP_SHADOW",
      color: { ...shadowColor, a: 0.15 },
      offset: { x: token.x, y: token.y },
      radius: token.blur,
      spread: token.spread,
      visible: true,
      blendMode: "NORMAL",
    },
  ];

  col.appendChild(rect);

  // Token name
  const nameLabel = await createLabel(token.name, 10, COLORS.textPrimary);
  col.appendChild(nameLabel);

  // Shadow values
  const valStr = `${token.x} ${token.y} ${token.blur} ${token.spread}`;
  const valLabel = await createLabel(valStr, 10, COLORS.textSecondary);
  col.appendChild(valLabel);

  return col;
}
