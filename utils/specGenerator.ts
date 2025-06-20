import fs from 'fs';
import path from 'path';

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

/**
 * Detects whether the project is using TypeScript or JavaScript
 * @param projectRoot The root directory of the project
 * @returns boolean True if the project is using TypeScript
 */
export function isTypeScriptProject(projectRoot: string): boolean {
  // Check for tsconfig.json
  if (fs.existsSync(path.join(projectRoot, 'tsconfig.json'))) {
    return true;
  }

  // Check for typescript dependency in package.json
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const hasTsDep = packageJson.dependencies?.typescript || packageJson.devDependencies?.typescript;
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
 * @returns boolean True if any .ts files are found
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
 * Generates the appropriate live spec file based on project type
 * @param projectRoot The root directory of the project
 * @param force Whether to overwrite an existing file
 * @returns string The path to the generated file
 */
export function generateLiveSpec(projectRoot: string, force: boolean = false): string {
  const isTS = isTypeScriptProject(projectRoot);
  const fileName = isTS ? 'live.cy.ts' : 'live.cy.js';
  const template = isTS ? tsTemplate : jsTemplate;

  // Ensure the cypress/e2e directory exists
  const cypressE2eDir = path.join(projectRoot, 'cypress', 'e2e');
  if (!fs.existsSync(cypressE2eDir)) {
    fs.mkdirSync(cypressE2eDir, { recursive: true });
  }

  const filePath = path.join(cypressE2eDir, fileName);

  // Check if file already exists and force is not enabled
  if (fs.existsSync(filePath) && !force) {
    return filePath;
  }

  // Write the template to the file
  fs.writeFileSync(filePath, template);

  return filePath;
}
