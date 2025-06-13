#!/usr/bin/env node
// bin/clicy.ts
// CLI entry point

import { spawn } from 'child_process';
import path from 'path';
import '../cli/repl';

// Start Cypress in the background when REPL starts
const cypressProcess = spawn('npx', ['cypress', 'open', '--spec', 'cypress/e2e/live.cy.ts'], {
  detached: true,
  stdio: 'ignore',
  shell: true
});

// Ensure Cypress process doesn't keep the Node.js process running
cypressProcess.unref();

console.log('🚀 CliCy - Cypress REPL started');
console.log('📝 Type commands like: openBrowser(), goto("https://example.com")');
console.log('💾 Type .code to export your commands to a file');
console.log('👋 Type .exit to quit');