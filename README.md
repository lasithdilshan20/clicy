# CliCy – Cypress REPL for Fast Command Authoring

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue.svg)](https://github.com/lasithdilshan20/clicy)
[![Author](https://img.shields.io/badge/Author-Lasitha%20W.-orange.svg)](https://github.com/lasithdilshan20)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/clicy.svg)](https://www.npmjs.com/package/clicy)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![Cypress Version](https://img.shields.io/badge/cypress-%5E13.0.0-brightgreen.svg)](https://docs.cypress.io/)

**CliCy** is a Cypress-based REPL (Read-Eval-Print Loop) plugin that enables fast, interactive command authoring via both CLI and in-browser UI modes. Use intuitive DSL commands, preview results live, and export full test specs—directly from the browser or terminal.

---

## Installation

```bash
# Local install (recommended for CI and project use)
npm install --save-dev clicy

# Or install globally to use as CLI
npm install -g clicy
```

---

## Getting Started

### Quick Start

1. Install CliCy:
   ```bash
   npm install --save-dev clicy
   ```

2. Add `clicyCommand: true` to your Cypress configuration:
   ```javascript
   // cypress.config.js
   module.exports = {
     e2e: {
       // Enable CliCy
       clicyCommand: true,
     },
   }
   ```

3. Run Cypress:
   ```bash
   npx cypress open
   ```

That's it! The CliCy REPL will automatically activate and the live spec will be available in the Cypress Test Runner.

### CLI Mode (Optional)

If you prefer using the CLI directly:

```bash
# Start the REPL in CLI mode
npx clicy

# Or if installed globally
clicy
```

### Manual Setup (Advanced)

If you need more control over the setup:

1. Start the server manually:
   ```bash
   npm run clicy:server
   ```

2. Launch Cypress Test Runner:
   ```bash
   npm run clicy:test
   ```

3. Open `live.cy.ts` test – the CliCy UI panel will appear at the bottom.

### Configuration

Simply set `clicyCommand: true` in your Cypress configuration, and CliCy will automatically set up everything for you:

```javascript
// cypress.config.js
module.exports = {
  e2e: {
    setupNodeEvents(on, config) {
      return require('clicy/plugin').setupNodeEvents(on, config);
    },
    clicyCommand: true,
  },
}
```

For TypeScript projects:

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      return require('clicy/plugin').setupNodeEvents(on, config);
    },
    clicyCommand: true, // TypeScript type definitions included
  },
});
```

Alternatively, for TypeScript projects with imports:

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';
import clicyPlugin from 'clicy/plugin';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      return clicyPlugin.setupNodeEvents(on, config);
    },
    clicyCommand: true,
  },
});
```

---

## Features

- Real-time Cypress command execution
- Smart DSL like `goto()`, `click()`, `write()` etc.
- Export generated commands to `.cy.ts`
- In-browser REPL panel with preview
- Integrated with Cypress auto-run

---

## Supported DSL Commands

### Navigation
- `goto(url)`
- `visit(url)`
- `origin(url)`

### Actions
- `click(label, selectorType?)`
- `write(value, label)`
- `type(text)`
- `clear(label)`
- `check(label)`
- `uncheck(label)`
- `select(option, label)`

### Assertions
- `shouldContain(text)`
- `shouldBeVisible(label)`
- `shouldHaveValue(label, value)`

### Network
- `intercept(method, url)`
- `waitForAlias(alias)`
- `session(name, setupFn)`

### Utilities
- `wait(ms)`
- `reload()`
- `screenshot(name?)`

---

## Developer Commands

```bash
# Dev mode
npm run dev

# Open Cypress GUI
npm run cypress:open
```

---

## Export Shortcuts (from REPL)

- `.code` – Export to Cypress spec
- `.reset` – Clear REPL state
- `.exit` – Quit REPL

---

## Troubleshooting

### UI Panel not loading?

- Verify that `clicyCommand: true` is set in your Cypress configuration
- Make sure you've installed CliCy properly: `npm install --save-dev clicy`
- Check browser dev tools for CORS or port conflicts
- If you're using a custom Cypress configuration that overrides the default settings, make sure you're not overriding the CliCy plugin setup
- For manual setup, ensure server is running on port `4000`: `npm run clicy:server`

### Still having issues?

If the automatic setup doesn't work for your project:

1. Check that your Cypress configuration file (cypress.config.js or cypress.config.ts) was properly updated during installation
2. Try running `npx cypress open` with the `--config-file` option to specify your configuration file
3. If all else fails, you can manually set up CliCy by following the "Manual Setup" instructions in the Getting Started section

---

## File Locations

- **Generated spec file**: `cypress/e2e/live.cy.ts` (TypeScript) or `cypress/e2e/live.cy.js` (JavaScript)
- **DSL Config**: `src/dsl.ts`
- **Custom selector logic**: `src/selectors.ts`

## JavaScript & TypeScript Compatibility

CliCy automatically detects whether your project is using TypeScript or JavaScript:

- For TypeScript projects, it generates a `live.cy.ts` file
- For JavaScript projects, it generates a `live.cy.js` file

The detection is based on:
1. Presence of `tsconfig.json`
2. TypeScript dependency in `package.json`
3. Existence of `.ts` files in the Cypress directory

---

## Requirements

- **Node.js** ≥ 18.x
- **Cypress** ≥ 13.x
- Compatible with both `Component` and `E2E` testing

---

## License

[MIT](https://opensource.org/licenses/MIT) – by [Lasitha Wijenayake](https://github.com/lasithdilshan20)

---

## Contributions Welcome

Star, fork 🍴, or contribute a PR 🛠️ at  
https://github.com/lasithdilshan20/clicy
