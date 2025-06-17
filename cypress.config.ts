// cypress.config.ts
import { defineConfig } from 'cypress';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Start the server automatically when Cypress starts
      let serverProcess;

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
        return new Promise((resolve) => {
          setTimeout(() => {
            // Only log if not in quiet mode
            if (process.env.CLICY_QUIET !== 'true') {
              console.log('Clicy server started successfully');
            }
            resolve(launchOptions);
          }, 2000);
        });
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
            spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t'], {
              stdio: 'ignore',
              windowsHide: true
            });
          } else {
            process.kill(-serverProcess.pid);
          }
        }
      });
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    supportFile: 'support/e2e.ts',
    baseUrl: 'https://www.google.com',
  },
  video: false,
  screenshotOnRunFailure: false,
  watchForFileChanges: true,
});
