import { DesignSystem } from "../parser/types";
import {
  hexToRgb,
  createAutoLayoutFrame,
  createTextNode,
  createSectionTitle,
  createSectionFrame,
  appendFill,
  loadFontSafe,
  createLabel,
} from "./shared";
import {
  getColorToken,
  getRadiusToken,
  getSpacingToken,
  getTypographyToken,
  weightToFigmaStyle,
  getFirstShadow,
} from "./tokenResolver";
import {
  COLORS,
  FONTS,
  COMPONENT_SET_PADDING,
  COMPONENT_SET_SHADOW_PADDING,
  WRAPPER_PADDING,
  WRAPPER_SPACING,
} from "../constants";
import {
  createChevronLeft,
  createChevronRight,
  createEllipsisIcon,
  createSearchIcon,
  createCloseIcon,
  createInfoCircle,
  createPencilIcon,
  createDuplicateIcon,
  createShareIcon,
  createTrashIcon,
  createCircleIcon,
} from "./icons";
import { generateAndroidDeviceColumn } from "./androidComponentGenerator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function hexToAlpha(hex: string): number {
  const h = hex.replace("#", "");
  if (h.length === 8) {
    return parseInt(h.slice(6, 8), 16) / 255;
  }
  return 0.15;
}

function applyCardShadow(node: ComponentNode | FrameNode, ds: DesignSystem): void {
  var shadow = getFirstShadow(ds);
  if (shadow) {
    var sc = hexToRgb(shadow.color);
    node.effects = [{
      type: "DROP_SHADOW",
      color: { r: sc.r, g: sc.g, b: sc.b, a: hexToAlpha(shadow.color) },
      offset: { x: shadow.x, y: shadow.y },
      radius: shadow.blur,
      spread: shadow.spread,
      visible: true,
      blendMode: "NORMAL",
    }];
  } else {
    node.effects = [{
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.15 },
      offset: { x: 0, y: 4 },
      radius: 12,
      spread: 0,
      visible: true,
      blendMode: "NORMAL",
    }];
  }
}

// ---------------------------------------------------------------------------
// 1. Button — 8 variants (Filled/Tinted/Text/Destructive × Default/Disabled)
//    iOS: 50pt height, 25pt capsule radius, 20pt h-padding, 17pt semibold
// ---------------------------------------------------------------------------

async function createButtonSet(ds: DesignSystem): Promise<ComponentSetNode> {
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var destructiveColor = hexToRgb(getColorToken(ds, "destructive"));
  var labelTypo = getTypographyToken(ds, "label");

  var tintedBg = {
    r: primaryColor.r * 0.15 + 0.85,
    g: primaryColor.g * 0.15 + 0.85,
    b: primaryColor.b * 0.15 + 0.85,
  };

  var styles = [
    { name: "Filled", fill: primaryColor, textColor: { r: 1, g: 1, b: 1 } },
    { name: "Tinted", fill: tintedBg, textColor: primaryColor },
    { name: "Text", fill: null, textColor: primaryColor },
    { name: "Destructive", fill: destructiveColor, textColor: { r: 1, g: 1, b: 1 } },
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
      comp.paddingLeft = 20;
      comp.paddingRight = 20;
      comp.cornerRadius = 25;
      comp.fills = style.fill ? [{ type: "SOLID", color: style.fill }] : [];
      comp.resize(120, 50);
      comp.primaryAxisSizingMode = "AUTO";
      comp.counterAxisSizingMode = "FIXED";

      if (isDisabled) {
        comp.opacity = 0.4;
      }

      var label = style.name === "Destructive" ? "Delete" : style.name + " Button";
      var text = await createTextNode(
        label,
        labelTypo.fontFamily,
        "Semi Bold",
        17,
        style.textColor
      );
      comp.appendChild(text);
      components.push(comp);
    }
  }

  var set = figma.combineAsVariants(components, figma.currentPage);
  set.name = "Button";
  applyComponentSetStyle(set, false);
  return set;
}

// ---------------------------------------------------------------------------
// 2. TextField — 2 variants (Default, Error)
//    iOS: 44pt, 10pt radius, no border (surface fill), no focus ring
// ---------------------------------------------------------------------------

