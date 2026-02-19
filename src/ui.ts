// UI logic — runs in iframe

const input = document.getElementById("input") as HTMLTextAreaElement;
const generateBtn = document.getElementById("generateBtn") as HTMLButtonElement;
const uploadBtn = document.getElementById("uploadBtn") as HTMLButtonElement;
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const templateLink = document.getElementById("templateLink") as HTMLElement;
const formatBadge = document.getElementById("formatBadge") as HTMLElement;
const toggleAll = document.getElementById("toggleAll") as HTMLButtonElement;
const checkboxes = document.getElementById("checkboxes") as HTMLElement;
const statusBar = document.getElementById("statusBar") as HTMLElement;
const statusText = document.getElementById("statusText") as HTMLElement;
const spinner = document.getElementById("spinner") as HTMLElement;
const progressBar = document.getElementById("progressBar") as HTMLElement;
const progressFill = document.getElementById("progressFill") as HTMLElement;
const varOptions = document.getElementById("varOptions") as HTMLElement;
const varHint = document.getElementById("varHint") as HTMLElement;
const helpBtn = document.getElementById("helpBtn") as HTMLButtonElement;
const helpOverlay = document.getElementById("helpOverlay") as HTMLElement;
const helpClose = document.getElementById("helpClose") as HTMLButtonElement;
const helpBody = document.getElementById("helpBody") as HTMLElement;
const helpUseTemplate = document.getElementById("helpUseTemplate") as HTMLButtonElement;

type SectionKey =
  | "header"
  | "colors"
  | "darkColors"
  | "typography"
  | "spacing"
  | "radius"
  | "shadows"
  | "components";

const SECTION_KEYS: SectionKey[] = [
  "header",
  "colors",
  "darkColors",
  "typography",
  "spacing",
  "radius",
  "shadows",
  "components",
];

type PlatformType = "apple" | "android" | "both";
let selectedPlatform: PlatformType = "apple";

const platformOptions = document.getElementById("platformOptions") as HTMLElement;
const deviceCheckboxes = document.getElementById("deviceCheckboxes") as HTMLElement;
const styleHint = document.getElementById("styleHint") as HTMLElement;

type VariableMode = "none" | "add" | "smart" | "replace";
let selectedVarMode: VariableMode = "none";

const VAR_HINTS: Record<VariableMode, string> = {
  none: "Variables won't be created or modified.",
  add: "New variables will be created. Existing ones are left untouched.",
  smart: "Matching variables are updated, new ones added, unmatched left alone.",
  replace: "All variables in the collection are deleted and recreated from scratch.",
};

// --- Platform & device selection ---

interface DeviceConfig {
  value: string;
  label: string;
}

const APPLE_DEVICES: DeviceConfig[] = [
  { value: "iphone", label: "iPhone" },
  { value: "ipad", label: "iPad" },
  { value: "watch", label: "Apple Watch" },
  { value: "mac", label: "Mac" },
];

const ANDROID_DEVICES: DeviceConfig[] = [
  { value: "phone", label: "Phone" },
  { value: "tablet", label: "Tablet" },
  { value: "wear", label: "Wear OS" },
  { value: "chromebook", label: "Chromebook" },
];

const STYLE_HINTS: Record<string, string> = {
  "apple_iphone": "Component Style: iOS 26",
  "apple_ipad": "Component Style: iPadOS 26",
  "apple_watch": "Component Style: watchOS 11",
  "apple_mac": "Component Style: macOS 26",
  "android_phone": "Component Style: Material Design 3",
  "android_tablet": "Component Style: Material Design 3",
  "android_wear": "Component Style: Wear OS",
  "android_chromebook": "Component Style: Material Design 3",
};

function renderDeviceCheckboxes(platform: PlatformType): void {
  var devices: DeviceConfig[] = [];
  if (platform === "apple") {
    devices = APPLE_DEVICES;
  } else if (platform === "android") {
    devices = ANDROID_DEVICES;
  } else {
    devices = APPLE_DEVICES.concat(ANDROID_DEVICES);
  }

  var html = "";
  for (var i = 0; i < devices.length; i++) {
    var d = devices[i];
    var checked = i === 0 ? " checked" : "";
    html += '<label class="checkbox-item" data-device="' + d.value + '">';
    html += '<input type="checkbox" value="' + d.value + '"' + checked + '> ' + d.label;
    html += '</label>';
  }
  deviceCheckboxes.innerHTML = html;
  updateStyleHint();
}

