// cli/repl.ts
// Entry point for the interactive CLI

import repl from 'repl';
import { writeCommandToFile, exportAllToCodeFile } from '../utils/fileWriter';
import { click, write, goto, openBrowser, closeBrowser } from '../commands/dsl';

const commandHistory: string[] = [];

const clicyRepl = repl.start({
  prompt: 'CliCy > ',
  eval: (cmd, _context, _filename, callback) => {
    const trimmed = cmd.trim();

    if (trimmed === '.exit') process.exit(0);
    if (trimmed === '.code') {
      exportAllToCodeFile(commandHistory);
      return callback(null, '[+] Code exported!');
    }

    try {
      const jsLine = mapCommand(trimmed);
      if (jsLine) {
        commandHistory.push(jsLine);
        writeCommandToFile(jsLine); // live test update
        callback(null, '✅ Command added');
      } else {
        callback(null, '⚠️ Unknown command');
      }
    } catch (err) {
      callback(err);
    }
  }
});

function mapCommand(input: string): string {
  const match = input.match(/^(\w+)\((.*)\)$/);
  if (!match) return '';
  const [, cmd, args] = match;

  switch (cmd) {
    case 'openBrowser': return openBrowser();
    case 'closeBrowser': return closeBrowser();
    case 'goto': return goto(args.replace(/['"]/g, ''));
    case 'click': return click(args.replace(/['"]/g, ''));
    case 'write': {
      const [text, label] = args.split(',').map(x => x.trim().replace(/['"]/g, ''));
      return write(text, label);
    }
    default: return '';
  }
}

// Export the REPL for use as a module
export default clicyRepl;