async function createTextFieldSet(ds: DesignSystem): Promise<ComponentSetNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var destructiveColor = hexToRgb(getColorToken(ds, "destructive"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var bodyTypo = getTypographyToken(ds, "body");

  var components: ComponentNode[] = [];
  var states = ["Default", "Error"];

  for (var i = 0; i < states.length; i++) {
    var state = states[i];
    var comp = figma.createComponent();
    comp.name = "State=" + state;
    comp.layoutMode = "HORIZONTAL";
    comp.primaryAxisAlignItems = "MIN";
    comp.counterAxisAlignItems = "CENTER";
    comp.paddingLeft = 12;
    comp.paddingRight = 12;
    comp.paddingTop = 11;
    comp.paddingBottom = 11;
    comp.cornerRadius = 10;
    comp.fills = [{ type: "SOLID", color: surfaceColor }];
    comp.resize(361, 44);

    if (state === "Error") {
      comp.strokes = [{ type: "SOLID", color: destructiveColor }];
      comp.strokeWeight = 1;
    }

    var placeholder = await createTextNode(
      "Placeholder",
      bodyTypo.fontFamily,
      weightToFigmaStyle(bodyTypo.fontWeight),
      17,
      textSecondaryColor
    );
    comp.appendChild(placeholder);
    components.push(comp);
  }

  var set = figma.combineAsVariants(components, figma.currentPage);
  set.name = "Text Field";
  applyComponentSetStyle(set, false);
  return set;
}

// ---------------------------------------------------------------------------
// 3. SearchBar — 2 variants (Default, Active)
//    iOS: 36pt, 10pt radius, search icon, cancel button on active
// ---------------------------------------------------------------------------

async function createSearchBarSet(ds: DesignSystem): Promise<ComponentSetNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var bodyTypo = getTypographyToken(ds, "body");

  var components: ComponentNode[] = [];

  // Default
  var defaultComp = figma.createComponent();
  defaultComp.name = "State=Default";
  defaultComp.layoutMode = "HORIZONTAL";
  defaultComp.counterAxisAlignItems = "CENTER";
  defaultComp.itemSpacing = 6;
  defaultComp.paddingLeft = 8;
  defaultComp.paddingRight = 8;
  defaultComp.cornerRadius = 10;
  defaultComp.fills = [{ type: "SOLID", color: surfaceColor }];
  defaultComp.resize(361, 36);

  var searchIcon1 = createSearchIcon(textSecondaryColor, 16);
  defaultComp.appendChild(searchIcon1);
  var placeholder = await createTextNode(
    "Search",
    bodyTypo.fontFamily,
    weightToFigmaStyle(bodyTypo.fontWeight),
    17,
    textSecondaryColor
  );
  defaultComp.appendChild(placeholder);
  components.push(defaultComp);

  // Active — bar + cancel in a wrapper
  var activeComp = figma.createComponent();
  activeComp.name = "State=Active";
  activeComp.layoutMode = "HORIZONTAL";
  activeComp.counterAxisAlignItems = "CENTER";
  activeComp.itemSpacing = 8;
  activeComp.resize(420, 36);
  activeComp.primaryAxisSizingMode = "AUTO";
  activeComp.counterAxisSizingMode = "FIXED";
  activeComp.fills = [];

  // Inner bar frame
  var bar = createAutoLayoutFrame("Bar", "HORIZONTAL", 6);
  bar.counterAxisAlignItems = "CENTER";
  bar.paddingLeft = 8;
  bar.paddingRight = 8;
  bar.cornerRadius = 10;
  bar.fills = [{ type: "SOLID", color: surfaceColor }];
  bar.resize(361, 36);
  bar.primaryAxisSizingMode = "FIXED";
  bar.counterAxisSizingMode = "FIXED";

  var searchIcon2 = createSearchIcon(textSecondaryColor, 16);
  bar.appendChild(searchIcon2);
  var queryText = await createTextNode(
    "Search query",
    bodyTypo.fontFamily,
    weightToFigmaStyle(bodyTypo.fontWeight),
    17,
    textPrimaryColor
  );
  bar.appendChild(queryText);
  queryText.layoutGrow = 1;
  var closeIcon = createCloseIcon(textSecondaryColor, 14);
  bar.appendChild(closeIcon);

  activeComp.appendChild(bar);
  var cancelText = await createTextNode(
    "Cancel",
    bodyTypo.fontFamily,
    weightToFigmaStyle(bodyTypo.fontWeight),
    17,
    primaryColor
  );
  activeComp.appendChild(cancelText);
  components.push(activeComp);

  var set = figma.combineAsVariants(components, figma.currentPage);
  set.name = "Search Bar";
  applyComponentSetStyle(set, false);
  return set;
}

// ---------------------------------------------------------------------------
// 4. SegmentedControl — 3 variants (Selection=First/Second/Third)
//    iOS: 32pt, gray bg, white pill for selected, 2pt padding, 0 spacing
// ---------------------------------------------------------------------------

async function createSegmentedControlSet(ds: DesignSystem): Promise<ComponentSetNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var labelTypo = getTypographyToken(ds, "label");

  var segments = ["First", "Second", "Third"];
  var components: ComponentNode[] = [];

  for (var si = 0; si < segments.length; si++) {
    var selected = segments[si];
    var comp = figma.createComponent();
    comp.name = "Selection=" + selected;
    comp.layoutMode = "HORIZONTAL";
    comp.counterAxisAlignItems = "CENTER";
    comp.itemSpacing = 0;
    comp.paddingLeft = 2;
    comp.paddingRight = 2;
    comp.paddingTop = 2;
    comp.paddingBottom = 2;
    comp.cornerRadius = 9;
    comp.fills = [{ type: "SOLID", color: surfaceColor }];
    comp.resize(280, 32);

    for (var j = 0; j < segments.length; j++) {
      var isSelected = segments[j] === selected;
      var seg = createAutoLayoutFrame(segments[j], "HORIZONTAL", 0);
      seg.primaryAxisAlignItems = "CENTER";
      seg.counterAxisAlignItems = "CENTER";
      seg.cornerRadius = 7;
      seg.resize(92, 28);
      seg.primaryAxisSizingMode = "FIXED";
      seg.counterAxisSizingMode = "FIXED";

      if (isSelected) {
        seg.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
        seg.effects = [{
          type: "DROP_SHADOW",
          color: { r: 0, g: 0, b: 0, a: 0.12 },
          offset: { x: 0, y: 1 },
          radius: 3,
          spread: 0,
          visible: true,
          blendMode: "NORMAL",
        }];
      } else {
        seg.fills = [];
      }

      var segLabel = await createTextNode(
        segments[j],
        labelTypo.fontFamily,
        weightToFigmaStyle(labelTypo.fontWeight),
        13,
        isSelected ? textPrimaryColor : textSecondaryColor
      );
      seg.appendChild(segLabel);
      comp.appendChild(seg);
      seg.layoutGrow = 1;
    }

    components.push(comp);
  }

  var set = figma.combineAsVariants(components, figma.currentPage);
  set.name = "Segmented Control";
  applyComponentSetStyle(set, false);
  return set;
}