function getSelectedDevices(): string[] {
  var boxes = deviceCheckboxes.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');
  var result: string[] = [];
  boxes.forEach(function(b) { result.push(b.value); });
  return result;
}

function updateStyleHint(): void {
  var devices = getSelectedDevices();
  if (devices.length === 0) {
    styleHint.textContent = "Select at least one device";
    return;
  }

  if (devices.length === 1) {
    var key = selectedPlatform + "_" + devices[0];
    if (selectedPlatform === "both") {
      // Determine which platform this device belongs to
      var isApple = APPLE_DEVICES.some(function(d) { return d.value === devices[0]; });
      key = (isApple ? "apple" : "android") + "_" + devices[0];
    }
    styleHint.textContent = STYLE_HINTS[key] || "Component Style: Platform-native";
    return;
  }

  // Multiple devices
  if (selectedPlatform === "both") {
    styleHint.textContent = "Component Styles: iOS 26 + Material Design 3";
  } else if (selectedPlatform === "apple") {
    styleHint.textContent = "Component Style: Apple platforms";
  } else {
    styleHint.textContent = "Component Style: Material Design 3";
  }
}

platformOptions.querySelectorAll<HTMLElement>(".platform-option").forEach(function(opt) {
  opt.addEventListener("click", function() {
    var platform = opt.dataset.platform as PlatformType;
    if (!platform) return;
    selectedPlatform = platform;

    platformOptions.querySelectorAll(".platform-option").forEach(function(o) {
      o.classList.remove("active");
    });
    opt.classList.add("active");

    var radio = opt.querySelector("input") as HTMLInputElement;
    if (radio) radio.checked = true;

    renderDeviceCheckboxes(platform);
  });
});

deviceCheckboxes.addEventListener("change", function() {
  updateStyleHint();
});

// --- Variable mode selection ---

varOptions.querySelectorAll<HTMLElement>(".var-option").forEach((opt) => {
  opt.addEventListener("click", () => {
    const mode = opt.dataset.mode as VariableMode;
    if (!mode) return;
    selectedVarMode = mode;

    // Update active class
    varOptions.querySelectorAll(".var-option").forEach((o) => o.classList.remove("active"));
    opt.classList.add("active");

    // Check the radio
    const radio = opt.querySelector("input") as HTMLInputElement;
    if (radio) radio.checked = true;

    // Update hint text
    varHint.textContent = VAR_HINTS[mode];
  });
});

// --- Help overlay ---

helpBtn.addEventListener("click", () => {
  helpOverlay.classList.add("active");
  populateHelpContent();
});

helpClose.addEventListener("click", () => {
  helpOverlay.classList.remove("active");
});

helpOverlay.addEventListener("click", (e) => {
  if (e.target === helpOverlay) {
    helpOverlay.classList.remove("active");
  }
});

