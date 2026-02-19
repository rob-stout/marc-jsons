import { TypographyToken } from "../parser/types";
import { COLORS, FONTS } from "../constants";
import {
  createAutoLayoutFrame,
  createSectionTitle,
  createTextNode,
  createLabel,
  createSectionFrame,
  appendFill,
} from "./shared";

export async function generateTypography(
  tokens: TypographyToken[]
): Promise<FrameNode> {
  const section = createSectionFrame("Typography");

  const title = await createSectionTitle("Typography");
  section.appendChild(title);

  for (const token of tokens) {
    const row = await createTypographyRow(token);
    appendFill(section, row);
  }

  return section;
}

async function createTypographyRow(
  token: TypographyToken
): Promise<FrameNode> {
  const row = createAutoLayoutFrame(token.name, "VERTICAL", 8);

  const fontSize = parseFloat(token.fontSize) || 16;
  const fontWeight = mapWeight(token.fontWeight);

  // Sample text at actual style
  const sample = await createTextNode(
    token.name || "Sample Text",
    token.fontFamily || FONTS.body.family,
    fontWeight,
    fontSize,
    COLORS.textPrimary
  );
  row.appendChild(sample);
  sample.layoutSizingHorizontal = "FILL";

  // Specs label
  const specs: string[] = [];
  if (token.fontFamily) specs.push(token.fontFamily);
  specs.push(fontWeight);
  specs.push(`${fontSize}px`);
  if (token.lineHeight) specs.push(`/${token.lineHeight}`);
  if (token.description) specs.push(`— ${token.description}`);

  const specsLabel = await createLabel(specs.join(" · "), 11, COLORS.textSecondary);
  row.appendChild(specsLabel);
  specsLabel.layoutSizingHorizontal = "FILL";

  return row;
}

function mapWeight(weight: string): string {
  const w = weight.toLowerCase().trim();
  const weightMap: Record<string, string> = {
    "100": "Thin",
    "200": "Extra Light",
    "300": "Light",
    "400": "Regular",
    "500": "Medium",
    "600": "Semi Bold",
    "700": "Bold",
    "800": "Extra Bold",
    "900": "Black",
    thin: "Thin",
    extralight: "Extra Light",
    light: "Light",
    regular: "Regular",
    medium: "Medium",
    semibold: "Semi Bold",
    "semi bold": "Semi Bold",
    bold: "Bold",
    extrabold: "Extra Bold",
    black: "Black",
  };
  return weightMap[w] || weight;
}
