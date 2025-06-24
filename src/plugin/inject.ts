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

  // Start the server automatically when Cypress starts
  setupServer(on);

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

/**
 * Sets up the CliCy server
 * @param on Cypress 'on' function
 */
function setupServer(on: any): void {
  let serverProcess: any;

  on('before:browser:launch', (browser: any, launchOptions: any) => {
    // Set environment variable to hide server startup message
    process.env.CLICY_QUIET = 'true';

    // Check if ts-node is available
    const serverPath = path.resolve(__dirname, '../../cli/server.ts');
    const serverJsPath = path.resolve(__dirname, '../../dist/cli/server.js');

    // Create environment object with CLICY_QUIET set to true
    const env = { ...process.env, CLICY_QUIET: 'true' };

    const { spawn } = require('child_process');

    if (fs.existsSync(serverPath)) {
      // Use ts-node for development
      serverProcess = spawn('npx', ['ts-node', serverPath], {
        stdio: 'ignore', // Hide console window
        shell: true,
        detached: true,
        env,
        windowsHide: true
      });
    } else if (fs.existsSync(serverJsPath)) {
      // Use compiled JS for production
      serverProcess = spawn('node', [serverJsPath], {
        stdio: 'ignore', // Hide console window
        shell: true,
        detached: true,
        env,
        windowsHide: true
      });
    } else {
      console.error('[CliCy] Server file not found. Please make sure the project is set up correctly.');
      return launchOptions;
    }

    // Handle server process errors
    serverProcess.on('error', (error: Error) => {
      console.error('[CliCy] Failed to start server:', error);
    });

    // Give the server a moment to start up
    setTimeout(() => {
      // Only log if not in quiet mode
      if (process.env.CLICY_QUIET !== 'true') {
        console.log('[CliCy] Server started successfully');
      }
    }, 2000);

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
}