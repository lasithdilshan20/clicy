// cli/repl.ts
// Entry point for the interactive CLI

import repl from 'repl';
import fs from 'fs';
import path from 'path';
import { writeCommandToFile, exportAllToCodeFile } from '../utils/fileWriter';
import { click, write, goto, closeBrowser } from '../commands/dsl';

const commandHistory: string[] = [];

const clicyRepl = repl.start({
  prompt: 'CliCy > ',
  eval: (cmd, _context, _filename, callback) => {
    const trimmed = cmd.trim();

    // Handle special commands that start with a dot
    if (trimmed.startsWith('.')) {
      if (trimmed === '.exit') process.exit(0);
      if (trimmed === '.code') {
        exportAllToCodeFile(commandHistory);
        return callback(null, '[+] Code exported!');
      }
      if (trimmed === '.reset') {
        // Clear the command history
        commandHistory.length = 0;

        // Write an empty test to the file with a basic command to ensure Cypress has something to execute
        const resetTest = `
describe('Live Test', () => {
  it('waiting for commands...', () => {
    // All commands have been reset
    // Add new commands by typing them in the REPL
    cy.visit('about:blank'); // Basic command to ensure Cypress has something to execute
  });
});
`;
        fs.writeFileSync(path.join(process.cwd(), 'cypress', 'e2e', 'live.cy.ts'), resetTest);

        return callback(null, '🔄 All commands have been removed. Start with a fresh slate.');
      }

      // If we get here, it's an unknown special command
      return callback(null, `Invalid REPL keyword: ${trimmed}`);
    }

    try {
      const jsLine = mapCommand(trimmed);
      if (jsLine) {
        commandHistory.push(jsLine);
        writeCommandToFile(jsLine, commandHistory); // live test update with all commands
        callback(null, '✅ Command added');
      } else {
        callback(null, '⚠️ Unknown command');
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
      // Redirect openBrowser() to goto() with empty URL for backward compatibility
      return goto('');
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
module.exports = clicyRepl;
