// Vector icon helpers for iOS-style components
// Uses Figma's vectorPaths API to create clean geometric icons
// instead of unreliable Unicode text characters.

/**
 * Creates a left-pointing chevron (back button style).
 * iOS spec: 10x18 at standard size, 2pt stroke weight.
 */
export function createChevronLeft(color: RGB, height: number): FrameNode {
  var frame = figma.createFrame();
  frame.name = "Chevron Left";
  frame.resize(height * 0.55, height);
  frame.fills = [];
  frame.clipsContent = false;

  var vector = figma.createVector();
  var w = height * 0.55;
  var h = height;
  vector.vectorPaths = [{
    windingRule: "NONZERO",
    data: "M " + (w * 0.75) + " " + (h * 0.1) + " L " + (w * 0.25) + " " + (h * 0.5) + " L " + (w * 0.75) + " " + (h * 0.9)
  }];
  vector.strokes = [{ type: "SOLID", color: color }];
  vector.strokeWeight = Math.max(1.5, height * 0.11);
  vector.strokeCap = "ROUND";
  vector.strokeJoin = "ROUND";
  vector.fills = [];
  frame.appendChild(vector);

  return frame;
}

/**
 * Creates a right-pointing chevron (disclosure indicator).
 * iOS spec: small gray chevron, ~7x12 at standard size.
 */
export function createChevronRight(color: RGB, height: number): FrameNode {
  var frame = figma.createFrame();
  frame.name = "Chevron Right";
  frame.resize(height * 0.55, height);
  frame.fills = [];
  frame.clipsContent = false;

  var vector = figma.createVector();
  var w = height * 0.55;
  var h = height;
  vector.vectorPaths = [{
    windingRule: "NONZERO",
    data: "M " + (w * 0.25) + " " + (h * 0.1) + " L " + (w * 0.75) + " " + (h * 0.5) + " L " + (w * 0.25) + " " + (h * 0.9)
  }];
  vector.strokes = [{ type: "SOLID", color: color }];
  vector.strokeWeight = Math.max(1.5, height * 0.11);
  vector.strokeCap = "ROUND";
  vector.strokeJoin = "ROUND";
  vector.fills = [];
  frame.appendChild(vector);

  return frame;
}

/**
 * Creates a horizontal ellipsis icon (three dots).
 * Used for more/overflow menus in nav bars.
 */
export function createEllipsisIcon(color: RGB, size: number): FrameNode {
  var frame = figma.createFrame();
  frame.name = "Ellipsis";
  frame.resize(size, size);
  frame.fills = [];
  frame.clipsContent = false;

  var dotRadius = size * 0.1;
  var centerY = size / 2;
  var spacing = size * 0.28;

  // Three dots horizontally centered
  for (var i = -1; i <= 1; i++) {
    var dot = figma.createEllipse();
    dot.resize(dotRadius * 2, dotRadius * 2);
    dot.fills = [{ type: "SOLID", color: color }];
    dot.x = (size / 2) + (i * spacing) - dotRadius;
    dot.y = centerY - dotRadius;
    frame.appendChild(dot);
  }

  return frame;
}

/**
 * Creates a search magnifying glass icon.
 * Circle with a diagonal handle extending from bottom-right.
 */
export function createSearchIcon(color: RGB, size: number): FrameNode {
  var frame = figma.createFrame();
  frame.name = "Search Icon";
  frame.resize(size, size);
  frame.fills = [];
  frame.clipsContent = false;

  // Circle (lens) — offset to upper-left
  var lensSize = size * 0.6;
  var lens = figma.createEllipse();
  lens.resize(lensSize, lensSize);
  lens.fills = [];
  lens.strokes = [{ type: "SOLID", color: color }];
  lens.strokeWeight = Math.max(1.5, size * 0.1);
  lens.x = size * 0.08;
  lens.y = size * 0.08;
  frame.appendChild(lens);

  // Handle — diagonal line from bottom-right of lens
  var handle = figma.createVector();
  var hx1 = size * 0.58;
  var hy1 = size * 0.58;
  var hx2 = size * 0.88;
  var hy2 = size * 0.88;
  handle.vectorPaths = [{
    windingRule: "NONZERO",
    data: "M " + hx1 + " " + hy1 + " L " + hx2 + " " + hy2
  }];
  handle.strokes = [{ type: "SOLID", color: color }];
  handle.strokeWeight = Math.max(1.5, size * 0.1);
  handle.strokeCap = "ROUND";
  handle.fills = [];
  frame.appendChild(handle);

  return frame;
}

/**
 * Creates an X/close icon.
 * Two crossing diagonal lines.
 */
