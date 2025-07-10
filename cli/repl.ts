import repl from 'repl';
import fs from 'fs';
import path from 'path';
// Use CommonJS require for fileWriter
const { writeCommandToFile, exportAllToCodeFile, readCommandsFromFile } = require('../utils/fileWriter');
import * as dslCommands from '../commands/dsl';

// Enhanced color constants for futuristic UI
const colors = {
  // Base colors
  cyan: '\u001b[36m',
  blue: '\u001b[34m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  red: '\u001b[31m',
  magenta: '\u001b[35m',
  reset: '\u001b[0m',

  // Bright variants
  brightCyan: '\u001b[96m',
  brightBlue: '\u001b[94m',
  brightGreen: '\u001b[92m',
  brightYellow: '\u001b[93m',
  brightRed: '\u001b[91m',
  brightMagenta: '\u001b[95m',

  // Background colors
  bgBlack: '\u001b[40m',
  bgBlue: '\u001b[44m',
  bgCyan: '\u001b[46m',

  // Text styles
  bold: '\u001b[1m',
  dim: '\u001b[2m',
  italic: '\u001b[3m',
  underline: '\u001b[4m'
};

// ASCII art banner for futuristic look
const banner = `
${colors.brightCyan}╔══════════════════════════════════════════════════════════════╗
║ ${colors.brightYellow}  ██████╗██╗     ██╗ ██████╗██╗   ██╗${colors.brightCyan}                      ║
║ ${colors.brightYellow} ██╔════╝██║     ██║██╔════╝╚██╗ ██╔╝${colors.brightCyan}                      ║
║ ${colors.brightYellow} ██║     ██║     ██║██║      ╚████╔╝${colors.brightCyan}                       ║
║ ${colors.brightYellow} ██║     ██║     ██║██║       ╚██╔╝${colors.brightCyan}                        ║
║ ${colors.brightYellow} ╚██████╗███████╗██║╚██████╗   ██║${colors.brightCyan}                         ║
║ ${colors.brightYellow}  ╚═════╝╚══════╝╚═╝ ╚═════╝   ╚═╝${colors.brightCyan}                         ║
║                                                              ║
║ ${colors.brightGreen}Cypress REPL for Fast Command Authoring${colors.brightCyan}                     ║
╚══════════════════════════════════════════════════════════════╝${colors.reset}
`;

const commandHistory: string[] = [];

let isUpdatingFromFileWatch = false;

const specPath = path.join(process.cwd(), 'cypress', 'e2e', 'live.cy.ts');

function updateCommandHistoryFromFile() {
  isUpdatingFromFileWatch = true;

  try {
    const commands = readCommandsFromFile();

    commandHistory.length = 0;

    commands.forEach((cmd: string) => {
      commandHistory.push(cmd);
    });

    printSeparator('History Updated');
    console.log(`${colors.brightGreen}✓ ${colors.green}Command history loaded: ${colors.brightYellow}${commands.length} ${colors.green}commands${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error updating command history from file:${colors.reset}`, error);
  } finally {
    isUpdatingFromFileWatch = false;
  }
}

// Display welcome banner
console.log(banner);

// Helper function to create styled separators
function printSeparator(message = '') {
  const lineLength = 60;
  const msgLength = message.length;

  if (msgLength === 0) {
    console.log(`${colors.dim}${'─'.repeat(lineLength)}${colors.reset}`);
    return;
  }

  const sideLength = Math.floor((lineLength - msgLength - 2) / 2);
  const leftSide = '─'.repeat(sideLength);
  const rightSide = '─'.repeat(lineLength - sideLength - msgLength - 2);
  console.log(`${colors.dim}${leftSide} ${colors.reset}${colors.brightCyan}${message}${colors.reset} ${colors.dim}${rightSide}${colors.reset}`);
}

// Print available commands
console.log(`${colors.brightGreen}Available Commands:${colors.reset}`);
console.log(`${colors.yellow}• ${colors.brightYellow}goto(url)${colors.reset} - Navigate to a URL`);
console.log(`${colors.yellow}• ${colors.brightYellow}click(selector)${colors.reset} - Click on an element`);
console.log(`${colors.yellow}• ${colors.brightYellow}write(text, selector)${colors.reset} - Type into an input field`);
console.log(`${colors.yellow}• ${colors.brightYellow}get(selector)${colors.reset} - Get an element`);
console.log(`${colors.yellow}• ${colors.brightYellow}contains(text)${colors.reset} - Find element containing text`);

printSeparator('REPL Commands');
console.log(`${colors.yellow}• ${colors.brightYellow}.exit${colors.reset} - Exit the REPL`);
console.log(`${colors.yellow}• ${colors.brightYellow}.code${colors.reset} - Export commands to code file`);
console.log(`${colors.yellow}• ${colors.brightYellow}.reset${colors.reset} - Clear all commands`);
printSeparator();

updateCommandHistoryFromFile();

fs.watch(path.dirname(specPath), (eventType, filename) => {
  if (filename === path.basename(specPath) && !isUpdatingFromFileWatch) {
    printSeparator('File Changed');
    console.log(`${colors.brightBlue}⟳ ${colors.blue}Spec file changed (${colors.brightCyan}${eventType}${colors.blue}), updating history...${colors.reset}`);
    // Display welcome banner
console.log(banner);

// Helper function to create styled separators
function printSeparator(message = '') {
  const lineLength = 60;
  const msgLength = message.length;

  if (msgLength === 0) {
    console.log(`${colors.dim}${'─'.repeat(lineLength)}${colors.reset}`);
    return;
  }

  const sideLength = Math.floor((lineLength - msgLength - 2) / 2);
  const leftSide = '─'.repeat(sideLength);
  const rightSide = '─'.repeat(lineLength - sideLength - msgLength - 2);
  console.log(`${colors.dim}${leftSide} ${colors.reset}${colors.brightCyan}${message}${colors.reset} ${colors.dim}${rightSide}${colors.reset}`);
}

// Print available commands
console.log(`${colors.brightGreen}Available Commands:${colors.reset}`);
console.log(`${colors.yellow}• ${colors.brightYellow}goto(url)${colors.reset} - Navigate to a URL`);
console.log(`${colors.yellow}• ${colors.brightYellow}click(selector)${colors.reset} - Click on an element`);
console.log(`${colors.yellow}• ${colors.brightYellow}write(text, selector)${colors.reset} - Type into an input field`);
console.log(`${colors.yellow}• ${colors.brightYellow}get(selector)${colors.reset} - Get an element`);
console.log(`${colors.yellow}• ${colors.brightYellow}contains(text)${colors.reset} - Find element containing text`);

printSeparator('REPL Commands');
console.log(`${colors.yellow}• ${colors.brightYellow}.exit${colors.reset} - Exit the REPL`);
console.log(`${colors.yellow}• ${colors.brightYellow}.code${colors.reset} - Export commands to code file`);
console.log(`${colors.yellow}• ${colors.brightYellow}.reset${colors.reset} - Clear all commands`);
printSeparator();

updateCommandHistoryFromFile();
  }
});

let promptState = {
  isPrompting: false,
  command: '',
  callback: null as any
};

const clicyRepl = repl.start({
  prompt: `${colors.bgBlack}${colors.brightCyan}${colors.bold}CliCy${colors.reset}${colors.brightBlue} ⟫ ${colors.reset} `,
  eval: (cmd, _context, _filename, callback) => {
    const trimmed = cmd.trim();

    if (promptState.isPrompting) {
      const url = trimmed.replace(/['"]/g, '');
      const gotoCmd = dslCommands.goto(url);

      if (gotoCmd) {
        commandHistory.push(gotoCmd);

        isUpdatingFromFileWatch = true;

        writeCommandToFile(gotoCmd, commandHistory);

        setTimeout(() => {
          isUpdatingFromFileWatch = false;
        }, 100);

        promptState.isPrompting = false;
        promptState.command = '';

        return callback(null, `${colors.brightGreen}✓ ${colors.green}Command added: ${colors.brightYellow}goto("${url}")${colors.reset}`);
      } else {
        promptState.isPrompting = false;
        promptState.command = '';

        return callback(null, `${colors.brightRed}✗ ${colors.red}Invalid URL. Please try again with ${colors.brightYellow}goto()${colors.reset}`);
      }
    }

    if (trimmed.startsWith('.')) {
      if (trimmed === '.exit') process.exit(0);
      if (trimmed === '.code') {
        exportAllToCodeFile(commandHistory);
        printSeparator('Export Complete');
        return callback(null, `${colors.brightGreen}✓ ${colors.green}Code successfully exported to file!${colors.reset}`);
      }
      if (trimmed === '.reset') {
        commandHistory.length = 0;

        isUpdatingFromFileWatch = true;

        const resetTest = `
describe('Live Test', () => {
  it('waiting for commands...', () => {
    cy.visit('about:blank');
  });
});
`;
        fs.writeFileSync(path.join(process.cwd(), 'cypress', 'e2e', 'live.cy.ts'), resetTest);

        setTimeout(() => {
          isUpdatingFromFileWatch = false;
        }, 100);

        printSeparator('Reset Complete');
        return callback(null, `${colors.brightMagenta}♻ ${colors.magenta}All commands have been removed. Start with a fresh slate.${colors.reset}`);
      }

      return callback(null, `${colors.brightRed}✗ ${colors.red}Invalid REPL keyword: ${colors.brightYellow}${trimmed}${colors.reset}`);
    }

    try {
      const jsLine = mapCommand(trimmed);

      if (jsLine === 'PROMPT_FOR_URL') {
        promptState.isPrompting = true;
        promptState.command = 'goto';
        promptState.callback = callback;

        return callback(null, `${colors.brightYellow}⟫ ${colors.yellow}Please enter the URL:${colors.reset}`);
      }

      if (jsLine) {
        commandHistory.push(jsLine);

        isUpdatingFromFileWatch = true;

        writeCommandToFile(jsLine, commandHistory);

        setTimeout(() => {
          isUpdatingFromFileWatch = false;
        }, 100);

        callback(null, `${colors.brightGreen}✓ ${colors.green}Command added successfully${colors.reset}`);
      } else {
        callback(null, `${colors.brightRed}✗ ${colors.red}Unknown command. Type a valid command or use ${colors.brightYellow}.exit${colors.red} to quit.${colors.reset}`);
      }
    } catch (err) {
      callback(err as Error, undefined);
    }
  }
});

function mapCommand(input: string): string {
  const match = input.match(/^(\w+)\((.*)\)$/);
  if (!match) return '';
  const [, cmd, args] = match;

  switch (cmd) {
    case 'openBrowser': 
      return dslCommands.goto('') || '';
    case 'closeBrowser': return dslCommands.closeBrowser();
    case 'goto': {
      if (!args.trim()) {
        return 'PROMPT_FOR_URL';
      }
      return dslCommands.goto(args.replace(/['"]/g, '')) || '';
    }
    case 'click': {
      // Check if the argument includes a selector type
      if (args.includes(',')) {
        const [selector, selectorType] = args.split(',').map(x => x.trim().replace(/['"]/g, ''));
        return dslCommands.click(selector, selectorType as 'contains' | 'get');
      }
      return dslCommands.click(args.replace(/['"]/g, ''));
    }
    case 'write': {
      // Check if the argument includes a selector type
      if (args.split(',').length > 2) {
        const [text, selector, selectorType] = args.split(',').map(x => x.trim().replace(/['"]/g, ''));
        return dslCommands.write(text, selector, selectorType as 'contains' | 'get');
      }
      const [text, selector] = args.split(',').map(x => x.trim().replace(/['"]/g, ''));
      return dslCommands.write(text, selector);
    }
    case 'get': return dslCommands.get(args.replace(/['"]/g, ''));
    case 'contains': return dslCommands.contains(args.replace(/['"]/g, ''));
    default: return '';
  }
}

// Export the REPL instance as default
export default clicyRepl;

// Export all DSL commands for programmatic usage
export const commands = dslCommands;
