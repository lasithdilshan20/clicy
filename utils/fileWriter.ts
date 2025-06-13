// utils/fileWriter.ts
// Handles spec file writing and reading

import fs from 'fs';
import path from 'path';

const specPath = path.join(process.cwd(), 'cypress', 'e2e', 'live.cy.ts');
const exportPath = path.join(process.cwd(), 'generatedCode.cy.ts');

// Regular expression to extract commands from the spec file
const commandsRegex = /it\([^{]*{([\s\S]*?)}\);/;

export function writeCommandToFile(cmd: string, allCommands: string[] = []) {
  // Use the provided commands array if available, otherwise use just the current command
  const commands = allCommands.length > 0 ? [...allCommands] : [cmd];

  const content = `
describe('Live Test', () => {
  it('runs REPL steps', () => {
    ${commands.join('\n    ')}
  });
});
`;
  fs.writeFileSync(specPath, content);

  // Log that the command is being executed
  console.log(`\n🔄 Executing in Cypress: ${cmd}`);
}

/**
 * Reads the spec file and extracts the commands
 * @returns An array of commands extracted from the spec file
 */
export function readCommandsFromFile(): string[] {
  try {
    // Check if the file exists
    if (!fs.existsSync(specPath)) {
      return [];
    }

    // Read the file
    const content = fs.readFileSync(specPath, 'utf8');

    // Extract the commands using the regex
    const match = content.match(commandsRegex);
    if (!match || !match[1]) {
      return [];
    }

    // Split the commands by line, trim whitespace, and filter out empty lines and comments
    const commands = match[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'));

    return commands;
  } catch (error) {
    console.error('Error reading commands from file:', error);
    return [];
  }
}

export function exportAllToCodeFile(commands: string[]) {
  const code = `
describe('Generated from CLICY', () => {
  it('runs all steps', () => {
    ${commands.join('\n    ')}
  });
});
`;
  fs.writeFileSync(exportPath, code);
  console.log(`Code exported to ${exportPath}`);
}
