// utils/fileWriter.ts
// Handles spec file writing

import fs from 'fs';
import path from 'path';

const specPath = path.join(process.cwd(), 'cypress', 'e2e', 'live.cy.ts');
const exportPath = path.join(process.cwd(), 'generatedCode.cy.ts');

export function writeCommandToFile(cmd: string) {
  const content = `
describe('Live Test', () => {
  it('runs REPL steps', () => {
    ${cmd}
  });
});
`;
  fs.writeFileSync(specPath, content);
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