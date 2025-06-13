import repl from 'repl';
import fs from 'fs';
import path from 'path';
import { writeCommandToFile, exportAllToCodeFile, readCommandsFromFile } from '../utils/fileWriter';
import { click, write, goto, closeBrowser } from '../commands/dsl';

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

    console.log(`\n\x1b[36mCommand history updated from file (${commands.length} commands)\x1b[0m`);
  } catch (error) {
    console.error('\x1b[31mError updating command history from file:\x1b[0m', error);
  } finally {
    isUpdatingFromFileWatch = false;
  }
}

updateCommandHistoryFromFile();

fs.watch(path.dirname(specPath), (eventType, filename) => {
  if (filename === path.basename(specPath) && !isUpdatingFromFileWatch) {
    console.log(`\n\x1b[36mSpec file changed (${eventType}), updating command history...\x1b[0m`);
    updateCommandHistoryFromFile();
  }
});

let promptState = {
  isPrompting: false,
  command: '',
  callback: null as any
};

const clicyRepl = repl.start({
  prompt: 'CliCy > ',
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

        return callback(null, `\x1b[32mCommand added: goto("${url}")\x1b[0m`);
      } else {
        promptState.isPrompting = false;
        promptState.command = '';

        return callback(null, '\x1b[31mInvalid URL. Please try again with goto()\x1b[0m');
      }
    }

    if (trimmed.startsWith('.')) {
      if (trimmed === '.exit') process.exit(0);
      if (trimmed === '.code') {
        exportAllToCodeFile(commandHistory);
        return callback(null, '\x1b[32m[+] Code exported!\x1b[0m');
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

        return callback(null, '\x1b[35mAll commands have been removed. Start with a fresh slate.\x1b[0m');
      }

      return callback(null, `\x1b[31mInvalid REPL keyword: ${trimmed}\x1b[0m`);
    }

    try {
      const jsLine = mapCommand(trimmed);

      if (jsLine === 'PROMPT_FOR_URL') {
        promptState.isPrompting = true;
        promptState.command = 'goto';
        promptState.callback = callback;

        return callback(null, '\x1b[33mPlease enter the URL:\x1b[0m');
      }

      if (jsLine) {
        commandHistory.push(jsLine);

        isUpdatingFromFileWatch = true;

        writeCommandToFile(jsLine, commandHistory);

        setTimeout(() => {
          isUpdatingFromFileWatch = false;
        }, 100);

        callback(null, '\x1b[32mCommand added\x1b[0m');
      } else {
        callback(null, '\x1b[31mUnknown command\x1b[0m');
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
    case 'click': return click(args.replace(/['"]/g, ''));
    case 'write': {
      const [text, label] = args.split(',').map(x => x.trim().replace(/['"]/g, ''));
      return write(text, label);
    }
    default: return '';
  }
}

export default clicyRepl;