helpUseTemplate.addEventListener("click", () => {
  const template = getTemplate();
  const blob = new Blob([template], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "design-system-template.md";
  a.click();
  URL.revokeObjectURL(url);
});

function populateHelpContent(): void {
  helpBody.innerHTML = `
    <h3>What is MARC JSONS?</h3>
    <p>MARC JSONS turns your design tokens (colors, typography, spacing, etc.) into a <strong>visual style guide</strong> directly on your Figma canvas. It also optionally creates <strong>Figma Variables</strong> from your tokens.</p>

    <h3>How to use it</h3>
    <p><strong>Step 1:</strong> Define your design system in <strong>Markdown</strong> or <strong>JSON</strong> format. You can write it yourself, export it from a tool, or ask an AI to generate it.</p>
    <p><strong>Step 2:</strong> Paste the content into the text area (or upload a file).</p>
    <p><strong>Step 3:</strong> Choose which sections to generate and whether to sync Figma Variables.</p>
    <p><strong>Step 4:</strong> Hit <strong>Generate Style Guide</strong>.</p>

    <h3>Figma Variables</h3>
    <p>Choose a variable sync mode before generating:</p>
    <p><strong>Don't Sync</strong> &mdash; No variables created (just the visual style guide).<br>
    <strong>Add New</strong> &mdash; Creates new variables. Skips any that already exist.<br>
    <strong>Smart Update</strong> &mdash; Updates matching variables, adds new ones, leaves unmatched alone.<br>
    <strong>Replace All</strong> &mdash; Deletes the entire variable collection and recreates it from scratch.</p>

    <h3>Supported formats</h3>
    <p><strong>Markdown:</strong> Tables with hex colors, font specs, spacing values. The parser auto-detects token types from content.</p>
    <pre>| Token | Hex | Usage |
|-------|-----|-------|
| Brand.Primary | \`#007AFF\` | Primary brand |</pre>
    <p><strong>JSON:</strong> W3C DTCG format (<code>$type</code>/<code>$value</code>) and Tokens Studio format (<code>type</code>/<code>value</code>).</p>
    <pre>{
  "Brand": {
    "Primary": {
      "$type": "color",
      "$value": "#007AFF"
    }
  }
}</pre>

    <h3>AI prompts to get started</h3>
    <p>Ask Claude, ChatGPT, or any AI assistant:</p>
    <div class="prompt-example">"Create a design system for a fitness app with brand colors (energetic orange and dark gray), 4 typography styles, spacing scale, border radii, and shadows. Format as a markdown file with tables."</div>
    <div class="prompt-example">"Generate design tokens for a SaaS dashboard in W3C DTCG JSON format. Include a color palette (blue primary, neutral grays), typography scale, spacing, border radius, and elevation shadows."</div>
    <div class="prompt-example">"Take my existing brand colors (#1B4D3E, #F4A261, #264653) and build out a full design system with light and dark mode colors, typography using SF Pro, spacing, and component specs for buttons and cards."</div>
  `;
}

// --- Format detection ---

function detectFormat(text: string): "markdown" | "json" | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{")) return "json";
  if (trimmed.startsWith("#") || trimmed.includes("|")) return "markdown";
  return null;
}

function updateFormatBadge(text: string): void {
  const format = detectFormat(text);
  formatBadge.className = "format-badge";
  if (format === "markdown") {
    formatBadge.textContent = "Markdown";
    formatBadge.classList.add("markdown");
  } else if (format === "json") {
    formatBadge.textContent = "JSON";
    formatBadge.classList.add("json");
  }
}

// --- Input handling ---

input.addEventListener("input", () => {
  const hasContent = input.value.trim().length > 0;
  generateBtn.disabled = !hasContent;
  updateFormatBadge(input.value);
});

// File upload
uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    input.value = e.target?.result as string;
    generateBtn.disabled = false;
    updateFormatBadge(input.value);
    setStatus("File loaded: " + file.name);
  };
  reader.readAsText(file);
});

// Toggle all checkboxes
let allChecked = true;
toggleAll.addEventListener("click", () => {
  allChecked = !allChecked;
  const boxes = checkboxes.querySelectorAll<HTMLInputElement>(
    'input[type="checkbox"]'
  );
  boxes.forEach((box) => {
    if (!box.closest(".checkbox-item")?.classList.contains("disabled")) {
      box.checked = allChecked;
    }
  });
  toggleAll.textContent = allChecked ? "Deselect All" : "Select All";
});

