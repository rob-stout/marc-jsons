import { DesignSystem } from "../parser/types";
import {
  hexToRgb,
  createAutoLayoutFrame,
  createTextNode,
  createSectionTitle,
  createSectionFrame,
  appendFill,
  createLabel,
} from "./shared";
import {
  getColorToken,
  getTypographyToken,
  weightToFigmaStyle,
  getFirstShadow,
} from "./tokenResolver";
import {
  COLORS,
  WRAPPER_PADDING,
  WRAPPER_SPACING,
  COMPONENT_SET_PADDING,
  COMPONENT_SET_SHADOW_PADDING,
} from "../constants";
import {
  createSearchIcon,
  createCloseIcon,
  createCheckmark,
  createCircleIcon,
  createPencilIcon,
  createShareIcon,
  createTrashIcon,
  createChevronLeft,
} from "./icons";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** MD3 elevation shadow — level 1 (4dp) used for elevated surfaces */
function applyMd3Elevation(node: ComponentNode | FrameNode): void {
  node.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.15 },
      offset: { x: 0, y: 1 },
      radius: 2,
      spread: 0,
      visible: true,
      blendMode: "NORMAL",
    },
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.08 },
      offset: { x: 0, y: 4 },
      radius: 8,
      spread: 0,
      visible: true,
      blendMode: "NORMAL",
    },
  ];
}

/** MD3 tonal surface: primary color at low opacity blended onto white */
function tonalSurface(primary: RGB): RGB {
  return {
    r: primary.r * 0.12 + 0.88,
    g: primary.g * 0.12 + 0.88,
    b: primary.b * 0.12 + 0.88,
  };
}

function applyComponentSetStyle(set: ComponentSetNode, hasShadow: boolean): void {
  var padding = hasShadow ? COMPONENT_SET_SHADOW_PADDING : COMPONENT_SET_PADDING;
  set.itemSpacing = COMPONENT_SET_PADDING;
  set.counterAxisSpacing = COMPONENT_SET_PADDING;
  set.paddingLeft = padding;
  set.paddingRight = padding;
  set.paddingTop = padding;
  set.paddingBottom = padding;
  set.clipsContent = false;
}

async function createLabeledWrapper(
  name: string,
  content: ComponentNode | ComponentSetNode,
  hasShadow?: boolean
): Promise<FrameNode> {
  var wrapper = createAutoLayoutFrame(name + " Wrapper", "VERTICAL", WRAPPER_SPACING, WRAPPER_PADDING);
  wrapper.primaryAxisAlignItems = "MIN";
  wrapper.counterAxisAlignItems = "MIN";
  wrapper.fills = [];
  wrapper.clipsContent = false;
  var label = await createLabel(name, 13, COLORS.textSecondary);
  wrapper.appendChild(label);
  wrapper.appendChild(content);
  return wrapper;
}

// ---------------------------------------------------------------------------
// MD3 font helper — prefers Roboto, falls back to ds font, then Inter
// ---------------------------------------------------------------------------

/**
 * Returns "Roboto" as the preferred MD3 font family, with the design
 * system font as a secondary preference and Inter as final fallback.
 * The actual font loading with fallback is handled by loadFontSafe in shared.ts.
 */
function md3Font(ds: DesignSystem, role: "heading" | "body" | "label" | "caption"): string {
  var typo = getTypographyToken(ds, role);
  // Prefer Roboto for Android. loadFontSafe in shared.ts will fall through to
  // Inter if Roboto isn't available in this Figma environment.
  var dsFamily = typo.fontFamily;
  // If the ds already specifies Roboto, great. Otherwise suggest it.
  if (dsFamily.toLowerCase() === "roboto") return "Roboto";
  return "Roboto";
}

// ---------------------------------------------------------------------------
// 1. MD3 Button — 5 variants: Filled, Tonal, Outlined, Text, Elevated
//    MD3: 40dp height, fully-rounded (20px), no border-heavy styling
// ---------------------------------------------------------------------------

async function createMd3ButtonSet(ds: DesignSystem): Promise<ComponentSetNode> {
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var tonalBg = tonalSurface(primaryColor);
  var bodyFont = md3Font(ds, "body");

  // Outlined border color — use a muted tone
  var outlineColor = hexToRgb(getColorToken(ds, "border"));

  var styles = [
    {
      name: "Filled",
      fill: primaryColor,
      textColor: { r: 1, g: 1, b: 1 } as RGB,
      hasBorder: false,
      elevation: false,
    },
    {
      name: "Tonal",
      fill: tonalBg,
      textColor: primaryColor,
      hasBorder: false,
      elevation: false,
    },
    {
      name: "Outlined",
      fill: { r: 1, g: 1, b: 1 } as RGB,
      textColor: primaryColor,
      hasBorder: true,
      elevation: false,
    },
    {
      name: "Text",
      fill: null as RGB | null,
      textColor: primaryColor,
      hasBorder: false,
      elevation: false,
    },
    {
      name: "Elevated",
      fill: { r: 1, g: 1, b: 1 } as RGB,
      textColor: primaryColor,
      hasBorder: false,
      elevation: true,
    },
  ];

  var components: ComponentNode[] = [];

  for (var si = 0; si < styles.length; si++) {
    var style = styles[si];
    for (var di = 0; di < 2; di++) {
      var isDisabled = di === 1;
      var comp = figma.createComponent();
      comp.name = "Style=" + style.name + ", State=" + (isDisabled ? "Disabled" : "Default");
      comp.layoutMode = "HORIZONTAL";
      comp.primaryAxisAlignItems = "CENTER";
      comp.counterAxisAlignItems = "CENTER";
      comp.paddingLeft = 24;
      comp.paddingRight = 24;
      // MD3 buttons are 40dp tall
      comp.cornerRadius = 20;
      comp.fills = style.fill ? [{ type: "SOLID", color: style.fill }] : [];
      comp.resize(120, 40);
      comp.primaryAxisSizingMode = "AUTO";
      comp.counterAxisSizingMode = "FIXED";

      if (style.hasBorder) {
        comp.strokes = [{ type: "SOLID", color: outlineColor }];
        comp.strokeWeight = 1;
      }

      if (style.elevation && !isDisabled) {
        applyMd3Elevation(comp);
      }

      if (isDisabled) {
        comp.opacity = 0.38;
      }

      var text = await createTextNode(
        style.name + " Button",
        bodyFont,
        "Medium",
        14,
        style.textColor
      );
      comp.appendChild(text);
      components.push(comp);
    }
  }

  var set = figma.combineAsVariants(components, figma.currentPage);
  set.name = "MD3 Button";
  applyComponentSetStyle(set, false);
  return set;
}

