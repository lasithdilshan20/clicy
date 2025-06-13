# clicy

Cypress-based CLI automation tool with REPL (Read-Eval-Print Loop) experience similar to Taiko.

## Features

- Interactive REPL shell for Cypress commands
- Live execution in Cypress as you type
- Export commands to a Cypress spec file
- Simple, intuitive DSL for browser automation

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/clicy.git
cd clicy

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

Start the REPL:

```bash
npm start
# or
npx clicy
```

### Example Commands

```
clicy > openBrowser()
clicy > goto("https://example.com")
clicy > click("Login")
clicy > write("myemail@example.com", "Email")
clicy > click("Submit")
```

### Special Commands

- `.code` - Export all commands to a Cypress spec file (generatedCode.cy.ts)
- `.exit` - Exit the REPL

## Development

```bash
# Run in development mode
npm run dev

# Open Cypress GUI
npm run cypress:open
```

## How It Works

1. Each command you type is parsed and mapped to Cypress commands
2. Commands are written to a temporary spec file
3. Cypress executes the spec file in real-time
4. Command history is maintained for export

## License

MIT
