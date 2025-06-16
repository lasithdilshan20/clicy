import repl from 'repl';
import fs from 'fs';
import path from 'path';
import { writeCommandToFile, exportAllToCodeFile, readCommandsFromFile } from '../utils/fileWriter';
import { click, write, goto, closeBrowser, get, contains } from '../commands/dsl';

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

const commandHistory: string[] = [];

let isUpdatingFromFileWatch = false;

const specPath = path.join(process.cwd(), 'cypress', 'e2e', 'live.cy.ts');

function updateCommandHistoryFromFile() {
  isUpdatingFromFileWatch = true;

  try {
    const commands = readCommandsFromFile();

    commandHistory.length = 0;

    commands.forEach(cmd => {
      commandHistory.push(cmd);
    });

    console.log(`\n${colors.cyan}Command history updated from file (${commands.length} commands)${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error updating command history from file:${colors.reset}`, error);
  } finally {
    isUpdatingFromFileWatch = false;
  }
}

updateCommandHistoryFromFile();

fs.watch(path.dirname(specPath), (eventType, filename) => {
  if (filename === path.basename(specPath) && !isUpdatingFromFileWatch) {
    console.log(`\n${colors.cyan}Spec file changed (${eventType}), updating command history...${colors.reset}`);
    updateCommandHistoryFromFile();
  }
});

let promptState = {
  isPrompting: false,
  command: '',
  callback: null as any
};

const clicyRepl = repl.start({
  prompt: `${colors.cyan}CliCy >${colors.reset} `,
  eval: (cmd, _context, _filename, callback) => {
    const trimmed = cmd.trim();

    if (promptState.isPrompting) {
      const url = trimmed.replace(/['"]/g, '');
      const gotoCmd = goto(url);

      if (gotoCmd) {
        commandHistory.push(gotoCmd);

        isUpdatingFromFileWatch = true;

        writeCommandToFile(gotoCmd, commandHistory);

        setTimeout(() => {
          isUpdatingFromFileWatch = false;
        }, 100);

        promptState.isPrompting = false;
        promptState.command = '';

        return callback(null, `${colors.green}Command added: goto("${url}")${colors.reset}`);
      } else {
        promptState.isPrompting = false;
        promptState.command = '';

        return callback(null, `${colors.red}Invalid URL. Please try again with goto()${colors.reset}`);
      }
    }

    if (trimmed.startsWith('.')) {
      if (trimmed === '.exit') process.exit(0);
      if (trimmed === '.code') {
        exportAllToCodeFile(commandHistory);
        return callback(null, `${colors.green}[+] Code exported!${colors.reset}`);
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

        return callback(null, `${colors.magenta}All commands have been removed. Start with a fresh slate.${colors.reset}`);
      }

      return callback(null, `${colors.red}Invalid REPL keyword: ${trimmed}${colors.reset}`);
    }

    try {
      const jsLine = mapCommand(trimmed);

      if (jsLine === 'PROMPT_FOR_URL') {
        promptState.isPrompting = true;
        promptState.command = 'goto';
        promptState.callback = callback;

        return callback(null, `${colors.yellow}Please enter the URL:${colors.reset}`);
      }

      if (jsLine) {
        commandHistory.push(jsLine);

        isUpdatingFromFileWatch = true;

        writeCommandToFile(jsLine, commandHistory);

        setTimeout(() => {
          isUpdatingFromFileWatch = false;
        }, 100);

        callback(null, `${colors.green}Command added${colors.reset}`);
      } else {
        callback(null, `${colors.red}Unknown command${colors.reset}`);
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
      return goto('') || '';
    case 'closeBrowser': return closeBrowser();
    case 'goto': {
      if (!args.trim()) {
        return 'PROMPT_FOR_URL';
      }
      return goto(args.replace(/['"]/g, '')) || '';
    }
    case 'click': {
      // Check if the argument includes a selector type
      if (args.includes(',')) {
        const [selector, selectorType] = args.split(',').map(x => x.trim().replace(/['"]/g, ''));
        return click(selector, selectorType as 'contains' | 'get');
      }
      return click(args.replace(/['"]/g, ''));
    }
    case 'write': {
      // Check if the argument includes a selector type
      if (args.split(',').length > 2) {
        const [text, selector, selectorType] = args.split(',').map(x => x.trim().replace(/['"]/g, ''));
        return write(text, selector, selectorType as 'contains' | 'get');
      }
      const [text, selector] = args.split(',').map(x => x.trim().replace(/['"]/g, ''));
      return write(text, selector);
    }
    case 'get': return get(args.replace(/['"]/g, ''));
    case 'contains': return contains(args.replace(/['"]/g, ''));
    default: return '';
  }
}

export default clicyRepl;