// ---------------------------------------------------------------------------
// 2. MD3 TextField — 2 variants: Filled (bottom line), Outlined (full border)
//    MD3 Filled: 56dp, surface variant bg, bottom indicator, floating label
//    MD3 Outlined: 56dp, rounded 4px border, no background fill
// ---------------------------------------------------------------------------

async function createMd3TextFieldSet(ds: DesignSystem): Promise<ComponentSetNode> {
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var borderColor = hexToRgb(getColorToken(ds, "border"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var bodyFont = md3Font(ds, "body");

  // MD3 surface variant — very slightly tinted surface
  var surfaceVariant: RGB = {
    r: surfaceColor.r * 0.95 + 0.05 * 0.92,
    g: surfaceColor.g * 0.95 + 0.05 * 0.92,
    b: surfaceColor.b * 0.95 + 0.05 * 0.97,
  };

  var components: ComponentNode[] = [];

  // Filled variant
  var filledComp = figma.createComponent();
  filledComp.name = "Style=Filled, State=Default";
  filledComp.layoutMode = "VERTICAL";
  filledComp.primaryAxisAlignItems = "MIN";
  filledComp.counterAxisAlignItems = "MIN";
  filledComp.paddingLeft = 16;
  filledComp.paddingRight = 16;
  filledComp.paddingTop = 8;
  filledComp.paddingBottom = 0;
  filledComp.cornerRadius = 4;
  // Only top corners rounded for filled variant
  filledComp.topLeftRadius = 4;
  filledComp.topRightRadius = 4;
  filledComp.bottomLeftRadius = 0;
  filledComp.bottomRightRadius = 0;
  filledComp.fills = [{ type: "SOLID", color: surfaceVariant }];
  filledComp.resize(361, 56);
  filledComp.primaryAxisSizingMode = "FIXED";
  filledComp.counterAxisSizingMode = "FIXED";
  // Bottom active indicator
  filledComp.strokes = [{ type: "SOLID", color: primaryColor }];
  filledComp.strokeTopWeight = 0;
  filledComp.strokeRightWeight = 0;
  filledComp.strokeBottomWeight = 2;
  filledComp.strokeLeftWeight = 0;

  // Floating label (small, above)
  var filledLabel = await createTextNode("Label", bodyFont, "Regular", 12, textSecondaryColor);
  filledComp.appendChild(filledLabel);

  // Input text
  var filledInput = await createTextNode("Input text", bodyFont, "Regular", 16, textPrimaryColor);
  filledComp.appendChild(filledInput);

  components.push(filledComp);

  // Outlined variant
  var outlinedComp = figma.createComponent();
  outlinedComp.name = "Style=Outlined, State=Default";
  outlinedComp.layoutMode = "VERTICAL";
  outlinedComp.primaryAxisAlignItems = "MIN";
  outlinedComp.counterAxisAlignItems = "MIN";
  outlinedComp.paddingLeft = 16;
  outlinedComp.paddingRight = 16;
  outlinedComp.paddingTop = 8;
  outlinedComp.paddingBottom = 8;
  outlinedComp.cornerRadius = 4;
  outlinedComp.fills = [];
  outlinedComp.strokes = [{ type: "SOLID", color: borderColor }];
  outlinedComp.strokeWeight = 1;
  outlinedComp.resize(361, 56);
  outlinedComp.primaryAxisSizingMode = "FIXED";
  outlinedComp.counterAxisSizingMode = "FIXED";

  var outlinedLabel = await createTextNode("Label", bodyFont, "Regular", 12, textSecondaryColor);
  outlinedComp.appendChild(outlinedLabel);

  var outlinedInput = await createTextNode("Input text", bodyFont, "Regular", 16, textPrimaryColor);
  outlinedComp.appendChild(outlinedInput);

  components.push(outlinedComp);

  var set = figma.combineAsVariants(components, figma.currentPage);
  set.name = "MD3 Text Field";
  applyComponentSetStyle(set, false);
  return set;
}

// ---------------------------------------------------------------------------
// 3. MD3 Search Bar — 2 variants: Default, Active
//    MD3: pill-shaped (28px radius), surface color, centered placeholder
// ---------------------------------------------------------------------------

async function createMd3SearchBarSet(ds: DesignSystem): Promise<ComponentSetNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var bodyFont = md3Font(ds, "body");

  var components: ComponentNode[] = [];

  // Default — pill shape, search icon left, "Search" centered
  var defaultComp = figma.createComponent();
  defaultComp.name = "State=Default";
  defaultComp.layoutMode = "HORIZONTAL";
  defaultComp.counterAxisAlignItems = "CENTER";
  defaultComp.primaryAxisAlignItems = "MIN";
  defaultComp.itemSpacing = 8;
  defaultComp.paddingLeft = 16;
  defaultComp.paddingRight = 16;
  // MD3 search bar: 56dp height, full-pill radius
  defaultComp.cornerRadius = 28;
  defaultComp.fills = [{ type: "SOLID", color: surfaceColor }];
  defaultComp.resize(361, 56);
  defaultComp.primaryAxisSizingMode = "FIXED";
  defaultComp.counterAxisSizingMode = "FIXED";
  applyMd3Elevation(defaultComp);

  var searchIcon1 = createSearchIcon(textSecondaryColor, 20);
  defaultComp.appendChild(searchIcon1);
  var placeholder = await createTextNode(
    "Search",
    bodyFont,
    "Regular",
    16,
    textSecondaryColor
  );
  defaultComp.appendChild(placeholder);
  placeholder.layoutGrow = 1;
  components.push(defaultComp);

  // Active — focused state with close button
  var activeComp = figma.createComponent();
  activeComp.name = "State=Active";
  activeComp.layoutMode = "HORIZONTAL";
  activeComp.counterAxisAlignItems = "CENTER";
  activeComp.primaryAxisAlignItems = "MIN";
  activeComp.itemSpacing = 8;
  activeComp.paddingLeft = 16;
  activeComp.paddingRight = 16;
  activeComp.cornerRadius = 28;
  activeComp.fills = [{ type: "SOLID", color: surfaceColor }];
  activeComp.resize(361, 56);
  activeComp.primaryAxisSizingMode = "FIXED";
  activeComp.counterAxisSizingMode = "FIXED";
  applyMd3Elevation(activeComp);

  var searchIcon2 = createSearchIcon(textSecondaryColor, 20);
  activeComp.appendChild(searchIcon2);
  var queryText = await createTextNode(
    "Search query",
    bodyFont,
    "Regular",
    16,
    textPrimaryColor
  );
  activeComp.appendChild(queryText);
  queryText.layoutGrow = 1;
  var closeIcon = createCloseIcon(textSecondaryColor, 18);
  activeComp.appendChild(closeIcon);
  components.push(activeComp);

  var set = figma.combineAsVariants(components, figma.currentPage);
  set.name = "MD3 Search Bar";
  applyComponentSetStyle(set, false);
  return set;
}

// ---------------------------------------------------------------------------
// 4. MD3 Segmented Button — 3 variants (Selection=First/Second/Third)
//    MD3: outlined segments, check icon on selected, 40dp height, 4px radius
// ---------------------------------------------------------------------------

async function createMd3SegmentedButtonSet(ds: DesignSystem): Promise<ComponentSetNode> {
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var tonalBg = tonalSurface(primaryColor);
  var borderColor = hexToRgb(getColorToken(ds, "border"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var bodyFont = md3Font(ds, "body");

  var segments = ["First", "Second", "Third"];
  var components: ComponentNode[] = [];

  for (var si = 0; si < segments.length; si++) {
    var selected = segments[si];
    var comp = figma.createComponent();
    comp.name = "Selection=" + selected;
    comp.layoutMode = "HORIZONTAL";
    comp.counterAxisAlignItems = "CENTER";
    comp.itemSpacing = 0;
    // MD3: outlined container, 4px corner
    comp.cornerRadius = 20;
    comp.fills = [];
    comp.strokes = [{ type: "SOLID", color: borderColor }];
    comp.strokeWeight = 1;
    comp.resize(280, 40);
    comp.primaryAxisSizingMode = "FIXED";
    comp.counterAxisSizingMode = "FIXED";

    for (var j = 0; j < segments.length; j++) {
      var isSelected = segments[j] === selected;
      var seg = createAutoLayoutFrame(segments[j], "HORIZONTAL", 6);
      seg.primaryAxisAlignItems = "CENTER";
      seg.counterAxisAlignItems = "CENTER";
      seg.paddingLeft = 12;
      seg.paddingRight = 12;
      seg.resize(92, 40);
      seg.primaryAxisSizingMode = "FIXED";
      seg.counterAxisSizingMode = "FIXED";

      // Right divider between segments (not on the last)
      if (j < segments.length - 1) {
        seg.strokes = [{ type: "SOLID", color: borderColor }];
        seg.strokeTopWeight = 0;
        seg.strokeRightWeight = 1;
        seg.strokeBottomWeight = 0;
        seg.strokeLeftWeight = 0;
      } else {
        seg.fills = [];
      }

      if (isSelected) {
        seg.fills = [{ type: "SOLID", color: tonalBg }];
        // Checkmark before label
        var check = createCheckmark(primaryColor, 16);
        seg.appendChild(check);
      }

      var segLabel = await createTextNode(
        segments[j],
        bodyFont,
        "Medium",
        14,
        isSelected ? primaryColor : textSecondaryColor
      );
      seg.appendChild(segLabel);
      comp.appendChild(seg);
      seg.layoutGrow = 1;
    }

    components.push(comp);
  }

  var set = figma.combineAsVariants(components, figma.currentPage);
  set.name = "MD3 Segmented Button";
  applyComponentSetStyle(set, false);
  return set;
}

// ---------------------------------------------------------------------------
// 5. MD3 Top App Bar — single component
//    MD3: 64dp, title left-aligned, navigation icon left, actions right
// ---------------------------------------------------------------------------

async function createMd3TopAppBarComponent(ds: DesignSystem): Promise<ComponentNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var headingFont = md3Font(ds, "heading");
  var bodyFont = md3Font(ds, "body");

  var comp = figma.createComponent();
  comp.name = "Top App Bar";
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisAlignItems = "SPACE_BETWEEN";
  comp.counterAxisAlignItems = "CENTER";
  comp.paddingLeft = 4;
  comp.paddingRight = 4;
  comp.fills = [{ type: "SOLID", color: surfaceColor }];
  comp.resize(393, 64);
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";

  // Left: back arrow (MD3 uses a left arrow, not chevron)
  var leftGroup = createAutoLayoutFrame("Nav", "HORIZONTAL", 0);
  leftGroup.primaryAxisAlignItems = "CENTER";
  leftGroup.counterAxisAlignItems = "CENTER";
  leftGroup.fills = [];
  leftGroup.resize(48, 48);
  leftGroup.primaryAxisSizingMode = "FIXED";
  leftGroup.counterAxisSizingMode = "FIXED";
  var backArrow = createChevronLeft(textSecondaryColor, 20);
  leftGroup.appendChild(backArrow);

  // Center: title left-aligned (MD3 default) — wrap in flex-grow frame
  var centerGroup = createAutoLayoutFrame("Title", "HORIZONTAL", 0);
  centerGroup.counterAxisAlignItems = "CENTER";
  centerGroup.fills = [];
  var titleText = await createTextNode(
    "Page Title",
    headingFont,
    "Medium",
    22,
    textPrimaryColor
  );
  centerGroup.appendChild(titleText);

  // Right: action icons
  var rightGroup = createAutoLayoutFrame("Actions", "HORIZONTAL", 0);
  rightGroup.counterAxisAlignItems = "CENTER";
  rightGroup.fills = [];

  var actionBtn1 = figma.createFrame();
  actionBtn1.name = "Action 1";
  actionBtn1.resize(48, 48);
  actionBtn1.fills = [];
  actionBtn1.layoutMode = "HORIZONTAL";
  actionBtn1.primaryAxisAlignItems = "CENTER";
  actionBtn1.counterAxisAlignItems = "CENTER";
  var icon1 = createCircleIcon(textSecondaryColor, 22);
  actionBtn1.appendChild(icon1);

  var actionBtn2 = figma.createFrame();
  actionBtn2.name = "Action 2";
  actionBtn2.resize(48, 48);
  actionBtn2.fills = [];
  actionBtn2.layoutMode = "HORIZONTAL";
  actionBtn2.primaryAxisAlignItems = "CENTER";
  actionBtn2.counterAxisAlignItems = "CENTER";
  var icon2 = createCircleIcon(textSecondaryColor, 22);
  actionBtn2.appendChild(icon2);

  rightGroup.appendChild(actionBtn1);
  rightGroup.appendChild(actionBtn2);

  comp.appendChild(leftGroup);
  comp.appendChild(centerGroup);
  centerGroup.layoutGrow = 1;
  comp.appendChild(rightGroup);

  return comp;
}

// ---------------------------------------------------------------------------
// 6. MD3 Divider + Header — simple labeled divider row
//    No direct iOS equivalent; used as a section label/divider in lists
// ---------------------------------------------------------------------------

async function createMd3DividerHeaderComponent(ds: DesignSystem): Promise<ComponentNode> {
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var borderColor = hexToRgb(getColorToken(ds, "border"));
  var bodyFont = md3Font(ds, "body");

  var comp = figma.createComponent();
  comp.name = "List Subheader";
  comp.layoutMode = "VERTICAL";
  comp.primaryAxisAlignItems = "MIN";
  comp.counterAxisAlignItems = "MIN";
  comp.paddingLeft = 16;
  comp.paddingRight = 16;
  comp.paddingTop = 0;
  comp.paddingBottom = 0;
  comp.fills = [];
  comp.resize(393, 48);
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";

  var label = await createTextNode(
    "Section Title",
    bodyFont,
    "Medium",
    14,
    textSecondaryColor
  );
  label.layoutGrow = 0;
  comp.appendChild(label);
  label.layoutSizingHorizontal = "FILL";

  // Full-width divider at bottom
  var divider = figma.createRectangle();
  divider.name = "Divider";
  divider.resize(393, 1);
  divider.fills = [{ type: "SOLID", color: borderColor }];
  comp.appendChild(divider);
  divider.layoutSizingHorizontal = "FILL";

  return comp;
}

// ---------------------------------------------------------------------------
// 7. MD3 List Item — 3 variants: 1-Line, 2-Line, 3-Line
//    MD3: leading icon circle (40dp), trailing text, divider between items
// ---------------------------------------------------------------------------

async function createMd3ListItemSet(ds: DesignSystem): Promise<ComponentSetNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var borderColor = hexToRgb(getColorToken(ds, "border"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var bodyFont = md3Font(ds, "body");

  var variants = [
    { name: "1-Line", lines: 1, height: 56 },
    { name: "2-Line", lines: 2, height: 72 },
    { name: "3-Line", lines: 3, height: 88 },
  ];
  var components: ComponentNode[] = [];

  for (var i = 0; i < variants.length; i++) {
    var v = variants[i];
    var comp = figma.createComponent();
    comp.name = "Lines=" + v.name;
    comp.layoutMode = "HORIZONTAL";
    comp.counterAxisAlignItems = "CENTER";
    comp.itemSpacing = 16;
    comp.paddingLeft = 16;
    comp.paddingRight = 16;
    comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    comp.strokes = [{ type: "SOLID", color: borderColor }];
    comp.strokeTopWeight = 0;
    comp.strokeRightWeight = 0;
    comp.strokeBottomWeight = 1;
    comp.strokeLeftWeight = 0;
    comp.resize(393, v.height);
    comp.primaryAxisSizingMode = "FIXED";
    comp.counterAxisSizingMode = "FIXED";

    // Leading icon — 40dp circle (MD3 style)
    var iconCircle = figma.createEllipse();
    iconCircle.name = "Leading Icon";
    iconCircle.resize(40, 40);
    iconCircle.fills = [{ type: "SOLID", color: surfaceColor }];
    comp.appendChild(iconCircle);

    // Text stack
    var textStack = createAutoLayoutFrame("Text", "VERTICAL", 2);
    textStack.fills = [];
    textStack.counterAxisAlignItems = "MIN";

    var headline = await createTextNode(
      "List Item Headline",
      bodyFont,
      "Regular",
      16,
      textPrimaryColor
    );
    textStack.appendChild(headline);
    headline.layoutSizingHorizontal = "FILL";

    if (v.lines >= 2) {
      var supporting = await createTextNode(
        "Supporting text",
        bodyFont,
        "Regular",
        14,
        textSecondaryColor
      );
      textStack.appendChild(supporting);
      supporting.layoutSizingHorizontal = "FILL";
    }

    if (v.lines >= 3) {
      var extra = await createTextNode(
        "Additional detail text",
        bodyFont,
        "Regular",
        14,
        textSecondaryColor
      );
      textStack.appendChild(extra);
      extra.layoutSizingHorizontal = "FILL";
    }

    comp.appendChild(textStack);
    textStack.layoutGrow = 1;

    // Trailing text
    var trailingText = await createTextNode(
      "100+",
      bodyFont,
      "Regular",
      14,
      textSecondaryColor
    );
    comp.appendChild(trailingText);

    components.push(comp);
  }

  var set = figma.combineAsVariants(components, figma.currentPage);
  set.name = "MD3 List Item";
  applyComponentSetStyle(set, false);
  return set;
}

// ---------------------------------------------------------------------------
// 8. MD3 Card — 3 variants: Elevated, Filled, Outlined
//    MD3: 12px corner radius, distinct surface treatment per variant
// ---------------------------------------------------------------------------

async function createMd3CardSet(ds: DesignSystem): Promise<ComponentSetNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var tonalBg = tonalSurface(primaryColor);
  var borderColor = hexToRgb(getColorToken(ds, "border"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var headingFont = md3Font(ds, "heading");
  var bodyFont = md3Font(ds, "body");

  var cardStyles = [
    {
      name: "Elevated",
      fill: { r: 1, g: 1, b: 1 } as RGB,
      hasBorder: false,
      hasShadow: true,
    },
    {
      name: "Filled",
      fill: surfaceColor,
      hasBorder: false,
      hasShadow: false,
    },
    {
      name: "Outlined",
      fill: { r: 1, g: 1, b: 1 } as RGB,
      hasBorder: true,
      hasShadow: false,
    },
  ];

  var components: ComponentNode[] = [];

  for (var i = 0; i < cardStyles.length; i++) {
    var cs = cardStyles[i];
    var comp = figma.createComponent();
    comp.name = "Style=" + cs.name;
    comp.layoutMode = "VERTICAL";
    comp.itemSpacing = 8;
    comp.primaryAxisAlignItems = "MIN";
    comp.counterAxisAlignItems = "MIN";
    comp.paddingLeft = 16;
    comp.paddingRight = 16;
    comp.paddingTop = 16;
    comp.paddingBottom = 16;
    comp.cornerRadius = 12;
    comp.fills = [{ type: "SOLID", color: cs.fill }];
    comp.resize(361, 120);
    comp.primaryAxisSizingMode = "AUTO";
    comp.counterAxisSizingMode = "FIXED";

    if (cs.hasBorder) {
      comp.strokes = [{ type: "SOLID", color: borderColor }];
      comp.strokeWeight = 1;
    }

    if (cs.hasShadow) {
      applyMd3Elevation(comp);
    }

    var titleText = await createTextNode(
      "Card Title",
      headingFont,
      "Medium",
      16,
      textPrimaryColor
    );
    comp.appendChild(titleText);
    titleText.layoutSizingHorizontal = "FILL";

    var subText = await createTextNode(
      "Subhead",
      bodyFont,
      "Regular",
      14,
      textSecondaryColor
    );
    comp.appendChild(subText);
    subText.layoutSizingHorizontal = "FILL";

    var bodyText = await createTextNode(
      "Card body text that provides supporting information.",
      bodyFont,
      "Regular",
      14,
      textSecondaryColor
    );
    bodyText.textAutoResize = "HEIGHT";
    comp.appendChild(bodyText);
    bodyText.layoutSizingHorizontal = "FILL";

    components.push(comp);
  }

  var set = figma.combineAsVariants(components, figma.currentPage);
  set.name = "MD3 Card";
  applyComponentSetStyle(set, true);
  return set;
}

// ---------------------------------------------------------------------------
// 9. MD3 Switch — 2 variants: On, Off
//    MD3: 52x32 track, 28x28 thumb, thumb has icon dot inside
// ---------------------------------------------------------------------------

async function createMd3SwitchSet(ds: DesignSystem): Promise<ComponentSetNode> {
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var borderColor = hexToRgb(getColorToken(ds, "border"));

  var components: ComponentNode[] = [];
  var states = ["On", "Off"];

  for (var i = 0; i < states.length; i++) {
    var state = states[i];
    var isOn = state === "On";

    var comp = figma.createComponent();
    comp.name = "State=" + state;
    comp.resize(52, 32);
    comp.fills = [];
    comp.clipsContent = false;

    // Track
    var track = figma.createRectangle();
    track.name = "Track";
    track.resize(52, 32);
    track.cornerRadius = 16;

    if (isOn) {
      track.fills = [{ type: "SOLID", color: primaryColor }];
    } else {
      track.fills = [{ type: "SOLID", color: { r: 0.91, g: 0.91, b: 0.91 } }];
      track.strokes = [{ type: "SOLID", color: borderColor }];
      track.strokeWeight = 2;
    }
    comp.appendChild(track);

    // Thumb — MD3 is 28x28 (on) or 16x16 (off rest state, simplified to 20x20)
    var thumb = figma.createEllipse();
    thumb.name = "Thumb";
    var thumbSize = isOn ? 24 : 20;
    thumb.resize(thumbSize, thumbSize);
    thumb.fills = [{ type: "SOLID", color: isOn ? { r: 1, g: 1, b: 1 } : surfaceColor }];
    thumb.effects = [
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.15 },
        offset: { x: 0, y: 2 },
        radius: 4,
        spread: 0,
        visible: true,
        blendMode: "NORMAL",
      },
    ];

    if (isOn) {
      thumb.x = 52 - thumbSize - 4;
      thumb.y = (32 - thumbSize) / 2;
    } else {
      thumb.x = 4 + (16 - thumbSize) / 2;
      thumb.y = (32 - thumbSize) / 2;
    }
    comp.appendChild(thumb);

    components.push(comp);
  }

  var set = figma.combineAsVariants(components, figma.currentPage);
  set.name = "MD3 Switch";
  applyComponentSetStyle(set, false);
  return set;
}

// ---------------------------------------------------------------------------
// 10. MD3 Badge — 2 variants: Dot (small), Count (with number)
//     MD3: 6dp dot, or pill with number (16dp height)
// ---------------------------------------------------------------------------

async function createMd3BadgeSet(ds: DesignSystem): Promise<ComponentSetNode> {
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var bodyFont = md3Font(ds, "body");

  var components: ComponentNode[] = [];

  // Small dot badge
  var dotComp = figma.createComponent();
  dotComp.name = "Type=Dot";
  dotComp.resize(6, 6);
  dotComp.fills = [{ type: "SOLID", color: primaryColor }];
  // createComponent returns a frame — treat it like one
  var dotFrame = dotComp as unknown as RectangleNode;
  (dotComp as unknown as FrameNode).cornerRadius = 3;
  components.push(dotComp);

  // Count badge (pill)
  var countComp = figma.createComponent();
  countComp.name = "Type=Count";
  countComp.layoutMode = "HORIZONTAL";
  countComp.primaryAxisAlignItems = "CENTER";
  countComp.counterAxisAlignItems = "CENTER";
  countComp.paddingLeft = 4;
  countComp.paddingRight = 4;
  countComp.cornerRadius = 8;
  countComp.fills = [{ type: "SOLID", color: primaryColor }];
  countComp.resize(32, 16);
  countComp.primaryAxisSizingMode = "AUTO";
  countComp.counterAxisSizingMode = "FIXED";

  var countText = await createTextNode(
    "99+",
    bodyFont,
    "Medium",
    11,
    { r: 1, g: 1, b: 1 }
  );
  countComp.appendChild(countText);
  components.push(countComp);

  var set = figma.combineAsVariants(components, figma.currentPage);
  set.name = "MD3 Badge";
  applyComponentSetStyle(set, false);
  return set;
}

// ---------------------------------------------------------------------------
// 11. MD3 Navigation Bar Item — 2 variants: Active, Inactive
//     MD3: 64dp height, active indicator pill behind icon, label below
// ---------------------------------------------------------------------------

async function createMd3NavBarItemSet(ds: DesignSystem): Promise<ComponentSetNode> {
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var tonalBg = tonalSurface(primaryColor);
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var bodyFont = md3Font(ds, "body");

  var components: ComponentNode[] = [];
  var tabStates = [
    { name: "Active", iconColor: primaryColor, labelColor: textPrimaryColor, hasPill: true },
    { name: "Inactive", iconColor: textSecondaryColor, labelColor: textSecondaryColor, hasPill: false },
  ];

  for (var i = 0; i < tabStates.length; i++) {
    var ts = tabStates[i];
    var comp = figma.createComponent();
    comp.name = "State=" + ts.name;
    comp.layoutMode = "VERTICAL";
    comp.itemSpacing = 4;
    comp.primaryAxisAlignItems = "CENTER";
    comp.counterAxisAlignItems = "CENTER";
    comp.paddingLeft = 12;
    comp.paddingRight = 12;
    comp.paddingTop = 12;
    comp.paddingBottom = 16;
    comp.fills = [];

    // Active indicator pill — 64x32 behind the icon
    var indicatorWrapper = createAutoLayoutFrame("Indicator", "HORIZONTAL", 0);
    indicatorWrapper.primaryAxisAlignItems = "CENTER";
    indicatorWrapper.counterAxisAlignItems = "CENTER";
    indicatorWrapper.fills = [];
    indicatorWrapper.resize(64, 32);
    indicatorWrapper.primaryAxisSizingMode = "FIXED";
    indicatorWrapper.counterAxisSizingMode = "FIXED";

    if (ts.hasPill) {
      indicatorWrapper.cornerRadius = 16;
      indicatorWrapper.fills = [{ type: "SOLID", color: tonalBg }];
    }

    var iconCircle = createCircleIcon(ts.iconColor, 24);
    indicatorWrapper.appendChild(iconCircle);
    comp.appendChild(indicatorWrapper);

    var label = await createTextNode(
      "Label",
      bodyFont,
      "Medium",
      12,
      ts.labelColor
    );
    comp.appendChild(label);
    components.push(comp);
  }

  var set = figma.combineAsVariants(components, figma.currentPage);
  set.name = "MD3 Nav Bar Item";
  applyComponentSetStyle(set, false);
  return set;
}

// ---------------------------------------------------------------------------
// 12. MD3 Bottom App Bar — single component
//     MD3: 80dp, FAB integrated (right side), action icons left
// ---------------------------------------------------------------------------

async function createMd3BottomAppBarComponent(ds: DesignSystem): Promise<ComponentNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));

  var comp = figma.createComponent();
  comp.name = "Bottom App Bar";
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisAlignItems = "SPACE_BETWEEN";
  comp.counterAxisAlignItems = "CENTER";
  comp.paddingLeft = 4;
  comp.paddingRight = 16;
  comp.paddingTop = 0;
  comp.paddingBottom = 0;
  comp.fills = [{ type: "SOLID", color: surfaceColor }];
  comp.resize(393, 80);
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  applyMd3Elevation(comp);

  // Left: action icon buttons (48x48 each)
  var actionsGroup = createAutoLayoutFrame("Actions", "HORIZONTAL", 0);
  actionsGroup.counterAxisAlignItems = "CENTER";
  actionsGroup.fills = [];

  for (var i = 0; i < 3; i++) {
    var actionBtn = figma.createFrame();
    actionBtn.name = "Action " + (i + 1);
    actionBtn.resize(48, 48);
    actionBtn.fills = [];
    actionBtn.layoutMode = "HORIZONTAL";
    actionBtn.primaryAxisAlignItems = "CENTER";
    actionBtn.counterAxisAlignItems = "CENTER";
    var actionIcon = createCircleIcon(textSecondaryColor, 22);
    actionBtn.appendChild(actionIcon);
    actionsGroup.appendChild(actionBtn);
  }

  comp.appendChild(actionsGroup);

  // Right: FAB (56dp, 16px radius)
  var fab = figma.createFrame();
  fab.name = "FAB";
  fab.resize(56, 56);
  fab.cornerRadius = 16;
  fab.fills = [{ type: "SOLID", color: primaryColor }];
  fab.layoutMode = "HORIZONTAL";
  fab.primaryAxisAlignItems = "CENTER";
  fab.counterAxisAlignItems = "CENTER";
  applyMd3Elevation(fab);

  var fabIcon = createCircleIcon({ r: 1, g: 1, b: 1 }, 24);
  fab.appendChild(fabIcon);

  comp.appendChild(fab);

  return comp;
}

