import { SystemMeta } from "../parser/types";
import { COLORS, FONTS } from "../constants";
import { createAutoLayoutFrame, createTextNode, createLabel } from "./shared";

export async function generateHeader(meta: SystemMeta): Promise<FrameNode> {
  const frame = createAutoLayoutFrame("Header", "VERTICAL", 12);
  frame.paddingBottom = 16;

  // System name
  const title = await createTextNode(
    meta.name,
    FONTS.heading.family,
    FONTS.heading.style,
    40,
    COLORS.textPrimary
  );
  frame.appendChild(title);

  // Version + tagline row
  if (meta.version || meta.tagline) {
    const parts: string[] = [];
    if (meta.version) parts.push(`v${meta.version}`);
    if (meta.tagline) parts.push(meta.tagline);
    const subtitle = await createLabel(parts.join(" — "), 14, COLORS.textSecondary);
    frame.appendChild(subtitle);
  }

  // Fonts info
  if (meta.fonts.length > 0) {
    const fontsLabel = await createLabel(
      `Fonts: ${meta.fonts.join(", ")}`,
      12,
      COLORS.textSecondary
    );
    frame.appendChild(fontsLabel);
  }

  return frame;
}
