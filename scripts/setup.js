#!/usr/bin/env node

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

  return false;
}

/**
 * Copies the support file to the user's project
 * @param {string} projectRoot The root directory of the project
 * @param {boolean} force Whether to overwrite an existing file
 * @returns {string} The path to the copied file
 */
function copySupportFile(projectRoot, force = false) {
  const isTS = isTypeScriptProject(projectRoot);

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
 * @returns {string} The path to the generated file
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

// Main function
function main() {
  console.log('CliCy: Setting up...');

  try {
    // Determine the project root
    // When running as a postinstall script, we need to go up to the parent directory
    // if we're installed as a dependency
    let projectRoot = process.cwd();

    // Check if we're in a node_modules directory
    if (projectRoot.includes('node_modules')) {
      // Go up to the project root (2 levels up from node_modules/clicy)
      projectRoot = path.resolve(projectRoot, '..', '..');
    }

    console.log(`CliCy: Project root detected as ${projectRoot}`);

    // Generate the live spec file
    generateLiveSpec(projectRoot);

    // Copy the support file
    copySupportFile(projectRoot);

    // Check if we need to update the Cypress config file
    const configPath = path.join(projectRoot, 'cypress.config.js');
    const tsConfigPath = path.join(projectRoot, 'cypress.config.ts');

    if (fs.existsSync(tsConfigPath)) {
      console.log(`CliCy: Found Cypress TypeScript config at ${tsConfigPath}`);
      console.log(`CliCy: To enable the REPL, add 'clicyCommand: true' to your e2e configuration.`);
      console.log(`CliCy: Make sure to import the support file in your Cypress configuration:`);
      console.log(`CliCy: import './cypress/support/e2e.ts';`);
    } else if (fs.existsSync(configPath)) {
      console.log(`CliCy: Found Cypress JavaScript config at ${configPath}`);
      console.log(`CliCy: To enable the REPL, add 'clicyCommand: true' to your e2e configuration.`);
      console.log(`CliCy: Make sure to import the support file in your Cypress configuration:`);
      console.log(`CliCy: require('./cypress/support/e2e.ts');`);
    } else {
      console.log(`CliCy: No Cypress config file found. Please create one and add 'clicyCommand: true' to enable the REPL.`);
      console.log(`CliCy: Make sure to import the support file in your Cypress configuration.`);
    }

    console.log('CliCy: Setup completed successfully');
  } catch (error) {
    console.error('CliCy: Setup failed:', error);
    process.exit(1);
  }
}

// Run the main function
main();
