#!/usr/bin/env node

import { spawn } from 'child_process';
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

require('../cli/repl');

const cypressProcess = spawn('npx', ['cypress', 'open', '--e2e', '--browser', 'chrome'], {
  stdio: 'ignore',
  shell: true,
  detached: true
});

cypressProcess.unref();

console.log(`${colors.cyan}CliCy - Cypress REPL started${colors.reset}`);
console.log(`${colors.blue}Cypress is running in a separate window. Look for it in your taskbar or desktop.${colors.reset}`);
console.log(`${colors.yellow}Type commands like: goto("https://example.com"), click("Login")${colors.reset}`);
console.log(`${colors.green}Type .code to export your commands to a file${colors.reset}`);
console.log(`${colors.magenta}Type .reset to clear all commands and start fresh${colors.reset}`);
console.log(`${colors.red}Type .exit to quit${colors.reset}`);
console.log(`\n${colors.yellow}TIP: Each command you type will update the test file and Cypress will automatically re-run it.${colors.reset}`);