// ---------------------------------------------------------------------------
// 5. NavBar — single component
//    iOS: 44pt, SPACE_BETWEEN, chevron back + title + ellipsis
// ---------------------------------------------------------------------------

async function createNavBarComponent(ds: DesignSystem): Promise<ComponentNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var headingTypo = getTypographyToken(ds, "heading");
  var bodyTypo = getTypographyToken(ds, "body");

  var comp = figma.createComponent();
  comp.name = "Navigation Bar";
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisAlignItems = "SPACE_BETWEEN";
  comp.counterAxisAlignItems = "CENTER";
  comp.paddingLeft = 16;
  comp.paddingRight = 16;
  comp.fills = [{ type: "SOLID", color: surfaceColor }];
  comp.resize(393, 44);

  // Left: chevron + Back
  var leftGroup = createAutoLayoutFrame("Left", "HORIZONTAL", 6);
  leftGroup.counterAxisAlignItems = "CENTER";
  leftGroup.fills = [];
  var chevron = createChevronLeft(primaryColor, 18);
  leftGroup.appendChild(chevron);
  var backText = await createTextNode(
    "Back",
    bodyTypo.fontFamily,
    weightToFigmaStyle(bodyTypo.fontWeight),
    17,
    primaryColor
  );
  leftGroup.appendChild(backText);

  // Center: title
  var titleText = await createTextNode(
    "Title",
    headingTypo.fontFamily,
    "Semi Bold",
    17,
    textPrimaryColor
  );

  // Right: ellipsis in circle
  var rightCircle = figma.createFrame();
  rightCircle.name = "More";
  rightCircle.resize(28, 28);
  rightCircle.cornerRadius = 14;
  rightCircle.fills = [{ type: "SOLID", color: surfaceColor }];
  rightCircle.layoutMode = "HORIZONTAL";
  rightCircle.primaryAxisAlignItems = "CENTER";
  rightCircle.counterAxisAlignItems = "CENTER";
  var ellipsis = createEllipsisIcon(primaryColor, 22);
  rightCircle.appendChild(ellipsis);

  comp.appendChild(leftGroup);
  comp.appendChild(titleText);
  comp.appendChild(rightCircle);

  return comp;
}

// ---------------------------------------------------------------------------
// 6. SectionHeader — single component
//    iOS: SPACE_BETWEEN, uppercase label + "See All"
// ---------------------------------------------------------------------------

async function createSectionHeaderComponent(ds: DesignSystem): Promise<ComponentNode> {
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var captionTypo = getTypographyToken(ds, "caption");
  var bodyTypo = getTypographyToken(ds, "body");

  var comp = figma.createComponent();
  comp.name = "Section Header";
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisAlignItems = "SPACE_BETWEEN";
  comp.counterAxisAlignItems = "CENTER";
  comp.paddingLeft = 16;
  comp.paddingRight = 16;
  comp.paddingTop = 6;
  comp.paddingBottom = 6;
  comp.fills = [];
  comp.resize(393, 30);
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "AUTO";

  var leftText = await createTextNode(
    "SECTION TITLE",
    captionTypo.fontFamily,
    weightToFigmaStyle(captionTypo.fontWeight),
    13,
    textSecondaryColor
  );
  comp.appendChild(leftText);

  var rightText = await createTextNode(
    "See All",
    bodyTypo.fontFamily,
    weightToFigmaStyle(bodyTypo.fontWeight),
    15,
    primaryColor
  );
  comp.appendChild(rightText);

  return comp;
}

// ---------------------------------------------------------------------------
// 7. ListCell — 3 variants (Disclosure, Toggle, Detail)
//    iOS: 58pt, 29x29 icon, 0.5pt bottom border, proper accessories
// ---------------------------------------------------------------------------

async function createListCellSet(ds: DesignSystem): Promise<ComponentSetNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var borderColor = hexToRgb(getColorToken(ds, "border"));
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var bodyTypo = getTypographyToken(ds, "body");
  var captionTypo = getTypographyToken(ds, "caption");

  var accessories = ["Disclosure", "Toggle", "Detail"];
  var components: ComponentNode[] = [];

  for (var i = 0; i < accessories.length; i++) {
    var accessory = accessories[i];
    var comp = figma.createComponent();
    comp.name = "Accessory=" + accessory;
    comp.layoutMode = "HORIZONTAL";
    comp.counterAxisAlignItems = "CENTER";
    comp.itemSpacing = 12;
    comp.paddingLeft = 16;
    comp.paddingRight = 16;
    comp.paddingTop = 10;
    comp.paddingBottom = 10;
    comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    comp.strokes = [{ type: "SOLID", color: borderColor }];
    comp.strokeTopWeight = 0;
    comp.strokeRightWeight = 0;
    comp.strokeBottomWeight = 0.5;
    comp.strokeLeftWeight = 0;
    comp.resize(393, 58);

    // Icon placeholder
    var icon = figma.createRectangle();
    icon.name = "Icon";
    icon.resize(29, 29);
    icon.cornerRadius = 6;
    icon.fills = [{ type: "SOLID", color: surfaceColor }];
    comp.appendChild(icon);

    // Text stack
    var textStack = createAutoLayoutFrame("Text", "VERTICAL", 2);
    textStack.fills = [];
    var title = await createTextNode(
      "List Item Title",
      bodyTypo.fontFamily,
      weightToFigmaStyle(bodyTypo.fontWeight),
      17,
      textPrimaryColor
    );
    textStack.appendChild(title);
    var subtitle = await createTextNode(
      "Subtitle text",
      captionTypo.fontFamily,
      weightToFigmaStyle(captionTypo.fontWeight),
      13,
      textSecondaryColor
    );
    textStack.appendChild(subtitle);
    comp.appendChild(textStack);
    textStack.layoutGrow = 1;

    // Accessory
    if (accessory === "Disclosure") {
      var chevron = createChevronRight(textSecondaryColor, 13);
      comp.appendChild(chevron);
    } else if (accessory === "Toggle") {
      // Mini toggle: track + thumb in a non-auto-layout frame
      var toggleFrame = figma.createFrame();
      toggleFrame.name = "Toggle";
      toggleFrame.resize(40, 24);
      toggleFrame.fills = [];
      toggleFrame.clipsContent = false;
      var track = figma.createRectangle();
      track.name = "Track";
      track.resize(40, 24);
      track.cornerRadius = 12;
      track.fills = [{ type: "SOLID", color: primaryColor }];
      toggleFrame.appendChild(track);
      var thumb = figma.createEllipse();
      thumb.name = "Thumb";
      thumb.resize(20, 20);
      thumb.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      thumb.x = 18;
      thumb.y = 2;
      toggleFrame.appendChild(thumb);
      comp.appendChild(toggleFrame);
    } else if (accessory === "Detail") {
      var infoIcon = createInfoCircle(primaryColor, 20);
      comp.appendChild(infoIcon);
    }

    components.push(comp);
  }

  var set = figma.combineAsVariants(components, figma.currentPage);
  set.name = "List Cell";
  applyComponentSetStyle(set, false);
  return set;
}