// ---------------------------------------------------------------------------
// 13. MD3 Menu — single component
//     MD3: elevated surface, 4dp corner radius, no vibrancy, text-only items
// ---------------------------------------------------------------------------

async function createMd3MenuComponent(ds: DesignSystem): Promise<ComponentNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var borderColor = hexToRgb(getColorToken(ds, "border"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var destructiveColor = hexToRgb(getColorToken(ds, "destructive"));
  var bodyFont = md3Font(ds, "body");

  var comp = figma.createComponent();
  comp.name = "Menu";
  comp.layoutMode = "VERTICAL";
  comp.itemSpacing = 0;
  comp.paddingTop = 8;
  comp.paddingBottom = 8;
  // MD3 menu uses small corner radius
  comp.cornerRadius = 4;
  comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  comp.resize(200, 100);
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "FIXED";
  applyMd3Elevation(comp);

  var items = [
    { label: "Edit", iconFn: createPencilIcon, isDestructive: false },
    { label: "Share", iconFn: createShareIcon, isDestructive: false },
    { label: "Delete", iconFn: createTrashIcon, isDestructive: true },
  ];

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var row = createAutoLayoutFrame("Row", "HORIZONTAL", 12);
    row.counterAxisAlignItems = "CENTER";
    row.paddingLeft = 12;
    row.paddingRight = 12;
    row.paddingTop = 0;
    row.paddingBottom = 0;
    row.fills = [];
    row.resize(200, 48);
    row.primaryAxisSizingMode = "FIXED";
    row.counterAxisSizingMode = "FIXED";

    var textColor = item.isDestructive ? destructiveColor : textPrimaryColor;
    var iconColor = item.isDestructive ? destructiveColor : textSecondaryColor;

    var iconNode = item.iconFn(iconColor, 18);
    row.appendChild(iconNode);

    var labelText = await createTextNode(
      item.label,
      bodyFont,
      "Regular",
      14,
      textColor
    );
    row.appendChild(labelText);
    labelText.layoutGrow = 1;

    comp.appendChild(row);
    row.layoutSizingHorizontal = "FILL";
  }

  return comp;
}

