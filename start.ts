import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Parse command line arguments
const args = process.argv.slice(2);
const hasInitCommand = args.length > 0;
const initCommand = hasInitCommand ? args[0] : '';

// Function to start the server
function startServer() {
  const isQuietMode = process.env.CLICY_QUIET === 'true';

  if (!isQuietMode) {
    console.log('Starting Clicy server...');
  }

  // Set environment variable to hide server startup message
  const env = { ...process.env, CLICY_QUIET: process.env.CLICY_QUIET || 'false' };

  // Check if the compiled JavaScript file exists
  const serverJsPath = path.join(process.cwd(), 'dist', 'cli', 'server.js');
  const serverTsPath = path.join(process.cwd(), 'cli', 'server.ts');

  let serverProcess;

  if (fs.existsSync(serverJsPath)) {
    // Use the compiled JavaScript file if it exists
    console.log('Using compiled JavaScript server file');
    serverProcess = spawn('node', [serverJsPath], {
      stdio: isQuietMode ? 'ignore' : 'inherit',
      shell: true,
      env,
      windowsHide: true,
      detached: true
    });
  } else {
    // Fall back to ts-node if the compiled file doesn't exist
    console.log('Compiled JavaScript server file not found, falling back to ts-node');
    console.log('Consider running "npm run build" first for better performance');
    serverProcess = spawn('npx', ['ts-node', serverTsPath], {
      stdio: isQuietMode ? 'ignore' : 'inherit',
      shell: true,
      env,
      windowsHide: true,
      detached: true
    });
  }

  serverProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  // Give the server a moment to start up
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      if (!isQuietMode) {
        console.log('Server started successfully');
      }
      resolve();
    }, 2000);
  });
}

// Function to launch Cypress
function launchCypress() {
  console.log('Launching Cypress...');
  const cypressProcess = spawn('npx', ['cypress', 'open', '--e2e', '--browser', 'chrome'], {
    stdio: 'inherit',
    shell: true,
    windowsHide: true
  });

  cypressProcess.on('error', (error) => {
    console.error('Failed to launch Cypress:', error);
    process.exit(1);
  });

  return cypressProcess;
}

// Function to inject an initial command if provided
function injectInitialCommand(command: string) {
  if (!command) return;

  console.log(`Injecting initial command: ${command}`);

  // Create the live.cy.ts file with the initial command
  const specPath = path.join(process.cwd(), 'cypress', 'e2e', 'live.cy.ts');
  const content = `
describe('Live Test', () => {
  it('runs REPL steps', () => {
    ${command}
  });
});
`;

  // Ensure the directory exists
  const dir = path.dirname(specPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(specPath, content);

  // Also update the history file
  const historyPath = path.join(process.cwd(), 'CliCy-history.json');
  const historyData = { commands: [command] };
  fs.writeFileSync(historyPath, JSON.stringify(historyData, null, 2));

  console.log('Initial command injected successfully');
}

// Main function to run everything
async function main() {
  try {
    // Start the server first
    await startServer();

    // Inject initial command if provided
    if (hasInitCommand) {
      injectInitialCommand(initCommand);
    }

    // Then launch Cypress
    const cypressProcess = launchCypress();

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('Shutting down...');
      cypressProcess.kill();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
