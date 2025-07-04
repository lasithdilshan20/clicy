import * as path from 'path';
import * as fs from 'fs';

/**
 * Injects CliCy support file into Cypress configuration
 * @param on Cypress 'on' function
 * @param config Cypress config object
 * @returns Modified config object
 */
export function injectCliCy(on: any, config: any): any {
  // Check if clicyCommand is enabled (default to false if not specified)
  const clicyEnabled = config.e2e?.clicyCommand === true;

  // If clicyCommand is disabled, skip CliCy initialization
  if (!clicyEnabled) {
    return config;
  }

  // Check if supportFile is undefined or false
  if (!config.e2e?.supportFile) {
    // Set it to CliCy's internal support file
    config.e2e = config.e2e || {};

    // Use require.resolve to get the path to the support file
    try {
      // First try to resolve from the installed package
      const supportFilePath = require.resolve('clicy/support');
      config.e2e.supportFile = supportFilePath;
      console.log(`[CliCy] Using support file: ${supportFilePath}`);
    } catch (error) {
      // Fallback to the local path for development
      const supportFilePath = path.resolve(__dirname, '../../cypress/support/e2e.ts');
      if (fs.existsSync(supportFilePath)) {
        config.e2e.supportFile = supportFilePath;
        console.log(`[CliCy] Using local support file: ${supportFilePath}`);
      } else {
        console.warn('[CliCy] Support file not found. REPL UI may not be available.');
      }
    }
  } else {
    console.log(`[CliCy] Using existing support file: ${config.e2e.supportFile}`);
    // Don't override existing supportFile, user will need to manually import the REPL initializer
  }

  // Generate the live spec file based on project type
  const projectRoot = process.cwd();
  generateLiveSpec(projectRoot);

  // Start the server immediately instead of waiting for browser launch
  // This ensures the server is running before tests start
  startServer();

  // Also set up the server lifecycle hooks for proper cleanup
  setupServerHooks(on);

  // Return the updated config
  return config;
}

/**
 * Generates the appropriate live spec file based on project type
 * @param projectRoot The root directory of the project
 * @param force Whether to overwrite an existing file
 */