// ---------------------------------------------------------------------------
// 14. MD3 Bottom Sheet — single component
//     MD3: drag handle at top, rounded top corners (28px), full-width
// ---------------------------------------------------------------------------

async function createMd3BottomSheetComponent(ds: DesignSystem): Promise<ComponentNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var borderColor = hexToRgb(getColorToken(ds, "border"));
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var headingFont = md3Font(ds, "heading");
  var bodyFont = md3Font(ds, "body");

  var comp = figma.createComponent();
  comp.name = "Bottom Sheet";
  comp.layoutMode = "VERTICAL";
  comp.itemSpacing = 0;
  comp.counterAxisAlignItems = "CENTER";
  // MD3: top corners 28px, bottom corners 0
  comp.topLeftRadius = 28;
  comp.topRightRadius = 28;
  comp.bottomLeftRadius = 0;
  comp.bottomRightRadius = 0;
  comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  comp.resize(393, 320);
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  applyMd3Elevation(comp);

  // Drag handle
  var handleRow = createAutoLayoutFrame("Handle Row", "HORIZONTAL", 0);
  handleRow.primaryAxisAlignItems = "CENTER";
  handleRow.counterAxisAlignItems = "CENTER";
  handleRow.paddingTop = 12;
  handleRow.paddingBottom = 8;
  handleRow.fills = [];
  handleRow.resize(393, 40);
  handleRow.primaryAxisSizingMode = "FIXED";
  handleRow.counterAxisSizingMode = "FIXED";

  var handle = figma.createRectangle();
  handle.name = "Handle";
  handle.resize(32, 4);
  handle.cornerRadius = 2;
  handle.fills = [{ type: "SOLID", color: borderColor }];
  handleRow.appendChild(handle);
  comp.appendChild(handleRow);
  handleRow.layoutSizingHorizontal = "FILL";

  // Title row
  var titleRow = createAutoLayoutFrame("Title Row", "HORIZONTAL", 0);
  titleRow.paddingLeft = 24;
  titleRow.paddingRight = 24;
  titleRow.paddingTop = 8;
  titleRow.paddingBottom = 16;
  titleRow.fills = [];

  var titleText = await createTextNode(
    "Sheet Title",
    headingFont,
    "Medium",
    24,
    textPrimaryColor
  );
  titleRow.appendChild(titleText);
  comp.appendChild(titleRow);
  titleRow.layoutSizingHorizontal = "FILL";

  // Action rows
  var actions = ["Action One", "Action Two", "Action Three"];
  for (var i = 0; i < actions.length; i++) {
    var actionRow = createAutoLayoutFrame("Action " + (i + 1), "HORIZONTAL", 16);
    actionRow.counterAxisAlignItems = "CENTER";
    actionRow.paddingLeft = 24;
    actionRow.paddingRight = 24;
    actionRow.paddingTop = 0;
    actionRow.paddingBottom = 0;
    actionRow.fills = [];
    actionRow.resize(393, 56);
    actionRow.primaryAxisSizingMode = "FIXED";
    actionRow.counterAxisSizingMode = "FIXED";

    var actionIcon = createCircleIcon(textSecondaryColor, 22);
    actionRow.appendChild(actionIcon);

    var actionText = await createTextNode(
      actions[i],
      bodyFont,
      "Regular",
      16,
      textPrimaryColor
    );
    actionRow.appendChild(actionText);
    comp.appendChild(actionRow);
    actionRow.layoutSizingHorizontal = "FILL";
  }

  return comp;
}

