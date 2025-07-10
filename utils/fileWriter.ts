// @ts-nocheck
// Use CommonJS require for better compatibility
const fs = require('fs');
const path = require('path');

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
const historyPath = path.join(process.cwd(), 'clicy-history.json');

const commandsRegex = /it\([^{]*{([\s\S]*?)}\);/;

/**
 * Writes commands to the history file
 * @param {string[]} commands - Array of commands to write
 */
function writeCommandToHistoryFile(commands: string[]): void {
  try {
    // Create history file if it doesn't exist
    if (!fs.existsSync(historyPath)) {
      fs.writeFileSync(historyPath, JSON.stringify({ commands: [] }, null, 2));
    }

    // Write commands to history file
    fs.writeFileSync(historyPath, JSON.stringify({ commands }, null, 2));
    console.log(`${colors.green}Command history saved to ${historyPath}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error writing command history:${colors.reset}`, error);
  }
}

/**
 * Reads commands from the history file
 * @returns {string[]} Array of commands
 */
function readCommandsFromHistoryFile(): string[] {
  try {
    if (!fs.existsSync(historyPath)) {
      return [];
    }

    const content = fs.readFileSync(historyPath, 'utf8');
    const data = JSON.parse(content);
    return data.commands || [];
  } catch (error) {
    console.error(`${colors.red}Error reading command history:${colors.reset}`, error);
    return [];
  }
}

/**
 * Writes a command to the spec file
 * @param {string} cmd - Command to write
 * @param {string[]} allCommands - All commands to include
 */
function writeCommandToFile(cmd: string, allCommands: string[] = []): void {
  const commands = allCommands.length > 0 ? [...allCommands] : [cmd];

  const content = `
describe('Live Test', () => {
  it('runs REPL steps', () => {
    ${commands.join('\n    ')}
  });
});
`;
  fs.writeFileSync(specPath, content);

  // Also save to history file
  writeCommandToHistoryFile(commands);

  console.log(`\n${colors.cyan}Executing in Cypress: ${cmd}${colors.reset}`);
}

/**
 * Reads commands from the spec file
 * @returns {string[]} Array of commands
 */
function readCommandsFromFile(): string[] {
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
      .map((line: string) => line.trim())
      .filter((line: string) => line && !line.startsWith('//'));

    return commands;
  } catch (error) {
    console.error(`${colors.red}Error reading commands from file:${colors.reset}`, error);
    return [];
  }
}

/**
 * Exports all commands to a code file
 * @param {string[]} commands - Array of commands to export
 */
function exportAllToCodeFile(commands: string[]): void {
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

// Export all functions using CommonJS module.exports
// @ts-ignore
module.exports = {
  writeCommandToHistoryFile,
  readCommandsFromHistoryFile,
  writeCommandToFile,
  readCommandsFromFile,
  exportAllToCodeFile
};
