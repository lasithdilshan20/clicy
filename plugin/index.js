// @ts-check
const fs = require('fs');
const path = require('path');

/**
 * Detects whether the project is using TypeScript or JavaScript
 * @param {string} projectRoot The root directory of the project
 * @returns {boolean} True if the project is using TypeScript
 */
function isTypeScriptProject(projectRoot) {
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
 * @param {string} dir Directory to search
 * @returns {boolean} True if any .ts files are found
 */
function findTypeScriptFiles(dir) {
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

// Global variable to keep track of the server process
let serverProcess = null;

/**
 * Starts the CliCy server if it's not already running
 * @returns {ChildProcess|null}
 */
function startServer() {
  if (serverProcess) {
    console.log('[CliCy] Server is already running');
    return serverProcess;
  }

  console.log('[CliCy] Starting server...');

  // Resolve paths relative to the installed package
  const packageRoot = path.dirname(require.resolve('clicy/package.json'));
  const serverJsPath = path.join(packageRoot, 'dist', 'cli', 'server.js');
  const serverTsPath = path.join(packageRoot, 'cli', 'server.ts');

  // Extra logs to help debug the resolved paths
  console.log('[CliCy] packageRoot:', packageRoot);
  console.log('[CliCy] Looking for server files...');
  console.log(`  - ${serverJsPath} ${fs.existsSync(serverJsPath) ? 'found' : 'not found'}`);
  console.log(`  - ${serverTsPath} ${fs.existsSync(serverTsPath) ? 'found' : 'not found'}`);

  const env = { ...process.env, CLICY_QUIET: 'true' };
  const { spawn } = require('child_process');

  if (fs.existsSync(serverJsPath)) {
    console.log('[CliCy] Using production server path:', serverJsPath);
    serverProcess = spawn('node', [serverJsPath], {
      stdio: 'inherit',
      shell: true,
      detached: false,
      env,
      windowsHide: false,
    });
  } else if (fs.existsSync(serverTsPath)) {
    console.log('[CliCy] Using development server path:', serverTsPath);
    serverProcess = spawn('npx', ['ts-node', serverTsPath], {
      stdio: 'inherit',
      shell: true,
      detached: false,
      env,
      windowsHide: false,
    });
  } else {
    console.error('[CliCy] Server file not found. Please make sure the project is set up correctly.');
    return null;
  }

  serverProcess.on('error', (error) => {
    console.error('[CliCy] Failed to start server:', error);
    serverProcess = null;
  });

  return serverProcess;
}

/**
 * Sets up server lifecycle hooks with Cypress
 * @param {any} on Cypress on function
 */
function setupServerHooks(on) {
  on('before:browser:launch', () => {
    if (!serverProcess) {
      startServer();
    }
  });

  on('after:run', () => {
    if (serverProcess) {
      if (process.platform === 'win32') {
        const { spawn } = require('child_process');
        spawn('taskkill', ['/pid', serverProcess.pid.toString(), '/f', '/t'], {
          stdio: 'inherit',
          windowsHide: false,
        });
      } else {
        process.kill(-serverProcess.pid);
      }
      serverProcess = null;
    }
  });
}

/**
 * Copies the support file to the user's project
 * @param {string} projectRoot The root directory of the project
 * @param {boolean} force Whether to overwrite an existing file
 * @returns {string|null} The path to the copied file or null if failed
 */
function copySupportFile(projectRoot, force = false) {
  // Ensure the cypress/support directory exists
  const cypressSupportDir = path.join(projectRoot, 'cypress', 'support');
  if (!fs.existsSync(cypressSupportDir)) {
    try {
      fs.mkdirSync(cypressSupportDir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${cypressSupportDir}:`, error);
      return null;
    }
  }

  // Path to the support file in the user's project
  const targetFilePath = path.join(cypressSupportDir, 'e2e.ts');

  // Check if file already exists and force is not enabled
  if (fs.existsSync(targetFilePath) && !force) {
    console.log(`CliCy: Support file already exists at ${targetFilePath}`);
    return targetFilePath;
  }

  // Path to the support file in the package
  const sourceFilePath = path.join(__dirname, '..', 'cypress', 'support', 'e2e.ts');

  try {
    // Check if the source file exists
    if (!fs.existsSync(sourceFilePath)) {
      console.error(`CliCy: Support file not found at ${sourceFilePath}`);
      return null;
    }

    // Copy the file
    fs.copyFileSync(sourceFilePath, targetFilePath);
    console.log(`CliCy: Copied support file to ${targetFilePath}`);
    return targetFilePath;
  } catch (error) {
    console.error(`Error copying support file to ${targetFilePath}:`, error);
    return null;
  }
}

/**
 * Generates the appropriate live spec file based on project type
 * @param {string} projectRoot The root directory of the project
 * @param {boolean} force Whether to overwrite an existing file
 * @returns {string|null} The path to the generated file or null if failed
 */
function generateLiveSpec(projectRoot, force = false) {
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
      return null;
    }
  }

  const filePath = path.join(cypressE2eDir, fileName);

  // Check if file already exists and force is not enabled
  if (fs.existsSync(filePath) && !force) {
    console.log(`CliCy: Live spec file already exists at ${filePath}`);
    return filePath;
  }

  try {
    // Write the template to the file
    fs.writeFileSync(filePath, template);
    console.log(`CliCy: Generated live spec file at ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return null;
  }
}

/**
 * The main plugin function that sets up CliCy
 * @param {any} on Cypress 'on' function
 * @param {any} config Cypress config object
 * @returns {any} Modified config object
 */
function setupCliCy(on, config) {
  // Check if clicyCommand is enabled (default to true if not specified)
  const clicyEnabled = config.e2e?.clicyCommand !== false;

  // If clicyCommand is disabled, skip CliCy initialization
  if (!clicyEnabled) {
    return config;
  }

  // Generate the live spec file based on project type
  const projectRoot = process.cwd();
  generateLiveSpec(projectRoot);

  // Copy the support file if it doesn't exist
  copySupportFile(projectRoot);

  // Set the support file to clicy's support file if not already overridden
  if (!config.e2e?.supportFile) {
    config.e2e = config.e2e || {};
    config.e2e.supportFile = 'cypress/support/e2e.ts';
  }

  // Log a message when CliCy starts
  console.log("[CliCy] REPL enabled. Open 'live.cy.ts' to begin scripting interactively.");

  // Start the server immediately so it's ready before tests run
  startServer();

  // Register hooks to manage the server lifecycle
  setupServerHooks(on);

  // Return the updated config
  return config;
}

module.exports = setupCliCy;