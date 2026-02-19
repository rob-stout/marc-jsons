import { DesignSystem } from "../parser/types";
import { hexToRgb } from "./shared";

export type VariableMode = "none" | "add" | "smart" | "replace";

interface VariableResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Create or update Figma variables from a parsed DesignSystem.
 *
 * Modes:
 *  - "add": Only create new variables. Skip any that already exist.
 *  - "smart": Update existing variables that match by name. Add new ones. Leave unmatched alone.
 *  - "replace": Delete all variables in the collection, recreate from scratch.
 */
export async function syncVariables(
  ds: DesignSystem,
  mode: VariableMode
): Promise<VariableResult> {
  const result: VariableResult = { created: 0, updated: 0, skipped: 0, errors: [] };
  if (mode === "none") return result;

  const collectionName = ds.meta.name || "Design System";

  // Find or create the variable collection
  let collection = findCollection(collectionName);

  if (mode === "replace" && collection) {
    // Delete all variables in this collection, then remove it
    deleteCollection(collection);
    collection = null;
  }

  if (!collection) {
    collection = figma.variables.createVariableCollection(collectionName);
  }

  const defaultModeId = collection.modes[0].modeId;

  // Check if there's a second mode for dark colors
  let darkModeId: string | null = null;
  if (ds.darkColors.length > 0) {
    if (collection.modes.length < 2) {
      try {
        collection.addMode("Dark");
      } catch (e) {
        // Free plans can't add modes — skip dark mode variables
        result.errors.push("Could not add Dark mode (may require paid plan)");
      }
    }
    if (collection.modes.length >= 2) {
      darkModeId = collection.modes[1].modeId;
      // Rename modes for clarity
      collection.renameMode(defaultModeId, "Light");
      collection.renameMode(darkModeId, "Dark");
    }
  }

  // Build a map of existing variables by name for smart mode
  const existingVars = new Map<string, Variable>();
  if (mode === "smart" || mode === "add") {
    const allVars = figma.variables.getLocalVariables();
    for (const v of allVars) {
      if (v.variableCollectionId === collection.id) {
        existingVars.set(v.name, v);
      }
    }
  }

  // --- Colors ---
  for (const color of ds.colors) {
    const name = sanitizeVariableName(color.name);
    const rgb = hexToRgb(color.hex);
    const figmaColor = { r: rgb.r, g: rgb.g, b: rgb.b, a: 1 };

    const existing = existingVars.get(name);
    if (existing) {
      if (mode === "add") {
        result.skipped++;
        continue;
      }
      // Smart: update value
      try {
        existing.setValueForMode(defaultModeId, figmaColor);
        result.updated++;
      } catch (e) {
        result.errors.push("Failed to update: " + name);
      }
    } else {
      try {
        const v = figma.variables.createVariable(name, collection.id, "COLOR");
        v.setValueForMode(defaultModeId, figmaColor);
        result.created++;
      } catch (e) {
        result.errors.push("Failed to create: " + name);
      }
    }
  }

  // --- Dark Colors (as values on the dark mode of same-named variables, or new variables) ---
  if (darkModeId) {
    for (const color of ds.darkColors) {
      // Try to match to a light-mode variable by stripping "Dark." prefix
      const darkName = sanitizeVariableName(color.name);
      const lightName = darkName
        .replace(/^Dark[./]/, "")
        .replace(/^dark[./]/, "");

      const rgb = hexToRgb(color.hex);
      const figmaColor = { r: rgb.r, g: rgb.g, b: rgb.b, a: 1 };

      // Check if there's a matching light variable
      const allCurrentVars = figma.variables.getLocalVariables("COLOR");
      const matchingLight = allCurrentVars.find(
        (v) => v.variableCollectionId === collection!.id && v.name === lightName
      );

      if (matchingLight) {
        try {
          matchingLight.setValueForMode(darkModeId!, figmaColor);
          result.updated++;
        } catch (e) {
          result.errors.push("Failed to set dark mode: " + lightName);
        }
      } else {
        // Create as its own variable
        const existing = existingVars.get(darkName);
        if (existing && mode === "add") {
          result.skipped++;
          continue;
        }
        try {
          if (existing) {
            existing.setValueForMode(defaultModeId, figmaColor);
            result.updated++;
          } else {
            const v = figma.variables.createVariable(darkName, collection.id, "COLOR");
            v.setValueForMode(defaultModeId, figmaColor);
            result.created++;
          }
        } catch (e) {
          result.errors.push("Failed to create dark color: " + darkName);
        }
      }
    }
  } else if (ds.darkColors.length > 0) {
    // No dark mode available — create dark colors as separate variables
    for (const color of ds.darkColors) {
      const name = sanitizeVariableName(color.name);
      const rgb = hexToRgb(color.hex);
      const figmaColor = { r: rgb.r, g: rgb.g, b: rgb.b, a: 1 };

      const existing = existingVars.get(name);
      if (existing && mode === "add") {
        result.skipped++;
        continue;
      }
      try {
        if (existing && mode === "smart") {
          existing.setValueForMode(defaultModeId, figmaColor);
          result.updated++;
        } else {
          const v = figma.variables.createVariable(name, collection.id, "COLOR");
          v.setValueForMode(defaultModeId, figmaColor);
          result.created++;
        }
      } catch (e) {
        result.errors.push("Failed to create: " + name);
      }
    }
  }

  // --- Spacing ---
  for (const token of ds.spacing) {
    const name = sanitizeVariableName(token.name);
    syncFloatVariable(name, token.value, collection, defaultModeId, existingVars, mode, result);
  }

  // --- Radius ---
  for (const token of ds.radius) {
    const name = sanitizeVariableName(token.name);
    syncFloatVariable(name, token.value, collection, defaultModeId, existingVars, mode, result);
  }

  return result;
}

function syncFloatVariable(
  name: string,
  value: number,
  collection: VariableCollection,
  modeId: string,
  existingVars: Map<string, Variable>,
  mode: VariableMode,
  result: VariableResult
): void {
  const existing = existingVars.get(name);
  if (existing) {
    if (mode === "add") {
      result.skipped++;
      return;
    }
    try {
      existing.setValueForMode(modeId, value);
      result.updated++;
    } catch (e) {
      result.errors.push("Failed to update: " + name);
    }
  } else {
    try {
      const v = figma.variables.createVariable(name, collection.id, "FLOAT");
      v.setValueForMode(modeId, value);
      result.created++;
    } catch (e) {
      result.errors.push("Failed to create: " + name);
    }
  }
}

function findCollection(name: string): VariableCollection | null {
  const collections = figma.variables.getLocalVariableCollections();
  return collections.find((c) => c.name === name) || null;
}

function deleteCollection(collection: VariableCollection): void {
  // Delete all variables in the collection first
  const allVars = figma.variables.getLocalVariables();
  for (const v of allVars) {
    if (v.variableCollectionId === collection.id) {
      v.remove();
    }
  }
  collection.remove();
}

/**
 * Sanitize token names for Figma variable naming.
 * Figma uses "/" as group separator (like folders).
 * Convert dots to slashes for grouping.
 */
function sanitizeVariableName(name: string): string {
  return name
    .replace(/\./g, "/")
    .replace(/[^a-zA-Z0-9/_\- ]/g, "")
    .trim();
}