// ---------------------------------------------------------------------------
// 8. Card — single component
//    iOS: 12pt FIXED radius, surface fill, 0.5pt border, shadow
// ---------------------------------------------------------------------------

async function createCardComponent(ds: DesignSystem): Promise<ComponentNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var borderColor = hexToRgb(getColorToken(ds, "border"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var headingTypo = getTypographyToken(ds, "heading");
  var bodyTypo = getTypographyToken(ds, "body");

  var comp = figma.createComponent();
  comp.name = "Card";
  comp.layoutMode = "VERTICAL";
  comp.itemSpacing = 12;
  comp.primaryAxisAlignItems = "MIN";
  comp.counterAxisAlignItems = "MIN";
  comp.paddingLeft = 16;
  comp.paddingRight = 16;
  comp.paddingTop = 16;
  comp.paddingBottom = 16;
  comp.cornerRadius = 12;
  comp.fills = [{ type: "SOLID", color: surfaceColor }];
  comp.strokes = [{ type: "SOLID", color: borderColor }];
  comp.strokeWeight = 0.5;
  comp.resize(361, 100);
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "FIXED";

  applyCardShadow(comp, ds);

  var titleText = await createTextNode(
    "Card Title",
    headingTypo.fontFamily,
    weightToFigmaStyle(headingTypo.fontWeight),
    17,
    textPrimaryColor
  );
  comp.appendChild(titleText);

  var bodyText = await createTextNode(
    "This is the card body text that provides additional information and context.",
    bodyTypo.fontFamily,
    weightToFigmaStyle(bodyTypo.fontWeight),
    15,
    textSecondaryColor
  );
  bodyText.textAutoResize = "HEIGHT";
  comp.appendChild(bodyText);
  bodyText.layoutSizingHorizontal = "FILL";

  return comp;
}

// ---------------------------------------------------------------------------
// 9. Toggle — 2 variants (On, Off)
//    iOS: 51x31, 15.5pt track radius, 27x27 thumb
// ---------------------------------------------------------------------------

async function createToggleSet(ds: DesignSystem): Promise<ComponentSetNode> {
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var borderColor = hexToRgb(getColorToken(ds, "border"));

  var components: ComponentNode[] = [];
  var states = ["On", "Off"];

  for (var i = 0; i < states.length; i++) {
    var state = states[i];
    var comp = figma.createComponent();
    comp.name = "State=" + state;
    comp.resize(51, 31);
    comp.fills = [];

    var track = figma.createRectangle();
    track.name = "Track";
    track.resize(51, 31);
    track.cornerRadius = 15.5;

    if (state === "On") {
      track.fills = [{ type: "SOLID", color: primaryColor }];
    } else {
      track.fills = [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 } }];
      track.strokes = [{ type: "SOLID", color: borderColor }];
      track.strokeWeight = 1;
    }
    comp.appendChild(track);

    var thumb = figma.createEllipse();
    thumb.name = "Thumb";
    thumb.resize(27, 27);
    thumb.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    thumb.effects = [{
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.15 },
      offset: { x: 0, y: 3 },
      radius: 8,
      spread: 0,
      visible: true,
      blendMode: "NORMAL",
    }];
    thumb.x = state === "On" ? 22 : 2;
    thumb.y = 2;
    comp.appendChild(thumb);

    components.push(comp);
  }

  var set = figma.combineAsVariants(components, figma.currentPage);
  set.name = "Toggle";
  applyComponentSetStyle(set, false);
  return set;
}

// ---------------------------------------------------------------------------
// 10. Badge — 2 variants (Primary, Neutral)
//     iOS: 20pt height, pill radius, 12pt text
// ---------------------------------------------------------------------------

