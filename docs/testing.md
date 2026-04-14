# Testing — MARC JSONS

## Stack

- **Runner**: Vitest 4.x (`vitest.config.ts` at project root)
- **Test location**: `src/tests/`
- **Setup file**: `src/tests/setup.ts` — stubs the `figma` global so modules that reference Figma API shapes at import time don't throw in Node

## Commands

```bash
npm test          # single run (CI / pre-PR gate)
npm run test:watch  # watch mode during development
```

## Pre-PR gate

`scripts/pre-pr-check.sh` runs `npm test` then `npm run build`. Both must pass before a PR is opened.

## Coverage — what is tested

| File | Functions covered |
|------|-------------------|
| `src/generators/shared.ts` | `hexToRgb`, `hexToAlpha` |
| `src/generators/colorGenerator.ts` | `formatTokenName`, `groupColors` |
| `src/generators/tokenResolver.ts` | `matchesKeywords`, `weightToFigmaStyle`, `getColorToken`, `getSpacingToken`, `getRadiusToken`, `getTypographyToken` |
| `src/parser/jsonParser.ts` | `parseJSON`, `inferType`, `resolveValue`, `parseNumericValue` |
| `src/parser/markdownParser.ts` | `parseMarkdown`, `extractMeta`, `splitByHeadings`, `classifyAndAddTable` |
| `src/parser/tableParser.ts` | `parseMarkdownTable`, `splitTableRow`, `stripBackticks` |

## Key regressions covered

1. **commit 38ea79e — shadow alpha parsing**: `hexToAlpha("#00000026")` must return `~0.149` (38/255), not a wrong fallback. 5 tests in `shared.test.ts` cover 8-digit, 6-digit, and zero-alpha cases.
2. **W3C DTCG token references**: `resolveValue("{color.primary}", tokens)` resolves transitively; tested with single and nested references.
3. **Dark mode routing**: Colors with "dark" or "night" in their name (or in their section heading) must land in `darkColors`, never `colors`.

## What is intentionally skipped — Figma API dependency

These modules call `figma.*` at runtime and cannot be unit tested without a real Figma sandbox:

| File / function | Reason skipped |
|-----------------|----------------|
| `src/code.ts` | Plugin entry point — orchestrates all generators via Figma API |
| `src/ui.ts` | UI iframe — browser context only |
| `src/generators/shared.ts` — `createAutoLayoutFrame`, `loadFontSafe`, `createTextNode`, `createSectionTitle`, `createLabel`, `createDivider`, `createSectionFrame`, `appendFill` | All call `figma.create*` or `figma.loadFontAsync` |
| `src/generators/colorGenerator.ts` — `generateColors`, `generateDarkColors`, `createSwatchColumn` | Call `figma.createRectangle` and `figma.createText` |
| `src/generators/typographyGenerator.ts` | Calls `figma.*` node builders |
| `src/generators/spacingGenerator.ts` | Calls `figma.*` node builders |
| `src/generators/radiusGenerator.ts` | Calls `figma.*` node builders |
| `src/generators/shadowGenerator.ts` — `generateShadows`, `createShadowItem` | Call `figma.createRectangle` |
| `src/generators/componentGenerator.ts` — all `generate*` functions | Heavy `figma.*` usage throughout |
| `src/generators/variableGenerator.ts` | Calls `figma.variables.*` |
| `src/generators/androidComponentGenerator.ts` | Calls `figma.*` (confirmed at import) |
| `src/generators/headerGenerator.ts` | Calls `figma.*` |
| `src/generators/icons.ts` | Calls `figma.createVector` |

### Note on `loadFontSafe` (regression commit d370efb)

`loadFontSafe` contains logic to distinguish "missing typeface" from "missing weight" by probing `figma.loadFontAsync`. The probe logic is testable in principle, but because both code paths call `figma.loadFontAsync` and the meaningful difference is in the exception thrown by that async call, reliable testing requires either a Figma plugin test harness or a dedicated mock of `figma.loadFontAsync` that simulates per-font throw behaviour. This is left as a future task if the Figma Plugin Testing Toolkit or a comparable harness is adopted.