// ---------------------------------------------------------------------------
// 15. MD3 Dialog — single component
//     MD3: 280pt wide, 28px corner radius, text-button actions right-aligned
// ---------------------------------------------------------------------------

async function createMd3DialogComponent(ds: DesignSystem): Promise<ComponentNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var headingFont = md3Font(ds, "heading");
  var bodyFont = md3Font(ds, "body");

  var comp = figma.createComponent();
  comp.name = "Dialog";
  comp.layoutMode = "VERTICAL";
  comp.itemSpacing = 0;
  comp.primaryAxisAlignItems = "MIN";
  comp.counterAxisAlignItems = "MIN";
  // MD3: 28px corner radius for dialogs
  comp.cornerRadius = 28;
  comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  comp.resize(280, 100);
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "FIXED";
  applyMd3Elevation(comp);

  // Content area
  var contentArea = createAutoLayoutFrame("Content", "VERTICAL", 16);
  contentArea.primaryAxisAlignItems = "MIN";
  contentArea.counterAxisAlignItems = "MIN";
  contentArea.paddingTop = 24;
  contentArea.paddingBottom = 0;
  contentArea.paddingLeft = 24;
  contentArea.paddingRight = 24;
  contentArea.fills = [];

  var titleText = await createTextNode(
    "Dialog Title",
    headingFont,
    "Medium",
    24,
    textPrimaryColor
  );
  contentArea.appendChild(titleText);
  titleText.layoutSizingHorizontal = "FILL";

  var bodyText = await createTextNode(
    "This dialog communicates important information to the user. Dialogs can be dismissed by tapping outside or pressing the button.",
    bodyFont,
    "Regular",
    14,
    textSecondaryColor
  );
  bodyText.textAutoResize = "HEIGHT";
  contentArea.appendChild(bodyText);
  bodyText.layoutSizingHorizontal = "FILL";

  comp.appendChild(contentArea);
  contentArea.layoutSizingHorizontal = "FILL";

  // Action row — right-aligned text buttons (MD3 standard)
  var actionRow = createAutoLayoutFrame("Actions", "HORIZONTAL", 8);
  actionRow.primaryAxisAlignItems = "MAX";
  actionRow.counterAxisAlignItems = "CENTER";
  actionRow.paddingLeft = 24;
  actionRow.paddingRight = 24;
  actionRow.paddingTop = 24;
  actionRow.paddingBottom = 24;
  actionRow.fills = [];

  var cancelText = await createTextNode(
    "Dismiss",
    bodyFont,
    "Medium",
    14,
    primaryColor
  );
  actionRow.appendChild(cancelText);

  var confirmText = await createTextNode(
    "Confirm",
    bodyFont,
    "Medium",
    14,
    primaryColor
  );
  actionRow.appendChild(confirmText);

  comp.appendChild(actionRow);
  actionRow.layoutSizingHorizontal = "FILL";

  return comp;
}

