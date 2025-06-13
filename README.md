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
clicy > goto("https://example.com")
clicy > click("Login")
clicy > write("myemail@example.com", "Email")
clicy > click("Submit")
```

### Special Commands

- `.code` - Export all commands to a Cypress spec file (generatedCode.cy.ts)
- `.reset` - Clear command history and start fresh
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
2. Commands are accumulated and written to a temporary spec file
3. Cypress detects the file change and automatically re-runs the test
4. This creates the illusion of real-time execution in the browser
5. Command history is maintained for export

### Understanding the Execution Model

Cypress itself is not designed to execute commands live like a REPL. Instead, clicy uses the following approach:

1. **File Watching**: Cypress is configured to watch for changes to the test file
2. **Command Accumulation**: Each command you type is added to the previous commands
3. **File Updates**: The test file is updated with all commands
4. **Auto Re-run**: Cypress detects the file change and re-runs the entire test
5. **Visual Feedback**: The browser window updates, giving the appearance of live command execution

This approach leverages Cypress's built-in file watching capability to create a REPL-like experience, even though Cypress itself is running complete test files rather than individual commands.

## License

MIT