// Template download
templateLink.addEventListener("click", () => {
  const template = getTemplate();
  const blob = new Blob([template], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "design-system-template.md";
  a.click();
  URL.revokeObjectURL(url);
});

// --- Generate ---

generateBtn.addEventListener("click", () => {
  const content = input.value.trim();
  if (!content) return;

  const selectedSections = getSelectedSections();
  if (selectedSections.length === 0) {
    setStatus("Select at least one section to generate", "error");
    return;
  }

  // Disable UI during generation
  generateBtn.disabled = true;
  input.disabled = true;
  showProgress(true);
  setStatus("Parsing design tokens...", "working");

  parent.postMessage(
    {
      pluginMessage: {
        type: "generate",
        content,
        sections: selectedSections,
        variableMode: selectedVarMode,
        platform: selectedPlatform,
        devices: getSelectedDevices(),
      },
    },
    "*"
  );
});

function getSelectedSections(): SectionKey[] {
  const boxes = checkboxes.querySelectorAll<HTMLInputElement>(
    'input[type="checkbox"]:checked'
  );
  return Array.from(boxes)
    .map((b) => b.value as SectionKey)
    .filter((s) => SECTION_KEYS.includes(s));
}

// --- Messages from sandbox ---

onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;

  switch (msg.type) {
    case "progress":
      setStatus(msg.message, "working");
      if (typeof msg.percent === "number") {
        progressFill.style.width = msg.percent + "%";
      }
      break;

    case "done":
      showProgress(false);
      setStatus(msg.message || "Style guide generated!", "success");
      generateBtn.disabled = false;
      input.disabled = false;
      break;

    case "error":
      showProgress(false);
      setStatus(msg.message || "An error occurred", "error");
      generateBtn.disabled = false;
      input.disabled = false;
      break;
  }
};

// --- Helpers ---

function setStatus(
  message: string,
  type?: "working" | "error" | "success"
): void {
  statusText.textContent = message;
  statusBar.className = "status-bar";
  spinner.classList.remove("active");

  if (type === "error") statusBar.classList.add("error");
  if (type === "success") statusBar.classList.add("success");
  if (type === "working") spinner.classList.add("active");
}

function showProgress(show: boolean): void {
  progressBar.className = show ? "progress-bar active" : "progress-bar";
  if (show) progressFill.style.width = "0%";
}

function getTemplate(): string {
  return `# My Design System (v1.0)

> *A brief tagline for your design system*

**Primary Font:** Inter
**Secondary Font:** Inter

---

## Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| Brand.Primary | \`#007AFF\` | Primary brand color |
| Brand.Secondary | \`#5856D6\` | Secondary brand color |
| Surface.Background | \`#FFFFFF\` | Default background |
| Surface.Card | \`#F2F2F7\` | Card backgrounds |
| Text.Primary | \`#000000\` | Primary text |
| Text.Secondary | \`#8E8E93\` | Secondary text |
| Semantic.Success | \`#34C759\` | Success states |
| Semantic.Error | \`#FF3B30\` | Error states |

## Dark Mode Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Dark.Background | \`#000000\` | Dark mode background |
| Dark.Surface | \`#1C1C1E\` | Dark mode surfaces |
| Dark.Text.Primary | \`#FFFFFF\` | Dark mode text |

## Typography

| Style | Font | Weight | Size | Line Height | Usage |
|-------|------|--------|------|-------------|-------|
| Display | Inter | Bold | 32 | 40 | Page titles |
| Heading | Inter | Semi Bold | 24 | 32 | Section headings |
| Body | Inter | Regular | 16 | 24 | Body text |
| Caption | Inter | Regular | 12 | 16 | Captions |

## Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Spacing.XS | 4px | Tight spacing |
| Spacing.SM | 8px | Small gaps |
| Spacing.MD | 16px | Default spacing |
| Spacing.LG | 24px | Section spacing |
| Spacing.XL | 32px | Large spacing |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| Radius.SM | 4px | Subtle rounding |
| Radius.MD | 8px | Default corners |
| Radius.LG | 16px | Cards |
| Radius.Full | 9999px | Pills/chips |

## Shadows

| Token | X | Y | Blur | Spread | Color | Usage |
|-------|---|---|------|--------|-------|-------|
| Shadow.SM | 0 | 1 | 3 | 0 | #00000026 | Subtle elevation |
| Shadow.MD | 0 | 4 | 12 | 0 | #00000026 | Cards |
| Shadow.LG | 0 | 8 | 24 | 0 | #00000033 | Modals |

## Components

The Component Library section auto-generates real Figma components
(Buttons, Text Fields, Cards, List Rows, Nav Bars, Toggles, Badges,
Alerts) from the tokens above. No extra config needed — token names
are matched by intent (e.g. "primary", "surface", "error").
`;
}
