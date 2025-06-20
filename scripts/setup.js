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
 * Generates the appropriate live spec file based on project type
 * @param {string} projectRoot The root directory of the project
 * @param {boolean} force Whether to overwrite an existing file
 * @returns {string} The path to the generated file
 */
function generateLiveSpec(projectRoot, force = false) {
  // TypeScript template for live.cy.ts
  const tsTemplate = `
describe('Live Test', () => {
  it('runs REPL steps', () => {
    // Commands will be injected here by CliCy
  });
});
`;

  // JavaScript template for live.cy.js
  const jsTemplate = `
describe('Live Test', () => {
  it('runs REPL steps', () => {
    // Commands will be injected here by CliCy
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
    
    console.log('CliCy: Setup completed successfully');
  } catch (error) {
    console.error('CliCy: Setup failed:', error);
    process.exit(1);
  }
}

// Run the main function
main();