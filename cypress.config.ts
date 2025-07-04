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

      // Start the server immediately when Cypress is opened
      let serverProcess: ChildProcess | null;

      // Start the server immediately instead of waiting for browser launch
      startServer();

      // Also set up the browser launch hook for backward compatibility
      on('before:browser:launch', (browser, launchOptions) => {
        // If server isn't running yet, start it
        if (!serverProcess) {
          startServer();
        }
        return launchOptions;
      });

      // Function to start the server
      function startServer() {
        // If server is already running, don't start it again
        if (serverProcess) {
          console.log('[CliCy] Server is already running');
          return;
        }

        console.log('[CliCy] Starting server in a visible window...');

        // Define possible server paths
        // 1. Direct paths when running in development mode
        const devServerPath = join(__dirname, 'cli', 'server.ts');
        const prodServerPath = join(__dirname, 'dist', 'cli', 'server.js');

        // 2. Node modules paths when installed as a package
        const nodeModulesPath = join(process.cwd(), 'node_modules', 'clicy');
        const nodeModulesServerPath = join(nodeModulesPath, 'cli', 'server.ts');
        const nodeModulesServerJsPath = join(nodeModulesPath, 'dist', 'cli', 'server.js');

        // Log all potential paths for debugging
        console.log('[CliCy] Checking server paths:');
        console.log(`[CliCy] - Development: ${devServerPath}`);
        console.log(`[CliCy] - Production: ${prodServerPath}`);
        console.log(`[CliCy] - Node modules TS: ${nodeModulesServerPath}`);
        console.log(`[CliCy] - Node modules JS: ${nodeModulesServerJsPath}`);

        // Determine which server file to use
        let serverPath = '';
        let isTypeScript = false;

        // Create environment object without CLICY_QUIET to show server messages
        const env = { ...process.env };

        try {
          // Check all possible server paths in order of preference
          if (existsSync(devServerPath)) {
            // Use ts-node for development (local project)
            console.log('[CliCy] Using development server path:', devServerPath);
            serverPath = devServerPath;
            isTypeScript = true;
          } else if (existsSync(prodServerPath)) {
            // Use compiled JS for production (local project)
            console.log('[CliCy] Using production server path:', prodServerPath);
            serverPath = prodServerPath;
            isTypeScript = false;
          } else if (existsSync(nodeModulesServerPath)) {
            // Use ts-node for development (installed package)
            console.log('[CliCy] Using node_modules server path:', nodeModulesServerPath);
            serverPath = nodeModulesServerPath;
            isTypeScript = true;
          } else if (existsSync(nodeModulesServerJsPath)) {
            // Use compiled JS for production (installed package)
            console.log('[CliCy] Using node_modules production server path:', nodeModulesServerJsPath);
            serverPath = nodeModulesServerJsPath;
            isTypeScript = false;
          } else {
            console.error('[CliCy] Server file not found in any location. Please make sure the project is set up correctly.');
            console.error('[CliCy] Checked paths:');
            console.error(`[CliCy] - ${devServerPath}`);
            console.error(`[CliCy] - ${prodServerPath}`);
            console.error(`[CliCy] - ${nodeModulesServerPath}`);
            console.error(`[CliCy] - ${nodeModulesServerJsPath}`);
            return;
          }

          // Start the server with the appropriate command based on the file type
          if (isTypeScript) {
            serverProcess = spawn('npx', ['ts-node', serverPath], {
              stdio: 'inherit', // Show console window for better debugging
              shell: true,
              detached: false, // Keep process attached to parent
              env,
              windowsHide: false // Make sure window is visible on Windows
            });
          } else {
            serverProcess = spawn('node', [serverPath], {
              stdio: 'inherit', // Show console window for better debugging
              shell: true,
              detached: false, // Keep process attached to parent
              env,
              windowsHide: false // Make sure window is visible on Windows
            });
          }

          // Handle server process errors
          serverProcess.on('error', (error) => {
            console.error('[CliCy] Failed to start server:', error);
            serverProcess = null;
          });

          // Verify the server is running by checking if the process is still alive
          if (serverProcess && serverProcess.pid) {
            console.log(`[CliCy] Server process started with PID: ${serverProcess.pid}`);
            console.log('[CliCy] You should see a command window with the server output');
            console.log('[CliCy] The server needs to be running for Clicy commands to work');
          } else {
            console.error('[CliCy] Failed to start server process. No PID available.');
          }
        } catch (error) {
          console.error('[CliCy] Error starting server:', error);
        }
      }

      // Clean up the server process when Cypress exits
      on('after:run', () => {
        if (serverProcess) {
          console.log('[CliCy] Shutting down server...');

          // Kill the process and all its children
          if (process.platform === 'win32') {
            if (serverProcess.pid) {
              console.log(`[CliCy] Killing Windows process with PID: ${serverProcess.pid}`);
              spawn('taskkill', ['/pid', serverProcess.pid.toString(), '/f', '/t'], {
                stdio: 'inherit', // Show output for better debugging
                windowsHide: false // Make sure window is visible on Windows
              });
            }
          } else {
            if (serverProcess.pid) {
              console.log(`[CliCy] Killing Unix process with PID: ${serverProcess.pid}`);
              try {
                process.kill(serverProcess.pid);
              } catch (error) {
                console.error('[CliCy] Error killing server process:', error);
              }
            }
          }

          // Reset the server process variable
          serverProcess = null;
          console.log('[CliCy] Server shutdown complete');
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
