// cli/repl.ts
// Entry point for the interactive CLI

import repl from 'repl';
import fs from 'fs';
import path from 'path';
import { writeCommandToFile, exportAllToCodeFile, readCommandsFromFile } from '../utils/fileWriter';
import { click, write, goto, closeBrowser } from '../commands/dsl';

// Initialize command history from the spec file if it exists
const commandHistory: string[] = [];

// Flag to prevent infinite loops when updating the file
let isUpdatingFromFileWatch = false;

// Path to the spec file
const specPath = path.join(process.cwd(), 'cypress', 'e2e', 'live.cy.ts');

/**
 * Updates the command history from the spec file
 */
function updateCommandHistoryFromFile() {
  // Set the flag to prevent infinite loops
  isUpdatingFromFileWatch = true;

  try {
    // Read the commands from the file
    const commands = readCommandsFromFile();

    // Clear the command history
    commandHistory.length = 0;

    // Add the commands to the command history
    commands.forEach(cmd => {
      commandHistory.push(cmd);
    });

    console.log(`\n🔄 Command history updated from file (${commands.length} commands)`);
  } catch (error) {
    console.error('Error updating command history from file:', error);
  } finally {
    // Reset the flag
    isUpdatingFromFileWatch = false;
  }
}

// Initialize command history from the spec file
updateCommandHistoryFromFile();

// Watch for changes to the spec file
fs.watch(path.dirname(specPath), (eventType, filename) => {
  // Only process changes to the spec file
  if (filename === path.basename(specPath) && !isUpdatingFromFileWatch) {
    console.log(`\n📄 Spec file changed (${eventType}), updating command history...`);
    updateCommandHistoryFromFile();
  }
});

// Variable to store the current prompt state
let promptState = {
  isPrompting: false,
  command: '',
  callback: null as any
};

const clicyRepl = repl.start({
  prompt: 'CliCy > ',
  eval: (cmd, _context, _filename, callback) => {
    const trimmed = cmd.trim();

    // If we're in a prompting state, handle the response
    if (promptState.isPrompting) {
      const url = trimmed.replace(/['"]/g, '');
      const gotoCmd = goto(url);

      if (gotoCmd) {
        commandHistory.push(gotoCmd);

        // Set the flag to prevent the file watcher from updating the command history
        isUpdatingFromFileWatch = true;

        // Write the command to the file
        writeCommandToFile(gotoCmd, commandHistory);

        // Reset the flag after a short delay to allow the file watcher to detect the change
        setTimeout(() => {
          isUpdatingFromFileWatch = false;
        }, 100);

        // Reset prompt state
        promptState.isPrompting = false;
        promptState.command = '';

        return callback(null, `✅ Command added: goto("${url}")`);
      } else {
        // Reset prompt state but indicate an error
        promptState.isPrompting = false;
        promptState.command = '';

        return callback(null, '⚠️ Invalid URL. Please try again with goto()');
      }
    }

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

        // Set the flag to prevent the file watcher from updating the command history
        isUpdatingFromFileWatch = true;

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

        // Reset the flag after a short delay to allow the file watcher to detect the change
        setTimeout(() => {
          isUpdatingFromFileWatch = false;
        }, 100);

        return callback(null, '🔄 All commands have been removed. Start with a fresh slate.');
      }

      // If we get here, it's an unknown special command
      return callback(null, `Invalid REPL keyword: ${trimmed}`);
    }

    try {
      const jsLine = mapCommand(trimmed);

      // Handle the special PROMPT_FOR_URL case
      if (jsLine === 'PROMPT_FOR_URL') {
        promptState.isPrompting = true;
        promptState.command = 'goto';
        promptState.callback = callback;

        return callback(null, 'Please enter the URL:');
      }

      if (jsLine) {
        commandHistory.push(jsLine);

        // Set the flag to prevent the file watcher from updating the command history
        isUpdatingFromFileWatch = true;

        // Write the command to the file
        writeCommandToFile(jsLine, commandHistory); // live test update with all commands

        // Reset the flag after a short delay to allow the file watcher to detect the change
        setTimeout(() => {
          isUpdatingFromFileWatch = false;
        }, 100);

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
      return goto('') || '';
    case 'closeBrowser': return closeBrowser();
    case 'goto': {
      // If no arguments provided, prompt for URL
      if (!args.trim()) {
        // This will be handled in the eval function
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

// Export the REPL for use as a module
export default clicyRepl;