export function createCloseIcon(color: RGB, size: number): FrameNode {
  var frame = figma.createFrame();
  frame.name = "Close";
  frame.resize(size, size);
  frame.fills = [];
  frame.clipsContent = false;

  var inset = size * 0.2;
  var vector = figma.createVector();
  vector.vectorPaths = [
    {
      windingRule: "NONZERO",
      data: "M " + inset + " " + inset + " L " + (size - inset) + " " + (size - inset)
    },
    {
      windingRule: "NONZERO",
      data: "M " + (size - inset) + " " + inset + " L " + inset + " " + (size - inset)
    }
  ];
  vector.strokes = [{ type: "SOLID", color: color }];
  vector.strokeWeight = Math.max(1.5, size * 0.12);
  vector.strokeCap = "ROUND";
  vector.fills = [];
  frame.appendChild(vector);

  return frame;
}

/**
 * Creates an info circle icon (circle with "i").
 */
export function createInfoCircle(color: RGB, size: number): FrameNode {
  var frame = figma.createFrame();
  frame.name = "Info";
  frame.resize(size, size);
  frame.fills = [];
  frame.clipsContent = false;

  var circle = figma.createEllipse();
  circle.resize(size, size);
  circle.fills = [];
  circle.strokes = [{ type: "SOLID", color: color }];
  circle.strokeWeight = Math.max(1, size * 0.08);
  frame.appendChild(circle);

  // Dot at top of "i"
  var dotSize = size * 0.1;
  var dot = figma.createEllipse();
  dot.resize(dotSize, dotSize);
  dot.fills = [{ type: "SOLID", color: color }];
  dot.x = (size - dotSize) / 2;
  dot.y = size * 0.22;
  frame.appendChild(dot);

  // Stem of "i"
  var stem = figma.createRectangle();
  var stemW = size * 0.09;
  var stemH = size * 0.3;
  stem.resize(stemW, stemH);
  stem.fills = [{ type: "SOLID", color: color }];
  stem.cornerRadius = stemW / 2;
  stem.x = (size - stemW) / 2;
  stem.y = size * 0.42;
  frame.appendChild(stem);

  return frame;
}

/**
 * Creates a pencil/edit icon.
 * Diagonal pencil shape.
 */
export function createPencilIcon(color: RGB, size: number): FrameNode {
  var frame = figma.createFrame();
  frame.name = "Edit";
  frame.resize(size, size);
  frame.fills = [];
  frame.clipsContent = false;

  // Pencil body — diagonal rectangle
  var vector = figma.createVector();
  var m = size * 0.15; // margin
  vector.vectorPaths = [{
    windingRule: "NONZERO",
    data: "M " + (size - m) + " " + m +
          " L " + (size - m * 1.8) + " " + (m * 1.8) +
          " L " + (m * 1.8) + " " + (size - m * 1.8) +
          " L " + m + " " + (size - m) +
          " L " + (m * 1.5) + " " + (size - m * 1.5) +
          " Z"
  }];
  vector.fills = [{ type: "SOLID", color: color }];
  vector.strokes = [];
  frame.appendChild(vector);

  return frame;
}

/**
 * Creates a duplicate/copy icon (two overlapping rounded squares).
 */
export function createDuplicateIcon(color: RGB, size: number): FrameNode {
  var frame = figma.createFrame();
  frame.name = "Duplicate";
  frame.resize(size, size);
  frame.fills = [];
  frame.clipsContent = false;

  var rectSize = size * 0.6;
  var r = size * 0.08;
  var sw = Math.max(1, size * 0.08);

  // Back square
  var back = figma.createRectangle();
  back.resize(rectSize, rectSize);
  back.cornerRadius = r;
  back.fills = [];
  back.strokes = [{ type: "SOLID", color: color }];
  back.strokeWeight = sw;
  back.x = size * 0.3;
  back.y = size * 0.1;
  frame.appendChild(back);

  // Front square
  var front = figma.createRectangle();
  front.resize(rectSize, rectSize);
  front.cornerRadius = r;
  front.fills = [];
  front.strokes = [{ type: "SOLID", color: color }];
  front.strokeWeight = sw;
  front.x = size * 0.1;
  front.y = size * 0.3;
  frame.appendChild(front);

  return frame;
}

/**
 * Creates a share icon (arrow pointing up from a tray).
 */
