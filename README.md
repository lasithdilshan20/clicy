# clicy

Cypress-based automation tool with REPL (Read-Eval-Print Loop) experience similar to Taiko, available both as a CLI and directly in the Cypress Test Runner UI.

## Features

- Interactive REPL shell for Cypress commands
- Live execution in Cypress as you type
- Export commands to a Cypress spec file
- Simple, intuitive DSL for browser automation
- Integrated UI in the Cypress Test Runner (NEW!)

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

### CLI Mode

Start the REPL in CLI mode:

```bash
npm start
# or
npx clicy
```

### Cypress Test Runner UI Mode (NEW!)

1. Start the Clicy server:

```bash
npm run clicy:server
```

2. In a separate terminal, start the Cypress Test Runner:

```bash
npm run clicy:test
```

3. Once Cypress opens, click on the `live.cy.ts` test file to open it in the Test Runner.

4. You'll see the Clicy REPL UI at the bottom of the Test Runner window with:
   - An input field for entering Cypress commands
   - Run button to execute the current command
   - Export button to save all commands to a file
   - Reset button to clear all commands

### Example Commands

```
clicy > goto()
Please enter the URL:
example.com
✅ Command added: goto("example.com")
clicy > click("Login")
clicy > write("myemail@example.com", "Email")
clicy > click("Submit")
```

You can also provide the URL directly:

```
clicy > goto("https://example.com")
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

### CLI vs UI Mode

Clicy offers two ways to interact with the REPL:

#### CLI Mode
- Uses Node.js REPL interface in the terminal
- Commands are processed directly by the Node.js application
- File updates happen locally within the same process

#### UI Mode
- Uses a web-based UI injected into the Cypress Test Runner
- Commands are sent to an Express server via HTTP requests
- The server processes commands and updates the test file
- Cypress detects the file changes and re-runs the tests
- The UI provides visual feedback on command execution

Both modes use the same underlying mechanism of updating the test file and letting Cypress re-run it, but they offer different interfaces for different use cases.

### Editing the Spec File Directly

You can also edit the spec file directly, and the REPL will update its command history to match the changes. This is useful if you want to remove or modify commands that you've already entered.

The spec file is located at `cypress/e2e/live.cy.ts`. When you make changes to this file, the REPL will detect the changes and update its command history accordingly. This means you can:

1. Remove commands by deleting lines from the file
2. Modify commands by editing lines in the file
3. Add commands by adding lines to the file

The REPL will always use the latest version of the file when executing commands.

## Troubleshooting

### Common Issues

#### "Failed to load resource: net::ERR_EMPTY_RESPONSE"

This error occurs when the Cypress UI cannot connect to the Clicy server. To resolve this issue:

1. **Make sure the server is running**: Always start the server before using the UI mode
   ```bash
   npm run clicy:server
   ```

2. **Check for port conflicts**: Ensure that port 4000 is not being used by another application

3. **Restart the server**: If the server is running but not responding, try restarting it

4. **Check your firewall settings**: Make sure your firewall is not blocking connections to localhost:4000

The UI now includes automatic retry logic that will attempt to reconnect to the server if the connection fails, but the server must be running for the UI to work properly.

#### Other Network Issues

If you're experiencing other network-related issues:

1. **Check your network connection**: Make sure you have a stable internet connection
2. **Try using a different browser**: Some browsers may have stricter security settings
3. **Check for CORS issues**: If you're using a custom domain, make sure CORS is properly configured

## License

MIT