// ---------------------------------------------------------------------------
// Main Export — Android device column
// ---------------------------------------------------------------------------

/** Device display name labels for Android devices */
var ANDROID_DEVICE_LABELS: Record<string, string> = {
  phone: "Phone",
  tablet: "Tablet",
  watch: "Watch",
  tv: "TV",
  desktop: "Desktop",
  foldable: "Foldable",
};

/**
 * Generates a full Material Design 3 component column for a given Android device.
 * Mirrors the structure of generateDeviceColumn in componentGenerator.ts but
 * uses MD3-specific component creators throughout.
 */
export async function generateAndroidDeviceColumn(
  ds: DesignSystem,
  deviceLabel: string
): Promise<FrameNode> {
  var column = createSectionFrame(deviceLabel + " MD3 Component Library");
  column.clipsContent = false;

  var subtitle = await createLabel(deviceLabel + " — Material Design 3", 16, COLORS.textPrimary);
  column.appendChild(subtitle);

  var buttonSet = await createMd3ButtonSet(ds);
  column.appendChild(await createLabeledWrapper("MD3 Button", buttonSet));

  var textFieldSet = await createMd3TextFieldSet(ds);
  column.appendChild(await createLabeledWrapper("MD3 Text Field", textFieldSet));

  var searchBarSet = await createMd3SearchBarSet(ds);
  column.appendChild(await createLabeledWrapper("MD3 Search Bar", searchBarSet));

  var segmentedSet = await createMd3SegmentedButtonSet(ds);
  column.appendChild(await createLabeledWrapper("MD3 Segmented Button", segmentedSet));

  var topAppBar = await createMd3TopAppBarComponent(ds);
  column.appendChild(await createLabeledWrapper("Top App Bar", topAppBar));

  var subheader = await createMd3DividerHeaderComponent(ds);
  column.appendChild(await createLabeledWrapper("List Subheader", subheader));

  var listItemSet = await createMd3ListItemSet(ds);
  column.appendChild(await createLabeledWrapper("MD3 List Item", listItemSet));

  var cardSet = await createMd3CardSet(ds);
  column.appendChild(await createLabeledWrapper("MD3 Card", cardSet, true));

  var switchSet = await createMd3SwitchSet(ds);
  column.appendChild(await createLabeledWrapper("MD3 Switch", switchSet));

  var badgeSet = await createMd3BadgeSet(ds);
  column.appendChild(await createLabeledWrapper("MD3 Badge", badgeSet));

  var navBarItemSet = await createMd3NavBarItemSet(ds);
  column.appendChild(await createLabeledWrapper("MD3 Nav Bar Item", navBarItemSet));

  var bottomAppBar = await createMd3BottomAppBarComponent(ds);
  column.appendChild(await createLabeledWrapper("Bottom App Bar", bottomAppBar));

  var menu = await createMd3MenuComponent(ds);
  column.appendChild(await createLabeledWrapper("MD3 Menu", menu, true));

  var bottomSheet = await createMd3BottomSheetComponent(ds);
  column.appendChild(await createLabeledWrapper("MD3 Bottom Sheet", bottomSheet));

  var dialog = await createMd3DialogComponent(ds);
  column.appendChild(await createLabeledWrapper("MD3 Dialog", dialog, true));

  return column;
}
