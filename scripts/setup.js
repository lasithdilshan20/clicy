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
   
  });
});
`;

  // JavaScript template for live.cy.js
  const jsTemplate = `
describe('Live CLI Commands', () => {
  it('executes REPL steps', () => {
    
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

// Function to update the Cypress configuration file
function updateCypressConfig(projectRoot) {
  const configPath = path.join(projectRoot, 'cypress.config.js');
  const tsConfigPath = path.join(projectRoot, 'cypress.config.ts');

  if (fs.existsSync(tsConfigPath)) {
    console.log(`CliCy: Found Cypress TypeScript config at ${tsConfigPath}`);
    try {
      let configContent = fs.readFileSync(tsConfigPath, 'utf8');

      // Check if the config already imports clicy
      if (!configContent.includes('clicy')) {
        // Add import for clicy plugin
        if (configContent.includes('import')) {
          // Add after the last import
          configContent = configContent.replace(
            /(import.*?;\n)(?!import)/s,
            '$1import clicyPlugin from \'clicy/plugin\';\n'
          );
        } else {
          // Add at the beginning of the file
          configContent = `import clicyPlugin from 'clicy/plugin';\n${configContent}`;
        }

        // Update setupNodeEvents function
        if (configContent.includes('setupNodeEvents')) {
          // Replace existing setupNodeEvents function
          configContent = configContent.replace(
            /setupNodeEvents\s*\(\s*on\s*,\s*config\s*\)\s*{[^}]*}/s,
            `setupNodeEvents(on, config) {
      // Apply CliCy plugin
      config = clicyPlugin(on, config);
      return config;
    }`
          );
        } else if (configContent.includes('e2e:')) {
          // Add setupNodeEvents to e2e config
          configContent = configContent.replace(
            /e2e:\s*{/,
            `e2e: {
    setupNodeEvents(on, config) {
      // Apply CliCy plugin
      config = clicyPlugin(on, config);
      return config;
    },`
          );
        }

        fs.writeFileSync(tsConfigPath, configContent);
        console.log(`CliCy: Updated Cypress TypeScript config to use CliCy plugin`);
      } else {
        console.log(`CliCy: Cypress config already includes CliCy plugin`);
      }
    } catch (error) {
      console.error(`CliCy: Error updating Cypress TypeScript config:`, error);
    }

    return true;
  } else if (fs.existsSync(configPath)) {
    console.log(`CliCy: Found Cypress JavaScript config at ${configPath}`);
    try {
      let configContent = fs.readFileSync(configPath, 'utf8');

      // Check if the config already imports clicy
      if (!configContent.includes('clicy')) {
        // Add require for clicy plugin
        if (configContent.includes('require')) {
          // Add after the last require
          configContent = configContent.replace(
            /(const.*?require.*?;\n)(?!const)/s,
            '$1const clicyPlugin = require(\'clicy/plugin\');\n'
          );
        } else {
          // Add at the beginning of the file
          configContent = `const clicyPlugin = require('clicy/plugin');\n${configContent}`;
        }

        // Update setupNodeEvents function
        if (configContent.includes('setupNodeEvents')) {
          // Replace existing setupNodeEvents function
          configContent = configContent.replace(
            /setupNodeEvents\s*\(\s*on\s*,\s*config\s*\)\s*{[^}]*}/s,
            `setupNodeEvents(on, config) {
      // Apply CliCy plugin
      config = clicyPlugin(on, config);
      return config;
    }`
          );
        } else if (configContent.includes('e2e:')) {
          // Add setupNodeEvents to e2e config
          configContent = configContent.replace(
            /e2e:\s*{/,
            `e2e: {
    setupNodeEvents(on, config) {
      // Apply CliCy plugin
      config = clicyPlugin(on, config);
      return config;
    },`
          );
        }

        fs.writeFileSync(configPath, configContent);
        console.log(`CliCy: Updated Cypress JavaScript config to use CliCy plugin`);
      } else {
        console.log(`CliCy: Cypress config already includes CliCy plugin`);
      }
    } catch (error) {
      console.error(`CliCy: Error updating Cypress JavaScript config:`, error);
    }

    return true;
  } else {
    console.log(`CliCy: No Cypress config file found. Creating a default one...`);

    // Determine if the project uses TypeScript
    const isTS = isTypeScriptProject(projectRoot);

    // Create a default config file
    const configFileName = isTS ? 'cypress.config.ts' : 'cypress.config.js';
    const configFilePath = path.join(projectRoot, configFileName);

    const configTemplate = isTS 
      ? `import { defineConfig } from 'cypress';
import clicyPlugin from 'clicy/plugin';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Apply CliCy plugin
      config = clicyPlugin(on, config);
      return config;
    },
    clicyCommand: true,
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
  },
});`
      : `const { defineConfig } = require('cypress');
const clicyPlugin = require('clicy/plugin');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Apply CliCy plugin
      config = clicyPlugin(on, config);
      return config;
    },
    clicyCommand: true,
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
  },
});`;

    try {
      fs.writeFileSync(configFilePath, configTemplate);
      console.log(`CliCy: Created default Cypress config at ${configFilePath}`);
      return true;
    } catch (error) {
      console.error(`CliCy: Error creating default Cypress config:`, error);
      return false;
    }
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

    // Update or create the Cypress configuration file
    updateCypressConfig(projectRoot);

    console.log('CliCy: Setup completed successfully');
    console.log('CliCy: You can now run "npx cypress open" to start using CliCy');
  } catch (error) {
    console.error('CliCy: Setup failed:', error);
    process.exit(1);
  }
}

// Run the main function
main();
