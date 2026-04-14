// Stub the figma global so any module that references figma.* at import time
// doesn't throw. Pure-logic tests never call these methods, but TypeScript
// module loading will reference the shape at runtime.
(globalThis as Record<string, unknown>).figma = {
  createFrame: () => ({}),
  createRectangle: () => ({}),
  createText: () => ({}),
  loadFontAsync: async () => ({}),
  currentPage: { appendChild: () => {} },
};
