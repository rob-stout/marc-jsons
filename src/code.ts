// Plugin sandbox entry — has access to Figma API
import { parseMarkdown } from "./parser/markdownParser";
import { parseJSON } from "./parser/jsonParser";
import { DesignSystem } from "./parser/types";
import { generateHeader } from "./generators/headerGenerator";
import { generateColors, generateDarkColors } from "./generators/colorGenerator";
import { generateTypography } from "./generators/typographyGenerator";
import { generateSpacing } from "./generators/spacingGenerator";
import { generateRadius } from "./generators/radiusGenerator";
import { generateShadows } from "./generators/shadowGenerator";
import { generateComponents } from "./generators/componentGenerator";
import { syncVariables, VariableMode } from "./generators/variableGenerator";
import { createAutoLayoutFrame, createDivider, appendFill } from "./generators/shared";
import {
  PAGE_WIDTH,
  PAGE_PADDING,
  SECTION_SPACING,
  CONTENT_WIDTH,
  COLORS,
} from "./constants";

type SectionKey =
  | "header"
  | "colors"
  | "darkColors"
  | "typography"
  | "spacing"
  | "radius"
  | "shadows"
  | "components";

figma.showUI(__html__, { width: 420, height: 680 });

type PlatformType = "apple" | "android" | "both";