function generateLiveSpec(projectRoot: string, force: boolean = false): void {
  // TypeScript template for live.cy.ts
  const tsTemplate = `
describe('Live CLI Commands', () => {
  it('executes REPL steps', () => {
    cy.visit('/');
    // Commands will be dynamically injected by CliCy
  });
});
`;

  // JavaScript template for live.cy.js
  const jsTemplate = `
describe('Live CLI Commands', () => {
  it('executes REPL steps', () => {
    cy.visit('/');
    // Commands will be dynamically injected by CliCy
  });
});
`;

  const isTS = isTypeScriptProject(projectRoot);
  const fileName = isTS ? 'live.cy.ts' : 'live.cy.js';
  const template = isTS ? tsTemplate : jsTemplate;

  // Ensure the cypress/e2e directory exists
  const cypressE2eDir = path.join(projectRoot, 'cypress', 'e2e');
  if (!fs.existsSync(cypressE2eDir)) {
    try {
      fs.mkdirSync(cypressE2eDir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${cypressE2eDir}:`, error);
      return;
    }
  }

  const filePath = path.join(cypressE2eDir, fileName);

  // Check if file already exists and force is not enabled
  if (fs.existsSync(filePath) && !force) {
    console.log(`[CliCy] Live spec file already exists at ${filePath}`);
    return;
  }

  try {
    // Write the template to the file
    fs.writeFileSync(filePath, template);
    console.log(`[CliCy] Generated live spec file at ${filePath}`);
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
  }
}

/**
 * Detects whether the project is using TypeScript or JavaScript
 * @param projectRoot The root directory of the project
 * @returns True if the project is using TypeScript
 */
function isTypeScriptProject(projectRoot: string): boolean {
  // Check for tsconfig.json
  if (fs.existsSync(path.join(projectRoot, 'tsconfig.json'))) {
    return true;
  }

  // Check for typescript dependency in package.json
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const hasTsDep = 
        (packageJson.dependencies && packageJson.dependencies.typescript) || 
        (packageJson.devDependencies && packageJson.devDependencies.typescript);
      if (hasTsDep) {
        return true;
      }
    }
  } catch (error) {
    console.error('Error checking package.json:', error);
  }

  // Check if there are any .ts files in the cypress directory
  try {
    const cypressDir = path.join(projectRoot, 'cypress');
    if (fs.existsSync(cypressDir)) {
      const hasTypeScriptFiles = findTypeScriptFiles(cypressDir);
      if (hasTypeScriptFiles) {
        return true;
      }
    }
  } catch (error) {
    console.error('Error checking cypress directory:', error);
  }

  return false;
}

/**
 * Recursively searches for .ts files in a directory
 * @param dir Directory to search
 * @returns True if any .ts files are found
 */
function findTypeScriptFiles(dir: string): boolean {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const found = findTypeScriptFiles(filePath);
      if (found) return true;
    } else if (file.endsWith('.ts')) {
      return true;
    }
  }

  return false;
}

// Global variable to track the server process
let serverProcess: any = null;

/**
 * Checks if the server is healthy with multiple retries
 * @param retries Number of retries
 * @param delay Delay between retries in ms
 */
function checkServerHealth(retries: number = 10, delay: number = 1000): void {
  console.log(`[CliCy] Checking server health (attempt ${11 - retries}/10)...`);

  try {
    const http = require('http');
    const req = http.get('http://localhost:4000/commands', {
      timeout: 2000 // 2 second timeout for each request
    }, (res: any) => {
      if (res.statusCode === 200) {
        console.log('[CliCy] Server is running and responding to requests');
        // Server is healthy, no need for more retries
      } else {
        console.warn(`[CliCy] Server responded with status code: ${res.statusCode}`);
        retryHealthCheck(retries, delay);
      }
    });

    req.on('error', (err: Error) => {
      console.warn('[CliCy] Server health check failed:', err.message);
      retryHealthCheck(retries, delay);
    });

    req.on('timeout', () => {
      console.warn('[CliCy] Server health check timed out');
      req.abort();
      retryHealthCheck(retries, delay);
    });

    req.end();
  } catch (err) {
    console.warn('[CliCy] Error checking server health:', err);
    retryHealthCheck(retries, delay);
  }
}

/**
 * Retries the health check if there are retries left
 * @param retries Number of retries left
 * @param delay Delay between retries in ms
 */
function retryHealthCheck(retries: number, delay: number): void {
  if (retries > 1) {
    console.log(`[CliCy] Retrying server health check in ${delay}ms...`);
    setTimeout(() => checkServerHealth(retries - 1, delay), delay);
  } else {
    console.warn('[CliCy] Server health check failed after multiple retries');
    console.warn('[CliCy] The server may still be starting up. Cypress will continue, but commands may not work until the server is ready.');
  }
}

/**
 * Pre-warms the server with a few requests to ensure it's fully initialized
 * This helps with any lazy-loading or initialization that might happen on the first request
 */
function prewarmServer(): void {
  console.log('[CliCy] Pre-warming server...');

  // Make requests to all the endpoints the client will use
  const endpoints = [
    '/commands',
    '/history'
  ];

  // Make 3 requests to each endpoint with a small delay between them
  let requestCount = 0;
  const totalRequests = endpoints.length * 3;

  function makeRequest(endpoint: string, attempt: number) {
    try {
      const http = require('http');
      const req = http.get(`http://localhost:4000${endpoint}`, {
        timeout: 1000 // 1 second timeout for pre-warming requests
      }, (res: any) => {
        requestCount++;
        console.log(`[CliCy] Pre-warm request ${requestCount}/${totalRequests} to ${endpoint} completed with status ${res.statusCode}`);

        // Drain the response data to free up memory
        res.resume();

        if (requestCount === totalRequests) {
          console.log('[CliCy] Server pre-warming completed');
        }
      });

      req.on('error', (err: Error) => {
        console.warn(`[CliCy] Pre-warm request to ${endpoint} failed:`, err.message);
        requestCount++;

        if (requestCount === totalRequests) {
          console.log('[CliCy] Server pre-warming completed with some errors');
        }
      });

      req.on('timeout', () => {
        console.warn(`[CliCy] Pre-warm request to ${endpoint} timed out`);
        req.abort();
        requestCount++;

        if (requestCount === totalRequests) {
          console.log('[CliCy] Server pre-warming completed with some timeouts');
        }
      });

      req.end();
    } catch (err) {
      console.warn(`[CliCy] Error making pre-warm request to ${endpoint}:`, err);
      requestCount++;

      if (requestCount === totalRequests) {
        console.log('[CliCy] Server pre-warming completed with some errors');
      }
    }
  }

  // Make the requests with a small delay between them
  endpoints.forEach((endpoint) => {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        makeRequest(endpoint, i + 1);
      }, i * 200); // 200ms between requests to the same endpoint
    }
  });
}

