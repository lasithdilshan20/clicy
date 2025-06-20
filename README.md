# CliCy – Cypress REPL for Fast Command Authoring 🧠💻

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue.svg)](https://github.com/lasithdilshan20/clicy)
[![Author](https://img.shields.io/badge/Author-Lasitha%20W.-orange.svg)](https://github.com/lasithdilshan20)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/clicy.svg)](https://www.npmjs.com/package/clicy)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![Cypress Version](https://img.shields.io/badge/cypress-%5E13.0.0-brightgreen.svg)](https://docs.cypress.io/)

**CliCy** is a Cypress-based REPL (Read-Eval-Print Loop) plugin that enables fast, interactive command authoring via both CLI and in-browser UI modes. Use intuitive DSL commands, preview results live, and export full test specs—directly from the browser or terminal.

---

## 🔧 Installation

```bash
# Local install (recommended for CI and project use)
npm install --save-dev clicy

# Or install globally to use as CLI
npm install -g clicy
```

---

## 🚀 Getting Started

### CLI Mode

```bash
# Start the REPL
npx clicy

# Or globally
clicy
```

### Cypress Test Runner UI (Live Panel)

1. Start the server:
   ```bash
   npm run clicy:server
   ```

2. Launch Cypress Test Runner:
   ```bash
   npm run clicy:test
   ```

3. Open `live.cy.ts` test – the CliCy UI panel will appear at the bottom.

---

## ✨ Features

- 🧪 Real-time Cypress command execution
- 🧠 Smart DSL like `goto()`, `click()`, `write()` etc.
- 📤 Export generated commands to `.cy.ts`
- 🖥️ In-browser REPL panel with preview
- 🔁 Integrated with Cypress auto-run

---

## 🧬 Supported DSL Commands

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

## 🧑‍💻 Developer Commands

```bash
# Dev mode
npm run dev

# Open Cypress GUI
npm run cypress:open
```

---

## 📝 Export Shortcuts (from REPL)

- `.code` – Export to Cypress spec
- `.reset` – Clear REPL state
- `.exit` – Quit REPL

---

## ⚠️ Troubleshooting

### UI Panel not loading?

- Ensure server is running on port `4000`:  
  `npm run clicy:server`
- Check browser dev tools for CORS or port conflicts

---

## 📁 File Locations

- **Generated spec file**: `cypress/e2e/live.cy.ts`
- **DSL Config**: `src/dsl.ts`
- **Custom selector logic**: `src/selectors.ts`

---

## 🧪 Requirements

- **Node.js** ≥ 18.x
- **Cypress** ≥ 13.x
- Compatible with both `Component` and `E2E` testing

---

## 📄 License

[MIT](https://opensource.org/licenses/MIT) – by [Lasitha Wijenayake](https://github.com/lasithdilshan20)

---

## 🙌 Contributions Welcome

Star ⭐, fork 🍴, or contribute a PR 🛠️ at  
👉 https://github.com/lasithdilshan20/clicy