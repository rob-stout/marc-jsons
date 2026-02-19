# MARC JSONS — Portfolio Case Study

**Role:** Solo designer and developer
**Type:** Figma plugin (TypeScript)
**Status:** V1 complete, entering bug-fix phase
**Stack:** TypeScript, esbuild, Figma Plugin API

---

## The Problem

Every design system handoff hits the same wall: tokens exist somewhere — a Notion table, a JSON file, a Tokens Studio export — but getting them into Figma as a usable, visual style guide is manual, tedious, and inconsistent. A designer either spends hours building swatches and spec sheets by hand, or ships nothing and lets developers guess.

The broader issue is that design tokens are structurally simple but contextually complex. The data is easy to store. The hard part is turning it into something a team can actually read, reference, and build from — especially when every team names their tokens differently.

MARC JSONS is a Figma plugin that closes that gap: paste or upload your tokens, and it generates a complete visual style guide and component library, branded to your system, directly on the canvas.

---

## What It Generates

From a single paste or file upload, the plugin produces:

- A style guide covering colors (light and dark), typography, spacing, border radius, and shadows — each rendered as a proper visual reference, not a table
- A 15-component UI library with variants: Button (8 variants), TextField, SearchBar, SegmentedControl, NavBar, SectionHeader, ListCell (3 accessories), Card, Toggle, Badge, TabBarItem, Toolbar, ContextMenu, ActionSheet, and Alert
- Figma Variables synced from your tokens, with a 4-mode sync system

All components are built as Figma ComponentSets with named variants, ready for use in prototypes and specs.

---

## The Approach: Design Decisions That Shaped the Build

### 1. Semantic Token Resolution — Designing for Real-World Messiness

**The problem:** Components need colors to render. But token names are unpredictable. One team calls their primary action color `brand-500`. Another calls it `primary`. Another calls it `blue`. A naive implementation breaks on all of them.

**The decision:** Rather than requiring an exact naming convention, I built a semantic intent resolver (`tokenResolver.ts`) that maps component needs to token intents using keyword sets.

When a Button needs its fill color, it asks for `"primary"`. The resolver searches the token list for names matching any of `["primary"], ["brand"], ["main"], ["accent"]` — in priority order. If nothing matches, it falls back to the brand color from system metadata, then to the first color token in the list, then to a hardcoded sensible default (`#007AFF`).

The same pattern applies to radius, spacing, and typography — each resolved by semantic role ("small/medium/large", "heading/body/caption/label") rather than exact name.

```typescript
var COLOR_KEYWORDS: Record<ColorIntent, string[][]> = {
  primary: [["primary"], ["brand"], ["main"], ["accent"]],
  destructive: [["error"], ["destructive"], ["danger"], ["red"]],
  surface: [["surface"], ["background"], ["card"], ["bg"]],
  border: [["border"], ["divider"], ["separator"], ["stroke"], ["outline"]],
  // ...
};
```

This is a design-of-systems insight: the tool has to be more robust than the inputs it receives. Designers naming tokens inconsistently is not a user error — it is the default state.

---

### 2. Graduated Variable Sync — Control Proportional to Risk

**The problem:** Figma Variables sync is destructive if you get it wrong. Replacing all variables in a live design file can break component bindings. But a simple on/off toggle forces users to choose between "do nothing" and "potentially break everything."

**The decision:** Four graduated modes, each with clearly scoped behavior:

| Mode | Behavior |
|---|---|
| Don't Sync | No variables created or modified. Default. |
| Add New | Only creates variables that don't exist. Never overwrites. |
| Smart Update | Updates values for existing name-matched variables, adds new ones, leaves unmatched alone. |
| Replace All | Deletes the entire collection and rebuilds from scratch. |

The modes are presented as a segmented control in the plugin UI, with a context hint that updates as you select each one. The user always knows what they're about to do before they do it.

This is product thinking applied to a destructive operation: give users a graduated path from safe to powerful, and make the consequences legible at every step.

---

### 3. Dual Format Support with Automatic Detection

**The problem:** Two major standards exist for design tokens — W3C DTCG (`$type`/`$value`) and Tokens Studio (`type`/`value`) — plus teams that just write flat JSON with hex values as strings. Markdown tables from Notion or Confluence are also common. Requiring users to convert their format before using the tool creates friction that kills adoption.

**The decision:** The plugin auto-detects format on parse. If the input starts with `{`, it goes through the JSON parser; otherwise through the markdown parser. The JSON parser handles DTCG, Tokens Studio, and flat/inferred token objects. Token references (`{color.brand.500}`) are resolved recursively before processing.

```typescript
function parseContent(content: string): DesignSystem {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) {
    return parseJSON(trimmed);
  }
  return parseMarkdown(trimmed);
}
```

The markdown parser splits by heading, classifies tables by their column structure and cell values (hex regex, keyword matching on column names), and gracefully handles tables it cannot classify rather than throwing an error.

Supporting both formats is not just a convenience feature. It removes the "you need to reformat your tokens" conversation entirely.

---

### 4. Smart Fallback Chains — Always Render Something Useful

**The philosophy:** Partial data should produce a partial output, not a failure. The plugin is designed to degrade gracefully at every layer.

Three places where this is explicit:

**Font loading** (`shared.ts`): When a component needs a font, `loadFontSafe()` tries the requested family and style first. On failure, it falls back to Inter with the same style. On second failure, it falls back to Inter Regular. A component always renders — even if the exact typeface isn't in the user's Figma account.

```typescript
export async function loadFontSafe(family: string, style: string): Promise<FontName> {
  try {
    await figma.loadFontAsync({ family, style });
    return { family, style };
  } catch (_e) {
    try {
      await figma.loadFontAsync({ family: "Inter", style });
      return { family: "Inter", style };
    } catch (_e2) {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      return { family: "Inter", style: "Regular" };
    }
  }
}
```

