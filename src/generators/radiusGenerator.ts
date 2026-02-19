import { RadiusToken } from "../parser/types";
import { COLORS, RADIUS_SQUARE_SIZE } from "../constants";
import {
  createAutoLayoutFrame,
  createSectionTitle,
  createLabel,
  createSectionFrame,
  appendFill,
} from "./shared";

export async function generateRadius(
  tokens: RadiusToken[]
): Promise<FrameNode> {
  const section = createSectionFrame("Border Radius");

  const title = await createSectionTitle("Border Radius");
  section.appendChild(title);

  const grid = createAutoLayoutFrame("Radius Grid", "HORIZONTAL", 24);

  for (const token of tokens) {
    const item = await createRadiusItem(token);
    grid.appendChild(item);
  }

  appendFill(section, grid);
  return section;
}

async function createRadiusItem(token: RadiusToken): Promise<FrameNode> {
  const col = createAutoLayoutFrame(token.name, "VERTICAL", 8);
  col.counterAxisAlignItems = "CENTER";

  // Square with the radius applied
  const rect = figma.createRectangle();
  rect.name = `Radius ${token.value}`;
  rect.resize(RADIUS_SQUARE_SIZE, RADIUS_SQUARE_SIZE);
  rect.cornerRadius = token.value;
  rect.fills = [{ type: "SOLID", color: COLORS.divider }];
  rect.strokes = [{ type: "SOLID", color: COLORS.textSecondary }];
  rect.strokeWeight = 1;
  col.appendChild(rect);

  // Token name
  const nameLabel = await createLabel(token.name, 10, COLORS.textPrimary);
  col.appendChild(nameLabel);

  // Value
  const valLabel = await createLabel(`${token.value}px`, 10, COLORS.textSecondary);
  col.appendChild(valLabel);

  return col;
}