async function createBadgeSet(ds: DesignSystem): Promise<ComponentSetNode> {
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var captionTypo = getTypographyToken(ds, "caption");

  var components: ComponentNode[] = [];
  var badgeStyles = [
    { name: "Primary", fill: primaryColor, textColor: { r: 1, g: 1, b: 1 }, label: "New" },
    { name: "Neutral", fill: surfaceColor, textColor: textPrimaryColor, label: "Info" },
  ];

  for (var i = 0; i < badgeStyles.length; i++) {
    var bs = badgeStyles[i];
    var comp = figma.createComponent();
    comp.name = "Style=" + bs.name;
    comp.layoutMode = "HORIZONTAL";
    comp.primaryAxisAlignItems = "CENTER";
    comp.counterAxisAlignItems = "CENTER";
    comp.paddingLeft = 6;
    comp.paddingRight = 6;
    comp.paddingTop = 2;
    comp.paddingBottom = 2;
    comp.cornerRadius = 10;
    comp.fills = [{ type: "SOLID", color: bs.fill }];
    comp.resize(60, 20);
    comp.primaryAxisSizingMode = "AUTO";
    comp.counterAxisSizingMode = "FIXED";

    var text = await createTextNode(
      bs.label,
      captionTypo.fontFamily,
      weightToFigmaStyle(captionTypo.fontWeight),
      12,
      bs.textColor
    );
    comp.appendChild(text);
    components.push(comp);
  }

  var set = figma.combineAsVariants(components, figma.currentPage);
  set.name = "Badge";
  applyComponentSetStyle(set, false);
  return set;
}

// ---------------------------------------------------------------------------
// 11. TabBarItem — 2 variants (Active, Inactive)
//     iOS: 25pt icon, 10pt label, vertical layout
// ---------------------------------------------------------------------------

async function createTabBarItemSet(ds: DesignSystem): Promise<ComponentSetNode> {
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var labelTypo = getTypographyToken(ds, "label");

  var components: ComponentNode[] = [];
  var tabStates = [
    { name: "Active", color: primaryColor },
    { name: "Inactive", color: textSecondaryColor },
  ];

  for (var i = 0; i < tabStates.length; i++) {
    var ts = tabStates[i];
    var comp = figma.createComponent();
    comp.name = "State=" + ts.name;
    comp.layoutMode = "VERTICAL";
    comp.itemSpacing = 2;
    comp.primaryAxisAlignItems = "CENTER";
    comp.counterAxisAlignItems = "CENTER";
    comp.paddingLeft = 6;
    comp.paddingRight = 6;
    comp.paddingTop = 4;
    comp.paddingBottom = 4;
    comp.fills = [];

    var iconCircle = createCircleIcon(ts.color, 25);
    comp.appendChild(iconCircle);

    var label = await createTextNode(
      "Tab",
      labelTypo.fontFamily,
      "Medium",
      10,
      ts.color
    );
    comp.appendChild(label);
    components.push(comp);
  }

  var set = figma.combineAsVariants(components, figma.currentPage);
  set.name = "Tab Bar Item";
  applyComponentSetStyle(set, false);
  return set;
}

// ---------------------------------------------------------------------------
// 12. Toolbar — single component
//     iOS: 44pt, icon-only items, 0.5pt top border
// ---------------------------------------------------------------------------

async function createToolbarComponent(ds: DesignSystem): Promise<ComponentNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var borderColor = hexToRgb(getColorToken(ds, "border"));
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));

  var comp = figma.createComponent();
  comp.name = "Toolbar";
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisAlignItems = "SPACE_BETWEEN";
  comp.counterAxisAlignItems = "CENTER";
  comp.paddingLeft = 24;
  comp.paddingRight = 24;
  comp.fills = [{ type: "SOLID", color: surfaceColor }];
  comp.strokes = [{ type: "SOLID", color: borderColor }];
  comp.strokeTopWeight = 0.5;
  comp.strokeRightWeight = 0;
  comp.strokeBottomWeight = 0;
  comp.strokeLeftWeight = 0;
  comp.resize(393, 44);

  var icon1 = createCircleIcon(primaryColor, 22);
  var icon2 = createCircleIcon(primaryColor, 22);
  var icon3 = createCircleIcon(primaryColor, 22);
  comp.appendChild(icon1);
  comp.appendChild(icon2);
  comp.appendChild(icon3);

  return comp;
}

// ---------------------------------------------------------------------------
// 13. ContextMenu — single component
//     iOS: 250pt wide, 14pt FIXED radius, 44pt rows, icons on right
// ---------------------------------------------------------------------------

