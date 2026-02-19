const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const watch = process.argv.includes("--watch");

// Step 1: Bundle code.ts → dist/code.js (Figma sandbox)
async function buildCode() {
  const ctx = await esbuild.context({
    entryPoints: ["src/code.ts"],
    bundle: true,
    outfile: "dist/code.js",
    format: "iife",
    target: "es2017",
    logLevel: "info",
  });
  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

// Step 2: Bundle ui.ts → temp JS, then inline into ui.html → dist/ui.html
async function buildUI() {
  // Bundle ui.ts to a temp file
  const ctx = await esbuild.context({
    entryPoints: ["src/ui.ts"],
    bundle: true,
    outfile: "dist/ui.js",
    format: "iife",
    target: "es2020",
    logLevel: "info",
  });
  if (watch) {
    // In watch mode, rebuild UI on changes
    await ctx.watch();
    // Also set up a watcher to re-inline when ui.js or ui.html changes
    const chokidar = (() => {
      try {
        return require("chokidar");
      } catch {
        return null;
      }
    })();
    if (chokidar) {
      chokidar
        .watch(["dist/ui.js", "src/ui.html"])
        .on("change", () => inlineUI());
    }
    // Initial inline
    setTimeout(() => inlineUI(), 500);
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    inlineUI();
  }
}

function inlineUI() {
  const htmlTemplate = fs.readFileSync(
    path.join(__dirname, "src/ui.html"),
    "utf8"
  );
  let jsBundle = "";
  try {
    jsBundle = fs.readFileSync(path.join(__dirname, "dist/ui.js"), "utf8");
  } catch {
    // ui.js not ready yet
    return;
  }
  const finalHtml = htmlTemplate.replace(
    "<!-- SCRIPT_INJECT -->",
    `<script>${jsBundle}</script>`
  );
  fs.writeFileSync(path.join(__dirname, "dist/ui.html"), finalHtml);
  console.log("  dist/ui.html written");
}

async function main() {
  await Promise.all([buildCode(), buildUI()]);
  if (!watch) {
    // Clean up temp ui.js
    try {
      fs.unlinkSync(path.join(__dirname, "dist/ui.js"));
    } catch {}
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
