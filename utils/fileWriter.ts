import fs from 'fs';
import path from 'path';

// Color constants for console output
const colors = {
  cyan: '\u001b[36m',
  blue: '\u001b[34m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  red: '\u001b[31m',
  magenta: '\u001b[35m',
  reset: '\u001b[0m'
};

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

  console.log(`\n${colors.cyan}Executing in Cypress: ${cmd}${colors.reset}`);
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
    console.error(`${colors.red}Error reading commands from file:${colors.reset}`, error);
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
  console.log(`${colors.green}Code exported to ${exportPath}${colors.reset}`);
}