figma.ui.onmessage = async (msg: {
  type: string;
  content?: string;
  sections?: SectionKey[];
  variableMode?: VariableMode;
  platform?: PlatformType;
  devices?: string[];
}) => {
  if (msg.type !== "generate" || !msg.content || !msg.sections) return;

  const variableMode = msg.variableMode || "none";
  const platform = msg.platform || "apple";
  const devices = msg.devices || ["iphone"];

  try {
    // Parse
    sendProgress("Parsing design tokens...", 5);
    const ds = parseContent(msg.content);

    console.log("Parsed design system:", {
      colors: ds.colors.length,
      darkColors: ds.darkColors.length,
      typography: ds.typography.length,
      spacing: ds.spacing.length,
      radius: ds.radius.length,
      shadows: ds.shadows.length,
      components: ds.components.length,
    });

    const hasTokens =
      ds.colors.length > 0 ||
      ds.darkColors.length > 0 ||
      ds.typography.length > 0 ||
      ds.spacing.length > 0 ||
      ds.radius.length > 0 ||
      ds.shadows.length > 0;

    if (!hasTokens) {
      sendError(
        "No design tokens found. Check that your markdown has tables with hex colors, font specs, or spacing values."
      );
      return;
    }

    // --- Sync Variables ---
    let varSummary = "";
    if (variableMode !== "none") {
      sendProgress("Syncing Figma variables...", 8);
      const varResult = await syncVariables(ds, variableMode);
      const parts: string[] = [];
      if (varResult.created > 0) parts.push(varResult.created + " created");
      if (varResult.updated > 0) parts.push(varResult.updated + " updated");
      if (varResult.skipped > 0) parts.push(varResult.skipped + " skipped");
      varSummary = "Variables: " + (parts.length > 0 ? parts.join(", ") : "none");
      if (varResult.errors.length > 0) {
        varSummary += " (" + varResult.errors.length + " errors)";
        console.warn("Variable errors:", varResult.errors);
      }
    }

    // --- Generate Style Guide ---
    sendProgress("Creating style guide frame...", 10);

    // Replace existing artboard if one exists
    const frameName = `${ds.meta.name} — Style Guide`;
    let savedX: number | null = null;
    let savedY: number | null = null;
    for (const child of figma.currentPage.children) {
      if (child.type === "FRAME" && child.name === frameName) {
        savedX = child.x;
        savedY = child.y;
        child.remove();
        break;
      }
    }

    const root = createRootFrame(ds.meta.name, platform);

    const sections = msg.sections;
    const totalSections = sections.length;
    let completed = 0;

    const advance = () => {
      completed++;
      return 10 + (completed / totalSections) * 85;
    };

    for (const section of sections) {
      switch (section) {
        case "header":
          sendProgress("Generating header...", advance());
          const header = await generateHeader(ds.meta);
          appendFill(root, header);
          root.appendChild(createDivider(CONTENT_WIDTH));
          break;

        case "colors":
          if (ds.colors.length > 0) {
            sendProgress(`Generating ${ds.colors.length} color tokens...`, advance());
            const colors = await generateColors(ds.colors, "Colors");
            appendFill(root, colors);
            root.appendChild(createDivider(CONTENT_WIDTH));
          }
          break;

        case "darkColors":
          if (ds.darkColors.length > 0) {
            sendProgress(
              `Generating ${ds.darkColors.length} dark mode colors...`,
              advance()
            );
            const darkColors = await generateDarkColors(ds.darkColors);
            appendFill(root, darkColors);
            root.appendChild(createDivider(CONTENT_WIDTH));
          }
          break;

        case "typography":
          if (ds.typography.length > 0) {
            sendProgress(
              `Generating ${ds.typography.length} type styles...`,
              advance()
            );
            const typo = await generateTypography(ds.typography);
            appendFill(root, typo);
            root.appendChild(createDivider(CONTENT_WIDTH));
          }
          break;

        case "spacing":
          if (ds.spacing.length > 0) {
            sendProgress(
              `Generating ${ds.spacing.length} spacing tokens...`,
              advance()
            );
            const spacing = await generateSpacing(ds.spacing, ds.meta.brandColor);
            appendFill(root, spacing);
            root.appendChild(createDivider(CONTENT_WIDTH));
          }
          break;

        case "radius":
          if (ds.radius.length > 0) {
            sendProgress(
              `Generating ${ds.radius.length} radius tokens...`,
              advance()
            );
            const radius = await generateRadius(ds.radius);
            appendFill(root, radius);
            root.appendChild(createDivider(CONTENT_WIDTH));
          }
          break;

        case "shadows":
          if (ds.shadows.length > 0) {
            sendProgress(
              `Generating ${ds.shadows.length} shadow tokens...`,
              advance()
            );
            const shadows = await generateShadows(ds.shadows);
            appendFill(root, shadows);
            root.appendChild(createDivider(CONTENT_WIDTH));
          }
          break;

        case "components":
          sendProgress("Generating component library...", advance());
          const components = await generateComponents(ds, platform, devices);
          appendFill(root, components);
          break;
      }
    }

    // Remove trailing divider
    const lastChild = root.children[root.children.length - 1];
    if (lastChild && lastChild.name === "Divider") {
      lastChild.remove();
    }

    // Position at saved location or viewport center
    if (savedX !== null && savedY !== null) {
      root.x = savedX;
      root.y = savedY;
    } else {
      root.x = Math.round(figma.viewport.center.x - root.width / 2);
      root.y = Math.round(figma.viewport.center.y);
    }
    figma.viewport.scrollAndZoomIntoView([root]);
    figma.currentPage.selection = [root];

    // Done message
    let doneMsg = `Style guide generated! ${ds.colors.length} colors, ${ds.typography.length} type styles, ${ds.spacing.length} spacing tokens`;
    if (varSummary) doneMsg += ". " + varSummary;

    sendDone(doneMsg);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    sendError(`Generation failed: ${message}`);
    console.error(err);
  }
};

// --- Helpers ---

function parseContent(content: string): DesignSystem {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) {
    return parseJSON(trimmed);
  }
  return parseMarkdown(trimmed);
}

function createRootFrame(systemName: string, platform?: string): FrameNode {
  const width = platform === "both" ? PAGE_WIDTH * 2 : PAGE_WIDTH;
  const root = createAutoLayoutFrame(
    `${systemName} — Style Guide`,
    "VERTICAL",
    SECTION_SPACING
  );
  root.resize(width, 100);
  root.primaryAxisSizingMode = "AUTO";
  root.counterAxisSizingMode = "FIXED";
  root.paddingTop = PAGE_PADDING;
  root.paddingRight = PAGE_PADDING;
  root.paddingBottom = PAGE_PADDING;
  root.paddingLeft = PAGE_PADDING;
  root.fills = [{ type: "SOLID", color: COLORS.background }];
  root.cornerRadius = 0;
  return root;
}

function sendProgress(message: string, percent: number): void {
  figma.ui.postMessage({ type: "progress", message, percent: Math.round(percent) });
}

function sendDone(message: string): void {
  figma.ui.postMessage({ type: "done", message });
}

function sendError(message: string): void {
  figma.ui.postMessage({ type: "error", message });
}