export function createShareIcon(color: RGB, size: number): FrameNode {
  var frame = figma.createFrame();
  frame.name = "Share";
  frame.resize(size, size);
  frame.fills = [];
  frame.clipsContent = false;

  var sw = Math.max(1.5, size * 0.1);

  // Tray (U shape at bottom)
  var tray = figma.createVector();
  var tx1 = size * 0.2;
  var tx2 = size * 0.8;
  var ty1 = size * 0.45;
  var ty2 = size * 0.85;
  tray.vectorPaths = [{
    windingRule: "NONZERO",
    data: "M " + tx1 + " " + ty1 + " L " + tx1 + " " + ty2 + " L " + tx2 + " " + ty2 + " L " + tx2 + " " + ty1
  }];
  tray.strokes = [{ type: "SOLID", color: color }];
  tray.strokeWeight = sw;
  tray.strokeCap = "ROUND";
  tray.strokeJoin = "ROUND";
  tray.fills = [];
  frame.appendChild(tray);

  // Arrow shaft (vertical line up from center)
  var shaft = figma.createVector();
  var cx = size * 0.5;
  shaft.vectorPaths = [{
    windingRule: "NONZERO",
    data: "M " + cx + " " + (size * 0.6) + " L " + cx + " " + (size * 0.12)
  }];
  shaft.strokes = [{ type: "SOLID", color: color }];
  shaft.strokeWeight = sw;
  shaft.strokeCap = "ROUND";
  shaft.fills = [];
  frame.appendChild(shaft);

  // Arrow head (V shape at top)
  var head = figma.createVector();
  head.vectorPaths = [{
    windingRule: "NONZERO",
    data: "M " + (size * 0.3) + " " + (size * 0.28) + " L " + cx + " " + (size * 0.1) + " L " + (size * 0.7) + " " + (size * 0.28)
  }];
  head.strokes = [{ type: "SOLID", color: color }];
  head.strokeWeight = sw;
  head.strokeCap = "ROUND";
  head.strokeJoin = "ROUND";
  head.fills = [];
  frame.appendChild(head);

  return frame;
}

/**
 * Creates a trash/delete icon.
 * Simplified trash can: lid line + body with vertical lines.
 */
export function createTrashIcon(color: RGB, size: number): FrameNode {
  var frame = figma.createFrame();
  frame.name = "Trash";
  frame.resize(size, size);
  frame.fills = [];
  frame.clipsContent = false;

  var sw = Math.max(1.5, size * 0.08);

  // Lid line across top
  var lid = figma.createVector();
  lid.vectorPaths = [{
    windingRule: "NONZERO",
    data: "M " + (size * 0.15) + " " + (size * 0.25) + " L " + (size * 0.85) + " " + (size * 0.25)
  }];
  lid.strokes = [{ type: "SOLID", color: color }];
  lid.strokeWeight = sw;
  lid.strokeCap = "ROUND";
  lid.fills = [];
  frame.appendChild(lid);

  // Handle nub on top
  var nub = figma.createVector();
  nub.vectorPaths = [{
    windingRule: "NONZERO",
    data: "M " + (size * 0.38) + " " + (size * 0.25) +
          " L " + (size * 0.38) + " " + (size * 0.15) +
          " L " + (size * 0.62) + " " + (size * 0.15) +
          " L " + (size * 0.62) + " " + (size * 0.25)
  }];
  nub.strokes = [{ type: "SOLID", color: color }];
  nub.strokeWeight = sw;
  nub.strokeCap = "ROUND";
  nub.strokeJoin = "ROUND";
  nub.fills = [];
  frame.appendChild(nub);

  // Body (tapered rectangle)
  var body = figma.createVector();
  body.vectorPaths = [{
    windingRule: "NONZERO",
    data: "M " + (size * 0.22) + " " + (size * 0.25) +
          " L " + (size * 0.28) + " " + (size * 0.88) +
          " L " + (size * 0.72) + " " + (size * 0.88) +
          " L " + (size * 0.78) + " " + (size * 0.25)
  }];
  body.strokes = [{ type: "SOLID", color: color }];
  body.strokeWeight = sw;
  body.strokeCap = "ROUND";
  body.strokeJoin = "ROUND";
  body.fills = [];
  frame.appendChild(body);

  return frame;
}

/**
 * Creates a simple filled circle icon placeholder.
 * Used for tab bar icons and similar placeholders.
 */
export function createCircleIcon(color: RGB, size: number): EllipseNode {
  var circle = figma.createEllipse();
  circle.resize(size, size);
  circle.fills = [{ type: "SOLID", color: color }];
  return circle;
}

/**
 * Creates a checkmark icon.
 */
export function createCheckmark(color: RGB, size: number): FrameNode {
  var frame = figma.createFrame();
  frame.name = "Checkmark";
  frame.resize(size, size);
  frame.fills = [];
  frame.clipsContent = false;

  var vector = figma.createVector();
  vector.vectorPaths = [{
    windingRule: "NONZERO",
    data: "M " + (size * 0.15) + " " + (size * 0.5) +
          " L " + (size * 0.4) + " " + (size * 0.78) +
          " L " + (size * 0.85) + " " + (size * 0.22)
  }];
  vector.strokes = [{ type: "SOLID", color: color }];
  vector.strokeWeight = Math.max(1.5, size * 0.12);
  vector.strokeCap = "ROUND";
  vector.strokeJoin = "ROUND";
  vector.fills = [];
  frame.appendChild(vector);

  return frame;
}