async function createContextMenuComponent(ds: DesignSystem): Promise<ComponentNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var borderColor = hexToRgb(getColorToken(ds, "border"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var destructiveColor = hexToRgb(getColorToken(ds, "destructive"));
  var bodyTypo = getTypographyToken(ds, "body");

  var comp = figma.createComponent();
  comp.name = "Context Menu";
  comp.layoutMode = "VERTICAL";
  comp.itemSpacing = 0;
  comp.paddingTop = 4;
  comp.paddingBottom = 4;
  comp.cornerRadius = 14;
  comp.fills = [{ type: "SOLID", color: surfaceColor }];
  comp.resize(250, 100);
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "FIXED";

  applyCardShadow(comp, ds);

  // Regular items
  var items = [
    { label: "Edit", iconFn: createPencilIcon },
    { label: "Duplicate", iconFn: createDuplicateIcon },
    { label: "Share", iconFn: createShareIcon },
  ];

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var row = createAutoLayoutFrame("Row", "HORIZONTAL", 12);
    row.primaryAxisAlignItems = "SPACE_BETWEEN";
    row.counterAxisAlignItems = "CENTER";
    row.paddingLeft = 12;
    row.paddingRight = 12;
    row.paddingTop = 12;
    row.paddingBottom = 12;
    row.fills = [];
    row.resize(250, 44);
    row.primaryAxisSizingMode = "FIXED";
    row.counterAxisSizingMode = "FIXED";

    // Bottom border on non-last items
    if (i < items.length - 1) {
      row.strokes = [{ type: "SOLID", color: borderColor }];
      row.strokeTopWeight = 0;
      row.strokeRightWeight = 0;
      row.strokeBottomWeight = 0.5;
      row.strokeLeftWeight = 0;
    }

    var labelText = await createTextNode(
      item.label,
      bodyTypo.fontFamily,
      weightToFigmaStyle(bodyTypo.fontWeight),
      15,
      textPrimaryColor
    );
    row.appendChild(labelText);
    labelText.layoutGrow = 1;

    var iconNode = item.iconFn(textSecondaryColor, 16);
    row.appendChild(iconNode);

    comp.appendChild(row);
    row.layoutSizingHorizontal = "FILL";
  }

  // Separator between regular and destructive
  var separator = figma.createRectangle();
  separator.name = "Separator";
  separator.resize(250, 8);
  separator.fills = [{ type: "SOLID", color: borderColor, opacity: 0.3 }];
  comp.appendChild(separator);
  separator.layoutSizingHorizontal = "FILL";

  // Delete row
  var deleteRow = createAutoLayoutFrame("Delete Row", "HORIZONTAL", 12);
  deleteRow.primaryAxisAlignItems = "SPACE_BETWEEN";
  deleteRow.counterAxisAlignItems = "CENTER";
  deleteRow.paddingLeft = 12;
  deleteRow.paddingRight = 12;
  deleteRow.paddingTop = 12;
  deleteRow.paddingBottom = 12;
  deleteRow.fills = [];
  deleteRow.resize(250, 44);
  deleteRow.primaryAxisSizingMode = "FIXED";
  deleteRow.counterAxisSizingMode = "FIXED";

  var deleteLabel = await createTextNode(
    "Delete",
    bodyTypo.fontFamily,
    weightToFigmaStyle(bodyTypo.fontWeight),
    15,
    destructiveColor
  );
  deleteRow.appendChild(deleteLabel);
  deleteLabel.layoutGrow = 1;

  var trashIcon = createTrashIcon(destructiveColor, 16);
  deleteRow.appendChild(trashIcon);

  comp.appendChild(deleteRow);
  deleteRow.layoutSizingHorizontal = "FILL";

  return comp;
}

// ---------------------------------------------------------------------------
// 14. ActionSheet — single component
//     iOS: 14pt FIXED radius, 56pt rows, centered text, cancel separate
// ---------------------------------------------------------------------------

async function createActionSheetComponent(ds: DesignSystem): Promise<ComponentNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var borderColor = hexToRgb(getColorToken(ds, "border"));
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var bodyTypo = getTypographyToken(ds, "body");

  var comp = figma.createComponent();
  comp.name = "Action Sheet";
  comp.layoutMode = "VERTICAL";
  comp.itemSpacing = 8;
  comp.fills = [];
  comp.resize(393, 100);
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "FIXED";

  // Action group
  var actionGroup = createAutoLayoutFrame("Actions", "VERTICAL", 0);
  actionGroup.paddingTop = 4;
  actionGroup.paddingBottom = 4;
  actionGroup.cornerRadius = 14;
  actionGroup.fills = [{ type: "SOLID", color: surfaceColor }];

  var actions = ["Action One", "Action Two", "Action Three"];
  for (var i = 0; i < actions.length; i++) {
    var actionRow = createAutoLayoutFrame("Action", "HORIZONTAL", 0);
    actionRow.primaryAxisAlignItems = "CENTER";
    actionRow.counterAxisAlignItems = "CENTER";
    actionRow.paddingTop = 18;
    actionRow.paddingBottom = 18;
    actionRow.fills = [];
    actionRow.resize(393, 56);
    actionRow.primaryAxisSizingMode = "FIXED";
    actionRow.counterAxisSizingMode = "FIXED";

    if (i < actions.length - 1) {
      actionRow.strokes = [{ type: "SOLID", color: borderColor }];
      actionRow.strokeTopWeight = 0;
      actionRow.strokeRightWeight = 0;
      actionRow.strokeBottomWeight = 0.5;
      actionRow.strokeLeftWeight = 0;
    }

    var actionText = await createTextNode(
      actions[i],
      bodyTypo.fontFamily,
      weightToFigmaStyle(bodyTypo.fontWeight),
      20,
      primaryColor
    );
    actionRow.appendChild(actionText);

    actionGroup.appendChild(actionRow);
    actionRow.layoutSizingHorizontal = "FILL";
  }

  comp.appendChild(actionGroup);
  actionGroup.layoutSizingHorizontal = "FILL";

  // Cancel button
  var cancelBtn = createAutoLayoutFrame("Cancel", "HORIZONTAL", 0);
  cancelBtn.primaryAxisAlignItems = "CENTER";
  cancelBtn.counterAxisAlignItems = "CENTER";
  cancelBtn.cornerRadius = 14;
  cancelBtn.fills = [{ type: "SOLID", color: surfaceColor }];
  cancelBtn.resize(393, 56);
  cancelBtn.primaryAxisSizingMode = "FIXED";
  cancelBtn.counterAxisSizingMode = "FIXED";

  var cancelText = await createTextNode(
    "Cancel",
    bodyTypo.fontFamily,
    "Bold",
    20,
    textPrimaryColor
  );
  cancelBtn.appendChild(cancelText);

  comp.appendChild(cancelBtn);
  cancelBtn.layoutSizingHorizontal = "FILL";

  return comp;
}

// ---------------------------------------------------------------------------
// 15. Alert — single component
//     iOS: 270pt, 14pt FIXED radius, centered text, h-divider + button row
// ---------------------------------------------------------------------------