/**
 * Starts the CliCy server immediately
 * @returns The server process
 */
function startServer(): any {
  // If server is already running, don't start it again
  if (serverProcess) {
    console.log('[CliCy] Server is already running');
    return serverProcess;
  }

  console.log('[CliCy] Starting server...');

  // Set environment variable to hide server startup message
  process.env.CLICY_QUIET = 'true';

  // Check if ts-node is available
  const serverPath = path.resolve(__dirname, '../../cli/server.ts');
  const serverJsPath = path.resolve(__dirname, '../../dist/cli/server.js');

  // Create environment object with CLICY_QUIET set to true
  const env = { ...process.env, CLICY_QUIET: 'true' };

  const { spawn } = require('child_process');

  try {
    if (fs.existsSync(serverPath)) {
      // Use ts-node for development
      console.log('[CliCy] Using development server path:', serverPath);
      serverProcess = spawn('npx', ['ts-node', serverPath], {
        stdio: 'inherit', // Show console window for better debugging
        shell: true,
        detached: false, // Keep process attached to parent
        env,
        windowsHide: false // Make sure window is visible on Windows
      });
    } else if (fs.existsSync(serverJsPath)) {
      // Use compiled JS for production
      console.log('[CliCy] Using production server path:', serverJsPath);
      serverProcess = spawn('node', [serverJsPath], {
        stdio: 'inherit', // Show console window for better debugging
        shell: true,
        detached: false, // Keep process attached to parent
        env,
        windowsHide: false // Make sure window is visible on Windows
      });
    } else {
      console.error('[CliCy] Server file not found. Please make sure the project is set up correctly.');
      return null;
    }

    // Handle server process errors
    serverProcess.on('error', (error: Error) => {
      console.error('[CliCy] Failed to start server:', error);
      serverProcess = null;
    });

    // Verify the server is running by checking if the process is still alive
    if (serverProcess && serverProcess.pid) {
      console.log(`[CliCy] Server process started with PID: ${serverProcess.pid}`);
      console.log('[CliCy] You should see a command window with the server output');
      console.log('[CliCy] If you do not see a command window, please check your system settings');
      console.log('[CliCy] The server needs to be running for Clicy commands to work');

      // Verify server is accessible with multiple retries
      checkServerHealth(10, 1000); // 10 retries, 1 second between retries

      // Pre-warm the server with a few requests to ensure it's fully initialized
      prewarmServer();
    } else {
      console.error('[CliCy] Failed to start server process. No PID available.');
      console.error('[CliCy] Please try running the server manually with: npm run clicy:server');
    }

    return serverProcess;
  } catch (error) {
    console.error('[CliCy] Error starting server:', error);
    return null;
  }
}

/**
 * Sets up the CliCy server lifecycle hooks
 * @param on Cypress 'on' function
 */
function setupServerHooks(on: any): void {
  // Ensure server is running when browser launches
  on('before:browser:launch', (browser: any, launchOptions: any) => {
    // If server isn't running yet, start it
    if (!serverProcess) {
      startServer();
    }
    return launchOptions;
  });

  // Clean up the server process when Cypress exits
  on('after:run', () => {
    if (serverProcess) {
      // Only log if not in quiet mode
      if (process.env.CLICY_QUIET !== 'true') {
        console.log('[CliCy] Shutting down server...');
      }
      // Kill the process and all its children
      if (process.platform === 'win32') {
        if (serverProcess.pid) {
          const { spawn } = require('child_process');
          spawn('taskkill', ['/pid', serverProcess.pid.toString(), '/f', '/t'], {
            stdio: 'inherit', // Show output for better debugging
            windowsHide: false // Make sure window is visible on Windows
          });
        }
      } else {
        if (serverProcess.pid) {
          process.kill(-serverProcess.pid);
        }
      }
      serverProcess = null;
    }
  });
}
