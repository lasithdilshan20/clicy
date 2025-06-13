import fs from 'fs';
import path from 'path';

const specPath = path.join(process.cwd(), 'cypress', 'e2e', 'live.cy.ts');
const exportPath = path.join(process.cwd(), 'generatedCode.cy.ts');

const commandsRegex = /it\([^{]*{([\s\S]*?)}\);/;

export function writeCommandToFile(cmd: string, allCommands: string[] = []) {
  const commands = allCommands.length > 0 ? [...allCommands] : [cmd];

  const content = `
describe('Live Test', () => {
  it('runs REPL steps', () => {
    ${commands.join('\n    ')}
  });
});
`;
  fs.writeFileSync(specPath, content);

  console.log(`\n\x1b[36mExecuting in Cypress: ${cmd}\x1b[0m`);
}

export function readCommandsFromFile(): string[] {
  try {
    if (!fs.existsSync(specPath)) {
      return [];
    }

    const content = fs.readFileSync(specPath, 'utf8');

    const match = content.match(commandsRegex);
    if (!match || !match[1]) {
      return [];
    }

    const commands = match[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'));

    return commands;
  } catch (error) {
    console.error('\x1b[31mError reading commands from file:\x1b[0m', error);
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
  console.log(`\x1b[32mCode exported to ${exportPath}\x1b[0m`);
}
