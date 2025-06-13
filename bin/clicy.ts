#!/usr/bin/env node
// bin/clicy.ts
// CLI entry point

import { spawn } from 'child_process';
import path from 'path';
import '../cli/repl';

// Start Cypress in a separate process when REPL starts
const cypressProcess = spawn('npx', ['cypress', 'open', '--e2e', '--browser', 'chrome'], {
  stdio: 'ignore',
  shell: true,
  detached: true
});

// Ensure Cypress process doesn't keep the Node.js process running
cypressProcess.unref();

console.log('🚀 CliCy - Cypress REPL started');
console.log('🔍 Cypress is running in a separate window. Look for it in your taskbar or desktop.');
console.log('📝 Type commands like: goto("https://example.com"), click("Login")');
console.log('💾 Type .code to export your commands to a file');
console.log('🔄 Type .reset to clear all commands and start fresh');
console.log('👋 Type .exit to quit');
console.log('\n💡 TIP: Each command you type will update the test file and Cypress will automatically re-run it.');
