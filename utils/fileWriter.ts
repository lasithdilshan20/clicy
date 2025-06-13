// utils/fileWriter.ts
// Handles spec file writing

import fs from 'fs';
import path from 'path';

const specPath = path.join(process.cwd(), 'cypress', 'e2e', 'live.cy.ts');
const exportPath = path.join(process.cwd(), 'generatedCode.cy.ts');

export function writeCommandToFile(cmd: string, allCommands: string[] = []) {
  // Create a new array with all previous commands (excluding the current one)
  // and then add the current command at the end
  const commands = [];

  // Add all previous commands (excluding the current one)
  if (allCommands.length > 1) {
    // Remove the last command (which is the current one) from the array
    commands.push(...allCommands.slice(0, -1));
  }

  // Add the current command
  commands.push(cmd);

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