**Token resolution**: The semantic resolver always returns a value. If no token matches and no metadata is available, a sensible iOS-system default is returned. Components never break because a token was missing.

**Variable sync on free Figma plans**: Adding a Dark mode to a variable collection requires a paid plan. The plugin catches that exception, logs it to the summary, and continues syncing light-mode variables. It does not abort.

The underlying principle: fail loudly only when the user gave us nothing at all. Otherwise, give them the best possible output from what they provided.

---

### 5. Platform and Device Layout Logic

**The problem:** A design system may target iPhone only, iPhone and iPad, or both Apple and Android platforms simultaneously. Generating a single flat component list for all cases produces output that is either too narrow (single device) or a confusing undifferentiated wall of components (multi-device).

**The decision:** Three distinct layout modes determined at runtime:

- **Single device:** Flat vertical layout, components flow directly in the section. No column wrappers.
- **Multiple devices, same platform:** Vertical layout with per-device sub-sections, each labeled.
- **Cross-platform (both):** Horizontal two-column layout — Apple on the left, Android on the right — with platform-level headings.

The same 15-component generator (`generateDeviceColumn`) runs for each device. The outer layout adapts around it based on what the user selected.

```typescript
var isSingleDevice = effectiveDevices.length === 1 && !isBoth;
// Single → flat vertical
// Multi same-platform → vertical with labeled sub-sections
// Both → horizontal two-column
```

This means the component output is always legible at the scale the user is working at, without requiring them to think about layout.

---

## The Build: How the Code Is Organized

```
src/
  code.ts              — plugin entry point, orchestrates generation pipeline
  constants.ts         — layout grid, colors, fonts for the style guide itself
  parser/
    types.ts           — DesignSystem, ColorToken, TypographyToken, etc.
    markdownParser.ts  — parse markdown tables into typed token arrays
    jsonParser.ts      — parse W3C DTCG, Tokens Studio, flat JSON
    tableParser.ts     — low-level markdown table row extraction
  generators/
    tokenResolver.ts   — semantic intent → token value mapping
    colorGenerator.ts  — color swatches (light + dark)
    typographyGenerator.ts
    spacingGenerator.ts
    radiusGenerator.ts
    shadowGenerator.ts
    headerGenerator.ts
    componentGenerator.ts — all 15 components
    variableGenerator.ts  — 4-mode Figma Variables sync
    shared.ts          — layout primitives, font loading, text nodes
    diffGenerator.ts
    icons.ts           — vector path icons (chevrons, search, close, etc.)
  ui.html              — plugin panel UI
  ui.ts                — panel logic, message passing
```

The architecture reflects a strict boundary between the sandbox (code.ts and generators) and the plugin UI (ui.html and ui.ts). Data flows one direction: the UI collects user intent and posts a message; the sandbox parses, generates, and posts back progress and results.

The `DesignSystem` type is the central data structure — everything the parser produces and everything the generators consume is typed against it. This made adding the JSON parser straightforward: as long as it produced a valid `DesignSystem`, the generators did not need to change.

---

## What I Learned

**On building for other designers:** The hardest design problem was not the UI or the layout engine — it was accepting that users would give the plugin incomplete, inconsistent, or idiosyncratic input, and that the system needed to have an answer for all of it. The semantic resolver and fallback chains exist because I kept asking "what happens if a designer names their primary color `action-blue`?" The answer could not be "it breaks."

**On Figma's plugin API constraints:** The API has real quirks. `layoutSizingHorizontal = "FILL"` can only be set after a node has been appended to an auto-layout parent — setting it before throws a silent runtime error. The `appendFill()` utility in `shared.ts` exists specifically to enforce this ordering. Figma's sandbox JavaScript engine also targets an older spec than modern browsers, which affects what syntax is safe in the generated code.

**On TypeScript in a sandboxed environment:** The plugin runs TypeScript compiled to ES2017 via esbuild. This is a meaningful constraint — not all modern syntax is safe, and the Figma typings are detailed but occasionally surprising. Keeping the code deliberately readable rather than clever made debugging inside Figma's console much faster.

**On scope:** The 15 components were a deliberate decision about what a "minimum credible component library" looks like for an iOS-first design system. Everything above that number adds diminishing returns for a V1. Everything below it feels incomplete. Getting that number right is a product decision, not a technical one.

---

## Artifacts Worth Capturing

- Side-by-side screenshot: markdown token input → generated style guide output
- Screenshot of the 4-mode variable sync control in the plugin UI
- Generated component library showing all 15 components with variants
- The `tokenResolver.ts` file — specifically the keyword-to-intent mapping structure
- A before/after showing the same design system tokens generating the same output from both markdown and JSON formats
- The plugin panel UI at different states: empty, format detected (green "Markdown" badge), generating (progress bar), done

---

## The Larger Story

MARC JSONS sits at the intersection of the two things I have spent my career on: design systems and the tooling designers actually use. The plugin is not just a code project — it is an argument about where friction in the design-to-development workflow lives and how to remove it.

The semantic token resolver is the clearest expression of that. It treats naming inconsistency not as a problem to be corrected but as a constraint to be designed around. That is a systems-thinking move, not an engineering one.

Building this also expanded what I can do technically. Implementing the JSON token parser from the W3C DTCG spec, working inside the Figma sandbox, and designing a component generator that renders pixel-accurate iOS components programmatically — these are capabilities I did not have a year ago. The design background made me better at knowing what "correct" looked like. The engineering work made me better at achieving it.

---

*Last updated: February 2026*
