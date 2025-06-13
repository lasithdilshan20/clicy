#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
require('../cli/repl');

const cypressProcess = spawn('npx', ['cypress', 'open', '--e2e', '--browser', 'chrome'], {
  stdio: 'ignore',
  shell: true,
  detached: true
});

cypressProcess.unref();

console.log('\x1b[36mCliCy - Cypress REPL started\x1b[0m');
console.log('\x1b[34mCypress is running in a separate window. Look for it in your taskbar or desktop.\x1b[0m');
console.log('\x1b[33mType commands like: goto("https://example.com"), click("Login")\x1b[0m');
console.log('\x1b[32mType .code to export your commands to a file\x1b[0m');
console.log('\x1b[35mType .reset to clear all commands and start fresh\x1b[0m');
console.log('\x1b[31mType .exit to quit\x1b[0m');
console.log('\n\x1b[33mTIP: Each command you type will update the test file and Cypress will automatically re-run it.\x1b[0m');
