#!/usr/bin/env node
// PostToolUse hook: runs Vitest scoped to the edited file's spec.
// Always exits 0 — output is informational, never blocking builds.
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

let raw = '';
process.stdin.on('data', chunk => (raw += chunk));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(raw || '{}');
    const filePath = data.tool_input?.file_path || data.tool_input?.path || '';

    // Skip non-TS files, specs, and node_modules
    if (!filePath.endsWith('.ts')) return done();
    if (filePath.includes('node_modules')) return done();
    if (filePath.endsWith('.spec.ts')) return done();

    const specPath = filePath.replace(/\.ts$/, '.spec.ts');

    if (!fs.existsSync(specPath)) {
      console.log(`[test-on-edit] No spec for ${path.basename(filePath)} — skipping.`);
      return done();
    }

    console.log(`\n[test-on-edit] Running: ${path.basename(specPath)}\n`);
    try {
      const out = execSync(
        `npx vitest run "${specPath}" --reporter=verbose`,
        { cwd: process.cwd(), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
      console.log(out);
    } catch (e) {
      if (e.stdout) console.log(e.stdout);
      if (e.stderr) console.log(e.stderr);
    }
  } catch {
    // Malformed hook input — ignore silently
  }
  done();
});

function done() { process.exit(0); }
