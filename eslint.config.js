// Lint rules that catch the mistakes a split codebase invites: a name used but never imported, or imported and never used.
const browser = Object.fromEntries(["window", "document", "navigator", "localStorage", "setTimeout", "clearTimeout", "setInterval", "clearInterval",
  "requestAnimationFrame", "performance", "getComputedStyle", "innerWidth", "innerHeight", "ResizeObserver", "console", "self", "caches", "fetch", "location", "Image", "OffscreenCanvas"].map(k => [k, "readonly"]));
const node = Object.fromEntries(["process", "console", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "URL"].map(k => [k, "readonly"]));

export default [
  {
    files: ["src/**/*.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: browser },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }],
      "no-redeclare": "error",
      "no-restricted-imports": "off"
    }
  },
  {
    // Game rules stay testable without a browser: no DOM, no imports from the UI.
    files: ["src/core/**/*.js", "src/minigames/*/logic.js"],
    languageOptions: { globals: { setTimeout: "readonly", clearTimeout: "readonly", setInterval: "readonly", clearInterval: "readonly", localStorage: "readonly", console: "readonly" } },
    rules: {
      "no-restricted-imports": ["error", { patterns: [{ group: ["**/ui/**", "./view.js", "../*/view.js"], message: "Game logic must not import UI code." }] }]
    }
  },
  {
    files: ["tests/**/*.mjs", "tools/**/*.mjs", "eslint.config.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: { ...node, ...browser } },
    rules: { "no-undef": "error", "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }] }
  }
];