async function createAlertComponent(ds: DesignSystem): Promise<ComponentNode> {
  var surfaceColor = hexToRgb(getColorToken(ds, "surface"));
  var borderColor = hexToRgb(getColorToken(ds, "border"));
  var primaryColor = hexToRgb(getColorToken(ds, "primary"));
  var textPrimaryColor = hexToRgb(getColorToken(ds, "textPrimary"));
  var textSecondaryColor = hexToRgb(getColorToken(ds, "textSecondary"));
  var headingTypo = getTypographyToken(ds, "heading");
  var bodyTypo = getTypographyToken(ds, "body");

  var comp = figma.createComponent();
  comp.name = "Alert";
  comp.layoutMode = "VERTICAL";
  comp.itemSpacing = 0;
  comp.cornerRadius = 14;
  comp.fills = [{ type: "SOLID", color: surfaceColor }];
  comp.resize(270, 100);
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "FIXED";

  applyCardShadow(comp, ds);

  // Content area
  var contentArea = createAutoLayoutFrame("Content", "VERTICAL", 4);
  contentArea.paddingTop = 20;
  contentArea.paddingBottom = 20;
  contentArea.paddingLeft = 20;
  contentArea.paddingRight = 20;
  contentArea.counterAxisAlignItems = "CENTER";
  contentArea.fills = [];

  var titleText = await createTextNode(
    "Alert Title",
    headingTypo.fontFamily,
    "Bold",
    17,
    textPrimaryColor
  );
  titleText.textAlignHorizontal = "CENTER";
  contentArea.appendChild(titleText);
  titleText.layoutSizingHorizontal = "FILL";

  var messageText = await createTextNode(
    "This is the alert message that provides more detail.",
    bodyTypo.fontFamily,
    weightToFigmaStyle(bodyTypo.fontWeight),
    13,
    textSecondaryColor
  );
  messageText.textAutoResize = "HEIGHT";
  messageText.textAlignHorizontal = "CENTER";
  contentArea.appendChild(messageText);
  messageText.layoutSizingHorizontal = "FILL";

  comp.appendChild(contentArea);
  contentArea.layoutSizingHorizontal = "FILL";

  // Horizontal divider
  var hDivider = figma.createRectangle();
  hDivider.name = "Divider";
  hDivider.resize(270, 0.5);
  hDivider.fills = [{ type: "SOLID", color: borderColor }];
  comp.appendChild(hDivider);
  hDivider.layoutSizingHorizontal = "FILL";

  // Button row
  var buttonRow = createAutoLayoutFrame("Buttons", "HORIZONTAL", 0);
  buttonRow.fills = [];
  buttonRow.resize(270, 44);
  buttonRow.primaryAxisSizingMode = "FIXED";
  buttonRow.counterAxisSizingMode = "FIXED";

  // Cancel
  var cancelFrame = createAutoLayoutFrame("Cancel", "HORIZONTAL", 0);
  cancelFrame.primaryAxisAlignItems = "CENTER";
  cancelFrame.counterAxisAlignItems = "CENTER";
  cancelFrame.fills = [];
  cancelFrame.resize(134, 44);
  cancelFrame.primaryAxisSizingMode = "FIXED";
  cancelFrame.counterAxisSizingMode = "FIXED";
  var cancelText = await createTextNode(
    "Cancel",
    bodyTypo.fontFamily,
    weightToFigmaStyle(bodyTypo.fontWeight),
    17,
    primaryColor
  );
  cancelFrame.appendChild(cancelText);

  // Vertical divider
  var vDivider = figma.createRectangle();
  vDivider.name = "Divider";
  vDivider.resize(0.5, 44);
  vDivider.fills = [{ type: "SOLID", color: borderColor }];

  // OK
  var okFrame = createAutoLayoutFrame("OK", "HORIZONTAL", 0);
  okFrame.primaryAxisAlignItems = "CENTER";
  okFrame.counterAxisAlignItems = "CENTER";
  okFrame.fills = [];
  okFrame.resize(134, 44);
  okFrame.primaryAxisSizingMode = "FIXED";
  okFrame.counterAxisSizingMode = "FIXED";
  var okText = await createTextNode(
    "OK",
    bodyTypo.fontFamily,
    "Bold",
    17,
    primaryColor
  );
  okFrame.appendChild(okText);

  buttonRow.appendChild(cancelFrame);
  cancelFrame.layoutGrow = 1;
  buttonRow.appendChild(vDivider);
  buttonRow.appendChild(okFrame);
  okFrame.layoutGrow = 1;

  comp.appendChild(buttonRow);
  buttonRow.layoutSizingHorizontal = "FILL";

  return comp;
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

// Device display names
var DEVICE_LABELS: Record<string, string> = {
  iphone: "iPhone",
  ipad: "iPad",
  "apple-watch": "Apple Watch",
  "apple-tv": "Apple TV",
  mac: "Mac",
  "vision-pro": "Vision Pro",
  phone: "Phone",
  tablet: "Tablet",
  watch: "Watch",
  tv: "TV",
  desktop: "Desktop",
  foldable: "Foldable",
};

var APPLE_DEVICES = ["iphone", "ipad", "apple-watch", "apple-tv", "mac", "vision-pro"];
var ANDROID_DEVICES = ["phone", "tablet", "watch", "tv", "desktop", "foldable"];

async function generateDeviceColumn(
  ds: DesignSystem,
  deviceLabel: string,
  deviceId?: string
): Promise<FrameNode> {
  // Route Android devices to the MD3 generator
  if (deviceId && ANDROID_DEVICES.indexOf(deviceId) !== -1) {
    return generateAndroidDeviceColumn(ds, deviceLabel);
  }

  var column = createSectionFrame(deviceLabel + " Component Library");
  column.clipsContent = false;

  var subtitle = await createLabel(deviceLabel, 16, COLORS.textPrimary);
  column.appendChild(subtitle);

  var buttonSet = await createButtonSet(ds);
  column.appendChild(await createLabeledWrapper("Button", buttonSet));

  var textFieldSet = await createTextFieldSet(ds);
  column.appendChild(await createLabeledWrapper("Text Field", textFieldSet));

  var searchBarSet = await createSearchBarSet(ds);
  column.appendChild(await createLabeledWrapper("Search Bar", searchBarSet));

  var segmentedSet = await createSegmentedControlSet(ds);
  column.appendChild(await createLabeledWrapper("Segmented Control", segmentedSet));

  var navBar = await createNavBarComponent(ds);
  column.appendChild(await createLabeledWrapper("Navigation Bar", navBar));

  var sectionHeader = await createSectionHeaderComponent(ds);
  column.appendChild(await createLabeledWrapper("Section Header", sectionHeader));

  var listCellSet = await createListCellSet(ds);
  column.appendChild(await createLabeledWrapper("List Cell", listCellSet));

  var card = await createCardComponent(ds);
  column.appendChild(await createLabeledWrapper("Card", card, true));

  var toggleSet = await createToggleSet(ds);
  column.appendChild(await createLabeledWrapper("Toggle", toggleSet));

  var badgeSet = await createBadgeSet(ds);
  column.appendChild(await createLabeledWrapper("Badge", badgeSet));

  var tabBarItemSet = await createTabBarItemSet(ds);
  column.appendChild(await createLabeledWrapper("Tab Bar Item", tabBarItemSet));

  var toolbar = await createToolbarComponent(ds);
  column.appendChild(await createLabeledWrapper("Toolbar", toolbar));

  var contextMenu = await createContextMenuComponent(ds);
  column.appendChild(await createLabeledWrapper("Context Menu", contextMenu, true));

  var actionSheet = await createActionSheetComponent(ds);
  column.appendChild(await createLabeledWrapper("Action Sheet", actionSheet));

  var alert = await createAlertComponent(ds);
  column.appendChild(await createLabeledWrapper("Alert", alert, true));

  return column;
}

export async function generateComponents(
  ds: DesignSystem,
  platform?: string,
  devices?: string[]
): Promise<FrameNode> {
  var effectivePlatform = platform || "apple";
  var effectiveDevices = devices || ["iphone"];

  // Separate devices by platform
  var appleDevices = effectiveDevices.filter(function (d) { return APPLE_DEVICES.indexOf(d) !== -1; });
  var androidDevices = effectiveDevices.filter(function (d) { return ANDROID_DEVICES.indexOf(d) !== -1; });

  var isBoth = effectivePlatform === "both";
  var isSingleDevice = effectiveDevices.length === 1 && !isBoth;

  // Single device — flat vertical layout (original behavior)
  if (isSingleDevice) {
    var sectionFrame = createSectionFrame("Component Library");
    sectionFrame.clipsContent = false;
    var title = await createSectionTitle("Component Library");
    sectionFrame.appendChild(title);

    var deviceLabel = DEVICE_LABELS[effectiveDevices[0]] || effectiveDevices[0];
    var column = await generateDeviceColumn(ds, deviceLabel, effectiveDevices[0]);
    // Unwrap: move children from the column directly into sectionFrame
    while (column.children.length > 0) {
      var child = column.children[0];
      sectionFrame.appendChild(child);
      if ("layoutSizingHorizontal" in child) {
        (child as FrameNode).layoutSizingHorizontal = "FILL";
      }
    }
    column.remove();

    return sectionFrame;
  }

  // Multiple devices, same platform — vertical with device sections
  if (!isBoth) {
    var sectionFrame = createSectionFrame("Component Library");
    sectionFrame.clipsContent = false;
    var title = await createSectionTitle("Component Library");
    sectionFrame.appendChild(title);

    var deviceList = effectivePlatform === "android" ? androidDevices : appleDevices;
    // Fall back to all selected devices if platform filter yields nothing
    if (deviceList.length === 0) deviceList = effectiveDevices;

    for (var i = 0; i < deviceList.length; i++) {
      var label = DEVICE_LABELS[deviceList[i]] || deviceList[i];
      var devColumn = await generateDeviceColumn(ds, label, deviceList[i]);
      appendFill(sectionFrame, devColumn);
    }

    return sectionFrame;
  }

  // "both" platform — horizontal layout with Apple left, Android right
  var outerFrame = createAutoLayoutFrame("Component Library", "HORIZONTAL", 40);
  outerFrame.clipsContent = false;
  outerFrame.fills = [];

  // Apple side
  if (appleDevices.length > 0) {
    var appleSection = createAutoLayoutFrame("Apple Devices", "VERTICAL", 24);
    appleSection.clipsContent = false;
    appleSection.fills = [];
    var appleTitle = await createSectionTitle("Apple Devices");
    appleSection.appendChild(appleTitle);

    for (var ai = 0; ai < appleDevices.length; ai++) {
      var aLabel = DEVICE_LABELS[appleDevices[ai]] || appleDevices[ai];
      var aColumn = await generateDeviceColumn(ds, aLabel, appleDevices[ai]);
      appendFill(appleSection, aColumn);
    }

    outerFrame.appendChild(appleSection);
  }

  // Android side
  if (androidDevices.length > 0) {
    var androidSection = createAutoLayoutFrame("Android Devices", "VERTICAL", 24);
    androidSection.clipsContent = false;
    androidSection.fills = [];
    var androidTitle = await createSectionTitle("Android Devices");
    androidSection.appendChild(androidTitle);

    for (var di = 0; di < androidDevices.length; di++) {
      var dLabel = DEVICE_LABELS[androidDevices[di]] || androidDevices[di];
      var dColumn = await generateDeviceColumn(ds, dLabel, androidDevices[di]);
      appendFill(androidSection, dColumn);
    }

    outerFrame.appendChild(androidSection);
  }

  return outerFrame;
}
