// cypress.config.ts
import { defineConfig } from 'cypress';
import { spawn, ChildProcess } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { generateLiveSpec } from './utils/specGenerator';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Check if clicyCommand is enabled (default to true if not specified)
      const clicyEnabled = config.e2e?.clicyCommand !== false;

      // If clicyCommand is disabled, skip CliCy initialization
      if (!clicyEnabled) {
        return config;
      }

      // Generate the live spec file based on project type
      const projectRoot = process.cwd();
      generateLiveSpec(projectRoot);

      // Set the support file to clicy's support file if not already overridden
      if (!config.e2e?.supportFile) {
        config.e2e = config.e2e || {};
        config.e2e.supportFile = 'cypress/support/e2e.ts';
      }

      // Log a message when CliCy starts
      console.log("[CliCy] REPL enabled. Open 'live.cy.ts' to begin scripting interactively.");

      // Optional: Inject a Cypress banner when clicyCommand is true
      // This is done by adding a custom command in the support file
      // The actual banner will be injected by the support file

      // Start the server automatically when Cypress starts
      let serverProcess: ChildProcess;

      on('before:browser:launch', (browser, launchOptions) => {
        // Set environment variable to hide server startup message
        process.env.CLICY_QUIET = 'true';

        // Check if ts-node is available
        const serverPath = join(__dirname, 'cli', 'server.ts');
        const serverJsPath = join(__dirname, 'dist', 'cli', 'server.js');

        // Create environment object with CLICY_QUIET set to true
        const env = { ...process.env, CLICY_QUIET: 'true' };

        if (existsSync(serverPath)) {
          // Use ts-node for development
          serverProcess = spawn('npx', ['ts-node', serverPath], {
            stdio: 'ignore', // Hide console window
            shell: true,
            detached: true,
            env,
            windowsHide: true
          });
        } else if (existsSync(serverJsPath)) {
          // Use compiled JS for production
          serverProcess = spawn('node', [serverJsPath], {
            stdio: 'ignore', // Hide console window
            shell: true,
            detached: true,
            env,
            windowsHide: true
          });
        } else {
          console.error('Server file not found. Please make sure the project is set up correctly.');
          return launchOptions;
        }

        // Handle server process errors
        serverProcess.on('error', (error) => {
          console.error('Failed to start server:', error);
        });

        // Give the server a moment to start up
        setTimeout(() => {
          // Only log if not in quiet mode
          if (process.env.CLICY_QUIET !== 'true') {
            console.log('Clicy server started successfully');
          }
        }, 2000);

        return launchOptions;
      });

      // Clean up the server process when Cypress exits
      on('after:run', () => {
        if (serverProcess) {
          // Only log if not in quiet mode
          if (process.env.CLICY_QUIET !== 'true') {
            console.log('Shutting down Clicy server...');
          }
          // Kill the process and all its children
          if (process.platform === 'win32') {
            if (serverProcess.pid) {
              spawn('taskkill', ['/pid', serverProcess.pid.toString(), '/f', '/t'], {
                stdio: 'ignore',
                windowsHide: true
              });
            }
          } else {
            if (serverProcess.pid) {
              process.kill(-serverProcess.pid);
            }
          }
        }
      });

      // Return the updated config
      return config;
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    baseUrl: 'https://www.google.com',
  },
  video: false,
  screenshotOnRunFailure: false,
  watchForFileChanges: true,
});
