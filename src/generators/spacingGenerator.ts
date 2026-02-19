import { SpacingToken } from "../parser/types";
import { COLORS, SPACING_GAP_COLOR } from "../constants";
import {
  hexToRgb,
  createAutoLayoutFrame,
  createSectionTitle,
  createLabel,
  createSectionFrame,
  appendFill,
} from "./shared";

const REF_BLOCK_SIZE = 32;
const REF_BLOCK_COLOR: RGB = { r: 0.85, g: 0.85, b: 0.85 };

export async function generateSpacing(
  tokens: SpacingToken[],
  brandColor?: string
): Promise<FrameNode> {
  const section = createSectionFrame("Spacing");

  const title = await createSectionTitle("Spacing");
  section.appendChild(title);

  const gapColor = brandColor ? hexToRgb(brandColor) : SPACING_GAP_COLOR;

  for (const token of tokens) {
    const row = await createSpacingRow(token, gapColor);
    appendFill(section, row);
  }

  return section;
}

async function createSpacingRow(
  token: SpacingToken,
  gapColor: RGB
): Promise<FrameNode> {
  const row = createAutoLayoutFrame(token.name, "HORIZONTAL", 16);
  row.counterAxisAlignItems = "CENTER";

  // Token name + value label (fixed width)
  const nameLabel = await createLabel(
    `${token.name}  ·  ${token.value}px`,
    12,
    COLORS.textPrimary
  );
  nameLabel.resize(180, nameLabel.height);
  nameLabel.textAutoResize = "HEIGHT";
  row.appendChild(nameLabel);

  // Visual: two gray blocks separated by the actual spacing value
  // The colored gap IS the spacing
  const demo = createAutoLayoutFrame(`${token.name} demo`, "HORIZONTAL", 0);
  demo.counterAxisAlignItems = "CENTER";
  demo.itemSpacing = 0;
  demo.fills = [];

  // Left reference block
  const leftBlock = figma.createRectangle();
  leftBlock.name = "Ref";
  leftBlock.resize(REF_BLOCK_SIZE, REF_BLOCK_SIZE);
  leftBlock.fills = [{ type: "SOLID", color: REF_BLOCK_COLOR }];
  leftBlock.cornerRadius = 4;
  demo.appendChild(leftBlock);

  // Colored spacer — this IS the spacing value
  const spacerWidth = Math.max(token.value, 1);
  const spacer = figma.createRectangle();
  spacer.name = `${token.value}px`;
  spacer.resize(spacerWidth, REF_BLOCK_SIZE);
  spacer.fills = [{ type: "SOLID", color: gapColor }];
  demo.appendChild(spacer);

  // Right reference block
  const rightBlock = figma.createRectangle();
  rightBlock.name = "Ref";
  rightBlock.resize(REF_BLOCK_SIZE, REF_BLOCK_SIZE);
  rightBlock.fills = [{ type: "SOLID", color: REF_BLOCK_COLOR }];
  rightBlock.cornerRadius = 4;
  demo.appendChild(rightBlock);

  row.appendChild(demo);

  return row;
}
