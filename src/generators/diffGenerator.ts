import {
  createAutoLayoutFrame,
  createTextNode,
  appendFill,
} from "./shared";
import { COLORS, FONTS } from "../constants";

export interface DiffOptions {
  designFrame: FrameNode;
  imageBytes: Uint8Array;
  imageName: string;
}

export async function generateDiff(options: DiffOptions): Promise<FrameNode> {
  var designFrame = options.designFrame;
  var imageBytes = options.imageBytes;
  var imageName = options.imageName;

  var designWidth = designFrame.width;
  var designHeight = designFrame.height;

  // Create the root frame (vertical auto-layout)
  var root = createAutoLayoutFrame("Visual Diff", "VERTICAL", 32, 48);
  root.fills = [{ type: "SOLID", color: COLORS.background }];
  root.cornerRadius = 16;

  // Title
  var today = new Date();
  var dateStr = today.getFullYear() + "-" +
    padTwo(today.getMonth() + 1) + "-" +
    padTwo(today.getDate());
  var title = await createTextNode(
    "Visual Diff — " + designFrame.name + " — " + dateStr,
    FONTS.heading.family,
    FONTS.heading.style,
    24,
    COLORS.textPrimary
  );
  root.appendChild(title);

  // Subtitle with file name
  var subtitle = await createTextNode(
    imageName,
    FONTS.body.family,
    FONTS.body.style,
    14,
    COLORS.textSecondary
  );
  root.appendChild(subtitle);

  // Comparison row (horizontal)
  var compRow = createAutoLayoutFrame("Comparison", "HORIZONTAL", 48);
  compRow.counterAxisSizingMode = "AUTO";
  compRow.primaryAxisSizingMode = "AUTO";

  // --- Design column ---
  var designCol = createAutoLayoutFrame("Design", "VERTICAL", 12);
  var designLabel = await createTextNode(
    "DESIGN",
    FONTS.label.family,
    FONTS.label.style,
    14,
    COLORS.textSecondary
  );
  designCol.appendChild(designLabel);

  // Clone the design frame
  var designClone = designFrame.clone();
  designClone.name = designFrame.name + " (clone)";
  designCol.appendChild(designClone);

  compRow.appendChild(designCol);

  // --- Implementation column ---
  var implCol = createAutoLayoutFrame("Implementation", "VERTICAL", 12);
  var implLabel = await createTextNode(
    "IMPLEMENTATION",
    FONTS.label.family,
    FONTS.label.style,
    14,
    COLORS.textSecondary
  );
  implCol.appendChild(implLabel);

  // Create image from uploaded bytes
  var image = figma.createImage(imageBytes);
  var screenshotRect = figma.createRectangle();
  screenshotRect.name = "Screenshot";
  screenshotRect.resize(designWidth, designHeight);
  screenshotRect.fills = [{
    type: "IMAGE",
    imageHash: image.hash,
    scaleMode: "FIT",
  }];
  implCol.appendChild(screenshotRect);

  compRow.appendChild(implCol);

  appendFill(root, compRow);

  // Footer hint
  var footer = await createTextNode(
    "Use Figma MCP to analyze differences with Claude",
    FONTS.body.family,
    FONTS.body.style,
    13,
    COLORS.textSecondary
  );
  root.appendChild(footer);

  return root;
}

function padTwo(n: number): string {
  return n < 10 ? "0" + n : String(n);
}
